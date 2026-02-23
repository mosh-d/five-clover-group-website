"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiX } from "react-icons/fi";

export default function MobileMenu({ isOpen, onClose }) {
  const pathname = usePathname();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const linkClass = (href) =>
    `block py-2 cursor-pointer text-[3rem] font-secondary transition-colors ${
      pathname === href
        ? "text-[color:var(--emphasis)] font-bold"
        : "text-gray-800"
    }`;

  const links = [
    { href: "/", label: "HOME" },
    { href: "/about", label: "ABOUT" },
    { href: "/contact", label: "CONTACT" },
    { href: "/blog", label: "BLOG" },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      } transition-opacity duration-300`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
        style={{
          opacity: isOpen ? 1 : 0,
          transition: "opacity 300ms ease-in-out",
        }}
      />

      {/* Menu panel */}
      <div
        className={`fixed inset-0 bg-white flex flex-col items-center justify-center gap-12 p-8 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          aria-label="Close menu"
        >
          <FiX size="4rem" />
        </button>

        <nav className="w-full">
          <ul className="flex flex-col items-center gap-8">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} onClick={onClose} className={linkClass(href)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
