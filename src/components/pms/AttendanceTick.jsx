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

export const isWebsiteBooking = (r) => String(r?.source || "").toLowerCase() === "website";

/** The cell: when it was ticked, or a box to tick it. Not a website booking: nothing to tick. */
export default function AttendanceTick({ reservation, onTicked }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (!isWebsiteBooking(reservation)) return <span className="text-(--text-color)/40">-</span>;
  // Ticked before it was cancelled or ran out: the tick still shows below.
  // Over without a tick: nothing to deal with now (owner, 2026-11-12).
  if (!reservation.attended_at && (reservation.status === "cancelled" || reservation.is_expired_hold)) {
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
