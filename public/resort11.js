/* =====================================================================
   resort11 — 👕 البوتيك: محل ملابس بواجهة زجاج كدام محل سبيناغ (مكان لوحة «قريباً» الأولى)
   الملابس نفسها تنكتب بيد بابي بملف clothes/items.js (صور PNG أو رسم بالكود)،
   وتنلبس على الشخصية (نوع جديد cl) والكل يشوفها، وتنشرى بدولار المنتجع 💵
   ===================================================================== */
(function () {
  'use strict';
  if (typeof RM === 'undefined' || typeof rmShopId !== 'function' || typeof RM_WEAR === 'undefined') return;
  const INFO = Object.assign({ name: 'بوتيك بابي', keeper: 'لولو', hello: 'هلا بيك بالبوتيك! 👕' }, window.BABI_CLOTHES_SHOP || {});
  const SID = 9, SH = { x: 1650, y: 830 }, HI = { x0: 78000, x1: 78440, dx: 78220, vx0: 77985, vx1: 78455, vy0: 120, vy1: 632 };
  const K = { x: 78352, y: 396, say: null, wave: 0, idleT: 0, near: false }, PAL = { fur: '#ffe3f0', bel: '#fff7fb', ap: '#ff5ca8', bow: '#7b3fe4', ol: '#5a2a4a', ic: '👕', glass: 1 };
  const B = { door: 0, near: false, sel: '' };

  /* ---------- 1) الملابس من ملف بابي ---------- */
  const IMG = {}, CL = [];
  (window.BABI_CLOTHES || []).forEach(it => {
    if (!it || !/^c_[a-z0-9_]{1,10}$/i.test(it.k) || RM_WEARD[it.k]) return;
    const w = { k: it.k, n: String(it.n || it.k), s: 'cl', p: Math.max(0, +it.p || 0), img: it.img || '', draw: typeof it.draw === 'function' ? it.draw : null };
    if (w.img) { const im = new Image(); im.src = '/' + w.img.replace(/^\/+/, ''); IMG[w.k] = im; }
    RM_WEAR.push(w); RM_WEARD[w.k] = w; CL.push(w);
  });
  RM_WSLOT.cl = '👕 ملابس';
  function clDraw(c, k, T) {   // القدم عند (0,0) — الصورة 400×800 = 40×80 بوحدات العالم
    const w = RM_WEARD[k]; if (!w) return; c.save();
    try { if (w.draw) w.draw(c, T || 0); else { const im = IMG[k]; if (im && im.complete && im.naturalWidth) c.drawImage(im, -20, -80, 40, 80); } } catch (e) {}
    c.restore();
  }
  window.babiClothDraw = clDraw;
  const itemOld = rmWearItem; rmWearItem = function (c, k, x, y, T) { if (k && k[0] === 'c' && k[1] === '_') { c.save(); c.translate(x, y); clDraw(c, k, T); c.restore(); return; } return itemOld(c, k, x, y, T); };
  const frontOld = rmWearFront; rmWearFront = function (c, o) {
    const W = o && o.wear; if (W && W.cl && !(o.hid && o !== RM.me && !(RM.myAdm || RM.isMod))) { c.save(); c.translate(o.x, o.y + (o.sit ? 12 : 0)); c.scale(o.dir || 1, 1); clDraw(c, W.cl, RM.T); c.restore(); }
    return frontOld(c, o);
  };
  const manqOld = rmManq; rmManq = function (c, x, y, s, wear) { manqOld(c, x, y, s, wear); if (wear && wear.cl) { c.save(); c.translate(x, y); c.scale(s, s); clDraw(c, wear.cl, RM.T); c.restore(); } };
  const sumOld = rmWearSum; rmWearSum = function () { const s = sumOld(), W = RM.me.wear || {}; if (!W.cl || !RM_WEARD[W.cl]) return s; return s.indexOf('✨ لابس: ') === 0 ? s.replace('✨ لابس: ', '✨ لابس: ' + RM_WEARD[W.cl].n + ' + ') : '✨ لابس: ' + RM_WEARD[W.cl].n; };
  function avPreview(g, k, x, y, s) {   // الشخصية الحقيقية لابسة القطعة
    g.save(); g.translate(x, y); g.scale(s, s);
    try { rmAvDraw(g, (RM.me && RM.me.av) || AVT.DEF, { t: RM.T, mv: 0, ph: 0, sit: 0, dance: 0, dt: 0, umb: 0, cold: 0, drink: 0, sip: 0, cup: '', burn: 0, char: 0, cseed: 0, hold: 0 }, 0); } catch (e) {}
    clDraw(g, k, RM.T); g.restore();
  }
  const cardOld = rmWearCard; rmWearCard = function (w, selKey, onSel) {
    const it = cardOld(w, selKey, onSel); if (w.s !== 'cl') return it;
    const cv = it.querySelector('canvas'); if (cv) { const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(2, 0, 0, 2, 0, 0); avPreview(g, w.k, 27, 64, 0.8); }
    return it;
  };

  /* ---------- 2) نشيل لوحة «قريباً» الأولى ونحط المحل مكانها ---------- */
  try { R3_SOLID.push({ x0: SH.x - 150, x1: SH.x + 150, y0: 660, y1: SH.y + 2 }); } catch (e) {}
  const near = () => { const m = RM.me; return !rmInShop() && m.y >= SH.y - 6 && Math.hypot(m.x - SH.x, (m.y - SH.y - 14) * 1.3) < 62; };
  const nearK = () => rmShopId() === SID && RM.me.y < 470 && Math.abs(RM.me.x - K.x) < 95;
  const nearExit = () => rmShopId() === SID && RM.me.y > 572 && Math.abs(RM.me.x - HI.dx) < 60;
  const say = (t, d) => rxSay(K, t, d);

  function win(c, wx, wy, ww, wh, side) {   // الزجاج: يبين جوّه (مانيكانات لابسة ملابس المحل + الناس اللي جوّه)
    const T = RM.T; c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
    let g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#fff6fb'); g.addColorStop(0.7, '#ffe3f0'); g.addColorStop(0.71, '#e9d6ff'); g.addColorStop(1, '#c9a8f0'); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
    c.fillStyle = '#c9a2ff'; c.fillRect(wx + 6, wy + 18, ww - 12, 2);
    const list = CL.length ? CL : [{ k: '' }], n = 3;
    for (let i = 0; i < n; i++) { const w = list[(i + side * n) % list.length], mx = wx + ww * (i + 0.5) / n; rmManq(c, mx, wy + wh - 6, 1, w.k ? { cl: w.k } : {}); }
    rmWinPeople(c, SID, HI, wx, wy, ww, wh, side, 'rgba(120,50,140,.5)');
    c.restore();
    c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip(); c.fillStyle = 'rgba(255,240,250,.12)'; c.fillRect(wx, wy, ww, wh); c.fillStyle = 'rgba(255,255,255,.4)'; const sh = ((T * 0.6 + 40) % (ww + 160)) - 80; c.beginPath(); c.moveTo(wx + sh, wy); c.lineTo(wx + sh + 16, wy); c.lineTo(wx + sh - 24, wy + wh); c.lineTo(wx + sh - 40, wy + wh); c.closePath(); c.fill(); c.restore();
    c.strokeStyle = '#fff'; c.lineWidth = 3.5; c.strokeRect(wx, wy, ww, wh); c.strokeStyle = '#7b3fe4'; c.lineWidth = 1.5; c.strokeRect(wx - 2, wy - 2, ww + 4, wh + 4); c.fillStyle = '#fff'; c.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
  }
  function outside(c) {
    const X = SH.x, Y = SH.y; if (!rxVis(X - 190, X + 190)) return; const x0 = X - 145, x1 = X + 145, top = 690, T = RM.T, m = RM.me, nd = (RM.dn && RM.dn.d) || 0;
    const nr = near() || Object.values(RM.others).some(o => rmShopId(o) === 0 && Math.hypot(o.x - X, (o.y - Y - 14) * 1.3) < 70);
    B.door += ((nr ? 1 : 0) - B.door) * 0.12; if (nr && !B.near && !rmInShop()) rxSnd([['sine', 1175, 1175, 0.2, 0.05], ['sine', 1568, 1568, 0.3, 0.04, 0.12]]); B.near = nr;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(X, Y + 3, 170, 12, 0, 0, 7); c.fill();
    let g = c.createLinearGradient(0, top, 0, Y); g.addColorStop(0, '#fbf4ff'); g.addColorStop(1, '#ead8fb'); c.fillStyle = g; c.fillRect(x0, top, 290, Y - top);
    c.strokeStyle = '#7b3fe4'; c.lineWidth = 2; c.strokeRect(x0, top, 290, Y - top);
    g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#5a26b8'); g.addColorStop(0.5, '#a36bff'); g.addColorStop(1, '#5a26b8'); c.fillStyle = g; c.fillRect(x0 - 5, Y - 14, 300, 14); c.fillRect(x0 - 10, top - 14, 310, 16); c.fillStyle = '#fff'; c.fillRect(x0 - 5, Y - 14, 300, 2);
    // اللافتة + نيون يضوي بالليل
    const sx0 = X - 135, sy0 = top - 84, sw = 270, shh = 56; rxRect(c, sx0, sy0, sw, shh, 14, '#2a1048'); c.strokeStyle = '#ff9ed2'; c.lineWidth = 2; c.shadowColor = '#ff5ca8'; c.shadowBlur = 4 + nd * 12; c.beginPath(); c.roundRect ? c.roundRect(sx0, sy0, sw, shh, 14) : c.rect(sx0, sy0, sw, shh); c.stroke(); c.shadowBlur = 0;
    const fl = 0.85 + 0.15 * Math.sin(T / 6); rxTxt(c, INFO.name + ' 👕', X, sy0 + 22, 'bold 20px Lalezar, Cairo, system-ui, Arial', '#fff', (8 + nd * 10) * fl, '#ff5ca8'); rxTxt(c, '👗 ملابس جديدة • الكل يشوفك ✨', X, sy0 + 43, 'bold 10px Cairo, Arial', '#e9d6ff', 5, '#a36bff');
    c.fillStyle = '#5a5a62'; c.fillRect(X - 60, sy0 + shh, 4, 18); c.fillRect(X + 56, sy0 + shh, 4, 18);
    // مظلة مموجة
    const aw = top + 2; for (let i = 0; i < 10; i++) { const ax = x0 - 5 + i * 30; c.fillStyle = i % 2 ? '#fff' : '#a36bff'; c.fillRect(ax, aw, 30, 16); c.beginPath(); c.arc(ax + 15, aw + 16, 15, 0, Math.PI); c.fill(); }
    win(c, x0 + 12, 730, X - 40 - (x0 + 12), 82, 0); win(c, X + 40, 730, x1 - 12 - (X + 40), 82, 1);
    // باب زجاج ينفتح من تقرب
    const dx0 = X - 30, dy0 = 730, dw = 60, dh = Y - 14 - dy0, op = B.door; c.fillStyle = '#3a1a5a'; c.fillRect(dx0, dy0, dw, dh); g = c.createLinearGradient(0, dy0, 0, dy0 + dh); g.addColorStop(0, '#fff6fb'); g.addColorStop(1, '#e9d6ff'); c.fillStyle = g; c.fillRect(dx0 + 3, dy0 + 3, dw - 6, dh - 3);
    [-1, 1].forEach(sd => { const pw = dw / 2 - 2, slide = op * (pw - 6), px = sd < 0 ? dx0 + 2 - slide : X + slide; c.save(); c.beginPath(); c.rect(dx0 - 30, dy0, dw + 60, dh); c.clip(); c.fillStyle = 'rgba(235,225,255,.55)'; c.fillRect(px, dy0 + 2, pw, dh - 2); c.strokeStyle = '#c9a2ff'; c.lineWidth = 2.4; c.strokeRect(px, dy0 + 2, pw, dh - 2); c.restore(); });
    c.strokeStyle = '#7b3fe4'; c.lineWidth = 3; c.strokeRect(dx0, dy0, dw, dh);
    if (op < 0.5) { c.save(); c.translate(X, dy0 + 18); c.rotate(Math.sin(T / 25) * 0.06); rxRect(c, -20, -7, 40, 13, 6, '#fff'); rxTxt(c, 'مفتوح 💜', 0, -0.5, 'bold 8px Cairo, Arial', '#7b3fe4'); c.restore(); }
    // ضوء بالليل جوّا الواجهة
    if (nd > 0.15) { c.save(); c.globalAlpha = nd * 0.35; c.fillStyle = '#ffd6f0'; c.beginPath(); c.ellipse(X, Y + 10, 150, 22, 0, 0, 7); c.fill(); c.restore(); }
    // أصص ورد
    [x0 - 18, x1 + 18].forEach(px => { c.fillStyle = '#a36bff'; c.beginPath(); c.moveTo(px - 10, Y - 16); c.lineTo(px + 10, Y - 16); c.lineTo(px + 7, Y); c.lineTo(px - 7, Y); c.closePath(); c.fill(); c.fillStyle = '#3fa34d'; c.beginPath(); c.arc(px, Y - 26, 11, 0, 7); c.fill(); c.fillStyle = '#ff9ed2'; [[-5, -30], [4, -27], [0, -21]].forEach(p => { c.beginPath(); c.arc(px + p[0], Y + p[1], 2.6, 0, 7); c.fill(); }); });
  }
  RM_DECOR.push({ y: SH.y, f: c => { try { outside(c); } catch (e) {} } });
  window.R11_SHOP = { x: SH.x, y: SH.y, name: INFO.name };

  /* ---------- 3) الدخول والطلوع ---------- */
  function enter() {
    const m = RM.me; if (m.sit || m.jump) return; if (RM.holds[rmMe()] && !RM.holdLead[rmMe()]) rmSend({ t: 'rm_hold', on: 0 }); if (m.dance) rmSetDance(0); RM.tapMk = null; RM.hold = false;
    m.x = m.tx = HI.dx + (Math.random() - 0.5) * 50; m.y = m.ty = 592; m.dir = 1; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1; rxSnd([['sine', 1568, 1568, 0.25, 0.05], ['sine', 2093, 2093, 0.3, 0.05, 0.12]]);
    const n = Object.values(RM.others).filter(o => rmShopId(o) === SID && !o.hid); showToast('👕 دخلت «' + INFO.name + '»' + (n.length ? ' — جوّه: ' + n.slice(0, 3).map(o => o.name).join('، ') : ''));
    setTimeout(() => { if (rmShopId() === SID) { K.wave = 90; say(INFO.hello, 260); } }, 450); rmPrompt(true);
  }
  function exit() { const m = RM.me; if (m.jump) return; RM.tapMk = null; RM.hold = false; m.x = m.tx = SH.x + (Math.random() - 0.5) * 40; m.y = m.ty = SH.y + 26; m.dir = 1; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1; rxSnd([['sine', 1568, 1175, 0.3, 0.05]]); close(); showToast('✨ طلعت من «' + INFO.name + '»'); rmPrompt(true); }

  /* ---------- 4) داخل المحل ---------- */
  function bg(c) {
    const X0 = HI.vx0, X1 = HI.vx1, W = X1 - X0, T = RM.T;
    let g = c.createLinearGradient(0, 120, 0, 344); g.addColorStop(0, '#f1e4ff'); g.addColorStop(1, '#fff7fb'); c.fillStyle = g; c.fillRect(X0, 120, W, 224);
    c.strokeStyle = 'rgba(163,107,255,.18)'; c.lineWidth = 1; for (let x = X0 + 10; x < X1; x += 22) { c.beginPath(); c.moveTo(x, 134); c.lineTo(x, 300); c.stroke(); }
    c.fillStyle = '#5a26b8'; c.fillRect(X0, 120, W, 12); c.fillStyle = '#ff9ed2'; c.fillRect(X0, 131, W, 3);
    rxTxt(c, INFO.name, HI.dx, 164, 'bold 26px Lalezar, Cairo, system-ui, Arial', '#fff', 14 * (0.85 + 0.15 * Math.sin(T / 5)), '#a36bff');
    // راكات ملابس: كل قطعة من ملف بابي تطلع معلّقة
    [[78020, 78190], [78250, 78300]].forEach(([a, b]) => { c.strokeStyle = '#d7a400'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(a, 204); c.lineTo(b, 204); c.stroke(); c.fillStyle = '#d7a400'; c.fillRect(a - 2, 200, 4, 96); c.fillRect(b - 2, 200, 4, 96); });
    CL.slice(0, 5).forEach((w, i) => { const hx = [78045, 78083, 78121, 78159, 78275][i], sw = Math.sin(T / 40 + i) * 0.04; c.strokeStyle = '#8a8a99'; c.lineWidth = 1; c.beginPath(); c.moveTo(hx, 204); c.lineTo(hx, 210); c.stroke(); c.save(); c.translate(hx, 258); c.rotate(sw); c.scale(1.3, 1.3); c.translate(0, 8); clDraw(c, w.k, T); c.restore(); });
    if (!CL.length) rxTxt(c, 'الراك فاضي… بابي راح يضيف ملابس قريباً ✨', 78110, 250, 'bold 10px Cairo, Arial', '#7b3fe4');
    // مراية كبيرة
    c.fillStyle = '#d7a400'; c.beginPath(); c.ellipse(78230, 250, 22, 42, 0, 0, 7); c.fill(); g = c.createLinearGradient(78212, 212, 78248, 290); g.addColorStop(0, '#eef6ff'); g.addColorStop(0.5, '#bcd6ee'); g.addColorStop(1, '#eef6ff'); c.fillStyle = g; c.beginPath(); c.ellipse(78230, 250, 18, 38, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.fillRect(X0, 300, W, 44); c.strokeStyle = '#efe0ff'; c.lineWidth = 1.5; for (let x = X0 + 8; x < X1 - 30; x += 46) c.strokeRect(x, 306, 38, 32); c.fillStyle = '#7b3fe4'; c.fillRect(X0, 340, W, 4);
    // أرضية خشب فاتح
    g = c.createLinearGradient(0, 344, 0, 632); g.addColorStop(0, '#f3e6d8'); g.addColorStop(1, '#e3cfb8'); c.fillStyle = g; c.fillRect(X0, 344, W, 288);
    c.strokeStyle = 'rgba(150,110,70,.18)'; c.lineWidth = 1; for (let y = 360; y < 632; y += 22) { c.beginPath(); c.moveTo(X0, y); c.lineTo(X1, y); c.stroke(); }
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(HI.dx - 10, 520, 110, 38, 0, 0, 7); c.fill(); c.fillStyle = '#e9d6ff'; c.beginPath(); c.ellipse(HI.dx - 10, 520, 98, 32, 0, 0, 7); c.fill();
    // صاحبة المحل ورا الكاونتر
    const nk = nearK(); if (nk && !K.near) { K.wave = 70; if (!K.say || K.say.t <= 0) say('دوس عليّ وأراويك الملابس 👕✨', 220); } K.near = nk;
    if (nk && (!K.say || K.say.t <= 0) && ++K.idleT > 560) { K.idleT = 0; say(['كل الملابس هنا سواها بابي بإيده ❤️', 'الملابس تنلبس فوك لبسك والكل يشوفها ✨', 'الدولارات من الصيد 🎣 كل 15 سمكة = 2💵'][Math.floor(Math.random() * 3)], 240); }
    if (K.wave > 0) K.wave--; rmGmzDraw(c, K.x, K.y, 1, K.wave > 0, PAL);
    g = c.createLinearGradient(0, 368, 0, 414); g.addColorStop(0, '#a36bff'); g.addColorStop(1, '#5a26b8'); c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(78284, 368, 148, 46, 6) : c.rect(78284, 368, 148, 46); c.fill(); c.fillStyle = '#ff9ed2'; c.fillRect(78280, 362, 156, 9);
    c.font = '11px sans-serif'; c.textAlign = 'center'; ['👕', '👖', '🧥', '👗', '🧢'].forEach((e, i) => c.fillText(e, 78300 + i * 29, 392));
    rmTagDraw(c, K.x, K.y - 112, INFO.keeper + ' 👕 صاحبة المحل', 'rgba(123,63,228,.95)');
  }
  function list() {
    const L = [], T = RM.T; [[78060, 480], [78120, 520], [78330, 560], [78400, 520]].forEach((p, i) => { const w = CL[i % Math.max(1, CL.length)]; L.push([p[1], c => { c.fillStyle = '#7b3fe4'; c.beginPath(); c.ellipse(p[0], p[1], 14, 3.6, 0, 0, 7); c.fill(); rmManq(c, p[0], p[1], 1.25, w ? { cl: w.k } : {}); if (w && i === 0) rmTagDraw(c, p[0], p[1] + 16, '✨ جديد', 'rgba(123,63,228,.92)'); }]); });
    return L;
  }
  function fg(c) {
    const X0 = HI.vx0, X1 = HI.vx1, D = HI.dx;
    c.fillStyle = '#5a26b8'; c.fillRect(X0, 612, D - 46 - X0, 20); c.fillRect(D + 46, 612, X1 - D - 46, 20); c.fillStyle = '#ff9ed2'; c.fillRect(X0, 612, X1 - X0, 3);
    c.fillStyle = 'rgba(235,220,255,.5)'; c.fillRect(D - 46, 614, 92, 18); c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(D - 46, 614, 92, 18);
    rxRect(c, D - 34, 594, 68, 14, 4, '#7b3fe4'); rxTxt(c, '⬇ خروج', D, 601, 'bold 9px Cairo, Arial', '#fff');
    rmSayDraw(c, K.x, K.y - 128, K.say);
  }

  /* ---------- 5) لوحة الشراء ---------- */
  function open() {
    let P = $('clShop'); K.wave = 60; try { rmSpnCss(); } catch (e) {}
    if (!P) {
      P = document.createElement('div'); P.id = 'clShop';
      P.innerHTML = '<div class="spC"><div class="spH"><canvas width="104" height="104"></canvas><div><b></b><small>البس وتكشخ والكل يشوفك ✨ — الدولارات من الصيد 🎣</small></div><span class="spCo"></span><button type="button" class="spX">✕</button></div><div class="spG"></div><div class="spF"></div></div>';
      P.querySelector('b').textContent = INFO.name; P.addEventListener('pointerdown', e => { if (e.target === P) close(); }); P.querySelector('.spX').onclick = close;
      $('rmBox').appendChild(P);
    }
    if (!$('clCss')) { const st = document.createElement('style'); st.id = 'clCss'; const base = (($('spnCss') || {}).textContent || '').match(/#spnShop[^{}]*\{[^}]*\}/g) || [];
      st.textContent = base.join('').replace(/#spnShop/g, '#clShop') + '#clShop .spC{background:linear-gradient(170deg,#fbf4ff,#ecdcff);border-color:#a36bff;color:#331455}#clShop .spH{background:linear-gradient(90deg,#5a26b8,#ff5ca8)}#clShop .spDlg{z-index:5}'; document.head.appendChild(st); }
    P.style.display = ''; const hc = P.querySelector('.spH canvas').getContext('2d'); hc.setTransform(2, 0, 0, 2, 0, 0); hc.clearRect(0, 0, 52, 52); rmGmzDraw(hc, 26, 60, 0.52, false, PAL);
    B.sel = ''; render(); say('اختار اللي يعجبك 💜', 200);
  }
  function close() { const P = $('clShop'); if (P) P.style.display = 'none'; const D = $('clDlg'); if (D) D.remove(); }
  function render() {
    const P = $('clShop'); if (!P || P.style.display === 'none') return; P.querySelector('.spCo').textContent = auth ? '💵 ' + usdTxt() : 'ضيف';
    const G = P.querySelector('.spG'); G.innerHTML = '';
    if (!CL.length) { const e = document.createElement('div'); e.className = 'spE'; e.textContent = '👕 بعد ما نزلت ملابس — قريباً ✨'; G.appendChild(e); }
    CL.forEach(w => { const card = rmWearCard(w, B.sel, k => { B.sel = k; render(); }); const bt = card.querySelector('.spBtn'); if (bt) bt.onclick = e => { e.stopPropagation(); act(w); }; G.appendChild(card); });
    const F = P.querySelector('.spF'); F.innerHTML = ''; const tx = document.createElement('span'); tx.textContent = rmWearSum(); F.appendChild(tx);
    const ib = document.createElement('button'); ib.type = 'button'; ib.textContent = '🎒 أغراضي'; ib.onclick = () => { close(); RM.invTab = 'w'; rmInvOpen(); }; F.appendChild(ib);
  }
  function act(w) {
    if (rmWearOwned(w.k)) { if (RM.wearT && performance.now() - RM.wearT < 500) return; RM.wearT = performance.now(); rmSend({ t: 'rm_wear', k: w.k, on: rmWearOn(w.k) ? 0 : 1 }); return; }
    if (!auth) { showToast('🔐 سجّل حساب حتى تشتري ملابس 👕'); return; }
    if (rmUsd() < w.p) { showToast('💵 دولاراتك ما تكفي، تحتاج ' + w.p); say('دولاراتك ما تكفي، روح اصطاد سمك وبيعه وارجعلي 🎣', 200); return; }
    const P = $('clShop'); let D = $('clDlg'); if (D) D.remove(); D = document.createElement('div'); D.id = 'clDlg'; D.className = 'spDlg';
    D.innerHTML = '<div class="spDB"><canvas width="152" height="184"></canvas><b>تأكيد الشراء</b><p></p><div class="row"><button type="button" class="y">✅ تأكيد الشراء</button><button type="button" class="no">✖ إلغاء</button></div></div>';
    const dc = D.querySelector('canvas'); dc.style.cssText = 'width:76px;height:92px;display:block;margin:0 auto'; const g = dc.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); avPreview(g, w.k, 38, 88, 1.05);
    D.querySelector('p').textContent = 'تشتري «' + w.n + '» بـ 💵 ' + w.p + '؟ رصيدك 💵 ' + usdTxt();
    const Y = D.querySelector('.y'); Y.onclick = () => { if (RM.wbuyT && performance.now() - RM.wbuyT < 1000) return; RM.wbuyT = performance.now(); Y.disabled = true; Y.textContent = '⏳'; rmSend({ t: 'rm_wear_buy', k: w.k }); setTimeout(() => { if (Y.isConnected) { Y.disabled = false; Y.textContent = '✅ تأكيد الشراء'; } }, 2500); };
    D.querySelector('.no').onclick = () => D.remove(); D.addEventListener('pointerdown', e => { if (e.target === D) D.remove(); });
    const C = P.querySelector('.spC'); C.style.position = 'relative'; C.appendChild(D);
  }
  const boughtOld = rmWearBought; rmWearBought = function (d) {
    const w = RM_WEARD[d && d.k]; if (!w || w.s !== 'cl') return boughtOld(d);
    RM.myWears = d.owned || RM.myWears || []; if (typeof d.usd === 'number') rmUsdSet(d.usd); try { loadMe(); } catch (e) {} const D = $('clDlg'); if (D) D.remove();
    B.sel = d.k; render(); try { rmInvRender(); } catch (e) {} K.wave = 80; say('مبروك عليك «' + w.n + '»! 🎉 دوس «لبس» وخلي الكل يشوفك ✨', 220); showToast('🎉 صار «' + w.n + '» إلك — انحفظ بأغراضك 🎒');
  };
  const okOld = rmWearOk; rmWearOk = function (d) { const r = okOld(d); try { render(); } catch (e) {} return r; };

  /* ---------- 6) نربطه ويا المنتجع ---------- */
  const idOld = rmShopId; rmShopId = function (o) { const x = (o || RM.me).x; if (x >= HI.x0 - 100 && x < 80000) return SID; return idOld(o); };
  const shiOld = rmXShi; rmXShi = function (id, o) { if (id === SID) return HI; return shiOld(id, o); };
  const bgOld = rmXBg; rmXBg = function (c, sid) { if (sid === SID) return bg(c); return bgOld(c, sid); };
  const listOld = rmXList; rmXList = function (sid) { if (sid === SID) return list(); return listOld(sid); };
  const fgOld = rmXFg; rmXFg = function (c, sid) { if (sid === SID) return fg(c); return fgOld(c, sid); };
  const keyOld = rmXKey; rmXKey = function () { let k = keyOld(); try { k += '|cl' + (near() ? 'n' : '') + (nearK() ? 'k' : '') + (nearExit() ? 'e' : ''); } catch (e) {} return k; };
  const promptOld = rmXPrompt; rmXPrompt = function (mk) {
    const sid = rmShopId(); if (sid === SID) { if (nearK()) mk('👕 اشتري ملابس من ' + INFO.keeper, open); if (nearExit()) mk('🚪 اطلع من المحل', exit); return true; }
    if (sid === 0 && near()) mk('👕 ادخل ' + INFO.name, enter);
    return promptOld(mk);
  };
  const hitOld = rmXHit; rmXHit = function (x, y) {
    const sid = rmShopId();
    if (sid === 0 && Math.abs(x - SH.x) < 150 && y > 600 && y < SH.y + 10) { if (near()) enter(); else rxGo(SH.x, SH.y + 22, '🚶 روح لباب المحل حتى تدخل 👕'); return true; }
    if (sid === SID) {
      if (Math.abs(x - K.x) < 80 && y > 300 && y < 420) { if (nearK()) open(); else { rxGo(K.x, 440); K.wave = 60; say('تعال يمي 💜', 150); } return true; }
      if (y > 606 && Math.abs(x - HI.dx) < 50) { if (nearExit()) exit(); else rxGo(HI.dx, 600); return true; }
      return false;
    }
    return hitOld(x, y);
  };
})();
