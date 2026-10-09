"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import { Tip } from "@/components/pms/Tip";
import { AbbrLabel } from "@/components/pms/InfoTip";
import { AuditLink } from "@/components/pms/reportUi";
import { auditFor } from "./audit";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDateTime, money, pct } from "@/lib/pms/format";
import { addDaysISO, businessDateISO } from "@/lib/pms/dates";
import { downloadFlashReport, fetchFlashReport } from "@/lib/pms/api/accounting-api";

// Flash Report (Accounting, Step 7): a business day, the month to it and the
// year to it - rooms, revenue and money in, beside the same dates last year
// once the books go back that far - and what is owed to the branch and the
// credit it holds as things stand now. Head Office's Metrics for this branch
// alone; read-only, with an Excel download.

const SECTIONS = [
  { key: "rooms", label: "Rooms" },
  { key: "revenue", label: "Revenue" },
  { key: "money", label: "Money In" },
];
// Rows whose (i) explains an abbreviation instead (ADR, RevPAR, OTA).
const ABBREVIATED = { "rooms.adr": "ADR", "rooms.revpar": "RevPAR", "money.ota": "OTA" };
// What each "now" figure counts, for "3 guests" under it.
const OWED_COUNTS = { in_house: ["guest", "guests"], left: ["guest", "guests"], non_guest: ["bill", "bills"], ota: ["stay", "stays"] };
const CREDIT_COUNTS = { reservation: ["credit", "credits"], non_guest: ["credit", "credits"] };

const dayText = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(",", "");
const shortDay = (iso, withYear) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });
const span = (c) => {
  if (!c.from) return "No records";
  const last = c.year === "last";
  return c.from === c.to ? shortDay(c.from, last) : `${shortDay(c.from, false)} - ${shortDay(c.to, last)}`;
};
const signedMoney = (v) => (v < 0 ? `-${money(-v)}` : money(v));
const valueText = (unit, v) => {
  if (v === null || v === undefined) return "-";
  if (unit === "money") return signedMoney(v);
  if (unit === "pct") return pct(v);
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
};
const counted = (n, [one, many] = ["item", "items"]) => `${n} ${n === 1 ? one : many}`;

function Snapshot({ title, tip, rows, total, counts, tab, linkText }) {
  const router = useRouter();
  return (
    <div className={table.card}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-8 py-4 border-b border-(--accent-2) bg-(--text-color)/3">
        <h3 className="text-2xl font-bold text-(--black)">{title}<Tip id={tip} /></h3>
        <button type="button" className={btn.link} onClick={() => router.replace(`/pms/accounting?tab=${tab}`, { scroll: false })}>
          {linkText}
        </button>
      </div>
      <table className="w-full border-collapse text-2xl">
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={table.row}>
              <td className={`${table.td} whitespace-normal!`}>
                <div>
                  {r.key === "ota" ? <AbbrLabel term="OTA" label={r.label} /> : r.label}
                  {r.key !== "ota" && <Tip id={`${tip}.${r.key}`} />}
                </div>
                <div className={`text-lg ${page.muted}`}>{counted(r.count, counts[r.key])}</div>
              </td>
              <td className={`${table.td} text-right! font-bold`}>{money(r.amount)}</td>
            </tr>
          ))}
          <tr className={table.row}>
            <td className={`${table.td} font-bold`}>Total</td>
            <td className={`${table.td} text-right! font-bold`}>{money(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function FlashTab() {
  const today = businessDateISO();
  const [day, setDay] = useState(() => addDaysISO(businessDateISO(), -1));
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const load = useCallback(
    () =>
      day
        ? fetchFlashReport(day).then(
            (d) => {
              setView(d);
              setError(null);
            },
            (err) => setError(err.message || "Could not load the flash report."),
          )
        : Promise.resolve(),
    [day],
  );
  useEffect(() => {
    if (!day) return undefined;
    let cancelled = false;
    fetchFlashReport(day).then(
      (d) => {
        if (cancelled) return;
        setView(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the flash report."),
    );
    return () => {
      cancelled = true;
    };
  }, [day]);
  useLiveRefresh(load, []);

  const download = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadFlashReport(view.date);
    } catch (err) {
      setDownloadError(err.message || "Could not download the flash report.");
    } finally {
      setDownloading(false);
    }
  };

  // A day just picked shows the spinner until its report arrives.
  const shown = view && view.date === day ? view : null;
  const cols = shown ? shown.columns.map((c, i) => ({ ...c, i })).filter((c) => shown.has_last_year || c.year === "this") : [];
  const cutShort = cols.filter((c) => c.cut_short && c.year === "this");
  const rf = view?.records_from;

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          Flash Report
          <Tip id="accounting.flash" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          A business day, the month to it and the year to it: rooms, revenue and money in, beside the same days last year - and what is owed and held now.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="flash-day" className={field.label}>Day<Tip id="accounting.flash.day" /></label>
          <DateInput id="flash-day" value={day} min={rf || undefined} max={today} onChange={(e) => setDay(e.target.value)} />
        </div>
        {shown && (
          <button type="button" onClick={download} disabled={downloading} className={btn.secondary}>
            {downloading ? "Downloading..." : "Download Excel"}
          </button>
        )}
      </div>

      {error && <p className={`${field.error} w-full`}>{error}</p>}
      {downloadError && <p className={`${field.error} w-full`}>{downloadError}</p>}

      {!day ? (
        <p className={`text-xl ${page.muted}`}>Pick a day.</p>
      ) : !shown && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        shown && (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-2xl font-bold text-(--black)">
                {dayText(view.date)}
                {view.date === view.today ? " (today, so far)" : ""}
              </p>
              {view.date === view.today && (
                <p className={`text-xl ${page.muted}`}>Today hasn&apos;t ended: tonight&apos;s room charges come with the night audit at 6am.</p>
              )}
              {cutShort.length > 0 && (
                <p className={`text-xl ${page.muted}`}>
                  The books start on {dayText(rf)}, so {cutShort.map((c) => c.label).join(" and ")} {cutShort.length === 1 ? "runs" : "run"} from then.
                </p>
              )}
              {!view.has_last_year && rf && (
                <p className={`text-xl ${page.muted}`}>
                  Last year&apos;s figures show beside these once the books go back a year, from {dayText(`${Number(rf.slice(0, 4)) + 1}${rf.slice(4)}`)}.
                </p>
              )}
            </div>

            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`${table.th} ${table.stickyTh}`}>Figure<Tip id="accounting.flash.col.figure" /></th>
                      {cols.map((c) => (
                        <th key={`${c.key}-${c.year}`} className={`${table.th} text-right!`}>
                          <div>
                            {c.key === "day" && c.year === "this" && view.date === view.today ? "Today So Far" : c.label}
                            {c.year === "this" && <Tip id={`accounting.flash.col.${c.key}`} />}
                          </div>
                          {view.has_last_year && <div>{c.year === "this" ? "This Year" : "Last Year"}</div>}
                          <div className="text-lg font-normal normal-case tracking-normal">{span(c)}</div>
                          {c.from && (
                            <div className="normal-case tracking-normal">
                              <AuditLink audit={auditFor({ from: c.from, to: c.to })} />
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SECTIONS.map((s) => (
                      <Fragment key={s.key}>
                        <tr className={table.headRow}>
                          <th scope="colgroup" colSpan={cols.length + 1} className="px-8 py-3 text-left text-xl font-bold text-(--black)">
                            {s.label}
                            <Tip id={`accounting.flash.${s.key}`} />
                          </th>
                        </tr>
                        {view.lines
                          .filter((l) => l.section === s.key)
                          .map((l) => (
                            <tr key={l.key} className={table.row}>
                              <td className={`${table.td} ${table.stickyTd} ${l.total ? "font-bold" : ""}`}>
                                {ABBREVIATED[l.key] ? <AbbrLabel term={ABBREVIATED[l.key]} label={l.label} /> : l.label}
                                {!ABBREVIATED[l.key] && <Tip id={`accounting.flash.${l.key}`} />}
                              </td>
                              {cols.map((c) => {
                                const v = l.values[c.i];
                                return (
                                  <td key={c.i} className={`${table.td} text-right! ${l.total ? "font-bold" : ""} ${v < 0 ? "text-red-600" : ""}`}>
                                    {valueText(l.unit, v)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <Snapshot title="Owed to the Branch, Now" tip="accounting.flash.owed" rows={view.owed.rows} total={view.owed.total} counts={OWED_COUNTS} tab="receivables" linkText="Open Receivables" />
              <Snapshot title="Credit Held, Now" tip="accounting.flash.credit" rows={view.credit.rows} total={view.credit.total} counts={CREDIT_COUNTS} tab="deposits" linkText="Open Deposits" />
            </div>
            <p className={`text-xl ${page.muted}`}>
              Owed and held are as things stand now ({formatDateTime(view.as_at)}), whichever day is chosen above.
            </p>
          </>
        )
      )}
    </section>
  );
}
