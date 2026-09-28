"use client";

import { useState } from "react";
import Modal from "./Modal";
import { BRANDS } from "./theme/brands";
import { btn, field } from "./ui";

// "Which branch?" - after signing in, for a developer (any branch) or
// someone with accounts at several; and from the top bar, for a developer
// moving to another branch. The list is grouped by brand.
export default function BranchPicker({ branches, currentId, title = "Choose a branch", intro, confirmLabel = "Open branch", onChoose, onClose }) {
  const [branchId, setBranchId] = useState(currentId ? String(currentId) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const byBrand = Object.values(BRANDS)
    .map((brand) => ({ brand, list: branches.filter((b) => String(b.branch_code || "").startsWith(`${brand.key}-`)) }))
    .filter((group) => group.list.length > 0);
  const others = branches.filter((b) => !byBrand.some((g) => g.list.includes(b)));

  const choose = async (e) => {
    e.preventDefault();
    if (!branchId) return;
    try {
      setBusy(true);
      setError(null);
      await onChoose(Number(branchId));
    } catch (err) {
      setError(err?.message || "Couldn't open that branch.");
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={busy ? undefined : onClose} size="sm">
      <form onSubmit={choose} className="flex flex-col gap-6">
        {intro && <p className="text-xl text-(--text-color)/68">{intro}</p>}
        {error && <p className={field.error}>{error}</p>}
        <div className="flex flex-col gap-2">
          <label htmlFor="pms-branch" className={field.label}>Branch</label>
          <select id="pms-branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className={`${field.select} w-full`} autoFocus>
            <option value="">-- Select a branch --</option>
            {byBrand.map(({ brand, list }) => (
              <optgroup key={brand.key} label={brand.name}>
                {list.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </optgroup>
            ))}
            {others.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={!branchId || busy || Number(branchId) === Number(currentId)} className={btn.primary}>
          {busy ? "Opening..." : confirmLabel}
        </button>
      </form>
    </Modal>
  );
}
