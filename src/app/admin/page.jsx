"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hqLogin, HqApiError } from "@/lib/hq-api";
import { isHqAuthenticated } from "@/utils/hq-auth";
import PasswordField from "@/components/admin/PasswordField";
import {
  textColorStyle,
  mutedTextStyle,
  labelText,
  inputClass,
  inputStyle,
  primaryButtonClass,
  primaryButtonStyle,
  errorBoxClass,
} from "@/components/admin/adminStyles";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Already signed in — skip straight past the login form.
  useEffect(() => {
    if (isHqAuthenticated()) router.replace("/admin/staff");
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    try {
      setSubmitting(true);
      setError(null);
      await hqLogin(username.trim(), password);
      router.push("/admin/staff");
    } catch (err) {
      setError(err instanceof HqApiError ? err.message : "Failed to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }} className="flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col gap-7 bg-white rounded-2xl p-12 shadow-sm"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-6xl font-bold" style={textColorStyle}>
            Five Clover HQ
          </h1>
          <p className="text-2xl" style={mutedTextStyle}>
            Sign in to handle Head Office level operations.
          </p>
        </div>

        {error && <p className={errorBoxClass}>{error}</p>}

        <div className="flex flex-col gap-2">
          <label htmlFor="username" className={labelText} style={mutedTextStyle}>
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={submitting || !username.trim() || !password}
          className={primaryButtonClass}
          style={primaryButtonStyle}
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
