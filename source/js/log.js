/*
 * יומן הדמו (הכרעה 23): מה קרה, בלי שמות ובלי פרטים אישיים. נשמר רק בדפדפן.
 * push ו-metrics טהורים. screen מצייר את #/log.
 */
(function (Dira) {
  'use strict';

  /* נקרא רק מתוך setState, כדי שהשמירה תעבור במקום אחד */
  function push(state, event, t) {
    state.log.push(Object.assign({ t }, event));
    const max = Dira.config.logMax;
    if (state.log.length > max) state.log.splice(0, state.log.length - max);
  }

  function metrics(log, cfg) {
    const swipes = log.filter((e) => e.type === 'swipe');
    const count = (type, pred) => log.filter((e) => e.type === type && (!pred || pred(e))).length;
    const avgMs = swipes.length ? swipes.reduce((s, e) => s + (e.ms || 0), 0) / swipes.length : 0;
    return {
      swipes: swipes.length,
      likes: swipes.filter((e) => e.dir === 'R').length,
      stars: swipes.filter((e) => e.dir === 'U').length,
      nopes: swipes.filter((e) => e.dir === 'L').length,
      secPerCard: Math.round(avgMs / 100) / 10,
      requests: count('request'),
      matches: count('match', (e) => e.side === 'seeker'),
      approvals: count('approve'),
      rejections: count('reject'),
      published: count('publish'),
      quickExits: count('exit', (e) => e.ms < cfg.quickExitMs)
    };
  }

  /* מסך #/log. המעטפת והכפתורים נבנים פעם אחת; אירוע חדש מצייר מחדש רק את המדדים והטבלה */
  function screen(root, ctx) {
    const { S, ui, store, cfg } = ctx;
    const L = S.log;
    root.innerHTML = `
      <section class="screen">
        <header class="page-top">${ui.backBtn()}<h1>${ui.esc(L.title)}</h1></header>
        <div class="scroll grow log">
          <div class="stat-row" data-stats></div>
          <p class="note">${ui.esc(L.privacy)}</p>
          <div class="btn-row">
            <a class="btn-primary" target="_blank" rel="noopener" data-wa>${ui.esc(L.whatsapp)}</a>
            <button class="btn-ghost" type="button" data-clear>${ui.esc(L.clear)}</button>
            <button class="btn-ghost" type="button" data-reset>${ui.esc(L.reset)}</button>
          </div>
          <div data-table></div>
        </div>
      </section>`;
    ui.bindBack(root, '/deck');
    root.querySelector('[data-clear]').onclick = () => { store.setState('log', (s) => { s.log = []; }); ui.toast(L.cleared); };
    root.querySelector('[data-reset]').onclick = () => { store.reset(); ui.toast(L.resetDone); };
    const statsEl = root.querySelector('[data-stats]'), tableEl = root.querySelector('[data-table]'), wa = root.querySelector('[data-wa]');

    function draw() {
      const log = store.get().log;
      const m = metrics(log, cfg);
      statsEl.innerHTML = L.stats(m).map(([v, l]) => `<div><b>${ui.esc(v)}</b>${ui.esc(l)}</div>`).join('');
      wa.href = 'https://wa.me/?text=' + encodeURIComponent(L.summary(m));
      const rows = log.slice(-cfg.logRowsShown).reverse().map((e) => `
        <tr><td>${ui.esc(new Date(e.t).toLocaleTimeString('he-IL'))}</td><td>${ui.esc(L.event(e.type))}</td>
        <td>${ui.esc(L.detail(e))}</td><td>${e.ms ? ui.esc(L.sec(Math.round(e.ms / 100) / 10)) : ''}</td></tr>`).join('');
      tableEl.innerHTML = rows
        ? `<table><caption class="sr-only">${ui.esc(L.tableCaption)}</caption><thead><tr>${L.cols.map((c) => `<th scope="col">${ui.esc(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`
        : `<p class="fine">${ui.esc(L.empty)}</p>`;
    }
    draw();
    return { topics: { log: draw } };
  }

  Dira.log = { push, metrics };
  (Dira.screens = Dira.screens || {})['/log'] = screen;
})(globalThis.Dira = globalThis.Dira || {});
