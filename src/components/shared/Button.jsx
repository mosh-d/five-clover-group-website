import Link from "next/link";
import FONTS from "@/utils/fonts";

export default function Button({
  children,
  href,
  borderColor = "var(--emphasis)",
}) {
  return (
    <Link href={href}>
      <button className="border-[2px] px-[2rem] py-[.5rem] font-medium hover:cursor-pointer" style={{ borderColor }}>
        {children}
      </button>
    </Link>
  );
}
