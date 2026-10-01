/*
 * בדיקות על הלוגיקה הטהורה. הרצה: node tests/run.js · יציאה 0 = הכול עבר.
 */
'use strict';
const path = require('path');
const assert = require('assert');

['config', 'data', 'match', 'store', 'router', 'log', 'scheduler', 'assist', 'listing', 'strings']
  .forEach((f) => require(path.join(__dirname, '..', 'js', f + '.js')));
const { config: cfg, data, match: M, assist, listing, createStore, createScheduler } = globalThis.Dira;

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}
function section(title) { console.log('\n' + title); }

const apts = data.apartments.map(M.normalize);
const ctx = (tune) => ({ categories: data.categories, tune: tune || { n: 0, f: {}, h: {}, rooms: 0, rent: 0 }, cfg });
const ids = (list) => list.map((a) => a.id);
const byId = (id) => apts.find((a) => a.id === id);
const memStorage = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, dump: m }; };
const addDays = (iso, n) => new Date(Date.UTC(...iso.split('-').map((x, i) => Number(x) - (i === 1 ? 1 : 0))) + n * 86400000).toISOString().slice(0, 10);

/* ——— הכרעה 11 ——— */
section('כלל «מתאים» (הכרעה 11)');
const expected = { s1: true, s2: false, s3: true, s4: false, s5: false, s6: false };
test('6 המחפשים מקבלים בדיוק את התוצאה הצפויה', () => {
  const got = {};
  data.seekers.forEach((s) => { got[s.id] = M.fit(s, data.ownerApt, cfg).ok; });
  assert.deepStrictEqual(got, expected);
});
test('s2 ו-s6 נופלים על תשלום, s4 ו-s5 על תאריך', () => {
  const f = (id) => M.fit(data.seekers.find((s) => s.id === id), data.ownerApt, cfg);
  assert.strictEqual(f('s2').pay, false); assert.strictEqual(f('s2').date, true);
  assert.strictEqual(f('s6').pay, false);
  assert.strictEqual(f('s4').pay, true); assert.strictEqual(f('s4').date, false);
  assert.strictEqual(f('s5').pay, true); assert.strictEqual(f('s5').date, false);
});
const probe = (days, payMax) => M.fit({ payMax: payMax || 9999, entry: addDays(data.ownerApt.entry, days) }, data.ownerApt, cfg);
test('כניסה 31 יום מוקדם = לא מתאים', () => assert.strictEqual(probe(-31).ok, false));
test('כניסה יום אחד מוקדם = לא מתאים (בלי Math.abs)', () => assert.strictEqual(probe(-1).ok, false));
test('כניסה ביום עצמו ו-30 יום אחריו = מתאים', () => { assert.strictEqual(probe(0).ok, true); assert.strictEqual(probe(30).ok, true); });
test('כניסה 31 יום אחרי = לא מתאים', () => assert.strictEqual(probe(31).ok, false));
test('תשלום שווה לשכר הדירה = מכסה', () => assert.strictEqual(probe(0, data.ownerApt.rent).pay, true));
test('נפשות לא משנות את התוצאה', () => {
  const s = Object.assign({}, data.seekers[0]);
  const a = M.fit(Object.assign({}, s, { occupants: 1 }), data.ownerApt, cfg).ok;
  const b = M.fit(Object.assign({}, s, { occupants: 9 }), data.ownerApt, cfg).ok;
  assert.strictEqual(a, b);
});

/* ——— הכרעה 16 ——— */
section('סינון (הכרעה 16)');
const filt = (f) => ids(apts.filter((a) => M.passes(a, f, ctx())));
test('עד 4,500 ⟵ a2, a3, a9, a12', () => assert.deepStrictEqual(filt({ max: 4500 }), ['a2', 'a3', 'a9', 'a12']));
test('עד 4,500 ועוד 2 חדרי שינה ⟵ a2, a12', () => assert.deepStrictEqual(filt({ max: 4500, beds: 2 }), ['a2', 'a12']));
test('חדרי רחצה 2+ ⟵ 5 דירות', () => assert.deepStrictEqual(filt({ baths: 2 }), ['a4', 'a5', 'a10', 'a14', 'a15']));
test('מ״ר 100+ ⟵ a4, a14', () => assert.deepStrictEqual(filt({ sqm: 100 }), ['a4', 'a14']));
test('קטגוריה «מרפסת» ⟵ 10 דירות, כולן עם מרפסת', () => {
  const r = filt({ cats: ['balcony'] });
  assert.strictEqual(r.length, 10);
  r.forEach((id) => assert.ok(byId(id).features.includes('מרפסת')));
});
test('שתי קטגוריות יחד: נוף לים וחניה ⟵ a14', () => assert.deepStrictEqual(filt({ cats: ['sea', 'parking'] }), ['a14']));
test('חיפוש חופשי «כרמל מרפסת» ⟵ a1, a6, a11', () => assert.deepStrictEqual(filt({ q: 'כרמל מרפסת' }), ['a1', 'a6', 'a11']));
test('חיפוש חופשי עם תחילית «בהדר» ⟵ a3, a9, a12', () => assert.deepStrictEqual(filt({ q: 'בהדר' }), ['a3', 'a9', 'a12']));
test('שילוב: חיפוש, מחיר וקטגוריה', () => assert.deepStrictEqual(filt({ q: 'חיפה', max: 5000, cats: ['pets'] }), ['a2', 'a12']));
test('«הקריות» ⟵ 4 דירות בקריות', () => assert.deepStrictEqual(filt({ places: ['הקריות'] }), ['a5', 'a7', 'a10', 'a13']));
test('סינון ריק = כל 15', () => { assert.strictEqual(filt(null).length, 15); assert.strictEqual(filt({ label: 'ai', feats: [] }).length, 15); });

/* ——— הכרעה 7 ——— */
section('דמיון לכוכבים (הכרעה 7)');
test('אחרי כוכב על דירה בהדר, דירה בהדר עולה לפני כל דירה בקריות', () => {
  const tune = M.learnStar({ n: 0, f: {}, h: {}, rooms: 0, rent: 0 }, byId('a3'));
  const st = { swiped: { a3: 'U' }, filter: null, pen: {}, tune };
  const order = ids(M.deckOrder(apts, st, ctx(tune)));
  const hadar = order.indexOf('a9');
  ['a5', 'a7', 'a10', 'a13'].forEach((k) => assert.ok(hadar < order.indexOf(k), `a9 (${hadar}) לפני ${k} (${order.indexOf(k)})`));
});
test('בלי כוכבים הערימה בסדר המקורי', () => {
  const order = ids(M.deckOrder(apts, { swiped: {}, filter: null, pen: {}, tune: { n: 0, f: {}, h: {}, rooms: 0, rent: 0 } }, ctx()));
  assert.deepStrictEqual(order, ids(apts));
});
test('דירה שפרסמת עולה ראשונה', () => {
  const mine = Object.assign({}, byId('a9'), { id: 'm1', mine: true });
  const order = ids(M.deckOrder([].concat(apts, [mine]), { swiped: {}, filter: null, pen: {}, tune: { n: 0, f: {}, h: {}, rooms: 0, rent: 0 } }, ctx()));
  assert.strictEqual(order[0], 'm1');
});
test('✕ על דירה יקרה מלמד «מחיר», ודירות יקרות יורדות', () => {
  const { pen, reason } = M.learnNope({}, byId('a14'), cfg);
  assert.strictEqual(reason.kind, 'price');
  const order = ids(M.deckOrder(apts, { swiped: { a14: 'L' }, filter: null, pen, tune: { n: 0, f: {}, h: {}, rooms: 0, rent: 0 } }, ctx()));
  assert.ok(order.indexOf('a4') > order.indexOf('a2'));
});
test('✕ על דירה בלי מרפסת מלמד «מרפסת», ועל דירה עם מרפסת מלמד «שכונה»', () => {
  assert.strictEqual(M.learnNope({}, byId('a3'), cfg).reason.kind, 'balcony');
  const r = M.learnNope({}, byId('a2'), cfg).reason;
  assert.deepStrictEqual(r, { kind: 'hood', hood: 'נווה שאנן' });
});

/* ——— הכרעה 24 ——— */
section('הרחבת הטווח (הכרעה 24)');
test('מחיר: מרחיבה עד המחיר של הדירה הזולה הבאה', () => {
  const swiped = {}; filt({ max: 4500 }).forEach((id) => { swiped[id] = 'L'; });
  const w = M.widen({ max: 4500 }, apts, swiped, ctx());
  assert.strictEqual(w.filter.max, 4600);
  assert.ok(apts.some((a) => !swiped[a.id] && M.passes(a, w.filter, ctx())));
});
test('קטגוריה «מרפסת» שהתרוקנה ⟵ מורידה את הקטגוריה ומחזירה דירות', () => {
  const swiped = {}; filt({ cats: ['balcony'] }).forEach((id) => { swiped[id] = 'R'; });
  const w = M.widen({ cats: ['balcony'] }, apts, swiped, ctx());
  assert.deepStrictEqual(w.changes, [{ kind: 'cat', value: 'balcony' }]);
  assert.strictEqual(w.filter, null);
  assert.strictEqual(apts.filter((a) => !swiped[a.id] && M.passes(a, w.filter, ctx())).length, 5);
});
test('כשכל הדירות הוחלקו אין הרחבה', () => {
  const swiped = {}; apts.forEach((a) => { swiped[a.id] = 'L'; });
  assert.strictEqual(M.widen({ max: 4000 }, apts, swiped, ctx()), null);
});

/* ——— עוזר ——— */
section('פענוח בקשה לעוזר (הכרעה 18)');
test('«3 חדרים עם מרפסת עד 5500 בכרמל»', () => {
  const r = assist.parse('3 חדרים עם מרפסת עד 5500 בכרמל');
  assert.strictEqual(r.understood, true);
  assert.deepStrictEqual(r.filter, { rooms: 3, max: 5500, feats: ['מרפסת'], places: ['כרמל'] });
});
test('«שלום» ⟵ לא מובן', () => assert.strictEqual(assist.parse('שלום').understood, false));
test('«עד 4.5 אלף בקריות» ⟵ 4,500 והקריות', () => assert.deepStrictEqual(assist.parse('עד 4.5 אלף בקריות').filter, { max: 4500, feats: [], places: ['הקריות'] }));
test('«ים» כמילה = נוף לים, «משלים» לא', () => {
  assert.deepStrictEqual(assist.parse('דירה ליד הים').filter.feats, ['נוף לים']);
  assert.deepStrictEqual(assist.parse('2 חדרים משלים').filter.feats, []);
});
test('חיפוש שלא מוצא הכול יחד מוריד תנאי ואומר מה', () => {
  const r = assist.search('5 חדרים עם גינה', apts, ctx());
  assert.strictEqual(r.understood, true);
  assert.deepStrictEqual(r.dropped, [{ kind: 'feat', value: 'גינה' }]);
  assert.deepStrictEqual(r.ids, ['a14']);
});
test('«3 חדרים עם מרפסת עד 5500 בכרמל» ⟵ a1', () => assert.deepStrictEqual(assist.search('3 חדרים עם מרפסת עד 5500 בכרמל', apts, ctx()).ids, ['a1']));

/* ——— כתיבה אוטומטית ——— */
section('כתיבה אוטומטית (הכרעה 19)');
const form = (o) => Object.assign(listing.emptyDraft(), o);
const forms = [
  [form({ city: 'חיפה', street: 'רחוב הרצל', beds: '2', cond: 'משופצת', features: ['מרפסת', 'ממ"ד'], parking: '1', sqm: '80', floor: '3', floors: '4' }),
    'דירת 3 חדרים משופצת עם מרפסת, חניה וממ"ד ברחוב הרצל',
    'דירת 3 חדרים משופצת ברחוב הרצל, חיפה. 80 מ״ר, קומה 3 מתוך 4. בדירה: מרפסת, ממ"ד. חניה צמודה.'],
  [form({ city: 'נשר', street: '', type: 'דירת גן', beds: '3', cond: 'שמורה מאוד', sqm: '110', floor: '0' }),
    'דירת גן 4 חדרים שמורה',
    'דירת גן 4 חדרים שמורה בנשר. 110 מ״ר, קומת קרקע.'],
  [form({ city: 'חיפה', street: 'שדרות הנשיא', type: 'פנטהאוז', beds: '4', cond: 'חדשה מהקבלן', features: ['מרפסת', 'מיזוג'], acType: 'מזגן מרכזי', parking: '2' }),
    'פנטהאוז 5 חדרים חדש עם מרפסת וחניה בשדרות הנשיא',
    'פנטהאוז 5 חדרים חדש בשדרות הנשיא, חיפה. בדירה: מרפסת, מזגן מרכזי. 2 חניות צמודות.'],
  [form({ city: 'קריית אתא', street: 'רחוב העצמאות', beds: '1', cond: 'במצב טוב', features: ['מחסן', 'חניה'] }),
    'דירת 2 חדרים עם חניה ברחוב העצמאות',
    'דירת 2 חדרים ברחוב העצמאות, קריית אתא. בדירה: מחסן.']
];
forms.forEach(([d, title, desc], i) => {
  test(`טופס ${i + 1}: כותרת`, () => assert.strictEqual(listing.autoTitle(d, data.types), title));
  test(`טופס ${i + 1}: תיאור`, () => assert.strictEqual(listing.autoDesc(d, data.types), desc));
});
test('שלב 1 ריק ⟵ 3 שגיאות', () => assert.deepStrictEqual(Object.keys(listing.validate('addr', listing.emptyDraft(), data)), ['city', 'street', 'houseNo']));
test('ערבות «כן» בלי סכום ⟵ שגיאה', () => assert.deepStrictEqual(Object.keys(listing.validate('pay', form({ guarantee: 'yes' }), data)), ['guaranteeAmt']));
test('מיזוג בלי סוג ⟵ שגיאה', () => assert.ok('acType' in listing.validate('details', form({ rent: '4000', sqm: '70', features: ['מיזוג'] }), data)));
test('טלפון קצר מדי ⟵ שגיאה', () => assert.ok('phone' in listing.validate('contact', form({ phone: '050' }), data)));
test('טופס מלא ⟵ דירה עם כל השדות', () => {
  const a = listing.toApartment(form({ city: 'חיפה', street: 'רחוב הרצל', houseNo: '5', rent: '4,800', sqm: '80', beds: '2', parking: '1', features: ['מיזוג'], acType: 'מזגן מרכזי', name: 'דנה', phone: '0500000000' }),
    { id: 'm1', today: '2026-09-30', cfg, types: data.types });
  assert.strictEqual(a.rent, 4800); assert.strictEqual(a.rooms, 3); assert.strictEqual(a.mine, true);
  assert.deepStrictEqual(a.features, ['מזגנים', 'חניה']);
  assert.ok(a.title && a.desc && cfg.pals.includes(a.pal));
  assert.strictEqual(a.floor, null, 'קומה ריקה אינה קומת קרקע');
});
test('קומה 0 = קרקע, קומה ריקה = לא צוין', () => {
  const D = globalThis.Dira.S.details;
  assert.strictEqual(D.floorVal({ floor: 0, floors: 3 }), 'קרקע');
  assert.strictEqual(D.floorVal({ floor: null }), 'לא צוין');
  assert.strictEqual(D.floorVal({ floor: 3, floors: 5 }), '3 מתוך 5');
});

/* ——— store ——— */
section('store');
test('setState שומר ומודיע לנושא', () => {
  const storage = memStorage();
  const store = createStore({ config: cfg, storage });
  let heard = 0;
  store.subscribe('saved', () => { heard++; });
  store.setState('saved', (s) => { s.saved.a1 = { star: false, t: 1 }; });
  assert.strictEqual(heard, 1);
  assert.deepStrictEqual(JSON.parse(storage.dump[cfg.storageKey]).saved, { a1: { star: false, t: 1 } });
  const again = createStore({ config: cfg, storage });
  assert.deepStrictEqual(again.get().saved, { a1: { star: false, t: 1 } });
});
test('טעינה של סכמה ישנה מתאפסת', () => {
  const storage = memStorage();
  storage.setItem(cfg.storageKey, JSON.stringify({ schema: 2, saved: { a1: {} }, likes: [] }));
  const store = createStore({ config: cfg, storage });
  assert.deepStrictEqual(store.get().saved, {});
  assert.strictEqual(store.get().schema, 3);
  assert.ok(!('likes' in store.get()));
});
test('שמירה שבורה מתאפסת', () => {
  const storage = memStorage();
  storage.setItem(cfg.storageKey, '{broken');
  assert.strictEqual(createStore({ config: cfg, storage }).get().schema, 3);
});
test('היומן נחתך ב-logMax', () => {
  const store = createStore({ config: cfg, storage: memStorage() });
  store.setState('log', (s) => { for (let i = 0; i < cfg.logMax + 5; i++) globalThis.Dira.log.push(s, { type: 'swipe' }, i); });
  assert.strictEqual(store.get().log.length, cfg.logMax);
});

/* ——— scheduler ——— */
section('scheduler');
test('פנייה שנשלחה לפני רענון מאושרת אחרי הרענון', () => {
  const storage = memStorage();
  const t0 = 1000000;
  const s1 = createStore({ config: cfg, storage });
  s1.setState('requests', (s) => { s.requests.push({ id: 'a1', t: t0, due: t0 + cfg.approveDelayMs, status: 'wait', seen: false }); });
  /* רענון: store חדש מאותה שמירה, ועבר זמן */
  const s2 = createStore({ config: cfg, storage });
  const timers = [];
  let approved = null;
  createScheduler({ store: s2, now: () => t0 + 5000, setTimer: (fn, ms) => timers.push({ fn, ms }), onApprove: (id) => { approved = id; } }).start();
  assert.strictEqual(timers.length, 1);
  assert.strictEqual(timers[0].ms, 0);
  timers[0].fn();
  assert.strictEqual(approved, 'a1');
  assert.strictEqual(s2.get().requests[0].status, 'match');
  assert.strictEqual(JSON.parse(storage.dump[cfg.storageKey]).requests[0].status, 'match');
});
test('פנייה שעוד לא הגיע זמנה מחכה את הזמן שנשאר', () => {
  const s = createStore({ config: cfg, storage: memStorage() });
  s.setState('requests', (st) => { st.requests.push({ id: 'a2', t: 0, due: 3000, status: 'wait' }); });
  const timers = [];
  createScheduler({ store: s, now: () => 1000, setTimer: (fn, ms) => timers.push(ms) }).start();
  assert.deepStrictEqual(timers, [2000]);
});
test('פנייה מאושרת לא נרשמת שוב, ולא מתוזמנת פעמיים', () => {
  const s = createStore({ config: cfg, storage: memStorage() });
  s.setState('requests', (st) => { st.requests.push({ id: 'a3', t: 0, due: 0, status: 'wait' }, { id: 'a4', t: 0, due: 0, status: 'match' }); });
  const timers = [];
  const sch = createScheduler({ store: s, now: () => 0, setTimer: (fn, ms) => timers.push(fn) });
  sch.start(); sch.start();
  assert.strictEqual(timers.length, 1);
  timers[0](); timers[0]();
  assert.strictEqual(s.get().log.filter((e) => e.type === 'match').length, 1);
});

/* ——— יומן ——— */
section('יומן (הכרעה 23)');
test('המדדים נספרים נכון', () => {
  const log = [
    { type: 'swipe', dir: 'R', ms: 2000 }, { type: 'swipe', dir: 'L', ms: 4000 }, { type: 'swipe', dir: 'U', ms: 3000 },
    { type: 'request' }, { type: 'match', side: 'seeker' }, { type: 'approve' }, { type: 'reject' }, { type: 'exit', ms: 5000 }, { type: 'exit', ms: 50000 }
  ];
  const m = globalThis.Dira.log.metrics(log, cfg);
  assert.deepStrictEqual([m.swipes, m.likes, m.nopes, m.stars, m.secPerCard, m.requests, m.matches, m.approvals, m.rejections, m.quickExits], [3, 1, 1, 1, 3, 1, 1, 1, 1, 1]);
});

/* ——— נתב ——— */
section('נתב');
const { parse } = globalThis.Dira.router;
test('כל 12 הנתיבים מזוהים, עם פרמטרים', () => {
  assert.deepStrictEqual(parse('#/match/a1'), { path: '/match/a1', route: '/match/:id', params: { id: 'a1' }, sheet: null });
  assert.strictEqual(parse('#/owner/chat/s2').params.sid, 's2');
  ['#/deck', '#/favs', '#/categories', '#/ai', '#/publish', '#/owner', '#/log', '#/profile/a1', '#/chat/a1', '#/owner/match/s1']
    .forEach((h) => assert.strictEqual(parse(h).path, h.slice(1)));
});
test('גיליון בכתובת', () => assert.deepStrictEqual(parse('#/deck?s=apt%3Aa9').sheet, { name: 'apt', arg: 'a9' }));
test('קישורים ישנים וכתובת ריקה', () => {
  assert.strictEqual(parse('#owner').route, '/owner');
  assert.strictEqual(parse('#log').route, '/log');
  assert.strictEqual(parse('').route, '/deck');
});
test('נתיב לא מוכר ⟵ ערימה', () => assert.strictEqual(parse('#/nothing/here').route, '/deck'));

/* ——— טקסט ——— */
section('טקסט ממשק');
test('אין «·» בתוך משפט ואין מקף ארוך ב-strings.js', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'js', 'strings.js'), 'utf8');
  const quoted = src.match(/(['`])(?:(?!\1)[^\\\n]|\\.)*\1/g) || [];
  assert.deepStrictEqual(quoted.filter((q) => q.includes('—')), [], 'יש מקף ארוך בטקסט');
  const bad = quoted.filter((q) => /·/.test(q) && q.split(/\s+/).length > 6);
  assert.deepStrictEqual(bad, []);
});

console.log(`\n${fail ? 'FAIL' : 'PASS'} · ${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
