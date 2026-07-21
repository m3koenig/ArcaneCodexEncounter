// Cached die App-Shell, damit die PWA nach dem ersten Laden auch offline läuft.

const CACHE_NAME = 'acencounter-v1';
const APP_SHELL = [
  './',
  './index.html', 
  './manifest.json'
  // Icons sind als Data-URI direkt in index.html eingebettet,
  // brauchen also keine eigenen Cache-Einträge mehr.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Cache-first, mit Netzwerk-Fallback (und Cache-Update im Hintergrund)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached); // offline und nicht im Cache -> gibt es leider nicht

      return cached || fetchPromise;
    })
  );
});