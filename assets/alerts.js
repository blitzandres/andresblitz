/* Email sign-up cards for andresblitz.com.
   Usage: <div class="ab-alerts" data-topics="btc-bracket,bcv-daily" data-country="VE"></div>
          <script src="/assets/alerts.js" defer></script>
   Sign-ups go to the Google Apps Script web app in google-sheets/alerts.gs.
   Until API is set, every card section stays hidden, so the site looks unchanged. */
(function () {
  'use strict';
  // Paste the Apps Script web app URL here (Deploy → Web app → URL ending in /exec).
  var API = '';
  var DOC_ES = /^es/.test(document.documentElement.lang || '');
  var fmt = function (n, d) { return Number(n).toLocaleString('es', { maximumFractionDigits: d == null ? 2 : d }); };
  var usd = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var cache = {};
  function getJSON(p) { return cache[p] || (cache[p] = fetch(p).then(function (r) { if (!r.ok) throw 0; return r.json(); })); }

  var ICON = {
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 18h4"/>',
    gap: '<path d="M4 7h16M4 17h16"/><path d="m8 3-4 4 4 4M16 13l4 4-4 4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M8 7h8M8 11h6"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>',
  };

  // The 10 topics. live(): a one-line teaser from data the site already publishes.
  // A box can set data-lang="es" or "en"; otherwise the page language is used.
  var byLang = {};
  function topicsFor(ES) {
  if (byLang[ES]) return byLang[ES];
  var L = function (en, es) { return ES ? es : en; };
  return (byLang[ES] = {
    'btc-bracket': {
      icon: 'chart', hue: '#f7931a',
      title: L('Bitcoin bracket alerts', 'Alertas de Bitcoin por rango'),
      text: L('An email when BTC closes a day in a new price bracket.', 'Un correo cuando BTC cierre el día en un nuevo rango de precio.'),
      fields: function () {
        return sel('width', L('Bracket size', 'Tamaño del rango'), [[5000, '$5,000'], [10000, '$10,000'], [15000, '$15,000'], [3000, '$3,000']]);
      },
      live: function () {
        return getJSON('/bitcoin/history.json').then(function (h) {
          var c = h.closes[h.closes.length - 1][1], b = Math.floor(c / 5000) * 5000;
          return L('Last close ', 'Último cierre ') + usd(c) + ' · ' + usd(b) + '–' + usd(b + 5000);
        });
      },
    },
    'bio-pdf': {
      icon: 'file', hue: '#5b8def',
      title: L('Bio as a PDF', 'Biografía en PDF'),
      text: L('A personal PDF copy of my bio and projects, sent to your inbox.', 'Una copia personal en PDF de mi biografía y proyectos, en tu correo.'),
      live: function () { return getJSON('/api/site.json').then(function (s) { return s.pages.filter(function (p) { return p.kind === 'project'; }).length + L(' projects inside', ' proyectos incluidos'); }); },
    },
    'dolar-gap': {
      icon: 'gap', hue: '#34d399',
      title: L('Crypto dollar gap alert', 'Alerta de brecha del dólar cripto'),
      text: L('An email when the gap between the official and USDT dollar crosses your level.', 'Un correo cuando la brecha entre el dólar oficial y el USDT cruce tu nivel.'),
      fields: function (box) {
        var c = box.getAttribute('data-country');
        var s = c ? '<input type="hidden" name="country" value="' + c + '">' : sel('country', L('Country', 'País'), [['VE', 'Venezuela'], ['AR', 'Argentina'], ['CO', 'Colombia']]);
        return s + '<label class="ab-f"><span>' + L('Alert at', 'Avisar al') + '</span><span class="ab-pct"><input name="threshold" type="number" min="1" max="200" step="0.5" value="' + (c === 'AR' ? 5 : c === 'CO' ? 3 : 20) + '" required><b>%</b></span></label>';
      },
      live: function (box) {
        var c = box.getAttribute('data-country') || 'VE';
        return getJSON('/dolar-cripto/data.json').then(function (d) { var x = d.countries[c]; return L('Gap now in ', 'Brecha hoy en ') + x.name + ': ' + fmt(x.gap, 1) + ' %'; });
      },
    },
    'bcv-daily': {
      icon: 'sun', hue: '#fbbf24',
      title: L('Daily BCV rate', 'Tasa BCV diaria'),
      text: L('The BCV rate in your inbox every morning, around 8:00 Caracas time.', 'La Tasa BCV en tu correo cada mañana, alrededor de las 8:00 (hora de Caracas).'),
      live: function () { return getJSON('/rates/index.json').then(function (r) { return 'BCV: ' + fmt(r.series['tasa-bcv'].value, 4) + ' Bs/USD'; }); },
    },
    'rates-weekly': {
      icon: 'cal', hue: '#2dd4bf',
      title: L('Weekly LatAm dollar', 'El dólar de la semana'),
      text: L('Every Monday: the dollar in 7 countries and how much it moved.', 'Cada lunes: el dólar en 7 países y cuánto se movió.'),
      live: function () { return getJSON('/rates/index.json').then(function (r) { return Object.keys(r.series).length + L(' rates tracked', ' tasas seguidas'); }); },
    },
    'guias-pdf': {
      icon: 'book', hue: '#a78bfa',
      title: L('Crypto guides PDF', 'Guías cripto en PDF'),
      text: L('All 5 Spanish crypto guides in one PDF: USDT, P2P, networks, the gap and scams.', 'Las 5 guías en un PDF: USDT, P2P, redes, brecha y estafas.'),
      live: function () { return Promise.resolve(L('5 guides · free', '5 guías · gratis')); },
    },
    'new-projects': {
      icon: 'rocket', hue: '#5b8def',
      title: L('New project alerts', 'Avisos de proyectos nuevos'),
      text: L('Hear when a new tool, game or demo goes live.', 'Entérate cuando salga una herramienta, juego o demo nueva.'),
      live: function () { return getJSON('/api/site.json').then(function (s) { return s.pages.filter(function (p) { return p.kind === 'project'; }).length + L(' projects so far', ' proyectos hasta hoy'); }); },
    },
    'trading-notes': {
      icon: 'pen', hue: '#f472b6',
      title: L('Monthly trading notes', 'Notas de trading mensuales'),
      text: L('My market view once a month: what I watch, the stage of each market, and why.', 'Mi visión del mercado una vez al mes: qué sigo y en qué etapa está cada mercado.'),
      live: function () { return Promise.resolve(L('First issue coming soon', 'Primera edición muy pronto')); },
    },
    el70: {
      icon: 'leaf', hue: '#84cc16',
      title: L('El 70 updates', 'Noticias de El 70'),
      text: L('News from the family ranch in Zulia: the herd, the land and the season.', 'Novedades de la finca en Zulia: el ganado, los potreros y la temporada.'),
      live: function () { return Promise.resolve('Km 70 · Troncal 6 · Zulia'); },
    },
    'calc-result': {
      icon: 'calc', hue: '#fbbf24',
      title: L('Email me this result', 'Envíame este resultado'),
      text: L('Your result by email now, and a reminder in 30 days to check it again.', 'Tu resultado por correo ahora, y un recordatorio en 30 días para revisarlo.'),
      live: function () { return Promise.resolve(L('Uses the numbers above', 'Usa los números de arriba')); },
    },
  });
  }

  function sel(name, label, opts) {
    return '<label class="ab-f"><span>' + label + '</span><select name="' + name + '">' + opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></label>';
  }

  var CSS = '.ab-wrap{overflow-x:clip;max-width:64rem;margin:3rem auto;padding:0 max(1.5rem,env(safe-area-inset-left,0px)) 0 max(1.5rem,env(safe-area-inset-right,0px))}.ab-wrap>h2{font-family:Archivo,system-ui,sans-serif;font-size:1.35rem;color:#e7ecf5;margin:0;letter-spacing:-.01em}.ab-wrap>p{color:#97a3b8;font-size:.92rem;margin:.35rem 0 0}.ab-wrap .ab-alerts{margin-top:1.25rem}.ab-tight{margin:1.5rem auto}.ab-tight .ab-alerts{margin:0;grid-template-columns:minmax(0,34rem)}' +
    '.ab-alerts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr));gap:1rem;margin:2.5rem 0}' +
    '.ab-card{--h:#5b8def;position:relative;border-radius:1rem;padding:1px;background:linear-gradient(140deg,color-mix(in srgb,var(--h) 70%,transparent),rgba(148,163,184,.12) 45%,color-mix(in srgb,var(--h) 35%,transparent));isolation:isolate;min-width:0}' +
    '.ab-card::before{content:"";position:absolute;inset:-30%;z-index:-1;background:radial-gradient(closest-side,color-mix(in srgb,var(--h) 22%,transparent),transparent);opacity:.55;transition:opacity .4s;pointer-events:none}' +
    '.ab-card:hover::before,.ab-card:focus-within::before{opacity:1}' +
    '.ab-in{position:relative;height:100%;border-radius:calc(1rem - 1px);background:#0b101d;padding:1.25rem 1.25rem 1.1rem;display:flex;flex-direction:column;gap:.7rem;overflow:hidden}' +
    '.ab-in::after{content:"";position:absolute;top:0;left:-60%;width:60%;height:2px;background:linear-gradient(90deg,transparent,var(--h),transparent);animation:ab-sweep 4.5s ease-in-out infinite}' +
    '@keyframes ab-sweep{0%{left:-60%}60%,100%{left:110%}}' +
    '.ab-top{display:flex;align-items:center;gap:.7rem}' +
    '.ab-ic{flex:none;width:2.4rem;height:2.4rem;border-radius:.7rem;display:grid;place-items:center;color:var(--h);background:color-mix(in srgb,var(--h) 14%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--h) 30%,transparent)}' +
    '.ab-ic svg{width:1.25rem;height:1.25rem}' +
    '.ab-card h3{margin:0;font-family:Archivo,system-ui,sans-serif;font-size:1.05rem;line-height:1.2;color:#e7ecf5;letter-spacing:-.01em;text-wrap:balance}' +
    '.ab-card p{margin:0;font-size:.88rem;line-height:1.55;color:#97a3b8}' +
    '.ab-live{display:inline-flex;align-items:center;gap:.45rem;align-self:flex-start;font-size:.75rem;color:#c9d2e3;background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.14);border-radius:99rem;padding:.25rem .65rem;font-variant-numeric:tabular-nums;max-width:100%}' +
    '.ab-live i{flex:none;width:.45rem;height:.45rem;border-radius:50%;background:var(--h);box-shadow:0 0 0 0 var(--h);animation:ab-pulse 2s infinite}' +
    '.ab-live span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '@keyframes ab-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--h) 60%,transparent)}70%{box-shadow:0 0 0 .45rem transparent}100%{box-shadow:0 0 0 0 transparent}}' +
    '.ab-form{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:auto;padding-top:.25rem}' +
    '.ab-f{display:flex;flex-direction:column;gap:.2rem;font-size:.72rem;color:#97a3b8;flex:1 1 7rem;min-width:0}' +
    '.ab-form select,.ab-form input{font:inherit;font-size:.88rem;color:#e7ecf5;background:#05070f;border:1px solid rgba(148,163,184,.2);border-radius:.55rem;padding:.55rem .7rem;width:100%;min-width:0}' +
    '.ab-form select:focus,.ab-form input:focus{outline:2px solid var(--h);outline-offset:1px;border-color:transparent}' +
    '.ab-pct{display:flex;align-items:center;gap:.35rem}.ab-pct b{color:#e7ecf5;font-weight:500}' +
    '.ab-row{display:flex;gap:.5rem;flex:1 1 100%;min-width:0}' +
    '.ab-row input{flex:1;min-width:0}' +
    '.ab-row button{flex:none;font:inherit;font-size:.88rem;font-weight:600;color:#05070f;background:var(--h);border:0;border-radius:.55rem;padding:.55rem 1rem;cursor:pointer;transition:transform .15s,filter .15s}' +
    '.ab-row button:hover{filter:brightness(1.1)}.ab-row button:active{transform:scale(.97)}.ab-row button[disabled]{opacity:.6;cursor:wait}' +
    '.ab-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;opacity:0}' +
    '.ab-msg{font-size:.82rem;min-height:1.2em;margin:0;color:#97a3b8}.ab-msg.ok{color:#34d399}.ab-msg.err{color:#f87171}' +
    '.ab-done .ab-form{display:none}' +
    '.ab-legal{font-size:.7rem!important;opacity:.75}' +
    '@media (prefers-reduced-motion:reduce){.ab-in::after,.ab-live i{animation:none}}';

  function render(box) {
    var es = box.getAttribute('data-lang') ? box.getAttribute('data-lang') === 'es' : DOC_ES;
    var T = topicsFor(es);
    var topics = (box.getAttribute('data-topics') || '').split(',').map(function (s) { return s.trim(); }).filter(function (k) { return T[k]; });
    box.innerHTML = '';
    topics.forEach(function (k) { box.appendChild(card(k, T[k], box, es)); });
  }

  function card(key, t, box, ES) {
    var L = function (en, es) { return ES ? es : en; };
    var el = document.createElement('article');
    el.className = 'ab-card';
    el.style.setProperty('--h', t.hue);
    var id = 'ab-' + key + '-' + Math.random().toString(36).slice(2, 7);
    var pdf = key === 'bio-pdf' || key === 'guias-pdf';
    el.innerHTML = '<div class="ab-in">' +
      '<div class="ab-top"><span class="ab-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[t.icon] + '</svg></span><h3>' + t.title + '</h3></div>' +
      '<p>' + t.text + '</p>' +
      '<span class="ab-live" hidden><i aria-hidden="true"></i><span></span></span>' +
      '<form class="ab-form" novalidate>' + (t.fields ? t.fields(box) : '') +
      '<label class="ab-hp" aria-hidden="true">Website<input name="hp" tabindex="-1" autocomplete="off"></label>' +
      '<div class="ab-row"><input id="' + id + '" name="email" type="email" required autocomplete="email" placeholder="' + L('you@email.com', 'tu@correo.com') + '" aria-label="' + L('Email', 'Correo') + '">' +
      '<button type="submit">' + (pdf ? L('Send PDF', 'Enviar PDF') : L('Notify me', 'Avisarme')) + '</button></div></form>' +
      '<p class="ab-msg" role="status"></p>' +
      '<p class="ab-legal">' + (pdf ? L('Each PDF copy carries a unique code tied to your email. ', 'Cada copia lleva un código único asociado a tu correo. ') : '') + L('You confirm by email first. Unsubscribe in one click.', 'Confirmas por correo primero. Te das de baja con un clic.') + '</p></div>';

    var live = el.querySelector('.ab-live');
    t.live(box).then(function (s) { live.lastChild.textContent = s; live.hidden = false; }).catch(function () {});

    var form = el.querySelector('form'), msg = el.querySelector('.ab-msg'), btn = el.querySelector('button');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form), email = String(f.get('email') || '').trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { say('err', L('Enter a valid email address.', 'Escribe un correo válido.')); return; }
      var params = {};
      ['width', 'country', 'threshold'].forEach(function (n) { if (f.get(n) != null) params[n] = f.get(n); });
      if (key === 'calc-result') {
        var res = document.querySelector(box.getAttribute('data-from') || '.res');
        var summary = res ? res.innerText.replace(/\s+/g, ' ').trim() : '';
        if (!summary) { say('err', L('Run the calculator first, then send.', 'Primero usa la calculadora y luego envía.')); return; }
        params = { calc: location.pathname.split('/')[1], summary: summary.slice(0, 280) };
      }
      btn.disabled = true; say('', L('Sending…', 'Enviando…'));
      // Apps Script web apps do not send CORS headers, so the reply cannot be read here: a
      // plain-text no-cors POST is delivered, and the confirmation email is the real answer.
      fetch(API, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ email: email, topic: key, params: params, lang: ES ? 'es' : 'en', hp: f.get('hp') || '' }) })
        .then(function () {
          btn.disabled = false; el.classList.add('ab-done');
          say('ok', L('Check your inbox and confirm. ✓', 'Revisa tu correo y confirma. ✓'));
        })
        .catch(function () { btn.disabled = false; say('err', L('Sign-ups are not available right now. Try again later.', 'Las suscripciones no están disponibles ahora. Inténtalo más tarde.')); });
    });
    function say(cls, s) { msg.className = 'ab-msg' + (cls ? ' ' + cls : ''); msg.textContent = s; }
    return el;
  }

  function init() {
    if (!API) return; // not connected yet: sections stay hidden
    Array.prototype.forEach.call(document.querySelectorAll('[data-ab-section]'), function (s) { s.hidden = false; });
    if (!document.getElementById('ab-alerts-css')) {
      var st = document.createElement('style'); st.id = 'ab-alerts-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    Array.prototype.forEach.call(document.querySelectorAll('.ab-alerts'), render);
  }
  window.ABAlerts = { api: API, topicsFor: topicsFor, render: render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
