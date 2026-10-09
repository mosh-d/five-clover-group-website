"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IoNotificationsOutline, IoMenuOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import StatusBadge from "@/components/pms/StatusBadge";
import GuestName from "@/components/pms/GuestName";
import Pagination from "@/components/pms/Pagination";
import Toast from "@/components/pms/Toast";
import { MotionDiv, tabEnter } from "@/components/pms/motion";
import { usePmsLive, useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { fetchAlerts } from "@/lib/pms/api/alerts-api";
import { fetchFlaggedExceptions } from "@/lib/pms/api/accounting-api";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { markNoShow } from "@/lib/pms/api/reservations-pms-api";
import { calendarDaysAgo, serverNow } from "@/lib/pms/dates";
import { formatDate, formatDateTime, money } from "@/lib/pms/format";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import { Tip } from "@/components/pms/Tip";

const PAGE_SIZE = 10;

// How long ago something was created, by elapsed time.
const daysAgo = (date, now) => {
  const diff = Math.floor((now - new Date(date).getTime()) / 86400000);
  return diff === 0 ? "today" : diff === 1 ? "yesterday" : `${diff} days ago`;
};

// A hold's live countdown - `now` ticks every second, so every countdown on
// the page moves in step.
const timeUntil = (date, now) => {
  const diffMs = new Date(date).getTime() - now;
  if (diffMs <= 0) return "Expiring now";
  const totalSeconds = Math.ceil(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m ${totalSeconds % 60}s`;
};

// Alerts - the branch PMS's page (AdminAlerts.jsx): everything that needs the
// front desk's attention.
//
// No `??` in here: in a component, this site's React Compiler and Next's
// transform together lower several of them into one temporary they then
// name two ways ("_ref is not defined", 2026-09-28). `||` needs no
// temporary and means the same for a list. Each tab is described once, below, and drawn by the
// same table, rather than five near-copies of it.
export default function PmsAlertsPage() {
  const router = useRouter();
  const { alertCount, syncAlertCount } = usePmsLive();
  // What the accountant flagged is the manager's to see (Accounting, Step 3).
  const role = usePmsSession()?.role;
  const seesFlags = role === "manager" || role === "developer";
  const [tab, setTab] = useState("missed");
  const [pages, setPages] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");
  const clearToast = useCallback(() => setToast(""), []);
  const [actionLoading, setActionLoading] = useState(null);

  // Drives every hold countdown, by the server's clock.
  const [now, setNow] = useState(() => serverNow().getTime());
  useEffect(() => {
    const interval = setInterval(() => setNow(serverNow().getTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const [result, flagged] = await Promise.all([fetchAlerts(), seesFlags ? fetchFlaggedExceptions() : Promise.resolve(null)]);
      setData(flagged ? { ...result, flagged_exceptions: flagged.map((f) => ({ ...f, id: f.key })) } : result);
      setError(null);
      // This page holds the freshest total; the sidebar badge follows it.
      syncAlertCount(result?.total || 0);
    } catch (err) {
      setError(`${err.message || "Failed to load alerts."} Please refresh the page.`);
    } finally {
      setLoading(false);
    }
  }, [syncAlertCount, seesFlags]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);
  useLiveRefresh(loadAlerts, ["alerts"]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  const handleMarkNoShow = async (id, guestName) => {
    try {
      setActionLoading(id);
      await markNoShow(id);
      setToast(`${guestName} marked as no-show.`);
      loadAlerts();
    } catch (err) {
      setError(err.message || "Failed to mark as no-show.");
    } finally {
      setActionLoading(null);
    }
  };

  const guestCell = (name, tags, ref) => (
    <>
      <div><GuestName name={name} tags={tags} /></div>
      {ref && <div className={`text-base ${page.muted}`}>{ref}</div>}
    </>
  );
  const view = (label, href) => (
    <button onClick={() => router.push(href)} className={btn.rowPrimary}>
      {label}
    </button>
  );

  const TABS = [
    {
      key: "missed",
      colTips: { "Guest": "alerts.col.guest", "Room Type": "alerts.col.roomType", "Check-In Was": "alerts.missed.checkInWas", "Status": "alerts.col.status", "Actions": "alerts.missed.actions" },
      label: "Missed Check-Ins",
      rows: data?.missed_check_ins || [],
      empty: "No missed check-ins.",
      intro: "Confirmed (paid) reservations whose check-in date has passed with no arrival recorded.",
      columns: [
        { head: "Guest", cell: (r) => guestCell(r.guest_name, r.guest_tags, r.booking_reference) },
        { head: "Room Type", wide: true, cell: (r) => r.room_type?.name || "N/A" },
        {
          head: "Check-In Was",
          wide: true,
          cell: (r) => (
            <>
              {formatDate(r.check_in)}
              <span className="ml-2 text-base text-orange-600 font-semibold">({calendarDaysAgo(r.check_in)})</span>
            </>
          ),
        },
        { head: "Status", wide: true, cell: (r) => <StatusBadge status={r.status} /> },
        {
          head: "Actions",
          cell: (r) => (
            <div className={table.actions}>
              {view("View", `/pms/reservations?reservation_id=${r.id}`)}
              <button onClick={() => handleMarkNoShow(r.id, r.guest_name)} disabled={actionLoading === r.id} className={btn.rowSecondary}>
                {actionLoading === r.id ? <LoadingSpinner size="sm" /> : "No-Show"}
              </button>
            </div>
          ),
        },
      ],
    },
    {
      key: "unconfirmed",
      colTips: { "Guest": "alerts.col.guest", "Room Type": "alerts.col.roomType", "Booked": "alerts.unconfirmed.booked", "Hold Expires": "alerts.unconfirmed.expires", "Actions": "alerts.unconfirmed.actions" },
      label: "Unconfirmed",
      rows: data?.unconfirmed || [],
      empty: "No unconfirmed reservations.",
      intro:
        "Awaiting payment confirmation — the room releases automatically if left unconfirmed for too long, but the booking itself stays retrievable (Reclaim Hold) until someone else books that room, or until the end of the business day after it expires, whichever comes first.",
      columns: [
        { head: "Guest", cell: (r) => guestCell(r.guest_name, r.guest_tags, r.booking_reference) },
        { head: "Room Type", wide: true, cell: (r) => r.room_type?.name || "N/A" },
        { head: "Booked", wide: true, cell: (r) => daysAgo(r.created_at, now) },
        {
          head: "Hold Expires",
          cell: (r) =>
            r.is_expired_hold ? (
              <span className="text-base text-orange-700 font-bold uppercase tracking-wide">Expired — reclaimable</span>
            ) : (
              <span className="text-base text-orange-600 font-semibold">{timeUntil(r.expires_at, now)}</span>
            ),
        },
        { head: "Actions", cell: (r) => <div className={table.actions}>{view("View", `/pms/reservations?reservation_id=${r.id}`)}</div> },
      ],
    },
    {
      key: "overdue",
      colTips: { "Guest": "alerts.col.guest", "Room Type": "alerts.col.roomType", "Was Due Out": "alerts.overdue.wasDueOut", "Actions": "alerts.overdue.actions" },
      label: "Overdue Checkouts",
      rows: data?.overdue_checkouts || [],
      empty: "No overdue checkouts.",
      intro: "Guests still in-house past their scheduled departure date.",
      columns: [
        { head: "Guest", cell: (r) => guestCell(r.guest_name, r.guest_tags, r.booking_reference) },
        { head: "Room Type", wide: true, cell: (r) => r.room_type?.name || "N/A" },
        {
          head: "Was Due Out",
          wide: true,
          cell: (r) => (
            <>
              {formatDate(r.check_out)}
              <span className="ml-2 text-base text-red-600 font-semibold">({calendarDaysAgo(r.check_out)})</span>
            </>
          ),
        },
        { head: "Actions", cell: (r) => <div className={table.actions}>{view("Go to In-House", `/pms/in-house?reservation_id=${r.id}`)}</div> },
      ],
    },
    {
      key: "balances",
      colTips: { "Guest": "alerts.col.guest", "Folio #": "alerts.balances.folio", "Checked Out": "alerts.balances.checkedOut", "Balance Due": "alerts.balances.due", "Actions": "alerts.balances.actions" },
      label: "Overdue Balances",
      rows: data?.overdue_balances || [],
      empty: "No outstanding post-checkout balances.",
      intro: "Checked-out guests with an unpaid folio balance.",
      columns: [
        { head: "Guest", cell: (f) => guestCell(f.reservation?.guest_name || "N/A", f.reservation?.guest_tags, f.reservation?.booking_reference) },
        { head: "Folio #", wide: true, cell: (f) => f.folio_number },
        { head: "Checked Out", wide: true, cell: (f) => formatDate(f.reservation?.check_out) },
        { head: "Balance Due", cell: (f) => <span className="font-bold text-red-600">{money(f.balance)}</span> },
        { head: "Actions", cell: (f) => <div className={table.actions}>{view("Go to Folio", `/pms/folios?folio_id=${f.id}`)}</div> },
      ],
    },
    {
      // Money owed back TO a guest who has left (owner, 2026-09-17). It can
      // no longer settle anything, so it waits here until it is refunded or
      // moved to a booking they have now - both on the folio.
      key: "credits",
      colTips: { "Guest": "alerts.col.guest", "Credit": "alerts.credits.credit", "Taken": "alerts.credits.taken", "Checked Out": "alerts.credits.checkedOut", "Actions": "alerts.credits.actions" },
      label: "Credit to Guest",
      rows: data?.guest_credits || [],
      empty: "No credit owed to a departed guest.",
      intro: "These guests checked out with money still on their folio. Open the folio to refund it, or to transfer it to a folio they have now.",
      columns: [
        { head: "Guest", cell: (c) => guestCell(c.guest_name, c.guest_tags, c.booking_reference) },
        { head: "Credit", cell: (c) => <span className="font-bold text-green-700">{money(c.amount_available)}</span> },
        { head: "Taken", wide: true, cell: (c) => formatDate(c.deposit_date) },
        { head: "Checked Out", wide: true, cell: (c) => formatDate(c.actual_check_out) },
        { head: "Actions", cell: (c) => <div className={table.actions}>{view("View", `/pms/folios?reservation_id=${c.reservation_id}`)}</div> },
      ],
    },
  ];
  if (seesFlags) {
    TABS.push({
      // Lines the accountant flagged on Accounting > Exceptions, with their
      // note. Not in the badge's count: that is the front desk's too.
      key: "flagged",
      colTips: { "When": "alerts.flagged.when", "What": "alerts.flagged.what", "Amount": "alerts.flagged.amount", "By": "alerts.flagged.by", "Accountant's Note": "alerts.flagged.note" },
      label: "Flagged by Accountant",
      rows: data?.flagged_exceptions || [],
      empty: "Nothing flagged by the accountant.",
      intro: "Refunds, discounts, adjustments and free food or drink the accountant has asked you to look at. They stay here until the accountant marks them OK.",
      columns: [
        // The business day it belongs to, as the accountant saw it (a 1am refund is the night before).
        { head: "When", cell: (f) => formatDate(`${f.day}T12:00:00Z`) },
        {
          head: "What",
          cell: (f) => (
            <div className="whitespace-normal min-w-[14rem]">
              <div className="font-semibold">{f.kind_label}</div>
              <div className={`text-base ${page.muted}`}>{[f.details, f.guest || f.reference].filter(Boolean).join(" · ")}</div>
            </div>
          ),
        },
        { head: "Amount", cell: (f) => (f.amount === null || f.amount === undefined ? "-" : <span className="font-bold">{f.amount < 0 ? `-${money(-f.amount)}` : money(f.amount)}</span>) },
        { head: "By", wide: true, cell: (f) => f.by || "-" },
        {
          head: "Accountant's Note",
          cell: (f) => (
            <div className="whitespace-normal min-w-[12rem]">
              <div>{f.note || "-"}</div>
              <div className={`text-base ${page.muted}`}>{f.flagged_by || "The accountant"}, {formatDateTime(f.flagged_at)}</div>
            </div>
          ),
        },
      ],
    });
  }
  const active = TABS.find((t) => t.key === tab);
  const pageNo = pages[tab] || 1;

  return (
    <>
      <Toast message={toast} onClose={clearToast} />

      <div className={`${page.wrap} gap-[3rem]!`}>
        <PageHeading
          icon={IoNotificationsOutline}
          tipId="alerts.page"
          badge={alertCount > 0 && <span className="bg-red-600 text-white text-2xl font-bold rounded-full px-3 py-1 min-w-[2.5rem] text-center">{alertCount}</span>}
        >
          Alerts
        </PageHeading>

        <AlertTabs tabs={TABS} active={tab} onChange={setTab} />

        {loading && !data ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <p className={field.error}>{error}</p>
        ) : (
          <MotionDiv key={tab} className="w-full" {...tabEnter}>
            {active.rows.length === 0 ? (
              <div className="w-full flex flex-col items-center gap-4 py-20 text-center">
                <div className="text-6xl">✓</div>
                <p className={`text-2xl ${page.muted}`}>{active.empty}</p>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-4">
                <p className={`text-xl ${page.muted}`}>{active.intro}</p>
                <div className={table.card}>
                  <div className={table.scroll}>
                    <table className={table.el}>
                      <thead>
                        <tr className={table.headRow}>
                          {active.columns.map((c, i) => (
                            <th key={c.head} className={`${table.th} ${i === 0 ? table.stickyTh : ""} ${c.wide ? "hidden md:table-cell" : ""}`}>
                              {c.head}
                              {active.colTips?.[c.head] && <Tip id={active.colTips[c.head]} />}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {active.rows.slice((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE).map((row) => (
                          <tr key={row.id} className={table.row}>
                            {active.columns.map((c, i) => (
                              <td key={c.head} className={`${table.td} ${i === 0 ? `${table.stickyTd} font-medium` : ""} ${c.wide ? "hidden md:table-cell" : ""}`}>
                                {c.cell(row)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Pagination page={pageNo} totalPages={Math.ceil(active.rows.length / PAGE_SIZE)} onPage={(p) => setPages((all) => ({ ...all, [tab]: p }))} />
              </div>
            )}
          </MotionDiv>
        )}
      </div>
    </>
  );
}

// The tabs, with their counts. Five don't fit a phone - the last was cut off
// the edge (owner, 2026-09-17) - so below sm they fold into a menu that
// opens on the current one.
function AlertTabs({ tabs, active, onChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const outside = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [menuOpen]);
  const current = tabs.find((t) => t.key === active);
  const countPill = (count, onEmphasis) =>
    count > 0 && (
      <span className={`text-xl font-bold rounded-full px-3 py-1 min-w-[1.4rem] text-center leading-tight ${onEmphasis ? "bg-white text-(--emphasis)" : "bg-red-600 text-white"}`}>
        {count}
      </span>
    );

  return (
    <div className="w-full">
      <div className="sm:hidden relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="w-full flex items-center justify-between gap-3 px-6 py-4 border border-(--accent-2) bg-(--card) rounded-xl text-xl font-bold text-(--emphasis) cursor-pointer"
        >
          <span className="flex items-center gap-3">
            <IoMenuOutline size={24} />
            {current?.label}
          </span>
          {countPill(current?.rows.length, false)}
        </button>
        {menuOpen && (
          <div className="absolute z-30 mt-2 w-full bg-(--card) border border-(--accent-2) rounded-xl shadow-lg overflow-hidden">
            {tabs.map(({ key, label, rows }) => (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-6 py-4 text-xl text-left cursor-pointer ${
                  active === key ? "bg-(--emphasis)/10 text-(--emphasis) font-bold" : "text-(--text-color)/76 hover:bg-black/3"
                }`}
              >
                <span>{label}</span>
                {countPill(rows.length, false)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hidden sm:flex flex-wrap gap-3 w-full">
        {tabs.map(({ key, label, rows }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-6 py-3 rounded-lg text-xl font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              active === key ? "bg-(--emphasis) text-white" : "bg-black/4 hover:bg-black/8"
            }`}
          >
            {label}
            {countPill(rows.length, active === key)}
          </button>
        ))}
      </div>
    </div>
  );
}
