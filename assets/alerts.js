/* Small inline email alerts for andresblitz.com.
   Markup: <p class="ab-bell" data-topic="bcv-daily" hidden></p>
     data-topic   btc-bracket | dolar-gap | bcv-daily | rates-weekly | bio-pdf | guias-pdf | new-projects | trading-notes | el70
     data-choice  optional: "gap,weekly" shows a tiny topic picker; data-country VE|AR|CO for dolar-gap
     data-open    render the form already open (used on /alerts/)
   Sign-ups go to the Google Apps Script web app (google-sheets/alerts.gs), which stores them in the
   "andresblitz alerts" Sheet and emails a confirm link. While API is empty the links stay hidden;
   add ?alerts=preview to a page URL to see the UI (submit then says it is not connected). */
(function () {
  'use strict';
  // Apps Script web app URL (Deploy → Web app → URL ending in /exec).
  var API = '';
  var PREVIEW = /[?&]alerts=preview\b/.test(location.search);
  var ES = /^es/.test(document.documentElement.lang || '');
  var L = function (en, es) { return ES ? es : en; };
  function names() { return {
    'btc-bracket': L('Bitcoin bracket alert', 'Alerta de rango de Bitcoin'),
    'dolar-gap': L('Crypto dollar gap alert', 'Alerta de brecha del dólar cripto'),
    'bcv-daily': L('Daily BCV rate', 'Tasa BCV cada mañana'),
    'rates-weekly': L('Weekly LatAm dollar', 'Resumen semanal del dólar'),
    'bio-pdf': L('Bio as a PDF', 'Biografía en PDF'),
    'guias-pdf': L('Crypto guides PDF', 'Guías cripto en PDF'),
    'new-projects': L('New projects', 'Proyectos nuevos'),
    'trading-notes': L('Monthly trading notes', 'Notas de trading mensuales'),
    el70: L('El 70 updates', 'Noticias de El 70'),
  }; }

  var CSS = '.ab-bell{margin:8px 0 0;font-size:13.5px;line-height:1.4;color:var(--mute,var(--muted,#97a3b8))}' +
    '.ab-bell .ab-t{font:inherit;color:var(--acc,var(--accent,#7fc8a9));background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}' +
    '.ab-bell[hidden],.ab-bell [hidden]{display:none!important}.ab-bell .ab-x{display:contents}.ab-bell form{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:6px}' +
    '.ab-bell input,.ab-bell select,.ab-bell button[type=submit]{font:inherit;font-size:16px;color:inherit;background:color-mix(in srgb,currentColor 6%,transparent);border:1px solid color-mix(in srgb,currentColor 30%,transparent);border-radius:8px;padding:6px 9px;min-width:0}' +
    '.ab-bell input[type=email]{flex:1 1 13rem;max-width:20rem}.ab-bell input[type=number]{width:4.2rem}' +
    '.ab-bell button[type=submit]{cursor:pointer;font-weight:600}.ab-bell button[disabled]{opacity:.6;cursor:wait}' +
    '.ab-bell .ab-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;opacity:0}' +
    '.ab-bell .ab-m{display:block;margin-top:4px}.ab-bell .ab-m.ok{color:#22a06b}.ab-bell .ab-m.err{color:#e5484d}';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function extra(topic, el) {
    if (topic === 'btc-bracket') {
      var cur = (document.getElementById('sizeLabel') || {}).textContent || '';
      return '<select name="width" aria-label="' + L('Bracket size', 'Tamaño del rango') + '">' + [[3000, '$3k'], [5000, '$5k'], [10000, '$10k'], [15000, '$15k']].map(function (o) {
        return '<option value="' + o[0] + '"' + ((cur ? cur.replace(/\D/g, '') === String(o[0]) : o[0] === 10000) ? ' selected' : '') + '>' + o[1] + ' ' + L('brackets', 'rangos') + '</option>';
      }).join('') + '</select>';
    }
    if (topic === 'dolar-gap') {
      var c = el.getAttribute('data-country');
      var country = c ? '<input type="hidden" name="country" value="' + esc(c) + '">' :
        '<select name="country" aria-label="' + L('Country', 'País') + '"><option value="VE">Venezuela</option><option value="AR">Argentina</option><option value="CO">Colombia</option></select>';
      return country + '<label>' + L('gap over', 'brecha sobre') + ' <input name="threshold" type="number" min="1" max="200" step="0.5" value="' + (c === 'AR' ? 5 : c === 'CO' ? 3 : 20) + '" required> %</label>';
    }
    return '';
  }

  function build(el) {
    var host = el.closest('[lang]');
    ES = /^es/.test((host && host.getAttribute('lang')) || ''); // per element, so one page can mix languages
    var NAMES = names();
    var es = ES, topic = el.getAttribute('data-topic');
    if (!NAMES[topic]) return;
    var choice = (el.getAttribute('data-choice') || '').split(',').filter(function (k) { return NAMES[k]; });
    var label = el.getAttribute('data-label') || L('🔔 Get alert', '🔔 Recibir alerta');
    el.innerHTML = (el.hasAttribute('data-open') ? '' : '<button type="button" class="ab-t" aria-expanded="false">' + esc(label) + '</button>') +
      '<form novalidate' + (el.hasAttribute('data-open') ? '' : ' hidden') + '>' +
      (choice.length > 1 ? '<select name="topic" aria-label="' + L('Alert type', 'Tipo de alerta') + '">' + choice.map(function (k) { return '<option value="' + k + '">' + NAMES[k] + '</option>'; }).join('') + '</select>' : '') +
      '<span class="ab-x"></span>' +
      '<input type="email" name="email" required autocomplete="email" placeholder="' + L('you@email.com', 'tu@correo.com') + '" aria-label="' + L('Email', 'Correo') + '">' +
      '<label class="ab-hp" aria-hidden="true">Web<input name="hp" tabindex="-1" autocomplete="off"></label>' +
      '<button type="submit">' + L('Notify me', 'Avisarme') + '</button></form><span class="ab-m" role="status"></span>';
    var form = el.querySelector('form'), msg = el.querySelector('.ab-m'), btn = form.querySelector('button[type=submit]');
    var x = el.querySelector('.ab-x'), pick = form.querySelector('select[name=topic]');
    var cur = function () { return pick ? pick.value : topic; };
    var draw = function () { x.innerHTML = extra(cur(), el); };
    draw(); if (pick) pick.addEventListener('change', draw);
    var t = el.querySelector('.ab-t');
    if (t) t.addEventListener('click', function () {
      var open = form.hidden; form.hidden = !open; t.setAttribute('aria-expanded', String(open));
      if (open) form.querySelector('input[type=email]').focus();
    });
    var say = function (cls, s) { msg.className = 'ab-m' + (cls ? ' ' + cls : ''); msg.textContent = s; };
    form.addEventListener('submit', function (e) {
      e.preventDefault(); ES = es;
      var f = new FormData(form), email = String(f.get('email') || '').trim(), k = cur();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say('err', L('Enter a valid email.', 'Escribe un correo válido.')); return; }
      var params = {};
      ['width', 'country', 'threshold'].forEach(function (n) { if (f.get(n) != null) params[n] = f.get(n); });
      if (!API) { say('err', L('Preview only: alerts are not connected yet.', 'Vista previa: las alertas aún no están conectadas.')); return; }
      btn.disabled = true; say('', L('Sending…', 'Enviando…'));
      // text/plain keeps this a "simple" request (no CORS preflight); Apps Script answers with JSON.
      fetch(API, { method: 'POST', body: JSON.stringify({ email: email, topic: k, params: params, lang: ES ? 'es' : 'en', page: location.pathname, hp: f.get('hp') || '' }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          ES = es; btn.disabled = false;
          if (j && j.ok) { form.hidden = true; if (t) t.hidden = true; say('ok', j.pending === false ? L('✓ You are already subscribed.', '✓ Ya estás suscrito.') : L('✓ Done. Check your inbox to confirm.', '✓ Listo. Revisa tu correo para confirmar.')); return; }
          var why = j && j.error;
          say('err', why === 'email' ? L('Enter a valid email.', 'Escribe un correo válido.') : why === 'rate' ? L('Too many tries. Try again in an hour.', 'Demasiados intentos. Prueba en una hora.') : L('Could not sign you up. Try again later.', 'No se pudo registrar. Inténtalo más tarde.'));
        })
        .catch(function () { ES = es; btn.disabled = false; say('err', L('Could not sign you up. Try again later.', 'No se pudo registrar. Inténtalo más tarde.')); });
    });
    el.hidden = false;
  }

  function init() {
    if (!API && !PREVIEW) return; // not connected: nothing shows
    if (!document.getElementById('ab-bell-css')) { var st = document.createElement('style'); st.id = 'ab-bell-css'; st.textContent = CSS; document.head.appendChild(st); }
    Array.prototype.forEach.call(document.querySelectorAll('.ab-bell'), build);
    Array.prototype.forEach.call(document.querySelectorAll('[data-ab-show]'), function (s) { s.hidden = false; });
  }
  window.ABAlerts = { api: API };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
