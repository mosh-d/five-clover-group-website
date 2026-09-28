import { readPmsSession } from "./session";

// Who is signed in, in the words the branch PMS's pages ask it (its
// utils/auth.js) - so a page moved over keeps its checks exactly. Read from
// the PMS session at the moment of asking.
//
// These are display rules only - every endpoint keeps its own @Roles guard.
// The role is the one pages act on: a developer's "view as" pick, or the
// real role (getRealStoredStaffRole for the account itself).

export const getStoredStaffRole = () => readPmsSession()?.role || null;
export const getRealStoredStaffRole = () => readPmsSession()?.realRole || null;
export const getStoredStaffAccountId = () => readPmsSession()?.user?.staff_account_id || null;
export const getStoredStaffUsername = () => readPmsSession()?.user?.username || null;
export const getStoredBranch = () => readPmsSession()?.branch || null;

// A developer passes each "is ..." the way the server's RolesGuard lets a
// developer through every @Roles - except where a role is narrowed DOWN
// (isReceptionist, isStorekeeper, isWaitron), where a developer must stay
// unrestricted.
const is = (...roles) => {
  const role = getStoredStaffRole();
  return roles.includes(role) || role === "developer";
};

export const isManager = () => is("manager");
export const canManageRooms = () => isManager();
export const isAccountant = () => is("accountant");
export const isWaitstaff = () => is("waitron");
export const isStorekeeper = () => getStoredStaffRole() === "storekeeper";
export const canEditMenu = () => isManager() || isAccountant() || isStorekeeper();
export const isReceptionist = () => getStoredStaffRole() === "receptionist";
export const isWaitron = () => getStoredStaffRole() === "waitron";
// Folio and reservation-credit refunds (walk-in credits go by drawer instead,
// see nonGuestCredits.js).
export const canRefund = () => is("receptionist", "manager");
