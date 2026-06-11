const CACHE_NAME = 'birds-hub-v3'; // Bumped version to force update

const APP_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './image_839072.png', 
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  // Fault-tolerant caching: Downloads one by one. A single 404 won't break the whole app.
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (let asset of APP_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('Failed to cache asset (App will still work):', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Cleans out the broken old cache
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      // Crucial for GitHub Pages: If the browser asks for the root folder offline, hand it index.html
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html').then(idx => {
          if (idx) return idx;
          return fetch(event.request);
        });
      }

      // Dynamic caching for Google Fonts and missing files
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        console.warn('User is offline, and asset is missing from cache:', event.request.url);
      });
    })
  );
});