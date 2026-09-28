// Carried over from the branch PMS's utils/staff-accounts-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
// Active staff accounts for the current branch — id/username/role only.
// Feeds the Reports page's "Shift" dropdown. role is optional (omit for
// the original receptionist roster, or pass "waitron" for the Food/Drink
// Sales/Bar Stock tabs' own shift picker) — allowlisted server-side.
export const fetchStaffAccounts = async (role) => {
  const response = await http.get(`/api/staff-accounts`, {
    params: role ? { role } : undefined,
  });
  return response.data;
};
