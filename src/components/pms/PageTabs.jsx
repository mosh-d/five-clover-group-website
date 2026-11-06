"use client";
"use no memo";

// The section switches at the top of a page (Check-Ins' Expected Arrivals /
// Walk-In, Accounting's sections, Alerts' lists...). One row, always (owner,
// 2026-11-06: wrapped onto several lines they looked scattered): on a narrow
// screen the row scrolls sideways, the selected one is kept in view, and a
// soft fade at the edge says there is more. A tab may carry a count badge
// ({ badge: 3, badgeLabel: "requests waiting" }), the sidebar's CountBadge.
import { useEffect, useRef } from "react";
import CountBadge from "./CountBadge";

export default function PageTabs({ tabs, active, onChange, className = "" }) {
  const rowRef = useRef(null);
  // The selected tab stays in view when the row is wider than the screen.
  useEffect(() => {
    const row = rowRef.current;
    const tab = row?.querySelector('[aria-selected="true"]');
    if (!row || !tab) return;
    const left = tab.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + tab.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: Math.max(0, left - 16), behavior: "smooth" });
    }
  }, [active]);

  return (
    <div className={`relative w-full min-w-0 ${className}`}>
      <div ref={rowRef} className="pms-tab-row flex flex-nowrap gap-2 overflow-x-auto" role="tablist">
        {tabs.map(({ key, label, badge, badgeLabel }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(key)}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-lg md:text-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
                isActive ? "bg-[color:var(--emphasis)] text-white" : "bg-black/4 text-[color:var(--text-color)] hover:bg-black/8"
              }`}
            >
              {label}
              <CountBadge count={badge} label={badgeLabel || "waiting"} active={isActive} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
