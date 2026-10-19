"use client";

import { IoWarningOutline } from "react-icons/io5";

// A room's cleaning state for the front desk (Housekeeping, Step 3 - backend
// docs/HOUSEKEEPING-PLAN.md). The server sends `cleaning` on a room only at a
// branch that runs housekeeping (null elsewhere), so nothing shows at the
// others. Clean shows nothing: it's what a room is expected to be.
export const CLEANING_LABELS = { dirty: "Dirty", cleaning: "Cleaning", review: "For review" };
const CLEANING_CLASSES = {
  dirty: "bg-red-100 text-red-700",
  cleaning: "bg-sky-100 text-sky-800",
  review: "bg-amber-100 text-amber-800",
};

export const isNotClean = (room) => Boolean(room?.cleaning) && room.cleaning !== "clean";

// "204 (Dirty)" in a room picker's option; just "204" when clean.
export const roomOptionText = (room) => {
  const notes = [room.status === "complementary" ? "Complementary" : null, isNotClean(room) ? CLEANING_LABELS[room.cleaning] : null].filter(Boolean);
  return notes.length ? `${room.room_number} (${notes.join(", ")})` : room.room_number;
};

export default function CleaningTag({ cleaning, className = "" }) {
  if (!cleaning || cleaning === "clean") return null;
  return (
    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${CLEANING_CLASSES[cleaning] || ""} ${className}`}>
      {CLEANING_LABELS[cleaning] || cleaning}
    </span>
  );
}

// The warning under a room picker when a picked room isn't clean (owner,
// 2026-10-16: warned, not stopped, for now). `rooms` are the picked rooms'
// entries from the picker's list; `verb` is what the desk is about to do.
export function NotCleanWarning({ rooms, verb = "check the guest in" }) {
  const notClean = (rooms || []).filter(isNotClean);
  if (notClean.length === 0) return null;
  const list = notClean.map((r) => `${r.room_number} (${CLEANING_LABELS[r.cleaning]})`).join(", ");
  return (
    <p className="flex items-start gap-2 text-lg text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3" role="status">
      <IoWarningOutline size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
      <span>
        {notClean.length === 1 ? `Room ${list} isn't clean yet` : `Rooms ${list} aren't clean yet`} - housekeeping hasn&apos;t finished with{" "}
        {notClean.length === 1 ? "it" : "them"}. You can still {verb}; the Audit Trail notes it.
      </span>
    </p>
  );
}
