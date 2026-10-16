// Housekeeping (backend docs/HOUSEKEEPING-PLAN.md).
import { http } from "../http";

// Whether this branch runs housekeeping.
export const fetchHousekeepingSettings = async () => {
  const response = await http.get(`/api/housekeeping/settings`);
  return response.data;
};

// The developer's switch for this branch.
export const switchHousekeeping = async (on) => {
  const response = await http.patch(`/api/housekeeping/settings`, { on });
  return response.data;
};
