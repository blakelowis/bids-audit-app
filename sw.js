const STATIC='birds-static-v5';
const DYNAMIC='birds-dynamic-v5';

self.addEventListener('install', e=>{
 self.skipWaiting();
 e.waitUntil(caches.open(STATIC).then(c=>c.addAll([
  '/', '/index.html', '/manifest.json'
 ])));
});

self.addEventListener('activate', e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(k=>![STATIC,DYNAMIC].includes(k)).map(k=>caches.delete(k))
 )));
 self.clients.claim();
});

self.addEventListener('fetch', e=>{
 if(e.request.method!=='GET') return;

 e.respondWith(
  fetch(e.request).then(res=>{
    const copy=res.clone();
    caches.open(DYNAMIC).then(c=>c.put(e.request, copy));
    return res;
  }).catch(()=>caches.match(e.request))
 );
});
