/* ===============================
   LUCKY BOX SERVICE WORKER
   SAFE • CLEAN • UPDATE FRIENDLY
================================ */

const CACHE_VERSION = "v2"; // 🔁 CANZA WANNAN DUK LOKACIN DA KA GYARA
const CACHE_NAME = `luckybox-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/tasks.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

/* ================= INSTALL ================= */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // 👈 force new version
});

/* ================= ACTIVATE ================= */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim(); // 👈 take control immediately
});

/* ================= FETCH ================= */
self.addEventListener("fetch", event => {
  const { request } = event;

  // ❌ NEVER CACHE API CALLS
  if (request.url.includes("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // ✅ CACHE FIRST FOR STATIC FILES
  event.respondWith(
    caches.match(request).then(cached => {
      return (
        cached ||
        fetch(request).then(response => {
          return response;
        })
      );
    })
  );
});
