const CACHE = 'albert-os-v1';
const STATIC = [
  '/',
  '/chat',
  '/tasks',
  '/agents',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Never cache API routes or POST requests
  if (url.pathname.startsWith('/api/') || request.method !== 'GET') return;

  e.respondWith(
    fetch(request)
      .then(res => {
        // Cache successful page navigations
        if (res.ok && (request.mode === 'navigate' || url.pathname.startsWith('/_next/static/'))) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then(r => r || caches.match('/')))
  );
});
