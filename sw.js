const CACHE_NAME = 'birds-hub-v37-cache';

// Core assets to pre-cache immediately on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// --- 1. INSTALL EVENT ---
self.addEventListener('install', (event) => {
  // skipWaiting forces the waiting service worker to become active immediately.
  // This prevents users from getting stuck on an old version of the app.
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// --- 2. ACTIVATE EVENT ---
self.addEventListener('activate', (event) => {
  // Clean up any old caches from previous versions
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open pages immediately
  );
});

// --- 3. FETCH EVENT ---
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // STRATEGY A: Cache First (falling back to network) for images/icons
  if (requestUrl.pathname.match(/\.(png|jpe?g|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // STRATEGY B: Network First (falling back to cache) for HTML, JS, and Data
  // This is crucial for dashboards. It guarantees the user gets the latest parsing 
  // logic and weekly data if they have an internet connection.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If the network fetch is successful, clone the response and update the cache
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // If the network fails (offline), fall back to the last cached version
        console.log('[Service Worker] Network failed, serving from cache:', event.request.url);
        return caches.match(event.request);
      })
  );
});