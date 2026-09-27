/*
 * Blitzy's World — Deep Space (v0.2, 2D canvas build)
 * A glowing orb ("Blitzy") cruising through an endless universe.
 * No dependencies. Keyboard, mouse and touch. Framerate-independent physics.
 *
 * Usage: BlitzysWorld.mount(containerEl, { fullscreen: bool })
 */
(function (global) {
  'use strict';

  // ---------- deterministic hashing (infinite, stable universe) ----------
  function hash2(x, y, s) {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 2147483647;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967295;
  }
  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  // ---------- tuning ----------
  const CHUNK = 1700;          // world units per procedural chunk
  const THRUST = 950;         // px/s^2
  const BOOST = 2.1;           // thrust multiplier
  const DRAG = 0.85;           // 1/s  (exponential)
  const MAX_SPEED = 1500;
  const ORB_R = 14;
  const TRAIL_LIFE = 5.5;      // seconds
  const G = 5200000;           // gravity constant (tuned)
  const HOME = { x: 0, y: 0, r: 170, hue: 262, home: true, rings: false, key: 'home' };
  const PALETTE = [262, 248, 222, 200, 285, 320, 18, 170];

  function mount(container, opts) {
    opts = opts || {};
    const full = !!opts.fullscreen;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- DOM ----------
    container.classList.add('bw-root');
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.className = 'bw-canvas';
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('aria-label', "Blitzy's World — a playable space game. Use arrow keys or W A S D to fly, Shift or Space to boost.");
    container.appendChild(canvas);

    const hud = document.createElement('div');
    hud.className = 'bw-hud';
    hud.innerHTML =
      '<div class="bw-stat"><span>Stardust</span><b data-k="dust">0</b></div>' +
      '<div class="bw-stat"><span>From home</span><b data-k="dist">0.0 ly</b></div>' +
      '<div class="bw-stat"><span>Speed</span><b data-k="spd">0</b></div>';
    container.appendChild(hud);

    const btns = document.createElement('div');
    btns.className = 'bw-btns';
    btns.innerHTML =
      '<button type="button" data-a="home" title="Warp home (H)" aria-label="Warp home">⌂</button>' +
      '<button type="button" data-a="trace" title="Erase trace (T)" aria-label="Erase trace">✦</button>' +
      '<button type="button" data-a="pause" title="Pause (P / Esc)" aria-label="Pause">❚❚</button>';
    container.appendChild(btns);

    const boostBtn = document.createElement('button');
    boostBtn.type = 'button';
    boostBtn.className = 'bw-boost';
    boostBtn.textContent = 'BOOST';
    boostBtn.setAttribute('aria-label', 'Boost (hold)');
    container.appendChild(boostBtn);

    const overlay = document.createElement('div');
    overlay.className = 'bw-overlay';
    overlay.innerHTML =
      '<div class="bw-title">BLITZY\'S WORLD</div>' +
      '<div class="bw-sub">DEEP SPACE · v0.2</div>' +
      '<button type="button" class="bw-play">' + (('ontouchstart' in window) ? 'TAP TO PLAY AS BLITZY' : 'CLICK TO PLAY AS BLITZY') + '</button>' +
      '<div class="bw-keys">W A S D / ARROWS — FLY &nbsp;·&nbsp; SHIFT / SPACE — BOOST<br>' +
      'HOLD MOUSE — STEER TO POINTER &nbsp;·&nbsp; TOUCH — DRAG TO STEER<br>' +
      'T — ERASE TRACE &nbsp;·&nbsp; H — HOME &nbsp;·&nbsp; P / ESC — PAUSE</div>';
    container.appendChild(overlay);
    const playBtn = overlay.querySelector('.bw-play');

    const stick = document.createElement('div');
    stick.className = 'bw-stick';
    stick.innerHTML = '<i></i>';
    container.appendChild(stick);
    const stickKnob = stick.querySelector('i');

    const hudEls = {
      dust: hud.querySelector('[data-k="dust"]'),
      dist: hud.querySelector('[data-k="dist"]'),
      spd: hud.querySelector('[data-k="spd"]')
    };

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, DPR = 1;

    function resize() {
      const r = container.getBoundingClientRect();
      W = Math.max(200, Math.floor(r.width));
      H = Math.max(200, Math.floor(r.height));
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
    }
    resize();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(container);
    window.addEventListener('resize', resize);

    // ---------- state ----------
    const orb = { x: 0, y: -(HOME.r + ORB_R + 40), vx: 90, vy: 0 };
    const cam = { x: orb.x, y: orb.y + 120, zoom: 1 };
    let trail = [];
    let sparks = [];                 // collect bursts
    const collected = new Set();
    let dust = 0;
    let running = false, paused = false, started = false;
    let time = 0, last = 0;
    let glowKick = 0;
    let shooter = null, nextShot = 3;
    let toast = null;

    const keys = Object.create(null);
    const pointer = { active: false, x: 0, y: 0, id: null, touch: false, sx: 0, sy: 0 };
    let boostHeld = false;

    // ---------- procedural universe ----------
    const chunkCache = new Map();
    function chunk(cx, cy) {
      const k = cx + ',' + cy;
      let c = chunkCache.get(k);
      if (c) return c;
      const r = rng(Math.floor(hash2(cx, cy, 7) * 4294967295));
      c = { planets: [], dust: [] };
      const nearHome = Math.abs(cx) <= 0 && Math.abs(cy) <= 0;
      if (!nearHome && r() < 0.72) {
        const pr = 55 + r() * 125;
        const hue = PALETTE[Math.floor(r() * PALETTE.length)];
        c.planets.push({
          x: cx * CHUNK + 300 + r() * (CHUNK - 600),
          y: cy * CHUNK + 300 + r() * (CHUNK - 600),
          r: pr, hue: hue, rings: r() < 0.35, tilt: -0.6 + r() * 1.2,
          bands: 2 + Math.floor(r() * 4), seed: Math.floor(r() * 1e9), key: k + ':p'
        });
      }
      const n = 9 + Math.floor(r() * 8);
      for (let i = 0; i < n; i++) {
        c.dust.push({ x: cx * CHUNK + r() * CHUNK, y: cy * CHUNK + r() * CHUNK, id: k + ':' + i, ph: r() * 6.28 });
      }
      chunkCache.set(k, c);
      if (chunkCache.size > 220) { // keep memory bounded
        const first = chunkCache.keys().next().value; chunkCache.delete(first);
      }
      return c;
    }
    function nearbyPlanets(x, y, span) {
      const out = [HOME];
      const c0x = Math.floor((x - span) / CHUNK), c1x = Math.floor((x + span) / CHUNK);
      const c0y = Math.floor((y - span) / CHUNK), c1y = Math.floor((y + span) / CHUNK);
      for (let cx = c0x; cx <= c1x; cx++) for (let cy = c0y; cy <= c1y; cy++) {
        const c = chunk(cx, cy);
        for (const p of c.planets) out.push(p);
      }
      return out;
    }

    // Planet sprites are pre-rendered once per planet.
    const spriteCache = new Map();
    function planetSprite(p) {
      let s = spriteCache.get(p.key);
      if (s) return s;
      const pad = p.rings ? p.r * 1.2 : p.r * 0.5;
      const size = Math.ceil((p.r + pad) * 2);
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const cx = size / 2, cy = size / 2, R = p.r, h = p.hue;
      // atmosphere
      const atm = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.45);
      atm.addColorStop(0, 'hsla(' + h + ',80%,65%,0.35)');
      atm.addColorStop(1, 'hsla(' + h + ',80%,50%,0)');
      g.fillStyle = atm; g.beginPath(); g.arc(cx, cy, R * 1.45, 0, 6.2832); g.fill();
      // back ring half
      if (p.rings) drawRing(g, cx, cy, R, h, p.tilt, true);
      // body
      g.save();
      g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.clip();
      const body = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05);
      body.addColorStop(0, 'hsl(' + h + ',62%,' + (p.home ? 46 : 58) + '%)');
      body.addColorStop(0.55, 'hsl(' + h + ',58%,' + (p.home ? 26 : 36) + '%)');
      body.addColorStop(1, 'hsl(' + (h + 10) + ',60%,' + (p.home ? 9 : 12) + '%)');
      g.fillStyle = body; g.fillRect(0, 0, size, size);
      const rr = rng(p.seed || 12345);
      if (p.home) {
        // original v0.1 look: soft continents + faint lat/long grid
        for (let i = 0; i < 8; i++) {
          const bx = cx + (rr() - 0.5) * R * 1.5, by = cy + (rr() - 0.5) * R * 1.5, br = R * (0.2 + rr() * 0.3);
          const bg = g.createRadialGradient(bx, by, 0, bx, by, br);
          bg.addColorStop(0, 'rgba(120,60,220,0.45)'); bg.addColorStop(1, 'rgba(120,60,220,0)');
          g.fillStyle = bg; g.fillRect(bx - br, by - br, br * 2, br * 2);
        }
        g.strokeStyle = 'rgba(170,120,255,0.16)'; g.lineWidth = 1.2;
        for (let i = 1; i < 8; i++) {
          const yy = cy - R + (2 * R * i) / 8, half = Math.sqrt(Math.max(0, R * R - (yy - cy) * (yy - cy)));
          g.beginPath(); g.moveTo(cx - half, yy); g.lineTo(cx + half, yy); g.stroke();
          const k = -1 + (2 * i) / 8;
          g.beginPath(); g.ellipse(cx, cy, Math.abs(k) * R, R, 0, 0, 6.2832); g.stroke();
        }
      } else {
        for (let i = 0; i < p.bands; i++) {
          const yy = cy - R + rr() * 2 * R, th = R * (0.08 + rr() * 0.25);
          g.fillStyle = 'hsla(' + (h + (rr() * 40 - 20)) + ',55%,' + (30 + rr() * 35) + '%,0.28)';
          g.fillRect(cx - R, yy, 2 * R, th);
        }
        for (let i = 0; i < 6; i++) {
          const bx = cx + (rr() - 0.5) * R * 1.6, by = cy + (rr() - 0.5) * R * 1.6, br = R * (0.05 + rr() * 0.14);
          g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.arc(bx, by, br, 0, 6.2832); g.fill();
        }
      }
      // terminator shade
      const sh = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      sh.addColorStop(0, 'rgba(255,255,255,0.10)'); sh.addColorStop(0.55, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,10,0.55)');
      g.fillStyle = sh; g.fillRect(0, 0, size, size);
      g.restore();
      // rim light
      g.strokeStyle = 'hsla(' + h + ',90%,80%,0.35)'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(cx, cy, R - 0.5, 3.6, 5.6); g.stroke();
      if (p.rings) drawRing(g, cx, cy, R, h, p.tilt, false);
      s = { c: c, half: size / 2 };
      spriteCache.set(p.key, s);
      if (spriteCache.size > 80) { const f = spriteCache.keys().next().value; spriteCache.delete(f); }
      return s;
    }
    function drawRing(g, cx, cy, R, h, tilt, back) {
      g.save();
      g.translate(cx, cy); g.rotate(tilt);
      g.beginPath();
      if (back) g.rect(-R * 2.4, -R * 2.4, R * 4.8, R * 2.4); else g.rect(-R * 2.4, 0, R * 4.8, R * 2.4);
      g.clip();
      for (let i = 0; i < 3; i++) {
        g.strokeStyle = 'hsla(' + (h + 30) + ',70%,' + (70 - i * 10) + '%,' + (0.45 - i * 0.1) + ')';
        g.lineWidth = R * (0.07 - i * 0.015);
        g.beginPath(); g.ellipse(0, 0, R * (1.55 + i * 0.16), R * (0.36 + i * 0.04), 0, 0, 6.2832); g.stroke();
      }
      g.restore();
    }

    // ---------- input ----------
    function isGameKey(code) {
      return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight'].indexOf(code) >= 0;
    }
    function keyTargetOk() {
      if (full) return true;
      // embedded: only capture keys while the game is focused/active
      return running && !paused && (document.activeElement === canvas || container.contains(document.activeElement));
    }
    function onKeyDown(e) {
      if (!keyTargetOk()) return;
      if (isGameKey(e.code)) { keys[e.code] = true; e.preventDefault(); }
      if (e.code === 'KeyT') clearTrace();
      if (e.code === 'KeyH') warpHome();
      if (e.code === 'KeyP' || e.code === 'Escape') { setPaused(true); e.preventDefault(); }
    }
    function onKeyUp(e) { keys[e.code] = false; }
    window.addEventListener('keydown', function (e) {
      if (full && paused && started && (e.code === 'KeyP' || e.code === 'Escape' || e.code === 'Enter')) { setPaused(false); e.preventDefault(); return; }
      onKeyDown(e);
    });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', function () { for (const k in keys) keys[k] = false; boostHeld = false; });

    function localXY(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (!running || paused) return;
      canvas.focus({ preventScroll: true });
      const p = localXY(e);
      pointer.active = true; pointer.id = e.pointerId; pointer.touch = e.pointerType !== 'mouse';
      pointer.x = pointer.sx = p.x; pointer.y = pointer.sy = p.y;
      if (pointer.touch) {
        stick.style.left = p.x + 'px'; stick.style.top = p.y + 'px';
        stick.classList.add('on'); stickKnob.style.transform = 'translate(-50%,-50%)';
      }
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.active || e.pointerId !== pointer.id) return;
      const p = localXY(e); pointer.x = p.x; pointer.y = p.y;
      if (pointer.touch) {
        let dx = p.x - pointer.sx, dy = p.y - pointer.sy; const d = Math.hypot(dx, dy), m = 46;
        if (d > m) { dx = dx / d * m; dy = dy / d * m; }
        stickKnob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
      }
    });
    function endPointer(e) {
      if (e.pointerId !== pointer.id) return;
      pointer.active = false; pointer.id = null; stick.classList.remove('on');
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    // stop page scroll/zoom gestures only while playing
    canvas.addEventListener('touchmove', function (e) { if (running && !paused) e.preventDefault(); }, { passive: false });

    function holdBoost(on) { return function (e) { boostHeld = on; e.preventDefault(); }; }
    boostBtn.addEventListener('pointerdown', holdBoost(true));
    boostBtn.addEventListener('pointerup', holdBoost(false));
    boostBtn.addEventListener('pointercancel', holdBoost(false));
    boostBtn.addEventListener('pointerleave', holdBoost(false));

    btns.addEventListener('click', function (e) {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.getAttribute('data-a');
      if (a === 'home') warpHome();
      if (a === 'trace') clearTrace();
      if (a === 'pause') setPaused(true);
      canvas.focus({ preventScroll: true });
    });

    function start() {
      started = true; running = true; paused = false;
      overlay.classList.add('hidden');
      container.classList.add('bw-playing');
      canvas.focus({ preventScroll: true });
      last = performance.now();
    }
    function setPaused(v) {
      if (!started) return;
      paused = v;
      running = !v;
      for (const k in keys) keys[k] = false;
      pointer.active = false; stick.classList.remove('on'); boostHeld = false;
      overlay.classList.toggle('hidden', !v);
      container.classList.toggle('bw-playing', !v);
      overlay.querySelector('.bw-sub').textContent = v ? 'PAUSED' : 'DEEP SPACE · v0.2';
      playBtn.textContent = v ? 'RESUME' : playBtn.textContent;
      if (!v) { canvas.focus({ preventScroll: true }); last = performance.now(); }
    }
    playBtn.addEventListener('click', function () { if (!started) start(); else setPaused(false); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) { if (!started) start(); else setPaused(false); } });
    document.addEventListener('visibilitychange', function () { if (document.hidden && running) setPaused(true); });
    if (!full && typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver(function (es) { es.forEach(function (en) { if (!en.isIntersecting && running) setPaused(true); }); }, { threshold: 0.15 }).observe(container);
    }

    function clearTrace() { trail = []; }
    function warpHome() {
      orb.x = 0; orb.y = -(HOME.r + ORB_R + 40); orb.vx = 90; orb.vy = 0; trail = [];
      showToast('Back home');
    }
    function showToast(t) { toast = { t: t, until: time + 1.6 }; }

    // ---------- simulation ----------
    function step(dt) {
      // thrust direction
      let ax = 0, ay = 0;
      if (keys.KeyW || keys.ArrowUp) ay -= 1;
      if (keys.KeyS || keys.ArrowDown) ay += 1;
      if (keys.KeyA || keys.ArrowLeft) ax -= 1;
      if (keys.KeyD || keys.ArrowRight) ax += 1;
      if (pointer.active) {
        let dx, dy;
        if (pointer.touch) { dx = pointer.x - pointer.sx; dy = pointer.y - pointer.sy; }
        else { const sp = worldToScreen(orb.x, orb.y); dx = pointer.x - sp.x; dy = pointer.y - sp.y; }
        const d = Math.hypot(dx, dy);
        const dead = pointer.touch ? 6 : 10;
        if (d > dead) {
          const mag = pointer.touch ? clamp(d / 46, 0, 1) : clamp(d / 140, 0.25, 1);
          ax += dx / d * mag; ay += dy / d * mag;
        }
      }
      const al = Math.hypot(ax, ay);
      if (al > 1) { ax /= al; ay /= al; }
      const boosting = boostHeld || keys.ShiftLeft || keys.ShiftRight || keys.Space;
      const thrust = THRUST * (boosting ? BOOST : 1);
      orb.vx += ax * thrust * dt;
      orb.vy += ay * thrust * dt;

      // gravity + collisions
      const planets = nearbyPlanets(orb.x, orb.y, 1400);
      for (const p of planets) {
        const dx = p.x - orb.x, dy = p.y - orb.y;
        const d2 = dx * dx + dy * dy, d = Math.sqrt(d2) || 1;
        const infl = p.r * 7;
        if (d < infl) {
          const soft = d2 + p.r * p.r * 0.6;
          const g = G * (p.r / 120) * (p.r / 120) / soft * (1 - d / infl);
          orb.vx += dx / d * g * dt; orb.vy += dy / d * g * dt;
        }
        const minD = p.r + ORB_R;
        if (d < minD) { // roll on the surface, bounce softly
          const nx = -dx / d, ny = -dy / d;
          orb.x = p.x + nx * minD; orb.y = p.y + ny * minD;
          const vn = orb.vx * nx + orb.vy * ny;
          if (vn < 0) { orb.vx -= vn * nx * 1.45; orb.vy -= vn * ny * 1.45; }
          orb.vx *= 0.995; orb.vy *= 0.995;
        }
      }

      const k = Math.exp(-DRAG * dt);
      orb.vx *= k; orb.vy *= k;
      const sp = Math.hypot(orb.vx, orb.vy);
      const maxS = MAX_SPEED * (boosting ? 1.35 : 1);
      if (sp > maxS) { orb.vx *= maxS / sp; orb.vy *= maxS / sp; }
      orb.x += orb.vx * dt; orb.y += orb.vy * dt;

      // trail
      const lt = trail[trail.length - 1];
      if (!lt || Math.hypot(orb.x - lt.x, orb.y - lt.y) > 5) trail.push({ x: orb.x, y: orb.y, t: time, b: boosting ? 1 : 0 });
      while (trail.length && time - trail[0].t > TRAIL_LIFE) trail.shift();
      if (trail.length > 1600) trail.splice(0, trail.length - 1600);

      // stardust
      const cx = Math.floor(orb.x / CHUNK), cy = Math.floor(orb.y / CHUNK);
      for (let ix = cx - 1; ix <= cx + 1; ix++) for (let iy = cy - 1; iy <= cy + 1; iy++) {
        const c = chunk(ix, iy);
        for (const s of c.dust) {
          if (collected.has(s.id)) continue;
          const dx = s.x - orb.x, dy = s.y - orb.y, d = Math.hypot(dx, dy);
          if (d < 180) { // gentle magnet
            const pull = (1 - d / 180) * 900 * dt;
            s.x -= dx / (d || 1) * pull; s.y -= dy / (d || 1) * pull;
          }
          if (d < ORB_R + 10) {
            collected.add(s.id); dust++; glowKick = 1;
            for (let i = 0; i < 14; i++) {
              const a = Math.random() * 6.2832, v = 60 + Math.random() * 180;
              sparks.push({ x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7 + Math.random() * 0.5, t: 0 });
            }
            if (dust % 25 === 0) showToast(dust + ' stardust — nice cruising');
          }
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.96; s.vy *= 0.96;
        if (s.t > s.life) sparks.splice(i, 1);
      }
      glowKick = Math.max(0, glowKick - dt * 1.6);

      // camera: smooth follow with a little look-ahead, zoom out with speed
      const tz = clamp(1.08 - sp / 3400, 0.66, 1.08) * (W < 560 ? 0.8 : 1);
      cam.zoom += (tz - cam.zoom) * (1 - Math.exp(-1.6 * dt));
      const lx = orb.x + orb.vx * 0.28, ly = orb.y + orb.vy * 0.28;
      const f = 1 - Math.exp(-4.2 * dt);
      cam.x += (lx - cam.x) * f; cam.y += (ly - cam.y) * f;
    }

    function worldToScreen(x, y) {
      return { x: (x - cam.x) * cam.zoom + W / 2, y: (y - cam.y) * cam.zoom + H / 2 };
    }

    // ---------- rendering ----------
    function drawBackground() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#03020d'); g.addColorStop(0.6, '#070318'); g.addColorStop(1, '#0a0420');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // nebulae (very slow parallax)
      const NP = 0.06, NC = 1500;
      const ox = cam.x * NP, oy = cam.y * NP;
      const x0 = Math.floor((ox - W) / NC), x1 = Math.floor((ox + W) / NC);
      const y0 = Math.floor((oy - H) / NC), y1 = Math.floor((oy + H) / NC);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) {
        const h = hash2(i, j, 91);
        if (h > 0.62) continue;
        const nx = i * NC + hash2(i, j, 92) * NC - ox + W / 2;
        const ny = j * NC + hash2(i, j, 93) * NC - oy + H / 2;
        const nr = 380 + hash2(i, j, 94) * 620;
        const hue = [265, 250, 225, 290, 205][Math.floor(hash2(i, j, 95) * 5)];
        const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        ng.addColorStop(0, 'hsla(' + hue + ',75%,38%,0.20)');
        ng.addColorStop(0.5, 'hsla(' + hue + ',75%,30%,0.07)');
        ng.addColorStop(1, 'hsla(' + hue + ',75%,20%,0)');
        ctx.fillStyle = ng; ctx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
      }
      ctx.globalCompositeOperation = 'source-over';

      // three parallax star layers
      const layers = [[0.12, 170, 3, 0.9], [0.3, 230, 3, 1.3], [0.6, 320, 2, 1.8]];
      for (let L = 0; L < layers.length; L++) {
        const par = layers[L][0], cell = layers[L][1], per = layers[L][2], maxR = layers[L][3];
        const sx = cam.x * par, sy = cam.y * par;
        const cx0 = Math.floor((sx - W / 2) / cell) - 1, cx1 = Math.floor((sx + W / 2) / cell) + 1;
        const cy0 = Math.floor((sy - H / 2) / cell) - 1, cy1 = Math.floor((sy + H / 2) / cell) + 1;
        for (let i = cx0; i <= cx1; i++) for (let j = cy0; j <= cy1; j++) {
          for (let s = 0; s < per; s++) {
            const hx = hash2(i, j, L * 31 + s * 7 + 1), hy = hash2(i, j, L * 31 + s * 7 + 2), hr = hash2(i, j, L * 31 + s * 7 + 3);
            const x = i * cell + hx * cell - sx + W / 2, y = j * cell + hy * cell - sy + H / 2;
            const tw = reduceMotion ? 1 : 0.7 + 0.3 * Math.sin(time * (0.8 + hr * 2) + hx * 50);
            const r = 0.35 + hr * maxR;
            const tint = hr > 0.85 ? '200,210,255' : hr > 0.7 ? '255,236,210' : hr > 0.55 ? '220,200,255' : '240,242,255';
            ctx.fillStyle = 'rgba(' + tint + ',' + ((0.35 + hr * 0.6) * tw).toFixed(3) + ')';
            if (r < 1.1) ctx.fillRect(x, y, r * 1.6, r * 1.6);
            else { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
          }
        }
      }

      // shooting star
      if (!reduceMotion) {
        if (!shooter && time > nextShot) {
          const a = Math.PI * (0.15 + Math.random() * 0.2);
          shooter = { x: Math.random() * W, y: Math.random() * H * 0.4, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, life: 1 };
          nextShot = time + 6 + Math.random() * 8;
        }
        if (shooter) {
          const s = shooter;
          const gr = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.12, s.y - s.vy * 0.12);
          gr.addColorStop(0, 'rgba(235,230,255,' + (0.8 * s.life) + ')'); gr.addColorStop(1, 'rgba(235,230,255,0)');
          ctx.strokeStyle = gr; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12); ctx.stroke();
        }
      }
    }

    function drawWorld() {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);
      const viewR = Math.hypot(W, H) / cam.zoom / 2 + 400;

      // planets
      const planets = nearbyPlanets(cam.x, cam.y, viewR);
      for (const p of planets) {
        if (Math.abs(p.x - cam.x) > viewR + p.r * 2 || Math.abs(p.y - cam.y) > viewR + p.r * 2) continue;
        const s = planetSprite(p);
        ctx.drawImage(s.c, p.x - s.half, p.y - s.half);
        if (p.home) {
          ctx.fillStyle = 'rgba(210,190,255,0.55)';
          ctx.font = '600 13px "Space Grotesk", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('HOME', p.x, p.y + p.r + 34);
        }
      }

      // stardust
      ctx.globalCompositeOperation = 'lighter';
      const ccx = Math.floor(cam.x / CHUNK), ccy = Math.floor(cam.y / CHUNK);
      const span = Math.ceil(viewR / CHUNK);
      for (let ix = ccx - span; ix <= ccx + span; ix++) for (let iy = ccy - span; iy <= ccy + span; iy++) {
        const c = chunk(ix, iy);
        for (const s of c.dust) {
          if (collected.has(s.id)) continue;
          if (Math.abs(s.x - cam.x) > viewR || Math.abs(s.y - cam.y) > viewR) continue;
          const pulse = 0.75 + 0.25 * Math.sin(time * 3 + s.ph);
          const r = 9 * pulse;
          const dg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2.2);
          dg.addColorStop(0, 'rgba(255,250,235,0.95)');
          dg.addColorStop(0.3, 'rgba(140,220,255,0.55)');
          dg.addColorStop(1, 'rgba(120,90,255,0)');
          ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(s.x, s.y, r * 2.2, 0, 6.2832); ctx.fill();
        }
      }

      // trail: purple tail -> cyan/white head (same palette as v0.1)
      const n = trail.length;
      if (n > 1) {
        ctx.lineJoin = 'round';
        // wide soft glow, batched so overlapping caps don't create "beads"
        ctx.lineCap = 'butt';
        const B = 6;
        for (let i = 1; i < n; i += B) {
          const j = Math.min(n - 1, i + B);
          const b = trail[j];
          const age = (time - b.t) / TRAIL_LIFE;
          const alive = Math.pow(Math.max(0, 1 - age), 1.25);
          const frac = j / n;
          const rC = Math.round(255 * (0.45 + 0.55 * frac)), gC = Math.round(255 * (0.18 + 0.72 * frac));
          ctx.strokeStyle = 'rgba(' + rC + ',' + gC + ',255,' + (0.13 * alive).toFixed(3) + ')';
          ctx.lineWidth = (ORB_R * 1.9) * (0.35 + 0.65 * alive) * (b.b ? 1.25 : 1);
          ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          for (let k = i; k <= j; k++) ctx.lineTo(trail[k].x, trail[k].y);
          ctx.stroke();
        }
        // thin bright core
        ctx.lineCap = 'round';
        for (let i = 1; i < n; i++) {
          const a = trail[i - 1], b = trail[i];
          const age = (time - b.t) / TRAIL_LIFE;
          const alive = Math.pow(Math.max(0, 1 - age), 1.25);
          const frac = i / n;
          const rC = Math.round(255 * (0.45 + 0.55 * frac)), gC = Math.round(255 * (0.18 + 0.72 * frac));
          ctx.strokeStyle = 'rgba(' + rC + ',' + gC + ',255,' + (0.85 * alive).toFixed(3) + ')';
          ctx.lineWidth = 2.2 * (0.4 + 0.6 * alive);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      // sparks
      for (const s of sparks) {
        const a = 1 - s.t / s.life;
        ctx.fillStyle = 'rgba(190,230,255,' + a.toFixed(3) + ')';
        ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
      }

      // Blitzy — the glowing orb
      const pulse = reduceMotion ? 0 : Math.sin(time * 2.1);
      const glowR = ORB_R * (3.2 + 0.5 * pulse + glowKick * 1.8);
      const og = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, glowR);
      og.addColorStop(0, 'rgba(225,190,255,0.85)');
      og.addColorStop(0.35, 'rgba(180,110,255,0.32)');
      og.addColorStop(1, 'rgba(90,40,200,0)');
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(orb.x, orb.y, glowR, 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      const core = ctx.createRadialGradient(orb.x - ORB_R * 0.35, orb.y - ORB_R * 0.4, ORB_R * 0.1, orb.x, orb.y, ORB_R);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.55, '#efe2ff');
      core.addColorStop(1, '#c79bff');
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(orb.x, orb.y, ORB_R, 0, 6.2832); ctx.fill();
      ctx.restore();
    }

    function drawHomeArrow() {
      const s = worldToScreen(HOME.x, HOME.y);
      const m = 34;
      if (s.x > -HOME.r * cam.zoom && s.x < W + HOME.r * cam.zoom && s.y > -HOME.r * cam.zoom && s.y < H + HOME.r * cam.zoom) return;
      const cx = W / 2, cy = H / 2, dx = s.x - cx, dy = s.y - cy;
      const t = Math.min((W / 2 - m) / Math.abs(dx || 1e-6), (H / 2 - m) / Math.abs(dy || 1e-6));
      const ax = cx + dx * t, ay = cy + dy * t, ang = Math.atan2(dy, dx);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(200,170,255,0.75)';
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-3, 0); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    function drawToast() {
      if (!toast || time > toast.until) return;
      const a = clamp((toast.until - time) / 0.4, 0, 1);
      ctx.fillStyle = 'rgba(220,205,255,' + (0.85 * a).toFixed(3) + ')';
      ctx.font = '600 13px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(toast.t.toUpperCase(), W / 2, 34);
    }

    let hudTick = 0;
    function updateHud() {
      const d = Math.hypot(orb.x - HOME.x, orb.y - HOME.y) - HOME.r;
      hudEls.dust.textContent = String(dust);
      hudEls.dist.textContent = (Math.max(0, d) / 1000).toFixed(1) + ' ly';
      hudEls.spd.textContent = String(Math.round(Math.hypot(orb.vx, orb.vy) / 10));
    }

    function frame(now) {
      requestAnimationFrame(frame);
      let dt = (now - last) / 1000; last = now;
      if (!(dt > 0)) dt = 0.016;
      dt = Math.min(dt, 0.05);
      if (running) {
        time += dt;
        // sub-step for stable gravity/collisions at low framerates
        const steps = dt > 0.02 ? 2 : 1;
        for (let i = 0; i < steps; i++) step(dt / steps);
      } else if (!started) {
        // attract mode: Blitzy idles in a slow orbit around home
        time += dt;
        const a = time * 0.25, R = HOME.r + 90;
        orb.x = Math.cos(a) * R; orb.y = Math.sin(a) * R;
        orb.vx = -Math.sin(a) * R * 0.25; orb.vy = Math.cos(a) * R * 0.25;
        trail.push({ x: orb.x, y: orb.y, t: time, b: 0 });
        while (trail.length && time - trail[0].t > TRAIL_LIFE) trail.shift();
        cam.x += (0 - cam.x) * 0.05; cam.y += (0 - cam.y) * 0.05;
        cam.zoom += ((W < 560 ? 0.8 : 1) - cam.zoom) * 0.05;
      }
      if (shooter && running) { shooter.x += shooter.vx * dt; shooter.y += shooter.vy * dt; shooter.life -= dt * 1.4; if (shooter.life <= 0) shooter = null; }
      else if (shooter && !started) { shooter.x += shooter.vx * dt; shooter.y += shooter.vy * dt; shooter.life -= dt * 1.4; if (shooter.life <= 0) shooter = null; }

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      drawBackground();
      drawWorld();
      drawHomeArrow();
      drawToast();
      if ((hudTick = (hudTick + 1) % 6) === 0) updateHud();
    }
    last = performance.now();
    requestAnimationFrame(frame);

    // small test hook (used by automated checks; harmless)
    return {
      start: start,
      pause: function () { setPaused(true); },
      state: function () { return { x: orb.x, y: orb.y, vx: orb.vx, vy: orb.vy, dust: dust, running: running, trail: trail.length }; },
      press: function (code, on) { keys[code] = !!on; }
    };
  }

  global.BlitzysWorld = { mount: mount };
})(window);
