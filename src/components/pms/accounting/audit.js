// The Audit Trail link a row of the Accounting page carries - who did it,
// whose stay or bill it was, and the business days it covers - opened by the
// same "View log" the reports use (AuditLink in reportUi.jsx; owner,
// 2026-10-09: every table on this page has one, as the reports do).
export const auditFor = ({ staffId = null, search = null, from = null, to = null } = {}) => ({
  staff_account_id: staffId || null,
  search: search || null,
  from: from || null,
  to: to || from || null,
});

// The business day an instant falls in: 6am to 6am Lagos (UTC+1), so five
// hours behind UTC.
export const businessDayOf = (instant) => (instant ? new Date(new Date(instant).getTime() - 5 * 3600 * 1000).toISOString().slice(0, 10) : null);
