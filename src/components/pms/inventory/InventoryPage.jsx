"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IoCubeOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import PageTabs from "@/components/pms/PageTabs";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Modal from "@/components/pms/Modal";
import Notice from "@/components/pms/Notice";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { Tip } from "@/components/pms/Tip";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { useLiveRefresh, usePmsLive } from "@/components/pms/live/PmsLive";
import RequestsTab from "./RequestsTab";
import InventoryReports from "./InventoryReports";
import { btn, card, field, page, table } from "@/components/pms/ui";
import { formatDateTime, money } from "@/lib/pms/format";
import {
  createInventoryItem,
  createSupplier,
  fetchInventory,
  fetchItemHistory,
  recordInventoryMovement,
  updateInventoryItem,
  updateSupplier,
} from "@/lib/pms/api/inventory-api";

// The store's inventory (backend docs/INVENTORY-PLAN.md; owner, 2026-11-04):
// the store keeper's page - items, receiving from suppliers, issuing to the
// departments (a drink issued to the Bar goes onto its bar stock), returns,
// write-offs and counts, each item's history, and the supplier list. The
// manager and the accountant read it. Every change is asked twice.

const num = (v) => {
  const n = Math.round(Number(v || 0) * 100) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};
const MOVES = {
  received: { label: "Received", sign: "+" },
  issued: { label: "Issued", sign: "-" },
  returned: { label: "Returned", sign: "+" },
  written_off: { label: "Written off", sign: "-" },
  counted: { label: "Counted", sign: "" },
};

function Field({ id, label, tip, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={field.label}>
        {label}
        <Tip id={tip} />
      </label>
      {children}
    </div>
  );
}

// ------------------------------------------------------------ the dialogs

function MovementDialog({ kind, item, data, onClose, onDone }) {
  const [form, setForm] = useState({ quantity: "", unit_cost: "", supplier_id: "", reference: "", department: kind === "received" ? "" : "", reason: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const amount = Number(form.quantity);
  const unit = item.unit;
  const deptName = data.departments[form.department];
  const toBar = item.drink_item_id && form.department === "bar";
  const suppliers = data.suppliers.filter((s) => s.is_active);

  const spec = {
    received: {
      title: `Receive ${item.name}`,
      question: `Receive ${num(amount)} ${unit} of ${item.name}${form.supplier_id ? ` from ${suppliers.find((s) => String(s.id) === form.supplier_id)?.name}` : ""}?`,
      details: [`The store will have ${num(item.on_hand + amount)} ${unit}.`, ...(form.unit_cost !== "" ? [`At ${money(form.unit_cost)} each - the item's latest cost${item.drink_item_id ? ", and the bar drink's cost price when it is issued" : ""}.`] : [])],
      confirmLabel: "Yes, receive it",
    },
    issued: {
      title: `Issue ${item.name}`,
      question: `Issue ${num(amount)} ${unit} of ${item.name} to ${deptName || "..."}?`,
      details: [`The store will have ${num(item.on_hand - amount)} ${unit}.`, ...(toBar ? [`It goes onto the bar's stock of ${item.drink_name}.`] : [])],
      confirmLabel: "Yes, issue it",
    },
    returned: {
      title: `Take Back ${item.name}`,
      question: `Take back ${num(amount)} ${unit} of ${item.name} from ${deptName || "..."}?`,
      details: [`The store will have ${num(item.on_hand + amount)} ${unit}.`, ...(toBar ? [`It comes off the bar's stock of ${item.drink_name}.`] : [])],
      confirmLabel: "Yes, take it back",
    },
    written_off: {
      title: `Write Off ${item.name}`,
      question: `Write off ${num(amount)} ${unit} of ${item.name}${form.reason ? ` as ${data.write_off_reasons[form.reason].toLowerCase()}` : ""}?`,
      details: [`The store will have ${num(item.on_hand - amount)} ${unit}.`],
      confirmLabel: "Yes, write it off",
      danger: true,
    },
    counted: {
      title: `Count ${item.name}`,
      question: `Record ${num(amount)} ${unit} of ${item.name} on the shelf?`,
      details: [
        `The store shows ${num(item.on_hand)} ${unit}, so this records ${amount - item.on_hand > 0 ? "+" : ""}${num(amount - item.on_hand)} ${unit}.`,
      ],
      confirmLabel: "Yes, record the count",
    },
  }[kind];

  const confirm = async () => {
    const problem =
      form.quantity === "" || Number.isNaN(amount) || (kind === "counted" ? amount < 0 : amount <= 0)
        ? kind === "counted" ? "Give the number counted." : "Give a quantity above 0."
        : (kind === "issued" || kind === "returned") && !form.department
          ? "Pick the department."
          : kind === "written_off" && !form.reason
            ? "Say why it is written off."
            : null;
    if (problem) {
      setError(problem);
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const r = await recordInventoryMovement(item.id, {
        movement_type: kind,
        quantity: amount,
        ...(kind === "received" ? { unit_cost: form.unit_cost === "" ? null : Number(form.unit_cost), supplier_id: form.supplier_id ? Number(form.supplier_id) : null, reference: form.reference.trim() || undefined } : {}),
        ...(kind === "issued" || kind === "returned" ? { department: form.department } : {}),
        ...(kind === "written_off" ? { reason: form.reason } : {}),
        note: form.note.trim() || undefined,
      });
      onDone(`${MOVES[kind].label}: ${item.name}. The store has ${num(r.on_hand)} ${unit}.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? undefined : onClose} title={spec.title} subtitle={`In the store: ${num(item.on_hand)} ${unit}`} size="md">
      <div className="flex flex-col gap-5">
        <Field id="inv-qty" label={kind === "counted" ? `Counted on the Shelf (${unit})` : `Quantity (${unit})`} tip={kind === "counted" ? "inventory.move.counted" : "inventory.move.quantity"}>
          <input id="inv-qty" type="number" min="0" step="any" value={form.quantity} onChange={set("quantity")} className={field.input} disabled={busy} />
        </Field>
        {kind === "received" && (
          <>
            <Field id="inv-supplier" label="Supplier" tip="inventory.move.supplier">
              <select id="inv-supplier" value={form.supplier_id} onChange={set("supplier_id")} className={`${field.select} w-full`} disabled={busy}>
                <option value="">Not given</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="inv-cost" label="Cost Each (optional)" tip="inventory.move.unitCost">
              <input id="inv-cost" type="number" min="0" step="any" value={form.unit_cost} onChange={set("unit_cost")} className={field.input} disabled={busy} />
            </Field>
            <Field id="inv-ref" label="Invoice or Waybill No. (optional)" tip="inventory.move.reference">
              <input id="inv-ref" type="text" maxLength={100} value={form.reference} onChange={set("reference")} className={field.input} disabled={busy} />
            </Field>
          </>
        )}
        {(kind === "issued" || kind === "returned") && (
          <Field id="inv-dept" label={kind === "issued" ? "To" : "From"} tip="inventory.move.department">
            <select id="inv-dept" value={form.department} onChange={set("department")} className={`${field.select} w-full`} disabled={busy}>
              <option value="">Pick a department</option>
              {Object.entries(data.departments).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        )}
        {kind === "written_off" && (
          <Field id="inv-reason" label="Why" tip="inventory.move.reason">
            <select id="inv-reason" value={form.reason} onChange={set("reason")} className={`${field.select} w-full`} disabled={busy}>
              <option value="">Pick a reason</option>
              {Object.entries(data.write_off_reasons).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field id="inv-note" label="Note (optional)" tip="inventory.move.note">
          <AutoGrowTextarea id="inv-note" value={form.note} onChange={set("note")} className={field.textarea} maxLength={500} disabled={busy} />
        </Field>
        <ConfirmPanel
          question={spec.question}
          details={spec.details}
          confirmLabel={spec.confirmLabel}
          busyLabel="Saving..."
          danger={spec.danger}
          busy={busy}
          error={error}
          onBack={onClose}
          onConfirm={confirm}
        />
      </div>
    </Modal>
  );
}

function ItemDialog({ item, data, onClose, onDone }) {
  const editing = Boolean(item);
  const [form, setForm] = useState({
    name: item?.name || "",
    category: item?.category || "",
    unit: item?.unit || "",
    reorder_level: item ? String(item.reorder_level) : "0",
    drink_item_id: item?.drink_item_id ? String(item.drink_item_id) : "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const drinks = data.drinks.filter((d) => !d.linked_to || d.linked_to === item?.id);
  const drinkName = drinks.find((d) => String(d.id) === form.drink_item_id)?.name;

  const confirm = async () => {
    const problem = !form.name.trim() ? "Give the item a name." : !form.category ? "Pick a category." : !form.unit.trim() ? "Give the unit it is counted in." : null;
    if (problem) {
      setError(problem);
      return;
    }
    const fields = {
      name: form.name.trim(),
      category: form.category,
      unit: form.unit.trim(),
      reorder_level: Number(form.reorder_level || 0),
      drink_item_id: form.drink_item_id ? Number(form.drink_item_id) : null,
    };
    try {
      setBusy(true);
      setError(null);
      if (editing) await updateInventoryItem(item.id, fields);
      else await createInventoryItem(fields);
      onDone(editing ? `${fields.name} saved.` : `${fields.name} is in the store, with nothing on hand yet - receive its stock.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? undefined : onClose} title={editing ? `Edit ${item.name}` : "Add a Store Item"} size="md">
      <div className="flex flex-col gap-5">
        <Field id="inv-name" label="Name" tip="inventory.item.name">
          <input id="inv-name" type="text" maxLength={150} value={form.name} onChange={set("name")} className={field.input} disabled={busy} />
        </Field>
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
          <Field id="inv-category" label="Category" tip="inventory.item.category">
            <select id="inv-category" value={form.category} onChange={set("category")} className={`${field.select} w-full`} disabled={busy}>
              <option value="">Pick one</option>
              {Object.entries(data.categories).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field id="inv-unit" label="Counted In" tip="inventory.item.unit">
            <input id="inv-unit" type="text" maxLength={30} placeholder="bottle, crate, kg, roll..." value={form.unit} onChange={set("unit")} className={field.input} disabled={busy} />
          </Field>
        </div>
        <Field id="inv-reorder" label="Reorder At" tip="inventory.item.reorder">
          <input id="inv-reorder" type="number" min="0" step="any" value={form.reorder_level} onChange={set("reorder_level")} className={field.input} disabled={busy} />
        </Field>
        <Field id="inv-drink" label="Bar Drink (optional)" tip="inventory.item.drink">
          <select id="inv-drink" value={form.drink_item_id} onChange={set("drink_item_id")} className={`${field.select} w-full`} disabled={busy}>
            <option value="">Not a bar drink</option>
            {drinks.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <ConfirmPanel
          question={editing ? `Save ${form.name || "the item"}?` : `Add ${form.name || "the item"} to the store?`}
          details={[
            drinkName
              ? `Issued to the Bar, it goes onto the bar's stock of ${drinkName} - and the bar gets ${drinkName} only from the store.`
              : "It isn't a bar drink.",
            "The change is recorded in the Audit Trail.",
          ]}
          confirmLabel={editing ? "Yes, save it" : "Yes, add it"}
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

function RetireDialog({ item, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const retiring = item.is_active;
  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      await updateInventoryItem(item.id, { is_active: !retiring });
      onDone(retiring ? `${item.name} is retired.` : `${item.name} is back in the store.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title={retiring ? `Retire ${item.name}` : `Bring Back ${item.name}`} size="md">
      <ConfirmPanel
        question={retiring ? `Retire ${item.name}?` : `Bring back ${item.name}?`}
        details={
          retiring
            ? ["It stops being received, issued or counted, and leaves the list. Its history is kept.", ...(item.on_hand ? [`The store still shows ${num(item.on_hand)} ${item.unit} of it.`] : [])]
            : ["It can be received, issued and counted again."]
        }
        confirmLabel={retiring ? "Yes, retire it" : "Yes, bring it back"}
        busyLabel="Saving..."
        danger={retiring}
        busy={busy}
        error={error}
        onBack={onClose}
        onConfirm={confirm}
      />
    </Modal>
  );
}

function HistoryDialog({ item, data, onClose }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetchItemHistory(item.id).then(
      (h) => !cancelled && setHistory(h),
      (err) => !cancelled && setError(err.message || "Could not load the history."),
    );
    return () => {
      cancelled = true;
    };
  }, [item.id]);
  const detail = (m) =>
    [
      m.supplier_name && `from ${m.supplier_name}`,
      m.department && `${m.movement_type === "issued" ? "to" : "from"} ${data.departments[m.department] || m.department}`,
      m.reason && (data.write_off_reasons[m.reason] || m.reason),
      m.unit_cost !== null && m.unit_cost !== undefined && `${money(m.unit_cost)} each`,
      m.reference,
      m.note,
    ]
      .filter(Boolean)
      .join(" · ");
  return (
    <Modal onClose={onClose} title={`${item.name} - History`} subtitle={`In the store: ${num(item.on_hand)} ${item.unit}`} size="xl">
      {error && <p className={field.error}>{error}</p>}
      {!history && !error ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        history && (
          <div className={table.card}>
            <div className={table.scroll}>
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>When<Tip id="inventory.history.when" /></th>
                    <th className={table.th}>What<Tip id="inventory.history.what" /></th>
                    <th className={table.th}>Quantity<Tip id="inventory.history.quantity" /></th>
                    <th className={table.th}>After<Tip id="inventory.history.after" /></th>
                    <th className={table.th}>Details<Tip id="inventory.history.details" /></th>
                    <th className={table.th}>By<Tip id="inventory.history.by" /></th>
                  </tr>
                </thead>
                <tbody>
                  {history.movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={table.empty}>
                        Nothing yet - receive its stock to start.
                      </td>
                    </tr>
                  ) : (
                    history.movements.map((m) => (
                      <tr key={m.id} className={table.row}>
                        <td className={`${table.td} ${table.stickyTd}`}>{formatDateTime(m.movement_date)}</td>
                        <td className={table.td}>{MOVES[m.movement_type]?.label || m.movement_type}</td>
                        <td className={`${table.td} font-semibold ${m.quantity < 0 ? "text-red-700" : "text-green-800"}`}>
                          {m.quantity > 0 ? "+" : ""}
                          {num(m.quantity)}
                        </td>
                        <td className={table.td}>{num(m.balance)}</td>
                        <td className={`${table.td} whitespace-normal! min-w-[18rem]`}>{detail(m) || "—"}</td>
                        <td className={table.td}>{m.recorded_by || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </Modal>
  );
}

function SupplierDialog({ supplier, onClose, onDone }) {
  const editing = Boolean(supplier);
  const [form, setForm] = useState({ name: supplier?.name || "", phone: supplier?.phone || "", email: supplier?.email || "", notes: supplier?.notes || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const confirm = async () => {
    if (!form.name.trim()) {
      setError("Give the supplier's name.");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const fields = { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), notes: form.notes.trim() };
      if (editing) await updateSupplier(supplier.id, fields);
      else await createSupplier(fields);
      onDone(editing ? `${fields.name} saved.` : `${fields.name} is on the supplier list.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title={editing ? `Edit ${supplier.name}` : "Add a Supplier"} size="md">
      <div className="flex flex-col gap-5">
        <Field id="sup-name" label="Name" tip="inventory.supplier.name">
          <input id="sup-name" type="text" maxLength={150} value={form.name} onChange={set("name")} className={field.input} disabled={busy} />
        </Field>
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
          <Field id="sup-phone" label="Phone (optional)" tip="inventory.supplier.phone">
            <input id="sup-phone" type="tel" maxLength={40} value={form.phone} onChange={set("phone")} className={field.input} disabled={busy} />
          </Field>
          <Field id="sup-email" label="Email (optional)" tip="inventory.supplier.email">
            <input id="sup-email" type="email" maxLength={150} value={form.email} onChange={set("email")} className={field.input} disabled={busy} />
          </Field>
        </div>
        <Field id="sup-notes" label="Notes (optional)" tip="inventory.supplier.notes">
          <AutoGrowTextarea id="sup-notes" value={form.notes} onChange={set("notes")} className={field.textarea} maxLength={500} disabled={busy} />
        </Field>
        <ConfirmPanel
          question={editing ? `Save ${form.name || "the supplier"}?` : `Add ${form.name || "the supplier"} to the list?`}
          details={["Received stock can be put down to them.", "The change is recorded in the Audit Trail."]}
          confirmLabel={editing ? "Yes, save it" : "Yes, add it"}
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

function SupplierToggleDialog({ supplier, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const off = supplier.is_active;
  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      await updateSupplier(supplier.id, { is_active: !off });
      onDone(off ? `${supplier.name} is off the list.` : `${supplier.name} is back on the list.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title={off ? `Take ${supplier.name} Off the List` : `Put ${supplier.name} Back`} size="md">
      <ConfirmPanel
        question={off ? `Take ${supplier.name} off the supplier list?` : `Put ${supplier.name} back on the list?`}
        details={off ? ["It can't be picked for new deliveries. Past deliveries keep its name."] : ["It can be picked for deliveries again."]}
        confirmLabel={off ? "Yes, take it off" : "Yes, put it back"}
        busyLabel="Saving..."
        danger={off}
        busy={busy}
        error={error}
        onBack={onClose}
        onConfirm={confirm}
      />
    </Modal>
  );
}

// -------------------------------------------------------------- the page

export default function InventoryPage() {
  const { role } = usePmsSession();
  const canEdit = role === "storekeeper" || role === "developer";
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [tab, setTab] = useState("stock");
  const [dialog, setDialog] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchInventory().then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the store."),
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const done = useCallback((message) => {
    setDialog(null);
    setNotice(message);
    setReloadKey((k) => k + 1);
  }, []);
  // Kept current when stock moves on another device (a request issued, say).
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  useLiveRefresh(reload, ["inventory"]);
  // The sidebar's Inventory badge, split across the tabs it comes from, so
  // the numbers always add up: items low on stock on Stock, requests waiting
  // on Requests (those count for whoever answers them - the store keeper).
  const { inventoryPending: waiting, inventoryLow: low } = usePmsLive();

  const items = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.items.filter((i) => (showRetired || i.is_active) && (!category || i.category === category) && (!q || i.name.toLowerCase().includes(q)));
  }, [data, search, category, showRetired]);

  const open = (kind, item) => setDialog({ kind, item });

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoCubeOutline}
        tipId="inventory.page"
        title="Inventory"
        description="What the store holds: received from suppliers, issued to the departments, returned, written off and counted."
      >
        <PageTabs
          tabs={[
            { key: "stock", label: "Stock", badge: low, badgeLabel: "items low on stock" },
            { key: "requests", label: "Requests", badge: waiting, badgeLabel: "requests waiting" },
            { key: "reports", label: "Reports" },
            { key: "suppliers", label: "Suppliers" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </PageHeader>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {tab === "requests" ? (
        <RequestsTab canEdit={canEdit} onDone={setNotice} />
      ) : tab === "reports" ? (
        <InventoryReports />
      ) : !data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data &&
        (tab === "stock" ? (
          <div className="w-full flex flex-col gap-6">
            <div className="w-full grid grid-cols-3 max-sm:grid-cols-1 gap-4">
              {[
                ["Items", data.totals.items, "inventory.totals.items"],
                ["Low on Stock", data.totals.low, "inventory.totals.low"],
                ["Store Value", money(data.totals.value), "inventory.totals.value"],
              ].map(([label, value, tip]) => (
                <div key={label} className={`${card.surface} p-5 flex flex-col gap-1`}>
                  <span className={field.label}>
                    {label}
                    <Tip id={tip} />
                  </span>
                  <span className={`text-3xl font-bold ${label === "Low on Stock" && value > 0 ? "text-red-700" : "text-(--black)"}`}>{value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <Field id="inv-search" label="Search" tip="inventory.search">
                <input id="inv-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className={field.input} placeholder="Item name" />
              </Field>
              <Field id="inv-filter" label="Category" tip="inventory.filter">
                <select id="inv-filter" value={category} onChange={(e) => setCategory(e.target.value)} className={field.select}>
                  <option value="">All</option>
                  {Object.entries(data.categories).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 text-xl pb-3 cursor-pointer">
                <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} className="w-5 h-5" />
                Show retired items
              </label>
              {canEdit && (
                <button type="button" onClick={() => open("item", null)} className={`${btn.primary} ml-auto`}>
                  Add Item
                </button>
              )}
            </div>

            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`${table.th} ${table.stickyTh}`}>Item<Tip id="inventory.col.item" /></th>
                      <th className={table.th}>Category<Tip id="inventory.col.category" /></th>
                      <th className={table.th}>In the Store<Tip id="inventory.col.onHand" /></th>
                      <th className={table.th}>Reorder At<Tip id="inventory.col.reorder" /></th>
                      <th className={table.th}>Last Cost<Tip id="inventory.col.lastCost" /></th>
                      <th className={table.th}>Value<Tip id="inventory.col.value" /></th>
                      <th className={table.th}>Actions<Tip id="inventory.col.actions" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={table.empty}>
                          {data.items.length === 0 ? (canEdit ? "No items yet - add the first one." : "No items yet.") : "No items match."}
                        </td>
                      </tr>
                    ) : (
                      items.map((i) => (
                        <tr key={i.id} className={`${table.row} ${i.is_active ? "" : "opacity-60"}`}>
                          <td className={`${table.td} ${table.stickyTd}`}>
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold">{i.name}</span>
                              <span className="flex flex-wrap gap-2">
                                {i.low && <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Low</span>}
                                {i.drink_name && <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Bar: {i.drink_name}</span>}
                                {!i.is_active && <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">Retired</span>}
                              </span>
                            </div>
                          </td>
                          <td className={table.td}>{data.categories[i.category] || i.category}</td>
                          <td className={`${table.td} font-semibold`}>
                            {num(i.on_hand)} {i.unit}
                          </td>
                          <td className={table.td}>{num(i.reorder_level)}</td>
                          <td className={table.td}>{i.last_unit_cost === null ? "—" : money(i.last_unit_cost)}</td>
                          <td className={table.td}>{i.value === null ? "—" : money(i.value)}</td>
                          <td className={table.td}>
                            <div className={`${table.actions} flex-wrap!`}>
                              {canEdit && i.is_active && (
                                <>
                                  <button type="button" onClick={() => open("received", i)} className={btn.rowPrimary}>
                                    Receive
                                  </button>
                                  <button type="button" onClick={() => open("issued", i)} className={btn.rowPrimary}>
                                    Issue
                                  </button>
                                </>
                              )}
                              {/* History sits in More... so a row is one line shorter on a phone (owner, 2026-11-05). */}
                              {canEdit ? (
                                <select
                                  aria-label={`More for ${i.name}`}
                                  value=""
                                  onChange={(e) => e.target.value && open(e.target.value, i)}
                                  className={`${field.select} text-lg! py-2! max-w-[15rem]`}
                                >
                                  <option value="">More...</option>
                                  <option value="history">History</option>
                                  {i.is_active && <option value="returned">Take back from a department</option>}
                                  {i.is_active && <option value="written_off">Write off</option>}
                                  {i.is_active && <option value="counted">Count</option>}
                                  <option value="item">Edit</option>
                                  <option value="retire">{i.is_active ? "Retire" : "Bring back"}</option>
                                </select>
                              ) : (
                                <button type="button" onClick={() => open("history", i)} className={btn.rowSecondary}>
                                  History
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6">
            {canEdit && (
              <div>
                <button type="button" onClick={() => setDialog({ kind: "supplier", supplier: null })} className={btn.primary}>
                  Add Supplier
                </button>
              </div>
            )}
            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`${table.th} ${table.stickyTh}`}>Supplier<Tip id="inventory.supplier.name" /></th>
                      <th className={table.th}>Phone<Tip id="inventory.supplier.phone" /></th>
                      <th className={table.th}>Email<Tip id="inventory.supplier.email" /></th>
                      <th className={table.th}>Notes<Tip id="inventory.supplier.notes" /></th>
                      {canEdit && <th className={table.th}>Actions<Tip id="inventory.col.actions" /></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.suppliers.length === 0 ? (
                      <tr>
                        <td colSpan={canEdit ? 5 : 4} className={table.empty}>
                          No suppliers yet.
                        </td>
                      </tr>
                    ) : (
                      data.suppliers.map((s) => (
                        <tr key={s.id} className={`${table.row} ${s.is_active ? "" : "opacity-60"}`}>
                          <td className={`${table.td} ${table.stickyTd} font-semibold`}>
                            {s.name}
                            {!s.is_active && <span className="ml-2 text-sm font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">Off the list</span>}
                          </td>
                          <td className={table.td}>{s.phone || "—"}</td>
                          <td className={table.td}>{s.email || "—"}</td>
                          <td className={`${table.td} whitespace-normal! min-w-[16rem]`}>{s.notes || "—"}</td>
                          {canEdit && (
                            <td className={table.td}>
                              <div className={table.actions}>
                                <button type="button" onClick={() => setDialog({ kind: "supplier", supplier: s })} className={btn.rowSecondary}>
                                  Edit
                                </button>
                                <button type="button" onClick={() => setDialog({ kind: "supplierToggle", supplier: s })} className={s.is_active ? btn.rowDanger : btn.rowSecondary}>
                                  {s.is_active ? "Take off list" : "Put back"}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {dialog && data && (
        <>
          {MOVES[dialog.kind] && <MovementDialog kind={dialog.kind} item={dialog.item} data={data} onClose={() => setDialog(null)} onDone={done} />}
          {dialog.kind === "item" && <ItemDialog item={dialog.item} data={data} onClose={() => setDialog(null)} onDone={done} />}
          {dialog.kind === "retire" && <RetireDialog item={dialog.item} onClose={() => setDialog(null)} onDone={done} />}
          {dialog.kind === "history" && <HistoryDialog item={dialog.item} data={data} onClose={() => setDialog(null)} />}
          {dialog.kind === "supplier" && <SupplierDialog supplier={dialog.supplier} onClose={() => setDialog(null)} onDone={done} />}
          {dialog.kind === "supplierToggle" && <SupplierToggleDialog supplier={dialog.supplier} onClose={() => setDialog(null)} onDone={done} />}
        </>
      )}
    </div>
  );
}
