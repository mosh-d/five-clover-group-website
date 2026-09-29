import { getPmsToken, getPmsRefreshToken, storePmsSession, clearPmsSession, hasBeenIdleTooLong } from "./session";

// The PMS's one way to reach the backend. Plain fetch, as the HQ admin's
// client (lib/hq-api.js) is - this repo has no axios.
// Also where the live socket connects (see PmsLive).
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

// Fired when a session has ended for good mid-work - idle too long, or the
// server refused to renew it. The shell answers with the "session has ended"
// prompt rather than yanking the page away (see SessionEndedModal).
export const SESSION_ENDED_EVENT = "pms:session-ended";
const endSession = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
};

// Also shaped like an axios error (err.response.status / .data), which is
// how every page moved over from the branch PMS reads a refusal:
// err.response?.data?.message.
export class PmsApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.response = { status, data };
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

// A new access token from the refresh token (a week's life). One refresh at
// a time, however many requests hit a 401 together.
let refreshing = null;
export function renewSession() {
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

// Attaches the session's token and throws PmsApiError - with the server's
// own message - on anything but a 2xx. On a 401 the access token has lapsed
// (it lasts half an hour): someone still working gets it renewed and the
// request retried; a session left untouched for an hour ends instead
// (IDLE_LIMIT_MS).
export async function pmsRequest(path, { method = "GET", body, query, auth = true, _retried = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = auth ? getPmsToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${withQuery(path, query)}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // A 401 after a successful renewal is about the request itself, not the
  // session - "Current password is incorrect." on Account, say - so it is
  // shown as an ordinary error rather than ending the session.
  if (res.status === 401 && auth && !_retried) {
    if (!hasBeenIdleTooLong() && (await renewSession())) {
      return pmsRequest(path, { method, body, query, auth, _retried: true });
    }
    endSession();
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new PmsApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

// Downloads a file from a signed-in endpoint (the Excel and CSV exports).
// Through fetch with the session's token, not a link: a plain browser
// navigation can't send the Authorization header. A lapsed token is renewed
// once, the same as pmsRequest; a refusal comes back as a PmsApiError with
// the server's own reason.
export async function pmsDownload(path, params, filename) {
  const attempt = () =>
    fetch(`${API_BASE_URL}${withQuery(path, params)}`, { headers: { Authorization: `Bearer ${getPmsToken() || ""}` } });
  let res = await attempt();
  if (res.status === 401 && !hasBeenIdleTooLong() && (await renewSession())) res = await attempt();
  if (res.status === 401) endSession();
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new PmsApiError(data?.message || `Download failed (${res.status})`, res.status, data);
  }
  const url = window.URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
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

// Whether the stored session is still good, checked on arrival. A lapsed
// access token is renewed only for someone who was working in the last 30
// minutes; a tab reopened after a longer absence is asked to sign in again,
// not quietly extended for another week - the branch PMS's rule.
export async function verifyPmsSession() {
  const check = async () => {
    const token = getPmsToken();
    if (!token) return { ok: false, status: 0 };
    const res = await fetch(`${API_BASE_URL}/api/users/verify`, { headers: { Authorization: `Bearer ${token}` } });
    return { ok: res.ok, status: res.status };
  };
  try {
    let result = await check();
    if (result.status === 401 && !hasBeenIdleTooLong() && (await renewSession())) result = await check();
    return result.ok;
  } catch {
    return false;
  }
}
