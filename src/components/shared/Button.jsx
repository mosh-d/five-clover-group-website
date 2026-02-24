"use client";

import Link from "next/link";

export default function Button({
  children,
  href,
  borderColor = "var(--emphasis)",
  className,
}) {
  return (
    <Link href={href}>
      <button
        className={`border-[2px] px-[2rem] py-[.5rem] pt-[1rem] font-medium hover:cursor-pointer transition-all duration-300 ${className}`}
        style={{
          borderColor,
          color: borderColor,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = borderColor;
          e.currentTarget.style.color = "var(--white)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = borderColor;
        }}
      >
        {children}
      </button>
    </Link>
  );
}
