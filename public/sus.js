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
const susOk = (x, y) => susWalk(x - 13, y - 6) && susWalk(x + 13, y - 6) && susWalk(x - 13, y + 8) && susWalk(x + 13, y + 8);
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
  if (SUSG.map) go(); else fetch('/sus-map.json').then(r => r.json()).then(m => { SUSG.map = m; go(); }).catch(() => showToast('⚠️ ما قدرت أحمّل اللعبة'));
}
function susClose() { cancelAnimationFrame(SUSG.raf); SUSG.raf = 0; }
function susMsg(d) {
  if (d.t === 'sus_state') { const old = SUSG.s; SUSG.s = d.s; susOnState(old, d.s); }
  else if (d.t === 'sus_pos') { (d.p || []).forEach(q => { const o = SUSG.pos[q[0]] || (SUSG.pos[q[0]] = { x: q[1], y: q[2] }); o.tx = q[1]; o.ty = q[2]; o.dir = q[3]; o.mv = q[4]; o.alive = q[5]; o.seen = performance.now(); }); }
  else if (d.t === 'sus_kill') { susSfx('kill'); for (let i = 0; i < 26; i++) SUSG.fx.push({ x: d.x, y: d.y - 20, vx: (Math.random() - 0.5) * 5, vy: -2 - Math.random() * 4, t: 50, e: Math.random() < 0.7 ? '🍿' : '💥' }); if (d.you) { SUSG.youDied = performance.now(); showToast('😵 انمسكت! صرت شبح، كمّل مهماتك وانت شبح 👻'); } }
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
  const how = el('details', 'susHow'); how.innerHTML = '<summary>📖 شلون ألعب؟</summary><p>🥔 <b>الطاقم:</b> روح للمهمات المعلّمة بـ ❗ ودوس «استخدم». إذا خلّصتوا كل المهمات تفوزون.</p><p>😈 <b>الخاين:</b> قرّب من واحد ودوس «طيّر» حتى يصير شبح. لا تخلي أحد يكشفك!</p><p>📢 إذا لكيت واحد طايح دوس «بلّغ»، أو دوس الزر الأحمر بالكافتيريا لاجتماع طارئ. بالاجتماع تتناقشون بالشات وتصوتون مين الخاين.</p><p>👻 اللي يطير يصير شبح، يكدر يكمل مهماته بس ما يحجي ولا يصوّت.</p>';
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
function susGameEl() {
  const w = el('div', 'susGame'); const cv = el('canvas'); cv.id = 'susCv'; w.appendChild(cv);
  const top = el('div', 'susTop'); top.innerHTML = '<div class="susProg"><i id="susProgB"></i><span>🛠️ مهمات الطاقم</span></div><div id="susRole"></div>'; w.appendChild(top);
  const tl = el('div', 'susTasks'); tl.id = 'susTasks'; w.appendChild(tl);
  const joy = el('div', 'susJoy'); joy.innerHTML = '<i></i>'; joy.id = 'susJoy'; w.appendChild(joy);
  const acts = el('div', 'susActs'); [['use', '✋', 'استخدم'], ['report', '📢', 'بلّغ'], ['kill', '😈', 'طيّر']].forEach(([k, ic, lb]) => { const b = el('button', 'susAct a-' + k); b.id = 'susA-' + k; b.innerHTML = '<i>' + ic + '</i><small>' + lb + '</small><em></em>'; b.onclick = () => susAction(k); acts.appendChild(b); }); w.appendChild(acts);
  const meet = el('div', 'susMeet'); meet.id = 'susMeet'; meet.hidden = true; w.appendChild(meet);
  const tk = el('div', 'susTask'); tk.id = 'susTask'; tk.hidden = true; w.appendChild(tk);
  const ex = el('button', 'susExit', '🚪'); ex.onclick = () => { if (confirm('تطلع من اللعبة؟')) { susSend({ t: 'sus_leave' }); SUSG.s = null; susRender(); } }; w.appendChild(ex);
  susJoyInit(joy); return w;
}
function susJoyInit(j) {
  const knob = j.querySelector('i'); let id = null, cx = 0, cy = 0;
  const set = (x, y) => { let dx = x - cx, dy = y - cy; const d = Math.hypot(dx, dy), m = 42; if (d > m) { dx = dx / d * m; dy = dy / d * m; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; SUSG.joy = d > 6 ? [dx / m, dy / m] : null; };
  j.addEventListener('pointerdown', e => { id = e.pointerId; const r = j.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; set(e.clientX, e.clientY); try { j.setPointerCapture(id); } catch (er) {} e.preventDefault(); });
  j.addEventListener('pointermove', e => { if (e.pointerId === id) set(e.clientX, e.clientY); });
  const up = e => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; SUSG.joy = null; }; j.addEventListener('pointerup', up); j.addEventListener('pointercancel', up);
}
document.addEventListener('keydown', e => { if (curPage === 'sus' && !(e.target && e.target.tagName === 'INPUT')) { SUSG.keys[e.key.toLowerCase()] = 1; if (e.key === ' ' || e.key === 'e') susAction('use'); } });
document.addEventListener('keyup', e => { SUSG.keys[e.key.toLowerCase()] = 0; });
function susNearest() {   // شنو قريب مني هسه: مهمة، زر الطوارئ، جثة، أو شخص للطيّار
  const s = SUSG.s, me = susMe(), m = SUSG.my, M = SUSG.map; const r = { task: null, btn: false, body: null, kill: null }; if (!s || !me || !m) return r;
  if (me.role === 'crew') (s.tasks || []).forEach(t => { if (t.done) return; const T = M.tasks[t.id]; if (Math.hypot(T.x - m.x, T.y - m.y) < 64) r.task = t.id; });
  if (me.alive && !me.em && Math.hypot(M.button[0] - m.x, M.button[1] - m.y) < 64) r.btn = true;
  if (me.alive) (s.bodies || []).forEach(b => { if (Math.hypot(b.x - m.x, b.y - m.y) < 75) r.body = b; });
  if (me.alive && me.role === 'imp') { let bd = 58; s.players.forEach(p => { if (p.me || !p.alive || p.left || p.role === 'imp') return; const q = SUSG.pos[p.i]; if (!q) return; const d = Math.hypot(q.x - m.x, q.y - m.y); if (d < bd) { bd = d; r.kill = p.i; } }); }
  return r;
}
function susAction(k) {
  const n = susNearest(), s = SUSG.s, me = susMe(); if (!s || s.ph !== 'play' || !me) return;
  if (k === 'use') { if (n.task !== null) susTaskOpen(n.task); else if (n.btn) { if (confirm('🚨 تسوي اجتماع طارئ؟ (مرة وحدة باللعبة)')) susSend({ t: 'sus_emerg' }); } }
  else if (k === 'report' && n.body) susSend({ t: 'sus_report' });
  else if (k === 'kill' && n.kill !== null && Date.now() >= (SUSG.kcdEnd || 0)) susSend({ t: 'sus_kill', i: n.kill });
}
function susHud() {
  const s = SUSG.s, me = susMe(); if (!s || !me) return; const pb = document.getElementById('susProgB'); if (pb) pb.style.width = Math.round((s.prog || 0) * 100) + '%';
  const rl = document.getElementById('susRole'); if (rl) { rl.textContent = (me.role === 'imp' ? '😈 أنت الخاين' : '🥔 أنت من الطاقم') + (me.alive ? '' : ' • 👻 شبح'); rl.className = me.role === 'imp' ? 'imp' : 'crew'; }
  const tl = document.getElementById('susTasks'); if (tl) { tl.innerHTML = ''; if (me.role === 'imp') tl.appendChild(el('div', '', '🎭 تظاهر إنك تسوي مهمات… وطيّرهم بدون ما ينتبهون')); else (s.tasks || []).forEach(t => tl.appendChild(el('div', t.done ? 'done' : '', (t.done ? '✅ ' : '⬜ ') + SUSG.map.tasks[t.id].n))); }
  document.getElementById('susA-kill').hidden = !(me.role === 'imp' && me.alive); document.getElementById('susA-report').hidden = !me.alive;
  if (me.role === 'imp' && s.kcd !== undefined) SUSG.kcdEnd = Date.now() + (s.kcd || 0);
}
function susActUpd() {
  const n = susNearest(), me = susMe(); if (!me) return; const set = (k, on) => { const b = document.getElementById('susA-' + k); if (b) b.classList.toggle('on', !!on); };
  set('use', n.task !== null || n.btn); set('report', !!n.body); const kb = document.getElementById('susA-kill'); if (kb) { const left = Math.max(0, (SUSG.kcdEnd || 0) - Date.now()); kb.querySelector('em').textContent = left > 0 ? Math.ceil(left / 1000) : ''; kb.classList.toggle('on', n.kill !== null && left <= 0); }
  const ub = document.getElementById('susA-use'); if (ub) ub.querySelector('small').textContent = n.btn && n.task === null ? 'طوارئ' : 'استخدم';
}

/* ---------- المهمات (ألعاب صغيرة) ---------- */
function susTaskClose() { const T = document.getElementById('susTask'); if (T) { T.hidden = true; T.innerHTML = ''; } SUSG.task = null; }
function susTaskOpen(id) {
  const T = document.getElementById('susTask'), M = SUSG.map.tasks[id]; if (!T) return; SUSG.task = id; T.hidden = false; T.innerHTML = '';
  const box = el('div', 'susTBox'); box.appendChild(el('h4', '', '🛠️ ' + M.n)); const x = el('button', 'susTX', '✖'); x.onclick = susTaskClose; box.appendChild(x);
  const done = () => { susSfx('task'); box.appendChild(el('div', 'susTOk', '✅ تمت!')); susSend({ t: 'sus_task', id }); setTimeout(susTaskClose, 650); };
  if (M.k === 'wires') {
    const cols = ['#ff4a5a', '#3ab0ff', '#ffd23a', '#4ade80'], L = cols.slice().sort(() => Math.random() - 0.5), Rr = cols.slice().sort(() => Math.random() - 0.5), cv = el('canvas'); cv.width = 520; cv.height = 360; cv.className = 'susTCv'; box.appendChild(cv); box.appendChild(el('small', '', 'دوس على سلك من اليسار وبعدين على نفس لونه باليمين'));
    const g = cv.getContext('2d'), con = {}; let sel = null; const yOf = i => 60 + i * 80;
    const draw = () => { g.fillStyle = '#2a2438'; g.fillRect(0, 0, 520, 360); L.forEach((c, i) => { g.fillStyle = c; g.fillRect(20, yOf(i) - 16, 50, 32); if (sel === i) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(18, yOf(i) - 18, 54, 36); } }); Rr.forEach((c, i) => { g.fillStyle = c; g.fillRect(450, yOf(i) - 16, 50, 32); }); for (const li in con) { const ri = con[li]; g.strokeStyle = L[li]; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(70, yOf(+li)); g.bezierCurveTo(250, yOf(+li), 270, yOf(ri), 450, yOf(ri)); g.stroke(); } };
    cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * 520, py = (e.clientY - r.top) / r.height * 360, i = Math.round((py - 60) / 80); if (i < 0 || i > 3) return; if (px < 140) { if (con[i] === undefined) { sel = i; susSfx('click'); } } else if (px > 380 && sel !== null) { if (Rr[i] === L[sel]) { con[sel] = i; susSfx('click'); sel = null; if (Object.keys(con).length === 4) { draw(); return done(); } } else { sel = null; try { blip('square', 200, 120, 0.12, 0.05); } catch (er) {} } } draw(); });
    draw();
  } else if (M.k === 'hold') {
    const bar = el('div', 'susBar'), fill = el('i'); bar.appendChild(fill); const b = el('button', 'susHold', '👆 اضغط وكمّل ضاغط'); box.append(bar, b); box.appendChild(el('small', '', 'خلي إصبعك ضاغط لحد ما يتعبّى الشريط'));
    let p = 0, on = false, tm = 0; const step = () => { if (!SUSG.task && SUSG.task !== 0) return; p = on ? Math.min(1, p + 0.012) : Math.max(0, p - 0.02); fill.style.width = (p * 100) + '%'; if (p >= 1) { clearInterval(tm); return done(); } };
    tm = setInterval(step, 30); b.addEventListener('pointerdown', e => { on = true; e.preventDefault(); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { on = false; }));
  } else {
    const grid = el('div', 'susSeq'), nums = [1, 2, 3, 4, 5, '', '', '', ''].sort(() => Math.random() - 0.5); let nx = 1; box.appendChild(el('small', '', 'دوس الأرقام بالترتيب من 1 إلى 5'));
    nums.forEach(v => { const b = el('button', '', v === '' ? '' : String(v)); if (v === '') b.disabled = true; b.onclick = () => { if (v === nx) { b.classList.add('ok'); susSfx('click'); nx++; if (nx > 5) done(); } else { nx = 1; grid.querySelectorAll('.ok').forEach(q => q.classList.remove('ok')); try { blip('square', 200, 120, 0.12, 0.05); } catch (er) {} } }; grid.appendChild(b); }); box.appendChild(grid);
  }
  T.appendChild(box);
}

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
  const canMove = s.ph === 'play' && !SUSG.task && performance.now() - (SUSG.roleShown || 0) > 2600; let mv = false;
  if (canMove && (mx || my)) { const L = Math.hypot(mx, my), sp = 4.2 * Math.min(1, L); const vx = mx / L * sp, vy = my / L * sp; const ghost = !me.alive;
    if (ghost || susOk(m.x + vx, m.y)) m.x += vx; if (ghost || susOk(m.x, m.y + vy)) m.y += vy; m.x = Math.max(10, Math.min(M.w - 10, m.x)); m.y = Math.max(10, Math.min(M.h - 10, m.y)); if (Math.abs(vx) > 0.2) m.dir = vx > 0 ? 1 : -1; mv = true; }
  m.mv = mv; const nowP = performance.now(); if (s.ph === 'play' && nowP - SUSG.lastSend > 90 && (mv || SUSG.wasMv)) { susSend({ t: 'sus_pos', x: Math.round(m.x), y: Math.round(m.y), dir: m.dir, mv: mv ? 1 : 0 }); SUSG.lastSend = nowP; SUSG.wasMv = mv; }
  Object.keys(SUSG.pos).forEach(k => { const o = SUSG.pos[k]; if (!o || o.tx === undefined) return; o.x += (o.tx - o.x) * 0.3; o.y += (o.ty - o.y) * 0.3; });
  // الكاميرا
  const Z = Math.max(0.85, Math.min(1.7, Math.min(W / 400, H / 560)));   // تقريب مريح للموبايل SUSG.cam[0] += (m.x - SUSG.cam[0]) * 0.2; SUSG.cam[1] += (m.y - SUSG.cam[1]) * 0.2;
  c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H); c.save(); c.translate(W / 2, H / 2); c.scale(Z, Z); c.translate(-SUSG.cam[0], -SUSG.cam[1]);
  // نجوم الفضاء
  c.fillStyle = '#fff'; for (let i = 0; i < 160; i++) { const x = (i * 197) % 2200 - 300, y = (i * 131) % 1500 - 250; c.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t / 40 + i)); c.fillRect(x, y, 2, 2); } c.globalAlpha = 1;
  // السفينة: الممرات والغرف
  c.fillStyle = '#7a8296'; M.walk.forEach(r => { c.fillRect(r[0] - 10, r[1] - 10, r[2] + 20, r[3] + 20); });
  M.cor.forEach(r => { c.fillStyle = '#4a4f62'; c.fillRect(r[0], r[1], r[2], r[3]); c.fillStyle = 'rgba(255,255,255,.05)'; for (let x = r[0]; x < r[0] + r[2]; x += 20) c.fillRect(x, r[1], 1, r[3]); });
  M.rooms.forEach(R => { const r = R.r; c.fillStyle = R.f; c.fillRect(r[0], r[1], r[2], r[3]); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; for (let x = r[0]; x <= r[0] + r[2]; x += 40) { c.beginPath(); c.moveTo(x, r[1]); c.lineTo(x, r[1] + r[3]); c.stroke(); } for (let y = r[1]; y <= r[1] + r[3]; y += 40) { c.beginPath(); c.moveTo(r[0], y); c.lineTo(r[0] + r[2], y); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.18)'; c.font = 'bold 26px Cairo, system-ui'; c.textAlign = 'center'; c.fillText(R.n, r[0] + r[2] / 2, r[1] + 34); });
  // طاولة الطوارئ
  { const b = M.button; c.fillStyle = '#9aa0b8'; c.beginPath(); c.ellipse(b[0], b[1], 46, 26, 0, 0, 7); c.fill(); c.fillStyle = '#c0c6dc'; c.beginPath(); c.ellipse(b[0], b[1] - 4, 42, 22, 0, 0, 7); c.fill(); c.fillStyle = '#d0202a'; c.beginPath(); c.ellipse(b[0], b[1] - 8, 14, 9, 0, 0, 7); c.fill(); c.fillStyle = '#ff5a5a'; c.beginPath(); c.ellipse(b[0], b[1] - 11, 10, 6, 0, 0, 7); c.fill(); }
  // المهمات
  M.tasks.forEach((T, id) => { const mine = me.role === 'crew' && (s.tasks || []).some(q => q.id === id && !q.done); c.fillStyle = '#2a2e40'; c.fillRect(T.x - 18, T.y - 30, 36, 30); c.fillStyle = mine ? '#ffd23a' : '#55607a'; c.fillRect(T.x - 14, T.y - 26, 28, 18);
    if (mine) { c.font = 'bold 22px system-ui'; c.textAlign = 'center'; c.fillStyle = '#ffd23a'; c.fillText('❗', T.x, T.y - 38 + Math.sin(t / 8) * 3); } });
  // الأجساد والشخصيات
  const draw = []; (s.bodies || []).forEach(b => draw.push([b.y - 5, () => susBodyDraw(c, b, t)]));
  s.players.forEach(p => { if (p.left) return; let q = SUSG.pos[p.i]; if (p.me) q = { x: m.x, y: m.y, dir: m.dir, mv: m.mv, alive: me.alive ? 1 : 0 }; if (!q) return; const ghost = !p.alive && !(s.bodies || []).some(b => b.i === p.i && false); if (!p.alive && me.alive) return;
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
  if (t % 6 === 0) susActUpd();
}
