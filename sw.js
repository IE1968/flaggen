// Service Worker: speichert das Spiel und die geladenen Bibliotheken/Kartendaten,
// damit es nach dem ersten Start auch offline läuft.
const CACHE = 'flaggenspiele-v1';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // Eigene Dateien: erst Netz (für Updates), sonst Cache
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else {
    // CDN (Flaggen, Karte, d3, Schrift): erst Cache, sonst Netz und merken
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
      return r;
    })));
  }
});
