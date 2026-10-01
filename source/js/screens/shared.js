/*
 * מסכים משותפים: פרטי דירה (גיליון), התאמה ושיחה לשני הצדדים, ופרטי המחפש אחרי התאמה.
 * מסך התאמה ומסך שיחה אחד, עם פרמטר צד.
 */
(function (Dira) {
  'use strict';

  const screens = Dira.screens = Dira.screens || {};
  const sheets = Dira.sheets = Dira.sheets || {};
  const { esc, I } = Dira.ui;
  const scenes = Dira.scenes;

  /* ——— חלקי כרטיס שחוזרים בכמה מסכים ——— */
  const parts = {
    photo: (a, i) => `<div class="photo">${scenes.photo(a, i)}</div>`,
    specs(a, S) {
      const c = S.card;
      return `<span class="specs">
        <span>${I.bed}<span class="sr-only">${esc(c.beds)}</span>${esc(a.beds)}</span>
        <span>${I.bath}<span class="sr-only">${esc(c.baths)}</span>${esc(a.baths)}</span>
        <span>${I.ruler}${esc(a.sqm)} ${esc(c.sqm)}</span></span>`;
    }
  };
  Dira.parts = parts;

  /* ——— פרטי דירה (#...?s=apt:ID) ——— */
  sheets.apt = function (ctx, id) {
    const { S, store, actions, router } = ctx;
    const a = ctx.aptById(id);
    if (!a) return null;
    const D = S.details, f = S.fmt;
    const yesNo = (v) => (v ? D.allowed : D.notAllowed);
    const today = new Date().toISOString().slice(0, 10);
    const credits = Array.from(new Set((a.photos || []).map((p) => ctx.data.photoCredits[p]).filter(Boolean)));

    const actionsHTML = () => {
      const st = store.get();
      const req = st.requests.find((r) => r.id === a.id);
      const saved = st.saved[a.id];
      let main;
      if (a.mine) main = `<p class="note">${esc(D.mineBy)}</p>`;
      else if (!req) main = `<button class="btn-primary" type="button" data-req>${esc(D.send(a))}</button><p class="fine">${esc(D.sendNote(a))}</p>`;
      else if (req.status === 'wait') main = `<p class="status wait">${esc(D.waiting)}</p>`;
      else main = `<p class="status ok">${esc(D.matched)}</p><button class="btn-primary" type="button" data-match>${esc(D.toMatch)}</button>`;
      return `${main}
        <div class="two-btn">
          <button class="btn-ghost" type="button" data-star aria-pressed="${!!(saved && saved.star)}">${I.star} ${esc(saved && saved.star ? D.starOn : D.star)}</button>
          <button class="btn-ghost" type="button" data-save aria-pressed="${!!saved}">${I.heart} ${esc(saved ? D.saveOn : D.save)}</button>
        </div>`;
    };

    /* הכרעה 14: הכתובת המלאה והטלפון רק אחרי התאמה. האזור הזה מצויר מחדש כשמגיע אישור */
    const revealHTML = () => {
      if (a.mine) return '';
      const matched = store.get().requests.some((r) => r.id === a.id && r.status === 'match');
      return matched ? `<dl class="kv"><dt>${esc(D.address)}</dt><dd>${esc(f.fullAddress(a))}</dd></dl>` : `<p class="note">${esc(D.hidden(a))}</p>`;
    };

    const html = `
      <div class="sheet-photo">${parts.photo(a, 1)}</div>
      <h2 id="sh-apt">${esc(a.title)}</h2>
      <p class="sub">${esc([a.street, a.hood, a.city].filter(Boolean).join(', '))}${a.example ? ' · ' + esc(D.example) : ''}</p>
      <div class="detail-price"><span class="price">${esc(f.nis(a.rent))}</span>${parts.specs(a, S)}</div>
      <ul class="feat-list">${[a.type, a.cond].concat(a.features).filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${a.desc ? `<p>${esc(a.desc)}</p>` : ''}
      ${credits.length ? `<p class="credit">${esc(D.photoBy)} <bdi>${esc(credits.join(', '))}</bdi></p>` : ''}
      <dl class="kv">
        <dt>${esc(D.floor)}</dt><dd>${esc(D.floorVal(a))}</dd>
        ${a.outSqm ? `<dt>${esc(D.outSqm)}</dt><dd>${esc(D.outSqmVal(a.outSqm))}</dd>` : ''}
      </dl>
      <h3 class="sec-title">${esc(D.pay)}</h3>
      <dl class="kv">
        <dt>${esc(D.vaad)}</dt><dd>${esc(a.vaad != null ? f.nis(a.vaad) : D.notSaid)}</dd>
        <dt>${esc(D.arnona)}</dt><dd>${esc(a.arnona != null ? f.nis(a.arnona) : D.notSaid)}</dd>
        <dt>${esc(D.contract)}</dt><dd>${esc(a.contract ? D.months(a.contract) : D.notSaid)}</dd>
        <dt>${esc(D.guarantee)}</dt><dd>${esc(a.guarantee ? f.nis(a.guarantee) : D.notNeeded)}</dd>
        <dt>${esc(D.guarantors)}</dt><dd>${esc(a.guarantors ? D.needed : D.notNeededPl)}</dd>
        <dt>${esc(D.partners)}</dt><dd>${esc(yesNo(a.partners))}</dd>
        <dt>${esc(D.smoking)}</dt><dd>${esc(yesNo(a.smoking))}</dd>
        <dt>${esc(D.entry)}</dt><dd>${esc(!a.entry || a.entry <= today ? D.now : f.date(a.entry, true))}</dd>
        ${a.notes ? `<dt>${esc(D.notes)}</dt><dd>${esc(a.notes)}</dd>` : ''}
        ${a.mine ? '' : `<dt>${esc(D.by)}</dt><dd>${esc(D.byLine(a))}</dd>`}
      </dl>
      <div data-reveal>${revealHTML()}</div>
      <div class="sheet-actions btn-row">${actionsHTML()}</div>`;

    function mount(body) {
      const box = body.querySelector('.sheet-actions');
      const bind = () => {
        const q = (s) => box.querySelector(s);
        if (q('[data-req]')) q('[data-req]').onclick = () => actions.sendRequest(a);
        if (q('[data-match]')) q('[data-match]').onclick = () => router.go('/match/' + a.id, { replace: true });
        q('[data-star]').onclick = () => keep('U');
        q('[data-save]').onclick = () => keep('R');
      };
      /* ציור מחדש של אזור הכתובת ושל אזור הכפתורים בלבד, והפוקוס נשאר על אותו כפתור */
      const redraw = () => {
        body.querySelector('[data-reveal]').innerHTML = revealHTML();
        const act = document.activeElement;
        const key = box.contains(act) && ['data-star', 'data-save', 'data-req', 'data-match'].find((k) => act.hasAttribute(k));
        box.innerHTML = actionsHTML();
        bind();
        if (key) (box.querySelector(`[${key}]`) || box.querySelector('button')).focus();
      };
      /* כוכב או שמירה: אם הדירה היא הכרטיס העליון בערימה, הכרטיס עף. אחרת רק נשמרת */
      function keep(dir) {
        const deck = ctx.deckApi;
        if (router.current.route === '/deck' && deck && deck.topId() === a.id) {
          ctx.closeSheetNow();
          deck.fly(dir);
          return;
        }
        actions.save(a, dir === 'U');
      }
      bind();
      return { requests: redraw, saved: redraw };
    }

    return { html, labelId: 'sh-apt', mount };
  };

  /* ——— התאמה: #/match/:id (מחפש) · #/owner/match/:sid (בעל הדירה) ——— */
  function matchScreen(root, ctx, spec) {
    ctx.setAmbient(spec.apt);
    root.innerHTML = `
      <section class="screen match scroll">
        <div class="match-center">
          <span class="hello">${I.check} ${esc(ctx.S.match.hello)}</span>
          <div class="match-art">${parts.photo(spec.apt, 0)}</div>
          <h1>${esc(spec.title)}</h1>
          <p class="sub">${esc(spec.sub)}</p>
        </div>
        <dl class="reveal">${spec.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <div class="btn-row">
          <button class="btn-primary" type="button" data-go>${esc(spec.go)}</button>
          <button class="btn-ghost" type="button" data-back>${esc(spec.backLabel)}</button>
        </div>
      </section>`;
    root.querySelector('[data-go]').onclick = spec.onGo;
    root.querySelector('[data-back]').onclick = () => ctx.router.back(spec.backTo);
  }

  const redirect = (ctx, path) => { queueMicrotask(() => ctx.router.go(path, { replace: true })); };

  screens['/match/:id'] = function (root, ctx, p) {
    const { S, store, actions, router } = ctx;
    const a = ctx.aptById(p.id);
    const req = a && store.get().requests.find((r) => r.id === a.id);
    if (!req || req.status !== 'match') return redirect(ctx, '/favs');
    actions.markSeen(a.id);
    const M = S.match;
    matchScreen(root, ctx, {
      apt: a, title: M.seekerTitle(a), sub: M.seekerSub(a),
      rows: [[M.toYou, M.toYouText(a)], [M.toThem(a), M.toThemText]],
      go: store.get().profile ? M.openChat : M.fillAndChat,
      onGo: () => router.go(store.get().profile ? '/chat/' + a.id : '/profile/' + a.id),
      backLabel: M.backFavs, backTo: '/favs'
    });
  };

  screens['/owner/match/:sid'] = function (root, ctx, p) {
    const { S, store, router, data } = ctx;
    const s = data.seekers.find((x) => x.id === p.sid);
    if (!s || store.get().owner.decisions[s.id] !== 'ok') return redirect(ctx, '/owner');
    const M = S.match;
    matchScreen(root, ctx, {
      apt: data.ownerApt, title: M.ownerTitle(s), sub: M.ownerSub,
      rows: [[M.fullName, `${s.first} ${s.last}`], [M.income, s.income], [M.extra, s.extra], [M.occupants, String(s.occupants)],
        [M.entry, S.fmt.date(s.entry, true)], [M.about(s), s.about]],
      go: M.openChat, onGo: () => router.go('/owner/chat/' + s.id),
      backLabel: M.backOwner, backTo: '/owner'
    });
  };

  /* ——— פרטי המחפש, רק אחרי התאמה ולפני השיחה הראשונה ——— */
  screens['/profile/:id'] = function (root, ctx, p) {
    const { S, store, actions, router, data } = ctx;
    const a = ctx.aptById(p.id);
    if (!a || !store.get().requests.some((r) => r.id === a.id && r.status === 'match')) return redirect(ctx, '/favs');
    const P = S.profile;
    const pr = store.get().profile || {};
    const field = (name, label, input) => `<div class="field"><label for="pf-${name}">${esc(label)}</label>${input}</div>`;
    root.innerHTML = `
      <section class="screen">
        <header class="page-top">${Dira.ui.backBtn()}<h1>${esc(P.h1)}</h1></header>
        <form class="form scroll grow" novalidate>
          <p class="sub">${esc(P.sub(a))}</p>
          <button class="linkish" type="button" data-fill>${esc(P.fill)}</button>
          <div class="field"><label for="pf-name">${esc(P.name)}</label>
            <input id="pf-name" name="name" autocomplete="name" value="${esc(pr.name || '')}" aria-describedby="pf-name-err">
            <span class="err" id="pf-name-err" hidden>${esc(P.errName)}</span></div>
          ${field('about', P.about, `<textarea id="pf-about" name="about" placeholder="${esc(P.aboutPh)}">${esc(pr.about || '')}</textarea>`)}
          <div class="row2">
            ${field('income', P.income, `<select id="pf-income" name="income">${data.incomes.map((o) => `<option ${pr.income === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`)}
            ${field('occupants', P.occupants, `<input id="pf-occupants" name="occupants" inputmode="numeric" value="${esc(pr.occupants || '')}">`)}
          </div>
          ${field('extra', P.extra, `<input id="pf-extra" name="extra" value="${esc(pr.extra || '')}">`)}
          <button class="btn-primary" type="submit">${esc(P.submit)}</button>
        </form>
      </section>`;
    Dira.ui.bindBack(root, '/match/' + a.id);
    const form = root.querySelector('form');
    const nameEl = form.elements.name, nameErr = root.querySelector('#pf-name-err');
    root.querySelector('[data-fill]').onclick = () => { Object.keys(P.example).forEach((k) => { form.elements[k].value = P.example[k]; }); showErr(false); };
    const showErr = (on) => { nameErr.hidden = !on; nameEl.setAttribute('aria-invalid', String(on)); nameEl.closest('.field').classList.toggle('bad', on); };
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!nameEl.value.trim()) { showErr(true); nameEl.focus(); return; }
      showErr(false);
      const out = {};
      ['name', 'about', 'income', 'occupants', 'extra'].forEach((k) => { out[k] = form.elements[k].value.trim(); });
      actions.saveProfile(out);
      router.go('/chat/' + a.id, { replace: true });
    };
  };

  /* ——— שיחה: #/chat/:id (מחפש) · #/owner/chat/:sid (בעל הדירה) ——— */
  function chatScreen(root, ctx, spec) {
    const { S, store, actions, router, cfg } = ctx;
    ctx.setAmbient(spec.apt);
    const C = S.chat;
    root.innerHTML = `
      <section class="screen">
        <header class="chat-top">${Dira.ui.backBtn()}
          <span class="avatar" aria-hidden="true">${esc(spec.initials)}</span>
          <div><h1>${esc(spec.title)}</h1><span>${esc(spec.subtitle)}</span></div>
        </header>
        <div class="msgs"></div>
        <form class="composer">
          <input type="text" aria-label="${esc(C.inputAria)}" autocomplete="off" enterkeyhint="send">
          <button type="submit" aria-label="${esc(C.send)}">${I.send}</button>
        </form>
      </section>`;
    Dira.ui.bindBack(root, spec.backTo);
    const list = root.querySelector('.msgs'), input = root.querySelector('input');
    const msgs = () => store.get().chats[spec.key] || [];
    const add = (m) => { list.append(Dira.ui.el(`<p class="msg ${m.who}">${esc(m.text)}</p>`)); Dira.ui.scrollEnd(list); };
    const showAfter = () => {
      if (list.querySelector('.after-chat')) return;
      const box = Dira.ui.el(`<div class="after-chat btn-row">${spec.after.map((x, i) => `<button class="${i ? 'btn-primary' : 'btn-ghost'}" type="button" data-i="${esc(i)}">${esc(x.label)}</button>`).join('')}</div>`);
      box.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => router.go(spec.after[Number(b.dataset.i)].go); });
      list.append(box); Dira.ui.scrollEnd(list);
    };

    add({ who: 'sys', text: C.sys });
    msgs().forEach(add);
    if (msgs().some((m) => m.who === 'them')) showAfter();
    if (!msgs().length) input.value = spec.prefill;

    root.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      const me = { who: 'me', text };
      actions.chatPush(spec.key, me, spec.side);
      add(me);
      const mine = msgs().filter((m) => m.who === 'me').length;
      const reply = spec.replies[Math.min(mine - 1, spec.replies.length - 1)];
      const dots = Dira.ui.el(`<p class="typing" aria-label="${esc(C.typing)}"><i></i><i></i><i></i></p>`);
      setTimeout(() => { if (list.isConnected) { list.append(dots); Dira.ui.scrollEnd(list); } }, cfg.typingDelayMs);
      setTimeout(() => {
        dots.remove();
        const them = { who: 'them', text: reply };
        actions.chatPush(spec.key, them, spec.side);
        if (list.isConnected) { add(them); showAfter(); }
      }, cfg.replyDelayMs);
    };
  }

  screens['/chat/:id'] = function (root, ctx, p) {
    const { S, store } = ctx;
    const a = ctx.aptById(p.id);
    if (!a || !store.get().requests.some((r) => r.id === a.id && r.status === 'match')) return redirect(ctx, '/favs');
    const C = S.chat;
    chatScreen(root, ctx, {
      key: 'a-' + a.id, side: 'seeker', backTo: '/favs', apt: a,
      title: C.seekerTitle(a), subtitle: S.fmt.fullAddress(a), initials: a.by.name[0],
      prefill: C.seekerPrefill(a), replies: C.seekerReplies(a),
      after: [{ label: C.toOwner, go: '/owner' }, { label: C.toPublish, go: '/publish' }]
    });
  };

  screens['/owner/chat/:sid'] = function (root, ctx, p) {
    const { S, store, data } = ctx;
    const s = data.seekers.find((x) => x.id === p.sid);
    if (!s || store.get().owner.decisions[s.id] !== 'ok') return redirect(ctx, '/owner');
    const C = S.chat;
    chatScreen(root, ctx, {
      key: 'o-' + s.id, side: 'owner', backTo: '/owner', apt: data.ownerApt,
      title: C.ownerTitle(s), subtitle: C.ownerSub(data.ownerApt), initials: s.first[0] + s.last[0],
      prefill: C.ownerPrefill(s), replies: C.ownerReplies,
      after: [{ label: C.toSeeker, go: '/deck' }]
    });
  };
})(globalThis.Dira = globalThis.Dira || {});
