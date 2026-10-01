"use client";

import { successBoxClass } from "./adminStyles";

// What a change did, once it has gone through - shown at the top of the page
// after its dialog closes (owner, 2026-10-01: every change confirms it
// worked). Stays until dismissed or the next change replaces it.
export default function Notice({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className={`${successBoxClass} flex items-start justify-between gap-4`} role="status">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} className="text-2xl leading-none cursor-pointer opacity-60 hover:opacity-100" aria-label="Dismiss">
        &times;
      </button>
    </div>
  );
}
