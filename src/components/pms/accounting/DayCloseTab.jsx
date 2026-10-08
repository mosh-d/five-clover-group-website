"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/pms/Modal";
import Notice from "@/components/pms/Notice";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import Pagination from "@/components/pms/Pagination";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { Tip } from "@/components/pms/Tip";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDateTime, money } from "@/lib/pms/format";
import { fetchAccountingDay, fetchAccountingDays, signOffAccountingDay } from "@/lib/pms/api/accounting-api";

// Day Close (Accounting, Step 1): each business day (6am to 6am), signed off
// by the accountant once checked - a record that it was checked, not a lock
// (owner, 2026-10-08). A signed-off day whose figures move later (a charge
// dated into it afterwards) shows as changed, and is signed off again with a
// note. Ten days a page.

const dayText = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(",", "");

const STATUS = {
  open: { label: "Open", className: "bg-black/5 text-(--text-color)/76" },
  signed_off: { label: "Signed off", className: "bg-green-100 text-green-800" },
  changed: { label: "Changed after sign-off", className: "bg-red-100 text-red-700" },
};

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.open;
  return <span className={`inline-block px-3 py-1 rounded-full text-lg font-bold whitespace-nowrap ${s.className}`}>{s.label}</span>;
}

const amount = (line) => (line.unit === "count" ? String(line.amount) : money(line.amount));

const SECTIONS = [
  { key: "money", title: "Money in and out", tip: "accounting.day.money" },
  { key: "credit", title: "Reservation credit taken", tip: "accounting.day.credit" },
  { key: "charges", title: "Charges", tip: "accounting.day.charges" },
  { key: "audit", title: "Night audit", tip: "accounting.day.audit" },
];

// A day's figures, section by section; totals in bold.
function Figures({ lines }) {
  return (
    <div className="flex flex-col gap-6">
      {SECTIONS.map((s) => {
        const rows = lines.filter((l) => l.section === s.key);
        return (
          <section key={s.key} className="flex flex-col gap-2">
            <h3 className="text-2xl font-bold text-(--black)">
              {s.title}
              <Tip id={s.tip} />
            </h3>
            {rows.length === 0 ? (
              <p className={`text-xl ${page.muted}`}>Nothing this day.</p>
            ) : (
              <div className="flex flex-col">
                {rows.map((l) => (
                  <div key={l.key} className={`flex justify-between gap-4 py-2 text-xl border-b border-(--accent-2) last:border-b-0 ${l.total ? "font-bold" : ""}`}>
                    <span>{l.label}</span>
                    <span className={`whitespace-nowrap ${l.amount < 0 ? "text-red-600" : ""}`}>{amount(l)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function DayDialog({ date, onClose, onSignedOff }) {
  const [day, setDay] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [signError, setSignError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAccountingDay(date)
      .then((d) => !cancelled && setDay(d))
      .catch((err) => !cancelled && setError(err.message || "Could not load this day."));
    return () => {
      cancelled = true;
    };
  }, [date]);

  // Signing a changed day off again says what was checked.
  const again = Boolean(day?.signoff);
  const noteMissing = Boolean(day?.needs_note) && !note.trim();

  const signOff = async () => {
    try {
      setBusy(true);
      setSignError(null);
      await signOffAccountingDay(date, note.trim() || undefined);
      onSignedOff(again ? `Signed off ${dayText(date)} again.` : `Signed off ${dayText(date)}.`);
    } catch (err) {
      setSignError(err.message || "Could not sign this day off.");
      setBusy(false);
    }
  };

  return (
    <Modal
      onClose={busy ? undefined : onClose}
      title={dayText(date)}
      subtitle="Business day, 6am to 6am"
      badge={day && <StatusPill status={day.status} />}
      size="lg"
      loading={!day && !error}
      footer={
        day && !confirming && (
          <>
            <button type="button" onClick={onClose} className={btn.secondary}>Close</button>
            {day.can_sign_off && (
              <button type="button" onClick={() => setConfirming(true)} disabled={noteMissing} className={btn.primary}>
                {again ? "Sign off again" : "Sign off this day"}
              </button>
            )}
          </>
        )
      }
    >
      {error && <p className={field.error}>{error}</p>}
      {!day && !error && <LoadingSpinner size="lg" />}
      {day && (
        <div className="flex flex-col gap-8">
          {day.status === "changed" && (
            <div className="flex flex-col gap-4 rounded-xl border-2 border-red-300 bg-red-50 px-6 py-5">
              <p className="text-2xl font-bold text-red-700">
                Changed after sign-off
                <Tip id="accounting.day.changed" />
              </p>
              <p className="text-xl text-red-800">
                Its figures no longer match what was signed off. Check what moved, then sign it off again with a note saying what you checked.
              </p>
              {day.differences.length > 0 && (
                <div className={table.scroll}>
                  <table className="w-full text-xl">
                    <thead>
                      <tr className="text-left text-red-800/80">
                        <th className="py-2 pr-4 font-semibold">Figure<Tip id="accounting.day.diff.figure" /></th>
                        <th className="py-2 pr-4 font-semibold text-right">At sign-off<Tip id="accounting.day.diff.then" /></th>
                        <th className="py-2 pr-4 font-semibold text-right">Now<Tip id="accounting.day.diff.now" /></th>
                        <th className="py-2 font-semibold text-right">Difference<Tip id="accounting.day.diff.difference" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.differences.map((d) => (
                        <tr key={d.key} className="border-t border-red-200">
                          <td className="py-2 pr-4">{d.label}</td>
                          <td className="py-2 pr-4 text-right whitespace-nowrap">{amount({ ...d, amount: d.at_sign_off })}</td>
                          <td className="py-2 pr-4 text-right whitespace-nowrap">{amount({ ...d, amount: d.now })}</td>
                          <td className="py-2 text-right whitespace-nowrap font-bold text-red-700">
                            {d.difference > 0 ? "+" : ""}
                            {amount({ ...d, amount: d.difference })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {day.late_entries.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-bold text-red-800">
                    Posted into this day after it was signed off
                    <Tip id="accounting.day.late" />
                  </p>
                  {day.late_entries.map((e) => (
                    <div key={e.row_key} className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-xl border-t border-red-200 pt-2">
                      <span>
                        <strong>{e.type}</strong> · {e.description} · {e.guest_name || "No guest"}
                        {e.folio_number ? ` (${e.folio_number})` : ""}
                      </span>
                      <span className="whitespace-nowrap">
                        <strong>{money(e.amount)}</strong> · {formatDateTime(e.posted_at)}
                        {e.posted_by ? ` · ${e.posted_by}` : " · the system"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {day.signoff && (
            <p className="text-xl">
              Signed off by <strong>{day.signoff.signed_off_by || "a former account"}</strong> on {formatDateTime(day.signoff.signed_off_at)}
              {day.signoff.note ? <> - &ldquo;{day.signoff.note}&rdquo;</> : null}
              <Tip id="accounting.day.signedOff" />
            </p>
          )}

          {day.night_audit ? (
            <p className={`text-xl ${page.muted}`}>
              Night audit {day.night_audit.auto_run ? "ran by itself" : "run by hand"} at {formatDateTime(day.night_audit.audited_at)}.
            </p>
          ) : null}

          <Figures lines={day.figures} />

          {!day.can_sign_off && day.sign_off_block_reason && day.status === "open" && (
            <p className={field.hint}>{day.sign_off_block_reason}</p>
          )}

          {day.history.length > 1 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-2xl font-bold text-(--black)">
                Earlier sign-offs
                <Tip id="accounting.day.history" />
              </h3>
              {day.history
                .filter((h) => h.superseded_at)
                .map((h) => (
                  <p key={h.id} className={`text-xl ${page.muted}`}>
                    {h.signed_off_by || "A former account"} on {formatDateTime(h.signed_off_at)}
                    {h.note ? <> - &ldquo;{h.note}&rdquo;</> : null}
                  </p>
                ))}
            </section>
          )}

          {day.can_sign_off && (
            <div className="flex flex-col gap-2">
              <label htmlFor="signoff-note" className={field.label}>
                {day.needs_note ? "What did you check?" : "Note (optional)"}
                <Tip id="accounting.day.note" />
              </label>
              <AutoGrowTextarea id="signoff-note" value={note} onChange={(e) => setNote(e.target.value)} className={field.textarea} disabled={busy || confirming} />
            </div>
          )}

          {confirming && (
            <ConfirmPanel
              question={again ? `Sign off ${dayText(date)} again?` : `Sign off ${dayText(date)}?`}
              details={[
                "The figures above are recorded as checked, under your name.",
                again
                  ? "The earlier sign-off is kept in this day's history."
                  : "If anything is charged into this day later, it will show here as changed.",
              ]}
              confirmLabel={again ? "Yes, sign it off again" : "Yes, sign it off"}
              busyLabel="Signing off..."
              busy={busy}
              error={signError}
              onBack={() => {
                setConfirming(false);
                setSignError(null);
              }}
              onConfirm={signOff}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

export default function DayCloseTab() {
  const [pageNo, setPageNo] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(
    () =>
      fetchAccountingDays(pageNo).then(
        (d) => {
          setData(d);
          setError(null);
        },
        (err) => setError(err.message || "Could not load the days."),
      ),
    [pageNo],
  );

  useEffect(() => {
    let cancelled = false;
    fetchAccountingDays(pageNo).then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the days."),
    );
    return () => {
      cancelled = true;
    };
  }, [pageNo]);
  // Again when the live connection comes back.
  useLiveRefresh(load, []);

  const days = data?.days || [];
  const changedDays = data?.changed_days || [];
  const ready = data?.ready_to_sign_off || 0;

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          Day Close
          <Tip id="accounting.dayClose" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          Sign off each business day once you have checked it. If anything is charged into a signed-off day later, it shows here as changed.
        </p>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {data && (changedDays.length > 0 || ready > 0) && (
        <div className="flex flex-wrap items-center gap-3">
          {changedDays.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 rounded-lg bg-red-100 text-red-700">
              <span className="text-xl font-bold">
                {changedDays.length} signed-off day{changedDays.length === 1 ? "" : "s"} changed:
              </span>
              {changedDays.map((d) => (
                <button key={d} type="button" onClick={() => setOpen(d)} className="text-xl font-semibold underline underline-offset-4 cursor-pointer">
                  {dayText(d)}
                </button>
              ))}
            </div>
          )}
          {ready > 0 && (
            <span className="px-4 py-2 rounded-lg text-xl font-semibold bg-black/5">
              {ready} day{ready === 1 ? "" : "s"} ready to sign off
            </span>
          )}
        </div>
      )}

      {!data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data && (
          <div className={table.card}>
            <div className={table.scroll}>
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Business Day<Tip id="accounting.days.col.day" /></th>
                    <th className={`${table.th} hidden md:table-cell`}>Night Audit<Tip id="accounting.days.col.audit" /></th>
                    <th className={`${table.th} text-right! hidden md:table-cell`}>Collected<Tip id="accounting.days.col.collected" /></th>
                    <th className={`${table.th} text-right! hidden md:table-cell`}>Charged<Tip id="accounting.days.col.charged" /></th>
                    <th className={table.th}>Status<Tip id="accounting.days.col.status" /></th>
                    <th className={table.th}>Actions<Tip id="accounting.days.col.actions" /></th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d.date} className={table.row}>
                      <td className={`${table.td} ${table.stickyTd} font-semibold`}>{dayText(d.date)}</td>
                      <td className={`${table.td} hidden md:table-cell`}>
                        {d.night_audit ? (
                          <span className={page.muted}>{d.night_audit.auto_run ? "Ran by itself" : "Run by hand"}</span>
                        ) : (
                          <span className="text-orange-600 font-semibold">Not run yet</span>
                        )}
                      </td>
                      <td className={`${table.td} text-right! hidden md:table-cell`}>{money(d.collected)}</td>
                      <td className={`${table.td} text-right! hidden md:table-cell`}>{money(d.charged)}</td>
                      <td className={table.td}>
                        <div className="flex flex-col items-start gap-1">
                          <StatusPill status={d.status} />
                          {d.status !== "open" && d.signed_off_by && (
                            <span className={`text-lg ${page.muted}`}>{d.signed_off_by}</span>
                          )}
                        </div>
                      </td>
                      <td className={table.td}>
                        <button type="button" onClick={() => setOpen(d.date)} className={d.status === "changed" || d.can_sign_off ? btn.rowPrimary : btn.rowSecondary}>
                          {d.status === "changed" ? "See what changed" : d.can_sign_off ? "Review and sign off" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {data && <Pagination page={data.page} totalPages={data.total_pages} onPage={setPageNo} className="mt-0" />}

      {open && (
        <DayDialog
          date={open}
          onClose={() => setOpen(null)}
          onSignedOff={(message) => {
            setOpen(null);
            setNotice(message);
            load();
          }}
        />
      )}
    </section>
  );
}
