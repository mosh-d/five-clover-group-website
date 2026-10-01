// Head Office's calls (2026-10-01: Head Office moved into the PMS from its
// own admin at /hq, and with it these, from lib/hq-api.js). Through the PMS
// session like every other call (pmsRequest): its token, renewal while
// someone is working, the "session has ended" prompt, and refusals as a
// PmsApiError carrying the server's own words.
import { pmsRequest } from "../client";

export const fetchBranches = () => pmsRequest("/api/branches");

export const fetchHqStaff = (branchId) => pmsRequest("/api/hq/staff", { query: { branch_id: branchId } });
export const createHqStaff = (payload) => pmsRequest("/api/hq/staff", { method: "POST", body: payload });
export const updateHqStaff = (id, payload) => pmsRequest(`/api/hq/staff/${id}`, { method: "PATCH", body: payload });
export const deactivateHqStaff = (id) => pmsRequest(`/api/hq/staff/${id}/deactivate`, { method: "POST", body: {} });
export const reactivateHqStaff = (id) => pmsRequest(`/api/hq/staff/${id}/reactivate`, { method: "POST", body: {} });
export const transferHqStaff = (id, newBranchId) =>
  pmsRequest(`/api/hq/staff/${id}/transfer`, { method: "POST", body: { new_branch_id: newBranchId } });

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
