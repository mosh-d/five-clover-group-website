"use client";

import { useState } from "react";
import { IoKeyOutline } from "react-icons/io5";
import { hqChangePassword, HqApiError } from "@/lib/hq-api";
import { getHqUser } from "@/utils/hq-auth";
import PageHeading from "@/components/admin/PageHeading";
import PasswordField from "@/components/admin/PasswordField";
import {
  textColorStyle,
  mutedTextStyle,
  bodyText,
  primaryButtonClass,
  primaryButtonStyle,
  errorBoxClass,
} from "@/components/admin/adminStyles";

const ROLE_LABELS = { head_hr: "Head HR", developer: "Developer" };

const EMPTY_FORM = { current_password: "", new_password: "", confirm_password: "" };

export default function AdminAccountPage() {
  const user = getHqUser();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.new_password.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (form.new_password === form.current_password) {
      setError("New password must be different from your current password.");
      return;
    }

    try {
      setSaving(true);
      await hqChangePassword(form.current_password, form.new_password);
      setSuccess("Your password was updated successfully.");
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof HqApiError ? err.message : "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl flex flex-col gap-8">
      <div>
        <PageHeading icon={IoKeyOutline}>Account</PageHeading>
        {user && (
          <p className={`${bodyText} mt-2`} style={mutedTextStyle}>
            {user.username} &middot; {ROLE_LABELS[user.staff_role] || user.staff_role}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold" style={textColorStyle}>Change Password</h2>
          <p className={bodyText} style={mutedTextStyle}>
            You&apos;ll need your current password to confirm.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-8 flex flex-col gap-6" style={{ borderColor: "var(--accent-2)" }}>
          {error && <p className={errorBoxClass}>{error}</p>}
          {success && (
            <p className={`${bodyText} text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3`}>
              {success}
            </p>
          )}

          <PasswordField
            id="current_password"
            label="Current Password"
            autoComplete="off"
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <PasswordField
              id="new_password"
              label="New Password"
              autoComplete="new-password"
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              minLength={8}
              required
            />
            <PasswordField
              id="confirm_password"
              label="Confirm New Password"
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              minLength={8}
              required
            />
          </div>
          <p className={bodyText} style={mutedTextStyle}>Minimum 8 characters.</p>

          <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`} style={primaryButtonStyle}>
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>
    </div>
  );
}
