// Carried over from the branch PMS's components/shared/laundryServices.js (2026-09-28).
// The two ways the same garment is sold. One list, shared by the guest and
// non-guest laundry sections (2026-09-24) and matching LAUNDRY_SERVICE_TYPES
// on the server — a garment carries two prices, and the label on the
// picker, the receipt and the folio line must never disagree about which
// one was sold.
export const LAUNDRY_SERVICE_TYPES = [
  { value: "wash_and_iron", label: "Wash & Iron", priceField: "wash_and_iron_price" },
  { value: "ironing_only", label: "Ironing Only", priceField: "ironing_only_price" },
];

export const laundryServiceLabel = (value) =>
  LAUNDRY_SERVICE_TYPES.find((s) => s.value === value)?.label || "";
