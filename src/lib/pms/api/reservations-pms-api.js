// Carried over from the branch PMS's utils/reservations-pms-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
import { pmsDownload as downloadFile } from "../client";
export const fetchReservations = async (params = {}) => {
  const response = await http.get(`/api/reservations`, {
    params,
  });
  return response.data;
};

export const fetchReservationById = async (id) => {
  const response = await http.get(`/api/reservations/${id}`);
  return response.data;
};

export const updateReservation = async (id, payload) => {
  const response = await http.put(`/api/reservations/${id}`, payload);
  return response.data;
};

export const fetchReservationNotes = async (id) => {
  const response = await http.get(`/api/reservations/${id}/notes`);
  return response.data;
};

export const addReservationNote = async (id, note) => {
  const response = await http.post(`/api/reservations/${id}/notes`, { note });
  return response.data;
};

export const deleteReservationNote = async (id, noteId) => {
  const response = await http.delete(`/api/reservations/${id}/notes/${noteId}`);
  return response.data;
};

export const cancelReservationById = async (id, reason) => {
  const response = await http.post(
    `/api/reservations/${id}/cancel`,
    { reason },
  );
  return response.data;
};

export const markNoShow = async (id) => {
  const response = await http.post(
    `/api/reservations/${id}/no-show`,
    {},
  );
  return response.data;
};

export const undoNoShow = async (id) => {
  const response = await http.post(
    `/api/reservations/${id}/undo-no-show`,
    {},
  );
  return response.data;
};

export const undoExpiredHold = async (id) => {
  const response = await http.post(
    `/api/reservations/${id}/undo-expired-hold`,
    {},
  );
  return response.data;
};

// Public — used by the guest-facing booking flow, which has no staff
// session. Kept for that caller; staff-initiated confirms use
// confirmReservationById below instead, so they get audit attribution.
// Staff-initiated confirmation (Admin Bookings, Admin Reservations, walk-in
// check-in) — guarded, so the resulting audit_logs entry is attributed to
// the staff member who confirmed it.
export const confirmReservationById = async (id) => {
  const response = await http.post(
    `/api/reservations/${id}/confirm`,
    {},
  );
  return response.data;
};

export const emergencyCheckout = async (reservation_id) => {
  const response = await http.post(
    `/api/reservations/emergency-checkout`,
    { reservation_id },
  );
  return response.data;
};

// Through downloadFile, not a URL navigation - see utils/download.js.
export const exportReservations = ({ branchId, statuses = [], startDate, endDate }) =>
  downloadFile(
    "/api/bookings/export",
    {
      branch_id: branchId,
      ...(statuses.length > 0 && { status: statuses.join(",") }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    },
    `reservations_${startDate || "all"}_to_${endDate || "all"}.csv`,
  );

export const checkAvailability = async (branchId, startDate, endDate) => {
  const response = await http.post(`/api/reservations/availability`, {
    branch_id: branchId,
    start_date: startDate,
    end_date: endDate,
  });
  return response.data;
};

// Read-only tape-chart data — one row per numbered physical room, plus an
// "unassigned" bucket per room type for bookings without a specific room yet.
export const fetchRoomChart = async (startDate, endDate) => {
  const response = await http.get(`/api/rooms/chart`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
};

export const fetchRoomStatusList = async () => {
  const response = await http.get(`/api/rooms/status`);
  return response.data;
};

export const fetchHouseStatus = async () => {
  const response = await http.get(`/api/rooms/house-status`);
  return response.data;
};

// Sets a physical room's manual status flag — 'complementary' is what
// excludes it from the room charge posted at check-in/night-audit (see
// ReservationsService.postStayChargesForDay's billableRooms). id is the
// room_inventory row's own id (from fetchAvailableRoomNumbers' `available`
// list), not the room number string.
export const updateRoomStatus = async (roomInventoryId, status) => {
  const response = await http.patch(
    `/api/rooms/inventory/${roomInventoryId}/status`,
    { status },
  );
  return response.data;
};

export const createAdminReservation = async (payload) => {
  const response = await http.post(`/api/reservations`, payload);
  return response.data;
};

// Pulls a checked-in stay's check_out back to the night the guest is
// actually leaving on, for an early departure. No date is sent — the server
// works it out, so the business-day arithmetic has exactly one home (see
// ReservationsService.requiredCheckOutForDepartureNow).
export const shortenStayToDeparture = async (id) => {
  const response = await http.post(`/api/reservations/${id}/shorten-to-departure`, {});
  return response.data;
};

// Phase 2: check-in/check-out operations
export const checkInReservation = async (id) => {
  const response = await http.post(`/api/reservations/${id}/check-in`, {});
  return response.data;
};

export const assignRoom = async (id, roomNumbers) => {
  const response = await http.post(
    `/api/reservations/${id}/assign-room`,
    { room_numbers: roomNumbers },
  );
  return response.data;
};

// Real, numbered rooms of the reservation's own type that aren't occupied
// right now or promised to an overlapping stay — for the check-in room picker.
export const fetchAvailableRoomsForReservation = async (id) => {
  const response = await http.get(`/api/reservations/${id}/available-rooms`);
  return response.data;
};

// Same, but before a reservation exists yet (walk-in flow) — pass the room
// type and stay dates directly.
export const fetchAvailableRoomNumbers = async ({ roomTypeId, checkIn, checkOut }) => {
  const response = await http.get(`/api/reservations/available-rooms`, {
    params: { room_type_id: roomTypeId, check_in: checkIn, check_out: checkOut },
  });
  return response.data;
};

// Moves a reservation to a different room type — hold, confirmed, or
// already checked in. The backend recomputes total_rate from the new
// type's own rate (every night already billed stays untouched and
// correctly attributed to the old type in reports; every night still to
// come, including tonight's if not yet posted, bills at the new rate) and
// reassigns the physical room.
export const changeRoomType = async (id, payload) => {
  const response = await http.post(
    `/api/reservations/${id}/change-room-type`,
    payload,
  );
  return response.data;
};

export const checkOutReservation = async (id) => {
  const response = await http.post(`/api/reservations/${id}/check-out`, {});
  return response.data;
};

// Moves a not-yet-arrived stay's dates; availability, assigned rooms, the
// room hold and the price all move with it server-side (changeDates).
export const changeReservationDates = async (id, dates) => {
  const response = await http.post(
    `/api/reservations/${id}/change-dates`,
    dates,
  );
  return response.data;
};

export const extendStay = async (id, newCheckOut) => {
  const response = await http.post(
    `/api/reservations/${id}/extend-stay`,
    { new_check_out: newCheckOut },
  );
  return response.data;
};
