import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/world';

/**
 * 100% Procedural Web Audio Soundscape for Yorimichi
 * Requires zero external audio files. Generates bicycle bell, tire rolling,
 * footsteps, spatial stream/waterfall, mountain breeze, and birdsong on the fly.
 */
export class SoundSystem {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private isMuted = false;

  // Master Gain
  private masterGain!: GainNode;

  // Continuous Ambient Nodes
  private windGain!: GainNode;
  private waterGain!: GainNode;
  private bikeRollGain!: GainNode;
  private bikeRollFilter!: BiquadFilterNode;

  // Birds & Nocturnal Crickets Scheduler
  private nextBirdTime = 0;
  private nextCricketTime = 2.0;
  private nightFactor = 0;

  public onStateChange?: (isMuted: boolean) => void;

  constructor() {
    // 1. Prime the audio context and continuous generators immediately
    this.initAudioContext();

    // 2. Add capture-phase event listeners on user activation gestures
    const unlockEvents = ['click', 'keydown', 'mousedown', 'pointerup', 'touchend', 'touchstart'];
    const unlockHandler = () => {
      this.resumeAudioContext();
    };

    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
    });
  }

  private initAudioContext(): void {
    if (this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initWindAmbience();
      this.initWaterAmbience();
      this.initBicycleRoll();

      if (this.ctx.state === 'running') {
        this.isUnlocked = true;
        this.nextBirdTime = performance.now() * 0.001 + 3.0;
      } else {
        this.ctx.addEventListener('statechange', () => {
          if (this.ctx?.state === 'running') {
            this.isUnlocked = true;
            this.nextBirdTime = performance.now() * 0.001 + 3.0;
            if (this.masterGain && !this.isMuted) {
              this.masterGain.gain.setTargetAtTime(0.85, this.ctx.currentTime, 0.05);
            }
            this.onStateChange?.(this.isMuted);
          }
        });
      }
    } catch (e) {
      console.warn('AudioContext deferred:', e);
    }
  }

  public resumeAudioContext(): void {
    if (!this.ctx) {
      this.initAudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
        this.nextBirdTime = performance.now() * 0.001 + 3.0;
        if (this.masterGain && !this.isMuted) {
          this.masterGain.gain.setTargetAtTime(0.85, this.ctx!.currentTime, 0.05);
        }
        this.onStateChange?.(this.isMuted);
      }).catch(() => {});
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
    }
  }

  // Create a 2-second looped pink-noise buffer
  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing');
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // 1. Mountain Breeze / Leaf Rustle Ambience
  private initWindAmbience(): void {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 1.4;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.16, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    noise.start();
  }

  // 2. Continuous Flowing Stream & Waterfall Ambience
  private initWaterAmbience(): void {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650;

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.waterGain);
    this.waterGain.connect(this.masterGain);
    noise.start();
  }

  // 3. Bicycle Rolling Hum & Tire Friction
  private initBicycleRoll(): void {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    noise.loop = true;

    this.bikeRollFilter = this.ctx.createBiquadFilter();
    this.bikeRollFilter.type = 'bandpass';
    this.bikeRollFilter.frequency.value = 350;
    this.bikeRollFilter.Q.value = 2.2;

    this.bikeRollGain = this.ctx.createGain();
    this.bikeRollGain.gain.setValueAtTime(0, this.ctx.currentTime);

    noise.connect(this.bikeRollFilter);
    this.bikeRollFilter.connect(this.bikeRollGain);
    this.bikeRollGain.connect(this.masterGain);
    noise.start();
  }

  // ==========================================
  // INTERACTIVE SOUND EFFECTS
  // ==========================================

  /**
   * Traditional Brass Bicycle Bell ("Ring-Ring!")
   * Two rapid resonant FM chimes in succession.
   */
  public playBicycleBell(): void {
    this.resumeAudioContext();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const playChime = (time: number, freq: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const overtone = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = freq * 1.25;
      filter.Q.value = 10;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2.14, time);

      // Metallic exponential decay envelope
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.38, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.65);

      osc.connect(filter);
      overtone.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      overtone.start(time);
      osc.stop(time + 0.7);
      overtone.stop(time + 0.7);
    };

    // "Ding... Ding!"
    playChime(now, 2093.0);         // C7 high chime
    playChime(now + 0.13, 2489.0);    // D#7 reply chime
  }

  /**
   * Footstep on Dirt / Stone Road
   */
  public playFootstep(isStone: boolean = false): void {
    this.resumeAudioContext();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const baseFreq = isStone ? 180 + Math.random() * 40 : 110 + Math.random() * 30;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.value = isStone ? 550 : 320;

    gain.gain.setValueAtTime(0.12 + Math.random() * 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Procedural Bird Song in the distance
   */
  private playBirdChirp(): void {
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const numNotes = Math.floor(Math.random() * 3) + 2;
    const startFreq = 2800 + Math.random() * 600;

    for (let n = 0; n < numNotes; n++) {
      const noteTime = now + n * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const targetFreq = startFreq + (n % 2 === 0 ? 500 : -300);
      osc.frequency.setValueAtTime(startFreq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, noteTime + 0.06);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.03, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.075);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.08);
    }
  }

  /**
   * Procedural Japanese Night Cricket (Suzumushi)
   */
  private playCricketChirp(): void {
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const baseFreq = 4600 + Math.random() * 400;
    const pulses = 3 + Math.floor(Math.random() * 3);

    for (let p = 0; p < pulses; p++) {
      const pulseTime = now + p * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, pulseTime);
      osc.frequency.linearRampToValueAtTime(baseFreq + 220, pulseTime + 0.025);

      gain.gain.setValueAtTime(0, pulseTime);
      gain.gain.linearRampToValueAtTime(0.022 * this.nightFactor, pulseTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, pulseTime + 0.038);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(pulseTime);
      osc.stop(pulseTime + 0.045);
    }
  }

  public setDayNightBlend(factor: number): void {
    this.nightFactor = THREE.MathUtils.clamp(factor, 0, 1);
  }

  // ==========================================
  // SOUNDSCAPE UPDATE LOOP
  // ==========================================

  public update(_delta: number, time: number, playerPos: THREE.Vector3, isRidingBicycle: boolean, speed: number): void {
    if (!this.ctx || !this.isUnlocked || this.ctx.state !== 'running') return;

    // 1. Dynamic Mountain Breeze modulation
    if (this.windGain) {
      const gust = Math.sin(time * 0.35) * 0.5 + 0.5;
      const targetWind = 0.12 + gust * 0.14;
      this.windGain.gain.setTargetAtTime(targetWind, this.ctx.currentTime, 0.4);
    }

    // 2. Spatial River & Waterfall Sound
    if (this.waterGain) {
      // Distance to stream centerline (stream x ≈ -0.5 * sin(z * 0.04) * 12)
      const streamX = -Math.sin(playerPos.z * 0.04) * 12.0;
      const distToStream = Math.abs(playerPos.x - streamX);
      const wfPos = WORLD_CONFIG.landmarks.waterfall.position;
      const distToWaterfall = playerPos.distanceTo(wfPos);

      const streamFactor = Math.max(0, 1.0 - distToStream / 25.0);
      const wfFactor = Math.max(0, 1.0 - distToWaterfall / 45.0) * 1.5;
      const totalWater = Math.min(0.38, (streamFactor * 0.22 + wfFactor * 0.35));

      this.waterGain.gain.setTargetAtTime(totalWater, this.ctx.currentTime, 0.2);
    }

    // 3. Bicycle Rolling Sound
    if (this.bikeRollGain && this.bikeRollFilter) {
      if (isRidingBicycle && speed > 0.3) {
        const speedRatio = Math.min(speed / 11.0, 1.0);
        const targetGain = 0.04 + speedRatio * 0.18;
        const targetCutoff = 350 + speedRatio * 550;
        this.bikeRollGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
        this.bikeRollFilter.frequency.setTargetAtTime(targetCutoff, this.ctx.currentTime, 0.1);
      } else {
        this.bikeRollGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
    }

    // 4. Procedural Birdsong (Daytime only)
    if (this.nightFactor < 0.65 && time > this.nextBirdTime) {
      this.playBirdChirp();
      this.nextBirdTime = time + 6.0 + Math.random() * 8.0;
    }

    // 5. Nocturnal Crickets (Suzumushi chirping at night)
    if (this.nightFactor > 0.25 && time > this.nextCricketTime) {
      this.playCricketChirp();
      this.nextCricketTime = time + 2.0 + Math.random() * 4.0;
    }
  }

  // ==========================================
  // AUDIO CONTROLS (MUTE / UNMUTE)
  // ==========================================

  public toggleMute(): boolean {
    if (!this.ctx) {
      this.initAudioContext();
    }

    // If context is still suspended or locked, the user clicked specifically to START sound.
    // Ensure we unfreeze AudioContext and remain unmuted (isMuted = false) rather than muting!
    if (!this.isUnlocked || (this.ctx && this.ctx.state !== 'running')) {
      this.resumeAudioContext();
      this.isMuted = false;
    } else {
      // Audio is already active, normal toggle behavior
      this.isMuted = !this.isMuted;
    }

    if (this.masterGain && this.ctx && this.ctx.state === 'running') {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }

    this.onStateChange?.(this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}
