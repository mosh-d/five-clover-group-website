"use client";

import { useEffect, useState } from "react";
import { MotionDiv, panelEnter } from "./motion";
import { btn, field } from "./ui";
import { shifts as shiftsApi, staffAccounts } from "@/lib/pms/api";

// How each rota reads on screen.
const ROTA = {
  receptionist: { person: "receptionist", locked: "The front desk stays locked" },
  waitron: { person: "waitron", locked: "Food and drink sales stay locked" },
};

// The 6am prompt: who this business day belongs to, for one rota - the
// branch PMS's ShiftGate.
//
// Not the shared Modal: that closes on Escape, a backdrop click and its own
// X, any of which would defeat the lock. The rota stays shut until its shift
// is recorded. onCancel is passed only when someone reopens this to correct
// an already-recorded shift, which doesn't block anything.
//
// A pick is read back before it is recorded - the whole day is attributed to
// whoever is named here.
export default function ShiftGate({ role, businessDate, currentName, onSelected, onCancel }) {
  const rota = ROTA[role] || ROTA.receptionist;
  const [staff, setStaff] = useState(null);
  const [selected, setSelected] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    staffAccounts
      .list(role)
      .then((list) => !cancelled && setStaff(list || []))
      .catch(() => {
        if (cancelled) return;
        setStaff([]);
        setError("Could not load the staff list. Refresh the page and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  const selectedName = (staff || []).find((person) => String(person.id) === String(selected))?.username;

  const submit = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      setError(null);
      onSelected(await shiftsApi.record(role, selected));
    } catch (err) {
      setError(err?.message || "Could not record the shift. Try again.");
      setSaving(false);
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Record the shift">
      <MotionDiv {...panelEnter} className="bg-(--card) rounded-2xl w-full max-w-2xl shadow-2xl p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-(--black)">Whose shift is this?</h2>
          <p className="text-xl text-(--text-color)/76">
            The business day{businessDate ? ` (${businessDate})` : ""} has started. Pick the {rota.person} on duty — your own
            name, or the colleague whose shift it is. {rota.locked} until this is recorded, and the choice goes to the audit
            trail.
          </p>
          {currentName && (
            <p className="text-xl text-(--text-color)/76">
              Recorded so far as <strong className="text-(--black)">{currentName}</strong>.
            </p>
          )}
        </div>

        {error && <p className={field.error}>{error}</p>}

        {staff === null ? (
          <p className="text-xl text-(--text-color)/68">Loading…</p>
        ) : confirming ? (
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-6 py-5 flex flex-col gap-3">
            <p className="text-2xl font-bold text-(--black)">Record {selectedName} as the shift?</p>
            <p className="text-xl text-(--text-color)/76">
              Everything done on this business day{businessDate ? ` (${businessDate})` : ""} will be attributed to {selectedName}.
              Your own name goes on the record as the person who made the choice.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor="shift-person" className={field.label}>
              {rota.person.charAt(0).toUpperCase() + rota.person.slice(1)} on duty
            </label>
            <select id="shift-person" value={selected} onChange={(e) => setSelected(e.target.value)} className={field.select}>
              <option value="">Select a name</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>{person.username}</option>
              ))}
            </select>
            {staff.length === 0 && !error && (
              <p className="text-lg text-(--text-color)/60">No active {rota.person} accounts for this branch. A manager has to add one first.</p>
            )}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          {confirming ? (
            <>
              <button onClick={submit} disabled={saving} className={btn.primary}>
                {saving ? "Saving..." : `Yes, record ${selectedName}`}
              </button>
              <button onClick={() => setConfirming(false)} disabled={saving} className={btn.secondary}>Go back</button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirming(true)} disabled={!selected} className={btn.primary}>Start the shift</button>
              {onCancel && <button onClick={onCancel} className={btn.secondary}>Cancel</button>}
            </>
          )}
        </div>
      </MotionDiv>
    </div>
  );
}
