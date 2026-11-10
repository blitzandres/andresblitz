// /bitcoin/ — days Bitcoin spent in each USD price bracket.
// Completed days: baked Yahoo Finance BTC-USD daily closes (inline JSON from /bitcoin/history.json), from 2014-09-17.
// Today: live BTC/USD print, CoinGecko simple/price, polled ~60 s. Coinbase public spot is a fallback for the live print only.
(function () {
  'use strict';
  var SIZES = [3000, 5000, 10000, 15000], POLL = 60000, DAY = 864e5;
  var CG_LIVE = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,cad&include_24hr_change=true&include_last_updated_at=true';
  var CB_LIVE = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
  var BAR = '#F59E0B', NOW = '#EA580C', INK = '#44403C', MUTED = '#A8A29E', GRID = '#E7E5E4';
  var $ = function (s) { return document.querySelector(s); };
  var D = {}; try { D = JSON.parse($('#btc-data').textContent) || {}; } catch (e) {}
  var base = (D.c || []).filter(function (r) { return r && r[1] > 0; });
  var gap = [], live = null, size = 10000;
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
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var niceMax = function (n) {
    if (!(n > 0)) return 5;
    var exp = Math.pow(10, Math.floor(Math.log10(n)));
    var m = n / exp;
    var top = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return top * exp;
  };

  function closes() {
    var seen = {}, out = [];
    base.concat(gap).forEach(function (r) { if (!seen[r[0]] && r[0] < today()) { seen[r[0]] = 1; out.push(r); } });
    return out.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
  }

  // Do not fill gaps from CoinGecko: that 365-day series would mix with the Yahoo history and distort shares.
  // The scheduled bake appends new Yahoo daily closes. If the bake lags, show the stored series until it catches up.
  function fillGap() { return Promise.resolve(); }

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
    var rows = closes(), cnt = {}, hi = -Infinity, peak = 0;
    rows.forEach(function (r) {
      var b = Math.floor(r[1] / size) * size;
      cnt[b] = (cnt[b] || 0) + 1;
      hi = Math.max(hi, b);
      if (r[1] > peak) peak = r[1];
    });
    var tb = live && live.p > 0 && iso(live.t) === today() ? Math.floor(live.p / size) * size : null;
    if (tb != null) hi = Math.max(hi, tb);
    if (live && live.p > peak) peak = live.p;
    var keys = []; if (isFinite(hi)) for (var b = 0; b <= hi; b += size) keys.push(b);
    return { rows: rows, keys: keys, done: keys.map(function (b) { return cnt[b] || 0; }), tb: tb, peak: peak };
  }

  function xPos(days, xmax, left, plotW, useSqrt) {
    if (!(days > 0)) return left;
    var t = useSqrt ? Math.sqrt(days) / Math.sqrt(xmax) : days / xmax;
    return left + t * plotW;
  }

  // $3k only: taller rows and a square-root bar scale so neighboring brackets stay visually distinct.
  // $5k / $10k / $15k keep the original linear draw() path unchanged.
  function draw3k(m, total, box, xmax) {
    var w = Math.max(1, box.clientWidth);
    var nKeys = m.keys.length;
    var rowH = 30;
    var narrow = w < 520;
    var left = narrow ? 90 : 96;
    var right = narrow ? 92 : 168;
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
    var bars = '';
    var extra = m.tb != null ? 1 : 0;
    var denom = m.rows.length + extra;
    var fs = narrow ? 11 : 12;
    for (i = 0; i < nKeys; i++) {
      var row = nKeys - 1 - i;
      var b = m.keys[row];
      var days = total[row];
      var isNow = b === m.tb;
      var cy = top + i * rowH + rowH / 2;
      var bh = Math.max(10, rowH - 8);
      var bw = days ? Math.max(2, xPos(days, xmax, left, plotW, true) - left) : 0;
      var label = k(b) + '–' + k(b + size);
      bars += '<text x="' + (left - 8) + '" y="' + cy + '" text-anchor="end" dominant-baseline="middle" fill="' + INK + '" font-size="' + fs + '">' + esc(label) + '</text>';
      if (bw) bars += '<rect x="' + left + '" y="' + (cy - bh / 2) + '" width="' + bw + '" height="' + bh + '" rx="2" fill="' + (isNow ? NOW : BAR) + '"/>';
      if (days && denom) {
        var count = days.toLocaleString('en-US') + ' days';
        var pct = '(' + (days / denom * 100).toFixed(1) + '%)';
        var nowSpan = isNow ? '<tspan fill="' + NOW + '" font-weight="600"> ← now</tspan>' : '';
        if (narrow) {
          bars += '<text x="' + (left + bw + 6) + '" y="' + (cy - 6) + '" fill="' + INK + '" font-size="11">' + esc(count) + '</text>';
          bars += '<text x="' + (left + bw + 6) + '" y="' + (cy + 8) + '" fill="' + INK + '" font-size="11">' + esc(pct) + nowSpan + '</text>';
        } else {
          bars += '<text x="' + (left + bw + 8) + '" y="' + cy + '" dominant-baseline="middle" fill="' + INK + '" font-size="12">' + esc(count + ' ' + pct);
          if (isNow) bars += nowSpan;
          bars += '</text>';
        }
      } else if (isNow) {
        bars += '<text x="' + (left + 8) + '" y="' + cy + '" dominant-baseline="middle" fill="' + NOW + '" font-size="' + fs + '" font-weight="600">← now</text>';
      }
    }
    box.setAttribute('aria-label', 'Horizontal bar chart of days Bitcoin closed in each ' + usd(size) + ' USD price bracket. Bar length uses a square-root scale.');
    box.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" role="presentation" aria-hidden="true" style="font-family:Archivo,system-ui,sans-serif;display:block">' + grid + bars + '</svg>';
  }

  function draw(m, total) {
    var box = $('#chart');
    var maxD = 1;
    total.forEach(function (v) { if (v > maxD) maxD = v; });
    var xmax = niceMax(maxD);
    if (size === 3000) { draw3k(m, total, box, xmax); return; }
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
    var bars = '';
    var extra = m.tb != null ? 1 : 0;
    var denom = m.rows.length + extra;
    for (i = 0; i < nKeys; i++) {
      var row = nKeys - 1 - i;
      var b = m.keys[row];
      var days = total[row];
      var isNow = b === m.tb;
      var cy = top + i * rowH + rowH / 2;
      var bh = Math.max(10, rowH - 8);
      var bw = days ? Math.max(2, (days / xmax) * plotW) : 0;
      var label = k(b) + '–' + k(b + size);
      bars += '<text x="' + (left - 8) + '" y="' + cy + '" text-anchor="end" dominant-baseline="middle" fill="' + INK + '" font-size="12">' + esc(label) + '</text>';
      if (bw) bars += '<rect x="' + left + '" y="' + (cy - bh / 2) + '" width="' + bw + '" height="' + bh + '" rx="2" fill="' + (isNow ? NOW : BAR) + '"/>';
      if (days && denom) {
        var end = days.toLocaleString('en-US') + ' days (' + (days / denom * 100).toFixed(1) + '%)';
        bars += '<text x="' + (left + bw + 8) + '" y="' + cy + '" dominant-baseline="middle" fill="' + INK + '" font-size="12">' + esc(end);
        if (isNow) bars += '<tspan fill="' + NOW + '" font-weight="600"> ← now</tspan>';
        bars += '</text>';
      } else if (isNow) {
        bars += '<text x="' + (left + 8) + '" y="' + cy + '" dominant-baseline="middle" fill="' + NOW + '" font-size="12" font-weight="600">← now</text>';
      }
    }
    box.setAttribute('aria-label', 'Horizontal bar chart of days Bitcoin closed in each ' + usd(size) + ' USD price bracket');
    box.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" role="presentation" aria-hidden="true" style="font-family:Archivo,system-ui,sans-serif">' + grid + bars + '</svg>';
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
    if (!m.keys.length) { box.textContent = 'History is loading.'; return; }
    var total = m.done.map(function (d, i) { return d + (m.keys[i] === m.tb ? 1 : 0); });
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
    setSize(2);
    fillGap().then(render);
    getLive(); setInterval(getLive, POLL);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && (!live || Date.now() - live.t > POLL)) getLive(); });
    var rw; addEventListener('resize', function () { clearTimeout(rw); rw = setTimeout(render, 150); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
