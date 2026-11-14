// Blitzy's World v1.0 — HDR post-processing, written by hand on top of three's core.
// Scene → half-float target → dual-filter bloom → composite (gravitational lensing,
// warp streaks, chromatic aberration, ACES tone mapping, vignette, film grain).
import * as THREE from 'three';

const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

function pass(fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader, uniforms, depthTest: false, depthWrite: false });
}

export class Post {
  constructor(renderer, { mips = 5, msaa = 4 } = {}) {
    this.renderer = renderer;
    const ext = renderer.extensions;
    this.type = (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float')) ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.mipCount = mips;
    this.msaa = msaa;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.qscene = new THREE.Scene();
    this.qscene.add(this.quad);

    this.mPrefilter = pass(/* glsl */`
      uniform sampler2D tMap; uniform float uThreshold; varying vec2 vUv;
      void main(){
        vec3 c = min(texture2D(tMap, vUv).rgb, vec3(40.0));
        if (any(isnan(c))) c = vec3(0.0);
        float br = max(c.r, max(c.g, c.b));
        float k = max(br - uThreshold, 0.0) / max(br, 1e-4);
        gl_FragColor = vec4(c * k, 1.0);
      }`, { tMap: { value: null }, uThreshold: { value: 1.0 } });

    this.mDown = pass(/* glsl */`
      uniform sampler2D tMap; uniform vec2 uTexel; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(tMap, vUv).rgb * 4.0;
        c += texture2D(tMap, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
        c += texture2D(tMap, vUv + uTexel * vec2( 1.0, -1.0)).rgb;
        c += texture2D(tMap, vUv + uTexel * vec2(-1.0,  1.0)).rgb;
        c += texture2D(tMap, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
        gl_FragColor = vec4(c / 8.0, 1.0);
      }`, { tMap: { value: null }, uTexel: { value: new THREE.Vector2() } });

    this.mUp = pass(/* glsl */`
      uniform sampler2D tMap, tAdd; uniform vec2 uTexel; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(tMap, vUv + uTexel * vec2(-2.0, 0.0)).rgb;
        c += texture2D(tMap, vUv + uTexel * vec2( 2.0, 0.0)).rgb;
        c += texture2D(tMap, vUv + uTexel * vec2(0.0, -2.0)).rgb;
        c += texture2D(tMap, vUv + uTexel * vec2(0.0,  2.0)).rgb;
        c += texture2D(tMap, vUv + uTexel * vec2(-1.0,  1.0)).rgb * 2.0;
        c += texture2D(tMap, vUv + uTexel * vec2( 1.0,  1.0)).rgb * 2.0;
        c += texture2D(tMap, vUv + uTexel * vec2(-1.0, -1.0)).rgb * 2.0;
        c += texture2D(tMap, vUv + uTexel * vec2( 1.0, -1.0)).rgb * 2.0;
        gl_FragColor = vec4(c / 12.0 + texture2D(tAdd, vUv).rgb, 1.0);
      }`, { tMap: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() } });

    this.u = {
      tScene: { value: null }, tBloom: { value: null },
      uBloom: { value: 0.3 }, uExposure: { value: 1.0 }, uTime: { value: 0 }, uAspect: { value: 1 },
      uAberration: { value: 0.0012 }, uVignette: { value: 0.9 }, uGrain: { value: 0.035 },
      uBH: { value: new THREE.Vector3(0.5, 0.5, 0) }, uBHStrength: { value: 0 },
      uWarp: { value: 0 }, uWarpCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uFlash: { value: new THREE.Vector4(0, 0, 0, 0) },
      uSun: { value: new THREE.Vector3(0.5, 0.5, 0) },
    };
    this.mComposite = pass(/* glsl */`
      uniform sampler2D tScene, tBloom;
      uniform float uBloom, uExposure, uTime, uAspect, uAberration, uVignette, uGrain, uBHStrength, uWarp;
      uniform vec3 uBH, uSun; uniform vec2 uWarpCenter; uniform vec4 uFlash;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
      vec3 sampleHDR(vec2 uv){ vec3 s = texture2D(tScene, uv).rgb; if (any(isnan(s))) s = vec3(0.0); return s + texture2D(tBloom, uv).rgb * uBloom; }
      void main(){
        vec2 uv = vUv;
        // gravitational lensing: bend every ray toward the black hole
        if (uBHStrength > 0.0) {
          vec2 d = uv - uBH.xy; d.x *= uAspect;
          float r = max(length(d), 1e-4);
          vec2 off = (d / r) * (uBHStrength * uBH.z * uBH.z / r);
          off.x /= uAspect;
          uv -= off * (1.0 - smoothstep(0.25, 0.9, r));
        }
        vec2 fromC = uv - uWarpCenter;
        vec3 c;
        if (uWarp > 0.001) {
          // hyperspace: radial streaks toward the vanishing point
          vec3 sum = vec3(0.0); float wsum = 0.0;
          for (int i = 0; i < 8; i++) {
            float k = float(i) / 7.0;
            float w = 1.0 - k * 0.6;
            sum += sampleHDR(uv - fromC * (k * uWarp * 0.45)) * w;
            wsum += w;
          }
          c = sum / wsum * (1.0 + uWarp * 0.8);
        } else {
          vec2 ab = fromC * uAberration * (0.4 + dot(fromC, fromC) * 4.0);
          c = vec3(sampleHDR(uv + ab).r, sampleHDR(uv).g, sampleHDR(uv - ab).b);
        }
        // god rays: smear the bloom buffer along rays from the light source
        // (after the radial-blur light shafts in three.js's GodRaysShader, Sousa 2008)
        if (uSun.z > 0.001) {
          vec2 stepv = (uSun.xy - uv) / 14.0 * 0.92;
          vec2 p = uv; vec3 g = vec3(0.0); float decay = 1.0;
          for (int i = 0; i < 14; i++) { p += stepv; g += texture2D(tBloom, p).rgb * decay; decay *= 0.9; }
          c += g * (uSun.z / 14.0);
        }
        c += uFlash.rgb * uFlash.a;
        c = aces(c * uExposure);
        c = pow(c, vec3(1.0 / 2.2));
        vec2 v = vUv - 0.5;
        c *= 1.0 - uVignette * dot(v, v) * 1.25;
        c += (hash(vUv * 937.0 + uTime) - 0.5) * uGrain;
        gl_FragColor = vec4(c, 1.0);
      }`, this.u);

    this.scene = null;
    this.down = []; this.up = [];
  }

  resize(w, h) {
    w = Math.max(2, Math.floor(w)); h = Math.max(2, Math.floor(h));
    if (this.w === w && this.h === h) return;
    this.w = w; this.h = h;
    if (this.scene) this.scene.dispose();
    this.down.forEach(t => t.dispose()); this.up.forEach(t => t.dispose());
    const opts = { type: this.type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.scene = new THREE.WebGLRenderTarget(w, h, { ...opts, depthBuffer: true, samples: this.msaa });
    this.down = []; this.up = [];
    let mw = w, mh = h;
    for (let i = 0; i < this.mipCount; i++) {
      mw = Math.max(2, mw >> 1); mh = Math.max(2, mh >> 1);
      this.down.push(new THREE.WebGLRenderTarget(mw, mh, opts));
      this.up.push(new THREE.WebGLRenderTarget(mw, mh, opts));
    }
    this.u.uAspect.value = w / h;
  }

  _draw(material, target) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.qscene, this.cam);
  }

  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.scene);
    r.render(scene, camera);

    const n = this.mipCount;
    this.mPrefilter.uniforms.tMap.value = this.scene.texture;
    this._draw(this.mPrefilter, this.down[0]);
    for (let i = 1; i < n; i++) {
      this.mDown.uniforms.tMap.value = this.down[i - 1].texture;
      this.mDown.uniforms.uTexel.value.set(1 / this.down[i - 1].width, 1 / this.down[i - 1].height);
      this._draw(this.mDown, this.down[i]);
    }
    let src = this.down[n - 1];
    for (let i = n - 2; i >= 0; i--) {
      this.mUp.uniforms.tMap.value = src.texture;
      this.mUp.uniforms.tAdd.value = this.down[i].texture;
      this.mUp.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      this._draw(this.mUp, this.up[i]);
      src = this.up[i];
    }
    this.u.tScene.value = this.scene.texture;
    this.u.tBloom.value = src.texture;
    this._draw(this.mComposite, null);
  }
}
