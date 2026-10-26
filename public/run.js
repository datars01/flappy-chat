/* ===================== لعبة «ركض ربش» 🏃 — ركض بلا نهاية على سكة القطار (مثل صبواي) =====================
   ثلاث سكك: اسحب يمين/يسار تبدّل السكة، فوك تقفز، جوّا تزحف. اجمع العملات، تفادى الحواجز والقطارات.
   الشخصية تختارها من «شخصيتي»: 8 نماذج + ألوان الملابس + قبعات. كلشي يتحفظ بالجهاز. */
'use strict';
(function () {
  const $r = id => document.getElementById(id);
  const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
  const KEY = 'run_v1';
  const CH = [
    { n: 'ربش', k: 'boy', skin: '#f2c49b', hair: '#3a2416', p: 0 },
    { n: 'لولو', k: 'girl', skin: '#f6d0b0', hair: '#7a3b1a', p: 0 },
    { n: 'روبو', k: 'robot', skin: '#b8c4d4', hair: '#5a6a80', p: 0 },
    { n: 'نينجا', k: 'ninja', skin: '#e8b88f', hair: '#1a1a24', p: 150 },
    { n: 'رائد فضاء', k: 'astro', skin: '#f0c8a0', hair: '#eef2f8', p: 250 },
    { n: 'بسبوس', k: 'cat', skin: '#ffe0c4', hair: '#ff9a3a', p: 400 },
    { n: 'دينو', k: 'dino', skin: '#f2c49b', hair: '#3fbf5a', p: 600 },
    { n: 'الفارس', k: 'knight', skin: '#e8b88f', hair: '#c9ced8', p: 900 }];
  const COLS = ['#ff4a6a', '#3a8bff', '#2ee48d', '#ffd23a', '#a24aff', '#ff8a2a', '#22d3ee', '#2a2a3a', '#ff7ad9', '#ffffff'];
  const HATS = [{ n: 'بدون', e: '', p: 0 }, { n: 'كاب', e: '🧢', p: 80 }, { n: 'تاج', e: '👑', p: 300 }, { n: 'قبعة ساحر', e: '🎩', p: 200 }, { n: 'فيونكة', e: '🎀', p: 120 }, { n: 'هالة', e: '😇', p: 500 }, { n: 'قرون', e: '😈', p: 500 }, { n: 'زهرة', e: '🌸', p: 150 }];
  /* الزلاجات الطايرة 🛹: تفعّلها بدوسة دبل أو بالزر، تدوم 30 ثانية وتحميك من ضربة وحدة (تنكسر بدالك) */
  const BOARDS = [{ n: 'نيون', c1: '#22d3ee', c2: '#a24aff', p: 0 }, { n: 'النار', c1: '#ffb02a', c2: '#ff2a4a', p: 250 }, { n: 'الغابة', c1: '#2ee48d', c2: '#0a7a5a', p: 300 },
    { n: 'الوردية', c1: '#ff9ae6', c2: '#c03aff', p: 350 }, { n: 'الثلج', c1: '#e8f6ff', c2: '#5ab8ff', p: 450 }, { n: 'الذهبية', c1: '#fff0a0', c2: '#e8a010', p: 700 }, { n: 'المجرة', c1: '#7a5aff', c2: '#0a0a3a', p: 1000, st: 1 }, { n: 'ربش ❤️', c1: '#ff5a8a', c2: '#ff1a4a', p: 1500, hr: 1 }];
  const BD_T = 30, BD_PACK = { n: 3, p: 150 };
  /* القوى الخارقة: تنطي أفضلية باللعب */
  const PW = { mag: { e: '🧲', n: 'مغناطيس', d: 10, w: 3 }, jump: { e: '👟', n: 'قفزة خارقة', d: 10, w: 2 }, x2: { e: '💰', n: 'عملات دبل', d: 12, w: 2 }, sh: { e: '🛡️', n: 'درع', d: 0, w: 2 },
    jet: { e: '🚀', n: 'صاروخ طيران', d: 7, w: 1.4 }, slow: { e: '⏳', n: 'تبطيء الوقت', d: 7, w: 1.6 }, ph: { e: '🌀', n: 'اختراق الحواجز', d: 6, w: 1.4 }, dj: { e: '⏫', n: 'قفزة دبل', d: 14, w: 2 }, sc2: { e: '⭐', n: 'نقاط دبل', d: 14, w: 2 }, bd: { e: '🛹', n: 'زلاجة إضافية', d: 0, w: 0.9 } };
  const ZL = 600; // كل 600 متر عالم جديد
  const THEMES = [
    { n: '🏙️ المدينة', k: 'city', sky: ['#6ab8ff', '#d8f0ff'], gr: '#7a8a6a', bed: '#8a7a6a', tie: '#6a4a32', rail: '#c8ccd4', side: 'rgba(0,0,0,.12)', b: ['#f0b860', '#e87a6a', '#7ab8e8', '#b48ae8', '#f0d890'], win: '#cfe8ff', lit: 0, mt: '#8fb0d8' },
    { n: '🏖️ الشاطئ', k: 'beach', sky: ['#38b6ff', '#bff0ff'], gr: '#f2d58c', bed: '#d9b874', tie: '#8a6040', rail: '#d8dce4', side: '#f8e4a8', sea: ['#0a8fd8', '#38c8f0'], mt: '#7ccfe8' },
    { n: '❄️ جبال الثلج', k: 'snow', sky: ['#9cc0e8', '#f0f6ff'], gr: '#eef4fb', bed: '#b8c0cc', tie: '#7a6a62', rail: '#9aa4b8', side: '#ffffff', mt: '#c8d8ee', snow: 1 },
    { n: '🏜️ الصحراء', k: 'desert', sky: ['#ff9a4a', '#ffe3a0'], gr: '#e8b868', bed: '#c89a58', tie: '#7a4a2a', rail: '#d0c4b0', side: '#f0c878', mt: '#d89058' },
    { n: '🌙 مدينة الليل', k: 'city', sky: ['#070b26', '#2a2a6a'], gr: '#2a3040', bed: '#3a3a48', tie: '#2a2028', rail: '#9aa4b8', side: 'rgba(0,0,0,.2)', b: ['#2a3a5a', '#3a2a5a', '#203a4a', '#4a3060', '#2a2a40'], win: '#ffe27a', lit: 1, mt: '#1a2048', stars: 1 },
    { n: '🌅 شاطئ الغروب', k: 'beach', sky: ['#ff6a5a', '#ffd08a'], gr: '#e8c080', bed: '#c8a068', tie: '#6a4030', rail: '#d8c8c0', side: '#f0d098', sea: ['#7a4aa8', '#ff9a7a'], mt: '#c86a8a' }];
  const zoneAt = z => Math.floor(Math.max(0, R.dist + z) / ZL) % THEMES.length;
  /* كاش الإيموجي حتى الرسم يكون خفيف على الموبايل */
  const EMC = {};
  function emo(e) { let c = EMC[e]; if (c) return c; c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.font = '104px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 64, 70); EMC[e] = c; return c; }

  /* ---------- الحفظ ---------- */
  let S = { coins: 0, best: 0, runs: 0, own: { c: [0, 1, 2], h: [0] }, sel: { c: 0, col: 0, h: 0 }, mus: 1, sfx: 1 };
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o) S = Object.assign(S, o); } catch (e) {}
  if (!S.own.b) S.own.b = [0]; if (S.boards == null) S.boards = 3; if (S.bsel == null) S.bsel = 0;   // كل لاعب ياخذ 3 زلاجات هدية
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const isAdm = () => { try { return !!(typeof auth !== 'undefined' && auth && (auth.admin || auth.name === 'بابي' || auth.name === 'بابيتو')); } catch (e) { return false; } };
  /* المشرفين (بابي وبابيتو): عملات لانهائية ♾️ */
  const CN = () => isAdm() ? Infinity : S.coins;
  const CT = () => isAdm() ? '♾️' : String(S.coins);
  const spend = c => { if (!isAdm()) S.coins -= c; };
  const ownC = i => isAdm() || CH[i].p === 0 || S.own.c.includes(i);
  const ownH = i => isAdm() || HATS[i].p === 0 || S.own.h.includes(i);
  const ownB = i => isAdm() || BOARDS[i].p === 0 || S.own.b.includes(i);
  const BDN = () => isAdm() ? Infinity : S.boards;

  /* ---------- الأصوات والموسيقى (WebAudio بدون ملفات) ---------- */
  const AC = () => { try { if (window.unlockAudio) unlockAudio(); return (typeof actx !== 'undefined' && actx) || null; } catch (e) { return null; } };
  function tone(type, f0, f1, dur, vol, delay, dest) {
    const a = AC(); if (!a || a.state !== 'running') return; const t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.85);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.015, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  let nb = null;
  function noise(dur, vol, delay, f, type, dest) {
    const a = AC(); if (!a || a.state !== 'running') return;
    if (!nb) { nb = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = a.currentTime + (delay || 0), s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = nb; fl.type = type || 'highpass'; fl.frequency.value = f || 1500;
    s.connect(fl); fl.connect(g); g.connect(dest || a.destination); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.start(t); s.stop(t + dur + 0.02);
  }
  function sfx(k) {
    if (!S.sfx) return;
    try {
      if (k === 'jump') { tone('square', 300, 760, 0.16, 0.07); tone('sine', 600, 1200, 0.12, 0.05, 0.02); }
      else if (k === 'left' || k === 'right') { noise(0.11, 0.09, 0, k === 'left' ? 900 : 1400, 'bandpass'); tone('sine', k === 'left' ? 520 : 620, k === 'left' ? 380 : 820, 0.09, 0.04); }
      else if (k === 'slide') { noise(0.28, 0.08, 0, 500, 'lowpass'); tone('triangle', 260, 140, 0.22, 0.05); }
      else if (k === 'land') noise(0.06, 0.06, 0, 300, 'lowpass');
      else if (k === 'coin') { tone('square', 988, 988, 0.06, 0.035); tone('square', 1319, 1319, 0.1, 0.035, 0.05); }
      else if (k === 'power') [523, 659, 784, 1047, 1319].forEach((f, i) => tone('triangle', f, f, 0.12, 0.06, i * 0.05));
      else if (k === 'shield') { tone('sawtooth', 200, 900, 0.3, 0.06); noise(0.3, 0.08, 0, 2000); }
      else if (k === 'lose') { noise(0.45, 0.22, 0, 120, 'lowpass'); tone('sawtooth', 220, 55, 0.6, 0.09); [[392, 0.35], [330, 0.6], [262, 0.85], [196, 1.1]].forEach(q => tone('triangle', q[0], q[0] * 0.97, 0.3, 0.08, q[1])); }
      else if (k === 'go') [[523, 0], [523, 0.5], [523, 1], [1047, 1.5]].forEach(q => tone('square', q[0], q[0], q[1] === 1.5 ? 0.35 : 0.14, 0.06, q[1]));
      else if (k === 'click') tone('sine', 600, 900, 0.06, 0.05);
      else if (k === 'buy') [784, 988, 1319].forEach((f, i) => tone('sine', f, f, 0.14, 0.07, i * 0.07));
      else if (k === 'zone') [[659, 0], [784, 0.12], [988, 0.24], [1319, 0.36]].forEach(q => tone('sine', q[0], q[0], 0.3, 0.06, q[1]));
      else if (k === 'ghost') { tone('sine', 110, 80, 1.6, 0.12); tone('sine', 116, 84, 1.6, 0.08); noise(1.2, 0.07, 0.1, 1200, 'bandpass'); tone('triangle', 880, 1240, 0.9, 0.035, 0.3); tone('triangle', 1240, 700, 0.6, 0.035, 1.1); }
      else if (k === 'stab') { noise(0.08, 0.3, 0, 4000, 'highpass'); tone('sawtooth', 1600, 200, 0.18, 0.09); noise(0.25, 0.22, 0.06, 300, 'lowpass'); tone('square', 520, 260, 0.5, 0.05, 0.12); }
      else if (k === 'laugh') [0, 0.16, 0.32, 0.5].forEach((d, i) => { tone('sawtooth', 300 - i * 30, 200 - i * 30, 0.13, 0.06, d); noise(0.1, 0.05, d, 900, 'bandpass'); });
      else if (k === 'bump') { noise(0.16, 0.2, 0, 400, 'lowpass'); tone('square', 180, 90, 0.2, 0.07); }
      else if (k === 'jet') { noise(0.9, 0.12, 0, 700, 'lowpass'); tone('sawtooth', 120, 420, 0.8, 0.05); }
      else if (k === 'step') { noise(0.045, 0.035, 0, 260, 'lowpass'); tone('sine', 95, 60, 0.05, 0.03); }
      else if (k === 'board') { noise(0.5, 0.1, 0, 900, 'bandpass'); tone('sawtooth', 90, 360, 0.45, 0.06); [659, 880, 1175].forEach((f, i) => tone('sine', f, f, 0.12, 0.05, 0.2 + i * 0.06)); }
      else if (k === 'break') { noise(0.35, 0.25, 0, 1800, 'highpass'); noise(0.4, 0.2, 0.05, 220, 'lowpass'); tone('square', 600, 80, 0.4, 0.07); tone('triangle', 1400, 300, 0.25, 0.05, 0.08); }
      else if (k === 'revive') [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone('sine', f, f, 0.18, 0.07, i * 0.06));
    } catch (e) {}
  }
  /* طنين الزلاجة وهي طايرة (يرتفع مع السرعة والقفز) */
  const HM = { o: null, off: 0 };
  function humTick() {
    const a = AC(); if (!a || a.state !== 'running') return;
    const want = !!S.sfx && R.board > 0 && R.ph === 'play' && !R.pause && window.curPage === 'run' && !document.hidden;
    if (want && !HM.o) { const o = a.createOscillator(), o2 = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(); o.type = 'sawtooth'; o2.type = 'sine'; o.frequency.value = 62; o2.frequency.value = 124; f.type = 'lowpass'; f.frequency.value = 420; g.gain.value = 0.0001; o.connect(f); o2.connect(f); f.connect(g); g.connect(a.destination); o.start(); o2.start(); Object.assign(HM, { o, o2, g }); }
    if (!HM.o) return; const fr = 62 + (R.sp - 13) * 1.3 + Math.max(0, R.y) * 9 + Math.sin(R.t * 5) * 2;
    HM.g.gain.setTargetAtTime(want ? 0.032 : 0.0001, a.currentTime, 0.12); HM.o.frequency.setTargetAtTime(fr, a.currentTime, 0.1); HM.o2.frequency.setTargetAtTime(fr * 2.01, a.currentTime, 0.1);
    if (!want) { if (++HM.off > 40) { try { HM.o.stop(); HM.o2.stop(); } catch (e) {} HM.o = null; HM.off = 0; } } else HM.off = 0;
  }
  /* موسيقى ركض حماسية: بيس + طبل + لحن، تسرع شوية مع السرعة */
  const M = { bus: null, next: 0, step: 0, on: false };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const PROG = [[45, 57, 60, 64], [41, 53, 57, 60], [48, 60, 64, 67], [43, 55, 59, 62]];
  const MEL = [76, 0, 74, 76, 0, 79, 76, 74, 72, 0, 74, 72, 69, 0, 72, 74, 76, 0, 79, 81, 0, 79, 76, 74, 72, 74, 76, 0, 74, 0, 72, 0];
  function musTick() {
    const a = AC(); if (!a || a.state !== 'running') return;
    const want = S.mus && R.ph === 'play' && !R.pause && window.curPage === 'run' && !document.hidden;
    if (!M.bus) { const g = a.createGain(), lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; g.gain.value = 0.0001; g.connect(lp); lp.connect(a.destination); M.bus = g; M.next = a.currentTime + 0.1; }
    M.bus.gain.setTargetAtTime(want ? 0.55 : 0.0001, a.currentTime, want ? 0.3 : 0.15);
    if (!want) { M.next = Math.max(M.next, a.currentTime + 0.05); return; }
    const bpm = 128 + Math.min(28, (R.sp - 13) * 1.6), st = 60 / bpm / 2;
    while (M.next < a.currentTime + 0.25) {
      const t = M.next - a.currentTime, i = M.step, bar = Math.floor(i / 8) % 4, ch = PROG[bar], b = M.bus;
      if (i % 4 === 0) { tone('sine', 150, 45, 0.22, 0.32, t, b); }
      if (i % 4 === 2) noise(0.12, 0.16, t, 1800, 'highpass', b);
      if (i % 2 === 1) noise(0.04, 0.06, t, 7000, 'highpass', b);
      tone('triangle', hz(ch[0] - 12 + (i % 2 ? 12 : 0)), 0, st * 0.9, 0.12, t, b);
      if (i % 2 === 0) tone('square', hz(ch[1 + (i / 2) % 3]), 0, st * 0.6, 0.025, t, b);
      const m = MEL[i % 32]; if (m && (Math.floor(i / 32) % 2 === 1 || R.dist > 300)) tone('square', hz(m), 0, st * 1.4, 0.035, t, b);
      M.step++; M.next += st;
    }
  }

  /* ---------- رسم الشخصية (من القدّام بالاختيار، ومن الورا باللعب) ---------- */
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function shade(hex, a) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.max(0, Math.min(255, r + a)); g = Math.max(0, Math.min(255, g + a)); b = Math.max(0, Math.min(255, b + a)); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
  /* ===== رسم واقعي للشخصيات: إضاءة من فوك يسار، تظليل أسطواني للأطراف، قماش بطيّات، جلد بتدرّج، وخطوط خارجية رفيعة ===== */
  const OUT = 'rgba(14,10,22,.55)', LDX = -0.55, LDY = -0.83;
  const hx = c => (c && c[0] === '#' && c.length === 7) ? c : '#888888';
  function limb(g, x1, y1, x2, y2, w, fill, mat) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1; let nx = -dy / L, ny = dx / L; if (nx * LDX + ny * LDY < 0) { nx = -nx; ny = -ny; }
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, h = w / 2, c = hx(fill), gr = g.createLinearGradient(mx + nx * h, my + ny * h, mx - nx * h, my - ny * h);
    if (mat === 'metal') { gr.addColorStop(0, shade(c, 95)); gr.addColorStop(0.2, shade(c, 40)); gr.addColorStop(0.46, shade(c, -38)); gr.addColorStop(0.72, shade(c, 12)); gr.addColorStop(1, shade(c, -85)); }
    else { gr.addColorStop(0, shade(c, 40)); gr.addColorStop(0.26, shade(c, 16)); gr.addColorStop(0.62, shade(c, -22)); gr.addColorStop(0.9, shade(c, -60)); gr.addColorStop(1, shade(c, -34)); }
    g.save(); g.lineCap = 'round'; g.strokeStyle = OUT; g.lineWidth = w + 1.6; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.strokeStyle = gr; g.lineWidth = w; g.stroke(); g.restore();
  }
  function shoe(g, x, y, col, sole, k) {
    g.save(); g.lineWidth = 1.2; g.strokeStyle = OUT;
    if (sole) { const w = 8.5 * (1 + k * 0.3), h = 6 * (1 + k * 0.3), gr = g.createLinearGradient(x, y - h, x, y + h); gr.addColorStop(0, '#f6f6f2'); gr.addColorStop(1, '#b4b4ad'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#33333b'; g.beginPath(); g.ellipse(x, y + 1.2, w * 0.76, h * 0.6, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 0.8; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x - w * 0.55, y + 1.2 + i * h * 0.2); g.lineTo(x + w * 0.55, y + 1.2 + i * h * 0.2); g.stroke(); } g.fillStyle = col; g.fillRect(x - w * 0.5, y - h * 0.78, w, 1.8); }
    else { const gr = g.createLinearGradient(x, y - 6, x, y + 6); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#e0e0da'); gr.addColorStop(1, '#a4a49e'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 7.5, y + 4); g.quadraticCurveTo(x - 8.5, y - 5, x, y - 6); g.quadraticCurveTo(x + 8.5, y - 5, x + 7.5, y + 4); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = col; g.beginPath(); g.moveTo(x - 6.5, y); g.quadraticCurveTo(x, y - 3.5, x + 6.5, y); g.lineTo(x + 6.5, y + 1.6); g.quadraticCurveTo(x, y - 1.8, x - 6.5, y + 1.6); g.fill();
      g.fillStyle = '#2a2a30'; rr(g, x - 8, y + 3.2, 16, 3.2, 1.6); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(x - 3, y - 3.5, 2.6, 1.1, -0.3, 0, 7); g.fill(); }
    g.restore();
  }
  /* كرة بإضاءة (راس، إيد، خوذة) */
  function ball(g, x, y, r, c, mat) { c = hx(c); const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.08); if (mat === 'metal') { gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.18, shade(c, 50)); gr.addColorStop(0.6, shade(c, -30)); gr.addColorStop(1, shade(c, -90)); } else { gr.addColorStop(0, shade(c, 34)); gr.addColorStop(0.55, c); gr.addColorStop(1, shade(c, -58)); } g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.lineWidth = 1.2; g.strokeStyle = OUT; g.stroke(); }
  function torsoPath(g) { g.beginPath(); g.moveTo(-17, -79); g.quadraticCurveTo(-18, -87, -9, -88); g.lineTo(9, -88); g.quadraticCurveTo(18, -87, 17, -79); g.quadraticCurveTo(15, -62, 13, -45); g.quadraticCurveTo(0, -41, -13, -45); g.quadraticCurveTo(-15, -62, -17, -79); g.closePath(); }
  function torso(g, C, body, mat, front, col, t) {
    const c = hx(body); torsoPath(g); const gr = g.createLinearGradient(-17, -88, 17, -42);
    if (mat === 'metal') { gr.addColorStop(0, shade(c, 85)); gr.addColorStop(0.25, shade(c, 22)); gr.addColorStop(0.5, shade(c, -38)); gr.addColorStop(0.72, shade(c, 16)); gr.addColorStop(1, shade(c, -80)); }
    else { gr.addColorStop(0, shade(c, 36)); gr.addColorStop(0.45, c); gr.addColorStop(1, shade(c, -64)); }
    g.fillStyle = gr; g.fill(); g.lineWidth = 1.4; g.strokeStyle = OUT; g.stroke();
    g.save(); g.clip();
    const ao = g.createLinearGradient(0, -60, 0, -42); ao.addColorStop(0, 'rgba(0,0,0,0)'); ao.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = ao; g.fillRect(-20, -60, 40, 20);
    const k = C.k;
    if (mat === 'metal') {   // ألواح معدن + براغي
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-15, -66); g.quadraticCurveTo(0, -62, 15, -66); g.moveTo(0, -88); g.lineTo(0, -66); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(-15, -65); g.quadraticCurveTo(0, -61, 15, -65); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.5)'; [[-12, -82], [12, -82], [-11, -52], [11, -52]].forEach(q => { g.beginPath(); g.arc(q[0], q[1], 1.1, 0, 7); g.fill(); });
      g.fillStyle = col; g.fillRect(-17, -58, 34, 5); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-17, -58, 34, 1.4);
      if (k === 'robot' && front) { const p = 0.6 + Math.sin(t * 6) * 0.4, rg = g.createRadialGradient(0, -74, 0, 0, -74, 7); rg.addColorStop(0, 'rgba(160,250,255,' + p + ')'); rg.addColorStop(1, 'rgba(34,211,238,0)'); g.fillStyle = rg; g.beginPath(); g.arc(0, -74, 7, 0, 7); g.fill(); g.fillStyle = '#22d3ee'; g.beginPath(); g.arc(0, -74, 2.6, 0, 7); g.fill(); }
    } else if (k === 'astro') {
      g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; [-80, -70, -60].forEach(y => { g.beginPath(); g.moveTo(-16, y); g.quadraticCurveTo(0, y + 3, 16, y); g.stroke(); });
      g.fillStyle = col; g.fillRect(-17, -56, 34, 5); if (front) { g.fillStyle = '#2a3040'; rr(g, -7, -80, 14, 10, 2); g.fill(); g.fillStyle = '#ff4a5a'; g.fillRect(-5, -78, 3, 3); g.fillStyle = '#2ee48d'; g.fillRect(0, -78, 3, 3); g.fillStyle = '#3a8bff'; g.fillRect(-5, -74, 8, 2); }
    } else {
      // طيّات القماش
      g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-13, -70); g.quadraticCurveTo(-6, -64, -10, -52); g.moveTo(12, -74); g.quadraticCurveTo(5, -66, 9, -54); g.moveTo(-4, -58); g.quadraticCurveTo(0, -55, 5, -59); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(-12, -72); g.quadraticCurveTo(-5, -66, -9, -54); g.stroke();
      // حاشية البلوزة تحت
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(-16, -49, 32, 5); g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(-15, -49); g.lineTo(15, -49); g.stroke();
      if (k === 'dino') { g.fillStyle = 'rgba(0,0,0,.14)'; [[-8, -76, 3], [6, -70, 2.4], [-4, -58, 2.6], [9, -56, 2], [-11, -63, 2]].forEach(q => { g.beginPath(); g.arc(q[0], q[1], q[2], 0, 7); g.fill(); }); if (front) { const bg = g.createLinearGradient(0, -84, 0, -46); bg.addColorStop(0, '#fff0b8'); bg.addColorStop(1, '#d8b870'); g.fillStyle = bg; g.beginPath(); g.ellipse(0, -63, 9, 17, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(120,90,30,.35)'; [-72, -64, -56].forEach(y => { g.beginPath(); g.moveTo(-8, y); g.quadraticCurveTo(0, y + 2, 8, y); g.stroke(); }); } }
      else if (k === 'ninja') { g.fillStyle = 'rgba(0,0,0,.35)'; g.save(); g.rotate(front ? -0.5 : 0.5); g.fillRect(-30, -64, 60, 3.5); g.restore(); g.fillStyle = col; g.fillRect(-17, -55, 34, 4.5); }
      else if (front) {   // سحاب + جيب كنغر + خيوط
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -86); g.lineTo(0, -49); g.stroke(); g.strokeStyle = 'rgba(220,220,230,.7)'; g.setLineDash([1.2, 1.4]); g.beginPath(); g.moveTo(0.6, -85); g.lineTo(0.6, -50); g.stroke(); g.setLineDash([]);
        g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-11, -50); g.lineTo(-9, -60); g.lineTo(9, -60); g.lineTo(11, -50); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1; [-4, 4].forEach(x => { g.beginPath(); g.moveTo(x, -86); g.quadraticCurveTo(x * 1.1, -80, x * 0.9, -74); g.stroke(); });
      } else {   // القبعة (الهود) على الظهر + خياطة الكتف
        const hc = hx(body), hg = g.createLinearGradient(0, -88, 0, -70); hg.addColorStop(0, shade(hc, 20)); hg.addColorStop(1, shade(hc, -40)); g.fillStyle = hg; g.beginPath(); g.moveTo(-11, -88); g.quadraticCurveTo(-12, -72, 0, -70); g.quadraticCurveTo(12, -72, 11, -88); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; g.stroke();
        g.strokeStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(-16, -80); g.quadraticCurveTo(-10, -78, -9, -86); g.moveTo(16, -80); g.quadraticCurveTo(10, -78, 9, -86); g.stroke();
        if (k === 'cat') [-1, 1].forEach(s => { g.fillStyle = shade(hc, -10); g.beginPath(); g.moveTo(s * 3, -84); g.lineTo(s * 9, -92); g.lineTo(s * 10, -82); g.closePath(); g.fill(); });
      }
    }
    g.restore();
  }
  function face(g, C) {
    g.fillStyle = 'rgba(80,30,20,.12)'; [-5, 5].forEach(x => { g.beginPath(); g.ellipse(x, -0.6, 3.8, 2.6, 0, 0, 7); g.fill(); });
    [-5, 5].forEach(x => { g.fillStyle = '#f4f0ec'; g.beginPath(); g.ellipse(x, 0, 2.9, 1.7, 0, 0, 7); g.fill(); g.fillStyle = '#5a3a1e'; g.beginPath(); g.arc(x + 0.2, 0, 1.45, 0, 7); g.fill(); g.fillStyle = '#0c0806'; g.beginPath(); g.arc(x + 0.2, 0, 0.7, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 0.4, -0.5, 0.45, 0, 7); g.fill(); g.strokeStyle = 'rgba(30,15,10,.85)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(x, 0, 2.9, 1.7, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke(); });
    g.strokeStyle = shade(hx(C.hair), -25); g.lineWidth = 1.3; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 2.4, -3.8); g.quadraticCurveTo(s * 5, -5.4, s * 7.6, -4.2); g.stroke(); });
    g.strokeStyle = 'rgba(90,40,25,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0.6, 0.6); g.quadraticCurveTo(1.7, 4, 0, 4.6); g.stroke(); g.fillStyle = 'rgba(90,40,25,.16)'; g.beginPath(); g.ellipse(0, 4.8, 2.1, 0.9, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(186,88,88,.85)'; g.beginPath(); g.moveTo(-3, 7.6); g.quadraticCurveTo(0, 6.5, 3, 7.6); g.quadraticCurveTo(0, 9.7, -3, 7.6); g.fill(); g.strokeStyle = 'rgba(90,30,30,.5)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-3, 7.6); g.quadraticCurveTo(0, 8.1, 3, 7.6); g.stroke();
    g.fillStyle = 'rgba(255,120,110,.13)'; [-7.5, 7.5].forEach(x => { g.beginPath(); g.arc(x, 4.6, 3, 0, 7); g.fill(); });
  }
  function hairStrands(g, hc, n, r) { g.strokeStyle = shade(hc, 55); g.globalAlpha = 0.35; g.lineWidth = 0.8; for (let i = 0; i < n; i++) { const a = -2.6 + i * (2.2 / n); g.beginPath(); g.moveTo(Math.cos(a) * 2, -r + 1); g.quadraticCurveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.5 - 4, Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.2 + 4); g.stroke(); } g.globalAlpha = 1; }
  function drawChar(g, id, o) {
    const C = CH[id] || CH[0], col = COLS[o.col] || COLS[0], front = !!o.front, t = o.t || 0, run = o.run !== false;
    const sw = run ? Math.sin(t * 11) : 0, air = o.air, sl = o.slide, onB = o.board != null && !sl, gait = run && !air && !sl && !onB, ph = t * 11;
    const k = C.k, metal = k === 'robot' || k === 'knight', mat = metal ? 'metal' : null;
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    if (sl) g.scale(1.08, 0.55);
    else if (onB) g.translate(0, 5 + Math.sin(t * 3) * 1.5);
    else if (run && !air) g.translate(0, -Math.abs(Math.cos(ph)) * 5 + 1);
    const legC = k === 'robot' ? '#8a96a8' : k === 'knight' ? '#9aa2b0' : k === 'dino' ? C.hair : k === 'astro' ? '#dfe4ec' : k === 'ninja' ? '#262833' : '#34466e';
    // الرجلين
    if (gait) [-1, 1].forEach(s => { const lp = ph + (s > 0 ? 0 : Math.PI), sn = Math.sin(lp);
      const knee = Math.max(0, Math.sin(lp + 0.55)), kick = sn > -0.15 ? Math.max(0, Math.sin(lp - 0.75)) : 0;
      const Lt = 19 * (1 - 0.48 * knee), ks = 1 - 1.6 * kick, kx = s * (7 + knee * 2), ky = -44 + Lt, fx = s * (6.5 - kick * 2), fy = ky + 17 * ks;
      limb(g, s * 7, -46, kx, ky, 11.5, legC, mat); limb(g, kx, ky, fx, fy, 10, legC, mat); shoe(g, fx, fy + (ks < 0.2 ? 0 : 4), col, ks < 0.2, kick); });
    else if (onB) [-1, 1].forEach(s => { const b = Math.sin(t * 3 + s) * 1.2; limb(g, s * 7, -46, s * 13, -28 + b, 11.5, legC, mat); limb(g, s * 13, -28 + b, s * 12, -7, 10, legC, mat); shoe(g, s * 12, -3, col, false, 0); });
    else [-1, 1].forEach(s => { const up = air ? (s > 0 ? 12 : 4) : Math.max(0, sw * s) * 11, a = air ? 0.25 * s : sw * 0.12 * s; g.save(); g.translate(s * 7, -44); g.rotate(a); g.scale(1, (34 - up) / 34); limb(g, 0, 0, 0, 31, 11, legC, mat); shoe(g, 0, 35, col, false, 0); g.restore(); });
    // الذيل
    if (k === 'dino' || k === 'cat') { g.save(); const tc = hx(k === 'dino' ? C.hair : col), tg = g.createLinearGradient(-10, -50, 25, -15); tg.addColorStop(0, shade(tc, 30)); tg.addColorStop(1, shade(tc, -50)); g.fillStyle = tg; g.strokeStyle = OUT; g.lineWidth = 1.3; g.beginPath(); const tw = Math.sin(t * 6) * 6; if (!front) { g.moveTo(-6, -48); g.quadraticCurveTo(tw, -20, 18 + tw, -16); g.quadraticCurveTo(6, -30, 6, -48); } else { g.moveTo(14, -50); g.quadraticCurveTo(30 + tw, -40, 26 + tw, -62); g.quadraticCurveTo(24, -46, 12, -44); } g.closePath(); g.fill(); g.stroke(); g.restore(); }
    // شنطة الأكسجين
    if (k === 'astro' && !front) { const bg = g.createLinearGradient(-17, 0, 17, 0); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.5, '#d4dae4'); bg.addColorStop(1, '#8a94a6'); g.fillStyle = bg; rr(g, -17, -86, 34, 34, 7); g.fill(); g.lineWidth = 1.2; g.strokeStyle = OUT; g.stroke(); g.fillStyle = '#5a6478'; rr(g, -12, -80, 24, 4, 2); g.fill(); g.fillStyle = (Math.floor(t * 3) % 2) ? '#ff4a5a' : '#7a2a30'; g.beginPath(); g.arc(9, -60, 2, 0, 7); g.fill(); [-8, 8].forEach(x => { const tg = g.createLinearGradient(x - 3, 0, x + 3, 0); tg.addColorStop(0, '#eef2f8'); tg.addColorStop(1, '#9aa4b6'); g.fillStyle = tg; rr(g, x - 3.5, -74, 7, 18, 3); g.fill(); }); }
    if (gait) g.rotate(Math.cos(ph) * 0.04);
    const body = k === 'robot' ? '#9aa8bc' : k === 'knight' ? '#c9ced8' : k === 'astro' ? '#eef2f8' : k === 'dino' ? C.hair : k === 'ninja' ? '#2a2c38' : col;
    const handC = metal ? '#7a8496' : k === 'astro' ? '#dfe6f0' : k === 'ninja' ? '#2a2c38' : C.skin, sleeve = body;
    const hand = (x, y) => ball(g, x, y, 5, handC, mat);
    // ركض حقيقي: الإيد اللي تروح لقدّام (بعيدة عن الكامرة) تختفي ورا الجسم، واللي ترجع لورا يبين كوعها طالع لورا
    const gArm = (s, pass) => { const c = Math.sin(ph + (s > 0 ? Math.PI : 0)), fw = Math.max(0, c), bk = Math.max(0, -c), nearCam = front ? c > 0 : c <= 0; if ((pass === 1) !== nearCam) return; let ex, ey, hx2, hy;
      if (front) { ex = s * (18 + bk * 6); ey = -80 + 15 * (1 - fw * 0.35) - bk * 3; hx2 = fw > 0 ? s * (12 - fw * 6) : s * (18 + bk * 4); hy = fw > 0 ? ey + 9 - fw * 13 : ey + 13; }
      else { ex = s * (17 + bk * 5 - fw * 2); ey = -67 - bk * 10 + fw * 4; hx2 = fw > 0 ? s * (10 - fw * 3) : s * (15 + bk * 2); hy = fw > 0 ? -73 - fw * 6 : -53 + bk * 3; }
      limb(g, s * 15, -82, ex, ey, 9.5, sleeve, mat); limb(g, ex, ey, hx2, hy, 8.5, sleeve, mat); hand(hx2, hy); };
    if (gait) [-1, 1].forEach(s => gArm(s, 0));
    torso(g, C, body, mat, front, col, t);
    if (k === 'dino' && !front) { g.save(); g.strokeStyle = OUT; g.lineWidth = 1; [-78, -68, -58].forEach(y => { const sg = g.createLinearGradient(0, y - 9, 0, y); sg.addColorStop(0, '#ffe680'); sg.addColorStop(1, '#d8a020'); g.fillStyle = sg; g.beginPath(); g.moveTo(-5, y); g.lineTo(0, y - 9); g.lineTo(5, y); g.closePath(); g.fill(); g.stroke(); }); g.restore(); }
    // الإيدين
    if (gait) [-1, 1].forEach(s => gArm(s, 1));   // الإيد اللي جاية صوب الكامرة تترسم فوك الجسم
    else if (onB) [-1, 1].forEach(s => { const w = Math.sin(t * 3) * s; limb(g, s * 15, -82, s * 28, -72 + w * 4, 9.5, sleeve, mat); limb(g, s * 28, -72 + w * 4, s * 39, -79 + w * 7, 8.5, sleeve, mat); hand(s * 39, -79 + w * 7); });
    else [-1, 1].forEach(s => { const a = air ? -s * 2.5 : -s * (0.32 + Math.max(0, -sw * s) * 0.35), ln = air ? 1 : 1 - Math.max(0, sw * s) * 0.3; g.save(); g.translate(s * 15, -82); g.rotate(a); g.scale(1, ln); limb(g, 0, 0, 0, 25, 9, sleeve, mat); hand(0, 29); g.restore(); });
    // الرگبة
    if (k !== 'astro' && k !== 'robot') limb(g, 0, -86, 0, -94, 8, k === 'knight' ? '#8a92a2' : k === 'ninja' ? '#2a2c38' : C.skin, mat);
    // الراس
    g.save(); g.translate(0, -103); const hb = gait ? -Math.cos(ph) * 0.03 : onB ? Math.sin(t * 3) * 0.04 : run ? Math.sin(t * 11) * 0.05 : 0; g.rotate(hb);
    const hc = hx(C.hair);
    if (k === 'robot') {
      const rg = g.createLinearGradient(-15, -15, 15, 14); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.2, shade(hx(C.skin), 30)); rg.addColorStop(0.55, shade(hx(C.skin), -35)); rg.addColorStop(0.8, shade(hx(C.skin), 10)); rg.addColorStop(1, shade(hx(C.skin), -80));
      g.fillStyle = rg; rr(g, -15, -15, 30, 28, 8); g.fill(); g.lineWidth = 1.2; g.strokeStyle = OUT; g.stroke(); limb(g, 0, -15, 0, -24, 2.4, '#7a8496', 'metal');
      const p = 0.6 + Math.sin(t * 8) * 0.4, ag = g.createRadialGradient(0, -26, 0, 0, -26, 7); ag.addColorStop(0, 'rgba(255,120,130,' + p + ')'); ag.addColorStop(1, 'rgba(255,74,90,0)'); g.fillStyle = ag; g.beginPath(); g.arc(0, -26, 7, 0, 7); g.fill(); ball(g, 0, -26, 2.6, '#ff4a5a');
      if (front) { const vg = g.createLinearGradient(0, -8, 0, 4); vg.addColorStop(0, '#1a2440'); vg.addColorStop(1, '#05070f'); g.fillStyle = vg; rr(g, -11, -8, 22, 11, 5); g.fill(); [-5, 5].forEach(x => { const eg = g.createRadialGradient(x, -2.5, 0, x, -2.5, 5); eg.addColorStop(0, 'rgba(180,250,255,1)'); eg.addColorStop(0.35, 'rgba(34,211,238,.9)'); eg.addColorStop(1, 'rgba(34,211,238,0)'); g.fillStyle = eg; g.beginPath(); g.arc(x, -2.5, 5, 0, 7); g.fill(); }); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-9, -7, 8, 1.2); g.fillStyle = '#5a6478'; for (let i = -2; i <= 2; i++) g.fillRect(i * 2.4 - 0.6, 7, 1.2, 3); }
      else { g.fillStyle = 'rgba(0,0,0,.3)'; for (let i = -2; i <= 2; i++) g.fillRect(-8, -4 + i * 3, 16, 1.4); }
    } else if (k === 'astro') {
      ball(g, 0, -1, 17, '#f2f5fa');
      if (front) { const vg = g.createLinearGradient(-12, -12, 12, 10); vg.addColorStop(0, '#ffd27a'); vg.addColorStop(0.35, '#c88a2a'); vg.addColorStop(0.7, '#3a2a5a'); vg.addColorStop(1, '#0a0a1a'); g.fillStyle = vg; rr(g, -12, -11, 24, 18, 8); g.fill(); g.lineWidth = 1.4; g.strokeStyle = '#8a94a6'; g.stroke(); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(-6, -6, 4.2, 2, -0.5, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(6, 3, 2, 1, -0.5, 0, 7); g.fill(); }
      else { g.fillStyle = col; rr(g, -5, -18, 10, 4, 2); g.fill(); g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(0, 10, 12, 4, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-8, -10, 3.5, 2, -0.7, 0, 7); g.fill();
    } else if (k === 'knight') {
      const kg = g.createLinearGradient(-14, -14, 14, 14); kg.addColorStop(0, '#ffffff'); kg.addColorStop(0.2, shade(hc, 30)); kg.addColorStop(0.55, shade(hc, -40)); kg.addColorStop(0.8, shade(hc, 10)); kg.addColorStop(1, shade(hc, -85));
      g.fillStyle = kg; g.beginPath(); g.arc(0, -1, 14, Math.PI, 0); g.lineTo(14, 12); g.quadraticCurveTo(0, 16, -14, 12); g.closePath(); g.fill(); g.lineWidth = 1.2; g.strokeStyle = OUT; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(0, -15); g.lineTo(0, 13); g.stroke();
      const pc = hx(col), pg = g.createLinearGradient(0, -30, 22, -16); pg.addColorStop(0, shade(pc, 40)); pg.addColorStop(1, shade(pc, -50)); g.fillStyle = pg; g.beginPath(); g.moveTo(0, -15); g.quadraticCurveTo(10 + Math.sin(t * 9) * 3, -30, 20, -22); g.quadraticCurveTo(9, -22, 3, -13); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1; g.stroke();
      if (front) { g.fillStyle = '#07080d'; g.fillRect(-10, -4, 20, 3.4); g.fillRect(-1.4, -4, 2.8, 12); g.fillStyle = 'rgba(255,210,58,.9)'; g.beginPath(); g.arc(-5, -2.3, 1, 0, 7); g.arc(5, -2.3, 1, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.4)'; for (let i = 0; i < 3; i++) { g.fillRect(-9 + i * 3, 4, 1.3, 1.3); g.fillRect(5 + i * 1.6, 4, 1.3, 1.3); } }
    } else {
      // الإذنين + راس بجلد واقعي
      [-1, 1].forEach(s => { const eg = g.createRadialGradient(s * 13, 1, 0, s * 13, 1, 5); eg.addColorStop(0, shade(hx(C.skin), -10)); eg.addColorStop(1, shade(hx(C.skin), -50)); g.fillStyle = eg; g.beginPath(); g.ellipse(s * 12.8, 1, 2.8, 4.4, 0, 0, 7); g.fill(); });
      ball(g, 0, 0, 13, C.skin);
      if (k === 'ninja') {
        const ng = g.createRadialGradient(-4, -5, 1, 0, 0, 15); ng.addColorStop(0, '#4a4c5c'); ng.addColorStop(1, '#0e0f16'); g.fillStyle = ng; g.beginPath(); g.arc(0, 0, 13.8, 0, 7); g.fill(); g.lineWidth = 1.2; g.strokeStyle = OUT; g.stroke();
        if (front) { const sg = g.createLinearGradient(0, -5, 0, 3); sg.addColorStop(0, shade(hx(C.skin), 15)); sg.addColorStop(1, shade(hx(C.skin), -30)); g.fillStyle = sg; rr(g, -10, -4.6, 20, 7, 3.5); g.fill(); [-4.5, 4.5].forEach(x => { g.fillStyle = '#f4f0ec'; g.beginPath(); g.ellipse(x, -1, 2.6, 1.4, 0, 0, 7); g.fill(); g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(x, -1, 1.2, 0, 7); g.fill(); }); g.strokeStyle = '#0e0f16'; g.lineWidth = 1.4; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 2, -4); g.lineTo(s * 8, -5.4); g.stroke(); }); }
        g.fillStyle = col; g.fillRect(-14, -10, 28, 4); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-14, -10, 28, 1.2);
        g.save(); g.translate(front ? 13 : 0, -8); g.rotate(Math.sin(t * 8) * 0.3); g.fillStyle = col; g.fillRect(0, 0, front ? 11 : 3, 3); if (!front) { g.fillRect(-2.5, 0, 5, 18 + Math.sin(t * 9) * 3); g.fillRect(1, 0, 4, 14 + Math.sin(t * 7) * 3); } g.restore();
      } else if (k === 'cat' || k === 'dino') {
        const hd = hx(k === 'cat' ? col : C.hair), hg = g.createRadialGradient(-5, -6, 1, 0, 0, 18); hg.addColorStop(0, shade(hd, 36)); hg.addColorStop(0.6, hd); hg.addColorStop(1, shade(hd, -60));
        if (k === 'cat') [-1, 1].forEach(s => { g.fillStyle = hg; g.beginPath(); g.moveTo(s * 5, -12); g.lineTo(s * 12, -24); g.lineTo(s * 15, -8); g.closePath(); g.fill(); g.lineWidth = 1.1; g.strokeStyle = OUT; g.stroke(); g.fillStyle = 'rgba(255,170,195,.85)'; g.beginPath(); g.moveTo(s * 7.5, -12); g.lineTo(s * 11.5, -20); g.lineTo(s * 13, -10); g.fill(); });
        else { g.strokeStyle = OUT; g.lineWidth = 1; [-8, 0, 8].forEach(x => { const sg = g.createLinearGradient(0, -24, 0, -13); sg.addColorStop(0, '#ffe680'); sg.addColorStop(1, '#d8a020'); g.fillStyle = sg; g.beginPath(); g.moveTo(x - 3.5, -13 + Math.abs(x) * 0.15); g.lineTo(x, -23); g.lineTo(x + 3.5, -13 + Math.abs(x) * 0.15); g.closePath(); g.fill(); g.stroke(); }); }
        g.fillStyle = hg; g.beginPath(); g.arc(0, 0, 15, 0, 7); if (front) { g.moveTo(10, 2); g.ellipse(0, 2, 10, 11, 0, 0, 7, true); } g.fill('evenodd'); g.lineWidth = 1.2; g.strokeStyle = OUT; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.stroke();
        if (front) { g.strokeStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 2, 10, 11, 0, 0, 7); g.stroke(); g.fillStyle = shade(hc, 0); g.beginPath(); g.moveTo(-9, -6); g.quadraticCurveTo(-2, -11, 8, -7); g.quadraticCurveTo(2, -6, -9, -3); g.fill(); face(g, C); if (k === 'cat') { g.strokeStyle = 'rgba(40,30,30,.55)'; g.lineWidth = 0.6; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 5, 5); g.lineTo(s * 11, 4); g.moveTo(s * 5, 6.4); g.lineTo(s * 11, 7); g.stroke(); }); } }
        else { g.strokeStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.moveTo(0, -14); g.quadraticCurveTo(-2, 0, 0, 14); g.stroke(); }
      } else {
        const hg = g.createRadialGradient(-4, -8, 1, 0, -3, 17); hg.addColorStop(0, shade(hc, 45)); hg.addColorStop(0.5, hc); hg.addColorStop(1, shade(hc, -35));
        if (k === 'girl') {   // شعر طويل ورا + ذيل حصان يتأرجح
          if (!front) { g.fillStyle = hg; g.beginPath(); g.moveTo(-13.6, -2); g.quadraticCurveTo(-15, 14, -9, 20); g.lineTo(9, 20); g.quadraticCurveTo(15, 14, 13.6, -2); g.closePath(); g.fill(); }
          g.save(); const pt = Math.sin(t * 10) * 0.35; g.translate(front ? 12 : 0, -9); g.rotate(front ? 0.7 + pt : pt); const pg = g.createLinearGradient(-6, 0, 6, 0); pg.addColorStop(0, shade(hc, 40)); pg.addColorStop(0.5, hc); pg.addColorStop(1, shade(hc, -45)); g.fillStyle = pg; g.beginPath(); g.moveTo(-4, 2); g.quadraticCurveTo(-8, 16, 0, 28); g.quadraticCurveTo(7, 16, 4, 2); g.closePath(); g.fill(); g.lineWidth = 1; g.strokeStyle = OUT; g.stroke(); g.strokeStyle = shade(hc, 55); g.globalAlpha = 0.4; g.lineWidth = 0.7; [-2, 0, 2].forEach(x => { g.beginPath(); g.moveTo(x, 3); g.quadraticCurveTo(x * 2 - 1, 15, x * 0.5, 26); g.stroke(); }); g.globalAlpha = 1; g.fillStyle = col; g.beginPath(); g.ellipse(0, 2, 4, 2.6, 0, 0, 7); g.fill(); g.restore();
        }
        g.fillStyle = hg; g.beginPath();
        if (front) { g.arc(0, -1, 13.8, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(13.5, -6, 12, -3); g.quadraticCurveTo(6, -10, -2, -8.5); g.quadraticCurveTo(-9, -8, -12.5, -3); g.quadraticCurveTo(-14, -6, -13.6, -2); }
        else { g.arc(0, -1, 14, Math.PI * 0.82, Math.PI * 2.18); g.quadraticCurveTo(8, 12, 0, 11); g.quadraticCurveTo(-8, 12, -13, 7); }
        g.closePath(); g.fill(); g.lineWidth = 1.1; g.strokeStyle = OUT; g.stroke();
        g.save(); g.clip(); hairStrands(g, hc, front ? 7 : 11, 14); g.restore();
        if (front) face(g, C);
      }
    }
    const H = HATS[o.hat || 0]; if (H && H.e) { g.font = (k === 'astro' ? 28 : 25) + 'px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(H.e, 0, k === 'robot' ? -26 : k === 'astro' ? -22 : k === 'cat' || k === 'dino' ? -21 : -17); }
    g.restore(); g.restore();
  }

  /* زلاجة طايرة احترافية (Hoverboard): لوح كاربون بحافة كروم ونيون، محركين مضاد للجاذبية بأعمدة ضو وحلقات بلازما، وضواية خلفية */
  function drawBoard(g, bi, t, glow) {
    const B = BOARDS[bi] || BOARDS[0], c1 = hx(B.c1), c2 = hx(B.c2);
    g.save(); g.lineJoin = 'round';
    if (glow) { const gr = g.createRadialGradient(0, glow, 2, 0, glow, 62); gr.addColorStop(0, c1 + 'aa'); gr.addColorStop(0.5, c1 + '33'); gr.addColorStop(1, c1 + '00'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, glow, 64, 14, 0, 0, 7); g.fill(); }
    const bh = glow ? Math.max(8, glow - 4) : 16;
    [-19, 19].forEach((x, i) => { const pl = 0.75 + Math.sin(t * 14 + i * 2) * 0.25, bg = g.createLinearGradient(0, 9, 0, 9 + bh); bg.addColorStop(0, 'rgba(255,255,255,' + (0.85 * pl).toFixed(2) + ')'); bg.addColorStop(0.3, c1 + '99'); bg.addColorStop(1, c1 + '00'); g.fillStyle = bg; g.beginPath(); g.moveTo(x - 6, 9); g.lineTo(x + 6, 9); g.lineTo(x + 11, 9 + bh); g.lineTo(x - 11, 9 + bh); g.closePath(); g.fill();
      g.lineWidth = 1.2; for (let k = 0; k < 3; k++) { const q = (t * 2.4 + k / 3 + i * 0.5) % 1; g.strokeStyle = 'rgba(255,255,255,' + ((1 - q) * 0.65).toFixed(2) + ')'; g.beginPath(); g.ellipse(x, 10 + q * bh * 0.85, 6 + q * 7, 1.6 + q * 3, 0, 0, 7); g.stroke(); }
      const pg = g.createRadialGradient(x, 9, 0, x, 9, 7); pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.4, c1); pg.addColorStop(1, shade(c2, -60)); g.fillStyle = pg; g.beginPath(); g.ellipse(x, 9, 7, 3, 0, 0, 7); g.fill(); });
    const deck = () => { g.beginPath(); g.moveTo(-37, 1); g.bezierCurveTo(-38, -5, -32, -9.5, -23, -10); g.lineTo(23, -10); g.bezierCurveTo(32, -9.5, 38, -5, 37, 1); g.bezierCurveTo(36, 4.5, 30, 5.5, 23, 5.5); g.lineTo(-23, 5.5); g.bezierCurveTo(-30, 5.5, -36, 4.5, -37, 1); g.closePath(); };
    g.save(); g.translate(0, 4.5); deck(); const sg = g.createLinearGradient(0, -10, 0, 6); sg.addColorStop(0, '#f6f8fc'); sg.addColorStop(0.45, '#8f98ab'); sg.addColorStop(0.56, '#454c5e'); sg.addColorStop(1, '#151822'); g.fillStyle = sg; g.fill(); g.restore();
    deck(); const dg = g.createLinearGradient(-37, -10, 37, 6); dg.addColorStop(0, shade(c2, -25)); dg.addColorStop(0.5, shade(c2, -70)); dg.addColorStop(1, shade(c2, -100)); g.fillStyle = dg; g.fill();
    g.save(); deck(); g.clip();
    g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = -10; y < 6; y += 2) for (let x = -38 + (y & 2); x < 38; x += 4) g.fillRect(x, y, 1, 1);   // ملمس الكاربون
    const st = g.createLinearGradient(-32, 0, 32, 0); st.addColorStop(0, c1 + '00'); st.addColorStop(0.5, c1); st.addColorStop(1, c1 + '00'); g.fillStyle = st; g.beginPath(); g.moveTo(-32, -1.4); g.lineTo(32, -1.4); g.lineTo(28, 1.4); g.lineTo(-28, 1.4); g.closePath(); g.fill();
    g.strokeStyle = shade(c1, 40); g.lineWidth = 1.3; g.globalAlpha = 0.75; [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) { const x = s * (10 + i * 5), a = 0.45 + 0.55 * Math.max(0, Math.sin(t * 8 - i)); g.globalAlpha = a; g.beginPath(); g.moveTo(x, -8); g.lineTo(x + s * 3, -5.2); g.lineTo(x, -2.6); g.stroke(); } }); g.globalAlpha = 1;
    const hl = g.createLinearGradient(0, -10, 0, -3); hl.addColorStop(0, 'rgba(255,255,255,.38)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(-38, -10, 76, 7);
    if (B.st) { g.fillStyle = '#fff'; [[-22, -6], [-6, -8], [8, -4], [20, -7], [-14, 2], [16, 2]].forEach((q, i) => { g.globalAlpha = 0.35 + Math.abs(Math.sin(t * 5 + i)) * 0.65; g.fillRect(q[0], q[1], 1.6, 1.6); }); g.globalAlpha = 1; }
    if (B.hr) { g.fillStyle = '#ffffff'; g.font = '900 9px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('❤', 0, -5); }
    g.restore();
    deck(); g.strokeStyle = c1 + '55'; g.lineWidth = 4.5; g.stroke(); g.strokeStyle = shade(c1, 70); g.lineWidth = 1.1; g.stroke();
    [-31, 31].forEach(x => { const lg = g.createRadialGradient(x, 6.5, 0, x, 6.5, 7); lg.addColorStop(0, 'rgba(255,60,70,.9)'); lg.addColorStop(1, 'rgba(255,40,60,0)'); g.fillStyle = lg; g.beginPath(); g.arc(x, 6.5, 7, 0, 7); g.fill(); g.fillStyle = '#ff4a55'; rr(g, x - 4, 5.5, 8, 2.2, 1.1); g.fill(); });
    g.restore();
  }
  /* ---------- ظلال اتجاهية (من الشمس للأرض) ---------- */
  function sunDir() { const T = THEMES[R.zone] || THEMES[0]; if (T.stars) return [-0.2, -0.05, 0.16]; if (R.zone === 5) return [0.6, -0.25, 0.34]; if (T.k === 'desert') return [-0.45, -0.22, 0.32]; if (T.snow) return [-0.4, -0.18, 0.22]; return [-0.45, -0.18, 0.28]; }
  function boxShadow(g, x0, x1, z0, z1, h, L) {
    const ox = L[0] * h, oz = L[1] * h, zc = z => Math.max(NEAR + 0.05, z); if (z1 + Math.min(0, oz) < NEAR || z0 > FAR) return;
    const pt = (x, z) => P(x, 0, zc(z)), Q = (a, b, c, d) => { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); };
    const b0 = pt(x0, z0), b1 = pt(x1, z0), b2 = pt(x1, z1), b3 = pt(x0, z1), t0 = pt(x0 + ox, z0 + oz), t1 = pt(x1 + ox, z0 + oz), t2 = pt(x1 + ox, z1 + oz), t3 = pt(x0 + ox, z1 + oz);
    Q(b0, b1, b2, b3); Q(t0, t1, t2, t3); Q(b0, b1, t1, t0); Q(b1, b2, t2, t1); Q(b2, b3, t3, t2); Q(b3, b0, t0, t3);
  }
  function drawShadows(g) {
    const L = sunDir(); g.save(); g.fillStyle = 'rgba(8,10,30,' + L[2] + ')'; g.beginPath();
    for (const o of R.obs) { const x = LX[o.l]; if (o.k === 'train') boxShadow(g, x - 0.78, x + 0.78, o.z, o.z + o.len, 2.5, L); else if (o.k === 'barrier') boxShadow(g, x - 0.8, x + 0.8, o.z, o.z + 0.12, 0.95, L); else if (o.k === 'bar') { boxShadow(g, x - 0.85, x + 0.85, o.z, o.z + 0.1, 1.75, L); } }
    g.fill('nonzero'); g.restore();
  }
  function drawBldShadows(g) {
    const L = sunDir(); g.save(); g.fillStyle = 'rgba(8,10,30,' + (L[2] * 0.85) + ')'; g.beginPath();
    for (const b of R.blds) { if (b.em || b.h === undefined) continue; const xi = b.x, xo = b.x + b.s * b.w; boxShadow(g, Math.min(xi, xo), Math.max(xi, xo), b.z, b.z + b.len, b.h, L); }
    g.fill('nonzero'); g.restore();
  }

  /* ---------- حالة اللعبة ---------- */
  const LX = [-1.7, 0, 1.7], ZC = 6.2, CAMH = 3.3;
  const GH_T = 2.6;   // وقت ظهور الشبح للتحذير
  const R = { ph: 'menu', t: 0, dist: 0, sp: 13, coins: 0, score: 0, extra: 0, lane: 1, plane: 1, x: 0, y: 0, vy: 0, slide: 0, jb: 0, djUsed: false, sq: 0, tilt: 0, cx: 0, cy: 0, obs: [], coinsA: [], pws: [], blds: [], fx: [], nextZ: 30, nextB: -10, busy: [0, 0, 0], pw: {}, shield: 0, inv: 0, stT: 0, pause: false, raf: 0, last: 0, shake: 0, dead: 0, zone: 0, zoneT: 0, cnt: 0, flash: 0, mult: 1, banked: 0, revived: 0, cv: null, W: 0, H: 0, board: 0, gt: 0, stepN: 0 };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function reset() {
    Object.assign(R, { t: 0, dist: 0, sp: 13, coins: 0, score: 0, extra: 0, lane: 1, plane: 1, x: 0, y: 0, vy: 0, slide: 0, jb: 0, djUsed: false, sq: 0, tilt: 0, cx: 0, cy: 0, obs: [], coinsA: [], pws: [], blds: [], fx: [], nextZ: 34, nextB: -12, busy: [0, 0, 0], pw: {}, shield: 0, inv: 0, stT: 0, ghT: 0, pause: false, resumeAt: 0, shake: 0, dead: 0, zone: 0, zoneT: 0, flash: 0, banked: 0, revived: 0, killer: null, board: 0, gt: 0, stepN: 0 });
    while (R.nextB < 90) spawnB();
  }
  /* المناظر على جانبين السكة: تتغير حسب العالم (عماير، شاطئ وبحر، ثلج وجبال، صحراء) */
  const SC = {
    beach: { L: [['🌴', 3.6, 3], ['🌴', 4.2, 3], ['⛱️', 1.9, 2], ['🦀', 0.9, 1], ['🐚', 0.7, 1], ['🏐', 0.8, 1], ['🛟', 1, 1]], S: [['⛵', 2.8, 2], ['🐬', 1.6, 1], ['🛥️', 2.4, 1], ['🏝️', 5, 1], ['🐳', 2.6, 0.5]] },
    snow: { L: [['🌲', 4.2, 4], ['🌲', 3.4, 3], ['☃️', 1.8, 1.5], ['🏔️', 7, 1], ['🛖', 3, 1], ['🦌', 1.8, 0.7], ['🎿', 1.2, 0.5], ['🐧', 1, 0.7]] },
    desert: { L: [['🌵', 2.8, 4], ['🌵', 2.0, 2], ['🐪', 2.6, 1], ['🪨', 1.4, 2], ['🦂', 0.7, 0.6], ['🐫', 2.8, 0.6], ['⛺', 2.6, 0.7]] }
  };
  const wpick = l => { let s = 0; l.forEach(x => s += x[2]); let r = Math.random() * s; for (const x of l) { r -= x[2]; if (r <= 0) return x; } return l[0]; };
  function spawnB() {
    const z = R.nextB, T = THEMES[zoneAt(z)];
    if (T.k === 'city') { [-1, 1].forEach(s => { const len = rnd(5, 9); R.blds.push({ s, z, len, h: rnd(3.5, 9), c: Math.floor(Math.random() * 5), x: s * rnd(4.4, 5.2), w: rnd(2.5, 4), seed: Math.random() * 99, zn: zoneAt(z) }); }); R.nextB += rnd(6, 10); return; }
    const S2 = SC[T.k];
    [-1, 1].forEach(s => {
      if (T.k === 'beach' && s === 1) { if (Math.random() < 0.45) { const it = wpick(S2.S); R.blds.push({ s, z: z + rnd(0, 3), em: it[0], sz: it[1], x: rnd(7, 16), y: it[0] === '🐬' || it[0] === '🐳' ? -0.4 : 0, bob: Math.random() * 6, len: 0 }); } return; }
      const n = Math.random() < 0.5 ? 2 : 1; for (let i = 0; i < n; i++) { const it = wpick(S2.L); R.blds.push({ s, z: z + rnd(0, 3.5), em: it[0], sz: it[1] * rnd(0.85, 1.15), x: s * rnd(4.6, it[1] > 4 ? 12 : 8), y: 0, len: 0 }); }
    });
    R.nextB += rnd(3.2, 5.5);
  }
  function spawnRow(z) {
    const types = [null, null, null]; let trains = 0;
    for (let l = 0; l < 3; l++) if (R.busy[l] > z) types[l] = 'busy';
    const free = [0, 1, 2].filter(l => !types[l]);
    const lvl = Math.min(1, R.dist / 1500);
    free.forEach(l => { const r = Math.random(); const tooMany = trains + (3 - free.length) >= 1; if (!tooMany && r < 0.22 + lvl * 0.12) { types[l] = 'train'; trains++; } else if (r < 0.45 + lvl * 0.1) types[l] = 'barrier'; else if (r < 0.62 + lvl * 0.12) types[l] = 'bar'; });
    if (types.every(t => t && t !== 'barrier' && t !== 'bar') || (types.filter(t => t === 'train' || t === 'busy').length >= 3)) { const l = free.length ? free[Math.floor(Math.random() * free.length)] : 1; types[l] = null; }
    for (let l = 0; l < 3; l++) { const t = types[l]; if (t === 'train') { const len = rnd(10, 22); R.obs.push({ k: 'train', l, z, len, c: Math.floor(Math.random() * 4) }); R.busy[l] = z + len + 6; } else if (t === 'barrier' || t === 'bar') R.obs.push({ k: t, l, z, len: 0.5 }); }
    // وكت الصاروخ: خط عملات بالسما
    if (R.pw.jet > 1) { for (let i = 0; i < 8; i++) R.coinsA.push({ l: (Math.floor(z / 7) % 3), z: z - 6 + i * 1.6, y: 3.6, x: LX[Math.floor(z / 7) % 3] }); return; }
    // العملات أو قوة خارقة
    const opts = [0, 1, 2].filter(l => types[l] !== 'train' && types[l] !== 'busy'); if (!opts.length) return;
    const l = opts[Math.floor(Math.random() * opts.length)];
    if (Math.random() < 0.095 && R.dist > 60) { const ks = Object.keys(PW); let s = 0; ks.forEach(k => s += PW[k].w); let r = Math.random() * s, k = ks[0]; for (const q of ks) { r -= PW[q].w; if (r <= 0) { k = q; break; } } R.pws.push({ k, l, z: z - 4, y: 0.8 }); return; }
    const n = 5 + Math.floor(Math.random() * 4), arc = types[l] === 'barrier';
    for (let i = 0; i < n; i++) { const zz = z - (n - 1) * 0.8 + i * 1.6 - (arc ? 0 : 3); const y = arc ? 0.7 + Math.max(0, 1.6 - Math.abs(zz - z) * 0.35) : 0.7; R.coinsA.push({ l, z: zz, y, x: LX[l] }); }
  }
  function start() {
    reset(); R.ph = 'count'; R.cnt = performance.now(); sfx('go'); hideOv(); hud();
  }

  /* ---------- الحركة ---------- */
  const JV = () => R.pw.jump > 0 ? 13.2 : 10.2;
  function doJump(air) { R.vy = air ? JV() * 0.92 : JV(); R.slide = 0; R.jb = 0; R.sq = -0.18; sfx('jump'); if (air) { R.djUsed = true; for (let i = 0; i < 8; i++) R.fx.push({ x: R.x + rnd(-0.4, 0.4), y: R.y + 0.2, z: 0, vx: rnd(-2, 2), vy: rnd(-2, 0), vz: rnd(-1, 1), t: 0.5, e: '✨' }); } }
  function act(k) {
    if (R.ph !== 'play' || R.pause) return;
    if (k === 'left' && R.lane > 0) { R.plane = R.lane; R.lane--; R.tilt = -1; sfx('left'); }
    else if (k === 'right' && R.lane < 2) { R.plane = R.lane; R.lane++; R.tilt = 1; sfx('right'); }
    else if (k === 'up') {
      if (R.pw.jet > 0) return;
      if (R.y <= 0.02) doJump(false);
      else if (R.pw.dj > 0 && !R.djUsed) doJump(true);
      else R.jb = 0.18; // تخزين القفزة: إذا دست قبل ما توصل الأرض، تقفز أول ما تنزل
    }
    else if (k === 'down') { if (R.pw.jet > 0) return; if (R.y > 0.05) R.vy = -26; R.slide = 0.8; R.jb = 0; sfx('slide'); }
  }
  /* تشغيل الزلاجة 🛹 */
  function useBoard() {
    if (R.ph !== 'play' || R.pause) return;
    if (R.board > 0) { showToastR('🛹 الزلاجة شغّالة — باقي ' + Math.ceil(R.board) + ' ثانية'); return; }
    if (BDN() < 1) { sfx('click'); showToastR('😅 ما عندك زلاجات — اشتري من «شخصيتي» أو التقط 🛹 من السكة'); return; }
    if (!isAdm()) S.boards--; save(); R.board = BD_T; R.flash = 0.22; sfx('board'); showToastR('🛹 طارت الزلاجة! تحميك من ضربة وحدة');
    const B = BOARDS[S.bsel] || BOARDS[0]; for (let i = 0; i < 18; i++) R.fx.push({ x: R.x + rnd(-0.6, 0.6), y: rnd(0.1, 0.6), z: rnd(-0.3, 0.3), vx: rnd(-3, 3), vy: rnd(1, 4), vz: rnd(-1, 1), t: 0.6, e: i % 2 ? '✨' : '💫', sm: 1 });
  }
  function breakBoard() {
    R.board = 0; R.shake = 0.8; R.flash = 0.35; R.inv = 1.1; sfx('break'); showToastR('💥 انكسرت الزلاجة وحمتك!'); try { navigator.vibrate && navigator.vibrate([40, 30, 90]); } catch (e) {}
    for (let i = 0; i < 24; i++) R.fx.push({ x: R.x + rnd(-0.4, 0.4), y: rnd(0.2, 1), z: rnd(-0.2, 0.5), vx: rnd(-5, 5), vy: rnd(2, 7), vz: rnd(-2, 3), t: 0.8, e: ['💥', '✨', '⚡'][i % 3] });
  }
  /* بالواجهة العربية «يمين» يعني يمين الشاشة */
  function bindInput(cv) {
    let sx = 0, sy = 0, done = false, id = null, lastTap = 0;
    cv.addEventListener('pointerdown', e => { id = e.pointerId; sx = e.clientX; sy = e.clientY; done = false; try { cv.setPointerCapture(id); } catch (er) {} e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (e.pointerId !== id || done) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.hypot(dx, dy) < 20) return; done = true; if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? 'right' : 'left'); else act(dy < 0 ? 'up' : 'down'); });
    cv.addEventListener('pointerup', e => { if (e.pointerId !== id) return; if (!done && Math.hypot(e.clientX - sx, e.clientY - sy) < 12) { const n = performance.now(); if (n - lastTap < 300) { lastTap = 0; useBoard(); } else { lastTap = n; act('up'); } } id = null; });
    document.addEventListener('keydown', e => { if (window.curPage !== 'run') return; const m = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', ' ': 'up' }[e.key]; if (m) { act(m); e.preventDefault(); } if (e.key === 'p' || e.key === 'Escape') togglePause(); if (e.key === 'b' || e.key === 'Shift') useBoard(); });
  }

  /* ---------- التحديث ---------- */
  function hitTest(o) {
    const pz0 = -0.45, pz1 = 0.45; if (o.z > pz1 || o.z + o.len < pz0) return false;
    if (Math.abs(R.x - LX[o.l]) > (o.k === 'train' ? 1.15 : 0.95)) return false;
    if (R.y > 2.55) return false; // فوك القطار
    if (o.k === 'barrier') return R.y < 0.9;
    if (o.k === 'bar') return !(R.slide > 0 && R.y < 0.4);
    return true;
  }
  const GHOST_D = 2.9;
  function update(dt) {
    R.t += dt;
    if (R.ph === 'count') { if (performance.now() - R.cnt > 2000) { R.ph = 'play'; } return; }
    if (R.ph === 'dead') {
      const p0 = R.dead; R.dead += dt; R.shake = Math.max(0, R.shake - dt * 1.5);
      if (p0 < 0.35 && R.dead >= 0.35) sfx('ghost');
      if (p0 < 1.55 && R.dead >= 1.55) { sfx('stab'); R.shake = 1.4; R.flash = 0; try { navigator.vibrate && navigator.vibrate([60, 30, 200]); } catch (e) {} }
      if (p0 < 2.0 && R.dead >= 2.0) sfx('laugh');
      R.fx.forEach(f => { f.t -= dt; f.x += (f.vx || 0) * dt; f.y += (f.vy || 0) * dt; f.z += (f.vz || 0) * dt; if (!f.txt) f.vy -= 9 * dt; }); R.fx = R.fx.filter(f => f.t > 0);
      if (R.dead > GHOST_D && !$r('runOver').classList.contains('on')) showOver(); return;
    }
    if (R.pause && R.resumeAt && performance.now() - R.resumeAt > 2000) { R.pause = false; R.resumeAt = 0; }
    if (R.ph !== 'play' || R.pause) return;
    const slow = R.pw.slow > 0 ? 0.62 : 1;
    R.sp = Math.min(31, 13 + R.dist / 110); const d = R.sp * dt * slow; R.dist += d;
    // تبديل السكة بنعومة + ميلان الجسم
    R.gt += dt * slow * (0.9 + (R.sp - 13) * 0.02);
    { const sN = Math.floor(R.gt * 11 / Math.PI); if (sN !== R.stepN) { R.stepN = sN; if (R.y < 0.05 && !(R.board > 0) && !(R.slide > 0) && !(R.pw.jet > 0)) { sfx('step'); R.fx.push({ x: R.x + (sN % 2 ? 0.2 : -0.2), y: 0.08, z: 0.05, vx: rnd(-0.6, 0.6), vy: rnd(0.3, 0.9), vz: 0, t: 0.3, e: '💨', sm: 1 }); } } }
    if (R.board > 0) { R.board -= dt; if (Math.random() < 0.4) R.fx.push({ x: R.x + rnd(-0.35, 0.35), y: R.y + 0.15, z: -0.1, vx: 0, vy: rnd(-0.4, 0.2), vz: -2, t: 0.35, e: '✨', sm: 1 }); if (R.board <= 0) { R.board = 0; showToastR('🛹 خلص وقت الزلاجة'); } }
    const tx = LX[R.lane]; R.x += (tx - R.x) * Math.min(1, dt * 15); R.tilt += (0 - R.tilt) * Math.min(1, dt * 7);
    R.cx += (R.x - R.cx) * Math.min(1, dt * 7);
    // الصاروخ: يطير فوك
    if (R.pw.jet > 0) { R.y += (3.4 - R.y) * Math.min(1, dt * 4); R.vy = 0; R.slide = 0; if (Math.random() < 0.6) R.fx.push({ x: R.x + rnd(-0.2, 0.2), y: R.y + 0.4, z: -0.3, vx: rnd(-0.5, 0.5), vy: -3, vz: -2, t: 0.35, e: pick(['🔥', '💨']) }); if (R.pw.jet < dt * 1.5) R.vy = 1; }
    // القفز: نزول أسرع من الصعود ولحظة تعليق فوك حتى تحس بيه
    else if (R.y > 0 || R.vy > 0) {
      const gv = R.vy > 0 ? (Math.abs(R.vy) < 2.2 ? 17 : 30) : 44; R.vy -= gv * dt; R.y += R.vy * dt;
      if (R.y <= 0) { R.y = 0; const hard = R.vy < -14; R.vy = 0; R.djUsed = false; R.sq = hard ? 0.28 : 0.18; sfx('land'); for (let i = 0; i < (hard ? 8 : 4); i++) R.fx.push({ x: R.x + rnd(-0.5, 0.5), y: 0.15, z: rnd(-0.2, 0.3), vx: rnd(-2.2, 2.2), vy: rnd(0.5, 1.6), vz: 0, t: 0.35, e: '💨', sm: 1 }); if (R.jb > 0) doJump(false); }
    }
    if (R.jb > 0) R.jb -= dt; R.sq += (0 - R.sq) * Math.min(1, dt * 10);
    R.cy += ((R.pw.jet > 0 ? R.y * 0.55 : Math.max(0, R.y) * 0.18) - R.cy) * Math.min(1, dt * 5);
    if (R.slide > 0) R.slide -= dt;
    for (const k in R.pw) if (R.pw[k] > 0) R.pw[k] -= dt;
    if (R.inv > 0) R.inv -= dt; R.shake = Math.max(0, R.shake - dt * 2.4); if (R.stT > 0) R.stT -= dt; if (R.ghT > 0) R.ghT -= dt;
    const mv = o => { o.z -= d; };
    R.obs.forEach(mv); R.coinsA.forEach(mv); R.pws.forEach(mv); R.blds.forEach(mv); R.nextZ -= d; R.nextB -= d; R.busy = R.busy.map(b => b - d);
    while (R.nextZ < 80) { spawnRow(R.nextZ); R.nextZ += Math.max(11, rnd(13, 20) + R.sp * 0.18); }
    while (R.nextB < 90) spawnB();
    R.obs = R.obs.filter(o => o.z + o.len > -6); R.coinsA = R.coinsA.filter(o => o.z > -6 && !o.got); R.pws = R.pws.filter(o => o.z > -6 && !o.got); R.blds = R.blds.filter(b => b.z + (b.len || 0) > -8);
    // الاصطدام
    const safe = R.pw.jet > 0 || R.pw.ph > 0 || R.inv > 0;
    if (!safe) for (const o of R.obs) if (!o.hit && hitTest(o)) {
      // ضربة جانبية بالقطار وانت تبدّل السكة: ترجع وتتعثر، والشبح يلحكك. إذا تعثرت مرتين ورا بعض = يمسكك
      if (o.k === 'train' && o.z < -0.15 && Math.abs(R.x - LX[o.l]) > 0.3 && R.plane !== R.lane) {
        if (R.board > 0) breakBoard();
        else if (R.shield > 0) { R.shield = 0; sfx('shield'); R.flash = 0.35; }
        else if (R.stT > 0) { die(); return; }
        else { R.stT = 5; R.ghT = GH_T; showToastR('⚠️ انتبه! ضربة ثانية خلال 5 ثواني والشبح يمسكك 👻'); }
        R.lane = R.plane; R.shake = 0.6; R.inv = 0.5; sfx('bump'); break;
      }
      if (R.board > 0) { breakBoard(); o.hit = true; o.gone = true; continue; }
      if (R.shield > 0) { R.shield = 0; o.hit = true; o.gone = true; sfx('shield'); R.flash = 0.4; R.inv = 0.4; for (let i = 0; i < 22; i++) R.fx.push({ x: R.x, y: 1, z: 0.5, vx: rnd(-3, 3), vy: rnd(1, 6), vz: rnd(-1, 3), t: 0.8, e: '✨' }); continue; }
      die(); return;
    }
    R.obs = R.obs.filter(o => !o.gone);
    // العملات
    const mag = R.pw.mag > 0 || R.pw.jet > 0, cm = R.pw.x2 > 0 ? 2 : 1;
    R.coinsA.forEach(c => { if (mag && c.z < 14 && c.z > -1) { c.x += (R.x - c.x) * Math.min(1, dt * 7); c.y += (R.y + 0.8 - c.y) * Math.min(1, dt * 7); c.z -= c.z * Math.min(1, dt * 5); }
      const cx = c.x !== undefined ? c.x : LX[c.l]; if (Math.abs(c.z) < 0.7 && Math.abs(cx - R.x) < 0.9 && Math.abs(c.y - (R.y + 0.8)) < 1.25) { c.got = true; R.coins += cm; sfx('coin'); R.fx.push({ x: cx, y: c.y + 0.3, z: c.z, vx: 0, vy: 2.5, vz: 0, t: 0.5, txt: '+' + cm }); } });
    R.pws.forEach(p => { if (Math.abs(p.z) < 0.8 && Math.abs(LX[p.l] - R.x) < 0.95 && R.y < 2.4) { p.got = true; sfx(p.k === 'jet' ? 'jet' : 'power'); if (p.k === 'sh') R.shield = 1; else if (p.k === 'bd') { if (!isAdm()) S.boards++; save(); } else R.pw[p.k] = PW[p.k].d; if (p.k === 'jet') { R.obs = R.obs.filter(o => o.z > 40 || o.k === 'train'); } showToastR(PW[p.k].e + ' ' + PW[p.k].n + '!'); for (let i = 0; i < 14; i++) R.fx.push({ x: R.x, y: 1.2, z: 0.3, vx: rnd(-3, 3), vy: rnd(1, 5), vz: rnd(-1, 2), t: 0.7, e: PW[p.k].e }); } });
    R.fx.forEach(f => { f.t -= dt; f.x += (f.vx || 0) * dt; f.y += (f.vy || 0) * dt; f.z += (f.vz || 0) * dt - d; if (!f.txt && !f.sm) f.vy -= 9 * dt; }); R.fx = R.fx.filter(f => f.t > 0);
    if (R.pw.sc2 > 0) R.extra += d * (1 + Math.floor(R.dist / 500) * 0.5);
    R.score = Math.floor(R.dist * (1 + Math.floor(R.dist / 500) * 0.5) + R.extra) + R.coins * 5;
    const zn = zoneAt(0); if (zn !== R.zone) { R.zone = zn; R.zoneT = 2.4; sfx('zone'); } if (R.zoneT > 0) R.zoneT -= dt;
    if (R.flash > 0) R.flash -= dt;
  }
  /* الخسارة: يجي شبح بسكين ويخلّص عليك 👻🔪 */
  function die() {
    R.ph = 'dead'; R.dead = 0; R.shake = 1; R.pw = {}; R.board = 0; sfx('lose'); try { navigator.vibrate && navigator.vibrate([80, 40, 120]); } catch (e) {}
    R.killer = { side: R.x > 0.5 ? -1 : 1 };
    for (let i = 0; i < 18; i++) R.fx.push({ x: R.x, y: 1 + R.y, z: 0.2, vx: rnd(-4, 4), vy: rnd(2, 8), vz: rnd(-2, 2), t: 0.9, e: ['💥', '⭐', '💫'][i % 3] });
    const nb = R.score > S.best; S.best = Math.max(S.best, R.score); S.coins += R.coins - R.banked; R.banked = R.coins; if (!R.revived) S.runs++; R.newBest = nb || R.newBest; save();
  }
  const REV = () => 60 + R.revived * 60;
  function revive() {
    const c = REV(); if (CN() < c) { showToastR('😅 تحتاج ' + c + ' 🪙'); return; }
    spend(c); save(); R.revived++; R.ph = 'play'; R.dead = 0; R.killer = null; R.inv = 2.5; R.y = Math.max(R.y, 0); R.vy = 0; R.slide = 0; R.stT = 0; R.ghT = 0; R.shake = 0;
    R.obs = R.obs.filter(o => o.z > 18); R.busy = [0, 0, 0]; R.x = LX[R.lane]; R.plane = R.lane;
    hideOv(); sfx('revive'); showToastR('💖 رجعت للحياة! عندك حماية ثانيتين');
  }

  /* ---------- الرسم ---------- */
  let F = 0, HOR = 0;
  const P = (x, y, z) => { const k = F / Math.max(0.6, z + ZC); return [R.W / 2 + (x - R.cx * 0.55) * k, HOR + (CAMH + R.cy - y) * k, k]; };
  function quad(g, a, b, c, d, fill) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fillStyle = fill; g.fill(); }
  const NEAR = -4.8, FAR = 85;
  /* الجبال/الخلفية البعيدة لكل عالم */
  function drawFar(g, T, W) {
    const base = HOR + 2, px = -R.cx * 6;
    g.save();
    if (T.k === 'snow' || T.k === 'desert' || T.k === 'beach') {
      const layers = T.k === 'snow' ? [[0.55, 0.9, T.mt], [0.35, 0.6, shade('#b0c4e0', 10)]] : T.k === 'desert' ? [[0.22, 0.5, T.mt]] : [[0.12, 0.4, T.mt]];
      layers.forEach((L, li) => {
        g.fillStyle = L[2]; g.beginPath(); g.moveTo(-50, base);
        for (let i = -1; i <= 9; i++) { const x = i * W / 7 + px * (li + 1) * 0.5 + (li * 37), h = HOR * (L[0] + 0.45 * Math.abs(Math.sin(i * 1.7 + li * 2.3))) * (L[1]); g.lineTo(x, base - h); g.lineTo(x + W / 14, base - h * 0.55); }
        g.lineTo(W + 50, base); g.closePath(); g.fill();
        if (T.k === 'snow') { g.fillStyle = 'rgba(255,255,255,.95)'; for (let i = -1; i <= 9; i++) { const x = i * W / 7 + px * (li + 1) * 0.5 + (li * 37), h = HOR * (L[0] + 0.45 * Math.abs(Math.sin(i * 1.7 + li * 2.3))) * (L[1]); g.beginPath(); g.moveTo(x - W * 0.025, base - h * 0.78); g.lineTo(x, base - h); g.lineTo(x + W * 0.022, base - h * 0.8); g.lineTo(x + W * 0.008, base - h * 0.74); g.closePath(); g.fill(); } }
      });
    } else {
      // مدينة: ناطحات سحاب بعيدة
      g.fillStyle = T.mt; for (let i = 0; i < 18; i++) { const w = W / 16, x = i * w * 1.05 + (px % w) - w, h = HOR * (0.18 + 0.35 * Math.abs(Math.sin(i * 2.1))); g.fillRect(x, base - h, w * 0.9, h); if (T.lit) { g.fillStyle = 'rgba(255,226,122,.55)'; for (let j = 0; j < 5; j++) if (Math.sin(i * 5 + j * 3) > 0.2) g.fillRect(x + w * 0.3, base - h + 6 + j * h / 6, 2, 2); g.fillStyle = T.mt; } }
    }
    g.restore();
  }
  function drawWorld(g) {
    const W = R.W, H = R.H, T = THEMES[R.zone];
    F = H * 0.95 * (1 - Math.min(0.08, (R.sp - 13) * 0.0045)); HOR = H * 0.3;
    // السما
    const sk = g.createLinearGradient(0, 0, 0, HOR + 20); sk.addColorStop(0, T.sky[0]); sk.addColorStop(1, T.sky[1]); g.fillStyle = sk; g.fillRect(0, 0, W, HOR + 30);
    if (T.stars) { g.fillStyle = '#fff'; for (let i = 0; i < 46; i++) { const x = (i * 97.3 % W), y = (i * 53.7 % HOR); g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(R.t * 2 + i)); g.fillRect(x, y, 2, 2); } g.globalAlpha = 1; g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(W * 0.78, HOR * 0.35, 22, 0, 7); g.fill(); g.fillStyle = T.sky[0]; g.beginPath(); g.arc(W * 0.78 + 9, HOR * 0.35 - 6, 19, 0, 7); g.fill(); }
    else if (R.zone === 5 || T.k === 'desert') { const sx = T.k === 'desert' ? W * 0.72 : W * 0.3, sy = HOR * (T.k === 'desert' ? 0.38 : 0.86), gl = g.createRadialGradient(sx, sy, 4, sx, sy, 90); gl.addColorStop(0, 'rgba(255,250,210,1)'); gl.addColorStop(0.3, 'rgba(255,220,140,.7)'); gl.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gl; g.fillRect(sx - 90, sy - 90, 180, 180); g.fillStyle = '#fff4c0'; g.beginPath(); g.arc(sx, sy, 26, 0, 7); g.fill(); }
    else { g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 4; i++) { const x = ((i * 180 + R.t * 8) % (W + 200)) - 100, y = 30 + i * 22; g.beginPath(); g.ellipse(x, y, 40, 12, 0, 0, 7); g.ellipse(x + 26, y - 6, 26, 12, 0, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,240,140,.95)'; g.beginPath(); g.arc(W * 0.84, HOR * 0.35, 20, 0, 7); g.fill(); if (T.k === 'beach') { g.fillStyle = '#fff'; g.font = '14px system-ui'; for (let i = 0; i < 3; i++) g.fillText('🕊️', ((i * 230 + R.t * 25) % (W + 60)) - 30, 40 + i * 18 + Math.sin(R.t * 3 + i) * 4); } }
    drawFar(g, T, W);
    // الأرض: كل عالم إله لون، وحدود العالم الجاي تبين من بعيد
    g.fillStyle = T.gr; g.fillRect(0, HOR, W, H - HOR);
    const bz = (Math.floor(R.dist / ZL) + 1) * ZL - R.dist; let segs = [[NEAR, Math.min(FAR, bz), R.zone]]; if (bz < FAR) segs.push([bz, FAR, (R.zone + 1) % THEMES.length]);
    segs.forEach(s => { const Z = THEMES[s[2]], z0 = Math.max(NEAR, s[0]), z1 = s[1]; if (z1 <= z0) return;
      if (s[2] !== R.zone) quad(g, P(-60, 0, z1), P(60, 0, z1), P(60, 0, z0), P(-60, 0, z0), Z.gr);
      if (Z.sea) { const a = P(4.3, 0, z1), b = P(90, 0, z1), c = P(90, 0, z0), d = P(4.3, 0, z0), sg = g.createLinearGradient(0, HOR, 0, H); sg.addColorStop(0, Z.sea[0]); sg.addColorStop(1, Z.sea[1]); quad(g, a, b, c, d, sg);
        // موج يتحرك
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; const off = (R.dist * 0.6 + R.t * 2) % 3; for (let z = z1 - off; z > z0; z -= 3) { const p1 = P(5 + Math.sin(z + R.t) * 0.3, 0, z), p2 = P(30, 0, z); g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.stroke(); }
        const w1 = P(4.3, 0, z1), w2 = P(4.3, 0, z0), fo = 0.35 + Math.sin(R.t * 3) * 0.15; quad(g, w1, P(4.3 + fo, 0, z1), P(4.3 + fo, 0, z0), w2, 'rgba(255,255,255,.75)'); }
      const pl = P(-3, 0, z1), pr = P(3, 0, z1), nl = P(-3, 0, z0), nr = P(3, 0, z0); quad(g, pl, pr, nr, nl, Z.bed);
      [-1, 1].forEach(sd => quad(g, P(sd * 3, 0, z1), P(sd * 3.9, 0, z1), P(sd * 3.9, 0, z0), P(sd * 3, 0, z0), Z.side));
    });
    // العتبات (الخشب) تتحرك
    const sp = 2.1, off = R.dist % sp;
    for (let z = FAR - ((FAR - NEAR) % sp) - off; z > NEAR; z -= sp) { const z2 = z + 0.45, Z = THEMES[z > bz ? (R.zone + 1) % THEMES.length : R.zone]; for (let l = 0; l < 3; l++) { const x = LX[l]; quad(g, P(x - 0.85, 0, z2), P(x + 0.85, 0, z2), P(x + 0.85, 0, z), P(x - 0.85, 0, z), Z.tie); if (Z.snow && z < 30) quad(g, P(x - 0.85, 0.01, z2), P(x - 0.2, 0.01, z2), P(x - 0.2, 0.01, z), P(x - 0.85, 0.01, z), 'rgba(255,255,255,.7)'); } }
    // القضبان
    for (let l = 0; l < 3; l++) [-0.55, 0.55].forEach(dx => { const x = LX[l] + dx; quad(g, P(x - 0.07, 0.05, FAR), P(x + 0.07, 0.05, FAR), P(x + 0.07, 0.05, NEAR), P(x - 0.07, 0.05, NEAR), T.rail); });
    // المناظر (البعيدة أول)
    drawBldShadows(g);
    R.blds.slice().sort((a, b) => b.z - a.z).forEach(b => b.em ? drawEmo(g, b) : drawBld(g, b, THEMES[b.zn !== undefined ? b.zn : R.zone].b ? THEMES[b.zn !== undefined ? b.zn : R.zone] : T));
    // جو كل عالم: ثلج ينزل، رمل يطير، ...
    if (T.snow) { g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 70; i++) { const x = (i * 71.7 + R.t * 30 * (1 + i % 3) + Math.sin(R.t + i) * 20) % W, y = (i * 43.1 + R.t * 70 * (1 + i % 2)) % H; g.beginPath(); g.arc(x, y, 1.4 + (i % 3) * 0.8, 0, 7); g.fill(); } }
    else if (T.k === 'desert') { g.fillStyle = 'rgba(255,230,170,.5)'; for (let i = 0; i < 30; i++) { const x = (W - ((i * 91.7 + R.t * 160 * (1 + i % 3)) % (W + 40))), y = HOR + (i * 37.1 % (H - HOR)); g.fillRect(x, y, 6 + i % 4 * 3, 1.5); } }
    else if (T.k === 'beach') { for (let i = 0; i < 6; i++) { const x = (i * 131 + R.t * 40) % W, y = HOR * 0.3 + (i * 29 % (HOR * 0.6)); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); } }
    // خطوط السرعة
    if (R.ph === 'play' && (R.sp > 21 || R.pw.jet > 0)) { const n = R.pw.jet > 0 ? 18 : Math.floor((R.sp - 21) * 1.5); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; for (let i = 0; i < n; i++) { const a = (i * 2.399 + R.t * 0.7) % 6.283, r0 = Math.min(W, H) * (0.42 + ((R.t * 3 + i * 0.37) % 1) * 0.5), cx = W / 2, cy = H * 0.45; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * (r0 + 40), cy + Math.sin(a) * (r0 + 40)); g.stroke(); } }
  }
  function drawEmo(g, b) {
    if (b.z < NEAR + 0.3 || b.z > FAR) return;
    const bob = b.bob !== undefined ? Math.sin(R.t * 2 + b.bob) * 0.15 : 0, p = P(b.x, (b.y || 0) + bob, b.z), s = b.sz * p[2];
    if (s < 2) return; const fade = b.z > FAR - 15 ? (FAR - b.z) / 15 : 1; g.globalAlpha = Math.max(0, fade);
    if (b.y >= 0) { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(p[0], p[1], s * 0.32, s * 0.07, 0, 0, 7); g.fill(); }
    g.drawImage(emo(b.em), p[0] - s / 2, p[1] - s * 0.93, s, s); g.globalAlpha = 1;
  }
  function drawBld(g, b, T) {
    const z0 = Math.max(NEAR, b.z), z1 = b.z + b.len; if (z1 < NEAR || z0 > FAR) return;
    const xi = b.x, xo = b.x + b.s * b.w, col = T.b[b.c];
    // الواجهة الجانبية (تطل على السكة)
    quad(g, P(xi, 0, z0), P(xi, b.h, z0), P(xi, b.h, z1), P(xi, 0, z1), shade(col.startsWith('#') ? col : '#888888', -25));
    // الواجهة القدامية
    const a = P(xi, 0, z0), c = P(xo, b.h, z0); g.fillStyle = col; g.fillRect(Math.min(a[0], c[0]), c[1], Math.abs(c[0] - a[0]), a[1] - c[1]);
    // الشبابيك
    const k = a[2], ww = Math.abs(c[0] - a[0]), hh = a[1] - c[1]; if (ww < 6) return; const cols = Math.max(2, Math.round(b.w / 1.1)), rows = Math.max(2, Math.round(b.h / 1.3)), x0 = Math.min(a[0], c[0]);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const on = T.lit && ((Math.sin(b.seed + i * 7 + j * 13) > 0.1) ? 1 : 0); g.fillStyle = on ? T.win : (T.lit ? 'rgba(0,0,0,.35)' : T.win); g.globalAlpha = T.lit ? 1 : 0.75; g.fillRect(x0 + ww * (i + 0.22) / cols, c[1] + hh * (j + 0.2) / rows, ww * 0.56 / cols, hh * 0.55 / rows); }
    g.globalAlpha = 1;
    void k;
  }
  const TRC = [['#e8382e', '#ffd23a'], ['#3a8bff', '#eef2f8'], ['#2eae6a', '#ffd23a'], ['#ff8a2a', '#3a2a5a']];
  /* ---------- قطار مترو احترافي: سقف بتدرّج + فتحات تكييف، جوانب بشبابيك وأبواب وخط ملوّن وعجلات، ووجه بمقصورة وكشّافات وصدّام ---------- */
  function drawTrain(g, o) {
    const x = LX[o.l], z0 = Math.max(NEAR + 0.2, o.z), z1 = o.z + o.len, w = 0.78, h = 2.4, C = TRC[o.c], acc = C[1];
    const camX = R.cx * 0.55, inside = o.z < 0.6 && o.z + o.len > -0.6 && Math.abs(x - R.x) < 1.2 && R.y < 2.5; g.save(); if (inside) g.globalAlpha = 0.3;
    // ظل تحت القطار
    quad(g, P(x - w - 0.15, 0, z0), P(x + w + 0.15, 0, z0), P(x + w + 0.15, 0, z1), P(x - w - 0.15, 0, z1), 'rgba(0,0,0,.28)');
    // السقف: 3 شرائح (أطراف أغمق ووسط ألمع) + خط وسطي + فتحات تكييف
    const rl = 0.42; quad(g, P(x - w, h, z0), P(x - w + rl, h + 0.1, z0), P(x - w + rl, h + 0.1, z1), P(x - w, h, z1), shade(C[0], 6));
    quad(g, P(x - w + rl, h + 0.1, z0), P(x + w - rl, h + 0.1, z0), P(x + w - rl, h + 0.1, z1), P(x - w + rl, h + 0.1, z1), shade(C[0], 38));
    quad(g, P(x + w - rl, h + 0.1, z0), P(x + w, h, z0), P(x + w, h, z1), P(x + w - rl, h + 0.1, z1), shade(C[0], 6));
    for (let zz = o.z + 1.4; zz < z1 - 1.2; zz += 3.6) { if (zz + 1.5 < z0 || zz > 70) continue; const za = Math.max(z0, zz), zb = zz + 1.5; quad(g, P(x - 0.34, h + 0.1, za), P(x + 0.34, h + 0.1, za), P(x + 0.34, h + 0.1, zb), P(x - 0.34, h + 0.1, zb), '#c9ced8'); quad(g, P(x - 0.3, h + 0.2, za), P(x + 0.3, h + 0.2, za), P(x + 0.3, h + 0.2, zb), P(x - 0.3, h + 0.2, zb), '#e8ecf3'); }
    // الجانب الظاهر مع التفاصيل
    const xs = x - w > camX ? x - w : (x + w < camX ? x + w : null);
    if (xs !== null) {
      quad(g, P(xs, 0, z0), P(xs, h, z0), P(xs, h, z1), P(xs, 0, z1), shade(C[0], -34));
      quad(g, P(xs, h - 0.14, z0), P(xs, h, z0), P(xs, h, z1), P(xs, h - 0.14, z1), shade(C[0], -8));          // حافة السقف
      quad(g, P(xs, 0.62, z0), P(xs, 0.98, z0), P(xs, 0.98, z1), P(xs, 0.62, z1), acc);                         // الخط الملوّن الطويل
      quad(g, P(xs, 0.3, z0), P(xs, 0.62, z0), P(xs, 0.62, z1), P(xs, 0.3, z1), shade(C[0], -62));              // تنورة
      quad(g, P(xs, 0, z0), P(xs, 0.3, z0), P(xs, 0.3, z1), P(xs, 0, z1), '#1b1822');                           // الهيكل السفلي
      for (let zz = o.z + 0.9; zz < z1 - 0.8; zz += 1.8) {                                                    // الشبابيك
        const zb = zz + 1.15; if (zb < z0 || zz > 62) continue; const za = Math.max(z0, zz), door = Math.round((zz - o.z) / 1.8) % 5 === 2;
        if (door) { quad(g, P(xs, 0.3, za), P(xs, 2.05, za), P(xs, 2.05, zb), P(xs, 0.3, zb), shade(C[0], -58)); quad(g, P(xs, 1.1, za), P(xs, 1.95, za), P(xs, 1.95, zb), P(xs, 1.1, zb), '#1d3358'); continue; }
        quad(g, P(xs, 1.12, za), P(xs, 1.98, za), P(xs, 1.98, zb), P(xs, 1.12, zb), '#14264a');
        quad(g, P(xs, 1.62, za), P(xs, 1.96, za), P(xs, 1.96, zb), P(xs, 1.62, zb), 'rgba(140,190,255,.28)');
      }
      for (let zw = o.z + 1.6; zw < z1 - 1; zw += 4.2) { if (zw < z0 || zw > 55) continue; [0, 0.9].forEach(d => { const q = P(xs, 0.2, zw + d); g.fillStyle = '#0d0b12'; g.beginPath(); g.arc(q[0], q[1], 0.19 * q[2], 0, 7); g.fill(); g.fillStyle = '#6a6f7e'; g.beginPath(); g.arc(q[0], q[1], 0.07 * q[2], 0, 7); g.fill(); }); }   // عجلات
    }
    // الواجهة (تظهر بس لما القطار قدّام)
    if (o.z > NEAR + 0.2) {
      const a = P(x - w, 0, z0), b = P(x + w, h, z0), ww = b[0] - a[0], hh = a[1] - b[1], X = a[0], Y = b[1];
      const bg = g.createLinearGradient(0, Y, 0, Y + hh); bg.addColorStop(0, shade(C[0], 42)); bg.addColorStop(0.5, C[0]); bg.addColorStop(1, shade(C[0], -48));
      g.fillStyle = bg; rr(g, X, Y, ww, hh, ww * 0.11); g.fill(); g.lineWidth = Math.max(1, ww * 0.018); g.strokeStyle = shade(C[0], -70); g.stroke();
      g.fillStyle = acc; g.fillRect(X, Y + hh * 0.6, ww, hh * 0.08);                                                    // الخط الملوّن
      // شاشة الوجهة
      g.fillStyle = '#0b0b10'; rr(g, X + ww * 0.3, Y + hh * 0.025, ww * 0.4, hh * 0.075, ww * 0.02); g.fill(); g.fillStyle = '#ffb020'; for (let i = 0; i < 6; i++) g.fillRect(X + ww * (0.33 + i * 0.056), Y + hh * 0.045, ww * 0.032, hh * 0.035);
      // الزجاج الأمامي
      const wx = X + ww * 0.1, wy = Y + hh * 0.12, wW = ww * 0.8, wH = hh * 0.38, gl = g.createLinearGradient(0, wy, 0, wy + wH); gl.addColorStop(0, '#2f4d86'); gl.addColorStop(1, '#0d1830');
      g.fillStyle = gl; rr(g, wx, wy, wW, wH, ww * 0.06); g.fill(); g.lineWidth = Math.max(1, ww * 0.02); g.strokeStyle = '#05070f'; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(wx + wW * 0.08, wy + wH * 0.08); g.lineTo(wx + wW * 0.38, wy + wH * 0.08); g.lineTo(wx + wW * 0.18, wy + wH * 0.92); g.lineTo(wx + wW * 0.02, wy + wH * 0.92); g.closePath(); g.fill();
      g.strokeStyle = '#05070f'; g.beginPath(); g.moveTo(wx + wW / 2, wy); g.lineTo(wx + wW / 2, wy + wH); g.stroke();
      // كشّافات مع توهج
      [0.19, 0.81].forEach(f => { const cx = X + ww * f, cy = Y + hh * 0.79, r = ww * 0.07, gg = g.createRadialGradient(cx, cy, 0, cx, cy, r * 3.2); gg.addColorStop(0, 'rgba(255,246,170,.55)'); gg.addColorStop(1, 'rgba(255,246,170,0)'); g.fillStyle = gg; g.beginPath(); g.arc(cx, cy, r * 3.2, 0, 7); g.fill(); g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.lineWidth = Math.max(1, r * 0.35); g.strokeStyle = '#7a7466'; g.stroke(); });
      // لوحة رقم القطار
      g.fillStyle = '#f4f4ee'; rr(g, X + ww * 0.4, Y + hh * 0.73, ww * 0.2, hh * 0.09, ww * 0.015); g.fill(); g.fillStyle = '#c0392b'; g.fillRect(X + ww * 0.42, Y + hh * 0.755, ww * 0.16, hh * 0.02);
      // الصدّام (خطوط تحذير)
      g.save(); rr(g, X + ww * 0.03, Y + hh * 0.89, ww * 0.94, hh * 0.1, ww * 0.02); g.clip(); g.fillStyle = '#ffd23a'; g.fillRect(X, Y + hh * 0.89, ww, hh * 0.11); g.fillStyle = '#16131c'; for (let i = -2; i < 12; i++) { g.beginPath(); g.moveTo(X + i * ww / 8, Y + hh); g.lineTo(X + (i + 0.5) * ww / 8, Y + hh); g.lineTo(X + (i + 1.5) * ww / 8, Y + hh * 0.89); g.lineTo(X + (i + 1) * ww / 8, Y + hh * 0.89); g.closePath(); g.fill(); } g.restore();
      g.fillStyle = '#2b2833'; g.fillRect(X + ww * 0.44, Y + hh * 0.985, ww * 0.12, hh * 0.03);                      // الكابلر
    }
    g.restore();
  }
  function drawObs(g, o) {
    const x = LX[o.l];
    if (o.k === 'train') {
      drawTrain(g, o);
    } else if (o.k === 'barrier') {
      const z = Math.max(NEAR, o.z), a = P(x - 0.8, 0, z), b = P(x + 0.8, 0.95, z), ww = b[0] - a[0], hh = a[1] - b[1];
      g.fillStyle = '#555'; g.fillRect(a[0] + ww * 0.08, b[1], ww * 0.06, hh); g.fillRect(a[0] + ww * 0.86, b[1], ww * 0.06, hh);
      g.save(); rr(g, a[0], b[1], ww, hh * 0.5, hh * 0.08); g.clip(); g.fillStyle = '#fff'; g.fillRect(a[0], b[1], ww, hh * 0.5); g.fillStyle = '#e8382e'; for (let i = -2; i < 8; i++) { g.beginPath(); g.moveTo(a[0] + i * ww / 5, b[1] + hh * 0.5); g.lineTo(a[0] + (i + 0.5) * ww / 5, b[1] + hh * 0.5); g.lineTo(a[0] + (i + 1) * ww / 5, b[1]); g.lineTo(a[0] + (i + 0.5) * ww / 5, b[1]); g.fill(); } g.restore();
    } else if (o.k === 'bar') {
      const z = Math.max(NEAR, o.z), a = P(x - 0.85, 0, z), b = P(x + 0.85, 1.75, z), lo = P(x, 1.05, z), ww = b[0] - a[0];
      g.fillStyle = '#3a3a48'; g.fillRect(a[0], b[1], ww * 0.07, a[1] - b[1]); g.fillRect(a[0] + ww * 0.93, b[1], ww * 0.07, a[1] - b[1]);
      g.fillStyle = '#ffd23a'; rr(g, a[0], b[1], ww, lo[1] - b[1], 4); g.fill(); g.fillStyle = '#1e1428'; for (let i = 0; i < 6; i++) g.fillRect(a[0] + ww * (i * 0.18 + 0.04), b[1], ww * 0.08, lo[1] - b[1]);
      g.font = Math.max(8, (lo[1] - b[1]) * 0.7) + 'px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
    }
  }
  function drawCoin(g, c) {
    const cx = c.x !== undefined ? c.x : LX[c.l], p = P(cx, c.y, c.z), r = 0.28 * p[2], sx = Math.abs(Math.cos(R.t * 5 + c.z * 0.5));
    g.save(); g.translate(p[0], p[1]); g.scale(Math.max(0.15, sx), 1); g.fillStyle = '#b8860b'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(0, 0, r * 0.8, 0, 7); g.fill(); g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(-r * 0.25, -r * 0.25, r * 0.22, 0, 7); g.fill(); g.restore();
  }
  function drawPw(g, p) { const q = P(LX[p.l], p.y + Math.sin(R.t * 4) * 0.15, p.z), r = 0.42 * q[2]; const gl = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * 1.6); gl.addColorStop(0, 'rgba(255,255,255,.95)'); gl.addColorStop(1, 'rgba(162,74,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(q[0], q[1], r * 1.6, 0, 7); g.fill(); g.font = (r * 1.3) + 'px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(PW[p.k].e, q[0], q[1]); }
  function drawPlayer(g) {
    const p = P(R.x, R.y, 0), s0 = P(R.x, 0, 0), sc = 1.75 * p[2] / 130;
    { const L = sunDir(), hh = 1.5, e0 = P(R.x + L[0] * R.y, 0, Math.max(NEAR + 0.05, L[1] * R.y)), e1 = P(R.x + L[0] * (R.y + hh), 0, Math.max(NEAR + 0.05, L[1] * (R.y + hh))), w0 = 0.22 * e0[2], w1 = 0.13 * e1[2], dx = e1[0] - e0[0], dy = e1[1] - e0[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl;
      g.fillStyle = 'rgba(8,10,30,' + (L[2] * Math.max(0.3, 1 - R.y * 0.25)) + ')'; g.beginPath(); g.moveTo(e0[0] + nx * w0, e0[1] + ny * w0); g.lineTo(e1[0] + nx * w1, e1[1] + ny * w1); g.quadraticCurveTo(e1[0] + dx / dl * w1 * 1.4, e1[1] + dy / dl * w1 * 1.4, e1[0] - nx * w1, e1[1] - ny * w1); g.lineTo(e0[0] - nx * w0, e0[1] - ny * w0); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(s0[0], s0[1], 0.55 * s0[2] * Math.max(0.35, 1 - R.y * 0.2), 0.14 * s0[2] * Math.max(0.35, 1 - R.y * 0.2), 0, 0, 7); g.fill();
    if (R.shield > 0) { g.strokeStyle = 'rgba(80,200,255,' + (0.5 + Math.sin(R.t * 8) * 0.3) + ')'; g.lineWidth = 4; g.beginPath(); g.ellipse(p[0], p[1] - 65 * sc, 55 * sc, 75 * sc, 0, 0, 7); g.stroke(); }
    if (R.pw.ph > 0) { g.strokeStyle = 'rgba(162,74,255,.7)'; g.lineWidth = 3; g.setLineDash([6, 6]); g.lineDashOffset = -R.t * 40; g.beginPath(); g.ellipse(p[0], p[1] - 65 * sc, 52 * sc, 72 * sc, 0, 0, 7); g.stroke(); g.setLineDash([]); }
    g.save(); g.translate(p[0], p[1]);
    if (R.ph === 'dead') { const k = R.dead < 1.55 ? Math.min(0.25, R.dead * 0.6) : Math.min(1.45, 0.25 + (R.dead - 1.55) * 4); g.rotate(k * (R.killer && R.killer.side > 0 ? -1 : 1)); }
    else g.rotate(R.tilt * 0.16 * Math.min(1, Math.abs(LX[R.lane] - R.x)));
    const sq = R.sq; g.scale(sc * (1 + sq * 0.6), sc * (1 - sq));
    if (R.pw.ph > 0 || (R.inv > 0 && Math.floor(R.t * 14) % 2)) g.globalAlpha = 0.55;
    const onB = R.board > 0 && !(R.pw.jet > 0) && R.ph !== 'dead';
    if (onB) { const hv = 13 + Math.sin(R.t * 5) * 3; g.save(); g.translate(0, -hv); drawBoard(g, S.bsel, R.t, R.y < 0.1 ? hv : 0); }
    drawChar(g, S.sel.c, { col: S.sel.col, hat: S.sel.h, t: R.ph === 'play' ? R.gt : R.t, front: false, air: R.y > 0.05, slide: R.slide > 0 && R.y < 0.3, run: R.ph === 'play' || R.ph === 'count', board: onB ? S.bsel : null });
    if (onB) g.restore();
    g.globalAlpha = 1;
    if (R.pw.jet > 0) { g.font = '46px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.save(); g.translate(0, -60); g.rotate(Math.PI * 0.25); g.fillText('🚀', 0, 0); g.restore(); }
    g.restore();
    if (R.pw.jump > 0 && R.y > 0.2) { g.font = '18px system-ui'; g.textAlign = 'center'; g.fillText('✨', s0[0] + Math.sin(R.t * 20) * 14, s0[1] - 6); }
  }
  /* الشبح 👻: جسم أبيض مخيف بعيون سودة وفم مفتوح، ماسك سكين */
  function drawGhost(g, x, y, s, a, knifeA, mouth) {
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a;
    const gl = g.createRadialGradient(0, -10, 10, 0, -10, 90); gl.addColorStop(0, 'rgba(180,255,230,.35)'); gl.addColorStop(1, 'rgba(120,255,200,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, -10, 90, 0, 7); g.fill();
    const w = Math.sin(R.t * 9) * 5;
    g.fillStyle = 'rgba(240,248,255,.93)'; g.strokeStyle = 'rgba(60,70,100,.6)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(-42, 10); g.bezierCurveTo(-46, -80, 46, -80, 42, 10);
    for (let i = 0; i <= 6; i++) { const xx = 42 - i * 14, yy = 40 + (i % 2 ? -10 : 8) + (i % 2 ? w : -w); g.quadraticCurveTo(xx + 7, yy + 8, xx - 7, yy); }
    g.closePath(); g.fill(); g.stroke();
    // العيون والفم
    g.fillStyle = '#0a0612'; [-15, 15].forEach(ex => { g.beginPath(); g.ellipse(ex, -32, 9, 13, ex < 0 ? 0.25 : -0.25, 0, 7); g.fill(); });
    g.fillStyle = 'rgba(255,40,60,.95)'; [-15, 15].forEach(ex => { g.beginPath(); g.arc(ex, -29, 2.6 + Math.sin(R.t * 12) * 0.6, 0, 7); g.fill(); });
    g.fillStyle = '#0a0612'; g.beginPath(); g.ellipse(0, -2, 10, 6 + mouth * 12, 0, 0, 7); g.fill();
    // الإيد والسكين 🔪
    g.save(); g.translate(40, -12); g.rotate(knifeA);
    g.fillStyle = 'rgba(240,248,255,.93)'; g.beginPath(); g.ellipse(0, 0, 11, 9, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#5a3218'; g.strokeStyle = '#2a1408'; rr(g, -4, -28, 8, 22, 3); g.fill(); g.stroke(); g.fillStyle = '#8a8f9a'; g.fillRect(-9, -31, 18, 4);
    const bl = g.createLinearGradient(-6, 0, 6, 0); bl.addColorStop(0, '#e6ebf2'); bl.addColorStop(0.5, '#ffffff'); bl.addColorStop(1, '#9aa3b0'); g.fillStyle = bl; g.strokeStyle = '#5a6270';
    g.beginPath(); g.moveTo(-6, -31); g.lineTo(6, -31); g.lineTo(5, -78); g.lineTo(0, -92); g.lineTo(-6, -74); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,' + (0.5 + Math.sin(R.t * 10) * 0.5) + ')'; g.beginPath(); g.arc(1, -80, 2.5, 0, 7); g.fill();
    g.restore(); g.restore();
  }
  function drawKill(g, W, H) {
    const t = R.dead, p = P(R.x, R.y, 0), sc = p[2] / 130 * 1.1, side = R.killer ? R.killer.side : 1;
    // الدنيا تظلم
    const dk = Math.min(0.72, t * 0.55); const vg = g.createRadialGradient(p[0], p[1] - 70 * sc, 40, p[0], p[1] - 70 * sc, Math.max(W, H)); vg.addColorStop(0, 'rgba(10,0,20,' + dk * 0.35 + ')'); vg.addColorStop(1, 'rgba(5,0,10,' + Math.min(0.95, dk * 1.25) + ')'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (t < 0.35) return;
    // الشبح يطير من ورا الشاشة ويوصل يم اللاعب
    const k = Math.min(1, (t - 0.35) / 0.9), e = 1 - Math.pow(1 - k, 3);
    const sx = side > 0 ? W + 120 : -120, tx = p[0] + side * 95 * sc * 1.2, ty = p[1] - 150 * sc;
    const gx = sx + (tx - sx) * e + Math.sin(t * 5) * 6 * (1 - k), gy = H * 0.15 + (ty - H * 0.15) * e + Math.sin(t * 4) * 8;
    let ka = side > 0 ? -0.2 : 0.2, mouth = 0.2 + Math.abs(Math.sin(t * 6)) * 0.3;
    if (t > 1.25 && t < 1.55) { ka = side > 0 ? 0.9 : -0.9; mouth = 0.9; }        // يرفع السكين
    else if (t >= 1.55) { ka = side > 0 ? -1.9 : 1.9; mouth = 1; }               // يطعن
    g.save(); if (side < 0) { g.translate(gx, 0); g.scale(-1, 1); g.translate(-gx, 0); }
    drawGhost(g, gx, gy + (t >= 1.55 && t < 1.75 ? 10 : 0), sc * 1.5, Math.min(1, (t - 0.35) * 3), side < 0 ? -ka : ka, mouth); g.restore();
    // ضربة السكين: خط أبيض/أحمر يلمع
    if (t >= 1.5 && t < 2.1) { const f = (t - 1.5) / 0.6; g.save(); g.globalAlpha = 1 - f; g.strokeStyle = '#fff'; g.lineWidth = 10 * (1 - f) + 2; g.shadowColor = '#ff2040'; g.shadowBlur = 25; g.beginPath(); const cx = p[0], cy = p[1] - 80 * sc; g.moveTo(cx + side * 90 * sc, cy - 90 * sc); g.quadraticCurveTo(cx, cy - 10 * sc, cx - side * 80 * sc, cy + 70 * sc); g.stroke(); g.restore();
      g.fillStyle = 'rgba(200,0,30,' + (0.45 * (1 - f)) + ')'; g.fillRect(0, 0, W, H); }
    if (t > 1.9) { g.save(); g.globalAlpha = Math.min(1, (t - 1.9) * 2); g.font = '900 ' + Math.round(Math.min(W, 520) * 0.085) + 'px Cairo, system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff2a44'; g.strokeStyle = '#000'; g.lineWidth = 7; const yy = H * 0.2 + Math.sin(t * 20) * 2; g.strokeText('👻 الشبح لزمك!', W / 2, yy); g.fillText('👻 الشبح لزمك!', W / 2, yy); g.restore(); }
  }
  function draw() {
    const cv = R.cv, g = cv.getContext('2d'), W = R.W, H = R.H;
    g.save(); if (R.shake > 0) g.translate(rnd(-8, 8) * R.shake, rnd(-6, 6) * R.shake);
    drawWorld(g);
    const items = [];
    R.obs.forEach(o => items.push([o.k === 'train' ? Math.max(o.z, NEAR) + (o.z + o.len < 0.5 ? -100 : 0) : o.z, 0, o]));
    R.coinsA.forEach(c => { if (c.z > NEAR && c.z < FAR) items.push([c.z, 1, c]); });
    R.pws.forEach(p => { if (p.z > NEAR && p.z < FAR) items.push([p.z, 2, p]); });
    items.push([0.05, 3, null]);
    // القطارات اللي صارت يم اللاعب ترسم حسب نهايتها
    items.forEach(it => { const o = it[2]; if (it[1] === 0 && o.k === 'train' && o.z < 0.5) it[0] = o.z + o.len > 0.5 ? (Math.abs(LX[o.l] - R.x) < 0.9 && R.y < 2.5 ? -10 : 0.6) : -10; });
    drawShadows(g);
    items.sort((a, b) => b[0] - a[0]).forEach(it => { if (it[1] === 0) drawObs(g, it[2]); else if (it[1] === 1) drawCoin(g, it[2]); else if (it[1] === 2) drawPw(g, it[2]); else drawPlayer(g); });
    R.fx.forEach(f => { const p = P(f.x, f.y, Math.max(-3, f.z)); g.globalAlpha = Math.min(1, f.t * 2); g.textAlign = 'center'; g.textBaseline = 'middle'; if (f.txt) { g.font = 'bold 20px Cairo, system-ui'; g.fillStyle = '#ffd23a'; g.strokeStyle = '#3a2200'; g.lineWidth = 3; g.strokeText(f.txt, p[0], p[1]); g.fillText(f.txt, p[0], p[1]); } else { g.font = (f.sm ? 14 : 22) + 'px system-ui'; g.fillText(f.e, p[0], p[1]); } g.globalAlpha = 1; });
    // الشبح يلاحقك بعد ما تتعثر
    // الشبح يجي يحذّرك ثواني ويطير يروح (ما يبقى يلاحقك ويخوّفك)
    if (R.ph === 'play' && R.ghT > 0) { const p = P(R.x, 0, 0), el = GH_T - R.ghT, out = Math.max(0, 0.9 - R.ghT) / 0.9, a = Math.min(1, el * 3) * (1 - out) * 0.85, s = p[2] / 130 * 0.9, gx = p[0] - 70 * s + Math.sin(R.t * 3) * 14 * s - out * 120 * s, gy = R.H - 10 - Math.abs(Math.sin(R.t * 4)) * 10 - out * R.H * 0.35;
      drawGhost(g, gx, gy, s, a, -0.3, 0.3 + Math.abs(Math.sin(R.t * 5)) * 0.4);
      if (out < 0.6) { let bx = gx + 60 * s; const by = gy - 100 * s; g.save(); g.globalAlpha = a; g.font = '900 ' + Math.round(15 + 4 * s) + 'px Cairo, system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; const tx = 'انتبه! مرة ثانية أمسكك 👻', tw = g.measureText(tx).width + 22; bx = Math.max(tw / 2 + 8, Math.min(R.W - tw / 2 - 8, bx)); g.fillStyle = 'rgba(255,255,255,.95)'; rr(g, bx - tw / 2, by - 17, tw, 34, 14); g.fill(); g.beginPath(); g.moveTo(bx - 8, by + 16); g.lineTo(bx - 18, by + 30); g.lineTo(bx + 4, by + 16); g.fill(); g.fillStyle = '#c0182e'; g.fillText(tx, bx, by + 1); g.restore(); } }
    g.restore();
    // خطوط السرعة: كل ما تسرع أكثر تبين أوضح (والزلاجة تزيدها)
    { const k = Math.min(1, Math.max(0, (R.sp - 16) / 12)) + (R.board > 0 ? 0.35 : 0) + (R.pw.jet > 0 ? 0.5 : 0);
      if (k > 0 && R.ph === 'play' && !R.pause) { const cx = W / 2, cy = HOR + H * 0.08, r0 = Math.max(W, H) * 0.42, fr = Math.floor(R.t * 24); g.strokeStyle = 'rgba(255,255,255,' + Math.min(0.32, 0.2 * k) + ')'; g.lineWidth = 2; g.beginPath();
        for (let i = 0; i < 14; i++) { const a = (i * 2.39996 + fr * 0.91) % 6.283, r = r0 + ((i * 53 + fr * 17) % 90), l = 40 + k * 50; g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * (r + l), cy + Math.sin(a) * (r + l)); } g.stroke(); } }
    { const vg = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.45, W / 2, H * 0.55, Math.max(W, H) * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,10,.32)'); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
    if (R.flash > 0) { g.fillStyle = 'rgba(120,220,255,' + R.flash + ')'; g.fillRect(0, 0, W, H); }
    if (R.pw.slow > 0) { g.fillStyle = 'rgba(80,140,255,.12)'; g.fillRect(0, 0, W, H); }
    if (R.ph === 'dead' || (R.ph === 'over' && R.killer)) { if (R.ph === 'over') R.dead = Math.max(R.dead, GHOST_D); drawKill(g, W, H); }
    if (R.pause && R.resumeAt) { const el = performance.now() - R.resumeAt, n = 3 - Math.floor(el / 667); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, H); g.font = '900 96px Cairo, system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.strokeStyle = '#ff8a2a'; g.lineWidth = 8; const tx = n > 0 ? String(n) : 'يلا!'; g.save(); g.translate(W / 2, H * 0.42); const k = 1 + (el % 667) / 667 * 0.3; g.scale(k, k); g.strokeText(tx, 0, 0); g.fillText(tx, 0, 0); g.restore(); }
    if (R.ph === 'count') { const n = 3 - Math.floor((performance.now() - R.cnt) / 667); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, H); g.font = '900 96px Cairo, system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.strokeStyle = '#a24aff'; g.lineWidth = 8; const tx = n > 0 ? String(n) : 'يلا!'; const sc = 1 + ((performance.now() - R.cnt) % 667) / 667 * 0.3; g.save(); g.translate(W / 2, H * 0.42); g.scale(sc, sc); g.strokeText(tx, 0, 0); g.fillText(tx, 0, 0); g.restore(); }
    if (R.zoneT > 0) { g.globalAlpha = Math.min(1, R.zoneT); g.font = '900 30px Cairo, system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 6; g.strokeText(THEMES[R.zone].n, W / 2, H * 0.22); g.fillText(THEMES[R.zone].n, W / 2, H * 0.22); g.globalAlpha = 1; }
  }

  /* ===================== رسوميات RTX ✨ — شيدر بعد المعالجة (WebGL) =====================
     ياخذ صورة اللعبة كل فريم ويضيفلها: توهّج (Bloom) للأضوية، أشعة شمس حجمية (God rays)، ضباب جوّي حسب البعد،
     حدّة HD، تدرّج ألوان سينمائي، انحراف لوني خفيف بالأطراف، فينييت وحبيبات فلم. ينزل جودته وحده إذا الجهاز ضعيف. */
  const FX = { on: 1, gl: null, prog: null, tex: null, u: {}, q: 1, dead: 0, fps: 60, lowT: 0, note: 0 };
  const FX_VS = 'attribute vec2 a;varying vec2 v;void main(){v=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}';
  const FX_FS = [
    'precision mediump float;uniform sampler2D T;uniform vec2 RS,SUN;uniform float TM,HZ,BL,RAY,SP;uniform vec3 FOG,TINT;varying vec2 v;',
    'vec3 tx(vec2 p){return texture2D(T,clamp(p,vec2(.001),vec2(.999))).rgb;}',
    'float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}',
    'float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
    'void main(){vec2 px=1./RS,uv=v,cc=uv-.5;float r2=dot(cc,cc);',
    // انحراف لوني بالأطراف
    'float ca=r2*(.006+SP*.004);vec3 c=vec3(tx(uv+cc*ca).r,tx(uv).g,tx(uv-cc*ca).b);',
    // حدة HD
    'vec3 n=tx(uv+vec2(px.x,0.))+tx(uv-vec2(px.x,0.))+tx(uv+vec2(0.,px.y))+tx(uv-vec2(0.,px.y));c+=(c-n*.25)*.55;',
    // بلوم
    'vec3 bl=vec3(0.);float tw=0.;for(int i=0;i<10;i++){float fi=float(i),an=fi*2.39996,rd=1.5+fi*1.15;vec2 o=vec2(cos(an),sin(an))*rd*px*2.;vec3 s=tx(uv+o);float w=1./(1.+fi*.3);float b=max(lum(s)-.74,0.);bl+=s*b*w;tw+=w;}c+=bl/tw*BL*2.4;',
    // أشعة الشمس الحجمية (بس من السما)
    'if(RAY>0.){vec2 d=(uv-SUN)/14.;vec2 p=uv;float dc=1.;vec3 gr=vec3(0.);for(int i=0;i<14;i++){p-=d;if(p.y<HZ){vec3 s=tx(p);float sd=length((p-SUN)*vec2(RS.x/RS.y,1.));gr+=s*max(lum(s)-.78,0.)*dc*exp(-sd*9.);}dc*=.9;}float fall=exp(-length((uv-SUN)*vec2(RS.x/RS.y,1.))*1.6);c+=gr*RAY*1.6*(.25+fall);}',
    // ضباب جوّي: الأرض البعيدة (يم الأفق) تذوب بلون السما
    'float fg=(uv.y>HZ?exp(-(uv.y-HZ)*10.):exp(-(HZ-uv.y)*16.))*.22;c=mix(c,FOG,fg);',
    // تدرّج سينمائي: كونتراست ناعم + تشبّع + لون الجو
    'c=max(c,0.);c=mix(c,c*c*(3.-2.*min(c,1.)),.32);float L=lum(c);c=mix(vec3(L),c,1.22)*TINT;',
    'c=c/(1.+max(L-1.,0.)*.6);',
    // فينييت + حبيبات
    'c*=1.-r2*.5;c+=(hs(uv*RS+TM)-.5)*.022;gl_FragColor=vec4(clamp(c,0.,1.),1.);}'].join('');
  function fxInit(cv) {
    try {
      const gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' }) || cv.getContext('experimental-webgl');
      if (!gl) return false;
      const sh = (tp, src) => { const s = gl.createShader(tp); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, FX_VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FX_FS)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      gl.useProgram(p); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const al = gl.getAttribLocation(p, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const u = {}; ['T', 'RS', 'SUN', 'TM', 'HZ', 'BL', 'RAY', 'SP', 'FOG', 'TINT'].forEach(n => u[n] = gl.getUniformLocation(p, n)); gl.uniform1i(u.T, 0);
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); FX.gl = null; cv.style.display = 'none'; }, false);
      cv.addEventListener('webglcontextrestored', () => { FX.gl = null; }, false);
      FX.gl = gl; FX.prog = p; FX.tex = tex; FX.u = u; return true;
    } catch (e) { console.warn('runfx', e); return false; }
  }
  const rgb3 = h => { h = hx(h); const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
  function fxRender(dt) {
    const cv = $r('runGl'); if (!cv) return;
    if (!FX.on || FX.dead || !R.cv || !R.cv.width) { if (cv.style.display !== 'none') cv.style.display = 'none'; return; }
    if (!FX.gl && !fxInit(cv)) { FX.dead = 1; cv.style.display = 'none'; return; }
    // جهاز ضعيف؟ ننزل الدقة شوية شوية، وإذا بقى ثقيل نطفي التأثيرات حتى اللعب يبقى سلس
    if (R.ph === 'play' && !R.pause && dt > 0) { FX.fps = FX.fps * 0.94 + (1 / dt) * 0.06; if (FX.fps < 42) FX.lowT += dt; else FX.lowT = Math.max(0, FX.lowT - dt * 0.5);
      if (FX.lowT > 2.5) { FX.lowT = 0; FX.fps = 60; if (FX.q > 0.62) FX.q = FX.q > 0.8 ? 0.75 : 0.6; } }
    const gl = FX.gl, src = R.cv, w = Math.max(2, Math.round(src.width * FX.q)), h = Math.max(2, Math.round(src.height * FX.q));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    if (cv.style.display === 'none') cv.style.display = '';
    gl.viewport(0, 0, w, h); gl.bindTexture(gl.TEXTURE_2D, FX.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    const T = THEMES[R.zone] || THEMES[0], Hh = R.H || 1, u = FX.u; let sx = 0.84, sy = HOR * 0.35 / Hh, ray = 0.8, bl = 1, tint = [1.03, 1, 0.96];
    if (T.stars) { sx = 0.78; ray = 0.25; bl = 1.7; tint = [0.92, 0.97, 1.1]; } else if (R.zone === 5 || T.k === 'desert') { sx = T.k === 'desert' ? 0.72 : 0.3; sy = HOR * (T.k === 'desert' ? 0.38 : 0.86) / Hh; ray = 1.2; tint = T.k === 'desert' ? [1.07, 1, 0.9] : [1.08, 0.98, 0.94]; }
    if (T.snow) { bl = 0.45; ray = 0.5; tint = [0.97, 1, 1.05]; }
    gl.uniform2f(u.RS, w, h); gl.uniform2f(u.SUN, sx, sy); gl.uniform1f(u.TM, (R.t % 100)); gl.uniform1f(u.HZ, HOR / Hh); gl.uniform1f(u.BL, bl); gl.uniform1f(u.RAY, ray);
    gl.uniform1f(u.SP, Math.min(1, Math.max(0, (R.sp - 13) / 15)) + (R.pw && R.pw.jet > 0 ? 0.6 : 0)); const fc = rgb3(T.sky[1]); gl.uniform3f(u.FOG, fc[0], fc[1], fc[2]); gl.uniform3f(u.TINT, tint[0], tint[1], tint[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function fxBtn() { const b = $r('runFxB'); if (b) { b.textContent = FX.on ? '✨ RTX شغّال' : '✨ RTX طافي'; b.classList.toggle('off', !FX.on); } if (!FX.on) { const c = $r('runGl'); if (c) c.style.display = 'none'; } }

  /* ---------- الحلقة ---------- */
  function loop(ts) {
    R.raf = 0; if (window.curPage !== 'run') { musTick(); humTick(); return; }
    const cv = R.cv; if (!cv) return; const W = cv.clientWidth, H = cv.clientHeight, dpr = window.fxDpr ? fxDpr(2) : Math.min(2, window.devicePixelRatio || 1);
    if (W && H && (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr))) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    R.W = W; R.H = H; const dt = Math.min(0.05, Math.max(0, (ts - (R.last || ts)) / 1000)); R.last = ts;
    if (document.hidden && R.ph === 'play' && !R.pause) togglePause();
    try { update(dt); const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); draw(); try { fxRender(dt); } catch (e) { FX.dead = 1; console.warn(e); } hud(); musTick(); humTick(); } catch (e) { console.error(e); }
    R.raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!R.raf) { R.last = 0; R.raf = requestAnimationFrame(loop); } };

  /* ---------- الواجهة ---------- */
  let toastT = 0;
  function showToastR(t) { const e = $r('runToast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 1500); }
  function hud() {
    const h = $r('runHud'); if (!h) return; h.hidden = !(R.ph === 'play' || R.ph === 'count' || R.ph === 'dead');
    $r('runSc').textContent = R.score.toLocaleString('en'); $r('runCo').textContent = R.coins; $r('runM').textContent = Math.floor(R.dist) + 'م';
    const pw = $r('runPw'); let s = ''; for (const k in R.pw) if (R.pw[k] > 0) s += '<span><i>' + PW[k].e + '</i><b style="width:' + Math.max(0, R.pw[k] / PW[k].d * 100) + '%"></b></span>'; if (R.shield > 0) s += '<span><i>🛡️</i></span>'; if (R.board > 0) s += '<span><i>🛹</i><b style="width:' + Math.max(0, R.board / BD_T * 100) + '%;background:#22d3ee"></b></span>'; if (pw.dataset.s !== s) { pw.innerHTML = s; pw.dataset.s = s; }
    $r('runPause').hidden = R.ph !== 'play' || R.pause;
    const bd = $r('runBd'); if (bd) { bd.hidden = R.ph !== 'play' || R.pause; const n = isAdm() ? '♾️' : String(S.boards), lb = R.board > 0 ? Math.ceil(R.board) + 'ث' : n; if (bd.dataset.l !== lb) { bd.dataset.l = lb; $r('runBdN').textContent = lb; } bd.classList.toggle('on', R.board > 0); bd.classList.toggle('no', !(R.board > 0) && BDN() < 1); }
  }
  function hideOv() { ['runMenu', 'runOver', 'runPick', 'runPauseOv'].forEach(i => { const e = $r(i); if (e) e.classList.remove('on'); }); }
  /* توقيف مؤقت: يوقف كلشي. وعند الرجوع عد 3-2-1 حتى اللاعب يتجهز وما يصطدم فجأة */
  function togglePause() {
    if (R.ph !== 'play') return;
    if (!R.pause) { R.pause = true; R.resumeAt = 0; const i = $r('runPzInfo'); if (i) i.innerHTML = '⭐ ' + R.score.toLocaleString('en') + ' &nbsp;•&nbsp; 🪙 ' + R.coins + ' &nbsp;•&nbsp; 📏 ' + Math.floor(R.dist) + 'م'; $r('runPauseOv').classList.add('on'); sfx('click'); return; }
    if (R.resumeAt) return; $r('runPauseOv').classList.remove('on'); R.resumeAt = performance.now(); sfx('go');
  }
  function prev(cv, id, o, big) {
    const g = cv.getContext('2d'), dpr = 2; cv.width = cv.clientWidth * dpr || 160; cv.height = cv.clientHeight * dpr || 160;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); const s = cv.height / (big ? 175 : 165); g.translate(cv.width / 2, cv.height * 0.93); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 2, 30, 7, 0, 0, 7); g.fill();
    if (o.board != null) { const hv = 14 + Math.sin(o.t * 5) * 3; g.translate(0, -hv); drawBoard(g, o.board, o.t, hv); } drawChar(g, id, o);
  }
  let pvT = 0, pickTab = 'c';
  function animPreviews() {
    pvT += 0.016; const on = window.curPage === 'run' && (R.ph === 'menu' || R.ph === 'over' || $r('runPick').classList.contains('on'));
    if (on) { const big = $r('runBig'); if (big && big.offsetParent) prev(big, S.sel.c, pickTab === 'b' ? { col: S.sel.col, hat: S.sel.h, t: pvT, front: false, run: true, board: S.bsel } : { col: S.sel.col, hat: S.sel.h, t: pvT, front: Math.floor(pvT / 3.5) % 4 !== 3, run: true }, true); document.querySelectorAll('#runGrid canvas[data-i]').forEach(c => { const i = +c.dataset.i; if (pickTab === 'b') { prev(c, S.sel.c, { col: S.sel.col, hat: S.sel.h, t: pvT + i * 0.3, front: false, run: true, board: i }); return; } prev(c, pickTab === 'c' ? i : S.sel.c, { col: pickTab === 'col' ? i : S.sel.col, hat: pickTab === 'h' ? i : S.sel.h, t: pvT + i * 0.3, front: true, run: pickTab === 'c' ? (+c.dataset.i === S.sel.c) : true }); }); const mb = $r('runMenuChar'); if (mb && mb.offsetParent) prev(mb, S.sel.c, { col: S.sel.col, hat: S.sel.h, t: pvT, front: true, run: true }, true); }
    setTimeout(() => requestAnimationFrame(animPreviews), on ? 30 : 400);
  }
  function renderPick() {
    const G = $r('runGrid'); G.innerHTML = ''; $r('runBank').textContent = '🪙 ' + CT();
    document.querySelectorAll('#runTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === pickTab));
    const list = pickTab === 'c' ? CH : pickTab === 'h' ? HATS : pickTab === 'b' ? BOARDS : COLS;
    list.forEach((it, i) => {
      const own = pickTab === 'c' ? ownC(i) : pickTab === 'h' ? ownH(i) : pickTab === 'b' ? ownB(i) : true, sel = pickTab === 'c' ? S.sel.c === i : pickTab === 'h' ? S.sel.h === i : pickTab === 'b' ? S.bsel === i : S.sel.col === i;
      const b = mk('button', 'runIt' + (sel ? ' on' : '') + (own ? '' : ' lock')); b.type = 'button';
      if (pickTab === 'col') b.style.setProperty('--sw', it);
      const cv = mk('canvas'); cv.dataset.i = i; b.appendChild(cv);
      b.appendChild(mk('b', '', pickTab === 'col' ? '🎨' : it.n));
      if (!own) b.appendChild(mk('small', 'pr', '🔒 ' + it.p + ' 🪙')); else if (sel) b.appendChild(mk('small', 'ok', '✔ مختار'));
      b.onclick = () => {
        if (!own) { if (CN() < it.p) { sfx('click'); showToastR('😅 ينقصك ' + (it.p - S.coins) + ' 🪙 — اركض واجمع أكثر!'); return; } if (!confirm('تشتري «' + it.n + '» بـ ' + it.p + ' عملة ركض؟')) return; spend(it.p); (pickTab === 'c' ? S.own.c : pickTab === 'b' ? S.own.b : S.own.h).push(i); sfx('buy'); showToastR('🎉 صار عندك «' + it.n + '»!'); }
        else sfx('click');
        if (pickTab === 'c') S.sel.c = i; else if (pickTab === 'h') S.sel.h = i; else if (pickTab === 'b') S.bsel = i; else S.sel.col = i; save(); renderPick(); menuInfo();
      };
      G.appendChild(b);
    });
    if (pickTab === 'b') {   // باكيت زلاجات
      const pk = mk('button', 'runIt runPack'); pk.type = 'button'; pk.appendChild(mk('div', 'pkE', '🛹×' + BD_PACK.n)); pk.appendChild(mk('b', '', 'عندك: ' + (isAdm() ? '♾️' : S.boards))); pk.appendChild(mk('small', 'pr', BD_PACK.n + ' زلاجات بـ ' + BD_PACK.p + ' 🪙'));
      pk.onclick = () => { if (isAdm()) { showToastR('♾️ عندك زلاجات بلا حدود'); return; } if (CN() < BD_PACK.p) { sfx('click'); showToastR('😅 ينقصك ' + (BD_PACK.p - S.coins) + ' 🪙'); return; } spend(BD_PACK.p); S.boards += BD_PACK.n; save(); sfx('buy'); showToastR('🎉 +' + BD_PACK.n + ' زلاجات!'); renderPick(); menuInfo(); };
      G.appendChild(pk);
    }
    $r('runPickName').textContent = pickTab === 'b' ? '🛹 زلاجة ' + BOARDS[S.bsel].n : CH[S.sel.c].n + (S.sel.h ? ' ' + HATS[S.sel.h].e : '');
  }
  function menuInfo() { const e = $r('runMenuInfo'); if (e) e.innerHTML = '🏆 أعلى نتيجة: <b>' + S.best.toLocaleString('en') + '</b> &nbsp;•&nbsp; 🪙 عملات الركض: <b>' + CT() + '</b> &nbsp;•&nbsp; 🛹 <b>' + (isAdm() ? '♾️' : S.boards) + '</b>'; const n = $r('runMenuName'); if (n) n.textContent = CH[S.sel.c].n; }
  function showOver() {
    const O = $r('runOver'); O.classList.add('on'); R.ph = 'over';
    $r('runOvB').innerHTML = '<div class="ro1">' + (R.newBest ? '🎉 رقم قياسي جديد!' : '👻 الشبح لزمك!') + '</div><div class="ro2">' + R.score.toLocaleString('en') + '</div><div class="ro3"><span>📏 ' + Math.floor(R.dist) + ' متر</span><span>🪙 +' + R.coins + '</span><span>🏆 ' + S.best.toLocaleString('en') + '</span></div>';
    const rv = $r('runRev'), c = REV(); if (rv) { rv.hidden = R.revived >= 3; rv.innerHTML = '💖 كمّل من وين وكفت <small>' + c + ' 🪙 (عندك ' + CT() + ')</small>'; rv.classList.toggle('no', CN() < c); }
  }
  function build() {
    const B = $r('runBody'); if (!B || B.dataset.ok) return; B.dataset.ok = '1';
    B.innerHTML = `<canvas id="runCv"></canvas><canvas id="runGl" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none"></canvas>
<div id="runHud" hidden><div class="rh1"><span class="rhSc">⭐ <b id="runSc">0</b></span><span class="rhCo">🪙 <b id="runCo">0</b></span><span class="rhM" id="runM">0م</span></div><div id="runPw"></div><button id="runPause" type="button" aria-label="توقيف مؤقت"><i>⏸️</i><small>توقيف</small></button></div>
<button id="runBd" type="button" hidden aria-label="زلاجة"><i>🛹</i><b id="runBdN">3</b><small>زلاجة</small></button>
<div id="runToast"></div>
<div id="runMenu" class="runOv on"><div class="rmBox"><div class="rmTitle"><span class="rmE">🏃‍♂️💨</span><h2>ركض ربش</h2><small>اركض على سكة القطار، تفادى، اقفز، ازحف واجمع العملات!</small></div>
<div class="rmStage"><canvas id="runMenuChar"></canvas><div class="rmName" id="runMenuName"></div></div>
<button id="runGo" class="rmBtn big" type="button">▶ ابدأ الركض</button><button id="runPickBtn" class="rmBtn" type="button">🧍 شخصيتي وشكلها</button>
<div id="runMenuInfo" class="rmInfo"></div><div class="rmTog"><button id="runMusB" type="button"></button><button id="runSfxB" type="button"></button></div>
<div class="rmHow">👆 اسحب ⬅️ ➡️ تبدّل السكة • ⬆️ أو دوسة تقفز • ⬇️ تزحف</div><div class="rmHow">🛹 دوسة دبل أو زر الزلاجة = تطير على زلاجة 30 ثانية وتحميك من ضربة وحدة</div><div class="rmPws">${Object.keys(PW).map(k => '<span>' + PW[k].e + ' ' + PW[k].n + '</span>').join('')}</div><div class="rmHow">🌍 كل 600 متر عالم جديد: مدينة، شاطئ، ثلج، صحراء… وانتبه من الشبح 👻🔪</div></div></div>
<div id="runPick" class="runOv"><div class="rmBox wide"><div class="rpHead"><button id="runPickX" type="button">→ رجوع</button><b>🧍 اختار شخصيتك</b><span id="runBank"></span></div>
<div class="rpStage"><canvas id="runBig"></canvas><div class="rpName" id="runPickName"></div><small>تلف وتبين من الورا مثل ما تشوفها وانت تركض 👀</small></div>
<div id="runTabs"><button data-t="c" type="button">🧍 الشخصيات</button><button data-t="col" type="button">🎨 لون الملابس</button><button data-t="h" type="button">🎩 القبعات</button><button data-t="b" type="button">🛹 الزلاجات</button></div>
<div id="runGrid"></div><button id="runPickGo" class="rmBtn big" type="button">▶ يلا نركض</button></div></div>
<div id="runOver" class="runOv"><div class="rmBox"><div id="runOvB"></div><button id="runRev" class="rmBtn big rev" type="button"></button><button id="runAgain" class="rmBtn big" type="button">🔁 مرة ثانية</button><button id="runOvPick" class="rmBtn" type="button">🧍 غيّر الشخصية</button><button id="runOvMenu" class="rmBtn ghost" type="button">🏠 القائمة</button></div></div>
<div id="runPauseOv" class="runOv"><div class="rmBox"><div class="pzIco">⏸️</div><h2>اللعبة موقّفة</h2><small>خذ راحتك، اللعبة تنتظرك وتكمّل من نفس المكان</small><div id="runPzInfo" class="rmInfo"></div><button id="runResume" class="rmBtn big" type="button">▶ كمّل اللعب</button><div class="rmTog"><button id="runPzMus" type="button"></button><button id="runPzSfx" type="button"></button></div><button id="runPzRe" class="rmBtn" type="button">🔁 ابدأ من جديد</button><button id="runQuit" class="rmBtn ghost" type="button">🏠 اطلع للقائمة</button></div></div>`;
    R.cv = $r('runCv'); bindInput(R.cv);
    const tg = () => { $r('runMusB').textContent = (S.mus ? '🎵' : '🔇') + ' الموسيقى'; $r('runSfxB').textContent = (S.sfx ? '🔊' : '🔈') + ' الأصوات'; $r('runMusB').classList.toggle('off', !S.mus); $r('runSfxB').classList.toggle('off', !S.sfx); };
    const tg2 = () => { tg(); const a = $r('runPzMus'), b = $r('runPzSfx'); a.textContent = (S.mus ? '🎵' : '🔇') + ' الموسيقى'; b.textContent = (S.sfx ? '🔊' : '🔈') + ' الأصوات'; a.classList.toggle('off', !S.mus); b.classList.toggle('off', !S.sfx); };
    $r('runMusB').onclick = $r('runPzMus').onclick = () => { S.mus = S.mus ? 0 : 1; save(); tg2(); sfx('click'); }; $r('runSfxB').onclick = $r('runPzSfx').onclick = () => { S.sfx = S.sfx ? 0 : 1; save(); tg2(); sfx('click'); }; tg2();
    $r('runPzRe').onclick = () => { if (R.coins > R.banked) { S.coins += R.coins - R.banked; R.banked = R.coins; } S.best = Math.max(S.best, R.score); save(); start(); };
    const openPick = () => { sfx('click'); hideOv(); $r('runPick').classList.add('on'); renderPick(); };
    $r('runRev').onclick = revive; $r('runGo').onclick = start; $r('runAgain').onclick = start; $r('runPickGo').onclick = start;
    $r('runPickBtn').onclick = openPick; $r('runOvPick').onclick = openPick;
    $r('runPickX').onclick = () => { sfx('click'); hideOv(); R.ph = 'menu'; $r('runMenu').classList.add('on'); menuInfo(); };
    const toMenu = () => { sfx('click'); hideOv(); R.ph = 'menu'; reset(); $r('runMenu').classList.add('on'); menuInfo(); };
    $r('runOvMenu').onclick = toMenu; $r('runQuit').onclick = toMenu;
    $r('runPause').onclick = togglePause; $r('runBd').onclick = useBoard; $r('runResume').onclick = togglePause;
    document.querySelectorAll('#runTabs button').forEach(b => b.onclick = () => { pickTab = b.dataset.t; sfx('click'); renderPick(); });
    reset(); animPreviews();
  }
  try { if (/rdbg/.test(location.search)) window.__runR = { R, die, act }; } catch (e) {}
  window.runOpen = function () {
    build(); if (R.ph === 'play') { R.pause = true; $r('runPauseOv').classList.add('on'); }
    if (R.ph === 'menu') { $r('runMenu').classList.add('on'); }
    menuInfo(); kick();
  };
})();
