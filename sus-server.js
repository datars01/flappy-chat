/* ===================== لعبة «مين الخاين؟» (مثل أمونغ أس) — السيرفر =====================
   3 إلى 5 لاعبين أونلاين، واحد منهم خاين. الطاقم يخلص المهمات أو يطلعون الخاين بالتصويت،
   والخاين يحاول يطيّر الطاقم واحد واحد بدون ما ينكشف. السيرفر هو الحَكَم بكلشي. */
'use strict';
module.exports = function susInit(ctx) {
  const { db, save, send, crypto, alog } = ctx;
  const MAP = require('./public/sus-map.json');
  const MAX_P = 5, MIN_P = 3, KILL_CD = 25000, KILL_R = 58, USE_R = 64, REPORT_R = 75, MEET_MS = 30000, VOTE_MS = 25000, EJECT_MS = 6500, OVER_MS = 9000, TASKS_PER = 5, SPEED = 4.2, VENT_CD = 12000;   // الأنفاق: الكل يكدر يطب بيها، الطاقم ينتظر 12 ثانية بين نفق ونفق
  const L = new Map();   // id → lobby
  const rnd = n => Math.floor(Math.random() * n);
  const now = () => Date.now();
  const nameOf = ws => (db.users[ws.key] && db.users[ws.key].name) || '؟';
  const inWalk = (x, y) => MAP.walk.some(r => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]);
  const spawn = i => { const s = MAP.spawn; const a = i / MAX_P * Math.PI * 2; return [s[0] + Math.cos(a) * 90, s[1] + Math.sin(a) * 60]; };
  const VENTS = MAP.vents || [];
  function ventFx(l, v, k, who) { for (const p of l.players) if (p.ws && !p.left && p.ws.readyState === 1) send(p.ws, { t: 'sus_vfx', x: v.x, y: v.y, k, me: p === who }); }

  function pub(l, viewer) {   // اللي يشوفه كل لاعب (الأدوار مخفية إلا دوره، أو بنهاية اللعبة)
    const me = viewer ? l.players.find(p => p.key === viewer.key) : null, reveal = l.ph === 'over';
    return { id: l.id, code: l.priv ? l.code : '', priv: !!l.priv, host: l.host, ph: l.ph, t: l.t ? Math.max(0, l.t - now()) : 0,
      players: l.players.map((p, i) => ({ i, n: p.name, ch: p.ch, alive: p.alive, left: !!p.left, host: p.key === l.host, me: me === p, role: (reveal || p === me || (me && me.role === 'imp' && p.role === 'imp')) ? p.role : undefined, voted: (l.ph === 'vote' || l.ph === 'meet') ? !!p.vote : undefined, caller: l.caller === p.key, em: p.em })),
      vent: me && Number.isInteger(me.vent) ? me.vent : -1, vcd: me ? Math.max(0, (me.vcd || 0) - now()) : 0, tasks: me && me.role === 'crew' ? me.tasks.map(id => ({ id, done: me.done.has(id) })) : [], prog: progress(l), bodies: l.bodies, kcd: me && me.role === 'imp' ? Math.max(0, me.kcd - now()) : 0,
      chat: (l.ph === 'meet' || l.ph === 'vote') ? l.chat.slice(-40) : [], result: l.result || null, pos: me ? [Math.round(me.x), Math.round(me.y)] : null, votes: l.ph === 'eject' || l.ph === 'over' ? l.lastVotes || null : null, win: l.win || null };
  }
  // الفوز: إذا أي لاعب من الطاقم كمّل كل مهامه لوحده، يفوز الطاقم كله. الشريط يبين تقدّم أقرب لاعب للإكمال
  function progress(l) { let best = 0; l.players.forEach(p => { if (p.role === 'crew' && !p.left && p.tasks.length) best = Math.max(best, p.done.size / p.tasks.length); }); return best; }
  function bc(l) { for (const p of l.players) if (p.ws && p.ws.readyState === 1 && !p.left) send(p.ws, { t: 'sus_state', s: pub(l, p.ws) }); }
  function lobbyOf(ws) { for (const l of L.values()) if (l.players.some(p => p.ws === ws && !p.left)) return l; return null; }
  function freeCh(l) { const used = new Set(l.players.filter(p => !p.left).map(p => p.ch)); for (let c = 0; c < 8; c++) if (!used.has(c)) return c; return 0; }
  function newLobby(ws, priv) { const id = 'g' + crypto.randomBytes(4).toString('hex'); let code; do { code = String(1000 + rnd(9000)); } while ([...L.values()].some(x => x.code === code)); const l = { id, code, priv, host: ws.key, players: [], ph: 'lobby', t: 0, bodies: [], chat: [] }; L.set(id, l); return l; }
  function addP(l, ws) { l.players.push({ key: ws.key, ws, name: nameOf(ws), ch: freeCh(l), x: 0, y: 0, dir: 1, mv: 0, alive: true, role: 'crew', tasks: [], done: new Set(), em: false, kcd: 0, vote: null }); l.players.forEach((p, i) => { const s = spawn(i); p.x = s[0]; p.y = s[1]; }); }
  function leaveL(ws, quiet) {
    const l = lobbyOf(ws); if (!l) return; const p = l.players.find(q => q.ws === ws && !q.left); if (!p) return;
    if (l.ph === 'lobby' || l.ph === 'count') l.players.splice(l.players.indexOf(p), 1); else { p.left = true; p.alive = false; }
    if (!l.players.some(q => !q.left)) { L.delete(l.id); return; }
    if (l.host === p.key) { const h = l.players.find(q => !q.left); if (h) l.host = h.key; }
    if (l.ph === 'count' && l.players.length < MIN_P) { l.ph = 'lobby'; l.t = 0; }
    if (!quiet) l.chat.push({ sys: 1, txt: '🚪 ' + p.name + ' طلع من اللعبة' });
    if (l.ph === 'vote' || l.ph === 'meet') maybeTally(l);
    checkWin(l); bc(l);
  }
  function start(l) {
    const ps = l.players.filter(p => !p.left); if (ps.length < MIN_P) return;
    ps.forEach((p, i) => { const s = spawn(i); p.x = s[0]; p.y = s[1]; p.alive = true; p.role = 'crew'; p.done = new Set(); p.em = false; p.vote = null; p.vent = null; p.vcd = 0; const ids = MAP.tasks.map((_, k) => k); for (let k = ids.length - 1; k > 0; k--) { const j = rnd(k + 1); [ids[k], ids[j]] = [ids[j], ids[k]]; } p.tasks = ids.slice(0, TASKS_PER); });
    const imp = ps[rnd(ps.length)]; imp.role = 'imp'; imp.tasks = []; imp.kcd = now() + 15000;
    l.ph = 'play'; l.t = 0; l.bodies = []; l.chat = []; l.result = null; l.win = null; l.lastVotes = null; l.started = now();
    try { alog('🥔', 'بدت لعبة «مين الخاين؟» بـ ' + ps.length + ' لاعبين'); } catch (e) {}
    bc(l);
  }
  function aliveBy(l, role) { return l.players.filter(p => p.alive && !p.left && p.role === role).length; }
  function checkWin(l) {
    if (!['play', 'meet', 'vote', 'eject'].includes(l.ph)) return false;
    let w = null; const imps = aliveBy(l, 'imp'), crew = aliveBy(l, 'crew');
    if (!imps) w = 'crew'; else if (imps >= crew) w = 'imp'; else if (progress(l) >= 1) w = 'crew';
    if (!w) return false; over(l, w); return true;
  }
  function over(l, w) {
    l.ph = 'over'; l.win = w; l.t = now() + OVER_MS;
    for (const p of l.players) { if (p.left) continue; const won = (w === 'crew' && p.role === 'crew') || (w === 'imp' && p.role === 'imp'); const u = db.users[p.key]; if (u && won) { const amt = p.role === 'imp' ? 40 : 25; u.coins = (u.coins || 0) + amt; p.earn = amt; } else p.earn = 0; }
    save(); bc(l); l.players.forEach(p => { if (p.earn && p.ws) send(p.ws, { t: 'rm_ok', msg: '🎉 فزت! +' + p.earn + ' عملة' }); });
  }
  function meeting(l, caller, body) {
    l.ph = 'meet'; l.t = now() + MEET_MS; l.caller = caller.key; l.chat = [{ sys: 1, txt: body ? '📢 ' + caller.name + ' لكى ' + body + ' طايح!' : '🚨 ' + caller.name + ' سوّى اجتماع طارئ!' }];
    l.players.forEach((p, i) => { p.vote = null; p.vent = null; const s = spawn(i); p.x = s[0]; p.y = s[1]; }); l.bodies = []; bc(l);
  }
  function maybeTally(l) {
    const voters = l.players.filter(p => p.alive && !p.left); if (l.ph === 'vote' && voters.length && voters.every(p => p.vote)) tally(l);
  }
  function tally(l) {
    const cnt = {}; let skip = 0; const voters = l.players.filter(p => p.alive && !p.left);
    voters.forEach(p => { if (p.vote === 'skip' || !p.vote) skip++; else cnt[p.vote] = (cnt[p.vote] || 0) + 1; });
    let best = null, bv = 0, tie = false; for (const k in cnt) { if (cnt[k] > bv) { best = k; bv = cnt[k]; tie = false; } else if (cnt[k] === bv) tie = true; }
    l.lastVotes = { cnt, skip, by: Object.fromEntries(voters.map(p => [p.name, p.vote === 'skip' || !p.vote ? 'skip' : (l.players.find(q => q.key === p.vote) || {}).name || 'skip'])) };
    let ej = null; if (best && !tie && bv > skip) ej = l.players.find(p => p.key === best);
    if (ej) ej.alive = false;
    l.result = ej ? { n: ej.name, ch: ej.ch, imp: ej.role === 'imp', left: aliveBy(l, 'imp') } : { none: 1, tie };
    l.ph = 'eject'; l.t = now() + EJECT_MS; bc(l);
  }
  setInterval(() => {   // المؤقتات + إرسال المواقع 10 مرات بالثانية
    const t = now();
    for (const l of L.values()) {
      if (l.ph === 'count' && t >= l.t) start(l);
      else if (l.ph === 'meet' && t >= l.t) { l.ph = 'vote'; l.t = t + VOTE_MS; bc(l); }
      else if (l.ph === 'vote' && t >= l.t) tally(l);
      else if (l.ph === 'eject' && t >= l.t) { if (!checkWin(l)) { l.ph = 'play'; l.t = 0; l.result = null; l.players.forEach(p => { if (p.role === 'imp') p.kcd = t + 18000; }); bc(l); } }
      else if (l.ph === 'over' && t >= l.t) { l.players = l.players.filter(p => !p.left); l.players.forEach(p => { p.alive = true; p.role = 'crew'; p.tasks = []; p.done = new Set(); p.vent = null; }); l.ph = 'lobby'; l.t = 0; l.win = null; l.result = null; l.bodies = []; if (!l.players.length) { L.delete(l.id); continue; } bc(l); }
      if (l.ph === 'play') {
        for (const v of l.players) { if (!v.ws || v.left || v.ws.readyState !== 1) continue; const seeGhosts = !v.alive;
          const pos = l.players.map((p, i) => (p.left || (!p.alive && !seeGhosts) || (Number.isInteger(p.vent) && p !== v)) ? null : [i, Math.round(p.x), Math.round(p.y), p.dir, p.mv ? 1 : 0, p.alive ? 1 : 0]).filter(Boolean);
          v.ws.send(JSON.stringify({ t: 'sus_pos', p: pos })); }
      }
    }
  }, 100);

  function onMsg(ws, d) {
    const t = now(); if (ws.guest || !db.users[ws.key]) return send(ws, { t: 'sus_err', error: 'سجّل حساب حتى تلعب' });
    let l = lobbyOf(ws); const me = l ? l.players.find(p => p.ws === ws && !p.left) : null;
    switch (d.t) {
      case 'sus_list': return send(ws, { t: 'sus_list', list: [...L.values()].filter(x => !x.priv && x.ph === 'lobby' && x.players.length < MAX_P).map(x => ({ id: x.id, n: x.players.length, host: (x.players.find(p => p.key === x.host) || {}).name || '' })) });
      case 'sus_quick': { if (l) return bc(l); const pick = [...L.values()].filter(x => !x.priv && (x.ph === 'lobby' || x.ph === 'count') && x.players.length < MAX_P).sort((a, b) => b.players.length - a.players.length)[0]; l = pick || newLobby(ws, false); addP(l, ws); if (l.ph === 'lobby' && l.players.length >= MAX_P) { l.ph = 'count'; l.t = t + 4000; } return bc(l); }
      case 'sus_create': { if (l) leaveL(ws, true); l = newLobby(ws, true); addP(l, ws); return bc(l); }
      case 'sus_join': { const x = [...L.values()].find(y => y.code === String(d.code || '').trim()); if (!x) return send(ws, { t: 'sus_err', error: 'ما لكيت غرفة بهذا الرمز' }); if (x.ph !== 'lobby' && x.ph !== 'count') return send(ws, { t: 'sus_err', error: 'اللعبة بديت، انتظر تخلص' }); if (x.players.length >= MAX_P) return send(ws, { t: 'sus_err', error: 'الغرفة مليانة (5 لاعبين)' }); if (l && l !== x) leaveL(ws, true); if (!x.players.some(p => p.ws === ws)) addP(x, ws); return bc(x); }
      case 'sus_leave': return leaveL(ws);
      case 'sus_get': return l ? send(ws, { t: 'sus_state', s: pub(l, ws) }) : send(ws, { t: 'sus_state', s: null });
    }
    if (!l || !me) return;
    switch (d.t) {
      case 'sus_ch': { const c = d.ch | 0; if (l.ph !== 'lobby' || c < 0 || c > 7 || l.players.some(p => p !== me && !p.left && p.ch === c)) return; me.ch = c; return bc(l); }
      case 'sus_start': { if (l.host !== ws.key || l.ph !== 'lobby') return; if (l.players.length < MIN_P) return send(ws, { t: 'sus_err', error: 'لازم 3 لاعبين على الأقل' }); l.ph = 'count'; l.t = t + 3500; return bc(l); }
      case 'sus_pos': { if (l.ph !== 'play' || Number.isInteger(me.vent)) return; const x = Number(d.x), y = Number(d.y); if (!Number.isFinite(x) || !Number.isFinite(y)) return; const dt = Math.max(16, t - (me.pt || t - 100)); me.pt = t; const lim = SPEED * dt / 16 * 1.6 + 6; let nx = x, ny = y; const dd = Math.hypot(x - me.x, y - me.y); if (dd > lim) { nx = me.x + (x - me.x) / dd * lim; ny = me.y + (y - me.y) / dd * lim; } if (me.alive && !inWalk(nx, ny)) return; me.x = Math.max(0, Math.min(MAP.w, nx)); me.y = Math.max(0, Math.min(MAP.h, ny)); me.dir = d.dir < 0 ? -1 : 1; me.mv = d.mv ? 1 : 0; return; }
      case 'sus_task': { if (l.ph !== 'play' || me.role !== 'crew' || Number.isInteger(me.vent)) return; const id = d.id | 0, tk = MAP.tasks[id]; if (!tk || !me.tasks.includes(id) || me.done.has(id)) return; if (Math.hypot(tk.x - me.x, tk.y - me.y) > USE_R + 20) return; me.done.add(id); if (!checkWin(l)) bc(l); return; }
      case 'sus_kill': { if (l.ph !== 'play' || me.role !== 'imp' || !me.alive || t < me.kcd || Number.isInteger(me.vent)) return; const v = l.players[d.i | 0]; if (!v || v === me || !v.alive || v.left || v.role === 'imp' || Number.isInteger(v.vent)) return; if (Math.hypot(v.x - me.x, v.y - me.y) > KILL_R + 14) return;
        v.alive = false; me.kcd = t + KILL_CD; l.bodies.push({ n: v.name, ch: v.ch, x: Math.round(v.x), y: Math.round(v.y), i: d.i | 0 });
        for (const p of l.players) if (p.ws && !p.left) send(p.ws, { t: 'sus_kill', i: d.i | 0, x: v.x, y: v.y, you: p === v }); if (!checkWin(l)) bc(l); return; }
      case 'sus_report': { if (l.ph !== 'play' || !me.alive || Number.isInteger(me.vent)) return; const b = l.bodies.find(q => Math.hypot(q.x - me.x, q.y - me.y) <= REPORT_R + 15); if (!b) return; return meeting(l, me, b.n); }
      /* 🕳️ الأنفاق: اطب بنفق، تنقّل بين أنفاق نفس الشبكة، واطلع من مكان ثاني */
      case 'sus_vent': { if (l.ph !== 'play' || !me.alive || Number.isInteger(me.vent)) return; const vi = d.id | 0, v = VENTS[vi]; if (!v) return; if (Math.hypot(v.x - me.x, v.y - me.y) > USE_R + 20) return;
        if (me.role !== 'imp' && t < (me.vcd || 0)) return send(ws, { t: 'sus_err', error: 'النفق يحتاج ' + Math.ceil((me.vcd - t) / 1000) + ' ثانية 🕳️' });
        me.vent = vi; me.x = v.x; me.y = v.y; me.mv = 0; ventFx(l, v, 'in', me); return bc(l); }
      case 'sus_vmove': { if (l.ph !== 'play' || !Number.isInteger(me.vent)) return; const cur = VENTS[me.vent], to = VENTS[d.to | 0]; if (!cur || !to || to.g !== cur.g || (d.to | 0) === me.vent) return; if (t - (me.vmt || 0) < 350) return; me.vmt = t; me.vent = d.to | 0; me.x = to.x; me.y = to.y; return bc(l); }
      case 'sus_vexit': { if (l.ph !== 'play' || !Number.isInteger(me.vent)) return; const v = VENTS[me.vent]; me.vent = null; if (v) { me.x = v.x; me.y = v.y; ventFx(l, v, 'out', me); } if (me.role !== 'imp') me.vcd = t + VENT_CD; return bc(l); }
      case 'sus_emerg': { if (l.ph !== 'play' || !me.alive || me.em || Number.isInteger(me.vent)) return; if (Math.hypot(MAP.button[0] - me.x, MAP.button[1] - me.y) > USE_R + 20) return; me.em = true; return meeting(l, me, null); }
      case 'sus_chat': { if ((l.ph !== 'meet' && l.ph !== 'vote') || !me.alive) return; if (t - (me.ct || 0) < 900) return; me.ct = t; const txt = String(d.txt || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 120); if (!txt) return; l.chat.push({ n: me.name, ch: me.ch, txt }); while (l.chat.length > 60) l.chat.shift(); return bc(l); }
      case 'sus_vote': { if (l.ph !== 'vote' || !me.alive || me.vote) return; if (d.v === 'skip') me.vote = 'skip'; else { const v = l.players[d.v | 0]; if (!v || !v.alive || v.left) return; me.vote = v.key; } bc(l); return maybeTally(l); }
    }
  }
  return { onMsg, leave: ws => leaveL(ws) };
};
