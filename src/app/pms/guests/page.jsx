import { Suspense } from "react";
import AdminGuests from "@/components/pms/pages/AdminGuests";

// Guests - the branch PMS's page (admin_pages/AdminGuests.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsGuestsRoute() {
  return (
    <Suspense>
      <AdminGuests />
    </Suspense>
  );
}
