// Carried over from the branch PMS's utils/non-guest-folios-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
export const fetchNonGuestFolios = async (params = {}) => {
  const response = await http.get(`/api/non-guest-folios`, {
    params,
  });
  return response.data;
};

export const fetchNonGuestFolioById = async (id) => {
  const response = await http.get(`/api/non-guest-folios/${id}`);
  return response.data;
};

export const createNonGuestFolio = async (payload) => {
  const response = await http.post(`/api/non-guest-folios`, payload);
  return response.data;
};

export const addNonGuestFolioItem = async (id, payload) => {
  const response = await http.post(`/api/non-guest-folios/${id}/items`, payload);
  return response.data;
};

// Adds/changes a folio's guest_name/guest_phone at any point in its life —
// typically once it's clear the folio needs to be traced back to a real
// person (an unpaid balance, or a credit from an overpayment).
export const updateNonGuestFolioGuestInfo = async (id, payload) => {
  const response = await http.put(`/api/non-guest-folios/${id}/guest-info`, payload);
  return response.data;
};

export const closeNonGuestFolio = async (id) => {
  const response = await http.put(
    `/api/non-guest-folios/${id}/close`,
    {},
  );
  return response.data;
};

export const recordNonGuestPayment = async (payload) => {
  const response = await http.post(`/api/non-guest-payments`, payload);
  return response.data;
};

// Bare call: all pending credit at the branch ("Unclaimed Credit"). With
// guestName: that guest's pending credit only — what the new-folio form's
// live lookup uses to show a "credit from a previous visit" banner.
export const fetchNonGuestCredits = async (guestName) => {
  const response = await http.get(`/api/non-guest-credits`, {
    params: guestName ? { guest_name: guestName } : {},
  });
  return response.data;
};

// Every credit still on file at the branch, whoever it belongs to — what
// the Unclaimed Credit panel lists, and what lets an overpayment be applied
// back to the bill it came off even when that sale was rung up without a
// name. Kept separate from fetchNonGuestCredits' name lookup rather than
// widening it: the two answer different questions.
export const fetchPendingNonGuestCredits = async () => {
  const response = await http.get(`/api/non-guest-credits`, {
    params: { status: "pending" },
  });
  return response.data;
};

// Paying a non-guest credit back out (2026-09-28), with how the money left.
export const refundNonGuestCredit = async (id, refundMethod) => {
  const response = await http.post(
    `/api/non-guest-credits/${id}/refund`,
    { refund_method: refundMethod },
  );
  return response.data;
};

export const applyNonGuestCredit = async (id, targetNonGuestFolioId) => {
  const response = await http.post(
    `/api/non-guest-credits/${id}/apply`,
    { target_non_guest_folio_id: targetNonGuestFolioId },
  );
  return response.data;
};

