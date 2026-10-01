/*
 * העוזר המדומה (הכרעה 18): מפרש מילים בבקשה לסינון, ומחפש.
 * אין כאן AI. טהור, בלי DOM.
 */
(function (Dira) {
  'use strict';

  const HE = 'א-ת';
  const word = (w) => new RegExp(`(^|[^${HE}])${w}($|[^${HE}])`);

  const FEATS = [
    [/מרפסת/, 'מרפסת'],
    [/חני/, 'חניה'],
    [/ממ["״']?ד/, 'ממ"ד'],
    [/מעלית/, 'מעלית'],
    [/מזגן|מיזוג|ממוזג/, 'מזגנים'],
    [/חיות|כלב|חתול/, 'חיות מחמד'],
    [/מרוהט|ריהוט/, 'מרוהטת'],
    [new RegExp(`נוף|${word('(?:ל|ה|ליד ה)?ים').source}`), 'נוף לים'],
    [/גינה|חצר|דירת גן/, 'גינה'],
    [/מחסן/, 'מחסן']
  ];
  const PLACES = ['נווה שאנן', 'רמת אלמוגי', 'כרמל', 'הדר', 'אחוזה', 'קריית ביאליק', 'קריית מוצקין', 'קריית אתא', 'הקריות', 'חיפה'];

  /* «3 חדרים עם מרפסת עד 5500 בכרמל» ⟵ { rooms: 3, feats: ['מרפסת'], max: 5500, places: ['כרמל'] } */
  function parse(text) {
    const t = String(text || '');
    const filter = {};
    const rm = t.match(/(\d(?:\.\d)?)\s*\+?\s*(?:חדרים|חדר|חד׳|חד')/);
    if (rm) filter.rooms = Number(rm[1]);
    const pm = t.match(/עד\s*([\d.,]+)\s*(אלף)?/);
    if (pm) {
      let v = Number(pm[1].replace(/,/g, ''));
      if (pm[2] || v < 100) v *= 1000;
      if (v > 0) filter.max = Math.round(v);
    }
    filter.feats = FEATS.filter(([re]) => re.test(t)).map(([, v]) => v);
    let places = PLACES.filter((p) => t.includes(p));
    if (!places.includes('הקריות') && /קריות/.test(t)) places.push('הקריות');
    if (places.includes('חיפה') && places.length > 1) places = places.filter((p) => p !== 'חיפה');
    filter.places = places;
    const understood = !!(filter.rooms || filter.max || filter.feats.length || filter.places.length);
    return { understood, filter };
  }

  /*
   * מחפש. אם אין דירה עם הכול יחד, מוריד תנאי אחרי תנאי ואומר מה הוריד.
   * ctx: { categories, tune, cfg } כמו ב-match.passes
   */
  function search(text, apts, ctx) {
    const { understood, filter } = parse(text);
    if (!understood) return { understood: false };
    const passes = (q) => apts.filter((a) => Dira.match.passes(a, q, ctx));
    const q = JSON.parse(JSON.stringify(filter));
    let res = passes(q);
    const dropped = [];
    while (!res.length && (q.feats.length || q.places.length || q.rooms || q.max)) {
      if (q.feats.length) dropped.push({ kind: 'feat', value: q.feats.pop() });
      else if (q.places.length) dropped.push({ kind: 'place', value: q.places.pop() });
      else if (q.rooms) { dropped.push({ kind: 'rooms', value: q.rooms }); delete q.rooms; }
      else { dropped.push({ kind: 'max', value: q.max }); delete q.max; }
      res = passes(q);
    }
    return {
      understood: true,
      asked: filter,
      filter: Object.assign(q, { label: 'ai' }),
      dropped,
      total: res.length,
      ids: res.slice(0, ctx.cfg.aiResultsShown).map((a) => a.id)
    };
  }

  Dira.assist = { parse, search };
})(globalThis.Dira = globalThis.Dira || {});
