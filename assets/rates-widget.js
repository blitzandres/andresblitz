/* "Feed de tasas" widget: renders /rates/index.json (built by scripts/bake-feed.mjs) into
   any element with [data-rates-widget]. Optional data-highlight="<series key>" puts that
   series first. No third-party requests from the visitor's browser. */
(function () {
  var els = document.querySelectorAll('[data-rates-widget]'); if (!els.length) return;
  var css = '.rw{background:#0b0f1c;border:1px solid #1a2135;border-radius:12px;padding:12px 14px;margin:20px 0;color:#e7eaf2;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif}' +
    '.rw h2{font-size:16px;margin:0 0 6px;display:flex;justify-content:space-between;align-items:baseline;gap:8px}.rw h2 a{font-size:12.5px;font-weight:600;color:#7fc8a9;white-space:nowrap}' +
    '.rw ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 14px}.rw li{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #1a2135;padding:4px 0;min-width:0}' +
    '.rw li span{color:#9aa3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rw li b{font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:600}.rw a{color:#7fc8a9}.rw p{margin:6px 0 0;font-size:12px;color:#9aa3b8}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var SHORT = { 'tasa-bcv': 'Venezuela · BCV', 'dolar-argentina': 'Argentina · oficial', 'dolar-argentina-blue': 'Argentina · blue', 'dolar-colombia': 'Colombia · TRM', 'dolar-mexico': 'México · FIX', 'dolar-peru': 'Perú', 'dolar-chile': 'Chile · observado', 'bitcoin': 'Bitcoin (USD)', 'usdcad': 'USD/CAD', 'boc-policy': 'Banco de Canadá', 'fed-funds-target': 'Fed (objetivo)', 'boe-bank-rate': 'Banco de Inglaterra', 'pboc-lpr': 'China · LPR 1 año' };
  var nf = function (v, u) { return typeof v === 'number' ? v.toLocaleString('es', { minimumFractionDigits: u === '%' ? 2 : 0, maximumFractionDigits: v < 100 ? 4 : 2, useGrouping: 'always' }) + (u === '%' ? ' %' : '') : v + (u === '%' ? ' %' : ''); };
  var ctl = window.AbortController ? new AbortController() : null; setTimeout(function () { ctl && ctl.abort(); }, 5000);
  fetch('/rates/index.json', Object.assign({ cache: 'no-cache' }, ctl ? { signal: ctl.signal } : {})).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    els.forEach(function (el) {
      var keys = Object.keys(d.series), hi = el.getAttribute('data-highlight');
      if (hi) keys.sort(function (a, b) { return (b.indexOf(hi) === 0) - (a.indexOf(hi) === 0); });
      var box = document.createElement('section'); box.className = 'rw'; box.setAttribute('aria-label', 'Feed de tasas');
      var h = document.createElement('h2'); h.textContent = 'Feed de tasas';
      var a = document.createElement('a'); a.href = '/rates/feed.xml'; a.textContent = 'RSS'; a.type = 'application/rss+xml'; h.appendChild(a); box.appendChild(h);
      var ul = document.createElement('ul');
      keys.forEach(function (k) {
        var s = d.series[k], li = document.createElement('li'), n = document.createElement('span'), v = document.createElement('b');
        n.textContent = SHORT[k] || s.title; li.title = s.title + ' · ' + s.source + ' · ' + new Date(s.time).toLocaleString('es');
        v.textContent = nf(s.value, s.unit); li.appendChild(n); li.appendChild(v); ul.appendChild(li);
      });
      box.appendChild(ul);
      var p = document.createElement('p'); p.innerHTML = 'Cada dato con su fuente y hora (pasá el cursor). <a href="/projects/currency-rss/">Sobre este feed</a>'; box.appendChild(p);
      el.replaceChildren(box);
    });
  }).catch(function () {});
})();
