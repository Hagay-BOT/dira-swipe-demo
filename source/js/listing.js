/*
 * פרסום דירה (הכרעה 19): טופס ריק, כתיבה אוטומטית מדומה, בדיקת חובה בכל שלב, והמרה לדירה.
 * טהור, בלי DOM.
 */
(function (Dira) {
  'use strict';

  const STEPS = ['addr', 'details', 'pay', 'media', 'contact'];

  const emptyDraft = () => ({
    city: '', street: '', houseNo: '', entrance: '', floor: '', floors: '',
    title: '', rent: '', sqm: '', outSqm: '', beds: '2', baths: '1', type: 'דירה', cond: 'שמורה מאוד',
    features: [], acType: '', parking: '0', desc: '',
    vaad: '', arnona: '', contract: '12', guarantee: 'no', guaranteeAmt: '', guarantors: 'no', partners: 'no', smoking: 'no', notes: '',
    name: '', phone: ''
  });

  const num = (v) => Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')) || 0;
  const typeOf = (d, types) => types.find((t) => t.label === d.type) || { label: d.type };
  const rooms = (d) => num(d.beds || 1) + 1;

  /* «משופצת» ⟵ «משופץ» לסוג נכס בלשון זכר */
  const COND_SHORT = { 'חדשה מהקבלן': ['חדשה', 'חדש'], 'משופצת': ['משופצת', 'משופץ'], 'שמורה מאוד': ['שמורה', 'שמור'] };
  function condWord(d, types) {
    const pair = COND_SHORT[d.cond];
    if (!pair) return '';
    return typeOf(d, types).m ? pair[1] : pair[0];
  }

  function kindText(d) {
    return d.type === 'דירה' ? `דירת ${rooms(d)} חדרים` : `${d.type} ${rooms(d)} חדרים`;
  }

  const joinHe = (list) => (list.length > 1 ? list.slice(0, -1).join(', ') + ' ו' + list[list.length - 1] : list[0] || '');

  function autoTitle(d, types) {
    const extras = [];
    if (d.features.includes('מרפסת')) extras.push('מרפסת');
    if (num(d.parking) > 0 || d.features.includes('חניה')) extras.push('חניה');
    if (d.features.includes('ממ"ד')) extras.push('ממ"ד');
    const cond = condWord(d, types);
    return [kindText(d), cond, extras.length ? 'עם ' + joinHe(extras) : '', d.street.trim() ? 'ב' + d.street.trim() : '']
      .filter(Boolean).join(' ');
  }

  function autoDesc(d, types) {
    const cond = condWord(d, types);
    const where = [d.street.trim(), d.city].filter(Boolean).join(', ');
    const size = [d.sqm ? `${num(d.sqm)} מ״ר` : '', d.floor !== '' ? (num(d.floor) === 0 ? 'קומת קרקע' : `קומה ${num(d.floor)}${d.floors ? ' מתוך ' + num(d.floors) : ''}`) : '']
      .filter(Boolean).join(', ');
    const inside = d.features.filter((x) => x !== 'מיזוג' && x !== 'חניה').concat(d.acType ? [d.acType] : []);
    const park = num(d.parking);
    return [
      `${kindText(d)}${cond ? ' ' + cond : ''}${where ? ' ב' + where : ''}.`,
      size ? size + '.' : '',
      inside.length ? `בדירה: ${inside.join(', ')}.` : '',
      park === 1 ? 'חניה צמודה.' : park > 1 ? `${park} חניות צמודות.` : ''
    ].filter(Boolean).join(' ');
  }

  /* מחזיר { שדה: קוד שגיאה }. ריק = השלב תקין */
  function validate(step, d, data) {
    const e = {};
    if (step === 'addr') {
      if (!data.cities.includes(d.city)) e.city = 'city';
      if (!d.street.trim()) e.street = 'street';
      if (!String(d.houseNo).trim()) e.houseNo = 'houseNo';
    }
    if (step === 'details') {
      if (!num(d.rent)) e.rent = 'rent';
      if (!num(d.sqm)) e.sqm = 'sqm';
      if (d.features.includes('מיזוג') && !d.acType) e.acType = 'acType';
    }
    if (step === 'pay' && d.guarantee === 'yes' && !num(d.guaranteeAmt)) e.guaranteeAmt = 'guaranteeAmt';
    if (step === 'contact' && String(d.phone).replace(/\D/g, '').length < 9) e.phone = 'phone';
    return e;
  }

  function hash(s) {
    let h = 0;
    for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
    return Math.abs(h);
  }

  /* opts: { id, today (YYYY-MM-DD), cfg, types } */
  function toApartment(d, opts) {
    const feats = d.features.map((x) => (x === 'מיזוג' ? 'מזגנים' : x));
    if (num(d.parking) > 0 && !feats.includes('חניה')) feats.push('חניה');
    return {
      id: opts.id, mine: true, example: false,
      area: d.city === 'חיפה' ? 'haifa' : 'krayot', city: d.city, hood: '', street: d.street.trim(), houseNo: String(d.houseNo).trim(),
      title: d.title.trim() || autoTitle(d, opts.types), type: d.type, cond: d.cond,
      rooms: rooms(d), beds: num(d.beds), baths: num(d.baths), sqm: num(d.sqm), floor: String(d.floor).trim() === '' ? null : num(d.floor), floors: num(d.floors) || null,
      rent: num(d.rent), entry: opts.today, features: feats,
      entrance: d.entrance.trim(), outSqm: num(d.outSqm) || null, notes: d.notes.trim(),
      desc: d.desc.trim() || autoDesc(d, opts.types),
      vaad: num(d.vaad) || null, arnona: num(d.arnona) || null, contract: num(d.contract),
      guarantee: d.guarantee === 'yes' ? num(d.guaranteeAmt) : 0,
      guarantors: d.guarantors === 'yes', partners: d.partners === 'yes', smoking: d.smoking === 'yes',
      by: { name: d.name.trim(), g: 'm', role: 'בעל הדירה' },
      pal: opts.cfg.pals[hash(opts.id) % opts.cfg.pals.length], scenes: opts.cfg.publishedScenes.slice(), photos: []
    };
  }

  Dira.listing = { STEPS, emptyDraft, autoTitle, autoDesc, validate, toApartment };
})(globalThis.Dira = globalThis.Dira || {});
