const CACHE_NAME = 'birds-hub-v2';

// 1. Hardcoded Assets (Everything sitting in your GitHub repo + CDNs)
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './image_839072.png', // Your logo
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_ASSETS);
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
            return caches.delete(name); // Clears old versions when you update
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // 2. Dynamic Caching: The engine that grabs Google Fonts automatically
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return the cached version if we already saved it
      if (cachedResponse) {
        return cachedResponse; 
      }

      // If it's not in the cache, fetch it from the internet
      return fetch(event.request).then((networkResponse) => {
        // Check if the request is valid before caching
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        // Clone the response and save it to the cache for next time
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        console.warn('Network fetch failed, and asset is not in cache:', event.request.url);
      });
    })
  );
});