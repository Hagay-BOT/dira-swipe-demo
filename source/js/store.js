/*
 * מצב הדמו. כל שינוי עובר דרך setState, שמעדכן, שומר ומודיע למי שנרשם לנושא.
 * בלי DOM, כדי שאפשר יהיה לבדוק ב-node.
 */
(function (Dira) {
  'use strict';

  function fresh(schema) {
    return {
      schema,
      saved: {},                 // id ⟵ { star, t } · «אהבתי»
      swiped: {},                // id ⟵ 'L' | 'R' | 'U'
      pen: {},                   // מה ✕ לימד, לסידור הערימה
      tune: { n: 0, f: {}, h: {}, rooms: 0, rent: 0 },   // מה הכוכבים לימדו
      filter: null,              // הסינון הפעיל
      requests: [],              // { id, due, status: 'wait' | 'match', seen }
      chats: {},                 // key ⟵ [{ who, text }]
      profile: null,             // פרטי המחפש, נמסרים רק אחרי התאמה
      added: [],                 // דירות שפורסמו בדמו
      owner: { decisions: {} },  // sid ⟵ 'ok' | 'no'
      aiChat: [],
      log: [],
      flags: { hint: false, ownerBanner: false }
    };
  }

  /*
   * storage: אובייקט עם getItem/setItem (localStorage בדפדפן, מדומה בבדיקות).
   * גרסה ישנה או שבורה נמחקת ומתחילה מחדש. לא ממזגים.
   */
  function createStore(opts) {
    const cfg = opts.config;
    const storage = opts.storage;
    const subs = {};
    let state = load();

    function load() {
      try {
        const raw = storage && storage.getItem(cfg.storageKey);
        const obj = raw ? JSON.parse(raw) : null;
        if (obj && obj.schema === cfg.schema) return Object.assign(fresh(cfg.schema), obj);
      } catch (e) { /* שמירה שבורה: מתחילים מחדש */ }
      return fresh(cfg.schema);
    }

    function save() {
      try { storage && storage.setItem(cfg.storageKey, JSON.stringify(state)); } catch (e) { /* גלישה פרטית: הדמו עובד בלי שמירה */ }
    }

    function emit(topics) {
      topics.concat('*').forEach((t) => (subs[t] || []).slice().forEach((fn) => fn(state, topics)));
    }

    /* topic: שם אחד או מערך. mutate מקבל את המצב ומשנה אותו במקום */
    function setState(topic, mutate) {
      const topics = [].concat(topic);
      const out = mutate(state);
      save();
      emit(topics);
      return out;
    }

    function subscribe(topic, fn) {
      (subs[topic] = subs[topic] || []).push(fn);
      return () => { subs[topic] = subs[topic].filter((x) => x !== fn); };
    }

    function reset() {
      state = fresh(cfg.schema);
      save();
      emit(['reset']);
    }

    return { get: () => state, setState, subscribe, reset };
  }

  Dira.createStore = createStore;
})(globalThis.Dira = globalThis.Dira || {});
