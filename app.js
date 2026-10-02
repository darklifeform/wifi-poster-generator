'use strict';

const LANGS = {
  lv: { name: 'LV', wifi: 'Wi-Fi', free: 'Bezmaksas Wi-Fi', guest: 'Viesu Wi-Fi',
        scan: 'Noskenē QR kodu, lai pieslēgtos', network: 'Tīkls', password: 'Parole', open: 'Bez paroles' },
  en: { name: 'EN', wifi: 'Wi-Fi', free: 'Free Wi-Fi', guest: 'Guest Wi-Fi',
        scan: 'Scan the QR code to connect', network: 'Network', password: 'Password', open: 'No password' },
  ru: { name: 'RU', wifi: 'Wi-Fi', free: 'Бесплатный Wi-Fi', guest: 'Гостевой Wi-Fi',
        scan: 'Отсканируйте QR-код для подключения', network: 'Сеть', password: 'Пароль', open: 'Без пароля' },
};

const DESIGNS = {
  clean: 'Чистый',
  dark: 'Тёмный',
  bold: 'Яркий',
  frame: 'Рамка',
};

const SIZES = { A4: [210, 297], A5: [148, 210] };

const $ = (id) => document.getElementById(id);

const state = {
  design: 'clean',
  langOrder: ['lv', 'en', 'ru'],
  langOn: { lv: true, en: true, ru: true },
  clientLogo: null,
  myLogo: null,
};

// --- persistence (only settings of the operator, never client credentials) ---
const store = {
  get(k) { try { return localStorage.getItem('wpg.' + k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem('wpg.' + k) : localStorage.setItem('wpg.' + k, v); } catch {} },
};

// --- Wi-Fi QR payload: WIFI:T:<type>;S:<ssid>;P:<pass>;H:true;; ---
function esc(s) {
  return s.replace(/([\\;,:"])/g, '\\$1');
}

function wifiPayload({ ssid, password, security, hidden }) {
  let p = `WIFI:T:${security};S:${esc(ssid)};`;
  if (security !== 'nopass') p += `P:${esc(password)};`;
  if (hidden) p += 'H:true;';
  return p + ';';
}

function qrSvg(text) {
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const q = 2; // quiet zone in modules (the white card adds more)
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) d += `M${c + q},${r + q}h1v1h-1z`;
    }
  }
  const s = n + q * 2;
  return `<svg class="qr" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">` +
         `<rect width="${s}" height="${s}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

const h = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// --- render ---
function render() {
  const net = {
    ssid: $('ssid').value,
    password: $('password').value,
    security: $('security').value,
    hidden: $('hidden').checked,
  };
  const langs = state.langOrder.filter((l) => state.langOn[l]);
  if (!langs.length) langs.push('en');
  const [main, ...rest] = langs.map((l) => LANGS[l]);
  const hk = $('headline').value;
  const showPw = $('showPassword').checked && net.security !== 'nopass';

  $('password').disabled = net.security === 'nopass';
  const warn = $('ssidWarn');
  warn.hidden = !!net.ssid;
  warn.textContent = 'Введите SSID';

  const headline = `<h2 class="headline">${h(main[hk])}</h2>` +
    (rest.length ? `<p class="headline-alt">${rest.map((l) => h(l[hk])).filter((t, i, a) => t !== h(main[hk]) && a.indexOf(t) === i).join(' · ')}</p>` : '');

  const scan = `<div class="scan"><p class="scan-main">${h(main.scan)}</p>` +
    rest.map((l) => `<p>${h(l.scan)}</p>`).join('') + '</div>';

  const label = (key) => `${h(main[key])}${rest.map((l) => ` / ${h(l[key])}`).join('')}`;

  const creds = `<dl class="creds">
      <dt>${label('network')}</dt><dd>${h(net.ssid || '—')}</dd>
      ${net.security === 'nopass'
        ? `<dt>${label('password')}</dt><dd class="muted">${label('open')}</dd>`
        : showPw ? `<dt>${label('password')}</dt><dd class="pw">${h(net.password || '—')}</dd>` : ''}
    </dl>`;

  const qr = net.ssid ? qrSvg(wifiPayload(net)) : '<div class="qr qr-empty"></div>';
  const footerText = $('footerText').value.trim();

  const poster = $('poster');
  poster.className = `poster d-${state.design}`;
  poster.style.setProperty('--accent', $('accent').value);
  poster.innerHTML = `
    <header class="top">
      ${state.clientLogo ? `<img class="client-logo" src="${state.clientLogo}" alt="">` : ''}
    </header>
    <div class="body">
      <svg class="wifi-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21l3.6-4.8a6 6 0 0 0-7.2 0L12 21zm0-18C7.95 3 4.21 4.34 1.2 6.6l1.8 2.4a14.94 14.94 0 0 1 18 0l1.8-2.4A17.93 17.93 0 0 0 12 3zm0 6c-2.7 0-5.19.9-7.2 2.4l1.8 2.4A8.97 8.97 0 0 1 12 12c2.03 0 3.9.67 5.4 1.8l1.8-2.4A11.95 11.95 0 0 0 12 9z"/></svg>
      ${headline}
      <div class="qr-card">${qr}</div>
      ${scan}
      ${creds}
    </div>
    ${(footerText || state.myLogo) ? `<footer class="brand">
      ${state.myLogo ? `<img src="${state.myLogo}" alt="">` : ''}
      ${footerText ? `<span>${h(footerText)}</span>` : ''}
    </footer>` : ''}`;

  applySize();
}

function applySize() {
  const [w, hgt] = SIZES[$('size').value];
  const poster = $('poster');
  poster.style.width = w + 'mm';
  poster.style.height = hgt + 'mm';
  $('page-size').textContent = `@page { size: ${$('size').value} portrait; margin: 0; }`;
  fit();
}

function fit() {
  const stage = $('stage');
  const poster = $('poster');
  const pw = poster.offsetWidth, ph = poster.offsetHeight;
  const pad = 32;
  const k = Math.min((stage.clientWidth - pad) / pw, (stage.clientHeight - pad) / ph, 1);
  poster.style.setProperty('--k', k);
  $('scaler').style.width = pw * k + 'px';
  $('scaler').style.height = ph * k + 'px';
}

// --- UI setup ---
function buildDesigns() {
  const box = $('designs');
  box.innerHTML = Object.entries(DESIGNS).map(([k, name]) =>
    `<button type="button" data-d="${k}" class="${k === state.design ? 'on' : ''}">${name}</button>`).join('');
  box.onclick = (e) => {
    const d = e.target.dataset.d;
    if (!d) return;
    state.design = d;
    store.set('design', d);
    buildDesigns();
    render();
  };
}

function buildLangs() {
  const box = $('langList');
  box.innerHTML = state.langOrder.map((l, i) => `
    <span class="lang">
      <label class="check"><input type="checkbox" data-l="${l}" ${state.langOn[l] ? 'checked' : ''}> ${LANGS[l].name}</label>
      ${i > 0 ? `<button type="button" class="up" data-up="${l}" title="Выше">↑</button>` : ''}
    </span>`).join('');
  box.onchange = (e) => { state.langOn[e.target.dataset.l] = e.target.checked; saveLangs(); render(); };
  box.onclick = (e) => {
    const l = e.target.dataset.up;
    if (!l) return;
    const i = state.langOrder.indexOf(l);
    [state.langOrder[i - 1], state.langOrder[i]] = [state.langOrder[i], state.langOrder[i - 1]];
    saveLangs();
    buildLangs();
    render();
  };
}

function saveLangs() {
  store.set('langs', JSON.stringify({ order: state.langOrder, on: state.langOn }));
}

function readFile(input, cb) {
  const f = input.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => cb(r.result);
  r.readAsDataURL(f);
}

function syncLogoButtons() {
  $('clientLogoClear').hidden = !state.clientLogo;
  $('myLogoClear').hidden = !state.myLogo;
}

function init() {
  // restore operator settings
  state.design = DESIGNS[store.get('design')] ? store.get('design') : state.design;
  try {
    const l = JSON.parse(store.get('langs'));
    if (l && Array.isArray(l.order) && l.order.length === 3) { state.langOrder = l.order; state.langOn = l.on; }
  } catch {}
  state.myLogo = store.get('myLogo');
  $('footerText').value = store.get('footerText') ?? '';
  $('accent').value = store.get('accent') || $('accent').value;
  $('size').value = store.get('size') || 'A4';
  $('headline').value = store.get('headline') || 'wifi';

  buildDesigns();
  buildLangs();
  syncLogoButtons();

  ['ssid', 'password', 'security', 'hidden', 'showPassword'].forEach((id) => $(id).addEventListener('input', render));
  $('footerText').addEventListener('input', () => { store.set('footerText', $('footerText').value); render(); });
  $('accent').addEventListener('input', () => { store.set('accent', $('accent').value); render(); });
  $('size').addEventListener('input', () => { store.set('size', $('size').value); render(); });
  $('headline').addEventListener('input', () => { store.set('headline', $('headline').value); render(); });

  $('clientLogo').addEventListener('change', (e) => readFile(e.target, (d) => { state.clientLogo = d; syncLogoButtons(); render(); }));
  $('myLogo').addEventListener('change', (e) => readFile(e.target, (d) => { state.myLogo = d; store.set('myLogo', d); syncLogoButtons(); render(); }));
  $('clientLogoClear').onclick = () => { state.clientLogo = null; $('clientLogo').value = ''; syncLogoButtons(); render(); };
  $('myLogoClear').onclick = () => { state.myLogo = null; $('myLogo').value = ''; store.set('myLogo', null); syncLogoButtons(); render(); };

  $('print').onclick = () => {
    if (!$('ssid').value) { $('ssid').focus(); return; }
    window.print();
  };
  window.addEventListener('resize', fit);
  render();
}

init();
