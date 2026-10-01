/*
 * צד בעל הדירה (#/owner): הדירה שלו, פניות לפי סדר הגעה עם תג לפי הכרעה 11,
 * כרטיס מחפש אנונימי (הכרעה 10), אישור או דחייה בלי סיבה (הכרעה 15), ומסך מנוי (הכרעה 26).
 */
(function (Dira) {
  'use strict';

  const screens = Dira.screens = Dira.screens || {};
  const sheets = Dira.sheets = Dira.sheets || {};
  const { esc, I } = Dira.ui;

  screens['/owner'] = function (root, ctx) {
    const { S, store, actions, router, cfg, data, match: M } = ctx;
    const O = S.owner, apt = data.ownerApt;
    ctx.setAmbient(apt);
    root.innerHTML = `
      <section class="screen">
        <header class="app-top owner-top">
          <p class="brand">${esc(S.app.brand)} <span class="pill-demo">${esc(O.side)}</span></p>
          <button class="chip" type="button" data-plan>${esc(O.plan)}</button>
        </header>
        <div class="scroll grow">
          <h1 class="sr-only">${esc(O.h1)}</h1>
          <div class="owner-apt">
            <span class="li-thumb">${Dira.parts.photo(apt, 0)}</span>
            <p><b>${esc(S.fmt.place(apt))}</b><span>${esc(O.aptLine(apt))}</span></p>
          </div>
          <div class="sect-h"><h2>${esc(O.list)}</h2><span data-waiting></span></div>
          <p class="rule">${esc(O.rule(apt))}</p>
          <ul class="list" data-list></ul>
          <div class="btn-row owner-foot">
            <button class="btn-ghost" type="button" data-seeker>${esc(O.toSeeker)}</button>
            <p class="fine">${esc(O.allExample)}</p>
          </div>
        </div>
      </section>`;
    const listEl = root.querySelector('[data-list]');
    /* הכרעה 12: לפי סדר הגעה */
    const byArrival = data.seekers.slice().sort((x, y) => x.arrived.localeCompare(y.arrived));
    root.querySelector('[data-plan]').onclick = () => router.openSheet('plan');
    root.querySelector('[data-seeker]').onclick = () => router.go('/deck');

    function draw() {
      const dec = store.get().owner.decisions;
      listEl.innerHTML = byArrival.map((s) => {
        const f = M.fit(s, apt, cfg);
        const d = dec[s.id];
        const tag = d === 'ok' ? O.approved : d === 'no' ? O.rejected : f.ok ? O.fit : O.unfit;
        const cls = d === 'ok' || (!d && f.ok) ? 'fit' : 'unfit';
        return `<li><button class="req${d ? ' decided' : ''}" type="button" data-sid="${esc(s.id)}" aria-label="${esc(O.rowAria(s, tag))}">
          <span class="req-name">${esc(s.first)}<small>${esc(O.arrived(s))}</small></span>
          <span class="fit-tag ${cls}">${esc(tag)}</span>
          <span class="req-meta">
            <span class="${f.pay ? 'yes' : 'no'}">${esc(O.payTo(s))}</span>
            <span class="${f.date ? 'yes' : 'no'}">${esc(O.entryOn(s))}</span>
            <span>${esc(O.occupants(s.occupants))}</span>
          </span></button></li>`;
      }).join('');
      listEl.querySelectorAll('[data-sid]').forEach((b) => { b.onclick = () => router.openSheet('seeker:' + b.dataset.sid); });
      const waiting = data.seekers.filter((s) => !dec[s.id]).length;
      root.querySelector('[data-waiting]').textContent = O.waiting(waiting);
    }

    draw();
    if (!store.get().flags.ownerBanner) {
      setTimeout(() => {
        if (router.current.route !== '/owner') return;   // יצאו מהמסך לפני שההתראה הספיקה לעלות
        actions.seenOwnerBanner();
        Dira.ui.banner(O.banner(data.seekers.length), O.bannerText, null, '/owner');
      }, cfg.ownerBannerDelayMs);
    }
    return { topics: { owner: draw } };
  };

  /* כרטיס מחפש לפני אישור: שם פרטי, טווח תשלום, נפשות, תאריך כניסה. בלי שם משפחה, תמונה ומקום עבודה */
  sheets.seeker = function (ctx, sid) {
    const { S, store, actions, router, cfg, data, match: M } = ctx;
    const s = data.seekers.find((x) => x.id === sid);
    if (!s) return null;
    const O = S.owner, apt = data.ownerApt;
    const f = M.fit(s, apt, cfg);
    const d = store.get().owner.decisions[sid];
    const html = `
      <h2 id="sh-seeker">${esc(s.first)}</h2>
      <p class="sub">${esc(O.sheetSub(s))}</p>
      <dl class="anon">
        <div><dt>${esc(O.range)}</dt><dd>${esc(O.rangeVal(s))}</dd></div>
        <div><dt>${esc(O.occLabel)}</dt><dd>${esc(String(s.occupants))}</dd></div>
        <div><dt>${esc(O.entryLabel)}</dt><dd>${esc(S.fmt.date(s.entry))}</dd></div>
      </dl>
      <dl class="kv">
        <dt>${esc(O.payLabel)}</dt><dd class="${f.pay ? 'yes' : 'no'}">${esc(O.payLine(f.pay, apt))}</dd>
        <dt>${esc(O.dateLabel)}</dt><dd class="${f.date ? 'yes' : 'no'}">${esc(O.dateLine(f.date, apt))}</dd>
      </dl>
      <p class="hidden-list">${esc(O.hiddenList(s))}</p>
      ${d ? `<p class="note">${esc(O.already(d))}</p>${d === 'ok' ? `<button class="btn-primary" type="button" data-open>${esc(O.toMatch)}</button>` : ''}`
        : `<div class="two-btn"><button class="btn-primary" type="button" data-ok>${I.check} ${esc(O.approve)}</button>
             <button class="btn-ghost" type="button" data-no>${esc(O.reject)}</button></div>`}`;

    function mount(body) {
      const q = (x) => body.querySelector(x);
      if (q('[data-ok]')) q('[data-ok]').onclick = () => { actions.decide(sid, true); router.go('/owner/match/' + sid, { replace: true }); };
      if (q('[data-no]')) q('[data-no]').onclick = () => { actions.decide(sid, false); ctx.closeSheetNow(); Dira.ui.toast(O.rejectedToast); };
      if (q('[data-open]')) q('[data-open]').onclick = () => router.go('/owner/match/' + sid, { replace: true });
    }
    return { html, labelId: 'sh-seeker', mount };
  };

  /* הכרעה 26: בפיילוט, ללא תשלום, בלי מחיר מומצא */
  sheets.plan = function (ctx) {
    const O = ctx.S.owner;
    const html = `
      <h2 id="sh-plan">${esc(O.planTitle)}</h2>
      <p class="sub">${esc(O.planSub)}</p>
      <dl class="kv">${O.planRows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      <button class="btn-primary" type="button" data-close>${esc(O.planOk)}</button>`;
    return { html, labelId: 'sh-plan', mount: (body) => { body.querySelector('[data-close]').onclick = () => ctx.closeSheetNow(); } };
  };
})(globalThis.Dira = globalThis.Dira || {});
