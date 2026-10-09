"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/pms/Modal";
import Notice from "@/components/pms/Notice";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import DateInput from "@/components/pms/DateInput";
import { Tip } from "@/components/pms/Tip";
import { AuditLink } from "@/components/pms/reportUi";
import { auditFor } from "./audit";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, card, field, page, table } from "@/components/pms/ui";
import { formatDateTime, money } from "@/lib/pms/format";
import { addDaysISO, businessDateISO } from "@/lib/pms/dates";
import { fetchCashUpDay, verifyCashUp } from "@/lib/pms/api/cash-up-api";

// Cash-Up (Accounting, Step 2): per person, what the system expects them to
// hold for a business day - money they took and reservation credit, less
// refunds, credit refunds and their paid-outs - beside what they counted
// (blind). The accountant verifies a submitted count once checked; it can't
// change after.

const dayText = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(",", "");

// "-₦1,000.00" short, "+₦500.00" over.
const amountText = (v) => (v < 0 ? `-${money(-v)}` : money(v));
const signed = (v) => `${v > 0 ? "+" : ""}${amountText(v)}`;
const diffClass = (v) => (v === null || v === undefined || Math.abs(v) < 0.005 ? "" : "text-red-600 font-bold");

function StatusPill({ person }) {
  const d = person.declaration;
  const [label, className] = !d
    ? ["No count", "bg-orange-100 text-orange-700"]
    : d.verified_at
      ? ["Verified", "bg-green-100 text-green-800"]
      : ["Counted", "bg-black/5 text-(--text-color)/76"];
  return <span className={`inline-block px-3 py-1 rounded-full text-lg font-bold whitespace-nowrap ${className}`}>{label}</span>;
}

// The day as a spreadsheet: one line per person and method.
function downloadCsv(view) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["Business day", "Person", "Role", "Method", "Expected", "Counted", "Difference", "Status", "Verified by"]];
  for (const p of view.people) {
    const status = !p.declaration ? "No count" : p.declaration.verified_at ? "Verified" : "Counted";
    const verifiedBy = p.declaration?.verified_by || "";
    const rows = p.lines.length ? p.lines : [{ label: "", expected: 0, declared: p.declaration ? 0 : null, difference: p.declaration ? 0 : null }];
    for (const l of rows) lines.push([view.date, p.name, p.role || "", l.label, l.expected, l.declared ?? "", l.difference ?? "", status, verifiedBy]);
    const paidOut = p.paid_outs.filter((x) => !x.cancelled_at).reduce((s, x) => s + x.amount, 0);
    if (paidOut) lines.push([view.date, p.name, p.role || "", "Paid out (included above)", -paidOut, "", "", status, verifiedBy]);
  }
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cash-up_${view.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function VerifyDialog({ person, date, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    try {
      setBusy(true);
      setError(null);
      await verifyCashUp(person.declaration.id, note.trim() || undefined);
      onDone(`Verified ${person.name}'s cash-up for ${dayText(date)}.`);
    } catch (err) {
      setError(err.message || "Could not verify the cash-up.");
      setBusy(false);
    }
  };
  return (
    <Modal
      onClose={busy ? undefined : onClose}
      title={`Verify ${person.name}'s Cash-Up`}
      subtitle={dayText(date)}
      size="md"
      footer={
        !confirming && (
          <>
            <button type="button" onClick={onClose} className={btn.secondary}>Close</button>
            <button type="button" onClick={() => setConfirming(true)} className={btn.primary}>Verify</button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-xl">
          Counted {money(person.declared_total)} against {amountText(person.expected_total)} expected:{" "}
          <span className={diffClass(person.difference_total)}>{signed(person.difference_total)}</span>.
        </p>
        <div className="flex flex-col gap-2">
          <label htmlFor="verify-note" className={field.label}>Review Note (optional)<Tip id="accounting.cashUp.reviewNote" /></label>
          <AutoGrowTextarea id="verify-note" value={note} onChange={(e) => setNote(e.target.value)} className={field.textarea} disabled={busy || confirming} />
        </div>
        {confirming && (
          <ConfirmPanel
            question={`Verify ${person.name}'s cash-up for ${dayText(date)}?`}
            details={["It records that you have checked it, under your name.", `${person.name} can no longer change it, or record or cancel paid-outs for that day.`]}
            confirmLabel="Yes, verify it"
            busyLabel="Verifying..."
            busy={busy}
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

function PersonCard({ person, date, onVerify }) {
  const d = person.declaration;
  // Everything this person did that day.
  const audit = auditFor({ staffId: person.staff_id, from: date });
  const activePaidOuts = person.paid_outs.filter((p) => !p.cancelled_at);
  return (
    <section aria-labelledby={`cashup-person-${person.staff_id}`} className={`w-full ${card.surface} p-6 md:p-8 flex flex-col gap-5`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 id={`cashup-person-${person.staff_id}`} className="text-2xl font-bold text-(--black)">{person.name}</h3>
          {person.role && <span className={`text-xl capitalize ${page.muted}`}>{person.role}</span>}
          <StatusPill person={person} />
        </div>
        {person.can_verify && (
          <button type="button" onClick={() => onVerify(person)} className={btn.rowPrimary}>Verify</button>
        )}
      </div>

      {d && (
        <p className={`text-xl ${page.muted}`}>
          Submitted at {formatDateTime(d.declared_at)}
          {d.note ? <> - &ldquo;{d.note}&rdquo;</> : null}
        </p>
      )}

      {person.lines.length === 0 ? (
        <p className={`text-xl ${page.muted}`}>Nothing taken or counted.</p>
      ) : (
        <div className={table.scroll}>
          <table className="w-full text-xl">
            <thead>
              <tr className="text-left text-(--text-color)/76">
                <th className="py-2 pr-4 font-semibold">Method<Tip id="accounting.cashUp.col.method" /></th>
                <th className="py-2 pr-4 font-semibold text-right">Expected<Tip id="accounting.cashUp.col.expected" /></th>
                <th className="py-2 pr-4 font-semibold text-right">Counted<Tip id="accounting.cashUp.col.declared" /></th>
                <th className="py-2 pr-4 font-semibold text-right">Difference<Tip id="accounting.cashUp.col.difference" /></th>
                <th className="py-2 font-semibold">Action<Tip id="accounting.col.viewLog" /></th>
              </tr>
            </thead>
            <tbody>
              {person.lines.map((l) => (
                <tr key={l.method} className="border-t border-(--accent-2)">
                  <td className="py-2 pr-4">{l.label}</td>
                  <td className={`py-2 pr-4 text-right whitespace-nowrap ${l.expected < 0 ? "text-red-600" : ""}`}>{amountText(l.expected)}</td>
                  <td className="py-2 pr-4 text-right whitespace-nowrap">{l.declared === null ? "-" : money(l.declared)}</td>
                  <td className={`py-2 pr-4 text-right whitespace-nowrap ${diffClass(l.difference)}`}>{l.difference === null ? "-" : signed(l.difference)}</td>
                  <td className="py-2"><AuditLink audit={audit} /></td>
                </tr>
              ))}
              <tr className="border-t-2 border-(--accent-2) font-bold">
                <td className="py-2 pr-4">Total</td>
                <td className="py-2 pr-4 text-right whitespace-nowrap">{amountText(person.expected_total)}</td>
                <td className="py-2 pr-4 text-right whitespace-nowrap">{person.declared_total === null ? "No count" : money(person.declared_total)}</td>
                <td className={`py-2 pr-4 text-right whitespace-nowrap ${diffClass(person.difference_total)}`}>{person.difference_total === null ? "-" : signed(person.difference_total)}</td>
                <td className="py-2"><AuditLink audit={audit} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {person.paid_outs.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold">
            Paid out: {money(activePaidOuts.reduce((s, p) => s + p.amount, 0))}
            <Tip id="accounting.cashUp.paidOuts" />
          </p>
          {person.paid_outs.map((p) => (
            <p key={p.id} className={`text-lg ${p.cancelled_at ? `line-through ${page.muted}` : page.muted}`}>
              {p.label} · {money(p.amount)}
              {p.voucher_number ? ` · voucher ${p.voucher_number}` : ""}
              {p.note ? ` · ${p.note}` : ""}
              {p.cancelled_at ? " · cancelled" : ""}
            </p>
          ))}
        </div>
      )}

      {d?.verified_at && (
        <p className="text-xl">
          Verified by <strong>{d.verified_by || "a former account"}</strong> on {formatDateTime(d.verified_at)}
          {d.review_note ? <> - &ldquo;{d.review_note}&rdquo;</> : null}
          <Tip id="accounting.cashUp.verified" />
        </p>
      )}
    </section>
  );
}

export default function CashUpTab() {
  const today = businessDateISO();
  const [date, setDate] = useState(() => addDaysISO(businessDateISO(), -1));
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [verifying, setVerifying] = useState(null);

  const load = useCallback(
    () =>
      date
        ? fetchCashUpDay(date).then(
            (d) => {
              setView(d);
              setError(null);
            },
            (err) => setError(err.message || "Could not load the cash-up."),
          )
        : Promise.resolve(),
    [date],
  );

  useEffect(() => {
    if (!date) return undefined;
    let cancelled = false;
    fetchCashUpDay(date).then(
      (d) => {
        if (cancelled) return;
        setView(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the cash-up."),
    );
    return () => {
      cancelled = true;
    };
  }, [date]);
  useLiveRefresh(load, []);

  const shown = view && view.date === date ? view : null;

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          Cash-Up
          <Tip id="accounting.cashUp" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          What each person was expected to hold for a business day, beside what they counted. Verify a cash-up once you have checked it; it can&apos;t be changed after.
        </p>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="cashup-date" className={field.label}>Business Day<Tip id="accounting.cashUp.day" /></label>
          <DateInput id="cashup-date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </div>
        {shown && shown.people.length > 0 && (
          <button type="button" onClick={() => downloadCsv(shown)} className={btn.secondary}>Download CSV</button>
        )}
      </div>

      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {shown && (shown.not_declared > 0 || shown.to_verify > 0) && (
        <div className="flex flex-wrap gap-3">
          {shown.not_declared > 0 && (
            <span className="px-4 py-2 rounded-lg text-xl font-semibold bg-orange-100 text-orange-700">
              {shown.not_declared} {shown.not_declared === 1 ? "person" : "people"} took money and didn&apos;t submit a count
            </span>
          )}
          {shown.to_verify > 0 && (
            <span className="px-4 py-2 rounded-lg text-xl font-semibold bg-black/5">
              {shown.to_verify} cash-up{shown.to_verify === 1 ? "" : "s"} to verify
            </span>
          )}
        </div>
      )}

      {!shown && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        shown && (
          <div className="w-full flex flex-col gap-6">
            {!shown.ended && (
              <p className={field.hint}>This business day hasn&apos;t ended yet: its figures can still grow, and its cash-ups can be verified after 6am.</p>
            )}
            {shown.people.length === 0 ? (
              <p className={`text-xl ${page.muted}`}>No money was taken or counted on {dayText(shown.date)}.</p>
            ) : (
              shown.people.map((p) => <PersonCard key={p.staff_id} person={p} date={shown.date} onVerify={setVerifying} />)
            )}
          </div>
        )
      )}

      {verifying && shown && (
        <VerifyDialog
          person={verifying}
          date={shown.date}
          onClose={() => setVerifying(null)}
          onDone={(message) => {
            setVerifying(null);
            setNotice(message);
            load();
          }}
        />
      )}
    </section>
  );
}
