/* ליבה: מצב, שמירה, ניווט, הודעות, גיליון, שיחה ויומן */
(function () {
  const D = window.DEMO;
  const KEY = 'swipe-demo-v1';
  const app = document.getElementById('app');

  const fresh = () => ({
    prefs: null,              // { area, max, entry }
    swiped: {},               // id → 'L' | 'R'
    pen: {},                  // מה הוחלק שמאלה, לסידור הערימה
    likes: [],                // { id, t, status: 'wait' | 'match' }
    chats: {},                // key → [{ who, text }]
    profile: null,
    added: [],
    owner: { decisions: {} },
    log: [],
    seenOwnerBanner: false
  });

  let state;
  try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { state = fresh(); }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* גלישה פרטית: הדמו עובד בלי שמירה */ }
  }
  function reset() { state = fresh(); A.state = state; save(); }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nis = (n) => Number(n).toLocaleString('en-US') + ' ₪';
  const toDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const days = (a, b) => Math.round((toDate(a) - toDate(b)) / 86400000);
  function fmtDate(iso, withYear) {
    const d = toDate(iso);
    const s = d.getUTCDate() + '.' + (d.getUTCMonth() + 1);
    return withYear || d.getUTCFullYear() !== 2026 ? s + '.' + d.getUTCFullYear() : s;
  }
  const g = (gender, m, f) => (gender === 'f' ? f : m);
  const roomsTxt = (r) => (r % 1 ? r : r) + ' חד׳';
  const floorTxt = (f, n) => (f === 0 ? 'קומת קרקע' : 'קומה ' + f + ' מתוך ' + n);

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  const ICON = {
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 4.4 2.5.8-1.4 2.4-2.5 4.5-2.5 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M7 12h10M10 17h4"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4v6l12 2-12 2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  };

  /* ——— שכבות קבועות: הודעה קצרה והתראה עליונה ——— */
  let toastEl, bannerEl, toastTimer, bannerTimer;
  function overlays() {
    toastEl = el('<div class="toast" role="status"></div>');
    bannerEl = el('<button class="banner" type="button"></button>');
    app.append(toastEl, bannerEl);
  }
  function toast(text, ms) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms || 2400);
  }
  function banner(title, text, onTap) {
    bannerEl.innerHTML = `<span class="mini-sign">יש!</span><div><b>${esc(title)}</b><span>${esc(text)}</span></div>`;
    bannerEl.onclick = () => { bannerEl.classList.remove('show'); onTap && onTap(); };
    bannerEl.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => bannerEl.classList.remove('show'), 6500);
  }

  function mount(screen) {
    app.innerHTML = '';
    app.append(screen);
    overlays();
    return screen;
  }

  function sheet(html, onMount) {
    const s = el(`<div class="sheet" role="dialog" aria-modal="true"><button class="sheet-back" type="button" aria-label="סגירה"></button><div class="sheet-body"><div class="sheet-grip"></div>${html}</div></div>`);
    const close = () => s.remove();
    s.querySelector('.sheet-back').onclick = close;
    app.append(s);
    onMount && onMount(s, close);
    return { el: s, close };
  }

  /* ——— יומן: מה קרה בדמו, בלי פרטים אישיים ——— */
  function log(type, data) {
    state.log.push(Object.assign({ t: Date.now(), type }, data || {}));
    if (state.log.length > 800) state.log.splice(0, state.log.length - 800);
    save();
  }

  /* ——— ניווט ——— */
  const routes = {};
  let current = { name: null, arg: null };
  function go(name, arg) {
    current = { name, arg };
    (routes[name] || routes.open)(arg);
  }
  function startRoute() {
    const h = (location.hash || '').replace('#', '');
    if (h === 'owner') return go('owner');
    if (h === 'log') return go('log');
    return go(state.prefs ? 'deck' : 'open');
  }
  window.addEventListener('hashchange', startRoute);

  /* ——— שיחה משותפת לשני הצדדים ——— */
  function chat(opt) {
    const msgs = state.chats[opt.key] || (state.chats[opt.key] = []);
    const scr = mount(el(`
      <section class="screen">
        <div class="chat-top">
          <button class="icon-btn" type="button" aria-label="חזרה">${ICON.back}</button>
          <div class="avatar">${esc(opt.initials)}</div>
          <div><b>${esc(opt.title)}</b><span>${esc(opt.subtitle)}</span></div>
        </div>
        <div class="msgs"></div>
        <form class="composer">
          <input type="text" aria-label="הודעה" autocomplete="off" enterkeyhint="send">
          <button type="submit" aria-label="שליחה">${ICON.send}</button>
        </form>
      </section>`));
    const list = scr.querySelector('.msgs');
    const input = scr.querySelector('input');
    scr.querySelector('.chat-top .icon-btn').onclick = opt.onBack;

    const add = (m) => {
      list.append(el(`<div class="msg ${m.who}">${esc(m.text)}</div>`));
      list.scrollTop = list.scrollHeight;
    };
    const showAfter = () => {
      if (!opt.after || list.querySelector('.after-chat')) return;
      list.append(el(`<div class="after-chat">${opt.after}</div>`));
      opt.afterMount && opt.afterMount(list.querySelector('.after-chat'));
      list.scrollTop = list.scrollHeight;
    };

    add({ who: 'sys', text: 'השיחה בדמו מדומה · ההודעות לא נשלחות לאף אחד' });
    msgs.forEach(add);
    if (msgs.some((m) => m.who === 'them')) showAfter();
    if (!msgs.length) input.value = opt.prefill || '';

    scr.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const m = { who: 'me', text };
      msgs.push(m); add(m); input.value = ''; save();
      const mine = msgs.filter((x) => x.who === 'me').length;
      const reply = opt.replies[Math.min(mine - 1, opt.replies.length - 1)];
      const dots = el('<div class="typing" aria-label="מקליד"><i></i><i></i><i></i></div>');
      setTimeout(() => { list.append(dots); list.scrollTop = list.scrollHeight; }, 500);
      setTimeout(() => {
        dots.remove();
        const r = { who: 'them', text: reply };
        msgs.push(r); add(r); save(); showAfter();
      }, 1900);
    };
  }

  /* ——— יומן: #log ——— */
  routes.log = function () {
    const L = state.log;
    const swipes = L.filter((e) => e.type === 'swipe');
    const right = swipes.filter((e) => e.dir === 'R').length;
    const avg = swipes.length ? Math.round(swipes.reduce((s, e) => s + (e.ms || 0), 0) / swipes.length / 100) / 10 : 0;
    const ok = L.filter((e) => e.type === 'approve').length;
    const no = L.filter((e) => e.type === 'reject').length;
    const quick = L.filter((e) => e.type === 'exit' && e.ms < 10000).length;
    const summary = `סיכום דמו · החלקות: ${swipes.length} · ימינה: ${right} (${swipes.length ? Math.round(right / swipes.length * 100) : 0}%) · שניות לכרטיס: ${avg} · אישורים: ${ok} · דחיות: ${no} · יציאות תוך 10 שניות: ${quick}`;
    const rows = L.slice(-40).reverse().map((e) => `<tr><td>${new Date(e.t).toLocaleTimeString('he-IL')}</td><td>${esc(e.type)}</td><td>${esc(e.id || e.sid || e.mode || '')} ${esc(e.dir || '')}</td><td>${e.ms ? Math.round(e.ms / 100) / 10 + ' ש׳' : ''}</td></tr>`).join('');
    const scr = mount(el(`
      <section class="screen scroll">
        <div class="top"><div class="brand">יומן הדמו</div><a class="chip" href="#">חזרה לדמו</a></div>
        <div class="log">
          <div class="stat-row">
            <div><b>${swipes.length}</b>החלקות</div>
            <div><b>${swipes.length ? Math.round(right / swipes.length * 100) : 0}%</b>ימינה</div>
            <div><b>${avg}</b>שניות לכרטיס</div>
            <div><b>${ok}/${ok + no}</b>אישורים של בעלי דירות</div>
          </div>
          <p class="note">היומן נשמר רק בדפדפן הזה. אין בו שמות ואין בו פרטים אישיים.</p>
          <div class="btn-row">
            <a class="btn-primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(summary)}">שליחת הסיכום בוואטסאפ</a>
            <button class="btn-ghost" type="button" data-clear>ניקוי היומן</button>
          </div>
          <table><thead><tr><th>שעה</th><th>אירוע</th><th>על מה</th><th>זמן</th></tr></thead><tbody>${rows}</tbody></table>
        </div>
      </section>`));
    scr.querySelector('[data-clear]').onclick = () => { state.log = []; save(); routes.log(); };
  };

  const A = {
    D, state, save, reset, esc, nis, days, fmtDate, g, roomsTxt, floorTxt, el, ICON,
    toast, banner, mount, sheet, log, routes, go, chat,
    get current() { return current; }
  };
  window.App = A;

  let openedAt = Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') log('exit', { ms: Date.now() - openedAt });
    else openedAt = Date.now();
  });

  window.addEventListener('DOMContentLoaded', () => {
    log('open', { mode: (location.hash || '#seeker').slice(1) });
    startRoute();
  });
})();
