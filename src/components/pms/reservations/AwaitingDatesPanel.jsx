"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/pms/Modal";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import PaymentSplitRows from "@/components/pms/PaymentSplitRows";
import RefundCreditModal from "@/components/pms/RefundCreditModal";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { TableCard } from "@/components/pms/ReportExport";
import { Tip } from "@/components/pms/Tip";
import { FutureBookingForm } from "@/components/pms/pages/AdminCheckIns";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDate, formatPaymentMethod, money } from "@/lib/pms/format";
import { formatPhone } from "@/lib/pms/phone-format";
import { fetchRoomDetails } from "@/lib/pms/api/room-data";
import { fetchDeposits, recordDeposit, refundDeposit } from "@/lib/pms/api/folios-api";
import { cancelAwaitingDates, createAwaitingDates, fetchAwaitingDates, markAwaitingDated } from "@/lib/pms/api/awaiting-dates-api";

// Bookings awaiting dates (owner, 2026-11-18; backend phase-100,
// docs/NO-DATE-RESERVATIONS-PLAN.md): a guest pays before they know when
// they will stay. The desk takes the money on a booking with no dates - an
// ordinary advance payment, so the Manifest report shows it under
// Reservation (Credit) on the day it is taken - and, once the guest is sure,
// Set Dates makes the real booking (the Future Booking form) and the money
// moves onto it. Money held on one stays on Alerts until then. Receptionists
// take, date, refund and call them off; the manager sees the list.

const DESK = ["receptionist", "developer"];
const EMPTY_SPLITS = [{ amount: "", payment_method: "transfer" }];
const splitsTotal = (splits) => splits.reduce((s, x) => s + (Number(x.amount) || 0), 0);
const splitsOk = (splits) => splits.length > 0 && splits.every((x) => Number(x.amount) > 0 && x.payment_method);

function NewDialog({ roomTypes, onClose, onDone }) {
  const [form, setForm] = useState({ first: "", last: "", phone: "", email: "", roomTypeId: "", rooms: 1, note: "", receipt: "" });
  const [splits, setSplits] = useState(EMPTY_SPLITS);
  const [step, setStep] = useState("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const name = `${form.first} ${form.last}`.trim();
  const ready = form.first.trim() && form.phone.trim() && splitsOk(splits);
  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      const booking = await createAwaitingDates({
        guest_name: name,
        phone_number: form.phone.trim(),
        guest_email: form.email.trim() || undefined,
        room_type_id: form.roomTypeId ? Number(form.roomTypeId) : undefined,
        rooms_booked: Number(form.rooms) || 1,
        note: form.note.trim() || undefined,
      });
      try {
        await recordDeposit({
          reservation_id: booking.id,
          payments: splits.map((x) => ({ amount: Number(x.amount), payment_method: x.payment_method })),
          receipt_number: form.receipt.trim() || undefined,
        });
      } catch (err) {
        onDone(`${name}'s booking (ref ${booking.booking_reference}) is kept, but the payment wasn't saved: ${err.message || "try Add Payment on it"}.`);
        return;
      }
      onDone(`${name}'s booking (ref ${booking.booking_reference}) is kept with ${money(splitsTotal(splits))} paid. Set its dates when the guest is sure.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title="New Booking Without Dates" size="lg">
      {step === "form" ? (
        <div className="flex flex-col gap-6">
          <p className={page.sectionIntro}>For a guest paying now who doesn&apos;t know yet when they will stay. Set the dates later from this tab.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className={field.label}>First Name *<Tip id="awaiting.firstName" /></span>
              <input className={field.input} value={form.first} onChange={set("first")} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={field.label}>Last Name</span>
              <input className={field.input} value={form.last} onChange={set("last")} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={field.label}>Phone *<Tip id="awaiting.phone" /></span>
              <input className={field.input} type="tel" value={form.phone} onChange={set("phone")} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={field.label}>Email</span>
              <input className={field.input} type="email" value={form.email} onChange={set("email")} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={field.label}>Room Type (if known)<Tip id="awaiting.roomType" /></span>
              <select className={`${field.select} w-full`} value={form.roomTypeId} onChange={set("roomTypeId")}>
                <option value="">Not decided yet</option>
                {roomTypes.map((rt) => (
                  <option key={rt.room_type_id} value={rt.room_type_id}>
                    {rt.room_type_name} - {money(rt.base_rate)} a night
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className={field.label}>Rooms</span>
              <input className={field.input} type="number" min="1" step="1" value={form.rooms} onChange={set("rooms")} />
            </label>
          </div>
          <label className="flex flex-col gap-2">
            <span className={field.label}>Note<Tip id="awaiting.note" /></span>
            <AutoGrowTextarea className={field.textarea} value={form.note} onChange={set("note")} maxLength={1000} placeholder="e.g. Coming for a wedding sometime in December" />
          </label>
          <div className="flex flex-col gap-3">
            <span className={field.label}>Payment *<Tip id="awaiting.payment" /></span>
            <PaymentSplitRows splits={splits} setSplits={setSplits} />
            <input className={field.input} placeholder="Receipt number" value={form.receipt} onChange={set("receipt")} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btn.secondary} onClick={onClose}>Back</button>
            <button type="button" className={btn.primary} disabled={!ready} onClick={() => setStep("confirm")} title={ready ? undefined : "Enter the guest's first name and phone, and the payment."}>
              Continue
            </button>
          </div>
        </div>
      ) : (
        <ConfirmPanel
          question={`Keep a booking for ${name} with ${money(splitsTotal(splits))} paid, and no dates yet?`}
          details={[
            "The money shows on today's Manifest report under Reservation (Credit).",
            "No room is held until you set the dates.",
            "It stays on Alerts until it has dates or the money is refunded.",
          ]}
          confirmLabel="Yes, keep it"
          busyLabel="Saving..."
          busy={busy}
          error={error}
          onBack={() => setStep("form")}
          onConfirm={confirm}
        />
      )}
    </Modal>
  );
}

function PaymentDialog({ booking, onClose, onDone }) {
  const [splits, setSplits] = useState(EMPTY_SPLITS);
  const [receipt, setReceipt] = useState("");
  const [step, setStep] = useState("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      await recordDeposit({ reservation_id: booking.id, payments: splits.map((x) => ({ amount: Number(x.amount), payment_method: x.payment_method })), receipt_number: receipt.trim() || undefined });
      onDone(`${money(splitsTotal(splits))} more is held for ${booking.guest_name}.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title="Add Payment" subtitle={booking.guest_name} size="md">
      {step === "form" ? (
        <div className="flex flex-col gap-4">
          <PaymentSplitRows splits={splits} setSplits={setSplits} />
          <input className={field.input} placeholder="Receipt number" value={receipt} onChange={(e) => setReceipt(e.target.value)} />
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btn.secondary} onClick={onClose}>Back</button>
            <button type="button" className={btn.primary} disabled={!splitsOk(splits)} onClick={() => setStep("confirm")}>Continue</button>
          </div>
        </div>
      ) : (
        <ConfirmPanel
          question={`Take ${money(splitsTotal(splits))} more for ${booking.guest_name}?`}
          details={["It is held on the booking until it has dates, and shows on today's Manifest report under Reservation (Credit)."]}
          confirmLabel="Yes, take it"
          busyLabel="Saving..."
          busy={busy}
          error={error}
          onBack={() => setStep("form")}
          onConfirm={confirm}
        />
      )}
    </Modal>
  );
}

// The money held on a booking, payment by payment, each refundable.
function RefundDialog({ booking, onClose, onDone }) {
  const [deposits, setDeposits] = useState(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchDeposits({ reservation_id: booking.id }).then(
      (d) => setDeposits((Array.isArray(d) ? d : []).filter((x) => x.status === "pending" && Number(x.amount) - Number(x.amount_applied || 0) > 0)),
      (err) => setError(err.message || "Could not load the payments."),
    );
  }, [booking.id]);
  const refund = async (method) => {
    try {
      setBusy(true);
      setError(null);
      const r = await refundDeposit(target.id, method);
      onDone(`${money(r?.refunded_amount ?? target.amount)} paid back to ${booking.guest_name}.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setTarget(null);
      setBusy(false);
    }
  };
  if (target) {
    return <RefundCreditModal credit={target} reference={target.deposit_reference} guestName={booking.guest_name} busy={busy} onConfirm={refund} onClose={() => setTarget(null)} />;
  }
  return (
    <Modal onClose={onClose} title="Refund" subtitle={booking.guest_name} size="md">
      <div className="flex flex-col gap-4">
        {error && <p className={field.error}>{error}</p>}
        {!deposits && !error ? (
          <LoadingSpinner />
        ) : (deposits || []).length === 0 ? (
          <p className={`text-xl ${page.muted}`}>Nothing is held on this booking.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {deposits.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 border border-(--accent-2) rounded-lg px-4 py-3">
                <span className="text-xl">
                  <strong>{money(Number(d.amount) - Number(d.amount_applied || 0))}</strong> {formatPaymentMethod(d.payment_method)}, {formatDate(d.deposit_date)}
                  {d.receipt_number ? ` (receipt ${d.receipt_number})` : ""}
                </span>
                <button type="button" className={btn.rowDanger} onClick={() => setTarget(d)}>
                  Refund
                </button>
              </li>
            ))}
          </ul>
        )}
        <div>
          <button type="button" className={btn.secondary} onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

function CancelDialog({ booking, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      await cancelAwaitingDates(booking.id);
      onDone(`${booking.guest_name}'s booking is called off.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title="Call Off Booking" size="md">
      <ConfirmPanel
        question={`Call off ${booking.guest_name}'s booking?`}
        details={booking.credit_held > 0 ? [`${money(booking.credit_held)} is still held on it - refund it first.`] : ["It leaves this list. Nothing is held on it."]}
        confirmLabel="Yes, call it off"
        busyLabel="Saving..."
        danger
        busy={busy}
        error={error}
        onBack={onClose}
        onConfirm={confirm}
      />
    </Modal>
  );
}

function SetDatesDialog({ booking, onClose, onDone }) {
  const [first, ...rest] = String(booking.guest_name || "").split(" ");
  const prefill = {
    guestFirstName: first || "",
    guestLastName: rest.join(" "),
    phone: booking.phone_number || "",
    email: booking.guest_email || "",
    roomTypeId: booking.room_type_id ? String(booking.room_type_id) : "",
    roomsBooked: booking.rooms_booked || 1,
  };
  return (
    <Modal onClose={onClose} title="Set Dates" subtitle={`${booking.guest_name} - ${money(booking.credit_held)} held`} size="lg">
      <div className="flex flex-col gap-4">
        <p className={page.sectionIntro}>
          Book the stay as a Future Booking. Once it is confirmed, the {money(booking.credit_held)} paid moves onto it and is used as Paid Before (PB) when the guest arrives.
        </p>
        <FutureBookingForm
          inDialog
          prefill={prefill}
          afterBooked={async (hold) => {
            const r = await markAwaitingDated(booking.id, hold.internal_id);
            onDone(`${booking.guest_name} is booked (ref ${r.booking_reference}), with the money paid moved onto the booking.`);
          }}
        />
      </div>
    </Modal>
  );
}

export default function AwaitingDatesPanel({ onCount, onMessage }) {
  const { role } = usePmsSession();
  const desk = DESK.includes(role);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  useLiveRefresh(reload, ["reservations"]);

  useEffect(() => {
    let cancelled = false;
    fetchAwaitingDates().then(
      (d) => {
        if (cancelled) return;
        setRows(d || []);
        onCount?.((d || []).length);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the bookings awaiting dates."),
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey, onCount]);

  useEffect(() => {
    fetchRoomDetails().then((d) => setRoomTypes(d?.room_types || []), () => {});
  }, []);

  const done = (message) => {
    setDialog(null);
    onMessage?.(message);
    reload();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {error && <p className={field.error}>{error}</p>}
      {!rows && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        rows && (
          <TableCard
            heading={
              <div className="flex flex-col gap-2">
                <h2 className={page.sectionTitle}>
                  Awaiting Dates<Tip id="awaiting.heading" />
                </h2>
                <p className={page.sectionIntro}>Guests who paid before knowing when they will stay, oldest first. Set the dates once the guest is sure.</p>
              </div>
            }
            actions={desk ? [{ label: "New Booking Without Dates", onClick: () => setDialog({ kind: "new" }) }] : []}
          >
            <table className={table.el}>
              <thead>
                <tr className={table.headRow}>
                  <th className={`${table.th} ${table.stickyTh}`}>Guest<Tip id="awaiting.col.guest" /></th>
                  <th className={table.th}>Kept Since<Tip id="awaiting.col.since" /></th>
                  <th className={table.th}>Room Type<Tip id="awaiting.col.roomType" /></th>
                  <th className={`${table.th} text-right!`}>Held<Tip id="awaiting.col.held" /></th>
                  <th className={table.th}>Note</th>
                  {desk && <th className={table.th}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={desk ? 6 : 5} className={table.empty}>
                      No bookings are awaiting dates.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`${table.td} ${table.stickyTd}`}>
                        <span className="font-semibold">{r.guest_name}</span>
                        <span className="block text-lg text-(--text-color)/68">
                          {formatPhone(r.phone_number) || "—"} · ref {r.booking_reference}
                        </span>
                      </td>
                      <td className={table.td}>{formatDate(r.created_at)}</td>
                      <td className={table.td}>{r.room_type_name ? `${r.room_type_name}${r.rooms_booked > 1 ? ` × ${r.rooms_booked}` : ""}` : "Not decided yet"}</td>
                      <td className={`${table.td} text-right! font-semibold`}>{money(r.credit_held)}</td>
                      <td className={`${table.td} whitespace-normal! min-w-[14rem]`}>{r.note || "—"}</td>
                      {desk && (
                        <td className={table.td}>
                          <div className={table.actions}>
                            <button type="button" className={btn.rowPrimary} onClick={() => setDialog({ kind: "dates", booking: r })}>Set Dates</button>
                            <button type="button" className={btn.rowSecondary} onClick={() => setDialog({ kind: "pay", booking: r })}>Add Payment</button>
                            {r.credit_held > 0 && <button type="button" className={btn.rowDanger} onClick={() => setDialog({ kind: "refund", booking: r })}>Refund</button>}
                            {!(r.credit_held > 0) && <button type="button" className={btn.rowDanger} onClick={() => setDialog({ kind: "cancel", booking: r })}>Call Off</button>}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableCard>
        )
      )}
      {dialog?.kind === "new" && <NewDialog roomTypes={roomTypes} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.kind === "pay" && <PaymentDialog booking={dialog.booking} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.kind === "refund" && <RefundDialog booking={dialog.booking} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.kind === "cancel" && <CancelDialog booking={dialog.booking} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.kind === "dates" && <SetDatesDialog booking={dialog.booking} onClose={() => setDialog(null)} onDone={done} />}
    </div>
  );
}
