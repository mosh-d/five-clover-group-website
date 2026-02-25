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
      {/* Hamburger — visible on max-lg only */}
      <button
        className={`${
          mobileMenuOpen && "max-lg:hidden"
        } hidden max-lg:flex items-center justify-center cursor-pointer fixed m-[3rem] bg-[var(--emphasis)] p-[.6rem] rounded-xl z-40 shadow-[0_5px_20px_rgba(83,65,4,0.5)] active:shadow-none active:size-0.7`}
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        <FiMenu
          size="2.8rem"
          color="white"
          className={`${
            isHomePage ? "text-white" : "text-[color:var(--text-color)]"
          } `}
        />
      </button>
      <header className={`${isHomePage && "absolute top-0"} w-full flex justify-between items-center h-[10rem] py-[1.2rem] px-[9rem] max-lg:px-[4.8rem] max-sm:px-[2.4rem] z-30`}>
        <div className="border-b-[1px] w-full h-[12rem] border-[var(--emphasis)]/50 flex justify-between items-end pb-[.7rem]">
          {/* Desktop nav — hidden on max-lg */}
          <nav aria-label="Main navigation">
            <ul className="flex gap-[3.2rem] max-lg:hidden">
              <li>
                <NavLink
                  href="/"
                  className={
                    isHomePage
                      ? "text-[var(--white)] border-[var(--emphasis)]"
                      : ""
                  }
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
          </nav>

          {/* Logo — centered absolutely */}
          <Link
            href="/"
            className="size-[10rem] absolute top-[1.2rem] left-1/2 translate-x-[-50%] max-sm:left-[100%] max-sm:translate-x-[-150%] cursor-pointer"
          >
            <Image src={Logo} alt="Five Clover Logo" />
          </Link>

          {/* Reserve button — hidden on max-lg */}
          {isHomePage ? (
            <a
              href="#reservation"
              className="border-[2px] px-[2rem] py-[.5rem] pt-[1rem] font-medium hover:cursor-pointer text-[var(--emphasis)] hover:bg-[var(--emphasis)] hover:text-[var(--white)] transition-all duration-300 max-md:hidden"
              style={{ borderColor: "var(--emphasis)" }}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("reservation")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <p className="text-[1.8rem]">RESERVE</p>
            </a>
          ) : (
            <Button href="/#reservation" className="max-md:hidden">
              <p className="text-[1.8rem]">RESERVE</p>
            </Button>
          )}
        </div>
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </header>

      {/* Mobile menu overlay */}
    </>
  );
}
