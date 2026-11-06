"use client";

import { useCallback, useEffect, useState } from "react";
import { IoRefreshOutline } from "react-icons/io5";
import { APP_VERSION, newerVersionOut, updateApp } from "@/lib/pms/pwa";

// "Update" in the top bar (owner, 2026-11-06): shows once a newer version of
// the PMS has been shipped than the one on screen - the installed app most of
// all, which can sit open for days. One tap loads the new version.
// Checked every 5 minutes and whenever the app comes back to the front.
const CHECK_MS = 5 * 60 * 1000;

export default function UpdateButton() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const check = useCallback(() => {
    newerVersionOut().then((yes) => yes && setReady(true), () => {});
  }, []);

  useEffect(() => {
    if (!APP_VERSION) return undefined;
    const first = setTimeout(check, 3000);
    const timer = setInterval(check, CHECK_MS);
    const onShow = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onShow);
    window.addEventListener("focus", check);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
      window.removeEventListener("focus", check);
    };
  }, [check]);

  if (!ready) return null;
  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true);
        updateApp();
      }}
      disabled={busy}
      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-base font-bold bg-amber-400 text-black cursor-pointer hover:bg-amber-300 transition-colors disabled:opacity-60"
      title="A new version of the PMS is out - load it"
    >
      <IoRefreshOutline size={16} className={busy ? "animate-spin" : ""} />
      {busy ? "Updating..." : "Update"}
    </button>
  );
}
