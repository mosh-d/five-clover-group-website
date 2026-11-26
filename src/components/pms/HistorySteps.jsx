"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

// Back and forward through the pages visited (owner, 2026-11-26: "add
// forward and backward buttons for easier navigation", modelled on
// Roomlodgic's HistorySteps). A slim bar at the top of every PMS page, so
// moving around doesn't depend on the browser's own buttons - the installed
// app on a phone, or a full-screen front-desk display, has none.
//
// It is the browser's real history, so these and the browser's buttons
// agree, and the browser holds the list. A button is greyed out when there is
// no PMS page that way: stepping stops at the edge of the PMS rather than
// going out to the sign-in page or another site.

// The browser's Navigation API (Chrome, Edge; Safari and Firefox are adding
// it). Without it the buttons stay on, and at the end of the history they do
// nothing, like the browser's own.
const browserNavigation = () => (typeof window === "undefined" ? undefined : window.navigation);

function subscribe(onChange) {
  const navigation = browserNavigation();
  // A beat later: Next.js changes the history from an insertion effect,
  // where React allows no updates.
  const later = () => queueMicrotask(onChange);
  navigation?.addEventListener("currententrychange", later);
  return () => navigation?.removeEventListener("currententrychange", later);
}

// A PMS page, not the sign-in page (/pms itself) or anything outside /pms.
function isPmsPage(entry) {
  if (!entry?.url) return false;
  try {
    const { pathname } = new URL(entry.url);
    return pathname.startsWith("/pms/");
  } catch {
    return false;
  }
}

// Which way there's a PMS page to step to - a string, because
// useSyncExternalStore compares snapshots by identity.
function availableSteps() {
  const navigation = browserNavigation();
  const current = navigation?.currentEntry;
  if (!navigation || !current) return "back forward";
  const entries = navigation.entries();
  return [isPmsPage(entries[current.index - 1]) ? "back" : "", isPmsPage(entries[current.index + 1]) ? "forward" : ""].join(" ");
}

const STEP_BUTTON =
  "inline-flex items-center justify-center rounded-lg p-2 text-(--text-color) transition-colors enabled:hover:bg-black/5 enabled:cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--emphasis)";

export default function HistorySteps() {
  const router = useRouter();
  const steps = useSyncExternalStore(subscribe, availableSteps, () => "");
  const canBack = steps.includes("back");
  const canForward = steps.includes("forward");

  return (
    <nav aria-label="Page history" className="shrink-0 flex items-center gap-1 border-b border-(--accent-2) px-14 max-sm:px-2 py-1.5 print:hidden">
      <button type="button" aria-label="Go back" title="Go back" disabled={!canBack} onClick={() => router.back()} className={STEP_BUTTON}>
        <IoChevronBack size={22} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Go forward" title="Go forward" disabled={!canForward} onClick={() => router.forward()} className={STEP_BUTTON}>
        <IoChevronForward size={22} aria-hidden="true" />
      </button>
    </nav>
  );
}
