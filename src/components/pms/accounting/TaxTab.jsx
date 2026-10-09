"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import { Tip } from "@/components/pms/Tip";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { money } from "@/lib/pms/format";
import { businessDateISO } from "@/lib/pms/dates";
import { fetchTaxAndService } from "@/lib/pms/api/accounting-api";

// Tax & Service (Accounting, Step 9): the service charge on food and drink -
// guests' and non-guests' - and any tax typed on a charge, by business day
// and by type, for paying them over. Tax is only what staff typed, so every
// taxed line is listed to be checked. Read-only.

const SERVICE_COLUMNS = [
  { key: "guest_food", label: "Guest Food", tip: "accounting.tax.col.guestFood" },
  { key: "guest_drinks", label: "Guest Drinks", tip: "accounting.tax.col.guestDrinks" },
  { key: "non_guest_food", label: "Non-Guest Food", tip: "accounting.tax.col.nonGuestFood" },
  { key: "non_guest_drinks", label: "Non-Guest Drinks", tip: "accounting.tax.col.nonGuestDrinks" },
];

const dayText = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(",", "");
const shortDay = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).replace(",", "");
const signed = (v) => (v < 0 ? `-${money(-v)}` : money(v));
// The By Day table's money columns, a little narrower so all seven fit a laptop.
const num = "text-right! px-6!";
const cell = (v) => (v ? signed(v) : "-");

function downloadCsv(view) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["Day", ...SERVICE_COLUMNS.map((c) => `Service charge - ${c.label}`), "Service charge", "Tax"]];
  for (const d of view.days) lines.push([d.date, ...SERVICE_COLUMNS.map((c) => d.service[c.key]), d.service.total, d.tax]);
  lines.push(["Total", ...SERVICE_COLUMNS.map((c) => view.totals.service[c.key]), view.totals.service.total, view.totals.tax]);
  if (view.tax_lines.length) {
    lines.push([]);
    lines.push(["Taxed charge - day", "Folio", "Guest", "Charge", "Description", "Charged", "Tax", "Posted by"]);
    for (const t of view.tax_lines) lines.push([t.day, t.folio_number, t.guest_name, t.type, t.description, t.amount, t.tax, t.posted_by]);
  }
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tax_and_service_${view.from}_to_${view.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TaxTab() {
  const router = useRouter();
  const today = businessDateISO();
  const [from, setFrom] = useState(() => `${businessDateISO().slice(0, 7)}-01`);
  const [to, setTo] = useState(() => businessDateISO());
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const ready = Boolean(from && to && to >= from);

  const load = useCallback(
    () =>
      ready
        ? fetchTaxAndService(from, to).then(
            (d) => {
              setView(d);
              setError(null);
            },
            (err) => setError(err.message || "Could not load tax and service charge."),
          )
        : Promise.resolve(),
    [from, to, ready],
  );
  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    fetchTaxAndService(from, to).then(
      (d) => {
        if (cancelled) return;
        setView(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load tax and service charge."),
    );
    return () => {
      cancelled = true;
    };
  }, [from, to, ready]);
  useLiveRefresh(load, []);

  // Dates just picked show the spinner until their figures arrive.
  const shown = view && view.from === from && view.to === to ? view : null;

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          Tax &amp; Service
          <Tip id="accounting.tax" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          The service charge on food and drink, and any tax typed on a charge, over a range of business days - to pay them over.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="tax-from" className={field.label}>From<Tip id="accounting.tax.from" /></label>
          <DateInput id="tax-from" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="tax-to" className={field.label}>To<Tip id="accounting.tax.to" /></label>
          <DateInput id="tax-to" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
        </div>
        {shown && (
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
              <span className="px-4 py-2 rounded-lg text-xl bg-black/5"><strong>Service charge</strong>: {signed(shown.totals.service.total)}</span>
              <span className={`px-4 py-2 rounded-lg text-xl ${shown.tax_lines.length ? "bg-orange-100 text-orange-700" : "bg-black/5"}`}>
                <strong>Tax</strong>: {signed(shown.totals.tax)}
                {shown.tax_lines.length ? ` on ${shown.tax_lines.length} charge${shown.tax_lines.length === 1 ? "" : "s"}` : ""}
              </span>
              <Tip id="accounting.tax.totals" />
            </div>

            {/* ---- By day */}
            <section className="w-full flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-(--black)">By Day<Tip id="accounting.tax.daily" /></h3>
              <div className={table.card}>
                <div className={table.scroll}>
                  <table className={table.el}>
                    <thead>
                      <tr className={table.headRow}>
                        <th className={`${table.th} ${table.stickyTh}`}>Day<Tip id="accounting.tax.col.day" /></th>
                        {SERVICE_COLUMNS.map((c) => (
                          <th key={c.key} className={`${table.th} ${num}`}>{c.label}<Tip id={c.tip} /></th>
                        ))}
                        <th className={`${table.th} ${num}`}>Service Charge<Tip id="accounting.tax.col.service" /></th>
                        <th className={`${table.th} ${num}`}>Tax<Tip id="accounting.tax.col.tax" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.days.map((d) => (
                        <tr key={d.date} className={table.row}>
                          <td className={`${table.td} ${table.stickyTd}`}>
                            {shortDay(d.date)}
                            {d.date === shown.today && <span className={`text-lg ${page.muted}`}> (so far)</span>}
                          </td>
                          {SERVICE_COLUMNS.map((c) => (
                            <td key={c.key} className={`${table.td} ${num}`}>{cell(d.service[c.key])}</td>
                          ))}
                          <td className={`${table.td} ${num} font-bold`}>{cell(d.service.total)}</td>
                          <td className={`${table.td} ${num} ${d.tax ? "font-bold text-orange-700" : ""}`}>{cell(d.tax)}</td>
                        </tr>
                      ))}
                      <tr className={`${table.row} bg-(--text-color)/3`}>
                        <td className={`${table.td} ${table.stickyTd} font-bold`}>Total</td>
                        {SERVICE_COLUMNS.map((c) => (
                          <td key={c.key} className={`${table.td} ${num} font-bold`}>{signed(shown.totals.service[c.key])}</td>
                        ))}
                        <td className={`${table.td} ${num} font-bold`}>{signed(shown.totals.service.total)}</td>
                        <td className={`${table.td} ${num} font-bold`}>{signed(shown.totals.tax)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ---- Tax, line by line */}
            <section className="w-full flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-(--black)">Charges With Tax<Tip id="accounting.tax.tax" /></h3>
              {shown.tax_lines.length === 0 ? (
                <p className={`text-xl ${page.muted}`}>
                  No tax was typed on any charge in these days. The PMS adds no tax itself: tax is only what staff type on a charge.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    {shown.tax_by_type.map((t) => (
                      <span key={t.type} className="px-4 py-2 rounded-lg text-xl bg-black/5">
                        <strong>{t.label}</strong>: {signed(t.amount)}
                      </span>
                    ))}
                    <Tip id="accounting.tax.byType" />
                  </div>
                  <div className={table.card}>
                    <div className={table.scroll}>
                      <table className={table.el}>
                        <thead>
                          <tr className={table.headRow}>
                            <th className={`${table.th} ${table.stickyTh}`}>Day<Tip id="accounting.tax.lines.col.when" /></th>
                            <th className={table.th}>Folio<Tip id="accounting.tax.lines.col.folio" /></th>
                            <th className={table.th}>Charge<Tip id="accounting.tax.lines.col.charge" /></th>
                            <th className={`${table.th} text-right!`}>Charged<Tip id="accounting.tax.lines.col.charged" /></th>
                            <th className={`${table.th} text-right!`}>Tax<Tip id="accounting.tax.lines.col.tax" /></th>
                            <th className={`${table.th} hidden md:table-cell`}>Posted By<Tip id="accounting.tax.lines.col.by" /></th>
                            <th className={table.th}>Actions<Tip id="accounting.tax.lines.col.actions" /></th>
                          </tr>
                        </thead>
                        <tbody>
                          {shown.tax_lines.map((t) => (
                            <tr key={t.id} className={table.row}>
                              <td className={`${table.td} ${table.stickyTd}`}>{dayText(t.day)}</td>
                              <td className={table.td}>
                                <div className="font-semibold">{t.guest_name || "Guest"}</div>
                                <div className={`text-lg ${page.muted}`}>{t.folio_number}</div>
                              </td>
                              <td className={`${table.td} whitespace-normal!`}>
                                <div className="font-semibold">{t.type}</div>
                                <div className={`text-lg ${page.muted}`}>{t.description}</div>
                              </td>
                              <td className={`${table.td} text-right!`}>{signed(t.amount)}</td>
                              <td className={`${table.td} text-right! font-bold text-orange-700`}>{signed(t.tax)}</td>
                              <td className={`${table.td} hidden md:table-cell`}>{t.posted_by || "-"}</td>
                              <td className={table.td}>
                                <button type="button" onClick={() => router.push(`/pms/folios?folio_id=${t.folio_id}`)} className={btn.rowPrimary}>Folio</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </section>
          </>
        )
      )}
    </section>
  );
}
