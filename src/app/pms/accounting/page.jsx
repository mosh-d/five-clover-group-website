import { Suspense } from "react";
import AccountingPage from "@/components/pms/accounting/AccountingPage";

// Accounting - the branch accountant's page (backend docs/ACCOUNTING-PLAN.md).
// Suspense: the page reads its tab from the query string.
export default function PmsAccountingRoute() {
  return (
    <Suspense>
      <AccountingPage />
    </Suspense>
  );
}
