// The Cash-Up (backend docs/ACCOUNTING-PLAN.md, Step 2).
import { http } from "../http";

// A receptionist's or waitron's own cash-up for today or yesterday.
export const fetchMyCashUp = async (date) => {
  const response = await http.get(`/api/cash-up/mine`, { params: date ? { date } : undefined });
  return response.data;
};

// The cash counts this person still owes (today, or yesterday's until 6am) -
// the Cash-Up badge. Never an amount.
export const fetchMyCashUpDue = async () => {
  const response = await http.get(`/api/cash-up/mine/due`);
  return response.data?.due || [];
};

// Fired after a count is submitted, so the badge updates straight away.
export const CASH_UP_CHANGED_EVENT = "pms:cash-up-changed";

export const declareCashUp = async (date, amounts, note) => {
  const response = await http.put(`/api/cash-up/mine/${date}`, { amounts, ...(note ? { note } : {}) });
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CASH_UP_CHANGED_EVENT));
  return response.data;
};

export const recordPaidOut = async (paidOut) => {
  const response = await http.post(`/api/cash-up/paid-outs`, paidOut);
  return response.data;
};

export const cancelPaidOut = async (id) => {
  const response = await http.post(`/api/cash-up/paid-outs/${id}/cancel`);
  return response.data;
};

// The accountant's: per person, what the system expects beside what was declared.
export const fetchCashUpDay = async (date) => {
  const response = await http.get(`/api/cash-up/days/${date}`);
  return response.data;
};

export const verifyCashUp = async (id, reviewNote) => {
  const response = await http.post(`/api/cash-up/declarations/${id}/verify`, reviewNote ? { review_note: reviewNote } : {});
  return response.data;
};
