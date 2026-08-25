"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/five-clover-logo.webp";
import {
  getHqUser,
  clearHqSession,
  getDevRoleOverride,
  setDevRoleOverride,
  SIMULATABLE_HQ_ROLES,
} from "@/utils/hq-auth";
import { useRouter } from "next/navigation";

const ROLE_LABELS = { head_hr: "Head HR", developer: "Developer" };

export default function AdminTopBar() {
  const router = useRouter();
  // Deliberately the real role, not a simulated one — "Signed in as"
  // states an actual identity, so it should never read "Head HR" while
  // the account signed in is really the developer. The "Viewing as"
  // control below is where the simulated role belongs.
  const user = getHqUser();
  const isRealDeveloper = user?.staff_role === "developer";
  const roleOverride = getDevRoleOverride();

  const handleSignOut = () => {
    clearHqSession();
    router.push("/admin");
  };

  // Full reload, same as the hotel-frontends' own dev role-override —
  // every role check on the page reads straight from storage at render
  // time with no shared context wiring them together, so a reload is the
  // simplest way to make everything already mounted re-evaluate against
  // the newly picked role.
  const handleRoleOverrideChange = (e) => {
    setDevRoleOverride(e.target.value || null);
    window.location.reload();
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
            <div className="text-lg font-semibold text-white">{user.username}</div>
            <div className="text-base text-white/60">
              {ROLE_LABELS[user.staff_role] || user.staff_role}
            </div>
          </div>
          {isRealDeveloper && (
            <label className="flex items-center gap-2 text-base text-white/60" onClick={(e) => e.stopPropagation()}>
              <span className="hidden lg:block">Viewing as</span>
              <select
                value={roleOverride || ""}
                onChange={handleRoleOverrideChange}
                className={`rounded-lg px-3 py-1.5 text-base font-medium border-2 cursor-pointer focus:outline-none ${
                  roleOverride ? "border-amber-400" : "border-white/30"
                }`}
                style={{ background: "var(--text-color)", color: "white" }}
              >
                <option value="" className="text-black">Developer (all access)</option>
                {SIMULATABLE_HQ_ROLES.map((role) => (
                  <option key={role} value={role} className="text-black">
                    {ROLE_LABELS[role] || role}
                  </option>
                ))}
              </select>
            </label>
          )}
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
