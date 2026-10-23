/* ===================== تقييم اللعبة ❤️ / 💔 =====================
   - بعد 4 دقايق لعب (ضيف أو عضو) تطلع لوحة التقييم مرة وحدة، وإذا قال «بعدين» ترجع بعد 4 دقايق ثانية.
   - قلب عدل = حبيتها، قلب مكسور = ما حبيتها. تعليق اختياري واحد بس لكل حساب.
   - التقييمات وعدد الزوار تنحفظ بالسيرفر بتخزين خاص دائم (ما ينمسح بالديبلوي أو الريستارت).
   - المشرفين يشوفون العدد والتعليقات من زر ⭐ بلوحة المشرفين أو من صفحة المطور. */
'use strict';
(function () {
  const $q = id => document.getElementById(id);
  const LS = { g: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, s: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  let dev = LS.g('flappyDev'); if (!dev || !/^[a-z0-9]{12,40}$/i.test(dev)) { dev = ''; const c = 'abcdefghijkmnpqrstuvwxyz23456789'; for (let i = 0; i < 20; i++) dev += c[Math.floor(Math.random() * c.length)]; LS.s('flappyDev', dev); }
  const A = () => { try { return (typeof auth !== 'undefined' && auth) || null; } catch (e) { return null; } };
  const hdr = () => { const h = { 'Content-Type': 'application/json' }, a = A(); if (a && a.token) h.Authorization = 'Bearer ' + a.token; return h; };
  const post = (u, b) => fetch(u, { method: 'POST', headers: hdr(), body: JSON.stringify(b), cache: 'no-store' }).then(r => r.json().then(j => { if (!r.ok) throw new Error(j.error || 'خطأ'); return j; }));
  const toast = t => { try { showToast(t); } catch (e) {} };
  const isAdm = () => { const a = A(); return !!(a && (a.admin || a.name === 'بابي' || a.name === 'بابيتو')); };

  /* ---------- الأصوات ---------- */
  function ac() { try { if (window.unlockAudio) unlockAudio(); return (typeof actx !== 'undefined' && actx) || null; } catch (e) { return null; } }
  function tn(type, f0, f1, dur, vol, at) { const a = ac(); if (!a) return; const t = a.currentTime + (at || 0), o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05); }
  function nz(dur, vol, at, f) { const a = ac(); if (!a) return; const t = a.currentTime + (at || 0), n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; fl.type = 'highpass'; fl.frequency.value = f || 2000; g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t); }
  const sndLove = () => { [523, 659, 784, 1047].forEach((f, i) => tn('sine', f, 0, 0.35, 0.09, i * 0.08)); tn('triangle', 1568, 2093, 0.25, 0.05, 0.36); [0, 0.5].forEach(d => { tn('sine', 90, 50, 0.16, 0.25, d); tn('sine', 80, 45, 0.18, 0.2, d + 0.18); }); };
  const sndBroken = () => { nz(0.12, 0.35, 0, 2500); tn('square', 900, 300, 0.1, 0.05, 0.02); nz(0.08, 0.25, 0.16, 3500); [[392, 0.25], [349, 0.5], [311, 0.75], [262, 1.0]].forEach(q => tn('triangle', q[0], q[0] * 0.94, 0.4, 0.07, q[1])); };
  const sndTap = () => tn('sine', 700, 1000, 0.07, 0.05);

  /* ---------- الستايل ---------- */
  const css = `
  #rtOv { position: fixed; inset: 0; z-index: 99990; display: grid; place-items: center; padding: 16px; background: rgba(8,4,24,.62); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); animation: rtFade .3s both; }
  #rtOv[hidden] { display: none !important; }
  #rtBox { position: relative; overflow: hidden; width: min(400px, 100%); max-height: calc(100vh - 32px); overflow-y: auto; border-radius: 28px; padding: 22px 18px 18px; color: #fff; text-align: center; border: 2px solid rgba(255,255,255,.4);
    background: linear-gradient(135deg, #ff4f8b, #a24aff, #3a7bff, #ff7a5a); background-size: 400% 400%; animation: rtBg 10s ease infinite, rtPop .45s cubic-bezier(.2,1.4,.4,1) both; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
  #rtBox > * { position: relative; z-index: 2; }
  #rtFl { position: absolute !important; inset: 0; z-index: 1 !important; pointer-events: none; overflow: hidden; }
  #rtFl i { position: absolute; bottom: -40px; font-style: normal; opacity: .0; animation: rtUp linear infinite; }
  #rtX { position: absolute !important; top: 10px; left: 12px; width: 34px; height: 34px; border-radius: 50%; border: 0; background: rgba(255,255,255,.22); color: #fff; font-size: 16px; cursor: pointer; }
  .rtHi { font-size: 46px; animation: rtWave 2s ease-in-out infinite; display: inline-block; }
  #rtBox h2 { margin: 4px 0 2px; font-size: 23px; font-weight: 900; text-shadow: 0 2px 8px rgba(0,0,0,.25); }
  #rtBox .rtSub { font-size: 13.5px; opacity: .92; font-weight: 700; }
  .rtBtns { display: flex; gap: 12px; margin: 18px 0 12px; }
  .rtB { flex: 1; border: 2px solid rgba(255,255,255,.55); border-radius: 22px; padding: 14px 6px 12px; cursor: pointer; color: #fff; font: 900 16px Cairo, system-ui; background: rgba(255,255,255,.16); transition: transform .15s, background .2s; }
  .rtB .em { display: block; font-size: 58px; line-height: 1.1; }
  .rtB.love .em { animation: rtBeat 1.1s ease-in-out infinite; } .rtB.no .em { animation: rtSad 2.4s ease-in-out infinite; }
  .rtB.love.on { background: linear-gradient(135deg, #ff2d6f, #ff7aa8); box-shadow: 0 0 0 4px rgba(255,255,255,.7), 0 8px 26px rgba(255,45,111,.6); transform: scale(1.05); }
  .rtB.no.on { background: linear-gradient(135deg, #4a4a6a, #7a5a8a); box-shadow: 0 0 0 4px rgba(255,255,255,.6), 0 8px 22px rgba(0,0,0,.4); transform: scale(1.05); }
  .rtB.love.on .em { animation: rtBeatBig .5s ease-in-out 3, rtBeat 1.1s ease-in-out 1.5s infinite; }
  .rtB.no.on .em { animation: rtCrack .6s ease-in-out; }
  .rtB:active { transform: scale(.95); }
  #rtNote { width: 100%; box-sizing: border-box; min-height: 70px; resize: none; border-radius: 16px; border: 2px solid rgba(255,255,255,.5); background: rgba(255,255,255,.92); color: #22183a; padding: 10px 12px; font: 700 15px Cairo, system-ui; }
  #rtNote:disabled { opacity: .8; }
  .rtNH { font-size: 12.5px; font-weight: 800; margin: 2px 0 6px; text-align: right; opacity: .95; }
  #rtSend { width: 100%; margin-top: 12px; border: 0; border-radius: 18px; padding: 13px; font: 900 18px Cairo, system-ui; color: #a2207a; background: #fff; box-shadow: 0 5px 0 rgba(0,0,0,.18); cursor: pointer; }
  #rtSend:disabled { opacity: .55; }
  #rtLater { margin-top: 8px; background: none; border: 0; color: #fff; opacity: .85; font: 700 13px Cairo, system-ui; text-decoration: underline; cursor: pointer; }
  .rtBurst { position: fixed; z-index: 99995; pointer-events: none; font-size: 26px; animation: rtBurst 1.1s ease-out forwards; }
  .rtThanks { font-size: 64px; animation: rtBeatBig .6s ease-in-out 2; display: inline-block; }
  /* لوحة المشرفين */
  #rsBox .rsGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 14px 0 10px; }
  #rsBox .rsC { border-radius: 16px; padding: 10px 6px; background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.35); } #rsBox .rsC b { display: block; font-size: 24px; font-weight: 900; } #rsBox .rsC small { font-size: 12px; font-weight: 700; opacity: .9; }
  #rsBox .rsBar { height: 16px; border-radius: 10px; overflow: hidden; display: flex; background: rgba(0,0,0,.25); margin: 6px 0 4px; } #rsBox .rsBar i { display: block; background: linear-gradient(90deg, #ff2d6f, #ff8ab0); } #rsBox .rsBar u { display: block; flex: 1; background: linear-gradient(90deg, #6a6a8a, #44445a); }
  #rsBox .rsL { text-align: right; max-height: 42vh; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
  #rsBox .rsI { background: rgba(255,255,255,.92); color: #22183a; border-radius: 14px; padding: 8px 10px; font-size: 13.5px; font-weight: 700; } #rsBox .rsI small { display: block; color: #7a6a9a; font-size: 11px; font-weight: 600; }
  .devRate { display: block; width: 100%; margin-top: 10px; border: 0; border-radius: 16px; padding: 12px; font: 900 16px Cairo, system-ui; color: #fff; background: linear-gradient(135deg, #ff2d6f, #a24aff); box-shadow: 0 5px 16px rgba(255,45,111,.4); cursor: pointer; }
  #alHead #alStat { margin-inline-end: 4px; }
  @keyframes rtBg { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @keyframes rtPop { from { opacity: 0; transform: scale(.7) translateY(30px); } to { opacity: 1; transform: none; } }
  @keyframes rtFade { from { opacity: 0; } }
  @keyframes rtUp { 0% { transform: translateY(0) rotate(0); opacity: 0; } 10% { opacity: .9; } 90% { opacity: .7; } 100% { transform: translateY(-560px) rotate(40deg); opacity: 0; } }
  @keyframes rtWave { 0%,100% { transform: rotate(-10deg); } 50% { transform: rotate(12deg) scale(1.08); } }
  @keyframes rtBeat { 0%,100% { transform: scale(1); } 15% { transform: scale(1.18); } 30% { transform: scale(1); } 45% { transform: scale(1.12); } }
  @keyframes rtBeatBig { 0%,100% { transform: scale(1); } 50% { transform: scale(1.4) rotate(-6deg); } }
  @keyframes rtSad { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(4px) rotate(-8deg); } }
  @keyframes rtCrack { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px) rotate(-10deg); } 40% { transform: translateX(7px) rotate(10deg); } 60% { transform: translateX(-5px) scale(.9); } 80% { transform: translateX(4px); } }
  @keyframes rtBurst { from { opacity: 1; transform: translate(0,0) scale(.6); } to { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.3) rotate(var(--r)); } }
  @media (prefers-reduced-motion: reduce) { #rtOv *, #rtBox { animation: none !important; } }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- اللوحة ---------- */
  let ov = null, choice = '', myNote = '';
  function floaters(n, set) { let h = ''; for (let i = 0; i < n; i++) h += '<i style="left:' + (Math.random() * 96) + '%;font-size:' + (14 + Math.random() * 20) + 'px;animation-duration:' + (5 + Math.random() * 6) + 's;animation-delay:' + (-Math.random() * 10) + 's">' + set[i % set.length] + '</i>'; return h; }
  function burst(el, set) { const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; for (let i = 0; i < 16; i++) { const s = document.createElement('span'); s.className = 'rtBurst'; s.textContent = set[i % set.length]; const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 110; s.style.left = (cx - 13) + 'px'; s.style.top = (cy - 13) + 'px'; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d - 40 + 'px'); s.style.setProperty('--r', (Math.random() * 120 - 60) + 'deg'); document.body.appendChild(s); setTimeout(() => s.remove(), 1200); } }
  function close() { if (ov) ov.hidden = true; }
  function build() {
    if (ov) return; ov = document.createElement('div'); ov.id = 'rtOv'; ov.hidden = true;
    ov.innerHTML = '<div id="rtBox"><div id="rtFl"></div><button id="rtX" type="button" aria-label="سكّر">✕</button><div id="rtIn"></div></div>';
    document.body.appendChild(ov); ov.addEventListener('click', e => { if (e.target === ov) { close(); snooze(); } }); $q('rtX').onclick = () => { sndTap(); close(); snooze(); };
  }
  function show() {
    build(); choice = ''; $q('rtFl').innerHTML = floaters(18, ['❤️', '💖', '✨', '💕', '⭐', '💗']);
    $q('rtIn').innerHTML = '<div class="rtHi">👋</div><h2>شنو رأيك باللعبة؟</h2><div class="rtSub">رأيك يهمنا هواية، دوس على قلب 👇</div>' +
      '<div class="rtBtns"><button class="rtB love" type="button" data-v="love"><span class="em">❤️</span>حبيتها</button><button class="rtB no" type="button" data-v="no"><span class="em">💔</span>ما حبيتها</button></div>' +
      '<div class="rtNH" id="rtNH">💬 تعليق (اختياري — تعليق واحد بس لكل حساب)</div><textarea id="rtNote" maxlength="200" placeholder="اكتب رأيك أو فكرة للعبة..."></textarea>' +
      '<button id="rtSend" type="button" disabled>💌 ارسل التقييم</button><button id="rtLater" type="button">بعدين</button>';
    document.querySelectorAll('#rtIn .rtB').forEach(b => b.onclick = () => {
      choice = b.dataset.v; document.querySelectorAll('#rtIn .rtB').forEach(x => x.classList.toggle('on', x === b)); $q('rtSend').disabled = false;
      if (choice === 'love') { sndLove(); burst(b, ['❤️', '💖', '💕', '✨', '💗']); $q('rtFl').innerHTML = floaters(22, ['❤️', '💖', '💕', '💗', '✨']); }
      else { sndBroken(); burst(b, ['💔', '💧', '🥀', '😢']); $q('rtFl').innerHTML = floaters(16, ['💔', '💧', '🌧️', '🥀']); }
      try { navigator.vibrate && navigator.vibrate(choice === 'love' ? [30, 60, 30] : [80]); } catch (e) {}
    });
    if (myNote) { const t = $q('rtNote'); t.value = myNote; t.disabled = true; $q('rtNH').textContent = '💬 تعليقك المحفوظ (تعليق واحد بس لكل حساب)'; }
    $q('rtLater').onclick = () => { sndTap(); close(); snooze(); };
    $q('rtSend').onclick = async () => {
      if (!choice) return; const b = $q('rtSend'); b.disabled = true; b.textContent = '⏳ لحظة...';
      try {
        const r = await post('/api/rate', { dev, v: choice, note: $q('rtNote').value });
        LS.s('flappyRated', choice); myNote = r.note || ''; if (r.noteLocked) toast('💬 عندك تعليق من قبل، يبقى نفسه (تعليق واحد لكل حساب)');
        $q('rtIn').innerHTML = '<div class="rtThanks">' + (choice === 'love' ? '🥰' : '🙏') + '</div><h2>' + (choice === 'love' ? 'شكراً! فرحتنا ❤️' : 'شكراً لصراحتك 💜') + '</h2><div class="rtSub">' + (choice === 'love' ? 'كمّل لعب وانطي اللعبة لأصدقائك 🎮' : 'راح نشتغل حتى تصير أحلى، ارسل أفكارك للمطور') + '</div><button id="rtSend" type="button">👌 تمام</button>';
        $q('rtSend').onclick = close; if (choice === 'love') sndLove(); $q('rtFl').innerHTML = floaters(24, choice === 'love' ? ['❤️', '🎉', '💖', '✨', '🥳'] : ['💜', '✨', '🌱']);
      } catch (e) { b.disabled = false; b.textContent = '💌 ارسل التقييم'; toast('⚠️ ' + (e.message || 'ما وصل، جرب مرة ثانية')); }
    };
    ov.hidden = false;
  }
  window.rateOpen = async () => { try { const a = A(); const r = await fetch('/api/rate/me?dev=' + dev, { headers: hdr(), cache: 'no-store' }).then(x => x.json()); myNote = (r.r && r.r.note) || ''; } catch (e) {} show(); };

  /* ---------- لوحة المشرفين: كم زائر وكم قلب ---------- */
  window.rateStats = async () => {
    build(); $q('rtFl').innerHTML = floaters(14, ['❤️', '💔', '⭐', '✨']); $q('rtIn').innerHTML = '<div id="rsBox"><h2>⭐ تقييمات اللعبة</h2><div class="rtSub">⏳ دا أحمّل...</div></div>'; ov.hidden = false;
    try {
      const s = await api('/api/admin/stats'), tot = s.love + s.no, pc = tot ? Math.round(s.love / tot * 100) : 0;
      const esc = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      let h = '<h2>⭐ تقييمات اللعبة</h2><div class="rtSub">من ' + new Date(s.since).toLocaleDateString('ar-IQ') + '</div><div class="rsGrid">' +
        '<div class="rsC"><b>' + s.visitors + '</b><small>👥 لاعب دخل اللعبة</small></div><div class="rsC"><b>' + s.today + '</b><small>📅 دخلوا آخر 24 ساعة</small></div>' +
        '<div class="rsC"><b>❤️ ' + s.love + '</b><small>حبوها</small></div><div class="rsC"><b>💔 ' + s.no + '</b><small>ما حبوها</small></div></div>' +
        '<div class="rsBar"><i style="width:' + pc + '%"></i><u></u></div><div class="rtSub">' + (tot ? pc + '% حبوها من ' + tot + ' تقييم' : 'ماكو تقييمات بعد') + ' • 🧾 ' + s.accounts + ' حساب</div><div class="rsL">';
      s.recent.forEach(x => { h += '<div class="rsI">' + (x.v === 'love' ? '❤️' : '💔') + ' ' + (x.note ? esc(x.note) : '<i style="opacity:.6">بدون تعليق</i>') + '<small>' + (x.name ? '👤 ' + esc(x.name) : '👻 ضيف') + ' • ' + new Date(x.ts).toLocaleString('ar-IQ') + '</small></div>'; });
      $q('rtIn').innerHTML = '<div id="rsBox">' + h + '</div></div><button id="rtSend" type="button">👌 تمام</button>'; $q('rtSend').onclick = close;
    } catch (e) { $q('rtIn').innerHTML = '<div id="rsBox"><h2>⭐ تقييمات اللعبة</h2><div class="rtSub">⚠️ ' + (e.message || 'خطأ') + '</div></div>'; }
  };
  // زر ⭐ بلوحة المشرفين + زر التقييم بصفحة المطور
  function addBtns() {
    const hd = $q('alHead'); if (hd && !$q('alStat') && isAdm()) { const b = document.createElement('button'); b.type = 'button'; b.id = 'alStat'; b.title = 'التقييمات وعدد اللاعبين'; b.textContent = '⭐'; b.onclick = e => { e.stopPropagation(); window.rateStats(); }; const x = $q('alClr'); hd.insertBefore(b, x || null); }
    const dc = document.querySelector('#pg-dev .devCard'); if (dc && !$q('devRate')) { const b = document.createElement('button'); b.type = 'button'; b.id = 'devRate'; b.className = 'devRate'; b.textContent = '❤️ قيّم اللعبة'; b.onclick = () => window.rateOpen(); dc.appendChild(b); }
    const dc2 = document.querySelector('#pg-dev .devCard'); if (dc2 && isAdm() && !$q('devStats')) { const b = document.createElement('button'); b.type = 'button'; b.id = 'devStats'; b.className = 'devRate'; b.style.background = 'linear-gradient(135deg,#ffb020,#ff6a3a)'; b.textContent = '⭐ التقييمات وعدد اللاعبين (للمشرفين)'; b.onclick = () => window.rateStats(); dc2.appendChild(b); }
  }

  /* ---------- عدّاد الـ4 دقايق ---------- */
  const NEED = 240; let sec = +(LS.g('flappyRateSec') || 0) || 0, snoozedUntil = 0, visited = false;
  function snooze() { if (!LS.g('flappyRated')) { snoozedUntil = sec + NEED; LS.s('flappyRateSnz', String(snoozedUntil)); } }
  snoozedUntil = +(LS.g('flappyRateSnz') || 0) || 0;
  async function visit() { if (visited) return; visited = true; try { const r = await post('/api/visit', { dev }); if (r.rated) LS.s('flappyRated', LS.g('flappyRated') || '1'); } catch (e) { visited = false; } }
  setInterval(() => {
    addBtns(); if (!visited && navigator.onLine) visit();
    if (document.hidden || $q('splash') || $q('langPick')) return;
    sec++; if (sec % 5 === 0) LS.s('flappyRateSec', String(sec));
    if (LS.g('flappyRated') || sec < NEED || sec < snoozedUntil || (ov && !ov.hidden) || !navigator.onLine) return;
    if (window.curPage === 'run' || window.curPage === 'sus' || document.fullscreenElement || document.webkitFullscreenElement) return;   // ما نقاطع وسط اللعب
    snoozedUntil = sec + NEED; window.rateOpen();
  }, 1000);
})();
