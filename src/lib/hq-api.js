import { getHqToken, getHqAuthHeaders, getHqRefreshToken, storeHqSession, clearHqSession } from "@/utils/hq-auth";

// Plain fetch, not axios — this repo has no axios dependency, unlike the
// hotel-frontends' admin panels this otherwise mirrors in spirit.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

class HqApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let refreshPromise = null;

async function refreshHqSession() {
  const refreshToken = getHqRefreshToken();
  if (!refreshToken) return false;
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json();
        storeHqSession(data);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Core request helper — attaches the stored HQ token, retries once after a
// silent refresh on a 401 (same "don't force a re-login every 30 minutes"
// reasoning as the backend's refresh-token support existing at all), and
// throws HqApiError (with .status/.data) on any non-2xx response so callers
// can read err.data.message the same way the hotel-frontends read
// err.response.data.message from axios.
async function hqRequest(path, { method = "GET", body, skipAuth = false, _retried = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (!skipAuth) Object.assign(headers, getHqAuthHeaders());

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuth && !_retried) {
    const refreshed = await refreshHqSession();
    if (refreshed) {
      return hqRequest(path, { method, body, skipAuth, _retried: true });
    }
    clearHqSession();
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new HqApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

export async function hqLogin(username, password) {
  const data = await hqRequest("/api/users/hq-login", {
    method: "POST",
    body: { username, password },
    skipAuth: true,
  });
  storeHqSession(data);
  return data;
}

// Deliberately NOT hqRequest — that helper silently refreshes on a 401,
// which is exactly what must NOT happen here. AdminShell calls this on
// every protected-route mount to decide whether the session is still
// good, the same way the hotel-frontends' ProtectedRoute calls their own
// verify() with the raw access token: an expired token means a real
// re-login, not a free 7-day extension just because the tab was reopened.
export async function verifyHqSession() {
  const token = getHqToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/hq-verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchBranches() {
  return hqRequest("/api/branches");
}

export async function fetchHqStaff(branchId) {
  return hqRequest(`/api/hq/staff?branch_id=${branchId}`);
}

export async function createHqStaff(payload) {
  return hqRequest("/api/hq/staff", { method: "POST", body: payload });
}

export async function updateHqStaff(id, payload) {
  return hqRequest(`/api/hq/staff/${id}`, { method: "PATCH", body: payload });
}

export async function deactivateHqStaff(id) {
  return hqRequest(`/api/hq/staff/${id}/deactivate`, { method: "POST" });
}

export async function reactivateHqStaff(id) {
  return hqRequest(`/api/hq/staff/${id}/reactivate`, { method: "POST" });
}

export async function transferHqStaff(id, newBranchId) {
  return hqRequest(`/api/hq/staff/${id}/transfer`, { method: "POST", body: { new_branch_id: newBranchId } });
}

export async function hqChangePassword(currentPassword, newPassword) {
  return hqRequest("/api/users/hq-change-password", {
    method: "PATCH",
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

export async function fetchHqAuditLogs(branchId, params = {}) {
  const query = new URLSearchParams({ branch_id: branchId });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  return hqRequest(`/api/hq/audit-logs?${query.toString()}`);
}

export async function fetchHqAuditStaffOptions(branchId) {
  return hqRequest(`/api/hq/audit-logs/staff?branch_id=${branchId}`);
}

export { HqApiError };
