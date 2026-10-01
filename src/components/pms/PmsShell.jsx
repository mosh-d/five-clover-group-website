"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { PmsLiveProvider, HeadOfficeLiveProvider } from "./live/PmsLive";
import { brandForBranch, themeStyle, GROUP_BRAND } from "./theme/brands";
import { canOpen, landingPath, navItemForPath, opensOnlyIn, pageTitle } from "./pmsNavItems";
import { btn, card } from "./ui";
import { readPmsSession, clearPmsSession, consumeJustSignedIn, setDevRoleOverride, markActivity, hasBeenIdleTooLong } from "@/lib/pms/session";
import { verifyPmsSession, pmsSignOut, pmsSwitchBranch, SESSION_ENDED_EVENT } from "@/lib/pms/client";
import { fetchBusinessDate } from "@/lib/pms/api/front-office-api";
import { applyServerClock, deviceClockDriftMinutes } from "@/lib/pms/dates";

// Everything around a PMS page: the session, the brand's colours, the top
// bar and sidebar, and the live layer. /pms itself is the sign-in page - no
// chrome, the group's own colours.
//
// A session is in a branch, or at Head Office (owner, 2026-10-01: Head
// Office moved in from its own admin at /hq). Both wear the same chrome;
// Head Office has none of a branch's own machinery - shifts, the booking
// popup, the branch's live feed - because it has no branch, and every
// branch endpoint would refuse it.
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
    // Opening the PMS after an hour or more away is the same as being idle
    // that long mid-work: the session is over (owner, 2026-10-01 - a session
    // from the day before used to open straight in). Checked before anything
    // can renew it, and before any of this page's own activity counts.
    const confirmed = !stored || hasBeenIdleTooLong()
      ? Promise.resolve(false)
      : consumeJustSignedIn() ? Promise.resolve(true) : verifyPmsSession();
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
  // on its own - throttled to one stamp a minute. Loading the page is NOT
  // activity: it used to stamp on mount, so reopening a day-old session
  // counted as being here and renewed it (2026-10-01). Signing in stamps
  // (storePmsSession); after that only a click or a key does.
  useEffect(() => {
    let last = 0;
    const stamp = () => {
      const now = Date.now();
      if (now - last < 60000) return;
      last = now;
      markActivity();
    };
    const events = ["pointerdown", "keydown"];
    events.forEach((e) => window.addEventListener(e, stamp, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, stamp));
  }, []);

  // A developer moving to another branch or to Head Office: the page they
  // were on may not open in the new place, so they start from its landing.
  const switchBranch = useCallback(
    async (place) => {
      await pmsSwitchBranch(place);
      const next = readPmsSession();
      setSession(next);
      if (!canOpen(next.role, navItemForPath(window.location.pathname)?.slug, next.scope)) router.replace(landingPath(next.role, next.scope));
    },
    [router],
  );

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

  const Workspace = value.scope === "hq" ? HeadOfficeWorkspace : BranchWorkspace;

  return (
    <PmsSessionContext.Provider value={value}>
      <MotionConfig reducedMotion="user">
        {/* Keyed by place and role: switching either starts everything that
            belongs to one place afresh - its socket, its shifts, every page. */}
        <Workspace key={`${value.scope}-${value.branch?.id}-${value.role}`} pathname={pathname}>
          {children}
        </Workspace>
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

// The chrome every session wears: top bar, sidebar, the page - or, for a
// page this session may not open, why not. `extras` (a branch's popup and
// shift gate) sit inside it, so they wear the brand's colours too.
function Frame({ pathname, shifts, banner, extras, children }) {
  const { role, scope, brand } = usePmsSession();
  const item = navItemForPath(pathname);
  const refused = item && !canOpen(role, item.slug, scope);
  return (
    <div className="admin-root h-screen flex flex-col overflow-hidden text-(--text-color)" style={{ ...themeStyle(brand), background: "var(--background-color)" }}>
      <PmsTopBar shifts={shifts} />
      {banner}
      <div className="flex flex-1 overflow-hidden">
        <PmsSidebar />
        <main className="flex-1 overflow-y-auto px-16 max-sm:px-4 py-16">{refused ? <Refused item={item} /> : children}</main>
      </div>
      {extras}
    </div>
  );
}

// Head Office: no branch, so none of a branch's machinery.
function HeadOfficeWorkspace({ pathname, children }) {
  return (
    <HeadOfficeLiveProvider>
      <Frame pathname={pathname}>{children}</Frame>
    </HeadOfficeLiveProvider>
  );
}

// One branch's PMS, for one role.
function BranchWorkspace({ pathname, children }) {
  const { branch, role } = usePmsSession();
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

  // The dates on screen already follow the server; this tells the desk the
  // PC itself needs fixing, since its clock drives everything outside the
  // PMS. 10 minutes ignores ordinary drift and latency.
  const banner =
    Math.abs(clockDriftMinutes) > 10 ? (
      <div className="bg-orange-50 border-b border-orange-200 px-6 py-3 text-orange-800 text-lg shrink-0">
        This computer&apos;s clock is off by about {Math.abs(clockDriftMinutes)} minutes (
        {clockDriftMinutes > 0 ? "behind" : "ahead of"} the hotel&apos;s server). Dates shown here are correct, but please have the clock
        corrected.
      </div>
    ) : null;

  return (
    <PmsLiveProvider branchId={branch?.id} canSeeAlerts={canOpen(role, "alerts")} canSeeOtaPayments={canOpen(role, "ota-payments")}>
      <Frame
        pathname={pathname}
        shifts={readouts}
        banner={banner}
        extras={
          <>
            <NewBookingPopup enabled={canOpen(role, "reservations")} />
            {gate && <ShiftGate {...gate} />}
          </>
        }
      >
        {children}
      </Frame>
    </PmsLiveProvider>
  );
}

// A page this session may not open, asked for another way than the sidebar
// (a typed address, a bookmark, a link from elsewhere): it says why, and
// offers the session's own first page, as the branch PMS's refusal did - "go
// back" may be nowhere useful. A page that belongs to the other place - Head
// Office or a branch - says so, and a developer is told to switch there.
function Refused({ item }) {
  const { role, realRole, scope } = usePmsSession();
  const home = landingPath(role, scope);
  const title = pageTitle(item);
  const elsewhere = opensOnlyIn(item, scope);
  const reason = !elsewhere
    ? `Your role isn't authorized to open ${title}. If you need it for your work, ask a manager to grant it or to do it for you.`
    : realRole === "developer"
      ? scope === "hq"
        ? `${title} works inside a branch. Open a branch from the switcher in the top bar to use it.`
        : `${title} is a Head Office page. Open Head Office from the switcher in the top bar to use it.`
      : scope === "hq"
        ? `${title} belongs to a branch's own PMS, so it isn't part of Head Office.`
        : `${title} is a Head Office page, so it isn't open to branch accounts.`;
  return (
    <div className={`${card.surface} max-w-3xl p-10 flex items-start gap-6`}>
      <IoLockClosedOutline size={32} className="shrink-0 text-(--emphasis)" />
      <div className="flex flex-col items-start gap-6">
        <p className="text-2xl">{reason}</p>
        <Link href={home} className={btn.primary}>
          Go to {pageTitle(navItemForPath(home))}
        </Link>
      </div>
    </div>
  );
}
