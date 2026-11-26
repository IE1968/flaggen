// Service Worker: holt eigene Dateien immer frisch vom Server (an GitHubs Zwischenspeicher vorbei)
// und merkt sich Bibliotheken/Kartendaten, damit das Spiel auch offline läuft.
const CACHE = 'weltreise-v7';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // Eigene Dateien: immer frisch vom Server, nur offline aus dem Speicher
    e.respondWith(fetch(e.request.url, {cache: 'no-store'}).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else {
    // Fremde Bibliotheken (Flaggen, Karte, d3, Schrift): aus dem Speicher, sonst laden und merken
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
      return r;
    })));
  }
});
