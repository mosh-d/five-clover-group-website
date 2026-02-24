"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/assets/five-clover-logo.png";
import Image from "next/image";
import Button from "./Button";
import NavLink from "./NavLink";
import MobileMenu from "./MobileMenu";
import { FiMenu } from "react-icons/fi";

export default function TopBar() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="absolute top-0 w-full flex justify-between items-center h-[10rem] py-[1.2rem] px-[9rem] max-lg:px-[4.8rem] z-10">
        <div className="border-b-[1px] w-full h-[12rem] border-[var(--emphasis)]/50 flex justify-between items-center">
          {/* Desktop nav — hidden on max-lg */}
          <ul className="flex gap-[3.2rem] max-lg:hidden">
            <li>
              <NavLink
                href="/"
                className={isHomePage ? "text-[var(--white)]" : ""}
              >
                HOME
              </NavLink>
            </li>
            <li>
              <NavLink
                href="/about"
                className={isHomePage ? "text-[var(--white)]" : ""}
              >
                ABOUT
              </NavLink>
            </li>
            <li>
              <NavLink
                href="/contact"
                className={isHomePage ? "text-[var(--white)]" : ""}
              >
                CONTACT
              </NavLink>
            </li>
            <li>
              <NavLink
                href="/blog"
                className={isHomePage ? "text-[var(--white)]" : ""}
              >
                BLOG
              </NavLink>
            </li>
          </ul>

          {/* Hamburger — visible on max-lg only */}
          <button
            className="hidden max-lg:flex items-center justify-center cursor-pointer"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu
              size="3.2rem"
              className={
                isHomePage ? "text-white" : "text-[color:var(--text-color)]"
              }
            />
          </button>

          {/* Logo — centered absolutely */}
          <Link
            href="/"
            className="size-[10rem] absolute top-[1.2rem] left-1/2 translate-x-[-50%] max-sm:left-[100%] max-sm:translate-x-[-150%] cursor-pointer"
          >
            <Image src={Logo} alt="Five Clover Logo" />
          </Link>

          {/* Reserve button — hidden on max-lg */}
          <Button href="/" className="max-md:hidden max-sm:none">
            <p className="text-[1.8rem] text-[var(--emphasis)]">RESERVE</p>
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
