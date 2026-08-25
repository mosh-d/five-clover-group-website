"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hqLogin, HqApiError } from "@/lib/hq-api";
import { isHqAuthenticated } from "@/utils/hq-auth";

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
        className="w-full max-w-sm flex flex-col gap-6 bg-white rounded-2xl p-10 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
            Five Clover HQ
          </h1>
          <p className="text-base" style={{ color: "var(--text-color)", opacity: 0.68 }}>
            Sign in to manage staff across every branch.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-color)", opacity: 0.68 }}>
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded-lg px-4 py-3 text-base"
            style={{ borderColor: "var(--accent-2)" }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-color)", opacity: 0.68 }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-lg px-4 py-3 text-base"
            style={{ borderColor: "var(--accent-2)" }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !username.trim() || !password}
          className="rounded-lg px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--emphasis)" }}
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
