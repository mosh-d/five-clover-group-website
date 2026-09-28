import { getPmsToken, getPmsRefreshToken, storePmsSession, clearPmsSession } from "./session";

// The PMS's one way to reach the backend. Plain fetch, as the HQ admin's
// client (lib/hq-api.js) is - this repo has no axios.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

// Fired when a session can't be renewed; the shell answers by returning to
// the sign-in page.
export const SESSION_ENDED_EVENT = "pms:session-ended";

export class PmsApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const withQuery = (path, query) => {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.append(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
};

// One refresh at a time, however many requests hit a 401 together.
let refreshing = null;
function renewSession() {
  const refreshToken = getPmsRefreshToken();
  if (!refreshToken) return Promise.resolve(false);
  if (!refreshing) {
    refreshing = fetch(`${API_BASE_URL}/api/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        storePmsSession(await res.json());
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// Attaches the session's token, renews it once on a 401 (an access token
// lasts half an hour; the refresh token a week), and throws PmsApiError -
// with the server's own message - on anything but a 2xx.
export async function pmsRequest(path, { method = "GET", body, query, auth = true, _retried = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = auth ? getPmsToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${withQuery(path, query)}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !_retried) {
    if (await renewSession()) return pmsRequest(path, { method, body, query, auth, _retried: true });
    clearPmsSession();
    if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new PmsApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

// --- signing in and out ---

// Either signs in (the session is stored) or, for someone who may open more
// than one branch, returns { choose_branch: true, branches } to ask which.
export async function pmsSignIn(username, password, branchId) {
  const data = await pmsRequest("/api/users/pms-login", {
    method: "POST",
    body: { username, password, ...(branchId ? { branch_id: Number(branchId) } : {}) },
    auth: false,
  });
  if (!data.choose_branch) storePmsSession(data);
  return data;
}

// A developer's session, moved to another branch.
export async function pmsSwitchBranch(branchId) {
  const data = await pmsRequest("/api/users/pms-switch-branch", {
    method: "POST",
    body: { branch_id: Number(branchId), refresh_token: getPmsRefreshToken() || undefined },
  });
  storePmsSession(data);
  return data;
}

export async function pmsSignOut() {
  const refreshToken = getPmsRefreshToken();
  try {
    if (refreshToken) await pmsRequest("/api/users/logout", { method: "POST", body: { refresh_token: refreshToken }, auth: false });
  } finally {
    clearPmsSession();
  }
}

// Whether the stored access token itself is still good. Deliberately not
// pmsRequest: that would quietly renew it, and a tab reopened after days
// away should be asked to sign in again, not extended for another week -
// the same rule the branch PMS and the HQ admin follow.
export async function verifyPmsSession() {
  const token = getPmsToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/verify`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok;
  } catch {
    return false;
  }
}
