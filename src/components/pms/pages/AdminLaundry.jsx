"use client";
"use no memo";

// Carried over from the branch PMS's admin_pages/AdminLaundry.jsx (2026-09-28).
import { useState } from "react";
import { IoShirtOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import PageTabs from "@/components/pms/PageTabs";
import AdminLaundryGuestSales from "./AdminLaundryGuestSales";
import AdminLaundrySales from "./AdminLaundrySales";

// Laundry in one place (owner, 2026-09-24), built the same way F&B Sales is:
// a guest half and a non-guest half, each a tab of its own (2026-09-25). The
// guest half is new - an in-house guest's laundry used to have no home of
// its own at all and had to be typed into the Folios page by hand.
const TABS = [
  { key: "guest", label: "Guest Sales" },
  { key: "non-guest", label: "Non-Guest Sales" },
];

export default function AdminLaundryPage() {
  const [tab, setTab] = useState(TABS[0].key);

  return (
    <div
      data-component="AdminLaundry"
      className="flex flex-col items-start gap-[3rem]"
    >
      <PageHeading icon={IoShirtOutline} tipId="laundry.page">Laundry Sales</PageHeading>
      <PageTabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === "guest"
        ? <AdminLaundryGuestSales asSection hideTitle />
        : <AdminLaundrySales asSection hideTitle title="Non-Guest Sales" />}
    </div>
  );
}
