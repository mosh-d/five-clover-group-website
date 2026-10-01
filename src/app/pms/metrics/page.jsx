import { Suspense } from "react";
import MetricsPage from "@/components/pms/hq/metrics/MetricsPage";

// Metrics - Head Office (moved from /hq/metrics, 2026-10-01). Suspense: the
// page reads its tab, metric and dates from the query string.
export default function PmsMetricsRoute() {
  return (
    <Suspense>
      <MetricsPage />
    </Suspense>
  );
}
