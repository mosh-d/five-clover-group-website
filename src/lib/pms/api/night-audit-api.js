// Carried over from the branch PMS's utils/night-audit-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
export const runNightAudit = async (audit_date) => {
  const response = await http.post(
    `/api/night-audit/run`,
    { audit_date },
  );
  return response.data;
};

export const fetchNightAuditHistory = async (params = {}) => {
  const response = await http.get(`/api/night-audit/history`, {
    params,
  });
  return response.data;
};
