"use client";

import { useEffect, useState } from "react";
import { Tip } from "@/components/pms/Tip";
import Modal from "@/components/pms/Modal";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Notice from "@/components/pms/Notice";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { btn, card, field, page } from "@/components/pms/ui";
import { http } from "@/lib/pms/http";

// Account > Every Branch (owner, 2026-11-10; backend phase-95/97): Head Office
// accounts and the developer get every branch's notifications - each titled
// with its branch - when they turn it on, and choose which kinds (the Head
// Digital Marketer might keep website bookings only). For the account - every
// device it has notifications on - unlike This Device above.
const CHOOSERS = ["developer", "head_hr", "hr", "head_marketer"];

export default function AllBranchesNotifications() {
  const { realRole } = usePmsSession();
  const shown = CHOOSERS.includes(realRole);
  const developer = realRole === "developer";
  const [data, setData] = useState(null);
  const [picked, setPicked] = useState([]);
  // { on } to switch, { kinds } to save the choices.
  const [asking, setAsking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!shown) return undefined;
    let cancelled = false;
    http.get("/api/push/all-branches").then(
      ({ data: d }) => {
        if (cancelled) return;
        setData(d);
        setPicked(d?.kinds || []);
      },
      () => !cancelled && setData({ on: false, kinds: [], kinds_all: [] }),
    );
    return () => {
      cancelled = true;
    };
  }, [shown]);

  if (!shown) return null;
  const labelOf = (key) => data?.kinds_all?.find((k) => k.key === key)?.label || key;
  const changed = data && [...picked].sort().join() !== [...(data.kinds || [])].sort().join();

  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      const { data: d } = await http.post("/api/push/all-branches", asking);
      setData((old) => ({ ...old, on: Boolean(d?.on), kinds: d?.kinds || old.kinds }));
      setPicked(d?.kinds || picked);
      setAsking(null);
      setNotice(
        "on" in asking
          ? d?.on
            ? "Every branch's notifications are on."
            : "Every branch's notifications are off."
          : `Saved. You get: ${(d?.kinds || []).map(labelOf).join(", ") || "none of them"}.`,
      );
    } catch (err) {
      setError(err.message || "That didn't go through.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = (key) => setPicked((now) => (now.includes(key) ? now.filter((k) => k !== key) : [...now, key]));

  return (
    <section className="w-full max-w-5xl flex flex-col gap-4">
      <div>
        <h2 className={page.sectionTitle}>
          Every Branch<Tip id="account.allBranches" />
        </h2>
        <p className={`text-xl mt-1 ${page.muted}`}>For your account, on every device that has notifications on.</p>
      </div>
      <Notice message={notice} onDismiss={() => setNotice(null)} />
      <div className={`${card.surface} p-8 flex flex-col gap-8`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className={field.label}>
              Notifications From Every Branch<Tip id="account.allBranches.status" />
            </span>
            <span className="text-xl">
              {!data
                ? "Checking..."
                : data.on
                  ? `On: what every branch's staff are notified of, of the kinds below, each with its branch's name.${developer ? "" : " Tapping one opens Critical."}`
                  : developer
                    ? "Off: each device gets the notifications of the branch it is signed into."
                    : "Off: you get no branch's notifications."}
            </span>
          </div>
          {data && (
            <button type="button" onClick={() => setAsking({ on: !data.on })} className={data.on ? btn.secondary : btn.primary}>
              {data.on ? "Turn Off" : "Turn On"}
            </button>
          )}
        </div>

        {data?.kinds_all?.length > 0 && (
          <fieldset className="flex flex-col gap-3">
            <legend className={`${field.label} mb-3`}>
              Kinds to Get<Tip id="account.allBranches.kinds" />
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {data.kinds_all.map((k) => (
                <label key={k.key} className="flex items-center gap-3 text-xl cursor-pointer">
                  <input type="checkbox" checked={picked.includes(k.key)} onChange={() => toggle(k.key)} className="w-5 h-5 cursor-pointer" />
                  {k.label}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <button type="button" onClick={() => setAsking({ kinds: picked })} className={btn.primary} disabled={!changed}>
                Save Choices
              </button>
              {changed && (
                <button type="button" onClick={() => setPicked(data.kinds)} className={btn.secondary}>
                  Undo
                </button>
              )}
            </div>
          </fieldset>
        )}
      </div>
      {asking && (
        <Modal onClose={busy ? undefined : () => setAsking(null)} title="Every Branch's Notifications" size="md">
          <ConfirmPanel
            question={
              "on" in asking
                ? asking.on
                  ? "Turn on every branch's notifications?"
                  : "Turn off every branch's notifications?"
                : asking.kinds.length
                  ? `Get only these: ${asking.kinds.map(labelOf).join(", ")}?`
                  : "Get none of them?"
            }
            details={
              "on" in asking
                ? asking.on
                  ? ["Each of your devices with notifications on gets them, of the kinds you chose, titled with the branch.", "Turn notifications on for a device under This Device above."]
                  : [developer ? "Each device gets the notifications of the branch it is signed into." : "Your devices stop getting the branches' notifications."]
                : ["For every branch, on all your devices with notifications on.", "Change it here any time."]
            }
            confirmLabel="Yes, save"
            busyLabel="Saving..."
            busy={busy}
            error={error}
            onBack={() => setAsking(null)}
            onConfirm={confirm}
          />
        </Modal>
      )}
    </section>
  );
}
