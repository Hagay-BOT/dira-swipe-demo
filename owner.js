/* הקישור של בעלי הדירות: #owner */
(function () {
  const A = window.App;
  const { D, esc, nis, fmtDate, g, el, ICON } = A;
  const apt = D.ownerApt;

  /* הכרעה 2: מתאים = טווח התשלום מכסה את שכר הדירה, והכניסה עד 30 יום מהתאריך שביקשת. הנפשות לא נספרות. */
  function fit(s) {
    const pay = s.payMax >= apt.rent;
    const date = Math.abs(A.days(s.entry, apt.entry)) <= 30;
    return { pay, date, ok: pay && date };
  }

  A.routes.owner = function () {
    const st = A.state;
    const dec = st.owner.decisions;
    const rows = D.seekers.map((s) => {
      const f = fit(s);
      const d = dec[s.id];
      const tag = d === 'ok' ? '<span class="fit-tag fit">אושר</span>'
        : d === 'no' ? '<span class="fit-tag unfit">נדחה</span>'
        : `<span class="fit-tag ${f.ok ? 'fit' : 'unfit'}">${f.ok ? 'מתאים' : 'לא מתאים'}</span>`;
      return `
        <button class="req ${d ? 'decided' : ''}" type="button" data-sid="${s.id}">
          <span class="req-name">${esc(s.first)}<small>הגיע${g(s.g, '', 'ה')} ב-${s.arrived}</small></span>
          ${tag}
          <span class="req-meta">
            <span class="${f.pay ? 'yes' : 'no'}">עד ${nis(s.payMax)}</span>
            <span class="${f.date ? 'yes' : 'no'}">כניסה ${fmtDate(s.entry)}</span>
            <span>${s.occupants} נפשות</span>
          </span>
        </button>`;
    }).join('');

    const waiting = D.seekers.filter((s) => !dec[s.id]).length;
    const scr = A.mount(el(`
      <section class="screen">
        <div class="top">
          <div class="brand">דירה בהחלקה <span class="pill-demo">צד בעל הדירה</span></div>
          <button class="chip" type="button" data-plan>מנוי · פיילוט</button>
        </div>
        <div class="scroll" style="flex:1">
          <div class="owner-apt">
            <div class="li-thumb"><div class="photo">${window.SCENES.photo(apt, 0)}</div></div>
            <div><b>${esc(apt.street)}, ${esc(apt.hood)}</b>
              <span>${A.roomsTxt(apt.rooms)} · ${nis(apt.rent)} · כניסה ${fmtDate(apt.entry)}</span></div>
          </div>
          <div class="sect-h"><h2>פניות · לפי סדר הגעה</h2><span>${waiting} ממתינות</span></div>
          <p class="rule">«מתאים» נקבע רק לפי שני דברים: אם טווח התשלום מכסה ${nis(apt.rent)}, ואם הכניסה עד 30 יום מ-${fmtDate(apt.entry)}. מספר הנפשות מוצג ולא נספר.</p>
          <div class="list" style="margin-top:12px">${rows}</div>
          <div style="padding:20px 16px 28px" class="btn-row">
            <a class="btn-ghost" href="#">לצד של מי שמחפש דירה</a>
            <p class="fine">כל המחפשים כאן לדוגמה.</p>
          </div>
        </div>
      </section>`));

    scr.querySelectorAll('.req').forEach((b) => { b.onclick = () => seekerSheet(b.dataset.sid); });
    scr.querySelector('[data-plan]').onclick = planSheet;

    if (!st.seenOwnerBanner) {
      st.seenOwnerBanner = true; A.save();
      setTimeout(() => A.banner(`${waiting} פניות חדשות מאז הבוקר`, 'מסודרות לפי סדר הגעה', null), 700);
    }
  };

  function seekerSheet(sid) {
    const s = D.seekers.find((x) => x.id === sid);
    const f = fit(s);
    const d = A.state.owner.decisions[sid];
    A.sheet(`
      <h3>${esc(s.first)}</h3>
      <p class="sub">מחפש${g(s.g, '', 'ת')} לדוגמה · הגיע${g(s.g, '', 'ה')} ב-${s.arrived}</p>
      <div class="anon">
        <div><b>${(s.payMin / 1000).toFixed(1)}–${(s.payMax / 1000).toFixed(1)}</b><span>אלפי ₪ בחודש</span></div>
        <div><b>${s.occupants}</b><span>נפשות</span></div>
        <div><b>${fmtDate(s.entry)}</b><span>כניסה</span></div>
      </div>
      <dl class="kv">
        <dt>תשלום</dt><dd>${f.pay ? 'מכסה' : 'לא מכסה'} את ${nis(apt.rent)}</dd>
        <dt>תאריך</dt><dd>${f.date ? 'עד 30 יום' : 'יותר מ-30 יום'} מ-${fmtDate(apt.entry)}</dd>
      </dl>
      <p class="hidden-list">נחשף רק אחרי שתאשר: שם משפחה · מקור הכנסה · הכנסות נוספות · קצת על ${g(s.g, 'עצמו', 'עצמה')}.</p>
      ${d ? `<p class="note">כבר ${d === 'ok' ? 'אישרת' : 'דחית'} את הפנייה הזאת.</p>` : `
      <div class="two-btn">
        <button class="btn-ghost" type="button" data-no>דחייה</button>
        <button class="btn-primary" type="button" data-ok>אישור</button>
      </div>`}
      ${d === 'ok' ? '<button class="btn-primary" type="button" data-open style="margin-top:10px">פתיחת השיחה</button>' : ''}
    `, (sh, close) => {
      const ok = sh.querySelector('[data-ok]');
      const no = sh.querySelector('[data-no]');
      const open = sh.querySelector('[data-open]');
      ok && (ok.onclick = () => {
        A.state.owner.decisions[sid] = 'ok';
        A.log('approve', { sid, fit: f.ok });
        close();
        A.go('ownerMatch', sid);
      });
      no && (no.onclick = () => {
        A.state.owner.decisions[sid] = 'no';
        A.log('reject', { sid, fit: f.ok });
        close();
        A.go('owner');
        A.toast('הפנייה נדחתה');
      });
      open && (open.onclick = () => { close(); openChat(s); });
    });
  }

  A.routes.ownerMatch = function (sid) {
    const s = D.seekers.find((x) => x.id === sid);
    const scr = A.mount(el(`
      <section class="screen match scroll">
        <div class="match-center">
          <span class="hello">✓ יש התאמה</span>
          <div class="match-art"><div class="photo">${window.SCENES.photo(apt, 0)}</div></div>
          <h2>${esc(s.first)} ${esc(s.last)} והדירה ב${esc(apt.street)}</h2>
          <p class="sub">עכשיו נחשפים הפרטים שלא ראית קודם</p>
        </div>
        <ul class="reveal">
          <li><b>שם מלא</b>${esc(s.first)} ${esc(s.last)}</li>
          <li><b>מקור הכנסה</b>${esc(s.income)}</li>
          <li><b>הכנסה נוספת</b>${esc(s.extra)}</li>
          <li><b>נפשות</b>${s.occupants}</li>
          <li><b>כניסה</b>${fmtDate(s.entry, true)}</li>
          <li><b>${g(s.g, 'עליו', 'עליה')}</b>${esc(s.about)}</li>
        </ul>
        <div class="btn-row">
          <button class="btn-primary" type="button" data-chat>פתיחת השיחה</button>
          <button class="btn-ghost" type="button" data-back>חזרה לפניות</button>
        </div>
      </section>`));
    A.log('match', { sid, side: 'owner' });
    scr.querySelector('[data-chat]').onclick = () => openChat(s);
    scr.querySelector('[data-back]').onclick = () => A.go('owner');
  };

  function openChat(s) {
    A.chat({
      key: 'o-' + s.id,
      title: s.first + ' ' + s.last,
      subtitle: 'על הדירה ב' + apt.street,
      initials: s.first[0] + s.last[0],
      prefill: `היי ${s.first}, אישרתי את הפנייה. מתי נוח לך לבוא לראות את הדירה?`,
      replies: ['היי, תודה שאישרת! מחר אחרי חמש מתאים?', 'מעולה, נתראה מחר.', 'תודה 🙂'],
      onBack: () => A.go('owner'),
      after: '<a class="btn-ghost" href="#">לצד של מי שמחפש דירה</a>'
    });
  }

  function planSheet() {
    A.sheet(`
      <h3>מנוי לבעלי דירות ומתווכים</h3>
      <p class="sub">תשלום חודשי. בפיילוט אין תשלום, והמחיר ייקבע אחריו.</p>
      <dl class="kv">
        <dt>עכשיו</dt><dd>פיילוט · ללא תשלום</dd>
        <dt>פרסום</dt><dd>הדירה נשארת בערימה, בלי להקפיץ מודעה</dd>
        <dt>פניות</dt><dd>מסומנות לפי תשלום ותאריך כניסה</dd>
        <dt>שיחות</dt><dd>רק עם מי שאישרת</dd>
      </dl>
      <button class="btn-primary" type="button" data-close>הבנתי</button>
    `, (sh, close) => { sh.querySelector('[data-close]').onclick = close; });
  }
})();
