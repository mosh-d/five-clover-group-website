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
  // Every section and subsection heading - a report's "Food Orders", a
  // dialog's "Charges" - the same (owner, 2026-11-27: "a consistent large
  // bold and brand colored font... twice the size it is now"): 30px on a
  // laptop, a step smaller on a phone, in the brand's own colour. Dialog
  // titles (Modal) are not sections and keep their own.
  sectionTitle: "text-4xl md:text-5xl font-bold leading-tight text-(--emphasis)",
  muted: "text-(--text-color)/68",
  // The top of every page (PageHeader, owner 2026-11-06): title, what the
  // page is for, its section switches and filters - grouped together, and
  // set apart from the content by a divider and the page's own gap.
  header: "w-full flex flex-col gap-5 pb-8 border-b border-(--accent-2)",
  // Descriptions - under a page's title (intro) and under a section's
  // (sectionIntro): supporting text, a step below body text so it takes less
  // room. Never a field, so it can't make a phone zoom.
  intro: "text-lg leading-relaxed text-(--text-color)/68 max-w-[80ch]",
  sectionIntro: "text-lg leading-relaxed text-(--text-color)/68 max-w-[80ch]",
  // A row of filters and searches under the section switches.
  toolbar: "w-full flex flex-wrap items-end gap-3",
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

// The filter row at the top of a page or report (FilterBar.jsx, owner
// 2026-11-27): one compact look everywhere. Every control in it is the same
// height (h), and every label too, (i) or not, so the fields line up.
const FILTER_H = "h-[4.4rem]";
export const filter = {
  bar: "w-full flex flex-wrap items-end gap-x-4 gap-y-4 rounded-xl border border-(--accent-2) bg-(--card) px-5 py-4",
  field: "flex flex-col gap-1.5 min-w-0",
  // A search or a long dropdown.
  wide: "w-full sm:w-[28rem]",
  // A date: half the row on a phone (From and To side by side), its own width above.
  date: "w-full sm:w-[17rem]",
  pair: "grid grid-cols-2 gap-4 w-full sm:flex sm:w-auto",
  label: "h-[2.2rem] flex items-center whitespace-nowrap text-lg font-semibold uppercase tracking-wide text-(--text-color)/68",
  input: `${FILTER_H} w-full border border-(--accent-2) rounded-lg px-4 text-2xl bg-white text-(--text-color) placeholder:text-(--text-color)/30 focus:outline-none focus:ring-2 focus:ring-(--emphasis) focus:border-transparent transition-shadow`,
  select: `${FILTER_H} w-full sm:w-auto border border-(--accent-2) rounded-lg px-4 text-2xl bg-white text-(--text-color) focus:outline-none focus:ring-2 focus:ring-(--emphasis) focus:border-transparent transition-shadow cursor-pointer`,
  actions: "flex flex-wrap items-end gap-3 ml-auto",
  primary: `${FILTER_H} inline-flex items-center justify-center gap-2 px-6 rounded-lg bg-(--emphasis) text-white text-xl font-bold tracking-wide whitespace-nowrap cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed`,
  secondary: `${FILTER_H} inline-flex items-center justify-center gap-2 px-6 rounded-lg border border-(--accent-2) bg-white text-(--text-color) text-xl font-semibold tracking-wide whitespace-nowrap cursor-pointer transition-all hover:bg-black/5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed`,
};

// A heading inside a dialog or a card: the same as a page's sections.
export const sectionTitle = page.sectionTitle;

export const card = {
  surface: "rounded-xl border border-(--accent-2) bg-(--card)",
};

export const table = {
  // <div className={table.card}><div className={table.scroll}><table className={table.el}>...
  card: "w-full rounded-xl border border-(--accent-2) bg-(--card) overflow-hidden",
  // Scrolls both ways inside a box no taller than 70% of the screen, so the
  // heading row stays in view like the first column (owner, 2026-11-10) -
  // the .pms-table-scroll rule in globals.css pins every thead cell.
  scroll: "pms-table-scroll overflow-x-auto",
  // Compact (owner, 2026-11-06: more data on the screen), and a step up on
  // phones and tablets once the PMS dropped the public site's minimum sizes
  // (owner, same day: "a bit" bigger): 12px on a phone, 12.5px on a laptop.
  el: "min-w-full border-collapse text-2xl lg:text-xl",
  headRow: "border-b border-(--accent-2) bg-(--text-color)/3",
  th: "px-4 py-3 md:px-6 md:py-4 text-left whitespace-nowrap text-xl lg:text-base font-semibold uppercase tracking-wide text-(--text-color)/76",
  // `group` lets the pinned column follow the row's hover tint.
  row: "group border-b border-(--accent-2) last:border-b-0 transition-colors hover:bg-black/6",
  td: "px-4 py-3 md:px-6 md:py-4 text-left whitespace-nowrap text-(--text-color)",
  actions: "flex items-center gap-2 flex-nowrap",
  empty: "px-4 md:px-6 py-10 text-center text-xl lg:text-lg text-(--text-color)/68",
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
  // It hugs its contents (w-[1%]), leaving the width to the other columns
  // (owner, 2026-11-06: it took half a phone). Below lg it may wrap, inside a
  // small minimum width, so a long name takes two lines instead.
  stickyTh:
    "sticky left-0 z-10 bg-[color-mix(in_srgb,var(--text-color)_3%,var(--card))] [box-shadow:inset_-1px_0_0_var(--accent-2)]",
  stickyTd:
    "sticky left-0 z-10 w-[1%] max-lg:whitespace-normal! max-lg:min-w-[12rem] bg-(--card) group-hover:bg-[color-mix(in_srgb,black_6%,var(--card))] [box-shadow:inset_-1px_0_0_var(--accent-2)]",
};
