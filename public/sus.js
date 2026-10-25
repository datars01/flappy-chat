/* ===================== لعبة «مين الخاين؟» 🥔 — الواجهة =====================
   شخصيات أكل مضحكة على سفينة فضاء: الطاقم يخلص المهمات، والخاين يطيّرهم واحد واحد. */
'use strict';
var SUSG = { map: null, s: null, pos: {}, my: null, raf: 0, joy: null, keys: {}, t: 0, fx: [], cam: [800, 500], lastSend: 0, roleShown: '', task: null, ejT: 0, overSeen: false, lastPh: '' };
const SUS_CH = [
  { n: 'بطاطا', c: '#c8955a', d: '#8a5f30' }, { n: 'باذنجانة', c: '#6a3a8a', d: '#3e1f55' }, { n: 'طماطة', c: '#e8382e', d: '#9a1f18' }, { n: 'سمونة', c: '#e3aa62', d: '#a06a2a' },
  { n: 'كبة', c: '#9a5a2a', d: '#5e3414' }, { n: 'جزرة', c: '#ff8a2a', d: '#b8520c' }, { n: 'موزة', c: '#ffd84a', d: '#b8920c' }, { n: 'خيارة', c: '#4caa4a', d: '#2a6a28' }];
const susSend = o => { try { return hvSend(o); } catch (e) { return false; } };
const susMe = () => { const s = SUSG.s; return s ? s.players.find(p => p.me) : null; };
const susWalk = (x, y) => SUSG.map && SUSG.map.walk.some(r => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]);
const susOk = (x, y) => susWalk(x - 13, y - 26) && susWalk(x + 13, y - 26) && susWalk(x - 13, y + 8) && susWalk(x + 13, y + 8);   /* الراس والرجلين لازم داخل الغرفة */
function susSfx(k) { try { if (k === 'kill') { burst(0.25, 0.25, 0, 400); blip('sawtooth', 300, 60, 0.4, 0.08); } else if (k === 'task') [[660, 0], [880, 0.08], [1175, 0.16]].forEach(q => blip('sine', q[0], q[0], 0.15, 0.07, q[1])); else if (k === 'meet') [[440, 0], [440, 0.25], [440, 0.5]].forEach(q => blip('square', q[0], q[0] * 1.5, 0.18, 0.06, q[1])); else if (k === 'click') blip('sine', 600, 900, 0.06, 0.05); else if (k === 'win') [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]].forEach(q => blip('sine', q[0], q[0], 0.25, 0.07, q[1])); else if (k === 'lose') [[392, 0], [330, 0.15], [262, 0.3]].forEach(q => blip('triangle', q[0], q[0], 0.3, 0.07, q[1])); } catch (e) {} }

/* ---------- رسم الشخصيات (أكل بعيون وجلوب ورجول) ---------- */
function susBody(c, ch) {
  c.beginPath();
  switch (ch) {
    case 0: c.ellipse(0, -22, 17, 21, 0, 0, 7); break;
    case 1: c.moveTo(0, -50); c.bezierCurveTo(14, -48, 20, -20, 18, -10); c.bezierCurveTo(16, 2, -16, 2, -18, -10); c.bezierCurveTo(-20, -24, -12, -48, 0, -50); break;
    case 2: c.ellipse(0, -21, 21, 19, 0, 0, 7); break;
    case 3: c.moveTo(-20, -4); c.quadraticCurveTo(-24, -40, 0, -44); c.quadraticCurveTo(24, -40, 20, -4); c.closePath(); break;
    case 4: c.moveTo(0, -48); c.bezierCurveTo(20, -36, 20, -8, 0, 0); c.bezierCurveTo(-20, -8, -20, -36, 0, -48); break;
    case 5: c.moveTo(-17, -40); c.quadraticCurveTo(0, -46, 17, -40); c.quadraticCurveTo(10, -12, 0, 0); c.quadraticCurveTo(-10, -12, -17, -40); break;
    case 6: c.moveTo(-6, -48); c.quadraticCurveTo(22, -36, 14, -4); c.quadraticCurveTo(4, 2, -4, -2); c.quadraticCurveTo(10, -24, -10, -44); c.closePath(); break;
    default: c.moveTo(-12, -44); c.quadraticCurveTo(0, -52, 12, -44); c.lineTo(13, -6); c.quadraticCurveTo(0, 4, -13, -6); c.closePath();
  }
}
function susChar(c, ch, x, y, dir, t, mv, o) {
  o = o || {}; const C = SUS_CH[ch] || SUS_CH[0]; c.save(); c.translate(x, y); if (o.s) c.scale(o.s, o.s);
  if (o.ghost) { c.globalAlpha = 0.5; c.translate(0, -8 + Math.sin(t / 12) * 3); }
  const bob = mv ? -Math.abs(Math.sin(t / 3.2)) * 3 : Math.sin(t / 22) * 0.8, sq = mv ? 1 + Math.sin(t / 1.6) * 0.03 : 1;
  if (!o.ghost) { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 1, 15, 4, 0, 0, 7); c.fill(); }
  if (!o.ghost) [-1, 1].forEach(s => { const lf = mv ? Math.sin(t / 3.2 + (s > 0 ? Math.PI : 0)) * 4 : 0; c.fillStyle = '#2a2030'; c.beginPath(); c.ellipse(s * 7 + lf * 0.6, -1 - Math.max(0, lf) * 0.6, 5, 3.2, 0, 0, 7); c.fill(); });
  c.translate(0, bob); c.scale(dir * sq, 1 / sq);
  c.lineWidth = 2.2; c.strokeStyle = '#1e1428'; c.fillStyle = C.c; susBody(c, ch); c.fill(); c.stroke();
  c.save(); susBody(c, ch); c.clip(); c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(-8, -34, 6, 9, -0.4, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(10, -10, 12, 9, 0, 0, 7); c.fill();
  if (ch === 0) { c.fillStyle = C.d; [[-6, -14], [7, -26], [2, -8]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 1.5, 0, 7); c.fill(); }); }
  if (ch === 3) { c.strokeStyle = C.d; c.lineWidth = 1.6; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 8 - 3, -36); c.lineTo(i * 8 + 3, -30); c.stroke(); } }
  if (ch === 7) { c.fillStyle = '#d8f0a0'; [[-6, -36], [5, -28], [-4, -16], [6, -12]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 1.3, 0, 7); c.fill(); }); }
  c.restore();
  if (ch === 1) { c.fillStyle = '#3a8a2a'; c.beginPath(); c.moveTo(-8, -48); c.quadraticCurveTo(0, -58, 8, -48); c.quadraticCurveTo(0, -44, -8, -48); c.fill(); c.fillRect(-1.5, -60, 3, 8); }
  if (ch === 2) { c.fillStyle = '#2f8a2a'; for (let i = 0; i < 5; i++) { c.save(); c.translate(0, -39); c.rotate(i * 1.256); c.beginPath(); c.ellipse(0, -4, 2.4, 6, 0, 0, 7); c.fill(); c.restore(); } }
  if (ch === 5) { c.fillStyle = '#3aa02a'; [-6, 0, 6].forEach(s => { c.beginPath(); c.ellipse(s, -48, 2.6, 8, s * 0.06, 0, 7); c.fill(); }); }
  if (ch === 6) { c.fillStyle = '#6a4a1a'; c.fillRect(-8, -50, 4, 5); }
  // العيون (تتحرك حسب الاتجاه) والفم
  const ey = ch === 5 ? -32 : ch === 1 ? -30 : -26, dead = o.dead;
  [-6.5, 6.5].forEach(ex => { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, 5.2, 6, 0, 0, 7); c.fill(); c.lineWidth = 1.2; c.stroke();
    if (dead) { c.strokeStyle = '#1e1428'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(ex - 3, ey - 3); c.lineTo(ex + 3, ey + 3); c.moveTo(ex + 3, ey - 3); c.lineTo(ex - 3, ey + 3); c.stroke(); }
    else { const look = mv ? 1.8 : Math.sin(t / 40) * 1.2; c.fillStyle = '#1e1428'; c.beginPath(); c.arc(ex + look, ey + 1, 2.6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + look - 0.8, ey, 0.9, 0, 7); c.fill(); } });
  c.strokeStyle = '#1e1428'; c.lineWidth = 1.6; c.beginPath(); if (dead) { c.moveTo(-4, ey + 11); c.quadraticCurveTo(0, ey + 8, 4, ey + 11); } else if (o.imp) { c.moveTo(-5, ey + 9); c.quadraticCurveTo(0, ey + 14, 6, ey + 8); } else { c.moveTo(-5, ey + 9); c.quadraticCurveTo(0, ey + 14, 5, ey + 9); } c.stroke();
  c.fillStyle = 'rgba(255,90,120,.35)'; [-11, 11].forEach(bx => { c.beginPath(); c.ellipse(bx, ey + 7, 3, 2, 0, 0, 7); c.fill(); });
  c.restore();
}
function susBodyDraw(c, b, t) {   // اللي انمسك: صار «فطيرة» منبطحة وفوكه نجوم تدور 😵 (بدون دم)
  c.save(); c.translate(b.x, b.y); c.scale(1.25, 0.42); susChar(c, b.ch, 0, 0, 1, 0, 0, { dead: 1 }); c.restore();
  c.save(); for (let i = 0; i < 3; i++) { const a = t / 14 + i * 2.094; c.font = '10px system-ui'; c.textAlign = 'center'; c.fillText('⭐', b.x + Math.cos(a) * 16, b.y - 22 + Math.sin(a) * 5); } c.restore();
}

/* ---------- الصفحة والقوائم ---------- */
function susRoot() { return document.getElementById('susBody'); }
function susOpen() {
  if (!auth) { showToast('✍️ سجّل حساب حتى تلعب «مين الخاين؟»'); closePage(); setTimeout(() => openPage('account'), 200); return; }
  const go = () => { susSend({ t: 'sus_get' }); susRender(); };
  if (SUSG.map && SUSG.map.v === 2) go(); else fetch('/sus-map.json?v=2').then(r => r.json()).then(m => { SUSG.map = m; go(); }).catch(() => showToast('⚠️ ما قدرت أحمّل اللعبة'));
}
function susClose() { cancelAnimationFrame(SUSG.raf); SUSG.raf = 0; }
function susMsg(d) {
  if (d.t === 'sus_state') { const old = SUSG.s; SUSG.s = d.s; susOnState(old, d.s); }
  else if (d.t === 'sus_pos') { (d.p || []).forEach(q => { const o = SUSG.pos[q[0]] || (SUSG.pos[q[0]] = { x: q[1], y: q[2] }); o.tx = q[1]; o.ty = q[2]; o.dir = q[3]; o.mv = q[4]; o.alive = q[5]; o.seen = performance.now(); }); }
  else if (d.t === 'sus_kill') { susSfx('kill'); for (let i = 0; i < 26; i++) SUSG.fx.push({ x: d.x, y: d.y - 20, vx: (Math.random() - 0.5) * 5, vy: -2 - Math.random() * 4, t: 50, e: Math.random() < 0.7 ? '🍿' : '💥' }); if (d.you) { SUSG.youDied = performance.now(); showToast('😵 انمسكت! صرت شبح، كمّل مهماتك وانت شبح 👻'); } }
  else if (d.t === 'sus_vfx') susVentFx(d);
  else if (d.t === 'sus_list') susRenderList(d.list);
  else if (d.t === 'sus_err') showToast('⚠️ ' + d.error);
}
function susOnState(old, s) {
  const ph = s ? s.ph : '';
  if (ph !== SUSG.lastPh) {
    if (ph === 'play' && SUSG.lastPh !== 'eject') { const me = susMe(); SUSG.roleShown = performance.now(); SUSG.pos = {}; s.players.forEach(p => { SUSG.pos[p.i] = null; }); SUSG.my = null; SUSG.fx = []; susSfx(me && me.role === 'imp' ? 'lose' : 'win'); }
    if (ph === 'meet') { susSfx('meet'); SUSG.task = null; susTaskClose(); SUSG.my = null; }
    if (ph === 'eject') SUSG.ejT = performance.now();
    if (ph === 'over') { const me = susMe(); susSfx(me && ((s.win === 'crew') === (me.role === 'crew')) ? 'win' : 'lose'); }
    if (ph === 'play' && SUSG.lastPh === 'eject') SUSG.my = null;
    SUSG.lastPh = ph;
  }
  susRender();
}
function susRender() {
  const R = susRoot(); if (!R) return; const s = SUSG.s;
  if (!s) { R.dataset.v = 'menu'; R.innerHTML = ''; R.appendChild(susMenuEl()); susSend({ t: 'sus_list' }); susLoopStart(); return; }
  if (s.ph === 'lobby' || s.ph === 'count') { R.dataset.v = 'lobby'; R.innerHTML = ''; R.appendChild(susLobbyEl(s)); susLoopStart(); return; }
  if (R.dataset.v !== 'game') { R.dataset.v = 'game'; R.innerHTML = ''; R.appendChild(susGameEl()); }
  { const G = R.querySelector('.susGame'); if (G) G.className = 'susGame ph-' + s.ph; } susHud(); susMeetUpd(); susLoopStart();
}
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
function susIcon(ch, sz, o) { const k = document.createElement('canvas'); k.width = sz * 2; k.height = sz * 2; k.style.width = sz + 'px'; k.style.height = sz + 'px'; const g = k.getContext('2d'); g.scale(2, 2); susChar(g, ch, sz / 2, sz * 0.92, 1, 10, 0, Object.assign({ s: sz / 62 }, o || {})); return k; }
function susMenuEl() {
  const w = el('div', 'susMenu');
  const hero = el('div', 'susHero'); const row = el('div', 'susHeroRow'); for (let i = 0; i < 8; i++) { const ic = susIcon(i, 46); ic.style.animationDelay = (i * 0.12) + 's'; row.appendChild(ic); } hero.append(el('h2', '', '🥔 مين الخاين؟'), row, el('p', '', 'من 3 إلى 5 لاعبين على سفينة فضاء. الطاقم يخلص المهمات ويكشف الخاين بالتصويت، والخاين يطيّرهم واحد واحد بدون ما ينكشف 😈'));
  const q = el('button', 'susBtn big', '⚡ لعب سريع'); q.onclick = () => { susSfx('click'); susSend({ t: 'sus_quick' }); };
  const cr = el('button', 'susBtn', '➕ غرفة خاصة لأصدقائي'); cr.onclick = () => { susSfx('click'); susSend({ t: 'sus_create' }); };
  const jr = el('div', 'susJoin'); const inp = el('input'); inp.placeholder = 'رمز الغرفة (4 أرقام)'; inp.maxLength = 4; inp.inputMode = 'numeric'; const jb = el('button', 'susBtn', '🔑 ادخل'); jb.onclick = () => { if (inp.value.trim().length !== 4) { showToast('اكتب رمز من 4 أرقام'); return; } susSend({ t: 'sus_join', code: inp.value.trim() }); }; jr.append(inp, jb);
  const lst = el('div', 'susList'); lst.id = 'susList'; lst.appendChild(el('small', '', '...'));
  const how = el('details', 'susHow'); how.innerHTML = '<summary>📖 شلون ألعب؟</summary><p>🥔 <b>الطاقم:</b> روح للمهمات المعلّمة بـ ❗ ودوس «استخدم». إذا خلّصتوا كل المهمات تفوزون.</p><p>😈 <b>الخاين:</b> قرّب من واحد ودوس «طيّر» حتى يصير شبح. لا تخلي أحد يكشفك!</p><p>📢 إذا لكيت واحد طايح دوس «بلّغ»، أو دوس الزر الأحمر بالكافتيريا لاجتماع طارئ. بالاجتماع تتناقشون بالشات وتصوتون مين الخاين.</p><p>🕳️ <b>الأنفاق:</b> قرّب من شبك حديد ودوس «نفق» حتى تطب بيه، محد يشوفك وإنت جوّا، اختار نفق ثاني واطلع من مكان ثاني! الخاين يستخدمها بلا انتظار، والطاقم ينتظر 12 ثانية بين نفق ونفق.</p><p>🗺️ دوس زر الخريطة حتى تشوف السفينة كلها ووين مهماتك، والأسهم الصفرة على حافة الشاشة تأشرلك على المهمات.</p><p>👻 اللي يطير يصير شبح، يكدر يكمل مهماته بس ما يحجي ولا يصوّت.</p>';
  w.append(hero, q, cr, jr, el('div', 'susSec', '🌐 غرف مفتوحة'), lst, how); return w;
}
function susRenderList(list) {
  const L = document.getElementById('susList'); if (!L) return; L.innerHTML = '';
  if (!list.length) { L.appendChild(el('small', '', 'ماكو غرف مفتوحة هسه — دوس «لعب سريع» وتنفتح غرفة جديدة')); return; }
  list.forEach(x => { const b = el('button', 'susRow', '🚀 غرفة ' + x.host + ' • ' + x.n + '/5'); b.onclick = () => susSend({ t: 'sus_quick' }); L.appendChild(b); });
}
function susLobbyEl(s) {
  const w = el('div', 'susLobby'), me = susMe();
  w.appendChild(el('h3', '', s.ph === 'count' ? '🚀 اللعبة تبدي بعد ' + Math.ceil(s.t / 1000) + '...' : '🛸 غرفة الانتظار (' + s.players.length + '/5)'));
  if (s.priv) { const cb = el('div', 'susCode'); cb.innerHTML = 'رمز الغرفة: <b>' + s.code + '</b> — دزه لأصدقائك'; w.appendChild(cb); }
  const g = el('div', 'susPlayers'); s.players.forEach(p => { const c = el('div', 'susP' + (p.me ? ' me' : '')); c.appendChild(susIcon(p.ch, 54)); c.appendChild(el('b', '', (p.host ? '👑 ' : '') + p.n)); c.appendChild(el('small', '', SUS_CH[p.ch].n)); g.appendChild(c); }); for (let i = s.players.length; i < 5; i++) { const c = el('div', 'susP empty'); c.appendChild(el('span', '', '❔')); c.appendChild(el('small', '', 'بانتظار لاعب')); g.appendChild(c); } w.appendChild(g);
  if (s.ph === 'lobby') {
    w.appendChild(el('div', 'susSec', '🎭 اختار شخصيتك'));
    const pk = el('div', 'susPick'), used = new Set(s.players.filter(p => !p.me).map(p => p.ch)); SUS_CH.forEach((C, i) => { const b = el('button', 'susCh' + (me && me.ch === i ? ' on' : '') + (used.has(i) ? ' used' : '')); b.appendChild(susIcon(i, 40)); b.appendChild(el('small', '', C.n)); b.disabled = used.has(i); b.onclick = () => { susSfx('click'); susSend({ t: 'sus_ch', ch: i }); }; pk.appendChild(b); }); w.appendChild(pk);
    if (me && me.host) { const st = el('button', 'susBtn big', s.players.length >= 3 ? '▶️ ابدأ اللعبة' : '⏳ لازم 3 لاعبين على الأقل'); st.disabled = s.players.length < 3; st.onclick = () => susSend({ t: 'sus_start' }); w.appendChild(st); }
    else w.appendChild(el('div', 'susWait', '⏳ بانتظار صاحب الغرفة يبدي اللعبة' + (s.players.length < 3 ? ' (لازم 3 لاعبين)' : '')));
  }
  const lv = el('button', 'susBtn ghost', '🚪 اطلع'); lv.onclick = () => { susSend({ t: 'sus_leave' }); SUSG.s = null; susRender(); }; w.appendChild(lv);
  return w;
}

/* ---------- شاشة اللعب ---------- */
function susJoyInit(j) {
  const knob = j.querySelector('i'); let id = null, cx = 0, cy = 0;
  const set = (x, y) => { let dx = x - cx, dy = y - cy; const d = Math.hypot(dx, dy), m = 42; if (d > m) { dx = dx / d * m; dy = dy / d * m; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; SUSG.joy = d > 6 ? [dx / m, dy / m] : null; };
  j.addEventListener('pointerdown', e => { id = e.pointerId; const r = j.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; set(e.clientX, e.clientY); try { j.setPointerCapture(id); } catch (er) {} e.preventDefault(); });
  j.addEventListener('pointermove', e => { if (e.pointerId === id) set(e.clientX, e.clientY); });
  const up = e => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; SUSG.joy = null; }; j.addEventListener('pointerup', up); j.addEventListener('pointercancel', up);
}
document.addEventListener('keydown', e => { if (curPage === 'sus' && !(e.target && e.target.tagName === 'INPUT')) { SUSG.keys[e.key.toLowerCase()] = 1; if (e.key === ' ' || e.key === 'e') susAction('use'); } });
document.addEventListener('keyup', e => { SUSG.keys[e.key.toLowerCase()] = 0; });
function susHud() {
  const s = SUSG.s, me = susMe(); if (!s || !me) return; const pb = document.getElementById('susProgB'); if (pb) pb.style.width = Math.round((s.prog || 0) * 100) + '%';
  const rl = document.getElementById('susRole'); if (rl) { rl.textContent = (me.role === 'imp' ? '😈 أنت الخاين' : '🥔 أنت من الطاقم') + (me.alive ? '' : ' • 👻 شبح'); rl.className = me.role === 'imp' ? 'imp' : 'crew'; }
  const tl = document.getElementById('susTasks'); if (tl) { tl.innerHTML = ''; if (me.role === 'imp') tl.appendChild(el('div', '', '🎭 تظاهر إنك تسوي مهمات… وطيّرهم بدون ما ينتبهون')); else (s.tasks || []).forEach(t => tl.appendChild(el('div', t.done ? 'done' : '', (t.done ? '✅ ' : '⬜ ') + SUSG.map.tasks[t.id].n))); }
  document.getElementById('susA-kill').hidden = !(me.role === 'imp' && me.alive); document.getElementById('susA-report').hidden = !me.alive;
  if (me.role === 'imp' && s.kcd !== undefined) SUSG.kcdEnd = Date.now() + (s.kcd || 0);
}
/* ---------- المهمات (ألعاب صغيرة) ---------- */
function susTaskClose() { const T = document.getElementById('susTask'); if (T) { T.hidden = true; T.innerHTML = ''; } SUSG.task = null; }
/* ---------- الاجتماع والتصويت ---------- */
function susMeetUpd() {
  const s = SUSG.s, M = document.getElementById('susMeet'); if (!M || !s) return; const me = susMe();
  if (s.ph !== 'meet' && s.ph !== 'vote') { M.hidden = true; M.innerHTML = ''; M.dataset.k = ''; return; }
  M.hidden = false; const k = s.ph + '|' + s.players.map(p => p.alive + '' + p.voted).join(',') + '|' + (s.chat || []).length;
  if (M.dataset.k === k) return; M.dataset.k = k; const keepTxt = (M.querySelector('.susCIn input') || {}).value || ''; M.innerHTML = '';
  const hd = el('div', 'susMH'); hd.innerHTML = (s.ph === 'meet' ? '💬 وقت النقاش' : '🗳️ وقت التصويت') + ' • <b id="susMT"></b>'; M.appendChild(hd);
  const g = el('div', 'susMG'); s.players.forEach(p => { if (p.left) return; const c = el('button', 'susMP' + (p.alive ? '' : ' dead') + (p.me ? ' me' : '')); c.appendChild(susIcon(p.ch, 40, p.alive ? {} : { dead: 1 })); c.appendChild(el('b', '', p.n + (p.caller ? ' 📢' : ''))); c.appendChild(el('small', '', p.alive ? (p.voted ? '✅ صوّت' : '') : '👻 طار'));
    if (s.ph === 'vote' && me && me.alive && !me.voted && p.alive && !p.me) c.onclick = () => { if (confirm('تصوّت على ' + p.n + '؟')) { susSend({ t: 'sus_vote', v: p.i }); susSfx('click'); } }; else c.disabled = !(s.ph === 'vote' && me && me.alive && !me.voted && p.alive && !p.me); g.appendChild(c); }); M.appendChild(g);
  if (s.ph === 'vote' && me && me.alive && !me.voted) { const sk = el('button', 'susBtn ghost', '⏭️ تخطي التصويت'); sk.onclick = () => susSend({ t: 'sus_vote', v: 'skip' }); M.appendChild(sk); }
  const ch = el('div', 'susChat'); (s.chat || []).forEach(m => { const r = el('div', m.sys ? 'sys' : ''); if (!m.sys) { r.appendChild(susIcon(m.ch, 22)); r.appendChild(el('b', '', m.n + ': ')); } r.appendChild(el('span', '', m.txt)); ch.appendChild(r); }); M.appendChild(ch); setTimeout(() => { ch.scrollTop = 1e6; }, 0);
  if (me && me.alive) { const ci = el('div', 'susCIn'), i = el('input'); i.maxLength = 120; i.placeholder = 'اكتب شكّك هنا... مين الخاين؟'; i.value = keepTxt; const b = el('button', '', '➤'); const go = () => { const t = i.value.trim(); if (!t) return; susSend({ t: 'sus_chat', txt: t }); i.value = ''; }; b.onclick = go; i.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); ci.append(i, b); M.appendChild(ci); if (keepTxt) setTimeout(() => i.focus(), 0); }
  else M.appendChild(el('div', 'susWait', '👻 الأشباح ما تكدر تحجي أو تصوّت'));
}

/* ---------- الحلقة والرسم ---------- */
function susLoopStart() { if (!SUSG.raf) SUSG.raf = requestAnimationFrame(susLoop); }
function susLoop() {
  SUSG.raf = 0; if (curPage !== 'sus') return; SUSG.t++; const s = SUSG.s;
  try { if (s && s.ph !== 'lobby' && s.ph !== 'count') susTick(); else if (s && s.ph === 'count') { const R = susRoot(); const h = R && R.querySelector('h3'); if (h) { s.t = Math.max(0, s.t - 16.7); h.textContent = '🚀 اللعبة تبدي بعد ' + Math.ceil(s.t / 1000) + '...'; } } } catch (e) { console.error(e); }
  SUSG.raf = requestAnimationFrame(susLoop);
}
function susTick() {
  const s = SUSG.s, me = susMe(), M = SUSG.map, cv = document.getElementById('susCv'); if (!cv || !me) return; const t = SUSG.t;
  const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1); if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  // حركتي
  if (!SUSG.my) { const sp = s.pos || M.spawn; SUSG.my = { x: sp[0], y: sp[1], dir: 1 }; }
  const m = SUSG.my; let mx = 0, my = 0; const K = SUSG.keys; if (SUSG.joy) { mx = SUSG.joy[0]; my = SUSG.joy[1]; } mx += (K.arrowright || K.d ? 1 : 0) - (K.arrowleft || K.a ? 1 : 0); my += (K.arrowdown || K.s ? 1 : 0) - (K.arrowup || K.w ? 1 : 0);
  const inVent = s.ph === 'play' && s.vent >= 0 && M.vents[s.vent]; if (inVent) { m.x = inVent.x; m.y = inVent.y; }
  const canMove = s.ph === 'play' && !SUSG.task && !inVent && !SUSG.mapOpen && performance.now() - (SUSG.roleShown || 0) > 2600; let mv = false;
  if (canMove && (mx || my)) { const L = Math.hypot(mx, my), sp = 4.2 * Math.min(1, L); const vx = mx / L * sp, vy = my / L * sp; const ghost = !me.alive;
    if (ghost || susOk(m.x + vx, m.y)) m.x += vx; if (ghost || susOk(m.x, m.y + vy)) m.y += vy; m.x = Math.max(10, Math.min(M.w - 10, m.x)); m.y = Math.max(10, Math.min(M.h - 10, m.y)); if (Math.abs(vx) > 0.2) m.dir = vx > 0 ? 1 : -1; mv = true; }
  m.mv = mv; const nowP = performance.now(); if (s.ph === 'play' && !inVent && nowP - SUSG.lastSend > 90 && (mv || SUSG.wasMv)) { susSend({ t: 'sus_pos', x: Math.round(m.x), y: Math.round(m.y), dir: m.dir, mv: mv ? 1 : 0 }); SUSG.lastSend = nowP; SUSG.wasMv = mv; }
  Object.keys(SUSG.pos).forEach(k => { const o = SUSG.pos[k]; if (!o || o.tx === undefined) return; o.x += (o.tx - o.x) * 0.3; o.y += (o.ty - o.y) * 0.3; });
  // الكاميرا
  const Z = Math.max(0.85, Math.min(1.7, Math.min(W / 400, H / 560))) /* تقريب مريح للموبايل */; SUSG.cam[0] += (m.x - SUSG.cam[0]) * 0.2; SUSG.cam[1] += (m.y - SUSG.cam[1]) * 0.2;
  c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H); c.save(); c.translate(W / 2, H / 2); c.scale(Z, Z); c.translate(-SUSG.cam[0], -SUSG.cam[1]);
  susDrawWorld(c, t, me, m, Z, W, H); susDrawLive(c, t, me, m, inVent);
  // الأجساد والشخصيات
  const draw = []; (s.bodies || []).forEach(b => draw.push([b.y - 5, () => susBodyDraw(c, b, t)]));
  s.players.forEach(p => { if (p.left) return; let q = SUSG.pos[p.i]; if (p.me) { if (inVent) return; q = { x: m.x, y: m.y, dir: m.dir, mv: m.mv, alive: me.alive ? 1 : 0 }; } if (!q) return; if (!p.me && performance.now() - (q.seen || 0) > 700) return; const ghost = !p.alive && !(s.bodies || []).some(b => b.i === p.i && false); if (!p.alive && me.alive) return;
    draw.push([q.y, () => { susChar(c, p.ch, q.x, q.y, q.dir || 1, t + p.i * 7, q.mv, { ghost: !p.alive, imp: p.role === 'imp' && me.role === 'imp' }); c.save(); c.font = 'bold 13px Cairo, system-ui'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; const tagY = q.y - 66 + (!p.alive ? -8 : 0); c.strokeText(p.n, q.x, tagY); c.fillStyle = p.role === 'imp' && me.role === 'imp' ? '#ff6a6a' : '#fff'; c.fillText(p.n, q.x, tagY); c.restore(); }]); });
  draw.sort((a, b) => a[0] - b[0]).forEach(d => d[1]());
  SUSG.fx = SUSG.fx.filter(f => f.t-- > 0); SUSG.fx.forEach(f => { f.x += f.vx; f.y += f.vy; f.vy += 0.15; c.globalAlpha = Math.min(1, f.t / 20); c.font = '18px system-ui'; c.textAlign = 'center'; c.fillText(f.e, f.x, f.y); }); c.globalAlpha = 1;
  c.restore();
  // الضباب (الرؤية حول اللاعب بس)
  if (me.alive) { const R = (me.role === 'imp' ? 300 : 230) * Z, sx = W / 2 + (m.x - SUSG.cam[0]) * Z, sy = H / 2 + (m.y - SUSG.cam[1]) * Z, g = c.createRadialGradient(sx, sy, R * 0.55, sx, sy, R); g.addColorStop(0, 'rgba(3,4,12,0)'); g.addColorStop(1, 'rgba(3,4,12,.94)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  // إعلانات الدور، الإقصاء، النهاية
  const rs = performance.now() - (SUSG.roleShown || 0); if (s.ph === 'play' && rs < 2600) { c.fillStyle = 'rgba(0,0,0,' + Math.min(0.85, (2600 - rs) / 600) + ')'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.font = 'bold 30px Cairo, system-ui'; c.fillStyle = me.role === 'imp' ? '#ff4a5a' : '#7dffa8'; c.fillText(me.role === 'imp' ? '😈 أنت الخاين!' : '🥔 أنت من الطاقم', W / 2, H / 2 - 40); c.font = '15px Cairo, system-ui'; c.fillStyle = '#fff'; c.fillText(me.role === 'imp' ? 'طيّرهم بدون ما ينكشف أمرك' : 'خلّص مهماتك واكشف الخاين', W / 2, H / 2); c.save(); c.translate(W / 2, H / 2 + 110); susChar(c, me.ch, 0, 0, 1, t, 0, { s: 1.6, imp: me.role === 'imp' }); c.restore(); }
  if (s.ph === 'eject' && s.result) { const e = (performance.now() - SUSG.ejT) / 1000; c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; for (let i = 0; i < 120; i++) { c.fillRect((i * 97 + e * 120 * (1 + i % 3)) % W, (i * 53) % H, 2, 2); } c.textAlign = 'center';
    if (!s.result.none) { c.save(); c.translate(-80 + e * W / 4.5, H / 2 - 20); c.rotate(e * 2.2); susChar(c, s.result.ch, 0, 20, 1, t, 0, { s: 1.4 }); c.restore(); }
    if (e > 1.4) { c.font = 'bold 22px Cairo, system-ui'; c.fillStyle = '#fff'; c.fillText(s.result.none ? (s.result.tie ? '🤷 تعادل بالتصويت… محد طلع' : '⏭️ محد طلع من السفينة') : (s.result.n + (s.result.imp ? ' جان هو الخاين 😈' : ' ما جان الخاين 😇')), W / 2, H / 2 + 80); } }
  if (s.ph === 'over') { c.fillStyle = 'rgba(5,6,15,.92)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.font = 'bold 30px Cairo, system-ui'; const iw = (s.win === 'crew') === (me.role === 'crew'); c.fillStyle = s.win === 'crew' ? '#7dffa8' : '#ff4a5a'; c.fillText(s.win === 'crew' ? '🎉 الطاقم فاز!' : '😈 الخاين فاز!', W / 2, 90); c.font = '16px Cairo, system-ui'; c.fillStyle = '#fff'; c.fillText(iw ? 'مبروك! فزت وأخذت عملات 🪙' : 'حظ أوفر المرة الجاية', W / 2, 122);
    const ps = s.players.filter(p => !p.left), gap = Math.min(110, (W - 40) / ps.length); ps.forEach((p, k) => { const x = W / 2 + (k - (ps.length - 1) / 2) * gap; susChar(c, p.ch, x, H / 2 + 40, 1, t, 0, { s: 1.1, imp: p.role === 'imp' }); c.font = 'bold 13px Cairo, system-ui'; c.fillStyle = p.role === 'imp' ? '#ff6a6a' : '#fff'; c.fillText(p.n, x, H / 2 + 66); c.font = '12px Cairo, system-ui'; c.fillText(p.role === 'imp' ? '😈 الخاين' : '🥔 طاقم', x, H / 2 + 84); });
    c.font = '13px Cairo, system-ui'; c.fillStyle = '#aab'; c.fillText('ترجعون لغرفة الانتظار بعد ' + Math.ceil(Math.max(0, s.t - 0) / 1000) + ' ثواني', W / 2, H - 40); s.t = Math.max(0, s.t - 16.7); }
  if (s.ph === 'meet' || s.ph === 'vote') { const e = document.getElementById('susMT'); if (e) { s.t = Math.max(0, s.t - 16.7); e.textContent = Math.ceil(s.t / 1000) + ' ثانية'; } }
  susOverlay(c, t, me, m, Z, W, H, inVent);
  if (t % 6 === 0) susActUpd();
}

/* ===================== v5: خريطة احترافية + أنفاق 🕳️ + ألعاب مهمات جديدة + خريطة صغيرة 🗺️ ===================== */
const SUS_PAD = 120;
const SUS_FLOOR = {
  engine: ['#4b505e', '#424654'], reactor: ['#3a4a62', '#33425a'], med: ['#a9ddd6', '#93cfc7'], elec: ['#58526e', '#4d4862'], caf: ['#8290ad', '#76839f'], lab: ['#d3dde4', '#c2ced7'],
  store: ['#8f7a55', '#7f6b48'], kitchen: ['#e3dccd', '#c9bfa9'], o2: ['#5f8d6c', '#557f61'], bridge: ['#2f4560', '#283c55'], comms: ['#4c5a74', '#435068']
};
function susRR(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function susMapCache() {
  const M = SUSG.map; if (SUSG.mapCv && SUSG.mapCv._v === M.v) return SUSG.mapCv;
  const P = SUS_PAD, cv = document.createElement('canvas'); cv.width = M.w + P * 2; cv.height = M.h + P * 2; cv._v = M.v; const c = cv.getContext('2d'); c.translate(P, P);
  let sd = 11; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  /* هيكل السفينة: جدار خارجي سميك */
  c.fillStyle = '#141826'; M.walk.forEach(r => { susRR(c, r[0] - 26, r[1] - 52, r[2] + 52, r[3] + 74, 18); c.fill(); });
  c.fillStyle = '#22283a'; M.walk.forEach(r => { susRR(c, r[0] - 16, r[1] - 42, r[2] + 32, r[3] + 58, 12); c.fill(); });
  /* واجهة الجدار (ثلاثي الأبعاد) فوك كل أرضية */
  M.walk.forEach(r => { const g = c.createLinearGradient(0, r[1] - 40, 0, r[1]); g.addColorStop(0, '#7a84a3'); g.addColorStop(0.7, '#5b6482'); g.addColorStop(1, '#3c435c'); c.fillStyle = g; c.fillRect(r[0] - 4, r[1] - 40, r[2] + 8, 40);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; for (let x = r[0] + 30; x < r[0] + r[2]; x += 60) { c.beginPath(); c.moveTo(x, r[1] - 38); c.lineTo(x, r[1] - 2); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(r[0] - 4, r[1] - 40, r[2] + 8, 2); });
  /* الممرات */
  M.cor.forEach(r => { const g = c.createLinearGradient(r[0], r[1], r[0] + (r[2] > r[3] ? 0 : r[2]), r[1] + (r[2] > r[3] ? r[3] : 0)); g.addColorStop(0, '#5a6176'); g.addColorStop(0.5, '#6b7389'); g.addColorStop(1, '#5a6176'); c.fillStyle = g; c.fillRect(r[0], r[1], r[2], r[3]);
    c.fillStyle = 'rgba(0,0,0,.18)'; if (r[2] > r[3]) for (let x = r[0]; x < r[0] + r[2]; x += 24) c.fillRect(x, r[1], 2, r[3]); else for (let y = r[1]; y < r[1] + r[3]; y += 24) c.fillRect(r[0], y, r[2], 2);
    c.fillStyle = 'rgba(255,214,102,.35)'; if (r[2] > r[3]) for (let x = r[0] + 10; x < r[0] + r[2] - 10; x += 34) c.fillRect(x, r[1] + r[3] / 2 - 2, 16, 4); else for (let y = r[1] + 10; y < r[1] + r[3] - 10; y += 34) c.fillRect(r[0] + r[2] / 2 - 2, y, 4, 16); });
  /* الغرف: أرضية لكل غرفة بنقشة خاصة */
  M.rooms.forEach(Rm => { const r = Rm.r, F = SUS_FLOOR[Rm.k] || ['#6b7389', '#5f667b'], [x, y, w, h] = r; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    const T = Rm.k === 'store' ? 0 : Rm.k === 'kitchen' || Rm.k === 'med' ? 40 : Rm.k === 'caf' || Rm.k === 'lab' ? 60 : 48;
    if (Rm.k === 'store') { for (let yy = y; yy < y + h; yy += 22) { c.fillStyle = (yy / 22 | 0) % 2 ? F[0] : F[1]; c.fillRect(x, yy, w, 22); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, yy + 20, w, 2); for (let xx = x + ((yy / 22 | 0) % 2) * 70; xx < x + w; xx += 140) c.fillRect(xx, yy, 2, 22); } }
    else for (let yy = y; yy < y + h; yy += T) for (let xx = x; xx < x + w; xx += T) { c.fillStyle = ((xx - x) / T + (yy - y) / T) % 2 ? F[1] : F[0]; c.fillRect(xx, yy, T, T); c.strokeStyle = 'rgba(0,0,0,.12)'; c.strokeRect(xx + 0.5, yy + 0.5, T - 1, T - 1);
      if (Rm.k === 'engine' || Rm.k === 'elec') { c.fillStyle = 'rgba(255,255,255,.06)'; for (let k = 0; k < 4; k++) c.fillRect(xx + 6 + k * 10, yy + 6 + (k % 2) * 14, 6, 3); } }
    if (Rm.k === 'elec') { for (let xx = x - 20; xx < x + w; xx += 24) { c.fillStyle = '#f2c230'; c.beginPath(); c.moveTo(xx, y + h); c.lineTo(xx + 12, y + h); c.lineTo(xx + 24, y + h - 12); c.lineTo(xx + 12, y + h - 12); c.fill(); } }
    if (Rm.k === 'bridge') { c.strokeStyle = 'rgba(120,200,255,.12)'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(x + w * 0.55, y + h * 0.55, 30 + k * 26, 0, 7); c.stroke(); } }
    /* ظل الجدار على الأرض + إضاءة ناعمة */
    const sg = c.createLinearGradient(0, y, 0, y + 30); sg.addColorStop(0, 'rgba(0,0,0,.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sg; c.fillRect(x, y, w, 30);
    const lg = c.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); lg.addColorStop(0, 'rgba(255,255,255,.08)'); lg.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = lg; c.fillRect(x, y, w, h);
    c.restore();
    susDecor(c, Rm, R);
    c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '900 17px Cairo, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; const lbw = c.measureText(Rm.n).width + 22; c.fillStyle = 'rgba(10,14,30,.55)'; susRR(c, x + w / 2 - lbw / 2, y - 32, lbw, 24, 12); c.fill(); c.fillStyle = '#e8eeff'; c.fillText(Rm.n, x + w / 2, y - 20);
  });
  /* أطر الأبواب بين الممر والغرفة */
  M.cor.forEach(r => { c.fillStyle = '#2b3146'; if (r[2] > r[3]) { c.fillRect(r[0] - 3, r[1] - 6, 6, r[3] + 12); c.fillRect(r[0] + r[2] - 3, r[1] - 6, 6, r[3] + 12); } else { c.fillRect(r[0] - 6, r[1] - 3, r[2] + 12, 6); c.fillRect(r[0] - 6, r[1] + r[3] - 3, r[2] + 12, 6); } });
  /* الأنفاق: شبك حديد */
  (M.vents || []).forEach(v => { c.save(); c.translate(v.x, v.y); c.fillStyle = '#1a1d29'; susRR(c, -24, -14, 48, 28, 6); c.fill(); c.strokeStyle = '#8890a8'; c.lineWidth = 3; susRR(c, -24, -14, 48, 28, 6); c.stroke(); c.strokeStyle = '#5d6378'; c.lineWidth = 3; for (let k = -16; k <= 16; k += 8) { c.beginPath(); c.moveTo(k, -10); c.lineTo(k, 10); c.stroke(); } c.fillStyle = '#9aa2bb'; [[-20, -10], [20, -10], [-20, 10], [20, 10]].forEach(q => { c.beginPath(); c.arc(q[0], q[1], 2, 0, 7); c.fill(); }); c.restore(); });
  SUSG.mapCv = cv; return cv;
}
function susDecor(c, Rm, R) {
  const [x, y, w, h] = Rm.r, M = SUSG.map, k = Rm.k;
  const box = (bx, by, bw, bh, col, top) => { c.fillStyle = 'rgba(0,0,0,.28)'; susRR(c, bx + 3, by + 6, bw, bh, 5); c.fill(); c.fillStyle = col; susRR(c, bx, by, bw, bh, 5); c.fill(); if (top) { c.fillStyle = top; susRR(c, bx, by, bw, Math.min(10, bh / 3), 5); c.fill(); } c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; susRR(c, bx, by, bw, bh, 5); c.stroke(); };
  const screen = (sx, sy, sw, sh, col) => { c.fillStyle = '#10141f'; susRR(c, sx, sy, sw, sh, 3); c.fill(); c.fillStyle = col; c.globalAlpha = 0.85; c.fillRect(sx + 3, sy + 3, sw - 6, sh - 6); c.globalAlpha = 1; c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 3; i++) c.fillRect(sx + 6, sy + 6 + i * 5, (sw - 12) * (0.4 + R() * 0.6), 2); };
  if (k === 'caf') { [[x + 90, y + 100], [x + w - 90, y + 100], [x + 90, y + h - 80], [x + w - 90, y + h - 80]].forEach(([tx, ty]) => { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(tx + 4, ty + 8, 46, 26, 0, 0, 7); c.fill(); c.fillStyle = '#c9d2e6'; c.beginPath(); c.ellipse(tx, ty, 44, 24, 0, 0, 7); c.fill(); c.fillStyle = '#e6ecf8'; c.beginPath(); c.ellipse(tx, ty - 3, 40, 20, 0, 0, 7); c.fill(); [[-54, 0], [54, 0], [0, -34], [0, 34]].forEach(q => { c.fillStyle = '#4a5570'; susRR(c, tx + q[0] - 9, ty + q[1] - 6, 18, 12, 4); c.fill(); }); }); box(x + w - 46, y + 8, 36, 64, '#b83a4a', '#ff6a7a'); screen(x + w - 40, y + 16, 24, 18, '#7ad7ff'); }
  if (k === 'engine') { const ex = x + 20, ey = y + h / 2 - 50; const g = c.createLinearGradient(0, ey, 0, ey + 100); g.addColorStop(0, '#9aa3b8'); g.addColorStop(0.5, '#e1e6f0'); g.addColorStop(1, '#6e778c'); c.fillStyle = g; susRR(c, ex, ey, 150, 100, 40); c.fill(); c.strokeStyle = '#3a4054'; c.lineWidth = 3; c.stroke(); for (let i = 0; i < 4; i++) { c.fillStyle = '#5a6278'; c.fillRect(ex + 30 + i * 28, ey + 6, 6, 88); } c.fillStyle = '#ff9a3a'; c.beginPath(); c.ellipse(ex + 160, ey + 50, 14, 34, 0, 0, 7); c.fill(); c.strokeStyle = '#6a7088'; c.lineWidth = 8; c.beginPath(); c.moveTo(ex + 75, ey); c.lineTo(ex + 75, y + 4); c.stroke(); }
  if (k === 'reactor') { c.strokeStyle = '#2a3348'; c.lineWidth = 10; [[x + 40, y + 20, x + w / 2, y + h / 2], [x + w - 30, y + 30, x + w / 2, y + h / 2], [x + 40, y + h - 20, x + w / 2, y + h / 2]].forEach(q => { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.stroke(); }); c.fillStyle = '#2d3550'; c.beginPath(); c.arc(x + w / 2 + 30, y + h / 2 + 10, 62, 0, 7); c.fill(); c.strokeStyle = '#8f9ab8'; c.lineWidth = 4; c.stroke(); }
  if (k === 'med') { [[x + w - 90, y + 40], [x + w - 90, y + 120]].forEach(([bx, by]) => { box(bx, by, 76, 40, '#f4f7fb', '#9ee3ff'); c.fillStyle = '#ffffff'; susRR(c, bx + 4, by + 4, 20, 32, 6); c.fill(); }); c.fillStyle = '#ff4d5a'; c.fillRect(x + 20, y + h - 46, 26, 8); c.fillRect(x + 29, y + h - 55, 8, 26); }
  if (k === 'elec') { for (let i = 0; i < 4; i++) { box(x + 20 + i * 66, y + 6, 54, 40, '#6b6f86', '#8a8fa8'); for (let j = 0; j < 3; j++) { c.fillStyle = ['#ff4d5a', '#4ade80', '#ffd23a'][(i + j) % 3]; c.fillRect(x + 28 + i * 66 + j * 14, y + 22, 8, 14); } } c.strokeStyle = '#1e1e28'; c.lineWidth = 4; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + 40 + i * 70, y + 46); c.bezierCurveTo(x + 60 + i * 70, y + 120, x + 140 + i * 40, y + 90, x + 160 + i * 40, y + 160); c.stroke(); } }
  if (k === 'lab') { box(x + 40, y + h - 70, w - 80, 34, '#e9eef3', '#ffffff'); for (let i = 0; i < 6; i++) { const fx = x + 70 + i * 48, fy = y + h - 80; c.fillStyle = ['#7ad7ff', '#ff7ab8', '#a3ff7a', '#ffd23a'][i % 4]; c.beginPath(); c.moveTo(fx - 7, fy); c.lineTo(fx + 7, fy); c.lineTo(fx + 12, fy + 22); c.lineTo(fx - 12, fy + 22); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(fx - 3, fy - 10, 6, 10); } c.fillStyle = 'rgba(120,220,255,.35)'; susRR(c, x + w / 2 - 22, y + 50, 44, 90, 20); c.fill(); c.strokeStyle = '#9fb3c8'; c.lineWidth = 3; c.stroke(); }
  if (k === 'store') { [[x + 30, y + 30], [x + 80, y + 30], [x + 30, y + 80], [x + w - 120, y + h - 110], [x + w - 70, y + h - 110], [x + w - 95, y + h - 160], [x + 60, y + h - 80]].forEach(([bx, by]) => { box(bx, by, 46, 46, '#b98a4c', '#d6a868'); c.strokeStyle = 'rgba(80,50,20,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx + 4, by + 4); c.lineTo(bx + 42, by + 42); c.moveTo(bx + 42, by + 4); c.lineTo(bx + 4, by + 42); c.stroke(); }); [[x + w - 60, y + 50], [x + w - 100, y + 50]].forEach(([bx, by]) => { c.fillStyle = '#4a6a8a'; c.beginPath(); c.ellipse(bx, by, 16, 16, 0, 0, 7); c.fill(); c.strokeStyle = '#2a3a4a'; c.lineWidth = 3; c.stroke(); }); }
  if (k === 'kitchen') { box(x + 20, y + 6, w - 40, 44, '#9aa3b4', '#c4cbd8'); [[x + 70, y + 22], [x + 130, y + 22]].forEach(([sx, sy]) => { c.fillStyle = '#222'; c.beginPath(); c.arc(sx, sy, 14, 0, 7); c.fill(); c.strokeStyle = '#ff6a3a'; c.lineWidth = 2; c.beginPath(); c.arc(sx, sy, 9, 0, 7); c.stroke(); }); box(x + w - 70, y + 60, 54, 90, '#e8edf4', '#ffffff'); c.fillStyle = '#9aa3b4'; c.fillRect(x + w - 64, y + 100, 4, 22); box(x + 40, y + h - 70, 110, 44, '#a0703c', '#c08850'); }
  if (k === 'o2') { [[x + 30, y + h - 40], [x + w - 40, y + h - 40], [x + 30, y + 60]].forEach(([px, py]) => { c.fillStyle = '#8a5a3a'; susRR(c, px - 14, py - 6, 28, 24, 5); c.fill(); c.fillStyle = '#3fae5a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(px + Math.cos(i) * 10, py - 14 + Math.sin(i * 2) * 6, 8, 14, i, 0, 7); c.fill(); } }); [[x + w - 60, y + 50], [x + w - 30, y + 50]].forEach(([tx, ty]) => { const g = c.createLinearGradient(tx - 12, 0, tx + 12, 0); g.addColorStop(0, '#4a90c0'); g.addColorStop(0.5, '#a8dcff'); g.addColorStop(1, '#3a70a0'); c.fillStyle = g; susRR(c, tx - 12, ty - 30, 24, 70, 12); c.fill(); }); }
  if (k === 'bridge') { c.fillStyle = '#0a0f22'; susRR(c, x + w - 18, y + 20, 14, h - 40, 6); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 14; i++) c.fillRect(x + w - 15 + R() * 8, y + 26 + R() * (h - 52), 2, 2); c.strokeStyle = '#3a4a66'; c.lineWidth = 26; c.beginPath(); c.arc(x + w * 0.55, y + h * 0.5, 96, -1.1, 1.1); c.stroke(); for (let i = -2; i <= 2; i++) { const a = i * 0.45; screen(x + w * 0.55 + Math.cos(a) * 96 - 12, y + h * 0.5 + Math.sin(a) * 96 - 9, 24, 18, ['#7ad7ff', '#a3ff7a', '#ffd23a'][(i + 3) % 3]); } box(x + 40, y + h / 2 - 20, 40, 40, '#4a5a7a', '#6a7a9a'); }
  if (k === 'comms') { for (let i = 0; i < 3; i++) { box(x + w - 60, y + 20 + i * 62, 44, 54, '#2e3446', '#454c64'); for (let j = 0; j < 4; j++) { c.fillStyle = j % 2 ? '#4ade80' : '#ffd23a'; c.fillRect(x + w - 52, y + 30 + i * 62 + j * 11, 6, 4); } } c.fillStyle = '#c9d2e6'; c.beginPath(); c.ellipse(x + 70, y + h - 60, 40, 22, -0.4, 0, Math.PI); c.fill(); c.strokeStyle = '#8a94b0'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 70, y + h - 60); c.lineTo(x + 92, y + h - 98); c.stroke(); }
  /* طاولة الطوارئ بالكافتيريا */
  if (k === 'caf') { const b = M.button; c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(b[0] + 4, b[1] + 10, 70, 38, 0, 0, 7); c.fill(); c.fillStyle = '#9aa0b8'; c.beginPath(); c.ellipse(b[0], b[1] + 4, 68, 36, 0, 0, 7); c.fill(); c.fillStyle = '#c9cfe2'; c.beginPath(); c.ellipse(b[0], b[1], 64, 32, 0, 0, 7); c.fill(); }
}
/* المهمة اللي جوه كل غرفة: شكل الجهاز حسب نوعها */
const SUS_TK_IC = { wires: '🔌', fuel: '⛽', align: '⚙️', simon: '☢️', scan: '🩺', calib: '⚡', trash: '🗑️', code: '🔢', cook: '🍳', leaves: '🍃', nav: '🧭', asteroids: '☄️', download: '📡', boxes: '📦' };
function susDrawWorld(c, t, me, m, Z, W, H) {
  const M = SUSG.map;
  /* نجوم الفضاء بثلاث طبقات (حركة parallax) */
  c.save(); for (let L = 0; L < 3; L++) { const f = 0.3 + L * 0.3; c.fillStyle = L === 2 ? '#fff' : L ? '#c8d4ff' : '#7f8bc0'; for (let i = 0; i < 90; i++) { const x = ((i * 197 + L * 71) % 2600) - 300 + SUSG.cam[0] * (1 - f), y = ((i * 131 + L * 53) % 1700) - 220 + SUSG.cam[1] * (1 - f); c.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t / 40 + i + L)); c.fillRect(x, y, L + 1, L + 1); } } c.globalAlpha = 1; c.restore();
  c.drawImage(susMapCache(), -SUS_PAD, -SUS_PAD);
}
function susDrawLive(c, t, me, m, inVent) {
  const M = SUSG.map, s = SUSG.s;
  /* مفاعل يلمع + شاشات تومض */
  M.rooms.forEach(Rm => { const [x, y, w, h] = Rm.r; if (Rm.k === 'reactor') { const cx = x + w / 2 + 30, cy = y + h / 2 + 10, p = 0.5 + 0.5 * Math.sin(t / 12); const g = c.createRadialGradient(cx, cy, 4, cx, cy, 60); g.addColorStop(0, 'rgba(160,255,240,' + (0.9) + ')'); g.addColorStop(0.5, 'rgba(60,200,255,' + (0.35 + p * 0.3) + ')'); g.addColorStop(1, 'rgba(60,200,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 60, 0, 7); c.fill(); c.strokeStyle = 'rgba(160,255,240,.7)'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(cx, cy, 22 + k * 12, t / 20 + k, t / 20 + k + 2); c.stroke(); } }
    if (Rm.k === 'engine') { const fx = x + 180, fy = y + h / 2; c.fillStyle = 'rgba(255,' + (140 + 60 * Math.sin(t / 3)) + ',40,.75)'; c.beginPath(); c.ellipse(fx + 6 + Math.sin(t / 2) * 3, fy, 12 + Math.sin(t / 2.5) * 4, 26, 0, 0, 7); c.fill(); }
    if (Rm.k === 'lab') { c.fillStyle = 'rgba(150,240,255,' + (0.25 + 0.2 * Math.sin(t / 15)) + ')'; for (let i = 0; i < 4; i++) { const by = y + 130 - ((t * 0.8 + i * 22) % 80); c.beginPath(); c.arc(x + w / 2 - 8 + i * 5, by, 3, 0, 7); c.fill(); } } });
  /* زر الطوارئ (حي) */
  { const b = M.button, p = Math.sin(t / 10); c.fillStyle = '#8a0f18'; c.beginPath(); c.ellipse(b[0], b[1] - 4, 18, 11, 0, 0, 7); c.fill(); c.fillStyle = me.em ? '#7a5a5a' : '#ff3b4a'; c.beginPath(); c.ellipse(b[0], b[1] - 8 - Math.max(0, p) * 1.5, 15, 9, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(b[0] - 5, b[1] - 11, 5, 2.5, 0, 0, 7); c.fill(); if (!me.em && me.alive) { c.strokeStyle = 'rgba(255,60,80,' + (0.3 + 0.3 * p) + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(b[0], b[1], 74 + p * 4, 40 + p * 2, 0, 0, 7); c.stroke(); } }
  /* أجهزة المهمات */
  M.tasks.forEach((T, id) => { const mine = me.role === 'crew' && (s.tasks || []).some(q => q.id === id && !q.done), done = me.role === 'crew' && (s.tasks || []).some(q => q.id === id && q.done);
    c.fillStyle = 'rgba(0,0,0,.3)'; susRR(c, T.x - 22, T.y - 30, 48, 40, 6); c.fill(); c.fillStyle = '#2a3046'; susRR(c, T.x - 24, T.y - 36, 48, 40, 6); c.fill(); c.strokeStyle = mine ? '#ffd23a' : '#5a6380'; c.lineWidth = mine ? 3 : 2; susRR(c, T.x - 24, T.y - 36, 48, 40, 6); c.stroke();
    c.fillStyle = done ? '#2ecc71' : mine ? 'rgba(255,210,58,' + (0.55 + 0.35 * Math.sin(t / 6)) + ')' : '#46506c'; susRR(c, T.x - 18, T.y - 31, 36, 22, 4); c.fill();
    c.font = '15px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(SUS_TK_IC[T.k] || '🛠️', T.x, T.y - 20);
    if (mine) { c.save(); c.shadowColor = '#ffd23a'; c.shadowBlur = 14; c.font = 'bold 22px system-ui'; c.fillText('❗', T.x, T.y - 52 + Math.sin(t / 8) * 4); c.restore(); } });
  /* الأنفاق: تلمع إذا إنت قريب */
  const nv = SUSG.near && SUSG.near.vent;
  (M.vents || []).forEach((v, i) => { if (i === nv && !inVent) { c.strokeStyle = 'rgba(120,255,200,' + (0.5 + 0.4 * Math.sin(t / 5)) + ')'; c.lineWidth = 4; susRR(c, v.x - 28, v.y - 18, 56, 36, 8); c.stroke(); }
    if (inVent && i === s.vent) { c.fillStyle = '#fff'; [-7, 7].forEach(dx => { c.beginPath(); c.ellipse(v.x + dx, v.y - 1, 4, 5, 0, 0, 7); c.fill(); }); c.fillStyle = '#111'; [-7, 7].forEach(dx => { c.beginPath(); c.arc(v.x + dx + Math.sin(t / 20) * 1.5, v.y, 2, 0, 7); c.fill(); }); } });
  /* دخان الأنفاق */
  SUSG.vfx = (SUSG.vfx || []).filter(f => f.l-- > 0); SUSG.vfx.forEach(f => { f.x += f.vx; f.y += f.vy; f.r += 0.5; c.fillStyle = 'rgba(200,210,230,' + (f.l / 50 * 0.5) + ')'; c.beginPath(); c.arc(f.x, f.y, f.r, 0, 7); c.fill(); });
}
function susVentFx(d) {
  for (let i = 0; i < 18; i++) (SUSG.vfx = SUSG.vfx || []).push({ x: d.x + (Math.random() - 0.5) * 30, y: d.y, vx: (Math.random() - 0.5) * 1.6, vy: -0.6 - Math.random() * 1.4, r: 4 + Math.random() * 5, l: 50 });
  try { const me = susMe(), m = SUSG.my; if (d.me || !m || Math.hypot(d.x - m.x, d.y - m.y) < 420) { blip('square', 180, 90, 0.12, 0.06); blip('sawtooth', 120, 60, 0.18, 0.05, 0.06); burst(0.15, 0.08, 0, 1400); } } catch (e) {}
}
/* أسهم على حافة الشاشة تأشر لمهماتك + اسم الغرفة اللي داخلها */
function susOverlay(c, t, me, m, Z, W, H, inVent) {
  const s = SUSG.s, M = SUSG.map; if (s.ph !== 'play' || !me) return;
  if (me.role === 'crew') (s.tasks || []).forEach(q => { if (q.done) return; const T = M.tasks[q.id], sx = W / 2 + (T.x - SUSG.cam[0]) * Z, sy = H / 2 + (T.y - 30 - SUSG.cam[1]) * Z; if (sx > 20 && sx < W - 20 && sy > 70 && sy < H - 20) return;
    const a = Math.atan2(sy - H / 2, sx - W / 2), rx = W / 2 - 34, ry = H / 2 - 60, k = Math.min(rx / Math.abs(Math.cos(a) || 1e-3), ry / Math.abs(Math.sin(a) || 1e-3)), px = W / 2 + Math.cos(a) * k, py = H / 2 + Math.sin(a) * k;
    c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = 'rgba(255,210,58,.9)'; c.beginPath(); c.moveTo(14, 0); c.lineTo(-8, -10); c.lineTo(-4, 0); c.lineTo(-8, 10); c.closePath(); c.fill(); c.restore(); c.font = '13px system-ui'; c.textAlign = 'center'; c.fillText(SUS_TK_IC[T.k] || '❗', px - Math.cos(a) * 20, py - Math.sin(a) * 20); });
  const room = M.rooms.find(R => m.x >= R.r[0] && m.x <= R.r[0] + R.r[2] && m.y >= R.r[1] && m.y <= R.r[1] + R.r[3]);
  const nm = room ? room.n : 'ممر'; if (nm !== SUSG.roomNm) { SUSG.roomNm = nm; SUSG.roomT = performance.now(); }
  const age = performance.now() - (SUSG.roomT || 0); if (age < 1800 && room) { const al = age < 200 ? age / 200 : age > 1400 ? (1800 - age) / 400 : 1; c.save(); c.globalAlpha = al; c.font = '900 20px Cairo, system-ui'; c.textAlign = 'center'; const tw = c.measureText(nm).width + 40; c.fillStyle = 'rgba(10,14,30,.75)'; susRR(c, W / 2 - tw / 2, 84, tw, 36, 18); c.fill(); c.fillStyle = '#fff'; c.fillText('📍 ' + nm, W / 2, 108); c.restore(); }
}
/* ---------- شاشة اللعب (أزرار + جويستك بالوسط + خريطة صغيرة + نفق) ---------- */
function susGameEl() {
  const w = el('div', 'susGame'); const cv = el('canvas'); cv.id = 'susCv'; w.appendChild(cv);
  const top = el('div', 'susTop'); top.innerHTML = '<div class="susProg"><i id="susProgB"></i><span>🛠️ مهمات الطاقم</span></div><div id="susRole"></div>'; w.appendChild(top);
  const tl = el('div', 'susTasks'); tl.id = 'susTasks'; w.appendChild(tl);
  const joy = el('div', 'susJoy'); joy.innerHTML = '<i></i>'; joy.id = 'susJoy'; w.appendChild(joy);
  const acts = el('div', 'susActs'); [['use', '✋', 'استخدم'], ['vent', '🕳️', 'نفق'], ['report', '📢', 'بلّغ'], ['kill', '😈', 'طيّر']].forEach(([k, ic, lb]) => { const b = el('button', 'susAct a-' + k); b.id = 'susA-' + k; b.innerHTML = '<i>' + ic + '</i><small>' + lb + '</small><em></em>'; b.onclick = () => susAction(k); acts.appendChild(b); }); w.appendChild(acts);
  const vt = el('div', 'susVent'); vt.id = 'susVent'; vt.hidden = true; w.appendChild(vt);
  const mp = el('button', 'susMapB', '🗺️'); mp.onclick = () => susMapToggle(); w.appendChild(mp);
  const mo = el('div', 'susMapO'); mo.id = 'susMapO'; mo.hidden = true; mo.onclick = () => susMapToggle(false); w.appendChild(mo);
  const meet = el('div', 'susMeet'); meet.id = 'susMeet'; meet.hidden = true; w.appendChild(meet);
  const tk = el('div', 'susTask'); tk.id = 'susTask'; tk.hidden = true; w.appendChild(tk);
  const ex = el('button', 'susExit', '🚪'); ex.onclick = () => { if (confirm('تطلع من اللعبة؟')) { susSend({ t: 'sus_leave' }); SUSG.s = null; susRender(); } }; w.appendChild(ex);
  susCss5(); susJoyInit(joy); return w;
}
function susNearest() {   // شنو قريب مني هسه: مهمة، زر الطوارئ، نفق، جثة، أو شخص للطيّار
  const s = SUSG.s, me = susMe(), m = SUSG.my, M = SUSG.map; const r = { task: null, btn: false, body: null, kill: null, vent: null }; if (!s || !me || !m) return r;
  if (s.vent >= 0) return r;
  if (me.role === 'crew') { let bd = 72; (s.tasks || []).forEach(t => { if (t.done) return; const T = M.tasks[t.id], d = Math.hypot(T.x - m.x, T.y - m.y); if (d < bd) { bd = d; r.task = t.id; } }); }
  if (me.alive && !me.em && Math.hypot(M.button[0] - m.x, M.button[1] - m.y) < 72) r.btn = true;
  if (me.alive) { let bd = 64; (M.vents || []).forEach((v, i) => { const d = Math.hypot(v.x - m.x, v.y - m.y); if (d < bd) { bd = d; r.vent = i; } }); }
  if (me.alive) (s.bodies || []).forEach(b => { if (Math.hypot(b.x - m.x, b.y - m.y) < 75) r.body = b; });
  if (me.alive && me.role === 'imp') { let bd = 58; s.players.forEach(p => { if (p.me || !p.alive || p.left || p.role === 'imp') return; const q = SUSG.pos[p.i]; if (!q || performance.now() - (q.seen || 0) > 700) return; const d = Math.hypot(q.x - m.x, q.y - m.y); if (d < bd) { bd = d; r.kill = p.i; } }); }
  SUSG.near = r; return r;
}
function susAction(k) {
  const n = susNearest(), s = SUSG.s, me = susMe(); if (!s || s.ph !== 'play' || !me) return;
  if (k === 'use') { if (n.task !== null) susTaskOpen(n.task); else if (n.btn) { if (confirm('🚨 تسوي اجتماع طارئ؟ (مرة وحدة باللعبة)')) susSend({ t: 'sus_emerg' }); } }
  else if (k === 'vent' && n.vent !== null) { const left = Math.max(0, (SUSG.vcdEnd || 0) - Date.now()); if (left > 0 && me.role !== 'imp') return showToast('🕳️ النفق يحتاج ' + Math.ceil(left / 1000) + ' ثانية'); susSend({ t: 'sus_vent', id: n.vent }); }
  else if (k === 'report' && n.body) susSend({ t: 'sus_report' });
  else if (k === 'kill' && n.kill !== null && Date.now() >= (SUSG.kcdEnd || 0)) susSend({ t: 'sus_kill', i: n.kill });
}
function susActUpd() {
  const n = susNearest(), me = susMe(), s = SUSG.s; if (!me || !s) return; const set = (k, on) => { const b = document.getElementById('susA-' + k); if (b) b.classList.toggle('on', !!on); };
  set('use', n.task !== null || n.btn); set('report', !!n.body);
  const kb = document.getElementById('susA-kill'); if (kb) { const left = Math.max(0, (SUSG.kcdEnd || 0) - Date.now()); kb.querySelector('em').textContent = left > 0 ? Math.ceil(left / 1000) : ''; kb.classList.toggle('on', n.kill !== null && left <= 0); }
  const vb = document.getElementById('susA-vent'); if (vb) { vb.hidden = !me.alive; const left = me.role === 'imp' ? 0 : Math.max(0, (SUSG.vcdEnd || 0) - Date.now()); vb.querySelector('em').textContent = left > 0 ? Math.ceil(left / 1000) : ''; vb.classList.toggle('on', n.vent !== null && left <= 0); }
  const ub = document.getElementById('susA-use'); if (ub) { ub.querySelector('small').textContent = n.btn && n.task === null ? 'طوارئ' : 'استخدم'; ub.querySelector('i').textContent = n.task !== null ? (SUS_TK_IC[SUSG.map.tasks[n.task].k] || '✋') : n.btn ? '🚨' : '✋'; }
  const G = document.querySelector('.susGame'); if (G) G.classList.toggle('inVent', s.vent >= 0);
}
/* نفق: شاشة التنقل بين الأنفاق */
const _susHud0 = susHud;
susHud = function () {
  _susHud0(); const s = SUSG.s, me = susMe(), V = document.getElementById('susVent'), M = SUSG.map; if (!s || !V) return;
  if (s.vcd !== undefined) SUSG.vcdEnd = Date.now() + (s.vcd || 0);
  if (s.ph !== 'play' || !(s.vent >= 0)) { V.hidden = true; V.innerHTML = ''; V.dataset.v = ''; return; }
  if (V.dataset.v === String(s.vent)) return; V.dataset.v = String(s.vent); V.hidden = false; V.innerHTML = '';
  const cur = M.vents[s.vent]; if (SUSG.my) { SUSG.my.x = cur.x; SUSG.my.y = cur.y; }
  V.appendChild(el('div', 'svT', '🕳️ إنت داخل نفق «' + cur.n + '»')); V.appendChild(el('small', '', 'محد يشوفك هسه 🤫 اختار وين تروح، أو اطلع من هنا'));
  const row = el('div', 'svRow'); M.vents.forEach((v, i) => { if (v.g !== cur.g || i === s.vent) return; const b = el('button', 'svGo', '➡️ ' + v.n); b.onclick = () => { susSend({ t: 'sus_vmove', to: i }); try { blip('triangle', 400, 200, 0.12, 0.05); } catch (e) {} }; row.appendChild(b); }); V.appendChild(row);
  const ex = el('button', 'svOut', '⬆️ اطلع من النفق'); ex.onclick = () => susSend({ t: 'sus_vexit' }); V.appendChild(ex);
};
/* الخريطة الصغيرة 🗺️ */
function susMapToggle(on) {
  const O = document.getElementById('susMapO'); if (!O) return; const open = on === undefined ? O.hidden : on; O.hidden = !open; SUSG.mapOpen = open; if (!open) { O.innerHTML = ''; return; }
  const M = SUSG.map, s = SUSG.s, me = susMe(), m = SUSG.my; O.innerHTML = ''; const box = el('div', 'smBox'); box.appendChild(el('b', '', '🗺️ خريطة السفينة')); const cv = el('canvas'); const W = 680, H = Math.round(W * M.h / M.w); cv.width = W * 2; cv.height = H * 2; cv.style.width = '100%'; box.appendChild(cv);
  const c = cv.getContext('2d'), k = W * 2 / M.w; c.scale(k, k); c.fillStyle = '#0a0d1a'; c.fillRect(0, 0, M.w, M.h);
  c.fillStyle = '#4a5270'; M.walk.forEach(r => c.fillRect(r[0] - 6, r[1] - 6, r[2] + 12, r[3] + 12)); c.fillStyle = '#7b86a8'; M.cor.forEach(r => c.fillRect(r[0], r[1], r[2], r[3]));
  M.rooms.forEach(R => { c.fillStyle = (SUS_FLOOR[R.k] || ['#8890a8'])[0]; c.fillRect(R.r[0], R.r[1], R.r[2], R.r[3]); c.fillStyle = 'rgba(0,0,0,.65)'; c.font = '900 34px Cairo, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(R.n, R.r[0] + R.r[2] / 2, R.r[1] + R.r[3] / 2); });
  (M.vents || []).forEach(v => { c.fillStyle = '#1a1d29'; c.fillRect(v.x - 18, v.y - 10, 36, 20); });
  c.fillStyle = '#ff3b4a'; c.beginPath(); c.arc(M.button[0], M.button[1], 16, 0, 7); c.fill();
  if (me && me.role === 'crew') (s.tasks || []).forEach(q => { const T = M.tasks[q.id]; c.fillStyle = q.done ? '#2ecc71' : '#ffd23a'; c.beginPath(); c.arc(T.x, T.y - 16, 18, 0, 7); c.fill(); c.strokeStyle = '#000'; c.lineWidth = 3; c.stroke(); });
  if (m) { c.fillStyle = '#fff'; c.strokeStyle = (SUS_CH[me.ch] || SUS_CH[0]).c; c.lineWidth = 8; c.beginPath(); c.arc(m.x, m.y - 10, 22, 0, 7); c.fill(); c.stroke(); }
  box.appendChild(el('small', '', (me && me.role === 'crew' ? '🟡 مهماتك • 🟢 خلصت • ' : '') + '🔴 زر الطوارئ • ⚪ إنت • ⬛ أنفاق — دوس بأي مكان للإغلاق')); O.appendChild(box);
}
/* ---------- المهمات (ألعاب صغيرة مطوّرة) ---------- */
function susTCv(box, w, h) { const cv = el('canvas', 'susTCv'); cv.width = w; cv.height = h; box.appendChild(cv); const g = cv.getContext('2d'); const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * w, (e.clientY - r.top) / r.height * h]; }; return { cv, g, at }; }
function susErr() { try { blip('square', 200, 120, 0.12, 0.05); navigator.vibrate && navigator.vibrate(60); } catch (e) {} }
function susTaskOpen(id) {
  const T = document.getElementById('susTask'), M = SUSG.map.tasks[id]; if (!T) return; SUSG.task = id; T.hidden = false; T.innerHTML = '';
  const box = el('div', 'susTBox'); box.appendChild(el('h4', '', (SUS_TK_IC[M.k] || '🛠️') + ' ' + M.n)); const x = el('button', 'susTX', '✖'); x.onclick = susTaskClose; box.appendChild(x);
  const live = () => SUSG.task === id; let fin = false;
  const done = () => { if (fin) return; fin = true; susSfx('task'); box.appendChild(el('div', 'susTOk', '✅ تمت!')); susSend({ t: 'sus_task', id }); setTimeout(() => { if (SUSG.task === id) susTaskClose(); }, 750); };
  const loop = fn => { const f = () => { if (!live() || fin) return; fn(); requestAnimationFrame(f); }; requestAnimationFrame(f); };
  const hint = tx => box.appendChild(el('small', '', tx));
  const K = M.k;
  if (K === 'wires') {   /* اسحب السلك من اليسار لنفس لونه باليمين */
    const cols = ['#ff4a5a', '#3ab0ff', '#ffd23a', '#c86aff'], L = cols.slice().sort(() => Math.random() - 0.5), Rr = cols.slice().sort(() => Math.random() - 0.5), { cv, g, at } = susTCv(box, 520, 360); hint('اسحب كل سلك من اليسار لنفس لونه باليمين 🔌');
    const con = {}; let drag = null, pt = null; const yOf = i => 60 + i * 80; const sp = [];
    const draw = () => { g.fillStyle = '#2a2438'; g.fillRect(0, 0, 520, 360); g.fillStyle = '#3a3350'; g.fillRect(0, 0, 90, 360); g.fillRect(430, 0, 90, 360); for (let i = 0; i < 9; i++) { g.fillStyle = '#4a4364'; g.beginPath(); g.arc(45, 20 + i * 40, 3, 0, 7); g.arc(475, 20 + i * 40, 3, 0, 7); g.fill(); }
      L.forEach((c, i) => { g.fillStyle = '#1e1a2a'; g.fillRect(14, yOf(i) - 20, 66, 40); g.fillStyle = c; g.fillRect(20, yOf(i) - 14, 52, 28); g.fillStyle = '#d0c090'; g.fillRect(72, yOf(i) - 6, 14, 12); }); Rr.forEach((c, i) => { g.fillStyle = '#1e1a2a'; g.fillRect(440, yOf(i) - 20, 66, 40); g.fillStyle = c; g.fillRect(446, yOf(i) - 14, 52, 28); g.fillStyle = con && Object.values(con).includes(i) ? '#ffd23a' : '#555'; g.beginPath(); g.arc(476, yOf(i) - 26, 4, 0, 7); g.fill(); });
      const wire = (li, x2, y2) => { g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(86, yOf(li) + 3); g.bezierCurveTo(250, yOf(li) + 3, 270, y2 + 3, x2, y2 + 3); g.stroke(); g.strokeStyle = L[li]; g.lineWidth = 12; g.beginPath(); g.moveTo(86, yOf(li)); g.bezierCurveTo(250, yOf(li), 270, y2, x2, y2); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(86, yOf(li) - 3); g.bezierCurveTo(250, yOf(li) - 3, 270, y2 - 3, x2, y2 - 3); g.stroke(); };
      for (const li in con) wire(+li, 440, yOf(con[li])); if (drag !== null && pt) wire(drag, pt[0], pt[1]);
      sp.forEach(q => { q.x += q.vx; q.y += q.vy; q.l--; g.fillStyle = 'rgba(255,230,120,' + q.l / 20 + ')'; g.fillRect(q.x, q.y, 3, 3); }); while (sp.length && sp[0].l <= 0) sp.shift(); };
    cv.addEventListener('pointerdown', e => { const [px, py] = at(e), i = Math.round((py - 60) / 80); if (px < 120 && i >= 0 && i < 4 && con[i] === undefined) { drag = i; pt = [px, py]; try { cv.setPointerCapture(e.pointerId); } catch (er) {} susSfx('click'); } });
    cv.addEventListener('pointermove', e => { if (drag !== null) pt = at(e); });
    cv.addEventListener('pointerup', e => { if (drag === null) return; const [px, py] = at(e), i = Math.round((py - 60) / 80); if (px > 390 && i >= 0 && i < 4 && Rr[i] === L[drag] && !Object.values(con).includes(i)) { con[drag] = i; susSfx('click'); for (let k = 0; k < 14; k++) sp.push({ x: 440, y: yOf(i), vx: -Math.random() * 4, vy: (Math.random() - 0.5) * 4, l: 20 }); if (Object.keys(con).length === 4) setTimeout(done, 200); } else susErr(); drag = null; pt = null; });
    loop(draw);
  } else if (K === 'fuel' || K === 'download' || K === 'scan') {   /* تعبئة / تحميل / فحص: كل وحدة إلها شكل */
    const { cv, g } = susTCv(box, 520, 300); let p = 0, on = false, started = false;
    const b = el('button', 'susHold', K === 'fuel' ? '⛽ اضغط وكمّل ضاغط' : K === 'scan' ? '🩺 ابدأ الفحص' : '⬇️ ابدأ التحميل'); box.appendChild(b);
    hint(K === 'fuel' ? 'خلي إصبعك ضاغط لحد ما يتعبّى الخزان' : K === 'scan' ? 'اوقف على الجهاز لحد ما يخلص الفحص 🩺' : 'خلي الشاشة مفتوحة لحد ما يخلص التحميل 📡');
    if (K === 'fuel') { b.addEventListener('pointerdown', e => { on = true; e.preventDefault(); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { on = false; })); }
    else b.onclick = () => { if (started) return; started = true; on = true; b.disabled = true; susSfx('click'); };
    let t0 = 0; loop(() => { t0++; p = K === 'fuel' ? (on ? Math.min(1, p + 0.009) : Math.max(0, p - 0.004)) : on ? Math.min(1, p + (K === 'scan' ? 0.0045 : 0.0038)) : p;
      g.fillStyle = '#1c1830'; g.fillRect(0, 0, 520, 300);
      if (K === 'fuel') { g.fillStyle = '#3a3a4a'; susRR(g, 190, 30, 140, 240, 18); g.fill(); g.save(); susRR(g, 196, 36, 128, 228, 14); g.clip(); const fy = 264 - p * 228; const fg = g.createLinearGradient(0, fy, 0, 264); fg.addColorStop(0, '#ffd166'); fg.addColorStop(1, '#ff8a2a'); g.fillStyle = fg; g.beginPath(); g.moveTo(196, fy); for (let x = 196; x <= 324; x += 8) g.lineTo(x, fy + Math.sin(x / 10 + t0 / 5) * 4); g.lineTo(324, 264); g.lineTo(196, 264); g.fill(); if (on) for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(210 + ((i * 29 + t0 * 2) % 110), 264 - ((t0 * 3 + i * 40) % (p * 228 + 1)), 3, 0, 7); g.fill(); } g.restore(); g.fillStyle = '#fff'; g.font = '900 30px Cairo, system-ui'; g.textAlign = 'center'; g.fillText(Math.round(p * 100) + '%', 260, 160); g.fillStyle = '#6a6a7a'; g.fillRect(240, 10, 40, 24); }
      else if (K === 'scan') { g.save(); g.translate(260, 210); susChar(g, (susMe() || {}).ch || 0, 0, 0, 1, t0, 0, { s: 2 }); g.restore(); const sy = 70 + (Math.sin(t0 / 14) * 0.5 + 0.5) * 150; if (on) { g.fillStyle = 'rgba(80,255,200,.35)'; g.fillRect(150, sy - 4, 220, 8); g.strokeStyle = 'rgba(80,255,200,.9)'; g.lineWidth = 2; g.strokeRect(150, sy - 4, 220, 8); } g.strokeStyle = '#4ae0c0'; g.lineWidth = 3; g.beginPath(); g.ellipse(260, 230, 110, 26, 0, 0, 7); g.stroke(); g.fillStyle = '#9fffe8'; g.font = '13px monospace'; g.textAlign = 'left'; ['ID: ' + ((susMe() || {}).n || ''), 'HT: 3.6 ft', 'BLD: O+', 'ضغط: ' + (110 + (t0 % 9))].forEach((l, i) => { if (p > i * 0.22) g.fillText(l, 16, 40 + i * 22); }); }
      else { g.fillStyle = '#2a3046'; susRR(g, 40, 70, 110, 90, 10); g.fill(); susRR(g, 370, 70, 110, 90, 10); g.fill(); g.font = '40px system-ui'; g.textAlign = 'center'; g.fillText('🗄️', 95, 132); g.fillText('📡', 425, 132); if (on && p < 1) for (let i = 0; i < 4; i++) { const fx = 150 + ((t0 * 3 + i * 55) % 220); g.font = '22px system-ui'; g.fillText('📄', fx, 120 + Math.sin(fx / 30) * 20); } }
      g.fillStyle = 'rgba(255,255,255,.15)'; susRR(g, 30, 276, 460, 14, 7); g.fill(); g.fillStyle = '#2ecc71'; susRR(g, 30, 276, Math.max(14, 460 * p), 14, 7); g.fill();
      if (p >= 1) done(); });
  } else if (K === 'align' || K === 'calib') {   /* معايرة: وكّف المؤشر بالمنطقة الخضرا */
    const { cv, g } = susTCv(box, 520, 300), n = K === 'calib' ? 3 : 2; let step = 0, a = 0, sp = 0.05; const zone = () => ({ a: 0.6 + step * 0.9 + (step * 37 % 5) * 0.2, w: 0.42 });
    const b = el('button', 'susBtn big', '⏹️ وكّف'); box.appendChild(b); hint(K === 'calib' ? 'وكّف كل مؤشر من يصير بالأخضر (3 مؤشرات) ⚡' : 'وكّف المؤشر بالأخضر حتى تعدّل المحرك ⚙️');
    b.onclick = () => { const z = zone(), d = Math.atan2(Math.sin(a - z.a), Math.cos(a - z.a)); if (Math.abs(d) < z.w / 2) { susSfx('click'); step++; sp = 0.05 + step * 0.025; if (step >= n) done(); } else { susErr(); step = Math.max(0, step - 1); } };
    loop(() => { a += sp; g.fillStyle = '#1c1830'; g.fillRect(0, 0, 520, 300); for (let i = 0; i < n; i++) { const cx = 260 + (i - (n - 1) / 2) * 160, cy = 150, R = 62, z = i === step ? zone() : null; g.fillStyle = '#2a3046'; g.beginPath(); g.arc(cx, cy, R + 10, 0, 7); g.fill(); g.strokeStyle = '#555c78'; g.lineWidth = 3; g.stroke();
      if (z) { g.strokeStyle = '#2ecc71'; g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, R - 6, z.a - z.w / 2, z.a + z.w / 2); g.stroke(); }
      const aa = i < step ? 0 : i === step ? a : 0; g.strokeStyle = i < step ? '#2ecc71' : '#ff6a3a'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(aa) * R, cy + Math.sin(aa) * R); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill(); if (i < step) { g.font = '22px system-ui'; g.textAlign = 'center'; g.fillText('✅', cx, cy - R - 16); } } });
  } else if (K === 'simon') {   /* المفاعل: احفظ الترتيب وعيده */
    const grid = el('div', 'susSeq simon'), btns = []; let seq = [], inp = 0, show = true, lvl = 0; hint('احفظ المربعات اللي تضوي وعيدها بنفس الترتيب ☢️ (4 مراحل)');
    const st = el('b', 'simonSt', ''); box.appendChild(st);
    for (let i = 0; i < 9; i++) { const b = el('button', ''); b.onclick = () => { if (show || fin) return; b.classList.add('lit'); setTimeout(() => b.classList.remove('lit'), 180); if (seq[inp] === i) { try { blip('sine', 400 + i * 60, 400 + i * 60, 0.12, 0.05); } catch (e) {} inp++; if (inp === seq.length) { lvl++; if (lvl >= 4) return done(); setTimeout(next, 600); } } else { susErr(); lvl = 0; seq = []; setTimeout(next, 700); } }; btns.push(b); grid.appendChild(b); }
    box.appendChild(grid);
    const next = () => { if (!live()) return; seq.push(Math.floor(Math.random() * 9)); inp = 0; show = true; st.textContent = '👀 احفظ... المرحلة ' + (lvl + 1) + '/4'; seq.forEach((q, k) => { setTimeout(() => { if (!live()) return; btns[q].classList.add('lit'); try { blip('sine', 400 + q * 60, 400 + q * 60, 0.2, 0.05); } catch (e) {} setTimeout(() => btns[q].classList.remove('lit'), 380); }, 600 + k * 600); }); setTimeout(() => { show = false; st.textContent = '👆 هسه إنت! المرحلة ' + (lvl + 1) + '/4'; }, 600 + seq.length * 600); };
    next();
  } else if (K === 'code') {   /* اقرا الرمز من الورقة واكتبه */
    const code = String(1000 + Math.floor(Math.random() * 9000)); let typed = ''; const note = el('div', 'susNote', '📝 الرمز: ' + code), scr = el('div', 'susScr', '____'); box.append(note, scr); hint('اكتب الرمز اللي بالورقة 🔢');
    const grid = el('div', 'susSeq pad'); [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✔'].forEach(v => { const b = el('button', '', String(v)); b.onclick = () => { if (fin) return; susSfx('click'); if (v === '⌫') typed = typed.slice(0, -1); else if (v === '✔') { if (typed === code) { scr.classList.add('ok'); return done(); } susErr(); scr.classList.add('bad'); setTimeout(() => scr.classList.remove('bad'), 400); typed = ''; } else if (typed.length < 4) typed += v; scr.textContent = (typed + '____').slice(0, 4); }; grid.appendChild(b); }); box.appendChild(grid);
  } else if (K === 'cook') {   /* طبخ الكبة: اقلبها من تصير ذهبية */
    const { cv, g, at } = susTCv(box, 520, 300), ks = [0, 1, 2].map(i => ({ x: 130 + i * 130, h: 0, sp: 0.0035 + Math.random() * 0.003, ok: false })); hint('دوس على كل كبة من يصير لونها ذهبي (المؤشر بالأخضر) 🍳 — لا تخليها تحترك!');
    cv.addEventListener('pointerdown', e => { const [px] = at(e); const k = ks.find(q => Math.abs(q.x - px) < 60 && !q.ok); if (!k) return; if (k.h > 0.6 && k.h < 0.85) { k.ok = true; susSfx('click'); if (ks.every(q => q.ok)) setTimeout(done, 300); } else { susErr(); k.h = 0; } });
    let t0 = 0; loop(() => { t0++; g.fillStyle = '#2a2230'; g.fillRect(0, 0, 520, 300); g.fillStyle = '#333'; g.beginPath(); g.ellipse(260, 180, 230, 80, 0, 0, 7); g.fill(); g.fillStyle = '#4a4a50'; g.beginPath(); g.ellipse(260, 172, 220, 72, 0, 0, 7); g.fill();
      ks.forEach(k => { if (!k.ok) { k.h += k.sp; if (k.h > 1) { k.h = 0; susErr(); } } const col = k.ok ? '#c98a3a' : k.h < 0.6 ? '#e8c89a' : k.h < 0.85 ? '#d4943a' : '#4a2a10'; g.fillStyle = col; g.beginPath(); g.ellipse(k.x, 170, 42, 24, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 2; g.stroke(); if (!k.ok) for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); const yy = 130 - ((t0 + i * 15) % 40); g.moveTo(k.x - 10 + i * 10, yy + 10); g.quadraticCurveTo(k.x - 4 + i * 10, yy, k.x - 10 + i * 10, yy - 10); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(k.x - 40, 236, 80, 12); g.fillStyle = '#2ecc71'; g.fillRect(k.x - 40 + 80 * 0.6, 236, 80 * 0.25, 12); g.fillStyle = '#fff'; g.fillRect(k.x - 40 + 80 * Math.min(1, k.h) - 2, 232, 4, 20); if (k.ok) { g.font = '22px system-ui'; g.textAlign = 'center'; g.fillText('✅', k.x, 120); } }); });
  } else if (K === 'leaves') {   /* تنظيف الفلتر: شيل الورق المتحرك */
    const { cv, g, at } = susTCv(box, 520, 300), lv = Array.from({ length: 8 }, () => ({ x: 120 + Math.random() * 360, y: 30 + Math.random() * 240, a: Math.random() * 6, vx: -0.3 - Math.random() * 0.5, out: 0 })); hint('دوس على كل ورقة حتى تطلعها من الفلتر 🍃');
    cv.addEventListener('pointerdown', e => { const [px, py] = at(e); const q = lv.find(l => !l.out && Math.hypot(l.x - px, l.y - py) < 34); if (q) { q.out = 1; susSfx('click'); if (lv.every(l => l.out)) setTimeout(done, 400); } });
    loop(() => { g.fillStyle = '#2a3a30'; g.fillRect(0, 0, 520, 300); g.strokeStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < 520; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 300); g.stroke(); } g.fillStyle = '#111'; g.fillRect(0, 100, 30, 100);
      lv.forEach(l => { if (l.out) { l.x -= 14; l.a += 0.3; } else { l.x += l.vx; l.a += 0.02; l.y += Math.sin(l.a) * 0.6; if (l.x < 60) l.vx = Math.abs(l.vx); if (l.x > 480) l.vx = -Math.abs(l.vx); } if (l.x < -40) return; g.save(); g.translate(l.x, l.y); g.rotate(l.a); g.fillStyle = '#5fbf4a'; g.beginPath(); g.ellipse(0, 0, 26, 12, 0, 0, 7); g.fill(); g.strokeStyle = '#2f7a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-24, 0); g.lineTo(24, 0); g.stroke(); g.restore(); }); });
  } else if (K === 'nav') {   /* تعديل المسار: دوس النقاط بالترتيب */
    const { cv, g, at } = susTCv(box, 520, 300), pts = [[70, 230], [180, 120 + Math.random() * 60], [300, 60 + Math.random() * 80], [420, 140 + Math.random() * 80], [480, 60]]; let k = 1; hint('دوس النقاط بالترتيب حتى ترسم طريق السفينة 🧭');
    cv.addEventListener('pointerdown', e => { const [px, py] = at(e), q = pts[k]; if (q && Math.hypot(q[0] - px, q[1] - py) < 34) { k++; susSfx('click'); if (k >= pts.length) setTimeout(done, 500); } else susErr(); });
    let t0 = 0; loop(() => { t0++; g.fillStyle = '#0c1a2e'; g.fillRect(0, 0, 520, 300); g.strokeStyle = 'rgba(120,200,255,.12)'; for (let x = 0; x < 520; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 300); g.stroke(); } for (let y = 0; y < 300; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(520, y); g.stroke(); }
      g.strokeStyle = '#ffd23a'; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); pts.slice(0, k).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.setLineDash([]);
      pts.forEach((p, i) => { g.fillStyle = i < k ? '#2ecc71' : i === k ? 'rgba(255,210,58,' + (0.6 + 0.4 * Math.sin(t0 / 6)) + ')' : '#5a6a8a'; g.beginPath(); g.arc(p[0], p[1], i === k ? 18 : 13, 0, 7); g.fill(); g.fillStyle = '#000'; g.font = 'bold 14px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i ? i : '🚀', p[0], p[1]); }); });
  } else if (K === 'asteroids') {   /* دمّر 10 نيازك */
    const { cv, g, at } = susTCv(box, 520, 300), rk = []; let hit = 0, t0 = 0; const st = el('b', 'simonSt', '☄️ 0/10'); box.appendChild(st); hint('دوس على النيازك حتى تفجّرها قبل ما توصل للسفينة ☄️');
    const boom = []; cv.addEventListener('pointerdown', e => { const [px, py] = at(e); const q = rk.find(r => !r.dead && Math.hypot(r.x - px, r.y - py) < r.r + 14); if (q) { q.dead = 1; hit++; st.textContent = '☄️ ' + hit + '/10'; try { burst(0.12, 0.12, 0, 900); } catch (er) {} boom.push({ x: q.x, y: q.y, l: 16 }); if (hit >= 10) setTimeout(done, 300); } else { try { blip('sine', 900, 300, 0.06, 0.03); } catch (er) {} } });
    loop(() => { t0++; if (t0 % 40 === 0 && rk.filter(r => !r.dead).length < 5) rk.push({ x: 540, y: 30 + Math.random() * 240, vx: -1.4 - Math.random() * 1.6, vy: (Math.random() - 0.5) * 0.8, r: 14 + Math.random() * 12, a: 0 });
      g.fillStyle = '#060818'; g.fillRect(0, 0, 520, 300); g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) g.fillRect((i * 97 + t0 * (1 + i % 3)) % 520, (i * 53) % 300, 2, 2);
      rk.forEach(r => { if (r.dead) return; r.x += r.vx; r.y += r.vy; r.a += 0.03; if (r.x < -30) r.dead = 1; g.save(); g.translate(r.x, r.y); g.rotate(r.a); g.fillStyle = '#8a7a6a'; g.beginPath(); for (let k = 0; k < 8; k++) { const aa = k / 8 * 6.28, rr = r.r * (0.8 + ((k * 7) % 3) * 0.12); g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } g.closePath(); g.fill(); g.fillStyle = '#6a5a4a'; g.beginPath(); g.arc(r.r * 0.2, -r.r * 0.2, r.r * 0.25, 0, 7); g.fill(); g.restore(); });
      boom.forEach(b => { b.l--; g.fillStyle = 'rgba(255,170,60,' + b.l / 16 + ')'; g.beginPath(); g.arc(b.x, b.y, 30 - b.l, 0, 7); g.fill(); }); while (boom.length && boom[0].l <= 0) boom.shift();
      g.strokeStyle = 'rgba(80,255,120,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(260, 150, 20, 0, 7); g.moveTo(230, 150); g.lineTo(290, 150); g.moveTo(260, 120); g.lineTo(260, 180); g.stroke(); });
  } else if (K === 'trash') {   /* رمي الزبالة: اسحب العتلة لجوه وخليها */
    const { cv, g, at } = susTCv(box, 520, 300); let lev = 0, hold = false, out = 0; hint('اسحب العتلة لجوه وخليها لحد ما تفرغ الزبالة 🗑️');
    const junk = Array.from({ length: 14 }, (_, i) => ({ x: 150 + (i % 5) * 44 + Math.random() * 10, y: 60 + Math.floor(i / 5) * 36, e: ['🍌', '🥫', '📦', '🍕', '🧃', '🦴'][i % 6], vy: 0 }));
    cv.addEventListener('pointerdown', e => { const [px] = at(e); if (px > 400) { hold = true; try { cv.setPointerCapture(e.pointerId); } catch (er) {} } }); cv.addEventListener('pointermove', e => { if (hold) { const [, py] = at(e); lev = Math.max(0, Math.min(1, (py - 70) / 160)); } }); cv.addEventListener('pointerup', () => { hold = false; });
    loop(() => { if (!hold) lev = Math.max(0, lev - 0.04); g.fillStyle = '#22202c'; g.fillRect(0, 0, 520, 300); g.fillStyle = '#3a3a48'; g.fillRect(130, 30, 250, 220); g.fillStyle = lev > 0.9 ? '#0a0a10' : '#55556a'; g.fillRect(130, 250, 250, 14);
      if (lev > 0.9) { out += 0.012; junk.forEach(j => { j.vy += 0.5; j.y += j.vy; }); } g.font = '30px system-ui'; g.textAlign = 'center'; junk.forEach(j => { if (j.y < 320) g.fillText(j.e, j.x, j.y + 30); });
      g.fillStyle = '#555'; g.fillRect(445, 60, 14, 190); g.fillStyle = '#ff4a5a'; g.beginPath(); g.arc(452, 70 + lev * 160, 20, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '13px Cairo, system-ui'; g.fillText('⬇️', 452, 50);
      g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(30, 276, 460, 12); g.fillStyle = '#2ecc71'; g.fillRect(30, 276, 460 * Math.min(1, out), 12); if (out >= 1) done(); });
  } else if (K === 'boxes') {   /* ترتيب الصناديق: كدّس 4 صناديق فوك بعض */
    const { cv, g } = susTCv(box, 520, 300), stack = [{ x: 200, w: 120 }]; let cur = { x: 0, w: 120, d: 1 }, sp = 3, drop = null; hint('دوس حتى تنزل الصندوق فوك اللي جوّاه 📦 — كدّس 4 صناديق');
    cv.addEventListener('pointerdown', () => { if (drop || fin) return; drop = { x: cur.x, w: cur.w, y: 20 }; });
    loop(() => { g.fillStyle = '#2a2420'; g.fillRect(0, 0, 520, 300); g.fillStyle = '#4a3a2a'; g.fillRect(0, 270, 520, 30);
      const crate = (x, y, w) => { g.fillStyle = '#b98a4c'; g.fillRect(x, y, w, 40); g.strokeStyle = '#7a5a30'; g.lineWidth = 3; g.strokeRect(x, y, w, 40); g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + 40); g.moveTo(x + w, y); g.lineTo(x, y + 40); g.stroke(); };
      stack.forEach((b, i) => crate(b.x, 230 - i * 40, b.w));
      if (!drop) { cur.x += cur.d * sp; if (cur.x < 0 || cur.x + cur.w > 520) cur.d *= -1; crate(cur.x, 20, cur.w); }
      else { drop.y += 9; const top = stack[stack.length - 1], ty = 230 - stack.length * 40; crate(drop.x, Math.min(drop.y, ty), drop.w); if (drop.y >= ty) { const ov = Math.min(drop.x + drop.w, top.x + top.w) - Math.max(drop.x, top.x); if (ov >= drop.w * 0.5) { stack.push({ x: drop.x, w: drop.w }); susSfx('click'); sp += 1.2; if (stack.length >= 5) done(); } else { susErr(); stack.splice(1); sp = 3; } drop = null; cur = { x: 0, w: 120, d: 1 }; } } });
  }
  T.appendChild(box);
}
function susCss5() {
  if (document.getElementById('susCss5')) return; const st = document.createElement('style'); st.id = 'susCss5';
  st.textContent = `.susJoy{left:50%!important;transform:translateX(-50%);bottom:calc(22px + env(safe-area-inset-bottom))!important;width:120px!important;height:120px!important;background:radial-gradient(circle,rgba(255,255,255,.14),rgba(255,255,255,.04))!important;box-shadow:0 0 0 6px rgba(255,255,255,.05),inset 0 0 20px rgba(0,0,0,.4)}
.susJoy i{background:radial-gradient(circle at 35% 30%,#fff,#b9c3e6 60%,#8a94b8)!important}
.susActs{right:10px!important;bottom:calc(16px + env(safe-area-inset-bottom))!important;gap:8px!important;display:grid!important;grid-template-columns:repeat(2,56px);direction:ltr}.susAct{width:56px!important;height:56px!important}.susAct i{font-size:20px!important}.susAct small{font-size:10px!important}.susAct.a-vent{background:rgba(40,150,110,.85)!important}.susAct[hidden]{display:none!important}
.susGame.inVent .susJoy,.susGame.inVent .susActs{display:none!important}
.susVent{position:absolute;left:10px;right:10px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:4;background:rgba(10,20,26,.92);border:2px solid #3ee0a0;border-radius:18px;padding:12px;color:#fff;text-align:center;display:flex;flex-direction:column;gap:6px;box-shadow:0 0 24px rgba(62,224,160,.35);animation:svIn .3s ease}.susVent[hidden]{display:none}@keyframes svIn{from{transform:translateY(40px);opacity:0}}
.svT{font-weight:900;font-size:16px}.svRow{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.svGo{flex:1 1 40%;padding:12px 6px;border-radius:12px;border:2px solid #3ee0a0;background:rgba(62,224,160,.15);color:#fff;font-weight:800;font-family:inherit;font-size:14px}.svOut{padding:12px;border-radius:12px;border:0;background:linear-gradient(135deg,#ffd23a,#ff8a2a);color:#2a1800;font-weight:900;font-family:inherit;font-size:15px}
.susMapB{position:absolute;top:52px;right:8px;width:38px;height:38px;border-radius:50%;border:2px solid rgba(255,255,255,.5);background:rgba(0,0,0,.55);color:#fff;font-size:18px;z-index:3}.susGame:not(.ph-play) .susMapB{display:none}
.susMapO{position:absolute;inset:0;z-index:7;background:rgba(3,5,14,.88);display:flex;align-items:center;justify-content:center;padding:10px}.susMapO[hidden]{display:none}.smBox{width:min(100%,720px);background:#141a30;border:2px solid #6d7cff;border-radius:16px;padding:10px;color:#fff;display:flex;flex-direction:column;gap:6px;text-align:center}.smBox canvas{border-radius:10px}.smBox small{opacity:.85}
.susTBox{background:linear-gradient(160deg,#241e42,#15122a)!important;box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08) inset}
.susSeq.simon{grid-template-columns:repeat(3,74px)}.susSeq.simon button{height:74px;background:#2a3a5a;transition:background .1s,transform .1s}.susSeq.simon button.lit{background:#3ee0ff;box-shadow:0 0 22px #3ee0ff;transform:scale(1.06)}
.simonSt{color:#ffd166}.susNote{background:#fff59a;color:#3a3000;font-weight:900;font-size:22px;padding:8px 18px;border-radius:4px;transform:rotate(-3deg);box-shadow:0 4px 10px rgba(0,0,0,.4);letter-spacing:3px}
.susScr{font:900 34px monospace;letter-spacing:12px;background:#0a1a12;color:#5aff9a;padding:6px 18px;border-radius:10px;border:2px solid #2a5a3a}.susScr.ok{color:#fff;background:#2ecc71}.susScr.bad{color:#ff5a5a;animation:lmBad .3s}@keyframes lmBad{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.susSeq.pad{grid-template-columns:repeat(3,64px);direction:ltr}.susSeq.pad button{height:56px;font-size:22px}`;
  document.head.appendChild(st);
}
