// Session storage for the HQ admin (/admin) — same localStorage key/shape
// convention the hotel-frontends already use for their own admin sessions,
// kept consistent even though this is a different framework. There's no
// server-side session/middleware here; this is a client-only admin tool.

const TOKEN_KEY = "hq_auth_token";
const REFRESH_TOKEN_KEY = "hq_refresh_token";
const USER_KEY = "hq_admin_user";
const DEV_ROLE_OVERRIDE_KEY = "hq_dev_role_override";

// Roles a real developer can "view as" — same purpose as the
// hotel-frontends' dev role-override (confirm what another role's UI
// looks like without a separate login). This is a display-layer preview
// only: every hq-staff/branches request still carries the real HQ token,
// so the backend enforces access exactly as it always did regardless of
// what's simulated here.
export const SIMULATABLE_HQ_ROLES = ["head_hr", "hr"];

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
  localStorage.removeItem(DEV_ROLE_OVERRIDE_KEY);
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

export function getDevRoleOverride() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEV_ROLE_OVERRIDE_KEY) || null;
}

export function setDevRoleOverride(role) {
  if (typeof window === "undefined") return;
  if (role) localStorage.setItem(DEV_ROLE_OVERRIDE_KEY, role);
  else localStorage.removeItem(DEV_ROLE_OVERRIDE_KEY);
}

// The role UI should treat the session as, given a possible simulation.
// Only a real developer can simulate — anyone else always gets their own
// real role back, mirroring the hotel-frontends' getStoredStaffRole().
export function getEffectiveStaffRole() {
  const user = getHqUser();
  if (!user) return null;
  if (user.staff_role === "developer") {
    return getDevRoleOverride() || "developer";
  }
  return user.staff_role;
}
