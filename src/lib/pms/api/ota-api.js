// Carried over from the branch PMS's utils/ota-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";

// Tells the sidebar's OTA Payments badge to recount (PmsLive) once this PC
// records, adjusts or settles one - the server sends no live event for them.
export const OTA_CHANGED_EVENT = "pms:ota-changed";
const announced = (data) => {
  window.dispatchEvent(new Event(OTA_CHANGED_EVENT));
  return data;
};
// Nights an OTA is paying for instead of the guest. They stay charged on the
// folio — so it reads owing until the money lands — but they are left out of
// what the desk asks the guest for (the folio's guest_due).
export const fetchOtaSettlements = async (status) => {
  const response = await http.get(`/api/ota-settlements`, {
    params: status ? { status } : undefined,
  });
  return response.data;
};

// What those nights are worth before anyone edits the figure down to the
// OTA's net-of-commission remittance.
export const previewOtaAmount = async ({ reservationId, startDate, endDate, includesBreakfast }) => {
  const response = await http.get(`/api/ota-settlements/preview`, {
    params: {
      reservation_id: reservationId,
      start_date: startDate,
      end_date: endDate,
      includes_breakfast: includesBreakfast ? "true" : "false",
    },
  });
  return response.data;
};

export const createOtaSettlement = async ({ reservationId, startDate, endDate, includesBreakfast, amount, reference }) => {
  const response = await http.post(
    `/api/ota-settlements`,
    {
      reservation_id: reservationId,
      start_date: startDate,
      end_date: endDate,
      includes_breakfast: Boolean(includesBreakfast),
      ...(amount ? { amount: Number(amount) } : {}),
      ...(reference ? { reference } : {}),
    },
  );
  return announced(response.data);
};

// The OTA's money arrived. The payment lands on the folio with method "ota"
// automatically — nobody picks it — so it settles and reports like any other
// money taken.
// Correcting the nights before the OTA pays for them — the range was keyed
// in wrong, or the guest's dates moved. Leave the amount out and the backend
// re-quotes it from the new nights; send one to keep the OTA's own figure.
export const updateOtaSettlement = async (id, { startDate, endDate, includesBreakfast, amount, reference }) => {
  const response = await http.patch(
    `/api/ota-settlements/${id}`,
    {
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
      includes_breakfast: Boolean(includesBreakfast),
      ...(amount ? { amount: Number(amount) } : {}),
      ...(reference ? { reference } : {}),
    },
  );
  return announced(response.data);
};

// amountReceived: what actually arrived, when the OTA kept its commission -
// left out, the expected amount.
export const markOtaSettlementPaid = async (id, reference, amountReceived) => {
  const response = await http.post(`/api/ota-settlements/${id}/paid`, {
    ...(reference ? { reference } : {}),
    ...(amountReceived !== undefined && amountReceived !== null && amountReceived !== "" ? { amount_received: Number(amountReceived) } : {}),
  });
  return announced(response.data);
};
