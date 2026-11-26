"use client";

import { useEffect, useRef, useState } from "react";
import { IoRefreshOutline } from "react-icons/io5";

// Pull down past the top of a page to refresh it (owner, 2026-11-06). The
// installed app has no browser to do it, and the PMS's page area scrolls on
// its own (Frame's <main>), so it is done here: at the top of the page, a
// finger pulled down shows the pill, "Release to refresh" past the line, and
// letting go there reloads the page. Touch only; a mouse, a page that isn't
// at its top, and a touch inside a pop-up (see leaveAlone) are left alone.
const TRIGGER = 80; // px of pull that refreshes
const MAX = 120;

// A touch that pull-to-refresh must leave alone (owner, 2026-11-26: "I was
// just looking at a folio, tapped room account, and the pop up closed" - and
// the screen "switching" before it). A pop-up sits inside the page area, so
// a finger drawn down inside it - scrolling a folio back up - reached here
// while the list behind was at its top, and reloaded the whole PMS, which
// closed the pop-up. So: nothing that starts inside a pop-up, a menu or a
// drawer, and nothing inside a box that scrolls on its own and isn't at its
// own top.
function leaveAlone(target, page) {
  if (!(target instanceof Element)) return true;
  if (target.closest('[aria-modal="true"], [role="dialog"], [role="menu"], .pms-overlay')) return true;
  for (let el = target; el && el !== page; el = el.parentElement) {
    if (el.scrollTop > 0) return true;
  }
  return false;
}

export default function PullToRefresh({ scrollerRef }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef(null);
  const pullRef = useRef(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    const onStart = (e) => {
      start.current = el.scrollTop <= 0 && e.touches.length === 1 && !leaveAlone(e.target, el) ? e.touches[0].clientY : null;
    };
    const onMove = (e) => {
      if (start.current === null) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0 || el.scrollTop > 0) {
        if (pullRef.current) setPull((pullRef.current = 0));
        return;
      }
      // Resists as it goes, like the phone's own.
      const next = Math.min(MAX, dy * 0.5);
      pullRef.current = next;
      setPull(next);
    };
    const onEnd = () => {
      if (start.current === null) return;
      start.current = null;
      if (pullRef.current >= TRIGGER) {
        setRefreshing(true);
        window.location.reload();
        return;
      }
      setPull((pullRef.current = 0));
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [scrollerRef]);

  if (!pull && !refreshing) return null;
  const ready = pull >= TRIGGER || refreshing;
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center" style={{ transform: `translateY(${refreshing ? TRIGGER / 2 : pull / 2}px)` }} aria-live="polite">
      <span className="flex items-center gap-2 rounded-full bg-(--card) shadow-md border border-(--accent-2) px-4 py-2 text-lg font-semibold text-(--text-color)">
        <IoRefreshOutline size={18} className={refreshing ? "animate-spin" : ""} style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }} />
        {refreshing ? "Refreshing..." : ready ? "Release to refresh" : "Pull to refresh"}
      </span>
    </div>
  );
}
