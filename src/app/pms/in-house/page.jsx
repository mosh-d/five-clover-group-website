import { Suspense } from "react";
import AdminInHouse from "@/components/pms/pages/AdminInHouse";

// In-House - the branch PMS's page (admin_pages/AdminInHouse.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsInHouseRoute() {
  return (
    <Suspense>
      <AdminInHouse />
    </Suspense>
  );
}
