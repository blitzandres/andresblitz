// /bitcoin/ — days Bitcoin spent in each USD price bracket.
// Completed UTC days: baked CoinGecko daily closes (inline JSON from /bitcoin/history.json).
// Today: live BTC/USD print, CoinGecko simple/price (same call as the rates feed), polled ~60 s.
// Coinbase public spot is a fallback for the live print only, used when CoinGecko fails. One quote at a time.
(function () {
  'use strict';
  var SIZES = [3000, 5000, 10000, 15000], POLL = 60000, DAY = 864e5;
  var CG_LIVE = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,cad&include_24hr_change=true&include_last_updated_at=true';
  var CB_LIVE = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
  var $ = function (s) { return document.querySelector(s); };
  var D = {}; try { D = JSON.parse($('#btc-data').textContent) || {}; } catch (e) {}
  var base = (D.c || []).filter(function (r) { return r && r[1] > 0; });
  var gap = [], live = null, size = 10000, plot = null, shape = '';
  var ls = { get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var iso = function (ms) { return new Date(ms).toISOString().slice(0, 10); };
  var usd = function (n, d) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var k = function (n) { return '$' + (n / 1000).toLocaleString('en-US') + 'k'; };
  var pt = function (ms) { return new Date(ms).toLocaleString('en-CA', { timeZone: 'America/Vancouver', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PT'; };
  var today = function () { return iso(Date.now()); };

  function closes() {
    var seen = {}, out = [];
    base.concat(gap).forEach(function (r) { if (!seen[r[0]] && r[0] < today()) { seen[r[0]] = 1; out.push(r); } });
    return out.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
  }

  // Fill days completed after the last bake (only if the bake fell behind), CoinGecko only, cached 6 h.
  function fillGap() {
    var end = D.end, yday = iso(Date.now() - DAY);
    if (!end || end >= yday) return Promise.resolve();
    var c = ls.get('btc-gap');
    if (c && c.end === end && Date.now() - c.t < 6 * 36e5) { gap = c.rows || []; return Promise.resolve(); }
    var days = Math.min(365, Math.ceil((Date.parse(yday) - Date.parse(end)) / DAY) + 2);
    return fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=' + days + '&interval=daily')
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (j) {
        gap = (j.prices || []).filter(function (p) { return p[0] % DAY === 0 && p[1] > 0; })
          .map(function (p) { return [iso(p[0] - DAY), Math.round(p[1] * 100) / 100]; })
          .filter(function (r) { return r[0] > end; });
        ls.set('btc-gap', { end: end, t: Date.now(), rows: gap });
      }).catch(function () {});
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
    var rows = closes(), cnt = {}, lo = Infinity, hi = -Infinity;
    rows.forEach(function (r) { var b = Math.floor(r[1] / size) * size; cnt[b] = (cnt[b] || 0) + 1; lo = Math.min(lo, b); hi = Math.max(hi, b); });
    var tb = live && live.p > 0 && iso(live.t) === today() ? Math.floor(live.p / size) * size : null;
    if (tb != null) { lo = Math.min(lo, tb); hi = Math.max(hi, tb); }
    var keys = []; if (isFinite(lo)) for (var b = lo; b <= hi; b += size) keys.push(b);
    return { rows: rows, keys: keys, done: keys.map(function (b) { return cnt[b] || 0; }), tb: tb };
  }

  function render() {
    var m = model(), box = $('#chart');
    // live line
    if (live) {
      $('#px').textContent = usd(live.p);
      $('#pxs').innerHTML = '';
      var a = document.createElement('a'); a.href = live.url; a.rel = 'noopener'; a.textContent = live.src;
      $('#pxs').append(a, document.createTextNode(' · as of ' + pt(live.t) + (live.stale ? ' (last good price; retrying)' : '')));
    } else $('#pxs').textContent = 'Live price unavailable right now; chart shows completed days only.';
    if (!m.keys.length) { box.textContent = 'History is loading.'; return; }
    var total = m.done.map(function (d, i) { return d + (m.keys[i] === m.tb ? 1 : 0); });
    var xs = m.keys.map(function (_, i) { return i; });
    var n = m.rows.length, first = n ? m.rows[0][0] : '', last = n ? m.rows[n - 1][0] : '';
    // summary sentence
    if (m.tb != null) {
      var i = m.keys.indexOf(m.tb);
      $('#now').textContent = 'Today (UTC, still open) counts at ' + usd(live.p) + ', in the ' + k(m.tb) + '–' + k(m.tb + size) + ' bracket. Bitcoin closed in this bracket on ' + m.done[i] + ' of ' + n + ' completed days (' + first + ' to ' + last + ').';
    } else $('#now').textContent = n + ' completed days (' + first + ' to ' + last + ').';
    // accessible table for the current size
    var t = '<table class="bt"><caption>Days by daily close, ' + usd(size) + ' brackets (' + first + ' to ' + last + ', plus today at the live price)</caption><thead><tr><th scope="col">Price bracket (USD)</th><th scope="col" class="n">Days</th><th scope="col" class="n">Share</th></tr></thead><tbody>';
    for (var j = m.keys.length - 1; j >= 0; j--) { if (!total[j]) continue; t += '<tr' + (m.keys[j] === m.tb ? ' class="cur"' : '') + '><td>' + k(m.keys[j]) + '–' + k(m.keys[j] + size) + (m.keys[j] === m.tb ? ' (today)' : '') + '</td><td class="n">' + total[j] + '</td><td class="n">' + (total[j] / (n + (m.tb != null ? 1 : 0)) * 100).toFixed(1) + '%</td></tr>'; }
    $('#tbl').innerHTML = t + '</tbody></table>';
    if (!window.uPlot) return;
    var data = [xs, total, m.done], keys = m.keys;
    var s = size + ':' + keys.join(',');
    var w = Math.max(280, box.clientWidth);
    if (plot && s === shape) { plot.setData(data); return; }
    if (plot) plot.destroy();
    box.textContent = ''; shape = s;
    var bars = uPlot.paths.bars({ size: [0.82, 64], gap: 1 });
    var lab = function (v) { var b = keys[Math.round(v)]; return b == null ? '' : k(b) + '–' + k(b + size); };
    plot = new uPlot({
      width: w, height: 300, cursor: { points: { show: false }, drag: { x: false, y: false } },
      scales: { x: { time: false, range: function () { return [-0.6, keys.length - 0.4]; } }, y: { range: function (u, a, b) { return [0, Math.max(1, b) * 1.08]; } } },
      axes: [
        { stroke: '#97a3b8', grid: { show: false }, ticks: { show: false }, space: 34, incrs: [1, 2, 3, 4, 5, 10, 20], values: function (u, v) { return v.map(function (x) { var b = keys[x]; return Number.isInteger(x) && b != null ? k(b) : ''; }); } },
        { stroke: '#97a3b8', grid: { stroke: 'rgba(148,163,184,0.12)' }, label: 'Days', values: function (u, v) { return v.map(function (x) { return Number.isInteger(x) ? x : ''; }); } }
      ],
      series: [
        { label: 'Bracket', value: function (u, v) { return v == null ? '—' : lab(v); } },
        { label: 'Today (live, incl.)', fill: '#fbbf24', stroke: '#fbbf24', width: 0, paths: bars, points: { show: false }, value: function (u, v) { return v == null ? '—' : v + ' d'; } },
        { label: 'Completed days', fill: 'rgba(91,141,239,0.85)', stroke: '#5b8def', width: 0, paths: bars, points: { show: false }, value: function (u, v) { return v == null ? '—' : v + ' d'; } }
      ]
    }, data, box);
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
    var rw; addEventListener('resize', function () { clearTimeout(rw); rw = setTimeout(function () { if (plot) plot.setSize({ width: Math.max(280, $('#chart').clientWidth), height: 300 }); }, 150); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
