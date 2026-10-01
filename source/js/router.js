/*
 * נתב hash מלא. כל מסך וכל גיליון בכתובת, ולכן «חזרה» של הדפדפן עובדת.
 * #/deck · #/favs · #/categories · #/ai · #/match/:id · #/profile/:id · #/chat/:id · #/publish
 * #/owner · #/owner/match/:sid · #/owner/chat/:sid · #/log
 * גיליון: ?s=שם:ערך בסוף הכתובת. הקישורים הישנים #owner ו-#log עדיין עובדים.
 * history.state.i = כמה צעדים בתוך הדמו, כדי שכפתור «חזרה» בממשק לא יוציא מהדמו.
 */
(function (Dira) {
  'use strict';

  const PATTERNS = [
    '/deck', '/favs', '/categories', '/ai', '/match/:id', '/profile/:id', '/chat/:id', '/publish',
    '/owner', '/owner/match/:sid', '/owner/chat/:sid', '/log'
  ];
  const LEGACY = { '': '/deck', '#': '/deck', '#owner': '/owner', '#log': '/log', '#seeker': '/deck' };

  function matchPath(path) {
    const parts = path.split('/').filter(Boolean);
    for (const p of PATTERNS) {
      const pp = p.split('/').filter(Boolean);
      if (pp.length !== parts.length) continue;
      const params = {};
      const ok = pp.every((seg, i) => (seg[0] === ':' ? ((params[seg.slice(1)] = decodeURIComponent(parts[i])), true) : seg === parts[i]));
      if (ok) return { name: p, params };
    }
    return null;
  }

  /* '#/deck?s=apt:a1' ⟵ { path, route, params, sheet: { name, arg } } */
  function parse(hash) {
    const h = LEGACY[hash] !== undefined ? '#' + LEGACY[hash] : hash;
    const body = h.replace(/^#/, '');
    const [path, query] = body.split('?');
    const route = matchPath(path || '');
    const sm = (query || '').match(/(?:^|&)s=([^&]*)/);
    let sheet = null;
    if (sm) {
      const [name, arg] = decodeURIComponent(sm[1]).split(':');
      sheet = { name, arg: arg || '' };
    }
    return route ? { path, route: route.name, params: route.params, sheet } : { path: '/deck', route: '/deck', params: {}, sheet: null };
  }

  function createRouter(opts) {
    const onRoute = opts.onRoute;     // (current, previous) ⟵ מצייר
    let current = null;

    const depth = () => (history.state && typeof history.state.i === 'number' ? history.state.i : 0);

    function handle() {
      /* קישור ישן (#owner, #log) או כתובת ריקה: מיישרים את הכתובת בלי להוסיף צעד להיסטוריה */
      if (LEGACY[location.hash] !== undefined) history.replaceState({ i: depth() }, '', '#' + LEGACY[location.hash]);
      const next = parse(location.hash);
      const prev = current;
      current = next;
      onRoute(next, prev);
    }

    function hashOf(path, sheet) { return '#' + path + (sheet ? '?s=' + encodeURIComponent(sheet) : ''); }

    /* go('/favs') · go('/deck', { sheet: 'apt:a1' }) · go('/match/a1', { replace: true }) */
    function go(path, o) {
      o = o || {};
      const url = hashOf(path, o.sheet);
      if (url === location.hash && !o.replace) return handle();
      if (o.replace) history.replaceState({ i: depth() }, '', url);
      else history.pushState({ i: depth() + 1 }, '', url);
      handle();
    }

    /* כפתור «חזרה» בממשק: צעד אחורה בדמו, ואם זו הכניסה הראשונה, למסך ההורה בלי לצאת */
    function back(fallback) {
      if (depth() > 0) history.back();
      else go(fallback, { replace: true });
    }

    function openSheet(sheet) { go(current.path, { sheet }); }
    function closeSheet() { if (current && current.sheet) back(current.path); }

    function start() {
      if (!history.state || typeof history.state.i !== 'number') history.replaceState({ i: 0 }, '', location.hash || '#/deck');
      /* שניהם יורים על קישור או הקלדה בשורת הכתובת. onRoute מתעלם כשלא השתנה כלום */
      window.addEventListener('popstate', handle);
      window.addEventListener('hashchange', handle);
      handle();
    }

    return { start, go, back, openSheet, closeSheet, get current() { return current; } };
  }

  Dira.router = { parse, createRouter };
})(globalThis.Dira = globalThis.Dira || {});
