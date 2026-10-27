/* فجّر الكرات الملونة: بالشاشة الرئيسية صارت بطاقة بنفس حجم باقي الألعاب، وكل شي (المتجر، السكنات، المراحل، المناطق، اكسب عملات،
   فردي/زوجي، الموسيقى، ابدأ اللعب) صار داخل قائمة اللعبة اللي تنفتح قبل ما تبدي */
(function () {
  'use strict';
  const card = document.getElementById('gameCard'); if (!card) return;
  const css = document.createElement('style'); css.textContent = `
  .gqRow > .tileBalls, .tileBalls { flex: 1 !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; background: linear-gradient(120deg, #0b5a3e 0%, #12925f 55%, #2ee48d 120%) !important; height: auto !important; }
  .tileBalls { flex: 1; min-width: 0; display: flex; flex-direction: row; align-items: center; gap: 10px; padding: 14px 14px 18px !important; min-height: 92px; margin: 4px 0 8px; border-radius: 20px; border: 2px solid #8ff0c0; color: #fff; text-align: right; position: relative; overflow: hidden; cursor: pointer;
    background: linear-gradient(120deg, #0b5a3e 0%, #12925f 55%, #2ee48d 120%); box-shadow: 0 8px 24px rgba(30,200,130,.38), inset 0 1px 0 rgba(255,255,255,.35); font-family: inherit; }
  .tileBalls .bxNew { position: static !important; display: flex !important; flex-wrap: wrap; gap: 6px; margin-bottom: 3px; } .tileBalls .bxNew i { font-style: normal; font-size: 11px; font-weight: 800; padding: 2px 9px; border-radius: 999px; background: #ffd166; color: #3a2200; } .tileBalls .bxNew i.b { background: rgba(0,0,0,.35); color: #bfffe0; }
  .tileBalls .bxEm { font-size: 34px; filter: drop-shadow(0 3px 4px rgba(0,0,0,.35)); animation: bxBob 2s ease-in-out infinite; }
  .tileBalls .bxTx { flex: 1; min-width: 0; display: flex !important; flex-direction: column !important; align-items: flex-start; gap: 3px; } .tileBalls .bxTx .tl { font-size: 17px; font-weight: 800; line-height: 1.35; white-space: normal; position: static !important; } .tileBalls .bxTx small { line-height: 1.5; position: static !important; } .tileBalls .bxTx small { font-size: 12px; opacity: .9; }
  .tileBalls .bxGo { flex-shrink: 0; position: static !important;  background: #fff; color: #0b5a3e; font-weight: 800; font-size: 15px; padding: 10px 14px; border-radius: 14px; box-shadow: 0 4px 0 rgba(0,0,0,.2); white-space: nowrap; }
  .tileBalls .bxBalls { position: absolute; left: 0; right: 0; bottom: 4px; height: 14px; pointer-events: none; opacity: .9; }
  .tileBalls .bxBalls b { position: absolute; width: 12px; height: 12px; border-radius: 50%; bottom: 0; animation: bxRoll 9s linear infinite; box-shadow: inset -2px -3px 4px rgba(0,0,0,.35), inset 2px 2px 3px rgba(255,255,255,.7); }
  @keyframes bxRoll { from { transform: translateX(-30px); } to { transform: translateX(110vw); } } @keyframes bxBob { 50% { transform: translateY(-4px) rotate(-6deg); } }
  #gameCard.bh { display: none !important; position: fixed !important; inset: 0 !important; z-index: 25 !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; overflow-y: auto !important; max-width: none !important; width: auto !important;
    padding: calc(env(safe-area-inset-top, 0px) + 10px) 16px calc(env(safe-area-inset-bottom, 0px) + 22px) !important; gap: 12px !important; background: radial-gradient(120% 70% at 50% 0%, #2ee48d 0%, #0f7a52 45%, #06301f 100%) !important; box-shadow: none !important; -webkit-overflow-scrolling: touch; }
  #gameCard.bh.open { display: flex !important; }
  #gameCard.bh > * { width: 100%; max-width: 560px; margin-left: auto; margin-right: auto; }
  #bhTop { display: flex; align-items: center; gap: 10px; margin-top: 34px; } #bhTop b { flex: 1; text-align: center; font-size: 18px; color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,.35); }
  #bhBack { background: rgba(0,0,0,.3); color: #fff; border: 2px solid rgba(255,255,255,.6); border-radius: 14px; padding: 8px 14px; font: 800 14px inherit; font-family: inherit; cursor: pointer; } #bhTop .sp { width: 76px; }
  #bhHero { display: block; height: 150px; border-radius: 22px; background: linear-gradient(180deg, rgba(255,255,255,.14), rgba(0,0,0,.18)); border: 1px solid rgba(255,255,255,.25); }
  #gameCard.bh #gHead { display: none; }
  #gameCard.bh .gTiles { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; }
  #gameCard.bh #playNow { font-size: 20px !important; padding: 16px !important; border-radius: 18px !important; }
  `; document.head.appendChild(css);

  // القائمة: نخلي البطاقة نفسها شاشة كاملة (حتى كل الأزرار تبقى تشتغل مثل ما هي)
  card.classList.add('bh');
  const top = document.createElement('div'); top.id = 'bhTop'; top.innerHTML = '<button id="bhBack" type="button">→ رجوع</button><b>🎯 فجّر الكرات الملونة</b><span class="sp"></span>';
  const hero = document.createElement('canvas'); hero.id = 'bhHero'; card.prepend(top, hero);

  // البطاقة الصغيرة بالشاشة الرئيسية
  const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'tile tileBalls'; tile.id = 'ballTile';
  tile.innerHTML = '<span class="bxEm">🎯</span><span class="bxTx"><span class="bxNew"><i>✨ HD</i><i class="b">👥 فردي وزوجي</i></span><span class="tl">فجّر الكرات الملونة</span><small>كوّن ثلاث متشابهة وفجّرها قبل الحفرة 💥</small></span><span class="bxGo">العب ◀</span><span class="bxBalls"></span>';
  const cols = ['#ff4d6d', '#ffd23f', '#3ddc84', '#3da5ff', '#b36bff', '#ff9f1c']; const bb = tile.querySelector('.bxBalls');
  for (let i = 0; i < 9; i++) { const b = document.createElement('b'); b.style.background = cols[i % 6]; b.style.animationDelay = (-i * 0.75) + 's'; bb.appendChild(b); }
  card.parentNode.insertBefore(tile, card);

  let raf = 0;
  function open() { card.classList.add('open'); document.body.style.overflow = 'hidden'; card.scrollTop = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(heroLoop); try { if (typeof unlockAudio === 'function') unlockAudio(); } catch (e) {} }
  function close() { card.classList.remove('open'); document.body.style.overflow = ''; cancelAnimationFrame(raf); }
  window.ballHubOpen = open; window.ballHubClose = close;
  tile.onclick = open; top.querySelector('#bhBack').onclick = close;

  // لوحة متحركة فوق: سلسلة كرات HD تتدحرج
  function heroLoop(t) {
    const r = hero.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1); if (r.width < 10) { raf = requestAnimationFrame(heroLoop); return; }
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr); if (hero.width !== w || hero.height !== h) { hero.width = w; hero.height = h; }
    const g = hero.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); const W = r.width, H = r.height; g.clearRect(0, 0, W, H);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 30; g.lineCap = 'round'; g.beginPath(); for (let x = -20; x <= W + 20; x += 8) g.lineTo(x, H * 0.55 + Math.sin(x / 60) * 22); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 24; g.stroke();
    const sp = t / 1000 * 40; let sc = 0;
    for (let i = 0; i < 26; i++) { const x = ((i * 26 + sp) % (W + 80)) - 40, y = H * 0.55 + Math.sin(x / 60) * 22, c = (i * 7 + Math.floor(i / 3)) % 6;
      try { const s = ballSprite(BASE_COL[c] || cols[c], BASE_DARK[c] || '#333', 11); const k = s.S * (11 / 11); g.drawImage(s.k, x - k / 2, y - k / 2 + s.oy, k, k); } catch (e) { g.fillStyle = cols[c]; g.beginPath(); g.arc(x, y, 11, 0, 6.28); g.fill(); } }
    g.font = 'bold 15px Cairo, system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 6; g.fillText('أطلق • طابق 3 • فجّر 💥', W / 2, 26); g.shadowBlur = 0;
    if (card.classList.contains('open')) raf = requestAnimationFrame(heroLoop);
  }
  // لما يطلع من اللعب (شاشة كاملة) يرجع للقائمة، ورجوع الأندرويد/المتصفح يسكّرها
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && card.classList.contains('open') && !document.body.classList.contains('full')) close(); });
})();
