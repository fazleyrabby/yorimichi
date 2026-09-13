import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/visual';
import { WORLD_CONFIG } from '../config/world';

export class ParticleSystem {
  private particles: THREE.Points;
  private petalParticles: THREE.Points;
  private mistParticles: THREE.Points;
  private fireflyParticles!: THREE.Points;
  private particleGeo: THREE.BufferGeometry;
  private petalGeo: THREE.BufferGeometry;
  private mistGeo: THREE.BufferGeometry;
  private fireflyGeo!: THREE.BufferGeometry;
  private fireflyMat!: THREE.PointsMaterial;
  private positions: Float32Array;
  private petalPositions: Float32Array;
  private mistPositions: Float32Array;
  private fireflyPositions!: Float32Array;
  private fireflyOrigins: Array<{ x: number; y: number; z: number; phase: number; speed: number; range: number }> = [];
  private count = 35;
  private petalCount = 80;
  private mistCount = 60;
  private fireflyCount = 75;
  private nightFactor = 0;

  constructor(scene: THREE.Scene) {
    // 1. Sparse subtle floating motes (clean RTS screen clarity)
    this.particleGeo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3 + 0] = (Math.random() - 0.5) * 120;
      this.positions[i * 3 + 1] = Math.random() * 12 + 1;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }

    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xfff0d0,
      size: 0.25,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });

    this.particles = new THREE.Points(this.particleGeo, particleMat);
    scene.add(this.particles);

    // 2. Drifting Cherry Blossom Petals
    this.petalGeo = new THREE.BufferGeometry();
    this.petalPositions = new Float32Array(this.petalCount * 3);

    for (let i = 0; i < this.petalCount; i++) {
      this.petalPositions[i * 3 + 0] = -25 + (Math.random() - 0.5) * 35;
      this.petalPositions[i * 3 + 1] = Math.random() * 12 + 1;
      this.petalPositions[i * 3 + 2] = -18 + (Math.random() - 0.5) * 35;
    }

    this.petalGeo.setAttribute('position', new THREE.BufferAttribute(this.petalPositions, 3));

    const petalMat = new THREE.PointsMaterial({
      color: VISUAL_CONFIG.palette.cherryBlossomPetal,
      size: 0.45,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });

    this.petalParticles = new THREE.Points(this.petalGeo, petalMat);
    scene.add(this.petalParticles);

    // 3. Waterfall Mist (Delicate splash spray localized strictly at impact basins)
    const wfPos = WORLD_CONFIG.landmarks.waterfall.position;
    this.mistGeo = new THREE.BufferGeometry();
    this.mistPositions = new Float32Array(this.mistCount * 3);

    for (let i = 0; i < this.mistCount; i++) {
      const tier = i % 3;
      const originY = tier === 0 ? 2.5 : tier === 1 ? 7.2 : 11.8;
      const originZ = tier === 0 ? -46.5 : tier === 1 ? -50.0 : -53.8;

      this.mistPositions[i * 3 + 0] = wfPos.x + (Math.random() - 0.5) * (tier === 0 ? 3.8 : 2.5);
      this.mistPositions[i * 3 + 1] = originY + Math.random() * 0.8;
      this.mistPositions[i * 3 + 2] = originZ + (Math.random() - 0.5) * 2.0;
    }

    this.mistGeo.setAttribute('position', new THREE.BufferAttribute(this.mistPositions, 3));

    const mistMat = new THREE.PointsMaterial({
      color: 0xf0fdfa,
      size: 0.24,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });

    this.mistParticles = new THREE.Points(this.mistGeo, mistMat);
    scene.add(this.mistParticles);

    // 4. Bioluminescent Fireflies System (Hotaru)
    this.initFireflies(scene);

    // 5. Ghibli Chimney Smoke System
    this.initChimneySmoke(scene);
  }

  private initFireflies(scene: THREE.Scene): void {
    this.fireflyGeo = new THREE.BufferGeometry();
    this.fireflyPositions = new Float32Array(this.fireflyCount * 3);

    for (let i = 0; i < this.fireflyCount; i++) {
      let baseX: number;
      let baseY: number;
      let baseZ: number;

      // Group fireflies into 3 atmospheric clusters:
      // A. Riverbanks & Reeds (i < 40)
      // B. Sacred Shrine Woods (40 <= i < 60)
      // C. Waterfall Gorge Plunge Pool (60 <= i < 75)
      if (i < 40) {
        const streamZ = -30 + Math.random() * 70; // along river
        const streamX = 1.5 + (Math.random() - 0.5) * 12.0;
        baseX = streamX;
        baseZ = streamZ;
        baseY = 2.2 + Math.random() * 1.8;
      } else if (i < 60) {
        baseX = -36 + (Math.random() - 0.5) * 16.0; // near shrine
        baseZ = -26 + (Math.random() - 0.5) * 16.0;
        baseY = 6.4 + Math.random() * 2.2;
      } else {
        baseX = -8.0 + (Math.random() - 0.5) * 10.0; // near waterfall basin
        baseZ = -46.0 + (Math.random() - 0.5) * 10.0;
        baseY = 2.8 + Math.random() * 2.5;
      }

      this.fireflyPositions[i * 3 + 0] = baseX;
      this.fireflyPositions[i * 3 + 1] = baseY;
      this.fireflyPositions[i * 3 + 2] = baseZ;

      this.fireflyOrigins.push({
        x: baseX,
        y: baseY,
        z: baseZ,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
        range: 1.2 + Math.random() * 1.6,
      });
    }

    this.fireflyGeo.setAttribute('position', new THREE.BufferAttribute(this.fireflyPositions, 3));

    this.fireflyMat = new THREE.PointsMaterial({
      color: 0xc8ff44, // Warm glowing lime-gold bioluminescence
      size: 0.75,
      transparent: true,
      opacity: 0.0, // Hidden during full daytime
      depthWrite: false,
    });

    this.fireflyParticles = new THREE.Points(this.fireflyGeo, this.fireflyMat);
    scene.add(this.fireflyParticles);
  }

  // Animated Chimney Smoke Puffs
  private smokeGroup = new THREE.Group();
  private smokeEmitters: THREE.Vector3[] = [];
  private smokePuffs: Array<{
    mesh: THREE.Mesh;
    emitterIdx: number;
    progress: number;
    speed: number;
    wobbleOffset: number;
  }> = [];

  private initChimneySmoke(scene: THREE.Scene): void {
    scene.add(this.smokeGroup);
  }

  public registerChimney(pos: THREE.Vector3): void {
    const emitterIndex = this.smokeEmitters.length;
    this.smokeEmitters.push(pos.clone());

    // Create 10 staggered smoke puff particles for this chimney
    const smokeGeo = new THREE.DodecahedronGeometry(0.32, 1);
    const smokeMat = new THREE.MeshStandardMaterial({
      color: VISUAL_CONFIG.palette.chimneySmoke,
      roughness: 0.95,
      metalness: 0.0,
      transparent: true,
      opacity: 0.65,
      flatShading: true,
    });

    for (let p = 0; p < 10; p++) {
      const mesh = new THREE.Mesh(smokeGeo, smokeMat.clone());
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      this.smokeGroup.add(mesh);

      this.smokePuffs.push({
        mesh,
        emitterIdx: emitterIndex,
        progress: p / 10,
        speed: 0.22 + Math.random() * 0.06,
        wobbleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  public setDayNightBlend(factor: number): void {
    this.nightFactor = THREE.MathUtils.clamp(factor, 0, 1);
    // Fireflies emerge gracefully as evening approaches
    const fireflyOpacity = Math.max(0, (this.nightFactor - 0.20) / 0.80);
    this.fireflyMat.opacity = fireflyOpacity * 0.92;
  }

  public update(delta: number, time: number): void {
    // Animate subtle floating dust motes
    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3 + 1] += Math.sin(time + i) * 0.005;
      if (this.positions[i * 3 + 1] < 1) this.positions[i * 3 + 1] = 13;
      if (this.positions[i * 3 + 1] > 13) this.positions[i * 3 + 1] = 1;
    }
    this.particleGeo.attributes.position.needsUpdate = true;

    // Animate cherry blossom petals
    for (let i = 0; i < this.petalCount; i++) {
      this.petalPositions[i * 3 + 1] -= delta * 0.85;
      this.petalPositions[i * 3 + 0] += Math.sin(time * 1.5 + i) * 0.025 + 0.015;
      this.petalPositions[i * 3 + 2] += Math.cos(time * 1.2 + i) * 0.015;

      if (this.petalPositions[i * 3 + 1] < 0.5) {
        this.petalPositions[i * 3 + 1] = 12.0;
        this.petalPositions[i * 3 + 0] = -25 + (Math.random() - 0.5) * 35;
        this.petalPositions[i * 3 + 2] = -18 + (Math.random() - 0.5) * 35;
      }
    }
    this.petalGeo.attributes.position.needsUpdate = true;

    // Animate delicate waterfall mist spray
    const wfPos = WORLD_CONFIG.landmarks.waterfall.position;
    for (let i = 0; i < this.mistCount; i++) {
      const tier = i % 3;
      const originY = tier === 0 ? 2.5 : tier === 1 ? 7.2 : 11.8;
      const originZ = tier === 0 ? -46.5 : tier === 1 ? -50.0 : -53.8;

      this.mistPositions[i * 3 + 1] += delta * (0.35 + (i % 5) * 0.06);
      this.mistPositions[i * 3 + 0] += Math.sin(time * 2.0 + i) * 0.008;
      this.mistPositions[i * 3 + 2] += Math.cos(time * 1.8 + i) * 0.008;

      if (this.mistPositions[i * 3 + 1] > originY + 1.6) {
        this.mistPositions[i * 3 + 1] = originY;
        this.mistPositions[i * 3 + 0] = wfPos.x + (Math.random() - 0.5) * (tier === 0 ? 3.8 : 2.5);
        this.mistPositions[i * 3 + 2] = originZ + (Math.random() - 0.5) * 2.0;
      }
    }
    this.mistGeo.attributes.position.needsUpdate = true;

    // Animate bioluminescent fireflies drifting & pulsing
    if (this.nightFactor > 0.15) {
      for (let i = 0; i < this.fireflyCount; i++) {
        const o = this.fireflyOrigins[i];
        const t = time * o.speed + o.phase;

        // Smooth 3D figure-eight / lissajous wandering
        const dx = Math.sin(t) * o.range;
        const dy = Math.sin(t * 1.8) * 0.45;
        const dz = Math.cos(t * 0.85) * o.range;

        this.fireflyPositions[i * 3 + 0] = o.x + dx;
        this.fireflyPositions[i * 3 + 1] = o.y + dy;
        this.fireflyPositions[i * 3 + 2] = o.z + dz;
      }
      this.fireflyGeo.attributes.position.needsUpdate = true;

      // Gentle pulsating glow size
      const pulse = 0.70 + Math.sin(time * 3.5) * 0.15;
      this.fireflyMat.size = pulse;
    }

    // Animate Ghibli chimney smoke puffs rising & curling
    for (const puff of this.smokePuffs) {
      puff.progress += delta * puff.speed;
      if (puff.progress >= 1.0) {
        puff.progress = 0.0;
      }

      const emitter = this.smokeEmitters[puff.emitterIdx];
      if (!emitter) continue;

      const t = puff.progress;
      const riseY = t * 5.2;
      const driftX = Math.sin(time * 1.5 + puff.wobbleOffset) * (0.35 + t * 0.9) + t * 0.8;
      const driftZ = Math.cos(time * 1.2 + puff.wobbleOffset) * (0.3 + t * 0.6) - t * 0.4;

      puff.mesh.position.set(
        emitter.x + driftX,
        emitter.y + riseY,
        emitter.z + driftZ
      );

      const scale = 0.55 + t * 1.6;
      puff.mesh.scale.set(scale, scale * 1.15, scale);

      const mat = puff.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.sin(t * Math.PI) * 0.65;
    }
  }
}
