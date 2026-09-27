/*
 * Project page demos for andresblitz.com
 * EVERYTHING in this file is made-up sample data for illustration.
 * Nothing here is read from, or reflects, any real account, device, network or portfolio.
 */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function money(v) {
    if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (Math.abs(v) >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v).toLocaleString('en-CA');
  }

  // Canvas that tracks its box size and DPR, and only animates when on screen.
  function makeCanvas(host, height, draw, animate) {
    var c = el('canvas'); host.appendChild(c);
    var ctx = c.getContext('2d'), W = 0, H = 0, visible = true, t0 = performance.now(), raf = 0;
    function size() {
      var w = host.clientWidth || 600, h = typeof height === 'function' ? height(w) : height;
      var d = Math.min(window.devicePixelRatio || 1, 2);
      W = w; H = h; c.width = Math.round(w * d); c.height = Math.round(h * d); c.style.height = h + 'px';
      ctx.setTransform(d, 0, 0, d, 0, 0);
      draw(ctx, W, H, (performance.now() - t0) / 1000);
    }
    function loop() {
      raf = 0;
      if (!visible) return;
      draw(ctx, W, H, (performance.now() - t0) / 1000);
      raf = requestAnimationFrame(loop);
    }
    size();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(size).observe(host); else window.addEventListener('resize', size);
    if (animate && !reduce) {
      if (typeof IntersectionObserver !== 'undefined') {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(host);
      }
      raf = requestAnimationFrame(loop);
    }
    return c;
  }

  function donut(ctx, cx, cy, r, parts, colors, thick) {
    var tot = parts.reduce(function (a, b) { return a + b; }, 0), a = -Math.PI / 2;
    parts.forEach(function (v, i) {
      var s = (v / tot) * Math.PI * 2;
      ctx.beginPath(); ctx.strokeStyle = colors[i]; ctx.lineWidth = thick;
      ctx.arc(cx, cy, r, a + 0.02, a + s - 0.02); ctx.stroke(); a += s;
    });
  }
  function lineChart(ctx, x, y, w, h, series, color, fill, lo, hi) {
    var min = lo != null ? lo : Math.min.apply(null, series), max = hi != null ? hi : Math.max.apply(null, series), n = series.length;
    ctx.beginPath();
    series.forEach(function (v, i) {
      var px = x + (i / (n - 1)) * w, py = y + h - ((v - min) / (max - min || 1)) * h;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    if (fill) {
      ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
      var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, fill); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fill();
    }
  }

  var demos = {};

  // ---------------- RealWealth Portfolio (sample portfolio) ----------------
  demos.realwealth = function (host) {
    var props = [
      { n: 'Sample Home A', t: 'Home', city: 'Sampletown', buy: 910000, val: 1185000, rent: 3900, st: 'Rented' },
      { n: 'Sample Condo B', t: 'Condo', city: 'Demo City', buy: 540000, val: 612000, rent: 2450, st: 'Rented' },
      { n: 'Sample Town Home C', t: 'Town Home', city: 'Exampleville', buy: 725000, val: 798000, rent: 0, st: 'For Sale' },
      { n: 'Sample Lot D', t: 'Land', city: 'Mockridge', buy: 380000, val: 455000, rent: 0, st: 'Held' },
      { n: 'Sample BTC allocation', t: 'Bitcoin', city: 'Cold storage (sample)', buy: 120000, val: 210000, rent: 0, st: 'Held' }
    ];
    var debt = 1260000, expenses = 5200;
    var total = props.reduce(function (a, p) { return a + p.val; }, 0);
    var cost = props.reduce(function (a, p) { return a + p.buy; }, 0);
    var rent = props.reduce(function (a, p) { return a + p.rent; }, 0);
    var roi = ((total - cost) / cost * 100).toFixed(1);
    var m = el('div', 'mock');
    m.innerHTML =
      '<div class="row kpis">' +
      '<div class="kpi"><span>Total value</span><b>' + money(total) + '</b><i>▲ ' + roi + '% vs cost</i></div>' +
      '<div class="kpi"><span>Equity</span><b>' + money(total - debt) + '</b><i>' + Math.round((total - debt) / total * 100) + '% of value</i></div>' +
      '<div class="kpi"><span>Monthly rent</span><b>' + money(rent) + '</b><i>2 of 5 rented</i></div>' +
      '<div class="kpi"><span>Net / month</span><b>' + money(rent - expenses) + '</b><i class="' + (rent - expenses < 0 ? 'neg' : '') + '">after sample costs</i></div>' +
      '</div>' +
      '<div class="row" style="grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);margin-top:.75rem" data-rw-charts>' +
      '<div class="panel"><h4>Allocation by type</h4><div data-rw-donut></div></div>' +
      '<div class="panel"><h4>Portfolio value · 24 months</h4><div data-rw-line></div></div>' +
      '</div>' +
      '<div class="panel scroll-x" style="margin-top:.75rem"><h4>Holdings</h4><table><thead><tr><th>Property</th><th>Type</th><th>Area</th><th>Cost</th><th>Value</th><th>Gain</th><th>Status</th></tr></thead><tbody>' +
      props.map(function (p) {
        var g = ((p.val - p.buy) / p.buy * 100).toFixed(1);
        var cls = p.st === 'Rented' ? '' : p.st === 'For Sale' ? 'w' : 'b';
        return '<tr><td>' + p.n + '</td><td>' + p.t + '</td><td>' + p.city + '</td><td>' + money(p.buy) + '</td><td>' + money(p.val) + '</td><td style="color:#34d399">+' + g + '%</td><td><span class="pill ' + cls + '">' + p.st + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';
    host.appendChild(m);
    if (host.clientWidth < 640) m.querySelector('[data-rw-charts]').style.gridTemplateColumns = '1fr';
    var types = ['Home', 'Condo', 'Town Home', 'Land', 'Bitcoin'], cols = ['#5b8def', '#a78bfa', '#22d3ee', '#34d399', '#f7931a'];
    makeCanvas(m.querySelector('[data-rw-donut]'), 170, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      var r = Math.min(62, H / 2 - 12), cx = Math.min(W / 2, r + 20);
      donut(ctx, cx, H / 2, r, props.map(function (p) { return p.val; }), cols, 16);
      ctx.fillStyle = '#e7ecf5'; ctx.font = '600 14px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(money(total), cx, H / 2 + 5);
      ctx.textAlign = 'left'; ctx.font = '12px "Space Grotesk", sans-serif';
      types.forEach(function (t, i) {
        var y = 26 + i * 25, x = cx + r + 26; if (x > W - 60) return;
        ctx.fillStyle = cols[i]; ctx.fillRect(x, y - 9, 10, 10);
        ctx.fillStyle = '#97a3b8'; ctx.fillText(t + ' ' + Math.round(props[i].val / total * 100) + '%', x + 16, y);
      });
    });
    var r = rng(42), s = [], v = 1;
    for (var i = 0; i < 24; i++) { v *= 1 + (r() - 0.35) * 0.028; s.push(v); }
    var k0 = total / s[23]; s = s.map(function (x) { return x * k0; });
    makeCanvas(m.querySelector('[data-rw-line]'), 170, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(148,163,184,0.1)'; ctx.lineWidth = 1;
      for (var k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(0, 10 + k * (H - 30) / 3); ctx.lineTo(W, 10 + k * (H - 30) / 3); ctx.stroke(); }
      lineChart(ctx, 4, 10, W - 8, H - 30, s, '#5b8def', 'rgba(91,141,239,0.28)');
      ctx.fillStyle = '#97a3b8'; ctx.font = '11px "Space Grotesk", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('24 mo ago', 4, H - 4); ctx.textAlign = 'right'; ctx.fillText('now', W - 4, H - 4);
    });
  };

  // ---------------- Blitz Engine / lie-detector (simulated cue activity) ----------------
  demos.cuepolygon = function (host) {
    var fam = [
      { n: 'Visual', c: '#5b8def', cues: ['blink rate', 'gaze aversion', 'lip press', 'head velocity', 'brow stress', 'asymmetry'] },
      { n: 'Audio', c: '#a78bfa', cues: ['pitch shift', 'pause length', 'energy'] },
      { n: 'Linguistic', c: '#22d3ee', cues: ['hedging', 'distancing', 'detail drop', 'fillers'] },
      { n: 'Physio', c: '#34d399', cues: ['pulse (rPPG)'] }
    ];
    var axes = []; fam.forEach(function (f) { f.cues.forEach(function (q) { axes.push({ q: q, f: f }); }); });
    var r = rng(7); axes.forEach(function (a) { a.p = r() * 6.28; a.s = 0.4 + r() * 0.9; });
    makeCanvas(host, function (w) { return Math.max(300, Math.min(420, w * 0.62)); }, function (ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      var cx = W < 620 ? W / 2 : W * 0.38, cy = H / 2 + 6, R = Math.min(H / 2 - 38, cx - 70);
      var phase = (t % 24) / 24, status = phase < 0.25 ? 'CALIBRATING' : phase < 0.6 ? 'CLEAR' : phase < 0.85 ? 'WATCH' : 'CLEAR';
      var amp = status === 'CALIBRATING' ? 0.25 : status === 'WATCH' ? 0.8 : 0.42;
      for (var k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(cx, cy, R * k / 4, 0, 6.2832); ctx.strokeStyle = 'rgba(148,163,184,' + (k === 4 ? 0.22 : 0.09) + ')'; ctx.stroke(); }
      var n = axes.length, pts = [];
      axes.forEach(function (a, i) {
        var ang = -Math.PI / 2 + i / n * 6.2832;
        var v = 0.18 + amp * (0.5 + 0.5 * Math.sin(t * a.s + a.p)) * (a.f.n === 'Visual' && status === 'WATCH' ? 1.15 : 1);
        v = Math.min(v, 1);
        pts.push([cx + Math.cos(ang) * R * v, cy + Math.sin(ang) * R * v, a.f.c]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ctx.strokeStyle = 'rgba(148,163,184,0.08)'; ctx.stroke();
        if (W > 480) {
          ctx.fillStyle = '#97a3b8'; ctx.font = '10.5px "Space Grotesk", sans-serif';
          var lx = cx + Math.cos(ang) * (R + 12), ly = cy + Math.sin(ang) * (R + 12);
          ctx.textAlign = Math.cos(ang) > 0.2 ? 'left' : Math.cos(ang) < -0.2 ? 'right' : 'center';
          ctx.fillText(a.q, lx, ly + 3);
        }
      });
      ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath();
      ctx.fillStyle = 'rgba(91,141,239,0.16)'; ctx.fill(); ctx.strokeStyle = 'rgba(167,139,250,0.85)'; ctx.lineWidth = 1.6; ctx.stroke();
      pts.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, 6.2832); ctx.fillStyle = p[2]; ctx.fill(); });
      // side panel
      if (W >= 620) {
        var x = W * 0.72, y = 54;
        ctx.textAlign = 'left'; ctx.fillStyle = '#97a3b8'; ctx.font = '11px "Space Grotesk", sans-serif'; ctx.fillText('CONSENSUS STATUS', x, y);
        var col = status === 'WATCH' ? '#fbbf24' : status === 'CLEAR' ? '#34d399' : '#9db8f5';
        ctx.fillStyle = col; ctx.font = '700 22px Archivo, sans-serif'; ctx.fillText(status, x, y + 28);
        var post = status === 'CALIBRATING' ? 0 : status === 'WATCH' ? 0.52 + 0.08 * Math.sin(t) : 0.22 + 0.05 * Math.sin(t);
        ctx.fillStyle = '#97a3b8'; ctx.font = '11px "Space Grotesk", sans-serif'; ctx.fillText('POSTERIOR (FLAG ≥ 0.65)', x, y + 62);
        ctx.fillStyle = 'rgba(148,163,184,0.15)'; ctx.fillRect(x, y + 72, W * 0.22, 8);
        ctx.fillStyle = col; ctx.fillRect(x, y + 72, W * 0.22 * post, 8);
        ctx.fillStyle = 'rgba(248,113,113,0.8)'; ctx.fillRect(x + W * 0.22 * 0.65, y + 68, 2, 16);
        fam.forEach(function (f, i) {
          var yy = y + 118 + i * 28;
          ctx.fillStyle = f.c; ctx.fillRect(x, yy - 9, 10, 10);
          ctx.fillStyle = '#c9d2e3'; ctx.font = '12px "Space Grotesk", sans-serif'; ctx.fillText(f.n + ' · ' + f.cues.length + ' shown', x + 16, yy);
        });
        ctx.fillStyle = '#6b778c'; ctx.font = '11px "Space Grotesk", sans-serif';
        ctx.fillText('A flag needs ≥ 2 families to agree.', x, y + 250);
      } else {
        ctx.textAlign = 'center'; ctx.fillStyle = status === 'WATCH' ? '#fbbf24' : status === 'CLEAR' ? '#34d399' : '#9db8f5';
        ctx.font = '700 15px Archivo, sans-serif'; ctx.fillText(status, cx, 24);
      }
    }, true);
  };

  // ---------------- SIGSPACE (simulated signal world) ----------------
  demos.sigspace = function (host) {
    var realms = [
      { n: 'CARRIER', c: '#22d3ee', labels: ['edge-01', 'isp-hop', 'geo: sample', 'asn: 64500'] },
      { n: 'TOPOLOGY', c: '#a78bfa', labels: ['router', 'laptop', 'tv', 'phone', 'printer'] },
      { n: 'STREAM', c: '#34d399', labels: ['example.com', 'example.org', 'cdn.example.net', 'api.example.io'] },
      { n: 'BLUETOOTH', c: '#5b8def', labels: ['headset', 'watch', 'speaker', 'keyboard'] },
      { n: 'THREAT', c: '#f87171', labels: ['probe (sim)', 'scan (sim)', 'ok', 'ok'] }
    ];
    makeCanvas(host, function (w) { return Math.max(300, Math.min(400, w * 0.56)); }, function (ctx, W, H, t) {
      var ri = Math.floor(t / 5) % realms.length, R = realms[ri], sw = (t % 5) < 0.35;
      ctx.fillStyle = '#04060d'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(91,141,239,0.07)'; ctx.lineWidth = 1;
      for (var x = (t * 12) % 32; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (var y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      var cx = W / 2, cy = H / 2 - 10;
      [60, 105, 150].forEach(function (rr, k) { ctx.beginPath(); ctx.ellipse(cx, cy, rr * 1.5, rr * 0.62, 0, 0, 6.2832); ctx.strokeStyle = 'rgba(167,139,250,' + (0.18 - k * 0.04) + ')'; ctx.stroke(); });
      R.labels.forEach(function (lab, i) {
        var rr = [60, 105, 150][i % 3], sp = 0.35 + (i % 3) * 0.12, a = t * sp + i * 1.7;
        var px = cx + Math.cos(a) * rr * 1.5, py = cy + Math.sin(a) * rr * 0.62;
        var g = ctx.createRadialGradient(px, py, 0, px, py, 16); g.addColorStop(0, R.c); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 16, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#e7ecf5'; ctx.beginPath(); ctx.arc(px, py, 3, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(231,236,245,0.75)'; ctx.font = '11px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'center';
        ctx.fillText(lab, px, py - 12);
        ctx.strokeStyle = 'rgba(231,236,245,0.08)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
      });
      // pixel character
      var bob = Math.sin(t * 3) * 2, s = 4;
      var sprite = ['..XX..', '.XXXX.', '..XX..', '.XXXX.', 'X.XX.X', '..XX..', '.X..X.', '.X..X.'];
      sprite.forEach(function (row, j) { for (var k = 0; k < row.length; k++) if (row[k] === 'X') { ctx.fillStyle = '#e7ecf5'; ctx.fillRect(cx - 12 + k * s, cy - 18 + j * s + bob, s, s); } });
      // dial
      var dy = H - 30;
      realms.forEach(function (r2, i) {
        var dx = W / 2 + (i - 2) * Math.min(110, W / 5.6);
        ctx.fillStyle = i === ri ? r2.c : 'rgba(151,163,184,0.55)';
        ctx.font = (i === ri ? '700 ' : '') + '11px "Space Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(r2.n, dx, dy);
        if (i === ri) ctx.fillRect(dx - 16, dy + 7, 32, 2);
      });
      if (sw) { ctx.fillStyle = 'rgba(167,139,250,' + (0.35 - (t % 5)) + ')'; for (var q = 0; q < 8; q++) ctx.fillRect(0, Math.random() * H, W, 2 + Math.random() * 6); }
    }, true);
  };

  // ---------------- NetWatch (simulated network) ----------------
  demos.netwatch = function (host) {
    var m = el('div', 'mock');
    m.innerHTML =
      '<div class="row kpis">' +
      '<div class="kpi"><span>Devices seen</span><b>14</b><i>2 new today</i></div>' +
      '<div class="kpi"><span>Download</span><b data-nw-down>38.2 Mb/s</b><i>live</i></div>' +
      '<div class="kpi"><span>Upload</span><b data-nw-up>6.1 Mb/s</b><i>live</i></div>' +
      '<div class="kpi"><span>Latency</span><b>12 ms</b><i>gateway</i></div></div>' +
      '<div class="panel" style="margin-top:.75rem"><h4>Bandwidth · last 2 minutes</h4><div data-nw-chart></div></div>' +
      '<div class="row" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);margin-top:.75rem" data-nw-row>' +
      '<div class="panel scroll-x"><h4>Top connections</h4><table><thead><tr><th>Host</th><th>Port</th><th>Country</th><th>Traffic</th></tr></thead><tbody>' +
      '<tr><td>cdn.example.net</td><td>443</td><td>US</td><td>212 MB</td></tr>' +
      '<tr><td>video.example.com</td><td>443</td><td>CA</td><td>164 MB</td></tr>' +
      '<tr><td>updates.example.org</td><td>443</td><td>IE</td><td>48 MB</td></tr>' +
      '<tr><td>time.example.org</td><td>123</td><td>DE</td><td>0.2 MB</td></tr>' +
      '</tbody></table></div>' +
      '<div class="panel"><h4>Events</h4><table><tbody>' +
      '<tr><td><span class="pill r">blocked</span></td><td>Port scan from sample host</td></tr>' +
      '<tr><td><span class="pill w">watch</span></td><td>New device joined Wi-Fi</td></tr>' +
      '<tr><td><span class="pill">ok</span></td><td>DNS benchmark finished</td></tr>' +
      '<tr><td><span class="pill b">info</span></td><td>Hourly history flushed</td></tr>' +
      '</tbody></table></div></div>';
    host.appendChild(m);
    if (host.clientWidth < 640) m.querySelector('[data-nw-row]').style.gridTemplateColumns = '1fr';
    var r = rng(3), down = [], up = [];
    for (var i = 0; i < 120; i++) { down.push(30 + r() * 18); up.push(4 + r() * 4); }
    var dEl = m.querySelector('[data-nw-down]'), uEl = m.querySelector('[data-nw-up]'), last = 0;
    makeCanvas(m.querySelector('[data-nw-chart]'), 150, function (ctx, W, H, t) {
      if (t - last > 0.5) { last = t; down.shift(); up.shift(); down.push(Math.max(8, down[down.length - 1] + (r() - 0.5) * 9)); up.push(Math.max(1, up[up.length - 1] + (r() - 0.5) * 2)); dEl.textContent = down[119].toFixed(1) + ' Mb/s'; uEl.textContent = up[119].toFixed(1) + ' Mb/s'; }
      ctx.clearRect(0, 0, W, H);
      lineChart(ctx, 0, 8, W, H - 16, down, '#22d3ee', 'rgba(34,211,238,0.22)', 0, 60);
      lineChart(ctx, 0, 8, W, H - 16, up, '#a78bfa', null, 0, 60);
    }, true);
  };

  // ---------------- BluthScan (simulated Bluetooth devices) ----------------
  demos.bluetooth = function (host) {
    var names = ['Headphones', 'Smart watch', 'Speaker', 'Keyboard', 'Mouse', 'Fitness band', 'Car audio', 'Tablet', 'Game pad', 'Tag tracker', 'TV remote', 'Earbuds'];
    var r = rng(11), devs = names.map(function (n, i) { return { n: n, rssi: -40 - Math.round(r() * 50), a: ((i * 5) % 12) / 12 * 6.2832 + r() * 0.25, born: i * 1.1, x: 0, y: 0, vx: 0, vy: 0 }; });
    function col(rssi) { return rssi > -55 ? '#34d399' : rssi > -70 ? '#22d3ee' : rssi > -80 ? '#fbbf24' : '#f87171'; }
    makeCanvas(host, function (w) { return Math.max(300, Math.min(400, w * 0.56)); }, function (ctx, W, H, t) {
      ctx.fillStyle = '#04060d'; ctx.fillRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2, T = reduce ? 99 : t % 22;
      var hub = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40); hub.addColorStop(0, 'rgba(91,141,239,0.9)'); hub.addColorStop(1, 'rgba(91,141,239,0)');
      ctx.fillStyle = hub; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#e7ecf5'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 6.2832); ctx.fill();
      devs.forEach(function (d, i) {
        if (T < d.born) return;
        var dist = (Math.min(W, H) / 2 - 30) * (0.32 + 0.68 * Math.min(1, (-d.rssi - 40) / 50));
        var a = d.a + t * 0.05 * (i % 2 ? 1 : -1);
        var px = cx + Math.cos(a) * dist * 1.35, py = cy + Math.sin(a) * dist * 0.85;
        var fresh = Math.min(1, (T - d.born) / 0.6);
        ctx.strokeStyle = 'rgba(91,141,239,' + 0.18 * fresh + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
        var f = ((t * 0.4 + i * 0.13) % 1);
        ctx.fillStyle = 'rgba(167,139,250,0.9)'; ctx.fillRect(cx + (px - cx) * f - 1, cy + (py - cy) * f - 1, 2, 2);
        var c = col(d.rssi), g = ctx.createRadialGradient(px, py, 0, px, py, 14 * fresh);
        g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 14 * fresh, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#e7ecf5'; ctx.beginPath(); ctx.arc(px, py, 3, 0, 6.2832); ctx.fill();
        if (W > 460) { ctx.fillStyle = 'rgba(231,236,245,0.72)'; ctx.font = '10.5px "Space Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(d.n + ' · ' + d.rssi + ' dBm', px, py - 12); }
      });
      ctx.textAlign = 'left'; ctx.font = '11px "Space Grotesk", sans-serif';
      [['> -55', '#34d399'], ['-55…-70', '#22d3ee'], ['-70…-80', '#fbbf24'], ['< -80', '#f87171']].forEach(function (l, i) {
        ctx.fillStyle = l[1]; ctx.fillRect(14, 16 + i * 18, 9, 9); ctx.fillStyle = '#97a3b8'; ctx.fillText(l[0] + ' dBm', 29, 25 + i * 18);
      });
    }, true);
  };

  // ---------------- SIGNET (illustrative correlation grid) ----------------
  demos.signet = function (host) {
    var ch = ['TCP', 'UDP', 'DNS', 'ICMP', 'TLS', 'HTTP', 'Wi-Fi', 'BLE', 'ARP', 'BGP', 'Ports', 'WHOIS'];
    var r = rng(5), base = [];
    for (var i = 0; i < ch.length; i++) { base.push([]); for (var j = 0; j < ch.length; j++) base[i].push(r()); }
    var domains = [['IP layer', 0.83], ['RF', 0.2], ['Cellular', 0], ['Optical', 0], ['Exotic', 0]];
    makeCanvas(host, function (w) { return Math.max(320, Math.min(420, w * 0.6)); }, function (ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      var n = ch.length, gridW = Math.min(H - 70, W < 640 ? W - 90 : W * 0.5), cell = gridW / n, gx = 70, gy = 40;
      ctx.font = '10px "Space Grotesk", sans-serif'; ctx.fillStyle = '#97a3b8'; ctx.textAlign = 'right';
      for (var i = 0; i < n; i++) {
        ctx.fillStyle = '#97a3b8'; ctx.textAlign = 'right'; ctx.fillText(ch[i], gx - 6, gy + i * cell + cell / 2 + 3);
        for (var j = 0; j < n; j++) {
          if (j > i) continue;
          var v = i === j ? 1 : Math.pow(Math.abs(Math.sin(t * 0.4 * (0.3 + base[i][j]) + base[j][i] * 6)), 2.2);
          var hot = v > 0.8 && i !== j;
          ctx.fillStyle = hot ? 'rgba(251,191,36,' + (0.45 + 0.5 * v) + ')' : 'rgba(91,141,239,' + (0.08 + 0.55 * v * 0.8) + ')';
          ctx.fillRect(gx + j * cell + 1, gy + i * cell + 1, cell - 2, cell - 2);
        }
      }
      ctx.textAlign = 'left'; ctx.fillStyle = '#97a3b8'; ctx.fillText('Pairwise correlation ρ (illustrative) · amber = |ρ| > 0.8 “wave”', gx, gy - 14);
      if (W >= 640) {
        var x = gx + gridW + 40, bw = W - x - 30;
        ctx.fillStyle = '#97a3b8'; ctx.font = '11px "Space Grotesk", sans-serif'; ctx.fillText('CAPTURE COVERAGE BY DOMAIN (THESIS TARGETS)', x, gy);
        domains.forEach(function (d, k) {
          var y = gy + 26 + k * 44;
          ctx.fillStyle = '#c9d2e3'; ctx.font = '12px "Space Grotesk", sans-serif'; ctx.fillText(d[0], x, y);
          ctx.fillStyle = 'rgba(148,163,184,0.15)'; ctx.fillRect(x, y + 8, bw, 8);
          ctx.fillStyle = '#5b8def'; ctx.fillRect(x, y + 8, bw * d[1], 8);
          ctx.fillStyle = '#97a3b8'; ctx.textAlign = 'right'; ctx.fillText(Math.round(d[1] * 100) + '%', x + bw, y); ctx.textAlign = 'left';
        });
        ctx.fillStyle = '#6b778c'; ctx.fillText('42 channels → 861 pairwise axes', x, gy + 26 + 5 * 44 + 6);
      }
    }, true);
  };

  // ---------------- Weinstein Stage Matrix (synthetic prices) ----------------
  demos.weinstein = function (host) {
    // Synthetic weekly closes built from four regimes — not any real ticker.
    var r = rng(2026), px = [], p = 40;
    var regimes = [[60, 0.0005, 0.02], [70, 0.009, 0.025], [50, 0.0, 0.03], [60, -0.008, 0.03], [40, 0.0005, 0.02]];
    regimes.forEach(function (g) { for (var i = 0; i < g[0]; i++) { p *= 1 + g[1] + (r() - 0.5) * g[2]; px.push(p); } });
    var ma = px.map(function (_, i) { var s = 0, k = 0; for (var j = Math.max(0, i - 29); j <= i; j++) { s += px[j]; k++; } return s / k; });
    var stage = px.map(function (v, i) {
      if (i < 30) return 1;
      var slope = (ma[i] - ma[i - 5]) / ma[i] * 100;
      if (slope > 0.6 && v > ma[i]) return 2;
      if (slope < -0.6 && v < ma[i]) return 4;
      var prev = ma[Math.max(0, i - 40)];
      return ma[i] > prev ? 3 : 1;
    });
    for (var i = 2; i < stage.length - 2; i++) if (stage[i - 1] === stage[i + 1] && stage[i] !== stage[i - 1]) stage[i] = stage[i - 1];
    var sc = { 1: 'rgba(148,163,184,0.10)', 2: 'rgba(52,211,153,0.12)', 3: 'rgba(251,191,36,0.12)', 4: 'rgba(248,113,113,0.12)' };
    var names = { 1: 'Stage 1 · Basing', 2: 'Stage 2 · Advancing', 3: 'Stage 3 · Topping', 4: 'Stage 4 · Declining' };
    makeCanvas(host, function (w) { return Math.max(300, Math.min(400, w * 0.52)); }, function (ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      var n = px.length, shown = reduce ? n : Math.min(n, Math.floor(40 + (t % 16) / 12 * n));
      var top = 34, bot = H - 26, min = Math.min.apply(null, px) * 0.95, max = Math.max.apply(null, px) * 1.03;
      function X(i) { return 10 + i / (n - 1) * (W - 20); } function Y(v) { return bot - (v - min) / (max - min) * (bot - top); }
      for (var i = 0; i < shown; i++) { ctx.fillStyle = sc[stage[i]]; ctx.fillRect(X(i) - (W - 20) / n / 2, top, (W - 20) / n + 1, bot - top); }
      for (i = 0; i < shown; i++) {
        var o = i ? px[i - 1] : px[i], c = px[i], up = c >= o;
        ctx.strokeStyle = up ? '#34d399' : '#f87171'; ctx.lineWidth = Math.max(1, (W - 20) / n * 0.6);
        ctx.beginPath(); ctx.moveTo(X(i), Y(o)); ctx.lineTo(X(i), Y(c) + (Math.abs(Y(c) - Y(o)) < 1 ? 1 : 0)); ctx.stroke();
      }
      ctx.beginPath(); for (i = 0; i < shown; i++) { if (i) ctx.lineTo(X(i), Y(ma[i])); else ctx.moveTo(X(i), Y(ma[i])); }
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = '11px "Space Grotesk", sans-serif'; ctx.textAlign = 'left';
      var lx = 12;
      [1, 2, 3, 4].forEach(function (s) { var tw = ctx.measureText(names[s]).width; if (lx + tw + 30 > W) return; ctx.fillStyle = sc[s].replace(/0\.1[02]\)/, '0.7)'); ctx.fillRect(lx, 12, 10, 10); ctx.fillStyle = '#97a3b8'; ctx.fillText(names[s], lx + 14, 21); lx += tw + 30; });
      ctx.fillStyle = '#a78bfa'; ctx.textAlign = 'right'; ctx.fillText('30-week MA', W - 12, H - 8);
      ctx.fillStyle = '#6b778c'; ctx.textAlign = 'left'; ctx.fillText('Synthetic weekly bars', 12, H - 8);
      var cur = stage[shown - 1]; ctx.fillStyle = '#e7ecf5'; ctx.font = '600 12px "Space Grotesk", sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('Now: ' + names[cur], W - 12, 50);
    }, true);
  };

  // ---------------- blitz-analytics (sample traffic) ----------------
  demos.analytics = function (host) {
    var r = rng(99), days = []; for (var i = 0; i < 30; i++) days.push(Math.round(40 + r() * 60 + (i % 7 === 5 ? 30 : 0)));
    var m = el('div', 'mock');
    m.innerHTML =
      '<div class="row kpis">' +
      '<div class="kpi"><span>Visitors · 30d</span><b>1,904</b><i>sample</i></div>' +
      '<div class="kpi"><span>Page views</span><b>3,512</b><i>sample</i></div>' +
      '<div class="kpi"><span>Avg. engaged</span><b>1m 42s</b><i>sample</i></div>' +
      '<div class="kpi"><span>Live now</span><b data-an-live>3</b><i>sample</i></div></div>' +
      '<div class="panel" style="margin-top:.75rem"><h4>Daily visitors · 30 days</h4><div data-an-chart></div></div>' +
      '<div class="row" style="grid-template-columns:1fr 1fr;margin-top:.75rem" data-an-row>' +
      '<div class="panel"><h4>Top pages</h4><table><tbody><tr><td>/</td><td style="text-align:right">58%</td></tr><tr><td>/projects/</td><td style="text-align:right">17%</td></tr><tr><td>/#play</td><td style="text-align:right">11%</td></tr><tr><td>/projects/blitzys-world/</td><td style="text-align:right">8%</td></tr></tbody></table></div>' +
      '<div class="panel"><h4>Recent journey</h4><table><tbody><tr><td><span class="pill b">view</span></td><td>/ → #projects</td></tr><tr><td><span class="pill b">view</span></td><td>/projects/ → realwealth</td></tr><tr><td><span class="pill">chat</span></td><td>New message (sample)</td></tr><tr><td><span class="pill w">play</span></td><td>Space Invaders · 2m</td></tr></tbody></table></div></div>';
    host.appendChild(m);
    if (host.clientWidth < 640) m.querySelector('[data-an-row]').style.gridTemplateColumns = '1fr';
    var live = m.querySelector('[data-an-live]'), last = 0;
    makeCanvas(m.querySelector('[data-an-chart]'), 150, function (ctx, W, H, t) {
      if (t - last > 3) { last = t; live.textContent = String(1 + Math.floor(Math.random() * 5)); }
      ctx.clearRect(0, 0, W, H);
      var max = Math.max.apply(null, days), bw = W / days.length;
      days.forEach(function (d, i) {
        var h = d / max * (H - 20), g = ctx.createLinearGradient(0, H - h, 0, H);
        g.addColorStop(0, '#5b8def'); g.addColorStop(1, 'rgba(167,139,250,0.35)');
        ctx.fillStyle = g; ctx.fillRect(i * bw + 2, H - h, bw - 4, h);
      });
    }, true);
  };

  // ---------------- Home History (sample timeline) ----------------
  demos.timeline = function (host) {
    var items = [
      ['1962 – 1979', 'The first family', 'Built the back porch by hand; the lilac by the gate was planted the spring they moved in. (Sample story)'],
      ['1979 – 1996', 'Two teachers and a piano', 'The front room became a music studio — neighbours remember scales on Saturday mornings. (Sample story)'],
      ['1996 – 2014', 'The renovation years', 'Kitchen opened up, original fir floors kept. A time-capsule note was left under the stairs. (Sample story)'],
      ['2014 – now', 'Current residents', 'Found the note, added photos, and started this home file for whoever comes next. (Sample story)']
    ];
    var m = el('div', 'mock');
    m.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:1rem;flex-wrap:wrap;margin-bottom:.9rem"><div><div style="font:700 1.15rem Archivo,sans-serif">Sample Home · 00 Example Lane</div><div style="color:#97a3b8;font-size:.78rem">Shareable home file · /h/00-example-lane</div></div><span class="pill b">4 entries · 7 photos</span></div>' +
      '<div style="position:relative;padding-left:1.4rem;border-left:2px solid rgba(167,139,250,.35);display:grid;gap:.9rem">' +
      items.map(function (it, i) {
        return '<div class="panel" style="position:relative"><span style="position:absolute;left:-1.95rem;top:1rem;width:12px;height:12px;border-radius:50%;background:' + ['#5b8def', '#a78bfa', '#22d3ee', '#34d399'][i] + '"></span>' +
          '<div style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#97a3b8">' + it[0] + '</div><div style="font-weight:600;margin:.15rem 0 .3rem">' + it[1] + '</div><div style="color:#c9d2e3;font-size:.82rem;white-space:normal">' + it[2] + '</div></div>';
      }).join('') + '</div>';
    host.appendChild(m);
  };

  // ---------------- IPTV Player (illustration) ----------------
  demos.iptv = function (host) {
    var groups = [['News', ['Noticias 24 (sample)', 'World News (sample)', 'Canal Informativo (sample)']], ['Sports', ['Deportes HD (sample)', 'Futbol Live (sample)']], ['Kids', ['Kids Fun (sample)', 'Cartoons (sample)']]];
    var m = el('div', 'mock');
    m.innerHTML = '<div class="row" style="grid-template-columns:minmax(0,1fr) minmax(0,2fr)" data-tv-row>' +
      '<div class="panel"><div style="border:1px solid rgba(148,163,184,.2);border-radius:.5rem;padding:.4rem .6rem;color:#97a3b8;margin-bottom:.6rem">🔍 Search 1,282 channels…</div>' +
      groups.map(function (g) { return '<h4 style="margin-top:.5rem">' + g[0] + '</h4>' + g[1].map(function (c, i) { return '<div style="padding:.3rem .4rem;border-radius:.4rem;' + (g[0] === 'News' && i === 0 ? 'background:rgba(91,141,239,.18);' : '') + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (i === 0 && g[0] === 'News' ? '▶ ' : '☆ ') + c + '</div>'; }).join(''); }).join('') + '</div>' +
      '<div class="panel" style="display:flex;flex-direction:column;gap:.6rem"><div data-tv-screen style="position:relative;aspect-ratio:16/9;border-radius:.5rem;overflow:hidden;background:linear-gradient(135deg,#1e293b,#312e81 60%,#0f172a)"><span class="pill r" style="position:absolute;top:.6rem;left:.6rem">● LIVE</span><div style="position:absolute;inset:auto 0 0 0;padding:.7rem;background:linear-gradient(0deg,rgba(0,0,0,.6),transparent)"><b>Noticias 24 (sample)</b><div style="color:#97a3b8;font-size:.75rem">News · HLS stream · auto-skip if no signal in 12s</div></div></div>' +
      '<div style="display:flex;gap:.4rem;flex-wrap:wrap"><span class="pill b">Favorites</span><span class="pill b">History</span><span class="pill b">Load M3U</span><span class="pill b">Keyboard shortcuts</span></div></div></div>';
    host.appendChild(m);
    if (host.clientWidth < 640) m.querySelector('[data-tv-row]').style.gridTemplateColumns = '1fr';
  };

  // ---------------- Elevatron (diagram) ----------------
  demos.elevatron = function (host) {
    makeCanvas(host, function (w) { return Math.max(300, Math.min(400, w * 0.52)); }, function (ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      var cx = W * (W < 600 ? 0.5 : 0.36), top = 24, bot = H - 30;
      ctx.fillStyle = 'rgba(52,211,153,0.12)'; ctx.fillRect(0, bot, W, H - bot);
      var g = ctx.createLinearGradient(cx - 10, 0, cx + 10, 0);
      g.addColorStop(0, 'rgba(34,211,238,0)'); g.addColorStop(0.5, 'rgba(165,243,252,0.95)'); g.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 10, top, 20, bot - top);
      for (var y = bot; y > top; y -= 12) { var f = (y + t * 90) % 24 < 12; ctx.fillStyle = f ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)'; ctx.fillRect(cx - 1, y - 4, 2, 4); }
      for (var k = 0; k < 7; k++) {
        var yy = bot - 22 - k * (bot - top - 40) / 6;
        ctx.strokeStyle = 'rgba(167,139,250,0.85)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(cx, yy, 34, 9, 0, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = 'rgba(91,141,239,' + (0.25 + 0.2 * Math.sin(t * 2 + k)) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, yy, 20, 5, 0, 0, 6.2832); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(248,113,113,0.8)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx + 90, bot); ctx.lineTo(cx + 4, top + 30); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#f87171'; ctx.fillRect(cx + 84, bot - 6, 14, 8);
      if (W >= 600) {
        var lx = W * 0.58; ctx.font = '12px "Space Grotesk", sans-serif'; ctx.textAlign = 'left';
        [['#a5f3fc', 'Self-pinched beam (Bennett / Z-pinch)', 'carries current and resists radial spread'],
         ['#a78bfa', 'External ring magnets', 'shape and stabilise the column'],
         ['#f87171', 'Laser channel', 'pre-ionises and guides the path'],
         ['#97a3b8', 'Verdict', 'megastructure not viable; bench physics is real']].forEach(function (l, i) {
          var y = 60 + i * 64; ctx.fillStyle = l[0]; ctx.fillRect(lx, y - 10, 10, 10);
          ctx.fillStyle = '#e7ecf5'; ctx.fillText(l[1], lx + 18, y); ctx.fillStyle = '#97a3b8'; ctx.fillText(l[2], lx + 18, y + 18);
        });
      }
    }, true);
  };

  // ---------------- Compute Share Pilot (simulation) ----------------
  demos.compute = function (host) {
    var workers = ['friend-a', 'friend-b', 'friend-c', 'friend-d'], jobs = [], r = rng(8), next = 0;
    makeCanvas(host, function (w) { return Math.max(280, Math.min(360, w * 0.48)); }, function (ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = 70, pos = workers.map(function (_, i) { return [W * (0.14 + i * 0.24), H - 70]; });
      var client = [W * 0.08, 70];
      if (t > next) { next = t + 1.1; jobs.push({ w: Math.floor(r() * 4), t0: t }); }
      jobs = jobs.filter(function (j) { return t - j.t0 < 4.2; });
      function node(x, y, label, sub, c) {
        ctx.fillStyle = 'rgba(11,16,29,0.95)'; ctx.strokeStyle = c; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 56, y - 22, 112, 44, 10) : ctx.rect(x - 56, y - 22, 112, 44); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e7ecf5'; ctx.font = '600 12px "Space Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x, y - 2);
        ctx.fillStyle = '#97a3b8'; ctx.font = '10.5px "Space Grotesk", sans-serif'; ctx.fillText(sub, x, y + 13);
      }
      pos.forEach(function (p) { ctx.strokeStyle = 'rgba(148,163,184,0.15)'; ctx.beginPath(); ctx.moveTo(cx, cy + 22); ctx.lineTo(p[0], p[1] - 22); ctx.stroke(); });
      jobs.forEach(function (j) {
        var p = pos[j.w], a = t - j.t0, x, y, c;
        if (a < 0.8) { var f = a / 0.8; x = client[0] + (cx - client[0]) * f; y = cy; c = '#5b8def'; }
        else if (a < 2) { var f2 = (a - 0.8) / 1.2; x = cx + (p[0] - cx) * f2; y = cy + 22 + (p[1] - 22 - cy - 22) * f2; c = '#5b8def'; }
        else if (a < 2.8) { x = p[0]; y = p[1] - 30; c = '#fbbf24'; }
        else { var f3 = (a - 2.8) / 1.4; x = p[0] + (cx - p[0]) * f3; y = p[1] - 22 + (cy + 22 - p[1] + 22) * f3; c = '#34d399'; }
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fill();
      });
      if (W > 560) node(client[0] + 20, client[1], 'submit_job.py', 'prompt in', '#5b8def');
      node(cx, cy, 'coordinator', 'registry + queue', '#a78bfa');
      pos.forEach(function (p, i) { node(p[0], p[1], workers[i], i === 1 ? 'Ollama (sim)' : 'mock mode', '#22d3ee'); });
      ctx.textAlign = 'left'; ctx.font = '11px "Space Grotesk", sans-serif';
      [['job queued', '#5b8def'], ['running', '#fbbf24'], ['result back', '#34d399']].forEach(function (l, i) { ctx.fillStyle = l[1]; ctx.beginPath(); ctx.arc(W - 110, 20 + i * 18, 4, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#97a3b8'; ctx.fillText(l[0], W - 100, 24 + i * 18); });
    }, true);
  };

  // ---------------- Quiniela (sample pool) ----------------
  demos.quiniela = function (host) {
    var m = el('div', 'mock');
    m.innerHTML = '<div class="row" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)" data-q-row>' +
      '<div class="panel"><h4>Group stage · sample match</h4><div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin:.4rem 0 .8rem"><b>Team A</b><span style="display:flex;gap:.3rem"><span class="kpi" style="padding:.3rem .7rem"><b>2</b></span><span class="kpi" style="padding:.3rem .7rem"><b>1</b></span></span><b>Team B</b></div>' +
      '<div style="font-size:.72rem;color:#97a3b8;margin-bottom:.3rem">Group consensus</div><div style="display:flex;height:10px;border-radius:999px;overflow:hidden"><span style="width:52%;background:#5b8def"></span><span style="width:21%;background:#97a3b8"></span><span style="width:27%;background:#a78bfa"></span></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:.72rem;color:#97a3b8;margin-top:.3rem"><span>A 52%</span><span>Draw 21%</span><span>B 27%</span></div></div>' +
      '<div class="panel"><h4>Standings (sample players)</h4><table><thead><tr><th>#</th><th>Player</th><th>Exact</th><th>Pts</th></tr></thead><tbody>' +
      '<tr><td>1</td><td>Tigre</td><td>4</td><td>31</td></tr><tr><td>2</td><td>La Pulga</td><td>3</td><td>28</td></tr><tr><td>3</td><td>Chivo</td><td>2</td><td>24</td></tr><tr><td>4</td><td>Gringo</td><td>1</td><td>19</td></tr></tbody></table></div></div>';
    host.appendChild(m);
    if (host.clientWidth < 640) m.querySelector('[data-q-row]').style.gridTemplateColumns = '1fr';
  };

  // ---------------- Elite Island Movers (illustration of the site layout) ----------------
  demos.movers = function (host) {
    var m = el('div', 'mock');
    m.innerHTML = '<div style="border:1px solid rgba(148,163,184,.2);border-radius:.7rem;overflow:hidden;background:#f4f7fa;color:#10202b">' +
      '<div style="background:#e2e8f0;padding:.4rem .7rem;display:flex;gap:.35rem;align-items:center"><span style="width:9px;height:9px;border-radius:50%;background:#f87171"></span><span style="width:9px;height:9px;border-radius:50%;background:#fbbf24"></span><span style="width:9px;height:9px;border-radius:50%;background:#34d399"></span><span style="margin-left:.6rem;font-size:.7rem;color:#475569">moving-company-site (illustration)</span></div>' +
      '<div style="background:#022c43;color:#fff;padding:1.1rem;text-align:center"><div style="font:700 1.2rem Archivo,sans-serif">Elite Island Movers</div><div style="font-size:.8rem;opacity:.8">Reliable &amp; affordable moving in Victoria, BC</div><div style="display:flex;gap:1rem;justify-content:center;font-size:.72rem;margin-top:.5rem;opacity:.85"><span>About</span><span>Services</span><span>Pricing</span><span>Contact</span></div></div>' +
      '<div style="padding:1rem;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem" data-mv-row>' +
      ['Experienced movers', 'Simple hourly pricing', 'Truck add-on'].map(function (h, i) { return '<div style="background:#fff;border-radius:.5rem;padding:.7rem;box-shadow:0 2px 8px rgba(0,0,0,.08)"><div style="font-weight:600;color:#004466;border-bottom:2px solid #004466;padding-bottom:.2rem;margin-bottom:.4rem">' + h + '</div><div style="height:6px;background:#e2e8f0;border-radius:3px;margin:.3rem 0"></div><div style="height:6px;background:#e2e8f0;border-radius:3px;width:' + (70 + i * 8) + '%"></div></div>'; }).join('') +
      '</div><div style="background:#022c43;color:#cbd5e1;text-align:center;font-size:.7rem;padding:.5rem">© Elite Island Movers</div></div>';
    host.appendChild(m);
    if (host.clientWidth < 560) m.querySelector('[data-mv-row]').style.gridTemplateColumns = '1fr';
  };

  // ---------------- Blitzy's World (the playable game) ----------------
  demos.game = function (host) {
    if (window.BlitzysWorld) window.__bw = window.BlitzysWorld.mount(host, { fullscreen: false });
  };

  function init() {
    var hosts = document.querySelectorAll('[data-demo]');
    for (var i = 0; i < hosts.length; i++) {
      var h = hosts[i], k = h.getAttribute('data-demo');
      var target = h.querySelector('.demo-stage') || h;
      if (demos[k]) { try { demos[k](target); } catch (e) { if (window.console) console.error('demo ' + k, e); } }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
