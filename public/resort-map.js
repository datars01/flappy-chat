/* =====================================================================
   خريطة المنتجع 🗺️ — خريطة احترافية للمكان كامل مع أسماء كلشي
   - تنرسم مرة وحدة كصورة (خفيفة)، وفوكها دبابيس وأسماء وموقعك الحي
   - سحب بالإصبع، تكبير بإصبعين أو بالأزرار، ودوس على أي مكان: «امشي هناك»
   ===================================================================== */
const MP = { img: null, s: 0.28, at: 0, k: 0, ox: 0, oy: 0, raf: 0, sel: null, ptrs: new Map(), pinch: null, drag: null, moved: 0 };
const mpNew = () => { try { return rmShopId() === 8; } catch (e) { return false; } };   // إنت بالشمال؟ الخريطة تتبدل
const MP_X0 = () => mpNew() ? R3_NHI.vx0 : RMX0, MP_W = () => mpNew() ? R3_NHI.vx1 - R3_NHI.vx0 : RMW - RMX0, MP_H = () => mpNew() ? 1040 : RMH;
const mpWorld = () => mpNew() ? 'new' : 'main';
/* [المستوى، الإيموجي، الاسم، x، y، الوصف، المجموعة] — المستوى 1 يبين دائماً، 2 و3 كلما قرّبت */
function mpPlaces() {
  const P = [];
  const add = (lv, e, n, x, y, d, g) => P.push({ lv, e, n, x, y, d, g });
  if (mpNew()) {   // خريطة الشمال 🏝️
    const X = R3_N.x0;
    add(1, '🛬', 'مطار الشمال', X + 510, 700, 'هنا تنزل طيارة بابيت إيرلاينز', 'n');
    add(1, '✈️', 'طيارة BT-101', X + 440, 640, 'الطيارة اللي جابتك من منتجع بابيت', 'n');
    add(1, '👨‍✈️', 'القبطان — رحلة الرجعة', R3_CAP2.x, R3_CAP2.y, 'احچي وياه وترجع لمنتجع بابيت مجاناً', 'n');
    add(2, '🛫', 'المدرج', X + 820, 695, '', 'n');
    add(1, '❄️', 'لوحة الشمال', X + 620, 560, 'أهلاً بيك بالوادي الثلجي', 'w');
    add(2, '🏠', 'أكواخ الخشب', X + 470, 410, 'أكواخ دافية تطلع دخان', 'w');
    add(2, '⛸️', 'البحيرة المتجمدة', X + 1130, 600, 'ناس يتزلجون على الجليد', 'w');
    add(2, '🚡', 'تلفريك الجبل', X + 1250, 360, 'يصعد للقمة', 'w');
    add(2, '🔥', 'نار المخيم والكاكاو', X + 700, 880, 'اكعد ودفّي', 'w');
    add(3, '⛄', 'رجل الثلج', X + 760, 470, '', 'w');
    add(3, '🧊', 'الإيغلو', X + 1020, 920, '', 'w');
    add(3, '🦌', 'غزلان الرنة', X + 1000, 410, '', 'w');
    add(3, '🌴', 'أرض للبناء', X + 1300, 860, 'مساحة فاضية للمشاريع الجاية', 'w');
    return P;
  }
  // الشاطئ
  add(2, '🔥', 'نار المخيم', RM_FIRE.x, RM_FIRE.y, 'اكعد حول النار وسولف ويه الناس', 'b');
  add(2, '🛎️', 'جربوع', RM_NPC.x, RM_NPC.y, 'جربوع يرحب بيك ويعلمك شلون تجمع فلوس', 'b');
  add(3, '🎣', 'رصيف الصيد', 400, 214, 'اصطاد سمك وبيعه بدولار المنتجع 💵', 'b');
  add(3, '🍹', 'البار', 660, 456, 'مشروبات على الشاطئ', 'b');
  add(2, '🏊', 'المسبح', RM_POOL.x + RM_POOL.w / 2, RM_POOL.y + RM_POOL.h / 2, 'سبح ويه أصدقائك', 'b');
  add(2, '🎡', 'دولاب الهوا', RM_FER.x, RM_FER.by, 'اركب وشوف المنتجع من فوق', 'b');
  add(3, '🎠', 'دوّارة الخيول', RM_CAR.x, RM_CAR.y, 'لعبة الدوّارة', 'b');
  if (window.R5_RIDES) { const Q = R5_RIDES; add(2, '🗼', 'برج الرعب', Q.drop.x, Q.drop.y, 'يصعدك لفوك ويطبّك', 'l'); add(2, '🚗', 'سيارات التصادم', Q.bump.x, Q.bump.y, 'اصدم أصدقائك', 'l'); add(2, '🐙', 'الأخطبوط', Q.oct.x, Q.oct.y, 'كاسات تدور وتصعد وتنزل', 'l'); add(2, '🎠', 'الكراسي الطائرة', Q.swg.x, Q.swg.y, 'طير بالهوا', 'l'); }
  if (window.R4_PIR) { add(2, '🏴‍☠️', 'سفينة القرصان', R4_PIR.x, R4_PIR.y, 'تتمرجح لفوك — تمسّك زين', 'b'); add(2, '🎢', 'الأفعوانية', R4_CST.x, R4_CST.y, 'قطار سريع بتلال ونزلات', 'b'); }
  if (window.R6_SPOTS) { const Q = R6_SPOTS; add(3, '🏖️', 'جلسات البحر', Q.seat.x, Q.seat.y, 'كراسي تشمس تكعد عليها', 'b'); add(2, '🏄', 'ألعاب البحر', Q.ws.x, Q.ws.y, 'جت سكي وباراسيلنغ', 'b'); add(3, '🔥', 'الشوي والتخييم', Q.camp.x, Q.camp.y, 'خيام ونار ومشويات', 'b'); add(3, '🔭', 'التلسكوب', Q.tel.x, Q.tel.y, 'شوف البحر من قريب', 'b'); }
  if (window.R7_LOTS) add(2, '🏗️', 'مشاريع قادمة', R7_LOTS.x, R7_LOTS.y, 'راح ينبني هنا شي جديد', 'b');
  if (window.R8_SPOTS) { const Q = R8_SPOTS; add(1, '🦦', 'حوض كلاب الماء', Q.stad.x, Q.stad.y, 'كلاب ماء وضفادع وسلاحف', 'g'); add(2, '🐴', 'إسطبل الخيل', Q.stb.x, Q.stb.y, 'اركب حصان', 'g'); add(2, '🛶', 'بحيرة بابي', Q.lake.x, Q.lake.y, 'قوارب بدّالات وصيد', 'g'); add(2, '🏎️', 'حلبة الكارتينغ', Q.kart.x, Q.kart.y, 'سباق سيارات', 'g'); add(2, '🎪', 'المسرح والسينما', Q.stg.x, Q.stg.y, 'شاشة كبيرة وكراسي', 'g'); add(2, '🌻', 'متاهة الورد', Q.maze.x, Q.maze.y, 'لاقي الكنز', 'g'); add(2, '🦒', 'حديقة الحيوانات', Q.zoo.x, Q.zoo.y, 'زرافة وفيل وأسد وبطاريق', 'g'); add(2, '🎈', 'رحلة المنطاد', Q.bal.x, Q.bal.y, 'طير فوك المرج', 'g'); }
  add(3, '⛲', 'النافورة والجلسة الهادية', RM_FTN.x, RM_FTN.y, 'كراسي حول النافورة', 'b');
  add(3, '📸', 'ركن التصوير', RM_PHO.x, RM_PHO.y, 'صوّر ويه أصدقائك', 'b');
  add(2, '🎲', 'طاولات الألعاب', 1012, 435, 'سنيك، XO، حجرة ورقة مقص، دومينو، وغوكو', 'b');
  add(3, '💡', 'لوحة الأفكار', RM_IDB.x, RM_IDB.y, 'اكتب فكرتك للعبة', 'b');
  add(3, '👑', 'لوحة العضوية المميزة', RM_VIPB.x, RM_VIPB.y, 'شوف المميزين', 'b');
  add(3, '📢', 'قناة التليكرام', RM_TG.x, RM_TG.y, 'تابعونا علمود نكبر', 'b');
  // يسار: الشلال والبحيرة
  add(2, '💦', 'الشلال', RX_FALL.x, 470, 'شلال ينزل للبحيرة', 'l');
  add(2, '🚣', 'البحيرة والقوارب', RX_LG.x, RX_LG.y, 'قوارب مجانية', 'l');
  add(3, '🛶', 'رصيف القوارب', (RX_DOCK.x0 + RX_DOCK.x1) / 2, RX_DOCK.y0, 'اركب قارب مجاناً', 'l');
  add(2, '🍹', 'العصائر الاستوائية', RX_JUI.x, RX_JUI.y, 'كل عصير بدولار 💵', 'l');
  add(3, '🐱', 'البزونة جاسمية', RX_CAT.x, RX_CAT.y, 'دلّعها', 'l');
  // المحلات
  add(2, '🎈', 'محل بالونات سبيناغ', RM_SHOP.x, RM_SHOP.y, 'بالونات وأعلام الدول العربية مجاناً', 's');
  add(2, '🐾', 'محل غمازة', RM_PSHOP.x, RM_PSHOP.y, 'حيوانات أليفة صغيرة', 's');
  add(2, '👗', 'محل ربشاتي للأزياء', RM_FSHOP.x, RM_FSHOP.y, 'ملابس وإكسسوارات', 's');
  add(2, '👜', 'روح للحقائب', RM_BSHOP.x, RM_BSHOP.y, 'حقائب للبنات', 's');
  add(2, '💇‍♀️', 'صالون ملاذ', RX_SAL.x, RX_SAL.y, 'مكياج احترافي للبنات', 's');
  add(3, '🚶', 'شارع المشاة', (RX_ST.x0 + RX_ST.x1) / 2, 700, 'للمشاة فقط', 's');
  // الفندق
  add(1, '🏨', 'فندق بابيت', RX_HT.x, RX_HT.y, 'استأجر غرفة ونام وتغطى', 'h');
  // المطار
  add(1, '✈️', 'مطار بابيت الدولي', (R3_TERM.x0 + R3_TERM.x1) / 2, R3_TERM.y, 'سافر للمنتجع الجديد', 'a');
  add(2, '🎫', 'مركز حجز التذاكر', R3_TKT.x, R3_TKT.y, 'احجز تذكرتك', 'a');
  add(2, '👨‍✈️', 'القبطان والطيارة', R3_CAP.x, R3_CAP.y, 'سلّم التذكرة وطير', 'a');
  add(3, '🗼', 'برج المراقبة', R3_TWR.x, R3_TWR.y, '', 'a');
  add(3, '🛫', 'المدرج', 6400, 292, '', 'a');
  // جنوب الشارع
  add(2, '🌉', 'جسر المشاة', R3_BR.cx, 1330, 'اعبر الشارع للجهة الثانية', 'g');
  add(1, '🌿', 'حديقة الأمل', R3_G.gx, R3_G.y0, 'زرع وجلسات وفراشات وعصافير', 'g');
  add(1, '🦢', 'بجعة الحب الأبدي', R3_POND.x, R3_POND.y, 'قرّب منها وحط لايك ❤️', 'g');
  add(3, '☕', 'جلسات السوالف', 960, 1840, 'طاولات وكراسي', 'g');
  return P;
}
const MP_ZONES = () => mpNew() ? [['❄️ الشمال', R3_N.x0 + 800, 420], ['منطقة الوصول ✈️', R3_N.x0 + 470, 790], ['⛸️ البحيرة المتجمدة', R3_N.x0 + 1130, 680], ['🏔️ الجبال', R3_N.x0 + 800, 140]] : [['الشاطئ 🏖️', 420, 560], ['البحيرة والشلال', -930, 820], ['منطقة الألعاب', 1010, 600], ['صف المحلات 🛍️', 2380, 330], ['ساحة الفندق', 4120, 1000], ['مطار بابيت الدولي ✈️', 6300, 1020], ['الشارع الرئيسي 🚗', 2900, 1330], ['حديقة الأمل 🌿', 1300, 2460], ['المرج الأخضر 🌳', 4300, 2000]];
const MP_GC = { n: '#7a2ad8', w: '#e8a21a', b: '#ff9f1c', l: '#18b6d8', s: '#ff4f9a', h: '#7a2ad8', a: '#2a6ad8', g: '#2ea84a' };
const MP_GN = { b: '🏖️ الشاطئ', l: '💦 البحيرة', s: '🛍️ المحلات', h: '🏨 الفندق', a: '✈️ المطار', g: '🌿 الحديقة' }, MP_GN2 = { n: '🛬 المطار والرجعة', w: '🏗️ قريباً' };

/* ---- ترسيم الخريطة مرة وحدة ---- */
function mpBuild() {
  if (mpNew()) return mpBuildNew();
  const s = MP.s, W = Math.round(MP_W() * s), H = Math.round(MP_H() * s), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.setTransform(s, 0, 0, s, -RMX0 * s, 0);
  const sv = { cx: RM.cx, cy: RM.cy, v0: RM.v0, v1: RM.v1, g60: RM.g60, vy0: RM.vy0, vy1: RM.vy1, z: RM.z }; RM.v0 = RMX0; RM.v1 = RMW; RM.g60 = Math.floor(RMX0 / 60) * 60; RM.vy0 = 0; RM.vy1 = RMH;
  const oth = RM.others; RM.others = {};
  try { rmBg(g, 0); } catch (e) {} try { rmPathGround(g); } catch (e) {} try { rmXGround(g); } catch (e) {}
  const L = RM_DECOR.map(d => [d.y, d.f]); try { rmXOutList(L); } catch (e) {}
  L.sort((a, b) => a[0] - b[0]).forEach(it => { try { g.save(); it[1](g); } catch (e) {} finally { g.restore(); } });
  RM.others = oth; Object.assign(RM, { cx: sv.cx, cy: sv.cy, v0: sv.v0, v1: sv.v1, g60: sv.g60, vy0: sv.vy0, vy1: sv.vy1 });
  // لمسة خريطة: تشبع خفيف + إطار
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(255,250,235,.08)'; g.fillRect(0, 0, W, H);
  MP.imgs = MP.imgs || {}; MP.imgs.main = { cv, at: Date.now() };
}
function mpBuildNew() {
  const s = 0.5, X0 = MP_X0(), W = Math.round(MP_W() * s), H = Math.round(MP_H() * s), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.setTransform(s, 0, 0, s, -X0 * s, 0);
  const sv = { v0: RM.v0, v1: RM.v1, g60: RM.g60, vy0: RM.vy0, vy1: RM.vy1, tap: RM.tapMk, c1: R3.cap2.say }; RM.v0 = X0; RM.v1 = X0 + MP_W(); RM.vy0 = 0; RM.vy1 = MP_H(); RM.tapMk = null; R3.cap2.say = null;
  try { r3NewBg(g); } catch (e) {}
  try { r3NewList().sort((a, b) => a[0] - b[0]).forEach(it => { try { g.save(); it[1](g); } catch (e) {} finally { g.restore(); } }); } catch (e) {}
  Object.assign(RM, { v0: sv.v0, v1: sv.v1, g60: sv.g60, vy0: sv.vy0, vy1: sv.vy1, tapMk: sv.tap }); R3.cap2.say = sv.c1;
  // منطقة البناء المخططة (خطوط متقطعة) حتى الخريطة تبين وين راح تنبني الأشياء
  g.setTransform(s, 0, 0, s, -X0 * s, 0); g.setLineDash([18, 12]); g.lineWidth = 5; g.strokeStyle = 'rgba(232,162,26,.85)'; g.fillStyle = 'rgba(255,214,110,.16)'; [[R3_N.x0 + 1040, 300, 480, 600]].forEach(b => { g.fillRect(b[0], b[1], b[2], b[3]); g.strokeRect(b[0], b[1], b[2], b[3]); }); g.setLineDash([]);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(255,250,235,.08)'; g.fillRect(0, 0, W, H);
  MP.imgs = MP.imgs || {}; MP.imgs.new = { cv, at: Date.now() };
}
function mpCss() {
  if ($('mpCss')) return; const st = document.createElement('style'); st.id = 'mpCss';
  st.textContent = '#mpBtn{position:absolute;left:10px;top:142px;z-index:8;pointer-events:auto;width:52px;height:52px;border-radius:16px;border:2px solid #fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:0;font-size:22px;line-height:1;background:linear-gradient(160deg,#ffd166,#ff9f1c);color:#3a2200;box-shadow:0 4px 14px rgba(0,0,0,.3);animation:mpBob 3s ease-in-out infinite}#mpBtn small{font-size:9.5px;font-weight:900;margin-top:2px}@keyframes mpBob{50%{transform:translateY(-3px)}}#rmBox.rmTiny #mpBtn{top:96px;width:44px;height:44px;font-size:18px}' +
    '#mpOv{position:absolute;inset:0;z-index:70;display:flex;flex-direction:column;background:radial-gradient(circle at 50% 0,#243a6a,#0d1428 70%);color:#fff;animation:mpIn .25s ease;direction:rtl}@keyframes mpIn{from{opacity:0;transform:scale(.98)}}' +
    '#mpOv .mpH{display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 12px 8px}#mpOv .mpH .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:24px;background:linear-gradient(135deg,#ffd166,#ff9f1c);box-shadow:0 4px 14px rgba(255,159,28,.4)}#mpOv .mpH b{font-size:18px;display:block}#mpOv .mpH small{font-size:11.5px;opacity:.8}#mpOv .mpH .x{margin-inline-start:auto;width:38px;height:38px;border-radius:50%;border:0;font-size:18px;font-weight:900;background:rgba(255,255,255,.14);color:#fff}' +
    '#mpOv .mpC{position:relative;flex:1;margin:0 10px;border-radius:18px;overflow:hidden;border:3px solid #e8c77a;box-shadow:0 0 0 2px #6a4a1a,0 10px 30px rgba(0,0,0,.5);background:#7fd0f2;touch-action:none}#mpOv canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}' +
    '#mpOv .mpZ{position:absolute;inset-inline-end:10px;bottom:10px;display:flex;flex-direction:column;gap:6px}#mpOv .mpZ button{width:42px;height:42px;border-radius:12px;border:0;font-size:20px;font-weight:900;background:rgba(255,255,255,.94);color:#1a2a4a;box-shadow:0 3px 10px rgba(0,0,0,.3)}' +
    '#mpOv.nw{background:radial-gradient(circle at 50% 0,#5a2a9a,#1a0e38 70%)}#mpOv.nw .mpH .ic{background:linear-gradient(135deg,#c06aff,#7a2ad8);box-shadow:0 4px 14px rgba(122,42,216,.45)}#mpOv.nw .mpC{border-color:#c9a2ff;box-shadow:0 0 0 2px #4a1a8a,0 10px 30px rgba(0,0,0,.5)}' +
    '#mpOv .mpLoad{position:absolute;inset:0;display:grid;place-items:center;font-weight:900;font-size:15px;background:rgba(13,20,40,.7)}' +
    '#mpOv .mpL{display:flex;gap:6px;overflow-x:auto;padding:10px 10px calc(10px + env(safe-area-inset-bottom));scrollbar-width:none}#mpOv .mpL::-webkit-scrollbar{display:none}#mpOv .mpL button{flex:none;border:0;border-radius:14px;padding:8px 12px;font-weight:900;font-size:12.5px;color:#fff;box-shadow:0 3px 0 rgba(0,0,0,.25)}' +
    '#mpOv .mpCard{position:absolute;left:10px;right:10px;bottom:10px;margin-inline-end:52px;background:rgba(255,255,255,.97);color:#1a2a4a;border-radius:16px;padding:10px 12px;display:flex;gap:10px;align-items:center;box-shadow:0 8px 24px rgba(0,0,0,.35);animation:mpIn .2s ease}#mpOv .mpCard .e{font-size:30px}#mpOv .mpCard .t{flex:1;min-width:0}#mpOv .mpCard b{display:block;font-size:14.5px}#mpOv .mpCard small{font-size:11.5px;opacity:.75}#mpOv .mpCard button{border:0;border-radius:12px;padding:9px 10px;font-weight:900;font-size:12.5px;color:#fff;background:linear-gradient(180deg,#3ddc84,#16a34a);box-shadow:0 3px 0 #0e6b31;white-space:nowrap}#mpOv .mpCard button.tp{background:linear-gradient(180deg,#ffd166,#ff9f1c);box-shadow:0 3px 0 #a85a00;color:#3a2200}#mpOv .mpCard .cx{background:#eef;color:#556;box-shadow:none;padding:6px 9px}';
  document.head.appendChild(st);
}
function mpBtnAdd() {
  const ov = $('rmOv'); if (!ov || $('mpBtn')) return; mpCss();
  const b = document.createElement('button'); b.id = 'mpBtn'; b.type = 'button'; b.innerHTML = '🗺️<small>الخريطة</small>'; b.onclick = mpOpen; ov.appendChild(b);
}
setInterval(() => { try { if (RM.on) mpBtnAdd(); } catch (e) {} }, 1500);

/* ---- فتح الخريطة ---- */
function mpOpen() {
  mpCss(); const box = $('rmBox'); if (!box || $('mpOv')) return; MP.sel = null;
  const ov = document.createElement('div'); ov.id = 'mpOv';
  const NW = mpNew(); MP.w = mpWorld(); if (NW) ov.classList.add('nw');
  ov.innerHTML = '<div class="mpH"><div class="ic">' + (NW ? '❄️' : '🗺️') + '</div><div><b>' + (NW ? 'خريطة الشمال' : 'خريطة المنتجع') + '</b><small>اسحب للتنقل • قرّب بإصبعين • دوس على أي مكان</small></div><button type="button" class="x">✕</button></div><div class="mpC"><canvas></canvas><div class="mpLoad">⏳ دا نرسم الخريطة...</div><div class="mpZ"><button type="button" data-z="in">＋</button><button type="button" data-z="out">－</button><button type="button" data-z="me">📍</button><button type="button" data-z="all">🌐</button></div></div><div class="mpL"></div>';
  box.appendChild(ov); ov.querySelector('.x').onclick = mpClose;
  const C = ov.querySelector('.mpC'), cv = ov.querySelector('canvas');
  const Lg = ov.querySelector('.mpL'); const GN = NW ? MP_GN2 : MP_GN; Object.keys(GN).forEach(k => { const b = document.createElement('button'); b.type = 'button'; b.textContent = GN[k]; b.style.background = MP_GC[k]; b.onclick = () => { const ps = mpPlaces().filter(p => p.g === k); const x = ps.reduce((a, p) => a + p.x, 0) / ps.length, y = ps.reduce((a, p) => a + p.y, 0) / ps.length; mpFly(x, y, Math.max(MP.k, mpFit() * 3.2)); }; Lg.appendChild(b); }); if (NW) { const b = document.createElement('button'); b.type = 'button'; b.textContent = '✈️ ارجع لمنتجع بابيت'; b.style.background = '#2a6ad8'; b.onclick = () => { mpClose(); try { r3FlyBack(); } catch (e) {} }; Lg.appendChild(b); }
  ov.querySelectorAll('.mpZ button').forEach(b => b.onclick = () => { const z = b.dataset.z, r = C.getBoundingClientRect(); if (z === 'in') mpZoomAt(r.width / 2, r.height / 2, 1.5); else if (z === 'out') mpZoomAt(r.width / 2, r.height / 2, 1 / 1.5); else if (z === 'me') { const p = mpMePos(); mpFly(p.x, p.y, Math.max(MP.k, mpFit() * 4)); } else mpFly(MP_X0() + MP_W() / 2, MP_H() / 2, mpFit()); });
  const go = () => {
    const I = (MP.imgs || {})[MP.w]; if (!I || Date.now() - I.at > 300000) mpBuild(); MP.img = MP.imgs[MP.w].cv; const ld = ov.querySelector('.mpLoad'); if (ld) ld.remove();
    const r = C.getBoundingClientRect(), p = mpMePos(); MP.k = Math.max(mpFit(), Math.min(0.5, r.width / (MP.w === 'new' ? 950 : 1700))); MP.ox = r.width / 2 - (p.x - MP_X0()) * MP.k; MP.oy = r.height / 2 - p.y * MP.k; mpClampView();
    mpBind(C, cv); cancelAnimationFrame(MP.raf); const loop = () => { if (!$('mpOv')) return; mpDraw(cv, C); MP.raf = requestAnimationFrame(loop); }; loop();
  };
  setTimeout(go, 30); rxSnd([['sine', 660, 990, 0.18, 0.04]]);
}
function mpClose() { const o = $('mpOv'); if (o) o.remove(); cancelAnimationFrame(MP.raf); }
function mpFit() { const C = document.querySelector('#mpOv .mpC'); if (!C) return 0.05; const r = C.getBoundingClientRect(); return Math.min(r.width / MP_W(), r.height / MP_H()); }
function mpMePos() { const m = RM.me, sid = rmShopId(); if (!sid || sid === 8) return { x: m.x, y: m.y, out: true }; const D = { 1: RM_SHOP, 2: RM_PSHOP, 3: RM_FSHOP, 4: RM_BSHOP, 5: RX_SAL, 6: RX_HT, 7: RX_HT }[sid]; if (D) return { x: D.x, y: D.y + 20, out: false }; return { x: R3_CAP.x, y: R3_CAP.y, out: false, far: true }; }
function mpClampView() { const C = document.querySelector('#mpOv .mpC'); if (!C) return; const r = C.getBoundingClientRect(), w = MP_W() * MP.k, h = MP_H() * MP.k; MP.ox = w < r.width ? (r.width - w) / 2 : Math.min(0, Math.max(r.width - w, MP.ox)); MP.oy = h < r.height ? (r.height - h) / 2 : Math.min(0, Math.max(r.height - h, MP.oy)); }
function mpZoomAt(sx, sy, f) { const k0 = MP.k, k1 = Math.max(mpFit(), Math.min(0.9, k0 * f)); MP.ox = sx - (sx - MP.ox) * k1 / k0; MP.oy = sy - (sy - MP.oy) * k1 / k0; MP.k = k1; mpClampView(); }
function mpFly(x, y, k) { const C = document.querySelector('#mpOv .mpC'); if (!C) return; const r = C.getBoundingClientRect(), k0 = MP.k, ox0 = MP.ox, oy0 = MP.oy, k1 = Math.max(mpFit(), Math.min(0.9, k)); let t = 0; const ox1 = r.width / 2 - (x - MP_X0()) * k1, oy1 = r.height / 2 - y * k1; const st = () => { t = Math.min(1, t + 0.08); const e = 1 - Math.pow(1 - t, 3); MP.k = k0 + (k1 - k0) * e; MP.ox = ox0 + (ox1 - ox0) * e; MP.oy = oy0 + (oy1 - oy0) * e; mpClampView(); if (t < 1) requestAnimationFrame(st); }; st(); }
function mpBind(C, cv) {
  const pt = e => { const r = C.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.onpointerdown = e => { try { cv.setPointerCapture(e.pointerId); } catch (er) {} MP.ptrs.set(e.pointerId, pt(e)); MP.moved = 0; if (MP.ptrs.size === 2) { const [a, b] = [...MP.ptrs.values()]; MP.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: MP.k, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 }; } else MP.drag = { p: pt(e), ox: MP.ox, oy: MP.oy }; };
  cv.onpointermove = e => { if (!MP.ptrs.has(e.pointerId)) return; MP.ptrs.set(e.pointerId, pt(e)); if (MP.ptrs.size >= 2 && MP.pinch) { const [a, b] = [...MP.ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); mpZoomAt(MP.pinch.cx, MP.pinch.cy, (MP.pinch.k * d / MP.pinch.d) / MP.k); MP.moved = 99; return; } if (MP.drag) { const p = pt(e), dx = p[0] - MP.drag.p[0], dy = p[1] - MP.drag.p[1]; MP.moved = Math.max(MP.moved, Math.hypot(dx, dy)); MP.ox = MP.drag.ox + dx; MP.oy = MP.drag.oy + dy; mpClampView(); } };
  const up = e => { const was = MP.ptrs.size; MP.ptrs.delete(e.pointerId); if (MP.ptrs.size < 2) MP.pinch = null; if (!MP.ptrs.size) { const tap = MP.moved < 6 && was === 1; MP.drag = null; if (tap) mpTap(pt(e)); } else { const p = [...MP.ptrs.values()][0]; MP.drag = { p, ox: MP.ox, oy: MP.oy }; } };
  cv.onpointerup = up; cv.onpointercancel = up;
  cv.onwheel = e => { e.preventDefault(); const p = pt(e); mpZoomAt(p[0], p[1], e.deltaY < 0 ? 1.15 : 1 / 1.15); };
}
function mpVisible(p) { const f = mpFit(); if (MP.w === 'new') return p.lv < 3 || MP.k > f * 2; return p.lv === 1 || (p.lv === 2 && MP.k > f * 2.2) || (p.lv === 3 && MP.k > f * 4.5); }
function mpTap(sp) {
  const L = mpPlaces().filter(mpVisible); let best = null, bd = 34;
  L.forEach(p => { const x = MP.ox + (p.x - MP_X0()) * MP.k, y = MP.oy + p.y * MP.k - 18, d = Math.hypot(x - sp[0], y - sp[1]); if (d < bd) { bd = d; best = p; } });
  if (!best) { const wx = MP_X0() + (sp[0] - MP.ox) / MP.k, wy = (sp[1] - MP.oy) / MP.k; best = { e: '📍', n: 'هذا المكان', x: wx, y: wy, d: 'دوس «امشي هناك» وشخصيتك تروح', g: '', free: 1 }; }
  MP.sel = best; mpCard();
}
function mpCard() {
  const ov = $('mpOv'); if (!ov) return; const C = ov.querySelector('.mpC'); let K = C.querySelector('.mpCard'); if (K) K.remove(); const p = MP.sel; if (!p) return;
  K = document.createElement('div'); K.className = 'mpCard'; const e = document.createElement('div'); e.className = 'e'; e.textContent = p.e; const t = document.createElement('div'); t.className = 't'; const b = document.createElement('b'); b.textContent = p.n; const sm = document.createElement('small'); sm.textContent = p.d || ''; t.append(b, sm); K.append(e, t);
  const NW = MP.w === 'new', tx = NW ? Math.max(R3_N.x0 + 24, Math.min(R3_N.x1 - 24, p.x)) : Math.max(RMX0 + 24, Math.min(RMW - 24, p.x)), ty = NW ? Math.max(240, Math.min(980, p.y + 24)) : Math.max(214, Math.min(RM_WALK, p.y + 24));
  const w = document.createElement('button'); w.type = 'button'; w.textContent = '🚶 امشي هناك'; w.onclick = () => { if (NW ? rmShopId() !== 8 : rmShopId() !== 0) { showToast(rmShopId() === 8 ? '✈️ إنت بالشمال — ارجع بالطيارة أول' : '🚪 اطلع من المكان أول حتى تمشي'); return; } mpClose(); rmWalkTo(tx, ty); try { rmTapMark(RM.me.tx, RM.me.ty); } catch (er) {} showToast('🚶 دا تمشي لـ ' + p.n); }; K.appendChild(w);
  if (RM.myAdm || (auth && auth.admin)) { const q = document.createElement('button'); q.type = 'button'; q.className = 'tp'; q.textContent = '📍 انتقل'; q.onclick = () => { mpClose(); try { rmTpTo(tx, ty); } catch (er) {} }; K.appendChild(q); }
  const x = document.createElement('button'); x.type = 'button'; x.className = 'cx'; x.textContent = '✕'; x.onclick = () => { MP.sel = null; K.remove(); }; K.appendChild(x);
  C.appendChild(K);
}
/* ---- الرسم كل فريم (صورة جاهزة + دبابيس) ---- */
function mpDraw(cv, C) {
  const r = C.getBoundingClientRect(), dp = Math.min(2, window.devicePixelRatio || 1), W = r.width, H = r.height; if (cv.width !== Math.round(W * dp) || cv.height !== Math.round(H * dp)) { cv.width = Math.round(W * dp); cv.height = Math.round(H * dp); }
  const g = cv.getContext('2d'), k = MP.k, T = performance.now() / 1000; g.setTransform(dp, 0, 0, dp, 0, 0); g.fillStyle = '#2aa9dd'; g.fillRect(0, 0, W, H);
  if (MP.img) { g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(MP.img, MP.ox, MP.oy, MP_W() * k, MP_H() * k); }
  const X = x => MP.ox + (x - MP_X0()) * k, Y = y => MP.oy + y * k, f = mpFit();
  // أسماء المناطق
  if (k > f * 1.4) MP_ZONES().forEach(z => { const x = X(z[1]), y = Y(z[2]); if (x < -100 || x > W + 100 || y < -30 || y > H + 30) return; g.save(); try { g.direction = 'rtl'; } catch (e) {} g.font = 'bold ' + Math.round(Math.max(12, Math.min(20, k * 60))) + 'px Lalezar, Cairo, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = 'rgba(20,20,40,.55)'; g.strokeText(z[0], x, y); g.fillStyle = 'rgba(255,255,255,.95)'; g.fillText(z[0], x, y); g.restore(); });
  // الدبابيس
  const L = mpPlaces().filter(mpVisible); const boxes = [];
  L.sort((a, b) => a.lv - b.lv).forEach(p => {
    const x = X(p.x), y = Y(p.y); if (x < -80 || x > W + 80 || y < -40 || y > H + 60) return; const col = MP_GC[p.g] || '#555', sel = MP.sel && MP.sel.n === p.n;
    g.save(); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, y, 7, 2.6, 0, 0, 7); g.fill();
    const py = y - 18 - (sel ? Math.abs(Math.sin(T * 4)) * 4 : 0); g.fillStyle = col; g.beginPath(); g.arc(x, py, sel ? 15 : 13, Math.PI * 0.8, Math.PI * 2.2); g.lineTo(x, y - 1); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    g.font = (sel ? 15 : 13) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.e, x, py + 0.5);
    // الاسم (نتجنب التداخل)
    g.font = 'bold 11px Cairo, system-ui, Arial'; try { g.direction = 'rtl'; } catch (e) {} const tw = g.measureText(p.n).width + 14, bx = x - tw / 2, by = py - 38; const hit = boxes.some(b => bx < b[2] && bx + tw > b[0] && by < b[3] && by + 20 > b[1]);
    if (!hit || sel || p.lv === 1) { boxes.push([bx, by, bx + tw, by + 20]); g.fillStyle = sel ? col : 'rgba(255,255,255,.96)'; g.beginPath(); g.roundRect ? g.roundRect(bx, by, tw, 20, 10) : g.rect(bx, by, tw, 20); g.fill(); g.strokeStyle = col; g.lineWidth = 1.5; g.stroke(); g.fillStyle = sel ? '#fff' : '#1a2a4a'; g.fillText(p.n, x, by + 10.5); }
    g.restore();
  });
  // الناس (نقاط زرقة) ومكانك
  const sid0 = MP.w === 'new' ? 8 : 0; Object.values(RM.others).forEach(o => { if (o.hid || rmShopId(o) !== sid0) return; const x = X(o.x), y = Y(o.y); if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return; g.fillStyle = '#38bdf8'; g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y - 4, 4.5, 0, 7); g.fill(); g.stroke(); if (k > f * 3) { g.font = 'bold 9.5px Cairo, Arial'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(o.name, x, y - 13); g.fillStyle = '#fff'; g.fillText(o.name, x, y - 13); } });
  const me = mpMePos(), mx = X(me.x), my = Y(me.y), pu = (T * 1.2) % 1;
  g.strokeStyle = 'rgba(255,59,107,' + (1 - pu) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(mx, my - 4, 8 + pu * 22, 0, 7); g.stroke();
  g.fillStyle = '#ff3b6b'; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.arc(mx, my - 4, 7, 0, 7); g.fill(); g.stroke();
  g.save(); try { g.direction = 'rtl'; } catch (e) {} g.font = 'bold 11.5px Cairo, Arial'; g.textAlign = 'center'; const lab = me.far ? '✈️ إنت بالشمال' : me.out ? '📍 إنت هنا' : '📍 إنت جوّه'; const tw = g.measureText(lab).width + 16; g.fillStyle = '#ff3b6b'; g.beginPath(); g.roundRect ? g.roundRect(mx - tw / 2, my + 8, tw, 20, 10) : g.rect(mx - tw / 2, my + 8, tw, 20); g.fill(); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(lab, mx, my + 18.5); g.restore();
  // بوصلة
  g.save(); g.translate(28, 30); g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(0, 0, 19, 0, 7); g.fill(); g.strokeStyle = '#c9a24a'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#e0344a'; g.beginPath(); g.moveTo(0, -15); g.lineTo(5, 0); g.lineTo(-5, 0); g.fill(); g.fillStyle = '#2a3a55'; g.beginPath(); g.moveTo(0, 15); g.lineTo(5, 0); g.lineTo(-5, 0); g.fill(); g.font = 'bold 8px Arial'; g.textAlign = 'center'; g.fillStyle = '#e0344a'; g.fillText('ش', 0, -6); g.restore();
  // مقياس صغير
  const sc = 200 * k; if (sc > 20) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(12, H - 22, sc, 4); g.font = 'bold 9px Cairo, Arial'; g.textAlign = 'left'; g.fillText('20 خطوة', 12, H - 28); }
}
