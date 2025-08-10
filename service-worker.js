// Simple service worker for offline caching
const CACHE = "quicklift-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e)=>{
  e.waitUntil(caches.keys().then(keys=> Promise.all(keys.map(k=> k===CACHE? null : caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e)=>{
  const url = new URL(e.request.url);
  if(ASSETS.some(a=> url.pathname.endsWith(a.replace("./","/")))){
    e.respondWith(caches.match(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(res=> res || fetch(e.request).then(resp=>{
      const copy = resp.clone();
      caches.open(CACHE).then(c=> c.put(e.request, copy));
      return resp;
    }).catch(()=> caches.match("./index.html")))
  );
});
