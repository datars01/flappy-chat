/* ===================== لعبة «منتظر روت» 🧠 (برينروت أونلاين) — السيرفر =====================
   7 قواعد = 7 لاعبين بنفس الخريطة. كل قاعدة بيها 10 منصات (10 برينروت كحد أقصى).
   تشتري من السجادة، البرينروت يطلّعلك فلوس، تسرق من قواعد غيرك وتقفل قاعدتك، بيض يفقس، دمج، ومعارك.
   السيرفر هو الحَكَم بكلشي، وكل شي ينحفظ بحساب اللاعب (u.br). */
'use strict';
module.exports = function rootInit(ctx) {
  const { db, save, send, isRich } = ctx;
  const W = 2240, H = 1400, CP = { y0: 630, y1: 770 }, SPEED = 250, CARRY = 0.6, SLOTS = 10, MAXB = 7, STEAL_MS = 45000, BAG_MAX = 40, LV_MAX = 18;
  // مستوى القاعدة 1..18: مدة قفل الباب تبدي 40 ثانية وتزيد 10 ثواني كل مستوى (المستوى 18 = 210 ثانية)
  const lockSec = lv => 40 + (Math.max(1, Math.min(LV_MAX, lv | 0)) - 1) * 10;
  const upCost = lv => Math.round(400 * Math.pow(1.85, lv - 1) / 10) * 10;   // كلفة الصعود من lv إلى lv+1
  const RI = { common: 0, rare: 1, epic: 2, leg: 3, myth: 4, secret: 5 };
  const CAT = [
    ['istikan', 'common', 60, 1], ['samoon', 'common', 90, 2], ['nial', 'common', 140, 3],
    ['batikh', 'rare', 600, 9], ['dolma', 'rare', 900, 13], ['gaz', 'rare', 1400, 18],
    ['masgouf', 'epic', 6000, 70], ['fridge', 'epic', 9000, 95], ['cactus', 'epic', 13000, 130],
    ['tamr', 'leg', 55000, 520], ['betinjan', 'leg', 80000, 700], ['panka', 'leg', 110000, 900],
    ['kubba', 'myth', 420000, 3800], ['jamal', 'myth', 650000, 5200],
    ['qamar', 'secret', 3000000, 24000], ['muntadher', 'secret', 7777777, 60000]
  ].map(([id, r, p, inc]) => ({ id, r, p, inc }));
  const CD = {}; CAT.forEach(c => CD[c.id] = c);
  const RW = { common: 620, rare: 250, epic: 95, leg: 28, myth: 6, secret: 1 };
  const MUT = [1, 2, 5, 12];   // عادي، ذهبي، ألماس، قوس قزح
  const EGGS = { e1: { p: 1000, t: 30, w: { common: 70, rare: 28, epic: 2 } }, e2: { p: 25000, t: 90, w: { rare: 55, epic: 35, leg: 10 } }, e3: { p: 500000, t: 180, w: { epic: 40, leg: 40, myth: 17, secret: 3 } } };
  const FIGHT = { 1: { k: .8, r: 1 }, 2: { k: 1.15, r: 2.5 }, 3: { k: 1.6, r: 6 } };

  // القواعد: 4 فوك (بابها جوه على السجادة) و3 جوه (بابها فوك) + الساحة (بيض، دمج، معارك)
  const BW = 470, BH = 470;
  const BPOS = [[60, 110, 1], [610, 110, 1], [1160, 110, 1], [1710, 110, 1], [60, 820, -1], [610, 820, -1], [1160, 820, -1]];
  const HUB = { x: 1710, y: 820, w: BW, h: BH, egg: { x: 1830, y: 1150 }, merge: { x: 2070, y: 1150 }, arena: { x: 1945, y: 960 } };
  const COLORS = ['#ff4f5e', '#3fa7ff', '#ffb020', '#2fd6a3', '#b46bff', '#ff7ab8', '#9be15d'];
  const geo = BPOS.map(([x, y, d], i) => {
    const back = d > 0 ? y : y + BH, front = d > 0 ? y + BH : y;
    const ped = []; for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) ped.push([x + 55 + k * 90, back + d * (95 + r * 125)]);
    return { i, x, y, w: BW, h: BH, d, front, back, ped, collect: [x + 110, front - d * 55], lock: [x + BW - 110, front - d * 55], spawn: [x + BW / 2, front - d * 40], col: COLORS[i] };
  });
  const B = geo.map(() => ({ owner: null, name: '', lockUntil: 0 }));
  const P = new Map();          // key → لاعب
  let carpet = [], uidN = 1, spawnT = 0, lastBc = 0, lastSave = Date.now();

  const now = () => Date.now();
  const rnd = n => Math.floor(Math.random() * n);
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const user = k => db.users[k];
  const rich = k => { try { return !!isRich(user(k)); } catch (e) { return false; } };
  const inRect = (x, y, g, pad) => x > g.x - (pad || 0) && x < g.x + g.w + (pad || 0) && y > g.y - (pad || 0) && y < g.y + g.h + (pad || 0);
  function pickW(w) { let s = 0; for (const k in w) s += w[k]; let v = Math.random() * s; for (const k in w) { v -= w[k]; if (v <= 0) return k; } return Object.keys(w)[0]; }
  function pickChar(r) { const L = CAT.filter(c => c.r === r); return L[rnd(L.length)]; }
  function brOf(k) {
    const u = user(k); if (!u) return null;
    if (!u.br || !Array.isArray(u.br.slots)) u.br = { coins: 250, slots: Array(SLOTS).fill(null), bank: 0, wins: 0, steals: 0, lvl: 1, bag: [] };
    if (!Array.isArray(u.br.bag)) u.br.bag = []; if (!u.br.lvl) u.br.lvl = 1;
    while (u.br.slots.length < SLOTS) u.br.slots.push(null); u.br.slots.length = SLOTS;
    if (rich(k)) { if (u.br.coins < 1e12) u.br.coins = 1e12; u.br.lvl = LV_MAX; }
    return u.br;
  }
  const incOf = s => (s && !s.egg && !s.gone && CD[s.id]) ? CD[s.id].inc * MUT[s.m || 0] : 0;
  const priceOf = (id, m) => CD[id].p * MUT[m || 0];
  const freeSlot = br => br.slots.findIndex(s => !s);
  function stash(k, item) {   // يحط البرينروت بأول منصة فاضية، وإذا ماكو بالحقيبة
    const br = brOf(k), fi = freeSlot(br); if (fi >= 0) { br.slots[fi] = item; return { slot: fi }; }
    if (rich(k) || br.bag.length < BAG_MAX) { br.bag.push(item); return { bag: 1 }; } return null;
  }
  const hasRoom = k => { const br = brOf(k); return freeSlot(br) >= 0 || rich(k) || br.bag.length < BAG_MAX; };
  const toast = (p, msg, k) => p && p.ws && send(p.ws, { t: 'br_toast', msg, k: k || '' });
  const fx = (p, k, x, y, extra) => { const o = Object.assign({ t: 'br_fx', k, x, y }, extra || {}); for (const q of P.values()) send(q.ws, o); };
  function pay(p, n) { const br = brOf(p.key); if (rich(p.key)) return true; if (br.coins < n) return false; br.coins -= n; return true; }
  const fmt = n => n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(Math.floor(n));

  /* ---------- الدخول والطلوع ---------- */
  function join(ws) {
    const k = ws.key, u = user(k); if (!u) return;
    let p = P.get(k);
    if (p) { if (p.ws !== ws) { try { send(p.ws, { t: 'br_kicked', error: 'دخلت من جهاز ثاني' }); } catch (e) {} p.ws = ws; } return sendInit(p); }
    const bi = B.findIndex(b => !b.owner); if (bi < 0) return send(ws, { t: 'br_full', error: 'الخريطة مليانة — 7 لاعبين جوه. جرب بعد شوي' });
    const br = brOf(k); B[bi].owner = k; B[bi].name = u.name; B[bi].lockUntil = 0;
    br.slots.forEach(s => { if (s) delete s.gone; });
    const g = geo[bi]; p = { ws, key: k, name: u.name, base: bi, x: g.spawn[0], y: g.spawn[1], ix: 0, iy: 0, carry: null, fightAt: 0, dir: 1 };
    P.set(k, p); save(); sendInit(p); toastAll('👋 ' + u.name + ' دخل اللعبة', p);
  }
  function sendInit(p) { send(p.ws, { t: 'br_init', me: p.key, name: p.name, base: p.base, W, H, CP, geo, hub: HUB, cat: CAT, mut: MUT, eggs: EGGS, rich: rich(p.key), lvMax: LV_MAX }); bcOne(p); }
  function toastAll(msg, except) { for (const q of P.values()) if (q !== except) toast(q, msg); }
  function leave(ws) {
    const p = [...P.values()].find(q => q.ws === ws); if (!p) return;
    if (p.carry) returnStolen(p.carry, '');
    for (const q of P.values()) if (q.carry && q.carry.from === p.base) finishSteal(q);   // صاحب القاعدة طلع: السرقة تنجح
    const b = B[p.base]; b.owner = null; b.name = ''; b.lockUntil = 0; P.delete(p.key); save(); toastAll('🚪 ' + p.name + ' طلع من اللعبة');
  }

  /* ---------- السرقة ---------- */
  function ownerP(bi) { const k = B[bi].owner; return k ? P.get(k) : null; }
  function returnStolen(c, msg) { const o = B[c.from].owner, br = o && brOf(o); if (br && br.slots[c.slot] && br.slots[c.slot].gone) delete br.slots[c.slot].gone; if (msg) toastAll(msg); }
  function finishSteal(p) {
    const c = p.carry; p.carry = null; const o = B[c.from].owner, obr = o && brOf(o), mbr = brOf(p.key);
    if (!hasRoom(p.key)) { returnStolen(c, ''); return toast(p, 'قاعدتك وحقيبتك مليانة! البرينروت رجع لصاحبه'); }
    if (obr && obr.slots[c.slot] && obr.slots[c.slot].gone) obr.slots[c.slot] = null;
    const w = stash(p.key, { id: c.id, m: c.m || 0 }); mbr.steals = (mbr.steals || 0) + 1; save();
    const g = geo[p.base]; if (w && w.bag) toast(p, '🎒 المسروق راح لحقيبتك'); fx(p, 'steal', w && w.slot != null ? g.ped[w.slot][0] : p.x, w && w.slot != null ? g.ped[w.slot][1] : p.y, { id: c.id });
    toastAll('🦹 ' + p.name + ' سرق ' + c.id + ' من ' + (B[c.from].name || 'قاعدة'), null);
  }

  /* ---------- الرسائل ---------- */
  function onMsg(ws, d) {
    if (d.t === 'br_join') return join(ws);
    if (d.t === 'br_leave') return leave(ws);
    const p = [...P.values()].find(q => q.ws === ws); if (!p) return;
    const br = brOf(p.key), g = geo[p.base], t = now();
    if (d.t === 'br_in') { let x = +d.x || 0, y = +d.y || 0; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } p.ix = x; p.iy = y; if (x) p.dir = x > 0 ? 1 : -1; return; }
    if (d.t === 'br_buy') {
      const it = carpet.find(c => c.u === d.u); if (!it) return toast(p, 'راح! جرب غيره');
      if (dist(p.x, p.y, it.x, it.y) > 110) return toast(p, 'قرّب أكثر من البرينروت');
      if (!hasRoom(p.key)) return toast(p, 'قاعدتك وحقيبتك مليانة — بيع وحد أو ادمج');
      const pr = priceOf(it.id, it.m); if (!pay(p, pr)) return toast(p, 'فلوسك ما تكفي — تحتاج ' + fmt(pr) + ' 💰');
      carpet = carpet.filter(c => c !== it); const w = stash(p.key, { id: it.id, m: it.m }); save();
      if (w.bag) { toast(p, '🎒 المنصات مليانة — راح لحقيبتك'); return fx(p, 'buy', p.x, p.y, { id: it.id, fx: it.x, fy: it.y, by: p.name }); }
      return fx(p, 'buy', g.ped[w.slot][0], g.ped[w.slot][1], { id: it.id, fx: it.x, fy: it.y, by: p.name });
    }
    if (d.t === 'br_steal') {
      const bi = d.b | 0, si = d.s | 0, gb = geo[bi], b = B[bi]; if (!gb || bi === p.base || !b.owner) return;
      if (p.carry) return toast(p, 'انت شايل برينروت هسه!');
      if (b.lockUntil > t) return toast(p, '🔒 القاعدة مقفولة');
      const obr = brOf(b.owner), s = obr && obr.slots[si]; if (!s || s.egg || s.gone) return;
      if (dist(p.x, p.y, gb.ped[si][0], gb.ped[si][1]) > 80) return toast(p, 'قرّب من المنصة');
      if (!hasRoom(p.key)) return toast(p, 'قاعدتك وحقيبتك مليانة — ما عندك مكان للمسروق');
      s.gone = 1; p.carry = { from: bi, slot: si, id: s.id, m: s.m || 0, at: t };
      const op = ownerP(bi); toast(op, '🚨 ' + p.name + ' يسرق منك! الحگه وامسكه', 'alarm'); return toast(p, '🏃 اركض لقاعدتك قبل لا يمسكك!');
    }
    if (d.t === 'br_lock') {
      if (dist(p.x, p.y, g.lock[0], g.lock[1]) > 70) return toast(p, 'روح لزر القفل بقاعدتك');
      if (B[p.base].lockUntil > t) return; B[p.base].lockUntil = t + lockSec(br.lvl) * 1000; return fx(p, 'lock', g.lock[0], g.lock[1], { b: p.base, sec: lockSec(br.lvl) });
    }
    if (d.t === 'br_up') {
      if (dist(p.x, p.y, g.lock[0], g.lock[1]) > 90) return toast(p, 'روح لزر القفل بقاعدتك حتى تطوّرها');
      if (br.lvl >= LV_MAX) return toast(p, 'قاعدتك بأعلى مستوى (18) 👑');
      const c = upCost(br.lvl); if (!pay(p, c)) return toast(p, 'فلوسك ما تكفي — التطوير يحتاج ' + fmt(c) + ' 💰');
      br.lvl++; save(); return fx(p, 'up', g.lock[0], g.lock[1], { lv: br.lvl, sec: lockSec(br.lvl) });
    }
    if (d.t === 'br_place') {   // من الحقيبة للمنصة (لازم تكون داخل قاعدتك)
      if (!inRect(p.x, p.y, g, 10)) return toast(p, 'ادخل قاعدتك حتى تنصب البرينروت');
      const si = d.s | 0; if (si < 0 || si >= SLOTS || br.slots[si]) return toast(p, 'هذي المنصة مشغولة');
      let item;
      if (d.cat && rich(p.key)) { if (!CD[d.cat.id]) return; item = { id: d.cat.id, m: Math.max(0, Math.min(MUT.length - 1, d.cat.m | 0)) }; }   // المشرف: كل البرينروتات بلا حدود
      else { const bi = d.b | 0; if (!br.bag[bi]) return; item = br.bag.splice(bi, 1)[0]; }
      br.slots[si] = item; save(); return fx(p, 'place', g.ped[si][0], g.ped[si][1], { id: item.id });
    }
    if (d.t === 'br_pick') {   // من المنصة للحقيبة
      if (!inRect(p.x, p.y, g, 10)) return toast(p, 'ادخل قاعدتك حتى تشيل البرينروت');
      const si = d.s | 0, s = br.slots[si]; if (!s || s.egg || s.gone) return;
      if (!rich(p.key) && br.bag.length >= BAG_MAX) return toast(p, 'حقيبتك مليانة (' + BAG_MAX + ')');
      br.slots[si] = null; if (!rich(p.key)) br.bag.push({ id: s.id, m: s.m || 0 }); save(); return fx(p, 'pick', g.ped[si][0], g.ped[si][1], { id: s.id });
    }
    if (d.t === 'br_bagsell') {
      if (rich(p.key)) return; const bi = d.b | 0, it = br.bag[bi]; if (!it) return;
      br.bag.splice(bi, 1); const v = Math.floor(priceOf(it.id, it.m) * .5); br.coins += v; save(); return toast(p, '💰 بعت ' + it.id + ' بـ ' + fmt(v));
    }
    if (d.t === 'br_sell') {
      const si = d.s | 0, s = br.slots[si]; if (!s || s.egg || s.gone) return;
      if (dist(p.x, p.y, g.ped[si][0], g.ped[si][1]) > 80) return toast(p, 'قرّب من المنصة');
      const v = Math.floor(priceOf(s.id, s.m) * .5); br.slots[si] = null; if (!rich(p.key)) br.coins += v; save();
      return fx(p, 'sell', g.ped[si][0], g.ped[si][1], { v });
    }
    if (d.t === 'br_egg') {
      const E = EGGS[d.k]; if (!E) return; if (dist(p.x, p.y, HUB.egg.x, HUB.egg.y) > 140) return toast(p, 'روح لمحل البيض');
      const fi = freeSlot(br); if (fi < 0) return toast(p, 'قاعدتك مليانة — البيضة تحتاج منصة فاضية');
      if (!pay(p, E.p)) return toast(p, 'فلوسك ما تكفي — تحتاج ' + fmt(E.p) + ' 💰');
      br.slots[fi] = { egg: d.k, at: t + E.t * 1000 }; save(); return toast(p, '🥚 البيضة نزلت بقاعدتك، تفقس بعد ' + E.t + ' ثانية', 'egg');
    }
    if (d.t === 'br_merge') {
      if (dist(p.x, p.y, HUB.merge.x, HUB.merge.y) > 140) return toast(p, 'روح لمكينة الدمج');
      const a = d.a | 0, b2 = d.b | 0, A = br.slots[a], Bb = br.slots[b2];
      if (a === b2 || !A || !Bb || A.egg || Bb.egg || A.gone || Bb.gone || A.id !== Bb.id || (A.m || 0) !== (Bb.m || 0)) return toast(p, 'لازم اثنين من نفس الشخصية ونفس النوع');
      if ((A.m || 0) >= MUT.length - 1) return toast(p, 'هذا أعلى مستوى ✨');
      br.slots[a] = { id: A.id, m: (A.m || 0) + 1 }; br.slots[b2] = null; save();
      return send(p.ws, { t: 'br_merged', id: A.id, m: (A.m || 0) + 1 });
    }
    if (d.t === 'br_fight') return fight(p, d);
  }

  /* ---------- المعارك (ضد فريق ذكاء اصطناعي) ---------- */
  function unit(id, m, k) { const c = CD[id], r = RI[c.r]; return { id, m, hp: Math.round((110 + r * 95 + m * 70) * k), atk: Math.round((14 + r * 15 + m * 12) * k) }; }
  function fight(p, d) {
    const br = brOf(p.key), t = now(), lv = FIGHT[d.lv | 0] ? d.lv | 0 : 1;
    if (dist(p.x, p.y, HUB.arena.x, HUB.arena.y) > 170) return toast(p, 'روح للحلبة');
    if (t < p.fightAt) return toast(p, 'استريح شوي — المعركة الجاية بعد ' + Math.ceil((p.fightAt - t) / 1000) + ' ثانية');
    const team = [...new Set((d.team || []).map(x => x | 0))].slice(0, 3).filter(i => br.slots[i] && !br.slots[i].egg && !br.slots[i].gone);
    if (!team.length) return toast(p, 'اختار برينروت واحد على الأقل');
    p.fightAt = t + 30000;
    const me = team.map(i => unit(br.slots[i].id, br.slots[i].m || 0, 1));
    const avg = me.reduce((s, u) => s + RI[CD[u.id].r], 0) / me.length, F = FIGHT[lv];
    const en = [0, 1, 2].map(() => { const r = Math.max(0, Math.min(5, Math.round(avg + (Math.random() - .4)))); const c = pickChar(Object.keys(RI)[r]); return unit(c.id, rnd(2), F.k); });
    const A = me.map(u => Object.assign({}, u)), E = en.map(u => Object.assign({}, u)), log = [];
    let side = 0;
    for (let turn = 0; turn < 60; turn++) {
      const att = side ? E : A, def = side ? A : E, al = att.map((u, i) => i).filter(i => att[i].hp > 0), dl = def.map((u, i) => i).filter(i => def[i].hp > 0);
      if (!al.length || !dl.length) break;
      const ai = al[rnd(al.length)], di = dl[rnd(dl.length)], crit = Math.random() < .15, dmg = Math.round(att[ai].atk * (0.8 + Math.random() * .4) * (crit ? 2 : 1));
      def[di].hp = Math.max(0, def[di].hp - dmg); log.push([side, ai, di, dmg, crit ? 1 : 0]); side ^= 1;
    }
    const win = E.every(u => u.hp <= 0) || (A.reduce((s, u) => s + u.hp, 0) > E.reduce((s, u) => s + u.hp, 0) && !A.every(u => u.hp <= 0));
    const tot = br.slots.reduce((s, x) => s + incOf(x), 0), reward = win ? Math.round((300 + tot * 25) * F.r) : 0;
    if (win) { if (!rich(p.key)) br.coins += reward; br.wins = (br.wins || 0) + 1; save(); }
    send(p.ws, { t: 'br_fight', me, en, log, win, reward, lv });
  }

  /* ---------- الحلقة: حركة، سجادة، فلوس، بيض، سرقة ---------- */
  let last = now();
  setInterval(() => {
    const t = now(), dt = Math.min(.1, (t - last) / 1000); last = t; if (!P.size) { carpet = []; return; }
    // السجادة
    spawnT -= dt; if (spawnT <= 0) { spawnT = 1.6 + Math.random() * 1.4; const c = pickChar(pickW(RW)); const mr = Math.random(); carpet.push({ u: uidN++, id: c.id, m: mr < .006 ? 2 : mr < .04 ? 1 : 0, x: -40, y: CP.y0 + 30 + Math.random() * (CP.y1 - CP.y0 - 60) }); }
    carpet.forEach(c => c.x += 52 * dt); carpet = carpet.filter(c => c.x < W + 50);
    for (const p of P.values()) {
      const sp = SPEED * (p.carry ? CARRY : 1); let nx = Math.max(16, Math.min(W - 16, p.x + p.ix * sp * dt)), ny = Math.max(16, Math.min(H - 16, p.y + p.iy * sp * dt));
      for (const g of geo) { const b = B[g.i]; if (g.i === p.base || !b.owner || b.lockUntil <= t) continue; if (inRect(nx, ny, g, 4)) { if (!inRect(p.x, ny, g, 4)) nx = p.x; else if (!inRect(nx, p.y, g, 4)) ny = p.y; else { nx = g.spawn[0]; ny = g.front + g.d * 40; } } }
      p.x = nx; p.y = ny;
      const g = geo[p.base], br = brOf(p.key);
      if (dist(p.x, p.y, g.collect[0], g.collect[1]) < 46 && br.bank >= 1) { const v = Math.floor(br.bank); br.bank -= v; if (!rich(p.key)) br.coins += v; send(p.ws, { t: 'br_fx', k: 'cash', x: g.collect[0], y: g.collect[1], v }); }
      if (p.carry) {
        if (inRect(p.x, p.y, g)) finishSteal(p);
        else if (t - p.carry.at > STEAL_MS) { returnStolen(p.carry, ''); p.carry = null; toast(p, '⌛ تأخرت! البرينروت رجع لصاحبه'); }
        else { const op = ownerP(p.carry.from); if (op && dist(op.x, op.y, p.x, p.y) < 52) { const c = p.carry; p.carry = null; returnStolen(c, '🛡️ ' + op.name + ' مسك ' + p.name + ' ورجّع البرينروت مالته'); fx(op, 'catch', p.x, p.y); } }
      }
    }
    // الفلوس + البيض
    for (const p of P.values()) { const br = brOf(p.key); let inc = 0; br.slots.forEach((s, i) => { if (s && s.egg && t >= s.at) { const c = pickChar(pickW(EGGS[s.egg].w)); br.slots[i] = { id: c.id, m: Math.random() < .08 ? 1 : 0 }; const g = geo[p.base]; fx(p, 'hatch', g.ped[i][0], g.ped[i][1], { id: c.id }); } inc += incOf(br.slots[i]); }); br.bank = (br.bank || 0) + inc * dt; }
    if (t - lastSave > 15000) { lastSave = t; save(); }
    if (t - lastBc >= 100) { lastBc = t; bcAll(); }
  }, 50);

  function pubBases(t) { return geo.map(g => { const b = B[g.i], br = b.owner ? brOf(b.owner) : null; return { o: b.name, k: b.owner || '', lv: br ? br.lvl : 0, lk: Math.max(0, b.lockUntil - t), bank: br ? Math.floor(br.bank || 0) : 0, s: br ? br.slots.map(s => !s ? 0 : s.egg ? [0, 0, s.egg, Math.max(0, s.at - t)] : [s.id, s.m || 0, 0, 0, s.gone ? 1 : 0]) : [] }; }); }
  function pubPlayers() { return [...P.values()].map(p => [p.key, p.name, Math.round(p.x), Math.round(p.y), p.base, p.carry ? [p.carry.id, p.carry.m] : 0, p.dir, (p.ix || p.iy) ? 1 : 0, rich(p.key) ? 1 : 0]); }
  function bcAll() { const t = now(), bs = pubBases(t), pl = pubPlayers(), cp = carpet.map(c => [c.u, c.id, c.m, Math.round(c.x), Math.round(c.y)]); for (const p of P.values()) { const br = brOf(p.key); send(p.ws, Object.assign({ t: 'br_s', pl, bs, cp, fcd: Math.max(0, p.fightAt - t) }, meOf(p))); } }
  function bcOne(p) { const t = now(), br = brOf(p.key); send(p.ws, Object.assign({ t: 'br_s', pl: pubPlayers(), bs: pubBases(t), cp: carpet.map(c => [c.u, c.id, c.m, Math.round(c.x), Math.round(c.y)]), fcd: 0 }, meOf(p))); }
  function meOf(p) { const br = brOf(p.key); return { c: Math.floor(br.coins), inc: br.slots.reduce((s, x) => s + incOf(x), 0), bag: br.bag.map(b => [b.id, b.m || 0]), lv: br.lvl, ls: lockSec(br.lvl), uc: br.lvl < LV_MAX ? upCost(br.lvl) : 0, adm: rich(p.key) ? 1 : 0, bagMax: BAG_MAX }; }

  return { onMsg, leave };
};
