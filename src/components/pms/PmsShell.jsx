"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MotionConfig } from "motion/react";
import { IoLockClosedOutline } from "react-icons/io5";
import { PmsSessionContext } from "./PmsSessionContext";
import PmsTopBar from "./PmsTopBar";
import PmsSidebar from "./PmsSidebar";
import { brandForBranch, themeStyle, GROUP_BRAND } from "./theme/brands";
import { canOpen, navItemForPath, pageTitle } from "./pmsNavItems";
import { card } from "./ui";
import { readPmsSession, clearPmsSession, consumeJustSignedIn, setDevRoleOverride } from "@/lib/pms/session";
import { verifyPmsSession, pmsSignOut, pmsSwitchBranch, SESSION_ENDED_EVENT } from "@/lib/pms/client";
import { frontOffice } from "@/lib/pms/api";
import { applyServerClock } from "@/lib/pms/dates";

// Everything around a PMS page: the session check, the brand's colours, the
// top bar and sidebar. /pms itself is the sign-in page - no chrome, the
// group's own colours.
//
// A stored token is not taken on trust: on arrival it is checked with the
// server (verifyPmsSession), so a tab reopened after days away asks for a
// sign-in rather than quietly renewing itself - the HQ admin's rule
// (AdminShell.jsx). Once confirmed, moving between pages doesn't check
// again: this layout stays mounted across them.
export default function PmsShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isSignInPage = pathname === "/pms";
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (isSignInPage || session) return;
    let cancelled = false;
    const stored = readPmsSession();
    const confirmed = !stored ? Promise.resolve(false) : consumeJustSignedIn() ? Promise.resolve(true) : verifyPmsSession();
    confirmed.then((ok) => {
      if (cancelled) return;
      if (!ok) {
        clearPmsSession();
        router.replace("/pms");
        return;
      }
      setSession(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [isSignInPage, session, router]);

  // A session the server would no longer renew (see pmsRequest).
  useEffect(() => {
    const ended = () => {
      setSession(null);
      router.replace("/pms");
    };
    window.addEventListener(SESSION_ENDED_EVENT, ended);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, ended);
  }, [router]);

  // "Today" by the server's clock, not this device's (see lib/pms/dates.js).
  const branchId = session?.branch?.id;
  useEffect(() => {
    if (!branchId) return;
    frontOffice
      .businessDate()
      .then((d) => d?.server_time && applyServerClock(d.server_time))
      .catch(() => {});
  }, [branchId]);

  const switchBranch = useCallback(async (id) => {
    await pmsSwitchBranch(id);
    setSession(readPmsSession());
  }, []);

  const setRoleOverride = useCallback((role) => {
    setDevRoleOverride(role);
    setSession(readPmsSession());
  }, []);

  const signOut = useCallback(async () => {
    await pmsSignOut();
    setSession(null);
    router.replace("/pms");
  }, [router]);

  const value = useMemo(
    () => (session ? { ...session, brand: brandForBranch(session.branch), switchBranch, setRoleOverride, signOut } : null),
    [session, switchBranch, setRoleOverride, signOut],
  );

  if (isSignInPage) {
    return (
      <div className="admin-root min-h-screen" style={{ ...themeStyle(GROUP_BRAND), background: "var(--background-color)" }}>
        {children}
      </div>
    );
  }

  if (!value) {
    return <div className="admin-root min-h-screen" style={{ ...themeStyle(GROUP_BRAND), background: "var(--background-color)" }} />;
  }

  const item = navItemForPath(pathname);
  const refused = item && !canOpen(value.role, item.slug);

  return (
    <PmsSessionContext.Provider value={value}>
      <MotionConfig reducedMotion="user">
        <div
          className="admin-root h-screen flex flex-col overflow-hidden text-(--text-color)"
          style={{ ...themeStyle(value.brand), background: "var(--background-color)" }}
        >
          <PmsTopBar />
          <div className="flex flex-1 overflow-hidden">
            <PmsSidebar />
            {/* Keyed by branch and role: switching either starts every page
                afresh, so nothing from the last branch lingers on screen. */}
            <main key={`${value.branch?.id}-${value.role}`} className="flex-1 overflow-y-auto px-[4rem] max-sm:px-[1rem] py-[4rem]">
              {refused ? <Refused title={pageTitle(item)} /> : children}
            </main>
          </div>
        </div>
      </MotionConfig>
    </PmsSessionContext.Provider>
  );
}

function Refused({ title }) {
  return (
    <div className={`${card.surface} max-w-3xl p-10 flex items-center gap-6`}>
      <IoLockClosedOutline size={32} className="shrink-0 text-(--emphasis)" />
      <p className="text-2xl">Your role isn&apos;t authorized to open {title}.</p>
    </div>
  );
}
