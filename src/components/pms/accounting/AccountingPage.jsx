"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { IoCalculatorOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import PageTabs from "@/components/pms/PageTabs";
import { page } from "@/components/pms/ui";
import DayCloseTab from "./DayCloseTab";
import CashUpTab from "./CashUpTab";
import ExceptionsTab from "./ExceptionsTab";
import ReceivablesTab from "./ReceivablesTab";
import DepositsTab from "./DepositsTab";
import ReceiptsTab from "./ReceiptsTab";

// Accounting - the branch accountant's page (owner, 2026-10-08; the plan is
// docs/ACCOUNTING-PLAN.md in the backend). One tab per part of the job, each
// added as it is built. The tab lives in the address, so a refresh or a
// shared link opens the same one.
const TABS = [
  { key: "day-close", label: "Day Close", Tab: DayCloseTab },
  { key: "cash-up", label: "Cash-Up", Tab: CashUpTab },
  { key: "exceptions", label: "Exceptions", Tab: ExceptionsTab },
  { key: "receivables", label: "Receivables", Tab: ReceivablesTab },
  { key: "deposits", label: "Deposits", Tab: DepositsTab },
  { key: "receipts", label: "Receipts", Tab: ReceiptsTab },
];

export default function AccountingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const current = TABS.find((t) => t.key === params.get("tab")) || TABS[0];

  return (
    <div className={page.wrap}>
      <div>
        <PageHeading icon={IoCalculatorOutline} tipId="accounting.page">Accounting</PageHeading>
        <p className={`text-2xl mt-2 ${page.muted}`}>Check and sign off the branch&apos;s books.</p>
      </div>
      {TABS.length > 1 && (
        <PageTabs tabs={TABS} active={current.key} onChange={(key) => router.replace(`/pms/accounting?tab=${key}`, { scroll: false })} />
      )}
      <current.Tab />
    </div>
  );
}
