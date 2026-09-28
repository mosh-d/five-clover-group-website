import { pmsRequest } from "./client";

// The backend calls the PMS pages make, grouped by area. Every one of them
// is scoped to the signed-in branch by the session's token - no page passes
// a branch id.

export const frontOffice = {
  // Also the server's clock, which the shell anchors every date to.
  businessDate: () => pmsRequest("/api/front-office/business-date"),
  checkInList: (date) => pmsRequest("/api/front-office/check-in-list", { query: { date } }),
  checkOutList: (date) => pmsRequest("/api/front-office/check-out-list", { query: { date } }),
  // params.with_sales ("fnb" | "laundry"): only guests who bought there.
  inHouse: (params) => pmsRequest("/api/front-office/in-house", { query: params }),
};

export const rooms = {
  houseStatus: () => pmsRequest("/api/rooms/house-status"),
  status: () => pmsRequest("/api/rooms/status"),
};

export const reservations = {
  list: (params) => pmsRequest("/api/reservations", { query: params }),
  checkOut: (id) => pmsRequest(`/api/reservations/${id}/check-out`, { method: "POST", body: {} }),
  markNoShow: (id) => pmsRequest(`/api/reservations/${id}/no-show`, { method: "POST", body: {} }),
  // Pulls a stay's booked check-out back to the night the guest is actually
  // leaving on (worked out by the server), so the checkout bills only the
  // nights slept.
  shortenToDeparture: (id) => pmsRequest(`/api/reservations/${id}/shorten-to-departure`, { method: "POST", body: {} }),
};

export const folios = {
  list: (params) => pmsRequest("/api/folios", { query: params }),
};

export const alerts = {
  list: () => pmsRequest("/api/alerts"),
};

export const reports = {
  dashboard: (from, to) => pmsRequest("/api/reports/dashboard", { query: { from, to } }),
};

export const nightAudit = {
  history: (params) => pmsRequest("/api/night-audit/history", { query: params }),
  // Refused for a date already audited.
  run: (auditDate) => pmsRequest("/api/night-audit/run", { method: "POST", body: { audit_date: auditDate } }),
};

// Whose shift the business day is, per rota ("receptionist" = front desk,
// "waitron" = F&B). staff_account_id is null until someone records it,
// which is what locks that rota (see ShiftGate). Recording it names who is
// on duty - your own name or a colleague's - and goes to the audit trail.
export const shifts = {
  current: (role) => pmsRequest("/api/shifts/current", { query: { role } }),
  record: (role, staffAccountId) =>
    pmsRequest("/api/shifts/current", { method: "POST", body: { role, staff_account_id: Number(staffAccountId) } }),
};

export const staffAccounts = {
  list: (role) => pmsRequest("/api/staff-accounts", { query: { role } }),
};

// Nights an OTA pays for instead of the guest. status: "pending" | "paid".
export const otaSettlements = {
  list: (status) => pmsRequest("/api/ota-settlements", { query: { status } }),
  // Records the OTA's money against the folio (method OTA).
  markPaid: (id, reference) =>
    pmsRequest(`/api/ota-settlements/${id}/paid`, { method: "POST", body: reference ? { reference } : {} }),
};

// The signed-in person's own account.
export const account = {
  changePassword: (currentPassword, newPassword) =>
    pmsRequest("/api/users/change-password", {
      method: "PATCH",
      body: { current_password: currentPassword, new_password: newPassword },
    }),
};

export const branches = {
  // Whether this branch is closed for maintenance (the branch PMS covers
  // itself with a notice while it is).
  maintenanceMode: (branchId) =>
    pmsRequest("/api/branches/maintenance-mode", { method: "POST", body: { branch_id: branchId }, auth: false }),
};
