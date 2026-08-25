"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import { ADMIN_NAV_ITEMS } from "./adminNavItems";

function NavItems({ pathname, onNavigate }) {
  return (
    <ul className="flex flex-col gap-2">
      {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xl font-bold tracking-wide transition-colors ${
                isActive ? "text-white shadow-md" : "hover:bg-white/60"
              }`}
              style={{
                background: isActive ? "var(--emphasis)" : "transparent",
                color: isActive ? "white" : "var(--text-color)",
              }}
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

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-5 right-5 z-40 p-3 rounded-lg shadow-lg cursor-pointer"
        style={{ background: "var(--emphasis)", color: "white" }}
        aria-label="Open menu"
      >
        <FiMenu size={22} />
      </button>

      {/* Desktop sidebar — nav on <nav> itself so the background fills the
          full column height regardless of item-list height. */}
      <nav
        className="hidden md:flex overflow-y-auto shrink-0 w-64"
        style={{ backgroundColor: "var(--accent-2)" }}
      >
        <div className="flex flex-col px-4 py-8 gap-2 w-full">
          <NavItems pathname={pathname} />
        </div>
      </nav>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-white h-full p-6 flex flex-col gap-6 shadow-xl">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="self-end cursor-pointer"
              style={{ color: "var(--text-color)" }}
              aria-label="Close menu"
            >
              <FiX size={26} />
            </button>
            <NavItems pathname={pathname} onNavigate={() => setIsMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
