"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IoBasketOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Modal from "@/components/pms/Modal";
import Notice from "@/components/pms/Notice";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { Tip } from "@/components/pms/Tip";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page } from "@/components/pms/ui";
import { createStoreRequest, fetchRequestable, withdrawStoreRequest } from "@/lib/pms/api/inventory-api";
import { num, RequestsTable } from "./storeRequestUi";

// Store Requests (Inventory, Step 4): a department asks the store for stock -
// the waitron for the Bar and the Kitchen, the front desk for Front office and
// Laundry, the housekeeping supervisor and housekeepers for Housekeeping
// and Laundry, the manager for any. The store keeper issues it or declines it from Inventory.

function AskDialog({ data, onClose, onDone }) {
  const departments = Object.entries(data.departments);
  const [form, setForm] = useState({ item_id: "", department: departments.length === 1 ? departments[0][0] : "", quantity: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const item = data.items.find((i) => String(i.id) === form.item_id);
  const amount = Number(form.quantity);
  const confirm = async () => {
    const problem = !form.item_id ? "Pick the item." : !form.department ? "Pick the department." : form.quantity === "" || !(amount > 0) ? "Give a quantity above 0." : null;
    if (problem) return setError(problem);
    try {
      setBusy(true);
      setError(null);
      await createStoreRequest({ item_id: Number(form.item_id), department: form.department, quantity: amount, note: form.note.trim() || undefined });
      onDone(`Asked the store for ${num(amount)} ${item.unit} of ${item.name}. The store keeper has been told.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title="Ask the Store" size="md">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="ask-item" className={field.label}>
            Item<Tip id="storeRequests.ask.item" />
          </label>
          <select id="ask-item" value={form.item_id} onChange={set("item_id")} className={`${field.select} w-full`} disabled={busy}>
            <option value="">Pick an item</option>
            {data.items.map((i) => (
              <option key={i.id} value={String(i.id)}>
                {i.name} ({i.unit})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="ask-dept" className={field.label}>
              For<Tip id="storeRequests.ask.department" />
            </label>
            <select id="ask-dept" value={form.department} onChange={set("department")} className={`${field.select} w-full`} disabled={busy}>
              {departments.length > 1 && <option value="">Pick a department</option>}
              {departments.map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ask-qty" className={field.label}>
              Quantity{item ? ` (${item.unit})` : ""}
              <Tip id="storeRequests.ask.quantity" />
            </label>
            <input id="ask-qty" type="number" min="0" step="any" value={form.quantity} onChange={set("quantity")} className={field.input} disabled={busy} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="ask-note" className={field.label}>
            Note (optional)<Tip id="storeRequests.ask.note" />
          </label>
          <AutoGrowTextarea id="ask-note" value={form.note} onChange={set("note")} className={field.textarea} maxLength={500} disabled={busy} />
        </div>
        <ConfirmPanel
          question={item && amount > 0 ? `Ask the store for ${num(amount)} ${item.unit} of ${item.name}?` : "Ask the store?"}
          details={["The store keeper issues it, or declines it saying why. You see the answer here."]}
          confirmLabel="Yes, ask"
          busyLabel="Sending..."
          busy={busy}
          error={error}
          onBack={onClose}
          onConfirm={confirm}
        />
      </div>
    </Modal>
  );
}

function WithdrawDialog({ request, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      await withdrawStoreRequest(request.id);
      onDone(`Withdrew the request for ${request.item_name}.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title={`Withdraw ${request.item_name}`} size="md">
      <ConfirmPanel
        question={`Withdraw the request for ${num(request.quantity)} ${request.unit} of ${request.item_name}?`}
        details={["The store keeper no longer sees it waiting."]}
        confirmLabel="Yes, withdraw it"
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

export default function StoreRequestsPage() {
  const { role, user } = usePmsSession();
  const me = Number(user?.staff_account_id) || null;
  const isManager = role === "manager" || role === "developer";
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  useLiveRefresh(reload, ["inventory"]);

  useEffect(() => {
    let cancelled = false;
    fetchRequestable().then(
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

  const done = (message) => {
    setDialog(null);
    setNotice(message);
    reload();
  };
  const departmentNames = useMemo(() => (data ? Object.values(data.departments).join(", ") : ""), [data]);

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <div>
        <PageHeading icon={IoBasketOutline} tipId="storeRequests.page">
          Store Requests
        </PageHeading>
        <p className={`text-2xl mt-2 ${page.muted}`}>Ask the store for stock. The store keeper issues it or declines it, and the answer shows here.</p>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data && (
          <div className="w-full flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <p className={`text-xl ${page.muted}`}>For {departmentNames}. Waiting requests first, then the last 30 days.</p>
              <button type="button" onClick={() => setDialog({ kind: "ask" })} className={`${btn.primary} ml-auto`} disabled={data.items.length === 0}>
                Ask the Store
              </button>
            </div>
            {data.items.length === 0 && <p className={`text-xl ${page.muted}`}>The store has no items yet.</p>}
            <RequestsTable
              requests={data.requests}
              empty="No requests yet."
              actions={(r) =>
                r.status === "pending" && (isManager || Number(r.requested_by) === me) ? (
                  <button type="button" onClick={() => setDialog({ kind: "withdraw", request: r })} className={btn.rowSecondary}>
                    Withdraw
                  </button>
                ) : null
              }
            />
          </div>
        )
      )}
      {dialog?.kind === "ask" && <AskDialog data={data} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.kind === "withdraw" && <WithdrawDialog request={dialog.request} onClose={() => setDialog(null)} onDone={done} />}
    </div>
  );
}
