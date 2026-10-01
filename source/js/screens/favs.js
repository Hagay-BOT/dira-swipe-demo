/* לשונית «אהבתי»: רשימה עם תג מצב, הסרה, כניסה לפרטים או להתאמה */
(function (Dira) {
  'use strict';

  const screens = Dira.screens = Dira.screens || {};
  const { esc, I } = Dira.ui;

  screens['/favs'] = function (root, ctx) {
    const { S, store, actions, router } = ctx;
    const F = S.favs;
    root.innerHTML = `
      <section class="screen">
        <header class="page-top"><h1>${esc(F.h1)}</h1></header>
        <div class="scroll grow" data-body></div>
      </section>`;
    const body = root.querySelector('[data-body]');

    function draw() {
      const st = store.get();
      const reqs = {};
      st.requests.forEach((r) => { reqs[r.id] = r; });
      const byId = {};
      ctx.allApts().forEach((a) => { byId[a.id] = a; });
      const ids = Object.keys(st.saved).filter((id) => byId[id]).sort((x, y) => st.saved[y].t - st.saved[x].t);

      if (!ids.length) {
        body.innerHTML = `
          <div class="empty"><div class="big" aria-hidden="true">${I.heart}</div><h2>${esc(F.emptyTitle)}</h2><p>${esc(F.emptyText)}</p>
            <div class="btn-row"><button class="btn-primary" type="button" data-deck>${esc(F.toDeck)}</button></div></div>`;
        body.querySelector('[data-deck]').onclick = () => router.go('/deck');
        return;
      }
      const rows = ids.map((id) => {
        const a = byId[id], r = reqs[id], s = st.saved[id];
        const pill = r ? (r.status === 'match' ? `<span class="state ok">${esc(F.match)}</span>` : `<span class="state wait">${esc(F.wait)}</span>`)
          : s.star ? `<span class="state star">${esc(F.star)}</span>` : '';
        return `
          <li class="fav">
            <button class="fav-main" type="button" data-open="${esc(id)}" aria-label="${esc(F.open(a))}">
              <span class="thumb">${Dira.parts.photo(a, 0)}</span>
              <span class="main"><b>${esc(a.title)}</b><span class="p">${esc(S.fmt.nis(a.rent))}</span><small>${esc(S.fmt.place(a) || a.city)}</small></span>
            </button>
            <span class="side">${pill}<button class="icon-btn unsave" type="button" data-unsave="${esc(id)}" aria-label="${esc(F.remove(a))}">${I.heart}</button></span>
          </li>`;
      }).join('');
      body.innerHTML = `<ul class="fav-list">${rows}</ul>
        <p class="fine">${esc(F.foot)}<br><button class="linkish" type="button" data-owner>${esc(F.ownerLink)}</button></p>`;

      body.querySelectorAll('[data-open]').forEach((b) => {
        b.onclick = () => {
          const id = b.dataset.open, r = reqs[id];
          if (r && r.status === 'match') return router.go(store.get().chats['a-' + id] ? '/chat/' + id : '/match/' + id);
          router.openSheet('apt:' + id);
        };
      });
      body.querySelectorAll('[data-unsave]').forEach((b) => { b.onclick = () => actions.unsave(b.dataset.unsave); });
      body.querySelector('[data-owner]').onclick = () => router.go('/owner');
    }

    draw();
    return { topics: { saved: draw, requests: draw, deck: draw } };
  };
})(globalThis.Dira = globalThis.Dira || {});
