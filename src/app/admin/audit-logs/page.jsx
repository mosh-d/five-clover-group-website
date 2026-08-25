"use client";

import { useState, useEffect, useCallback } from "react";
import { IoDocumentTextOutline } from "react-icons/io5";
import {
  fetchBranches,
  fetchHqAuditLogs,
  fetchHqAuditStaffOptions,
  HqApiError,
} from "@/lib/hq-api";
import PageHeading from "@/components/admin/PageHeading";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  textColorStyle,
  mutedTextStyle,
  bodyText,
  labelText,
  inputClass,
  inputStyle,
  secondaryButtonClass,
  secondaryButtonStyle,
  errorBoxClass,
  tableCardClass,
  tableCardStyle,
  tableScrollClass,
  tableClass,
  tableHeadRowClass,
  tableHeadRowStyle,
  tableThClass,
  tableRowClass,
  tableRowStyle,
  tableTdClass,
} from "@/components/admin/adminStyles";

// Every action code any controller currently records — see each
// controller's auditLogsService.record({ action: ... }) call. Kept as one
// list so the filter dropdown and the table's fallback label always agree
// with what's actually being logged. Mirrors the hotel-frontends'
// AdminAuditTrail.jsx list.
const ACTION_LABELS = {
  "payment.record": "Payment recorded",
  "payment.refund": "Payment refunded",
  "folio.close": "Folio closed",
  "folio.post_item": "Charge posted",
  "deposit.record": "Deposit recorded",
  "deposit.apply": "Deposit applied",
  "deposit.refund": "Deposit refunded",
  "room.price_update": "Room price updated",
  "room.status_change": "Room status changed",
  "reservation.confirm": "Reservation confirmed",
  "reservation.cancel": "Reservation cancelled",
  "reservation.checkin": "Check-in",
  "reservation.checkout": "Check-out",
  "reservation.extend": "Stay extended",
};

const ROLE_LABELS = {
  manager: "Manager",
  receptionist: "Receptionist",
  accountant: "Accountant",
  waitron: "Waitron",
  developer: "Developer",
};

const PAGE_SIZE = 20;

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

export default function AdminAuditLogsPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [staffOptions, setStaffOptions] = useState([]);
  const [filterStaffId, setFilterStaffId] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const hasFilters = filterStaffId || filterRole || filterAction || filterFrom || filterTo || filterSearch;

  useEffect(() => {
    fetchBranches()
      .then((data) => setBranches(data || []))
      .catch(() => setError("Could not reach the server to load branches. Check your connection and try again."))
      .finally(() => setLoadingBranches(false));
  }, []);

  const load = useCallback(async (branchId, p = 1, filters = {}) => {
    if (!branchId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHqAuditLogs(branchId, {
        page: p,
        limit: PAGE_SIZE,
        staff_account_id: filters.staffId,
        role: filters.role,
        action: filters.action,
        from: filters.from,
        to: filters.to,
        search: filters.search,
      });
      setEntries(data.data || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      setError(err instanceof HqApiError ? err.message : "Could not reach the server to load audit logs. Check your connection and try again.");
      setEntries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setFilterStaffId("");
    setFilterRole("");
    setFilterAction("");
    setFilterFrom("");
    setFilterTo("");
    setFilterSearch("");
    setStaffOptions([]);
    if (selectedBranchId) {
      load(selectedBranchId, 1);
      fetchHqAuditStaffOptions(selectedBranchId).then(setStaffOptions).catch(() => {});
    } else {
      setEntries([]);
      setTotal(0);
    }
  }, [selectedBranchId, load]);

  // Debounced — reloading on every keystroke would mean one request per
  // character typed.
  useEffect(() => {
    if (!selectedBranchId) return;
    const timer = setTimeout(() => {
      load(selectedBranchId, 1, { staffId: filterStaffId, role: filterRole, action: filterAction, from: filterFrom, to: filterTo, search: filterSearch });
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
    setFilterStaffId(merged.staffId);
    setFilterRole(merged.role);
    setFilterAction(merged.action);
    setFilterFrom(merged.from);
    setFilterTo(merged.to);
    setFilterSearch(merged.search);
    load(selectedBranchId, 1, merged);
  };

  const clearFilters = () => {
    setFilterStaffId("");
    setFilterRole("");
    setFilterAction("");
    setFilterFrom("");
    setFilterTo("");
    setFilterSearch("");
    load(selectedBranchId, 1, {});
  };

  const currentFilters = { staffId: filterStaffId, role: filterRole, action: filterAction, from: filterFrom, to: filterTo, search: filterSearch };
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="w-full flex flex-col gap-8">
      <div>
        <PageHeading icon={IoDocumentTextOutline}>Audit Logs</PageHeading>
        <p className={`${bodyText} mt-2`} style={mutedTextStyle}>
          A record of actions taken by staff, per branch.
        </p>
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <label className={labelText} style={mutedTextStyle}>Branch</label>
        {loadingBranches ? (
          <p className={bodyText} style={mutedTextStyle}>Loading branches...</p>
        ) : (
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className={inputClass}
            style={inputStyle}
          >
            <option value="">-- Select a branch --</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {!selectedBranchId ? (
        <p className={bodyText} style={mutedTextStyle}>Select a branch to see its audit logs.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2 flex-1 min-w-64">
              <label className={labelText} style={mutedTextStyle}>Search</label>
              <input
                type="text"
                placeholder="Guest name, staff, action..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>Staff</label>
              <select
                value={filterStaffId}
                onChange={(e) => applyFilters({ staffId: e.target.value })}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">All staff</option>
                {staffOptions.map((s) => (
                  <option key={s.staff_account_id} value={s.staff_account_id}>{s.username}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>Role</label>
              <select
                value={filterRole}
                onChange={(e) => applyFilters({ role: e.target.value })}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">All roles</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>Action</label>
              <select
                value={filterAction}
                onChange={(e) => applyFilters({ action: e.target.value })}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">All actions</option>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>From</label>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => applyFilters({ from: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>To</label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => applyFilters({ to: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className={secondaryButtonClass} style={secondaryButtonStyle}>
                Clear filters
              </button>
            )}
          </div>

          {error && <p className={errorBoxClass}>{error}</p>}

          {loading ? (
            <p className={bodyText} style={mutedTextStyle}>Loading audit logs...</p>
          ) : !error && entries.length === 0 ? (
            <p className={bodyText} style={mutedTextStyle}>
              {hasFilters ? "No actions match these filters." : "No actions have been recorded yet at this branch."}
            </p>
          ) : entries.length > 0 ? (
            <>
              <div className={tableCardClass} style={tableCardStyle}>
                <div className={tableScrollClass}>
                  <table className={tableClass}>
                    <thead>
                      <tr className={tableHeadRowClass} style={tableHeadRowStyle}>
                        <th className={tableThClass}>When</th>
                        <th className={tableThClass}>Staff</th>
                        <th className={tableThClass}>Role</th>
                        <th className={tableThClass}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className={tableRowClass} style={tableRowStyle}>
                          <td className={tableTdClass}>{formatWhen(entry.created_at)}</td>
                          <td className={`${tableTdClass} font-semibold`}>{entry.username}</td>
                          <td className={tableTdClass}>
                            <StatusBadge status={entry.role} />
                          </td>
                          <td className={tableTdClass}>
                            {entry.label ? (
                              entry.label
                            ) : (
                              <>
                                <span className="font-mono" style={mutedTextStyle}>{entry.method}</span> {entry.route}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {pages > 1 && (
                <div className="flex justify-center items-center gap-4 w-full">
                  <button
                    onClick={() => load(selectedBranchId, page - 1, currentFilters)}
                    disabled={page === 1}
                    className={secondaryButtonClass}
                    style={secondaryButtonStyle}
                  >
                    Previous
                  </button>
                  <span className={bodyText} style={textColorStyle}>Page {page} of {pages}</span>
                  <button
                    onClick={() => load(selectedBranchId, page + 1, currentFilters)}
                    disabled={page === pages}
                    className={secondaryButtonClass}
                    style={secondaryButtonStyle}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
