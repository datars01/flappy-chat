/* بابيتو شات — (1) قفل الألعاب: ما تركب إلا بزر «اركب» وما تنزل إلا بزر «انزل» (الدوسات على الشاشة ما تنزلك)،
   (2) أراضي مشاريع قادمة كدام كل محل، وشارع ثاني بأضوية كدامها، (3) نقل لوحة قناة التلي والدوّارة لأماكن أنسب. */
(function () {
  'use strict';
  if (typeof RM === 'undefined' || typeof rmRideOf !== 'function') return;
  const TAU = Math.PI * 2, now = () => Date.now() / 1000, nightD = () => (RM.dn && RM.dn.d) || 0;
  const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
  const ell = (c, x, y, a, b) => { c.beginPath(); c.ellipse(x, y, Math.max(.1, a), Math.max(.1, b), 0, 0, TAU); };
  const R7 = window.R7 = { exitOK: 0, tipT: 0 };

  /* ================= 1) قفل الركوب والنزول ================= */
  const riding = () => !!rmRideOf(RM.me);
  const tip = t => { if (performance.now() - R7.tipT < 2500) return; R7.tipT = performance.now(); showToast(t); };
  const sdOld = rmSetDance;
  rmSetDance = function (e) { const m = RM.me; e = e | 0;
    if (riding() && e !== (m.dance | 0) && !rmRideOf({ dance: e }) && performance.now() > R7.exitOK) { tip('🚪 حتى تنزل من اللعبة دوس زر «انزل»'); return; }
    return sdOld(e); };
  // زر «انزل» / زر الخروج من المنتجع هم الوحيدين اللي يسمحون بالنزول
  document.addEventListener('click', ev => { const b = ev.target && ev.target.closest && ev.target.closest('button'); if (!b) return; const t = b.textContent || '';
    if (/انزل|نزول/.test(t)) R7.exitOK = performance.now() + 900;
    if (b.id === 'rmExitTop' && riding()) { R7.exitOK = performance.now() + 900; try { sdOld(0); } catch (e) {} } }, true);
  const promptOld = rmXPrompt; rmXPrompt = function (mk) {
    const r = rmRideOf(RM.me);
    if (r && r.k !== 'boat') { mk('🚪 انزل من اللعبة', () => { R7.exitOK = performance.now() + 900; rmSetDance(0); rmPrompt(true); }); return true; }
    return promptOld(mk); };
  // وانت راكب: أي دوسة على المنتجع ما تسوي شي (لا تمشيك ولا تكعدك ولا تدخلك محل)
  const hitOld = rmXHit; rmXHit = function (x, y) { if (riding()) { tip('🎢 انت راكب — دوس «انزل» إذا تريد تنزل'); return true; } return hitOld(x, y); };

  /* ================= 2) نقل لوحة التلي والدوّارة ================= */
  const moveDecor = (name, y) => { const d = RM_DECOR.find(q => String(q.f).indexOf(name) >= 0); if (d) d.y = y; };
  RM_TG.x = 1380; RM_TG.y = 1160; moveDecor('rmTgDraw', RM_TG.y);                       // نزلت جوا، بعيد عن أراضي المحلات الجاية
  RM_CAR.x = 140; RM_CAR.y = 1112; moveDecor('rmCarouselDraw', RM_CAR.y + 20);          // الدوّارة صارت جوا منتجع بابي، يم بوابة التصوير

  /* ================= 3) أراضي المشاريع القادمة + الشارع الثاني ================= */
  const LOTS = [1650, 2019, 2381, 2731].map((x, i) => ({ x, i, w: 300, y0: 656, y1: 830 }));
  const ST = { x0: 1262, x1: 3330, y0: 862, y1: 902 };
  window.R7_LOTS = { x: 2190, y: 800 };
  function street(c) { if (RM.v1 < ST.x0 || RM.v0 > ST.x1 || RM.vy1 < ST.y0 - 10 || RM.vy0 > ST.y1 + 10) return; const a = Math.max(ST.x0, RM.v0 - 20), b = Math.min(ST.x1, RM.v1 + 20);
    c.fillStyle = 'rgba(150,110,60,.25)'; c.beginPath(); c.moveTo(a, ST.y0 - 4); for (let x = a; x <= b; x += 20) c.lineTo(x, ST.y0 - 4 + Math.sin(x / 37) * 1.6); for (let x = b; x >= a; x -= 20) c.lineTo(x, ST.y1 + 4 + Math.sin(x / 41) * 1.6); c.closePath(); c.fill();
    const g = c.createLinearGradient(0, ST.y0, 0, ST.y1); g.addColorStop(0, '#dcb984'); g.addColorStop(.5, '#d2ab72'); g.addColorStop(1, '#c79e64'); c.fillStyle = g;
    c.beginPath(); c.moveTo(a, ST.y0); for (let x = a; x <= b; x += 20) c.lineTo(x, ST.y0 + Math.sin(x / 37) * 1.6); for (let x = b; x >= a; x -= 20) c.lineTo(x, ST.y1 + Math.sin(x / 41) * 1.6); c.closePath(); c.fill();
    for (let i = 0; i < 140; i++) { const x = ST.x0 + 10 + (i * 137) % (ST.x1 - ST.x0 - 20), y = ST.y0 + 4 + (i * 53) % (ST.y1 - ST.y0 - 8); if (x < a || x > b) continue; c.fillStyle = i % 3 ? 'rgba(120,85,45,.35)' : 'rgba(255,240,210,.5)'; ell(c, x, y, 1.6 + (i % 2), 1.1); c.fill(); }
    c.fillStyle = 'rgba(140,100,55,.22)'; for (let x = ST.x0 + 40; x < ST.x1 - 20; x += 46) { if (x < a || x > b) continue; const y = ST.y0 + 12 + ((x / 46) % 2) * 12; c.beginPath(); c.ellipse(x, y, 3.2, 5, 1.4, 0, 7); c.fill(); } }
  function lotGround(c, L) { const x0 = L.x - L.w / 2, x1 = L.x + L.w / 2; if (RM.v1 < x0 || RM.v0 > x1) return;
    const g = c.createLinearGradient(0, L.y0, 0, L.y1); g.addColorStop(0, '#b89668'); g.addColorStop(1, '#a5845a'); c.fillStyle = g; rr(c, x0, L.y0, L.w, L.y1 - L.y0, 6); c.fill();
    for (let k = 0; k < 70; k++) { const px = x0 + 8 + (k * 97 + L.i * 31) % (L.w - 16), py = L.y0 + 6 + (k * 43) % (L.y1 - L.y0 - 12); c.fillStyle = k % 3 ? 'rgba(90,65,35,.35)' : 'rgba(240,225,190,.45)'; ell(c, px, py, 1.8, 1.2); c.fill(); }
    c.strokeStyle = 'rgba(80,55,30,.3)'; c.lineWidth = 5; c.beginPath(); c.moveTo(x0 + 30, L.y1 - 6); c.quadraticCurveTo(L.x, L.y0 + 50, x1 - 40, L.y0 + 20); c.stroke(); c.lineWidth = 1; c.setLineDash([3, 4]); c.strokeStyle = 'rgba(60,40,20,.35)'; c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.4; c.setLineDash([6, 5]); c.strokeRect(L.x - 90, L.y0 + 26, 180, 76); c.setLineDash([]); }   // خطوط تخطيط الأساس
  function crane(c, x, y, s, t) { const H = 118; c.save(); c.strokeStyle = '#f2b416'; c.lineWidth = 2; c.fillStyle = '#f2b416';
    c.fillRect(x - 6, y - H, 3, H); c.fillRect(x + 3, y - H, 3, H); c.beginPath(); for (let yy = y; yy > y - H; yy -= 12) { c.moveTo(x - 5, yy); c.lineTo(x + 5, yy - 12); } c.stroke();
    c.fillStyle = '#5a5a62'; rr(c, x - 12, y - 6, 24, 8, 2); c.fill();
    c.fillStyle = '#f2b416'; c.fillRect(x - 60 * s - (s < 0 ? 0 : 0), y - H - 4, 0, 0); const jx0 = x - 26 * s, jx1 = x + 86 * s; c.fillRect(Math.min(jx0, jx1), y - H - 5, Math.abs(jx1 - jx0), 4);
    c.beginPath(); for (let k = 0; k < 11; k++) { const u = jx0 + (jx1 - jx0) * k / 11, v = jx0 + (jx1 - jx0) * (k + 1) / 11; c.moveTo(u, y - H - 1); c.lineTo(v, y - H - 9); } c.stroke(); c.fillRect(Math.min(jx0, jx1), y - H - 10, Math.abs(jx1 - jx0), 2);
    c.fillStyle = '#5a5a62'; rr(c, jx0 - 6 * s - 6, y - H - 12, 12, 12, 2); c.fill(); c.fillStyle = '#2a3a4a'; rr(c, x - 7, y - H + 2, 14, 12, 2); c.fill(); c.fillStyle = 'rgba(160,220,255,.8)'; c.fillRect(x - 5, y - H + 4, 10, 5);
    const hx = x + (40 + Math.sin(t * .4) * 30) * s, hy = y - H + 46 + Math.sin(t * .7) * 10; c.strokeStyle = 'rgba(40,40,40,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(hx, y - H - 3); c.lineTo(hx, hy); c.stroke();
    c.fillStyle = '#4a4a52'; rr(c, hx - 4, hy - 2, 8, 5, 1); c.fill(); c.fillStyle = '#c0562a'; rr(c, hx - 14, hy + 6, 28, 9, 1); c.fill(); c.strokeStyle = 'rgba(40,40,40,.6)'; c.beginPath(); c.moveTo(hx, hy + 3); c.lineTo(hx - 12, hy + 6); c.moveTo(hx, hy + 3); c.lineTo(hx + 12, hy + 6); c.stroke();
    const on = Math.sin(t * 4) > 0; c.fillStyle = on ? '#ff3a2a' : 'rgba(120,30,30,.6)'; c.beginPath(); c.arc(jx1, y - H - 12, 2.6, 0, TAU); c.fill(); if (on && nightD() > .2) { c.fillStyle = 'rgba(255,60,40,.25)'; c.beginPath(); c.arc(jx1, y - H - 12, 9, 0, TAU); c.fill(); }
    c.restore(); }
  function scaffold(c, x, y, w, h) { c.save(); c.fillStyle = 'rgba(190,190,200,.55)'; c.fillRect(x, y - h * .45, w, h * .45); c.fillStyle = '#c8a070'; for (let k = 0; k < 4; k++) c.fillRect(x + 6 + k * (w - 12) / 3 - 1, y - h * .45, 2, h * .45);
    c.fillStyle = 'rgba(150,150,160,.5)'; for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) c.fillRect(x + 4 + k * (w - 8) / 5, y - h * .45 + 6 + r * 14, (w - 8) / 5 - 5, 8);   // جدران بلوك نص مبنية
    c.strokeStyle = '#7a8a9a'; c.lineWidth = 1.6; c.beginPath(); for (let k = 0; k <= 4; k++) { const xx = x + k * w / 4; c.moveTo(xx, y); c.lineTo(xx, y - h); } for (let k = 1; k <= 3; k++) { const yy = y - k * h / 3; c.moveTo(x, yy); c.lineTo(x + w, yy); } for (let k = 0; k < 4; k++) { c.moveTo(x + k * w / 4, y - (k % 2 ? 0 : h / 3)); c.lineTo(x + (k + 1) * w / 4, y - (k % 2 ? h / 3 : 0)); } c.stroke();
    c.fillStyle = '#b07a3a'; for (let k = 1; k <= 3; k++) c.fillRect(x - 2, y - k * h / 3 - 2, w + 4, 3);
    c.fillStyle = 'rgba(40,150,80,.35)'; c.fillRect(x + w * .5, y - h, w * .5, h * .66); c.restore(); }   // شبكة خضرة على نص السقالة
  function mixer(c, x, y, t) { c.save(); c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, x, y + 2, 22, 5); c.fill(); c.fillStyle = '#2a2a2a'; [-10, 10].forEach(dx => { c.beginPath(); c.arc(x + dx, y - 4, 4.5, 0, TAU); c.fill(); });
    c.fillStyle = '#d84a2a'; rr(c, x - 16, y - 12, 32, 6, 2); c.fill(); c.save(); c.translate(x, y - 24); c.rotate(-.5); const g = c.createLinearGradient(0, -10, 0, 10); g.addColorStop(0, '#ffb04a'); g.addColorStop(1, '#c86a1a'); c.fillStyle = g; ell(c, 0, 0, 15, 11); c.fill();
    c.strokeStyle = 'rgba(90,40,10,.6)'; c.lineWidth = 1.4; for (let k = 0; k < 3; k++) { const a = t * 3 + k * 2.1; c.beginPath(); c.moveTo(Math.cos(a) * 12, Math.sin(a) * 6 - 4); c.lineTo(Math.cos(a) * 12, Math.sin(a) * 6 + 4); c.stroke(); } c.fillStyle = '#5a5a5a'; ell(c, 14, 0, 3, 6); c.fill(); c.restore(); c.restore(); }
  function sandPile(c, x, y, col) { c.save(); const g = c.createLinearGradient(0, y - 22, 0, y); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); c.fillStyle = g; c.beginPath(); c.moveTo(x - 30, y); c.quadraticCurveTo(x - 10, y - 28, x + 4, y - 22); c.quadraticCurveTo(x + 18, y - 18, x + 30, y); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; ell(c, x - 6, y - 18, 7, 3); c.fill(); c.restore(); }
  function bricks(c, x, y) { c.save(); c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, x, y + 2, 24, 4); c.fill(); c.fillStyle = '#8a6a3a'; c.fillRect(x - 22, y - 4, 44, 4); for (let r = 0; r < 4; r++) for (let k = 0; k < 4 - (r % 2); k++) { c.fillStyle = (r + k) % 2 ? '#c8543a' : '#b2462e'; c.fillRect(x - 20 + k * 10 + (r % 2) * 5, y - 10 - r * 6, 9, 5); } c.restore(); }
  function lotBack(c, L) { const x0 = L.x - L.w / 2; if (RM.v1 < x0 - 40 || RM.v0 > x0 + L.w + 140) return; const t = now(), s = L.i % 2 ? -1 : 1;
    crane(c, L.x - 126 * s, L.y0 + 70, s, t + L.i * 3);
    scaffold(c, L.x - 62, L.y0 + 82, 124, 96);
    bricks(c, L.x - 90 * s, L.y0 + 80);
    if (L.i % 2) mixer(c, L.x + 126 * s, L.y0 + 128, t); else sandPile(c, L.x + 124 * s, L.y0 + 128, ['#e8cf98', '#c8a868']);
    sandPile(c, L.x + 88 * s, L.y0 + 84, ['#a0a0a8', '#76767e']); }   // حصو
  function lotFront(c, L) { const x0 = L.x - L.w / 2, x1 = L.x + L.w / 2, y = L.y1, t = now(), nd = nightD(); if (RM.v1 < x0 || RM.v0 > x1) return; c.save();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x0, y, L.w, 5);
    // سياج الموقع: ألواح بيض وخط أصفر وأسود
    const fg = c.createLinearGradient(0, y - 40, 0, y); fg.addColorStop(0, '#fbfbfd'); fg.addColorStop(1, '#dfe3ea'); c.fillStyle = fg; c.fillRect(x0, y - 40, L.w, 40);
    c.save(); c.beginPath(); c.rect(x0, y - 12, L.w, 9); c.clip(); for (let x = x0 - 12; x < x1; x += 16) { c.fillStyle = '#ffcc1a'; c.beginPath(); c.moveTo(x, y - 3); c.lineTo(x + 8, y - 12); c.lineTo(x + 16, y - 12); c.lineTo(x + 8, y - 3); c.closePath(); c.fill(); c.fillStyle = '#1a1a1a'; c.beginPath(); c.moveTo(x + 8, y - 3); c.lineTo(x + 16, y - 12); c.lineTo(x + 24, y - 12); c.lineTo(x + 16, y - 3); c.closePath(); c.fill(); } c.restore();
    c.fillStyle = 'rgba(120,130,150,.35)'; for (let x = x0; x <= x1; x += 50) c.fillRect(x - 1, y - 40, 2, 40); c.fillStyle = '#9aa2b0'; c.fillRect(x0, y - 42, L.w, 3);
    c.fillStyle = 'rgba(60,90,140,.55)'; c.font = 'bold 9px Cairo, system-ui'; c.textAlign = 'center'; c.fillText('⚠️ منطقة عمل — ممنوع الدخول', x0 + 52, y - 20); c.fillText('🏗️ بابيتو للإنشاءات', x1 - 52, y - 20);
    // اللوحة الكبيرة
    const bw = 196, bh = 48, bx = L.x - bw / 2, by = y - 40 - bh - 8; c.fillStyle = '#5a5a62'; c.fillRect(L.x - 64, by + bh, 4, 12); c.fillRect(L.x + 60, by + bh, 4, 12);
    const bg = c.createLinearGradient(0, by, 0, by + bh); bg.addColorStop(0, '#1d3d6e'); bg.addColorStop(1, '#122a4e'); c.fillStyle = bg; rr(c, bx, by, bw, bh, 9); c.fill();
    c.lineWidth = 2.4; c.strokeStyle = '#ffcc1a'; c.shadowColor = '#ffcc1a'; c.shadowBlur = 3 + nd * 10; rr(c, bx, by, bw, bh, 9); c.stroke(); c.shadowBlur = 0;
    c.fillStyle = '#ffcc1a'; c.font = 'bold 13px Cairo, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏗️ قريباً ✨', L.x, by + 15);
    c.fillStyle = '#ffffff'; c.font = 'bold 12px Cairo, system-ui'; c.fillText('سوف يتم بناء شيء هنا بالمستقبل', L.x, by + 33); c.textBaseline = 'alphabetic';
    // أقماع وحواجز ولمبات تحذير
    [x0 + 14, x1 - 14].forEach((cx, k) => { c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, cx, y + 8, 8, 3); c.fill(); c.fillStyle = '#ff6a1a'; c.beginPath(); c.moveTo(cx - 6, y + 7); c.lineTo(cx, y - 12); c.lineTo(cx + 6, y + 7); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.fillRect(cx - 3.6, y - 3, 7.2, 3); c.fillStyle = '#2a2a2a'; c.fillRect(cx - 8, y + 6, 16, 3);
      const on = Math.sin(t * 5 + k * Math.PI + L.i) > 0; c.fillStyle = on ? '#ffb01a' : 'rgba(140,90,20,.6)'; c.beginPath(); c.arc(cx, y - 46, 3, 0, TAU); c.fill(); if (on && nd > .2) { c.fillStyle = 'rgba(255,180,40,.28)'; c.beginPath(); c.arc(cx, y - 46, 11, 0, TAU); c.fill(); } });
    c.restore(); }

  // نضيفها: الأرض والشارع ويا طبقة الأرض، والباقي حسب العمق
  const groundOld = rmXGround; rmXGround = function (c) { try { groundOld(c); } catch (e) {} if (rmInShop()) return; street(c); LOTS.forEach(L => lotGround(c, L)); };
  LOTS.forEach(L => { RM_DECOR.push({ y: L.y0 + 84, f: c => lotBack(c, L) }, { y: L.y1, f: c => lotFront(c, L) }); });
  const NEW_LAMPS = [1330, 1500, 1830, 2200, 2560, 2900, 3240].map(x => [x, 906]);
  NEW_LAMPS.forEach(L => { RM_LAMPS.push(L); RM_DECOR.push({ y: L[1], f: c => rmLampDraw(c, L) }); });
  // دوسة على اللوحة = رسالة صغيرة
  const hit2 = rmXHit; rmXHit = function (x, y) { if (!rmInShop() && !riding()) for (const L of LOTS) if (Math.abs(x - L.x) < 105 && y > L.y1 - 100 && y < L.y1 - 40) { showToast('🏗️ قريباً… راح ينبني هنا شي جديد ✨ تابعونا'); return true; } return hit2(x, y); };
})();
