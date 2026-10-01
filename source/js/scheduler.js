/*
 * אישורים מדומים של בעלי דירות. מתזמן אחד שרץ מטעינת הדף, לא תלוי במסך.
 * זמן היעד נשמר בפנייה עצמה (due), ולכן פנייה ששרדה רענון עדיין מאושרת.
 * הזמן והטיימרים מוזרקים, כדי שאפשר יהיה לבדוק ב-node.
 */
(function (Dira) {
  'use strict';

  function createScheduler(opts) {
    const store = opts.store;
    const now = opts.now || (() => Date.now());
    const setTimer = opts.setTimer || ((fn, ms) => setTimeout(fn, ms));
    const onApprove = opts.onApprove || (() => {});
    const timers = {};

    function approve(id) {
      delete timers[id];
      const req = store.get().requests.find((r) => r.id === id);
      if (!req || req.status !== 'wait') return;
      store.setState(['requests', 'log'], (s) => {
        const r = s.requests.find((x) => x.id === id);
        r.status = 'match';
        Dira.log.push(s, { type: 'match', id, side: 'seeker' }, now());
      });
      onApprove(id);
    }

    function watch(req) {
      if (req.status !== 'wait' || timers[req.id]) return;
      timers[req.id] = setTimer(() => approve(req.id), Math.max(0, req.due - now()));
    }

    /* בטעינה: כל פנייה שממתינה, כולל כאלה שנשלחו לפני רענון */
    function start() { store.get().requests.forEach(watch); }

    return { start, watch };
  }

  Dira.createScheduler = createScheduler;
})(globalThis.Dira = globalThis.Dira || {});
