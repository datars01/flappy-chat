/* ===================== لعبة «غوكو» 🎲 — السيرفر =====================
   طاولة بـ 4 مقاعد (أحمر، أخضر، أصفر، أزرق). تبدأ اللعبة بلاعبين أو أكثر (مو لازم تكتمل 4 مقاعد).
   السيرفر هو الحَكَم: يرمي النرد، يتحقق من الحركات، ويقرر الفائز.
   الأوضاع: عادي (4 قطع) • سريع (قطعتين) • فرق 2 ضد 2 (الأحمر+الأصفر ضد الأخضر+الأزرق).
   كمبيوتر 🤖 يلعب إذا ما اكو ناس، أو يكمّل محل اللي طلع. مؤقت 15 ثانية للدور. رجوع للعبة بعد انقطاع النت. */
'use strict';
module.exports = function ludoInit(ctx) {
  const { db, save, send, crypto, alog } = ctx; const onTable = ctx.onTable || (() => {});   // onTable: يبلّغ المنتجع بحالة طاولة الغوكو
  const SEATS = 4, MIN_P = 2, CD_MS = 3000, TURN_MS = 15000, BOT_MS = 1100, OFF_MS = 2600, GRACE_MS = 60000, OVER_MS = 15000;
  const TRACK = 52, LANE_END = 56;                       // مواقع الحجر: -1 قاعدة، 0..50 مسار، 51..55 ممر البيت، 56 وصل
  const START = [0, 13, 26, 39];                         // خانة بداية كل لون على المسار
  const SAFE = new Set([0, 13, 26, 39, 8, 21, 34, 47]);  // خانات البداية + النجوم (ما ينأكل فيها حجر)
  const MODES = ['classic', 'quick', 'team'];
  /* جوائز: برّا = عملات 🪙 • بالمنتجع = دولار المنتجع 💵 • ويا الكمبيوتر = جائزة صغيرة (10 ألعاب باليوم) */
  const COIN_RW = [20, 10, 5], USD_RW = [3, 1, 0], TEAM_COIN = 20, TEAM_USD = 2, BOT_COIN = 5, BOT_USD = 1, BOT_DAY_MAX = 10;
  /* سكنات تنشرى بالعملات 🪙 */
  const SKINS = { p_crown: 60, p_cat: 80, p_shades: 100, p_neon: 140, p_gold: 200, d_red: 50, d_wood: 60, d_candy: 70, d_night: 90, d_gold: 120 };
  const BOT_NAMES = ['روبو', 'زرزور', 'بطوط', 'سمسم', 'كوكو', 'فلفل'];
  const L = new Map();                                   // id → طاولة
  let joinSeq = 0;                                       // ترتيب الدخول (أول واحد دخل = الهوست)
  const rnd = n => crypto.randomInt(n);
  const now = () => Date.now();
  const nameOf = ws => (db.users[ws.key] && db.users[ws.key].name) || '؟';
  const absOf = (seat, pos) => (START[seat] + pos) % TRACK;
  const nTk = l => l.mode === 'quick' ? 2 : 4;
  const fresh = l => Array(nTk(l)).fill(-1);
  const isAuto = p => !!(p && (p.bot || p.off));
  const mate = (l, a, b) => l.mode === 'team' && a !== b && a % 2 === b % 2;
  const dayNum = () => Math.floor((now() + 3 * 3600e3) / 864e5);   // يوم بتوقيت بغداد

  const seatedCount = l => l.seats.filter(Boolean).length;
  const liveSeats = l => l.seats.map((p, i) => (p && !p.left ? i : -1)).filter(i => i >= 0);
  const humanSeats = l => liveSeats(l).filter(i => !l.seats[i].bot);
  const lobbyOf = ws => { for (const l of L.values()) if (l.seats.some(p => p && p.ws === ws && !p.left)) return l; return null; };
  const seatOf = (l, ws) => l.seats.findIndex(p => p && p.ws === ws && !p.left);
  const earliest = l => l.seats.filter(p => p && !p.left && !p.bot && !p.off).sort((a, b) => (a.at || 0) - (b.at || 0))[0] || l.seats.filter(p => p && !p.left && !p.bot).sort((a, b) => (a.at || 0) - (b.at || 0))[0];

  function skinsOf(key) {
    const u = db.users[key]; if (!u) return { own: [], p: '', d: '' };
    const own = u.admin ? Object.keys(SKINS) : (Array.isArray(u.ludoOwn) ? u.ludoOwn : []);
    const sel = u.ludoSel || {}; return { own, p: own.includes(sel.p) ? sel.p : '', d: own.includes(sel.d) ? sel.d : '' };
  }
  const allReady = l => { const live = liveSeats(l); return live.length >= MIN_P && live.every(i => l.seats[i].bot || l.seats[i].rdy) && (l.mode !== 'team' || live.length === 4); };
  function pub(l, viewer) {
    const mine = viewer ? seatOf(l, viewer) : -1;
    return {
      id: l.id, code: l.priv ? l.code : '', priv: !!l.priv, tbl: !!l.table, mode: l.mode, nt: nTk(l), host: l.host, ph: l.ph, t: l.t ? Math.max(0, l.t - now()) : 0, tMax: l.tMax || TURN_MS,
      seats: l.seats.map((p, i) => p ? { n: p.name, left: !!p.left, host: p.key === l.host, me: i === mine, tk: p.tk, rank: p.rank || 0, rdy: !!(p.rdy || p.bot), bot: !!p.bot, off: !!p.off, sk: p.sk || '', dk: p.dk || '' } : null),
      ch: (l.chat || []).slice(-40), allRdy: allReady(l), turn: l.turn, dice: l.dice, rolled: l.rolled, movable: l.ph === 'play' && l.turn === mine ? l.movable : [], win: l.win, last: l.lastEv || null, my: mine
    };
  }
  function tablePub(l) { return l ? { ph: l.ph, turn: l.turn, dice: l.dice, win: l.win ? l.win.s : -1, seats: l.seats.map(p => p ? { n: p.name, left: !!p.left, tk: p.tk, bot: !!p.bot } : null) } : null; }
  function bc(l) { l.seats.forEach(p => { if (p && p.ws && p.ws.readyState === 1 && !p.left) send(p.ws, { t: 'ludo_state', s: pub(l, p.ws) }); }); if (l.table) onTable(l.rmId, tablePub(l)); }
  function drop(l) { L.delete(l.id); if (l.table) onTable(l.rmId, null); }
  function freeSeat(l, want) {
    const open = i => !l.seats[i] || (l.ph === 'lobby' && l.seats[i].bot);   // الإنسان ياخذ مكان الكمبيوتر بغرفة الانتظار
    if (Number.isInteger(want) && want >= 0 && want < SEATS && open(want)) return want;
    const order = seatedCount(l) === 1 ? [2, 1, 3, 0] : [0, 1, 2, 3];       // الثاني يجلس مقابل الأول افتراضياً
    return order.find(i => !l.seats[i]) ?? order.find(i => open(i));
  }
  function newLobby(ws, priv) {
    const id = 'l' + crypto.randomBytes(4).toString('hex'); let code;
    do { code = String(1000 + rnd(9000)); } while ([...L.values()].some(x => x.code === code));
    return { id, code, priv, host: ws.key, table: false, rmId: '', mode: 'classic', seats: [null, null, null, null], ph: 'lobby', t: 0, tMax: TURN_MS, turn: -1, dice: 0, rolled: false, movable: [], sixes: 0, win: null, lastEv: null, made: now() };
  }
  function sit(l, ws, want) {
    const i = freeSeat(l, want); if (i === undefined) return false;
    const nm = nameOf(ws), sk = skinsOf(ws.key);
    l.seats[i] = { key: ws.key, ws, name: nm, tk: fresh(l), left: false, rank: 0, rdy: false, at: ++joinSeq, sk: sk.p, dk: sk.d };
    const cnt = seatedCount(l); l.seats.forEach(q => { if (q && q.ws && q.ws !== ws && !q.left) send(q.ws, { t: 'ludo_join', n: nm, cnt, host: q.key === l.host }); });   // يبلّغ اللي قاعدين (وصاحب الطاولة) إن واحد دخل
    return true;
  }
  function botName(l) { const used = l.seats.filter(Boolean).map(p => p.name); const n = BOT_NAMES.find(x => !used.includes('🤖 ' + x)) || 'روبو'; return '🤖 ' + n; }
  function addBot(l, want) {
    const i = Number.isInteger(want) && want >= 0 && want < SEATS && !l.seats[want] ? want : [2, 1, 3, 0].find(k => !l.seats[k]); if (i === undefined) return false;
    l.seats[i] = { key: 'bot:' + crypto.randomBytes(3).toString('hex'), ws: null, name: botName(l), tk: fresh(l), left: false, rank: 0, rdy: true, bot: true, at: ++joinSeq, sk: '', dk: '' };
    return true;
  }
  function sysMsg(l, tx) { chatPush(l, { id: crypto.randomBytes(4).toString('hex'), s: -1, n: '🎲', tx, at: now(), sys: 1 }); }
  /* اللاعب طلع (أو انتهت مهلة رجوعه) وسط اللعبة: الكمبيوتر يكمّل محله */
  function toBot(l, i, why) {
    const p = l.seats[i]; if (!p || p.bot) return;
    const old = p.name; p.bot = true; p.sub = true; p.off = false; p.ws = null; p.rdy = true; p.key = 'bot:' + crypto.randomBytes(3).toString('hex'); p.name = '🤖 ' + old;
    sysMsg(l, '🤖 الكمبيوتر كمّل محل ' + old + (why ? ' (' + why + ')' : ''));
    if (!humanSeats(l).length) { drop(l); return true; }
    if (!l.seats.some(q => q && q.key === l.host)) { const h = earliest(l); if (h) l.host = h.key; }
    if (l.ph === 'play' && l.turn === i) l.t = Math.min(l.t || now() + BOT_MS, now() + BOT_MS);
    return false;
  }
  function removeP(l, ws) {
    const i = seatOf(l, ws); if (i < 0) return;
    const p = l.seats[i];
    if (l.ph === 'lobby') l.seats[i] = null;
    else if (l.ph === 'play') { if (toBot(l, i, 'طلع')) return; }
    else { p.left = true; p.ws = null; }
    if (!humanSeats(l).length) { drop(l); return; }
    if (l.host === p.key || !l.seats.some(q => q && q.key === l.host)) { const h = earliest(l); if (h) l.host = h.key; }
    bc(l);
  }
  /* انقطع النت وسط اللعبة: نحجز مقعده دقيقة، وأدواره تنلعب تلقائياً لين يرجع */
  function offline(l, ws) {
    const i = seatOf(l, ws); if (i < 0) return;
    const p = l.seats[i]; p.off = true; p.offAt = now(); p.ws = null;
    if (l.host === p.key) { const h = earliest(l); if (h && h.key !== p.key) l.host = h.key; }
    if (l.turn === i) l.t = Math.min(l.t, now() + OFF_MS);
    sysMsg(l, '📶 انقطع النت عند ' + p.name + ' — ننتظره دقيقة يرجع'); bc(l);
  }
  function reattach(ws) {
    if (!ws.key || ws.guest) return null;
    for (const l of L.values()) {
      const i = l.seats.findIndex(p => p && p.key === ws.key && !p.left && !p.bot && (p.off || !p.ws || p.ws.readyState !== 1));
      if (i < 0) continue; const p = l.seats[i];
      for (const o of L.values()) if (o !== l) { const j = seatOf(o, ws); if (j >= 0) removeP(o, ws); }
      const was = p.off; p.ws = ws; p.off = false; p.offAt = 0;
      if (was) sysMsg(l, '📶 رجع ' + p.name + ' للعبة 👋');
      if (l.ph === 'play' && l.turn === i && !l.rolled) { l.t = now() + TURN_MS; l.tMax = TURN_MS; }
      bc(l); return l;
    }
    return null;
  }
  function start(l) {
    if (liveSeats(l).length < MIN_P) return;
    l.seats.forEach((p, i) => { if (p && p.left) l.seats[i] = null; });
    l.seats.forEach(p => { if (p) { p.tk = fresh(l); p.rank = 0; p.rdy = false; } });
    const live = liveSeats(l); /* أول واحد دخل (صاحب الطاولة) هو اللي يبدي */ const hs = live.find(i => l.seats[i].key === l.host); l.turn = hs !== undefined ? hs : live[0]; l.ph = 'play'; l.dice = 0; l.rolled = false; l.movable = []; l.sixes = 0; l.win = null; l.lastEv = null; l.rank = 0; l.cdUntil = now() + CD_MS; l.t = now() + TURN_MS + CD_MS; l.tMax = TURN_MS + CD_MS;
    l.humStart = humanSeats(l).length; l.botStart = live.length - l.humStart; l.nStart = live.length;
    try { alog('🎲', 'بدت لعبة غوكو (' + ({ classic: 'عادي', quick: 'سريع', team: 'فرق' })[l.mode] + ') بـ ' + live.length + ' لاعبين' + (l.botStart ? ' منهم ' + l.botStart + ' كمبيوتر' : '')); } catch (e) {}
    bc(l);
  }
  function canMove(p, seat, k, d) {
    const pos = p.tk[k];
    if (pos === LANE_END) return false;
    if (pos === -1) return d === 6;
    return pos + d <= LANE_END;
  }
  function movables(l, d) { const p = l.seats[l.turn]; return p ? p.tk.map((_, k) => k).filter(k => canMove(p, l.turn, k, d)) : []; }
  function setTimer(l, ms) { l.t = now() + ms; l.tMax = ms; }
  function nextTurn(l, again) {
    const live = liveSeats(l).filter(i => !l.seats[i].rank);   // اللي خلّص كل أحجاره ما يلعب بعد
    if (!live.length) return;
    if (!again || !live.includes(l.turn)) { let i = l.turn; do { i = (i + 1) % SEATS; } while (!live.includes(i)); l.turn = i; l.sixes = 0; }
    l.dice = 0; l.rolled = false; l.movable = []; l.pass = false; l.auto = false;
    const p = l.seats[l.turn]; setTimer(l, p.bot ? BOT_MS : p.off ? OFF_MS : TURN_MS);
  }
  function roll(l, seat, byAuto) {
    l.dice = 1 + rnd(6); l.rolled = true; l.lastEv = { k: 'roll', s: seat, d: l.dice, id: (l.evId = (l.evId || 0) + 1) };
    if (l.dice === 6) l.sixes++; else l.sixes = 0;
    if (l.sixes >= 3) { l.lastEv.k = 'sixes'; nextTurn(l, false); l.t += 1200; return bc(l); }          // ثلاث ستات ورا بعض: يضيع الدور
    l.movable = movables(l, l.dice);
    if (!l.movable.length) { l.t = now() + 1900; l.pass = true; return bc(l); }              // ماكو حركة: يمر الدور بعد لحظة
    const p = l.seats[seat];
    if (byAuto || isAuto(p)) { l.auto = true; l.t = now() + (l.movable.length === 1 ? 1500 : 1800); }
    else if (l.t - now() < 6000) setTimer(l, 6000);              // المؤقت ما يرجع من الصفر، بس نضمن 6 ثواني للحركة
    bc(l);
  }
  /* عقل الكمبيوتر: ياكل > يوصل البيت > يطلّع حجر > يهرب من الخطر > يقف بخانة آمنة > يتقدم */
  function threatAt(l, seat, a) {
    if (SAFE.has(a)) return false;
    return l.seats.some((q, s) => q && !q.left && s !== seat && !mate(l, s, seat) && q.tk.some(qp => qp >= 0 && qp <= 50 && (() => { const dd = (a - absOf(s, qp) + TRACK) % TRACK; return dd >= 1 && dd <= 6; })()));
  }
  function bestMove(l) {
    const seat = l.turn, p = l.seats[seat], d = l.dice; let best = l.movable[0], bs = -1e9;
    l.movable.forEach(k => {
      const from = p.tk[k], to = from === -1 ? 0 : from + d; let sc = to;
      if (to === LANE_END) sc += 900;
      if (from === -1) sc += 600;
      if (to <= 50) {
        const a = absOf(seat, to);
        if (!SAFE.has(a)) l.seats.forEach((q, s) => { if (!q || s === seat || mate(l, s, seat)) return; q.tk.forEach(qp => { if (qp >= 0 && qp <= 50 && absOf(s, qp) === a) sc += 1000 + qp * 4; }); });
        if (SAFE.has(a)) sc += 220;
        if (threatAt(l, seat, a)) sc -= 380;
      } else sc += 260;
      if (from >= 0 && from <= 50 && threatAt(l, seat, absOf(seat, from))) sc += 300 + from * 2;
      sc += rnd(30);
      if (sc > bs) { bs = sc; best = k; }
    });
    return best;
  }
  function move(l, seat, k) {
    const p = l.seats[seat], d = l.dice; if (!canMove(p, seat, k, d)) return;
    let pos = p.tk[k], cap = 0, got = false; const from = pos, caps = [];
    if (pos === -1) pos = 0; else pos += d;
    p.tk[k] = pos;
    if (pos <= 50) {                                                   // أكل أحجار الخصم (إلا بالخانات الآمنة وإلا شريكك بالفرق)
      const a = absOf(seat, pos);
      if (!SAFE.has(a)) l.seats.forEach((q, s) => { if (!q || s === seat || mate(l, s, seat)) return; q.tk.forEach((qp, qk) => { if (qp >= 0 && qp <= 50 && absOf(s, qp) === a) { q.tk[qk] = -1; cap++; caps.push([s, qk, qp]); } }); });
    }
    if (pos === LANE_END) got = true;
    l.lastEv = { k: 'move', s: seat, tk: k, from, pos, cap, caps, home: got, id: (l.evId = (l.evId || 0) + 1) };
    if (cap) sysMsg(l, '💥 ' + p.name + ' أكل ' + caps.map(c => l.seats[c[0]].name).filter((v, i, a) => a.indexOf(v) === i).join(' و ') + '!');
    if (p.tk.every(x => x === LANE_END)) {
      p.rank = ++l.rank; l.lastEv.fin = p.rank;
      if (l.mode === 'team') { const pr = l.seats[(seat + 2) % SEATS]; if (pr && pr.rank) return finish(l, null, seat % 2); sysMsg(l, '🏁 ' + p.name + ' خلّص أحجاره! يلا شريكه يكمّل 💪'); }
      else { const rest = liveSeats(l).filter(i => !l.seats[i].rank); if (rest.length <= 1) return finish(l, null); sysMsg(l, ['', '🥇', '🥈', '🥉'][p.rank] + ' ' + p.name + ' خلّص بالمركز ' + ['', 'الأول', 'الثاني', 'الثالث'][p.rank] + '! اللعب مكمّل على باقي المراكز'); }
    }
    const again = d === 6 || cap > 0 || got;                         // 6 أو أكل أو وصول = دور إضافي
    nextTurn(l, again && !p.rank); bc(l);
  }
  function progress(p) { return p.tk.reduce((a, x) => a + (x < 0 ? 0 : x + 1), 0); }
  function giveRw(l, i, coins, usd) {
    const p = l.seats[i]; if (!p || p.bot || p.left) return '';
    const u = db.users[p.key]; if (!u) return ''; let tx = '';
    if (usd) { u.rmUsd = (u.rmUsd || 0) + usd; tx = '+' + usd + ' 💵'; if (p.ws) send(p.ws, { t: 'rm_usd', usd: u.rmUsd, got: usd }); }
    else if (coins) { u.coins = (u.coins || 0) + coins; tx = '+' + coins + ' 🪙'; }
    if (tx && p.ws) send(p.ws, { t: 'rm_ok', msg: '🎉 جائزة غوكو: ' + tx + (usd ? ' دولار المنتجع' : ' عملة') });
    return tx;
  }
  function finish(l, why, wTeam) {
    l.ph = 'over'; l.t = now() + OVER_MS; l.movable = []; l.rolled = false;
    /* الباقين (اللي ما خلّصوا) يترتبون حسب تقدّمهم */
    liveSeats(l).filter(i => !l.seats[i].rank).sort((a, b) => progress(l.seats[b]) - progress(l.seats[a])).forEach(i => { l.seats[i].rank = ++l.rank; });
    const ranks = liveSeats(l).map(i => ({ s: i, r: l.seats[i].rank })).sort((a, b) => a.r - b.r);
    const first = ranks[0] ? ranks[0].s : -1, rw = {};
    const vsBot = (l.humStart || 0) < 2, inRm = !!l.table;
    const team = l.mode === 'team' ? (Number.isInteger(wTeam) ? wTeam : (first >= 0 ? first % 2 : 0)) : -1;
    if (!why) {
      const winners = l.mode === 'team' ? [team, team + 2].filter(i => l.seats[i]) : ranks.slice(0, 3).map(x => x.s);
      winners.forEach((i, n) => {
        const p = l.seats[i]; if (!p || p.bot) return; const u = db.users[p.key]; if (!u) return;
        let c = 0, d = 0;
        if (vsBot) {
          if (n > 0 && l.mode !== 'team') return;
          const dn = dayNum(); if (u.ludoBotDay !== dn) { u.ludoBotDay = dn; u.ludoBotN = 0; }
          if ((u.ludoBotN || 0) >= BOT_DAY_MAX) { if (p.ws) send(p.ws, { t: 'rm_ok', msg: '🤖 خلصت جوائز اللعب ويا الكمبيوتر لليوم (' + BOT_DAY_MAX + ')' }); return; }
          u.ludoBotN = (u.ludoBotN || 0) + 1; if (inRm) d = BOT_USD; else c = BOT_COIN;
        } else if (l.mode === 'team') { if (inRm) d = TEAM_USD; else c = TEAM_COIN; }
        else { const n0 = l.nStart || 2; if (n === 1 && n0 < 3) return; if (n === 2 && n0 < 4) return; if (inRm) d = USD_RW[n]; else c = COIN_RW[n]; }
        rw[i] = giveRw(l, i, c, d);
      });
      try { save(); } catch (e) {}
    }
    l.win = { s: first, team, why: why || '', ranks, rw, vsBot };
    try { alog('🏆', 'خلصت لعبة غوكو — فاز ' + (l.mode === 'team' ? 'فريق ' + (l.seats[team] ? l.seats[team].name : '') : (l.seats[first] ? l.seats[first].name : '؟'))); } catch (e) {}
    bc(l);
  }
  function autoPlay(l) {                                              // انتهى الوقت (أو كمبيوتر/منقطع): العبها عنه
    const seat = l.turn, p = l.seats[seat]; if (!p) return;
    if (!l.rolled) return roll(l, seat, true);
    if (l.pass) { l.pass = false; nextTurn(l, false); return bc(l); }
    if (l.movable.length) move(l, seat, bestMove(l));
  }
  setInterval(() => {
    const t = now();
    for (const l of [...L.values()]) {
      if (l.ph === 'play') {
        for (let i = 0; i < SEATS; i++) { const p = l.seats[i]; if (p && p.off && t - (p.offAt || 0) > GRACE_MS) { if (toBot(l, i, 'ما رجع')) break; bc(l); } }
        if (!L.has(l.id)) continue;
        if (l.t && t >= l.t) { if (l.pass) { l.pass = false; nextTurn(l, false); bc(l); } else autoPlay(l); }
      }
      else if (l.ph === 'over' && l.t && t >= l.t) {
        l.ph = 'lobby'; l.t = 0; l.win = null;
        l.seats.forEach((p, i) => { if (p && (p.left || p.sub || p.off)) l.seats[i] = null; else if (p) { p.rdy = !!p.bot; p.tk = fresh(l); p.rank = 0; } });
        if (!humanSeats(l).length) drop(l); else { if (!l.seats.some(p => p && p.key === l.host && !p.bot)) { const h = earliest(l); if (h) l.host = h.key; } bc(l); }
      }
      else if (l.ph === 'lobby' && !humanSeats(l).length) drop(l);
    }
  }, +(process.env.LUDO_TICK || 400));

  function shopPub(ws) { const u = db.users[ws.key], sk = skinsOf(ws.key); return { t: 'ludo_shop', own: sk.own, sel: { p: sk.p, d: sk.d }, coins: u ? (u.coins || 0) : 0, adm: !!(u && u.admin), price: SKINS }; }
  function onMsg(ws, d) {
    if (ws.guest || !db.users[ws.key]) return send(ws, { t: 'ludo_err', error: 'سجّل حساب حتى تلعب غوكو' });
    let l = lobbyOf(ws) || reattach(ws);
    switch (d.t) {
      case 'ludo_list': return send(ws, { t: 'ludo_list', list: [...L.values()].filter(x => !x.priv && !x.table && x.ph === 'lobby' && seatedCount(x) < SEATS).map(x => ({ id: x.id, n: seatedCount(x), mode: x.mode, host: (x.seats.find(p => p && p.key === x.host) || {}).name || '' })) });
      case 'ludo_quick': {
        if (l) return bc(l);
        const pick = [...L.values()].filter(x => !x.priv && !x.table && x.ph === 'lobby' && humanSeats(x).length < SEATS && (seatedCount(x) < SEATS || x.seats.some(p => p && p.bot))).sort((a, b) => humanSeats(b).length - humanSeats(a).length)[0];
        l = pick || newLobby(ws, false); if (!pick) L.set(l.id, l); sit(l, ws); return bc(l);
      }
      case 'ludo_create': { if (l) removeP(l, ws); l = newLobby(ws, true); L.set(l.id, l); sit(l, ws); return bc(l); }
      case 'ludo_cpu': {                                               // العب ويا الكمبيوتر 🤖
        if (l) removeP(l, ws); l = newLobby(ws, true); if (MODES.includes(d.m)) l.mode = d.m; L.set(l.id, l); sit(l, ws, 0);
        const n = l.mode === 'team' ? 3 : Math.max(1, Math.min(3, d.n | 0 || 1)); for (let i = 0; i < n; i++) addBot(l);
        l.seats[0].rdy = true; return bc(l);
      }
      case 'ludo_join': {
        const x = [...L.values()].find(y => !y.table && y.code === String(d.code || '').trim()); if (!x) return send(ws, { t: 'ludo_err', error: 'ما لكيت طاولة بهذا الرمز' });
        if (x.ph !== 'lobby') return send(ws, { t: 'ludo_err', error: 'اللعبة بديت، انتظر تخلص' });
        if (freeSeat(x) === undefined) return send(ws, { t: 'ludo_err', error: 'الطاولة مليانة (4 مقاعد)' });
        if (l && l !== x) removeP(l, ws); if (!x.seats.some(p => p && p.ws === ws)) sit(x, ws); return bc(x);
      }
      case 'ludo_leave': return l ? (removeP(l, ws), send(ws, { t: 'ludo_state', s: null })) : send(ws, { t: 'ludo_state', s: null });
      case 'ludo_emo': return emo(ws, String(d.e || ''));
      case 'ludo_chat': return chat(ws, d);
      case 'ludo_voice': return voice(ws, d);
      case 'ludo_get': return send(ws, { t: 'ludo_state', s: l ? pub(l, ws) : null });
      case 'ludo_shop': return send(ws, shopPub(ws));
      case 'ludo_buy': {
        const k = String(d.k || ''), u = db.users[ws.key]; if (!SKINS[k]) return;
        const sk = skinsOf(ws.key); if (sk.own.includes(k)) return send(ws, shopPub(ws));
        if ((u.coins || 0) < SKINS[k]) return send(ws, { t: 'ludo_err', error: 'عملاتك ما تكفي 🪙 تحتاج ' + SKINS[k] + ' (عندك ' + (u.coins || 0) + ')' });
        u.coins = (u.coins || 0) - SKINS[k]; u.ludoOwn = Array.isArray(u.ludoOwn) ? u.ludoOwn : []; u.ludoOwn.push(k); u.ludoSel = u.ludoSel || {}; u.ludoSel[k[0]] = k; try { save(); } catch (e) {}
        skinApply(ws); send(ws, { t: 'rm_ok', msg: '🛍️ اشتريت السكن! تلبّس تلقائياً ✨' }); return send(ws, Object.assign(shopPub(ws), { bought: k }));
      }
      case 'ludo_sel': {
        const k = String(d.k || ''), kind = d.kind === 'd' ? 'd' : 'p', u = db.users[ws.key]; const sk = skinsOf(ws.key);
        if (k && (!SKINS[k] || k[0] !== kind || !sk.own.includes(k))) return;
        u.ludoSel = u.ludoSel || {}; u.ludoSel[kind] = k; try { save(); } catch (e) {} skinApply(ws); return send(ws, shopPub(ws));
      }
    }
    if (!l) return;
    const me = seatOf(l, ws); if (me < 0) return;
    const isHost = l.seats[me].key === l.host;
    switch (d.t) {
      case 'ludo_seat': {                                              // غيّر مقعدك (بغرفة الانتظار فقط)
        if (l.ph !== 'lobby' || l.table) return; const to = d.s | 0; if (to < 0 || to >= SEATS || (l.seats[to] && !l.seats[to].bot)) return;
        const b = l.seats[to]; l.seats[to] = l.seats[me]; l.seats[me] = b || null; return bc(l);
      }
      case 'ludo_mode': {                                              // الهوست يختار الوضع: عادي / سريع / فرق
        if (l.ph !== 'lobby') return; if (!isHost) return send(ws, { t: 'ludo_err', error: 'بس الهوست 👑 يغيّر الوضع' });
        if (!MODES.includes(d.m) || d.m === l.mode) return; l.mode = d.m;
        l.seats.forEach(p => { if (p) { p.tk = fresh(l); if (!p.bot) p.rdy = false; } });
        sysMsg(l, '🎮 الوضع صار: ' + ({ classic: 'عادي (4 قطع)', quick: 'سريع (قطعتين)', team: 'فرق 2 ضد 2' })[l.mode]); return bc(l);
      }
      case 'ludo_bot': {
        if (l.ph !== 'lobby') return; if (!isHost) return send(ws, { t: 'ludo_err', error: 'بس الهوست 👑 يضيف كمبيوتر' });
        if (!addBot(l, d.s | 0)) return send(ws, { t: 'ludo_err', error: 'ماكو مقعد فارغ' }); return bc(l);
      }
      case 'ludo_unbot': {
        if (l.ph !== 'lobby' || !isHost) return; const i = d.s | 0; if (l.seats[i] && l.seats[i].bot) { l.seats[i] = null; bc(l); } return;
      }
      case 'ludo_ready': {                                             // زر استعداد: كل لاعب (حتى الهوست) يدوس جاهز؛ بعدها الهوست هو اللي يشغّل اللعبة
        if (l.ph !== 'lobby') return;
        if (liveSeats(l).length < MIN_P) return send(ws, { t: 'ludo_err', error: 'لازم لاعبين اثنين على الأقل (تكدر تضيف كمبيوتر 🤖)' });
        const p = l.seats[me]; p.rdy = !p.rdy; bc(l);
        if (p.rdy && allReady(l)) l.seats.forEach(q => { if (q && q.ws && !q.left) send(q.ws, { t: 'ludo_allready', host: q.key === l.host }); });
        return;
      }
      case 'ludo_start': {                                             // الهوست بس (أول واحد دخل) يشغّل اللعبة بعد ما الكل مستعد
        if (l.ph !== 'lobby') return;
        if (!isHost) return send(ws, { t: 'ludo_err', error: 'بس الهوست (أول واحد دخل) يشغّل اللعبة 👑' });
        if (liveSeats(l).length < MIN_P) return send(ws, { t: 'ludo_err', error: 'لازم لاعبين اثنين على الأقل (تكدر تضيف كمبيوتر 🤖)' });
        if (l.mode === 'team' && liveSeats(l).length < 4) return send(ws, { t: 'ludo_err', error: 'وضع الفرق يحتاج 4 لاعبين — كمّل المقاعد بكمبيوتر 🤖' });
        if (!allReady(l)) return send(ws, { t: 'ludo_err', error: 'لازم الكل يضغط «استعداد» أول' });
        return start(l);
      }
      case 'ludo_roll': { if (l.ph !== 'play' || l.turn !== me || l.rolled || now() < (l.cdUntil || 0)) return; return roll(l, me); }
      case 'ludo_move': { if (l.ph !== 'play' || l.turn !== me || !l.rolled || l.auto) return; const k = d.k | 0; if (!l.movable.includes(k)) return; return move(l, me, k); }
    }
  }
  function skinApply(ws) { const l = lobbyOf(ws); if (!l) return; const i = seatOf(l, ws); if (i < 0) return; const sk = skinsOf(ws.key); l.seats[i].sk = sk.p; l.seats[i].dk = sk.d; bc(l); }
  /* طاولة غوكو داخل المنتجع: كل غرفة منتجع إلها طاولة وحدة (4 كراسي)، الجلوس على الكرسي = مقعد باللعبة */
  function sitTable(ws, rmId, seat) {
    if (ws.guest || !db.users[ws.key]) return 'سجّل حساب حتى تلعب غوكو';
    const id = 'rm:' + rmId; let l = L.get(id), cur = lobbyOf(ws);
    if (l && l.seats.some(p => p && p.key === ws.key && p.off)) { reattach(ws); return ''; }
    if (cur && cur !== l) removeP(cur, ws);
    if (!l) { l = newLobby(ws, false); l.id = id; l.table = true; l.rmId = rmId; L.set(id, l); }
    if (l.seats.some(p => p && p.ws === ws)) return '';
    if (l.ph !== 'lobby') return 'اللعبة شغالة، انتظر تخلص';
    if (!Number.isInteger(seat) || seat < 0 || seat >= SEATS || (l.seats[seat] && !l.seats[seat].bot)) return 'الكرسي مشغول';
    if (!humanSeats(l).length) l.host = ws.key;
    sit(l, ws, seat); bc(l); return '';
  }
  function leaveTable(ws) { const l = lobbyOf(ws); if (l && l.table) { removeP(l, ws); send(ws, { t: 'ludo_state', s: null }); } }
  const EMO = ['😂', '❤️', '👏', '🔥', '😎', '😡', '😭', '🎉', '😱', '🤣', '👋', '🙏'];
  function emo(ws, e) { const l = lobbyOf(ws); if (!l || !EMO.includes(e)) return; const t = now(); if (t - (ws.ludoEmoT || 0) < 900) return; ws.ludoEmoT = t; const i = seatOf(l, ws); l.seats.forEach(p => { if (p && p.ws && !p.left) send(p.ws, { t: 'ludo_emo', s: i, e }); }); }
  /* شات الطاولة + مايك (اضغط مطوّل واحجي): الصوت ينرفع على /api/upload والسيرفر يوزّع الرابط على الطاولة */
  const ADMINS = ['بابي', 'بابيتو'];
  function chatPush(l, m) { l.chat = l.chat || []; l.chat.push(m); if (l.chat.length > 60) l.chat.splice(0, l.chat.length - 60); l.seats.forEach(p => { if (p && p.ws && !p.left) send(p.ws, { t: 'ludo_chat', m }); }); }
  function chat(ws, d) {
    const l = lobbyOf(ws); if (!l) return; const i = seatOf(l, ws); if (i < 0) return;
    const txt = String(d.text || '').replace(/\s+/g, ' ').trim().slice(0, 200); if (!txt) return;
    const t = now(), nm = nameOf(ws), adm = ADMINS.includes(nm);
    if (!adm) {
      if ((ws.ludoBlock || 0) > t) return send(ws, { t: 'ludo_err', error: 'انتظر ' + Math.ceil((ws.ludoBlock - t) / 1000) + ' ثانية، كررت نفس الكلام هواية 🙏' });
      if (t - (ws.ludoChatT || 0) < 600) return; ws.ludoChatT = t;
      if (ws.ludoLastTx === txt) ws.ludoRep = (ws.ludoRep || 1) + 1; else { ws.ludoLastTx = txt; ws.ludoRep = 1; }
      if (ws.ludoRep > 3) { ws.ludoBlock = t + 20000; ws.ludoRep = 0; return send(ws, { t: 'ludo_err', error: 'تكرار! انحظرت من الشات 20 ثانية ⛔' }); }
    }
    chatPush(l, { id: crypto.randomBytes(4).toString('hex'), s: i, n: nm, tx: txt, at: t, adm });
  }
  function voice(ws, d) {
    const l = lobbyOf(ws); if (!l) return; const i = seatOf(l, ws); if (i < 0) return;
    const url = String(d.url || ''), dur = Math.max(1, Math.min(30, Math.round(+d.dur || 1)));
    if (!/^\/uploads\/[a-f0-9]{24}\.(weba|m4a|ogg|mp3)$/.test(url)) return;
    const t = now(); if (t - (ws.ludoVoT || 0) < 1500) return; ws.ludoVoT = t;
    chatPush(l, { id: crypto.randomBytes(4).toString('hex'), s: i, n: nameOf(ws), vo: url, dur, at: t, adm: ADMINS.includes(nameOf(ws)) });
  }
  /* انقطاع الاتصال: وسط اللعبة نحجز المقعد (رجوع للعبة)، غير هيج يطلع عادي */
  function leave(ws) { const l = lobbyOf(ws); if (!l) return; if (l.ph === 'play') offline(l, ws); else removeP(l, ws); }
  return { onMsg, leave, sitTable, leaveTable, tablePub: rmId => tablePub(L.get('rm:' + rmId)), emo };
};
