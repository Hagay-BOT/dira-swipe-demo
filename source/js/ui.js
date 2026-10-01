/*
 * רכיבי ממשק משותפים: סינון HTML, אייקונים, טוסט, באנר, גיליון נגיש, כפתור חזרה.
 * הטוסט הוא אזור ה-aria-live היחיד בדמו.
 */
(function (Dira) {
  'use strict';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  const svg = (body, o) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" ${o || 'fill="currentColor"'}>${body}</svg>`;
  const stroke = (w) => `fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const I = {
    heart: svg('<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 4.4 2.5.8-1.4 2.4-2.5 4.5-2.5 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/>'),
    x: svg('<path d="M6 6l12 12M18 6L6 18"/>', stroke(2.8)),
    star: svg('<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/>'),
    back: svg('<path d="M9 5l7 7-7 7"/>', stroke(2.4)),
    send: svg('<path d="M21 20L3 12l18-8v6L9 12l12 2z"/>'),
    home: svg('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>', stroke(2)),
    grid: svg('<circle cx="7" cy="7" r="3.2"/><circle cx="17" cy="7" r="3.2"/><circle cx="7" cy="17" r="3.2"/><path d="M17 13.5l3.5 6h-7z"/>'),
    spark: svg('<path d="M11 2l1.9 5.6L18.5 9.5l-5.6 1.9L11 17l-1.9-5.6L3.5 9.5l5.6-1.9z"/><path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z"/>'),
    sliders: svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>', stroke(2)),
    addHome: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h6M19 13v-3"/><path d="M17 16v6M14 19h6"/>', stroke(2)),
    pin: svg('<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>'),
    bed: svg('<path d="M3 18V7M3 13h18v5M21 18v-3a3 3 0 0 0-3-3h-7v1"/><circle cx="7" cy="10.5" r="1.6"/>', stroke(2)),
    bath: svg('<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 4 0"/>', stroke(2)),
    ruler: svg('<path d="M4 20V4l16 16z"/><path d="M8 16h3v-3"/>', stroke(2)),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', stroke(2.2)),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', stroke(3))
  };

  /* ——— שכבות קבועות ——— */
  let toastEl, bannerEl, toastTimer, bannerTimer, cfg, S;

  function init(opts) {
    cfg = opts.cfg; S = opts.S;
    toastEl = opts.toast; bannerEl = opts.banner;
  }

  function toast(text, kind, ms) {
    toastEl.textContent = text;
    toastEl.className = 'toast' + (kind ? ' ' + kind : '');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms || cfg.toastMs);
  }

  /* התראה עליונה. הטקסט נקרא גם לקורא מסך דרך הטוסט, שהוא אזור ה-live היחיד */
  function banner(title, text, onTap) {
    bannerEl.innerHTML = `<span class="banner-sign" aria-hidden="true">${I.check}</span><span class="banner-text"><b>${esc(title)}</b><span>${esc(text)}</span></span>`;
    bannerEl.onclick = () => { hideBanner(); onTap && onTap(); };
    bannerEl.hidden = false;
    void bannerEl.offsetWidth;
    bannerEl.classList.add('show');
    toastEl.textContent = '';
    toastEl.className = 'toast sr-only';
    toastEl.textContent = title;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(hideBanner, cfg.bannerMs);
  }
  function hideBanner() {
    bannerEl.classList.remove('show');
    setTimeout(() => { if (!bannerEl.classList.contains('show')) bannerEl.hidden = true; }, cfg.bannerSlideMs);
  }

  /* ——— גיליון: לכידת פוקוס, Escape, aria-labelledby, והחזרת הפוקוס למי שפתח ——— */
  let openSheetEl = null;

  function focusables(root) {
    return Array.from(root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((x) => !x.hidden && x.offsetParent !== null);
  }

  /*
   * opts: { html, labelId, onMount(body), onDismiss() , inertRoots: [elements] }
   * onDismiss: המשתמש ביקש לסגור (Escape, רקע, כפתור סגירה). הנתב מחליט ואז קורא ל-closeSheet.
   */
  function openSheet(opts) {
    closeSheet();
    const opener = document.activeElement;
    const s = el(`
      <div class="sheet">
        <button class="sheet-scrim" type="button" tabindex="-1" aria-label="${esc(S.app.close)}"></button>
        <div class="sheet-body" role="dialog" aria-modal="true" aria-labelledby="${esc(opts.labelId)}">
          <div class="sheet-bar"><span class="sheet-grip" aria-hidden="true"></span>
            <button class="icon-btn sheet-x" type="button" aria-label="${esc(S.app.close)}">${I.x}</button></div>
          <div class="sheet-content">${opts.html}</div>
        </div>
      </div>`);
    const body = s.querySelector('.sheet-body');
    const dismiss = () => opts.onDismiss();
    s.querySelector('.sheet-scrim').onclick = dismiss;
    s.querySelector('.sheet-x').onclick = dismiss;
    s.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); dismiss(); return; }
      if (e.key !== 'Tab') return;
      const list = focusables(body);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    (opts.inertRoots || []).forEach((r) => { r.inert = true; });
    s._restore = () => {
      (opts.inertRoots || []).forEach((r) => { r.inert = false; });
      if (opener && opener.isConnected && opener.focus) opener.focus();
    };
    document.getElementById('app').append(s);
    openSheetEl = s;
    opts.onMount && opts.onMount(body, s);
    const title = body.querySelector('#' + opts.labelId);
    if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
    return s;
  }

  function closeSheet() {
    if (!openSheetEl) return;
    const s = openSheetEl;
    openSheetEl = null;
    s.remove();
    s._restore();
  }

  /* ——— כפתור חזרה בכותרת ——— */
  const backBtn = () => `<button class="icon-btn back" type="button" data-back aria-label="${esc(S.app.back)}">${I.back}</button>`;
  function bindBack(root, fallback) {
    const b = root.querySelector('[data-back]');
    if (b) b.onclick = () => Dira.app.router.back(fallback);
  }

  /* גלילה לסוף של רשימת הודעות */
  const scrollEnd = (node) => { node.scrollTop = node.scrollHeight; };

  Dira.ui = { esc, el, I, init, toast, banner, openSheet, closeSheet, backBtn, bindBack, scrollEnd };
})(globalThis.Dira = globalThis.Dira || {});
