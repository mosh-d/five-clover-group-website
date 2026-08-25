// Shared style tokens for the HQ admin UI. Every admin page/component
// should pull text sizing, colors, and form-control styling from here
// instead of writing its own text-* classes inline — that's what let a
// handful of untagged <p> elements silently stay at the browser default
// size through several rounds of "increase the text size" fixes, since
// each pass only touched classes it could grep for.

export const textColorStyle = { color: "var(--text-color)" };
export const mutedTextStyle = { color: "var(--text-color)", opacity: 0.68 };

// Regular body/helper/status copy (loading states, empty states, hints).
export const bodyText = "text-xl";

// Uppercase field labels (forms) and section subtitles.
export const labelText = "text-xl font-semibold uppercase tracking-wide";

export const inputClass = "border rounded-lg px-4 py-3 text-2xl w-full";
export const inputStyle = { borderColor: "var(--accent-2)" };

export const primaryButtonClass =
  "rounded-lg px-4 py-3 text-2xl font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
export const primaryButtonStyle = { background: "var(--emphasis)" };

export const secondaryButtonClass =
  "rounded-lg px-4 py-3 text-2xl font-semibold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButtonStyle = { borderColor: "var(--accent-2)", color: "var(--text-color)" };

export const errorBoxClass = `${bodyText} text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3`;
