"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IoSwapHorizontalOutline } from "react-icons/io5";
import { usePmsSession } from "./PmsSessionContext";
import BranchPicker from "./BranchPicker";
import { logoForBranch, branchLocationName } from "./theme/brands";
import { landingPath } from "./pmsNavItems";
import { SIMULATABLE_ROLES } from "@/lib/pms/session";

const ROLE_LABELS = {
  developer: "Developer",
  manager: "Manager",
  receptionist: "Receptionist",
  accountant: "Accountant",
  waitron: "Waitron",
  storekeeper: "Store Keeper",
};

// One rota's readout: who is on it today, and the control to correct a
// wrong pick (every change is audit-logged).
function ShiftRow({ shift }) {
  return (
    <div className="flex items-center gap-2 text-base text-white/70">
      <span>{shift.label}</span>
      <span className="text-lg font-semibold text-white">{shift.name || "Not recorded"}</span>
      {shift.onChange && (
        <button
          type="button"
          onClick={shift.onChange}
          className="cursor-pointer rounded-lg border border-white/30 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          {shift.name ? "Change" : "Record"}
        </button>
      )}
    </div>
  );
}

// The HQ admin's top bar (components/admin/AdminTopBar.jsx), wearing the
// signed-in branch's logo and name.
export default function PmsTopBar({ shifts = [] }) {
  const { user, branch, branches, role, realRole, roleOverride, switchBranch, setRoleOverride, signOut } = usePmsSession();
  const [picking, setPicking] = useState(false);
  const isDeveloper = realRole === "developer";

  return (
    <header className="w-full flex items-center justify-between gap-6 pl-6 pr-30 md:pr-6 py-4 shadow-sm shrink-0 bg-(--text-color)">
      <Link href={landingPath(role)} className="flex flex-col items-center gap-3 shrink-0">
        <div className="relative size-36">
          <Image src={logoForBranch(branch)} alt={branch?.name || "Branch"} fill sizes="9rem" className="object-contain" priority />
        </div>
        <span className="hidden sm:block text-xl font-bold text-white">{branchLocationName(branch?.name)}</span>
      </Link>

      <div className="flex items-center gap-5 flex-wrap justify-end">
        {/* Whose shift the business day is (the 6am prompt, ShiftGate) - only
            for the rotas themselves, a manager and a developer. Both rotas at
            once sit behind a "Shifts" toggle; your own is one line. */}
        {shifts.length > 1 ? (
          <details className="text-base text-white/70">
            <summary className="cursor-pointer transition-colors hover:text-white">Shifts</summary>
            <div className="flex flex-col gap-1 pt-2">
              {shifts.map((shift) => <ShiftRow key={shift.key} shift={shift} />)}
            </div>
          </details>
        ) : (
          shifts.map((shift) => <ShiftRow key={shift.key} shift={shift} />)
        )}
        <div className="text-right hidden sm:block">
          {/* The real account, never the "view as" role - this line states who
              is actually signed in. */}
          <div className="text-lg font-semibold text-white">{user?.username}</div>
          <div className="text-base text-white/60">{ROLE_LABELS[realRole] || realRole}</div>
        </div>

        {isDeveloper && (
          <>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-base font-medium border-2 border-white/30 text-white cursor-pointer hover:bg-white/10 transition-colors"
              title="Open another branch"
            >
              <IoSwapHorizontalOutline size={16} />
              <span className="max-w-60 truncate">{branch?.name}</span>
            </button>
            <label className="flex items-center gap-2 text-base text-white/60">
              <span className="hidden lg:block">Viewing as</span>
              <select
                value={roleOverride || ""}
                onChange={(e) => setRoleOverride(e.target.value || null)}
                className={`rounded-lg px-3 py-1.5 text-base font-medium border-2 cursor-pointer focus:outline-none bg-(--text-color) text-white ${
                  roleOverride ? "border-amber-400" : "border-white/30"
                }`}
              >
                <option value="" className="text-black">Developer (all access)</option>
                {SIMULATABLE_ROLES.map((r) => (
                  <option key={r} value={r} className="text-black">{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </label>
          </>
        )}

        <button
          type="button"
          onClick={signOut}
          className="rounded-lg px-4 py-2 text-lg font-semibold border border-white/30 text-white cursor-pointer hover:bg-white/10 transition-colors"
        >
          Sign out
        </button>
      </div>

      {picking && (
        <BranchPicker
          branches={branches}
          currentId={branch?.id}
          title="Open another branch"
          onChoose={async (id) => {
            await switchBranch(id);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </header>
  );
}
