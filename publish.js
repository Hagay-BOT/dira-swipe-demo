/* פרסום דירה בחמישה שלבים, כמו באב-טיפוס של ניר */
(function () {
  const A = window.App;
  const { D, esc, nis, el } = A;
  const I = A.ICON;

  const STEPS = [
    { id: 'addr', title: 'כתובת מדויקת' },
    { id: 'details', title: 'פרטי הדירה' },
    { id: 'pay', title: 'תשלומים ודרישות' },
    { id: 'media', title: 'מדיה: תמונות/וידאו' },
    { id: 'contact', title: 'איש קשר' }
  ];
  let d, cur, photos, videoName;

  const fresh = () => ({ city: '', street: '', houseNo: '', entrance: '', floor: '', floors: '', title: '', rent: '', sqm: '', outSqm: '', beds: '2', baths: '1',
    type: 'דירה', cond: 'שמורה מאוד', features: [], acType: '', parking: '0', desc: '', vaad: '', arnona: '', contract: '12', guarantee: 'no', guaranteeAmt: '',
    guarantors: 'no', partners: 'no', smoking: 'no', notes: '', name: '', phone: '', showPhone: 'no' });

  /* ——— כתיבה אוטומטית · מדומה ——— */
  function aiTitle() {
    const rooms = Number(d.beds || 1) + 1;
    const cond = { 'חדשה מהקבלן': 'חדשה', 'משופצת': 'משופצת', 'שמורה מאוד': 'שמורה' }[d.cond] || '';
    const ex = [];
    if (d.features.includes('מרפסת')) ex.push('מרפסת');
    if (Number(d.parking) > 0 || d.features.includes('חניה')) ex.push('חניה');
    if (d.features.includes('ממ"ד')) ex.push('ממ"ד');
    const withTxt = ex.length ? ' עם ' + (ex.length > 1 ? ex.slice(0, -1).join(', ') + ' ו' + ex[ex.length - 1] : ex[0]) : '';
    const kind = d.type === 'דירה' ? `דירת ${rooms} חדרים` : `${d.type} ${rooms} חדרים`;
    return `${kind}${cond ? ' ' + cond : ''}${withTxt}${d.street ? ' ב' + d.street : ''}`;
  }
  function aiDesc() {
    const rooms = Number(d.beds || 1) + 1;
    const feats = d.features.filter((x) => x !== 'מיזוג');
    return [
      `ברוכים הבאים ל${d.type === 'דירה' ? 'דירה' : d.type} ${d.cond === 'משופצת' ? 'המשופצת' : d.cond === 'חדשה מהקבלן' ? 'החדשה' : 'המקסימה'} ב${d.street ? d.street + ', ' : ''}${d.city || 'חיפה'}.`,
      `${rooms} חדרים${d.sqm ? `, ${d.sqm} מ״ר` : ''}${d.floor ? `, קומה ${d.floor}${d.floors ? ' מתוך ' + d.floors : ''}` : ''}.`,
      feats.length || d.acType ? `בדירה: ${feats.concat(d.acType ? [d.acType] : []).join(', ')}.` : '',
      Number(d.parking) > 0 ? `${d.parking === '1' ? 'חניה צמודה' : d.parking + ' חניות צמודות'}.` : '',
      'צרו קשר לתיאום ביקור.'
    ].filter(Boolean).join(' ');
  }

  /* ——— רכיבים ——— */
  const field = (name, label, attrs, err) => `<div class="field ${err ? 'bad' : ''}"><label for="p-${name}">${label}</label><input id="p-${name}" name="${name}" value="${esc(d[name])}" ${attrs || ''}>${err ? `<span class="err">${err}</span>` : ''}</div>`;
  const select = (name, label, list, err) => `<div class="field ${err ? 'bad' : ''}"><label for="p-${name}">${label}</label><select id="p-${name}" name="${name}">${list.map((o) => `<option ${String(d[name]) === String(o) ? 'selected' : ''} value="${esc(o)}">${esc(o)}</option>`).join('')}</select>${err ? `<span class="err">${err}</span>` : ''}</div>`;
  const yn = (name, label) => `<div class="yn-row"><span>${label}</span><div class="yn"><button type="button" data-yn="${name}" data-v="no" aria-pressed="${d[name] === 'no'}">לא</button><button type="button" data-yn="${name}" data-v="yes" aria-pressed="${d[name] === 'yes'}">כן</button></div></div>`;
  const ai = (name, label, tag) => `<div class="field with-ai"><label for="p-${name}">${label}</label>${tag === 'textarea' ? `<textarea id="p-${name}" name="${name}">${esc(d[name])}</textarea>` : `<input id="p-${name}" name="${name}" value="${esc(d[name])}">`}<button class="ai-btn" type="button" data-ai="${name}" aria-label="כתיבה אוטומטית">${I.spark}</button></div>`;

  function body(id, errs) {
    const e = errs || {};
    if (id === 'addr') return `
      <div class="sub-h">בחירת עיר ורחוב</div>
      <div class="field ${e.city ? 'bad' : ''}"><label for="p-city">עיר</label><select id="p-city" name="city"><option value="">בחירה מהרשימה</option>${D.cities.map((c) => `<option ${d.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select>${e.city ? `<span class="err">${e.city}</span>` : ''}</div>
      ${field('street', 'רחוב', 'list="p-streets" autocomplete="off"', e.street)}<datalist id="p-streets">${D.streets.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
      ${field('houseNo', 'מספר בית', 'inputmode="numeric"', e.houseNo)}
      <div class="row3">${field('entrance', 'כניסה')}${field('floor', 'קומה', 'inputmode="numeric"')}${field('floors', 'סה״כ קומות', 'inputmode="numeric"')}</div>`;
    if (id === 'details') return `
      ${ai('title', 'כותרת הנכס')}
      <div class="row2">${field('rent', 'מחיר חודשי (₪)', 'inputmode="numeric"', e.rent)}${field('sqm', 'מ״ר בנוי', 'inputmode="numeric"', e.sqm)}</div>
      ${field('outSqm', 'מ״ר גינה/מרפסת (לא חובה)', 'inputmode="numeric"')}
      <div class="row2">${select('beds', 'חדרי שינה', [1, 2, 3, 4, 5])}${select('baths', 'חדרי רחצה', [1, 2, 3])}</div>
      <div class="row2">${select('type', 'סוג הנכס', D.types)}${select('cond', 'מצב הדירה', D.conds)}</div>
      <div class="field"><span class="label">מאפייני הדירה</span><div class="opts">${D.featureList.map((x) => `<button class="chip" type="button" data-feat="${esc(x)}" aria-pressed="${d.features.includes(x)}">${esc(x)}</button>`).join('')}</div></div>
      ${d.features.includes('מיזוג') ? select('acType', 'סוג מיזוג (חובה כשמסומן מיזוג)', [''].concat(D.acTypes), e.acType) : ''}
      <div class="field"><span class="label">חניה</span><div class="opts">${[['0', 'ללא'], ['1', '1'], ['2', '2'], ['3', '3']].map(([v, l]) => `<button class="opt" type="button" data-park="${v}" aria-pressed="${d.parking === v}">${l}</button>`).join('')}</div></div>
      ${ai('desc', 'תיאור', 'textarea')}
      <p class="note">בדמו הכתיבה האוטומטית מדומה: היא מרכיבה טקסט מהשדות שמילאת.</p>`;
    if (id === 'pay') return `
      <div class="sub-h">תשלומים</div>
      <div class="row2">${field('vaad', 'ועד בית (₪)', 'inputmode="numeric"')}${field('arnona', 'ארנונה דו-חודשית (₪)', 'inputmode="numeric"')}</div>
      <div class="sub-h">דרישות חוזה</div>
      ${select('contract', 'אורך חוזה מינימלי (חודשים)', [1, 6, 9, 12, 18, 24])}
      ${yn('guarantee', 'ערבות בנקאית נדרשת')}
      ${d.guarantee === 'yes' ? field('guaranteeAmt', 'סכום הערבות (₪) · חובה', 'inputmode="numeric"', e.guaranteeAmt) : ''}
      ${yn('guarantors', 'דורש ערבים')}${yn('partners', 'שותפים מותר')}${yn('smoking', 'עישון מותר')}
      ${field('notes', 'הערות או דרישות נוספות (לא חובה)')}`;
    if (id === 'media') return `
      <div class="media-add"><span class="label" style="font-weight:700">תמונות הדירה (עד 10)</span>
        <label class="btn-primary">הוספת תמונות<input type="file" accept="image/*" multiple hidden data-photos></label></div>
      <div class="thumbs">${photos.map((p) => `<img src="${p}" alt="">`).join('')}<span class="count">${photos.length}/10</span></div>
      <div class="media-add"><span class="label" style="font-weight:700">סרטון (לא חובה)</span>
        <label class="btn-ghost" style="width:auto">הוספה<input type="file" accept="video/*" hidden data-video></label></div>
      ${videoName ? `<p class="note">${I.check ? '' : ''}נוסף סרטון: ${esc(videoName)}</p>` : ''}
      <p class="note">בלי תמונות, הכרטיס יוצג עם איור. בדמו הקבצים נשארים רק במכשיר הזה.</p>`;
    return `
      ${field('name', 'שם', 'autocomplete="name"')}
      ${field('phone', 'טלפון', 'inputmode="tel" autocomplete="tel"', e.phone)}
      ${yn('showPhone', 'הצגת מספר הטלפון במודעה')}
      <p class="note">${d.showPhone === 'yes' ? 'כן: המספר יוצג לכל מי שרואה את המודעה.' : 'לא: המספר יוצג רק אחרי התאמה, בשיחה. זו הבחירה המומלצת.'}</p>`;
  }

  function validate(id) {
    const e = {};
    if (id === 'addr') {
      if (!D.cities.includes(d.city)) e.city = 'חובה לבחור עיר מהרשימה';
      if (!d.street.trim()) e.street = 'חובה למלא רחוב';
      if (!String(d.houseNo).trim()) e.houseNo = 'חובה למלא מספר בית';
    }
    if (id === 'details') {
      if (!Number(String(d.rent).replace(/[^\d]/g, ''))) e.rent = 'חובה למלא מחיר';
      if (!Number(d.sqm)) e.sqm = 'חובה למלא מ״ר';
      if (d.features.includes('מיזוג') && !d.acType) e.acType = 'חובה לבחור סוג מיזוג';
    }
    if (id === 'pay' && d.guarantee === 'yes' && !Number(d.guaranteeAmt)) e.guaranteeAmt = 'חובה למלא סכום';
    if (id === 'contact' && !String(d.phone).trim()) e.phone = 'חובה למלא טלפון';
    return e;
  }

  /* ——— המסך ——— */
  A.routes.publish = function () {
    d = fresh(); cur = 0; photos = []; videoName = '';
    render();
  };

  function render(errs) {
    const scr = A.mount(el(`
      <section class="screen">
        <div class="page-top"><button class="icon-btn" type="button" data-back aria-label="חזרה">${I.back}</button>פרסום דירה</div>
        <div class="scroll grow"><div class="stepper">
          ${STEPS.map((s, i) => `
            <div class="step ${i === cur ? 'on' : ''} ${i < cur ? 'done' : ''}">
              <span class="step-num">${i < cur ? I.check : i + 1}</span>
              <button class="step-head" type="button" data-step="${i}">${s.title}</button>
              ${i === cur ? `<form class="step-body" novalidate>${body(s.id, errs)}
                <div class="step-actions"><button class="btn-primary" type="submit">${i === STEPS.length - 1 ? 'פרסום הדירה' : 'המשך'}</button>
                ${i ? '<button class="btn-ghost" type="button" data-prev>' + I.back + ' הקודם</button>' : ''}</div></form>` : ''}
            </div>`).join('')}
        </div></div>
      </section>`));
    const form = scr.querySelector('.step-body');
    scr.querySelector('[data-back]').onclick = () => A.go('deck');
    scr.querySelectorAll('[data-step]').forEach((b) => { b.onclick = () => { const i = Number(b.dataset.step); if (i < cur) { cur = i; render(); } }; });
    const prev = scr.querySelector('[data-prev]');
    if (prev) prev.onclick = () => { cur--; render(); };

    form.addEventListener('input', (e) => { if (e.target.name) d[e.target.name] = e.target.value; });
    form.addEventListener('change', (e) => {
      if (e.target.name) d[e.target.name] = e.target.value;
      if (e.target.name === 'city' || e.target.name === 'acType') return;
    });
    form.querySelectorAll('[data-yn]').forEach((b) => { b.onclick = () => { d[b.dataset.yn] = b.dataset.v; render(); }; });
    form.querySelectorAll('[data-feat]').forEach((b) => {
      b.onclick = () => { const x = b.dataset.feat; d.features = d.features.includes(x) ? d.features.filter((y) => y !== x) : d.features.concat(x); render(); };
    });
    form.querySelectorAll('[data-park]').forEach((b) => { b.onclick = () => { d.parking = b.dataset.park; render(); }; });
    form.querySelectorAll('[data-ai]').forEach((b) => {
      b.onclick = () => {
        b.classList.add('busy');
        A.toast('כותב עם AI...', 900);
        setTimeout(() => {
          d[b.dataset.ai] = b.dataset.ai === 'title' ? aiTitle() : aiDesc();
          render();
          A.toast('נכתב אוטומטית · אפשר לערוך', 2200, 'ok');
        }, 800);
      };
    });
    const ph = form.querySelector('[data-photos]');
    if (ph) ph.onchange = () => {
      const files = Array.from(ph.files).slice(0, 10 - photos.length);
      let left = files.length;
      files.forEach((fl) => {
        const rd = new FileReader();
        rd.onload = () => { photos.push(rd.result); if (--left === 0) render(); };
        rd.readAsDataURL(fl);
      });
    };
    const vd = form.querySelector('[data-video]');
    if (vd) vd.onchange = () => { if (vd.files[0]) { videoName = vd.files[0].name; render(); A.toast('נוסף סרטון: ' + videoName); } };

    form.onsubmit = (ev) => {
      ev.preventDefault();
      const e = validate(STEPS[cur].id);
      if (Object.keys(e).length) { render(e); A.toast('יש שדות חובה שלא מולאו'); return; }
      if (cur < STEPS.length - 1) { cur++; render(); return; }
      publish();
    };
  }

  function publish() {
    const rent = Number(String(d.rent).replace(/[^\d]/g, ''));
    const feats = d.features.map((x) => (x === 'מיזוג' ? 'מזגנים' : x));
    if (Number(d.parking) > 0 && !feats.includes('חניה')) feats.push('חניה');
    const entry = new Date(Date.UTC(2026, 9, 10)).toISOString().slice(0, 10);
    const a = {
      id: 'm' + Date.now(), mine: true, example: false,
      area: d.city === 'חיפה' ? 'haifa' : 'krayot', city: d.city, hood: '', street: d.street.trim(), houseNo: d.houseNo,
      rooms: Number(d.beds) + 1, beds: Number(d.beds), baths: Number(d.baths), sqm: Number(d.sqm), floor: Number(d.floor) || 0, floors: Number(d.floors) || 0,
      rent, entry, features: feats, type: d.type, cond: d.cond,
      title: d.title.trim() || aiTitle(), desc: d.desc.trim() || aiDesc(),
      vaad: Number(d.vaad) || null, arnona: Number(d.arnona) || null, contract: Number(d.contract),
      guarantee: d.guarantee === 'yes' ? Number(d.guaranteeAmt) : 0, guarantors: d.guarantors === 'yes', partners: d.partners === 'yes', smoking: d.smoking === 'yes',
      by: { name: d.name.trim() || 'בעל הדירה', g: 'm', role: 'בעל הדירה' },
      pal: ['sea', 'sand', 'pine', 'rose', 'slate', 'bauhaus'][Math.floor(Math.random() * 6)], scenes: ['living', 'kitchen', 'bedroom'], photos: []
    };
    A.photoMem[a.id] = photos.slice();
    A.state.added.unshift(a);
    A.state.filter = null;
    A.save();
    A.log('publish', { photos: photos.length, video: !!videoName });
    A.go('deck');
    A.toast('הדירה פורסמה · היא הכרטיס הבא בערימה', 3000, 'ok');
  }
})();
