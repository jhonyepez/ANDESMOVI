// AndesMovi Service Worker - Offline Cache, Map Tiles Cache & Push Notifications
const STATIC_CACHE_NAME = 'andesmovi-static-v2';
const MAP_TILES_CACHE_NAME = 'andesmovi-map-tiles-v2';
const MAX_TILES_IN_CACHE = 400;

// Essential app shell assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial fallback:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== MAP_TILES_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper to keep map tile cache from growing indefinitely
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      // Remove the oldest 50 items
      const deleteCount = Math.min(50, keys.length - maxItems);
      for (let i = 0; i < deleteCount; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch {}
}

// Fetch interception: Cache-First for Map Tiles, Stale-While-Revalidate for Static Assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. MAP TILES CACHING (OpenTopoMap, ESRI World Topo, CartoDB, OpenStreetMap)
  const isMapTile =
    url.hostname.includes('tile.opentopomap.org') ||
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('basemaps.cartocdn.com') ||
    url.pathname.includes('/tile/');

  if (isMapTile) {
    event.respondWith(
      caches.open(MAP_TILES_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(req);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(req, { mode: 'cors' });
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(req, networkResponse.clone());
            // Periodic trim check
            if (Math.random() < 0.05) {
              trimCache(MAP_TILES_CACHE_NAME, MAX_TILES_IN_CACHE);
            }
          }
          return networkResponse;
        } catch (fetchErr) {
          // If offline or network error, return cached tile if any or fallback
          if (cachedResponse) return cachedResponse;
          return new Response('', { status: 408, statusText: 'Tile Offline' });
        }
      })
    );
    return;
  }

  // 2. STATIC ASSETS CACHING (Stale-While-Revalidate for same-origin JS, CSS, SVG, PNG, fonts)
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname === '/manifest.json' ||
      url.pathname === '/');

  if (isStaticAsset) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(req, networkRes.clone());
            }
            return networkRes;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }
});

// Push notification event listener
self.addEventListener('push', (event) => {
  let payload = {
    title: 'ANDESMOVI Ecuador',
    body: 'Actualización en tiempo real de tu viaje o mensaje.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: {},
  };

  if (event.data) {
    try {
      const json = event.data.json();
      payload = { ...payload, ...json };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    badge: payload.badge || '/icon.svg',
    vibrate: [200, 100, 200, 100, 200],
    tag: payload.tag || `andesmovi-${Date.now()}`,
    renotify: true,
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin) && 'navigate' in client) {
            client.focus();
            return;
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
