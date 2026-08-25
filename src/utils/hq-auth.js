// Session storage for the HQ admin (/admin) — same localStorage key/shape
// convention the hotel-frontends already use for their own admin sessions,
// kept consistent even though this is a different framework. There's no
// server-side session/middleware here; this is a client-only admin tool.

const TOKEN_KEY = "hq_auth_token";
const REFRESH_TOKEN_KEY = "hq_refresh_token";
const USER_KEY = "hq_admin_user";

export function storeHqSession(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, data.token);
  if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function clearHqSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getHqToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getHqRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getHqUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isHqAuthenticated() {
  return Boolean(getHqToken());
}

export function getHqAuthHeaders() {
  const token = getHqToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
