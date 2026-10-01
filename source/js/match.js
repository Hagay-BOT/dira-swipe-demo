/*
 * הלוגיקה של הערימה: כלל «מתאים», סינון, דמיון לכוכבים, למידה מ-✕, והרחבת טווח.
 * פונקציות טהורות בלבד. בלי DOM ובלי מצב גלובלי.
 */
(function (Dira) {
  'use strict';

  const DAY = 86400000;
  const toUTC = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const daysBetween = (later, earlier) => Math.round((toUTC(later) - toUTC(earlier)) / DAY);

  /* הכרעה 11: טווח התשלום מכסה את שכר הדירה, והכניסה בין יום הכניסה של הדירה ל-30 יום אחריו. נפשות לא נספרות. */
  function fit(seeker, apt, cfg) {
    const pay = seeker.payMax >= apt.rent;
    const gap = daysBetween(seeker.entry, apt.entry);
    const date = gap >= 0 && gap <= cfg.entryWindowDays;
    return { pay, date, ok: pay && date };
  }

  /* ——— סינון (הכרעה 16) ——— */
  const hasPrefix = (w) => w.length > 3 && /^[בלהו]/.test(w);
  const looseHas = (hay, w) => hay.includes(w) || (hasPrefix(w) && hay.includes(w.slice(1)));

  function isEmptyFilter(f) {
    if (!f) return true;
    return !(f.q || f.max || f.beds || f.baths || f.sqm || f.rooms || f.foryou ||
      (f.cats && f.cats.length) || (f.feats && f.feats.length) || (f.places && f.places.length));
  }

  /* ctx: { categories, tune, cfg } · נדרש רק כשיש קטגוריות או «מותאם לך» */
  function passes(a, f, ctx) {
    if (isEmptyFilter(f)) return true;
    if (f.max && a.rent > f.max) return false;
    if (f.beds && a.beds < f.beds) return false;
    if (f.baths && a.baths < f.baths) return false;
    if (f.sqm && a.sqm < f.sqm) return false;
    if (f.rooms && a.rooms < f.rooms) return false;
    if (f.cats && f.cats.length) {
      const ok = f.cats.every((id) => {
        const c = ctx.categories.find((x) => x.id === id);
        return !c || !c.test || c.test(a);
      });
      if (!ok) return false;
    }
    if (f.feats && f.feats.length && !f.feats.every((x) => a.features.includes(x))) return false;
    if (f.places && f.places.length && !f.places.some((p) => (p === 'הקריות' ? a.area === 'krayot' : `${a.city} ${a.hood} ${a.street}`.includes(p)))) return false;
    if (f.q) {
      const hay = [a.title, a.street, a.hood, a.city, a.type, a.cond, a.desc].concat(a.features).join(' ');
      if (!f.q.split(/[\s,]+/).filter(Boolean).every((w) => looseHas(hay, w))) return false;
    }
    if (f.foryou && similarity(a, ctx.tune, ctx.cfg) < ctx.cfg.forYouMin) return false;
    return true;
  }

  /* ——— דמיון לכוכבים (הכרעה 7) ——— */
  function similarity(a, tune, cfg) {
    if (!tune || !tune.n) return 0;
    let s = 0;
    a.features.forEach((x) => { s += (tune.f[x] || 0) / tune.n; });
    s += ((tune.h[a.hood] || 0) / tune.n) * cfg.hoodWeight;
    s += Math.max(0, cfg.roomsWeight - Math.abs(a.rooms - tune.rooms / tune.n));
    s += Math.max(0, cfg.rentWeight - Math.abs(a.rent - tune.rent / tune.n) / cfg.rentScale);
    return s;
  }

  function learnStar(tune, a) {
    const t = { n: tune.n + 1, f: Object.assign({}, tune.f), h: Object.assign({}, tune.h), rooms: tune.rooms + a.rooms, rent: tune.rent + a.rent };
    a.features.forEach((x) => { t.f[x] = (t.f[x] || 0) + 1; });
    t.h[a.hood] = (t.h[a.hood] || 0) + 1;
    return t;
  }

  /* ✕ מלמד דבר אחד: מחיר גבוה, בלי מרפסת, או השכונה. מחזיר את הסיבה כדי שהממשק יאמר אותה */
  function learnNope(pen, a, cfg) {
    const p = Object.assign({}, pen);
    let reason;
    if (a.rent > cfg.expensiveFrom) { p.high = (p.high || 0) + 1; reason = { kind: 'price' }; }
    else if (!a.features.includes('מרפסת')) { p.noBalcony = (p.noBalcony || 0) + 1; reason = { kind: 'balcony' }; }
    else { p['hood:' + a.hood] = (p['hood:' + a.hood] || 0) + 1; reason = { kind: 'hood', hood: a.hood }; }
    return { pen: p, reason };
  }

  function penalty(a, pen, cfg) {
    return ((pen['hood:' + a.hood] || 0) +
      (a.features.includes('מרפסת') ? 0 : pen.noBalcony || 0) +
      (a.rent > cfg.expensiveFrom ? pen.high || 0 : 0)) * cfg.penaltyWeight;
  }

  /* סדר הערימה: מה שלא הוחלק ועובר את הסינון. שלך ראשונה, אחר כך לפי דמיון פחות עונש */
  function deckOrder(apts, st, ctx) {
    const cfg = ctx.cfg;
    return apts
      .filter((a) => !st.swiped[a.id] && passes(a, st.filter, ctx))
      .map((a, i) => ({ a, i, s: a.mine ? cfg.mineFirst : penalty(a, st.pen, cfg) - similarity(a, st.tune, cfg) * cfg.similarityWeight }))
      .sort((x, y) => x.s - y.s || x.i - y.i)
      .map((x) => x.a);
  }

  /*
   * הכרעה 24: «הרחבת הטווח» באמת מרחיבה.
   * מרפים תנאי אחרי תנאי עד שיש לפחות דירה אחת שלא הוחלקה. מחזיר null אם גם בלי סינון אין כלום.
   * changes: רשימת מה שהשתנה, כדי שהממשק יאמר אותו.
   */
  function widen(f, apts, swiped, ctx) {
    const left = (g) => apts.filter((a) => !swiped[a.id] && passes(a, g, ctx)).length;
    if (isEmptyFilter(f) || !apts.some((a) => !swiped[a.id])) return null;
    const g = JSON.parse(JSON.stringify(f));
    const changes = [];

    if (g.max) {
      const noMax = Object.assign({}, g, { max: 0 });
      const above = apts.filter((a) => !swiped[a.id] && a.rent > g.max && passes(a, noMax, ctx)).map((a) => a.rent);
      if (above.length) {
        const r = ctx.cfg.widenRound;
        g.max = Math.ceil(Math.min.apply(null, above) / r) * r;
        changes.push({ kind: 'max', value: g.max });
        return { filter: g, changes };
      }
    }
    const steps = [
      ['max0', () => { delete g.max; }],
      ['beds', () => { delete g.beds; }],
      ['baths', () => { delete g.baths; }],
      ['sqm', () => { delete g.sqm; }],
      ['rooms', () => { delete g.rooms; }],
      ['foryou', () => { delete g.foryou; }]
    ];
    (g.cats || []).slice().reverse().forEach((id) => steps.push(['cat', () => { g.cats = g.cats.filter((x) => x !== id); }, id]));
    (g.feats || []).slice().reverse().forEach((x) => steps.push(['feat', () => { g.feats = g.feats.filter((y) => y !== x); }, x]));
    (g.places || []).slice().reverse().forEach((x) => steps.push(['place', () => { g.places = g.places.filter((y) => y !== x); }, x]));
    steps.push(['q', () => { delete g.q; }, g.q]);

    for (const [kind, apply, value] of steps) {
      const before = JSON.stringify(g);
      apply();
      if (JSON.stringify(g) === before) continue;
      changes.push({ kind, value });
      if (left(g)) return { filter: isEmptyFilter(g) ? null : g, changes };
    }
    return { filter: null, changes: [{ kind: 'all' }] };
  }

  /* דירה מלאה: ברירות מחדל לשדות שחסרים בדירה שהוחלפה מ-data.js */
  function normalize(a) {
    const beds = a.beds || Math.max(1, Math.floor(a.rooms) - 1);
    return Object.assign({ beds, baths: 1, type: 'דירה', cond: 'במצב טוב', title: `דירת ${a.rooms} חדרים ב${a.street}`, desc: '', photos: [] }, a);
  }

  Dira.match = { fit, passes, isEmptyFilter, similarity, learnStar, learnNope, deckOrder, widen, normalize };
})(globalThis.Dira = globalThis.Dira || {});
