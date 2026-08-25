import { IoPeopleOutline, IoKeyOutline, IoDocumentTextOutline } from "react-icons/io5";

// Single source of truth for the HQ admin sidebar + mobile menu. Both
// head_hr and developer sessions see the same items today — there's no
// per-role filtering yet, unlike the hotel-frontends' nav list, because
// every HQ role currently gets full access to every HQ page. Add new
// pages here as they ship.
export const ADMIN_NAV_ITEMS = [
  { href: "/admin/staff", label: "STAFF ACCOUNTS", icon: IoPeopleOutline },
  { href: "/admin/audit-logs", label: "AUDIT LOGS", icon: IoDocumentTextOutline },
  { href: "/admin/account", label: "ACCOUNT", icon: IoKeyOutline },
];
