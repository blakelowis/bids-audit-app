/* Birds Executive Hub — Single-file App Shell SW */
const CACHE_NAME = 'birds-exec-hub-single-v1';

// App shell: only the entry points required to boot the app
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Third-party dependencies (cached on install if reachable)
const EXTERNAL_ASSETS = [
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Outfit:wght@700;800&display=swap"
];

async function cacheOne(cache, url) {
  try {
    // Use no-cors for cross-origin so the fetch succeeds and returns an opaque response.
    const req = new Request(url, { mode: 'no-cors', credentials: 'omit', cache: 'reload' });
    const res = await fetch(req);
    // Opaque responses have status 0 but are still cacheable.
    await cache.put(url, res);
    return true;
  } catch (e) {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Cache app shell safely
    await Promise.allSettled(APP_SHELL.map(u => cache.add(u)));
    // Best-effort cache of third-party assets
    await Promise.allSettled(EXTERNAL_ASSETS.map(u => cacheOne(cache, u)));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const req = event.request;
  const url = new URL(req.url);

  // Navigate requests: offline-first app shell
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(req);
        // Update cached shell page when online
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        return (await cache.match('./index.html')) || (await cache.match('./'));
      }
    })());
    return;
  }

  // For everything else: cache-first, then network, then fall back.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Match by full request, then by URL string (helps for cached external assets)
    const cached = await cache.match(req) || await cache.match(req.url);
    if (cached) return cached;

    try {
      const res = await fetch(req);
      // Cache successful same-origin responses and opaque cross-origin responses
      try {
        if (res) {
          cache.put(req, res.clone());
        }
      } catch (_) {}
      return res;
    } catch (e) {
      // As a last resort, return the app shell for same-origin HTML requests
      if (url.origin === self.location.origin && (req.headers.get('accept')||'').includes('text/html')) {
        return (await cache.match('./index.html')) || (await cache.match('./'));
      }
      throw e;
    }
  })());
});