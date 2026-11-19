"use client";

import { useEffect, useState } from "react";
import { IoCheckboxOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import { Tip } from "@/components/pms/Tip";
import { StatTile, StatRow } from "@/components/pms/hq/metrics/parts";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDate, formatDateTime } from "@/lib/pms/format";
import { http } from "@/lib/pms/http";
import { ReportScope, ExportActions, TableCard } from "@/components/pms/ReportExport";
import { ChecklistDialog, printChecklist } from "@/components/pms/checklist/DailyChecklistPage";

// Daily Checklists at Head Office (owner, 2026-11-19): every branch's front
// desk and porter checklists over a range of business days - how many each
// branch filled in and the manager confirmed, how complete they were, and the
// days with no front desk checklist at all - with each one to view and print.
// Head HR's and HR's, and the developer's. Read only.

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const businessToday = () => new Date(Date.now() + (60 - 360) * 60000).toISOString().slice(0, 10);
const daysBefore = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);
const dayLabel = (day) => formatDate(`${String(day).slice(0, 10)}T12:00:00Z`);
const KIND_NAMES = { front_desk: "Front Desk", porter: "Porter" };

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

// What ChecklistDialog and printChecklist need to know about one checklist's kind.
const kindData = (data, kind) => ({ kind, tasks: data.tasks[kind], title: data.titles[kind], today: "", shifts: [] });

export default function ChecklistReportPage() {
  const today = businessToday();
  const [from, setFrom] = useState(daysBefore(today, 6));
  const [to, setTo] = useState(today);
  const [branch, setBranch] = useState("");
  const [kind, setKind] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    let cancelled = false;
    http.get("/api/hq/daily-checklists", { params: { from, to, branch_id: branch || undefined, kind: kind || undefined } }).then(
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
  }, [from, to, branch, kind]);

  const rows = data?.checklists || [];
  const confirmed = rows.filter((c) => c.confirmed_at).length;
  const done = rows.reduce((n, c) => n + c.done, 0);
  const total = rows.reduce((n, c) => n + c.total, 0);
  const gaps = (data?.summary || []).reduce((n, s) => n + (s.days_without_front_desk || 0), 0);

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoCheckboxOutline}
        tipId="hqChecklists.page"
        title="Daily Checklists"
        description="Every branch's front desk and porter checklists: how many were filled in and confirmed by the manager, how complete they were, and the days a branch's front desk filled in none. Open any one to see it or print it."
      />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data && (
          <ReportScope from={data.from} to={data.to}>
            <div className={page.toolbar}>
              <div className="grid grid-cols-2 gap-4 w-full sm:flex sm:w-auto">
                <div className="flex flex-col gap-2 min-w-0 sm:w-[20rem]">
                  <label htmlFor="hc-from" className={field.label}>
                    From<Tip id="hqChecklists.from" />
                  </label>
                  <DateInput id="hc-from" value={from} max={today} onChange={(e) => ISO.test(e.target.value) && (setFrom(e.target.value), e.target.value > to && setTo(e.target.value))} className={field.input} />
                </div>
                <div className="flex flex-col gap-2 min-w-0 sm:w-[20rem]">
                  <label htmlFor="hc-to" className={field.label}>
                    To<Tip id="hqChecklists.to" />
                  </label>
                  <DateInput id="hc-to" value={to} min={from} max={today} onChange={(e) => ISO.test(e.target.value) && setTo(e.target.value)} className={field.input} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="hc-branch" className={field.label}>
                  Branch<Tip id="hqChecklists.branch" />
                </label>
                <select id="hc-branch" value={branch} onChange={(e) => setBranch(e.target.value)} className={field.select}>
                  <option value="">Every branch</option>
                  {data.branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="hc-kind" className={field.label}>
                  Checklist<Tip id="hqChecklists.kind" />
                </label>
                <select id="hc-kind" value={kind} onChange={(e) => setKind(e.target.value)} className={field.select}>
                  <option value="">Both</option>
                  <option value="front_desk">Front Desk (GSA)</option>
                  <option value="porter">Porter</option>
                </select>
              </div>
              <ExportActions full className="ml-auto" />
            </div>

            <StatRow>
              <StatTile label="Checklists" tip="hqChecklists.total" value={rows.length.toLocaleString()} sub={data.from === data.to ? dayLabel(data.from) : `${dayLabel(data.from)} to ${dayLabel(data.to)}`} />
              <StatTile label="Confirmed" tip="hqChecklists.confirmed" value={confirmed.toLocaleString()} sub={`${(rows.length - confirmed).toLocaleString()} not confirmed yet`} />
              <StatTile label="Tasks Done" tip="hqChecklists.completion" value={total ? `${Math.round((done / total) * 100)}%` : "—"} sub="Of every task on them" />
              {kind !== "porter" && <StatTile label="Days With No Front Desk Checklist" tip="hqChecklists.gaps" value={gaps.toLocaleString()} sub="Across the branches shown" />}
            </StatRow>

            <TableCard
              report="By Branch"
              heading={
                <h2 className={page.sectionTitle}>
                  By Branch<Tip id="hqChecklists.byBranch" />
                </h2>
              }
              actions={[
                {
                  label: "Download CSV",
                  disabled: !data.summary.length,
                  onClick: () =>
                    csv(
                      `checklists_by_branch_${data.from}_${data.to}.csv`,
                      ["Branch", "Front Desk", "Porter", "Confirmed", "Not Confirmed", "Tasks Done %", "Days With No Front Desk Checklist"],
                      data.summary.map((s) => [s.branch_name, s.front_desk, s.porter, s.confirmed, s.not_confirmed, s.completion ?? "", s.days_without_front_desk ?? ""]),
                    ),
                },
              ]}
            >
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Branch</th>
                    <th className={table.th}>Front Desk</th>
                    <th className={table.th}>Porter</th>
                    <th className={table.th}>Confirmed</th>
                    <th className={table.th}>Not Confirmed</th>
                    <th className={table.th}>Tasks Done</th>
                    {kind !== "porter" && <th className={table.th}>Days With None<Tip id="hqChecklists.gaps" /></th>}
                  </tr>
                </thead>
                <tbody>
                  {data.summary.map((s) => (
                    <tr key={s.branch_id} className={table.row}>
                      <td className={`${table.td} ${table.stickyTd} font-medium`}>{s.branch_name}</td>
                      <td className={table.td}>{s.front_desk}</td>
                      <td className={table.td}>{s.porter}</td>
                      <td className={table.td}>{s.confirmed}</td>
                      <td className={table.td}>{s.not_confirmed}</td>
                      <td className={table.td}>{s.completion === null ? "—" : `${s.completion}%`}</td>
                      {kind !== "porter" && <td className={`${table.td} ${s.days_without_front_desk ? "text-red-700 font-semibold" : ""}`}>{s.days_without_front_desk}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>

            <TableCard
              report="Every Checklist"
              heading={
                <h2 className={page.sectionTitle}>
                  Every Checklist<Tip id="hqChecklists.list" />
                </h2>
              }
              actions={[
                {
                  label: "Download CSV",
                  disabled: !rows.length,
                  onClick: () =>
                    csv(
                      `checklists_${data.from}_${data.to}.csv`,
                      ["Date", "Branch", "Checklist", "Shift", "Staff", "Done", "Of", "Confirmed By", "Confirmed At", "Tasks Confirmed", "Supervisor's Remarks"],
                      rows.map((c) => [String(c.business_date).slice(0, 10), c.branch_name, KIND_NAMES[c.kind], c.shift, c.staff_name, c.done, c.total, c.confirmed_by_name || "", c.confirmed_at ? formatDateTime(c.confirmed_at) : "", c.confirmed_at ? c.confirmed : "", c.supervisor_note || ""]),
                    ),
                },
              ]}
            >
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Staff</th>
                    <th className={table.th}>Date</th>
                    <th className={table.th}>Branch</th>
                    <th className={table.th}>Checklist</th>
                    <th className={table.th}>Shift</th>
                    <th className={table.th}>Done</th>
                    <th className={table.th}>Supervisor</th>
                    <th className={table.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={table.empty}>
                        No checklists for these dates.
                      </td>
                    </tr>
                  ) : (
                    rows.map((c) => (
                      <tr key={c.id} className={table.row}>
                        <td className={`${table.td} ${table.stickyTd} font-medium`}>{c.staff_name}</td>
                        <td className={table.td}>{dayLabel(c.business_date)}</td>
                        <td className={table.td}>{c.branch_name}</td>
                        <td className={table.td}>{KIND_NAMES[c.kind]}</td>
                        <td className={table.td}>{c.shift}</td>
                        <td className={table.td}>
                          {c.done} of {c.total}
                        </td>
                        <td className={table.td}>
                          {c.confirmed_at ? (
                            <span className="text-green-700 font-semibold">
                              ✓ {c.confirmed_by_name || "Confirmed"} ({c.confirmed} of {c.done})
                            </span>
                          ) : (
                            <span className={page.muted}>Not yet</span>
                          )}
                        </td>
                        <td className={table.td}>
                          <div className={table.actions}>
                            <button type="button" onClick={() => setViewing(c)} className={btn.rowSecondary}>
                              View
                            </button>
                            {c.confirmed_at && (
                              <button type="button" onClick={() => printChecklist(kindData(data, c.kind), c)} className={btn.rowPrimary}>
                                Print Checklist
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableCard>
          </ReportScope>
        )
      )}
      {viewing && data && <ChecklistDialog mode="view" data={kindData(data, viewing.kind)} checklist={viewing} onClose={() => setViewing(null)} onDone={() => setViewing(null)} />}
    </div>
  );
}
