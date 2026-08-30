"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isHqAuthenticated, clearHqSession } from "@/utils/hq-auth";
import { verifyHqSession } from "@/lib/hq-api";
import AdminTopBar from "./AdminTopBar";
import AdminSidebar from "./AdminSidebar";

// localStorage isn't readable during SSR, and reading it inside a plain
// useState/useEffect pair to avoid a hydration mismatch means flashing an
// unauthenticated view for a frame first. useSyncExternalStore is the
// hook React designed for exactly this: it renders getServerSnapshot's
// value (false — unknown/unauthenticated) through hydration, then
// resolves to the real client value with no separate effect-driven flash.
function subscribe() {
  return () => {};
}
function getServerSnapshot() {
  return false;
}

// /admin itself is the login page — no shell chrome, no auth requirement.
// Every other /admin/* route gets the topbar+sidebar shell and is gated
// here once, instead of each page repeating its own redirect-if-signed-out
// check as more pages ship under this shell.
//
// A stored token alone isn't enough to call the session live — that used
// to be the entire check, so as long as the tab got reopened at least once
// every 7 days (the refresh token's own life) the session silently renewed
// itself forever via the first API call's auto-refresh, regardless of how
// many days of real inactivity sat in between. verifyHqSession() (a raw
// call, deliberately bypassing that auto-refresh) confirms the ACCESS
// token itself is still good on every mount — the same thing the
// hotel-frontends' ProtectedRoute already does with their own verify()
// call, where an expired access token means a real re-login, not a free
// extension.
export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin";
  const hasStoredToken = useSyncExternalStore(subscribe, isHqAuthenticated, getServerSnapshot);

  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    if (!hasStoredToken) {
      setChecking(false);
      setVerified(false);
      return;
    }
    let cancelled = false;
    verifyHqSession().then((ok) => {
      if (cancelled) return;
      if (!ok) clearHqSession();
      setVerified(ok);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoginPage, hasStoredToken]);

  useEffect(() => {
    if (!checking && !isLoginPage && !verified) {
      router.replace("/admin");
    }
  }, [checking, isLoginPage, verified, router]);

  if (isLoginPage) {
    return <div className="admin-root">{children}</div>;
  }

  if (checking || !verified) {
    return <div className="admin-root" style={{ minHeight: "100vh" }} />;
  }

  return (
    <div className="admin-root h-screen flex flex-col overflow-hidden" style={{ background: "var(--background-color)" }}>
      <AdminTopBar />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
