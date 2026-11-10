"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IoAnalyticsOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import PageTabs from "@/components/pms/PageTabs";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import Pagination from "@/components/pms/Pagination";
import { Tip } from "@/components/pms/Tip";
import { StatTile, StatRow } from "@/components/pms/hq/metrics/parts";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDate, formatDateTime, money } from "@/lib/pms/format";
import { fetchBranches, fetchWebBookings, fetchWebBookingsExport } from "@/lib/pms/api/hq-api";

// Web Analytics (owner, 2026-11-10; backend phase-96): the Head Digital
// Marketer's page. Its first section, Bookings, logs every booking made on the
// hotels' websites - every branch - with the guest's details, so the traffic
// the sites bring in can be followed.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const lagosToday = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
const daysBefore = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);

// Where a booking stands - the backend's bookingOutcome().
const OUTCOMES = {
  held: { label: "Held", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700" },
  checked_in: { label: "Checked In", className: "bg-green-100 text-green-700" },
  checked_out: { label: "Checked Out", className: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  no_show: { label: "No-Show", className: "bg-red-100 text-red-700" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-600" },
};

function Outcome({ outcome }) {
  const o = OUTCOMES[outcome] || OUTCOMES.held;
  return <span className={`text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${o.className}`}>{o.label}</span>;
}

function downloadCsv(view) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["Booked", "Reference", "Branch", "Guest", "Email", "Phone", "Room Type", "Rooms", "Check-In", "Check-Out", "Nights", "Value", "Status", "Special Requests"]];
  for (const r of view.rows) {
    lines.push([
      formatDateTime(r.booked_at),
      r.booking_reference,
      r.branch_name,
      r.guest_name,
      r.guest_email,
      r.guest_phone,
      r.room_type,
      r.rooms,
      String(r.check_in).slice(0, 10),
      String(r.check_out).slice(0, 10),
      r.nights,
      r.total ?? "",
      (OUTCOMES[r.outcome] || OUTCOMES.held).label,
      r.special_requests,
    ]);
  }
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `website_bookings_${view.from}_to_${view.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function BookingsSection() {
  const today = lagosToday();
  const [from, setFrom] = useState(daysBefore(today, 29));
  const [to, setTo] = useState(today);
  const [branch, setBranch] = useState("");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [pageNo, setPageNo] = useState(1);
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchBranches()
      .then((list) => setBranches(Array.isArray(list) ? list : []))
      .catch(() => setBranches([]));
  }, []);

  // A search waits for the typing to stop.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchText.trim());
      setPageNo(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const query = useMemo(() => ({ from, to, branch_id: branch || undefined, search: search || undefined }), [from, to, branch, search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWebBookings({ ...query, page: pageNo }).then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (cancelled) return;
        setError(err.message || "Could not load the website bookings.");
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [query, pageNo]);

  const changeRange = useCallback((next) => {
    setPageNo(1);
    if (next.from !== undefined) setFrom(next.from);
    if (next.to !== undefined) setTo(next.to);
  }, []);

  const exportCsv = async () => {
    try {
      setExporting(true);
      setError(null);
      downloadCsv(await fetchWebBookingsExport({ from, to, branch_id: branch || undefined }));
    } catch (err) {
      setError(err.message || "Could not download the bookings.");
    } finally {
      setExporting(false);
    }
  };

  const s = data?.summary;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  const lostText = s
    ? ["cancelled", "expired", "no_show"]
        .filter((k) => s.by_outcome?.[k])
        .map((k) => `${s.by_outcome[k]} ${OUTCOMES[k].label.toLowerCase()}`)
        .join(", ")
    : "";
  // Missed value by why - expired holds first, the ones nobody attended to.
  const missedValueText = s
    ? ["expired", "cancelled", "no_show"]
        .filter((k) => s.lost_value_by?.[k])
        .map((k) => `${money(s.lost_value_by[k])} ${OUTCOMES[k].label.toLowerCase()}`)
        .join(", ")
    : "";

  return (
    <div className="w-full flex flex-col gap-8">
      <div className={page.toolbar}>
        <div className="grid grid-cols-2 gap-4 w-full sm:flex sm:w-auto">
          <div className="flex flex-col gap-2 min-w-0 sm:w-[20rem]">
            <label htmlFor="wa-from" className={field.label}>
              Booked From<Tip id="webAnalytics.from" />
            </label>
            <DateInput
              id="wa-from"
              value={from}
              max={today}
              onChange={(e) => {
                const next = e.target.value;
                if (ISO_DATE.test(next)) changeRange(next > to ? { from: next, to: next } : { from: next });
              }}
              className={field.input}
            />
          </div>
          <div className="flex flex-col gap-2 min-w-0 sm:w-[20rem]">
            <label htmlFor="wa-to" className={field.label}>
              To<Tip id="webAnalytics.to" />
            </label>
            <DateInput id="wa-to" value={to} min={from} max={today} onChange={(e) => ISO_DATE.test(e.target.value) && changeRange({ to: e.target.value })} className={field.input} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="wa-branch" className={field.label}>
            Branch<Tip id="webAnalytics.branch" />
          </label>
          <select
            id="wa-branch"
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setPageNo(1);
            }}
            className={field.select}
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 flex-1 min-w-[min(100%,24rem)]">
          <label htmlFor="wa-search" className={field.label}>
            Search<Tip id="webAnalytics.search" />
          </label>
          <input id="wa-search" type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Guest name or reference" className={field.input} />
        </div>
        <button type="button" onClick={exportCsv} disabled={exporting || !data?.total} className={btn.secondary}>
          {exporting ? "Preparing..." : "Download CSV"}
        </button>
      </div>

      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {s && (
        <div className="w-full flex flex-col gap-4">
          {/* Counts, then money - three of each (owner, 2026-11-10: missed and total value). */}
          <StatRow>
            <StatTile label="Website Bookings" tip="webAnalytics.total" value={s.bookings.toLocaleString()} sub={`${(s.bookings - s.lost).toLocaleString()} kept`} />
            <StatTile label="Room-Nights Booked" tip="webAnalytics.roomNights" value={s.room_nights.toLocaleString()} sub={`${s.rooms.toLocaleString()} room${s.rooms !== 1 ? "s" : ""}, not counting cancelled, expired or no-shows`} />
            <StatTile label="Missed Bookings" tip="webAnalytics.missed" value={s.lost.toLocaleString()} sub={lostText ? lostText.charAt(0).toUpperCase() + lostText.slice(1) : "None cancelled, expired or missed"} />
          </StatRow>
          <StatRow>
            <StatTile label="Total Value" tip="webAnalytics.totalValue" value={money(s.total_value)} sub="What the website quoted for every booking" />
            <StatTile label="Booked Value" tip="webAnalytics.value" value={money(s.value)} sub="The bookings kept, not counting cancelled, expired or no-shows" />
            <StatTile label="Missed Value" tip="webAnalytics.missedValue" value={money(s.lost_value)} sub={missedValueText ? missedValueText.charAt(0).toUpperCase() + missedValueText.slice(1) : "Nothing missed"} />
          </StatRow>
        </div>
      )}

      {s && s.by_branch.length > 1 && !branch && (
        <section className="w-full flex flex-col gap-4">
          <h2 className={page.sectionTitle}>
            By Branch<Tip id="webAnalytics.byBranch" />
          </h2>
          <div className={table.card}>
            <div className={table.scroll}>
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Branch<Tip id="webAnalytics.col.branch" /></th>
                    <th className={table.th}>Bookings<Tip id="webAnalytics.col.bookings" /></th>
                    <th className={table.th}>Lost<Tip id="webAnalytics.col.lost" /></th>
                    <th className={table.th}>Room-Nights<Tip id="webAnalytics.roomNights" /></th>
                    <th className={table.th}>Value<Tip id="webAnalytics.value" /></th>
                    <th className={table.th}>Missed Value<Tip id="webAnalytics.missedValue" /></th>
                  </tr>
                </thead>
                <tbody>
                  {s.by_branch.map((b) => (
                    <tr key={b.branch_id} className={table.row}>
                      <td className={`${table.td} ${table.stickyTd} font-semibold`}>{b.branch_name}</td>
                      <td className={table.td}>{b.bookings}</td>
                      <td className={table.td}>{b.lost}</td>
                      <td className={table.td}>{b.room_nights}</td>
                      <td className={table.td}>{money(b.value)}</td>
                      <td className={table.td}>{money(b.lost_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section className="w-full flex flex-col gap-4">
        <h2 className={page.sectionTitle}>
          Every Website Booking<Tip id="webAnalytics.log" />
        </h2>
        <p className={page.sectionIntro}>Newest first. Days are when the guest booked, by the Lagos calendar.</p>
        <div className={table.card}>
          <div className={table.scroll}>
            <table className={table.el}>
              <thead>
                <tr className={table.headRow}>
                  <th className={`${table.th} ${table.stickyTh}`}>Guest<Tip id="webAnalytics.col.guest" /></th>
                  <th className={table.th}>Booked<Tip id="webAnalytics.col.booked" /></th>
                  <th className={table.th}>Branch<Tip id="webAnalytics.col.branch" /></th>
                  <th className={table.th}>Stay<Tip id="webAnalytics.col.stay" /></th>
                  <th className={table.th}>Value<Tip id="webAnalytics.col.value" /></th>
                  <th className={table.th}>Status<Tip id="webAnalytics.col.status" /></th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr>
                    <td colSpan={6} className={table.empty}>
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : !data?.rows.length ? (
                  <tr>
                    <td colSpan={6} className={table.empty}>
                      {search ? `No website bookings match "${search}" in these days.` : "No website bookings in these days."}
                    </td>
                  </tr>
                ) : (
                  data.rows.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`${table.td} ${table.stickyTd}`}>
                        <span className="font-semibold">{r.guest_name}</span>
                        {r.guest_email && <span className="block text-lg break-all">{r.guest_email}</span>}
                        {r.guest_phone && <span className="block text-lg">{r.guest_phone}</span>}
                      </td>
                      <td className={table.td}>
                        {formatDateTime(r.booked_at)}
                        <span className="block text-lg text-(--text-color)/68">{r.booking_reference}</span>
                      </td>
                      <td className={table.td}>{r.branch_name}</td>
                      <td className={`${table.td} whitespace-normal! min-w-[16rem]`}>
                        <span className="font-semibold">
                          {r.rooms} × {r.room_type || "Room"}
                        </span>
                        <span className="block text-lg">
                          {formatDate(String(r.check_in).slice(0, 10) + "T12:00:00Z")} to {formatDate(String(r.check_out).slice(0, 10) + "T12:00:00Z")} ({r.nights} night{r.nights !== 1 ? "s" : ""})
                        </span>
                        {r.special_requests && <span className="block text-lg text-(--text-color)/68">&quot;{r.special_requests}&quot;</span>}
                      </td>
                      <td className={table.td}>{r.total === null ? "—" : money(r.total)}</td>
                      <td className={table.td}>
                        <Outcome outcome={r.outcome} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination page={pageNo} totalPages={totalPages} onPage={setPageNo} />
      </section>
    </div>
  );
}

export default function WebAnalyticsPage() {
  const [tab, setTab] = useState("bookings");
  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoAnalyticsOutline}
        tipId="webAnalytics.page"
        title="Web Analytics"
        description="What the hotels' websites bring in, across every branch."
      >
        {/* More sections can join Bookings here. */}
        <PageTabs tabs={[{ key: "bookings", label: "Bookings" }]} active={tab} onChange={setTab} />
      </PageHeader>
      {tab === "bookings" && <BookingsSection />}
    </div>
  );
}
