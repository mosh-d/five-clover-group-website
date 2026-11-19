// Bookings awaiting dates (backend phase-100): money taken before the guest
// knows when they will stay. The money itself goes through the deposit
// routes (folios-api: recordDeposit, fetchDeposits, refundDeposit).
import { http } from "../http";

// [{ id, booking_reference, guest_name, phone_number, guest_email, room_type_id, room_type_name, rooms_booked, note, created_at, credit_held, paid }]
export const fetchAwaitingDates = async () => (await http.get(`/api/awaiting-dates`)).data;

// { guest_name, phone_number, guest_email?, room_type_id?, rooms_booked?, note? } -> { id, booking_reference, guest_name }
export const createAwaitingDates = async (payload) => (await http.post(`/api/awaiting-dates`, payload)).data;

// The real booking was made: move the money and notes to it.
export const markAwaitingDated = async (id, reservationId) => (await http.post(`/api/awaiting-dates/${id}/dated`, { reservation_id: reservationId })).data;

export const cancelAwaitingDates = async (id) => (await http.post(`/api/awaiting-dates/${id}/cancel`, {})).data;
