// What's wrong with a money adjustment typed into a form - a tax, a
// discount, a rate - or "" when nothing is. Never negative, and a
// percentage no more than 100. Blank is fine: these are optional, and blank
// means none (owner, 2026-10-02: "make sure all our forms have the proper
// validation"). A charge's own amount is not one of these - a negative
// charge is a legitimate adjustment.
export function adjustmentProblem(label, value, mode = "fixed") {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return `${label} has to be a number.`;
  if (n < 0) return `${label} can't be negative.`;
  if (mode === "percentage" && n > 100) return `${label} can't be more than 100%.`;
  return "";
}

// The most a field in that mode may hold, for the input's own max.
export const adjustmentMax = (mode) => (mode === "percentage" ? 100 : undefined);
