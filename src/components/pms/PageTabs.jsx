"use client";
"use no memo";

import { WithTip } from "@/components/pms/Tip";

// Carried over from the branch PMS's components/shared/PageTabs.jsx (2026-09-28).
// The wrapping pill tabs the PMS already uses to switch what a page is
// showing (Check-Ins' Expected Arrivals / Walk-In / Future Booking, Reports'
// own row). Shared from here (2026-09-25) so a page that splits into tabs
// doesn't hand-copy the markup a third time.
//
// They wrap rather than sit in one scrolling row: underlined in a single
// row, a label broke mid-word on a phone ("Walk- / In").
// A tab's `tip` names an entry in lib/pms/tips.js, shown as an (i) beside it.
export default function PageTabs({ tabs, active, onChange, className = "" }) {
  return (
    <div className={`flex flex-wrap gap-3 w-full ${className}`} role="tablist">
      {tabs.map(({ key, label, tip }) => {
        const isActive = key === active;
        const tab = (
          <button
            key={tip ? undefined : key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={`px-6 py-3 rounded-lg text-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
              isActive
                ? "bg-[color:var(--emphasis)] text-white"
                : "bg-black/4 text-[color:var(--text-color)] hover:bg-black/8"
            }`}
          >
            {label}
          </button>
        );
        return tip ? <WithTip key={key} id={tip}>{tab}</WithTip> : tab;
      })}
    </div>
  );
}
