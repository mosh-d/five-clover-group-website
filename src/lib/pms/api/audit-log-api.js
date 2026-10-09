// Carried over from the branch PMS's utils/audit-log-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
export const fetchAuditLogHistory = async (params = {}) => {
  const response = await http.get(`/api/audit-logs/history`, {
    params,
  });
  return response.data;
};

// Every action code the server records and its name, for the action filter
// (2026-09-28) - one list, kept with the code that records the actions.
export const fetchAuditActionLabels = async () => {
  const response = await http.get(`/api/audit-logs/actions`);
  return response.data;
};

// The entry behind one folio line - "charge" or "payment" - as { id, day },
// or { id: null } when the line is older than the trail.
export const fetchAuditEntryForLine = async (type, id) => {
  const response = await http.get(`/api/audit-logs/for-line`, { params: { type, id } });
  return response.data;
};

// Distinct staff who have at least one logged action for this branch —
// feeds the Audit Trail page's staff filter dropdown.
export const fetchAuditStaffOptions = async () => {
  const response = await http.get(`/api/audit-logs/staff`);
  return response.data;
};
