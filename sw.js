// Cuentas Claras: guarda la app en el dispositivo para que funcione sin conexión.
// Al publicar una versión nueva, sube el número de CACHE para que los móviles la descarguen.
const CACHE = 'cuentas-claras-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'xlsx.full.min.js', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Tipografías: primero la copia guardada.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; })))
    );
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Archivos de la app: respuesta inmediata desde la copia y actualización en segundo plano.
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(req, { ignoreSearch: true }).then((hit) => {
        const net = fetch(req).then((res) => { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(() => hit || c.match('index.html'));
        return hit || net;
      })
    )
  );
});
