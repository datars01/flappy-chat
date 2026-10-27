/* بابيتو شات — ملاهي المنتجع الاحترافية:
   دولاب الهوا والدوّارة بشكل جديد، المسبح الاحترافي ورش المي، ولعبتين جديدات: سفينة القرصان 🏴‍☠️ والأفعوانية 🎢.
   كل الألعاب تتحرك حسب الوقت فتنشاف نفس الشي عند الكل، والراكب الكاميرا تمشي وياه وتسمع أصوات اللعبة. */
(function () {
  'use strict';
  if (typeof RM === 'undefined' || typeof RM_FER === 'undefined') return;
  const R4 = window.R4 = { drops: [], rings: [], from: null, prev: '', nt: 0, wk: {}, lastPh: 0 };
  const TAU = Math.PI * 2, now = () => Date.now() / 1000, nightD = () => (RM.dn && RM.dn.d) || 0;
  const PIR = { x: 640, y: 1130, n: 6, L: 96, py: 984, code: 50 };
  const CST = { x: 1035, y: 1060, rx: 178, ry: 60, n: 8, code: 60 };
  const snd = (list) => { try { if (RM.ambMute) return; list.forEach(q => blip(q[0], q[1], q[2], q[3], q[4], q[5] || 0)); } catch (e) {} };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
  const ell = (c, x, y, a, b) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, a), Math.max(0.1, b), 0, 0, TAU); };
  const sign = (c, txt, x, y, col, night) => {   // لافتة نيون فوق كل لعبة
    c.save(); c.font = 'bold 13px Cairo, system-ui'; const w = c.measureText(txt).width + 26; c.fillStyle = 'rgba(30,14,48,.88)'; rr(c, x - w / 2, y - 13, w, 24, 12); c.fill();
    c.lineWidth = 2; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 6 + night * 10; rr(c, x - w / 2, y - 13, w, 24, 12); c.stroke(); c.shadowBlur = 0;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(txt, x, y); c.restore();
  };
  const hexL = (h, k) => { const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  const bulb = (c, x, y, r, col, on) => { c.fillStyle = on ? col : 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); if (on) { c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, TAU); c.fill(); } };

  /* ---------- أكواد الركوب: 50-55 سفينة القرصان، 60-67 الأفعوانية ---------- */
  const rideOld = rmRideOf;
  rmRideOf = function (o) { const e = o && o.dance || 0; if (e >= PIR.code && e < PIR.code + PIR.n) return { k: 'pir', i: e - PIR.code }; if (e >= CST.code && e < CST.code + CST.n) return { k: 'cst', i: e - CST.code }; return rideOld(o); };
  const RIDES = { fer: { n: RM_FER.n, code: 20, nm: '🎡 دولاب الهوا' }, car: { n: RM_CAR.n, code: 26, nm: '🎠 الدوّارة' }, pir: { n: PIR.n, code: PIR.code, nm: '🏴‍☠️ سفينة القرصان' }, cst: { n: CST.n, code: CST.code, nm: '🎢 الأفعوانية' } };
  function board(kind) {
    const m = RM.me, D = RIDES[kind]; if (m.sit) { rmStand(); return; } if (m.jump) return;
    const used = new Set(rmRiders(kind).filter(R => !R.me).map(R => R.i)); let pick = -1, best = 1e9;
    for (let i = 0; i < D.n; i++) { if (used.has(i)) continue; let sc = i;   // نركب بالمقعد اللي واصل تحت/گدام هسه، مثل الحقيقة
      if (kind === 'fer' || kind === 'car') { const a = (kind === 'fer' ? ferAngle() : carA()) + i * TAU / D.n; sc = Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))); }
      if (sc < best) { best = sc; pick = i; } }
    if (pick < 0) { showToast('⛔ كل المقاعد مليانة، انتظر شوي'); return; }
    if (!rmRideOf(m)) R4.from = { x: m.x, y: m.y }; m.tx = m.x; m.ty = m.y; rmSetDance(D.code + pick); RM.sent = '';
    snd([['sine', 523, 523, 0.16, 0.05], ['sine', 659, 659, 0.16, 0.05, 0.1], ['sine', 784, 784, 0.16, 0.05, 0.2], ['triangle', 1047, 1047, 0.3, 0.05, 0.3]]);
    showToast({ fer: '🎡 ركبت دولاب الهوا! الكاميرا وياك — تمتع بالمنظر من فوق', car: '🎠 ركبت الدوّارة! وييي 🎶', pir: '🏴‍☠️ ركبت سفينة القرصان! تمسّك زين 😱', cst: '🎢 ركبت الأفعوانية! ارفع إيديك 🙌' }[kind]);
    rmPrompt(true);
  }
  rmRideBoard = board; window.r4Board = board;

  /* راكب بحجم واضح، واسمه بلافتة صغيرة فوك اللعبة حتى ما يغطي الشخصية */
  function rider(c, R, x, y, s, tagY) {
    c.save(); c.translate(x, y); c.scale((R.o.dir || 1) * s, s); AVT.drawAt(c, R.o.av || AVT.DEF, 0, 0, AV_H, { t: RM.T, sit: 1, dance: 1, dt: RM.T }); c.restore();
    c.save(); c.translate(x, tagY); c.scale(0.78, 0.78); rmTag(c, R.nm, 0, -13, { me: R.me, adm: R.o.adm || (R.me ? RM.myAdm : 0) }); c.restore();
  }
  /* ================= دولاب الهوا الاحترافي ================= */
  function ferAngle() { return now() * 0.19; }
  rmFerPos = function (i) { const F = RM_FER, a = ferAngle() + i * TAU / F.n; return [F.x + Math.cos(a) * F.R, F.cy + Math.sin(a) * F.R]; };
  function truss(c, x0, y0, x1, y1, w, col) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L * w, ny = dx / L * w, n = Math.max(3, Math.round(L / 14));
    c.strokeStyle = col; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x0 + nx, y0 + ny); c.lineTo(x1 + nx * 0.4, y1 + ny * 0.4); c.moveTo(x0 - nx, y0 - ny); c.lineTo(x1 - nx * 0.4, y1 - ny * 0.4); c.stroke();
    c.lineWidth = 1; c.beginPath(); for (let k = 0; k <= n; k++) { const u = k / n, s = 1 - u * 0.6, px = x0 + dx * u, py = y0 + dy * u; c[k ? 'lineTo' : 'moveTo'](px + (k % 2 ? nx : -nx) * s, py + (k % 2 ? ny : -ny) * s); } c.stroke();
  }
  rmFerrisDraw = function (c) {
    const F = RM_FER, T = RM.T, a0 = ferAngle(), t = now(), nd = nightD(); c.save();
    c.fillStyle = 'rgba(0,0,0,.22)'; ell(c, F.x, F.by + 4, 92, 13); c.fill();
    // القاعدة: منصة ودرج وحاجز
    const bg = c.createLinearGradient(0, F.by - 16, 0, F.by + 8); bg.addColorStop(0, '#e9e4f4'); bg.addColorStop(1, '#a99cc4'); c.fillStyle = bg; rr(c, F.x - 78, F.by - 14, 156, 20, 6); c.fill();
    c.fillStyle = '#8a7aa8'; for (let k = 0; k < 4; k++) c.fillRect(F.x - 20 + k * 3, F.by + 6 - k * 5, 40 - k * 6, 3);
    c.strokeStyle = '#ffd166'; c.lineWidth = 2; c.beginPath(); c.moveTo(F.x - 76, F.by - 24); c.lineTo(F.x - 28, F.by - 24); c.moveTo(F.x + 28, F.by - 24); c.lineTo(F.x + 76, F.by - 24); c.stroke();
    for (let k = 0; k < 9; k++) { const px = F.x - 76 + k * 6; if (px < F.x - 28) { c.beginPath(); c.moveTo(px, F.by - 24); c.lineTo(px, F.by - 14); c.stroke(); } const qx = F.x + 28 + k * 6; if (qx <= F.x + 76) { c.beginPath(); c.moveTo(qx, F.by - 24); c.lineTo(qx, F.by - 14); c.stroke(); } }
    // الأرجل الخلفية
    truss(c, F.x - 60, F.by - 12, F.x, F.cy, 5, '#3e4a78'); truss(c, F.x + 60, F.by - 12, F.x, F.cy, 5, '#3e4a78');
    // العجلة: إطارين + شبكة + أضوية
    const Ro = F.R + 6, Ri = F.R - 8;
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.1; for (let i = 0; i < 16; i++) { const a = a0 + i * TAU / 16; c.beginPath(); c.moveTo(F.x + Math.cos(a) * 12, F.cy + Math.sin(a) * 12); c.lineTo(F.x + Math.cos(a) * Ri, F.cy + Math.sin(a) * Ri); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 0.8; c.beginPath(); for (let i = 0; i <= 48; i++) { const a = a0 + i * TAU / 48, r = i % 2 ? Ro : Ri; c[i ? 'lineTo' : 'moveTo'](F.x + Math.cos(a) * r, F.cy + Math.sin(a) * r); } c.stroke();
    c.lineWidth = 4.5; c.strokeStyle = '#ff5fa8'; c.beginPath(); c.arc(F.x, F.cy, Ro, 0, TAU); c.stroke(); c.lineWidth = 3; c.strokeStyle = '#8f5cff'; c.beginPath(); c.arc(F.x, F.cy, Ri, 0, TAU); c.stroke();
    c.lineWidth = 1.4; c.strokeStyle = '#ffd166'; c.beginPath(); c.arc(F.x, F.cy, 30, 0, TAU); c.stroke(); for (let i = 0; i < 8; i++) { const a = -a0 * 1.6 + i * TAU / 8; c.beginPath(); c.moveTo(F.x + Math.cos(a) * 12, F.cy + Math.sin(a) * 12); c.lineTo(F.x + Math.cos(a) * 30, F.cy + Math.sin(a) * 30); c.stroke(); }
    const cols = ['#ff4d6d', '#ffd166', '#5ad1ff', '#8ddc7a', '#c78bff', '#ff9a4a'];
    for (let i = 0; i < 36; i++) { const a = a0 + i * TAU / 36, on = Math.sin(i * 0.9 - t * 5) > -0.1; bulb(c, F.x + Math.cos(a) * Ro, F.cy + Math.sin(a) * Ro, 2.3, cols[(i + Math.floor(t * 2)) % 6], on); }
    // المحور
    const hg = c.createRadialGradient(F.x - 3, F.cy - 3, 1, F.x, F.cy, 13); hg.addColorStop(0, '#fff6c8'); hg.addColorStop(1, '#d49a10'); c.fillStyle = hg; c.beginPath(); c.arc(F.x, F.cy, 12, 0, TAU); c.fill(); c.strokeStyle = '#7a5200'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#ff5fa8'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -a0 * 2 + k * Math.PI / 5, r = k % 2 ? 3 : 7.5; c[k ? 'lineTo' : 'moveTo'](F.x + Math.cos(a) * r, F.cy + Math.sin(a) * r); } c.closePath(); c.fill();
    // الأرجل الأمامية
    truss(c, F.x - 50, F.by - 10, F.x, F.cy + 2, 4, '#5b6aa8'); truss(c, F.x + 50, F.by - 10, F.x, F.cy + 2, 4, '#5b6aa8');
    // الكابينات: سقف وأعمدة وشباك مفتوح ومقعد — تبقى واكفة وتتمرجح شوية، والراكب يبين كامل
    const riders = rmRiders('fer');
    for (let i = 0; i < F.n; i++) {
      const p = rmFerPos(i), col = cols[i], sw = Math.sin(t * 1.3 + i) * 0.06; c.save(); c.translate(p[0], p[1]);
      c.fillStyle = '#3a3a4a'; c.beginPath(); c.arc(0, 0, 3.2, 0, TAU); c.fill(); c.rotate(sw);
      c.strokeStyle = '#3a3a4a'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 7); c.stroke();
      const rg = c.createLinearGradient(0, 6, 0, 16); rg.addColorStop(0, hexL(col, 0.35)); rg.addColorStop(1, col); c.fillStyle = rg; c.beginPath(); c.moveTo(-25, 16); c.quadraticCurveTo(0, 2, 25, 16); c.lineTo(23, 18); c.lineTo(-23, 18); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(-16, 13); c.quadraticCurveTo(0, 6, 16, 13); c.lineTo(14, 13.6); c.quadraticCurveTo(0, 7.6, -14, 13.6); c.fill();
      c.fillStyle = 'rgba(30,40,70,.28)'; rr(c, -21, 18, 42, 18, 4); c.fill();   // جوة الكابينة
      c.fillStyle = hexL(col, -0.25); rr(c, -19, 30, 38, 5, 2); c.fill();   // المقعد
      riders.filter(R => R.i === i).forEach(R => { c.save(); c.rotate(-sw); rider(c, R, 0, 40, 0.56, -2); c.restore(); });
      c.strokeStyle = hexL(col, -0.3); c.lineWidth = 2.4; [-21, 21].forEach(px => { c.beginPath(); c.moveTo(px, 17); c.lineTo(px, 36); c.stroke(); });   // الأعمدة
      const bgr = c.createLinearGradient(0, 33, 0, 48); bgr.addColorStop(0, col); bgr.addColorStop(1, hexL(col, -0.35)); c.fillStyle = bgr; rr(c, -24, 33, 48, 15, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.45)'; rr(c, -19, 36, 38, 2.6, 1.3); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; rr(c, -24, 33, 48, 15, 7); c.stroke();
      c.strokeStyle = '#ffd166'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-20, 32); c.lineTo(20, 32); c.stroke();   // حاجز الأمان
      if (nd > 0.2) { c.fillStyle = 'rgba(255,230,150,' + 0.45 * nd + ')'; rr(c, -20, 19, 40, 13, 3); c.fill(); }
      c.restore();
    }
    sign(c, '🎡 دولاب الهوا', F.x, F.by + 24, '#ff5fa8', nd); c.restore();
  };

  /* ================= الدوّارة الاحترافية ================= */
  const carA = () => now() * 0.62;
  rmCarPos = function (i) { const C = RM_CAR, a = carA() + i * TAU / C.n; return [C.x + Math.cos(a) * C.R, C.y + Math.sin(a) * C.R * 0.3, Math.sin(a), Math.cos(a)]; };
  function horse(c, x, y, f, col, sad, gal) {
    c.save(); c.translate(x, y); c.scale(f, 1); c.lineJoin = 'round'; c.lineCap = 'round';
    const lg = (x0, a, b) => { c.strokeStyle = '#efe6f6'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, 3); c.lineTo(x0 + Math.sin(a) * 6, 10); c.lineTo(x0 + Math.sin(a + b) * 9, 15); c.stroke(); c.strokeStyle = '#6a4a8a'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(x0 + Math.sin(a + b) * 9, 15); c.lineTo(x0 + Math.sin(a + b) * 9 + 1.5, 16.5); c.stroke(); };
    lg(-9, 0.9 + gal * 0.3, -0.8); lg(8, -0.9 - gal * 0.3, 0.9);
    c.fillStyle = col; c.strokeStyle = '#7a5a9a'; c.lineWidth = 1.2; ell(c, 0, 0, 15, 7.5); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(9, -3); c.quadraticCurveTo(15, -12, 14, -18); c.lineTo(20, -17); c.quadraticCurveTo(24, -14, 23, -11); c.lineTo(17, -11); c.quadraticCurveTo(16, -4, 13, 1); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ff7ab8'; c.beginPath(); c.moveTo(10, -6); c.quadraticCurveTo(10, -18, 15, -20); c.quadraticCurveTo(12, -12, 13, -4); c.fill();   // العرف
    c.beginPath(); c.moveTo(-14, -2); c.quadraticCurveTo(-24, -4 + gal * 2, -22, 8); c.quadraticCurveTo(-18, 2, -13, 1); c.fill();   // الذيل
    c.fillStyle = '#3a2a4a'; c.beginPath(); c.arc(19, -15, 1, 0, TAU); c.fill();
    c.fillStyle = sad; rr(c, -6, -9, 13, 6, 3); c.fill(); c.fillStyle = '#ffd166'; c.fillRect(-1, -4, 2, 8); c.strokeStyle = '#ffd166'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(22, -12); c.lineTo(5, -6); c.stroke();
    c.restore();
  }
  rmCarouselDraw = function (c) {
    const C = RM_CAR, t = now(), a0 = carA(), nd = nightD(), R = C.R + 16; c.save();
    c.fillStyle = 'rgba(0,0,0,.22)'; ell(c, C.x, C.y + 12, R + 12, (R + 12) * 0.32); c.fill();
    // القاعدة
    c.fillStyle = '#7a3aa8'; ell(c, C.x, C.y + 6, R, R * 0.32); c.fill(); c.fillRect(C.x - R, C.y - 2, R * 2, 8);
    const fg = c.createLinearGradient(0, C.y - R * 0.32, 0, C.y + R * 0.32); fg.addColorStop(0, '#fbe9ff'); fg.addColorStop(1, '#e0c0f4'); c.fillStyle = fg; ell(c, C.x, C.y - 2, R, R * 0.32); c.fill();
    c.strokeStyle = 'rgba(150,90,190,.35)'; c.lineWidth = 1; for (let k = 0; k < 16; k++) { const a = a0 + k * TAU / 16; c.beginPath(); c.moveTo(C.x, C.y - 2); c.lineTo(C.x + Math.cos(a) * R, C.y - 2 + Math.sin(a) * R * 0.32); c.stroke(); }
    for (let k = 0; k < 22; k++) { const a = k * TAU / 22; if (Math.sin(a) < 0) continue; bulb(c, C.x + Math.cos(a) * R, C.y + 3 + Math.sin(a) * R * 0.32, 1.8, k % 2 ? '#ffd166' : '#ff7ab8', Math.sin(k - t * 6) > -0.2); }
    const riders = rmRiders('car'), items = []; for (let i = 0; i < C.n; i++) items.push([rmCarPos(i), i]); items.sort((a, b) => a[0][1] - b[0][1]);
    const one = ([p, i]) => {
      const bob = Math.sin(t * 2.6 + i * 1.7) * 6, hx = p[0], hy = p[1] - 30 + bob, col = ['#ffffff', '#ffe0f0', '#dff3ff', '#fff4cc', '#e6ffe0', '#efe0ff'][i], sad = ['#ff5a8a', '#8f5cff', '#20b2aa', '#ff9a4a', '#e0306a', '#3a8adf'][i];
      for (let k = 0; k < 6; k++) { c.strokeStyle = k % 2 ? '#fff6c8' : '#d4a017'; c.lineWidth = 2.6; const y0 = C.y - 86 + k * ((p[1] + 6 - (C.y - 86)) / 6); c.beginPath(); c.moveTo(hx, y0); c.lineTo(hx, y0 + (p[1] + 6 - (C.y - 86)) / 6); c.stroke(); }
      horse(c, hx, hy, p[3] > 0 ? 1 : -1, col, sad, Math.sin(t * 5 + i));
      riders.filter(R => R.i === i).forEach(R => rider(c, R, hx - (p[3] > 0 ? 2 : -2), hy - 2, 0.5, hy - 34));
    };
    items.filter(it => it[0][2] < 0).forEach(one);
    // العمود الوسطي بمرايات وأضوية
    const cg = c.createLinearGradient(C.x - 15, 0, C.x + 15, 0); cg.addColorStop(0, '#b07a10'); cg.addColorStop(0.5, '#ffe9a0'); cg.addColorStop(1, '#b07a10'); c.fillStyle = cg; c.fillRect(C.x - 15, C.y - 88, 30, 86);
    for (let k = 0; k < 3; k++) { const off = ((a0 * 30 + k * 10) % 30) - 15; c.fillStyle = 'rgba(200,235,255,.75)'; c.fillRect(C.x + off - 3, C.y - 78, 6, 60); }
    for (let k = 0; k < 5; k++) bulb(c, C.x, C.y - 80 + k * 15, 2, '#ff7ab8', Math.sin(k * 2 - t * 4) > 0);
    items.filter(it => it[0][2] >= 0).forEach(one);
    // السقف: خيمة مخططة طابقين + حافة متموجة بأضوية + علم
    const ry = C.y - 88; c.save();
    for (let k = 0; k < 16; k++) { const a1 = a0 * 0.999 + k * TAU / 16, a2 = a1 + TAU / 16; if (Math.sin((a1 + a2) / 2) < -0.2) continue; c.fillStyle = k % 2 ? '#ffffff' : '#ff4d8a'; c.beginPath(); c.moveTo(C.x, ry - 44); c.lineTo(C.x + Math.cos(a1) * (R + 8), ry + Math.sin(a1) * (R + 8) * 0.3); c.lineTo(C.x + Math.cos(a2) * (R + 8), ry + Math.sin(a2) * (R + 8) * 0.3); c.closePath(); c.fill(); }
    c.fillStyle = '#8f5cff'; c.beginPath(); c.ellipse(C.x, ry - 44, 22, 6, 0, 0, TAU); c.fill();
    for (let k = 0; k < 8; k++) { const a1 = k * TAU / 8, a2 = a1 + TAU / 8; c.fillStyle = k % 2 ? '#ffd166' : '#8f5cff'; c.beginPath(); c.moveTo(C.x, ry - 66); c.lineTo(C.x + Math.cos(a1) * 22, ry - 44 + Math.sin(a1) * 6); c.lineTo(C.x + Math.cos(a2) * 22, ry - 44 + Math.sin(a2) * 6); c.closePath(); c.fill(); }
    for (let k = 0; k < 24; k++) { const a = k * TAU / 24; if (Math.sin(a) < -0.1) continue; const vx = C.x + Math.cos(a) * (R + 8), vy = ry + Math.sin(a) * (R + 8) * 0.3; c.fillStyle = k % 2 ? '#ff4d8a' : '#ffd166'; c.beginPath(); c.arc(vx, vy, 6, 0, Math.PI); c.fill(); bulb(c, vx, vy + 2, 1.7, '#fff6a0', Math.sin(k * 1.3 + t * 5) > 0); }
    c.strokeStyle = '#7a5200'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(C.x, ry - 66); c.lineTo(C.x, ry - 84); c.stroke(); c.fillStyle = '#ff4d6d'; c.beginPath(); c.moveTo(C.x, ry - 84); c.quadraticCurveTo(C.x + 9, ry - 84 + Math.sin(t * 6) * 2, C.x + 16, ry - 80); c.lineTo(C.x, ry - 76); c.fill();
    c.restore();
    if (riders.length && RM.T % 40 === 0) RM.sparks.push({ x: C.x + (Math.random() - 0.5) * 80, y: C.y - 60, vx: (Math.random() - 0.5) * 0.4, vy: -0.6, t: 50, dust: 1 });
    sign(c, '🎠 الدوّارة', C.x, C.y + 42, '#ffd166', nd); c.restore();
  };

  /* ================= المسبح الاحترافي ================= */
  rmPoolDraw = function (c) {
    const P = RM_POOL, T = RM.T, t = now(), nd = nightD(); c.save();
    // الأرضية حول المسبح: بلاط حجري + حافة بيضاء
    const dg = c.createLinearGradient(0, P.y - 22, 0, P.y + P.h + 22); dg.addColorStop(0, '#f4ece0'); dg.addColorStop(1, '#e2d6c4'); c.fillStyle = dg; rr(c, P.x - 26, P.y - 22, P.w + 52, P.h + 44, 20); c.fill();
    c.strokeStyle = 'rgba(160,140,110,.28)'; c.lineWidth = 1; for (let x = P.x - 20; x < P.x + P.w + 26; x += 18) { c.beginPath(); c.moveTo(x, P.y - 22); c.lineTo(x, P.y - 6); c.moveTo(x, P.y + P.h + 6); c.lineTo(x, P.y + P.h + 22); c.stroke(); }
    c.fillStyle = '#ffffff'; rr(c, P.x - 7, P.y - 7, P.w + 14, P.h + 14, 15); c.fill(); c.strokeStyle = 'rgba(120,150,170,.35)'; c.lineWidth = 1; c.stroke();
    // المي: عميق يمين، ضحل يسار
    const wg = c.createLinearGradient(P.x, 0, P.x + P.w, 0); wg.addColorStop(0, '#62e0f5'); wg.addColorStop(0.55, '#24aee6'); wg.addColorStop(1, '#0f6fb8'); c.fillStyle = wg; rr(c, P.x, P.y, P.w, P.h, 11); c.fill();
    c.save(); rr(c, P.x, P.y, P.w, P.h, 11); c.clip();
    // خطوط القاع (تتموج من ورا المي)
    c.strokeStyle = 'rgba(10,50,120,.35)'; c.lineWidth = 5; [P.y + 38, P.y + 75, P.y + 112].forEach((y, j) => { c.beginPath(); for (let x = P.x + 24; x <= P.x + P.w - 24; x += 10) c.lineTo(x, y + Math.sin(x / 26 + t * 2 + j) * 1.6); c.stroke(); });
    // انعكاس الضوه بالقاع (كوستك)
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1.3;
    for (let j = 0; j < 9; j++) { c.beginPath(); for (let x = P.x; x <= P.x + P.w; x += 9) { const y = P.y + 8 + j * 17 + Math.sin(x / 17 + t * 1.7 + j * 1.9) * 5 + Math.sin(x / 7 - t * 2.3) * 1.5; c.lineTo(x, y); } c.stroke(); }
    for (let j = 0; j < 14; j++) { c.beginPath(); for (let y = P.y; y <= P.y + P.h; y += 9) { const x = P.x + 12 + j * 24 + Math.sin(y / 15 + t * 1.5 + j) * 6; c.lineTo(x, y); } c.stroke(); }
    // لمعة الشمس
    for (let i = 0; i < 18; i++) { const ph = (t * 0.9 + i * 0.37) % 1, x = P.x + ((i * 83) % P.w), y = P.y + 8 + ((i * 47) % (P.h - 16)); c.globalAlpha = Math.max(0, Math.sin(ph * Math.PI)) * 0.9; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x, y - 1.2); c.lineTo(x + 4, y); c.lineTo(x, y + 1.2); c.fill(); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(P.x + P.w * 0.35, P.y); c.lineTo(P.x + P.w * 0.2, P.y + P.h); c.lineTo(P.x, P.y + P.h); c.fill();   // انعكاس السما
    // الحبال مع العوامات الملونة
    [P.y + 50, P.y + 100].forEach((y, j) => { for (let x = P.x + 8; x < P.x + P.w - 6; x += 7) { const yy = y + Math.sin(x / 30 + t * 2 + j) * 1.3, k = Math.floor((x - P.x) / 7); c.fillStyle = k % 6 < 2 ? '#ff4d6d' : k % 6 < 4 ? '#ffffff' : '#2a6aff'; ell(c, x, yy, 3.2, 2.2); c.fill(); } });
    // أضوية تحت المي بالليل
    if (nd > 0.1) [[P.x + 40, P.y + P.h - 6], [P.x + P.w / 2, P.y + P.h - 6], [P.x + P.w - 40, P.y + P.h - 6]].forEach(L => { const g = c.createRadialGradient(L[0], L[1], 1, L[0], L[1], 70); g.addColorStop(0, 'rgba(160,240,255,' + 0.55 * nd + ')'); g.addColorStop(1, 'rgba(160,240,255,0)'); c.fillStyle = g; c.fillRect(L[0] - 70, L[1] - 70, 140, 80); });
    c.restore();
    // عوامات تطوف: دونات وبطة
    const fl = (x, y, f) => { c.save(); c.translate(x, y + Math.sin(t * 2 + x) * 1.2); f(); c.restore(); };
    fl(P.x + 70 + Math.sin(t * 0.3) * 34, P.y + 72 + Math.cos(t * 0.25) * 16, () => { c.fillStyle = 'rgba(0,40,90,.25)'; ell(c, 1, 3, 13, 5); c.fill(); c.lineWidth = 7; c.strokeStyle = '#ff7ab8'; ell(c, 0, 0, 12, 6); c.stroke(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.setLineDash([3, 5]); ell(c, 0, -1, 12, 6); c.stroke(); c.setLineDash([]); });
    fl(P.x + 230 + Math.cos(t * 0.22) * 40, P.y + 120 + Math.sin(t * 0.31) * 10, () => { c.fillStyle = 'rgba(0,40,90,.25)'; ell(c, 1, 4, 12, 4); c.fill(); c.fillStyle = '#ffd23a'; ell(c, 0, 0, 11, 6); c.fill(); c.beginPath(); c.arc(7, -6, 5, 0, TAU); c.fill(); c.fillStyle = '#ff8a2a'; c.beginPath(); c.moveTo(11, -6); c.lineTo(16, -5); c.lineTo(11, -3.5); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(8.5, -7.5, 0.9, 0, TAU); c.fill(); });
    // سلّم كروم + لوح القفز + زحليكة
    const lad = (x) => { c.strokeStyle = '#d8e2ea'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, P.y - 12); c.quadraticCurveTo(x, P.y - 20, x + 6, P.y - 18); c.moveTo(x, P.y - 12); c.lineTo(x, P.y + 22); c.moveTo(x + 12, P.y - 12); c.quadraticCurveTo(x + 12, P.y - 20, x + 18, P.y - 18); c.moveTo(x + 12, P.y - 12); c.lineTo(x + 12, P.y + 22); c.stroke(); c.strokeStyle = '#9aa8b4'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x, P.y + 2 + k * 8); c.lineTo(x + 12, P.y + 2 + k * 8); c.stroke(); } };
    lad(P.x + P.w - 34); lad(P.x + 28);
    { const bx = P.x + P.w + 4, by = P.y + 70; c.fillStyle = '#8a98a8'; c.fillRect(bx + 4, by - 2, 8, 18); c.fillStyle = '#2a8adf'; rr(c, bx - 46, by - 6, 58, 7, 3); c.fill(); c.fillStyle = '#fff'; c.fillRect(bx - 44, by - 5, 54, 1.5); }   // لوح القفز
    { const sx = P.x - 14, sy = P.y + 20; c.lineCap = 'round'; c.strokeStyle = '#8a98a8'; c.lineWidth = 3; c.beginPath(); c.moveTo(sx - 6, sy + 70); c.lineTo(sx - 6, sy - 10); c.moveTo(sx + 10, sy + 70); c.lineTo(sx + 10, sy - 10); c.stroke(); c.strokeStyle = '#ffd23a'; c.lineWidth = 12; c.beginPath(); c.moveTo(sx + 2, sy - 14); c.bezierCurveTo(sx + 40, sy - 10, sx - 30, sy + 30, sx + 34, sy + 52); c.stroke(); c.strokeStyle = '#ff9a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(sx + 2, sy - 18); c.bezierCurveTo(sx + 40, sy - 14, sx - 30, sy + 26, sx + 34, sy + 48); c.stroke(); c.strokeStyle = 'rgba(200,240,255,.8)'; c.lineWidth = 2; c.setLineDash([4, 6]); c.lineDashOffset = -t * 30; c.beginPath(); c.moveTo(sx + 2, sy - 14); c.bezierCurveTo(sx + 40, sy - 10, sx - 30, sy + 30, sx + 34, sy + 52); c.stroke(); c.setLineDash([]); c.lineCap = 'butt'; }
    // كرسي المنقذ
    { const lx = P.x + P.w + 30, ly = P.y + P.h + 4; c.strokeStyle = '#f4f4f4'; c.lineWidth = 3; c.beginPath(); c.moveTo(lx - 10, ly); c.lineTo(lx - 6, ly - 42); c.moveTo(lx + 10, ly); c.lineTo(lx + 6, ly - 42); c.moveTo(lx - 9, ly - 14); c.lineTo(lx + 9, ly - 14); c.stroke(); c.fillStyle = '#ff4d4d'; rr(c, lx - 10, ly - 50, 20, 9, 3); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 7px Cairo, system-ui'; c.textAlign = 'center'; c.fillText('+', lx, ly - 43); }
    sign(c, '🏊 المسبح', P.x + P.w / 2, P.y - 34, '#5ad1ff', nd); c.restore();
  };
  /* السباحة الحقيقية: لما يتحرك ينبطح على المي ويسبح حرة (راسه لگدام ورجليه تضرب ورا)، ولما يوكف يعوم واكف وكتافه وراسه فوك المي */
  function swimSt(o) {
    const key = o === RM.me ? '@me' : (o.name || ''), W = R4.wk[key] || (R4.wk[key] = { x: o.x, y: o.y, tr: [], last: 0, dir: 1 }), nowT = performance.now();
    const dx = o.x - W.x, dy = o.y - W.y, mv = Math.hypot(dx, dy); if (mv > 0.25) { W.last = nowT; if (Math.abs(dx) > 0.15) W.dir = dx > 0 ? 1 : -1; } W.mv = mv; W.x = o.x; W.y = o.y;
    W.swim = nowT - W.last < 450; return W;
  }
  rmSwimStart = function (c, o) {
    if (!rmInPool(o)) return false; const T = RM.T, W = swimSt(o), ph = (o.pseed || 0);
    if (W.swim) {
      const dir = W.dir, wl = o.y - 30 + Math.sin(T / 6 + ph) * 0.8; o._wl = wl; o._sw = 1; o._dir = dir;
      c.fillStyle = 'rgba(8,50,100,.32)'; c.beginPath(); c.ellipse(o.x - dir * 4, wl + 6, 40, 7, 0, 0, TAU); c.fill();   // جسمه تحت المي
      c.save(); c.beginPath(); c.rect(o.x - 120, wl - 140, 240, 140 + 1); c.clip(); R4.sw = { bx: c.getTransform(), x: o.x, wl };
      const roll = Math.sin(T / 5 + ph) * 0.08; c.translate(o.x, wl + 3); c.rotate(dir * (Math.PI / 2 * 0.9) + roll); c.translate(-o.x, -(o.y - 40));
      return true;
    }
    const wl = o.y - 50 + Math.sin(T / 11 + ph) * 1.6; o._wl = wl; o._sw = 0;
    c.fillStyle = 'rgba(8,50,100,.3)'; c.beginPath(); c.ellipse(o.x, wl + 14, 14, 20, 0, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.rect(o.x - 80, o.y - 260, 160, wl - (o.y - 260)); c.clip(); c.translate(0, Math.sin(T / 11 + ph) * 1.6);
    return true;
  };
  /* الاسم والفقاعة للسابح المنبطح يبقون عدلين فوك راسه */
  const tagO = rmTag; rmTag = function (c, txt, x, y, o) { const S = R4.sw; if (!S) return tagO(c, txt, x, y, o); c.save(); c.setTransform(S.bx); tagO(c, txt, S.x, S.wl - 36, o); c.restore(); };
  const bubO = rmBub; rmBub = function (c, n, x, y, a, b2) { const S = R4.sw; if (!S) return bubO(c, n, x, y, a, b2); c.save(); c.setTransform(S.bx); bubO(c, n, S.x, S.wl - 44, a, b2); c.restore(); };
  /* السباحة: موجات حول السابح وأثر مي لما يتحرك */
  rmSwimEnd = function (c, o) {
    c.restore(); R4.sw = null; const wl = o._wl, T = RM.T, key = o === RM.me ? '@me' : (o.name || ''), W = R4.wk[key] || (R4.wk[key] = { x: o.x, y: o.y, tr: [] });
    const mv = W.mv || 0; if (mv > 0.25 && T % 3 === 0) W.tr.push({ x: o.x - (o._sw ? (o._dir || 1) * 30 : 0), y: wl, t: 34 });
    c.save(); W.tr = W.tr.filter(p => --p.t > 0); W.tr.forEach(p => { const k = 1 - p.t / 30; c.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - k)) + ')'; c.lineWidth = 1.3; c.beginPath(); c.ellipse(p.x, p.y, 6 + k * 18, (6 + k * 18) * 0.28, 0, 0, TAU); c.stroke(); });
    if (o._sw) {   // ضربات الرجلين ورا + موجة V گدام الراس + ضربات الإيدين
      const d = o._dir || 1, fx = o.x - d * 42, hx = o.x + d * 30;
      c.fillStyle = 'rgba(255,255,255,.75)'; for (let k = 0; k < 5; k++) { const a = T / 2.2 + k * 1.3; c.beginPath(); c.arc(fx + Math.sin(a) * 5 - d * k * 2, wl - Math.abs(Math.sin(a * 1.7)) * 4, 1.8 + (k % 2), 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hx + d * 6, wl); c.lineTo(hx - d * 22, wl - 6); c.moveTo(hx + d * 6, wl); c.lineTo(hx - d * 22, wl + 6); c.stroke();
      const st = (T / 9 + (o.pseed || 0)) % TAU, ax = o.x + d * 10 + Math.cos(st) * d * 20, ay = wl - Math.max(0, Math.sin(st)) * 12;
      if (Math.sin(st) > 0) { c.strokeStyle = 'rgba(255,214,160,.95)'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(o.x + d * 8, wl - 2); c.quadraticCurveTo((o.x + d * 8 + ax) / 2, ay - 6, ax, ay); c.stroke(); }
      if (Math.abs(Math.sin(st)) < 0.12 && RM.T % 2 === 0) for (let i = 0; i < 4; i++) R4.drops.push({ x: ax, y: wl, vx: (Math.random() - 0.5) * 1.6, vy: -1 - Math.random() * 1.4, wl, t: 30 });
      c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(o.x - d * 6, wl, 40, 5, 0, 0, TAU); c.fill();
    } else { c.fillStyle = 'rgba(255,255,255,.32)'; c.beginPath(); c.ellipse(o.x, wl, 15, 4, 0, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.6; for (let i = 0; i < 2; i++) { const r = 12 + i * 7 + Math.sin(T / 7 + i) * 2; c.globalAlpha = 0.75 - i * 0.3; c.beginPath(); c.ellipse(o.x, wl, r, r * 0.3, 0, 0, TAU); c.stroke(); }
    c.restore();
    if (mv > 0.4 && T % 5 === 0) for (let i = 0; i < 3; i++) R4.drops.push({ x: o.x + (Math.random() - 0.5) * 20, y: wl, vx: (Math.random() - 0.5) * 1.4, vy: -1.2 - Math.random() * 1.2, wl, t: 40 });
  };
  /* رش المي: قوس مي حقيقي يوصل لگدام ويسوي دوائر وين ما يطيح — والكل يشوفه */
  function splashAt(x, wl, dir, big) {
    const n = big ? 46 : 30;
    for (let i = 0; i < n; i++) { const a = -0.25 - Math.random() * 0.9, sp = 2.2 + Math.random() * 3.4; R4.drops.push({ x: x + dir * 12, y: wl - 8, vx: dir * Math.cos(a) * sp, vy: Math.sin(a) * sp * 1.4 - 0.8, wl, t: 90, big: Math.random() < 0.35 }); }
    for (let i = 0; i < 12; i++) R4.drops.push({ x: x + (Math.random() - 0.5) * 16, y: wl - 4, vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 2.5, wl, t: 60 });
    R4.rings.push({ x: x + dir * 8, y: wl, t: 36, r: 6 });
  }
  window.r4Splash = function () {
    const m = RM.me; if (!rmInPool(m)) return; const wl = m.y - 30; splashAt(m.x, wl, m.dir || 1, true);
    snd([['triangle', 900, 260, 0.22, 0.05], ['sine', 1400, 500, 0.18, 0.035, 0.05], ['triangle', 700, 200, 0.3, 0.03, 0.12]]);
    rmSend({ t: 'rm_react', e: '💦' });
  };
  const reactOld = rmReactAdd; rmReactAdd = function (n, e) {
    if (e === '💦') { const o = Object.values(RM.others).find(q => q.name === n); if (o && rmInPool(o)) { splashAt(o.x, o.y - 30, o.dir || 1, true); snd([['triangle', 900, 260, 0.2, 0.03]]); return; } }
    return reactOld(n, e);
  };
  function dropsDraw(c) {
    if (!R4.drops.length && !R4.rings.length) return; const P = RM_POOL; c.save();
    R4.drops = R4.drops.filter(d => {
      d.vy += 0.16; d.x += d.vx; d.y += d.vy; d.t--;
      const inP = d.x > P.x && d.x < P.x + P.w && d.y > P.y && d.y < P.y + P.h;
      if (d.vy > 0 && d.y >= d.wl + (inP ? 6 : 40)) { if (inP && Math.random() < 0.5) R4.rings.push({ x: d.x, y: d.y, t: 22, r: 2 }); return false; }
      if (d.t <= 0) return false;
      c.fillStyle = 'rgba(200,240,255,.95)'; c.beginPath(); const s = d.big ? 2.3 : 1.4; c.ellipse(d.x, d.y, s * 0.8, s * 1.3, Math.atan2(d.vy, d.vx) + Math.PI / 2, 0, TAU); c.fill(); return true;
    });
    R4.rings = R4.rings.filter(r => { r.t--; const k = 1 - r.t / 36; c.strokeStyle = 'rgba(255,255,255,' + Math.max(0, 0.8 - k) + ')'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(r.x, r.y, r.r + k * 20, (r.r + k * 20) * 0.3, 0, 0, TAU); c.stroke(); return r.t > 0; });
    if (R4.drops.length > 400) R4.drops.splice(0, R4.drops.length - 400); c.restore();
  }

  /* ================= لعبة جديدة 1: سفينة القرصان 🏴‍☠️ ================= */
  function pirAng() {   // دورة 32 ثانية: تبدي تتمرجح، توصل لأعلى شي، تهدأ، وتوكف شوية
    const t = now(), ph = t % 32; let A; if (ph < 9) A = ph / 9; else if (ph < 21) A = 1; else if (ph < 29) A = 1 - (ph - 21) / 8; else A = 0;
    A = A * A * (3 - 2 * A); return { a: Math.sin(t * TAU / 4.6) * 1.0 * A, A };
  }
  function pirSeat(i) { const S = pirAng(), a = S.a, off = (i - (PIR.n - 1) / 2) * 20, cx = PIR.x + Math.sin(a) * PIR.L, cy = PIR.py + Math.cos(a) * PIR.L, dy = -9; return [cx + off * Math.cos(a) + dy * Math.sin(a), cy - off * Math.sin(a) + dy * Math.cos(a), a]; }
  function pirDraw(c) {
    const t = now(), nd = nightD(), { a, A } = pirAng(), X = PIR.x, PY = PIR.py, B = PIR.y; c.save();
    c.fillStyle = 'rgba(0,0,0,.22)'; ell(c, X, B + 4, 110, 14); c.fill();
    c.fillStyle = '#6a4a2a'; rr(c, X - 96, B - 12, 192, 16, 5); c.fill(); c.fillStyle = '#8a6a3a'; rr(c, X - 96, B - 14, 192, 6, 3); c.fill();
    const leg = (x0) => { c.strokeStyle = '#2f3a5a'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, B - 10); c.lineTo(X, PY); c.stroke(); c.strokeStyle = '#4a5a8a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, B - 10); c.lineTo(X, PY); c.stroke(); };
    leg(X - 84); leg(X + 84);
    c.strokeStyle = '#2f3a5a'; c.lineWidth = 3; c.beginPath(); c.moveTo(X - 52, B - 50); c.lineTo(X + 52, B - 50); c.stroke();
    // السفينة
    c.save(); c.translate(X, PY); c.rotate(-a);
    c.strokeStyle = '#c0c8d8'; c.lineWidth = 3; c.beginPath(); c.moveTo(-6, 0); c.lineTo(-40, PIR.L - 14); c.moveTo(6, 0); c.lineTo(40, PIR.L - 14); c.stroke();
    c.translate(0, PIR.L);
    // الصاري والشراع والعلم
    c.strokeStyle = '#5a3418'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(0, -12); c.lineTo(0, -78); c.stroke();
    c.fillStyle = '#f4ead0'; c.beginPath(); c.moveTo(2, -72); c.quadraticCurveTo(30 + Math.sin(t * 2) * 3, -50, 2, -26); c.closePath(); c.fill(); c.strokeStyle = '#c8b890'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.moveTo(0, -78); c.quadraticCurveTo(10, -80 + Math.sin(t * 7) * 2, 20, -76); c.lineTo(20, -66); c.quadraticCurveTo(10, -70 + Math.sin(t * 7 + 1) * 2, 0, -68); c.fill();
    c.fillStyle = '#fff'; c.font = '7px system-ui'; c.textAlign = 'center'; c.fillText('☠', 10, -69);
    c.restore();
    // الركاب (واكفين بشكل طبيعي، ورا جدار السفينة)
    rmRiders('pir').forEach(R => { const s = pirSeat(R.i); rider(c, R, s[0], s[1] + 8, 0.52, s[1] - 26); });
    c.save(); c.translate(X, PY); c.rotate(-a); c.translate(0, PIR.L);
    // جسم السفينة
    const hg = c.createLinearGradient(0, -14, 0, 22); hg.addColorStop(0, '#a86a30'); hg.addColorStop(1, '#5a3418'); c.fillStyle = hg;
    c.beginPath(); c.moveTo(-82, -22); c.quadraticCurveTo(-70, 4, -48, 18); c.lineTo(48, 18); c.quadraticCurveTo(70, 4, 82, -22); c.lineTo(66, -10); c.lineTo(-66, -10); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(40,20,8,.5)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-70 + k * 6, -4 + k * 7); c.lineTo(70 - k * 6, -4 + k * 7); c.stroke(); }
    c.fillStyle = '#ffd166'; c.fillRect(-66, -12, 132, 3); for (let k = -3; k <= 3; k++) { c.fillStyle = '#2a1a0a'; c.beginPath(); c.arc(k * 18, 4, 2.6, 0, TAU); c.fill(); c.strokeStyle = '#ffd166'; c.lineWidth = 0.8; c.stroke(); }
    c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(82, -22); c.quadraticCurveTo(92, -32, 88, -40); c.quadraticCurveTo(86, -30, 78, -24); c.fill();   // رأس السفينة
    for (let k = 0; k < 12; k++) bulb(c, -60 + k * 11, -14, 1.5, k % 2 ? '#ff4d6d' : '#ffd166', Math.sin(k - t * 5) > 0);
    c.restore();
    c.fillStyle = '#ffd166'; c.beginPath(); c.arc(X, PY, 6, 0, TAU); c.fill(); c.strokeStyle = '#7a5200'; c.lineWidth = 2; c.stroke();
    if (A > 0.6 && Math.abs(a) > 0.85 && RM.T % 6 === 0 && rmRiders('pir').length) for (let i = 0; i < 2; i++) RM.sparks.push({ x: X + Math.sin(a) * (PIR.L + 20), y: PY + PIR.L - 20, vx: (Math.random() - 0.5) * 2, vy: -1, t: 30, dust: 1 });
    sign(c, '🏴‍☠️ سفينة القرصان', X, B + 24, '#ff9a4a', nd); c.restore();
  }

  /* ================= لعبة جديدة 2: الأفعوانية 🎢 ================= */
  const G = (u, c0, w, h) => { const d = ((u - c0 + 1.5) % 1) - 0.5; return h * Math.exp(-(d * d) / (2 * w * w)); };
  const elev = u => 10 + G(u, 0.46, 0.065, 110) + G(u, 0.66, 0.05, 62) + G(u, 0.83, 0.045, 46) + G(u, 0.04, 0.04, 34);
  const gpos = u => [CST.x + Math.cos(u * TAU) * CST.rx, CST.y + Math.sin(u * TAU) * CST.ry];
  const spos = u => { const g = gpos(u); return [g[0], g[1] - elev(u), g[1]]; };
  // جدول الوقت: يطلع ببطء على التلة الكبيرة (سلسلة) وينزل بسرعة، ويوكف بالمحطة 4 ثواني
  const CT = (() => {
    const N = 720, ts = [0]; let acc = 0; const em = 130;
    for (let k = 0; k < N; k++) { const u = (k + 0.5) / N; let v; if (u > 0.3 && u < 0.46) v = 0.35; else v = 0.45 + Math.sqrt(Math.max(0, em - elev(u))) * 0.12; acc += (1 / N) / v; ts.push(acc); }
    const lap = 12, k = lap / acc; for (let i = 0; i < ts.length; i++) ts[i] *= k; return { ts, N, lap, stop: 4 };
  })();
  function cstU(off) {   // مكان القطار (u) حسب الوقت — نفس الشي عند الكل
    const per = CT.lap + CT.stop, ph = now() % per; let u;
    if (ph < CT.stop) u = 0.25; else { const tt = ph - CT.stop, ts = CT.ts; let lo = 0, hi = CT.N; while (lo < hi) { const mid = (lo + hi) >> 1; if (ts[mid + 1] < tt) lo = mid + 1; else hi = mid; } const f = (tt - ts[lo]) / Math.max(1e-6, ts[lo + 1] - ts[lo]); u = 0.25 + (lo + f) / CT.N; }
    return ((u - off) % 1 + 1) % 1;
  }
  const carU = k => cstU(k * 0.024);
  function cstSeat(i) { const k = i >> 1, u = carU(k), p = spos(u), q = spos(u + 0.003), ang = Math.atan2(q[1] - p[1], q[0] - p[0]); return [p[0] + (i & 1 ? 5 : -5), p[1] - 6, ang, p[2]]; }
  function cstDraw(c) {
    const t = now(), nd = nightD(), N = 160; c.save();
    c.fillStyle = 'rgba(0,0,0,.08)'; ell(c, CST.x, CST.y + 4, CST.rx + 20, CST.ry + 14); c.fill();
    // الأعمدة
    for (let k = 0; k < 40; k++) { const u = k / 40, p = spos(u); if (p[2] - p[1] < 14) continue; c.strokeStyle = p[2] < CST.y ? '#7a86a8' : '#9aa6c8'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(p[0], p[2]); c.lineTo(p[0], p[1] + 3); c.stroke(); c.lineWidth = 0.8; c.beginPath(); c.moveTo(p[0] - 4, p[2]); c.lineTo(p[0], p[1] + 10); c.lineTo(p[0] + 4, p[2]); c.stroke(); }
    // السكة: الجزء البعيد بعدين القريب
    const rail = (front) => {
      c.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? '#ff4d8a' : '#3a2a5a'; c.lineWidth = pass ? 2.2 : 5; c.beginPath(); let on = false; for (let k = 0; k <= N; k++) { const u = k / N, p = spos(u), isF = Math.sin(u * TAU) >= 0; if (isF !== front) { on = false; continue; } if (!on) { c.moveTo(p[0], p[1]); on = true; } else c.lineTo(p[0], p[1]); } c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; for (let k = 0; k < N; k += 2) { const u = k / N; if ((Math.sin(u * TAU) >= 0) !== front) continue; const p = spos(u); c.beginPath(); c.moveTo(p[0], p[1] - 2.5); c.lineTo(p[0], p[1] + 2.5); c.stroke(); }
      for (let k = 0; k < 30; k++) { const u = k / 30; if ((Math.sin(u * TAU) >= 0) !== front) continue; const p = spos(u); bulb(c, p[0], p[1] + 5, 1.4, ['#ffd166', '#5ad1ff', '#ff7ab8'][k % 3], Math.sin(k * 0.8 - t * 6) > 0.2); }
    };
    // القطار
    const riders = rmRiders('cst');
    const cars = []; for (let k = 0; k < 4; k++) { const u = carU(k), p = spos(u), q = spos(u + 0.003); cars.push({ k, u, p, ang: Math.atan2(q[1] - p[1], q[0] - p[0]), fr: Math.sin(u * TAU) >= 0 }); }
    const car = (C) => {
      riders.filter(R => (R.i >> 1) === C.k).forEach(R => rider(c, R, C.p[0] + ((R.i & 1) ? 5 : -5), C.p[1] + 2, 0.42, C.p[1] - 24));
      c.save(); c.translate(C.p[0], C.p[1]); let an = C.ang; if (Math.cos(an) < 0) { c.scale(-1, 1); an = Math.PI - an; } c.rotate(an);
      const cg = c.createLinearGradient(0, -12, 0, 4); cg.addColorStop(0, ['#ff4d6d', '#ffd166', '#5ad1ff', '#8f5cff'][C.k]); cg.addColorStop(1, '#3a2a5a'); c.fillStyle = cg;
      c.beginPath(); c.moveTo(-14, -9); c.lineTo(12, -9); c.quadraticCurveTo(18, -9, 17, -2); c.lineTo(15, 3); c.lineTo(-14, 3); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-12, -7, 24, 1.6); c.fillStyle = '#222'; [-9, 9].forEach(wx => { c.beginPath(); c.arc(wx, 4, 2.6, 0, TAU); c.fill(); });
      if (C.k === 0) { c.fillStyle = '#ffd166'; c.beginPath(); c.arc(16, -4, 1.8, 0, TAU); c.fill(); }
      c.restore();
    };
    rail(false); cars.filter(C => !C.fr).sort((a, b) => a.p[2] - b.p[2]).forEach(car);
    // المحطة
    { const p = spos(0.25), sx = p[0], sy = p[2]; c.fillStyle = '#c8b8e8'; rr(c, sx - 52, sy - 2, 104, 12, 4); c.fill(); c.fillStyle = '#8f5cff'; c.fillRect(sx - 50, sy - 34, 4, 32); c.fillRect(sx + 46, sy - 34, 4, 32); c.fillStyle = '#ff4d8a'; c.beginPath(); c.moveTo(sx - 58, sy - 34); c.lineTo(sx, sy - 48); c.lineTo(sx + 58, sy - 34); c.closePath(); c.fill(); for (let k = 0; k < 9; k++) bulb(c, sx - 52 + k * 13, sy - 34, 1.6, '#fff6a0', Math.sin(k + t * 6) > 0); }
    rail(true); cars.filter(C => C.fr).sort((a, b) => a.p[2] - b.p[2]).forEach(car);
    sign(c, '🎢 الأفعوانية', CST.x, CST.y + CST.ry + 28, '#5ad1ff', nd); c.restore();
  }

  /* ---------- مواقع المقاعد + الكاميرا تمشي ويه الراكب + أصوات الركوب ---------- */
  function seatOf(r) {
    if (r.k === 'fer') { const p = rmFerPos(r.i); return [p[0], p[1] + 30]; }
    if (r.k === 'car') { const p = rmCarPos(r.i); return [p[0], p[1] - 20]; }
    if (r.k === 'pir') { const s = pirSeat(r.i); return [s[0], s[1]]; }
    if (r.k === 'cst') { const s = cstSeat(r.i); return [s[0], s[1]]; }
    return null;
  }
  function rideSounds(r) {
    const t = now(); if (t < R4.nt) return;
    if (r.k === 'car') { const mel = [784, 988, 1175, 988, 784, 659, 784, 988, 880, 740, 880, 1047], i = Math.floor(t * 3) % mel.length; snd([['triangle', mel[i], mel[i], 0.22, 0.03], ['sine', mel[i] / 2, mel[i] / 2, 0.25, 0.015]]); R4.nt = t + 0.33; return; }
    if (r.k === 'fer') { const n = [1047, 1319, 1568, 1319][Math.floor(t / 1.6) % 4]; snd([['sine', n, n, 0.8, 0.018]]); R4.nt = t + 1.6; return; }
    if (r.k === 'pir') { const S = pirAng(); if (S.A > 0.4 && Math.abs(S.a) > 0.8 && t - R4.lastPh > 1.6) { R4.lastPh = t; snd([['sawtooth', 300, 120, 0.5, 0.015], ['sine', 900, 1500, 0.4, 0.02, 0.05]]); } R4.nt = t + 0.1; return; }
    if (r.k === 'cst') { const u = carU(r.i >> 1); if (u > 0.3 && u < 0.46) { snd([['square', 180, 180, 0.03, 0.012]]); R4.nt = t + 0.18; return; } const e1 = elev(u), e2 = elev(u + 0.01); if (e2 < e1 - 2.5 && t - R4.lastPh > 1.2) { R4.lastPh = t; snd([['sawtooth', 420, 110, 0.7, 0.016], ['sine', 1200, 600, 0.6, 0.02]]); } R4.nt = t + 0.1; }
  }
  const updOld = rmUpdMe; rmUpdMe = function () {
    const m = RM.me, r = rmRideOf(m), key = r ? r.k + r.i : '';
    if (key !== R4.prev) { if (R4.prev && !r && R4.from) { m.x = m.tx = R4.from.x; m.y = m.ty = R4.from.y; RM.camSnap = 1; snd([['sine', 784, 523, 0.25, 0.04]]); } if (r && !R4.prev && !R4.from) R4.from = { x: m.x, y: m.y }; if (!r) R4.from = null; R4.prev = key; }
    if (r && RIDES[r.k]) { const s = seatOf(r); if (s) { m.x = m.tx = s[0]; m.y = m.ty = s[1]; rideSounds(r); return { mv: false, air: 0, jp: 0 }; } }
    return updOld();
  };
  const walkOld = rmWalkTo; rmWalkTo = function (x, y) { const r = rmRideOf(RM.me); if (r && RIDES[r.k]) { showToast('🚪 انزل من اللعبة أول'); return; } return walkOld(x, y); };

  /* ---------- الدخول: قرب السفينة والأفعوانية يطلع زر الركوب ---------- */
  const nearPir = () => !rmInShop() && Math.hypot(RM.me.x - PIR.x, (RM.me.y - PIR.y) * 1.4) < 120;
  const nearCst = () => { if (rmInShop()) return false; const p = spos(0.25); return Math.hypot(RM.me.x - p[0], (RM.me.y - p[2]) * 1.4) < 100; };
  const keyOld = rmXKey; rmXKey = function () { let k = keyOld(); return k + '|r4' + (nearPir() ? 'p' : '') + (nearCst() ? 'c' : ''); };
  const promptOld = rmXPrompt; rmXPrompt = function (mk) {
    if (!rmRideOf(RM.me) && rmShopId() === 0) { if (nearPir()) mk('🏴‍☠️ اركب سفينة القرصان', () => board('pir')); if (nearCst()) mk('🎢 اركب الأفعوانية', () => board('cst')); }
    return promptOld(mk);
  };
  const hitOld = rmXHit; rmXHit = function (x, y) {
    if (rmShopId() === 0 && !rmRideOf(RM.me)) {
      if (Math.abs(x - PIR.x) < 95 && y > PIR.py - 20 && y < PIR.y + 10) { rmWalkTo(PIR.x, PIR.y + 30); rmTapMark(PIR.x, PIR.y + 30); if (!nearPir()) showToast('🚶 روح للعبة ودوس زر «اركب»'); return true; }
      const p = spos(0.25); if (Math.abs(x - p[0]) < 60 && y > p[2] - 50 && y < p[2] + 14) { rmWalkTo(p[0], p[2] + 26); rmTapMark(p[0], p[2] + 26); if (!nearCst()) showToast('🚶 روح للعبة ودوس زر «اركب»'); return true; }
    }
    return hitOld(x, y);
  };

  /* ---------- أضوية الليل ---------- */
  const holesOld = rmXHoles; rmXHoles = function (hole, fl) { try { holesOld(hole, fl); } catch (e) {} hole(RM_FER.x, RM_FER.cy, 150, 0.85); hole(RM_CAR.x, RM_CAR.y - 50, 120, 0.85); hole(RM_POOL.x + RM_POOL.w / 2, RM_POOL.y + RM_POOL.h / 2, 200, 0.7); hole(PIR.x, PIR.py + 40, 140, 0.85); hole(CST.x, CST.y - 30, 210, 0.8); };
  const glowOld = rmXGlow; rmXGlow = function (c, d, fl) { try { glowOld(c, d, fl); } catch (e) {} rmGlow(c, RM_FER.x, RM_FER.cy, 120, 0.2 * d, '255,120,200'); rmGlow(c, RM_CAR.x, RM_CAR.y - 70, 90, 0.22 * d, '255,210,120'); rmGlow(c, RM_POOL.x + RM_POOL.w / 2, RM_POOL.y + RM_POOL.h / 2, 170, 0.16 * d, '120,220,255'); rmGlow(c, PIR.x, PIR.py + 70, 100, 0.18 * d, '255,170,90'); rmGlow(c, CST.x, CST.y - 40, 170, 0.15 * d, '140,200,255'); };

  /* ---------- زر خروج واضح فوك يسار جنب دولار المنتجع ---------- */
  (function () {
    const st = document.createElement('style'); st.textContent = '#rmExitTop{position:absolute;top:44px;left:8px;z-index:9;display:flex;align-items:center;gap:4px;padding:6px 12px;border-radius:16px;border:2px solid #fff;background:linear-gradient(135deg,#ff3b5c,#c81e3a);color:#fff;font:900 13px Cairo,system-ui;box-shadow:0 3px 12px rgba(0,0,0,.4),0 0 12px rgba(255,59,92,.5);cursor:pointer;direction:rtl}#rmExitTop:active{transform:scale(.95)}#rmBox #rmUsd{left:94px !important}';
    document.head.appendChild(st);
    setInterval(() => { const B = document.getElementById('rmBox'); if (!B || document.getElementById('rmExitTop')) return; const b = document.createElement('button'); b.id = 'rmExitTop'; b.type = 'button'; b.innerHTML = '🚪 خروج';
      b.onclick = e => { e.stopPropagation(); const x = document.getElementById('rmExit'); if (x) x.click(); }; b.addEventListener('pointerdown', e => e.stopPropagation()); B.appendChild(b); }, 1000);
  })();
  /* ---------- نضيفها للمنتجع ---------- */
  RM_DECOR.push({ y: PIR.y, f: pirDraw });
  RM_DECOR.push({ y: CST.y + CST.ry, f: cstDraw });
  RM_DECOR.push({ y: 99999, f: dropsDraw });
  window.R4_PIR = PIR; window.R4_CST = CST;
})();
