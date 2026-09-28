// Carried over from the branch PMS's utils/room-data.js (2026-09-28): the
// branch's rooms, contact details and maintenance flag. These are the
// public-site endpoints, keyed by branch id - the signed-in branch here,
// where the branch PMS hard-codes its site's BRANCH_ID.
import { http } from "../http";
import { currentBranchId } from "../session";

export const fetchRoomDetails = async (checkIn, checkOut) => {
  const response = await http.post(`/api/rooms/details`, {
    branch_id: currentBranchId(),
    ...(checkIn && checkOut ? { check_in_date: checkIn, check_out_date: checkOut } : {}),
  });
  return response.data;
};

export const fetchBranchContact = async () => {
  const response = await http.post(`/api/branches/contact`, { branch_id: currentBranchId() });
  return response.data;
};

export const fetchMaintenanceMode = async () => {
  const response = await http.post(`/api/branches/maintenance-mode`, { branch_id: currentBranchId() });
  return response.data;
};
