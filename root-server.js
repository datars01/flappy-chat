/* ===================== لعبة «منتظر روت» 🧠 (برينروت أونلاين) — السيرفر =====================
   7 قواعد = 7 لاعبين بنفس الخريطة. كل قاعدة بيها 10 منصات (10 برينروت كحد أقصى).
   تشتري من السجادة، البرينروت يطلّعلك فلوس، تسرق من قواعد غيرك وتقفل قاعدتك، بيض يفقس، دمج، ومعارك.
   السيرفر هو الحَكَم بكلشي، وكل شي ينحفظ بحساب اللاعب (u.br). */
'use strict';
module.exports = function rootInit(ctx) {
  const { db, save, send, isRich } = ctx;
  const K$ = 30000, KP = 500, START = 100000;   // 💰 الدخل ×30K (أرخص برينروت يطلّع 30K/ث)، والأسعار ×500 (أرخص برينروت = 30K) حتى اللاعب الجديد يكدر يشتري بهدية البداية
  const W = 6200, H = 2300, CP = { y0: 1060, y1: 1200 }, SPEED = 330, CARRY = 0.6, SLOTS = 10, MAXB = 7, STEAL_MS = 45000, BAG_MAX = 64, LV_MAX = 18;
  // مستوى القاعدة 1..18: مدة قفل الباب تبدي 40 ثانية وتزيد 10 ثواني كل مستوى (المستوى 18 = 210 ثانية)
  const lockSec = lv => 40 + (Math.max(1, Math.min(LV_MAX, lv | 0)) - 1) * 10;
  const upCost = lv => Math.round(400 * Math.pow(1.85, lv - 1) / 10) * 10 * KP;   // كلفة الصعود من lv إلى lv+1
  const RI = { common: 0, rare: 1, epic: 2, leg: 3, myth: 4, secret: 5 };
  const CAT = [
    ['istikan', 'common', 60, 1], ['samoon', 'common', 90, 2], ['nial', 'common', 140, 3],
    ['batikh', 'rare', 600, 9], ['dolma', 'rare', 900, 13], ['gaz', 'rare', 1400, 18],
    ['masgouf', 'epic', 6000, 70], ['fridge', 'epic', 9000, 95], ['cactus', 'epic', 13000, 130],
    ['tamr', 'leg', 55000, 520], ['betinjan', 'leg', 80000, 700], ['panka', 'leg', 110000, 900],
    ['kubba', 'myth', 420000, 3800], ['jamal', 'myth', 650000, 5200],
    ['qamar', 'secret', 3000000, 24000], ['muntadher', 'secret', 7777777, 60000],
    // 🏆 جوائز المجموعة: ما تطلع بالسجادة ولا البيض، بس من الكتاب
    ['jamra', 'leg', 150000, 1500, 'c'], ['banafsaj', 'myth', 1500000, 12000, 's'], ['khariq', 'secret', 20000000, 150000, 'x'],
    ['hazzo', 'secret', 30000000, 200000, 'L']   // 🍀 حظّو: يطلع من الباب العادي بنسبة 5% بس
  ].map(([id, r, p, inc, rw]) => ({ id, r, p: p * KP, inc: inc * K$, rw: rw || '' }));
  const CD = {}; CAT.forEach(c => CD[c.id] = c);
  const RW = { common: 620, rare: 250, epic: 95, leg: 28, myth: 6, secret: 1 };
  const MUT = [1, 2, 5, 12];   // عادي، ذهبي، ألماس، قوس قزح
  const EGGS = { e1: { p: 1000 * KP, t: 30, w: { common: 70, rare: 28, epic: 2 } }, e2: { p: 25000 * KP, t: 90, w: { rare: 55, epic: 35, leg: 10 } }, e3: { p: 500000 * KP, t: 180, w: { epic: 40, leg: 40, myth: 17, secret: 3 } } };
  // 🌀 الدمج داخل القاعدة: اثنين من نفس البرينروت → برينروت جديد أقوى، بنسبة نجاح ترفعها بالفلوس
  const FUSE = { ch: { common: 70, rare: 60, epic: 50, leg: 40, myth: 30, secret: 25 }, feeK: .3, boostK: .6, step: 10 };
  const NEXT = { common: 'rare', rare: 'epic', epic: 'leg', leg: 'myth', myth: 'secret' };
  // 📚 مجموعات الكتاب: تجمعهن كلهن (ولو مرة وحدة) وتدوس «جمع» تاخذ برينروت جائزة + فلوس هواي
  const GROUPS = { c: { rs: ['common', 'rare'], rw: 'jamra', coins: 2e6 }, s: { rs: ['epic', 'leg'], rw: 'banafsaj', coins: 2e8 }, x: { rs: ['myth', 'secret'], rw: 'khariq', coins: 2e10 } };
  Object.values(GROUPS).forEach(gr => gr.ids = CAT.filter(c => !c.rw && gr.rs.includes(c.r)).map(c => c.id));
  const markSeen = br => { if (!br.seen || typeof br.seen !== 'object') br.seen = {}; br.slots.forEach(x => { if (x && !x.egg && x.id) br.seen[x.id] = 1; }); br.bag.forEach(x => { if (x && x.id) br.seen[x.id] = 1; }); };
  /* 🛒 الشوب + 🎉 الحفلة + 💣 الألغام + 🚨 الإنذار */
  const SHOP = { x: 2670, y: 905 }, CARP_END = 5250;
  const PARTY = { x: 5420, y: 520, w: 720, h: 1260 }; PARTY.door = [PARTY.x, (CP.y0 + CP.y1) / 2];
  const PANS = [{ n: 'طاوة حديد', p: 5e6, dmg: 1, stun: 2000, block: 20000, cd: 1400, rng: 95 }, { n: 'طاوة نحاس', p: 5e8, dmg: 2, stun: 3000, block: 40000, cd: 1000, rng: 115 }, { n: 'طاوة ذهب', p: 5e10, dmg: 4, stun: 4500, block: 70000, cd: 700, rng: 135 }];
  const SHOES = [{ n: 'جوتي سبورت', p: 2e6, sp: 1.25 }, { n: 'جوتي ريح', p: 2e8, sp: 1.5 }, { n: 'جوتي برق', p: 2e10, sp: 1.85 }];
  const MINE_P = 3e6, MINE_MAX = 3, ALARM_P = 1e7, PARTY_MS = 5 * 60 * 1000;
  const PEGG = [{ n: 6, hp: 3, w: { common: 70, rare: 30 } }, { n: 4, hp: 6, w: { rare: 60, epic: 40 } }, { n: 3, hp: 12, w: { epic: 55, leg: 45 } }, { n: 2, hp: 22, w: { leg: 60, myth: 40 } }, { n: 1, hp: 45, w: { myth: 55, secret: 45 } }];
  let partyAt = Math.ceil(Date.now() / 3600000) * 3600000, partyEnd = 0, peggs = [], peggN = 1;
  function partyStart(t) { partyEnd = t + PARTY_MS; peggs = []; PEGG.forEach((e, ti) => { for (let i = 0; i < e.n; i++) peggs.push({ u: peggN++, t: ti, hp: e.hp, max: e.hp, x: PARTY.x + 110 + Math.random() * (PARTY.w - 200), y: PARTY.y + 120 + Math.random() * (PARTY.h - 240) }); }); for (const q of P.values()) send(q.ws, { t: 'br_fx', k: 'party', x: PARTY.x, y: PARTY.door[1] }); toastAll('🎉 الحفلة بدت! روح للباب بآخر الخريطة واكسر البيض بالطاوة'); }
  const FIGHT = { 1: { k: .8, r: 1 }, 2: { k: 1.15, r: 2.5 }, 3: { k: 1.6, r: 6 } };

  // القواعد: 4 فوك (بابها جوه على السجادة) و3 جوه (بابها فوك) + الساحة (بيض، دمج، معارك)
  // كل منصة بينها وبين اللي يمها مكان برينروتين، وبين القواعد الفوك واللي كدامها مسافة جبيرة
  const BW = 1200, BH = 650, GAPX = 1300;
  const BPOS = [[60, 110, 1], [60 + GAPX, 110, 1], [60 + GAPX * 2, 110, 1], [60 + GAPX * 3, 110, 1], [60, 1500, -1], [60 + GAPX, 1500, -1], [60 + GAPX * 2, 1500, -1]];
  const HUB = { x: 60 + GAPX * 3, y: 1500, w: BW, h: BH, egg: { x: 60 + GAPX * 3 + 300, y: 1950 }, merge: { x: 60 + GAPX * 3 + 900, y: 1950 }, arena: { x: 60 + GAPX * 3 + 600, y: 1720 } };
  const COLORS = ['#ff4f5e', '#3fa7ff', '#ffb020', '#2fd6a3', '#b46bff', '#ff7ab8', '#9be15d'];
  const geo = BPOS.map(([x, y, d], i) => {
    const back = d > 0 ? y : y + BH, front = d > 0 ? y + BH : y;
    const ped = []; for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) ped.push([x + 120 + k * 240, back + d * (120 + r * 270)]);
    return { i, x, y, w: BW, h: BH, d, front, back, ped, cash: ped.map(([px, pz]) => [px, pz + d * 80]), collect: [x + 110, front - d * 55], lock: [x + BW - 110, front - d * 55], spawn: [x + BW / 2, front - d * 40], col: COLORS[i] };
  });
  const B = geo.map(() => ({ owner: null, name: '', lockUntil: 0 }));
  const P = new Map();          // key → لاعب
  const LINE = (CP.y0 + CP.y1) / 2, GATE = { x: 40, s: CP.y0 - 150, n: CP.y1 + 150 }, SPEC_MS = 5 * 60 * 1000, RW_SPEC = { leg: 60, myth: 32, secret: 8 };
  let specAt = Date.now() + SPEC_MS, payT = 0, carpet = [], uidN = 1, spawnT = 0, lastBc = 0, lastSave = Date.now();

  const now = () => Date.now();
  const rnd = n => Math.floor(Math.random() * n);
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const user = k => db.users[k];
  const rich = k => { try { return !!isRich(user(k)); } catch (e) { return false; } };
  const inRect = (x, y, g, pad) => x > g.x - (pad || 0) && x < g.x + g.w + (pad || 0) && y > g.y - (pad || 0) && y < g.y + g.h + (pad || 0);
  function pickW(w) { let s = 0; for (const k in w) s += w[k]; let v = Math.random() * s; for (const k in w) { v -= w[k]; if (v <= 0) return k; } return Object.keys(w)[0]; }
  function pickChar(r) { const L = CAT.filter(c => c.r === r && !c.rw); return L[rnd(L.length)]; }
  function brOf(k) {
    const u = user(k); if (!u) return null;
    if (!u.br || !Array.isArray(u.br.slots)) u.br = { k30: 1, coins: START, slots: Array(SLOTS).fill(null), bank: 0, wins: 0, steals: 0, lvl: 1, bag: [] };
    if (!u.br.k30) { u.br.k30 = 1; u.br.coins = Math.max(START, (u.br.coins || 0) * KP + (u.br.bank || 0) * KP); u.br.bank = 0; }   // تحويل الحسابات القديمة للأسعار الجديدة
    if (!Array.isArray(u.br.sb)) u.br.sb = Array(SLOTS).fill(0); while (u.br.sb.length < SLOTS) u.br.sb.push(0); u.br.sb.length = SLOTS;
    if (!Array.isArray(u.br.bag)) u.br.bag = []; if (!u.br.lvl) u.br.lvl = 1;
    while (u.br.slots.length < SLOTS) u.br.slots.push(null); u.br.slots.length = SLOTS;
    if (rich(k)) { if (u.br.coins < 1e12) u.br.coins = 1e12; u.br.lvl = LV_MAX; }
    if (u.name === 'منتظر' && !u.br.giftMun) { u.br.giftMun = 1; u.br.bag.unshift({ id: 'muntadher', m: 3 }); }   // 🎁 منتظرو الأعظم (قوس قزح) هدية بحقيبة منتظر
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
    const br = brOf(k); B[bi].owner = k; B[bi].name = u.name; B[bi].lockUntil = 0; B[bi].mines = [];
    br.slots.forEach(s => { if (s) delete s.gone; });
    const g = geo[bi]; p = { ws, key: k, name: u.name, base: bi, x: g.spawn[0], y: g.spawn[1], ix: 0, iy: 0, carry: null, fightAt: 0, dir: 1, pan: -1, panAt: 0, stunUntil: 0, noStealUntil: 0, inB: -1 };
    P.set(k, p); save(); sendInit(p); toastAll('👋 ' + u.name + ' دخل اللعبة', p);
  }
  function sendInit(p) { send(p.ws, { t: 'br_init', me: p.key, name: p.name, base: p.base, W, H, CP, geo, hub: HUB, shop: SHOP, party: PARTY, pans: PANS, shoesC: SHOES, mineP: MINE_P, mineMax: MINE_MAX, alarmP: ALARM_P, carpEnd: CARP_END, groups: GROUPS, fuse: FUSE, next: NEXT, gate: GATE, line: LINE, cat: CAT, mut: MUT, eggs: EGGS, rich: rich(p.key), lvMax: LV_MAX }); bcOne(p); }
  function toastAll(msg, except) { for (const q of P.values()) if (q !== except) toast(q, msg); }
  function leave(ws) {
    const p = [...P.values()].find(q => q.ws === ws); if (!p) return;
    if (p.carry) returnStolen(p.carry, '');
    for (const q of P.values()) if (q.carry && q.carry.from === p.base) finishSteal(q);   // صاحب القاعدة طلع: السرقة تنجح
    const b = B[p.base]; b.owner = null; b.name = ''; b.lockUntil = 0; b.mines = []; P.delete(p.key); save(); toastAll('🚪 ' + p.name + ' طلع من اللعبة');
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
      if (p.noStealUntil > t) return toast(p, '🍳 انضربت بالطاوة! ما تكدر تسرق ' + Math.ceil((p.noStealUntil - t) / 1000) + 'ث');
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
            const si = d.s | 0; if (si < 0 || si >= SLOTS || br.slots[si]) return toast(p, 'هذي المنصة مشغولة');
      let item;
      if (d.cat && rich(p.key)) { if (!CD[d.cat.id]) return; item = { id: d.cat.id, m: Math.max(0, Math.min(MUT.length - 1, d.cat.m | 0)) }; }   // المشرف: كل البرينروتات بلا حدود
      else { const bi = d.b | 0; if (!br.bag[bi]) return; item = br.bag.splice(bi, 1)[0]; }
      br.slots[si] = item; save(); return fx(p, 'place', g.ped[si][0], g.ped[si][1], { id: item.id });
    }
    if (d.t === 'br_pick') {   // من المنصة للحقيبة
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
    if (d.t === 'br_shop') {   // 🛒 الشوب
      if (d.k === 'party' && rich(p.key)) { partyStart(t); return; }
      if (dist(p.x, p.y, SHOP.x, SHOP.y) > 180) return toast(p, 'روح للشوب');
      br.shoes = br.shoes || { own: [], on: -1 }; const i = d.i | 0;
      if (d.k === 'pan') { const it = PANS[i]; if (!it) return; if (p.pan >= i) return toast(p, 'عندك طاوة بنفس القوة أو أقوى'); if (!pay(p, it.p)) return toast(p, 'فلوسك ما تكفي — تحتاج ' + fmt(it.p) + ' 💰'); p.pan = i; save(); return toast(p, '🍳 اشتريت ' + it.n + '! تروح منك إذا طلعت من اللعبة'); }
      if (d.k === 'shoe') { const it = SHOES[i]; if (!it) return; if (!br.shoes.own.includes(i)) { if (!pay(p, it.p)) return toast(p, 'فلوسك ما تكفي — تحتاج ' + fmt(it.p) + ' 💰'); br.shoes.own.push(i); } br.shoes.on = br.shoes.on === i && d.off ? -1 : i; save(); return toast(p, br.shoes.on === i ? '👟 لبست ' + it.n + ' — سرعتك ×' + it.sp : '👟 شلت الجوتي'); }
      if (d.k === 'mine') { if (!pay(p, MINE_P)) return toast(p, 'فلوسك ما تكفي — تحتاج ' + fmt(MINE_P) + ' 💰'); br.mines = (br.mines || 0) + 1; save(); return toast(p, '💣 صار عندك ' + br.mines + ' لغم — حطه يم باب قاعدتك'); }
      if (d.k === 'alarm') { if (br.alarm) return toast(p, 'عندك إنذار'); if (!pay(p, ALARM_P)) return toast(p, 'فلوسك ما تكفي — تحتاج ' + fmt(ALARM_P) + ' 💰'); br.alarm = 1; save(); return toast(p, '🚨 ركّبت الإنذار! أي واحد يدخل قاعدتك يرنّ عندك'); }
      if (d.k === 'party' && rich(p.key)) { partyStart(t); return; }
      return;
    }
    if (d.t === 'br_mine') {   // 💣 لغم يم الباب
      if (!(br.mines > 0)) return toast(p, 'ماعندك ألغام — اشتري من الشوب'); const b = B[p.base]; b.mines = b.mines || [];
      if (b.mines.length >= MINE_MAX) return toast(p, 'أكثر شي ' + MINE_MAX + ' ألغام بنفس الوقت');
      if (dist(p.x, p.y, g.x + g.w / 2, g.front) > 230) return toast(p, 'حط اللغم يم باب قاعدتك');
      br.mines--; b.mines.push({ x: p.x, y: p.y }); save(); return toast(p, '💣 حطيت لغم! محد يشوفه غيرك');
    }
    if (d.t === 'br_hit') {   // 🍳 ضربة طاوة على لاعب
      if (p.pan < 0) return toast(p, 'ماعندك طاوة — اشتري من الشوب'); const pn = PANS[p.pan]; if (t - p.panAt < pn.cd) return; const q = P.get(String(d.k)); if (!q || q === p) return;
      if (dist(p.x, p.y, q.x, q.y) > pn.rng) return toast(p, 'قرّب أكثر'); p.panAt = t; q.stunUntil = t + pn.stun; q.noStealUntil = t + pn.block; q.ix = q.iy = 0;
      if (q.carry) { returnStolen(q.carry, '🍳 ' + p.name + ' ضرب ' + q.name + ' بالطاوة ورجّع البرينروت!'); q.carry = null; }
      toast(q, '🍳 ' + p.name + ' ضربك بالطاوة! ما تكدر تسرق ' + Math.round(pn.block / 1000) + 'ث', 'alarm');
      for (const o of P.values()) send(o.ws, { t: 'br_fx', k: 'pan', x: q.x, y: q.y, tier: p.pan }); return;
    }
    if (d.t === 'br_hitegg') {   // 🥚 تكسير بيض الحفلة
      if (p.pan < 0) return toast(p, 'تحتاج طاوة حتى تكسر البيض — اشتري من الشوب'); const pn = PANS[p.pan]; if (t - p.panAt < Math.min(600, pn.cd)) return; const e = peggs.find(x => x.u === d.u); if (!e || partyEnd < t) return;
      if (dist(p.x, p.y, e.x, e.y) > 110) return toast(p, 'قرّب من البيضة'); p.panAt = t; e.hp -= pn.dmg;
      if (e.hp > 0) { for (const o of P.values()) send(o.ws, { t: 'br_fx', k: 'egghit', x: e.x, y: e.y }); return; }
      peggs = peggs.filter(x => x !== e); if (!hasRoom(p.key)) return toast(p, 'قاعدتك وحقيبتك مليانة — البيضة انكسرت بس ما كان عندك مكان 😢');
      const c = pickChar(pickW(PEGG[e.t].w)), item = { id: c.id, m: Math.random() < .12 * (e.t + 1) ? 1 : 0 }; stash(p.key, item); save();
      for (const o of P.values()) send(o.ws, { t: 'br_fx', k: 'eggwin', x: e.x, y: e.y, id: item.id, by: p.name }); return toastAll('🥚 ' + p.name + ' كسر بيضة وطلعله برينروت!', null);
    }
    if (d.t === 'br_chat') {   // 💬 محادثة اللعبة
      const m = String(d.m || '').replace(/\s+/g, ' ').trim().slice(0, 140); if (!m || t - (p.chatAt || 0) < 700) return; p.chatAt = t;
      for (const o of P.values()) send(o.ws, { t: 'br_chat', k: p.key, n: p.name, m, at: t }); return;
    }
    if (d.t === 'br_voice') {   // 🎙️ رسالة صوتية (اضغط واحجي)
      const a = String(d.a || ''); if (!a || a.length > 400000 || t - (p.voiceAt || 0) < 1500) return; p.voiceAt = t;
      for (const o of P.values()) if (o !== p) send(o.ws, { t: 'br_voice', k: p.key, n: p.name, a, mt: String(d.mt || 'audio/webm').slice(0, 40) }); return send(p.ws, { t: 'br_toast', msg: '🎙️ انرسل صوتك', k: '' });
    }
    if (d.t === 'br_claim') {   // 📚 جمع مجموعة
      const gr = GROUPS[d.g]; if (!gr) return; markSeen(br); br.cl = br.cl || {};
      if (br.cl[d.g]) return toast(p, 'أخذت جائزة هذي المجموعة قبل ✅');
      const miss = gr.ids.filter(id => !br.seen[id]); if (miss.length) return toast(p, 'باقيلك ' + miss.length + ' برينروت حتى تكمل المجموعة');
      if (!hasRoom(p.key)) return toast(p, 'قاعدتك وحقيبتك مليانة — فرّغ مكان أول');
      br.cl[d.g] = 1; stash(p.key, { id: gr.rw, m: 0 }); br.seen[gr.rw] = 1; if (!rich(p.key)) br.coins += gr.coins; save();
      return send(p.ws, { t: 'br_claimed', g: d.g, id: gr.rw, coins: gr.coins });
    }
    if (d.t === 'br_fuse') {
      const si = d.s | 0, A = br.slots[si]; if (!A || A.egg || A.gone || !CD[A.id]) return toast(p, 'ماكو برينروت هنا');
      if (dist(p.x, p.y, g.ped[si][0], g.ped[si][1]) > 110) return toast(p, 'روح يم البرينروت حتى تدمجه');
      const m = A.m || 0, r = CD[A.id].r; if (r === 'secret' && m >= MUT.length - 1) return toast(p, 'هذا أقوى شي باللعبة ✨ ما ينطوّر بعد');
      let ps = br.slots.findIndex((s2, i) => i !== si && s2 && !s2.egg && !s2.gone && s2.id === A.id && (s2.m || 0) === m), pb = ps < 0 ? br.bag.findIndex(b => b.id === A.id && (b.m || 0) === m) : -1;
      if (ps < 0 && pb < 0) return toast(p, 'تحتاج اثنين من نفس البرينروت (بالقاعدة أو بالحقيبة)');
      const k = Math.max(0, Math.min(Math.ceil((100 - FUSE.ch[r]) / FUSE.step), d.k | 0)), ch = Math.min(100, FUSE.ch[r] + k * FUSE.step), fee = Math.round(priceOf(A.id, m) * FUSE.feeK), cost = fee + Math.round(fee * FUSE.boostK) * k;
      if (!pay(p, cost)) return toast(p, 'فلوسك ما تكفي — الدمج يحتاج ' + fmt(cost) + ' 💰');
      const roll = Math.random() * 100, win = roll < ch; let out = null;
      if (win) { if (ps >= 0) br.slots[ps] = null; else br.bag.splice(pb, 1); out = r === 'secret' ? { id: A.id, m: m + 1 } : { id: pickChar(NEXT[r]).id, m }; br.slots[si] = out; }
      save(); return send(p.ws, { t: 'br_fused', win, roll: Math.round(roll * 10) / 10, ch, from: A.id, fm: m, id: out && out.id, m: out && out.m, cost, s: si });
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
    const tot = br.slots.reduce((s, x) => s + incOf(x), 0), reward = win ? Math.round((300 * KP + tot * 25) * F.r) : 0;
    if (win) { if (!rich(p.key)) br.coins += reward; br.wins = (br.wins || 0) + 1; save(); }
    send(p.ws, { t: 'br_fight', me, en, log, win, reward, lv });
  }

  /* ---------- الحلقة: حركة، سجادة، فلوس، بيض، سرقة ---------- */
  let last = now();
  setInterval(() => {
    const t = now(), dt = Math.min(.1, (t - last) / 1000); last = t; if (!P.size) { carpet = []; return; }
    // السجادة
    // بابين يصبّن بخط واحد: الباب العادي كل 5 ثواني، وباب المميز كل 5 دقايق يطلّع برينروت قوي
    spawnT -= dt; if (spawnT <= 0) { spawnT = 5; const lucky = Math.random() < .05, c = lucky ? CD.hazzo : pickChar(pickW(RW)); const mr = Math.random(); if (lucky) toastAll('🍀 حظّو طلع من الباب العادي! الحگوه على السجادة'); carpet.push({ u: uidN++, id: c.id, m: mr < .006 ? 2 : mr < .04 ? 1 : 0, x: GATE.x, y: GATE.n, sp: 0 }); }
    if (t >= specAt) { specAt = t + SPEC_MS; const c = pickChar(pickW(RW_SPEC)); const mr = Math.random(); carpet.push({ u: uidN++, id: c.id, m: mr < .15 ? 2 : mr < .5 ? 1 : 0, x: GATE.x, y: GATE.s, sp: 1 }); toastAll('🌟 باب المميز انفتح! طلع برينروت قوي على السجادة', null); }
    carpet.forEach(c => { c.x += 110 * dt; c.y += (LINE - c.y) * Math.min(1, dt * 1.6); }); carpet = carpet.filter(c => c.x < CARP_END);
    for (const p of P.values()) {
      const bs = brOf(p.key).shoes, shoe = bs && bs.on >= 0 ? SHOES[bs.on].sp : 1, sp = p.stunUntil > t ? 0 : SPEED * shoe * (p.carry ? CARRY : 1); let nx = Math.max(16, Math.min(W - 16, p.x + p.ix * sp * dt)), ny = Math.max(16, Math.min(H - 16, p.y + p.iy * sp * dt));
      for (const g of geo) { const b = B[g.i]; if (g.i === p.base || !b.owner || b.lockUntil <= t) continue; if (inRect(nx, ny, g, 4)) { if (!inRect(p.x, ny, g, 4)) nx = p.x; else if (!inRect(nx, p.y, g, 4)) ny = p.y; else { nx = g.spawn[0]; ny = g.front + g.d * 40; } } }
      p.x = nx; p.y = ny;
      const g = geo[p.base], br = brOf(p.key);
      g.cash.forEach(([cx, cy], i) => { if (br.sb[i] >= 1 && dist(p.x, p.y, cx, cy) < 62) { const v = Math.floor(br.sb[i]); br.sb[i] = 0; if (!rich(p.key)) br.coins += v; send(p.ws, { t: 'br_fx', k: 'cash', x: cx, y: cy, v }); } });   // تمشي يم البرينروت تجمع فلوسه
      if (p.carry) {
        if (inRect(p.x, p.y, g)) finishSteal(p);
        else if (t - p.carry.at > STEAL_MS) { returnStolen(p.carry, ''); p.carry = null; toast(p, '⌛ تأخرت! البرينروت رجع لصاحبه'); }
        else { const op = ownerP(p.carry.from); if (op && dist(op.x, op.y, p.x, p.y) < 52) { const c = p.carry; p.carry = null; returnStolen(c, '🛡️ ' + op.name + ' مسك ' + p.name + ' ورجّع البرينروت مالته'); fx(op, 'catch', p.x, p.y); } }
      }
    }
    // 🎉 الحفلة كل ساعة
    if (t >= partyAt) { partyAt = Math.ceil((t + 1000) / 3600000) * 3600000; partyStart(t); } if (partyEnd && t > partyEnd) { partyEnd = 0; peggs = []; toastAll('🎉 خلصت الحفلة! الحفلة الجاية بعد ساعة'); }
    // 💣 الألغام + 🚨 الإنذار
    for (const p of P.values()) { let inB = -1; for (const g of geo) if (g.i !== p.base && inRect(p.x, p.y, g)) inB = g.i;
      if (inB !== p.inB) { if (inB >= 0) { const op = ownerP(inB), obr = op && brOf(op.key); if (op && obr && obr.alarm) send(op.ws, { t: 'br_alarm', n: p.name }); } p.inB = inB; }
      for (const b of B) { if (!b.mines || !b.mines.length || b.owner === p.key) continue; const mi = b.mines.findIndex(m => dist(m.x, m.y, p.x, p.y) < 40); if (mi < 0) continue; const m = b.mines.splice(mi, 1)[0];
        p.stunUntil = t + 3500; p.noStealUntil = Math.max(p.noStealUntil, t + 15000); if (p.carry) { returnStolen(p.carry, ''); p.carry = null; } toastAll('💥 ' + p.name + ' داس على لغم ' + b.name + '!');
        for (const o of P.values()) send(o.ws, { t: 'br_fx', k: 'boom', x: m.x, y: m.y }); } }
    // الفلوس + البيض
    for (const p of P.values()) { const br = brOf(p.key); let inc = 0; br.slots.forEach((s, i) => { if (s && s.egg && t >= s.at) { const c = pickChar(pickW(EGGS[s.egg].w)); br.slots[i] = { id: c.id, m: Math.random() < .08 ? 1 : 0 }; const g = geo[p.base]; fx(p, 'hatch', g.ped[i][0], g.ped[i][1], { id: c.id }); } inc += incOf(br.slots[i]); }); }
    payT += dt; if (payT >= 2) { payT -= 2; for (const p of P.values()) { const br = brOf(p.key); br.slots.forEach((s, i) => { const v = incOf(s); if (v) br.sb[i] = (br.sb[i] || 0) + v * 2; }); } }   // 💵 كل ثانيتين تطلع فلوس كدام كل برينروت
    if (t - lastSave > 15000) { lastSave = t; save(); }
    if (t - lastBc >= 100) { lastBc = t; bcAll(); }
  }, 50);

  function pubBases(t) { return geo.map(g => { const b = B[g.i], br = b.owner ? brOf(b.owner) : null; return { o: b.name, k: b.owner || '', lv: br ? br.lvl : 0, lk: Math.max(0, b.lockUntil - t), bank: 0, cb: br ? br.sb.map(v => Math.floor(v || 0)) : [], s: br ? br.slots.map(s => !s ? 0 : s.egg ? [0, 0, s.egg, Math.max(0, s.at - t)] : [s.id, s.m || 0, 0, 0, s.gone ? 1 : 0]) : [] }; }); }
  function pubPlayers() { return [...P.values()].map(p => [p.key, p.name, Math.round(p.x), Math.round(p.y), p.base, p.carry ? [p.carry.id, p.carry.m] : 0, p.dir, (p.ix || p.iy) ? 1 : 0, rich(p.key) ? 1 : 0, now() < p.stunUntil ? 1 : 0, p.pan + 1, (brOf(p.key).shoes || { on: -1 }).on + 1]); }
  function bcAll() { const t = now(), bs = pubBases(t), pl = pubPlayers(), cp = carpet.map(c => [c.u, c.id, c.m, Math.round(c.x), Math.round(c.y), c.sp]), spx = Math.max(0, specAt - t); for (const p of P.values()) { const br = brOf(p.key); send(p.ws, Object.assign({ t: 'br_s', pl, bs, cp, spx, fcd: Math.max(0, p.fightAt - t) }, meOf(p))); } }
  function bcOne(p) { const t = now(), br = brOf(p.key); send(p.ws, Object.assign({ t: 'br_s', pl: pubPlayers(), bs: pubBases(t), cp: carpet.map(c => [c.u, c.id, c.m, Math.round(c.x), Math.round(c.y), c.sp]), spx: Math.max(0, specAt - t), fcd: 0 }, meOf(p))); }
  function meOf(p) { const br = brOf(p.key); markSeen(br); const t0 = now(); return { pan: p.pan, shoes: br.shoes || { own: [], on: -1 }, mines: br.mines || 0, mpos: (B[p.base].mines || []).map(m => [Math.round(m.x), Math.round(m.y)]), alarm: br.alarm ? 1 : 0, ns: Math.max(0, p.noStealUntil - t0), party: { on: partyEnd > t0 ? 1 : 0, ms: partyEnd > t0 ? partyEnd - t0 : partyAt - t0, eg: peggs.map(e => [e.u, e.t, Math.round(e.x), Math.round(e.y), e.hp, e.max]) }, seen: Object.keys(br.seen), cl: br.cl || {}, c: Math.floor(br.coins), inc: br.slots.reduce((s, x) => s + incOf(x), 0), bag: br.bag.map(b => [b.id, b.m || 0]), lv: br.lvl, ls: lockSec(br.lvl), uc: br.lvl < LV_MAX ? upCost(br.lvl) : 0, adm: rich(p.key) ? 1 : 0, bagMax: BAG_MAX }; }

  return { onMsg, leave };
};
