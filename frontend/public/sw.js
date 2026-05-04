// XuSport — service worker (manual, no build integration).
// Strategy summary:
//   * navigations (HTML)      → NetworkFirst, fall back to /offline.html
//   * /_next/static/* + /icons → CacheFirst (immutable)
//   * audio/image/font assets → CacheFirst
//   * everything else GET     → StaleWhileRevalidate (best-effort)
//   * API + non-GET requests  → bypass (Dexie + sync-queue handle offline)

const VERSION = 'xusport-v1';
const RUNTIME = `${VERSION}-runtime`;
const STATIC = `${VERSION}-static`;
const APP_SHELL = ['/', '/offline.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Don't intercept the API — Dexie + sync queue handle offline writes,
  // and the API is on a different origin in dev anyway.
  if (
    url.pathname.startsWith('/api/') ||
    /^https?:\/\/[^/]+\/api\//.test(req.url)
  ) {
    return;
  }

  // Cross-origin: best-effort network only, no caching.
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, '/offline.html'));
    return;
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:js|css|woff2?|ttf|otf|eot|svg|png|jpe?g|gif|webp|avif|ico|mp3|wav|ogg)$/.test(
      url.pathname,
    )
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(req, fallbackUrl) {
  const cache = await caches.open(RUNTIME);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    if (fallbackUrl) {
      const offline = await caches.match(fallbackUrl);
      if (offline) return offline;
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}
