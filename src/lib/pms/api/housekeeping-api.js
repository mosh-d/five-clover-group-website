// Housekeeping (backend docs/HOUSEKEEPING-PLAN.md).
import { http } from "../http";

// Whether this branch runs housekeeping, and how rooms are given out.
export const fetchHousekeepingSettings = async () => {
  const response = await http.get(`/api/housekeeping/settings`);
  return response.data;
};

// The developer's switch for this branch.
export const switchHousekeeping = async (on) => {
  const response = await http.patch(`/api/housekeeping/settings`, { on });
  return response.data;
};

// Every room by state (the supervisor and the manager), or a housekeeper's own rooms.
export const fetchHousekeepingBoard = async () => {
  const response = await http.get(`/api/housekeeping/board`);
  return response.data;
};

// The sidebar badge.
export const fetchHousekeepingCounts = async () => {
  const response = await http.get(`/api/housekeeping/counts`);
  return response.data;
};

// Open (any housekeeper takes any room) or Assigned (the supervisor gives each out).
export const setHousekeepingMode = async (mode) => {
  const response = await http.patch(`/api/housekeeping/mode`, { mode });
  return response.data;
};

export const startCleaning = async (jobId) => {
  const response = await http.post(`/api/housekeeping/jobs/${jobId}/start`);
  return response.data;
};

export const submitForReview = async (jobId, note) => {
  const response = await http.post(`/api/housekeeping/jobs/${jobId}/submit`, { note: note || undefined });
  return response.data;
};

// outcome: "approve" or "send_back" (a note is required to send back).
export const reviewRoom = async (jobId, outcome, note) => {
  const response = await http.post(`/api/housekeeping/jobs/${jobId}/review`, { outcome, note: note || undefined });
  return response.data;
};

// staffId null takes the room back.
export const giveRoomTo = async (jobId, staffId) => {
  const response = await http.post(`/api/housekeeping/jobs/${jobId}/assign`, { staff_id: staffId ?? null });
  return response.data;
};

export const markRoomForCleaning = async (roomInventoryId, note) => {
  const response = await http.post(`/api/housekeeping/rooms/${roomInventoryId}/dirty`, { note });
  return response.data;
};
