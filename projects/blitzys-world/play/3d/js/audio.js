// Blitzy's World v1.0 — all sound is synthesised live with the Web Audio API.
// No audio files: a generative ambient score plus synth sound effects.

const SCALES = [
  [0, 3, 5, 7, 10],      // minor pentatonic
  [0, 2, 4, 7, 9],       // major pentatonic
  [0, 2, 3, 7, 8],       // hirajoshi-ish
  [0, 5, 7, 10, 12],     // open fifths
];

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try { this.muted = localStorage.getItem('bw1_mute') === '1'; } catch (_) {}
    this.root = 110;
    this.scale = SCALES[0];
    this.nextNote = 0;
    this.thrustLevel = 0;
  }

  // Must be called from a user gesture.
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(ctx.destination);

    // shared echo "space" for musical sounds
    this.wet = ctx.createGain(); this.wet.gain.value = 0.5;
    const d1 = ctx.createDelay(1.5), d2 = ctx.createDelay(1.5);
    d1.delayTime.value = 0.37; d2.delayTime.value = 0.53;
    const fb = ctx.createGain(); fb.gain.value = 0.46;
    const damp = ctx.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 2400;
    this.wet.connect(d1); d1.connect(d2); d2.connect(damp); damp.connect(fb); fb.connect(d1);
    d1.connect(this.master); d2.connect(this.master);

    // ambient pad: detuned oscillators through a slowly breathing filter
    this.padGain = ctx.createGain(); this.padGain.gain.value = 0.0;
    this.padFilter = ctx.createBiquadFilter(); this.padFilter.type = 'lowpass'; this.padFilter.frequency.value = 420; this.padFilter.Q.value = 0.7;
    this.padFilter.connect(this.padGain); this.padGain.connect(this.master); this.padGain.connect(this.wet);
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 0.07; lfoG.gain.value = 190; lfo.connect(lfoG); lfoG.connect(this.padFilter.frequency); lfo.start();
    this.padOsc = [];
    for (const [mult, det, type] of [[0.5, -4, 'sawtooth'], [0.5, 5, 'sawtooth'], [0.75, 0, 'triangle'], [1, 3, 'sine'], [1.5, -3, 'sine']]) {
      const o = ctx.createOscillator(); o.type = type; o.detune.value = det; o.frequency.value = this.root * mult;
      const g = ctx.createGain(); g.gain.value = type === 'sawtooth' ? 0.09 : 0.14;
      o.connect(g); g.connect(this.padFilter); o.start();
      this.padOsc.push({ o, mult });
    }
    this.padGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 4);

    // thruster: filtered noise that follows speed and boost
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    const ns = ctx.createBufferSource(); ns.buffer = buf; ns.loop = true;
    this.thrustFilter = ctx.createBiquadFilter(); this.thrustFilter.type = 'bandpass'; this.thrustFilter.frequency.value = 300; this.thrustFilter.Q.value = 0.6;
    this.thrustGain = ctx.createGain(); this.thrustGain.gain.value = 0;
    ns.connect(this.thrustFilter); this.thrustFilter.connect(this.thrustGain); this.thrustGain.connect(this.master); ns.start();
    this.nextNote = ctx.currentTime + 2;
  }

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('bw1_mute', this.muted ? '1' : '0'); } catch (_) {}
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    return this.muted;
  }

  suspend(on) {
    if (!this.ctx) return;
    this.padGain.gain.setTargetAtTime(on ? 0.22 : 0.5, this.ctx.currentTime, 0.4);
    if (on) this.thrustGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
  }

  // Each sector has its own key and scale.
  setMood(index) {
    const roots = [110, 98, 123.47, 130.81, 87.31, 116.54, 103.83, 73.42];
    this.root = roots[index % roots.length];
    this.scale = SCALES[index % SCALES.length];
    if (!this.ctx) return;
    for (const p of this.padOsc) p.o.frequency.setTargetAtTime(this.root * p.mult, this.ctx.currentTime, 1.2);
  }

  _tone(freq, { type = 'sine', dur = 0.4, vol = 0.2, attack = 0.005, to = null, wet = 0.5, when = 0 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + when;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    if (wet > 0) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(this.wet); }
    o.start(t); o.stop(t + dur + 0.05);
  }

  _noise({ dur = 0.4, vol = 0.3, from = 2000, to = 200, type = 'lowpass', q = 0.8, when = 0 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + when;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  note(deg, oct = 2) {
    const sc = this.scale, n = sc.length;
    const semis = sc[((deg % n) + n) % n] + 12 * Math.floor(deg / n);
    return this.root * Math.pow(2, oct + semis / 12);
  }

  // Called every frame: schedules the generative melody and drives the thruster.
  update(dt, { thrust = 0, boost = 0, speed = 0, danger = 0, playing = false } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    if (now >= this.nextNote) {
      const step = 0.42 - danger * 0.14;
      this.nextNote = now + step * (Math.random() < 0.25 ? 2 : 1);
      if (Math.random() < 0.72) {
        const deg = Math.floor(Math.random() * 9) - 2;
        this._tone(this.note(deg, 2), { type: Math.random() < 0.5 ? 'triangle' : 'sine', dur: 1.4, vol: 0.05 + danger * 0.03, attack: 0.02, wet: 0.9 });
      }
      if (danger > 0.4 && Math.random() < 0.6) this._tone(this.root / 2, { type: 'sawtooth', dur: 0.22, vol: 0.07, wet: 0.2 });
    }
    const target = playing ? Math.min(0.32, thrust * 0.06 + boost * 0.2 + speed * 0.05) : 0;
    this.thrustGain.gain.setTargetAtTime(target, now, 0.08);
    this.thrustFilter.frequency.setTargetAtTime(220 + speed * 700 + boost * 900, now, 0.1);
  }

  star(combo) {
    const d = Math.min(combo - 1, 9);
    this._tone(this.note(d, 3), { type: 'triangle', dur: 0.5, vol: 0.2 });
    this._tone(this.note(d + 2, 3), { type: 'sine', dur: 0.7, vol: 0.14, when: 0.07 });
    this._tone(this.note(d + 4, 4), { type: 'sine', dur: 0.9, vol: 0.08, when: 0.14 });
  }
  dust() { this._tone(this.note(4 + ((Math.random() * 4) | 0), 4), { dur: 0.16, vol: 0.045, wet: 0.7 }); }
  bonus() { this._tone(this.note(2, 3), { type: 'square', dur: 0.12, vol: 0.06 }); this._tone(this.note(4, 3), { type: 'square', dur: 0.2, vol: 0.06, when: 0.08 }); }
  hit() {
    this._noise({ dur: 0.5, vol: 0.5, from: 3000, to: 80 });
    this._tone(160, { type: 'sawtooth', dur: 0.45, vol: 0.3, to: 40, wet: 0.2 });
  }
  pulse() {
    this._tone(90, { type: 'sine', dur: 0.9, vol: 0.45, to: 30, wet: 0.3 });
    this._noise({ dur: 0.8, vol: 0.25, from: 400, to: 6000, type: 'bandpass', q: 2 });
  }
  crunch() { this._noise({ dur: 0.22, vol: 0.22, from: 1800, to: 200 }); }
  kill() { this._noise({ dur: 0.5, vol: 0.35, from: 5000, to: 100 }); this._tone(660, { type: 'square', dur: 0.4, vol: 0.12, to: 110 }); }
  shot() { this._tone(900, { type: 'sawtooth', dur: 0.18, vol: 0.05, to: 200, wet: 0.2 }); }
  denied() { this._tone(110, { type: 'square', dur: 0.12, vol: 0.07, wet: 0 }); }
  portal() { this._tone(220, { type: 'sine', dur: 0.7, vol: 0.25, to: 1760 }); this._noise({ dur: 0.6, vol: 0.2, from: 300, to: 8000, type: 'bandpass', q: 3 }); }
  gateOpen() { for (let i = 0; i < 5; i++) this._tone(this.note(i * 2, 3), { type: 'triangle', dur: 1.2, vol: 0.12, when: i * 0.09 }); }
  warp() {
    this._noise({ dur: 2.0, vol: 0.4, from: 200, to: 9000, type: 'bandpass', q: 1.5 });
    this._tone(55, { type: 'sawtooth', dur: 2.0, vol: 0.2, to: 880, wet: 0.6 });
  }
  clear() { [0, 2, 4, 5, 7].forEach((d, i) => this._tone(this.note(d, 3), { type: 'triangle', dur: 1.6, vol: 0.13, when: i * 0.12 })); }
  over() { [4, 2, 1, 0].forEach((d, i) => this._tone(this.note(d, 2), { type: 'sawtooth', dur: 1.2, vol: 0.09, when: i * 0.22 })); }
  alarm() { this._tone(880, { type: 'square', dur: 0.09, vol: 0.05, wet: 0 }); }
}
