/* fx.js — calm motion for andresblitz.com: project ring, astronaut walk-in,
   hero glow and scroll progress. No dependencies. Honors prefers-reduced-motion. */
(function () {
  'use strict';
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mqReduce.matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var TAU = Math.PI * 2, DEG = Math.PI / 180;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function now() { return performance.now(); }

  /* ---------------- Scroll progress hairline ---------------- */
  (function progress() {
    var bar = document.createElement('div');
    bar.className = 'fx-progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var queued = false;
    function upd() {
      queued = false;
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? clamp(scrollY / h, 0, 1) : 0).toFixed(4) + ')';
    }
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  })();

  /* ---------------- Hero cursor glow (desktop, lerped) ---------------- */
  (function glow() {
    var hero = document.getElementById('hero');
    if (!hero || reduce || !fine) return;
    var g = document.createElement('div');
    g.className = 'fx-glow'; g.setAttribute('aria-hidden', 'true');
    hero.insertBefore(g, hero.children[1] || null);
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false;
    function step() {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      g.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.5) ? requestAnimationFrame(step) : 0;
    }
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!on) { on = true; x = tx; y = ty; g.classList.add('on'); }
      if (!raf) raf = requestAnimationFrame(step);
    });
    hero.addEventListener('pointerleave', function () { on = false; g.classList.remove('on'); });
  })();

  /* ---------------- Astronaut walk-in ---------------- */
  (function astronaut() {
    var el = document.querySelector('.astro');
    if (!el) return;
    var svg = el.querySelector('svg');
    var q = function (id) { return svg.querySelector('#' + id); };
    var fig = q('as-fig'), shadow = q('as-shadow');
    var legF = q('as-lf'), shinF = q('as-lf-shin'), legB = q('as-lb'), shinB = q('as-lb-shin');
    var armF = q('as-af'), foreF = q('as-af-fore'), armB = q('as-ab'), foreB = q('as-ab-fore');
    var HIP = [66, 124], SHO = [70, 82];

    function pose(ph, amp, wave) {
      var s = Math.sin(ph), c = Math.cos(ph);
      var tf = -24 * s * amp, tb = 24 * s * amp;                       // thighs (forward = negative)
      var kf = amp * (6 + 30 * Math.max(0, c)), kb = amp * (6 + 30 * Math.max(0, -c)); // knees
      var af = 20 * s * amp, ab = -20 * s * amp;                       // arms swing opposite legs
      var ef = -10 - 8 * amp, eb = -10 - 8 * amp;
      if (wave > 0) {                                                   // friendly wave
        af = af * (1 - wave) + (-78) * wave;
        ef = ef * (1 - wave) + (-92 + 16 * Math.sin(now() / 150)) * wave;
      }
      var bob = -amp * 5 * Math.abs(c);
      legF.setAttribute('transform', 'translate(' + HIP[0] + ' ' + HIP[1] + ') rotate(' + tf.toFixed(2) + ')');
      legB.setAttribute('transform', 'translate(' + (HIP[0] - 6) + ' ' + HIP[1] + ') rotate(' + tb.toFixed(2) + ')');
      shinF.setAttribute('transform', 'translate(0 34) rotate(' + kf.toFixed(2) + ')');
      shinB.setAttribute('transform', 'translate(0 34) rotate(' + kb.toFixed(2) + ')');
      armF.setAttribute('transform', 'translate(' + SHO[0] + ' ' + SHO[1] + ') rotate(' + af.toFixed(2) + ')');
      armB.setAttribute('transform', 'translate(' + (SHO[0] - 10) + ' ' + SHO[1] + ') rotate(' + ab.toFixed(2) + ')');
      foreF.setAttribute('transform', 'translate(0 26) rotate(' + ef.toFixed(2) + ')');
      foreB.setAttribute('transform', 'translate(0 26) rotate(' + eb.toFixed(2) + ')');
      fig.setAttribute('transform', 'translate(0 ' + bob.toFixed(2) + ')');
      shadow.setAttribute('transform', 'translate(66 201) scale(' + (1 + bob / 40).toFixed(3) + ' 1)');
    }
    pose(0, 0, 0);
    if (reduce) { el.classList.add('static'); return; }

    var hero = document.getElementById('hero');
    var start = 0, entered = false, dist0 = 0, amp = 0, ph = 0, face = 1, lastX = 0, raf = 0;
    var scrollX = 0, lastMove = 0, waveT = -1, DUR = 3400;
    function heroH() { return hero ? hero.offsetHeight : innerHeight; }
    function stride() { return Math.max(40, el.offsetHeight * 0.34); }
    function frame() {
      raf = 0;
      var t = now(), x;
      if (!entered) {
        var k = clamp((t - start) / DUR, 0, 1);
        var e = 1 - Math.pow(1 - k, 2.2);                    // ease-out: arrives gently
        x = -dist0 * (1 - e);
        amp = k < 0.82 ? 1 : 1 - (k - 0.82) / 0.18;
        if (k >= 1) { entered = true; amp = 0; waveT = t; }
      } else {
        var p = clamp(scrollY / heroH(), 0, 1);
        var target = p * Math.min(innerWidth * 0.45, 520);
        scrollX += (target - scrollX) * 0.18;
        x = scrollX;
        var moving = Math.abs(target - scrollX) > 0.4;
        if (moving) lastMove = t;
        amp += ((t - lastMove < 180 ? 1 : 0) - amp) * 0.12;
      }
      var dx = x - lastX; lastX = x;
      if (Math.abs(dx) > 0.05) face = dx >= 0 ? 1 : -1;
      ph += Math.abs(dx) / stride() * Math.PI;
      var wave = 0;
      if (waveT > 0) {
        var w = (t - waveT) / 1900;
        wave = w < 0.2 ? w / 0.2 : w < 0.8 ? 1 : w < 1 ? (1 - w) / 0.2 : 0;
        if (w >= 1 || amp > 0.2) waveT = -1;
      }
      pose(ph, amp, wave);
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      svg.style.transform = face < 0 ? 'scaleX(-1)' : '';
      if (!entered || amp > 0.01 || waveT > 0 || Math.abs(target2() - scrollX) > 0.4) raf = requestAnimationFrame(frame);
    }
    function target2() { return clamp(scrollY / heroH(), 0, 1) * Math.min(innerWidth * 0.45, 520); }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    function begin() {
      var r = el.getBoundingClientRect();
      dist0 = r.right + r.width * 0.7 + 40;                   // start fully off-screen left (orb included)
      lastX = -dist0; start = now();
      el.style.transform = 'translate3d(' + (-dist0) + 'px,0,0)';
      el.classList.add('live');
      kick();
      addEventListener('scroll', function () { if (entered) kick(); }, { passive: true });
    }
    // Start after first paint so the hero image stays the LCP and nothing shifts.
    if (document.readyState === 'complete') setTimeout(begin, 350);
    else addEventListener('load', function () { setTimeout(begin, 350); });
  })();

  /* ---------------- 3D project ring ---------------- */
  (function ring() {
    var root = document.querySelector('[data-ring]');
    if (!root || reduce || !('IntersectionObserver' in window)) return;
    // Lazy: build the ring only when it's about to scroll into view.
    var lazy = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      lazy.disconnect(); init();
    }, { rootMargin: '600px 0px' });
    lazy.observe(root);
    function init() {
    var stage = root.querySelector('.ring-stage'), track = root.querySelector('.ring-track');
    var cards = Array.prototype.slice.call(track.children);
    var N = cards.length, STEP = 360 / N;
    var R = 500, W = 210, TILT = -9;
    var rot = 0, vel = 0, target = null, auto = 7, paused = false, hover = false, focusIn = false;
    var drag = null, lastInteract = -1e9, visible = false, raf = 0, last = 0, lastScroll = scrollY;
    var toggle = root.querySelector('[data-ring-toggle]');

    root.classList.add('on');
    cards.forEach(function (li, i) {
      var img = li.querySelector('img'); if (img) { img.loading = 'eager'; img.draggable = false; }
      li.querySelector('a').addEventListener('focus', function () { focusIn = true; goTo(i); });
      li.querySelector('a').addEventListener('blur', function () { focusIn = false; });
    });
    function layout() {
      var w = stage.clientWidth;
      W = w < 520 ? 150 : w < 900 ? 180 : 210;
      R = Math.round(N * (W + (w < 520 ? 14 : 22)) / TAU);
      root.style.setProperty('--rc-w', W + 'px');
      cards.forEach(function (li, i) { li.style.transform = 'rotateY(' + (i * STEP) + 'deg) translateZ(' + R + 'px)'; });
      render();
    }
    function norm(a) { a %= 360; return a < 0 ? a + 360 : a; }
    function frontIndex() { return Math.round(norm(-rot) / STEP) % N; }
    function goTo(i) {
      var cur = rot, want = -i * STEP;
      var d = ((want - cur) % 360 + 540) % 360 - 180;        // shortest way round
      target = cur + d; vel = 0; lastInteract = now(); kick();
    }
    function render() {
      track.style.transform = 'translate3d(0,0,' + (-R) + 'px) rotateX(' + TILT + 'deg) rotateY(' + rot.toFixed(3) + 'deg)';
      for (var i = 0; i < N; i++) {
        var c = Math.cos((i * STEP + rot) * DEG);
        var o = 0.06 + 0.94 * Math.pow((c + 1) / 2, 2.4);
        var li = cards[i];
        li.style.opacity = o.toFixed(3);
        var live = c > 0.55;
        if (live !== li._live) { li._live = live; li.classList.toggle('back', !live); }
      }
    }
    function frame(t) {
      raf = 0;
      var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      if (drag) {
        // position set by pointer handler
      } else if (target !== null) {
        var d = target - rot; rot += d * Math.min(1, dt * 7);
        if (Math.abs(d) < 0.05) { rot = target; target = null; }
      } else {
        var idle = !paused && !hover && !focusIn && (t - lastInteract > 2500);
        var goal = idle ? -auto : 0;
        vel += (goal - vel) * Math.min(1, dt * 1.6);          // momentum decays toward calm spin
        rot += vel * dt;
      }
      render();
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame); } }

    // Drag / swipe with momentum. Capture only after a real drag so taps still open links.
    var suppressClick = false;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x0: e.clientX, r0: rot, lx: e.clientX, lt: now(), v: 0, moved: false };
      target = null;
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x0;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; try { stage.setPointerCapture(e.pointerId); } catch (_) {} root.classList.add('dragging'); }
      if (!drag.moved) return;
      var k = 360 / (TAU * R);                                // 1:1 under the finger at the front
      rot = drag.r0 + dx * k;
      var t = now(), ddt = Math.max(1, t - drag.lt);
      drag.v = drag.v * 0.6 + ((e.clientX - drag.lx) * k / ddt * 1000) * 0.4;
      drag.lx = e.clientX; drag.lt = t;
      lastInteract = t; kick();
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      if (drag.moved) { vel = clamp(drag.v, -240, 240); suppressClick = true; setTimeout(function () { suppressClick = false; }, 60); }
      root.classList.remove('dragging');
      drag = null; lastInteract = now(); kick();
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    track.addEventListener('click', function (e) { if (suppressClick) { e.preventDefault(); e.stopPropagation(); } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
    stage.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    stage.addEventListener('pointerleave', function () { hover = false; lastInteract = now(); });

    // Keyboard: arrows move between cards; the focused card turns to the front.
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var i = frontIndex(), n = (i + (e.key === 'ArrowRight' ? 1 : -1) + N) % N;
      var a = cards[n].querySelector('a');
      e.preventDefault();
      if (track.contains(document.activeElement)) a.focus({ preventScroll: true }); else goTo(n);
    });
    root.querySelectorAll('[data-ring-step]').forEach(function (b) {
      b.addEventListener('click', function () { goTo((frontIndex() + (+b.getAttribute('data-ring-step')) + N) % N); });
    });
    if (toggle) toggle.addEventListener('click', function () {
      paused = !paused;
      toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
      toggle.setAttribute('aria-label', paused ? 'Resume rotation' : 'Pause rotation');
      toggle.classList.toggle('is-paused', paused);
      lastInteract = paused ? lastInteract : -1e9; kick();
    });

    // Scroll-linked: page scroll gives the ring a gentle turn while it's on screen.
    addEventListener('scroll', function () {
      var d = scrollY - lastScroll; lastScroll = scrollY;
      if (!visible || drag) return;
      if (target === null) rot -= clamp(d, -80, 80) * 0.06;
      kick();
    }, { passive: true });

    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) kick();
    }, { rootMargin: '120px 0px' }).observe(root);
    document.addEventListener('visibilitychange', kick);
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
    layout();
    }
  })();
})();
