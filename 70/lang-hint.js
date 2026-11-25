/* Language suggestion only. Never redirects. Same script on /70/ and /70/en/. */
(function () {
  var STORE = 'el70-lang';
  var path = (location.pathname || '').replace(/\/+$/, '') || '/';
  var onEn = path === '/70/en';
  var onEs = path === '/70';
  if (!onEn && !onEs) return;

  function read() {
    try { return localStorage.getItem(STORE); } catch (e) { return 'err'; }
  }
  function write(v) {
    try { localStorage.setItem(STORE, v); } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.lang-switch a[hreflang]');
    if (!a) return;
    write(a.getAttribute('hreflang') === 'en' ? 'en' : 'es');
  });

  if (read()) return;

  var first = String((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
  var preferEn = first === 'en' || first.indexOf('en-') === 0;
  var preferEs = first === 'es' || first.indexOf('es-') === 0;
  var href, msg, label;
  if (onEs && preferEn) {
    href = '/70/en/';
    msg = 'This page is also available in English \u2192';
    label = 'Language suggestion';
  } else if (onEn && preferEs) {
    href = '/70/';
    msg = 'Esta p\u00e1gina tambi\u00e9n est\u00e1 disponible en espa\u00f1ol \u2192';
    label = 'Sugerencia de idioma';
  } else return;

  var bar = document.createElement('div');
  bar.className = 'lang-hint';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', label);
  var a = document.createElement('a');
  a.href = href;
  a.textContent = msg;
  a.addEventListener('click', function () { write(onEs ? 'en' : 'es'); });
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', onEn ? 'Cerrar' : 'Dismiss');
  btn.textContent = '\u00d7';
  btn.addEventListener('click', function () { write('dismissed'); bar.remove(); });
  bar.appendChild(a);
  bar.appendChild(btn);
  document.body.insertBefore(bar, document.body.firstChild);
})();
