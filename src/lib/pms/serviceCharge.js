import { money } from "./format";

// A menu item's service charge (owner, 2026-11-05) - the same rule as the
// backend's common/utils/service-charge.util.ts: 'fixed' is an amount per one
// sold, 'percent' is a percentage of the line's price. Used for previews only;
// the server works out what is actually charged.
export const menuServiceCharge = (item, quantity) => {
  const rate = Number(item?.service_charge || 0);
  if (!rate) return 0;
  if (item.service_charge_type === "percent") return Math.round(Number(item.price || 0) * quantity * rate) / 100;
  return rate * quantity;
};

// "10%" or "₦200.00".
export const serviceChargeText = (item) =>
  item?.service_charge_type === "percent" ? `${Number(item.service_charge || 0)}%` : money(item?.service_charge || 0);
