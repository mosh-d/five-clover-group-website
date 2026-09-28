// "Sep 28, 2026" in Lagos time.
export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { timeZone: "Africa/Lagos", month: "short", day: "numeric", year: "numeric" }) : "—";

// "14:05" in Lagos time.
export const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" }) : "—";

export const money = (v) =>
  `₦${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
