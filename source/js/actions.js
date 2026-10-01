/*
 * פעולה אחת לכל דבר. כל מסך שרוצה לשמור, לשלוח פנייה או לסנן, קורא לכאן.
 * כל שינוי מצב עובר דרך store.setState, וכל אירוע נרשם ביומן באותה קריאה.
 */
(function (Dira) {
  'use strict';

  function createActions(ctx) {
    const { store, cfg, S, ui, match: M, data } = ctx;
    const now = () => Date.now();
    const log = (s, e) => Dira.log.push(s, e, now());
    const matchCtx = () => ({ categories: data.categories, tune: store.get().tune, cfg });

    /* החלקה: ✕ = 'L', ♥ = 'R', ★ = 'U' */
    function swipe(a, dir, ms) {
      const reason = store.setState(['deck', 'saved', 'log'], (s) => {
        s.swiped[a.id] = dir;
        log(s, { type: 'swipe', id: a.id, dir, ms: Math.round(ms || 0) });
        if (dir === 'L') { const r = M.learnNope(s.pen, a, cfg); s.pen = r.pen; return r.reason; }
        const had = s.saved[a.id];
        s.saved[a.id] = { star: dir === 'U' || !!(had && had.star), t: now() };
        if (dir === 'U' && !(had && had.star)) s.tune = M.learnStar(s.tune, a);
        return null;
      });
      if (dir === 'L') ui.toast(S.deck.learned(reason));
      else ui.toast(dir === 'U' ? S.deck.starred : S.deck.saved, 'ok');
    }

    /* שמירה או כוכב מחוץ לערימה (פרטים, עוזר). לא מוציאה את הדירה מהערימה */
    function save(a, star) {
      const st = store.get().saved[a.id];
      if (st && (st.star || !star)) return ui.toast(star ? S.deck.starred : S.deck.saved, 'ok');
      store.setState(['saved', 'deck'], (s) => {
        s.saved[a.id] = { star: !!star, t: now() };
        if (star) s.tune = M.learnStar(s.tune, a);
      });
      ui.toast(star ? S.deck.starred : S.deck.saved, 'ok');
    }

    function unsave(id) {
      if (store.get().requests.some((r) => r.id === id)) return ui.toast(S.favs.locked);
      store.setState('saved', (s) => { delete s.saved[id]; });
      ui.toast(S.favs.removed);
    }

    /* הכרעה 8: הפנייה יוצאת רק מתוך פרטי הדירה */
    function sendRequest(a) {
      if (store.get().requests.some((r) => r.id === a.id)) return ui.toast(S.details.alreadySent);
      const req = store.setState(['requests', 'saved', 'log'], (s) => {
        const r = { id: a.id, due: now() + cfg.approveDelayMs, status: 'wait', seen: false };
        s.requests.push(r);
        if (!s.saved[a.id]) s.saved[a.id] = { star: false, t: now() };
        log(s, { type: 'request', id: a.id });
        return r;
      });
      ctx.scheduler.watch(req);
      ui.toast(S.details.sent(a), null, cfg.toastLongMs);
    }

    function markSeen(id) {
      const r = store.get().requests.find((x) => x.id === id);
      if (r && !r.seen) store.setState('requests', (s) => { s.requests.find((x) => x.id === id).seen = true; });
    }

    /* מחיל סינון ועובר לערימה. סינון ריק = בלי סינון */
    function applyFilter(f, msg) {
      const next = M.isEmptyFilter(f) ? null : f;
      store.setState(['filter', 'log'], (s) => { s.filter = next; log(s, { type: 'filter', on: !!next }); });
      if (ctx.router.current.route !== '/deck') ctx.router.go('/deck');
      if (msg) ui.toast(msg);
    }

    function countFor(f) {
      return ctx.allApts().filter((a) => M.passes(a, f, matchCtx())).length;
    }

    function logCategory(id) { store.setState('log', (s) => log(s, { type: 'category', id })); }

    /* מחזיר לערימה את מה שדולג, ומוחק את מה ש-✕ לימד */
    function resetSkipped() {
      store.setState('deck', (s) => {
        Object.keys(s.swiped).forEach((id) => { if (s.swiped[id] === 'L') delete s.swiped[id]; });
        s.pen = {};
      });
      ui.toast(S.deck.againDone);
    }

    /* ——— צד בעל הדירה ——— */
    function decide(sid, ok) {
      const s0 = data.seekers.find((x) => x.id === sid);
      const f = M.fit(s0, data.ownerApt, cfg);
      store.setState(['owner', 'log'], (s) => {
        s.owner.decisions[sid] = ok ? 'ok' : 'no';
        log(s, { type: ok ? 'approve' : 'reject', sid, fit: f.ok });
      });
    }

    function seenOwnerBanner() { store.setState('flags', (s) => { s.flags.ownerBanner = true; }); }
    function seenHint() { store.setState('flags', (s) => { s.flags.hint = true; }); }

    /* ——— פרטים, שיחה, עוזר ——— */
    function saveProfile(p) {
      store.setState(['profile', 'log'], (s) => { s.profile = p; log(s, { type: 'profile' }); });
    }

    function chatPush(key, msg, side) {
      store.setState(['chats', 'log'], (s) => {
        (s.chats[key] = s.chats[key] || []).push(msg);
        if (msg.who === 'me') log(s, { type: 'chat', side });
      });
    }

    function aiPush(msg) {
      store.setState(msg.who === 'me' ? ['ai', 'log'] : 'ai', (s) => {
        s.aiChat.push(msg);
        if (msg.who === 'me') log(s, { type: 'ai', len: msg.text.length });
      });
    }

    /* ——— פרסום ——— */
    function publish(apt, photos, hasVideo) {
      ctx.media[apt.id] = photos.slice();
      store.setState(['deck', 'filter', 'log'], (s) => {
        s.added.unshift(apt);
        s.filter = null;
        log(s, { type: 'publish', photos: photos.length, video: !!hasVideo });
      });
      ctx.router.go('/deck', { replace: true });
      ui.toast(S.publish.published, 'ok', cfg.toastLongMs);
    }

    return { swipe, save, unsave, sendRequest, markSeen, applyFilter, countFor, logCategory, resetSkipped, decide, seenOwnerBanner, seenHint, saveProfile, chatPush, aiPush, publish };
  }

  Dira.createActions = createActions;
})(globalThis.Dira = globalThis.Dira || {});
