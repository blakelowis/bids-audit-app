/* Birds Executive Hub — Single-file App Shell SW */
const CACHE_NAME = 'birds-exec-hub-single-v2';

const APP_SHELL = [
 './image_839072.png',
 './',
 './index.html',
 './manifest.json',
 './icon-192.png',
 './icon-512.png'
];

const EXTERNAL_ASSETS = [
 "https://cdn.jsdelivr.net/npm/chart.js",
 "https://cdn.tailwindcss.com",
 "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];

async function cacheOne(cache, url) {
  try {
    const req = new Request(url, { mode: 'no-cors' });
    const res = await fetch(req);
    await cache.put(url, res);
    return true;
  } catch {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map(u => cache.add(u)));
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

  // Page navigation → offline fallback
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(req);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        return (await cache.match('./index.html')) || (await cache.match('./'));
      }
    })());
    return;
  }

  // Cache first
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req) || await cache.match(req.url);
    if (cached) return cached;

    try {
      const res = await fetch(req);
      if (res) cache.put(req, res.clone());
      return res;
    } catch {
      return new Response("Offline", { status: 503 });
    }
  })());
});