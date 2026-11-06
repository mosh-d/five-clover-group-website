"use client";
"use no memo";

// Carried over from the branch PMS's admin_pages/AdminMenu.jsx (2026-09-28).
import { useState, useEffect, useCallback, Fragment } from "react";
import { IoRestaurantOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import PageTabs from "@/components/pms/PageTabs";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { btn, field, table } from "@/components/pms/ui";
import { canEditMenu, isWaitstaff } from "@/lib/pms/auth";
import {
  fetchFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  fetchDrinkItems,
  createDrinkItem,
  updateDrinkItem,
  deleteDrinkItem,
  recordDrinkStockMovement,
  fetchLaundryItems,
  createLaundryItem,
  updateLaundryItem,
  deleteLaundryItem,
} from "@/lib/pms/api/menu-api";
import StatusBadge from "@/components/pms/StatusBadge";
import { money } from "@/lib/pms/format";
import { serviceChargeText } from "@/lib/pms/serviceCharge";
import { Tip } from "@/components/pms/Tip";
import Modal from "@/components/pms/Modal";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Notice from "@/components/pms/Notice";

const EMPTY_LAUNDRY_FORM = { name: "", wash_and_iron_price: "", ironing_only_price: "" };

// A cost price as the form holds it ("" for none), and back. A cost price is
// what one costs the hotel (Accounting, Step 12) - the store keeper's, never
// the F&B floor's: the server leaves it out for anyone else.
const costText = (v) => (v === null || v === undefined ? "" : String(Number(v)));
const costValue = (text) => (text === "" ? null : Number(text));
const badCost = (text) => text !== "" && !(Number(text) >= 0);

// A service charge is a fixed amount per one sold, or a percentage of the
// price (owner, 2026-11-05).
const CHARGE_TYPES = [
  { value: "fixed", label: "Fixed (₦)" },
  { value: "percent", label: "Percentage (%)" },
];
const badCharge = (text, type) => text !== "" && !(Number(text) >= 0 && (type !== "percent" || Number(text) <= 100));
const EMPTY_MENU_FORM = { name: "", price: "", service_charge: "", service_charge_type: "fixed", cost_price: "" };

// The money and stock columns, a little narrower, so a drink's row - its cost
// price and three actions too - still fits a laptop.
const narrow = "px-5!";

export default function AdminMenu() {
  // Pricing/add/delete belongs to manager, accountant and storekeeper
  // (2026-09-07); a waitron reaches this page for exactly one thing —
  // adjusting drink stock — so they get in, but read-only on the items
  // themselves. The Adjust Stock control below is gated on `recordStock`
  // rather than canEdit, which is what keeps it available to them.
  const canEdit = canEditMenu();
  const canAccess = canEdit || isWaitstaff();
  const [tab, setTab] = useState("food");

  if (!canAccess) {
    return (
      <div data-component="AdminMenu" className="px-[4rem] max-sm:px-[1rem] py-[4rem]">
        <p className="text-2xl text-[color:var(--text-color)]/68">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div data-component="AdminMenu" className="flex flex-col items-start gap-[3rem]">
      <PageHeader
        icon={IoRestaurantOutline}
        tipId="menu.page"
        title="Menu"
        description={
          <>
            Food and drink items a waitron picks from when posting a charge to a folio, or when recording a non-guest sale. Prices set here are what an order charges.
            {canEdit && " Cost prices - what an item costs the hotel - are for the accountant's F&B Margin; waitrons don't see them."}
          </>
        }
      >
        {/* One row of section switches (PageTabs) - owner, 2026-11-06. */}
        <PageTabs
          tabs={[
            { key: "food", label: "Food" },
            { key: "drinks", label: "Drinks" },
            { key: "laundry", label: "Laundry" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </PageHeader>

      {tab === "laundry" ? (
        <LaundrySection canEdit={canEdit} />
      ) : tab === "food" ? (
        <MenuSection
          key="food"
          label="food item"
          fetchItems={fetchFoodItems}
          createItem={createFoodItem}
          updateItem={updateFoodItem}
          deleteItem={deleteFoodItem}
          canEdit={canEdit}
        />
      ) : (
        <MenuSection
          key="drinks"
          label="drink item"
          fetchItems={fetchDrinkItems}
          createItem={createDrinkItem}
          updateItem={updateDrinkItem}
          deleteItem={deleteDrinkItem}
          recordStock={recordDrinkStockMovement}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

function MenuSection({ label, fetchItems, createItem, updateItem, deleteItem, recordStock, canEdit }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const [addForm, setAddForm] = useState(EMPTY_MENU_FORM);
  const [adding, setAdding] = useState(false);

  // Editing opens a dialog, like Inventory's items (owner, 2026-11-05).
  const [editItem, setEditItem] = useState(null);
  const [notice, setNotice] = useState(null);
  const [savingId, setSavingId] = useState(null);

  // Delete is only allowed for an item with zero order/stock history (the
  // backend rejects anything else with a 409) — a two-click confirm avoids
  // a native confirm() popup for something this rarely used and hard to undo.
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Stock adjustment (drinks only — recordStock is undefined for food) —
  // feeds the Bar Stock report (Reports → Bar Stock), separate from is_active
  // ("In Stock"/"Out of Stock" above, which is really just menu availability).
  const [stockAdjustId, setStockAdjustId] = useState(null);
  const [stockForm, setStockForm] = useState({ movement_type: "added", quantity: "", notes: "", unit_cost: "" });
  const [savingStockId, setSavingStockId] = useState(null);
  const [stockSuccessId, setStockSuccessId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await fetchItems(showInactive));
      setError(null);
    } catch (err) {
      setError((err.response?.data?.message || `Failed to load ${label}s.`) + " Please refresh the page.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.price || badCost(addForm.cost_price) || badCharge(addForm.service_charge, addForm.service_charge_type)) return;
    try {
      setAdding(true);
      setError(null);
      await createItem({
        name: addForm.name.trim(),
        price: Number(addForm.price),
        service_charge: Number(addForm.service_charge || 0),
        service_charge_type: addForm.service_charge_type,
        ...(addForm.cost_price === "" ? {} : { cost_price: Number(addForm.cost_price) }),
      });
      setAddForm(EMPTY_MENU_FORM);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to add ${label}.`);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      setSavingId(item.id);
      setError(null);
      await updateItem(item.id, { is_active: !item.is_active });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update ${label}.`);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (item) => {
    try {
      setDeletingId(item.id);
      setError(null);
      await deleteItem(item.id);
      setConfirmDeleteId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to delete ${label}.`);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  // Drinks only (recordStock is undefined for food): once an item has a
  // tracked stock ledger, computed current_stock hitting 0 or below shows
  // "Out of Stock" automatically — informational only, doesn't block
  // ordering (a hotel may still have physical stock that just hasn't been
  // logged as "Added" yet). current_stock is null until the item's first
  // stock movement is ever recorded — shown as its own "Not Tracked" state
  // rather than defaulting to "In Stock", which used to read as false
  // confidence (every drink showed In Stock even with zero stock ever
  // logged).
  const statusBadge = (item) => {
    if (!item.is_active) return { label: "Out of Stock", className: "bg-gray-100 text-gray-600" };
    if (recordStock) {
      if (item.current_stock === null || item.current_stock === undefined) {
        return { label: "Not Tracked", className: "bg-gray-100 text-gray-600" };
      }
      if (item.current_stock <= 0) return { label: "Out of Stock", className: "bg-gray-100 text-gray-600" };
    }
    return { label: "In Stock", className: "bg-green-100 text-green-700" };
  };

  // A drink the store supplies gets its bar stock only from Inventory (owner,
  // 2026-11-05), so its adjust starts on Damaged and offers no Added.
  const startStockAdjust = (item) => {
    setStockAdjustId(item.id);
    setStockForm({ movement_type: item.store_item_name ? "damaged" : "added", quantity: "", notes: "", unit_cost: "" });
  };

  const handleSaveStockAdjust = async (id) => {
    const qty = Number(stockForm.quantity);
    // Added/damaged are always a positive count. Correction is the odd one
    // out: the field holds the real, physically-counted stock total (never
    // negative, and 0 is a genuine valid count — fully out of stock) — the
    // server works out the ledger delta against the live current stock.
    const valid = stockForm.movement_type === "correction"
      ? stockForm.quantity !== "" && qty >= 0
      : qty >= 1;
    if (!valid) return;
    try {
      setSavingStockId(id);
      setError(null);
      await recordStock(id, {
        movement_type: stockForm.movement_type,
        quantity: Number(stockForm.quantity),
        notes: stockForm.notes.trim() || undefined,
        // A restock's cost each, if given: it becomes the drink's cost price.
        ...(stockForm.movement_type === "added" && stockForm.unit_cost !== "" ? { unit_cost: Number(stockForm.unit_cost) } : {}),
      });
      setStockAdjustId(null);
      setStockSuccessId(id);
      setTimeout(() => setStockSuccessId(null), 4000);
      await load(); // reflect the new current_stock/status without a reload
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record stock movement.");
    } finally {
      setSavingStockId(null);
    }
  };

  // Stock is a drinks-only column — Name, Price, Service Charge, Status,
  // Actions is 5 for food; drinks get a 6th for it. Cost Price is one more
  // for whoever edits the menu.
  const columnCount = (recordStock ? 6 : 5) + (canEdit ? 1 : 0);

  const stockQtyValid = (stockForm.movement_type === "correction"
    ? stockForm.quantity !== "" && Number(stockForm.quantity) >= 0
    : Number(stockForm.quantity) >= 1) && !(stockForm.movement_type === "added" && badCost(stockForm.unit_cost));

  return (
    <div className="w-full flex flex-col gap-6">
      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className="text-red-600 text-xl bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

      <label className="flex items-center gap-3 text-xl cursor-pointer">
        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="w-5 h-5 cursor-pointer" />
        Show out-of-stock items
        <Tip id="menu.showInactive" />
      </label>

      <div className={table.card}>
        <div className={table.scroll}>
          <table className={table.el}>
            <thead>
              <tr className={table.headRow}>
                <th className={`${table.th} ${table.stickyTh}`}>Name<Tip id="menu.col.name" /></th>
                <th className={`${table.th} ${narrow}`}>Price (₦)<Tip id="menu.col.price" /></th>
                {canEdit && <th className={`${table.th} ${narrow}`}>Cost Price (₦)<Tip id="menu.col.costPrice" /></th>}
                <th className={`${table.th} ${narrow}`}>Service Charge<Tip id="menu.col.serviceCharge" /></th>
                {recordStock && <th className={`${table.th} ${narrow}`}>Stock<Tip id="menu.col.stock" /></th>}
                <th className={table.th}>Status<Tip id="menu.col.status" /></th>
                <th className={table.th}>Actions<Tip id="menu.col.actions" /></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columnCount} className="px-8 py-10 text-center text-xl"><LoadingSpinner /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={columnCount} className="px-8 py-10 text-center text-xl text-[color:var(--text-color)]/68">No {label}s yet.</td></tr>
              ) : (
                items.map((item) => (
                  <Fragment key={item.id}>
                    <tr className={table.row}>
                      <>
                          <td className={`${table.td} ${table.stickyTd} font-medium`}>{item.name}</td>
                          <td className={`${table.td} ${narrow}`}>{money(item.price)}</td>
                          {canEdit && <td className={`${table.td} ${narrow}`}>{item.cost_price === null || item.cost_price === undefined ? "—" : money(item.cost_price)}</td>}
                          <td className={`${table.td} ${narrow}`}>{serviceChargeText(item)}</td>
                          {recordStock && (
                            <td className={`${table.td} ${narrow}`}>{item.current_stock ?? "—"}</td>
                          )}
                          <td className={table.td}>
                            <span className={`text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${statusBadge(item).className}`}>
                              {statusBadge(item).label}
                            </span>
                          </td>
                          <td className={table.td}>
                            <div className={table.actions}>
                              {canEdit && <button onClick={() => setEditItem(item)} className={btn.rowSecondary}>Edit</button>}
                              {/* For drinks, going out of stock is now automatic (computed from the ledger) — this manual toggle only stays available to reactivate an item deactivated before that existed. */}
                              {canEdit && (!recordStock || !item.is_active) && (
                                <button onClick={() => handleToggleActive(item)} disabled={savingId === item.id} className={item.is_active ? btn.rowDanger : btn.rowSuccess}>
                                  {savingId === item.id ? "..." : item.is_active ? "Set Out of Stock" : "Mark In Stock"}
                                </button>
                              )}
                              {recordStock && (
                                <button onClick={() => startStockAdjust(item)} className={btn.rowSecondary}>
                                  {stockSuccessId === item.id ? "Recorded ✓" : "Adjust Stock"}
                                </button>
                              )}
                              {canEdit && deleteItem && (
                                confirmDeleteId === item.id ? (
                                  <>
                                    <button onClick={() => handleDelete(item)} disabled={deletingId === item.id} className={btn.rowDanger}>
                                      {deletingId === item.id ? "Deleting..." : "Confirm Delete"}
                                    </button>
                                    <button onClick={() => setConfirmDeleteId(null)} className={btn.rowSecondary}>Cancel</button>
                                  </>
                                ) : (
                                  <button onClick={() => setConfirmDeleteId(item.id)} className={btn.rowSecondary}>Delete</button>
                                )
                              )}
                            </div>
                          </td>
                      </>
                    </tr>
                    {recordStock && stockAdjustId === item.id && (
                      <tr className={table.row}>
                        <td colSpan={columnCount} className={`${table.td} bg-[color:var(--text-color)]/3`}>
                          <div className="flex flex-wrap gap-4 items-end">
                            <span className="text-xl font-semibold whitespace-nowrap">Adjust stock — {item.name}</span>
                            {item.store_item_name && (
                              <span className={`w-full text-lg ${"text-(--text-color)/68"}`}>
                                Restocked from the store (&quot;{item.store_item_name}&quot;) - issue it to the Bar on Inventory.
                              </span>
                            )}
                            <div className="flex flex-col gap-2">
                              <label className={field.label}>Type<Tip id="menu.stock.type" /></label>
                              <select value={stockForm.movement_type} onChange={(e) => setStockForm({ ...stockForm, movement_type: e.target.value })} className={`${field.select} text-xl!`}>
                                {!item.store_item_name && <option value="added">Added (restock)</option>}
                                <option value="damaged">Damaged (breakage/spillage/expiry)</option>
                                <option value="correction">Correction (set the real, counted total)</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className={field.label}>{stockForm.movement_type === "correction" ? "Actual Count" : "Quantity"}<Tip id="menu.stock.quantity" /></label>
                              <input
                                type="number"
                                min="0"
                                value={stockForm.quantity}
                                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                                className={`${field.input} text-xl! w-32`}
                              />
                              {stockForm.movement_type === "correction" && (
                                <span className="text-base text-[color:var(--text-color)]/60">The real total counted on the shelf right now, not a +/- adjustment</span>
                              )}
                            </div>
                            {stockForm.movement_type === "added" && canEdit && (
                              <div className="flex flex-col gap-2">
                                <label htmlFor={`unit-cost-${item.id}`} className={field.label}>Unit Cost (₦, optional)<Tip id="menu.stock.unitCost" /></label>
                                <input
                                  id={`unit-cost-${item.id}`}
                                  type="number"
                                  min="0"
                                  value={stockForm.unit_cost}
                                  onChange={(e) => setStockForm({ ...stockForm, unit_cost: e.target.value })}
                                  className={`${field.input} text-xl! w-32`}
                                />
                                <span className="text-base text-[color:var(--text-color)]/60">What each one cost. It becomes the drink&apos;s cost price.</span>
                              </div>
                            )}
                            <div className="flex flex-col gap-2 flex-1 min-w-48">
                              <label className={field.label}>Notes (optional)<Tip id="menu.stock.notes" /></label>
                              <AutoGrowTextarea value={stockForm.notes} onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })} className={`${field.textarea} text-xl!`} />
                            </div>
                            <div className={table.actions}>
                              <button onClick={() => handleSaveStockAdjust(item.id)} disabled={savingStockId === item.id || !stockQtyValid} className={btn.rowPrimary}>
                                {savingStockId === item.id ? "Saving..." : "Save"}
                              </button>
                              <button onClick={() => setStockAdjustId(null)} className={btn.rowSecondary}>Cancel</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canEdit && (
        <form onSubmit={handleAdd} className="flex flex-col gap-4 bg-(--card) rounded-xl border border-(--accent-2) p-6 max-w-xl">
          <p className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/68">Add a {label}<Tip id="menu.add" /></p>
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex flex-col gap-2 flex-1 min-w-48">
              <label className={field.label}>Name<Tip id="menu.add.name" /></label>
              <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className={field.input} />
            </div>
            <div className="flex flex-col gap-2 w-40">
              <label className={field.label}>Price (₦)<Tip id="menu.add.price" /></label>
              <input type="number" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} className={field.input} />
            </div>
            <div className="flex flex-col gap-2 w-40">
              <label htmlFor="menu-add-charge-type" className={field.label}>Service Charge Is<Tip id="menu.add.serviceChargeType" /></label>
              <select id="menu-add-charge-type" value={addForm.service_charge_type} onChange={(e) => setAddForm({ ...addForm, service_charge_type: e.target.value })} className={field.select}>
                {CHARGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 w-40">
              <label htmlFor="menu-add-charge" className={field.label}>Service Charge ({addForm.service_charge_type === "percent" ? "%" : "₦"})<Tip id="menu.add.serviceCharge" /></label>
              <input id="menu-add-charge" type="number" min="0" max={addForm.service_charge_type === "percent" ? 100 : undefined} value={addForm.service_charge} onChange={(e) => setAddForm({ ...addForm, service_charge: e.target.value })} className={field.input} />
            </div>
            <div className="flex flex-col gap-2 w-40">
              <label htmlFor="menu-add-cost" className={field.label}>Cost Price (₦)<Tip id="menu.add.costPrice" /></label>
              <input id="menu-add-cost" type="number" min="0" placeholder="Optional" value={addForm.cost_price} onChange={(e) => setAddForm({ ...addForm, cost_price: e.target.value })} className={field.input} />
            </div>
            <button type="submit" disabled={adding || !addForm.name.trim() || !addForm.price || badCost(addForm.cost_price) || badCharge(addForm.service_charge, addForm.service_charge_type)} className={btn.primary}>
              {adding ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      )}

      {editItem && (
        <MenuItemDialog
          item={editItem}
          label={label}
          updateItem={updateItem}
          onClose={() => setEditItem(null)}
          onDone={async (message) => {
            setEditItem(null);
            setError(null);
            setNotice(message);
            await load();
          }}
        />
      )}
    </div>
  );
}

function DialogField({ id, label, tip, children }) {
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

// Edit a food or drink item: its name, price, service charge and cost price.
function MenuItemDialog({ item, label, updateItem, onClose, onDone }) {
  const [form, setForm] = useState({
    name: item.name,
    price: String(item.price),
    service_charge: String(Number(item.service_charge || 0)),
    service_charge_type: item.service_charge_type || "fixed",
    cost_price: costText(item.cost_price),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const confirm = async () => {
    const problem = !form.name.trim()
      ? "Give the item a name."
      : form.price === "" || !(Number(form.price) >= 0)
        ? "Give a price of 0 or more."
        : form.service_charge !== "" && !(Number(form.service_charge) >= 0)
          ? "A service charge can't be below 0."
          : form.service_charge_type === "percent" && Number(form.service_charge) > 100
            ? "A service charge can't be more than 100% of the price."
          : badCost(form.cost_price)
            ? "A cost price can't be below 0. Leave it empty for none."
            : null;
    if (problem) {
      setError(problem);
      return;
    }
    // The cost price goes only when it changed (empty clears it).
    const cost = costValue(form.cost_price);
    const costChanged = cost !== costValue(costText(item.cost_price));
    try {
      setBusy(true);
      setError(null);
      await updateItem(item.id, {
        name: form.name.trim(),
        price: Number(form.price),
        service_charge: Number(form.service_charge || 0),
        service_charge_type: form.service_charge_type,
        ...(costChanged ? { cost_price: cost } : {}),
      });
      onDone(`${form.name.trim()} saved.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to update the ${label}.`);
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? undefined : onClose} title={`Edit ${item.name}`} size="md">
      <div className="flex flex-col gap-5">
        <DialogField id="menu-edit-name" label="Name" tip="menu.add.name">
          <input id="menu-edit-name" type="text" value={form.name} onChange={set("name")} className={field.input} disabled={busy} />
        </DialogField>
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
          <DialogField id="menu-edit-price" label="Price (₦)" tip="menu.add.price">
            <input id="menu-edit-price" type="number" min="0" value={form.price} onChange={set("price")} className={field.input} disabled={busy} />
          </DialogField>
          <DialogField id="menu-edit-cost" label="Cost Price (₦, optional)" tip="menu.col.costPrice">
            <input id="menu-edit-cost" type="number" min="0" placeholder="None" value={form.cost_price} onChange={set("cost_price")} className={field.input} disabled={busy} />
          </DialogField>
        </div>
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
          <DialogField id="menu-edit-charge-type" label="Service Charge Is" tip="menu.add.serviceChargeType">
            <select id="menu-edit-charge-type" value={form.service_charge_type} onChange={set("service_charge_type")} className={`${field.select} w-full`} disabled={busy}>
              {CHARGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </DialogField>
          <DialogField id="menu-edit-service" label={`Service Charge (${form.service_charge_type === "percent" ? "%" : "₦"})`} tip="menu.add.serviceCharge">
            <input id="menu-edit-service" type="number" min="0" max={form.service_charge_type === "percent" ? 100 : undefined} value={form.service_charge} onChange={set("service_charge")} className={field.input} disabled={busy} />
          </DialogField>
        </div>
        <ConfirmPanel
          question={`Save ${form.name.trim() || "the item"}?`}
          details={[
            `Service charge: ${Number(form.service_charge || 0) ? `${serviceChargeText(form)}${form.service_charge_type === "percent" ? " of the price" : " for each one sold"}` : "none"}.`,
            "Orders from now on charge the new price and service charge. What was sold before keeps what it was charged.",
            "The change is recorded in the Audit Trail.",
          ]}
          confirmLabel="Yes, save it"
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

// Edit a clothing item: its name and its two prices.
function LaundryItemDialog({ item, onClose, onDone }) {
  const [form, setForm] = useState({
    name: item.name,
    wash_and_iron_price: String(item.wash_and_iron_price ?? ""),
    ironing_only_price: String(item.ironing_only_price ?? ""),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const confirm = async () => {
    const wash = Number(form.wash_and_iron_price || 0);
    const iron = Number(form.ironing_only_price || 0);
    const problem = !form.name.trim()
      ? "Give the clothing item a name."
      : !(wash >= 0) || !(iron >= 0)
        ? "A price can't be below 0."
        : !(wash > 0 || iron > 0)
          ? "Give at least one price."
          : null;
    if (problem) {
      setError(problem);
      return;
    }
    try {
      setBusy(true);
      setError(null);
      await updateLaundryItem(item.id, { name: form.name.trim(), wash_and_iron_price: wash, ironing_only_price: iron });
      onDone(`${form.name.trim()} saved.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save.");
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? undefined : onClose} title={`Edit ${item.name}`} size="md">
      <div className="flex flex-col gap-5">
        <DialogField id="laundry-edit-name" label="Clothes" tip="menu.laundry.add.clothes">
          <input id="laundry-edit-name" type="text" value={form.name} onChange={set("name")} className={field.input} disabled={busy} />
        </DialogField>
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
          <DialogField id="laundry-edit-wash" label="Wash and Iron (₦)" tip="menu.laundry.add.washIron">
            <input id="laundry-edit-wash" type="number" min="0" value={form.wash_and_iron_price} onChange={set("wash_and_iron_price")} className={field.input} disabled={busy} />
          </DialogField>
          <DialogField id="laundry-edit-iron" label="Ironing Only (₦)" tip="menu.laundry.add.ironOnly">
            <input id="laundry-edit-iron" type="number" min="0" value={form.ironing_only_price} onChange={set("ironing_only_price")} className={field.input} disabled={busy} />
          </DialogField>
        </div>
        <ConfirmPanel
          question={`Save ${form.name.trim() || "the item"}?`}
          details={["Laundry posted from now on charges the new prices. What was charged before keeps its price.", "The change is recorded in the Audit Trail."]}
          confirmLabel="Yes, save it"
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

/**
 * The laundry catalogue: Clothes, Wash and Iron, Ironing Only.
 *
 * Deliberately not a MenuSection with extra props. MenuSection is built
 * around a single `price` plus a stock ledger; a garment has two prices and
 * no stock at all, so sharing would mean threading "which price column" and
 * "no stock here" through every row of it. Two focused components read
 * better than one that has to keep asking what it is rendering.
 */
function LaundrySection({ canEdit }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [notice, setNotice] = useState(null);
  const [addForm, setAddForm] = useState(EMPTY_LAUNDRY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await fetchLaundryItems(showInactive));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load laundry items.");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => { load(); }, [load]);

  const submit = async (action) => {
    setSaving(true);
    setError(null);
    try {
      await action();
      setAddForm(EMPTY_LAUNDRY_FORM);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const payloadFrom = (form) => ({
    name: form.name.trim(),
    wash_and_iron_price: Number(form.wash_and_iron_price || 0),
    ironing_only_price: Number(form.ironing_only_price || 0),
  });

  const addValid = addForm.name.trim() && (Number(addForm.wash_and_iron_price) > 0 || Number(addForm.ironing_only_price) > 0);

  return (
    <div className="w-full flex flex-col gap-6">
      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className="text-red-600 text-xl bg-red-50 border border-red-200 rounded-lg px-4 py-3 w-full">{error}</p>}

      <label className="flex items-center gap-2 text-xl cursor-pointer">
        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="w-5 h-5 cursor-pointer" />
        Show inactive items
        <Tip id="menu.laundry.showInactive" />
      </label>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : (
        <div className={table.card}>
          <div className={table.scroll}>
            <table className={table.el}>
              <thead>
                <tr className={table.headRow}>
                  <th className={`${table.th} ${table.stickyTh}`}>Clothes<Tip id="menu.laundry.col.clothes" /></th>
                  <th className={table.th}>Wash and Iron<Tip id="menu.laundry.col.washIron" /></th>
                  <th className={table.th}>Ironing Only<Tip id="menu.laundry.col.ironOnly" /></th>
                  <th className={table.th}>Status<Tip id="menu.laundry.col.status" /></th>
                  {canEdit && <th className={table.th}>Actions<Tip id="menu.laundry.col.actions" /></th>}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={canEdit ? 5 : 4} className="px-8 py-10 text-center text-xl text-[color:var(--text-color)]/68">No laundry items yet.</td></tr>
                ) : (
                  items.map((item) => (
                      <tr key={item.id} className={table.row}>
                        <td className={`${table.td} ${table.stickyTd} font-medium`}>{item.name}</td>
                        <td className={table.td}>{money(item.wash_and_iron_price)}</td>
                        <td className={table.td}>{money(item.ironing_only_price)}</td>
                        <td className={table.td}><StatusBadge status={item.is_active ? "active" : "inactive"} /></td>
                        {canEdit && (
                          <td className={table.td}>
                            <div className={table.actions}>
                              <button onClick={() => setEditItem(item)} className={btn.rowSecondary}>Edit</button>
                              <button disabled={saving}
                                onClick={() => submit(() => updateLaundryItem(item.id, { is_active: !item.is_active }))}
                                className={btn.rowSecondary}>
                                {item.is_active ? "Deactivate" : "Reactivate"}
                              </button>
                              {/* Deleting is blocked server-side once an item
                                  has sale history — the button stays, the
                                  backend explains why when it refuses. */}
                              <button disabled={saving} onClick={() => submit(() => deleteLaundryItem(item.id))} className={btn.rowDanger}>Delete</button>
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
      )}

      {canEdit && (
        <div className="w-full bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-col gap-4">
          <p className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/68">Add a clothing item<Tip id="menu.laundry.add" /></p>
          <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <label className={field.label}>Clothes<Tip id="menu.laundry.add.clothes" /></label>
              <input type="text" placeholder="Shirt" value={addForm.name} className={field.input}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={field.label}>Wash and Iron<Tip id="menu.laundry.add.washIron" /></label>
              <input type="number" min={0} value={addForm.wash_and_iron_price} className={field.input}
                onChange={(e) => setAddForm({ ...addForm, wash_and_iron_price: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={field.label}>Ironing Only<Tip id="menu.laundry.add.ironOnly" /></label>
              <input type="number" min={0} value={addForm.ironing_only_price} className={field.input}
                onChange={(e) => setAddForm({ ...addForm, ironing_only_price: e.target.value })} />
            </div>
          </div>
          <button disabled={saving || !addValid} onClick={() => submit(() => createLaundryItem(payloadFrom(addForm)))} className={`${btn.primary} self-start`}>
            {saving ? "Saving..." : "Add Item"}
          </button>
        </div>
      )}

      {editItem && (
        <LaundryItemDialog
          item={editItem}
          onClose={() => setEditItem(null)}
          onDone={async (message) => {
            setEditItem(null);
            setError(null);
            setNotice(message);
            await load();
          }}
        />
      )}
    </div>
  );
}
