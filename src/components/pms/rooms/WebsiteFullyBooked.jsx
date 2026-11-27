"use client";

import { useState } from "react";
import Modal from "@/components/pms/Modal";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import { Tip } from "@/components/pms/Tip";
import { http } from "@/lib/pms/http";
import { page } from "@/components/pms/ui";

// "Fully Booked" for the website (owner, 2026-11-27; backend phase-106): the
// manager or a receptionist closes a room type to website bookings - the
// website shows it as unavailable and refuses new bookings for it. Website
// only: the desk still books it (walk-ins, calls), and no room's own status
// changes, so reports stay true. Switching it is a change, so it is confirmed
// in a pop-up first.

export function FullyBookedTag({ className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-base font-bold text-red-700 ${className}`}>
      Fully Booked (website)
    </span>
  );
}

export default function WebsiteFullyBooked({ room, onChanged, onError }) {
  const on = Boolean(room.website_fully_booked);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await http.patch(`/api/rooms/type/${room.room_type_id}/website-fully-booked`, { on: !on });
      setAsking(false);
      onChanged(!on);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Could not change it.";
      setError(msg);
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 border-t border-(--accent-2) pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className={page.sectionTitle}>
          Fully Booked<Tip id="rooms.view.fullyBooked" />
        </h3>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={`Fully Booked on the website: ${on ? "on" : "off"}`}
          onClick={() => {
            setError("");
            setAsking(true);
          }}
          className={`relative inline-flex h-10 w-[4.4rem] shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--emphasis) ${
            on ? "bg-red-600" : "bg-(--text-color)/25"
          }`}
        >
          <span className={`inline-block h-8 w-8 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[2.4rem]" : "translate-x-1"}`} />
        </button>
      </div>
      <p className="text-xl text-(--text-color)/76 leading-relaxed">
        {on ? <FullyBookedTag className="mr-2" /> : null}
        For website bookings only. When it&apos;s on, the website shows this room type as unavailable and takes no new bookings for it. The front desk can still book it, and the rooms keep their own status.
      </p>

      {asking && (
        <Modal onClose={busy ? undefined : () => setAsking(false)} title={on ? "Open to Website Bookings?" : "Mark Fully Booked on the Website?"} subtitle={room.room_type_name} size="md" zIndex={1100}>
          <ConfirmPanel
            question={on ? `Open the ${room.room_type_name} to website bookings again?` : `Mark the ${room.room_type_name} fully booked on the website?`}
            details={
              on
                ? ["The website will show its free rooms and take bookings for it again."]
                : [
                    "The website will show it as unavailable and take no new bookings for it.",
                    "The front desk can still book it. No room's status changes.",
                    "Bookings already made are not affected.",
                  ]
            }
            confirmLabel={on ? "Yes, open it" : "Yes, mark it fully booked"}
            busyLabel="Saving..."
            busy={busy}
            danger={!on}
            error={error}
            onBack={() => setAsking(false)}
            onConfirm={confirm}
          />
        </Modal>
      )}
    </section>
  );
}
