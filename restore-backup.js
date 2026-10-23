#!/usr/bin/env node
/* استرجاع نسخة احتياطية (وضع الملفات): أوقف السيرفر أولاً، بعدين:
     node restore-backup.js <ملف-النسخة.json.gz> [مجلد-البيانات]
   ينسخ db.json الحالي إلى db.json.before-restore ويكتب البيانات من النسخة. الغرف المحمية (rbsh99daklot99) ما تنحذف رسائلها: السيرفر يدمجها من تخزينها الخاص عند التشغيل. */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const file = process.argv[2], dir = process.argv[3] || process.env.DATA_DIR || path.join(__dirname, 'data');
if (!file || !fs.existsSync(file)) { console.error('الاستخدام: node restore-backup.js <backup.json.gz> [dataDir]'); process.exit(1); }
const b = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString());
if (!b || !b.db || !b.db.users) { console.error('الملف مو نسخة صالحة'); process.exit(1); }
fs.mkdirSync(dir, { recursive: true }); const dbf = path.join(dir, 'db.json');
if (fs.existsSync(dbf)) fs.copyFileSync(dbf, dbf + '.before-restore');
fs.writeFileSync(dbf + '.tmp', JSON.stringify(b.db)); fs.renameSync(dbf + '.tmp', dbf);
if (b.stats) { const sd = path.join(dir, 'protected'); fs.mkdirSync(sd, { recursive: true }); fs.writeFileSync(path.join(sd, 'stats.json'), JSON.stringify(b.stats)); }
console.log('تم الاسترجاع: ' + Object.keys(b.db.users).length + ' حساب من نسخة ' + new Date(b.ts || 0).toISOString() + ' → ' + dbf);
