"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/five-clover-logo.webp";
import { getHqUser, clearHqSession } from "@/utils/hq-auth";
import { useRouter } from "next/navigation";

const ROLE_LABELS = { head_hr: "Head HR", developer: "Developer" };

export default function AdminTopBar() {
  const router = useRouter();
  const user = getHqUser();

  const handleSignOut = () => {
    clearHqSession();
    router.push("/admin");
  };

  return (
    <header
      className="w-full flex items-center justify-between pl-6 pr-30 md:pr-6 py-4 shadow-sm shrink-0"
      style={{ background: "var(--text-color)" }}
    >
      <Link href="/admin/staff" className="flex flex-col items-center gap-3 shrink-0">
        <div className="relative size-36">
          <Image src={Logo} alt="Five Clover" fill className="object-contain" />
        </div>
        <span className="hidden sm:block text-xl font-bold text-white">Five Clover HQ</span>
      </Link>

      {user && (
        <div className="flex items-center gap-5">
          <div className="text-right hidden sm:block">
            <div className="text-lg font-semibold text-white">{user.display_name}</div>
            <div className="text-base text-white/60">
              {ROLE_LABELS[user.staff_role] || user.staff_role}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg px-4 py-2 text-lg font-semibold border border-white/30 text-white cursor-pointer hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
