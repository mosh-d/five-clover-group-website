"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import Pagination from "@/components/pms/Pagination";
import usePagedRows from "@/components/pms/usePagedRows";
import { Tip } from "@/components/pms/Tip";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDateTime, money } from "@/lib/pms/format";
import { addDaysISO, businessDateISO } from "@/lib/pms/dates";
import { fetchReceiptsAudit } from "@/lib/pms/api/accounting-api";

// Receipts (Accounting, Step 6): the paper receipt numbers typed with guest
// payments, reservation credit and non-guest payments - numbers used on more
// than one transaction (and those for different amounts), numbers missing
// from a receipt book's run, and money taken with no receipt number at all,
// by who took it. Read-only; nothing new is stored.

function DuplicateCard({ dup }) {
  return (
    <div className={`w-full rounded-xl border px-6 py-4 flex flex-col gap-3 ${dup.different_amounts ? "border-red-300 bg-red-50" : "border-(--accent-2) bg-(--card)"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl font-bold font-mono">#{dup.receipt}</span>
        <span className={`text-lg ${page.muted}`}>{dup.transactions.length} transactions</span>
        {dup.different_amounts && <span className="px-3 py-1 rounded-full text-lg font-bold bg-red-100 text-red-700">Different amounts</span>}
      </div>
      <div className={table.scroll}>
        <table className="w-full text-xl">
          <thead>
            <tr className="text-left text-(--text-color)/76">
              <th className="py-2 pr-4 font-semibold">When<Tip id="accounting.receipts.col.when" /></th>
              <th className="py-2 pr-4 font-semibold">What<Tip id="accounting.receipts.col.what" /></th>
              <th className="py-2 pr-4 font-semibold hidden md:table-cell">Taken By<Tip id="accounting.receipts.col.by" /></th>
              <th className="py-2 font-semibold text-right">Amount<Tip id="accounting.receipts.col.amount" /></th>
            </tr>
          </thead>
          <tbody>
            {dup.transactions.map((t, i) => (
              <tr key={i} className="border-t border-(--accent-2)">
                <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(t.at)}</td>
                <td className="py-2 pr-4">
                  <div className="font-semibold">{t.kind_label}</div>
                  <div className={`text-lg ${page.muted}`}>{[t.guest, t.reference, t.methods].filter(Boolean).join(" · ")}</div>
                </td>
                <td className="py-2 pr-4 hidden md:table-cell">{t.taken_by || "-"}</td>
                <td className="py-2 text-right whitespace-nowrap font-bold">{money(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function downloadCsv(view) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["Section", "Receipt / book", "When", "What", "Guest or bill", "Method", "Taken by", "Amount", "Note"]];
  for (const d of view.duplicates) {
    for (const t of d.transactions) lines.push(["Used more than once", d.receipt, t.at, t.kind_label, [t.guest, t.reference].filter(Boolean).join(" "), t.methods, t.taken_by, t.amount, d.different_amounts ? "Different amounts" : ""]);
  }
  for (const b of view.books) {
    for (const g of b.gaps) lines.push(["Missing from the run", b.book || "(numbers only)", "", g.from === g.to ? g.from : `${g.from} to ${g.to}`, "", "", "", "", `${g.count} number${g.count === 1 ? "" : "s"}${g.long ? " - a new book?" : ""}`]);
  }
  for (const l of view.missing_receipt.lines) lines.push(["No receipt number", "", l.at, l.kind_label, [l.guest, l.reference].filter(Boolean).join(" "), l.method, l.taken_by, l.amount, ""]);
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipts_${view.from}_to_${view.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReceiptsTab() {
  const today = businessDateISO();
  const [from, setFrom] = useState(() => addDaysISO(businessDateISO(), -6));
  const [to, setTo] = useState(() => businessDateISO());
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const ready = Boolean(from && to && to >= from);

  const load = useCallback(
    () =>
      ready
        ? fetchReceiptsAudit(from, to).then(
            (d) => {
              setView(d);
              setError(null);
            },
            (err) => setError(err.message || "Could not load the receipts."),
          )
        : Promise.resolve(),
    [from, to, ready],
  );
  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    fetchReceiptsAudit(from, to).then(
      (d) => {
        if (cancelled) return;
        setView(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the receipts."),
    );
    return () => {
      cancelled = true;
    };
  }, [from, to, ready]);
  useLiveRefresh(load, []);

  const dupPage = usePagedRows(view?.duplicates || []);
  const blankPage = usePagedRows(view?.missing_receipt.lines || []);
  const c = view?.counts;

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          Receipts
          <Tip id="accounting.receipts" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          The paper receipt numbers typed with payments: numbers used more than once, numbers missing from a receipt book, and money taken without a receipt number.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="receipts-from" className={field.label}>From<Tip id="accounting.receipts.from" /></label>
          <DateInput id="receipts-from" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="receipts-to" className={field.label}>To<Tip id="accounting.receipts.to" /></label>
          <DateInput id="receipts-to" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
        </div>
        {view && view.transactions > 0 && (
          <button type="button" onClick={() => downloadCsv(view)} className={btn.secondary}>Download CSV</button>
        )}
      </div>

      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!view && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        view && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-2 rounded-lg text-xl bg-black/5"><strong>Payments</strong>: {view.transactions}</span>
              <span className={`px-4 py-2 rounded-lg text-xl ${c.duplicates ? "bg-red-100 text-red-700" : "bg-black/5"}`}>
                <strong>Used more than once</strong>: {c.duplicates}{c.different_amounts ? ` (${c.different_amounts} for different amounts)` : ""}
              </span>
              <span className={`px-4 py-2 rounded-lg text-xl ${c.missing_numbers ? "bg-orange-100 text-orange-700" : "bg-black/5"}`}>
                <strong>Missing numbers</strong>: {c.missing_numbers}
              </span>
              <span className={`px-4 py-2 rounded-lg text-xl ${c.no_receipt ? "bg-orange-100 text-orange-700" : "bg-black/5"}`}>
                <strong>No receipt number</strong>: {c.no_receipt}{c.no_receipt ? ` · ${money(c.no_receipt_amount)}` : ""}
              </span>
              <Tip id="accounting.receipts.totals" />
            </div>

            {/* ---- Used more than once */}
            <section className="w-full flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-(--black)">Used More Than Once<Tip id="accounting.receipts.duplicates" /></h3>
              {view.duplicates.length === 0 ? (
                <p className={`text-xl ${page.muted}`}>No receipt number was used on more than one transaction.</p>
              ) : (
                <>
                  {dupPage.rows.map((d) => <DuplicateCard key={d.receipt} dup={d} />)}
                  <Pagination page={dupPage.page} totalPages={dupPage.totalPages} onPage={dupPage.setPage} className="mt-0" />
                </>
              )}
            </section>

            {/* ---- Missing from a run */}
            <section className="w-full flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-(--black)">Missing From a Receipt Book<Tip id="accounting.receipts.gaps" /></h3>
              {view.books.length === 0 ? (
                <p className={`text-xl ${page.muted}`}>No numbers are missing between the receipts used in these days.</p>
              ) : (
                view.books.map((b) => (
                  <div key={b.book || "-"} className="w-full rounded-xl border border-(--accent-2) bg-(--card) px-6 py-4 flex flex-col gap-2">
                    <p className="text-xl">
                      <strong>{b.book ? `Book "${b.book}"` : "Numbers only"}</strong>
                      <span className={page.muted}> · used {b.first} to {b.last} ({b.used} in these days)</span>
                    </p>
                    <ul className="flex flex-col gap-1">
                      {b.gaps.map((g) => (
                        <li key={g.from} className={`text-xl ${g.long ? page.muted : "text-orange-700 font-semibold"}`}>
                          {g.from === g.to ? g.from : `${g.from} to ${g.to}`}
                          {g.count > 1 ? ` (${g.count} numbers)` : ""}
                          {g.long ? " - a jump: a new book, or a mistyped number?" : ` - between ${g.between[0]} and ${g.between[1]}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>

            {/* ---- No receipt number */}
            <section className="w-full flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-(--black)">No Receipt Number<Tip id="accounting.receipts.blank" /></h3>
              {view.missing_receipt.lines.length === 0 ? (
                <p className={`text-xl ${page.muted}`}>Every payment in these days has a receipt number.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-3">
                    {view.missing_receipt.by_staff.map((s) => (
                      <span key={s.taken_by} className="px-4 py-2 rounded-lg text-xl bg-black/5">
                        <strong>{s.taken_by}</strong>: {s.count} · {money(s.amount)}
                      </span>
                    ))}
                  </div>
                  <div className={table.card}>
                    <div className={table.scroll}>
                      <table className={table.el}>
                        <thead>
                          <tr className={table.headRow}>
                            <th className={table.th}>When<Tip id="accounting.receipts.col.when" /></th>
                            <th className={table.th}>What<Tip id="accounting.receipts.col.what" /></th>
                            <th className={`${table.th} hidden md:table-cell`}>Taken By<Tip id="accounting.receipts.col.by" /></th>
                            <th className={`${table.th} text-right!`}>Amount<Tip id="accounting.receipts.col.amount" /></th>
                          </tr>
                        </thead>
                        <tbody>
                          {blankPage.rows.map((l, i) => (
                            <tr key={`${l.at}-${i}`} className={table.row}>
                              <td className={`${table.td} whitespace-nowrap`}>{formatDateTime(l.at)}</td>
                              <td className={`${table.td} whitespace-normal!`}>
                                <div className="font-semibold">{l.kind_label}</div>
                                <div className={`text-lg ${page.muted}`}>{[l.guest, l.reference, l.method].filter(Boolean).join(" · ")}</div>
                              </td>
                              <td className={`${table.td} hidden md:table-cell`}>{l.taken_by || "-"}</td>
                              <td className={`${table.td} text-right! font-bold`}>{money(l.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Pagination page={blankPage.page} totalPages={blankPage.totalPages} onPage={blankPage.setPage} className="mt-0" />
                </>
              )}
            </section>
          </>
        )
      )}
    </section>
  );
}
