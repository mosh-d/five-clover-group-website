"use client";

import { IoOpenOutline, IoConstructOutline } from "react-icons/io5";
import PageHeading from "@/components/admin/PageHeading";
import { usePmsSession } from "./PmsSessionContext";
import { navItemFor, pageTitle } from "./pmsNavItems";
import { siteForBranch } from "./theme/brands";
import { btn, card, page } from "./ui";

// A sidebar page that hasn't been built in this PMS yet. It says so plainly
// and opens the same page on the branch's own PMS, so nothing is out of
// reach while the move happens a page at a time.
export default function NotYetMoved({ slug }) {
  const { branch } = usePmsSession();
  const item = navItemFor(slug);
  const title = pageTitle(item);
  const site = siteForBranch(branch);

  return (
    <div className={page.wrap}>
      <PageHeading icon={item?.icon}>{title}</PageHeading>
      <div className={`${card.surface} w-full max-w-4xl p-10 flex flex-col gap-6`}>
        <div className="flex items-start gap-5">
          <IoConstructOutline size={30} className="shrink-0 mt-1 text-(--emphasis)" />
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-semibold">{title} hasn&apos;t moved to the new PMS yet.</p>
            <p className={`text-xl ${page.muted}`}>
              Until it does, it works as before on {branch?.name}&apos;s own PMS.
            </p>
          </div>
        </div>
        {site && (
          <a href={`${site}/admin/${slug}`} target="_blank" rel="noopener noreferrer" className={`${btn.secondary} self-start inline-flex items-center gap-3`}>
            Open {title} on {branch?.name}&apos;s PMS
            <IoOpenOutline size={18} />
          </a>
        )}
      </div>
    </div>
  );
}
