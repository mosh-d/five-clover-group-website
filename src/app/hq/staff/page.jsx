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
import Modal from "@/components/admin/Modal";
import PasswordField from "@/components/admin/PasswordField";
import ConfirmPanel from "@/components/admin/ConfirmPanel";
import Notice from "@/components/admin/Notice";
import {
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

const BRANCH_ASSIGNABLE_ROLES = ["manager", "receptionist", "accountant", "waitron", "storekeeper"];
// Only role creatable/assignable from "Head Office" — developer/head_hr
// stay CLI-only (see manage-staff-account.ts), never offered here.
const HEAD_OFFICE_ASSIGNABLE_ROLES = ["hr"];
// developer/head_hr accounts now show up in the "Head Office" list (see
// HqStaffService.list(null)) and any head_hr/hr/developer session can
// fully manage them here (reset password, deactivate, reactivate) — the
// page itself is already gated to those roles, so there's no extra wall
// on top. The one thing that stays fixed is their ROLE (excluded from
// HQ_ASSIGNABLE_ROLES on the backend — can't be promoted/demoted through
// this tool), so they get no Change Role action.
const CLI_ONLY_ROLES = ["developer", "head_hr"];

const ROLE_LABELS = {
  manager: "Manager",
  receptionist: "Receptionist",
  accountant: "Accountant",
  waitron: "Waitron",
  storekeeper: "Storekeeper",
  hr: "HR",
  head_hr: "Head HR",
  developer: "Developer",
};
const roleLabel = (role) => ROLE_LABELS[role] || role;

const HEAD_OFFICE = "head_office";
const MIN_PASSWORD = 8;

const SERVER_UNREACHABLE = "Could not reach the server. Check your connection and try again.";
const errorText = (err) => (err instanceof HqApiError ? err.message : SERVER_UNREACHABLE);

// A new password, typed twice: the same checks the server makes, said in
// plain words before anything is sent.
function passwordProblem(password, confirm) {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters for the password.`;
  if (password !== confirm) return "The two passwords don't match. Type the same password in both boxes.";
  return null;
}

function formatDate(d) {
  if (!d) return "Never";
  return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// Every change to an account goes the same way (owner, 2026-10-01: double
// confirmation, then feedback either way): fill in the form, review what
// will happen in words, confirm - then a message at the top of the page
// says what was done, or the dialog says why it wasn't.
const EMPTY_DIALOG = null;

export default function AdminStaffPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showDeactivated, setShowDeactivated] = useState(false);

  // { kind: 'create' | 'rename' | 'role' | 'password' | 'transfer' | 'deactivate' | 'reactivate', account?, step: 'form' | 'confirm' }
  const [dialog, setDialog] = useState(EMPTY_DIALOG);
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
      const data = await fetchHqStaff(branchId);
      setStaff(data || []);
    } catch (err) {
      // A branch with zero staff is not an error — the backend returns an
      // empty array for that (see the "No staff accounts..." empty state
      // below). Reaching this catch means the request itself failed:
      // HqApiError carries the backend's real reason (e.g. "Branch not
      // found"); anything else is a network-level failure (offline, CORS,
      // or the backend waking up from being idle), not a staff problem.
      setError(err instanceof HqApiError ? err.message : "Could not reach the server to load staff. Check your connection and try again.");
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
    setDialog(EMPTY_DIALOG);
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
          // Head Office roles (hr) have no home branch — omit branch_id
          // entirely rather than sending the "head_office" sentinel itself,
          // which is a frontend-only concept the backend never sees.
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
      setDialog(EMPTY_DIALOG);
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
          "Give them the new password yourself — it isn't sent anywhere.",
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
        details: ["This signs them out everywhere and blocks further sign-ins.", "Nothing is deleted — you can reactivate the account later."],
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

  const TITLES = {
    create: "Add Staff Account",
    rename: "Rename",
    role: "Change Role",
    password: "Reset Password",
    transfer: "Transfer to Another Branch",
    deactivate: "Deactivate Account",
    reactivate: "Reactivate Account",
  };

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
              <option value={HEAD_OFFICE}>Head Office</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={() => open("create", null, { username: "", role: assignableRoles[0], password: "", confirm: "" })}
          disabled={!selectedBranchId}
          className={primaryButtonClass}
          style={primaryButtonStyle}
        >
          + Add Staff
        </button>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={errorBoxClass} role="alert">{error}</p>}

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
        <p className={bodyText} style={mutedTextStyle}>
          No staff accounts {isHeadOffice ? "at Head Office" : "at this branch"} yet.
        </p>
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
                    <td className={tableTdClass}>{roleLabel(account.role)}</td>
                    <td className={tableTdClass}>
                      <StatusBadge status={account.is_active ? "active" : "inactive"} />
                    </td>
                    <td className={tableTdClass}>{formatDate(account.last_login_at)}</td>
                    <td className={tableTdClass}>
                      <div className={tableActionsClass}>
                        <button onClick={() => open("rename", account, { username: account.username })} className={rowButtonSecondaryClass} style={rowButtonSecondaryStyle}>
                          Rename
                        </button>
                        {!CLI_ONLY_ROLES.includes(account.role) && (
                          <button onClick={() => open("role", account, { role: account.role })} className={rowButtonPrimaryClass} style={rowButtonPrimaryStyle}>
                            Change Role
                          </button>
                        )}
                        <button onClick={() => open("password", account, { password: "", confirm: "" })} className={rowButtonSecondaryClass} style={rowButtonSecondaryStyle}>
                          Reset Password
                        </button>
                        {account.branch_id && (
                          <button onClick={() => open("transfer", account, { branchId: "" })} className={rowButtonSecondaryClass} style={rowButtonSecondaryStyle}>
                            Transfer
                          </button>
                        )}
                        <button
                          onClick={() => open(account.is_active ? "deactivate" : "reactivate", account)}
                          className={account.is_active ? rowButtonDangerClass : rowButtonSuccessClass}
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

      {dialog && (
        <Modal title={dialog.account ? `${TITLES[dialog.kind]} — ${dialog.account.username}` : TITLES[dialog.kind]} onClose={close}>
          {dialog.step === "confirm" ? (
            <ConfirmPanel {...confirmation()} busy={busy} error={formError} onBack={back} onConfirm={confirm} />
          ) : (
            <form onSubmit={review} className="flex flex-col gap-4">
              {formError && <p className={errorBoxClass} role="alert">{formError}</p>}

              {dialog.kind === "create" && (
                <>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="staff-username" className={labelText} style={mutedTextStyle}>Username</label>
                    <input
                      id="staff-username"
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="e.g. Ada Okafor"
                    />
                    {/* One naming pattern for every account (owner, 2026-09-28):
                        the username is the only name the system shows for a staff
                        member - on shifts, reports and the audit trail. */}
                    <p className={bodyText} style={mutedTextStyle}>
                      Use the person&apos;s first name, then last name, e.g. &quot;Ada Okafor&quot;. It&apos;s the name shown on shifts, reports and the audit trail.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="staff-role" className={labelText} style={mutedTextStyle}>Role</label>
                    <select
                      id="staff-role"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className={inputClass}
                      style={inputStyle}
                    >
                      {assignableRoles.map((r) => (
                        <option key={r} value={r}>{roleLabel(r)}</option>
                      ))}
                    </select>
                  </div>
                  <PasswordField id="staff-password" label="Password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <PasswordField id="staff-password-confirm" label="Type the password again" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                  <p className={bodyText} style={mutedTextStyle}>At least {MIN_PASSWORD} characters.</p>
                </>
              )}

              {dialog.kind === "rename" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="staff-new-username" className={labelText} style={mutedTextStyle}>New username</label>
                  <input
                    id="staff-new-username"
                    type="text"
                    maxLength={50}
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="e.g. Ada Okafor"
                  />
                  <p className={bodyText} style={mutedTextStyle}>
                    Use the person&apos;s first name, then last name, e.g. &quot;Ada Okafor&quot;. It&apos;s the name they sign in with and the name shown on shifts and reports.
                  </p>
                </div>
              )}

              {dialog.kind === "role" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="staff-new-role" className={labelText} style={mutedTextStyle}>New role</label>
                  <select
                    id="staff-new-role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className={inputClass}
                    style={inputStyle}
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>{roleLabel(r)}{r === dialog.account.role ? " (current)" : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              {dialog.kind === "password" && (
                <>
                  <PasswordField id="reset-password" label="New password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <PasswordField id="reset-password-confirm" label="Type the new password again" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                  <p className={bodyText} style={mutedTextStyle}>At least {MIN_PASSWORD} characters. You&apos;ll be asked to confirm before anything changes.</p>
                </>
              )}

              {dialog.kind === "transfer" && (
                <>
                  <p className={bodyText} style={mutedTextStyle}>
                    Moves this account to a different branch. Role, username, and password stay the same.
                  </p>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="staff-transfer-branch" className={labelText} style={mutedTextStyle}>New branch</label>
                    <select
                      id="staff-transfer-branch"
                      value={form.branchId}
                      onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                      className={inputClass}
                      style={inputStyle}
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

              <button type="submit" className={primaryButtonClass} style={primaryButtonStyle}>
                Review
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
