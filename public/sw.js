// AndesMovi Service Worker - Push Notifications & Background Sync
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
