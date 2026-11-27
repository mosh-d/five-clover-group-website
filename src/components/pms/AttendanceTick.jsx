"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/pms/Modal";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import { formatDateTime } from "@/lib/pms/format";
import { http } from "@/lib/pms/http";

// Booking ticks for branches not yet on the PMS (owner, 2026-11-11; backend
// phase-98): the receptionist ticks each website booking once they have
// attended to it (offline, until they are trained). The tick is timed; the
// developer's Booking Attendance report shows which were missed.

/** Whether this branch ticks bookings - asked live, so the developer's switch shows at once. */
export function useAttendanceTicks(enabled) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    http.get("/api/booking-attendance").then(
      ({ data }) => !cancelled && setOn(Boolean(data?.on)),
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return enabled && on;
}

// A booking that comes in overnight - 10pm to 8am, Lagos - stays tickable
// until 10am that morning, even once its hold has run out (owner, 2026-11-18,
// widened 2026-11-27 from 10pm-6am/9am: so the receptionist can sleep and
// still tick it). The 10am, or null for one made in the day. Mirrors the
// backend's overnightTickUntil.
const HOUR = 60 * 60 * 1000;
export function overnightTickUntil(createdAt) {
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return null;
  const local = new Date(t + HOUR);
  const hour = local.getUTCHours();
  if (hour >= 8 && hour < 22) return null;
  const day = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + (hour >= 22 ? 24 * HOUR : 0);
  return new Date(day + 10 * HOUR - HOUR);
}
const inOvernightGrace = (r) => {
  const until = r?.is_expired_hold ? overnightTickUntil(r.created_at) : null;
  return Boolean(until) && Date.now() < until.getTime();
};

export const isWebsiteBooking = (r) => String(r?.source || "").toLowerCase() === "website";

/**
 * The status to show for a booking (owner, 2026-11-12): a hold that ran out
 * with no one attending to it shows Missed, not Cancelled - no one cancelled
 * it. One a receptionist cancelled stays Cancelled. Every branch.
 */
export const reservationStatus = (r) => (r?.status === "cancelled" && r?.is_expired_hold && !r?.attended_at ? "missed" : r?.status);

/** The cell: when it was ticked, or a box to tick it. Not a website booking: nothing to tick. */
export default function AttendanceTick({ reservation, onTicked }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (!isWebsiteBooking(reservation)) return <span className="text-(--text-color)/40">-</span>;
  // Ticked before it was cancelled or ran out: the tick still shows below.
  // Over without a tick: nothing to tick now - a hold that ran out says Missed
  // in the Status column instead (reservationStatus above).
  if (!reservation.attended_at && (reservation.status === "cancelled" || reservation.is_expired_hold) && !inOvernightGrace(reservation)) {
    return <span className="text-(--text-color)/40">-</span>;
  }
  if (reservation.attended_at) {
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span aria-hidden="true" className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-green-600 text-white text-base font-bold">
          ✓
        </span>
        <span className="text-lg">{formatDateTime(reservation.attended_at)}</span>
      </span>
    );
  }
  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      await http.post(`/api/booking-attendance/${reservation.id}/tick`, {});
      setAsking(false);
      onTicked?.(`${reservation.guest_name}'s booking is ticked as attended.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <label className="inline-flex items-center gap-2 cursor-pointer text-lg whitespace-nowrap">
        <input type="checkbox" checked={false} onChange={() => setAsking(true)} className="w-6 h-6 cursor-pointer" aria-label={`Tick ${reservation.guest_name}'s booking as attended`} />
        Not yet
      </label>
      {asking && (
        <Modal onClose={busy ? undefined : () => setAsking(false)} title="Booking Attended" size="md">
          <ConfirmPanel
            question={`Tick ${reservation.guest_name}'s booking as attended?`}
            details={["Only once you have attended to it.", "The time and your name are kept, and the tick can't be taken back."]}
            confirmLabel="Yes, tick it"
            busyLabel="Saving..."
            busy={busy}
            error={error}
            onBack={() => setAsking(false)}
            onConfirm={confirm}
          />
        </Modal>
      )}
    </>
  );
}
