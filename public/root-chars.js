/* شخصيات منتظر روت — الرسم (نفس صفحة الشخصيات) */
(function(){
'use strict';
/* ===================== أدوات الرسم ===================== */
const OL = '#24140e', TAU = Math.PI * 2;
const pen = (c, w) => { c.lineWidth = w || 5; c.strokeStyle = OL; c.lineJoin = 'round'; c.lineCap = 'round'; };
const fs = (c, f) => { c.fillStyle = f; c.fill(); c.stroke(); };
const lg = (c, x0, y0, x1, y1, ...s) => { const g = c.createLinearGradient(x0, y0, x1, y1); s.forEach((col, i) => g.addColorStop(i / (s.length - 1), col)); return g; };
const rg = (c, x, y, r, a, b) => { const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .08, x, y, r); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, rx, ry, a || 0, 0, TAU); };
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
const shadow = (c, x, y, w) => { c.save(); c.fillStyle = 'rgba(36,20,14,.18)'; ell(c, x, y, w, w * .16); c.fill(); c.restore(); };
function eye(c, x, y, r, o) { o = o || {};
  pen(c, 3.5); ell(c, x, y, r, r * (o.tall || 1.08)); fs(c, '#fff');
  const lx = (o.lx || 0) * r * .35, ly = (o.ly || 0) * r * .3;
  c.fillStyle = o.iris || OL; ell(c, x + lx, y + ly + r * .1, r * .58, r * .66); c.fill();
  c.fillStyle = '#fff'; ell(c, x + lx - r * .2, y + ly - r * .12, r * .2, r * .2); c.fill(); ell(c, x + lx + r * .18, y + ly + r * .32, r * .09, r * .09); c.fill();
  if (o.lid) { c.save(); ell(c, x, y, r, r * (o.tall || 1.08)); c.clip(); c.fillStyle = o.lidc || '#c98a5a'; c.fillRect(x - r - 2, y - r * 1.2, r * 2 + 4, r * 2.2 * o.lid); c.restore(); pen(c, 3.5); c.beginPath(); c.moveTo(x - r, y - r * 1.1 + r * 2.2 * o.lid); c.lineTo(x + r, y - r * 1.1 + r * 2.2 * o.lid); c.stroke(); }
}
function shut(c, x, y, r) { pen(c, 4); c.beginPath(); c.arc(x, y - r * .2, r * .8, .15 * Math.PI, .85 * Math.PI); c.stroke(); }
function mouth(c, x, y, w, k) { pen(c, 4);
  if (k === 'smile') { c.beginPath(); c.arc(x, y - w * .5, w, .2 * Math.PI, .8 * Math.PI); c.stroke(); return; }
  if (k === 'o') { ell(c, x, y, w * .35, w * .45); fs(c, '#7a1f2b'); return; }
  if (k === 'smug') { c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y + w * .5, x + w, y - w * .45); c.stroke(); return; }
  if (k === 'teeth') { c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y + w * 1.2, x + w, y); c.closePath(); fs(c, '#7a1f2b'); c.save(); c.clip(); c.fillStyle = '#fff'; c.fillRect(x - w, y - 2, w * 2, w * .32); c.restore(); pen(c, 4); c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y + w * 1.2, x + w, y); c.closePath(); c.stroke(); return; }
  c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y + w * 1.25, x + w, y); c.closePath(); fs(c, '#7a1f2b');
  c.save(); c.clip(); c.fillStyle = '#ff7a8f'; ell(c, x, y + w * .85, w * .55, w * .35); c.fill(); c.restore(); pen(c, 4); c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y + w * 1.25, x + w, y); c.closePath(); c.stroke();
}
const blush = (c, x, y, r) => { c.fillStyle = 'rgba(255,90,110,.35)'; ell(c, x, y, r || 7, (r || 7) * .6); c.fill(); };
function leg(c, x, y, len, shoe, swing) { const fx = x + (swing || 0); pen(c, 6); c.beginPath(); c.moveTo(x, y); c.lineTo(fx, y + len); c.stroke();
  pen(c, 3.5); if (shoe === 'sneaker') { rr(c, fx - 9, y + len - 3, 22, 11, 6); fs(c, '#e8344a'); c.fillStyle = '#fff'; c.fillRect(fx - 7, y + len + 4, 18, 3); }
  else if (shoe === 'flip') { ell(c, fx + 2, y + len + 3, 12, 4); fs(c, '#2fb6a3'); }
  else if (shoe === 'hoof') { rr(c, fx - 7, y + len - 2, 14, 9, 3); fs(c, '#5a3a24'); }
  else { ell(c, fx + 3, y + len + 2, 10, 5); fs(c, shoe || '#ff9d1f'); } }
function arm(c, x0, y0, x1, y1, hand) { pen(c, 5.5); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 6, x1, y1); c.stroke(); pen(c, 3.5); ell(c, x1, y1, 6, 6); fs(c, hand || '#fff'); }
const shine = (c, x, y, rx, ry, a) => { c.save(); c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, x, y, rx, ry, a); c.fill(); c.restore(); };
function notes(c, x, y, t, col) { c.save(); c.font = 'bold 20px sans-serif'; c.fillStyle = col || OL; for (let i = 0; i < 2; i++) { const k = (t * .6 + i * .5) % 1; c.globalAlpha = 1 - k; c.fillText(i ? '♫' : '♪', x + i * 16 + Math.sin(k * 6) * 4, y - k * 34); } c.restore(); }
function steam(c, x, y, t) { c.save(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const k = (t * .5 + i / 3) % 1; c.globalAlpha = 1 - k; c.beginPath(); const sx = x - 14 + i * 14, sy = y - k * 30; c.moveTo(sx, sy); c.bezierCurveTo(sx + 7, sy - 7, sx - 7, sy - 13, sx, sy - 20); c.stroke(); } c.restore(); }
function sparkle(c, x, y, s, col) { c.save(); c.translate(x, y); c.fillStyle = col || '#fff'; c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * .3 : s, a = i * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore(); }

/* ===================== الشخصيات ===================== */
const R = { common: ['عادي', 'r-common'], rare: ['نادر', 'r-rare'], epic: ['ملحمي', 'r-epic'], leg: ['أسطوري', 'r-leg'], myth: ['خرافي', 'r-myth'], secret: ['سري', 'r-secret'] };
const CHARS = [
{ id: 'istikan', n: 'استكانو شايّو', r: 'common', d: 'استكان چاي حار يركض بقنادر حمر، وكل ما يتعب يشرب نفسه.', draw(c, t) {
  shadow(c, 100, 186, 52); const sw = Math.sin(t * 6) * 6; leg(c, 86, 154, 22, 'sneaker', -sw); leg(c, 114, 154, 22, 'sneaker', sw);
  pen(c); ell(c, 100, 152, 54, 11); fs(c, lg(c, 0, 142, 0, 162, '#fff', '#d9d2c4')); c.strokeStyle = '#d4a017'; c.lineWidth = 2; ell(c, 100, 150, 46, 8); c.stroke();
  const glass = () => { c.beginPath(); c.moveTo(64, 46); c.lineTo(136, 46); c.bezierCurveTo(130, 82, 114, 96, 120, 112); c.bezierCurveTo(126, 128, 128, 140, 124, 146); c.lineTo(76, 146); c.bezierCurveTo(72, 140, 74, 128, 80, 112); c.bezierCurveTo(86, 96, 70, 82, 64, 46); c.closePath(); };
  pen(c); glass(); fs(c, 'rgba(255,255,255,.55)'); c.save(); glass(); c.clip(); c.fillStyle = lg(c, 0, 58, 0, 146, '#c2401a', '#7a1d08'); c.fillRect(50, 58 + Math.sin(t * 3) * 1.5, 100, 100); c.fillStyle = 'rgba(255,200,120,.5)'; c.fillRect(50, 58 + Math.sin(t * 3) * 1.5, 100, 4); c.restore(); pen(c); glass(); c.stroke();
  shine(c, 76, 80, 4, 18, .1); pen(c, 4); c.strokeStyle = '#b9b9c2'; c.beginPath(); c.moveTo(118, 30); c.lineTo(108, 120); c.stroke(); pen(c, 3); ell(c, 119, 28, 6, 4); fs(c, '#d8d8e0');
  eye(c, 88, 92, 10, { lx: .3 }); eye(c, 112, 92, 10, { lx: .3 }); mouth(c, 100, 112, 9); steam(c, 100, 38, t); } },
{ id: 'samoon', n: 'سموني طيّارو', r: 'common', d: 'صمونة حجري لابسة نظارة طيار، تطير الصبح للفرن وترجع حارة.', draw(c, t) {
  shadow(c, 100, 186, 40); const f = Math.sin(t * 10) * .5; c.save(); c.translate(100, 108 + Math.sin(t * 3) * 5);
  [-1, 1].forEach(s => { c.save(); c.scale(s, 1); c.rotate(-f * .6); pen(c, 4); c.beginPath(); c.moveTo(30, -6); c.quadraticCurveTo(70, -50, 92, -26); c.quadraticCurveTo(76, -20, 82, -6); c.quadraticCurveTo(64, -8, 66, 6); c.quadraticCurveTo(48, 0, 30, 10); c.closePath(); fs(c, '#fff'); c.restore(); });
  pen(c); c.beginPath(); c.moveTo(-58, 10); c.quadraticCurveTo(-40, -40, 0, -46); c.quadraticCurveTo(40, -40, 58, 10); c.quadraticCurveTo(30, 40, 0, 42); c.quadraticCurveTo(-30, 40, -58, 10); c.closePath(); fs(c, rg(c, 0, 0, 62, '#f7c46c', '#b86b1c'));
  pen(c, 3.5); [-22, 0, 22].forEach(x => { c.beginPath(); c.moveTo(x - 6, -30); c.lineTo(x + 6, -18); c.stroke(); });
  pen(c, 4); rr(c, -36, -12, 72, 22, 10); c.stroke(); [-18, 18].forEach(x => { ell(c, x, -1, 15, 11); fs(c, 'rgba(130,210,255,.6)'); }); c.fillStyle = OL; c.fillRect(-4, -4, 8, 5);
  eye(c, -18, 0, 7); eye(c, 18, 0, 7); mouth(c, 0, 18, 10, 'teeth'); c.restore(); leg(c, 88, 146, 18, '#ff9d1f'); leg(c, 112, 146, 18, '#ff9d1f'); } },
{ id: 'nial', n: 'نعالينو ركّاضو', r: 'common', d: 'نعال أزرق ما يوگف يركض، وصلّة الأم ترعبه أكثر من كلشي.', draw(c, t) {
  shadow(c, 100, 186, 38); const sw = Math.sin(t * 9) * 10; leg(c, 88, 156, 20, 'flip', -sw); leg(c, 112, 156, 20, 'flip', sw);
  c.save(); c.translate(100, 100); c.rotate(Math.sin(t * 9) * .05); pen(c); rr(c, -34, -70, 68, 132, 32); fs(c, lg(c, -34, 0, 34, 0, '#3a8cf0', '#1f5fc4'));
  pen(c, 3); rr(c, -26, -62, 52, 116, 26); c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke();
  pen(c, 9); c.strokeStyle = OL; c.beginPath(); c.moveTo(0, -46); c.lineTo(-34, -6); c.moveTo(0, -46); c.lineTo(34, -6); c.stroke(); c.lineWidth = 5; c.strokeStyle = '#ffd23f'; c.beginPath(); c.moveTo(0, -46); c.lineTo(-33, -6); c.moveTo(0, -46); c.lineTo(33, -6); c.stroke();
  pen(c, 3); ell(c, 0, -46, 6, 6); fs(c, '#ffd23f'); eye(c, -13, 6, 10, { lx: -.4 }); eye(c, 13, 6, 10, { lx: -.4 }); mouth(c, 0, 30, 10, 'o');
  c.fillStyle = '#9fe0ff'; c.beginPath(); c.moveTo(38, -40); c.quadraticCurveTo(46, -26, 38, -22); c.quadraticCurveTo(30, -26, 38, -40); c.fill(); c.restore(); } },
{ id: 'batikh', n: 'بطّيخو بومبو', r: 'rare', d: 'بطيخة بنظارة شمسية، أحد لا يقرب على گضمتها الحمرة.', draw(c, t) {
  shadow(c, 100, 186, 50); leg(c, 84, 160, 16, '#ff9d1f'); leg(c, 116, 160, 16, '#ff9d1f'); const b = Math.sin(t * 3) * 3;
  pen(c); ell(c, 100, 112 + b, 62, 56); fs(c, rg(c, 100, 112, 70, '#5fd36a', '#1f7a2e')); c.save(); ell(c, 100, 112 + b, 62, 56); c.clip(); c.strokeStyle = '#155c22'; c.lineWidth = 7; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(100 + i * 22, 50); c.quadraticCurveTo(100 + i * 26, 112, 100 + i * 22, 175); c.stroke(); } c.restore();
  pen(c); c.beginPath(); c.arc(150, 76 + b, 26, .55 * Math.PI, 1.45 * Math.PI, true); c.closePath(); fs(c, '#ff4f5e'); c.fillStyle = OL; [[143, 70], [152, 82], [140, 86]].forEach(([x, y]) => { ell(c, x, y + b, 2.5, 4); c.fill(); });
  pen(c, 4); c.beginPath(); c.moveTo(56, 98 + b); c.lineTo(144, 98 + b); c.stroke(); [[78, 104], [122, 104]].forEach(([x, y]) => { rr(c, x - 19, y - 10 + b, 38, 22, 9); fs(c, lg(c, 0, y - 10, 0, y + 12, '#2b2b3a', '#000')); shine(c, x - 8, y - 3 + b, 7, 3, -.3); });
  mouth(c, 100, 134 + b, 12, 'smug'); arm(c, 42, 120 + b, 26, 104 + Math.sin(t * 4) * 6, '#5fd36a'); arm(c, 158, 124 + b, 172, 140, '#5fd36a'); } },
{ id: 'dolma', n: 'دولمينو قدرو', r: 'rare', d: 'قدر دولمة يبوگ من تحت الغطا، ويطلع بخار كل ما أحد يجوع.', draw(c, t) {
  shadow(c, 100, 186, 56); leg(c, 76, 162, 14, '#ff9d1f'); leg(c, 124, 162, 14, '#ff9d1f');
  pen(c); rr(c, 44, 92, 112, 74, 18); fs(c, lg(c, 44, 0, 156, 0, '#8e99a8', '#e6ebf2', '#6d7786')); pen(c, 5); [[44, 112], [156, 112]].forEach(([x, y], i) => { c.beginPath(); c.arc(x + (i ? 6 : -6), y, 10, i ? -.5 * Math.PI : .5 * Math.PI, i ? .5 * Math.PI : 1.5 * Math.PI); c.stroke(); });
  c.fillStyle = '#1a0e09'; c.fillRect(50, 86, 100, 12); [[70, 90], [94, 88], [118, 90]].forEach(([x, y], i) => { pen(c, 3); rr(c, x - 8, y - 4, 22, 12, 6); fs(c, i % 2 ? '#5f8b2b' : '#7aa83a'); });
  const up = 6 + Math.abs(Math.sin(t * 2.5)) * 10; c.save(); c.translate(100, 84 - up); c.rotate(-.12); pen(c); ell(c, 0, 0, 62, 14); fs(c, lg(c, 0, -14, 0, 14, '#f0f3f7', '#8e99a8')); pen(c, 4); ell(c, 0, -14, 10, 7); fs(c, '#3b3b46'); c.restore();
  c.save(); c.beginPath(); c.rect(50, 86 - up, 100, up + 12); c.clip(); eye(c, 86, 98, 9, { ly: -1 }); eye(c, 112, 98, 9, { ly: -1 }); c.restore();
  pen(c, 4); c.beginPath(); c.moveTo(80, 140); c.quadraticCurveTo(100, 150, 120, 140); c.stroke(); blush(c, 64, 134); blush(c, 136, 134); steam(c, 140, 70 - up, t); } },
{ id: 'gaz', n: 'غازو جرّو', r: 'rare', d: 'جرّة غاز صارت چلب صغير، يهز ذيله ويحرس المطبخ.', draw(c, t) {
  shadow(c, 100, 186, 46); [72, 90, 110, 128].forEach((x, i) => leg(c, x, 160, 14, '#5a3a24', Math.sin(t * 7 + i) * 3));
  c.save(); c.translate(140, 140); c.rotate(Math.sin(t * 12) * .5); pen(c, 5); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(20, -10, 22, -30); c.stroke(); c.restore();
  pen(c); rr(c, 60, 58, 80, 108, 34); fs(c, lg(c, 60, 0, 140, 0, '#1b5fb8', '#4fa0ff', '#174f9a')); c.fillStyle = '#ffd23f'; c.fillRect(64, 132, 72, 10); c.strokeStyle = OL; c.lineWidth = 3; c.strokeRect(64, 132, 72, 10);
  pen(c, 4); rr(c, 86, 36, 28, 24, 6); fs(c, lg(c, 0, 36, 0, 60, '#ffd56a', '#b8860b')); rr(c, 80, 30, 40, 9, 4); fs(c, '#c99a2e');
  [-1, 1].forEach(s => { c.save(); c.translate(100 + s * 40, 72); c.rotate(s * (.3 + Math.sin(t * 4) * .1)); pen(c, 4); ell(c, s * 6, 18, 12, 24); fs(c, '#a0643a'); c.restore(); });
  eye(c, 86, 88, 10); eye(c, 114, 88, 10); pen(c, 3); ell(c, 100, 104, 7, 5); fs(c, OL); mouth(c, 100, 112, 9, 'smile');
  pen(c, 3); c.beginPath(); c.moveTo(94, 118); c.quadraticCurveTo(100, 136 + Math.sin(t * 8) * 2, 106, 118); c.closePath(); fs(c, '#ff7a8f'); } },
{ id: 'masgouf', n: 'مسگوفو شيفو', r: 'epic', d: 'سمچة مسگوف صارت شيف، توصيك على الشوي وما تخلي أحد يحرگها.', draw(c, t) {
  shadow(c, 100, 186, 66); const b = Math.sin(t * 3) * 3; c.save(); c.translate(0, b);
  pen(c); c.beginPath(); c.moveTo(38, 128); c.lineTo(12, 104); c.lineTo(16, 156); c.closePath(); fs(c, '#c46a24');
  pen(c); ell(c, 100, 130, 66, 36); fs(c, rg(c, 110, 125, 72, '#ffcf7a', '#b5561a')); c.save(); ell(c, 100, 130, 66, 36); c.clip(); c.strokeStyle = '#5a240a'; c.lineWidth = 5; for (let x = 52; x < 150; x += 18) { c.beginPath(); c.moveTo(x, 96); c.lineTo(x + 14, 166); c.stroke(); } c.restore(); pen(c); ell(c, 100, 130, 66, 36); c.stroke();
  pen(c, 4); c.beginPath(); c.moveTo(80, 96); c.quadraticCurveTo(96, 80, 114, 96); fs(c, '#c46a24');
  c.save(); c.translate(0, 34); c.rotate(.12); pen(c, 4); rr(c, 126, 52, 40, 30, 6); fs(c, '#fff'); ell(c, 134, 52, 14, 12); fs(c, '#fff'); ell(c, 158, 50, 14, 12); fs(c, '#fff'); ell(c, 146, 42, 14, 12); fs(c, '#fff'); c.fillStyle = '#fff'; c.fillRect(128, 50, 36, 14); c.restore();
  eye(c, 146, 116, 11, { lx: .3 }); pen(c, 5); c.beginPath(); c.moveTo(128, 138); c.quadraticCurveTo(140, 130, 150, 138); c.quadraticCurveTo(160, 130, 172, 138); c.stroke(); mouth(c, 152, 148, 8, 'smile');
  arm(c, 112, 150, 92, 176, '#ffcf7a'); pen(c, 4); c.beginPath(); c.moveTo(92, 176); c.lineTo(70, 168 + Math.sin(t * 5) * 4); c.stroke(); rr(c, 52, 158 + Math.sin(t * 5) * 4, 22, 14, 3); fs(c, '#9aa3ad'); c.restore(); } },
{ id: 'fridge', n: 'ثلاجو شاربو', r: 'epic', d: 'ثلاجة بشوارب تحرس الماي البارد بالصيف، ما تعطيه إلا للحبايب.', draw(c, t) {
  shadow(c, 100, 186, 50); leg(c, 76, 172, 10, '#3b3b46'); leg(c, 124, 172, 10, '#3b3b46');
  pen(c); rr(c, 54, 26, 92, 150, 16); fs(c, lg(c, 54, 0, 146, 0, '#fdfdfd', '#e3e8ee')); pen(c, 4); c.beginPath(); c.moveTo(54, 78); c.lineTo(146, 78); c.stroke(); rr(c, 132, 40, 6, 28, 3); fs(c, '#b7c0cb'); rr(c, 132, 90, 6, 40, 3); fs(c, '#b7c0cb');
  eye(c, 82, 52, 11); eye(c, 110, 52, 11); pen(c, 4); const m = Math.sin(t * 4) * 3; c.beginPath(); c.moveTo(100, 104); c.bezierCurveTo(88, 96 - m, 70, 100, 62, 114 - m); c.bezierCurveTo(74, 108, 88, 112, 100, 108); c.bezierCurveTo(112, 112, 126, 108, 138, 114 - m); c.bezierCurveTo(130, 100, 112, 96 - m, 100, 104); c.closePath(); fs(c, '#2a1810');
  const op = .5 + .5 * Math.sin(t * 2); pen(c, 4); rr(c, 76, 118, 48, 26 * (.4 + op * .6), 8); fs(c, '#bfe6ff'); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(84, 122, 32, 4);
  [['#ff4f5e', 66, 150], ['#ffd23f', 116, 156], ['#3fa7ff', 92, 162]].forEach(([col, x, y]) => { pen(c, 3); ell(c, x, y, 7, 7); fs(c, col); }); } },
{ id: 'cactus', n: 'صبّاروطربو', r: 'epic', d: 'صبار مطرب يعزف عود بالليل، وأشواكه تگف من الطرب.', draw(c, t) {
  shadow(c, 100, 186, 44); pen(c); rr(c, 76, 150, 48, 34, 6); fs(c, lg(c, 0, 150, 0, 184, '#e0723a', '#a8461c'));
  pen(c); rr(c, 72, 46, 56, 112, 28); fs(c, lg(c, 72, 0, 128, 0, '#3aa84d', '#6fd47a', '#2c8a3c')); pen(c); rr(c, 40, 82, 22, 46, 11); fs(c, '#4cbf5c'); c.beginPath(); c.moveTo(62, 112); c.lineTo(72, 112); c.stroke();
  c.strokeStyle = '#1f6a2c'; c.lineWidth = 2; [[80, 70], [120, 74], [78, 110], [122, 120], [96, 140]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y - 4); c.moveTo(x, y); c.lineTo(x + 4, y - 4); c.stroke(); });
  [0, 1, 2, 3, 4].forEach(i => { pen(c, 3); const a = i / 5 * TAU; ell(c, 100 + Math.cos(a) * 9, 42 + Math.sin(a) * 6, 8, 6, a); fs(c, '#ff6fae'); }); pen(c, 3); ell(c, 100, 42, 6, 6); fs(c, '#ffd23f');
  shut(c, 88, 80, 8); shut(c, 112, 80, 8); mouth(c, 100, 98, 8, 'o'); blush(c, 80, 92); blush(c, 120, 92);
  c.save(); c.translate(124, 128); c.rotate(-.6); pen(c, 4); ell(c, 0, 0, 22, 28); fs(c, rg(c, 0, 0, 30, '#d08a4a', '#7a3e14')); ell(c, 0, 4, 6, 6); fs(c, '#3a1a08'); rr(c, -4, -62, 8, 40, 3); fs(c, '#5a2a10'); c.strokeStyle = '#f2d9a8'; c.lineWidth = 1; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 1.4, -58); c.lineTo(i * 1.6, 18); c.stroke(); } c.restore();
  arm(c, 126, 96, 140, 120 + Math.sin(t * 8) * 3, '#4cbf5c'); notes(c, 146, 60, t); } },
{ id: 'tamr', n: 'تمرو برحاوي', r: 'leg', d: 'تمرة برحي ملكية بتاج ذهب وسعف نخل، أحلى من العسل وتدري.', draw(c, t) {
  shadow(c, 100, 186, 42); leg(c, 88, 164, 14, '#d4a017'); leg(c, 112, 164, 14, '#d4a017');
  [-50, -25, 0, 25, 50].forEach((a, i) => { c.save(); c.translate(100, 66); c.rotate((a + Math.sin(t * 2 + i) * 4) * Math.PI / 180); pen(c, 4); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-12, -30, 0, -58); c.quadraticCurveTo(12, -30, 0, 0); fs(c, '#3e9a3a'); c.strokeStyle = '#1f5a1d'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -4); c.lineTo(0, -52); c.stroke(); c.restore(); });
  pen(c); ell(c, 100, 116, 46, 54); fs(c, rg(c, 100, 112, 62, '#c9792f', '#5a2508')); shine(c, 80, 92, 9, 18, .4); c.strokeStyle = 'rgba(60,20,4,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(120, 80); c.quadraticCurveTo(132, 116, 118, 152); c.stroke();
  pen(c, 4); c.beginPath(); c.moveTo(76, 62); c.lineTo(80, 44); c.lineTo(90, 56); c.lineTo(100, 38); c.lineTo(110, 56); c.lineTo(120, 44); c.lineTo(124, 62); c.closePath(); fs(c, lg(c, 0, 38, 0, 62, '#fff3a0', '#d4a017')); [[100, 50, '#ff4f5e'], [86, 56, '#3fa7ff'], [114, 56, '#3fa7ff']].forEach(([x, y, col]) => { pen(c, 2); ell(c, x, y, 3.5, 3.5); fs(c, col); });
  eye(c, 86, 108, 10, { lid: .38, lidc: '#9a4d16' }); eye(c, 114, 108, 10, { lid: .38, lidc: '#9a4d16' }); mouth(c, 100, 130, 11, 'smug'); sparkle(c, 50 + Math.sin(t) * 4, 80, 6, '#fff3a0'); sparkle(c, 152, 140, 5, '#fff3a0'); } },
{ id: 'betinjan', n: 'بيتنجانو سلطانو', r: 'leg', d: 'سلطان البيتنجان بعباية حمرة وصولجان، يحكم سوق الشورجة كله.', draw(c, t) {
  shadow(c, 100, 186, 48); pen(c); c.beginPath(); c.moveTo(70, 70); c.quadraticCurveTo(40 + Math.sin(t * 3) * 6, 140, 46, 178); c.lineTo(154, 178); c.quadraticCurveTo(160 + Math.sin(t * 3 + 1) * 6, 140, 130, 70); c.closePath(); fs(c, lg(c, 0, 70, 0, 178, '#e23a3a', '#8a1414')); c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.beginPath(); c.moveTo(48, 176); c.lineTo(152, 176); c.stroke();
  leg(c, 88, 168, 10, '#d4a017'); leg(c, 112, 168, 10, '#d4a017');
  pen(c); c.beginPath(); c.moveTo(100, 54); c.bezierCurveTo(140, 56, 150, 110, 134, 150); c.bezierCurveTo(120, 180, 80, 180, 66, 150); c.bezierCurveTo(52, 112, 66, 58, 100, 54); fs(c, rg(c, 92, 110, 80, '#9a5ad8', '#3f1470')); shine(c, 80, 96, 7, 20, .2);
  pen(c, 4); c.beginPath(); c.moveTo(68, 62); for (let i = 0; i <= 6; i++) c.lineTo(68 + i * 64 / 6, i % 2 ? 72 : 50); c.lineTo(132, 62); c.quadraticCurveTo(100, 78, 68, 62); fs(c, '#4fa83a'); pen(c, 5); c.beginPath(); c.moveTo(100, 52); c.quadraticCurveTo(104, 34, 116, 30); c.stroke();
  eye(c, 88, 104, 10, { lid: .3, lidc: '#6a2aa8' }); eye(c, 114, 104, 10, { lid: .3, lidc: '#6a2aa8' }); mouth(c, 101, 128, 10, 'smile');
  pen(c, 5); c.beginPath(); c.moveTo(150, 92); c.lineTo(162, 168); c.stroke(); pen(c, 3); ell(c, 150, 88, 9, 9); fs(c, '#ffd23f'); sparkle(c, 150, 88, 5 + Math.sin(t * 5) * 2, '#fff'); arm(c, 134, 120, 154, 120, '#9a5ad8'); } },
{ id: 'panka', n: 'پنكه بطّوطو', r: 'leg', d: 'بطة راسها پنكة سقف، تبرّد البيت بالصيف وتطير بالغلط.', draw(c, t) {
  shadow(c, 100, 186, 46); leg(c, 86, 160, 16, '#ff9d1f'); leg(c, 114, 160, 16, '#ff9d1f');
  pen(c); c.beginPath(); c.moveTo(48, 120); c.quadraticCurveTo(52, 166, 100, 166); c.quadraticCurveTo(152, 166, 150, 124); c.quadraticCurveTo(170, 112, 162, 100); c.quadraticCurveTo(140, 112, 120, 108); c.quadraticCurveTo(70, 100, 48, 120); fs(c, rg(c, 100, 130, 70, '#fff27a', '#f0b800'));
  pen(c, 4); c.beginPath(); c.moveTo(70, 128); c.quadraticCurveTo(90, 118, 112, 132); c.quadraticCurveTo(92, 150, 70, 128); fs(c, '#ffe14a');
  pen(c, 5); c.beginPath(); c.moveTo(100, 108); c.lineTo(100, 64); c.stroke(); c.save(); c.translate(100, 56); c.rotate(t * 8); for (let i = 0; i < 3; i++) { c.rotate(TAU / 3); pen(c, 4); rr(c, 4, -8, 60, 16, 8); fs(c, lg(c, 0, -8, 0, 8, '#c58b4a', '#8a5420')); } c.restore();
  pen(c, 4); ell(c, 100, 56, 20, 14); fs(c, lg(c, 0, 42, 0, 70, '#f2f4f7', '#9aa3ad')); eye(c, 92, 56, 6); eye(c, 108, 56, 6);
  pen(c, 4); c.beginPath(); c.moveTo(88, 70); c.quadraticCurveTo(100, 84, 112, 70); c.quadraticCurveTo(100, 76, 88, 70); fs(c, '#ff8c1a'); c.save(); c.globalAlpha = .4; c.strokeStyle = '#fff'; c.lineWidth = 3; [0, 1].forEach(i => { c.beginPath(); c.arc(100, 56, 70 + i * 10, (t * 2 + i) % TAU, (t * 2 + i) % TAU + .6); c.stroke(); }); c.restore(); } },
{ id: 'kubba', n: 'كبّة خارقو', r: 'myth', d: 'كبة حلب بطل خارق بعباية وقناع، ينقذ المطاعم من الجوع.', draw(c, t) {
  shadow(c, 100, 186, 44); pen(c); c.beginPath(); c.moveTo(68, 92); c.quadraticCurveTo(30, 140 + Math.sin(t * 6) * 8, 22 + Math.sin(t * 6) * 6, 178); c.lineTo(178 - Math.sin(t * 6 + 1) * 6, 178); c.quadraticCurveTo(170, 140 + Math.sin(t * 6 + 1) * 8, 132, 92); c.closePath(); fs(c, lg(c, 0, 92, 0, 178, '#3fa7ff', '#174f9a'));
  leg(c, 88, 160, 16, '#e8344a'); leg(c, 112, 160, 16, '#e8344a'); const b = Math.sin(t * 3) * 3;
  pen(c); c.beginPath(); c.moveTo(100, 44 + b); c.bezierCurveTo(148, 70, 150, 150, 100, 166); c.bezierCurveTo(50, 150, 52, 70, 100, 44 + b); fs(c, rg(c, 96, 110, 76, '#e7a352', '#8a4a14'));
  c.fillStyle = 'rgba(90,40,10,.35)'; for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 10 + (i * 7) % 40; ell(c, 100 + Math.cos(a) * r * .9, 112 + Math.sin(a) * r, 2.2, 1.6); c.fill(); }
  pen(c, 4); c.beginPath(); c.moveTo(66, 92); c.quadraticCurveTo(100, 78, 134, 92); c.lineTo(132, 112); c.quadraticCurveTo(100, 102, 68, 112); c.closePath(); fs(c, '#1b1b2a'); eye(c, 86, 98, 9, { lx: .2 }); eye(c, 114, 98, 9, { lx: .2 });
  pen(c, 3.5); c.beginPath(); c.moveTo(100, 122); c.lineTo(116, 130); c.lineTo(100, 150); c.lineTo(84, 130); c.closePath(); fs(c, '#ffd23f'); c.fillStyle = OL; c.font = 'bold 15px Lalezar, sans-serif'; c.textAlign = 'center'; c.fillText('ك', 100, 141);
  arm(c, 136, 110, 164, 70 + Math.sin(t * 4) * 4, '#e7a352'); mouth(c, 100, 118, 7, 'smile'); [[40, 50], [166, 40]].forEach(([x, y], i) => sparkle(c, x, y, 5 + Math.sin(t * 6 + i) * 2, '#ffd23f')); } },
{ id: 'jamal', n: 'جملو ديجيو', r: 'myth', d: 'جمل دي جي بسماعات ونظارة، يقلب البر حفلة لحد الفجر.', draw(c, t) {
  shadow(c, 100, 186, 60); const bt = Math.abs(Math.sin(t * 5)) * 4; c.save(); c.translate(-12, -bt);
  [62, 80, 118, 136].forEach((x, i) => leg(c, x, 138, 34, 'hoof', Math.sin(t * 5 + i) * 3));
  pen(c); c.beginPath(); c.moveTo(48, 132); c.quadraticCurveTo(46, 104, 66, 100); c.quadraticCurveTo(76, 64, 96, 96); c.quadraticCurveTo(110, 70, 128, 100); c.quadraticCurveTo(150, 104, 146, 136); c.quadraticCurveTo(100, 150, 48, 132); fs(c, rg(c, 96, 110, 70, '#e8be7a', '#b07a36'));
  pen(c); c.beginPath(); c.moveTo(136, 112); c.quadraticCurveTo(150, 84, 146, 58); c.lineTo(160, 52); c.quadraticCurveTo(166, 86, 152, 118); c.closePath(); fs(c, '#d6a660'); pen(c); ell(c, 160, 48, 24, 16, -.2); fs(c, '#e2b26a'); ell(c, 178, 52, 9, 8); fs(c, '#d29a54'); c.fillStyle = OL; ell(c, 180, 50, 2, 2); c.fill();
  pen(c, 4); c.beginPath(); c.moveTo(140, 50); c.quadraticCurveTo(156, 18, 174, 40); c.stroke(); [[142, 50], [172, 44]].forEach(([x, y]) => { rr(c, x - 7, y - 10, 14, 20, 6); fs(c, '#ff3d7f'); });
  rr(c, 146, 40, 26, 11, 4); fs(c, '#1b1b2a'); shine(c, 152, 43, 4, 2); mouth(c, 168, 60, 7, 'smile');
  c.restore(); pen(c, 4); rr(c, 20, 150, 56, 18, 5); fs(c, '#2b2b3a'); ell(c, 36, 154, 10, 3); fs(c, '#555'); c.fillStyle = (Math.floor(t * 4) % 2) ? '#7dffb0' : '#ff3d7f'; c.fillRect(54, 156, 16, 4); notes(c, 60, 120, t, '#ff3d7f'); } },
{ id: 'qamar', n: 'گمرو نعسانو', r: 'secret', d: 'گمر نعسان بطاقية نوم، يطلع بس بالليل ويوزع أحلام حلوة.', draw(c, t) {
  for (let i = 0; i < 7; i++) sparkle(c, 20 + (i * 47) % 170, 20 + (i * 31) % 70, 3 + 2 * Math.abs(Math.sin(t * 2 + i)), '#fff3a0');
  const f = Math.sin(t * 1.5) * 6; c.save(); c.translate(0, f); pen(c); c.beginPath(); c.arc(100, 110, 62, .38 * Math.PI, 1.62 * Math.PI, false); c.bezierCurveTo(70, 60, 64, 160, 90 + 0, 168); c.closePath();
  c.beginPath(); c.arc(100, 110, 62, -1.25, 1.25, true); c.quadraticCurveTo(60, 110, 122, 52); c.closePath(); fs(c, rg(c, 80, 100, 80, '#fff7b8', '#f2c230'));
  c.fillStyle = 'rgba(200,150,20,.3)'; [[64, 90, 7], [58, 130, 5], [76, 150, 4]].forEach(([x, y, r]) => { ell(c, x, y, r, r); c.fill(); });
  pen(c, 4); c.beginPath(); c.moveTo(50, 72); c.quadraticCurveTo(70, 26, 120, 30); c.quadraticCurveTo(150, 34, 164, 64); c.quadraticCurveTo(110, 40, 50, 72); fs(c, '#3f5bd8'); c.fillStyle = '#fff3a0'; [[86, 46], [118, 42], [140, 52]].forEach(([x, y]) => sparkle(c, x, y, 4, '#fff3a0'));
  pen(c, 3); ell(c, 166, 68 + Math.sin(t * 3) * 3, 8, 8); fs(c, '#fff'); shut(c, 70, 104, 8); mouth(c, 72, 126, 6, 'smile'); blush(c, 60, 116, 6); c.restore();
  c.save(); c.font = 'bold 22px Lalezar, sans-serif'; c.fillStyle = '#3f5bd8'; for (let i = 0; i < 3; i++) { const k = (t * .4 + i / 3) % 1; c.globalAlpha = 1 - k; c.fillText('z', 120 + k * 50, 120 - k * 70 - i * 2); } c.restore();
  pen(c, 4); rr(c, 44, 168, 112, 18, 9); fs(c, lg(c, 0, 168, 0, 186, '#fff', '#c9d6f0')); } },
{ id: 'muntadher', n: 'منتظرو الأعظم', r: 'secret', d: 'دلّة ذهب بجناحين وتاج، أندر شخصية باللعبة. اللي يملكه يحكم المنتجع.', draw(c, t) {
  c.save(); c.globalAlpha = .55; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * .4; c.strokeStyle = `hsl(${(i * 30 + t * 60) % 360},90%,65%)`; c.lineWidth = 6; c.beginPath(); c.moveTo(100 + Math.cos(a) * 40, 104 + Math.sin(a) * 40); c.lineTo(100 + Math.cos(a) * 92, 104 + Math.sin(a) * 92); c.stroke(); } c.restore();
  shadow(c, 100, 188, 40); const f = Math.sin(t * 2) * 5, w = Math.sin(t * 6) * .25; c.save(); c.translate(0, f);
  [-1, 1].forEach(s => { c.save(); c.translate(100 + s * 26, 104); c.scale(s, 1); c.rotate(-w); pen(c, 4); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(40, -60, 78, -50); c.lineTo(66, -34); c.lineTo(76, -24); c.lineTo(60, -12); c.lineTo(66, 0); c.quadraticCurveTo(30, 10, 0, 14); c.closePath(); fs(c, lg(c, 0, -60, 60, 10, '#ffe27a', '#e08a00')); c.restore(); });
  pen(c, 5); c.beginPath(); c.moveTo(130, 104); c.quadraticCurveTo(170, 98, 168, 70); c.stroke(); pen(c); c.beginPath(); c.moveTo(72, 120); c.quadraticCurveTo(40, 96, 34, 72); c.lineTo(46, 68); c.quadraticCurveTo(58, 96, 76, 104); c.closePath(); fs(c, '#e8a400');
  pen(c); c.beginPath(); c.moveTo(78, 70); c.quadraticCurveTo(70, 86, 76, 98); c.bezierCurveTo(50, 118, 54, 170, 100, 172); c.bezierCurveTo(146, 170, 150, 118, 124, 98); c.quadraticCurveTo(130, 86, 122, 70); c.closePath(); fs(c, rg(c, 92, 120, 80, '#fff6b0', '#d08a00'));
  c.strokeStyle = 'rgba(140,80,0,.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(66, 132); c.quadraticCurveTo(100, 144, 134, 132); c.stroke(); shine(c, 78, 132, 6, 18, .3);
  pen(c, 4); c.beginPath(); c.moveTo(76, 66); c.lineTo(80, 46); c.lineTo(90, 58); c.lineTo(100, 38); c.lineTo(110, 58); c.lineTo(120, 46); c.lineTo(124, 66); c.closePath(); fs(c, lg(c, 0, 38, 0, 66, '#fff', '#ffb000')); [[100, 50, '#ff3d7f'], [86, 58, '#2fd6a3'], [114, 58, '#3fa7ff']].forEach(([x, y, col]) => { pen(c, 2); ell(c, x, y, 3.5, 3.5); fs(c, col); });
  eye(c, 88, 120, 11, { iris: '#6a2aa8' }); eye(c, 112, 120, 11, { iris: '#6a2aa8' }); mouth(c, 100, 144, 11); blush(c, 74, 140); blush(c, 126, 140); c.restore();
  for (let i = 0; i < 6; i++) { const a = t * 1.3 + i; sparkle(c, 100 + Math.cos(a) * 82, 104 + Math.sin(a * 1.3) * 70, 4 + 3 * Math.abs(Math.sin(t * 4 + i)), '#fff'); } } },

/* 🏆 جوائز المجموعة (ما تطلع بالسجادة ولا بالبيض — بس من الكتاب) */
{ id: 'hazzo', n: 'حظّو أبو البرسيم', r: 'secret', rw: 'L', d: 'قطّوة حظ ذهبية تأشّر بإيدها وبراسها برسيمة أربع ورقات. تطلع من الباب العادي بنسبة 5% بس، وتجيب فلوس خرافية.', draw(c, t) {
  shadow(c, 100, 188, 56); const b = Math.sin(t * 3) * 3, wave = Math.sin(t * 7) * .5;
  for (let i = 0; i < 5; i++) { const a = t * 1.4 + i * 1.26, x = 100 + Math.cos(a) * 84, y = 112 + Math.sin(a) * 30; pen(c, 2.5); ell(c, x, y, 10, 10); fs(c, lg(c, x - 10, y - 10, x + 10, y + 10, '#fff3a0', '#e0a010')); c.fillStyle = '#a06a00'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', x, y + 1); }
  pen(c); ell(c, 100, 150 + b, 50, 34); fs(c, rg(c, 100, 150 + b, 56, '#fff6c8', '#f0b020'));
  pen(c, 3.5); ell(c, 100, 136 + b, 12, 10); fs(c, '#ff4f5e'); pen(c, 3); ell(c, 100, 146 + b, 6, 6); fs(c, '#ffd23f');
  c.save(); c.translate(142, 120 + b); c.rotate(-.5 + wave); pen(c); rr(c, -10, -46, 20, 50, 10); fs(c, '#fff3d0'); pen(c, 3); ell(c, 0, -46, 12, 10); fs(c, '#fff8e8'); c.restore();
  pen(c); ell(c, 60, 156 + b, 12, 16); fs(c, '#fff3d0');
  pen(c); c.beginPath(); c.moveTo(56, 66 + b); c.lineTo(64, 30 + b); c.lineTo(84, 56 + b); c.closePath(); fs(c, '#fff3d0'); c.beginPath(); c.moveTo(144, 66 + b); c.lineTo(136, 30 + b); c.lineTo(116, 56 + b); c.closePath(); fs(c, '#fff3d0');
  c.fillStyle = '#ff9db8'; c.beginPath(); c.moveTo(64, 60 + b); c.lineTo(66, 40 + b); c.lineTo(78, 56 + b); c.closePath(); c.fill(); c.beginPath(); c.moveTo(136, 60 + b); c.lineTo(134, 40 + b); c.lineTo(122, 56 + b); c.closePath(); c.fill();
  pen(c); ell(c, 100, 92 + b, 50, 42); fs(c, rg(c, 100, 92 + b, 56, '#ffffff', '#f6e2b0'));
  [['#ffb020', 70, 74], ['#3a2416', 124, 70]].forEach(([col, x, y]) => { c.fillStyle = col; ell(c, x, y + b, 12, 8, .4); c.fill(); });
  c.save(); c.translate(100, 50 + b); c.rotate(Math.sin(t * 2) * .15); [0, 1, 2, 3].forEach(k => { c.save(); c.rotate(k * Math.PI / 2 + Math.PI / 4); pen(c, 3); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-14, -6, -12, -22, 0, -16); c.bezierCurveTo(12, -22, 14, -6, 0, 0); fs(c, k % 2 ? '#2fd66b' : '#3ddc84'); c.restore(); }); pen(c, 3); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(4, 10, 0, 18); c.stroke(); c.restore();
  eye(c, 84, 94 + b, 10, { iris: '#1b7a3a', tall: .8 }); eye(c, 116, 94 + b, 10, { iris: '#1b7a3a', tall: .8 }); mouth(c, 100, 112 + b, 9); blush(c, 72, 108 + b); blush(c, 128, 108 + b);
  pen(c, 2); [[-1, 0], [1, 0]].forEach(([s2]) => { c.beginPath(); c.moveTo(100 + s2 * 20, 108 + b); c.lineTo(100 + s2 * 42, 102 + b); c.moveTo(100 + s2 * 20, 112 + b); c.lineTo(100 + s2 * 42, 114 + b); c.stroke(); });
  for (let i = 0; i < 6; i++) { const a = t * 1.2 + i; sparkle(c, 100 + Math.cos(a) * 80, 100 + Math.sin(a * 1.3) * 74, 3 + 3 * Math.abs(Math.sin(t * 4 + i)), i % 2 ? '#7dffb0' : '#ffe14a'); } } },
{ id: 'jamra', n: 'جمرو الأحمر', r: 'leg', rw: 'c', d: 'جمرة نار حمرة بقرنين، هدية اللي يجمع كل البرينروتات العادية.', draw(c, t) {
  shadow(c, 100, 186, 50); const b = Math.sin(t * 5) * 3, sw = Math.sin(t * 6) * 6; leg(c, 84, 150, 24, 'sneaker', -sw); leg(c, 116, 150, 24, 'sneaker', sw);
  for (let i = 0; i < 5; i++) { const x = 64 + i * 18, h = 34 + Math.sin(t * 9 + i * 1.7) * 10; c.beginPath(); c.moveTo(x - 12, 70 + b); c.quadraticCurveTo(x - 6, 70 - h * .6 + b, x, 70 - h + b); c.quadraticCurveTo(x + 6, 70 - h * .6 + b, x + 12, 70 + b); c.closePath(); c.fillStyle = i % 2 ? '#ffd23f' : '#ff7a1f'; c.fill(); }
  pen(c); c.beginPath(); c.moveTo(100, 54 + b); c.bezierCurveTo(150, 54 + b, 156, 110 + b, 146, 132 + b); c.quadraticCurveTo(130, 162 + b, 100, 160 + b); c.quadraticCurveTo(70, 162 + b, 54, 132 + b); c.bezierCurveTo(44, 110 + b, 50, 54 + b, 100, 54 + b); c.closePath(); fs(c, rg(c, 100, 104 + b, 62, '#ff6a4a', '#b3121a'));
  [[-1, 70], [1, 130]].forEach(([s, x]) => { pen(c, 4); c.beginPath(); c.moveTo(x, 66 + b); c.quadraticCurveTo(x + s * 16, 40 + b, x + s * 6, 26 + b); c.quadraticCurveTo(x - s * 2, 46 + b, x - s * 10, 62 + b); c.closePath(); fs(c, '#3a0c08'); });
  c.fillStyle = 'rgba(255,220,120,.45)'; for (let i = 0; i < 6; i++) { ell(c, 70 + (i * 23) % 60, 100 + (i * 37) % 44 + b, 4, 3); c.fill(); }
  arm(c, 56, 116 + b, 36, 100 + b, '#ff8a6a'); arm(c, 144, 116 + b, 166, 98 + b, '#ff8a6a'); shine(c, 74, 80 + b, 5, 16, .2);
  eye(c, 86, 104 + b, 11, { iris: '#7a0a0a' }); eye(c, 114, 104 + b, 11, { iris: '#7a0a0a' }); pen(c, 4); c.beginPath(); c.moveTo(74, 88 + b); c.lineTo(96, 94 + b); c.moveTo(126, 88 + b); c.lineTo(104, 94 + b); c.stroke(); mouth(c, 100, 128 + b, 12, 1);
  for (let i = 0; i < 4; i++) sparkle(c, 100 + Math.cos(t * 2 + i * 1.6) * 74, 100 + Math.sin(t * 2.4 + i) * 64, 3 + 2 * Math.abs(Math.sin(t * 5 + i)), '#ffd23f'); } },
{ id: 'banafsaj', n: 'بنفسجو الملكي', r: 'myth', rw: 's', d: 'جوهرة بنفسجية ملكية بعباءة وتاج، هدية اللي يجمع كل البرينروتات المميزة.', draw(c, t) {
  shadow(c, 100, 186, 52); const b = Math.sin(t * 3) * 4, sw = Math.sin(t * 5) * 5;
  pen(c); c.beginPath(); c.moveTo(60, 96 + b); c.quadraticCurveTo(40, 150, 46, 176); c.lineTo(154, 176); c.quadraticCurveTo(160, 150, 140, 96 + b); c.closePath(); fs(c, lg(c, 0, 96, 0, 176, '#7a2fd0', '#3a0f78'));
  leg(c, 88, 156, 22, '#3a0f78', -sw); leg(c, 112, 156, 22, '#3a0f78', sw);
  pen(c); c.beginPath(); c.moveTo(100, 50 + b); c.lineTo(146, 82 + b); c.lineTo(132, 150 + b); c.lineTo(68, 150 + b); c.lineTo(54, 82 + b); c.closePath(); fs(c, lg(c, 54, 50, 146, 150, '#f0d6ff', '#b46bff', '#5a1aa8'));
  pen(c, 2.5); c.strokeStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(54, 82 + b); c.lineTo(146, 82 + b); c.moveTo(100, 50 + b); c.lineTo(80, 82 + b); c.lineTo(100, 150 + b); c.lineTo(120, 82 + b); c.lineTo(100, 50 + b); c.stroke();
  pen(c, 4); c.beginPath(); c.moveTo(74, 52 + b); c.lineTo(80, 30 + b); c.lineTo(90, 44 + b); c.lineTo(100, 24 + b); c.lineTo(110, 44 + b); c.lineTo(120, 30 + b); c.lineTo(126, 52 + b); c.closePath(); fs(c, lg(c, 0, 24, 0, 52, '#fff3a0', '#e0a010'));
  [[80, 30], [100, 24], [120, 30]].forEach(([x, y]) => { pen(c, 2); ell(c, x, y + b, 4, 4); fs(c, '#ff4fd8'); });
  arm(c, 58, 104 + b, 38, 122 + b, '#f0d6ff'); arm(c, 142, 104 + b, 164, 90 + b, '#f0d6ff'); shine(c, 72, 76 + b, 5, 18, .3);
  eye(c, 88, 104 + b, 11, { iris: '#4a0f8a' }); eye(c, 112, 104 + b, 11, { iris: '#4a0f8a' }); mouth(c, 100, 126 + b, 10); blush(c, 76, 120 + b); blush(c, 124, 120 + b);
  for (let i = 0; i < 6; i++) { const a = t * 1.1 + i; sparkle(c, 100 + Math.cos(a) * 80, 100 + Math.sin(a * 1.2) * 72, 3 + 3 * Math.abs(Math.sin(t * 4 + i)), i % 2 ? '#e9c8ff' : '#fff'); } } },
{ id: 'khariq', n: 'خارقو الأسطورة', r: 'secret', rw: 'x', d: 'نجمة ذهبية خارقة بعباءة قوس قزح، هدية اللي يجمع كل البرينروتات الخارقة.', draw(c, t) {
  shadow(c, 100, 186, 54); const b = Math.sin(t * 3.5) * 5;
  c.save(); c.globalAlpha = .55; const hg = c.createRadialGradient(100, 104 + b, 10, 100, 104 + b, 96); hg.addColorStop(0, '#fff6a0'); hg.addColorStop(1, 'rgba(255,210,63,0)'); c.fillStyle = hg; c.beginPath(); c.arc(100, 104 + b, 96, 0, TAU); c.fill(); c.restore();
  const cl = ['#ff4f5e', '#ffb020', '#ffe14a', '#3ddc84', '#3fa7ff', '#b46bff']; cl.forEach((col, i) => { c.beginPath(); c.moveTo(70 + i * 2, 110 + b); c.quadraticCurveTo(40 - i * 4, 150 + Math.sin(t * 4 + i) * 6, 30 + i * 6, 178); c.lineTo(42 + i * 6, 178); c.quadraticCurveTo(54, 150, 76 + i * 2, 112 + b); c.closePath(); c.fillStyle = col; c.fill(); });
  const sw = Math.sin(t * 6) * 6; leg(c, 88, 150, 24, '#b3121a', -sw); leg(c, 112, 150, 24, '#b3121a', sw);
  pen(c, 5); c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5 + Math.sin(t * 2) * .05, r = i % 2 ? 30 : 66; c.lineTo(100 + Math.cos(a) * r, 104 + b + Math.sin(a) * r); } c.closePath(); fs(c, rg(c, 100, 104 + b, 70, '#fffbd0', '#f0a800'));
  pen(c, 4); rr(c, 70, 92 + b, 60, 18, 9); fs(c, '#24140e'); [86, 114].forEach(x => { c.fillStyle = '#7dffef'; ell(c, x, 101 + b, 9, 5); c.fill(); });
  mouth(c, 100, 126 + b, 12, 1); shine(c, 80, 74 + b, 4, 14, .3);
  arm(c, 62, 112 + b, 40, 86 + b, '#ffe14a'); arm(c, 138, 112 + b, 162, 86 + b, '#ffe14a');
  for (let i = 0; i < 8; i++) { const a = t * 1.6 + i * .8; sparkle(c, 100 + Math.cos(a) * 86, 102 + Math.sin(a * 1.1) * 78, 3 + 3 * Math.abs(Math.sin(t * 5 + i)), cl[i % 6]); } } },
];


window.BR_CHARS = {}; CHARS.forEach(c => window.BR_CHARS[c.id] = c);
window.BR_DRAW = { eye, mouth, leg, arm, pen, fs, ell, rr, lg, rg, shadow, blush, sparkle, shine };
})();
