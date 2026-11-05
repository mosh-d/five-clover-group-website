"use client";

import { http } from "./http";

// The PMS as an app (owner, 2026-11-05; docs/OWNER-SETUP.md parts 2-3): the
// service worker that makes it installable, and this device's notifications.

const SW_URL = "/pms-sw.js";
const SW_SCOPE = "/pms";

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

/** Asks the browser, then tells the backend. Returns the new state. */
export async function turnOnPush() {
  const { data: key } = await http.get("/api/push/key");
  if (!key?.configured) return "not-configured";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "blocked" : "off";
  const reg = await registration();
  if (!reg) return "unsupported";
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key.public_key) });
  await http.post("/api/push/subscribe", sub.toJSON());
  return "on";
}

/** Off for this device: the backend forgets it, and the browser drops it. */
export async function turnOffPush() {
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
