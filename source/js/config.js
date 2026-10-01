/* כל המספרים והספים של הדמו, בשם. שום מספר קסם לא יושב בקוד. */
(function (Dira) {
  'use strict';

  Dira.config = {
    storageKey: 'dira-v3',
    schema: 3,

    /* החלקה */
    swipeMs: 300,               // משך מעוף הכרטיס. עובר ל-CSS דרך --swipe-ms
    snapMs: 200,                // חזרת כרטיס למקום
    swipeRatio: 0.26,           // חלק מרוחב הכרטיס שמעבר לו ההחלקה נחשבת
    starRatio: 0.22,            // חלק מגובה הכרטיס שמעבר לו החלקה למעלה נחשבת
    starMaxDx: 60,              // סטייה אופקית מרבית בהחלקה למעלה
    tapSlop: 8,                 // תזוזה שעדיין נחשבת הקשה
    stampFullDx: 90,            // בכמה פיקסלים החותמת נראית במלואה
    stampFullDy: 110,
    tiltDivisor: 20,            // כמה הכרטיס נוטה בזמן גרירה
    dragYFactor: 0.4,           // כמה מהתזוזה האנכית עוברת לכרטיס
    flyOutFactor: 1.6,          // כמה רחוק הכרטיס עף, ביחס לרוחבו
    flyTiltDeg: 24,

    /* למידה ודמיון */
    expensiveFrom: 5600,        // מעל זה, ✕ מלמד «פחות דירות במחיר הזה»
    penaltyWeight: 1.2,
    similarityWeight: 1.4,
    hoodWeight: 1.5,
    roomsWeight: 1.5,
    rentWeight: 1.5,
    rentScale: 900,             // הפרש מחיר שמוחק את כל משקל המחיר
    similarTagMin: 3,           // מעל זה הכרטיס מסומן «דומה למה שסימנת»
    forYouMin: 2,               // «מותאם לך» מציג דירות מעל הסף הזה
    mineFirst: -100,            // דירה שפרסמת עולה ראשונה

    /* התאמה, הכרעה 11 */
    entryWindowDays: 30,

    /* סינון חכם */
    priceFloor: 3000,
    priceCeil: 8000,            // ערך המחוון העליון = ללא הגבלה
    priceStep: 100,
    sqmCeil: 120,
    sqmStep: 5,
    widenRound: 100,            // הרחבת מחיר מתעגלת למאה הקרובה

    /* זמנים מדומים */
    approveDelayMs: 3000,       // בעל הדירה מאשר פנייה של מחפש
    typingDelayMs: 500,
    replyDelayMs: 1900,
    aiReplyMs: 900,
    autowriteMs: 800,
    toastMs: 2400,
    toastLongMs: 3200,
    bannerMs: 6500,
    bannerSlideMs: 350,         // זמן יציאת הבאנר, תואם ל-transition שלו ב-CSS
    hintDelayMs: 600,
    ownerBannerDelayMs: 700,

    /* שונות */
    quickExitMs: 10000,         // «יציאה תוך 10 שניות»
    logMax: 800,
    logRowsShown: 40,
    aiResultsShown: 5,
    photosMax: 10,
    pals: ['sea', 'sand', 'pine', 'rose', 'slate', 'bauhaus'],
    publishedScenes: ['living', 'kitchen', 'bedroom']
  };
})(globalThis.Dira = globalThis.Dira || {});
