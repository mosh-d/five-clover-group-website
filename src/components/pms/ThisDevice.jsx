"use client";

import { useEffect, useState } from "react";
import { Tip } from "@/components/pms/Tip";
import { btn, card, field, page } from "@/components/pms/ui";
import { playSound, setSoundsOn, soundsOn } from "@/lib/pms/sounds";
import { isInstalled, isIos, pushState, turnOffPush, turnOnPush } from "@/lib/pms/pwa";

// Account > This Device (owner, 2026-11-05; docs/OWNER-SETUP.md parts 2-4):
// sounds on or off, notifications on or off, and how to install the PMS as
// an app - each for this phone or computer only.

const PUSH_TEXT = {
  on: "On. This device gets a notification when something needs you, even with the PMS closed.",
  off: "Off on this device.",
  blocked: "Blocked in this browser's settings. Allow notifications for this site there (the padlock by the address, or Site settings), then come back.",
  "not-configured": "Notifications aren't set up on the server yet.",
  "needs-install": "On an iPhone or iPad, install the PMS first (Share, then Add to Home Screen), open it from its icon, and turn them on here.",
  unsupported: "This browser can't show notifications.",
};

export default function ThisDevice() {
  const [sounds, setSounds] = useState(true);
  const [push, setPush] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // The browser is asking "Allow notifications?" and hasn't been answered.
  const [asking, setAsking] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSounds(soundsOn());
    setInstalled(isInstalled());
    pushState().then(
      (s) => !cancelled && setPush(s),
      () => !cancelled && setPush("unsupported"),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSounds = () => {
    const next = !sounds;
    setSoundsOn(next);
    setSounds(next);
    if (next) playSound("success");
  };

  const togglePush = async () => {
    try {
      setBusy(true);
      setError(null);
      setPush(push === "on" ? await turnOffPush({ remember: true }) : await turnOnPush({ onAsking: () => setAsking(true) }));
    } catch (err) {
      setError(err.message || "That didn't go through.");
    } finally {
      setBusy(false);
      setAsking(false);
    }
  };

  // Stops waiting on the browser's question (it can be answered later from
  // the address bar; then turning them on here works straight away).
  const stopWaiting = () => {
    setBusy(false);
    setAsking(false);
  };

  return (
    <section className="w-full max-w-5xl flex flex-col gap-4">
      <div>
        <h2 className={page.sectionTitle}>
          This Device<Tip id="account.thisDevice" />
        </h2>
        <p className={`text-xl mt-1 ${page.muted}`}>Settings for this phone or computer only.</p>
      </div>
      <div className={`${card.surface} p-8 flex flex-col gap-8`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className={field.label}>
              Sounds<Tip id="account.sounds" />
            </span>
            <span className="text-xl">{sounds ? "On: a sound when a change goes through, a different one when it doesn't, and a chime when something needs you." : "Off on this device."}</span>
          </div>
          <button type="button" onClick={toggleSounds} className={btn.secondary} aria-pressed={sounds}>
            {sounds ? "Turn Sounds Off" : "Turn Sounds On"}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className={field.label}>
              Notifications<Tip id="account.notifications" />
            </span>
            <span className="text-xl">{push === null ? "Checking..." : PUSH_TEXT[push]}</span>
          </div>
          {(push === "on" || push === "off") &&
            (asking ? (
              <button type="button" onClick={stopWaiting} className={btn.secondary}>
                Cancel
              </button>
            ) : (
              <button type="button" onClick={togglePush} className={push === "on" ? btn.secondary : btn.primary} disabled={busy}>
                {busy ? "Saving..." : push === "on" ? "Turn Off Notifications" : "Turn On Notifications"}
              </button>
            ))}
        </div>
        {asking && (
          <p className={`${field.hint} text-xl!`} role="status">
            Your browser is asking whether to allow notifications. If no box opened, look at the right end of the address bar for a small bell or
            notification icon, click it and choose Allow.
          </p>
        )}
        {error && <p className={field.error}>{error}</p>}

        <div className="flex flex-col gap-1">
          <span className={field.label}>
            Install the PMS<Tip id="account.install" />
          </span>
          <span className="text-xl">
            {installed
              ? "Installed - you're using the PMS app."
              : isIos()
                ? "In Safari: the Share button, then Add to Home Screen."
                : "Chrome or Edge on a computer: the install icon at the right end of the address bar. Android: ⋮ then Add to Home screen."}
          </span>
        </div>
      </div>
    </section>
  );
}
