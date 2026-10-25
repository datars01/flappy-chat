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
      case 'eaten': B('sine', 900, 140, 0.55, 0.08); B('triangle', 300, 80, 0.4, 0.05, 0.15); break;
      case 'tick': B('square', 1250, 1250, 0.04, 0.05); break;
      case 'tick2': B('square', 1500, 1500, 0.06, 0.07); break;
      case 'medal': [659, 880, 1175].forEach((f, i) => B('triangle', f, f, 0.25, 0.07, i * 0.09)); break;
      case 'buy': [880, 1175, 1568, 2093].forEach((f, i) => B('sine', f, f, 0.18, 0.06, i * 0.06)); break;
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
  if (pos < 0) { const b = LUDO_BASE[seat]; return [b[0] + (k % 2 ? 4 : 2), b[1] + (k > 1 ? 4 : 2)]; }   /* بالسنتر: اللوح الفاتح من b+1 لين b+5 ومركزه b+3 */
  if (pos <= 50) { const c = LUDO_TRACK[(LUDO_START[seat] + pos) % 52]; return [c[0] + 0.5, c[1] + 0.5]; }
  const c = LUDO_LANE[seat][Math.min(5, pos - 51)]; return [c[0] + 0.5, c[1] + 0.5];
}
function ludoOpen() {
  if (!auth) { showToast('✍️ سجّل حساب حتى تلعب غوكو'); closePage(); setTimeout(() => openPage('account'), 200); return; }
  ludoCss(); ludoSend({ t: 'ludo_get' }); ludoRender();
}
function ludoClose() { cancelAnimationFrame(LUDOG.raf); LUDOG.raf = 0; ludoChatKill(); }
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
function ludoRmClose() { ludoChatKill(); LUDOG.mode = 'page'; cancelAnimationFrame(LUDOG.raf); LUDOG.raf = 0; LUDOG.s = null; LUDOG.cv = null; const o = document.getElementById('rmLudo'); if (o) o.hidden = true; const b = document.getElementById('rmLdBody'); if (b) b.innerHTML = ''; }
function ludoMsg(d) {
  if (d.t === 'ludo_emo') return ludoEmoFloat(d.s, d.e);
  if (d.t === 'ludo_chat') return ludoChatAdd(d.m, true);
  if (d.t === 'ludo_allready') { ludoSfx('allready'); showToast(d.host ? '✅ الكل جاهز! دوس «ابدأ اللعبة» 👑' : '✅ الكل جاهز — بانتظار الهوست يشغّل اللعبة'); try { navigator.vibrate && navigator.vibrate([50, 40, 50]); } catch (e) {} return; }
  if (d.t === 'ludo_join') { ludoSfx('join'); showToast('👋 دخل ' + d.n + ' الطاولة' + (d.cnt >= 2 ? ' — اضغط «استعداد» ✅' : '')); try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (e) {} return; }
  if (d.t === 'ludo_shop') { LUDOG.shop = d; if (d.bought) ludoSfx('buy'); ludoShopRender(); return; }
  if (d.t === 'ludo_state') {
    if (d.s) { LUDOG.dl = performance.now() + (d.s.t || 0); LUDOG.tMax = d.s.tMax || 15000; }
    /* رجعت بعد انقطاع النت: نرجّعك لنفس اللعبة ونفس مكانك */
    if (d.s && d.s.ph === 'play' && !LUDOG.s) {
      if (d.s.tbl && !ludoRm() && typeof RM !== 'undefined' && RM.on) { ludoRmOpen(); showToast('📶 رجعت لطاولة غوكو!'); }
      else if (!d.s.tbl && !ludoRm() && typeof curPage !== 'undefined' && curPage !== 'ludo') { try { openPage('ludo'); } catch (e) {} showToast('📶 رجعت للعبة غوكو من نفس مكانك!'); }
    }
    const old = LUDOG.s; LUDOG.s = d.s; ludoOnState(old, d.s);
  }
  else if (d.t === 'ludo_list') ludoRenderList(d.list);
  else if (d.t === 'ludo_err') { ludoSfx('err'); showToast('⚠️ ' + d.error); }
}
function ludoOnState(old, s) {
  if (s && s.last && s.last.id !== LUDOG.lastEv) {
    LUDOG.lastEv = s.last.id; LUDOG.last = s.last;
    if (s.last.k === 'roll') { LUDOG.rolling = performance.now() + 1000; LUDOG.dice = s.last.d; ludoSfx('roll'); const dv = s.last.d; const rs = s.last.s; setTimeout(() => { ludoSfx(dv === 6 ? 'six' : 'land'); ludoRollPop(dv, rs); }, 980); }
    else if (s.last.k === 'sixes') { ludoSfx('sixes'); showToast('🎲 ثلاث ستات ورا بعض، ضاع الدور!'); }
    else if (s.last.k === 'move') {   /* المؤثرات تنتظر لين تنتهي قفزات الخرزة خانة خانة */
      const L = s.last, prev = (old && old.seats[L.s] && old.seats[L.s].tk[L.tk]), steps = (prev === undefined || prev < 0 || L.pos < 0) ? 1 : Math.max(1, L.pos - prev), wait = Math.min(1800, steps * 150 + (L.cap ? 60 : 0));
      if (L.caps && L.caps.length) setTimeout(() => { try { ludoSfx('eaten'); L.caps.forEach(c => { const q = ludoCell(c[0], c[2], c[1]); ludoPop(q[0], q[1], c[0] === s.my ? '😵 انأكلت!' : '😵 انأكل!', LUDO_COL[c[0]].c); }); if (L.caps.some(c => c[0] === s.my)) { try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) {} } } catch (e) {} }, wait + 60);
      if (L.fin) setTimeout(() => { try { ludoSfx('medal'); const p = s.seats[L.s]; showToast(['', '🥇', '🥈', '🥉'][L.fin] + ' ' + (p ? p.n : '') + ' خلّص أحجاره!'); } catch (e) {} }, wait + 200);
      setTimeout(() => { try { ludoSfx(L.cap ? 'cap' : L.home ? 'home' : 'move'); const q = ludoCell(L.s, L.pos, L.tk); ludoBurst(q[0], q[1], L.cap ? 'cap' : L.home ? 'home' : 'dust', LUDO_COL[L.s].c); if (L.cap) LUDOG.shake = performance.now() + 380; } catch (e) {} }, wait); }
  }
  if (s && s.ph === 'over' && (!old || old.ph !== 'over')) { ludoSfx(ludoIWon(s) ? 'win' : 'lose'); LUDOG.winT = performance.now(); ludoConfetti(); }
  if (s && s.ph === 'play' && old && old.ph === 'lobby') { LUDOG.cd = performance.now() + 3000; LUDOG.cdN = 0; ludoSfx('start'); setTimeout(() => { try { ludoUpdate(); const z = LUDOG.s; if (z && z.ph === 'play' && z.turn === z.my) { ludoSfx('turn'); ludoTurnBanner(); } } catch (e) {} }, 3100); }
  if (s && s.ph === 'play' && s.turn === s.my && (!old || old.turn !== s.turn || old.ph !== 'play') && !((LUDOG.cd || 0) > performance.now())) { ludoSfx('turn'); try { navigator.vibrate && navigator.vibrate([80, 60, 80]); } catch (e) {} const rl = Math.max(0, (LUDOG.rolling || 0) - performance.now()); setTimeout(() => ludoTurnBanner(), rl ? rl + 900 : 0); }
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
  const R = ludoRoot(); if (!R) return; const s = LUDOG.s; R.dataset.ph = s ? s.ph : ''; try { ludoChatEnsure(); } catch (e) {}
  R.innerHTML = '';
  if (!s) { if (ludoRm()) { R.appendChild(lel('div', 'ludoWait', '⏳ جاري الجلوس على الطاولة...')); return; } R.appendChild(ludoMenuEl()); ludoSend({ t: 'ludo_list' }); return; }
  if (s.ph === 'lobby') { R.appendChild(ludoLobbyEl(s)); return; }
  R.appendChild(ludoGameEl()); ludoUpdate(); ludoLoop(); if (s.ph === 'over') ludoPodium(s);
}
function ludoMenuEl() {
  const w = lel('div', 'ludoMenu');
  const hero = lel('div', 'ludoHero'); hero.append(lel('div', 'ludoHeroEm', '🎲'), lel('h2', '', 'غوكو'), lel('div', 'ludoHeroDots', '🔴 🟢 🟡 🔵'), lel('p', '', 'طاولة بـ 4 مقاعد. تكدرون تلعبون لاعبين اثنين بس، أو لين 4. اللي يوصّل أحجاره الأربعة للبيت أول يفوز!'));
  const q = lel('button', 'ludoBtn big', '⚡ لعب سريع'); q.onclick = () => { ludoSfx(); ludoSend({ t: 'ludo_quick' }); };
  const cr = lel('button', 'ludoBtn', '➕ طاولة خاصة لأصدقائي'); cr.onclick = () => { ludoSfx(); ludoSend({ t: 'ludo_create' }); };
  const jr = lel('div', 'ludoJoin'); const inp = lel('input'); inp.placeholder = 'رمز الطاولة (4 أرقام)'; inp.maxLength = 4; inp.inputMode = 'numeric';
  const jb = lel('button', 'ludoBtn', '🔑 ادخل'); jb.onclick = () => { if (inp.value.trim().length !== 4) { showToast('اكتب رمز من 4 أرقام'); return; } ludoSend({ t: 'ludo_join', code: inp.value.trim() }); }; jr.append(inp, jb);
  const lst = lel('div', 'ludoList'); lst.id = 'ludoList'; lst.appendChild(lel('small', '', '...'));
  w.append(hero, q, cr, jr, ludoCpuEl(), lel('div', 'ludoSec', '🌐 طاولات مفتوحة'), lst, ludoThemeEl(), ludoShopEl()); ludoSend({ t: 'ludo_shop' }); return w;
}
function ludoRenderList(list) {
  const Lb = document.getElementById('ludoList'); if (!Lb) return; Lb.innerHTML = '';
  if (!list.length) { Lb.appendChild(lel('small', '', 'ماكو طاولات مفتوحة هسه — دوس «لعب سريع» وتنفتح طاولة جديدة')); return; }
  list.forEach(x => { const b = lel('button', 'ludoRow', '🎲 طاولة ' + x.host + ' • ' + x.n + '/4 • ' + (LUDO_MODES[x.mode] || LUDO_MODES.classic).s); b.onclick = () => ludoSend({ t: 'ludo_quick' }); Lb.appendChild(b); });
}
function ludoLobbyEl(s) {
  const w = lel('div', 'ludoMenu'); const me = s.seats[s.my];
  const n = s.seats.filter(Boolean).length, rd = s.seats.filter(p => p && p.rdy).length, host = s.seats.find(p => p && p.host), iAmHost = !!(me && me.host);
  w.appendChild(lel('h3', 'ludoH', '🎲 غرفة الانتظار (' + n + '/4)')); w.appendChild(ludoModeEl(s, iAmHost));
  if (s.priv) { const cb = lel('div', 'ludoCode'); cb.innerHTML = 'رمز الطاولة: <b>' + s.code + '</b> — دزه لأصدقائك'; w.appendChild(cb); }
  const g = lel('div', 'ludoSeats');
  s.seats.forEach((p, i) => {
    const C = LUDO_COL[i], c = lel('div', 'ludoSeat' + (p ? '' : ' empty') + (p && p.me ? ' me' : '') + (p && p.rdy ? ' rdy' : '') + (p && p.bot ? ' bot' : '')); c.style.setProperty('--c', C.c); c.style.setProperty('--d', C.d);
    if (s.mode === 'team') c.appendChild(lel('span', 'ludoTeamTag t' + (i % 2), i % 2 ? '🟢🔵 فريق 2' : '🔴🟡 فريق 1'));
    const dot = lel('span', 'ludoDot', p && p.bot ? '🤖' : ''); c.appendChild(dot);
    if (p) { c.appendChild(lel('b', '', (p.host ? '👑 ' : '') + p.n)); c.appendChild(lel('small', 'ludoSt' + (p.rdy ? ' ok' : ''), p.bot ? '🤖 كمبيوتر • جاهز دائماً' : (p.rdy ? '✅ جاهز' : '⏳ ما جاهز') + (p.host ? ' • الهوست' : '')));
      if (p.bot && iAmHost) { const xb = lel('button', 'ludoSit ghost', '✖ شيل الكمبيوتر'); xb.onclick = () => ludoSend({ t: 'ludo_unbot', s: i }); c.appendChild(xb); }
      if (p.bot && me && !ludoRm()) { const sb = lel('button', 'ludoSit', '🪑 اجلس محله'); sb.onclick = () => ludoSend({ t: 'ludo_seat', s: i }); c.appendChild(sb); } }
    else { c.appendChild(lel('b', '', 'مقعد فارغ')); c.appendChild(lel('small', '', C.n)); if (me && !ludoRm()) { const sb = lel('button', 'ludoSit', '🪑 اجلس هنا'); sb.onclick = () => ludoSend({ t: 'ludo_seat', s: i }); c.appendChild(sb); } if (iAmHost) { const bb = lel('button', 'ludoSit bot', '🤖 ضيف كمبيوتر'); bb.onclick = () => ludoSend({ t: 'ludo_bot', s: i }); c.appendChild(bb); } }
    g.appendChild(c);
  });
  w.appendChild(g);
  if (me) {
    if (n < 2) { const st = lel('button', 'ludoBtn big', '⏳ بانتظار لاعب ثاني...'); st.disabled = true; w.appendChild(st); if (iAmHost) { const bb = lel('button', 'ludoBtn', '🤖 ماكو أحد؟ العب ويا الكمبيوتر'); bb.onclick = () => ludoSend({ t: 'ludo_bot' }); w.appendChild(bb); } }
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
  const stage = lel('div', 'ludoStage'); stage.id = 'ludoStage';
  const cv = lel('canvas', 'ludoCv'); cv.id = 'ludoCv'; LUDOG.cv = cv; LUDOG.disp = {}; stage.appendChild(cv);
  cv.addEventListener('pointerdown', ludoClick);
  const bar = lel('div', 'ludoBar'); const dice = ludoDiceEl(); dice.onclick = () => { const s = LUDOG.s; if (s && s.ph === 'play' && s.turn === s.my && !s.rolled && !((LUDOG.cd || 0) > performance.now())) ludoSend({ t: 'ludo_roll' }); };
  const msg = lel('div', 'ludoMsg'); msg.id = 'ludoMsg'; const dn = lel('div', 'ludoDNum'); dn.id = 'ludoDNum'; bar.append(dice, dn, msg, ludoMicEl());
  const tm = lel('div', 'ludoTmr'); tm.id = 'ludoTmr'; tm.innerHTML = '<i></i><b></b>';
  const lv = lel('button', 'ludoBtn ghost small', '🚪 طلوع'); lv.onclick = () => { if (confirm('تطلع من اللعبة؟')) ludoSend({ t: 'ludo_leave' }); };
  w.append(top, tm, stage, bar, ludoEmoBar()); if (!ludoRm()) w.appendChild(lv); return w;
}
function ludoUpdate() {
  const s = LUDOG.s; if (!s || s.ph === 'lobby') return;
  const top = document.getElementById('ludoTop'), msg = document.getElementById('ludoMsg'), dice = document.getElementById('ludoDice'); if (!top || !msg || !dice) return;
  top.innerHTML = ''; s.seats.forEach((p, i) => { if (!p) return; const C = LUDO_COL[i], c = lel('span', 'ludoChip' + (s.ph === 'play' && s.turn === i ? ' on' : '') + (p.left ? ' off' : '') + (p.off ? ' net' : '')); c.dataset.seat = i; c.style.setProperty('--c', C.c); c.textContent = (p.rank ? ['', '🥇', '🥈', '🥉', '4️⃣'][p.rank] + ' ' : '') + (p.me ? '⭐ ' : '') + (s.mode === 'team' ? (i % 2 ? '🟢' : '🔴') : '') + p.n + (p.off ? ' 📶' : '') + (p.left ? ' (طلع)' : '') + ' ' + p.tk.filter(x => x === 56).length + '/' + (s.nt || p.tk.length); top.appendChild(c); });
  if (s.mode && s.mode !== 'classic') top.appendChild(lel('span', 'ludoChip mode', (LUDO_MODES[s.mode] || {}).s || ''));
  const mine = s.my, myTurn = s.ph === 'play' && s.turn === mine;
  dice.disabled = !(myTurn && !s.rolled) || (LUDOG.cd || 0) > performance.now(); dice.classList.toggle('go', myTurn && !s.rolled);
  if (s.ph === 'over') { msg.textContent = '🏆 ' + ludoWinTitle(s) + ' — ترجعون للانتظار بعد لحظات'; }
  else if (myTurn) msg.textContent = s.rolled ? (s.movable.length ? '👆 دوس على حجر مضيء — شوف وين راح يوصل' : 'ماكو حركة متاحة...') : '🎲 دورك! دوس النرد';
  else { const t = s.seats[s.turn]; msg.textContent = (t && t.bot ? '🤖 الكمبيوتر يفكّر: ' : t && t.off ? '📶 ' : '⏳ دور ') + (t ? t.n : '؟') + ' (' + (LUDO_COL[s.turn] || {}).n + ')'; }
}
function ludoLoop() {
  cancelAnimationFrame(LUDOG.raf);
  const step = () => { if (!document.getElementById('ludoCv')) { LUDOG.raf = 0; return; } ludoDraw(); LUDOG.raf = requestAnimationFrame(step); };
  LUDOG.raf = requestAnimationFrame(step);
}
/* ---------- لوحة احترافية: إطار خشب بتعريق + رخام + خانات بارزة + أعشاش غائرة (تنرسم مرة وحدة وتنخزّن) ---------- */
function ludoRR(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ludoBoardCache(G) {
  const TH = ludoThemeP(), key = G.sz + '_' + G.dpr + '_' + ludoTheme(); if (LUDOG.bgKey === key && LUDOG.bg) return LUDOG.bg;
  const sz = G.sz, dpr = G.dpr, pad = G.pad, u = G.u, bgc = document.createElement('canvas'); bgc.width = Math.round(sz * dpr); bgc.height = Math.round(sz * dpr);
  const c = bgc.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;   // عشوائي ثابت (حتى ما تتغيّر العروق كل مرة)
  /* الإطار الخشبي */
  const wg = c.createLinearGradient(0, 0, sz, sz); wg.addColorStop(0, TH.fr[0]); wg.addColorStop(0.3, TH.fr[1]); wg.addColorStop(0.6, TH.fr[2]); wg.addColorStop(1, TH.fr[3]);
  c.fillStyle = wg; ludoRR(c, 0, 0, sz, sz, sz * 0.045); c.fill();
  c.save(); ludoRR(c, 0, 0, sz, sz, sz * 0.045); c.clip(); for (let i = 0; i < 46; i++) { const y = rnd() * sz; c.strokeStyle = 'rgba(' + (rnd() < 0.5 ? TH.gr[0] : TH.gr[1]) + ',' + (0.05 + rnd() * 0.09) + ')'; c.lineWidth = 0.6 + rnd() * 1.6; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(sz * 0.3, y + (rnd() - 0.5) * 14, sz * 0.65, y + (rnd() - 0.5) * 14, sz, y + (rnd() - 0.5) * 8); c.stroke(); } if (TH.stars) for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + rnd() * 0.6) + ')'; c.beginPath(); c.arc(rnd() * sz, rnd() * sz, 0.5 + rnd() * 1.3, 0, 7); c.fill(); } c.restore();
  c.strokeStyle = 'rgba(255,230,180,.6)'; c.lineWidth = 2; ludoRR(c, 1.5, 1.5, sz - 3, sz - 3, sz * 0.045); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2; ludoRR(c, 3.5, 3.5, sz - 7, sz - 7, sz * 0.04); c.stroke();
  /* الإطار الذهبي حول اللوحة + ظل للداخل */
  c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 10; c.fillStyle = TH.rim[1]; ludoRR(c, pad - 3, pad - 3, sz - 2 * pad + 6, sz - 2 * pad + 6, 8); c.fill(); c.restore();
  const gg = c.createLinearGradient(0, pad, 0, sz - pad); gg.addColorStop(0, TH.rim[0]); gg.addColorStop(0.5, TH.rim[1]); gg.addColorStop(1, TH.rim[2]); c.fillStyle = gg; ludoRR(c, pad - 3, pad - 3, sz - 2 * pad + 6, sz - 2 * pad + 6, 8); c.fill();
  /* أرضية رخام */
  c.save(); c.translate(pad, pad); const bs = u * 15; const mg = c.createLinearGradient(0, 0, bs, bs); mg.addColorStop(0, TH.fl[0]); mg.addColorStop(0.5, TH.fl[1]); mg.addColorStop(1, TH.fl[2]);
  c.fillStyle = mg; ludoRR(c, 0, 0, bs, bs, 5); c.fill(); c.save(); ludoRR(c, 0, 0, bs, bs, 5); c.clip();
  for (let i = 0; i < 9; i++) { c.strokeStyle = 'rgba(' + TH.vein + ',' + (0.05 + rnd() * 0.06) + ')'; c.lineWidth = 0.6 + rnd() * 1.1; c.beginPath(); let x = rnd() * bs, y = rnd() * bs; c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - 0.3) * bs * 0.3; y += (rnd() - 0.3) * bs * 0.3; c.quadraticCurveTo(x + (rnd() - 0.5) * 30, y + (rnd() - 0.5) * 30, x, y); } c.stroke(); } c.restore();
  const tile = (x, y, top, bot, ln) => { const w = u - u * 0.1, px = x * u + u * 0.05, py = y * u + u * 0.05; c.save(); c.shadowColor = 'rgba(0,0,0,.28)'; c.shadowBlur = u * 0.12; c.shadowOffsetY = u * 0.05; const g = c.createLinearGradient(px, py, px, py + w); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; ludoRR(c, px, py, w, w, u * 0.15); c.fill(); c.restore();
    c.strokeStyle = ln || TH.ln; c.lineWidth = 1; ludoRR(c, px, py, w, w, u * 0.15); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px + u * 0.18, py + 1.6); c.lineTo(px + w - u * 0.18, py + 1.6); c.stroke(); };
  /* البيوت الأربعة: لوح ملوّن + لوح فاتح + 4 أعشاش غائرة */
  LUDO_BASE.forEach((b, i) => { const C = LUDO_COL[i], x = b[0] * u, y = b[1] * u, w = 6 * u;
    c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = u * 0.25; c.shadowOffsetY = u * 0.08; const g = c.createLinearGradient(x, y, x + w, y + w); g.addColorStop(0, ludoMix(C.c, 255, 0.28)); g.addColorStop(0.5, C.c); g.addColorStop(1, C.d); c.fillStyle = g; ludoRR(c, x + u * 0.06, y + u * 0.06, w - u * 0.12, w - u * 0.12, u * 0.4); c.fill(); c.restore();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.5; ludoRR(c, x + u * 0.12, y + u * 0.12, w - u * 0.24, w - u * 0.24, u * 0.36); c.stroke();
    const ig = c.createLinearGradient(x, y, x + w, y + w); ig.addColorStop(0, ludoMix(C.l, 255, 0.5)); ig.addColorStop(1, C.l); c.fillStyle = ig; ludoRR(c, x + u, y + u, 4 * u, 4 * u, u * 0.55); c.fill(); c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 2; ludoRR(c, x + u, y + u, 4 * u, 4 * u, u * 0.55); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; ludoRR(c, x + u + 2, y + u + 2, 4 * u - 4, 4 * u - 4, u * 0.5); c.stroke();
    [[2, 2], [4, 2], [2, 4], [4, 4]].forEach(q => { const cx = (b[0] + q[0]) * u, cy = (b[1] + q[1]) * u, R = u * 0.5;
      const sg = c.createRadialGradient(cx + R * 0.2, cy + R * 0.25, R * 0.1, cx, cy, R); sg.addColorStop(0, ludoMix(C.d, 0, 0.1)); sg.addColorStop(0.7, ludoMix(C.c, 0, 0.1)); sg.addColorStop(1, ludoMix(C.l, 0, 0.1)); c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.38)'; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, R, Math.PI * 0.95, Math.PI * 1.9); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, R, Math.PI * 0.05, Math.PI * 0.9); c.stroke(); }); });
  /* المسار */
  LUDO_TRACK.forEach(q => tile(q[0], q[1], TH.tl[0], TH.tl[1]));
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
  const C = LUDO_COL[seat], i = o.idx, lw = Math.max(1, r * 0.07), SK = o.sk || '', TR = SK === 'p_gold' ? { c: '#ffd84a', d: '#9a6c06' } : C;
  const br = 1 + Math.sin(t / 520 + i * 1.7) * 0.022 + (o.excited ? Math.sin(t / 130 + i) * 0.03 : 0);   // تنفّس
  const sx = (o.sx || 1), sy = (o.sy || 1) * br;
  c.save(); c.translate(x, gy); c.rotate(o.tilt || 0); c.scale(sx, sy); c.lineJoin = 'round'; c.lineCap = 'round';
  /* القاعدة (قرص) */
  const bg = c.createLinearGradient(-r, 0, r, 0); bg.addColorStop(0, ludoMix(TR.d, 0, 0.35)); bg.addColorStop(0.35, TR.c); bg.addColorStop(0.55, ludoMix(TR.c, 255, 0.45)); bg.addColorStop(1, ludoMix(TR.d, 0, 0.3));
  if (SK === 'p_neon') { c.shadowColor = C.c; c.shadowBlur = r * 0.9; }
  c.fillStyle = bg; c.beginPath(); c.ellipse(0, -r * 0.14, r * 1.0, r * 0.3, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = lw * 0.8; c.beginPath(); c.ellipse(0, -r * 0.2, r * 0.97, r * 0.26, 0, Math.PI * 1.05, Math.PI * 1.75); c.stroke();
  /* الجسم: جرس مقعّر بتدرّج أفقي (يعطي حجم) */
  const bd = c.createLinearGradient(-r * 0.8, 0, r * 0.8, 0); bd.addColorStop(0, ludoMix(C.d, 0, 0.3)); bd.addColorStop(0.22, C.c); bd.addColorStop(0.42, ludoMix(C.c, 255, 0.5)); bd.addColorStop(0.62, C.c); bd.addColorStop(1, ludoMix(C.d, 0, 0.35));
  c.fillStyle = bd; c.beginPath(); c.moveTo(-r * 0.82, -r * 0.18); c.bezierCurveTo(-r * 0.55, -r * 0.34, -r * 0.4, -r * 0.8, -r * 0.3, -r * 1.14); c.lineTo(r * 0.3, -r * 1.14); c.bezierCurveTo(r * 0.4, -r * 0.8, r * 0.55, -r * 0.34, r * 0.82, -r * 0.18); c.quadraticCurveTo(0, r * 0.08, -r * 0.82, -r * 0.18); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.62, r * 0.07, r * 0.36, 0.18, 0, 7); c.fill();   // لمعة طولية
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(r * 0.46, -r * 0.5, r * 0.08, r * 0.3, -0.16, 0, 7); c.fill();           // ظل جانبي
  /* طوق الرقبة */
  const cg = c.createLinearGradient(-r * 0.5, 0, r * 0.5, 0); cg.addColorStop(0, ludoMix(TR.d, 0, 0.2)); cg.addColorStop(0.45, ludoMix(TR.c, 255, 0.65)); cg.addColorStop(1, ludoMix(TR.d, 0, 0.3));
  c.fillStyle = cg; c.beginPath(); c.ellipse(0, -r * 1.14, r * 0.44, r * 0.13, 0, 0, 7); c.fill();
  /* الراس: كرة لامعة */
  const hy = -r * 1.66 + (o.bob || 0) * r, hr = r * 0.68;
  if (SK === 'p_cat') [-1, 1].forEach(sg => { c.fillStyle = ludoMix(C.d, 0, 0.1); c.beginPath(); c.moveTo(sg * hr * 0.25, hy - hr * 0.8); c.lineTo(sg * hr * 0.85, hy - hr * 1.35); c.lineTo(sg * hr * 0.9, hy - hr * 0.35); c.closePath(); c.fill(); c.fillStyle = '#ffb3c8'; c.beginPath(); c.moveTo(sg * hr * 0.42, hy - hr * 0.78); c.lineTo(sg * hr * 0.78, hy - hr * 1.1); c.lineTo(sg * hr * 0.8, hy - hr * 0.52); c.closePath(); c.fill(); });
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
  /* السكنات 🛍️ */
  c.shadowBlur = 0;
  if (SK === 'p_shades' && !o.sleep) { c.fillStyle = '#111'; [-1, 1].forEach(sg => { ludoRR(c, sg * ex - er * 1.05, ey - er * 0.75, er * 2.1, er * 1.5, er * 0.5); c.fill(); }); c.fillRect(-ex + er * 0.9, ey - er * 0.45, (ex - er * 0.9) * 2, er * 0.28); c.fillStyle = 'rgba(255,255,255,.55)'; [-1, 1].forEach(sg => { c.beginPath(); c.ellipse(sg * ex - er * 0.4, ey - er * 0.3, er * 0.32, er * 0.14, -0.4, 0, 7); c.fill(); }); }
  if (SK === 'p_crown') { const cy0 = hy - hr * 0.82, w = hr * 0.95; const g = c.createLinearGradient(0, cy0 - hr * 0.6, 0, cy0 + hr * 0.1); g.addColorStop(0, '#fff3a8'); g.addColorStop(1, '#d39a0c'); c.fillStyle = g; c.beginPath(); c.moveTo(-w, cy0); c.lineTo(-w, cy0 - hr * 0.45); c.lineTo(-w * 0.5, cy0 - hr * 0.18); c.lineTo(0, cy0 - hr * 0.62); c.lineTo(w * 0.5, cy0 - hr * 0.18); c.lineTo(w, cy0 - hr * 0.45); c.lineTo(w, cy0); c.closePath(); c.fill(); c.strokeStyle = '#8a5a00'; c.lineWidth = lw * 0.7; c.stroke(); c.fillStyle = '#ff3b6b'; c.beginPath(); c.arc(0, cy0 - hr * 0.16, hr * 0.12, 0, 7); c.fill(); }
  if (SK === 'p_neon') { c.save(); c.shadowColor = C.c; c.shadowBlur = r * 0.8; c.strokeStyle = ludoMix(C.c, 255, 0.6); c.lineWidth = lw * 1.4; c.globalAlpha = 0.6 + 0.4 * Math.sin(t / 200 + i); c.beginPath(); c.arc(0, hy, hr * 1.06, 0, 7); c.stroke(); c.restore(); }
  if (SK === 'p_gold') { for (let k = 0; k < 3; k++) { const a = t / 400 + k * 2.1, tw = 0.5 + 0.5 * Math.sin(t / 180 + k * 2); c.fillStyle = 'rgba(255,240,150,' + tw + ')'; ludoStar(c, Math.cos(a) * hr * 1.25, hy - hr * 0.2 + Math.sin(a) * hr * 0.9, hr * 0.17 * tw + 1, hr * 0.06); c.fill(); } }
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
  b.append(lel('span', 'ludoDsh'), cube); cube.style.transform = 'rotateX(-10deg) rotateY(12deg) ' + LUDO_FACE[5]; return b;
}
function ludoDiceUpdate(t, s) {
  const b = document.getElementById('ludoDice'), cube = document.getElementById('ludoCube'); if (!b || !cube) return;
  const rolling = t < LUDOG.rolling;
  { const rs = LUDOG.last && LUDOG.last.k === 'roll' && (t < LUDOG.rolling + 3000 || s.rolled) ? LUDOG.last.s : s.turn, dk = ((s.seats[rs] || {}).dk) || ''; if (b.dataset.dk !== dk) { if (b.dataset.dk) b.classList.remove('dk-' + b.dataset.dk); b.dataset.dk = dk; if (dk) b.classList.add('dk-' + dk); } }
  if (rolling && !LUDOG.dRoll) { LUDOG.dRoll = true; cube.classList.add('rolling'); b.classList.add('rolling'); b.classList.remove('land'); }
  else if (!rolling && LUDOG.dRoll) { LUDOG.dRoll = false; cube.classList.remove('rolling'); b.classList.remove('rolling'); b.classList.add('land'); setTimeout(() => b.classList.remove('land'), 450); }
  const dn = document.getElementById('ludoDNum'); if (dn) { const v2 = rolling ? 0 : (s.rolled ? s.dice : 0); if (dn.dataset.v !== String(v2)) { dn.dataset.v = v2; dn.textContent = v2 || ''; dn.classList.toggle('on', !!v2); dn.classList.toggle('six', v2 === 6); } }
  if (!rolling) { const v = s.dice || LUDOG.dice || 5; if (LUDOG.dShown !== v) { LUDOG.dShown = v; cube.style.transform = 'rotateX(-10deg) rotateY(12deg) ' + LUDO_FACE[v]; } }
}
function ludoDraw() {
  const s = LUDOG.s, cv = LUDOG.cv; if (!s || !cv) return; const G = ludoGeom(), c = cv.getContext('2d'), u = G.u, pad = G.pad; const t = performance.now();
  c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); c.clearRect(0, 0, G.sz, G.sz); c.save(); if ((LUDOG.shake || 0) > t) c.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
  c.drawImage(ludoBoardCache(G), 0, 0, G.sz, G.sz);
  c.save(); c.translate(pad, pad);
  /* وهج النجوم (حيّة) */
  LUDO_SAFE.forEach(a => { if (LUDO_START.includes(a)) return; const q = LUDO_TRACK[a], cx = (q[0] + 0.5) * u, cy = (q[1] + 0.52) * u, g = c.createRadialGradient(cx, cy, 0, cx, cy, u * 0.7); g.addColorStop(0, 'rgba(255,225,110,' + (0.28 + 0.2 * Math.sin(t / 500 + a)) + ')'); g.addColorStop(1, 'rgba(255,225,110,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, u * 0.7, 0, 7); c.fill(); });
  /* خانات آمنة واضحة: نجمة تلمع + بريق يدور + درع صغير 🛡️ */
  LUDO_SAFE.forEach(a => { const q = LUDO_TRACK[a], cx = (q[0] + 0.5) * u, cy = (q[1] + 0.52) * u; for (let k = 0; k < 4; k++) { const an = t / 700 + k * 1.571 + a; c.fillStyle = 'rgba(255,255,255,' + (0.55 + 0.4 * Math.sin(t / 300 + k)) + ')'; c.beginPath(); c.arc(cx + Math.cos(an) * u * 0.44, cy + Math.sin(an) * u * 0.44, u * 0.05, 0, 7); c.fill(); } if (!LUDO_START.includes(a)) { const sh = 0.5 + 0.5 * Math.sin(t / 380 + a); c.save(); c.globalAlpha = 0.35 + 0.5 * sh; c.translate(cx, cy); c.scale(1 + sh * 0.12, 1 + sh * 0.12); c.fillStyle = 'rgba(255,255,255,.9)'; ludoStar(c, 0, 0, u * 0.17, u * 0.07); c.fill(); c.restore(); } });
  /* وهج بيت صاحب الدور */
  if (s.ph === 'play' && s.turn >= 0) { const C = LUDO_COL[s.turn], b = LUDO_BASE[s.turn]; c.save(); c.shadowColor = C.c; c.shadowBlur = 16 + 8 * Math.sin(t / 220); c.strokeStyle = '#fff'; c.globalAlpha = 0.75 + 0.2 * Math.sin(t / 220); c.lineWidth = 3; ludoRR(c, b[0] * u + 3, b[1] * u + 3, 6 * u - 6, 6 * u - 6, u * 0.4); c.stroke(); c.restore(); }
  /* الأحجار */
  const spots = ludoTokenSpots(s), me = s.my, mv = new Set(t < LUDOG.rolling ? [] : (s.movable || []));
  /* إظهار الحركات الممكنة: نقاط الطريق خانة خانة + علامة بالخانة اللي راح توصلها (💥 أكل • 🏠 بيت • ⭐ آمنة) */
  if (s.ph === 'play' && s.turn === me && s.rolled && mv.size) { const P = s.seats[me]; spots.forEach(o => { if (o.seat !== me || !mv.has(o.k)) return; const from = o.pos, to = from < 0 ? 0 : from + s.dice, C = LUDO_COL[me];
    for (let pp = (from < 0 ? 0 : from + 1); pp < to; pp++) { const q = ludoCell(me, pp, o.k), ph = (t / 90 - pp * 2) % 12; c.fillStyle = C.c; c.globalAlpha = 0.35 + (ph > 0 && ph < 3 ? 0.5 : 0); c.beginPath(); c.arc(q[0] * u, q[1] * u, u * 0.12, 0, 7); c.fill(); c.globalAlpha = 1; }
    const q = ludoCell(me, to, o.k), lab = ludoTargetTag(s, me, to); if (lab) { c.save(); c.font = (u * 0.62) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.translate(q[0] * u, q[1] * u - u * 0.78 - Math.abs(Math.sin(t / 220)) * u * 0.15); c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(0, 0, u * 0.42, 0, 7); c.fill(); c.strokeStyle = C.c; c.lineWidth = 2; c.stroke(); c.fillText(lab, 0, u * 0.03); c.restore(); } }); }
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
    if (!d.seg && d.q.length) { const n = d.q.shift(); d.seg = { fx: d.x, fy: d.y, tx: n.x, ty: n.y, t0: t, dur: n.fly ? 1000 : Math.max(95, 200 - d.q.length * 14), fly: !!n.fly }; }
    if (d.seg) { const sg = d.seg, p = Math.min(1, (t - sg.t0) / sg.dur), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; d.x = sg.fx + (sg.tx - sg.fx) * (sg.fly ? e : p); d.y = sg.fy + (sg.ty - sg.fy) * (sg.fly ? e : p); lift = Math.sin(Math.PI * p) * (sg.fly ? 2.4 : 0.62); tilt = sg.fly ? p * Math.PI * 4 : (sg.tx - sg.fx) * 0.12 * Math.sin(Math.PI * p);
      if (p >= 1) { d.x = sg.tx; d.y = sg.ty; d.land = t; if (!sg.fly) { ludoSfx('step'); } d.seg = null; } }
    else { d.x += (o.tx - d.x) * 0.25; d.y += (o.ty - d.y) * 0.25; }
    const C = LUDO_COL[o.seat], canMove = o.seat === me && mv.has(o.k), moving = !!d.seg || d.q.length > 0, r = u * (o.cnt > 1 && o.pos >= 0 ? 0.33 : 0.45);
    const bob = canMove ? Math.abs(Math.sin(t / 190)) * 0.22 : 0, la = t - d.land, sq = la < 190 ? Math.sin(Math.PI * la / 190) * 0.16 : 0;
    const px = d.x * u, gy = d.y * u + r * 0.55, py = gy - (lift + bob) * u;
    c.fillStyle = 'rgba(0,0,0,' + Math.max(0.08, 0.34 - (lift + bob) * 0.22) + ')'; c.beginPath(); c.ellipse(px, gy + r * 0.02, r * (1.0 - (lift + bob) * 0.28), r * 0.34 * (1 - (lift + bob) * 0.2), 0, 0, 7); c.fill();
    if (canMove) { const g = c.createRadialGradient(px, gy, 0, px, gy, r * 1.7); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.5, C.c + '66'); g.addColorStop(1, C.c + '00'); c.fillStyle = g; c.beginPath(); c.ellipse(px, gy, r * 1.7, r * 0.7, 0, 0, 7); c.fill(); }
    const look = [Math.max(-1, Math.min(1, (7.5 - d.x) / 6)), Math.max(-1, Math.min(1, (7.5 - d.y) / 6))], won = !!(s.ph === 'over' && s.win && s.win.s === o.seat), dizzy = d.hit > t, scared = !dizzy && !moving && danger(o);
    const dim = s.ph === 'play' && s.turn === me && s.rolled && mv.size && o.seat === me && !canMove;
    o.px = px; o.py = py - r * 1.1; o.r = r; o.draw = () => { if (dim) c.globalAlpha = 0.5; ludoPawn(c, px, py, r * 1.05, o.seat, t, { sk: (s.seats[o.seat] || {}).sk || '', idx: o.seat * 4 + o.k, look, sx: 1 + sq * 0.6, sy: 1 - sq, tilt, bob: won ? Math.sin(t / 120) * 0.12 : 0, sleep: o.pos < 0 && !canMove && !dizzy && s.ph === 'play', happy: (o.pos === 56 || won || (lift > 0.2 && !scared)) && !dizzy, excited: canMove, scared, dizzy }); c.globalAlpha = 1; }; });
  spots.sort((a, b) => (a.py || 0) - (b.py || 0)); spots.forEach(o => o.draw && o.draw());
  LUDOG.spots = spots; ludoFx(c, u); ludoBubDraw(c, u, t); ludoPopDraw(c, u, t);
  c.restore();
  /* العد التنازلي 3-2-1 قبل بداية اللعبة */
  if ((LUDOG.cd || 0) > t) { const left = LUDOG.cd - t, n = Math.max(1, Math.ceil(left / 1000)), fr = (left % 1000) / 1000; if (LUDOG.cdN !== n) { LUDOG.cdN = n; ludoSfx('cd'); } c.fillStyle = 'rgba(10,6,30,.6)'; c.fillRect(0, 0, G.sz, G.sz); c.save(); c.translate(G.sz / 2, G.sz / 2); const sc = 0.7 + 0.5 * fr; c.scale(sc, sc); c.globalAlpha = Math.min(1, fr * 3); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 ' + (u * 6) + 'px Cairo, system-ui, sans-serif'; c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = ['#ffd23a', '#ff9f1c', '#ff5a8a'][Math.max(0, Math.min(2, 3 - n))]; c.strokeText(n, 0, 0); c.fillText(n, 0, 0); c.restore(); c.save(); c.textAlign = 'center'; c.font = 'bold ' + (u * 1) + 'px Cairo, system-ui, sans-serif'; c.fillStyle = '#fff'; c.fillText('🎲 جاهزين؟', G.sz / 2, G.sz * 0.2); c.restore(); } else if (LUDOG.cdN) { LUDOG.cdN = 0; ludoSfx('cdgo'); }
  if (s.ph === 'over' && s.win) { const k = Math.min(1, (t - (LUDOG.winT || t)) / 500); c.fillStyle = 'rgba(10,6,30,' + (0.45 * k) + ')'; c.fillRect(0, 0, G.sz, G.sz); }
  c.restore();
  ludoDiceUpdate(t, s); ludoTimerUpdate(t, s);
}
function ludoClick(e) {
  const s = LUDOG.s; if (s && s.ph === 'over') return; if (performance.now() < LUDOG.rolling || (LUDOG.cd || 0) > performance.now()) return; if (!s || s.ph !== 'play' || s.turn !== s.my || !s.rolled || !LUDOG.spots || !(s.movable || []).length) return;
  /* الإحداثيات بوحدات CSS (الرسم يستخدم setTransform بنسبة الشاشة، فلا نقسم على dpr) + نطرح هامش الإطار */
  const r = LUDOG.cv.getBoundingClientRect(), k = (LUDOG.sz || r.width) / (r.width || 1), pad = Math.round((LUDOG.sz || r.width) * 0.04), x = (e.clientX - r.left) * k - pad, y = (e.clientY - r.top) * k - pad; let best = null, bd = 1e9;
  LUDOG.spots.forEach(o => { if (o.seat !== s.my || !s.movable.includes(o.k)) return; const dd = Math.hypot((o.px || 0) - x, (o.py || 0) - y); if (dd < bd) { bd = dd; best = o; } });
  if (best && bd < Math.max(30, (best.r || 10) * 2.4)) { ludoSfx('tap'); return ludoSend({ t: 'ludo_move', k: best.k }); }
  if (s.movable.length === 1) { ludoSfx('tap'); ludoSend({ t: 'ludo_move', k: s.movable[0] }); }   // خيار وحيد: أي لمسة على اللوحة تحرّكه
}
function ludoCss() {
  ludoCss2(); if (document.getElementById('ludoCss')) return; const st = document.createElement('style'); st.id = 'ludoCss';
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

/* ===================== إضافات: رقم النرد بالشاشة، «دورك!»، مايك (اضغط مطوّل واحجي)، شات الطاولة ===================== */
const LUDO_DEMO = { 1: '😅', 2: '🙂', 3: '😎', 4: '💪', 5: '🤩', 6: '🔥' };
const LUDO_DTXT = { 1: 'واحد', 2: 'اثنين', 3: 'ثلاثة', 4: 'أربعة', 5: 'خمسة', 6: 'ستة!' };
function ludoStageEl() { return document.getElementById('ludoStage'); }
function ludoRollPop(v, seat) {   /* رقم كبير متحرك بنص اللوحة: شكد طلع وإلمن */
  const st = ludoStageEl(), s = LUDOG.s; if (!st || !s || !v) return; st.querySelectorAll('.ludoRoll').forEach(x => x.remove());
  const C = LUDO_COL[seat] || LUDO_COL[0], p = s.seats[seat], mine = seat === s.my;
  const el = lel('div', 'ludoRoll' + (v === 6 ? ' six' : '')); el.style.setProperty('--c', C.c); el.style.setProperty('--d', C.d);
  const ring = lel('div', 'lrRing'), num = lel('div', 'lrNum', String(v)), em = lel('div', 'lrEm', LUDO_DEMO[v]), tx = lel('div', 'lrTx', mine ? 'طلعلك ' + LUDO_DTXT[v] : 'طلع لـ ' + (p ? p.n : '؟') + ' ' + LUDO_DTXT[v]);
  el.append(ring, num, em, tx); if (v === 6) for (let i = 0; i < 10; i++) { const sp = lel('i', 'lrSpark', i % 2 ? '✨' : '⭐'); sp.style.setProperty('--a', (i * 36) + 'deg'); el.appendChild(sp); }
  st.appendChild(el); setTimeout(() => el.remove(), 1700);
}
function ludoTurnBanner() {   /* «دورك!» كبيرة بالشاشة */
  const st = ludoStageEl(), s = LUDOG.s; if (!st || !s || s.ph !== 'play' || s.turn !== s.my) return; st.querySelectorAll('.ludoTurn').forEach(x => x.remove());
  const C = LUDO_COL[s.my]; const el = lel('div', 'ludoTurn'); el.style.setProperty('--c', C.c); el.style.setProperty('--d', C.d);
  el.append(lel('div', 'ltEm', '🎯'), lel('div', 'ltTx', 'دورك!'), lel('div', 'ltSub', '🎲 دوس النرد'));
  for (let i = 0; i < 12; i++) { const c = lel('i', 'ltCf'); c.style.setProperty('--a', (i * 30) + 'deg'); c.style.background = ['#fff', C.c, '#ffd23a'][i % 3]; el.appendChild(c); }
  st.appendChild(el); setTimeout(() => el.remove(), 2000);
}
/* ---------- المايك: اضغط مطوّل واحجي، ارفع إصبعك يندز للطاولة ---------- */
function ludoMicEl() {
  const b = lel('button', 'ludoMic'); b.type = 'button'; b.id = 'ludoMic'; b.append(lel('span', 'lmIc', '🎙️'), lel('small', '', 'اضغط مطوّل'));
  const down = e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (er) {} ludoRecStart(); };
  const up = e => { e && e.preventDefault(); const r = b.getBoundingClientRect(), far = e && (e.clientX < r.left - 60 || e.clientX > r.right + 60 || e.clientY < r.top - 60 || e.clientY > r.bottom + 60); if (far) showToast('🗑️ انلغى التسجيل'); ludoRecStop(!far); };
  b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', () => ludoRecStop(false));
  b.addEventListener('contextmenu', e => e.preventDefault()); return b;
}
async function ludoRecStart() {
  if (LUDOG.rec) return; if (!LUDOG.s) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { showToast('⚠️ متصفحك ما يدعم المايك'); return; }
  const r = LUDOG.rec = { down: true, chunks: [], t0: 0 };
  let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { LUDOG.rec = null; showToast('⚠️ لازم تسمح للعبة تستخدم المايك'); return; }
  if (!r.down || LUDOG.rec !== r) { stream.getTracks().forEach(t => t.stop()); if (LUDOG.rec === r) LUDOG.rec = null; showToast('🎙️ ظل ضاغط على المايك وانت تحجي'); return; }
  const mime = (typeof pickMime === 'function' ? pickMime() : '') || ''; let mr;
  try { mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); } catch (e) { stream.getTracks().forEach(t => t.stop()); LUDOG.rec = null; showToast('⚠️ ما قدرت أشغّل المايك'); return; }
  r.mr = mr; r.stream = stream; r.mime = mime; r.t0 = Date.now(); mr.ondataavailable = e => { if (e.data && e.data.size) r.chunks.push(e.data); };
  mr.onstop = () => { clearInterval(r.timer); stream.getTracks().forEach(t => t.stop()); ludoRecUi(false); if (LUDOG.rec === r) LUDOG.rec = null; const dur = (Date.now() - r.t0) / 1000; if (!r.send) return; if (dur < 0.7) { showToast('🎙️ اضغط مطوّل واحجي'); return; } ludoVoiceUp(new Blob(r.chunks, { type: (mr.mimeType || mime || 'audio/webm').split(';')[0] }), Math.min(20, dur)); };
  mr.start(); ludoRecUi(true); try { navigator.vibrate && navigator.vibrate(30); } catch (e) {}
  r.timer = setInterval(() => { const sec = (Date.now() - r.t0) / 1000, t = document.getElementById('ludoRecT'); if (t) t.textContent = '0:' + String(Math.floor(sec)).padStart(2, '0'); if (sec >= 20) ludoRecStop(true); }, 200);
}
function ludoRecStop(send) { const r = LUDOG.rec; if (!r) return; r.down = false; r.send = send; if (r.mr && r.mr.state !== 'inactive') { try { r.mr.stop(); } catch (e) {} } }
function ludoRecUi(on) {
  const b = document.getElementById('ludoMic'); if (b) b.classList.toggle('on', on);
  document.querySelectorAll('.ludoRecPill').forEach(x => x.remove()); if (!on) return;
  const st = ludoStageEl() || ludoRoot(); if (!st) return; const p = lel('div', 'ludoRecPill'); p.innerHTML = '<span class="lrDot"></span> تحجي... <b id="ludoRecT">0:00</b><small>ارفع إصبعك حتى يندز • اسحب بعيد وارفع للإلغاء</small>'; st.appendChild(p);
}
async function ludoVoiceUp(blob, dur) {
  if (blob.size > 6 * 1024 * 1024) return showToast('⚠️ التسجيل كبير');
  try { const r = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': blob.type, Authorization: 'Bearer ' + auth.token }, body: blob }); let j = null; try { j = await r.json(); } catch (e) {} if (!r.ok) throw new Error((j && j.error) || 'فشل رفع الصوت'); ludoSend({ t: 'ludo_voice', url: j.url, dur }); ludoSfx('click'); }
  catch (e) { showToast('⚠️ ' + e.message); }
}
function ludoPlayVoice(url, btn) {
  try { if (LUDOG.au) { LUDOG.au.pause(); document.querySelectorAll('.lcVo.play').forEach(x => x.classList.remove('play')); } const a = new Audio(url); LUDOG.au = a; if (btn) btn.classList.add('play'); a.onended = a.onpause = () => { if (btn) btn.classList.remove('play'); }; return a.play().catch(() => { if (btn) btn.classList.remove('play'); }); } catch (e) {}
}
/* ---------- شات الطاولة: سهم ينفتح وينسد + خلفية متحركة ---------- */
function ludoChatKill() { const w = document.getElementById('ludoChatW'); if (w) w.remove(); LUDOG.chatTid = null; LUDOG.chatOpen = false; }
function ludoChatEnsure() {
  const s = LUDOG.s, R = ludoRoot(); let w = document.getElementById('ludoChatW');
  if (!s || !R) { if (w) w.remove(); LUDOG.chatTid = null; return; }
  const host = R.parentNode; if (w && w.parentNode !== host) host.appendChild(w);
  if (!w) { w = ludoChatEl(); host.appendChild(w); }
  if (LUDOG.chatTid !== s.id) { LUDOG.chatTid = s.id; LUDOG.chatSeen = new Set(); LUDOG.unread = 0; const L = document.getElementById('ludoChatL'); if (L) L.innerHTML = ''; ludoChatEmpty(); (s.ch || []).forEach(m => ludoChatAdd(m, false)); ludoChatBadge(); }
}
function ludoChatEmpty() { const L = document.getElementById('ludoChatL'); if (L && !L.children.length) L.appendChild(lel('div', 'lcEmpty', '👋 سلّم على اللاعبين! اكتب أو اضغط المايك مطوّل واحجي')); }
function ludoChatEl() {
  const w = lel('div', 'ludoChatW'); w.id = 'ludoChatW';
  const tg = lel('button', 'ludoChatTg'); tg.type = 'button'; tg.innerHTML = '<span>💬</span><b class="lcArr">▲</b><i class="lcBadge" id="ludoChatB"></i>';
  const pn = lel('div', 'ludoChatP'); pn.id = 'ludoChatP';
  const bg = lel('div', 'lcBg'); ['💬', '🎲', '❤️', '⭐', '😂', '🔥', '✨', '🎉'].forEach((e, i) => { const f = lel('i', '', e); f.style.left = (6 + i * 12) + '%'; f.style.animationDelay = (-i * 1.7) + 's'; f.style.animationDuration = (9 + (i % 3) * 3) + 's'; bg.appendChild(f); });
  const hd = lel('div', 'lcHd'); const cl = lel('button', 'lcX', '▼'); cl.type = 'button'; hd.append(lel('b', '', '💬 شات الطاولة'), cl);
  const L = lel('div', 'ludoChatL'); L.id = 'ludoChatL';
  const em = lel('div', 'lcEmo'); const inp = lel('input'); inp.id = 'ludoChatI'; inp.maxLength = 200; inp.placeholder = 'اكتب رسالة حلوة... ✍️'; inp.enterKeyHint = 'send';
  ['😂', '❤️', '🔥', '👏', '😎', '😍', '🤣', '😭', '😡', '🙏', '👋', '🎉', '💪', '🤝'].forEach(e => { const b = lel('button', '', e); b.type = 'button'; b.onclick = () => { inp.value = (inp.value + e).slice(0, 200); inp.focus(); }; em.appendChild(b); });
  const row = lel('div', 'lcRow'); const sb = lel('button', 'lcSend', '➤'); sb.type = 'button';
  const go = () => { const v = inp.value.trim(); if (!v) return; ludoSend({ t: 'ludo_chat', text: v }); inp.value = ''; inp.focus(); };
  sb.onclick = go; inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  const mic = ludoMicEl(); mic.classList.add('inChat'); row.append(mic, inp, sb);
  pn.append(bg, hd, L, em, row); w.append(pn, tg);
  const set = open => { LUDOG.chatOpen = open; w.classList.toggle('open', open); tg.querySelector('.lcArr').textContent = open ? '▼' : '▲'; if (open) { LUDOG.unread = 0; ludoChatBadge(); w.querySelectorAll('.lcPeek').forEach(x => x.remove()); setTimeout(() => { L.scrollTop = L.scrollHeight; }, 60); } else inp.blur(); };
  tg.onclick = () => { ludoSfx('click'); set(!LUDOG.chatOpen); }; cl.onclick = () => set(false); set(!!LUDOG.chatOpen); return w;
}
function ludoChatBadge() { const b = document.getElementById('ludoChatB'); if (b) { b.textContent = LUDOG.unread > 9 ? '9+' : (LUDOG.unread || ''); b.classList.toggle('on', LUDOG.unread > 0); } }
function ludoChatAdd(m, live) {
  if (!m || !m.id) return; LUDOG.chatSeen = LUDOG.chatSeen || new Set(); if (LUDOG.chatSeen.has(m.id)) return; LUDOG.chatSeen.add(m.id);
  const L = document.getElementById('ludoChatL'), s = LUDOG.s; if (!L || !s) return; L.querySelectorAll('.lcEmpty').forEach(x => x.remove());
  const C = LUDO_COL[m.s] || LUDO_COL[0], mine = m.s === s.my, b = lel('div', 'lcm' + (mine ? ' mine' : '') + (m.sys ? ' sys' : '') + (live ? ' new' : '')); b.style.setProperty('--c', C.c); b.style.setProperty('--d', C.d);
  const nm = lel('div', 'lcN', (m.adm ? '👑 ' : '') + m.n); b.appendChild(nm);
  if (m.vo) { const v = lel('button', 'lcVo'); v.type = 'button'; v.innerHTML = '<span class="lcPl">▶️</span><span class="lcWv"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><small>0:' + String(m.dur || 1).padStart(2, '0') + '</small>'; v.onclick = () => ludoPlayVoice(m.vo, v); b.appendChild(v); }
  else { const only = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(m.tx) && m.tx.length <= 12; b.appendChild(lel('div', 'lcT' + (only ? ' big' : ''), m.tx)); }
  const d = new Date(m.at || Date.now()); b.appendChild(lel('small', 'lcTm', String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')));
  L.appendChild(b); while (L.children.length > 60) L.firstChild.remove(); L.scrollTop = L.scrollHeight;
  if (!live) return;
  if (!mine) { ludoSfx('click'); if (m.vo) { const vb = b.querySelector('.lcVo'); ludoPlayVoice(m.vo, vb); ludoSpeak(m); } }
  if (!LUDOG.chatOpen && !mine) {
    LUDOG.unread = (LUDOG.unread || 0) + 1; ludoChatBadge(); const w = document.getElementById('ludoChatW');
    if (w) { w.querySelectorAll('.lcPeek').forEach(x => x.remove()); const pk = lel('div', 'lcPeek', (m.adm ? '👑 ' : '') + m.n + ': ' + (m.vo ? '🎙️ رسالة صوتية' : m.tx)); pk.style.setProperty('--c', C.c); pk.onclick = () => w.querySelector('.ludoChatTg').click(); w.appendChild(pk); setTimeout(() => pk.remove(), 3500); }
  }
}
function ludoSpeak(m) { const st = ludoStageEl(); if (!st) return; const C = LUDO_COL[m.s] || LUDO_COL[0], el = lel('div', 'ludoSpk', '🔊 ' + m.n + ' يحجي...'); el.style.setProperty('--c', C.c); st.appendChild(el); setTimeout(() => el.remove(), Math.min(20, m.dur || 2) * 1000 + 600); }
function ludoCss2() {
  ludoCss3(); if (document.getElementById('ludoCss2')) return; const st = document.createElement('style'); st.id = 'ludoCss2';
  st.textContent = `.ludoStage{position:relative;width:100%}
.ludoDNum{min-width:0;width:0;height:52px;border-radius:16px;display:grid;place-items:center;font:900 30px Cairo,system-ui,sans-serif;color:#fff;background:linear-gradient(145deg,#8b5cf6,#5b2bd6);border:2px solid #fff;box-shadow:0 6px 16px rgba(90,40,200,.5);opacity:0;transform:scale(.3);transition:transform .35s cubic-bezier(.2,1.8,.4,1),opacity .2s,width .3s;overflow:hidden}.ludoDNum.on{width:52px;opacity:1;transform:scale(1)}.ludoDNum.six{background:linear-gradient(145deg,#ffb020,#ff4d6d);animation:ludoPulse .9s ease-in-out infinite}
.ludoRoll{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;z-index:6;animation:lrBg 1.7s ease forwards}
@keyframes lrBg{0%{background:rgba(10,6,30,0)}15%,75%{background:rgba(10,6,30,.38)}100%{background:rgba(10,6,30,0)}}
.lrNum{font:900 clamp(90px,34vw,170px)/1 Cairo,system-ui,sans-serif;color:#fff;-webkit-text-stroke:5px var(--d);text-shadow:0 0 0 var(--c),0 8px 0 var(--d),0 0 40px var(--c);animation:lrPop 1.7s cubic-bezier(.2,1.6,.4,1) forwards}
.lrEm{font-size:46px;margin-top:-6px;animation:lrEm 1.7s ease forwards}.lrTx{margin-top:6px;padding:6px 16px;border-radius:999px;background:var(--c);border:2px solid #fff;color:#fff;font-weight:900;font-size:17px;box-shadow:0 6px 18px rgba(0,0,0,.4);animation:lrEm 1.7s ease forwards}
.lrRing{position:absolute;left:50%;top:46%;width:60px;height:60px;margin:-30px;border-radius:50%;border:6px solid var(--c);animation:lrRing 1s ease-out forwards}
.lrSpark{position:absolute;left:50%;top:45%;font-style:normal;font-size:24px;animation:lrSp 1.2s ease-out forwards}
@keyframes lrPop{0%{transform:scale(.1) rotate(-25deg);opacity:0}25%{transform:scale(1.25) rotate(6deg);opacity:1}40%{transform:scale(1) rotate(0)}80%{transform:scale(1);opacity:1}100%{transform:scale(.6) translateY(-40px);opacity:0}}
@keyframes lrEm{0%,15%{transform:translateY(20px) scale(.5);opacity:0}35%{transform:none;opacity:1}80%{opacity:1}100%{opacity:0;transform:translateY(-20px)}}
@keyframes lrRing{0%{transform:scale(.3);opacity:1}100%{transform:scale(6);opacity:0}}
@keyframes lrSp{0%{transform:translate(-50%,-50%) rotate(var(--a)) translateY(0) scale(.3);opacity:0}30%{opacity:1}100%{transform:translate(-50%,-50%) rotate(var(--a)) translateY(-150px) scale(1.2);opacity:0}}
.ludoRoll.six .lrNum{animation:lrPop 1.7s cubic-bezier(.2,1.6,.4,1) forwards,lrShk .12s 6 .4s}@keyframes lrShk{50%{translate:4px 0}}
.ludoTurn{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;z-index:7;border-radius:14px;animation:ltBg 2s ease forwards}
@keyframes ltBg{0%{box-shadow:inset 0 0 0 0 var(--c);background:transparent}15%{box-shadow:inset 0 0 0 10px var(--c),inset 0 0 80px var(--c);background:rgba(10,6,30,.45)}80%{box-shadow:inset 0 0 0 6px var(--c),inset 0 0 50px var(--c);background:rgba(10,6,30,.35)}100%{box-shadow:inset 0 0 0 0 var(--c);background:transparent}}
.ltEm{font-size:64px;animation:ltIn 2s cubic-bezier(.2,1.7,.4,1) forwards}.ltTx{font:900 clamp(64px,22vw,110px)/1.1 Cairo,system-ui,sans-serif;color:#fff;paint-order:stroke fill;-webkit-text-stroke:0;text-shadow:0 3px 0 var(--d),0 6px 0 var(--d),0 0 18px var(--c),0 0 40px var(--c),0 0 70px var(--c);animation:ltIn 2s cubic-bezier(.2,1.7,.4,1) .08s both}
.ltSub{margin-top:8px;padding:6px 18px;border-radius:999px;background:#fff;color:var(--d);font-weight:900;font-size:18px;animation:ltIn 2s ease .18s both}
.ltCf{position:absolute;left:50%;top:50%;width:12px;height:12px;border-radius:3px;animation:ltCf 1.4s ease-out .1s forwards;opacity:0}
@keyframes ltIn{0%{transform:scale(.2);opacity:0}22%{transform:scale(1.2);opacity:1}35%{transform:scale(1)}82%{transform:scale(1);opacity:1}100%{transform:scale(1.4);opacity:0}}
@keyframes ltCf{0%{transform:rotate(var(--a)) translateY(0);opacity:1}100%{transform:rotate(var(--a)) translateY(-46vw) rotate(360deg);opacity:0}}
.ludoMic{display:flex;flex-direction:column;align-items:center;gap:1px;width:62px;height:62px;border-radius:50%;border:3px solid #fff;background:radial-gradient(circle at 35% 30%,#ff8fb1,#e5336b 60%,#a3164a);color:#fff;padding:0;justify-content:center;box-shadow:0 6px 18px rgba(229,51,107,.5);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;font-family:inherit;transition:transform .15s}.ludoMic .lmIc{font-size:24px;line-height:1}.ludoMic small{font-size:8px;font-weight:800;opacity:.9}
.ludoMic.on{transform:scale(1.25);animation:lmOn 1s ease-in-out infinite}@keyframes lmOn{0%,100%{box-shadow:0 0 0 0 rgba(255,60,110,.7)}50%{box-shadow:0 0 0 16px rgba(255,60,110,0)}}
.ludoMic.inChat{width:44px;height:44px;flex:0 0 44px;border-width:2px}.ludoMic.inChat small{display:none}.ludoMic.inChat .lmIc{font-size:20px}
.ludoRecPill{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:9;background:rgba(20,8,30,.88);border:2px solid #ff4d7d;color:#fff;border-radius:16px;padding:8px 14px;font-weight:800;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;text-align:center;max-width:90%;animation:lrEm .3s ease}.ludoRecPill small{width:100%;font-weight:600;opacity:.75;font-size:11px}
.lrDot{width:12px;height:12px;border-radius:50%;background:#ff2d55;animation:lrDot 1s infinite}@keyframes lrDot{50%{opacity:.2}}
.ludoSpk{position:absolute;right:8px;top:8px;z-index:8;padding:6px 12px;border-radius:999px;background:var(--c);color:#fff;font-weight:800;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.4);animation:ludoPulse 1s ease-in-out infinite}
.ludoChatW{position:fixed;inset:0;pointer-events:none;z-index:9400;direction:rtl}
.ludoChatTg{pointer-events:auto;position:absolute;right:14px;bottom:calc(16px + env(safe-area-inset-bottom));width:62px;height:62px;border-radius:50%;border:3px solid #fff;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-size:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;box-shadow:0 8px 24px rgba(124,58,237,.6);padding:0;animation:lcTg 2.4s ease-in-out infinite;transition:transform .2s}.ludoChatTg .lcArr{font-size:12px;margin-top:2px;transition:transform .3s}
@keyframes lcTg{50%{transform:translateY(-4px)}}
.lcBadge{position:absolute;top:-4px;left:-4px;min-width:22px;height:22px;border-radius:11px;background:#ff2d55;border:2px solid #fff;font:900 12px/18px system-ui;font-style:normal;text-align:center;padding:0 4px;transform:scale(0);transition:transform .25s cubic-bezier(.2,1.8,.4,1)}.lcBadge.on{transform:scale(1)}
.ludoChatP{pointer-events:auto;position:absolute;left:10px;right:10px;bottom:calc(90px + env(safe-area-inset-bottom));height:min(58vh,480px);max-width:520px;margin:0 auto;border-radius:24px;overflow:hidden;display:flex;flex-direction:column;border:2px solid rgba(255,255,255,.35);box-shadow:0 18px 50px rgba(0,0,0,.6);background:linear-gradient(135deg,#2b1055,#7a1f6b,#1e3a8a,#5b1a8a);background-size:400% 400%;animation:lcBgM 14s ease infinite;transform:translateY(calc(100% + 120px)) scale(.9);opacity:0;transition:transform .45s cubic-bezier(.2,1.3,.4,1),opacity .3s}
.ludoChatW.open .ludoChatP{transform:none;opacity:1}.ludoChatW:not(.open) .ludoChatP{pointer-events:none}
@keyframes lcBgM{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.lcBg{position:absolute;inset:0;pointer-events:none;overflow:hidden}.lcBg i{position:absolute;bottom:-40px;font-style:normal;font-size:26px;opacity:.16;animation:lcFl 10s linear infinite}@keyframes lcFl{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(-620px) rotate(40deg)}}
.lcBg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.14),transparent 30%),radial-gradient(circle at 70% 70%,rgba(255,120,200,.18),transparent 35%);animation:lcSpin 18s linear infinite}@keyframes lcSpin{to{transform:rotate(360deg)}}
.lcHd{position:relative;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(0,0,0,.25);color:#fff;font-size:16px;backdrop-filter:blur(6px)}.lcX{background:rgba(255,255,255,.18);border:0;color:#fff;width:34px;height:34px;border-radius:50%;font-size:14px}
.ludoChatL{position:relative;flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch}
.lcEmpty{margin:auto;color:#fff;opacity:.8;text-align:center;font-weight:700;padding:20px}
.lcm{max-width:80%;align-self:flex-start;background:rgba(255,255,255,.95);color:#22152f;border-radius:18px 18px 18px 6px;padding:7px 12px 4px;border-inline-start:5px solid var(--c);box-shadow:0 4px 12px rgba(0,0,0,.25)}.lcm.mine{align-self:flex-end;background:linear-gradient(135deg,var(--c),var(--d));color:#fff;border:0;border-radius:18px 18px 6px 18px}
.lcm.new{animation:lcIn .45s cubic-bezier(.2,1.6,.4,1)}@keyframes lcIn{0%{transform:scale(.3) translateY(20px);opacity:0}100%{transform:none;opacity:1}}
.lcN{font-weight:900;font-size:12px;color:var(--d)}.lcm.mine .lcN{color:#fff;opacity:.9}.lcT{font-size:16px;font-weight:600;word-break:break-word;line-height:1.5}.lcT.big{font-size:38px;line-height:1.2;animation:lcEmoJ 1s ease}@keyframes lcEmoJ{30%{transform:scale(1.4) rotate(-8deg)}60%{transform:scale(.9) rotate(5deg)}}
.lcTm{display:block;text-align:end;font-size:10px;opacity:.55}
.lcVo{display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.08);border:0;border-radius:14px;padding:6px 10px;color:inherit;font-family:inherit}.lcm.mine .lcVo{background:rgba(255,255,255,.2)}.lcPl{font-size:18px}.lcWv{display:flex;gap:3px;align-items:center;height:22px}.lcWv i{width:4px;height:40%;border-radius:2px;background:currentColor;opacity:.7}.lcWv i:nth-child(2n){height:80%}.lcWv i:nth-child(3n){height:60%}.lcVo.play .lcWv i{animation:lcWv .6s ease-in-out infinite}.lcVo.play .lcWv i:nth-child(2n){animation-delay:.15s}.lcVo.play .lcWv i:nth-child(3n){animation-delay:.3s}@keyframes lcWv{50%{height:100%}}
.lcEmo{position:relative;display:flex;gap:4px;overflow-x:auto;padding:6px 8px;background:rgba(0,0,0,.18);scrollbar-width:none}.lcEmo button{flex:0 0 auto;font-size:22px;background:rgba(255,255,255,.14);border:0;border-radius:12px;width:40px;height:38px;padding:0;transition:transform .12s}.lcEmo button:active{transform:scale(1.35)}
.lcRow{position:relative;display:flex;gap:6px;align-items:center;padding:8px;padding-bottom:calc(8px + env(safe-area-inset-bottom) * .3);background:rgba(0,0,0,.28)}.lcRow input{flex:1;min-width:0;height:44px;border-radius:22px;border:2px solid rgba(255,255,255,.5);background:rgba(255,255,255,.95);padding:0 14px;font-size:16px;font-family:inherit;color:#22152f}
.lcSend{width:44px;height:44px;flex:0 0 44px;border-radius:50%;border:0;background:linear-gradient(135deg,#22c55e,#0ea5e9);color:#fff;font-size:20px;transform:scaleX(-1);box-shadow:0 4px 12px rgba(0,0,0,.3)}.lcSend:active{transform:scaleX(-1) scale(.9)}
.lcPeek{pointer-events:auto;position:absolute;right:84px;bottom:calc(26px + env(safe-area-inset-bottom));max-width:60vw;background:#fff;color:#22152f;border-inline-start:5px solid var(--c);border-radius:16px 16px 4px 16px;padding:8px 12px;font-weight:700;font-size:14px;box-shadow:0 8px 22px rgba(0,0,0,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;animation:lcIn .4s cubic-bezier(.2,1.6,.4,1)}`;
  document.head.appendChild(st);
}

/* ===================== إضافات v9: مؤقت الدور، كمبيوتر 🤖، فرق 2 ضد 2، وضع سريع، منصة الفوز، سكنات، ثيمات الطاولة، رجوع بعد الانقطاع ===================== */
const LUDO_MODES = { classic: { n: 'عادي', s: '🎲 عادي', d: '4 قطع لكل لاعب' }, quick: { n: 'سريع', s: '⚡ سريع', d: 'قطعتين بس — تخلص بنص الوقت' }, team: { n: 'فرق', s: '🤝 فرق 2 ضد 2', d: '🔴🟡 ضد 🟢🔵 — الشريك كبالك والفوز مشترك' } };
const LUDO_THEMES = {
  wood: { n: '🪵 خشب', fr: ['#9a6232', '#b87a42', '#8a5428', '#6a3d1a'], gr: ['60,30,10', '255,210,150'], rim: ['#fff2b8', '#d9a93a', '#a47a1e'], fl: ['#fffdf6', '#f4ecd9', '#e9dfc6'], vein: '150,130,100', tl: ['#ffffff', '#ece4d0'], ln: 'rgba(0,0,0,.2)', bg: 'radial-gradient(ellipse at top,#2a1a52,#0a0814)' },
  gold: { n: '🥇 ذهبي', fr: ['#fff1b0', '#e0b23c', '#b9851a', '#7a5208'], gr: ['120,80,0', '255,250,210'], rim: ['#ffffff', '#f3d77a', '#c9971f'], fl: ['#fffaf0', '#fbefd2', '#f1dfb0'], vein: '200,150,40', tl: ['#fffdf5', '#f6e8c4'], ln: 'rgba(150,100,0,.3)', bg: 'radial-gradient(ellipse at top,#5a3d08,#1a1003)' },
  night: { n: '🌙 ليلي', fr: ['#2a2f6b', '#1d2152', '#151840', '#0b0d26'], gr: ['0,0,0', '140,170,255'], rim: ['#c7d2ff', '#6d7cff', '#3b45b8'], fl: ['#2a2f5e', '#1f2349', '#161a38'], vein: '140,160,255', tl: ['#454c92', '#2f3570'], ln: 'rgba(160,180,255,.4)', stars: 1, bg: 'radial-gradient(ellipse at top,#141a4a,#03040f)' }
};
const LUDO_SKINS = {
  p_crown: { n: 'تاج ملكي', e: '👑' }, p_cat: { n: 'أذان قطة', e: '🐱' }, p_shades: { n: 'نظارة كول', e: '😎' }, p_neon: { n: 'نيون مضيء', e: '✨' }, p_gold: { n: 'ذهبي فاخر', e: '🥇' },
  d_red: { n: 'نرد أحمر', e: '❤️' }, d_wood: { n: 'نرد خشبي', e: '🪵' }, d_candy: { n: 'نرد حلاوة', e: '🍬' }, d_night: { n: 'نرد ليلي', e: '🌙' }, d_gold: { n: 'نرد ذهبي', e: '🥇' }
};
function ludoTheme() { try { const v = localStorage.getItem('ludoTheme'); if (LUDO_THEMES[v]) return v; } catch (e) {} return 'wood'; }
function ludoThemeP() { return LUDO_THEMES[ludoTheme()]; }
function ludoThemeSet(v) { try { localStorage.setItem('ludoTheme', v); } catch (e) {} LUDOG.bgKey = ''; ludoBgApply(); ludoSfx('click'); document.querySelectorAll('.ludoThm button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); }
function ludoBgApply() { try { const b = document.querySelector('#pg-ludo .pgBody'); if (b) b.style.background = ludoThemeP().bg; } catch (e) {} }
function ludoThemeEl() {
  const w = lel('div', 'ludoBox'); w.appendChild(lel('div', 'ludoSec', '🎨 ثيم الطاولة')); const r = lel('div', 'ludoThm'); const cur = ludoTheme();
  Object.keys(LUDO_THEMES).forEach(k => { const b = lel('button', 'th-' + k + (k === cur ? ' on' : ''), LUDO_THEMES[k].n); b.type = 'button'; b.dataset.v = k; b.onclick = () => ludoThemeSet(k); r.appendChild(b); });
  w.appendChild(r); w.appendChild(lel('small', 'ludoNote', 'الثيم إلك إنت بس — تكدر تغيّره وقت ما تريد')); setTimeout(ludoBgApply, 0); return w;
}
function ludoCpuEl() {
  const w = lel('div', 'ludoBox cpu'); LUDOG.cpu = LUDOG.cpu || { m: 'classic', n: 1 };
  w.appendChild(lel('div', 'ludoSec', '🤖 العب ويا الكمبيوتر')); const draw = () => {
    w.querySelectorAll('.ludoChoose,.ludoNote,.ludoBtn').forEach(x => x.remove()); const C = LUDOG.cpu;
    const m = lel('div', 'ludoChoose'); Object.keys(LUDO_MODES).forEach(k => { const b = lel('button', k === C.m ? 'on' : '', LUDO_MODES[k].s); b.type = 'button'; b.onclick = () => { C.m = k; if (k === 'team') C.n = 3; ludoSfx('click'); draw(); }; m.appendChild(b); }); w.appendChild(m);
    if (C.m !== 'team') { const n = lel('div', 'ludoChoose'); [1, 2, 3].forEach(k => { const b = lel('button', k === C.n ? 'on' : '', '🤖'.repeat(k) + ' ' + k); b.type = 'button'; b.onclick = () => { C.n = k; ludoSfx('click'); draw(); }; n.appendChild(b); }); w.appendChild(n); }
    w.appendChild(lel('small', 'ludoNote', LUDO_MODES[C.m].d + (C.m === 'team' ? ' • شريكك والخصمين كمبيوتر' : '')));
    const go = lel('button', 'ludoBtn go', '▶️ يلا نلعب'); go.onclick = () => ludoSend({ t: 'ludo_cpu', m: C.m, n: C.n }); w.appendChild(go);
  }; draw(); return w;
}
function ludoModeEl(s, iAmHost) {
  const w = lel('div', 'ludoBox'); w.appendChild(lel('div', 'ludoSec', '🎮 وضع اللعب' + (iAmHost ? '' : ' (يختاره الهوست 👑)')));
  const m = lel('div', 'ludoChoose'); Object.keys(LUDO_MODES).forEach(k => { const b = lel('button', k === (s.mode || 'classic') ? 'on' : '', LUDO_MODES[k].s); b.type = 'button'; b.disabled = !iAmHost; b.onclick = () => ludoSend({ t: 'ludo_mode', m: k }); m.appendChild(b); });
  w.append(m, lel('small', 'ludoNote', LUDO_MODES[s.mode || 'classic'].d + (s.mode === 'team' && s.seats.filter(Boolean).length < 4 ? ' — يحتاج 4 لاعبين، كمّل بكمبيوتر 🤖' : ''))); return w;
}
function ludoShopEl() { const w = lel('div', 'ludoBox shop'); w.id = 'ludoShop'; w.appendChild(lel('div', 'ludoSec', '🛍️ سكنات غوكو')); w.appendChild(lel('small', 'ludoNote', '...')); setTimeout(ludoShopRender, 0); return w; }
function ludoShopRender() {
  const w = document.getElementById('ludoShop'), d = LUDOG.shop; if (!w || !d) return; w.innerHTML = '';
  w.appendChild(lel('div', 'ludoSec', '🛍️ سكنات غوكو • 🪙 ' + (d.adm ? '∞' : d.coins)));
  [['p', '♟️ سكنات القطع'], ['d', '🎲 سكنات النرد']].forEach(([kd, ttl]) => {
    w.appendChild(lel('small', 'ludoSub', ttl)); const g = lel('div', 'ludoSkins');
    const none = lel('button', 'ludoSkin' + (!d.sel[kd] ? ' sel' : '')); none.type = 'button'; none.append(lel('span', 'e', kd === 'p' ? '♟️' : '🎲'), lel('b', '', 'العادي'), lel('small', '', !d.sel[kd] ? '✅ لابسه' : 'البسه')); none.onclick = () => ludoSend({ t: 'ludo_sel', kind: kd, k: '' }); g.appendChild(none);
    Object.keys(d.price).filter(k => k[0] === kd).sort((a, b) => d.price[a] - d.price[b]).forEach(k => {
      const own = d.own.includes(k), on = d.sel[kd] === k, S = LUDO_SKINS[k] || { n: k, e: '✨' }, b = lel('button', 'ludoSkin' + (own ? ' own' : '') + (on ? ' sel' : '') + ' sk-' + k); b.type = 'button';
      b.append(lel('span', 'e', S.e), lel('b', '', S.n), lel('small', '', on ? '✅ لابسه' : own ? 'البسه' : '🪙 ' + d.price[k]));
      b.onclick = () => { if (on) return; if (own) return ludoSend({ t: 'ludo_sel', kind: kd, k }); if (!d.adm && d.coins < d.price[k]) { ludoSfx('err'); return showToast('🪙 عملاتك ما تكفي، تحتاج ' + d.price[k]); } if (confirm('تشتري «' + S.n + '» بـ ' + d.price[k] + ' عملة؟')) ludoSend({ t: 'ludo_buy', k }); };
      g.appendChild(b);
    }); w.appendChild(g);
  });
  w.appendChild(lel('small', 'ludoNote', 'كل اللاعبين يشوفون سكناتك بالطاولة 😎'));
}
/* ---------- مؤقت الدور (15 ثانية) ---------- */
function ludoTimerUpdate(t, s) {
  const E = document.getElementById('ludoTmr'); if (!E) return; const on = s.ph === 'play' && !((LUDOG.cd || 0) > t);
  E.classList.toggle('on', on); if (!on) return;
  const rem = Math.max(0, (LUDOG.dl || 0) - t), mx = Math.max(1000, LUDOG.tMax || 15000), pr = Math.min(1, rem / mx), sec = Math.ceil(rem / 1000), mine = s.turn === s.my, P = s.seats[s.turn] || {}, C = LUDO_COL[s.turn] || LUDO_COL[0];
  E.style.setProperty('--c', C.c); E.style.setProperty('--p', (pr * 100).toFixed(1) + '%'); E.classList.toggle('low', sec <= 5 && mine && !P.bot);
  const tx = P.bot ? '🤖 يفكّر...' : P.off ? '📶 ننتظره يرجع' : (mine ? '⏱️ باقيلك ' : '⏱️ ') + sec + ' ث' + (mine && sec <= 5 ? ' — بسرعة وإلا تنلعب عنك!' : '');
  const b = E.querySelector('b'); if (b.textContent !== tx) b.textContent = tx;
  const ch = document.querySelector('.ludoChip.on'); if (ch) ch.style.setProperty('--p', (pr * 100).toFixed(1) + '%');
  if (mine && !P.bot && sec <= 5 && sec >= 1 && LUDOG.tickN !== sec) { LUDOG.tickN = sec; ludoSfx(sec <= 2 ? 'tick2' : 'tick'); } if (sec > 5) LUDOG.tickN = 0;
}
/* ---------- علامة الخانة اللي راح توصلها ---------- */
function ludoTargetTag(s, me, to) {
  if (to === 56) return '🏠'; if (to > 50) return '';
  const a = (LUDO_START[me] + to) % 52; if (LUDO_SAFE.includes(a)) return '⭐';
  const eat = s.seats.some((q, i) => q && i !== me && !(s.mode === 'team' && i % 2 === me % 2) && q.tk.some(qp => qp >= 0 && qp <= 50 && (LUDO_START[i] + qp) % 52 === a));
  return eat ? '💥' : '';
}
/* ---------- إيموجي سريع فوق صورة اللاعب (بيته باللوحة) ---------- */
LUDOG.bub = {};
function ludoBubDraw(c, u, t) {
  Object.keys(LUDOG.bub).forEach(k => { const B = LUDOG.bub[k], age = t - B.t0; if (age > 2400) { delete LUDOG.bub[k]; return; } const b = LUDO_BASE[k], cx = (b[0] + 3) * u, cy = (b[1] + 3) * u - Math.min(1, age / 300) * u * 0.6, sc = age < 250 ? age / 250 * 1.25 : age < 400 ? 1.25 - (age - 250) / 150 * 0.25 : 1, al = age > 1900 ? 1 - (age - 1900) / 500 : 1;
    c.save(); c.globalAlpha = al; c.translate(cx, cy); c.scale(sc, sc); c.fillStyle = '#fff'; c.strokeStyle = LUDO_COL[k].c; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, u * 1.25, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-u * 0.3, u * 1.15); c.lineTo(0, u * 1.65); c.lineTo(u * 0.3, u * 1.15); c.fill(); c.font = (u * 1.5) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(B.e, 0, u * 0.08); c.restore(); });
}
/* ---------- نص يطلع من فوق (انأكل!) ---------- */
LUDOG.pops = [];
function ludoPop(x, y, tx, col) { LUDOG.pops.push({ x, y, tx, col, t0: performance.now() }); }
function ludoPopDraw(c, u, t) {
  LUDOG.pops = LUDOG.pops.filter(P => t - P.t0 < 1600); LUDOG.pops.forEach(P => { const a = (t - P.t0) / 1600; c.save(); c.globalAlpha = 1 - a * a; c.translate(P.x * u, P.y * u - a * u * 2.2); c.rotate(Math.sin(a * 20) * 0.08 * (1 - a)); const sc = a < 0.15 ? a / 0.15 * 1.3 : 1.3 - Math.min(0.3, (a - 0.15) * 2); c.scale(sc, sc); c.font = '900 ' + (u * 0.85) + 'px Cairo, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,.75)'; c.strokeText(P.tx, 0, 0); c.fillStyle = '#fff'; c.fillText(P.tx, 0, 0); c.restore(); });
}
/* ---------- منصة الفوز: الأول والثاني والثالث ---------- */
function ludoIWon(s) { if (!s || !s.win) return false; if (s.mode === 'team') return s.my >= 0 && s.my % 2 === s.win.team; return s.win.s === s.my; }
function ludoWinTitle(s) { const W = s.win || {}; if (s.mode === 'team') { const a = s.seats[W.team], b = s.seats[W.team + 2]; return 'فاز فريق ' + (W.team ? '🟢🔵' : '🔴🟡') + ' (' + [a, b].filter(Boolean).map(x => x.n).join(' و ') + ')'; } const w = s.seats[W.s]; return 'فاز ' + (w ? w.n : '؟'); }
function ludoPodium(s) {
  const st = ludoStageEl(); if (!st || !s.win) return; st.querySelectorAll('.ludoPod').forEach(x => x.remove());
  const W = s.win, rw = W.rw || {}, el = lel('div', 'ludoPod' + (ludoIWon(s) ? ' won' : ''));
  el.appendChild(lel('div', 'lpTtl', '🏆 ' + ludoWinTitle(s) + '!'));
  const ranks = (W.ranks || []).slice(), steps = lel('div', 'lpSteps');
  const place = (r, cls) => { if (!r) return; const p = s.seats[r.s], C = LUDO_COL[r.s], col = lel('div', 'lpCol ' + cls); col.style.setProperty('--c', C.c); col.style.setProperty('--d', C.d);
    col.append(lel('div', 'lpMed', ['', '🥇', '🥈', '🥉'][r.r] || ''), lel('div', 'lpPawn'), lel('b', '', (p ? p.n : '؟') + (r.s === s.my ? ' (إنت)' : '')), lel('small', 'lpRw', rw[r.s] || ''), lel('div', 'lpStep', String(r.r))); steps.appendChild(col); };
  if (s.mode === 'team') { const win = ranks.filter(r => r.s % 2 === W.team), lose = ranks.filter(r => r.s % 2 !== W.team); win.forEach(r => place({ s: r.s, r: 1 }, 'p1')); lose.forEach(r => place({ s: r.s, r: 2 }, 'p2')); }
  else { place(ranks[1], 'p2'); place(ranks[0], 'p1'); place(ranks[2], 'p3'); }
  el.appendChild(steps);
  if (s.mode !== 'team' && ranks[3]) { const p = s.seats[ranks[3].s]; el.appendChild(lel('small', 'lpRest', '4️⃣ ' + (p ? p.n : ''))); }
  if (W.vsBot) el.appendChild(lel('small', 'lpRest', '🤖 لعبة ويا الكمبيوتر: جائزة صغيرة (10 مرات باليوم)'));
  el.appendChild(lel('small', 'lpRest', ludoRm() ? '💵 الجوائز بالمنتجع: دولار المنتجع' : '🪙 الجوائز: عملات'));
  for (let i = 0; i < 14; i++) { const cf = lel('i', 'lpCf'); cf.style.setProperty('--x', (Math.random() * 100) + '%'); cf.style.setProperty('--dl', (Math.random() * 1.5) + 's'); cf.style.background = ['#ffd23a', '#ef3b3b', '#2fbf5b', '#2f7bff', '#ff6bd5'][i % 5]; el.appendChild(cf); }
  st.appendChild(el);
}
/* ---------- رجوع بعد انقطاع النت ---------- */
window.ludoReconnect = () => { try { if (typeof auth !== 'undefined' && auth) ludoSend({ t: 'ludo_get' }); } catch (e) {} };
const _ludoEmoFloat = ludoEmoFloat;
ludoEmoFloat = function (seat, e) { try { if (seat >= 0 && LUDOG.cv && document.getElementById('ludoCv')) LUDOG.bub[seat] = { e, t0: performance.now() }; } catch (er) {} return _ludoEmoFloat(seat, e); };
function ludoCss3() {
  if (document.getElementById('ludoCss3')) return; const st = document.createElement('style'); st.id = 'ludoCss3';
  st.textContent = `.ludoBox{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:8px}.ludoBox.cpu{border-color:rgba(120,220,255,.55);background:linear-gradient(135deg,rgba(40,120,200,.22),rgba(120,60,220,.18))}
.ludoChoose{display:flex;gap:6px;flex-wrap:wrap}.ludoChoose button{flex:1 1 30%;padding:9px 6px;border-radius:12px;border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08);color:#fff;font-weight:800;font-family:inherit;font-size:13px}.ludoChoose button.on{background:linear-gradient(135deg,#ff8a2a,#e53b6a);border-color:#fff;box-shadow:0 0 12px rgba(255,120,80,.6)}.ludoChoose button:disabled{opacity:.75}
.ludoThm{display:flex;gap:6px}.ludoThm button{flex:1;padding:10px 4px;border-radius:12px;border:2px solid rgba(255,255,255,.35);color:#fff;font-weight:800;font-family:inherit}.ludoThm .th-wood{background:linear-gradient(135deg,#b87a42,#6a3d1a)}.ludoThm .th-gold{background:linear-gradient(135deg,#f3d77a,#b9851a);color:#3a2600}.ludoThm .th-night{background:linear-gradient(135deg,#3b45b8,#0b0d26)}.ludoThm button.on{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.35),0 0 14px rgba(255,255,255,.5);transform:scale(1.04)}
.ludoSub{font-weight:800;opacity:.9}.ludoSkins{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.ludoSkin{display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 4px;border-radius:14px;border:2px solid rgba(255,255,255,.25);background:rgba(255,255,255,.07);color:#fff;font-family:inherit}.ludoSkin .e{font-size:26px}.ludoSkin b{font-size:12px}.ludoSkin small{font-size:11px;font-weight:800;color:#ffd166}.ludoSkin.own small{color:#7dffb5}.ludoSkin.sel{border-color:#3ee08a;background:rgba(40,160,90,.25);box-shadow:0 0 12px rgba(62,224,138,.45)}
.ludoSeat{position:relative}.ludoSeat.bot{background:rgba(120,200,255,.12)}.ludoDot{display:grid;place-items:center;font-size:18px}.ludoSit.bot{background:linear-gradient(135deg,#38bdf8,#6366f1)}.ludoSit.ghost{background:rgba(255,255,255,.15)}
.ludoTeamTag{position:absolute;top:4px;inset-inline-start:6px;font-size:10px;font-weight:800;padding:1px 6px;border-radius:999px;background:rgba(0,0,0,.35)}
.ludoChip.on{background:conic-gradient(var(--c) var(--p,100%),rgba(255,255,255,.12) 0)}.ludoChip.net{opacity:.7;border-style:dashed}.ludoChip.mode{border-color:#fff;background:rgba(255,255,255,.15)}
.ludoTmr{position:relative;height:26px;border-radius:13px;overflow:hidden;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);display:none}.ludoTmr.on{display:block}.ludoTmr i{position:absolute;inset:0;width:var(--p,100%);background:linear-gradient(90deg,var(--c),#fff8);transition:width .25s linear}.ludoTmr b{position:relative;display:block;text-align:center;font-size:13px;line-height:24px;text-shadow:0 1px 3px rgba(0,0,0,.7)}.ludoTmr.low{animation:ludoPulse .5s ease-in-out infinite;border-color:#ff4d6d}.ludoTmr.low i{background:linear-gradient(90deg,#ff2d55,#ff9f1c)}
.ludoDice.dk-d_red .ludoFace{background:linear-gradient(145deg,#ff8a8a,#e0243f);border-color:#ffc2c2}.ludoDice.dk-d_red .ludoFace i{background:#fff}
.ludoDice.dk-d_wood .ludoFace{background:repeating-linear-gradient(100deg,#c48a4f 0 6px,#b07436 6px 10px,#d39a5c 10px 14px);border-color:#7a4a1c}.ludoDice.dk-d_wood .ludoFace i{background:#3b1f08}
.ludoDice.dk-d_candy .ludoFace{background:linear-gradient(145deg,#ffd1ec,#ff7ac6);border-color:#fff}.ludoDice.dk-d_candy .ludoFace i{background:radial-gradient(circle at 35% 30%,#fff,#7c3aed)}
.ludoDice.dk-d_night .ludoFace{background:linear-gradient(145deg,#1e2459,#070a24);border-color:#6d7cff;box-shadow:inset 0 0 14px rgba(109,124,255,.6)}.ludoDice.dk-d_night .ludoFace i{background:#a5f3ff;box-shadow:0 0 6px #6ee7ff}
.ludoDice.dk-d_gold .ludoFace{background:linear-gradient(145deg,#fff5c0,#f2c94c 50%,#b8860b);border-color:#fff3b0}.ludoDice.dk-d_gold .ludoFace i{background:radial-gradient(circle at 35% 30%,#6b3d00,#2a1600)}
.ludoPod{position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border-radius:14px;overflow:hidden;background:radial-gradient(circle at 50% 30%,rgba(255,210,90,.25),rgba(10,6,30,.82) 60%);animation:lpIn .6s ease}@keyframes lpIn{from{opacity:0;transform:scale(.85)}}
.lpTtl{font:900 clamp(18px,5.4vw,26px) Cairo,system-ui,sans-serif;color:#ffd84a;text-shadow:0 2px 0 #8a5a00,0 0 18px rgba(255,200,60,.7);text-align:center;padding:0 10px;animation:ludoBob 1.6s ease-in-out infinite}
.lpSteps{display:flex;align-items:flex-end;gap:8px;justify-content:center;width:100%;padding:0 10px}.lpCol{flex:0 1 31%;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;animation:lpUp .7s cubic-bezier(.2,1.5,.4,1) both}.lpCol.p1{animation-delay:.5s}.lpCol.p2{animation-delay:.25s}.lpCol.p3{animation-delay:0s}@keyframes lpUp{from{transform:translateY(80px);opacity:0}}
.lpCol b{font-size:13px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lpMed{font-size:34px}.lpCol.p1 .lpMed{font-size:46px;animation:ludoBob 1.2s ease-in-out infinite}
.lpPawn{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 28%,#fff 0,#fff 8%,var(--c) 42%,var(--d));box-shadow:0 4px 10px rgba(0,0,0,.5)}.lpCol.p1 .lpPawn{width:44px;height:44px}
.lpStep{width:100%;display:grid;place-items:center;font:900 26px Cairo,system-ui;color:#fff;border-radius:10px 10px 0 0;background:linear-gradient(180deg,var(--c),var(--d));border:2px solid rgba(255,255,255,.6);border-bottom:0}.lpCol.p1 .lpStep{height:96px}.lpCol.p2 .lpStep{height:68px}.lpCol.p3 .lpStep{height:48px}
.lpRw{color:#7dffb5;font-weight:900;min-height:15px}.lpRest{opacity:.85;font-size:12px;text-align:center;padding:0 10px}
.lpCf{position:absolute;top:-12px;left:var(--x);width:9px;height:14px;border-radius:2px;animation:lpCf 2.6s linear var(--dl) infinite}@keyframes lpCf{to{transform:translateY(120vw) rotate(720deg)}}
.lcm.sys{align-self:center;max-width:92%;background:rgba(255,255,255,.18);color:#fff;border:0;border-radius:999px;text-align:center;padding:5px 12px}.lcm.sys .lcN,.lcm.sys .lcTm{display:none}.lcm.sys .lcT{font-size:13px;font-weight:800}`;
  document.head.appendChild(st);
}
/* ---------- ترجمة إنكليزي لنصوص الإضافات ---------- */
try { Object.assign(window.__EN || {}, { '🤖 العب ويا الكمبيوتر': '🤖 Play vs computer', '▶️ يلا نلعب': '▶️ Let\'s play', '🎨 ثيم الطاولة': '🎨 Board theme', '🪵 خشب': '🪵 Wood', '🥇 ذهبي': '🥇 Gold', '🌙 ليلي': '🌙 Night', '🛍️ سكنات غوكو': '🛍️ Goku skins', '♟️ سكنات القطع': '♟️ Piece skins', '🎲 سكنات النرد': '🎲 Dice skins', 'العادي': 'Default', '✅ لابسه': '✅ Equipped', 'البسه': 'Equip', '🎮 وضع اللعب': '🎮 Game mode', '🎲 عادي': '🎲 Classic', '⚡ سريع': '⚡ Quick', '🤝 فرق 2 ضد 2': '🤝 Teams 2v2', '🤖 ضيف كمبيوتر': '🤖 Add computer', '✖ شيل الكمبيوتر': '✖ Remove computer', '🪑 اجلس محله': '🪑 Take this seat', 'تاج ملكي': 'Royal crown', 'أذان قطة': 'Cat ears', 'نظارة كول': 'Cool shades', 'نيون مضيء': 'Neon glow', 'ذهبي فاخر': 'Luxury gold', 'نرد أحمر': 'Red dice', 'نرد خشبي': 'Wooden dice', 'نرد حلاوة': 'Candy dice', 'نرد ليلي': 'Night dice', 'نرد ذهبي': 'Gold dice' }); } catch (e) {}
