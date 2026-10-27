/* بابيتو شات — ورا المحلات على البحر: ممشى خشبي، جلسات وكراسي تكعد عليها، محل ألعاب البحر (جت سكي + باراسيلنغ)،
   منطقة شوي وتخييم، تلسكوب وإطار تصوير بالورد. كلشي HD ويتحرك حسب الوقت فينشاف نفس الشي عند الكل. */
(function () {
  'use strict';
  if (typeof RM === 'undefined' || typeof rmRideOf !== 'function') return;
  const TAU = Math.PI * 2, now = () => Date.now() / 1000, nightD = () => (RM.dn && RM.dn.d) || 0;
  const WS = { x: 1790, y: 300 }, JET = { n: 4, code: 102 }, PARA = { code: 106 }, CAMP = { grill: { x: 2585, y: 298 }, fire: { x: 2725, y: 290 } }, TEL = { x: 3000, y: 290 }, PHO = { x: 3190, y: 300 };
  const R6 = window.R6 = { from: null, prev: '', nt: 0 };
  const snd = list => { try { if (RM.ambMute) return; list.forEach(q => blip(q[0], q[1], q[2], q[3], q[4], q[5] || 0)); } catch (e) {} };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
  const ell = (c, x, y, a, b) => { c.beginPath(); c.ellipse(x, y, Math.max(.1, a), Math.max(.1, b), 0, 0, TAU); };
  const bulb = (c, x, y, r, col, on) => { c.fillStyle = on ? col : 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); if (on) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .35, 0, TAU); c.fill(); } };
  const sign = (c, txt, x, y, col, nd) => { c.save(); c.font = 'bold 12px Cairo, system-ui'; const w = c.measureText(txt).width + 24; c.fillStyle = 'rgba(20,30,48,.88)'; rr(c, x - w / 2, y - 12, w, 22, 11); c.fill(); c.lineWidth = 2; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 5 + nd * 10; rr(c, x - w / 2, y - 12, w, 22, 11); c.stroke(); c.shadowBlur = 0; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(txt, x, y); c.restore(); };
  function rider(c, R, x, y, s, tagY) { c.save(); c.translate(x, y); c.scale((R.o.dir || 1) * s, s); AVT.drawAt(c, R.o.av || AVT.DEF, 0, 0, AV_H, { t: RM.T, sit: 1, dance: 1, dt: RM.T }); c.restore(); c.save(); c.translate(x, tagY); c.scale(.74, .74); rmTag(c, R.nm, 0, -13, { me: R.me, adm: R.o.adm || (R.me ? RM.myAdm : 0) }); c.restore(); }
  const wood = (c, x, y, w, h, a, b) => { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, a || '#c8935a'); g.addColorStop(1, b || '#8a5a32'); c.fillStyle = g; c.fillRect(x, y, w, h); };

  /* ================= الممشى الخشبي على طول الساحل ================= */
  function boardwalk(c) { const x0 = 1320, x1 = 3320, y = 222, t = now(), nd = nightD(); c.save();
    c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(x0, y + 22, x1 - x0, 6);
    for (let x = x0; x < x1; x += 14) { const v = ((x * 37) % 9) / 60; wood(c, x, y, 13, 22, `rgba(${200 + v * 100},${150 + v * 60},${95 + v * 40},1)`, '#8a5a32'); c.fillStyle = 'rgba(60,35,15,.35)'; c.fillRect(x + 12.5, y, 1.5, 22); c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x + 3, y + 5, 1.6, 1.6); c.fillRect(x + 3, y + 16, 1.6, 1.6); }
    c.fillStyle = '#6a4224'; c.fillRect(x0, y - 2, x1 - x0, 3); c.fillRect(x0, y + 21, x1 - x0, 3);
    for (let x = x0 + 40; x < x1; x += 160) { c.fillStyle = '#3a3a42'; c.fillRect(x - 2, y - 48, 4, 48); c.fillStyle = '#2a2a30'; rr(c, x - 7, y - 62, 14, 16, 3); c.fill(); const g = c.createRadialGradient(x, y - 54, 1, x, y - 54, 9); g.addColorStop(0, nd > .2 ? '#fff4c0' : '#ffe9a0'); g.addColorStop(1, 'rgba(255,200,90,.2)'); c.fillStyle = g; rr(c, x - 5, y - 60, 10, 12, 2); c.fill(); }
    c.restore(); }


  /* ================= 2) محل ألعاب البحر: جت سكي + باراسيلنغ ================= */
  function jetPos(i) { const t = now() * .35 + i * TAU / JET.n, cx = 1820, cy = 88, rx = 300 + (i % 2) * 40, ry = 42; const x = cx + Math.cos(t) * rx + Math.sin(t * 2.3 + i) * 20, y = cy + Math.sin(t) * ry; const dx = -Math.sin(t) * rx, dir = dx > 0 ? 1 : -1; return [x, y, dir]; }
  function paraPos() { const t = now() * .16, x = 1820 + Math.cos(t) * 520, y = 150 + Math.sin(t) * 20, dir = -Math.sin(t) > 0 ? 1 : -1; return { bx: x, by: y, dir, px: x - dir * 120, py: y - 92 + Math.sin(now() * 1.3) * 6 }; }
  function wsHut(c) { const x = WS.x, y = WS.y, t = now(), nd = nightD(); c.save();
    // رصيف صغير للبحر
    for (let k = 0; k < 5; k++) wood(c, x - 30, y - 92 - k * 12, 60, 11, '#c8935a', '#8a5a32'); c.fillStyle = '#5a3a1e'; [-30, 26].forEach(dx => c.fillRect(x + dx, y - 150, 4, 64));
    c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, x, y + 2, 70, 10); c.fill();
    wood(c, x - 60, y - 58, 120, 58, '#4ab8d8', '#1a7aa8'); c.fillStyle = 'rgba(255,255,255,.3)'; for (let k = 0; k < 6; k++) c.fillRect(x - 60 + k * 20, y - 58, 2, 58);
    c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x - 72, y - 56); c.lineTo(x, y - 88); c.lineTo(x + 72, y - 56); c.closePath(); c.fill(); c.fillStyle = '#ff6a3a'; for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(x - 64 + k * 16, y - 56, 7, 0, Math.PI); c.fill(); }
    c.fillStyle = 'rgba(200,240,255,.7)'; rr(c, x - 44, y - 46, 40, 26, 3); c.fill(); rr(c, x + 6, y - 46, 38, 26, 3); c.fill();
    c.font = '18px system-ui'; c.textAlign = 'center'; c.fillText('🏄', x - 24, y - 26); c.fillText('🪂', x + 25, y - 26);
    // ألواح ركمجة معلقة
    [['#ff4d6d', -78], ['#3ddc84', 74], ['#b36bff', 86]].forEach(([col, dx]) => { c.save(); c.translate(x + dx, y - 30); c.rotate(dx > 0 ? .15 : -.15); c.fillStyle = col; ell(c, 0, 0, 6, 26); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(-.8, -24, 1.6, 48); c.restore(); });
    sign(c, '🏄 ألعاب البحر — مجاناً', x, y - 104, '#4ab8d8', nd); c.restore(); }
  function seaDraw(c) { const t = now(), nd = nightD(); c.save(); const riders = rmRiders('jet');
    for (let i = 0; i < JET.n; i++) { const [x, y, dir] = jetPos(i), col = ['#ff4d6d', '#ffd23f', '#3ddc84', '#3da5ff'][i];
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - dir * 20, y + 4); c.quadraticCurveTo(x - dir * 50, y + 10, x - dir * 90, y + 4); c.moveTo(x - dir * 20, y + 8); c.quadraticCurveTo(x - dir * 50, y + 20, x - dir * 86, y + 18); c.stroke();
      if (RM.T % 3 === 0) RM.sparks.push({ x: x - dir * 22, y: y + 2, vx: -dir * (1 + Math.random()), vy: -1 - Math.random(), t: 16, drop: 1 });
      c.save(); c.translate(x, y + Math.sin(t * 6 + i) * 1.2); c.scale(dir, 1);
      riders.filter(R => R.i === i).forEach(R => { c.save(); c.scale(dir, 1); rider(c, R, 0, -2, .42, -34); c.restore(); });
      const g = c.createLinearGradient(0, -12, 0, 6); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, col); g.addColorStop(1, '#2a2a3a'); c.fillStyle = g; c.beginPath(); c.moveTo(-22, 0); c.quadraticCurveTo(-20, -9, 0, -9); c.lineTo(20, -6); c.quadraticCurveTo(28, -2, 24, 3); c.lineTo(-20, 5); c.closePath(); c.fill();
      c.fillStyle = '#222'; rr(c, -10, -14, 16, 6, 3); c.fill(); c.strokeStyle = '#444'; c.lineWidth = 2; c.beginPath(); c.moveTo(8, -9); c.lineTo(12, -16); c.stroke(); c.restore(); }
    // باراسيلنغ: قارب يسحب مظلة ملونة بالهوا
    const P = paraPos(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(P.bx - P.dir * 26, P.by + 4); c.quadraticCurveTo(P.bx - P.dir * 80, P.by + 12, P.bx - P.dir * 140, P.by + 6); c.stroke();
    c.save(); c.translate(P.bx, P.by); c.scale(P.dir, 1); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-30, 0); c.lineTo(28, 0); c.quadraticCurveTo(36, -6, 26, -10); c.lineTo(-26, -10); c.closePath(); c.fill(); c.fillStyle = '#1a7aa8'; c.fillRect(-26, -4, 52, 4); c.fillStyle = '#2a2a3a'; rr(c, -8, -20, 18, 10, 3); c.fill(); c.restore();
    c.strokeStyle = 'rgba(40,40,50,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(P.bx - P.dir * 24, P.by - 10); c.quadraticCurveTo((P.bx + P.px) / 2, (P.by + P.py) / 2 + 30, P.px, P.py + 26); c.stroke();
    c.save(); c.translate(P.px, P.py); for (let k = 0; k < 7; k++) { c.fillStyle = ['#ff4d6d', '#ffd23f', '#3ddc84', '#3da5ff', '#b36bff', '#ff9f1c', '#ff7ab8'][k]; c.beginPath(); c.moveTo(0, 6); c.arc(0, 6, 44, Math.PI + k * Math.PI / 7, Math.PI + (k + 1) * Math.PI / 7); c.closePath(); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = .8; for (let k = 0; k <= 7; k++) { const a = Math.PI + k * Math.PI / 7; c.beginPath(); c.moveTo(Math.cos(a) * 44, 6 + Math.sin(a) * 44); c.lineTo(0, 40); c.stroke(); }
    const pr = rmRiders('para'); pr.forEach(R => rider(c, R, 0, 56, .42, 18)); if (!pr.length) { c.fillStyle = '#ffd23f'; rr(c, -5, 36, 10, 10, 3); c.fill(); }
    c.restore(); c.restore(); }


  /* ================= 4) منطقة الشوي والتخييم ================= */
  function tent(c, x, y, col) { c.save(); c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, x, y + 2, 46, 8); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(x - 44, y); c.lineTo(x, y - 56); c.lineTo(x + 44, y); c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(x, y - 56); c.lineTo(x + 44, y); c.lineTo(x + 12, y); c.closePath(); c.fill(); c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x, y - 30); c.lineTo(x + 10, y); c.closePath(); c.fill(); c.strokeStyle = 'rgba(80,60,40,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 56); c.lineTo(x, y - 64); c.moveTo(x - 44, y); c.lineTo(x - 56, y + 4); c.moveTo(x + 44, y); c.lineTo(x + 56, y + 4); c.stroke(); c.restore(); }
  function campDraw(c) { const t = now(), nd = nightD(), G = CAMP.grill, F = CAMP.fire; c.save();
    tent(c, 2480, 300, '#4a8a5a'); tent(c, 2870, 296, '#d8743a'); c.strokeStyle = 'rgba(60,40,20,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(2480, 244); c.quadraticCurveTo(2675, 270, 2870, 240); c.stroke(); for (let k = 1; k < 16; k++) { const u = k / 16, lx = 2480 + u * 390, ly = (1 - u) * (1 - u) * 244 + 2 * u * (1 - u) * 270 + u * u * 240; bulb(c, lx, ly + 3, 2.2, ['#ffd166', '#ff7a5a', '#7ad8ff', '#a8ff7a'][k % 4], nd > .15 || Math.sin(k + t * 3) > 0); }
    // المشواية
    c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, G.x, G.y + 2, 30, 6); c.fill(); c.fillStyle = '#2a2a2e'; rr(c, G.x - 26, G.y - 30, 52, 16, 4); c.fill(); c.fillStyle = '#3a3a40'; [-20, 18].forEach(dx => c.fillRect(G.x + dx, G.y - 16, 3, 16));
    const hot = c.createLinearGradient(0, G.y - 30, 0, G.y - 22); hot.addColorStop(0, '#ff6a1a'); hot.addColorStop(1, '#8a1a0a'); c.fillStyle = hot; c.fillRect(G.x - 22, G.y - 28, 44, 5); c.strokeStyle = '#888'; c.lineWidth = 1; for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(G.x - 22 + k * 6, G.y - 30); c.lineTo(G.x - 22 + k * 6, G.y - 24); c.stroke(); }
    for (let k = 0; k < 4; k++) { c.fillStyle = '#8a3a1a'; rr(c, G.x - 18 + k * 10, G.y - 34, 7, 4, 2); c.fill(); c.fillStyle = '#3a8a2a'; c.fillRect(G.x - 16 + k * 10, G.y - 34, 2, 4); }
    if (RM.T % 6 === 0) RM.sparks.push({ x: G.x + (Math.random() - .5) * 30, y: G.y - 36, vx: (Math.random() - .5) * .5, vy: -.8, t: 46, puff: 1, smoke: 1 });
    c.font = 'bold 10px Cairo, system-ui'; c.textAlign = 'center'; c.fillStyle = '#5a2a10'; c.fillText('🍢 مشويات', G.x, G.y + 14);
    // نار المخيم وكراسي جذوع
    c.fillStyle = '#5a5a5a'; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; ell(c, F.x + Math.cos(a) * 13, F.y + Math.sin(a) * 5, 4, 3); c.fill(); }
    c.fillStyle = '#5a3a1a'; c.save(); c.translate(F.x, F.y - 4); [-.5, .5].forEach(r => { c.save(); c.rotate(r); c.fillRect(-12, -2, 24, 4); c.restore(); }); c.restore();
    for (let k = 0; k < 3; k++) { const fl = 1 + Math.sin(t * 11 + k * 2) * .15, h = (18 - k * 4) * fl; c.fillStyle = ['#ff5a1a', '#ffa82a', '#fff0a0'][k]; c.beginPath(); c.moveTo(F.x - 9 + k * 3, F.y - 4); c.quadraticCurveTo(F.x - 6 + k * 2, F.y - h * .6, F.x + Math.sin(t * 7) * 2, F.y - 4 - h); c.quadraticCurveTo(F.x + 6 - k * 2, F.y - h * .6, F.x + 9 - k * 3, F.y - 4); c.closePath(); c.fill(); }
    if (RM.T % 5 === 0) RM.sparks.push({ x: F.x + (Math.random() - .5) * 8, y: F.y - 20, vx: (Math.random() - .5) * .6, vy: -1.4, t: 22 });
    sign(c, '🔥 منطقة الشوي والتخييم', 2690, 236, '#ff8a3a', nd); c.restore(); }

  /* ================= 5) تلسكوب + إطار تصوير بالورد ================= */
  function telDraw(c) { const x = TEL.x, y = TEL.y, nd = nightD(); c.save(); c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, x, y + 2, 14, 4); c.fill(); c.strokeStyle = '#4a4a52'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y - 24); c.lineTo(x - 10, y); c.moveTo(x, y - 24); c.lineTo(x + 10, y); c.moveTo(x, y - 24); c.lineTo(x, y); c.stroke();
    c.save(); c.translate(x, y - 28); c.rotate(-.4); const g = c.createLinearGradient(0, -6, 0, 6); g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#a07020'); c.fillStyle = g; rr(c, -18, -5, 36, 10, 4); c.fill(); c.fillStyle = '#2a2a30'; rr(c, 16, -6, 6, 12, 2); c.fill(); c.fillStyle = 'rgba(120,200,255,.8)'; ell(c, 22, 0, 1.6, 4.5); c.fill(); c.restore();
    c.font = 'bold 10px Cairo, system-ui'; c.textAlign = 'center'; c.fillStyle = '#1a4a8a'; c.fillText('🔭 تلسكوب', x, y + 14); c.restore(); }
  function phoDraw(c) { const x = PHO.x, y = PHO.y, t = now(); c.save(); c.fillStyle = 'rgba(0,0,0,.16)'; ell(c, x, y + 2, 50, 7); c.fill();
    c.strokeStyle = '#f4f4f4'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 42, y); c.lineTo(x - 42, y - 58); c.arc(x, y - 58, 42, Math.PI, 0); c.lineTo(x + 42, y); c.stroke();
    for (let k = 0; k < 26; k++) { const u = k / 25, a = Math.PI + u * Math.PI, px = u < .2 ? x - 42 : u > .8 ? x + 42 : x + Math.cos(a) * 42, py = u < .2 ? y - u / .2 * 58 : u > .8 ? y - (1 - u) / .2 * 58 : y - 58 + Math.sin(a) * 42; c.fillStyle = ['#ff5a8a', '#ffd166', '#c78bff', '#ffffff', '#ff9a4a'][k % 5]; c.beginPath(); c.arc(px, py, 4 + (k % 3), 0, TAU); c.fill(); c.fillStyle = '#3a9a3a'; ell(c, px + 3, py + 3, 2.6, 1.4); c.fill(); }
    c.font = 'bold 12px Cairo, system-ui'; c.textAlign = 'center'; c.fillStyle = '#c0306a'; c.fillText('📸 ذكرى من البحر', x, y - 108 + Math.sin(t)); c.restore(); }
  function scope() {   // منظر مكبّر للبحر: دلافين وقوارب وطيور
    let P = document.getElementById('r6Tel'); if (P) P.remove(); P = document.createElement('div'); P.id = 'r6Tel'; P.style.cssText = 'position:absolute;inset:0;z-index:30;background:#000;display:grid;place-items:center';
    const cv = document.createElement('canvas'), S = Math.min(560, (document.getElementById('rmBox') || document.body).clientWidth - 30); cv.width = cv.height = S * 2; cv.style.cssText = 'width:' + S + 'px;height:' + S + 'px;border-radius:50%;box-shadow:0 0 0 6px #222,0 0 40px rgba(120,200,255,.3)'; P.appendChild(cv);
    const x = document.createElement('div'); x.textContent = 'دوس بأي مكان حتى تسكّر'; x.style.cssText = 'position:absolute;bottom:16px;left:0;right:0;text-align:center;color:#fff;font:800 13px Cairo,system-ui;opacity:.7'; P.appendChild(x);
    const g = cv.getContext('2d'); let raf = 0; const t0 = performance.now(), nd = nightD();
    const draw = () => { const t = (performance.now() - t0) / 1000, W = cv.width; const sky = g.createLinearGradient(0, 0, 0, W * .45); sky.addColorStop(0, nd > .5 ? '#0a1430' : '#6ab0e8'); sky.addColorStop(1, nd > .5 ? '#2a3a6a' : '#cfe8ff'); g.fillStyle = sky; g.fillRect(0, 0, W, W * .45);
      const sea = g.createLinearGradient(0, W * .45, 0, W); sea.addColorStop(0, '#2a8ad0'); sea.addColorStop(1, '#0a3a7a'); g.fillStyle = sea; g.fillRect(0, W * .45, W, W * .55);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; for (let k = 0; k < 14; k++) { g.beginPath(); const yy = W * .48 + k * 34; for (let xx = 0; xx <= W; xx += 20) g.lineTo(xx, yy + Math.sin(xx / 60 + t * 2 + k) * 6); g.stroke(); }
      g.fillStyle = nd > .5 ? '#fff4d0' : '#fff0b0'; g.beginPath(); g.arc(W * .78, W * .18, 40, 0, TAU); g.fill();
      const bx = (t * 60) % (W + 300) - 150; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx, W * .5); g.lineTo(bx + 120, W * .5); g.lineTo(bx + 100, W * .53); g.lineTo(bx + 20, W * .53); g.fill(); g.fillStyle = '#ff4d6d'; g.beginPath(); g.moveTo(bx + 60, W * .5); g.lineTo(bx + 60, W * .36); g.lineTo(bx + 100, W * .48); g.fill();
      for (let k = 0; k < 2; k++) { const ph = (t * .6 + k * .5) % 1.6; if (ph < 1) { const dx = W * (.3 + k * .3), u = ph; g.save(); g.translate(dx + u * 160, W * .62 - Math.sin(u * Math.PI) * 140); g.rotate(-Math.PI / 2 + u * Math.PI); g.fillStyle = '#5a7a9a'; g.beginPath(); g.ellipse(0, 0, 50, 16, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-10, -12); g.lineTo(6, -30); g.lineTo(10, -10); g.fill(); g.beginPath(); g.moveTo(-48, 0); g.lineTo(-64, -12); g.lineTo(-62, 12); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(10, 6, 30, 7, 0, 0, TAU); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(34, -3, 3, 0, TAU); g.fill(); g.restore(); } }
      for (let k = 0; k < 4; k++) { const x2 = ((t * 80 + k * 260) % (W + 100)) - 50, y2 = W * (.12 + k * .05) + Math.sin(t * 2 + k) * 10, f = Math.sin(t * 9 + k) * 10; g.strokeStyle = '#222'; g.lineWidth = 4; g.beginPath(); g.moveTo(x2 - 20, y2 - f); g.quadraticCurveTo(x2 - 8, y2 - 6, x2, y2); g.quadraticCurveTo(x2 + 8, y2 - 6, x2 + 20, y2 - f); g.stroke(); }
      const vg = g.createRadialGradient(W / 2, W / 2, W * .3, W / 2, W / 2, W * .5); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.75)'); g.fillStyle = vg; g.fillRect(0, 0, W, W);
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2, W * .3); g.lineTo(W / 2, W * .7); g.moveTo(W * .3, W / 2); g.lineTo(W * .7, W / 2); g.stroke();
      raf = requestAnimationFrame(draw); };
    draw(); P.addEventListener('pointerdown', () => { cancelAnimationFrame(raf); P.remove(); }); (document.getElementById('rmBox') || document.body).appendChild(P); snd([['sine', 600, 900, .15, .04]]); }


  function lounger(c, x, y, col) { c.save(); c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, x, y + 2, 26, 5); c.fill(); c.strokeStyle = '#8a98a8'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 20, y); c.lineTo(x - 18, y - 8); c.moveTo(x + 18, y); c.lineTo(x + 16, y - 8); c.stroke(); c.fillStyle = col; rr(c, x - 22, y - 12, 32, 5, 2); c.fill(); c.save(); c.translate(x + 10, y - 10); c.rotate(-.7); rr(c, 0, -3, 16, 5, 2); c.fill(); c.restore(); c.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 4; k++) c.fillRect(x - 20 + k * 8, y - 12, 2, 5); c.restore(); }
  function palm(c, x, y) { const t = now(); c.save(); c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, x + 10, y + 2, 26, 6); c.fill(); c.fillStyle = '#b0703a'; rr(c, x - 10, y - 14, 20, 14, 3); c.fill(); c.strokeStyle = '#8a6a3a'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y - 12); c.quadraticCurveTo(x + 6, y - 50, x + 2, y - 84); c.stroke(); c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 1; for (let k = 0; k < 9; k++) { const yy = y - 18 - k * 7.5; c.beginPath(); c.moveTo(x - 2, yy); c.lineTo(x + 5, yy - 2); c.stroke(); }
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .5 + Math.sin(t * 1.2 + k) * .05; c.fillStyle = k % 2 ? '#3a9a4a' : '#2a7a3a'; c.beginPath(); c.moveTo(x + 2, y - 84); c.quadraticCurveTo(x + 2 + Math.cos(a) * 30, y - 84 + Math.sin(a) * 30 - 10, x + 2 + Math.cos(a) * 46, y - 84 + Math.sin(a) * 30 + 14); c.quadraticCurveTo(x + 2 + Math.cos(a) * 26, y - 84 + Math.sin(a) * 20, x + 2, y - 84); c.fill(); }
    c.fillStyle = '#6a4a2a'; [[-3, 2], [4, 3], [0, 6]].forEach(([dx, dy]) => { c.beginPath(); c.arc(x + 2 + dx, y - 80 + dy, 3.2, 0, TAU); c.fill(); }); c.restore(); }
  function rightDecor(c) { palm(c, 2960, 306); palm(c, 3285, 304); [[3045, 312], [3140, 296], [3250, 318]].forEach(([x, y], i) => { c.fillStyle = '#3a8a3a'; ell(c, x, y - 5, 10, 6); c.fill(); for (let k = 0; k < 5; k++) { c.fillStyle = ['#ff5a8a', '#ffd166', '#c78bff'][(k + i) % 3]; c.beginPath(); c.arc(x - 7 + k * 3.5, y - 9 + (k % 2) * 3, 2.4, 0, TAU); c.fill(); } }); }

  /* ---------- الركوب: جت سكي (4) + باراسيلنغ (1) ---------- */
  const rideOld = rmRideOf; rmRideOf = function (o) { const e = o && o.dance || 0; if (e >= JET.code && e < JET.code + JET.n) return { k: 'jet', i: e - JET.code }; if (e === PARA.code) return { k: 'para', i: 0 }; return rideOld(o); };
  function board(kind) { const m = RM.me; if (m.sit) { rmStand(); return; } if (m.jump) return; const n = kind === 'jet' ? JET.n : 1, code = kind === 'jet' ? JET.code : PARA.code;
    const used = new Set(rmRiders(kind).filter(R => !R.me).map(R => R.i)); let pick = -1; for (let i = 0; i < n; i++) if (!used.has(i)) { pick = i; break; } if (pick < 0) { showToast('⛔ مشغولة هسه، انتظر شوي'); return; }
    if (!rmRideOf(m)) R6.from = { x: m.x, y: m.y }; rmSetDance(code + pick); RM.sent = ''; snd([['sawtooth', 120, 260, .4, .03], ['sine', 660, 880, .2, .04, .1]]); showToast(kind === 'jet' ? '🏄 ركبت جت سكي! سوق بالبحر 🌊' : '🪂 طرت بالباراسيلنغ! شوف المنتجع من فوق'); rmPrompt(true); }
  function seatOf(r) { if (r.k === 'jet') { const p = jetPos(r.i); return [p[0], p[1] - 2]; } if (r.k === 'para') { const p = paraPos(); return [p.px, p.py + 56]; } return null; }
  const updOld = rmUpdMe; rmUpdMe = function () { const m = RM.me, r = rmRideOf(m), mine = r && (r.k === 'jet' || r.k === 'para'), key = mine ? r.k + r.i : '';
    if (key !== R6.prev) { if (R6.prev && !mine && R6.from) { m.x = m.tx = R6.from.x; m.y = m.ty = R6.from.y; RM.camSnap = 1; } if (mine && !R6.prev && !R6.from) R6.from = { x: m.x, y: m.y }; if (!mine) R6.from = null; R6.prev = key; }
    if (mine) { const s = seatOf(r); m.x = m.tx = s[0]; m.y = m.ty = s[1]; if (now() > R6.nt) { R6.nt = now() + .25; snd([['sawtooth', r.k === 'jet' ? 110 : 70, r.k === 'jet' ? 130 : 80, .26, .008]]); } return { mv: false, air: 0, jp: 0 }; }
    return updOld(); };
  const walkOld = rmWalkTo; rmWalkTo = function (x, y) { const r = rmRideOf(RM.me); if (r && (r.k === 'jet' || r.k === 'para')) { showToast('🚪 انزل أول'); return; } return walkOld(x, y); };

  /* ---------- الأزرار حسب القرب ---------- */
  const near = { ws: () => Math.hypot(RM.me.x - WS.x, (RM.me.y - WS.y) * 1.4) < 110, bbq: () => Math.hypot(RM.me.x - CAMP.grill.x, (RM.me.y - CAMP.grill.y) * 1.4) < 80, tel: () => Math.hypot(RM.me.x - TEL.x, (RM.me.y - TEL.y) * 1.4) < 60, pho: () => Math.hypot(RM.me.x - PHO.x, (RM.me.y - PHO.y) * 1.4) < 70 };
  const nearList = () => rmShopId() === 0 && !rmRideOf(RM.me) ? Object.keys(near).filter(k => near[k]()) : [];
  const keyOld = rmXKey; rmXKey = function () { return keyOld() + '|r6' + nearList().join(''); };
  const promptOld = rmXPrompt; rmXPrompt = function (mk) {
    nearList().forEach(k => { if (k === 'ws') { mk('🏄 اركب جت سكي', () => board('jet')); mk('🪂 طير بالباراسيلنغ', () => board('para')); } if (k === 'bbq') mk('🍢 اطلب مشويات', () => { snd([['sawtooth', 200, 120, .4, .015], ['triangle', 900, 700, .15, .03, .2]]); for (let i = 0; i < 8; i++) RM.sparks.push({ x: CAMP.grill.x + (Math.random() - .5) * 30, y: CAMP.grill.y - 36, vx: (Math.random() - .5), vy: -1, t: 40, puff: 1, smoke: 1 }); try { rmSend({ t: 'rm_react', e: '🍢' }); } catch (e) {} showToast('🍢 مشويات طازة! بالعافية'); }); if (k === 'tel') mk('🔭 شوف بالتلسكوب', scope); if (k === 'pho') mk('📸 التقط صورة', () => { try { rmPhotoTake(); } catch (e) {} }); });
    return promptOld(mk); };
  const hitOld = rmXHit; rmXHit = function (x, y) { if (rmShopId() === 0 && !rmRideOf(RM.me)) {
      const Z = [['ws', WS.x - 70, WS.x + 70, WS.y - 90, WS.y + 6, WS.x, WS.y + 24], ['tel', TEL.x - 22, TEL.x + 22, TEL.y - 40, TEL.y + 6, TEL.x + 24, TEL.y + 10]];
      for (const z of Z) if (x > z[1] && x < z[2] && y > z[3] && y < z[4]) { rmWalkTo(z[5], z[6]); rmTapMark(z[5], z[6]); rmPrompt(true); return true; } }
    return hitOld(x, y); };
  const holesOld = rmXHoles; rmXHoles = function (hole, fl) { try { holesOld(hole, fl); } catch (e) {} for (let x = 1360; x < 3320; x += 160) hole(x, 170, 70, .7); hole(CAMP.fire.x, CAMP.fire.y - 10, 150 * fl, .95); hole(WS.x, WS.y - 40, 100, .7); };
  const glowOld = rmXGlow; rmXGlow = function (c, d, fl) { try { glowOld(c, d, fl); } catch (e) {} rmGlow(c, CAMP.fire.x, CAMP.fire.y - 12, 120 * fl, .35 * d, '255,140,40'); for (let x = 1360; x < 3320; x += 160) rmGlow(c, x, 168, 26, .4 * d, '255,220,140'); };

  RM_DECOR.push({ y: 230, f: boardwalk }, { y: 200, f: seaDraw }, { y: WS.y, f: wsHut }, { y: 312, f: campDraw }, { y: TEL.y, f: telDraw }, { y: PHO.y, f: phoDraw }, { y: 305, f: rightDecor });
  window.R6_SPOTS = { ws: WS, camp: CAMP.fire, tel: TEL, seat: { x: 1500, y: 300 } };

  /* ---------- مقاعد ورا المحلات تكدر تكعد عليها (نفس نظام الجلوس الأصلي) ---------- */
  const SEATS6 = [];
  const addSeat = (kind, x, y, s) => { const sd = { kind, x: Math.round(x), y: Math.round(y), s: s || 1, i: RM_SEATS.length, r6: 1 }; RM_SEATS.push(sd); rmSpots(sd).forEach(sp => RM_SPOTS.push(sp)); SEATS6.push(sd); return sd; };
  [1395, 1455, 1530, 1590, 2370, 3075, 3125].forEach((x, i) => addSeat('lounge', x, 300 + (i % 2) * 8));
  [2000, 2140, 2280].forEach(x => addSeat('bench', x, 306));
  for (let i = 0; i < 5; i++) { const a = Math.PI * .1 + i / 5 * TAU; addSeat('log', CAMP.fire.x + Math.cos(a) * 46, CAMP.fire.y + 4 + Math.sin(a) * 16); }
  SEATS6.forEach(sd => RM_DECOR.push({ y: sd.y, f: c => rmSeatDraw(c, sd) }));
  function umb(c, x, y, col) { c.save(); c.fillStyle = 'rgba(0,0,0,.14)'; ell(c, x + 8, y + 2, 30, 7); c.fill(); c.fillStyle = '#d8d8d8'; c.fillRect(x - 1.5, y - 74, 3, 74); for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#fff' : col; c.beginPath(); c.moveTo(x, y - 88); c.lineTo(x - 40 + k * 10, y - 64); c.lineTo(x - 40 + (k + 1) * 10, y - 64); c.closePath(); c.fill(); } c.fillStyle = col; c.beginPath(); c.arc(x, y - 89, 2.5, 0, TAU); c.fill(); c.restore(); }
  function planter(c, x, y, i) { c.save(); c.fillStyle = 'rgba(0,0,0,.15)'; ell(c, x, y + 2, 16, 4); c.fill(); c.fillStyle = '#b0703a'; rr(c, x - 13, y - 14, 26, 14, 3); c.fill(); c.fillStyle = '#3a8a3a'; ell(c, x, y - 18, 14, 9); c.fill(); for (let k = 0; k < 6; k++) { c.fillStyle = ['#ff5a8a', '#ffd166', '#c78bff', '#ffffff'][(k + i) % 4]; c.beginPath(); c.arc(x - 10 + k * 4, y - 20 + (k % 2) * 4, 2.6, 0, TAU); c.fill(); } c.restore(); }
  [[1425, 292, '#ff4d6d'], [1560, 292, '#3da5ff'], [2400, 292, '#ffd23f']].forEach(([x, y, col]) => RM_DECOR.push({ y, f: c => umb(c, x, y, col) }));
  [[1930, 304], [2070, 304], [2210, 304], [2340, 304]].forEach(([x, y], i) => RM_DECOR.push({ y, f: c => planter(c, x, y, i) }));
  RM_DECOR.push({ y: 236, f: c => sign(c, '🏖️ جلسات البحر — اكعد واستمتع', 1495, 236, '#3da5ff', nightD()) }, { y: 236, f: c => sign(c, '🌺 جلسة الممشى', 2140, 236, '#ff9ac8', nightD()) });
})();
