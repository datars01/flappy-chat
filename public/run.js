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
  const PW = { mag: { e: '🧲', n: 'مغناطيس', d: 9 }, jump: { e: '👟', n: 'قفزة خارقة', d: 9 }, x2: { e: '✖️2', n: 'عملات دبل', d: 11 }, sh: { e: '🛡️', n: 'درع', d: 0 } };
  const THEMES = [
    { n: '☀️ الصبح', sky: ['#7ec8ff', '#d8f0ff'], gr: '#7a8a6a', bed: '#8a7a6a', tie: '#6a4a32', b: ['#f0b860', '#e87a6a', '#7ab8e8', '#b48ae8', '#f0d890'], win: '#cfe8ff', lit: 0 },
    { n: '🌇 الغروب', sky: ['#ff7a5a', '#ffd08a'], gr: '#7a5a5a', bed: '#7a6050', tie: '#5a3a2a', b: ['#c8607a', '#a8508a', '#e8906a', '#7a508a', '#d8a06a'], win: '#ffe0a0', lit: 0.4 },
    { n: '🌙 الليل', sky: ['#0a0f2e', '#2a2a6a'], gr: '#2a3040', bed: '#3a3a48', tie: '#2a2028', b: ['#2a3a5a', '#3a2a5a', '#203a4a', '#4a3060', '#2a2a40'], win: '#ffe27a', lit: 1 },
    { n: '❄️ الثلج', sky: ['#a8c8e8', '#f0f6ff'], gr: '#e8f0f8', bed: '#b8c0cc', tie: '#7a6a62', b: ['#e8eef8', '#c8d8f0', '#f0d8e0', '#d0e0f0', '#e0e8f0'], win: '#7ab0e0', lit: 0.2 }];

  /* ---------- الحفظ ---------- */
  let S = { coins: 0, best: 0, runs: 0, own: { c: [0, 1, 2], h: [0] }, sel: { c: 0, col: 0, h: 0 }, mus: 1, sfx: 1 };
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o) S = Object.assign(S, o); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const isAdm = () => { try { return !!(typeof auth !== 'undefined' && auth && (auth.admin || auth.name === 'بابي' || auth.name === 'بابيتو')); } catch (e) { return false; } };
  const ownC = i => isAdm() || CH[i].p === 0 || S.own.c.includes(i);
  const ownH = i => isAdm() || HATS[i].p === 0 || S.own.h.includes(i);

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
    } catch (e) {}
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
  function drawChar(g, id, o) {
    const C = CH[id] || CH[0], col = COLS[o.col] || COLS[0], front = !!o.front, t = o.t || 0, run = o.run !== false;
    const sw = run ? Math.sin(t * 11) : 0, air = o.air, sl = o.slide;
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = 2.5; g.strokeStyle = '#1e1428';
    if (sl) { g.translate(0, 0); g.scale(1.08, 0.55); }
    else if (run && !air) g.translate(0, -Math.abs(Math.cos(t * 11)) * 4);
    const legC = C.k === 'robot' ? '#8a96a8' : C.k === 'knight' ? '#9aa2b0' : C.k === 'dino' ? C.hair : '#2c3a5a';
    // الرجلين
    [-1, 1].forEach(s => { const up = air ? (s > 0 ? 12 : 4) : Math.max(0, sw * s) * 11, a = air ? 0.25 * s : sw * 0.12 * s; g.save(); g.translate(s * 8, -44); g.rotate(a); g.scale(1, (34 - up) / 34); g.fillStyle = legC; rr(g, -6, 0, 12, 34, 5); g.fill(); g.stroke(); g.fillStyle = s > 0 ? '#ffffff' : '#ffffff'; rr(g, -8, 30, 16, 10, 5); g.fill(); g.stroke(); g.fillStyle = col; g.fillRect(-7, 36, 14, 3); g.restore(); });
    // الذيل (دينو وبسبوس) من ورا
    if (C.k === 'dino' || C.k === 'cat') { g.save(); g.fillStyle = C.k === 'dino' ? C.hair : col; g.beginPath(); const tw = Math.sin(t * 6) * 6; if (!front) { g.moveTo(-6, -48); g.quadraticCurveTo(tw, -20, 18 + tw, -16); g.quadraticCurveTo(6, -30, 6, -48); } else { g.moveTo(14, -50); g.quadraticCurveTo(30 + tw, -40, 26 + tw, -62); g.quadraticCurveTo(24, -46, 12, -44); } g.closePath(); g.fill(); g.stroke(); g.restore(); }
    // شنطة رائد الفضاء
    if (C.k === 'astro' && !front) { g.fillStyle = '#dfe6f0'; rr(g, -18, -84, 36, 34, 8); g.fill(); g.stroke(); g.fillStyle = '#ff4a5a'; g.fillRect(-4, -78, 8, 8); }
    // الجسم
    const body = C.k === 'robot' ? '#9aa8bc' : C.k === 'knight' ? '#c9ced8' : C.k === 'astro' ? '#eef2f8' : C.k === 'dino' ? C.hair : col;
    g.fillStyle = body; rr(g, -18, -84, 36, 44, 12); g.fill(); g.stroke();
    if (C.k === 'astro' || C.k === 'knight' || C.k === 'robot' || C.k === 'dino') { g.fillStyle = col; g.fillRect(-17, -56, 34, 6); }
    if (front) { g.fillStyle = 'rgba(255,255,255,.25)'; rr(g, -12, -80, 10, 16, 5); g.fill(); if (C.k === 'robot') { g.fillStyle = '#22d3ee'; g.beginPath(); g.arc(0, -70, 5, 0, 7); g.fill(); } if (C.k === 'boy' || C.k === 'girl' || C.k === 'cat') { g.fillStyle = 'rgba(255,255,255,.85)'; g.font = 'bold 13px system-ui'; g.textAlign = 'center'; g.fillText(C.k === 'cat' ? '🐾' : '★', 0, -63); } }
    else if (C.k === 'dino') { g.fillStyle = '#ffd23a'; [-74, -64, -54].forEach(y => { g.beginPath(); g.moveTo(-5, y); g.lineTo(0, y - 9); g.lineTo(5, y); g.closePath(); g.fill(); g.stroke(); }); }
    // الإيدين
    [-1, 1].forEach(s => { const a = air ? -s * 2.5 : -s * (0.32 + Math.max(0, -sw * s) * 0.35), ln = air ? 1 : 1 - Math.max(0, sw * s) * 0.3; g.save(); g.translate(s * 19, -80); g.rotate(a); g.scale(1, ln); g.fillStyle = body; rr(g, -5, 0, 10, 28, 5); g.fill(); g.stroke(); g.fillStyle = C.k === 'robot' || C.k === 'knight' ? '#7a8496' : C.k === 'astro' ? '#dfe6f0' : C.skin; g.beginPath(); g.arc(0, 30, 6, 0, 7); g.fill(); g.stroke(); g.restore(); });
    // الراس
    g.save(); g.translate(0, -104); const hb = run ? Math.sin(t * 11) * 0.05 : 0; g.rotate(hb);
    if (C.k === 'robot') { g.fillStyle = C.skin; rr(g, -20, -20, 40, 38, 9); g.fill(); g.stroke(); g.strokeStyle = '#1e1428'; g.beginPath(); g.moveTo(0, -20); g.lineTo(0, -32); g.stroke(); g.fillStyle = '#ff4a5a'; g.beginPath(); g.arc(0, -34, 4 + Math.sin(t * 8) * 1, 0, 7); g.fill(); if (front) { g.fillStyle = '#10131f'; rr(g, -15, -10, 30, 14, 6); g.fill(); g.fillStyle = '#22d3ee'; [-7, 7].forEach(x => { g.beginPath(); g.arc(x, -3, 3.5, 0, 7); g.fill(); }); g.fillStyle = '#9aa8bc'; g.fillRect(-8, 9, 16, 3); } else { g.fillStyle = '#7a8496'; rr(g, -10, -8, 20, 14, 4); g.fill(); } }
    else if (C.k === 'astro') { g.fillStyle = '#eef2f8'; g.beginPath(); g.arc(0, -2, 23, 0, 7); g.fill(); g.stroke(); if (front) { const gr = g.createLinearGradient(-15, -15, 15, 15); gr.addColorStop(0, '#5ab8ff'); gr.addColorStop(1, '#1a2a6a'); g.fillStyle = gr; rr(g, -16, -14, 32, 24, 11); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-8, -8, 5, 3, -0.5, 0, 7); g.fill(); } else { g.fillStyle = col; g.fillRect(-6, -22, 12, 6); } }
    else if (C.k === 'knight') { g.fillStyle = C.hair; g.beginPath(); g.arc(0, -2, 21, Math.PI, 0); g.lineTo(21, 16); g.lineTo(-21, 16); g.closePath(); g.fill(); g.stroke(); g.fillStyle = col; g.beginPath(); g.moveTo(0, -23); g.quadraticCurveTo(14 + Math.sin(t * 9) * 4, -40, 26, -30); g.quadraticCurveTo(12, -30, 4, -20); g.fill(); g.stroke(); if (front) { g.fillStyle = '#10131f'; g.fillRect(-14, -6, 28, 5); g.fillRect(-2, -6, 4, 18); g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(-7, -3.5, 1.5, 0, 7); g.arc(7, -3.5, 1.5, 0, 7); g.fill(); } }
    else {
      // راس عادي + شعر/غطاء
      g.fillStyle = C.skin; g.beginPath(); g.arc(0, 0, 19, 0, 7); g.fill(); g.stroke();
      if (C.k === 'ninja') { g.fillStyle = C.hair; g.beginPath(); g.arc(0, 0, 19, 0, 7); g.fill(); g.stroke(); if (front) { g.fillStyle = C.skin; rr(g, -15, -7, 30, 12, 6); g.fill(); } g.fillStyle = col; g.fillRect(-19, -13, 38, 6); g.save(); g.translate(front ? 18 : 0, -10); g.rotate(Math.sin(t * 8) * 0.3); g.fillRect(0, 0, front ? 14 : 4, 4); if (!front) { g.fillRect(-3, 0, 6, 22 + Math.sin(t * 9) * 3); } g.restore(); }
      else if (C.k === 'cat' || C.k === 'dino') { const hc = C.k === 'cat' ? col : C.hair; g.fillStyle = hc; g.beginPath(); g.arc(0, 0, 21, Math.PI * 0.95, Math.PI * 2.05); if (!front) g.arc(0, 0, 21, 0, Math.PI); g.fill(); g.stroke(); if (C.k === 'cat') [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 8, -18); g.lineTo(s * 16, -32); g.lineTo(s * 19, -12); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ffb3c8'; g.beginPath(); g.moveTo(s * 11, -18); g.lineTo(s * 15, -26); g.lineTo(s * 16, -15); g.fill(); g.fillStyle = hc; }); else { g.fillStyle = '#ffd23a'; [-10, 0, 10].forEach(x => { g.beginPath(); g.moveTo(x - 4, -19 + Math.abs(x) * 0.15); g.lineTo(x, -29); g.lineTo(x + 4, -19 + Math.abs(x) * 0.15); g.fill(); g.stroke(); }); } }
      else { g.fillStyle = C.hair; g.beginPath(); if (front) { g.arc(0, -3, 19.5, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(8, -10, -2, -12); g.quadraticCurveTo(-10, -8, -19, -6); } else g.arc(0, -1, 20, Math.PI * 0.85, Math.PI * 2.15); g.closePath(); g.fill(); g.stroke();
        if (C.k === 'girl') { g.save(); const pt = Math.sin(t * 10) * 0.35; g.translate(front ? 16 : 0, -10); g.rotate(front ? 0.6 + pt : pt); g.beginPath(); g.ellipse(0, 14, 7, 15, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.restore(); } }
      if (front && C.k !== 'ninja' || C.k === 'ninja' && front) {
        // الوجه
        g.fillStyle = '#1e1428'; [-7, 7].forEach(x => { g.beginPath(); g.ellipse(x, 1, 2.8, 3.6, 0, 0, 7); g.fill(); }); g.fillStyle = '#fff'; [-7, 7].forEach(x => { g.beginPath(); g.arc(x - 0.8, -0.2, 1, 0, 7); g.fill(); });
        if (C.k !== 'ninja') { g.strokeStyle = '#1e1428'; g.lineWidth = 2; g.beginPath(); g.arc(0, 7, 5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); g.fillStyle = 'rgba(255,90,120,.4)'; [-12, 12].forEach(x => { g.beginPath(); g.ellipse(x, 7, 3.2, 2, 0, 0, 7); g.fill(); }); if (C.k === 'cat') { g.strokeStyle = '#1e1428'; g.lineWidth = 1; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 10, 5); g.lineTo(s * 20, 3); g.moveTo(s * 10, 8); g.lineTo(s * 20, 9); g.stroke(); }); } }
      }
    }
    // القبعة
    const H = HATS[o.hat || 0]; if (H && H.e) { g.font = (C.k === 'astro' ? 34 : 32) + 'px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(H.e, 0, C.k === 'robot' ? -38 : C.k === 'astro' ? -30 : -24); }
    g.restore(); g.restore();
  }

  /* ---------- حالة اللعبة ---------- */
  const LX = [-1.7, 0, 1.7], ZC = 6.2, CAMH = 3.3;
  const R = { ph: 'menu', t: 0, dist: 0, sp: 13, coins: 0, score: 0, lane: 1, x: 0, y: 0, vy: 0, slide: 0, obs: [], coinsA: [], pws: [], blds: [], fx: [], nextZ: 30, nextB: -10, busy: [0, 0, 0], pw: {}, shield: 0, pause: false, raf: 0, last: 0, shake: 0, dead: 0, zone: 0, zoneT: 0, cnt: 0, flash: 0, mult: 1, cv: null, W: 0, H: 0 };
  const rnd = (a, b) => a + Math.random() * (b - a);
  function reset() {
    Object.assign(R, { t: 0, dist: 0, sp: 13, coins: 0, score: 0, lane: 1, x: 0, y: 0, vy: 0, slide: 0, obs: [], coinsA: [], pws: [], blds: [], fx: [], nextZ: 34, nextB: -12, busy: [0, 0, 0], pw: {}, shield: 0, pause: false, shake: 0, dead: 0, zone: 0, zoneT: 0, flash: 0 });
    while (R.nextB < 90) spawnB();
  }
  function spawnB() { [-1, 1].forEach(s => { const len = rnd(5, 9); R.blds.push({ s, z: R.nextB, len, h: rnd(3.5, 9), c: Math.floor(Math.random() * 5), x: s * rnd(4.4, 5.2), w: rnd(2.5, 4), seed: Math.random() * 99 }); }); R.nextB += rnd(6, 10); }
  function spawnRow(z) {
    const types = [null, null, null]; let trains = 0;
    for (let l = 0; l < 3; l++) if (R.busy[l] > z) types[l] = 'busy';
    const free = [0, 1, 2].filter(l => !types[l]);
    const lvl = Math.min(1, R.dist / 1500);
    free.forEach(l => { const r = Math.random(); const tooMany = trains + (3 - free.length) >= 2; if (!tooMany && r < 0.22 + lvl * 0.12) { types[l] = 'train'; trains++; } else if (r < 0.45 + lvl * 0.1) types[l] = 'barrier'; else if (r < 0.62 + lvl * 0.12) types[l] = 'bar'; });
    if (types.every(t => t && t !== 'barrier' && t !== 'bar') || (types.filter(t => t === 'train' || t === 'busy').length >= 3)) { const l = free.length ? free[Math.floor(Math.random() * free.length)] : 1; types[l] = null; }
    for (let l = 0; l < 3; l++) { const t = types[l]; if (t === 'train') { const len = rnd(10, 22); R.obs.push({ k: 'train', l, z, len, c: Math.floor(Math.random() * 4) }); R.busy[l] = z + len + 6; } else if (t === 'barrier' || t === 'bar') R.obs.push({ k: t, l, z, len: 0.5 }); }
    // العملات أو قوة خارقة
    const opts = [0, 1, 2].filter(l => types[l] !== 'train' && types[l] !== 'busy'); if (!opts.length) return;
    const l = opts[Math.floor(Math.random() * opts.length)];
    if (Math.random() < 0.07 && R.dist > 80) { const ks = Object.keys(PW); R.pws.push({ k: ks[Math.floor(Math.random() * ks.length)], l, z: z - 4, y: 0.8 }); return; }
    const n = 5 + Math.floor(Math.random() * 4), arc = types[l] === 'barrier';
    for (let i = 0; i < n; i++) { const zz = z - (n - 1) * 0.8 + i * 1.6 - (arc ? 0 : 3); const y = arc ? 0.7 + Math.max(0, 1.6 - Math.abs(zz - z) * 0.35) : 0.7; R.coinsA.push({ l, z: zz, y, x: LX[l] }); }
  }
  function start() {
    reset(); R.ph = 'count'; R.cnt = performance.now(); sfx('go'); hideOv(); hud();
  }

  /* ---------- الحركة ---------- */
  function act(k) {
    if (R.ph !== 'play' || R.pause) return;
    if (k === 'left' && R.lane > 0) { R.lane--; sfx('left'); }
    else if (k === 'right' && R.lane < 2) { R.lane++; sfx('right'); }
    else if (k === 'up' && R.y <= 0.01) { R.vy = R.pw.jump > 0 ? 12.2 : 9.2; R.slide = 0; sfx('jump'); }
    else if (k === 'down') { if (R.y > 0.05) R.vy = -18; R.slide = 0.75; sfx('slide'); }
  }
  /* بالواجهة العربية «يمين» يعني يمين الشاشة */
  function bindInput(cv) {
    let sx = 0, sy = 0, done = false, id = null;
    cv.addEventListener('pointerdown', e => { id = e.pointerId; sx = e.clientX; sy = e.clientY; done = false; try { cv.setPointerCapture(id); } catch (er) {} e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (e.pointerId !== id || done) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.hypot(dx, dy) < 28) return; done = true; if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? 'right' : 'left'); else act(dy < 0 ? 'up' : 'down'); });
    cv.addEventListener('pointerup', e => { if (e.pointerId !== id) return; if (!done && Math.hypot(e.clientX - sx, e.clientY - sy) < 12) act('up'); id = null; });
    document.addEventListener('keydown', e => { if (window.curPage !== 'run') return; const m = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', ' ': 'up' }[e.key]; if (m) { act(m); e.preventDefault(); } if (e.key === 'p' || e.key === 'Escape') togglePause(); });
  }

  /* ---------- التحديث ---------- */
  function hitTest(o) {
    const pz0 = -0.45, pz1 = 0.45; if (o.z > pz1 || o.z + o.len < pz0) return false;
    if (Math.abs(R.x - LX[o.l]) > (o.k === 'train' ? 1.15 : 0.95)) return false;
    if (o.k === 'barrier') return R.y < 0.9;
    if (o.k === 'bar') return !(R.slide > 0 && R.y < 0.4);
    return true;
  }
  function update(dt) {
    R.t += dt;
    if (R.ph === 'count') { if (performance.now() - R.cnt > 2000) { R.ph = 'play'; } return; }
    if (R.ph === 'dead') { R.dead += dt; R.shake = Math.max(0, R.shake - dt * 2); if (R.dead > 1.1 && !$r('runOver').classList.contains('on')) showOver(); return; }
    if (R.ph !== 'play' || R.pause) return;
    R.sp = Math.min(31, 13 + R.dist / 110); const d = R.sp * dt; R.dist += d;
    // تبديل السكة بنعومة
    R.x += (LX[R.lane] - R.x) * Math.min(1, dt * 16);
    // القفز والزحف
    if (R.y > 0 || R.vy > 0) { R.vy -= 27 * dt; R.y += R.vy * dt; if (R.y <= 0) { R.y = 0; R.vy = 0; sfx('land'); } }
    if (R.slide > 0) R.slide -= dt;
    for (const k in R.pw) if (R.pw[k] > 0) R.pw[k] -= dt;
    const mv = o => { o.z -= d; };
    R.obs.forEach(mv); R.coinsA.forEach(mv); R.pws.forEach(mv); R.blds.forEach(mv); R.nextZ -= d; R.nextB -= d; R.busy = R.busy.map(b => b - d);
    while (R.nextZ < 80) { spawnRow(R.nextZ); R.nextZ += Math.max(11, rnd(13, 20) + R.sp * 0.18); }
    while (R.nextB < 90) spawnB();
    R.obs = R.obs.filter(o => o.z + o.len > -6); R.coinsA = R.coinsA.filter(o => o.z > -6 && !o.got); R.pws = R.pws.filter(o => o.z > -6 && !o.got); R.blds = R.blds.filter(b => b.z + b.len > -8);
    // الاصطدام
    for (const o of R.obs) if (!o.hit && hitTest(o)) {
      if (R.shield > 0) { R.shield = 0; o.hit = true; o.gone = true; sfx('shield'); R.flash = 0.4; for (let i = 0; i < 22; i++) R.fx.push({ x: R.x, y: 1, z: 0.5, vx: rnd(-3, 3), vy: rnd(1, 6), vz: rnd(-1, 3), t: 0.8, e: '✨' }); continue; }
      die(); return;
    }
    R.obs = R.obs.filter(o => !o.gone);
    // العملات
    const mag = R.pw.mag > 0, cm = R.pw.x2 > 0 ? 2 : 1;
    R.coinsA.forEach(c => { if (mag && c.z < 14 && c.z > -1) { c.x += (R.x - c.x) * Math.min(1, dt * 7); c.y += (R.y + 0.8 - c.y) * Math.min(1, dt * 7); c.z -= c.z * Math.min(1, dt * 5); }
      const cx = c.x !== undefined ? c.x : LX[c.l]; if (Math.abs(c.z) < 0.7 && Math.abs(cx - R.x) < 0.9 && Math.abs(c.y - (R.y + 0.8)) < 1.25) { c.got = true; R.coins += cm; sfx('coin'); R.fx.push({ x: cx, y: c.y + 0.3, z: c.z, vx: 0, vy: 2.5, vz: 0, t: 0.5, txt: '+' + cm }); } });
    R.pws.forEach(p => { if (Math.abs(p.z) < 0.8 && Math.abs(LX[p.l] - R.x) < 0.95 && R.y < 2) { p.got = true; sfx('power'); if (p.k === 'sh') R.shield = 1; else R.pw[p.k] = PW[p.k].d; showToastR(PW[p.k].e + ' ' + PW[p.k].n + '!'); } });
    R.fx.forEach(f => { f.t -= dt; f.x += (f.vx || 0) * dt; f.y += (f.vy || 0) * dt; f.z += (f.vz || 0) * dt - d; if (!f.txt) f.vy -= 9 * dt; }); R.fx = R.fx.filter(f => f.t > 0);
    R.score = Math.floor(R.dist * (1 + Math.floor(R.dist / 500) * 0.5)) + R.coins * 5;
    const zn = Math.floor(R.dist / 700) % THEMES.length; if (zn !== R.zone) { R.zone = zn; R.zoneT = 2.2; sfx('zone'); } if (R.zoneT > 0) R.zoneT -= dt;
    if (R.flash > 0) R.flash -= dt;
  }
  function die() {
    R.ph = 'dead'; R.dead = 0; R.shake = 1; sfx('lose'); try { navigator.vibrate && navigator.vibrate([80, 40, 120]); } catch (e) {}
    for (let i = 0; i < 26; i++) R.fx.push({ x: R.x, y: 1 + R.y, z: 0.2, vx: rnd(-4, 4), vy: rnd(2, 8), vz: rnd(-2, 2), t: 1.1, e: ['💥', '⭐', '💫'][i % 3] });
    const nb = R.score > S.best; S.best = Math.max(S.best, R.score); S.coins += R.coins; S.runs++; R.newBest = nb; save();
  }

  /* ---------- الرسم ---------- */
  let F = 0, HOR = 0;
  const P = (x, y, z) => { const k = F / Math.max(0.6, z + ZC); return [R.W / 2 + (x - R.x * 0.55) * k, HOR + (CAMH - y) * k, k]; };
  function quad(g, a, b, c, d, fill) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fillStyle = fill; g.fill(); }
  const NEAR = -4.8, FAR = 85;
  function drawWorld(g) {
    const W = R.W, H = R.H, T = THEMES[R.zone];
    F = H * 0.95; HOR = H * 0.3;
    // السما
    const sk = g.createLinearGradient(0, 0, 0, HOR + 20); sk.addColorStop(0, T.sky[0]); sk.addColorStop(1, T.sky[1]); g.fillStyle = sk; g.fillRect(0, 0, W, HOR + 30);
    if (R.zone === 2) { g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const x = (i * 97.3 % W), y = (i * 53.7 % HOR); g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(R.t * 2 + i)); g.fillRect(x, y, 2, 2); } g.globalAlpha = 1; g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(W * 0.78, HOR * 0.35, 22, 0, 7); g.fill(); g.fillStyle = T.sky[0]; g.beginPath(); g.arc(W * 0.78 + 9, HOR * 0.35 - 6, 19, 0, 7); g.fill(); }
    else if (R.zone === 1) { g.fillStyle = 'rgba(255,240,180,.9)'; g.beginPath(); g.arc(W * 0.25, HOR * 0.9, 34, 0, 7); g.fill(); }
    else { g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 4; i++) { const x = ((i * 180 + R.t * 8) % (W + 200)) - 100, y = 30 + i * 22; g.beginPath(); g.ellipse(x, y, 40, 12, 0, 0, 7); g.ellipse(x + 26, y - 6, 26, 12, 0, 0, 7); g.fill(); } if (R.zone === 0) { g.fillStyle = 'rgba(255,240,140,.95)'; g.beginPath(); g.arc(W * 0.82, HOR * 0.4, 20, 0, 7); g.fill(); } }
    // الأرض
    g.fillStyle = T.gr; g.fillRect(0, HOR, W, H - HOR);
    const pl = P(-3, 0, FAR), pr = P(3, 0, FAR), nl = P(-3, 0, NEAR), nr = P(3, 0, NEAR); quad(g, pl, pr, nr, nl, T.bed);
    // العتبات (الخشب) تتحرك
    const sp = 2.1, off = R.dist % sp;
    for (let z = FAR - ((FAR - NEAR) % sp) - off; z > NEAR; z -= sp) { const z2 = z + 0.45; for (let l = 0; l < 3; l++) { const x = LX[l]; quad(g, P(x - 0.85, 0, z2), P(x + 0.85, 0, z2), P(x + 0.85, 0, z), P(x - 0.85, 0, z), T.tie); } }
    // القضبان
    g.fillStyle = R.zone === 2 ? '#9aa4b8' : '#c8ccd4';
    for (let l = 0; l < 3; l++) [-0.55, 0.55].forEach(dx => { const x = LX[l] + dx; quad(g, P(x - 0.07, 0.05, FAR), P(x + 0.07, 0.05, FAR), P(x + 0.07, 0.05, NEAR), P(x - 0.07, 0.05, NEAR), g.fillStyle); });
    // الرصيف
    [-1, 1].forEach(s => quad(g, P(s * 3, 0, FAR), P(s * 3.9, 0, FAR), P(s * 3.9, 0, NEAR), P(s * 3, 0, NEAR), R.zone === 3 ? '#f4f8fc' : 'rgba(0,0,0,.12)'));
    // البنايات (البعيدة أول)
    R.blds.slice().sort((a, b) => b.z - a.z).forEach(b => drawBld(g, b, T));
    if (R.zone === 3) { g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 50; i++) { const x = (i * 71.7 + R.t * 30 * (1 + i % 3)) % W, y = (i * 43.1 + R.t * 60 * (1 + i % 2)) % H; g.beginPath(); g.arc(x, y, 1.5 + i % 2, 0, 7); g.fill(); } }
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
    g.globalAlpha = 1; if (R.zone === 3) { g.fillStyle = '#fff'; g.fillRect(x0 - 2, c[1] - 4, ww + 4, 6); }
    void k;
  }
  const TRC = [['#e8382e', '#ffd23a'], ['#3a8bff', '#eef2f8'], ['#2eae6a', '#ffd23a'], ['#ff8a2a', '#3a2a5a']];
  function drawObs(g, o) {
    const x = LX[o.l];
    if (o.k === 'train') {
      const z0 = Math.max(NEAR + 0.2, o.z), z1 = o.z + o.len, w = 0.78, h = 2.4, C = TRC[o.c];
      const camX = R.x * 0.55;
      // السقف
      quad(g, P(x - w, h, z0), P(x + w, h, z0), P(x + w, h, z1), P(x - w, h, z1), shade(C[0], 25));
      // الجانب الظاهر
      if (x - w > camX) quad(g, P(x - w, 0, z0), P(x - w, h, z0), P(x - w, h, z1), P(x - w, 0, z1), shade(C[0], -40));
      if (x + w < camX) quad(g, P(x + w, 0, z0), P(x + w, h, z0), P(x + w, h, z1), P(x + w, 0, z1), shade(C[0], -40));
      if (o.z > NEAR + 0.2) {
        const a = P(x - w, 0, z0), b = P(x + w, h, z0), ww = b[0] - a[0], hh = a[1] - b[1];
        g.fillStyle = C[0]; rr(g, a[0], b[1], ww, hh, ww * 0.12); g.fill(); g.fillStyle = C[1]; g.fillRect(a[0], b[1] + hh * 0.62, ww, hh * 0.1);
        g.fillStyle = '#1a2a48'; rr(g, a[0] + ww * 0.12, b[1] + hh * 0.12, ww * 0.76, hh * 0.32, ww * 0.06); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(a[0] + ww * 0.16, b[1] + hh * 0.15, ww * 0.18, hh * 0.08);
        g.fillStyle = '#fff6a0'; [0.2, 0.8].forEach(f => { g.beginPath(); g.arc(a[0] + ww * f, b[1] + hh * 0.82, ww * 0.07, 0, 7); g.fill(); });
      }
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
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(s0[0], s0[1], 0.55 * s0[2] * Math.max(0.5, 1 - R.y * 0.2), 0.14 * s0[2], 0, 0, 7); g.fill();
    if (R.shield > 0) { g.strokeStyle = 'rgba(80,200,255,' + (0.5 + Math.sin(R.t * 8) * 0.3) + ')'; g.lineWidth = 4; g.beginPath(); g.ellipse(p[0], p[1] - 65 * sc, 55 * sc, 75 * sc, 0, 0, 7); g.stroke(); }
    g.save(); g.translate(p[0], p[1]); g.scale(sc, sc); if (R.ph === 'dead') g.rotate(Math.min(1.3, R.dead * 4) * (R.lane === 0 ? -1 : 1));
    drawChar(g, S.sel.c, { col: S.sel.col, hat: S.sel.h, t: R.t, front: false, air: R.y > 0.05, slide: R.slide > 0 && R.y < 0.3, run: R.ph === 'play' || R.ph === 'count' });
    g.restore();
    if (R.pw.jump > 0 && R.y > 0.2) { g.font = '18px system-ui'; g.textAlign = 'center'; g.fillText('✨', s0[0] + Math.sin(R.t * 20) * 14, s0[1] - 6); }
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
    items.forEach(it => { const o = it[2]; if (it[1] === 0 && o.k === 'train' && o.z < 0.5) it[0] = o.z + o.len > 0.5 ? (Math.abs(LX[o.l] - R.x) < 0.9 ? -10 : 0.6) : -10; });
    items.sort((a, b) => b[0] - a[0]).forEach(it => { if (it[1] === 0) drawObs(g, it[2]); else if (it[1] === 1) drawCoin(g, it[2]); else if (it[1] === 2) drawPw(g, it[2]); else drawPlayer(g); });
    R.fx.forEach(f => { const p = P(f.x, f.y, Math.max(-3, f.z)); g.globalAlpha = Math.min(1, f.t * 2); g.textAlign = 'center'; g.textBaseline = 'middle'; if (f.txt) { g.font = 'bold 20px Cairo, system-ui'; g.fillStyle = '#ffd23a'; g.strokeStyle = '#3a2200'; g.lineWidth = 3; g.strokeText(f.txt, p[0], p[1]); g.fillText(f.txt, p[0], p[1]); } else { g.font = '22px system-ui'; g.fillText(f.e, p[0], p[1]); } g.globalAlpha = 1; });
    g.restore();
    if (R.flash > 0) { g.fillStyle = 'rgba(120,220,255,' + R.flash + ')'; g.fillRect(0, 0, W, H); }
    if (R.ph === 'dead') { g.fillStyle = 'rgba(255,40,60,' + Math.max(0, 0.35 - R.dead * 0.3) + ')'; g.fillRect(0, 0, W, H); }
    if (R.ph === 'count') { const n = 3 - Math.floor((performance.now() - R.cnt) / 667); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, H); g.font = '900 96px Cairo, system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.strokeStyle = '#a24aff'; g.lineWidth = 8; const tx = n > 0 ? String(n) : 'يلا!'; const sc = 1 + ((performance.now() - R.cnt) % 667) / 667 * 0.3; g.save(); g.translate(W / 2, H * 0.42); g.scale(sc, sc); g.strokeText(tx, 0, 0); g.fillText(tx, 0, 0); g.restore(); }
    if (R.zoneT > 0) { g.globalAlpha = Math.min(1, R.zoneT); g.font = '900 30px Cairo, system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 6; g.strokeText(THEMES[R.zone].n, W / 2, H * 0.22); g.fillText(THEMES[R.zone].n, W / 2, H * 0.22); g.globalAlpha = 1; }
  }

  /* ---------- الحلقة ---------- */
  function loop(ts) {
    R.raf = 0; if (window.curPage !== 'run') { musTick(); return; }
    const cv = R.cv; if (!cv) return; const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W && H && (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr))) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    R.W = W; R.H = H; const dt = Math.min(0.05, Math.max(0, (ts - (R.last || ts)) / 1000)); R.last = ts;
    if (document.hidden && R.ph === 'play' && !R.pause) togglePause();
    try { update(dt); const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); draw(); hud(); musTick(); } catch (e) { console.error(e); }
    R.raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!R.raf) { R.last = 0; R.raf = requestAnimationFrame(loop); } };

  /* ---------- الواجهة ---------- */
  let toastT = 0;
  function showToastR(t) { const e = $r('runToast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 1500); }
  function hud() {
    const h = $r('runHud'); if (!h) return; h.hidden = !(R.ph === 'play' || R.ph === 'count' || R.ph === 'dead');
    $r('runSc').textContent = R.score.toLocaleString('en'); $r('runCo').textContent = R.coins; $r('runM').textContent = Math.floor(R.dist) + 'م';
    const pw = $r('runPw'); let s = ''; for (const k in R.pw) if (R.pw[k] > 0) s += '<span><i>' + PW[k].e + '</i><b style="width:' + Math.max(0, R.pw[k] / PW[k].d * 100) + '%"></b></span>'; if (R.shield > 0) s += '<span><i>🛡️</i></span>'; if (pw.dataset.s !== s) { pw.innerHTML = s; pw.dataset.s = s; }
    $r('runPause').hidden = R.ph !== 'play';
  }
  function hideOv() { ['runMenu', 'runOver', 'runPick', 'runPauseOv'].forEach(i => { const e = $r(i); if (e) e.classList.remove('on'); }); }
  function togglePause() { if (R.ph !== 'play') return; R.pause = !R.pause; $r('runPauseOv').classList.toggle('on', R.pause); sfx('click'); }
  function prev(cv, id, o, big) {
    const g = cv.getContext('2d'), dpr = 2; cv.width = cv.clientWidth * dpr || 160; cv.height = cv.clientHeight * dpr || 160;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); const s = cv.height / (big ? 175 : 165); g.translate(cv.width / 2, cv.height * 0.93); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 2, 30, 7, 0, 0, 7); g.fill(); drawChar(g, id, o);
  }
  let pvT = 0, pickTab = 'c';
  function animPreviews() {
    pvT += 0.016; const on = window.curPage === 'run' && (R.ph === 'menu' || R.ph === 'over' || $r('runPick').classList.contains('on'));
    if (on) { const big = $r('runBig'); if (big && big.offsetParent) prev(big, S.sel.c, { col: S.sel.col, hat: S.sel.h, t: pvT, front: Math.floor(pvT / 3.5) % 4 !== 3, run: true }, true); document.querySelectorAll('#runGrid canvas[data-i]').forEach(c => { const i = +c.dataset.i; prev(c, pickTab === 'c' ? i : S.sel.c, { col: pickTab === 'col' ? i : S.sel.col, hat: pickTab === 'h' ? i : S.sel.h, t: pvT + i * 0.3, front: true, run: pickTab === 'c' ? (+c.dataset.i === S.sel.c) : true }); }); const mb = $r('runMenuChar'); if (mb && mb.offsetParent) prev(mb, S.sel.c, { col: S.sel.col, hat: S.sel.h, t: pvT, front: true, run: true }, true); }
    setTimeout(() => requestAnimationFrame(animPreviews), on ? 30 : 400);
  }
  function renderPick() {
    const G = $r('runGrid'); G.innerHTML = ''; $r('runBank').textContent = '🪙 ' + S.coins;
    document.querySelectorAll('#runTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === pickTab));
    const list = pickTab === 'c' ? CH : pickTab === 'h' ? HATS : COLS;
    list.forEach((it, i) => {
      const own = pickTab === 'c' ? ownC(i) : pickTab === 'h' ? ownH(i) : true, sel = pickTab === 'c' ? S.sel.c === i : pickTab === 'h' ? S.sel.h === i : S.sel.col === i;
      const b = mk('button', 'runIt' + (sel ? ' on' : '') + (own ? '' : ' lock')); b.type = 'button';
      if (pickTab === 'col') b.style.setProperty('--sw', it);
      const cv = mk('canvas'); cv.dataset.i = i; b.appendChild(cv);
      b.appendChild(mk('b', '', pickTab === 'c' ? it.n : pickTab === 'h' ? it.n : '🎨'));
      if (!own) b.appendChild(mk('small', 'pr', '🔒 ' + it.p + ' 🪙')); else if (sel) b.appendChild(mk('small', 'ok', '✔ مختار'));
      b.onclick = () => {
        if (!own) { if (S.coins < it.p) { sfx('click'); showToastR('😅 ينقصك ' + (it.p - S.coins) + ' 🪙 — اركض واجمع أكثر!'); return; } if (!confirm('تشتري «' + it.n + '» بـ ' + it.p + ' عملة ركض؟')) return; S.coins -= it.p; (pickTab === 'c' ? S.own.c : S.own.h).push(i); sfx('buy'); showToastR('🎉 صار عندك «' + it.n + '»!'); }
        else sfx('click');
        if (pickTab === 'c') S.sel.c = i; else if (pickTab === 'h') S.sel.h = i; else S.sel.col = i; save(); renderPick(); menuInfo();
      };
      G.appendChild(b);
    });
    $r('runPickName').textContent = CH[S.sel.c].n + (S.sel.h ? ' ' + HATS[S.sel.h].e : '');
  }
  function menuInfo() { const e = $r('runMenuInfo'); if (e) e.innerHTML = '🏆 أعلى نتيجة: <b>' + S.best.toLocaleString('en') + '</b> &nbsp;•&nbsp; 🪙 عملات الركض: <b>' + S.coins + '</b>'; const n = $r('runMenuName'); if (n) n.textContent = CH[S.sel.c].n; }
  function showOver() {
    const O = $r('runOver'); O.classList.add('on'); R.ph = 'over';
    $r('runOvB').innerHTML = '<div class="ro1">' + (R.newBest ? '🎉 رقم قياسي جديد!' : '😵 انمسكت!') + '</div><div class="ro2">' + R.score.toLocaleString('en') + '</div><div class="ro3"><span>📏 ' + Math.floor(R.dist) + ' متر</span><span>🪙 +' + R.coins + '</span><span>🏆 ' + S.best.toLocaleString('en') + '</span></div>';
  }
  function build() {
    const B = $r('runBody'); if (!B || B.dataset.ok) return; B.dataset.ok = '1';
    B.innerHTML = `<canvas id="runCv"></canvas>
<div id="runHud" hidden><div class="rh1"><span class="rhSc">⭐ <b id="runSc">0</b></span><span class="rhCo">🪙 <b id="runCo">0</b></span><span class="rhM" id="runM">0م</span></div><div id="runPw"></div><button id="runPause" type="button">⏸️</button></div>
<div id="runToast"></div>
<div id="runMenu" class="runOv on"><div class="rmBox"><div class="rmTitle"><span class="rmE">🏃‍♂️💨</span><h2>ركض ربش</h2><small>اركض على سكة القطار، تفادى، اقفز، ازحف واجمع العملات!</small></div>
<div class="rmStage"><canvas id="runMenuChar"></canvas><div class="rmName" id="runMenuName"></div></div>
<button id="runGo" class="rmBtn big" type="button">▶ ابدأ الركض</button><button id="runPickBtn" class="rmBtn" type="button">🧍 شخصيتي وشكلها</button>
<div id="runMenuInfo" class="rmInfo"></div><div class="rmTog"><button id="runMusB" type="button"></button><button id="runSfxB" type="button"></button></div>
<div class="rmHow">👆 اسحب ⬅️ ➡️ تبدّل السكة • ⬆️ أو دوسة تقفز • ⬇️ تزحف</div></div></div>
<div id="runPick" class="runOv"><div class="rmBox wide"><div class="rpHead"><button id="runPickX" type="button">→ رجوع</button><b>🧍 اختار شخصيتك</b><span id="runBank"></span></div>
<div class="rpStage"><canvas id="runBig"></canvas><div class="rpName" id="runPickName"></div><small>تلف وتبين من الورا مثل ما تشوفها وانت تركض 👀</small></div>
<div id="runTabs"><button data-t="c" type="button">🧍 الشخصيات</button><button data-t="col" type="button">🎨 لون الملابس</button><button data-t="h" type="button">🎩 القبعات</button></div>
<div id="runGrid"></div><button id="runPickGo" class="rmBtn big" type="button">▶ يلا نركض</button></div></div>
<div id="runOver" class="runOv"><div class="rmBox"><div id="runOvB"></div><button id="runAgain" class="rmBtn big" type="button">🔁 مرة ثانية</button><button id="runOvPick" class="rmBtn" type="button">🧍 غيّر الشخصية</button><button id="runOvMenu" class="rmBtn ghost" type="button">🏠 القائمة</button></div></div>
<div id="runPauseOv" class="runOv"><div class="rmBox"><h2>⏸️ موقّف</h2><small>اللعبة تنتظرك، كمّل وقت ما تريد</small><button id="runResume" class="rmBtn big" type="button">▶ كمّل</button><button id="runQuit" class="rmBtn ghost" type="button">🏠 اطلع للقائمة</button></div></div>`;
    R.cv = $r('runCv'); bindInput(R.cv);
    const tg = () => { $r('runMusB').textContent = (S.mus ? '🎵' : '🔇') + ' الموسيقى'; $r('runSfxB').textContent = (S.sfx ? '🔊' : '🔈') + ' الأصوات'; $r('runMusB').classList.toggle('off', !S.mus); $r('runSfxB').classList.toggle('off', !S.sfx); };
    $r('runMusB').onclick = () => { S.mus = S.mus ? 0 : 1; save(); tg(); sfx('click'); }; $r('runSfxB').onclick = () => { S.sfx = S.sfx ? 0 : 1; save(); tg(); sfx('click'); }; tg();
    const openPick = () => { sfx('click'); hideOv(); $r('runPick').classList.add('on'); renderPick(); };
    $r('runGo').onclick = start; $r('runAgain').onclick = start; $r('runPickGo').onclick = start;
    $r('runPickBtn').onclick = openPick; $r('runOvPick').onclick = openPick;
    $r('runPickX').onclick = () => { sfx('click'); hideOv(); R.ph = 'menu'; $r('runMenu').classList.add('on'); menuInfo(); };
    const toMenu = () => { sfx('click'); hideOv(); R.ph = 'menu'; reset(); $r('runMenu').classList.add('on'); menuInfo(); };
    $r('runOvMenu').onclick = toMenu; $r('runQuit').onclick = toMenu;
    $r('runPause').onclick = togglePause; $r('runResume').onclick = togglePause;
    document.querySelectorAll('#runTabs button').forEach(b => b.onclick = () => { pickTab = b.dataset.t; sfx('click'); renderPick(); });
    reset(); animPreviews();
  }
  window.runOpen = function () {
    build(); if (R.ph === 'play') { R.pause = true; $r('runPauseOv').classList.add('on'); }
    if (R.ph === 'menu') { $r('runMenu').classList.add('on'); }
    menuInfo(); kick();
  };
})();
