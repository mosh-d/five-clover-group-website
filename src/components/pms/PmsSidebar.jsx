"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiX } from "react-icons/fi";
import { usePmsSession } from "./PmsSessionContext";
import { visibleNavItems } from "./pmsNavItems";
import { usePmsLive } from "./live/PmsLive";
import { AnimatePresence, MotionDiv, EASE_OUT } from "./motion";

function NavItems({ pathname, role, scope, onNavigate }) {
  const { alertCount, otaPendingCount } = usePmsLive();
  // Each nav item's `badge` (pmsNavItems): its live count, and what it counts.
  const badges = {
    alerts: { count: alertCount, label: "open alerts" },
    ota: { count: otaPendingCount, label: "OTA payments still to arrive" },
  };
  return (
    <ul className="flex flex-col gap-2">
      {visibleNavItems(role, scope).map(({ href, label, icon: Icon, badge }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        const count = badge ? badges[badge].count : 0;
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xl font-bold tracking-wide transition-colors ${
                isActive ? "bg-(--emphasis) text-white shadow-md" : "text-(--text-color) hover:bg-white/60"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              <span>{label}</span>
              {count > 0 && (
                <span
                  className={`ml-auto min-w-[2.4rem] h-[2.4rem] px-2 rounded-full text-base font-bold flex items-center justify-center ${
                    isActive ? "bg-white text-(--emphasis)" : "bg-red-600 text-white"
                  }`}
                  aria-label={`${count} ${badges[badge].label}`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// The sidebar - for a branch, or for Head Office - listing the pages the
// signed-in role may open. On a phone it is a menu that slides in from the
// right, where its button is in the top bar (owner, 2026-10-02), and slides
// back out when closed; the backdrop fades with it. The shell's
// <MotionConfig reducedMotion="user"> drops the slide for anyone who asks
// their system for less motion.
export default function PmsSidebar({ mobileOpen = false, onCloseMobile }) {
  const pathname = usePathname();
  const { role, scope } = usePmsSession();

  // Escape closes the menu, as it closes every dialog.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && onCloseMobile?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      <nav className="hidden md:flex overflow-y-auto shrink-0 w-sm bg-(--accent-2)">
        <div className="flex flex-col px-4 py-8 gap-2 w-full">
          <NavItems pathname={pathname} role={role} scope={scope} />
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <div key="mobile-menu" className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
            <MotionDiv
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onCloseMobile}
            />
            <MotionDiv
              className="absolute top-0 right-0 h-full w-xl max-w-[85vw] p-6 flex flex-col gap-6 shadow-xl overflow-y-auto overscroll-contain bg-(--card)"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <button type="button" onClick={onCloseMobile} className="self-end cursor-pointer text-(--text-color)" aria-label="Close menu" autoFocus>
                <FiX size={26} />
              </button>
              <NavItems pathname={pathname} role={role} scope={scope} onNavigate={onCloseMobile} />
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
