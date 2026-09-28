import { Suspense } from "react";
import AdminLaundry from "@/components/pms/pages/AdminLaundry";

// Laundry Sales - the branch PMS's page (admin_pages/AdminLaundry.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsLaundryRoute() {
  return (
    <Suspense>
      <AdminLaundry />
    </Suspense>
  );
}
