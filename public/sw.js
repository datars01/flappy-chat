/* بابيتو شات — عمل بدون إنترنت: الصفحة والألعاب (المزرعة وركض ربش وغيرها) والخطوط تنخزن بالجهاز.
   الـ API والشات والمنتجع أونلاين فقط. تقدم الألعاب ينحفظ بالجهاز ويتزامن مع الحساب من يرجع النت */
const CACHE = 'babito-v12';
const SHELL = ['/', '/index.html', '/manifest.json', '/farm.html', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(SHELL.map(u => c.add(u).catch(() => {})));
    try {   // كل سكربتات الألعاب المذكورة بالصفحة + الخطوط، حتى تشتغل حتى لو ما انفتحت قبل
      const html = await (await fetch('/index.html', { cache: 'no-store' })).text();
      const js = [...html.matchAll(/src="(\/[^"]+\.js(?:\?v=[\w.]+)?)"/g)].map(m => m[1]);
      const css = [...html.matchAll(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
      await Promise.all(js.map(u => c.add(u).catch(() => {})));
      await Promise.all(css.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
    } catch (er) {}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const fromCache = r => caches.match(r).then(m => m || caches.match(r, { ignoreSearch: true }));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin && (u.pathname.startsWith('/api/') || u.pathname.startsWith('/ws') || u.pathname.startsWith('/uploads') || /^\/(app|install|download|android|install-android|ios|ios\.mobileconfig|install-ios|babito\.apk)\/?$/.test(u.pathname))) return;   // دايماً من السيرفر
  if (r.mode === 'navigate' && (u.pathname === '/' || u.pathname === '/index.html' || u.pathname === '/farm.html')) {   // الصفحات: الأحدث أول، وإذا ماكو نت من الكاش
    const key = u.pathname === '/farm.html' ? '/farm.html' : '/index.html';
    e.respondWith(fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(key, cp)); } return res; }).catch(() => caches.match(key).then(m => m || caches.match('/'))));
    return;
  }
  if (u.origin === location.origin || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {   // ثابتات: من الكاش وتتحدّث بالخلفية
    e.respondWith(caches.match(r).then(m => {
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => m || fromCache(r));
      return m || net;
    }));
  }
});
