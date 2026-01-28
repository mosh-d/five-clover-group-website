"use client";

import { usePathname } from "next/navigation";
import Logo from "@/assets/five-clover-logo.png";
import Image from "next/image";
import Button from "./Button";
import NavLink from "./NavLink";

export default function TopBar() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <div className="absolute top-0 w-full flex justify-between items-center h-[10rem] py-[1.2rem] px-[9rem] z-10">
      <div className="border-b-[1px] w-full h-[12rem] border-[var(--emphasis)]/50 flex justify-between items-center">
        <ul className="flex gap-[3.2rem]">
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
        <div className="size-[10rem] absolute top-[1.2rem] left-1/2 translate-x-[-50%]">
          <Image src={Logo} alt="Five Clover Logo" />
        </div>
        <Button href="/">
          <p className="text-[1.8rem] text-[var(--emphasis)]">RESERVE</p>
        </Button>
      </div>
    </div>
  );
}
