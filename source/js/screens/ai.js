/* לשונית «עוזר AI»: מדומה לפי הכרעה 18. מפרש מילים, מחזיר כרטיסים, ואומר בממשק שהוא לא AI אמיתי */
(function (Dira) {
  'use strict';

  const screens = Dira.screens = Dira.screens || {};
  const { esc, el, I } = Dira.ui;

  screens['/ai'] = function (root, ctx) {
    const { S, store, actions, router, cfg } = ctx;
    const A = S.ai;
    root.innerHTML = `
      <section class="screen">
        <header class="page-top"><h1>${esc(A.h1)}</h1></header>
        <div class="msgs"></div>
        <form class="composer">
          <input type="text" aria-label="${esc(A.inputAria)}" placeholder="${esc(A.placeholder)}" autocomplete="off" enterkeyhint="send">
          <button type="submit" aria-label="${esc(A.send)}">${I.send}</button>
        </form>
      </section>`;
    const list = root.querySelector('.msgs'), input = root.querySelector('input'), form = root.querySelector('form');

    /* ההודעה של העוזר נבנית מתוצאת החיפוש השמורה, כדי שהטקסט יישב רק ב-strings */
    function botText(m) {
      if (!m.understood) return A.notUnderstood;
      if (m.dropped.length) return A.partial(m.total, m.dropped.map(A.droppedWord));
      const labels = [];
      if (m.asked.rooms) labels.push(A.criterion('rooms', m.asked.rooms));
      if (m.asked.max) labels.push(A.criterion('max', m.asked.max));
      m.asked.feats.concat(m.asked.places).forEach((x) => labels.push(x));
      return A.found(m.total, labels);
    }

    function add(m) {
      if (m.who === 'me') { list.append(el(`<p class="msg me">${esc(m.text)}</p>`)); return Dira.ui.scrollEnd(list); }
      list.append(el(`<p class="msg bot">${esc(botText(m))}</p>`));
      if (m.understood && m.ids.length) {
        const box = el(`<div class="ai-results"><p class="head">${I.spark} ${esc(A.results)}</p></div>`);
        m.ids.forEach((id) => {
          const a = ctx.aptById(id);
          if (!a) return;
          const card = el(`
            <article class="ai-card"><div class="pic">${Dira.parts.photo(a, 0)}</div><div class="body">
              <h2>${esc(a.title)}</h2><p class="meta"><span>${esc(S.fmt.place(a) || a.city)}</span><span class="p">${esc(S.fmt.nis(a.rent))}</span></p>
              <div class="two-btn"><button class="btn-ghost" type="button" data-d>${esc(A.details)}</button>
              <button class="btn-primary" type="button" data-s>${I.heart} ${esc(A.save)}</button></div></div></article>`);
          card.querySelector('[data-d]').onclick = () => router.openSheet('apt:' + a.id);
          card.querySelector('[data-s]').onclick = () => actions.save(a, false);
          box.append(card);
        });
        /* הכפתור סופר רק מה שעוד לא הוחלק, כי זה מה שיופיע בערימה */
        const swiped = store.get().swiped;
        const left = ctx.allApts().filter((a) => !swiped[a.id] && Dira.match.passes(a, m.filter, ctx.matchCtx())).length;
        if (left) {
          const all = el(`<button class="btn-primary" type="button">${esc(A.showInDeck(left))}</button>`);
          all.onclick = () => actions.applyFilter(m.filter, A.applied);
          box.append(all);
        }
        list.append(box);
      }
      Dira.ui.scrollEnd(list);
    }

    list.append(el(`<p class="msg bot">${esc(A.hello)}</p>`));
    list.append(el(`<p class="msg sys">${esc(A.notReal)}</p>`));
    const past = store.get().aiChat;
    if (!past.length) {
      const sug = el(`<div class="chips suggest">${A.suggestions.map((s) => `<button class="chip" type="button">${esc(s)}</button>`).join('')}</div>`);
      sug.querySelectorAll('.chip').forEach((b) => { b.onclick = () => { input.value = b.textContent; sug.remove(); form.requestSubmit(); }; });
      list.append(sug);
    }
    past.forEach(add);

    form.onsubmit = (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      const sug = list.querySelector('.suggest');
      if (sug) sug.remove();
      const me = { who: 'me', text };
      actions.aiPush(me);
      add(me);
      const dots = el(`<p class="typing" aria-label="${esc(A.typing)}"><i></i><i></i><i></i></p>`);
      list.append(dots); Dira.ui.scrollEnd(list);
      setTimeout(() => {
        dots.remove();
        const bot = Object.assign({ who: 'bot' }, Dira.assist.search(text, ctx.allApts(), ctx.matchCtx()));
        actions.aiPush(bot);
        if (list.isConnected) add(bot);
      }, cfg.aiReplyMs);
    };
  };
})(globalThis.Dira = globalThis.Dira || {});
