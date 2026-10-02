// The PMS session (fivecloverhotels.com/pms), in localStorage under its own
// pms_* keys - for a branch and Head Office alike (Head Office had its own
// hq_* session at /hq until 2026-10-01).
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
// the developer's real token. A branch's roles in a branch; Head Office's at
// Head Office (owner, 2026-10-01: Head Office features will be gated per
// role too).
export const SIMULATABLE_ROLES = ["manager", "receptionist", "accountant", "waitron", "storekeeper"];
export const SIMULATABLE_HQ_ROLES = ["head_hr", "hr"];

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
  // A Head Office session comes back with branch: null - the branch a
  // developer just left must not linger.
  if (data.branch) localStorage.setItem(KEYS.branch, JSON.stringify(data.branch));
  else if ("branch" in data) localStorage.removeItem(KEYS.branch);
  // Only a developer's session carries the branch list (for switching).
  if (data.branches) localStorage.setItem(KEYS.branches, JSON.stringify(data.branches));
  // Never touches the idle clock: this also stores every quiet renewal, and
  // a renewal is the PMS refetching on its own, not the person being here.
  // It used to stamp, so a tab left open overnight renewed itself every
  // half hour and was still signed in next morning (2026-10-02).
}

// Signing in is the person being here: the idle clock starts now, not from
// a stamp a previous session left behind.
export function startIdleClock() {
  if (!hasStorage()) return;
  localStorage.setItem(KEYS.lastActivity, String(Date.now()));
}

export function clearPmsSession() {
  if (!hasStorage()) return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

// Whether the person is still here - not merely whether a session exists.
// The access token lapses every 30 minutes by design; an actively-used
// session renews through it, and one left untouched for an hour ends (the
// branch PMS's rule, owner 2026-09-27: "I was only logged in for about 30
// minutes so why did my tokens expire?"; raised from 30 minutes to an hour,
// owner 2026-09-29). Stamped only from a real pointer or key event (see
// PmsShell), never from a network response - the PMS refetches on its own,
// and that must not keep an abandoned front-desk terminal signed in.
export const IDLE_LIMIT_MS = 60 * 60 * 1000;

// A click or a key: the person is still here. Unless the hour has already
// run out - that session is over, and touching it must not bring it back:
// the F5 that reloads the page reaches the page first, and stamping it
// signed a night-old session straight back in (2026-10-02).
export function markActivity() {
  try {
    if (hasBeenIdleTooLong()) return;
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

// The signed-in branch's id - what the branch PMS hard-codes per site as
// BRANCH_ID. Read at the moment it's needed, since a developer can switch.
export const currentBranchId = () => readJson(KEYS.branch)?.id || null;

export const getPmsToken = () => (hasStorage() ? localStorage.getItem(KEYS.token) : null);
export const getPmsRefreshToken = () => (hasStorage() ? localStorage.getItem(KEYS.refresh) : null);

// Everything the shell needs about who is signed in, in one read.
// `scope` is "branch" for a session in a branch, "hq" for Head Office (no
// branch: head_hr and hr accounts, or a developer who chose it - owner,
// 2026-10-01, one PMS for both).
export function readPmsSession() {
  const user = readJson(KEYS.user);
  if (!getPmsToken() || !user) return null;
  const realRole = user.staff_role || null;
  const branch = readJson(KEYS.branch);
  const scope = branch ? "branch" : "hq";
  // "View as" previews a role of the place the session is in - a branch
  // role never applies at Head Office, nor the other way round.
  const stored = realRole === "developer" && hasStorage() ? localStorage.getItem(KEYS.roleOverride) : null;
  const override = (scope === "hq" ? SIMULATABLE_HQ_ROLES : SIMULATABLE_ROLES).includes(stored) ? stored : null;
  return {
    user,
    branch,
    branches: readJson(KEYS.branches) || [],
    scope,
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
