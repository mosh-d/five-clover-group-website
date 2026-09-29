// "Sep 28, 2026" in Lagos time.
export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { timeZone: "Africa/Lagos", month: "short", day: "numeric", year: "numeric" }) : "—";

// "14:05" in Lagos time.
export const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" }) : "—";

// "Sep 28, 2026, 2:05 PM" in Lagos time.
export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-US", { timeZone: "Africa/Lagos", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

export const pct = (v) => `${Number(v || 0).toFixed(1)}%`;

// The methods staff record payments by - the server accepts exactly these.
export const PAYMENT_METHODS = ["cash", "card", "transfer", "pos", "online"];

// Stored lowercase (cash, pos, ota...); initialisms stay capitals ("POS",
// "OTA"), and a comma-separated split reads "Cash, POS".
const PAYMENT_METHOD_LABELS = {
  ota: "OTA",
  pos: "POS",
  nil: "NIL",
  charged_to_room: "Charged to Room",
  reservation_credit: "Reservation Credit",
  // A credit paid back before its payout method was recorded (2026-09-28).
  credit_refunds: "Credit Refunds",
};
export const formatPaymentMethod = (method) => {
  const raw = String(method == null ? "" : method).trim();
  if (!raw) return "—";
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const key = part.toLowerCase();
      if (PAYMENT_METHOD_LABELS[key]) return PAYMENT_METHOD_LABELS[key];
      return key
        .split(/[\s_]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    })
    .join(", ");
};

export const money = (v) =>
  `₦${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
