// Blitzy's World v1.0 — the eight sectors. Each one is built around a real
// space phenomenon and is generated from this description at load time.
//
// Body kinds: planet (type rock | gas | lava | ice), sun, pulsar, blackhole.
// `g` is surface gravity in units/s²; gravity falls off with distance squared.

export const LEVELS = [
  {
    name: 'HOME ORBIT', tag: 'GRAVITY ASSIST',
    blurb: 'Collect the star crystals, then fly through the warp gate.',
    tip: 'Skim past a planet at speed for a slingshot bonus.',
    sky: { a: 0x3a1a8c, b: 0x1a3aa0, c: 0xff5fc8, seed: 3.1, intensity: 0.6 },
    sunDir: [-0.6, 0.45, 0.55], sunColor: 0xfff1e0,
    bodies: [
      { kind: 'planet', type: 'rock', r: 180, pos: [0, 0, 0], g: 430, colors: [0x241058, 0x6a35c8, 0xb48cff], atmo: 0x9a66ff, seed: 4 },
      { kind: 'planet', type: 'ice', r: 52, pos: [560, 110, -300], g: 260, colors: [0x7f8aa8, 0xc9d4f0, 0xffffff], atmo: 0x88aaff, seed: 9 },
    ],
    spawn: [0, 70, 340], gate: [-260, 240, 820],
    stars: [{ mode: 'shell', n: 8, center: [0, 0, 0], rmin: 300, rmax: 560 }],
    asteroids: [{ mode: 'shell', n: 34, center: [0, 0, 0], rmin: 330, rmax: 900, speed: 0.07, size: [8, 22], tint: 0x8a7a9c }],
    aliens: [], dust: 240, dustR: 900, timeLimit: 0, par: 70,
  },
  {
    name: 'RING RUNNER', tag: 'PLANETARY RINGS',
    blurb: 'The crystals are scattered through the rings of a gas giant.',
    tip: 'Ice chunks orbit inside the rings. Pulse (F) shatters them.',
    sky: { a: 0x7a3a12, b: 0x123a6a, c: 0xffc070, seed: 7.7, intensity: 0.95 },
    sunDir: [0.7, 0.35, 0.3], sunColor: 0xfff4e6,
    bodies: [
      { kind: 'planet', type: 'gas', r: 280, pos: [0, 0, 0], g: 520, colors: [0xc98a4a, 0xf2d6a0, 0x8a4a22], atmo: 0xffc880, seed: 2,
        rings: { inner: 400, outer: 780, c1: 0x9a8468, c2: 0xf0dcc0, normal: [0.22, 1, 0.12] } },
    ],
    spawn: [0, 260, 980], gate: [-980, 320, -420],
    stars: [{ mode: 'ring', n: 10, center: [0, 0, 0], rmin: 420, rmax: 760, normal: [0.22, 1, 0.12], jitter: 16 }],
    asteroids: [{ mode: 'belt', n: 190, center: [0, 0, 0], rmin: 410, rmax: 770, thick: 14, normal: [0.22, 1, 0.12], speed: 0.11, size: [4, 13], tint: 0xcfd8e8 }],
    aliens: [{ n: 2, center: [0, 0, 0], speed: 250, agro: 0.55, shooters: 0 }],
    dust: 260, dustR: 950, timeLimit: 0, par: 90,
  },
  {
    name: 'THE BELT', tag: 'ASTEROID BELT',
    blurb: 'A dense belt circles a dead dwarf planet. Thread it.',
    tip: 'Near misses pay. Stun a hunter with Pulse, then ram it.',
    sky: { a: 0x10344a, b: 0x3a2a12, c: 0x66e0ff, seed: 12.4, intensity: 0.9 },
    sunDir: [-0.3, 0.2, -0.9], sunColor: 0xeaf2ff,
    bodies: [
      { kind: 'planet', type: 'rock', r: 120, pos: [0, 0, 0], g: 380, colors: [0x2c2622, 0x7a5a48, 0xc9a890], atmo: 0x6a5a50, seed: 21 },
    ],
    spawn: [0, 300, 760], gate: [900, 380, 520],
    stars: [{ mode: 'ring', n: 12, center: [0, 0, 0], rmin: 400, rmax: 880, normal: [-0.1, 1, 0.2], jitter: 45 }],
    asteroids: [{ mode: 'belt', n: 330, center: [0, 0, 0], rmin: 370, rmax: 920, thick: 60, normal: [-0.1, 1, 0.2], speed: 0.1, size: [9, 36], tint: 0x8c7c70 }],
    aliens: [{ n: 3, center: [0, 0, 0], speed: 270, agro: 0.7, shooters: 0 }],
    dust: 280, dustR: 1000, timeLimit: 0, par: 105,
  },
  {
    name: 'COMET RUN', tag: 'COMETS',
    blurb: 'Three comets carry crystals in their wake. Match their orbit.',
    tip: 'Surf close behind a comet to recharge energy.',
    sky: { a: 0x0e3a5a, b: 0x2a1a6a, c: 0x9ff0ff, seed: 18.9, intensity: 1.0 },
    sunDir: [0.85, 0.3, -0.4], sunColor: 0xfffaf0,
    bodies: [
      { kind: 'planet', type: 'ice', r: 170, pos: [0, 0, 0], g: 420, colors: [0x2a5a8a, 0x9fd0f0, 0xffffff], atmo: 0x7fd0ff, seed: 33 },
    ],
    spawn: [0, 120, 420], gate: [0, 620, -900],
    comets: [
      { a: 820, b: 480, normal: [0.2, 1, 0.1], phase: 0.4, speed: 0.2 },
      { a: 700, b: 560, normal: [0.9, 0.4, 0.2], phase: 2.6, speed: -0.23 },
      { a: 980, b: 520, normal: [-0.3, 0.6, 0.8], phase: 4.4, speed: 0.17 },
    ],
    stars: [{ mode: 'comet', n: 4 }, { mode: 'shell', n: 2, center: [0, 0, 0], rmin: 300, rmax: 420 }],
    asteroids: [{ mode: 'shell', n: 46, center: [0, 0, 0], rmin: 340, rmax: 1050, speed: 0.08, size: [8, 24], tint: 0x9aa8b8 }],
    aliens: [{ n: 3, center: [0, 0, 0], speed: 290, agro: 0.75, shooters: 1 }],
    dust: 260, dustR: 1050, timeLimit: 0, par: 130,
  },
  {
    name: 'TWIN SUNS', tag: 'BINARY STAR',
    blurb: 'Two stars orbit each other. Stay too close and you cook.',
    tip: 'Watch the HEAT gauge. Shade behind the lava world cools you faster.',
    sky: { a: 0x6a1a10, b: 0x5a3a08, c: 0xffd08a, seed: 24.2, intensity: 0.9 },
    sunDir: [-1, 0.1, 0], sunColor: 0xffe0b0,
    bodies: [
      { kind: 'sun', r: 150, pos: [0, 0, 0], g: 700, c1: 0xffd070, c2: 0xff5a10, light: 0xffb060, orbit: { radius: 250, speed: 0.13, phase: 0 } },
      { kind: 'sun', r: 105, pos: [0, 0, 0], g: 620, c1: 0xdfeaff, c2: 0x5a9aff, light: 0x9ac0ff, orbit: { radius: 380, speed: 0.13, phase: Math.PI } },
      { kind: 'planet', type: 'lava', r: 110, pos: [1050, 60, 0], g: 360, colors: [0x1a0e0a, 0x4a2a1a, 0xff5a10], atmo: 0xff7030, seed: 41 },
    ],
    spawn: [760, 240, 620], gate: [-300, 760, 1000],
    stars: [
      { mode: 'shell', n: 8, center: [0, 0, 0], rmin: 620, rmax: 900 },
      { mode: 'ring', n: 5, center: [1050, 60, 0], rmin: 190, rmax: 260, normal: [0.2, 1, 0.3], jitter: 20 },
    ],
    asteroids: [{ mode: 'shell', n: 60, center: [0, 0, 0], rmin: 640, rmax: 1250, speed: 0.07, size: [9, 26], tint: 0xa07a60 }],
    aliens: [{ n: 4, center: [600, 0, 300], speed: 300, agro: 0.85, shooters: 2 }],
    dust: 280, dustR: 1250, timeLimit: 0, par: 135, heat: true,
  },
  {
    name: 'LIGHTHOUSE', tag: 'PULSAR',
    blurb: 'A dead star sweeps two beams of radiation across the sector.',
    tip: 'The beams sweep one plane. Dip in for a crystal, then climb out.',
    sky: { a: 0x0a2a6a, b: 0x3a0a5a, c: 0x7fb0ff, seed: 31.5, intensity: 0.95 },
    sunDir: [0.4, 0.2, 0.9], sunColor: 0xcfe0ff,
    bodies: [
      { kind: 'pulsar', r: 26, pos: [0, 0, 0], g: 9000, normal: [0.15, 1, 0.1], speed: 0.42, length: 2600 },
      { kind: 'planet', type: 'gas', r: 230, pos: [1500, -320, -1000], g: 480, colors: [0x2a4a9a, 0x7fb0f0, 0x1a2a6a], atmo: 0x7fa8ff, seed: 52,
        rings: { inner: 320, outer: 520, c1: 0x5a6a9a, c2: 0xcfd8ff, normal: [0.5, 1, 0.2] } },
    ],
    spawn: [0, 420, 900], gate: [-900, 560, -700],
    stars: [{ mode: 'ring', n: 12, center: [0, 0, 0], rmin: 380, rmax: 860, normal: [0.15, 1, 0.1], jitter: 22 }],
    asteroids: [{ mode: 'belt', n: 130, center: [0, 0, 0], rmin: 360, rmax: 950, thick: 90, normal: [0.15, 1, 0.1], speed: 0.09, size: [8, 26], tint: 0x7a86a8 }],
    aliens: [{ n: 4, center: [0, 300, 0], speed: 310, agro: 0.9, shooters: 2 }],
    dust: 260, dustR: 1050, timeLimit: 0, par: 140,
  },
  {
    name: 'WORMHOLE WEB', tag: 'WORMHOLES',
    blurb: 'Three star systems, thousands of units apart, stitched by wormholes.',
    tip: 'Each wormhole colour leads to its twin. Beat the clock.',
    sky: { a: 0x0a4a3a, b: 0x4a0a5a, c: 0x7fffd0, seed: 40.3, intensity: 1.05 },
    sunDir: [0.2, 0.7, 0.6], sunColor: 0xf0fff8,
    bodies: [
      { kind: 'planet', type: 'rock', r: 150, pos: [0, 0, 0], g: 420, colors: [0x0e3a3a, 0x2aa08a, 0xbfffe8], atmo: 0x55ffd0, seed: 61 },
      { kind: 'planet', type: 'gas', r: 230, pos: [5200, 600, -2800], g: 480, colors: [0x8a3a9a, 0xf0b0e0, 0x4a1a6a], atmo: 0xff9af0, seed: 62,
        rings: { inner: 320, outer: 560, c1: 0x7a5a8a, c2: 0xf0d0ff, normal: [0.3, 1, -0.2] } },
      { kind: 'planet', type: 'lava', r: 130, pos: [-4200, -900, -5200], g: 400, colors: [0x140a0a, 0x3a1a1a, 0xff3a2a], atmo: 0xff5040, seed: 63 },
    ],
    spawn: [0, 70, 360], gate: [0, 420, -720],
    portals: [
      { a: [540, 80, 0], b: [4640, 600, -2700], color: 0x55ccff },
      { a: [5500, 800, -2280], b: [-3720, -840, -5200], color: 0xff66dd },
      { a: [-4400, -1000, -4720], b: [-500, -60, 200], color: 0xaaff55 },
    ],
    stars: [
      { mode: 'shell', n: 5, center: [0, 0, 0], rmin: 260, rmax: 480 },
      { mode: 'shell', n: 5, center: [5200, 600, -2800], rmin: 340, rmax: 620 },
      { mode: 'shell', n: 5, center: [-4200, -900, -5200], rmin: 230, rmax: 460 },
    ],
    asteroids: [
      { mode: 'shell', n: 30, center: [0, 0, 0], rmin: 300, rmax: 800, speed: 0.08, size: [8, 22], tint: 0x6a9a90 },
      { mode: 'shell', n: 36, center: [5200, 600, -2800], rmin: 360, rmax: 860, speed: 0.08, size: [8, 24], tint: 0x9a7aa8 },
      { mode: 'shell', n: 36, center: [-4200, -900, -5200], rmin: 260, rmax: 760, speed: 0.1, size: [8, 26], tint: 0x8a5a50 },
    ],
    aliens: [
      { n: 1, center: [0, 0, 0], speed: 300, agro: 0.8, shooters: 0 },
      { n: 2, center: [5200, 600, -2800], speed: 310, agro: 0.9, shooters: 1 },
      { n: 2, center: [-4200, -900, -5200], speed: 320, agro: 0.95, shooters: 1 },
    ],
    dust: 300, dustR: 760, dustCenters: [[0, 0, 0], [5200, 600, -2800], [-4200, -900, -5200]],
    timeLimit: 210, par: 160,
  },
  {
    name: 'EVENT HORIZON', tag: 'BLACK HOLE',
    blurb: 'Crystals orbit a black hole. Fall past the horizon and it is over.',
    tip: 'Deep in the well time runs slow: score multiplies, the clock races.',
    sky: { a: 0x4a1a08, b: 0x1a0a4a, c: 0xffb070, seed: 52.8, intensity: 0.85 },
    sunDir: [0.3, 0.8, 0.5], sunColor: 0xffe8d0,
    bodies: [
      { kind: 'blackhole', r: 90, pos: [0, 0, 0], mu: 1.25e8, disk: { inner: 170, outer: 560, normal: [0.2, 1, 0.15] } },
    ],
    spawn: [0, 340, 1200], gate: [1250, 520, -850],
    stars: [
      { mode: 'ring', n: 10, center: [0, 0, 0], rmin: 300, rmax: 560, normal: [0.2, 1, 0.15], jitter: 38 },
      { mode: 'shell', n: 5, center: [0, 0, 0], rmin: 700, rmax: 980 },
    ],
    asteroids: [{ mode: 'belt', n: 150, center: [0, 0, 0], rmin: 620, rmax: 1150, thick: 130, normal: [0.2, 1, 0.15], speed: 0.16, size: [8, 28], tint: 0x9a7058 }],
    aliens: [{ n: 5, center: [0, 500, 0], speed: 330, agro: 1.0, shooters: 3 }],
    dust: 300, dustR: 1150, timeLimit: 170, par: 120, dilation: true,
  },
  {
    name: 'SUPERNOVA', tag: 'SUPERNOVA',
    blurb: 'A giant star has just collapsed. Outrun the shock front.',
    tip: 'The crystals spiral outward. Never stop, and never look back for long.',
    sky: { a: 0x5a0a2a, b: 0x0a2a5a, c: 0xffd0a0, seed: 66.6, intensity: 0.9 },
    sunDir: [0, 0.2, -1], sunColor: 0xffe8d8, starLit: true,
    bodies: [
      { kind: 'sun', r: 150, pos: [0, 0, 0], g: 620, c1: 0xeaf2ff, c2: 0x6aa8ff, light: 0xbfd8ff },
    ],
    spawn: [0, 120, 620], gate: [2050, 300, -2820],
    nova: { start: 190, speed: 21, accel: 0.13, delay: 5 },
    stars: [{ mode: 'spiral', n: 12, center: [0, 0, 0], rmin: 760, rmax: 3000, turns: 0.85, rise: 520 }],
    asteroids: [{ mode: 'shell', n: 150, center: [0, 0, 0], rmin: 520, rmax: 3300, speed: 0.05, size: [9, 30], tint: 0x8a7a8c }],
    aliens: [{ n: 3, center: [300, 200, 1500], speed: 330, agro: 1.0, shooters: 1 }],
    dust: 320, dustR: 3000, timeLimit: 0, par: 85, powerups: 4,
  },
];

// ── Daily Run: one procedurally generated sector per calendar day, the same for everyone ──
function rng32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hsl = (h, s, l) => {
  const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return (f(0) << 16) | (f(8) << 8) | f(4);
};
export function dailyKey(d = new Date()) { return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
export function dailyLevel(key = dailyKey()) {
  let seed = 2166136261; for (const ch of key) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619);
  const r = rng32(seed), pick = (a) => a[(r() * a.length) | 0], rr = (a, b) => a + r() * (b - a);
  const unit = () => { const th = r() * 6.2832, y = r() * 2 - 1, s = Math.sqrt(1 - y * y); return [Math.cos(th) * s, y, Math.sin(th) * s]; };
  const type = pick(['rock', 'gas', 'ice', 'lava', 'rock', 'gas']);
  const hue = r(), R = type === 'gas' ? rr(220, 290) : rr(120, 190);
  const colors = type === 'lava' ? [0x160c0a, hsl(hue, 0.4, 0.2), hsl(rr(0, 0.09), 1, 0.55)]
    : [hsl(hue, 0.55, type === 'ice' ? 0.35 : 0.16), hsl((hue + rr(-0.08, 0.08) + 1) % 1, 0.6, type === 'ice' ? 0.75 : 0.5), hsl((hue + 0.1) % 1, 0.5, 0.85)];
  const normal = [rr(-0.4, 0.4), 1, rr(-0.4, 0.4)];
  const rings = (type === 'gas' && r() < 0.75) || r() < 0.2 ? { inner: R * 1.4, outer: R * rr(2.2, 2.8), c1: hsl(hue, 0.25, 0.4), c2: hsl(hue, 0.3, 0.85), normal } : undefined;
  const bodies = [{ kind: 'planet', type, r: R, pos: [0, 0, 0], g: rr(380, 520), colors, atmo: hsl(hue, 0.9, 0.7), seed: r() * 90, rings }];
  if (r() < 0.6) { const u = unit(), d = R + rr(380, 560); bodies.push({ kind: 'planet', type: pick(['ice', 'rock', 'lava']), r: rr(40, 70), pos: [u[0] * d, u[1] * d * 0.4, u[2] * d], g: 240, colors: [hsl(r(), 0.3, 0.25), hsl(r(), 0.3, 0.6), 0xff5a10], atmo: hsl(r(), 0.7, 0.7), seed: r() * 90 }); }
  const belt = r() < 0.55, rmin = R + 150, rmax = R + rr(640, 820);
  const hue2 = (hue + rr(0.3, 0.7)) % 1;
  const lv = {
    name: 'DAILY RUN', tag: key, daily: key,
    blurb: 'One new sector every day, the same for every pilot.',
    tip: 'Same sector for everyone today. Beat your own best.',
    sky: { a: hsl(hue2, 0.75, 0.22), b: hsl((hue2 + 0.25) % 1, 0.7, 0.2), c: hsl((hue2 + 0.5) % 1, 0.9, 0.7), seed: r() * 80, intensity: rr(0.7, 1.0) },
    sunDir: unit().map((v, i) => (i === 1 ? Math.abs(v) * 0.6 + 0.1 : v)), sunColor: 0xfff4e8,
    bodies, spawn: [0, R * 0.5 + 60, R + rr(420, 620)], gate: unit().map((v) => v * (R + 760)),
    stars: [belt ? { mode: 'ring', n: 9, center: [0, 0, 0], rmin: rmin + 20, rmax: rmax - 20, normal, jitter: 40 } : { mode: 'shell', n: 9, center: [0, 0, 0], rmin, rmax }, { mode: 'shell', n: 3, center: [0, 0, 0], rmin: rmax, rmax: rmax + 200 }],
    asteroids: [belt ? { mode: 'belt', n: Math.round(rr(140, 260)), center: [0, 0, 0], rmin, rmax, thick: rr(20, 70), normal, speed: 0.1, size: [6, 28], tint: hsl(hue, 0.15, 0.55) }
      : { mode: 'shell', n: Math.round(rr(50, 90)), center: [0, 0, 0], rmin, rmax: rmax + 200, speed: 0.08, size: [8, 26], tint: hsl(hue, 0.15, 0.55) }],
    aliens: [{ n: 3 + ((r() * 3) | 0), center: [0, 0, 0], speed: rr(270, 320), agro: rr(0.7, 1.0), shooters: 1 + ((r() * 2) | 0) }],
    dust: 280, dustR: rmax + 200, timeLimit: 0, par: 110, powerups: 3,
  };
  if (r() < 0.45) {
    lv.comets = [{ a: rmax + 150, b: rmax * 0.6, normal: unit(), phase: r() * 6, speed: 0.2 }, { a: rmax, b: rmax * 0.75, normal: unit(), phase: r() * 6, speed: -0.22 }];
    lv.stars.push({ mode: 'comet', n: 2 });
  }
  return lv;
}
