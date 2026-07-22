// Codex Initiative - Service Worker
// Cached: nur die App-Hülle selbst. Alle echten Daten (Kämpfer, Waffen,
// Fertigkeiten, laufender Kampf) liegen in localStorage, nicht hier.

const CACHE_NAME = "acencounter-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./default-database.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first, mit Netzwerk-Fallback (und Netzwerk-Update im Hintergrund).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
