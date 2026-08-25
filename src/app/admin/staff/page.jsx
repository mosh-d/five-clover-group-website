"use client";

import { useState, useEffect, useCallback } from "react";
import { IoPeopleOutline } from "react-icons/io5";
import {
  fetchBranches,
  fetchHqStaff,
  createHqStaff,
  updateHqStaff,
  deactivateHqStaff,
  reactivateHqStaff,
  transferHqStaff,
  HqApiError,
} from "@/lib/hq-api";
import PageHeading from "@/components/admin/PageHeading";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  textColorStyle,
  mutedTextStyle,
  bodyText,
  labelText,
  inputClass,
  inputStyle,
  primaryButtonClass,
  primaryButtonStyle,
  errorBoxClass,
  tableCardClass,
  tableCardStyle,
  tableScrollClass,
  tableClass,
  tableHeadRowClass,
  tableHeadRowStyle,
  tableThClass,
  tableRowClass,
  tableRowStyle,
  tableTdClass,
  tableActionsClass,
  rowButtonPrimaryClass,
  rowButtonPrimaryStyle,
  rowButtonSecondaryClass,
  rowButtonSecondaryStyle,
  rowButtonDangerClass,
  rowButtonSuccessClass,
} from "@/components/admin/adminStyles";

const ASSIGNABLE_ROLES = ["manager", "receptionist", "accountant", "waitron"];

const emptyCreateForm = { username: "", role: "receptionist", password: "" };
const emptyEditForm = { role: "receptionist" };

function formatDate(d) {
  if (!d) return "Never";
  return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// Small self-contained modal — this page is the only consumer, so it isn't
// pulled out into a shared component.
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-bold" style={textColorStyle}>{title}</h2>
          <button onClick={onClose} className="text-4xl leading-none cursor-pointer" style={{ ...textColorStyle, opacity: 0.5 }}>
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminStaffPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState(null);
  const [showDeactivated, setShowDeactivated] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const [transferTarget, setTransferTarget] = useState(null);
  const [transferBranchId, setTransferBranchId] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchBranches()
      .then((data) => setBranches(data || []))
      .catch(() => setError("Failed to load branches."))
      .finally(() => setLoadingBranches(false));
  }, []);

  const loadStaff = useCallback(async (branchId) => {
    if (!branchId) return;
    try {
      setLoadingStaff(true);
      setError(null);
      const data = await fetchHqStaff(branchId);
      setStaff(data || []);
    } catch (err) {
      setError(err instanceof HqApiError ? err.message : "Failed to load staff.");
      setStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    setShowDeactivated(false);
    if (selectedBranchId) loadStaff(selectedBranchId);
    else setStaff([]);
  }, [selectedBranchId, loadStaff]);

  const openCreate = () => {
    setCreateForm(emptyCreateForm);
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.username.trim() || !createForm.password) return;
    try {
      setCreating(true);
      setCreateError(null);
      await createHqStaff({
        username: createForm.username.trim(),
        role: createForm.role,
        branch_id: Number(selectedBranchId),
        password: createForm.password,
      });
      setIsCreateOpen(false);
      loadStaff(selectedBranchId);
    } catch (err) {
      setCreateError(err instanceof HqApiError ? err.message : "Failed to create account.");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (account) => {
    setEditTarget(account);
    setEditForm({ role: account.role });
    setEditPassword("");
    setEditError(null);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      setSaving(true);
      setEditError(null);
      const payload = { role: editForm.role };
      if (editPassword) payload.password = editPassword;
      await updateHqStaff(editTarget.id, payload);
      setEditTarget(null);
      loadStaff(selectedBranchId);
    } catch (err) {
      setEditError(err instanceof HqApiError ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (account) => {
    try {
      setActionLoadingId(account.id);
      setError(null);
      if (account.is_active) await deactivateHqStaff(account.id);
      else await reactivateHqStaff(account.id);
      loadStaff(selectedBranchId);
    } catch (err) {
      setError(err instanceof HqApiError ? err.message : "Failed to update account status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openTransfer = (account) => {
    setTransferTarget(account);
    setTransferBranchId("");
    setTransferError(null);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferTarget || !transferBranchId) return;
    try {
      setTransferring(true);
      setTransferError(null);
      await transferHqStaff(transferTarget.id, Number(transferBranchId));
      setTransferTarget(null);
      loadStaff(selectedBranchId);
    } catch (err) {
      setTransferError(err instanceof HqApiError ? err.message : "Failed to transfer account.");
    } finally {
      setTransferring(false);
    }
  };

  const deactivatedCount = staff.filter((a) => !a.is_active).length;
  const visibleStaff = showDeactivated ? staff : staff.filter((a) => a.is_active);

  return (
    <div className="w-full flex flex-col gap-8">
      <div>
        <PageHeading icon={IoPeopleOutline}>Staff Accounts</PageHeading>
        <p className={`${bodyText} mt-2`} style={mutedTextStyle}>
          Manage staff across every branch.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2 flex-1 min-w-[16rem]">
          <label className={labelText} style={mutedTextStyle}>Branch</label>
          {loadingBranches ? (
            <p className={bodyText} style={mutedTextStyle}>Loading branches...</p>
          ) : (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">-- Select a branch --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={openCreate}
          disabled={!selectedBranchId}
          className={primaryButtonClass}
          style={primaryButtonStyle}
        >
          + Add Staff
        </button>
      </div>

      {error && <p className={errorBoxClass}>{error}</p>}

      {selectedBranchId && !loadingStaff && staff.length > 0 && (
        <label className={`${bodyText} flex items-center gap-2 cursor-pointer w-fit`} style={mutedTextStyle}>
          <input
            type="checkbox"
            checked={showDeactivated}
            onChange={(e) => setShowDeactivated(e.target.checked)}
            className="cursor-pointer"
          />
          View deactivated accounts{deactivatedCount > 0 ? ` (${deactivatedCount})` : ""}
        </label>
      )}

      {!selectedBranchId ? (
        <p className={bodyText} style={mutedTextStyle}>Select a branch to see its staff accounts.</p>
      ) : loadingStaff ? (
        <p className={bodyText} style={mutedTextStyle}>Loading staff...</p>
      ) : staff.length === 0 ? (
        <p className={bodyText} style={mutedTextStyle}>No staff accounts at this branch yet.</p>
      ) : visibleStaff.length === 0 ? (
        <p className={bodyText} style={mutedTextStyle}>
          All staff accounts at this branch are deactivated. Check &quot;View deactivated accounts&quot; above to see them.
        </p>
      ) : (
        <div className={tableCardClass} style={tableCardStyle}>
          <div className={tableScrollClass}>
            <table className={tableClass}>
              <thead>
                <tr className={tableHeadRowClass} style={tableHeadRowStyle}>
                  <th className={tableThClass}>Username</th>
                  <th className={tableThClass}>Role</th>
                  <th className={tableThClass}>Status</th>
                  <th className={tableThClass}>Last Login</th>
                  <th className={tableThClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleStaff.map((account) => (
                  <tr key={account.id} className={tableRowClass} style={tableRowStyle}>
                    <td className={tableTdClass}>{account.username}</td>
                    <td className={`${tableTdClass} capitalize`}>{account.role}</td>
                    <td className={tableTdClass}>
                      <StatusBadge status={account.is_active ? "active" : "inactive"} />
                    </td>
                    <td className={tableTdClass}>{formatDate(account.last_login_at)}</td>
                    <td className={tableTdClass}>
                      <div className={tableActionsClass}>
                        <button onClick={() => openEdit(account)} className={rowButtonPrimaryClass} style={rowButtonPrimaryStyle}>
                          Edit
                        </button>
                        <button onClick={() => openTransfer(account)} className={rowButtonSecondaryClass} style={rowButtonSecondaryStyle}>
                          Transfer
                        </button>
                        <button
                          onClick={() => handleToggleActive(account)}
                          disabled={actionLoadingId === account.id}
                          className={account.is_active ? rowButtonDangerClass : rowButtonSuccessClass}
                        >
                          {actionLoadingId === account.id ? "..." : account.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <Modal title="Add Staff Account" onClose={() => setIsCreateOpen(false)}>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {createError && <p className={errorBoxClass}>{createError}</p>}
            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>Username</label>
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className={inputClass}
                style={inputStyle}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>Initial Password</label>
              <input
                type="text"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className={inputClass}
                style={inputStyle}
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !createForm.username.trim() || !createForm.password}
              className={primaryButtonClass}
              style={primaryButtonStyle}
            >
              {creating ? "Creating..." : "Create Account"}
            </button>
          </form>
        </Modal>
      )}

      {editTarget && (
        <Modal title={`Edit "${editTarget.username}"`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            {editError && <p className={errorBoxClass}>{editError}</p>}
            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className={inputClass}
                style={inputStyle}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>Reset Password (optional)</label>
              <input
                type="text"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="Leave blank to keep the current password"
              />
            </div>
            <button type="submit" disabled={saving} className={primaryButtonClass} style={primaryButtonStyle}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </Modal>
      )}

      {transferTarget && (
        <Modal title={`Transfer "${transferTarget.username}"`} onClose={() => setTransferTarget(null)}>
          <form onSubmit={handleTransfer} className="flex flex-col gap-4">
            {transferError && <p className={errorBoxClass}>{transferError}</p>}
            <p className={bodyText} style={mutedTextStyle}>
              Moves this account to a different branch. Role, username, and password stay the same.
            </p>
            <div className="flex flex-col gap-2">
              <label className={labelText} style={mutedTextStyle}>New Branch</label>
              <select
                value={transferBranchId}
                onChange={(e) => setTransferBranchId(e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">-- Select a branch --</option>
                {branches
                  .filter((b) => String(b.id) !== String(transferTarget.branch_id))
                  .map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={transferring || !transferBranchId}
              className={primaryButtonClass}
              style={primaryButtonStyle}
            >
              {transferring ? "Transferring..." : "Transfer"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
