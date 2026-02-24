import Link from "next/link";
import FONTS from "@/utils/fonts";

export default function Button({
  children,
  href,
  borderColor = "var(--emphasis)",
  className,
}) {
  return (
    <Link href={href}>
      <button
        className={`border-[2px] px-[2rem] py-[.5rem] pt-[1rem] font-medium hover:cursor-pointer text-[var(--emphasis)] hover:bg-[var(--emphasis)] hover:text-[var(--white)] transition-all duration-300 ${className}`}
        style={{ borderColor }}
      >
        {children}
      </button>
    </Link>
  );
}
