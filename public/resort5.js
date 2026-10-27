/* بابيتو شات — مدينة ألعاب الجهة اليسرى: برج الرعب، سيارات التصادم، الأخطبوط، الكراسي الطائرة،
   ومعاها عربيات فشار وشعر بنات، كراسي، أضوية معلقة، ومدخل كبير. كل لعبة تتحرك حسب الوقت فتنشاف نفس الشي عند الكل. */
(function () {
  'use strict';
  if (typeof RM === 'undefined' || typeof rmRideOf !== 'function') return;
  const TAU = Math.PI * 2, now = () => Date.now() / 1000, nightD = () => (RM.dn && RM.dn.d) || 0;
  const DROP = { x: -120, y: 640, H: 280, n: 8, code: 40 }, BUMP = { x: -1140, y: 1015, w: 380, h: 200, n: 6, code: 70 }, OCT = { x: -740, y: 1015, R: 92, n: 8, code: 80 }, SWG = { x: -250, y: 1075, n: 12, code: 90 };
  const R5 = window.R5 = { from: null, prev: '', nt: 0, last: 0 };
  const snd = list => { try { if (RM.ambMute) return; list.forEach(q => blip(q[0], q[1], q[2], q[3], q[4], q[5] || 0)); } catch (e) {} };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
  const ell = (c, x, y, a, b) => { c.beginPath(); c.ellipse(x, y, Math.max(.1, a), Math.max(.1, b), 0, 0, TAU); };
  const hexL = (h, k) => { const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  const bulb = (c, x, y, r, col, on) => { c.fillStyle = on ? col : 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); if (on) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .35, 0, TAU); c.fill(); } };
  const sign = (c, txt, x, y, col, nd) => { c.save(); c.font = 'bold 13px Cairo, system-ui'; const w = c.measureText(txt).width + 26; c.fillStyle = 'rgba(30,14,48,.88)'; rr(c, x - w / 2, y - 13, w, 24, 12); c.fill(); c.lineWidth = 2; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 6 + nd * 10; rr(c, x - w / 2, y - 13, w, 24, 12); c.stroke(); c.shadowBlur = 0; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(txt, x, y); c.restore(); };
  const COLS = ['#ff4d6d', '#ffd23f', '#3ddc84', '#3da5ff', '#b36bff', '#ff9f1c', '#ff7ab8', '#20c9b8', '#ffffff', '#7a5cff', '#ff6a3a', '#9ad84a'];
  function rider(c, R, x, y, s, tagY) { c.save(); c.translate(x, y); c.scale((R.o.dir || 1) * s, s); AVT.drawAt(c, R.o.av || AVT.DEF, 0, 0, AV_H, { t: RM.T, sit: 1, dance: 1, dt: RM.T }); c.restore(); c.save(); c.translate(x, tagY); c.scale(.74, .74); rmTag(c, R.nm, 0, -13, { me: R.me, adm: R.o.adm || (R.me ? RM.myAdm : 0) }); c.restore(); }

  /* ---------- الأكواد ---------- */
  const KINDS = { drop: DROP, bump: BUMP, oct: OCT, swg: SWG }, NAMES = { drop: '🗼 برج الرعب', bump: '🚗 سيارات التصادم', oct: '🐙 الأخطبوط', swg: '🎠 الكراسي الطائرة' };
  const rideOld = rmRideOf; rmRideOf = function (o) { const e = o && o.dance || 0; for (const k in KINDS) { const K = KINDS[k]; if (e >= K.code && e < K.code + K.n) return { k, i: e - K.code }; } return rideOld(o); };
  function board(kind) {
    const m = RM.me, K = KINDS[kind]; if (m.sit) { rmStand(); return; } if (m.jump) return;
    const used = new Set(rmRiders(kind).filter(R => !R.me).map(R => R.i)); let pick = -1; for (let i = 0; i < K.n; i++) if (!used.has(i)) { pick = i; break; }
    if (pick < 0) { showToast('⛔ كل المقاعد مليانة، انتظر شوي'); return; }
    if (!rmRideOf(m)) R5.from = { x: m.x, y: m.y }; m.tx = m.x; m.ty = m.y; rmSetDance(K.code + pick); RM.sent = '';
    snd([['sine', 587, 587, .15, .05], ['sine', 740, 740, .15, .05, .1], ['triangle', 880, 880, .3, .05, .2]]);
    showToast({ drop: '🗼 ركبت برج الرعب! راح يصعدك لفوك ويطبّك 😱', bump: '🚗 ركبت سيارات التصادم! اصدم الكل 💥', oct: '🐙 ركبت الأخطبوط! راح تدوخ 🌀', swg: '🎠 ركبت الكراسي الطائرة! طير بالهوا 🕊️' }[kind]); rmPrompt(true);
  }

  /* ================= 1) برج الرعب ================= */
  function dropH() {   // دورة 18 ثانية: انتظار، صعود بطيء، وكفة فوك ترجف، طبة سريعة، فرامل
    const ph = now() % 18; let h, sh = 0, st;
    if (ph < 4) { h = 0; st = 'wait'; } else if (ph < 10) { const u = (ph - 4) / 6; h = u * u * (3 - 2 * u); st = 'up'; } else if (ph < 12.2) { h = 1; sh = Math.sin(ph * 60) * .004; st = 'top'; } else if (ph < 13) { const u = (ph - 12.2) / .8; h = 1 - u * u; st = 'fall'; } else if (ph < 14.4) { const u = (ph - 13) / 1.4; h = Math.max(0, Math.sin(u * Math.PI) * .12 * (1 - u)); st = 'brake'; } else { h = 0; st = 'wait'; }
    return { h: h + sh, st };
  }
  function dropSeat(i) { const D = dropH(), a = i / DROP.n * TAU + .2, y = DROP.y - 40 - D.h * (DROP.H - 70); return [DROP.x + Math.cos(a) * 30, y + Math.sin(a) * 9, Math.sin(a)]; }
  function dropDraw(c) {
    const X = DROP.x, Y = DROP.y, top = Y - DROP.H, t = now(), nd = nightD(), D = dropH(); c.save();
    c.fillStyle = 'rgba(0,0,0,.22)'; ell(c, X, Y + 4, 70, 14); c.fill();
    const bg = c.createLinearGradient(0, Y - 18, 0, Y + 6); bg.addColorStop(0, '#e8e2f4'); bg.addColorStop(1, '#9a8cc0'); c.fillStyle = bg; ell(c, X, Y - 4, 62, 16); c.fill(); c.fillStyle = '#7a6aa8'; c.fillRect(X - 62, Y - 6, 124, 8); ell(c, X, Y + 2, 62, 14); c.fill();
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; if (Math.sin(a) < 0) continue; bulb(c, X + Math.cos(a) * 60, Y + Math.sin(a) * 14, 1.8, k % 2 ? '#ffd23f' : '#ff4d6d', Math.sin(k - t * 6) > 0); }
    const riders = rmRiders('drop'), seats = []; for (let i = 0; i < DROP.n; i++) seats.push([dropSeat(i), i]);
    const seat = ([p, i]) => { const col = COLS[i]; riders.filter(R => R.i === i).forEach(R => rider(c, R, p[0], p[1] + 22, .5, p[1] - 22)); c.fillStyle = col; rr(c, p[0] - 9, p[1] - 6, 18, 20, 5); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(p[0] - 6, p[1] - 3, 12, 2); c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.beginPath(); c.moveTo(p[0] - 9, p[1] - 2); c.quadraticCurveTo(p[0], p[1] + 6, p[0] + 9, p[1] - 2); c.stroke(); };
    seats.filter(s => s[0][2] < 0).forEach(seat);
    // العمود: هيكل حديد بشبكة وخطوط نيون
    const cg = c.createLinearGradient(X - 16, 0, X + 16, 0); cg.addColorStop(0, '#3a2a6a'); cg.addColorStop(.5, '#8a7ad8'); cg.addColorStop(1, '#2a1a5a'); c.fillStyle = cg; c.fillRect(X - 14, top + 30, 28, DROP.H - 36);
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; c.beginPath(); for (let y = top + 34; y < Y - 8; y += 16) { c.moveTo(X - 14, y); c.lineTo(X + 14, y + 16); c.moveTo(X + 14, y); c.lineTo(X - 14, y + 16); } c.stroke();
    for (let y = top + 40; y < Y - 10; y += 22) { const on = Math.sin(y / 20 - t * 8) > 0 || D.st === 'fall'; c.fillStyle = on ? (D.st === 'top' || D.st === 'fall' ? '#ff3a3a' : '#5ad1ff') : 'rgba(255,255,255,.15)'; c.fillRect(X - 2, y, 4, 12); }
    // التاج فوك
    c.fillStyle = '#ff4d8a'; c.beginPath(); c.moveTo(X - 34, top + 32); c.lineTo(X - 24, top + 8); c.lineTo(X + 24, top + 8); c.lineTo(X + 34, top + 32); c.closePath(); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(X - 26, top + 2, 52, 8);
    for (let k = 0; k < 7; k++) bulb(c, X - 30 + k * 10, top + 30, 2, ['#fff6a0', '#ff7ab8'][k % 2], Math.sin(k + t * 7) > 0);
    const bc = Math.sin(t * 4); c.fillStyle = 'rgba(255,60,60,' + (.5 + .5 * bc) + ')'; c.beginPath(); c.arc(X, top - 4, 6, 0, TAU); c.fill(); c.strokeStyle = '#7a2a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(X, top + 2); c.lineTo(X, top - 2); c.stroke();
    // حلقة الكراسي
    const ry = DROP.y - 40 - D.h * (DROP.H - 70); c.strokeStyle = '#c0c8d8'; c.lineWidth = 5; ell(c, X, ry + 4, 34, 10); c.stroke(); c.fillStyle = '#2a1a5a'; c.fillRect(X - 16, ry - 4, 32, 14);
    seats.filter(s => s[0][2] >= 0).forEach(seat);
    if (D.st === 'fall' && riders.length && RM.T % 2 === 0) RM.sparks.push({ x: X + (Math.random() - .5) * 60, y: ry - 20, vx: 0, vy: -3, t: 18, dust: 1 });
    sign(c, '🗼 برج الرعب', X, Y + 26, '#b36bff', nd); c.restore();
  }

  /* ================= 2) سيارات التصادم ================= */
  function bumpPos(i) {   // كل سيارة تمشي بمسار مختلف، وتلف حسب اتجاهها
    const t = now() * .55 + i * 1.9, B = BUMP, ax = B.w / 2 - 34, ay = B.h / 2 - 26;
    const f = u => [B.x + Math.sin(u * (1 + i * .13) + i) * ax * (.75 + .25 * Math.sin(u * .3 + i)), B.y + Math.sin(u * (1.37 + i * .07) + i * 2.1) * ay];
    const p = f(t), q = f(t + .03); return [p[0], p[1], Math.atan2(q[1] - p[1], q[0] - p[0])];
  }
  function bumpDraw(c) {
    const B = BUMP, t = now(), nd = nightD(), x0 = B.x - B.w / 2, y0 = B.y - B.h / 2; c.save();
    c.fillStyle = 'rgba(0,0,0,.2)'; rr(c, x0 - 10, y0 - 4, B.w + 20, B.h + 22, 18); c.fill();
    c.fillStyle = '#2a2e3a'; rr(c, x0 - 8, y0 - 8, B.w + 16, B.h + 16, 16); c.fill();
    const fg = c.createLinearGradient(x0, y0, x0 + B.w, y0 + B.h); fg.addColorStop(0, '#5a6272'); fg.addColorStop(1, '#3a404e'); c.fillStyle = fg; rr(c, x0, y0, B.w, B.h, 12); c.fill();
    c.save(); rr(c, x0, y0, B.w, B.h, 12); c.clip(); c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1; for (let x = x0; x < x0 + B.w; x += 20) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 + B.h); c.stroke(); } for (let y = y0; y < y0 + B.h; y += 20) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + B.w, y); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + B.w * .4, y0); c.lineTo(x0 + B.w * .2, y0 + B.h); c.lineTo(x0, y0 + B.h); c.fill(); c.restore();
    c.strokeStyle = '#ffd23f'; c.lineWidth = 6; rr(c, x0 - 3, y0 - 3, B.w + 6, B.h + 6, 14); c.stroke(); c.strokeStyle = '#1a1a1a'; c.setLineDash([14, 14]); c.lineWidth = 6; rr(c, x0 - 3, y0 - 3, B.w + 6, B.h + 6, 14); c.stroke(); c.setLineDash([]);
    // السقف الشبكي (أعمدة وكهرباء)
    [[x0 - 6, y0 - 6], [x0 + B.w + 6, y0 - 6], [x0 - 6, y0 + B.h + 6], [x0 + B.w + 6, y0 + B.h + 6]].forEach(([px, py]) => { c.fillStyle = '#9aa2b0'; c.fillRect(px - 3, py - 60, 6, 60); bulb(c, px, py - 62, 4, '#ff7ab8', Math.sin(px + t * 5) > 0); });
    c.strokeStyle = 'rgba(200,210,230,.35)'; c.lineWidth = 1; c.beginPath(); for (let k = 0; k <= 8; k++) { const xx = x0 - 6 + (B.w + 12) * k / 8; c.moveTo(xx, y0 - 66); c.lineTo(xx, y0 - 60); } c.moveTo(x0 - 6, y0 - 62); c.lineTo(x0 + B.w + 6, y0 - 62); c.stroke();
    const riders = rmRiders('bump'), cars = []; for (let i = 0; i < B.n; i++) cars.push([bumpPos(i), i]); cars.sort((a, b) => a[0][1] - b[0][1]);
    cars.forEach(([p, i]) => { const col = COLS[i], a = p[2]; c.save(); c.translate(p[0], p[1]);
      c.fillStyle = 'rgba(0,0,0,.28)'; ell(c, 2, 10, 26, 9); c.fill();
      c.save(); c.rotate(Math.cos(a) * .06); const fl = Math.cos(a) < 0 ? -1 : 1; c.scale(fl, 1);
      c.fillStyle = '#1a1a1a'; rr(c, -26, -6, 52, 18, 9); c.fill();   // مصد مطاط
      const cg = c.createLinearGradient(0, -14, 0, 8); cg.addColorStop(0, hexL(col, .35)); cg.addColorStop(1, hexL(col, -.25)); c.fillStyle = cg; rr(c, -22, -14, 44, 22, 10); c.fill();
      c.fillStyle = 'rgba(255,255,255,.45)'; rr(c, -16, -12, 26, 4, 2); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(18, -4, 2.5, 0, TAU); c.fill();
      c.fillStyle = '#222'; rr(c, -14, -18, 16, 8, 3); c.fill();   // المقعد
      c.restore();
      riders.filter(R => R.i === i).forEach(R => rider(c, R, -2, -4, .44, -42));
      c.strokeStyle = '#9aa2b0'; c.lineWidth = 2; c.beginPath(); c.moveTo(-12, -14); c.lineTo(-12, -54); c.stroke();   // عمود الكهرباء
      if (Math.random() < .12) { c.strokeStyle = '#bfe8ff'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-12, -54); c.lineTo(-12 + (Math.random() - .5) * 10, -60); c.lineTo(-12 + (Math.random() - .5) * 8, -64); c.stroke(); }
      c.restore(); });
    for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) { const a = cars[i][0], b = cars[j][0]; if (Math.hypot(a[0] - b[0], (a[1] - b[1]) * 1.6) < 46 && Math.random() < .25) { RM.sparks.push({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 - 6, vx: (Math.random() - .5) * 3, vy: -2, t: 12, dust: 1 }); if ((rmRideOf(RM.me) || {}).k === 'bump' && now() - R5.last > .6) { R5.last = now(); snd([['square', 160, 70, .12, .05], ['triangle', 300, 120, .1, .04]]); } } }
    sign(c, '🚗 سيارات التصادم', B.x, y0 + B.h + 30, '#ffd23f', nd); c.restore();
  }

  /* ================= 3) الأخطبوط ================= */
  const octA = () => (now() % 10000) * .38;
  function octSeat(i) { const arm = i >> 1, a = octA() + arm / 4 * TAU, up = Math.sin(now() * 1.3 + arm * 1.6) * 26, sub = octA() * 1.8 * (arm % 2 ? 1 : -1) + (i & 1) * Math.PI, ax = OCT.x + Math.cos(a) * OCT.R, ay = OCT.y + Math.sin(a) * OCT.R * .36 - 30 - up; return [ax + Math.cos(sub) * 20, ay + Math.sin(sub) * 7, Math.sin(a), ax, ay]; }
  function octDraw(c) {
    const O = OCT, t = now(), nd = nightD(); c.save(); c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, O.x, O.y + 8, O.R + 40, (O.R + 40) * .34); c.fill();
    c.fillStyle = '#2a6a8a'; ell(c, O.x, O.y + 4, O.R + 30, (O.R + 30) * .34); c.fill(); const fg = c.createLinearGradient(0, O.y - 30, 0, O.y + 30); fg.addColorStop(0, '#7ad8ff'); fg.addColorStop(1, '#2a9ad8'); c.fillStyle = fg; ell(c, O.x, O.y - 2, O.R + 26, (O.R + 26) * .32); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.4; for (let k = 0; k < 3; k++) { c.beginPath(); for (let a = 0; a <= TAU + .01; a += .2) { const r = 40 + k * 22 + Math.sin(a * 5 + t * 2) * 3; c.lineTo(O.x + Math.cos(a) * r, O.y - 2 + Math.sin(a) * r * .32); } c.stroke(); }
    const riders = rmRiders('oct'), items = []; for (let i = 0; i < O.n; i++) items.push([octSeat(i), i]);
    const armDraw = arm => { const a = octA() + arm / 4 * TAU, up = Math.sin(t * 1.3 + arm * 1.6) * 26, ax = O.x + Math.cos(a) * O.R, ay = O.y + Math.sin(a) * O.R * .36 - 30 - up; c.strokeStyle = '#9a3ad8'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(O.x, O.y - 48); c.quadraticCurveTo((O.x + ax) / 2, Math.min(ay, O.y - 48) - 20, ax, ay); c.stroke(); c.strokeStyle = '#d88aff'; c.lineWidth = 3; c.stroke(); for (let k = 1; k < 5; k++) { const u = k / 5, px = O.x + (ax - O.x) * u, py = O.y - 48 + (ay - O.y + 48) * u - Math.sin(u * Math.PI) * 18; c.fillStyle = '#ffd0ff'; c.beginPath(); c.arc(px, py + 4, 2.2, 0, TAU); c.fill(); } };
    const cup = ([p, i]) => { const col = COLS[i + 2]; riders.filter(R => R.i === i).forEach(R => rider(c, R, p[0], p[1] + 14, .44, p[1] - 26)); c.fillStyle = col; c.beginPath(); c.moveTo(p[0] - 15, p[1] - 4); c.quadraticCurveTo(p[0] - 14, p[1] + 14, p[0], p[1] + 15); c.quadraticCurveTo(p[0] + 14, p[1] + 14, p[0] + 15, p[1] - 4); c.closePath(); c.fill(); c.fillStyle = hexL(col, .4); ell(c, p[0], p[1] - 4, 15, 4.5); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(p[0] - 9, p[1] + 2, 3, 8); };
    const back = items.filter(it => it[0][2] < 0), front = items.filter(it => it[0][2] >= 0);
    [0, 1, 2, 3].filter(k => Math.sin(octA() + k / 4 * TAU) < 0).forEach(armDraw); back.forEach(cup);
    // راس الأخطبوط
    const hy = O.y - 62 + Math.sin(t * 2) * 2, hg = c.createRadialGradient(O.x - 8, hy - 10, 4, O.x, hy, 36); hg.addColorStop(0, '#f0b0ff'); hg.addColorStop(1, '#8a2ad8'); c.fillStyle = hg; c.beginPath(); c.ellipse(O.x, hy, 30, 34, 0, 0, TAU); c.fill();
    [-1, 1].forEach(s => { c.fillStyle = '#fff'; ell(c, O.x + s * 11, hy + 2, 8, 9); c.fill(); c.fillStyle = '#2a1040'; ell(c, O.x + s * 11 + Math.sin(t) * 2, hy + 4, 4, 5); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(O.x + s * 11 - 1, hy, 1.6, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,90,150,.5)'; ell(c, O.x + s * 20, hy + 14, 4, 2.4); c.fill(); });
    c.strokeStyle = '#4a1070'; c.lineWidth = 2; c.beginPath(); c.arc(O.x, hy + 13, 7, .2, Math.PI - .2); c.stroke();
    for (let k = 0; k < 8; k++) bulb(c, O.x - 26 + k * 7.4, hy - 26 + Math.abs(k - 3.5) * 2, 1.6, COLS[k], Math.sin(k + t * 6) > 0);
    [0, 1, 2, 3].filter(k => Math.sin(octA() + k / 4 * TAU) >= 0).forEach(armDraw); front.forEach(cup);
    sign(c, '🐙 الأخطبوط', O.x, O.y + 44, '#7ad8ff', nd); c.restore();
  }

  /* ================= 4) الكراسي الطائرة ================= */
  function swgState() {   // الزاوية = مجموع السرعة على الوقت (مو الوقت × السرعة) حتى ما تفتر فجأة وتسرع بشكل مجنون
    const W = .55, t = now(), cyc = Math.floor(t / 24), ph = t - cyc * 24; let sp, I;
    if (ph < 3) { sp = 0; I = 0; } else if (ph < 8) { const u = ph - 3; sp = u / 5; I = u * u / 10; } else if (ph < 19) { sp = 1; I = 2.5 + (ph - 8); } else { const u = ph - 19; sp = Math.max(0, 1 - u / 5); I = 13.5 + u - u * u / 10; }
    return { sp, a: ((cyc * 16 * W) % TAU) + I * W }; }
  function swgSeat(i) { const S = swgState(), a = S.a + i / SWG.n * TAU, tilt = .15 + S.sp * .85, L = 64, r0 = 46, r = r0 + Math.sin(tilt * .9) * L, topY = SWG.y - 150, y = topY + 28 + Math.cos(tilt * .9) * L; return [SWG.x + Math.cos(a) * r, y + Math.sin(a) * r * .3, Math.sin(a), SWG.x + Math.cos(a) * r0, topY + 28 + Math.sin(a) * r0 * .3]; }
  function swgDraw(c) {
    const X = SWG.x, Y = SWG.y, t = now(), nd = nightD(), S = swgState(), topY = Y - 150; c.save();
    c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, X, Y + 4, 140, 30); c.fill(); c.fillStyle = '#e8d2a8'; ell(c, X, Y, 120, 26); c.fill(); c.strokeStyle = '#b08a5a'; c.lineWidth = 3; c.stroke();
    const riders = rmRiders('swg'), items = []; for (let i = 0; i < SWG.n; i++) items.push([swgSeat(i), i]); items.sort((a, b) => a[0][1] - b[0][1]);
    const chair = ([p, i]) => { c.strokeStyle = 'rgba(80,80,90,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(p[3] - 3, p[4]); c.lineTo(p[0] - 6, p[1] - 8); c.moveTo(p[3] + 3, p[4]); c.lineTo(p[0] + 6, p[1] - 8); c.stroke();
      riders.filter(R => R.i === i).forEach(R => rider(c, R, p[0], p[1] + 12, .42, p[1] - 28)); const col = COLS[i]; c.fillStyle = col; rr(c, p[0] - 8, p[1] - 8, 16, 14, 4); c.fill(); c.fillStyle = hexL(col, -.3); c.fillRect(p[0] - 8, p[1] + 4, 16, 3); };
    items.filter(it => it[0][2] < 0).forEach(chair);
    const cg = c.createLinearGradient(X - 12, 0, X + 12, 0); cg.addColorStop(0, '#b07a10'); cg.addColorStop(.5, '#ffe9a0'); cg.addColorStop(1, '#b07a10'); c.fillStyle = cg; c.fillRect(X - 10, topY + 20, 20, 130);
    for (let k = 0; k < 5; k++) bulb(c, X, topY + 34 + k * 22, 2, '#ff7ab8', Math.sin(k * 1.4 - t * 5) > 0);
    // المظلة الدوارة
    const ra = S.a; for (let k = 0; k < 12; k++) { const a1 = ra + k / 12 * TAU, a2 = a1 + TAU / 12; if (Math.sin((a1 + a2) / 2) < -.3) continue; c.fillStyle = k % 2 ? '#ffffff' : '#3da5ff'; c.beginPath(); c.moveTo(X, topY - 18); c.lineTo(X + Math.cos(a1) * 60, topY + 26 + Math.sin(a1) * 18); c.lineTo(X + Math.cos(a2) * 60, topY + 26 + Math.sin(a2) * 18); c.closePath(); c.fill(); }
    for (let k = 0; k < 20; k++) { const a = k / 20 * TAU; if (Math.sin(a) < -.2) continue; bulb(c, X + Math.cos(a) * 60, topY + 28 + Math.sin(a) * 18, 1.8, '#fff6a0', Math.sin(k + t * 6) > 0); }
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(X, topY - 20, 5, 0, TAU); c.fill(); c.strokeStyle = '#7a5200'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X, topY - 24); c.lineTo(X, topY - 40); c.stroke(); c.fillStyle = '#ff4d6d'; c.beginPath(); c.moveTo(X, topY - 40); c.quadraticCurveTo(X + 8, topY - 40 + Math.sin(t * 6) * 2, X + 15, topY - 36); c.lineTo(X, topY - 32); c.fill();
    items.filter(it => it[0][2] >= 0).forEach(chair);
    sign(c, '🎠 الكراسي الطائرة', X, Y + 40, '#3da5ff', nd); c.restore();
  }

  /* ================= ديكور: مدخل، عربيات أكل، كراسي، أضوية معلقة ================= */
  function cart(c, x, y, kind) { const nd = nightD(), t = now(); c.save(); c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, x, y + 2, 34, 7); c.fill();
    const col = kind === 'pop' ? '#e8364f' : '#ff7ab8'; c.fillStyle = '#2a2a2a'; [-16, 16].forEach(dx => { c.beginPath(); c.arc(x + dx, y - 4, 6, 0, TAU); c.fill(); c.fillStyle = '#888'; c.beginPath(); c.arc(x + dx, y - 4, 2, 0, TAU); c.fill(); c.fillStyle = '#2a2a2a'; });
    c.fillStyle = col; rr(c, x - 26, y - 34, 52, 28, 5); c.fill(); for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#fff' : col; c.fillRect(x - 26 + k * 10.4, y - 34, 10.4, 6); }
    c.fillStyle = 'rgba(200,240,255,.55)'; rr(c, x - 20, y - 62, 40, 28, 4); c.fill(); c.strokeStyle = '#d8d8d8'; c.lineWidth = 1.4; c.stroke();
    if (kind === 'pop') { c.fillStyle = '#fff6d0'; for (let k = 0; k < 16; k++) { c.beginPath(); c.arc(x - 15 + (k * 7) % 30, y - 40 - (k % 4) * 4, 2.6, 0, TAU); c.fill(); } if (Math.random() < .05) RM.sparks.push({ x: x + (Math.random() - .5) * 20, y: y - 58, vx: (Math.random() - .5), vy: -1.2, t: 14, dust: 1 }); }
    else { [['#ff9ad5', -10], ['#9ad8ff', 2], ['#d8a8ff', 13]].forEach(([cc, dx]) => { c.fillStyle = cc; c.beginPath(); c.arc(x + dx, y - 50, 7, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + dx, y - 43); c.lineTo(x + dx, y - 36); c.stroke(); }); }
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 30, y - 62); c.quadraticCurveTo(x, y - 82, x + 30, y - 62); c.fill(); c.fillStyle = col; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(x - 25 + k * 10, y - 62, 5, 0, Math.PI); c.fill(); }
    c.font = 'bold 10px Cairo, system-ui'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(kind === 'pop' ? '🍿 فشار' : '🍭 شعر بنات', x, y - 16); c.restore(); }
  function bench(c, x, y) { c.save(); c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, x, y + 2, 26, 5); c.fill(); c.fillStyle = '#3a3a3a'; c.fillRect(x - 20, y - 12, 3, 12); c.fillRect(x + 17, y - 12, 3, 12); c.fillStyle = '#a0603a'; for (let k = 0; k < 3; k++) c.fillRect(x - 24, y - 14 - k * 5, 48, 3.4); c.restore(); }
  function stringLights(c, x0, y0, x1, y1) { const t = now(); c.save(); c.strokeStyle = 'rgba(40,40,40,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 26, x1, y1); c.stroke(); for (let k = 1; k < 14; k++) { const u = k / 14, x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * (x0 + x1) / 2 + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (Math.max(y0, y1) + 26) + u * u * y1; bulb(c, x, y + 3, 2.4, COLS[k % 8], Math.sin(k * 1.7 + t * 3) > -.4); } c.restore(); }
  function pole(c, x, y, h) { c.save(); c.fillStyle = '#4a4a52'; c.fillRect(x - 2, y - h, 4, h); c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, x, y, 8, 3); c.fill(); bulb(c, x, y - h - 3, 4, '#ffe0a0', true); c.restore(); }
  function gate(c) { const x = -494, y = 1185, nd = nightD(), t = now(); c.save(); [[-100], [100]].forEach(([dx]) => { const g = c.createLinearGradient(x + dx - 10, 0, x + dx + 10, 0); g.addColorStop(0, '#8a2ad8'); g.addColorStop(.5, '#d88aff'); g.addColorStop(1, '#6a1ab8'); c.fillStyle = g; c.fillRect(x + dx - 9, y - 110, 18, 110); c.fillStyle = '#ffd23f'; c.fillRect(x + dx - 12, y - 116, 24, 8); });
    c.strokeStyle = '#ff4d8a'; c.lineWidth = 12; c.beginPath(); c.moveTo(x - 100, y - 108); c.quadraticCurveTo(x, y - 170, x + 100, y - 108); c.stroke(); c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.stroke();
    for (let k = 0; k <= 16; k++) { const u = k / 16, bx = (1 - u) * (1 - u) * (x - 100) + 2 * u * (1 - u) * x + u * u * (x + 100), by = (1 - u) * (1 - u) * (y - 108) + 2 * u * (1 - u) * (y - 170) + u * u * (y - 108); bulb(c, bx, by, 2.6, COLS[k % 6], Math.sin(k - t * 6) > 0); }
    c.font = 'bold 16px Cairo, system-ui'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(30,10,50,.85)'; c.strokeText('🎡 مدينة ألعاب بابي', x, y - 132); c.fillStyle = '#fff'; c.fillText('🎡 مدينة ألعاب بابي', x, y - 132); c.restore(); }

  function booth(c, x, y) { const t = now(), nd = nightD(); c.save(); c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, x, y + 2, 46, 9); c.fill();
    c.fillStyle = '#f4e4c8'; c.fillRect(x - 38, y - 54, 76, 54); c.fillStyle = '#8a2ad8'; c.fillRect(x - 38, y - 12, 76, 12); c.fillStyle = 'rgba(170,220,255,.7)'; rr(c, x - 26, y - 46, 52, 24, 4); c.fill(); c.fillStyle = '#2a1a3a'; c.beginPath(); c.arc(x, y - 30, 7, 0, TAU); c.fill(); c.fillStyle = '#c48c64'; c.beginPath(); c.arc(x, y - 33, 5, 0, TAU); c.fill();
    for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#fff' : '#ff4d8a'; c.beginPath(); c.moveTo(x - 44 + k * 11, y - 54); c.lineTo(x - 33 + k * 11, y - 54); c.lineTo(x - 38.5 + k * 11, y - 76); c.closePath(); c.fill(); }
    for (let k = 0; k < 8; k++) bulb(c, x - 40 + k * 11.4, y - 55, 1.8, '#fff6a0', Math.sin(k + t * 5) > 0);
    c.font = 'bold 11px Cairo, system-ui'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('🎟️ التذاكر مجاناً', x, y - 3);
    [[-52, '#ff4d6d'], [-60, '#ffd23f'], [52, '#3da5ff'], [60, '#3ddc84']].forEach(([dx, col], i) => { const by = y - 90 - (i % 2) * 14 + Math.sin(t * 1.5 + i) * 3; c.strokeStyle = 'rgba(60,60,60,.6)'; c.lineWidth = .8; c.beginPath(); c.moveTo(x + dx * .7, y - 40); c.lineTo(x + dx, by + 12); c.stroke(); c.fillStyle = col; ell(c, x + dx, by, 9, 11); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; ell(c, x + dx - 3, by - 4, 2.4, 3.4); c.fill(); });
    c.restore(); }
  function flowers(c, x, y) { c.save(); c.fillStyle = '#b06a3a'; c.beginPath(); c.moveTo(x - 12, y - 14); c.lineTo(x + 12, y - 14); c.lineTo(x + 9, y); c.lineTo(x - 9, y); c.closePath(); c.fill(); for (let k = 0; k < 7; k++) { const fx = x - 9 + k * 3, fy = y - 18 - (k % 3) * 4; c.strokeStyle = '#2f7a2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(fx, y - 14); c.lineTo(fx, fy); c.stroke(); c.fillStyle = COLS[k % 6]; c.beginPath(); c.arc(fx, fy, 2.6, 0, TAU); c.fill(); } c.restore(); }
  /* ---------- مواقع المقاعد + الكاميرا ويا الراكب + أصوات ---------- */
  function seatOf(r) { if (r.k === 'drop') { const p = dropSeat(r.i); return [p[0], p[1] + 22]; } if (r.k === 'bump') { const p = bumpPos(r.i); return [p[0], p[1]]; } if (r.k === 'oct') { const p = octSeat(r.i); return [p[0], p[1] + 14]; } if (r.k === 'swg') { const p = swgSeat(r.i); return [p[0], p[1] + 12]; } return null; }
  function rideSounds(r) { const t = now(); if (t < R5.nt) return;
    if (r.k === 'drop') { const D = dropH(); if (D.st === 'up') { snd([['square', 140, 140, .03, .012]]); R5.nt = t + .22; return; } if (D.st === 'fall' && t - R5.last > 1.5) { R5.last = t; snd([['sawtooth', 500, 90, .8, .02], ['sine', 1300, 500, .7, .025]]); } R5.nt = t + .1; return; }
    if (r.k === 'oct') { const n = [659, 784, 988, 784][Math.floor(t * 2) % 4]; snd([['triangle', n, n, .2, .02]]); R5.nt = t + .5; return; }
    if (r.k === 'swg') { const n = [523, 659, 784, 1047, 784, 659][Math.floor(t * 2.5) % 6]; snd([['sine', n, n, .3, .02]]); R5.nt = t + .4; return; }
    R5.nt = t + .5; }
  const updOld = rmUpdMe; rmUpdMe = function () {
    const m = RM.me, r = rmRideOf(m), mine = r && KINDS[r.k], key = mine ? r.k + r.i : '';
    if (key !== R5.prev) { if (R5.prev && !mine && R5.from) { m.x = m.tx = R5.from.x; m.y = m.ty = R5.from.y; RM.camSnap = 1; snd([['sine', 784, 523, .25, .04]]); } if (mine && !R5.prev && !R5.from) R5.from = { x: m.x, y: m.y }; if (!mine) R5.from = null; R5.prev = key; }
    if (mine) { const s = seatOf(r); if (s) { m.x = m.tx = s[0]; m.y = m.ty = s[1]; rideSounds(r); return { mv: false, air: 0, jp: 0 }; } }
    return updOld();
  };
  const walkOld = rmWalkTo; rmWalkTo = function (x, y) { const r = rmRideOf(RM.me); if (r && KINDS[r.k]) { showToast('🚪 انزل من اللعبة أول'); return; } return walkOld(x, y); };
  const near = { drop: () => Math.hypot(RM.me.x - DROP.x, (RM.me.y - DROP.y) * 1.2) < 130, bump: () => Math.abs(RM.me.x - BUMP.x) < BUMP.w / 2 + 40 && Math.abs(RM.me.y - BUMP.y) < BUMP.h / 2 + 40, oct: () => Math.hypot(RM.me.x - OCT.x, (RM.me.y - OCT.y) * 1.4) < 150, swg: () => Math.hypot(RM.me.x - SWG.x, (RM.me.y - SWG.y) * 1.4) < 140 };
  const nearAny = () => rmShopId() === 0 && !rmRideOf(RM.me) ? Object.keys(near).filter(k => near[k]()) : [];
  const keyOld = rmXKey; rmXKey = function () { return keyOld() + '|r5' + nearAny().join(''); };
  const promptOld = rmXPrompt; rmXPrompt = function (mk) { nearAny().forEach(k => mk('اركب ' + NAMES[k], () => board(k))); return promptOld(mk); };
  const hitOld = rmXHit; rmXHit = function (x, y) {
    if (rmShopId() === 0 && !rmRideOf(RM.me)) {
      const zones = [['drop', DROP.x - 60, DROP.x + 60, DROP.y - DROP.H, DROP.y + 14, DROP.x, DROP.y + 30], ['bump', BUMP.x - BUMP.w / 2, BUMP.x + BUMP.w / 2, BUMP.y - BUMP.h / 2 - 60, BUMP.y + BUMP.h / 2, BUMP.x, BUMP.y + BUMP.h / 2 + 34], ['oct', OCT.x - OCT.R - 30, OCT.x + OCT.R + 30, OCT.y - 110, OCT.y + 34, OCT.x, OCT.y + 56], ['swg', SWG.x - 130, SWG.x + 130, SWG.y - 190, SWG.y + 26, SWG.x, SWG.y + 50]];
      for (const z of zones) if (x > z[1] && x < z[2] && y > z[3] && y < z[4]) { rmWalkTo(z[5], z[6]); rmTapMark(z[5], z[6]); if (!near[z[0]]()) showToast('🚶 روح للعبة ودوس زر «اركب»'); return true; }
    }
    return hitOld(x, y);
  };
  const holesOld = rmXHoles; rmXHoles = function (hole, fl) { try { holesOld(hole, fl); } catch (e) {} hole(DROP.x, DROP.y - 140, 170, .85); hole(BUMP.x, BUMP.y, 230, .85); hole(OCT.x, OCT.y - 30, 160, .85); hole(SWG.x, SWG.y - 70, 160, .85); hole(-494, 1100, 140, .8); };
  const glowOld = rmXGlow; rmXGlow = function (c, d, fl) { try { glowOld(c, d, fl); } catch (e) {} rmGlow(c, DROP.x, DROP.y - DROP.H + 20, 70, .3 * d, '255,90,140'); rmGlow(c, BUMP.x, BUMP.y - 40, 190, .16 * d, '140,200,255'); rmGlow(c, OCT.x, OCT.y - 60, 110, .2 * d, '210,120,255'); rmGlow(c, SWG.x, SWG.y - 130, 100, .22 * d, '255,230,140'); rmGlow(c, -494, 1040, 120, .2 * d, '255,120,200'); };

  /* ---------- نضيفها للمنتجع ---------- */
  RM_DECOR.push({ y: DROP.y, f: dropDraw }, { y: BUMP.y + BUMP.h / 2, f: bumpDraw }, { y: OCT.y + 20, f: octDraw }, { y: SWG.y + 20, f: swgDraw }, { y: 1185, f: gate });
  [[-900, 1160, 'pop'], [-430, 930, 'cotton'], [-1240, 885, 'cotton']].forEach(([x, y, k]) => RM_DECOR.push({ y, f: c => cart(c, x, y, k) }));
  [[-1290, 1175], [-1010, 1175], [-640, 895], [-330, 1170], [-80, 980], [-1370, 1175]].forEach(([x, y]) => RM_DECOR.push({ y, f: c => bench(c, x, y) }));
  [[-1350, 860, 90], [-930, 860, 90], [-470, 860, 90], [-60, 860, 90], [-20, 470, 90]].forEach(([x, y, h]) => RM_DECOR.push({ y, f: c => pole(c, x, y, h) }));
  RM_DECOR.push({ y: 772, f: c => { stringLights(c, -1350, 770, -930, 770); stringLights(c, -930, 770, -470, 770); stringLights(c, -470, 770, -60, 770); } });
  RM_DECOR.push({ y: 640, f: c => booth(c, -410, 640) }); [[-470, 560], [-350, 560], [-30, 720], [-300, 720], [-700, 900], [-560, 900]].forEach(([x, y]) => RM_DECOR.push({ y, f: c => flowers(c, x, y) }));
  window.R5_RIDES = { drop: DROP, bump: BUMP, oct: OCT, swg: SWG };
})();
