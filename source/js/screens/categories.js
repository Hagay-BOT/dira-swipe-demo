/* לשונית «קטגוריות»: רשת 2 עמודות עם מספר דירות בכל אחת, ו«מותאם לך» לפי הכוכבים (הכרעה 17) */
(function (Dira) {
  'use strict';

  const screens = Dira.screens = Dira.screens || {};
  const { esc } = Dira.ui;

  screens['/categories'] = function (root, ctx) {
    const { S, store, actions, match: M, cfg, data } = ctx;
    const C = S.cats;
    root.innerHTML = `
      <section class="screen">
        <header class="page-top"><h1>${esc(C.h1)}</h1></header>
        <div class="scroll grow"><ul class="cat-grid" data-grid></ul></div>
      </section>`;
    const grid = root.querySelector('[data-grid]');

    function draw() {
      const all = ctx.allApts();
      const tune = store.get().tune;
      const mctx = ctx.matchCtx();
      grid.innerHTML = data.categories.map((c) => {
        const forYou = !c.test;
        const list = forYou
          ? all.filter((a) => M.passes(a, { foryou: true }, mctx)).sort((x, y) => M.similarity(y, tune, cfg) - M.similarity(x, tune, cfg))
          : all.filter(c.test);
        const small = forYou ? (tune.n ? C.forYouOn(list.length) : C.forYouOff) : C.count(list.length);
        const pic = list[0] || all[0];
        return `<li><button class="cat" type="button" data-cat="${esc(c.id)}">
          ${Dira.parts.photo(pic, 0)}
          <span class="badge2" aria-hidden="true">${esc(c.badge)}</span>
          <span class="label">${esc(c.label)}<small>${esc(small)}</small></span></button></li>`;
      }).join('');
      grid.querySelectorAll('[data-cat]').forEach((b) => {
        b.onclick = () => {
          const c = data.categories.find((x) => x.id === b.dataset.cat);
          actions.logCategory(c.id);
          if (!c.test) {
            if (!store.get().tune.n) return Dira.ui.toast(C.forYouNone);
            const f = { foryou: true };
            return actions.applyFilter(f, C.applied(c.label, actions.countFor(f)));
          }
          const f = { cats: [c.id] };
          actions.applyFilter(f, C.applied(c.label, actions.countFor(f)));
        };
      });
    }

    draw();
    return { topics: { deck: draw } };
  };
})(globalThis.Dira = globalThis.Dira || {});
