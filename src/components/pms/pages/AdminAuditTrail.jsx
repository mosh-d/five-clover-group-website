"use client";
"use no memo";

// Carried over from the branch PMS's admin_pages/AdminAuditTrail.jsx (2026-09-28).
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "@/lib/pms/router";
import { IoDocumentTextOutline } from "react-icons/io5";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import Button from "@/components/pms/Button";
import PageHeading from "@/components/pms/PageHeading";
import StatusBadge from "@/components/pms/StatusBadge";
import { table, field } from "@/components/pms/ui";
import { accessDenial } from "@/components/pms/pmsNavItems";
import { fetchAuditActionLabels, fetchAuditLogHistory, fetchAuditStaffOptions } from "@/lib/pms/api/audit-log-api";
import { fetchBranches, fetchHqAuditLogs, fetchHqAuditStaffOptions, fetchHqAuditActionLabels } from "@/lib/pms/api/hq-api";
import { isManager, isAccountant } from "@/lib/pms/auth";
import { useWebSocketContext } from "@/components/pms/live/PmsLive";
import { usePmsSession } from "@/components/pms/PmsSessionContext";

import DateInput from "@/components/pms/DateInput";
import Pagination from "@/components/pms/Pagination";
import { Tip } from "@/components/pms/Tip";
// Maps a Phase-2 rich entry's entity_type to the deep link that opens it.
// Two different existing conventions get reused here, each already built
// for a different page: AdminFolios.jsx/AdminReservations.jsx read ?id=
// query params (same as ?tab=, ?reservation_id= elsewhere), while
// AdminRooms.jsx reads React Router `location.state` (same as the
// Overview page's out-of-order/complementary/reserved banners already use).
const ENTITY_LINKS = {
  folio: (entry) => ({ path: `/pms/folios?folio_id=${entry.entity_id}` }),
  payment: (entry) => ({ path: `/pms/folios?folio_id=${entry.parent_entity_id}&highlight_payment_id=${entry.entity_id}` }),
  reservation: (entry) => ({ path: `/pms/reservations?reservation_id=${entry.entity_id}` }),
  room_type: (entry) => ({ path: "/pms/rooms", state: { openRoomTypeId: entry.entity_id } }),
  room_inventory: (entry) => ({
    path: "/pms/rooms",
    state: { openRoomTypeId: entry.parent_entity_id, expandPhysicalRooms: true, highlightRoomInventoryId: entry.entity_id },
  }),
  // The night audit's own entry for a run (the PMS's, 2026-09-18).
  night_audit: () => ({ path: "/pms/night-audit" }),
};

const LINK_LABELS = {
  folio: "View folio →",
  payment: "View folio →",
  reservation: "View reservation →",
  room_type: "View room →",
  room_inventory: "View room →",
  night_audit: "View night audit →",
};

// Every role whose actions can appear in a BRANCH audit trail. accountant
// and waitron were missing, so their entries could never be filtered for
// even though both have been generating them for a while; storekeeper joins
// them now. head_hr/hr are deliberately absent — they are Head Office
// accounts with no branch, so nothing they do lands in a branch's log.
const ROLE_LABELS = {
  manager: "Manager",
  receptionist: "Receptionist",
  accountant: "Accountant",
  waitron: "Waitron",
  storekeeper: "Store Keeper",
  developer: "Developer",
  // The PMS itself - the night audit's charges and the credit it settles
  // (owner, 2026-09-18). Shown as staff "PMS".
  auto: "Auto (PMS)",
};

// Head Office reads any branch's trail, or its own (2026-10-01: Head Office
// moved into the PMS from /hq) - where head_hr and hr act, so they join the
// role filter there.
const HEAD_OFFICE = "head_office";
const HEAD_OFFICE_ROLE_LABELS = { ...ROLE_LABELS, head_hr: "Head HR", hr: "HR" };

// Explicit timeZone so this always shows the hotel's own local time
// (Africa/Lagos) — without it, toLocaleString renders in whatever timezone
// the VIEWING device happens to be set to, which silently drifts from the
// branch's real wall-clock time if that's ever different (e.g. a device
// set to UTC shows every timestamp an hour behind actual WAT).
const formatWhen = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        timeZone: "Africa/Lagos",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const PAGE_SIZE = 20;

export default function AdminAuditTrail() {
  // Manager and accountant both get full read access here — an accountant
  // reviewing the books needs the same trace-back-to-who-did-what visibility
  // a manager has, just never the ability to act on any of it (this page is
  // already read-only for everyone).
  const isHeadOffice = usePmsSession()?.scope === "hq";
  const canView = isHeadOffice || isManager() || isAccountant();
  const navigate = useNavigate();

  // At Head Office: which branch's trail (or HEAD_OFFICE's own). Read by
  // load() through a ref, so a reload always asks about the branch on screen.
  const [branches, setBranches] = useState([]);
  const [place, setPlace] = useState("");
  const placeRef = useRef("");
  useEffect(() => {
    if (!isHeadOffice) return;
    fetchBranches().then((list) => setBranches(list || [])).catch(() => {});
  }, [isHeadOffice]);

  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [staffOptions, setStaffOptions] = useState([]);
  // Action code -> name, from the server (see fetchAuditActionLabels).
  const [actionLabels, setActionLabels] = useState({});
  // Deep links from the reports' Action columns (see AuditLink in
  // reportUi.jsx) carry their filters in the URL. They seed the filters at the
  // very first render, so every effect below sees them from the start —
  // seeding them later, from an effect, let effects that had already captured
  // the empty values fire unfiltered loads over the filtered one.
  const [searchParams] = useSearchParams();
  const [filterStaffId, setFilterStaffId] = useState(() => searchParams.get("staff_id") || "");
  const [filterRole, setFilterRole] = useState("");
  const [filterAction, setFilterAction] = useState(() => searchParams.get("action") || "");
  const [filterFrom, setFilterFrom] = useState(() => searchParams.get("from") || "");
  const [filterTo, setFilterTo] = useState(() => searchParams.get("to") || "");
  const [filterSearch, setFilterSearch] = useState(() => searchParams.get("search") || "");
  // One entry by its id: a folio line opened from Guest Folios (2026-10-09).
  // Any other filter change lets go of it.
  const [filterEntry, setFilterEntry] = useState(() => searchParams.get("entry") || "");
  const hasFilters = filterStaffId || filterRole || filterAction || filterFrom || filterTo || filterSearch || filterEntry;

  // Only the newest request may write the list. Several loads can be in
  // flight at once (arrival, a socket reconnect, typing), and without this a
  // slower, older response — possibly unfiltered — could land last and win.
  const latestRequest = useRef(0);

  const load = useCallback(async (p = 1, filters = {}) => {
    // Head Office with no branch picked yet has nothing to show.
    if (isHeadOffice && !placeRef.current) return;
    const requestId = ++latestRequest.current;
    try {
      setLoading(true);
      const params = {
        page: p,
        limit: PAGE_SIZE,
        staff_account_id: filters.staffId || undefined,
        role: filters.role || undefined,
        action: filters.action || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        search: filters.search || undefined,
        id: filters.entry || undefined,
      };
      const data = isHeadOffice ? await fetchHqAuditLogs(placeRef.current, params) : await fetchAuditLogHistory(params);
      if (requestId !== latestRequest.current) return;
      setEntries(data.data || []);
      setTotal(data.total || 0);
      setPage(p);
      setError(null);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError((err.response?.data?.message || "Failed to load the audit trail.") + " Please refresh the page.");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [isHeadOffice]);

  // Head Office picks the branch; the filters start afresh for it.
  const choosePlace = (value) => {
    placeRef.current = value;
    setPlace(value);
    setFilterStaffId("");
    setFilterRole("");
    setFilterAction("");
    setFilterFrom("");
    setFilterTo("");
    setFilterSearch("");
    setStaffOptions([]);
    setEntries([]);
    setTotal(0);
    if (!value) return;
    load(1, {});
    fetchHqAuditStaffOptions(value).then(setStaffOptions).catch(() => {});
  };

  // Load on arrival with the URL's filters, and again whenever the URL itself
  // changes — back/forward between two deep links keeps this page mounted.
  // The page's own controls do not write to the URL, so this never fights
  // them.
  const urlKey = searchParams.toString();
  useEffect(() => {
    if (!canView) return;
    const fromUrl = {
      staffId: searchParams.get("staff_id") || "",
      role: "",
      action: searchParams.get("action") || "",
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || "",
      search: searchParams.get("search") || "",
      entry: searchParams.get("entry") || "",
    };
    setFilterEntry(fromUrl.entry);
    setFilterStaffId(fromUrl.staffId);
    setFilterAction(fromUrl.action);
    setFilterFrom(fromUrl.from);
    setFilterTo(fromUrl.to);
    setFilterSearch(fromUrl.search);
    load(1, fromUrl);
    if (isHeadOffice) {
      if (!placeRef.current) setLoading(false);
      fetchHqAuditActionLabels().then(setActionLabels).catch(() => {});
    } else {
      fetchAuditStaffOptions().then(setStaffOptions).catch(() => {});
      fetchAuditActionLabels().then(setActionLabels).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, urlKey]);

  // Re-fetch whenever the socket (re)connects, same pattern as
  // AdminNightAudit.jsx/AdminOverview.jsx.
  const { isConnected } = useWebSocketContext();
  useEffect(() => {
    if (!canView || !isConnected) return;
    load(1, { staffId: filterStaffId, role: filterRole, action: filterAction, from: filterFrom, to: filterTo, search: filterSearch, entry: filterEntry });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, canView]);

  // Debounced — unlike the dropdown/date filters below (which fire
  // immediately since each change is one discrete action), reloading on
  // every keystroke here would mean one request per character typed.
  // Skips its mount run: the arrival load above already covered it, and this
  // one's job is only to follow typing.
  const searchTyped = useRef(false);
  useEffect(() => {
    if (!canView) return;
    if (!searchTyped.current) {
      searchTyped.current = true;
      return;
    }
    const timer = setTimeout(() => {
      setFilterEntry("");
      load(1, { staffId: filterStaffId, role: filterRole, action: filterAction, from: filterFrom, to: filterTo, search: filterSearch });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSearch]);

  const applyFilters = (next) => {
    const merged = {
      staffId: filterStaffId,
      role: filterRole,
      action: filterAction,
      from: filterFrom,
      to: filterTo,
      search: filterSearch,
      ...next,
    };
    setFilterEntry("");
    setFilterStaffId(merged.staffId);
    setFilterRole(merged.role);
    setFilterAction(merged.action);
    setFilterFrom(merged.from);
    setFilterTo(merged.to);
    setFilterSearch(merged.search);
    load(1, merged);
  };

  const clearFilters = () => {
    setFilterEntry("");
    setFilterStaffId("");
    setFilterRole("");
    setFilterAction("");
    setFilterFrom("");
    setFilterTo("");
    setFilterSearch("");
    load(1, {});
  };

  if (!canView) {
    return (
      <div data-component="AdminAuditTrail" className="px-[4rem] max-sm:px-[1rem] py-[4rem]">
        <p className="text-2xl text-[color:var(--text-color)]/68">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }

  const pages = Math.ceil(total / PAGE_SIZE);
  const roleLabels = isHeadOffice ? HEAD_OFFICE_ROLE_LABELS : ROLE_LABELS;
  const waitingForPlace = isHeadOffice && !place;

  return (
    <div data-component="AdminAuditTrail" className="flex flex-col items-start gap-[3rem]">
      <div>
        <PageHeading icon={IoDocumentTextOutline} tipId="auditTrail.page">Audit Trail</PageHeading>
        <p className="text-2xl text-[color:var(--text-color)]/76 mt-2">
          {isHeadOffice
            ? "A record of actions taken by staff at any branch - or at Head Office, by Head Office's own accounts."
            : "A record of actions taken by staff on this branch's account. Seen by the manager, the accountant and developers."}
        </p>
      </div>

      {isHeadOffice && (
        <div className="flex flex-col gap-2">
          <label htmlFor="audit-place" className={field.label}>Branch<Tip id="auditTrail.branch" /></label>
          <select id="audit-place" value={place} onChange={(e) => choosePlace(e.target.value)} className={field.select}>
            <option value="">-- Select a branch --</option>
            <option value={HEAD_OFFICE}>Head Office</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {waitingForPlace ? (
        <p className="text-2xl text-[color:var(--text-color)]/68">Select a branch, or Head Office, to see its audit trail.</p>
      ) : (
      <>

      <div className="w-full flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2 flex-1 min-w-64">
          <label className={field.label}>Search<Tip id="auditTrail.search" /></label>
          <input
            type="text"
            placeholder="Guest name, staff, action…"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className={field.input}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={field.label}>Staff<Tip id="auditTrail.staff" /></label>
          <select
            value={filterStaffId}
            onChange={(e) => applyFilters({ staffId: e.target.value })}
            className={field.select}
          >
            <option value="">All staff</option>
            {/* The PMS has no staff account; its empty value would read as
                "All staff". The Role filter's "Auto (PMS)" singles it out. */}
            {staffOptions.filter((s) => s.staff_account_id).map((s) => (
              <option key={s.staff_account_id} value={s.staff_account_id}>{s.username}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={field.label}>Role<Tip id="auditTrail.role" /></label>
          <select
            value={filterRole}
            onChange={(e) => applyFilters({ role: e.target.value })}
            className={field.select}
          >
            <option value="">All roles</option>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={field.label}>Action<Tip id="auditTrail.action" /></label>
          <select
            value={filterAction}
            onChange={(e) => applyFilters({ action: e.target.value })}
            className={field.select}
          >
            <option value="">All actions</option>
            {Object.entries(actionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={field.label}>From<Tip id="auditTrail.from" /></label>
          <DateInput
            value={filterFrom}
            onChange={(e) => {
              // "To" never sits before "from": it moves along instead.
              const from = e.target.value;
              applyFilters(from && filterTo && from > filterTo ? { from, to: from } : { from });
            }}
            className={field.input}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={field.label}>To<Tip id="auditTrail.to" /></label>
          <DateInput
            value={filterTo}
            min={filterFrom || undefined}
            onChange={(e) => applyFilters({ to: e.target.value })}
            className={field.input}
          />
        </div>

        {hasFilters && (
          <Button variant="light-gray" onClick={clearFilters}>Clear filters</Button>
        )}
      </div>

      <div className="w-full flex flex-col gap-4">
        {filterEntry && (
          <div className="w-full flex flex-wrap items-center justify-between gap-3 rounded-lg border border-(--accent-2) bg-(--emphasis)/5 px-5 py-3 text-xl">
            <span>Showing the one entry for the folio line you opened.</span>
            <button type="button" onClick={() => applyFilters({})} className="font-bold text-(--emphasis) hover:underline cursor-pointer">
              Show everything that day
            </button>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <p className="text-red-600 text-xl">{error}</p>
        ) : entries.length === 0 ? (
          <p className="text-2xl text-[color:var(--text-color)]/68">
            {hasFilters ? "No actions match these filters." : "No actions have been recorded yet."}
          </p>
        ) : (
          <>
            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`${table.th} ${table.stickyTh}`}>Staff<Tip id="auditTrail.col.staff" /></th>
                      <th className={table.th}>When<Tip id="auditTrail.col.when" /></th>
                      <th className={`${table.th} hidden md:table-cell`}>Role<Tip id="auditTrail.col.role" /></th>
                      <th className={table.th}>Action<Tip id="auditTrail.col.action" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      // The pages these open belong to a branch's own PMS -
                      // nothing to open from Head Office.
                      const link = !isHeadOffice && entry.entity_type && ENTITY_LINKS[entry.entity_type]
                        ? ENTITY_LINKS[entry.entity_type](entry)
                        : null;
                      // An accountant reads the trail but may not open the
                      // folio, reservation or room it points at - the link is
                      // greyed out with the reason on hover, rather than
                      // leading to a page that turns them away (2026-09-24).
                      const linkDenial = link ? accessDenial(link.path) : null;
                      return (
                        <tr key={entry.id} className={table.row}>
                          <td className="px-8 py-4 font-semibold sticky left-0 z-10 bg-(--card) group-hover:bg-[color-mix(in_srgb,black_6%,var(--card))] [box-shadow:inset_-1px_0_0_color-mix(in_srgb,var(--text-color)_12%,transparent)]">{entry.username}</td>
                          <td className="px-8 py-4 text-xl whitespace-nowrap text-[color:var(--text-color)]/84">{formatWhen(entry.created_at)}</td>
                          <td className="px-8 py-4 hidden md:table-cell">
                            <StatusBadge status={entry.role} />
                          </td>
                          <td className="px-8 py-4 text-xl min-w-[32rem]">
                            {entry.label ? (
                              <span className="flex flex-wrap items-center gap-3">
                                {entry.label}
                                {link && (linkDenial ? (
                                  <span
                                    title={linkDenial}
                                    aria-disabled="true"
                                    className="text-lg font-semibold text-[color:var(--text-color)]/40 whitespace-nowrap cursor-not-allowed"
                                  >
                                    {LINK_LABELS[entry.entity_type] || "View →"}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => navigate(link.path, { state: link.state })}
                                    className="text-lg font-semibold text-[color:var(--emphasis)] hover:underline cursor-pointer whitespace-nowrap"
                                  >
                                    {LINK_LABELS[entry.entity_type] || "View →"}
                                  </button>
                                ))}
                              </span>
                            ) : (
                              <>
                                <span className="font-mono text-[color:var(--text-color)]/76">{entry.method}</span>{" "}
                                {entry.route}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              page={page}
              totalPages={pages}
              onPage={(p) => load(p, { staffId: filterStaffId, role: filterRole, action: filterAction, from: filterFrom, to: filterTo, search: filterSearch })}
            />
          </>
        )}
      </div>
      </>
      )}
    </div>
  );
}
