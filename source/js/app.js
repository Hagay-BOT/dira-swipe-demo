/*
 * הפעלה: בונה את ההקשר המשותף, המעטפת (מסך, ניווט תחתון, טוסט, באנר), והנתב.
 * מסך מצויר מחדש רק כשהנתיב משתנה. שינוי מצב מגיע למסך דרך נושאים, והמסך מצייר רק את האזור שלו.
 */
(function (Dira) {
  'use strict';

  const cfg = Dira.config, S = Dira.S, ui = Dira.ui, M = Dira.match, data = Dira.data;
  const TABS = [['/deck', 'home', 'deck'], ['/categories', 'grid', 'categories'], ['/ai', 'spark', 'ai'], ['/favs', 'heart', 'favs']];
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let storage = null;
  try { storage = window.localStorage; } catch (e) { /* גלישה פרטית חוסמת: הדמו עובד בלי שמירה */ }

  const ctx = { cfg, data, S, ui, match: M, media: {} };
  ctx.store = Dira.createStore({ config: cfg, storage });
  ctx.motionMs = reduced ? 0 : cfg.swipeMs;

  /* כל הדירות: מה שפורסם בדמו ראשון, עם התמונות שנבחרו במכשיר (לא נשמרות) */
  ctx.allApts = () => ctx.store.get().added.map((a) => M.normalize(Object.assign({}, a, { photos: ctx.media[a.id] || a.photos || [] })))
    .concat(data.apartments.map(M.normalize));
  ctx.aptById = (id) => ctx.allApts().find((a) => a.id === id);
  ctx.matchCtx = () => ({ categories: data.categories, tune: ctx.store.get().tune, cfg });

  /* ——— מעטפת ——— */
  document.querySelector('.aside').innerHTML = `<b>${ui.esc(S.app.asideTitle)}</b>${ui.esc(S.app.asideText)}`;
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="ambient" aria-hidden="true"></div>
    <main id="screen" class="screen-host"></main>
    <nav class="tabbar" aria-label="${ui.esc(S.tabs.nav)}" hidden>${TABS.map(([path, icon, key]) => `
      <button class="tab" type="button" data-go="${path}">${ui.I[icon]}<span>${ui.esc(S.tabs[key])}</span></button>`).join('')}
    </nav>
    <div class="toast" role="status" aria-live="polite"></div>
    <button class="banner" type="button" hidden></button>`;
  const host = app.querySelector('#screen');
  /* רקע מטושטש מתמונת הדירה שעל המסך. הזכוכית צריכה משהו לשקף */
  const ambientEl = app.querySelector('.ambient');
  let ambientSrc = null;
  ctx.setAmbient = (a) => {
    const src = a && a.photos && a.photos[0];
    if (!src || src === ambientSrc) return;
    ambientSrc = src;
    ambientEl.style.backgroundImage = `url("${String(src).replace(/["\\]/g, encodeURIComponent)}")`;
  };
  const tabbar = app.querySelector('.tabbar');
  ui.init({ cfg, S, toast: app.querySelector('.toast'), banner: app.querySelector('.banner') });
  document.documentElement.style.setProperty('--swipe-ms', ctx.motionMs + 'ms');
  document.documentElement.style.setProperty('--snap-ms', (reduced ? 0 : cfg.snapMs) + 'ms');

  tabbar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b && ctx.router.current.route !== b.dataset.go) ctx.router.go(b.dataset.go);
  });

  function drawTabbar(route) {
    const isTab = TABS.some(([p]) => p === route);
    tabbar.hidden = !isTab;
    app.classList.toggle('tabs-on', isTab);
    tabbar.querySelectorAll('.tab').forEach((b) => {
      if (b.dataset.go === route) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const n = ctx.store.get().requests.filter((r) => r.status === 'match' && !r.seen).length;
    const fav = tabbar.querySelector('[data-go="/favs"]');
    let badge = fav.querySelector('.badge');
    if (n && !badge) { badge = ui.el('<span class="badge"></span>'); fav.append(badge); }
    if (badge) { if (n) { badge.textContent = n; badge.setAttribute('aria-label', S.tabs.newMatches(n)); } else badge.remove(); }
  }

  /* ——— ניתוב ——— */
  let screen = null;       // { topics }
  let sheetKey = null;
  let sheetTopics = {};    // מה שהגיליון הפתוח רוצה לשמוע, מ-mount

  function renderScreen(r, first) {
    host.innerHTML = '';
    const fn = Dira.screens[r.route];
    screen = fn(host, ctx, r.params) || {};
    drawTabbar(r.route);
    if (!first) {
      const h1 = host.querySelector('h1');
      if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
    }
  }

  function syncSheet(r) {
    const key = r.sheet ? r.sheet.name + ':' + r.sheet.arg : null;
    if (key === sheetKey) return;
    ui.closeSheet();
    sheetKey = null;
    sheetTopics = {};
    const make = r.sheet && Dira.sheets[r.sheet.name];
    const spec = make && make(ctx, r.sheet.arg);
    if (!spec) return;
    sheetKey = key;
    ui.openSheet({
      html: spec.html, labelId: spec.labelId, onMount: (body) => { sheetTopics = (spec.mount && spec.mount(body)) || {}; },
      inertRoots: [host, tabbar], onDismiss: () => ctx.router.closeSheet()
    });
  }

  /* סגירת גיליון מתוך פעולה (למשל כוכב מהפרטים): סוגר מיד, והנתב מיישר את הכתובת */
  ctx.closeSheetNow = () => { ui.closeSheet(); sheetKey = null; sheetTopics = {}; ctx.router.closeSheet(); };

  let firstRoute = true;
  ctx.router = Dira.router.createRouter({
    onRoute(next, prev) {
      ui.routeChanged(next.route);
      if (!prev || next.path !== prev.path) renderScreen(next, firstRoute);
      firstRoute = false;
      syncSheet(next);
    }
  });

  /* ——— שינויי מצב מגיעים למסך הפעיל ולניווט התחתון ——— */
  ctx.store.subscribe('*', (state, topics) => {
    if (topics.includes('reset')) { ui.closeSheet(); sheetKey = null; sheetTopics = {}; renderScreen(ctx.router.current, false); return; }
    if (topics.includes('requests')) drawTabbar(ctx.router.current.route);
    const handlers = (screen && screen.topics) || {};
    Array.from(new Set(topics.map((t) => handlers[t]).filter(Boolean))).forEach((fn) => fn());
    if (sheetKey) Array.from(new Set(topics.map((t) => sheetTopics[t]).filter(Boolean))).forEach((fn) => fn());
  });

  ctx.actions = Dira.createActions(ctx);

  /* הכרעה 9: בעל הדירה מאשר ⟵ יש התאמה. המתזמן רץ מטעינת הדף ולא תלוי במסך */
  ctx.scheduler = Dira.createScheduler({
    store: ctx.store,
    onApprove(id) {
      const a = ctx.aptById(id);
      if (a) ui.banner(S.match.banner(a), S.match.bannerText(a), () => ctx.router.go('/match/' + id));
    }
  });

  ctx.setAmbient(ctx.allApts().find((a) => a.photos.length));
  Dira.app = ctx;

  /*
   * ——— יומן: יציאה מהירה נמדדת רק מהפתיחה הראשונה בביקור ועד ההסתרה הראשונה ———
   * הביקור נשמר ב-sessionStorage, ולכן רענון או מעבר מסך לא פותחים מדידה חדשה
   */
  const VISIT = cfg.storageKey + '-visit';
  let visit = {};
  try { visit = JSON.parse(sessionStorage.getItem(VISIT) || '{}'); } catch (e) { /* בלי sessionStorage: מדידה לפי טעינה */ }
  const keepVisit = () => { try { sessionStorage.setItem(VISIT, JSON.stringify(visit)); } catch (e) { /* כנ״ל */ } };
  if (!visit.openedAt) { visit.openedAt = Date.now(); keepVisit(); }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden' || visit.exitLogged) return;
    visit.exitLogged = true;
    keepVisit();
    ctx.store.setState('log', (s) => Dira.log.push(s, { type: 'exit', ms: Date.now() - visit.openedAt }, Date.now()));
  });

  ctx.store.setState('log', (s) => Dira.log.push(s, { type: 'open', side: /owner/.test(location.hash) ? 'owner' : 'seeker' }, Date.now()));
  ctx.router.start();
  ctx.scheduler.start();
})(globalThis.Dira = globalThis.Dira || {});
