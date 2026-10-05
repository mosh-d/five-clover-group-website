"use client";

import { useState } from "react";
import { IoKeyOutline, IoCheckmarkCircle, IoAlertCircleOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import PasswordField from "@/components/pms/PasswordField";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { btn, card, field, page } from "@/components/pms/ui";
import { changePassword } from "@/lib/pms/api/auth-api";
import { Tip } from "@/components/pms/Tip";

const EMPTY = { current_password: "", new_password: "", confirm_password: "" };
const ROLE_LABELS = {
  head_hr: "Head HR",
  hr: "HR",
  developer: "Developer",
  manager: "Manager",
  receptionist: "Receptionist",
  accountant: "Accountant",
  waitron: "Waitron",
  storekeeper: "Store Keeper",
};

// Account & Security - the branch PMS's Account page (AdminAccount.jsx), and
// Head Office's (2026-10-01: its own Account page at /hq moved in here, with
// its step to confirm the change before it is made - the owner's rule for
// every change, kept for everyone now there is one page).
//
// Its "Reset Receptionist Password" section is not here: it only ever showed
// for the retired shared branch logins, never for a personal account, and
// every session in this PMS is a personal account.
export default function PmsAccountPage() {
  // The real role, not a developer's "view as" one - this changes the
  // signed-in account's own password.
  const { realRole } = usePmsSession();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Checked, waiting for a Yes.
  const [confirming, setConfirming] = useState(false);

  // Editing a field after reviewing puts the Yes away again, so what is
  // confirmed is always what is typed.
  const update = (patch) => {
    setForm({ ...form, ...patch });
    setConfirming(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.new_password.length < 8) return setError("New password must be at least 8 characters.");
    if (form.new_password !== form.confirm_password) return setError("New password and confirmation do not match.");
    if (form.new_password === form.current_password) return setError("New password must be different from your current password.");
    setConfirming(true);
  };

  const confirmChange = async () => {
    try {
      setSaving(true);
      setError("");
      await changePassword({ current_password: form.current_password, new_password: form.new_password });
      setSuccess("Your password was updated. Use the new one the next time you sign in.");
      setForm(EMPTY);
      setConfirming(false);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={page.wrap}>
      <PageHeading icon={IoKeyOutline} tipId="account.page">Account &amp; Security</PageHeading>

      <section className="w-full max-w-5xl flex flex-col gap-4">
        <div>
          <h2 className={page.sectionTitle}>Change My Password<Tip id="account.changePassword" /></h2>
          <p className={`text-xl mt-1 ${page.muted}`}>
            Update the password for your {ROLE_LABELS[realRole] || "PMS"} login. You&apos;ll need your current password to confirm.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={`${card.surface} p-8 flex flex-col gap-6`}>
          {error && (
            <p className={`${field.error} flex items-center gap-2`}>
              <IoAlertCircleOutline size={20} className="shrink-0" /> {error}
            </p>
          )}
          {success && (
            <p className={`${field.success} flex items-center gap-2`}>
              <IoCheckmarkCircle size={20} className="shrink-0" /> {success}
            </p>
          )}

          <PasswordField
            id="current-password"
            label="Current Password"
            tip="account.current"
            autoComplete="off"
            value={form.current_password}
            onChange={(e) => update({ current_password: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <PasswordField
              id="new-password"
              label="New Password"
              tip="account.new"
              autoComplete="new-password"
              value={form.new_password}
              onChange={(e) => update({ new_password: e.target.value })}
              minLength={8}
              required
            />
            <PasswordField
              id="confirm-password"
              label="Confirm New Password"
              tip="account.confirm"
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={(e) => update({ confirm_password: e.target.value })}
              minLength={8}
              required
            />
          </div>
          <p className={field.hint}>Minimum 8 characters.</p>

          {confirming ? (
            <ConfirmPanel
              question="Change your password?"
              details={["You'll use the new password the next time you sign in."]}
              confirmLabel="Yes, change my password"
              busyLabel="Updating..."
              busy={saving}
              onBack={() => {
                setConfirming(false);
                setError("");
              }}
              onConfirm={confirmChange}
            />
          ) : (
            <button type="submit" className={`${btn.primary} self-start`}>
              Update Password
            </button>
          )}
        </form>
      </section>
    </div>
  );
}
