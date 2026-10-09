// The Accounting page (the branch accountant's; backend docs/ACCOUNTING-PLAN.md).
import { http } from "../http";

// Day Close: one page of business days (10), newest first, from yesterday.
export const fetchAccountingDays = async (page = 1) => {
  const response = await http.get(`/api/accounting/days`, { params: { page } });
  return response.data;
};

export const fetchAccountingDay = async (date) => {
  const response = await http.get(`/api/accounting/days/${date}`);
  return response.data;
};

export const signOffAccountingDay = async (date, note) => {
  const response = await http.post(`/api/accounting/days/${date}/sign-off`, note ? { note } : {});
  return response.data;
};

// Exceptions: every way money was given back or taken off in a range of business days.
export const fetchExceptions = async (from, to, show = "unreviewed") => {
  const response = await http.get(`/api/accounting/exceptions`, { params: { from, to, show } });
  return response.data;
};

// Marks lines OK, or flags them for the manager ("ok" | "flagged").
export const reviewExceptions = async ({ from, to, keys, status, note }) => {
  const response = await http.post(`/api/accounting/exceptions/review`, { from, to, keys, status, ...(note ? { note } : {}) });
  return response.data;
};

// The manager's: what the accountant has flagged.
export const fetchFlaggedExceptions = async () => {
  const response = await http.get(`/api/exceptions/flagged`);
  return response.data;
};
