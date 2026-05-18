const CACHE_NAME = 'trazapp-v2';
const OFFLINE_URL = '/offline.html';

// Solo assets ESTÁTICOS garantizados. NO incluir páginas protegidas
// (/dashboard) ni redirecciones (/), porque cache.addAll es atómico y
// una sola falla aborta toda la instalación del service worker.
const STATIC_ASSETS = [
  '/manifest.json',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/logo_normal.webp',
  '/Logohorizontal.png',
];

// Install: cachea cada asset de forma individual y tolerante a fallos.
// NO se hace skipWaiting automático: el nuevo SW queda "waiting" hasta que
// el usuario confirme la actualización desde el banner propio de la app.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset)))
    )
  );
});

// La app envía este mensaje al pulsar "Actualizar" en el banner propio
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate: limpia caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

// Solo cachea respuestas correctas y cacheables
function isCacheable(response) {
  return (
    response &&
    response.ok &&
    (response.type === 'basic' || response.type === 'default')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Network-first para la API. No cachear errores (4xx/5xx) ni descargas
  // de archivos protegidos (requieren Authorization, no sirven offline).
  if (url.pathname.startsWith('/api')) {
    if (url.pathname.startsWith('/api/files')) {
      return; // dejar pasar a la red sin tocar caché
    }
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheable(response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first para assets estáticos
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (isCacheable(response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first para páginas HTML, con fallback offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheable(response)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match(OFFLINE_URL))
      )
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
    },
    actions: [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'TrazApp', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});
