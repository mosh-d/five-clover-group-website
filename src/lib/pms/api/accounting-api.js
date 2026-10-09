// The Accounting page (the branch accountant's; backend docs/ACCOUNTING-PLAN.md).
import { http } from "../http";
import { pmsDownload } from "../client";

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

// Receivables: what is owed - in house, left owing (by age), non-guest bills.
export const fetchReceivables = async () => {
  const response = await http.get(`/api/accounting/receivables`);
  return response.data;
};

// The follow-up notes on one debt: { folio_id } or { non_guest_folio_id }.
export const fetchReceivableNotes = async (debt) => {
  const response = await http.get(`/api/accounting/receivables/notes`, { params: debt });
  return response.data;
};

export const addReceivableNote = async (debt, note) => {
  const response = await http.post(`/api/accounting/receivables/notes`, { ...debt, note });
  return response.data;
};

// A guest's statement of account, to print.
export const fetchStatement = async (folioId) => {
  const response = await http.get(`/api/accounting/receivables/statement/${folioId}`);
  return response.data;
};

// Deposits: every bit of reservation credit held, by where its stay is.
export const fetchDepositLedger = async () => {
  const response = await http.get(`/api/accounting/deposits`);
  return response.data;
};

// Receipts: numbers used twice, numbers missing from a run, money taken without one.
export const fetchReceiptsAudit = async (from, to) => {
  const response = await http.get(`/api/accounting/receipts`, { params: { from, to } });
  return response.data;
};

// Flash report: a business day, the month and the year to it, against last year.
export const fetchFlashReport = async (date) => {
  const response = await http.get(`/api/accounting/flash`, { params: { date } });
  return response.data;
};

export const downloadFlashReport = (date) => pmsDownload("/api/accounting/flash/export", { date }, `flash_report_${date}.xlsx`);

// Balance check: what guests owe less the credit they hold, day by day, against the folios' own figures.
export const fetchBalanceCheck = async (from, to) => {
  const response = await http.get(`/api/accounting/balance`, { params: { from, to } });
  return response.data;
};

// Tax & Service: service charge on food and drink, and tax typed on charges, by day and type.
export const fetchTaxAndService = async (from, to) => {
  const response = await http.get(`/api/accounting/tax-service`, { params: { from, to } });
  return response.data;
};
