/* ===================== لعبة «لودو» 🎲 — الواجهة =====================
   طاولة 4 مقاعد، تلعبون من لاعبين اثنين لين 4. السيرفر هو اللي يرمي النرد ويتحقق من الحركات. */
'use strict';
var LUDOG = { s: null, raf: 0, cv: null, disp: {}, dice: 0, rolling: 0, lastEv: 0, last: null, t: 0, mode: 'page', fx: [], winT: 0, popT: 0 };
const LUDO_COL = [{ n: 'الأحمر', c: '#ef3b3b', d: '#a31818', l: '#ffd4d4' }, { n: 'الأخضر', c: '#2fbf5b', d: '#16793a', l: '#d2f5de' }, { n: 'الأصفر', c: '#f4c21d', d: '#a98200', l: '#fff3c2' }, { n: 'الأزرق', c: '#2f7bff', d: '#1646a8', l: '#d3e3ff' }];
const LUDO_START = [0, 13, 26, 39];
/* مسار 52 خانة على شبكة 15×15 (عمود، صف) باتجاه عقارب الساعة، يبدأ من خانة الأحمر */
const LUDO_TRACK = [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], [7, 0], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [7, 14], [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], [0, 7], [0, 6]];
const LUDO_LANE = [[[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]], [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]], [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]], [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]]];
const LUDO_BASE = [[0, 0], [9, 0], [9, 9], [0, 9]];
const LUDO_SAFE = [0, 13, 26, 39, 8, 21, 34, 47];
const ludoSend = o => { try { return hvSend(o); } catch (e) { return false; } };
const lel = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
function ludoSfx(k) {
  try {
    if (k === 'roll') for (let i = 0; i < 5; i++) blip('square', 180 + i * 30, 120, 0.05, 0.04, i * 0.06);
    else if (k === 'move') blip('sine', 520, 700, 0.08, 0.06);
    else if (k === 'cap') { blip('sawtooth', 420, 90, 0.3, 0.07); }
    else if (k === 'home') [[660, 0], [880, 0.09], [1175, 0.18]].forEach(q => blip('sine', q[0], q[0], 0.15, 0.07, q[1]));
    else if (k === 'turn') blip('triangle', 880, 880, 0.12, 0.06);
    else if (k === 'win') [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]].forEach(q => blip('sine', q[0], q[0], 0.2, 0.08, q[1]));
    else blip('sine', 600, 600, 0.05, 0.04);
  } catch (e) {}
}
/* مكان الحجر (بوحدات الخلية) حسب المقعد والموقع */
function ludoCell(seat, pos, k) {
  if (pos < 0) { const b = LUDO_BASE[seat]; return [b[0] + (k % 2 ? 4 : 2) + 0.5, b[1] + (k > 1 ? 4 : 2) + 0.5]; }
  if (pos <= 50) { const c = LUDO_TRACK[(LUDO_START[seat] + pos) % 52]; return [c[0] + 0.5, c[1] + 0.5]; }
  const c = LUDO_LANE[seat][Math.min(5, pos - 51)]; return [c[0] + 0.5, c[1] + 0.5];
}
function ludoOpen() {
  if (!auth) { showToast('✍️ سجّل حساب حتى تلعب لودو'); closePage(); setTimeout(() => openPage('account'), 200); return; }
  ludoCss(); ludoSend({ t: 'ludo_get' }); ludoRender();
}
function ludoClose() { cancelAnimationFrame(LUDOG.raf); LUDOG.raf = 0; }
function ludoEmoBar() {
  const b = lel('div', 'ludoEmo'); ['😂', '❤️', '👏', '🔥', '😎', '😡', '😭', '🎉'].forEach(e => { const x = lel('button', '', e); x.type = 'button'; x.onclick = () => { ludoSend({ t: 'ludo_emo', e }); }; b.appendChild(x); }); return b;
}
function ludoEmoFloat(seat, e) {
  const root = ludoRoot(); if (!root) return; const host = root.querySelector('.ludoGame, .ludoMenu'); if (!host) return; host.style.position = 'relative';
  const chip = host.querySelector('.ludoChip[data-seat="' + seat + '"]') || host.querySelector('.ludoSeat:nth-child(' + (seat + 1) + ')'), hr = host.getBoundingClientRect(), cr = chip ? chip.getBoundingClientRect() : hr;
  for (let i = 0; i < 3; i++) { const f = lel('span', 'ludoFloat', e); f.style.left = (cr.left - hr.left + cr.width / 2 + (i - 1) * 16) + 'px'; f.style.top = (cr.top - hr.top + 8) + 'px'; f.style.animationDelay = (i * 0.12) + 's'; host.appendChild(f); setTimeout(() => f.remove(), 2200); }
  ludoSfx(); 
}
function ludoRmOpen() { LUDOG.mode = 'rm'; LUDOG.s = null; LUDOG.disp = {}; LUDOG.fx = []; ludoCss(); const o = document.getElementById('rmLudo'); if (o) o.hidden = false; const x = document.getElementById('rmLdX'); if (x) x.onclick = () => { try { rmStand(); } catch (e) {} }; ludoRender(); }
function ludoRmClose() { LUDOG.mode = 'page'; cancelAnimationFrame(LUDOG.raf); LUDOG.raf = 0; LUDOG.s = null; LUDOG.cv = null; const o = document.getElementById('rmLudo'); if (o) o.hidden = true; const b = document.getElementById('rmLdBody'); if (b) b.innerHTML = ''; }
function ludoMsg(d) {
  if (d.t === 'ludo_emo') return ludoEmoFloat(d.s, d.e);
  if (d.t === 'ludo_state') { const old = LUDOG.s; LUDOG.s = d.s; ludoOnState(old, d.s); }
  else if (d.t === 'ludo_list') ludoRenderList(d.list);
  else if (d.t === 'ludo_err') showToast('⚠️ ' + d.error);
}
function ludoOnState(old, s) {
  if (s && s.last && s.last.id !== LUDOG.lastEv) {
    LUDOG.lastEv = s.last.id; LUDOG.last = s.last;
    if (s.last.k === 'roll') { LUDOG.rolling = performance.now() + 650; LUDOG.dice = s.last.d; ludoSfx('roll'); }
    else if (s.last.k === 'sixes') { showToast('🎲 ثلاث ستات ورا بعض، ضاع الدور!'); }
    else if (s.last.k === 'move') { ludoSfx(s.last.cap ? 'cap' : s.last.home ? 'home' : 'move'); try { const q = ludoCell(s.last.s, s.last.pos, s.last.tk); ludoBurst(q[0], q[1], s.last.cap ? 'cap' : s.last.home ? 'home' : 'dust', LUDO_COL[s.last.s].c); if (s.last.cap) LUDOG.shake = performance.now() + 380; } catch (e) {} }
  }
  if (s && s.ph === 'over' && (!old || old.ph !== 'over')) { ludoSfx('win'); LUDOG.winT = performance.now(); ludoConfetti(); }
  if (s && s.ph === 'play' && s.turn === s.my && (!old || old.turn !== s.turn || old.ph !== 'play')) { ludoSfx('turn'); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} }
  const ph = s ? s.ph : ''; const R = ludoRoot();
  if (R && R.dataset.ph !== ph) { ludoRender(); } else ludoUpdate();
}
function ludoRoot() { return document.getElementById(LUDOG.mode === 'rm' ? 'rmLdBody' : 'ludoBody'); }
const ludoRm = () => LUDOG.mode === 'rm';
function ludoRender() {
  const R = ludoRoot(); if (!R) return; const s = LUDOG.s; R.dataset.ph = s ? s.ph : '';
  R.innerHTML = '';
  if (!s) { if (ludoRm()) { R.appendChild(lel('div', 'ludoWait', '⏳ جاري الجلوس على الطاولة...')); return; } R.appendChild(ludoMenuEl()); ludoSend({ t: 'ludo_list' }); return; }
  if (s.ph === 'lobby') { R.appendChild(ludoLobbyEl(s)); return; }
  R.appendChild(ludoGameEl()); ludoUpdate(); ludoLoop();
}
function ludoMenuEl() {
  const w = lel('div', 'ludoMenu');
  const hero = lel('div', 'ludoHero'); hero.append(lel('div', 'ludoHeroEm', '🎲'), lel('h2', '', 'لودو'), lel('p', '', 'طاولة بـ 4 مقاعد. تكدرون تلعبون لاعبين اثنين بس، أو لين 4. اللي يوصّل أحجاره الأربعة للبيت أول يفوز!'));
  const q = lel('button', 'ludoBtn big', '⚡ لعب سريع'); q.onclick = () => { ludoSfx(); ludoSend({ t: 'ludo_quick' }); };
  const cr = lel('button', 'ludoBtn', '➕ طاولة خاصة لأصدقائي'); cr.onclick = () => { ludoSfx(); ludoSend({ t: 'ludo_create' }); };
  const jr = lel('div', 'ludoJoin'); const inp = lel('input'); inp.placeholder = 'رمز الطاولة (4 أرقام)'; inp.maxLength = 4; inp.inputMode = 'numeric';
  const jb = lel('button', 'ludoBtn', '🔑 ادخل'); jb.onclick = () => { if (inp.value.trim().length !== 4) { showToast('اكتب رمز من 4 أرقام'); return; } ludoSend({ t: 'ludo_join', code: inp.value.trim() }); }; jr.append(inp, jb);
  const lst = lel('div', 'ludoList'); lst.id = 'ludoList'; lst.appendChild(lel('small', '', '...'));
  w.append(hero, q, cr, jr, lel('div', 'ludoSec', '🌐 طاولات مفتوحة'), lst); return w;
}
function ludoRenderList(list) {
  const Lb = document.getElementById('ludoList'); if (!Lb) return; Lb.innerHTML = '';
  if (!list.length) { Lb.appendChild(lel('small', '', 'ماكو طاولات مفتوحة هسه — دوس «لعب سريع» وتنفتح طاولة جديدة')); return; }
  list.forEach(x => { const b = lel('button', 'ludoRow', '🎲 طاولة ' + x.host + ' • ' + x.n + '/4'); b.onclick = () => ludoSend({ t: 'ludo_quick' }); Lb.appendChild(b); });
}
function ludoLobbyEl(s) {
  const w = lel('div', 'ludoMenu'); const me = s.seats[s.my];
  w.appendChild(lel('h3', 'ludoH', '🎲 غرفة الانتظار (' + s.seats.filter(Boolean).length + '/4)'));
  if (s.priv) { const cb = lel('div', 'ludoCode'); cb.innerHTML = 'رمز الطاولة: <b>' + s.code + '</b> — دزه لأصدقائك'; w.appendChild(cb); }
  const g = lel('div', 'ludoSeats');
  s.seats.forEach((p, i) => {
    const C = LUDO_COL[i], c = lel('div', 'ludoSeat' + (p ? '' : ' empty') + (p && p.me ? ' me' : '')); c.style.setProperty('--c', C.c); c.style.setProperty('--d', C.d);
    const dot = lel('span', 'ludoDot'); c.appendChild(dot);
    if (p) { c.appendChild(lel('b', '', (p.host ? '👑 ' : '') + p.n)); c.appendChild(lel('small', '', C.n)); }
    else { c.appendChild(lel('b', '', 'مقعد فارغ')); c.appendChild(lel('small', '', C.n)); if (me && !ludoRm()) { const sb = lel('button', 'ludoSit', '🪑 اجلس هنا'); sb.onclick = () => ludoSend({ t: 'ludo_seat', s: i }); c.appendChild(sb); } }
    g.appendChild(c);
  });
  w.appendChild(g);
  const n = s.seats.filter(Boolean).length;
  if (me && me.host) { const st = lel('button', 'ludoBtn big', n >= 2 ? '▶️ ابدأ اللعبة' : '⏳ لازم لاعبين اثنين على الأقل'); st.disabled = n < 2; st.onclick = () => ludoSend({ t: 'ludo_start' }); w.appendChild(st); }
  else w.appendChild(lel('div', 'ludoWait', '⏳ بانتظار صاحب الطاولة يبدي اللعبة'));
  w.appendChild(lel('small', 'ludoNote', 'ما يلزم تكتمل المقاعد الأربعة، تكدرون تلعبون اثنين بس 👌'));
  if (ludoRm()) w.appendChild(lel('small', 'ludoNote', 'كل كرسي حول الطاولة = لون. للطلوع اضغط «قيام» فوق 🪑'));
  else { const lv = lel('button', 'ludoBtn ghost', '🚪 طلوع'); lv.onclick = () => ludoSend({ t: 'ludo_leave' }); w.appendChild(lv); }
  w.appendChild(ludoEmoBar()); return w;
}
function ludoGameEl() {
  const w = lel('div', 'ludoGame'); w.id = 'ludoGame';
  const top = lel('div', 'ludoTop'); top.id = 'ludoTop';
  const cv = lel('canvas', 'ludoCv'); cv.id = 'ludoCv'; LUDOG.cv = cv; LUDOG.disp = {};
  cv.addEventListener('pointerdown', ludoClick);
  const bar = lel('div', 'ludoBar'); const dice = lel('button', 'ludoDice', '🎲'); dice.id = 'ludoDice'; dice.onclick = () => { const s = LUDOG.s; if (s && s.ph === 'play' && s.turn === s.my && !s.rolled) ludoSend({ t: 'ludo_roll' }); };
  const msg = lel('div', 'ludoMsg'); msg.id = 'ludoMsg'; bar.append(dice, msg);
  const lv = lel('button', 'ludoBtn ghost small', '🚪 طلوع'); lv.onclick = () => { if (confirm('تطلع من اللعبة؟')) ludoSend({ t: 'ludo_leave' }); };
  w.append(top, cv, bar, ludoEmoBar()); if (!ludoRm()) w.appendChild(lv); return w;
}
function ludoUpdate() {
  const s = LUDOG.s; if (!s || s.ph === 'lobby') return;
  const top = document.getElementById('ludoTop'), msg = document.getElementById('ludoMsg'), dice = document.getElementById('ludoDice'); if (!top || !msg || !dice) return;
  top.innerHTML = ''; s.seats.forEach((p, i) => { if (!p) return; const C = LUDO_COL[i], c = lel('span', 'ludoChip' + (s.ph === 'play' && s.turn === i ? ' on' : '') + (p.left ? ' off' : '')); c.dataset.seat = i; c.style.setProperty('--c', C.c); c.textContent = (p.me ? '⭐ ' : '') + p.n + (p.left ? ' (طلع)' : '') + ' ' + p.tk.filter(x => x === 56).length + '/4'; top.appendChild(c); });
  const mine = s.my, myTurn = s.ph === 'play' && s.turn === mine;
  dice.disabled = !(myTurn && !s.rolled); dice.classList.toggle('go', myTurn && !s.rolled);
  if (s.ph === 'over') { const w = s.seats[s.win.s]; msg.textContent = '🏆 فاز ' + (w ? w.n : '؟') + (s.win.why ? ' (' + s.win.why + ')' : '') + ' — ترجعون للانتظار بعد لحظات'; }
  else if (myTurn) msg.textContent = s.rolled ? (s.movable.length ? '👆 دوس على حجر مضيء حتى تحركه' : 'ماكو حركة متاحة...') : '🎲 دورك! دوس النرد';
  else { const t = s.seats[s.turn]; msg.textContent = '⏳ دور ' + (t ? t.n : '؟') + ' (' + (LUDO_COL[s.turn] || {}).n + ')'; }
}
function ludoLoop() {
  cancelAnimationFrame(LUDOG.raf);
  const step = () => { if (!document.getElementById('ludoCv')) { LUDOG.raf = 0; return; } ludoDraw(); LUDOG.raf = requestAnimationFrame(step); };
  LUDOG.raf = requestAnimationFrame(step);
}
function ludoGeom() {
  const cv = LUDOG.cv; const sz = Math.min(cv.parentNode.clientWidth, window.innerHeight * 0.62, 520) || 320; const dpr = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(sz * dpr)) { cv.width = Math.round(sz * dpr); cv.height = Math.round(sz * dpr); cv.style.width = sz + 'px'; cv.style.height = sz + 'px'; }
  return { sz, dpr, u: sz / 15 };
}
function ludoTokenSpots(s) {   /* مواقع الحجار الحالية (هدف) + تجميع الأحجار اللي بنفس الخانة */
  const out = [], seen = {};
  s.seats.forEach((p, i) => { if (!p) return; p.tk.forEach((pos, k) => { const [x, y] = ludoCell(i, pos, k); const key = pos < 0 ? 'b' + i + k : Math.round(x * 2) + ',' + Math.round(y * 2); seen[key] = (seen[key] || 0) + 1; out.push({ seat: i, k, pos, x, y, n: seen[key] - 1, key }); }); });
  out.forEach(o => { o.cnt = seen[o.key]; });
  return out;
}
function ludoBurst(cx, cy, kind, col) {
  const n = kind === 'cap' ? 26 : kind === 'home' ? 22 : 8;
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = (kind === 'dust' ? 0.02 : 0.05) + Math.random() * (kind === 'cap' ? 0.14 : 0.1); LUDOG.fx.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'home' ? 0.05 : 0), l: 1, d: 0.02 + Math.random() * 0.02, e: kind === 'cap' ? (Math.random() < 0.4 ? '💥' : null) : kind === 'home' ? (Math.random() < 0.6 ? '⭐' : null) : null, c: kind === 'cap' ? ['#ff5a3a', '#ffb020', '#fff'][i % 3] : kind === 'home' ? ['#ffd23a', '#fff', col][i % 3] : col, r: 0.1 + Math.random() * 0.12 }); }
}
function ludoConfetti() { for (let i = 0; i < 90; i++) LUDOG.fx.push({ x: Math.random() * 15, y: -1 - Math.random() * 6, vx: (Math.random() - 0.5) * 0.04, vy: 0.04 + Math.random() * 0.07, l: 1.6, d: 0.004, c: ['#ef3b3b', '#2fbf5b', '#f4c21d', '#2f7bff', '#ff6bd5', '#fff'][i % 6], r: 0.14 + Math.random() * 0.14, rect: 1, rot: Math.random() * 6 }); }
function ludoFx(c, u) {
  const keep = [];
  LUDOG.fx.forEach(p => { p.x += p.vx; p.y += p.vy; if (!p.rect) p.vy += 0.004; else p.rot += 0.2; p.l -= p.d; if (p.l <= 0) return; keep.push(p); c.globalAlpha = Math.min(1, p.l);
    if (p.e) { c.font = (u * 0.9) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.e, p.x * u, p.y * u); }
    else { c.fillStyle = p.c; if (p.rect) { c.save(); c.translate(p.x * u, p.y * u); c.rotate(p.rot); c.fillRect(-p.r * u, -p.r * u * 0.5, p.r * u * 2, p.r * u); c.restore(); } else { c.beginPath(); c.arc(p.x * u, p.y * u, p.r * u, 0, 7); c.fill(); } } });
  c.globalAlpha = 1; LUDOG.fx = keep.slice(-260);
}
function ludoDraw() {
  const s = LUDOG.s, cv = LUDOG.cv; if (!s || !cv) return; const G = ludoGeom(), c = cv.getContext('2d'), u = G.u; const t = performance.now();
  c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); c.clearRect(0, 0, G.sz, G.sz); c.save(); if ((LUDOG.shake || 0) > t) c.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
  const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  c.fillStyle = '#fffaf0'; rr(0, 0, G.sz, G.sz, 14); c.fill();
  /* البيوت الأربعة */
  LUDO_BASE.forEach((b, i) => { const C = LUDO_COL[i]; c.fillStyle = C.c; c.fillRect(b[0] * u, b[1] * u, 6 * u, 6 * u); c.fillStyle = C.l; rr((b[0] + 1) * u, (b[1] + 1) * u, 4 * u, 4 * u, u * 0.5); c.fill();
    [[2, 2], [4, 2], [2, 4], [4, 4]].forEach(q => { c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.arc((b[0] + q[0] + 0.5) * u, (b[1] + q[1] + 0.5) * u, u * 0.42, 0, 7); c.fill(); }); });
  /* خانات المسار */
  c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,.22)';
  LUDO_TRACK.forEach((q, i) => { c.fillStyle = '#fff'; c.fillRect(q[0] * u, q[1] * u, u, u); c.strokeRect(q[0] * u, q[1] * u, u, u); });
  LUDO_START.forEach((a, i) => { const q = LUDO_TRACK[a]; c.fillStyle = LUDO_COL[i].c; c.fillRect(q[0] * u, q[1] * u, u, u); c.strokeRect(q[0] * u, q[1] * u, u, u); });
  LUDO_LANE.forEach((ln, i) => ln.forEach(q => { c.fillStyle = LUDO_COL[i].c; c.globalAlpha = 0.78; c.fillRect(q[0] * u, q[1] * u, u, u); c.globalAlpha = 1; c.strokeRect(q[0] * u, q[1] * u, u, u); }));
  LUDO_SAFE.forEach(a => { if (LUDO_START.includes(a)) return; const q = LUDO_TRACK[a]; c.fillStyle = '#b9b2a2'; c.font = (u * 0.7) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', (q[0] + 0.5) * u, (q[1] + 0.55) * u); });
  /* المركز: 4 مثلثات */
  const tri = (pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0] * u, pts[1] * u); c.lineTo(pts[2] * u, pts[3] * u); c.lineTo(pts[4] * u, pts[5] * u); c.closePath(); c.fill(); };
  tri([6, 6, 6, 9, 7.5, 7.5], LUDO_COL[0].c); tri([6, 6, 9, 6, 7.5, 7.5], LUDO_COL[1].c); tri([9, 6, 9, 9, 7.5, 7.5], LUDO_COL[2].c); tri([6, 9, 9, 9, 7.5, 7.5], LUDO_COL[3].c);
  /* الأحجار */
  const spots = ludoTokenSpots(s), me = s.my, mv = new Set(s.movable || []);
  spots.sort((a, b) => a.y - b.y);
  spots.forEach(o => {
    const id = o.seat + '_' + o.k; let d = LUDOG.disp[id]; const off = o.cnt > 1 && o.pos >= 0 ? [(o.n - (o.cnt - 1) / 2) * 0.28, 0] : [0, 0];
    const tx = o.x + off[0], ty = o.y + off[1]; if (!d) d = LUDOG.disp[id] = { x: tx, y: ty }; d.x += (tx - d.x) * 0.22; d.y += (ty - d.y) * 0.22;
    const C = LUDO_COL[o.seat], canMove = o.seat === me && mv.has(o.k), bob = canMove ? Math.sin(t / 150) * 0.12 : 0, r = u * (o.cnt > 1 && o.pos >= 0 ? 0.3 : 0.38);
    const lift = Math.min(0.6, Math.hypot(tx - d.x, ty - d.y) * 0.3), px = d.x * u, gy = (d.y + bob) * u, py = gy - lift * u;   // القفزة أثناء الحركة
    c.fillStyle = 'rgba(0,0,0,' + (0.28 - lift * 0.2) + ')'; c.beginPath(); c.ellipse(px, gy + r * 0.9, r * 0.95, r * 0.4, 0, 0, 7); c.fill();
    if (canMove) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(px, py, r + 5 + Math.sin(t / 120) * 2, 0, 7); c.stroke(); c.strokeStyle = C.c; c.lineWidth = 1.5; c.stroke(); }
    const gr = c.createRadialGradient(px - r * 0.3, py - r * 0.35, r * 0.1, px, py, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, C.c); gr.addColorStop(1, C.d);
    c.fillStyle = gr; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke();
    o.px = px; o.py = py; o.r = r;
  });
  LUDOG.spots = spots; ludoFx(c, u);
  /* إطار بلون صاحب الدور + وهج */
  if (s.ph === 'play' && s.turn >= 0) { const C = LUDO_COL[s.turn]; c.lineWidth = 5; c.strokeStyle = C.c; c.globalAlpha = 0.55 + 0.35 * Math.sin(t / 220); rr(2.5, 2.5, G.sz - 5, G.sz - 5, 14); c.stroke(); c.globalAlpha = 1; }
  if (s.ph === 'over' && s.win) { const w = s.seats[s.win.s], C = LUDO_COL[s.win.s], k = Math.min(1, (t - (LUDOG.winT || t)) / 500); c.fillStyle = 'rgba(10,6,30,' + (0.55 * k) + ')'; c.fillRect(0, 0, G.sz, G.sz); c.save(); c.translate(G.sz / 2, G.sz / 2); c.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = (u * 3.2) + 'px system-ui'; c.fillText('🏆', 0, -u * 1.6 + Math.sin(t / 200) * 4); c.font = 'bold ' + (u * 1.15) + 'px Cairo, system-ui, sans-serif'; c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = C.c; const tx = 'فاز ' + (w ? w.n : '؟') + '!'; c.strokeText(tx, 0, u * 1.2); c.fillText(tx, 0, u * 1.2); c.restore(); }
  c.restore();
  /* النرد */
  const dice = document.getElementById('ludoDice');
  if (dice) { const rolling = performance.now() < LUDOG.rolling; dice.textContent = rolling ? ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][Math.floor(t / 70) % 6] : (s.dice ? ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][s.dice - 1] : '🎲'); dice.classList.toggle('shake', rolling); }
}
function ludoClick(e) {
  const s = LUDOG.s; if (!s || s.ph !== 'play' || s.turn !== s.my || !s.rolled || !LUDOG.spots) return;
  const r = LUDOG.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 1e9;
  LUDOG.spots.forEach(o => { if (o.seat !== s.my || !s.movable.includes(o.k)) return; const dd = Math.hypot((o.px || 0) / (LUDOG.cv.width / r.width) - x, (o.py || 0) / (LUDOG.cv.height / r.height) - y); if (dd < bd) { bd = dd; best = o; } });
  if (best && bd < 44) ludoSend({ t: 'ludo_move', k: best.k });
}
function ludoCss() {
  if (document.getElementById('ludoCss')) return; const st = document.createElement('style'); st.id = 'ludoCss';
  st.textContent = `#pg-ludo .pgBody{max-width:none;padding:10px;gap:0;overflow:auto;background:radial-gradient(ellipse at top,#2a1a52,#0a0814)}
.ludoMenu,.ludoGame{width:100%;max-width:440px;margin:0 auto;display:flex;flex-direction:column;gap:10px;color:#fff;padding-bottom:60px}
.ludoHero{text-align:center;background:radial-gradient(circle at 80% 10%,rgba(255,210,90,.28),transparent 50%),radial-gradient(circle at 10% 100%,rgba(255,70,140,.3),transparent 55%),rgba(255,255,255,.07);border:1px solid rgba(255,210,122,.5);border-radius:18px;padding:12px;animation:ludoHeroG 2.4s ease-in-out infinite}@keyframes ludoHeroG{50%{box-shadow:0 0 22px rgba(255,170,60,.5)}}.ludoHero h2{margin:2px 0}.ludoHero p{margin:4px 0 0;font-size:13px;opacity:.85}.ludoHeroEm{font-size:46px;animation:ludoBob 1.6s ease-in-out infinite}
@keyframes ludoBob{50%{transform:translateY(-6px) rotate(8deg)}}
.ludoBtn{width:100%;padding:12px;border-radius:14px;border:2px solid rgba(255,255,255,.6);background:linear-gradient(135deg,#ff8a2a,#e53b6a);color:#fff;font-weight:800;font-size:15px;font-family:inherit}.ludoBtn.big{padding:15px;font-size:17px}.ludoBtn.ghost{background:rgba(255,255,255,.1)}.ludoBtn.small{padding:8px;font-size:13px}.ludoBtn:disabled{opacity:.5}
.ludoJoin{display:flex;gap:8px}.ludoJoin input{flex:1;min-width:0;padding:10px;font-size:16px;border-radius:12px;border:2px solid #ffd1a0;background:#fff;color:#222}.ludoJoin .ludoBtn{width:auto;padding:10px 16px}
.ludoSec,.ludoH{font-weight:800;margin:4px 0}.ludoList{display:flex;flex-direction:column;gap:6px}.ludoRow{padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-family:inherit}
.ludoCode{background:rgba(255,255,255,.1);border-radius:12px;padding:10px;text-align:center}.ludoCode b{font-size:22px;letter-spacing:4px}
.ludoSeats{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ludoSeat{border-radius:14px;padding:10px;border:2px solid var(--c);background:rgba(255,255,255,.08);display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center}.ludoSeat.me{box-shadow:0 0 0 3px #fff3}.ludoSeat.empty{opacity:.75;border-style:dashed}.ludoDot{width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--c) 40%,var(--d))}.ludoSit{margin-top:4px;padding:6px 10px;border-radius:10px;border:0;background:var(--c);color:#fff;font-weight:700;font-family:inherit}
.ludoWait,.ludoNote{text-align:center;opacity:.85;font-size:13px}
.ludoTop{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.ludoChip{padding:5px 10px;border-radius:999px;border:2px solid var(--c);background:rgba(255,255,255,.08);font-size:12px;font-weight:700}.ludoChip.on{background:var(--c);box-shadow:0 0 12px var(--c)}.ludoChip.off{opacity:.45;text-decoration:line-through}
.ludoCv{display:block;margin:0 auto;border-radius:14px;touch-action:manipulation;box-shadow:0 8px 28px rgba(0,0,0,.5)}
.ludoBar{display:flex;align-items:center;gap:12px;justify-content:center}.ludoDice{font-size:44px;width:70px;height:70px;border-radius:16px;border:3px solid #fff;background:#fff;color:#222;line-height:1;padding:0}.ludoDice:disabled{opacity:.55}.ludoDice.go{animation:ludoPulse .8s ease-in-out infinite;border-color:#ffb020}.ludoDice.shake{animation:ludoShake .12s linear infinite}
@keyframes ludoPulse{50%{transform:scale(1.12)}}@keyframes ludoShake{0%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}100%{transform:rotate(-12deg)}}
.ludoMsg{font-weight:700;font-size:14px;max-width:230px}
.ludoEmo{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.ludoEmo button{font-size:22px;width:42px;height:42px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);padding:0;transition:transform .12s}.ludoEmo button:active{transform:scale(1.3)}
.ludoFloat{position:absolute;font-size:30px;pointer-events:none;animation:ludoUp 2s ease-out forwards;z-index:5}@keyframes ludoUp{0%{transform:translate(-50%,0) scale(.4);opacity:0}15%{opacity:1;transform:translate(-50%,-10px) scale(1.2)}100%{transform:translate(-50%,-110px) scale(1);opacity:0}}
.ludoDice.pop{animation:ludoPop .35s}@keyframes ludoPop{50%{transform:scale(1.35) rotate(8deg)}}`;
  document.head.appendChild(st);
}
