"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import FONTS from "@/utils/fonts";

export default function NavLink({ href, children, className = "" }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`${FONTS.nav} p-[.5rem] ${isActive ? "text-[var(--emphasis)] border-b-[2px]" : ""} ${className}`}
      // style={isActive ? { borderColor: "var(--emphasis)" } : {}}
    >
      {children}
    </Link>
  );
}
