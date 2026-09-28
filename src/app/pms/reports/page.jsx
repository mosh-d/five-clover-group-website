import { Suspense } from "react";
import AdminReports from "@/components/pms/pages/AdminReports";

// Reports - the branch PMS's page (admin_pages/AdminReports.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsReportsRoute() {
  return (
    <Suspense>
      <AdminReports />
    </Suspense>
  );
}
