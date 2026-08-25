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

// Slightly lighter than --background-color (hsla(38, 38%, 94%, 1)) — same
// warm cream hue/saturation as the rest of the site, just enough lighter
// that a card reads as a distinct surface sitting on top of the page
// background rather than blending flat into it (the hotel-frontends'
// admin tables use bg-white on a gray page for the same reason; this is
// the on-brand equivalent instead of stark white).
export const cardBg = "hsla(38, 38%, 97%, 1)";

// Table styling — same structure as the hotel-frontends' shared
// components/shared/ui.js `table` recipe (card/scroll/el/headRow/th/row/
// td/actions), ported to this repo's brand tokens and cardBg.
export const tableCardClass = "w-full rounded-xl border overflow-hidden";
export const tableCardStyle = { backgroundColor: cardBg, borderColor: "var(--accent-2)" };
export const tableScrollClass = "overflow-x-auto";
export const tableClass = "min-w-full border-collapse text-xl";
export const tableHeadRowClass = "border-b";
export const tableHeadRowStyle = { borderColor: "var(--accent-2)", color: "var(--text-color)", opacity: 0.76 };
export const tableThClass = "px-6 py-4 text-left whitespace-nowrap text-lg font-semibold uppercase tracking-wide";
export const tableRowClass = "border-b last:border-0 transition-colors hover:bg-black/3";
export const tableRowStyle = { borderColor: "var(--accent-2)", color: "var(--text-color)" };
export const tableTdClass = "px-6 py-4 text-left";
export const tableActionsClass = "flex items-center gap-2 flex-nowrap";

// Compact action buttons for inside a table row — same visual language as
// the hotel-frontends' btn.rowPrimary/rowSecondary/rowDanger, sized down
// from the full-size primaryButtonClass/secondaryButtonClass above.
export const rowButtonPrimaryClass =
  "px-4 py-2 rounded-lg text-white text-lg font-bold tracking-wide cursor-pointer whitespace-nowrap transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed";
export const rowButtonPrimaryStyle = { background: "var(--emphasis)" };

export const rowButtonSecondaryClass =
  "px-4 py-2 rounded-lg border text-lg font-semibold tracking-wide cursor-pointer whitespace-nowrap transition-all hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed";
export const rowButtonSecondaryStyle = { borderColor: "var(--accent-2)", color: "var(--text-color)" };

export const rowButtonDangerClass =
  "px-4 py-2 rounded-lg border border-red-300 text-red-600 text-lg font-semibold tracking-wide cursor-pointer whitespace-nowrap transition-all hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-40 disabled:cursor-not-allowed";

export const rowButtonSuccessClass =
  "px-4 py-2 rounded-lg bg-green-700 text-white text-lg font-bold tracking-wide cursor-pointer whitespace-nowrap transition-all hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed";
