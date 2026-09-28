"use client";

import { IoHelpCircleOutline } from "react-icons/io5";
import PageHeading from "@/components/admin/PageHeading";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { canOpen } from "@/components/pms/pmsNavItems";
import { HELP_SECTIONS } from "@/components/pms/help/sections";
import { card, page } from "@/components/pms/ui";

// Help & Workflow Guide - the branch PMS's Help page. A section describes a
// page, so it shows exactly when this role can open that page: the guide
// follows the sidebar's own role matrix rather than keeping a second copy.
export default function PmsHelpPage() {
  const { role } = usePmsSession();
  const sections = HELP_SECTIONS.filter((s) => canOpen(role, s.id));

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeading icon={IoHelpCircleOutline}>Help &amp; Workflow Guide</PageHeading>
      <p className={`text-xl -mt-4 ${page.muted}`}>What each page does and how it fits into the daily workflow. Jump to a section:</p>

      <div className="flex gap-3 text-xl flex-wrap">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold cursor-pointer transition-all bg-black/4 hover:bg-black/8"
          >
            <s.icon size={18} className="shrink-0" />
            {s.label}
          </button>
        ))}
      </div>

      <div className="w-full flex flex-col gap-8">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="w-full flex flex-col gap-4 scroll-mt-24">
            <div className="flex items-center gap-4">
              <span className="w-[3.6rem] h-[3.6rem] rounded-xl bg-(--emphasis)/10 text-(--emphasis) flex items-center justify-center shrink-0">
                <s.icon size={20} />
              </span>
              <h2 className={page.sectionTitle}>{s.label}</h2>
            </div>
            <div className={`${card.surface} p-8 flex flex-col gap-4 w-full`}>
              <p className="text-2xl text-(--text-color)/84">{s.summary}</p>
              <ul className="flex flex-col gap-3 list-disc pl-6">
                {s.workflow.map((line, i) => (
                  <li key={i} className="text-xl leading-relaxed text-(--text-color)/76">{line}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
