"use client";

import { useEffect, useState } from "react";
import SearchField, { matchesSearch } from "@/components/pms/SearchField";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import { Tip } from "@/components/pms/Tip";
import { btn, card, field, page, table } from "@/components/pms/ui";
import { addDaysISO, businessDateISO } from "@/lib/pms/dates";
import { money } from "@/lib/pms/format";
import { fetchInventoryReport } from "@/lib/pms/api/inventory-api";
import { num } from "./storeRequestUi";

// The store's reports (Inventory, Step 3): over a range of business days,
// each item's opening and closing stock and what moved in between; received
// by supplier, issued by department, written off by reason; CSV.

function Stat({ label, value, tip }) {
  return (
    <div className={`${card.surface} p-5 flex flex-col gap-1`}>
      <span className={field.label}>
        {label}
        <Tip id={tip} />
      </span>
      <span className="text-3xl font-bold text-(--black)">{value}</span>
    </div>
  );
}

function Section({ id, title, tip, head, rows, empty }) {
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
    ["Store report", `${report.from} to ${report.to}`],
    [],
    ["Item", "Category", "Unit", "Opening", "Received", "Issued", "Returned", "Written off", "Count difference", "Closing", "Opening value", "Received value", "Issued value", "Written off value", "Closing value"],
    ...report.items.map((i) => [
      i.name, report.categories[i.category] || i.category, i.unit, i.opening, i.received, i.issued, i.returned, i.written_off, i.counted, i.closing,
      i.opening_value, i.received_value, i.issued_value - i.returned_value, i.written_off_value, i.closing_value,
    ]),
    [],
    ["Supplier", "Deliveries", "Value"],
    ...report.by_supplier.map((s) => [s.supplier || "Not given", s.lines, s.value]),
    [],
    ["Department", "Issues", "Returns", "Value issued", "Value returned", "Net value"],
    ...report.by_department.map((d) => [d.label, d.issues, d.returns, d.issued_value, d.returned_value, d.value]),
    [],
    ["Written off", "Times", "Value"],
    ...report.write_offs.map((w) => [w.label, w.lines, w.value]),
  ];
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `store_${report.from}_${report.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InventoryReports() {
  const today = businessDateISO();
  const [from, setFrom] = useState(addDaysISO(today, -6));
  const [to, setTo] = useState(today);
  const [report, setReport] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!from || !to || to < from) return undefined;
    let cancelled = false;
    fetchInventoryReport(from, to).then(
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

  const t = report?.totals;
  const qtyCell = (v, unit) => (v ? `${num(v)} ${unit}` : "—");
  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="inv-report-from" className={field.label}>
            From<Tip id="inventory.reports.range" />
          </label>
          <DateInput id="inv-report-from" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="inv-report-to" className={field.label}>
            To
          </label>
          <DateInput id="inv-report-to" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
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
              Business days, 6am to 6am. Values use the cost of the time: a delivery at its own cost, everything else at the latest delivery cost before it. Stock with
              no cost yet counts in the quantities, not the values.
            </p>
            <div className="w-full grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Stat label="Opening Value" value={money(t.opening_value)} tip="inventory.reports.openingValue" />
              <Stat label="Received" value={money(t.received_value)} tip="inventory.reports.receivedValue" />
              <Stat label="Issued (Net of Returns)" value={money(t.issued_value)} tip="inventory.reports.issuedValue" />
              <Stat label="Written Off" value={money(t.written_off_value)} tip="inventory.reports.writtenOffValue" />
              <Stat label="Count Differences" value={money(t.counted_value)} tip="inventory.reports.countedValue" />
              <Stat label="Closing Value" value={money(t.closing_value)} tip="inventory.reports.closingValue" />
            </div>

            <SearchField id="inv-report-search" value={search} onChange={setSearch} placeholder="Item name" tip="inventory.reports.search" />
            <Section
              id="inv-report-items"
              title="Stock by Item"
              tip="inventory.reports.items"
              head={[
                ["Item", "inventory.reports.col.item"],
                ["Opening", "inventory.reports.col.opening"],
                ["Received", "inventory.reports.col.received"],
                ["Issued", "inventory.reports.col.issued"],
                ["Returned", "inventory.reports.col.returned"],
                ["Written Off", "inventory.reports.col.writtenOff"],
                ["Count Difference", "inventory.reports.col.counted"],
                ["Closing", "inventory.reports.col.closing"],
                ["Closing Value", "inventory.reports.col.closingValue"],
              ]}
              rows={report.items.filter((i) => matchesSearch(search, i.name)).map((i) => [
                i.name,
                qtyCell(i.opening, i.unit),
                qtyCell(i.received, i.unit),
                qtyCell(i.issued, i.unit),
                qtyCell(i.returned, i.unit),
                qtyCell(i.written_off, i.unit),
                i.counted ? `${i.counted > 0 ? "+" : ""}${num(i.counted)} ${i.unit}` : "—",
                `${num(i.closing)} ${i.unit}`,
                money(i.closing_value),
              ])}
              empty="No stock held or moved in these days."
            />
            <Section
              id="inv-report-suppliers"
              title="Received by Supplier"
              tip="inventory.reports.bySupplier"
              head={[
                ["Supplier", "inventory.reports.col.supplier"],
                ["Deliveries", "inventory.reports.col.deliveries"],
                ["Value", "inventory.reports.col.value"],
              ]}
              rows={report.by_supplier.map((s) => [s.supplier || "Not given", s.lines, money(s.value)])}
              empty="Nothing received in these days."
            />
            <Section
              id="inv-report-departments"
              title="Issued by Department"
              tip="inventory.reports.byDepartment"
              head={[
                ["Department", "inventory.reports.col.department"],
                ["Issues", "inventory.reports.col.issues"],
                ["Returns", "inventory.reports.col.returns"],
                ["Net Value", "inventory.reports.col.netValue"],
              ]}
              rows={report.by_department.map((d) => [d.label, d.issues, d.returns, money(d.value)])}
              empty="Nothing issued in these days."
            />
            <Section
              id="inv-report-writeoffs"
              title="Written Off"
              tip="inventory.reports.writeOffs"
              head={[
                ["Why", "inventory.reports.col.reason"],
                ["Times", "inventory.reports.col.times"],
                ["Value", "inventory.reports.col.value"],
              ]}
              rows={report.write_offs.map((w) => [w.label, w.lines, money(w.value)])}
              empty="Nothing written off in these days."
            />
          </>
        )
      )}
    </div>
  );
}
