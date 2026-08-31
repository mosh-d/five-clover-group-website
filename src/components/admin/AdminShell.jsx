"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isHqAuthenticated, clearHqSession, consumeJustLoggedIn } from "@/utils/hq-auth";
import { verifyHqSession } from "@/lib/hq-api";
import AdminTopBar from "./AdminTopBar";
import AdminSidebar from "./AdminSidebar";

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
// token itself is still good — the same thing the hotel-frontends'
// ProtectedRoute already does with its own verify() call, where an expired
// access token means a real re-login, not a free extension.
//
// `status` is driven entirely by the effect below, gated on [pathname]
// alone — deliberately NOT on anything read from localStorage. An earlier
// version tracked the stored token reactively (useSyncExternalStore), but
// clearHqSession() below mutates that exact value, which re-triggered the
// very same effect the instant it ran — looping the verify call and the
// redirect after it, visible as the login page stuttering with a flood of
// hq-verify 401s. isHqAuthenticated()/verifyHqSession() are only ever read
// imperatively inside the effect now, never as reactive state.
//
// `sessionConfirmed` exists because this layout stays mounted across every
// client-side navigation within /admin/* (Next.js layouts don't remount on
// sibling route changes) — without it, the effect's [pathname] dependency
// meant EVERY single page-to-page click re-ran the whole verify() round
// trip and blanked the screen while it waited, not just the first arrival
// after signing in. Once confirmed for this mount, later navigations
// short-circuit synchronously. consumeJustLoggedIn() covers the other half
// of that same regression: a token issued by hqLogin() moments ago doesn't
// need re-verifying at all — only a token INHERITED from localStorage on a
// genuinely fresh mount (tab reopened, page refreshed) goes through the
// real network check.
export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin";

  const [status, setStatus] = useState(isLoginPage ? "login" : "checking");
  const [sessionConfirmed, setSessionConfirmed] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      setStatus("login");
      return;
    }
    if (sessionConfirmed) {
      setStatus("ok");
      return;
    }
    if (consumeJustLoggedIn()) {
      setSessionConfirmed(true);
      setStatus("ok");
      return;
    }
    if (!isHqAuthenticated()) {
      setStatus("denied");
      return;
    }
    let cancelled = false;
    setStatus("checking");
    verifyHqSession().then((ok) => {
      if (cancelled) return;
      if (!ok) {
        clearHqSession();
        setStatus("denied");
        return;
      }
      setSessionConfirmed(true);
      setStatus("ok");
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, isLoginPage, sessionConfirmed]);

  useEffect(() => {
    if (status === "denied") {
      router.replace("/admin");
    }
  }, [status, router]);

  if (isLoginPage) {
    return <div className="admin-root">{children}</div>;
  }

  if (status !== "ok") {
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
