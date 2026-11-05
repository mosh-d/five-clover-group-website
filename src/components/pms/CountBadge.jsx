"use client";

// The PMS's one count badge (owner, 2026-11-05: "a unified design system"
// - every count shown with something looks the same, end to end). The look
// is the Alerts page's: a round red pill, white bold number.
//
// - tone "alert" (red): something waits for this person - sidebar items,
//   page tabs, section headings. "neutral" (grey): just how many there are,
//   nothing to act on.
// - size "md" for sidebar items, tabs and section headings; "lg" beside a
//   page's own heading.
// - active: on a filled (emphasis) item - the selected tab or sidebar item -
//   it turns white so it stays readable.
//
// Nothing shows for 0. Never write a count as "(3)" in a label - use this.
export default function CountBadge({ count, label, tone = "alert", size = "md", active = false, className = "" }) {
  if (!count || count <= 0) return null;
  const colours = active
    ? "bg-white text-(--emphasis)"
    : tone === "neutral"
      ? "bg-(--text-color)/12 text-(--text-color)"
      : "bg-red-600 text-white";
  const sizing = size === "lg" ? "text-2xl min-w-[2.5rem]" : "text-xl min-w-[2.2rem]";
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full px-3 py-1 font-bold leading-tight text-center ${sizing} ${colours} ${className}`}
      aria-label={label ? `${count} ${label}` : undefined}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
