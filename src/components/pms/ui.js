// The PMS's class recipes - every page builds from these, so every table,
// form and button looks the same whichever brand is signed in. Colours come
// only from the theme's CSS variables (see theme/brands.js), never a fixed
// value, so a recipe written once is right for all three brands.
//
// The branch PMS's recipes (hotel-frontends components/shared/ui.js), on
// the HQ admin's surfaces: cards and table cells are the brand's cream
// (--card) edged in --accent-2, not white edged in grey.

export const page = {
  // A page's own padding and vertical rhythm, inside the shell's <main>.
  wrap: "w-full flex flex-col items-start gap-[4.5rem]",
  sectionTitle: "text-3xl font-bold text-(--black)",
  muted: "text-(--text-color)/68",
};

export const btn = {
  primary:
    "px-8 py-4 rounded-lg bg-(--emphasis) text-white text-xl font-bold tracking-wide cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--emphasis) disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
  secondary:
    "px-8 py-4 rounded-lg border border-(--accent-2) bg-(--card) text-(--text-color) text-xl font-semibold tracking-wide cursor-pointer transition-all hover:bg-black/5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--text-color) disabled:opacity-40 disabled:cursor-not-allowed",
  danger:
    "px-8 py-4 rounded-lg border border-red-300 bg-(--card) text-red-600 text-xl font-semibold tracking-wide cursor-pointer transition-all hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
  success:
    "px-8 py-4 rounded-lg bg-green-700 text-white text-xl font-bold tracking-wide cursor-pointer transition-all hover:bg-green-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
  // Compact variants for table rows - always laid out horizontally.
  rowPrimary:
    "px-5 py-2.5 rounded-lg bg-(--emphasis) text-white text-lg font-bold tracking-wide cursor-pointer whitespace-nowrap transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
  rowSecondary:
    "px-5 py-2.5 rounded-lg border border-(--accent-2) bg-(--card) text-(--text-color) text-lg font-semibold tracking-wide cursor-pointer whitespace-nowrap transition-all hover:bg-black/5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
  rowDanger:
    "px-5 py-2.5 rounded-lg border border-red-300 bg-(--card) text-red-600 text-lg font-semibold tracking-wide cursor-pointer whitespace-nowrap transition-all hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
  rowSuccess:
    "px-5 py-2.5 rounded-lg bg-green-700 text-white text-lg font-bold tracking-wide cursor-pointer whitespace-nowrap transition-all hover:bg-green-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
  // Solid destructive - the confirm step of something that can't be undone.
  dangerSolid:
    "px-8 py-4 rounded-lg bg-red-600 text-white text-xl font-bold tracking-wide cursor-pointer transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
  // A text-only jump ("View all ->").
  link: "text-xl font-bold text-(--emphasis) hover:underline cursor-pointer",
};

export const field = {
  label: "text-xl font-semibold uppercase tracking-wide text-(--text-color)/68",
  input:
    "w-full border border-(--accent-2) rounded-lg px-4 py-3 text-2xl bg-white text-(--text-color) placeholder:text-(--text-color)/30 focus:outline-none focus:ring-2 focus:ring-(--emphasis) focus:border-transparent transition-shadow",
  // Sized to its contents, as the branch PMS's selects are - add w-full
  // where one should span its row.
  select:
    "w-auto border border-(--accent-2) rounded-lg px-4 py-3 text-2xl bg-white text-(--text-color) focus:outline-none focus:ring-2 focus:ring-(--emphasis) focus:border-transparent transition-shadow cursor-pointer",
  error: "text-xl text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3",
  success: "text-xl text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3",
  hint: "text-lg text-(--text-color)/60",
  textarea:
    "w-full border border-(--accent-2) rounded-lg px-4 py-3 text-2xl bg-white text-(--text-color) placeholder:text-(--text-color)/30 focus:outline-none focus:ring-2 focus:ring-(--emphasis) focus:border-transparent transition-shadow resize-none overflow-hidden",
};

// A heading inside a dialog or a card.
export const sectionTitle = "text-2xl font-bold text-(--black)";

export const card = {
  surface: "rounded-xl border border-(--accent-2) bg-(--card)",
};

export const table = {
  // <div className={table.card}><div className={table.scroll}><table className={table.el}>...
  card: "w-full rounded-xl border border-(--accent-2) bg-(--card) overflow-hidden",
  scroll: "overflow-x-auto",
  el: "min-w-full border-collapse text-2xl",
  headRow: "border-b border-(--accent-2) bg-(--text-color)/3",
  th: "px-8 py-4 text-left whitespace-nowrap text-xl font-semibold uppercase tracking-wide text-(--text-color)/76",
  // `group` lets the pinned column follow the row's hover tint.
  row: "group border-b border-(--accent-2) last:border-b-0 transition-colors hover:bg-black/2",
  td: "px-8 py-4 text-left whitespace-nowrap text-(--text-color)",
  actions: "flex items-center gap-2 flex-nowrap",
  empty: "px-8 py-10 text-center text-xl text-(--text-color)/68",
  // The pinned name/ID column - whatever identifies a row (a guest, a room
  // type, a booking) stays in view while a wide table scrolls sideways.
  // Compose with th/td: `${table.th} ${table.stickyTh}`. Position-based, so
  // it works whichever column it is put on.
  //
  // Carried over exactly from the branch PMS, where each detail was learned
  // the hard way (2026-09-19): the background must be OPAQUE - a
  // translucent tint lets the next column's text show through once
  // scrolled - so it is color-mix()ed against the card colour; and the
  // divider is a box-shadow, never a border, because a collapsed border is
  // drawn from the un-scrolled table and comes loose from a sticky cell.
  // Below lg the pinned cell may wrap, inside a minimum width, so a long
  // name takes two lines rather than a phone's whole width.
  stickyTh:
    "sticky left-0 z-10 bg-[color-mix(in_srgb,var(--text-color)_3%,var(--card))] [box-shadow:inset_-1px_0_0_var(--accent-2)]",
  stickyTd:
    "sticky left-0 z-10 max-lg:whitespace-normal! max-lg:min-w-[18rem] bg-(--card) group-hover:bg-[color-mix(in_srgb,black_2%,var(--card))] [box-shadow:inset_-1px_0_0_var(--accent-2)]",
};
