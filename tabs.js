/* לשוניות: אהבתי, קטגוריות, עוזר AI · ומסכי ההתאמה, הפרטים והשיחה */
(function () {
  const A = window.App;
  const { D, esc, nis, g, el } = A;
  const S = window.SCENES;
  const I = A.ICON;

  const page = (title, body, tab, extra) => `
    <section class="screen">
      <div class="page-top">${title}${extra || ''}</div>
      ${body}
      ${A.tabbar(tab)}
    </section>`;

  /* ——— אהבתי ——— */
  A.routes.favs = function () {
    const st = A.state;
    const ids = Object.keys(st.saved).filter((id) => A.byId(id)).sort((x, y) => st.saved[y].t - st.saved[x].t);
    const rows = ids.map((id) => {
      const a = A.byId(id), s = st.saved[id], r = st.likes.find((l) => l.id === id);
      const pill = r ? (r.status === 'match' ? '<span class="state ok">יש התאמה</span>' : '<span class="state wait">ממתין לאישור</span>')
        : (s.star ? '<span class="state star">★ כוכב</span>' : '');
      return `
        <div class="fav" data-id="${id}" role="button" tabindex="0">
          <div class="thumb"><div class="photo">${S.photo(a, 0)}</div></div>
          <div class="main"><b>${esc(a.title)}</b><span class="p">${nis(a.rent)}</span><small>${esc(A.place(a))}</small></div>
          <div class="side">${pill}<button class="icon-btn" type="button" data-unsave aria-label="הסרה מאהבתי">${I.heart}</button></div>
        </div>`;
    }).join('');
    const body = ids.length
      ? `<div class="scroll grow"><div class="fav-list">${rows}</div>
           <p class="fine" style="padding:0 20px 16px">פנייה לבעל הדירה נשלחת מתוך פרטי הדירה.<br><a class="linkish" href="#owner">איך זה נראה אצל בעל הדירה</a></p></div>`
      : `<div class="empty"><div class="big">${I.heart}</div><h2>עוד לא שמרת דירות</h2><p>החלקה ימינה או ♥ שומרת דירה כאן.</p>
           <div class="btn-row"><button class="btn-primary" type="button" data-go>לדירות</button></div></div>`;
    const scr = A.mount(el(page('דירות שאהבתי', body, 'favs')));
    A.bindTabbar(scr);
    const go = scr.querySelector('[data-go]');
    if (go) go.onclick = () => A.go('deck');
    scr.querySelectorAll('.fav').forEach((row) => {
      const id = row.dataset.id;
      const open = () => {
        const a = A.byId(id), r = st.likes.find((l) => l.id === id);
        if (r && r.status === 'match') return st.chats['a-' + id] ? openChat(a) : A.go('match', id);
        A.details(a, { fromDeck: false });
      };
      row.onclick = (e) => { if (!e.target.closest('[data-unsave]')) open(); };
      row.onkeydown = (e) => { if (e.key === 'Enter') open(); };
      row.querySelector('[data-unsave]').onclick = () => {
        if (st.likes.find((l) => l.id === id)) return A.toast('יש פנייה פתוחה על הדירה הזאת');
        delete st.saved[id]; A.save(); A.routes.favs(); A.toast('הוסר מ«אהבתי»');
      };
    });
  };

  /* ——— קטגוריות ——— */
  A.routes.categories = function () {
    const all = A.apts();
    const tiles = D.categories.map((c) => {
      const list = c.test ? all.filter(c.test) : all.slice().sort((x, y) => A.similarity(y) - A.similarity(x));
      const pic = list[0] || all[0];
      const small = c.test ? `${list.length} דירות` : (A.state.tune.n ? 'לפי הכוכבים שסימנת' : 'סמנו כוכבים והיא תלמד');
      return `<button class="cat" type="button" data-cat="${c.id}"><div class="photo">${S.photo(pic, 0)}</div>
        <span class="badge2" aria-hidden="true">${c.badge}</span><span class="label">${esc(c.label)}<small>${small}</small></span></button>`;
    }).join('');
    const scr = A.mount(el(page('חיפוש לפי קטגוריות', `<div class="scroll grow"><div class="cat-grid">${tiles}</div></div>`, 'categories')));
    A.bindTabbar(scr);
    scr.querySelectorAll('[data-cat]').forEach((b) => {
      b.onclick = () => {
        const c = D.categories.find((x) => x.id === b.dataset.cat);
        if (!c.test) {
          A.log('category', { id: c.id });
          return A.applyFilter({ label: 'מותאם לך' }, A.state.tune.n ? 'הערימה מסודרת לפי הכוכבים שסימנת' : 'עוד אין כוכבים · סמנו כוכב על דירות שאהבתם במיוחד');
        }
        const n = all.filter(c.test).length;
        A.log('category', { id: c.id });
        A.applyFilter({ cats: [c.id] }, `${n} דירות · ${c.label}`);
      };
    });
  };

  /* ——— עוזר AI · מדומה: מחפש לפי המילים בבקשה ——— */
  const FEAT = [[/מרפסת/, 'מרפסת'], [/חני/, 'חניה'], [/ממ["״']?ד/, 'ממ"ד'], [/מעלית/, 'מעלית'], [/מזגן|מיזוג|ממוזג/, 'מזגנים'],
    [/חיות|כלב|חתול/, 'חיות מחמד'], [/מרוהט|ריהוט/, 'מרוהטת'], [/נוף|לים|הים/, 'נוף לים'], [/גינה|חצר|דירת גן/, 'גינה'], [/מחסן/, 'מחסן']];
  const PLACES = ['נווה שאנן', 'רמת אלמוגי', 'כרמל', 'הדר', 'אחוזה', 'קריית ביאליק', 'קריית מוצקין', 'קריית אתא', 'הקריות', 'חיפה'];

  function parse(t) {
    const f = {}, found = [];
    const rm = t.match(/(\d(?:\.\d)?)\s*\+?\s*(?:חדרים|חדר|חד׳|חד')/);
    if (rm) { f.rooms = Number(rm[1]); found.push(f.rooms + ' חדרים ומעלה'); }
    const pm = t.match(/עד\s*([\d.,]+)\s*(אלף)?/);
    if (pm) { let v = Number(pm[1].replace(/,/g, '')); if (pm[2] || v < 100) v *= 1000; f.max = v; found.push('עד ' + nis(v)); }
    f.feats = FEAT.filter(([re]) => re.test(t)).map(([, v]) => v);
    f.feats.forEach((x) => found.push(x));
    f.places = PLACES.filter((p) => t.includes(p));
    if (f.places.includes('חיפה') && f.places.length > 1) f.places = f.places.filter((p) => p !== 'חיפה');
    f.places.forEach((p) => found.push(p));
    return { f, found };
  }

  function search(t) {
    const { f, found } = parse(t);
    if (!found.length) return { text: 'לא הבנתי מה לחפש. אפשר לכתוב מספר חדרים, מחיר, אזור, או משהו שחשוב לך, כמו מרפסת או חניה.' };
    const all = A.apts();
    let q = JSON.parse(JSON.stringify(f));
    let res = all.filter((a) => A.passes(a, q));
    const dropped = [];
    while (!res.length && (q.feats.length || q.places.length || q.rooms || q.max)) {
      if (q.feats.length) dropped.push(q.feats.pop());
      else if (q.places.length) dropped.push(q.places.pop());
      else if (q.rooms) { dropped.push(q.rooms + ' חדרים'); delete q.rooms; }
      else { dropped.push('המחיר'); delete q.max; }
      res = all.filter((a) => A.passes(a, q));
    }
    const text = dropped.length
      ? `לא מצאתי דירה עם הכול יחד. הנה ${res.length} הכי קרובות, בלי: ${dropped.join(', ')}.`
      : `מצאתי ${res.length} ${res.length === 1 ? 'דירה' : 'דירות'} · ${found.join(' · ')}`;
    return { text, ids: res.slice(0, 5).map((a) => a.id), filter: Object.assign(q, { label: 'לפי העוזר' }), total: res.length };
  }

  A.routes.ai = function () {
    const st = A.state;
    const scr = A.mount(el(`
      <section class="screen">
        <div class="page-top">עוזר AI אישי</div>
        <div class="msgs"></div>
        <form class="composer"><input type="text" aria-label="מה חשוב לך בדירה" placeholder="הקלידו את הבקשה שלכם כאן..." autocomplete="off" enterkeyhint="send">
          <button type="submit" aria-label="שליחה">${I.send}</button></form>
        ${A.tabbar('ai')}
      </section>`));
    A.bindTabbar(scr);
    const list = scr.querySelector('.msgs'), input = scr.querySelector('input');
    const scrollDown = () => { list.scrollTop = list.scrollHeight; };

    const addMsg = (m) => {
      list.append(el(`<div class="msg ${m.who === 'me' ? 'me' : 'bot'}">${esc(m.text)}</div>`));
      if (m.ids && m.ids.length) {
        const box = el(`<div class="ai-results"><div class="head">${I.spark} תוצאות שנמצאו עבורך</div></div>`);
        m.ids.forEach((id) => {
          const a = A.byId(id);
          if (!a) return;
          const card = el(`<div class="ai-card"><div class="pic"><div class="photo">${S.photo(a, 0)}</div></div><div class="body">
            <b>${esc(a.title)}</b><div class="meta"><span>${esc(A.place(a))}</span><span class="p">${nis(a.rent)}</span></div>
            <div class="two-btn"><button class="btn-ghost" type="button" data-d>פרטים</button><button class="btn-primary" type="button" data-s>${I.heart} שמירה</button></div></div></div>`);
          card.querySelector('[data-d]').onclick = () => A.details(a, { fromDeck: false });
          card.querySelector('[data-s]').onclick = () => { st.saved[a.id] = st.saved[a.id] || { star: false, t: Date.now() }; A.save(); A.toast('נשמר ב«אהבתי»', 2200, 'ok'); };
          box.append(card);
        });
        if (m.total > 0) {
          const all = el(`<button class="btn-primary" type="button">הצגת ${m.total} התוצאות בערימה</button>`);
          all.onclick = () => A.applyFilter(m.filter, 'נוצר מסנן מותאם אישית לבקשה שלך');
          box.append(all);
        }
        list.append(box);
      }
      scrollDown();
    };

    addMsg({ who: 'bot', text: 'שלום! אני העוזר האישי שלך למציאת דירה. מה חשוב לך בדירה הבאה? למשל: 3 חדרים בכרמל עם מרפסת, עד 5,500 ₪.' });
    list.append(el('<div class="msg sys">בדמו העוזר מחפש לפי המילים שכתבת, בלי AI אמיתי</div>'));
    if (!st.aiChat.length) {
      const sug = el(`<div class="chips" style="padding:0">${['3 חדרים עם מרפסת', 'עד 4,500 בחיפה', 'דירה עם חניה בקריות'].map((s) => `<button class="chip" type="button">${s}</button>`).join('')}</div>`);
      sug.querySelectorAll('.chip').forEach((b) => { b.onclick = () => { input.value = b.textContent; scr.querySelector('form').requestSubmit(); sug.remove(); }; });
      list.append(sug);
    }
    st.aiChat.forEach(addMsg);

    scr.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      const me = { who: 'me', text };
      st.aiChat.push(me); addMsg(me);
      const dots = el('<div class="typing" aria-label="העוזר כותב"><i></i><i></i><i></i></div>');
      list.append(dots); scrollDown();
      A.log('ai', { q: text.length });
      setTimeout(() => {
        dots.remove();
        const r = search(text);
        const bot = Object.assign({ who: 'bot' }, r);
        st.aiChat.push(bot); A.save(); addMsg(bot);
      }, 900);
    };
  };

  /* ——— התאמה ——— */
  A.routes.match = function (id) {
    const a = A.byId(id);
    if (!a) return A.go('favs');
    const l = A.state.likes.find((x) => x.id === id);
    if (l) { l.seen = true; A.save(); }
    const scr = A.mount(el(`
      <section class="screen match scroll">
        <div class="match-center">
          <span class="hello">${I.check} יש התאמה</span>
          <div class="match-art"><div class="photo">${S.photo(a, 0)}</div></div>
          <h2>${esc(a.by.name)} ${g(a.by.g, 'אישר', 'אישרה')} את הפנייה שלך</h2>
          <p class="sub">${esc(a.title)} · ${nis(a.rent)}</p>
        </div>
        <ul class="reveal">
          <li><b>נחשף לך</b>הכתובת המלאה, ${esc(a.street)} ${esc(a.houseNo)}, והטלפון בשיחה</li>
          <li><b>נחשף ל${esc(a.by.name)}</b>מקור הכנסה · הכנסות נוספות · נפשות · קצת עליך</li>
        </ul>
        <div class="btn-row">
          <button class="btn-primary" type="button" data-go>${A.state.profile ? 'פתיחת השיחה' : 'השלמת פרטים ופתיחת השיחה'}</button>
          <button class="btn-ghost" type="button" data-back>חזרה לאהבתי</button>
        </div>
      </section>`));
    scr.querySelector('[data-go]').onclick = () => (A.state.profile ? openChat(a) : A.go('profile', id));
    scr.querySelector('[data-back]').onclick = () => A.go('favs');
  };

  /* ——— פרטים · רק אחרי התאמה ——— */
  A.routes.profile = function (id) {
    const a = A.byId(id);
    const pr = A.state.profile || {};
    const scr = A.mount(el(`
      <section class="screen scroll">
        <div class="page-top"><button class="icon-btn" type="button" data-back aria-label="חזרה">${I.back}</button>הפרטים שלך</div>
        <form class="form" novalidate>
          <p class="sub">${esc(a.by.name)} ${g(a.by.g, 'יראה', 'תראה')} אותם עכשיו, כי יש ביניכם התאמה. אף אחד אחר לא רואה אותם.</p>
          <button class="linkish" type="button" data-fill style="justify-self:start">מילוי פרטים לדוגמה</button>
          <div class="field"><label for="f-name">שם מלא</label><input id="f-name" name="name" autocomplete="name" value="${esc(pr.name || '')}"></div>
          <div class="field"><label for="f-about">קצת עליך</label><textarea id="f-about" name="about" placeholder="מי גר בדירה, עבודה מהבית, חיות">${esc(pr.about || '')}</textarea></div>
          <div class="row2">
            <div class="field"><label for="f-income">מקור הכנסה</label><select id="f-income" name="income">${['שכיר/ה', 'עצמאי/ת', 'סטודנט/ית', 'קצבה', 'אחר'].map((o) => `<option ${pr.income === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
            <div class="field"><label for="f-job">מקום עבודה</label><input id="f-job" name="job" value="${esc(pr.job || '')}"></div>
          </div>
          <div class="row2">
            <div class="field"><label for="f-max">תשלום עד</label><input id="f-max" name="payMax" inputmode="numeric" value="${esc(pr.payMax || a.rent)}"></div>
            <div class="field"><label for="f-occ">נפשות</label><input id="f-occ" name="occupants" inputmode="numeric" value="${esc(pr.occupants || '')}"></div>
          </div>
          <div class="field"><label for="f-extra">הכנסה נוספת</label><input id="f-extra" name="extra" value="${esc(pr.extra || '')}"></div>
          <button class="btn-primary" type="submit">שמירה ופתיחת השיחה</button>
        </form>
      </section>`));
    const f = scr.querySelector('form');
    scr.querySelector('[data-back]').onclick = () => A.go('match', id);
    scr.querySelector('[data-fill]').onclick = () => {
      const ex = { name: 'דנה לוי', about: 'גרה לבד עם חתולה, עובדת מהבית פעמיים בשבוע.', income: 'שכיר/ה', job: 'בית חולים', payMax: a.rent, occupants: 1, extra: 'אין' };
      Object.keys(ex).forEach((k) => { if (f.elements[k]) f.elements[k].value = ex[k]; });
    };
    f.onsubmit = (e) => {
      e.preventDefault();
      if (!f.elements.name.value.trim()) { A.toast('חסר שם מלא · אפשר גם «מילוי פרטים לדוגמה»'); f.elements.name.focus(); return; }
      const data = {};
      ['name', 'about', 'income', 'job', 'payMax', 'occupants', 'extra'].forEach((k) => { data[k] = f.elements[k].value.trim(); });
      A.state.profile = data; A.save(); A.log('profile', {});
      openChat(a);
    };
  };

  function openChat(a) {
    A.chat({
      key: 'a-' + a.id,
      title: `${a.by.name} · ${a.by.role}`,
      subtitle: `${a.street} ${a.houseNo}${a.hood ? ', ' + a.hood : ''}`,
      initials: a.by.name[0],
      prefill: `היי ${a.by.name}, ראיתי את הדירה ב${a.street}. אשמח לתאם ביקור 🙂`,
      replies: [`היי! ${g(a.by.g, 'שמח', 'שמחה')} שיש התאמה. אפשר לבוא מחר בשש. הטלפון שלי 050-0000000 (מספר לדוגמה)`, 'מעולה, נתראה מחר.', '🙂'],
      onBack: () => A.go('favs'),
      after: `<a class="btn-ghost" href="#owner">איך זה נראה אצל בעל הדירה</a><button class="btn-primary" type="button" data-pub>${I.addHome} יש לך דירה? פרסום דירה</button>`,
      afterMount: (node) => { node.querySelector('[data-pub]').onclick = () => A.go('publish'); }
    });
  }
  A.openAptChat = openChat;
})();
