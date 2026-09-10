/* איורי דירות לדוגמה. בלי תמונות מהרשת, בלי זכויות של אחרים. */
(function () {
  const PAL = {
    sea:     { wall: '#DCE8EC', wall2: '#C5D8E0', floor: '#B48A67', accent: '#2F6F8F', accent2: '#F2C14E', soft: '#F7F4EE' },
    sand:    { wall: '#EFE3D0', wall2: '#E1CFB4', floor: '#9C7A5B', accent: '#C8553D', accent2: '#3E7C6B', soft: '#FBF7F0' },
    pine:    { wall: '#DDE7DF', wall2: '#C8D8CC', floor: '#8C6B52', accent: '#2F5D50', accent2: '#E9B44C', soft: '#F6F7F2' },
    bauhaus: { wall: '#F1EEE8', wall2: '#DFD9CE', floor: '#77716B', accent: '#1F4E9C', accent2: '#E4572E', soft: '#FFFFFF' },
    rose:    { wall: '#F2E1DE', wall2: '#E6CBC6', floor: '#A47B62', accent: '#8C3B4A', accent2: '#5B8C85', soft: '#FFF8F5' },
    slate:   { wall: '#E3E6EA', wall2: '#CDD3DB', floor: '#7D6553', accent: '#36465A', accent2: '#D9A441', soft: '#F8F9FA' }
  };
  const SKY = [['#8FC3E4', '#E4F1F8'], ['#F0A97F', '#FBE3C6'], ['#7F70AE', '#F2A67C']];
  let uid = 0;

  function rng(seed) {
    let a = 0;
    for (const c of String(seed)) a = (a * 31 + c.charCodeAt(0)) | 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function wallFloor(p, k, H) {
    let planks = '';
    for (let i = 0; i < 9; i++) {
      const x = i * 38;
      planks += `<line x1="${x}" y1="${H}" x2="${x * 1.35 - 52}" y2="400" stroke="#000" stroke-opacity=".09" stroke-width="1.5"/>`;
    }
    return {
      defs: `<linearGradient id="${k}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.wall}"/><stop offset="1" stop-color="${p.wall2}"/></linearGradient>
             <linearGradient id="${k}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.floor}" stop-opacity=".82"/><stop offset="1" stop-color="${p.floor}"/></linearGradient>
             <radialGradient id="${k}g"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".75"/><stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/></radialGradient>`,
      svg: `<rect width="300" height="${H}" fill="url(#${k}w)"/><rect y="${H}" width="300" height="${400 - H}" fill="url(#${k}f)"/>${planks}
            <rect y="${H - 5}" width="300" height="5" fill="${p.soft}" opacity=".85"/>`
    };
  }

  function view(x, y, w, h, p, k, sky, R) {
    const sx = x + w * (0.25 + R() * 0.5);
    return {
      defs: `<linearGradient id="${k}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
             <clipPath id="${k}c"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`,
      svg: `<rect x="${x - 7}" y="${y - 7}" width="${w + 14}" height="${h + 14}" rx="3" fill="${p.soft}"/>
            <g clip-path="url(#${k}c)">
              <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${k}s)"/>
              <circle cx="${sx}" cy="${y + h * 0.32}" r="9" fill="#FFF3D6"/>
              <path d="M${x} ${y + h * 0.62} C${x + w * 0.3} ${y + h * 0.5} ${x + w * 0.6} ${y + h * 0.6} ${x + w} ${y + h * 0.52} L${x + w} ${y + h} L${x} ${y + h}Z" fill="#7C9A8B"/>
              <rect x="${x}" y="${y + h * 0.7}" width="${w}" height="${h * 0.3}" fill="#3E7FA6"/>
              <line x1="${x + w * 0.78}" y1="${y + h * 0.7}" x2="${x + w * 0.78}" y2="${y + h * 0.5}" stroke="#34404C" stroke-width="1.5"/>
              <line x1="${x + w * 0.7}" y1="${y + h * 0.52}" x2="${x + w * 0.9}" y2="${y + h * 0.52}" stroke="#34404C" stroke-width="1.5"/>
            </g>
            <rect x="${x + w / 2 - 2}" y="${y}" width="4" height="${h}" fill="${p.soft}"/>
            <rect x="${x - 12}" y="${y + h + 5}" width="${w + 24}" height="6" rx="2" fill="${p.soft}"/>`
    };
  }

  function plant(x, base) {
    let leaves = '';
    [-44, -22, 0, 22, 44].forEach((a, i) => {
      leaves += `<ellipse cx="${x}" cy="${base - 48}" rx="7" ry="22" fill="${i % 2 ? '#3F6E50' : '#56866A'}" transform="rotate(${a} ${x} ${base - 30})"/>`;
    });
    return `${leaves}<path d="M${x - 15} ${base - 28} L${x + 15} ${base - 28} L${x + 11} ${base} L${x - 11} ${base}Z" fill="#C98B5E"/>`;
  }

  function lamp(x, top, bottom, k) {
    return `<circle cx="${x}" cy="${top + 10}" r="62" fill="url(#${k}g)"/>
            <line x1="${x}" y1="${top + 14}" x2="${x}" y2="${bottom}" stroke="#2B2B2B" stroke-width="2"/>
            <path d="M${x - 16} ${top + 18} L${x + 16} ${top + 18} L${x + 10} ${top} L${x - 10} ${top}Z" fill="#F4E3C1"/>`;
  }

  function art(x, y, w, h, p) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.soft}" stroke="${p.wall2}" stroke-width="3"/>
            <circle cx="${x + w * 0.36}" cy="${y + h * 0.45}" r="${h * 0.24}" fill="${p.accent2}"/>
            <rect x="${x + w * 0.5}" y="${y + h * 0.3}" width="${w * 0.3}" height="${h * 0.45}" fill="${p.accent}"/>`;
  }

  function living(p, k, R, sky) {
    const H = 272, left = R() < 0.5;
    const wf = wallFloor(p, k, H), win = view(left ? 26 : 164, 56, 110, 126, p, k, sky, R);
    const lx = left ? 268 : 32, px = left ? 30 : 270;
    return {
      defs: wf.defs + win.defs,
      svg: wf.svg + win.svg + art(left ? 186 : 44, 86, 70, 50, p) + lamp(lx, 142, H + 8, k) +
        `<ellipse cx="150" cy="334" rx="130" ry="28" fill="${p.accent2}" opacity=".3"/>
         <rect x="52" y="190" width="196" height="50" rx="15" fill="${p.accent}"/>
         <rect x="44" y="226" width="212" height="42" rx="11" fill="${p.accent}"/>
         <rect x="44" y="226" width="212" height="42" rx="11" fill="#fff" opacity=".1"/>
         <rect x="34" y="212" width="24" height="56" rx="11" fill="${p.accent}"/>
         <rect x="242" y="212" width="24" height="56" rx="11" fill="${p.accent}"/>
         <rect x="72" y="198" width="54" height="36" rx="10" fill="${p.accent2}"/>
         <rect x="174" y="198" width="54" height="36" rx="10" fill="${p.soft}" opacity=".92"/>
         <rect x="60" y="267" width="6" height="11" fill="#2B2B2B"/><rect x="234" y="267" width="6" height="11" fill="#2B2B2B"/>
         <ellipse cx="150" cy="306" rx="48" ry="11" fill="${p.soft}"/>
         <line x1="126" y1="310" x2="122" y2="334" stroke="#2B2B2B" stroke-width="2"/><line x1="174" y1="310" x2="178" y2="334" stroke="#2B2B2B" stroke-width="2"/>
         <rect x="140" y="294" width="10" height="10" rx="2" fill="${p.accent2}"/>` + plant(px, H + 20)
    };
  }

  function kitchen(p, k, R, sky) {
    const H = 280, wf = wallFloor(p, k, H), win = view(118, 42, 64, 80, p, k, sky, R);
    let tiles = '';
    for (let x = 0; x <= 300; x += 18) tiles += `<line x1="${x}" y1="130" x2="${x}" y2="196" stroke="#000" stroke-opacity=".06"/>`;
    for (let y = 130; y <= 196; y += 18) tiles += `<line x1="0" y1="${y}" x2="300" y2="${y}" stroke="#000" stroke-opacity=".06"/>`;
    const cab = (x) => `<rect x="${x}" y="38" width="46" height="78" rx="3" fill="${p.soft}" stroke="${p.wall2}" stroke-width="2"/><rect x="${x + 19}" y="102" width="8" height="3" rx="1.5" fill="${p.accent}"/>`;
    return {
      defs: wf.defs + win.defs,
      svg: wf.svg + `<rect y="126" width="300" height="72" fill="${p.soft}" opacity=".6"/>` + tiles + win.svg +
        cab(14) + cab(62) + cab(192) + cab(240) +
        `<rect y="196" width="300" height="10" fill="#ECE6DC"/>
         <rect y="206" width="300" height="74" fill="${p.accent}"/>
         <line x1="60" y1="210" x2="60" y2="276" stroke="#000" stroke-opacity=".14"/><line x1="120" y1="210" x2="120" y2="276" stroke="#000" stroke-opacity=".14"/>
         <line x1="180" y1="210" x2="180" y2="276" stroke="#000" stroke-opacity=".14"/><line x1="240" y1="210" x2="240" y2="276" stroke="#000" stroke-opacity=".14"/>
         <rect x="120" y="196" width="60" height="4" fill="#9AA3A8"/>
         <ellipse cx="58" cy="190" rx="22" ry="8" fill="${p.soft}"/>
         <circle cx="50" cy="183" r="6" fill="${p.accent2}"/><circle cx="62" cy="182" r="6" fill="${p.accent2}"/><circle cx="56" cy="176" r="6" fill="${p.accent2}"/>
         <rect x="216" y="168" width="32" height="28" rx="4" fill="#C7A27C"/>
         <ellipse cx="108" cy="318" rx="23" ry="7" fill="${p.accent2}"/><line x1="96" y1="322" x2="92" y2="392" stroke="#2B2B2B" stroke-width="2.5"/><line x1="120" y1="322" x2="124" y2="392" stroke="#2B2B2B" stroke-width="2.5"/>
         <ellipse cx="192" cy="318" rx="23" ry="7" fill="${p.accent2}"/><line x1="180" y1="322" x2="176" y2="392" stroke="#2B2B2B" stroke-width="2.5"/><line x1="204" y1="322" x2="208" y2="392" stroke="#2B2B2B" stroke-width="2.5"/>`
    };
  }

  function bedroom(p, k, R, sky) {
    const H = 270, wf = wallFloor(p, k, H), win = view(192, 58, 82, 104, p, k, sky, R);
    return {
      defs: wf.defs + win.defs,
      svg: wf.svg + win.svg +
        `<rect x="178" y="48" width="12" height="128" fill="${p.accent2}" opacity=".85"/><rect x="276" y="48" width="12" height="128" fill="${p.accent2}" opacity=".85"/>` +
        art(104, 76, 64, 46, p) + lamp(32, 196, 238, k) +
        `<rect x="10" y="236" width="46" height="54" rx="4" fill="${p.soft}" stroke="${p.wall2}" stroke-width="2"/>
         <ellipse cx="160" cy="352" rx="128" ry="26" fill="${p.accent}" opacity=".18"/>
         <rect x="70" y="148" width="180" height="100" rx="16" fill="${p.accent}"/>
         <rect x="62" y="226" width="196" height="28" rx="7" fill="${p.soft}"/>
         <rect x="92" y="208" width="60" height="26" rx="10" fill="#fff"/><rect x="168" y="208" width="60" height="26" rx="10" fill="#fff"/>
         <rect x="62" y="246" width="196" height="64" rx="11" fill="${p.accent2}"/>
         <path d="M62 270 Q160 258 258 270" stroke="#000" stroke-opacity=".1" stroke-width="2" fill="none"/>`
    };
  }

  function balcony(p, k, R, sky) {
    const sx = 60 + R() * 180;
    let bal = '', sparks = '', city = '';
    for (let x = 6; x < 300; x += 16) bal += `<rect x="${x}" y="270" width="4" height="60" fill="#2C3A46"/>`;
    for (let i = 0; i < 7; i++) sparks += `<line x1="${20 + i * 42}" y1="${214 + (i % 3) * 14}" x2="${36 + i * 42}" y2="${214 + (i % 3) * 14}" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`;
    for (let i = 0; i < 12; i++) city += `<rect x="${14 + i * 23}" y="${170 - (i % 4) * 3}" width="7" height="${6 + (i % 3) * 2}" fill="#F3EDE2" opacity=".75"/>`;
    return {
      defs: `<linearGradient id="${k}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
             <linearGradient id="${k}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A8DB3"/><stop offset="1" stop-color="#2D6A90"/></linearGradient>`,
      svg: `<rect width="300" height="270" fill="url(#${k}s)"/>
            <circle cx="${sx}" cy="92" r="48" fill="#FFF1CF" opacity=".28"/><circle cx="${sx}" cy="92" r="22" fill="#FFF1CF"/>
            <path d="M0 178 C60 160 120 172 180 158 S270 150 300 164 L300 204 L0 204Z" fill="#8FA79B"/>${city}
            <rect y="198" width="300" height="72" fill="url(#${k}m)"/>${sparks}
            <line x1="222" y1="198" x2="222" y2="150" stroke="#3B4652" stroke-width="2"/><line x1="206" y1="154" x2="250" y2="154" stroke="#3B4652" stroke-width="2"/>
            <line x1="252" y1="198" x2="252" y2="160" stroke="#3B4652" stroke-width="2"/><line x1="240" y1="164" x2="276" y2="164" stroke="#3B4652" stroke-width="2"/>
            <rect y="262" width="300" height="9" fill="#2C3A46"/>${bal}<rect y="326" width="300" height="5" fill="#2C3A46"/>
            <rect y="330" width="300" height="70" fill="${p.soft}"/>
            <line x1="0" y1="360" x2="300" y2="360" stroke="#000" stroke-opacity=".08"/><line x1="100" y1="330" x2="80" y2="400" stroke="#000" stroke-opacity=".08"/><line x1="200" y1="330" x2="220" y2="400" stroke="#000" stroke-opacity=".08"/>
            <rect x="44" y="300" width="50" height="10" rx="4" fill="${p.accent}"/><rect x="44" y="258" width="10" height="52" rx="4" fill="${p.accent}"/>
            <line x1="50" y1="310" x2="46" y2="376" stroke="${p.accent}" stroke-width="4"/><line x1="90" y1="310" x2="94" y2="376" stroke="${p.accent}" stroke-width="4"/>
            <ellipse cx="150" cy="316" rx="30" ry="8" fill="${p.accent2}"/><line x1="150" y1="320" x2="150" y2="378" stroke="#2B2B2B" stroke-width="3"/>
            <rect x="140" y="298" width="8" height="14" rx="2" fill="#fff" opacity=".85"/>` + plant(252, 386)
    };
  }

  const SCENE = { living, kitchen, bedroom, balcony };

  function render(type, palName, seed) {
    const k = 'sc' + (++uid);
    const R = rng(seed);
    const p = PAL[palName] || PAL.sea;
    const sky = SKY[Math.floor(R() * SKY.length)];
    const out = (SCENE[type] || living)(p, k, R, sky);
    return `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>${out.defs}</defs>${out.svg}</svg>`;
  }

  /* תמונה מספר i של דירה: תמונה אמיתית אם יש, אחרת איור */
  function photo(apt, i) {
    if (apt.photos && apt.photos.length) {
      const src = apt.photos[i % apt.photos.length];
      return `<img src="${src}" alt="" draggable="false">`;
    }
    const list = apt.scenes && apt.scenes.length ? apt.scenes : ['living'];
    return render(list[i % list.length], apt.pal, apt.id + ':' + i);
  }

  function count(apt) {
    return apt.photos && apt.photos.length ? apt.photos.length : (apt.scenes || ['living']).length;
  }

  window.SCENES = { render, photo, count };
})();
