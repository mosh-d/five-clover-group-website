// The PMS session (fivecloverhotels.com/pms), in localStorage like every
// other admin session in this project - but under its own pms_* keys, apart
// from the HQ admin's hq_* ones on the same site, so signing in to (or out
// of) one never touches the other.
//
// Read these only in effects and event handlers, never while rendering:
// the server has no localStorage, so a render that reads it would differ
// between server and browser. The shell reads once and hands the result
// down (see PmsSessionContext).

const KEYS = {
  token: "pms_auth_token",
  refresh: "pms_refresh_token",
  user: "pms_user",
  branch: "pms_branch",
  branches: "pms_branches",
  roleOverride: "pms_dev_role_override",
  lastActivity: "pms_last_activity",
};

// Roles a developer can "view as", to see exactly what that role's PMS looks
// like without another login - display only; every request still carries
// the developer's real token.
export const SIMULATABLE_ROLES = ["manager", "receptionist", "accountant", "waitron", "storekeeper"];

const hasStorage = () => typeof window !== "undefined";

const readJson = (key) => {
  if (!hasStorage()) return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

export function storePmsSession(data) {
  if (!hasStorage()) return;
  localStorage.setItem(KEYS.token, data.token);
  if (data.refresh_token) localStorage.setItem(KEYS.refresh, data.refresh_token);
  if (data.user) localStorage.setItem(KEYS.user, JSON.stringify(data.user));
  if (data.branch) localStorage.setItem(KEYS.branch, JSON.stringify(data.branch));
  // Only a developer's session carries the branch list (for switching).
  if (data.branches) localStorage.setItem(KEYS.branches, JSON.stringify(data.branches));
}

export function clearPmsSession() {
  if (!hasStorage()) return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

// Whether the person is still here - not merely whether a session exists.
// The access token lapses every 30 minutes by design; an actively-used
// session renews through it, an untouched one ends on the same clock (the
// branch PMS's rule, owner 2026-09-27: "I was only logged in for about 30
// minutes so why did my tokens expire?"). Stamped only from a real pointer
// or key event (see PmsShell), never from a network response - the PMS
// refetches on its own, and that must not keep an abandoned front-desk
// terminal signed in.
export const IDLE_LIMIT_MS = 30 * 60 * 1000;

export function markActivity() {
  try {
    localStorage.setItem(KEYS.lastActivity, String(Date.now()));
  } catch {
    // Storage unavailable: treated as active, below.
  }
}

// No stamp at all (storage unavailable) counts as active.
export function hasBeenIdleTooLong() {
  if (!hasStorage()) return false;
  const stamp = Number(localStorage.getItem(KEYS.lastActivity) || 0);
  return Boolean(stamp) && Date.now() - stamp > IDLE_LIMIT_MS;
}

export const getPmsToken = () => (hasStorage() ? localStorage.getItem(KEYS.token) : null);
export const getPmsRefreshToken = () => (hasStorage() ? localStorage.getItem(KEYS.refresh) : null);

// Everything the shell needs about who is signed in, in one read.
export function readPmsSession() {
  const user = readJson(KEYS.user);
  if (!getPmsToken() || !user) return null;
  const realRole = user.staff_role || null;
  const override = realRole === "developer" && hasStorage() ? localStorage.getItem(KEYS.roleOverride) : null;
  return {
    user,
    branch: readJson(KEYS.branch),
    branches: readJson(KEYS.branches) || [],
    realRole,
    // The role the pages act on: a developer's "view as" pick, or the real one.
    role: override || realRole,
    roleOverride: override,
  };
}

export function setDevRoleOverride(role) {
  if (!hasStorage()) return;
  if (role) localStorage.setItem(KEYS.roleOverride, role);
  else localStorage.removeItem(KEYS.roleOverride);
}

// Set by the sign-in page, read once by the shell: a token seconds old
// doesn't need verifying again before the first page shows. In memory
// only, so a reload always verifies.
let justSignedIn = false;
export const markJustSignedIn = () => {
  justSignedIn = true;
};
export const consumeJustSignedIn = () => {
  const was = justSignedIn;
  justSignedIn = false;
  return was;
};
