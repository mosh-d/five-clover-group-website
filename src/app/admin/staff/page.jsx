"use client";

import { useState, useEffect, useCallback } from "react";
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

const ASSIGNABLE_ROLES = ["manager", "receptionist", "accountant", "waitron"];

const emptyCreateForm = { username: "", display_name: "", role: "receptionist", password: "" };
const emptyEditForm = { display_name: "", role: "receptionist" };

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
          <h2 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>{title}</h2>
          <button onClick={onClose} className="text-4xl leading-none cursor-pointer" style={{ color: "var(--text-color)", opacity: 0.5 }}>
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass = "border rounded-lg px-4 py-3 text-2xl w-full";
const inputStyle = { borderColor: "var(--accent-2)" };
const labelClass = "text-xl font-semibold uppercase tracking-wide";
const labelStyle = { color: "var(--text-color)", opacity: 0.68 };
const primaryBtnClass = "rounded-lg px-4 py-3 text-2xl font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const primaryBtnStyle = { background: "var(--emphasis)" };

export default function AdminStaffPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState(null);

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
        display_name: createForm.display_name.trim() || undefined,
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
    setEditForm({ display_name: account.display_name, role: account.role });
    setEditPassword("");
    setEditError(null);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      setSaving(true);
      setEditError(null);
      const payload = { display_name: editForm.display_name.trim(), role: editForm.role };
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

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-5xl font-bold" style={{ color: "var(--text-color)" }}>Staff Accounts</h1>
        <p className="text-xl" style={{ color: "var(--text-color)", opacity: 0.68 }}>
          Manage staff across every branch.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2 flex-1 min-w-[16rem]">
          <label className={labelClass} style={labelStyle}>Branch</label>
          {loadingBranches ? (
            <p style={{ color: "var(--text-color)", opacity: 0.68 }}>Loading branches...</p>
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
          className={primaryBtnClass}
          style={primaryBtnStyle}
        >
          + Add Staff
        </button>
      </div>

      {error && <p className="text-xl text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

      {!selectedBranchId ? (
        <p style={{ color: "var(--text-color)", opacity: 0.68 }}>Select a branch to see its staff accounts.</p>
      ) : loadingStaff ? (
        <p style={{ color: "var(--text-color)", opacity: 0.68 }}>Loading staff...</p>
      ) : staff.length === 0 ? (
        <p style={{ color: "var(--text-color)", opacity: 0.68 }}>No staff accounts at this branch yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white">
          <table className="w-full text-left text-xl">
            <thead>
              <tr style={{ color: "var(--text-color)", opacity: 0.68 }} className="border-b">
                <th className="px-5 py-3 font-semibold">Username</th>
                <th className="px-5 py-3 font-semibold">Display Name</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Last Login</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((account) => (
                <tr key={account.id} className="border-b last:border-0" style={{ color: "var(--text-color)" }}>
                  <td className="px-5 py-3">{account.username}</td>
                  <td className="px-5 py-3">{account.display_name}</td>
                  <td className="px-5 py-3 capitalize">{account.role}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-lg font-semibold uppercase tracking-wide px-2 py-1 rounded-full"
                      style={
                        account.is_active
                          ? { background: "#dcfce7", color: "#15803d" }
                          : { background: "#f3f4f6", color: "#4b5563" }
                      }
                    >
                      {account.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">{formatDate(account.last_login_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => openEdit(account)} className="font-semibold underline cursor-pointer" style={{ color: "var(--text-color)" }}>
                        Edit
                      </button>
                      <button onClick={() => openTransfer(account)} className="font-semibold underline cursor-pointer" style={{ color: "var(--text-color)" }}>
                        Transfer
                      </button>
                      <button
                        onClick={() => handleToggleActive(account)}
                        disabled={actionLoadingId === account.id}
                        className="font-semibold underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ color: account.is_active ? "#b91c1c" : "#15803d" }}
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
      )}

      {isCreateOpen && (
        <Modal title="Add Staff Account" onClose={() => setIsCreateOpen(false)}>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {createError && <p className="text-xl text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{createError}</p>}
            <div className="flex flex-col gap-2">
              <label className={labelClass} style={labelStyle}>Username</label>
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} style={labelStyle}>Display Name (optional)</label>
              <input
                type="text"
                value={createForm.display_name}
                onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} style={labelStyle}>Role</label>
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
              <label className={labelClass} style={labelStyle}>Initial Password</label>
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
              className={primaryBtnClass}
              style={primaryBtnStyle}
            >
              {creating ? "Creating..." : "Create Account"}
            </button>
          </form>
        </Modal>
      )}

      {editTarget && (
        <Modal title={`Edit "${editTarget.username}"`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            {editError && <p className="text-xl text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{editError}</p>}
            <div className="flex flex-col gap-2">
              <label className={labelClass} style={labelStyle}>Display Name</label>
              <input
                type="text"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} style={labelStyle}>Role</label>
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
              <label className={labelClass} style={labelStyle}>Reset Password (optional)</label>
              <input
                type="text"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="Leave blank to keep the current password"
              />
            </div>
            <button type="submit" disabled={saving} className={primaryBtnClass} style={primaryBtnStyle}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </Modal>
      )}

      {transferTarget && (
        <Modal title={`Transfer "${transferTarget.username}"`} onClose={() => setTransferTarget(null)}>
          <form onSubmit={handleTransfer} className="flex flex-col gap-4">
            {transferError && <p className="text-xl text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{transferError}</p>}
            <p style={{ color: "var(--text-color)", opacity: 0.68 }}>
              Moves this account to a different branch. Role, username, and password stay the same.
            </p>
            <div className="flex flex-col gap-2">
              <label className={labelClass} style={labelStyle}>New Branch</label>
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
              className={primaryBtnClass}
              style={primaryBtnStyle}
            >
              {transferring ? "Transferring..." : "Transfer"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
