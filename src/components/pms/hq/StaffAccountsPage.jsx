"use client";

import { useState, useEffect, useCallback } from "react";
import { IoPeopleOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import StatusBadge from "@/components/pms/StatusBadge";
import Modal from "@/components/pms/Modal";
import PasswordField from "@/components/pms/PasswordField";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Notice from "@/components/pms/Notice";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import { page, btn, field, table } from "@/components/pms/ui";
import {
  fetchBranches,
  fetchHqStaff,
  createHqStaff,
  updateHqStaff,
  deactivateHqStaff,
  reactivateHqStaff,
  transferHqStaff,
} from "@/lib/pms/api/hq-api";
import { PmsApiError } from "@/lib/pms/client";
import { Tip } from "@/components/pms/Tip";

// Staff Accounts (Head Office): every branch's staff, and Head Office's own.
//
// Every change goes the same way (owner, 2026-10-01: double confirmation,
// then feedback either way): fill in the form, review what will happen in
// words, confirm - then a message at the top of the page says what was done,
// or the dialog says why it wasn't.

const BRANCH_ASSIGNABLE_ROLES = ["manager", "receptionist", "accountant", "waitron", "storekeeper"];
// Only role creatable/assignable at Head Office - developer/head_hr stay
// CLI-only (see manage-staff-account.ts), never offered here.
const HEAD_OFFICE_ASSIGNABLE_ROLES = ["hr"];
// developer/head_hr accounts are listed at Head Office and can be managed
// here (reset password, deactivate, reactivate) - the page is already gated
// to Head Office. Their ROLE stays fixed (the backend refuses a change), so
// they get no Change Role action.
const CLI_ONLY_ROLES = ["developer", "head_hr"];

const ROLE_LABELS = {
  manager: "Manager",
  receptionist: "Receptionist",
  accountant: "Accountant",
  waitron: "Waitron",
  storekeeper: "Store Keeper",
  hr: "HR",
  head_hr: "Head HR",
  developer: "Developer",
};
const roleLabel = (role) => ROLE_LABELS[role] || role;

const HEAD_OFFICE = "head_office";
const MIN_PASSWORD = 8;

const SERVER_UNREACHABLE = "Could not reach the server. Check your connection and try again.";
const errorText = (err) => (err instanceof PmsApiError ? err.message : SERVER_UNREACHABLE);

// A new password, typed twice: the same checks the server makes, said in
// plain words before anything is sent.
function passwordProblem(password, confirm) {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters for the password.`;
  if (password !== confirm) return "The two passwords don't match. Type the same password in both boxes.";
  return null;
}

const formatDate = (d) =>
  d ? new Date(d).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never";

const TITLES = {
  create: "Add Staff Account",
  rename: "Rename",
  role: "Change Role",
  password: "Reset Password",
  transfer: "Transfer to Another Branch",
  deactivate: "Deactivate Account",
  reactivate: "Reactivate Account",
};

export default function StaffAccountsPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showDeactivated, setShowDeactivated] = useState(false);

  // { kind: 'create' | 'rename' | 'role' | 'password' | 'transfer' | 'deactivate' | 'reactivate', account?, step: 'form' | 'confirm' }
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchBranches()
      .then((data) => setBranches(data || []))
      .catch(() => setError("Could not reach the server to load branches. Check your connection and try again."))
      .finally(() => setLoadingBranches(false));
  }, []);

  const loadStaff = useCallback(async (branchId) => {
    if (!branchId) return;
    try {
      setLoadingStaff(true);
      setError(null);
      setStaff((await fetchHqStaff(branchId)) || []);
    } catch (err) {
      // A branch with no staff is an empty list, not an error: reaching here
      // means the request itself failed.
      setError(err instanceof PmsApiError ? err.message : "Could not reach the server to load staff. Check your connection and try again.");
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

  const isHeadOffice = selectedBranchId === HEAD_OFFICE;
  const assignableRoles = isHeadOffice ? HEAD_OFFICE_ASSIGNABLE_ROLES : BRANCH_ASSIGNABLE_ROLES;
  const branchName = (id) => {
    if (id === HEAD_OFFICE || id === null || id === undefined || id === "") return "Head Office";
    const branch = branches.find((b) => String(b.id) === String(id));
    return branch ? branch.name : `branch ${id}`;
  };
  const here = branchName(selectedBranchId);

  const open = (kind, account = null, initialForm = {}) => {
    setDialog({ kind, account, step: kind === "deactivate" || kind === "reactivate" ? "confirm" : "form" });
    setForm(initialForm);
    setFormError(null);
  };
  const close = () => {
    if (busy) return;
    setDialog(null);
  };
  const back = () => {
    setFormError(null);
    if (dialog.kind === "deactivate" || dialog.kind === "reactivate") close();
    else setDialog({ ...dialog, step: "form" });
  };

  // Step 1 -> 2: check the form in plain words before showing the review.
  const review = (e) => {
    e.preventDefault();
    let problem = null;
    if (dialog.kind === "create") {
      if (!form.username?.trim()) problem = "Type the person's name as their username.";
      else problem = passwordProblem(form.password || "", form.confirm || "");
    } else if (dialog.kind === "rename") {
      const name = (form.username || "").trim();
      if (!name) problem = "Type the new username.";
      else if (name.length > 50) problem = "A username can be at most 50 characters.";
      else if (name === dialog.account.username) problem = "That's already their username. Type the new one.";
    } else if (dialog.kind === "role") {
      if (form.role === dialog.account.role) problem = `"${dialog.account.username}" is already ${roleLabel(form.role)}. Pick a different role to change it.`;
    } else if (dialog.kind === "password") {
      problem = passwordProblem(form.password || "", form.confirm || "");
    } else if (dialog.kind === "transfer") {
      if (!form.branchId) problem = "Pick the branch to move them to.";
    }
    setFormError(problem);
    if (!problem) setDialog({ ...dialog, step: "confirm" });
  };

  // Step 2: do it, then say what happened.
  const confirm = async () => {
    const { kind, account } = dialog;
    try {
      setBusy(true);
      setFormError(null);
      let message;
      if (kind === "create") {
        const username = form.username.trim();
        await createHqStaff({
          username,
          role: form.role,
          // A Head Office role (hr) has no branch: branch_id is left off,
          // never the "head_office" sentinel, which the server never sees.
          ...(isHeadOffice ? {} : { branch_id: Number(selectedBranchId) }),
          password: form.password,
        });
        message = `Created a ${roleLabel(form.role)} account for "${username}" at ${here}. They can sign in now with that username and password.`;
      } else if (kind === "rename") {
        const name = form.username.trim();
        await updateHqStaff(account.id, { username: name });
        message = `Renamed "${account.username}" to "${name}". They sign in as "${name}" from now on; their password hasn't changed.`;
      } else if (kind === "role") {
        await updateHqStaff(account.id, { role: form.role });
        message = `"${account.username}" is now ${roleLabel(form.role)} (was ${roleLabel(account.role)}).`;
      } else if (kind === "password") {
        await updateHqStaff(account.id, { password: form.password });
        message = `"${account.username}"'s password was reset. Any session they had open ends within 30 minutes, and from now on only the new password signs them in.`;
      } else if (kind === "transfer") {
        await transferHqStaff(account.id, Number(form.branchId));
        message = `Moved "${account.username}" from ${branchName(account.branch_id)} to ${branchName(form.branchId)}.`;
      } else if (kind === "deactivate") {
        await deactivateHqStaff(account.id);
        message = `Deactivated "${account.username}". They've been signed out everywhere and can't sign in until the account is reactivated.`;
      } else if (kind === "reactivate") {
        await reactivateHqStaff(account.id);
        message = `Reactivated "${account.username}". They can sign in again with their existing password.`;
      }
      setDialog(null);
      setNotice(message);
      loadStaff(selectedBranchId);
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const deactivatedCount = staff.filter((a) => !a.is_active).length;
  const visibleStaff = showDeactivated ? staff : staff.filter((a) => a.is_active);

  // What the review step says, per change.
  const confirmation = () => {
    const { kind, account } = dialog;
    if (kind === "create") {
      return {
        question: `Create a ${roleLabel(form.role)} account for "${form.username.trim()}" at ${here}?`,
        details: ["They'll sign in with this username and the password you typed.", "You can change the role or reset the password later."],
        confirmLabel: "Yes, create the account",
        busyLabel: "Creating...",
      };
    }
    if (kind === "rename") {
      return {
        question: `Rename "${account.username}" to "${form.username.trim()}"?`,
        details: [
          "They'll sign in with the new username from now on; their password stays the same.",
          "Shifts and reports show the new name. Earlier audit trail entries keep the name they were made under.",
        ],
        confirmLabel: "Yes, rename",
        busyLabel: "Renaming...",
      };
    }
    if (kind === "role") {
      return {
        question: `Change "${account.username}" from ${roleLabel(account.role)} to ${roleLabel(form.role)}?`,
        details: ["What they can open in the PMS changes the next time their session renews (within 30 minutes)."],
        confirmLabel: "Yes, change the role",
        busyLabel: "Saving...",
      };
    }
    if (kind === "password") {
      return {
        question: `Reset "${account.username}"'s password?`,
        details: [
          "Their old password stops working straight away.",
          "Any session they have open ends within 30 minutes; they then sign in with the new password.",
          "Give them the new password yourself - it isn't sent anywhere.",
        ],
        confirmLabel: "Yes, reset the password",
        busyLabel: "Resetting...",
        danger: true,
      };
    }
    if (kind === "transfer") {
      return {
        question: `Move "${account.username}" from ${branchName(account.branch_id)} to ${branchName(form.branchId)}?`,
        details: ["Their role, username and password stay the same."],
        confirmLabel: "Yes, move them",
        busyLabel: "Moving...",
      };
    }
    if (kind === "deactivate") {
      return {
        question: `Deactivate "${account.username}"?`,
        details: ["This signs them out everywhere and blocks further sign-ins.", "Nothing is deleted - you can reactivate the account later."],
        confirmLabel: "Yes, deactivate",
        busyLabel: "Deactivating...",
        danger: true,
        backLabel: "Cancel",
      };
    }
    return {
      question: `Reactivate "${account.username}"?`,
      details: ["They'll be able to sign in again with their existing password."],
      confirmLabel: "Yes, reactivate",
      busyLabel: "Reactivating...",
      backLabel: "Cancel",
    };
  };

  return (
    <div className={page.wrap}>
      <div>
        <PageHeading icon={IoPeopleOutline} tipId="staffAccounts.page">Staff Accounts</PageHeading>
        <p className={`text-2xl mt-2 ${page.muted}`}>Manage staff across every branch, and Head Office&apos;s own accounts.</p>
      </div>

      <div className="w-full flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2 min-w-[24rem]">
          <label htmlFor="staff-branch" className={field.label}>Branch<Tip id="staffAccounts.branch" /></label>
          {loadingBranches ? (
            <LoadingSpinner />
          ) : (
            <select id="staff-branch" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} className={field.select}>
              <option value="">-- Select a branch --</option>
              <option value={HEAD_OFFICE}>Head Office</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          onClick={() => open("create", null, { username: "", role: assignableRoles[0], password: "", confirm: "" })}
          disabled={!selectedBranchId}
          className={btn.primary}
        >
          + Add Staff
        </button>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`} role="alert">{error}</p>}

      <div className="w-full flex flex-col gap-4">
        {selectedBranchId && !loadingStaff && staff.length > 0 && (
          <label className={`text-xl flex items-center gap-2 cursor-pointer w-fit ${page.muted}`}>
            <input type="checkbox" checked={showDeactivated} onChange={(e) => setShowDeactivated(e.target.checked)} className="cursor-pointer" />
            View deactivated accounts{deactivatedCount > 0 ? ` (${deactivatedCount})` : ""}
            <Tip id="staffAccounts.showDeactivated" />
          </label>
        )}

        {!selectedBranchId ? (
          <p className={`text-2xl ${page.muted}`}>Select a branch to see its staff accounts.</p>
        ) : loadingStaff ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        ) : staff.length === 0 ? (
          <p className={`text-2xl ${page.muted}`}>No staff accounts {isHeadOffice ? "at Head Office" : "at this branch"} yet.</p>
        ) : visibleStaff.length === 0 ? (
          <p className={`text-2xl ${page.muted}`}>
            All staff accounts here are deactivated. Tick &quot;View deactivated accounts&quot; above to see them.
          </p>
        ) : (
          <div className={table.card}>
            <div className={table.scroll}>
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Username<Tip id="staffAccounts.col.username" /></th>
                    <th className={table.th}>Role<Tip id="staffAccounts.col.role" /></th>
                    <th className={table.th}>Status<Tip id="staffAccounts.col.status" /></th>
                    <th className={table.th}>Last Login<Tip id="staffAccounts.col.lastLogin" /></th>
                    <th className={table.th}>Actions<Tip id="staffAccounts.col.actions" /></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStaff.map((account) => (
                    <tr key={account.id} className={table.row}>
                      <td className={`${table.td} ${table.stickyTd} font-semibold`}>{account.username}</td>
                      <td className={table.td}>{roleLabel(account.role)}</td>
                      <td className={table.td}>
                        <StatusBadge status={account.is_active ? "active" : "inactive"} />
                      </td>
                      <td className={table.td}>{formatDate(account.last_login_at)}</td>
                      <td className={table.td}>
                        <div className={table.actions}>
                          <button type="button" onClick={() => open("rename", account, { username: account.username })} className={btn.rowSecondary}>
                            Rename
                          </button>
                          {!CLI_ONLY_ROLES.includes(account.role) && (
                            <button type="button" onClick={() => open("role", account, { role: account.role })} className={btn.rowPrimary}>
                              Change Role
                            </button>
                          )}
                          <button type="button" onClick={() => open("password", account, { password: "", confirm: "" })} className={btn.rowSecondary}>
                            Reset Password
                          </button>
                          {account.branch_id && (
                            <button type="button" onClick={() => open("transfer", account, { branchId: "" })} className={btn.rowSecondary}>
                              Transfer
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => open(account.is_active ? "deactivate" : "reactivate", account)}
                            className={account.is_active ? btn.rowDanger : btn.rowSuccess}
                          >
                            {account.is_active ? "Deactivate" : "Reactivate"}
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
      </div>

      {dialog && (
        <Modal title={dialog.account ? `${TITLES[dialog.kind]} — ${dialog.account.username}` : TITLES[dialog.kind]} onClose={close} size="sm">
          {dialog.step === "confirm" ? (
            <ConfirmPanel {...confirmation()} busy={busy} error={formError} onBack={back} onConfirm={confirm} />
          ) : (
            <form onSubmit={review} className="flex flex-col gap-5">
              {formError && <p className={field.error} role="alert">{formError}</p>}

              {dialog.kind === "create" && (
                <>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="staff-username" className={field.label}>Username<Tip id="staffAccounts.username" /></label>
                    <input
                      id="staff-username"
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className={field.input}
                      placeholder="e.g. Ada Okafor"
                    />
                    {/* One naming pattern for every account (owner, 2026-09-28):
                        the username is the only name the system shows for a staff
                        member - on shifts, reports and the audit trail. */}
                    <p className={field.hint}>
                      Use the person&apos;s first name, then last name, e.g. &quot;Ada Okafor&quot;. It&apos;s the name shown on shifts, reports and the audit trail.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="staff-role" className={field.label}>Role<Tip id="staffAccounts.role" /></label>
                    <select id="staff-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={`${field.select} w-full`}>
                      {assignableRoles.map((r) => (
                        <option key={r} value={r}>{roleLabel(r)}</option>
                      ))}
                    </select>
                  </div>
                  <PasswordField id="staff-password" label="Password" tip="staffAccounts.password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <PasswordField id="staff-password-confirm" label="Type the password again" tip="staffAccounts.passwordAgain" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                  <p className={field.hint}>At least {MIN_PASSWORD} characters.</p>
                </>
              )}

              {dialog.kind === "rename" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="staff-new-username" className={field.label}>New username<Tip id="staffAccounts.newUsername" /></label>
                  <input
                    id="staff-new-username"
                    type="text"
                    maxLength={50}
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className={field.input}
                    placeholder="e.g. Ada Okafor"
                  />
                  <p className={field.hint}>
                    Use the person&apos;s first name, then last name, e.g. &quot;Ada Okafor&quot;. It&apos;s the name they sign in with and the name shown on shifts and reports.
                  </p>
                </div>
              )}

              {dialog.kind === "role" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="staff-new-role" className={field.label}>New role<Tip id="staffAccounts.newRole" /></label>
                  <select id="staff-new-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={`${field.select} w-full`}>
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel(r)}
                        {r === dialog.account.role ? " (current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {dialog.kind === "password" && (
                <>
                  <PasswordField id="reset-password" label="New password" tip="staffAccounts.newPassword" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <PasswordField id="reset-password-confirm" label="Type the new password again" tip="staffAccounts.passwordAgain" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                  <p className={field.hint}>At least {MIN_PASSWORD} characters. You&apos;ll be asked to confirm before anything changes.</p>
                </>
              )}

              {dialog.kind === "transfer" && (
                <>
                  <p className={`text-xl ${page.muted}`}>Moves this account to a different branch. Role, username, and password stay the same.</p>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="staff-transfer-branch" className={field.label}>New branch<Tip id="staffAccounts.newBranch" /></label>
                    <select
                      id="staff-transfer-branch"
                      value={form.branchId}
                      onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                      className={`${field.select} w-full`}
                    >
                      <option value="">-- Select a branch --</option>
                      {branches
                        .filter((b) => String(b.id) !== String(dialog.account.branch_id))
                        .map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              <button type="submit" className={`${btn.primary} self-start`}>
                Review
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
