const C = 'flappy-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// نمرّر كل شي للشبكة؛ الصفحة الرئيسية فقط تنحفظ نسخة احتياطية إذا انقطع الإنترنت
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return;
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put('/', cp)); return res; }).catch(() => caches.match('/')));
});
