"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MotionConfig } from "motion/react";
import { IoLockClosedOutline } from "react-icons/io5";
import { PmsSessionContext, usePmsSession } from "./PmsSessionContext";
import PmsTopBar from "./PmsTopBar";
import PmsSidebar from "./PmsSidebar";
import ShiftGate from "./ShiftGate";
import NewBookingPopup from "./NewBookingPopup";
import SessionEndedModal from "./SessionEndedModal";
import useShifts from "./useShifts";
import { PmsLiveProvider } from "./live/PmsLive";
import { brandForBranch, themeStyle, GROUP_BRAND } from "./theme/brands";
import { canOpen, navItemForPath, pageTitle } from "./pmsNavItems";
import { card } from "./ui";
import { readPmsSession, clearPmsSession, consumeJustSignedIn, setDevRoleOverride, markActivity } from "@/lib/pms/session";
import { verifyPmsSession, pmsSignOut, pmsSwitchBranch, SESSION_ENDED_EVENT } from "@/lib/pms/client";
import { fetchBusinessDate } from "@/lib/pms/api/front-office-api";
import { applyServerClock, deviceClockDriftMinutes } from "@/lib/pms/dates";

// Everything around a PMS page: the session, the brand's colours, the top
// bar and sidebar, and the live layer. /pms itself is the sign-in page - no
// chrome, the group's own colours.
//
// On arrival the stored session is checked with the server
// (verifyPmsSession): renewed for someone who was working in the last 30
// minutes, sent to sign in after a longer absence. Once confirmed, moving
// between pages doesn't check again - this layout stays mounted across them.
export default function PmsShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isSignInPage = pathname === "/pms";
  const [session, setSession] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    if (isSignInPage || session) return;
    let cancelled = false;
    const stored = readPmsSession();
    const confirmed = !stored ? Promise.resolve(false) : consumeJustSignedIn() ? Promise.resolve(true) : verifyPmsSession();
    confirmed.then((ok) => {
      if (cancelled) return;
      if (!ok) {
        clearPmsSession();
        // Back here once signed in (pathAfterSignIn).
        router.replace(`/pms?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      setSession(readPmsSession());
    });
    return () => {
      cancelled = true;
    };
  }, [isSignInPage, session, router]);

  // A session that ended mid-work (idle too long, or refused renewal): the
  // "session has ended" prompt, not a page yanked away (see pmsRequest).
  useEffect(() => {
    const ended = () => setSessionEnded(true);
    window.addEventListener(SESSION_ENDED_EVENT, ended);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, ended);
  }, []);

  // "Still here" is a person touching the screen, never the PMS refetching
  // on its own - throttled to one stamp a minute.
  useEffect(() => {
    let last = 0;
    const stamp = () => {
      const now = Date.now();
      if (now - last < 60000) return;
      last = now;
      markActivity();
    };
    stamp();
    const events = ["pointerdown", "keydown"];
    events.forEach((e) => window.addEventListener(e, stamp, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, stamp));
  }, []);

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

  const signInAgain = useCallback(() => {
    clearPmsSession();
    setSessionEnded(false);
    setSession(null);
    router.replace("/pms");
  }, [router]);

  const value = useMemo(
    () => (session ? { ...session, brand: brandForBranch(session.branch), switchBranch, setRoleOverride, signOut } : null),
    [session, switchBranch, setRoleOverride, signOut],
  );

  const blank = <div className="admin-root min-h-screen" style={{ ...themeStyle(GROUP_BRAND), background: "var(--background-color)" }} />;

  if (isSignInPage) {
    return (
      <div className="admin-root min-h-screen" style={{ ...themeStyle(GROUP_BRAND), background: "var(--background-color)" }}>
        {children}
      </div>
    );
  }
  if (!value) return blank;

  return (
    <PmsSessionContext.Provider value={value}>
      <MotionConfig reducedMotion="user">
        {/* Keyed by branch and role: switching either starts everything that
            belongs to one branch afresh - its socket, its shifts, every page. */}
        <BranchWorkspace key={`${value.branch?.id}-${value.role}`} pathname={pathname}>
          {children}
        </BranchWorkspace>
        {/* Over everything, including any dialog open when it happened. */}
        {sessionEnded && (
          <div className="admin-root" style={themeStyle(value.brand)}>
            <SessionEndedModal onSignIn={signInAgain} />
          </div>
        )}
      </MotionConfig>
    </PmsSessionContext.Provider>
  );
}

// One branch's PMS, for one role.
function BranchWorkspace({ pathname, children }) {
  const { branch, role, brand } = usePmsSession();
  const { readouts, gate } = useShifts(role);
  const [clockDriftMinutes, setClockDriftMinutes] = useState(0);

  // "Today" by the server's clock, not this device's (see lib/pms/dates.js).
  useEffect(() => {
    let cancelled = false;
    fetchBusinessDate()
      .then((d) => {
        if (cancelled || !d?.server_time) return;
        applyServerClock(d.server_time);
        setClockDriftMinutes(deviceClockDriftMinutes());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const item = navItemForPath(pathname);
  const refused = item && !canOpen(role, item.slug);

  return (
    <PmsLiveProvider branchId={branch?.id} canSeeAlerts={canOpen(role, "alerts")}>
      <div className="admin-root h-screen flex flex-col overflow-hidden text-(--text-color)" style={{ ...themeStyle(brand), background: "var(--background-color)" }}>
        <PmsTopBar shifts={readouts} />
        {/* The dates on screen already follow the server; this tells the desk
            the PC itself needs fixing, since its clock drives everything
            outside the PMS. 10 minutes ignores ordinary drift and latency. */}
        {Math.abs(clockDriftMinutes) > 10 && (
          <div className="bg-orange-50 border-b border-orange-200 px-6 py-3 text-orange-800 text-lg shrink-0">
            This computer&apos;s clock is off by about {Math.abs(clockDriftMinutes)} minutes (
            {clockDriftMinutes > 0 ? "behind" : "ahead of"} the hotel&apos;s server). Dates shown here are correct, but please have the
            clock corrected.
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          <PmsSidebar />
          <main className="flex-1 overflow-y-auto px-16 max-sm:px-4 py-16">
            {refused ? <Refused title={pageTitle(item)} /> : children}
          </main>
        </div>
        <NewBookingPopup enabled={canOpen(role, "reservations")} />
        {gate && <ShiftGate {...gate} />}
      </div>
    </PmsLiveProvider>
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
