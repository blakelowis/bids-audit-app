const CORE_CACHE = 'birds-hub-core-v37';
const DYNAMIC_CACHE = 'birds-hub-dynamic-v37';

// Bare minimum required to boot the app offline initially.
// We DO NOT put heavy CDNs here so we don't block the installation.
const PRECACHE_URLS = [
  './',
  './index_v40_FORENSIC_DEEP_DIVE.html',
  './manifest.json',
  './icon-192.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.error('Core cache pre-load failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  // Clear out old caches when a new version of the service worker takes over
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CORE_CACHE && name !== DYNAMIC_CACHE) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // STRATEGY 1: CACHE FIRST (Lazy Loading for Heavy CDNs & Fonts)
  // If we have it in cache, return it immediately. If not, fetch it, cache it, and return it.
  const isCDN = [
    'cdn.tailwindcss.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ].some(domain => url.origin.includes(domain));

  if (isCDN) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Instant load from Indexed Cache
        }
        return fetch(event.request).then((networkResponse) => {
          // Clone the response because it's a stream and can only be consumed once
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }).catch((err) => console.warn('Offline and asset not dynamically cached yet:', event.request.url));
      })
    );
    return;
  }

  // STRATEGY 2: NETWORK FIRST (For HTML shell and local API/data calls)
  // Always try to get the most up-to-date app/data first. Fallback to cache if offline.
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update the dynamic cache with the freshest version
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Network failed (offline), fetch the last known good state from cache
          return caches.match(event.request);
        })
    );
  }
});