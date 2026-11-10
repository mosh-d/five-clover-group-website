"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IoBasketOutline, IoChevronDown, IoChevronForward } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Modal from "@/components/pms/Modal";
import Notice from "@/components/pms/Notice";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { Tip } from "@/components/pms/Tip";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page } from "@/components/pms/ui";
import { createStoreRequests, fetchRequestable, withdrawStoreRequest } from "@/lib/pms/api/inventory-api";
import SearchField, { matchesSearch } from "@/components/pms/SearchField";
import { num, RequestsTable } from "./storeRequestUi";

// Store Requests (Inventory, Step 4): a department asks the store for stock -
// the waitron for the Bar and the Kitchen, the front desk for Front office and
// Laundry, the housekeeping supervisor and housekeepers for Housekeeping
// and Laundry, the manager for any. The store keeper issues it or declines it from Inventory.

const emptyLine = () => ({ item_id: "", quantity: "", note: "", find: "" });

// One item of the request, as a card that collapses to a one-line summary -
// as F&B Sales does its order lines (owner, 2026-11-10). A card still missing
// its item says so in orange, open or closed.
function LineCard({ index, line, items, open, onToggle, onChange, onRemove, canRemove, busy }) {
  const item = items.find((i) => String(i.id) === line.item_id);
  const shown = items.filter((i) => String(i.id) === line.item_id || matchesSearch(line.find, i.name));
  const set = (k) => (e) => onChange({ [k]: e.target.value });
  return (
    <div className={`rounded-xl border-2 transition-colors ${open ? "border-(--text-color)/30 bg-black/[0.04]" : "border-(--accent-2) bg-(--card)"}`}>
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <button type="button" onClick={onToggle} className="flex items-center gap-3 text-left cursor-pointer flex-1 min-w-0" aria-expanded={open}>
          {open ? <IoChevronDown size={20} className="shrink-0" /> : <IoChevronForward size={20} className="shrink-0" />}
          <span className="text-lg font-bold text-(--text-color)/60 shrink-0">{index + 1}.</span>
          <span className="text-xl truncate">
            {item ? (
              <>
                <span className="font-semibold text-(--black)">{item.name}</span>
                <span className="text-(--text-color)/68">
                  {" "}
                  &times; {line.quantity || 0} {item.unit}
                </span>
              </>
            ) : (
              <span className="text-orange-600 font-semibold">No item picked yet</span>
            )}
          </span>
        </button>
        {canRemove && (
          <button type="button" onClick={onRemove} className={btn.rowDanger} disabled={busy}>
            Remove
          </button>
        )}
      </div>
      {open && (
        <div className="flex flex-col gap-4 px-5 pb-5 pt-1">
          <div className="flex flex-col gap-2">
            <label htmlFor={`ask-find-${index}`} className={field.label}>
              Find an Item<Tip id="storeRequests.ask.find" />
            </label>
            <input id={`ask-find-${index}`} type="search" value={line.find} onChange={set("find")} placeholder="Type part of its name" className={field.input} autoComplete="off" disabled={busy} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`ask-item-${index}`} className={field.label}>
              Item<Tip id="storeRequests.ask.item" />
            </label>
            <select id={`ask-item-${index}`} value={line.item_id} onChange={set("item_id")} className={`${field.select} w-full`} disabled={busy}>
              <option value="">{shown.length ? `Pick an item (${shown.length})` : "No item matches"}</option>
              {shown.map((i) => (
                <option key={i.id} value={String(i.id)}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`ask-qty-${index}`} className={field.label}>
              Quantity{item ? ` (${item.unit})` : ""}
              <Tip id="storeRequests.ask.quantity" />
            </label>
            <input id={`ask-qty-${index}`} type="number" min="0" step="any" value={line.quantity} onChange={set("quantity")} className={field.input} disabled={busy} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`ask-note-${index}`} className={field.label}>
              Note (optional)<Tip id="storeRequests.ask.note" />
            </label>
            <AutoGrowTextarea id={`ask-note-${index}`} value={line.note} onChange={set("note")} className={field.textarea} maxLength={500} disabled={busy} />
          </div>
        </div>
      )}
    </div>
  );
}

// Asking the store: a department, then as many items as needed - + Add Item
// for each one more (owner, 2026-11-10). Each becomes its own request, which
// the store keeper issues or declines on its own.
function AskDialog({ data, onClose, onDone }) {
  const departments = Object.entries(data.departments);
  const [department, setDepartment] = useState(departments.length === 1 ? departments[0][0] : "");
  const [lines, setLines] = useState([emptyLine()]);
  // Which cards are open: the one being filled in. A new card opens and the
  // others close behind it; a card opens or closes when its summary is tapped.
  const [openLines, setOpenLines] = useState(() => new Set([0]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const itemOf = (line) => data.items.find((i) => String(i.id) === line.item_id);

  const change = (index, patch) => {
    setError(null);
    setLines((all) => all.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };
  const add = () => {
    setError(null);
    setLines((all) => [...all, emptyLine()]);
    setOpenLines(new Set([lines.length]));
  };
  const remove = (index) => {
    setError(null);
    setLines((all) => all.filter((_, i) => i !== index));
    setOpenLines((open) => {
      const next = new Set([...open].filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
      return next.size ? next : new Set([Math.max(0, index - 1)]);
    });
  };
  const toggle = (index) =>
    setOpenLines((open) => {
      const next = new Set(open);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const summary = lines.map((l) => {
    const item = itemOf(l);
    return item ? `${num(Number(l.quantity) || 0)} ${item.unit} of ${item.name}` : null;
  });

  const confirm = async () => {
    const problem = !department
      ? "Pick the department."
      : lines.map((l, i) => (!l.item_id ? `Item ${i + 1}: pick the item.` : !(Number(l.quantity) > 0) ? `Item ${i + 1}: give a quantity above 0.` : null)).find(Boolean);
    if (problem) {
      setError(problem);
      // Open the card that needs looking at.
      const bad = lines.findIndex((l) => !l.item_id || !(Number(l.quantity) > 0));
      if (bad >= 0) setOpenLines(new Set([bad]));
      return;
    }
    try {
      setBusy(true);
      setError(null);
      await createStoreRequests({
        department,
        items: lines.map((l) => ({ item_id: Number(l.item_id), quantity: Number(l.quantity), note: l.note.trim() || undefined })),
      });
      onDone(
        lines.length === 1
          ? `Asked the store for ${summary[0]}. The store keeper has been told.`
          : `Asked the store for ${lines.length} items. The store keeper has been told.`,
      );
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };

  const ready = summary.filter(Boolean);
  return (
    <Modal onClose={busy ? undefined : onClose} title="Ask the Store" size="md">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="ask-dept" className={field.label}>
            For<Tip id="storeRequests.ask.department" />
          </label>
          <select
            id="ask-dept"
            value={department}
            onChange={(e) => {
              setError(null);
              setDepartment(e.target.value);
            }}
            className={`${field.select} w-full`}
            disabled={busy}
          >
            {departments.length > 1 && <option value="">Pick a department</option>}
            {departments.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-4">
          {lines.map((line, index) => (
            <LineCard
              key={index}
              index={index}
              line={line}
              items={data.items}
              open={openLines.has(index)}
              onToggle={() => toggle(index)}
              onChange={(patch) => change(index, patch)}
              onRemove={() => remove(index)}
              canRemove={lines.length > 1}
              busy={busy}
            />
          ))}
        </div>
        <button type="button" onClick={add} className={`${btn.secondary} self-start`} disabled={busy || lines.length >= 50}>
          + Add Item
        </button>
        <ConfirmPanel
          question={
            lines.length === 1 && ready.length === 1
              ? `Ask the store for ${ready[0]}?`
              : `Ask the store for ${lines.length} item${lines.length !== 1 ? "s" : ""}?`
          }
          details={[
            ...(lines.length > 1 && ready.length ? [ready.join("; ") + "."] : []),
            "Each item is its own request: the store keeper issues it, or declines it saying why. You see the answers here.",
          ]}
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
  const [search, setSearch] = useState("");
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
      <PageHeader
        icon={IoBasketOutline}
        tipId="storeRequests.page"
        title="Store Requests"
        description="Ask the store for stock. The store keeper issues it or declines it, and the answer shows here."
      />

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
            <SearchField id="store-request-search" value={search} onChange={setSearch} placeholder="Item or department" tip="storeRequests.search" />
            <RequestsTable
              requests={data.requests.filter((r) => matchesSearch(search, r.item_name, r.department_label, r.requested_by_name, r.note))}
              empty={search.trim() ? `No request matches "${search.trim()}".` : "No requests yet."}
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
