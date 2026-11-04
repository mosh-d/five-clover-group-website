"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import { Tip } from "@/components/pms/Tip";
import { btn, card, field, page, table } from "@/components/pms/ui";
import { addDaysISO, businessDateISO } from "@/lib/pms/dates";
import { formatDateTime } from "@/lib/pms/format";
import { fetchHousekeepingReport } from "@/lib/pms/api/housekeeping-api";

// The housekeeping reports and time tracking (backend docs/HOUSEKEEPING-PLAN.md
// §5 E, Step 7) - the supervisor's and the manager's. Over any range of
// business days: the team's figures, each housekeeper's, the reviews, the
// unlikely times to look at, and every room cleaned.

export const timeOfDay = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// "12 min", "1 h 05 min", "—".
export const minutesText = (m) => {
  if (m === null || m === undefined) return "—";
  const total = Math.round(m);
  if (total < 60) return `${total} min`;
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, "0")} min`;
};

const WHY = { check_out: "Check-out", room_move: "Room move", marked_dirty: "Marked for cleaning", back_in_service: "Back in service" };

function Stat({ label, value, sub, tip }) {
  return (
    <div className={`${card.surface} p-5 flex flex-col gap-1`}>
      <span className={field.label}>
        {label}
        <Tip id={tip} />
      </span>
      <span className="text-3xl font-bold text-(--black)">{value}</span>
      {sub && <span className={`text-lg ${page.muted}`}>{sub}</span>}
    </div>
  );
}

function Table({ id, title, tip, head, rows, empty }) {
  return (
    <section aria-labelledby={id} className="w-full flex flex-col gap-3">
      <h3 id={id} className={page.sectionTitle}>
        {title}
        <Tip id={tip} />
      </h3>
      <div className={table.card}>
        <div className={table.scroll}>
          <table className={table.el}>
            <thead>
              <tr className={table.headRow}>
                {head.map(([label, tipId], i) => (
                  <th key={label} className={`${table.th} ${i === 0 ? table.stickyTh : ""}`}>
                    {label}
                    <Tip id={tipId} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={head.length} className={table.empty}>
                    {empty}
                  </td>
                </tr>
              ) : (
                rows.map((cells, r) => (
                  <tr key={r} className={table.row}>
                    {cells.map((c, i) => (
                      <td key={i} className={`${table.td} ${i === 0 ? `${table.stickyTd} font-semibold` : ""}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function downloadCsv(report) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    ["Housekeeping report", `${report.from} to ${report.to}`],
    [],
    ["Housekeeper", "Rounds submitted", "Rooms approved", "Passed first time", "Sent back", "Avg response (min)", "Avg cleaning (min)", "Reclean time (min)", "Unlikely times"],
    ...report.housekeepers.map((h) => [h.name, h.rounds, h.rooms_approved, h.passed_first_time, h.sent_back, h.avg_response_min ?? "", h.avg_cleaning_min ?? "", h.reclean_min ?? "", h.flagged]),
    [],
    ["Room", "Type", "Why", "Needed cleaning", "Clean", "Rounds", "Cleaned by", "Approved / made ready by", "Turnaround (min)", "Made ready without review"],
    ...report.rooms.map((r) => [r.room_number, r.room_type_name, WHY[r.reason] || r.reason, r.opened_at, r.done_at, r.rounds, r.cleaner || "", r.done_by || "", r.turnaround_min ?? "", r.made_ready_without_review ? r.ready_note : ""]),
  ];
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `housekeeping_${report.from}_${report.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HousekeepingReports() {
  const today = businessDateISO();
  const [from, setFrom] = useState(addDaysISO(today, -6));
  const [to, setTo] = useState(today);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  // Fetched whenever the range changes; the last good report stays on
  // screen while the next loads.
  useEffect(() => {
    if (!from || !to || to < from) return undefined;
    let cancelled = false;
    fetchHousekeepingReport(from, to).then(
      (r) => {
        if (cancelled) return;
        setReport(r);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the report."),
    );
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const t = report?.team;
  const pct = (n, of) => (of ? `${Math.round((n / of) * 100)}%` : "—");

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="hk-report-from" className={field.label}>
            From<Tip id="housekeeping.reports.range" />
          </label>
          <DateInput id="hk-report-from" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="hk-report-to" className={field.label}>
            To
          </label>
          <DateInput id="hk-report-to" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
        </div>
        {report && (
          <button type="button" onClick={() => downloadCsv(report)} className={btn.secondary}>
            Download CSV
          </button>
        )}
      </div>

      {error && <p className={field.error}>{error}</p>}
      {!report && !error ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        report && (
          <>
            <p className={`text-xl ${page.muted}`}>
              Response and review times count only the housekeeping hours, {timeOfDay(report.hours.start)} to {timeOfDay(report.hours.end)}. A clean under{" "}
              {report.thresholds.too_quick_min} minutes or over {report.thresholds.too_long_min / 60} hours is listed under Unlikely Times and left out of the averages.
            </p>

            <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Rooms Cleaned" value={t.rooms_approved} sub={`${t.rounds} submitted for review`} tip="housekeeping.reports.roomsCleaned" />
              <Stat label="Passed First Time" value={pct(t.passed_first_time, t.rooms_approved)} sub={`${t.passed_first_time} of ${t.rooms_approved}`} tip="housekeeping.reports.firstTime" />
              <Stat label="Sent Back" value={t.sent_back} sub={`recleans took ${minutesText(t.reclean_min)}`} tip="housekeeping.reports.sentBack" />
              <Stat label="Made Ready Without Review" value={t.made_ready_without_review} sub="by the front desk" tip="housekeeping.reports.madeReady" />
              <Stat label="Response" value={minutesText(t.avg_response_min)} sub="average, to Start" tip="housekeeping.reports.response" />
              <Stat label="Cleaning" value={minutesText(t.avg_cleaning_min)} sub="average, Start to Submit" tip="housekeeping.reports.cleaning" />
              <Stat label="Review" value={minutesText(t.avg_review_min)} sub="average, Submit to decision" tip="housekeeping.reports.review" />
              <Stat label="Turnaround" value={minutesText(t.avg_turnaround_min)} sub="average, needing it to Clean" tip="housekeeping.reports.turnaround" />
            </div>

            <Table
              id="hk-report-housekeepers"
              title="Housekeepers"
              tip="housekeeping.reports.housekeepers"
              head={[
                ["Housekeeper", "housekeeping.reports.col.housekeeper"],
                ["Rooms Cleaned", "housekeeping.reports.col.rooms"],
                ["First Time", "housekeeping.reports.col.firstTime"],
                ["Sent Back", "housekeeping.reports.col.sentBack"],
                ["Response", "housekeeping.reports.col.response"],
                ["Cleaning", "housekeeping.reports.col.cleaning"],
                ["Reclean Time", "housekeeping.reports.col.recleanTime"],
                ["Unlikely Times", "housekeeping.reports.col.flagged"],
              ]}
              rows={report.housekeepers.map((h) => [
                h.name,
                `${h.rooms_approved} (${h.rounds} submitted)`,
                pct(h.passed_first_time, h.rooms_approved),
                h.sent_back,
                minutesText(h.avg_response_min),
                minutesText(h.avg_cleaning_min),
                minutesText(h.reclean_min),
                h.flagged,
              ])}
              empty="No rooms submitted in these days."
            />

            <Table
              id="hk-report-reviews"
              title="Reviews"
              tip="housekeeping.reports.reviews"
              head={[
                ["Reviewed By", "housekeeping.reports.col.reviewer"],
                ["Reviews", "housekeeping.reports.col.reviews"],
                ["Approved", "housekeeping.reports.col.approved"],
                ["Sent Back", "housekeeping.reports.col.reviewSentBack"],
                ["Review Time", "housekeeping.reports.col.reviewTime"],
              ]}
              rows={report.reviewers.map((r) => [r.name, r.reviews, r.approved, r.sent_back, minutesText(r.avg_review_min)])}
              empty="No reviews in these days."
            />

            <Table
              id="hk-report-flagged"
              title="Unlikely Times"
              tip="housekeeping.reports.flagged"
              head={[
                ["Room", "housekeeping.reports.col.room"],
                ["Housekeeper", "housekeeping.reports.col.housekeeper"],
                ["Started", "housekeeping.reports.col.started"],
                ["Submitted", "housekeeping.reports.col.submitted"],
                ["Took", "housekeeping.reports.col.took"],
                ["Why It Stands Out", "housekeeping.reports.col.why"],
              ]}
              rows={report.flagged.map((f) => [
                `Room ${f.room_number}${f.round > 1 ? ` (round ${f.round})` : ""}`,
                f.housekeeper,
                formatDateTime(f.started_at),
                formatDateTime(f.submitted_at),
                minutesText(f.minutes),
                f.why,
              ])}
              empty="Nothing unlikely in these days."
            />

            <Table
              id="hk-report-rooms"
              title="Rooms Cleaned"
              tip="housekeeping.reports.rooms"
              head={[
                ["Room", "housekeeping.reports.col.room"],
                ["Why", "housekeeping.reports.col.reason"],
                ["Needed Cleaning", "housekeeping.reports.col.opened"],
                ["Clean", "housekeeping.reports.col.done"],
                ["Rounds", "housekeeping.reports.col.rounds"],
                ["Cleaned By", "housekeeping.reports.col.cleanedBy"],
                ["Approved By", "housekeeping.reports.col.approvedBy"],
                ["Turnaround", "housekeeping.reports.col.turnaround"],
              ]}
              rows={report.rooms.map((r) => [
                `Room ${r.room_number}`,
                WHY[r.reason] || r.reason,
                formatDateTime(r.opened_at),
                formatDateTime(r.done_at),
                r.rounds,
                r.cleaner || "—",
                r.made_ready_without_review ? `${r.done_by} - made ready without review: ${r.ready_note}` : r.done_by || "—",
                r.made_ready_without_review ? "—" : minutesText(r.turnaround_min),
              ])}
              empty="No rooms finished in these days."
            />
          </>
        )
      )}
    </div>
  );
}
