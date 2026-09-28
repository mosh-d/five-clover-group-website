"use client";

import { useEffect, useState } from "react";
import { shifts as shiftsApi } from "@/lib/pms/api";
import { businessDateISO } from "@/lib/pms/dates";

const SHIFT_ROLES = ["receptionist", "waitron"];
const SHIFT_LABELS = { receptionist: "Front desk", waitron: "F&B" };

// Whose shift the business day is, per rota, recorded at the 6am rollover -
// the branch PMS's rules (AdminRoot there, owner 2026-09-11):
// - a rota's own people (receptionist, waitron) are locked out until theirs
//   is recorded - staff resume around 8am while the day starts at 6am, so
//   it can't be derived from whoever signs in first;
// - a manager or developer sees both rotas and can correct either, without
//   being locked out of anything;
// - every other role sees none.
// Returns the top bar's readouts, and the gate to show (or null).
export default function useShifts(role) {
  const lockRole = SHIFT_ROLES.includes(role) ? role : null;
  const seesEveryRota = role === "manager" || role === "developer";
  const visible = seesEveryRota ? SHIFT_ROLES : lockRole ? [lockRole] : [];
  const visibleKey = visible.join(",");
  const [shifts, setShifts] = useState({});
  const [changingRole, setChangingRole] = useState(null);
  const [businessDate, setBusinessDate] = useState(businessDateISO);

  // A tab left open across 6am must notice the new day, which has no shift
  // yet. Compared locally each minute; only a real change costs a request.
  useEffect(() => {
    const timer = setInterval(() => setBusinessDate(businessDateISO()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!visibleKey) return undefined;
    let cancelled = false;
    visibleKey.split(",").forEach((r) => {
      shiftsApi
        .current(r)
        .then((current) => !cancelled && setShifts((all) => ({ ...all, [r]: current })))
        .catch(() => !cancelled && setShifts((all) => ({ ...all, [r]: null })));
    });
    return () => {
      cancelled = true;
    };
  }, [visibleKey, businessDate]);

  // Lock only on a KNOWN empty shift: a failed request leaves null, and work
  // carries on rather than being shut out by an API hiccup.
  const lockShift = lockRole ? shifts[lockRole] : null;
  const mustRecord = Boolean(lockRole && lockShift && !lockShift.staff_account_id);
  const gateRole = changingRole || (mustRecord ? lockRole : null);

  const readouts = visible.map((r) => ({
    key: r,
    // Your own single rota needs no qualifier; both at once get named.
    label: visible.length > 1 ? SHIFT_LABELS[r] : "Shift",
    name: shifts[r]?.staff_name || null,
    onChange: shifts[r] ? () => setChangingRole(r) : undefined,
  }));

  const gate = gateRole
    ? {
        role: gateRole,
        businessDate: shifts[gateRole]?.business_date,
        currentName: shifts[gateRole]?.staff_name,
        onSelected: (result) => {
          setShifts((all) => ({
            ...all,
            [result.role]: {
              business_date: result.business_date,
              role: result.role,
              staff_account_id: result.staff_account_id,
              staff_name: result.staff_name,
            },
          }));
          setChangingRole(null);
        },
        onCancel: changingRole ? () => setChangingRole(null) : undefined,
      }
    : null;

  return { readouts, gate };
}
