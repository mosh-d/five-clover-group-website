// Carried over from the branch PMS's utils/shifts-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
// Whose shift the current business day (6am to 6am) is, for one rota:
// "receptionist" (front desk) or "waitron" (F&B). staff_account_id comes back
// null until someone records it, which is what locks that rota's pages (see
// ShiftGate).
export const fetchCurrentShift = async (role) => {
  const response = await http.get(`/api/shifts/current`, {
    params: { role },
  });
  return response.data;
};

// Records it. Whoever is on the floor may name a colleague — staff resume
// around 8am while the business day starts at 6am — and every selection is
// written to the audit trail server-side. A receptionist can only record the
// front desk and a waitron only F&B; the server enforces that.
export const selectCurrentShift = async (role, staffAccountId) => {
  const response = await http.post(
    `/api/shifts/current`,
    { role, staff_account_id: Number(staffAccountId) },
  );
  return response.data;
};
