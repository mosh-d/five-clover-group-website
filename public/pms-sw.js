// The PMS app's service worker (owner, 2026-11-05) - what makes the PMS an
// installable app, and what shows notifications when it isn't open.
// Scope: /pms only. The public website is untouched.
//
// - Pages: always from the network, so the PMS is never stale; with no
//   network, the "you're offline" page instead of the browser's error.
// - Nothing else is cached: data, scripts and styles come from the network
//   as they do without the app.
// - Push: shows what the backend sent (title, body, tag, where to go), and a
//   tap opens or focuses the PMS there.

const VERSION = "pms-sw-1";
const OFFLINE_URL = "/pms-offline.html";
const PRECACHE = [OFFLINE_URL, "/pms-icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate") return;
  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
});

self.addEventListener("push", (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = { body: event.data ? event.data.text() : "" };
  }
  const title = message.title || "Five Clover PMS";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: message.body || "",
      tag: message.tag || undefined,
      renotify: Boolean(message.tag),
      icon: "/pms-icons/icon-192.png",
      badge: "/pms-icons/badge-96.png",
      data: { url: message.url || "/pms" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/pms", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => new URL(c.url).pathname.startsWith("/pms"));
      if (open) {
        return open.focus().then((c) => (c && "navigate" in c ? c.navigate(target) : c));
      }
      return self.clients.openWindow(target);
    }),
  );
});
