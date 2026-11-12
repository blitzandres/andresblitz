// /bitcoin/ — days Bitcoin spent in each USD price bracket.
// Completed days: baked Yahoo Finance BTC-USD daily closes, fetched from /bitcoin/history.json after first paint, from 2014-09-17.
// Until it loads, the page shows the static $10k table and last close that the bake writes into the HTML.
// Today: live BTC/USD print, CoinGecko simple/price, polled ~60 s. Coinbase public spot is a fallback for the live print only.
// Bars are stacked by Bitcoin halving era (UTC close date). Hover or tap a period in the key to highlight it.
(function () {
  'use strict';
  var SIZES = [2000, 3000, 4000, 5000, 10000, 15000], POLL = 60000, DAY = 864e5;
  var CG_LIVE = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,cad&include_24hr_change=true&include_last_updated_at=true';
  var CB_LIVE = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
  var NOW = '#EA580C', INK = '#44403C', MUTED = '#A8A29E', GRID = '#E7E5E4';
  // Soft highlights on cream #FFFBF6, same warm family as site amber #F59E0B. Dates are inclusive UTC close dates.
  var ERAS = [
    { id: 'e0', name: '2014–2016', color: '#D4C4A8', halving: null },
    { id: 'e1', name: '2016–2020', color: '#E8BE72', halving: 'Jul 9, 2016' },
    { id: 'e2', name: '2020–2024', color: '#E39B4A', halving: 'May 11, 2020' },
    { id: 'e3', name: '2024–now', color: '#D4846A', halving: 'Apr 20, 2024' }
  ];
  var $ = function (s) { return document.querySelector(s); };
  var D = {}, base = [];
  var gap = [], live = null, size = 10000;
  var pinnedEra = null, hoverEra = null, legendReady = false;
  var ls = { get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var iso = function (ms) { return new Date(ms).toISOString().slice(0, 10); };
  var usd = function (n, d) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var k = function (n) { return n === 0 ? '$0' : '$' + (n / 1000).toLocaleString('en-US') + 'k'; };
  var pt = function (ms) { return new Date(ms).toLocaleString('en-CA', { timeZone: 'America/Vancouver', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PT'; };
  var today = function () { return iso(Date.now()); };
  var pretty = function (day) {
    if (!day) return '';
    return new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };
  var shortDate = function (day) {
    if (!day) return '';
    return new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var niceMax = function (n) {
    if (!(n > 0)) return 5;
    var exp = Math.pow(10, Math.floor(Math.log10(n)));
    var m = n / exp;
    var top = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return top * exp;
  };
  // Inclusive UTC close-date bounds: to 2016-07-08, 2016-07-09 to 2020-05-10, 2020-05-11 to 2024-04-19, 2024-04-20 onward.
  var eraOf = function (day) {
    if (day <= '2016-07-08') return 0;
    if (day <= '2020-05-10') return 1;
    if (day <= '2024-04-19') return 2;
    return 3;
  };
  var eraSum = function (arr) {
    var t = 0, i;
    if (!arr) return 0;
    for (i = 0; i < 4; i++) t += arr[i] || 0;
    return t;
  };
  var activeEra = function () { return hoverEra || pinnedEra; };

  function closes() {
    var seen = {}, out = [];
    base.concat(gap).forEach(function (r) { if (!seen[r[0]] && r[0] < today()) { seen[r[0]] = 1; out.push(r); } });
    return out.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
  }

  // Do not fill gaps from CoinGecko: that 365-day series would mix with the Yahoo history and distort shares.
  // The scheduled bake appends new Yahoo daily closes. If the bake lags, show the stored series until it catches up.
  function fillGap() { return Promise.resolve(); }

  // Load the daily history after the page has painted; the static table stays visible meanwhile.
  function loadHistory() {
    return fetch('/bitcoin/history.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(function (j) {
      D = j || {};
      base = (D.closes || D.c || []).filter(function (r) { return r && r[1] > 0; });
    }, function () {});
  }

  function getLive() {
    if (document.hidden && live) return Promise.resolve();
    return fetch(CG_LIVE).then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(function (j) {
      var b = j.bitcoin; if (!(b && b.usd > 0)) throw 'empty';
      return { p: b.usd, t: (b.last_updated_at || Date.now() / 1e3) * 1e3, src: 'CoinGecko', url: 'https://www.coingecko.com/en/coins/bitcoin' };
    }).catch(function () {
      return fetch(CB_LIVE).then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(function (j) {
        var p = parseFloat(j && j.data && j.data.amount); if (!(p > 0)) throw 'empty';
        return { p: p, t: Date.now(), src: 'Coinbase (fallback)', url: 'https://www.coinbase.com/price/bitcoin' };
      });
    }).then(function (q) { live = q; live.stale = false; ls.set('btc-live', q); }, function () { if (live) live.stale = true; })
      .then(render);
  }

  function model() {
    var rows = closes(), cnt = {}, eraCnt = {}, hi = -Infinity, peak = 0;
    var eraInfo = ERAS.map(function () { return { days: 0, first: null }; });
    rows.forEach(function (r) {
      var b = Math.floor(r[1] / size) * size;
      var e = eraOf(r[0]);
      cnt[b] = (cnt[b] || 0) + 1;
      if (!eraCnt[b]) eraCnt[b] = [0, 0, 0, 0];
      eraCnt[b][e]++;
      eraInfo[e].days++;
      if (!eraInfo[e].first) eraInfo[e].first = r;
      hi = Math.max(hi, b);
      if (r[1] > peak) peak = r[1];
    });
    var tb = live && live.p > 0 && iso(live.t) === today() ? Math.floor(live.p / size) * size : null;
    if (tb != null) {
      hi = Math.max(hi, tb);
      var ce = eraOf(today());
      if (!eraCnt[tb]) eraCnt[tb] = [0, 0, 0, 0];
      eraCnt[tb][ce]++;
      eraInfo[ce].days++;
    }
    if (live && live.p > peak) peak = live.p;
    var keys = []; if (isFinite(hi)) for (var b = 0; b <= hi; b += size) keys.push(b);
    return { rows: rows, keys: keys, done: keys.map(function (b) { return cnt[b] || 0; }), eraCnt: eraCnt, eraInfo: eraInfo, tb: tb, peak: peak };
  }

  function xPos(days, xmax, left, plotW, useSqrt) {
    if (!(days > 0)) return left;
    var t = useSqrt ? Math.sqrt(days) / Math.sqrt(xmax) : days / xmax;
    return left + t * plotW;
  }

  function applyEraFocus() {
    var box = $('#chart'), legend = $('#eraLegend'), a = activeEra();
    if (box) {
      if (a) { box.classList.add('era-on'); box.setAttribute('data-focus-era', a); }
      else { box.classList.remove('era-on'); box.removeAttribute('data-focus-era'); }
    }
    if (legend) {
      if (a) { legend.classList.add('era-on'); legend.setAttribute('data-focus-era', a); }
      else { legend.classList.remove('era-on'); legend.removeAttribute('data-focus-era'); }
      legend.querySelectorAll('button[data-era]').forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-era') === pinnedEra));
      });
    }
  }

  function previewEra(id) { hoverEra = id; applyEraFocus(); }
  function toggleEra(id) { pinnedEra = pinnedEra === id ? null : id; hoverEra = null; applyEraFocus(); }

  function bindSegments(box) {
    box.querySelectorAll('.seg').forEach(function (el) {
      var id = el.getAttribute('data-era');
      el.addEventListener('mouseenter', function () { previewEra(id); });
      el.addEventListener('mouseleave', function () { previewEra(null); });
      el.addEventListener('click', function (ev) { ev.stopPropagation(); toggleEra(id); });
    });
  }

  function stackBar(left, cy, bh, daysByEra, days, xmax, plotW, useSqrt, label, clipId) {
    var html = '', acc = 0, i, d, x0, x1, w, title;
    var bw = days ? Math.max(2, xPos(days, xmax, left, plotW, useSqrt) - left) : 0;
    if (!bw) return { html: '', bw: 0, defs: '' };
    var defs = '<clipPath id="' + clipId + '"><rect x="' + left + '" y="' + (cy - bh / 2) + '" width="' + bw + '" height="' + bh + '" rx="2"/></clipPath>';
    html += '<g clip-path="url(#' + clipId + ')">';
    for (i = 0; i < ERAS.length; i++) {
      d = daysByEra[i] || 0;
      if (!d) continue;
      x0 = acc === 0 ? left : xPos(acc, xmax, left, plotW, useSqrt);
      acc += d;
      x1 = xPos(acc, xmax, left, plotW, useSqrt);
      w = Math.max(0.5, x1 - x0);
      title = ERAS[i].name + ': ' + d.toLocaleString('en-US') + ' of ' + days.toLocaleString('en-US') + ' days in ' + label;
      html += '<rect class="seg" data-era="' + ERAS[i].id + '" x="' + x0 + '" y="' + (cy - bh / 2) + '" width="' + w + '" height="' + bh + '" fill="' + ERAS[i].color + '"><title>' + esc(title) + '</title></rect>';
    }
    html += '</g>';
    return { html: html, bw: bw, defs: defs };
  }

  function eraAria(m, extra) {
    var bits = ERAS.map(function (er, i) {
      return er.name + ' ' + (m.eraInfo[i].days || 0).toLocaleString('en-US') + ' days';
    }).join(', ');
    return 'Horizontal bar chart of days Bitcoin closed in each ' + usd(size) + ' USD price bracket, split by halving period: ' + bits + '.' + (extra || '');
  }

  function paintLegend(m) {
    var box = $('#eraLegend');
    if (!box) return;
    if (!legendReady) {
      box.hidden = false;
      box.innerHTML = '<p class="era-hint">Each bar is split by Bitcoin’s halving periods. Hover or tap a period to highlight it across every bracket.</p><div class="era-items" role="group" aria-label="Highlight a halving period"></div>';
      box.addEventListener('mouseover', function (ev) {
        var btn = ev.target.closest && ev.target.closest('button[data-era]');
        if (btn) previewEra(btn.getAttribute('data-era'));
      });
      box.addEventListener('mouseleave', function () { previewEra(null); });
      box.addEventListener('click', function (ev) {
        var btn = ev.target.closest && ev.target.closest('button[data-era]');
        if (btn) toggleEra(btn.getAttribute('data-era'));
      });
      legendReady = true;
    }
    var items = box.querySelector('.era-items');
    if (!items) return;
    items.innerHTML = ERAS.map(function (er, i) {
      var info = m.eraInfo[i] || { days: 0, first: null };
      var firstPx = info.first ? usd(Math.round(info.first[1])) : '';
      var meta;
      if (er.halving) meta = 'Halving ' + er.halving + (firstPx ? ' · from ' + firstPx : '');
      else meta = (firstPx ? 'from ' + firstPx + ' · ' : '') + (info.first ? shortDate(info.first[0]) : '');
      var days = (info.days || 0).toLocaleString('en-US') + ' days';
      var current = i === ERAS.length - 1;
      var aria = er.name + (current ? ', current period' : '') + '. ' + meta + '. ' + days + '.';
      return '<button type="button" data-era="' + er.id + '" aria-pressed="false" aria-label="' + esc(aria) + '"' + (current ? ' class="is-current"' : '') + '>' +
        '<span class="era-name"><span class="swatch" style="background:' + er.color + '"></span>' + esc(er.name) +
        (current ? ' <em class="era-now">current</em>' : '') + '</span>' +
        '<span class="era-meta">' + esc(meta) + '</span>' +
        '<span class="era-days">' + esc(days) + '</span></button>';
    }).join('');
    applyEraFocus();
  }

  // $2k / $3k / $4k: taller rows and a square-root bar scale so neighboring brackets stay visually distinct.
  // $5k / $10k / $15k keep the original linear draw() path unchanged.
  function draw3k(m, total, box, xmax) {
    var w = Math.max(1, box.clientWidth);
    var nKeys = m.keys.length;
    var rowH = 30;
    var narrow = w < 520;
    var left = narrow ? 90 : 96;
    var right = narrow ? 100 : 168;
    var top = 8, bot = 44;
    var plotW = Math.max(80, w - left - right);
    var plotH = rowH * nKeys;
    var h = top + bot + plotH;
    var steps = narrow ? 3 : 4;
    var grid = '', i, tv, x, raw, exp;
    var tickVals = [];
    for (i = 0; i <= steps; i++) {
      raw = xmax * (i / steps) * (i / steps);
      if (i === 0) tv = 0;
      else if (i === steps) tv = xmax;
      else {
        exp = Math.pow(10, Math.floor(Math.log10(raw)));
        tv = Math.round(raw / exp) * exp;
      }
      if (!tickVals.length || tickVals[tickVals.length - 1] !== tv) tickVals.push(tv);
    }
    for (i = 0; i < tickVals.length; i++) {
      tv = tickVals[i];
      x = xPos(tv, xmax, left, plotW, true);
      grid += '<line x1="' + x + '" y1="' + top + '" x2="' + x + '" y2="' + (top + plotH) + '" stroke="' + GRID + '" stroke-width="1" stroke-dasharray="3 4"/>';
      grid += '<text x="' + x + '" y="' + (top + plotH + 16) + '" text-anchor="middle" fill="' + MUTED + '" font-size="11">' + tv + '</text>';
    }
    grid += '<text x="' + left + '" y="' + (top + plotH + 34) + '" text-anchor="start" fill="' + MUTED + '" font-size="11">bar length: square-root scale</text>';
    var bars = '', defs = '', extra = m.tb != null ? 1 : 0;
    var denom = m.rows.length + extra;
    var fs = narrow ? 11 : 12;
    for (i = 0; i < nKeys; i++) {
      var row = nKeys - 1 - i;
      var b = m.keys[row];
      var days = total[row];
      var isNow = b === m.tb;
      var cy = top + i * rowH + rowH / 2;
      var bh = Math.max(10, rowH - 8);
      var label = k(b) + '–' + k(b + size);
      var stack = stackBar(left, cy, bh, m.eraCnt[b] || [0, 0, 0, 0], days, xmax, plotW, true, label, 'barclip' + i);
      bars += '<text x="' + (left - 8) + '" y="' + cy + '" text-anchor="end" dominant-baseline="middle" fill="' + INK + '" font-size="' + fs + '">' + esc(label) + '</text>';
      defs += stack.defs;
      bars += stack.html;
      if (isNow && stack.bw) bars += '<rect class="now-ring" x="' + left + '" y="' + (cy - bh / 2) + '" width="' + stack.bw + '" height="' + bh + '" rx="2" fill="none" stroke="' + NOW + '" stroke-width="1.5"/>';
      var bw = stack.bw;
      if (days && denom) {
        var count = days.toLocaleString('en-US') + ' days';
        var pct = '(' + (days / denom * 100).toFixed(1) + '%)';
        var nowSpan = isNow ? '<tspan fill="' + NOW + '" font-weight="600"> ← now</tspan>' : '';
        if (narrow) {
          var compact = days.toLocaleString('en-US') + 'd · ' + (days / denom * 100).toFixed(1) + '%';
          bars += '<text x="' + (left + bw + 6) + '" y="' + cy + '" dominant-baseline="middle" fill="' + INK + '" font-size="10">' + esc(compact);
          if (isNow) bars += nowSpan;
          bars += '</text>';
        } else {
          bars += '<text x="' + (left + bw + 8) + '" y="' + cy + '" dominant-baseline="middle" fill="' + INK + '" font-size="12">' + esc(count + ' ' + pct);
          if (isNow) bars += nowSpan;
          bars += '</text>';
        }
      } else if (isNow) {
        bars += '<text x="' + (left + 8) + '" y="' + cy + '" dominant-baseline="middle" fill="' + NOW + '" font-size="' + fs + '" font-weight="600">← now</text>';
      }
    }
    box.setAttribute('aria-label', eraAria(m, ' Bar length uses a square-root scale.'));
    box.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" role="presentation" aria-hidden="true" style="font-family:Archivo,system-ui,sans-serif;display:block"><defs>' + defs + '</defs>' + grid + bars + '</svg>';
    bindSegments(box);
    applyEraFocus();
  }

  function draw(m, total) {
    var box = $('#chart');
    var maxD = 1;
    total.forEach(function (v) { if (v > maxD) maxD = v; });
    var xmax = niceMax(maxD);
    if (size === 2000 || size === 3000 || size === 4000) { draw3k(m, total, box, xmax); return; }
    var w = Math.max(320, box.clientWidth);
    var nKeys = m.keys.length;
    var rowH = nKeys > 28 ? 22 : nKeys > 18 ? 26 : 30;
    var left = 86, right = 168, top = 8, bot = 26;
    var plotW = Math.max(80, w - left - right);
    var plotH = rowH * nKeys;
    var h = top + bot + plotH;
    var steps = 4, grid = '', i;
    for (i = 0; i <= steps; i++) {
      var tv = Math.round(xmax * i / steps);
      var x = left + (tv / xmax) * plotW;
      grid += '<line x1="' + x + '" y1="' + top + '" x2="' + x + '" y2="' + (top + plotH) + '" stroke="' + GRID + '" stroke-width="1" stroke-dasharray="3 4"/>';
      grid += '<text x="' + x + '" y="' + (top + plotH + 16) + '" text-anchor="middle" fill="' + MUTED + '" font-size="11">' + tv + '</text>';
    }
    var bars = '', defs = '', extra = m.tb != null ? 1 : 0;
    var denom = m.rows.length + extra;
    for (i = 0; i < nKeys; i++) {
      var row = nKeys - 1 - i;
      var b = m.keys[row];
      var days = total[row];
      var isNow = b === m.tb;
      var cy = top + i * rowH + rowH / 2;
      var bh = Math.max(10, rowH - 8);
      var label = k(b) + '–' + k(b + size);
      var stack = stackBar(left, cy, bh, m.eraCnt[b] || [0, 0, 0, 0], days, xmax, plotW, false, label, 'barclip' + i);
      bars += '<text x="' + (left - 8) + '" y="' + cy + '" text-anchor="end" dominant-baseline="middle" fill="' + INK + '" font-size="12">' + esc(label) + '</text>';
      defs += stack.defs;
      bars += stack.html;
      if (isNow && stack.bw) bars += '<rect class="now-ring" x="' + left + '" y="' + (cy - bh / 2) + '" width="' + stack.bw + '" height="' + bh + '" rx="2" fill="none" stroke="' + NOW + '" stroke-width="1.5"/>';
      var bw = stack.bw;
      if (days && denom) {
        var end = days.toLocaleString('en-US') + ' days (' + (days / denom * 100).toFixed(1) + '%)';
        bars += '<text x="' + (left + bw + 8) + '" y="' + cy + '" dominant-baseline="middle" fill="' + INK + '" font-size="12">' + esc(end);
        if (isNow) bars += '<tspan fill="' + NOW + '" font-weight="600"> ← now</tspan>';
        bars += '</text>';
      } else if (isNow) {
        bars += '<text x="' + (left + 8) + '" y="' + cy + '" dominant-baseline="middle" fill="' + NOW + '" font-size="12" font-weight="600">← now</text>';
      }
    }
    box.setAttribute('aria-label', eraAria(m, ''));
    box.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" role="presentation" aria-hidden="true" style="font-family:Archivo,system-ui,sans-serif;display:block">' + (defs ? '<defs>' + defs + '</defs>' : '') + grid + bars + '</svg>';
    bindSegments(box);
    applyEraFocus();
  }

  function render() {
    var m = model(), box = $('#chart'), title = $('#chartTitle'), sub = $('#chartSub');
    if (title) title.textContent = 'Days Bitcoin spent in each ' + usd(size) + ' bracket';
    if (live) {
      $('#px').textContent = usd(live.p);
      $('#pxs').innerHTML = '';
      var a = document.createElement('a'); a.href = live.url; a.rel = 'noopener'; a.textContent = live.src;
      $('#pxs').append(a, document.createTextNode(' · as of ' + pt(live.t) + (live.stale ? ' (last good price; retrying)' : '')));
    } else $('#pxs').textContent = 'Live price unavailable right now; chart shows completed days only.';
    if (!base.length) return; // history.json not loaded yet: keep the static table from the HTML
    if (!m.keys.length) { box.textContent = 'History is loading.'; return; }
    var total = m.keys.map(function (b) { return eraSum(m.eraCnt[b]); });
    var n = m.rows.length, first = n ? m.rows[0][0] : '', last = n ? m.rows[n - 1][0] : '';
    if (sub) {
      var totalDays = n + (m.tb != null ? 1 : 0);
      var until = (m.tb != null ? today() : last) || D.end;
      sub.textContent = 'Yahoo Finance BTC-USD daily closes · ' + pretty(first || D.start) + (until ? ' – ' + pretty(until) : '') + (totalDays ? ' · ' + totalDays.toLocaleString('en-US') + ' days' : '');
    }
    var parts = ['A day counts in the bracket of that day’s close.'];
    if (live) parts.push('Latest print: ' + usd(live.p) + ' (' + live.src + ', ' + pt(live.t) + ')' + (live.stale ? ' — last good price; retrying' : '') + '.');
    if (m.peak) parts.push('Series high: ' + usd(m.peak) + '.');
    $('#now').textContent = parts.join(' ');
    var t = '<table class="bt"><caption>Days by daily close, ' + usd(size) + ' brackets (' + first + ' to ' + last + ', plus today at the live price)</caption><thead><tr><th scope="col">Price bracket (USD)</th><th scope="col" class="n">Days</th><th scope="col" class="n">Share</th></tr></thead><tbody>';
    for (var j = m.keys.length - 1; j >= 0; j--) {
      if (!total[j]) continue;
      t += '<tr' + (m.keys[j] === m.tb ? ' class="cur"' : '') + '><td>' + k(m.keys[j]) + '–' + k(m.keys[j] + size) + (m.keys[j] === m.tb ? ' (today)' : '') + '</td><td class="n">' + total[j] + '</td><td class="n">' + (total[j] / (n + (m.tb != null ? 1 : 0)) * 100).toFixed(1) + '%</td></tr>';
    }
    $('#tbl').innerHTML = t + '</tbody></table>';
    paintLegend(m);
    draw(m, total);
  }

  function setSize(i) {
    size = SIZES[i]; var el = $('#size'); el.value = i; el.setAttribute('aria-valuetext', usd(size));
    $('#sizeLabel').textContent = usd(size);
    document.querySelectorAll('.ticks button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.i === i)); });
    render();
  }

  function init() {
    var c = ls.get('btc-live'); if (c && c.p > 0 && Date.now() - c.t < 15 * 6e4) { live = c; live.stale = true; }
    $('#size').addEventListener('input', function () { setSize(+this.value); });
    document.querySelectorAll('.ticks button').forEach(function (b) { b.addEventListener('click', function () { setSize(+b.dataset.i); }); });
    setSize(4);
    (window.requestIdleCallback || function (f) { setTimeout(f, 1); })(function () { loadHistory().then(fillGap).then(render); }, { timeout: 1500 });
    getLive(); setInterval(getLive, POLL);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && (!live || Date.now() - live.t > POLL)) getLive(); });
    var rw; addEventListener('resize', function () { clearTimeout(rw); rw = setTimeout(render, 150); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
