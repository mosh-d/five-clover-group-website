"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import { Tip } from "@/components/pms/Tip";
import { AuditLink } from "@/components/pms/reportUi";
import { auditFor } from "./audit";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDateTime, money } from "@/lib/pms/format";
import { addDaysISO, businessDateISO } from "@/lib/pms/dates";
import { fetchBalanceCheck } from "@/lib/pms/api/accounting-api";

// Balance Check (Accounting, Step 8): what guests owe less the credit they
// hold, rolled forward a business day at a time from the records - at the
// start, + charged, - paid, - paid ahead, + paid back = at the end - checked
// against what the folios and credits themselves say now, and every folio
// checked on its own. Read-only.

const dayText = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(",", "");
const signed = (v) => (v < 0 ? `-${money(-v)}` : money(v));

function downloadCsv(view) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["Day", "At the start", "Charged", "Paid", "Paid ahead", ...(view.credit_given ? ["Credit given"] : []), "Paid back", "At the end"]];
  for (const d of view.days) lines.push([d.date, d.at_start, d.charged, d.paid, d.paid_ahead, ...(view.credit_given ? [d.credit_given] : []), d.paid_back, d.at_end]);
  lines.push([]);
  lines.push(["Now", "Owed by the folios", view.now.owed, "Credit held", view.now.held, "Between them", view.now.net, "From the records", view.now.from_records, "Difference", view.now.difference]);
  if (view.balance_off.length) {
    lines.push([]);
    lines.push(["Folio that doesn't add up", "Guest", "Should be", "Balance", "Difference"]);
    for (const f of view.balance_off) lines.push([f.folio_number, f.guest_name, f.should_be, f.balance, f.difference]);
  }
  if (view.figure_off.length) {
    lines.push([]);
    lines.push(["Folio whose figures don't match", "Guest", "Charged figure off by", "Paid figure off by"]);
    for (const f of view.figure_off) lines.push([f.folio_number, f.guest_name, f.charged_difference, f.paid_difference]);
  }
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `balance_check_${view.from}_to_${view.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BalanceTab() {
  const router = useRouter();
  const today = businessDateISO();
  const [from, setFrom] = useState(() => addDaysISO(businessDateISO(), -6));
  const [to, setTo] = useState(() => businessDateISO());
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const ready = Boolean(from && to && to >= from);

  const load = useCallback(
    () =>
      ready
        ? fetchBalanceCheck(from, to).then(
            (d) => {
              setView(d);
              setError(null);
            },
            (err) => setError(err.message || "Could not load the balance check."),
          )
        : Promise.resolve(),
    [from, to, ready],
  );
  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    fetchBalanceCheck(from, to).then(
      (d) => {
        if (cancelled) return;
        setView(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the balance check."),
    );
    return () => {
      cancelled = true;
    };
  }, [from, to, ready]);
  useLiveRefresh(load, []);

  // Dates just picked show the spinner until their check arrives.
  const shown = view && view.from === from && view.to === to ? view : null;
  const openFolio = (id) => router.push(`/pms/folios?folio_id=${id}`);
  const now = shown?.now;

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          Balance Check
          <Tip id="accounting.balance" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          What guests owe less the credit they hold, worked out from the records a business day at a time, and checked against the folios&apos; own balances now.
          Credit used on a bill, credit moved to another booking and an overpayment kept as credit only move money between what is owed and what is held, so
          they leave the total alone.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="balance-from" className={field.label}>From<Tip id="accounting.balance.from" /></label>
          <DateInput id="balance-from" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="balance-to" className={field.label}>To<Tip id="accounting.balance.to" /></label>
          <DateInput id="balance-to" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
        </div>
        {shown && (
          <button type="button" onClick={() => downloadCsv(shown)} className={btn.secondary}>Download CSV</button>
        )}
      </div>

      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!ready ? (
        <p className={`text-xl ${page.muted}`}>Pick the days to check.</p>
      ) : !shown && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        shown && (
          <>
            {/* ---- Now: the folios' and credits' own figures against the records */}
            <div className={`w-full rounded-xl border px-6 py-5 flex flex-col gap-2 ${now.adds_up ? "border-green-200 bg-green-50" : "border-red-300 bg-red-50"}`}>
              <h3 className={`text-2xl font-bold ${now.adds_up ? "text-green-800" : "text-red-700"}`}>
                {now.adds_up ? "It adds up." : `It doesn't add up: ${money(Math.abs(now.difference))} apart.`}
                <Tip id="accounting.balance.now" />
              </h3>
              <p className="text-xl text-[color:var(--text-color)]">
                By their own figures, the {shown.folios} guest folios say guests owe <strong>{money(now.owed)}</strong>, and they hold{" "}
                <strong>{money(now.held)}</strong> of credit: <strong>{signed(now.net)}</strong> between them. From the records it is{" "}
                <strong>{signed(now.from_records)}</strong>
                {now.after_last_day !== 0 && shown.days.length > 0 && (
                  <>
                    {" "}({signed(shown.days[shown.days.length - 1].at_end)} at the end of {dayText(shown.to)}, and {signed(now.after_last_day)} dated after it)
                  </>
                )}
                .
              </p>
              <p className={`text-lg ${page.muted}`}>As things stand now ({formatDateTime(shown.as_at)}). Below zero: guests hold more credit than they owe.</p>
            </div>

            {/* ---- Day by day */}
            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`${table.th} ${table.stickyTh}`}>Day<Tip id="accounting.balance.col.day" /></th>
                      <th className={`${table.th} text-right!`}>At the Start<Tip id="accounting.balance.col.start" /></th>
                      <th className={`${table.th} text-right!`}>Charged<Tip id="accounting.balance.col.charged" /></th>
                      <th className={`${table.th} text-right!`}>Paid<Tip id="accounting.balance.col.paid" /></th>
                      <th className={`${table.th} text-right!`}>Paid Ahead<Tip id="accounting.balance.col.paidAhead" /></th>
                      {shown.credit_given && <th className={`${table.th} text-right!`}>Credit Given<Tip id="accounting.balance.col.creditGiven" /></th>}
                      <th className={`${table.th} text-right!`}>Paid Back<Tip id="accounting.balance.col.paidBack" /></th>
                      <th className={`${table.th} text-right!`}>At the End<Tip id="accounting.balance.col.end" /></th>
                      <th className={table.th}>Action<Tip id="accounting.col.viewLog" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.days.map((d) => (
                      <tr key={d.date} className={table.row}>
                        <td className={`${table.td} ${table.stickyTd}`}>
                          {dayText(d.date)}
                          {d.date === shown.today && <span className={`text-lg ${page.muted}`}> (so far)</span>}
                        </td>
                        <td className={`${table.td} text-right!`}>{signed(d.at_start)}</td>
                        <td className={`${table.td} text-right!`}>{d.charged ? `+${signed(d.charged)}` : "-"}</td>
                        <td className={`${table.td} text-right!`}>{d.paid ? signed(-d.paid) : "-"}</td>
                        <td className={`${table.td} text-right!`}>{d.paid_ahead ? signed(-d.paid_ahead) : "-"}</td>
                        {shown.credit_given && <td className={`${table.td} text-right!`}>{d.credit_given ? signed(-d.credit_given) : "-"}</td>}
                        <td className={`${table.td} text-right!`}>{d.paid_back ? `+${signed(d.paid_back)}` : "-"}</td>
                        <td className={`${table.td} text-right! font-bold`}>{signed(d.at_end)}</td>
                        <td className={table.td}><AuditLink audit={auditFor({ from: d.date })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ---- Folios that don't add up */}
            <section className="w-full flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-(--black)">Folios That Don&apos;t Add Up<Tip id="accounting.balance.folios" /></h3>
              {shown.balance_off.length === 0 ? (
                <p className={`text-xl ${page.muted}`}>
                  Every folio adds up: its balance is its charges, less what was paid on it, plus anything paid back or kept as credit, less the credit it used.
                </p>
              ) : (
                <div className={table.card}>
                  <div className={table.scroll}>
                    <table className={table.el}>
                      <thead>
                        <tr className={table.headRow}>
                          <th className={`${table.th} ${table.stickyTh}`}>Folio<Tip id="accounting.balance.col.folio" /></th>
                          <th className={`${table.th} text-right!`}>Should Be<Tip id="accounting.balance.col.shouldBe" /></th>
                          <th className={`${table.th} text-right!`}>Balance<Tip id="accounting.balance.col.balance" /></th>
                          <th className={`${table.th} text-right!`}>Difference<Tip id="accounting.balance.col.difference" /></th>
                          <th className={table.th}>Actions<Tip id="accounting.balance.col.actions" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {shown.balance_off.map((f) => (
                          <tr key={f.folio_id} className={table.row}>
                            <td className={`${table.td} ${table.stickyTd}`}>
                              <div className="font-semibold">{f.guest_name || "Guest"}</div>
                              <div className={`text-lg ${page.muted}`}>{f.folio_number}</div>
                            </td>
                            <td className={`${table.td} text-right!`}>{signed(f.should_be)}</td>
                            <td className={`${table.td} text-right!`}>{signed(f.balance)}</td>
                            <td className={`${table.td} text-right! font-bold text-red-600`}>{signed(f.difference)}</td>
                            <td className={table.td}>
                              <div className={table.actions}>
                                <button type="button" onClick={() => openFolio(f.folio_id)} className={btn.rowPrimary}>Folio</button>
                                <AuditLink audit={auditFor({ search: f.guest_name || f.folio_number, from: f.opened, to: shown.today })} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* ---- Right balance, figures that disagree */}
            {shown.figure_off.length > 0 && (
              <section className="w-full flex flex-col gap-4">
                <h3 className="text-2xl font-bold text-(--black)">Folios Whose Figures Don&apos;t Match<Tip id="accounting.balance.figures" /></h3>
                <p className={`text-xl ${page.muted}`}>
                  Their balance adds up, so what is owed is right - but the Charged or Paid figure the folio shows doesn&apos;t match its records.
                </p>
                <div className={table.card}>
                  <div className={table.scroll}>
                    <table className={table.el}>
                      <thead>
                        <tr className={table.headRow}>
                          <th className={`${table.th} ${table.stickyTh}`}>Folio<Tip id="accounting.balance.col.folio" /></th>
                          <th className={`${table.th} text-right!`}>Charged Figure<Tip id="accounting.balance.col.chargedFigure" /></th>
                          <th className={`${table.th} text-right!`}>Paid Figure<Tip id="accounting.balance.col.paidFigure" /></th>
                          <th className={table.th}>Actions<Tip id="accounting.balance.col.actions" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {shown.figure_off.map((f) => (
                          <tr key={f.folio_id} className={table.row}>
                            <td className={`${table.td} ${table.stickyTd}`}>
                              <div className="font-semibold">{f.guest_name || "Guest"}</div>
                              <div className={`text-lg ${page.muted}`}>{f.folio_number}</div>
                            </td>
                            <td className={`${table.td} text-right!`}>
                              <div>{money(f.total_amount)}</div>
                              {f.charged_difference !== 0 && <div className="text-lg text-red-600">its lines: {signed(f.charged)}</div>}
                            </td>
                            <td className={`${table.td} text-right!`}>
                              <div>{money(f.amount_paid)}</div>
                              {f.paid_difference !== 0 && <div className="text-lg text-red-600">should be {signed(f.total_amount - f.balance)}</div>}
                            </td>
                            <td className={table.td}>
                              <div className={table.actions}>
                                <button type="button" onClick={() => openFolio(f.folio_id)} className={btn.rowPrimary}>Folio</button>
                                <AuditLink audit={auditFor({ search: f.guest_name || f.folio_number, from: f.opened, to: shown.today })} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        )
      )}
    </section>
  );
}
