import { Suspense } from "react";
import AdminAuditTrail from "@/components/pms/pages/AdminAuditTrail";

// Audit Trail - the branch PMS's page (admin_pages/AdminAuditTrail.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsAuditTrailRoute() {
  return (
    <Suspense>
      <AdminAuditTrail />
    </Suspense>
  );
}
