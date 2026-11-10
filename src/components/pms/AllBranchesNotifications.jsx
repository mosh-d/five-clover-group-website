"use client";

import { useEffect, useState } from "react";
import { Tip } from "@/components/pms/Tip";
import Modal from "@/components/pms/Modal";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Notice from "@/components/pms/Notice";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { btn, card, field, page } from "@/components/pms/ui";
import { http } from "@/lib/pms/http";

// Account > Every Branch (owner, 2026-11-10; backend phase-95): the developer
// gets every branch's notifications, each titled with its branch; a Head
// Office account turns them on or off here. For the account - every device
// it has notifications on - unlike This Device above.
const HEAD_OFFICE = ["head_hr", "hr"];

export default function AllBranchesNotifications() {
  const { realRole } = usePmsSession();
  const shown = realRole === "developer" || HEAD_OFFICE.includes(realRole);
  const [on, setOn] = useState(null);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!shown) return undefined;
    let cancelled = false;
    http.get("/api/push/all-branches").then(
      ({ data }) => !cancelled && setOn(Boolean(data?.on)),
      () => !cancelled && setOn(false),
    );
    return () => {
      cancelled = true;
    };
  }, [shown]);

  if (!shown) return null;
  const developer = realRole === "developer";

  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      const { data } = await http.post("/api/push/all-branches", { on: !on });
      setOn(Boolean(data?.on));
      setAsking(false);
      setNotice(data?.on ? "Every branch's notifications are on." : "Every branch's notifications are off.");
    } catch (err) {
      setError(err.message || "That didn't go through.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="w-full max-w-5xl flex flex-col gap-4">
      <div>
        <h2 className={page.sectionTitle}>
          Every Branch<Tip id="account.allBranches" />
        </h2>
        <p className={`text-xl mt-1 ${page.muted}`}>For your account, on every device that has notifications on.</p>
      </div>
      <Notice message={notice} onDismiss={() => setNotice(null)} />
      <div className={`${card.surface} p-8 flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex flex-col gap-1">
          <span className={field.label}>
            Notifications From Every Branch<Tip id="account.allBranches.status" />
          </span>
          <span className="text-xl">
            {on === null
              ? "Checking..."
              : developer
                ? "Always on for the developer: everything every branch's staff are notified of, each with its branch's name."
                : on
                  ? "On: everything every branch's staff are notified of, each with its branch's name. Tapping one opens Critical."
                  : "Off: you get no branch's notifications."}
          </span>
        </div>
        {!developer && on !== null && (
          <button type="button" onClick={() => setAsking(true)} className={on ? btn.secondary : btn.primary}>
            {on ? "Turn Off" : "Turn On"}
          </button>
        )}
      </div>
      {asking && (
        <Modal onClose={busy ? undefined : () => setAsking(false)} title="Every Branch's Notifications" size="md">
          <ConfirmPanel
            question={on ? "Turn off every branch's notifications?" : "Turn on every branch's notifications?"}
            details={
              on
                ? ["Your devices stop getting the branches' notifications."]
                : [
                    "Each of your devices with notifications on gets what every branch's staff are notified of: rooms to clean and review, store requests, rooms out of order, website bookings.",
                    "Each one is titled with its branch. It can be a lot on a busy day.",
                    "Turn notifications on for a device under This Device above.",
                  ]
            }
            confirmLabel={on ? "Yes, turn off" : "Yes, turn on"}
            busyLabel="Saving..."
            busy={busy}
            error={error}
            onBack={() => setAsking(false)}
            onConfirm={confirm}
          />
        </Modal>
      )}
    </section>
  );
}
