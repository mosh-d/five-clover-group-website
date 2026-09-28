// Carried over from the branch PMS's utils/folios-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
export const fetchFolios = async (params = {}) => {
  const response = await http.get(`/api/folios`, {
    params,
  });
  return response.data;
};

// params.with_sales ("fnb" | "laundry"): only bills with that kind of sale on them.
export const fetchPendingFolios = async (params) => {
  const response = await http.get(`/api/folios/pending`, {
    params,
  });
  return response.data;
};

export const fetchOverdueFolios = async () => {
  const response = await http.get(`/api/folios/overdue`);
  return response.data;
};

export const fetchFolioById = async (id) => {
  const response = await http.get(`/api/folios/${id}`);
  return response.data;
};

export const addFolioItem = async (id, payload) => {
  const response = await http.post(`/api/folios/${id}/items`, payload);
  return response.data;
};

// Posts a whole order (Guest Sales) as one atomic batch — payload is
// { items: [...], bill_no? } — instead of one addFolioItem call per line.
export const addFolioItemsBatch = async (id, payload) => {
  const response = await http.post(`/api/folios/${id}/items/batch`, payload);
  return response.data;
};

export const closeFolio = async (id) => {
  const response = await http.put(
    `/api/folios/${id}/close`,
    {},
  );
  return response.data;
};

export const createFolio = async (payload) => {
  const response = await http.post(`/api/folios`, payload);
  return response.data;
};

export const recordPayment = async (payload) => {
  const response = await http.post(`/api/payments`, payload);
  return response.data;
};

export const recordRefund = async (payload) => {
  const response = await http.post(`/api/payments/refund`, payload);
  return response.data;
};

export const recordDeposit = async (payload) => {
  const response = await http.post(`/api/deposits`, payload);
  return response.data;
};

export const fetchDeposits = async (params = {}) => {
  const response = await http.get(`/api/deposits`, {
    params,
  });
  return response.data;
};

// Moving an unspent credit to a DIFFERENT booking: the same guest under a
// different phone number, so their two stays never matched to one account and
// the automatic same-guest rule (see applyDeposit) rightly refuses. The credit
// moves and settles whatever is owed on the booking it lands on.
export const transferDepositCredit = async (id, targetReservationId) => {
  const response = await http.post(
    `/api/deposits/${id}/transfer`,
    { target_reservation_id: Number(targetReservationId) },
  );
  return response.data;
};

export const applyDeposit = async (id, targetReservationId) => {
  const response = await http.post(
    `/api/deposits/${id}/apply`,
    targetReservationId ? { target_reservation_id: targetReservationId } : {},
  );
  return response.data;
};

// Pending deposits left over from any of this guest's *other* reservations —
// "credit from a previous stay" they can reclaim on this one.
export const fetchGuestCredit = async (guestId) => {
  const response = await http.get(`/api/deposits/guest-credit`, {
    params: { guest_id: guestId },
  });
  return response.data;
};

// refundMethod: how the money was paid out (cash, transfer, ...) - required
// by the server since 2026-09-28, so reports can take it off that tender.
export const refundDeposit = async (id, refundMethod) => {
  const response = await http.post(`/api/deposits/${id}/refund`, { refund_method: refundMethod });
  return response.data;
};
