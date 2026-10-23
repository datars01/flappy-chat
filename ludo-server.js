/* ===================== لعبة «لودو» 🎲 — السيرفر =====================
   طاولة بـ 4 مقاعد (أحمر، أخضر، أصفر، أزرق). تبدأ اللعبة بلاعبين أو أكثر (مو لازم تكتمل 4 مقاعد).
   السيرفر هو الحَكَم: يرمي النرد، يتحقق من الحركات، ويقرر الفائز. */
'use strict';
module.exports = function ludoInit(ctx) {
  const { db, save, send, crypto, alog } = ctx; const onTable = ctx.onTable || (() => {});   // onTable: يبلّغ المنتجع بحالة طاولة اللودو
  const SEATS = 4, MIN_P = 2, TURN_MS = 25000, OVER_MS = 12000, WIN_COINS = 20;
  const TRACK = 52, LANE_END = 56;                       // مواقع الحجر: -1 قاعدة، 0..50 مسار، 51..55 ممر البيت، 56 وصل
  const START = [0, 13, 26, 39];                         // خانة بداية كل لون على المسار
  const SAFE = new Set([0, 13, 26, 39, 8, 21, 34, 47]);  // خانات البداية + النجوم (ما ينأكل فيها حجر)
  const L = new Map();                                   // id → طاولة
  const rnd = n => crypto.randomInt(n);
  const now = () => Date.now();
  const nameOf = ws => (db.users[ws.key] && db.users[ws.key].name) || '؟';
  const absOf = (seat, pos) => (START[seat] + pos) % TRACK;

  const seatedCount = l => l.seats.filter(Boolean).length;
  const liveSeats = l => l.seats.map((p, i) => (p && !p.left ? i : -1)).filter(i => i >= 0);
  const lobbyOf = ws => { for (const l of L.values()) if (l.seats.some(p => p && p.ws === ws && !p.left)) return l; return null; };
  const seatOf = (l, ws) => l.seats.findIndex(p => p && p.ws === ws && !p.left);

  function pub(l, viewer) {
    const mine = viewer ? seatOf(l, viewer) : -1;
    return {
      id: l.id, code: l.priv ? l.code : '', priv: !!l.priv, host: l.host, ph: l.ph, t: l.t ? Math.max(0, l.t - now()) : 0,
      seats: l.seats.map((p, i) => p ? { n: p.name, left: !!p.left, host: p.key === l.host, me: i === mine, tk: p.tk, rank: p.rank || 0 } : null),
      turn: l.turn, dice: l.dice, rolled: l.rolled, movable: l.ph === 'play' && l.turn === mine ? l.movable : [], win: l.win, last: l.lastEv || null, my: mine
    };
  }
  function tablePub(l) { return l ? { ph: l.ph, turn: l.turn, dice: l.dice, win: l.win ? l.win.s : -1, seats: l.seats.map(p => p ? { n: p.name, left: !!p.left, tk: p.tk } : null) } : null; }
  function bc(l) { l.seats.forEach(p => { if (p && p.ws && p.ws.readyState === 1 && !p.left) send(p.ws, { t: 'ludo_state', s: pub(l, p.ws) }); }); if (l.table) onTable(l.rmId, tablePub(l)); }
  function drop(l) { L.delete(l.id); if (l.table) onTable(l.rmId, null); }
  function freeSeat(l, want) {
    if (Number.isInteger(want) && want >= 0 && want < SEATS && !l.seats[want]) return want;
    const order = seatedCount(l) === 1 ? [2, 1, 3, 0] : [0, 1, 2, 3];       // الثاني يجلس مقابل الأول افتراضياً
    return order.find(i => !l.seats[i]);
  }
  function newLobby(ws, priv) {
    const id = 'l' + crypto.randomBytes(4).toString('hex'); let code;
    do { code = String(1000 + rnd(9000)); } while ([...L.values()].some(x => x.code === code));
    return { id, code, priv, host: ws.key, table: false, rmId: '', seats: [null, null, null, null], ph: 'lobby', t: 0, turn: -1, dice: 0, rolled: false, movable: [], sixes: 0, win: null, lastEv: null, made: now() };
  }
  function sit(l, ws, want) {
    const i = freeSeat(l, want); if (i === undefined) return false;
    l.seats[i] = { key: ws.key, ws, name: nameOf(ws), tk: [-1, -1, -1, -1], left: false, rank: 0 }; return true;
  }
  function removeP(l, ws) {
    const i = seatOf(l, ws); if (i < 0) return;
    const p = l.seats[i];
    if (l.ph === 'lobby') l.seats[i] = null;
    else { p.left = true; p.ws = null; p.tk = [-1, -1, -1, -1]; }
    const live = liveSeats(l);
    if (!live.length) { drop(l); return; }
    if (l.host === p.key) { const h = l.seats[live[0]]; if (h) l.host = h.key; }
    if (l.ph === 'play') {
      if (live.length === 1) return finish(l, live[0], 'الباقين طلعوا من اللعبة');
      if (l.turn === i) nextTurn(l, false);
    }
    bc(l);
  }
  function start(l) {
    if (liveSeats(l).length < MIN_P) return;
    l.seats.forEach(p => { if (p) { p.tk = [-1, -1, -1, -1]; p.rank = 0; } });
    const live = liveSeats(l); l.turn = live[rnd(live.length)]; l.ph = 'play'; l.dice = 0; l.rolled = false; l.movable = []; l.sixes = 0; l.win = null; l.lastEv = null; l.rank = 0; l.t = now() + TURN_MS;
    try { alog('🎲', 'بدت لعبة لودو بـ ' + live.length + ' لاعبين'); } catch (e) {}
    bc(l);
  }
  function canMove(p, seat, k, d) {
    const pos = p.tk[k];
    if (pos === LANE_END) return false;
    if (pos === -1) return d === 6;
    return pos + d <= LANE_END;
  }
  function movables(l, d) { const p = l.seats[l.turn]; return p ? [0, 1, 2, 3].filter(k => canMove(p, l.turn, k, d)) : []; }
  function nextTurn(l, again) {
    const live = liveSeats(l).filter(i => !l.seats[i].rank);   // اللي خلّص كل أحجاره ما يلعب بعد
    if (!live.length) return;
    if (!again || !live.includes(l.turn)) { let i = l.turn; do { i = (i + 1) % SEATS; } while (!live.includes(i)); l.turn = i; l.sixes = 0; }
    l.dice = 0; l.rolled = false; l.movable = []; l.pass = false; l.t = now() + TURN_MS;
  }
  function roll(l, seat) {
    l.dice = 1 + rnd(6); l.rolled = true; l.lastEv = { k: 'roll', s: seat, d: l.dice, id: (l.evId = (l.evId || 0) + 1) };
    if (l.dice === 6) l.sixes++; else l.sixes = 0;
    if (l.sixes >= 3) { l.lastEv.k = 'sixes'; nextTurn(l, false); return bc(l); }          // ثلاث ستات ورا بعض: يضيع الدور
    l.movable = movables(l, l.dice);
    if (!l.movable.length) { l.t = now() + 1400; l.pass = true; return bc(l); }              // ماكو حركة: يمر الدور بعد لحظة
    l.t = now() + TURN_MS; bc(l);
  }
  function move(l, seat, k) {
    const p = l.seats[seat], d = l.dice; if (!canMove(p, seat, k, d)) return;
    let pos = p.tk[k], cap = 0, got = false;
    if (pos === -1) pos = 0; else pos += d;
    p.tk[k] = pos;
    if (pos <= 50) {                                                   // أكل أحجار الخصم (إلا بالخانات الآمنة)
      const a = absOf(seat, pos);
      if (!SAFE.has(a)) l.seats.forEach((q, s) => { if (!q || s === seat) return; q.tk.forEach((qp, qk) => { if (qp >= 0 && qp <= 50 && absOf(s, qp) === a) { q.tk[qk] = -1; cap++; } }); });
    }
    if (pos === LANE_END) got = true;
    l.lastEv = { k: 'move', s: seat, tk: k, pos, cap, home: got, id: (l.evId = (l.evId || 0) + 1) };
    if (p.tk.every(x => x === LANE_END)) { p.rank = ++l.rank; if (p.rank === 1) return finish(l, seat, null); }
    const again = d === 6 || cap > 0 || got;                         // 6 أو أكل أو وصول = دور إضافي
    nextTurn(l, again && !p.rank); bc(l);
  }
  function finish(l, seat, why) {
    l.ph = 'over'; l.win = { s: seat, why: why || '' }; l.t = now() + OVER_MS; l.movable = [];
    const w = l.seats[seat]; const u = w && db.users[w.key];
    // العملات للفوز الحقيقي فقط (مو لما الباقين يطلعون)
    if (u && !why) { u.coins = (u.coins || 0) + WIN_COINS; try { save(); } catch (e) {} if (w.ws) send(w.ws, { t: 'rm_ok', msg: '🎉 فزت بلودو! +' + WIN_COINS + ' عملة' }); }
    bc(l);
  }
  function autoPlay(l) {                                              // انتهى وقت اللاعب: العبها عنه
    const seat = l.turn; if (!l.seats[seat]) return;
    if (!l.rolled) return roll(l, seat);
    if (l.pass) { l.pass = false; nextTurn(l, false); return bc(l); }
    if (l.movable.length) move(l, seat, l.movable[rnd(l.movable.length)]);
  }
  setInterval(() => {
    const t = now();
    for (const l of [...L.values()]) {
      if (l.ph === 'play' && l.t && t >= l.t) { if (l.pass) { l.pass = false; nextTurn(l, false); bc(l); } else autoPlay(l); }
      else if (l.ph === 'over' && l.t && t >= l.t) { l.ph = 'lobby'; l.t = 0; l.win = null; l.seats.forEach((p, i) => { if (p && p.left) l.seats[i] = null; }); if (!seatedCount(l)) drop(l); else { if (!l.seats.some(p => p && p.key === l.host)) l.host = l.seats.find(Boolean).key; bc(l); } }
      else if (l.ph === 'lobby' && !seatedCount(l)) drop(l);
    }
  }, 500);

  function onMsg(ws, d) {
    if (ws.guest || !db.users[ws.key]) return send(ws, { t: 'ludo_err', error: 'سجّل حساب حتى تلعب لودو' });
    let l = lobbyOf(ws);
    switch (d.t) {
      case 'ludo_list': return send(ws, { t: 'ludo_list', list: [...L.values()].filter(x => !x.priv && !x.table && x.ph === 'lobby' && seatedCount(x) < SEATS).map(x => ({ id: x.id, n: seatedCount(x), host: (x.seats.find(p => p && p.key === x.host) || {}).name || '' })) });
      case 'ludo_quick': {
        if (l) return bc(l);
        const pick = [...L.values()].filter(x => !x.priv && !x.table && x.ph === 'lobby' && seatedCount(x) < SEATS).sort((a, b) => seatedCount(b) - seatedCount(a))[0];
        l = pick || newLobby(ws, false); if (!pick) L.set(l.id, l); sit(l, ws); return bc(l);
      }
      case 'ludo_create': { if (l) removeP(l, ws); l = newLobby(ws, true); L.set(l.id, l); sit(l, ws); return bc(l); }
      case 'ludo_join': {
        const x = [...L.values()].find(y => y.code === String(d.code || '').trim()); if (!x) return send(ws, { t: 'ludo_err', error: 'ما لكيت طاولة بهذا الرمز' });
        if (x.ph !== 'lobby') return send(ws, { t: 'ludo_err', error: 'اللعبة بديت، انتظر تخلص' });
        if (seatedCount(x) >= SEATS) return send(ws, { t: 'ludo_err', error: 'الطاولة مليانة (4 مقاعد)' });
        if (l && l !== x) removeP(l, ws); if (!x.seats.some(p => p && p.ws === ws)) sit(x, ws); return bc(x);
      }
      case 'ludo_leave': return l ? (removeP(l, ws), send(ws, { t: 'ludo_state', s: null })) : send(ws, { t: 'ludo_state', s: null });
      case 'ludo_emo': return emo(ws, String(d.e || ''));
      case 'ludo_get': return send(ws, { t: 'ludo_state', s: l ? pub(l, ws) : null });
    }
    if (!l) return;
    const me = seatOf(l, ws); if (me < 0) return;
    switch (d.t) {
      case 'ludo_seat': {                                              // غيّر مقعدك (بغرفة الانتظار فقط)
        if (l.ph !== 'lobby') return; const to = d.s | 0; if (to < 0 || to >= SEATS || l.seats[to]) return;
        l.seats[to] = l.seats[me]; l.seats[me] = null; return bc(l);
      }
      case 'ludo_start': {
        if (l.ph !== 'lobby' || l.host !== ws.key) return;
        if (liveSeats(l).length < MIN_P) return send(ws, { t: 'ludo_err', error: 'لازم لاعبين اثنين على الأقل' });
        return start(l);
      }
      case 'ludo_roll': { if (l.ph !== 'play' || l.turn !== me || l.rolled) return; return roll(l, me); }
      case 'ludo_move': { if (l.ph !== 'play' || l.turn !== me || !l.rolled) return; const k = d.k | 0; if (!l.movable.includes(k)) return; return move(l, me, k); }
    }
  }
  /* طاولة لودو داخل المنتجع: كل غرفة منتجع إلها طاولة وحدة (4 كراسي)، الجلوس على الكرسي = مقعد باللعبة */
  function sitTable(ws, rmId, seat) {
    if (ws.guest || !db.users[ws.key]) return 'سجّل حساب حتى تلعب لودو';
    const id = 'rm:' + rmId; let l = L.get(id), cur = lobbyOf(ws);
    if (cur && cur !== l) removeP(cur, ws);
    if (!l) { l = newLobby(ws, false); l.id = id; l.table = true; l.rmId = rmId; L.set(id, l); }
    if (l.seats.some(p => p && p.ws === ws)) return '';
    if (l.ph !== 'lobby') return 'اللعبة شغالة، انتظر تخلص';
    if (!Number.isInteger(seat) || seat < 0 || seat >= SEATS || l.seats[seat]) return 'الكرسي مشغول';
    if (!l.seats.some(p => p && !p.left)) l.host = ws.key;
    sit(l, ws, seat); bc(l); return '';
  }
  function leaveTable(ws) { const l = lobbyOf(ws); if (l && l.table) { removeP(l, ws); send(ws, { t: 'ludo_state', s: null }); } }
  const EMO = ['😂', '❤️', '👏', '🔥', '😎', '😡', '😭', '🎉'];
  function emo(ws, e) { const l = lobbyOf(ws); if (!l || !EMO.includes(e)) return; const t = now(); if (t - (ws.ludoEmoT || 0) < 1200) return; ws.ludoEmoT = t; const i = seatOf(l, ws); l.seats.forEach(p => { if (p && p.ws && !p.left) send(p.ws, { t: 'ludo_emo', s: i, e }); }); }
  return { onMsg, leave: ws => { const l = lobbyOf(ws); if (l) removeP(l, ws); }, sitTable, leaveTable, tablePub: rmId => tablePub(L.get('rm:' + rmId)), emo };
};
