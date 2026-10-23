/* بابيتو شات — عمل بدون إنترنت: نخزّن الصفحة والخطوط، والـ API والشات يبقون أونلاين فقط */
const CACHE = 'babito-v1';
const SHELL = ['/', '/index.html', '/manifest.json', '/lang.js?v=2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin && (u.pathname.startsWith('/api/') || u.pathname.startsWith('/ws') || u.pathname.startsWith('/uploads'))) return;   // دايماً من السيرفر
  if (r.mode === 'navigate') {   // الصفحة: الأحدث أول، وإذا ماكو نت من الكاش
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('/index.html', cp)); return res; }).catch(() => caches.match('/index.html').then(m => m || caches.match('/'))));
    return;
  }
  if (u.origin === location.origin || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {   // ثابتات: من الكاش وتتحدّث بالخلفية
    e.respondWith(caches.match(r).then(m => {
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => m);
      return m || net;
    }));
  }
});
