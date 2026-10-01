/*
 * פרסום דירה בחמישה שלבים (הכרעה 19): כתובת, פרטי הדירה, תשלומים ודרישות, מדיה, איש קשר.
 * בדיקת חובה בכל שלב, כתיבה אוטומטית מדומה, תמונות מהמכשיר. בסוף הדירה היא הכרטיס הבא בערימה.
 */
(function (Dira) {
  'use strict';

  const screens = Dira.screens = Dira.screens || {};
  const { esc, I } = Dira.ui;
  const L = Dira.listing;

  screens['/publish'] = function (root, ctx) {
    const { S, actions, cfg, data } = ctx;
    const P = S.publish;
    const d = L.emptyDraft();
    const photos = [];
    let videoName = '';
    let cur = 0;
    let errs = {};

    root.innerHTML = `
      <section class="screen">
        <header class="page-top">${Dira.ui.backBtn()}<h1>${esc(P.h1)}</h1></header>
        <ol class="stepper scroll grow" data-steps></ol>
      </section>`;
    Dira.ui.bindBack(root, '/deck');
    const stepsEl = root.querySelector('[data-steps]');

    /* ——— שדות ——— */
    const errAttrs = (name) => (errs[name] ? `aria-invalid="true" aria-describedby="p-${name}-err"` : '');
    const errMsg = (name) => (errs[name] ? `<span class="err" id="p-${name}-err">${esc(P.err[errs[name]])}</span>` : '');
    const wrap = (name, label, control) => `<div class="field${errs[name] ? ' bad' : ''}"><label for="p-${name}">${esc(label)}</label>${control}${errMsg(name)}</div>`;
    const input = (name, label, attrs) => wrap(name, label, `<input id="p-${name}" name="${name}" value="${esc(d[name])}" ${attrs || ''} ${errAttrs(name)}>`);
    const select = (name, label, options, first) => wrap(name, label, `<select id="p-${name}" name="${name}" ${errAttrs(name)}>
      ${first ? `<option value="">${esc(first)}</option>` : ''}${options.map((o) => `<option value="${esc(o)}" ${String(d[name]) === String(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`);
    const yn = (name, label) => `<div class="yn-row"><span id="p-${name}-l">${esc(label)}</span><div class="yn" role="group" aria-labelledby="p-${name}-l">
      <button type="button" data-yn="${name}" data-v="yes" aria-pressed="${d[name] === 'yes'}">${esc(P.yes)}</button>
      <button type="button" data-yn="${name}" data-v="no" aria-pressed="${d[name] === 'no'}">${esc(P.no)}</button></div></div>`;
    const withAi = (name, label, tag) => `<div class="field with-ai"><label for="p-${name}">${esc(label)}</label>
      ${tag === 'textarea' ? `<textarea id="p-${name}" name="${name}">${esc(d[name])}</textarea>` : `<input id="p-${name}" name="${name}" value="${esc(d[name])}">`}
      <button class="ai-btn" type="button" data-ai="${name}" aria-label="${esc(P.autowrite(label))}">${I.spark}</button></div>`;

    function body(step) {
      if (step === 'addr') return `
        <p class="sub-h">${esc(P.cityStreet)}</p>
        ${select('city', P.city, data.cities, P.cityPick)}
        ${input('street', P.street, 'list="p-streets" autocomplete="off"')}<datalist id="p-streets">${data.streets.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
        ${input('houseNo', P.houseNo, 'inputmode="numeric"')}
        <div class="row3">${input('entrance', P.entrance)}${input('floor', P.floor, 'inputmode="numeric"')}${input('floors', P.floors, 'inputmode="numeric"')}</div>`;
      if (step === 'details') return `
        ${withAi('title', P.title)}
        <div class="row2">${input('rent', P.rent, 'inputmode="numeric"')}${input('sqm', P.sqm, 'inputmode="numeric"')}</div>
        ${input('outSqm', P.outSqm, 'inputmode="numeric"')}
        <div class="row2">${select('beds', P.beds, [1, 2, 3, 4, 5])}${select('baths', P.baths, [1, 2, 3])}</div>
        <div class="row2">${select('type', P.type, data.types.map((t) => t.label))}${select('cond', P.cond, data.conds)}</div>
        <fieldset class="field"><legend class="label">${esc(P.features)}</legend><div class="opts">${data.featureList.map((x) => `<button class="chip" type="button" data-feat="${esc(x)}" aria-pressed="${d.features.includes(x)}">${esc(x)}</button>`).join('')}</div></fieldset>
        ${d.features.includes('מיזוג') ? select('acType', P.acType, data.acTypes, P.acPick) : ''}
        <fieldset class="field"><legend class="label">${esc(P.parking)}</legend><div class="opts">${[['0', P.parkingNone], ['1', '1'], ['2', '2'], ['3', '3']].map(([v, l]) => `<button class="opt" type="button" data-park="${v}" aria-pressed="${d.parking === v}">${esc(l)}</button>`).join('')}</div></fieldset>
        ${withAi('desc', P.desc, 'textarea')}
        <p class="note">${esc(P.autowriteNote)}</p>`;
      if (step === 'pay') return `
        <p class="sub-h">${esc(P.payments)}</p>
        <div class="row2">${input('vaad', P.vaad, 'inputmode="numeric"')}${input('arnona', P.arnona, 'inputmode="numeric"')}</div>
        <p class="sub-h">${esc(P.contractReq)}</p>
        ${select('contract', P.contract, [1, 6, 9, 12, 18, 24])}
        ${yn('guarantee', P.guarantee)}
        ${d.guarantee === 'yes' ? input('guaranteeAmt', P.guaranteeAmt, 'inputmode="numeric"') : ''}
        ${yn('guarantors', P.guarantors)}${yn('partners', P.partners)}${yn('smoking', P.smoking)}
        ${input('notes', P.notes)}`;
      if (step === 'media') return `
        <div class="media-add"><span class="label">${esc(P.photos)}</span>
          <label class="btn-primary btn-small">${esc(P.addPhotos)}<input type="file" accept="image/*" multiple class="sr-only" data-photos></label></div>
        <div class="thumbs">${photos.map((p) => `<img src="${esc(p)}" alt="">`).join('')}<span class="count">${esc(P.photosCount(photos.length, cfg.photosMax))}</span></div>
        <div class="media-add"><span class="label">${esc(P.video)}</span>
          <label class="btn-ghost btn-small">${esc(P.addVideo)}<input type="file" accept="video/*" class="sr-only" data-video></label></div>
        ${videoName ? `<p class="note">${esc(P.videoAdded(videoName))}</p>` : ''}
        <p class="note">${esc(P.mediaNote)}</p>`;
      return `
        ${input('name', P.name, 'autocomplete="name"')}
        ${input('phone', P.phone, 'inputmode="tel" autocomplete="tel"')}
        <p class="note">${esc(P.phoneNote)}</p>`;
    }

    /*
     * ——— ציור ———
     * draw: כל רשימת השלבים, רק כשעוברים שלב. drawFields: רק השדות של השלב הפתוח, אחרי כל לחיצה בתוכו.
     * focusSel מחזיר את הפוקוס למקום שבו היה
     */
    const focusOn = (sel) => { const f = sel && stepsEl.querySelector(sel); if (f) f.focus(); };

    function draw(focusSel) {
      const n = L.STEPS.length;
      stepsEl.innerHTML = L.STEPS.map((id, i) => `
        <li class="step${i === cur ? ' on' : ''}${i < cur ? ' done' : ''}" ${i === cur ? 'aria-current="step"' : ''}>
          <span class="step-num" aria-hidden="true">${i < cur ? I.check : esc(i + 1)}</span>
          <h2><button class="step-head" type="button" data-step="${esc(i)}" ${i < cur ? '' : 'aria-disabled="true"'}>
            <span class="sr-only">${esc(P.stepOf(i + 1, n))}: </span>${esc(P.steps[id])}</button></h2>
          ${i === cur ? `<form class="step-body" novalidate><div class="step-fields" data-fields>${body(id)}</div>
            <div class="step-actions">
              <button class="btn-primary" type="submit">${esc(i === n - 1 ? P.submit : P.next)}</button>
              ${i ? `<button class="btn-ghost" type="button" data-prev>${esc(P.prev)}</button>` : ''}
            </div></form>` : ''}
        </li>`).join('');
      bindStep();
      bindFields();
      focusOn(focusSel);
    }

    function drawFields(focusSel) {
      stepsEl.querySelector('[data-fields]').innerHTML = body(L.STEPS[cur]);
      bindFields();
      focusOn(focusSel);
    }

    function go(i, focusFirst) {
      cur = i; errs = {};
      draw(focusFirst ? '.step.on .step-head' : null);
    }

    /* מה שנקשר פעם אחת לכל שלב: כותרות, «הקודם», הקלדה ושליחה */
    function bindStep() {
      stepsEl.querySelectorAll('[data-step]').forEach((b) => { b.onclick = () => { const i = Number(b.dataset.step); if (i < cur) go(i, true); }; });
      const form = stepsEl.querySelector('.step-body');
      const prev = form.querySelector('[data-prev]');
      if (prev) prev.onclick = () => go(cur - 1, true);
      const keep = (e) => { if (e.target.name) d[e.target.name] = e.target.value; };
      form.addEventListener('input', keep);
      form.addEventListener('change', keep);
      form.onsubmit = (ev) => {
        ev.preventDefault();
        errs = L.validate(L.STEPS[cur], d, data);
        const bad = Object.keys(errs);
        if (bad.length) {
          drawFields('#p-' + bad[0]);
          Dira.ui.toast(P.errToast(bad.length));
          return;
        }
        if (cur < L.STEPS.length - 1) return go(cur + 1, true);
        const apt = L.toApartment(Object.assign({}, d, { name: d.name.trim() || P.ownerDefault }),
          { id: 'm' + Date.now(), today: new Date().toISOString().slice(0, 10), cfg, types: data.types });
        actions.publish(apt, photos, !!videoName);
      };
    }

    /* מה שנקשר מחדש אחרי כל ציור של השדות */
    function bindFields() {
      const box = stepsEl.querySelector('[data-fields]');
      box.querySelectorAll('[data-yn]').forEach((b) => {
        b.onclick = () => { d[b.dataset.yn] = b.dataset.v; drawFields(`[data-yn="${b.dataset.yn}"][data-v="${b.dataset.v}"]`); };
      });
      box.querySelectorAll('[data-feat]').forEach((b) => {
        b.onclick = () => {
          const x = b.dataset.feat;
          d.features = d.features.includes(x) ? d.features.filter((y) => y !== x) : d.features.concat(x);
          if (!d.features.includes('מיזוג')) d.acType = '';
          drawFields(`[data-feat="${CSS.escape(x)}"]`);
        };
      });
      box.querySelectorAll('[data-park]').forEach((b) => { b.onclick = () => { d.parking = b.dataset.park; drawFields(`[data-park="${b.dataset.park}"]`); }; });
      box.querySelectorAll('[data-ai]').forEach((b) => {
        b.onclick = () => {
          const name = b.dataset.ai;
          b.classList.add('busy');
          Dira.ui.toast(P.writing);
          setTimeout(() => {
            if (!stepsEl.isConnected) return;   // יצאו מהמסך בינתיים
            d[name] = name === 'title' ? L.autoTitle(d, data.types) : L.autoDesc(d, data.types);
            if (L.STEPS[cur] === 'details') drawFields('#p-' + name);
            Dira.ui.toast(P.written, 'ok');
          }, cfg.autowriteMs);
        };
      });
      const ph = box.querySelector('[data-photos]');
      if (ph) ph.onchange = () => {
        const files = Array.from(ph.files).filter((f) => /^image\//.test(f.type)).slice(0, cfg.photosMax - photos.length);
        let left = files.length;
        files.forEach((file) => {
          const rd = new FileReader();
          rd.onload = () => {
            if (/^data:image\//.test(rd.result)) photos.push(rd.result);
            if (--left === 0) drawFields('[data-photos]');
          };
          rd.readAsDataURL(file);
        });
      };
      const vd = box.querySelector('[data-video]');
      if (vd) vd.onchange = () => { if (vd.files[0]) { videoName = vd.files[0].name; drawFields('[data-video]'); } };
    }

    draw();
  };
})(globalThis.Dira = globalThis.Dira || {});
