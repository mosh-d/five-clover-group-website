// Head Office's calls (2026-10-01: Head Office moved into the PMS from its
// own admin at /hq, and with it these, from lib/hq-api.js). Through the PMS
// session like every other call (pmsRequest): its token, renewal while
// someone is working, the "session has ended" prompt, and refusals as a
// PmsApiError carrying the server's own words.
import { pmsRequest } from "../client";
import { http } from "../http";

// Changes go through http, which plays the success and failure sounds, as
// every branch page's do (2026-11-12: Head Office was silent). Reads stay
// on pmsRequest.
const change = async (method, url, body) => (await http[method](url, body)).data;

export const fetchBranches = () => pmsRequest("/api/branches");

// Web Analytics (backend phase-96): one page of website bookings with the
// range's totals, and every booking in the range for the CSV.
export const fetchWebBookings = (query) => pmsRequest("/api/hq/web-analytics/bookings", { query });
export const fetchWebBookingsExport = (query) => pmsRequest("/api/hq/web-analytics/bookings/export", { query });

export const fetchHqStaff = (branchId) => pmsRequest("/api/hq/staff", { query: { branch_id: branchId } });
export const createHqStaff = (payload) => change("post", "/api/hq/staff", payload);
export const updateHqStaff = (id, payload) => change("patch", `/api/hq/staff/${id}`, payload);
export const deactivateHqStaff = (id) => change("post", `/api/hq/staff/${id}/deactivate`, {});
export const reactivateHqStaff = (id) => change("post", `/api/hq/staff/${id}/reactivate`, {});
export const transferHqStaff = (id, newBranchId) => change("post", `/api/hq/staff/${id}/transfer`, { new_branch_id: newBranchId });

// Any branch's audit trail, or Head Office's own (branch_id "head_office").
export const fetchHqAuditLogs = (branchId, params = {}) => pmsRequest("/api/hq/audit-logs", { query: { branch_id: branchId, ...params } });
export const fetchHqAuditStaffOptions = (branchId) => pmsRequest("/api/hq/audit-logs/staff", { query: { branch_id: branchId } });
export const fetchHqAuditActionLabels = () => pmsRequest("/api/hq/audit-logs/actions");

// Critical (2026-10-01): every room out of order, at every branch.
export const fetchOutOfOrderRooms = () => pmsRequest("/api/hq/critical/out-of-order-rooms");
// Decision Support: the same rooms, ranked by the bookings they may have cost.
export const fetchOutOfOrderRanking = () => pmsRequest("/api/hq/decision-support/out-of-order-rooms");

// Metrics: one metric, every branch side by side.
export const fetchHqMetric = (metric, params = {}) => pmsRequest(`/api/hq/metrics/${encodeURIComponent(metric)}`, { query: params });
