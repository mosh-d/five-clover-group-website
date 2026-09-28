import { Suspense } from "react";
import AdminRooms from "@/components/pms/pages/AdminRooms";

// Rooms - the branch PMS's page (admin_pages/AdminRooms.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsRoomsRoute() {
  return (
    <Suspense>
      <AdminRooms />
    </Suspense>
  );
}
