"use client";

import { Suspense } from "react";
import MetricsPage from "@/components/admin/metrics/MetricsPage";

// The page reads its tab, metric and dates from the address.
export default function AdminMetricsPage() {
  return (
    <Suspense fallback={null}>
      <MetricsPage />
    </Suspense>
  );
}
