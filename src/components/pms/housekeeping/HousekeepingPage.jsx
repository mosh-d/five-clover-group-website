"use client";

import { useEffect, useState } from "react";
import { IoSparklesOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Notice from "@/components/pms/Notice";
import { Tip } from "@/components/pms/Tip";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { btn, card, field, page } from "@/components/pms/ui";
import { patchStoredBranch } from "@/lib/pms/session";
import { fetchHousekeepingSettings, switchHousekeeping } from "@/lib/pms/api/housekeeping-api";

// Housekeeping (backend docs/HOUSEKEEPING-PLAN.md) - the housekeeping
// supervisor's and housekeepers' page, and the manager's. Step 1: whether the
// branch runs housekeeping, which only the developer switches (owner,
// 2026-10-16: onboarding is the developer's). The rooms to clean come with
// Step 2.
export default function HousekeepingPage() {
  const { realRole, branch, reloadSession } = usePmsSession();
  const isDeveloper = realRole === "developer";
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [switchError, setSwitchError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchHousekeepingSettings().then(
      (d) => !cancelled && setSettings(d),
      (err) => !cancelled && setError(err.message || "Could not load housekeeping."),
    );
    return () => {
      cancelled = true;
    };
  }, [branch?.id]);

  const flip = async () => {
    const on = !settings.on;
    try {
      setBusy(true);
      setSwitchError(null);
      const result = await switchHousekeeping(on);
      setSettings({ ...settings, on: result.on });
      patchStoredBranch({ housekeeping_on: result.on });
      reloadSession?.();
      setConfirming(false);
      setNotice(`Housekeeping is now ${result.on ? "on" : "off"} at ${result.branch_name}.`);
    } catch (err) {
      setSwitchError(err.message || "Could not switch housekeeping.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <div>
        <PageHeading icon={IoSparklesOutline} tipId="housekeeping.page">Housekeeping</PageHeading>
        <p className={`text-2xl mt-2 ${page.muted}`}>
          The rooms guests leave: housekeepers clean them and submit them for review, and the supervisor approves them or sends them back.
        </p>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!settings && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        settings && (
          <section className={`w-full ${card.surface} p-8 flex flex-col gap-5`}>
            <h2 className={page.sectionTitle}>
              Housekeeping is {settings.on ? "on" : "off"} at {settings.branch_name}
              <Tip id="housekeeping.status" />
            </h2>
            <p className={`text-xl ${page.muted}`}>
              {settings.on
                ? "The rooms to clean will show here."
                : "Rooms are ready again as soon as a guest checks out, as before. The developer switches housekeeping on when the branch is ready for it."}
            </p>

            {isDeveloper &&
              (confirming ? (
                <ConfirmPanel
                  question={`Switch housekeeping ${settings.on ? "off" : "on"} at ${settings.branch_name}?`}
                  details={
                    settings.on
                      ? ["Its manager will no longer see this page.", "The change is recorded in the Audit Trail."]
                      : ["Its housekeeping staff and its manager will see this page.", "The change is recorded in the Audit Trail."]
                  }
                  confirmLabel={settings.on ? "Yes, switch it off" : "Yes, switch it on"}
                  busyLabel="Switching..."
                  danger={settings.on}
                  busy={busy}
                  error={switchError}
                  onBack={() => {
                    setConfirming(false);
                    setSwitchError(null);
                  }}
                  onConfirm={flip}
                />
              ) : (
                <div>
                  <button type="button" onClick={() => setConfirming(true)} className={settings.on ? btn.danger : btn.primary}>
                    {settings.on ? "Switch housekeeping off" : "Switch housekeeping on"}
                  </button>
                </div>
              ))}
          </section>
        )
      )}
    </div>
  );
}
