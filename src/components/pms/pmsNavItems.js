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
} from "react-icons/io5";
import { readPmsSession } from "@/lib/pms/session";

// The PMS's pages and who may open each - the owner's role/page matrix
// (2026-09-24), verbatim from the branch PMS (hotel-frontends
// components/shared/adminNavItems.js), where the reasoning behind each line
// lives. Keep the two in step until the branch PMS is retired.
//
// A developer sees everything, the same override the server's RolesGuard
// applies. This governs the sidebar, where a session lands and which pages
// refuse it; every endpoint keeps its own @Roles guard regardless.
export const ROLES = ["manager", "receptionist", "accountant", "waitron", "storekeeper"];
const EVERY_ROLE = ROLES;
const OVERSIGHT = ["manager", "receptionist"];
const FRONT_DESK = ["receptionist"];

export const PMS_NAV_ITEMS = [
  { slug: "overview", label: "OVERVIEW", icon: IoGridOutline, roles: OVERSIGHT },
  { slug: "rooms", label: "ROOMS", icon: IoBedOutline, roles: OVERSIGHT },
  { slug: "room-chart", label: "ROOM CHART", icon: IoAppsOutline, roles: FRONT_DESK },
  { slug: "reservations", label: "RESERVATIONS", icon: IoCalendarOutline, roles: FRONT_DESK },
  { slug: "guests", label: "GUESTS", icon: IoPeopleOutline, roles: OVERSIGHT },
  { slug: "folios", label: "GUEST FOLIOS", icon: IoReceiptOutline, roles: OVERSIGHT },
  { slug: "fnb-sales", label: "F&B SALES", icon: IoFastFoodOutline, roles: ["waitron"] },
  { slug: "laundry-sales", label: "LAUNDRY SALES", icon: IoShirtOutline, roles: FRONT_DESK },
  { slug: "check-ins", label: "CHECK-INS", icon: IoLogInOutline, roles: FRONT_DESK },
  { slug: "check-outs", label: "CHECK-OUTS", icon: IoLogOutOutline, roles: FRONT_DESK },
  { slug: "in-house", label: "IN-HOUSE", icon: IoHomeOutline, roles: OVERSIGHT },
  { slug: "reports", label: "REPORTS", icon: IoBarChartOutline, roles: EVERY_ROLE },
  { slug: "night-audit", label: "NIGHT AUDIT", icon: IoMoonOutline, roles: FRONT_DESK },
  // badge: carries a live count (PmsSidebar) - open alerts; OTA payments
  // still to arrive.
  { slug: "alerts", label: "ALERTS", icon: IoNotificationsOutline, roles: OVERSIGHT, badge: "alerts" },
  { slug: "ota-payments", label: "OTA PAYMENTS", icon: IoBusinessOutline, roles: FRONT_DESK, badge: "ota" },
  { slug: "audit-trail", label: "AUDIT TRAIL", icon: IoDocumentTextOutline, roles: ["manager", "accountant"] },
  { slug: "menu", label: "MENU", icon: IoRestaurantOutline, roles: ["storekeeper"] },
  { slug: "account", label: "ACCOUNT", icon: IoKeyOutline, roles: EVERY_ROLE },
  { slug: "help", label: "HELP", icon: IoHelpCircleOutline, roles: EVERY_ROLE },
].map((item) => ({ ...item, href: `/pms/${item.slug}` }));

export const navItemFor = (slug) => PMS_NAV_ITEMS.find((item) => item.slug === slug) || null;

// The page a pathname belongs to ("/pms/folios/12" -> the Guest Folios item).
export const navItemForPath = (pathname) => navItemFor(String(pathname || "").split("/")[2]);

export const visibleNavItems = (role) =>
  role === "developer" ? PMS_NAV_ITEMS : PMS_NAV_ITEMS.filter((item) => item.roles.includes(role));

export const canOpen = (role, slug) => visibleNavItems(role).some((item) => item.slug === slug);

// Where a session lands after signing in: the first page of its own sidebar,
// so no role can land somewhere it may not open.
export const landingPath = (role) => visibleNavItems(role)[0]?.href || "/pms/account";

// Where signing in goes on to: the page that sent someone to sign in (?next=,
// e.g. /pms/reservations?reservation_id=12 from a branch PMS's "moved" card
// or a bookmark) if their role may open it, otherwise their own first page.
// Only ever a /pms page of this site.
export const pathAfterSignIn = (role, next) => {
  const target = String(next || "");
  if (!/^\/pms\/[a-z-]+([/?#].*)?$/.test(target)) return landingPath(role);
  return canOpen(role, target.split(/[/?#]/)[2]) ? target : landingPath(role);
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
export const canAccessNavItem = (to) => canOpen(readPmsSession()?.role, slugOf(to));
export const canViewAuditTrail = () => canAccessNavItem("/pms/audit-trail");
export const adminPageTitle = (to) => pageTitle(navItemFor(slugOf(to)));
export const accessDenial = (to) => (canAccessNavItem(to) ? null : `Your role isn't authorized to open ${adminPageTitle(to)}.`);
