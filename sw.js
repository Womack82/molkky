// Service worker : garde l'app en cache pour qu'elle marche sans réseau.
// Changer CACHE à chaque mise à jour des fichiers listés pour forcer les téléphones à les recharger.
const CACHE = 'molkky-3.2'; // suit la version de l'app (APP_VERSION dans index.html)
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/web/favicon.ico',
  'icons/web/favicon-16.png',
  'icons/web/favicon-32.png',
  'icons/web/apple-touch-icon.png',
  'icons/web/icon-192.png',
  'icons/web/icon-512.png',
  'icons/web/icon-maskable-192.png',
  'icons/web/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Page : réseau d'abord (pour avoir la dernière version), cache si hors ligne
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./', { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
    );
    return;
  }

  // Le reste (icônes, manifest, police Plus Jakarta Sans) : cache d'abord, puis réseau
  const url = new URL(req.url);
  const cacheable = url.origin === self.location.origin ||
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!cacheable) return;

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
      }
      return res;
    }))
  );
});
