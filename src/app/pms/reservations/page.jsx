import { Suspense } from "react";
import AdminReservations from "@/components/pms/pages/AdminReservations";

// Reservations - the branch PMS's page (admin_pages/AdminReservations.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsReservationsRoute() {
  return (
    <Suspense>
      <AdminReservations />
    </Suspense>
  );
}
