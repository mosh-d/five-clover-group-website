"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import { usePmsSession } from "./PmsSessionContext";
import { visibleNavItems } from "./pmsNavItems";

function NavItems({ pathname, role, onNavigate }) {
  return (
    <ul className="flex flex-col gap-2">
      {visibleNavItems(role).map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
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
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// The HQ admin's sidebar (components/admin/AdminSidebar.jsx), listing the
// pages the signed-in role may open.
export default function PmsSidebar() {
  const pathname = usePathname();
  const { role } = usePmsSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-5 right-5 mt-13 mr-2 z-40 p-3 rounded-lg shadow-lg cursor-pointer bg-(--emphasis) text-white"
        aria-label="Open menu"
      >
        <FiMenu size={22} />
      </button>

      <nav className="hidden md:flex overflow-y-auto shrink-0 w-sm bg-(--accent-2)">
        <div className="flex flex-col px-4 py-8 gap-2 w-full">
          <NavItems pathname={pathname} role={role} />
        </div>
      </nav>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-xl max-w-full h-full p-6 flex flex-col gap-6 shadow-xl overflow-y-auto bg-(--card)">
            <button onClick={() => setIsMobileOpen(false)} className="self-end cursor-pointer text-(--text-color)" aria-label="Close menu">
              <FiX size={26} />
            </button>
            <NavItems pathname={pathname} role={role} onNavigate={() => setIsMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
