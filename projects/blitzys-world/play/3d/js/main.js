// Blitzy's World v1.0 "Odyssey" — main game module.
import * as THREE from 'three';
import * as SH from './shaders.js';
import { Post } from './post.js';
import { Sound } from './audio.js';
import { LEVELS } from './levels.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Environment ─────────────────────────────────────────────────────────────
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (isTouch) document.body.classList.add('touch');
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
};
let quality = store.get('bw1_quality', isTouch ? 'low' : 'high');
const LOW = () => quality === 'low';

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: false });
} catch (e) {
  $('ov-title').textContent = 'WEBGL NEEDED';
  $('ov-blurb').textContent = 'This browser could not start WebGL 2. Try the classic 2D build instead.';
  $('ov-btn').style.display = 'none';
  throw e;
}
renderer.toneMapping = THREE.NoToneMapping;
renderer.domElement.id = 'view';
document.body.prepend(renderer.domElement);
const post = new Post(renderer, { mips: 5, msaa: LOW() ? 0 : 4 });
const sound = new Sound();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 1, 40000);
const world = new THREE.Group();
scene.add(world);

let maxPR = 1, pr = 1;
function resize() {
  maxPR = Math.min(devicePixelRatio || 1, LOW() ? 1.25 : 2);
  pr = clamp(pr, 0.5, maxPR);
  renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth, innerHeight);
  post.resize(innerWidth * pr, innerHeight * pr);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  const scale = innerHeight * pr / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  particleMat.uniforms.uScale.value = scale;
  dustMat.uniforms.uScale.value = scale;
  speedDustMat.uniforms.uScale.value = scale;
  starPointsMat.uniforms.uPR.value = pr;
  const fx = $('fx');
  fx.width = innerWidth; fx.height = innerHeight;
}

// ── Shared resources ────────────────────────────────────────────────────────
function glowTexture() {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.45)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const GLOW = glowTexture();
function glowSprite(color, scale, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(scale);
  return s;
}
function hdr(hex, k) { return new THREE.Color(hex).multiplyScalar(k); }

const particleMat = SH.particleMaterial();
const dustMat = SH.particleMaterial();
const speedDustMat = SH.speedDustMaterial(900);
const starPointsMat = SH.starPointsMaterial();

// ── Sky: nebula baked to a cube map per sector + live twinkling stars ───────
const skyScene = new THREE.Scene();
const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(50, 48, 32));
skyScene.add(skyMesh);
const cubeRT = new THREE.WebGLCubeRenderTarget(LOW() ? 512 : 1024, { type: post.type, generateMipmaps: false });
const cubeCam = new THREE.CubeCamera(1, 100, cubeRT);
function bakeSky(cfg) {
  if (skyMesh.material) skyMesh.material.dispose();
  skyMesh.material = SH.skyMaterial(cfg);
  cubeCam.update(renderer, skyScene);
  scene.background = cubeRT.texture;
}
const starPoints = (() => {
  const N = LOW() ? 2200 : 4200, r = mulberry(99);
  const pos = new Float32Array(N * 3), colr = new Float32Array(N * 3), size = new Float32Array(N);
  const pal = [[1, 1, 1], [0.8, 0.88, 1], [1, 0.9, 0.75], [0.75, 0.8, 1], [1, 0.75, 0.65]];
  for (let i = 0; i < N; i++) {
    const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1), R = 20000;
    pos[i * 3] = R * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = R * Math.cos(ph); pos[i * 3 + 2] = R * Math.sin(ph) * Math.sin(th);
    const c = pal[(r() * pal.length) | 0];
    colr.set(c, i * 3);
    size[i] = 0.6 + Math.pow(r(), 6) * 3.4;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const p = new THREE.Points(g, starPointsMat); p.frustumCulled = false; p.renderOrder = -10;
  scene.add(p); return p;
})();
const speedDust = (() => {
  const N = LOW() ? 350 : 800, pos = new Float32Array(N * 3), r = mulberry(5);
  for (let i = 0; i < N * 3; i++) pos[i] = r() * 900;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, speedDustMat); p.frustumCulled = false; scene.add(p); return p;
})();

// ── Lights ──────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x2a2440, 0.9); scene.add(ambient);
const sunLight = new THREE.DirectionalLight(0xffffff, 3.0); scene.add(sunLight);
const orbLight = new THREE.PointLight(0xc8a0ff, 30000, 420, 2); scene.add(orbLight);

// ── Particles (CPU-simulated pool, one draw call) ───────────────────────────
const MAXP = LOW() ? 1400 : 3200;
const P = {
  n: 0, pos: new Float32Array(MAXP * 3), vel: new Float32Array(MAXP * 3), col: new Float32Array(MAXP * 3),
  base: new Float32Array(MAXP * 3), data: new Float32Array(MAXP * 2), life: new Float32Array(MAXP), max: new Float32Array(MAXP), size: new Float32Array(MAXP),
};
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(P.pos, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('color', new THREE.BufferAttribute(P.base, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('aData', new THREE.BufferAttribute(P.data, 2).setUsage(THREE.DynamicDrawUsage));
pGeo.setDrawRange(0, 0);
const pMesh = new THREE.Points(pGeo, particleMat); pMesh.frustumCulled = false; scene.add(pMesh);
function emit(x, y, z, vx, vy, vz, r, g, b, size, life) {
  if (P.n >= MAXP) return;
  const i = P.n++;
  P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z;
  P.vel[i * 3] = vx; P.vel[i * 3 + 1] = vy; P.vel[i * 3 + 2] = vz;
  P.base[i * 3] = r; P.base[i * 3 + 1] = g; P.base[i * 3 + 2] = b;
  P.size[i] = size; P.life[i] = life; P.max[i] = life;
}
function burst(p, n, speed, r, g, b, size, life, inherit) {
  if (LOW()) n = Math.ceil(n * 0.5);
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), s = speed * (0.25 + Math.random() * 0.75);
    emit(p.x, p.y, p.z,
      Math.sin(ph) * Math.cos(th) * s + (inherit ? inherit.x : 0), Math.cos(ph) * s + (inherit ? inherit.y : 0), Math.sin(ph) * Math.sin(th) * s + (inherit ? inherit.z : 0),
      r, g, b, size * (0.5 + Math.random()), life * (0.5 + Math.random() * 0.5));
  }
}
function updateParticles(dt) {
  let i = 0;
  while (i < P.n) {
    P.life[i] -= dt;
    if (P.life[i] <= 0) {
      const l = --P.n;
      if (i !== l) {
        for (let k = 0; k < 3; k++) { P.pos[i * 3 + k] = P.pos[l * 3 + k]; P.vel[i * 3 + k] = P.vel[l * 3 + k]; P.base[i * 3 + k] = P.base[l * 3 + k]; }
        P.size[i] = P.size[l]; P.life[i] = P.life[l]; P.max[i] = P.max[l];
      }
      continue;
    }
    P.pos[i * 3] += P.vel[i * 3] * dt; P.pos[i * 3 + 1] += P.vel[i * 3 + 1] * dt; P.pos[i * 3 + 2] += P.vel[i * 3 + 2] * dt;
    const f = P.life[i] / P.max[i];
    P.data[i * 2] = P.size[i] * (0.4 + 0.6 * f); P.data[i * 2 + 1] = f;
    i++;
  }
  pGeo.setDrawRange(0, P.n);
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true; pGeo.attributes.aData.needsUpdate = true;
}

// ── Blitzy ──────────────────────────────────────────────────────────────────
const BALL_R = 9;
const THRUST = 1150, BOOST_THRUST = 2500, DRAG = 1.25;
const orbMat = SH.orbMaterial();
const orb = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 40, 28), orbMat); scene.add(orb);
const orbGlow = glowSprite(hdr(0xb080ff, 0.6), BALL_R * 6); scene.add(orbGlow);
const shieldMat = SH.shellMaterial(0x66ddff);
const shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R * 1.9, 32, 20), shieldMat); scene.add(shieldMesh);
const pulseMat = SH.shellMaterial(0xa070ff);
const pulseMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), pulseMat); pulseMesh.visible = false; scene.add(pulseMesh);

const ball = new THREE.Vector3(), vel = new THREE.Vector3();
let yaw = 0, pitch = 0.2;

// light ribbon
const TR_N = 80;
const trail = { pts: [], pos: new Float32Array(TR_N * 6), col: new Float32Array(TR_N * 8), side: new Float32Array(TR_N * 2) };
const trailGeo = new THREE.BufferGeometry();
{
  const idx = [];
  for (let i = 0; i < TR_N - 1; i++) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  for (let i = 0; i < TR_N; i++) { trail.side[2 * i] = -1; trail.side[2 * i + 1] = 1; }
  trailGeo.setIndex(idx);
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trail.pos, 3).setUsage(THREE.DynamicDrawUsage));
  trailGeo.setAttribute('aCol', new THREE.BufferAttribute(trail.col, 4).setUsage(THREE.DynamicDrawUsage));
  trailGeo.setAttribute('aSide', new THREE.BufferAttribute(trail.side, 1));
  trailGeo.setDrawRange(0, 0);
}
const trailMesh = new THREE.Mesh(trailGeo, SH.trailMaterial()); trailMesh.frustumCulled = false; scene.add(trailMesh);
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _t3 = new THREE.Vector3(), _t4 = new THREE.Vector3();
function updateTrail(boosting) {
  const pts = trail.pts, last = pts[0];
  if (!last || last.distanceToSquared(ball) > 36) {
    const p = pts.length >= TR_N ? pts.pop() : new THREE.Vector3();
    p.copy(ball); pts.unshift(p);
  }
  const n = pts.length;
  if (n < 2) { trailGeo.setDrawRange(0, 0); return; }
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    _t1.subVectors(a, b); _t2.subVectors(camera.position, p);
    _t3.crossVectors(_t1, _t2).normalize();
    const f = 1 - i / (TR_N - 1), w = (boosting ? 8 : 5) * f;
    trail.pos[i * 6] = p.x - _t3.x * w; trail.pos[i * 6 + 1] = p.y - _t3.y * w; trail.pos[i * 6 + 2] = p.z - _t3.z * w;
    trail.pos[i * 6 + 3] = p.x + _t3.x * w; trail.pos[i * 6 + 4] = p.y + _t3.y * w; trail.pos[i * 6 + 5] = p.z + _t3.z * w;
    const r = lerp(0.35, 0.9, f), g = lerp(0.9, 0.35, f), bl = 1.0, al = f * f * (boosting ? 3.2 : 2.0);
    for (let k = 0; k < 2; k++) { const o = i * 8 + k * 4; trail.col[o] = r; trail.col[o + 1] = g; trail.col[o + 2] = bl; trail.col[o + 3] = al; }
  }
  trailGeo.setDrawRange(0, (n - 1) * 6);
  trailGeo.attributes.position.needsUpdate = true; trailGeo.attributes.aCol.needsUpdate = true;
}

// ── Sector state ────────────────────────────────────────────────────────────
let L = LEVELS[0], levelIndex = 0;
const bodies = [], crystals = [], aliens = [], comets = [], portals = [], shots = [];
let asteroidSets = [], pulsar = null, blackhole = null, gate = null, dust = null;
const timeMats = []; // materials with a uTime uniform

function disposeWorld() {
  world.traverse((o) => {
    if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose();
    if (o.material && !o.userData.sharedMat) { if (o.material.map && o.material.map !== GLOW) o.material.map.dispose(); o.material.dispose(); }
  });
  world.clear();
  bodies.length = crystals.length = aliens.length = comets.length = portals.length = shots.length = 0;
  asteroidSets = []; pulsar = blackhole = gate = dust = null; timeMats.length = 0;
}

function basis(normal) {
  const n = normal.clone().normalize();
  const u = new THREE.Vector3().crossVectors(n, Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
  const v = new THREE.Vector3().crossVectors(n, u).normalize();
  return { n, u, v };
}
function randUnit(r, out = new THREE.Vector3()) {
  const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1);
  return out.set(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
}
const Z = new THREE.Vector3(0, 0, 1), Y = new THREE.Vector3(0, 1, 0);

function buildBody(cfg, sunDir) {
  const pos = V3(cfg.pos), group = new THREE.Group();
  group.position.copy(pos);
  const b = { cfg, kind: cfg.kind, pos, r: cfg.r, mu: cfg.mu || cfg.g * cfg.r * cfg.r, group, pass: null };
  const seg = LOW() ? 48 : 96;
  if (cfg.kind === 'planet') {
    // light comes from the sector sun, or from the binary pair at the origin
    const sd = L.heat ? pos.clone().multiplyScalar(-1).normalize() : sunDir;
    const mat = SH.planetMaterial({ type: { rock: 0, gas: 1, lava: 2, ice: 3 }[cfg.type], colors: cfg.colors, atmo: cfg.atmo, seed: cfg.seed, sunDir: sd, sunColor: L.sunColor });
    b.mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.r, seg, seg / 2), mat);
    if (cfg.rings) b.mesh.quaternion.setFromUnitVectors(Y, V3(cfg.rings.normal).normalize()); else b.mesh.rotation.z = 0.2;
    group.add(b.mesh); timeMats.push(mat);
    group.add(new THREE.Mesh(new THREE.SphereGeometry(cfg.r * 1.08, 64, 32), SH.atmosphereMaterial(cfg.atmo, sd, 1.08)));
    if (cfg.rings) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(cfg.rings.inner, cfg.rings.outer, 180, 1), SH.ringMaterial(cfg.rings.c1, cfg.rings.c2, cfg.rings.inner, cfg.rings.outer, cfg.seed));
      ring.quaternion.setFromUnitVectors(Z, V3(cfg.rings.normal).normalize());
      group.add(ring);
    }
    b.hot = cfg.type === 'lava';
  } else if (cfg.kind === 'sun') {
    const mat = SH.sunMaterial(cfg.c1, cfg.c2);
    b.mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.r, seg, seg / 2), mat);
    group.add(b.mesh); timeMats.push(mat);
    group.add(glowSprite(hdr(cfg.c2, 0.7), cfg.r * 7.5, 0.9));
    group.add(glowSprite(hdr(cfg.c1, 0.45), cfg.r * 3.4, 0.8));
    group.add(new THREE.PointLight(cfg.light, 2.2, 0, 0));
    b.hot = true;
  } else if (cfg.kind === 'blackhole') {
    group.add(new THREE.Mesh(new THREE.SphereGeometry(cfg.r, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })));
    const mat = SH.diskMaterial(cfg.disk.inner, cfg.disk.outer);
    const disk = new THREE.Mesh(new THREE.RingGeometry(cfg.disk.inner, cfg.disk.outer, 200, 24), mat);
    disk.quaternion.setFromUnitVectors(Z, V3(cfg.disk.normal).normalize());
    group.add(disk); timeMats.push(mat);
    group.add(glowSprite(hdr(0xff7a30, 0.5), cfg.disk.outer * 3.2, 0.5));
    blackhole = b;
  } else if (cfg.kind === 'pulsar') {
    group.add(new THREE.Mesh(new THREE.SphereGeometry(cfg.r, 32, 20), new THREE.MeshBasicMaterial({ color: hdr(0xbfd8ff, 9) })));
    group.add(glowSprite(hdr(0x7fb0ff, 2.2), cfg.r * 16, 1));
    const beams = new THREE.Group(), len = cfg.length, mat = SH.beamMaterial(hdr(0x8fc0ff, 1), len);
    for (const s of [1, -1]) {
      const geo = new THREE.ConeGeometry(14 + len * 0.03, len, 28, 1, true);
      geo.translate(0, -len / 2, 0);
      const cone = new THREE.Mesh(geo, mat);
      if (s < 0) cone.rotation.x = Math.PI;
      beams.add(cone);
    }
    world.add(beams); beams.position.copy(pos); timeMats.push(mat);
    const bs = basis(V3(cfg.normal));
    pulsar = { body: b, beams, ...bs, ang: 0, speed: cfg.speed, axis: new THREE.Vector3(), len, mat };
    b.hot = true;
  }
  if (cfg.orbit) b.orbit = { ...cfg.orbit, ang: cfg.orbit.phase };
  world.add(group);
  bodies.push(b);
  return b;
}

// one lumpy rock, shared by every asteroid instance
const rockGeo = (() => {
  const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 3.1 + 1.3) * Math.sin(v.y * 2.7 + 0.4) * Math.sin(v.z * 3.7 + 2.1) * 0.24
      + Math.sin(v.x * 7.3) * Math.sin(v.y * 6.1 + 1.0) * Math.sin(v.z * 8.3) * 0.1;
    v.multiplyScalar(1 + n); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
})();
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();
function buildAsteroids(cfg, r) {
  const n = LOW() ? Math.ceil(cfg.n * 0.7) : cfg.n;
  const mesh = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0.05, flatShading: true }), n);
  mesh.userData.sharedGeo = true; mesh.frustumCulled = false;
  const set = { mesh, n, center: V3(cfg.center), items: [] };
  const bs = cfg.normal ? basis(V3(cfg.normal)) : null, tint = new THREE.Color(cfg.tint);
  for (let i = 0; i < n; i++) {
    const R = cfg.rmin + r() * (cfg.rmax - cfg.rmin);
    let u, v, off = 0, w;
    if (cfg.mode === 'belt') { u = bs.u; v = bs.v; off = (r() * 2 - 1) * cfg.thick; w = cfg.speed * Math.pow(cfg.rmin / R, 1.5) * (0.85 + r() * 0.3); }
    else { const b2 = basis(randUnit(r)); u = b2.u; v = b2.v; w = cfg.speed * Math.pow(cfg.rmin / R, 1.5) * (0.6 + r() * 0.8) * (r() < 0.5 ? -1 : 1); }
    const rad = cfg.size[0] + Math.pow(r(), 2) * (cfg.size[1] - cfg.size[0]);
    set.items.push({
      R, u, v, off, nrm: bs ? bs.n : null, ang: r() * Math.PI * 2, w, rad, alive: true, near: 0,
      pos: new THREE.Vector3(), axis: randUnit(r), rot: r() * 6, rotW: (r() - 0.5) * 1.6,
      sx: 0.75 + r() * 0.5, sy: 0.75 + r() * 0.5, sz: 0.75 + r() * 0.5,
    });
    _c.copy(tint).multiplyScalar(0.55 + r() * 0.6); mesh.setColorAt(i, _c);
  }
  mesh.instanceColor.needsUpdate = true;
  world.add(mesh); asteroidSets.push(set);
}
function updateAsteroids(dt) {
  for (const set of asteroidSets) {
    const items = set.items;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      if (!a.alive) continue;
      a.ang += a.w * dt; a.rot += a.rotW * dt;
      if (a.near > 0) a.near -= dt;
      const cs = Math.cos(a.ang) * a.R, sn = Math.sin(a.ang) * a.R;
      a.pos.set(set.center.x + a.u.x * cs + a.v.x * sn, set.center.y + a.u.y * cs + a.v.y * sn, set.center.z + a.u.z * cs + a.v.z * sn);
      if (a.nrm) a.pos.addScaledVector(a.nrm, a.off);
      _q.setFromAxisAngle(a.axis, a.rot); _s.set(a.rad * a.sx, a.rad * a.sy, a.rad * a.sz);
      _m4.compose(a.pos, _q, _s); set.mesh.setMatrixAt(i, _m4);
    }
    set.mesh.instanceMatrix.needsUpdate = true;
  }
}
function killAsteroid(set, i) {
  const a = set.items[i]; a.alive = false;
  _m4.makeScale(0, 0, 0); set.mesh.setMatrixAt(i, _m4); set.mesh.instanceMatrix.needsUpdate = true;
  burst(a.pos, 14 + a.rad, 160, 0.9, 0.75, 0.6, a.rad * 0.9, 0.9);
}

const crystalGeo = new THREE.OctahedronGeometry(10, 0);
const crystalMat = new THREE.MeshStandardMaterial({ color: 0xffd060, emissive: hdr(0xffb020, 2.6), roughness: 0.25, metalness: 0.4, flatShading: true });
function addCrystal(pos, extra) {
  const mesh = new THREE.Mesh(crystalGeo, crystalMat); mesh.userData.sharedGeo = mesh.userData.sharedMat = true;
  const glow = glowSprite(hdr(0xffc040, 0.7), 62, 0.9);
  mesh.position.copy(pos); glow.position.copy(pos);
  world.add(mesh, glow);
  crystals.push({ mesh, glow, pos: mesh.position, alive: true, spin: 1 + Math.random(), ...extra });
}
function buildCrystals(groups, r) {
  for (const g of groups) {
    if (g.mode === 'comet') {
      for (const c of comets) for (let k = 0; k < g.n; k++) addCrystal(new THREE.Vector3(), { comet: c, lag: 0.16 + k * 0.11 });
      continue;
    }
    const center = V3(g.center), bs = g.normal ? basis(V3(g.normal)) : null;
    for (let k = 0; k < g.n; k++) {
      const p = new THREE.Vector3();
      if (g.mode === 'ring') {
        const ang = (k / g.n) * Math.PI * 2 + r() * 0.5, R = g.rmin + r() * (g.rmax - g.rmin);
        p.copy(center).addScaledVector(bs.u, Math.cos(ang) * R).addScaledVector(bs.v, Math.sin(ang) * R).addScaledVector(bs.n, (r() * 2 - 1) * g.jitter);
      } else {
        randUnit(r, p).multiplyScalar(g.rmin + r() * (g.rmax - g.rmin)).add(center);
      }
      // keep clear of solid bodies
      for (const b of bodies) { const d = p.distanceTo(b.pos); if (d < b.r + 60) p.sub(b.pos).setLength(b.r + 80).add(b.pos); }
      addCrystal(p, {});
    }
  }
}

function buildDust(r) {
  const n = LOW() ? Math.ceil(L.dust * 0.6) : L.dust;
  const centers = (L.dustCenters || [[0, 0, 0]]).map(V3);
  const pos = new Float32Array(n * 3), colr = new Float32Array(n * 3), data = new Float32Array(n * 2), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const c = centers[i % centers.length];
    for (let tries = 0; tries < 6; tries++) {
      randUnit(r, v).multiplyScalar(L.dustR * (0.25 + 0.75 * Math.cbrt(r()))).add(c);
      if (!bodies.some((b) => v.distanceTo(b.pos) < b.r + 30)) break;
    }
    pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
    colr[i * 3] = 0.5; colr[i * 3 + 1] = 1.4; colr[i * 3 + 2] = 1.8;
    data[i * 2] = 7; data[i * 2 + 1] = 1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
  g.setAttribute('aData', new THREE.BufferAttribute(data, 2).setUsage(THREE.DynamicDrawUsage));
  const mesh = new THREE.Points(g, dustMat); mesh.frustumCulled = false; mesh.userData.sharedMat = true;
  world.add(mesh);
  dust = { n, pos, data, alive: new Uint8Array(n).fill(1), geo: g };
}

const ALIEN_R = 17;
function buildAliens(groups, r) {
  for (const g of groups) {
    const center = V3(g.center);
    for (let k = 0; k < g.n; k++) {
      const grp = new THREE.Group();
      const shooter = k < g.shooters;
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(ALIEN_R * 0.62, 0),
        new THREE.MeshStandardMaterial({ color: 0x101418, emissive: hdr(shooter ? 0xff3a5a : 0x38ff8a, 2.2), roughness: 0.4, metalness: 0.6, flatShading: true }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(ALIEN_R, 1.8, 8, 28), new THREE.MeshStandardMaterial({ color: 0x8892a8, roughness: 0.35, metalness: 0.9, emissive: 0x121820 }));
      const ring2 = ring.clone(); ring2.rotation.x = Math.PI / 2;
      const glow = glowSprite(hdr(shooter ? 0xff3050 : 0x30ff80, 1.2), ALIEN_R * 5, 0.75);
      grp.add(core, ring, ring2, glow);
      const home = randUnit(r).multiplyScalar(520 + r() * 380).add(center);
      grp.position.copy(home);
      world.add(grp);
      aliens.push({ grp, core, ring, ring2, glow, pos: grp.position, vel: new THREE.Vector3(), home, speed: g.speed, agro: g.agro, shooter, cd: 2 + r() * 3, stun: 0, alive: true, base: shooter ? 0xff3a5a : 0x38ff8a });
    }
  }
}
const shotGeo = new THREE.SphereGeometry(5, 10, 8), shotMat = new THREE.MeshBasicMaterial({ color: hdr(0xff4a30, 6) });
function fireShot(al) {
  const lead = _t1.copy(ball).addScaledVector(vel, clamp(al.pos.distanceTo(ball) / 620, 0, 1.2)).sub(al.pos).normalize();
  const mesh = new THREE.Mesh(shotGeo, shotMat); mesh.userData.sharedGeo = mesh.userData.sharedMat = true;
  mesh.position.copy(al.pos); world.add(mesh);
  shots.push({ mesh, vel: lead.clone().multiplyScalar(620), life: 4.5 });
  sound.shot();
}

function buildComets(list) {
  for (const c of list) {
    const bs = basis(V3(c.normal));
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(16, 1), new THREE.MeshStandardMaterial({ color: 0xdff4ff, emissive: hdr(0x66c8ff, 1.4), roughness: 0.3, flatShading: true }));
    const glow = glowSprite(hdr(0x7fd8ff, 1.5), 150, 0.9);
    world.add(head, glow);
    comets.push({ ...c, ...bs, ang: c.phase, head, glow, pos: head.position, vel: new THREE.Vector3(), acc: 0 });
  }
}
function cometPos(c, ang, out) {
  return out.set(0, 0, 0).addScaledVector(c.u, Math.cos(ang) * c.a).addScaledVector(c.v, Math.sin(ang) * c.b);
}

const portalGeo = new THREE.CircleGeometry(1, 48), torusGeo = new THREE.TorusGeometry(1, 0.06, 10, 64);
function makePortal(pos, color, radius) {
  const grp = new THREE.Group(), mat = SH.portalMaterial(color);
  const disc = new THREE.Mesh(portalGeo, mat); disc.userData.sharedGeo = true;
  const rim = new THREE.Mesh(torusGeo, new THREE.MeshBasicMaterial({ color: hdr(color, 3) })); rim.userData.sharedGeo = true;
  grp.add(disc, rim, glowSprite(hdr(color, 0.9), 3.4, 0.7));
  grp.scale.setScalar(radius); grp.position.copy(pos);
  world.add(grp); timeMats.push(mat);
  return { grp, mat, pos: grp.position, radius };
}

function buildLevel(idx) {
  disposeWorld();
  levelIndex = idx; L = LEVELS[idx];
  const r = mulberry(1000 + idx * 7919);
  bakeSky(L.sky);
  const sunDir = V3(L.sunDir).normalize();
  sunLight.position.copy(sunDir).multiplyScalar(1000);
  sunLight.color.set(L.sunColor); sunLight.intensity = L.heat ? 0.6 : 3.0;
  for (const b of L.bodies) buildBody(b, sunDir);
  if (L.comets) buildComets(L.comets);
  for (const a of L.asteroids) buildAsteroids(a, r);
  buildCrystals(L.stars, r);
  buildAliens(L.aliens, r);
  buildDust(r);
  if (L.portals) for (const p of L.portals) {
    const A = makePortal(V3(p.a), p.color, 52), B = makePortal(V3(p.b), p.color, 52);
    A.twin = B; B.twin = A; portals.push(A, B);
  }
  gate = makePortal(V3(L.gate), 0xfff0b0, 78);
  gate.grp.visible = false; gate.open = 0; gate.active = false;
  sound.setMood(idx);
  updateWorld(0);
}

// ── Game state ──────────────────────────────────────────────────────────────
let mode = 'title'; // title | playing | warping | paused | levelclear | gameover | victory
let score = 0, shields = 3, energy = 100, combo = 0, lastPickup = -99, invuln = 0;
let levelTime = 0, clockTime = 0, starsGot = 0, starsTotal = 0, tookDamage = false;
let heat = 0, dilation = 1, mult = 1, pulseCd = 0, pulseT = -1, portalCd = 0, slingCd = 0;
let warpIn = 0, warpOut = 0, shake = 0, hitFlash = 0, shieldFlash = 0, t = 0, surfT = 0, alarmT = 0;
const flashCol = new THREE.Vector4(0, 0, 0, 0);
const progress = store.get('bw1_progress', { cleared: 0, medals: [], best: [] });
progress.cleared = Math.max(progress.cleared || 0, store.get('bw_cleared', 0) > 0 ? 1 : 0);
const saveProgress = () => store.set('bw1_progress', progress);

// ── DOM / HUD ───────────────────────────────────────────────────────────────
const ui = {
  overlay: $('overlay'), title: $('ov-title'), sub: $('ov-sub'), blurb: $('ov-blurb'), btn: $('ov-btn'), keys: $('ov-keys'),
  cards: $('level-cards'), stats: $('ov-stats'), hud: $('hud'), flash: $('flash'), toast: $('toast'),
  level: $('h-level'), name: $('h-name'), score: $('h-score'), combo: $('h-combo'), stars: $('h-stars'), shield: $('h-shield'),
  energy: $('h-energy'), timer: $('h-timer'), heatRow: $('h-heat-row'), heat: $('h-heat'), dilRow: $('h-dil-row'), dil: $('h-dil'),
  obj: $('h-obj'), mute: $('b-mute'), qual: $('b-qual'), fx: $('fx').getContext('2d'),
};
function toast(msg, ms = 1500) {
  ui.toast.textContent = msg; ui.toast.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => ui.toast.classList.remove('on'), ms);
}
function flash(msg, ms = 1700) {
  ui.flash.textContent = msg; ui.flash.classList.add('on');
  clearTimeout(flash._t); flash._t = setTimeout(() => ui.flash.classList.remove('on'), ms);
}
const pad6 = (n) => String(Math.floor(n)).padStart(6, '0');
function hudStatic() {
  ui.level.textContent = `SECTOR ${levelIndex + 1}/${LEVELS.length}`;
  ui.name.textContent = `${L.name} · ${L.tag}`;
  ui.heatRow.style.display = L.heat ? '' : 'none';
  ui.dilRow.style.display = L.dilation ? '' : 'none';
  ui.timer.style.display = L.timeLimit ? '' : 'none';
  hudDynamic(true);
}
let _hs = {};
function hudDynamic(force) {
  const s = Math.floor(score);
  if (force || _hs.score !== s) { ui.score.textContent = pad6(s); _hs.score = s; }
  if (force || _hs.combo !== combo) { ui.combo.textContent = combo > 1 ? `×${combo}` : ''; _hs.combo = combo; }
  if (force || _hs.stars !== starsGot) { ui.stars.textContent = `${starsGot}/${starsTotal}`; _hs.stars = starsGot; }
  if (force || _hs.sh !== shields) { ui.shield.textContent = '◆'.repeat(Math.max(0, shields)) + '◇'.repeat(Math.max(0, 3 - shields)); _hs.sh = shields; }
  const e = Math.round(energy);
  if (force || _hs.e !== e) { ui.energy.style.width = e + '%'; ui.energy.classList.toggle('low', e < 30); _hs.e = e; }
  if (L.timeLimit) {
    const left = Math.max(0, L.timeLimit - clockTime), tx = left.toFixed(1);
    if (_hs.t !== tx) { ui.timer.textContent = tx + 's'; ui.timer.classList.toggle('warn', left < 20); _hs.t = tx; }
  }
  if (L.heat) { const h = Math.round(heat); if (_hs.h !== h) { ui.heat.style.width = h + '%'; ui.heat.classList.toggle('low', h > 70); _hs.h = h; } }
  if (L.dilation) { const d = dilation.toFixed(2); if (_hs.d !== d) { ui.dil.textContent = `×${d} · PTS ×${mult.toFixed(1)}`; _hs.d = d; } }
  const obj = gate && gate.active ? 'WARP GATE OPEN — FLY THROUGH IT' : `COLLECT ${starsTotal - starsGot} STAR CRYSTAL${starsTotal - starsGot === 1 ? '' : 'S'}`;
  if (force || _hs.obj !== obj) { ui.obj.textContent = obj; _hs.obj = obj; }
}
function setPlayingUI(on) {
  ui.hud.classList.toggle('on', on);
  document.body.classList.toggle('playing', on);
}
function medalStr(m) { return m ? '★'.repeat(m) + '☆'.repeat(3 - m) : '☆☆☆'; }
function buildCards() {
  ui.cards.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const unlocked = i <= progress.cleared;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lcard' + (unlocked ? '' : ' locked') + (i === levelIndex ? ' cur' : '');
    b.innerHTML = `<span class="ln">${String(i + 1).padStart(2, '0')} · ${unlocked ? lv.tag : 'LOCKED'}</span><span class="nm">${lv.name}</span><span class="md">${medalStr(progress.medals[i])}</span>`;
    if (unlocked) b.addEventListener('click', (e) => { e.stopPropagation(); sound.start(); startLevel(i, false); });
    else b.disabled = true;
    ui.cards.appendChild(b);
  });
}
function showOverlay({ title, sub = '', blurb = '', btn = 'PLAY', keys = false, cards = false, stats = '' }) {
  ui.overlay.classList.add('on');
  ui.title.textContent = title; ui.sub.textContent = sub; ui.blurb.textContent = blurb; ui.btn.textContent = btn;
  ui.keys.style.display = keys ? '' : 'none';
  ui.cards.style.display = cards ? 'grid' : 'none';
  ui.stats.innerHTML = stats; ui.stats.style.display = stats ? 'block' : 'none';
  ui.toast.classList.remove('on'); ui.flash.classList.remove('on');
  if (cards) buildCards();
  setPlayingUI(false);
  ui.btn.focus({ preventScroll: true });
}
const tapWord = isTouch ? 'TAP' : 'CLICK';

// ── Flow ────────────────────────────────────────────────────────────────────
function startLevel(idx, keepScore) {
  buildLevel(clamp(idx, 0, LEVELS.length - 1));
  if (!keepScore) score = 0;
  shields = 3; energy = 100; combo = 0; lastPickup = -99; invuln = 1.5; tookDamage = false;
  levelTime = clockTime = 0; starsGot = 0; starsTotal = crystals.length; heat = 0; dilation = 1; mult = 1;
  pulseCd = 0; pulseT = -1; portalCd = 0; slingCd = 0; shake = 0; hitFlash = 0; warpOut = 0;
  ball.copy(V3(L.spawn)); vel.set(0, 0, 0);
  // face the main body
  const toC = _t1.copy(bodies[0].pos).sub(ball);
  yaw = Math.atan2(-toC.x, -toC.z); pitch = clamp(Math.asin(clamp(-toC.y / toC.length(), -1, 1)) + 0.12, -1.2, 1.2);
  trail.pts.length = 0; P.n = 0;
  warpIn = reduceMotion ? 0 : 1;
  mode = 'playing';
  ui.overlay.classList.remove('on');
  setPlayingUI(true); hudStatic();
  flash(L.name, 2200); toast(L.tip, 5200);
  sound.suspend(false);
  snapCamera();
  requestLock();
}
function pauseGame() {
  if (mode !== 'playing') return;
  mode = 'paused';
  for (const k in keys) keys[k] = false;
  if (document.pointerLockElement) document.exitPointerLock();
  sound.suspend(true);
  showOverlay({ title: 'PAUSED', sub: `SECTOR ${levelIndex + 1} · ${L.name}`, blurb: L.tip, btn: `${tapWord} TO RESUME`, keys: true, cards: true });
}
function resume() {
  mode = 'playing'; ui.overlay.classList.remove('on'); setPlayingUI(true); sound.suspend(false); requestLock();
}
function openGate() {
  gate.active = true; gate.grp.visible = true;
  flash('WARP GATE OPEN', 2200); sound.gateOpen();
  flashCol.set(1, 0.9, 0.6, 0.35);
}
function levelClear() {
  mode = 'levelclear';
  if (document.pointerLockElement) document.exitPointerLock();
  const timeBonus = Math.max(0, Math.floor((L.par - levelTime) * 20));
  const shieldBonus = shields * 300;
  score += timeBonus + shieldBonus;
  const medals = 1 + (tookDamage ? 0 : 1) + (levelTime <= L.par ? 1 : 0);
  progress.medals[levelIndex] = Math.max(progress.medals[levelIndex] || 0, medals);
  progress.best[levelIndex] = Math.max(progress.best[levelIndex] || 0, Math.floor(score));
  progress.cleared = Math.max(progress.cleared, levelIndex + 1);
  saveProgress();
  sound.clear(); sound.suspend(true);
  const last = levelIndex + 1 >= LEVELS.length;
  const stats = `<div><span>TIME</span><b>${levelTime.toFixed(1)}s <i>par ${L.par}s</i></b></div>`
    + `<div><span>TIME BONUS</span><b>+${timeBonus}</b></div><div><span>SHIELD BONUS</span><b>+${shieldBonus}</b></div>`
    + `<div><span>SCORE</span><b>${pad6(score)}</b></div><div class="medals">${medalStr(medals)}</div>`
    + `<div class="mnote">★ clear · ★ no damage · ★ under par</div>`;
  if (last) {
    mode = 'victory';
    showOverlay({ title: 'ODYSSEY COMPLETE', sub: `FINAL SCORE ${pad6(score)}`, blurb: 'Blitzy crossed the event horizon of the map and came back. Every sector is open for a three-star run.', btn: 'PLAY AGAIN', cards: true, stats });
  } else {
    showOverlay({ title: 'SECTOR CLEAR', sub: `NEXT · ${LEVELS[levelIndex + 1].name} · ${LEVELS[levelIndex + 1].tag}`, blurb: LEVELS[levelIndex + 1].blurb, btn: 'JUMP TO NEXT SECTOR', stats });
  }
}
function gameOver(reason) {
  if (mode !== 'playing') return;
  mode = 'gameover';
  if (document.pointerLockElement) document.exitPointerLock();
  burst(ball, 90, 420, 0.9, 0.5, 1.4, 14, 1.6);
  orb.visible = orbGlow.visible = false;
  sound.over(); sound.suspend(true);
  progress.best[levelIndex] = Math.max(progress.best[levelIndex] || 0, Math.floor(score)); saveProgress();
  showOverlay({ title: reason || 'SIGNAL LOST', sub: `SCORE ${pad6(score)} · ${L.name}`, blurb: L.tip, btn: 'RETRY SECTOR', keys: false, cards: true });
}
function overlayAction() {
  sound.start();
  if (mode === 'paused') resume();
  else if (mode === 'levelclear') startLevel(levelIndex + 1, true);
  else if (mode === 'victory') startLevel(0, false);
  else if (mode === 'gameover' || mode === 'title') startLevel(levelIndex, false);
}
ui.btn.addEventListener('click', (e) => { e.stopPropagation(); overlayAction(); });
ui.mute.addEventListener('click', (e) => { e.stopPropagation(); sound.start(); ui.mute.textContent = sound.toggleMute() ? 'SOUND OFF' : 'SOUND ON'; });
ui.mute.textContent = sound.muted ? 'SOUND OFF' : 'SOUND ON';
ui.qual.textContent = `QUALITY ${quality.toUpperCase()}`;
ui.qual.addEventListener('click', (e) => {
  e.stopPropagation();
  store.set('bw1_quality', quality === 'low' ? 'high' : 'low');
  location.reload();
});

// ── Input ───────────────────────────────────────────────────────────────────
const keys = {};
let locked = false, wantPulse = false, touchBoost = false;
function requestLock() {
  if (isTouch || !renderer.domElement.requestPointerLock) return;
  try { const p = renderer.domElement.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (_) {}
}
document.addEventListener('pointerlockchange', () => {
  const was = locked; locked = document.pointerLockElement === renderer.domElement;
  if (was && !locked && mode === 'playing') pauseGame();
});
function look(dx, dy, k) { yaw -= dx * k; pitch = clamp(pitch + dy * k, -1.35, 1.35); }
document.addEventListener('mousemove', (e) => { if (locked && mode === 'playing') look(e.movementX, e.movementY, 0.0023); });
let drag = null;
renderer.domElement.addEventListener('mousedown', (e) => {
  if (mode !== 'playing') return;
  if (locked) { if (e.button === 0 || e.button === 2) wantPulse = true; }
  else { drag = { x: e.clientX, y: e.clientY }; requestLock(); }
});
addEventListener('mouseup', () => { drag = null; });
addEventListener('mousemove', (e) => {
  if (!drag || locked || mode !== 'playing') return;
  look(e.clientX - drag.x, e.clientY - drag.y, 0.005); drag.x = e.clientX; drag.y = e.clientY;
});
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
  if (e.repeat) { if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); return; }
  keys[e.code] = true;
  if (e.code === 'KeyF' || e.code === 'KeyE') wantPulse = true;
  if (e.code === 'KeyM') ui.mute.textContent = sound.toggleMute() ? 'SOUND OFF' : 'SOUND ON';
  if ((e.code === 'KeyP' || e.code === 'Escape') && mode === 'playing') pauseGame();
  else if (e.code === 'KeyP' && mode === 'paused') resume();
  else if (e.code === 'Enter' && mode !== 'playing' && mode !== 'warping') overlayAction();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

const stickEl = $('stick'), knob = stickEl.firstElementChild;
const tMove = { id: null, sx: 0, sy: 0, x: 0, y: 0 }, tLook = { id: null, x: 0, y: 0 };
renderer.domElement.addEventListener('touchstart', (e) => {
  if (mode !== 'playing') return;
  for (const tc of e.changedTouches) {
    if (tc.clientX < innerWidth / 2 && tMove.id === null) {
      Object.assign(tMove, { id: tc.identifier, sx: tc.clientX, sy: tc.clientY, x: tc.clientX, y: tc.clientY });
      stickEl.style.left = tc.clientX + 'px'; stickEl.style.top = tc.clientY + 'px'; stickEl.style.display = 'block'; knob.style.transform = '';
    } else if (tLook.id === null) Object.assign(tLook, { id: tc.identifier, x: tc.clientX, y: tc.clientY });
  }
  e.preventDefault();
}, { passive: false });
renderer.domElement.addEventListener('touchmove', (e) => {
  for (const tc of e.changedTouches) {
    if (tc.identifier === tMove.id) {
      tMove.x = tc.clientX; tMove.y = tc.clientY;
      let dx = tc.clientX - tMove.sx, dy = tc.clientY - tMove.sy; const d = Math.hypot(dx, dy);
      if (d > 48) { dx *= 48 / d; dy *= 48 / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    } else if (tc.identifier === tLook.id) { look(tc.clientX - tLook.x, tc.clientY - tLook.y, 0.006); tLook.x = tc.clientX; tLook.y = tc.clientY; }
  }
  e.preventDefault();
}, { passive: false });
function endTouch(e) {
  for (const tc of e.changedTouches) {
    if (tc.identifier === tMove.id) { tMove.id = null; stickEl.style.display = 'none'; }
    if (tc.identifier === tLook.id) tLook.id = null;
  }
}
renderer.domElement.addEventListener('touchend', endTouch);
renderer.domElement.addEventListener('touchcancel', endTouch);
{
  const tb = $('t-boost'), tp = $('t-pulse'), tz = $('t-pause');
  tb.addEventListener('pointerdown', (e) => { touchBoost = true; e.preventDefault(); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) tb.addEventListener(ev, () => { touchBoost = false; });
  tp.addEventListener('pointerdown', (e) => { wantPulse = true; e.preventDefault(); });
  tz.addEventListener('pointerdown', (e) => { pauseGame(); e.preventDefault(); });
}

// gamepad
const gp = { x: 0, y: 0, up: 0, boost: false, prev: {} };
function pollGamepad(dt) {
  gp.x = gp.y = gp.up = 0; gp.boost = false;
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of pads) {
    if (!p || !p.connected) continue;
    const dz = (v) => (Math.abs(v) < 0.15 ? 0 : v);
    const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
    const edge = (i) => { const now = b(i), was = gp.prev[i]; gp.prev[i] = now; return now && !was; };
    if (mode === 'playing') {
      gp.x = dz(p.axes[0] || 0); gp.y = dz(p.axes[1] || 0);
      look(dz(p.axes[2] || 0) * dt * 420, dz(p.axes[3] || 0) * dt * 320, 0.006);
      gp.up = (b(5) ? 1 : 0) - (b(4) ? 1 : 0);
      gp.boost = b(0) || b(7);
      if (edge(2) || edge(1)) wantPulse = true;
      if (edge(9)) pauseGame();
    } else if (edge(0) || edge(9)) overlayAction();
    gp.pad = p;
    break;
  }
}
function rumble(strong, ms) {
  try {
    if (gp.pad && gp.pad.vibrationActuator) gp.pad.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: strong * 0.6 });
    if (isTouch && navigator.vibrate) navigator.vibrate(ms * 0.5);
  } catch (_) {}
}

// ── Gameplay helpers ────────────────────────────────────────────────────────
function addScore(pts, label) {
  const p = Math.round(pts * mult);
  score += p;
  if (label) toast(`${label}  +${p}`);
}
function takeHit(from, reason) {
  if (invuln > 0 || mode !== 'playing') return;
  shields -= 1; invuln = 1.6; combo = 0; tookDamage = true;
  hitFlash = 1; shieldFlash = 1; shake = reduceMotion ? 0 : 1;
  flashCol.set(1, 0.15, 0.2, 0.5);
  if (from) { _t1.subVectors(ball, from).normalize(); vel.multiplyScalar(0.3).addScaledVector(_t1, 520); }
  burst(ball, 40, 300, 1.6, 0.4, 0.5, 9, 0.8);
  sound.hit(); rumble(1, 260);
  if (shields <= 0) gameOver(reason || 'SIGNAL LOST'); else flash('SHIELD HIT', 800);
}
function collect(c) {
  c.alive = false; world.remove(c.mesh, c.glow); c.glow.material.dispose();
  starsGot++;
  combo = levelTime - lastPickup < 4 ? combo + 1 : 1; lastPickup = levelTime;
  addScore(250 * combo, combo > 1 ? `CRYSTAL · COMBO ×${combo}` : 'CRYSTAL');
  energy = Math.min(100, energy + 20);
  burst(c.pos, 46, 260, 1.8, 1.3, 0.4, 9, 1.1);
  sound.star(combo); rumble(0.3, 80);
  flashCol.set(1, 0.8, 0.3, 0.18);
  if (starsGot >= starsTotal && !gate.active) openGate();
}
function doPulse() {
  if (pulseCd > 0) return;
  if (energy < 30) { sound.denied(); toast('NOT ENOUGH ENERGY'); return; }
  energy -= 30; pulseCd = 0.9; pulseT = 0;
  pulseMesh.position.copy(ball); pulseMesh.visible = true;
  sound.pulse(); rumble(0.7, 200); shake = Math.max(shake, reduceMotion ? 0 : 0.5);
  let smashed = 0;
  for (const set of asteroidSets) for (let i = 0; i < set.items.length; i++) {
    const a = set.items[i];
    if (a.alive && a.pos.distanceToSquared(ball) < (270 + a.rad) ** 2) { killAsteroid(set, i); smashed++; }
  }
  if (smashed) { addScore(30 * smashed, `SMASHED ${smashed}`); sound.crunch(); }
  for (const al of aliens) {
    if (!al.alive) continue;
    const d = al.pos.distanceTo(ball);
    if (d < 360) { al.stun = 4; al.vel.addScaledVector(_t1.subVectors(al.pos, ball).normalize(), 380); }
  }
  for (const s of shots) if (s.mesh.position.distanceTo(ball) < 320) s.life = 0;
}

// ── Simulation ──────────────────────────────────────────────────────────────
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), upv = new THREE.Vector3(), camOff = new THREE.Vector3(), acc = new THREE.Vector3();
function viewBasis() {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
  camOff.set(sy * cp, sp, cy * cp);
  fwd.copy(camOff).multiplyScalar(-1);
  right.set(cy, 0, -sy);
  upv.crossVectors(right, fwd);
}

function updateWorld(dt) {
  for (const b of bodies) {
    if (b.orbit) {
      b.orbit.ang += b.orbit.speed * dt;
      b.pos.set(Math.cos(b.orbit.ang) * b.orbit.radius, 0, Math.sin(b.orbit.ang) * b.orbit.radius);
      b.group.position.copy(b.pos);
    }
    if (b.mesh) b.mesh.rotateY(dt * 0.02);
  }
  for (const m of timeMats) m.uniforms.uTime.value = t;
  if (pulsar) {
    pulsar.ang += pulsar.speed * dt;
    pulsar.axis.set(0, 0, 0).addScaledVector(pulsar.u, Math.cos(pulsar.ang)).addScaledVector(pulsar.v, Math.sin(pulsar.ang));
    pulsar.beams.quaternion.setFromUnitVectors(Y, pulsar.axis);
  }
  updateAsteroids(dt);
  for (const c of comets) {
    c.ang += c.speed * dt;
    cometPos(c, c.ang, _t1); c.vel.subVectors(_t1, c.pos).divideScalar(Math.max(dt, 1e-3)); c.pos.copy(_t1);
    c.glow.position.copy(c.pos); c.head.rotation.y += dt;
    // tail streams away from the sun
    c.acc += dt * (LOW() ? 40 : 90);
    const away = _t2.copy(sunLight.position).normalize().multiplyScalar(-1);
    while (c.acc >= 1) {
      c.acc -= 1;
      emit(c.pos.x + (Math.random() - 0.5) * 14, c.pos.y + (Math.random() - 0.5) * 14, c.pos.z + (Math.random() - 0.5) * 14,
        away.x * 210 + (Math.random() - 0.5) * 50, away.y * 210 + (Math.random() - 0.5) * 50, away.z * 210 + (Math.random() - 0.5) * 50,
        0.35, 0.8, 1.3, 16 + Math.random() * 16, 1.6 + Math.random());
    }
  }
  for (const c of crystals) {
    if (!c.alive) continue;
    if (c.comet) cometPos(c.comet, c.comet.ang - Math.sign(c.comet.speed) * c.lag, c.pos);
    c.mesh.rotation.y += dt * c.spin; c.mesh.rotation.x += dt * c.spin * 0.6;
    c.glow.position.copy(c.pos);
    c.glow.scale.setScalar(56 + Math.sin(t * 4 + c.spin * 7) * 10);
  }
  for (const p of portals) { p.grp.lookAt(camera.position); }
  if (gate && gate.active) {
    gate.open = Math.min(1, gate.open + dt * 1.5);
    gate.mat.uniforms.uOpen.value = gate.open;
    gate.grp.scale.setScalar(gate.radius * (0.3 + 0.7 * gate.open));
    gate.grp.lookAt(camera.position);
  }
}

function updatePlayer(dt) {
  levelTime += dt;
  if (invuln > 0) invuln -= dt;
  if (pulseCd > 0) pulseCd -= dt;
  if (portalCd > 0) portalCd -= dt;
  if (slingCd > 0) slingCd -= dt;

  // time dilation near the black hole (Schwarzschild factor)
  if (L.dilation && blackhole) {
    const rs = blackhole.r * 1.8, d = Math.max(ball.distanceTo(blackhole.pos), rs * 1.05);
    dilation = Math.sqrt(1 - rs / d);
    mult = clamp(1 / dilation, 1, 4);
    clockTime += dt / Math.max(dilation, 0.3);
  } else { clockTime += dt; }
  if (L.timeLimit && clockTime >= L.timeLimit) { gameOver('OUT OF TIME'); return; }

  // input → thrust
  viewBasis();
  acc.set(0, 0, 0);
  let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + gp.x;
  let iz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - gp.y;
  let iy = (keys.Space ? 1 : 0) - (keys.KeyC || keys.KeyQ ? 1 : 0) + gp.up;
  if (tMove.id !== null) {
    const dx = tMove.x - tMove.sx, dy = tMove.y - tMove.sy, d = Math.hypot(dx, dy);
    if (d > 6) { const m = Math.min(1, d / 48); ix += dx / d * m; iz -= dy / d * m; }
  }
  acc.addScaledVector(right, ix).addScaledVector(fwd, iz).addScaledVector(upv, iy);
  const thrusting = acc.lengthSq() > 0.001;
  const wantBoost = keys.ShiftLeft || keys.ShiftRight || touchBoost || gp.boost;
  const boosting = wantBoost && thrusting && energy > 0;
  if (thrusting) { if (acc.lengthSq() > 1) acc.normalize(); acc.multiplyScalar(boosting ? BOOST_THRUST : THRUST); }
  energy = clamp(energy + (boosting ? -17 : 3.5) * dt, 0, 100);
  if (wantPulse) { wantPulse = false; doPulse(); }

  // gravity from every body
  for (const b of bodies) {
    _t1.subVectors(b.pos, ball);
    const d2 = Math.max(_t1.lengthSq(), (b.r * 0.9) ** 2), d = Math.sqrt(d2);
    acc.addScaledVector(_t1, b.mu / (d2 * d));
  }
  vel.addScaledVector(acc, dt);
  vel.multiplyScalar(Math.exp(-DRAG * dt));
  ball.addScaledVector(vel, dt);
  const speed = vel.length();

  // exhaust
  if (thrusting && Math.random() < (boosting ? 1 : 0.45)) {
    for (let k = 0; k < (boosting ? 3 : 1); k++) emit(ball.x, ball.y, ball.z,
      vel.x * 0.2 - acc.x * 0.05 + (Math.random() - 0.5) * 70, vel.y * 0.2 - acc.y * 0.05 + (Math.random() - 0.5) * 70, vel.z * 0.2 - acc.z * 0.05 + (Math.random() - 0.5) * 70,
      boosting ? 0.5 : 0.9, boosting ? 1.3 : 0.5, 1.6, boosting ? 9 : 6, 0.5);
  }

  // bodies: collisions, slingshots, heat
  let heatIn = 0, shaded = false;
  for (const b of bodies) {
    _t1.subVectors(ball, b.pos);
    const d = _t1.length();
    if (b.kind === 'blackhole') {
      if (d < b.r * 1.06) { gameOver('SPAGHETTIFIED'); return; }
    } else if (d < b.r + BALL_R) {
      _t1.multiplyScalar(1 / d);
      ball.copy(b.pos).addScaledVector(_t1, b.r + BALL_R);
      const dn = vel.dot(_t1);
      if (dn < 0) vel.addScaledVector(_t1, -dn * 1.5);
      if (b.hot) takeHit(b.pos, b.kind === 'sun' ? 'VAPORISED' : b.kind === 'pulsar' ? 'IRRADIATED' : 'MELTED');
    }
    if (b.kind === 'sun') heatIn += Math.pow(clamp(1 - (d - b.r) / (b.r * 3.6), 0, 1), 2) * 46;
    if (b.kind === 'planet' && L.heat && d < b.r * 3 && ball.lengthSq() > b.pos.lengthSq()) shaded = true;
    // slingshot: a fast close pass that leaves again
    if (b.kind !== 'pulsar') {
      const near = b.kind === 'blackhole' ? b.r * 3.4 : b.r * 1.75 + 40;
      if (!b.pass && d < near && speed > 560) b.pass = { min: d };
      else if (b.pass) {
        b.pass.min = Math.min(b.pass.min, d);
        if (d > near * 1.25) {
          if (speed > 560 && slingCd <= 0) { addScore(200, 'SLINGSHOT'); energy = Math.min(100, energy + 22); sound.bonus(); slingCd = 3; }
          b.pass = null;
        }
      }
    }
  }
  if (L.heat) {
    heat = clamp(heat + (heatIn - (shaded ? 30 : 11)) * dt, 0, 100);
    if (heat >= 100) { heat = 55; takeHit(null, 'OVERHEATED'); flash('OVERHEAT', 900); }
    if (heat > 70 && (alarmT -= dt) <= 0) { alarmT = 0.45; sound.alarm(); }
  }

  // pulsar beams
  if (pulsar && invuln <= 0) {
    _t1.subVectors(ball, pulsar.body.pos);
    const s = _t1.dot(pulsar.axis), as = Math.abs(s);
    if (as > pulsar.body.r && as < pulsar.len) {
      const perp = Math.sqrt(Math.max(0, _t1.lengthSq() - s * s));
      if (perp < 10 + as * 0.03 + BALL_R * 0.5) takeHit(_t2.copy(ball).addScaledVector(pulsar.n, _t1.dot(pulsar.n) >= 0 ? -40 : 40), 'IRRADIATED');
    }
  }

  // crystals (with a little magnetism)
  for (const c of crystals) {
    if (!c.alive) continue;
    const d = c.pos.distanceTo(ball);
    if (d < BALL_R + 22) collect(c);
    else if (d < 150 && !c.comet) c.pos.lerp(ball, dt * 2.2 * (1 - d / 150));
  }
  // stardust
  if (dust) {
    let changed = false;
    for (let i = 0; i < dust.n; i++) {
      if (!dust.alive[i]) continue;
      const dx = dust.pos[i * 3] - ball.x, dy = dust.pos[i * 3 + 1] - ball.y, dz = dust.pos[i * 3 + 2] - ball.z;
      if (dx * dx + dy * dy + dz * dz < 2100) {
        dust.alive[i] = 0; dust.data[i * 2 + 1] = 0; changed = true;
        energy = Math.min(100, energy + 5); score += Math.round(10 * mult); sound.dust();
        burst(_t1.set(dust.pos[i * 3], dust.pos[i * 3 + 1], dust.pos[i * 3 + 2]), 6, 90, 0.5, 1.4, 1.8, 5, 0.5);
      }
    }
    if (changed) dust.geo.attributes.aData.needsUpdate = true;
  }
  // asteroids
  for (const set of asteroidSets) {
    if (set.center.distanceToSquared(ball) > 2400 * 2400) continue;
    for (let i = 0; i < set.items.length; i++) {
      const a = set.items[i];
      if (!a.alive) continue;
      const d = a.pos.distanceTo(ball) - a.rad * 0.9 - BALL_R;
      if (d < 0) {
        if (invuln <= 0) { takeHit(a.pos); killAsteroid(set, i); sound.crunch(); }
      } else if (d < 34 && a.near <= 0 && speed > 420 && invuln <= 0) {
        a.near = 3; addScore(50, 'NEAR MISS'); sound.bonus();
      }
    }
  }
  // comets: surf the tail to recharge
  for (const c of comets) {
    const d = c.pos.distanceTo(ball);
    if (d < 170) {
      energy = Math.min(100, energy + 30 * dt); score += 40 * dt * mult;
      if ((surfT -= dt) <= 0) { surfT = 1.2; toast('COMET SURF · RECHARGING'); }
    }
  }
  // wormholes
  if (portalCd <= 0) for (const p of portals) {
    if (p.pos.distanceToSquared(ball) < (p.radius * 0.8) ** 2) {
      const dir = speed > 20 ? _t1.copy(vel).normalize() : _t1.copy(fwd);
      ball.copy(p.twin.pos).addScaledVector(dir, p.radius + 30);
      portalCd = 1.2; warpIn = reduceMotion ? 0 : 0.9; trail.pts.length = 0;
      flashCol.set(0.6, 0.9, 1, 0.6); sound.portal(); snapCamera();
      toast('WORMHOLE TRANSIT');
      break;
    }
  }
  // warp gate
  if (mode === 'playing' && gate.active && gate.open > 0.8 && gate.pos.distanceToSquared(ball) < (gate.radius * 0.85) ** 2) {
    mode = 'warping'; warpOut = 0; sound.warp(); rumble(0.6, 900);
    vel.copy(_t1.subVectors(gate.pos, camera.position).normalize().multiplyScalar(1600));
  }
  return { speed, boosting, thrusting };
}

function updateAliens(dt) {
  for (const al of aliens) {
    if (!al.alive) continue;
    al.ring.rotation.y += dt * 2.4; al.ring2.rotation.z += dt * 1.8; al.core.rotation.x += dt;
    const toP = _t1.subVectors(ball, al.pos), d = toP.length();
    if (al.stun > 0) {
      al.stun -= dt;
      al.vel.multiplyScalar(Math.exp(-0.8 * dt));
      al.core.material.emissive.setHex(0x4488ff).multiplyScalar(1.5 + Math.sin(t * 30));
      al.glow.material.color.setHex(0x4488ff);
      if (al.stun <= 0) { al.core.material.emissive.copy(hdr(al.base, 2.2)); al.glow.material.color.copy(hdr(al.base, 1.2)); }
    } else {
      const target = d < 1700 ? toP.multiplyScalar(1 / Math.max(d, 1)) : _t2.subVectors(al.home, al.pos).normalize();
      const keepOff = al.shooter && d < 380 ? -0.6 : 1;
      al.vel.addScaledVector(target, al.speed * al.agro * 2.2 * keepOff * dt);
      // weave so they do not stack on one line
      al.vel.addScaledVector(_t3.set(-target.z, Math.sin(t * 1.3 + al.cd), target.x), al.speed * 0.5 * dt);
      const sp = al.vel.length(); if (sp > al.speed) al.vel.multiplyScalar(al.speed / sp);
      if (al.shooter && d < 1100 && (al.cd -= dt) <= 0) { al.cd = 2.6 + Math.random() * 1.6; fireShot(al); }
    }
    al.pos.addScaledVector(al.vel, dt);
    for (const b of bodies) {
      const bd = al.pos.distanceTo(b.pos), minD = b.r * (b.kind === 'blackhole' ? 2 : 1) + ALIEN_R + 20;
      if (bd < minD) al.pos.sub(b.pos).setLength(minD).add(b.pos);
    }
    if (d < BALL_R + ALIEN_R * 0.85) {
      if (al.stun > 0) {
        al.alive = false; world.remove(al.grp);
        burst(al.pos, 70, 360, 0.5, 1.6, 0.9, 12, 1.2);
        addScore(500, 'HUNTER DESTROYED'); sound.kill(); rumble(0.8, 200); shake = Math.max(shake, reduceMotion ? 0 : 0.6);
      } else takeHit(al.pos);
    }
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.life -= dt; s.mesh.position.addScaledVector(s.vel, dt);
    if (Math.random() < 0.5) emit(s.mesh.position.x, s.mesh.position.y, s.mesh.position.z, 0, 0, 0, 1.6, 0.4, 0.2, 7, 0.35);
    let dead = s.life <= 0;
    if (!dead && s.mesh.position.distanceToSquared(ball) < (BALL_R + 7) ** 2) { takeHit(s.mesh.position); dead = true; }
    if (!dead) for (const b of bodies) if (s.mesh.position.distanceToSquared(b.pos) < b.r * b.r) { dead = true; break; }
    if (dead) { world.remove(s.mesh); shots.splice(i, 1); }
  }
}

// ── Camera ──────────────────────────────────────────────────────────────────
const camTarget = new THREE.Vector3(), lookAt = new THREE.Vector3();
let fov = 62;
function placeCamera(dt, boosting) {
  viewBasis();
  const dist = 150;
  camTarget.copy(ball).addScaledVector(camOff, dist).addScaledVector(upv, 46);
  _t1.copy(vel).multiplyScalar(-0.03); if (_t1.length() > 40) _t1.setLength(40);
  camTarget.add(_t1);
  for (const b of bodies) {
    const d = camTarget.distanceTo(b.pos), minD = b.r * 1.06 + 6;
    if (d < minD) camTarget.sub(b.pos).setLength(minD).add(b.pos);
  }
  if (dt < 0) camera.position.copy(camTarget); else camera.position.lerp(camTarget, 1 - Math.exp(-14 * dt));
  if (shake > 0.001) {
    camera.position.x += (Math.random() - 0.5) * shake * 9; camera.position.y += (Math.random() - 0.5) * shake * 9; camera.position.z += (Math.random() - 0.5) * shake * 9;
  }
  lookAt.copy(ball).addScaledVector(upv, 14).addScaledVector(fwd, 220);
  camera.up.copy(Y);
  camera.lookAt(lookAt);
  const want = 62 + (boosting ? 14 : 0) + clamp(vel.length() / 2200, 0, 1) * 8 + warpOut * 30;
  fov = lerp(fov, want, 1 - Math.exp(-5 * Math.max(dt, 0.016)));
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
}
function snapCamera() { placeCamera(-1, false); }

// ── HUD overlay canvas: off-screen pointers ─────────────────────────────────
const _proj = new THREE.Vector3(), _camDir = new THREE.Vector3();
function pointer(ctx, pos, color, label, always) {
  const w = innerWidth, h = innerHeight;
  _proj.copy(pos).sub(camera.position);
  const dist = _proj.length(), behind = _proj.dot(_camDir) < 0;
  _proj.copy(pos).project(camera);
  let x = _proj.x, y = _proj.y;
  if (behind) { x = -x; y = -y; }
  const on = !behind && Math.abs(x) < 0.94 && Math.abs(y) < 0.9;
  if (on) {
    if (!always) return;
    const sx = (x * 0.5 + 0.5) * w, sy = (-y * 0.5 + 0.5) * h;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(sx, sy - 16); ctx.lineTo(sx + 16, sy); ctx.lineTo(sx, sy + 16); ctx.lineTo(sx - 16, sy); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = color; ctx.fillText(`${label} ${Math.round(dist)}`, sx, sy + 32);
    return;
  }
  const m = Math.max(Math.abs(x) / 0.9, Math.abs(y) / 0.84, 1e-3);
  if (behind && m < 1) { const k = 1 / m; x *= k; y *= k; } else { x /= m; y /= m; }
  const sx = (x * 0.5 + 0.5) * w, sy = (-y * 0.5 + 0.5) * h, ang = Math.atan2(-y, x);
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-7, 8); ctx.lineTo(-3, 0); ctx.lineTo(-7, -8); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (label) { ctx.fillStyle = color; ctx.fillText(`${label} ${Math.round(dist)}`, clamp(sx - Math.cos(ang) * 30, 40, w - 40), clamp(sy - Math.sin(ang) * 30, 20, h - 14)); }
}
function drawFx() {
  const ctx = ui.fx;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  if (mode !== 'playing') return;
  camera.getWorldDirection(_camDir);
  ctx.font = '600 10px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.globalAlpha = 0.9;
  if (gate.active) pointer(ctx, gate.pos, '#fff0b0', 'GATE', true);
  else {
    const near = crystals.filter((c) => c.alive).sort((a, b) => a.pos.distanceToSquared(ball) - b.pos.distanceToSquared(ball)).slice(0, 3);
    near.forEach((c, i) => pointer(ctx, c.pos, i === 0 ? '#ffd060' : 'rgba(255,208,96,0.45)', i === 0 ? 'CRYSTAL' : '', false));
    for (const p of portals) if (p.pos.distanceToSquared(ball) < 1500 * 1500) pointer(ctx, p.pos, 'rgba(150,220,255,0.6)', '', false);
  }
  for (const al of aliens) if (al.alive && al.stun <= 0 && al.pos.distanceToSquared(ball) < 800 * 800) pointer(ctx, al.pos, '#ff4a6a', '', false);
  ctx.globalAlpha = 1;
}

// ── Main loop ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let frameAvg = 16, adaptT = 0, titleAng = 0;
const _ndc = new THREE.Vector3();
function frame() {
  requestAnimationFrame(frame);
  const raw = clock.getDelta(), dt = Math.min(raw, 0.05);
  pollGamepad(dt);
  let st = { speed: vel.length(), boosting: false, thrusting: false };
  const live = mode === 'playing' || mode === 'warping' || mode === 'title';
  if (live) t += dt;

  if (mode === 'playing') {
    updateWorld(dt);
    const r = updatePlayer(dt);
    if (r) st = r;
    if (mode === 'playing') updateAliens(dt);
    hudDynamic(false);
  } else if (mode === 'warping') {
    updateWorld(dt);
    warpOut = Math.min(1, warpOut + dt / 1.5);
    ball.addScaledVector(vel, dt);
    if (warpOut > 0.75) flashCol.set(1, 1, 1, (warpOut - 0.75) * 6);
    st.boosting = true;
    if (warpOut >= 1) { warpOut = 0; flashCol.set(1, 1, 1, 1.2); levelClear(); }
  } else if (mode === 'title') {
    updateWorld(dt);
    titleAng += dt * 0.07;
  }
  if (live || mode === 'gameover') updateParticles(dt);

  // decays
  if (warpIn > 0) warpIn = Math.max(0, warpIn - dt * 0.9);
  shake = Math.max(0, shake - dt * 2.2); hitFlash = Math.max(0, hitFlash - dt * 2.5); shieldFlash = Math.max(0, shieldFlash - dt * 1.4);
  flashCol.w = Math.max(0, flashCol.w - dt * 1.6);
  if (pulseT >= 0) {
    pulseT += dt / 0.5;
    pulseMesh.scale.setScalar(20 + 270 * (1 - Math.pow(1 - Math.min(pulseT, 1), 3)));
    pulseMat.uniforms.uAlpha.value = 1 - pulseT;
    if (pulseT >= 1) { pulseT = -1; pulseMesh.visible = false; }
  }

  // camera
  if (mode === 'title') {
    const b0 = bodies[0], R = (b0.cfg.disk ? b0.cfg.disk.outer : b0.r) * 2.6 + 260;
    camera.position.set(b0.pos.x + Math.cos(titleAng) * R, b0.pos.y + R * 0.28, b0.pos.z + Math.sin(titleAng) * R);
    camera.up.copy(Y); camera.lookAt(b0.pos.x, b0.pos.y + 20, b0.pos.z);
  } else if (mode !== 'paused') placeCamera(dt, st.boosting);

  // player visuals
  const blink = invuln > 0 && mode === 'playing' ? 0.5 + 0.5 * Math.sin(t * 30) : 1;
  orb.position.copy(ball); orbGlow.position.copy(ball); orbLight.position.copy(ball); shieldMesh.position.copy(ball);
  orbMat.uniforms.uTime.value = t; orbMat.uniforms.uHit.value = hitFlash;
  orbMat.uniforms.uBoost.value = lerp(orbMat.uniforms.uBoost.value, st.boosting ? 1 : 0, 0.15);
  orbGlow.scale.setScalar(BALL_R * (6 + Math.sin(t * 2.2) * 0.5 + orbMat.uniforms.uBoost.value * 2.4) * blink);
  shieldMat.uniforms.uAlpha.value = shieldFlash;
  orb.visible = orbGlow.visible = trailMesh.visible = mode !== 'title' && mode !== 'gameover';
  if (mode === 'playing' || mode === 'warping') updateTrail(st.boosting);

  // world-anchored helpers
  starPoints.position.copy(camera.position);
  starPointsMat.uniforms.uTime.value = t;
  speedDustMat.uniforms.uCam.value.copy(camera.position);
  speedDustMat.uniforms.uSpeed.value = clamp(st.speed / 900, 0, 1);

  // post uniforms
  const u = post.u;
  u.uTime.value = t % 100;
  u.uWarp.value = reduceMotion ? 0 : Math.max(warpIn * warpIn, warpOut * warpOut);
  u.uAberration.value = reduceMotion ? 0 : 0.0012 + hitFlash * 0.006 + (st.boosting ? 0.0014 : 0);
  u.uGrain.value = reduceMotion ? 0 : 0.035;
  u.uFlash.value.copy(flashCol);
  u.uBHStrength.value = 0;
  if (blackhole) {
    camera.updateMatrixWorld();
    _ndc.copy(blackhole.pos).project(camera);
    camera.getWorldDirection(_camDir);
    if (_t1.subVectors(blackhole.pos, camera.position).dot(_camDir) > 0) {
      const dist = camera.position.distanceTo(blackhole.pos);
      const rs = blackhole.r / (dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * 0.5;
      u.uBH.value.set(_ndc.x * 0.5 + 0.5, _ndc.y * 0.5 + 0.5, rs);
      u.uBHStrength.value = 2.6;
    }
  }

  // adaptive resolution: hold the frame rate by trading pixels (resized before drawing, so no blank frame)
  if (mode === 'playing') {
    frameAvg = lerp(frameAvg, raw * 1000, 0.05); adaptT += raw;
    if (adaptT > 1.5) {
      adaptT = 0;
      const old = pr;
      if (frameAvg > 24) pr = Math.max(0.5, pr * 0.85); else if (frameAvg < 14) pr = Math.min(maxPR, pr * 1.1);
      if (Math.abs(pr - old) > 0.01) resize();
    }
  }

  post.render(scene, camera);
  drawFx();
  sound.update(dt, {
    thrust: st.thrusting ? 1 : 0, boost: st.boosting ? 1 : 0, speed: clamp(st.speed / 1800, 0, 1), playing: mode === 'playing' || mode === 'warping',
    danger: mode === 'playing' ? clamp((3 - shields) * 0.25 + (aliens.some((a) => a.alive && a.stun <= 0 && a.pos.distanceToSquared(ball) < 250000) ? 0.4 : 0), 0, 1) : 0,
  });
}

// ── Boot ────────────────────────────────────────────────────────────────────
pr = Math.min(devicePixelRatio || 1, LOW() ? 1.25 : 2);
resize();
addEventListener('resize', resize);
levelIndex = clamp(progress.cleared, 0, LEVELS.length - 1);
buildLevel(levelIndex);
ball.copy(V3(L.spawn));
showOverlay({
  title: "BLITZY'S WORLD", sub: 'ODYSSEY · v1.0 · 8 SECTORS',
  blurb: 'Fly an orb of light through eight real space phenomena, from a quiet home orbit to the edge of a black hole.',
  btn: progress.cleared > 0 ? `CONTINUE · SECTOR ${levelIndex + 1}` : `${tapWord} TO PLAY`, keys: true, cards: true,
});
// debugging hook for automated checks
window.__bw = { camera, post, scene, bodies, takeHit, start: (i) => startLevel(i, false), state: () => ({ mode, levelIndex, score, shields, energy, starsGot, starsTotal, pr, particles: P.n }), ball, vel, crystals, collect, openGate, gate: () => gate };
frame();
