import { Suspense } from "react";
import AdminFnbSales from "@/components/pms/pages/AdminFnbSales";

// F&B Sales - the branch PMS's page (admin_pages/AdminFnbSales.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsFnbSalesRoute() {
  return (
    <Suspense>
      <AdminFnbSales />
    </Suspense>
  );
}
