/*
 * נתוני הדמו.
 * כל הדירות והמחפשים כאן הם דוגמאות.
 *
 * כדי להחליף דירה לדוגמה בדירה אמיתית:
 * 1. משנים את השדות שלה (רחוב, מחיר, חדרים...).
 * 2. ממלאים photos בכתובות של תמונות שיש רשות להשתמש בהן. כשיש photos, האיור לא מוצג.
 * 3. משנים example ל-false, והתווית «דירה לדוגמה» נעלמת מהכרטיס.
 */
window.DEMO = {
  today: '2026-09-10',

  areas: [
    { id: 'haifa', label: 'חיפה' },
    { id: 'krayot', label: 'הקריות' },
    { id: 'all', label: 'כל האזור' }
  ],

  entryChoices: [
    { id: 'now', label: 'מיידי', days: 14 },
    { id: 'month', label: 'תוך חודש', days: 35 },
    { id: 'quarter', label: '1–3 חודשים', days: 95 },
    { id: 'flex', label: 'גמיש', days: 365 }
  ],

  apartments: [
    { id: 'a1', example: true, area: 'haifa', city: 'חיפה', hood: 'כרמל מרכזי', street: 'שדרות מוריה', houseNo: 12,
      rooms: 3.5, sqm: 85, floor: 3, floors: 5, rent: 5200, entry: '2026-10-15',
      features: ['מרפסת', 'מעלית', 'ממ"ד', 'מזגנים'],
      desc: 'מרפסת שמש עם נוף למפרץ. חמש דקות הליכה ממרכז הכרמל.',
      by: { name: 'רונית', g: 'f', role: 'בעלת הדירה' },
      pal: 'sea', scenes: ['balcony', 'living', 'kitchen', 'bedroom'], tour: true, photos: [] },

    { id: 'a2', example: true, area: 'haifa', city: 'חיפה', hood: 'נווה שאנן', street: 'רחוב טרומפלדור', houseNo: 41,
      rooms: 3, sqm: 70, floor: 2, floors: 4, rent: 4300, entry: '2026-10-01',
      features: ['מרפסת', 'מזגנים', 'חיות מחמד'],
      desc: 'בניין קטן ושקט, קרוב לטכניון ולתחבורה ציבורית.',
      by: { name: 'אבי', g: 'm', role: 'בעל הדירה' },
      pal: 'sand', scenes: ['living', 'bedroom', 'kitchen'], photos: [] },

    { id: 'a3', example: true, area: 'haifa', city: 'חיפה', hood: 'הדר', street: 'רחוב מסדה', houseNo: 18,
      rooms: 2.5, sqm: 60, floor: 1, floors: 3, rent: 3600, entry: '2026-09-20',
      features: ['משופצת', 'מזגנים'],
      desc: 'בניין באוהאוס משופץ, תקרות גבוהות וחלונות גדולים.',
      by: { name: 'ליאור', g: 'm', role: 'מתווך' },
      pal: 'bauhaus', scenes: ['living', 'kitchen', 'bedroom'], photos: [] },

    { id: 'a4', example: true, area: 'haifa', city: 'חיפה', hood: 'אחוזה', street: 'רחוב חורב', houseNo: 7,
      rooms: 4, sqm: 100, floor: 4, floors: 6, rent: 6400, entry: '2026-11-01',
      features: ['מרפסת', 'חניה', 'מעלית', 'ממ"ד', 'מחסן'],
      desc: 'דירה מרווחת עם מרפסת סוכה, חניה צמודה ומחסן.',
      by: { name: 'ליאור', g: 'm', role: 'מתווך' },
      pal: 'pine', scenes: ['living', 'balcony', 'kitchen', 'bedroom'], photos: [] },

    { id: 'a5', example: true, area: 'krayot', city: 'קריית מוצקין', hood: 'מרכז', street: 'שדרות בן גוריון', houseNo: 60,
      rooms: 4, sqm: 95, floor: 2, floors: 4, rent: 5400, entry: '2026-10-20',
      features: ['מרפסת', 'חניה', 'ממ"ד', 'מזגנים'],
      desc: 'ליד הקניון ובתי הספר. מרפסת גדולה שפונה מערבה.',
      by: { name: 'מירב', g: 'f', role: 'בעלת הדירה' },
      pal: 'rose', scenes: ['living', 'kitchen', 'bedroom', 'balcony'], photos: [] },

    { id: 'a6', example: true, area: 'haifa', city: 'חיפה', hood: 'כרמל צרפתי', street: 'רחוב יפה נוף', houseNo: 33,
      rooms: 3, sqm: 75, floor: 5, floors: 8, rent: 5900, entry: '2026-10-01',
      features: ['נוף לים', 'מעלית', 'מרפסת', 'מזגנים'],
      desc: 'נוף פתוח לים מכל חלונות הסלון.',
      by: { name: 'ליאור', g: 'm', role: 'מתווך' },
      pal: 'sea', scenes: ['balcony', 'living', 'bedroom'], photos: [] },

    { id: 'a7', example: true, area: 'krayot', city: 'קריית ביאליק', hood: 'מרכז', street: "רחוב ז'בוטינסקי", houseNo: 22,
      rooms: 3.5, sqm: 82, floor: 1, floors: 3, rent: 4700, entry: '2026-11-15',
      features: ['חניה', 'ממ"ד', 'חיות מחמד', 'מזגנים'],
      desc: 'קומה ראשונה בלי מדרגות רבות, מתאימה גם עם כלב.',
      by: { name: 'יוסי', g: 'm', role: 'בעל הדירה' },
      pal: 'sand', scenes: ['living', 'kitchen', 'bedroom'], photos: [] },

    { id: 'a8', example: true, area: 'haifa', city: 'חיפה', hood: 'רמת אלמוגי', street: 'רחוב אינשטיין', houseNo: 90,
      rooms: 3, sqm: 72, floor: 3, floors: 4, rent: 4900, entry: '2026-10-10',
      features: ['מרפסת', 'משופצת', 'מרוהטת'],
      desc: 'משופצת מהיסוד ומרוהטת, אפשר להיכנס עם מזוודה.',
      by: { name: 'דנה', g: 'f', role: 'בעלת הדירה' },
      pal: 'slate', scenes: ['living', 'bedroom', 'kitchen'], photos: [] },

    { id: 'a9', example: true, area: 'haifa', city: 'חיפה', hood: 'הדר', street: 'רחוב הרצל', houseNo: 55,
      rooms: 2, sqm: 50, floor: 2, floors: 3, rent: 3300, entry: '2026-09-25',
      features: ['מרוהטת', 'מזגנים'],
      desc: 'קרוב לרכבת התחתית ולשוק תלפיות.',
      by: { name: 'ליאור', g: 'm', role: 'מתווך' },
      pal: 'bauhaus', scenes: ['bedroom', 'living', 'kitchen'], photos: [] },

    { id: 'a10', example: true, area: 'krayot', city: 'קריית אתא', hood: 'מרכז', street: 'רחוב העצמאות', houseNo: 14,
      rooms: 4, sqm: 98, floor: 3, floors: 5, rent: 4800, entry: '2026-12-01',
      features: ['חניה', 'מעלית', 'ממ"ד', 'מחסן'],
      desc: 'בניין חדש יחסית, חניה בטאבו ומחסן בקומת הכניסה.',
      by: { name: 'חיים', g: 'm', role: 'בעל הדירה' },
      pal: 'pine', scenes: ['living', 'kitchen', 'bedroom'], photos: [] },

    { id: 'a11', example: true, area: 'haifa', city: 'חיפה', hood: 'כרמל מרכזי', street: 'שדרות הנשיא', houseNo: 101,
      rooms: 2.5, sqm: 58, floor: 4, floors: 4, rent: 4600, entry: '2026-10-05',
      features: ['נוף לים', 'מרפסת', 'מרוהטת'],
      desc: 'קומה אחרונה, מרפסת קטנה עם שקיעה מעל המפרץ.',
      by: { name: 'שירה', g: 'f', role: 'בעלת הדירה' },
      pal: 'rose', scenes: ['balcony', 'living', 'bedroom'], photos: [] },

    { id: 'a12', example: true, area: 'haifa', city: 'חיפה', hood: 'הדר עליון', street: 'רחוב פבזנר', houseNo: 28,
      rooms: 3, sqm: 78, floor: 2, floors: 4, rent: 4200, entry: '2026-10-15',
      features: ['מרפסת', 'מזגנים', 'חיות מחמד'],
      desc: 'רחוב ירוק ושקט, חמש דקות מגן הזיכרון.',
      by: { name: 'עומר', g: 'm', role: 'בעל הדירה' },
      pal: 'sand', scenes: ['living', 'balcony', 'kitchen'], photos: [] },

    { id: 'a13', example: true, area: 'krayot', city: 'קריית מוצקין', hood: 'מרכז', street: 'רחוב ויצמן', houseNo: 35,
      rooms: 3.5, sqm: 88, floor: 0, floors: 3, rent: 5000, entry: '2026-11-01',
      features: ['גינה', 'חניה', 'ממ"ד'],
      desc: 'דירת גן עם חצר פרטית. מתאימה למי שיש לו ילדים או כלב.',
      by: { name: 'מירב', g: 'f', role: 'בעלת הדירה' },
      pal: 'pine', scenes: ['living', 'kitchen', 'bedroom', 'balcony'], photos: [] },

    { id: 'a14', example: true, area: 'haifa', city: 'חיפה', hood: 'אחוזה', street: 'שדרות אבא חושי', houseNo: 150,
      rooms: 5, sqm: 120, floor: 6, floors: 9, rent: 7200, entry: '2026-11-10',
      features: ['נוף לים', 'חניה', 'מעלית', 'ממ"ד', 'מרפסת', 'מחסן'],
      desc: 'חמישה חדרים, שתי חניות ומרפסת לכל אורך הדירה.',
      by: { name: 'ליאור', g: 'm', role: 'מתווך' },
      pal: 'slate', scenes: ['living', 'balcony', 'kitchen', 'bedroom'], photos: [] },

    { id: 'a15', example: true, area: 'haifa', city: 'חיפה', hood: 'נווה שאנן', street: 'רחוב טרומפלדור', houseNo: 12,
      rooms: 4, sqm: 92, floor: 1, floors: 4, rent: 6000, entry: '2026-10-20',
      features: ['מרפסת', 'חניה', 'ממ"ד', 'חיות מחמד'],
      desc: 'ארבעה חדרים ליד פארק, מתאימה למשפחה.',
      by: { name: 'אבי', g: 'm', role: 'בעל הדירה' },
      pal: 'rose', scenes: ['living', 'bedroom', 'kitchen'], photos: [] }
  ],

  /* הדירה שמוצגת בקישור של בעלי הדירות */
  ownerApt: {
    id: 'mine', example: true, area: 'haifa', city: 'חיפה', hood: 'כרמל מרכזי', street: 'שדרות מוריה', houseNo: 38,
    rooms: 4, sqm: 95, floor: 2, floors: 5, rent: 5200, entry: '2026-11-01',
    features: ['מרפסת', 'מעלית', 'ממ"ד'], pal: 'pine', scenes: ['living'], photos: []
  },

  /* מחפשים מזויפים בלבד. לעולם לא אנשים אמיתיים — אחרי התאמה נחשף מקור ההכנסה שלהם */
  seekers: [
    { id: 's1', first: 'נועה', last: 'ברק', g: 'f', occupants: 2, payMin: 5000, payMax: 5600, entry: '2026-11-01', arrived: '08:12',
      income: 'שכירה · מעצבת UX', extra: 'אין', about: 'זוג צעיר בלי חיות. עובדים מהבית יומיים בשבוע.' },
    { id: 's2', first: 'אורי', last: 'לוי', g: 'm', occupants: 1, payMin: 4200, payMax: 4800, entry: '2026-11-15', arrived: '08:47',
      income: 'סטודנט לתואר שני', extra: 'מלגה, 2,000 ₪ בחודש', about: 'לומד בטכניון, מחפש שקט לכתיבת תזה.' },
    { id: 's3', first: 'מאיה', last: 'שחר', g: 'f', occupants: 4, payMin: 5200, payMax: 6000, entry: '2026-11-20', arrived: '09:30',
      income: 'שכירה · אחות', extra: 'קצבת ילדים', about: 'משפחה עם שני ילדים. מחפשים שכונה שקטה ליד בית ספר.' },
    { id: 's4', first: 'איתי', last: 'מזרחי', g: 'm', occupants: 2, payMin: 5500, payMax: 6500, entry: '2027-01-01', arrived: '10:05',
      income: 'עצמאי · הנדסאי חשמל', extra: 'אין', about: 'עוברים מתל אביב בעקבות עבודה חדשה.' },
    { id: 's5', first: 'דניאל', last: 'אברהם', g: 'm', occupants: 3, payMin: 4900, payMax: 5300, entry: '2026-10-10', arrived: '11:20',
      income: 'שכיר · מנהל מחסן', extra: 'עבודה בסופי שבוע, 1,200 ₪', about: 'זוג ותינוקת. גרים באזור שש שנים.' },
    { id: 's6', first: 'שירן', last: 'כהן', g: 'f', occupants: 1, payMin: 4500, payMax: 5000, entry: '2026-11-05', arrived: '12:02',
      income: 'עבודה חלקית', extra: 'קצבה', about: 'גרה לבד, בלי חיות, לא מעשנת.' }
  ]
};
