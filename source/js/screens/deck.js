/*
 * לשונית «דירות»: ערימה, החלקה, שלושה כפתורים, שבבי סינון, מסך ריק שמרחיב באמת, וסינון חכם.
 * הכפתורים לפי הכרעה 5: ♥ מימין, ★ באמצע, ✕ משמאל. סדר ה-DOM הוא סדר הקריאה מימין לשמאל.
 */
(function (Dira) {
  'use strict';

  const screens = Dira.screens = Dira.screens || {};
  const sheets = Dira.sheets = Dira.sheets || {};
  const { esc, el, I } = Dira.ui;
  const scenes = Dira.scenes;

  screens['/deck'] = function (root, ctx) {
    const { S, store, actions, router, cfg, match: M } = ctx;
    root.innerHTML = `
      <section class="screen deck-screen">
        <header class="app-top">
          <h1 class="brand">${I.home} ${esc(S.app.brand)}</h1>
          <div class="top-icons">
            <button class="icon-btn" type="button" data-filter></button>
            <button class="icon-btn" type="button" data-publish aria-label="${esc(S.top.publish)}">${I.addHome}</button>
          </div>
        </header>
        <div class="chips filter-row" role="group" aria-label="${esc(S.deck.activeFilter)}" hidden></div>
        <div class="deck"></div>
        <div class="actions">
          <button class="rb rb-like" type="button" data-dir="R" aria-label="${esc(S.deck.like)}">${I.heart}</button>
          <button class="rb rb-star" type="button" data-dir="U" aria-label="${esc(S.deck.star)}">${I.star}</button>
          <button class="rb rb-nope" type="button" data-dir="L" aria-label="${esc(S.deck.nope)}">${I.x}</button>
        </div>
      </section>`;
    const deckEl = root.querySelector('.deck'), actsEl = root.querySelector('.actions');
    const chipsEl = root.querySelector('.filter-row'), filterBtn = root.querySelector('[data-filter]');
    root.querySelector('[data-publish]').onclick = () => router.go('/publish');
    filterBtn.onclick = () => router.openSheet('filter');
    actsEl.querySelectorAll('[data-dir]').forEach((b) => { b.onclick = () => topCard && topCard.fly(b.dataset.dir); });

    let topCard = null;
    ctx.deckApi = { topId: () => (topCard ? topCard.a.id : null), fly: (dir) => topCard && topCard.fly(dir) };

    /* ——— כרטיס ——— */
    function cardHTML(a, under) {
      const st = store.get();
      const n = scenes.count(a);
      const saved = st.saved[a.id];
      const similar = !a.mine && st.tune.n && M.similarity(a, st.tune, cfg) >= cfg.similarTagMin;
      return `
        <article class="card${under ? ' under' : ''}" data-id="${esc(a.id)}" ${under ? 'aria-hidden="true"' : `tabindex="0" aria-roledescription="${esc(S.card.role)}" aria-label="${esc(S.card.aria(a))}"`}>
          ${Dira.parts.photo(a, 0)}
          <div class="bars" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="bar${i === 0 ? ' on' : ''}"></i>`).join('')}</div>
          <div class="card-tags">
            ${a.mine ? `<span class="tag tag-mine">${esc(S.card.mine)}</span>` : ''}
            ${a.example ? `<span class="tag">${esc(S.card.example)}</span>` : ''}
            ${saved && saved.star ? `<span class="tag tag-star">${esc(S.card.starred)}</span>` : ''}
            ${similar ? `<span class="tag tag-similar">${esc(S.card.similar)}</span>` : ''}
          </div>
          <div class="stamp stamp-like" aria-hidden="true">${esc(S.card.stampLike)}</div>
          <div class="stamp stamp-nope" aria-hidden="true">${esc(S.card.stampNope)}</div>
          <div class="stamp stamp-star" aria-hidden="true">${esc(S.card.stampStar)}</div>
          <div class="info">
            <h2 class="title">${esc(a.title)}</h2>
            <p class="loc">${I.pin}${esc(S.fmt.place(a) || a.city)}</p>
            <div class="specs-row"><span class="price">${esc(S.fmt.nis(a.rent))}</span>${Dira.parts.specs(a, S)}</div>
            <p class="desc">${esc(a.desc)}</p>
          </div>
          <span class="sr-only" data-photo-label>${esc(S.card.photo(1, n))}</span>
        </article>`;
    }

    function bindCard(card, a) {
      const n = scenes.count(a);
      const stamps = { R: card.querySelector('.stamp-like'), L: card.querySelector('.stamp-nope'), U: card.querySelector('.stamp-star') };
      const t0 = performance.now();
      let sx = 0, sy = 0, dx = 0, dy = 0, down = false, photoI = 0, gone = false;
      const clamp = (v) => Math.max(0, Math.min(1, v));
      const setStamps = () => {
        stamps.R.style.opacity = clamp(dx / cfg.stampFullDx);
        stamps.L.style.opacity = clamp(-dx / cfg.stampFullDx);
        stamps.U.style.opacity = Math.abs(dx) < cfg.starMaxDx ? clamp(-dy / cfg.stampFullDy) : 0;
      };

      function showPhoto(i) {
        photoI = Math.max(0, Math.min(n - 1, i));
        card.querySelector('.photo').innerHTML = scenes.photo(a, photoI);
        card.querySelectorAll('.bar').forEach((b, k) => b.classList.toggle('on', k <= photoI));
        card.querySelector('[data-photo-label]').textContent = S.card.photo(photoI + 1, n);
      }

      function fly(dir) {
        if (gone) return;
        gone = true;
        topCard = null;
        card.classList.remove('snap');
        card.classList.add('fly');
        stamps[dir].style.opacity = 1;
        const w = card.offsetWidth;
        card.style.transform = dir === 'U' ? 'translateY(-120%) scale(.9)'
          : `translate(${(dir === 'R' ? 1 : -1) * w * cfg.flyOutFactor}px, ${dy * cfg.dragYFactor}px) rotate(${dir === 'R' ? cfg.flyTiltDeg : -cfg.flyTiltDeg}deg)`;
        card.style.opacity = '0';
        const ms = performance.now() - t0;
        setTimeout(() => actions.swipe(a, dir, ms), ctx.motionMs);
      }

      card.addEventListener('pointerdown', (e) => {
        if (e.button || gone) return;
        down = true; sx = e.clientX; sy = e.clientY; dx = dy = 0;
        card.classList.remove('snap');
        try { card.setPointerCapture(e.pointerId); } catch (_) { /* דפדפן ישן */ }
      });
      card.addEventListener('pointermove', (e) => {
        if (!down) return;
        dx = e.clientX - sx; dy = e.clientY - sy;
        card.style.transform = `translate(${dx}px, ${dy * cfg.dragYFactor}px) rotate(${dx / cfg.tiltDivisor}deg)`;
        setStamps();
      });
      const end = (e) => {
        if (!down) return;
        down = false;
        if (Math.abs(dx) > card.offsetWidth * cfg.swipeRatio) return fly(dx > 0 ? 'R' : 'L');
        if (dy < -card.offsetHeight * cfg.starRatio && Math.abs(dx) < cfg.starMaxDx) return fly('U');
        if (e.type === 'pointerup' && Math.abs(dx) < cfg.tapSlop && Math.abs(dy) < cfg.tapSlop) tap(e);
        card.classList.add('snap');
        card.style.transform = '';
        dx = dy = 0; setStamps();
      };
      card.addEventListener('pointerup', end);
      card.addEventListener('pointercancel', end);

      /* הקשה על המידע = פרטים. הקשה על התמונה = תמונה הבאה לכיוון הקריאה (שמאלה), או הקודמת (ימינה) */
      function tap(e) {
        if (e.target.closest('.info')) return router.openSheet('apt:' + a.id);
        const r = card.getBoundingClientRect();
        showPhoto(e.clientX < r.left + r.width / 2 ? photoI + 1 : photoI - 1);
      }
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); router.openSheet('apt:' + a.id); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); showPhoto(photoI + 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); showPhoto(photoI - 1); }
      });
      return { a, fly };
    }

    /* ——— ציור אזורי ——— */
    function drawDeck() {
      const list = M.deckOrder(ctx.allApts(), store.get(), ctx.matchCtx());
      const hadFocus = deckEl.contains(document.activeElement);
      deckEl.innerHTML = '';
      topCard = null;
      if (!list.length) { actsEl.hidden = true; deckEl.append(emptyEl()); return; }
      actsEl.hidden = false;
      if (list[1]) deckEl.append(el(cardHTML(list[1], true)));
      const card = el(cardHTML(list[0], false));
      deckEl.append(card);
      topCard = bindCard(card, list[0]);
      ctx.setAmbient(list[0]);
      if (hadFocus) card.focus({ preventScroll: true });
    }

    function chipLabels(f) {
      const C = S.deck.chip, out = [];
      if (f.label === 'ai') out.push(C.ai);
      if (f.foryou) out.push(C.foryou);
      if (f.q) out.push(C.q(f.q));
      if (f.max) out.push(C.max(f.max));
      if (f.rooms) out.push(C.rooms(f.rooms));
      if (f.beds) out.push(C.beds(f.beds));
      if (f.baths) out.push(C.baths(f.baths));
      if (f.sqm) out.push(C.sqm(f.sqm));
      (f.cats || []).forEach((id) => { const c = ctx.data.categories.find((x) => x.id === id); if (c) out.push(c.label); });
      (f.feats || []).forEach((x) => out.push(x));
      (f.places || []).forEach((x) => out.push(x));
      return out;
    }

    function drawChips() {
      const f = store.get().filter;
      filterBtn.innerHTML = I.sliders + (f ? '<i class="dot" aria-hidden="true"></i>' : '');
      filterBtn.setAttribute('aria-label', f ? S.top.filterOn : S.top.filter);
      chipsEl.hidden = !f;
      if (!f) { chipsEl.innerHTML = ''; return; }
      chipsEl.innerHTML = chipLabels(f).map((p) => `<button class="chip on" type="button" data-open>${esc(p)}</button>`).join('') +
        `<button class="chip" type="button" data-clear>${I.x} ${esc(S.deck.clearChip)}</button>`;
      chipsEl.querySelectorAll('[data-open]').forEach((b) => { b.onclick = () => router.openSheet('filter'); });
      chipsEl.querySelector('[data-clear]').onclick = () => actions.applyFilter(null, S.deck.cleared);
    }

    /* ——— מסך ריק (הכרעה 24) ——— */
    function emptyEl() {
      const st = store.get(), f = st.filter, all = ctx.allApts(), D = S.deck;
      let title, text, note = '', primary = null;
      if (f) {
        const hits = all.filter((a) => M.passes(a, f, ctx.matchCtx())).length;
        title = D.emptyFilterTitle;
        text = hits ? D.emptyFilterSeen(hits) : D.emptyFilterNone;
        const w = M.widen(f, all, st.swiped, ctx.matchCtx());
        if (w) {
          w.changes.forEach((c) => { if (c.kind === 'cat') c.label = (ctx.data.categories.find((x) => x.id === c.value) || {}).label; });
          note = D.widenNote(w.changes);
          primary = [D.widen, () => {
            const n = all.filter((a) => !st.swiped[a.id] && M.passes(a, w.filter, ctx.matchCtx())).length;
            actions.applyFilter(w.filter, D.widened(n));
          }];
        } else primary = [D.clearFilter, () => actions.applyFilter(null, D.cleared)];
      } else {
        title = D.emptyAllTitle;
        text = D.emptyAllText;
        const skipped = Object.keys(st.swiped).filter((id) => st.swiped[id] === 'L').length;
        if (skipped) primary = [D.again(skipped), actions.resetSkipped];
      }
      const node = el(`
        <div class="empty">
          <div class="big" aria-hidden="true">${I.home}</div>
          <h2>${esc(title)}</h2><p>${esc(text)}</p>
          <div class="btn-row">
            ${primary ? `<button class="btn-primary" type="button" data-act>${esc(primary[0])}</button>` : ''}
            ${note ? `<p class="fine">${esc(note)}</p>` : ''}
            <button class="btn-ghost" type="button" data-pub>${I.addHome} ${esc(D.publish)}</button>
          </div>
        </div>`);
      if (primary) node.querySelector('[data-act]').onclick = primary[1];
      node.querySelector('[data-pub]').onclick = () => router.go('/publish');
      return node;
    }

    drawChips();
    drawDeck();
    if (!store.get().flags.hint) setTimeout(() => { if (!root.contains(deckEl)) return; actions.seenHint(); Dira.ui.toast(S.deck.hint); }, cfg.hintDelayMs);

    return { topics: { deck: drawDeck, filter: () => { drawChips(); drawDeck(); } } };
  };

  /* ——— סינון חכם (#/deck?s=filter), הכרעה 16 ——— */
  sheets.filter = function (ctx) {
    const { S, store, actions, cfg, data } = ctx;
    const F = S.filter;
    const cur = store.get().filter || {};
    const f = { q: cur.q || '', max: cur.max || 0, beds: cur.beds || 0, baths: cur.baths || 0, sqm: cur.sqm || 0, cats: (cur.cats || []).slice() };
    /* מה שהגיע מהעוזר או מ«מותאם לך» נשמר, ומוצג כשבבים */
    const kept = { rooms: cur.rooms, feats: cur.feats, places: cur.places, foryou: cur.foryou, label: cur.label };
    const keptLabels = [cur.foryou ? S.deck.chip.foryou : '', cur.rooms ? S.deck.chip.rooms(cur.rooms) : ''].concat(cur.feats || [], cur.places || []).filter(Boolean);
    const seg = (key, vals) => vals.map(([v, l]) => `<button class="opt" type="button" data-k="${esc(key)}" data-v="${esc(v)}" aria-pressed="${f[key] === v}">${esc(l)}</button>`).join('');
    const maxText = () => (f.max ? S.fmt.nis(f.max) : F.noLimit);
    const sqmText = () => (f.sqm ? F.sqmVal(f.sqm) : F.sqmNone);
    const build = () => {
      const q = Object.assign({}, kept, f);
      Object.keys(q).forEach((k) => { if (!q[k] || (Array.isArray(q[k]) && !q[k].length)) delete q[k]; });
      return q;
    };

    const html = `
      <div class="sheet-head"><h2 id="sh-filter">${I.sliders} ${esc(F.title)}</h2><button class="linkish" type="button" data-reset>${esc(F.reset)}</button></div>
      <div class="q"><label class="q-label" for="flt-q">${esc(F.q)}</label>
        <div class="search">${I.search}<input id="flt-q" type="search" value="${esc(f.q)}" placeholder="${esc(F.qPh)}"></div></div>
      <div class="q"><label class="q-label" for="flt-max">${esc(F.price)} <output class="range-out" data-maxout>${esc(maxText())}</output></label>
        <input id="flt-max" class="range" type="range" min="${cfg.priceFloor}" max="${cfg.priceCeil}" step="${cfg.priceStep}" value="${f.max || cfg.priceCeil}" aria-valuetext="${esc(maxText())}"></div>
      <fieldset class="q"><legend class="q-label">${esc(F.beds)}</legend><div class="opts">${seg('beds', [[0, F.any], [1, '1'], [2, '2'], [3, '3'], [4, '4+']])}</div></fieldset>
      <fieldset class="q"><legend class="q-label">${esc(F.baths)}</legend><div class="opts">${seg('baths', [[0, F.any], [1, '1'], [2, '2+']])}</div></fieldset>
      <div class="q"><label class="q-label" for="flt-sqm">${esc(F.sqm)} <output class="range-out" data-sqmout>${esc(sqmText())}</output></label>
        <input id="flt-sqm" class="range" type="range" min="0" max="${cfg.sqmCeil}" step="${cfg.sqmStep}" value="${f.sqm}" aria-valuetext="${esc(sqmText())}"></div>
      <fieldset class="q"><legend class="q-label">${esc(F.cats)}</legend><div class="opts">${data.categories.filter((c) => c.test).map((c) => `<button class="chip" type="button" data-cat="${esc(c.id)}" aria-pressed="${f.cats.includes(c.id)}">${esc(c.label)}</button>`).join('')}</div></fieldset>
      ${keptLabels.length ? `<p class="fine">${esc(F.kept)} ${esc(keptLabels.join(', '))}</p>` : ''}
      <div class="two-btn sheet-foot">
        <button class="btn-ghost" type="button" data-clear>${esc(F.clearAll)}</button>
        <button class="btn-primary" type="button" data-apply></button>
      </div>`;

    function mount(sh) {
      const apply = sh.querySelector('[data-apply]');
      const count = () => { apply.innerHTML = `${I.check} ${esc(F.apply(actions.countFor(build())))}`; };
      sh.querySelectorAll('[data-k]').forEach((b) => {
        b.onclick = () => {
          f[b.dataset.k] = Number(b.dataset.v);
          sh.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          count();
        };
      });
      sh.querySelectorAll('[data-cat]').forEach((b) => {
        b.onclick = () => {
          const on = !f.cats.includes(b.dataset.cat);
          f.cats = on ? f.cats.concat(b.dataset.cat) : f.cats.filter((x) => x !== b.dataset.cat);
          b.setAttribute('aria-pressed', String(on));
          count();
        };
      });
      const q = sh.querySelector('#flt-q'), mx = sh.querySelector('#flt-max'), sq = sh.querySelector('#flt-sqm');
      q.oninput = () => { f.q = q.value.trim(); count(); };
      mx.oninput = () => {
        f.max = Number(mx.value) >= cfg.priceCeil ? 0 : Number(mx.value);
        sh.querySelector('[data-maxout]').textContent = maxText(); mx.setAttribute('aria-valuetext', maxText()); count();
      };
      sq.oninput = () => {
        f.sqm = Number(sq.value);
        sh.querySelector('[data-sqmout]').textContent = sqmText(); sq.setAttribute('aria-valuetext', sqmText()); count();
      };
      const clear = () => { ctx.closeSheetNow(); actions.applyFilter(null, S.deck.cleared); };
      sh.querySelector('[data-reset]').onclick = clear;
      sh.querySelector('[data-clear]').onclick = clear;
      apply.onclick = () => {
        const out = build();
        const n = actions.countFor(out);
        ctx.closeSheetNow();
        actions.applyFilter(out, F.applied(n));
      };
      count();
    }

    return { html, labelId: 'sh-filter', mount };
  };
})(globalThis.Dira = globalThis.Dira || {});
