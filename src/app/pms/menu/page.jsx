import { Suspense } from "react";
import AdminMenu from "@/components/pms/pages/AdminMenu";

// Menu - the branch PMS's page (admin_pages/AdminMenu.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsMenuRoute() {
  return (
    <Suspense>
      <AdminMenu />
    </Suspense>
  );
}
