const CACHE_NAME = 'birds-hub-v33-cache';
const OFFLINE_URL = './index.html'; // fallback shell

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',

  // Keep CDNs for now (we’ll make them more resilient)
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];


// ✅ INSTALL (safe caching)
self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Safe caching (won’t fail if one URL fails)
      await Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      );

      console.log('[SW] Install complete');
    })()
  );
});


// ✅ ACTIVATE (clean old caches properly)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );

      await self.clients.claim();
    })()
  );
});


// ✅ FETCH (improved strategies)
self.addEventListener('fetch', (event) => {

  if (event.request.method !== 'GET') return;

  const req = event.request;

  // ✅ Handle navigation (CRITICAL for offline app)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => res)
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ✅ External (CDN) → cache-first (fail-safe)
  if (req.url.startsWith('https://')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // ✅ Default → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req));
});


// ✅ STRATEGY: Cache First (for CDNs)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.log('[SW] CDN failed:', request.url);
    return cached || Response.error();
  }
}


// ✅ STRATEGY: Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then(response => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      console.log('[SW] Network failed for:', request.url);
      return cached;
    });

  return cached || networkFetch || caches.match(OFFLINE_URL);
}
``