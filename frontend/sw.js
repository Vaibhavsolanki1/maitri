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
      return response || fetch(event.request);
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
