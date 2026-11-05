"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Modal from "@/components/pms/Modal";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { Tip } from "@/components/pms/Tip";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page } from "@/components/pms/ui";
import { declineStoreRequest, fetchStoreRequests, issueStoreRequest } from "@/lib/pms/api/inventory-api";
import { num, RequestsTable } from "./storeRequestUi";

// The store keeper's Requests tab (Inventory, Step 4): what the departments
// have asked for. Issue (all of it, or less when the store is short) or
// decline, saying why. The manager and the accountant read it.

function IssueDialog({ request, onClose, onDone }) {
  const [quantity, setQuantity] = useState(String(Math.min(request.quantity, Math.max(request.on_hand, 0)) || request.quantity));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const amount = Number(quantity);
  const confirm = async () => {
    if (quantity === "" || !(amount > 0)) return setError("Give a quantity above 0.");
    if (amount > request.quantity) return setError(`They asked for ${num(request.quantity)} - issue that or less.`);
    try {
      setBusy(true);
      setError(null);
      const r = await issueStoreRequest(request.id, { quantity: amount, note: note.trim() || undefined });
      onDone(`Issued ${num(amount)} ${request.unit} of ${request.item_name} to ${request.department_label}. The store has ${num(r.moved.on_hand)} ${request.unit}.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title={`Issue ${request.item_name}`} subtitle={`In the store: ${num(request.on_hand)} ${request.unit}`} size="md">
      <div className="flex flex-col gap-5">
        <p className={`text-xl ${page.muted}`}>
          {request.requested_by_name || "Someone"} asked for {num(request.quantity)} {request.unit} for {request.department_label}
          {request.note ? `: "${request.note}"` : "."}
        </p>
        <div className="flex flex-col gap-2">
          <label htmlFor="req-issue-qty" className={field.label}>
            Quantity to Issue ({request.unit})<Tip id="inventory.requests.issueQuantity" />
          </label>
          <input id="req-issue-qty" type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={field.input} disabled={busy} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="req-issue-note" className={field.label}>
            Note (optional)<Tip id="inventory.move.note" />
          </label>
          <AutoGrowTextarea id="req-issue-note" value={note} onChange={(e) => setNote(e.target.value)} className={field.textarea} maxLength={500} disabled={busy} />
        </div>
        <ConfirmPanel
          question={`Issue ${num(amount)} ${request.unit} of ${request.item_name} to ${request.department_label}?`}
          details={[
            `The store will have ${num(request.on_hand - amount)} ${request.unit}.`,
            ...(amount > 0 && amount < request.quantity ? [`Less than the ${num(request.quantity)} asked for - the request closes with what was issued.`] : []),
            ...(request.drink_item_id && request.department === "bar" ? ["It goes onto the bar's stock."] : []),
          ]}
          confirmLabel="Yes, issue it"
          busyLabel="Saving..."
          busy={busy}
          error={error}
          onBack={onClose}
          onConfirm={confirm}
        />
      </div>
    </Modal>
  );
}

function DeclineDialog({ request, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const confirm = async () => {
    if (!reason.trim()) return setError("Say why it is declined.");
    try {
      setBusy(true);
      setError(null);
      await declineStoreRequest(request.id, reason.trim());
      onDone(`Declined the request for ${request.item_name}${request.requested_by_name ? ` from ${request.requested_by_name}` : ""}.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title={`Decline ${request.item_name}`} size="md">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="req-decline-reason" className={field.label}>
            Why<Tip id="inventory.requests.declineReason" />
          </label>
          <AutoGrowTextarea id="req-decline-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={field.textarea} maxLength={500} disabled={busy} />
        </div>
        <ConfirmPanel
          question={`Decline the request for ${num(request.quantity)} ${request.unit} of ${request.item_name}?`}
          details={[`${request.requested_by_name || "Whoever asked"} sees it declined, with your reason.`]}
          confirmLabel="Yes, decline it"
          busyLabel="Saving..."
          danger
          busy={busy}
          error={error}
          onBack={onClose}
          onConfirm={confirm}
        />
      </div>
    </Modal>
  );
}

export default function RequestsTab({ canEdit, onDone }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  useLiveRefresh(reload, ["inventory"]);

  useEffect(() => {
    let cancelled = false;
    fetchStoreRequests().then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the requests."),
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const finish = (message) => {
    setDialog(null);
    reload();
    onDone(message);
  };

  if (!data && !error) {
    return (
      <div className="flex justify-center py-10 w-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  const waiting = data ? data.requests.filter((r) => r.status === "pending").length : 0;
  return (
    <div className="w-full flex flex-col gap-6">
      {error && <p className={`${field.error} w-full`}>{error}</p>}
      {data && (
        <>
          <p className={`text-xl ${page.muted}`}>
            {waiting ? `${waiting} waiting. ` : "Nothing waiting. "}
            Requests from the departments - waiting ones first, then the last 30 days.
          </p>
          <RequestsTable
            requests={data.requests}
            showOnHand
            empty="No requests yet. The departments ask from their Store Requests page."
            actions={(r) =>
              canEdit && r.status === "pending" ? (
                <>
                  <button type="button" onClick={() => setDialog({ kind: "issue", request: r })} className={btn.rowPrimary}>
                    Issue
                  </button>
                  <button type="button" onClick={() => setDialog({ kind: "decline", request: r })} className={btn.rowSecondary}>
                    Decline
                  </button>
                </>
              ) : null
            }
          />
        </>
      )}
      {dialog?.kind === "issue" && <IssueDialog request={dialog.request} onClose={() => setDialog(null)} onDone={finish} />}
      {dialog?.kind === "decline" && <DeclineDialog request={dialog.request} onClose={() => setDialog(null)} onDone={finish} />}
    </div>
  );
}
