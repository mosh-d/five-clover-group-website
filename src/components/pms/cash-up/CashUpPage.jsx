"use client";

import { useCallback, useEffect, useState } from "react";
import { IoWalletOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import Modal from "@/components/pms/Modal";
import Notice from "@/components/pms/Notice";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { Tip } from "@/components/pms/Tip";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, card, field, page, table } from "@/components/pms/ui";
import { formatDateTime, formatTime, money } from "@/lib/pms/format";
import { cancelPaidOut, declareCashUp, fetchMyCashUp, recordPaidOut } from "@/lib/pms/api/cash-up-api";

// Cash-Up (Accounting, Step 2; owner, 2026-10-08) - a receptionist's or
// waitron's own page. They count what they hold and declare it, per method,
// for today or yesterday (a night shift ends after 6am), without ever seeing
// what the system expects: a blind count, so the count isn't bent to match.
// Optional. Theirs to change until the accountant verifies it. Cash paid out
// of the drawer for a small expense is recorded here too, on the day it
// happens.

const dayText = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(",", "");

const toNumber = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

function DeclarationCard({ data, onDone }) {
  const declaration = data.declaration;
  const initial = () => Object.fromEntries(data.methods.map((m) => [m.key, declaration ? String(declaration.amounts?.[m.key] || "") : ""]));
  const [amounts, setAmounts] = useState(initial);
  const [note, setNote] = useState(declaration?.note || "");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const values = Object.fromEntries(data.methods.map((m) => [m.key, amounts[m.key] === "" ? 0 : toNumber(amounts[m.key])]));
  const invalid = data.methods.find((m) => Number.isNaN(values[m.key]) || values[m.key] < 0);
  const total = Object.values(values).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);

  const submit = async () => {
    try {
      setBusy(true);
      setError(null);
      await declareCashUp(data.date, values, note.trim() || undefined);
      onDone(declaration ? `Changed your cash-up for ${dayText(data.date)}: ${money(total)}.` : `Declared your cash-up for ${dayText(data.date)}: ${money(total)}.`);
    } catch (err) {
      setError(err.message || "Could not declare the cash-up.");
      setBusy(false);
    }
  };

  if (declaration?.verified_at) {
    return (
      <div className={`w-full ${card.surface} p-8 flex flex-col gap-5`}>
        <h2 className={page.sectionTitle}>Your Declaration<Tip id="cashUp.declaration" /></h2>
        <p className="text-xl">
          Verified by <strong>{declaration.verified_by || "a former account"}</strong> on {formatDateTime(declaration.verified_at)}
          {declaration.review_note ? <> - &ldquo;{declaration.review_note}&rdquo;</> : null}. It can&apos;t be changed now.
        </p>
        <div className="flex flex-col">
          {data.methods.map((m) => (
            <div key={m.key} className="flex justify-between gap-4 py-2 text-xl border-b border-(--accent-2)">
              <span>{m.label}</span>
              <span>{money(declaration.amounts?.[m.key] || 0)}</span>
            </div>
          ))}
          <div className="flex justify-between gap-4 py-2 text-xl font-bold">
            <span>Total</span>
            <span>{money(declaration.total)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${card.surface} p-8 flex flex-col gap-6`}>
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>Your Declaration<Tip id="cashUp.declaration" /></h2>
        <p className={`text-xl ${page.muted}`}>
          {declaration
            ? `Declared at ${formatDateTime(declaration.declared_at)}. You can change it until the accountant verifies it.`
            : "Count what you hold for this business day and enter it by method. Leave a method empty if you have none."}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.methods.map((m) => (
          <div key={m.key} className="flex flex-col gap-2">
            <label htmlFor={`declare-${m.key}`} className={field.label}>
              {m.label}
              <Tip id={`cashUp.method.${m.key}`} />
            </label>
            <input
              id={`declare-${m.key}`}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amounts[m.key]}
              onChange={(e) => setAmounts({ ...amounts, [m.key]: e.target.value })}
              disabled={busy || confirming}
              className={field.input}
              placeholder="0"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="declare-note" className={field.label}>
          Note (optional)
          <Tip id="cashUp.note" />
        </label>
        <AutoGrowTextarea id="declare-note" value={note} onChange={(e) => setNote(e.target.value)} className={field.textarea} disabled={busy || confirming} />
      </div>
      <p className="text-2xl font-bold">
        Total: {money(total)}
        <Tip id="cashUp.total" />
      </p>
      {invalid && <p className={field.error}>The {invalid.label} amount must be a number, 0 or more.</p>}

      {confirming ? (
        <ConfirmPanel
          question={declaration ? `Change your cash-up for ${dayText(data.date)} to ${money(total)}?` : `Declare ${money(total)} for ${dayText(data.date)}?`}
          details={[
            ...data.methods.filter((m) => values[m.key] > 0).map((m) => `${m.label}: ${money(values[m.key])}`),
            "You can change it until the accountant verifies it.",
          ]}
          confirmLabel={declaration ? "Yes, change it" : "Yes, declare it"}
          busyLabel="Saving..."
          busy={busy}
          error={error}
          onBack={() => {
            setConfirming(false);
            setError(null);
          }}
          onConfirm={submit}
        />
      ) : (
        <div>
          <button type="button" onClick={() => setConfirming(true)} disabled={Boolean(invalid)} className={btn.primary}>
            {declaration ? "Change my declaration" : "Declare"}
          </button>
        </div>
      )}
    </div>
  );
}

function PaidOutDialog({ categories, onClose, onDone }) {
  const [form, setForm] = useState({ amount: "", category: "", description: "", voucher_number: "", note: "" });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (patch) => setForm({ ...form, ...patch });

  const amount = toNumber(form.amount);
  const label = form.category === "other" ? form.description.trim() : categories.find((c) => c.key === form.category)?.label;
  const problem =
    !(amount > 0) ? "Enter the amount paid out." : !form.category ? "Pick what it was for." : form.category === "other" && !form.description.trim() ? "Say what it was for." : null;

  const submit = async () => {
    try {
      setBusy(true);
      setError(null);
      await recordPaidOut({
        amount,
        category: form.category,
        ...(form.category === "other" ? { description: form.description.trim() } : {}),
        ...(form.voucher_number.trim() ? { voucher_number: form.voucher_number.trim() } : {}),
        ...(form.note.trim() ? { note: form.note.trim() } : {}),
      });
      onDone(`Recorded a paid-out of ${money(amount)} (${label}).`);
    } catch (err) {
      setError(err.message || "Could not record the paid-out.");
      setBusy(false);
    }
  };

  return (
    <Modal
      onClose={busy ? undefined : onClose}
      title="Record a Paid-Out"
      subtitle="Cash paid out of your drawer for a small expense"
      size="md"
      footer={
        !confirming && (
          <>
            <button type="button" onClick={onClose} className={btn.secondary}>Close</button>
            <button type="button" onClick={() => setConfirming(true)} disabled={Boolean(problem)} className={btn.primary}>Record it</button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="paidout-amount" className={field.label}>Amount<Tip id="cashUp.paidOut.amount" /></label>
          <input id="paidout-amount" type="number" inputMode="decimal" min="0" step="0.01" value={form.amount} onChange={(e) => set({ amount: e.target.value })} className={field.input} disabled={busy || confirming} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="paidout-category" className={field.label}>What For<Tip id="cashUp.paidOut.category" /></label>
          <select id="paidout-category" value={form.category} onChange={(e) => set({ category: e.target.value })} className={field.select} disabled={busy || confirming}>
            <option value="">Select</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        {form.category === "other" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="paidout-description" className={field.label}>What Was It For?<Tip id="cashUp.paidOut.description" /></label>
            <input id="paidout-description" value={form.description} maxLength={200} onChange={(e) => set({ description: e.target.value })} className={field.input} disabled={busy || confirming} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="paidout-voucher" className={field.label}>Voucher or Receipt Number (optional)<Tip id="cashUp.paidOut.voucher" /></label>
          <input id="paidout-voucher" value={form.voucher_number} maxLength={50} onChange={(e) => set({ voucher_number: e.target.value })} className={field.input} disabled={busy || confirming} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="paidout-note" className={field.label}>Note (optional)<Tip id="cashUp.paidOut.note" /></label>
          <AutoGrowTextarea id="paidout-note" value={form.note} onChange={(e) => set({ note: e.target.value })} className={field.textarea} disabled={busy || confirming} />
        </div>
        {problem && form.amount !== "" && !confirming && <p className={field.hint}>{problem}</p>}
        {confirming && (
          <ConfirmPanel
            question={`Record a paid-out of ${money(amount)} (${label})?`}
            details={["It comes off the cash you are expected to hold today.", "You can cancel it today, until the accountant verifies your cash-up."]}
            confirmLabel="Yes, record it"
            busyLabel="Recording..."
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

function CancelPaidOutDialog({ paidOut, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    try {
      setBusy(true);
      setError(null);
      await cancelPaidOut(paidOut.id);
      onDone(`Cancelled the paid-out of ${money(paidOut.amount)} (${paidOut.label}).`);
    } catch (err) {
      setError(err.message || "Could not cancel the paid-out.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title="Cancel a Paid-Out" size="md">
      <ConfirmPanel
        question={`Cancel the paid-out of ${money(paidOut.amount)} (${paidOut.label})?`}
        details={["It will no longer come off the cash you are expected to hold.", "It stays on the list, marked cancelled."]}
        confirmLabel="Yes, cancel it"
        busyLabel="Cancelling..."
        backLabel="Keep it"
        danger
        busy={busy}
        error={error}
        onBack={onClose}
        onConfirm={submit}
      />
    </Modal>
  );
}

export default function CashUpPage() {
  const [date, setDate] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [recording, setRecording] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(
    () =>
      fetchMyCashUp(date || undefined).then(
        (d) => {
          setData(d);
          setError(null);
        },
        (err) => setError(err.message || "Could not load your cash-up."),
      ),
    [date],
  );

  useEffect(() => {
    let cancelled = false;
    fetchMyCashUp(date || undefined).then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load your cash-up."),
    );
    return () => {
      cancelled = true;
    };
  }, [date]);
  useLiveRefresh(load, []);

  const done = (message) => {
    setRecording(false);
    setCancelling(null);
    setNotice(message);
    load();
  };

  const active = (data?.paid_outs || []).filter((p) => !p.cancelled_at);
  const paidOutTotal = active.reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <div>
        <PageHeading icon={IoWalletOutline} tipId="cashUp.page">Cash-Up</PageHeading>
        <p className={`text-2xl mt-2 ${page.muted}`}>
          Count what you hold and declare it. You won&apos;t see what the system expects - the accountant compares the two.
        </p>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data && (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="cashup-day" className={field.label}>Business Day<Tip id="cashUp.day" /></label>
              <select
                id="cashup-day"
                value={data.date}
                onChange={(e) => {
                  setNotice(null);
                  setDate(e.target.value);
                }}
                className={field.select}
              >
                <option value={data.today}>Today, {dayText(data.today)}</option>
                <option value={data.yesterday}>Yesterday, {dayText(data.yesterday)}</option>
              </select>
            </div>

            {/* Keyed on what was saved, so the form starts again from it once the save comes back. */}
            <DeclarationCard key={`${data.date}-${data.declaration?.declared_at || "none"}-${data.declaration?.verified_at || ""}`} data={data} onDone={done} />

            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-4 w-full">
                <div className="flex flex-col gap-1">
                  <h2 className={page.sectionTitle}>Paid-Outs<Tip id="cashUp.paidOuts" /></h2>
                  <p className={`text-xl ${page.muted}`}>
                    {data.can_record_paid_out
                      ? "Cash paid out of your drawer today for a small expense. It comes off the cash you are expected to hold."
                      : data.date !== data.today
                        ? "Paid-outs are recorded on the day they happen."
                        : "Your cash-up for today is verified, so no more paid-outs can be recorded."}
                  </p>
                </div>
                {data.can_record_paid_out && (
                  <button type="button" onClick={() => setRecording(true)} className={btn.primary}>Record a paid-out</button>
                )}
              </div>
              {data.paid_outs.length === 0 ? (
                <p className={`text-xl ${page.muted}`}>No paid-outs this day.</p>
              ) : (
                <div className={table.card}>
                  <div className={table.scroll}>
                    <table className={table.el}>
                      <thead>
                        <tr className={table.headRow}>
                          <th className={`${table.th} ${table.stickyTh}`}>What For<Tip id="cashUp.paidOut.col.what" /></th>
                          <th className={`${table.th} text-right!`}>Amount<Tip id="cashUp.paidOut.col.amount" /></th>
                          <th className={`${table.th} hidden md:table-cell`}>Voucher<Tip id="cashUp.paidOut.col.voucher" /></th>
                          <th className={`${table.th} hidden md:table-cell`}>Time<Tip id="cashUp.paidOut.col.time" /></th>
                          <th className={table.th}>Actions<Tip id="cashUp.paidOut.col.actions" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.paid_outs.map((p) => (
                          <tr key={p.id} className={table.row}>
                            <td className={`${table.td} ${table.stickyTd} ${p.cancelled_at ? page.muted : "font-semibold"}`}>
                              <div>{p.label}</div>
                              {p.note && <div className={`text-lg whitespace-normal ${page.muted}`}>{p.note}</div>}
                            </td>
                            <td className={`${table.td} text-right! ${p.cancelled_at ? `line-through ${page.muted}` : ""}`}>{money(p.amount)}</td>
                            <td className={`${table.td} hidden md:table-cell`}>{p.voucher_number || "-"}</td>
                            <td className={`${table.td} hidden md:table-cell`}>{formatTime(p.created_at)}</td>
                            <td className={table.td}>
                              {p.cancelled_at ? (
                                <span className={`font-semibold ${page.muted}`}>Cancelled</span>
                              ) : p.can_cancel ? (
                                <button type="button" onClick={() => setCancelling(p)} className={btn.rowDanger}>Cancel</button>
                              ) : (
                                <span className={page.muted}>-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {active.length > 0 && (
                <p className="text-2xl font-bold">
                  Paid out: {money(paidOutTotal)}
                  <Tip id="cashUp.paidOutTotal" />
                </p>
              )}
            </div>
          </>
        )
      )}

      {recording && data && <PaidOutDialog categories={data.categories} onClose={() => setRecording(false)} onDone={done} />}
      {cancelling && <CancelPaidOutDialog paidOut={cancelling} onClose={() => setCancelling(null)} onDone={done} />}
    </div>
  );
}
