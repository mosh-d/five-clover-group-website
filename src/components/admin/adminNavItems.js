import { IoPeopleOutline, IoKeyOutline, IoDocumentTextOutline, IoWarningOutline, IoBulbOutline, IoStatsChartOutline } from "react-icons/io5";

// Single source of truth for the HQ admin sidebar + mobile menu. Both
// head_hr and developer sessions see the same items today — there's no
// per-role filtering yet, unlike the hotel-frontends' nav list, because
// every HQ role currently gets full access to every HQ page. Add new
// pages here as they ship.
export const ADMIN_NAV_ITEMS = [
  // What needs head office's attention across every branch (2026-10-01).
  // First in the list, and where signing in lands (owner, 2026-10-01).
  { href: "/hq/critical", label: "CRITICAL", icon: IoWarningOutline },
  // Insights drawn from the branches, with a clear suggestion (2026-10-01).
  { href: "/hq/decision-support", label: "DECISION SUPPORT", icon: IoBulbOutline },
  // Every branch side by side, one management metric at a time (2026-10-01).
  { href: "/hq/metrics", label: "METRICS", icon: IoStatsChartOutline },
  { href: "/hq/staff", label: "STAFF ACCOUNTS", icon: IoPeopleOutline },
  { href: "/hq/audit-logs", label: "AUDIT TRAIL", icon: IoDocumentTextOutline },
  { href: "/hq/account", label: "ACCOUNT", icon: IoKeyOutline },
];
