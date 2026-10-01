/*
 * כל טקסט ממשק. קובץ אחד, מקום אחד לבדיקת /HEB.
 * טקסט פשוט בלבד: הממשק מסנן כל ערך לפני שהוא נכנס ל-HTML.
 * «·» רק בין תוויות קצרות, לא בתוך משפט. בלי מקף ארוך.
 */
(function (Dira) {
  'use strict';

  /* ——— עזרי ניסוח ——— */
  const g = (gender, m, f) => (gender === 'f' ? f : m);
  const nis = (n) => Number(n).toLocaleString('en-US') + ' ₪';
  const num = (n) => Number(n).toLocaleString('en-US');
  function date(iso, withYear) {
    const [y, m, d] = iso.split('-').map(Number);
    const s = d + '.' + m;
    return withYear || y !== new Date().getFullYear() ? s + '.' + y : s;
  }
  const count = (n, one, many) => (n === 1 ? one : `${num(n)} ${many}`);
  const apts = (n) => count(n, 'דירה אחת', 'דירות');
  /* מיקום בכרטיס: רחוב ושכונה. כשהשכונה היא «מרכז» או חסרה, העיר במקומה */
  const place = (a) => [a.street, a.hood && a.hood !== 'מרכז' ? a.hood : a.city].filter(Boolean).join(', ');
  const fullAddress = (a) => `${a.street} ${a.houseNo}${a.entrance ? ' כניסה ' + a.entrance : ''}${a.hood ? ', ' + a.hood : ''}, ${a.city}`;

  const S = {
    fmt: { nis, date, place, fullAddress },

    app: {
      brand: 'דירה בהחלקה',
      asideTitle: 'דמו. נפתח הכי טוב בטלפון',
      asideText: 'כל הדירות והמחפשים כאן לדוגמה. שום דבר לא נשלח לאף אחד',
      close: 'סגירה',
      back: 'חזרה'
    },

    tabs: { nav: 'ניווט ראשי', deck: 'דירות', categories: 'קטגוריות', ai: 'עוזר AI', favs: 'אהבתי', newMatches: (n) => count(n, 'התאמה חדשה', 'התאמות חדשות') },

    top: { filter: 'סינון חכם', filterOn: 'סינון חכם, יש סינון פעיל', publish: 'פרסום דירה' },

    card: {
      example: 'דירה לדוגמה',
      mine: 'הדירה שפרסמת',
      starred: '★ סימנת כוכב',
      similar: 'דומה למה שסימנת',
      stampLike: 'שמרתי ♥',
      stampNope: 'דילוג',
      stampStar: '★ אהבתי במיוחד',
      beds: 'חדרי שינה',
      baths: 'חדרי רחצה',
      sqm: 'מ״ר',
      role: 'כרטיס דירה',
      aria: (a) => `${a.title}, ${nis(a.rent)}, ${place(a)}. Enter פותח פרטים, החצים מחליפים תמונה`,
      photo: (i, n) => `תמונה ${i} מתוך ${n}`
    },

    deck: {
      h1: 'דירות להשכרה',
      nope: 'דילוג',
      star: 'כוכב, אהבתי במיוחד',
      like: 'שמירה באהבתי',
      hint: 'ימינה שומרים, שמאלה מדלגים, למעלה כוכב',
      saved: 'נשמר ב«אהבתי»',
      starred: 'סימנת כוכב. נציג יותר דירות כמו זו',
      learned: (r) => (r.kind === 'price' ? 'הבנו. נציג פחות דירות במחיר הזה'
        : r.kind === 'balcony' ? 'הבנו. נציג פחות דירות בלי מרפסת'
          : `הבנו. נציג פחות דירות ב${r.hood}`),
      activeFilter: 'הסינון הפעיל',
      clearChip: 'ניקוי',
      chip: {
        q: (q) => `«${q}»`, max: (v) => `עד ${nis(v)}`, beds: (n) => `${n}+ חדרי שינה`, baths: (n) => `${n}+ חדרי רחצה`,
        sqm: (n) => `${n}+ מ״ר`, rooms: (n) => `${n}+ חדרים`, foryou: 'מותאם לך', ai: 'לפי העוזר'
      },
      emptyFilterTitle: 'אין עוד דירות שמתאימות לסינון',
      emptyFilterSeen: (n) => (n === 1 ? 'עברת על הדירה היחידה שמתאימה' : `עברת על כל ${num(n)} הדירות שמתאימות`),
      emptyFilterNone: 'אף דירה לא עונה על כל התנאים יחד',
      widen: 'הרחבת הטווח',
      widenNote: (changes) => 'אחרי ההרחבה: ' + changes.map((c) => (c.kind === 'max' ? `עד ${nis(c.value)}`
        : c.kind === 'cat' ? `בלי «${c.label}»`
          : c.kind === 'feat' || c.kind === 'place' ? `בלי «${c.value}»`
            : c.kind === 'q' ? `בלי החיפוש «${c.value}»`
              : c.kind === 'all' ? 'בלי סינון'
                : c.kind === 'max0' ? 'בלי תקרת מחיר'
                  : { beds: 'בלי מינימום חדרי שינה', baths: 'בלי מינימום חדרי רחצה', sqm: 'בלי מינימום מ״ר', rooms: 'בלי מינימום חדרים', foryou: 'בלי «מותאם לך»' }[c.kind])).join(', '),
      widened: (n) => `הטווח הורחב. יש עוד ${apts(n)}`,
      clearFilter: 'ניקוי הסינון',
      cleared: 'הסינון נוקה',
      emptyAllTitle: 'ראית את כל הדירות',
      emptyAllText: 'דירות חדשות מופיעות כאן כשהן מתפרסמות',
      again: (n) => (n === 1 ? 'להציג שוב את הדירה שדילגת עליה' : `להציג שוב ${num(n)} דירות שדילגת עליהן`),
      againDone: 'הדירות חזרו לערימה',
      publish: 'פרסום דירה'
    },

    filter: {
      title: 'סינון חכם',
      reset: 'איפוס',
      q: 'חיפוש חופשי',
      qPh: 'לדוגמה: כרמל, מרפסת, נוף לים',
      price: 'מחיר חודשי עד',
      noLimit: 'ללא הגבלה',
      beds: 'חדרי שינה, לפחות',
      baths: 'חדרי רחצה, לפחות',
      any: 'הכול',
      sqm: 'שטח, לפחות',
      sqmNone: 'ללא',
      sqmVal: (n) => `${n} מ״ר`,
      cats: 'קטגוריות',
      kept: 'נשמרים גם:',
      clearAll: 'ניקוי הכול',
      apply: (n) => (n ? `הצגת ${apts(n)}` : 'החלה, אין דירות מתאימות'),
      applied: (n) => (n ? `${apts(n)} מתאימות לסינון` : 'אין דירות שמתאימות לסינון')
    },

    details: {
      example: 'דירה לדוגמה',
      pay: 'תשלומים ודרישות',
      vaad: 'ועד בית',
      arnona: 'ארנונה דו-חודשית',
      contract: 'חוזה מינימלי',
      guarantee: 'ערבות בנקאית',
      guarantors: 'ערבים',
      partners: 'שותפים',
      smoking: 'עישון',
      entry: 'כניסה',
      floor: 'קומה',
      floorVal: (a) => (a.floor == null ? 'לא צוין' : a.floor === 0 ? 'קרקע' : a.floors ? `${a.floor} מתוך ${a.floors}` : String(a.floor)),
      outSqm: 'גינה או מרפסת',
      outSqmVal: (n) => `${n} מ״ר`,
      notes: 'הערות',
      by: 'מפרסם',
      address: 'כתובת מלאה',
      months: (n) => `${n} חודשים`,
      notSaid: 'לא צוין',
      notNeeded: 'לא נדרשת',
      needed: 'נדרשים',
      notNeededPl: 'לא נדרשים',
      allowed: 'מותר',
      notAllowed: 'לא מותר',
      now: 'מיידית',
      byLine: (a) => `${a.by.name}, ${a.by.role}`,
      mineBy: 'את הדירה הזאת פרסמת בדמו',
      photoBy: 'צילום ב-Unsplash:',
      hidden: (a) => `מספר הבית והטלפון של ${a.by.name} נחשפים אחרי התאמה.`,
      send: (a) => `שליחת פנייה ל${a.by.name}`,
      sendNote: (a) => `${a.by.name} ${g(a.by.g, 'יחליט', 'תחליט')} אם לאשר. אחרי אישור נפתחת שיחה.`,
      waiting: 'הפנייה נשלחה. מחכים לאישור',
      matched: 'יש התאמה. השיחה פתוחה',
      toMatch: 'למסך ההתאמה',
      star: 'כוכב',
      starOn: 'יש כוכב',
      save: 'שמירה',
      saveOn: 'נשמרה',
      sent: (a) => `הפנייה נשלחה ל${a.by.name}. אחרי אישור נפתחת שיחה`,
      alreadySent: 'כבר שלחת פנייה על הדירה הזאת'
    },

    favs: {
      h1: 'דירות שאהבתי',
      emptyTitle: 'עוד לא שמרת דירות',
      emptyText: 'החלקה ימינה או ♥ שומרת דירה כאן',
      toDeck: 'לדירות',
      star: '★ כוכב',
      wait: 'ממתין לאישור',
      match: 'יש התאמה',
      open: (a) => `${a.title}, ${nis(a.rent)}`,
      remove: (a) => `הסרה מאהבתי: ${a.title}`,
      removed: 'הוסר מ«אהבתי»',
      locked: 'יש פנייה על הדירה הזאת, ולכן היא נשארת ב«אהבתי»',
      foot: 'פנייה לבעל הדירה נשלחת מתוך פרטי הדירה',
      ownerLink: 'איך זה נראה אצל בעל הדירה'
    },

    cats: {
      h1: 'חיפוש לפי קטגוריות',
      count: (n) => apts(n),
      forYouOn: (n) => `${apts(n)} לפי הכוכבים שסימנת`,
      forYouOff: 'סמנו כוכב ונתחיל ללמוד',
      forYouNone: 'עוד אין כוכבים. אפשר לסמן ★ על דירה שאהבת במיוחד',
      applied: (label, n) => `${label}: ${apts(n)}`
    },

    ai: {
      h1: 'עוזר AI אישי',
      hello: 'היי, מה חשוב לך בדירה הבאה? למשל: 3 חדרים בכרמל עם מרפסת, עד 5,500 ₪.',
      notReal: 'בדמו העוזר מחפש לפי המילים שכתבת. זה לא AI אמיתי.',
      suggestions: ['3 חדרים עם מרפסת', 'עד 4,500 בחיפה', 'דירה עם חניה בקריות'],
      placeholder: 'מה חשוב לך בדירה?',
      inputAria: 'הבקשה לעוזר',
      send: 'שליחה',
      typing: 'העוזר כותב',
      notUnderstood: 'לא הבנתי מה לחפש. אפשר לכתוב מספר חדרים, מחיר, אזור, או משהו כמו מרפסת או חניה.',
      criterion: (k, v) => ({ rooms: `${v} חדרים ומעלה`, max: `עד ${nis(v)}` }[k] || v),
      droppedWord: (d) => ({ rooms: `${d.value} חדרים`, max: 'המחיר' }[d.kind] || d.value),
      found: (n, labels) => `מצאתי ${apts(n)}: ${labels.join(', ')}.`,
      partial: (n, dropped) => `לא מצאתי דירה עם הכול יחד. הנה ${n === 1 ? 'הכי קרובה' : num(n) + ' הכי קרובות'}, בלי ${dropped.join(' ובלי ')}.`,
      results: 'תוצאות שנמצאו',
      details: 'פרטים',
      save: 'שמירה',
      showInDeck: (n) => `הצגת ${apts(n)} בערימה`,
      applied: 'הערימה מציגה עכשיו רק את מה שביקשת'
    },

    match: {
      hello: 'יש התאמה',
      seekerTitle: (a) => `${a.by.name} ${g(a.by.g, 'אישר', 'אישרה')} את הפנייה שלך`,
      seekerSub: (a) => `${a.title}, ${nis(a.rent)}`,
      toYou: 'נחשף לך',
      toYouText: (a) => `הכתובת המלאה, ${a.street} ${a.houseNo}, והטלפון בשיחה`,
      toThem: (a) => `נחשף ל${a.by.name}`,
      toThemText: 'שם מלא, מקור הכנסה, הכנסה נוספת, נפשות וקצת עליך',
      openChat: 'פתיחת השיחה',
      fillAndChat: 'השלמת פרטים ופתיחת השיחה',
      backFavs: 'חזרה לאהבתי',
      ownerTitle: (s) => `יש התאמה עם ${s.first} ${s.last}`,
      ownerSub: 'עכשיו נחשפים הפרטים שלא ראית קודם',
      fullName: 'שם מלא',
      income: 'מקור הכנסה',
      extra: 'הכנסה נוספת',
      occupants: 'נפשות',
      entry: 'כניסה',
      about: (s) => g(s.g, 'עליו', 'עליה'),
      backOwner: 'חזרה לפניות',
      banner: (a) => `${a.by.name} ${g(a.by.g, 'אישר', 'אישרה')}. יש התאמה`,
      bannerText: (a) => `${a.street}. לחיצה פותחת את ההתאמה`
    },

    profile: {
      h1: 'הפרטים שלך',
      sub: (a) => `${a.by.name} ${g(a.by.g, 'יראה', 'תראה')} אותם עכשיו, כי יש ביניכם התאמה. אף אחד אחר לא רואה אותם.`,
      fill: 'מילוי לדוגמה',
      name: 'שם מלא',
      about: 'קצת עליך',
      aboutPh: 'מי גר בדירה, עבודה מהבית, חיות',
      income: 'מקור הכנסה',
      extra: 'הכנסה נוספת',
      occupants: 'נפשות',
      submit: 'שמירה ופתיחת השיחה',
      errName: 'חסר שם מלא. אפשר גם ללחוץ «מילוי לדוגמה»',
      example: { name: 'דנה לוי', about: 'גרה לבד עם חתולה, עובדת מהבית פעמיים בשבוע.', income: 'שכיר/ה', extra: 'אין', occupants: '1' }
    },

    chat: {
      sys: 'השיחה בדמו מדומה. ההודעות לא נשלחות לאף אחד',
      inputAria: 'הודעה',
      send: 'שליחה',
      typing: 'מקליד',
      seekerTitle: (a) => `${a.by.name}, ${a.by.role}`,
      seekerPrefill: (a) => `היי ${a.by.name}, ראיתי את הדירה ב${a.street}. אפשר לתאם ביקור?`,
      seekerReplies: (a) => [`היי! ${g(a.by.g, 'שמח', 'שמחה')} שיש התאמה. אפשר לבוא מחר בשש. הטלפון שלי 050-0000000 (מספר לדוגמה)`, 'מעולה, נתראה מחר.', 'בשמחה 🙂'],
      ownerTitle: (s) => `${s.first} ${s.last}`,
      ownerSub: (apt) => `על הדירה ב${apt.street}`,
      ownerPrefill: (s) => `היי ${s.first}, אישרתי את הפנייה. מתי נוח לך לבוא לראות את הדירה?`,
      ownerReplies: ['היי, תודה שאישרת! מחר אחרי חמש מתאים?', 'מעולה, נתראה מחר.', 'תודה 🙂'],
      toOwner: 'איך זה נראה אצל בעל הדירה',
      toPublish: 'יש לך דירה? פרסום דירה',
      toSeeker: 'לצד של מי שמחפש דירה'
    },

    publish: {
      h1: 'פרסום דירה',
      steps: { addr: 'כתובת מדויקת', details: 'פרטי הדירה', pay: 'תשלומים ודרישות', media: 'מדיה: תמונות וסרטון', contact: 'איש קשר' },
      stepOf: (i, n) => `שלב ${i} מתוך ${n}`,
      next: 'המשך',
      prev: 'הקודם',
      submit: 'פרסום הדירה',
      cityStreet: 'עיר ורחוב',
      city: 'עיר',
      cityPick: 'בחירה מהרשימה',
      street: 'רחוב',
      houseNo: 'מספר בית',
      entrance: 'כניסה',
      floor: 'קומה',
      floors: 'קומות בבניין',
      title: 'כותרת הנכס',
      rent: 'מחיר חודשי (₪)',
      sqm: 'מ״ר בנוי',
      outSqm: 'מ״ר גינה או מרפסת (לא חובה)',
      beds: 'חדרי שינה',
      baths: 'חדרי רחצה',
      type: 'סוג הנכס',
      cond: 'מצב הדירה',
      features: 'מאפייני הדירה',
      acType: 'סוג מיזוג',
      acPick: 'בחירה',
      parking: 'חניה',
      parkingNone: 'ללא',
      desc: 'תיאור',
      autowrite: (label) => `כתיבה אוטומטית של ${label}`,
      autowriteNote: 'בדמו הכתיבה האוטומטית מדומה: היא מרכיבה טקסט מהשדות שמילאת.',
      writing: 'תכף מוכן',
      written: 'נכתב אוטומטית. אפשר לערוך',
      payments: 'תשלומים',
      vaad: 'ועד בית (₪)',
      arnona: 'ארנונה דו-חודשית (₪)',
      contractReq: 'דרישות חוזה',
      contract: 'אורך חוזה מינימלי (חודשים)',
      guarantee: 'ערבות בנקאית נדרשת',
      guaranteeAmt: 'סכום הערבות (₪)',
      guarantors: 'דרושים ערבים',
      partners: 'שותפים מותר',
      smoking: 'עישון מותר',
      notes: 'הערות או דרישות נוספות (לא חובה)',
      yes: 'כן',
      no: 'לא',
      photos: 'תמונות הדירה (עד 10)',
      addPhotos: 'הוספת תמונות',
      photosCount: (n, max) => `${n} מתוך ${max}`,
      video: 'סרטון (לא חובה)',
      addVideo: 'הוספת סרטון',
      videoAdded: (name) => `נוסף סרטון: ${name}`,
      mediaNote: 'בלי תמונות, הכרטיס יוצג עם איור. בדמו הקבצים לא עולים לשום מקום, והם נעלמים ברענון הדף.',
      name: 'שם',
      phone: 'טלפון',
      phoneNote: 'הטלפון לא מופיע במודעה. הוא נחשף רק למי שאישרת, בשיחה.',
      err: {
        city: 'חובה לבחור עיר מהרשימה',
        street: 'חובה למלא רחוב',
        houseNo: 'חובה למלא מספר בית',
        rent: 'חובה למלא מחיר',
        sqm: 'חובה למלא מ״ר',
        acType: 'חובה לבחור סוג מיזוג',
        guaranteeAmt: 'חובה למלא את סכום הערבות',
        phone: 'חובה למלא טלפון, לפחות 9 ספרות'
      },
      errToast: (n) => (n === 1 ? 'שדה חובה אחד לא מולא. הוא מסומן באדום' : `${n} שדות חובה לא מולאו. הם מסומנים באדום`),
      published: 'הדירה פורסמה. היא הכרטיס הבא בערימה',
      ownerDefault: 'בעל הדירה'
    },

    owner: {
      h1: 'הפניות לדירה שלך',
      side: 'צד בעל הדירה',
      plan: 'מנוי',
      aptLine: (a) => `${a.rooms} חדרים, ${nis(a.rent)}, כניסה ${date(a.entry)}`,
      list: 'פניות לפי סדר הגעה',
      waiting: (n) => (n === 1 ? 'אחת ממתינה' : `${n} ממתינות`),
      rule: (a) => `«מתאים» נקבע רק לפי שני דברים: אם טווח התשלום מכסה ${nis(a.rent)}, ואם הכניסה עד 30 יום אחרי ${date(a.entry)}. מספר הנפשות מוצג ולא נספר.`,
      fit: 'מתאים',
      unfit: 'לא מתאים',
      approved: 'אושר',
      rejected: 'נדחה',
      arrived: (s) => `${g(s.g, 'הגיע', 'הגיעה')} ב-${s.arrived}`,
      payTo: (s) => `עד ${nis(s.payMax)}`,
      entryOn: (s) => `כניסה ${date(s.entry)}`,
      occupants: (n) => (n === 1 ? 'נפש אחת' : `${n} נפשות`),
      rowAria: (s, tag) => `${s.first}, ${tag}`,
      toSeeker: 'לצד של מי שמחפש דירה',
      allExample: 'כל המחפשים כאן לדוגמה',
      banner: (n) => `${n} פניות חדשות מאז הבוקר`,
      bannerText: 'מסודרות לפי סדר הגעה',
      sheetSub: (s) => `${g(s.g, 'מחפש', 'מחפשת')} לדוגמה, ${g(s.g, 'הגיע', 'הגיעה')} ב-${s.arrived}`,
      range: 'טווח תשלום',
      rangeVal: (s) => `${num(s.payMin)} עד ${num(s.payMax)} ₪`,
      occLabel: 'נפשות',
      entryLabel: 'כניסה',
      payLabel: 'תשלום',
      dateLabel: 'תאריך',
      payLine: (ok, a) => (ok ? `מכסה את ${nis(a.rent)}` : `לא מכסה את ${nis(a.rent)}`),
      dateLine: (ok, a) => (ok ? `עד 30 יום אחרי ${date(a.entry)}` : `לא בטווח של 30 יום אחרי ${date(a.entry)}`),
      hiddenList: (s) => `נחשף רק אחרי שמאשרים: שם משפחה, מקור הכנסה, הכנסה נוספת וקצת ${g(s.g, 'עליו', 'עליה')}.`,
      approve: 'אישור',
      reject: 'דחייה',
      already: (d) => (d === 'ok' ? 'כבר אישרת את הפנייה הזאת' : 'כבר דחית את הפנייה הזאת'),
      toMatch: 'לפרטים שנחשפו',
      rejectedToast: 'הפנייה נדחתה',
      planTitle: 'מנוי לבעלי דירות ומתווכים',
      planSub: 'בפיילוט אין תשלום. המחיר ייקבע אחריו',
      planRows: [['עכשיו', 'בפיילוט, ללא תשלום'], ['פרסום', 'הדירה נשארת בערימה, בלי להקפיץ מודעה'], ['פניות', 'מסומנות לפי תשלום ותאריך כניסה'], ['שיחות', 'רק עם מי שאישרת']],
      planOk: 'הבנתי'
    },

    log: {
      title: 'יומן הדמו',
      privacy: 'היומן נשמר רק בדפדפן הזה. אין בו שמות ואין בו פרטים אישיים.',
      whatsapp: 'שליחת הסיכום בוואטסאפ',
      clear: 'ניקוי היומן',
      reset: 'איפוס הדמו',
      cleared: 'היומן נוקה',
      resetDone: 'הדמו אופס. הכול חזר להתחלה',
      empty: 'עוד אין אירועים',
      tableCaption: 'אירועים אחרונים',
      cols: ['שעה', 'אירוע', 'על מה', 'זמן'],
      sec: (v) => `${v} ש׳`,
      /* עמודת «על מה»: כל שדה שנרשם באירוע, בלי פרטים אישיים */
      detail: (e) => [
        e.id, e.sid,
        e.dir ? { R: '♥', L: '✕', U: '★' }[e.dir] : '',
        e.side ? { seeker: 'מחפש', owner: 'בעל דירה' }[e.side] : '',
        e.fit === undefined ? '' : e.fit ? 'מתאים' : 'לא מתאים',
        e.on === undefined ? '' : e.on ? 'הופעל' : 'נוקה',
        e.len ? `${e.len} תווים` : '',
        e.photos === undefined ? '' : `${e.photos} תמונות`,
        e.video ? 'עם סרטון' : ''
      ].filter(Boolean).join(' '),
      stats: (m) => [
        [num(m.swipes), 'החלקות'], [num(m.likes), 'שמירות ♥'], [num(m.stars), 'כוכבים'], [num(m.nopes), 'דילוגים'],
        [String(m.secPerCard), 'שניות לכרטיס'], [num(m.requests), 'פניות'], [`${m.approvals}/${m.approvals + m.rejections}`, 'אישורים של בעל הדירה'],
        [num(m.published), 'דירות שפורסמו'], [num(m.quickExits), 'יציאות תוך 10 שניות']
      ],
      summary: (m) => [
        'סיכום דמו «דירה בהחלקה»',
        `החלקות: ${m.swipes}`,
        `שמירות: ${m.likes}, כוכבים: ${m.stars}, דילוגים: ${m.nopes}`,
        `שניות לכרטיס: ${m.secPerCard}`,
        `פניות: ${m.requests}, התאמות: ${m.matches}`,
        `אישורים של בעל הדירה: ${m.approvals}, דחיות: ${m.rejections}`,
        `דירות שפורסמו: ${m.published}`,
        `יציאות תוך 10 שניות: ${m.quickExits}`
      ].join('\n'),
      event: (t) => ({
        open: 'פתיחה', swipe: 'החלקה', request: 'פנייה', match: 'התאמה', approve: 'אישור', reject: 'דחייה',
        filter: 'סינון', category: 'קטגוריה', ai: 'עוזר', publish: 'פרסום', profile: 'פרטים', chat: 'הודעה', exit: 'יציאה'
      }[t] || t)
    }
  };

  Dira.S = S;
})(globalThis.Dira = globalThis.Dira || {});
