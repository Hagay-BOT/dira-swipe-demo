/*
 * נתוני הדמו. כל הדירות והמחפשים כאן הם דוגמאות.
 *
 * כדי להחליף דירה לדוגמה בדירה אמיתית, בלי לגעת בקוד:
 * 1. משנים את השדות שלה (רחוב, מחיר, חדרים...).
 * 2. ממלאים photos בכתובות של תמונות שיש רשות להשתמש בהן, ורושמים את הצלם ב-photoCredits. כשאין photos, מוצג איור.
 * 3. משנים example ל-false, והתווית «דירה לדוגמה» נעלמת מהכרטיס.
 *
 * שדות: rooms = חדרים, beds = חדרי שינה, baths = חדרי רחצה, sqm = מ״ר,
 * vaad = ועד בית, arnona = ארנונה דו-חודשית, contract = חוזה מינימלי בחודשים,
 * guarantee = ערבות בנקאית בשקלים (0 = לא נדרשת), by.g = 'm' או 'f' לניסוח.
 */
(function (Dira) {
  'use strict';

  const apartments = [
    { id: 'a1', example: true, area: 'haifa', city: 'חיפה', hood: 'כרמל מרכזי', street: 'שדרות מוריה', houseNo: 12,
      title: 'דירת 3.5 חדרים עם מרפסת שמש ונוף למפרץ', type: 'דירה', cond: 'שמורה מאוד',
      rooms: 3.5, beds: 2, baths: 1, sqm: 85, floor: 3, floors: 5, rent: 5200, entry: '2026-10-15',
      features: ['מרפסת', 'מעלית', 'ממ"ד', 'מזגנים'],
      desc: 'מרפסת שמש עם נוף למפרץ. חמש דקות הליכה ממרכז הכרמל.',
      vaad: 180, arnona: 780, contract: 12, guarantee: 10400, guarantors: false, partners: false, smoking: false,
      by: { name: 'רונית', g: 'f', role: 'בעלת הדירה' },
      pal: 'sea', scenes: ['balcony', 'living', 'kitchen', 'bedroom'], photos: ['photos/jm0xDXPJURc.jpg', 'photos/ag7FMjaVxC8.jpg', 'photos/fWjIQs8sHPA.jpg'] },

    { id: 'a2', example: true, area: 'haifa', city: 'חיפה', hood: 'נווה שאנן', street: 'רחוב טרומפלדור', houseNo: 41,
      title: 'דירת 3 חדרים שקטה ליד הטכניון', type: 'דירה', cond: 'במצב טוב',
      rooms: 3, beds: 2, baths: 1, sqm: 70, floor: 2, floors: 4, rent: 4300, entry: '2026-10-01',
      features: ['מרפסת', 'מזגנים', 'חיות מחמד'],
      desc: 'בניין קטן ושקט, קרוב לטכניון ולתחבורה ציבורית.',
      vaad: 120, arnona: 620, contract: 12, guarantee: 0, guarantors: true, partners: true, smoking: false,
      by: { name: 'אבי', g: 'm', role: 'בעל הדירה' },
      pal: 'sand', scenes: ['living', 'bedroom', 'kitchen'], photos: ['photos/i4WbkwwvRj4.jpg', 'photos/6mCGcFLoLgA.jpg', 'photos/17YnTgHkSEE.jpg'] },

    { id: 'a3', example: true, area: 'haifa', city: 'חיפה', hood: 'הדר', street: 'רחוב מסדה', houseNo: 18,
      title: '2.5 חדרים משופצת בבניין באוהאוס', type: 'דירה', cond: 'משופצת',
      rooms: 2.5, beds: 1, baths: 1, sqm: 60, floor: 1, floors: 3, rent: 3600, entry: '2026-09-20',
      features: ['משופצת', 'מזגנים'],
      desc: 'בניין באוהאוס משופץ, תקרות גבוהות וחלונות גדולים.',
      vaad: 90, arnona: 480, contract: 12, guarantee: 0, guarantors: true, partners: false, smoking: true,
      by: { name: 'ליאור', g: 'm', role: 'מתווך' },
      pal: 'bauhaus', scenes: ['living', 'kitchen', 'bedroom'], photos: ['photos/8tOPzx3k62g.jpg', 'photos/yJ24C63MNhE.jpg', 'photos/ABohRftG_Os.jpg'] },

    { id: 'a4', example: true, area: 'haifa', city: 'חיפה', hood: 'אחוזה', street: 'רחוב חורב', houseNo: 7,
      title: '4 חדרים מרווחת עם מרפסת סוכה וחניה', type: 'דירה', cond: 'שמורה מאוד',
      rooms: 4, beds: 3, baths: 2, sqm: 100, floor: 4, floors: 6, rent: 6400, entry: '2026-11-01',
      features: ['מרפסת', 'חניה', 'מעלית', 'ממ"ד', 'מחסן'],
      desc: 'דירה מרווחת עם מרפסת סוכה, חניה צמודה ומחסן.',
      vaad: 250, arnona: 980, contract: 24, guarantee: 12800, guarantors: false, partners: false, smoking: false,
      by: { name: 'ליאור', g: 'm', role: 'מתווך' },
      pal: 'pine', scenes: ['living', 'balcony', 'kitchen', 'bedroom'], photos: ['photos/ZGMeWNJJlAs.jpg', 'photos/Q1750priSUc.jpg', 'photos/VICv-D8viro.jpg'] },

    { id: 'a5', example: true, area: 'krayot', city: 'קריית מוצקין', hood: 'מרכז', street: 'שדרות בן גוריון', houseNo: 60,
      title: '4 חדרים עם מרפסת גדולה ליד הקניון', type: 'דירה', cond: 'במצב טוב',
      rooms: 4, beds: 3, baths: 2, sqm: 95, floor: 2, floors: 4, rent: 5400, entry: '2026-10-20',
      features: ['מרפסת', 'חניה', 'ממ"ד', 'מזגנים'],
      desc: 'ליד הקניון ובתי הספר. מרפסת גדולה שפונה מערבה.',
      vaad: 150, arnona: 820, contract: 12, guarantee: 10800, guarantors: false, partners: false, smoking: false,
      by: { name: 'מירב', g: 'f', role: 'בעלת הדירה' },
      pal: 'rose', scenes: ['living', 'kitchen', 'bedroom', 'balcony'], photos: ['photos/DcVOmeH9DMQ.jpg', 'photos/EOnPMAAqZ8o.jpg', 'photos/CMHgRFDANH8.jpg'] },

    { id: 'a6', example: true, area: 'haifa', city: 'חיפה', hood: 'כרמל צרפתי', street: 'רחוב יפה נוף', houseNo: 33,
      title: '3 חדרים עם נוף פתוח לים', type: 'דירה', cond: 'משופצת',
      rooms: 3, beds: 2, baths: 1, sqm: 75, floor: 5, floors: 8, rent: 5900, entry: '2026-10-01',
      features: ['נוף לים', 'מעלית', 'מרפסת', 'מזגנים'],
      desc: 'נוף פתוח לים מכל חלונות הסלון.',
      vaad: 220, arnona: 760, contract: 12, guarantee: 11800, guarantors: false, partners: false, smoking: false,
      by: { name: 'ליאור', g: 'm', role: 'מתווך' },
      pal: 'sea', scenes: ['balcony', 'living', 'bedroom'], photos: ['photos/YR9CSC9K9Wc.jpg', 'photos/ag7FMjaVxC8.jpg', 'photos/9Cmony35LOE.jpg'] },

    { id: 'a7', example: true, area: 'krayot', city: 'קריית ביאליק', hood: 'מרכז', street: "רחוב ז'בוטינסקי", houseNo: 22,
      title: '3.5 חדרים בקומה ראשונה, מתאימה גם עם כלב', type: 'דירה', cond: 'במצב טוב',
      rooms: 3.5, beds: 2, baths: 1, sqm: 82, floor: 1, floors: 3, rent: 4700, entry: '2026-11-15',
      features: ['חניה', 'ממ"ד', 'חיות מחמד', 'מזגנים'],
      desc: 'קומה ראשונה בלי מדרגות רבות, מתאימה גם עם כלב.',
      vaad: 110, arnona: 700, contract: 12, guarantee: 0, guarantors: true, partners: false, smoking: false,
      by: { name: 'יוסי', g: 'm', role: 'בעל הדירה' },
      pal: 'sand', scenes: ['living', 'kitchen', 'bedroom'], photos: ['photos/W2sIDTb3AeI.jpg', 'photos/6mCGcFLoLgA.jpg', 'photos/gooFl1sx3ow.jpg'] },

    { id: 'a8', example: true, area: 'haifa', city: 'חיפה', hood: 'רמת אלמוגי', street: 'רחוב אינשטיין', houseNo: 90,
      title: '3 חדרים משופצת ומרוהטת, נכנסים עם מזוודה', type: 'דירה', cond: 'משופצת',
      rooms: 3, beds: 2, baths: 1, sqm: 72, floor: 3, floors: 4, rent: 4900, entry: '2026-10-10',
      features: ['מרפסת', 'משופצת', 'מרוהטת'],
      desc: 'משופצת מהיסוד ומרוהטת, אפשר להיכנס עם מזוודה.',
      vaad: 130, arnona: 690, contract: 12, guarantee: 9800, guarantors: false, partners: true, smoking: false,
      by: { name: 'דנה', g: 'f', role: 'בעלת הדירה' },
      pal: 'slate', scenes: ['living', 'bedroom', 'kitchen'], photos: ['photos/2cfj0Y5ch00.jpg', 'photos/Q1750priSUc.jpg', 'photos/fWjIQs8sHPA.jpg'] },

    { id: 'a9', example: true, area: 'haifa', city: 'חיפה', hood: 'הדר', street: 'רחוב הרצל', houseNo: 55,
      title: '2 חדרים מרוהטת ליד הכרמלית', type: 'דירה', cond: 'במצב טוב',
      rooms: 2, beds: 1, baths: 1, sqm: 50, floor: 2, floors: 3, rent: 3300, entry: '2026-09-25',
      features: ['מרוהטת', 'מזגנים'],
      desc: 'קרוב לכרמלית ולשוק תלפיות.',
      vaad: 70, arnona: 420, contract: 6, guarantee: 0, guarantors: true, partners: false, smoking: true,
      by: { name: 'ליאור', g: 'm', role: 'מתווך' },
      pal: 'bauhaus', scenes: ['bedroom', 'living', 'kitchen'], photos: ['photos/Y7zup896jrI.jpg', 'photos/Rjnzt2wvMQE.jpg', 'photos/ABohRftG_Os.jpg'] },

    { id: 'a10', example: true, area: 'krayot', city: 'קריית אתא', hood: 'מרכז', street: 'רחוב העצמאות', houseNo: 14,
      title: '4 חדרים בבניין חדש עם חניה ומחסן', type: 'דירה', cond: 'חדשה מהקבלן',
      rooms: 4, beds: 3, baths: 2, sqm: 98, floor: 3, floors: 5, rent: 4800, entry: '2026-12-01',
      features: ['חניה', 'מעלית', 'ממ"ד', 'מחסן'],
      desc: 'בניין חדש יחסית, חניה בטאבו ומחסן בקומת הכניסה.',
      vaad: 200, arnona: 840, contract: 24, guarantee: 9600, guarantors: false, partners: false, smoking: false,
      by: { name: 'חיים', g: 'm', role: 'בעל הדירה' },
      pal: 'pine', scenes: ['living', 'kitchen', 'bedroom'], photos: ['photos/dWH92v9E6j4.jpg', 'photos/EOnPMAAqZ8o.jpg', 'photos/17YnTgHkSEE.jpg'] },

    { id: 'a11', example: true, area: 'haifa', city: 'חיפה', hood: 'כרמל מרכזי', street: 'שדרות הנשיא', houseNo: 101,
      title: 'דירת גג קטנה עם שקיעה מעל המפרץ', type: 'דירת גג', cond: 'שמורה מאוד',
      rooms: 2.5, beds: 1, baths: 1, sqm: 58, floor: 4, floors: 4, rent: 4600, entry: '2026-10-05',
      features: ['נוף לים', 'מרפסת', 'מרוהטת'],
      desc: 'קומה אחרונה, מרפסת קטנה עם שקיעה מעל המפרץ.',
      vaad: 160, arnona: 560, contract: 12, guarantee: 0, guarantors: true, partners: false, smoking: false,
      by: { name: 'שירה', g: 'f', role: 'בעלת הדירה' },
      pal: 'rose', scenes: ['balcony', 'living', 'bedroom'], photos: ['photos/x1b1SuGLH3Y.jpg', 'photos/yJ24C63MNhE.jpg', 'photos/9Cmony35LOE.jpg'] },

    { id: 'a12', example: true, area: 'haifa', city: 'חיפה', hood: 'הדר עליון', street: 'רחוב פבזנר', houseNo: 28,
      title: '3 חדרים ברחוב ירוק ושקט', type: 'דירה', cond: 'במצב טוב',
      rooms: 3, beds: 2, baths: 1, sqm: 78, floor: 2, floors: 4, rent: 4200, entry: '2026-10-15',
      features: ['מרפסת', 'מזגנים', 'חיות מחמד'],
      desc: 'רחוב ירוק ושקט, חמש דקות מגן הזיכרון.',
      vaad: 100, arnona: 640, contract: 12, guarantee: 0, guarantors: true, partners: true, smoking: false,
      by: { name: 'עומר', g: 'm', role: 'בעל הדירה' },
      pal: 'sand', scenes: ['living', 'balcony', 'kitchen'], photos: ['photos/x5Mfl5Vtn4c.jpg', 'photos/ag7FMjaVxC8.jpg', 'photos/CMHgRFDANH8.jpg'] },

    { id: 'a13', example: true, area: 'krayot', city: 'קריית מוצקין', hood: 'מרכז', street: 'רחוב ויצמן', houseNo: 35,
      title: 'דירת גן 3.5 חדרים עם חצר פרטית', type: 'דירת גן', cond: 'שמורה מאוד',
      rooms: 3.5, beds: 2, baths: 1, sqm: 88, floor: 0, floors: 3, rent: 5000, entry: '2026-11-01',
      features: ['גינה', 'חניה', 'ממ"ד'],
      desc: 'דירת גן עם חצר פרטית. מתאימה למי שיש ילדים או כלב.',
      vaad: 90, arnona: 760, contract: 12, guarantee: 10000, guarantors: false, partners: false, smoking: false,
      by: { name: 'מירב', g: 'f', role: 'בעלת הדירה' },
      pal: 'pine', scenes: ['living', 'kitchen', 'bedroom', 'balcony'], photos: ['photos/KJ3BwWPA3mI.jpg', 'photos/Q1750priSUc.jpg', 'photos/VICv-D8viro.jpg'] },

    { id: 'a14', example: true, area: 'haifa', city: 'חיפה', hood: 'אחוזה', street: 'שדרות אבא חושי', houseNo: 150,
      title: 'פנטהאוז 5 חדרים עם נוף לים ושתי חניות', type: 'פנטהאוז', cond: 'חדשה מהקבלן',
      rooms: 5, beds: 4, baths: 2, sqm: 120, floor: 6, floors: 9, rent: 7200, entry: '2026-11-10',
      features: ['נוף לים', 'חניה', 'מעלית', 'ממ"ד', 'מרפסת', 'מחסן'],
      desc: 'חמישה חדרים, שתי חניות ומרפסת לכל אורך הדירה.',
      vaad: 350, arnona: 1400, contract: 24, guarantee: 21600, guarantors: false, partners: false, smoking: false,
      by: { name: 'ליאור', g: 'm', role: 'מתווך' },
      pal: 'slate', scenes: ['living', 'balcony', 'kitchen', 'bedroom'], photos: ['photos/keYaaAL4aho.jpg', 'photos/dWH92v9E6j4.jpg', 'photos/gooFl1sx3ow.jpg'] },

    { id: 'a15', example: true, area: 'haifa', city: 'חיפה', hood: 'נווה שאנן', street: 'רחוב טרומפלדור', houseNo: 12,
      title: '4 חדרים למשפחה ליד הפארק', type: 'דירה', cond: 'במצב טוב',
      rooms: 4, beds: 3, baths: 2, sqm: 92, floor: 1, floors: 4, rent: 6000, entry: '2026-10-20',
      features: ['מרפסת', 'חניה', 'ממ"ד', 'חיות מחמד'],
      desc: 'ארבעה חדרים ליד פארק, מתאימה למשפחה.',
      vaad: 140, arnona: 900, contract: 12, guarantee: 12000, guarantors: false, partners: false, smoking: false,
      by: { name: 'אבי', g: 'm', role: 'בעל הדירה' },
      pal: 'rose', scenes: ['living', 'bedroom', 'kitchen'], photos: ['photos/0jzjEHbZQ4I.jpg', 'photos/6mCGcFLoLgA.jpg', 'photos/17YnTgHkSEE.jpg'] }
  ];

  /* מי צילם כל תמונה. כל התמונות מ-Unsplash, ברישיון Unsplash (שימוש חופשי, גם מסחרי). המקור: https://unsplash.com/photos/<מזהה> */
  const photoCredits = {
    'photos/0jzjEHbZQ4I.jpg': 'Prydumano Design',
    'photos/17YnTgHkSEE.jpg': 'Alex Tyson',
    'photos/2cfj0Y5ch00.jpg': 'Puscas Adryan',
    'photos/6mCGcFLoLgA.jpg': 'Irena Oze',
    'photos/8tOPzx3k62g.jpg': 'Bozica Uglesic',
    'photos/9Cmony35LOE.jpg': 'Zulian Firmansyah',
    'photos/ABohRftG_Os.jpg': 'Julia',
    'photos/CMHgRFDANH8.jpg': 'Marcel Strauß',
    'photos/DcVOmeH9DMQ.jpg': 'Khanh Nguyen',
    'photos/EOnPMAAqZ8o.jpg': 'Aleksandra Dementeva',
    'photos/KJ3BwWPA3mI.jpg': 'Georgi Kalaydzhiev',
    'photos/L-ZvTSkHL5E.jpg': 'Thái An',
    'photos/Q1750priSUc.jpg': 'Irena Oze',
    'photos/Rjnzt2wvMQE.jpg': 'Alexander Mass',
    'photos/VICv-D8viro.jpg': 'Aleksandra Dementeva',
    'photos/W2sIDTb3AeI.jpg': 'Costa Live',
    'photos/Y7zup896jrI.jpg': 'Vincent Yap',
    'photos/YR9CSC9K9Wc.jpg': 'Arthur Charles Pratt',
    'photos/ZGMeWNJJlAs.jpg': 'imren tutuncu',
    'photos/ag7FMjaVxC8.jpg': 'Caroline Badran',
    'photos/dWH92v9E6j4.jpg': 'Marina Nazina',
    'photos/fWjIQs8sHPA.jpg': 'Collov Home Design',
    'photos/gooFl1sx3ow.jpg': 'Aleksandra Dementeva',
    'photos/i4WbkwwvRj4.jpg': 'Evan Wise',
    'photos/jm0xDXPJURc.jpg': 'David Kuvaev',
    'photos/keYaaAL4aho.jpg': 'Franco Debartolo',
    'photos/x1b1SuGLH3Y.jpg': 'Sergey Beschastnykh',
    'photos/x5Mfl5Vtn4c.jpg': 'Irena Oze',
    'photos/yJ24C63MNhE.jpg': 'Aleksandra Dementeva'
  };

  /* הדירה שמוצגת בקישור של בעלי הדירות */
  const ownerApt = {
    id: 'mine', example: true, area: 'haifa', city: 'חיפה', hood: 'כרמל מרכזי', street: 'שדרות מוריה', houseNo: 38,
    title: 'דירת 4 חדרים עם מרפסת בכרמל', type: 'דירה', cond: 'שמורה מאוד',
    rooms: 4, beds: 3, baths: 1, sqm: 95, floor: 2, floors: 5, rent: 5200, entry: '2026-11-01',
    features: ['מרפסת', 'מעלית', 'ממ"ד'], pal: 'pine', scenes: ['living'], photos: ['photos/L-ZvTSkHL5E.jpg']
  };

  /* מחפשים מזויפים בלבד. לעולם לא אנשים אמיתיים: אחרי התאמה נחשף מקור ההכנסה שלהם. arrived = שעת הגעה, לפי הסדר */
  const seekers = [
    { id: 's1', first: 'נועה', last: 'ברק', g: 'f', occupants: 2, payMin: 5000, payMax: 5600, entry: '2026-11-01', arrived: '08:12',
      income: 'שכירה, מעצבת UX', extra: 'אין', about: 'זוג צעיר בלי חיות. עובדים מהבית יומיים בשבוע.' },
    { id: 's2', first: 'אורי', last: 'לוי', g: 'm', occupants: 1, payMin: 4200, payMax: 4800, entry: '2026-11-15', arrived: '08:47',
      income: 'סטודנט לתואר שני', extra: 'מלגה, 2,000 ₪ בחודש', about: 'לומד בטכניון, מחפש שקט לכתיבת תזה.' },
    { id: 's3', first: 'מאיה', last: 'שחר', g: 'f', occupants: 4, payMin: 5200, payMax: 6000, entry: '2026-11-20', arrived: '09:30',
      income: 'שכירה, אחות', extra: 'קצבת ילדים', about: 'משפחה עם שני ילדים. מחפשים שכונה שקטה ליד בית ספר.' },
    { id: 's4', first: 'איתי', last: 'מזרחי', g: 'm', occupants: 2, payMin: 5500, payMax: 6500, entry: '2027-01-01', arrived: '10:05',
      income: 'עצמאי, הנדסאי חשמל', extra: 'אין', about: 'עוברים מתל אביב בעקבות עבודה חדשה.' },
    { id: 's5', first: 'דניאל', last: 'אברהם', g: 'm', occupants: 3, payMin: 4900, payMax: 5300, entry: '2026-10-10', arrived: '11:20',
      income: 'שכיר, מנהל מחסן', extra: 'עבודה בסופי שבוע, 1,200 ₪', about: 'זוג ותינוקת. גרים באזור שש שנים.' },
    { id: 's6', first: 'שירן', last: 'כהן', g: 'f', occupants: 1, payMin: 4500, payMax: 5000, entry: '2026-11-05', arrived: '12:02',
      income: 'עבודה חלקית', extra: 'קצבה', about: 'גרה לבד, בלי חיות, לא מעשנת.' }
  ];

  const has = (f) => (a) => a.features.includes(f);
  /* קטגוריות. בלי test = «מותאם לך», שמחושבת מהכוכבים */
  const categories = [
    { id: 'foryou', label: 'מותאם לך', badge: '✨' },
    { id: 'luxury', label: 'יוקרה', badge: '💎', test: (a) => a.rent >= 6000 || a.type === 'פנטהאוז' },
    { id: 'balcony', label: 'מרפסת', badge: '🌤️', test: has('מרפסת') },
    { id: 'sea', label: 'נוף לים', badge: '🌊', test: has('נוף לים') },
    { id: 'small', label: 'עד 2.5 חדרים', badge: '🛋️', test: (a) => a.rooms <= 2.5 },
    { id: 'family', label: '4 חדרים ומעלה', badge: '🏡', test: (a) => a.rooms >= 4 },
    { id: 'mamad', label: 'ממ"ד', badge: '🛡️', test: has('ממ"ד') },
    { id: 'parking', label: 'חניה', badge: '🅿️', test: has('חניה') },
    { id: 'pets', label: 'חיות מחמד', badge: '🐾', test: has('חיות מחמד') },
    { id: 'furnished', label: 'מרוהטת', badge: '🪑', test: has('מרוהטת') },
    { id: 'garden', label: 'דירת גן', badge: '🌿', test: (a) => a.type === 'דירת גן' || a.features.includes('גינה') },
    { id: 'renovated', label: 'משופצת', badge: '🔨', test: (a) => a.cond === 'משופצת' || a.cond === 'חדשה מהקבלן' }
  ];

  const cities = ['חיפה', 'קריית ביאליק', 'קריית מוצקין', 'קריית אתא', 'קריית ים', 'נשר', 'טירת כרמל'];
  const streets = Array.from(new Set(apartments.map((a) => a.street).concat(['רחוב הנביאים', 'רחוב חסן שוקרי', 'שדרות הציונות', 'רחוב אלנבי', 'דרך הים'])));
  /* סוגי נכס. m = שם זכר, לניסוח «משופץ / משופצת» בכתיבה האוטומטית */
  const types = [
    { label: 'דירה' }, { label: 'דירת גן' }, { label: 'דירת גג' }, { label: 'פנטהאוז', m: true }, { label: 'דופלקס', m: true },
    { label: 'לופט', m: true }, { label: 'קוטג׳', m: true }, { label: 'בית פרטי', m: true }, { label: 'סטודיו', m: true }
  ];
  const conds = ['חדשה מהקבלן', 'משופצת', 'שמורה מאוד', 'במצב טוב', 'זקוקה לשיפוץ'];
  const featureList = ['מיזוג', 'מרפסת', 'ממ"ד', 'מחסן', 'נגישות', 'דוד שמש', 'חניה', 'מרוהטת', 'מעלית', 'חיות מחמד'];
  const acTypes = ['מזגן מרכזי', 'מזגן בכל החדרים', 'לא בכל החדרים', 'מזגן בסלון בלבד'];
  const incomes = ['שכיר/ה', 'עצמאי/ת', 'סטודנט/ית', 'קצבה', 'אחר'];

  Dira.data = { apartments, ownerApt, photoCredits, seekers, categories, cities, streets, types, conds, featureList, acTypes, incomes };
})(globalThis.Dira = globalThis.Dira || {});
