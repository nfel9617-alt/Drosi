// دروسي - Service Worker: يخزن الواجهة والصور المقروءة لتعمل عند ضعف الإنترنت
const V = 'darsi-v1', M = 'darsi-media';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V && x !== M).map(x => caches.delete(x)))).then(() => self.clients.claim())));
async function trim(c) { const k = await c.keys(); if (k.length > 150) await c.delete(k[0]); }
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.hostname.includes('script.google')) return; // لا نخزن طلبات الخادم
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(V).then(k => k.put('index.html', c)); return x; }).catch(() => caches.match('index.html')));
  } else if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(V).then(k => k.put(r, c)); return x; }).catch(() => caches.match(r)));
  } else if (['image', 'font', 'style'].includes(r.destination)) {
    e.respondWith(caches.open(M).then(async c => {
      const m = await c.match(r);
      const n = fetch(r).then(x => { if (x.ok || x.type === 'opaque') { c.put(r, x.clone()); trim(c); } return x; }).catch(() => m);
      return m || n;
    }));
  }
});
