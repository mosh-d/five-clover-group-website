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
