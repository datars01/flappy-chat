'use strict';
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
let PgPool = null;
try { PgPool = require('pg').Pool; } catch (e) {}

const PORT = process.env.PORT || 3000;
// وضع الملفات: مجلد حفظ البيانات (على Render لازم Disk دائم)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UP_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
// وضع قاعدة البيانات (Postgres): إذا حطيت DATABASE_URL كل شي ينحفظ هناك ويبقى دائم
const DATABASE_URL = process.env.DATABASE_URL || '';

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ============ التخزين ============ */
let db = { users: {}, sessions: {}, rooms: {}, dms: {} };
let pool = null;
const mediaSet = new Set(); // أسماء الملفات الموجودة (وضع Postgres)

async function initStorage() {
  if (DATABASE_URL) {
    if (!PgPool) throw new Error('DATABASE_URL موجود بس مكتبة pg مو منصّبة (شغّل npm install)');
    pool = new PgPool({
      connectionString: DATABASE_URL, max: 4,
      ssl: process.env.PGSSL === 'off' ? false : { rejectUnauthorized: false }
    });
    await pool.query('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    await pool.query('CREATE TABLE IF NOT EXISTS media (name TEXT PRIMARY KEY, ctype TEXT NOT NULL, data BYTEA NOT NULL, ts BIGINT NOT NULL)');
    const r = await pool.query("SELECT value FROM kv WHERE key = 'db'");
    if (r.rows[0]) db = Object.assign(db, JSON.parse(r.rows[0].value)); // إذا خربان نوقف حتى ما نمسحه
    const m = await pool.query('SELECT name FROM media');
    m.rows.forEach(x => mediaSet.add(x.name));
    console.log('storage: postgres | users: ' + Object.keys(db.users).length + ' | files: ' + mediaSet.size);
  } else {
    fs.mkdirSync(UP_DIR, { recursive: true });
    try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch (e) {}
    console.log('storage: files at ' + DATA_DIR + ' | users: ' + Object.keys(db.users).length);
  }
}

let saveTimer = null, writing = false, dirty = false;
async function writeNow() {
  if (writing) { dirty = true; return; }
  writing = true;
  try {
    const json = JSON.stringify(db);
    if (pool) {
      await pool.query("INSERT INTO kv (key, value) VALUES ('db', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [json]);
    } else {
      const tmp = DB_FILE + '.tmp';
      fs.writeFileSync(tmp, json); fs.renameSync(tmp, DB_FILE);
    }
  } catch (e) { console.error('save failed:', e.message); }
  writing = false;
  if (dirty) { dirty = false; await writeNow(); }
}
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; writeNow(); }, 500);
}
async function flushAndExit() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  const t0 = Date.now();
  await writeNow();
  while ((writing || dirty) && Date.now() - t0 < 5000) await sleep(50);
  process.exit(0);
}
process.on('SIGTERM', flushAndExit);
process.on('SIGINT', flushAndExit);

/* ---- الملفات (صور/فيديو/صوت/أفاتار) ---- */
const KEEP_FOREVER = 4102444800000; // سنة 2100 (للأفاتار حتى ما ينحذف بالتنظيف)
const mediaPath = name => path.join(UP_DIR, name);
function mediaExists(name) { return pool ? mediaSet.has(name) : fs.existsSync(mediaPath(name)); }
async function mediaPut(name, ctype, buf, forever) {
  if (pool) {
    await pool.query('INSERT INTO media (name, ctype, data, ts) VALUES ($1, $2, $3, $4)', [name, ctype, buf, forever ? KEEP_FOREVER : Date.now()]);
    mediaSet.add(name);
  } else {
    await fs.promises.writeFile(mediaPath(name), buf);
  }
}
function mediaDel(name) {
  if (!name) return;
  if (pool) { mediaSet.delete(name); pool.query('DELETE FROM media WHERE name = $1', [name]).catch(() => {}); }
  else fs.unlink(mediaPath(name), () => {});
}
const MEDIA_RE = /^\/uploads\/([a-f0-9]{24}\.(jpg|png|gif|webp|mp4|webm|mov|weba|ogg|m4a|mp3))$/;
function mediaDelUrl(url) { const mm = MEDIA_RE.exec(String(url || '')); if (mm) mediaDel(mm[1]); }

/* ============ أدوات ============ */
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const hashPw = (p, salt) => crypto.scryptSync(p, salt, 64).toString('hex');
function safeEq(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
const NAME_RE = /^[\p{L}\p{N}_.\- ]+$/u;
function cleanName(u) {
  u = String(u || '').trim().replace(/\s+/g, ' ');
  if (u.length < 2 || u.length > 16 || !NAME_RE.test(u)) return null;
  if (/^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/i.test(u)) return null;
  return u;
}

// تحديد محاولات (لكل IP أو مستخدم)
const hits = new Map();
function limited(id, max, ms) {
  const now = Date.now();
  let h = hits.get(id);
  if (!h || now - h.t > ms) h = { n: 0, t: now };
  h.n++; hits.set(id, h);
  return h.n > max;
}
setInterval(() => { const now = Date.now(); for (const [k, h] of hits) if (now - h.t > 3600e3) hits.delete(k); }, 600e3);

function rankOf(key) {
  const u = db.users[key];
  if (!u || !u.best) return null;
  let r = 1;
  for (const k in db.users) {
    const o = db.users[k];
    if (o.best > u.best || (o.best === u.best && o.best > 0 && (o.bestAt || 0) < (u.bestAt || 0))) r++;
  }
  return r;
}
// سكنات الطير: الرقم = أقل "أعلى نتيجة" لازم توصلها حتى تنفتح
const SKIN_AT = { classic: 0, ruby: 15, ocean: 30, mint: 50, royal: 75, golden: 100 };
const SKIN_NAMES = { ruby: 'الناري', ocean: 'المحيط', mint: 'النعناع', royal: 'الملكي', golden: 'الذهبي' };

/* ===== العملات والمتجر (كل الحقول الجديدة تنضاف للاعب بدون ما تمس القديمة) ===== */
const SHOP_COUNT = 20, SHOP_BASE = 40, SHOP_STEP = 20;     // 20 سكن: الأرخص 40 عملة وكل سكن بعده +20 (لين 420)
const SHOP_IDS = Array.from({ length: SHOP_COUNT }, (_, i) => 's' + String(i + 1).padStart(2, '0'));
const shopPrice = id => { const i = SHOP_IDS.indexOf(id); return i < 0 ? 0 : SHOP_BASE + i * SHOP_STEP; };
const DAILY_BASE = 20, DAILY_STEP = 5, DAILY_MAX = 50;     // مكافأة اليوم 20 عملة وتزيد 5 لكل يوم متتالي لين 50
const DAY_MS = 24 * 3600e3, DAY_OFFSET = 3 * 3600e3;       // اليوم الجديد يبدي الساعة 12 بالليل بتوقيت العراق (UTC+3)
const dayNum = t => Math.floor((t + DAY_OFFSET) / DAY_MS);
const dailyAmount = streak => Math.min(DAILY_MAX, DAILY_BASE + Math.max(0, streak - 1) * DAILY_STEP);
function dailyInfo(u) {
  const now = Date.now(), today = dayNum(now), last = u.lastDaily || 0;
  const can = last < today;
  // streak = كم يوم متتالي لحد الآن (قبل استلام اليوم إذا لسه ما استلم)
  const streak = last === today ? (u.streak || 1) : (last === today - 1 ? (u.streak || 0) : 0);
  const claimStreak = can ? streak + 1 : streak;
  return { can, streak, claimStreak, amount: can ? dailyAmount(claimStreak) : dailyAmount(claimStreak + 1), msLeft: (today + 1) * DAY_MS - DAY_OFFSET - now };
}
const skinOk = (u, id) => own(SKIN_AT, id) ? (u.best || 0) >= SKIN_AT[id] : (SHOP_IDS.includes(id) && Array.isArray(u.owned) && u.owned.includes(id));
const skinOf = key => { const u = db.users[key]; return u.skin && skinOk(u, u.skin) ? u.skin : 'classic'; };
/* ===== طرق ثانية لكسب العملات (كلها حقول جديدة تنضاف للاعب، ما تمس القديمة) ===== */
const PLAY_DIV = 25, PLAY_CAP = 60;                         // عملة لكل 25 نقطة بالفردي، بحد أقصى 60 عملة باليوم
const DUO_WIN = 10, DUO_LOSE = 2, DUO_TIE = 5, DUO_ROUNDS = 5, DUO_MIN = 30; // مكافآت الزوجي (5 جولات باليوم، ولازم أحد يوصل 5 نقاط)
const REF_REWARD = 30, REF_MAX = 10, REF_MINSCORE = 10;       // دعوة صديق: 30 عملة للاثنين (لين 10 أصدقاء)
const TASK_POOL = [
  { id: 'g3', title: 'العب 3 جولات فردية', goal: 3, reward: 10, f: 'games' },
  { id: 'g8', title: 'العب 8 جولات فردية', goal: 8, reward: 15, f: 'games' },
  { id: 's10', title: 'سجّل 60 نقطة بجولة وحدة', goal: 60, reward: 10, f: 'max' },
  { id: 's25', title: 'سجّل 150 نقطة بجولة وحدة', goal: 150, reward: 15, f: 'max' },
  { id: 's40', title: 'سجّل 300 نقطة بجولة وحدة', goal: 300, reward: 25, f: 'max' },
  { id: 'd1', title: 'العب جولة زوجية كاملة', goal: 1, reward: 15, f: 'duo' }
];
const ACH = [
  { id: 'b25', title: 'وصلت 100 نقطة', reward: 15, ok: u => (u.best || 0) >= 100 },
  { id: 'b50', title: 'وصلت 250 نقطة', reward: 30, ok: u => (u.best || 0) >= 250 },
  { id: 'b100', title: 'وصلت 500 نقطة', reward: 60, ok: u => (u.best || 0) >= 500 },
  { id: 'g50', title: 'لعبت 50 جولة', reward: 20, ok: u => (u.games || 0) >= 50 },
  { id: 'g200', title: 'لعبت 200 جولة', reward: 50, ok: u => (u.games || 0) >= 200 },
  { id: 'st7', title: '7 أيام متتالية', reward: 40, ok: u => (u.streak || 0) >= 7 },
  { id: 'dw5', title: 'فزت 5 مرات بالزوجي', reward: 30, ok: u => (u.duoWins || 0) >= 5 },
  { id: 'rf3', title: 'دعيت 3 أصدقاء', reward: 40, ok: u => (u.refCount || 0) >= 3 }
];
function dayOf(u) {
  const d = dayNum(Date.now());
  if (!u.day || u.day.d !== d) u.day = { d, games: 0, max: 0, duo: 0, play: 0, duoR: 0, bricks: 0, claimed: [] };
  return u.day;
}
function tasksOf(u) {
  const dy = dayOf(u);
  return [0, 2, 4].map(i => TASK_POOL[(dy.d + i) % TASK_POOL.length]).map(t => {
    const prog = Math.min(t.goal, t.f === 'games' ? dy.games : t.f === 'max' ? dy.max : dy.duo);
    return { id: t.id, title: t.title, goal: t.goal, reward: t.reward, prog, done: prog >= t.goal, claimed: dy.claimed.includes(t.id) };
  });
}
function checkAch(u) {
  u.ach = Array.isArray(u.ach) ? u.ach : [];
  const out = [];
  for (const a of ACH) if (!u.ach.includes(a.id) && a.ok(u)) { u.ach.push(a.id); u.coins = (u.coins || 0) + a.reward; out.push({ id: a.id, title: a.title, reward: a.reward }); }
  return out;
}
function refCodeOf(u) {
  if (!u.refCode) {
    let c;
    do { c = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase(); } while (Object.values(db.users).some(x => x.refCode === c));
    u.refCode = c; save();
  }
  return u.refCode;
}
function notifyUser(key, msg) {
  const str = JSON.stringify(msg);
  for (const set of live.values()) for (const w of set) if (w.key === key && w.readyState === 1) w.send(str);
}

/* ====== البيت والحديقة: عملة «مواد البناء 🧱» تنكسب من إنهاء المراحل بالفردي ====== */
const BRICK_DAY_CAP = 600;
const HOUSE_DEF = [
  ['home', 'home', 'شكل البيت', [['h1', 'كوخ', '🛖', 0], ['h2', 'بيت صغير', '🏠', 80], ['h3', 'بيت واسع', '🏡', 250], ['h4', 'فيلا', '🏰', 600]]],
  ['home', 'walls', 'لون الجدران', [['w1', 'أبيض', '#f4efe6', 0], ['w2', 'سماوي', '#bfe3f5', 25], ['w3', 'وردي', '#f7c6d6', 25], ['w4', 'ليموني', '#e4f0a8', 25]]],
  ['home', 'door', 'لون الباب', [['d1', 'بني', '#7a4a2a', 0], ['d2', 'أزرق', '#2f5f9e', 15], ['d3', 'أحمر', '#b3362a', 15], ['d4', 'ذهبي', '#d4a437', 40]]],
  ['home', 'upg', 'ترقيات البيت', [['u1', 'ألواح شمسية', '☀️', 90], ['u2', 'طبق ستلايت', '📡', 40], ['u3', 'علم', '🚩', 25], ['u4', 'إضاءة الواجهة', '💡', 60]]],
  ['inside', 'paper', 'ورق الجدران', [['p1', 'كريمي', '#f3e6cf', 0], ['p2', 'أزرق', '#cfe3f3', 25], ['p3', 'أخضر', '#d4ebd0', 25], ['p4', 'وردي', '#f4d4de', 25]]],
  ['inside', 'floor', 'الأرضية', [['f1', 'خشب', '#b98a5a', 0], ['f2', 'بلاط', '#d9d4c8', 30], ['f3', 'رخام', '#ecebf0', 60], ['f4', 'خشب داكن', '#7a5a3a', 40]]],
  ['home', 'roof', 'لون السقف', [['r1', 'أحمر', '#c9483c', 0], ['r2', 'بني', '#7a4a2a', 20], ['r3', 'أزرق', '#3f6fb5', 20], ['r4', 'أخضر', '#3f8f55', 20]]],
  ['inside', 'seat', 'الجلوس', [['se1', 'كرسي', '🪑', 15], ['se2', 'قنفة', '🛋️', 45], ['se3', 'سرير', '🛏️', 90]]],
  ['inside', 'tv', 'الجدار', [['tv1', 'لوحة', '🖼️', 20], ['tv2', 'تلفزيون', '📺', 60], ['tv3', 'ساعة', '🕰️', 35]]],
  ['inside', 'lamp', 'الإضاءة', [['la1', 'شمعة', '🕯️', 10], ['la2', 'مصباح', '💡', 25], ['la3', 'ثريا', '🪔', 55]]],
  ['inside', 'shelf', 'التخزين', [['sh1', 'كتب', '📚', 30], ['sh2', 'خزانة', '🗄️', 50], ['sh3', 'صندوق كنز', '🧰', 80]]],
  ['inside', 'pet', 'حيوان أليف', [['pe1', 'سمكة', '🐠', 30], ['pe2', 'قطة', '🐈', 60], ['pe3', 'كلب', '🐕', 75]]],
  ['inside', 'plant', 'نبتة', [['pl1', 'صبّار', '🌵', 10], ['pl2', 'نبتة', '🪴', 20], ['pl3', 'بامبو', '🎍', 30]]],
  ['inside', 'rug', 'السجادة', [['ru1', 'أحمر', '#b3422f', 20], ['ru2', 'أزرق', '#356fa8', 20], ['ru3', 'أخضر', '#3c8a58', 20], ['ru4', 'ذهبي', '#d4a437', 40]]],
  ['garden', 'tree', 'شجرة', [['tr1', 'شجرة', '🌳', 20], ['tr2', 'نخلة', '🌴', 35], ['tr3', 'صنوبر', '🌲', 45]]],
  ['garden', 'flowers', 'ورد', [['fl1', 'خزامى', '🌷', 10], ['fl2', 'دوار الشمس', '🌻', 15], ['fl3', 'ورد', '🌹', 25]]],
  ['garden', 'feature', 'ركن الحديقة', [['fe1', 'نافورة', '⛲', 90], ['fe2', 'خيمة', '⛺', 50], ['fe3', 'تلة', '⛰️', 120]]],
  ['garden', 'play', 'ألعاب', [['pa1', 'زحليقة', '🛝', 70], ['pa2', 'دوّامة', '🎠', 120], ['pa3', 'بالون', '🎈', 40]]],
  ['garden', 'car', 'السيارة', [['ca1', 'دراجة', '🚲', 50], ['ca2', 'سيارة', '🚗', 150], ['ca3', 'جيب', '🚙', 220]]],
  ['garden', 'fence', 'السياج', [['fn1', 'خشب', '#a77a45', 20], ['fn2', 'أبيض', '#f2f2f2', 35], ['fn3', 'حجر', '#8c949c', 55]]],
  ['garden', 'lantern', 'فانوس', [['lt1', 'فانوس', '🏮', 15], ['lt2', 'نجمة', '⭐', 30], ['lt3', 'قمر', '🌙', 50]]]
];
const HOUSE = HOUSE_DEF.map(r => ({ g: r[0], slot: r[1], name: r[2], items: r[3].map(i => ({ id: i[0], slot: r[1], name: i[1], v: i[2], price: i[3] })) }));
const HOUSE_MOVABLE = ['tv', 'shelf', 'lamp', 'seat', 'pet', 'plant', 'rug', 'tree', 'flowers', 'feature', 'play', 'car', 'lantern'];
const HOUSE_ITEM = {}; HOUSE.forEach(sl => sl.items.forEach(i => { HOUSE_ITEM[i.id] = i; }));
function houseOf(u) {
  if (!u.house || typeof u.house !== 'object') u.house = { own: [], set: {} };
  if (!Array.isArray(u.house.own)) u.house.own = [];
  if (!u.house.set || typeof u.house.set !== 'object') u.house.set = {};
  const own = new Set(u.house.own); HOUSE.forEach(sl => sl.items.forEach(i => { if (i.price === 0) own.add(i.id); }));
  const set = {};
  HOUSE.forEach(sl => { const cur = u.house.set[sl.slot]; if (cur && own.has(cur) && HOUSE_ITEM[cur] && HOUSE_ITEM[cur].slot === sl.slot) set[sl.slot] = cur; else { const d = sl.items.find(i => i.price === 0); if (d) set[sl.slot] = d.id; } });
  const pos = {};
  if (u.house.pos && typeof u.house.pos === 'object') for (const k of Object.keys(u.house.pos)) {
    const v = u.house.pos[k]; if (HOUSE_MOVABLE.includes(k) && Array.isArray(v) && v.length === 2 && Number.isFinite(v[0]) && Number.isFinite(v[1])) pos[k] = [Math.max(-320, Math.min(320, Math.round(v[0]))), Math.max(-320, Math.min(320, Math.round(v[1])))];
  }
  return { own: [...own], set, pos };
}
const userInfo = key => {
  const u = db.users[key], dy = dayOf(u);
  return {
    name: u.name, best: u.best || 0, games: u.games || 0, rank: rankOf(key), skin: skinOf(key), avatar: u.avatar || '',
    coins: u.coins || 0, owned: Array.isArray(u.owned) ? u.owned : [], daily: dailyInfo(u),
    bricks: u.bricks || 0, zones: u.zones || 1, cp: u.cp || 1, house: houseOf(u),
    tasks: tasksOf(u), play: { got: dy.play, cap: PLAY_CAP, div: PLAY_DIV },
    ach: ACH.map(a => ({ id: a.id, title: a.title, reward: a.reward, done: Array.isArray(u.ach) && u.ach.includes(a.id) })),
    ref: { code: refCodeOf(u), count: u.refCount || 0, max: REF_MAX, reward: REF_REWARD }
  };
};
function newSession(key) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[sha(token)] = { k: key, t: Date.now() };
  save();
  return token;
}
function keyFromToken(token) {
  if (!token) return null;
  const s = db.sessions[sha(token)];
  return s && own(db.users, s.k) ? s.k : null;
}

/* ============ Express ============ */
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

function authMw(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const key = keyFromToken(token);
  if (!key) return res.status(401).json({ error: 'سجّل دخول من جديد' });
  req.key = key; req.th = sha(token);
  next();
}

app.get('/health', (req, res) => res.send('ok'));

app.post('/api/register', (req, res) => {
  if (limited('reg:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'محاولات كثيرة، جرب بعد شوي' });
  const name = cleanName(req.body && req.body.u);
  const p = String((req.body && req.body.p) || '');
  if (!name) return res.status(400).json({ error: 'الاسم لازم 2-16 حرف (حروف وأرقام ونقطة وشرطة فقط)' });
  if (p.length < 4 || p.length > 64) return res.status(400).json({ error: 'كلمة السر لازم 4 أحرف على الأقل' });
  const key = name.toLowerCase();
  if (own(db.users, key)) return res.status(409).json({ error: 'هذا الاسم مستخدم، اختار اسم ثاني' });
  const salt = crypto.randomBytes(16).toString('hex');
  const rc = String((req.body && req.body.ref) || '').trim().toUpperCase().slice(0, 8);
  const refBy = rc ? Object.keys(db.users).find(k => db.users[k].refCode === rc) : null;
  db.users[key] = Object.assign({ name, salt, hash: hashPw(p, salt), best: 0, games: 0, bestAt: 0, created: Date.now() }, refBy ? { refBy } : {});
  const token = newSession(key);
  save();
  res.json({ token, user: userInfo(key) });
});

app.post('/api/login', (req, res) => {
  if (limited('login:' + req.ip, 20, 600e3)) return res.status(429).json({ error: 'محاولات كثيرة، جرب بعد شوي' });
  const name = String((req.body && req.body.u) || '').trim();
  const p = String((req.body && req.body.p) || '');
  const key = name.toLowerCase();
  const u = own(db.users, key) ? db.users[key] : null;
  if (!u || !safeEq(hashPw(p, u.salt), u.hash)) return res.status(401).json({ error: 'اسم المستخدم أو كلمة السر غلط' });
  res.json({ token: newSession(key), user: userInfo(key) });
});

// منح عملات للاعب (للمالك فقط): يحتاج متغير ADMIN_KEY بإعدادات Render
app.post('/api/admin/grant', (req, res) => {
  const ak = process.env.ADMIN_KEY || '';
  if (limited('adm:' + req.ip, 10, 600e3)) return res.status(429).json({ error: 'محاولات كثيرة' });
  if (!ak || ak.length < 8 || !safeEq(String(req.body && req.body.key || ''), ak)) return res.status(403).json({ error: 'مفتاح غلط' });
  const key = String((req.body && req.body.user) || '').trim().toLowerCase();
  const n = Math.floor(Number(req.body && req.body.coins));
  if (!own(db.users, key)) return res.status(404).json({ error: 'اللاعب غير موجود' });
  if (!Number.isFinite(n) || n === 0 || Math.abs(n) > 100000) return res.status(400).json({ error: 'عدد غلط' });
  const u = db.users[key]; u.coins = Math.max(0, (u.coins || 0) + n); save();
  try { notifyUser(key, { t: 'earn', text: '🎁 وصلتك هدية ' + n + ' عملة' }); } catch (e) {}
  res.json({ ok: true, name: u.name, coins: u.coins });
});

app.get('/api/me', authMw, (req, res) => res.json(userInfo(req.key)));

// تغيير كلمة السر (يطلّع باقي الأجهزة)
app.post('/api/password', authMw, (req, res) => {
  if (limited('pw:' + req.key, 10, 3600e3)) return res.status(429).json({ error: 'محاولات كثيرة، جرب بعد شوي' });
  const oldp = String((req.body && req.body.old) || '');
  const np = String((req.body && req.body.new) || '');
  const u = db.users[req.key];
  if (!safeEq(hashPw(oldp, u.salt), u.hash)) return res.status(400).json({ error: 'كلمة السر الحالية غلط' });
  if (np.length < 4 || np.length > 64) return res.status(400).json({ error: 'كلمة السر الجديدة لازم 4 أحرف على الأقل' });
  u.salt = crypto.randomBytes(16).toString('hex');
  u.hash = hashPw(np, u.salt);
  for (const h in db.sessions) if (db.sessions[h].k === req.key && h !== req.th) delete db.sessions[h];
  save();
  res.json({ ok: true });
});

// تركيب سكن (إما مفتوح حسب أعلى نتيجة، أو مشترى بالعملات)
app.post('/api/skin', authMw, (req, res) => {
  const id = String((req.body && req.body.skin) || '');
  if (!own(SKIN_AT, id) && !SHOP_IDS.includes(id)) return res.status(400).json({ error: 'سكن غير موجود' });
  const u = db.users[req.key];
  if (!skinOk(u, id)) return res.status(403).json({ error: SHOP_IDS.includes(id) ? 'لازم تشتري السكن أول' : 'السكن ما انفتح بعد' });
  u.skin = id; save();
  res.json({ skin: id });
});

// مكافأة اليوم
app.post('/api/daily', authMw, (req, res) => {
  const u = db.users[req.key];
  const d = dailyInfo(u);
  if (!d.can) return res.status(400).json({ error: 'استلمت مكافأة اليوم، ارجع باجر', daily: d });
  u.streak = d.claimStreak; u.lastDaily = dayNum(Date.now()); u.coins = (u.coins || 0) + d.amount;
  const achNew = checkAch(u);
  save();
  res.json({ got: d.amount, coins: u.coins, daily: dailyInfo(u), achNew, user: userInfo(req.key) });
});

app.post('/api/task', authMw, (req, res) => {
  const u = db.users[req.key];
  const id = String((req.body && req.body.id) || '');
  const t = tasksOf(u).find(x => x.id === id);
  if (!t) return res.status(400).json({ error: 'مهمة غير موجودة' });
  if (t.claimed) return res.status(409).json({ error: 'استلمت هذي المهمة' });
  if (!t.done) return res.status(400).json({ error: 'ما كملت المهمة بعد' });
  dayOf(u).claimed.push(id); u.coins = (u.coins || 0) + t.reward;
  const achNew = checkAch(u);
  save();
  res.json({ got: t.reward, achNew, user: userInfo(req.key) });
});

// شراء سكن بالعملات
app.post('/api/buy', authMw, (req, res) => {
  if (limited('buy:' + req.key, 60, 3600e3)) return res.status(429).json({ error: 'محاولات كثيرة، جرب بعد شوي' });
  const id = String((req.body && req.body.skin) || '');
  if (!SHOP_IDS.includes(id)) return res.status(400).json({ error: 'سكن غير موجود' });
  const u = db.users[req.key];
  if (!Array.isArray(u.owned)) u.owned = [];
  if (u.owned.includes(id)) return res.status(409).json({ error: 'عندك هذا السكن من قبل' });
  const price = shopPrice(id), coins = u.coins || 0;
  if (coins < price) return res.status(403).json({ error: 'عملاتك ما تكفي، ينقصك ' + (price - coins) });
  u.coins = coins - price; u.owned.push(id);
  save();
  res.json({ coins: u.coins, owned: u.owned, skin: id });
});

app.get('/api/leaderboard', (req, res) => {
  const top = Object.values(db.users)
    .filter(u => u.best > 0)
    .sort((a, b) => b.best - a.best || (a.bestAt || 0) - (b.bestAt || 0))
    .slice(0, 10)
    .map(u => ({ name: u.name, best: u.best, games: u.games || 0, avatar: u.avatar || '' }));
  res.json({ top });
});

const games = new Map(); // gid -> {k, t}
setInterval(() => { const now = Date.now(); for (const [g, v] of games) if (now - v.t > 3600e3) games.delete(g); }, 600e3);

app.post('/api/start', authMw, (req, res) => {
  const gid = crypto.randomBytes(12).toString('hex');
  const u = db.users[req.key];
  let sl = Math.floor(Number(req.body && req.body.startLevel)) || 1;
  if (sl !== (u.cp || 1) && (sl < 1 || (sl - 1) % 7 !== 0 || (sl - 1) / 7 >= (u.zones || 1))) sl = 1;   // نقدر نبدأ فقط من أول مرحلة بمنطقة مفتوحة
  games.set(gid, { k: req.key, sl, t: Date.now(), last: sl - 1, lt: Date.now(), bn: 0, bt: 0 });
  res.json({ gid, start: sl });
});

// إنهاء مرحلة بالفردي: يكسب مواد بناء، وكل 7 مراحل تنفتح منطقة جديدة
app.post('/api/level', authMw, (req, res) => {
  const g = games.get(String((req.body && req.body.gid) || ''));
  const lv = Math.floor(Number(req.body && req.body.level));
  if (!g || g.k !== req.key || !Number.isFinite(lv)) return res.status(400).json({ error: 'لعبة غير صالحة' });
  if (lv !== g.last + 1 || lv > 500) return res.status(400).json({ error: 'مرحلة غير صالحة' });
  const minSec = (34 + 8 * lv) * 0.045;                       // أقل وقت معقول لتفجير كل كرات المرحلة
  if ((Date.now() - g.lt) / 1000 < minSec) return res.status(400).json({ error: 'سريع بشكل غير طبيعي' });
  g.last = lv; g.lt = Date.now();
  const u = db.users[req.key], dy = dayOf(u);
  if (lv + 1 > (u.cp || 1) || g.sl === (u.cp || 1)) u.cp = Math.min(500, lv + 1);   // نقطة الحفظ: المرحلة اللي توصلها
  let want = 10 + 2 * lv; const zoneDone = lv % 7 === 0; if (zoneDone) want += 50;
  const gained = Math.max(0, Math.min(want, BRICK_DAY_CAP - (dy.bricks || 0)));
  dy.bricks = (dy.bricks || 0) + gained; u.bricks = (u.bricks || 0) + gained;
  let newZone = false;
  if (zoneDone && (u.zones || 1) < Math.min(4, lv / 7 + 1)) { u.zones = Math.min(4, lv / 7 + 1); newZone = true; }   // 4 فصول
  save();
  res.json({ gained, capped: gained < want, newZone, user: userInfo(req.key) });
});

// مكافأة الكومبو: كل 3 كومبوهات بالفردي = 8 مواد بناء (بحد أدنى فاصل زمني وحد أعلى لكل لعبة)
app.post('/api/bonus', authMw, (req, res) => {
  const g = games.get(String((req.body && req.body.gid) || ''));
  if (!g || g.k !== req.key) return res.status(400).json({ error: 'لعبة غير صالحة' });
  const now = Date.now();
  if (g.bn >= 30 || now - g.bt < 3500) return res.status(429).json({ error: 'بسرعة' });
  g.bn++; g.bt = now;
  const u = db.users[req.key], dy = dayOf(u);
  const gained = Math.max(0, Math.min(8, BRICK_DAY_CAP - (dy.bricks || 0)));
  dy.bricks = (dy.bricks || 0) + gained; u.bricks = (u.bricks || 0) + gained; save();
  res.json({ gained, user: userInfo(req.key) });
});
app.get('/api/house', authMw, (req, res) => res.json({ catalog: HOUSE, user: userInfo(req.key) }));
app.post('/api/house/buy', authMw, (req, res) => {
  const it = HOUSE_ITEM[String((req.body && req.body.id) || '')]; const u = db.users[req.key];
  if (!it) return res.status(400).json({ error: 'غرض غير موجود' });
  const h = houseOf(u);
  if (h.own.includes(it.id)) return res.status(400).json({ error: 'تملكه من قبل' });
  if ((u.bricks || 0) < it.price) return res.status(400).json({ error: 'مواد البناء ما تكفي' });
  u.bricks -= it.price; u.house = { own: h.own.filter(i => HOUSE_ITEM[i] && HOUSE_ITEM[i].price > 0).concat(it.id), set: Object.assign({}, h.set, { [it.slot]: it.id }), pos: h.pos };
  save(); res.json({ user: userInfo(req.key) });
});
// حفظ أماكن الأغراض (إزاحة عن الترتيب التلقائي)؛ القيمة null ترجع الغرض لمكانه الأصلي
app.post('/api/house/pos', authMw, (req, res) => {
  const u = db.users[req.key], h = houseOf(u), inp = (req.body && req.body.pos) || {};
  if (typeof inp !== 'object') return res.status(400).json({ error: 'بيانات غلط' });
  const pos = Object.assign({}, h.pos);
  for (const k of Object.keys(inp)) {
    if (!HOUSE_MOVABLE.includes(k)) continue; const v = inp[k];
    if (v === null) delete pos[k]; else if (Array.isArray(v) && v.length === 2 && Number.isFinite(+v[0]) && Number.isFinite(+v[1])) pos[k] = [Math.max(-320, Math.min(320, Math.round(+v[0]))), Math.max(-320, Math.min(320, Math.round(+v[1])))];
  }
  u.house = { own: h.own.filter(i => HOUSE_ITEM[i] && HOUSE_ITEM[i].price > 0), set: h.set, pos }; save();
  res.json({ user: userInfo(req.key) });
});
app.post('/api/house/set', authMw, (req, res) => {
  const slot = String((req.body && req.body.slot) || ''), id = req.body && req.body.id ? String(req.body.id) : '';
  const u = db.users[req.key], h = houseOf(u), sl = HOUSE.find(x => x.slot === slot);
  if (!sl) return res.status(400).json({ error: 'خانة غير صحيحة' });
  const set = Object.assign({}, h.set);
  if (!id) { if (sl.items.some(i => i.price === 0)) return res.status(400).json({ error: 'هذي الخانة ما تنشال' }); delete set[slot]; }
  else { const it = HOUSE_ITEM[id]; if (!it || it.slot !== slot || !h.own.includes(id)) return res.status(400).json({ error: 'ما تملك هذا الغرض' }); set[slot] = id; }
  u.house = { own: h.own.filter(i => HOUSE_ITEM[i] && HOUSE_ITEM[i].price > 0), set, pos: h.pos };
  save(); res.json({ user: userInfo(req.key) });
});

app.post('/api/score', authMw, (req, res) => {
  const gid = String((req.body && req.body.gid) || '');
  const score = parseInt(req.body && req.body.score, 10);
  const g = games.get(gid);
  if (!g || g.k !== req.key) return res.status(400).json({ error: 'لعبة غير صالحة' });
  games.delete(gid);
  const elapsed = (Date.now() - g.t) / 1000;
  // أقصى معدل معقول للنقاط بلعبة الكرات (نسمح بهامش واسع)
  if (!Number.isFinite(score) || score < 0 || score > 10000 || score > Math.floor(elapsed * 25) + 60)
    return res.status(400).json({ error: 'نتيجة غير صالحة' });
  const u = db.users[req.key];
  const prevBest = u.best || 0;
  u.games = (u.games || 0) + 1;
  const improved = score > prevBest;
  if (improved) { u.best = score; u.bestAt = Date.now(); }
  const dy = dayOf(u); dy.games++; if (score > dy.max) dy.max = score;
  const gain = Math.max(0, Math.min(Math.floor(score / PLAY_DIV), PLAY_CAP - dy.play));
  dy.play += gain; u.coins = (u.coins || 0) + gain;
  let refGot = 0;
  if (u.refBy && !u.refPaid && score >= REF_MINSCORE) {
    u.refPaid = true;
    const r = db.users[u.refBy];
    if (r && (r.refCount || 0) < REF_MAX) {
      r.refCount = (r.refCount || 0) + 1; r.coins = (r.coins || 0) + REF_REWARD; u.coins += REF_REWARD; refGot = REF_REWARD;
      const ra = checkAch(r);
      notifyUser(u.refBy, { t: 'earn', text: '🤝 صديقك ' + u.name + ' بدأ يلعب! +' + REF_REWARD + ' عملة', achNew: ra });
    }
  }
  const achNew = checkAch(u);
  save();
  const unlocked = Object.keys(SKIN_AT).filter(k => SKIN_AT[k] > 0 && SKIN_AT[k] > prevBest && SKIN_AT[k] <= (u.best || 0));
  const info = userInfo(req.key);
  res.json({ best: info.best, games: info.games, rank: info.rank, improved, skin: info.skin, unlocked, earned: gain, refGot, achNew, user: info });
  // إعلان النتيجة (وفتح السكنات) لغرف الشات
  for (const [code, set] of live) {
    for (const w of set) if (w.key === req.key) {
      bc(code, { t: 'score', name: u.name, score }, x => x.key !== req.key);
      unlocked.forEach(id => bc(code, { t: 'sys', text: '🎁 ' + u.name + ' فتح سكن ' + SKIN_NAMES[id] }, x => x.key !== req.key));
      break;
    }
  }
});

/* ============ رفع الملفات ============ */
const EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  // رسائل صوتية (امتدادات مختلفة عن الفيديو حتى ما يلتبسون)
  'audio/webm': 'weba', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3'
};
const AV_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_IMG = 8 * 1024 * 1024, MAX_VID = 25 * 1024 * 1024, MAX_AUD = 6 * 1024 * 1024, MAX_AV = 300 * 1024;
const mediaKind = ext => /^(mp4|webm|mov)$/.test(ext) ? 'video' : /^(weba|ogg|m4a|mp3)$/.test(ext) ? 'audio' : 'image';
const ctypeOf = req => String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();

app.post('/api/upload', authMw, (req, res, next) => {
  if (limited('up:' + req.key, 15, 60e3)) return res.status(429).json({ error: 'رفع كثير، انتظر شوي' });
  next();
}, express.raw({ type: () => true, limit: '26mb' }), async (req, res) => {
  const ct = ctypeOf(req);
  const ext = own(EXT, ct) ? EXT[ct] : null;
  if (!ext) return res.status(400).json({ error: 'نوع الملف غير مدعوم' });
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ error: 'ملف فارغ' });
  const kind = mediaKind(ext);
  const limit = kind === 'video' ? MAX_VID : kind === 'audio' ? MAX_AUD : MAX_IMG;
  if (buf.length > limit)
    return res.status(413).json({ error: kind === 'video' ? 'الفيديو أكبر من 25 ميغا' : kind === 'audio' ? 'التسجيل أكبر من 6 ميغا' : 'الصورة أكبر من 8 ميغا' });
  const name = crypto.randomBytes(12).toString('hex') + '.' + ext;
  try { await mediaPut(name, ct, buf, false); }
  catch (e) { console.error('upload failed:', e.message); return res.status(500).json({ error: 'فشل حفظ الملف' }); }
  res.json({ url: '/uploads/' + name, kind });
});

// صورة البروفايل
app.post('/api/avatar', authMw, (req, res, next) => {
  if (limited('av:' + req.key, 20, 3600e3)) return res.status(429).json({ error: 'محاولات كثيرة، جرب بعد شوي' });
  next();
}, express.raw({ type: () => true, limit: '400kb' }), async (req, res) => {
  const ct = ctypeOf(req);
  const ext = own(AV_TYPES, ct) ? AV_TYPES[ct] : null;
  if (!ext) return res.status(400).json({ error: 'الصورة لازم JPG أو PNG أو WebP' });
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ error: 'ملف فارغ' });
  if (buf.length > MAX_AV) return res.status(413).json({ error: 'الصورة كبيرة' });
  const name = crypto.randomBytes(12).toString('hex') + '.' + ext;
  try { await mediaPut(name, ct, buf, true); }
  catch (e) { console.error('avatar failed:', e.message); return res.status(500).json({ error: 'فشل حفظ الصورة' }); }
  const u = db.users[req.key];
  mediaDelUrl(u.avatar);
  u.avatar = '/uploads/' + name; save();
  res.json({ avatar: u.avatar });
});
app.delete('/api/avatar', authMw, (req, res) => {
  const u = db.users[req.key];
  mediaDelUrl(u.avatar);
  u.avatar = ''; save();
  res.json({ avatar: '' });
});

// صورة خلفية المحادثة (تنحفظ دائم حتى ما تنحذف بالتنظيف، وتنحذف لما تتبدل)
const pendingBg = new Map(); // key -> رابط صورة انرفعت وما انطبقت بعد
app.post('/api/roombg', authMw, (req, res, next) => {
  if (limited('rbg:' + req.key, 15, 3600e3)) return res.status(429).json({ error: 'محاولات كثيرة، جرب بعد شوي' });
  next();
}, express.raw({ type: () => true, limit: '1200kb' }), async (req, res) => {
  const ct = ctypeOf(req);
  const ext = own(AV_TYPES, ct) ? AV_TYPES[ct] : null;
  if (!ext) return res.status(400).json({ error: 'الصورة لازم JPG أو PNG أو WebP' });
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ error: 'ملف فارغ' });
  if (buf.length > 1100 * 1024) return res.status(413).json({ error: 'الصورة كبيرة' });
  const name = crypto.randomBytes(12).toString('hex') + '.' + ext;
  try { await mediaPut(name, ct, buf, true); }
  catch (e) { console.error('roombg failed:', e.message); return res.status(500).json({ error: 'فشل حفظ الصورة' }); }
  const url = '/uploads/' + name;
  const prev = pendingBg.get(req.key); if (prev) mediaDelUrl(prev);
  pendingBg.set(req.key, url);
  res.json({ url });
});

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'الملف كبير' });
  if (err) { console.error(err.message); return res.status(400).json({ error: 'طلب غير صالح' }); }
  next();
});

// عرض الملفات: وضع Postgres (مع دعم Range حتى يشتغل الصوت والفيديو على آيفون)
app.get('/uploads/:name', async (req, res, next) => {
  if (!pool) return next();
  const name = req.params.name;
  if (!MEDIA_RE.test('/uploads/' + name) || !mediaSet.has(name)) return res.status(404).end();
  try {
    const r = await pool.query('SELECT ctype, data FROM media WHERE name = $1', [name]);
    if (!r.rows[0]) return res.status(404).end();
    const data = r.rows[0].data, total = data.length;
    res.set({
      'Content-Type': r.rows[0].ctype, 'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=604800, immutable', 'Accept-Ranges': 'bytes'
    });
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] || m[2])) {
      let start, end;
      if (m[1] === '') { start = Math.max(0, total - parseInt(m[2], 10)); end = total - 1; }
      else { start = parseInt(m[1], 10); end = m[2] === '' ? total - 1 : Math.min(parseInt(m[2], 10), total - 1); }
      if (start > end || start >= total) return res.status(416).set('Content-Range', 'bytes */' + total).end();
      res.status(206).set({ 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Content-Length': end - start + 1 });
      return res.end(data.subarray(start, end + 1));
    }
    res.set('Content-Length', total);
    res.end(data);
  } catch (e) { console.error('serve failed:', e.message); res.status(500).end(); }
});
// وضع الملفات
app.use('/uploads', express.static(UP_DIR, {
  maxAge: '7d', immutable: true, index: false, dotfiles: 'ignore',
  setHeaders: r => r.setHeader('X-Content-Type-Options', 'nosniff')
}));
app.use('/.well-known', express.static(path.join(__dirname, 'public', '.well-known'))); // ملف ربط تطبيق الأندرويد (assetlinks.json)
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));

/* ============ الشات (WebSocket) ============ */
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });
const live = new Map(); // code -> Set<ws>
const MAX_MSGS = 20000;   // الرسائل تبقى للأبد (حد أمان فقط)
const BG_IDS = ['night', 'sunset', 'forest', 'violet', 'sand', 'sky', 'dots', 'grid']; // خلفيات الغرفة الجاهزة

const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
function bc(code, o, filter) {
  const set = live.get(code); if (!set) return;
  const s = JSON.stringify(o);
  for (const w of set) if (w.readyState === 1 && (!filter || filter(w))) w.send(s);
}
function membersOf(code) {
  const set = live.get(code); const names = new Map();
  if (set) for (const w of set) names.set(w.key, db.users[w.key].name);
  return [...names.values()];
}
function delMedia(m) { if (m && m.media) mediaDelUrl(m.media.url); }
const PIN_MAX = 30;
const pinSnap = (m, byName, byKey) => ({ id: m.id, k: m.k, name: m.name, text: String(m.text || '').slice(0, 300), mt: m.media ? m.media.type : null, mu: m.media ? m.media.url : null, ts: m.ts, by: byName, bk: byKey, at: Date.now() });
const pinsOf = room => (room.pins || []).map(p => ({ id: p.id, k: p.k, name: p.name, text: p.text, mt: p.mt, ts: p.ts, by: p.by, at: p.at }));
const pub = m => { const { hidden, ...r } = m; return r; };
function roomOf(code) { return own(db.rooms, code) ? db.rooms[code] : (db.rooms[code] = { msgs: [] }); }

/* ============ الأصدقاء والرسائل الخاصة ============ */
const FRIEND_MAX = 100, DM_MAX = 20000;
const isOnline = (key, except) => { for (const w of wss.clients) if (w !== except && w.key === key && w.readyState === 1) return true; return false; };
function pushTo(key, msg) { const str = JSON.stringify(msg); for (const w of wss.clients) if (w.key === key && w.readyState === 1) w.send(str); }
const flist = (u, f) => Array.isArray(u[f]) ? u[f] : (u[f] = []);
const pairKey = (a, b) => [a, b].sort().join('|');
function dmOf(a, b) { if (!db.dms) db.dms = {}; const k = pairKey(a, b); return db.dms[k] || (db.dms[k] = { msgs: [], reads: {} }); }
const lastMsgOf = (a, b) => { const d = db.dms && db.dms[pairKey(a, b)]; return d && d.msgs.length ? d.msgs[d.msgs.length - 1] : null; };
function friendRow(me, key) {
  const f = db.users[key], d = db.dms && db.dms[pairKey(me, key)];
  const rd = d && d.reads ? (d.reads[me] || 0) : 0;
  const unread = d ? d.msgs.filter(m => m.k !== me && m.ts > rd).length : 0;
  const last = lastMsgOf(me, key), on = isOnline(key);
  let room = '';
  if (on) for (const w of wss.clients) if (w.key === key && w.room) { room = w.room; break; }
  return { name: f.name, online: on, lastSeen: f.lastSeen || 0, room, unread, avatar: f.avatar || '',
    last: last ? { text: last.inv ? '🎟️ دعوة للعب' : String(last.text || '').slice(0, 40), ts: last.ts, mine: last.k === me } : null };
}
const keyOfName = n => String(n || '').trim().toLowerCase();
const mutual = (a, b) => flist(db.users[a], 'friends').includes(b) && flist(db.users[b], 'friends').includes(a);
function makeFriends(a, b) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const u = db.users[x];
    if (!flist(u, 'friends').includes(y)) u.friends.push(y);
    u.fin = flist(u, 'fin').filter(k => k !== y); u.fout = flist(u, 'fout').filter(k => k !== y);
  }
}
function presenceChange(key, on) {
  const u = db.users[key]; if (!u) return;
  if (!on) { u.lastSeen = Date.now(); save(); }
  for (const f of flist(u, 'friends')) pushTo(f, { t: 'f_presence', name: u.name, online: on, lastSeen: u.lastSeen || 0 });
}
app.get('/api/friends', authMw, (req, res) => {
  const u = db.users[req.key];
  const ok = k => own(db.users, k);
  const friends = flist(u, 'friends').filter(ok).map(k => friendRow(req.key, k));
  friends.sort((a, b) => (b.online - a.online) || (b.unread - a.unread) || a.name.localeCompare(b.name));
  res.json({ friends, inc: flist(u, 'fin').filter(ok).map(k => db.users[k].name), out: flist(u, 'fout').filter(ok).map(k => db.users[k].name) });
});
app.post('/api/friend/add', authMw, (req, res) => {
  if (limited('fadd:' + req.key, 30, 3600e3)) return res.status(429).json({ error: 'طلبات كثيرة، جرب بعد شوي' });
  const me = db.users[req.key], k = keyOfName(req.body && req.body.name);
  if (!k || !own(db.users, k)) return res.status(404).json({ error: 'ما لقيت لاعب بهذا الاسم' });
  if (k === req.key) return res.status(400).json({ error: 'هذا أنت 😅' });
  const t = db.users[k];
  if (flist(me, 'friends').includes(k)) return res.status(409).json({ error: t.name + ' صديقك من قبل' });
  if (flist(me, 'fout').includes(k)) return res.status(409).json({ error: 'أرسلت له طلب من قبل، انتظر يقبل' });
  if (flist(me, 'friends').length >= FRIEND_MAX) return res.status(400).json({ error: 'وصلت الحد الأقصى للأصدقاء' });
  if (flist(t, 'fout').includes(req.key)) {                     // هو طالب صداقتك أصلاً: نقبل مباشرة
    makeFriends(req.key, k); save();
    pushTo(k, { t: 'f_update', toast: '🤝 ' + me.name + ' صار صديقك' }); return res.json({ status: 'friends', name: t.name });
  }
  if (flist(t, 'fin').length >= 100) return res.status(400).json({ error: 'عنده طلبات كثيرة حالياً' });
  me.fout.push(k); flist(t, 'fin').push(req.key); save();
  pushTo(k, { t: 'f_update', toast: '👋 ' + me.name + ' يريد يضيفك صديق' });
  res.json({ status: 'sent', name: t.name });
});
app.post('/api/friend/accept', authMw, (req, res) => {
  const me = db.users[req.key], k = keyOfName(req.body && req.body.name);
  if (!own(db.users, k) || !flist(me, 'fin').includes(k)) return res.status(400).json({ error: 'ما في طلب من هذا الشخص' });
  makeFriends(req.key, k); save();
  pushTo(k, { t: 'f_update', toast: '🤝 ' + me.name + ' قبل طلبك، صرتم أصدقاء' });
  res.json({ ok: true });
});
app.post('/api/friend/remove', authMw, (req, res) => {       // يحذف صديق أو يرفض/يلغي طلب
  const me = db.users[req.key], k = keyOfName(req.body && req.body.name);
  if (!own(db.users, k)) return res.status(404).json({ error: 'ما لقيته' });
  const t = db.users[k];
  const was = flist(me, 'friends').includes(k);
  me.friends = flist(me, 'friends').filter(x => x !== k); t.friends = flist(t, 'friends').filter(x => x !== req.key);
  me.fin = flist(me, 'fin').filter(x => x !== k); me.fout = flist(me, 'fout').filter(x => x !== k);
  t.fin = flist(t, 'fin').filter(x => x !== req.key); t.fout = flist(t, 'fout').filter(x => x !== req.key);
  if (was && db.dms) delete db.dms[pairKey(req.key, k)];
  save(); pushTo(k, { t: 'f_update' });
  res.json({ ok: true });
});
app.get('/api/dm', authMw, (req, res) => {
  let w = ''; try { w = new URL(req.url, 'http://x').searchParams.get('with'); } catch (e) {}
  const k = keyOfName(w);
  if (!own(db.users, k) || !mutual(req.key, k)) return res.status(403).json({ error: 'مو صديقك' });
  const d = dmOf(req.key, k);
  d.reads[req.key] = Date.now(); save();
  res.json({ msgs: d.msgs.slice(-400), friend: friendRow(req.key, k) });
});
app.post('/api/dm', authMw, (req, res) => {
  const me = db.users[req.key], k = keyOfName(req.body && req.body.to);
  if (!own(db.users, k) || !mutual(req.key, k)) return res.status(403).json({ error: 'مو صديقك' });
  if (limited('dm:' + req.key, 40, 60e3)) return res.status(429).json({ error: 'بطّء شوي' });
  const text = String((req.body && req.body.text) || '').trim().slice(0, 500);
  let inv = null;
  const iv = req.body && req.body.inv;
  if (iv && typeof iv === 'object') {
    const code = String(iv.code || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    if (code.length >= 4) inv = { code, duo: !!iv.duo };
  }
  if (!text && !inv) return res.status(400).json({ error: 'اكتب رسالة' });
  const d = dmOf(req.key, k);
  const m = { id: crypto.randomBytes(8).toString('hex'), k: req.key, text, ts: Date.now() };
  if (inv) m.inv = inv;
  d.msgs.push(m); while (d.msgs.length > DM_MAX) d.msgs.shift();
  d.reads[req.key] = m.ts; save();
  pushTo(k, { t: 'dm', from: me.name, m });
  res.json({ m });
});

/* ============ الطور الزوجي (بالذاكرة فقط، ما ينحفظ) ============ */
/* ============ محرك لعبة الكرات المشتركة (يشتغل بالسيرفر، لاعبين على لوحة وحدة) ============ */
const ZR = 12, ZD = 24, ZSHOT_V = 9, ZCOOL = 12, Z_MAX_TICKS = 10800; // الجولة القصوى 3 دقايق
const ZSHOOT = [{ x: 160, y: 212 }, { x: 160, y: 298 }];             // الشخصية الأولى فوق والثانية تحت، حول الحفرة
function zMul(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ZPATH = (function () {
  const raw = [], cx = 160, cy = 255, RX = 146, RY = 204, K1 = 0.42, TURNS = 2;
  for (let y = 560; y > cy; y -= 6) raw.push([cx - RX, y]);
  const th0 = Math.PI, th1 = Math.PI + TURNS * 2 * Math.PI, n = 520;
  for (let i = 0; i <= n; i++) {
    const t = i / n, th = th0 + (th1 - th0) * t, k = 1 - (1 - K1) * t;
    raw.push([cx + RX * k * Math.cos(th), cy + RY * k * Math.sin(th)]);
  }
  const cum = [0];
  for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const L = cum[cum.length - 1], N = Math.floor(L) + 2, xs = new Float32Array(N), ys = new Float32Array(N);
  let j = 0;
  for (let s = 0; s < N; s++) {
    while (j < raw.length - 2 && cum[j + 1] < s) j++;
    const seg = cum[j + 1] - cum[j] || 1, f = Math.min(1, Math.max(0, (s - cum[j]) / seg));
    xs[s] = raw[j][0] + (raw[j + 1][0] - raw[j][0]) * f; ys[s] = raw[j][1] + (raw[j + 1][1] - raw[j][1]) * f;
  }
  return { xs, ys, L, N };
})();
const _zp = { x: 0, y: 0 };
function zPos(s) {
  if (s < 0) s = 0; if (s > ZPATH.L) s = ZPATH.L;
  const i = Math.floor(s), f = s - i, j = Math.min(i + 1, ZPATH.N - 1);
  _zp.x = ZPATH.xs[i] + (ZPATH.xs[j] - ZPATH.xs[i]) * f; _zp.y = ZPATH.ys[i] + (ZPATH.ys[j] - ZPATH.ys[i]) * f;
  return _zp;
}
const zLevelN = l => 34 + 8 * l;
const zSpeed = l => 20 + 3.5 * Math.min(l, 12);
const zNCol = l => l < 2 ? 4 : l < 4 ? 5 : 6;
function zNew(seed, mode) {
  seed = (seed || 1) >>> 0;
  const g = { mode, rA: zMul(seed), level: 1, sc: [0, 0], chain: [], queue: 0, last: [-1, -1], shots: [], combo: 0, intro: true, freeze: 0, tick: 0, dead: false, nid: 1, ev: [], lastOwner: 0,
    pl: [0, 1].map(i => ({ ang: -Math.PI / 2, cur: 0, next: 0, cool: 0, rB: zMul(seed ^ (0x5bd1e995 + i * 7919)) })) };
  zStartLevel(g);
  for (const p of g.pl) { p.cur = zShotColor(g, p); p.next = zShotColor(g, p); }
  return g;
}
function zStartLevel(g) { g.queue = zLevelN(g.level); g.intro = true; g.last = [-1, -1]; }
function zSpawnColor(g) {
  const n = zNCol(g.level); let c, tries = 0;
  do { c = Math.floor(g.rA() * n); tries++; } while (c === g.last[0] && c === g.last[1] && tries < 20);
  g.last[1] = g.last[0]; g.last[0] = c; return c;
}
function zShotColor(g, p) {
  const n = zNCol(g.level), has = new Array(n).fill(false); let any = false;
  for (const b of g.chain) if (b.c < n) { has[b.c] = true; any = true; }
  const list = []; for (let i = 0; i < n; i++) if (!any || has[i]) list.push(i);
  return list[Math.floor(p.rB() * list.length)];
}
const zLinked = (ch, i) => i >= 0 && i < ch.length - 1 && ch[i + 1].s - ch[i].s <= ZD + 1.5;
function zRun(ch, i) {
  let lo = i, hi = i; const c = ch[i].c;
  while (lo > 0 && zLinked(ch, lo - 1) && ch[lo - 1].c === c) lo--;
  while (hi < ch.length - 1 && zLinked(ch, hi) && ch[hi + 1].c === c) hi++;
  return { lo, hi };
}
function zPopC(g, lo, hi, join, owner) {
  const ch = g.chain, cnt = hi - lo + 1;
  let pts = cnt + (cnt > 3 ? cnt - 3 : 0);
  if (join) { g.combo++; pts += 5 * g.combo; }
  const mp = zPos(ch[(lo + hi) >> 1].s), mx = Math.round(mp.x), my = Math.round(mp.y), bl = [];
  for (let i = lo; i <= hi; i++) { const q = zPos(ch[i].s); bl.push([Math.round(q.x), Math.round(q.y), ch[i].c]); }
  ch.splice(lo, cnt); g.sc[owner] += pts;
  if (!join && g.freeze < 60) g.freeze = 60;   // توقف ثانية فقط لما أحد يجيب ضربة
  zFixC(g);
  g.ev.push({ e: 'p', x: mx, y: my, n: pts, o: owner, j: join ? 1 : 0, cb: g.combo, b: bl });
}
function zInsertC(g, sh, hit) {
  const ch = g.chain, b = ch[hit], p = zPos(b.s), px = p.x, py = p.y;
  const a = zPos(b.s - 2), ax = a.x, ay = a.y, c2 = zPos(b.s + 2);
  const after = (sh.x - px) * (c2.x - ax) + (sh.y - py) * (c2.y - ay) >= 0;
  const j = after ? hit + 1 : hit;
  const nb = { id: g.nid++, c: sh.c, s: after ? b.s + ZD : b.s };
  ch.splice(j, 0, nb);
  for (let k = j + 1; k < ch.length; k++) { const need = ch[k - 1].s + ZD; if (ch[k].s < need) ch[k].s = need; else break; }
  g.ev.push({ e: 'i', id: nb.id, x: Math.round(sh.x), y: Math.round(sh.y) });
  g.combo = 0; g.lastOwner = sh.o;
  const r = zRun(ch, j);
  if (r.hi - r.lo + 1 >= 3) zPopC(g, r.lo, r.hi, false, sh.o);
}
function zStep(g) {
  g.tick++;
  for (const p of g.pl) if (p.cool > 0) p.cool--;
  const ch = g.chain;
  if (g.dead) { for (const b of ch) b.s = Math.min(ZPATH.L, b.s + 6); return; }
  if (g.intro || ch.length < 8) zFixC(g);
  const frozen = g.freeze > 0 && !g.intro; if (g.freeze > 0) g.freeze--;   // أي رمية توقف سير الكرات ثانية
  while (!frozen && g.queue > 0 && (ch.length === 0 || ch[0].s >= ZD)) {
    const s = ch.length && ch[0].s < 2 * ZD ? ch[0].s - ZD : 0;
    ch.unshift({ id: g.nid++, c: zSpawnColor(g), s }); g.queue--;
  }
  let join = -1;
  const n = ch.length;
  if (n && !frozen) {
    let e = 0; while (e < n - 1 && ch[e + 1].s - ch[e].s <= ZD + 1.5) e++;
    const gapAbove = e < n - 1, head = ch[n - 1].s;
    if (g.intro && head >= ZPATH.L * 0.3) g.intro = false;
    const sp = (g.intro ? 300 : gapAbove ? 340 : zSpeed(g.level)) / 60;
    for (let i = 0; i <= e; i++) ch[i].s += sp;
    if (gapAbove) {
      const over = ch[e].s - (ch[e + 1].s - ZD);
      if (over >= 0) { for (let i = 0; i <= e; i++) ch[i].s -= over; join = e; }
    }
  }
  if (join >= 0 && ch[join].c === ch[join + 1].c) {
    const r = zRun(ch, join);
    if (r.hi - r.lo + 1 >= 3) zPopC(g, r.lo, r.hi, true, g.lastOwner);
  }
  if (g.shots.length) {
    for (const b of ch) { const p = zPos(b.s); b.px = p.x; b.py = p.y; }
    for (const sh of g.shots) {
      sh.x += sh.vx; sh.y += sh.vy;
      let hit = -1, bd = (ZR * 2 - 3) * (ZR * 2 - 3);
      for (let i = 0; i < ch.length; i++) { const dx = sh.x - ch[i].px, dy = sh.y - ch[i].py, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; hit = i; } }
      if (hit >= 0) { zInsertC(g, sh, hit); sh.dead = true; for (const b of ch) { const p = zPos(b.s); b.px = p.x; b.py = p.y; } }
      else if (sh.x < -30 || sh.x > 350 || sh.y < -30 || sh.y > 510) sh.dead = true;
    }
    g.shots = g.shots.filter(s => !s.dead);
  }
  if (ch.length && ch[ch.length - 1].s >= ZPATH.L - 6) { g.dead = true; g.ev.push({ e: 'd' }); return; }
  if (g.queue === 0 && ch.length === 0) {
    g.level++; g.sc[0] += 25; g.sc[1] += 25;
    g.ev.push({ e: 'l', lv: g.level });
    zStartLevel(g);
  }
}
function zFixC(g) {
  const ch = g.chain; if (!ch.length) return;
  const has = new Set(); for (const b of ch) has.add(b.c);
  const list = [...has];
  for (const p of g.pl) { if (!has.has(p.cur)) p.cur = list[Math.floor(p.rB() * list.length)]; if (!has.has(p.next)) p.next = list[Math.floor(p.rB() * list.length)]; }
}
function zFireC(g, slot, ang) {
  const p = g.pl[slot]; if (!p || g.dead || p.cool > 0) return false;
  zFixC(g);
  p.ang = ang; const S = ZSHOOT[slot];
  g.shots.push({ x: S.x + Math.cos(ang) * 30, y: S.y + Math.sin(ang) * 30, vx: Math.cos(ang) * ZSHOT_V, vy: Math.sin(ang) * ZSHOT_V, c: p.cur, o: slot, a: ang });
  p.cur = p.next; p.next = zShotColor(g, p); p.cool = ZCOOL; zFixC(g);
  g.ev.push({ e: 's', o: slot });
  return true;
}
function zSwapC(g, slot) { const p = g.pl[slot]; if (p) { const t = p.cur; p.cur = p.next; p.next = t; } }
function zSnapOf(g, slots) {
  const r1 = v => Math.round(v * 10) / 10;
  const snap = {
    t: 'z', tk: g.tick, lv: g.level, q: g.queue, sc: g.sc, sl: slots, dd: g.dead ? 1 : 0, fz: g.freeze,
    ids: g.chain.map(b => b.id), cs: g.chain.map(b => b.c).join(''), ss: g.chain.map(b => r1(b.s)),
    sh: g.shots.map(s => [r1(s.x), r1(s.y), s.c, s.o, Math.round(s.a * 1000) / 1000]),
    pl: g.pl.map(p => [Math.round(p.ang * 100) / 100, p.cur, p.next, p.cool]), ev: g.ev
  };
  g.ev = [];
  return snap;
}

const duoRooms = new Map(); // كود الغرفة -> حالة اللعبة الزوجية
const DUO_COUNT_MS = 3000;
const DUO_COOP = 6;                       // مكافأة الجولة التعاونية لكل لاعب
const duoOf = code => {
  let d = duoRooms.get(code);
  if (!d) duoRooms.set(code, d = { players: [], ready: {}, state: 'lobby', mode: 'co', slots: [], z: null, acc: 0, lastT: 0, deadAt: 0, round: 0, seed: 0, startAt: 0, dead: {}, last: {}, seen: {}, gone: {}, timer: null });
  return d;
};
const num = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
function duoPub(code) {
  const d = duoRooms.get(code);
  if (!d) return { state: 'lobby', round: 0, mode: 'co', players: [] };
  return {
    state: d.state, round: d.round, mode: d.mode,
    players: d.players.map(k => ({ k, name: db.users[k].name, ready: !!d.ready[k], dead: false, score: 0, skin: skinOf(k) }))
  };
}
const duoSync = code => bc(code, Object.assign({ t: 'duo' }, duoPub(code)));
function duoCleanup(code) {
  const d = duoRooms.get(code);
  if (d && !d.players.length) { clearTimeout(d.timer); duoRooms.delete(code); }
}
function duoMaybeStart(code) {
  const d = duoRooms.get(code);
  if (!d || (d.state !== 'lobby' && d.state !== 'over')) return;
  if (d.players.length !== 2 || !d.players.every(k => d.ready[k])) return;
  d.state = 'count'; d.round++; d.seed = crypto.randomInt(1, 2147483647);
  d.dead = {}; d.last = {}; d.seen = {}; d.gone = {};
  d.slots = d.players.slice(0, 2); d.z = zNew(d.seed, d.mode); d.acc = 0; d.deadAt = 0;
  d.startAt = Date.now() + DUO_COUNT_MS;
  bc(code, { t: 'duo_go', seed: d.seed, round: d.round, ms: DUO_COUNT_MS, mode: d.mode, slots: d.slots });
  duoSync(code);
  const round = d.round;
  clearTimeout(d.timer);
  d.timer = setTimeout(() => {
    const x = duoRooms.get(code);
    if (x && x.round === round && x.state === 'count') { x.state = 'play'; x.lastT = Date.now(); x.acc = 0; duoSync(code); duoSnap(code, x); }
  }, DUO_COUNT_MS + 150);
}
function duoSnap(code, d) { if (d.z) bc(code, zSnapOf(d.z, d.slots)); }
// نهاية الجولة المشتركة: وضع تعاوني (نقاط مشتركة) أو تنافسي (كل واحد نقاطه)
function zEnd(code, leaver) {
  const d = duoRooms.get(code);
  if (!d || d.state !== 'play' || !d.z) return;
  const g = d.z, team = d.mode === 'co';
  const rows = d.slots.map((k, i) => ({ k, name: db.users[k].name, score: g.sc[i], left: k === leaver }));
  const total = g.sc[0] + g.sc[1];
  let winner = null;
  if (!team) {
    if (leaver) { const st = rows.find(r => !r.left); winner = st ? st.name : null; }
    else if (rows[0].score !== rows[1].score) winner = (rows[0].score > rows[1].score ? rows[0] : rows[1]).name;
  }
  if (rows.length === 2 && !leaver) {                       // جولة كاملة: اللي يطلع ما ياخذ شي
    const real = (team ? total : Math.max(rows[0].score, rows[1].score)) >= DUO_MIN;
    for (const r of rows) {
      const u = db.users[r.k]; if (!u) continue;
      const dy = dayOf(u); dy.duo++;
      const win = !team && !!winner && r.name === winner;
      if (win) u.duoWins = (u.duoWins || 0) + 1;
      let got = 0;
      if (real && dy.duoR < DUO_ROUNDS) { got = team ? DUO_COOP : !winner ? DUO_TIE : win ? DUO_WIN : DUO_LOSE; dy.duoR++; u.coins = (u.coins || 0) + got; }
      const achNew = checkAch(u);
      notifyUser(r.k, { t: 'earn', text: got ? '🪙 +' + got + ' عملة من الجولة الزوجية' : '', achNew });
    }
    save();
  }
  d.state = 'over'; d.ready = {}; d.z = null;
  d.players = d.players.filter(k => !d.gone[k]);
  bc(code, { t: 'duo_over', round: d.round, winner, mode: d.mode, team, total, results: rows.map(r => ({ name: r.name, score: r.score, left: r.left })) });
  bc(code, { t: 'sys', text: '🏁 جولة زوجية (' + (team ? 'تعاوني' : 'تنافسي') + '): ' + (team ? 'نتيجة الفريق ' + total : rows.map(r => r.name + ' ' + r.score).join(' — ') + (winner ? ' | الفائز: ' + winner : ' | تعادل')) });
  duoSync(code); duoCleanup(code);
}
function duoRemove(code, key) {
  const d = duoRooms.get(code);
  if (!d || !d.players.includes(key)) return;
  if (d.state === 'play') {
    d.gone[key] = true;
    zEnd(code, key);
    return;
  }
  if (d.state === 'count') { clearTimeout(d.timer); d.state = 'lobby'; d.ready = {}; }
  d.players = d.players.filter(k => k !== key); delete d.ready[key];
  if (d.state === 'over' && !d.players.length) d.state = 'lobby';
  duoSync(code); duoCleanup(code);
}
// المحاكاة: السيرفر يشغّل اللعبة المشتركة 60 مرة بالثانية ويرسل لقطة للاثنين 15 مرة بالثانية
setInterval(() => {
  const now = Date.now();
  for (const [code, d] of duoRooms) {
    const g = d.z; if (!g || d.state !== 'play') continue;
    let acc = (d.acc || 0) + Math.min(now - (d.lastT || now), 100); d.lastT = now;
    let n = 0;
    while (acc >= 16.667 && n < 4 && g.tick < Z_MAX_TICKS) { acc -= 16.667; n++; zStep(g); if (g.tick % 4 === 0) duoSnap(code, d); }
    d.acc = acc;
    if (g.dead && !d.deadAt) d.deadAt = now;
    if ((g.dead && now - d.deadAt > 1300) || g.tick >= Z_MAX_TICKS) zEnd(code, null);
  }
}, 16);
// مدخلات اللاعبين: تصويب / إطلاق / تبديل الكرة (لها حد خاص حتى ما تتأثر بحد الشات)
function zInput(ws, d) {
  const code = ws.room, du = code && duoRooms.get(code);
  if (!du || du.state !== 'play' || !du.z) return;
  const slot = du.slots.indexOf(ws.key); if (slot < 0) return;
  const n = Date.now(); if (n - (ws.zTs || 0) > 1000) { ws.zTs = n; ws.zN = 0; } if (++ws.zN > 60) return;
  const g = du.z;
  if (d.t === 'duo_swap') return zSwapC(g, slot);
  const a = Number(d.a); if (!Number.isFinite(a)) return;
  const ang = Math.max(-7, Math.min(7, a)); g.pl[slot].ang = ang;
  if (d.t === 'duo_fire') zFireC(g, slot, ang);
}

function leave(ws) {
  const code = ws.room; if (!code) return;
  ws.room = null;
  const set = live.get(code); if (!set) return;
  set.delete(ws);
  // اللاعب الزوجي ننطيه 6 ثواني يرجع (انقطاع نت بسيط) قبل ما نشيله
  const du = duoRooms.get(code);
  if (du && du.players.includes(ws.key) && ![...set].some(w => w.key === ws.key)) {
    setTimeout(() => {
      const s2 = live.get(code);
      if (!s2 || ![...s2].some(w => w.key === ws.key)) duoRemove(code, ws.key);
    }, 6000);
  }
  if (!set.size) { live.delete(code); return; }
  bc(code, { t: 'presence', members: membersOf(code) });
  if (![...set].some(w => w.key === ws.key)) bc(code, { t: 'sys', text: db.users[ws.key].name + ' طلع من الغرفة' });
}

function onMsg(ws, d) {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'duo_aim' || d.t === 'duo_fire' || d.t === 'duo_swap') return zInput(ws, d);
  const now = Date.now();
  if (now - ws.bucket.t > 10000) ws.bucket = { n: 0, t: now };
  if (++ws.bucket.n > 40) return send(ws, { t: 'err', error: 'بطّء شوي' });
  const me = db.users[ws.key];

  if (d.t === 'join') {
    const code = String(d.code || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    if (code.length < 4) return send(ws, { t: 'err', fatal: true, error: 'الكود لازم 4 أحرف أو أرقام على الأقل' });
    if (ws.room) leave(ws);
    let set = live.get(code);
    if (!set) live.set(code, set = new Set());
    const distinct = new Set([...set].map(w => w.key)); distinct.add(ws.key);
    if (distinct.size > 8) return send(ws, { t: 'err', fatal: true, error: 'الغرفة ممتلئة' });
    const first = ![...set].some(w => w.key === ws.key);
    set.add(ws); ws.room = code;
    const msgs = roomOf(code).msgs.filter(m => !m.hidden.includes(ws.key)).slice(-600).map(pub);
    send(ws, { t: 'joined', code, msgs, members: membersOf(code), pins: pinsOf(roomOf(code)), bg: roomOf(code).bg || null, reads: roomOf(code).reads || {}, duo: duoPub(code) });
    bc(code, { t: 'presence', members: membersOf(code) });
    if (first) bc(code, { t: 'sys', text: me.name + ' دخل الغرفة 🎮' }, w => w !== ws);
    return;
  }

  const code = ws.room; if (!code) return;
  const room = roomOf(code);
  const find = id => room.msgs.find(m => m.id === String(id));

  if (d.t === 'msg') {
    const text = String(d.text || '').trim().slice(0, 500);
    let media = null;
    if (d.media && typeof d.media === 'object') {
      const mm = MEDIA_RE.exec(String(d.media.url || ''));
      if (!mm || !mediaExists(mm[1])) return send(ws, { t: 'err', error: 'الملف غير موجود' });
      media = { url: '/uploads/' + mm[1], type: mediaKind(mm[2]) };
      if (media.type === 'audio') media.dur = Math.max(0, Math.min(120, Number(d.media.dur) || 0));
    }
    if (!text && !media) return;
    let reply = null;
    if (d.reply) {
      const o = find(d.reply);
      if (o) reply = { id: o.id, name: o.name, text: o.deleted ? '' : String(o.text || '').slice(0, 80), media: o.deleted || !o.media ? null : o.media.type };
    }
    const m = { id: crypto.randomBytes(8).toString('hex'), k: ws.key, name: me.name, av: me.avatar || '', text, media, reply, ts: now, editedAt: 0, deleted: false, reactions: {}, hidden: [] };
    room.msgs.push(m);
    while (room.msgs.length > MAX_MSGS) delMedia(room.msgs.shift());
    save();
    bc(code, { t: 'msg', m: pub(m), cid: d.cid || null });
  } else if (d.t === 'bg') {
    const b = d.bg && typeof d.bg === 'object' ? d.bg : {};
    const nb = { mode: 'none', id: '', url: '', dim: Math.max(0, Math.min(0.8, Number(b.dim) || 0)), blur: Math.max(0, Math.min(8, Math.round(Number(b.blur) || 0))) };
    if (b.mode === 'preset') {
      if (!BG_IDS.includes(String(b.id))) return;
      nb.mode = 'preset'; nb.id = String(b.id);
    } else if (b.mode === 'img') {
      const u = String(b.url || '');
      const cur = room.bg && room.bg.mode === 'img' ? room.bg.url : null;
      if (!MEDIA_RE.test(u) || !(u === cur || u === pendingBg.get(ws.key))) return send(ws, { t: 'err', error: 'الخلفية غير صالحة' });
      nb.mode = 'img'; nb.url = u;
    }
    if (room.bg && room.bg.mode === 'img' && room.bg.url !== nb.url) mediaDelUrl(room.bg.url);
    if (nb.url && pendingBg.get(ws.key) === nb.url) pendingBg.delete(ws.key);
    room.bg = nb; room.bgAt = now; save();
    bc(code, { t: 'bg', bg: nb, by: me.name }, w => w.key !== ws.key);
  } else if (d.t === 'duo_join') {
    const du = duoOf(code);
    if (!du.players.includes(ws.key)) {
      if (du.state === 'play' || du.state === 'count') return send(ws, { t: 'duo_err', error: 'فيه جولة شغالة بالغرفة، انتظر لين تخلص' });
      if (du.players.length >= 2) return send(ws, { t: 'duo_err', error: 'الغرفة الزوجية فيها لاعبين اثنين' });
      du.players.push(ws.key); du.ready[ws.key] = false;
      if (du.state === 'over') du.state = 'lobby';
    }
    duoSync(code);
  } else if (d.t === 'duo_leave') {
    duoRemove(code, ws.key);
  } else if (d.t === 'duo_ready') {
    const du = duoRooms.get(code);
    if (!du || !du.players.includes(ws.key) || (du.state !== 'lobby' && du.state !== 'over')) return;
    du.ready[ws.key] = !!d.ready;
    duoSync(code); duoMaybeStart(code);
  } else if (d.t === 'duo_mode') {
    const du = duoRooms.get(code);
    if (!du || !du.players.includes(ws.key) || (du.state !== 'lobby' && du.state !== 'over')) return;
    const m = d.mode === 'vs' ? 'vs' : 'co';
    if (du.mode !== m) { du.mode = m; du.ready = {}; }
    duoSync(code);
  } else if (d.t === 'typing') {
    bc(code, { t: 'typing', name: me.name, kind: d.kind === 'rec' ? 'rec' : 'txt' }, w => w.key !== ws.key);
  } else if (d.t === 'read') {
    // آخر رسالة قراها هذا العضو (توقيت الرسالة)
    const ts = Math.min(Number(d.ts) || 0, now);
    room.reads = room.reads || {};
    if (ts > ((room.reads[ws.key] || {}).ts || 0)) {
      room.reads[ws.key] = { name: me.name, ts }; save();
      bc(code, { t: 'read', k: ws.key, name: me.name, ts }, w => w.key !== ws.key);
    }
  } else if (d.t === 'edit') {
    const m = find(d.id); const text = String(d.text || '').trim().slice(0, 500);
    if (!m || m.k !== ws.key || m.deleted || !text) return;
    m.text = text; m.editedAt = now; const pn = (room.pins || []).find(p => p.id === m.id); if (pn) pn.text = text.slice(0, 300); save();
    bc(code, { t: 'edit', id: m.id, text: m.text, editedAt: m.editedAt });
  } else if (d.t === 'del') {
    const m = find(d.id); if (!m) return;
    if (d.scope === 'all') {
      if (m.k !== ws.key || m.deleted) return;
      delMedia(m); m.deleted = true; m.text = ''; m.media = null; m.reactions = {}; save();
      if (room.pins && room.pins.some(p => p.id === m.id)) { room.pins = room.pins.filter(p => p.id !== m.id); bc(code, { t: 'pins', pins: pinsOf(room), id: m.id, on: false, silent: true }); }
      bc(code, { t: 'del', id: m.id, scope: 'all' });
    } else {
      if (!m.hidden.includes(ws.key)) m.hidden.push(ws.key);
      save();
      for (const w of live.get(code)) if (w.key === ws.key) send(w, { t: 'del', id: m.id, scope: 'me' });
    }
  } else if (d.t === 'pin') {       // تثبيت/إلغاء تثبيت رسالة (لكل أعضاء الغرفة)
    const m = find(d.id); room.pins = room.pins || [];
    const ix = room.pins.findIndex(p => p.id === String(d.id));
    if (ix >= 0) room.pins.splice(ix, 1);
    else {
      if (!m || m.deleted) return;
      if (room.pins.length >= PIN_MAX) return send(ws, { t: 'err', error: 'وصلت الحد الأقصى للمثبتات (' + PIN_MAX + ')، فك تثبيت وحدة' });
      room.pins.push(pinSnap(m, me.name, ws.key));
    }
    save(); bc(code, { t: 'pins', pins: pinsOf(room), by: me.name, on: ix < 0, id: String(d.id) });
  } else if (d.t === 'react') {
    const m = find(d.id); const emoji = String(d.emoji || '').slice(0, 8);
    if (!m || m.deleted || !emoji || /^\w+$/.test(emoji)) return;
    const had = (m.reactions[emoji] || []).includes(ws.key);
    for (const e of Object.keys(m.reactions)) {
      m.reactions[e] = m.reactions[e].filter(k => k !== ws.key);
      if (!m.reactions[e].length) delete m.reactions[e];
    }
    if (!had) (m.reactions[emoji] = m.reactions[emoji] || []).push(ws.key);
    save();
    bc(code, { t: 'react', id: m.id, reactions: m.reactions });
  }
}

wss.on('connection', (ws, req) => {
  let key = null;
  try { key = keyFromToken(new URL(req.url, 'http://x').searchParams.get('token')); } catch (e) {}
  if (!key) { send(ws, { t: 'err', fatal: true, error: 'سجّل دخول من جديد' }); return ws.close(); }
  ws.key = key; ws.room = null; ws.alive = true; ws.bucket = { n: 0, t: Date.now() };
  if (!isOnline(key, ws)) presenceChange(key, true);
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', raw => { let d; try { d = JSON.parse(raw); } catch (e) { return; } try { onMsg(ws, d); } catch (e) { console.error(e); } });
  ws.on('close', () => { leave(ws); if (!isOnline(ws.key, ws)) presenceChange(ws.key, false); });
  ws.on('error', () => {});
});
setInterval(() => {
  for (const w of wss.clients) { if (!w.alive) { w.terminate(); continue; } w.alive = false; try { w.ping(); } catch (e) {} }
}, 30000);

/* ============ تنظيف دوري ============ */
const KEEP = 14 * 24 * 3600e3;
function cleanup() {
  const cut = Date.now() - KEEP;
  for (const code in db.rooms) {
    const r = db.rooms[code];
    if (!r.msgs.length && !(r.pins && r.pins.length) && !live.has(code) && (!r.bg || (r.bgAt || 0) < cut)) {   // نحذف بس الغرف الفارغة تماماً
      if (r.bg && r.bg.mode === 'img') mediaDelUrl(r.bg.url);
      delete db.rooms[code];
    }
  }
  for (const h in db.sessions) if (db.sessions[h].t < Date.now() - 90 * 24 * 3600e3) delete db.sessions[h];
  // ما نحذف ملفات الشات (صور/صوت/فيديو) حتى تبقى الرسائل كاملة
  save();
}
setInterval(cleanup, 3600e3);

initStorage()
  .then(() => server.listen(PORT, () => console.log('Flappy server on :' + PORT)))
  .catch(e => { console.error('startup failed:', e.message); process.exit(1); });
