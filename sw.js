// 潮位グラフ: オフライン用 Service Worker
// 1回オンラインで開くと、ページ一式を端末に保存します。
// 電波があるときは最新版を取りに行き、3秒以内に取れなければ保存済みの版を表示します。
const CACHE = 'tide-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => {
      if (res.ok) cache.put(r, res.clone());
      return res;
    });
    net.catch(() => {});
    if (!hit) return net;
    return Promise.race([net, new Promise(res => setTimeout(() => res(hit), 3000))]).catch(() => hit);
  })());
});
