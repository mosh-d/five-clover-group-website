// Carried over from the branch PMS's utils/front-office-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
export const fetchCheckInList = async (date) => {
  const response = await http.get(`/api/front-office/check-in-list`, {
    params: date ? { date } : {},
  });
  return response.data;
};

export const fetchCheckOutList = async (date) => {
  const response = await http.get(`/api/front-office/check-out-list`, {
    params: date ? { date } : {},
  });
  return response.data;
};

// params.with_sales ("fnb" | "laundry"): only guests who bought that kind of
// thing - the Guest Sales lists. Without it, every in-house guest.
export const fetchInHouse = async (params) => {
  const response = await http.get(`/api/front-office/in-house`, {
    params,
  });
  return response.data;
};

export const fetchInHouseById = async (id) => {
  const response = await http.get(`/api/front-office/in-house/${id}`);
  return response.data;
};

// What day the SERVER thinks it is — both the Lagos calendar date and the
// 6am-to-6am business date. The admin panel anchors its own date helpers to
// this at load (see date-utils.js's applyServerClock) so a front-desk PC
// with a wrong clock stops silently showing the wrong day's data.
export const fetchBusinessDate = async () => {
  const response = await http.get(`/api/front-office/business-date`);
  return response.data;
};
