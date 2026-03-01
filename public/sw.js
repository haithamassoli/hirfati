/// <reference lib="webworker" />

const CACHE_NAME = "hirfati-v1";
const OFFLINE_URL = "/offline";

// Static assets to cache on install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: precache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for pages, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Skip API routes and Convex requests
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) {
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".json") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // HTML pages: network-first with offline fallback
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful HTML responses
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }
});

// Push notification received
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "حرفتي",
      body: event.data.text(),
      icon: "/icons/icon-192.png",
    };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    dir: "rtl",
    lang: "ar",
    tag: data.tag || "hirfati-notification",
    data: {
      url: data.url || "/dashboard",
      type: data.type || "general",
      jobId: data.jobId,
    },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title || "حرفتي", options));
});

// Notification click: deep-link to relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.url || "/dashboard";

  // Build deep-link URL based on notification type
  if (notificationData.type === "new_message" && notificationData.jobId) {
    targetUrl = `/dashboard/jobs/${notificationData.jobId}`;
  } else if (notificationData.type === "new_quote" && notificationData.jobId) {
    targetUrl = `/dashboard/requests/${notificationData.jobId}`;
  } else if (
    notificationData.type === "quote_accepted" ||
    notificationData.type === "quote_rejected"
  ) {
    targetUrl = `/dashboard/jobs`;
  } else if (notificationData.type === "job_status_change" && notificationData.jobId) {
    targetUrl = `/dashboard/jobs/${notificationData.jobId}`;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(targetUrl);
      })
  );
});
