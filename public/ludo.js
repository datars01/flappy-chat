/* ===================== لعبة «غوكو» 🎲 — الواجهة =====================
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
/* ---------- الأصوات: بدل الأصوات القليلة، لكل شي بالعبة صوت (أزرار، نرد، خطوات، أكل، بيت، عد تنازلي...) ---------- */
function ludoAc() { try { if (window.unlockAudio) unlockAudio(); return (typeof actx !== 'undefined' && actx && actx.state === 'running') ? actx : null; } catch (e) { return null; } }
function ludoSfx(k) {
  try {
    if (typeof sfxOn !== 'undefined' && !sfxOn) return; if (!ludoAc()) return;
    const B = blip, N = (d, v, dl, hp) => { try { burst(d, v, dl, hp); } catch (e) {} };
    switch (k) {
      case 'click': B('sine', 920, 620, 0.05, 0.05); break;
      case 'tap': B('triangle', 520, 800, 0.08, 0.06); break;
      case 'roll': for (let i = 0; i < 9; i++) B('square', 150 + (i % 3) * 40, 110, 0.04, 0.03, i * 0.1); N(0.8, 0.025, 0, 2600); break;
      case 'land': B('sine', 130, 55, 0.2, 0.14); N(0.07, 0.05, 0, 900); break;
      case 'six': [784, 988, 1175, 1568].forEach((f, i) => B('sine', f, f, 0.22, 0.07, i * 0.07)); break;
      case 'sixes': B('sawtooth', 220, 90, 0.35, 0.06); B('square', 160, 80, 0.4, 0.04, 0.12); break;
      case 'step': B('triangle', 720, 580, 0.05, 0.035); break;
      case 'move': B('sine', 520, 700, 0.08, 0.06); break;
      case 'cap': B('sawtooth', 420, 90, 0.3, 0.07); B('sine', 90, 45, 0.3, 0.12, 0.02); N(0.12, 0.08, 0, 1200); break;
      case 'home': [523, 659, 784, 1047, 1319].forEach((f, i) => B('sine', f, f, 0.3, 0.07, i * 0.07)); break;
      case 'turn': B('triangle', 880, 880, 0.12, 0.06); B('triangle', 1175, 1175, 0.16, 0.05, 0.09); break;
      case 'ready': B('sine', 660, 880, 0.1, 0.06); B('sine', 990, 990, 0.12, 0.05, 0.08); break;
      case 'unready': B('sine', 620, 430, 0.1, 0.05); break;
      case 'allready': [523, 659, 784, 1047].forEach((f, i) => B('triangle', f, f, 0.2, 0.07, i * 0.1)); break;
      case 'join': B('sine', 784, 784, 0.15, 0.06); B('sine', 1047, 1047, 0.22, 0.06, 0.12); break;
      case 'leave': B('sine', 700, 450, 0.2, 0.05); break;
      case 'start': B('sawtooth', 180, 880, 0.55, 0.03); N(0.5, 0.03, 0, 1800); break;
      case 'cd': B('sine', 660, 660, 0.14, 0.09); break;
      case 'cdgo': B('sine', 1320, 1320, 0.45, 0.09); B('sine', 880, 880, 0.45, 0.06); break;
      case 'err': B('square', 210, 150, 0.16, 0.04); break;
      case 'emo': B('sine', 500, 950, 0.09, 0.06); break;
      case 'win': [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3], [1319, 0.42]].forEach(q => B('sine', q[0], q[0], 0.25, 0.08, q[1])); break;
      case 'lose': [[392, 0], [349, 0.18], [294, 0.36], [247, 0.54]].forEach(q => B('triangle', q[0], q[0], 0.25, 0.06, q[1])); break;
      default: B('sine', 600, 600, 0.05, 0.04);
    }
  } catch (e) {}
}
/* ---------- موسيقى هادية: بيانو/باد ناعم + أجراس خفيفة بصدى، تشتغل بس وإنت بشاشة اللودو الرئيسية (تحترم زر الموسيقى) ---------- */
var LMUS = { bus: null, next: 0, step: 0 };
const LCH = [[48, 55, 59, 64], [45, 52, 60, 64], [41, 53, 57, 64], [43, 55, 59, 62]];   // Cmaj7 · Am7 · Fmaj7 · G6
const LPENT = [72, 74, 76, 79, 81, 84, 79, 76];
function ludoMusicWanted() { try { return !!(musicOn && !document.hidden && typeof curPage !== 'undefined' && curPage === 'ludo'); } catch (e) { return false; } }
function lnote(type, f, t, dur, vol, att) {
  const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; o.connect(g); g.connect(LMUS.bus);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.start(t); o.stop(t + dur + 0.05);
}
function ludoMusicTick() {
  const want = ludoMusicWanted(); if (!want && !LMUS.bus) return; const a = ludoAc(); if (!a) return;
  if (!LMUS.bus) {
    const bus = a.createGain(), lp = a.createBiquadFilter(), dl = a.createDelay(1), fb = a.createGain(), dlp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; dlp.type = 'lowpass'; dlp.frequency.value = 1100; dl.delayTime.value = 0.46; fb.gain.value = 0.42;
    bus.gain.value = 0.0001; bus.connect(lp); lp.connect(a.destination); lp.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(a.destination);   // صدى ناعم
    LMUS.bus = bus; LMUS.next = a.currentTime + 0.2; LMUS.step = 0;
  }
  const now = a.currentTime; LMUS.bus.gain.setTargetAtTime(want ? 0.55 : 0.0001, now, want ? 1.4 : 0.4);
  if (!want) { if (LMUS.next < now) LMUS.next = now + 0.3; return; }
  const CH = 6.4;
  while (LMUS.next < now + 1.5) {
    const ch = LCH[LMUS.step % 4], t = LMUS.next;
    lnote('sine', mhz(ch[0] - 12), t, CH + 0.6, 0.07, 1.2);                                        // باس
    [1, 2, 3].forEach((q, i) => { lnote('sine', mhz(ch[q]), t + i * 0.05, CH + 0.4, 0.034, 1.5); lnote('triangle', mhz(ch[q]) * 1.004, t + i * 0.05, CH + 0.4, 0.012, 1.6); });   // باد
    const n = 3 + Math.floor(Math.random() * 3);                                                    // أجراس قليلة وعشوائية
    for (let i = 0; i < n; i++) { const f = mhz(LPENT[Math.floor(Math.random() * LPENT.length)]), at = t + 0.6 + i * (CH / n) + Math.random() * 0.5; lnote('sine', f, at, 3.2, 0.045, 0.02); lnote('sine', f * 2, at, 1.2, 0.01, 0.02); }
    LMUS.next += CH; LMUS.step++;
  }
}
setInterval(() => { try { ludoMusicTick(); } catch (e) {} }, 250);
document.addEventListener('pointerdown', e => { try { const b = e.target.closest && e.target.closest('#pg-ludo button, #rmLudo button'); if (b && !b.closest('#ludoDice') && !b.disabled) ludoSfx('click'); } catch (er) {} }, true);
/* مكان الحجر (بوحدات الخلية) حسب المقعد والموقع */
function ludoCell(seat, pos, k) {
  if (pos < 0) { const b = LUDO_BASE[seat]; return [b[0] + (k % 2 ? 4 : 2) + 0.5, b[1] + (k > 1 ? 4 : 2) + 0.5]; }
  if (pos <= 50) { const c = LUDO_TRACK[(LUDO_START[seat] + pos) % 52]; return [c[0] + 0.5, c[1] + 0.5]; }
  const c = LUDO_LANE[seat][Math.min(5, pos - 51)]; return [c[0] + 0.5, c[1] + 0.5];
}
function ludoOpen() {
  if (!auth) { showToast('✍️ سجّل حساب حتى تلعب غوكو'); closePage(); setTimeout(() => openPage('account'), 200); return; }
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
  ludoSfx('emo');
}
function ludoRmOpen() { LUDOG.mode = 'rm'; LUDOG.s = null; LUDOG.disp = {}; LUDOG.fx = []; ludoCss(); const o = document.getElementById('rmLudo'); if (o) o.hidden = false; const x = document.getElementById('rmLdX'); if (x) x.onclick = () => { try { rmStand(); } catch (e) {} }; ludoRender(); }
function ludoRmClose() { LUDOG.mode = 'page'; cancelAnimationFrame(LUDOG.raf); LUDOG.raf = 0; LUDOG.s = null; LUDOG.cv = null; const o = document.getElementById('rmLudo'); if (o) o.hidden = true; const b = document.getElementById('rmLdBody'); if (b) b.innerHTML = ''; }
function ludoMsg(d) {
  if (d.t === 'ludo_emo') return ludoEmoFloat(d.s, d.e);
  if (d.t === 'ludo_allready') { ludoSfx('allready'); showToast(d.host ? '✅ الكل جاهز! دوس «ابدأ اللعبة» 👑' : '✅ الكل جاهز — بانتظار الهوست يشغّل اللعبة'); try { navigator.vibrate && navigator.vibrate([50, 40, 50]); } catch (e) {} return; }
  if (d.t === 'ludo_join') { ludoSfx('join'); showToast('👋 دخل ' + d.n + ' الطاولة' + (d.cnt >= 2 ? ' — اضغط «استعداد» ✅' : '')); try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (e) {} return; }
  if (d.t === 'ludo_state') { const old = LUDOG.s; LUDOG.s = d.s; ludoOnState(old, d.s); }
  else if (d.t === 'ludo_list') ludoRenderList(d.list);
  else if (d.t === 'ludo_err') { ludoSfx('err'); showToast('⚠️ ' + d.error); }
}
function ludoOnState(old, s) {
  if (s && s.last && s.last.id !== LUDOG.lastEv) {
    LUDOG.lastEv = s.last.id; LUDOG.last = s.last;
    if (s.last.k === 'roll') { LUDOG.rolling = performance.now() + 1000; LUDOG.dice = s.last.d; ludoSfx('roll'); const dv = s.last.d; setTimeout(() => ludoSfx(dv === 6 ? 'six' : 'land'), 980); }
    else if (s.last.k === 'sixes') { ludoSfx('sixes'); showToast('🎲 ثلاث ستات ورا بعض، ضاع الدور!'); }
    else if (s.last.k === 'move') {   /* المؤثرات تنتظر لين تنتهي قفزات الخرزة خانة خانة */
      const L = s.last, prev = (old && old.seats[L.s] && old.seats[L.s].tk[L.tk]), steps = (prev === undefined || prev < 0 || L.pos < 0) ? 1 : Math.max(1, L.pos - prev), wait = Math.min(1800, steps * 150 + (L.cap ? 60 : 0));
      setTimeout(() => { try { ludoSfx(L.cap ? 'cap' : L.home ? 'home' : 'move'); const q = ludoCell(L.s, L.pos, L.tk); ludoBurst(q[0], q[1], L.cap ? 'cap' : L.home ? 'home' : 'dust', LUDO_COL[L.s].c); if (L.cap) LUDOG.shake = performance.now() + 380; } catch (e) {} }, wait); }
  }
  if (s && s.ph === 'over' && (!old || old.ph !== 'over')) { ludoSfx(s.win && s.win.s === s.my ? 'win' : 'lose'); LUDOG.winT = performance.now(); ludoConfetti(); }
  if (s && s.ph === 'play' && old && old.ph === 'lobby') { LUDOG.cd = performance.now() + 3000; LUDOG.cdN = 0; ludoSfx('start'); setTimeout(() => { try { ludoUpdate(); } catch (e) {} }, 3100); }
  if (s && s.ph === 'play' && s.turn === s.my && (!old || old.turn !== s.turn || old.ph !== 'play') && !((LUDOG.cd || 0) > performance.now())) { ludoSfx('turn'); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} }
  if (s && old && s.ph === 'lobby' && old.ph === 'lobby') {   /* أصوات الغرفة: استعداد / دخول / طلوع */
    const rd = x => x.seats.filter(p => p && p.rdy).length, nn = x => x.seats.filter(Boolean).length;
    if (rd(s) > rd(old)) ludoSfx('ready'); else if (rd(s) < rd(old) && nn(s) >= nn(old)) ludoSfx('unready');
    if (nn(s) < nn(old)) ludoSfx('leave');
  }
  const ph = s ? s.ph : ''; const R = ludoRoot();
  if (R && (R.dataset.ph !== ph || ph === 'lobby')) { ludoRender(); } else ludoUpdate();
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
  const hero = lel('div', 'ludoHero'); hero.append(lel('div', 'ludoHeroEm', '🎲'), lel('h2', '', 'غوكو'), lel('div', 'ludoHeroDots', '🔴 🟢 🟡 🔵'), lel('p', '', 'طاولة بـ 4 مقاعد. تكدرون تلعبون لاعبين اثنين بس، أو لين 4. اللي يوصّل أحجاره الأربعة للبيت أول يفوز!'));
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
  const n = s.seats.filter(Boolean).length, rd = s.seats.filter(p => p && p.rdy).length, host = s.seats.find(p => p && p.host), iAmHost = !!(me && me.host);
  w.appendChild(lel('h3', 'ludoH', '🎲 غرفة الانتظار (' + n + '/4)'));
  if (s.priv) { const cb = lel('div', 'ludoCode'); cb.innerHTML = 'رمز الطاولة: <b>' + s.code + '</b> — دزه لأصدقائك'; w.appendChild(cb); }
  const g = lel('div', 'ludoSeats');
  s.seats.forEach((p, i) => {
    const C = LUDO_COL[i], c = lel('div', 'ludoSeat' + (p ? '' : ' empty') + (p && p.me ? ' me' : '') + (p && p.rdy ? ' rdy' : '')); c.style.setProperty('--c', C.c); c.style.setProperty('--d', C.d);
    const dot = lel('span', 'ludoDot'); c.appendChild(dot);
    if (p) { c.appendChild(lel('b', '', (p.host ? '👑 ' : '') + p.n)); c.appendChild(lel('small', 'ludoSt' + (p.rdy ? ' ok' : ''), (p.rdy ? '✅ جاهز' : '⏳ ما جاهز') + (p.host ? ' • الهوست' : ''))); }
    else { c.appendChild(lel('b', '', 'مقعد فارغ')); c.appendChild(lel('small', '', C.n)); if (me && !ludoRm()) { const sb = lel('button', 'ludoSit', '🪑 اجلس هنا'); sb.onclick = () => ludoSend({ t: 'ludo_seat', s: i }); c.appendChild(sb); } }
    g.appendChild(c);
  });
  w.appendChild(g);
  if (me) {
    if (n < 2) { const st = lel('button', 'ludoBtn big', '⏳ بانتظار لاعب ثاني...'); st.disabled = true; w.appendChild(st); }
    else {
      w.appendChild(lel('div', 'ludoReady' + (s.allRdy ? ' all' : ''), s.allRdy ? '✅ الكل جاهز!' : '✅ جاهزين ' + rd + ' من ' + n));
      const st = lel('button', 'ludoBtn big' + (me.rdy ? ' ghost' : ' pulse'), me.rdy ? '✔️ أنت جاهز — اضغط للتراجع' : '✅ استعداد'); st.onclick = () => ludoSend({ t: 'ludo_ready' }); w.appendChild(st);
      if (iAmHost) { const gb = lel('button', 'ludoBtn big go' + (s.allRdy ? ' pulse' : ''), s.allRdy ? '▶️ ابدأ اللعبة' : '▶️ ابدأ اللعبة (بانتظار الكل ' + rd + '/' + n + ')'); gb.disabled = !s.allRdy; gb.onclick = () => ludoSend({ t: 'ludo_start' }); w.appendChild(gb); w.appendChild(lel('small', 'ludoNote', '👑 إنت الهوست (أول واحد دخل) — إنت اللي تشغّل اللعبة بعد ما الكل يستعد')); }
      else w.appendChild(lel('small', 'ludoNote', s.allRdy ? '⏳ بانتظار الهوست 👑 ' + (host ? host.n : '') + ' يشغّل اللعبة...' : '👑 ' + (host ? host.n : 'أول واحد دخل') + ' هو الهوست — يشغّل اللعبة بعد ما الكل يستعد'));
    }
  }
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
  const bar = lel('div', 'ludoBar'); const dice = ludoDiceEl(); dice.onclick = () => { const s = LUDOG.s; if (s && s.ph === 'play' && s.turn === s.my && !s.rolled && !((LUDOG.cd || 0) > performance.now())) ludoSend({ t: 'ludo_roll' }); };
  const msg = lel('div', 'ludoMsg'); msg.id = 'ludoMsg'; bar.append(dice, msg);
  const lv = lel('button', 'ludoBtn ghost small', '🚪 طلوع'); lv.onclick = () => { if (confirm('تطلع من اللعبة؟')) ludoSend({ t: 'ludo_leave' }); };
  w.append(top, cv, bar, ludoEmoBar()); if (!ludoRm()) w.appendChild(lv); return w;
}
function ludoUpdate() {
  const s = LUDOG.s; if (!s || s.ph === 'lobby') return;
  const top = document.getElementById('ludoTop'), msg = document.getElementById('ludoMsg'), dice = document.getElementById('ludoDice'); if (!top || !msg || !dice) return;
  top.innerHTML = ''; s.seats.forEach((p, i) => { if (!p) return; const C = LUDO_COL[i], c = lel('span', 'ludoChip' + (s.ph === 'play' && s.turn === i ? ' on' : '') + (p.left ? ' off' : '')); c.dataset.seat = i; c.style.setProperty('--c', C.c); c.textContent = (p.me ? '⭐ ' : '') + p.n + (p.left ? ' (طلع)' : '') + ' ' + p.tk.filter(x => x === 56).length + '/4'; top.appendChild(c); });
  const mine = s.my, myTurn = s.ph === 'play' && s.turn === mine;
  dice.disabled = !(myTurn && !s.rolled) || (LUDOG.cd || 0) > performance.now(); dice.classList.toggle('go', myTurn && !s.rolled);
  if (s.ph === 'over') { const w = s.seats[s.win.s]; msg.textContent = '🏆 فاز ' + (w ? w.n : '؟') + (s.win.why ? ' (' + s.win.why + ')' : '') + ' — ترجعون للانتظار بعد لحظات'; }
  else if (myTurn) msg.textContent = s.rolled ? (s.movable.length ? '👆 دوس على حجر مضيء حتى تحركه' : 'ماكو حركة متاحة...') : '🎲 دورك! دوس النرد';
  else { const t = s.seats[s.turn]; msg.textContent = '⏳ دور ' + (t ? t.n : '؟') + ' (' + (LUDO_COL[s.turn] || {}).n + ')'; }
}
function ludoLoop() {
  cancelAnimationFrame(LUDOG.raf);
  const step = () => { if (!document.getElementById('ludoCv')) { LUDOG.raf = 0; return; } ludoDraw(); LUDOG.raf = requestAnimationFrame(step); };
  LUDOG.raf = requestAnimationFrame(step);
}
/* ---------- لوحة احترافية: إطار خشب بتعريق + رخام + خانات بارزة + أعشاش غائرة (تنرسم مرة وحدة وتنخزّن) ---------- */
function ludoRR(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ludoBoardCache(G) {
  const key = G.sz + '_' + G.dpr; if (LUDOG.bgKey === key && LUDOG.bg) return LUDOG.bg;
  const sz = G.sz, dpr = G.dpr, pad = G.pad, u = G.u, bgc = document.createElement('canvas'); bgc.width = Math.round(sz * dpr); bgc.height = Math.round(sz * dpr);
  const c = bgc.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;   // عشوائي ثابت (حتى ما تتغيّر العروق كل مرة)
  /* الإطار الخشبي */
  const wg = c.createLinearGradient(0, 0, sz, sz); wg.addColorStop(0, '#9a6232'); wg.addColorStop(0.3, '#b87a42'); wg.addColorStop(0.6, '#8a5428'); wg.addColorStop(1, '#6a3d1a');
  c.fillStyle = wg; ludoRR(c, 0, 0, sz, sz, sz * 0.045); c.fill();
  c.save(); ludoRR(c, 0, 0, sz, sz, sz * 0.045); c.clip(); for (let i = 0; i < 46; i++) { const y = rnd() * sz; c.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '60,30,10' : '255,210,150') + ',' + (0.05 + rnd() * 0.09) + ')'; c.lineWidth = 0.6 + rnd() * 1.6; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(sz * 0.3, y + (rnd() - 0.5) * 14, sz * 0.65, y + (rnd() - 0.5) * 14, sz, y + (rnd() - 0.5) * 8); c.stroke(); } c.restore();
  c.strokeStyle = 'rgba(255,230,180,.6)'; c.lineWidth = 2; ludoRR(c, 1.5, 1.5, sz - 3, sz - 3, sz * 0.045); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2; ludoRR(c, 3.5, 3.5, sz - 7, sz - 7, sz * 0.04); c.stroke();
  /* الإطار الذهبي حول اللوحة + ظل للداخل */
  c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 10; c.fillStyle = '#e9c46a'; ludoRR(c, pad - 3, pad - 3, sz - 2 * pad + 6, sz - 2 * pad + 6, 8); c.fill(); c.restore();
  const gg = c.createLinearGradient(0, pad, 0, sz - pad); gg.addColorStop(0, '#fff2b8'); gg.addColorStop(0.5, '#d9a93a'); gg.addColorStop(1, '#a47a1e'); c.fillStyle = gg; ludoRR(c, pad - 3, pad - 3, sz - 2 * pad + 6, sz - 2 * pad + 6, 8); c.fill();
  /* أرضية رخام */
  c.save(); c.translate(pad, pad); const bs = u * 15; const mg = c.createLinearGradient(0, 0, bs, bs); mg.addColorStop(0, '#fffdf6'); mg.addColorStop(0.5, '#f4ecd9'); mg.addColorStop(1, '#e9dfc6');
  c.fillStyle = mg; ludoRR(c, 0, 0, bs, bs, 5); c.fill(); c.save(); ludoRR(c, 0, 0, bs, bs, 5); c.clip();
  for (let i = 0; i < 9; i++) { c.strokeStyle = 'rgba(150,130,100,' + (0.05 + rnd() * 0.06) + ')'; c.lineWidth = 0.6 + rnd() * 1.1; c.beginPath(); let x = rnd() * bs, y = rnd() * bs; c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - 0.3) * bs * 0.3; y += (rnd() - 0.3) * bs * 0.3; c.quadraticCurveTo(x + (rnd() - 0.5) * 30, y + (rnd() - 0.5) * 30, x, y); } c.stroke(); } c.restore();
  const tile = (x, y, top, bot, ln) => { const w = u - u * 0.1, px = x * u + u * 0.05, py = y * u + u * 0.05; c.save(); c.shadowColor = 'rgba(0,0,0,.28)'; c.shadowBlur = u * 0.12; c.shadowOffsetY = u * 0.05; const g = c.createLinearGradient(px, py, px, py + w); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; ludoRR(c, px, py, w, w, u * 0.15); c.fill(); c.restore();
    c.strokeStyle = ln || 'rgba(0,0,0,.2)'; c.lineWidth = 1; ludoRR(c, px, py, w, w, u * 0.15); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px + u * 0.18, py + 1.6); c.lineTo(px + w - u * 0.18, py + 1.6); c.stroke(); };
  /* البيوت الأربعة: لوح ملوّن + لوح فاتح + 4 أعشاش غائرة */
  LUDO_BASE.forEach((b, i) => { const C = LUDO_COL[i], x = b[0] * u, y = b[1] * u, w = 6 * u;
    c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = u * 0.25; c.shadowOffsetY = u * 0.08; const g = c.createLinearGradient(x, y, x + w, y + w); g.addColorStop(0, ludoMix(C.c, 255, 0.28)); g.addColorStop(0.5, C.c); g.addColorStop(1, C.d); c.fillStyle = g; ludoRR(c, x + u * 0.06, y + u * 0.06, w - u * 0.12, w - u * 0.12, u * 0.4); c.fill(); c.restore();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.5; ludoRR(c, x + u * 0.12, y + u * 0.12, w - u * 0.24, w - u * 0.24, u * 0.36); c.stroke();
    const ig = c.createLinearGradient(x, y, x + w, y + w); ig.addColorStop(0, ludoMix(C.l, 255, 0.5)); ig.addColorStop(1, C.l); c.fillStyle = ig; ludoRR(c, x + u, y + u, 4 * u, 4 * u, u * 0.55); c.fill(); c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 2; ludoRR(c, x + u, y + u, 4 * u, 4 * u, u * 0.55); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; ludoRR(c, x + u + 2, y + u + 2, 4 * u - 4, 4 * u - 4, u * 0.5); c.stroke();
    [[2, 2], [4, 2], [2, 4], [4, 4]].forEach(q => { const cx = (b[0] + q[0] + 0.5) * u, cy = (b[1] + q[1] + 0.5) * u, R = u * 0.5;
      const sg = c.createRadialGradient(cx + R * 0.2, cy + R * 0.25, R * 0.1, cx, cy, R); sg.addColorStop(0, ludoMix(C.d, 0, 0.1)); sg.addColorStop(0.7, ludoMix(C.c, 0, 0.1)); sg.addColorStop(1, ludoMix(C.l, 0, 0.1)); c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.38)'; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, R, Math.PI * 0.95, Math.PI * 1.9); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, R, Math.PI * 0.05, Math.PI * 0.9); c.stroke(); }); });
  /* المسار */
  LUDO_TRACK.forEach(q => tile(q[0], q[1], '#ffffff', '#ece4d0'));
  LUDO_START.forEach((a, i) => { const q = LUDO_TRACK[a], C = LUDO_COL[i]; tile(q[0], q[1], ludoMix(C.c, 255, 0.3), C.d, 'rgba(0,0,0,.3)'); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.8; c.beginPath(); c.arc((q[0] + 0.5) * u, (q[1] + 0.5) * u, u * 0.26, 0, 7); c.stroke(); });
  const DIR = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  LUDO_LANE.forEach((ln, i) => { const C = LUDO_COL[i], d = DIR[i]; ln.forEach(q => { tile(q[0], q[1], ludoMix(C.c, 255, 0.4), ludoMix(C.c, 0, 0.12), 'rgba(0,0,0,.28)'); const cx = (q[0] + 0.5) * u, cy = (q[1] + 0.5) * u, a = u * 0.2; c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(cx + d[0] * a * 1.2, cy + d[1] * a * 1.2); c.lineTo(cx - d[0] * a - d[1] * a, cy - d[1] * a + d[0] * a); c.lineTo(cx - d[0] * a + d[1] * a, cy - d[1] * a - d[0] * a); c.closePath(); c.fill(); }); });
  /* النجوم (الخانات الآمنة) */
  LUDO_SAFE.forEach(a => { if (LUDO_START.includes(a)) return; const q = LUDO_TRACK[a], cx = (q[0] + 0.5) * u, cy = (q[1] + 0.52) * u; const sg = c.createLinearGradient(cx, cy - u * 0.4, cx, cy + u * 0.4); sg.addColorStop(0, '#ffe58a'); sg.addColorStop(1, '#d8991a'); c.save(); c.shadowColor = 'rgba(160,100,0,.5)'; c.shadowBlur = 3; c.fillStyle = sg; ludoStar(c, cx, cy, u * 0.38, u * 0.16); c.fill(); c.restore(); c.strokeStyle = 'rgba(120,70,0,.55)'; c.lineWidth = 0.9; ludoStar(c, cx, cy, u * 0.38, u * 0.16); c.stroke(); });
  /* المركز: 4 مثلثات مضيئة + جوهرة */
  const tri = (pts, i) => { const C = LUDO_COL[i]; const g = c.createLinearGradient(pts[0] * u, pts[1] * u, pts[4] * u, pts[5] * u); g.addColorStop(0, ludoMix(C.c, 255, 0.35)); g.addColorStop(1, C.d); c.fillStyle = g; c.beginPath(); c.moveTo(pts[0] * u, pts[1] * u); c.lineTo(pts[2] * u, pts[3] * u); c.lineTo(pts[4] * u, pts[5] * u); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.stroke(); };
  tri([6, 6, 6, 9, 7.5, 7.5], 0); tri([6, 6, 9, 6, 7.5, 7.5], 1); tri([9, 6, 9, 9, 7.5, 7.5], 2); tri([6, 9, 9, 9, 7.5, 7.5], 3);
  const jg = c.createRadialGradient(7.4 * u, 7.35 * u, u * 0.05, 7.5 * u, 7.5 * u, u * 0.62); jg.addColorStop(0, '#fffbe0'); jg.addColorStop(0.5, '#ffd34d'); jg.addColorStop(1, '#b97c10'); c.fillStyle = jg; c.beginPath(); c.arc(7.5 * u, 7.5 * u, u * 0.6, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.4; c.stroke();
  c.restore();
  /* لمعة زجاجية خفيفة فوق كل شي */
  c.save(); ludoRR(c, pad, pad, sz - 2 * pad, sz - 2 * pad, 5); c.clip(); const gl = c.createLinearGradient(0, 0, sz, sz); gl.addColorStop(0, 'rgba(255,255,255,.16)'); gl.addColorStop(0.35, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,40,.1)'); c.fillStyle = gl; c.fillRect(0, 0, sz, sz); c.restore();
  LUDOG.bg = bgc; LUDOG.bgKey = key; return bgc;
}
function ludoGeom() {
  const cv = LUDOG.cv; const sz = Math.min(cv.parentNode.clientWidth, window.innerHeight * 0.62, 520) || 320; const dpr = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(sz * dpr)) { cv.width = Math.round(sz * dpr); cv.height = Math.round(sz * dpr); cv.style.width = sz + 'px'; cv.style.height = sz + 'px'; }
  const pad = Math.round(sz * 0.04); LUDOG.sz = sz; return { sz, dpr, pad, u: (sz - 2 * pad) / 15 };
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
/* ---------- خرزة حيّة وواقعية: بلاستيك لامع بإضاءة وظلال + وجه بعيون تتابع وترمش وتعابير (خوف، فرح، نوم، دوخة) ---------- */
function ludoMix(h, w, a) { const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return 'rgb(' + Math.round(r + (w - r) * a) + ',' + Math.round(g + (w - g) * a) + ',' + Math.round(b + (w - b) * a) + ')'; }
function ludoStar(c, x, y, R, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); }
function ludoPawn(c, x, gy, r, seat, t, o) {   /* (x, gy) = نقطة التماس مع اللوحة؛ الخرزة ترتفع للأعلى */
  const C = LUDO_COL[seat], i = o.idx, lw = Math.max(1, r * 0.07);
  const br = 1 + Math.sin(t / 520 + i * 1.7) * 0.022 + (o.excited ? Math.sin(t / 130 + i) * 0.03 : 0);   // تنفّس
  const sx = (o.sx || 1), sy = (o.sy || 1) * br;
  c.save(); c.translate(x, gy); c.rotate(o.tilt || 0); c.scale(sx, sy); c.lineJoin = 'round'; c.lineCap = 'round';
  /* القاعدة (قرص) */
  const bg = c.createLinearGradient(-r, 0, r, 0); bg.addColorStop(0, ludoMix(C.d, 0, 0.35)); bg.addColorStop(0.35, C.c); bg.addColorStop(0.55, ludoMix(C.c, 255, 0.45)); bg.addColorStop(1, ludoMix(C.d, 0, 0.3));
  c.fillStyle = bg; c.beginPath(); c.ellipse(0, -r * 0.14, r * 1.0, r * 0.3, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = lw * 0.8; c.beginPath(); c.ellipse(0, -r * 0.2, r * 0.97, r * 0.26, 0, Math.PI * 1.05, Math.PI * 1.75); c.stroke();
  /* الجسم: جرس مقعّر بتدرّج أفقي (يعطي حجم) */
  const bd = c.createLinearGradient(-r * 0.8, 0, r * 0.8, 0); bd.addColorStop(0, ludoMix(C.d, 0, 0.3)); bd.addColorStop(0.22, C.c); bd.addColorStop(0.42, ludoMix(C.c, 255, 0.5)); bd.addColorStop(0.62, C.c); bd.addColorStop(1, ludoMix(C.d, 0, 0.35));
  c.fillStyle = bd; c.beginPath(); c.moveTo(-r * 0.82, -r * 0.18); c.bezierCurveTo(-r * 0.55, -r * 0.34, -r * 0.4, -r * 0.8, -r * 0.3, -r * 1.14); c.lineTo(r * 0.3, -r * 1.14); c.bezierCurveTo(r * 0.4, -r * 0.8, r * 0.55, -r * 0.34, r * 0.82, -r * 0.18); c.quadraticCurveTo(0, r * 0.08, -r * 0.82, -r * 0.18); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.62, r * 0.07, r * 0.36, 0.18, 0, 7); c.fill();   // لمعة طولية
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(r * 0.46, -r * 0.5, r * 0.08, r * 0.3, -0.16, 0, 7); c.fill();           // ظل جانبي
  /* طوق الرقبة */
  const cg = c.createLinearGradient(-r * 0.5, 0, r * 0.5, 0); cg.addColorStop(0, ludoMix(C.d, 0, 0.2)); cg.addColorStop(0.45, ludoMix(C.c, 255, 0.65)); cg.addColorStop(1, ludoMix(C.d, 0, 0.3));
  c.fillStyle = cg; c.beginPath(); c.ellipse(0, -r * 1.14, r * 0.44, r * 0.13, 0, 0, 7); c.fill();
  /* الراس: كرة لامعة */
  const hy = -r * 1.66 + (o.bob || 0) * r, hr = r * 0.68;
  const hg = c.createRadialGradient(-hr * 0.38, hy - hr * 0.42, hr * 0.06, -hr * 0.05, hy, hr * 1.08);
  hg.addColorStop(0, ludoMix(C.c, 255, 0.78)); hg.addColorStop(0.3, ludoMix(C.c, 255, 0.18)); hg.addColorStop(0.72, C.c); hg.addColorStop(1, ludoMix(C.d, 0, 0.35));
  c.fillStyle = hg; c.beginPath(); c.arc(0, hy, hr, 0, 7); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw * 0.7; c.stroke();
  /* ظل الراس على الرقبة + ضوء ارتداد من الأسفل */
  c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(hr * 0.3, hy + hr * 0.72, hr * 0.45, hr * 0.16, 0.2, 0, 7); c.fill();
  /* الوجه */
  const look = o.look || [0, 0], ex = hr * 0.38, ey = hy + hr * 0.04, er = hr * 0.27 * (o.scared ? 1.2 : 1), blink = ((t / 1000 + i * 1.7) % 4.4) < 0.12;
  if (o.sleep) {
    c.strokeStyle = '#2a1a36'; c.lineWidth = lw * 1.1; [-1, 1].forEach(sg => { c.beginPath(); c.arc(sg * ex, ey - er * 0.1, er * 0.75, 0.12 * Math.PI, 0.88 * Math.PI); c.stroke(); });
  } else if (blink && !o.dizzy) {
    c.strokeStyle = '#2a1a36'; c.lineWidth = lw * 1.1; [-1, 1].forEach(sg => { c.beginPath(); c.moveTo(sg * ex - er * 0.8, ey); c.quadraticCurveTo(sg * ex, ey + er * 0.35, sg * ex + er * 0.8, ey); c.stroke(); });
  } else if (o.happy && !o.scared) {
    c.strokeStyle = '#2a1a36'; c.lineWidth = lw * 1.3; [-1, 1].forEach(sg => { c.beginPath(); c.arc(sg * ex, ey + er * 0.3, er * 0.78, 1.12 * Math.PI, 1.88 * Math.PI); c.stroke(); });   // عيون فرحانة ^ ^
  } else if (o.dizzy) {
    c.strokeStyle = '#2a1a36'; c.lineWidth = lw * 1.1; [-1, 1].forEach(sg => { c.beginPath(); for (let k = 0; k < 18; k++) { const a = k * 0.7 + t / 90, q = er * 0.78 * (k / 18); c.lineTo(sg * ex + Math.cos(a) * q, ey + Math.sin(a) * q); } c.stroke(); });
  } else {
    [-1, 1].forEach(sg => {
      const px = sg * ex, wy = ey; c.fillStyle = '#fff'; c.strokeStyle = 'rgba(30,10,40,.55)'; c.lineWidth = lw * 0.7; c.beginPath(); c.ellipse(px, wy, er, er * 1.12, 0, 0, 7); c.fill(); c.stroke();
      const pr = er * (o.scared ? 0.42 : 0.6), mx = er * 0.38; const pxx = px + look[0] * mx + (o.scared ? Math.sin(t / 60) * er * 0.12 : 0), pyy = wy + look[1] * mx;
      const pg = c.createRadialGradient(pxx - pr * 0.25, pyy - pr * 0.3, pr * 0.1, pxx, pyy, pr); pg.addColorStop(0, '#6b4a3a'); pg.addColorStop(0.45, '#2a1a30'); pg.addColorStop(1, '#0c0612');
      c.fillStyle = pg; c.beginPath(); c.arc(pxx, pyy, pr, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(pxx - pr * 0.32, pyy - pr * 0.34, pr * 0.3, 0, 7); c.fill(); c.globalAlpha = 0.7; c.beginPath(); c.arc(pxx + pr * 0.34, pyy + pr * 0.3, pr * 0.14, 0, 7); c.fill(); c.globalAlpha = 1;
      /* حاجب */
      c.strokeStyle = ludoMix(C.d, 0, 0.55); c.lineWidth = lw * 1.2; c.beginPath();
      if (o.scared) { c.moveTo(px - sg * er * 0.9, wy - er * 1.8); c.lineTo(px + sg * er * 0.9, wy - er * 1.25); }
      else if (o.excited) { c.moveTo(px - er * 0.9, wy - er * 1.5); c.quadraticCurveTo(px, wy - er * 1.95, px + er * 0.9, wy - er * 1.5); }
      else { c.moveTo(px - er * 0.8, wy - er * 1.45); c.quadraticCurveTo(px, wy - er * 1.7, px + er * 0.8, wy - er * 1.45); }
      c.stroke();
    });
  }
  c.fillStyle = 'rgba(255,90,120,.34)'; [-1, 1].forEach(sg => { c.beginPath(); c.ellipse(sg * hr * 0.62, hy + hr * 0.42, hr * 0.17, hr * 0.1, 0, 0, 7); c.fill(); });   // خدود
  c.strokeStyle = '#3a1226'; c.lineWidth = lw * 1.1; const my = hy + hr * 0.5;
  if (o.scared) { c.fillStyle = '#4a1230'; c.beginPath(); c.ellipse(0, my + hr * 0.05, hr * 0.12, hr * 0.17, 0, 0, 7); c.fill(); }
  else if (o.dizzy) { c.beginPath(); c.moveTo(-hr * 0.2, my); for (let k = 1; k <= 4; k++) c.lineTo(-hr * 0.2 + k * hr * 0.1, my + (k % 2 ? 1 : -1) * hr * 0.05); c.stroke(); }
  else if (o.happy) { c.fillStyle = '#6a1230'; c.beginPath(); c.ellipse(0, my - hr * 0.02, hr * 0.27, hr * 0.2, 0, 0, Math.PI); c.closePath(); c.fill(); c.fillStyle = '#ff7a9a'; c.beginPath(); c.ellipse(0, my + hr * 0.1, hr * 0.13, hr * 0.07, 0, 0, Math.PI); c.fill(); }
  else if (o.sleep) { c.beginPath(); c.arc(0, my + hr * 0.04, hr * 0.06, 0, 7); c.stroke(); }
  else if (o.excited) { c.beginPath(); c.arc(0, my - hr * 0.08, hr * 0.24, 0.12 * Math.PI, 0.88 * Math.PI); c.stroke(); }
  else { c.beginPath(); c.arc(0, my - hr * 0.1, hr * 0.17, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke(); }
  /* لمعة زجاجية على الراس */
  c.fillStyle = 'rgba(255,255,255,.82)'; c.beginPath(); c.ellipse(-hr * 0.42, hy - hr * 0.55, hr * 0.2, hr * 0.11, -0.7, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(-hr * 0.12, hy - hr * 0.74, hr * 0.06, 0, 7); c.fill();
  /* مؤثرات الحالة */
  if (o.scared) { c.fillStyle = 'rgba(120,210,255,.9)'; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = lw * 0.6; const sy2 = hy - hr * 0.5 + ((t / 7) % 18) * 0.01 * r; c.beginPath(); c.moveTo(hr * 1.0, sy2 - hr * 0.3); c.quadraticCurveTo(hr * 1.25, sy2 + hr * 0.1, hr * 1.0, sy2 + hr * 0.2); c.quadraticCurveTo(hr * 0.75, sy2 + hr * 0.1, hr * 1.0, sy2 - hr * 0.3); c.fill(); c.stroke(); }
  if (o.dizzy) { for (let k = 0; k < 3; k++) { const a = t / 260 + k * 2.09; c.fillStyle = '#ffd23a'; ludoStar(c, Math.cos(a) * hr * 1.0, hy - hr * 1.12 + Math.sin(a) * hr * 0.22, hr * 0.2, hr * 0.09); c.fill(); } }
  if (o.sleep) { c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2; c.font = 'bold ' + (r * 0.55) + 'px system-ui'; c.textAlign = 'center'; const ph = (t / 50) % 20, zy = hy - hr * 0.85 - ph * r * 0.035; c.globalAlpha = 1 - ph / 20; c.strokeText('z', hr * 0.95 + ph * r * 0.01, zy); c.fillText('z', hr * 0.95 + ph * r * 0.01, zy); c.globalAlpha = 1; }
  c.restore();
}
/* ---------- نرد ثلاثي الأبعاد: يتقلّب ويقفز وقت الرمي وبعدين يستقر على الرقم ---------- */
const LUDO_PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const LUDO_FACE = { 1: 'rotateY(0deg)', 2: 'rotateY(-90deg)', 3: 'rotateX(-90deg)', 4: 'rotateX(90deg)', 5: 'rotateY(90deg)', 6: 'rotateY(180deg)' };
function ludoDiceEl() {
  const b = lel('button', 'ludoDice'); b.id = 'ludoDice'; b.type = 'button'; const cube = lel('div', 'ludoCube'); cube.id = 'ludoCube';
  for (let n = 1; n <= 6; n++) { const f = lel('div', 'ludoFace f' + n); for (let i = 0; i < 9; i++) f.appendChild(LUDO_PIPS[n].includes(i) ? lel('i', n === 1 ? 'r' : '') : lel('b')); cube.appendChild(f); }
  b.append(lel('span', 'ludoDsh'), cube); cube.style.transform = 'rotateX(-22deg) rotateY(28deg) ' + LUDO_FACE[5]; return b;
}
function ludoDiceUpdate(t, s) {
  const b = document.getElementById('ludoDice'), cube = document.getElementById('ludoCube'); if (!b || !cube) return;
  const rolling = t < LUDOG.rolling;
  if (rolling && !LUDOG.dRoll) { LUDOG.dRoll = true; cube.classList.add('rolling'); b.classList.add('rolling'); b.classList.remove('land'); }
  else if (!rolling && LUDOG.dRoll) { LUDOG.dRoll = false; cube.classList.remove('rolling'); b.classList.remove('rolling'); b.classList.add('land'); setTimeout(() => b.classList.remove('land'), 450); }
  if (!rolling) { const v = s.dice || LUDOG.dice || 5; if (LUDOG.dShown !== v) { LUDOG.dShown = v; cube.style.transform = 'rotateX(-22deg) rotateY(28deg) ' + LUDO_FACE[v]; } }
}
function ludoDraw() {
  const s = LUDOG.s, cv = LUDOG.cv; if (!s || !cv) return; const G = ludoGeom(), c = cv.getContext('2d'), u = G.u, pad = G.pad; const t = performance.now();
  c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); c.clearRect(0, 0, G.sz, G.sz); c.save(); if ((LUDOG.shake || 0) > t) c.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
  c.drawImage(ludoBoardCache(G), 0, 0, G.sz, G.sz);
  c.save(); c.translate(pad, pad);
  /* وهج النجوم (حيّة) */
  LUDO_SAFE.forEach(a => { if (LUDO_START.includes(a)) return; const q = LUDO_TRACK[a], cx = (q[0] + 0.5) * u, cy = (q[1] + 0.52) * u, g = c.createRadialGradient(cx, cy, 0, cx, cy, u * 0.7); g.addColorStop(0, 'rgba(255,225,110,' + (0.28 + 0.2 * Math.sin(t / 500 + a)) + ')'); g.addColorStop(1, 'rgba(255,225,110,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, u * 0.7, 0, 7); c.fill(); });
  /* وهج بيت صاحب الدور */
  if (s.ph === 'play' && s.turn >= 0) { const C = LUDO_COL[s.turn], b = LUDO_BASE[s.turn]; c.save(); c.shadowColor = C.c; c.shadowBlur = 16 + 8 * Math.sin(t / 220); c.strokeStyle = '#fff'; c.globalAlpha = 0.75 + 0.2 * Math.sin(t / 220); c.lineWidth = 3; ludoRR(c, b[0] * u + 3, b[1] * u + 3, 6 * u - 6, 6 * u - 6, u * 0.4); c.stroke(); c.restore(); }
  /* الأحجار */
  const spots = ludoTokenSpots(s), me = s.my, mv = new Set(t < LUDOG.rolling ? [] : (s.movable || []));
  /* أهداف الحركة المتاحة (حلقات نابضة) */
  if (s.ph === 'play' && s.turn === me && s.rolled && mv.size) { spots.forEach(o => { if (o.seat !== me || !mv.has(o.k)) return; const tp = o.pos < 0 ? 0 : o.pos + s.dice; const q = ludoCell(me, tp, o.k), C = LUDO_COL[me]; const pr = 0.3 + 0.08 * Math.sin(t / 160); c.strokeStyle = C.c; c.globalAlpha = 0.9; c.lineWidth = 2.6; c.setLineDash([u * 0.16, u * 0.12]); c.lineDashOffset = -t / 60; c.beginPath(); c.arc(q[0] * u, q[1] * u, u * pr * 1.3, 0, 7); c.stroke(); c.setLineDash([]); c.globalAlpha = 0.25 + 0.15 * Math.sin(t / 160); c.fillStyle = C.c; c.beginPath(); c.arc(q[0] * u, q[1] * u, u * pr, 0, 7); c.fill(); c.globalAlpha = 1; }); }
  /* خوف: خرزة على خانة غير آمنة وخصم وراها بـ 1..6 خانات */
  const danger = o => { if (o.pos < 0 || o.pos > 50) return false; const a = (LUDO_START[o.seat] + o.pos) % 52; if (LUDO_SAFE.includes(a)) return false; return spots.some(q => q.seat !== o.seat && q.pos >= 0 && q.pos <= 50 && (() => { const dd = (a - (LUDO_START[q.seat] + q.pos) + 52) % 52; return dd >= 1 && dd <= 6; })()); };
  spots.forEach(o => { const id = o.seat + '_' + o.k; let d = LUDOG.disp[id]; const off = o.cnt > 1 && o.pos >= 0 ? [(o.n - (o.cnt - 1) / 2) * 0.3, 0] : [0, 0]; o.tx = o.x + off[0]; o.ty = o.y + off[1];
    if (!d) d = LUDOG.disp[id] = { x: o.tx, y: o.ty, pos: o.pos, q: [], seg: null, hit: 0, land: 0 };
    if (d.pos !== o.pos) {   /* تغيّر الموقع: جهّز مسار القفزات خانة خانة */
      if (d.pos >= 0 && o.pos > d.pos) { for (let p = d.pos + 1; p <= o.pos; p++) { const q = ludoCell(o.seat, p, o.k); d.q.push({ x: q[0], y: q[1] }); } }
      else if (o.pos < 0 && d.pos >= 0) { d.hit = t + 1300; d.q.push({ x: o.x, y: o.y, fly: 1 }); }
      else { d.q.push({ x: o.x, y: o.y }); }
      d.pos = o.pos;
    }
    let lift = 0, tilt = 0;
    if (!d.seg && d.q.length) { const n = d.q.shift(); d.seg = { fx: d.x, fy: d.y, tx: n.x, ty: n.y, t0: t, dur: n.fly ? 700 : Math.max(95, 200 - d.q.length * 14), fly: !!n.fly }; }
    if (d.seg) { const sg = d.seg, p = Math.min(1, (t - sg.t0) / sg.dur), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; d.x = sg.fx + (sg.tx - sg.fx) * (sg.fly ? e : p); d.y = sg.fy + (sg.ty - sg.fy) * (sg.fly ? e : p); lift = Math.sin(Math.PI * p) * (sg.fly ? 1.5 : 0.62); tilt = (sg.tx - sg.fx) * 0.12 * Math.sin(Math.PI * p);
      if (p >= 1) { d.x = sg.tx; d.y = sg.ty; d.land = t; if (!sg.fly) { ludoSfx('step'); } d.seg = null; } }
    else { d.x += (o.tx - d.x) * 0.25; d.y += (o.ty - d.y) * 0.25; }
    const C = LUDO_COL[o.seat], canMove = o.seat === me && mv.has(o.k), moving = !!d.seg || d.q.length > 0, r = u * (o.cnt > 1 && o.pos >= 0 ? 0.33 : 0.45);
    const bob = canMove ? Math.abs(Math.sin(t / 190)) * 0.22 : 0, la = t - d.land, sq = la < 190 ? Math.sin(Math.PI * la / 190) * 0.16 : 0;
    const px = d.x * u, gy = d.y * u + r * 0.55, py = gy - (lift + bob) * u;
    c.fillStyle = 'rgba(0,0,0,' + Math.max(0.08, 0.34 - (lift + bob) * 0.22) + ')'; c.beginPath(); c.ellipse(px, gy + r * 0.02, r * (1.0 - (lift + bob) * 0.28), r * 0.34 * (1 - (lift + bob) * 0.2), 0, 0, 7); c.fill();
    if (canMove) { const g = c.createRadialGradient(px, gy, 0, px, gy, r * 1.7); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.5, C.c + '66'); g.addColorStop(1, C.c + '00'); c.fillStyle = g; c.beginPath(); c.ellipse(px, gy, r * 1.7, r * 0.7, 0, 0, 7); c.fill(); }
    const look = [Math.max(-1, Math.min(1, (7.5 - d.x) / 6)), Math.max(-1, Math.min(1, (7.5 - d.y) / 6))], won = !!(s.ph === 'over' && s.win && s.win.s === o.seat), dizzy = d.hit > t, scared = !dizzy && !moving && danger(o);
    o.px = px; o.py = py - r * 1.1; o.r = r; o.draw = () => ludoPawn(c, px, py, r * 1.05, o.seat, t, { idx: o.seat * 4 + o.k, look, sx: 1 + sq * 0.6, sy: 1 - sq, tilt, bob: won ? Math.sin(t / 120) * 0.12 : 0, sleep: o.pos < 0 && !canMove && !dizzy && s.ph === 'play', happy: (o.pos === 56 || won || (lift > 0.2 && !scared)) && !dizzy, excited: canMove, scared, dizzy }); });
  spots.sort((a, b) => (a.py || 0) - (b.py || 0)); spots.forEach(o => o.draw && o.draw());
  LUDOG.spots = spots; ludoFx(c, u);
  c.restore();
  /* العد التنازلي 3-2-1 قبل بداية اللعبة */
  if ((LUDOG.cd || 0) > t) { const left = LUDOG.cd - t, n = Math.max(1, Math.ceil(left / 1000)), fr = (left % 1000) / 1000; if (LUDOG.cdN !== n) { LUDOG.cdN = n; ludoSfx('cd'); } c.fillStyle = 'rgba(10,6,30,.6)'; c.fillRect(0, 0, G.sz, G.sz); c.save(); c.translate(G.sz / 2, G.sz / 2); const sc = 0.7 + 0.5 * fr; c.scale(sc, sc); c.globalAlpha = Math.min(1, fr * 3); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 ' + (u * 6) + 'px Cairo, system-ui, sans-serif'; c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = ['#ffd23a', '#ff9f1c', '#ff5a8a'][Math.max(0, Math.min(2, 3 - n))]; c.strokeText(n, 0, 0); c.fillText(n, 0, 0); c.restore(); c.save(); c.textAlign = 'center'; c.font = 'bold ' + (u * 1) + 'px Cairo, system-ui, sans-serif'; c.fillStyle = '#fff'; c.fillText('🎲 جاهزين؟', G.sz / 2, G.sz * 0.2); c.restore(); } else if (LUDOG.cdN) { LUDOG.cdN = 0; ludoSfx('cdgo'); }
  if (s.ph === 'over' && s.win) { const w = s.seats[s.win.s], C = LUDO_COL[s.win.s], k = Math.min(1, (t - (LUDOG.winT || t)) / 500); c.fillStyle = 'rgba(10,6,30,' + (0.55 * k) + ')'; c.fillRect(0, 0, G.sz, G.sz); c.save(); c.translate(G.sz / 2, G.sz / 2); c.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = (u * 3.2) + 'px system-ui'; c.fillText('🏆', 0, -u * 1.6 + Math.sin(t / 200) * 4); c.font = 'bold ' + (u * 1.15) + 'px Cairo, system-ui, sans-serif'; c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = C.c; const tx = 'فاز ' + (w ? w.n : '؟') + '!'; c.strokeText(tx, 0, u * 1.2); c.fillText(tx, 0, u * 1.2); c.restore(); }
  c.restore();
  ludoDiceUpdate(t, s);
}
function ludoClick(e) {
  const s = LUDOG.s; if (performance.now() < LUDOG.rolling || (LUDOG.cd || 0) > performance.now()) return; if (!s || s.ph !== 'play' || s.turn !== s.my || !s.rolled || !LUDOG.spots || !(s.movable || []).length) return;
  /* الإحداثيات بوحدات CSS (الرسم يستخدم setTransform بنسبة الشاشة، فلا نقسم على dpr) + نطرح هامش الإطار */
  const r = LUDOG.cv.getBoundingClientRect(), k = (LUDOG.sz || r.width) / (r.width || 1), pad = Math.round((LUDOG.sz || r.width) * 0.04), x = (e.clientX - r.left) * k - pad, y = (e.clientY - r.top) * k - pad; let best = null, bd = 1e9;
  LUDOG.spots.forEach(o => { if (o.seat !== s.my || !s.movable.includes(o.k)) return; const dd = Math.hypot((o.px || 0) - x, (o.py || 0) - y); if (dd < bd) { bd = dd; best = o; } });
  if (best && bd < Math.max(30, (best.r || 10) * 2.4)) { ludoSfx('tap'); return ludoSend({ t: 'ludo_move', k: best.k }); }
  if (s.movable.length === 1) { ludoSfx('tap'); ludoSend({ t: 'ludo_move', k: s.movable[0] }); }   // خيار وحيد: أي لمسة على اللوحة تحرّكه
}
function ludoCss() {
  if (document.getElementById('ludoCss')) return; const st = document.createElement('style'); st.id = 'ludoCss';
  st.textContent = `#pg-ludo .pgBody{max-width:none;padding:10px;gap:0;overflow:auto;background:radial-gradient(ellipse at top,#2a1a52,#0a0814)}
.ludoMenu,.ludoGame{width:100%;max-width:440px;margin:0 auto;display:flex;flex-direction:column;gap:10px;color:#fff;padding-bottom:60px}
.ludoHero{text-align:center;background:radial-gradient(circle at 80% 10%,rgba(255,210,90,.28),transparent 50%),radial-gradient(circle at 10% 100%,rgba(255,70,140,.3),transparent 55%),rgba(255,255,255,.07);border:1px solid rgba(255,210,122,.5);border-radius:18px;padding:12px;animation:ludoHeroG 2.4s ease-in-out infinite}@keyframes ludoHeroG{50%{box-shadow:0 0 22px rgba(255,170,60,.5)}}.ludoHero h2{margin:2px 0}.ludoHero p{margin:4px 0 0;font-size:13px;opacity:.85}.ludoHeroDots{font-size:15px;letter-spacing:4px;margin:2px 0}.ludoHeroEm{font-size:46px;animation:ludoBob 1.6s ease-in-out infinite}
@keyframes ludoBob{50%{transform:translateY(-6px) rotate(8deg)}}
.ludoBtn{width:100%;padding:12px;border-radius:14px;border:2px solid rgba(255,255,255,.6);background:linear-gradient(135deg,#ff8a2a,#e53b6a);color:#fff;font-weight:800;font-size:15px;font-family:inherit}.ludoBtn.big{padding:15px;font-size:17px}.ludoBtn.ghost{background:rgba(255,255,255,.1)}.ludoBtn.small{padding:8px;font-size:13px}.ludoBtn:disabled{opacity:.5}
.ludoJoin{display:flex;gap:8px}.ludoJoin input{flex:1;min-width:0;padding:10px;font-size:16px;border-radius:12px;border:2px solid #ffd1a0;background:#fff;color:#222}.ludoJoin .ludoBtn{width:auto;padding:10px 16px}
.ludoSec,.ludoH{font-weight:800;margin:4px 0}.ludoList{display:flex;flex-direction:column;gap:6px}.ludoRow{padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-family:inherit}
.ludoCode{background:rgba(255,255,255,.1);border-radius:12px;padding:10px;text-align:center}.ludoCode b{font-size:22px;letter-spacing:4px}
.ludoSeats{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ludoSeat{border-radius:14px;padding:10px;border:2px solid var(--c);background:rgba(255,255,255,.08);display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center}.ludoSeat.me{box-shadow:0 0 0 3px #fff3}.ludoSeat.empty{opacity:.75;border-style:dashed}.ludoDot{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 28%,#fff 0,#fff 8%,var(--c) 42%,var(--d));box-shadow:0 4px 8px rgba(0,0,0,.4),inset 0 -3px 5px rgba(0,0,0,.25)}.ludoSeat.rdy{background:rgba(40,160,90,.22);box-shadow:0 0 14px rgba(62,224,138,.45)}.ludoSt{font-weight:700}.ludoSt.ok{color:#7dffb5}.ludoReady.all{animation:ludoPulse .9s ease-in-out infinite}.ludoBtn.go{background:linear-gradient(135deg,#1fbf6b,#0e8f4f)}.ludoSit{margin-top:4px;padding:6px 10px;border-radius:10px;border:0;background:var(--c);color:#fff;font-weight:700;font-family:inherit}
.ludoWait,.ludoNote{text-align:center;opacity:.85;font-size:13px}
.ludoTop{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.ludoChip{padding:5px 10px;border-radius:999px;border:2px solid var(--c);background:rgba(255,255,255,.08);font-size:12px;font-weight:700}.ludoChip.on{background:var(--c);box-shadow:0 0 12px var(--c)}.ludoChip.off{opacity:.45;text-decoration:line-through}
.ludoCv{display:block;margin:0 auto;border-radius:14px;touch-action:manipulation;box-shadow:0 8px 28px rgba(0,0,0,.5)}
.ludoBar{display:flex;align-items:center;gap:12px;justify-content:center}.ludoDice{position:relative;width:84px;height:84px;perspective:360px;background:none;border:0;padding:0;margin:0;-webkit-tap-highlight-color:transparent}.ludoDice:disabled{opacity:.7}.ludoDice.go{animation:ludoPulse .8s ease-in-out infinite}
.ludoCube{position:absolute;left:12px;top:10px;width:60px;height:60px;transform-style:preserve-3d;transition:transform .35s cubic-bezier(.2,1.5,.4,1)}.ludoCube.rolling{transition:none;animation:ludoTumble .5s linear infinite}
.ludoFace{position:absolute;inset:0;background:linear-gradient(145deg,#fff 0%,#efe9ff 60%,#d9d0ff 100%);border:2px solid #bdb0f5;border-radius:12px;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:8px;box-shadow:inset 0 0 14px rgba(110,80,200,.28)}.ludoFace i{width:11px;height:11px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#555,#111);place-self:center;box-shadow:inset 0 -1px 2px rgba(255,255,255,.3)}.ludoFace i.r{background:radial-gradient(circle at 35% 30%,#ff7a8a,#d3153a);width:14px;height:14px}
.ludoFace.f1{transform:translateZ(30px)}.ludoFace.f6{transform:rotateY(180deg) translateZ(30px)}.ludoFace.f2{transform:rotateY(90deg) translateZ(30px)}.ludoFace.f5{transform:rotateY(-90deg) translateZ(30px)}.ludoFace.f3{transform:rotateX(90deg) translateZ(30px)}.ludoFace.f4{transform:rotateX(-90deg) translateZ(30px)}
.ludoDsh{position:absolute;left:14px;right:14px;bottom:2px;height:11px;border-radius:50%;background:rgba(0,0,0,.4);filter:blur(3px);transition:transform .2s,opacity .2s}.ludoDice.rolling{animation:ludoBounce .5s ease-in-out infinite}.ludoDice.rolling .ludoDsh{animation:ludoDsh .5s ease-in-out infinite}.ludoDice.land{animation:ludoLand .45s ease-out}
@keyframes ludoTumble{0%{transform:rotateX(-22deg) rotateY(28deg) rotateZ(0)}100%{transform:rotateX(518deg) rotateY(748deg) rotateZ(180deg)}}@keyframes ludoBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-22px) scale(1.12)}}@keyframes ludoDsh{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.55);opacity:.45}}@keyframes ludoLand{0%{transform:translateY(-8px) scale(1.15)}55%{transform:translateY(2px) scale(.94)}100%{transform:none}}
.ludoReady{text-align:center;font-weight:800;color:#7dffb5;background:rgba(20,70,45,.6);border:1px solid #3ee08a;border-radius:12px;padding:8px;animation:ludoPulse 1.2s ease-in-out infinite}.ludoBtn.pulse{animation:ludoPulse 1s ease-in-out infinite}
@keyframes ludoPulse{50%{transform:scale(1.12)}}@keyframes ludoShake{0%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}100%{transform:rotate(-12deg)}}
.ludoMsg{font-weight:700;font-size:14px;max-width:230px}
.ludoEmo{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.ludoEmo button{font-size:22px;width:42px;height:42px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);padding:0;transition:transform .12s}.ludoEmo button:active{transform:scale(1.3)}
.ludoFloat{position:absolute;font-size:30px;pointer-events:none;animation:ludoUp 2s ease-out forwards;z-index:5}@keyframes ludoUp{0%{transform:translate(-50%,0) scale(.4);opacity:0}15%{opacity:1;transform:translate(-50%,-10px) scale(1.2)}100%{transform:translate(-50%,-110px) scale(1);opacity:0}}
.ludoDice.pop{animation:ludoPop .35s}@keyframes ludoPop{50%{transform:scale(1.35) rotate(8deg)}}`;
  document.head.appendChild(st);
}
