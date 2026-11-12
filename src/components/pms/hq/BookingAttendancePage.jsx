"use client";

import { useEffect, useState } from "react";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import Modal from "@/components/pms/Modal";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Notice from "@/components/pms/Notice";
import { Tip } from "@/components/pms/Tip";
import { StatTile, StatRow } from "@/components/pms/hq/metrics/parts";
import { btn, card, field, page, table } from "@/components/pms/ui";
import { formatDate, formatDateTime } from "@/lib/pms/format";
import { http } from "@/lib/pms/http";
import { usePmsSession } from "@/components/pms/PmsSessionContext";

// Booking Attendance (owner, 2026-11-11; backend phase-98): the developer's
// page. Which branches tick their website bookings (those not yet on the PMS),
// and the report - every website booking there with when it was ticked and
// by whom, or that it was missed; who was on the front desk's shift when it
// came in; and every receptionist clock-in. To nudge defaulting receptionists.

const ISO = /^\d{4}-\d{2}-\d{2}$/;
// Today's business day (6am to 6am, Lagos).
const businessToday = () => new Date(Date.now() + (60 - 360) * 60000).toISOString().slice(0, 10);
const daysBefore = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);
const minutesText = (m) => (m === null || m === undefined ? "—" : m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${Math.floor(m / 1440)} d ${Math.floor((m % 1440) / 60)} h`);

function csv(name, head, rows) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob([[head, ...rows].map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Table({ head, children, empty, count }) {
  return (
    <div className={table.card}>
      <div className={table.scroll}>
        <table className={table.el}>
          <thead>
            <tr className={table.headRow}>
              {head.map(([label, tip], i) => (
                <th key={label} className={`${table.th} ${i === 0 ? table.stickyTh : ""}`}>
                  {label}
                  {tip && <Tip id={tip} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {count === 0 ? (
              <tr>
                <td colSpan={head.length} className={table.empty}>
                  {empty}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BookingAttendancePage() {
  // Head HR and HR read the report; switching a branch on is the developer's.
  const { role } = usePmsSession();
  const canSwitch = role === "developer";
  const today = businessToday();
  const [from, setFrom] = useState(daysBefore(today, 6));
  const [to, setTo] = useState(today);
  const [branch, setBranch] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [switching, setSwitching] = useState(null);
  const [busy, setBusy] = useState(false);
  const [switchError, setSwitchError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    http.get("/api/hq/booking-attendance", { params: { from, to, branch_id: branch || undefined } }).then(
      ({ data: d }) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the report."),
    );
    return () => {
      cancelled = true;
    };
  }, [from, to, branch, reloadKey]);

  const confirmSwitch = async () => {
    try {
      setBusy(true);
      setSwitchError(null);
      const { data: r } = await http.patch(`/api/hq/booking-attendance/branches/${switching.id}`, { on: !switching.attendance_ticks });
      setSwitching(null);
      setNotice(`Booking ticks are ${r.on ? "on" : "off"} at ${r.branch_name}.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setSwitchError(err.message || "That didn't go through.");
    } finally {
      setBusy(false);
    }
  };

  const s = data?.summary;
  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoCheckmarkDoneOutline}
        tipId="bookingAttendance.page"
        title="Booking Attendance"
        description="Branches not yet on the PMS tick each website booking once they have attended to it. See which were missed, how long the rest took, and every receptionist's clock-in."
      />
      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data && (
          <>
            <section className="w-full flex flex-col gap-4">
              <h2 className={page.sectionTitle}>
                Branches That Tick Bookings<Tip id="bookingAttendance.branches" />
              </h2>
              <p className={page.sectionIntro}>
                {canSwitch
                  ? "Switch on the branches not yet on the PMS. Their receptionists then see an Attended tick on Reservations."
                  : "The branches whose receptionists tick their website bookings. The developer switches them."}
              </p>
              <div className={`${card.surface} p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4`}>
                {data.branches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-4">
                    <span className="text-xl">{b.name}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(b.attendance_ticks)}
                      aria-label={`Booking ticks at ${b.name}`}
                      onClick={() => canSwitch && setSwitching(b)}
                      disabled={!canSwitch}
                      className={`relative inline-flex items-center shrink-0 h-[3.2rem] w-[6rem] rounded-full ${canSwitch ? "cursor-pointer" : "cursor-default opacity-70"} transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--emphasis) ${
                        b.attendance_ticks ? "bg-green-600" : "bg-black/25"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`inline-block h-[2.6rem] w-[2.6rem] rounded-full bg-white shadow transition-transform ${b.attendance_ticks ? "translate-x-[3.1rem]" : "translate-x-[0.3rem]"}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Today's roll call (owner, 2026-11-12): every branch, whatever dates are picked below. */}
            <section className="w-full flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className={page.sectionTitle}>
                  Today at Every Branch<Tip id="bookingAttendance.today" />
                </h2>
                <button
                  type="button"
                  className={btn.secondary}
                  disabled={!(data.today || []).length}
                  onClick={() => {
                    const day = String(data.today[0]?.business_date || "").slice(0, 10);
                    csv(
                      `clock_ins_today_${day}.csv`,
                      ["Business Day", "Branch", "Clocked In", "Receptionist", "At", "Recorded By"],
                      data.today.map((t) => [day, t.branch_name, t.clocked_in_at ? "Yes" : "Not yet", t.receptionist || "", t.clocked_in_at ? formatDateTime(t.clocked_in_at) : "", t.recorded_by || ""]),
                    );
                  }}
                >
                  Download CSV
                </button>
              </div>
              <p className={page.sectionIntro}>
                Whether each branch's receptionist has clocked in for today's business day (6am to 6am), and when. Branches not clocked in yet come first.
              </p>
              <Table
                head={[["Branch", "bookingAttendance.today.branch"], ["Clocked In", "bookingAttendance.today.status"], ["Receptionist"], ["At", "bookingAttendance.today.at"], ["Recorded By", "bookingAttendance.col.recordedBy"]]}
                count={(data.today || []).length}
                empty="No branches."
              >
                {(data.today || []).map((t) => (
                  <tr key={t.branch_id} className={table.row}>
                    <td className={`${table.td} ${table.stickyTd} font-semibold`}>{t.branch_name}</td>
                    <td className={table.td}>
                      {t.clocked_in_at ? (
                        <span className="text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-green-100 text-green-700">Clocked in</span>
                      ) : (
                        <span className="text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-red-100 text-red-700">Not yet</span>
                      )}
                    </td>
                    <td className={table.td}>{t.receptionist || "—"}</td>
                    <td className={table.td}>{t.clocked_in_at ? formatDateTime(t.clocked_in_at) : "—"}</td>
                    <td className={table.td}>{t.recorded_by || "—"}</td>
                  </tr>
                ))}
              </Table>
            </section>

            <div className={page.toolbar}>
              <div className="grid grid-cols-2 gap-4 w-full sm:flex sm:w-auto">
                <div className="flex flex-col gap-2 min-w-0 sm:w-[20rem]">
                  <label htmlFor="ba-from" className={field.label}>
                    From<Tip id="bookingAttendance.from" />
                  </label>
                  <DateInput id="ba-from" value={from} max={today} onChange={(e) => ISO.test(e.target.value) && (setFrom(e.target.value), e.target.value > to && setTo(e.target.value))} className={field.input} />
                </div>
                <div className="flex flex-col gap-2 min-w-0 sm:w-[20rem]">
                  <label htmlFor="ba-to" className={field.label}>
                    To<Tip id="bookingAttendance.to" />
                  </label>
                  <DateInput id="ba-to" value={to} min={from} max={today} onChange={(e) => ISO.test(e.target.value) && setTo(e.target.value)} className={field.input} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="ba-branch" className={field.label}>
                  Branch<Tip id="bookingAttendance.branch" />
                </label>
                <select id="ba-branch" value={branch} onChange={(e) => setBranch(e.target.value)} className={field.select}>
                  <option value="">Every branch that ticks</option>
                  {data.branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <StatRow>
              <StatTile label="Website Bookings" tip="bookingAttendance.total" value={s.bookings.toLocaleString()} sub={`${data.from === data.to ? formatDate(`${data.from}T12:00:00Z`) : `${formatDate(`${data.from}T12:00:00Z`)} to ${formatDate(`${data.to}T12:00:00Z`)}`}`} />
              <StatTile label="Missed" tip="bookingAttendance.missed" value={s.missed.toLocaleString()} sub={`${s.ticked.toLocaleString()} ticked${s.cancelled ? `, ${s.cancelled} cancelled` : ""}`} />
              <StatTile label="Typical Time to Tick" tip="bookingAttendance.median" value={minutesText(s.median_minutes_to_tick)} sub="The middle of the ticked ones" />
            </StatRow>

            <section className="w-full flex flex-col gap-4">
              <h2 className={page.sectionTitle}>
                By Receptionist on Duty<Tip id="bookingAttendance.byReceptionist" />
              </h2>
              <Table
                head={[["Receptionist", "bookingAttendance.col.receptionist"], ["Bookings", "bookingAttendance.col.bookings"], ["Ticked"], ["Missed"], ["Typical Time to Tick"]]}
                count={data.by_receptionist.length}
                empty="No website bookings in these days."
              >
                {data.by_receptionist.map((p) => (
                  <tr key={p.receptionist} className={table.row}>
                    <td className={`${table.td} ${table.stickyTd} font-semibold`}>{p.receptionist}</td>
                    <td className={table.td}>{p.bookings}</td>
                    <td className={table.td}>{p.ticked}</td>
                    <td className={`${table.td} ${p.missed ? "text-red-700 font-semibold" : ""}`}>{p.missed}</td>
                    <td className={table.td}>{minutesText(p.median_minutes_to_tick)}</td>
                  </tr>
                ))}
              </Table>
            </section>

            <section className="w-full flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className={page.sectionTitle}>
                  Every Website Booking<Tip id="bookingAttendance.bookings" />
                </h2>
                <button
                  type="button"
                  className={btn.secondary}
                  disabled={!data.bookings.length}
                  onClick={() =>
                    csv(
                      `booking_attendance_${data.from}_to_${data.to}.csv`,
                      ["Booked", "Reference", "Guest", "Branch", "On Duty", "Ticked At", "Ticked By", "Minutes to Tick", "Missed"],
                      data.bookings.map((b) => [formatDateTime(b.booked_at), b.booking_reference, b.guest_name, b.branch_name, b.on_duty || "", b.attended_at ? formatDateTime(b.attended_at) : "", b.attended_by_name || "", b.minutes_to_tick ?? "", b.missed ? (b.is_expired_hold ? "Yes - hold expired" : "Yes") : b.cancelled ? "Cancelled" : "No"]),
                    )
                  }
                >
                  Download Bookings CSV
                </button>
              </div>
              <Table
                head={[["Guest", "bookingAttendance.col.guest"], ["Booked", "bookingAttendance.col.booked"], ["Branch"], ["On Duty", "bookingAttendance.col.onDuty"], ["Attended", "bookingAttendance.col.attended"]]}
                count={data.bookings.length}
                empty="No website bookings in these days."
              >
                {data.bookings.map((b) => (
                  <tr key={b.id} className={table.row}>
                    <td className={`${table.td} ${table.stickyTd}`}>
                      <span className="font-semibold">{b.guest_name}</span>
                      <span className="block text-lg text-(--text-color)/68">{b.booking_reference}</span>
                    </td>
                    <td className={table.td}>{formatDateTime(b.booked_at)}</td>
                    <td className={table.td}>{b.branch_name}</td>
                    <td className={table.td}>{b.on_duty || <span className="text-(--text-color)/60">No one clocked in</span>}</td>
                    <td className={table.td}>
                      {b.missed ? (
                        <span className="text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                          Missed{b.is_expired_hold ? " - hold expired" : ""}
                        </span>
                      ) : b.cancelled ? (
                        <span className="text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Cancelled</span>
                      ) : (
                        <>
                          {formatDateTime(b.attended_at)}
                          <span className="block text-lg text-(--text-color)/68">
                            {b.attended_by_name || "—"}, after {minutesText(b.minutes_to_tick)}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            </section>

            <section className="w-full flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className={page.sectionTitle}>
                  Receptionist Clock-Ins<Tip id="bookingAttendance.clockIns" />
                </h2>
                <button
                  type="button"
                  className={btn.secondary}
                  disabled={!data.clock_ins.length}
                  onClick={() =>
                    csv(
                      `receptionist_clock_ins_${data.from}_to_${data.to}.csv`,
                      ["Business Day", "Branch", "Receptionist", "Clocked In At", "Recorded By"],
                      data.clock_ins.map((c) => [c.business_date, c.branch_name, c.receptionist, formatDateTime(c.clocked_in_at), c.recorded_by || ""]),
                    )
                  }
                >
                  Download Clock-Ins CSV
                </button>
              </div>
              <Table
                head={[["Business Day", "bookingAttendance.col.day"], ["Branch"], ["Receptionist"], ["Clocked In At", "bookingAttendance.col.clockedIn"], ["Recorded By", "bookingAttendance.col.recordedBy"]]}
                count={data.clock_ins.length}
                empty="No receptionist clocked in in these days."
              >
                {data.clock_ins.map((c) => (
                  <tr key={c.id} className={table.row}>
                    <td className={`${table.td} ${table.stickyTd}`}>{formatDate(`${String(c.business_date).slice(0, 10)}T12:00:00Z`)}</td>
                    <td className={table.td}>{c.branch_name}</td>
                    <td className={`${table.td} font-semibold`}>{c.receptionist}</td>
                    <td className={table.td}>{formatDateTime(c.clocked_in_at)}</td>
                    <td className={table.td}>{c.recorded_by || "—"}</td>
                  </tr>
                ))}
              </Table>
            </section>
          </>
        )
      )}

      {switching && (
        <Modal onClose={busy ? undefined : () => setSwitching(null)} title="Booking Ticks" size="md">
          <ConfirmPanel
            question={`${switching.attendance_ticks ? "Switch off" : "Switch on"} booking ticks at ${switching.name}?`}
            details={
              switching.attendance_ticks
                ? ["Its receptionists no longer see the Attended tick.", "Ticks already made are kept, and stay in the report."]
                : ["Its receptionists see an Attended tick on each website booking, on Reservations.", "From now on, a booking they don't tick shows as missed here."]
            }
            confirmLabel="Yes, switch it"
            busyLabel="Saving..."
            busy={busy}
            error={switchError}
            onBack={() => setSwitching(null)}
            onConfirm={confirmSwitch}
          />
        </Modal>
      )}
    </div>
  );
}
