"use client";

import { useEffect, useState } from "react";
import { serverNow } from "@/lib/pms/dates";

// A website booking's hold lasts this long before it goes back on sale - the
// backend's HOLD_EXPIRY_HOURS (reservation-rules.constants.ts), the same
// window the Alerts page counts down.
const HOLD_HOURS = 2;

const left = (ms) => {
  if (ms <= 0) return "expiring now";
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m left` : `${m}m ${s % 60}s left`;
};

/**
 * How long a website booking's hold has left, ticking by the server's clock
 * (owner, 2026-11-19: beside the booking time, in the brand colour). Nothing
 * for any other booking, or one no longer on hold.
 */
export default function HoldCountdown({ reservation }) {
  const live =
    String(reservation?.source || "").toLowerCase() === "website" &&
    reservation?.status === "hold" &&
    !reservation?.is_expired_hold &&
    Boolean(reservation?.created_at);
  const [now, setNow] = useState(() => serverNow().getTime());
  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(() => setNow(serverNow().getTime()), 1000);
    return () => clearInterval(timer);
  }, [live]);
  if (!live) return null;
  // A reclaimed hold runs to its own hold_expires_at (backend phase-101).
  const ends = reservation.hold_expires_at
    ? new Date(reservation.hold_expires_at).getTime()
    : new Date(reservation.created_at).getTime() + HOLD_HOURS * 3600 * 1000;
  return (
    <span className="font-bold text-(--emphasis) tabular-nums" title="The hold ends then and the room goes back on sale">
      {left(ends - now)}
    </span>
  );
}
