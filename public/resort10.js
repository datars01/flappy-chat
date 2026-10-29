/* =====================================================================
   resort10 — تحسينات المنتجع:
   1) فلت مسكة الإيد تلقائياً عند ركوب أي لعبة/نوم/طاولة لعب (الأبواب والمحلات تبقى المسكة)
   2) المشرفين يسافرون سوه بالمطار ✈️
   3) زر السجل 📜 ظاهر دائماً فوك الشات (صغير ولطيف وما يسد الشاشة)
   4) موسيقى خاصة لمحل «روح للحقائب» (مختلفة عن صالون المكياج)
   5) قياس الحقيبة على شخصيتك قبل الشراء 🪞
   ===================================================================== */
(function () {
  const $ = id => document.getElementById(id);

  /* ---------- 1) مسكة الإيد: تنفلت عند الألعاب بس ---------- */
  const GAME_SEATS = ['gtable', 'ltable', 'swing', 'swing2'];
  function holdFree(why) { try { if (RM.holds && RM.holds[rmMe()]) { rmSend({ t: 'rm_hold', on: 0 }); showToast('✋ ' + (why || 'انفلتت مسكة الإيد حتى تلعبون براحتكم')); } } catch (e) {} }
  const sdO = rmSetDance; rmSetDance = function (e) { e = e | 0; try { if (e && (e === 39 || rmRideOf({ dance: e }))) holdFree(e === 39 ? 'انفلتت مسكة الإيد — نوم الهنا 😴' : 'انفلتت مسكة الإيد حتى تركبون اللعبة براحتكم 🎢'); } catch (er) {} return sdO(e); };
  const sitO = rmSitAt; rmSitAt = function (sp) { try { const k = sp && sp.seat && sp.seat.kind; if (GAME_SEATS.includes(k)) holdFree('انفلتت مسكة الإيد حتى تلعبون براحتكم 🎲'); } catch (er) {} return sitO(sp); };

  /* ---------- 2) ✈️ المشرفين يسافرون سوه ---------- */
  if (typeof r3Fly === 'function') {
    const flyO = r3Fly; r3Fly = function (back) { try { if (RM.myAdm && !R3.flying && !R3.coFly) rmSend({ t: 'rm_ap_co', back: back ? 1 : 0 }); } catch (e) {} R3.coFly = false; return flyO(back); };
    const arrO = r3Arrive; r3Arrive = function (back) { const r = arrO(back); try { if (R3.coArr) { R3.coArr = false; const m = RM.me; m.x = m.tx = m.x + 46; m.dir = -1; } } catch (e) {} return r; };
    const msgO = rmXMsg; rmXMsg = function (T, d) {
      if (T === 'rm_ap_cofly') { try {
        if (R3.flying) return; const sid = rmShopId(), back = !!d.back;
        if (back ? sid !== 8 : sid === 8) return;   // أصلاً بنفس المكان
        if (RM.gTb !== null && RM.gTb !== undefined) { showToast('✈️ ' + d.by + ' سافر — إنت بطاولة لعب، تكدر تلحكه بعدين'); return; }
        const m = RM.me; if (m.sit) rmStand(); if (m.dance) sdO(0); m.goal = false; m.jump = null;
        R3.coFly = true; R3.coArr = true; showToast('✈️ ' + d.by + ' طيّرك وياه — تسافرون سوه 💜'); r3Fly(back);
      } catch (e) {} return; }
      return msgO(T, d);
    };
  }

  /* ---------- 3) زر السجل الظاهر فوك الشات ---------- */
  function pillCss() { if ($('r10Css')) return; const st = document.createElement('style'); st.id = 'r10Css'; st.textContent = `
    #rmLogPill{position:absolute;right:10px;bottom:52px;z-index:12;display:flex;align-items:center;gap:4px;height:28px;padding:0 11px 0 9px;border-radius:999px;border:1.5px solid rgba(255,255,255,.85);background:linear-gradient(135deg,rgba(122,42,216,.88),rgba(255,90,168,.85));color:#fff;font:800 12px Cairo,system-ui,sans-serif;box-shadow:0 4px 14px rgba(60,10,120,.35);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);pointer-events:auto;cursor:pointer;transition:transform .15s}
    #rmLogPill:active{transform:scale(.92)} #rmLogPill.on{background:linear-gradient(135deg,#3a1a6a,#7a2ad8)}
    #rmLogPill b{min-width:16px;height:16px;padding:0 4px;border-radius:9px;background:#fff;color:#c2185b;font-size:10px;line-height:16px;text-align:center;animation:r10pop .5s ease} #rmLogPill b[hidden]{display:none}
    @keyframes r10pop{0%{transform:scale(0)}70%{transform:scale(1.25)}100%{transform:scale(1)}}
    #rmBox #rmLogP{bottom:86px} #rmBox.rmTiny #rmLogP{bottom:84px} #rmBox.rmTiny #rmLogPill{bottom:48px}
    .htR.htAdm{background:linear-gradient(135deg,#2a0a52,#6a22d6)!important;color:#fff!important;border:2px solid #ffd23f!important;box-shadow:0 0 18px rgba(170,80,255,.55)}
    .htR.htAdm b{color:#ffe680!important}.htR.htAdm small{color:#f0e0ff!important}
    #salonShop .slAdmT{background:linear-gradient(135deg,#ffd76a,#a453ff)!important;color:#fff!important;font-weight:800}
    #salonShop .slAdmT.on{box-shadow:0 0 12px rgba(170,80,255,.7)}
    #salonShop .slAdmH{grid-column:1/-1;padding:7px 10px;border-radius:12px;background:linear-gradient(110deg,#ffe9a8,#e8c8ff);color:#5a1aa8;font-weight:800;font-size:12px;text-align:center}
    .ruhFit{position:relative;flex:0 0 auto;flex-shrink:0;margin:6px 8px 4px;height:150px;min-height:150px;border-radius:16px;overflow:hidden;background:linear-gradient(170deg,#fff0f7,#ffd6e8);border:2px solid #ffb0d0;box-shadow:inset 0 0 18px rgba(255,255,255,.8)}
    .ruhFit canvas{width:100%;height:100%;display:block}
    .ruhFit span{position:absolute;top:5px;right:8px;left:8px;text-align:center;font:800 11.5px Cairo,system-ui,sans-serif;color:#a0306a;pointer-events:none}`; document.head.appendChild(st); }
  RM.logSeen = 0;
  function pillMake() { const box = $('rmBox'); if (!box) return null; let b = $('rmLogPill'); if (b) return b; pillCss(); b = document.createElement('button'); b.type = 'button'; b.id = 'rmLogPill'; b.setAttribute('aria-label', 'سجل الشات'); b.innerHTML = '📜 <span>السجل</span><b hidden></b>'; b.onclick = e => { e.stopPropagation(); try { $('rmLogBtn').onclick(); } catch (er) {} pillUpd(); try { sfx('click'); } catch (er) {} }; box.appendChild(b); return b; }
  function pillUpd() { const b = pillMake(); if (!b) return; const n = (RM.log || []).length; if (RM.logOpen) RM.logSeen = n; if (RM.logSeen > n) RM.logSeen = n; const un = n - RM.logSeen; b.classList.toggle('on', !!RM.logOpen); b.querySelector('span').textContent = RM.logOpen ? 'سكّر السجل' : 'السجل'; const bd = b.querySelector('b'); if (!RM.logOpen && un > 0) { bd.hidden = false; bd.textContent = un > 99 ? '99+' : un; } else bd.hidden = true; }
  const rlO = rmRenderLog; rmRenderLog = function () { const r = rlO.apply(this, arguments); try { pillUpd(); } catch (e) {} return r; };
  const stO = rmOnMsg; rmOnMsg = function (d) { const r = stO(d); try { if (d && d.t === 'rm_state') { RM.logSeen = (RM.log || []).length; pillUpd(); } } catch (e) {} return r; };
  setTimeout(() => { try { pillUpd(); } catch (e) {} }, 500);

  /* ---------- 4) موسيقى محل الحقائب 👜: بوب كيوت مرح (ماريمبا + تصفيق + باص نطّاط) ---------- */
  window.SM5_ST = 60 / 118 / 2;
  const S5_CH = [[65, 69, 72], [62, 65, 69], [67, 71, 74], [64, 67, 72]], S5_BS = [41, 38, 43, 36];
  const S5_MEL = [77, 0, 81, 79, 77, 0, 74, 0, 72, 74, 77, 0, 79, 0, 0, 0, 74, 0, 77, 74, 72, 0, 69, 0, 71, 72, 74, 0, 79, 0, 77, 0];
  const S5_MEL2 = [84, 0, 81, 0, 79, 81, 84, 0, 86, 0, 84, 81, 79, 0, 0, 0, 77, 79, 81, 0, 79, 77, 74, 0, 76, 0, 79, 0, 84, 0, 0, 0];
  function mar(n, t, v) { try { smSoft('sine', n, t, 0.32, v, 0.004); smSoft('triangle', n + 12, t, 0.12, v * 0.35, 0.003); } catch (e) {} }
  window.smStep5 = function (i, t) {
    const st = i % 8, bar = Math.floor(i / 8) % 4, ch = S5_CH[bar], lp = RM_SM.loop, ST = window.SM5_ST;
    if (st === 0 || st === 3 || st === 6) smSoft('triangle', S5_BS[bar] + (st === 3 ? 12 : 0), t, ST * 1.6, 0.075, 0.01);
    if (st === 2 || st === 6) { smNoise(t, 0.06, 0.07, 1800); smNoise(t + 0.012, 0.05, 0.05, 2600); }   // تصفيق
    if (st % 2 === 1) smNoise(t, 0.02, 0.025, 8000);
    if (st === 0) ch.forEach(n => smSoft('sine', n + 12, t, ST * 7.6, 0.012, 0.3));
    if (st === 4 || st === 7) ch.forEach((n, k) => mar(n + 12, t + k * 0.03, 0.022));
    const m = (lp % 2 ? S5_MEL2 : S5_MEL)[i % 32]; if (m) mar(m, t, 0.06);
  };

  /* ---------- 5) 🪞 قياس الحقيبة على شخصيتك قبل الشراء ---------- */
  function drawFit(g, W, H, bag, T) {
    g.clearRect(0, 0, W, H); const av = (RM.me && RM.me.av) || AVT.DEF;
    // مراية + لمعة + أرضية
    const fl = g.createRadialGradient(W / 2, H - 8, 4, W / 2, H - 8, W / 2); fl.addColorStop(0, 'rgba(255,150,200,.35)'); fl.addColorStop(1, 'rgba(255,150,200,0)'); g.fillStyle = fl; g.fillRect(0, H - 30, W, 30);
    for (let k = 0; k < 6; k++) { const a = 0.5 + 0.5 * Math.sin(T / 12 + k * 1.3); g.globalAlpha = a * 0.8; g.fillStyle = '#fff'; g.font = '9px sans-serif'; g.textAlign = 'center'; g.fillText('✦', 14 + (k * 53) % (W - 20), 26 + (k * 37) % (H - 50)); } g.globalAlpha = 1;
    const s = Math.min(2.2, (H - 30) / 72);
    [[W * 0.33, 1], [W * 0.67, -1]].forEach(([x, d]) => { const y = H - 8; g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(x, y, 20 * s, 4 * s, 0, 0, 7); g.fill();
      g.save(); g.translate(x, y); g.scale(d * s, s); try { AVT.drawAt(g, av, 0, 0, AV_H, { t: T }); } catch (e) {} if (bag) try { rmBagItem(g, bag, 0, 0, T); } catch (e) {} g.restore(); });
  }
  function fitLoop() { const P = $('ruhShop'), F = P && P.querySelector('.ruhFit'); if (!F || P.style.display === 'none') { RM.fitRaf = 0; return; } const cv = F.querySelector('canvas'), dp = Math.min(2, window.devicePixelRatio || 1), W = F.clientWidth || 280, H = F.clientHeight || 150; if (cv.width !== Math.round(W * dp)) { cv.width = Math.round(W * dp); cv.height = Math.round(H * dp); } const g = cv.getContext('2d'); g.setTransform(dp, 0, 0, dp, 0, 0); const W0 = (RM.me.wear || {}).bag; drawFit(g, W, H, RM.ruhSel || W0 || '', (RM.T || performance.now() / 16)); RM.fitRaf = requestAnimationFrame(fitLoop); }
  if (typeof rmRuhRender === 'function') {
    const rrO = rmRuhRender; rmRuhRender = function () { const r = rrO.apply(this, arguments); try { const P = $('ruhShop'); if (P && P.style.display !== 'none') { pillCss(); let F = P.querySelector('.ruhFit'); if (!F) { F = document.createElement('div'); F.className = 'ruhFit'; F.innerHTML = '<canvas></canvas><span></span>'; const hd = P.querySelector('.spH'); hd.parentNode.insertBefore(F, hd.nextSibling); } const k = RM.ruhSel || (RM.me.wear || {}).bag, w = k && RM_WEARD[k]; F.querySelector('span').textContent = w ? '🪞 دا تقيسين «' + w.n + '» على شخصيتج' + (rmWearOwned(k) ? '' : ' — قبل لا تشترين 💖') : '🪞 المراية: دوسي على أي حقيبة وتطلع عليج هنا'; if (!RM.fitRaf) RM.fitRaf = requestAnimationFrame(fitLoop); } } catch (e) {} return r; };
  }
  if (typeof rmWearDlg === 'function') {
    const dlO = rmWearDlg; rmWearDlg = function (w, mode) { const r = dlO(w, mode); try { if (w && w.s === 'bag') { const S = $('ruhShop'), cv = S && S.querySelector('.spDlg canvas'); if (cv) { const t0 = performance.now(); const lp = () => { if (!cv.isConnected) return; const g = cv.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); drawFit1(g, 76, 92, w.k, (performance.now() - t0) / 16.7); requestAnimationFrame(lp); }; lp(); } } } catch (e) {} return r; };
  }
  function drawFit1(g, W, H, bag, T) { g.clearRect(0, 0, W, H); const av = (RM.me && RM.me.av) || AVT.DEF, s = (H - 6) / 74; g.save(); g.translate(W / 2 - 3, H - 3); g.scale(s, s); try { AVT.drawAt(g, av, 0, 0, AV_H, { t: T }); } catch (e) {} try { rmBagItem(g, bag, 0, 0, T); } catch (e) {} g.restore(); }
})();
