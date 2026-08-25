"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hqLogin, HqApiError } from "@/lib/hq-api";
import { isHqAuthenticated } from "@/utils/hq-auth";
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

function EyeIcon({ open }) {
  return open ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-3.22 4.43M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            Sign in to manage staff across every branch.
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

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={labelText} style={mutedTextStyle}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-14`}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-4 cursor-pointer"
              style={{ ...textColorStyle, opacity: 0.6 }}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

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
