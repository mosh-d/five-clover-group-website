// Number and date wording for the HQ Metrics page. Money is whole naira,
// shares one decimal, dates as people say them ("1 Sep 2026"); a value that
// can't be worked out (nothing to divide by) reads as a dash, never as 0.

export const DASH = "—";

const whole = (n) => Math.round(Number(n) || 0);

export function naira(n) {
  if (n === null || n === undefined) return DASH;
  const value = whole(n);
  return `${value < 0 ? "−" : ""}₦${Math.abs(value).toLocaleString("en-NG")}`;
}

// For a crowded grid cell: ₦1.2M, ₦450K.
export function nairaShort(n) {
  if (n === null || n === undefined) return DASH;
  const value = Number(n) || 0;
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1e6) return `${sign}₦${(abs / 1e6).toFixed(abs >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (abs >= 1e3) return `${sign}₦${Math.round(abs / 1e3)}K`;
  return `${sign}₦${Math.round(abs)}`;
}

export const count = (n) => (n === null || n === undefined ? DASH : (Number(n) || 0).toLocaleString("en-NG"));

// Room-nights and averages: whole when whole, else one decimal.
export function decimal(n) {
  if (n === null || n === undefined) return DASH;
  const value = Number(n) || 0;
  return Number.isInteger(value) ? value.toLocaleString("en-NG") : value.toLocaleString("en-NG", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export const percent = (p) => (p === null || p === undefined ? DASH : `${Number(p).toFixed(1)}%`);

export const plural = (n, one, many = `${one}s`) => `${count(n)} ${Number(n) === 1 ? one : many}`;

// A share of a whole, worked out here (for mixes the server sends as amounts).
export const shareOf = (part, whole) => (Number(whole) > 0 ? Math.round((Number(part) / Number(whole)) * 1000) / 10 : null);

// YYYY-MM-DD (a date with no time) - read at noon UTC so no time zone can
// tip it onto the day before.
export function dayText(iso, opts = {}) {
  if (!iso) return DASH;
  return new Date(`${String(iso).slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC", ...opts });
}

export const shortDay = (iso) => dayText(iso, { year: undefined });

// A moment, in Lagos time.
export function momentText(value) {
  if (!value) return DASH;
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// A moment's date in Lagos (a stay that began at 00:30 Lagos is that day, not the UTC day before).
export function momentDay(value) {
  if (!value) return DASH;
  return new Date(value).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" });
}

export const periodText = (p) => (p ? (p.from === p.to ? dayText(p.from) : `${dayText(p.from)} – ${dayText(p.to)}`) : "");

// Today's business date in Lagos: the day rolls over at 6am (UTC+1), as
// every branch report counts days.
export function businessToday(now = Date.now()) {
  return new Date(now + 60 * 60 * 1000 - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Date ranges people pick most, ending today (business days).
export function presetRange(key, today = businessToday()) {
  const [y, m] = today.split("-").map(Number);
  const iso = (year, month, day) => new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  switch (key) {
    case "this-month":
      return { from: iso(y, m, 1), to: today };
    case "last-month":
      return { from: iso(y, m - 1, 1), to: iso(y, m, 0) };
    case "this-year":
      return { from: iso(y, 1, 1), to: today };
    case "last-30":
    default:
      return { from: addDays(today, -29), to: today };
  }
}

export const RANGE_PRESETS = [
  { key: "last-30", label: "Last 30 days" },
  { key: "this-month", label: "This month" },
  { key: "last-month", label: "Last month" },
  { key: "this-year", label: "This year" },
];

// A change against the previous period: up/down and how much, in words.
// `kind` "pts" for a percentage that moved (percentage points), else a
// relative change of an amount.
export function change(now, before, kind = "rel") {
  if (now === null || now === undefined || before === null || before === undefined) return null;
  const a = Number(now);
  const b = Number(before);
  if (kind === "pts") {
    const diff = Math.round((a - b) * 10) / 10;
    return { direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat", text: `${diff > 0 ? "+" : diff < 0 ? "−" : ""}${Math.abs(diff).toFixed(1)} pts` };
  }
  if (b === 0) return a === 0 ? { direction: "flat", text: "no change" } : { direction: a > 0 ? "up" : "down", text: "new" };
  const rel = Math.round(((a - b) / Math.abs(b)) * 1000) / 10;
  return { direction: rel > 0 ? "up" : rel < 0 ? "down" : "flat", text: `${rel > 0 ? "+" : rel < 0 ? "−" : ""}${Math.abs(rel).toFixed(1)}%` };
}
