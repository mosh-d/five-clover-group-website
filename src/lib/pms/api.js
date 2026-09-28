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
};

export const alerts = {
  list: () => pmsRequest("/api/alerts"),
};

export const reports = {
  dashboard: (from, to) => pmsRequest("/api/reports/dashboard", { query: { from, to } }),
};

export const nightAudit = {
  history: (params) => pmsRequest("/api/night-audit/history", { query: params }),
};

export const branches = {
  // Whether this branch is closed for maintenance (the branch PMS covers
  // itself with a notice while it is).
  maintenanceMode: (branchId) =>
    pmsRequest("/api/branches/maintenance-mode", { method: "POST", body: { branch_id: branchId }, auth: false }),
};
