"use client";

import { IoCheckmarkCircle, IoClose } from "react-icons/io5";
import { field } from "./ui";

// What a change did, once it has gone through - shown at the top of the page
// after its dialog closes (owner, 2026-10-01: every change confirms it
// worked). Stays until dismissed or the next change replaces it.
export default function Notice({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className={`${field.success} w-full flex items-start justify-between gap-4`} role="status">
      <span className="flex items-start gap-2">
        <IoCheckmarkCircle size={22} className="shrink-0 mt-0.5" aria-hidden="true" />
        {message}
      </span>
      <button type="button" onClick={onDismiss} className="shrink-0 cursor-pointer opacity-60 hover:opacity-100" aria-label="Dismiss">
        <IoClose size={22} />
      </button>
    </div>
  );
}
