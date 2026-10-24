'use strict';
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');
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
    if (fs.existsSync(DB_FILE)) {
      try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); }
      catch (e) {   // ملف موجود بس خربان: ننسخه ونوقف حتى ما نمسح الحسابات
        try { fs.copyFileSync(DB_FILE, DB_FILE + '.corrupt-' + Date.now()); } catch (e2) {}
        throw new Error('db.json خربان، انسخته للمراجعة وما راح أمسحه: ' + e.message);
      }
    }
    console.log('storage: files at ' + DATA_DIR + ' | users: ' + Object.keys(db.users).length);
  }
}


/* ===== تخزين خاص ومستقل للغرف المحمية (الشات ما ينمسح حتى لو انمسح/انخرب db الرئيسي) ===== */
const PROT_DIR = path.join(DATA_DIR, 'protected');
const protSig = {}, protBakAt = {};
const protFile = code => path.join(PROT_DIR, String(code).replace(/[^a-z0-9]/g, '') + '.json');
async function protRead(code) {
  try {
    if (pool) { const r = await pool.query('SELECT value FROM kv WHERE key = $1', ['prot:' + code]); return r.rows[0] ? JSON.parse(r.rows[0].value) : null; }
    for (const f of [protFile(code), protFile(code) + '.bak']) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') console.error('protected read:', f, e.message); } }
  } catch (e) { console.error('protected load failed:', e.message); }
  return null;
}
async function protSave() {
  for (const code of PROTECTED) {
    const room = db.rooms && db.rooms[code]; if (!room) continue;
    const json = JSON.stringify(room); if (protSig[code] === json) continue;
    try {
      if (pool) {
        await pool.query("INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", ['prot:' + code, json]);
        if (Date.now() - (protBakAt[code] || 0) > 6 * 3600e3) { await pool.query("INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", ['protbak:' + code, json]); protBakAt[code] = Date.now(); }
      } else {
        fs.mkdirSync(PROT_DIR, { recursive: true }); const f = protFile(code);
        if (fs.existsSync(f) && Date.now() - (protBakAt[code] || 0) > 600e3) { fs.copyFileSync(f, f + '.bak'); protBakAt[code] = Date.now(); }
        fs.writeFileSync(f + '.tmp', json); fs.renameSync(f + '.tmp', f);
      }
      protSig[code] = json;
    } catch (e) { console.error('protected save failed:', e.message); }
  }
}
async function protRestore() {   // عند التشغيل: ندمج الرسائل المحفوظة بالتخزين الخاص مع db (union بدون حذف أي رسالة)
  for (const code of PROTECTED) {
    const ext = await protRead(code), room = roomOf(code);
    if (ext && Array.isArray(ext.msgs)) {
      const have = new Set(room.msgs.map(m => m.id)), add = ext.msgs.filter(m => m && m.id && !have.has(m.id));
      if (add.length) { room.msgs = room.msgs.concat(add).sort((a, b) => (a.ts || 0) - (b.ts || 0)); console.log('protected ' + code + ': رجّعت ' + add.length + ' رسالة من التخزين الخاص'); }
      if ((!room.pins || !room.pins.length) && ext.pins && ext.pins.length) room.pins = ext.pins;
      if (!room.bg && ext.bg) { room.bg = ext.bg; room.bgAt = ext.bgAt; }
      room.reads = Object.assign({}, ext.reads || {}, room.reads || {});
    }
    console.log('protected ' + code + ': ' + room.msgs.length + ' رسالة');
  }
  await protSave();
}

/* ===== التقييمات وعدد الزوار: تخزين خاص ودائم (ما ينمسح بالديبلوي أو الريستارت أو لو انمسح db) ===== */
// كل جهاز إله تقييم واحد (يكدر يغيّره)، وكل جهاز يندز مرة وحدة بعدد الزوار. نحفظها بمكان مستقل + نسخة احتياطية ودمج بدون حذف.
let stats = { ratings: {}, devs: {}, since: Date.now() };
const STATS_FILE = path.join(PROT_DIR, 'stats.json');
let statsSig = '', statsBakAt = 0, statsTimer = null;
async function statsRead() {
  const out = [];
  try {
    if (pool) { const r = await pool.query("SELECT key, value FROM kv WHERE key IN ('stats', 'statsbak')"); r.rows.forEach(x => { try { out.push(JSON.parse(x.value)); } catch (e) {} }); }
    else for (const f of [STATS_FILE, STATS_FILE + '.bak']) { try { out.push(JSON.parse(fs.readFileSync(f, 'utf8'))); } catch (e) { if (e.code !== 'ENOENT') console.error('stats read:', f, e.message); } }
  } catch (e) { console.error('stats load failed:', e.message); }
  if (db.stats) out.push(db.stats);
  return out;
}
function statsMerge(list) {   // union: ما نحذف أي تقييم أو زائر، والأحدث يغلب
  list.forEach(o => { if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o.ratings || {})) { const c = stats.ratings[k]; if (!c || (v.ts || 0) > (c.ts || 0)) stats.ratings[k] = v; }
    for (const [k, v] of Object.entries(o.devs || {})) { const c = stats.devs[k]; stats.devs[k] = c ? { f: Math.min(c.f || v.f, v.f || c.f), l: Math.max(c.l || 0, v.l || 0), n: Math.max(c.n || 0, v.n || 0), u: v.u || c.u } : v; }
    if (o.since && o.since < stats.since) stats.since = o.since;
  });
}
async function statsSaveNow() {
  statsTimer = null; const json = JSON.stringify(stats); if (json === statsSig) return;
  try {
    if (pool) {
      await pool.query("INSERT INTO kv (key, value) VALUES ('stats', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [json]);
      if (Date.now() - statsBakAt > 3 * 3600e3) { await pool.query("INSERT INTO kv (key, value) VALUES ('statsbak', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [json]); statsBakAt = Date.now(); }
    } else {
      fs.mkdirSync(PROT_DIR, { recursive: true });
      if (fs.existsSync(STATS_FILE) && Date.now() - statsBakAt > 600e3) { fs.copyFileSync(STATS_FILE, STATS_FILE + '.bak'); statsBakAt = Date.now(); }
      fs.writeFileSync(STATS_FILE + '.tmp', json); fs.renameSync(STATS_FILE + '.tmp', STATS_FILE);
    }
    statsSig = json; db.stats = stats; save();   // نسخة ثالثة داخل db نفسه
  } catch (e) { console.error('stats save failed:', e.message); }
}
function statsSave() { if (!statsTimer) statsTimer = setTimeout(statsSaveNow, 800); }
async function statsInit() { statsMerge(await statsRead()); db.stats = stats; console.log('stats: ' + Object.keys(stats.devs).length + ' زائر | ' + Object.keys(stats.ratings).length + ' تقييم'); await statsSaveNow(); }


/* ===== نسخ احتياطية تلقائية =====
   كل ساعة نخزّن نسخة مضغوطة من كل البيانات (الحسابات، الغرف والدردشة المحمية، التقييمات، البيوت...).
   نحتفظ بآخر 24 نسخة ساعية + نسخة يومية لآخر 14 يوم. ما نحذف إلا النسخ القديمة، مو بيانات اللعبة.
   الصور والفيديوهات (uploads) مو داخل النسخة. */
const BAK_DIR = path.join(DATA_DIR, 'backups');
const BAK_EVERY = 3600e3, BAK_HOURLY = 24, BAK_DAILY = 14;
let bakBusy = false, bakSig = '', bakLast = 0;
const gzip = buf => new Promise((res, rej) => zlib.gzip(buf, { level: 6 }, (e, o) => (e ? rej(e) : res(o))));
const stamp = d => d.toISOString().replace(/[-:T]/g, '').slice(0, 12);   // 202610232237
async function bakBuild() { const json = JSON.stringify({ v: 1, ts: Date.now(), db, stats }); return { json, gz: await gzip(Buffer.from(json)) }; }
async function runBackup(force) {
  if (bakBusy) return null; bakBusy = true;
  try {
    const body = JSON.stringify({ db, stats }), sig = sha(body);
    if (!force && sig === bakSig) return null;   // ما تغيّر شي من آخر نسخة
    const { gz } = await bakBuild(), d = new Date(), hn = 'h-' + stamp(d), dn = 'd-' + stamp(d).slice(0, 8);
    if (pool) {
      const b64 = gz.toString('base64'), up = k => pool.query("INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [k, b64]);
      await up('bak:' + hn);
      const dr = await pool.query("SELECT 1 FROM kv WHERE key = $1", ['bak:' + dn]); if (!dr.rows.length) await up('bak:' + dn);
      for (const [pre, keep] of [['bak:h-', BAK_HOURLY], ['bak:d-', BAK_DAILY]]) await pool.query("DELETE FROM kv WHERE key LIKE $1 AND key NOT IN (SELECT key FROM kv WHERE key LIKE $1 ORDER BY key DESC LIMIT $2)", [pre + '%', keep]);
    } else {
      fs.mkdirSync(BAK_DIR, { recursive: true });
      fs.writeFileSync(path.join(BAK_DIR, hn + '.json.gz.tmp'), gz); fs.renameSync(path.join(BAK_DIR, hn + '.json.gz.tmp'), path.join(BAK_DIR, hn + '.json.gz'));
      const dp = path.join(BAK_DIR, dn + '.json.gz'); if (!fs.existsSync(dp)) fs.writeFileSync(dp, gz);
      for (const [pre, keep] of [['h-', BAK_HOURLY], ['d-', BAK_DAILY]]) fs.readdirSync(BAK_DIR).filter(f => f.startsWith(pre) && f.endsWith('.json.gz')).sort().reverse().slice(keep).forEach(f => { try { fs.unlinkSync(path.join(BAK_DIR, f)); } catch (e) {} });
    }
    bakSig = sig; bakLast = Date.now(); console.log('backup: ' + hn + ' (' + Math.round(gz.length / 1024) + ' KB)');
    return hn;
  } catch (e) { console.error('backup failed:', e.message); return null; }
  finally { bakBusy = false; }
}
async function bakList() {
  if (pool) { const r = await pool.query("SELECT key, length(value) AS n FROM kv WHERE key LIKE 'bak:%' ORDER BY key DESC"); return r.rows.map(x => ({ name: x.key.slice(4), kb: Math.round(x.n * 0.75 / 1024) })); }
  try { return fs.readdirSync(BAK_DIR).filter(f => f.endsWith('.json.gz')).sort().reverse().map(f => ({ name: f.replace('.json.gz', ''), kb: Math.round(fs.statSync(path.join(BAK_DIR, f)).size / 1024) })); } catch (e) { return []; }
}
function bakStart() { setTimeout(() => runBackup(true), 90e3); setInterval(() => runBackup(false), BAK_EVERY); }

let saveTimer = null, writing = false, dirty = false;
async function writeNow() {
  if (writing) { dirty = true; return; }
  writing = true;
  try {
    const json = JSON.stringify(db);
    if (pool) {
      await pool.query("INSERT INTO kv (key, value) VALUES ('db', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [json]);
    } else {
      try { if (fs.existsSync(DB_FILE) && Date.now() - (writeNow.bak || 0) > 6 * 3600e3) { fs.copyFileSync(DB_FILE, DB_FILE + '.bak'); writeNow.bak = Date.now(); } } catch (e) {}   // نسخة احتياطية كل 6 ساعات
      const tmp = DB_FILE + '.tmp';
      fs.writeFileSync(tmp, json); fs.renameSync(tmp, DB_FILE);
    }
  } catch (e) { console.error('save failed:', e.message); }
  try { await protSave(); } catch (e) {}
  writing = false;
  if (dirty) { dirty = false; await writeNow(); }
}
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; writeNow(); }, 500);
}
async function flushAndExit() {
  try { if (statsTimer) { clearTimeout(statsTimer); await statsSaveNow(); } } catch (e) {}
  try { if (typeof rmPersist === 'function') rmPersist(); } catch (e) {}   // تحديث نشاط الغرف قبل الإغلاق
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
const NAME_RE = /^[\p{L}\p{N}_.\- ]+$/u;           // الحسابات القديمة قد تحتوي رموز، فتسجيل الدخول لا يتأثر
const NEW_NAME_RE = /^[\p{L}\p{N}]+$/u;   // الأسماء الجديدة: حروف وأرقام فقط (ومسافة وحدة بين الكلمات)
// تطبيع الاسم لمنع التكرار المقنّع (حروف متشابهة، فراغات، رموز، حالة الأحرف)
function normName(n) {
  return String(n || '').normalize('NFKC').toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660)).replace(/[^\p{L}\p{N}]/gu, '');
}
const BAD_STRONG = ['كسمك','كسختك','كسام','كسها','كسك','منيوك','متناك','شرموط','قحب','عاهر','عاهره','خنيث','ابن الكلب','ابنالكلب','بنت الكلب','بنتالكلب','ابن الزاني','ديوث','فشخ','فشخه','لواط','لوطي','طيزك','عيري','عيرك','اخوك الشرموط','اغتصاب','سكس','كواد','قواد','ملعون الوالد','ولدالزنا','ولد الزنا','fuck','fuk','shit','bitch','cunt','pussy','whore','slut','nigg','asshole','porn','dickhead','bastard','rapist','motherf'];
const BAD_TOKEN = new Set(['كس','عير','زب','طيز','طيزي','كحبه','قحبه','نيج','سكس','sex','dick','cock','ass','rape','anal','penis','vagina','boob','boobs','xxx','nazi','isis','تفو','نيك','نيج','خرا','خره','زبي','زبك','متناك','منيوك']);
const RESERVED = ['admin','administrator','moderator','support','owner','system','ادمن','الادمن','مشرف','المشرف','الدعم','المالك','النظام','ربش','rbsh'];
const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '$': 's', '@': 'a' };
function badName(raw) {
  const low = String(raw).normalize('NFKC').toLowerCase();
  const toks = low.split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(t => normName(t));
  const flat = normName(low), leet = flat.replace(/[01345788]/g, d => LEET[d] || d);
  if (toks.some(t => BAD_TOKEN.has(t))) return true;
  for (const w of BAD_STRONG) { const n = normName(w); if (n.length >= 3 && (flat.includes(n) || leet.includes(n))) return true; }
  return false;
}
function checkNewName(raw) {
  const u = String(raw || '').trim();
  if (u.length < 3 || u.length > 5) return { error: 'الاسم لازم من 3 إلى 5 أحرف فقط' };
  if (!NEW_NAME_RE.test(u)) return { error: 'الاسم لازم حروف وأرقام فقط، ممنوع المسافات والرموز مثل % $ # @ _ - .' };
  if (/^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/i.test(u)) return { error: 'اسم غير مسموح' };
  if (badName(u)) return { error: '🚫 هذا الاسم غير لائق، اختار اسم محترم' };
  const nn = normName(u);
  if (RESERVED.some(r => normName(r) === nn)) return { error: 'هذا الاسم محجوز، اختار اسم ثاني' };
  return { name: u };
}
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

/* ===== حماية السبام: نفس الكلمة/الرسالة أكثر من 3 مرات = حظر مؤقت 20 ثانية من الكتابة (شات الغرف، المنتجع، البيوت، الخاص) ===== */
const SPAM_MAX = 3, SPAM_BLOCK_MS = 20e3, SPAM_WINDOW_MS = 60e3;
const spamSt = new Map();   // مفتاح اللاعب → { txt, n, t, until }
function spamNorm(t) { return String(t || '').toLowerCase().replace(/[\u064b-\u065f\u0640]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
function spamBlock(key, text) {   // يرجّع عدد الثواني المتبقية إذا هو محظور (والرسالة لا تنرسل)، وإلا 0
  const now = Date.now(), norm = spamNorm(text); if (!key || !norm) return 0;
  { const u = db.users[key]; if (u && u.admin) return 0; }   // المشرفين (بابي وبابيتو) مستثنين من حظر السبام
  let st = spamSt.get(key); if (!st) { st = { txt: '', n: 0, t: 0, until: 0 }; spamSt.set(key, st); }
  if (st.until > now) return Math.ceil((st.until - now) / 1000);
  if (st.txt === norm && now - st.t < SPAM_WINDOW_MS) st.n++; else { st.txt = norm; st.n = 1; }
  st.t = now;
  const words = {}; let wordSpam = false; norm.split(' ').forEach(w => { if (w.length > 1 && (words[w] = (words[w] || 0) + 1) > SPAM_MAX) wordSpam = true; });   // نفس الكلمة داخل رسالة وحدة
  if (st.n > SPAM_MAX || wordSpam) { st.until = now + SPAM_BLOCK_MS; st.n = 0; st.txt = ''; return Math.ceil(SPAM_BLOCK_MS / 1000); }
  return 0;
}
const spamErr = sec => '⛔ تكرار نفس الكلمة! انحظرت من الكتابة ' + sec + ' ثانية';
setInterval(() => { const now = Date.now(); for (const [k, v] of spamSt) if (now - v.t > 600e3 && v.until < now) spamSt.delete(k); }, 600e3);

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
const skinOk = (u, id) => u.admin && (own(SKIN_AT, id) || SHOP_IDS.includes(id)) ? true : own(SKIN_AT, id) ? (u.best || 0) >= SKIN_AT[id] : (SHOP_IDS.includes(id) && Array.isArray(u.owned) && u.owned.includes(id));
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
  ['inside', 'pet', 'حيوان أليف', [['pe0', 'فأرة (الأساسية)', '🐭', 0], ['pe1', 'سمكة', '🐠', 30], ['pe2', 'قطة', '🐈', 60], ['pe3', 'كلب', '🐕', 75]]],
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
/* موقع الغرض [x,y] + حجم اختياري [x,y,s] (0.5 – 1.8) */
function posVal(v) {
  const x = Math.max(-320, Math.min(320, Math.round(+v[0]))), y = Math.max(-320, Math.min(320, Math.round(+v[1])));
  const sc = v.length === 3 && Number.isFinite(+v[2]) ? Math.max(0.5, Math.min(1.8, Math.round(+v[2] * 20) / 20)) : 1;
  return sc === 1 ? [x, y] : [x, y, sc];
}
function houseOf(u) {
  if (!u.house || typeof u.house !== 'object') u.house = { own: [], set: {} };
  if (!Array.isArray(u.house.own)) u.house.own = [];
  if (!u.house.set || typeof u.house.set !== 'object') u.house.set = {};
  const own = new Set(u.house.own); HOUSE.forEach(sl => sl.items.forEach(i => { if (i.price === 0 || u.admin) own.add(i.id); }));
  const set = {};
  HOUSE.forEach(sl => { const cur = u.house.set[sl.slot]; if (cur && own.has(cur) && HOUSE_ITEM[cur] && HOUSE_ITEM[cur].slot === sl.slot) set[sl.slot] = cur; else { const d = sl.items.find(i => i.price === 0); if (d) set[sl.slot] = d.id; } });
  const pos = {};
  if (u.house.pos && typeof u.house.pos === 'object') for (const k of Object.keys(u.house.pos)) {
    const v = u.house.pos[k]; if (HOUSE_MOVABLE.includes(k) && Array.isArray(v) && (v.length === 2 || v.length === 3) && Number.isFinite(v[0]) && Number.isFinite(v[1])) pos[k] = posVal(v);
  }
  return { own: [...own], set, pos };
}
const userInfo = key => {
  const u = db.users[key], dy = dayOf(u); if (u.admin && (u.coins || 0) < 9999999) u.coins = 9999999;   // المشرفين عملاتهم ما تخلص
  return {
    name: u.name, best: u.best || 0, games: u.games || 0, rank: rankOf(key), skin: skinOf(key), avatar: u.avatar || '', frame: frameOf(u),
    coins: u.coins || 0, owned: Array.isArray(u.owned) ? u.owned : [], daily: dailyInfo(u),
    bricks: u.bricks || 0, admin: !!u.admin, zones: u.zones || 1, cp: u.cp || 1, freeSkips: u.freeSkips || 0, house: houseOf(u), likes: (u.hlikes || []).length,
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
// رقم نسخة الواجهة: يتغير مع كل تحديث، والصفحات المفتوحة تتحدّث لوحدها
const BUILD = (() => { try { return crypto.createHash('md5').update(fs.readFileSync(path.join(__dirname, 'public', 'index.html'))).digest('hex').slice(0, 10); } catch (e) { return String(Date.now()); } })();
app.get('/api/version', (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ v: BUILD }); });
app.get('/healthz', (req, res) => res.type('text').send('ok'));   // لفحص الصحة وإبقاء السيرفر صاحي

function authMw(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const key = keyFromToken(token);
  if (!key) return res.status(401).json({ error: 'سجّل دخول من جديد' });
  req.key = key; req.th = sha(token);
  next();
}

app.get('/health', (req, res) => res.send('ok'));
/* ---- الزوار والتقييم ---- */
const devOk = d => typeof d === 'string' && /^[a-z0-9]{12,40}$/i.test(d);
const optUser = req => { try { const h = req.headers.authorization || ''; const k = keyFromToken(h.startsWith('Bearer ') ? h.slice(7) : ''); return k && db.users[k] ? db.users[k] : null; } catch (e) { return null; } };
app.post('/api/visit', (req, res) => {
  const d = req.body && req.body.dev; if (!devOk(d)) return res.status(400).json({ error: 'bad' });
  if (limited('vis:' + req.ip, 30, 600e3)) return res.json({ ok: 1 });
  const u = optUser(req), now = Date.now(), c = stats.devs[d];
  stats.devs[d] = c ? Object.assign(c, { l: now, n: (c.n || 0) + 1 }, u ? { u: u.name } : {}) : Object.assign({ f: now, l: now, n: 1 }, u ? { u: u.name } : {});
  statsSave(); res.json({ ok: 1, rated: !!(stats.ratings[d] || (u && stats.ratings['u:' + u.name])) });
});
app.post('/api/rate', (req, res) => {
  const b = req.body || {}, d = b.dev; if (!devOk(d)) return res.status(400).json({ error: 'bad' });
  if (b.v !== 'love' && b.v !== 'no') return res.status(400).json({ error: 'اختار قلب' });
  if (limited('rate:' + req.ip, 12, 3600e3)) return res.status(429).json({ error: 'محاولات كثيرة' });
  const u = optUser(req), key = u ? 'u:' + u.name : d, prev = stats.ratings[key];
  let note = String(b.note || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200), noteLocked = false;
  if (prev && prev.note) { noteLocked = !!note && note !== prev.note; note = prev.note; }   // تعليق واحد بس لكل حساب
  stats.ratings[key] = { v: b.v, note, name: u ? u.name : '', guest: !u, dev: d, ts: Date.now(), first: prev ? (prev.first || prev.ts) : Date.now() };
  if (u && stats.ratings[d] && stats.ratings[d].guest) delete stats.ratings[d];   // الضيف صار حساب: تقييم واحد بس
  if (!stats.devs[d]) stats.devs[d] = { f: Date.now(), l: Date.now(), n: 1 };
  statsSave(); res.json({ ok: 1, note, noteLocked });
});
app.get('/api/rate/me', (req, res) => {
  const d = String(new URL(req.url, 'http://x').searchParams.get('dev') || ''), u = optUser(req), r = (u && stats.ratings['u:' + u.name]) || (devOk(d) && stats.ratings[d]) || null;
  res.json({ r: r ? { v: r.v, note: r.note } : null });
});
app.get('/api/admin/stats', authMw, (req, res) => {
  const u = db.users[req.key]; if (!u || !u.admin) return res.status(403).json({ error: 'للمشرفين فقط' });
  const R = Object.values(stats.ratings), D = Object.values(stats.devs), day = Date.now() - 864e5;
  res.json({ visitors: D.length, today: D.filter(x => (x.l || 0) > day).length, accounts: Object.keys(db.users).length, love: R.filter(x => x.v === 'love').length, no: R.filter(x => x.v === 'no').length, since: stats.since,
    recent: R.sort((a, b) => b.ts - a.ts).slice(0, 60).map(x => ({ v: x.v, note: x.note, name: x.name, guest: x.guest, ts: x.ts })) });
});


app.post('/api/register', (req, res) => {
  if (limited('reg:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'محاولات كثيرة، جرب بعد شوي' });
  if (req.body && req.body.p2 !== undefined && String(req.body.p2) !== String(req.body.p)) return res.status(400).json({ error: 'كلمة السر وتأكيدها مو متطابقين' });
  const chk = checkNewName(req.body && req.body.u);
  const p = String((req.body && req.body.p) || '');
  if (chk.error) return res.status(400).json({ error: chk.error });
  const name = chk.name;
  if (/\s/.test(p)) return res.status(400).json({ error: 'الرمز ممنوع فيه مسافات' });
  if (p.length < 4 || p.length > 64) return res.status(400).json({ error: 'كلمة السر لازم 4 أحرف على الأقل' });
  const key = name.toLowerCase();
  const nk = normName(name);
  if (own(db.users, key) || Object.keys(db.users).some(k => normName(db.users[k].name || k) === nk)) return res.status(409).json({ error: 'هذا الاسم مستخدم أو شبيه باسم موجود، اختار اسم ثاني' });
  const salt = crypto.randomBytes(16).toString('hex');
  const rc = String((req.body && req.body.ref) || '').trim().toUpperCase().slice(0, 8);
  const refBy = rc ? Object.keys(db.users).find(k => db.users[k].refCode === rc) : null;
  db.users[key] = Object.assign({ name, salt, hash: hashPw(p, salt), best: 0, games: 0, bestAt: 0, created: Date.now(), freeSkips: 2 }, refBy ? { refBy } : {});
  const token = newSession(key);
  save(); alog('🆕', 'سجّل حساب جديد: ' + name);
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

// تصدير نسخة من الغرفة المحمية (للمالك فقط، يحتاج ADMIN_KEY)
app.get('/api/admin/chat-backup', (req, res) => {
  const sp = new URL(req.url, 'http://x').searchParams;
  const ak = process.env.ADMIN_KEY || '';
  if (limited('adm:' + req.ip, 10, 600e3)) return res.status(429).json({ error: 'محاولات كثيرة' });
  if (!ak || ak.length < 8 || !safeEq(String(sp.get('key') || ''), ak)) return res.status(403).json({ error: 'مفتاح غلط' });
  const code = String(sp.get('code') || 'rbsh99daklot99').toLowerCase(); if (!PROTECTED.has(code) || !db.rooms[code]) return res.status(404).json({ error: 'غرفة غير موجودة' });
  res.setHeader('Content-Disposition', 'attachment; filename="chat-' + code + '.json"'); res.json(db.rooms[code]);
});
// نسخ احتياطية كاملة (للمالك فقط، يحتاج ADMIN_KEY): ?key=... يعرض القائمة، &now=1 ينشئ نسخة جديدة، &get=<اسم> ينزّل نسخة، &get=live ينزّل نسخة حالية
app.get('/api/admin/backup', async (req, res) => {
  const sp = new URL(req.url, 'http://x').searchParams, ak = process.env.ADMIN_KEY || '';
  if (limited('adm:' + req.ip, 10, 600e3)) return res.status(429).json({ error: 'محاولات كثيرة' });
  if (!ak || ak.length < 8 || !safeEq(String(sp.get('key') || ''), ak)) return res.status(403).json({ error: 'مفتاح غلط' });
  try {
    const get = sp.get('get');
    if (get === 'live') { const { gz } = await bakBuild(); res.setHeader('Content-Type', 'application/gzip'); res.setHeader('Content-Disposition', 'attachment; filename="babito-live-' + stamp(new Date()) + '.json.gz"'); return res.end(gz); }
    if (get) {
      const nm = String(get).replace(/[^a-z0-9-]/g, ''); let buf = null;
      if (pool) { const r = await pool.query('SELECT value FROM kv WHERE key = $1', ['bak:' + nm]); if (r.rows[0]) buf = Buffer.from(r.rows[0].value, 'base64'); }
      else { const f = path.join(BAK_DIR, nm + '.json.gz'); if (fs.existsSync(f)) buf = fs.readFileSync(f); }
      if (!buf) return res.status(404).json({ error: 'النسخة مو موجودة' });
      res.setHeader('Content-Type', 'application/gzip'); res.setHeader('Content-Disposition', 'attachment; filename="babito-' + nm + '.json.gz"'); return res.end(buf);
    }
    if (sp.get('now')) await runBackup(true);
    res.json({ last: bakLast, every: '1h', keep: { hourly: BAK_HOURLY, daily: BAK_DAILY }, backups: await bakList() });
  } catch (e) { res.status(500).json({ error: 'تعذّر: ' + e.message }); }
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
  save(); alog('🛍️', u.name + ' اشترى سكن بـ ' + price + ' عملة');
  res.json({ coins: u.coins, owned: u.owned, skin: id });
});

app.get('/api/leaderboard', (req, res) => {
  const top = Object.values(db.users)
    .filter(u => u.best > 0)
    .sort((a, b) => b.best - a.best || (a.bestAt || 0) - (b.bestAt || 0))
    .slice(0, 10)
    .map(u => ({ name: u.name, best: u.best, games: u.games || 0, avatar: u.avatar || '', frame: frameOf(u) }));
  res.json({ top });
});

const games = new Map(); // gid -> {k, t}
setInterval(() => { const now = Date.now(); for (const [g, v] of games) if (now - v.t > 3600e3) games.delete(g); }, 600e3);

app.post('/api/start', authMw, (req, res) => {
  const gid = crypto.randomBytes(12).toString('hex');
  const u = db.users[req.key];
  let sl = Math.floor(Number(req.body && req.body.startLevel)) || 1;
  if (u.admin) sl = Math.max(1, Math.min(500, sl));   // الأدمن يبدأ من أي مرحلة
  else if (sl !== (u.cp || 1) && (sl < 1 || (sl - 1) % 7 !== 0 || (sl - 1) / 7 >= (u.zones || 1))) sl = 1;   // نقدر نبدأ فقط من أول مرحلة بمنطقة مفتوحة
  games.set(gid, { k: req.key, sl, t: Date.now(), last: sl - 1, lt: Date.now(), bn: 0, bt: 0 });
  if (alOnce('st:' + req.key, 20e3)) alog('🎮', u.name + ' بدأ يلعب من المرحلة ' + sl);
  res.json({ gid, start: sl });
});

// إنهاء مرحلة بالفردي: يكسب مواد بناء، وكل 7 مراحل تنفتح منطقة جديدة
app.post('/api/level', authMw, (req, res) => {
  const g = games.get(String((req.body && req.body.gid) || ''));
  const lv = Math.floor(Number(req.body && req.body.level));
  if (!g || g.k !== req.key || !Number.isFinite(lv)) return res.status(400).json({ error: 'لعبة غير صالحة' });
  if (lv !== g.last + 1 || lv > 500) return res.status(400).json({ error: 'مرحلة غير صالحة' });
  const minSec = zLevelN(lv) * 0.04;                       // أقل وقت معقول لتفجير كل كرات المرحلة
  if ((Date.now() - g.lt) / 1000 < minSec) return res.status(400).json({ error: 'سريع بشكل غير طبيعي' });
  g.last = lv; g.lt = Date.now();
  const u = db.users[req.key], dy = dayOf(u);
  if (lv + 1 > (u.cp || 1) || g.sl === (u.cp || 1)) u.cp = Math.min(500, lv + 1);   // نقطة الحفظ: المرحلة اللي توصلها
  let want = 10 + 2 * lv; const zoneDone = lv % 7 === 0; if (zoneDone) want += 50;
  const gained = Math.max(0, Math.min(want, BRICK_DAY_CAP - (dy.bricks || 0)));
  dy.bricks = (dy.bricks || 0) + gained; u.bricks = (u.bricks || 0) + gained;
  let newZone = false;
  if (zoneDone && (u.zones || 1) < Math.min(4, lv / 7 + 1)) { u.zones = Math.min(4, lv / 7 + 1); newZone = true; }   // 4 فصول
  save(); alog('🏁', u.name + ' خلّص المرحلة ' + lv + (newZone ? ' وفتح فصل جديد 🗺️' : ''));
  res.json({ gained, capped: gained < want, newZone, user: userInfo(req.key) });
});

// تخطي مرحلة بالعملات: 200 ثم 400 ثم 600... (يزيد 200 كل تخطي بنفس اللعبة)، بدون جوائز مواد بناء
app.post('/api/skip', authMw, (req, res) => {
  const g = games.get(String((req.body && req.body.gid) || ''));
  const lv = Math.floor(Number(req.body && req.body.level));
  if (!g || g.k !== req.key || !Number.isFinite(lv)) return res.status(400).json({ error: 'لعبة غير صالحة' });
  if (lv !== g.last + 1 || lv > 500) return res.status(400).json({ error: 'مرحلة غير صالحة' });
  const u = db.users[req.key], free = (u.freeSkips || 0) > 0, cost = free ? 0 : 200 * ((g.skips || 0) + 1), coins = u.coins || 0;
  if (coins < cost) return res.status(403).json({ error: 'عملاتك ما تكفي للتخطي، تحتاج ' + cost + ' وينقصك ' + (cost - coins) });
  if (free) u.freeSkips--; else u.coins = coins - cost; if (!free) g.skips = (g.skips || 0) + 1; else g.fskips = (g.fskips || 0) + 1; g.last = lv; g.lt = Date.now();
  if (lv + 1 > (u.cp || 1) || g.sl === (u.cp || 1)) u.cp = Math.min(500, lv + 1);
  save(); alog('⏭️', u.name + ' تخطّى المرحلة ' + lv + (free ? ' (مجاناً)' : ' بـ ' + cost + ' عملة'));
  res.json({ cost, free, nextCost: 200 * ((g.skips || 0) + 1), user: userInfo(req.key) });
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
  save(); alog('🏠', u.name + ' اشترى للبيت: ' + it.name);
  res.json({ user: userInfo(req.key) });
});
// حفظ أماكن الأغراض (إزاحة عن الترتيب التلقائي)؛ القيمة null ترجع الغرض لمكانه الأصلي
// بيت صديق (للأصدقاء فقط) مع الإعجابات
app.get('/api/house/of', authMw, (req, res) => {
  let nm = ''; try { nm = new URL(req.url, 'http://x').searchParams.get('name') || ''; } catch (e) {}
  const k = keyOfName(nm); if (!own(db.users, k)) return res.status(404).json({ error: 'ما لقيت البيت' });
  if (k !== req.key && !mutual(req.key, k)) return res.status(403).json({ error: 'بيوت الأصدقاء فقط' });
  const u = db.users[k], h = houseOf(u), hl = Array.isArray(u.hlikes) ? u.hlikes : [];
  res.json({ name: u.name, skin: skinOf(k), house: { set: h.set, pos: h.pos }, likes: hl.length, liked: hl.includes(req.key), self: k === req.key, petName: (u.pet && u.pet.name) || '' });
});
// إعجاب ❤️ ببيت صديق (مرة لكل شخص، والضغط ثاني مرة يلغيه)
app.post('/api/house/like', authMw, (req, res) => {
  const k = keyOfName(req.body && req.body.name); if (!own(db.users, k)) return res.status(404).json({ error: 'ما لقيت البيت' });
  if (k === req.key) return res.status(400).json({ error: 'ما تقدر تعجب ببيتك' });
  if (!mutual(req.key, k)) return res.status(403).json({ error: 'للأصدقاء فقط' });
  const u = db.users[k]; u.hlikes = Array.isArray(u.hlikes) ? u.hlikes : []; const i = u.hlikes.indexOf(req.key), on = i < 0;
  if (on) u.hlikes.push(req.key); else u.hlikes.splice(i, 1); save();
  const msg = { t: 'hv_like', n: db.users[req.key].name, likes: u.hlikes.length, on }; hvBc(k, msg);
  const set = hvRooms.get(k); if (!set || ![...set].some(w => w.key === k)) pushTo(k, msg);
  res.json({ likes: u.hlikes.length, liked: on });
});
app.post('/api/house/pos', authMw, (req, res) => {
  const u = db.users[req.key], h = houseOf(u), inp = (req.body && req.body.pos) || {};
  if (typeof inp !== 'object') return res.status(400).json({ error: 'بيانات غلط' });
  const pos = Object.assign({}, h.pos);
  for (const k of Object.keys(inp)) {
    if (!HOUSE_MOVABLE.includes(k)) continue; const v = inp[k];
    if (v === null) delete pos[k]; else if (Array.isArray(v) && (v.length === 2 || v.length === 3) && Number.isFinite(+v[0]) && Number.isFinite(+v[1])) pos[k] = posVal(v);
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

// المحفظة: شيل غرض مشترى من البيت (يبقى ملكك بالمحفظة) — إرجاعه عبر /api/house/set
app.post('/api/house/stash', authMw, (req, res) => {
  const slot = String((req.body && req.body.slot) || ''), u = db.users[req.key], h = houseOf(u), id = h.set[slot], it = id && HOUSE_ITEM[id];
  if (!it || it.slot !== slot || it.price <= 0) return res.status(400).json({ error: 'هذا الغرض ما يروح للمحفظة' });
  if (!h.own.includes(id)) return res.status(400).json({ error: 'ما تملك هذا الغرض' });
  const set = Object.assign({}, h.set); delete set[slot];   // houseOf يرجّع الغرض المجاني الافتراضي إن وجد
  u.house = { own: h.own.filter(i => HOUSE_ITEM[i] && HOUSE_ITEM[i].price > 0), set, pos: h.pos }; save();
  res.json({ user: userInfo(req.key), name: it.name });
});

// بيع غرض من البيت: يرجع نفس سعره (مواد بناء)
app.post('/api/house/sell', authMw, (req, res) => {
  const id = String((req.body && req.body.id) || ''), it = HOUSE_ITEM[id], u = db.users[req.key], h = houseOf(u);
  if (u.admin) return res.status(400).json({ error: 'حساب الأدمن يملك كل شي، ما يحتاج بيع' });
  if (!it || it.price <= 0 || it.slot === 'home') return res.status(400).json({ error: 'هذا الغرض ما ينباع' });
  if (!h.own.includes(id)) return res.status(400).json({ error: 'ما تملك هذا الغرض' });
  const set = Object.assign({}, h.set); if (set[it.slot] === id) delete set[it.slot];
  u.house = { own: h.own.filter(i => i !== id && HOUSE_ITEM[i] && HOUSE_ITEM[i].price > 0), set, pos: h.pos };
  u.bricks = (u.bricks || 0) + it.price; save();
  res.json({ refund: it.price, name: it.name, user: userInfo(req.key) });
});

/* ================= الحيوان الأليف: رعاية، حمام، نوم، مستويات، مشاركة ================= */
const PET_MAXLV = 30, petNeed = l => 40 + 15 * (l - 1), petIvl = l => (15 + (l - 1) * 3) * 60;   // ثواني: مستوى 1 = 15 دقيقة، وكل مستوى +3 دقايق
function petOf(u) {
  if (!u.pet || typeof u.pet !== 'object') u.pet = {};
  const p = u.pet; p.name = String(p.name || ''); p.lvl = Math.max(1, Math.min(PET_MAXLV, Math.floor(p.lvl) || 1)); p.xp = Math.max(0, Number(p.xp) || 0); p.t = Math.max(0, Number(p.t) || 0);
  p.dirty = !!p.dirty; p.light = p.light !== false; p.bed = !!p.bed; p.cover = !!p.cover; p.sleep = !!p.sleep; p.sleepAt = Number(p.sleepAt) || 0;
  if (!Array.isArray(p.partners)) p.partners = []; p.at = String(p.at || ''); p.atUntil = Number(p.atUntil) || 0; p.pw = Number(p.pw) || 0; p.pn = Number(p.pn) || 0;
  return p;
}
function petSpecies(u) { const id = houseOf(u).set.pet, it = id && HOUSE_ITEM[id]; return it ? it.v : ''; }
function petFix(k) { const u = db.users[k], p = petOf(u); if (p.at && Date.now() > p.atUntil) { p.at = ''; p.atUntil = 0; } return p; }
function petCan(me, k, p) { return me === k || (mutual(me, k) && (p.partners.includes(me) || p.at === me)); }
function petAddXp(p, n) { if (p.lvl >= PET_MAXLV) { p.xp = 0; return false; } p.xp += n; let up = false; while (p.lvl < PET_MAXLV && p.xp >= petNeed(p.lvl)) { p.xp -= petNeed(p.lvl); p.lvl++; up = true; } if (p.lvl >= PET_MAXLV) p.xp = 0; return up; }
function petSleepSync(p) { const ns = !p.light && p.bed && p.cover, now = Date.now(); let up = false; if (ns && !p.sleep) { p.sleep = true; p.sleepAt = now; } else if (!ns && p.sleep) { p.sleep = false; if (now - p.sleepAt >= 60e3) up = petAddXp(p, 15); } return up; }
function petView(k, me) {
  const u = db.users[k], p = petFix(k), sp = petSpecies(u); if (!sp) return null;
  const at = p.at && db.users[p.at] ? db.users[p.at].name : '';
  return { owner: u.name, name: p.name, species: sp, lvl: p.lvl, xp: Math.round(p.xp), need: p.lvl >= PET_MAXLV ? 0 : petNeed(p.lvl), t: Math.round(p.t), ivl: petIvl(p.lvl), dirty: p.dirty, light: p.light, bed: p.bed, cover: p.cover, sleep: p.sleep,
    partners: me === k ? p.partners.filter(x => db.users[x]).map(x => db.users[x].name) : [], at, atLeft: p.at ? Math.max(0, Math.round((p.atUntil - Date.now()) / 1000)) : 0, isOwner: me === k, canCare: petCan(me, k, p) };
}
function petNotify(k, p, exceptKey) { const who = new Set([k, ...p.partners, p.at]); who.delete(''); who.delete(exceptKey); who.forEach(x => pushTo(x, { t: 'pet_upd', owner: db.users[k].name })); }
app.get('/api/pet/list', authMw, (req, res) => {
  const out = [];
  for (const k in db.users) {
    const u = db.users[k]; if (!u.pet && k !== req.key) continue;
    const p = petFix(k); if (!petSpecies(u)) continue;
    if (k === req.key || (mutual(req.key, k) && (p.partners.includes(req.key) || p.at === req.key))) { const v = petView(k, req.key); out.push({ owner: v.owner, name: v.name, species: v.species, mine: k === req.key, guest: p.at === req.key && k !== req.key }); }
  }
  res.json({ pets: out });
});
app.get('/api/pet/of', authMw, (req, res) => {
  let nm = ''; try { nm = new URL(req.url, 'http://x').searchParams.get('name') || ''; } catch (e) {}
  const k = keyOfName(nm); if (!own(db.users, k)) return res.status(404).json({ error: 'ما لقيت الحيوان' });
  const p = petFix(k); if (!petCan(req.key, k, p)) return res.status(403).json({ error: 'ما عندك إذن' });
  const v = petView(k, req.key); if (!v) return res.status(404).json({ error: 'ما عنده حيوان' });
  res.json({ pet: v });
});
app.post('/api/pet/tick', authMw, (req, res) => {   // وقت اللعب يوسّخ الحيوان (للمالك فقط)
  const u = db.users[req.key]; if (!petSpecies(u)) return res.json({ pet: null });
  const p = petFix(req.key), sec = Math.max(0, Math.min(75, Math.floor(Number(req.body && req.body.sec)) || 0)), was = p.dirty;
  if (!p.sleep) p.t += sec; if (p.t >= petIvl(p.lvl)) p.dirty = true;
  save(); res.json({ pet: petView(req.key, req.key), justDirty: p.dirty && !was });
});
app.post('/api/pet/act', authMw, (req, res) => {
  const k = keyOfName(req.body && req.body.owner); if (!own(db.users, k)) return res.status(404).json({ error: 'ما لقيت الحيوان' });
  const u = db.users[k], p = petFix(k); if (!petSpecies(u)) return res.status(400).json({ error: 'ما عنده حيوان' });
  const me = req.key; if (!petCan(me, k, p)) return res.status(403).json({ error: 'بس صاحب الحيوان أو شريكه يكدر يعتني به' });
  if (limited('pet:' + me, 90, 60e3)) return res.status(429).json({ error: 'بطّء شوي' });
  const act = String((req.body && req.body.act) || ''), b = req.body || {}; let up = false, gain = 0;
  if (act === 'bath') { const need = p.dirty || p.t >= petIvl(p.lvl) * 0.5; p.dirty = false; p.t = 0; if (need) { up = petAddXp(p, 30); gain = 30; } }
  else if (act === 'bed') { p.bed = !!b.on; if (!p.bed) p.cover = false; up = petSleepSync(p); }
  else if (act === 'cover') { if (!p.bed) return res.status(400).json({ error: 'حطّه بالسرير أول' }); p.cover = !!b.on; up = petSleepSync(p); }
  else if (act === 'light') { p.light = !!b.on; up = petSleepSync(p); }
  else if (act === 'name') { if (k !== me) return res.status(403).json({ error: 'بس صاحبه يسمّيه' }); p.name = String(b.name || '').replace(/[<>&"]/g, '').trim().slice(0, 14); }
  else if (act === 'play') { const now = Date.now(); if (now - p.pw > 3600e3) { p.pw = now; p.pn = 0; } if (p.pn < 10) { p.pn++; up = petAddXp(p, 2); gain = 2; } }
  else return res.status(400).json({ error: 'أمر غير معروف' });
  save(); petNotify(k, p, me); res.json({ pet: petView(k, me), up, gain });
});
app.post('/api/pet/share', authMw, (req, res) => {   // صاحب الحيوان يضيف/يشيل شريك
  const u = db.users[req.key], p = petOf(u); if (!petSpecies(u)) return res.status(400).json({ error: 'ما عندك حيوان' });
  const t = keyOfName(req.body && req.body.name); if (!own(db.users, t) || t === req.key || !mutual(req.key, t)) return res.status(400).json({ error: 'لازم يكون صديقك' });
  if (req.body && req.body.on) { if (!p.partners.includes(t)) { if (p.partners.length >= 5) return res.status(400).json({ error: 'أقصى شي 5 شركاء' }); p.partners.push(t); } }
  else { p.partners = p.partners.filter(x => x !== t); if (p.at === t) { p.at = ''; p.atUntil = 0; } }
  save(); pushTo(t, { t: 'pet_upd', owner: u.name }); res.json({ pet: petView(req.key, req.key) });
});
app.post('/api/pet/send', authMw, (req, res) => {   // صاحب الحيوان يرسله يدوياً لبيت صديق (بإذنه)، ويرجع تلقائياً بعد 10 دقايق
  const u = db.users[req.key], p = petFix(req.key); if (!petSpecies(u)) return res.status(400).json({ error: 'ما عندك حيوان' });
  if (req.body && req.body.recall) { p.at = ''; p.atUntil = 0; save(); return res.json({ pet: petView(req.key, req.key) }); }
  const t = keyOfName(req.body && req.body.name); if (!own(db.users, t) || t === req.key || !mutual(req.key, t)) return res.status(400).json({ error: 'لازم يكون صديقك' });
  p.at = t; p.atUntil = Date.now() + 600e3; save(); pushTo(t, { t: 'pet_upd', owner: u.name, toast: '🐾 ' + u.name + ' أرسل لك حيوانه ' + (p.name || '') + ' لمدة 10 دقايق، اعتنوا به سوا!' }); res.json({ pet: petView(req.key, req.key) });
});

app.post('/api/score', authMw, (req, res) => {
  const gid = String((req.body && req.body.gid) || '');
  const score = parseInt(req.body && req.body.score, 10);
  const g = games.get(gid);
  if (!g || g.k !== req.key) return res.status(400).json({ error: 'لعبة غير صالحة' });
  games.delete(gid);
  if (Number.isFinite(score) && db.users[req.key]) alog('🎯', db.users[req.key].name + ' انتهت لعبته بنتيجة ' + score);
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
// الصور الشخصية الجاهزة والإطارات
const PFP_MAX = 30, PFP_ADM = [31, 32, 33];   // 31-33 صور بروفيشنال للمشرفين فقط
const FRAMES = ['', 'gold', 'rainbow', 'neon', 'fire', 'love', 'ice', 'leaf', 'night', 'crown', 'royal', 'plat', 'shield'];
const FRAME_ADMIN = ['crown', 'royal', 'plat', 'shield'];
function frameOf(u) { const f = u && u.frame; return FRAMES.includes(f) && (!FRAME_ADMIN.includes(f) || u.admin) ? f : ''; }
app.post('/api/pfp', authMw, (req, res) => {
  const u = db.users[req.key], b = req.body || {};
  if (b.p !== undefined) {
    const m = /^p(\d{1,2})$/.exec(String(b.p || ''));
    if (!m || +m[1] < 1 || (+m[1] > PFP_MAX && !PFP_ADM.includes(+m[1]))) return res.status(400).json({ error: 'صورة غير موجودة' });
    if (PFP_ADM.includes(+m[1]) && !u.admin) return res.status(403).json({ error: 'هذه الصورة للمشرفين فقط 🛡️' });
    if (String(u.avatar || '').startsWith('/uploads/')) mediaDelUrl(u.avatar);
    u.avatar = 'p:' + m[1];
  }
  if (b.f !== undefined) {
    const f = String(b.f || '');
    if (!FRAMES.includes(f)) return res.status(400).json({ error: 'إطار غير موجود' });
    if (FRAME_ADMIN.includes(f) && !u.admin) return res.status(403).json({ error: 'هذا الإطار للإدارة فقط 👑' });
    u.frame = f;
  }
  save();
  res.json({ avatar: u.avatar || '', frame: frameOf(u) });
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
/* ضغط ملفات اللعبة (gzip) حتى تنزل أسرع: نضغط الملف مرة وحدة ونخزنه بالذاكرة لين يتغير */
const GZC = new Map();
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (!/\bgzip\b/.test(req.headers['accept-encoding'] || '')) return next();
  let rel; try { rel = decodeURIComponent(req.path); } catch (e) { return next(); } if (rel === '/') rel = '/index.html';
  if (!/\.(html|js|json|css|svg)$/i.test(rel) || rel.includes('..')) return next();
  const fp = path.join(__dirname, 'public', rel);
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) return next();
    const key = fp + ':' + st.mtimeMs + ':' + st.size; let gzb = GZC.get(fp);
    if (!gzb || gzb.key !== key) { try { gzb = { key, buf: zlib.gzipSync(fs.readFileSync(fp), { level: 9 }) }; GZC.set(fp, gzb); } catch (e) { return next(); } }
    const ext = rel.split('.').pop().toLowerCase(), ct = { html: 'text/html; charset=utf-8', js: 'application/javascript; charset=utf-8', json: 'application/json; charset=utf-8', css: 'text/css; charset=utf-8', svg: 'image/svg+xml' }[ext];
    res.set({ 'Content-Type': ct, 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding', 'Cache-Control': 'public, max-age=0', 'Content-Length': gzb.buf.length });
    if (req.method === 'HEAD') return res.end(); res.end(gzb.buf);
  });
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));

/* ============ الشات (WebSocket) ============ */
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });
const live = new Map(); // code -> Set<ws>
// غرف محمية: رسائلها ما تنحذف ولا تنقص ابداً (لا حذف للكل، لا تقليم، لا تنظيف تلقائي)
const PROTECTED = new Set(['rbsh99daklot99']);
const isProt = code => PROTECTED.has(String(code));
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
  let rm = null; if (on) for (const w of wss.clients) if (w.key === key && w.rm && !w.rm.hid && w.readyState === 1) { const rr = rmRooms.get(w.rm.id); if (rr) { rm = { id: rr.id, name: rr.name, locked: !!rr.code }; break; } }
  return { name: f.name, online: on, lastSeen: f.lastSeen || 0, room, rm, unread, avatar: f.avatar || '', frame: frameOf(f),
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
/* ============ لوحة المشرفين: سجل حي (دخول/خروج/فعاليات) ============ */
const ALOG = [], ALOG_MAX = 200, alSubs = new Set(), alGone = new Map(), alSeen = new Map();
const unm = k => (db.users[k] && db.users[k].name) || '؟';
function alWho() {
  const acc = new Map(), gst = new Set();
  for (const w of wss.clients) { if (w.readyState !== 1 || !w.key) continue; if (w.guest) gst.add(w.gname); else if (db.users[w.key]) acc.set(w.key, db.users[w.key].name); }
  return { acc: acc.size, gst: gst.size, names: [...acc.values()].sort(), guests: [...gst].sort() };
}
let alCntT = null;
function alCntPush() {
  if (alCntT || !alSubs.size) return;
  alCntT = setTimeout(() => { alCntT = null; const s = JSON.stringify(Object.assign({ t: 'al_cnt' }, alWho())); for (const w of alSubs) if (w.readyState === 1) w.send(s); }, 500);
}
function alog(ic, txt) {
  const e = { ts: Date.now(), ic, txt: String(txt).slice(0, 180) }; ALOG.push(e); while (ALOG.length > ALOG_MAX) ALOG.shift();
  const s = JSON.stringify({ t: 'al_add', e }); for (const w of alSubs) if (w.readyState === 1) w.send(s);
}
// نفس الحدث من نفس الشخص ما يتكرر خلال فترة قصيرة (إعادة اتصال وغيرها)
function alOnce(id, ms) { const now = Date.now(), t = alSeen.get(id) || 0; if (now - t < ms) return false; alSeen.set(id, now); if (alSeen.size > 3000) for (const [k, v] of alSeen) if (now - v > 600e3) alSeen.delete(k); return true; }
function alOn(key) { const t = alGone.get(key); if (t) { clearTimeout(t); alGone.delete(key); return; } alog('🟢', 'انضم ' + unm(key) + ' للعبة'); }
function alOff(key) { if (alGone.has(key)) return; alGone.set(key, setTimeout(() => { alGone.delete(key); if (!isOnline(key)) alog('🔴', 'خرج ' + unm(key) + ' من اللعبة'); }, 6000)); }
const AL_MAG = { freeze: '❄️ كرة التجميد', bomb: '💣 الكرة المتفجرة (قنبلة)', light: '⚡ كرة الصاعقة', slow: '🐢 كرة التباطؤ', wild: '🌈 الكرة السحرية' };
function alMsg(ws, d) {
  const u = !ws.guest && db.users[ws.key];
  if (d.t === 'al_sub') { if (!u || !u.admin) return; alSubs.add(ws); return send(ws, Object.assign({ t: 'al_init', list: ALOG.slice(-120) }, alWho())); }
  if (d.t === 'al_unsub') { alSubs.delete(ws); return; }
  if (d.t === 'al_ev') {   // فعاليات من داخل اللعبة (الكرات السحرية وغيرها)
    const now = Date.now(); if (now - (ws.alT || 0) < 1200) return; ws.alT = now; const nm = ws.guest ? ws.gname : unm(ws.key);
    if (d.k === 'magic' && own(AL_MAG, d.m)) alog('✨', nm + ' استخدم ' + AL_MAG[d.m]);
    else if (d.k === 'blast') alog('💥', nm + ' سوّى انفجار ٣ ضربات سريعة');
    else if (d.k === 'combo' && Number.isFinite(+d.n) && +d.n >= 3) alog('🔥', nm + ' سوّى كومبو ×' + Math.min(99, Math.floor(+d.n)));
  }
}

app.get('/api/friends', authMw, (req, res) => {
  const u = db.users[req.key];
  const ok = k => own(db.users, k);
  const friends = flist(u, 'friends').filter(ok).map(k => friendRow(req.key, k));
  friends.sort((a, b) => (b.online - a.online) || (b.unread - a.unread) || a.name.localeCompare(b.name));
  const pic = k => ({ name: db.users[k].name, avatar: db.users[k].avatar || '', frame: frameOf(db.users[k]) });
  res.json({ friends, inc: flist(u, 'fin').filter(ok).map(k => db.users[k].name), out: flist(u, 'fout').filter(ok).map(k => db.users[k].name), incP: flist(u, 'fin').filter(ok).map(pic), outP: flist(u, 'fout').filter(ok).map(pic) });
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
    pushTo(k, { t: 'f_update', toast: '🤝 ' + me.name + ' صار صديقك' }); return res.json({ status: 'friends', name: t.name, avatar: t.avatar || '', frame: frameOf(t) });
  }
  if (flist(t, 'fin').length >= 100) return res.status(400).json({ error: 'عنده طلبات كثيرة حالياً' });
  me.fout.push(k); flist(t, 'fin').push(req.key); save();
  pushTo(k, { t: 'f_update', toast: '👋 ' + me.name + ' يريد يضيفك صديق', req: me.name });
  res.json({ status: 'sent', name: t.name, avatar: t.avatar || '', frame: frameOf(t) });
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
  if (text) { const sp = spamBlock(req.key, text); if (sp) return res.status(429).json({ error: spamErr(sp) }); }
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
const ZLN = { 5: 32, 6: 42, 7: 46 };   // المراحل 5-7 أخف بشكل خاص
const zLevelN = l => ZLN[l] || (l > 7 ? 46 + 5 * (l - 7) : Math.round((31 + 7 * l) * 0.88 * 0.87 * 0.92));
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

/* ============ زيارة البيوت (حضور حي + إعجاب) ============ */
const hvRooms = new Map();   // مفتاح صاحب البيت -> Set(ws)
const HV_VIEWS = ['home', 'inside', 'garden', 'up'];
function hvPubM(w) { const u = db.users[w.key], h = w.hv; return { n: u.name, skin: skinOf(w.key), view: h.view, x: h.x, y: h.y, dir: h.dir, sit: h.sit }; }
function hvBc(owner, msg, except) { const set = hvRooms.get(owner); if (!set) return; const str = JSON.stringify(msg); for (const w of set) if (w !== except && w.readyState === 1) w.send(str); }
function hvLeave(ws) {
  if (!ws.hv) return; const o = ws.hv.owner, set = hvRooms.get(o), u = db.users[ws.key]; ws.hv = null;
  if (set) {
    set.delete(ws);
    if (!set.size) { hvRooms.delete(o); const ou = db.users[o]; if (ou && ou.hlog && ou.hlog.length) { ou.hlog = []; save(); } }   // آخر واحد يطلع من البيت: ينمسح سجل الشات
    else hvBc(o, { t: 'hv_leave', n: u && u.name });
  }
}
// حساب الأدمن «بابي»: كل السكنات والأثاث مفتوحة + رصيد كبير (كلمة السر محفوظة كهاش فقط)
function ensureAdmin() {
  [['بابي', '9f20292687d06a45930d194ca3474cd6', 'd4c5357e9a05f8e69460b81e093723a633761cd08734691d2cd9bd8c426835b7249d0a8bf2f64e109f26df2a3be433efcf4bb119614248990f526f7176d6fa72'],
   ['بابيتو', '0ed2cd6614832bdef4e6a8ae4ac537bd', '0788aeb480d5aba3693fcc7fe4b21d909721025294c5a5586b4e282855cd9f2f91512b6e2d5d7bac799de7cb4036c8a17e1a643d0a7a5bb154173d9193391158']].forEach(([name, salt, hash]) => {
    const k = name.toLowerCase(), u = db.users[k] || (db.users[k] = { best: 0, games: 0, bestAt: 0, created: Date.now() });
    u.name = name; u.salt = salt; u.hash = hash; u.admin = true;
    u.coins = Math.max(u.coins || 0, 9999999); u.bricks = Math.max(u.bricks || 0, 9999999);
    u.owned = [...SHOP_IDS]; u.zones = 4;
  });
  save();
}
for (const k in db.users) if (db.users[k].hlog) delete db.users[k].hlog;   // بعد إعادة تشغيل السيرفر ما يبقى سجل قديم
const hbNames = ou => (ou.hban || []).map(k => db.users[k] ? db.users[k].name : k);
function hvKickOut(owner, k, banned) {   // يطلّع اللاعب من البيت (يكدر يرجع إلا إذا محظور)
  const set = hvRooms.get(owner); if (!set) return;
  for (const w of [...set]) if (w.key === k) { send(w, { t: 'hv_kicked', banned: !!banned }); hvLeave(w); }
}
function hvOnMsg(ws, d) {
  const me = db.users[ws.key]; if (!me) return; const now = Date.now();
  if (d.t === 'hv_join') {
    const ok = keyOfName(d.owner);
    if (!own(db.users, ok)) return send(ws, { t: 'hv_err', error: 'ما لقيت البيت' });
    if (ok !== ws.key && !mutual(ws.key, ok)) return send(ws, { t: 'hv_err', error: 'البيوت للأصدقاء فقط' });
    if (ok !== ws.key && (db.users[ok].hban || []).includes(ws.key)) return send(ws, { t: 'hv_banned', error: 'صاحب البيت منعك من الدخول' });
    hvLeave(ws);
    let set = hvRooms.get(ok); if (!set) hvRooms.set(ok, set = new Set());
    if (set.size >= 8) return send(ws, { t: 'hv_err', error: 'البيت ممتلئ (8 زوار)' });
    ws.hv = { owner: ok, view: 'home', x: 160, y: 224, dir: 1, sit: false, t: 0, st: 0 };
    const members = [...set].filter(w => w.readyState === 1).map(hvPubM); set.add(ws);
    const ou = db.users[ok]; send(ws, { t: 'hv_state', owner: ou.name, members, light: ou.hlight !== false, log: (ou.hlog || []).slice(-50), bans: ok === ws.key ? hbNames(ou) : undefined });
    hvBc(ok, { t: 'hv_join', m: hvPubM(ws) }, ws);
    if (alOnce('hv:' + ws.key + '>' + ok, 120e3)) alog('🏡', ok === ws.key ? unm(ws.key) + ' دخل بيته' : unm(ws.key) + ' زار بيت ' + unm(ok));
    if (ok !== ws.key) pushTo(ok, { t: 'hv_visit', name: me.name });
  } else if (d.t === 'hv_pos') {
    const h = ws.hv; if (!h || now - h.t < 90) return; h.t = now;
    const x = Number(d.x), y = Number(d.y); if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    h.view = HV_VIEWS.includes(d.view) ? d.view : 'home'; h.x = Math.max(-200, Math.min(520, x)); h.y = Math.max(0, Math.min(330, y)); h.dir = d.dir < 0 ? -1 : 1; h.sit = !!d.sit;
    hvBc(h.owner, { t: 'hv_pos', n: me.name, view: h.view, x: h.x, y: h.y, dir: h.dir, sit: h.sit }, ws);
  } else if (d.t === 'hv_say') {
    const h = ws.hv; if (!h || now - h.st < 800) return; h.st = now;
    const kind = d.kind === 'dog' || d.kind === 'cat' || d.kind === 'mouse' ? d.kind : 'fish';
    const txt = kind === 'mouse' ? 'جيك جيك! 🐭 أهلاً ' + me.name + '!' : kind === 'dog' ? 'هاو هاو! 🐶 أهلاً ' + me.name + '!' : kind === 'cat' ? 'مياو~ 💕 أهلاً ' + me.name + '!' : 'بلوب بلوب 🫧 أهلاً ' + me.name + '!';
    hvBc(h.owner, { t: 'hv_say', n: me.name, slot: 'pet', kind, txt }, ws);
  } else if (d.t === 'hv_chat') {   // شات داخل البيت (يطلع فوق الراس + سجل محفوظ لصاحب البيت)
    const h = ws.hv; if (!h || now - (h.ct || 0) < 600) return; h.ct = now;
    let txt = String(d.txt || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 120); if (!txt) return; if (!isAdmKey(ws)) txt = profMask(txt);
    { const sp = spamBlock(ws.key, txt); if (sp) return send(ws, { t: 'rm_err', error: spamErr(sp) }); }
    const ou = db.users[h.owner]; ou.hlog = Array.isArray(ou.hlog) ? ou.hlog : []; const m = { n: me.name, txt, ts: now };
    ou.hlog.push(m); while (ou.hlog.length > 100) ou.hlog.shift(); save();
    hvBc(h.owner, { t: 'hv_chat', m });
  } else if (d.t === 'hv_light') {   // الضوء مشترك: أي واحد بالبيت يطفي/يشغل والكل يشوف
    const h = ws.hv; if (!h || now - (h.lt || 0) < 400) return; h.lt = now;
    const ou = db.users[h.owner]; ou.hlight = !!d.on; save();
    hvBc(h.owner, { t: 'hv_light', on: ou.hlight, n: me.name });
  } else if (d.t === 'hv_clear') {   // صاحب البيت فقط يمسح سجل الشات للجميع
    const h = ws.hv; if (!h || h.owner !== ws.key) return send(ws, { t: 'hv_err', error: 'بس صاحب البيت يكدر يحذف السجل' });
    const ou = db.users[h.owner]; ou.hlog = []; save(); hvBc(h.owner, { t: 'hv_clear', n: me.name });
  } else if (d.t === 'hv_kick' || d.t === 'hv_ban' || d.t === 'hv_unban') {   // صاحب البيت فقط
    const h = ws.hv; if (!h || h.owner !== ws.key) return send(ws, { t: 'hv_err', error: 'بس صاحب البيت يكدر يسوي هذا' });
    const k = keyOfName(d.n); if (!own(db.users, k) || k === ws.key) return;
    const ou = db.users[ws.key]; ou.hban = ou.hban || [];
    if (d.t === 'hv_kick') hvKickOut(ws.key, k, false);
    else if (d.t === 'hv_ban') { if (!ou.hban.includes(k)) ou.hban.push(k); save(); hvKickOut(ws.key, k, true); }
    else { ou.hban = ou.hban.filter(x => x !== k); save(); }
    send(ws, { t: 'hv_bans', bans: hbNames(ou), n: db.users[k].name, act: d.t });
  } else if (d.t === 'hv_leave') hvLeave(ws);
}

/* ============ نظام الغرف: أماكن ساحلية واسعة (15 غرفة كحد أعلى، 15 شخص لكل غرفة) ============ */
const RM_MAX = 15, RM_CAP = 15, rmRooms = new Map();   // id -> {id,name,owner,code,created,mem:Set(ws),bans:Set,log:[],emptyAt}
let rmSeq = 1;
const RM_TTL = 24 * 3600e3;   // غرفة ما دخلها أحد أكثر من يوم تنحذف تلقائياً
function rmPersist() { db.hrooms = {}; for (const r of rmRooms.values()) db.hrooms[r.id] = { id: r.id, name: r.name, owner: r.owner, code: r.code, created: r.created, lastActive: r.mem.size ? Date.now() : (r.lastActive || r.created), bans: [...r.bans], banNm: [...(r.banNm || new Map())], perm: !!r.perm, mods: [...(r.mods || [])] }; save(); }
function rmLoad() { const H = db.hrooms || {}; for (const id in H) { const x = H[id]; if (!x || !db.users[x.owner]) continue; rmRooms.set(id, { id, name: x.name, owner: x.owner, code: x.code || '', created: x.created || Date.now(), lastActive: x.lastActive || Date.now(), mem: new Set(), bans: new Set(x.bans || []), banNm: new Map(x.banNm || []), mods: new Set(x.mods || []), log: [] }); rmSeq = Math.max(rmSeq, (parseInt(String(id).slice(1)) || 0) + 1); } rmEnsurePerm(); rmClean(); }
// الغرفة الدائمة «بابي»: ما تنحذف ابداً، 50 شخص، مفتوحة للجميع (حتى الضيوف)، صاحبها الادمن بابي
function rmEnsurePerm() {
  let r = rmRooms.get('babi'); const ok = 'بابي'.toLowerCase();
  if (!r) { r = { id: 'babi', created: Date.now(), lastActive: Date.now(), mem: new Set(), bans: new Set(), banNm: new Map(), mods: new Set(), log: [] }; rmRooms.set('babi', r); }
  r.perm = true; r.cap = 50; r.name = 'بابي'; r.owner = ok; r.code = ''; if (!r.banNm) r.banNm = new Map(); if (!r.mods) r.mods = new Set();
}
function rmClean() { let ch = false; for (const r of [...rmRooms.values()]) if (!r.perm && !r.mem.size && Date.now() - (r.lastActive || r.created) > RM_TTL) { rmRooms.delete(r.id); ch = true; } if (ch) rmPersist(); }
const rmIsOwner = (r, key) => r.owner === key || !!(db.users[key] && db.users[key].admin);
/* ====== فلتر الألفاظ النابية (للأعضاء فقط، المشرفون معفيون) ====== */
const PROF_N = s => String(s || '').toLowerCase().replace(/[\u064b-\u065f\u0670\u0640\u200c\u200d]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/(.)\1+/g, '$1');
const PROF_TOK = new RegExp('^[وف]?(?:كس|زب|عير|نيك|ناك|طيز|خرا|نيج|انيك|انيج|ينيك|تنيك|خول|عرص|dick|sex|سكس)(?:ي|ك|ه|ها|هم|كم|نا|ات)?$');
const PROF_CMP = ['كسمك', 'كسخت', 'كسام', 'قحب', 'شرموط', 'منيو', 'ديوث', 'متناك', 'عاهر', 'ابنالكلب', 'ابنالقحب', 'ابنالزاني', 'كحب', 'عرصه', 'fuck', 'shit', 'bitch', 'ashole', 'pusy', 'cunt', 'whore', 'niga', 'niger'];
function profane(s) { const n = PROF_N(s); if (!n) return false; const toks = n.split(/[^\u0600-\u06ffa-z0-9]+/).filter(Boolean); if (toks.some(x => PROF_TOK.test(x))) return true; const cmp = toks.join(''); return PROF_CMP.some(w => cmp.includes(w)); }
const isAdmKey = w => { const u = !w.guest && db.users[w.key]; return !!(u && u.admin); };
const stars = w => '*'.repeat(Math.max(2, w.length));
function profMask(s) {
  let o = String(s).replace(/[\u0600-\u06ffA-Za-z0-9]+/g, w => profane(w) ? stars(w) : w);
  o = o.replace(/(?:ابن|ولد|بنت)\s+(?:ال)?(?:كلب|قحب[ةه]|زاني[ةه]?)/g, m => stars(m.replace(/\s+/g, '')));
  o = o.replace(/(?:^|[^\u0600-\u06ffA-Za-z0-9])((?:[\u0600-\u06ffA-Za-z][\s.\-_*]+){2,}[\u0600-\u06ffA-Za-z])(?![\u0600-\u06ffA-Za-z0-9])/g, (m, run) => profane(run.replace(/[\s.\-_*]+/g, '')) ? m.replace(run, stars(run.replace(/\s+/g, ''))) : m);
  return o;
}
function rmProf(ws, r, h, now) { h.pf = (h.pf || 0) + 1; if (h.pf >= 3) { h.pf = 0; r.mutes = r.mutes || new Map(); r.mutes.set(rmMuteKey(ws), now + 300000); rmSlog(r, 'النظام', 'كتم تلقائي ' + rmNm(ws) + ' 5 د (ألفاظ نابية)'); return send(ws, { t: 'rm_err', error: '🔇 كتمك النظام 5 دقايق لتكرار الألفاظ النابية' }); } send(ws, { t: 'rm_err', error: '🚫 ممنوع الألفاظ النابية (' + h.pf + '/3 ثم كتم)' }); }
const BGD = 3 * 3600e3;
function rmStat(r, now) { const day = new Date(now + BGD).toISOString().slice(0, 10); let s = r.stat; if (!s || s.day !== day) s = r.stat = { day, joins: 0, uniq: new Set(), peak: 0, msgs: 0, games: 0, hrs: new Array(24).fill(0) }; return s; }
const rmMuteKey = w => w.guest ? 'ip:' + w.ip : w.key;
function rmMuted(r, w, now) { const u = r.mutes && r.mutes.get(rmMuteKey(w)); if (!u) return 0; if (u <= now) { r.mutes.delete(rmMuteKey(w)); return 0; } return Math.ceil((u - now) / 60000); }
function rmSlog(r, who, act) { alog('🛡️', '«' + r.name + '» ' + who + ': ' + act); const e = { ts: Date.now(), who, act }; (r.slog = r.slog || []).push(e); while (r.slog.length > 60) r.slog.shift(); for (const w of r.mem) if (rmStaff(r, w)) send(w, { t: 'rm_slog_add', e }); }
const rmCanMod = (r, key) => rmIsOwner(r, key) || !!(r.mods && r.mods.has(key));
const rmModNames = r => [...(r.mods || [])].map(k => db.users[k] ? db.users[k].name : k);
const rmNm = w => w.guest ? w.gname : (db.users[w.key] ? db.users[w.key].name : '؟');
const rmAdm = w => { const u = !w.guest && db.users[w.key]; return u && u.admin ? (u.name === 'بابي' ? 1 : 2) : 0; };   // 1 = بابي (تاج ذهبي)، 2 = بابيتو (تاج ملكي أزرق)
const rmBanNm = (r, k) => (r.banNm && r.banNm.get(k)) || (db.users[k] ? db.users[k].name : k);
const rmPub = r => ({ id: r.id, name: r.name, owner: db.users[r.owner] ? db.users[r.owner].name : '؟', locked: !!r.code, count: new Set([...r.mem].filter(w => !(w.rm && w.rm.hid)).map(w => w.key)).size, cap: r.cap || RM_CAP, perm: !!r.perm });

/* ---------- طاولات الالعاب (سلم وثعبان / إكس أو / منقلة / دومينو) ---------- */
const GM_TB = [{ x: 925, y: 345, k: 'snake' }, { x: 1100, y: 345, k: 'xo' }, { x: 925, y: 525, k: 'rps' }, { x: 1100, y: 525, k: 'domino' }];   // منطقة الألعاب بالجهة اليمنى: 2 يسار و 2 يمين
const RM_LUDO = { x: 1012, y: 435, seats: [[-56, 11], [0, 50], [56, 11], [0, -16]] };   // طاولة غوكو: كرسي لكل لون (أحمر يسار، أخضر فوق، أصفر يمين، أزرق تحت)
const GM_L = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 }, GM_S = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78 };
const GM_XL = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const gmNew = tb => ({ tb, k: GM_TB[tb].k, p: [null, null], ph: 'idle', rd: [0, 0], turn: 0, msg: '', seq: 0, win: -1, rt: [0, 0] });
const gmT = (r, tb) => { r.gms = r.gms || {}; return r.gms[tb] || (r.gms[tb] = gmNew(tb)); };
function gmPub(r, g) {
  const o = { tb: g.tb, k: g.k, n: g.p.map(w => w ? rmNm(w) : ''), ph: g.ph, rd: g.rd, turn: g.turn, win: g.win, msg: g.msg, seq: g.seq };
  if (g.k === 'snake') { o.fr = g.fr; o.pos = g.pos; o.die = g.die; o.last = g.last; }
  else if (g.k === 'xo') { o.b = g.b; o.line = g.line || null; }
  else if (g.k === 'rps') { o.sc = g.sc; o.pk = (g.pick || [null, null]).map(x => !!x); o.rv = g.rv || null; o.rn = g.rn || 1; }
  else { o.chain = g.chain; o.cnt = g.hand ? [g.hand[0].length, g.hand[1].length] : [0, 0]; o.yard = g.yard ? g.yard.length : 0; }
  return o;
}
function gmBc(r, g) { g.seq++; rmBc(r, { t: 'rm_g', g: gmPub(r, g) }); if (g.k === 'domino' && g.hand) [0, 1].forEach(i => { if (g.p[i] && g.p[i].readyState === 1) send(g.p[i], { t: 'rm_gh', tb: g.tb, hand: g.hand[i] }); }); }
function gmReset(r, tb) { const g = gmT(r, tb); if (g.timer) clearTimeout(g.timer); r.gms[tb] = gmNew(tb); }
function gmOver(r, g, win, msg) { try { rmStat(r, Date.now()).games++; } catch (e) {}  g.ph = 'over'; g.win = win; g.msg = msg || ''; gmBc(r, g); g.timer = setTimeout(() => { const ps = g.p.slice(), tb = g.tb; gmReset(r, tb); for (const w of ps) if (w && w.readyState === 1) send(w, { t: 'rm_gend', tb }); gmBc(r, gmT(r, tb)); }, 4800); }
function gmLeave(r, ws) {
  if (!r.gms) return; for (const g of Object.values(r.gms)) {
    const i = g.p.indexOf(ws); if (i < 0) continue; g.p[i] = null; const o = g.p[1 - i]; if (g.ph === 'over') continue;
    if ((g.ph === 'first' || g.ph === 'play') && o) { gmOver(r, g, 1 - i, 'الخصم غادر المقعد'); continue; }
    const k = g.k, tb = g.tb, ps = g.p.slice(); gmReset(r, tb); const ng = gmT(r, tb); ng.p = ps; gmBc(r, ng);
  }
}
const gmRnd = n => Math.floor(Math.random() * n);
const GM_NAME = { snake: 'سلم وثعبان', xo: 'إكس أو', rps: 'حجرة ورقة مقص', domino: 'دومينو' };
function gmStart(r, g) {
  g.rd = [1, 1]; g.msg = ''; g.win = -1;
  try { alog('🎲', rmNm(g.p[0]) + ' و ' + rmNm(g.p[1]) + ' بدوا لعبة ' + (GM_NAME[g.k] || g.k) + ' بغرفة «' + r.name + '»'); } catch (e) {}
  if (g.k === 'snake') { g.ph = 'first'; g.fr = [0, 0]; g.pos = [1, 1]; g.die = 0; g.last = null; return; }
  g.ph = 'play'; g.turn = gmRnd(2); const who = rmNm(g.p[g.turn]);
  if (g.k === 'xo') { g.b = Array(9).fill(''); g.line = null; g.msg = '🎲 القرعة: ' + who + ' يبدأ (X)'; }
  else if (g.k === 'rps') { g.sc = [0, 0]; g.pick = [null, null]; g.rv = null; g.rn = 1; g.msg = 'كل واحد يختار بالسر — أول واحد يوصل 3 يفوز'; }
  else { const T = []; for (let i = 0; i <= 6; i++) for (let j = i; j <= 6; j++) T.push([i, j]); for (let i = T.length - 1; i > 0; i--) { const j = gmRnd(i + 1); [T[i], T[j]] = [T[j], T[i]]; } g.hand = [T.slice(0, 7), T.slice(7, 14)]; g.yard = T.slice(14); g.chain = []; g.pass = 0; g.msg = '🎲 القرعة: ' + who + ' يبدأ'; }
}
function dmEnds(g) { return g.chain.length ? [g.chain[0][0], g.chain[g.chain.length - 1][1]] : null; }
function dmCan(g, side) { const e = dmEnds(g); if (!e) return true; return g.hand[side].some(t => t.includes(e[0]) || t.includes(e[1])); }
function gmAct(r, g, me, a, now) {
  if (g.ph === 'first' && g.k === 'snake') { if (a.a !== 'roll' || g.fr[me]) return; g.fr[me] = 1 + gmRnd(6); if (g.fr[0] && g.fr[1]) { if (g.fr[0] === g.fr[1]) { g.msg = '🤝 تعادل! ارميا من جديد'; g.fr = [0, 0]; } else { g.turn = g.fr[0] > g.fr[1] ? 0 : 1; g.ph = 'play'; g.pos = [1, 1]; g.die = 0; g.msg = '🎲 ' + rmNm(g.p[g.turn]) + ' يبدأ أولاً'; } } return gmBc(r, g); }
  if (g.k === 'rps') {   // حجرة ورقة مقص: الاثنين يختارون بنفس الوقت وبالسر، وبعدين ينكشف الاختيار
    if (g.ph !== 'play' || a.a !== 'pick' || g.pick[me]) return; const ch = ['r', 'p', 's'].includes(a.c) ? a.c : null; if (!ch) return; g.pick[me] = ch; g.msg = '';
    if (g.pick[0] && g.pick[1]) { const x = g.pick[0], y = g.pick[1], beat = { r: 's', p: 'r', s: 'p' }; const w = x === y ? -1 : beat[x] === y ? 0 : 1; if (w >= 0) g.sc[w]++; g.rv = { c: [x, y], w, n: g.rn }; g.pick = [null, null]; g.rn++;
      g.msg = w < 0 ? '🤝 تعادل بهالجولة' : '✅ ' + rmNm(g.p[w]) + ' فاز بالجولة'; if (g.sc[0] >= 3 || g.sc[1] >= 3) { gmBc(r, g); return gmOver(r, g, g.sc[0] >= 3 ? 0 : 1, g.sc[0] + ' : ' + g.sc[1]); } }
    return gmBc(r, g);
  }
  if (g.ph !== 'play' || g.turn !== me) return;
  if (g.k === 'snake') {
    if (a.a !== 'roll') return; const die = 1 + gmRnd(6), from = g.pos[me]; let land = from + die, to = land, note = ''; if (land > 100) { land = from; to = from; note = 'تحتاج رقم أصغر'; } else if (GM_L[land]) { to = GM_L[land]; note = '🪜 سلم!'; } else if (GM_S[land]) { to = GM_S[land]; note = '🐍 ثعبان!'; }
    g.pos[me] = to; g.die = die; g.last = { side: me, from, die, land, to }; g.msg = note; if (to === 100) return (gmBc(r, g), gmOver(r, g, me, '')); g.turn = 1 - me; return gmBc(r, g);
  }
  if (g.k === 'xo') {
    if (a.a !== 'put') return; const i = a.i | 0; if (i < 0 || i > 8 || g.b[i]) return; g.b[i] = me ? 'O' : 'X'; g.msg = '';
    const ln = GM_XL.find(L => g.b[L[0]] && g.b[L[0]] === g.b[L[1]] && g.b[L[0]] === g.b[L[2]]); if (ln) { g.line = ln; return (gmBc(r, g), gmOver(r, g, me, '')); }
    if (g.b.every(x => x)) return (gmBc(r, g), gmOver(r, g, -2, 'تعادل')); g.turn = 1 - me; return gmBc(r, g);
  }
  if (g.k === 'mancala') {
    if (a.a !== 'pit') return; const c = a.i | 0; if (c < 0 || c > 5) return; const idx = me * 7 + c, P = g.pits; if (!P[idx]) return;
    let n = P[idx], pos = idx; P[idx] = 0; const opp = me ? 6 : 13, own = me ? 13 : 6; while (n > 0) { pos = (pos + 1) % 14; if (pos === opp) continue; P[pos]++; n--; } g.last = pos; g.msg = '';
    let again = false; if (pos === own) { again = true; g.msg = '🔁 دور إضافي!'; } else if (pos >= me * 7 && pos <= me * 7 + 5 && P[pos] === 1 && P[12 - pos] > 0) { P[own] += P[12 - pos] + 1; P[pos] = 0; P[12 - pos] = 0; g.msg = '🍽️ أكلت حجارة الخصم!'; }
    const e0 = P.slice(0, 6).every(x => !x), e1 = P.slice(7, 13).every(x => !x);
    if (e0 || e1) { for (let i = 0; i < 6; i++) { P[6] += P[i]; P[i] = 0; P[13] += P[7 + i]; P[7 + i] = 0; } gmBc(r, g); return gmOver(r, g, P[6] === P[13] ? -2 : P[6] > P[13] ? 0 : 1, P[6] + ' : ' + P[13]); }
    if (!again) g.turn = 1 - me; return gmBc(r, g);
  }
  if (g.k === 'domino') {
    const H = g.hand[me];
    if (a.a === 'draw') { if (dmCan(g, me) || !g.yard.length) return; H.push(g.yard.pop()); g.msg = ''; return gmBc(r, g); }
    if (a.a === 'pass') { if (dmCan(g, me) || g.yard.length) return; g.pass++; g.msg = 'مرّر'; if (g.pass >= 2) { const s = H => H.reduce((x, t) => x + t[0] + t[1], 0), a0 = s(g.hand[0]), a1 = s(g.hand[1]); gmBc(r, g); return gmOver(r, g, a0 === a1 ? -2 : a0 < a1 ? 0 : 1, 'اللعبة مغلقة: ' + a0 + ' مقابل ' + a1); } g.turn = 1 - me; return gmBc(r, g); }
    if (a.a !== 'play') return; const ti = a.t | 0, t = H[ti]; if (!t) return; const e = dmEnds(g); let side = a.e === 'L' ? 'L' : 'R', nt = null;
    if (!e) nt = [t[0], t[1]]; else if (side === 'L') { if (t[1] === e[0]) nt = [t[0], t[1]]; else if (t[0] === e[0]) nt = [t[1], t[0]]; } else { if (t[0] === e[1]) nt = [t[0], t[1]]; else if (t[1] === e[1]) nt = [t[1], t[0]]; }
    if (!nt) return; H.splice(ti, 1); if (side === 'L' && e) g.chain.unshift(nt); else g.chain.push(nt); g.pass = 0; g.msg = '';
    if (!H.length) { gmBc(r, g); return gmOver(r, g, me, ''); } g.turn = 1 - me; return gmBc(r, g);
  }
}
const WX_CYC = 3600;   // دورة ساعة: كل 30 دقيقة مطر أو ثلج (دقيقة وحدة)، والليل دقيقة بالنص
function wxNow(r, now) { const c = r.wxc || (r.wxc = { base: 0, ref: Date.now(), spd: 1 }); now = now || Date.now(); return { el: ((c.base + (now - c.ref) / 1000 * c.spd) % WX_CYC + WX_CYC) % WX_CYC, spd: c.spd }; }
const rmStaff = (r, w) => !!(rmAdm(w) || (r && r.mods && r.mods.has(w.key)));
function rmBcV(r, msg, sender) { const str = JSON.stringify(msg), hid = sender && sender.rm && sender.rm.hid; for (const w of r.mem) if (w !== sender && w.readyState === 1 && (!hid || rmStaff(r, w))) w.send(str); }
function rmBc(r, msg, except) { const str = JSON.stringify(msg); for (const w of r.mem) if (w !== except && w.readyState === 1) w.send(str); }

/* ===== شخصيات المنتجع (انمي): تنظيف ما يرسله اللاعب ===== */
const AV_ADMHS = ['a_gold','a_flame','a_stripe','a_bigpomp','a_streak','a_laurel','a_horns','a_tall','a_royalcurl','a_star','b_wolf','b_lion','b_dread','b_royalpony','b_fall','b_wave','b_warrior','b_laurel','b_rcurl','b_knot'];
const AV_HS = { f: ['long','longb','wavy','wavys','xlong','bob','bobs','shoulder','pixie','pixiebang','twin','twinbun','bun','pony','lowpony','sidepony','braid','twobraid','curly','afro','bowl','band','flower','halfup','sidebraid','bunlong','bobbow','curlybang','pixieband','wavyribbon'], m: ['short','sweep','undercut','curly','spiky','buzz','pomp','mohawk','afro','manbun','long','mid','slick','curtain','messy','fade','pony','fringe','quiff','emo','wavy','samurai','spikelong','bowlcut','sidepart','sweepL','flattop','twists','bald','curlylong','a_gold','a_flame','a_stripe','a_bigpomp','a_streak','a_laurel','a_horns','a_tall','a_royalcurl','a_star','b_wolf','b_lion','b_dread','b_royalpony','b_fall','b_wave','b_warrior','b_laurel','b_rcurl','b_knot'] }, AV_HC = ['black','dbrown','brown','chest','auburn','ginger','blonde','platinum','white','grey','red','burgundy','pink','hotpink','purple','lavender','blue','navy','teal','mint','green','orange','gold','galaxy','fire','ice','rainbow','rose'], AV_ADMHC = ['gold', 'galaxy', 'fire', 'ice', 'rainbow', 'rose'], AV_SK = ['porcelain','fair','light','peach','tan','olive','brown','dark','deep'];
const AV_TP = { f: ['tee','tank','crop','hoodie','long','blouse','sweater','polo','shirt'], m: ['tee','hoodie','long','polo','shirt','sweater','tank'] }, AV_BT = { f: ['jeans','shorts','skirt','pleat','lskirt','track'], m: ['jeans','shorts','track'] };
function avClean(a, adm) {
  if (!a || typeof a !== 'object') return null; const g = a.g === 'm' ? 'm' : 'f', n = (v, lo, hi, d) => { v = Number(v); return Number.isInteger(v) && v >= lo && v <= hi ? v : d; }, hx = (v, d) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)) ? v.toLowerCase() : d, mk = Array.isArray(a.mk) ? a.mk : [];
  return { g, hs: AV_HS[g].includes(a.hs) ? a.hs : AV_HS[g][0], hc: AV_HC.includes(a.hc) ? a.hc : hx(a.hc, 'brown'), sk: AV_SK.includes(a.sk) ? a.sk : 'light', ps: 0, ey: n(a.ey, 0, 17, 0), es: n(a.es, 0, 5, 0), esp: n(a.esp, 0, 2, 1), wg: n(a.wg, 0, 6, 0), cr: n(a.cr, 0, 9, 0), ew: n(a.ew, 0, 2, 1), br: n(a.br, 0, 9, 0), mo: n(a.mo, 0, 9, 0), nz: n(a.nz, 0, 5, 0), er: n(a.er, 0, 2, 0), fs: n(a.fs, 0, 4, 0), dc: n(a.dc, 0, 9, 0), bd: n(a.bd, 0, 2, 1), ht: n(a.ht, 0, 2, 1), bear: g === 'm' ? n(a.bear, 0, 4, 0) : 0,
    mk: g === 'f' ? [n(mk[0], 0, 23, 0), n(mk[1], 0, 23, 0), n(mk[2], 0, 11, 0), n(mk[3], 0, 5, 0), n(mk[4], 0, 3, 0), n(mk[5], 0, 5, 0)] : [0, 0, 0, 0, 0, 0],
    tp: AV_TP[g].includes(a.tp) ? a.tp : 'tee', bt: AV_BT[g].includes(a.bt) ? a.bt : 'jeans', tc: hx(a.tc, '#b83a52'), bc: hx(a.bc, '#2f5fb0'), sc: hx(a.sc, '#ffffff'), pt: n(a.pt, 0, 7, 0),
    o: (typeof a.o === 'string' && /^[fm]_[a-z]{3}[0-9]{1,2}$/.test(a.o) && a.o[0] === g) ? a.o : '' };
}
function avClean2(a, adm) { const v = avClean(a); if (!v) return v; if (!adm) { if (AV_ADMHS.includes(v.hs)) v.hs = 'short'; if (AV_ADMHC.includes(v.hc)) v.hc = 'brown'; if (v.ey > 13) v.ey = 0; v.wg = 0; v.cr = 0; if (v.o.slice(2, 5) === 'adm') v.o = ''; } return v; }
function rmPubM(w) { const h = w.rm; return { n: rmNm(w), skin: w.guest ? 'classic' : skinOf(w.key), x: h.x, y: h.y, dir: h.dir, sit: h.sit, own: w.key === h.owner, g: w.guest ? 1 : 0, av: w.guest ? (w.av || null) : ((db.users[w.key] && db.users[w.key].av) || null), emo: (w.rm && w.rm.emo) || 0, umb: (w.rm && w.rm.umb === 0) ? 0 : 1, bal: (w.rm && w.rm.bal) || '', pet: (w.rm && w.rm.pet) || '', wear: (w.rm && w.rm.wear) || {}, hid: (w.rm && w.rm.hid) ? 1 : 0, adm: rmAdm(w), mod: !!(rmRooms.get(h.id) && rmRooms.get(h.id).mods.has(w.key)) }; }
function rmLeave(ws) {
  if (!ws.rm) return; const r = rmRooms.get(ws.rm.id), nm = rmNm(ws), hp = ws.rm.hold || ws.rm.heldBy; ws.rm = null; if (!r) return;
  if (hp) { for (const w of r.mem) if (w.rm && rmNm(w) === hp) { w.rm.hold = w.rm.heldBy = null; } rmBc(r, { t: 'rm_hold', a: nm, b: hp, on: 0 }); }
  try { gmLeave(r, ws); } catch (e) {} try { LUDO.leaveTable(ws); } catch (e) {} r.mem.delete(ws); if (![...r.mem].some(w => w.key === ws.key)) { rmBc(r, { t: 'rm_leave', n: nm }); alog('🚪', nm + ' طلع من غرفة «' + r.name + '»'); }
  r.lastActive = Date.now(); if (!ws.guest) rmPersist();
}
function rmCloseRoom(r, why) { for (const w of [...r.mem]) { send(w, { t: 'rm_closed', txt: why || 'صاحب الغرفة سكّر الغرفة' }); w.rm = null; } r.mem.clear(); rmRooms.delete(r.id); rmPersist(); }
setInterval(rmClean, 10 * 60e3);
/* ===== عداد ساعات التواجد بالمنتجع + طلبات العضوية المميزة ===== */
const VIP_TOTAL_H = 500, VIP_DAY_H = 8;
const rmDayKey = t => new Date((t || Date.now()) + BGD).toISOString().slice(0, 10);
function rmTimeOf(u) {
  const days = u.rmDays || {}, today = days[rmDayKey()] || 0; let d8 = 0; for (let i = 0; i < 7; i++) { if ((days[rmDayKey(Date.now() - i * 864e5)] || 0) >= VIP_DAY_H * 3600) d8++; }
  return { total: u.rmSec || 0, today, d8 };
}
setInterval(() => {   // كل دقيقة: نضيف دقيقة لكل عضو موجود بالمنتجع
  const seen = new Set(), dk = rmDayKey(); let ch = false;
  for (const r of rmRooms.values()) for (const w of r.mem) { if (w.guest || w.readyState !== 1 || seen.has(w.key)) continue; seen.add(w.key); const u = db.users[w.key]; if (!u) continue;
    u.rmSec = (u.rmSec || 0) + 60; const D = u.rmDays || (u.rmDays = {}); D[dk] = (D[dk] || 0) + 60; const ks = Object.keys(D); if (ks.length > 14) ks.sort().slice(0, ks.length - 14).forEach(k => delete D[k]); ch = true; }
  if (ch) save();
}, 60e3);
const vipReqs = () => Array.isArray(db.vipReq) ? db.vipReq : (db.vipReq = []);
const vipPub = q => { const u = db.users[q.k]; const tm = u ? rmTimeOf(u) : { total: 0, today: 0, d8: 0 }; const rr = rmRooms.get(q.room); return { id: q.id, n: q.n, room: rr ? rr.name : q.room, ts: q.ts, tot0: q.tot0 || 0, day0: q.day0 || 0, total: tm.total, today: tm.today, d8: tm.d8, need: { total: VIP_TOTAL_H, day: VIP_DAY_H } }; };
function vipNotifyAdmins(msg) { const str = JSON.stringify(msg); for (const w of wss.clients) if (w.readyState === 1 && !w.guest && db.users[w.key] && db.users[w.key].admin) w.send(str); }
const rmSorted = () => [...rmRooms.values()].sort((a, b) => (b.perm ? 1 : 0) - (a.perm ? 1 : 0));
app.get('/api/rooms', authMw, (req, res) => { res.json({ rooms: rmSorted().map(rmPub), max: RM_MAX, mine: ([...rmRooms.values()].find(r => !r.perm && r.owner === req.key) || {}).id || '' }); });
app.get('/api/rooms/public', (req, res) => { res.json({ rooms: rmSorted().filter(r => r.perm).map(rmPub), max: RM_MAX, mine: '' }); });
app.post('/api/rooms/create', authMw, (req, res) => {
  if (limited('rmc:' + req.key, 6, 600e3)) return res.status(429).json({ error: 'محاولات كثيرة، جرب بعد شوي' });
  const name = String((req.body && req.body.name) || '').trim().replace(/\s+/g, ' ').slice(0, 24);
  if (name.length < 2 || !/^[\p{L}\p{N}_.\- ]+$/u.test(name)) return res.status(400).json({ error: 'اسم الغرفة 2-24 حرف (حروف وأرقام ومسافة فقط)' });
  const code = String((req.body && req.body.code) || '').trim().slice(0, 12);
  if (code && !/^[A-Za-z0-9٠-٩]{3,12}$/.test(code)) return res.status(400).json({ error: 'الرمز 3-12 حرف أو رقم إنكليزي' });
  if ([...rmRooms.values()].some(r => !r.perm && r.owner === req.key)) return res.status(400).json({ error: 'عندك غرفة مفتوحة بالفعل، سكّرها أول' });
  if ([...rmRooms.values()].filter(r => !r.perm).length >= RM_MAX) return res.status(400).json({ error: 'وصلنا الحد الأعلى (' + RM_MAX + ' غرفة)، انتظر وحدة تنسكّر' });
  const r = { id: 'r' + (rmSeq++), name, owner: req.key, code, created: Date.now(), lastActive: Date.now(), mem: new Set(), bans: new Set(), mods: new Set(), log: [] };
  rmRooms.set(r.id, r); rmPersist(); res.json({ room: rmPub(r) });
});
app.post('/api/rooms/close', authMw, (req, res) => {
  const r = rmRooms.get(String((req.body && req.body.id) || '')); if (!r) return res.status(404).json({ error: 'الغرفة غير موجودة' });
  if (r.perm) return res.status(403).json({ error: 'هذي غرفة دائمة ما تنسكّر' });
  if (!rmIsOwner(r, req.key)) return res.status(403).json({ error: 'بس صاحب الغرفة' });
  rmCloseRoom(r); res.json({ ok: true });
});
const RM_BAL_P = { red: 10, blue: 10, green: 10, purple: 10, heart: 20, star: 20, smile: 20, moon: 20, cat: 20, bear: 20, rainbow: 30, crown: 30, gold: 30, diamond: 30, sun: 40, panda: 40, ice: 40, fire: 40, galaxy: 50, planet: 50, disco: 50, neon: 50, heartgold: 60, stargold: 60, unicorn: 70, dragon: 70, rbsh: 80 };
['iq', 'sa', 'eg', 'sy', 'jo', 'lb', 'ps', 'kw', 'ae', 'qa', 'bh', 'om', 'ye', 'ly', 'tn', 'dz', 'ma', 'mr', 'sd', 'so', 'dj', 'km'].forEach(f => { RM_BAL_P['f_' + f] = 0; });   // أعلام الدول العربية مجاناً
const RM_PET_P = {}; ['cat_b', 'cat_w', 'dog_b', 'dog_w', 'cat_o', 'dog_g', 'bunny', 'bunny_g', 'ham', 'fox', 'panda', 'chick', 'duck', 'peng', 'parrot', 'turtle'].forEach(k => { RM_PET_P[k] = 40; });   // حيوانات محل غمازة
const RM_WEAR_P = { h_cap: ['hat', 30], h_beanie: ['hat', 30], h_party: ['hat', 30], h_cowboy: ['hat', 40], h_flower: ['hat', 40], h_chef: ['hat', 40], h_witch: ['hat', 50], h_crown: ['hat', 60], e_sun: ['eye', 30], e_nerd: ['eye', 30], e_heart: ['eye', 40], e_star: ['eye', 40], b_cape: ['back', 50], b_bat: ['back', 50], b_bfly: ['back', 60], b_angel: ['back', 60], h_bunny: ['hat', 35], h_catears: ['hat', 35], h_devil: ['hat', 35], h_bow: ['hat', 35], h_phones: ['hat', 45], h_santa: ['hat', 45], h_grad: ['hat', 50], h_top: ['hat', 55], e_3d: ['eye', 35], e_rainbow: ['eye', 45], e_ski: ['eye', 45], e_mono: ['eye', 50], b_rcape: ['back', 60], b_jet: ['back', 65], b_fairy: ['back', 70], b_dragon: ['back', 70], n_bow: ['neck', 30], n_scarf: ['neck', 35], n_medal: ['neck', 45], n_heart: ['neck', 55] };   // أزياء محل ربشاتي
const rmWearClean = w => { const o = {}; if (w && typeof w === 'object') ['hat', 'eye', 'back', 'neck'].forEach(sl => { const k = w[sl]; if (k && RM_WEAR_P[k] && RM_WEAR_P[k][0] === sl) o[sl] = k; }); return o; };
function rmOnMsg(ws, d) {
  const me = ws.guest ? { name: ws.gname } : db.users[ws.key]; if (!me) return; const now = Date.now();
  if (d.t === 'rm_join') {
    const r = rmRooms.get(String(d.id || '')); if (!r) return send(ws, { t: 'rm_err', fatal: true, error: 'الغرفة غير موجودة أو انسكّرت' });
    if (ws.guest && !r.perm) return send(ws, { t: 'rm_err', fatal: true, error: 'سجّل حساب حتى تدخل هذي الغرفة' });
    const owner = rmIsOwner(r, ws.key);
    if (r.bans.has(ws.key) || (ws.guest && r.bans.has('ip:' + ws.ip))) return send(ws, { t: 'rm_err', fatal: true, error: '⛔ صاحب الغرفة منعك من دخولها' });
    if (r.code && !owner && !safeEq(String(d.code || ''), r.code)) return send(ws, { t: 'rm_err', fatal: true, bad: true, error: 'الرمز غلط' });
    if (ws.guest && d.av) ws.av = avClean2(d.av, 0);
    if (ws.rm && ws.rm.id === r.id) rmLeave(ws); else rmLeave(ws);
    const distinct = new Set([...r.mem].map(w => w.key)); if (!distinct.has(ws.key) && distinct.size >= (r.cap || RM_CAP)) return send(ws, { t: 'rm_err', fatal: true, error: 'الغرفة ممتلئة (' + (r.cap || RM_CAP) + ' شخص)' });
    // رجوع بعد الخروج للتطبيقات: نشيل الاتصال القديم لنفس الحساب حتى ما تصير الشخصية مستنسخة، ونرجّعه لنفس مكانه
    if (!ws.guest && me.rmBal && RM_BAL_P[me.rmBal]) { if (!Array.isArray(me.rmBals)) me.rmBals = []; if (!me.rmBals.includes(me.rmBal)) me.rmBals.push(me.rmBal); }
    const first = ![...r.mem].some(w => w.key === ws.key); let prev = null;
    if (!ws.guest) for (const w of [...r.mem]) if (w !== ws && w.key === ws.key) { if (!prev && w.rm) prev = w.rm; try { gmLeave(r, w); } catch (e) {} r.mem.delete(w); w.rm = null; }
    ws.rm = { id: r.id, owner: r.owner, x: prev ? prev.x : 380 + Math.random() * 40, y: prev ? prev.y : 300 + Math.random() * 30, dir: prev ? prev.dir : 1, sit: false, t: 0, ct: 0, bal: prev ? (prev.bal || '') : ((!ws.guest && me.rmBal) || ''), pet: prev ? (prev.pet || '') : ((!ws.guest && me.rmPet) || ''), wear: prev ? rmWearClean(prev.wear) : (ws.guest ? {} : rmWearClean(me.rmWear)) }; if (prev && prev.hid) ws.rm.hid = prev.hid;
    const members = [...r.mem].filter(w => w.readyState === 1 && w.key !== ws.key && (!(w.rm && w.rm.hid) || rmStaff(r, ws))).map(rmPubM); r.mem.add(ws); { const st = rmStat(r, now); if (first) { st.joins++; st.hrs[new Date(now + BGD).getUTCHours()]++; } st.uniq.add(ws.key); const on = new Set([...r.mem].map(w => w.key)).size; if (on > st.peak) st.peak = on; }
    send(ws, { t: 'rm_state', castles: (r.castles || []).filter(c => Date.now() - c.ts < 480e3).map(c => ({ id: c.id, x: c.x, y: c.y, by: c.by, age: Math.round((Date.now() - c.ts) / 1000) })), wx: wxNow(r), gs: Object.values(r.gms || {}).filter(g => g.ph !== 'idle' || g.p[0] || g.p[1]).map(g => gmPub(r, g)), music: r.music || null, id: r.id, name: r.name, owner: db.users[r.owner] ? db.users[r.owner].name : '؟', isOwner: owner, members, log: r.log.filter(x => !x.hid || rmStaff(r, ws)).slice(-40), isMod: !!r.mods.has(ws.key), mods: rmModNames(r), bans: owner ? [...r.bans].map(k => rmBanNm(r, k)) : undefined, me: { x: ws.rm.x, y: ws.rm.y }, myBal: ws.rm.bal || '', myBals: ws.guest ? [] : (Array.isArray(me.rmBals) ? me.rmBals : []), myPet: ws.rm.pet || '', myPets: ws.guest ? [] : (Array.isArray(me.rmPets) ? me.rmPets : []), myWear: ws.rm.wear || {}, myWears: ws.guest ? [] : (Array.isArray(me.rmWears) ? me.rmWears : []), myFish: ws.guest ? null : (me.fish || null), myAv: ws.guest ? (ws.av || null) : ((db.users[ws.key] && db.users[ws.key].av) || null), myAdm: rmAdm(ws), perm: !!r.perm, cap: r.cap || RM_CAP, holds: [...r.mem].filter(w => w.rm && w.rm.hold).map(w => [rmNm(w), w.rm.hold]), myTime: (!ws.guest && me) ? rmTimeOf(me) : null, lt: LUDO.tablePub(r.id), mutedMin: rmMuted(r, ws, now), vipCnt: rmAdm(ws) ? vipReqs().length : 0, repCnt: rmAdm(ws) ? (db.reports || []).length : 0 });
    if (first) rmBc(r, { t: 'rm_join', m: rmPubM(ws) }, ws);
    if (first && alOnce('rm:' + ws.key + '>' + r.id, 30e3)) alog('🏝️', rmNm(ws) + ' دخل غرفة «' + r.name + '» بالمنتجع');
    if (first && !ws.guest && me && !(ws.rm && ws.rm.hid)) { for (const fk of flist(me, 'friends')) { if (!db.users[fk] || [...r.mem].some(w => w.key === fk)) continue; pushTo(fk, { t: 'f_update', toast: '🏝️ انضم صديقك ' + me.name + ' إلى المنتجع' }); } }
    if (!ws.guest && me && !me.admin) { const dn = Math.floor((now + BGD) / 864e5), g = me.rmGift || { day: 0, streak: 0 }; if (g.day !== dn) { const streak = g.day === dn - 1 ? Math.min((g.streak || 0) + 1, 30) : 1, amt = 15 + Math.min(streak, 7) * 5; me.rmGift = { day: dn, streak }; me.coins = (me.coins || 0) + amt; save(); send(ws, { t: 'rm_gift', coins: amt, streak, away: g.day ? dn - g.day : 0 }); } }
    const am = rmAdm(ws); r.wel = r.wel || {};
    if (am && now - (r.wel[ws.key] || 0) > 60e3) {   // ترحيب مميز بدخول الادمنية
      r.wel[ws.key] = now;
      const txt = am === 1 ? '👑✨ أهلاً وسهلاً بمالك اللعبة «' + me.name + '» في غرفته الملكية، حيّاكم الله جميعاً 🌹' : '🌟💙 أهلاً وسهلاً بالمشرف «' + me.name + '»، نوّرت الغرفة 💫';
      const wm = { n: '👑', sys: 1, adm: am, txt, ts: now }; r.log.push(wm); while (r.log.length > 80) r.log.shift(); rmBc(r, { t: 'rm_chat', m: wm });
    }
    r.lastActive = now;
  } else if (d.t === 'rm_pos') {
    const h = ws.rm; if (!h || (now - h.t < 90 && !!d.sit === !!h.sit)) return; h.t = now; const x = Number(d.x), y = Number(d.y); if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    h.x = Math.max(0, Math.min(7440, x)); h.y = Math.max(0, Math.min(1224, y)); h.dir = d.dir < 0 ? -1 : 1; h.sit = !!d.sit;
    const r = rmRooms.get(h.id);
    if (h.sit && r) { for (const w of r.mem) { if (w !== ws && w.rm && w.rm.sit && Math.hypot(w.rm.x - h.x, w.rm.y - h.y) < 9) { h.sit = false; try { ws.send(JSON.stringify({ t: 'rm_seatbusy' })); } catch (e) {} break; } } }
    if (r) rmBcV(r, { t: 'rm_pos', n: me.name, x: h.x, y: h.y, dir: h.dir, sit: h.sit }, ws);
  } else if (d.t === 'rm_av') {   // حفظ شكل الشخصية (حساب: يتحفظ دائماً، ضيف: للجلسة فقط)
    const h = ws.rm; if (!h || now - (h.avt || 0) < 800) return; h.avt = now; const av = avClean2(d.av, rmAdm(ws)); if (!av) return;
    if (ws.guest) ws.av = av; else { db.users[ws.key].av = av; save(); }
    const r = rmRooms.get(h.id); if (r) rmBcV(r, { t: 'rm_av', n: me.name, av }, ws);
  } else if (d.t === 'rm_music') {   // أغاني المنتجع (للمشرفين والادمنية فقط)
    const h = ws.rm; if (!h) return; if (!rmAdm(ws)) { send(ws, { t: 'rm_err', error: 'هذا الخيار للمشرفين فقط' }); return; } const r = rmRooms.get(h.id); if (!r) return; const u = String(d.url || '').trim().slice(0, 300);
    if (!u) r.music = null; else { const m = u.match(/[?&]list=([A-Za-z0-9_-]{10,64})/), v = u.match(/(?:[?&]v=|youtu\.be\/)([A-Za-z0-9_-]{11})/); if (!m && !v) { send(ws, { t: 'rm_err', error: 'رابط يوتيوب غير صالح' }); return; } r.music = m ? { k: 'pl', id: m[1] } : { k: 'v', id: v[1] }; r.music.by = me.name; }
    rmBc(r, { t: 'rm_music', music: r.music || null });
  } else if (d.t === 'rm_lj' || d.t === 'rm_ll') {   // طاولة غوكو (4 كراسي) داخل المنتجع
    const h = ws.rm; if (!h) return; const r = rmRooms.get(h.id); if (!r) return;
    if (d.t === 'rm_ll') return LUDO.leaveTable(ws);
    const sd = d.side | 0; if (sd < 0 || sd > 3) return; const sp = RM_LUDO.seats[sd];
    if (Math.hypot(h.x - (RM_LUDO.x + sp[0]), h.y - (RM_LUDO.y - sp[1])) > 46) return send(ws, { t: 'rm_ok', msg: '⚠️ قرّب من الكرسي' });
    const er = LUDO.sitTable(ws, r.id, sd); if (er) send(ws, { t: 'rm_err', error: '🎲 ' + er });
  } else if (d.t === 'rm_gj' || d.t === 'rm_gl' || d.t === 'rm_gready' || d.t === 'rm_gact') {   // طاولات الالعاب
    const h = ws.rm; if (!h) return; const r = rmRooms.get(h.id); if (!r) return;
    if (d.t === 'rm_gl') return gmLeave(r, ws);
    const tb = d.tb | 0; if (tb < 0 || tb >= GM_TB.length) return; const g = gmT(r, tb), me2 = g.p.indexOf(ws);
    if (d.t === 'rm_gj') { const s = d.side === 1 ? 1 : 0, T = GM_TB[tb]; if (g.ph === 'over' || me2 >= 0 || g.p[s]) return; if (Math.hypot(h.x - (T.x + (s ? 48 : -48)), h.y - (T.y - 11)) > 40) return; gmLeave(r, ws); g.p[s] = ws; if (g.p[0] && g.p[1]) { g.ph = 'ready'; g.rd = [0, 0]; g.msg = ''; } gmBc(r, g); }
    else if (me2 < 0) return;
    else if (d.t === 'rm_gready') { if (g.ph !== 'ready') return; g.rd[me2] = 1; if (g.rd[0] && g.rd[1]) gmStart(r, g); gmBc(r, g); }
    else if (d.t === 'rm_gact') { if (now - g.rt[me2] < 350) return; g.rt[me2] = now; gmAct(r, g, me2, d.a && typeof d.a === 'object' ? d.a : {}, now); }
  } else if (d.t === 'rm_announce') {
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || !rmIsOwner(r, ws.key)) return send(ws, { t: 'rm_err', error: 'للمشرفين فقط' }); if (now - (r.annT || 0) < 4000) return; const txt = String(d.txt || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 140); if (!txt) return; r.annT = now;
    rmBc(r, { t: 'rm_announce', txt, by: h.hid ? 'الإدارة' : rmNm(ws), adm: rmAdm(ws) }); rmSlog(r, h.hid ? 'الإدارة' : rmNm(ws), 'إعلان: ' + txt.slice(0, 50));
  } else if (d.t === 'rm_order') {   // طلب مشروب لنفسك: جربوع يجيبه ويقدمه قدام الكل
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r) return; if (now - (h.ord || 0) < 6000) return send(ws, { t: 'rm_ok', msg: '⏳ جربوع دا يحضّر طلبك' }); if (!['coffee', 'tea', 'juice', 'water', 'pepsi'].includes(d.k)) return;
    h.ord = now; const m = { t: 'rm_treat', from: rmNm(ws), to: rmNm(ws), k: d.k, self: 1 }; if (h.hid) send(ws, m); else rmBc(r, m);
  } else if (d.t === 'rm_treat') {   // عزيمة: جربوع يوصل مشروب لصديق
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || ws.guest) return; if (now - (h.trt || 0) < 9000) return send(ws, { t: 'rm_ok', msg: '⏳ انتظر شوي قبل عزيمة ثانية' }); if (!['coffee', 'tea', 'water', 'pepsi'].includes(d.k)) return;
    const tw = [...r.mem].find(w => w !== ws && w.readyState === 1 && rmNm(w) === String(d.n || '')); if (!tw || (tw.rm && tw.rm.hid && !rmStaff(r, ws))) return send(ws, { t: 'rm_ok', msg: '⚠️ الشخص مو موجود' });
    h.trt = now; const m = { t: 'rm_treat', from: rmNm(ws), to: rmNm(tw), k: d.k }; if (h.hid || tw.rm.hid) { send(ws, m); send(tw, m); } else rmBc(r, m);
  } else if (d.t === 'rm_drink') {
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || now - (h.dk || 0) < 4000 || !['coffee', 'tea', 'juice', 'water', 'pepsi'].includes(d.k)) return; h.dk = now; const m = { t: 'rm_drink', n: rmNm(ws), k: d.k }; if (h.hid) rmBcV(r, m, ws); else rmBc(r, m, ws);
  } else if (d.t === 'rm_stats_get') {
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || !rmIsOwner(r, ws.key)) return; const s = rmStat(r, now), vis = new Set([...r.mem].filter(w => !(w.rm && w.rm.hid)).map(w => w.key)).size;
    send(ws, { t: 'rm_stats', st: { online: vis, uniq: s.uniq.size, joins: s.joins, peak: s.peak, msgs: s.msgs, games: s.games, hrs: s.hrs } });
  } else if (d.t === 'rm_slog_get') {
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || !rmIsOwner(r, ws.key)) return; send(ws, { t: 'rm_slog', list: r.slog || [] });
  } else if (d.t === 'rm_castle' || d.t === 'rm_castle_del') {
    const h = ws.rm; if (!h) return; const r = rmRooms.get(h.id); if (!r) return; r.castles = (r.castles || []).filter(c => now - c.ts < 480e3); const nm = rmNm(ws);
    if (d.t === 'rm_castle') { return; /* قلعة الرمل انشالت بالكامل */ const x = Number(d.x), y = Number(d.y); if (!Number.isFinite(x) || !Number.isFinite(y) || y < 240 || y > 604 || x < 20 || x > 780 || Math.hypot(x - h.x, y - h.y) > 70) return; h.cst = now; r.castles = r.castles.filter(c => c.by !== nm); while (r.castles.length >= 14) r.castles.shift(); r.castles.push({ id: now + '' + Math.floor(Math.random() * 1000), x: Math.round(x), y: Math.round(y), by: nm, ts: now }); }
    else { const k = r.castles.find(c => c.id === String(d.id || '')); if (!k) return; if (k.by !== nm && !rmStaff(r, ws)) return; r.castles = r.castles.filter(c => c !== k); }
    rmBc(r, { t: 'rm_castles', list: r.castles.map(c => ({ id: c.id, x: c.x, y: c.y, by: c.by, age: Math.round((now - c.ts) / 1000) })) });
  } else if (d.t === 'rm_react') {
    const h = ws.rm; if (!h || now - (h.rxt || 0) < 700) return; h.rxt = now; const e = String(d.e || ''); if (!['😂', '❤️', '👍', '😮', '😢', '😡', '🎉', '🔥', '🐟', '🐠', '🦀', '🐡', '🏆'].includes(e)) return; const r = rmRooms.get(h.id); if (r) { rmBcV(r, { t: 'rm_react', n: rmNm(ws), e }, ws); send(ws, { t: 'rm_react', n: rmNm(ws), e }); }
  } else if (d.t === 'rm_hug') {
    const h = ws.rm; if (!h || now - (h.hgt || 0) < 2500) return; const r = rmRooms.get(h.id); if (!r) return; const tw = [...r.mem].find(w => rmNm(w) === String(d.n || '') && w !== ws); if (!tw || !tw.rm) return;
    if (Math.hypot(tw.rm.x - h.x, tw.rm.y - h.y) > 110) return send(ws, { t: 'rm_ok', msg: d.k === 'dance2' || d.k === 'dance2ok' ? '🚶 لازم تتقرب منه أكثر حتى ترقصون سوا' : d.k === 'hug' ? '🚶 لازم تتقرب منه أكثر حتى تحضنه' : '🚶 اقترب منه أكثر' }); if (h.hid || tw.rm.hid) { if (!(rmStaff(r, ws) && rmStaff(r, tw))) return; }
    if (d.k === 'dance2') { h.hgt = now; if (h.hid || tw.rm.hid) return; send(tw, { t: 'rm_dinv', from: rmNm(ws) }); return send(ws, { t: 'rm_ok', msg: '💃 انرسلت دعوة الرقص' }); }
    if (d.k === 'dance2ok') { h.hgt = now; const mm = { t: 'rm_d2', a: rmNm(tw), b: rmNm(ws) }; if (h.hid || tw.rm.hid) { send(ws, mm); send(tw, mm); } else rmBc(r, mm); return; }
    h.hgt = now; const k = ['hug', 'heart', 'clap'].includes(d.k) ? d.k : 'shake', m = { t: 'rm_hug', from: rmNm(ws), to: rmNm(tw), k }; if (h.hid || tw.rm.hid) { send(ws, m); send(tw, m); } else rmBc(r, m);
  } else if (d.t === 'rm_hold') {   // مسك الإيد: اللي يمسك يمشي وصاحبه يلحقه، والاثنين يكدرون يفلتون
    const h = ws.rm; if (!h) return; const r = rmRooms.get(h.id); if (!r) return; if (now - (h.hlt || 0) < 700) return; h.hlt = now;
    if (!d.on) { const pn = h.hold || h.heldBy; if (!pn) return; const tw = [...r.mem].find(w => w.rm && rmNm(w) === pn); h.hold = h.heldBy = null; if (tw) tw.rm.hold = tw.rm.heldBy = null; rmBc(r, { t: 'rm_hold', a: rmNm(ws), b: pn, on: 0, by: rmNm(ws) }); return; }
    const tw = [...r.mem].find(w => w !== ws && w.rm && rmNm(w) === String(d.n || '')); if (!tw) return; if (tw.key === ws.key) return;
    if (h.hid || tw.rm.hid) return; if (h.hold || h.heldBy) return send(ws, { t: 'rm_ok', msg: '✋ أنت ماسك إيد شخص، فلت إيده أول' }); if (tw.rm.hold || tw.rm.heldBy) return send(ws, { t: 'rm_ok', msg: '✋ هذا الشخص ماسك إيد غيرك' });
    if (Math.hypot(tw.rm.x - h.x, tw.rm.y - h.y) > 110) return send(ws, { t: 'rm_ok', msg: '🚶 لازم تتقرب منه أكثر حتى تمسك إيده' });
    if (!d.acc) { tw.rm.hreq = { from: rmNm(ws), t: now }; send(tw, { t: 'rm_hinv', from: rmNm(ws) }); return send(ws, { t: 'rm_ok', msg: '🤝 انرسل طلب مسك الإيد، ينتظر موافقته' }); }   // لازم الثاني يوافق
    const q = h.hreq; if (!q || q.from !== rmNm(tw) || now - q.t > 30000) return send(ws, { t: 'rm_ok', msg: '⌛ الطلب انتهى' }); h.hreq = null;
    tw.rm.hold = rmNm(ws); h.heldBy = rmNm(tw); rmBc(r, { t: 'rm_hold', a: rmNm(tw), b: rmNm(ws), on: 1 });
  } else if (d.t === 'rm_mytime') {
    if (ws.guest || !me) return; send(ws, Object.assign({ t: 'rm_mytime', need: { total: VIP_TOTAL_H, day: VIP_DAY_H }, pend: vipReqs().some(q => q.k === ws.key) }, rmTimeOf(me)));
  } else if (d.t === 'rm_vip_apply') {   // طلب العضوية المميزة: شروط ساعات اللعب، والطلب يوصل للمشرفين
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r) return; if (ws.guest) return send(ws, { t: 'rm_err', error: '✍️ سجّل حساب حتى تقدّم' });
    if (me.admin || r.mods.has(ws.key)) return send(ws, { t: 'rm_ok', msg: '⭐ أنت عضو مميز من قبل' });
    if (vipReqs().some(q => q.k === ws.key)) return send(ws, { t: 'rm_ok', msg: '⏳ طلبك موجود عند المشرفين، انتظر الرد' });
    const tm = rmTimeOf(me); if (tm.total < VIP_TOTAL_H * 3600 || tm.today < VIP_DAY_H * 3600) return send(ws, { t: 'rm_err', error: '⛔ ما تنطبق الشروط بعد: لازم ' + VIP_TOTAL_H + ' ساعة لعب بالمجموع و ' + VIP_DAY_H + ' ساعات تواجد اليوم' });
    const q = { id: crypto.randomBytes(5).toString('hex'), k: ws.key, n: me.name, room: r.id, ts: now, tot0: tm.total, day0: tm.today }; vipReqs().push(q); while (vipReqs().length > 100) vipReqs().shift(); save();
    try { alog('⭐', me.name + ' قدّم طلب عضوية مميزة بغرفة «' + r.name + '»'); } catch (e) {}
    vipNotifyAdmins({ t: 'rm_vipnew', n: me.name, cnt: vipReqs().length }); return send(ws, { t: 'rm_ok', msg: '📨 انرسل طلبك للمشرفين، راح يوصلك الرد' });
  } else if (d.t === 'rm_report') {   // المميز يبلّغ على شخص، والبلاغ يروح لخانة شكاوي المميزين عند المشرفين
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || ws.guest) return; if (!(r.mods.has(ws.key) || rmIsOwner(r, ws.key))) return send(ws, { t: 'rm_err', error: 'الإبلاغ للأعضاء المميزين' });
    const tws = [...r.mem].find(w => w !== ws && rmNm(w) === String(d.n || '')); if (!tws) return send(ws, { t: 'rm_err', error: 'الشخص مو موجود' }); if (!tws.guest && db.users[tws.key] && db.users[tws.key].admin) return send(ws, { t: 'rm_err', error: 'ما تكدر تبلّغ على ادمن' });
    if (now - (h.rpT || 0) < 30000) return send(ws, { t: 'rm_ok', msg: '⏳ انتظر شوي قبل بلاغ ثاني' }); h.rpT = now;
    const why = String(d.why || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    const L = Array.isArray(db.reports) ? db.reports : (db.reports = []); L.push({ id: crypto.randomBytes(5).toString('hex'), room: r.id, rn: r.name, by: me.name, n: rmNm(tws), tk: tws.guest ? 'ip:' + tws.ip : tws.key, g: !!tws.guest, why, ts: now }); while (L.length > 200) L.shift(); save();
    try { alog('🚩', me.name + ' بلّغ على ' + rmNm(tws) + (why ? ': ' + why : '')); } catch (e) {} vipNotifyAdmins({ t: 'rm_repnew', by: me.name, n: rmNm(tws), cnt: L.length });
    return send(ws, { t: 'rm_ok', msg: '🚩 انرسل البلاغ للمشرفين' });
  } else if (d.t === 'rm_rep_list' || d.t === 'rm_rep_act') {
    if (!rmAdm(ws)) return send(ws, { t: 'rm_err', error: 'للمشرفين فقط' }); const L = Array.isArray(db.reports) ? db.reports : (db.reports = []);
    if (d.t === 'rm_rep_act') {
      const i = L.findIndex(q => q.id === String(d.id || '')); if (i < 0) return; const q = L[i], a = ['kick', 'ban', 'dismiss'].includes(d.a) ? d.a : ''; if (!a) return; const r = rmRooms.get(q.room);
      if (a !== 'dismiss') {
        if (!r) return send(ws, { t: 'rm_err', error: 'الغرفة انسكرت' }); const match = w => q.g ? ('ip:' + w.ip) === q.tk : w.key === q.tk; const here = [...r.mem].filter(match);
        if (a === 'kick' && !here.length) return send(ws, { t: 'rm_err', error: q.n + ' مو موجود بالغرفة هسه — تكدر تحظره' });
        if (a === 'ban') { r.bans.add(q.tk); if (r.banNm) r.banNm.set(q.tk, q.n + (q.g ? ' (ضيف)' : '')); rmPersist(); }
        for (const w of here) { send(w, { t: 'rm_kicked', banned: a === 'ban', txt: 'بسبب بلاغ من عضو مميز' }); r.mem.delete(w); w.rm = null; } if (here.length) rmBc(r, { t: 'rm_leave', n: q.n });
        rmSlog(r, rmNm(ws), (a === 'ban' ? 'حظر ' : 'طرد ') + q.n + ' (بلاغ من ' + q.by + ')'); send(ws, { t: 'rm_ok', msg: (a === 'ban' ? '⛔ حظرت ' : '👢 طردت ') + q.n });
      }
      L.splice(i, 1); save();
    }
    return send(ws, { t: 'rm_rep_list', list: L.slice().reverse().map(q => { const r = rmRooms.get(q.room); return { id: q.id, rn: q.rn, by: q.by, n: q.n, why: q.why, ts: q.ts, on: !!(r && [...r.mem].some(w => q.g ? ('ip:' + w.ip) === q.tk : w.key === q.tk)) }; }) });
  } else if (d.t === 'rm_vip_list' || d.t === 'rm_vip_dec') {
    if (!rmAdm(ws)) return send(ws, { t: 'rm_err', error: 'للمشرفين فقط' });
    if (d.t === 'rm_vip_dec') { const L = vipReqs(), i = L.findIndex(q => q.id === String(d.id || '')); if (i < 0) return; const q = L[i]; L.splice(i, 1); save();
      if (d.ok) { const rr = rmRooms.get(q.room) || rmRooms.get('babi'); if (rr && db.users[q.k]) { rr.mods.add(q.k); rmPersist(); rmBc(rr, { t: 'rm_mods', mods: rmModNames(rr), who: q.n, on: true }); } pushTo(q.k, { t: 'rm_ok', msg: '🎉 مبروك! انقبل طلبك وصرت عضو مميز ⭐' }); }
      else pushTo(q.k, { t: 'rm_ok', msg: '😔 طلب العضوية المميزة ما انقبل هالمرة' });
      try { alog(d.ok ? '✅' : '❌', rmNm(ws) + (d.ok ? ' قبل' : ' رفض') + ' طلب تميّز ' + q.n); } catch (e) {} }
    return send(ws, { t: 'rm_vip_list', list: vipReqs().map(vipPub) });
  } else if (d.t === 'rm_ideas_get' || d.t === 'rm_idea_add' || d.t === 'rm_idea_del') {   // لوحة الأفكار: الكل يكتب ويشوف، والحذف للمشرفين بس
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r) return; const ideas = Array.isArray(db.ideas) ? db.ideas : (db.ideas = []), staff = !!rmAdm(ws);
    const pubI = () => ideas.slice(-200).map(x => ({ id: x.id, n: x.n, txt: x.txt, ts: x.ts, c: x.c }));
    const bcAll = () => { const str = JSON.stringify({ t: 'rm_ideas', list: pubI() }); for (const rr of rmRooms.values()) for (const w of rr.mem) if (w.readyState === 1) w.send(str); };
    const WEEK = 7 * 864e5, lastOf = () => { if (ws.guest || !me) return 0; if (!me.ideaAt) { const mine = ideas.filter(x => x.k === ws.key); if (mine.length) me.ideaAt = mine[mine.length - 1].ts; } return me.ideaAt || 0; };
    const nextAt = () => (ws.guest || !me || me.admin) ? 0 : Math.max(0, lastOf() + WEEK);
    if (d.t === 'rm_ideas_get') return send(ws, { t: 'rm_ideas', list: pubI(), canDel: staff, open: !!d.open, next: nextAt() });
    if (d.t === 'rm_idea_del') { if (!staff) return send(ws, { t: 'rm_err', error: 'الحذف للمشرفين فقط' }); const i = ideas.findIndex(x => x.id === String(d.id || '')); if (i < 0) return; const x = ideas[i]; ideas.splice(i, 1); save(); try { alog('🗑️', rmNm(ws) + ' حذف فكرة ' + x.n + ': ' + x.txt.slice(0, 40)); } catch (e) {} return bcAll(); }
    if (ws.guest) return send(ws, { t: 'rm_err', error: '✍️ سجّل حساب حتى تكتب فكرتك' });
    { const nx = nextAt(); if (nx > now) { const dd = Math.ceil((nx - now) / 864e5); return send(ws, { t: 'rm_ok', msg: '⏳ كل شخص يكتب فكرة وحدة بالأسبوع — تكدر تكتب فكرة جديدة بعد ' + (dd > 1 ? dd + ' أيام' : 'يوم') }); } }   // فكرة وحدة كل أسبوع لكل شخص
    { const mm = rmMuted(r, ws, now); if (mm) return send(ws, { t: 'rm_err', error: '🔇 أنت مكتوم، باقي ' + mm + ' دقيقة' }); }
    let txt = String(d.txt || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim(); if (!txt) return; txt = [...txt].slice(0, 54).join(''); if (!staff) txt = profMask(txt);
    h.idT = now; me.ideaAt = now; ideas.push({ id: crypto.randomBytes(5).toString('hex'), k: ws.key, n: rmNm(ws), txt, ts: now, c: Math.floor(Math.random() * 12) }); while (ideas.length > 400) ideas.shift(); save();
    try { alog('💡', rmNm(ws) + ' كتب فكرة: ' + txt); } catch (e) {} send(ws, { t: 'rm_ok', msg: '💡 انضافت فكرتك، شكراً إلك! تكدر تكتب فكرة ثانية بعد أسبوع' }); send(ws, { t: 'rm_ideas', list: pubI(), next: nextAt() }); return bcAll();
  } else if (d.t === 'rm_whisper') {
    const h = ws.rm; if (!h || now - (h.wst || 0) < 800) return; const r = rmRooms.get(h.id); if (!r) return; { const mm = rmMuted(r, ws, now); if (mm) return send(ws, { t: 'rm_err', error: '🔇 أنت مكتوم، باقي ' + mm + ' دقيقة' }); } let txt = String(d.txt || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 200); if (!txt) return; if (!rmStaff(r, ws)) txt = profMask(txt);
    { const sp = spamBlock(ws.key, txt); if (sp) return send(ws, { t: 'rm_err', error: spamErr(sp) }); }
    const tw = [...r.mem].find(w => rmNm(w) === String(d.n || '') && w !== ws); if (!tw || (tw.rm && tw.rm.hid && !rmStaff(r, ws))) return send(ws, { t: 'rm_ok', msg: '⚠️ الشخص مو موجود' }); h.wst = now;
    const m = { t: 'rm_whisper', from: rmNm(ws), to: rmNm(tw), txt }; send(tw, m); send(ws, m);
  } else if (d.t === 'rm_wx') {   // تحكم المشرفين بالطقس والوقت
    const h = ws.rm; if (!h) return; const r = rmRooms.get(h.id); if (!r) return; if (!rmIsOwner(r, ws.key)) return send(ws, { t: 'rm_err', error: 'هذا الخيار للمشرفين فقط' });
    const md = ['rain', 'snow', 'fast', 'slow', 'reset', 'day', 'night', 'fw'].includes(d.mode) ? d.mode : ''; if (!md || now - (r.wxt || 0) < 500) return; r.wxt = now; const cur = wxNow(r, now), c = r.wxc;
    c.base = md === 'rain' ? 1802 : md === 'snow' ? 3542 : md === 'day' ? 20 : md === 'night' ? 2702 : md === 'fw' ? 2710 : cur.el; c.ref = now; c.spd = md === 'fast' ? 12 : ['rain', 'snow', 'day', 'night', 'fw'].includes(md) ? cur.spd : 1;
    rmBc(r, Object.assign({ t: 'rm_wx', mode: md, by: rmNm(ws) }, wxNow(r, now))); if (!(ws.rm && ws.rm.hid)) rmSlog(r, rmNm(ws), 'غيّر الجو (' + md + ')');
  } else if (d.t === 'rm_hide') {   // اختفاء المشرفين
    const h = ws.rm; if (!h) return; const r = rmRooms.get(h.id); if (!r) return; if (!rmIsOwner(r, ws.key)) return send(ws, { t: 'rm_err', error: 'هذا الخيار للمشرفين فقط' });
    h.hid = d.on ? 1 : 0; const nm = rmNm(ws), pj = JSON.stringify(h.hid ? { t: 'rm_leave', n: nm } : { t: 'rm_join', m: rmPubM(ws) }), hj = JSON.stringify({ t: 'rm_hid', n: nm, on: h.hid });
    for (const w of r.mem) if (w.readyState === 1 && w !== ws) w.send(rmStaff(r, w) ? hj : pj); ws.send(hj);
  } else if (d.t === 'rm_fish') {   // صيد سمكة: تنحفظ بمخزن السمك
    const h = ws.rm; if (!h || now - (h.ft || 0) < 4500) return; const f = Number(d.f); if (!Number.isInteger(f) || f < 0 || f > 7) return; h.ft = now;
    const B = ws.guest ? (h.fish || (h.fish = { n: 0, k: {} })) : (me.fish || (me.fish = { n: 0, k: {} })); if (!B.k) B.k = {};
    B.n = Math.min(9999, (B.n || 0) + 1); B.k[f] = (B.k[f] || 0) + 1; if (!ws.guest) save(); send(ws, { t: 'rm_fish_ok', bag: B });
  } else if (d.t === 'rm_fish_sell') {   // بيع 15 سمكة = عملتين
    const h = ws.rm; if (!h || now - (h.fst || 0) < 1000) return; h.fst = now; if (ws.guest) return send(ws, { t: 'rm_fish_err', error: 'سجّل حساب حتى تبيع السمك وتاخذ عملات 🪙' });
    const B = me.fish || { n: 0, k: {} }; if (!B.k) B.k = {}; if ((B.n || 0) < 15) return send(ws, { t: 'rm_fish_err', error: 'تحتاج 15 سمكة حتى تبيع، عندك ' + (B.n || 0) });
    let left = 15; for (let i = 0; i <= 7 && left; i++) { const c = Math.min(left, B.k[i] || 0); if (c) { B.k[i] -= c; left -= c; if (!B.k[i]) delete B.k[i]; } }
    B.n -= 15; me.fish = B; me.coins = (me.coins || 0) + 2; if (me.admin && me.coins < 9999999) me.coins = 9999999; save();
    send(ws, { t: 'rm_fish_ok', bag: B, sold: 15, got: 2, coins: me.coins });
  } else if (d.t === 'rm_wear_buy') {   // شراء قطعة أزياء من ربشاتي
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || now - (h.wbt || 0) < 800) return; h.wbt = now; const k = String(d.k || '').slice(0, 12); if (!RM_WEAR_P[k]) return;
    if (ws.guest) return send(ws, { t: 'rm_wear_err', error: 'سجّل حساب حتى تشتري أزياء 👗' });
    const own = Array.isArray(me.rmWears) ? me.rmWears : (me.rmWears = []);
    if (!own.includes(k) && !me.admin) { const p = RM_WEAR_P[k][1]; if ((me.coins || 0) < p) return send(ws, { t: 'rm_wear_err', error: 'عملاتك ما تكفي 🪙 تحتاج ' + p }); me.coins = (me.coins || 0) - p; }
    if (!own.includes(k)) own.push(k); save(); send(ws, { t: 'rm_wear_bought', k, owned: own, coins: me.coins || 0 });
  } else if (d.t === 'rm_wear') {   // لبس / إلغاء لبس (قطعة وحدة لكل نوع: قبعة، نظارة، أجنحة)
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || now - (h.wrt || 0) < 400) return; h.wrt = now; const k = String(d.k || '').slice(0, 12), it = RM_WEAR_P[k]; if (!it) return;
    if (!me.admin && !(Array.isArray(me.rmWears) && me.rmWears.includes(k))) return send(ws, { t: 'rm_wear_err', error: 'لازم تشتري هذي القطعة أول 🛒' });
    const W = rmWearClean(h.wear); if (d.on) W[it[0]] = k; else if (W[it[0]] === k) delete W[it[0]]; h.wear = W; if (!ws.guest) { me.rmWear = W; save(); }
    send(ws, { t: 'rm_wear_ok', k, wear: W }); const wm = { t: 'rm_wear', n: rmNm(ws), wear: W }; if (h.hid) rmBcV(r, wm, ws); else rmBc(r, wm, ws);
  } else if (d.t === 'rm_pet_buy') {   // شراء حيوان من محل غمازة (40 عملة، ينحفظ بالأغراض)
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || now - (h.pbt || 0) < 800) return; h.pbt = now; const k = String(d.k || '').slice(0, 12); if (!RM_PET_P[k]) return;
    if (ws.guest) return send(ws, { t: 'rm_pet_err', error: 'سجّل حساب حتى تشتري حيوان 🐾' });
    const own = Array.isArray(me.rmPets) ? me.rmPets : (me.rmPets = []);
    if (!own.includes(k) && !me.admin) { const p = RM_PET_P[k]; if ((me.coins || 0) < p) return send(ws, { t: 'rm_pet_err', error: 'عملاتك ما تكفي 🪙 تحتاج ' + p }); me.coins = (me.coins || 0) - p; }
    if (!own.includes(k)) own.push(k); save(); send(ws, { t: 'rm_pet_bought', k, owned: own, coins: me.coins || 0 });
  } else if (d.t === 'rm_pet') {   // حمل / إلغاء حمل الحيوان (يمشي ورا صاحبه)
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || now - (h.ptt || 0) < 500) return; h.ptt = now; const k = String(d.k || '').slice(0, 12);
    if (k && !RM_PET_P[k]) return;
    if (k && !me.admin && !(Array.isArray(me.rmPets) && me.rmPets.includes(k))) return send(ws, { t: 'rm_pet_err', error: 'لازم تشتري هذا الحيوان أول 🛒' });
    h.pet = k; if (!ws.guest) { me.rmPet = k; save(); }
    send(ws, { t: 'rm_pet_ok', k }); const pm = { t: 'rm_pet', n: rmNm(ws), k }; if (h.hid) rmBcV(r, pm, ws); else rmBc(r, pm, ws);
  } else if (d.t === 'rm_bal_buy') {   // شراء بالون من محل سبيناغ (ينحفظ بأغراض اللاعب)
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || now - (h.bbt || 0) < 800) return; h.bbt = now; const k = String(d.k || '').slice(0, 12); if (!RM_BAL_P[k]) return;
    if (ws.guest) return send(ws, { t: 'rm_bal_err', error: 'سجّل حساب حتى تشتري بالون 🎈' });
    const own = Array.isArray(me.rmBals) ? me.rmBals : (me.rmBals = []);
    if (!own.includes(k) && !me.admin) { const p = RM_BAL_P[k]; if ((me.coins || 0) < p) return send(ws, { t: 'rm_bal_err', error: 'عملاتك ما تكفي 🪙 تحتاج ' + p }); me.coins = (me.coins || 0) - p; }
    if (!own.includes(k)) own.push(k); save(); send(ws, { t: 'rm_bal_bought', k, owned: own, coins: me.coins || 0 });
  } else if (d.t === 'rm_bal') {   // حمل / عدم حمل بالون
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || now - (h.bt || 0) < 500) return; h.bt = now; const k = String(d.k || '').slice(0, 12);
    if (k && !(k in RM_BAL_P)) return;
    if (k && RM_BAL_P[k] && !me.admin && !(Array.isArray(me.rmBals) && me.rmBals.includes(k))) return send(ws, { t: 'rm_bal_err', error: 'لازم تشتري هذا البالون أول 🛒' });
    h.bal = k; if (!ws.guest) { me.rmBal = k; save(); }
    send(ws, { t: 'rm_bal_ok', k }); const bm = { t: 'rm_bal', n: rmNm(ws), k }; if (h.hid) rmBcV(r, bm, ws); else rmBc(r, bm, ws);
  } else if (d.t === 'rm_umb') {   // شمسية المطر
    const h = ws.rm; if (!h || now - (h.umbt || 0) < 300) return; h.umbt = now; h.umb = d.on ? 1 : 0; const r = rmRooms.get(h.id); if (r) rmBcV(r, { t: 'rm_umb', n: me.name, on: h.umb }, ws);
  } else if (d.t === 'rm_emo') {   // رقصات وايماءات
    const h = ws.rm; if (!h || now - (h.et || 0) < 250) return; h.et = now; const e = Number(d.e); h.emo = Number.isInteger(e) && e >= 0 && e <= 40 ? e : 0;
    const r = rmRooms.get(h.id); if (r) rmBcV(r, { t: 'rm_emo', n: me.name, e: h.emo }, ws);
  } else if (d.t === 'rm_typing') {
    const h = ws.rm; if (!h || now - (h.tt || 0) < 1500) return; h.tt = now; const r = rmRooms.get(h.id); if (r) rmBcV(r, { t: 'rm_typing', n: me.name }, ws);
  } else if (d.t === 'rm_kiss') {   // بوسات: بس بين بابي وبابيتو
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || !rmAdm(ws) || now - (h.kt || 0) < 700) return;
    const tw = [...r.mem].find(w => rmNm(w) === String(d.n || '') && rmAdm(w) && w.key !== ws.key); if (!tw || !tw.rm || Math.hypot(tw.rm.x - h.x, tw.rm.y - h.y) > 90) return; h.kt = now;   // لازم يكونون قريبين من بعض
    rmBc(r, { t: 'rm_kiss', from: me.name, to: rmNm(tw) });
  } else if (d.t === 'rm_chat') {
    const h = ws.rm; if (!h || now - h.ct < (ws.guest ? 1500 : 600)) return; h.ct = now; const r = rmRooms.get(h.id); if (!r) return; { const mm = rmMuted(r, ws, now); if (mm) return send(ws, { t: 'rm_err', error: '🔇 أنت مكتوم، باقي ' + mm + ' دقيقة' }); }
    let txt = String(d.txt || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 500); if (!txt) return; if (!rmStaff(r, ws)) txt = profMask(txt);
    { const sp = spamBlock(ws.key, txt); if (sp) return send(ws, { t: 'rm_err', error: spamErr(sp) }); }
    rmStat(r, now).msgs++; const m = { n: me.name, txt, ts: now, adm: rmAdm(ws) }; if (h.hid) m.hid = 1; r.log.push(m); while (r.log.length > 80) r.log.shift(); if (h.hid) rmBcV(r, { t: 'rm_chat', m }, ws), send(ws, { t: 'rm_chat', m }); else rmBc(r, { t: 'rm_chat', m });
  } else if (d.t === 'rm_leave') rmLeave(ws);
  else if (d.t === 'rm_kick' || d.t === 'rm_mute' || d.t === 'rm_ban' || d.t === 'rm_unban' || d.t === 'rm_warn' || d.t === 'rm_mod' || d.t === 'rm_unmod') {
    const h = ws.rm, r = h && rmRooms.get(h.id); if (!r || !rmCanMod(r, ws.key)) return send(ws, { t: 'rm_err', error: 'بس صاحب الغرفة أو المميزين يكدرون يسوون هذا' });
    const isOwn = rmIsOwner(r, ws.key); if ((d.t === 'rm_unban' || d.t === 'rm_mod' || d.t === 'rm_unmod') && !isOwn) return send(ws, { t: 'rm_err', error: 'بس صاحب الغرفة' });
    if (!isOwn && d.t !== 'rm_warn' && d.t !== 'rm_mute') return send(ws, { t: 'rm_err', error: '⭐ العضو المميز يكدر يحذّر أو يكتم بس' });   // صلاحية المميز: تحذير وكتم (5-20 دقيقة)
    const tname = String(d.n || '');
    const tws = [...r.mem].find(w => rmNm(w) === tname);
    let k = tws ? (tws.guest ? 'ip:' + tws.ip : tws.key) : (d.t === 'rm_unban' ? ([...(r.banNm || [])].find(e => e[1] === tname) || [])[0] || keyOfName(tname) : keyOfName(tname));
    if (!k || (!tws && !own(db.users, k) && !r.bans.has(k))) return;
    if (tws && tws.key === ws.key) return; if (k === ws.key || k === r.owner) return;
    const tn = tws ? rmNm(tws) : rmBanNm(r, k);
    if (db.users[k] && db.users[k].admin) return send(ws, { t: 'rm_err', error: 'ما تكدر تتعامل مع ادمن' });
    if (d.t === 'rm_mod' || d.t === 'rm_unmod') {
      if (!tws || tws.guest || !db.users[k]) return send(ws, { t: 'rm_err', error: 'الرتبة للأعضاء المسجلين اللي داخل الغرفة بس' });
      if (d.t === 'rm_mod') r.mods.add(k); else r.mods.delete(k); rmPersist();
      rmBc(r, { t: 'rm_mods', mods: rmModNames(r), who: tn, on: d.t === 'rm_mod' });
      return send(ws, { t: 'rm_ok', msg: d.t === 'rm_mod' ? '⭐ أعطيت ' + tn + ' رتبة مميز (يحذّر ويكتم)' : 'شلت رتبة مميز من ' + tn });
    }
    if (r.mods.has(k) && !isOwn) return send(ws, { t: 'rm_err', error: 'ما تكدر تتعامل مع عضو مميز' });
    if (d.t === 'rm_mute') {
      if (!tws) return send(ws, { t: 'rm_err', error: 'الشخص مو موجود' }); const okM = isOwn ? [0, 1, 5, 10, 15, 20, 60] : [0, 5, 10, 15, 20]; if (!okM.includes(Number(d.min))) return send(ws, { t: 'rm_err', error: 'مدة الكتم من 5 إلى 20 دقيقة' }); const mn = Number(d.min); r.mutes = r.mutes || new Map();
      if (!mn) { r.mutes.delete(rmMuteKey(tws)); send(tws, { t: 'rm_muted', until: 0 }); send(tws, { t: 'rm_ok', msg: '🔊 انفك الكتم عنك' }); rmSlog(r, me.name, 'فكّ الكتم عن ' + tn); return send(ws, { t: 'rm_ok', msg: '🔊 فكيت الكتم عن ' + tn }); }
      r.mutes.set(rmMuteKey(tws), now + mn * 60000); send(tws, { t: 'rm_muted', until: now + mn * 60000, by: me.name, min: mn }); send(tws, { t: 'rm_err', error: '🔇 كتمك ' + me.name + ' لمدة ' + mn + ' دقيقة' }); rmSlog(r, me.name, 'كتم ' + tn + ' ' + mn + ' د'); return send(ws, { t: 'rm_ok', msg: '🔇 كتمت ' + tn + ' ' + mn + ' دقيقة' });
    }
    const banList = () => [...r.bans].map(x => rmBanNm(r, x));
    if (d.t === 'rm_warn') {
      const txt = String(d.txt || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 160); if (!txt) return;
      for (const w of r.mem) if (w === tws || (tws && !tws.guest && w.key === k)) send(w, { t: 'rm_warn', from: me.name, txt });
      send(ws, { t: 'rm_ok', msg: '⚠️ انرسل التحذير إلى ' + tn }); rmSlog(r, me.name, 'حذّر ' + tn + ': ' + txt.slice(0, 40));
    } else if (d.t === 'rm_unban') { r.bans.delete(k); if (r.banNm) r.banNm.delete(k); rmPersist(); send(ws, { t: 'rm_bans', bans: banList(), msg: '✅ رجّعت ' + tn }); rmSlog(r, me.name, 'رجّع ' + tn);
    } else {
      const ban = d.t === 'rm_ban'; if (ban) { r.bans.add(k); if (r.banNm) r.banNm.set(k, tn + (tws && tws.guest ? ' (ضيف)' : '')); rmPersist(); }
      for (const w of [...r.mem]) if (w === tws || (tws && !tws.guest && w.key === k)) { send(w, { t: 'rm_kicked', banned: ban, txt: String(d.txt || '').slice(0, 160) }); r.mem.delete(w); w.rm = null; }
      rmBc(r, { t: 'rm_leave', n: tn }); send(ws, { t: 'rm_bans', bans: banList(), msg: (ban ? '⛔ منعت ' : '👢 طردت ') + tn }); rmSlog(r, me.name, (ban ? 'حظر ' : 'طرد ') + tn);
    }
  }
}
const SUS = require('./sus-server')({ db: new Proxy({}, { get: (_, k) => db[k] }), save: () => save(), send, crypto, alog: (a, b) => alog(a, b) });
const LUDO = require('./ludo-server')({ db: new Proxy({}, { get: (_, k) => db[k] }), save: () => save(), send, crypto, alog: (a, b) => alog(a, b), onTable: (rmId, st) => { const r = rmRooms.get(rmId); if (r) rmBc(r, { t: 'rm_lt', s: st }); } });   // لعبة «غوكو»
function onMsg(ws, d) {
  if (!d || typeof d !== 'object') return;
  if (typeof d.t === 'string' && d.t.startsWith('hv_')) return hvOnMsg(ws, d);
  if (typeof d.t === 'string' && d.t.startsWith('rm_')) return rmOnMsg(ws, d);
  if (typeof d.t === 'string' && d.t.startsWith('sus_')) return SUS.onMsg(ws, d);   // لعبة «مين الخاين؟»
  if (typeof d.t === 'string' && d.t.startsWith('ludo_')) return LUDO.onMsg(ws, d);   // لعبة «غوكو»
  if (d.t === 'duo_aim' || d.t === 'duo_fire' || d.t === 'duo_swap') return zInput(ws, d);
  const now = Date.now();
  if (now - ws.bucket.t > 10000) ws.bucket = { n: 0, t: now };
  if (++ws.bucket.n > 40) return send(ws, { t: 'err', error: 'بطّء شوي' });
  const me = db.users[ws.key];

  if (d.t === 'join') {
    const code = String(d.code || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    if (code.length < 4) return send(ws, { t: 'err', fatal: true, error: 'الكود لازم 4 أحرف أو أرقام على الأقل' });
    if (ws.room) leave(ws);
    if (alOnce('ch:' + ws.key + '>' + code, 60e3)) alog('💬', unm(ws.key) + ' دخل غرفة شات');
    let set = live.get(code);
    if (!set) live.set(code, set = new Set());
    const distinct = new Set([...set].map(w => w.key)); distinct.add(ws.key);
    if (distinct.size > 8) return send(ws, { t: 'err', fatal: true, error: 'الغرفة ممتلئة' });
    const first = ![...set].some(w => w.key === ws.key);
    set.add(ws); ws.room = code;
    const msgs = roomOf(code).msgs.filter(m => !m.hidden.includes(ws.key)).slice(isProt(code) ? -5000 : -600).map(pub);
    send(ws, { t: 'joined', code, msgs, members: membersOf(code), pins: pinsOf(roomOf(code)), bg: roomOf(code).bg || null, reads: roomOf(code).reads || {}, duo: duoPub(code) });
    bc(code, { t: 'presence', members: membersOf(code) });
    if (first) bc(code, { t: 'sys', text: me.name + ' دخل الغرفة 🎮' }, w => w !== ws);
    return;
  }

  const code = ws.room; if (!code) return;
  const room = roomOf(code);
  const find = id => room.msgs.find(m => m.id === String(id));

  if (d.t === 'msg') {
    let text = String(d.text || '').trim().slice(0, 500); if (text && !isAdmKey(ws)) text = profMask(text);
    if (text) { const sp = spamBlock(ws.key, text); if (sp) return send(ws, { t: 'err', error: spamErr(sp) }); }
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
    if (!isProt(code)) while (room.msgs.length > MAX_MSGS) delMedia(room.msgs.shift());
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
      if (alOnce('duo:' + ws.key, 60e3)) alog('👥', unm(ws.key) + ' دخل اللعب الثنائي');
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
      if (isProt(code)) return send(ws, { t: 'err', error: '🔒 هذي الغرفة محمية: الرسائل ما تنحذف' });
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
  const isGuest = !key && (() => { try { return new URL(req.url, 'http://x').searchParams.get('guest') === '1'; } catch (e) { return false; } })();
  if (isGuest) {   // ضيف: يدخل غرفة «بابي» الدائمة فقط (بدون حساب)
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (limited('gws:' + ip, 30, 600e3)) { send(ws, { t: 'err', fatal: true, error: 'محاولات كثيرة' }); return ws.close(); }
    let gname; const used = new Set([...wss.clients].filter(w => w.guest).map(w => w.gname));
    do { gname = 'ضيف' + (100 + Math.floor(Math.random() * 900)); } while (used.has(gname) || own(db.users, gname.toLowerCase()));
    ws.guest = true; ws.gname = gname; ws.ip = ip; ws.key = 'g:' + crypto.randomBytes(6).toString('hex'); ws.alive = true; ws.bucket = { n: 0, t: Date.now() }; ws.room = null;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', raw => { let d; try { d = JSON.parse(raw); } catch (e) { return; } if (d && d.t === 'al_ev') { try { alMsg(ws, d); } catch (e) {} return; } if (!d || typeof d.t !== 'string' || !d.t.startsWith('rm_')) return; try { rmOnMsg(ws, d); } catch (e) { console.error(e); } });
    ws.on('close', () => { rmLeave(ws); alog('🔴', 'خرج الضيف ' + gname); alCntPush(); }); ws.on('error', () => {});
    alog('🟢', 'انضم الضيف ' + gname + ' (بدون حساب)'); alCntPush();
    return send(ws, { t: 'rm_guest', name: gname });
  }
  if (!key) { send(ws, { t: 'err', fatal: true, error: 'سجّل دخول من جديد' }); return ws.close(); }
  ws.key = key; ws.room = null; ws.alive = true; ws.bucket = { n: 0, t: Date.now() };
  if (!isOnline(key, ws)) { presenceChange(key, true); alOn(key); }
  alCntPush();
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', raw => { let d; try { d = JSON.parse(raw); } catch (e) { return; } if (d && typeof d.t === 'string' && d.t.startsWith('al_')) { try { alMsg(ws, d); } catch (e) { console.error(e); } return; } try { onMsg(ws, d); } catch (e) { console.error(e); } });
  ws.on('close', () => { alSubs.delete(ws); try { SUS.leave(ws); } catch (e) {} try { LUDO.leave(ws); } catch (e) {} hvLeave(ws); rmLeave(ws); leave(ws); if (!isOnline(ws.key, ws)) { presenceChange(ws.key, false); alOff(ws.key); } alCntPush(); });
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
    if (!isProt(code) && !r.msgs.length && !(r.pins && r.pins.length) && !live.has(code) && (!r.bg || (r.bgAt || 0) < cut)) {   // نحذف بس الغرف الفارغة تماماً
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
  .then(() => { ensureAdmin(); rmLoad(); return protRestore(); })
  .then(() => statsInit())
  .then(() => server.listen(PORT, () => { console.log('Flappy server on :' + PORT); bakStart(); const u = process.env.RENDER_EXTERNAL_URL; if (u && typeof fetch === 'function') setInterval(() => { fetch(u + '/healthz').catch(() => {}); }, 9 * 60 * 1000); }))
  .catch(e => { console.error('startup failed:', e.message); process.exit(1); });
