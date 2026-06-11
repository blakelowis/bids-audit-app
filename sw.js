const CACHE_NAME = 'birds-hub-v4'; 

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
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (let asset of APP_ASSETS) {
        try {
          // THE FIX: Use 'no-cors' for external http links to bypass the security block
          const request = new Request(asset, { 
            mode: asset.startsWith('http') ? 'no-cors' : 'cors' 
          });
          const response = await fetch(request);
          await cache.put(request, response);
        } catch (err) {
          console.warn('Failed to cache asset:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
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

      // Crucial for GitHub Pages routing
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html').then(idx => {
          if (idx) return idx;
          return fetch(event.request);
        });
      }

      return fetch(event.request).then((networkResponse) => {
        // Automatically cache any other files (like Google Fonts) as they load
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