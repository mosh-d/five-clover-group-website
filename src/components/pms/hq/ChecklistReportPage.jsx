"use client";

import { useEffect, useState } from "react";
import { IoCheckboxOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import FilterBar, { FilterField } from "@/components/pms/FilterBar";
import { Tip } from "@/components/pms/Tip";
import { StatTile, StatRow } from "@/components/pms/hq/metrics/parts";
import { btn, field, filter, page, table } from "@/components/pms/ui";
import { formatDate } from "@/lib/pms/format";
import { http } from "@/lib/pms/http";
import { ReportScope, ExportActions, TableCard } from "@/components/pms/ReportExport";
import { ChecklistDialog, printChecklist } from "@/components/pms/checklist/DailyChecklistPage";

// Daily Checklists at Head Office (owner, 2026-11-19): every branch's front
// desk and porter checklists over a range of business days - how many each
// branch filled in and how complete they were - with each one to view and
// print. The From/To dates filter it (owner, 2026-11-26: no "days with
// none" column).
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
  const done = rows.reduce((n, c) => n + c.done, 0);
  const total = rows.reduce((n, c) => n + c.total, 0);

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoCheckboxOutline}
        tipId="hqChecklists.page"
        title="Daily Checklists"
        description="Every branch's front desk and porter checklists: how many were filled in, how complete they were, Open any one to see it or print it."
      />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data && (
          <ReportScope from={data.from} to={data.to}>
            <FilterBar>
              <div className={filter.pair}>
                <FilterField label="From" tip="hqChecklists.from" htmlFor="hc-from" className={filter.date}>
                  <DateInput id="hc-from" value={from} max={today} onChange={(e) => ISO.test(e.target.value) && (setFrom(e.target.value), e.target.value > to && setTo(e.target.value))} className={filter.input} />
                </FilterField>
                <FilterField label="To" tip="hqChecklists.to" htmlFor="hc-to" className={filter.date}>
                  <DateInput id="hc-to" value={to} min={from} max={today} onChange={(e) => ISO.test(e.target.value) && setTo(e.target.value)} className={filter.input} />
                </FilterField>
              </div>
              <FilterField label="Branch" tip="hqChecklists.branch" htmlFor="hc-branch">
                <select id="hc-branch" value={branch} onChange={(e) => setBranch(e.target.value)} className={filter.select}>
                  <option value="">Every branch</option>
                  {data.branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Checklist" tip="hqChecklists.kind" htmlFor="hc-kind">
                <select id="hc-kind" value={kind} onChange={(e) => setKind(e.target.value)} className={filter.select}>
                  <option value="">Both</option>
                  <option value="front_desk">Front Desk (GSA)</option>
                  <option value="porter">Porter</option>
                </select>
              </FilterField>
              <ExportActions full compact className="ml-auto" />
            </FilterBar>

            <StatRow>
              <StatTile label="Checklists" tip="hqChecklists.total" value={rows.length.toLocaleString()} sub={data.from === data.to ? dayLabel(data.from) : `${dayLabel(data.from)} to ${dayLabel(data.to)}`} />
              <StatTile label="Tasks Done" tip="hqChecklists.completion" value={total ? `${Math.round((done / total) * 100)}%` : "—"} sub="Of every task on them" />
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
                      ["Branch", "Front Desk", "Porter", "Tasks Done %"],
                      data.summary.map((s) => [s.branch_name, s.front_desk, s.porter, s.completion ?? ""]),
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
                    <th className={table.th}>Tasks Done</th>
                  </tr>
                </thead>
                <tbody>
                  {data.summary.map((s) => (
                    <tr key={s.branch_id} className={table.row}>
                      <td className={`${table.td} ${table.stickyTd} font-medium`}>{s.branch_name}</td>
                      <td className={table.td}>{s.front_desk}</td>
                      <td className={table.td}>{s.porter}</td>
                      <td className={table.td}>{s.completion === null ? "—" : `${s.completion}%`}</td>
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
                      ["Date", "Branch", "Checklist", "Shift", "Staff", "Done", "Of"],
                      rows.map((c) => [String(c.business_date).slice(0, 10), c.branch_name, KIND_NAMES[c.kind], c.shift, c.staff_name, c.done, c.total]),
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
                    <th className={table.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={table.empty}>
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
                          <div className={table.actions}>
                            <button type="button" onClick={() => setViewing(c)} className={btn.rowSecondary}>
                              View
                            </button>
                            <button type="button" onClick={() => printChecklist(kindData(data, c.kind), c)} className={btn.rowPrimary}>
                              Print Checklist
                            </button>
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
