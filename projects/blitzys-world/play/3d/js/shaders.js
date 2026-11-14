// Blitzy's World v1.0 — procedural materials. Everything on screen is generated
// by these shaders: there are no image textures in the game.
import * as THREE from 'three';

const NOISE = /* glsl */`
float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x),
                 mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
                 mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 17.7; a *= 0.5; }
  return s;
}
float fbm3(vec3 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.03 + 17.7; a *= 0.5; }
  return s;
}
`;

const BODY_VERT = /* glsl */`
varying vec3 vObj; varying vec3 vN; varying vec3 vW;
void main(){
  vObj = position;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const col = (c) => new THREE.Color(c);

// type: 0 rock, 1 gas giant, 2 lava, 3 ice
export function planetMaterial({ type = 0, colors, atmo = 0x8855ff, seed = 1, sunDir, sunColor = 0xffffff }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uType: { value: type }, uSeed: { value: seed }, uTime: { value: 0 },
      uC1: { value: col(colors[0]) }, uC2: { value: col(colors[1]) }, uC3: { value: col(colors[2]) },
      uAtmo: { value: col(atmo) }, uSunDir: { value: sunDir.clone().normalize() }, uSunCol: { value: col(sunColor) },
    },
    vertexShader: BODY_VERT,
    fragmentShader: /* glsl */`
      uniform int uType; uniform float uSeed, uTime;
      uniform vec3 uC1, uC2, uC3, uAtmo, uSunDir, uSunCol;
      varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      ${NOISE}
      void main(){
        vec3 o = normalize(vObj);
        vec3 p = o * 2.0 + uSeed;
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        vec3 c; vec3 emis = vec3(0.0); float gloss = 0.0;
        if (uType == 0) {
          float h = fbm(p * 1.6);
          float h2 = fbm(p * 5.0 + h * 2.0);
          c = mix(uC1, uC2, smoothstep(0.35, 0.62, h));
          c = mix(c, uC3, smoothstep(0.5, 0.75, h2) * 0.65);
          c *= 0.7 + 0.6 * h2;
        } else if (uType == 1) {
          float warp = fbm(p * 1.4 + vec3(0.0, uTime * 0.012, 0.0));
          float bands = sin(o.y * 17.0 + warp * 5.5) * 0.5 + 0.5;
          float fine = fbm(vec3(p.x * 1.4, o.y * 15.0, p.z * 1.4) + warp * 1.5);
          c = mix(uC1, uC2, bands);
          c = mix(c, uC3, fine * 0.55);
          float storm = (1.0 - smoothstep(0.0, 0.2, length(o - normalize(vec3(0.7, -0.25, 0.6)))));
          c = mix(c, uC3 * 1.3, storm * 0.7);
        } else if (uType == 2) {
          float h = fbm(p * 2.2);
          float cr = abs(fbm(p * 3.6 + vec3(0.0, uTime * 0.02, 0.0)) - 0.5) * 2.0;
          float glow = pow(clamp(1.0 - cr, 0.0, 1.0), 14.0);
          c = mix(uC1, uC2, h) * 0.6;
          emis = uC3 * glow * 3.5;
        } else {
          float h = fbm(p * 2.4);
          float cr = pow(clamp(1.0 - abs(fbm(p * 6.0) - 0.5) * 2.0, 0.0, 1.0), 9.0);
          c = mix(uC1, uC2, h);
          c = mix(c, uC3, cr * 0.75);
          gloss = 1.0;
        }
        float ndl = dot(N, uSunDir);
        float day = smoothstep(-0.18, 0.65, ndl);
        float fres = pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 3.0);
        vec3 lit = c * uSunCol * (0.03 + day * 0.95);
        vec3 H = normalize(uSunDir + V);
        lit += gloss * uSunCol * pow(max(dot(N, H), 0.0), 60.0) * day * 0.9;
        lit += uAtmo * fres * (0.1 + day * 0.7);
        lit += emis;
        gl_FragColor = vec4(lit, 1.0);
      }`,
  });
}

export function atmosphereMaterial(color, sunDir, ratio = 1.08) {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: col(color) }, uSunDir: { value: sunDir.clone().normalize() }, uK: { value: Math.sqrt(1 - 1 / (ratio * ratio)) } },
    vertexShader: BODY_VERT,
    fragmentShader: /* glsl */`
      uniform vec3 uCol, uSunDir; uniform float uK; varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        float a = smoothstep(0.0, uK, -dot(N, V));
        float day = smoothstep(-0.5, 0.5, dot(N, uSunDir));
        gl_FragColor = vec4(uCol * a * a * a * (0.12 + day * 1.1), 1.0);
      }`,
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

export function sunMaterial(c1, c2) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uC1: { value: col(c1) }, uC2: { value: col(c2) } },
    vertexShader: BODY_VERT,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uC1, uC2;
      varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      ${NOISE}
      void main(){
        vec3 p = normalize(vObj) * 3.0;
        float n = fbm(p + vec3(0.0, uTime * 0.12, 0.0));
        float n2 = fbm(p * 2.6 - vec3(uTime * 0.18) + n * 2.0);
        vec3 V = normalize(cameraPosition - vW);
        float limb = pow(clamp(1.0 - dot(normalize(vN), V), 0.0, 1.0), 2.0);
        vec3 c = mix(uC2, uC1, n2) * (0.9 + 2.4 * n2 * n2) + uC1 * limb * 1.4;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

const FLAT_VERT = /* glsl */`
varying vec3 vObj; varying vec3 vW;
void main(){
  vObj = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

// Planetary rings. Geometry is a RingGeometry in the XY plane.
export function ringMaterial(c1, c2, inner, outer, seed = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uC1: { value: col(c1) }, uC2: { value: col(c2) }, uIn: { value: inner }, uOut: { value: outer }, uSeed: { value: seed } },
    vertexShader: FLAT_VERT,
    fragmentShader: /* glsl */`
      uniform vec3 uC1, uC2; uniform float uIn, uOut, uSeed;
      varying vec3 vObj; varying vec3 vW;
      ${NOISE}
      void main(){
        float r = (length(vObj.xy) - uIn) / (uOut - uIn);
        float b = vnoise(vec3(r * 34.0, uSeed, 0.0)) * 0.6 + vnoise(vec3(r * 110.0, uSeed, 3.0)) * 0.4;
        float gap = smoothstep(0.02, 0.06, abs(r - 0.42)) * smoothstep(0.01, 0.03, abs(r - 0.71));
        float a = smoothstep(0.0, 0.05, r) * (1.0 - smoothstep(0.93, 1.0, r)) * gap * (0.25 + 0.75 * b);
        float grain = 0.8 + 0.4 * vnoise(vObj * 0.35);
        gl_FragColor = vec4(mix(uC1, uC2, b) * grain * 0.9, a * 0.85);
      }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
  });
}

// Black hole accretion disk: differential rotation, hot inner edge, one side Doppler-brightened.
export function diskMaterial(inner, outer) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIn: { value: inner }, uOut: { value: outer } },
    vertexShader: FLAT_VERT,
    fragmentShader: /* glsl */`
      uniform float uTime, uIn, uOut; varying vec3 vObj; varying vec3 vW;
      ${NOISE}
      void main(){
        float rad = length(vObj.xy);
        float r = (rad - uIn) / (uOut - uIn);
        float a = atan(vObj.y, vObj.x);
        float ang = a + uTime * 1.6 / pow(0.35 + max(r, 0.0), 1.5);
        vec3 q = vec3(cos(ang) * (1.0 + r * 3.0), sin(ang) * (1.0 + r * 3.0), r * 9.0);
        float n = fbm(q * 1.8);
        float streak = fbm(vec3(r * 26.0, ang * 1.5, 1.0) * vec3(1.0, 0.25, 1.0) + q * 0.4);
        float heat = pow(1.0 - clamp(r, 0.0, 1.0), 2.4);
        vec3 hot = vec3(1.0, 0.92, 0.82), warm = vec3(1.0, 0.45, 0.12), cool = vec3(0.55, 0.1, 0.25);
        vec3 c = mix(cool, warm, smoothstep(0.0, 0.5, heat));
        c = mix(c, hot, smoothstep(0.45, 1.0, heat));
        float doppler = 1.0 + 0.65 * sin(a);
        float dens = (0.35 + 0.9 * n) * (0.4 + 0.9 * streak);
        float alpha = smoothstep(0.0, 0.04, r) * (1.0 - smoothstep(0.55, 1.0, r)) * dens;
        gl_FragColor = vec4(c * (0.35 + 3.2 * heat) * doppler * dens, clamp(alpha, 0.0, 1.0));
      }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// Swirling portal disc (warp gate and wormholes). CircleGeometry of radius 1 in XY.
export function portalMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCol: { value: col(color) }, uOpen: { value: 1 } },
    vertexShader: FLAT_VERT,
    fragmentShader: /* glsl */`
      uniform float uTime, uOpen; uniform vec3 uCol; varying vec3 vObj; varying vec3 vW;
      ${NOISE}
      void main(){
        float r = length(vObj.xy);
        float a = atan(vObj.y, vObj.x + 1e-5);
        float sw = a + (1.0 - r) * 5.0 - uTime * 1.8;
        float n = fbm3(vec3(cos(sw) * 2.0, sin(sw) * 2.0, r * 5.0 - uTime * 0.9));
        float arms = pow(0.5 + 0.5 * sin(sw * 3.0 + n * 4.0), 2.0);
        float core = (1.0 - smoothstep(0.0, 0.55, r));
        float rim = smoothstep(0.75, 1.0, r) * (1.0 - smoothstep(0.96, 1.0, r));
        vec3 c = uCol * (arms * (0.4 + r) * 1.1 + rim * 3.0) + vec3(1.0) * core * core * 0.9;
        float alpha = (1.0 - smoothstep(0.94, 1.0, r)) * (0.55 + 0.45 * arms) * uOpen;
        gl_FragColor = vec4(c * uOpen, alpha);
      }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// Pulsar beam: an open cone, apex at the star.
export function beamMaterial(color, length) {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: col(color) }, uLen: { value: length }, uTime: { value: 0 } },
    vertexShader: BODY_VERT,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; uniform float uLen, uTime;
      varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      void main(){
        float s = clamp(abs(vObj.y) / uLen, 0.0, 1.0);
        vec3 V = normalize(cameraPosition - vW);
        float f = pow(abs(dot(normalize(vN), V)), 1.5);
        float flick = 0.85 + 0.15 * sin(uTime * 40.0 + s * 60.0);
        gl_FragColor = vec4(uCol * (1.0 - s) * (1.0 - s) * (0.5 + 2.6 * f) * flick, 1.0);
      }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// Blitzy: an orb of light with a swirling surface.
export function orbMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBoost: { value: 0 }, uHit: { value: 0 } },
    vertexShader: BODY_VERT,
    fragmentShader: /* glsl */`
      uniform float uTime, uBoost, uHit; varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      ${NOISE}
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        float fres = pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 2.0);
        float n = fbm3(normalize(vObj) * 2.5 + vec3(0.0, uTime * 0.6, uTime * 0.3));
        vec3 violet = vec3(0.75, 0.4, 1.0), cyan = vec3(0.3, 0.9, 1.0);
        vec3 c = mix(violet, cyan, clamp(n * 1.4 - 0.2 + uBoost * 0.5, 0.0, 1.0));
        vec3 outc = c * (0.32 + n * 0.45) + c * fres * 1.1 + vec3(1.0) * pow(1.0 - fres, 4.0) * 0.12;
        outc = mix(outc, vec3(3.0, 0.3, 0.4), uHit);
        gl_FragColor = vec4(outc * (1.0 + uBoost * 0.6), 1.0);
      }`,
  });
}

// Fresnel shell used for the pulse shockwave and the shield flash.
export function shellMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: col(color) }, uAlpha: { value: 0 } },
    vertexShader: BODY_VERT,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; uniform float uAlpha; varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      void main(){
        float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(cameraPosition - vW))), 0.0, 1.0), 2.5);
        gl_FragColor = vec4(uCol * (0.15 + f * 3.0) * uAlpha, 1.0);
      }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// Nebula sky. Rendered once per sector into a cube map, so it costs nothing per frame.
export function skyMaterial({ a, b, c, seed = 1, intensity = 1 }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uA: { value: col(a) }, uB: { value: col(b) }, uC: { value: col(c) },
      uSeed: { value: seed }, uI: { value: intensity },
      uBand: { value: new THREE.Vector3(Math.sin(seed * 1.3), 0.8, Math.cos(seed * 2.1)).normalize() },
    },
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uA, uB, uC, uBand; uniform float uSeed, uI; varying vec3 vDir;
      ${NOISE}
      void main(){
        vec3 d = normalize(vDir);
        float n1 = fbm(d * 1.7 + uSeed);
        float n2 = fbm(d * 3.4 + n1 * 2.4 + uSeed * 1.7);
        float n3 = fbm(d * 7.0 - uSeed + n2);
        float clouds = smoothstep(0.42, 0.82, n2);
        float lanes = smoothstep(0.35, 0.6, n3);
        vec3 c = uA * pow(n1, 3.0) * 0.55 + uB * clouds * 0.3 * lanes + uC * pow(n3, 4.0) * 0.9 * clouds;
        float band = exp(-pow(dot(d, uBand) * 3.2, 2.0));
        c += (uA + uB) * 0.12 * band * (0.3 + fbm(d * 9.0 + uSeed));
        vec3 g = d * 190.0; vec3 id = floor(g);
        float h = hash13(id);
        float s = smoothstep(0.972 - band * 0.02, 1.0, h) * (1.0 - smoothstep(0.0, 0.4, length(fract(g) - 0.5)));
        c += s * (0.35 + band * 0.9) * mix(vec3(1.0, 0.85, 0.7), vec3(0.75, 0.85, 1.0), hash13(id + 7.0));
        gl_FragColor = vec4(c * uI, 1.0);
      }`,
    side: THREE.BackSide, depthWrite: false, depthTest: false,
  });
}

// Bright foreground stars: sharp, twinkling, always centred on the camera.
export function starPointsMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPR: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSize; attribute vec3 color; uniform float uTime, uPR; varying vec3 vCol;
      void main(){
        float tw = 0.78 + 0.22 * sin(uTime * (1.0 + fract(aSize * 7.3) * 3.0) + aSize * 40.0);
        vCol = color * tw * (0.22 + aSize * 0.62);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.2, aSize * uPR * 1.6);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = (1.0 - smoothstep(0.05, 0.5, d)); gl_FragColor = vec4(vCol * a * a, 1.0); }`,
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
  });
}

// World-space sprite particles (explosions, exhaust, comet tails, stardust motes).
export function particleMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 600 } },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec2 aData; uniform float uScale; varying vec3 vCol; varying float vA;
      void main(){
        vCol = color; vA = aData.y;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aData.x * uScale / max(-mv.z, 1.0), 0.0, 220.0);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = pow(max(1.0 - d, 0.0), 1.8); gl_FragColor = vec4(vCol * a * vA, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// Ambient space dust in a box that wraps around the camera: gives a sense of speed.
export function speedDustMaterial(box) {
  return new THREE.ShaderMaterial({
    uniforms: { uCam: { value: new THREE.Vector3() }, uBox: { value: box }, uScale: { value: 600 }, uSpeed: { value: 0 } },
    vertexShader: /* glsl */`
      uniform vec3 uCam; uniform float uBox, uScale, uSpeed; varying float vA;
      void main(){
        vec3 p = mod(position - uCam + uBox * 0.5, uBox) - uBox * 0.5;
        float dist = length(p);
        vA = (1.0 - smoothstep(uBox * 0.2, uBox * 0.5, dist)) * smoothstep(20.0, 90.0, dist) * (0.25 + uSpeed * 0.75);
        vec4 mv = viewMatrix * vec4(p + uCam, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(2.2 * uScale / max(-mv.z, 1.0), 1.0, 5.0);
      }`,
    fragmentShader: /* glsl */`
      varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(vec3(0.7, 0.75, 1.0) * max(1.0 - d, 0.0) * vA, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// Light ribbon behind Blitzy.
export function trailMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
      attribute vec4 aCol; varying vec4 vCol; varying float vSide; attribute float aSide;
      void main(){ vCol = aCol; vSide = aSide; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      varying vec4 vCol; varying float vSide;
      void main(){ float e = clamp(1.0 - abs(vSide), 0.0, 1.0); gl_FragColor = vec4(vCol.rgb * pow(e, 1.5) * vCol.a, 1.0); }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// 3D simplex noise by Ian McEwan (Ashima Arts) and Stefan Gustavson, MIT licence,
// from https://github.com/stegu/webgl-noise (src/noise3D.glsl).
const SIMPLEX = /* glsl */`
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 permute(vec4 x) {
     return mod289(((x*34.0)+10.0)*x);
}
vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}
float snoise(vec3 v)
  { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
  }
`;

// Solar corona: a camera-facing quad with streamers of simplex noise. PlaneGeometry(2, 2).
export function coronaMaterial(color, inner) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCol: { value: col(color) }, uIn: { value: inner } },
    vertexShader: FLAT_VERT,
    fragmentShader: /* glsl */`
      uniform float uTime, uIn; uniform vec3 uCol; varying vec3 vObj; varying vec3 vW;
      ${SIMPLEX}
      void main(){
        float r = length(vObj.xy);
        float a = atan(vObj.y, vObj.x + 1e-5);
        float h = max(r - uIn, 0.0) / (1.0 - uIn);
        vec3 q = vec3(cos(a) * 2.2, sin(a) * 2.2, r * 2.5 - uTime * 0.25);
        float streamers = 0.5 + 0.5 * snoise(q) + 0.25 * snoise(q * 2.7 + 9.0);
        float fine = 0.5 + 0.5 * snoise(vec3(cos(a) * 7.0, sin(a) * 7.0, r * 5.0 - uTime * 0.6));
        float fall = exp(-h * (5.5 - streamers * 3.0)) * (1.0 - smoothstep(0.7, 1.0, r));
        float i = fall * (0.35 + 0.9 * streamers * fine) * step(uIn * 0.92, r);
        gl_FragColor = vec4(uCol * i * 0.75, 1.0);
      }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// Supernova shock front: a turbulent, glowing expanding shell.
export function shockMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: BODY_VERT,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      ${SIMPLEX}
      void main(){
        vec3 o = normalize(vObj);
        float n = 0.5 + 0.5 * snoise(o * 5.0 + vec3(0.0, uTime * 0.5, 0.0));
        float n2 = 0.5 + 0.5 * snoise(o * 13.0 - vec3(uTime * 0.8));
        float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(cameraPosition - vW))), 0.0, 1.0), 1.6);
        vec3 c = mix(vec3(1.0, 0.35, 0.08), vec3(1.0, 0.9, 0.7), n * n2);
        gl_FragColor = vec4(c * (0.2 + 1.5 * f + 1.0 * n * n2), 0.5 + 0.4 * n);
      }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
  });
}
