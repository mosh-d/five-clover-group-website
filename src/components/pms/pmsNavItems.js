import {
  IoGridOutline,
  IoBedOutline,
  IoCalendarOutline,
  IoAppsOutline,
  IoPeopleOutline,
  IoReceiptOutline,
  IoLogInOutline,
  IoLogOutOutline,
  IoHomeOutline,
  IoBarChartOutline,
  IoMoonOutline,
  IoNotificationsOutline,
  IoDocumentTextOutline,
  IoKeyOutline,
  IoHelpCircleOutline,
  IoRestaurantOutline,
  IoFastFoodOutline,
  IoShirtOutline,
  IoBusinessOutline,
  IoWarningOutline,
  IoBulbOutline,
  IoStatsChartOutline,
  IoCalculatorOutline,
  IoWalletOutline,
} from "react-icons/io5";
import { readPmsSession } from "@/lib/pms/session";

// The PMS's pages and who may open each - the owner's role/page matrix
// (2026-09-24), verbatim from the branch PMS (hotel-frontends
// components/shared/adminNavItems.js), where the reasoning behind each line
// lives. Keep the two in step until the branch PMS is retired.
//
// Head Office lives here too (owner, 2026-10-01: it had its own admin at
// /hq). A session is either in a branch or at Head Office (its `scope`, see
// readPmsSession), and each page says who may open it in each: `roles` in a
// branch, `hq` at Head Office. A page with only one opens only there.
//
// A developer sees everything in whichever scope they are in, the same
// override the server's RolesGuard applies. This governs the sidebar, where
// a session lands and which pages refuse it; every endpoint keeps its own
// @Roles guard regardless.
export const ROLES = ["manager", "receptionist", "accountant", "waitron", "storekeeper"];
const EVERY_ROLE = ROLES;
const OVERSIGHT = ["manager", "receptionist"];
const FRONT_DESK = ["receptionist"];
const HEAD_OFFICE = ["head_hr", "hr"];

export const PMS_NAV_ITEMS = [
  // Head Office, in the order its sidebar lists them; Critical is where
  // signing in lands (owner, 2026-10-01).
  { slug: "critical", label: "CRITICAL", icon: IoWarningOutline, hq: HEAD_OFFICE },
  { slug: "decision-support", label: "DECISION SUPPORT", icon: IoBulbOutline, hq: HEAD_OFFICE },
  { slug: "metrics", label: "METRICS", icon: IoStatsChartOutline, hq: HEAD_OFFICE },
  { slug: "staff-accounts", label: "STAFF ACCOUNTS", icon: IoPeopleOutline, hq: HEAD_OFFICE },
  // A branch.
  { slug: "overview", label: "OVERVIEW", icon: IoGridOutline, roles: OVERSIGHT },
  // The accountant's own page, and where an accountant lands (docs/ACCOUNTING-PLAN.md, 2026-10-08).
  { slug: "accounting", label: "ACCOUNTING", icon: IoCalculatorOutline, roles: ["accountant"] },
  { slug: "rooms", label: "ROOMS", icon: IoBedOutline, roles: OVERSIGHT },
  { slug: "room-chart", label: "ROOM CHART", icon: IoAppsOutline, roles: FRONT_DESK },
  { slug: "reservations", label: "RESERVATIONS", icon: IoCalendarOutline, roles: FRONT_DESK },
  { slug: "guests", label: "GUESTS", icon: IoPeopleOutline, roles: OVERSIGHT },
  // The accountant reads folios and refunds credit (docs/ACCOUNTING-PLAN.md, Step 4).
  { slug: "folios", label: "GUEST FOLIOS", icon: IoReceiptOutline, roles: [...OVERSIGHT, "accountant"] },
  { slug: "fnb-sales", label: "F&B SALES", icon: IoFastFoodOutline, roles: ["waitron"] },
  { slug: "laundry-sales", label: "LAUNDRY SALES", icon: IoShirtOutline, roles: FRONT_DESK },
  { slug: "check-ins", label: "CHECK-INS", icon: IoLogInOutline, roles: FRONT_DESK },
  { slug: "check-outs", label: "CHECK-OUTS", icon: IoLogOutOutline, roles: FRONT_DESK },
  { slug: "in-house", label: "IN-HOUSE", icon: IoHomeOutline, roles: OVERSIGHT },
  { slug: "reports", label: "REPORTS", icon: IoBarChartOutline, roles: EVERY_ROLE },
  { slug: "night-audit", label: "NIGHT AUDIT", icon: IoMoonOutline, roles: FRONT_DESK },
  // Whoever holds a drawer counts it (docs/ACCOUNTING-PLAN.md, Step 2).
  { slug: "cash-up", label: "CASH-UP", icon: IoWalletOutline, roles: ["receptionist", "waitron"] },
  // badge: carries a live count (PmsSidebar) - open alerts; OTA payments
  // still to arrive.
  { slug: "alerts", label: "ALERTS", icon: IoNotificationsOutline, roles: OVERSIGHT, badge: "alerts" },
  { slug: "ota-payments", label: "OTA PAYMENTS", icon: IoBusinessOutline, roles: FRONT_DESK, badge: "ota" },
  // Both: a branch's own trail, or - at Head Office - any branch's.
  { slug: "audit-trail", label: "AUDIT TRAIL", icon: IoDocumentTextOutline, roles: ["manager", "accountant"], hq: HEAD_OFFICE },
  { slug: "menu", label: "MENU", icon: IoRestaurantOutline, roles: ["storekeeper"] },
  { slug: "account", label: "ACCOUNT", icon: IoKeyOutline, roles: EVERY_ROLE, hq: HEAD_OFFICE },
  { slug: "help", label: "HELP", icon: IoHelpCircleOutline, roles: EVERY_ROLE },
].map((item) => ({ ...item, href: `/pms/${item.slug}` }));

export const navItemFor = (slug) => PMS_NAV_ITEMS.find((item) => item.slug === slug) || null;

// The page a pathname belongs to ("/pms/folios/12" -> the Guest Folios item).
export const navItemForPath = (pathname) => navItemFor(String(pathname || "").split("/")[2]);

// Who may open an item in a scope ("branch" or "hq"); none = it doesn't open there.
const rolesIn = (item, scope) => (scope === "hq" ? item.hq : item.roles);

export const visibleNavItems = (role, scope = "branch") =>
  PMS_NAV_ITEMS.filter((item) => {
    const roles = rolesIn(item, scope);
    return Boolean(roles) && (role === "developer" || roles.includes(role));
  });

export const canOpen = (role, slug, scope = "branch") => visibleNavItems(role, scope).some((item) => item.slug === slug);

// Whether a page opens in the other scope only - to say "switch to Head
// Office" (or "to a branch") rather than "your role isn't authorized".
export const opensOnlyIn = (item, scope) => Boolean(item) && !rolesIn(item, scope) && Boolean(rolesIn(item, scope === "hq" ? "branch" : "hq"));

// Where a session lands after signing in: the first page of its own sidebar,
// so no role can land somewhere it may not open.
export const landingPath = (role, scope = "branch") => visibleNavItems(role, scope)[0]?.href || "/pms/account";

// Where signing in goes on to: the page that sent someone to sign in (?next=,
// e.g. /pms/reservations?reservation_id=12 from a branch PMS's "moved" card
// or a bookmark) if their role may open it, otherwise their own first page.
// Only ever a /pms page of this site.
export const pathAfterSignIn = (role, next, scope = "branch") => {
  const target = String(next || "");
  if (!/^\/pms\/[a-z-]+([/?#].*)?$/.test(target)) return landingPath(role, scope);
  return canOpen(role, target.split(/[/?#]/)[2], scope) ? target : landingPath(role, scope);
};

// "GUEST FOLIOS" -> "Guest Folios", "OTA PAYMENTS" -> "OTA Payments".
const KEEP_UPPERCASE = ["OTA", "PMS", "F&B"];
export const pageTitle = (item) =>
  item
    ? item.label
        .split(/([ -])/)
        .map((part) => (KEEP_UPPERCASE.includes(part) ? part : part.charAt(0) + part.slice(1).toLowerCase()))
        .join("")
    : "that page";

// The branch PMS's questions about its sidebar (its adminNavItems.js), asked
// of the signed-in role - for pages moved over from it. `to` may be a /pms
// or an /admin path, with or without a query.
const slugOf = (to) => String(to || "").split("?")[0].split("#")[0].replace(/\/+$/, "").split("/").pop();
export const canAccessNavItem = (to) => {
  const session = readPmsSession();
  return canOpen(session?.role, slugOf(to), session?.scope || "branch");
};
export const canViewAuditTrail = () => canAccessNavItem("/pms/audit-trail");
export const adminPageTitle = (to) => pageTitle(navItemFor(slugOf(to)));
export const accessDenial = (to) => (canAccessNavItem(to) ? null : `Your role isn't authorized to open ${adminPageTitle(to)}.`);
