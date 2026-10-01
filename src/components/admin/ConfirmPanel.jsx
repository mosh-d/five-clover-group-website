"use client";

import {
  bodyText,
  mutedTextStyle,
  textColorStyle,
  errorBoxClass,
  primaryButtonClass,
  primaryButtonStyle,
  secondaryButtonClass,
  secondaryButtonStyle,
  dangerButtonClass,
} from "./adminStyles";

// The second step of every change in the HQ admin (owner, 2026-10-01:
// "double confirmation ... and confirmation feedback or error feedback").
// Says in words exactly what is about to happen, then waits for a Yes. A
// refusal from the server shows here, in the same place, with Back to fix
// whatever was wrong - nothing is ever left silently undone.
export default function ConfirmPanel({ question, details = [], confirmLabel, busyLabel, busy, danger = false, error, onBack, onConfirm, backLabel = "Back" }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-2xl font-semibold" style={textColorStyle}>{question}</p>
      {details.length > 0 && (
        <ul className="flex flex-col gap-2 list-disc pl-6">
          {details.map((line) => (
            <li key={line} className={bodyText} style={mutedTextStyle}>{line}</li>
          ))}
        </ul>
      )}
      {error && <p className={errorBoxClass} role="alert">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onBack} disabled={busy} className={secondaryButtonClass} style={secondaryButtonStyle}>
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={danger ? dangerButtonClass : primaryButtonClass}
          style={danger ? undefined : primaryButtonStyle}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </div>
  );
}
