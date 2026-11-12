// /bitcoin/ 3D view — lazy-loaded only when the visitor picks 3D.
// three.js r180 (MIT) is imported through the page import map, from a pinned jsDelivr URL.
// Visual ideas (not code) from MIT-licensed work: mrdoob/three.js examples (OrbitControls,
// CSS2D labels), protectwise/troika (readable 3D labels, data-viz lighting),
// gavinmgrant/tricharts and vsergeev88/ddd-charts (3D bars, orbit, legend hover).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

var FLOOR = 0xFFFBF6, INK = '#44403C', MUTED = '#A8A29E', NOW = 0xEA580C;
var ERA_COLOR = { e0: 0xD4C4A8, e1: 0xE8BE72, e2: 0xE39B4A, e3: 0xD4846A };
var ERA_IDS = ['e0', 'e1', 'e2', 'e3'];

var renderer, labelRenderer, scene, camera, controls, root, floor, light;
var raf = 0, ro = null, container, tooltip, hint, onEraToggle = null;
var reduced = false, focusEra = null, dragging = false, pointer0 = null;
var raycaster = new THREE.Raycaster();
var pointer = new THREE.Vector2();
var started = false, fittedKey = '';

function prefersReduced() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clearGroup(g) {
  var i, obj;
  for (i = g.children.length - 1; i >= 0; i--) {
    obj = g.children[i];
    if (obj.element && obj.element.parentNode) obj.element.parentNode.removeChild(obj.element);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(function (m) { m.dispose(); });
      else obj.material.dispose();
    }
    if (obj.children && obj.children.length) clearGroup(obj);
    g.remove(obj);
  }
}

function labelEl(text, className) {
  var el = document.createElement('div');
  el.className = 'chart3d-label' + (className ? ' ' + className : '');
  el.textContent = text;
  return el;
}

function heightOf(days, xmax, useSqrt, maxH) {
  if (!(days > 0) || !(xmax > 0)) return 0;
  var t = useSqrt ? Math.sqrt(days) / Math.sqrt(xmax) : days / xmax;
  return t * maxH;
}

function barMaterial(hex, faded) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: 0.58,
    metalness: 0.04,
    emissive: hex,
    emissiveIntensity: faded ? 0 : 0.04,
    transparent: faded,
    opacity: faded ? 0.22 : 1
  });
}

function applyFocus() {
  if (!root) return;
  root.traverse(function (obj) {
    if (!obj.isMesh || !obj.userData || !obj.userData.era) return;
    var faded = !!(focusEra && obj.userData.era !== focusEra);
    if (obj.material) {
      obj.material.transparent = faded;
      obj.material.opacity = faded ? 0.22 : 1;
      obj.material.emissiveIntensity = faded ? 0 : 0.04;
      obj.material.needsUpdate = true;
    }
  });
}


function fitCamera(state) {
  if (!root || !camera || !controls || !container) return;
  root.updateMatrixWorld(true);
  var box = new THREE.Box3();
  root.traverse(function (o) { if (o.isMesh) box.expandByObject(o); });
  if (box.isEmpty()) return;
  var size = box.getSize(new THREE.Vector3());
  var center = box.getCenter(new THREE.Vector3());
  var aspect = container.clientWidth / Math.max(1, container.clientHeight);
  var vFov = camera.fov * Math.PI / 180;
  var hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  // Leave headroom for the count labels and a little side padding so the tall $0 bar stays in frame.
  var distH = (size.x * 0.72) / Math.max(0.2, Math.tan(hFov / 2));
  var distV = (size.y * 0.82) / Math.max(0.2, Math.tan(vFov / 2));
  var dist = Math.max(distH, distV, 7) * 1.22;
  camera.position.set(center.x + dist * 0.08, center.y + dist * 0.38, center.z + dist * 0.92);
  controls.target.set(center.x, center.y + size.y * 0.08, center.z);
  camera.near = 0.1;
  camera.far = Math.max(80, dist * 8);
  camera.updateProjectionMatrix();
  controls.minDistance = Math.max(4, dist * 0.25);
  controls.maxDistance = Math.max(80, dist * 3);
  controls.update();
  fittedKey = (state && state.size) + ':' + ((state && state.keys) ? state.keys.length : 0) + ':' + container.clientWidth;
}

function build(state) {
  if (!root) return;
  clearGroup(root);
  var keys = state.keys || [];
  var n = keys.length;
  if (!n) return;
  var useSqrt = !!state.useSqrt;
  var xmax = state.xmax || 1;
  var maxH = 7.5;
  var pitch = n > 50 ? 0.7 : n > 30 ? 0.85 : 1.05;
  var thick = Math.min(0.78, pitch * 0.72);
  var span = (n - 1) * pitch;
  var narrow = container.clientWidth < 560;
  var stride = narrow ? (n <= 8 ? 1 : n <= 14 ? 2 : n <= 24 ? 3 : 4) : (n <= 9 ? 1 : n <= 20 ? 2 : n <= 36 ? 3 : 4);
  var sparse = narrow && n > 16;
  var maxDays = 0, ti;
  for (ti = 0; ti < n; ti++) if ((state.totals[ti] || 0) > maxDays) maxDays = state.totals[ti];
  var i, x, days, h, mesh, geom, label, top, isNow, priceText, showPrice, showCount, un, eraId;

  for (i = 0; i < n; i++) {
    days = state.totals[i] || 0;
    un = (state.unlock && state.unlock[keys[i]]) || {};
    eraId = un.era || 'e0';
    x = i * pitch - span / 2;
    isNow = keys[i] === state.tb;
    if (days) {
      h = Math.max(0.04, heightOf(days, xmax, useSqrt, maxH));
      geom = new THREE.BoxGeometry(thick, h, thick);
      mesh = new THREE.Mesh(geom, barMaterial(ERA_COLOR[eraId] || ERA_COLOR.e0, focusEra && focusEra !== eraId));
      mesh.position.set(x, h / 2, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { era: eraId, key: keys[i], days: days, label: state.labels[i], now: isNow, dayLabel: un.dayLabel, eraName: un.eraName };
      root.add(mesh);
    }
    if (isNow && days) {
      var ring = new THREE.Mesh(
        new THREE.RingGeometry(thick * 0.72, thick * 0.92, 32),
        new THREE.MeshBasicMaterial({ color: NOW, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.02, 0);
      ring.userData = { era: null };
      root.add(ring);
    }
    showPrice = sparse ? (i === 0 || isNow || i === n - 1) : (i % stride === 0 || isNow || i === n - 1);
    showCount = days && (sparse ? (isNow || days === maxDays) : (i % stride === 0 || isNow || days === maxDays));
    if (showPrice) {
      priceText = narrow ? state.labels[i].split('–')[0] : state.labels[i];
      label = new CSS2DObject(labelEl(priceText, isNow ? 'now' : ''));
      label.position.set(x, -0.35, thick * 0.75);
      root.add(label);
    }
    if (showCount) {
      top = heightOf(days, xmax, useSqrt, maxH);
      var count = days.toLocaleString('en-US') + (isNow ? ' ← now' : '');
      label = new CSS2DObject(labelEl(count, isNow ? 'now' : 'count'));
      label.position.set(x, top + 0.28, 0);
      root.add(label);
    }
  }

  if (floor) {
    floor.scale.set(Math.max(12, span + 6), 1, 8);
  }
  var key = (state.size || '') + ':' + n + ':' + container.clientWidth;
  if (key !== fittedKey) fitCamera(state);
  if (!started) {
    if (!reduced) playIntro();
    else started = true;
  }
}

function playIntro() {
  if (!root) return;
  started = true;
  var t0 = performance.now(), dur = 700;
  function step(now) {
    var t = Math.min(1, (now - t0) / dur);
    var e = 1 - Math.pow(1 - t, 3);
    root.scale.set(1, e, 1);
    if (t < 1) requestAnimationFrame(step);
  }
  root.scale.set(1, 0.001, 1);
  requestAnimationFrame(step);
}

function loop() {
  raf = requestAnimationFrame(loop);
  if (document.hidden) return;
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (labelRenderer && scene && camera) labelRenderer.render(scene, camera);
}

function resize() {
  if (!container || !renderer || !camera) return;
  var w = Math.max(1, container.clientWidth);
  var h = Math.max(1, container.clientHeight);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  labelRenderer.setSize(w, h);
}

function eventToNdc(ev) {
  var r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
}

function hit() {
  if (!camera || !root) return null;
  raycaster.setFromCamera(pointer, camera);
  var hits = raycaster.intersectObjects(root.children, false);
  var i, o;
  for (i = 0; i < hits.length; i++) {
    o = hits[i].object;
    if (o.userData && o.userData.era) return o;
  }
  return null;
}

function moveTip(ev, mesh) {
  if (!tooltip) return;
  if (!mesh) { tooltip.hidden = true; return; }
  var d = mesh.userData;
  tooltip.hidden = false;
  tooltip.style.left = ev.offsetX + 12 + 'px';
  tooltip.style.top = ev.offsetY + 12 + 'px';
  tooltip.innerHTML = '<strong>' + d.label + '</strong> · ' + d.days.toLocaleString('en-US') + ' days'
    + (d.dayLabel ? '. First reached ' + d.dayLabel + ' (' + (d.eraName || '') + ')' : '')
    + (d.now ? ' · now' : '');
}

function onPointerMove(ev) {
  eventToNdc(ev);
  if (pointer0 && (Math.abs(ev.clientX - pointer0.x) > 4 || Math.abs(ev.clientY - pointer0.y) > 4)) dragging = true;
  moveTip(ev, hit());
}

function onPointerDown(ev) {
  pointer0 = { x: ev.clientX, y: ev.clientY };
  dragging = false;
  if (controls) controls.autoRotate = false;
}

function onPointerUp(ev) {
  if (dragging || !onEraToggle) { pointer0 = null; return; }
  eventToNdc(ev);
  var mesh = hit();
  if (mesh && mesh.userData.era) onEraToggle(mesh.userData.era);
  pointer0 = null;
}

function onPointerLeave() { if (tooltip) tooltip.hidden = true; }

export function mount(el, opts) {
  dispose();
  container = el;
  onEraToggle = opts && opts.onEraToggle;
  reduced = prefersReduced();
  started = false;
  focusEra = (opts && opts.focus) || null;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(FLOOR);
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(FLOOR, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.inset = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);

  var hemi = new THREE.HemisphereLight(0xfff6ea, 0xd9c7a3, 0.95);
  scene.add(hemi);
  light = new THREE.DirectionalLight(0xffe4c4, 0.75);
  light.position.set(6, 12, 8);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 40;
  light.shadow.camera.left = -16;
  light.shadow.camera.right = 16;
  light.shadow.camera.top = 12;
  light.shadow.camera.bottom = -8;
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  var floorGeom = new THREE.PlaneGeometry(1, 1);
  floor = new THREE.Mesh(floorGeom, new THREE.MeshStandardMaterial({ color: FLOOR, roughness: 0.95, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  var grid = new THREE.GridHelper(24, 24, 0xe7e5e4, 0xe7e5e4);
  grid.position.y = 0.01;
  grid.material.transparent = true;
  grid.material.opacity = 0.38;
  scene.add(grid);

  root = new THREE.Group();
  scene.add(root);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minPolarAngle = 0.18;
  controls.minDistance = 6;
  controls.maxDistance = 80;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.45;
  controls.target.set(0, 2.2, 0);

  hint = document.createElement('p');
  hint.className = 'chart3d-hint';
  hint.textContent = 'Drag to turn · pinch or scroll to zoom';
  container.appendChild(hint);
  tooltip = document.createElement('div');
  tooltip.className = 'chart3d-tip';
  tooltip.hidden = true;
  container.appendChild(tooltip);

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);

  ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();
  loop();
}

export function update(state) {
  if (!scene) return;
  build(state);
  applyFocus();
}

export function setEraFocus(id) {
  focusEra = id || null;
  applyFocus();
}

export function dispose() {
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  if (ro) { ro.disconnect(); ro = null; }
  if (controls) { controls.dispose(); controls = null; }
  if (root) clearGroup(root);
  if (renderer) {
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('pointerup', onPointerUp);
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    renderer.dispose();
    renderer = null;
  }
  if (labelRenderer && labelRenderer.domElement && labelRenderer.domElement.parentNode) {
    labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
  }
  labelRenderer = null;
  if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
  if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
  tooltip = hint = null;
  if (scene) {
    scene.clear();
    scene = null;
  }
  camera = root = floor = light = container = null;
  started = false;
  fittedKey = '';
}
