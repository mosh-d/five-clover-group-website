"use client";

import { http } from "./http";

// The PMS as an app (owner, 2026-11-05; docs/OWNER-SETUP.md parts 2-3): the
// service worker that makes it installable, and this device's notifications.

const SW_URL = "/pms-sw.js";
const SW_SCOPE = "/pms";

// The version on screen (next.config.mjs), and the one live on the site.
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "";

/** Whether a newer version than this one has been shipped. */
export async function newerVersionOut() {
  if (!APP_VERSION) return false;
  const res = await fetch(`/pms-version.json?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return false;
  const { version } = await res.json();
  return Boolean(version) && version !== APP_VERSION;
}

/** Loads the newest version: a fresh service worker, then the page again. */
export async function updateApp() {
  try {
    const reg = pwaSupported() ? await navigator.serviceWorker.getRegistration(SW_SCOPE) : null;
    await reg?.update();
  } catch {
    // The page reload below still brings the new version.
  }
  window.location.reload();
}

// Whether this person turned notifications off on this device on purpose -
// then the PMS doesn't turn them back on by itself (syncPush).
const PUSH_PREF = "pms.push";
const pushPref = () => {
  try {
    return window.localStorage.getItem(PUSH_PREF);
  } catch {
    return null;
  }
};
const setPushPref = (value) => {
  try {
    window.localStorage.setItem(PUSH_PREF, value);
  } catch {
    // Private windows may refuse storage.
  }
};

export const pwaSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator;
export const pushSupported = () => pwaSupported() && "PushManager" in window && "Notification" in window;

// iPhone/iPad: notifications only from the installed app (iOS 16.4+).
export const isIos = () => typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
export const isInstalled = () =>
  typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

/** Registers the service worker - once per page load, quietly. */
export async function registerServiceWorker() {
  if (!pwaSupported()) return null;
  try {
    return await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
  } catch {
    return null;
  }
}

const registration = async () => (pwaSupported() ? (await navigator.serviceWorker.getRegistration(SW_SCOPE)) || registerServiceWorker() : null);

// The VAPID public key (base64url) as the bytes PushManager wants.
const keyBytes = (base64url) => {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

/**
 * This device's notifications: "unsupported", "needs-install" (iPhone, not
 * installed yet), "not-configured" (no keys on the server yet), "blocked"
 * (the person chose Block), "on" or "off".
 */
export async function pushState() {
  if (!pushSupported()) return isIos() && !isInstalled() ? "needs-install" : "unsupported";
  const { data: key } = await http.get("/api/push/key");
  if (!key?.configured) return "not-configured";
  if (Notification.permission === "denied") return "blocked";
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return "off";
  const { data } = await http.get("/api/push/status", { params: { endpoint: sub.endpoint } });
  return data?.on ? "on" : "off";
}

// A step that may never answer (a browser that doesn't start the service
// worker, a push service out of reach) fails with a message instead of
// leaving "Saving..." on screen for good.
const within = (promise, ms, message) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))]);

/**
 * Asks the browser, then tells the backend. Returns the new state.
 *
 * The browser's question can wait as long as the person likes: on a computer,
 * Chrome and Edge often ask quietly - a small bell at the end of the address
 * bar, no pop-up - so `onAsking` is called while it waits, to say where to
 * look (owner, 2026-11-06: a desktop sat on "Saving..." with nothing to say why).
 */
export async function turnOnPush({ onAsking } = {}) {
  const { data: key } = await http.get("/api/push/key");
  if (!key?.configured) return "not-configured";
  if (Notification.permission === "default") onAsking?.();
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "blocked" : "off";
  const reg = await within(registration(), 15000, "The PMS app didn't start in this browser. Reload the page and try again.");
  if (!reg) return "unsupported";
  await within(navigator.serviceWorker.ready, 15000, "The PMS app didn't start in this browser. Reload the page and try again.");
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await within(
      reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key.public_key) }),
      20000,
      "This browser's notification service didn't answer. Check the internet connection, then try again.",
    ).catch((err) => {
      // Brave and some privacy settings switch the push service off.
      throw new Error(/push service|Registration failed/i.test(err.message) ? "This browser's notification service is switched off or unreachable (Brave: turn on \"Use Google services for push messaging\" in its settings)." : err.message);
    });
  }
  await http.post("/api/push/subscribe", sub.toJSON());
  setPushPref("on");
  return "on";
}

/**
 * When the PMS opens (owner, 2026-11-06): a browser that already allows
 * notifications gets them, without anyone having to press Turn On - and the
 * device is told which branch it is in (a developer's follow the branch).
 * Quiet: no question, no sound, nothing on screen. Skipped where someone
 * turned them off on purpose, or where the browser hasn't been asked yet.
 */
export async function syncPush() {
  if (!pushSupported() || Notification.permission !== "granted" || pushPref() === "off") return;
  const { data: key } = await http.get("/api/push/key");
  if (!key?.configured) return;
  const reg = await within(registration(), 15000, "service worker");
  if (!reg) return;
  await within(navigator.serviceWorker.ready, 15000, "service worker");
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await within(reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key.public_key) }), 20000, "push service");
  await http.post("/api/push/subscribe", sub.toJSON(), { silent: true });
}

/**
 * Off for this device: the backend forgets it, and the browser drops it.
 * `remember`: turned off on purpose (Account > This Device), so it stays off;
 * signing out doesn't remember - the next person to sign in gets theirs.
 */
export async function turnOffPush({ remember = false } = {}) {
  if (remember) setPushPref("off");
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return "off";
  try {
    // Silent: it also runs as part of signing out.
    await http.post("/api/push/unsubscribe", { endpoint: sub.endpoint }, { silent: true });
  } finally {
    await sub.unsubscribe().catch(() => {});
  }
  return "off";
}
