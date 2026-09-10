/* צד המחפש: פתיחה, ערימה, החלקה, התאמה, פרטים, שיחה, הוספת דירה */
(function () {
  const A = window.App;
  const { D, esc, nis, fmtDate, g, el, ICON } = A;
  const S = window.SCENES;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const photoMem = {};               // תמונות של דירה שנוספה · רק עד שסוגרים את הדף
  const scheduled = new Set();

  const allApts = () => A.state.added.map((a) => Object.assign({}, a, { photos: photoMem[a.id] || [] })).concat(D.apartments);
  const byId = (id) => allApts().find((a) => a.id === id);
  const areaLabel = (id) => (D.areas.find((a) => a.id === id) || {}).label;
  const entryLabel = (id) => (D.entryChoices.find((e) => e.id === id) || {}).label;

  /* ——— פתיחה · שלוש שאלות ——— */
  const T = {
    he: { small: 'בהחלקה · מטרופולין חיפה', lead: 'מחליקים ימינה על דירה שמתאימה לך. בעל הדירה מאשר, ונפתחת שיחה.',
      where: 'איפה מחפשים?', max: 'עד כמה בחודש?', when: 'מתי נכנסים?', go: 'תראו לי דירות',
      fine: 'בלי הרשמה. ממלאים פרטים רק כשיש התאמה.', per: 'לחודש', lang: 'EN',
      areas: { haifa: 'חיפה', krayot: 'הקריות', all: 'כל האזור' },
      entry: { now: 'מיידי', month: 'תוך חודש', quarter: '1–3 חודשים', flex: 'גמיש' } },
    en: { small: 'swipe · Haifa metro', lead: 'Swipe right on a flat that fits you. The owner approves, and a chat opens.',
      where: 'Where are you looking?', max: 'Max rent per month', when: 'When do you move in?', go: 'Show me apartments',
      fine: 'No sign-up. You add details only after a match.', per: '/ month', lang: 'עב',
      areas: { haifa: 'Haifa', krayot: 'Krayot', all: 'Whole area' },
      entry: { now: 'Now', month: 'Within a month', quarter: '1–3 months', flex: 'Flexible' } }
  };
  let lang = 'he';
  let draft = null;

  A.routes.open = function (arg) {
    if (arg !== 'keep') draft = null;
    const p = draft || (draft = Object.assign({ area: 'haifa', max: 5500, entry: 'month' }, A.state.prefs || {}));
    const t = T[lang];
    const opt = (group, id, label) => `<button class="opt" type="button" data-g="${group}" data-v="${id}" aria-pressed="${p[group] === id}">${esc(label)}</button>`;
    const scr = A.mount(el(`
      <section class="screen scroll" dir="${lang === 'en' ? 'ltr' : 'rtl'}">
        <div class="open">
          <div class="open-head"><div class="pill-demo">דמו</div><button class="lang" type="button" data-lang>${t.lang}</button></div>
          <div class="hero"><div class="sign">להשכרה<small>${t.small}</small></div></div>
          <p class="lead">${t.lead}</p>
          <div class="q"><span class="q-label">${t.where}</span>
            <div class="opts">${D.areas.map((a) => opt('area', a.id, t.areas[a.id])).join('')}</div></div>
          <div class="q"><span class="q-label">${t.max}</span>
            <div class="price-out" dir="rtl"><output>${Number(p.max).toLocaleString('en-US')}</output><span>₪ ${t.per}</span></div>
            <input class="range" type="range" min="3000" max="8000" step="100" value="${p.max}" aria-label="${t.max}">
            <div class="range-ends"><span>3,000</span><span>8,000</span></div></div>
          <div class="q"><span class="q-label">${t.when}</span>
            <div class="opts">${D.entryChoices.map((e) => opt('entry', e.id, t.entry[e.id])).join('')}</div></div>
          <button class="btn-primary" type="button" data-go>${t.go}</button>
          <p class="fine">${t.fine}</p>
        </div>
      </section>`));

    scr.querySelectorAll('.opt').forEach((b) => {
      b.onclick = () => {
        p[b.dataset.g] = b.dataset.v;
        scr.querySelectorAll(`.opt[data-g="${b.dataset.g}"]`).forEach((x) => x.setAttribute('aria-pressed', x === b));
      };
    });
    const range = scr.querySelector('.range');
    range.oninput = () => { p.max = Number(range.value); scr.querySelector('output').textContent = p.max.toLocaleString('en-US'); };
    scr.querySelector('[data-lang]').onclick = () => { lang = lang === 'he' ? 'en' : 'he'; A.routes.open('keep'); };
    scr.querySelector('[data-go]').onclick = () => {
      A.state.prefs = p; A.save();
      A.log('start', { area: p.area, max: p.max, entry: p.entry });
      A.go('deck');
    };
  };

  /* ——— סידור הערימה ——— */
  function eligible() {
    const p = A.state.prefs, pen = A.state.pen;
    const ent = D.entryChoices.find((e) => e.id === p.entry);
    const score = (a) => {
      if (a.mine) return -100;
      let s = 0;
      if (p.area !== 'all' && a.area !== p.area) s += 3;                    // אזור מסדר, לא מסנן (ש27)
      if (ent && A.days(a.entry, D.today) > ent.days) s += 1.5;
      s += (pen['hood:' + a.hood] || 0) * 1.2;
      if (!a.features.includes('מרפסת')) s += (pen.noBalcony || 0) * 1.2;
      if (a.rent > p.max * 0.88) s += (pen.high || 0) * 1.2;
      return s;
    };
    return allApts()
      .filter((a) => !A.state.swiped[a.id] && a.rent <= p.max)              // החסם היחיד: מחיר מקסימלי
      .map((a, i) => ({ a, s: score(a), i }))
      .sort((x, y) => x.s - y.s || x.i - y.i)
      .map((x) => x.a);
  }

  function learn(a) {
    const p = A.state.prefs, pen = A.state.pen;
    if (a.rent > p.max * 0.88) { pen.high = (pen.high || 0) + 1; return 'נראה פחות דירות קרוב לתקרת המחיר'; }
    if (!a.features.includes('מרפסת')) { pen.noBalcony = (pen.noBalcony || 0) + 1; return 'נראה פחות דירות בלי מרפסת'; }
    pen['hood:' + a.hood] = (pen['hood:' + a.hood] || 0) + 1;
    return 'נראה פחות דירות ב' + a.hood;
  }

  /* ——— כרטיס ——— */
  function cardHTML(a, under) {
    const p = A.state.prefs;
    const n = S.count(a);
    const out = p.area !== 'all' && a.area !== p.area;
    const more = a.features.length > 3 ? `<span>+${a.features.length - 3}</span>` : '';
    return `
      <article class="card ${under ? 'under' : ''}" data-id="${a.id}" aria-label="${esc(a.street)}, ${nis(a.rent)}">
        <div class="photo">${S.photo(a, 0)}</div>
        <div class="bars">${Array.from({ length: n }, (_, i) => `<i class="bar ${i === 0 ? 'on' : ''}"></i>`).join('')}</div>
        <div class="card-tags">
          ${a.mine ? '<span class="mine-tag">הדירה שהוספת</span>' : ''}
          ${a.example ? '<span class="ex-tag">דירה לדוגמה</span>' : ''}
          ${out ? `<span class="out-tag">מחוץ ל${esc(areaLabel(p.area))}</span>` : ''}
        </div>
        <div class="stamp sign stamp-like">מעוניין!</div>
        <div class="stamp sign stamp-nope">לא בשבילי</div>
        <div class="info">
          <div class="price">${Number(a.rent).toLocaleString('en-US')}<span class="per">₪ לחודש</span></div>
          <div class="addr">${esc(a.street)}${a.hood ? ' · ' + esc(a.hood) : ''}</div>
          <div class="meta">${esc(a.city)} · ${A.roomsTxt(a.rooms)} · ${a.sqm} מ״ר · כניסה ${fmtDate(a.entry)}</div>
          <div class="feat">${a.tour ? '<span class="tour-chip">▶ סיור בדירה</span>' : ''}${a.features.slice(0, 3).map((f) => `<span>${esc(f)}</span>`).join('')}${more}</div>
        </div>
      </article>`;
  }

  function bind(card, a) {
    let sx = 0, sy = 0, dx = 0, dy = 0, down = false, photoI = 0;
    const t0 = performance.now();
    const like = card.querySelector('.stamp-like'), nope = card.querySelector('.stamp-nope');

    card.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      down = true; sx = e.clientX; sy = e.clientY; dx = dy = 0;
      card.classList.remove('snap');
      try { card.setPointerCapture(e.pointerId); } catch (_) { /* */ }
    });
    card.addEventListener('pointermove', (e) => {
      if (!down) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      card.style.transform = `translate(${dx}px, ${dy * 0.25}px) rotate(${dx / 20}deg)`;
      like.style.opacity = Math.max(0, Math.min(1, dx / 90));
      nope.style.opacity = Math.max(0, Math.min(1, -dx / 90));
    });
    const end = (e) => {
      if (!down) return;
      down = false;
      if (Math.abs(dx) > card.offsetWidth * 0.26) return fly(dx > 0 ? 'R' : 'L');
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && e.type === 'pointerup') return tap(e);
      card.classList.add('snap');
      card.style.transform = '';
      like.style.opacity = 0; nope.style.opacity = 0;
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);

    function tap(e) {
      if (e.target.closest('.tour-chip')) return tour(a);
      if (e.target.closest('.info')) return details(a);
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
      (dir === 'R' ? like : nope).style.opacity = 1;
      card.style.transform = `translate(${(dir === 'R' ? 1 : -1) * card.offsetWidth * 1.6}px, ${dy * 0.25}px) rotate(${dir === 'R' ? 24 : -24}deg)`;
      card.style.opacity = '0';
      decide(a, dir, performance.now() - t0);
      setTimeout(renderDeck, reduce ? 0 : 250);
    }
    card._fly = fly;
  }

  function decide(a, dir, ms) {
    const st = A.state;
    st.swiped[a.id] = dir;
    A.log('swipe', { id: a.id, dir, ms: Math.round(ms) });
    if (dir === 'L') {
      A.toast('הבנו · ' + learn(a));
    } else {
      const n = st.likes.length;
      st.likes.push({ id: a.id, t: Date.now(), status: 'wait', seen: false });
      A.toast(`נשלח ל${a.by.name} · ${g(a.by.g, 'הוא יראה', 'היא תראה')} שיש מתעניין, בלי פרטים`, 2800);
      if (n % 2 === 0) schedule(a.id, n === 0 ? 3400 : 5000 + Math.random() * 3000);
    }
    A.save();
  }

  /* אישור מדומה של בעל הדירה: הפנייה הראשונה תמיד, ואחריה כל שנייה */
  function schedule(id, ms) {
    if (scheduled.has(id)) return;
    scheduled.add(id);
    setTimeout(() => approve(id), ms);
  }
  function approve(id) {
    const like = A.state.likes.find((l) => l.id === id);
    if (!like || like.status === 'match') return;
    like.status = 'match';
    A.save();
    A.log('match', { id, side: 'seeker' });
    updateBadge();
    const a = byId(id);
    if (a && A.current.name === 'deck') {
      A.banner(`${a.by.name} ${g(a.by.g, 'אישר', 'אישרה')} · יש התאמה`, `${a.street}${a.hood ? ', ' + a.hood : ''} · לחצו לפרטים`, () => A.go('match', id));
    }
  }

  function updateBadge() {
    const b = document.querySelector('[data-matches] .badge');
    if (!b) return;
    const n = A.state.likes.filter((l) => l.status === 'match' && !l.seen).length;
    b.textContent = n;
    b.hidden = !n;
  }

  /* ——— מסך הערימה ——— */
  A.routes.deck = function () {
    if (!A.state.prefs) return A.go('open');
    const scr = A.mount(el(`
      <section class="screen" data-screen="deck">
        <div class="top">
          <div class="brand">דירה בהחלקה <span class="pill-demo">דמו</span></div>
          <div class="top-actions">
            <button class="icon-btn" type="button" data-matches aria-label="התאמות ושיחות">${ICON.chat}<span class="badge" hidden>0</span></button>
            <button class="icon-btn" type="button" data-menu aria-label="עוד">${ICON.menu}</button>
          </div>
        </div>
        <div class="chips"></div>
        <div class="deck"></div>
        <div class="actions">
          <button class="rb rb-nope" type="button" aria-label="לא בשבילי">${ICON.x}</button>
          <button class="rb rb-info" type="button" aria-label="פרטי הדירה">${ICON.info}</button>
          <button class="rb rb-like" type="button" aria-label="מעוניין">${ICON.heart}</button>
        </div>
      </section>`));

    const topCard = () => scr.querySelector('.card:not(.under)');
    scr.querySelector('.rb-nope').onclick = () => { const c = topCard(); c && c._fly('L'); };
    scr.querySelector('.rb-like').onclick = () => { const c = topCard(); c && c._fly('R'); };
    scr.querySelector('.rb-info').onclick = () => { const c = topCard(); c && details(byId(c.dataset.id)); };
    scr.querySelector('[data-matches]').onclick = () => A.go('matches');
    scr.querySelector('[data-menu]').onclick = menu;

    renderChips();
    renderDeck();
    updateBadge();
    A.state.likes.forEach((l, i) => { if (l.status === 'wait' && i % 2 === 0) schedule(l.id, 2600); });
  };

  function renderChips() {
    const c = document.querySelector('[data-screen="deck"] .chips');
    if (!c) return;
    const p = A.state.prefs;
    c.innerHTML = `
      <button class="chip strong" type="button" data-f>${ICON.filter} סינון</button>
      <button class="chip" type="button" data-f>עד ${nis(p.max)}</button>
      <button class="chip" type="button" data-f>${esc(areaLabel(p.area))}</button>
      <button class="chip" type="button" data-f>כניסה: ${esc(entryLabel(p.entry))}</button>`;
    c.querySelectorAll('[data-f]').forEach((b) => { b.onclick = filters; });
  }

  function renderDeck() {
    const scr = document.querySelector('[data-screen="deck"]');
    if (!scr) return;
    const deck = scr.querySelector('.deck');
    const acts = scr.querySelector('.actions');
    const list = eligible();
    deck.innerHTML = '';
    if (!list.length) { acts.hidden = true; deck.append(emptyEl()); return; }
    acts.hidden = false;
    if (list[1]) deck.append(el(cardHTML(list[1], true)));
    const top = el(cardHTML(list[0], false));
    deck.append(top);
    bind(top, list[0]);
  }

  /* ——— מסך ריק · הכפתור תמיד עושה משהו ——— */
  function emptyEl() {
    const p = A.state.prefs;
    const all = allApts();
    const above = all.filter((a) => !A.state.swiped[a.id] && a.rent > p.max);
    const skipped = all.filter((a) => A.state.swiped[a.id] === 'L');
    let label = '', action = null;
    if (above.length) {
      const cheapest = Math.min(...above.map((a) => a.rent));
      const next = Math.max(Math.ceil(p.max * 1.1 / 100) * 100, Math.ceil(cheapest / 100) * 100);
      const gain = above.filter((a) => a.rent <= next).length;
      label = `הרחבת הטווח עד ${nis(next)}`;
      action = () => {
        p.max = next; A.save(); A.log('expand', { max: next });
        renderChips(); renderDeck();
        A.toast(gain === 1 ? `נוספה דירה אחת עד ${nis(next)}` : `נוספו ${gain} דירות עד ${nis(next)}`);
      };
    } else if (skipped.length) {
      label = `להציג שוב ${skipped.length} דירות שדילגת`;
      action = () => {
        skipped.forEach((a) => delete A.state.swiped[a.id]);
        A.state.pen = {}; A.save(); renderDeck();
        A.toast('הדירות שדילגת חזרו לערימה');
      };
    }
    const node = el(`
      <div class="empty">
        <div class="sign">נגמרו הדירות<small>עד ${nis(p.max)}</small></div>
        <p>${above.length ? `יש עוד ${above.length} ${above.length === 1 ? 'דירה' : 'דירות'} מעל ${nis(p.max)}.` : 'ראית את כל הדירות באזור.'}</p>
        <div class="btn-row">
          ${label ? `<button class="btn-primary" type="button" data-expand>${label}</button>` : ''}
          <button class="btn-ghost" type="button" data-add>יש לך דירה? הוספת דירה</button>
        </div>
      </div>`);
    const ex = node.querySelector('[data-expand]');
    if (ex) ex.onclick = action;
    node.querySelector('[data-add]').onclick = () => A.go('add');
    return node;
  }

  /* ——— גיליונות ——— */
  function details(a) {
    if (!a) return;
    A.sheet(`
      <div class="sheet-photo"><div class="photo">${S.photo(a, 1)}</div></div>
      <h3>${esc(a.street)}${a.hood ? ' · ' + esc(a.hood) : ''}</h3>
      <p class="sub">${esc(a.city)}${a.example ? ' · דירה לדוגמה' : ''}</p>
      <dl class="kv">
        <dt>מחיר</dt><dd>${nis(a.rent)} לחודש</dd>
        <dt>חדרים</dt><dd>${a.rooms} · ${a.sqm} מ״ר</dd>
        <dt>קומה</dt><dd>${A.floorTxt(a.floor, a.floors)}</dd>
        <dt>כניסה</dt><dd>${fmtDate(a.entry, true)}</dd>
        <dt>מפרסם</dt><dd>${esc(a.by.name)} · ${esc(a.by.role)}</dd>
        <dt>כתובת</dt><dd>${esc(a.street)} · מספר הבית נחשף בהתאמה</dd>
      </dl>
      <div class="feat-list">${a.features.map((f) => `<span>${esc(f)}</span>`).join('')}</div>
      ${a.desc ? `<p>${esc(a.desc)}</p>` : ''}
      <div class="btn-row">
        ${a.tour ? '<button class="btn-ghost" type="button" data-tour>▶ סיור בדירה</button>' : ''}
        <div class="two-btn">
          <button class="btn-ghost" type="button" data-nope>לא בשבילי</button>
          <button class="btn-primary" type="button" data-like>מעוניין</button>
        </div>
      </div>`, (sh, close) => {
      const fire = (dir) => () => {
        close();
        const c = document.querySelector(`.card[data-id="${a.id}"]:not(.under)`);
        c && c._fly(dir);
      };
      sh.querySelector('[data-nope]').onclick = fire('L');
      sh.querySelector('[data-like]').onclick = fire('R');
      const t = sh.querySelector('[data-tour]');
      if (t) t.onclick = () => { close(); tour(a); };
    });
  }

  function filters() {
    const p = Object.assign({}, A.state.prefs);
    const opt = (group, id, label) => `<button class="opt" type="button" data-g="${group}" data-v="${id}" aria-pressed="${p[group] === id}">${esc(label)}</button>`;
    A.sheet(`
      <h3>סינון</h3>
      <p class="sub">רק המחיר מסנן דירות החוצה. אזור ותאריך קובעים מה מופיע קודם.</p>
      <div class="q" style="margin-top:6px"><span class="q-label">עד כמה בחודש</span>
        <div class="price-out"><output>${p.max.toLocaleString('en-US')}</output><span>₪</span></div>
        <input class="range" type="range" min="3000" max="8000" step="100" value="${p.max}" aria-label="מחיר מקסימלי"></div>
      <div class="q"><span class="q-label">אזור</span><div class="opts">${D.areas.map((a) => opt('area', a.id, a.label)).join('')}</div></div>
      <div class="q"><span class="q-label">כניסה</span><div class="opts">${D.entryChoices.map((e) => opt('entry', e.id, e.label)).join('')}</div></div>
      <button class="btn-primary" type="button" data-apply style="margin-top:22px">הצגת הדירות</button>
    `, (sh, close) => {
      const r = sh.querySelector('.range');
      r.oninput = () => { p.max = Number(r.value); sh.querySelector('output').textContent = p.max.toLocaleString('en-US'); };
      sh.querySelectorAll('.opt').forEach((b) => {
        b.onclick = () => {
          p[b.dataset.g] = b.dataset.v;
          sh.querySelectorAll(`.opt[data-g="${b.dataset.g}"]`).forEach((x) => x.setAttribute('aria-pressed', x === b));
        };
      });
      sh.querySelector('[data-apply]').onclick = () => {
        A.state.prefs = p; A.save(); A.log('filter', { max: p.max, area: p.area });
        close(); renderChips(); renderDeck();
      };
    });
  }

  function menu() {
    A.sheet(`
      <h3>עוד</h3>
      <div class="list" style="margin:10px -20px 0">
        <button class="li" type="button" data-m="add"><div class="li-main"><b>הוספת דירה</b><span>יש לך דירה להשכרה</span></div></button>
        <button class="li" type="button" data-m="owner"><div class="li-main"><b>הצד של בעל הדירה</b><span>איך נראות הפניות אצלו</span></div></button>
        <button class="li" type="button" data-m="open"><div class="li-main"><b>שינוי החיפוש</b><span>אזור, מחיר ותאריך כניסה</span></div></button>
        <button class="li" type="button" data-m="reset"><div class="li-main"><b>התחלה מחדש</b><span>מוחק החלקות, התאמות ושיחות מהמכשיר</span></div></button>
      </div>
    `, (sh, close) => {
      sh.querySelectorAll('[data-m]').forEach((b) => {
        b.onclick = () => {
          close();
          const m = b.dataset.m;
          if (m === 'owner') location.hash = 'owner';
          else if (m === 'reset') { A.reset(); scheduled.clear(); A.go('open'); }
          else A.go(m);
        };
      });
    });
  }

  function tour(a) {
    const n = S.count(a);
    let i = 0, timer;
    const t = el(`
      <div class="tour" role="dialog" aria-label="סיור בדירה">
        <div class="tour-stage"><div class="photo"></div></div>
        <div class="bars">${Array.from({ length: n }, () => '<i class="bar"></i>').join('')}</div>
        <div class="tour-top"><span>סיור לדוגמה · ${esc(a.street)}</span><button type="button" aria-label="סגירה">${ICON.close}</button></div>
      </div>`);
    const stage = t.querySelector('.tour-stage');
    const show = () => {
      if (i >= n) return close();
      stage.innerHTML = `<div class="photo">${S.photo(a, i)}</div>`;
      t.querySelectorAll('.bar').forEach((b, k) => b.classList.toggle('on', k <= i));
      clearTimeout(timer);
      timer = setTimeout(() => { i++; show(); }, 3200);
    };
    const close = () => { clearTimeout(timer); t.remove(); };
    t.querySelector('.tour-top button').onclick = close;
    stage.onclick = () => { i++; show(); };
    document.getElementById('app').append(t);
    A.log('tour', { id: a.id });
    show();
  }

  /* ——— התאמות ——— */
  A.routes.matches = function () {
    const likes = A.state.likes.slice().reverse();
    const rows = likes.map((l) => {
      const a = byId(l.id);
      if (!a) return '';
      const ok = l.status === 'match';
      return `<button class="li" type="button" data-id="${a.id}" ${ok ? '' : 'data-wait'}>
        <div class="li-thumb"><div class="photo">${S.photo(a, 0)}</div></div>
        <div class="li-main"><b>${esc(a.street)}${a.hood ? ' · ' + esc(a.hood) : ''}</b><span>${nis(a.rent)} · ${esc(a.by.name)}</span></div>
        <span class="state ${ok ? 'ok' : ''}">${ok ? (A.state.chats['a-' + a.id] ? 'שיחה פתוחה' : 'יש התאמה') : 'ממתין לאישור'}</span>
      </button>`;
    }).join('');
    const scr = A.mount(el(`
      <section class="screen">
        <div class="top"><button class="back" type="button">${ICON.back} לדירות</button></div>
        <div class="sect-h"><h2>התאמות ופניות</h2><span>${likes.length}</span></div>
        <div class="scroll" style="flex:1">
          ${likes.length ? `<div class="list">${rows}</div>` : '<div class="empty"><p>עוד אין פניות. החלקה ימינה על דירה שולחת פנייה לבעל הדירה.</p></div>'}
          <p class="fine" style="padding:0 20px">פנייה הופכת להתאמה כשבעל הדירה מאשר.</p>
        </div>
      </section>`));
    scr.querySelector('.back').onclick = () => A.go('deck');
    scr.querySelectorAll('.li').forEach((b) => {
      b.onclick = () => {
        if (b.hasAttribute('data-wait')) return A.toast('בעל הדירה עוד לא אישר');
        const id = b.dataset.id;
        A.state.chats['a-' + id] ? openChat(byId(id)) : A.go('match', id);
      };
    });
  };

  A.routes.match = function (id) {
    const a = byId(id);
    if (!a) return A.go('deck');
    const like = A.state.likes.find((l) => l.id === id);
    if (like) { like.seen = true; A.save(); }
    const scr = A.mount(el(`
      <section class="screen match scroll">
        <div class="match-center">
          <div class="sign">יש התאמה</div>
          <div class="match-art"><div class="photo">${S.photo(a, 0)}</div></div>
          <h2>${esc(a.by.name)} ${g(a.by.g, 'אישר', 'אישרה')} את הפנייה שלך</h2>
          <p class="sub">${esc(a.street)}${a.hood ? ', ' + esc(a.hood) : ''} · ${nis(a.rent)}</p>
        </div>
        <ul class="reveal">
          <li><b>נחשף לך</b>הכתובת המלאה: ${esc(a.street)} ${a.houseNo}</li>
          <li><b>נחשף ל${esc(a.by.name)}</b>מקור הכנסה · הכנסות נוספות · נפשות · קצת עליך</li>
        </ul>
        <div class="btn-row">
          <button class="btn-primary" type="button" data-go>${A.state.profile ? 'פתיחת השיחה' : 'השלמת פרטים ופתיחת השיחה'}</button>
          <button class="btn-ghost" type="button" data-back>המשך החלקה</button>
        </div>
        <p class="fine" style="color:rgba(255,255,255,.72)">הפרטים שלך נחשפים רק לבעלי דירות שאישרו אותך.</p>
      </section>`));
    scr.querySelector('[data-go]').onclick = () => (A.state.profile ? openChat(a) : A.go('profile', id));
    scr.querySelector('[data-back]').onclick = () => A.go('deck');
  };

  /* ——— פרטים · רק אחרי התאמה ——— */
  A.routes.profile = function (id) {
    const a = byId(id);
    const pr = A.state.profile || {};
    const max = (A.state.prefs && A.state.prefs.max) || 5500;
    const scr = A.mount(el(`
      <section class="screen scroll">
        <div class="top"><button class="back" type="button">${ICON.back} חזרה</button></div>
        <form class="form" novalidate>
          <h2>הפרטים שלך</h2>
          <p class="sub">${esc(a.by.name)} ${g(a.by.g, 'יראה', 'תראה')} אותם עכשיו, כי יש ביניכם התאמה. אף אחד אחר לא רואה אותם.</p>
          <button class="linkish" type="button" data-fill>מילוי פרטים לדוגמה</button>
          <div class="field"><label for="f-name">שם מלא</label><input id="f-name" name="name" autocomplete="name" value="${esc(pr.name || '')}"></div>
          <div class="field"><label for="f-about">קצת עליך</label><textarea id="f-about" name="about" placeholder="מי גר בדירה, עבודה מהבית, חיות">${esc(pr.about || '')}</textarea></div>
          <div class="row2">
            <div class="field"><label for="f-income">מקור הכנסה</label>
              <select id="f-income" name="income">${['שכיר/ה', 'עצמאי/ת', 'סטודנט/ית', 'קצבה', 'אחר'].map((o) => `<option ${pr.income === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
            <div class="field"><label for="f-job">מקום עבודה</label><input id="f-job" name="job" value="${esc(pr.job || '')}"></div>
          </div>
          <div class="row2">
            <div class="field"><label for="f-min">תשלום מ-</label><input id="f-min" name="payMin" inputmode="numeric" value="${esc(pr.payMin || max - 600)}"></div>
            <div class="field"><label for="f-max">עד</label><input id="f-max" name="payMax" inputmode="numeric" value="${esc(pr.payMax || max)}"></div>
          </div>
          <div class="row2">
            <div class="field"><label for="f-occ">נפשות</label><input id="f-occ" name="occupants" inputmode="numeric" value="${esc(pr.occupants || '')}"></div>
            <div class="field"><label for="f-extra">הכנסה נוספת</label><input id="f-extra" name="extra" value="${esc(pr.extra || '')}"></div>
          </div>
          <div class="field"><span class="label">תמונה (לא חובה)</span><input type="file" accept="image/*" name="photo"></div>
          <button class="btn-primary" type="submit">שמירה ופתיחת השיחה</button>
        </form>
      </section>`));
    const f = scr.querySelector('form');
    scr.querySelector('.back').onclick = () => A.go('match', id);
    scr.querySelector('[data-fill]').onclick = () => {
      const ex = { name: 'דנה לוי', about: 'גרה לבד עם חתולה, עובדת מהבית פעמיים בשבוע.', income: 'שכיר/ה', job: 'בית חולים רמב״ם', payMin: max - 600, payMax: max, occupants: 1, extra: 'אין' };
      Object.keys(ex).forEach((k) => { if (f.elements[k]) f.elements[k].value = ex[k]; });
    };
    f.onsubmit = (e) => {
      e.preventDefault();
      if (!f.elements.name.value.trim()) { A.toast('חסר שם מלא · אפשר גם «מילוי פרטים לדוגמה»'); f.elements.name.focus(); return; }
      const data = {};
      ['name', 'about', 'income', 'job', 'payMin', 'payMax', 'occupants', 'extra'].forEach((k) => { data[k] = f.elements[k].value.trim(); });
      A.state.profile = data; A.save(); A.log('profile', {});
      openChat(a);
    };
  };

  function openChat(a) {
    A.chat({
      key: 'a-' + a.id,
      title: `${a.by.name} · ${a.by.role}`,
      subtitle: `${a.street} ${a.houseNo}${a.hood ? ', ' + a.hood : ''}`,
      initials: a.by.name[0],
      prefill: `היי ${a.by.name}, ראיתי את הדירה ב${a.street}. אשמח לתאם ביקור 🙂`,
      replies: [`היי! ${g(a.by.g, 'שמח', 'שמחה')} שיש התאמה. אפשר לבוא לראות מחר בשש?`, 'מעולה. אשלח לך את הקוד לכניסה לבניין.', '🙂'],
      onBack: () => A.go('matches'),
      after: '<a class="btn-ghost" href="#owner">איך זה נראה אצל בעל הדירה</a><button class="btn-primary" type="button" data-add>יש לך דירה להשכרה? הוספת דירה</button>',
      afterMount: (node) => { node.querySelector('[data-add]').onclick = () => A.go('add'); }
    });
  }

  /* ——— הוספת דירה ——— */
  A.routes.add = function () {
    const FEATS = ['מרפסת', 'חניה', 'ממ"ד', 'מעלית', 'מזגנים', 'משופצת', 'חיות מחמד', 'מרוהטת', 'נוף לים', 'מחסן'];
    const CITIES = ['חיפה', 'קריית ביאליק', 'קריית מוצקין', 'קריית אתא', 'קריית ים', 'נשר', 'טירת כרמל'];
    const chosen = new Set();
    let photos = [];
    const scr = A.mount(el(`
      <section class="screen scroll">
        <div class="top"><button class="back" type="button">${ICON.back} חזרה</button></div>
        <form class="form" novalidate>
          <h2>הוספת דירה</h2>
          <p class="sub">הדירה תופיע ככרטיס הבא בערימה.</p>
          <div class="row2">
            <div class="field"><label for="d-city">עיר</label><select id="d-city" name="city">${CITIES.map((c) => `<option>${c}</option>`).join('')}</select></div>
            <div class="field"><label for="d-hood">שכונה</label><input id="d-hood" name="hood" placeholder="כרמל מרכזי"></div>
          </div>
          <div class="row2">
            <div class="field"><label for="d-street">רחוב</label><input id="d-street" name="street" placeholder="שדרות מוריה"></div>
            <div class="field"><label for="d-no">מספר בית</label><input id="d-no" name="houseNo" inputmode="numeric" placeholder="נחשף בהתאמה"></div>
          </div>
          <div class="row2">
            <div class="field"><label for="d-rooms">חדרים</label><select id="d-rooms" name="rooms">${[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6].map((r) => `<option ${r === 3 ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
            <div class="field"><label for="d-sqm">מ״ר</label><input id="d-sqm" name="sqm" inputmode="numeric" placeholder="75"></div>
          </div>
          <div class="row2">
            <div class="field"><label for="d-rent">מחיר לחודש</label><input id="d-rent" name="rent" inputmode="numeric" placeholder="4,800"></div>
            <div class="field"><label for="d-entry">כניסה</label><input id="d-entry" name="entry" type="date" min="${D.today}" value="2026-10-15"></div>
          </div>
          <div class="field"><span class="label">מה יש בדירה</span><div class="opts">${FEATS.map((x) => `<button class="opt" type="button" aria-pressed="false" data-feat="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
          <div class="field"><span class="label">תמונות</span>
            <label class="photo-drop">בחירת תמונות מהטלפון<input type="file" accept="image/*" multiple hidden></label>
            <div class="thumbs"></div></div>
          <div class="field"><label for="d-desc">כמה מילים על הדירה</label><textarea id="d-desc" name="desc"></textarea></div>
          <p class="note">בדמו הדירה נשמרת רק במכשיר הזה, והתמונות רק עד שסוגרים את הדף.</p>
          <button class="btn-primary" type="submit">פרסום הדירה</button>
        </form>
      </section>`));
    const f = scr.querySelector('form');
    scr.querySelector('.back').onclick = () => A.go(A.state.prefs ? 'deck' : 'open');
    scr.querySelectorAll('[data-feat]').forEach((b) => {
      b.onclick = () => {
        const on = !chosen.has(b.dataset.feat);
        on ? chosen.add(b.dataset.feat) : chosen.delete(b.dataset.feat);
        b.setAttribute('aria-pressed', on);
      };
    });
    const file = scr.querySelector('input[type=file]');
    file.onchange = () => {
      const thumbs = scr.querySelector('.thumbs');
      Array.from(file.files).slice(0, 8).forEach((fl) => {
        const rd = new FileReader();
        rd.onload = () => { photos.push(rd.result); thumbs.append(el(`<img src="${rd.result}" alt="">`)); };
        rd.readAsDataURL(fl);
      });
    };
    f.onsubmit = (e) => {
      e.preventDefault();
      const v = (k) => f.elements[k].value.trim();
      const rent = Number(v('rent').replace(/[^\d]/g, ''));
      if (!v('street')) { A.toast('חסר שם רחוב'); f.elements.street.focus(); return; }
      if (!rent) { A.toast('חסר מחיר לחודש'); f.elements.rent.focus(); return; }
      const city = v('city');
      const apt = {
        id: 'm' + Date.now(), mine: true, example: false,
        area: city === 'חיפה' ? 'haifa' : 'krayot', city, hood: v('hood'), street: v('street'),
        houseNo: v('houseNo') || '—', rooms: Number(v('rooms')), sqm: Number(v('sqm')) || 70,
        floor: 1, floors: 3, rent, entry: v('entry') || D.today, features: Array.from(chosen), desc: v('desc'),
        by: { name: 'בעל הדירה', g: 'm', role: 'בעל הדירה' },
        pal: ['sea', 'sand', 'pine', 'rose', 'slate', 'bauhaus'][Math.floor(Math.random() * 6)],
        scenes: ['living', 'kitchen', 'bedroom'], photos: []
      };
      photoMem[apt.id] = photos;
      A.state.added.unshift(apt);
      if (!A.state.prefs) A.state.prefs = { area: 'all', max: 5500, entry: 'flex' };
      if (rent > A.state.prefs.max) A.state.prefs.max = Math.ceil(rent / 100) * 100;
      A.save(); A.log('add', { rent });
      A.go('deck');
      A.toast('הדירה פורסמה · היא הכרטיס הבא בערימה');
    };
  };
})();
