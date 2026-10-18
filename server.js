'use strict';
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
// مجلد حفظ البيانات (حسابات + رسائل + صور). على Render لازم يكون على Disk دائم
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UP_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(UP_DIR, { recursive: true });

/* ============ قاعدة البيانات (ملف JSON) ============ */
let db = { users: {}, sessions: {}, rooms: {} };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch (e) {}
let saveTimer = null;
function writeNow() {
  const tmp = DB_FILE + '.tmp';
  try { fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, DB_FILE); }
  catch (e) { console.error('save failed:', e.message); }
}
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; writeNow(); }, 500);
}
function flushAndExit() { if (saveTimer) clearTimeout(saveTimer); writeNow(); process.exit(0); }
process.on('SIGTERM', flushAndExit);
process.on('SIGINT', flushAndExit);

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
  return u;
}

// تحديد محاولات (لكل IP)
const hits = new Map();
function limited(ip, max, ms) {
  const now = Date.now();
  let h = hits.get(ip);
  if (!h || now - h.t > ms) h = { n: 0, t: now };
  h.n++; hits.set(ip, h);
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
const userInfo = key => {
  const u = db.users[key];
  return { name: u.name, best: u.best || 0, games: u.games || 0, rank: rankOf(key) };
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
  return s && db.users[s.k] ? s.k : null;
}

/* ============ Express ============ */
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

function authMw(req, res, next) {
  const h = req.headers.authorization || '';
  const key = keyFromToken(h.startsWith('Bearer ') ? h.slice(7) : '');
  if (!key) return res.status(401).json({ error: 'سجّل دخول من جديد' });
  req.key = key;
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
  if (db.users[key]) return res.status(409).json({ error: 'هذا الاسم مستخدم، اختار اسم ثاني' });
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
  const u = db.users[key];
  if (!u || !safeEq(hashPw(p, u.salt), u.hash)) return res.status(401).json({ error: 'اسم المستخدم أو كلمة السر غلط' });
  res.json({ token: newSession(key), user: userInfo(key) });
});

app.get('/api/me', authMw, (req, res) => res.json(userInfo(req.key)));

app.get('/api/leaderboard', (req, res) => {
  const top = Object.values(db.users)
    .filter(u => u.best > 0)
    .sort((a, b) => b.best - a.best || (a.bestAt || 0) - (b.bestAt || 0))
    .slice(0, 10)
    .map(u => ({ name: u.name, best: u.best, games: u.games || 0 }));
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
  if (!Number.isFinite(score) || score < 0 || score > 10000 || score > Math.floor(elapsed / 1.2) + 1)
    return res.status(400).json({ error: 'نتيجة غير صالحة' });
  const u = db.users[req.key];
  u.games = (u.games || 0) + 1;
  const improved = score > (u.best || 0);
  if (improved) { u.best = score; u.bestAt = Date.now(); }
  save();
  const info = userInfo(req.key);
  res.json({ best: info.best, games: info.games, rank: info.rank, improved });
  // إعلان النتيجة لغرف الشات
  for (const [code, set] of live) {
    for (const w of set) if (w.key === req.key) {
      bc(code, { t: 'score', name: u.name, score }, x => x.key !== req.key);
      break;
    }
  }
});

/* ============ رفع الصور والفيديوهات ============ */
const EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov'
};
const MAX_IMG = 8 * 1024 * 1024, MAX_VID = 25 * 1024 * 1024;

app.post('/api/upload', authMw, (req, res, next) => {
  if (limited('up:' + req.key, 15, 60e3)) return res.status(429).json({ error: 'رفع كثير، انتظر شوي' });
  next();
}, express.raw({ type: () => true, limit: '26mb' }), (req, res) => {
  const ct = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const ext = EXT[ct];
  if (!ext) return res.status(400).json({ error: 'نوع الملف غير مدعوم' });
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ error: 'ملف فارغ' });
  const kind = ct.startsWith('video/') ? 'video' : 'image';
  if (buf.length > (kind === 'video' ? MAX_VID : MAX_IMG))
    return res.status(413).json({ error: kind === 'video' ? 'الفيديو أكبر من 25 ميغا' : 'الصورة أكبر من 8 ميغا' });
  const name = crypto.randomBytes(12).toString('hex') + '.' + ext;
  fs.writeFile(path.join(UP_DIR, name), buf, err => {
    if (err) return res.status(500).json({ error: 'فشل حفظ الملف' });
    res.json({ url: '/uploads/' + name, kind });
  });
});

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'الملف كبير' });
  if (err) { console.error(err.message); return res.status(400).json({ error: 'طلب غير صالح' }); }
  next();
});

app.use('/uploads', express.static(UP_DIR, {
  maxAge: '7d', immutable: true, index: false, dotfiles: 'ignore',
  setHeaders: r => r.setHeader('X-Content-Type-Options', 'nosniff')
}));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));

/* ============ الشات (WebSocket) ============ */
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });
const live = new Map(); // code -> Set<ws>
const MEDIA_RE = /^\/uploads\/([a-f0-9]{24}\.(jpg|png|gif|webp|mp4|webm|mov))$/;
const MAX_MSGS = 300;

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
function delMedia(m) {
  if (m && m.media) {
    const mm = MEDIA_RE.exec(m.media.url);
    if (mm) fs.unlink(path.join(UP_DIR, mm[1]), () => {});
  }
}
const pub = m => { const { hidden, ...r } = m; return r; };
function roomOf(code) { return db.rooms[code] || (db.rooms[code] = { msgs: [] }); }

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
    send(ws, { t: 'joined', code, msgs, members: membersOf(code) });
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
      if (!mm || !fs.existsSync(path.join(UP_DIR, mm[1]))) return send(ws, { t: 'err', error: 'الملف غير موجود' });
      media = { url: '/uploads/' + mm[1], type: /^(mp4|webm|mov)$/.test(mm[2]) ? 'video' : 'image' };
    }
    if (!text && !media) return;
    const m = { id: crypto.randomBytes(8).toString('hex'), k: ws.key, name: me.name, text, media, ts: now, editedAt: 0, deleted: false, reactions: {}, hidden: [] };
    room.msgs.push(m);
    while (room.msgs.length > MAX_MSGS) delMedia(room.msgs.shift());
    save();
    bc(code, { t: 'msg', m: pub(m), cid: d.cid || null });
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
    if (!m || m.deleted || !emoji) return;
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
    if (!r.msgs.length && !live.has(code)) delete db.rooms[code];
  }
  for (const h in db.sessions) if (db.sessions[h].t < Date.now() - 90 * 24 * 3600e3) delete db.sessions[h];
  save();
}
setInterval(cleanup, 3600e3);

server.listen(PORT, () => console.log('Flappy server on :' + PORT + ' | data: ' + DATA_DIR));
