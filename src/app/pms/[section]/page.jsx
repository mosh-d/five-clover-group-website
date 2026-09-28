import { Suspense } from "react";
import NotYetMoved from "@/components/pms/NotYetMoved";
import { PMS_NAV_ITEMS } from "@/components/pms/pmsNavItems";

// Every sidebar page not yet built here (see `ready` in pmsNavItems.js).
// A built page has its own folder, which Next.js prefers over this one;
// anything that isn't a sidebar page at all is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return PMS_NAV_ITEMS.filter((item) => !item.ready).map((item) => ({ section: item.slug }));
}

export default async function PmsSectionPage({ params }) {
  const { section } = await params;
  // NotYetMoved reads the query string, which Next.js needs inside Suspense
  // for a page it renders ahead of time.
  return (
    <Suspense>
      <NotYetMoved slug={section} />
    </Suspense>
  );
}
