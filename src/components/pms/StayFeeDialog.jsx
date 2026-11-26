"use client";

import { useState } from "react";
import Modal from "@/components/pms/Modal";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import { Tip } from "@/components/pms/Tip";
import { btn, field } from "@/components/pms/ui";
import { money } from "@/lib/pms/format";
import { addFolioItem, fetchFolios } from "@/lib/pms/api/folios-api";

// A late check-out or early check-in fee (owner, 2026-11-26: posted from
// Check-Ins and Check-Outs as well as the folio). It goes on the guest's
// folio as its own charge type, on the Room account, and has its own column
// on the Manifest. A dialog, then a Yes - like every PMS change.
const KINDS = {
  late_checkout: { title: "Late Check-Out Fee", what: "late check-out", description: "Late check-out" },
  early_checkin: { title: "Early Check-In Fee", what: "early check-in", description: "Early check-in" },
};

export default function StayFeeDialog({ kind, reservation, onClose, onDone }) {
  const k = KINDS[kind];
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const value = Number(amount);
  const ready = amount !== "" && value > 0;

  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      const folios = await fetchFolios({ reservation_id: reservation.id });
      const folio = folios?.data?.[0];
      if (!folio) throw new Error("This booking has no folio yet - confirm it first.");
      await addFolioItem(folio.id, {
        item_type: kind,
        description: k.description,
        amount: value,
        notes: note.trim() || undefined,
      });
      onDone(`${money(value)} ${k.what} fee added to ${reservation.guest_name}'s folio.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "That didn't go through.");
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? undefined : onClose} title={k.title} subtitle={reservation.guest_name} size="md">
      {step === "form" ? (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className={field.label}>
              Amount (₦) *<Tip id={`stayFee.amount`} />
            </span>
            <input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={field.input} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={field.label}>Note (optional)</span>
            <input type="text" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} className={field.input} placeholder="e.g. Left at 3pm" />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btn.secondary} onClick={onClose}>
              Back
            </button>
            <button type="button" className={btn.primary} disabled={!ready} onClick={() => setStep("confirm")} title={ready ? undefined : "Enter the amount."}>
              Continue
            </button>
          </div>
        </div>
      ) : (
        <ConfirmPanel
          question={`Add a ${money(value)} ${k.what} fee to ${reservation.guest_name}'s folio?`}
          details={["It goes on the Room account, and in its own column on the Manifest.", "It is recorded in the Audit Trail."]}
          confirmLabel="Yes, add it"
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
