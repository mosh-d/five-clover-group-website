import { Suspense } from "react";
import AdminRoomChart from "@/components/pms/pages/AdminRoomChart";

// Room Chart - the branch PMS's page (admin_pages/AdminRoomChart.jsx), moved here
// (2026-09-28). Suspense: the page reads the query string, which Next.js
// needs inside a boundary for a page it renders ahead of time.
export default function PmsRoomChartRoute() {
  return (
    <Suspense>
      <AdminRoomChart />
    </Suspense>
  );
}
