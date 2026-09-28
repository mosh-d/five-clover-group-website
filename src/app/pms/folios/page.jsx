import { Suspense } from "react";
import AdminFolios from "@/components/pms/pages/AdminFolios";

// Guest Folios - the branch PMS's page (admin_pages/AdminFolios.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsFoliosRoute() {
  return (
    <Suspense>
      <AdminFolios />
    </Suspense>
  );
}
