/* بابيتو شات — تشغيل الألعاب (المزرعة، الساحة الحربية) كصفحة كاملة بالآيباد والآيفون بدل الإطار (iframe)،
   لأن سفاري يخرب حجم الإطار وتطلع الشاشة فاضية. الحفظ بحساب اللاعب يصير مباشرة ويا السيرفر. */
(function () {
  'use strict';
  if (!/[?&]top=1/.test(location.search)) return;
  const KEY = (document.currentScript && document.currentScript.dataset.key) || 'farm';
  window.GB_TOP = true; document.documentElement.classList.add('gbTop');
  let auth = null; try { const a = JSON.parse(localStorage.getItem('flappyAuth') || 'null'); if (a && a.token && a.name) auth = a; } catch (e) {}
  const H = () => { const h = { 'Content-Type': 'application/json' }; if (auth) h.Authorization = 'Bearer ' + auth.token; return h; };
  const self = m => { try { window.postMessage(m, location.origin); } catch (e) {} };
  let pushT = 0, pending = null;
  window.GB = {
    post(msg) {
      msg = String(msg); const pre = KEY + ':save:';
      if (msg.indexOf(pre) === 0 && auth) { pending = msg.slice(pre.length); clearTimeout(pushT); pushT = setTimeout(flush, 600); }
    }
  };
  function flush() { if (!pending || !auth) return; const d = pending; pending = null; fetch('/api/gs', { method: 'POST', headers: H(), body: '{"k":"' + KEY + '","d":' + d + '}', keepalive: true }).catch(() => { pending = pending || d; }); }
  addEventListener('pagehide', flush); document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  async function boot() {
    if (!auth) { self(KEY + ':gs:' + JSON.stringify({ acct: '', ok: false, srv: null })); return; }
    try { const me = await (await fetch('/api/me', { headers: H(), cache: 'no-store' })).json(); if (me && me.admin) self(KEY + ':adm:1'); } catch (e) {}
    try { const r = await (await fetch('/api/gs', { headers: H(), cache: 'no-store' })).json(); const g = (r && r.gs && r.gs[KEY]) || null; self(KEY + ':gs:' + JSON.stringify({ acct: auth.name, ok: true, srv: g ? g.d : null })); } catch (e) {}
  }
  // زر الرجوع للعبة الرئيسية
  function backBtn() { const b = document.createElement('a'); b.href = '/'; b.textContent = '→ رجوع'; b.setAttribute('aria-label', 'رجوع لبابيتو شات');
    b.style.cssText = 'position:fixed;z-index:2147483000;top:calc(env(safe-area-inset-top,0px) + 8px);left:calc(env(safe-area-inset-left,0px) + 8px);padding:7px 12px;border-radius:12px;background:rgba(10,14,18,.72);color:#fff;font:800 13px Cairo,system-ui,sans-serif;text-decoration:none;border:1px solid rgba(255,255,255,.35);direction:rtl';
    b.addEventListener('click', e => { flush(); }); document.body.appendChild(b); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { backBtn(); setTimeout(boot, 300); }); else { backBtn(); setTimeout(boot, 300); }
})();
