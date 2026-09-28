// Carried over from the branch PMS's utils/guests-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
export const checkGuestBlacklist = async ({ email, phone } = {}) => {
  const response = await http.get(`/api/guests/blacklist-check`, {
    params: { email, phone },
  });
  return response.data;
};

export const fetchGuests = async (params = {}) => {
  const response = await http.get(`/api/guests`, {
    params,
  });
  return response.data;
};

export const fetchGuestReservations = async (id) => {
  const response = await http.get(`/api/guests/${id}/reservations`);
  return response.data;
};

export const createGuest = async (payload) => {
  const response = await http.post(`/api/guests`, payload);
  return response.data;
};

export const updateGuest = async (id, payload) => {
  const response = await http.put(`/api/guests/${id}`, payload);
  return response.data;
};

// Account-standing/financial fields (is_blacklisted, blacklist_reason,
// loyalty_points, total_revenue, total_stays) — manager-only on the backend.
export const updateGuestStatus = async (id, payload) => {
  const response = await http.patch(`/api/guests/${id}/status`, payload);
  return response.data;
};

export const fetchGuestNotes = async (id) => {
  const response = await http.get(`/api/guests/${id}/notes`);
  return response.data;
};

export const addGuestNote = async (id, note) => {
  const response = await http.post(`/api/guests/${id}/notes`, { note });
  return response.data;
};

export const deleteGuestNote = async (id, noteId) => {
  const response = await http.delete(`/api/guests/${id}/notes/${noteId}`);
  return response.data;
};
