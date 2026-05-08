const CACHE_NAME = "maitri-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/details.html",
  "/yoga.html",
  "/css/styles.css",
  "/js/app.js",
  "/js/yoga.js",
  "/js/details.js",
  "/js/flow-field-background.js",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("/api/") || event.request.url.includes("/chat")) {
    return; // Don't cache API endpoints
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      
      return fetch(event.request).then((networkResponse) => {
        // Cache dynamically fetched assets
        if (networkResponse && networkResponse.status === 200 && (networkResponse.type === "basic" || networkResponse.type === "cors")) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline if not in cache
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
