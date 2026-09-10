/* לשונית «דירות»: ערימה, החלקה, כוכב, סינון חכם, פרטי דירה, פנייה לבעל הדירה */
(function () {
  const A = window.App;
  const { D, esc, nis, fmtDate, g, el } = A;
  const S = window.SCENES;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const photoMem = {};
  const scheduled = new Set();

  const I = Object.assign(A.ICON, {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="7" cy="7" r="3.2"/><circle cx="17" cy="7" r="3.2"/><circle cx="7" cy="17" r="3.2"/><path d="M17 13.5l3.5 6h-7z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 2l1.9 5.6L18.5 9.5l-5.6 1.9L11 17l-1.9-5.6L3.5 9.5l5.6-1.9z"/><path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    addHome: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h6M19 13v-3"/><path d="M17 16v6M14 19h6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 18V7M3 13h18v5M21 18v-3a3 3 0 0 0-3-3h-7v1"/><circle cx="7" cy="10.5" r="1.6"/></svg>',
    bath: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 4 0"/></svg>',
    ruler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20V4l16 16z"/><path d="M8 16h3v-3"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  });

  /* ——— נתונים ——— */
  function norm(a) {
    const beds = a.beds || Math.max(1, Math.floor(a.rooms) - 1);
    return Object.assign({ beds, baths: a.rooms >= 4 ? 2 : 1, type: 'דירה', cond: 'במצב טוב', title: `דירת ${a.rooms} חדרים ב${a.street}` }, a);
  }
  const apts = () => A.state.added.map((a) => norm(Object.assign({}, a, { photos: photoMem[a.id] || a.photos || [] }))).concat(D.apartments.map(norm));
  const byId = (id) => apts().find((a) => a.id === id);
  const catById = (id) => D.categories.find((c) => c.id === id);
  const specs = (a) => `<span>${I.bed}${a.beds}</span><span>${I.bath}${a.baths}</span><span>${I.ruler}${a.sqm} מ״ר</span>`;
  const place = (a) => `${a.street}${a.hood ? ', ' + a.hood : ''}`;

  /* ——— כותרת וניווט תחתון ——— */
  A.topbar = function () {
    const f = A.state.filter;
    return `
      <div class="app-top">
        <div class="top-icons">
          <button class="icon-btn" type="button" data-filter aria-label="סינון חכם">${I.sliders}${f ? '<i class="dot"></i>' : ''}</button>
          <button class="icon-btn" type="button" data-publish aria-label="פרסום דירה">${I.addHome}</button>
        </div>
        <div class="brand">דירה בהחלקה ${I.home}</div>
        <div></div>
      </div>`;
  };
  A.bindTop = function (scr) {
    const f = scr.querySelector('[data-filter]');
    if (f) f.onclick = filterSheet;
    const p = scr.querySelector('[data-publish]');
    if (p) p.onclick = () => A.go('publish');
  };
  A.tabbar = function (on) {
    const n = A.state.likes.filter((l) => l.status === 'match' && !l.seen).length;
    const t = (id, icon, label, extra) => `<button class="tab ${on === id ? 'on' : ''}" type="button" data-tab="${id}">${icon}<span>${label}</span>${extra || ''}</button>`;
    return `<nav class="tabbar">${t('deck', I.home, 'דירות')}${t('categories', I.grid, 'קטגוריות')}${t('ai', I.spark, 'עוזר AI')}${t('favs', I.heart, 'אהבתי', n ? `<span class="badge">${n}</span>` : '')}</nav>`;
  };
  A.bindTabbar = function (scr) {
    scr.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => A.go(b.dataset.tab); });
  };
  function refreshTabbar() {
    const nav = document.querySelector('.tabbar');
    if (!nav) return;
    const on = (nav.querySelector('.tab.on') || {}).dataset;
    const fresh = el(A.tabbar(on && on.tab));
    nav.replaceWith(fresh);
    A.bindTabbar(fresh.parentElement);
  }

  /* ——— סינון ——— */
  const loose = (hay, w) => hay.includes(w) || (w.length > 3 && /^[בלהו]/.test(w) && hay.includes(w.slice(1)));
  function passes(a, f) {
    if (!f) return true;
    if (f.max && a.rent > f.max) return false;
    if (f.min && a.rent < f.min) return false;
    if (f.beds && a.beds < f.beds) return false;
    if (f.baths && a.baths < f.baths) return false;
    if (f.sqm && a.sqm < f.sqm) return false;
    if (f.rooms && a.rooms < f.rooms) return false;
    if (f.cats && f.cats.length && !f.cats.every((id) => { const c = catById(id); return !c || !c.test || c.test(a); })) return false;
    if (f.feats && f.feats.length && !f.feats.every((x) => a.features.includes(x))) return false;
    if (f.places && f.places.length && !f.places.some((p) => (p === 'הקריות' ? a.area === 'krayot' : `${a.city} ${a.hood} ${a.street}`.includes(p)))) return false;
    if (f.q) {
      const hay = [a.title, a.street, a.hood, a.city, a.type, a.cond, a.desc].concat(a.features).join(' ');
      if (!f.q.split(/[\s,]+/).filter(Boolean).every((w) => loose(hay, w))) return false;
    }
    return true;
  }
  A.passes = passes;

  function similarity(a) {
    const t = A.state.tune;
    if (!t.n) return 0;
    let s = 0;
    a.features.forEach((x) => { s += (t.f[x] || 0) / t.n; });
    s += ((t.h[a.hood] || 0) / t.n) * 1.5;
    s += Math.max(0, 1.5 - Math.abs(a.rooms - t.rooms / t.n));
    s += Math.max(0, 1.5 - Math.abs(a.rent - t.rent / t.n) / 900);
    return s;
  }
  A.similarity = similarity;

  function eligible() {
    const f = A.state.filter, pen = A.state.pen;
    const penalty = (a) => (pen['hood:' + a.hood] || 0) * 1.2 + (!a.features.includes('מרפסת') ? (pen.noBalcony || 0) * 1.2 : 0) + (a.rent > 5600 ? (pen.high || 0) * 1.2 : 0);
    return apts()
      .filter((a) => !A.state.swiped[a.id] && passes(a, f))
      .map((a, i) => ({ a, s: a.mine ? -100 : penalty(a) - similarity(a) * 1.4, i }))
      .sort((x, y) => x.s - y.s || x.i - y.i)
      .map((x) => x.a);
  }

  function learnNope(a) {
    const pen = A.state.pen;
    if (a.rent > 5600) { pen.high = (pen.high || 0) + 1; return 'נראה פחות דירות במחיר הזה'; }
    if (!a.features.includes('מרפסת')) { pen.noBalcony = (pen.noBalcony || 0) + 1; return 'נראה פחות דירות בלי מרפסת'; }
    pen['hood:' + a.hood] = (pen['hood:' + a.hood] || 0) + 1;
    return 'נראה פחות דירות ב' + a.hood;
  }
  function learnStar(a) {
    const t = A.state.tune;
    t.n = (t.n || 0) + 1; t.f = t.f || {}; t.h = t.h || {};
    a.features.forEach((x) => { t.f[x] = (t.f[x] || 0) + 1; });
    t.h[a.hood] = (t.h[a.hood] || 0) + 1;
    t.rooms = (t.rooms || 0) + a.rooms; t.rent = (t.rent || 0) + a.rent;
  }

  /* ——— כרטיס ——— */
  function cardHTML(a, under) {
    const n = S.count(a);
    const saved = A.state.saved[a.id];
    return `
      <article class="card ${under ? 'under' : ''}" data-id="${a.id}" aria-label="${esc(a.title)}, ${nis(a.rent)}">
        <div class="photo">${S.photo(a, 0)}</div>
        <div class="bars">${Array.from({ length: n }, (_, i) => `<i class="bar ${i === 0 ? 'on' : ''}"></i>`).join('')}</div>
        <div class="card-tags">
          ${a.mine ? '<span class="mine-tag">הדירה שפרסמת</span>' : ''}
          ${a.example ? '<span class="ex-tag">דירה לדוגמה</span>' : ''}
          ${saved && saved.star ? '<span class="star-tag">★ סימנת כוכב</span>' : ''}
        </div>
        <div class="stamp stamp-like">שמרתי ♥</div>
        <div class="stamp stamp-nope">דילוג</div>
        <div class="stamp stamp-star">★ אהבתי במיוחד</div>
        <div class="info">
          <div class="title">${esc(a.title)}</div>
          <div class="loc">${I.pin}${esc(place(a))}</div>
          <div class="specs-row"><span class="price">${nis(a.rent)}</span><span class="specs">${specs(a)}</span></div>
          <div class="desc">${esc(a.desc || '')}</div>
        </div>
      </article>`;
  }

  function bind(card, a) {
    let sx = 0, sy = 0, dx = 0, dy = 0, down = false, photoI = 0;
    const t0 = performance.now();
    const like = card.querySelector('.stamp-like'), nope = card.querySelector('.stamp-nope'), star = card.querySelector('.stamp-star');
    card.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      down = true; sx = e.clientX; sy = e.clientY; dx = dy = 0;
      card.classList.remove('snap');
      try { card.setPointerCapture(e.pointerId); } catch (_) { /* */ }
    });
    card.addEventListener('pointermove', (e) => {
      if (!down) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      card.style.transform = `translate(${dx}px, ${dy * 0.4}px) rotate(${dx / 20}deg)`;
      like.style.opacity = Math.max(0, Math.min(1, dx / 90));
      nope.style.opacity = Math.max(0, Math.min(1, -dx / 90));
      star.style.opacity = Math.abs(dx) < 50 ? Math.max(0, Math.min(1, -dy / 110)) : 0;
    });
    const end = (e) => {
      if (!down) return;
      down = false;
      if (Math.abs(dx) > card.offsetWidth * 0.26) return fly(dx > 0 ? 'R' : 'L');
      if (dy < -card.offsetHeight * 0.22 && Math.abs(dx) < 60) return fly('U');
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && e.type === 'pointerup') return tap(e);
      card.classList.add('snap'); card.style.transform = '';
      like.style.opacity = nope.style.opacity = star.style.opacity = 0;
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);

    function tap(e) {
      if (e.target.closest('.info')) return A.details(a);
      const r = card.getBoundingClientRect();
      const n = S.count(a);
      photoI = e.clientX - r.left > r.width / 2 ? Math.min(n - 1, photoI + 1) : Math.max(0, photoI - 1);
      card.querySelector('.photo').innerHTML = S.photo(a, photoI);
      card.querySelectorAll('.bar').forEach((b, i) => b.classList.toggle('on', i <= photoI));
    }
    function fly(dir) {
      if (card.dataset.gone) return;
      card.dataset.gone = '1';
      card.classList.add('fly');
      ({ R: like, L: nope, U: star })[dir].style.opacity = 1;
      const w = card.offsetWidth;
      card.style.transform = dir === 'U' ? 'translate(0, -120%) scale(.9)' : `translate(${(dir === 'R' ? 1 : -1) * w * 1.6}px, ${dy * 0.4}px) rotate(${dir === 'R' ? 24 : -24}deg)`;
      card.style.opacity = '0';
      decide(a, dir, performance.now() - t0);
      setTimeout(renderDeck, reduce ? 0 : 240);
    }
    card._fly = fly;
  }

  function decide(a, dir, ms) {
    const st = A.state;
    st.swiped[a.id] = dir;
    A.log('swipe', { id: a.id, dir, ms: Math.round(ms) });
    if (dir === 'L') {
      A.toast('הבנו · ' + learnNope(a));
    } else if (dir === 'R') {
      st.saved[a.id] = { star: false, t: Date.now() };
      A.toast(`נשמר ב«אהבתי» · ${a.title}`, 2600, 'ok');
    } else {
      st.saved[a.id] = { star: true, t: Date.now() };
      learnStar(a);
      A.toast('סימנת כוכב · נציג יותר דירות כמו זו', 2800, 'ok');
    }
    A.save();
  }

  /* ——— המסך ——— */
  A.routes.deck = function () {
    const scr = A.mount(el(`
      <section class="screen" data-screen="deck">
        ${A.topbar()}
        <div class="chips filter-row"></div>
        <div class="deck"></div>
        <div class="actions">
          <button class="rb rb-nope" type="button" aria-label="דילוג">${I.x}</button>
          <button class="rb rb-star" type="button" aria-label="כוכב · אהבתי במיוחד">${I.star}</button>
          <button class="rb rb-like" type="button" aria-label="שמירה באהבתי">${I.heart}</button>
        </div>
        ${A.tabbar('deck')}
      </section>`));
    A.bindTop(scr); A.bindTabbar(scr);
    const top = () => scr.querySelector('.card:not(.under)');
    scr.querySelector('.rb-nope').onclick = () => { const c = top(); c && c._fly('L'); };
    scr.querySelector('.rb-like').onclick = () => { const c = top(); c && c._fly('R'); };
    scr.querySelector('.rb-star').onclick = () => { const c = top(); c && c._fly('U'); };
    renderChips();
    renderDeck();
    A.state.likes.forEach((l) => { if (l.status === 'wait') schedule(l.id, 2600); });
    if (!A.state.seenHint) {
      A.state.seenHint = true; A.save();
      setTimeout(() => A.toast('ימינה שומר · שמאלה מדלג · למעלה כוכב'), 600);
    }
  };

  function renderChips() {
    const row = document.querySelector('[data-screen="deck"] .filter-row');
    if (!row) return;
    const f = A.state.filter;
    if (!f) { row.hidden = true; return; }
    const parts = [];
    if (f.label) parts.push(f.label);
    if (f.q) parts.push('«' + f.q + '»');
    if (f.max) parts.push('עד ' + nis(f.max));
    if (f.min) parts.push('מ-' + nis(f.min));
    if (f.rooms) parts.push(f.rooms + '+ חדרים');
    if (f.beds) parts.push(f.beds + '+ חדרי שינה');
    if (f.baths) parts.push(f.baths + '+ רחצה');
    if (f.sqm) parts.push(f.sqm + '+ מ״ר');
    (f.cats || []).forEach((id) => { const c = catById(id); c && parts.push(c.label); });
    (f.feats || []).forEach((x) => parts.push(x));
    (f.places || []).forEach((x) => parts.push(x));
    row.hidden = false;
    row.innerHTML = parts.map((p) => `<button class="chip on" type="button" data-open>${esc(p)}</button>`).join('') + `<button class="chip" type="button" data-clear>${I.x} ניקוי</button>`;
    row.querySelectorAll('[data-open]').forEach((b) => { b.onclick = filterSheet; });
    row.querySelector('[data-clear]').onclick = () => A.applyFilter(null, 'הסינון נוקה');
  }

  function renderDeck() {
    const scr = document.querySelector('[data-screen="deck"]');
    if (!scr) return;
    const deck = scr.querySelector('.deck'), acts = scr.querySelector('.actions');
    const list = eligible();
    deck.innerHTML = '';
    if (!list.length) { acts.hidden = true; deck.append(emptyEl()); return; }
    acts.hidden = false;
    if (list[1]) deck.append(el(cardHTML(list[1], true)));
    const t = el(cardHTML(list[0], false));
    deck.append(t);
    bind(t, list[0]);
  }
  A.renderDeck = renderDeck;

  A.applyFilter = function (f, msg) {
    A.state.filter = f; A.save();
    A.log('filter', { on: !!f });
    if (A.current.name !== 'deck') A.go('deck');
    else { const s = document.querySelector('[data-screen="deck"]'); const b = s.querySelector('[data-filter]'); b.innerHTML = I.sliders + (f ? '<i class="dot"></i>' : ''); renderChips(); renderDeck(); }
    msg && A.toast(msg);
  };

  function emptyEl() {
    const f = A.state.filter;
    const all = apts();
    const skipped = all.filter((a) => A.state.swiped[a.id]);
    let title, text, label, action;
    if (f) {
      const hits = all.filter((a) => passes(a, f)).length;
      title = 'אין עוד דירות שמתאימות לסינון';
      text = hits ? `עברת על כל ${hits} הדירות שמתאימות.` : 'אף דירה לא עונה על כל התנאים יחד.';
      if (f.max && all.some((a) => !A.state.swiped[a.id] && a.rent > f.max)) {
        const next = Math.ceil(f.max * 1.1 / 100) * 100;
        label = `הרחבת המחיר עד ${nis(next)}`;
        action = () => A.applyFilter(Object.assign({}, f, { max: next }), 'המחיר הורחב עד ' + nis(next));
      } else {
        label = 'ניקוי הסינון';
        action = () => A.applyFilter(null, 'הסינון נוקה');
      }
    } else {
      title = 'ראית את כל הדירות';
      text = 'דירות חדשות מופיעות כאן ברגע שהן מתפרסמות.';
      if (skipped.length) {
        label = `להציג שוב ${skipped.length} דירות`;
        action = () => { skipped.forEach((a) => delete A.state.swiped[a.id]); A.state.pen = {}; A.save(); renderDeck(); A.toast('הדירות חזרו לערימה'); };
      }
    }
    const node = el(`
      <div class="empty">
        <div class="big">${I.home}</div>
        <h2>${title}</h2><p>${text}</p>
        <div class="btn-row">
          ${label ? `<button class="btn-primary" type="button" data-act>${label}</button>` : ''}
          <button class="btn-ghost" type="button" data-pub>${I.addHome} פרסום דירה</button>
        </div>
      </div>`);
    const b = node.querySelector('[data-act]');
    if (b) b.onclick = action;
    node.querySelector('[data-pub]').onclick = () => A.go('publish');
    return node;
  }

  /* ——— סינון חכם ——— */
  function filterSheet() {
    const f = Object.assign({ q: '', min: 0, max: 0, beds: 0, baths: 0, sqm: 0, cats: [] }, A.state.filter || {});
    const seg = (key, vals) => vals.map(([v, l]) => `<button class="opt" type="button" data-k="${key}" data-v="${v}" aria-pressed="${Number(f[key]) === v}">${l}</button>`).join('');
    A.sheet(`
      <div class="sheet-head"><h3>${I.sliders} סינון חכם</h3><button class="linkish" type="button" data-reset>איפוס</button></div>
      <div class="q"><span class="q-label">חיפוש חופשי</span>
        <label class="search">${I.search}<input type="text" data-q value="${esc(f.q)}" placeholder="לדוגמה: כרמל, מרפסת, נוף לים"></label></div>
      <div class="q"><span class="q-label">מחיר חודשי עד <span class="range-out" data-maxout>${f.max ? nis(f.max) : 'ללא הגבלה'}</span></span>
        <input class="range" type="range" min="3000" max="8000" step="100" value="${f.max || 8000}" data-max aria-label="מחיר מקסימלי"></div>
      <div class="q"><span class="q-label">חדרי שינה לפחות</span><div class="opts">${seg('beds', [[0, 'ללא סינון'], [1, '1'], [2, '2'], [3, '3'], [4, '4+']])}</div></div>
      <div class="q"><span class="q-label">חדרי רחצה לפחות</span><div class="opts">${seg('baths', [[0, 'ללא סינון'], [1, '1'], [2, '2+']])}</div></div>
      <div class="q"><span class="q-label">מ״ר מינימלי <span class="range-out" data-sqmout>${f.sqm ? f.sqm + ' מ״ר' : 'ללא'}</span></span>
        <input class="range" type="range" min="0" max="120" step="5" value="${f.sqm || 0}" data-sqm aria-label="מטר מרובע מינימלי"></div>
      <div class="q"><span class="q-label">קטגוריות</span><div class="opts">${D.categories.filter((c) => c.test).map((c) => `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${f.cats.includes(c.id)}">${esc(c.label)}</button>`).join('')}</div></div>
      <div class="two-btn" style="margin-top:20px">
        <button class="btn-ghost" type="button" data-clear>ניקוי הכול</button>
        <button class="btn-primary" type="button" data-apply>${I.check} החלת הסינון</button>
      </div>`, (sh, close) => {
      sh.querySelectorAll('[data-k]').forEach((b) => {
        b.onclick = () => { f[b.dataset.k] = Number(b.dataset.v); sh.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach((x) => x.setAttribute('aria-pressed', x === b)); };
      });
      sh.querySelectorAll('[data-cat]').forEach((b) => {
        b.onclick = () => { const on = !f.cats.includes(b.dataset.cat); f.cats = on ? f.cats.concat(b.dataset.cat) : f.cats.filter((x) => x !== b.dataset.cat); b.setAttribute('aria-pressed', on); };
      });
      const mx = sh.querySelector('[data-max]'), sq = sh.querySelector('[data-sqm]');
      mx.oninput = () => { f.max = Number(mx.value) >= 8000 ? 0 : Number(mx.value); sh.querySelector('[data-maxout]').textContent = f.max ? nis(f.max) : 'ללא הגבלה'; };
      sq.oninput = () => { f.sqm = Number(sq.value); sh.querySelector('[data-sqmout]').textContent = f.sqm ? f.sqm + ' מ״ר' : 'ללא'; };
      const clear = () => { close(); A.applyFilter(null, 'הסינון נוקה'); };
      sh.querySelector('[data-reset]').onclick = clear;
      sh.querySelector('[data-clear]').onclick = clear;
      sh.querySelector('[data-apply]').onclick = () => {
        f.q = sh.querySelector('[data-q]').value.trim();
        const active = f.q || f.max || f.beds || f.baths || f.sqm || f.cats.length;
        close();
        const out = active ? { q: f.q, max: f.max, beds: f.beds, baths: f.baths, sqm: f.sqm, cats: f.cats } : null;
        const n = apts().filter((a) => passes(a, out)).length;
        A.applyFilter(out, active ? `${n} דירות מתאימות לסינון` : 'הסינון נוקה');
      };
    });
  }

  /* ——— פרטי דירה ——— */
  const yes = (v) => (v ? 'כן' : 'לא');
  A.details = function (a, opts) {
    if (!a) return;
    opts = opts || {};
    const req = A.state.likes.find((l) => l.id === a.id);
    const saved = A.state.saved[a.id];
    A.sheet(`
      <div class="sheet-photo"><div class="photo">${S.photo(a, 1)}</div></div>
      <h3>${esc(a.title)}</h3>
      <p class="sub">${esc(place(a))} · ${esc(a.city)}${a.example ? ' · דירה לדוגמה' : ''}</p>
      <div class="detail-price"><span class="price">${nis(a.rent)}</span><span class="specs">${specs(a)}</span></div>
      <div class="feat-list">${[a.type, a.cond].concat(a.features).filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}</div>
      ${a.desc ? `<p>${esc(a.desc)}</p>` : ''}
      <div class="sec-title">תשלומים ודרישות</div>
      <dl class="kv">
        <dt>ועד בית</dt><dd>${a.vaad != null ? nis(a.vaad) : '—'}</dd>
        <dt>ארנונה דו-חודשית</dt><dd>${a.arnona != null ? nis(a.arnona) : '—'}</dd>
        <dt>חוזה מינימלי</dt><dd>${a.contract ? a.contract + ' חודשים' : '—'}</dd>
        <dt>ערבות בנקאית</dt><dd>${a.guarantee ? nis(a.guarantee) : 'לא נדרשת'}</dd>
        <dt>ערבים</dt><dd>${a.guarantors ? 'נדרשים' : 'לא נדרשים'}</dd>
        <dt>שותפים</dt><dd>${yes(a.partners)}</dd>
        <dt>עישון</dt><dd>${yes(a.smoking)}</dd>
        <dt>כניסה</dt><dd>${fmtDate(a.entry, true)}</dd>
        <dt>מפרסם</dt><dd>${esc(a.by.name)} · ${esc(a.by.role)}</dd>
      </dl>
      <p class="note">מספר הבית והטלפון של ${esc(a.by.name)} נחשפים רק אחרי התאמה.</p>
      <div class="btn-row" style="margin-top:12px">
        ${req ? `<div class="sent">${req.status === 'match' ? 'יש התאמה · השיחה פתוחה' : 'הפנייה נשלחה · מחכים לאישור'}</div>`
              : `<button class="btn-primary" type="button" data-req>שליחת פנייה ל${esc(a.by.name)}</button>`}
        ${opts.fromDeck === false ? '' : `<div class="two-btn">
          <button class="btn-ghost" type="button" data-star>${I.star} ${saved && saved.star ? 'יש כוכב' : 'כוכב'}</button>
          <button class="btn-ghost" type="button" data-save>${I.heart} ${saved ? 'שמור' : 'שמירה'}</button>
        </div>`}
      </div>`, (sh, close) => {
      const fire = (dir) => {
        const c = document.querySelector(`.card[data-id="${a.id}"]:not(.under)`);
        close();
        if (c) return c._fly(dir);
        A.state.saved[a.id] = { star: dir === 'U' || !!(saved && saved.star), t: Date.now() };
        if (dir === 'U') learnStar(a);
        A.save();
        A.toast(dir === 'U' ? 'סימנת כוכב · נציג יותר דירות כמו זו' : 'נשמר ב«אהבתי»', 2400, 'ok');
      };
      const st = sh.querySelector('[data-star]'), sv = sh.querySelector('[data-save]'), rq = sh.querySelector('[data-req]');
      if (st) st.onclick = () => fire('U');
      if (sv) sv.onclick = () => fire('R');
      if (rq) rq.onclick = () => { close(); A.sendRequest(a); };
    });
  };

  /* ——— פנייה לבעל הדירה ——— */
  A.sendRequest = function (a) {
    const st = A.state;
    if (st.likes.find((l) => l.id === a.id)) return A.toast('כבר שלחת פנייה על הדירה הזאת');
    st.likes.push({ id: a.id, t: Date.now(), status: 'wait', seen: false });
    if (!st.saved[a.id]) st.saved[a.id] = { star: false, t: Date.now() };
    A.save();
    A.log('request', { id: a.id });
    A.toast(`הפנייה נשלחה ל${a.by.name} · ${g(a.by.g, 'הוא יראה', 'היא תראה')} שיש מתעניין, בלי פרטים`, 3000);
    schedule(a.id, 3400);
    if (A.current.name === 'favs') A.go('favs');
  };
  function schedule(id, ms) {
    if (scheduled.has(id)) return;
    scheduled.add(id);
    setTimeout(() => approve(id), ms);
  }
  function approve(id) {
    const l = A.state.likes.find((x) => x.id === id);
    if (!l || l.status === 'match') return;
    l.status = 'match'; A.save();
    A.log('match', { id, side: 'seeker' });
    const a = byId(id);
    refreshTabbar();
    if (A.current.name === 'favs') A.go('favs');
    if (a) A.banner(`${a.by.name} ${g(a.by.g, 'אישר', 'אישרה')} · יש התאמה`, `${a.street} · לחצו לפרטים`, () => A.go('match', id));
  }

  A.apts = apts;
  A.byId = byId;
  A.place = place;
  A.specs = specs;
  A.photoMem = photoMem;
  A.filterSheet = filterSheet;
  A.clearScheduled = () => scheduled.clear();
})();
