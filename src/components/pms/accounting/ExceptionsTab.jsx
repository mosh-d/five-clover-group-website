"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/pms/Modal";
import Notice from "@/components/pms/Notice";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import DateInput from "@/components/pms/DateInput";
import Pagination from "@/components/pms/Pagination";
import { Tip } from "@/components/pms/Tip";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDateTime, formatTime, money } from "@/lib/pms/format";
import { addDaysISO, businessDateISO } from "@/lib/pms/dates";
import { fetchExceptions, reviewExceptions } from "@/lib/pms/api/accounting-api";

// Exceptions (Accounting, Step 3): every way money was given back or taken
// off - refunds, credit refunds, adjustments, corrections, rates below the
// standard price, rooms made complementary, free food and drink - line by
// line, for a range of business days. The accountant marks each line OK or
// flags it for the manager (who sees it on Alerts). Unreviewed lines show
// first.

const PAGE_SIZE = 10;
const SHOW = [
  { key: "unreviewed", label: "Not reviewed" },
  { key: "flagged", label: "Flagged for the manager" },
  { key: "ok", label: "OK" },
  { key: "all", label: "All" },
];

const dayText = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(",", "");
const amountText = (v) => (v === null || v === undefined ? "-" : v < 0 ? `-${money(-v)}` : money(v));

function ReviewPill({ review }) {
  if (!review) return <span className="inline-block px-3 py-1 rounded-full text-lg font-bold whitespace-nowrap bg-black/5 text-(--text-color)/76">Not reviewed</span>;
  return review.status === "flagged" ? (
    <span className="inline-block px-3 py-1 rounded-full text-lg font-bold whitespace-nowrap bg-red-100 text-red-700">Flagged</span>
  ) : (
    <span className="inline-block px-3 py-1 rounded-full text-lg font-bold whitespace-nowrap bg-green-100 text-green-800">OK</span>
  );
}

// The range's lines as a spreadsheet.
function downloadCsv(view) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Business day", "When", "What", "Details", "Amount", "By", "Guest", "Reference", "Reason", "Review", "Reviewed by", "Review note"]];
  for (const l of view.lines) {
    rows.push([
      l.day, l.at, l.kind_label, l.details, l.amount ?? "", l.by || "", l.guest || "", l.reference || "", l.reason || "",
      l.review ? (l.review.status === "flagged" ? "Flagged" : "OK") : "Not reviewed", l.review?.by || "", l.review?.note || "",
    ]);
  }
  const blob = new Blob([rows.map((r) => r.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `exceptions_${view.from}_to_${view.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ReviewDialog({ status, lines, from, to, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const flag = status === "flagged";
  const count = lines.length === 1 ? "this exception" : `these ${lines.length} exceptions`;

  const submit = async () => {
    try {
      setBusy(true);
      setError(null);
      await reviewExceptions({ from, to, keys: lines.map((l) => l.key), status, note: note.trim() || undefined });
      const n = lines.length === 1 ? "an exception" : `${lines.length} exceptions`;
      onDone(flag ? `Flagged ${n} for the manager.` : `Marked ${n} OK.`);
    } catch (err) {
      setError(err.message || "Could not save the review.");
      setBusy(false);
    }
  };

  return (
    <Modal
      onClose={busy ? undefined : onClose}
      title={flag ? "Flag for the Manager" : "Mark OK"}
      subtitle={`${lines.length} line${lines.length === 1 ? "" : "s"}`}
      size="md"
      footer={
        !confirming && (
          <>
            <button type="button" onClick={onClose} className={btn.secondary}>Close</button>
            <button type="button" onClick={() => setConfirming(true)} className={flag ? btn.dangerSolid : btn.primary}>
              {flag ? "Flag them" : "Mark them OK"}
            </button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-6">
        <ul className="flex flex-col gap-2">
          {lines.slice(0, 8).map((l) => (
            <li key={l.key} className="text-xl">
              <strong>{l.kind_label}</strong> {amountText(l.amount)} · {l.guest || l.reference || "-"} · {l.by || "-"}
            </li>
          ))}
          {lines.length > 8 && <li className={`text-xl ${page.muted}`}>and {lines.length - 8} more</li>}
        </ul>
        <div className="flex flex-col gap-2">
          <label htmlFor="exception-note" className={field.label}>
            Note (optional)
            <Tip id="accounting.exceptions.note" />
          </label>
          <AutoGrowTextarea id="exception-note" value={note} onChange={(e) => setNote(e.target.value)} className={field.textarea} disabled={busy || confirming} />
        </div>
        {confirming && (
          <ConfirmPanel
            question={flag ? `Flag ${count} for the manager?` : `Mark ${count} OK?`}
            details={
              flag
                ? ["The manager sees them on Alerts, with your note.", "You can mark them OK later, once it is sorted out."]
                : ["Records that you have checked them, under your name.", "You can change it later."]
            }
            confirmLabel={flag ? "Yes, flag them" : "Yes, mark them OK"}
            busyLabel="Saving..."
            busy={busy}
            danger={flag}
            error={error}
            onBack={() => {
              setConfirming(false);
              setError(null);
            }}
            onConfirm={submit}
          />
        )}
      </div>
    </Modal>
  );
}

export default function ExceptionsTab() {
  const today = businessDateISO();
  const [from, setFrom] = useState(() => addDaysISO(businessDateISO(), -6));
  const [to, setTo] = useState(() => businessDateISO());
  const [show, setShow] = useState("unreviewed");
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [reviewing, setReviewing] = useState(null);

  const ready = Boolean(from && to && to >= from);
  const load = useCallback(
    () =>
      ready
        ? fetchExceptions(from, to, show).then(
            (d) => {
              setView(d);
              setError(null);
            },
            (err) => setError(err.message || "Could not load the exceptions."),
          )
        : Promise.resolve(),
    [from, to, show, ready],
  );

  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    fetchExceptions(from, to, show).then(
      (d) => {
        if (cancelled) return;
        setView(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the exceptions."),
    );
    return () => {
      cancelled = true;
    };
  }, [from, to, show, ready]);
  useLiveRefresh(load, []);

  // A new range or filter starts on its first page, with nothing ticked.
  const reset = () => {
    setPageNo(1);
    setSelected(new Set());
  };

  const lines = view?.lines || [];
  const totalPages = Math.max(1, Math.ceil(lines.length / PAGE_SIZE));
  const current = Math.min(pageNo, totalPages);
  const shown = lines.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const picked = lines.filter((l) => selected.has(l.key));
  const allShownPicked = shown.length > 0 && shown.every((l) => selected.has(l.key));
  const toggle = (key) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const toggleShown = () =>
    setSelected((s) => {
      const next = new Set(s);
      shown.forEach((l) => (allShownPicked ? next.delete(l.key) : next.add(l.key)));
      return next;
    });

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          Exceptions
          <Tip id="accounting.exceptions" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          Every way money was given back or taken off, line by line. Mark each one OK once you have checked it, or flag it for the manager.
        </p>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="exceptions-from" className={field.label}>From<Tip id="accounting.exceptions.from" /></label>
          <DateInput id="exceptions-from" value={from} max={to || today} onChange={(e) => { setFrom(e.target.value); reset(); }} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="exceptions-to" className={field.label}>To<Tip id="accounting.exceptions.to" /></label>
          <DateInput id="exceptions-to" value={to} min={from} max={today} onChange={(e) => { setTo(e.target.value); reset(); }} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="exceptions-show" className={field.label}>Show<Tip id="accounting.exceptions.show" /></label>
          <select id="exceptions-show" value={show} onChange={(e) => { setShow(e.target.value); reset(); }} className={field.select}>
            {SHOW.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}{view ? ` (${view.counts[s.key]})` : ""}
              </option>
            ))}
          </select>
        </div>
        {view && lines.length > 0 && (
          <button type="button" onClick={() => downloadCsv(view)} className={btn.secondary}>Download CSV</button>
        )}
      </div>

      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {view && (
        <div className="flex flex-wrap gap-3">
          {view.totals.filter((g) => g.count > 0).map((g) => (
            <span key={g.group} className="px-4 py-2 rounded-lg text-xl bg-black/5">
              <strong>{g.label}</strong>: {g.count}{g.amount > 0 ? ` · ${money(g.amount)}` : ""}
            </span>
          ))}
          <Tip id="accounting.exceptions.totals" />
        </div>
      )}

      {picked.length > 0 && (
        <div className="w-full flex flex-wrap items-center gap-3 px-5 py-3 rounded-xl border border-(--accent-2) bg-(--card)">
          <span className="text-xl font-semibold">{picked.length} selected</span>
          <button type="button" onClick={() => setReviewing("ok")} className={btn.rowSuccess}>Mark OK</button>
          <button type="button" onClick={() => setReviewing("flagged")} className={btn.rowDanger}>Flag for the manager</button>
          <button type="button" onClick={() => setSelected(new Set())} className={btn.rowSecondary}>Clear</button>
        </div>
      )}

      {!view && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        view && (
          <>
            {lines.length === 0 ? (
              <p className={`text-xl ${page.muted}`}>
                {view.counts.all === 0 ? "Nothing was given back or taken off in these days." : `No ${SHOW.find((s) => s.key === show)?.label.toLowerCase()} lines in these days.`}
              </p>
            ) : (
              <div className={table.card}>
                <div className={table.scroll}>
                  <table className={table.el}>
                    <thead>
                      <tr className={table.headRow}>
                        <th className={`${table.th} w-12`}>
                          <input type="checkbox" aria-label="Select every line on this page" checked={allShownPicked} onChange={toggleShown} className="w-5 h-5 cursor-pointer" />
                        </th>
                        <th className={table.th}>When<Tip id="accounting.exceptions.col.when" /></th>
                        <th className={table.th}>What<Tip id="accounting.exceptions.col.what" /></th>
                        <th className={`${table.th} text-right!`}>Amount<Tip id="accounting.exceptions.col.amount" /></th>
                        <th className={`${table.th} hidden md:table-cell`}>By<Tip id="accounting.exceptions.col.by" /></th>
                        <th className={`${table.th} hidden lg:table-cell`}>Guest / Bill<Tip id="accounting.exceptions.col.guest" /></th>
                        <th className={`${table.th} hidden lg:table-cell`}>Reason<Tip id="accounting.exceptions.col.reason" /></th>
                        <th className={table.th}>Review<Tip id="accounting.exceptions.col.review" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((l) => (
                        <tr key={l.key} className={table.row}>
                          <td className={table.td}>
                            <input type="checkbox" aria-label={`Select ${l.kind_label} ${amountText(l.amount)}`} checked={selected.has(l.key)} onChange={() => toggle(l.key)} className="w-5 h-5 cursor-pointer" />
                          </td>
                          <td className={table.td}>
                            <div className="font-semibold">{dayText(l.day)}</div>
                            <div className={`text-lg ${page.muted}`}>{formatTime(l.at)}</div>
                          </td>
                          <td className={`${table.td} whitespace-normal! min-w-[16rem]`}>
                            <div className="font-semibold">{l.kind_label}</div>
                            <div className={`text-lg ${page.muted}`}>{l.details}</div>
                            <div className={`text-lg md:hidden ${page.muted}`}>{[l.by, l.guest || l.reference].filter(Boolean).join(" · ")}</div>
                          </td>
                          <td className={`${table.td} text-right!`}>
                            <div className={`font-bold ${l.amount !== null && l.amount < 0 ? "text-red-600" : ""}`}>{amountText(l.amount)}</div>
                            {l.amount_note && <div className={`text-lg ${page.muted}`}>{l.amount_note}</div>}
                          </td>
                          <td className={`${table.td} hidden md:table-cell`}>{l.by || "-"}</td>
                          <td className={`${table.td} hidden lg:table-cell`}>
                            <div>{l.guest || "-"}</div>
                            {l.reference && <div className={`text-lg ${page.muted}`}>{l.reference}</div>}
                          </td>
                          <td className={`${table.td} hidden lg:table-cell whitespace-normal! max-w-[20rem]`}>{l.reason || <span className={page.muted}>-</span>}</td>
                          <td className={`${table.td} whitespace-normal!`}>
                            <ReviewPill review={l.review} />
                            {l.review && (
                              <div className={`text-lg mt-1 ${page.muted}`} title={formatDateTime(l.review.at)}>
                                {l.review.by || "a former account"}{l.review.note ? `: ${l.review.note}` : ""}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <Pagination page={current} totalPages={totalPages} onPage={setPageNo} className="mt-0" />
          </>
        )
      )}

      {reviewing && view && (
        <ReviewDialog
          status={reviewing}
          lines={picked}
          from={view.from}
          to={view.to}
          onClose={() => setReviewing(null)}
          onDone={(message) => {
            setReviewing(null);
            setNotice(message);
            setSelected(new Set());
            load();
          }}
        />
      )}
    </section>
  );
}
