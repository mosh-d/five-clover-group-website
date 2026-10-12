"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import Pagination from "@/components/pms/Pagination";
import usePagedRows from "@/components/pms/usePagedRows";
import { Tip } from "@/components/pms/Tip";
import { AuditLink } from "@/components/pms/reportUi";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { money, pct } from "@/lib/pms/format";
import { businessDateISO } from "@/lib/pms/dates";
import { fetchMargin } from "@/lib/pms/api/accounting-api";
import { auditFor } from "./audit";

// F&B Margin (Accounting, Step 12): per item and in total, for a range of
// business days - what was sold, what it sold for, what it cost the hotel,
// and the gross margin. Costs are the store keeper's (the Menu page's cost
// prices and drink restocks); an item without one is listed, unmargined.

const signed = (v) => (v < 0 ? `-${money(-v)}` : money(v));

function downloadCsv(view) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["Item", "Food or drink", "Sold", "Free", "Sales", "Cost", "Margin", "Margin %"]];
  for (const i of view.items) lines.push([i.name, i.kind, i.sold, i.free, i.sales, i.cost ?? "", i.margin ?? "", i.margin_pct ?? ""]);
  const t = view.totals;
  lines.push(["Total", "", t.sold, t.free, t.sales, t.cost, t.margin, t.margin_pct ?? ""]);
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fnb_margin_${view.from}_to_${view.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MarginTab() {
  const today = businessDateISO();
  const [from, setFrom] = useState(() => `${businessDateISO().slice(0, 7)}-01`);
  const [to, setTo] = useState(() => businessDateISO());
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const ready = Boolean(from && to && to >= from);

  const load = useCallback(
    () =>
      ready
        ? fetchMargin(from, to).then(
            (d) => {
              setView(d);
              setError(null);
            },
            (err) => setError(err.message || "Could not load the F&B margin."),
          )
        : Promise.resolve(),
    [from, to, ready],
  );
  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    fetchMargin(from, to).then(
      (d) => {
        if (cancelled) return;
        setView(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the F&B margin."),
    );
    return () => {
      cancelled = true;
    };
  }, [from, to, ready]);
  useLiveRefresh(load, []);

  // Dates just picked show the spinner until their figures arrive.
  const shown = view && view.from === from && view.to === to ? view : null;
  const paged = usePagedRows(shown?.items || []);
  const t = shown?.totals;

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          F&amp;B Margin
          <Tip id="accounting.margin" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          Each food and drink item over a range of business days: how many were sold, what they sold for, what they cost the hotel, and the margin.
          Costs are the store keeper&apos;s, from the Menu page and drink restocks.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="margin-from" className={field.label}>From<Tip id="accounting.margin.from" /></label>
          <DateInput id="margin-from" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="margin-to" className={field.label}>To<Tip id="accounting.margin.to" /></label>
          <DateInput id="margin-to" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
        </div>
        {shown && shown.items.length > 0 && (
          <button type="button" onClick={() => downloadCsv(shown)} className={btn.secondary}>Download CSV</button>
        )}
      </div>

      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!ready ? (
        <p className={`text-xl ${page.muted}`}>Pick the days to look at.</p>
      ) : !shown && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        shown && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-2 rounded-lg text-xl bg-black/5"><strong>Sales</strong>: {money(t.sales)}</span>
              <span className="px-4 py-2 rounded-lg text-xl bg-black/5"><strong>Cost</strong>: {money(t.cost)}</span>
              <span className={`px-4 py-2 rounded-lg text-xl ${t.margin < 0 ? "bg-red-100 text-red-700" : "bg-green-50 text-green-800"}`}>
                <strong>Margin</strong>: {signed(t.margin)}
                {t.margin_pct !== null ? ` (${pct(t.margin_pct)})` : ""}
              </span>
              <Tip id="accounting.margin.totals" />
            </div>
            {t.uncosted_items > 0 && (
              <p className="text-xl text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                {t.uncosted_items === 1 ? "One item has" : `${t.uncosted_items} items have`} no cost yet, so no margin: their {money(t.sales - t.costed_sales)} of sales
                are left out of the margin. The store keeper sets cost prices on the Menu page.
              </p>
            )}

            {shown.items.length === 0 ? (
              <p className={`text-xl ${page.muted}`}>No food or drink was sold in these days.</p>
            ) : (
              <>
                <div className={table.card}>
                  <div className={table.scroll}>
                    <table className={table.el}>
                      <thead>
                        <tr className={table.headRow}>
                          <th className={`${table.th} ${table.stickyTh}`}>Item<Tip id="accounting.margin.col.item" /></th>
                          <th className={`${table.th} text-right!`}>Sold<Tip id="accounting.margin.col.sold" /></th>
                          <th className={`${table.th} text-right! hidden md:table-cell`}>Free<Tip id="accounting.margin.col.free" /></th>
                          <th className={`${table.th} text-right!`}>Sales<Tip id="accounting.margin.col.sales" /></th>
                          <th className={`${table.th} text-right!`}>Cost<Tip id="accounting.margin.col.cost" /></th>
                          <th className={`${table.th} text-right!`}>Margin<Tip id="accounting.margin.col.margin" /></th>
                          <th className={`${table.th} text-right! hidden md:table-cell`}>Margin %<Tip id="accounting.margin.col.marginPct" /></th>
                          <th className={table.th}>Action<Tip id="accounting.col.viewLog" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.rows.map((i) => (
                          <tr key={i.key} className={table.row}>
                            <td className={`${table.td} ${table.stickyTd}`}>
                              <div className="font-semibold">{i.name}</div>
                              <div className={`text-lg ${page.muted}`}>
                                {i.kind === "food" ? "Food" : "Drink"}
                                {i.item_id ? "" : " · typed in, not from the menu"}
                              </div>
                            </td>
                            <td className={`${table.td} text-right!`}>{i.sold}</td>
                            <td className={`${table.td} text-right! hidden md:table-cell`}>{i.free || "-"}</td>
                            <td className={`${table.td} text-right!`}>{money(i.sales)}</td>
                            <td className={`${table.td} text-right!`}>
                              {i.cost === null ? <span className="text-lg text-orange-700">No cost</span> : money(i.cost)}
                            </td>
                            <td className={`${table.td} text-right! font-bold ${i.margin !== null && i.margin < 0 ? "text-red-600" : ""}`}>
                              {i.margin === null ? "-" : signed(i.margin)}
                            </td>
                            <td className={`${table.td} text-right! hidden md:table-cell`}>{i.margin_pct === null ? "-" : pct(i.margin_pct)}</td>
                            <td className={table.td}>
                              <AuditLink audit={auditFor({ search: i.name, from: shown.from, to: shown.to })} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Pagination page={paged.page} totalPages={paged.totalPages} onPage={paged.setPage} className="mt-0" />
              </>
            )}
          </>
        )
      )}
    </section>
  );
}
