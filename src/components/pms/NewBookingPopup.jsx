"use client";

import { playSound } from "@/lib/pms/sounds";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { IoClose } from "react-icons/io5";
import { usePmsLive } from "./live/PmsLive";

// "New Online Booking" - a guest just booked on the website (the branch
// PMS's popup, owner 2026-09-16 and 2026-09-28).
//
// Only a booking from the guest-facing site raises it: a walk-in or a future
// booking is being typed at the desk at that very moment. And only someone
// who can open Reservations sees it (`enabled`), since clicking it opens the
// booking there - the one limitation the owner set. The shell decides that
// from the sidebar's own role matrix.
export default function NewBookingPopup({ enabled }) {
  const router = useRouter();
  const { subscribe } = usePmsLive();
  // The booking it is about, so clicking opens that one, not just the list.
  const [bookingId, setBookingId] = useState(null);

  // A booking from the website is an alert (lib/pms/sounds.js).
  const onNewBooking = useCallback((data) => {
    setBookingId(data?.reservation_id || "");
    playSound("alert");
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    return subscribe(onNewBooking, "new_reservation");
  }, [enabled, subscribe, onNewBooking]);

  const open = () => {
    const id = bookingId;
    setBookingId(null);
    router.push(id ? `/pms/reservations?reservation_id=${id}` : "/pms/reservations");
  };

  return (
    <AnimatePresence>
      {bookingId !== null && (
        <motion.div
          // Just below the top bar.
          className="fixed top-[15rem] right-6 z-[2600]"
          initial={{ opacity: 0, x: 80, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        >
          {/* Only its Open button opens the booking (owner, 2026-11-25: the
              screen switched pages by itself - a tap that landed on the card
              as it slid in under the finger opened Reservations). */}
          <div
            role="status"
            className="bg-(--card) border border-(--accent-2) border-l-4 border-l-(--emphasis) shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 rounded-lg flex items-center gap-6 min-w-[min(32rem,calc(100vw-3rem))] max-w-[calc(100vw-3rem)]"
          >
            <div className="bg-(--emphasis)/10 p-3 rounded-full">
              <span className="text-3xl">🔔</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-(--black) leading-tight">New Online Booking</h4>
              <p className="text-lg text-(--text-color)/76">A guest just booked on the website</p>
              <button type="button" onClick={open} className="mt-2 text-lg font-bold text-(--emphasis) hover:underline cursor-pointer">
                Open booking
              </button>
            </div>
            <button
              onClick={() => setBookingId(null)}
              aria-label="Dismiss"
              className="text-(--text-color)/40 hover:text-(--emphasis) transition-colors p-1"
            >
              <IoClose size={24} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
