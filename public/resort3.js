/* =====================================================================
   توسعة المنتجع 3 🌉🌳✈️
   - جسر مشاة فوق الشارعين يوديك للجهة الثانية
   - «حديقة الأمل» 🌿: زرع، كراسي وجلسات، ممرات، باب، أضوية بالليل، فراشات، عصافير غريبة، أشجار مختلفة
   - تمثال «بجعة الحب الأبدي» 🦢❤️ بالنص: لايك لكل حساب ومحفوظ للأبد بالسيرفر
   - يمين المنتجع: «مطار بابيت الدولي» ✈️ + مركز حجز التذاكر + القبطان + رحلة بالطيارة للمنتجع الجديد
   كل الرسم يصير بس للي ظاهر بالشاشة، والأشياء الثابتة تنرسم مرة وحدة كصور جاهزة حتى تبقى اللعبة خفيفة.
   ===================================================================== */
const R3 = { path: [], swanN: null, swanMe: 0, swanAsk: 0, swanFx: [], tk: 0, apAsk: 0, price: 5, autoFly: false, flying: null, cap: { say: null, wave: 0 }, cap2: { say: null, wave: 0 }, agt: { say: null, wave: 0 }, hand: null };
const R3_BR = { x0: 1262, x1: 1338, cx: 1300, yN: 1196, yS: 1488, bandA: 1228, bandB: 1462 };   // جسر المشاة
const R3_BR2 = { x0: 3232, x1: 3308, cx: 3270, yN: 1196, yS: 1488, bandA: 1228, bandB: 1462, nm: '🌳 جسر المرج الأخضر' };   // جسر ثاني ياخذك للمرج
const R3_BRS = [R3_BR, R3_BR2], r3BrAt = x => R3_BRS.find(B => x >= B.x0 + 6 && x <= B.x1 - 6), r3BrNear = x => R3_BRS.reduce((a, b) => Math.abs(b.cx - x) < Math.abs(a.cx - x) ? b : a);
const R3_G2 = { y: 2060 };   // باب الحديقة الثاني (يمين) يطلعك للمرج
const R3_G = { x0: 300, x1: 2300, y0: 1540, y1: 2500, gx: 1300, gw: 56 };                           // حديقة الأمل
const R3_POND = { x: 1300, y: 2010, rx: 168, ry: 76 };                                               // البركة وبنصها البجعة
const R3_AP = { x0: 4760, x1: 7800 };                                                                // المطار
const R3_TERM = { x0: 4900, x1: 5760, y: 640, top: 404 };
const R3_TWR = { x: 5930, y: 640 };
const R3_TKT = { x: 5360, y: 830 };      // مركز حجز التذاكر (الموظفة ورا الكاونتر)
const R3_PLANE = { x: 6560, y: 724 };    // الطيارة اللي تطير للمنتجع الجديد
const R3_CAP = { x: 6520, y: 760 };      // القبطان يم الدرج
const R3_N = { x0: 75000, x1: 76600 };   // الشمال (فاضي حالياً)
const R3_NHI = { x0: R3_N.x0, x1: R3_N.x1, dx: R3_N.x0 + 400, vx0: R3_N.x0 - 15, vx1: R3_N.x1 + 15, vy0: 0, vy1: 1040 };
const R3_CAP2 = { x: R3_N.x0 + 330, y: 620 };
const r3VisY = (y0, y1) => y1 > RM.vy0 && y0 < RM.vy1;
const r3Vis = (x0, x1, y0, y1) => rxVis(x0, x1) && r3VisY(y0, y1);
const r3InG = (x, y) => x > R3_G.x0 + 10 && x < R3_G.x1 - 10 && y > R3_G.y0 && y < R3_G.y1 - 6;
const r3InPond = (x, y, k) => { const dx = (x - R3_POND.x) / R3_POND.rx, dy = (y - R3_POND.y) / R3_POND.ry; return dx * dx + dy * dy < (k || 1); };
const r3Night = () => (RM.dn && RM.dn.d) || 0;
Object.assign(RM_SHOP_NM, { 8: 'الشمال ❄️' });

/* ===================== صور جاهزة (تنرسم مرة وحدة) ===================== */
function r3Spr(w, h, ox, oy, fn) { const cv = document.createElement('canvas'), s = 2; cv.width = w * s; cv.height = h * s; const g = cv.getContext('2d'); g.scale(s, s); g.translate(ox, oy); try { fn(g); } catch (e) {} return { cv, w, h, ox, oy }; }
function r3Put(c, S, x, y, sc) { sc = sc || 1; c.drawImage(S.cv, x - S.ox * sc, y - S.oy * sc, S.w * sc, S.h * sc); }
const r3Blob = (g, pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(p => { g.moveTo(p[0] + p[2], p[1]); g.arc(p[0], p[1], p[2], 0, 7); }); g.fill(); };
const R3S = {};
(function () {
  const shadow = (g, rx) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0, 0, rx, rx * 0.3, 0, 0, 7); g.fill(); };
  const trunk = (g, h, w, col) => { g.fillStyle = col || '#7a4a24'; g.beginPath(); g.moveTo(-w, 0); g.quadraticCurveTo(-w * 0.6, -h * 0.5, -w * 0.45, -h); g.lineTo(w * 0.45, -h); g.quadraticCurveTo(w * 0.6, -h * 0.5, w, 0); g.closePath(); g.fill(); };
  // شجرة مدورة خضرة
  R3S.round = r3Spr(120, 150, 60, 140, g => { shadow(g, 40); trunk(g, 60, 8); r3Blob(g, [[-26, -70, 26], [24, -72, 26], [0, -96, 32], [-14, -60, 22], [16, -58, 22]], '#2f8f3a'); r3Blob(g, [[-18, -82, 18], [10, -104, 18], [24, -80, 14]], '#43b04f'); r3Blob(g, [[-10, -108, 8], [-28, -78, 7], [20, -92, 7]], 'rgba(255,255,255,.18)'); });
  // ساكورا وردية
  R3S.blossom = r3Spr(130, 150, 65, 140, g => { shadow(g, 42); trunk(g, 56, 7, '#5a3424'); g.strokeStyle = '#5a3424'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -50); g.lineTo(-26, -76); g.moveTo(2, -54); g.lineTo(28, -80); g.stroke(); r3Blob(g, [[-30, -80, 24], [30, -82, 24], [0, -100, 30], [-8, -70, 20], [18, -66, 18]], '#ff9cc8'); r3Blob(g, [[-20, -92, 14], [14, -108, 14], [32, -86, 10], [-36, -74, 9]], '#ffc4de'); g.fillStyle = '#fff'; [[-12, -104], [20, -96], [-30, -86], [8, -78], [34, -74], [-4, -116]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 2, 0, 7); g.fill(); }); });
  // سرو طويل
  R3S.cypress = r3Spr(70, 190, 35, 180, g => { shadow(g, 20); trunk(g, 20, 5); g.fillStyle = '#1f6b3a'; g.beginPath(); g.moveTo(0, -176); g.quadraticCurveTo(26, -100, 18, -18); g.quadraticCurveTo(0, -8, -18, -18); g.quadraticCurveTo(-26, -100, 0, -176); g.fill(); g.fillStyle = '#2f8a4a'; g.beginPath(); g.moveTo(0, -170); g.quadraticCurveTo(14, -100, 8, -24); g.quadraticCurveTo(-4, -60, -2, -150); g.fill(); });
  // قيقب برتقالي/أحمر
  R3S.maple = r3Spr(124, 150, 62, 140, g => { shadow(g, 40); trunk(g, 58, 8, '#6a3a1a'); r3Blob(g, [[-26, -72, 25], [26, -74, 25], [0, -98, 30], [-12, -60, 20], [14, -60, 20]], '#e8572a'); r3Blob(g, [[-18, -86, 16], [12, -106, 16], [28, -80, 12]], '#ff8a3a'); r3Blob(g, [[-30, -66, 9], [6, -84, 10]], '#ffc04a'); });
  // جاكاراندا بنفسجية
  R3S.jaca = r3Spr(136, 150, 68, 140, g => { shadow(g, 44); trunk(g, 60, 7, '#4a3020'); r3Blob(g, [[-34, -76, 22], [32, -78, 22], [0, -98, 30], [-14, -64, 18], [16, -62, 18]], '#8a5ad8'); r3Blob(g, [[-22, -90, 14], [14, -110, 14], [36, -84, 10], [-40, -70, 8]], '#b48af0'); });
  // صفصاف متدلي
  R3S.willow = r3Spr(140, 160, 70, 150, g => { shadow(g, 46); trunk(g, 70, 8, '#6a4a2a'); r3Blob(g, [[0, -100, 34], [-28, -88, 24], [28, -88, 24]], '#5aa84a'); g.strokeStyle = '#4a9a3e'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = -6; i <= 6; i++) { const x = i * 9; g.beginPath(); g.moveTo(x, -96 + Math.abs(i) * 3); g.quadraticCurveTo(x + 6, -60, x + 2, -26 + Math.abs(i) * 4); g.stroke(); } g.strokeStyle = '#7acc5a'; g.lineWidth = 1.6; for (let i = -5; i <= 5; i++) { const x = i * 10 + 4; g.beginPath(); g.moveTo(x, -98); g.quadraticCurveTo(x + 4, -64, x, -36 + Math.abs(i) * 4); g.stroke(); } });
  // شجيرة + ورد
  R3S.bush = r3Spr(70, 50, 35, 42, g => { shadow(g, 26); r3Blob(g, [[-14, -14, 14], [12, -14, 14], [0, -24, 15]], '#3a9a44'); ['#ff5a8a', '#ffd23f', '#fff', '#ff8ac0', '#c06aff'].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(-16 + i * 8, -20 - (i % 2) * 8, 3, 0, 7); g.fill(); }); });
  R3S.rock = r3Spr(50, 30, 25, 24, g => { shadow(g, 18); g.fillStyle = '#8e939c'; g.beginPath(); g.ellipse(0, -8, 17, 11, 0, Math.PI, 0); g.lineTo(17, -2); g.lineTo(-17, -2); g.fill(); g.fillStyle = '#b4b9c2'; g.beginPath(); g.ellipse(-4, -12, 8, 5, -0.3, 0, 7); g.fill(); });
  // عمود ضوء الحديقة (فكتوري)
  R3S.lamp = r3Spr(40, 110, 20, 104, g => { g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0, 0, 10, 3.5, 0, 0, 7); g.fill(); g.fillStyle = '#2a2f3a'; g.fillRect(-5, -8, 10, 8); g.fillRect(-2, -78, 4, 72); g.fillRect(-7, -82, 14, 4); g.fillStyle = '#ffe9a8'; g.beginPath(); g.moveTo(-8, -82); g.lineTo(8, -82); g.lineTo(10, -98); g.lineTo(-10, -98); g.closePath(); g.fill(); g.strokeStyle = '#2a2f3a'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#2a2f3a'; g.beginPath(); g.moveTo(-12, -98); g.lineTo(12, -98); g.lineTo(0, -106); g.closePath(); g.fill(); });
  // سياج الحديقة (قطعة)
  R3S.fence = r3Spr(60, 34, 0, 30, g => { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, -2, 60, 4); g.fillStyle = '#2f6b3a'; g.beginPath(); g.roundRect ? g.roundRect(0, -16, 60, 14, 6) : g.rect(0, -16, 60, 14); g.fill(); g.fillStyle = '#3f8a4a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(5 + i * 10, -16, 6, 0, 7); g.fill(); } g.fillStyle = '#ffffff'; [10, 34, 52].forEach(x => { g.beginPath(); g.arc(x, -14, 1.6, 0, 7); g.fill(); }); g.fillStyle = '#ff7ab0'; [22, 44].forEach(x => { g.beginPath(); g.arc(x, -18, 1.8, 0, 7); g.fill(); }); });
})();

/* نقشة عشب (تنرسم مرة وحدة وتتكرر) */
function r3Pat(c, col1, col2, seed) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 96; const g = cv.getContext('2d'); g.fillStyle = col1; g.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 70; i++) { const x = rxH(i * 7 + seed) * 96, y = rxH(i * 13 + seed + 3) * 96; g.strokeStyle = col2; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1.5, y - 4); g.moveTo(x + 2, y); g.lineTo(x + 3, y - 3.5); g.stroke(); }
  return c.createPattern(cv, 'repeat');
}

/* ===================== أماكن الحديقة ===================== */
const R3_TREES = [], R3_DECO = [], R3_LAMPS = [], R3_BEDS = [], R3_TABLES = [];
(function () {
  const G = R3_G, H = (n) => rxH(n * 9973 + 17);
  // أشجار داخل الحديقة على الأطراف وبين الممرات
  const TT = ['round', 'blossom', 'cypress', 'maple', 'jaca', 'willow'];
  [[380, 1660], [520, 1620], [700, 1700], [900, 1640], [1060, 1700], [1540, 1700], [1700, 1640], [1900, 1700], [2080, 1620], [2220, 1660],
   [380, 1880], [560, 1820], [2040, 1820], [2220, 1880], [420, 2140], [600, 2200], [2000, 2200], [2180, 2140],
   [380, 2420], [560, 2380], [760, 2440], [940, 2360], [1660, 2360], [1840, 2440], [2040, 2380], [2220, 2420], [1020, 1880], [1580, 1880], [1000, 2180], [1600, 2180]].forEach((p, i) => R3_TREES.push({ x: p[0], y: p[1], k: TT[(i * 5 + 1) % TT.length], s: 0.95 + H(i) * 0.3, ph: H(i + 50) * 6, bird: i % 4 === 1 }));
  // الطبيعة برة الحديقة (مرج)
  for (let i = 0; i < 90; i++) { const x = RMX0 + 80 + H(i + 300) * (RMW - RMX0 - 160), y = 1560 + H(i + 900) * 950; if (x > G.x0 - 60 && x < G.x1 + 60 && y > G.y0 - 60 && y < G.y1 + 50) continue; if (Math.abs(x - R3_BR.cx) < 120 && y < 1640) continue; const r = H(i + 1700); R3_TREES.push({ x, y, k: r < 0.55 ? TT[i % TT.length] : r < 0.8 ? 'bush' : 'rock', s: 0.85 + H(i + 40) * 0.35, ph: H(i) * 6 }); }
  // أحواض زرع
  [[700, 1600], [1900, 1600], [800, 2010], [1800, 2010], [700, 2300], [1900, 2300], [1110, 2280], [1490, 2280], [1110, 1760], [1490, 1760]].forEach((p, i) => R3_BEDS.push({ x: p[0], y: p[1], i }));
  // أضوية على الممرات
  [[1240, 1620], [1360, 1620], [1240, 1780], [1360, 1780], [1050, 1960], [1550, 1960], [1050, 2070], [1550, 2070], [700, 1960], [1900, 1960], [460, 2050], [2140, 2050], [1240, 2240], [1360, 2240], [1240, 2420], [1360, 2420], [880, 1590], [1720, 1590], [880, 2440], [1720, 2440]].forEach(p => R3_LAMPS.push(p));
  // جلسات وكراسي (تنضاف لنظام الجلوس الأصلي)
  const add = (kind, x, y, s) => { const sd = { kind, x: Math.round(x), y: Math.round(y), s: s || 1, i: RM_SEATS.length, r3: 1 }; RM_SEATS.push(sd); rmSpots(sd).forEach(sp => RM_SPOTS.push(sp)); return sd; };
  [[1200, 1700], [1400, 1700], [1200, 2330], [1400, 2330], [620, 2004], [1980, 2004], [1000, 1610], [1600, 1610]].forEach(p => add('bench', p[0], p[1]));
  [[960, 1840], [1640, 1840], [960, 2170], [1640, 2170]].forEach(p => { R3_TABLES.push({ x: p[0], y: p[1] }); add('gchair', p[0] - 40, p[1], 1); add('gchair', p[0] + 40, p[1], -1); add('gchair', p[0], p[1] - 30, 1); add('gchair', p[0], p[1] + 34, -1); });
  // كراسي انتظار بالمطار
  [[5020, 930], [5120, 930], [5600, 930], [5700, 930]].forEach(p => add('bench', p[0], p[1]));
})();

/* ===================== الأرض: عشب + جسر + حديقة + مطار ===================== */
let R3P = null;
function r3Ground(c) {
  if (!R3P) R3P = { m: r3Pat(c, '#7cc55a', 'rgba(40,110,40,.35)', 1), g: r3Pat(c, '#5fbf52', 'rgba(20,100,40,.4)', 7) };
  const T = RM.T, a = RM.v0, b = RM.v1;
  if (r3VisY(1420, RMH)) {
    // رصيف الجهة الثانية + المرج
    c.fillStyle = '#d9b877'; c.fillRect(a, 1464, b - a, 4); const y0 = Math.max(1468, RM.vy0 - 4), y1 = Math.min(RMH, RM.vy1 + 4);
    if (y1 > y0) { c.fillStyle = R3P.m; c.fillRect(a, y0, b - a, y1 - y0); }
    for (let x = 60 + Math.floor((a - 60) / 240) * 240; x < b; x += 240) { if (R3_BRS.some(B => Math.abs(x - B.cx) < 70)) continue; c.fillStyle = '#4a4f5a'; c.fillRect(x - 2, 1426, 4, 40); c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(x, 1424, 4, 0, 7); c.fill(); }
    // زهور برية صغيرة بالمرج
    if (y1 > y0) { const s0 = Math.floor(a / 70), s1 = Math.ceil(b / 70); for (let s = s0; s < s1; s++) for (let r = Math.floor(y0 / 70); r < Math.ceil(y1 / 70); r++) { const h = rxH(s * 131 + r * 977); if (h > 0.45) continue; const x = s * 70 + h * 140, y = r * 70 + rxH(s + r * 3) * 70; if (r3InG(x, y) || y < 1474) continue; c.fillStyle = ['#ffffff', '#ffd23f', '#ff8ac0', '#b48af0'][(s + r) & 3]; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); } }
    r3GardenGround(c, T);
  }
  R3_BRS.forEach(B => r3Bridge(c, T, B));
  if (rxVis(R3_AP.x0 - 10, R3_AP.x1)) r3AirGround(c, T);
}
function r3GardenGround(c, T) {
  const G = R3_G; if (!r3Vis(G.x0 - 40, G.x1 + 40, G.y0 - 60, G.y1 + 40)) return;
  // عشب الحديقة
  c.fillStyle = R3P.g; c.fillRect(G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0);
  // الممرات الحجرية
  const stone = '#e9dcc2', edge = '#c9b48e';
  const pathR = (x, y, w, h) => { c.fillStyle = edge; c.fillRect(x - 3, y - 3, w + 6, h + 6); c.fillStyle = stone; c.fillRect(x, y, w, h); };
  pathR(G.gx - G.gw / 2, G.y0, G.gw, R3_POND.y - R3_POND.ry - 70 - G.y0 + 10);
  pathR(G.gx - G.gw / 2, R3_POND.y + R3_POND.ry + 60, G.gw, G.y1 - (R3_POND.y + R3_POND.ry + 60) - 40);
  pathR(G.x0 + 90, R3_POND.y - 26, R3_POND.x - R3_POND.rx - 70 - (G.x0 + 90), 52); pathR(R3_POND.x + R3_POND.rx + 70, R3_POND.y - 26, G.x1 - 90 - (R3_POND.x + R3_POND.rx + 70), 52);
  pathR(G.x0 + 60, G.y0 + 50, G.x1 - G.x0 - 120, 40); pathR(G.x0 + 60, G.y1 - 110, G.x1 - G.x0 - 120, 40); pathR(G.x0 + 60, G.y0 + 50, 40, G.y1 - G.y0 - 160); pathR(G.x1 - 100, G.y0 + 50, 40, G.y1 - G.y0 - 160);
  // الساحة الدائرية حول البركة
  c.fillStyle = edge; c.beginPath(); c.ellipse(R3_POND.x, R3_POND.y, R3_POND.rx + 74, R3_POND.ry + 64, 0, 0, 7); c.fill(); c.fillStyle = stone; c.beginPath(); c.ellipse(R3_POND.x, R3_POND.y, R3_POND.rx + 70, R3_POND.ry + 60, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(160,130,90,.35)'; c.lineWidth = 1; for (let k = 0; k < 24; k++) { const an = k / 24 * Math.PI * 2; c.beginPath(); c.moveTo(R3_POND.x + Math.cos(an) * (R3_POND.rx + 8), R3_POND.y + Math.sin(an) * (R3_POND.ry + 8)); c.lineTo(R3_POND.x + Math.cos(an) * (R3_POND.rx + 68), R3_POND.y + Math.sin(an) * (R3_POND.ry + 58)); c.stroke(); }
  // البركة
  const P = R3_POND; c.fillStyle = '#d6d0c4'; c.beginPath(); c.ellipse(P.x, P.y, P.rx + 8, P.ry + 7, 0, 0, 7); c.fill();
  let g = c.createRadialGradient(P.x, P.y - 10, 10, P.x, P.y, P.rx); g.addColorStop(0, '#7fdcf0'); g.addColorStop(1, '#2a98c8'); c.fillStyle = g; c.beginPath(); c.ellipse(P.x, P.y, P.rx, P.ry, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.4; for (let k = 0; k < 3; k++) { const u = ((T / 90 + k / 3) % 1); c.globalAlpha = 1 - u; c.beginPath(); c.ellipse(P.x, P.y + 4, 50 + u * 100, 18 + u * 42, 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
  // زنابق ماي
  [[-110, 10], [100, -20], [-60, -40], [120, 30], [40, 48]].forEach((q, i) => { const x = P.x + q[0], y = P.y + q[1]; c.fillStyle = '#3aa85a'; c.beginPath(); c.arc(x, y, 11, 0.3, Math.PI * 2 - 0.3); c.lineTo(x, y); c.fill(); if (i % 2 === 0) { c.fillStyle = '#ffb0d0'; c.beginPath(); c.arc(x + 3, y - 3, 4, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 3, y - 3, 1.6, 0, 7); c.fill(); } });
  // أحواض الزرع
  R3_BEDS.forEach(B => { if (!r3Vis(B.x - 80, B.x + 80, B.y - 40, B.y + 40)) return; c.fillStyle = '#8a5a34'; c.beginPath(); c.ellipse(B.x, B.y, 72, 30, 0, 0, 7); c.fill(); c.fillStyle = '#5a3a1e'; c.beginPath(); c.ellipse(B.x, B.y - 2, 66, 26, 0, 0, 7); c.fill(); const cols = [['#ff5a8a', '#ffd23f'], ['#c06aff', '#fff'], ['#ff8a3a', '#ff5a8a'], ['#4aa8ff', '#ffd23f']][B.i % 4]; for (let k = 0; k < 22; k++) { const an = rxH(B.i * 50 + k) * 7, rr = rxH(B.i * 70 + k) * 0.92; const x = B.x + Math.cos(an) * 60 * rr, y = B.y - 2 + Math.sin(an) * 22 * rr; c.fillStyle = '#2f8a3a'; c.fillRect(x - 0.8, y - 7, 1.6, 7); c.fillStyle = cols[k % 2]; c.beginPath(); c.arc(x, y - 8, 3.4, 0, 7); c.fill(); c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(x, y - 8, 1.1, 0, 7); c.fill(); } });
  // سياج يمين ويسار (عمودي)
  [G.x0, G.x1].forEach(x => { if (!rxVis(x - 10, x + 10)) return; const gap = x === G.x1 ? [R3_G2.y - 34, R3_G2.y + 30] : null; c.fillStyle = '#2f6b3a'; if (gap) { c.fillRect(x - 6, G.y0, 12, gap[0] - G.y0); c.fillRect(x - 6, gap[1], 12, G.y1 - gap[1]); } else c.fillRect(x - 6, G.y0, 12, G.y1 - G.y0); c.fillStyle = '#3f8a4a'; for (let y = G.y0 + 6; y < G.y1; y += 12) { if (gap && y > gap[0] - 4 && y < gap[1] + 4) continue; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill(); } });
}
/* جسر المشاة فوق الشارعين */
function r3Bridge(c, T, B) {
  B = B || R3_BR; if (!r3Vis(B.x0 - 40, B.x1 + 40, B.yN - 60, B.yS + 30)) return; const w = B.x1 - B.x0;
  // ظل الجسر على الشارع
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(B.x0 + 10, 1244, w, 178);
  // أعمدة
  [[1250, 1330], [1350, 1330]].forEach(() => {}); [B.x0 - 4, B.x1 + 4].forEach(x => [1330].forEach(y => { c.fillStyle = '#9aa0ab'; c.fillRect(x - 5, y - 6, 10, 20); }));
  // سلالم الجهتين
  const stairs = (y0, y1, up) => { const n = 7; for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * i / n, hh = (y1 - y0) / n; c.fillStyle = i % 2 ? '#c4c9d2' : '#d6dbe3'; c.fillRect(B.x0, y, w, hh + 0.5); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(B.x0, up ? y + hh - 1.5 : y, w, 1.5); } };
  stairs(B.yN, 1236, true); stairs(1424, B.yS, false);
  // سطح الجسر
  let g = c.createLinearGradient(B.x0, 0, B.x1, 0); g.addColorStop(0, '#b98a5a'); g.addColorStop(0.5, '#d2a16a'); g.addColorStop(1, '#b98a5a'); c.fillStyle = g; c.fillRect(B.x0, 1236, w, 188);
  c.strokeStyle = 'rgba(90,55,25,.35)'; c.lineWidth = 1; c.beginPath(); for (let y = 1240; y < 1424; y += 10) { c.moveTo(B.x0, y); c.lineTo(B.x1, y); } c.stroke();
  // الدرابزين (يمين ويسار) مع لمبات صغيرة
  [B.x0 - 4, B.x1 + 1].forEach(x => { c.fillStyle = '#5a6a8a'; c.fillRect(x, B.yN - 4, 3, B.yS - B.yN + 6); c.fillStyle = '#e8ecf4'; c.fillRect(x - 1, B.yN - 10, 5, 4); for (let y = B.yN + 6; y < B.yS; y += 22) { c.fillStyle = '#5a6a8a'; c.fillRect(x - 1, y, 5, 3); } });
  for (let y = B.yN + 20; y < B.yS - 10; y += 44) [B.x0 - 3, B.x1 + 2].forEach(x => { c.fillStyle = r3Night() > 0.3 ? '#fff2a8' : '#ffd166'; c.beginPath(); c.arc(x + 0.5, y, 2.4, 0, 7); c.fill(); });
  // لافتة فوق مدخل الجسر
  { const sw = B.nm ? 136 : 108; rxRect(c, B.cx - sw / 2, B.yN - 46, sw, 24, 8, '#1f7a4a'); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.strokeRect(B.cx - sw / 2 + 4, B.yN - 42, sw - 8, 16); rxTxt(c, B.nm || '🌉 جسر المشاة', B.cx, B.yN - 34, 'bold 11px Cairo, Arial', '#fff'); }
  c.fillStyle = '#4a4f5a'; c.fillRect(B.cx - 50, B.yN - 22, 3, 20); c.fillRect(B.cx + 47, B.yN - 22, 3, 20);
}

/* ===================== المطار: الأرض ===================== */
function r3AirGround(c, T) {
  const a = Math.max(R3_AP.x0, RM.v0), b = Math.min(R3_AP.x1, RM.v1); if (b <= a) return; const top = 212, Y1 = RM_SAND;
  // كورنيش على البحر
  c.fillStyle = '#e8ecf2'; c.fillRect(a, 194, b - a, 18); c.fillStyle = '#b8c0cc'; c.fillRect(a, 210, b - a, 3);
  // أرضية الإسمنت
  c.fillStyle = '#d4d9df'; c.fillRect(a, top, b - a, Y1 - top); c.strokeStyle = 'rgba(120,130,145,.28)'; c.lineWidth = 1; c.beginPath(); const S = 80; for (let x = R3_AP.x0 + Math.floor((a - R3_AP.x0) / S) * S; x < b; x += S) { c.moveTo(x, Math.max(top, RM.vy0)); c.lineTo(x, Math.min(Y1, RM.vy1)); } for (let y = top + Math.floor((Math.max(top, RM.vy0) - top) / S) * S; y < Math.min(Y1, RM.vy1); y += S) { c.moveTo(a, y); c.lineTo(b, y); } c.stroke();
  // شريط عشب بين الساحة والمطار + عشب حول المدرج
  c.fillStyle = '#6dbf55'; if (rxVis(4760, 4820)) c.fillRect(4760, top, 50, Y1 - top); c.fillStyle = '#7ccc60'; c.fillRect(Math.max(a, 4990), 226, Math.min(b, 7790) - Math.max(a, 4990), 132);
  // المدرج
  if (rxVis(5000, 7780)) { const r0 = Math.max(a, 5000), r1 = Math.min(b, 7780); c.fillStyle = '#3a3f4a'; c.fillRect(r0, 240, r1 - r0, 104); c.fillStyle = '#f5f5f5'; c.fillRect(r0, 244, r1 - r0, 3); c.fillRect(r0, 337, r1 - r0, 3); for (let x = 5000 + Math.floor((r0 - 5000) / 80) * 80; x < r1; x += 80) c.fillRect(x + 20, 290, 44, 4);
    if (rxVis(5000, 5100)) for (let i = 0; i < 8; i++) c.fillRect(5020, 254 + i * 10, 50, 5); if (rxVis(7680, 7780)) for (let i = 0; i < 8; i++) c.fillRect(7710, 254 + i * 10, 50, 5);
    rxTxt(c, '09', 5090, 292, 'bold 22px Arial', 'rgba(255,255,255,.85)'); rxTxt(c, '27', 7690, 292, 'bold 22px Arial', 'rgba(255,255,255,.85)');
    const nl = r3Night() > 0.25; for (let x = 5010 + Math.floor((r0 - 5010) / 60) * 60; x < r1; x += 60) [238, 346].forEach(y => { c.fillStyle = nl ? (((x / 60 + Math.floor(T / 8)) % 12) < 1 ? '#fff' : '#ffd56a') : '#e0c070'; c.beginPath(); c.arc(x, y, nl ? 2.6 : 1.8, 0, 7); c.fill(); }); }
  // خطوط الممر الأصفر من المدرج للطيارات
  c.strokeStyle = '#ffcc2a'; c.lineWidth = 3; c.setLineDash([14, 10]); c.beginPath(); c.moveTo(6000, 346); c.quadraticCurveTo(6000, 520, 6200, 560); c.lineTo(7700, 560); c.moveTo(7400, 346); c.lineTo(7400, 560); c.stroke(); c.setLineDash([]);
  // مكان وقوف الطيارة (مربع أصفر) + سجادة حمرا للدرج
  if (rxVis(6200, 6900)) { c.strokeStyle = 'rgba(255,204,42,.9)'; c.lineWidth = 3; c.strokeRect(6280, 640, 560, 110); rxTxt(c, 'BT-101', 6760, 738, 'bold 14px Arial', 'rgba(255,204,42,.9)'); c.fillStyle = '#c4122a'; c.fillRect(6560, 726, 130, 26); c.fillStyle = '#ffd23f'; c.fillRect(6560, 726, 130, 2); c.fillRect(6560, 750, 130, 2); }
  // ممر مشاة مخطط من التيرمنال للطيارة
  if (rxVis(5760, 6320)) { c.fillStyle = 'rgba(255,255,255,.85)'; for (let x = 5780; x < 6300; x += 26) c.fillRect(x, 772, 14, 40); }
  // رصيف قدام التيرمنال
  if (rxVis(R3_TERM.x0 - 30, R3_TERM.x1 + 30)) { c.fillStyle = '#eef1f5'; c.fillRect(R3_TERM.x0 - 30, 640, R3_TERM.x1 - R3_TERM.x0 + 60, 150); c.fillStyle = '#c2c8d2'; c.fillRect(R3_TERM.x0 - 30, 788, R3_TERM.x1 - R3_TERM.x0 + 60, 4); }
}

/* ===================== رسم الأشياء (مرتبة حسب y) ===================== */
function r3OutList(L) {
  const T = RM.T;
  if (r3VisY(1380, RMH + 50)) {
    R3_TREES.forEach(t => { if (!r3Vis(t.x - 80, t.x + 80, t.y - 200, t.y + 20)) return; L.push([t.y, c => r3Tree(c, t, T)]); });
    R3_LAMPS.forEach(p => { if (!r3Vis(p[0] - 30, p[0] + 30, p[1] - 120, p[1] + 10)) return; L.push([p[1], c => r3Lamp(c, p[0], p[1])]); });
    RM_SEATS.forEach(sd => { if (!sd.r3 || sd.y < 1400 || !r3Vis(sd.x - 40, sd.x + 40, sd.y - 40, sd.y + 10)) return; L.push([sd.y, c => rmSeatDraw(c, sd)]); });
    R3_TABLES.forEach(t => { if (!r3Vis(t.x - 40, t.x + 40, t.y - 40, t.y + 10)) return; L.push([t.y + 1, c => r3Table(c, t.x, t.y)]); });
    const G = R3_G;
    if (r3Vis(G.x0 - 20, G.x1 + 20, G.y0 - 140, G.y0 + 20)) { L.push([G.y0, c => r3FenceRow(c, G.y0, true)]); L.push([G.y0 + 2, c => r3Gate(c, T)]); }
    if (r3Vis(G.x0 - 20, G.x1 + 20, G.y1 - 40, G.y1 + 20)) L.push([G.y1, c => r3FenceRow(c, G.y1, false)]);
    if (r3Vis(R3_POND.x - 200, R3_POND.x + 200, R3_POND.y - 220, R3_POND.y + 150)) { L.push([R3_POND.y, c => r3Swan(c, T)]); L.push([R3_POND.y + R3_POND.ry + 34, c => r3SwanPlaque(c, T)]); }
    if (r3Vis(G.x0, G.x1, G.y0 - 200, G.y1)) r3Life(L, T);
  }
  if (rxVis(R3_AP.x0 - 20, R3_AP.x1 + 20)) {
    L.push([R3_TERM.y, c => r3Terminal(c, T)]); L.push([R3_TWR.y, c => r3Tower(c, T)]);
    L.push([R3_TKT.y, c => r3TicketBooth(c, T)]); L.push([R3_TKT.y + 6, c => { rxNpc(c, R3_AGT_AV, R3_TKT.x, R3_TKT.y - 6, -1, { dance: 0 }); r3SayDraw(c, R3.agt, R3_TKT.x, R3_TKT.y - 6); }]); L.push([R3_TKT.y + 40, c => r3TicketCounter(c)]);
    L.push([R3_TKT.y + 10, c => r3Board(c, 5600, 850, T)]);
    L.push([560, c => r3Plane(c, 7330, 560, 0.72, -1, '#2a6ad8', 'BT-202')]); L.push([R3_PLANE.y, c => r3Plane(c, R3_PLANE.x, R3_PLANE.y, 1, 1, '#7a2ad8', 'BT-101', true)]);
    L.push([R3_PLANE.y + 2, c => r3PlaneStairs(c)]); L.push([R3_CAP.y, c => r3Captain(c, R3_CAP.x, R3_CAP.y, R3.cap)]);
    L.push([700, c => r3Sign(c, 4800, 700)]); [[4785, 420], [4785, 980]].forEach(p => L.push([p[1], c => rmPalm(c, p[0], p[1], 0.9, p[0] / 100)]));
    L.push([430, c => r3Windsock(c, 7680, 430, T)]); L.push([300, c => r3RunwayPlane(c, T)]);
    L.push([690, c => r3Carts(c, 6200, 690)]);
  }
}
function r3Tree(c, t, T) {
  const S = R3S[t.k]; if (!S) return; const sw = Math.sin(T / 70 + t.ph) * 0.012;
  if (t.k === 'bush' || t.k === 'rock') { r3Put(c, S, t.x, t.y, t.s); return; }
  c.save(); c.translate(t.x, t.y); c.rotate(sw); r3Put(c, S, 0, 0, t.s); c.restore();
  if (t.bird) r3Perch(c, t.x + 18 * t.s, t.y - 92 * t.s, t.ph, T);
}
function r3Lamp(c, x, y) { r3Put(c, R3S.lamp, x, y); if (r3Night() > 0.2) { c.fillStyle = 'rgba(255,240,170,.95)'; c.beginPath(); c.arc(x, y - 90, 7, 0, 7); c.fill(); } }
function r3Table(c, x, y) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 1, 22, 6, 0, 0, 7); c.fill(); c.fillStyle = '#7a4a22'; c.fillRect(x - 2, y - 18, 4, 18); c.fillStyle = '#f4ecdc'; c.beginPath(); c.ellipse(x, y - 20, 24, 9, 0, 0, 7); c.fill(); c.fillStyle = '#ff8ac0'; c.beginPath(); c.ellipse(x, y - 21, 24, 9, 0, Math.PI * 0.1, Math.PI * 0.9); c.fill(); c.font = '11px sans-serif'; c.textAlign = 'center'; c.fillText('🫖', x - 6, y - 22); c.fillText('🌷', x + 8, y - 24); }
function r3FenceRow(c, y, top) { const G = R3_G, a = Math.max(G.x0, RM.v0 - 60), b = Math.min(G.x1, RM.v1 + 60); for (let x = G.x0 + Math.floor((a - G.x0) / 60) * 60; x < b; x += 60) { if (top && x + 60 > G.gx - G.gw - 10 && x < G.gx + G.gw + 10) continue; r3Put(c, R3S.fence, x, y); } }
function r3Gate(c, T) {
  const x = R3_G.gx, y = R3_G.y0, W = R3_G.gw + 26;
  [-1, 1].forEach(s => { const px = x + s * W; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(px, y + 2, 14, 4, 0, 0, 7); c.fill(); rxRect(c, px - 11, y - 74, 22, 76, 3, '#e8dcc6'); c.fillStyle = '#c9b48e'; c.fillRect(px - 11, y - 8, 22, 8); c.fillRect(px - 13, y - 80, 26, 8); c.fillStyle = '#ffd76a'; c.beginPath(); c.arc(px, y - 86, 6, 0, 7); c.fill(); });
  // ضلفتين مفتوحات للداخل
  [-1, 1].forEach(s => { c.save(); c.translate(x + s * (W - 11), y - 4); c.strokeStyle = '#2a2f3a'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 5; i++) { c.moveTo(-s * i * 7, 0); c.lineTo(-s * i * 7, -46 + Math.abs(i - 2) * 3); } c.moveTo(0, -10); c.lineTo(-s * 28, -10); c.moveTo(0, -38); c.lineTo(-s * 28, -40); c.stroke(); c.restore(); });
  // القوس واسم الحديقة
  c.strokeStyle = '#2a2f3a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - W, y - 84); c.quadraticCurveTo(x, y - 140, x + W, y - 84); c.stroke(); c.strokeStyle = '#3fae4a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - W, y - 90); c.quadraticCurveTo(x, y - 146, x + W, y - 90); c.stroke();
  ['#ff5a8a', '#ffd23f', '#fff', '#c06aff', '#ff8ac0', '#ffd23f', '#fff'].forEach((col, i) => { const u = (i + 0.5) / 7, px = x - W + u * 2 * W, py = y - 90 - Math.sin(u * Math.PI) * 28; c.fillStyle = col; c.beginPath(); c.arc(px, py, 3.4, 0, 7); c.fill(); });
  rxRect(c, x - 62, y - 128, 124, 30, 12, '#2f8a3a'); c.strokeStyle = '#fff6c0'; c.lineWidth = 2; c.beginPath(); c.roundRect ? c.roundRect(x - 58, y - 124, 116, 22, 10) : c.rect(x - 58, y - 124, 116, 22); c.stroke();
  rxTxt(c, '🌿 حديقة الأمل 🌿', x, y - 113, 'bold 14px Lalezar, Cairo, Arial', '#fffbe0', 6, 'rgba(0,0,0,.4)');
}
function r3Perch(c, x, y, ph, T) {   // عصفور غريب واكف على غصن
  const hop = Math.max(0, Math.sin(T / 40 + ph * 3)) > 0.97 ? -3 : 0, cols = [['#18c6c6', '#ff4a8a'], ['#ff9a1a', '#7a2ad8'], ['#ffd23f', '#1a8ae8'], ['#e83a6a', '#2ac67a']][Math.floor(ph * 10) % 4];
  c.save(); c.translate(x, y + hop); c.fillStyle = cols[1]; c.beginPath(); c.moveTo(-4, 1); c.quadraticCurveTo(-14, 10, -12, 16); c.quadraticCurveTo(-8, 8, -2, 3); c.fill();   // ذيل طويل
  c.fillStyle = cols[0]; c.beginPath(); c.ellipse(0, 0, 6, 4.4, -0.2, 0, 7); c.fill(); c.beginPath(); c.arc(5, -3.5, 3.2, 0, 7); c.fill(); c.fillStyle = cols[1]; c.beginPath(); c.ellipse(-1, 0, 3.6, 2.4, -0.3, 0, 7); c.fill();
  c.fillStyle = '#ffb21f'; c.beginPath(); c.moveTo(8, -3.5); c.lineTo(11, -2.8); c.lineTo(8, -2); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(6, -4, 0.9, 0, 7); c.fill(); c.fillStyle = cols[1]; c.beginPath(); c.moveTo(4, -6.5); c.lineTo(3, -10); c.lineTo(6, -6.5); c.fill(); c.restore();
}
/* فراشات وعصافير طايرة */
const R3_BF = Array.from({ length: 18 }, (_, i) => ({ hx: R3_BEDS[i % R3_BEDS.length].x, hy: R3_BEDS[i % R3_BEDS.length].y, ph: rxH(i + 5) * 6, sp: 0.6 + rxH(i + 9) * 0.6, col: ['#ff7ab8', '#ffd23f', '#7ad8ff', '#c06aff', '#ff9a3a', '#ffffff'][i % 6] }));
const R3_FB = Array.from({ length: 4 }, (_, i) => ({ ph: i * 1.6, r: 260 + i * 120, cols: [['#18c6c6', '#ff4a8a'], ['#ff9a1a', '#7a2ad8'], ['#ffd23f', '#1a8ae8'], ['#e83a6a', '#2ac67a']][i] }));
function r3Life(L, T) {
  R3_BF.forEach(b => { const t = T / 60 * b.sp + b.ph, x = b.hx + Math.sin(t) * 70 + Math.sin(t * 2.3) * 16, gy = b.hy + Math.cos(t * 0.8) * 26, hh = 22 + Math.sin(t * 3.1) * 8; if (!r3Vis(x - 20, x + 20, gy - 60, gy + 10)) return; L.push([gy, c => r3Butterfly(c, x, gy - hh, T + b.ph * 40, b.col)]); });
  if (r3Night() > 0.6) return;
  R3_FB.forEach(b => { const t = T / 260 + b.ph, x = R3_POND.x + Math.cos(t) * b.r * 1.5, y = R3_POND.y - 120 + Math.sin(t) * b.r * 0.45; if (!r3Vis(x - 30, x + 30, y - 30, y + 30)) return; L.push([99999, c => r3FlyBird(c, x, y, -Math.sin(t) > 0 ? 1 : -1, T, b.cols)]); });
}
function r3Butterfly(c, x, y, T, col) { const f = Math.abs(Math.sin(T / 3)); c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(0, 24, 4, 1.5, 0, 0, 7); c.fill(); c.fillStyle = col; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * 4 * (0.3 + f * 0.7), -2, 4.2 * (0.3 + f * 0.7), 3.4, s * 0.4, 0, 7); c.fill(); c.beginPath(); c.ellipse(s * 3 * (0.3 + f * 0.7), 2.4, 3 * (0.3 + f * 0.7), 2.4, -s * 0.4, 0, 7); c.fill(); }); c.fillStyle = '#2a1a2a'; c.fillRect(-0.7, -4, 1.4, 8); c.restore(); }
function r3FlyBird(c, x, y, d, T, cols) { const f = Math.sin(T / 5); c.save(); c.translate(x, y); c.scale(d, 1); c.fillStyle = cols[1]; c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(-22, 4, -26, 10); c.quadraticCurveTo(-16, 2, -6, 2); c.fill(); c.fillStyle = cols[0]; c.beginPath(); c.ellipse(0, 0, 8, 4.5, 0, 0, 7); c.fill(); c.beginPath(); c.arc(7, -2, 3.4, 0, 7); c.fill(); c.fillStyle = '#ffb21f'; c.beginPath(); c.moveTo(10, -2); c.lineTo(14, -1); c.lineTo(10, 0); c.fill(); c.fillStyle = cols[1]; c.beginPath(); c.moveTo(-2, -1); c.quadraticCurveTo(-6, -14 * f, 4, -16 * f); c.quadraticCurveTo(4, -6 * f, 3, -1); c.fill(); c.restore(); }

/* ===================== بجعة الحب الأبدي 🦢❤️ ===================== */
function r3Swan(c, T) {
  const x = R3_POND.x, y = R3_POND.y, pul = 0.5 + 0.5 * Math.sin(T / 30), n = r3Night();
  rmGlow(c, x, y - 70, 120, 0.18 + 0.12 * pul + 0.2 * n, '255,120,180');
  // القاعدة الرخامية
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 4, 54, 16, 0, 0, 7); c.fill();
  let g = c.createLinearGradient(x - 44, 0, x + 44, 0); g.addColorStop(0, '#cfc8d8'); g.addColorStop(0.5, '#fbf8ff'); g.addColorStop(1, '#cfc8d8'); c.fillStyle = g; c.fillRect(x - 40, y - 34, 80, 34); c.beginPath(); c.ellipse(x, y, 40, 12, 0, 0, Math.PI); c.fill();
  c.fillStyle = '#efe8f8'; c.beginPath(); c.ellipse(x, y - 34, 44, 13, 0, 0, 7); c.fill(); c.fillStyle = '#d8b04a'; c.fillRect(x - 40, y - 22, 80, 3);
  // البجعة
  c.save(); c.translate(x, y - 44);
  const W = (s) => { c.save(); c.scale(s, 1); g = c.createLinearGradient(0, -60, 30, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e4def0'); c.fillStyle = g; c.beginPath(); c.moveTo(2, -6); c.bezierCurveTo(10, -40, 44, -62, 34, -30); c.bezierCurveTo(30, -16, 18, -6, 2, -2); c.fill(); c.strokeStyle = 'rgba(160,150,190,.5)'; c.lineWidth = 0.8; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(6 + i * 6, -8 - i * 2); c.quadraticCurveTo(18 + i * 4, -30 - i * 4, 30 - i, -42 + i * 6); c.stroke(); } c.restore(); };
  W(-1); W(1);   // جناحين مرفوعات بشكل قلب
  g = c.createLinearGradient(0, -20, 0, 6); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ddd6ea'); c.fillStyle = g; c.beginPath(); c.ellipse(0, -6, 26, 12, 0, 0, 7); c.fill();
  c.strokeStyle = '#ffffff'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-14, -10); c.bezierCurveTo(-30, -30, -6, -46, -10, -62); c.stroke();   // الرقبة S
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(-8, -64, 6, 0, 7); c.fill(); c.fillStyle = '#ff9a2a'; c.beginPath(); c.moveTo(-3, -65); c.lineTo(6, -62); c.lineTo(-3, -60); c.fill(); c.fillStyle = '#1a1a22'; c.beginPath(); c.arc(-7, -66, 1.2, 0, 7); c.fill();
  // قلب ذهبي بين الجناحين
  rxHeart(c, 0, -46 - pul * 2, 8 + pul * 1.5, '#ff3d7f'); rxHeart(c, 0, -46.5 - pul * 2, 5, '#ff8ab8');
  c.restore();
  for (let k = 0; k < 4; k++) { const u = ((T / 120 + k / 4) % 1); c.globalAlpha = Math.sin(u * Math.PI) * 0.85; rxHeart(c, x - 30 + k * 20 + Math.sin(T / 30 + k) * 6, y - 110 - u * 60, 4, ['#ff3d7f', '#ff8ab8', '#ffb0d0', '#ff5a9a'][k]); } c.globalAlpha = 1;
  R3.swanFx = R3.swanFx.filter(p => p.t > 0); R3.swanFx.forEach(p => { p.t--; p.y -= 1.1; p.x += Math.sin(p.t / 8) * 0.6; c.globalAlpha = Math.min(1, p.t / 30); rxHeart(c, p.x, p.y, p.s, p.col); }); c.globalAlpha = 1;
  // عدد اللايكات فوق راسها
  const n2 = R3.swanN == null ? '…' : String(R3.swanN); c.save(); c.font = 'bold 13px Cairo, Arial'; const tw = c.measureText('❤️ ' + n2).width + 22; rxRect(c, x - tw / 2, y - 150, tw, 24, 12, R3.swanMe ? 'rgba(255,61,127,.95)' : 'rgba(255,255,255,.92)'); c.restore(); rxTxt(c, '❤️ ' + n2, x, y - 138, 'bold 13px Cairo, Arial', R3.swanMe ? '#fff' : '#d0285a');
  if (r3NearSwan() && !R3.swanMe) { c.globalAlpha = 0.6 + 0.4 * Math.sin(T / 8); c.font = '15px system-ui'; c.textAlign = 'center'; c.fillText('👆', x + 46, y - 122); c.globalAlpha = 1; }
}
function r3SwanPlaque(c, T) { const x = R3_POND.x, y = R3_POND.y + R3_POND.ry + 34; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y, 40, 5, 0, 0, 7); c.fill(); c.fillStyle = '#6a4a2a'; c.fillRect(x - 3, y - 26, 6, 26); rxRect(c, x - 76, y - 52, 152, 30, 8, '#fff6ea'); c.strokeStyle = '#d8b04a'; c.lineWidth = 2; c.beginPath(); c.roundRect ? c.roundRect(x - 76, y - 52, 152, 30, 8) : c.rect(x - 76, y - 52, 152, 30); c.stroke(); rxTxt(c, '🦢 بجعة الحب الأبدي ❤️', x, y - 37, 'bold 12px Cairo, Arial', '#b0285a'); }
const r3NearSwan = () => { const m = RM.me; if (rmInShop()) return false; const dx = (m.x - R3_POND.x) / (R3_POND.rx + 110), dy = (m.y - R3_POND.y) / (R3_POND.ry + 100); return dx * dx + dy * dy < 1; };
function r3SwanLike() {
  if (!auth) { showToast('🔐 سجّل حساب حتى تحط لايك لبجعة الحب الأبدي 💖'); return; }
  if (R3.swanMe) { showToast('💖 لايكك محسوب لبجعة الحب الأبدي — شكراً لأنك تحب ❤️'); r3SwanBurst(6); return; }
  rmSend({ t: 'rm_swan_like' }); r3SwanBurst(14); rxSnd([['sine', 880, 1320, 0.25, 0.05], ['sine', 1320, 1760, 0.3, 0.04, 0.12]]);
}
function r3SwanBurst(n) { for (let i = 0; i < n; i++) R3.swanFx.push({ x: R3_POND.x + (Math.random() - 0.5) * 60, y: R3_POND.y - 70 + (Math.random() - 0.5) * 30, t: 50 + Math.random() * 50, s: 3 + Math.random() * 4, col: ['#ff3d7f', '#ff8ab8', '#ffb0d0', '#ff5a9a', '#ffd23f'][i % 5] }); }

/* ===================== المطار: البنايات ===================== */
const R3_AGT_AV = (() => { try { return AVT.norm(Object.assign({}, AVT.DEF, { g: 'f', hs: 'bob', hc: 'brown', sk: 'light', ey: 2, tp: 'blouse', bt: 'lskirt', tc: '#2a6ad8', bc: '#1b2a4a', o: '', mk: [6, 0, 2, 2, 1, 0] })); } catch (e) { return AVT.DEF; } })();
const R3_CAP_AV = (() => { try { return AVT.norm(Object.assign({}, AVT.DEF, { g: 'm', hs: 'short', hc: 'black', sk: 'tan', tp: 'shirt', bt: 'jeans', tc: '#1b2a4a', bc: '#1b2a4a', o: '', mk: [0, 0, 0, 0, 0, 0] })); } catch (e) { return AVT.DEF; } })();
function r3Captain(c, x, y, S) {
  rxNpc(c, R3_CAP_AV, x, y, 1, { dance: 0 }); const k = AV_H / 137;
  // كتافيات ذهبية + قبعة القبطان
  c.fillStyle = '#ffd23f'; c.fillRect(x - 15 * k, y - 76 * k, 7 * k, 3 * k); c.fillRect(x + 8 * k, y - 76 * k, 7 * k, 3 * k);
  const hy = y - 128 * k; c.fillStyle = '#1b2a4a'; c.beginPath(); c.ellipse(x, hy + 6 * k, 21 * k, 6 * k, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 20 * k, hy + 4 * k); c.quadraticCurveTo(x, hy - 18 * k, x + 20 * k, hy + 4 * k); c.closePath(); c.fill(); c.fillStyle = '#1b2a4a'; c.fillRect(x - 18 * k, hy, 36 * k, 5 * k); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x, hy - 3 * k, 3.4 * k, 0, 7); c.fill();
  r3SayDraw(c, S, x, y); rmTagDraw(c, x, y + 14, '👨‍✈️ القبطان', 'rgba(27,42,74,.92)');
  if (Math.hypot(RM.me.x - x, RM.me.y - y) < 90 && R3.tk && rmShopId() === rmShopId({ x })) { c.globalAlpha = 0.6 + 0.4 * Math.sin(RM.T / 8); c.font = '15px system-ui'; c.textAlign = 'center'; c.fillText('🎫', x + 26, y - 70); c.globalAlpha = 1; }
}
function r3SayDraw(c, S, x, y) { if (!S || !S.say) return; S.say.t--; if (S.say.t <= 0) { S.say = null; return; } try { c.save(); c.globalAlpha = Math.min(1, S.say.t / 20); const txt = S.say.txt; c.font = 'bold 11px Cairo, system-ui, Arial'; const w = Math.min(220, c.measureText(txt).width + 18), lines = []; let cur = ''; txt.split(' ').forEach(wd => { const t2 = cur ? cur + ' ' + wd : wd; if (c.measureText(t2).width > 200 && cur) { lines.push(cur); cur = wd; } else cur = t2; }); if (cur) lines.push(cur); const h = lines.length * 15 + 10, bx = x - w / 2, by = y - AV_H - 22 - h; rxRect(c, bx, by, w, h, 10, 'rgba(255,255,255,.96)'); c.fillStyle = 'rgba(255,255,255,.96)'; c.beginPath(); c.moveTo(x - 6, by + h); c.lineTo(x + 6, by + h); c.lineTo(x, by + h + 7); c.fill(); lines.forEach((l, i) => rxTxt(c, l, x, by + 12 + i * 15, 'bold 11px Cairo, system-ui, Arial', '#2a1a40')); c.restore(); } catch (e) { c.restore(); } }
function r3Terminal(c, T) {
  const X0 = R3_TERM.x0, X1 = R3_TERM.x1, Y = R3_TERM.y, TOP = R3_TERM.top; if (!rxVis(X0 - 20, X1 + 20)) return; const n = r3Night(), W = X1 - X0;
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(X0 + 10, Y - 6, W, 12);
  let g = c.createLinearGradient(0, TOP, 0, Y); g.addColorStop(0, '#f4f6fa'); g.addColorStop(1, '#dfe4ec'); c.fillStyle = g; c.fillRect(X0, TOP + 30, W, Y - TOP - 30);
  // سقف موجي
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(X0 - 20, TOP + 36); for (let i = 0; i <= 4; i++) { const xx = X0 - 20 + (W + 40) * i / 4; c.quadraticCurveTo(xx - (W + 40) / 8, TOP - 6, xx, TOP + 36); } c.lineTo(X1 + 20, TOP + 46); c.lineTo(X0 - 20, TOP + 46); c.fill(); c.fillStyle = '#c8d0dc'; c.fillRect(X0 - 20, TOP + 44, W + 40, 4);
  // واجهة زجاج كبيرة
  g = c.createLinearGradient(0, TOP + 60, 0, Y - 10); g.addColorStop(0, n > 0.3 ? '#ffe9a8' : '#8fd0f4'); g.addColorStop(1, n > 0.3 ? '#ffc870' : '#4aa0d8'); c.fillStyle = g; c.fillRect(X0 + 20, TOP + 64, W - 40, Y - TOP - 80);
  c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(X0 + 40 + i * 140, TOP + 64); c.lineTo(X0 + 90 + i * 140, TOP + 64); c.lineTo(X0 + 50 + i * 140, Y - 16); c.lineTo(X0 + i * 140, Y - 16); c.closePath(); c.fill(); }
  c.fillStyle = '#9aa6b8'; for (let x = X0 + 20; x <= X1 - 20; x += 60) c.fillRect(x - 1.5, TOP + 64, 3, Y - TOP - 80); c.fillRect(X0 + 20, TOP + 140, W - 40, 3);
  // ناس ورا الزجاج (ظلال)
  for (let i = 0; i < 9; i++) { const px = X0 + 60 + ((i * 97 + T * (i % 2 ? 0.25 : -0.2)) % (W - 120) + (W - 120)) % (W - 120), py = Y - 18; c.fillStyle = 'rgba(30,50,80,.35)'; c.beginPath(); c.arc(px, py - 30, 5, 0, 7); c.fill(); c.fillRect(px - 5, py - 25, 10, 22); }
  // الباب الأوتوماتيكي
  const dx = (X0 + X1) / 2; c.fillStyle = '#5a6a80'; c.fillRect(dx - 52, Y - 76, 104, 76); c.fillStyle = 'rgba(180,225,255,.9)'; c.fillRect(dx - 48, Y - 72, 46, 72); c.fillRect(dx + 2, Y - 72, 46, 72); rxTxt(c, 'دخول • ENTRANCE', dx, Y - 84, 'bold 9px Cairo, Arial', '#2a3a55');
  // اللافتة
  c.save(); try { c.direction = 'rtl'; } catch (e) {} c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 30px Lalezar, Cairo, Arial'; c.shadowColor = n > 0.3 ? '#6ab8ff' : 'rgba(0,0,0,.25)'; c.shadowBlur = n > 0.3 ? 14 : 4; c.fillStyle = '#1a4a9a'; c.fillText('✈️ مطار بابيت الدولي', dx, TOP + 92); c.restore();
  rxTxt(c, 'BABEET INTERNATIONAL AIRPORT', dx, TOP + 120, 'bold 11px Arial', '#3a5a8a');
}
function r3Tower(c, T) { const x = R3_TWR.x, y = R3_TWR.y; if (!rxVis(x - 60, x + 60)) return; c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y, 40, 9, 0, 0, 7); c.fill(); let g = c.createLinearGradient(x - 20, 0, x + 20, 0); g.addColorStop(0, '#cfd6e0'); g.addColorStop(0.5, '#f4f6fa'); g.addColorStop(1, '#cfd6e0'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 22, y); c.lineTo(x - 14, y - 230); c.lineTo(x + 14, y - 230); c.lineTo(x + 22, y); c.fill(); c.fillStyle = '#2a3a55'; c.beginPath(); c.moveTo(x - 40, y - 234); c.lineTo(x + 40, y - 234); c.lineTo(x + 32, y - 270); c.lineTo(x - 32, y - 270); c.closePath(); c.fill(); c.fillStyle = r3Night() > 0.3 ? '#ffe9a8' : '#8fd0f4'; c.fillRect(x - 30, y - 266, 60, 26); c.fillStyle = '#f4f6fa'; c.fillRect(x - 36, y - 280, 72, 10); c.fillStyle = '#9aa6b8'; c.fillRect(x - 1, y - 300, 2, 20); const on = Math.floor(T / 24) % 2; c.fillStyle = on ? '#ff3a3a' : '#7a1a1a'; c.beginPath(); c.arc(x, y - 302, 4, 0, 7); c.fill(); if (on) rmGlow(c, x, y - 302, 22, 0.5, '255,60,60'); }
function r3TicketBooth(c, T) {
  const x = R3_TKT.x, y = R3_TKT.y; if (!rxVis(x - 160, x + 160)) return;
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x - 128, y - 4, 256, 10);
  let g = c.createLinearGradient(0, y - 150, 0, y); g.addColorStop(0, '#2a6ad8'); g.addColorStop(1, '#1a4aa8'); rxRect(c, x - 124, y - 156, 248, 156, 14, g);
  c.fillStyle = '#e8f2ff'; c.fillRect(x - 108, y - 112, 216, 92); g = c.createLinearGradient(0, y - 112, 0, y - 20); g.addColorStop(0, '#d8ecff'); g.addColorStop(1, '#a8d0f4'); c.fillStyle = g; c.fillRect(x - 104, y - 108, 208, 88);
  c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(x - 90, y - 108); c.lineTo(x - 60, y - 108); c.lineTo(x - 84, y - 20); c.lineTo(x - 104, y - 20); c.closePath(); c.fill();
  rxRect(c, x - 96, y - 150, 192, 30, 10, '#ffd23f'); rxTxt(c, '🎫 مركز حجز التذاكر', x, y - 135, 'bold 14px Cairo, Arial', '#1a2a5a');
  c.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { c.globalAlpha = 0.35 + 0.35 * Math.sin(T / 20 + i); c.beginPath(); c.arc(x - 80 + i * 40, y - 160, 2.2, 0, 7); c.fill(); } c.globalAlpha = 1;
}
function r3TicketCounter(c) { const x = R3_TKT.x, y = R3_TKT.y; if (!rxVis(x - 160, x + 160)) return; let g = c.createLinearGradient(0, y - 38, 0, y + 4); g.addColorStop(0, '#f4f6fa'); g.addColorStop(1, '#c8d0dc'); rxRect(c, x - 116, y - 40, 232, 44, 6, g); c.fillStyle = '#2a6ad8'; c.fillRect(x - 116, y - 40, 232, 6); rxTxt(c, 'رحلات يومية للمنتجع الجديد ✈️ • 5💵', x, y - 16, 'bold 11px Cairo, Arial', '#1a2a5a'); if (r3NearTkt()) { c.globalAlpha = 0.6 + 0.4 * Math.sin(RM.T / 8); c.font = '15px system-ui'; c.textAlign = 'center'; c.fillText('👆', x + 128, y - 40); c.globalAlpha = 1; } }
function r3Board(c, x, y, T) { if (!rxVis(x - 90, x + 90)) return; c.fillStyle = '#3a3f4a'; c.fillRect(x - 3, y - 70, 6, 70); rxRect(c, x - 80, y - 126, 160, 62, 6, '#141820'); rxTxt(c, 'المغادرة • DEPARTURES', x, y - 116, 'bold 8.5px Cairo, Arial', '#ffd23f'); const rows = [['BT-101', 'الشمال', Math.floor(T / 30) % 2 ? 'صعود ✈️' : 'BOARDING'], ['BT-202', 'قريباً', '⏳']]; rows.forEach((r, i) => { const yy = y - 98 + i * 16; rxTxt(c, r[0], x - 56, yy, 'bold 8px Arial', '#7affb0'); rxTxt(c, r[1], x - 2, yy, 'bold 8px Cairo, Arial', '#fff'); rxTxt(c, r[2], x + 54, yy, 'bold 7.5px Cairo, Arial', i ? '#aab' : '#ffd23f'); }); }
function r3Sign(c, x, y) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y, 20, 4, 0, 0, 7); c.fill(); c.fillStyle = '#4a4f5a'; c.fillRect(x - 2, y - 96, 4, 96); rxRect(c, x - 58, y - 128, 116, 36, 8, '#1a4aa8'); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.strokeRect(x - 54, y - 124, 108, 28); rxTxt(c, '✈️ المطار ←', x, y - 110, 'bold 13px Cairo, Arial', '#fff'); }
function r3Windsock(c, x, y, T) { c.fillStyle = '#9aa0ab'; c.fillRect(x - 1.5, y - 80, 3, 80); c.save(); c.translate(x, y - 76); c.rotate(0.15 + Math.sin(T / 40) * 0.08); for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#fff' : '#ff5a1a'; c.beginPath(); c.moveTo(i * 9, -6 + i * 1); c.lineTo(i * 9 + 9, -5 + i * 1); c.lineTo(i * 9 + 9, 5 - i * 1); c.lineTo(i * 9, 6 - i * 1); c.fill(); } c.restore(); }
function r3Carts(c, x, y) { if (!rxVis(x - 60, x + 60)) return; for (let i = 0; i < 2; i++) { const cx = x + i * 46; c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(cx, y, 22, 4, 0, 0, 7); c.fill(); c.fillStyle = '#5a6a80'; c.fillRect(cx - 20, y - 12, 40, 6); ['#ff7ab8', '#ffd23f', '#4aa8ff', '#7a2ad8'].forEach((col, k) => rxRect(c, cx - 18 + k * 9, y - 26 + (k % 2) * 4, 8, 14 - (k % 2) * 4, 2, col)); c.fillStyle = '#1d1d24'; c.beginPath(); c.arc(cx - 14, y - 3, 3, 0, 7); c.arc(cx + 14, y - 3, 3, 0, 7); c.fill(); } }
/* الطيارة (منظر جانبي) */
function r3Plane(c, x, y, s, d, col, nm, door) {
  if (!rxVis(x - 220 * s, x + 220 * s) && rmShopId() === 0) return;
  c.save(); c.translate(x, y); c.scale(s * d, s);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, 4, 190, 14, 0, 0, 7); c.fill();
  // العجلات
  c.fillStyle = '#4a4f5a'; c.fillRect(110, -36, 4, 32); c.fillRect(-30, -40, 5, 36); c.fillRect(10, -40, 5, 36); c.fillStyle = '#1d1d24'; [[112, -5, 7], [-28, -6, 9], [12, -6, 9]].forEach(w => { c.beginPath(); c.arc(w[0], w[1], w[2], 0, 7); c.fill(); });
  // الذيل
  c.fillStyle = col; c.beginPath(); c.moveTo(-150, -70); c.lineTo(-196, -150); c.lineTo(-170, -150); c.lineTo(-110, -78); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 13px Arial'; c.textAlign = 'center'; c.save(); c.translate(-170, -112); c.rotate(-0.95); c.fillText('BT', 0, 0); c.restore();
  // الجسم
  let g = c.createLinearGradient(0, -100, 0, -40); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dfe4ec'); c.fillStyle = g; c.beginPath(); c.moveTo(-190, -86); c.quadraticCurveTo(-180, -104, -150, -104); c.lineTo(140, -104); c.quadraticCurveTo(196, -100, 200, -72); c.quadraticCurveTo(196, -44, 150, -42); c.lineTo(-150, -42); c.quadraticCurveTo(-180, -46, -190, -86); c.fill();
  c.fillStyle = col; c.fillRect(-180, -66, 340, 8); c.beginPath(); c.moveTo(160, -66); c.quadraticCurveTo(190, -64, 196, -58); c.lineTo(160, -58); c.fill();
  // الشبابيك
  c.fillStyle = '#2a3a55'; for (let i = 0; i < 16; i++) { c.beginPath(); c.roundRect ? c.roundRect(-140 + i * 17, -92, 9, 12, 4) : c.rect(-140 + i * 17, -92, 9, 12); c.fill(); }
  c.fillStyle = '#1a2a45'; c.beginPath(); c.moveTo(168, -92); c.quadraticCurveTo(186, -92, 192, -80); c.lineTo(170, -80); c.fill();
  // الباب
  if (door) { c.fillStyle = '#c8d0dc'; c.fillRect(118, -98, 18, 40); c.fillStyle = '#2a3a55'; c.fillRect(120, -96, 14, 36); }
  // الجناح والمحرك
  c.fillStyle = '#c8d0dc'; c.beginPath(); c.moveTo(-40, -52); c.lineTo(60, -52); c.lineTo(-10, -18); c.lineTo(-70, -18); c.fill(); c.fillStyle = '#9aa6b8'; rxRect(c, -40, -30, 60, 20, 10, '#aab4c4'); c.fillStyle = '#5a6a80'; c.beginPath(); c.ellipse(20, -20, 4, 10, 0, 0, 7); c.fill();
  c.scale(d, 1); c.fillStyle = col; c.font = 'bold 12px Cairo, Arial'; c.textAlign = 'center'; c.fillText(nm + ' • بابيت إيرلاينز', 0, -110);
  c.restore();
}
function r3PlaneStairs(c) { const x = R3_PLANE.x + 130, y = R3_PLANE.y; if (!rxVis(x - 150, x + 40)) return; c.fillStyle = '#e8ecf2'; c.beginPath(); c.moveTo(x - 6, y - 58); c.lineTo(x - 120, y - 2); c.lineTo(x - 104, y - 2); c.lineTo(x + 6, y - 50); c.fill(); c.strokeStyle = '#9aa6b8'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 4, y - 74); c.lineTo(x - 120, y - 18); c.stroke(); for (let i = 1; i < 8; i++) { c.fillStyle = '#c8d0dc'; c.fillRect(x - 6 - i * 14, y - 58 + i * 7, 14, 2); } c.fillStyle = '#7a2ad8'; c.fillRect(x - 124, y - 6, 26, 6); }
/* طيارة تقلع وتنزل على المدرج */
function r3RunwayPlane(c, T) { const P = 1400, u = (T % P) / P; if (u > 0.5) return; const k = u / 0.5, x = 5200 + k * 2700, lift = k > 0.45 ? (k - 0.45) * 380 : 0, s = 0.42 + lift / 900; if (!rxVis(x - 120, x + 120)) return; c.save(); c.globalAlpha = Math.max(0, 1 - Math.max(0, k - 0.85) * 6); if (lift) { c.fillStyle = 'rgba(0,0,0,' + Math.max(0, 0.2 - lift / 700) + ')'; c.beginPath(); c.ellipse(x, 300, 70 * s, 6, 0, 0, 7); c.fill(); } c.translate(0, -lift); r3Plane(c, x, 300, s, 1, '#e8572a', 'BT-303'); c.restore(); }

/* ===================== الشمال (فاضي حالياً) ===================== */
function r3NewBg(c) {
  const X0 = R3_NHI.vx0, X1 = R3_NHI.vx1, W = X1 - X0, T = RM.T;
  let g = c.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, '#5ab8ff'); g.addColorStop(1, '#d6f3ff'); c.fillStyle = g; c.fillRect(X0, 0, W, 100);
  g = c.createLinearGradient(0, 98, 0, 205); g.addColorStop(0, '#1a9ad8'); g.addColorStop(1, '#5fd4e8'); c.fillStyle = g; c.fillRect(X0, 98, W, 110);
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; for (let r = 0; r < 5; r++) { c.beginPath(); for (let x = X0; x <= X1; x += 14) { const y = 112 + r * 19 + Math.sin(x / 30 + T / 40 + r) * 2.2; x === X0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
  g = c.createLinearGradient(0, 196, 0, 1040); g.addColorStop(0, '#f8e8bc'); g.addColorStop(1, '#ecd09a'); c.fillStyle = g; c.fillRect(X0, 196, W, 850);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(X0, 196); for (let x = X0; x <= X1; x += 10) c.lineTo(x, 198 + Math.sin(x / 22 + T / 24) * 3 + 3); c.lineTo(X1, 190); c.lineTo(X0, 190); c.closePath(); c.fill();
  // مدرج صغير للطيارة
  c.fillStyle = '#3a3f4a'; c.fillRect(R3_N.x0 + 60, 660, 900, 70); c.fillStyle = '#f5f5f5'; for (let x = R3_N.x0 + 80; x < R3_N.x0 + 950; x += 70) c.fillRect(x, 693, 36, 4);
  [[0.15, 30], [0.55, 52], [0.85, 24]].forEach((cl, i) => { const x = X0 + ((cl[0] * W + T * 0.15 * (i + 1)) % W); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(x, cl[1], 36, 11, 0, 0, 7); c.ellipse(x + 22, cl[1] - 6, 24, 11, 0, 0, 7); c.fill(); });
  rmTapDraw(c);
}
function r3NewList() {
  const L = [];
  L.push([700, c => r3Plane(c, R3_N.x0 + 440, 700, 1, 1, '#7a2ad8', 'BT-101', true)]);
  L.push([702, c => { const x = R3_N.x0 + 440 + 130, y = 700; c.fillStyle = '#e8ecf2'; c.beginPath(); c.moveTo(x - 6, y - 58); c.lineTo(x - 120, y - 2); c.lineTo(x - 104, y - 2); c.lineTo(x + 6, y - 50); c.fill(); for (let i = 1; i < 8; i++) { c.fillStyle = '#c8d0dc'; c.fillRect(x - 6 - i * 14, y - 58 + i * 7, 14, 2); } }]);
  L.push([R3_CAP2.y, c => r3Captain(c, R3_CAP2.x, R3_CAP2.y, R3.cap2)]);
  L.push([520, c => { const x = R3_N.x0 + 900, y = 520; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y, 40, 6, 0, 0, 7); c.fill(); c.fillStyle = '#7a4a22'; c.fillRect(x - 40, y - 70, 6, 70); c.fillRect(x + 34, y - 70, 6, 70); rxRect(c, x - 90, y - 130, 180, 66, 10, '#fff6ea'); c.strokeStyle = '#7a2ad8'; c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(x - 90, y - 130, 180, 66, 10) : c.rect(x - 90, y - 130, 180, 66); c.stroke(); rxTxt(c, '❄️ الشمال', x, y - 110, 'bold 16px Lalezar, Cairo, Arial', '#5a1aa8'); rxTxt(c, '🏗️ قريباً تنبني هنا أشياء حلوة', x, y - 84, 'bold 11px Cairo, Arial', '#7a4a22'); }]);
  return L;
}

/* ===================== البنايات صلبة: ما تمشي بنصها 🧱 ===================== */
const R3_SOLID = [];
(function () {
  const S = (x0, x1, y0, y1) => R3_SOLID.push({ x0, x1, y0, y1 });
  [RM_SHOP, RM_PSHOP, RM_FSHOP, RM_BSHOP, RX_SAL].forEach(B => S(B.x - 162, B.x + 162, 388, B.y + 4));   // صف المحلات + صالون ملاذ
  S(RX_HT.x0 - 6, RX_HT.x1 + 6, 212, RX_HT.y + 6);                                                         // فندق بابيت
  S(RX_JUI.x - 92, RX_JUI.x + 92, RX_JUI.y - 70, RX_JUI.y + 4);                                             // كشك العصائر
  S(R3_TKT.x - 128, R3_TKT.x + 128, R3_TKT.y - 150, R3_TKT.y + 10);                                         // مركز حجز التذاكر
  S(R3_TERM.x0 - 4, R3_TERM.x1 + 4, 380, R3_TERM.y + 4);                                                    // التيرمنال
  S(R3_TWR.x - 26, R3_TWR.x + 26, R3_TWR.y - 70, R3_TWR.y + 4);                                             // برج المراقبة
  S(R3_PLANE.x - 196, R3_PLANE.x + 196, R3_PLANE.y - 70, R3_PLANE.y + 2);                                   // الطيارة الواكفة
  S(7330 - 144, 7330 + 144, 560 - 50, 562);                                                                  // الطيارة الثانية
  S(5600 - 10, 5600 + 10, 838, 852);                                                                         // عمود لوحة المغادرة
})();
const r3SolidAt = (x, y) => { for (const r of R3_SOLID) if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) return r; return null; };
function r3Solid(m, px, py) {
  const r = r3SolidAt(m.x, m.y); if (!r) return;
  if (!r3SolidAt(px, py)) { if (!r3SolidAt(m.x, py)) { m.y = py; if (r3SolidAt(m.x, m.ty)) m.ty = py; } else if (!r3SolidAt(px, m.y)) { m.x = px; if (r3SolidAt(m.tx, m.y)) m.tx = px; } else { m.x = px; m.y = py; m.tx = px; m.ty = py; R3.path = []; } return; }
  m.y = r.y1 + 3; if (r3SolidAt(m.tx, m.ty)) { m.tx = m.x; m.ty = m.y; }   // كان جوّه (مثلاً انتقال): نطلعه لقدام البناية
}
/* ===================== الحركة: الجسر، باب الحديقة، البركة ===================== */
function r3Region(x, y) { if (y <= R3_BR.bandA + 8) return 'N'; if (y < R3_BR.bandB) return 'B'; return r3InG(x, y) ? 'G' : 'S'; }
function r3Plan(x, y) {   // يرجّع نقاط الطريق من مكانك للمكان المطلوب
  const m = RM.me, a = r3Region(m.x, m.y), b = r3Region(x, y), gx = R3_G.gx;
  const BB = a === 'B' ? (r3BrAt(m.x) || r3BrNear(m.x)) : R3_BRS.reduce((p, q) => (Math.abs(q.cx - m.x) + Math.abs(q.cx - x) < Math.abs(p.cx - m.x) + Math.abs(p.cx - x) ? q : p)), cx = BB.cx;
  const nN = [cx, R3_BR.bandA - 10], nS = [cx, R3_BR.bandB + 22];
  // نختار باب الحديقة الأقرب: الفوكاني أو اليمين (اللي يطلع للمرج)
  const oP = a === 'G' ? (b === 'S' ? [x, y] : nS) : (a === 'S' ? [m.x, m.y] : nS), iP = a === 'G' ? [m.x, m.y] : [x, y];
  const right = Math.hypot(oP[0] - R3_G.x1, oP[1] - R3_G2.y) + Math.hypot(iP[0] - R3_G.x1, iP[1] - R3_G2.y) < Math.hypot(oP[0] - gx, oP[1] - R3_G.y0) + Math.hypot(iP[0] - gx, iP[1] - R3_G.y0);
  const gO = right ? [R3_G.x1 + 26, R3_G2.y] : [gx, R3_G.y0 - 22], gI = right ? [R3_G.x1 - 30, R3_G2.y] : [gx, R3_G.y0 + 26];
  const seq = { N: 0, B: 1, S: 2, G: 3 }, A = seq[a], Bq = seq[b]; if (A === Bq) return [];
  const pts = []; if (A < Bq) { if (A < 1) pts.push(nN); if (A < 2 && Bq >= 2) pts.push(nS); if (Bq === 3) { pts.push(gO, gI); } else if (Bq === 1) {} }
  else { if (A === 3) pts.push(gI, gO); if (A >= 2 && Bq <= 1) pts.push(nS); if (Bq === 0) pts.push(nN); }
  if (b === 'B') { pts.length = 0; if (a === 'N') pts.push(nN); else if (a !== 'B') { if (a === 'G') pts.push(gI, gO); pts.push(nS); } }
  return pts.filter((p, i) => i > 0 || Math.hypot(p[0] - m.x, p[1] - m.y) > 4);
}
function r3FixTarget(x, y) {
  { const B = r3BrNear(x); if (y > B.bandA && y < B.bandB && (x < B.x0 + 12 || x > B.x1 - 12)) { if (Math.abs(x - B.cx) < 160) x = B.cx; else y = y < 1345 ? B.bandA : B.bandB + 4; }
    if (y > B.bandA && y < B.bandB) x = Math.max(B.x0 + 12, Math.min(B.x1 - 12, x)); }
  if (r3InPond(x, y, 1.06)) { const an = Math.atan2((y - R3_POND.y) / R3_POND.ry, (x - R3_POND.x) / R3_POND.rx); x = R3_POND.x + Math.cos(an) * R3_POND.rx * 1.1; y = R3_POND.y + Math.sin(an) * R3_POND.ry * 1.14; }
  { const r = r3SolidAt(x, y); if (r) y = r.y1 + 6; }
  return [x, y];
}
const r3WalkO = rmWalkTo; rmWalkTo = function (x, y) {
  R3.path = []; R3.autoFly = false; if (R3.flying) return;
  if (rmInShop()) return r3WalkO(x, y);
  const f = r3FixTarget(x, y); x = f[0]; y = f[1]; const P = r3Plan(x, y);
  if (!P.length) return r3WalkO(x, y);
  R3.path = P.slice(1).concat([[x, y]]); return r3WalkO(P[0][0], P[0][1]);
};
const r3UpdO = rmUpdMe; rmUpdMe = function () {
  const m = RM.me, px = m.x, py = m.y; if (R3.flying) { m.tx = m.x; m.ty = m.y; }
  const st = r3UpdO();
  try {
    if (!rmInShop()) {
      const inB = (x, y) => y > R3_BR.bandA + 2 && y < R3_BR.bandB - 2 && !R3_BRS.some(B => x >= B.x0 + 6 && x <= B.x1 - 6);
      if (inB(m.x, m.y)) { if (!inB(px, py)) { m.x = px; m.y = py; } else { m.y = m.y < 1345 ? R3_BR.bandA : R3_BR.bandB; } m.tx = m.x; m.ty = m.y; R3.path = []; }
      const gi0 = r3InG(px, py), gi1 = r3InG(m.x, m.y), atG2 = Math.abs(py - R3_G2.y) < 22 && Math.abs(m.x - R3_G.x1) < 40;
      if (!atG2 && gi0 !== gi1 && Math.abs(m.x - R3_G.gx) > R3_G.gw / 2 + 4 && Math.abs(py - R3_G.y0) < 60) { m.x = px; m.y = py; m.tx = m.x; m.ty = m.y; R3.path = []; }
      if (!atG2 && gi0 !== gi1 && Math.abs(py - R3_G.y0) >= 60) { m.x = px; m.y = py; m.tx = px; m.ty = py; R3.path = []; }
      if (r3InPond(m.x, m.y, 1.04)) { const an = Math.atan2((m.y - R3_POND.y) / R3_POND.ry, (m.x - R3_POND.x) / R3_POND.rx); m.x = R3_POND.x + Math.cos(an) * R3_POND.rx * 1.06; m.y = R3_POND.y + Math.sin(an) * R3_POND.ry * 1.08; m.tx = m.x; m.ty = m.y; }
      r3Solid(m, px, py);
      if (R3.path.length && !m.sit && !m.goal && Math.hypot(m.x - m.tx, m.y - m.ty) < 2.5) { const n = R3.path.shift(); m.tx = n[0]; m.ty = n[1]; }
      if (R3.autoFly && R3.tk && Math.hypot(m.x - R3_CAP.x - 34, m.y - R3_CAP.y) < 40) { R3.autoFly = false; r3GiveTicket(); }
    }
  } catch (e) {}
  return st;
};
const r3WalkLimO = rmWalkLim; rmWalkLim = function () { if (rmShopId() === 8) return [R3_N.x0 + 24, R3_N.x1 - 24, 240, 980]; return r3WalkLimO(); };
const r3ShopIdO = rmShopId; rmShopId = function (o) { const x = (o || RM.me).x; if (x >= 74000) return 8; return r3ShopIdO(o); };
const r3XShiO = rmXShi; rmXShi = function (id, o) { if (id === 8) return R3_NHI; return r3XShiO(id, o); };
const r3XBgO = rmXBg; rmXBg = function (c, sid) { if (sid === 8) return r3NewBg(c); return r3XBgO(c, sid); };
const r3XListO = rmXList; rmXList = function (sid) { if (sid === 8) return r3NewList(); return r3XListO(sid); };
const r3XFgO = rmXFg; rmXFg = function (c, sid) { if (sid === 8) return; return r3XFgO(c, sid); };
const r3SMO = rmShopMusic; rmShopMusic = function (on, tr) { if (on && RM.on && rmShopId() === 8) on = false; return r3SMO(on, tr); };
const r3GroundO = rmXGround; rmXGround = function (c) { r3GroundO(c); try { r3Ground(c); } catch (e) {} };
const r3OutO = rmXOutList; rmXOutList = function (L) { r3OutO(L); try { r3OutList(L); } catch (e) {} };

/* ===================== القرب واللمس والأزرار ===================== */
const r3NearTkt = () => !rmInShop() && Math.abs(RM.me.x - R3_TKT.x) < 130 && RM.me.y > R3_TKT.y + 8 && RM.me.y < R3_TKT.y + 95;
const r3NearCap = () => rmShopId() === 0 && Math.hypot(RM.me.x - R3_CAP.x, RM.me.y - R3_CAP.y) < 95;
const r3NearCap2 = () => rmShopId() === 8 && Math.hypot(RM.me.x - R3_CAP2.x, RM.me.y - R3_CAP2.y) < 100;
function r3Ask() {   // نطلب حالة البجعة/التذكرة بس إذا قربت (أخف على السيرفر)
  const m = RM.me, now = performance.now(); if (rmInShop()) return;
  if (m.y > 1400 && now - R3.swanAsk > 45000) { R3.swanAsk = now; rmSend({ t: 'rm_swan_get' }); }
  if (m.x > 4500 && now - R3.apAsk > 60000) { R3.apAsk = now; rmSend({ t: 'rm_ap_get' }); }
}
const r3HitO = rmXHit; rmXHit = function (x, y) {
  const sid = rmShopId(), m = RM.me;
  if (R3.flying) return true;
  if (sid === 0) {
    if (Math.abs(x - R3_POND.x) < 60 && y > R3_POND.y - 140 && y < R3_POND.y + 10) { if (r3NearSwan()) r3SwanLike(); else rxGo(R3_POND.x, R3_POND.y + R3_POND.ry + 18, '🦢 قرّب على بجعة الحب الأبدي حتى تحط لايك ❤️'); return true; }
    if (Math.abs(x - R3_TKT.x) < 125 && y > R3_TKT.y - 160 && y < R3_TKT.y + 6) { if (r3NearTkt()) r3TktOpen(); else rxGo(R3_TKT.x, R3_TKT.y + 34, '🎫 روح للكاونتر حتى تحجز تذكرة'); return true; }
    if (Math.abs(x - R3_CAP.x) < 26 && y > R3_CAP.y - 80 && y < R3_CAP.y + 8) { if (r3NearCap()) r3CapTalk(); else rxGo(R3_CAP.x + 34, R3_CAP.y + 4); return true; }
  }
  if (sid === 8) { if (Math.abs(x - R3_CAP2.x) < 30 && y > R3_CAP2.y - 80 && y < R3_CAP2.y + 8) { if (r3NearCap2()) r3FlyBack(); else rxGo(R3_CAP2.x + 34, R3_CAP2.y + 4); return true; } return false; }
  return r3HitO(x, y);
};
const r3KeyO = rmXKey; rmXKey = function () { let k = r3KeyO(); try { r3Ask(); k += '|r3' + (r3NearSwan() ? 's' + R3.swanMe : '') + (r3NearTkt() ? 't' + R3.tk : '') + (r3NearCap() ? 'c' + R3.tk : '') + (r3NearCap2() ? 'C' : '') + (R3.flying ? 'F' : ''); } catch (e) {} return k; };
const r3PromptO = rmXPrompt; rmXPrompt = function (mk) {
  const sid = rmShopId(); if (R3.flying) return true;
  if (sid === 8) { if (r3NearCap2()) mk('✈️ ارجع لمنتجع بابيت (مجاناً)', r3FlyBack); return true; }
  if (sid === 0) {
    if (r3NearSwan()) mk(R3.swanMe ? '💖 لايكك محسوب للبجعة' : '❤️ حط لايك لبجعة الحب الأبدي', r3SwanLike);
    if (r3NearTkt()) mk(R3.tk ? '🎫 عندك تذكرة — روح للقبطان' : '🎫 احجز تذكرة طيارة (' + R3.price + '💵)', R3.tk ? r3GoCap : r3TktOpen);
    if (r3NearCap()) mk(R3.tk ? '🎫 سلّم التذكرة للقبطان وطير ✈️' : '👨‍✈️ احچي ويه القبطان', R3.tk ? r3GiveTicket : r3CapTalk);
  }
  return r3PromptO(mk);
};
const r3MsgO = rmXMsg; rmXMsg = function (T, d) {
  if (T === 'rm_swan') { R3.swanN = d.n; if (d.me !== undefined && !d.by) R3.swanMe = d.me ? 1 : 0; if (d.ok) { showToast('❤️ حطيت لايك لبجعة الحب الأبدي — صار عددهم ' + d.n + ' 💖'); r3SwanBurst(22); } else if (d.by && r3NearSwan()) r3SwanBurst(5); rmPrompt(true); return; }
  if (T === 'rm_swan_err') { showToast('⛔ ' + (d.error || '')); return; }
  if (T === 'rm_ap') { R3.tk = d.tk ? 1 : 0; if (d.price) R3.price = d.price; if (typeof d.usd === 'number' && !rmBalAdm()) { try { rmUsdSet(d.usd); } catch (e) {} } if (d.bought) r3Bought(); r3TktRender(); rmPrompt(true); return; }
  if (T === 'rm_ap_err') { showToast('⛔ ' + (d.error || '')); rxSay(R3.agt, d.error || '', 200); const b = document.querySelector('#apShop .htBusy'); if (b) b.classList.remove('htBusy'); return; }
  if (T === 'rm_ap_go') { R3.tk = 0; r3Fly(false); return; }
  return r3MsgO(T, d);
};
const r3HolesO = rmXHoles; rmXHoles = function (hole, fl) {
  r3HolesO(hole, fl);
  if (r3VisY(1380, RMH)) { R3_LAMPS.forEach(p => { if (rxVis(p[0] - 120, p[0] + 120)) hole(p[0], p[1] - 70, 120, 0.9); }); if (rxVis(R3_POND.x - 250, R3_POND.x + 250)) hole(R3_POND.x, R3_POND.y - 60, 190, 0.8); if (rxVis(R3_BR.x0 - 80, R3_BR.x1 + 80)) hole(R3_BR.cx, 1330, 140, 0.6); if (rxVis(R3_G.gx - 150, R3_G.gx + 150)) hole(R3_G.gx, R3_G.y0 - 80, 110, 0.85); }
  if (rxVis(R3_AP.x0, R3_AP.x1)) { hole((R3_TERM.x0 + R3_TERM.x1) / 2, 540, 420, 0.75); hole(R3_TKT.x, R3_TKT.y - 60, 170, 0.9); hole(R3_PLANE.x, R3_PLANE.y - 60, 240, 0.6); hole(R3_TWR.x, R3_TWR.y - 260, 80, 0.8); for (let x = 5010; x < 7780; x += 180) if (rxVis(x - 100, x + 100)) hole(x, 292, 100, 0.55); }
};
const r3GlowO = rmXGlow; rmXGlow = function (c, d, fl) {
  r3GlowO(c, d, fl);
  if (r3VisY(1380, RMH)) { R3_LAMPS.forEach(p => { if (rxVis(p[0] - 60, p[0] + 60)) rmGlow(c, p[0], p[1] - 90, 60 * fl, 0.5 * d, '255,230,150'); }); if (rxVis(R3_POND.x - 200, R3_POND.x + 200)) rmGlow(c, R3_POND.x, R3_POND.y - 70, 130, 0.35 * d, '255,120,190'); }
  if (rxVis(R3_AP.x0, R3_AP.x1)) { rmGlow(c, (R3_TERM.x0 + R3_TERM.x1) / 2, 520, 300, 0.25 * d, '255,220,150'); rmGlow(c, R3_TKT.x, R3_TKT.y - 80, 120, 0.3 * d, '120,180,255'); }
};

/* ===================== مركز حجز التذاكر 🎫 ===================== */
function r3TktOpen() {
  rxCss(); r3Css(); let P = $('apShop'); R3.agt.wave = 60;
  if (!P) { P = document.createElement('div'); P.id = 'apShop'; P.innerHTML = '<div class="spC"><div class="spH"><div class="apIc">🎫</div><div><b>مركز حجز التذاكر</b><small>✈️ مطار بابيت الدولي — رحلات للمنتجع الجديد</small></div><span class="spCo"></span><button type="button" class="spX">✕</button></div><div class="apB"></div></div>'; P.addEventListener('pointerdown', e => { if (e.target === P) r3TktClose(); }); P.querySelector('.spX').onclick = r3TktClose; $('rmBox').appendChild(P); }
  P.style.display = ''; rmSend({ t: 'rm_ap_get' }); r3TktRender(); rxSay(R3.agt, R3.tk ? 'تذكرتك جاهزة 🎫 روح للقبطان يم الطيارة البنفسجية ✈️' : 'أهلاً ' + rmMe() + '! 💙 تريد تسافر للمنتجع الجديد؟', 220);
}
function r3TktClose() { const P = $('apShop'); if (P) P.style.display = 'none'; }
function r3TktRender() {
  const P = $('apShop'); if (!P || P.style.display === 'none') return; P.querySelector('.spCo').textContent = auth ? '💵 ' + usdTxt() : 'ضيف';
  const B = P.querySelector('.apB'); B.innerHTML = '';
  const t = document.createElement('div'); t.className = 'apTk' + (R3.tk ? ' on' : ''); t.innerHTML = '<div class="l"><small>بابيت إيرلاينز ✈️</small><div class="rt"><span><b>منتجع بابيت</b><i>BBT</i></span><em>✈</em><span><b>الشمال</b><i>NTH</i></span></div><div class="mt"><span>رحلة <b>BT-101</b></span><span>البوابة <b>1</b></span><span>المقعد <b>VIP</b></span></div></div><div class="r"><small>السعر</small><b></b><span class="st"></span></div>';
  t.querySelector('.r b').textContent = rmBalAdm() ? 'مجاناً 👑' : R3.price + ' 💵'; t.querySelector('.r .st').textContent = R3.tk ? '✅ محجوزة' : '';
  const n = document.createElement('div'); n.className = 'apN'; n.textContent = R3.tk ? '🎫 تذكرتك جاهزة! روح للقبطان يم الطيارة وسلّمه التذكرة حتى تطير مباشرة ✈️' : '💡 بعد ما تحجز، شخصيتك تمشي للقبطان وتنطيه التذكرة وتطير مباشرة ✈️ — الرجعة مجانية';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'htBtn ' + (R3.tk ? 'g' : ''); btn.textContent = R3.tk ? '🚶 روح للقبطان هسه' : '🎫 احجز التذكرة';
  btn.onclick = () => { if (R3.tk) { r3TktClose(); r3GoCap(); return; } if (!auth) { showToast('🔐 سجّل حساب حتى تحجز تذكرة ✈️'); return; } if (!rmBalAdm() && (RM.usd || 0) < R3.price) { showToast('💵 تحتاج ' + R3.price + ' دولار منتجع — اصطاد سمك وبيعه 🎣'); rxSay(R3.agt, 'التذكرة بـ ' + R3.price + ' دولار 💵 اصطاد سمك وبيعه وارجعلي 🎣', 200); return; } btn.classList.add('htBusy'); rmSend({ t: 'rm_ap_buy' }); };
  B.append(t, n, btn);
}
function r3Bought() { showToast('🎫 انحجزت التذكرة! هسه تروح للقبطان ✈️'); rxSay(R3.agt, 'رحلة سعيدة ' + rmMe() + '! 💙 القبطان ينتظرك ✈️', 220); rxSnd([['sine', 784, 784, 0.15, 0.05], ['sine', 988, 988, 0.15, 0.05, 0.1], ['sine', 1319, 1319, 0.3, 0.05, 0.2]]); setTimeout(() => { r3TktClose(); r3GoCap(); }, 900); }
function r3GoCap() { if (rmShopId() !== 0) return; rmWalkTo(R3_CAP.x + 34, R3_CAP.y + 2); rmTapMark(R3_CAP.x + 34, R3_CAP.y + 2); R3.autoFly = true; R3.cap.wave = 60; rxSay(R3.cap, 'تعال يمي ' + rmMe() + ' ✈️', 160); }
function r3CapTalk() { rxSay(R3.cap, R3.tk ? 'هات التذكرة ونطير سوا ✈️' : 'أهلاً! 👨‍✈️ احجز تذكرة من مركز الحجز 🎫 وأطيّرك للمنتجع الجديد', 240); }
function r3GiveTicket() {
  if (R3.flying || R3.hand) return; if (!R3.tk && !rmBalAdm()) { r3CapTalk(); return; }
  R3.hand = { t: 0 }; rxSay(R3.cap, 'شكراً! 🎫 تفضل اصعد، رحلة سعيدة ✈️', 200); rxSnd([['triangle', 1047, 1047, 0.12, 0.05], ['triangle', 1319, 1319, 0.18, 0.05, 0.1]]);
  const m = RM.me, sx = m.x, sy = m.y - 50, ex = R3_CAP.x + 6, ey = R3_CAP.y - 44, el = document.createElement('div'); let k = 0;
  const step = () => { k++; R3.hand.t = k; if (k < 34) { requestAnimationFrame(step); return; } R3.hand = null; rmSend({ t: 'rm_ap_fly' }); };
  requestAnimationFrame(step); R3.handFx = { sx, sy, ex, ey, t0: RM.T };
}
const r3FxO = typeof rmFxDraw === 'function' ? rmFxDraw : null;
if (r3FxO) rmFxDraw = function (c) { r3FxO(c); const H = R3.handFx; if (H) { const u = (RM.T - H.t0) / 30; if (u > 1) { R3.handFx = null; return; } const x = H.sx + (H.ex - H.sx) * u, y = H.sy + (H.ey - H.sy) * u - Math.sin(u * Math.PI) * 30; c.font = '18px sans-serif'; c.textAlign = 'center'; c.fillText('🎫', x, y); } };
function r3FlyBack() { if (R3.flying) return; rxSay(R3.cap2, 'يلا نرجع لمنتجع بابيت ✈️', 160); setTimeout(() => r3Fly(true), 500); }

/* ===================== الرحلة: سما وغيوم وطيارة تمشي ✈️ ===================== */
function r3Fly(back) {
  if (R3.flying) return; const box = $('rmBox'); if (!box) return; r3Css(); R3.path = []; R3.autoFly = false;
  const ov = document.createElement('div'); ov.id = 'apFly'; ov.innerHTML = '<canvas></canvas><div class="afT"><b>✈️ رحلة BT-101</b><span></span></div><div class="afR"><i class="a"></i><div class="ln"><em></em></div><i class="b"></i></div><div class="afL"><span></span><span></span></div>';
  const lb = ov.querySelectorAll('.afL span'); lb[0].textContent = back ? 'الشمال' : 'منتجع بابيت'; lb[1].textContent = back ? 'منتجع بابيت' : 'الشمال'; ov.querySelector('.afT span').textContent = back ? 'راجعين لمنتجع بابيت 🏝️' : 'في الطريق للمنتجع الجديد 🏝️';
  box.appendChild(ov); const cv = ov.querySelector('canvas'), g = cv.getContext('2d'), dur = 7600, t0 = performance.now(); R3.flying = { t0, back };
  const CL = []; for (let l = 0; l < 3; l++) for (let i = 0; i < 7; i++) CL.push({ l, x: Math.random(), y: 0.08 + Math.random() * 0.8, s: 0.6 + Math.random() * 0.8 });
  let snd = null; try { if (!RM.ambMute) { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const n = actx.createBufferSource(), buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate), D = buf.getChannelData(0); for (let i = 0; i < D.length; i++) D[i] = Math.random() * 2 - 1; n.buffer = buf; n.loop = true; const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; const gn = actx.createGain(); gn.gain.setValueAtTime(0.0001, actx.currentTime); gn.gain.exponentialRampToValueAtTime(0.09, actx.currentTime + 1.2); gn.gain.setValueAtTime(0.09, actx.currentTime + dur / 1000 - 1.4); gn.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur / 1000); n.connect(f); f.connect(gn); gn.connect(actx.destination); n.start(); n.stop(actx.currentTime + dur / 1000 + 0.1); snd = n; } } catch (e) {}
  let moved = false;
  const frame = () => {
    const now = performance.now(), u = Math.min(1, (now - t0) / dur), W = ov.clientWidth || 360, H = ov.clientHeight || 600, dp = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dp)) { cv.width = Math.round(W * dp); cv.height = Math.round(H * dp); } g.setTransform(dp, 0, 0, dp, 0, 0);
    let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a6ad8'); gr.addColorStop(0.55, '#7ac4ff'); gr.addColorStop(1, '#ffd9a8'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,240,180,.9)'; g.beginPath(); g.arc(W * 0.82, H * 0.2, 26, 0, 7); g.fill(); gr = g.createRadialGradient(W * 0.82, H * 0.2, 20, W * 0.82, H * 0.2, 110); gr.addColorStop(0, 'rgba(255,240,180,.5)'); gr.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gr; g.beginPath(); g.arc(W * 0.82, H * 0.2, 110, 0, 7); g.fill();
    const el = (now - t0) / 1000, cloud = (x, y, s, a) => { g.fillStyle = 'rgba(255,255,255,' + a + ')'; g.beginPath(); g.ellipse(x, y, 60 * s, 18 * s, 0, 0, 7); g.ellipse(x + 34 * s, y - 10 * s, 38 * s, 18 * s, 0, 0, 7); g.ellipse(x - 30 * s, y - 6 * s, 32 * s, 14 * s, 0, 0, 7); g.fill(); };
    CL.filter(q => q.l < 2).forEach(q => { const sp = [0.05, 0.11][q.l]; cloud(((q.x - el * sp) % 1 + 1) % 1 * (W + 240) - 120, q.y * H, q.s * (0.6 + q.l * 0.3), 0.55 + q.l * 0.2); });
    // الطيارة
    const bob = Math.sin(el * 2.2) * 6, px = W * (0.18 + 0.62 * (u < 0.15 ? u / 0.15 * 0.5 : u > 0.85 ? 0.5 + (u - 0.85) / 0.15 * 0.5 : 0.5)), py = H * 0.46 + bob + (u < 0.15 ? (0.15 - u) * 300 : u > 0.85 ? (u - 0.85) * 300 : 0), sc = Math.min(0.62, W / 620);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(px - 120 * sc, py - 38 * sc + k * 12); g.lineTo(px - 120 * sc - 200, py - 38 * sc + k * 12 + Math.sin(el * 3) * 2); g.stroke(); }
    g.save(); g.translate(px, py); g.rotate((u < 0.15 ? -0.12 : u > 0.85 ? 0.12 : 0) + Math.sin(el * 2.2) * 0.02); g.translate(-px, -py); const oT = RM.T; try { const vs = { v0: RM.v0, v1: RM.v1 }; RM.v0 = -1e9; RM.v1 = 1e9; r3Plane(g, px, py + 60 * sc, sc, 1, '#7a2ad8', 'BT-101'); RM.v0 = vs.v0; RM.v1 = vs.v1; } catch (e) {} g.restore();
    CL.filter(q => q.l === 2).forEach(q => cloud(((q.x - el * 0.22) % 1 + 1) % 1 * (W + 300) - 150, q.y * H * 1.1, q.s * 1.3, 0.85));
    // تلاشي أول وآخر الرحلة
    const fa = u < 0.08 ? 1 - u / 0.08 : u > 0.9 ? (u - 0.9) / 0.1 : 0; if (fa > 0) { g.fillStyle = 'rgba(255,255,255,' + fa + ')'; g.fillRect(0, 0, W, H); }
    const em = ov.querySelector('.afR em'); if (em) em.style.left = (u * 100) + '%';
    if (u > 0.9 && !moved) { moved = true; r3Arrive(back); }
    if (u < 1) requestAnimationFrame(frame); else { ov.classList.add('out'); setTimeout(() => ov.remove(), 450); R3.flying = null; try { rmPrompt(true); } catch (e) {} showToast(back ? '🏝️ وصلت لمنتجع بابيت — حمدلله على السلامة 💜' : '🏝️ وصلت للمنتجع الجديد! — حالياً فاضي، وقريباً تنبني بي أشياء حلوة ✨'); }
  };
  requestAnimationFrame(frame);
}
function r3Arrive(back) {
  const m = RM.me; try { if (m.sit) { m.sit = false; m.seat = null; } } catch (e) {}
  if (back) { m.x = m.tx = R3_CAP.x + 60; m.y = m.ty = R3_CAP.y + 30; } else { m.x = m.tx = R3_CAP2.x + 60; m.y = m.ty = R3_CAP2.y + 30; R3.cap2.wave = 60; setTimeout(() => rxSay(R3.cap2, 'وصلنا! ❄️ هذا الشمال — إذا تريد ترجع تعال يمي ✈️', 260), 1200); }
  m.dir = 1; m.goal = false; RM.tapMk = null; RM.sent = ''; RM.sentP = 0; RM.camSnap = 1; R3.path = [];
}

/* ===================== الستايل ===================== */
function r3Css() {
  if ($('r3Css')) return; let base = ''; try { const sp = $('spnCss'); const all = sp ? sp.textContent : '', k = all.indexOf('#rmInv'); base = k > 0 ? all.slice(0, k) : all; } catch (e) {}
  const st = document.createElement('style'); st.id = 'r3Css';
  st.textContent = base.replace(/#spnShop/g, '#apShop') +
    '#apShop .spC{background:linear-gradient(170deg,#f2f8ff,#dcebff);border-color:#2a6ad8;color:#0e2a58}#apShop .spH{background:linear-gradient(90deg,#1a4aa8,#4aa0ff)}#apShop .apIc{width:52px;height:52px;display:grid;place-items:center;font-size:32px;background:#fff;border-radius:14px;flex:none}' +
    '#apShop .apB{overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px;direction:rtl}' +
    '#apShop .apTk{display:flex;background:#fff;border-radius:16px;box-shadow:0 6px 18px rgba(26,74,168,.18);overflow:hidden;border:2px solid #cfe0ff}#apShop .apTk.on{border-color:#3ddc84}' +
    '#apShop .apTk .l{flex:1;padding:10px 12px;display:flex;flex-direction:column;gap:6px;border-inline-end:2px dashed #cfe0ff}#apShop .apTk .l>small{font-weight:900;color:#2a6ad8;font-size:11px}' +
    '#apShop .apTk .rt{display:flex;align-items:center;justify-content:space-between;gap:6px}#apShop .apTk .rt span{display:flex;flex-direction:column;align-items:center}#apShop .apTk .rt b{font-size:13px}#apShop .apTk .rt i{font-style:normal;font-size:18px;font-weight:900;color:#1a4aa8;letter-spacing:1px}#apShop .apTk .rt em{font-style:normal;font-size:22px;color:#7a2ad8;animation:apFl 2s ease-in-out infinite}@keyframes apFl{50%{transform:translateY(-4px) rotate(-8deg)}}' +
    '#apShop .apTk .mt{display:flex;gap:8px;font-size:10.5px;color:#4a5a7a}#apShop .apTk .mt b{color:#0e2a58}' +
    '#apShop .apTk .r{width:92px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:linear-gradient(180deg,#ffd23f,#ffb21f)}#apShop .apTk .r small{font-size:10.5px;font-weight:900;color:#5a3a00}#apShop .apTk .r b{font-size:16px;color:#3a2200}#apShop .apTk .r .st{font-size:11px;font-weight:900;color:#0e6b31}' +
    '#apShop .apN{font-size:12px;background:#fff;border-radius:12px;padding:8px 10px;border:1.5px solid #cfe0ff;line-height:1.6}#apShop .htBtn{font-size:15px;padding:12px}#apShop .htBusy{opacity:.6;pointer-events:none}' +
    '#apFly{position:absolute;inset:0;z-index:60;overflow:hidden;animation:afIn .35s ease;direction:rtl}#apFly.out{opacity:0;transition:opacity .45s}@keyframes afIn{from{opacity:0}}#apFly canvas{position:absolute;inset:0;width:100%;height:100%}' +
    '#apFly .afT{position:absolute;top:calc(14px + env(safe-area-inset-top));left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:4px;color:#fff;text-shadow:0 2px 8px rgba(0,0,40,.45)}#apFly .afT b{font-size:22px}#apFly .afT span{font-size:14px;font-weight:900;background:rgba(10,30,80,.35);padding:4px 14px;border-radius:14px}' +
    '#apFly .afR{position:absolute;bottom:58px;left:24px;right:24px;display:flex;align-items:center;gap:8px;direction:ltr}#apFly .afR i{width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.35);flex:none}#apFly .afR .ln{flex:1;height:4px;border-radius:4px;background:repeating-linear-gradient(90deg,#fff 0 10px,transparent 10px 18px);position:relative}#apFly .afR em{position:absolute;top:50%;transform:translate(-50%,-55%);font-style:normal;font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,40,.4))}' +
    '#apFly .afL{position:absolute;bottom:26px;left:12px;right:12px;display:flex;justify-content:space-between;color:#fff;font-weight:900;font-size:12.5px;text-shadow:0 1px 6px rgba(0,0,40,.5);direction:ltr}';
  document.head.appendChild(st);
}
