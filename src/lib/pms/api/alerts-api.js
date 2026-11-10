// Carried over from the branch PMS's utils/alerts-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
export const fetchAlerts = async () => {
  const response = await http.get(`/api/alerts`);
  return response.data;
};

// The accountant asks the front desk to deal with an alert: { kind, id, note }.
export const nudgeFrontDesk = async (body) => (await http.post(`/api/alerts/nudge`, body)).data;
