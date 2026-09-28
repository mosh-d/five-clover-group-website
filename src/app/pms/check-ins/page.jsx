import { Suspense } from "react";
import AdminCheckIns from "@/components/pms/pages/AdminCheckIns";

// Check-Ins - the branch PMS's page (admin_pages/AdminCheckIns.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsCheckInsRoute() {
  return (
    <Suspense>
      <AdminCheckIns />
    </Suspense>
  );
}
