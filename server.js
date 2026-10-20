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
let db = { users: {}, sessions: {}, rooms: {} };
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
const userInfo = key => {
  const u = db.users[key];
  const best = u.best || 0;
  const skin = u.skin && own(SKIN_AT, u.skin) && best >= SKIN_AT[u.skin] ? u.skin : 'classic';
  return { name: u.name, best, games: u.games || 0, rank: rankOf(key), skin, avatar: u.avatar || '' };
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
  db.users[key] = { name, salt, hash: hashPw(p, salt), best: 0, games: 0, bestAt: 0, created: Date.now() };
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

// تركيب سكن (لازم يكون مفتوح حسب أعلى نتيجة)
app.post('/api/skin', authMw, (req, res) => {
  const id = String((req.body && req.body.skin) || '');
  if (!own(SKIN_AT, id)) return res.status(400).json({ error: 'سكن غير موجود' });
  const u = db.users[req.key];
  if ((u.best || 0) < SKIN_AT[id]) return res.status(403).json({ error: 'السكن ما انفتح بعد' });
  u.skin = id; save();
  res.json({ skin: id });
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
  games.set(gid, { k: req.key, t: Date.now() });
  res.json({ gid });
});

app.post('/api/score', authMw, (req, res) => {
  const gid = String((req.body && req.body.gid) || '');
  const score = parseInt(req.body && req.body.score, 10);
  const g = games.get(gid);
  if (!g || g.k !== req.key) return res.status(400).json({ error: 'لعبة غير صالحة' });
  games.delete(gid);
  const elapsed = (Date.now() - g.t) / 1000;
  // أسرع سرعة باللعبة تعدّي أنبوب كل ~1.04 ثانية، فنسمح بهامش واسع
  if (!Number.isFinite(score) || score < 0 || score > 10000 || score > Math.floor(elapsed / 0.8) + 2)
    return res.status(400).json({ error: 'نتيجة غير صالحة' });
  const u = db.users[req.key];
  const prevBest = u.best || 0;
  u.games = (u.games || 0) + 1;
  const improved = score > prevBest;
  if (improved) { u.best = score; u.bestAt = Date.now(); }
  save();
  const unlocked = Object.keys(SKIN_AT).filter(k => SKIN_AT[k] > 0 && SKIN_AT[k] > prevBest && SKIN_AT[k] <= (u.best || 0));
  const info = userInfo(req.key);
  res.json({ best: info.best, games: info.games, rank: info.rank, improved, skin: info.skin, unlocked });
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
const MAX_MSGS = 300;
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
const pub = m => { const { hidden, ...r } = m; return r; };
function roomOf(code) { return own(db.rooms, code) ? db.rooms[code] : (db.rooms[code] = { msgs: [] }); }

function leave(ws) {
  const code = ws.room; if (!code) return;
  ws.room = null;
  const set = live.get(code); if (!set) return;
  set.delete(ws);
  if (!set.size) { live.delete(code); return; }
  bc(code, { t: 'presence', members: membersOf(code) });
  if (![...set].some(w => w.key === ws.key)) bc(code, { t: 'sys', text: db.users[ws.key].name + ' طلع من الغرفة' });
}

function onMsg(ws, d) {
  if (!d || typeof d !== 'object') return;
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
    const msgs = roomOf(code).msgs.filter(m => !m.hidden.includes(ws.key)).slice(-150).map(pub);
    send(ws, { t: 'joined', code, msgs, members: membersOf(code), bg: roomOf(code).bg || null, reads: roomOf(code).reads || {} });
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
    m.text = text; m.editedAt = now; save();
    bc(code, { t: 'edit', id: m.id, text: m.text, editedAt: m.editedAt });
  } else if (d.t === 'del') {
    const m = find(d.id); if (!m) return;
    if (d.scope === 'all') {
      if (m.k !== ws.key || m.deleted) return;
      delMedia(m); m.deleted = true; m.text = ''; m.media = null; m.reactions = {}; save();
      bc(code, { t: 'del', id: m.id, scope: 'all' });
    } else {
      if (!m.hidden.includes(ws.key)) m.hidden.push(ws.key);
      save();
      for (const w of live.get(code)) if (w.key === ws.key) send(w, { t: 'del', id: m.id, scope: 'me' });
    }
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
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', raw => { let d; try { d = JSON.parse(raw); } catch (e) { return; } try { onMsg(ws, d); } catch (e) { console.error(e); } });
  ws.on('close', () => leave(ws));
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
    r.msgs = r.msgs.filter(m => { if (m.ts < cut) { delMedia(m); return false; } return true; });
    if (!r.msgs.length && !live.has(code) && (!r.bg || (r.bgAt || 0) < cut)) {
      if (r.bg && r.bg.mode === 'img') mediaDelUrl(r.bg.url);
      delete db.rooms[code];
    }
  }
  for (const h in db.sessions) if (db.sessions[h].t < Date.now() - 90 * 24 * 3600e3) delete db.sessions[h];
  if (pool) {
    // ملفات الشات اللي عمرها أكثر من 15 يوم (الأفاتار ما ينحذف)
    pool.query('DELETE FROM media WHERE ts < $1 RETURNING name', [Date.now() - 15 * 24 * 3600e3])
      .then(r => r.rows.forEach(x => mediaSet.delete(x.name))).catch(() => {});
  }
  save();
}
setInterval(cleanup, 3600e3);

initStorage()
  .then(() => server.listen(PORT, () => console.log('Flappy server on :' + PORT)))
  .catch(e => { console.error('startup failed:', e.message); process.exit(1); });
