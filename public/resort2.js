/* =====================================================================
   توسعة المنتجع 2 🏝️ — صالون ملاذ 💇‍♀️ + فندق بابيت 🏨 + الشلال والقوارب 🚣
   + عصائر استوائية 🍹 + البزونة جاسمية 🐱 + حقائب جديدة 👜
   كل الرسم يصير بس للي ظاهر بالشاشة حتى تبقى اللعبة خفيفة.
   ===================================================================== */
if (RM.v0 === undefined) { RM.v0 = RMX0; RM.v1 = RMW; RM.g60 = Math.floor(RMX0 / 60) * 60; RM.vy0 = 0; RM.vy1 = RMH; }
const RX = { ht: null, dark: false, slTry: '', mlz: { x: 49372, y: 396, say: null, wave: 0, idleT: 0, near: false }, bab: { x: 50530, y: 396, say: null, wave: 0, idleT: 0, near: false }, jui: { say: null, wave: 0 }, cat: { say: null, t: 0, hap: 0 } };
const rxVis = (x0, x1) => x1 > RM.v0 && x0 < RM.v1;
const rxRect = (c, x, y, w, h, r, f) => { c.fillStyle = f; c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); c.fill(); };
const rxSay = (o, t, dur) => { o.say = { txt: t, t: dur || 260, t0: dur || 260 }; };
const rxSnd = (q) => { try { if (!RM.ambMute) q.forEach(n => blip(n[0] || 'sine', n[1], n[2] || n[1], n[3] || 0.2, n[4] || 0.05, n[5] || 0)); } catch (e) {} };
const rxH = n => { n |= 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n ^= n >>> 16; return (n >>> 0) / 4294967296; };
function rxTxt(c, t, x, y, font, col, sh, shc) { c.save(); try { c.direction = 'rtl'; } catch (e) {} c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; if (sh) { c.shadowColor = shc || 'rgba(0,0,0,.5)'; c.shadowBlur = sh; } c.fillStyle = col; c.fillText(t, x, y); c.restore(); }
function rxStar4(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); }
function rxHeart(c, x, y, s, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y + s * 0.9); c.bezierCurveTo(x - s * 1.3, y, x - s * 0.8, y - s * 1.1, x, y - s * 0.4); c.bezierCurveTo(x + s * 0.8, y - s * 1.1, x + s * 1.3, y, x, y + s * 0.9); c.fill(); }
function rxNpc(c, av, x, y, dir, Pp) { c.save(); c.translate(x, y); c.scale(dir || 1, 1); try { AVT.drawAt(c, av, 0, 0, AV_H, Object.assign({ t: RM.T }, Pp || {})); } catch (e) {} c.restore(); }

/* ===================== حقائب جديدة 👜 ===================== */
const RX_BAGS = [['g_bfly', 'حقيبة الفراشة', 45, ['#c9a2ff', '#ff9ec7']], ['g_berry', 'حقيبة الفراولة', 40, ['#ff3b5c', '#c4122e']], ['g_moon', 'حقيبة القمر', 50, ['#2b2f6a', '#151840']], ['g_sunf', 'حقيبة دوار الشمس', 45, ['#ffd23f', '#e09a0a']], ['g_rainb', 'حقيبة قوس قزح', 55, ['#ffffff', '#e4e4f2']], ['g_icecr', 'حقيبة الآيس كريم', 45, ['#ffd9a8', '#c98a4a']], ['g_panda', 'حقيبة الباندا', 55, ['#ffffff', '#d8d8e0']], ['g_diam', 'حقيبة الماسة', 90, ['#bfe9ff', '#4aa8e0']], ['g_shell', 'حقيبة الصدفة', 50, ['#ffe0ec', '#f2a6c4']], ['g_donut', 'حقيبة الدونات', 40, ['#f0b878', '#c07a3a']]];
RX_BAGS.forEach(b => { const w = { k: b[0], n: b[1], s: 'bag', p: b[2] }; RM_WEAR.push(w); RM_WEARD[b[0]] = w; RM_BAGCOL[b[0]] = b[3]; });
const RX_BAGK = {}; RX_BAGS.forEach(b => RX_BAGK[b[0]] = b[3]);
const rxBagOld = rmBagItem;
rmBagItem = function (c, k, x, y, T, noStrap) {
  const C = RX_BAGK[k]; if (!C) return rxBagOld(c, k, x, y, T, noStrap);
  c.save(); c.translate(x, y); const sw = Math.sin((T || 0) / 18) * 1.2;
  rmBagStrap(c, k, sw, noStrap); const OL = () => { c.strokeStyle = 'rgba(40,10,30,.75)'; c.lineWidth = 0.9; c.stroke(); };
  const grad = (a, b) => { const g = c.createLinearGradient(-8, -8, 8, 8); g.addColorStop(0, a || C[0]); g.addColorStop(1, b || C[1]); return g; };
  if (k === 'g_bfly') {
    [-1, 1].forEach(s => { c.fillStyle = grad(); c.beginPath(); c.ellipse(s * 5, -2.5, 5.4, 4.2, s * 0.5, 0, 7); c.fill(); OL(); c.fillStyle = grad('#ffd0e8', '#ff7ab8'); c.beginPath(); c.ellipse(s * 4, 4, 3.6, 3, -s * 0.4, 0, 7); c.fill(); OL(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(s * 5.5, -3, 1.3, 0, 7); c.fill(); });
    c.fillStyle = '#3a1a4a'; c.beginPath(); c.ellipse(0, 0.5, 1.3, 6, 0, 0, 7); c.fill(); c.strokeStyle = '#3a1a4a'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, -5); c.quadraticCurveTo(-2, -9, -3.4, -9.4); c.moveTo(0, -5); c.quadraticCurveTo(2, -9, 3.4, -9.4); c.stroke();
  } else if (k === 'g_berry') {
    c.fillStyle = grad(); c.beginPath(); c.moveTo(0, 9); c.quadraticCurveTo(-10, 2, -8, -4); c.quadraticCurveTo(0, -8, 8, -4); c.quadraticCurveTo(10, 2, 0, 9); c.fill(); OL();
    c.fillStyle = '#ffe680'; [[-4, -1], [0, -2], [4, -1], [-2, 3], [2, 3], [0, 6], [-5, -4], [5, -4]].forEach(p => { c.beginPath(); c.ellipse(p[0], p[1], 0.6, 0.9, 0, 0, 7); c.fill(); });
    c.fillStyle = '#3fae4a'; c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI + i * Math.PI / 5; c.lineTo(Math.cos(a) * 6.5, -5.5 + Math.sin(a) * 3.2); c.lineTo(Math.cos(a + 0.3) * 3, -5 + Math.sin(a + 0.3) * 1.4); } c.closePath(); c.fill();
  } else if (k === 'g_moon') {
    c.fillStyle = grad(); c.beginPath(); c.roundRect ? c.roundRect(-8, -6, 16, 14, 5) : c.rect(-8, -6, 16, 14); c.fill(); OL(); c.strokeStyle = '#d7a400'; c.lineWidth = 1.3; c.beginPath(); c.arc(0, -6, 4.5, Math.PI, 0); c.stroke();
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(-0.5, 1, 4.4, 0, 7); c.fill(); c.fillStyle = C[0]; c.beginPath(); c.arc(1.6, -0.2, 3.8, 0, 7); c.fill();
    const tw = 0.5 + 0.5 * Math.sin((T || 0) / 9); rxStar4(c, 4.6, 3.6, 1.6 * tw + 0.5, '#fff6c0'); rxStar4(c, -5, -3, 1.1, '#fff6c0');
  } else if (k === 'g_sunf') {
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + (T || 0) / 200; c.fillStyle = i % 2 ? '#ffd23f' : '#ffb21f'; c.beginPath(); c.ellipse(Math.cos(a) * 6, Math.sin(a) * 6, 3.4, 1.8, a, 0, 7); c.fill(); }
    c.fillStyle = '#7a4a1a'; c.beginPath(); c.arc(0, 0, 4.4, 0, 7); c.fill(); OL(); c.fillStyle = '#3a200a'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(Math.cos(i) * 2.2, Math.sin(i * 1.7) * 2.2, 0.6, 0, 7); c.fill(); }
  } else if (k === 'g_rainb') {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-4, 3, 4.6, 0, 7); c.arc(1, 1, 5.4, 0, 7); c.arc(5.5, 3.6, 4, 0, 7); c.rect(-8, 3, 15, 4.6); c.fill(); OL();
    ['#ff4a5a', '#ff9a2a', '#ffd23f', '#3ddc84', '#4aa8ff', '#9a6aff'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 1.1; c.beginPath(); c.arc(0, 2, 7.6 - i * 1.1, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); });
  } else if (k === 'g_icecr') {
    c.fillStyle = grad('#f2c486', '#c98a4a'); c.beginPath(); c.moveTo(-6, -1); c.lineTo(6, -1); c.lineTo(0, 10); c.closePath(); c.fill(); OL(); c.strokeStyle = 'rgba(120,70,20,.5)'; c.lineWidth = 0.5; for (let i = -4; i <= 4; i += 2.6) { c.beginPath(); c.moveTo(i, -1); c.lineTo(i * 0.2 + 2, 7); c.moveTo(-i, -1); c.lineTo(-i * 0.2 - 2, 7); c.stroke(); }
    [['#ff9ec7', -3, -4], ['#bfe9ff', 3, -4], ['#fff3c4', 0, -8]].forEach(s => { c.fillStyle = s[0]; c.beginPath(); c.arc(s[1], s[2], 4.4, 0, 7); c.fill(); OL(); }); c.fillStyle = '#e8284a'; c.beginPath(); c.arc(0, -12.4, 1.6, 0, 7); c.fill();
  } else if (k === 'g_panda') {
    c.fillStyle = '#1a1a22'; [-6, 6].forEach(ex => { c.beginPath(); c.arc(ex, -6, 3, 0, 7); c.fill(); }); c.fillStyle = grad(); c.beginPath(); c.arc(0, 0.5, 8, 0, 7); c.fill(); OL();
    c.fillStyle = '#1a1a22'; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * 3.4, -0.5, 2.2, 2.8, s * 0.5, 0, 7); c.fill(); }); c.fillStyle = '#fff'; [-1, 1].forEach(s => { c.beginPath(); c.arc(s * 3.2, -1, 0.8, 0, 7); c.fill(); }); c.fillStyle = '#1a1a22'; c.beginPath(); c.ellipse(0, 3, 1.4, 1, 0, 0, 7); c.fill(); c.fillStyle = '#ff9ec7'; [-5.5, 5.5].forEach(ex => { c.beginPath(); c.arc(ex, 3.4, 1.2, 0, 7); c.fill(); });
  } else if (k === 'g_diam') {
    c.fillStyle = grad(); c.beginPath(); c.moveTo(-8, -3); c.lineTo(-4, -7); c.lineTo(4, -7); c.lineTo(8, -3); c.lineTo(0, 9); c.closePath(); c.fill(); OL();
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-8, -3); c.lineTo(8, -3); c.moveTo(-4, -7); c.lineTo(-2, -3); c.lineTo(0, 9); c.lineTo(2, -3); c.lineTo(4, -7); c.stroke();
    const tw = 0.5 + 0.5 * Math.sin((T || 0) / 6); rxStar4(c, 4, -5, 2.4 * tw + 0.4, '#fff'); rxStar4(c, -5, 1, 1.2 * (1 - tw) + 0.3, '#fff');
  } else if (k === 'g_shell') {
    c.fillStyle = grad(); c.beginPath(); c.moveTo(0, 8); for (let i = 0; i <= 8; i++) { const a = Math.PI * (1.05 + i * 0.1125); c.quadraticCurveTo(Math.cos(a - 0.06) * 10, 2 + Math.sin(a - 0.06) * 10, Math.cos(a) * 9, 2 + Math.sin(a) * 9); } c.closePath(); c.fill(); OL();
    c.strokeStyle = 'rgba(200,90,140,.6)'; c.lineWidth = 0.7; for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.12 + i * 0.13); c.beginPath(); c.moveTo(0, 8); c.lineTo(Math.cos(a) * 8.4, 2 + Math.sin(a) * 8.4); c.stroke(); } c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 7.6, 1.8, 0, 7); c.fill(); c.fillStyle = 'rgba(255,200,230,.9)'; c.beginPath(); c.arc(-0.5, 7, 0.6, 0, 7); c.fill();
  } else if (k === 'g_donut') {
    c.fillStyle = grad(); c.beginPath(); c.arc(0, 0, 8, 0, 7); c.fill(); OL(); c.fillStyle = '#ff8fc0'; c.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = 6.6 + Math.sin(i * 2.7) * 0.7; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
    ['#fff', '#3ddc84', '#ffd23f', '#4aa8ff', '#9a6aff'].forEach((col, i) => { for (let j = 0; j < 2; j++) { const a = i * 1.3 + j * 3.1, r = 4.6; c.save(); c.translate(Math.cos(a) * r, Math.sin(a) * r); c.rotate(a * 2); c.fillStyle = col; c.fillRect(-1, -0.3, 2, 0.7); c.restore(); } });
    c.fillStyle = '#8a5a2e'; c.beginPath(); c.arc(0, 0, 2.2, 0, 7); c.fill();
  }
  c.restore();
};
/* ستاند الحقائب الجديدة داخل محل روح */
const rxBagListOld = rmBagList;
rmBagList = function () {
  const L = rxBagListOld(), T = RM.T;
  L.push([478, c => { const x = 48290, y = 478; c.fillStyle = '#fff'; rxRect(c, x - 52, y - 58, 104, 58, 8, '#fff'); c.strokeStyle = '#ff7ab8'; c.lineWidth = 2; c.strokeRect(x - 52, y - 58, 104, 58); c.fillStyle = '#ffd1e6'; c.fillRect(x - 52, y - 30, 104, 3); ['g_bfly', 'g_diam', 'g_panda', 'g_berry', 'g_moon', 'g_donut'].forEach((k, i) => { c.save(); c.translate(x - 50 + (i % 3) * 34, y - 33 + Math.floor(i / 3) * 28); c.scale(1.15, 1.15); rmBagItem(c, k, 0, 0, T + i * 15); c.restore(); }); rmTagDraw(c, x, y + 12, '🆕 حقائب جديدة', 'rgba(255,45,122,.92)'); }]);
  return L;
};

/* ===================== عصائر استوائية 🍹 ===================== */
Object.assign(RM_DRINKS, { mango: ['🥭', 'عصير مانجو', '#ffb21f', '#fff6e0'], pine: ['🍍', 'عصير أناناس', '#ffe066', '#fffbe0'], coco: ['🥥', 'ماي جوز الهند', '#f4efe0', '#8a5a2e'], melon: ['🍉', 'عصير رقي', '#ff4a6a', '#fff0f2'], passion: ['🌺', 'باشن فروت', '#ffb84a', '#fff3e0'], berry: ['🍓', 'سموذي فراولة', '#ff5a8a', '#fff0f5'] });
const RX_TROP = ['mango', 'pine', 'coco', 'melon', 'passion', 'berry'];
const rxCupOld = rmCupShape;
rmCupShape = function (c, k, T, tilt) {
  if (!RX_TROP.includes(k)) return rxCupOld(c, k, T, tilt); const D = RM_DRINKS[k]; c.lineJoin = 'round';
  if (k === 'coco') { c.fillStyle = '#7a4a22'; c.beginPath(); c.arc(0, -4.5, 4.6, 0, 7); c.fill(); c.fillStyle = '#f4efe0'; c.beginPath(); c.ellipse(0, -7.6, 3.4, 1.2, 0, 0, 7); c.fill(); c.strokeStyle = '#ff5a8a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0.5, -7.6); c.lineTo(3, -14); c.stroke(); c.fillStyle = '#ff7ab8'; c.beginPath(); c.arc(-2.6, -8.6, 1.6, 0, 7); c.fill(); return; }
  c.fillStyle = 'rgba(255,255,255,.55)'; c.strokeStyle = '#5a7a90'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-3.6, -11); c.lineTo(3.6, -11); c.lineTo(2.6, 0); c.lineTo(-2.6, 0); c.closePath(); c.fill(); c.stroke();
  const g = c.createLinearGradient(0, -9, 0, 0); g.addColorStop(0, D[2]); g.addColorStop(1, k === 'passion' ? '#ff5a3a' : D[2]); c.fillStyle = g; c.beginPath(); c.moveTo(-3.3, -9); c.lineTo(3.3, -9); c.lineTo(2.5, -0.6); c.lineTo(-2.5, -0.6); c.closePath(); c.fill();
  c.fillStyle = k === 'melon' ? '#3fae4a' : k === 'berry' ? '#ff2d5a' : '#ffd23f'; c.beginPath(); c.arc(-3.4, -10.6, 2, 0, 7); c.fill();
  c.strokeStyle = '#ff4a6a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(1, -9); c.lineTo(3.4, -15); c.stroke();
  c.save(); c.translate(-1.4, -13.6); c.rotate(-0.4); c.fillStyle = ['#ff5a8a', '#4aa8ff', '#3ddc84'][RX_TROP.indexOf(k) % 3]; c.beginPath(); c.moveTo(-3.6, 0); c.quadraticCurveTo(0, -3.4, 3.6, 0); c.closePath(); c.fill(); c.strokeStyle = '#6a4a20'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(0, -1.6); c.lineTo(0, 3.6); c.stroke(); c.restore();
};

/* ===================== مكياج الصالون 💄 (يترسم داخل وجه الشخصية نفسها) ===================== */
const RX_SL = [
  ['s_bride', 'عروس ناعم 🤍', 60, { sh: ['#f6dcc8', '#e7b7a4'], sa: 0.6, lip: '#e98a9a', gloss: 1, bl: '#ffb0b8', hl: 1, lash: 3, glit: ['#fff', '#ffe9c0'], pearl: 1 }],
  ['s_holly', 'هوليوود 💋', 55, { sh: ['#d9a46a', '#8a5a3a'], sa: 0.55, lip: '#c4102a', gloss: 1, bl: '#e8708a', liner: 'wing', lash: 4, hl: 1 }],
  ['s_korea', 'كوري زجاجي 🌸', 50, { sh: ['#ffd0dc', '#f7a8be'], sa: 0.5, lip: '#ff6a8a', grad: 1, gloss: 1, bl: '#ffa8bc', hl: 2, aegyo: 1, lash: 2 }],
  ['s_smoky', 'سموكي سهرة 🖤', 55, { sh: ['#3a2a3e', '#7a5a7e'], sa: 0.85, lip: '#b06a6a', bl: '#d0708a', liner: 'cat', lash: 4, glit: ['#e8e8f8', '#c8c8e8'], hl: 1 }],
  ['s_sunset', 'الغروب 🌅', 50, { sh: ['#9a3ad8', '#ff8a3a'], sh3: '#ff4a8a', sa: 0.7, lip: '#ff5a4a', gloss: 1, bl: '#ff8a6a', liner: 'wing', lash: 3, glit: ['#ffe066'] }],
  ['s_ocean', 'حورية البحر 🧜‍♀️', 60, { sh: ['#2ad0c8', '#3a6ae8'], sa: 0.7, lip: '#d870b0', gloss: 1, bl: '#ff9ac8', lash: 3, pearl: 2, glit: ['#bffff8', '#d0e0ff', '#ffd0f0'], hl: 1 }],
  ['s_royal', 'ملكي ذهبي 👑', 75, { sh: ['#ffd76a', '#b8860b'], sa: 0.75, lip: '#9a2a3a', gloss: 1, bl: '#d88a6a', liner: 'gold', lash: 4, contour: 1, hl: 2, glit: ['#ffe680', '#fff'] }],
  ['s_doll', 'دمية باربي 🎀', 50, { sh: ['#ffb0d8', '#ff6ab0'], sa: 0.6, lip: '#ff3d8a', gloss: 1, bl: '#ff6a9a', blBig: 1, lash: 4, lower: 1, hl: 1, glit: ['#fff'] }]
];
/* 👑 مكياج المشرفين حصراً (10 لوكات احترافية) — يظهر بخانة «للمشرفين» داخل صالون ملاذ */
const RX_SLA = [
  ['sa_queen', 'ملكة المنتجع 👑', { sh: ['#ffe08a', '#7a2ad8'], sh3: '#c89a2a', sa: 0.8, lip: '#7a1a4a', gloss: 1, bl: '#e08a9a', liner: 'gold', lash: 5, contour: 1, hl: 2, bindi: '#ffd23f', gemsBrow: ['#ffd76a', '#fff3c0'], glit: ['#ffe680', '#fff'], shim: 1 }],
  ['sa_galaxy', 'مجرة 🌌', { sh: ['#1a1050', '#7a3ad8'], sh3: '#ff4ad8', sa: 0.85, lip: '#6a2aa8', gloss: 1, bl: '#c87ad8', liner: 'cat', lash: 4, glow: '154,106,255', glit: ['#ffffff', '#c8b0ff', '#8affff'], stars: 1 }],
  ['sa_rose', 'ورد جوري 🌹', { sh: ['#ffc0cc', '#d02a5a'], sa: 0.7, lip: '#d0103a', ombre: '#ff8aa8', gloss: 1, bl: '#ff6a8a', liner: 'wing', lash: 4, hl: 1, cheek: 'heart', cheekC: '#e8204a' }],
  ['sa_diamond', 'ألماس 💎', { sh: ['#ffffff', '#9ad0ff'], sa: 0.75, lip: '#e0a0b8', gloss: 1, bl: '#ffc0d8', linerC: '#4a7ab8', lash: 4, hl: 2, gemsBrow: ['#ffffff', '#bfe8ff'], tear: '#bff4ff', shim: 1, glit: ['#fff', '#d0f0ff'] }],
  ['sa_aurora', 'شفق قطبي 🌈', { sh: ['#3affc8', '#3a8aff'], sh3: '#c84aff', sa: 0.75, lip: '#ff7ac0', grad: 1, gloss: 1, bl: '#ff9ad0', linerC: '#18a8a0', lash: 3, glow: '122,255,224', shim: 1, glit: ['#bfffee', '#e0c8ff'] }],
  ['sa_fire', 'لهب 🔥', { sh: ['#ffd040', '#ff3a1a'], sh3: '#ff7a1a', sa: 0.8, lip: '#c4101a', gloss: 1, bl: '#ff7a5a', liner: 'cat', lash: 4, contour: 1, glit: ['#ffe066', '#ffb03a'], glow: '255,120,40' }],
  ['sa_angel', 'ملاك 🤍', { sh: ['#ffffff', '#ffd6ea'], sa: 0.6, lip: '#ffb0c4', gloss: 1, bl: '#ffb8c8', lash: 4, hl: 2, pearl: 2, glow: '255,243,192', glit: ['#ffffff', '#fff3c0'], bindi: '#ffffff' }],
  ['sa_neon', 'نيون ⚡', { sh: ['#ff2ad8', '#2ad8ff'], sa: 0.85, lip: '#ff2a8a', gloss: 1, bl: '#ff6ad0', linerC: '#2affd8', dbl: 1, lash: 3, glow: '255,42,216', glit: ['#2affd8', '#ff2ad8'] }],
  ['sa_pearl', 'لؤلؤة الخليج 🦪', { sh: ['#f6ead8', '#c8a88a'], sa: 0.65, lip: '#c87a7a', gloss: 1, bl: '#e8a8a0', liner: 'wing', lash: 3, hl: 1, pearl: 2, gemsBrow: ['#fffaf0', '#f0e6ff'], bindi: '#fff8f0' }],
  ['sa_love', 'بابي 💜 بابيتو', { sh: ['#e0b0ff', '#8a2ad8'], sh3: '#ff6ab8', sa: 0.8, lip: '#a0207a', ombre: '#ff7ac8', gloss: 1, bl: '#e08aff', liner: 'wing', lash: 5, hl: 2, cheek: 'heart', cheekC: '#a453ff', glow: '192,138,255', glit: ['#ffffff', '#ffc8f0'], hearts: 1 }]
];
const RX_FA = [['f_gems', 'كريستال تحت العين 💎', 35], ['f_hearts', 'قلوب صغيرة 💗', 30], ['f_stars', 'نجوم لامعة ⭐', 30], ['f_freck', 'نمش ناعم 🌰', 25], ['f_bfly', 'رسمة فراشة 🦋', 40], ['f_moon', 'قمر ونجوم 🌙', 35]];
const RX_SLD = {}; RX_SL.forEach(x => RX_SLD[x[0]] = x[3]); RX_SLA.forEach(x => RX_SLD[x[0]] = x[2]);
RX_SL.forEach(x => { const w = { k: x[0], n: x[1], s: 'sl', p: x[2] }; RM_WEAR.push(w); RM_WEARD[x[0]] = w; });
RX_FA.forEach(x => { const w = { k: x[0], n: x[1], s: 'fa', p: x[2] }; RM_WEAR.push(w); RM_WEARD[x[0]] = w; });
RX_SLA.forEach(x => { const w = { k: x[0], n: x[1], s: 'sl', p: 0, adm: 1 }; RM_WEAR.push(w); RM_WEARD[x[0]] = w; });
function rxSlOf(o, me) { const W = (o && o.wear) || {}; let sl = W.sl || '', fa = W.fa || ''; if (me && RX.slTry) { if (RX.slTry[0] === 's') sl = RX.slTry; else fa = RX.slTry; } return sl || fa ? { sl, fa } : null; }
function rmSalonFace(c, O, ex, rx, ry, t, male, klw) {
  const L = window.AVT_SL; if (!L) return; const k = klw || 1, D = RX_SLD[L.sl], ey = -102, HC = window.AVT_HEADCLIP;
  /* كل شي على الخدود والبشرة ينقص على حدود الوجه بالضبط (ما يطلع برا الخد) */
  const inFace = f => { c.save(); try { if (HC) HC(); f(); } catch (e) {} c.restore(); };
  if (D) {
    inFace(() => {
      if (D.glow) [-1, 1].forEach(s => { const cx = s * ex, g = c.createRadialGradient(cx, ey, 1, cx, ey, rx + 5); const q = (rx + 0.6) / (rx + 5); g.addColorStop(0, 'rgba(' + D.glow + ',0)'); g.addColorStop(q, 'rgba(' + D.glow + ',0)'); g.addColorStop(q + (1 - q) * 0.35, 'rgba(' + D.glow + ',' + (0.3 + 0.15 * Math.sin(t / 9)) + ')'); g.addColorStop(1, 'rgba(' + D.glow + ',0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, ey, rx + 5, 0, 7); c.fill(); });
      if (D.contour) { c.globalAlpha = 0.2; c.fillStyle = '#8a5a3a'; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * 10.6, -92.8, 1.8, 3.8, s * 0.5, 0, 7); c.fill(); }); c.globalAlpha = 1; }
      const bl = D.bl; if (bl) [-1, 1].forEach(s => { const cx = s * 9.4, cy = -94.4, r = D.blBig ? 3.9 : 3.2, g = c.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, bl); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = D.blBig ? 0.68 : 0.55; c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, r, r * 0.72, 0, 0, 7); c.fill(); c.globalAlpha = 1; });
      // ظلال الجفن (هلال فوق العين)
      [-1, 1].forEach(s => { const cx = s * ex; c.save(); c.globalAlpha = D.sa || 0.6; const g = c.createLinearGradient(cx, ey - ry - 3.6, cx, ey); g.addColorStop(0, D.sh[0]); if (D.sh3) g.addColorStop(0.5, D.sh3); g.addColorStop(1, D.sh[1]); c.fillStyle = g; c.beginPath(); c.ellipse(cx + s * 0.6, ey - 0.6, rx + 2, ry + 3.4, 0, Math.PI, Math.PI * 2, false); c.ellipse(cx, ey, rx + 0.35, ry + 0.35, 0, Math.PI * 2, Math.PI, true); c.closePath(); c.fill();
        if (D.shim) { c.clip(); const u = ((t / 70) % 1.6) - 0.3, sx = cx - rx - 3 + u * (rx * 2 + 6), sg = c.createLinearGradient(sx - 2.5, 0, sx + 2.5, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,.75)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = 1; c.fillStyle = sg; c.fillRect(sx - 2.5, ey - ry - 5, 5, ry + 6); }
        c.restore(); });
      if (D.aegyo) { c.globalAlpha = 0.5; c.strokeStyle = '#fff0f4'; c.lineWidth = 0.9 * k; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * ex, ey + ry * 0.55, rx * 0.8, ry * 0.7, 0, Math.PI * 0.2, Math.PI * 0.8); c.stroke(); }); c.globalAlpha = 1; }
      if (D.hl) { c.globalAlpha = D.hl > 1 ? 0.62 : 0.45; c.fillStyle = '#fff'; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * 8.6, -97.4, D.hl > 1 ? 2.2 : 1.6, 0.8, -s * 0.35, 0, 7); c.fill(); }); c.beginPath(); c.ellipse(0, -98, 0.55, 2, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
      if (D.cheek === 'heart') [-1, 1].forEach(s => rxHeart(c, s * 9.2, -95.2, 0.95, D.cheekC || '#ff4a8a'));
      if (D.tear) [-1, 1].forEach(s => { const px = s * (ex + rx * 0.35), py = ey + ry + 2.4, tw = 0.6 + 0.4 * Math.sin(t / 6 + s); c.fillStyle = D.tear; c.beginPath(); c.moveTo(px, py - 1.3); c.quadraticCurveTo(px + 0.9, py + 0.2, px, py + 1); c.quadraticCurveTo(px - 0.9, py + 0.2, px, py - 1.3); c.fill(); c.globalAlpha = tw; rxStar4(c, px + 0.4, py - 0.4, 1.1, '#fff'); c.globalAlpha = 1; });
      if (D.pearl) [-1, 1].forEach(s => { const cx = s * (ex + rx * 0.62); for (let i = 0; i < (D.pearl > 1 ? 3 : 2); i++) { c.fillStyle = D.pearl > 1 ? ['#e0fffa', '#ffe0f4', '#e0e8ff'][i] : '#fff'; c.beginPath(); c.arc(cx + s * i * 0.9, ey + ry + 1.2 + i * 0.7, 0.6, 0, 7); c.fill(); } });
      // شفايف + لمعة
      if (D.lip) { if (D.grad || D.ombre) { const g = c.createRadialGradient(0, -90.6, 0, 0, -90.6, 3.9); if (D.ombre) { g.addColorStop(0, D.ombre); g.addColorStop(0.55, D.lip); g.addColorStop(1, D.lip); } else { g.addColorStop(0, D.lip); g.addColorStop(1, 'rgba(255,170,190,.55)'); } c.fillStyle = g; } else c.fillStyle = D.lip; c.beginPath(); c.ellipse(0, -90.6, 3.5, 1.8, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(80,10,30,.45)'; c.lineWidth = 0.5 * k; c.beginPath(); c.moveTo(-3.2, -90.8); c.quadraticCurveTo(-1.4, -91.8, 0, -91.2); c.quadraticCurveTo(1.4, -91.8, 3.2, -90.8); c.stroke(); if (D.gloss) { c.globalAlpha = 0.8; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0.9, -90.0, 1.1, 0.42, 0, 0, 7); c.fill(); c.globalAlpha = 1; } }
      if (D.bindi) { const tw = 0.5 + 0.5 * Math.sin(t / 7); c.fillStyle = D.bindi; c.beginPath(); c.moveTo(0, -107.6); c.lineTo(0.9, -106.5); c.lineTo(0, -105.2); c.lineTo(-0.9, -106.5); c.closePath(); c.fill(); c.strokeStyle = 'rgba(80,40,0,.4)'; c.lineWidth = 0.3; c.stroke(); c.globalAlpha = tw; rxStar4(c, 0.5, -107, 1.3, '#fff'); c.globalAlpha = 1; }
    });
    // آيلاينر احترافي (يطلع شوية برا العين، طبيعي)
    const lc = D.liner === 'gold' ? '#d4a017' : D.linerC || '#140c1a';
    if (D.liner || D.linerC) [-1, 1].forEach(s => { const ox = s * (ex + rx + 0.1), cat = D.liner === 'cat'; c.fillStyle = lc; c.beginPath(); c.moveTo(ox - s * 2.4, ey - ry * 0.55); c.lineTo(ox + s * (cat ? 3.6 : 3), ey - ry - (cat ? 2.2 : 1.5)); c.lineTo(ox - s * 0.2, ey + 0.4); c.closePath(); c.fill(); if (D.dbl) { c.globalAlpha = 0.85; c.fillStyle = D.sh[0]; c.beginPath(); c.moveTo(ox - s * 1.6, ey - ry * 0.95); c.lineTo(ox + s * 3.4, ey - ry - 3); c.lineTo(ox - s * 0.4, ey - ry * 0.6); c.closePath(); c.fill(); c.globalAlpha = 1; } if (D.liner === 'gold' || D.linerC) { c.strokeStyle = D.linerC || '#140c1a'; c.lineWidth = 0.6 * k; c.beginPath(); c.ellipse(s * ex, ey, rx + 0.3, ry + 0.3, 0, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); } });
    // رموش طويلة
    if (D.lash) [-1, 1].forEach(s => { const cx = s * ex, n = D.lash + 2, len = 1.6 + D.lash * 0.55; c.strokeStyle = '#140c1a'; c.lineWidth = 0.75 * k; c.lineCap = 'round'; for (let i = 0; i < n; i++) { const u = i / (n - 1), a = Math.PI * (1.15 + u * 0.7), px = cx + Math.cos(a) * (rx + 0.2), py = ey + Math.sin(a) * (ry + 0.2), aa = a - s * 0.35; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + Math.cos(aa) * len * 0.6, py + Math.sin(aa) * len * 0.9, px + Math.cos(aa) * len + s * 0.5, py + Math.sin(aa) * len); c.stroke(); } if (D.lower) { c.lineWidth = 0.5 * k; for (let i = 0; i < 4; i++) { const a = Math.PI * (0.3 + i * 0.13), px = cx + Math.cos(a) * rx, py = ey + Math.sin(a) * ry; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * 0.8, py + Math.sin(a) * 0.9); c.stroke(); } } });
    if (D.gemsBrow) [-1, 1].forEach(s => { for (let i = 0; i < 5; i++) { const a = Math.PI * (1.2 + i * 0.15), px = s * ex + Math.cos(a) * (rx + 2.6), py = ey + Math.sin(a) * (ry + 3.2); c.fillStyle = D.gemsBrow[i % D.gemsBrow.length]; c.beginPath(); c.arc(px, py, 0.5, 0, 7); c.fill(); if (Math.sin(t / 6 + i * 1.3 + s) > 0.75) rxStar4(c, px, py, 1.2, 'rgba(255,255,255,.95)'); } });
    if (D.glit) for (let i = 0; i < (D.stars ? 10 : 7); i++) { const s = i % 2 ? 1 : -1, ph = Math.sin(t / 9 + i * 1.7); if (ph < 0.2) continue; const px = s * (ex - 2.6 + (i * 1.9) % 5.4), py = ey - ry - 1.4 - (i % 3) * 0.9; rxStar4(c, px, py, 0.5 + ph * 0.9, D.glit[i % D.glit.length]); }
    if (D.hearts) for (let i = 0; i < 2; i++) { const u = ((t / 90 + i * 0.5) % 1), s = i ? 1 : -1; c.globalAlpha = Math.sin(u * Math.PI) * 0.9; rxHeart(c, s * (ex + rx + 1.5), ey - ry - 1 - u * 5, 0.8, '#c87aff'); c.globalAlpha = 1; }
  }
  const fa = L.fa; if (!fa) return;
  inFace(() => {
  if (fa === 'f_gems') [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) { const px = s * ex + s * (-rx * 0.4 + i * rx * 0.45), py = ey + ry + 1.5 + Math.sin(i * 1.1) * 0.5 - (i === 3 ? 1 : 0); c.fillStyle = ['#bff4ff', '#ffffff', '#e0c8ff', '#bff4ff'][i]; c.beginPath(); c.moveTo(px, py - 0.9); c.lineTo(px + 0.7, py); c.lineTo(px, py + 0.9); c.lineTo(px - 0.7, py); c.closePath(); c.fill(); if (Math.sin(t / 7 + i + s) > 0.6) rxStar4(c, px, py, 1.3, 'rgba(255,255,255,.9)'); } });
  else if (fa === 'f_hearts') [-1, 1].forEach(s => { rxHeart(c, s * 9.6, -97, 1, '#ff4a8a'); rxHeart(c, s * 10.2, -94.4, 0.65, '#ff8ab8'); });
  else if (fa === 'f_stars') [[-10.4, -98.6, 1.2], [-9.4, -95.6, 0.8], [10.4, -99, 1.05], [9.4, -95.4, 0.7], [-8, -110, 0.8]].forEach((p, i) => rxStar4(c, p[0], p[1], p[2] * (0.75 + 0.25 * Math.sin(t / 8 + i)), i % 2 ? '#fff6c0' : '#ffd23f'));
  else if (fa === 'f_freck') { c.fillStyle = 'rgba(140,80,40,.55)'; [[-2.6, -96.4], [-4.4, -95.6], [-6.4, -95.8], [-5.4, -94.2], [-8.2, -95.2], [2.6, -96.4], [4.4, -95.6], [6.4, -95.8], [5.4, -94.2], [8.2, -95.2], [-1, -97.6], [1, -97.6]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 0.42, 0, 7); c.fill(); }); }
  else if (fa === 'f_bfly') { const cx = -10.2, cy = -99.6, fl = 0.85 + 0.15 * Math.sin(t / 6); c.save(); c.translate(cx, cy); c.rotate(-0.4); [-1, 1].forEach(s => { c.save(); c.scale(s * fl, 1); c.fillStyle = '#9a6aff'; c.beginPath(); c.ellipse(1.6, -1, 1.8, 1.4, 0.4, 0, 7); c.fill(); c.fillStyle = '#ff7ab8'; c.beginPath(); c.ellipse(1.3, 1.2, 1.2, 1, -0.4, 0, 7); c.fill(); c.restore(); }); c.fillStyle = '#2a1a3a'; c.fillRect(-0.2, -1.8, 0.4, 3.6); c.restore(); }
  else if (fa === 'f_moon') { c.strokeStyle = '#eef2ff'; c.lineWidth = 1.1 * k; c.lineCap = 'round'; c.beginPath(); c.arc(-10.4, -100.6, 1.9, Math.PI * 0.55, Math.PI * 1.7); c.stroke(); [[-8.6, -104, 0.7], [-11, -96.8, 0.6], [-8.4, -98.4, 0.5]].forEach((p, i) => rxStar4(c, p[0], p[1], p[2] * (0.8 + 0.3 * Math.sin(t / 7 + i)), '#eef2ff')); }
  });
}
/* معاينة الكرت: وجه قريب بالمكياج */
function rmSalonCard(g, k) {
  const W = 54, H = 66; g.save(); const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fff0f6'); bg.addColorStop(1, '#ffd6e8'); g.fillStyle = bg; g.fillRect(0, 0, W, H); g.beginPath(); g.rect(0, 0, W, H); g.clip();
  const my = RM.me && RM.me.av ? RM.me.av : RX_FACE_AV;   /* الكرت يبين المكياج على وجه شخصيتك انت */ window.AVT_SL = k[0] === 's' ? { sl: k, fa: '' } : { sl: '', fa: k };
  try { AVT.drawAt(g, my, 27, 36 + 102 * 1.62, 137 * 1.62, { t: RM.T }); } catch (e) {} window.AVT_SL = null; g.restore();
}
let RX_FACE_AV = null;
try { RX_FACE_AV = AVT.norm(Object.assign({}, AVT.DEF, { g: 'f', hs: 'wavy', hc: 'dbrown', sk: 'fair', mk: [0, 0, 0, 0, 1, 0] })); } catch (e) { RX_FACE_AV = AVT.DEF; }
/* نخلي الرسم يعرف منو ينرسم هسه (حتى مكياجه يطلع بوجهه) */
const rxDm0 = rmDrawMe0; rmDrawMe0 = function (c, st) { window.AVT_SL = rxSlOf(RM.me, true); try { return rxDm0(c, st); } finally { window.AVT_SL = null; } };
const rxDo0 = rmDrawOther0; rmDrawOther0 = function (c, o) { window.AVT_SL = rxSlOf(o, false); try { return rxDo0(c, o); } finally { window.AVT_SL = null; } };

/* =====================================================================
   يمين المنتجع: الرمل يخلص ← شارع مشاة ← ساحة فندق بابيت
   ===================================================================== */
const RX_ST = { x0: 3330, x1: 3470 }, RX_PLZ = 3470;
function rxRightGround(c) {
  if (!rxVis(RX_ST.x0 - 20, 4760)) return; const T = RM.T, Y1 = RM_SAND, a = Math.max(RX_ST.x0, RM.v0), b = Math.min(4760, RM.v1);
  // حافة الرمل (ظل خفيف)
  c.fillStyle = 'rgba(120,85,45,.25)'; c.fillRect(RX_ST.x0 - 8, 200, 8, Y1 - 206);
  // شارع المشاة: بلاط حجري متداخل
  if (rxVis(RX_ST.x0, RX_ST.x1)) {
    const x0 = RX_ST.x0, w = RX_ST.x1 - RX_ST.x0; let g = c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#cfc6b8'); g.addColorStop(0.5, '#ddd5c8'); g.addColorStop(1, '#cfc6b8'); c.fillStyle = g; c.fillRect(x0, 200, w, Y1 - 206);
    const y0 = Math.max(200, Math.floor((RM.vy0 - 200) / 16) * 16 + 200), y1 = Math.min(Y1 - 6, RM.vy1);
    c.strokeStyle = 'rgba(110,95,80,.35)'; c.lineWidth = 1; c.beginPath(); for (let y = y0; y < y1; y += 16) { c.moveTo(x0, y); c.lineTo(x0 + w, y); const off = ((y / 16) % 2) * 14; for (let x = x0 + off; x < x0 + w; x += 28) { c.moveTo(x, y); c.lineTo(x, y + 16); } } c.stroke();
    c.fillStyle = '#9a9286'; c.fillRect(x0 - 4, 200, 4, Y1 - 206); c.fillRect(x0 + w, 200, 4, Y1 - 206);
    // خط أصفر للمكفوفين بالنص
    c.fillStyle = 'rgba(255,210,63,.55)'; c.fillRect(x0 + w / 2 - 6, 214, 12, Y1 - 226); c.fillStyle = 'rgba(170,130,20,.45)'; for (let y = y0; y < y1; y += 8) c.fillRect(x0 + w / 2 - 4, y, 8, 2);
  }
  // ساحة الفندق: رخام فاتح بنفسجي/كريمي
  if (b > RX_PLZ) {
    const x0 = Math.max(RX_PLZ + 4, a); let g = c.createLinearGradient(0, 210, 0, Y1); g.addColorStop(0, '#efe8f6'); g.addColorStop(1, '#ddd2ea'); c.fillStyle = g; c.fillRect(x0, 210, b - x0, Y1 - 216);
    const S = 56, ty0 = Math.max(214, RM.vy0), ty1 = Math.min(Y1 - 6, RM.vy1); c.fillStyle = 'rgba(150,110,200,.12)';
    for (let y = 214 + Math.floor((ty0 - 214) / S) * S; y < ty1; y += S) for (let x = RX_PLZ + 4 + Math.floor((x0 - RX_PLZ - 4) / S) * S; x < b; x += S) if (((x - RX_PLZ) / S + (y - 214) / S) % 2 < 1) c.fillRect(x, y, S, S);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; c.beginPath(); for (let x = RX_PLZ + 4 + Math.floor((x0 - RX_PLZ - 4) / S) * S; x < b; x += S) { c.moveTo(x, ty0); c.lineTo(x, ty1); } for (let y = 214 + Math.floor((ty0 - 214) / S) * S; y < ty1; y += S) { c.moveTo(x0, y); c.lineTo(b, y); } c.stroke();
    // درابزين الكورنيش على البحر
    c.fillStyle = '#f4f0fa'; c.fillRect(x0, 206, b - x0, 7); c.fillStyle = '#b9a6d6'; c.fillRect(x0, 213, b - x0, 2); c.fillStyle = '#fff'; for (let x = RX_PLZ + 10 + Math.floor((x0 - RX_PLZ) / 22) * 22; x < b; x += 22) c.fillRect(x, 196, 4, 12); c.fillStyle = '#e8e0f4'; c.fillRect(x0, 194, b - x0, 4);
    // سجادة بنفسجية من الفندق للشارع
    if (rxVis(4060, 4180)) { g = c.createLinearGradient(0, 600, 0, 760); g.addColorStop(0, '#7a2ad8'); g.addColorStop(1, '#5a1aa8'); c.fillStyle = g; c.beginPath(); c.moveTo(4080, 600); c.lineTo(4160, 600); c.lineTo(4172, 760); c.lineTo(4068, 760); c.closePath(); c.fill(); c.fillStyle = '#ffd76a'; c.fillRect(4080, 600, 3, 160); c.fillRect(4157, 600, 3, 160); }
  }
}
/* لافتة شارع المشاة + أعمدة تمنع السيارات */
function rxStreetSign(c) {
  if (!rxVis(RX_ST.x0 - 40, RX_ST.x1 + 40)) return; const x = (RX_ST.x0 + RX_ST.x1) / 2, y = 662;
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 2, 18, 4, 0, 0, 7); c.fill(); c.fillStyle = '#4a4f5a'; c.fillRect(x - 2, y - 92, 4, 92);
  rxRect(c, x - 44, y - 118, 88, 30, 6, '#1f7a4a'); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x - 41, y - 115, 82, 24); rxTxt(c, '🚶 شارع المشاة', x, y - 103, 'bold 11px Cairo, Arial', '#fff');
  rxRect(c, x - 26, y - 84, 52, 18, 5, '#fff'); rxTxt(c, '🚫🚗', x, y - 75, '10px sans-serif', '#000');
}
function rxBollards(L) { if (!rxVis(RX_ST.x0 - 20, RX_ST.x1 + 20)) return; for (let y = 260; y < RM_SAND - 20; y += 110) [RX_ST.x0 + 4, RX_ST.x1 - 4].forEach(x => { if (y < RM.vy0 - 30 || y > RM.vy1 + 30) return; L.push([y, c => { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 1, 6, 2, 0, 0, 7); c.fill(); c.fillStyle = '#3a3f48'; c.fillRect(x - 3, y - 20, 6, 20); c.fillStyle = '#ffd23f'; c.fillRect(x - 3, y - 15, 6, 3); c.beginPath(); c.arc(x, y - 20, 3, Math.PI, 0); c.fillStyle = '#3a3f48'; c.fill(); }]); }); }

/* =====================================================================
   صالون ملاذ 💇‍♀️ — للبنات، مكياج احترافي وكلشي يخص الصالون
   ===================================================================== */
const RX_SAL = { x: 3130, y: 560 }, RX_SALHI = { x0: 49000, x1: 49440, dx: 49220, vx0: 48985, vx1: 49455, vy0: 120, vy1: 632 };
const RX_MLZ_AV = (() => { try { return AVT.norm(Object.assign({}, AVT.DEF, { g: 'f', hs: 'wavys', hc: 'burgundy', sk: 'fair', ey: 3, mk: [11, 13, 3, 3, 3, 1], o: 'f_par1' })); } catch (e) { return AVT.DEF; } })();
const RX_SALPAL = { wall: '#fde8f1', wall2: '#f6cfe0', rg: '#d8a48f', rg2: '#b97a68', deep: '#8a3a6a', neon: '#ff5ca8' };
function rxBulbs(c, x, y, w, h, T, n) { const per = 2 * (w + h), k = n || 14; for (let i = 0; i < k; i++) { let d = i / k * per, px, py; if (d < w) { px = x + d; py = y; } else if (d < w + h) { px = x + w; py = y + d - w; } else if (d < 2 * w + h) { px = x + w - (d - w - h); py = y + h; } else { px = x; py = y + h - (d - 2 * w - h); } const on = (Math.floor(T / 10) + i) % 4 !== 0; c.fillStyle = on ? '#fffbe6' : '#f0d8a0'; c.beginPath(); c.arc(px, py, 2.4, 0, 7); c.fill(); if (on) { c.fillStyle = 'rgba(255,240,180,.35)'; c.beginPath(); c.arc(px, py, 4.6, 0, 7); c.fill(); } } }
function rxSalChair(c, x, y, s, T, back) {   // كرسي صالون (هيدروليك)
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, 2, 18, 5, 0, 0, 7); c.fill();
  c.fillStyle = '#c8ccd6'; c.beginPath(); c.ellipse(0, 0, 13, 4, 0, 0, 7); c.fill(); c.fillStyle = '#9aa0ae'; c.fillRect(-2.5, -16, 5, 16);
  const g = c.createLinearGradient(-14, -40, 14, -14); g.addColorStop(0, '#ff7ab8'); g.addColorStop(1, '#c42a72'); c.fillStyle = g; rxRect(c, -15, -24, 30, 9, 4, g); if (back) rxRect(c, -13, -52, 26, 30, 8, g);
  c.fillStyle = '#e8d0dc'; c.fillRect(-17, -27, 5, 3); c.fillRect(12, -27, 5, 3); c.restore();
}
function rxSalWin(c, wx, wy, ww, wh, side) {
  const T = RM.T; c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
  let g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#fff3f8'); g.addColorStop(0.68, '#fde0ee'); g.addColorStop(0.69, '#f4d6c8'); g.addColorStop(1, '#e8bfae'); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
  if (side === 0) { [0.3, 0.75].forEach((u, i) => { const mx = wx + ww * u; rxRect(c, mx - 14, wy + 10, 28, 34, 10, '#fff'); g = c.createLinearGradient(mx - 10, wy + 12, mx + 10, wy + 40); g.addColorStop(0, '#eaf4ff'); g.addColorStop(1, '#c8dcef'); rxRect(c, mx - 11, wy + 13, 22, 28, 8, g); rxBulbs(c, mx - 15, wy + 9, 30, 36, T + i * 7, 12); rxSalChair(c, mx, wy + wh - 8, 0.7, T, 1); }); }
  else { // سشوار القبة + الكاونتر
    const dx = wx + ww * 0.3; c.fillStyle = '#e8e4f0'; c.beginPath(); c.ellipse(dx, wy + 30, 16, 13, 0, Math.PI, 0); c.fill(); c.fillStyle = '#c8c0d8'; c.fillRect(dx - 16, wy + 30, 32, 4); c.fillStyle = '#9aa0ae'; c.fillRect(dx - 2, wy + 34, 4, 26); rxSalChair(c, dx, wy + wh - 8, 0.7, T, 1);
    rxRect(c, wx + ww * 0.58, wy + wh - 30, ww * 0.4, 22, 4, '#d8a48f'); c.font = '9px sans-serif'; c.textAlign = 'center'; ['💄', '💅', '🧴', '🌸'].forEach((e, i) => c.fillText(e, wx + ww * 0.62 + i * 10, wy + wh - 32));
    rxNpc(c, RX_MLZ_AV, wx + ww * 0.78, wy + wh - 22, -1, { dance: 0 }); }
  rmWinPeople(c, 5, RX_SALHI, wx, wy, ww, wh, side, 'rgba(140,40,90,.5)');
  c.restore();
  c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip(); c.fillStyle = 'rgba(255,230,245,.12)'; c.fillRect(wx, wy, ww, wh); c.fillStyle = 'rgba(255,255,255,.4)'; const sh = ((T * 0.6 + 90) % (ww + 160)) - 80; c.beginPath(); c.moveTo(wx + sh, wy); c.lineTo(wx + sh + 16, wy); c.lineTo(wx + sh - 24, wy + wh); c.lineTo(wx + sh - 40, wy + wh); c.closePath(); c.fill(); c.restore();
  c.strokeStyle = '#f6dcc8'; c.lineWidth = 3.5; c.strokeRect(wx, wy, ww, wh); c.strokeStyle = RX_SALPAL.rg2; c.lineWidth = 1.5; c.strokeRect(wx - 2, wy - 2, ww + 4, wh + 4); c.fillStyle = '#f6dcc8'; c.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
}
function rxSalOut(c) {
  const X = RX_SAL.x, Y = RX_SAL.y; if (!rxVis(X - 190, X + 190)) return; const x0 = X - 155, x1 = X + 155, top = 402, T = RM.T, m = RM.me;
  const near = Math.hypot(m.x - X, (m.y - Y - 14) * 1.3) < 80 || Object.values(RM.others).some(o => rmShopId(o) === 0 && Math.hypot(o.x - X, (o.y - Y - 14) * 1.3) < 70);
  RX.salDoor = (RX.salDoor || 0) + ((near ? 1 : 0) - (RX.salDoor || 0)) * 0.12; if (near && !RX.salNear && !rmInShop()) rxSnd([['sine', 1319, 1319, 0.22, 0.05], ['sine', 1760, 1760, 0.3, 0.04, 0.12]]); RX.salNear = near;
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(X, Y + 3, 178, 13, 0, 0, 7); c.fill();
  let g = c.createLinearGradient(0, top, 0, Y); g.addColorStop(0, '#fff6f0'); g.addColorStop(1, '#f4d4c6'); c.fillStyle = g; c.fillRect(x0, top, 310, Y - top);
  c.strokeStyle = 'rgba(216,164,143,.35)'; c.lineWidth = 1; for (let x = x0 + 10; x < x1; x += 20) { c.beginPath(); c.moveTo(x, top); c.lineTo(x, Y - 14); c.stroke(); }
  c.strokeStyle = RX_SALPAL.rg2; c.lineWidth = 2; c.strokeRect(x0, top, 310, Y - top);
  g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#b97a68'); g.addColorStop(0.5, '#f0c8b4'); g.addColorStop(1, '#b97a68'); c.fillStyle = g; c.fillRect(x0 - 5, Y - 14, 320, 14); c.fillStyle = '#fff'; c.fillRect(x0 - 5, Y - 14, 320, 2);
  c.fillStyle = g; c.fillRect(x0 - 10, top - 14, 330, 16); c.fillStyle = '#ffe9dc'; c.fillRect(x0 - 10, top - 2, 330, 2); c.fillStyle = '#8a4a3a'; c.fillRect(X - 3, top - 46, 6, 34);
  // اللافتة: ذهبي وردي + نيون
  const sx0 = X - 145, sy0 = top - 96, sw = 290, shh = 60; g = c.createLinearGradient(sx0, 0, sx0 + sw, 0); g.addColorStop(0, '#2a0f24'); g.addColorStop(0.5, '#4a1a3a'); g.addColorStop(1, '#2a0f24'); c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(sx0, sy0, sw, shh, 16) : c.rect(sx0, sy0, sw, shh); c.fill(); c.strokeStyle = '#e8b8a0'; c.lineWidth = 3; c.stroke();
  const fl = 0.85 + 0.15 * Math.sin(T / 6); rxTxt(c, 'صالون ملاذ 💇‍♀️', X, sy0 + 24, 'bold 21px Lalezar, Cairo, system-ui, Arial', '#ffe6f2', 14 * fl, '#ff5ca8'); rxTxt(c, '💄 مكياج احترافي • للبنات فقط 🎀', X, sy0 + 46, 'bold 10.5px Cairo, Arial', '#f6c8b0', 6, '#ff5ca8');
  for (let i = 0; i < 20; i++) { const lx = sx0 + 10 + i / 19 * (sw - 20), on = (Math.floor(T / 8) + i) % 3 !== 0; c.fillStyle = on ? '#ffd1e6' : 'rgba(255,200,230,.35)'; c.beginPath(); c.arc(lx, sy0 + 5, 1.8, 0, 7); c.arc(lx, sy0 + shh - 5, 1.8, 0, 7); c.fill(); }
  c.save(); c.translate(sx0 + 18, sy0 + shh / 2); c.font = '18px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('💅', 0, 0); c.fillText('💋', sw - 36, 0); c.restore();
  // مظلة روز جولد مموجة
  const aw = top + 2; for (let i = 0; i < 11; i++) { const ax = x0 - 10 + i * 30; c.fillStyle = i % 2 ? '#fff4ee' : '#e8a8a0'; c.fillRect(ax, aw, 30, 18); c.beginPath(); c.arc(ax + 15, aw + 18, 15, 0, Math.PI); c.fill(); }
  c.fillStyle = '#d8a48f'; for (let i = 0; i < 11; i++) { c.beginPath(); c.arc(x0 + 5 + i * 30, aw + 33, 2.2, 0, 7); c.fill(); }
  rxSalWin(c, x0 + 14, 448, X - 44 - (x0 + 14), 92, 0); rxSalWin(c, X + 44, 448, x1 - 14 - (X + 44), 92, 1);
  const dx0 = X - 32, dy0 = 448, dw = 64, dh = Y - 14 - dy0, op = RX.salDoor;
  c.fillStyle = '#5a2a2a'; c.fillRect(dx0, dy0, dw, dh); g = c.createLinearGradient(0, dy0, 0, dy0 + dh); g.addColorStop(0, '#fff6f0'); g.addColorStop(1, '#f0c8b8'); c.fillStyle = g; c.fillRect(dx0 + 3, dy0 + 3, dw - 6, dh - 3);
  [-1, 1].forEach(sd => { const pw = dw / 2 - 2, slide = op * (pw - 6), px = sd < 0 ? dx0 + 2 - slide : X + slide; c.save(); c.beginPath(); c.rect(dx0 - 30, dy0, dw + 60, dh); c.clip(); c.fillStyle = 'rgba(255,235,230,.5)'; c.fillRect(px, dy0 + 2, pw, dh - 2); c.strokeStyle = '#e8c0a8'; c.lineWidth = 2.6; c.strokeRect(px, dy0 + 2, pw, dh - 2); c.fillStyle = '#b97a68'; c.fillRect(sd < 0 ? px + pw - 6 : px + 3, dy0 + dh * 0.45, 3, 14); c.restore(); });
  c.strokeStyle = RX_SALPAL.rg2; c.lineWidth = 3; c.strokeRect(dx0, dy0, dw, dh);
  if (op < 0.5) { c.save(); c.translate(X, dy0 + 22); c.rotate(Math.sin(T / 25) * 0.06); rxRect(c, -21, -8, 42, 14, 6, '#fff'); rxTxt(c, 'مفتوح 💖', 0, -1, 'bold 8px Cairo, Arial', '#c42a72'); c.restore(); }
  // عمود الصالون الدوّار
  [x0 - 4, x1 + 4].forEach((px, i) => { c.fillStyle = '#e8c0a8'; c.fillRect(px - 5, 450, 10, 6); c.fillRect(px - 5, 510, 10, 6); c.save(); c.beginPath(); c.rect(px - 4, 456, 8, 54); c.clip(); c.fillStyle = '#fff'; c.fillRect(px - 4, 456, 8, 54); c.fillStyle = '#ff5ca8'; for (let k = -2; k < 10; k++) { const yy = 456 + ((k * 12 + T * 0.4) % 66) - 6; c.beginPath(); c.moveTo(px - 4, yy); c.lineTo(px + 4, yy - 6); c.lineTo(px + 4, yy - 2); c.lineTo(px - 4, yy + 4); c.closePath(); c.fill(); } c.restore(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(px - 3, 456, 2, 54); });
  // سجادة + أصص ورد أبيض
  c.fillStyle = '#e8a8a0'; c.beginPath(); c.moveTo(X - 26, Y - 1); c.lineTo(X + 26, Y - 1); c.lineTo(X + 34, Y + 26); c.lineTo(X - 34, Y + 26); c.closePath(); c.fill(); rxTxt(c, 'ملاذ', X, Y + 13, 'bold 9px Cairo, Arial', '#fff');
  [x0 - 22, x1 + 22].forEach(px => { c.fillStyle = '#d8a48f'; c.beginPath(); c.moveTo(px - 10, Y - 16); c.lineTo(px + 10, Y - 16); c.lineTo(px + 7, Y); c.lineTo(px - 7, Y); c.closePath(); c.fill(); c.fillStyle = '#3fa34d'; c.beginPath(); c.arc(px, Y - 26, 12, 0, 7); c.arc(px - 8, Y - 20, 8, 0, 7); c.arc(px + 8, Y - 20, 8, 0, 7); c.fill(); ['#fff', '#ffd1e6', '#fff'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(px - 6 + i * 6, Y - 28 + (i % 2) * 6, 3, 0, 7); c.fill(); }); });
}
const rxNearSal = () => { const m = RM.me; return !rmInShop() && m.y >= RX_SAL.y - 6 && Math.hypot(m.x - RX_SAL.x, (m.y - RX_SAL.y - 14) * 1.3) < 62; };
const rxNearMlz = () => rmShopId() === 5 && RM.me.y < 470 && Math.abs(RM.me.x - RX.mlz.x) < 95;
const rxNearSalExit = () => rmShopId() === 5 && RM.me.y > 572 && Math.abs(RM.me.x - RX_SALHI.dx) < 60;
function rmMlzSay(t, d) { rxSay(RX.mlz, t, d); }
function rxSalEnter() {
  const m = RM.me; if (m.sit || m.jump) return; if (RM.holds[rmMe()] && !RM.holdLead[rmMe()]) rmSend({ t: 'rm_hold', on: 0 }); if (m.dance) rmSetDance(0); RM.tapMk = null; RM.hold = false;
  m.x = m.tx = RX_SALHI.dx + (Math.random() - 0.5) * 60; m.y = m.ty = 592; m.dir = 1; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1; rxSnd([['sine', 1568, 1568, 0.25, 0.05], ['sine', 2093, 2093, 0.3, 0.05, 0.12], ['triangle', 2637, 2637, 0.4, 0.03, 0.24]]);
  const n = Object.values(RM.others).filter(o => rmShopId(o) === 5 && !o.hid); showToast('💇‍♀️ دخلتي «صالون ملاذ» 💄' + (n.length ? ' — جوّه: ' + n.slice(0, 3).map(o => o.name).join('، ') : ''));
  setTimeout(() => { if (rmShopId() === 5) { RX.mlz.wave = 90; rmMlzSay('يا هلا بالقمر ' + rmMe() + '! 💖 أنا ملاذ، تعالي أسويلج مكياج احترافي ما شفتيه قبل ✨'); } }, 450); rmPrompt(true);
}
function rxSalExit() { const m = RM.me; if (m.jump) return; RM.tapMk = null; RM.hold = false; RX.slTry = ''; m.x = m.tx = RX_SAL.x + (Math.random() - 0.5) * 50; m.y = m.ty = RX_SAL.y + 30; m.dir = 1; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1; rxSnd([['sine', 1568, 2093, 0.3, 0.05]]); rxSalClose(); showToast('🌸 طلعتي من صالون ملاذ' + (RM.me.wear && (RM.me.wear.sl || RM.me.wear.fa) ? ' وتطلعين قمر 💖' : '')); rmPrompt(true); }
/* ---- داخل الصالون ---- */
function rxSalBg(c) {
  const H = RX_SALHI, X0 = H.vx0, X1 = H.vx1, W = X1 - X0, T = RM.T;
  let g = c.createLinearGradient(0, 120, 0, 344); g.addColorStop(0, '#fbe3ee'); g.addColorStop(1, '#fff3f8'); c.fillStyle = g; c.fillRect(X0, 120, W, 224);
  c.strokeStyle = 'rgba(216,164,143,.3)'; c.lineWidth = 1; for (let x = X0 + 8; x < X1; x += 24) { c.beginPath(); c.moveTo(x, 134); c.lineTo(x, 300); c.stroke(); }   // ورق جدران مقلم ناعم
  c.fillStyle = '#b97a68'; c.fillRect(X0, 120, W, 12); c.fillStyle = '#f0c8b4'; c.fillRect(X0, 131, W, 3);
  // نيون «ملاذ»
  const fl = 0.85 + 0.15 * Math.sin(T / 5); rxTxt(c, 'Malath ♡ ملاذ', 49220, 162, 'bold 24px Lalezar, Cairo, system-ui, Arial', '#fff', 16 * fl, '#ff5ca8'); rxTxt(c, '💄 Beauty Salon • صالون تجميل 💅', 49220, 186, 'bold 11px Cairo, Arial', '#c42a72');
  // محطات المرايا الهوليوودية
  [49050, 49140, 49230].forEach((mx, i) => { rxRect(c, mx - 30, 204, 60, 76, 10, '#fff'); g = c.createLinearGradient(mx - 24, 210, mx + 24, 274); g.addColorStop(0, '#f2f8ff'); g.addColorStop(0.5, '#d4e4f4'); g.addColorStop(1, '#f2f8ff'); rxRect(c, mx - 24, 210, 48, 64, 8, g); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(mx - 18, 214); c.lineTo(mx - 6, 214); c.lineTo(mx - 20, 262); c.lineTo(mx - 24, 262); c.closePath(); c.fill(); rxBulbs(c, mx - 31, 203, 62, 78, T + i * 5, 18);
    rxRect(c, mx - 34, 292, 68, 10, 3, '#d8a48f'); c.fillStyle = '#b97a68'; c.fillRect(mx - 34, 300, 68, 3); c.font = '9px sans-serif'; c.textAlign = 'center'; ['💄', '🧴', '💅'].forEach((e, j) => c.fillText(e, mx - 20 + j * 20, 290)); });
  // رف عطور ومنتجات
  c.fillStyle = '#fff'; c.fillRect(49290, 214, 140, 5); c.fillRect(49290, 254, 140, 5); c.fillStyle = '#e8c8d8'; c.fillRect(49290, 219, 140, 2); c.fillRect(49290, 259, 140, 2);
  ['#ff9ec7', '#c9a2ff', '#ffd23f', '#7ad0ff', '#ff7a8a', '#9ae0b0'].forEach((col, i) => { const bx = 49300 + i * 22; rxRect(c, bx, 196, 10, 18, 3, col); c.fillStyle = '#d7a400'; c.fillRect(bx + 3, 192, 4, 4); rxRect(c, bx - 1, 238, 12, 16, 5, i % 2 ? '#fff' : col); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(bx + 2, 199, 2, 10); });
  rxTxt(c, 'عطور ومنتجات 🌸', 49360, 276, 'bold 9px Cairo, Arial', '#b97a68');
  c.fillStyle = '#fff'; c.fillRect(X0, 300, W, 44); c.strokeStyle = '#f6dcc8'; c.lineWidth = 1.5; for (let x = X0 + 8; x < X1 - 30; x += 46) c.strokeRect(x, 306, 38, 32); c.fillStyle = '#d8a48f'; c.fillRect(X0, 340, W, 4);
  // أرضية رخام فاتح
  g = c.createLinearGradient(0, 344, 0, 632); g.addColorStop(0, '#f6ece8'); g.addColorStop(1, '#ead6d0'); c.fillStyle = g; c.fillRect(X0, 344, W, 288);
  c.strokeStyle = 'rgba(190,150,140,.25)'; c.lineWidth = 0.8; for (let i = 0; i < 10; i++) { c.beginPath(); c.moveTo(X0 + i * 53, 350); c.bezierCurveTo(X0 + i * 53 + 30, 420, X0 + i * 53 - 20, 520, X0 + i * 53 + 24, 630); c.stroke(); }
  for (let x = X0; x < X1; x += 48) for (let y = 344; y < 632; y += 48) if (((x - X0) / 48 + (y - 344) / 48) % 2 < 1) { c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x, y, 48, 48); }
  // سجادة دائرية
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(49200, 528, 112, 40, 0, 0, 7); c.fill(); c.fillStyle = '#f4c4c8'; c.beginPath(); c.ellipse(49200, 528, 100, 34, 0, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(49200, 528, 80, 26, 0, 0, 7); c.stroke();
  // ثريا كريستال
  [49110, 49330].forEach(lx => { c.strokeStyle = '#d7a400'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx, 132); c.lineTo(lx, 146); c.stroke(); for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI, px = lx + Math.cos(a) * 16, py = 150 + Math.sin(a) * 7; c.fillStyle = 'rgba(255,255,255,' + (0.6 + 0.4 * Math.sin(T / 10 + i)) + ')'; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 2.4, py + 6); c.lineTo(px, py + 11); c.lineTo(px + 2.4, py + 6); c.closePath(); c.fill(); } g = c.createRadialGradient(lx, 154, 4, lx, 154, 110); g.addColorStop(0, 'rgba(255,235,245,.45)'); g.addColorStop(1, 'rgba(255,235,245,0)'); c.fillStyle = g; c.beginPath(); c.arc(lx, 154, 110, 0, 7); c.fill(); });
  // ملاذ ورا الكاونتر
  const near = rxNearMlz(), Mz = RX.mlz; if (near && !Mz.near) { Mz.wave = 70; if (!Mz.say || Mz.say.t <= 0) rmMlzSay('هلا حبيبتي 💖 دوسي عليّ وأختارلج لوك يجنن 💄', 240); } Mz.near = near;
  if (near && (!Mz.say || Mz.say.t <= 0) && ++Mz.idleT > 520) { Mz.idleT = 0; rmMlzSay(['لوك العروس ناعم ويخبل 🤍', 'هوليوود مع الأحمر = نجمة سينما 💋', 'جربي اللوك قبل لا تشترين، يطلع على وجهج بالمراية 🪞', 'كريستال تحت العين موضة هالسنة 💎', 'الدولارات من الصيد، 15 سمكة = دولارين 🎣💵', 'الصالون للبنات بس 🎀'][Math.floor(Math.random() * 6)]); }
  if (Mz.wave > 0) Mz.wave--; rxNpc(c, RX_MLZ_AV, Mz.x, Mz.y, -1, { dance: Mz.wave > 0 ? 1 : 0, dt: RM.T });
  g = c.createLinearGradient(0, 368, 0, 414); g.addColorStop(0, '#f6dcc8'); g.addColorStop(1, '#d8a48f'); c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(49300, 368, 136, 46, 8) : c.rect(49300, 368, 136, 46); c.fill(); c.fillStyle = '#fff'; c.fillRect(49296, 362, 144, 9); c.strokeStyle = '#b97a68'; c.lineWidth = 1.5; c.strokeRect(49296, 362, 144, 9);
  c.font = '11px sans-serif'; c.textAlign = 'center'; ['💄', '💋', '💅', '🌸', '✨'].forEach((e, i) => c.fillText(e, 49314 + i * 27, 392));
  rmTagDraw(c, Mz.x, Mz.y - 112, 'ملاذ 💇‍♀️ صاحبة الصالون', 'rgba(185,90,120,.95)');
}
const RX_SAL_SEATS = [[49050, 452], [49140, 452], [49230, 452]];
function rxSalList() {
  const T = RM.T, L = [];
  RX_SAL_SEATS.forEach(p => L.push([p[1] - 2, c => rxSalChair(c, p[0], p[1], 1, T, 1)]));
  // سشوار قبة + طاولة أظافر + نبتة
  L.push([560, c => { const x = 49060, y = 560; rxSalChair(c, x, y, 1, T, 1); c.fillStyle = '#9aa0ae'; c.fillRect(x + 20, y - 80, 4, 80); c.fillStyle = '#efeaf6'; c.beginPath(); c.ellipse(x + 8, y - 80, 22, 16, -0.2, Math.PI, 0); c.fill(); c.fillStyle = '#c8c0d8'; c.fillRect(x - 14, y - 80, 44, 4); rmTagDraw(c, x, y + 14, '💨 سشوار', 'rgba(185,90,120,.9)'); }]);
  L.push([575, c => { const x = 49380, y = 575; c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x, y + 2, 40, 6, 0, 0, 7); c.fill(); rxRect(c, x - 38, y - 30, 76, 8, 3, '#fff'); c.fillStyle = '#d8a48f'; c.fillRect(x - 34, y - 22, 4, 22); c.fillRect(x + 30, y - 22, 4, 22); ['#ff3d7f', '#c9a2ff', '#ff9a3a', '#3ddc84', '#4aa8ff', '#ffd23f', '#222'].forEach((col, i) => { rxRect(c, x - 30 + i * 9, y - 40, 6, 10, 2, col); c.fillStyle = '#333'; c.fillRect(x - 29 + i * 9, y - 44, 4, 4); }); rmTagDraw(c, x, y + 14, '💅 ركن الأظافر', 'rgba(185,90,120,.9)'); }]);
  L.push([600, c => { const x = 49430, y = 600; c.fillStyle = '#d8a48f'; c.beginPath(); c.moveTo(x - 12, y - 18); c.lineTo(x + 12, y - 18); c.lineTo(x + 8, y); c.lineTo(x - 8, y); c.closePath(); c.fill(); c.fillStyle = '#3fa34d'; c.beginPath(); c.arc(x, y - 30, 14, 0, 7); c.arc(x - 9, y - 22, 9, 0, 7); c.arc(x + 9, y - 22, 9, 0, 7); c.fill(); }]);
  return L;
}
function rxSalFg(c) {
  const H = RX_SALHI, X0 = H.vx0, X1 = H.vx1, D = H.dx;
  c.fillStyle = '#b97a68'; c.fillRect(X0, 612, D - 46 - X0, 20); c.fillRect(D + 46, 612, X1 - D - 46, 20); c.fillStyle = '#f0c8b4'; c.fillRect(X0, 612, X1 - X0, 3);
  c.fillStyle = 'rgba(255,230,225,.5)'; c.fillRect(D - 46, 614, 92, 18); c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(D - 46, 614, 92, 18);
  rxRect(c, D - 34, 594, 68, 14, 4, '#c42a72'); rxTxt(c, '⬇ خروج', D, 601, 'bold 9px Cairo, Arial', '#fff');
  rmShopPeek(c, RX_SAL.x, RX_SALHI); rmSayDraw(c, RX.mlz.x, RX.mlz.y - 128, RX.mlz.say);
  if (RX.slTry) { c.save(); const z = RM.z || 1; c.restore(); }
}

/* =====================================================================
   فندق «بابيت» 🏨 — ضخم، بنفسجي ساطع، يضوي بالليل
   ===================================================================== */
const RX_HT = { x: 4120, y: 600, x0: 3600, x1: 4640, top: 70 }, RX_HL = { x0: 50000, x1: 50640, dx: 50320, vx0: 49985, vx1: 50655, vy0: 120, vy1: 632 };
const RX_HT_T = { 1: { n: 'غرفة لشخص واحد', ic: '👤', cap: 1, d: 'يومين', p: 25 }, 2: { n: 'غرفة لشخصين', ic: '👥', cap: 2, d: 'يومين', p: 40 }, 3: { n: 'جناح لـ3 أشخاص', ic: '👨‍👩‍👧', cap: 3, d: 'أسبوع', p: 90 } };
const RX_BAB_AV = (() => { try { return AVT.norm(Object.assign({}, AVT.DEF, { g: 'f', hs: 'xlong', hc: 'black', sk: 'light', ey: 5, esp: 1, mk: [12, 13, 3, 3, 3, 3], o: 'f_par5' })); } catch (e) { return AVT.DEF; } })();
const RX_ADM_I = 30;   // 👑 غرفة المشرفين (بابي وبابيتو) — دائماً متاحة إلهم
const RX_BATH_I = 31;  // 🛁 حمام المشرفين الملكي (بابه داخل غرفة المشرفين)
const rxRoomNo = i => i === RX_BATH_I ? '🛁 الحمام الملكي' : i === RX_ADM_I ? '👑 المشرفين' : (Math.floor(i / 10) + 1) * 100 + (i % 10) + 1;
const rxRoomIdx = x => Math.floor((x - 50950) / 700);
function rxRoomHI(i) { const x0 = 51000 + i * 700; return { x0, x1: x0 + 520, dx: x0 + 260, vx0: x0 - 15, vx1: x0 + 535, vy0: 120, vy1: 632, i }; }
function rmXShi(id, o) { if (id === 5) return RX_SALHI; if (id === 6) return RX_HL; return rxRoomHI(Math.max(0, Math.min(RX_BATH_I, rxRoomIdx((o || RM.me).x)))); }
Object.assign(RM_SHOP_NM, { 5: 'صالون ملاذ 💇‍♀️', 6: 'فندق بابيت 🏨', 7: 'غرفة بالفندق 🔑' });
function rxNight() { return RM.dn ? RM.dn.d : 0; }
function rxHotelOut(c) {
  const H = RX_HT, T = RM.T; if (!rxVis(H.x0 - 70, H.x1 + 70)) return; const d = rxNight(), X = H.x, Y = H.y;
  c.fillStyle = 'rgba(40,10,70,.22)'; c.beginPath(); c.ellipse(X, Y + 4, 560, 18, 0, 0, 7); c.fill();
  // الجناحين الجانبيين
  [[H.x0 - 60, H.x0], [H.x1, H.x1 + 60]].forEach(([a, b]) => { const g = c.createLinearGradient(a, 0, b, 0); g.addColorStop(0, '#3a1670'); g.addColorStop(1, '#4e2090'); c.fillStyle = g; c.fillRect(a, 300, b - a, Y - 300); c.fillStyle = '#ffd76a'; c.fillRect(a - 4, 294, b - a + 8, 6); for (let y = 320; y < Y - 30; y += 52) for (let x = a + 10; x < b - 14; x += 22) { const lit = d > 0.15 && rxH(x * 7 + y) > 0.4; c.fillStyle = lit ? '#e8b8ff' : '#2a1050'; c.fillRect(x, y, 14, 26); } });
  // البرج الرئيسي
  let g = c.createLinearGradient(0, H.top, 0, Y); g.addColorStop(0, '#5a24a8'); g.addColorStop(0.5, '#4a1a90'); g.addColorStop(1, '#341268'); c.fillStyle = g; c.fillRect(H.x0, H.top + 40, H.x1 - H.x0, Y - H.top - 40);
  g = c.createLinearGradient(H.x0, 0, H.x1, 0); g.addColorStop(0, 'rgba(0,0,0,.25)'); g.addColorStop(0.15, 'rgba(255,255,255,.06)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(0.85, 'rgba(255,255,255,.06)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = g; c.fillRect(H.x0, H.top + 40, H.x1 - H.x0, Y - H.top - 40);
  // التاج فوق + اللافتة
  c.fillStyle = '#2a0e58'; c.fillRect(H.x0 - 10, H.top + 30, H.x1 - H.x0 + 20, 14); c.fillStyle = '#ffd76a'; c.fillRect(H.x0 - 10, H.top + 42, H.x1 - H.x0 + 20, 3);
  c.fillStyle = '#3a1470'; c.beginPath(); c.moveTo(X - 300, H.top + 32); c.lineTo(X - 260, H.top - 30); c.lineTo(X + 260, H.top - 30); c.lineTo(X + 300, H.top + 32); c.closePath(); c.fill(); c.strokeStyle = '#ffd76a'; c.lineWidth = 2.5; c.stroke();
  c.strokeStyle = '#8a8fa0'; c.lineWidth = 3; c.beginPath(); c.moveTo(X, H.top - 30); c.lineTo(X, H.top - 66); c.stroke(); const bl = Math.floor(T / 25) % 2; c.fillStyle = bl ? '#ff3b6b' : '#7a1c37'; c.beginPath(); c.arc(X, H.top - 68, 4, 0, 7); c.fill();
  const neon = 0.75 + 0.25 * Math.sin(T / 7) + 0.25 * d; c.save(); try { c.direction = 'rtl'; } catch (e) {} c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 46px Lalezar, Cairo, system-ui, Arial'; c.shadowColor = '#d07aff'; c.shadowBlur = 18 * neon; c.lineWidth = 6; c.strokeStyle = 'rgba(110,30,200,.9)'; c.strokeText('فندق بابيت', X, H.top + 2); c.fillStyle = '#fbe9ff'; c.fillText('فندق بابيت', X, H.top + 2); c.restore();
  rxTxt(c, '✦ BABEET HOTEL ✦ ★★★★★', X, H.top + 37, 'bold 11px Cairo, Arial', '#ffd76a');
  // شرائط نيون عمودية بالزوايا
  [H.x0 + 4, H.x1 - 10].forEach(sx => { const gg = c.createLinearGradient(0, H.top + 50, 0, Y); const ph = (T % 120) / 120; gg.addColorStop(0, '#c070ff'); gg.addColorStop(Math.max(0, ph - 0.1), '#7a2ad8'); gg.addColorStop(ph, '#ffffff'); gg.addColorStop(Math.min(1, ph + 0.1), '#7a2ad8'); gg.addColorStop(1, '#c070ff'); c.fillStyle = gg; c.fillRect(sx, H.top + 50, 6, Y - H.top - 140); });
  // الشبابيك والبلكونات
  const rowY = [104, 158, 212, 266, 320, 374, 428], mn = Math.floor(Date.now() / 45000);
  for (let r = 0; r < rowY.length; r++) { const y = rowY[r]; if (y > RM.vy1 || y + 40 < RM.vy0) continue; for (let col = 0; col < 21; col++) { const x = H.x0 + 26 + col * 47.6; if (x < RM.v0 - 40 || x > RM.v1 + 10) continue; const lit = d > 0.12 && rxH(r * 97 + col * 13 + mn) > 0.38, warm = rxH(r * 7 + col * 3) > 0.7;
      c.fillStyle = '#2a0e58'; c.fillRect(x - 2, y - 2, 34, 42); if (lit) { const lg = c.createLinearGradient(0, y, 0, y + 38); lg.addColorStop(0, warm ? '#ffe0a8' : '#f0c8ff'); lg.addColorStop(1, warm ? '#ffb870' : '#b46aff'); c.fillStyle = lg; } else { const lg = c.createLinearGradient(x, y, x + 30, y + 38); lg.addColorStop(0, '#8ab4ff'); lg.addColorStop(0.5, '#4a5ab8'); lg.addColorStop(1, '#2a2a78'); c.fillStyle = lg; } c.fillRect(x, y, 30, 38);
      c.fillStyle = 'rgba(255,255,255,' + (lit ? 0.1 : 0.22) + ')'; c.beginPath(); c.moveTo(x + 4, y); c.lineTo(x + 12, y); c.lineTo(x + 2, y + 30); c.lineTo(x, y + 30); c.closePath(); c.fill(); c.fillStyle = '#ffd76a'; c.fillRect(x + 14, y, 2, 38);
      if (r % 2 === 1) { c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(x - 4, y + 34, 38, 3); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(x - 2 + k * 6.6, y + 37); c.lineTo(x - 2 + k * 6.6, y + 44); c.stroke(); } c.fillRect(x - 4, y + 44, 38, 2); } } }
  // واجهة اللوبي الزجاجية
  g = c.createLinearGradient(0, 470, 0, Y); g.addColorStop(0, d > 0.15 ? '#f6d8ff' : '#cfe0ff'); g.addColorStop(1, d > 0.15 ? '#c88aff' : '#8aa8e8'); c.fillStyle = g; c.fillRect(H.x0 + 20, 478, H.x1 - H.x0 - 40, Y - 478);
  c.fillStyle = '#ffd76a'; for (let x = H.x0 + 20; x <= H.x1 - 20; x += 52) c.fillRect(x, 478, 3, Y - 478); c.fillRect(H.x0 + 20, 476, H.x1 - H.x0 - 40, 4);
  if (rxVis(H.x0, H.x1)) { c.fillStyle = 'rgba(80,30,140,.35)'; [3700, 3800, 4440, 4540].forEach((px, i) => { c.beginPath(); c.ellipse(px, Y - 14, 6, 10, 0, 0, 7); c.fill(); c.beginPath(); c.arc(px, Y - 30, 5, 0, 7); c.fill(); }); }
  // المظلة الكبيرة + الأعمدة
  [4020, 4070, 4170, 4220].forEach(cx => { const cg = c.createLinearGradient(cx - 7, 0, cx + 7, 0); cg.addColorStop(0, '#d8d0e8'); cg.addColorStop(0.5, '#ffffff'); cg.addColorStop(1, '#c0b4d8'); c.fillStyle = cg; c.fillRect(cx - 7, 492, 14, Y - 492); c.fillStyle = '#ffd76a'; c.fillRect(cx - 9, 488, 18, 5); c.fillRect(cx - 9, Y - 6, 18, 6); });
  g = c.createLinearGradient(0, 452, 0, 494); g.addColorStop(0, '#9a3aff'); g.addColorStop(1, '#5a1aa8'); c.fillStyle = g; c.beginPath(); c.moveTo(3995, 494); c.lineTo(4010, 452); c.lineTo(4230, 452); c.lineTo(4245, 494); c.closePath(); c.fill();
  c.fillStyle = '#ffd76a'; c.fillRect(3995, 492, 250, 4); for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#7a2ad8' : '#b46aff'; c.beginPath(); c.arc(4005 + i * 21, 496, 10.5, 0, Math.PI); c.fill(); }
  rxTxt(c, '✦ فندق بابيت ✦', X, 472, 'bold 15px Lalezar, Cairo, Arial', '#fff3c4', 6, '#ffb8ff');
  // باب دوّار
  const dx0 = X - 40, dy0 = 506, dw = 80, dh = Y - dy0; c.fillStyle = '#2a0e58'; c.fillRect(dx0 - 4, dy0 - 4, dw + 8, dh + 4); g = c.createLinearGradient(0, dy0, 0, Y); g.addColorStop(0, '#fff2ff'); g.addColorStop(1, '#d8a8ff'); c.fillStyle = g; c.fillRect(dx0, dy0, dw, dh);
  for (let k = 0; k < 4; k++) { const a = T / 40 + k * Math.PI / 2, px = X + Math.cos(a) * 36; c.fillStyle = 'rgba(122,42,216,' + (0.25 + 0.25 * Math.abs(Math.sin(a))) + ')'; c.fillRect(Math.min(X, px), dy0 + 4, Math.max(3, Math.abs(px - X)), dh - 6); c.fillStyle = '#ffd76a'; c.fillRect(px - 1.5, dy0 + 4, 3, dh - 6); }
  c.fillStyle = '#ffd76a'; c.fillRect(X - 1.5, dy0, 3, dh); c.strokeStyle = '#ffd76a'; c.lineWidth = 3; c.strokeRect(dx0, dy0, dw, dh);
  // فوانيس ذهبية + أشجار مقصوصة
  [3990, 4250].forEach(px => { c.fillStyle = '#5a3a1a'; c.beginPath(); c.moveTo(px - 13, Y - 22); c.lineTo(px + 13, Y - 22); c.lineTo(px + 9, Y); c.lineTo(px - 9, Y); c.closePath(); c.fill(); c.fillStyle = '#ffd76a'; c.fillRect(px - 14, Y - 24, 28, 3); c.fillStyle = '#2f8a3a'; c.beginPath(); c.arc(px, Y - 40, 16, 0, 7); c.fill(); c.beginPath(); c.arc(px, Y - 64, 12, 0, 7); c.fill(); c.beginPath(); c.arc(px, Y - 82, 8, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(px - 5, Y - 45, 6, 0, 7); c.fill(); });
}
/* لوحة «استأجر غرفة» */
const RX_HBOARD = { x: 3930, y: 668 };
function rxHotelBoard(c) {
  const { x, y } = RX_HBOARD; if (!rxVis(x - 70, x + 70)) return; const T = RM.T;
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 2, 46, 6, 0, 0, 7); c.fill(); c.strokeStyle = '#5a3a1a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 30, y); c.lineTo(x - 18, y - 120); c.moveTo(x + 30, y); c.lineTo(x + 18, y - 120); c.moveTo(x, y); c.lineTo(x, y - 40); c.stroke();
  const bx = x - 56, by = y - 168, bw = 112, bh = 112; const g = c.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, '#7a2ad8'); g.addColorStop(1, '#4a1a90'); rxRect(c, bx, by, bw, bh, 10, g); c.strokeStyle = '#ffd76a'; c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(bx, by, bw, bh, 10) : c.rect(bx, by, bw, bh); c.stroke();
  rxTxt(c, '🔑 استأجر غرفة', x, by + 16, 'bold 13px Lalezar, Cairo, Arial', '#fff3c4', 4, '#d07aff');
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(bx + 8, by + 28, bw - 16, 1.5);
  [['👤 شخص • يومين', '25💵'], ['👥 شخصين • يومين', '40💵'], ['👨‍👩‍👧 3 • أسبوع', '90💵']].forEach((r, i) => { rxTxt(c, r[0], x + 10, by + 42 + i * 18, 'bold 9px Cairo, Arial', '#fff'); rxTxt(c, r[1], bx + 18, by + 42 + i * 18, 'bold 9px Cairo, Arial', '#ffd76a'); });
  rxTxt(c, 'ادخل واطلب من بابيتو 💜', x, by + bh - 12, 'bold 8.5px Cairo, Arial', '#f0d8ff');
  const tw = 0.5 + 0.5 * Math.sin(T / 9); rxStar4(c, bx + bw - 6, by + 4, 3 + tw * 3, '#fff3c4');
}
/* نافورة الساحة + نخل + فوانيس بنفسجية */
const RX_PLAZA_LAMPS = [3520, 3760, 4480, 4720].map(x => [x, 690]);
function rxPlazaFountain(c) {
  const x = 4120, y = 880, T = RM.T; if (!rxVis(x - 110, x + 110)) return; const d = rxNight();
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 6, 104, 26, 0, 0, 7); c.fill(); c.fillStyle = '#efe8f6'; c.beginPath(); c.ellipse(x, y, 100, 26, 0, 0, 7); c.fill(); c.fillStyle = '#b9a6d6'; c.fillRect(x - 100, y, 200, 10); c.beginPath(); c.ellipse(x, y + 10, 100, 26, 0, 0, Math.PI); c.fill();
  let g = c.createRadialGradient(x, y - 4, 4, x, y - 4, 92); g.addColorStop(0, d > 0.15 ? '#c890ff' : '#7ad8ff'); g.addColorStop(1, d > 0.15 ? '#6a2ab8' : '#2a9ad8'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y - 3, 90, 21, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { const r = (T / 1.6 + k * 28) % 84; c.globalAlpha = 1 - r / 84; c.beginPath(); c.ellipse(x, y - 3, r, r * 0.24, 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
  c.fillStyle = '#e8e0f4'; c.fillRect(x - 7, y - 60, 14, 57); c.beginPath(); c.ellipse(x, y - 60, 32, 8, 0, 0, 7); c.fill(); c.fillStyle = d > 0.15 ? '#c890ff' : '#7ad8ff'; c.beginPath(); c.ellipse(x, y - 62, 27, 5.5, 0, 0, 7); c.fill();
  c.strokeStyle = d > 0.15 ? 'rgba(230,190,255,.9)' : 'rgba(190,235,255,.9)'; c.lineWidth = 2; for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x, y - 86); c.quadraticCurveTo(x + k * 14, y - 108 + Math.sin(T / 6 + k) * 2, x + k * 26, y - 62); c.stroke(); }
  if (T % 5 === 0) RM.sparks.push({ x: x + (Math.random() - 0.5) * 50, y: y - 64, vx: (Math.random() - 0.5) * 0.9, vy: -0.7, t: 14, drop: 1 });
  rxTxt(c, '💜 نافورة بابيت', x, y + 38, 'bold 11px Cairo, Arial', '#5a1aa8');
}
function rxPalm(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 2, 26, 7, 0, 0, 7); c.fill(); c.strokeStyle = '#8a5a2e'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(8, -50, -4, -100); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 9; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-5 + i * 0.5, -10 - i * 10); c.lineTo(5, -12 - i * 10); c.stroke(); } const sw = Math.sin(RM.T / 50) * 0.06; [[-1.9, 1], [-1.2, 1.1], [-0.4, 1], [0.4, 1], [1.2, 1.1], [1.9, 1], [3.1, 0.8]].forEach(([a, l]) => { c.save(); c.translate(-4, -100); c.rotate(a + sw - Math.PI / 2 + Math.PI / 2); c.fillStyle = '#3f9a3a'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(20 * l, -16, 48 * l, 6); c.quadraticCurveTo(22 * l, -4, 0, 0); c.fill(); c.restore(); }); c.fillStyle = '#6a4a1a'; [[-8, -96], [0, -94], [-4, -90]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 4, 0, 7); c.fill(); }); c.restore(); }
function rxPlanterPalm(c, x, y) { if (!rxVis(x - 60, x + 60)) return; rxRect(c, x - 22, y - 26, 44, 26, 4, '#e8e0f4'); c.fillStyle = '#ffd76a'; c.fillRect(x - 24, y - 28, 48, 4); c.fillStyle = '#7a2ad8'; c.fillRect(x - 22, y - 8, 44, 3); rxPalm(c, x, y - 24, 0.9); }
function rxPurpleLamp(c, L) { const x = L[0], y = L[1], d = rxNight(), on = d > 0.18, fl = 0.92 + 0.08 * Math.sin(RM.T / 5 + x); if (!rxVis(x - 40, x + 40)) return; c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x + 3, y + 2, 11, 3.5, 0, 0, 7); c.fill(); c.fillStyle = '#2a1050'; c.fillRect(x - 6, y - 8, 12, 8); c.fillStyle = '#4a2a80'; c.fillRect(x - 2.4, y - 84, 4.8, 78); c.fillStyle = '#ffd76a'; c.fillRect(x - 4, y - 50, 8, 3); c.strokeStyle = '#4a2a80'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 84); c.quadraticCurveTo(x + 16, y - 92, x + 18, y - 78); c.moveTo(x, y - 84); c.quadraticCurveTo(x - 16, y - 92, x - 18, y - 78); c.stroke(); [x - 18, x + 18].forEach(px => { c.fillStyle = on ? 'rgba(230,180,255,' + 0.95 * fl + ')' : '#efe4ff'; c.beginPath(); c.arc(px, y - 74, 5.5, 0, 7); c.fill(); c.strokeStyle = '#2a1050'; c.lineWidth = 1; c.stroke(); }); }
const rxNearHotel = () => !rmInShop() && Math.hypot(RM.me.x - RX_HT.x, (RM.me.y - RX_HT.y - 22) * 1.3) < 75;
const rxNearBoard = () => !rmInShop() && Math.hypot(RM.me.x - RX_HBOARD.x, (RM.me.y - RX_HBOARD.y - 6) * 1.2) < 70;
function rxHotelEnter() {
  const m = RM.me; if (m.sit || m.jump) return; if (RM.holds[rmMe()] && !RM.holdLead[rmMe()]) rmSend({ t: 'rm_hold', on: 0 }); if (m.dance) rmSetDance(0); RM.tapMk = null; RM.hold = false;
  m.x = m.tx = RX_HL.dx + (Math.random() - 0.5) * 60; m.y = m.ty = 592; m.dir = 1; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1; rxSnd([['sine', 880, 880, 0.3, 0.05], ['sine', 1109, 1109, 0.3, 0.05, 0.15], ['sine', 1319, 1319, 0.5, 0.05, 0.3]]);
  showToast('🏨 أهلاً بيك بفندق بابيت 💜'); setTimeout(() => { if (rmShopId() === 6) { RX.bab.wave = 100; rxSay(RX.bab, 'أهلاً وسهلاً ' + rmMe() + '! 💜 أنا بابيتو، تعال يمي للاستقبال إذا تريد غرفة 🔑'); } }, 500); rxHtGet(); rmPrompt(true);
}
function rxHotelExit() { const m = RM.me; if (m.jump) return; RM.tapMk = null; RM.hold = false; m.x = m.tx = RX_HT.x + (Math.random() - 0.5) * 50; m.y = m.ty = RX_HT.y + 36; m.dir = 1; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1; rxSnd([['sine', 1319, 880, 0.3, 0.05]]); rxHtClose(); showToast('👋 طلعت من فندق بابيت'); rmPrompt(true); }
/* ---- لوبي الفندق ---- */
const RX_LOBBY_SEATS = [[50085, 540], [50085, 470]];
function rxLobbyBg(c) {
  const H = RX_HL, X0 = H.vx0, X1 = H.vx1, W = X1 - X0, T = RM.T;
  let g = c.createLinearGradient(0, 120, 0, 344); g.addColorStop(0, '#3a1670'); g.addColorStop(1, '#5a2a9a'); c.fillStyle = g; c.fillRect(X0, 120, W, 224);
  c.fillStyle = 'rgba(255,215,106,.12)'; for (let x = X0 + 30; x < X1; x += 60) { c.fillRect(x, 140, 2, 160); }   // ألواح خشبية فخمة
  c.fillStyle = '#ffd76a'; c.fillRect(X0, 120, W, 6); c.fillRect(X0, 300, W, 3); c.fillStyle = '#2a0e58'; c.fillRect(X0, 126, W, 8);
  rxTxt(c, 'فندق بابيت', 50320, 168, 'bold 30px Lalezar, Cairo, Arial', '#ffd76a', 12, '#ffb000'); rxTxt(c, '✦ BABEET HOTEL ✦', 50320, 196, 'bold 11px Cairo, Arial', '#f0d8ff');
  // المصاعد
  [50060, 50160].forEach((ex, i) => { rxRect(c, ex - 34, 214, 68, 130, 4, '#2a0e58'); c.fillStyle = '#ffd76a'; c.fillRect(ex - 36, 212, 72, 4); const gg = c.createLinearGradient(ex - 30, 0, ex + 30, 0); gg.addColorStop(0, '#c8c0d8'); gg.addColorStop(0.5, '#f4f0fa'); gg.addColorStop(1, '#b0a8c4'); c.fillStyle = gg; c.fillRect(ex - 30, 226, 29, 118); c.fillRect(ex + 1, 226, 29, 118); c.fillStyle = '#9a90b0'; c.fillRect(ex - 1, 226, 2, 118); const fl = 1 + Math.floor((T / 160 + i * 2) % 3); rxRect(c, ex - 16, 196, 32, 14, 4, '#140630'); rxTxt(c, (i ? '▼ ' : '▲ ') + fl, ex, 203, 'bold 9px Arial', '#ff5ca8'); rxRect(c, ex + 34, 270, 6, 14, 2, '#ffd76a'); });
  rxTxt(c, '🛗 المصاعد للغرف', 50110, 356, 'bold 9px Cairo, Arial', '#ffd76a');
  // لوحة زيتية + ساعات المدن
  rxRect(c, 50225, 220, 90, 64, 3, '#ffd76a'); g = c.createLinearGradient(0, 224, 0, 280); g.addColorStop(0, '#ffb86a'); g.addColorStop(0.5, '#ff7ab8'); g.addColorStop(1, '#5a2aa8'); rxRect(c, 50229, 224, 82, 56, 2, g); c.fillStyle = '#2a0e58'; c.beginPath(); c.moveTo(50229, 268); c.quadraticCurveTo(50260, 252, 50311, 266); c.lineTo(50311, 280); c.lineTo(50229, 280); c.closePath(); c.fill(); c.fillStyle = '#ffe8a0'; c.beginPath(); c.arc(50270, 254, 8, 0, 7); c.fill();
  ['بغداد', 'دبي', 'لندن'].forEach((n, i) => { const cx = 50360 + i * 34; c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, 236, 11, 0, 7); c.fill(); c.strokeStyle = '#ffd76a'; c.lineWidth = 2; c.stroke(); const hr = (new Date().getUTCHours() + [3, 4, 0][i]) % 12, mi = new Date().getUTCMinutes(); c.strokeStyle = '#2a0e58'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, 236); c.lineTo(cx + Math.sin((hr + mi / 60) / 12 * Math.PI * 2) * 6, 236 - Math.cos((hr + mi / 60) / 12 * Math.PI * 2) * 6); c.moveTo(cx, 236); c.lineTo(cx + Math.sin(mi / 60 * Math.PI * 2) * 8.5, 236 - Math.cos(mi / 60 * Math.PI * 2) * 8.5); c.stroke(); rxTxt(c, n, cx, 256, 'bold 7px Cairo, Arial', '#f0d8ff'); });
  // رف المفاتيح ورا الاستقبال
  rxRect(c, 50470, 214, 130, 70, 4, '#4a2a18'); for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const kx = 50482 + k * 20, ky = 226 + r * 20; c.fillStyle = '#2a1408'; c.fillRect(kx, ky, 14, 14); c.fillStyle = '#ffd76a'; c.beginPath(); c.arc(kx + 7, ky + 5, 2, 0, 7); c.fill(); c.fillRect(kx + 6, ky + 6, 2, 6); }
  rxTxt(c, '🔑 مفاتيح الغرف', 50535, 294, 'bold 8px Cairo, Arial', '#ffd76a');
  c.fillStyle = '#e8dff4'; c.fillRect(X0, 300, W, 44); c.fillStyle = '#ffd76a'; c.fillRect(X0, 340, W, 4);
  // أرضية رخام شطرنج بنفسجي/كريمي
  g = c.createLinearGradient(0, 344, 0, 632); g.addColorStop(0, '#f2ecf8'); g.addColorStop(1, '#dcd0ec'); c.fillStyle = g; c.fillRect(X0, 344, W, 288);
  for (let x = X0; x < X1; x += 40) for (let y = 344; y < 632; y += 40) if (((x - X0) / 40 + (y - 344) / 40) % 2 < 1) { c.fillStyle = 'rgba(90,40,150,.18)'; c.fillRect(x, y, 40, 40); }
  // سجادة حمراء/بنفسجية من الباب للاستقبال
  c.fillStyle = '#6a1aa8'; c.beginPath(); c.moveTo(50290, 632); c.lineTo(50350, 632); c.lineTo(50470, 430); c.lineTo(50430, 430); c.closePath(); c.fill(); c.fillStyle = '#ffd76a'; c.beginPath(); c.moveTo(50290, 632); c.lineTo(50296, 632); c.lineTo(50434, 430); c.lineTo(50430, 430); c.closePath(); c.fill();
  // ثريات
  [50200, 50440].forEach(lx => { c.strokeStyle = '#ffd76a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx, 134); c.lineTo(lx, 150); c.stroke(); for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 9; i++) { const a = i / 8 * Math.PI, px = lx + Math.cos(a) * (24 - ring * 9), py = 156 + ring * 8 + Math.sin(a) * 8; c.fillStyle = 'rgba(255,255,255,' + (0.6 + 0.4 * Math.sin(T / 10 + i + ring)) + ')'; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 2.4, py + 6); c.lineTo(px, py + 12); c.lineTo(px + 2.4, py + 6); c.closePath(); c.fill(); } g = c.createRadialGradient(lx, 160, 4, lx, 160, 130); g.addColorStop(0, 'rgba(255,230,180,.4)'); g.addColorStop(1, 'rgba(255,230,180,0)'); c.fillStyle = g; c.beginPath(); c.arc(lx, 160, 130, 0, 7); c.fill(); });
  // بابيتو ورا الاستقبال
  const B = RX.bab, near = rmShopId() === 6 && RM.me.y < 480 && Math.abs(RM.me.x - B.x) < 110; if (near && !B.near) { B.wave = 80; if (!B.say || B.say.t <= 0) rxSay(B, 'هلا بيك 💜 تريد غرفة؟ دوس عليّ وأراويك الغرف 🔑', 240); } B.near = near;
  if (near && (!B.say || B.say.t <= 0) && ++B.idleT > 560) { B.idleT = 0; rxSay(B, ['غرفة الشخص الواحد يومين بـ25 دولار 👤', 'غرفة الشخصين يومين بـ40 💵 وتكدر تضيف صاحبك 👥', 'الجناح لـ3 أشخاص أسبوع كامل بـ90 💵 👨‍👩‍👧', 'بالغرفة تكدر تنام وتتغطى 😴🛏️', 'المصاعد يم اليسار توديك لغرفتك 🛗', 'الدولارات من الصيد 🎣💵'][Math.floor(Math.random() * 6)]); }
  if (B.wave > 0) B.wave--; rxNpc(c, RX_BAB_AV, B.x, B.y, -1, { dance: B.wave > 0 ? 1 : 0, dt: RM.T });
  g = c.createLinearGradient(0, 366, 0, 416); g.addColorStop(0, '#7a2ad8'); g.addColorStop(1, '#4a1a90'); c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(50430, 366, 196, 50, 8) : c.rect(50430, 366, 196, 50); c.fill(); c.fillStyle = '#f4f0fa'; c.fillRect(50424, 360, 208, 10); c.fillStyle = '#ffd76a'; c.fillRect(50424, 368, 208, 2); rxTxt(c, 'الاستقبال • RECEPTION', 50528, 393, 'bold 10px Cairo, Arial', '#ffd76a');
  c.fillStyle = '#ffd76a'; c.beginPath(); c.arc(50452, 358, 5, Math.PI, 0); c.fill(); c.fillRect(50446, 357, 12, 2); c.fillStyle = '#2a2a2a'; c.fillRect(50600, 346, 18, 13); c.fillStyle = '#8ad0ff'; c.fillRect(50602, 348, 14, 9);
  rmTagDraw(c, B.x, B.y - 112, 'بابيتو 💜 موظفة الاستقبال', 'rgba(122,42,216,.95)');
}
function rxSofa(c, x, y, col) { c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 2, 34, 6, 0, 0, 7); c.fill(); const g = c.createLinearGradient(0, y - 40, 0, y); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); rxRect(c, x - 32, y - 40, 64, 22, 8, g); rxRect(c, x - 34, y - 22, 68, 18, 5, g); rxRect(c, x - 38, y - 30, 10, 26, 4, col[1]); rxRect(c, x + 28, y - 30, 10, 26, 4, col[1]); c.fillStyle = '#ffd76a'; c.fillRect(x - 30, y - 4, 4, 4); c.fillRect(x + 26, y - 4, 4, 4); }
function rxLobbyList() {
  const L = [];
  RX_LOBBY_SEATS.forEach(p => L.push([p[1] - 2, c => rxSofa(c, p[0], p[1], ['#9a3aff', '#5a1aa8'])]));
  L.push([560, c => { const x = 50220, y = 560; c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 2, 26, 5, 0, 0, 7); c.fill(); c.strokeStyle = '#ffd76a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 20, y - 4); c.lineTo(x + 20, y - 4); c.moveTo(x - 18, y - 4); c.lineTo(x - 18, y - 60); c.quadraticCurveTo(x, y - 76, x + 18, y - 60); c.lineTo(x + 18, y - 4); c.stroke(); rxRect(c, x - 14, y - 34, 18, 28, 3, '#e8284a'); rxRect(c, x + 2, y - 26, 14, 20, 3, '#3a86ff'); rxRect(c, x - 10, y - 50, 22, 16, 3, '#ffd166'); c.fillStyle = '#222'; [x - 16, x + 16].forEach(wx => { c.beginPath(); c.arc(wx, y - 2, 3, 0, 7); c.fill(); }); rmTagDraw(c, x, y + 14, '🧳 الشنط', 'rgba(122,42,216,.9)'); }]);
  [[50020, 610], [50620, 610], [50620, 470]].forEach(p => L.push([p[1], c => { const x = p[0], y = p[1]; c.fillStyle = '#ffd76a'; c.beginPath(); c.moveTo(x - 12, y - 20); c.lineTo(x + 12, y - 20); c.lineTo(x + 8, y); c.lineTo(x - 8, y); c.closePath(); c.fill(); c.fillStyle = '#2f8a3a'; for (let k = 0; k < 7; k++) { c.save(); c.translate(x, y - 20); c.rotate(-1.2 + k * 0.4); c.beginPath(); c.ellipse(0, -18, 5, 18, 0, 0, 7); c.fill(); c.restore(); } }]));
  return L;
}
function rxLobbyFg(c) {
  const H = RX_HL, X0 = H.vx0, X1 = H.vx1, D = H.dx;
  c.fillStyle = '#2a0e58'; c.fillRect(X0, 612, D - 50 - X0, 20); c.fillRect(D + 50, 612, X1 - D - 50, 20); c.fillStyle = '#ffd76a'; c.fillRect(X0, 612, X1 - X0, 3);
  c.fillStyle = 'rgba(230,200,255,.5)'; c.fillRect(D - 50, 614, 100, 18); c.strokeStyle = '#ffd76a'; c.lineWidth = 3; c.strokeRect(D - 50, 614, 100, 18);
  rxRect(c, D - 34, 594, 68, 14, 4, '#7a2ad8'); rxTxt(c, '⬇ خروج', D, 601, 'bold 9px Cairo, Arial', '#fff');
  rmShopPeek(c, RX_HT.x, RX_HL); rmSayDraw(c, RX.bab.x, RX.bab.y - 128, RX.bab.say);
}
const rxNearBab = () => rmShopId() === 6 && RM.me.y < 480 && Math.abs(RM.me.x - RX.bab.x) < 110;
const rxNearElev = () => rmShopId() === 6 && RM.me.y < 470 && RM.me.x < 50215;
const rxNearLobbyExit = () => rmShopId() === 6 && RM.me.y > 572 && Math.abs(RM.me.x - RX_HL.dx) < 60;

/* ---- غرف الفندق 🛏️ (واقعية: تنام وتتغطى) ---- */
function rxBeds(i) { if (i === RX_BATH_I) return []; const H = rxRoomHI(i), t = Math.floor(i / 10) + 1, x0 = H.x0; if (i === RX_ADM_I) return [{ x: x0 + 150, len: 156, y: 488, w: 80, sp: [-19, 19], dbl: 2, royal: 1 }]; if (t === 1) return [{ x: x0 + 60, len: 132, y: 476, w: 36, sp: [0], dbl: 0 }]; if (t === 2) return [{ x: x0 + 56, len: 142, y: 482, w: 62, sp: [-15, 15], dbl: 1 }]; return [{ x: x0 + 40, len: 142, y: 482, w: 62, sp: [-15, 15], dbl: 1 }, { x: x0 + 300, len: 132, y: 476, w: 36, sp: [0], dbl: 0 }]; }
function rxSpotsOf(i) { const S = []; rxBeds(i).forEach((b, bi) => b.sp.forEach((dy, k) => S.push({ x: b.x + 73, y: b.y + dy, bed: b, k: bi + ':' + k }))); return S; }
const rxLying = o => (o && o.dance) === 39;
function rxSpotBusy(sp) { return Object.values(RM.others).some(o => rxLying(o) && Math.hypot(o.x - sp.x, o.y - sp.y) < 8); }
function rxBedDraw(c, b) {
  if (b.royal) return rxRoyalBed(c, b);
  const T = RM.T, top = b.y - b.w / 2, bot = b.y + b.w / 2;
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(b.x + b.len / 2, bot + 12, b.len / 2 + 12, 8, 0, 0, 7); c.fill();
  // كومودينو + أباجورة يم راس السرير
  const nx = b.x - 34, ny = top + 4; rxRect(c, nx - 14, ny - 2, 28, 26, 3, '#6a4228'); c.fillStyle = '#8a5a3a'; c.fillRect(nx - 14, ny - 4, 28, 4); c.fillStyle = '#d7a400'; c.fillRect(nx - 2, ny + 10, 4, 2); c.fillStyle = '#c8b890'; c.fillRect(nx - 1.5, ny - 26, 3, 22); const on = !RX.dark || true; c.fillStyle = RX.dark ? '#ffe6a8' : '#f4ead0'; c.beginPath(); c.moveTo(nx - 10, ny - 26); c.lineTo(nx + 10, ny - 26); c.lineTo(nx + 6, ny - 40); c.lineTo(nx - 6, ny - 40); c.closePath(); c.fill(); if (RX.dark) { const g = c.createRadialGradient(nx, ny - 30, 2, nx, ny - 30, 60); g.addColorStop(0, 'rgba(255,220,150,.55)'); g.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = g; c.beginPath(); c.arc(nx, ny - 30, 60, 0, 7); c.fill(); }
  // لوح الراس المبطن
  const hg = c.createLinearGradient(0, top - 50, 0, bot); hg.addColorStop(0, '#7a3ac8'); hg.addColorStop(1, '#4a1a8a'); rxRect(c, b.x - 12, top - 48, 18, b.w + 54, 7, hg); c.fillStyle = 'rgba(255,255,255,.25)'; for (let y = top - 40; y < bot; y += 12) { c.beginPath(); c.arc(b.x - 3, y, 1.4, 0, 7); c.fill(); }
  // الهيكل والفرشة
  rxRect(c, b.x - 2, bot - 6, b.len + 6, 16, 3, '#5a3a22'); c.fillStyle = '#7a5032'; c.fillRect(b.x - 2, bot - 6, b.len + 6, 3);
  const mg = c.createLinearGradient(0, top, 0, bot); mg.addColorStop(0, '#ffffff'); mg.addColorStop(1, '#ece8f2'); rxRect(c, b.x, top, b.len, b.w, 5, mg); c.fillStyle = '#e0d8ea'; c.fillRect(b.x, bot - 4, b.len, 4);
  // مخدات
  b.sp.forEach(dy => { const py = b.y + dy; rxRect(c, b.x + 4, py - 10, 26, 20, 7, '#fff'); c.strokeStyle = '#d8d0e4'; c.lineWidth = 1; c.beginPath(); c.roundRect ? c.roundRect(b.x + 4, py - 10, 26, 20, 7) : c.rect(b.x + 4, py - 10, 26, 20); c.stroke(); c.strokeStyle = 'rgba(180,170,200,.6)'; c.beginPath(); c.moveTo(b.x + 10, py - 4); c.quadraticCurveTo(b.x + 17, py, b.x + 24, py - 4); c.stroke(); });
  // الفوت بورد
  rxRect(c, b.x + b.len - 2, top + 4, 8, b.w + 8, 3, '#5a3a22');
}
function rxBlanketDraw(c, b) {
  if (b.royal) return rxRoyalBlanket(c, b);
  const top = b.y - b.w / 2 + 2, bot = b.y + b.w / 2 - 1, x0 = b.x + 30, x1 = b.x + b.len - 2, T = RM.T;
  const g = c.createLinearGradient(0, top, 0, bot + 12); g.addColorStop(0, '#9a5ae8'); g.addColorStop(0.7, '#7a3ad0'); g.addColorStop(1, '#5a24a8'); c.fillStyle = g;
  c.beginPath(); c.moveTo(x0, top); for (let x = x0; x <= x1; x += 12) c.lineTo(x, top + Math.sin(x / 9 + T / 90) * 0.8); c.lineTo(x1, bot); c.quadraticCurveTo(x1 + 2, bot + 12, x1 - 4, bot + 12); for (let x = x1 - 4; x >= x0; x -= 10) c.lineTo(x, bot + 12 + Math.sin(x / 6) * 1.6); c.lineTo(x0, bot); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x0 - 3, top - 1); c.lineTo(x0 + 9, top - 1); c.lineTo(x0 + 9, bot + 12); c.lineTo(x0 - 3, bot + 10); c.closePath(); c.fill(); c.fillStyle = '#e8e0f4'; c.fillRect(x0 + 6, top, 3, bot - top + 12);
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.2; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x0 + 14, top + k * (bot - top) / 4); c.quadraticCurveTo((x0 + x1) / 2, top + k * (bot - top) / 4 + 3, x1 - 4, top + k * (bot - top) / 4); c.stroke(); }
  c.fillStyle = '#ffd76a'; c.fillRect(x0 + 12, bot + 7, x1 - x0 - 16, 2);
}
function rxRoomBg(c, i) {
  if (i === RX_BATH_I) return rxBathBg(c);
  if (i === RX_ADM_I) return rxAdmRoomBg(c, i);
  const H = rxRoomHI(i), t = Math.floor(i / 10) + 1, X0 = H.vx0, X1 = H.vx1, W = X1 - X0, T = RM.T, d = rxNight(), x0 = H.x0;
  let g = c.createLinearGradient(0, 120, 0, 344); g.addColorStop(0, '#f4ecdf'); g.addColorStop(1, '#fbf6ee'); c.fillStyle = g; c.fillRect(X0, 120, W, 224);
  c.fillStyle = 'rgba(160,130,90,.12)'; for (let x = X0 + 14; x < X1; x += 34) for (let y = 150; y < 296; y += 34) { c.beginPath(); c.moveTo(x, y - 6); c.quadraticCurveTo(x + 6, y, x, y + 6); c.quadraticCurveTo(x - 6, y, x, y - 6); c.fill(); }   // ورق جدران دمشقي
  c.fillStyle = '#fff'; c.fillRect(X0, 120, W, 10); c.fillStyle = '#d8c8a8'; c.fillRect(X0, 130, W, 3); c.fillStyle = '#fff'; c.fillRect(X0, 300, W, 44); c.fillStyle = '#d8c8a8'; c.fillRect(X0, 300, W, 2);
  // الشباك: منظر البحر نهار/ليل + ستاير مخمل
  const wx = x0 + 170, wy = 160, ww = 120, wh = 110; c.fillStyle = '#fff'; c.fillRect(wx - 6, wy - 6, ww + 12, wh + 12); g = c.createLinearGradient(0, wy, 0, wy + wh); if (d > 0.4) { g.addColorStop(0, '#0a0f3a'); g.addColorStop(0.62, '#2a2a6a'); g.addColorStop(0.63, '#14204a'); g.addColorStop(1, '#0a1430'); } else { g.addColorStop(0, '#6cc7ff'); g.addColorStop(0.62, '#d6f3ff'); g.addColorStop(0.63, '#2aa9dd'); g.addColorStop(1, '#1a7ab0'); } c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
  if (d > 0.4) { c.fillStyle = '#f6f3d6'; c.beginPath(); c.arc(wx + 88, wy + 26, 9, 0, 7); c.fill(); c.fillStyle = '#0a0f3a'; c.beginPath(); c.arc(wx + 92, wy + 23, 8, 0, 7); c.fill(); c.fillStyle = '#fff'; for (let k = 0; k < 10; k++) { c.globalAlpha = 0.5 + 0.5 * Math.sin(T / 20 + k); c.fillRect(wx + rxH(k + i) * ww, wy + rxH(k * 3 + i) * 60, 1.5, 1.5); } c.globalAlpha = 1; } else { c.fillStyle = '#ffe066'; c.beginPath(); c.arc(wx + 90, wy + 24, 10, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; const cx = wx + ((T * 0.15) % (ww + 40)) - 20; c.beginPath(); c.ellipse(cx, wy + 36, 16, 5, 0, 0, 7); c.fill(); }
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(wx, wy + 78 + k * 9); for (let x = wx; x <= wx + ww; x += 10) c.lineTo(x, wy + 78 + k * 9 + Math.sin(x / 8 + T / 30) * 1.2); c.stroke(); }
  c.fillStyle = '#fff'; c.fillRect(wx + ww / 2 - 2, wy, 4, wh); c.fillRect(wx, wy + wh / 2 - 2, ww, 4);
  c.fillStyle = '#8a8070'; c.fillRect(wx - 26, wy - 18, ww + 52, 5); [[wx - 26, 1], [wx + ww + 6, -1]].forEach(([cx, s]) => { const cg = c.createLinearGradient(cx, 0, cx + 20, 0); cg.addColorStop(0, '#5a1aa8'); cg.addColorStop(0.5, '#8a4ae8'); cg.addColorStop(1, '#5a1aa8'); c.fillStyle = cg; c.beginPath(); c.moveTo(cx, wy - 14); c.lineTo(cx + 20, wy - 14); c.quadraticCurveTo(cx + 10 + s * 6, wy + 60, cx + 22, wy + wh + 22); c.lineTo(cx - 2, wy + wh + 22); c.closePath(); c.fill(); c.fillStyle = '#ffd76a'; c.fillRect(cx + 2, wy + 50, 16, 3); });
  // تلفزيون + لوحة
  rxRect(c, x0 + 330, 176, 110, 66, 4, '#141418'); g = c.createLinearGradient(x0 + 334, 180, x0 + 436, 238); g.addColorStop(0, '#2a2a6a'); g.addColorStop(1, '#5a2aa8'); rxRect(c, x0 + 334, 180, 102, 58, 2, g); rxTxt(c, 'فندق بابيت 💜', x0 + 385, 209, 'bold 11px Cairo, Arial', 'rgba(255,255,255,.85)'); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(x0 + 340, 180); c.lineTo(x0 + 370, 180); c.lineTo(x0 + 350, 238); c.lineTo(x0 + 334, 238); c.closePath(); c.fill();
  rxRect(c, x0 + 40, 190, 70, 50, 2, '#c8a050'); g = c.createLinearGradient(0, 194, 0, 236); g.addColorStop(0, '#ffd0a8'); g.addColorStop(1, '#ff8ab8'); rxRect(c, x0 + 44, 194, 62, 42, 1, g); c.fillStyle = '#3f8a3a'; c.beginPath(); c.moveTo(x0 + 44, 236); c.quadraticCurveTo(x0 + 70, 214, x0 + 106, 230); c.lineTo(x0 + 106, 236); c.closePath(); c.fill();
  // رقم الغرفة + مكيف
  rxRect(c, x0 + 230, 132, 60, 18, 4, '#5a1aa8'); rxTxt(c, '🔑 ' + rxRoomNo(i), x0 + 260, 141, 'bold 10px Arial', '#ffd76a');
  rxRect(c, x0 + 440, 140, 64, 20, 6, '#fff'); c.strokeStyle = '#d8d0c8'; c.lineWidth = 1; c.strokeRect(x0 + 444, 150, 56, 6); c.fillStyle = '#3ddc84'; c.fillRect(x0 + 494, 144, 3, 3);
  // أرضية باركيه
  g = c.createLinearGradient(0, 344, 0, 632); g.addColorStop(0, '#c89a6a'); g.addColorStop(1, '#a87a4a'); c.fillStyle = g; c.fillRect(X0, 344, W, 288);
  c.strokeStyle = 'rgba(90,55,25,.16)'; c.lineWidth = 1; c.beginPath(); for (let y = 344; y < 632; y += 18) { c.moveTo(X0, y); c.lineTo(X1, y); const off = ((y - 344) / 18 % 2) * 40; for (let x = X0 + off; x < X1; x += 80) { c.moveTo(x, y); c.lineTo(x, y + 18); } } c.stroke();
  // سجادة
  c.fillStyle = '#e8dff4'; c.beginPath(); c.ellipse(x0 + 300, 560, 150, 40, 0, 0, 7); c.fill(); c.strokeStyle = '#7a3ad0'; c.lineWidth = 3; c.beginPath(); c.ellipse(x0 + 300, 560, 136, 34, 0, 0, 7); c.stroke();
  // باب الحمام
  rxRect(c, x0 + 470, 210, 44, 134, 3, '#fff'); rxRect(c, x0 + 474, 214, 36, 130, 2, '#e8dcc8'); c.fillStyle = '#d7a400'; c.fillRect(x0 + 478, 280, 6, 3); rxTxt(c, '🚿', x0 + 492, 236, '14px sans-serif', '#000');
}
function rxRoomList(i) {
  if (i === RX_BATH_I) return rxBathList();
  if (i === RX_ADM_I) return rxAdmRoomList(i);
  const L = [], H = rxRoomHI(i), t = Math.floor(i / 10) + 1, x0 = H.x0;
  rxBeds(i).forEach(b => { L.push([b.y - b.w / 2 - 4, c => rxBedDraw(c, b)]); L.push([b.y + b.w / 2 + 3, c => rxBlanketDraw(c, b)]); });
  // كبت ملابس + ثلاجة صغيرة + مكتب
  L.push([420, c => { const x = x0 + 456, y = 420; c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x - 30, y - 2, 60, 6); rxRect(c, x - 30, y - 110, 60, 110, 3, '#7a5032'); c.fillStyle = '#5a3a22'; c.fillRect(x - 1, y - 106, 2, 102); c.fillStyle = '#d7a400'; c.fillRect(x - 6, y - 60, 3, 10); c.fillRect(x + 3, y - 60, 3, 10); }]);
  if (t !== 3) L.push([438, c => { const x = x0 + 360, y = 438; rxRect(c, x - 50, y - 40, 100, 8, 2, '#8a5a3a'); c.fillStyle = '#6a4228'; c.fillRect(x - 46, y - 32, 4, 32); c.fillRect(x + 42, y - 32, 4, 32); rxRect(c, x - 30, y - 64, 26, 24, 2, '#f4f0e8'); c.fillStyle = '#2a2a2a'; c.font = '9px sans-serif'; c.textAlign = 'center'; c.fillText('☕', x + 16, y - 44); c.fillText('🍫', x + 30, y - 44); rxRect(c, x + 6, y - 20, 22, 20, 3, '#fff'); c.fillStyle = '#cfd6e0'; c.fillRect(x + 8, y - 12, 18, 1.5); }]);
  L.push([600, c => { const x = x0 + 120, y = 600; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x - 7, y - 3, 6, 3, -0.2, 0, 7); c.ellipse(x + 7, y - 3, 6, 3, 0.2, 0, 7); c.fill(); c.fillStyle = '#c8a8f0'; c.beginPath(); c.ellipse(x - 7, y - 4, 4, 1.5, -0.2, 0, 7); c.ellipse(x + 7, y - 4, 4, 1.5, 0.2, 0, 7); c.fill(); }]);
  return L;
}
function rxRoomFg(c, i) {
  if (i === RX_BATH_I) return rxBathFg(c);
  const H = rxRoomHI(i), X0 = H.vx0, X1 = H.vx1, D = H.dx;
  if (RX.dark) { c.save(); c.fillStyle = 'rgba(8,6,30,.62)'; c.fillRect(X0, 120, X1 - X0, 512); c.globalCompositeOperation = 'lighter'; rxBeds(i).forEach(b => { const g = c.createRadialGradient(b.x - 34, b.y - b.w / 2 - 26, 2, b.x - 34, b.y - b.w / 2 - 26, 90); g.addColorStop(0, 'rgba(255,200,120,.35)'); g.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(b.x - 34, b.y - b.w / 2 - 26, 90, 0, 7); c.fill(); }); c.restore(); }
  c.fillStyle = '#7a5032'; c.fillRect(X0, 612, D - 46 - X0, 20); c.fillRect(D + 46, 612, X1 - D - 46, 20); c.fillStyle = '#d8c8a8'; c.fillRect(X0, 612, X1 - X0, 3);
  c.fillStyle = 'rgba(240,230,210,.6)'; c.fillRect(D - 46, 614, 92, 18); rxRect(c, D - 40, 594, 80, 14, 4, '#7a2ad8'); rxTxt(c, '⬇ للمصعد', D, 601, 'bold 9px Cairo, Arial', '#fff');
  // مفتاح الضوء
  rxRect(c, D + 60, 590, 14, 20, 3, '#fff'); c.fillStyle = RX.dark ? '#888' : '#ffd23f'; c.fillRect(D + 64, RX.dark ? 600 : 594, 6, 6);
}
const rxNearRoomExit = () => rmShopId() === 7 && RM.me.y > 572 && Math.abs(RM.me.x - rxRoomHI(rxRoomIdx(RM.me.x)).dx) < 60;
function rxNearBedSpot() { if (rmShopId() !== 7) return null; const m = RM.me, i = rxRoomIdx(m.x); let best = null, bd = 9e9; rxSpotsOf(i).forEach(s => { const dd = Math.hypot(m.x - s.x, (m.y - (s.bed.y + s.bed.w / 2 + 16)) * 1.4); if (dd < 70 && dd < bd && !rxSpotBusy(s)) { bd = dd; best = s; } }); return best; }
function rxLieDown(s) { const m = RM.me; if (!s || m.sit || m.jump) return; if (m.dance) rmSetDance(0); RM.tapMk = null; m.x = m.tx = s.x; m.y = m.ty = s.y; m.dir = 1; RM.sent = ''; rmSetDance(39); RX.lieAt = s; rxSnd([['sine', 392, 330, 0.4, 0.04], ['sine', 330, 262, 0.6, 0.03, 0.3]]); showToast('😴 نمت وتغطيت… أحلام سعيدة'); rmPrompt(true); }
function rxWakeUp() { const m = RM.me, s = RX.lieAt; rmSetDance(0); if (s) { m.x = m.tx = s.bed.x + 60; m.y = m.ty = Math.min(604, s.bed.y + s.bed.w / 2 + 22); } RM.sent = ''; RX.lieAt = null; rxSnd([['sine', 523, 784, 0.25, 0.05]]); showToast('🌅 صباح الخير!'); rmPrompt(true); }
function rxEnterRoom(i) { if (i === RX_BATH_I) return rxBathEnter(); const R = (RX.ht && RX.ht.mine || []).find(r => r.i === i); if (i === RX_ADM_I && !rmBalAdm()) { showToast('👑 غرفة المشرفين لبابي وبابيتو بس'); return; } if (!R && !(RX.ht && RX.ht.adm) && i !== RX_ADM_I) { showToast('🔒 ما عندك مفتاح هذي الغرفة'); return; } const H = rxRoomHI(i), m = RM.me; if (m.sit || m.jump) return; if (m.dance) rmSetDance(0); RM.tapMk = null; m.x = m.tx = H.dx + (Math.random() - 0.5) * 40; m.y = m.ty = 592; m.dir = 1; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1; RX.dark = false; rxHtClose(); rxSnd([['sine', 988, 988, 0.15, 0.05], ['sine', 1319, 1319, 0.4, 0.05, 0.12]]); if (i === RX_ADM_I) { showToast('👑 أهلاً بيكم بغرفة المشرفين 💜 — السرير الملكي يكفي ثنينكم 😴'); rxSnd([['sine', 784, 784, 0.15, 0.05, 0.3], ['sine', 1047, 1047, 0.2, 0.05, 0.42], ['sine', 1319, 1319, 0.4, 0.05, 0.54]]); } else showToast('🛗 وصلت غرفتك ' + rxRoomNo(i) + ' 🔑 — تكدر تنام بالسرير 😴'); rmPrompt(true); }
function rxRoomExit() { const m = RM.me; if (rxRoomIdx(m.x) === RX_BATH_I && rmShopId() === 7) return rxBathExit(); if (rxLying(m)) rxWakeUp(); m.x = m.tx = 50110 + (Math.random() - 0.5) * 30; m.y = m.ty = 470; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1; RX.dark = false; rxSnd([['sine', 1319, 988, 0.3, 0.05]]); showToast('🛗 نزلت للوبي'); rmPrompt(true); }

/* =====================================================================
   يسار المنتجع: مي البحر تدخل ع اليابس وتنزل شلال ← بحيرة بيها قوارب مجانية
   ===================================================================== */
const RX_LG = { x: -930, y: 640, rx: 380, ry: 165 }, RX_CLIFF = { x0: -1340, x1: -520, y0: 212, y1: 486 }, RX_FALL = { x: -930, w: 120, y0: 236, y1: 492 };
const RX_DOCK = { x0: -600, x1: -470, y0: 626, y1: 660 }, RX_BOATP = { x: -930, y: 668, rx: 250, ry: 88 };
const RX_BOATS = [{ k: 'swan', n: 'قارب البجعة 🦢' }, { k: 'duck', n: 'قارب البطة 🦆' }, { k: 'flam', n: 'قارب الفلامنكو 🦩' }, { k: 'row', n: 'قارب خشبي 🚣' }, { k: 'sail', n: 'قارب شراعي ⛵' }];
const RX_JUI = { x: -330, y: 760 }, RX_CAT = { x: -226, y: 782 };
const RX_TORCH = [[-560, 588], [-1330, 610], [-1250, 830], [-610, 820], [-420, 700]];
function rxInLagoon(x, y, k) { const dx = (x - RX_LG.x) / (RX_LG.rx * (k || 1)), dy = (y - RX_LG.y) / (RX_LG.ry * (k || 1)); return dx * dx + dy * dy < 1; }
function rxOnDock(x, y) { return x > RX_DOCK.x0 && x < RX_DOCK.x1 + 20 && y > RX_DOCK.y0 - 4 && y < RX_DOCK.y1 + 8; }
function rxLeftGround(c) {
  if (!rxVis(RMX0, 40)) return; const T = RM.T, d = rxNight(), L = RX_LG;
  // القناة من البحر
  let g = c.createLinearGradient(0, 196, 0, 250); g.addColorStop(0, '#5fd4e8'); g.addColorStop(1, '#3ab8e0'); c.fillStyle = g; c.beginPath(); c.moveTo(RX_FALL.x - 90, 194); c.quadraticCurveTo(RX_FALL.x - 70, 222, RX_FALL.x - RX_FALL.w / 2, 240); c.lineTo(RX_FALL.x + RX_FALL.w / 2, 240); c.quadraticCurveTo(RX_FALL.x + 70, 222, RX_FALL.x + 90, 194); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.4; for (let k = 0; k < 4; k++) { const u = ((T / 40 + k / 4) % 1); c.beginPath(); c.moveTo(RX_FALL.x - 50 + u * 6, 200 + u * 38); c.lineTo(RX_FALL.x + 50 - u * 6, 200 + u * 38); c.stroke(); }
  // الجرف الصخري
  if (rxVis(RX_CLIFF.x0, RX_CLIFF.x1)) {
    const cx0 = RX_CLIFF.x0, cx1 = RX_CLIFF.x1; g = c.createLinearGradient(0, 214, 0, 500); g.addColorStop(0, '#9a8a78'); g.addColorStop(1, '#6a5a4a'); c.fillStyle = g;
    c.beginPath(); c.moveTo(cx0, 500); c.lineTo(cx0, 300); c.quadraticCurveTo(cx0 + 40, 240, cx0 + 120, 236); for (let x = cx0 + 120; x < cx1 - 120; x += 40) c.lineTo(x, 232 + Math.sin(x / 23) * 8); c.quadraticCurveTo(cx1 - 30, 240, cx1, 320); c.lineTo(cx1, 500); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,.16)'; for (let i = 0; i < 18; i++) { const rx = cx0 + 20 + rxH(i * 7) * (cx1 - cx0 - 40), ry = 270 + rxH(i * 13) * 190; c.beginPath(); c.moveTo(rx - 22, ry); c.lineTo(rx - 6, ry - 14); c.lineTo(rx + 18, ry - 10); c.lineTo(rx + 26, ry + 6); c.lineTo(rx, ry + 12); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 14; i++) { const rx = cx0 + 30 + rxH(i * 5 + 2) * (cx1 - cx0 - 60), ry = 260 + rxH(i * 11 + 3) * 200; c.beginPath(); c.ellipse(rx, ry, 12, 4, -0.3, 0, 7); c.fill(); }
    c.fillStyle = '#4c9a3a'; c.beginPath(); c.moveTo(cx0, 300); c.quadraticCurveTo(cx0 + 40, 238, cx0 + 120, 234); for (let x = cx0 + 120; x < cx1 - 120; x += 40) c.lineTo(x, 230 + Math.sin(x / 23) * 8); c.quadraticCurveTo(cx1 - 30, 238, cx1, 318); c.lineTo(cx1, 330); c.quadraticCurveTo(cx1 - 40, 256, cx1 - 120, 252); for (let x = cx1 - 120; x > cx0 + 120; x -= 40) c.lineTo(x, 248 + Math.sin(x / 19) * 6); c.quadraticCurveTo(cx0 + 40, 256, cx0, 314); c.closePath(); c.fill();
    for (let i = 0; i < 16; i++) { const fx = cx0 + 60 + i * ((cx1 - cx0 - 120) / 15); if (Math.abs(fx - RX_FALL.x) < 80) continue; c.fillStyle = ['#ff5a8a', '#ffd23f', '#fff', '#c78bff'][i % 4]; c.beginPath(); c.arc(fx, 244 + Math.sin(fx / 19) * 5, 3, 0, 7); c.fill(); }
    // نبات معلق
    c.strokeStyle = '#3f8a2a'; c.lineWidth = 2; for (let i = 0; i < 10; i++) { const vx = cx0 + 50 + i * 80; if (Math.abs(vx - RX_FALL.x) < 80) continue; c.beginPath(); c.moveTo(vx, 250); c.quadraticCurveTo(vx + Math.sin(T / 60 + i) * 5, 290, vx + 4, 330 + (i % 3) * 20); c.stroke(); }
  }
  // البحيرة
  if (rxVis(L.x - L.rx - 30, L.x + L.rx + 30)) {
    c.fillStyle = '#c8b080'; c.beginPath(); c.ellipse(L.x, L.y + 6, L.rx + 18, L.ry + 14, 0, 0, 7); c.fill();
    g = c.createRadialGradient(L.x, L.y, 20, L.x, L.y, L.rx); g.addColorStop(0, d > 0.4 ? '#1a5a8a' : '#3ad0e0'); g.addColorStop(0.7, d > 0.4 ? '#14466e' : '#22a8d0'); g.addColorStop(1, d > 0.4 ? '#0e3050' : '#1a88b8'); c.fillStyle = g; c.beginPath(); c.ellipse(L.x, L.y, L.rx, L.ry, 0, 0, 7); c.fill();
    c.save(); c.beginPath(); c.ellipse(L.x, L.y, L.rx, L.ry, 0, 0, 7); c.clip();
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.3; for (let r = 0; r < 7; r++) { c.beginPath(); for (let x = L.x - L.rx; x <= L.x + L.rx; x += 14) { const y = L.y - L.ry + 40 + r * 40 + Math.sin(x / 26 + T / 36 + r) * 2.5; x === L.x - L.rx ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
    // رغوة الشلال بالبحيرة
    for (let k = 0; k < 4; k++) { const r = ((T / 1.4 + k * 22) % 88); c.globalAlpha = 0.6 * (1 - r / 88); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.ellipse(RX_FALL.x, RX_FALL.y1 + 6, 40 + r, 10 + r * 0.25, 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
    // أوراق زنبق
    [[-1200, 700], [-1150, 740], [-700, 560], [-660, 720], [-1080, 560]].forEach((p, i) => { c.fillStyle = '#3f9a3a'; c.beginPath(); c.arc(p[0], p[1], 11, 0.3, Math.PI * 2 - 0.2); c.lineTo(p[0], p[1]); c.fill(); if (i % 2 === 0) { c.fillStyle = '#ffb8d8'; c.beginPath(); c.arc(p[0] + 3, p[1] - 3, 4, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(p[0] + 3, p[1] - 3, 1.6, 0, 7); c.fill(); } });
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(L.x, L.y, L.rx - 2, L.ry - 2, 0, 0, 7); c.stroke();
    // صخور حول البحيرة
    for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 + 0.2; if (a > -0.25 && a < 0.25) continue; const rx = L.x + Math.cos(a) * (L.rx + 10), ry = L.y + Math.sin(a) * (L.ry + 8); if (ry < 480) continue; c.fillStyle = i % 2 ? '#8a7a6a' : '#a09080'; c.beginPath(); c.ellipse(rx, ry, 12 + (i % 3) * 4, 7, a, 0, 7); c.fill(); }
  }
  // الشلال نفسه
  if (rxVis(RX_FALL.x - 80, RX_FALL.x + 80)) {
    const F = RX_FALL; g = c.createLinearGradient(F.x - F.w / 2, 0, F.x + F.w / 2, 0); g.addColorStop(0, 'rgba(160,225,255,.85)'); g.addColorStop(0.5, 'rgba(235,250,255,.95)'); g.addColorStop(1, 'rgba(160,225,255,.85)'); c.fillStyle = g; c.beginPath(); c.moveTo(F.x - F.w / 2, F.y0); c.quadraticCurveTo(F.x - F.w / 2 - 6, (F.y0 + F.y1) / 2, F.x - F.w / 2 - 12, F.y1); c.lineTo(F.x + F.w / 2 + 12, F.y1); c.quadraticCurveTo(F.x + F.w / 2 + 6, (F.y0 + F.y1) / 2, F.x + F.w / 2, F.y0); c.closePath(); c.fill();
    c.save(); c.beginPath(); c.rect(F.x - F.w / 2 - 12, F.y0, F.w + 24, F.y1 - F.y0); c.clip(); c.strokeStyle = 'rgba(80,170,220,.45)'; c.lineWidth = 2; for (let i = 0; i < 16; i++) { const x = F.x - F.w / 2 + i * (F.w / 15), off = ((T * 3 + i * 37) % 80); for (let y = F.y0 - 80 + off; y < F.y1; y += 80) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + (x - F.x) * 0.03, y + 34); c.stroke(); } } c.restore();
    c.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 9; i++) { const px = F.x - 70 + i * 17.5, py = F.y1 - 4 + Math.sin(T / 8 + i) * 3; c.beginPath(); c.arc(px, py, 9 + Math.sin(T / 11 + i * 2) * 3, 0, 7); c.fill(); }
    if (d > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createLinearGradient(F.x - 60, 0, F.x + 60, 0); const hue = (T / 3) % 360; gg.addColorStop(0, 'hsla(' + hue + ',90%,60%,.0)'); gg.addColorStop(0.5, 'hsla(' + hue + ',90%,65%,' + 0.35 * d + ')'); gg.addColorStop(1, 'hsla(' + (hue + 60) + ',90%,60%,0)'); c.fillStyle = gg; c.fillRect(F.x - 70, F.y0, 140, F.y1 - F.y0); c.restore(); }
    rxTxt(c, '💧 شلال المنتجع', F.x, F.y0 - 2 + 0, 'bold 11px Cairo, Arial', '#fff', 4, 'rgba(0,60,100,.8)');
  }
  // الرصيف الخشبي (الدوك)
  if (rxVis(RX_DOCK.x0 - 20, RX_DOCK.x1 + 20)) { const D = RX_DOCK; c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(D.x0, D.y1, D.x1 - D.x0, 6); g = c.createLinearGradient(0, D.y0, 0, D.y1); g.addColorStop(0, '#c8905a'); g.addColorStop(1, '#a06a3a'); c.fillStyle = g; c.fillRect(D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0); c.strokeStyle = 'rgba(80,45,15,.45)'; c.lineWidth = 1; for (let x = D.x0 + 12; x < D.x1; x += 12) { c.beginPath(); c.moveTo(x, D.y0); c.lineTo(x, D.y1); c.stroke(); } c.fillStyle = '#6a4220'; [D.x0 + 4, D.x0 + 50, D.x1 - 8].forEach(px => { c.fillRect(px, D.y1, 6, 12); c.fillRect(px, D.y0 - 10, 6, 12); }); }
}
/* ---- القوارب (تدور بنفس الوقت عند الكل) ---- */
function rxBoatPos(i) { const P = RX_BOATP, a = Date.now() / 1000 * 0.16 + i * Math.PI * 2 / RX_BOATS.length; return { x: P.x + Math.cos(a) * P.rx, y: P.y + Math.sin(a) * P.ry, dir: -Math.sin(a) >= 0 ? 1 : -1 }; }
const rxRideOld = rmRideOf; rmRideOf = function (o) { const e = o && o.dance || 0; if (e >= 33 && e < 33 + RX_BOATS.length) return { k: 'boat', i: e - 33 }; return rxRideOld(o); };
function rxBoatDraw(c, i) {
  const p = rxBoatPos(i), B = RX_BOATS[i], T = RM.T, bob = Math.sin(T / 14 + i) * 1.2, x = p.x, y = p.y + bob; c.save();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.2; for (let k = 1; k < 4; k++) { c.globalAlpha = 0.5 - k * 0.12; c.beginPath(); c.ellipse(x - p.dir * k * 10, y + 4, 30 + k * 4, 5 + k, 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
  const col = { swan: ['#fff', '#e0e4f0'], duck: ['#ffd23f', '#e8a80a'], flam: ['#ff9ec7', '#e8508e'], row: ['#b5753c', '#8a5228'], sail: ['#4aa8ff', '#1f6ac8'] }[B.k];
  const hull = () => { const g = c.createLinearGradient(0, y - 14, 0, y + 6); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); c.fillStyle = g; c.beginPath(); c.moveTo(x - 34, y - 10); c.lineTo(x + 34, y - 10); c.quadraticCurveTo(x + 32, y + 6, x + 18, y + 6); c.lineTo(x - 18, y + 6); c.quadraticCurveTo(x - 32, y + 6, x - 34, y - 10); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.stroke(); };
  c.fillStyle = 'rgba(0,40,70,.25)'; c.beginPath(); c.ellipse(x, y + 6, 36, 6, 0, 0, 7); c.fill();
  // الخلفية: كرسي + رقبة الحيوان/الشراع
  c.save(); c.translate(x, 0); c.scale(p.dir, 1); c.translate(-x, 0);
  if (B.k === 'swan' || B.k === 'duck' || B.k === 'flam') { c.strokeStyle = col[0]; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 24, y - 12); c.quadraticCurveTo(x + 38, y - 30, x + 30, y - 44); c.stroke(); c.fillStyle = col[0]; c.beginPath(); c.arc(x + 30, y - 46, 7, 0, 7); c.fill(); c.fillStyle = B.k === 'duck' ? '#ff8a2a' : B.k === 'flam' ? '#2a2a2a' : '#ff8a2a'; c.beginPath(); c.moveTo(x + 35, y - 48); c.lineTo(x + 44, y - 45); c.lineTo(x + 35, y - 43); c.closePath(); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(x + 32, y - 48, 1.3, 0, 7); c.fill(); if (B.k === 'swan') { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x - 22, y - 20, 14, 9, -0.5, 0, 7); c.fill(); } }
  if (B.k === 'sail') { c.fillStyle = '#6a4220'; c.fillRect(x - 2, y - 70, 3, 62); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x + 1, y - 68); c.lineTo(x + 28, y - 14); c.lineTo(x + 1, y - 14); c.closePath(); c.fill(); c.fillStyle = '#ff5a8a'; c.beginPath(); c.moveTo(x - 2, y - 70); c.lineTo(x - 14, y - 66); c.lineTo(x - 2, y - 62); c.closePath(); c.fill(); }
  c.restore();
  const riders = rmRiders('boat').filter(R => R.i === i); riders.forEach((R, k) => rmRiderDraw(c, R, x + (riders.length > 1 ? (k ? 9 : -9) : 0), y - 4, 0.62));
  hull(); if (B.k === 'row') { c.strokeStyle = '#6a4220'; c.lineWidth = 2; const ph = Math.sin(T / 10); c.beginPath(); c.moveTo(x - 8, y - 8); c.lineTo(x - 26, y + 6 + ph * 3); c.moveTo(x + 8, y - 8); c.lineTo(x + 26, y + 6 - ph * 3); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x - 26, y - 8, 52, 2);
  if (!riders.length && Math.hypot(RM.me.x - x, RM.me.y - y) < 260) rxTxt(c, B.n, x, y + 18, 'bold 9px Cairo, Arial', '#fff', 4, 'rgba(0,40,80,.9)');
  c.restore();
}
const rxNearDock = () => !rmInShop() && Math.hypot(RM.me.x - (RX_DOCK.x0 + RX_DOCK.x1) / 2, (RM.me.y - (RX_DOCK.y0 + RX_DOCK.y1) / 2) * 1.3) < 95;
function rxBoatBoard() { const m = RM.me; if (m.sit) { rmStand(); return; } const cnt = {}; rmRiders('boat').filter(R => !R.me).forEach(R => cnt[R.i] = (cnt[R.i] || 0) + 1); let best = -1, bd = 9e9; const dx = (RX_DOCK.x0 + RX_DOCK.x1) / 2, dy = RX_DOCK.y0; RX_BOATS.forEach((b, i) => { if ((cnt[i] || 0) >= 2) return; const p = rxBoatPos(i), dd = Math.hypot(p.x - dx, p.y - dy); if (dd < bd) { bd = dd; best = i; } }); if (best < 0) { showToast('⛔ كل القوارب مليانة، انتظر شوي'); return; } m.tx = m.x; m.ty = m.y; rmSetDance(33 + best); RM.sent = ''; rxSnd([['sine', 523, 523, 0.18, 0.05], ['sine', 659, 659, 0.18, 0.05, 0.1], ['sine', 784, 784, 0.25, 0.05, 0.2]]); showToast('🚣 ركبت ' + RX_BOATS[best].n + ' — مجاناً! استمتع بالبحيرة 💦'); rmPrompt(true); }
function rxBoatLeave() { const m = RM.me; rmSetDance(0); m.x = m.tx = RX_DOCK.x1 - 20; m.y = m.ty = (RX_DOCK.y0 + RX_DOCK.y1) / 2; RM.sent = ''; RM.camSnap = 0; showToast('🛶 نزلت من القارب'); rmPrompt(true); }
function rxDockSign(c) { const x = -505, y = 618; if (!rxVis(x - 60, x + 60)) return; c.fillStyle = '#6a4220'; c.fillRect(x - 2, y - 70, 4, 70); rxRect(c, x - 52, y - 98, 104, 34, 6, '#1f8ac8'); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x - 49, y - 95, 98, 28); rxTxt(c, '🚣 قوارب مجانية', x, y - 86, 'bold 11px Cairo, Arial', '#fff'); rxTxt(c, 'تعال اركب ببلاش 💦', x, y - 72, 'bold 8.5px Cairo, Arial', '#d8f2ff'); }
/* المشاعل */
function rxTorch(c, L) { const x = L[0], y = L[1]; if (!rxVis(x - 30, x + 30)) return; const T = RM.T, d = rxNight(); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 2, 8, 3, 0, 0, 7); c.fill(); c.strokeStyle = '#8a5a2e'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 54); c.stroke(); c.fillStyle = '#5a3a1a'; c.fillRect(x - 5, y - 60, 10, 8); const f = 0.85 + 0.15 * Math.sin(T / 3 + x); c.fillStyle = '#ff8a1a'; c.beginPath(); c.moveTo(x - 6, y - 60); c.quadraticCurveTo(x - 7, y - 72 * f, x, y - 80 * f); c.quadraticCurveTo(x + 7, y - 72 * f, x + 6, y - 60); c.closePath(); c.fill(); c.fillStyle = '#ffe066'; c.beginPath(); c.moveTo(x - 3, y - 60); c.quadraticCurveTo(x - 3, y - 68, x, y - 72 * f); c.quadraticCurveTo(x + 3, y - 68, x + 3, y - 60); c.closePath(); c.fill(); }

/* ---- كشك العصائر الاستوائية 🍹 ---- */
const RX_JUI_AV = (() => { try { return AVT.norm(Object.assign({}, AVT.DEF, { g: 'm', hs: 'curly', hc: 'black', sk: 'tan', tp: 'tee', bt: 'jeans', tc: '#ff7a1a', bc: '#2a6a8a', o: '', mk: [0, 0, 0, 0, 0, 0] })); } catch (e) { return AVT.DEF; } })();
function rxJuiceDraw(c) {
  const { x, y } = RX_JUI; if (!rxVis(x - 110, x + 110)) return; const T = RM.T, d = rxNight();
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 4, 92, 12, 0, 0, 7); c.fill();
  // أعمدة بامبو + سقف قش
  [x - 74, x + 74].forEach(px => { c.fillStyle = '#c8a050'; c.fillRect(px - 4, y - 146, 8, 146); c.strokeStyle = 'rgba(120,80,20,.6)'; c.lineWidth = 1; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(px - 4, y - 136 + k * 28); c.lineTo(px + 4, y - 136 + k * 28); c.stroke(); } });
  rxNpc(c, RX_JUI_AV, x + 20, y - 38, -1, { dance: RX.jui.wave > 0 ? 1 : 0, dt: RM.T }); if (RX.jui.wave > 0) RX.jui.wave--;
  c.fillStyle = '#d8b060'; c.beginPath(); c.moveTo(x - 96, y - 140); c.lineTo(x, y - 186); c.lineTo(x + 96, y - 140); c.closePath(); c.fill(); c.strokeStyle = '#a07a30'; c.lineWidth = 1.4; for (let k = -9; k <= 9; k++) { c.beginPath(); c.moveTo(x, y - 186); c.lineTo(x + k * 10.6, y - 140); c.stroke(); } c.fillStyle = '#c89a40'; for (let k = 0; k < 20; k++) { const fx = x - 96 + k * 10; c.beginPath(); c.moveTo(fx, y - 140); c.lineTo(fx + 5, y - 128 - Math.sin(T / 30 + k) * 1.5); c.lineTo(fx + 10, y - 140); c.fill(); }
  // أضوية سلك
  for (let k = 0; k < 10; k++) { const lx = x - 86 + k * 19, ly = y - 134 + Math.sin(k / 9 * Math.PI) * 8; c.fillStyle = d > 0.2 ? ['#ff5a8a', '#ffd23f', '#3ddc84', '#4aa8ff'][k % 4] : '#eee'; c.beginPath(); c.arc(lx, ly, 2.6, 0, 7); c.fill(); }
  // اللافتة
  rxRect(c, x - 70, y - 176, 140, 24, 8, '#ff7a1a'); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.roundRect ? c.roundRect(x - 70, y - 176, 140, 24, 8) : c.rect(x - 70, y - 176, 140, 24); c.stroke(); rxTxt(c, '🍹 عصائر استوائية', x, y - 164, 'bold 12px Lalezar, Cairo, Arial', '#fff');
  // الكاونتر
  const g = c.createLinearGradient(0, y - 42, 0, y); g.addColorStop(0, '#c8905a'); g.addColorStop(1, '#8a5a2e'); rxRect(c, x - 80, y - 42, 160, 42, 4, g); c.fillStyle = '#e8c080'; c.fillRect(x - 84, y - 46, 168, 7); c.strokeStyle = 'rgba(80,45,15,.4)'; c.lineWidth = 1; for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(x - 80 + k * 20, y - 39); c.lineTo(x - 80 + k * 20, y); c.stroke(); }
  c.font = '15px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; ['🍍', '🥥', '🍉', '🥭', '🍓', '🍋'].forEach((e, i) => c.fillText(e, x - 66 + i * 26, y - 54));
  rxRect(c, x - 72, y - 34, 64, 26, 4, '#fff3dc'); ['🥭1💵', '🍍1💵', '🥥1💵'].forEach((t, i) => rxTxt(c, t, x - 40, y - 28 + i * 8, 'bold 6.5px Arial', '#8a4a1a'));
  rmTagDraw(c, x + 20, y - 126, 'أبو العصير 🍹', 'rgba(255,122,26,.95)');
}
function rxTagJ(c, x, y) { rmTagDraw(c, x + 30, y + 40, 'أبو العصير 🍹', 'rgba(255,122,26,.95)'); }
const rxNearJuice = () => !rmInShop() && Math.hypot(RM.me.x - RX_JUI.x, (RM.me.y - RX_JUI.y - 16) * 1.3) < 100;
function rxJuiceMenu() {
  const old = $('rxJuiM'); if (old) { old.remove(); return; } let pick = ''; RX.jui.wave = 80; rxSay(RX.jui, 'هلا بيك! 🍹 عصائر طازجة من الفواكه الاستوائية، كل كوب بدولار 💵', 220);
  const o = document.createElement('div'); o.className = 'rmOv'; o.id = 'rxJuiM'; const cc = document.createElement('div'); cc.className = 'rmOvC';
  const h = document.createElement('h4'); h.textContent = '🍹 شنو تحب تشرب؟ (كل كوب 1 💵)'; const g = document.createElement('div'); g.className = 'r'; g.style.flexWrap = 'wrap';
  const ok = document.createElement('button'); ok.type = 'button'; ok.textContent = '✅ اطلب'; ok.disabled = true; const no = document.createElement('button'); no.type = 'button'; no.textContent = 'إلغاء';
  RX_TROP.forEach(k => { const D = RM_DRINKS[k], b = document.createElement('button'); b.type = 'button'; b.textContent = D[0] + ' ' + D[1]; b.onclick = () => { pick = k; g.querySelectorAll('button').forEach(x => { x.style.outline = x === b ? '3px solid #ffd166' : ''; x.style.opacity = x === b ? '1' : '.7'; }); ok.disabled = false; ok.textContent = '✅ اطلب ' + D[1]; }; g.appendChild(b); });
  ok.onclick = () => { if (!pick) return; o.remove(); rmSend({ t: 'rm_juice', k: pick }); }; no.onclick = () => o.remove();
  const r2 = document.createElement('div'); r2.className = 'r'; r2.append(ok, no); cc.append(h, g, r2); o.appendChild(cc); o.addEventListener('pointerdown', e => { if (e.target === o) o.remove(); }); $('rmBox').appendChild(o);
}
function rxJuiceGot(k) { const D = RM_DRINKS[k]; if (!D) return; rmDrinkSet(RM.me, k, 5000, true); RX.jui.wave = 90; rxSay(RX.jui, 'تفضل ' + D[1] + ' ' + D[0] + ' بالعافية عليك! 😋', 200); rxSnd([['sine', 660, 990, 0.12, 0.05], ['triangle', 880, 1320, 0.2, 0.04, 0.12]]); }

/* ---- البزونة جاسمية 🐱 (لونها غريب، كاعدة يم المحل ومستمتعة) ---- */
function rxCatDraw(c) {
  const { x, y } = RX_CAT; if (!rxVis(x - 40, x + 40)) return; const T = RM.T, K = RX.cat; const blink = (T % 240) < 8, happy = K.hap > 0 || (T % 600) < 140; if (K.hap > 0) K.hap--;
  c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, 2, 22, 5, 0, 0, 7); c.fill();
  // الذيل يتمايل
  const tw = Math.sin(T / 14) * 0.5; c.strokeStyle = '#7ad8c8'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(12, -6); c.quadraticCurveTo(30, -10 + tw * 6, 26 + tw * 8, -30); c.stroke(); c.strokeStyle = '#ff7ab8'; c.lineWidth = 6; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(12, -6); c.quadraticCurveTo(30, -10 + tw * 6, 26 + tw * 8, -30); c.stroke(); c.setLineDash([]);
  // الجسم: تدرج نعناعي-بنفسجي مع خطوط وردية ونجوم
  let g = c.createLinearGradient(-16, -40, 16, 0); g.addColorStop(0, '#b8a0ff'); g.addColorStop(1, '#7ad8c8'); c.fillStyle = g; c.beginPath(); c.ellipse(0, -14, 16, 15, 0, 0, 7); c.fill();
  c.strokeStyle = '#ff7ab8'; c.lineWidth = 2.2; [-8, 0, 8].forEach(sx => { c.beginPath(); c.moveTo(sx - 3, -26); c.quadraticCurveTo(sx, -20, sx - 2, -12); c.stroke(); });
  c.fillStyle = '#e8f8ff'; c.beginPath(); c.ellipse(0, -8, 8, 7, 0, 0, 7); c.fill(); c.fillStyle = '#b8a0ff'; [-7, 7].forEach(px => { c.beginPath(); c.ellipse(px, -1, 5, 3, 0, 0, 7); c.fill(); });
  // الراس
  c.save(); c.translate(0, -34); c.rotate(Math.sin(T / 40) * 0.08); g = c.createLinearGradient(-14, -14, 14, 12); g.addColorStop(0, '#c8b0ff'); g.addColorStop(1, '#8ae0d0'); c.fillStyle = g;
  [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 5, -9); c.lineTo(s * 12, -20 + (s > 0 ? Math.sin(T / 20) * 1.5 : 0)); c.lineTo(s * 14, -4); c.closePath(); c.fill(); }); c.fillStyle = '#ff9ec7'; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 7, -9); c.lineTo(s * 11.5, -16); c.lineTo(s * 12.4, -6); c.closePath(); c.fill(); });
  c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 14, 12, 0, 0, 7); c.fill(); rxStar4(c, -6, -7, 2.2, '#fff6a0');
  // عيون مختلفة الألوان (ذهبي وفيروزي) — تغمض من تستمتع
  if (happy || blink) { c.strokeStyle = '#2a1a3a'; c.lineWidth = 1.6; [-5, 5].forEach(ex => { c.beginPath(); c.arc(ex, 0, 3, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }); }
  else { [[-5, '#ffd23f'], [5, '#3ae0e8']].forEach(([ex, col]) => { c.fillStyle = col; c.beginPath(); c.ellipse(ex, 0, 3.4, 4, 0, 0, 7); c.fill(); c.fillStyle = '#1a1020'; c.beginPath(); c.ellipse(ex, 0.4, 1.2, 3, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 1, -1.4, 1, 0, 7); c.fill(); }); }
  c.fillStyle = '#ff5a9a'; c.beginPath(); c.moveTo(-1.6, 4); c.lineTo(1.6, 4); c.lineTo(0, 6); c.closePath(); c.fill(); c.strokeStyle = '#5a2a4a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(-2, 8.5, -3.6, 7); c.moveTo(0, 6); c.quadraticCurveTo(2, 8.5, 3.6, 7); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 0.6; [-1, 1].forEach(s => { [4.5, 6.5].forEach(wy => { c.beginPath(); c.moveTo(s * 6, wy); c.lineTo(s * 16, wy - 1 + (wy - 5)); c.stroke(); }); });
  if (happy) { c.fillStyle = 'rgba(255,110,160,.55)'; [-9, 9].forEach(ex => { c.beginPath(); c.ellipse(ex, 4, 2.6, 1.6, 0, 0, 7); c.fill(); }); }
  // فيونكة
  c.fillStyle = '#ff2d7a'; c.beginPath(); c.moveTo(8, -11); c.lineTo(3, -15); c.lineTo(3, -7); c.closePath(); c.moveTo(8, -11); c.lineTo(13, -15); c.lineTo(13, -7); c.closePath(); c.fill(); c.beginPath(); c.arc(8, -11, 1.6, 0, 7); c.fill();
  c.restore(); c.restore();
  // ايماءات الاستمتاع: قلوب ونوتات وخرخرة
  if (T % 70 === 0 && RM.fx) RM.fx.push({ x: x + (Math.random() - 0.5) * 16, y: y - 56, vx: (Math.random() - 0.5) * 0.4, vy: -0.45, g: 0, t: 0, life: 80, col: '#fff', e: ['💜', '😻', '🎵', '💗', '✨'][Math.floor(Math.random() * 5)], r: 9, rot: 0, vr: 0 });
  if ((!K.say || K.say.t <= 0) && ++K.t > 520 && Math.hypot(RM.me.x - x, RM.me.y - y) < 320) { K.t = 0; rxSay(K, ['مررررر 💜', 'مياااو~ 😻', 'أحب الشمس هنا ☀️', 'منو يجيبلي عصير؟ 🍹', 'آني جاسمية، أحلى بزونة 💅'][Math.floor(Math.random() * 5)], 180); }
  rmTagDraw(c, x, y + 14, 'جاسمية 🐱', 'rgba(150,110,230,.95)'); rmSayDraw(c, x, y - 70, K.say);
}
function rxCatPet() { const K = RX.cat; K.hap = 220; rxSay(K, ['مررررر 💜 تسلم إيدك', 'مياو! حبيتك 😻', 'خرخرة خرخرة 🎶', 'هييي دغدغتني 🙈💜'][Math.floor(Math.random() * 4)], 200); for (let i = 0; i < 6; i++) RM.fx && RM.fx.push({ x: RX_CAT.x + (Math.random() - 0.5) * 30, y: RX_CAT.y - 40 - Math.random() * 20, vx: (Math.random() - 0.5) * 0.8, vy: -0.6 - Math.random() * 0.5, g: 0, t: 0, life: 70, col: '#fff', e: '💜', r: 10, rot: 0, vr: 0 }); rxSnd([['sine', 300, 340, 0.4, 0.03], ['sine', 320, 300, 0.4, 0.025, 0.35]]); }

/* =====================================================================
   الربط مع اللعبة
   ===================================================================== */
const RX_LPALMS = [[-1385, 520], [-1385, 930], [-470, 470], [-130, 980], [-680, 950], [-1180, 1000]];
function rmXGround(c) { rxLeftGround(c); rxRightGround(c); }
function rmXOutList(L) {
  const y0 = RM.vy0 - 160, y1 = RM.vy1 + 160, add = (y, f) => { if (y > y0 && y < y1) L.push([y, f]); };
  if (rxVis(RX_SAL.x - 190, RX_SAL.x + 190)) add(RX_SAL.y, rxSalOut);
  if (rxVis(RX_HT.x0 - 70, RX_HT.x1 + 70)) { L.push([RX_HT.y, rxHotelOut]); add(RX_HBOARD.y, rxHotelBoard); add(880, rxPlazaFountain); }
  [[3560, 760], [4680, 760], [3560, 1060], [4680, 1060], [3820, 1000], [4420, 1000]].forEach(p => { if (rxVis(p[0] - 60, p[0] + 60)) add(p[1], c => rxPlanterPalm(c, p[0], p[1])); });
  RX_PLAZA_LAMPS.forEach(Lm => { if (rxVis(Lm[0] - 30, Lm[0] + 30)) add(Lm[1], c => rxPurpleLamp(c, Lm)); });
  if (rxVis(RX_ST.x0 - 60, RX_ST.x1 + 60)) { add(662, rxStreetSign); rxBollards(L); }
  if (rxVis(RMX0, 40)) {
    RX_BOATS.forEach((b, i) => { const p = rxBoatPos(i); if (rxVis(p.x - 60, p.x + 60)) L.push([p.y, c => rxBoatDraw(c, i)]); });
    add(618, rxDockSign); add(RX_JUI.y, rxJuiceDraw); add(RX_CAT.y, rxCatDraw); RX_TORCH.forEach(t => { if (rxVis(t[0] - 30, t[0] + 30)) add(t[1], c => rxTorch(c, t)); });
    RX_LPALMS.forEach(p => { if (rxVis(p[0] - 70, p[0] + 70)) add(p[1], c => rxPalm(c, p[0], p[1], 1)); });
    add(RX_JUI.y + 1, c => rmSayDraw(c, RX_JUI.x + 20, RX_JUI.y - 196, RX.jui.say));
  }
}
function rmXBg(c, sid) { if (sid === 5) rxSalBg(c); else if (sid === 6) rxLobbyBg(c); else rxRoomBg(c, Math.max(0, Math.min(RX_BATH_I, rxRoomIdx(RM.me.x)))); }
function rmXList(sid) { return sid === 5 ? rxSalList() : sid === 6 ? rxLobbyList() : rxRoomList(Math.max(0, Math.min(RX_BATH_I, rxRoomIdx(RM.me.x)))); }
function rmXFg(c, sid) { if (sid === 5) rxSalFg(c); else if (sid === 6) rxLobbyFg(c); else rxRoomFg(c, Math.max(0, Math.min(RX_BATH_I, rxRoomIdx(RM.me.x)))); }
/* كراسي الصالون + كنبات اللوبي (تكدر تكعد عليها) */
(function () { const add = (kind, x, y) => { const sd = { kind, x, y, s: 1, i: RM_SEATS.length }; RM_SEATS.push(sd); rmSpots(sd).forEach(s => RM_SPOTS.push(s)); }; RX_SAL_SEATS.forEach(p => add('gchair', p[0], p[1])); RX_LOBBY_SEATS.forEach(p => add('bench', p[0], p[1])); })();
/* ---- النوم بالسرير: نرسم الشخصية مسدوحة وفوكها البطانية ---- */
function rxDrawLying(c, o, me, fn) {
  const e = o.dance, tg = window.rmTag, bb = window.rmBub; o.dance = 0; window.rmTag = () => {}; window.rmBub = () => {};
  c.save(); c.translate(o.x, o.y); c.rotate(-Math.PI / 2); c.translate(-o.x, -o.y); try { fn(); } catch (er) {} finally { c.restore(); window.rmTag = tg; window.rmBub = bb; o.dance = e; }
  const nm = me ? rmMe() : o.name; try { rmTagDraw(c, o.x - 58, o.y - 30, '😴 ' + nm, me ? 'rgba(122,42,216,.92)' : 'rgba(60,40,110,.85)'); } catch (er) {}
  /* الشات يطلع حتى وانت نايم: الببل ينرسم عدل (مو مسدوح) فوك راسك */
  try { bb(c, nm, o.x - 58, o.y - 42, me ? RM.myAdm : o.adm); if (!me && typeof rmTyping === 'function') rmTyping(c, nm, o.x - 58, o.y - 42); } catch (er) {}
  const T = RM.T; c.save(); c.font = 'bold 11px Arial'; c.textAlign = 'center'; for (let k = 0; k < 3; k++) { const u = ((T / 70 + k / 3) % 1); c.globalAlpha = Math.sin(u * Math.PI) * 0.9; c.fillStyle = '#9a6aff'; c.fillText('z', o.x - 66 + u * 18 + k * 3, o.y - 44 - u * 26); } c.restore();
}
const rxDM = rmDrawMe; rmDrawMe = function (c, st) { const m = RM.me; if (rxLying(m) && rmShopId() === 7) return rxDrawLying(c, m, true, () => rxDM(c, st)); return rxDM(c, st); };
const rxDO = rmDrawOther; rmDrawOther = function (c, o) { if (rxLying(o) && rmShopId(o) === 7) return rxDrawLying(c, o, false, () => rxDO(c, o)); return rxDO(c, o); };
/* ---- الحركة: القارب يشيلك، وما تمشي على المي أو الصخر ---- */
function rxBlock(m) {
  if (rmInShop() || rxOnDock(m.x, m.y)) return;
  if (rxInLagoon(m.x, m.y, 1.02)) { const a = Math.atan2((m.y - RX_LG.y) / RX_LG.ry, (m.x - RX_LG.x) / RX_LG.rx); m.x = RX_LG.x + Math.cos(a) * RX_LG.rx * 1.04; m.y = RX_LG.y + Math.sin(a) * RX_LG.ry * 1.04; if (rxInLagoon(m.tx, m.ty, 1.02)) { m.tx = m.x; m.ty = m.y; } }
  if (m.x > RX_CLIFF.x0 && m.x < RX_CLIFF.x1 && m.y < RX_CLIFF.y1) { m.y = RX_CLIFF.y1; if (m.ty < RX_CLIFF.y1) m.ty = RX_CLIFF.y1; }
}
const rxUpd = rmUpdMe; rmUpdMe = function () {
  const m = RM.me, r = rmRideOf(m); if (r && r.k === 'boat') { const p = rxBoatPos(r.i); m.x = m.tx = p.x; m.y = m.ty = p.y; m.dir = p.dir; return { mv: false, air: 0, jp: 0 }; }
  if (rxLying(m)) { m.tx = m.x; m.ty = m.y; return { mv: false, air: 0, jp: 0 }; }
  const st = rxUpd(); try { rxBlock(m); } catch (e) {} return st;
};
const rxWalk = rmWalkTo; rmWalkTo = function (x, y) {
  const m = RM.me, r = rmRideOf(m); if (r && r.k === 'boat') { showToast('🛶 انزل من القارب أول'); return; } if (rxLying(m)) rxWakeUp();
  if (!rmInShop() && !rxOnDock(x, y)) { if (rxInLagoon(x, y, 1.02)) { const a = Math.atan2((y - RX_LG.y) / RX_LG.ry, (x - RX_LG.x) / RX_LG.rx); x = RX_LG.x + Math.cos(a) * RX_LG.rx * 1.06; y = RX_LG.y + Math.sin(a) * RX_LG.ry * 1.06; } if (x > RX_CLIFF.x0 && x < RX_CLIFF.x1 && y < RX_CLIFF.y1) y = RX_CLIFF.y1 + 4; }
  return rxWalk(x, y);
};
/* ---- اللمس ---- */
function rxGo(x, y, msg) { rmWalkTo(x, y); rmTapMark(x, y); if (msg) showToast(msg); }
function rmXHit(x, y) {
  const sid = rmShopId(), m = RM.me;
  if (sid === 0) {
    if (Math.abs(x - RX_SAL.x) < 160 && y > 300 && y < RX_SAL.y + 10) { if (rxNearSal()) rxSalEnter(); else rxGo(RX_SAL.x, RX_SAL.y + 18, '🚶‍♀️ روحي لباب الصالون حتى تدخلين 💇‍♀️'); return true; }
    if (x > RX_HBOARD.x - 60 && x < RX_HBOARD.x + 60 && y > RX_HBOARD.y - 172 && y < RX_HBOARD.y + 4) { if (rxNearBoard()) rxHtPrices(); else rxGo(RX_HBOARD.x, RX_HBOARD.y + 16); return true; }
    if (x > RX_HT.x0 - 60 && x < RX_HT.x1 + 60 && y > 0 && y < RX_HT.y + 8) { if (rxNearHotel()) rxHotelEnter(); else rxGo(RX_HT.x, RX_HT.y + 24, '🚶 روح لباب الفندق حتى تدخل 🏨'); return true; }
    if (Math.hypot(x - RX_CAT.x, y - RX_CAT.y + 26) < 34) { if (Math.hypot(m.x - RX_CAT.x, m.y - RX_CAT.y) < 90) rxCatPet(); else rxGo(RX_CAT.x + 30, RX_CAT.y + 14); return true; }
    if (Math.abs(x - RX_JUI.x) < 95 && y > RX_JUI.y - 190 && y < RX_JUI.y + 8) { if (rxNearJuice()) rxJuiceMenu(); else rxGo(RX_JUI.x, RX_JUI.y + 26, '🍹 روح للكشك حتى تطلب'); return true; }
    for (let i = 0; i < RX_BOATS.length; i++) { const p = rxBoatPos(i); if (Math.hypot(x - p.x, (y - p.y + 10) * 1.4) < 42) { if (rxNearDock()) rxBoatBoard(); else rxGo(RX_DOCK.x1 - 20, (RX_DOCK.y0 + RX_DOCK.y1) / 2, '🚣 روح للرصيف الخشبي حتى تركب'); return true; } }
    return false;
  }
  if (sid === 5) { if (Math.abs(x - RX.mlz.x) < 80 && y > 300 && y < 420) { if (rxNearMlz()) rxSalOpen(); else { rxGo(RX.mlz.x, 440); RX.mlz.wave = 60; rmMlzSay('تعالي يمي حبيبتي 💖', 150); } return true; } if (y > 606 && Math.abs(x - RX_SALHI.dx) < 50) { if (rxNearSalExit()) rxSalExit(); else rxGo(RX_SALHI.dx, 600); return true; } return false; }
  if (sid === 6) { if (Math.abs(x - RX.bab.x) < 90 && y > 300 && y < 420) { if (rxNearBab()) rxHtOpen(); else { rxGo(RX.bab.x, 446); RX.bab.wave = 60; rxSay(RX.bab, 'تعال يمي للاستقبال 💜', 150); } return true; } if (x < 50200 && y > 190 && y < 350) { if (rxNearElev()) rxHtOpen('mine'); else rxGo(50110, 446); return true; } if (y > 606 && Math.abs(x - RX_HL.dx) < 54) { if (rxNearLobbyExit()) rxHotelExit(); else rxGo(RX_HL.dx, 600); return true; } return false; }
  if (sid === 7 && rxBathHit(x, y)) return true;
  if (sid === 7) { const H = rxRoomHI(rxRoomIdx(m.x)); if (Math.abs(x - (H.dx + 67)) < 14 && y > 584 && y < 616) { rxLight(); return true; } if (y > 606 && Math.abs(x - H.dx) < 50) { if (rxNearRoomExit()) rxRoomExit(); else rxGo(H.dx, 600); return true; } const b = rxBeds(H.i).find(b => x > b.x - 10 && x < b.x + b.len && y > b.y - b.w / 2 - 20 && y < b.y + b.w / 2 + 12); if (b) { const s = rxNearBedSpot(); if (s && s.bed === b) rxLieDown(s); else rxGo(b.x + 70, Math.min(604, b.y + b.w / 2 + 18), '🛏️ قرّب على السرير ودوس «نام»'); return true; } return false; }
  return false;
}
function rxLight() { RX.dark = !RX.dark; rxSnd([['square', 1200, 1200, 0.03, 0.04]]); showToast(RX.dark ? '🌙 تمّ إطفاء الضوء' : '💡 تمّ تشغيل الضوء'); rmPrompt(true); }
/* ---- أزرار القرب ---- */
function rmXKey() {
  const m = RM.me, sid = rmShopId(); let k = '|x' + sid + (rxLying(m) ? 'L' : '') + ((rmRideOf(m) || {}).k === 'boat' ? 'B' : '') + (RX.dark ? 'D' : '');
  if (sid === 0) k += (rxNearSal() ? 's' : '') + (rxNearHotel() ? 'h' : '') + (rxNearBoard() ? 'b' : '') + (rxNearDock() ? 'd' : '') + (rxNearJuice() ? 'j' : '') + (Math.hypot(m.x - RX_CAT.x, m.y - RX_CAT.y) < 90 ? 'c' : '');
  else if (sid === 5) k += (rxNearMlz() ? 'm' : '') + (rxNearSalExit() ? 'e' : '');
  else if (sid === 6) k += (rxNearBab() ? 'a' : '') + (rxNearElev() ? 'v' + (rmBalAdm() ? 'A' : '') : '') + (rxNearLobbyExit() ? 'e' : '');
  else if (sid === 7) { const s = rxNearBedSpot(); k += (s ? 'z' + s.k : '') + (rxNearRoomExit() ? 'e' : '') + (rxNearBathDoor() ? 'B' : '') + (rxNearTub() ? 'T' : '') + (rxSoaking(m) ? 'S' : ''); rxRoomGuard(); }
  return k;
}
function rxRoomGuard() { if (RM.myAdm || !RX.ht) return; const i = rxRoomIdx(RM.me.x), R = (RX.ht.mine || []).find(r => r.i === i); const now = Date.now() + (RX.ht.off || 0); if (!R || R.until <= now) { if (RX.kickT && performance.now() - RX.kickT < 3000) return; RX.kickT = performance.now(); rxRoomExit(); showToast('⌛ خلص إيجار الغرفة — تكدر تمدده من بابيتو 💜'); } }
function rmXPrompt(mk) {
  const m = RM.me, sid = rmShopId();
  if (rxLying(m)) { mk('🌅 قوم من النوم', rxWakeUp); if (sid === 7) mk(RX.dark ? '💡 تشغيل الضوء' : '🌙 إطفاء الضوء', rxLight); return true; }
  if (rxSoaking(m)) { mk('🧖 اطلع من البانيو', rxSoakOut); mk(RX.dark ? '💡 تشغيل الضوء' : '🕯️ ضوء الشموع', rxLight); return true; }
  if ((rmRideOf(m) || {}).k === 'boat') { mk('🛶 انزل من القارب', rxBoatLeave); return true; }
  if (sid === 5) { if (rxNearMlz()) mk('💄 اختاري مكياج من ملاذ', rxSalOpen); if (rxNearSalExit()) mk('🚪 اطلعي من الصالون', rxSalExit); return true; }
  if (sid === 6) { if (rxNearBab()) mk('🛎️ استأجر غرفة من بابيتو', () => rxHtOpen()); if (rxNearElev()) mk('🛗 المصعد — غرفي', () => rxHtOpen('mine')); if (rxNearElev() && rmBalAdm()) mk('👑 غرفة المشرفين', () => rxEnterRoom(RX_ADM_I)); if (rxNearLobbyExit()) mk('🚪 اطلع من الفندق', rxHotelExit); return true; }
  if (sid === 7 && rxRoomIdx(m.x) === RX_BATH_I) { if (rxNearTub()) mk('🛁 ادخل البانيو', rxSoakIn); mk(RX.dark ? '💡 تشغيل الضوء' : '🕯️ ضوء الشموع', rxLight); if (rxNearRoomExit()) mk('🚪 ارجع للغرفة الملكية', rxBathExit); return true; }
  if (sid === 7) { if (rxNearBathDoor()) mk('🛁 ادخل الحمام', rxBathEnter); const s = rxNearBedSpot(); if (s) mk('🛏️ نام بالسرير', () => rxLieDown(s)); mk(RX.dark ? '💡 تشغيل الضوء' : '🌙 إطفاء الضوء', rxLight); if (rxNearRoomExit()) mk('🛗 ارجع للوبي', rxRoomExit); return true; }
  if (sid === 0) { if (rxNearSal()) mk('💇‍♀️ ادخلي صالون ملاذ', rxSalEnter); if (rxNearHotel()) mk('🏨 ادخل فندق بابيت', rxHotelEnter); if (rxNearBoard()) mk('🔑 أسعار الغرف', rxHtPrices); if (rxNearDock()) mk('🚣 اركب قارب (مجاناً)', rxBoatBoard); if (rxNearJuice()) mk('🍹 اطلب عصير استوائي', rxJuiceMenu); if (Math.hypot(m.x - RX_CAT.x, m.y - RX_CAT.y) < 90) mk('🐱 دلّع جاسمية', rxCatPet); }
  return false;
}
function rxHtPrices() { showToast('🏨 فندق بابيت: 👤 شخص واحد يومين 25💵 • 👥 شخصين يومين 40💵 • 👨‍👩‍👧 3 أشخاص أسبوع 90💵 — ادخل واطلب من بابيتو'); }
/* ---- رسائل السيرفر ---- */
function rmXMsg(T, d) {
  if (T === 'rm_ht') { RX.ht = d; RX.ht.off = (d.now || Date.now()) - Date.now(); if (typeof d.usd === 'number' && !rmBalAdm()) { try { rmUsdSet(d.usd); } catch (e) {} } rxHtRender(); }
  else if (T === 'rm_ht_ok') { showToast('🔑 ' + (d.msg || 'تم')); RX.bab.wave = 90; rxSay(RX.bab, 'مبروك! 🎉 ' + (d.msg || '') + ' — المصعد يم اليسار 🛗', 260); rxSnd([['sine', 784, 784, 0.15, 0.05], ['sine', 988, 988, 0.15, 0.05, 0.1], ['sine', 1319, 1319, 0.3, 0.05, 0.2]]); RX.htTab = 'mine'; }
  else if (T === 'rm_ht_err') { showToast('⛔ ' + (d.error || '')); rxSay(RX.bab, d.error || '', 200); const b = document.querySelector('#htShop .htBusy'); if (b) b.classList.remove('htBusy'); rxHtRender(); }
  else if (T === 'rm_ht_inv') { showToast('🏨 ' + d.by + ' ضافك لغرفة ' + d.no + ' بفندق بابيت 🔑'); rxHtGet(); }
  else if (T === 'rm_juice_ok') rxJuiceGot(d.k);
  else if (T === 'rm_juice_err') { showToast('⛔ ' + (d.error || '')); rxSay(RX.jui, d.error || '', 200); }
}
/* ---- إضاءة الليل ---- */
function rmXHoles(hole, fl) {
  if (rxVis(RX_HT.x0 - 100, RX_HT.x1 + 100)) { hole(RX_HT.x, 540, 230, 0.95); hole(3820, 320, 280, 0.6); hole(4420, 320, 280, 0.6); hole(RX_HT.x, 150, 300, 0.6); hole(RX_HT.x, 70, 260, 0.85); hole(RX_HBOARD.x, 600, 90, 0.85); hole(4120, 850, 150, 0.85); RX_PLAZA_LAMPS.forEach(L => hole(L[0], L[1] - 74, 110, 0.9)); }
  if (rxVis(RX_SAL.x - 200, RX_SAL.x + 200)) { hole(RX_SAL.x, RX_SAL.y - 70, 175, 0.8); hole(RX_SAL.x - 70, 341, 95, 0.9); hole(RX_SAL.x + 70, 341, 95, 0.9); hole(RX_SAL.x - 70, 494, 95, 0.9); hole(RX_SAL.x + 70, 494, 95, 0.9); }
  if (rxVis(RMX0, 40)) { hole(RX_JUI.x, RX_JUI.y - 60, 150 * fl, 0.9); RX_TORCH.forEach(t => hole(t[0], t[1] - 70, 95 * fl, 0.9)); hole(RX_FALL.x, 380, 160, 0.55); hole(RX_CAT.x, RX_CAT.y - 20, 50, 0.5); }
}
function rmXGlow(c, d, fl) {
  if (rxVis(RX_HT.x0 - 100, RX_HT.x1 + 100)) { rmGlow(c, RX_HT.x, 60, 260, 0.35 * d, '190,110,255'); rmGlow(c, RX_HT.x, 540, 200, 0.3 * d, '200,140,255'); rmGlow(c, RX_HT.x0 + 7, 330, 120, 0.25 * d, '190,110,255'); rmGlow(c, RX_HT.x1 - 7, 330, 120, 0.25 * d, '190,110,255'); RX_PLAZA_LAMPS.forEach(L => rmGlow(c, L[0], L[1] - 74, 50 * fl, 0.4 * d, '220,170,255')); rmGlow(c, 4120, 860, 110, 0.3 * d, '200,140,255'); }
  if (rxVis(RX_SAL.x - 200, RX_SAL.x + 200)) rmGlow(c, RX_SAL.x, RX_SAL.y - 150, 100, 0.25 * d, '255,120,190');
  if (rxVis(RMX0, 40)) { RX_TORCH.forEach(t => rmGlow(c, t[0], t[1] - 70, 60 * fl, 0.45 * d, '255,160,60')); rmGlow(c, RX_JUI.x, RX_JUI.y - 90, 110, 0.3 * d, '255,190,110'); }
}
/* ---- موسيقى الفندق: جاز هادي (بيانو + باص) ---- */
function smStep6(i, t) {
  const st = i % 8, bar = Math.floor(i / 8) % 4, CH = [[50, 53, 57, 60, 64], [43, 53, 57, 59, 64], [48, 52, 55, 59, 62], [45, 49, 52, 55, 61]][bar];
  if (st === 0) CH.slice(1).forEach((n, k) => smSoft('sine', n + 12, t + k * 0.02, 1.9, 0.011, 0.04));
  if (st === 4) CH.slice(1).forEach((n, k) => smSoft('sine', n + 12, t + k * 0.015, 0.9, 0.007, 0.03));
  smSoft('triangle', CH[0] - 12 + [0, 3, 5, 7, 12, 7, 5, 3][st], t, 0.24, 0.05, 0.01);
  if (st % 2 === 1) smNoise(t, 0.08, 0.018, 6000);
  const MEL = [76, 0, 74, 72, 0, 69, 0, 72, 74, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 71, 0, 72, 0, 69, 0, 0, 0, 72, 0, 0, 0], mn = MEL[i % 32]; if (mn && RM_SM.loop % 2 === 0) smBell(mn, t, 0.022);
}

/* =====================================================================
   لوحات: صالون ملاذ + فندق بابيت
   ===================================================================== */
function rxCss() {
  if ($('rxCss')) return; rmSpnCss(); const sp = $('spnCss'); let base = ''; try { const all = sp.textContent, k = all.indexOf('#rmInv'); base = k > 0 ? all.slice(0, k) : all; } catch (e) {}
  const st = document.createElement('style'); st.id = 'rxCss';
  st.textContent = base.replace(/#spnShop/g, '#salonShop') + base.replace(/#spnShop/g, '#htShop') +
    '#salonShop .spC{background:linear-gradient(170deg,#fff6f2,#fbe0ea);border-color:#d8a48f;color:#5a2438}#salonShop .spH{background:linear-gradient(90deg,#8a3a6a,#d8a48f)}#salonShop .spT{display:flex;gap:6px;padding:8px 10px 0;flex-wrap:wrap}#salonShop .spT button{flex:1;border:0;border-radius:12px;padding:8px 4px;font-weight:900;font-size:12.5px;background:#f6dcc8;color:#7a2a4a}#salonShop .spT button.on{background:linear-gradient(180deg,#ff7ab8,#c42a72);color:#fff}#salonShop .spI{border-color:#f6dcc8;color:#5a2438}#salonShop .spI.sel{border-color:#c42a72;box-shadow:0 0 0 3px rgba(196,42,114,.25)}#salonShop .spF{border-top-color:#f6dcc8}#salonShop .spF button{background:#8a3a6a}#salonShop .slMir{display:flex;align-items:center;gap:10px;margin:8px 10px 0;padding:6px;border-radius:16px;background:linear-gradient(135deg,#fff,#ffe6f1);border:2px solid #f2b8cf;direction:rtl}#salonShop .slMir canvas{width:150px;height:108px;border-radius:12px;flex:none;box-shadow:0 4px 12px rgba(196,42,114,.25)}#salonShop .slMirT{display:flex;flex-direction:column;gap:4px;min-width:0}#salonShop .slMirT b{font-size:14px;color:#c42a72}#salonShop .slMirT small{font-size:12px;font-weight:800;color:#7a2a4a;line-height:1.5}#salonShop .slTry{margin:6px 10px 0;padding:6px 10px;border-radius:12px;background:#fff;border:2px dashed #ff7ab8;font-size:12px;font-weight:800;color:#c42a72;text-align:center}' +
    '#htShop .spC{background:linear-gradient(170deg,#f8f2ff,#e8dcff);border-color:#7a2ad8;color:#2a0e58}#htShop .spH{background:linear-gradient(90deg,#3a1670,#9a3aff)}#htShop .htT{display:flex;gap:6px;padding:8px 10px 0}#htShop .htT button{flex:1;border:0;border-radius:12px;padding:8px 4px;font-weight:900;font-size:13px;background:#e8dcff;color:#4a1a90}#htShop .htT button.on{background:linear-gradient(180deg,#9a3aff,#5a1aa8);color:#fff}' +
    '#htShop .htB{overflow:auto;padding:10px;display:flex;flex-direction:column;gap:10px}#htShop .htR{display:flex;gap:10px;align-items:center;background:#fff;border:2px solid #d8c8ff;border-radius:16px;padding:8px;direction:rtl}#htShop .htR canvas{width:96px;height:72px;border-radius:12px;flex:none;background:#f4ecdf}#htShop .htR .in{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}#htShop .htR b{font-size:14px}#htShop .htR small{font-size:11.5px;opacity:.8}#htShop .htR .pr{font-weight:900;color:#0f7a3d}' +
    '#htShop input{width:100%;box-sizing:border-box;background:#fff;color:#2a0e58;border:2px solid #d8c8ff;border-radius:10px;padding:6px 8px;font:inherit;font-size:12.5px;direction:rtl}#htShop .htBtn{border:0;border-radius:12px;padding:8px 10px;font-weight:900;font-size:13px;color:#fff;background:linear-gradient(180deg,#9a3aff,#5a1aa8);box-shadow:0 3px 0 #3a0e78}#htShop .htBtn.g{background:linear-gradient(180deg,#3ddc84,#16a34a);box-shadow:0 3px 0 #0e6b31}#htShop .htBtn.r{background:linear-gradient(180deg,#9aa0ae,#5b6573);box-shadow:0 3px 0 #3a424d}#htShop .htBtn:disabled{opacity:.5}#htShop .chips{display:flex;flex-wrap:wrap;gap:4px}#htShop .chip{background:#efe6ff;border-radius:10px;padding:2px 8px;font-size:11.5px;font-weight:800}#htShop .chip button{border:0;background:none;color:#c42a72;font-weight:900;padding:0 0 0 4px}#htShop .htE{text-align:center;opacity:.75;font-size:13px;padding:14px}#htShop .row{display:flex;gap:6px;align-items:center}';
  document.head.appendChild(st);
}
/* ---- صالون ملاذ ---- */
function rxSalOpen() {
  rxCss(); let P = $('salonShop'); RX.mlz.wave = 60; RM.wearPanel = 'salonShop';
  if (!P) { P = document.createElement('div'); P.id = 'salonShop'; P.innerHTML = '<div class="spC"><div class="spH"><canvas width="104" height="104"></canvas><div><b>💇‍♀️ صالون ملاذ</b><small>💄 مكياج احترافي ما تلكينه ببداية اللعبة — يطلع على وجهج والكل يشوفه ✨</small></div><span class="spCo"></span><button type="button" class="spX">✕</button></div><div class="spT"><button type="button" data-t="sl" class="on">💄 لوكات مكياج</button><button type="button" data-t="fa">💎 زينة الوجه</button><button type="button" data-t="adm" class="slAdmT">👑 للمشرفين</button></div><div class="slMir"><canvas width="360" height="260"></canvas><div class="slMirT"><b>🪞 شخصيتج بالمراية</b><small class="slMirS">👆 دوسي على أي لوك وشوفيه على وجهج هنا</small></div></div><div class="slTry" hidden></div><div class="spG"></div><div class="spF"></div></div>'; P.addEventListener('pointerdown', e => { if (e.target === P) rxSalClose(); }); P.querySelector('.spX').onclick = rxSalClose; P.querySelectorAll('.spT button').forEach(b => b.onclick = () => { RX.salTab = b.dataset.t; RX.salSel = ''; RX.slTry = ''; rmSalonRender(); }); $('rmBox').appendChild(P); }
  P.style.display = ''; const hc = P.querySelector('.spH canvas').getContext('2d'); hc.setTransform(2, 0, 0, 2, 0, 0); hc.clearRect(0, 0, 52, 52); try { AVT.drawAt(hc, RX_MLZ_AV, 26, 26 + 102 * 0.62, 137 * 0.62, { t: RM.T }); } catch (e) {}
  RX.salSel = ''; rmSalonRender(); rxSalMirLoop(); rmMlzSay('اختاري اللوك اللي يعجبج، وشوفيه على شخصيتج بالمراية قبل الشراء 🪞💖', 220);
}
/* مراية الصالون: شخصيتك الحقيقية تنرسم جوا اللوحة بالمكياج اللي دا تجربه (أو اللي لابسته) */
function rxSalMirLoop() {
  if (RX.salMirOn) return; RX.salMirOn = true;
  const step = () => {
    const P = $('salonShop'); if (!P || P.style.display === 'none') { RX.salMirOn = false; return; }
    const cv = P.querySelector('.slMir canvas'); if (cv) { const g = cv.getContext('2d'), W = 180, H = 130; g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, W, H);
      const bg = g.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, W * 0.75); bg.addColorStop(0, '#fffaf6'); bg.addColorStop(1, '#f6d2e2'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip(); const av = (RM.me && RM.me.av) || RX_FACE_AV, sl = rxSlOf(RM.me, true); window.AVT_SL = sl || { sl: '', fa: '' };
      try { AVT.drawAt(g, av, W / 2, 56 + 102 * 2.5, 137 * 2.5, { t: RM.T }); } catch (e) {} window.AVT_SL = null; g.restore();
      const T = RM.T || 0; for (let k = 0; k < 5; k++) { const a = Math.sin(T / 9 + k * 1.7); if (a > 0.55) rxStar4(g, 18 + ((k * 37) % (W - 36)), 14 + ((k * 23) % (H - 28)), 2 + a * 2, '#fff'); }
      g.strokeStyle = '#d7a400'; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4); g.strokeStyle = '#ffe680'; g.lineWidth = 1; g.strokeRect(5, 5, W - 10, H - 10); }
    const S = P.querySelector('.slMirS'); if (S) { const W0 = RM.me.wear || {}, k = RX.slTry || W0.sl || W0.fa; const txt = RX.slTry ? '✨ دا تجربين: «' + RM_WEARD[RX.slTry].n + '»' : k && RM_WEARD[k] ? '💖 لابسة: «' + RM_WEARD[k].n + '»' : '👆 دوسي على أي لوك وشوفيه على وجهج هنا'; if (S.textContent !== txt) S.textContent = txt; }
    requestAnimationFrame(step);
  }; requestAnimationFrame(step);
}
function rxSalClose() { const P = $('salonShop'); if (P) P.style.display = 'none'; if (RM.wearPanel === 'salonShop') RM.wearPanel = ''; RX.slTry = ''; }
function rmSalonRender() {
  const P = $('salonShop'); if (!P || P.style.display === 'none') return; const tab = RX.salTab === 'adm' && !rmBalAdm() ? 'sl' : (RX.salTab || 'sl'); P.querySelectorAll('.spT button').forEach(b => b.classList.toggle('on', b.dataset.t === tab)); P.querySelector('.spCo').textContent = auth ? '💵 ' + usdTxt() : 'ضيفة';
  const at = P.querySelector('.slAdmT'); if (at) at.hidden = !rmBalAdm(); const G = P.querySelector('.spG'); G.innerHTML = ''; if (tab === 'adm') { const hd = document.createElement('div'); hd.className = 'slAdmH'; hd.textContent = '👑 خانة المشرفين — 10 لوكات احترافية حصرية لبابي وبابيتو بس ✨'; G.appendChild(hd); } RM_WEAR.filter(w => tab === 'adm' ? (w.adm && rmBalAdm()) : (w.s === tab && !w.adm)).forEach(w => G.appendChild(rmWearCard(w, RX.salSel, k => { RX.salSel = k; RX.slTry = k && !rmWearOn(k) ? k : ''; rmSalonRender(); if (k) rmMlzSay('شوفي بالمراية 🪞 «' + RM_WEARD[k].n + '» شلون يطلع عليج ✨', 160); })));
  const tr = P.querySelector('.slTry'); tr.hidden = !RX.slTry; if (RX.slTry) tr.textContent = '🪞 دا تجربين «' + RM_WEARD[RX.slTry].n + '» — شوفيه على شخصيتج بالمراية فوك ☝️';
  const F = P.querySelector('.spF'); F.innerHTML = ''; const tx = document.createElement('span'); const W = RM.me.wear || {}; const on = ['sl', 'fa'].filter(s => W[s] && RM_WEARD[W[s]]).map(s => RM_WEARD[W[s]].n); tx.textContent = on.length ? '✨ حاطة: ' + on.join(' + ') : '👆 دوسي على أي لوك'; F.appendChild(tx);
  const ib = document.createElement('button'); ib.type = 'button'; ib.textContent = '🎒 أغراضي'; ib.onclick = () => { rxSalClose(); RM.invTab = 'w'; rmInvOpen(); }; F.appendChild(ib);
}
/* ---- فندق بابيت ---- */
function rxHtGet() { rmSend({ t: 'rm_ht_get' }); }
function rxHtClose() { const P = $('htShop'); if (P) P.style.display = 'none'; clearInterval(RX.htTimer); }
function rxHtOpen(tab) {
  rxCss(); let P = $('htShop'); RX.bab.wave = 60; if (tab) RX.htTab = tab; else if (!RX.htTab) RX.htTab = 'rent';
  if (!auth) { showToast('🔐 سجّل حساب حتى تستأجر غرفة 🏨'); rxSay(RX.bab, 'سجّل حساب أول وتعال أحجزلك أحلى غرفة 💜', 200); return; }
  if (!P) { P = document.createElement('div'); P.id = 'htShop'; P.innerHTML = '<div class="spC"><div class="spH"><canvas width="104" height="104"></canvas><div><b>🏨 فندق بابيت</b><small>💜 غرف فخمة: تنام وتتغطى وتشوف البحر من الشباك</small></div><span class="spCo"></span><button type="button" class="spX">✕</button></div><div class="htT"><button type="button" data-t="rent">🛎️ استأجر غرفة</button><button type="button" data-t="mine">🔑 غرفي</button></div><div class="htB"></div></div>'; P.addEventListener('pointerdown', e => { if (e.target === P) rxHtClose(); }); P.querySelector('.spX').onclick = rxHtClose; P.querySelectorAll('.htT button').forEach(b => b.onclick = () => { RX.htTab = b.dataset.t; rxHtRender(); }); $('rmBox').appendChild(P); }
  P.style.display = ''; const hc = P.querySelector('.spH canvas').getContext('2d'); hc.setTransform(2, 0, 0, 2, 0, 0); hc.clearRect(0, 0, 52, 52); try { AVT.drawAt(hc, RX_BAB_AV, 26, 26 + 102 * 0.62, 137 * 0.62, { t: RM.T }); } catch (e) {}
  rxHtRender(); rxHtGet(); clearInterval(RX.htTimer); RX.htTimer = setInterval(() => { const P2 = $('htShop'); if (!P2 || P2.style.display === 'none') { clearInterval(RX.htTimer); return; } P2.querySelectorAll('[data-until]').forEach(e => e.textContent = rxLeft(+e.dataset.until)); }, 1000);
  rxSay(RX.bab, RX.htTab === 'mine' ? 'هذي غرفك 🔑 دوس «ادخل» والمصعد يوديك 🛗' : 'اختار الغرفة اللي تعجبك 💜', 200);
}
function rxLeft(until) { const ms = until - (Date.now() + ((RX.ht && RX.ht.off) || 0)); if (ms <= 0) return '⌛ خلص'; const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3); return '⏳ باقي ' + (d ? d + ' يوم ' : '') + h + ' ساعة ' + m + ' دقيقة' + (d ? '' : ' ' + s + ' ثانية'); }
function rxRoomPic(cv, t) {
  if (t === 'adm') return rxAdmPic(cv);
  const g = cv.getContext('2d'); cv.width = 192; cv.height = 144; g.setTransform(2, 0, 0, 2, 0, 0); const W = 96, H = 72;
  let gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, '#f4ecdf'); gr.addColorStop(1, '#fbf6ee'); g.fillStyle = gr; g.fillRect(0, 0, W, 40); g.fillStyle = '#c89a6a'; g.fillRect(0, 40, W, 32);
  g.fillStyle = '#fff'; g.fillRect(36, 6, 26, 22); gr = g.createLinearGradient(0, 8, 0, 26); gr.addColorStop(0, '#6cc7ff'); gr.addColorStop(0.6, '#d6f3ff'); gr.addColorStop(0.61, '#2aa9dd'); gr.addColorStop(1, '#1a7ab0'); g.fillStyle = gr; g.fillRect(38, 8, 22, 18); g.fillStyle = '#7a3ad0'; g.fillRect(32, 4, 5, 28); g.fillRect(61, 4, 5, 28);
  const bed = (x, y, len, w, n) => { g.fillStyle = '#5a24a8'; g.fillRect(x - 3, y - w / 2 - 10, 4, w + 12); g.fillStyle = '#fff'; g.fillRect(x, y - w / 2, len, w); for (let k = 0; k < n; k++) { g.fillStyle = '#fff'; g.strokeStyle = '#d8d0e4'; g.lineWidth = 0.6; const py = y - w / 2 + 2 + k * (w / n); g.fillRect(x + 1, py, 7, w / n - 3); g.strokeRect(x + 1, py, 7, w / n - 3); } g.fillStyle = '#8a4ae8'; g.fillRect(x + 9, y - w / 2 + 1, len - 10, w - 1); g.fillStyle = '#fff'; g.fillRect(x + 9, y - w / 2 + 1, 2.5, w - 1); };
  if (t === 1) bed(14, 54, 40, 12, 1); else if (t === 2) bed(14, 54, 44, 20, 2); else { bed(8, 54, 40, 20, 2); bed(58, 54, 32, 12, 1); }
  g.fillStyle = '#141418'; g.fillRect(70, 10, 20, 13); g.fillStyle = '#5a2aa8'; g.fillRect(71, 11, 18, 11);
}
function rxHtRender() {
  const P = $('htShop'); if (!P || P.style.display === 'none') return; const tab = RX.htTab || 'rent', D = RX.ht || { mine: [], free: {} }; P.querySelectorAll('.htT button').forEach(b => { b.classList.toggle('on', b.dataset.t === tab); if (b.dataset.t === 'mine') b.textContent = '🔑 غرفي' + ((D.mine || []).length ? ' (' + D.mine.length + ')' : ''); }); P.querySelector('.spCo').textContent = '💵 ' + usdTxt();
  const B = P.querySelector('.htB'); B.innerHTML = ''; const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  if (rmBalAdm()) { const A = el('div', 'htR htAdm'), cv = el('canvas'); rxRoomPic(cv, 'adm'); A.appendChild(cv); const In = el('div', 'in'); In.append(el('b', '', '👑 غرفة المشرفين'), el('small', '', '💜 خاصة لبابي وبابيتو — دائماً متاحة، بلا إيجار ولا وقت'), el('small', '', '🛏️ سرير ملكي لشخصين • 🕯️ شموع وورد • 🌙 إطلالة على البحر')); const go = el('button', 'htBtn g', '🛗 ادخل غرفة المشرفين'); go.type = 'button'; go.onclick = () => { if (rmShopId() !== 6 && rmShopId() !== 7) { showToast('🏨 ادخل الفندق أول، والمصعد يوديك'); return; } rxEnterRoom(RX_ADM_I); }; In.appendChild(go); A.appendChild(In); B.appendChild(A); }
  if (tab === 'rent') {
    [1, 2, 3].forEach(t => { const I = RX_HT_T[t], R = el('div', 'htR'), cv = el('canvas'); rxRoomPic(cv, t); R.appendChild(cv); const In = el('div', 'in'); In.append(el('b', '', I.ic + ' ' + I.n), el('small', '', '🛏️ ' + (t === 1 ? 'سرير مفرد' : t === 2 ? 'سرير كبير لشخصين' : 'سرير كبير + سرير مفرد') + ' • 🗓️ الإيجار ' + I.d + ' • 🌊 إطلالة بحر'), el('span', 'pr', (rmBalAdm() ? '👑 مجاناً للمشرفين' : '💵 ' + I.p + ' دولار') + '  •  متوفر ' + ((D.free || {})[t] === undefined ? '…' : D.free[t]) + '/10'));
      const ins = []; for (let k = 1; k < I.cap; k++) { const ip = el('input'); ip.placeholder = '👤 اسم صاحبك ' + (I.cap > 2 ? k : '') + ' (اختياري)'; ip.maxLength = 12; ins.push(ip); In.appendChild(ip); }
      const bt = el('button', 'htBtn g', '🔑 استأجر ' + (t === 3 ? 'الجناح' : 'الغرفة')); bt.type = 'button'; bt.onclick = () => { if (!rmBalAdm() && rmUsd() < I.p) { showToast('💵 دولاراتك ما تكفي، تحتاج ' + I.p); rxSay(RX.bab, 'دولاراتك ما تكفي حبيبي، اصطاد سمك وبيعه وتعال 🎣💜', 200); return; } bt.disabled = true; bt.textContent = '⏳ لحظة...'; rmSend({ t: 'rm_ht_rent', ty: t, mates: ins.map(x => x.value.trim()).filter(Boolean) }); };
      In.appendChild(bt); R.appendChild(In); B.appendChild(R); });
    B.appendChild(el('div', 'htE', '💡 الدولارات من الصيد: بيع 15 سمكة = دولارين 💵 • تكدر تمدد الإيجار من نفس النوع'));
  } else {
    const L = D.mine || []; if (!L.length) { B.appendChild(el('div', 'htE', '🔑 ما عندك غرفة هسه — روح لتبويب «استأجر غرفة» 💜')); return; }
    L.forEach(r => { const I = RX_HT_T[r.t], R = el('div', 'htR'), cv = el('canvas'); rxRoomPic(cv, r.t); R.appendChild(cv); const In = el('div', 'in'); In.append(el('b', '', '🔑 غرفة ' + r.no + ' — ' + I.n)); const lf = el('small', ''); lf.dataset.until = r.until; lf.textContent = rxLeft(r.until); In.appendChild(lf);
      const mine = r.by === rmMe(); In.appendChild(el('small', '', mine ? '👑 الحجز باسمك' : '👋 ضيف بغرفة ' + r.by));
      if (I.cap > 1) { const ch = el('div', 'chips'); [r.by].concat(r.mates || []).forEach(n => { const cp = el('span', 'chip', n === r.by ? '👑 ' + n : '👤 ' + n); if (mine && n !== r.by) { const x = el('button', '', '✕'); x.type = 'button'; x.onclick = () => rmSend({ t: 'rm_ht_mate', i: r.i, name: n, on: 0 }); cp.appendChild(x); } ch.appendChild(cp); }); In.appendChild(ch);
        if (mine && (r.mates || []).length < I.cap - 1) { const rw = el('div', 'row'), ip = el('input'); ip.placeholder = '➕ ضيف صاحبك بالاسم'; ip.maxLength = 12; const ad = el('button', 'htBtn', 'ضيف'); ad.type = 'button'; ad.onclick = () => { const v = ip.value.trim(); if (v) rmSend({ t: 'rm_ht_mate', i: r.i, name: v, on: 1 }); }; rw.append(ip, ad); In.appendChild(rw); } }
      const rw = el('div', 'row'), go = el('button', 'htBtn g', '🛗 ادخل الغرفة'); go.type = 'button'; go.onclick = () => { if (rmShopId() !== 6 && rmShopId() !== 7) { showToast('🏨 ادخل الفندق أول، والمصعد يوديك'); return; } rxEnterRoom(r.i); };
      const cn = el('button', 'htBtn r', mine ? 'إلغاء الحجز' : 'اطلع من الغرفة'); cn.type = 'button'; cn.onclick = () => { if (cn.dataset.ok) { rmSend({ t: 'rm_ht_leave', i: r.i }); return; } cn.dataset.ok = 1; cn.textContent = '⚠️ متأكد؟ دوس مرة ثانية'; };
      rw.append(go, cn); In.appendChild(rw); R.appendChild(In); B.appendChild(R); });
  }
}

/* =====================================================================
   👑 غرفة المشرفين — خاصة لبابي وبابيتو، دائماً متاحة، سرير ملكي لشخصين
   ===================================================================== */
function rxCrown(c, x, y, s, col) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col || '#ffd23f'; c.beginPath(); c.moveTo(-10, 6); c.lineTo(-12, -6); c.lineTo(-5, 0); c.lineTo(0, -9); c.lineTo(5, 0); c.lineTo(12, -6); c.lineTo(10, 6); c.closePath(); c.fill(); c.strokeStyle = '#a07400'; c.lineWidth = 1; c.stroke(); c.fillStyle = '#e8304a'; c.beginPath(); c.arc(0, 1, 1.8, 0, 7); c.fill(); c.fillStyle = '#5ad0ff'; c.beginPath(); c.arc(-6, 2.4, 1.3, 0, 7); c.arc(6, 2.4, 1.3, 0, 7); c.fill(); c.restore(); }
function rxRoyalBed(c, b) {
  const T = RM.T, top = b.y - b.w / 2, bot = b.y + b.w / 2, L = b.len;
  c.fillStyle = 'rgba(40,0,60,.25)'; c.beginPath(); c.ellipse(b.x + L / 2, bot + 14, L / 2 + 26, 10, 0, 0, 7); c.fill();
  // أعمدة الستارة الذهبية + القبة
  const pg = c.createLinearGradient(0, top - 96, 0, bot); pg.addColorStop(0, '#fff3b0'); pg.addColorStop(0.5, '#d7a400'); pg.addColorStop(1, '#8a6400');
  [b.x - 18, b.x + L + 4].forEach(px => { rxRect(c, px, top - 92, 6, bot - top + 104, 3, pg); c.fillStyle = '#ffe680'; c.beginPath(); c.arc(px + 3, top - 94, 4.4, 0, 7); c.fill(); });
  const cg = c.createLinearGradient(0, top - 100, 0, top - 80); cg.addColorStop(0, '#8a3ae8'); cg.addColorStop(1, '#4a1290'); c.fillStyle = cg; c.beginPath(); c.moveTo(b.x - 22, top - 90); c.quadraticCurveTo(b.x + L / 2, top - 112, b.x + L + 14, top - 90); c.lineTo(b.x + L + 14, top - 82); for (let k = 0; k <= 10; k++) { const xx = b.x + L + 14 - k * (L + 36) / 10; c.quadraticCurveTo(xx + (L + 36) / 20, top - 72, xx, top - 82); } c.closePath(); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(b.x - 22, top - 92, L + 36, 2.5);
  rxCrown(c, b.x + L / 2 - 2, top - 108 + Math.sin(T / 30) * 1.2, 1.3);
  // ستاير شفافة على الزوايا
  c.save(); c.globalAlpha = 0.5; [[b.x - 16, 1], [b.x + L + 6, -1]].forEach(([cx, s]) => { const g = c.createLinearGradient(cx - 12, 0, cx + 12, 0); g.addColorStop(0, 'rgba(220,180,255,.2)'); g.addColorStop(0.5, 'rgba(240,215,255,.85)'); g.addColorStop(1, 'rgba(220,180,255,.2)'); c.fillStyle = g; c.beginPath(); c.moveTo(cx - 10, top - 84); c.lineTo(cx + 10, top - 84); c.quadraticCurveTo(cx + s * 4 + Math.sin(T / 40) * 2, top - 20, cx + 8 * s, bot + 6); c.lineTo(cx - 8 * s, bot + 6); c.closePath(); c.fill(); }); c.restore();
  // لوح الراس المبطن (مخمل بنفسجي بإطار ذهبي)
  const hg = c.createLinearGradient(0, top - 60, 0, bot); hg.addColorStop(0, '#9a4af0'); hg.addColorStop(1, '#5a1aa8'); rxRect(c, b.x - 16, top - 58, 26, b.w + 66, 10, '#d7a400'); rxRect(c, b.x - 13, top - 55, 20, b.w + 60, 8, hg);
  c.fillStyle = 'rgba(255,230,140,.75)'; for (let y = top - 48; y < bot; y += 11) for (let k = 0; k < 2; k++) { c.beginPath(); c.arc(b.x - 7 + k * 8, y + k * 5.5, 1.3, 0, 7); c.fill(); }
  rxHeart(c, b.x - 3, top - 36, 5, '#ff5aa8');
  // كومودينو ذهبي + أباجورة
  const nx = b.x - 46, ny = top + 2; rxRect(c, nx - 15, ny - 2, 30, 28, 4, '#f4ecdf'); rxRect(c, nx - 15, ny - 4, 30, 5, 2, '#d7a400'); c.fillStyle = '#d7a400'; c.fillRect(nx - 2, ny + 11, 4, 2); c.fillStyle = '#d7a400'; c.fillRect(nx - 1.5, ny - 26, 3, 22); c.fillStyle = RX.dark ? '#ffe6a8' : '#f6e8ff'; c.beginPath(); c.moveTo(nx - 11, ny - 26); c.lineTo(nx + 11, ny - 26); c.lineTo(nx + 7, ny - 42); c.lineTo(nx - 7, ny - 42); c.closePath(); c.fill(); c.strokeStyle = '#d7a400'; c.lineWidth = 1; c.stroke();
  if (RX.dark) { const g = c.createRadialGradient(nx, ny - 32, 2, nx, ny - 32, 70); g.addColorStop(0, 'rgba(255,200,240,.55)'); g.addColorStop(1, 'rgba(255,200,240,0)'); c.fillStyle = g; c.beginPath(); c.arc(nx, ny - 32, 70, 0, 7); c.fill(); }
  // الهيكل والفرشة
  rxRect(c, b.x - 2, bot - 6, L + 8, 18, 4, '#3a0a6a'); c.fillStyle = '#d7a400'; c.fillRect(b.x - 2, bot + 8, L + 8, 2.5);
  const mg = c.createLinearGradient(0, top, 0, bot); mg.addColorStop(0, '#ffffff'); mg.addColorStop(1, '#f0e6fa'); rxRect(c, b.x, top, L, b.w, 6, mg);
  // مخدات: ثنتين كبار + مخدة قلب بالنص
  b.sp.forEach((dy, i) => { const py = b.y + dy; rxRect(c, b.x + 4, py - 12, 30, 24, 8, '#fff'); c.strokeStyle = '#e0c8f4'; c.lineWidth = 1; c.beginPath(); c.roundRect ? c.roundRect(b.x + 4, py - 12, 30, 24, 8) : c.rect(b.x + 4, py - 12, 30, 24); c.stroke(); c.fillStyle = '#d7a400'; c.font = 'bold 8px Cairo, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(i ? 'بابيتو' : 'بابي', b.x + 19, py + 6); });
  rxHeart(c, b.x + 16, b.y + 1, 6, '#c03aff');
  rxRect(c, b.x + L - 2, top + 2, 10, b.w + 10, 4, '#d7a400'); rxRect(c, b.x + L, top + 4, 6, b.w + 6, 3, '#5a1aa8');
}
function rxRoyalBlanket(c, b) {
  const top = b.y - b.w / 2 + 2, bot = b.y + b.w / 2 - 1, x0 = b.x + 36, x1 = b.x + b.len - 2, T = RM.T;
  const g = c.createLinearGradient(0, top, 0, bot + 14); g.addColorStop(0, '#b06aff'); g.addColorStop(0.6, '#7a2ad8'); g.addColorStop(1, '#4a1290'); c.fillStyle = g;
  c.beginPath(); c.moveTo(x0, top); for (let x = x0; x <= x1; x += 12) c.lineTo(x, top + Math.sin(x / 9 + T / 90) * 0.8); c.lineTo(x1, bot); c.quadraticCurveTo(x1 + 2, bot + 14, x1 - 4, bot + 14); for (let x = x1 - 4; x >= x0; x -= 10) c.lineTo(x, bot + 14 + Math.sin(x / 6) * 1.6); c.lineTo(x0, bot); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x0 - 3, top - 1); c.lineTo(x0 + 10, top - 1); c.lineTo(x0 + 10, bot + 14); c.lineTo(x0 - 3, bot + 12); c.closePath(); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(x0 + 7, top, 3, bot - top + 14);
  c.save(); c.beginPath(); c.rect(x0 + 10, top - 2, x1 - x0 - 10, bot - top + 18); c.clip(); c.globalAlpha = 0.35; for (let k = 0; k < 12; k++) rxHeart(c, x0 + 22 + (k % 6) * 20 + (k > 5 ? 10 : 0), top + 14 + (k > 5 ? 26 : 0), 3.2, '#ffc8f0'); c.restore();
  c.fillStyle = '#ffd23f'; c.fillRect(x0 + 12, bot + 9, x1 - x0 - 16, 2.4); c.fillRect(x0 + 12, top + 2, x1 - x0 - 16, 1.4);
  rxTxt(c, 'B 💜 B', (x0 + x1) / 2 + 6, (top + bot) / 2 + 4, 'bold 12px Cairo, Arial', '#ffe9a8', 6, '#ff7ad8');
}
function rxAdmRoomBg(c, i) {
  const H = rxRoomHI(i), X0 = H.vx0, X1 = H.vx1, W = X1 - X0, T = RM.T, d = rxNight(), x0 = H.x0;
  // جدار مخمل بنفسجي + زخرفة ذهبية
  let g = c.createLinearGradient(0, 120, 0, 344); g.addColorStop(0, '#2a0a52'); g.addColorStop(1, '#5a1a9a'); c.fillStyle = g; c.fillRect(X0, 120, W, 224);
  c.fillStyle = 'rgba(255,215,106,.13)'; for (let x = X0 + 14; x < X1; x += 30) for (let y = 146; y < 296; y += 30) { const yy = y + ((x / 30 | 0) % 2) * 15; c.beginPath(); c.moveTo(x, yy - 6); c.lineTo(x + 5, yy); c.lineTo(x, yy + 6); c.lineTo(x - 5, yy); c.closePath(); c.fill(); }
  c.fillStyle = '#ffd23f'; c.fillRect(X0, 120, W, 8); c.fillStyle = '#a07400'; c.fillRect(X0, 128, W, 3);
  // شبابيك مقوسة: البحر بالليل/النهار + ستاير ذهبية
  [x0 + 18].forEach((wx, wi) => { const ww = 60, wy = 150, wh = 120; c.save(); c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx, wy + 30); c.quadraticCurveTo(wx + ww / 2, wy - 12, wx + ww, wy + 30); c.lineTo(wx + ww, wy + wh); c.closePath(); c.fillStyle = '#ffd23f'; c.fill(); c.clip(); g = c.createLinearGradient(0, wy, 0, wy + wh); if (d > 0.4) { g.addColorStop(0, '#0a0624'); g.addColorStop(0.6, '#2a1a5a'); g.addColorStop(0.61, '#141a4a'); g.addColorStop(1, '#0a1030'); } else { g.addColorStop(0, '#7ac8ff'); g.addColorStop(0.6, '#e0f4ff'); g.addColorStop(0.61, '#2aa9dd'); g.addColorStop(1, '#1a7ab0'); } c.fillStyle = g; c.fillRect(wx + 3, wy - 10, ww - 6, wh + 6); if (d > 0.4) { c.fillStyle = '#fff'; for (let k = 0; k < 8; k++) { c.globalAlpha = 0.5 + 0.5 * Math.sin(T / 18 + k + wi); c.fillRect(wx + 6 + rxH(k * 7 + wi) * (ww - 12), wy + 4 + rxH(k * 3 + wi) * 54, 1.5, 1.5); } c.globalAlpha = 1; if (wi) { c.fillStyle = '#f6f3d6'; c.beginPath(); c.arc(wx + 30, wy + 30, 9, 0, 7); c.fill(); c.fillStyle = '#1a0e40'; c.beginPath(); c.arc(wx + 34, wy + 27, 8, 0, 7); c.fill(); } } c.restore(); c.fillStyle = '#ffd23f'; c.fillRect(wx + ww / 2 - 1.5, wy + 14, 3, wh - 14);
    [[wx - 14, 1], [wx + ww - 2, -1]].forEach(([cx, s]) => { const cg = c.createLinearGradient(cx, 0, cx + 16, 0); cg.addColorStop(0, '#a07400'); cg.addColorStop(0.5, '#ffe680'); cg.addColorStop(1, '#a07400'); c.fillStyle = cg; c.beginPath(); c.moveTo(cx, wy - 18); c.lineTo(cx + 16, wy - 18); c.quadraticCurveTo(cx + 8 + s * 6, wy + 70, cx + 18, wy + wh + 26); c.lineTo(cx - 2, wy + wh + 26); c.closePath(); c.fill(); }); });
  rxBathDoor(c, x0);
  // صور بابي وبابيتو بإطارات ذهبية + قلب بيناتهم
  [[x0 + 112, '👑', 'بابي', '#ff7ab8'], [x0 + 344, '💜', 'بابيتو', '#a453ff']].forEach(([fx, em, nm, col], k) => { rxRect(c, fx, 170, 74, 92, 6, '#d7a400'); g = c.createLinearGradient(0, 176, 0, 256); g.addColorStop(0, col); g.addColorStop(1, '#2a0a52'); rxRect(c, fx + 5, 175, 64, 82, 4, g); rxTxt(c, em, fx + 37, 205, '26px sans-serif', '#000'); rxTxt(c, nm, fx + 37, 240, 'bold 13px Lalezar, Cairo, Arial', '#fff3c4', 6, col); });
  const hb = 1 + 0.12 * Math.sin(T / 9); c.save(); c.translate(x0 + 260, 218); c.scale(hb, hb); c.shadowColor = '#ff5ad8'; c.shadowBlur = 16; rxHeart(c, 0, 0, 13, '#ff4aa8'); c.restore();
  // لوحة نيون «غرفة المشرفين»
  const fl = 0.85 + 0.15 * Math.sin(T / 6); c.save(); try { c.direction = 'rtl'; } catch (e) {} c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 22px Lalezar, Cairo, Arial'; c.shadowColor = '#d07aff'; c.shadowBlur = 16 * fl; c.lineWidth = 4; c.strokeStyle = 'rgba(110,30,200,.9)'; c.strokeText('👑 غرفة المشرفين 👑', x0 + 260, 282); c.fillStyle = '#fbe9ff'; c.fillText('👑 غرفة المشرفين 👑', x0 + 260, 282); c.restore();
  // ثريا كريستال
  c.strokeStyle = '#d7a400'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 + 260, 131); c.lineTo(x0 + 260, 146); c.stroke(); rxRect(c, x0 + 236, 146, 48, 6, 3, '#d7a400');
  for (let k = 0; k < 9; k++) { const cx = x0 + 232 + k * 7, ln = 10 + (4 - Math.abs(k - 4)) * 4, sw = Math.sin(T / 40 + k) * 0.8; c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(cx, 152); c.lineTo(cx + sw, 152 + ln); c.stroke(); c.fillStyle = 'rgba(220,240,255,.95)'; c.beginPath(); c.moveTo(cx + sw, 152 + ln - 2); c.lineTo(cx + sw + 2, 152 + ln + 2); c.lineTo(cx + sw, 152 + ln + 6); c.lineTo(cx + sw - 2, 152 + ln + 2); c.closePath(); c.fill(); if (Math.sin(T / 8 + k * 2) > 0.8) rxStar4(c, cx + sw, 152 + ln + 2, 3, '#fff'); }
  if (!RX.dark) { g = c.createRadialGradient(x0 + 260, 160, 4, x0 + 260, 160, 170); g.addColorStop(0, 'rgba(255,240,200,.32)'); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g; c.beginPath(); c.arc(x0 + 260, 160, 170, 0, 7); c.fill(); }
  // لوح سفلي كريمي بإطار ذهبي
  c.fillStyle = '#f6ecff'; c.fillRect(X0, 300, W, 44); c.strokeStyle = '#d7a400'; c.lineWidth = 1.5; for (let x = X0 + 8; x < X1 - 30; x += 46) c.strokeRect(x, 306, 38, 30); c.fillStyle = '#d7a400'; c.fillRect(X0, 298, W, 3); c.fillRect(X0, 341, W, 3);
  // أرضية رخام فاتح بخطوط ذهبية
  g = c.createLinearGradient(0, 344, 0, 632); g.addColorStop(0, '#f4ecfa'); g.addColorStop(1, '#e0d0ee'); c.fillStyle = g; c.fillRect(X0, 344, W, 288);
  c.strokeStyle = 'rgba(200,160,40,.35)'; c.lineWidth = 1; c.beginPath(); for (let y = 344; y < 632; y += 36) { c.moveTo(X0, y); c.lineTo(X1, y); } for (let x = X0; x < X1; x += 36) { c.moveTo(x, 344); c.lineTo(x, 632); } c.stroke();
  c.strokeStyle = 'rgba(160,120,200,.18)'; c.lineWidth = 0.8; for (let k = 0; k < 14; k++) { const sx = X0 + rxH(k * 5) * W, sy = 350 + rxH(k * 9) * 270; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + 14, sy + 6, sx + 26, sy + 2); c.stroke(); }
  // سجادة حمرا من الباب + قلب ورد
  g = c.createLinearGradient(0, 540, 0, 632); g.addColorStop(0, '#a01a4a'); g.addColorStop(1, '#d02a6a'); c.fillStyle = g; c.beginPath(); c.moveTo(x0 + 236, 632); c.lineTo(x0 + 284, 632); c.lineTo(x0 + 278, 548); c.lineTo(x0 + 242, 548); c.closePath(); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(x0 + 238, 548, 2, 84); c.fillRect(x0 + 280, 548, 2, 84);
  for (let k = 0; k < 34; k++) { const a = k / 34 * Math.PI * 2, hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); c.fillStyle = k % 3 ? '#e8204a' : '#ff6a9a'; c.beginPath(); c.ellipse(x0 + 400 + hx * 2.6, 572 + hy * 1.5, 3, 2, a, 0, 7); c.fill(); }
}
function rxAdmRoomList(i) {
  const L = [], H = rxRoomHI(i), x0 = H.x0, T = () => RM.T;
  rxBeds(i).forEach(b => { L.push([b.y - b.w / 2 - 4, c => rxBedDraw(c, b)]); L.push([b.y + b.w / 2 + 3, c => rxBlanketDraw(c, b)]); });
  // تسريحة بمراية + كنبة حب + شموع + ورد
  L.push([430, c => { const x = x0 + 396, y = 430; c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x - 34, y - 2, 68, 6); rxRect(c, x - 34, y - 34, 68, 34, 4, '#f6ecff'); rxRect(c, x - 34, y - 36, 68, 5, 2, '#d7a400'); c.fillStyle = '#d7a400'; c.beginPath(); c.ellipse(x, y - 64, 20, 26, 0, 0, 7); c.fill(); const g = c.createLinearGradient(x - 16, y - 88, x + 16, y - 40); g.addColorStop(0, '#e8f4ff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#c8d8f0'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y - 64, 16, 22, 0, 0, 7); c.fill(); rxCrown(c, x, y - 92, 0.6); c.font = '9px sans-serif'; c.textAlign = 'center'; c.fillText('💄', x - 18, y - 40); c.fillText('💍', x - 4, y - 40); c.fillText('🌸', x + 14, y - 40); }]);
  L.push([598, c => { const x = x0 + 92, y = 598; c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 2, 52, 7, 0, 0, 7); c.fill(); const g = c.createLinearGradient(0, y - 46, 0, y); g.addColorStop(0, '#b06aff'); g.addColorStop(1, '#5a1aa8'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 48, y - 8); c.quadraticCurveTo(x - 50, y - 44, x - 24, y - 46); c.quadraticCurveTo(x, y - 30, x + 24, y - 46); c.quadraticCurveTo(x + 50, y - 44, x + 48, y - 8); c.closePath(); c.fill(); rxRect(c, x - 46, y - 20, 92, 16, 6, '#8a3ae8'); c.fillStyle = '#d7a400'; c.fillRect(x - 44, y - 4, 4, 6); c.fillRect(x + 40, y - 4, 4, 6); rxHeart(c, x - 14, y - 26, 5, '#ff7ab8'); rxHeart(c, x + 14, y - 26, 5, '#ffd23f'); }]);
  [[x0 + 360, 548], [x0 + 440, 548], [x0 + 360, 600], [x0 + 440, 600], [x0 + 18, 470]].forEach(([x, y], k) => L.push([y, c => { const t = RM.T; c.fillStyle = '#fff6e8'; rxRect(c, x - 3, y - 14, 6, 14, 2, '#fff6e8'); c.fillStyle = '#ffb000'; c.beginPath(); c.ellipse(x + Math.sin(t / 5 + k) * 0.6, y - 18, 2, 4 + Math.sin(t / 3 + k) * 0.6, 0, 0, 7); c.fill(); const g = c.createRadialGradient(x, y - 18, 1, x, y - 18, 22); g.addColorStop(0, 'rgba(255,200,100,.45)'); g.addColorStop(1, 'rgba(255,200,100,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 18, 22, 0, 7); c.fill(); }]));
  L.push([452, c => { const x = x0 + 44, y = 452; rxRect(c, x - 10, y - 24, 20, 24, 5, '#ffffff'); c.strokeStyle = '#d7a400'; c.lineWidth = 1.2; c.strokeRect(x - 10, y - 24, 20, 24); for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.32, fx = x + Math.cos(a) * 16, fy = y - 28 + Math.sin(a) * 14; c.strokeStyle = '#3a8a3a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 22); c.lineTo(fx, fy); c.stroke(); c.fillStyle = k % 2 ? '#e8204a' : '#ff5a8a'; c.beginPath(); c.arc(fx, fy, 3.6, 0, 7); c.fill(); } }]);
  return L;
}
function rxAdmPic(cv) {
  const g = cv.getContext('2d'); cv.width = 192; cv.height = 144; g.setTransform(2, 0, 0, 2, 0, 0); const W = 96;
  let gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, '#2a0a52'); gr.addColorStop(1, '#5a1a9a'); g.fillStyle = gr; g.fillRect(0, 0, W, 40); g.fillStyle = '#ffd23f'; g.fillRect(0, 0, W, 2); g.fillStyle = '#f4ecfa'; g.fillRect(0, 40, W, 32);
  g.fillStyle = '#d7a400'; g.fillRect(14, 6, 3, 60); g.fillRect(78, 6, 3, 60); g.fillStyle = '#8a3ae8'; g.fillRect(12, 4, 71, 5); g.fillStyle = '#5a1aa8'; g.fillRect(16, 38, 6, 26); g.fillStyle = '#fff'; g.fillRect(22, 40, 54, 24); g.fillStyle = '#9a4af0'; g.fillRect(36, 41, 40, 22); g.fillStyle = '#ffd23f'; g.fillRect(36, 41, 2, 22);
  rxCrown(g, 47, 14, 0.7); rxHeart(g, 56, 52, 4, '#ffd6f4'); g.fillStyle = '#fff'; g.fillRect(24, 43, 9, 7); g.fillRect(24, 54, 9, 7);
}

/* =====================================================================
   🛁 الحمام الملكي للمشرفين (بابي وبابيتو) — بابه داخل غرفة المشرفين
   بانيو ملكي مشترك لثنين، رغوة كثيفة تغطي لحد الرقبة (بملابسك، كلشي محتشم ولطيف) 💜
   ===================================================================== */
const RX_TUB = { dx: 260, y: 476, rx: 118, ry: 40 };   // نسبي لبداية الغرفة
const rxBathX0 = () => rxRoomHI(RX_BATH_I).x0;
const RX_SOAK_CODE = 177;   // كود البانيو (بعيد عن أكواد الألعاب 20-124)
const rxSoaking = o => (o && o.dance) === RX_SOAK_CODE;
const rxInBath = o => rmShopId(o) === 7 && rxRoomIdx((o || RM.me).x) === RX_BATH_I;
function rxTubSpots() { const x0 = rxBathX0(); return [{ x: x0 + RX_TUB.dx - 44, y: RX_TUB.y, k: 0 }, { x: x0 + RX_TUB.dx + 44, y: RX_TUB.y, k: 1 }]; }
const rxNearBathDoor = () => rmShopId() === 7 && rxRoomIdx(RM.me.x) === RX_ADM_I && rmBalAdm() && Math.abs(RM.me.x - (rxRoomHI(RX_ADM_I).x0 + 482)) < 60 && RM.me.y < 430;
const rxNearTub = () => rxInBath() && !rxSoaking(RM.me) && Math.hypot((RM.me.x - (rxBathX0() + RX_TUB.dx)) / (RX_TUB.rx + 60), (RM.me.y - RX_TUB.y) / (RX_TUB.ry + 60)) < 1;
function rxBathEnter() {
  if (!rmBalAdm()) { showToast('🛁 الحمام الملكي لبابي وبابيتو بس 💜'); return; }
  const m = RM.me; if (m.sit || m.jump) return; if (rxLying(m)) rxWakeUp(); if (m.dance) rmSetDance(0); RM.tapMk = null;
  const H = rxRoomHI(RX_BATH_I); m.x = m.tx = H.dx + (Math.random() - 0.5) * 30; m.y = m.ty = 592; m.dir = 1; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1; RX.dark = false;
  rxSnd([['sine', 660, 660, 0.12, 0.04], ['sine', 880, 880, 0.12, 0.04, 0.1], ['triangle', 520, 300, 0.35, 0.05, 0.22]]);   // صوت الباب
  showToast('🛁 أهلاً بالحمام الملكي 💜 — البانيو يكفي ثنينكم، دوس عليه وادخل'); rmPrompt(true);
}
function rxBathExit() {
  const m = RM.me; if (rxSoaking(m)) rxSoakOut(true); const H = rxRoomHI(RX_ADM_I);
  m.x = m.tx = H.x0 + 482 + (Math.random() - 0.5) * 20; m.y = m.ty = 392; m.dir = -1; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1;
  rxSnd([['triangle', 300, 520, 0.3, 0.05]]); showToast('👑 رجعت للغرفة الملكية'); rmPrompt(true);
}
function rxSoakIn() {
  const m = RM.me; if (m.sit || m.jump) return; const busy = sp => Object.values(RM.others).some(o => rxSoaking(o) && Math.hypot(o.x - sp.x, o.y - sp.y) < 10);
  const free = rxTubSpots().filter(sp => !busy(sp)).sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x))[0]; if (!free) { showToast('🛁 البانيو مليان'); return; }
  if (m.dance) rmSetDance(0); RM.tapMk = null; m.x = m.tx = free.x; m.y = m.ty = free.y; m.dir = free.k ? -1 : 1; RM.sent = ''; rmSetDance(RX_SOAK_CODE); RX.soakAt = free;
  rxSnd([['sine', 300, 120, 0.35, 0.06], ['triangle', 900, 400, 0.25, 0.03, 0.05], ['sine', 1200, 1500, 0.08, 0.02, 0.3], ['sine', 1000, 1300, 0.08, 0.02, 0.45], ['sine', 1400, 1700, 0.08, 0.02, 0.6]]);
  showToast('🫧 دخلت البانيو… مي دافي ورغوة بنفسجية 💜'); rmPrompt(true);
}
function rxSoakOut(silent) {
  const m = RM.me, x0 = rxBathX0(); rmSetDance(0); RX.soakAt = null; m.x = m.tx = Math.max(x0 + 40, Math.min(x0 + 480, m.x)); m.y = m.ty = RX_TUB.y + RX_TUB.ry + 34; RM.sent = '';
  if (!silent) { rxSnd([['sine', 180, 420, 0.3, 0.05], ['triangle', 600, 900, 0.15, 0.02, 0.1]]); showToast('🧖 طلعت وتلففت بالمنشفة البنفسجية ✨'); } rmPrompt(true);
}
function rxBathHit(x, y) {
  const m = RM.me, i = rxRoomIdx(m.x);
  if (i === RX_ADM_I) { const dx = rxRoomHI(RX_ADM_I).x0 + 482; if (Math.abs(x - dx) < 34 && y > 196 && y < 400) { if (rxNearBathDoor()) rxBathEnter(); else if (!rmBalAdm()) showToast('🛁 الحمام الملكي لبابي وبابيتو بس 💜'); else rxGo(dx, 392, '🛁 قرّب على باب الحمام'); return true; } return false; }
  if (i !== RX_BATH_I) return false; const x0 = rxBathX0(), H = rxRoomHI(RX_BATH_I);
  if (Math.abs(x - (H.dx + 67)) < 14 && y > 584 && y < 616) { rxLight(); return true; }
  if (y > 606 && Math.abs(x - H.dx) < 50) { if (rxNearRoomExit()) rxBathExit(); else rxGo(H.dx, 600); return true; }
  if (Math.hypot((x - (x0 + RX_TUB.dx)) / (RX_TUB.rx + 8), (y - RX_TUB.y + 10) / (RX_TUB.ry + 26)) < 1) { if (rxSoaking(m)) return true; if (rxNearTub()) rxSoakIn(); else rxGo(x0 + RX_TUB.dx, RX_TUB.y + RX_TUB.ry + 34, '🛁 قرّب على البانيو ودوس «ادخل البانيو»'); return true; }
  return false;
}
/* باب الحمام داخل غرفة المشرفين (مكان الشباك اليمين) */
function rxBathDoor(c, x0) {
  const T = RM.T, dx = x0 + 452, dy = 196, w = 60, h = 148;
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(dx - 4, dy + 4, w + 8, h - 4);
  rxRect(c, dx - 6, dy - 6, w + 12, h + 6, 6, '#d7a400'); c.fillStyle = '#ffe680'; c.fillRect(dx - 6, dy - 6, w + 12, 3);
  const g = c.createLinearGradient(dx, 0, dx + w, 0); g.addColorStop(0, '#4a1490'); g.addColorStop(0.5, '#8a3ae8'); g.addColorStop(1, '#4a1490'); rxRect(c, dx, dy, w, h, 4, g);
  c.strokeStyle = '#ffd23f'; c.lineWidth = 1.4; c.strokeRect(dx + 7, dy + 10, w - 14, 56); c.strokeRect(dx + 7, dy + 76, w - 14, 62);
  c.save(); c.globalAlpha = 0.5 + 0.2 * Math.sin(T / 20); const fg = c.createLinearGradient(0, dy + 12, 0, dy + 64); fg.addColorStop(0, 'rgba(240,220,255,.9)'); fg.addColorStop(1, 'rgba(190,140,255,.5)'); c.fillStyle = fg; c.fillRect(dx + 10, dy + 13, w - 20, 50); c.restore();   // زجاج مثلّج
  rxTxt(c, '🛁', dx + w / 2, dy + 40, '20px sans-serif', '#000');
  c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(dx + w - 10, dy + 86, 3.4, 0, 7); c.fill(); c.fillRect(dx + w - 13, dy + 85, 7, 2);
  const fl = 0.8 + 0.2 * Math.sin(T / 7); rxRect(c, dx - 8, dy - 28, w + 16, 20, 6, 'rgba(40,6,80,.92)'); c.save(); c.shadowColor = '#e08aff'; c.shadowBlur = 10 * fl; rxTxt(c, '💜 الحمام 💜', dx + w / 2, dy - 18, 'bold 12px Lalezar, Cairo, Arial', '#fbe9ff'); c.restore();
  if (Math.sin(T / 11) > 0.6) rxStar4(c, dx + 6 + (T % 40), dy - 30, 3, '#fff');
}
/* ---- خلفية الحمام: رخام بنفسجي ملكي + ذهب ---- */
function rxBathBg(c) {
  const H = rxRoomHI(RX_BATH_I), X0 = H.vx0, X1 = H.vx1, W = X1 - X0, T = RM.T, d = rxNight(), x0 = H.x0; let g;
  // جدار رخام بنفسجي بعروق ذهبية
  g = c.createLinearGradient(0, 120, 0, 344); g.addColorStop(0, '#3a0e6e'); g.addColorStop(0.55, '#6a2ab8'); g.addColorStop(1, '#8a4ad8'); c.fillStyle = g; c.fillRect(X0, 120, W, 224);
  c.lineWidth = 0.9; for (let k = 0; k < 18; k++) { const sx = X0 + rxH(k * 7 + 3) * W, sy = 130 + rxH(k * 11 + 1) * 200; c.strokeStyle = k % 3 ? 'rgba(255,230,160,.22)' : 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(sx, sy); c.bezierCurveTo(sx + 20, sy + 14, sx + 34, sy - 8, sx + 58, sy + 10); c.stroke(); }
  c.strokeStyle = 'rgba(255,215,106,.25)'; c.lineWidth = 1; for (let x = X0 + 10; x < X1; x += 58) { c.strokeRect(x, 140, 50, 150); }
  c.fillStyle = '#ffd23f'; c.fillRect(X0, 120, W, 8); c.fillStyle = '#a07400'; c.fillRect(X0, 128, W, 3);
  // شباك مقوس كبير بالنص: البحر + القمر/الشمس + ستاير مخمل
  const wx = x0 + 200, wy = 146, ww = 120, wh = 138; c.save(); c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx, wy + 44); c.quadraticCurveTo(wx + ww / 2, wy - 22, wx + ww, wy + 44); c.lineTo(wx + ww, wy + wh); c.closePath(); c.fillStyle = '#ffd23f'; c.fill(); c.clip();
  g = c.createLinearGradient(0, wy, 0, wy + wh); if (d > 0.4) { g.addColorStop(0, '#0a0624'); g.addColorStop(0.62, '#2a1a5a'); g.addColorStop(0.63, '#141a4a'); g.addColorStop(1, '#0a1030'); } else { g.addColorStop(0, '#ffb0d8'); g.addColorStop(0.45, '#ffd8b0'); g.addColorStop(0.62, '#fff0d0'); g.addColorStop(0.63, '#5aa0e0'); g.addColorStop(1, '#2a6ab0'); }
  c.fillStyle = g; c.fillRect(wx + 3, wy - 20, ww - 6, wh + 20);
  if (d > 0.4) { c.fillStyle = '#f6f3d6'; c.beginPath(); c.arc(wx + 84, wy + 34, 10, 0, 7); c.fill(); c.fillStyle = '#0a0624'; c.beginPath(); c.arc(wx + 88, wy + 31, 9, 0, 7); c.fill(); c.fillStyle = '#fff'; for (let k = 0; k < 12; k++) { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(T / 22 + k)); c.fillRect(wx + 6 + rxH(k + 40) * (ww - 12), wy + rxH(k * 3 + 9) * 70, 1.5, 1.5); } c.globalAlpha = 1; }
  else { const sg = c.createRadialGradient(wx + 60, wy + 84, 2, wx + 60, wy + 84, 30); sg.addColorStop(0, '#fff6c0'); sg.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = sg; c.beginPath(); c.arc(wx + 60, wy + 84, 30, 0, 7); c.fill(); }
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1; for (let k = 0; k < 4; k++) { c.beginPath(); for (let x = wx; x <= wx + ww; x += 8) c.lineTo(x, wy + 94 + k * 10 + Math.sin(x / 7 + T / 26 + k) * 1.3); c.stroke(); }
  c.restore(); c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.beginPath(); c.moveTo(wx + ww / 2, wy - 10); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + 74); c.lineTo(wx + ww, wy + 74); c.stroke();
  [[wx - 22, 1], [wx + ww + 4, -1]].forEach(([cx, sd]) => { const cg = c.createLinearGradient(cx, 0, cx + 20, 0); cg.addColorStop(0, '#3a0a7a'); cg.addColorStop(0.5, '#9a5af0'); cg.addColorStop(1, '#3a0a7a'); c.fillStyle = cg; c.beginPath(); c.moveTo(cx, wy - 26); c.lineTo(cx + 20, wy - 26); c.quadraticCurveTo(cx + 10 + sd * 7, wy + 76, cx + 22, wy + wh + 30); c.lineTo(cx - 2, wy + wh + 30); c.closePath(); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(cx + 1, wy + 66, 18, 4); });
  c.fillStyle = '#d7a400'; c.fillRect(wx - 30, wy - 30, ww + 60, 5); rxCrown(c, wx + ww / 2, wy - 36, 0.75);
  // لوحة نيون
  const fl = 0.85 + 0.15 * Math.sin(T / 6); c.save(); try { c.direction = 'rtl'; } catch (e) {} c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 17px Lalezar, Cairo, Arial'; c.shadowColor = '#e08aff'; c.shadowBlur = 14 * fl; c.lineWidth = 4; c.strokeStyle = 'rgba(110,30,200,.9)'; c.strokeText('🛁 الحمام الملكي 💜', x0 + 90, 160); c.fillStyle = '#fbe9ff'; c.fillText('🛁 الحمام الملكي 💜', x0 + 90, 160); c.restore();
  // ثريا كريستال صغيرة
  c.strokeStyle = '#d7a400'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0 + 430, 131); c.lineTo(x0 + 430, 142); c.stroke(); rxRect(c, x0 + 412, 142, 36, 5, 2, '#d7a400');
  for (let k = 0; k < 7; k++) { const cx = x0 + 410 + k * 6.6, ln = 8 + (3 - Math.abs(k - 3)) * 4, sw = Math.sin(T / 40 + k) * 0.7; c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(cx, 147); c.lineTo(cx + sw, 147 + ln); c.stroke(); c.fillStyle = 'rgba(230,210,255,.95)'; c.beginPath(); c.moveTo(cx + sw, 145 + ln); c.lineTo(cx + sw + 2, 149 + ln); c.lineTo(cx + sw, 153 + ln); c.lineTo(cx + sw - 2, 149 + ln); c.closePath(); c.fill(); if (Math.sin(T / 8 + k * 2) > 0.85) rxStar4(c, cx + sw, 149 + ln, 3, '#fff'); }
  // مراية ذهبية بيضاوية + مغسلتين (يسار)
  const mx = x0 + 90; rxRect(c, mx - 62, 300, 124, 14, 4, '#f6ecff'); rxRect(c, mx - 62, 298, 124, 4, 2, '#d7a400');
  [[mx - 30], [mx + 30]].forEach(([sx]) => { c.fillStyle = '#d7a400'; c.beginPath(); c.ellipse(sx, 236, 23, 32, 0, 0, 7); c.fill(); g = c.createLinearGradient(sx - 18, 206, sx + 18, 266); g.addColorStop(0, '#f0e8ff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#c8b8f0'); c.fillStyle = g; c.beginPath(); c.ellipse(sx, 236, 19, 28, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(sx - 10, 220); c.lineTo(sx - 4, 216); c.lineTo(sx - 12, 248); c.lineTo(sx - 15, 246); c.closePath(); c.fill(); rxCrown(c, sx, 200, 0.45); c.fillStyle = '#d7a400'; c.fillRect(sx - 2, 286, 4, 12); c.fillRect(sx - 2, 286, 9, 3); });
  rxTxt(c, '🧴', mx - 54, 292, '11px sans-serif', '#000'); rxTxt(c, '🌸', mx + 54, 290, '12px sans-serif', '#000'); rxTxt(c, '💜', mx, 252, '10px sans-serif', '#000');
  // رف مناشف + روبين معلقين باسم بابي وبابيتو (يمين)
  const tx = x0 + 400; c.fillStyle = '#d7a400'; c.fillRect(tx - 54, 196, 110, 4); [[tx - 30, '#f4eaff', 'بابي', '#ff7ab8'], [tx + 28, '#b06aff', 'بابيتو', '#ffd6f4']].forEach(([rx0, col, nm, hc], k) => { c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(rx0, 200, 3, 0, 7); c.fill(); const sw = Math.sin(T / 30 + k) * 1.2; c.fillStyle = col; c.beginPath(); c.moveTo(rx0 - 10, 202); c.lineTo(rx0 + 10, 202); c.lineTo(rx0 + 20 + sw, 280); c.lineTo(rx0 - 20 + sw, 280); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1; c.beginPath(); c.moveTo(rx0, 206); c.lineTo(rx0 + sw * 0.5, 280); c.stroke(); c.fillStyle = k ? '#8a3ae8' : '#e8d8ff'; c.beginPath(); c.moveTo(rx0 - 10, 202); c.lineTo(rx0, 226); c.lineTo(rx0 + 10, 202); c.closePath(); c.fill(); c.fillStyle = k ? '#ffd6f4' : '#a453ff'; c.fillRect(rx0 - 18 + sw, 246, 36 , 3); rxHeart(c, rx0 + sw * 0.6, 260, 4.5, hc); rxTxt(c, nm, rx0 + sw * 0.6, 274, 'bold 8px Cairo, Arial', k ? '#fff' : '#7a2ad8'); });
  [[tx - 40, 294, '#ffffff'], [tx - 12, 294, '#c89aff'], [tx + 16, 294, '#ffffff'], [tx + 44, 294, '#8a3ae8']].forEach(([fx, fy, col]) => { rxRect(c, fx - 12, fy - 10, 24, 10, 3, col); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(fx - 12, fy - 4, 24, 1.5); });
  c.fillStyle = '#d7a400'; c.fillRect(tx - 56, 296, 112, 3);
  // لوح سفلي كريمي بإطار ذهبي
  c.fillStyle = '#f6ecff'; c.fillRect(X0, 304, W, 40); c.strokeStyle = '#d7a400'; c.lineWidth = 1.4; for (let x = X0 + 8; x < X1 - 30; x += 46) c.strokeRect(x, 310, 38, 27); c.fillStyle = '#d7a400'; c.fillRect(X0, 302, W, 3); c.fillRect(X0, 341, W, 3);
  // أرضية رخام أبيض بنجوم بنفسجية وذهبية
  g = c.createLinearGradient(0, 344, 0, 632); g.addColorStop(0, '#fbf6ff'); g.addColorStop(1, '#e6d8f4'); c.fillStyle = g; c.fillRect(X0, 344, W, 288);
  c.strokeStyle = 'rgba(200,160,40,.32)'; c.lineWidth = 1; c.beginPath(); for (let y = 344; y < 632; y += 40) { c.moveTo(X0, y); c.lineTo(X1, y); } for (let x = X0; x < X1; x += 40) { c.moveTo(x, 344); c.lineTo(x, 632); } c.stroke();
  for (let y = 364; y < 632; y += 40) for (let x = X0 + 20; x < X1; x += 40) { c.fillStyle = ((x + y) / 40 | 0) % 2 ? 'rgba(138,58,232,.35)' : 'rgba(215,164,0,.4)'; c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + 4, y); c.lineTo(x, y + 4); c.lineTo(x - 4, y); c.closePath(); c.fill(); }
  // منصة البانيو (درجة رخام) + سجادة دائرية بنفسجية
  const bx = x0 + RX_TUB.dx; c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(bx, RX_TUB.y + 12, RX_TUB.rx + 40, RX_TUB.ry + 30, 0, 0, 7); c.fill();
  g = c.createLinearGradient(0, RX_TUB.y - 60, 0, RX_TUB.y + 80); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d8c8ee'); c.fillStyle = g; c.beginPath(); c.ellipse(bx, RX_TUB.y + 6, RX_TUB.rx + 36, RX_TUB.ry + 26, 0, 0, 7); c.fill(); c.strokeStyle = '#d7a400'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#7a2ad8'; c.beginPath(); c.ellipse(bx, 592, 62, 14, 0, 0, 7); c.fill(); c.strokeStyle = '#ffd23f'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(bx, 592, 54, 11, 0, 0, 7); c.stroke(); rxHeart(c, bx, 590, 5, '#ffd6f4');
}
/* البانيو: ورا (الحافة الخلفية + المي) وكدام (الحافة الأمامية + الأرجل الذهبية) */
function rxTubBack(c) {
  const T = RM.T, bx = rxBathX0() + RX_TUB.dx, by = RX_TUB.y, rx = RX_TUB.rx, ry = RX_TUB.ry; let g;
  // الحنفية الذهبية الملكية + المي النازلة
  rxRect(c, bx - 5, by - ry - 52, 10, 40, 3, '#d7a400'); c.fillStyle = '#ffe680'; c.fillRect(bx - 4, by - ry - 52, 3, 40);
  c.strokeStyle = '#d7a400'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by - ry - 50); c.quadraticCurveTo(bx, by - ry - 66, bx + 16, by - ry - 62); c.stroke(); c.lineCap = 'butt';
  [-14, 14].forEach(ox => { c.fillStyle = '#d7a400'; c.beginPath(); c.arc(bx + ox, by - ry - 30, 5, 0, 7); c.fill(); c.fillStyle = ox < 0 ? '#ff7ab8' : '#a453ff'; c.beginPath(); c.arc(bx + ox, by - ry - 30, 2.2, 0, 7); c.fill(); });
  c.save(); c.globalAlpha = 0.75; g = c.createLinearGradient(bx + 14, 0, bx + 20, 0); g.addColorStop(0, 'rgba(210,190,255,.4)'); g.addColorStop(0.5, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(210,190,255,.4)'); c.fillStyle = g; c.fillRect(bx + 14, by - ry - 60, 5, 44); c.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { const u = ((T / 14 + k / 4) % 1); c.fillRect(bx + 15.5, by - ry - 60 + u * 44, 2, 4); } c.restore();
  // حافة خلفية + المي
  g = c.createLinearGradient(0, by - ry - 10, 0, by + ry); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e8dcf8'); c.fillStyle = g; c.beginPath(); c.ellipse(bx, by, rx + 10, ry + 10, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#d7a400'; c.beginPath(); c.ellipse(bx, by, rx + 10, ry + 10, 0, Math.PI, 0); c.ellipse(bx, by, rx + 7, ry + 7, 0, 0, Math.PI, true); c.fill();
  g = c.createLinearGradient(0, by - ry, 0, by + ry); g.addColorStop(0, '#c8a8ff'); g.addColorStop(0.5, '#b088f8'); g.addColorStop(1, '#9a6af0'); c.fillStyle = g; c.beginPath(); c.ellipse(bx, by, rx, ry, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(bx + Math.sin(T / 40 + k) * 6, by + 4, rx * (0.3 + k * 0.17), ry * (0.3 + k * 0.17), 0, 0.2, Math.PI - 0.2); c.stroke(); }
  // رغوة كثيفة + ورد عائم
  for (let k = 0; k < 30; k++) { const a = rxH(k * 13 + 2) * Math.PI * 2, rr = Math.sqrt(rxH(k * 7 + 5)), fx = bx + Math.cos(a) * rx * 0.86 * rr, fy = by + Math.sin(a) * ry * 0.7 * rr, s = 6 + rxH(k * 3) * 8 + Math.sin(T / 18 + k) * 0.8; c.fillStyle = k % 4 ? 'rgba(255,255,255,.92)' : 'rgba(240,220,255,.95)'; c.beginPath(); c.arc(fx, fy, s, 0, 7); c.fill(); }
  for (let k = 0; k < 9; k++) { const a = rxH(k * 19 + 8) * Math.PI * 2, fx = bx + Math.cos(a) * rx * 0.7 + Math.sin(T / 50 + k) * 3, fy = by + Math.sin(a) * ry * 0.55; c.fillStyle = k % 3 ? '#e8204a' : '#ff6aa8'; c.beginPath(); c.ellipse(fx, fy, 3.4, 2, a, 0, 7); c.fill(); }
  // بطة ملكية مطاطية 🦆👑
  const dx = bx + rx * 0.55 + Math.sin(T / 60) * 10, dy = by + 6 + Math.sin(T / 22) * 1.2; c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(dx, dy, 9, 6, 0, 0, 7); c.fill(); c.beginPath(); c.arc(dx - 6, dy - 7, 5, 0, 7); c.fill(); c.fillStyle = '#ff8a00'; c.beginPath(); c.moveTo(dx - 11, dy - 8); c.lineTo(dx - 16, dy - 6); c.lineTo(dx - 11, dy - 5); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(dx - 7, dy - 8, 1, 0, 7); c.fill(); rxCrown(c, dx - 6, dy - 14, 0.22);
}
function rxTubFront(c) {
  const T = RM.T, bx = rxBathX0() + RX_TUB.dx, by = RX_TUB.y, rx = RX_TUB.rx, ry = RX_TUB.ry; let g;
  // الأرجل الذهبية (مخالب أسد)
  [[-rx * 0.72, 1], [rx * 0.72, -1]].forEach(([ox, s]) => { c.fillStyle = '#b08000'; c.beginPath(); c.ellipse(bx + ox, by + ry + 34, 9, 5, 0, 0, 7); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(bx + ox - 6, by + ry + 14); c.lineTo(bx + ox + 6, by + ry + 14); c.lineTo(bx + ox + 4 * s, by + ry + 34); c.lineTo(bx + ox - 4 * s, by + ry + 34); c.closePath(); c.fill(); });
  // جسم البانيو البنفسجي اللامع (الجهة الأمامية)
  g = c.createLinearGradient(bx - rx, 0, bx + rx, 0); g.addColorStop(0, '#4a1490'); g.addColorStop(0.3, '#9a5af0'); g.addColorStop(0.5, '#c89aff'); g.addColorStop(0.7, '#9a5af0'); g.addColorStop(1, '#4a1490');
  c.fillStyle = g; c.beginPath(); c.ellipse(bx, by, rx + 10, ry + 10, 0, 0, Math.PI); c.lineTo(bx - rx - 10, by); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(bx - rx - 10, by); c.ellipse(bx, by, rx + 10, ry + 10, 0, Math.PI, 0, true); c.lineTo(bx + rx + 4, by + 10); c.ellipse(bx, by + 18, rx + 4, ry + 8, 0, 0, Math.PI); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(bx - rx * 0.35, by + ry * 0.7, rx * 0.35, 4, 0, 0, 7); c.fill();
  // الحافة الأمامية الذهبية + زخرفة قلوب وتيجان
  c.strokeStyle = '#ffd23f'; c.lineWidth = 3.4; c.beginPath(); c.ellipse(bx, by, rx + 8.5, ry + 8.5, 0, 0, Math.PI); c.stroke(); c.strokeStyle = '#a07400'; c.lineWidth = 1; c.beginPath(); c.ellipse(bx, by + 2, rx + 7, ry + 7, 0, 0.1, Math.PI - 0.1); c.stroke();
  c.strokeStyle = 'rgba(255,215,106,.85)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(bx, by + 12, rx - 6, ry + 4, 0, 0.35, Math.PI - 0.35); c.stroke();
  rxCrown(c, bx, by + ry + 18, 0.5); [-0.55, 0.55].forEach(o => rxHeart(c, bx + rx * o, by + ry + 14 - Math.abs(o) * 4, 4.5, '#ffd6f4'));
  // رغوة طافحة على الحافة
  for (let k = 0; k < 10; k++) { const a = 0.25 + k / 9 * (Math.PI - 0.5), fx = bx + Math.cos(a) * (rx + 4), fy = by + Math.sin(a) * (ry + 4) - 4, s = 5 + rxH(k * 5) * 4 + Math.sin(T / 15 + k) * 0.6; c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(fx, fy, s, 0, 7); c.fill(); }
  // بخار طالع + فقاعات تطير + قلوب صغار
  c.save(); for (let k = 0; k < 6; k++) { const u = ((T / 160 + k / 6) % 1), sx = bx - rx * 0.6 + k * rx * 0.24 + Math.sin(T / 40 + k) * 8; c.globalAlpha = Math.sin(u * Math.PI) * 0.28; c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(sx, by - 10 - u * 90, 10 + u * 14, 6 + u * 8, 0, 0, 7); c.fill(); }
  for (let k = 0; k < 7; k++) { const u = ((T / 120 + k / 7) % 1), sx = bx - rx * 0.7 + rxH(k * 9) * rx * 1.4 + Math.sin(T / 20 + k) * 5, sy = by - 6 - u * 120; c.globalAlpha = Math.sin(u * Math.PI) * 0.85; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1; c.fillStyle = 'rgba(220,190,255,.25)'; c.beginPath(); c.arc(sx, sy, 3 + rxH(k) * 4, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(sx - 1.2, sy - 1.2, 0.9, 0, 7); c.fill(); }
  if (Object.values(RM.others).some(rxSoaking) || rxSoaking(RM.me)) for (let k = 0; k < 3; k++) { const u = ((T / 140 + k / 3) % 1); c.globalAlpha = Math.sin(u * Math.PI); rxHeart(c, bx - 20 + k * 20 + Math.sin(T / 15 + k) * 6, by - 40 - u * 60, 4 + u * 3, k === 1 ? '#a453ff' : '#ff7ab8'); }
  c.restore();
}
function rxBathList() {
  const L = [], x0 = rxBathX0(), by = RX_TUB.y;
  L.push([by - RX_TUB.ry - 12, rxTubBack]); L.push([by + RX_TUB.ry + 12, rxTubFront]);
  // شموع على المنصة + ورد بأصص ذهبية + أوركيد بنفسجي
  [[x0 + 104, 468], [x0 + 118, 500], [x0 + 402, 468], [x0 + 388, 500], [x0 + 150, 540], [x0 + 370, 540]].forEach(([x, y], k) => L.push([y, c => { const t = RM.T; rxRect(c, x - 4, y - 16, 8, 16, 2, k % 2 ? '#e8d8ff' : '#fff6e8'); c.fillStyle = '#ffb000'; c.beginPath(); c.ellipse(x + Math.sin(t / 5 + k) * 0.7, y - 20, 2.2, 4.4 + Math.sin(t / 3 + k) * 0.6, 0, 0, 7); c.fill(); c.fillStyle = '#fff6c0'; c.beginPath(); c.ellipse(x, y - 19, 0.9, 2, 0, 0, 7); c.fill(); const g = c.createRadialGradient(x, y - 20, 1, x, y - 20, 26); g.addColorStop(0, 'rgba(255,200,120,.45)'); g.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 20, 26, 0, 7); c.fill(); }]));
  [[x0 + 30, 420], [x0 + 490, 420]].forEach(([x, y], k) => L.push([y, c => { const t = RM.T; c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x, y + 1, 16, 4, 0, 0, 7); c.fill(); const g = c.createLinearGradient(x - 14, 0, x + 14, 0); g.addColorStop(0, '#a07400'); g.addColorStop(0.5, '#ffe680'); g.addColorStop(1, '#a07400'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 14, y - 26); c.lineTo(x + 14, y - 26); c.lineTo(x + 10, y); c.lineTo(x - 10, y); c.closePath(); c.fill();
    for (let j = 0; j < 6; j++) { const a = -Math.PI / 2 + (j - 2.5) * 0.36 + Math.sin(t / 50 + j) * 0.03; c.strokeStyle = '#2a7a3a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y - 26); c.quadraticCurveTo(x + Math.cos(a) * 18, y - 26 + Math.sin(a) * 30, x + Math.cos(a) * 30, y - 26 + Math.sin(a) * 52); c.stroke(); const fx = x + Math.cos(a) * 30, fy = y - 26 + Math.sin(a) * 52; for (let q = 0; q < 5; q++) { const qa = q / 5 * Math.PI * 2 + t / 90; c.fillStyle = q % 2 ? '#c89aff' : '#9a4af0'; c.beginPath(); c.ellipse(fx + Math.cos(qa) * 3.6, fy + Math.sin(qa) * 3.6, 3.2, 2, qa, 0, 7); c.fill(); } c.fillStyle = '#ffe680'; c.beginPath(); c.arc(fx, fy, 1.6, 0, 7); c.fill(); } }]));
  // سبت صغير بيه شامبو وصابون ملكي
  L.push([600, c => { const x = x0 + 470, y = 600; rxRect(c, x - 18, y - 14, 36, 14, 4, '#d7a400'); c.fillStyle = '#a07400'; for (let k = -14; k < 16; k += 5) c.fillRect(x + k, y - 13, 1, 12); rxRect(c, x - 13, y - 30, 9, 16, 2, '#b06aff'); rxRect(c, x - 2, y - 26, 8, 12, 2, '#ff9ad2'); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x + 11, y - 17, 6, 3.4, 0, 0, 7); c.fill(); rxHeart(c, x + 11, y - 18, 2.2, '#a453ff'); }]);
  return L;
}
function rxBathFg(c) {
  const H = rxRoomHI(RX_BATH_I), X0 = H.vx0, X1 = H.vx1, D = H.dx, T = RM.T;
  if (RX.dark) { c.save(); c.fillStyle = 'rgba(14,4,36,.6)'; c.fillRect(X0, 120, X1 - X0, 512); c.globalCompositeOperation = 'lighter'; [[H.x0 + 104, 448], [H.x0 + 402, 448], [H.x0 + 150, 520], [H.x0 + 370, 520], [H.x0 + RX_TUB.dx, RX_TUB.y - 10]].forEach(([x, y], k) => { const r = k === 4 ? 150 : 80 + Math.sin(T / 6 + k) * 4, g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, k === 4 ? 'rgba(190,120,255,.28)' : 'rgba(255,190,110,.38)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }); c.restore(); }
  c.fillStyle = '#5a1aa8'; c.fillRect(X0, 612, D - 46 - X0, 20); c.fillRect(D + 46, 612, X1 - D - 46, 20); c.fillStyle = '#ffd23f'; c.fillRect(X0, 612, X1 - X0, 3);
  c.fillStyle = 'rgba(240,230,255,.6)'; c.fillRect(D - 46, 614, 92, 18); rxRect(c, D - 50, 594, 100, 14, 4, '#7a2ad8'); rxTxt(c, '⬇ للغرفة الملكية', D, 601, 'bold 9px Cairo, Arial', '#fff');
  rxRect(c, D + 60, 590, 14, 20, 3, '#fff'); c.fillStyle = RX.dark ? '#888' : '#ffd23f'; c.fillRect(D + 64, RX.dark ? 600 : 594, 6, 6);
}
/* ---- رسم اللي بالبانيو: بس الراس والرقبة فوك المي، والباقي تحت الرغوة (بملابسهم) ---- */
function rxDrawSoak(c, o, me, fn) {
  const e = o.dance, tg = window.rmTag, bb = window.rmBub, wl = RX_TUB.y - 6, S = 40, T = RM.T; o.dance = 0; window.rmTag = () => {}; window.rmBub = () => {};
  c.save(); c.beginPath(); c.rect(o.x - 60, wl - 200, 120, 200); c.clip(); c.translate(0, S + Math.sin(T / 24 + (o.x | 0)) * 0.8); try { fn(); } catch (er) {} finally { c.restore(); window.rmTag = tg; window.rmBub = bb; o.dance = e; }
  // طوق رغوة حول الرقبة + منشفة صغيرة بنفسجية على الكتف
  for (let k = 0; k < 9; k++) { const ox = (k - 4) * 5.4, s = 5.5 + rxH(k * 7 + (o.x | 0)) * 3 + Math.sin(T / 14 + k) * 0.5; c.fillStyle = k % 3 ? 'rgba(255,255,255,.97)' : 'rgba(238,222,255,.97)'; c.beginPath(); c.arc(o.x + ox, wl - 1 + Math.abs(k - 4) * 0.8, s, 0, 7); c.fill(); }
  c.fillStyle = '#b06aff'; c.beginPath(); c.ellipse(o.x + (o.dir || 1) * 12, wl - 4, 8, 3.4, 0.3 * (o.dir || 1), 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(o.x + (o.dir || 1) * 12 - 5, wl - 5, 10, 1);
  const nm = me ? rmMe() : o.name, hy = o.y + S - AV_H * 1.26; try { rmTagDraw(c, o.x, hy - 2, '🫧 ' + nm, me ? 'rgba(122,42,216,.92)' : 'rgba(60,40,110,.85)'); } catch (er) {}
  try { bb(c, nm, o.x, hy - 12, me ? RM.myAdm : o.adm); if (!me && typeof rmTyping === 'function') rmTyping(c, nm, o.x, hy - 12); } catch (er) {}
}
(function () {
  const dM = rmDrawMe; rmDrawMe = function (c, st) { const m = RM.me; if (rxSoaking(m) && rxInBath(m)) return rxDrawSoak(c, m, true, () => dM(c, st)); return dM(c, st); };
  const dO = rmDrawOther; rmDrawOther = function (c, o) { if (rxSoaking(o) && rxInBath(o)) return rxDrawSoak(c, o, false, () => dO(c, o)); return dO(c, o); };
  const up = rmUpdMe; rmUpdMe = function () {
    const m = RM.me; if (rxSoaking(m)) { m.tx = m.x; m.ty = m.y; return { mv: false, air: 0, jp: 0 }; }
    const st = up();
    if (rxInBath(m)) { const bx = rxBathX0() + RX_TUB.dx, ex = (m.x - bx) / (RX_TUB.rx + 16), ey = (m.y - RX_TUB.y) / (RX_TUB.ry + 18), dd = Math.hypot(ex, ey); if (dd < 1) { const a = Math.atan2(ey, ex); m.x = bx + Math.cos(a) * (RX_TUB.rx + 17); m.y = RX_TUB.y + Math.sin(a) * (RX_TUB.ry + 19); if (Math.hypot((m.tx - bx) / (RX_TUB.rx + 16), (m.ty - RX_TUB.y) / (RX_TUB.ry + 18)) < 1) { m.tx = m.x; m.ty = m.y; } } m.y = Math.max(m.y, 360); }   // البانيو صلب، ما تمشي بداخله
    return st;
  };
  const wk = rmWalkTo; rmWalkTo = function (x, y) { if (rxSoaking(RM.me)) rxSoakOut(); return wk(x, y); };
})();
