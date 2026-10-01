# קוד המקור של «דירה בהחלקה» v3

HTML+JS נקי, בלי npm ובלי תלויות. `index.html` טוען את `css/` ו-`js/` כקבצים נפרדים לפיתוח.

- בדיקות: `node tests/run.js` (יציאה 0 = הכול עבר)
- בנייה לקובץ אחד: מעתיקים לכאן את `photos/` ואת `og.png` משורש הריפו, ומריצים `python build.py`.
  התוצרים ב-`dist/`: `index.html` ל-/v3/, `root/index.html` לקישור הראשי, `artifact.html` ל-Artifact.
- כל הנתונים לדוגמה ב-`js/data.js`, כל הטקסט ב-`js/strings.js`, כל המספרים ב-`js/config.js`.
- התמונות מ-Unsplash ברישיון Unsplash. הצלמים: `photos/CREDITS.tsv` ו-`photoCredits` ב-`js/data.js`.
