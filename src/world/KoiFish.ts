import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/world';

export type KoiVariety = 'kohaku' | 'tancho' | 'tancho_showa' | 'ogon' | 'asagi' | 'matsuba' | 'bekko';

interface KoiData {
  group: THREE.Group;
  tailGroup: THREE.Group;
  leftPectoral: THREE.Mesh;
  rightPectoral: THREE.Mesh;
  center: THREE.Vector3;
  radiusX: number;
  radiusZ: number;
  baseY: number;
  orbitSpeed: number;
  swimPhase: number;
  wagSpeed: number;
  wobbleSpeed: number;
  scale: number;
  variety: KoiVariety;
}

// Global cached textures for performance
const textureCache = new Map<KoiVariety, THREE.CanvasTexture>();

function getKoiTexture(variety: KoiVariety): THREE.CanvasTexture {
  if (textureCache.has(variety)) {
    return textureCache.get(variety)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Base skin gradient: porcelain white to warm cream belly
  const WHITE = '#f6f5f2';
  const CREAM = '#e9e4d8';

  // Fill base
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, 512, 512);

  // Soft belly shading (center column around u = 0.5)
  const bellyGrad = ctx.createLinearGradient(0, 0, 512, 0);
  bellyGrad.addColorStop(0.0, WHITE);
  bellyGrad.addColorStop(0.2, WHITE);
  bellyGrad.addColorStop(0.45, CREAM);
  bellyGrad.addColorStop(0.55, CREAM);
  bellyGrad.addColorStop(0.8, WHITE);
  bellyGrad.addColorStop(1.0, WHITE);
  ctx.fillStyle = bellyGrad;
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;

  // Pixel pattern generation matching the authentic Japanese varieties
  for (let y = 0; y < 512; y++) {
    const v = y / 512.0; // 0=snout, 1=tail
    const row = y * 512 * 4;

    for (let x = 0; x < 512; x++) {
      const u = x / 512.0;
      const dSpine = Math.min(u, 1.0 - u); // 0 at dorsal spine, 0.5 at belly
      const idx = row + x * 4;

      let r = data[idx] / 255.0;
      let g = data[idx + 1] / 255.0;
      let b = data[idx + 2] / 255.0;

      if (variety === 'tancho') {
        // Pristine white + crimson sun crown on forehead
        const dv = (v - 0.135) / 0.062;
        const du = dSpine / 0.062;
        const dist = Math.sqrt(dv * dv + du * du);
        if (dist < 1.0) {
          const edge = Math.min(1.0, Math.max(0.0, (1.0 - dist) * 15.0));
          r = r * (1 - edge) + 0.92 * edge;
          g = g * (1 - edge) + 0.12 * edge;
          b = b * (1 - edge) + 0.04 * edge;
        }
      } else if (variety === 'tancho_showa') {
        // Deep sumi black body + white snout rim + crimson sun crown
        r = 0.08; g = 0.08; b = 0.09;
        if (v < 0.055) {
          const wEdge = Math.min(1.0, Math.max(0.0, (0.055 - v) * 25.0));
          r = r * (1 - wEdge) + 0.96 * wEdge;
          g = g * (1 - wEdge) + 0.95 * wEdge;
          b = b * (1 - wEdge) + 0.93 * wEdge;
        }
        const dv = (v - 0.135) / 0.062;
        const du = dSpine / 0.062;
        const dist = Math.sqrt(dv * dv + du * du);
        if (dist < 1.0) {
          const edge = Math.min(1.0, Math.max(0.0, (1.0 - dist) * 15.0));
          r = r * (1 - edge) + 0.92 * edge;
          g = g * (1 - edge) + 0.12 * edge;
          b = b * (1 - edge) + 0.04 * edge;
        }
        if (v > 0.65 && v < 0.88 && dSpine < 0.04) {
          r = 0.90; g = 0.90; b = 0.92;
        }
      } else if (variety === 'kohaku') {
        // 3-step Danmoyo vermilion markings
        let isHi = 0.0;
        if (v > 0.055 && v < 0.22) {
          const scallop = 0.095 + 0.018 * Math.sin(v * 42.0);
          if (dSpine < scallop) isHi = 1.0;
        }
        if (v > 0.33 && v < 0.58) {
          const flank = 0.035 * Math.sin((u - 0.5) * Math.PI);
          const scallop = 0.16 + flank + 0.02 * Math.sin(v * 28.0);
          if (dSpine < scallop) isHi = 1.0;
        }
        if (v > 0.68 && v < 0.84) {
          const scallop = 0.105 + 0.015 * Math.cos(v * 36.0);
          if (dSpine < scallop) isHi = 1.0;
        }
        if (isHi > 0.0) {
          r = 0.92; g = 0.12; b = 0.04;
        }
      } else if (variety === 'ogon') {
        // Radiant metallic Yamabuki gold with diamond scales
        r = 0.96; g = 0.74; b = 0.10;
        if (v > 0.18 && v < 0.88 && dSpine < 0.36) {
          const mesh = Math.cos(u * 55.0 + v * 65.0) * Math.cos(u * 55.0 - v * 65.0);
          if (mesh > 0.15) {
            r = 1.0; g = 0.90; b = 0.38;
          } else if (mesh < -0.15) {
            r = 0.76; g = 0.44; b = 0.04;
          }
        }
      } else if (variety === 'asagi') {
        // Indigo blue net back + orange flanks
        if (v > 0.15 && v < 0.88 && dSpine < 0.22) {
          const mesh = Math.cos(u * 60.0 + v * 70.0) * Math.cos(u * 60.0 - v * 70.0);
          if (mesh > 0.2) {
            r = 0.70; g = 0.78; b = 0.86;
          } else if (mesh < -0.15) {
            r = 0.15; g = 0.22; b = 0.32;
          } else {
            r = 0.28; g = 0.38; b = 0.50;
          }
        } else if (v > 0.06 && v < 0.85 && dSpine > 0.17 && dSpine < 0.42) {
          r = 0.95; g = 0.36; b = 0.05;
        }
      } else if (variety === 'matsuba') {
        // Ki Matsuba: Amber orange with black pinecone scale centers
        r = 0.95; g = 0.48; b = 0.06;
        if (v > 0.18 && v < 0.86 && dSpine < 0.30) {
          const mesh = Math.cos(u * 52.0 + v * 62.0) * Math.cos(u * 52.0 - v * 62.0);
          if (mesh > 0.26) {
            r = 0.08; g = 0.07; b = 0.08;
          }
        }
      } else if (variety === 'bekko') {
        // Shiro Bekko: White body with sumi ink calligraphy patches
        let isSumi = false;
        if (v > 0.24 && v < 0.38 && dSpine > 0.02 && dSpine < 0.16) isSumi = true;
        if (v > 0.46 && v < 0.62 && dSpine < 0.14) isSumi = true;
        if (v > 0.72 && v < 0.86 && dSpine > 0.02 && dSpine < 0.12) isSumi = true;
        if (isSumi) {
          r = 0.08; g = 0.08; b = 0.09;
        }
      }

      data[idx]     = Math.floor(r * 255);
      data[idx + 1] = Math.floor(g * 255);
      data[idx + 2] = Math.floor(b * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  textureCache.set(variety, texture);
  return texture;
}

export class KoiFishSystem {
  public group: THREE.Group;
  private fishes: KoiData[] = [];
  private rippleGroup: THREE.Group;
  private ripples: Array<{ mesh: THREE.Mesh; scale: number; opacity: number; active: boolean }> = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'koi_fish_system';

    this.rippleGroup = new THREE.Group();
    this.rippleGroup.name = 'koi_ripples';
    this.group.add(this.rippleGroup);

    this.initRipples();
    this.spawnSchools();
  }

  private initRipples(): void {
    const rippleGeo = new THREE.RingGeometry(0.12, 0.22, 24);
    rippleGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < 16; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xe0f7fa,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(rippleGeo, mat);
      mesh.visible = false;
      mesh.position.y = WORLD_CONFIG.water.waterLevel + 0.01;
      this.rippleGroup.add(mesh);
      this.ripples.push({ mesh, scale: 1, opacity: 0, active: false });
    }
  }

  private triggerRipple(x: number, z: number): void {
    const r = this.ripples.find(rip => !rip.active);
    if (!r) return;

    r.active = true;
    r.mesh.visible = true;
    r.mesh.position.set(x, WORLD_CONFIG.water.waterLevel + 0.01, z);
    r.scale = 0.5;
    r.opacity = 0.55;
    (r.mesh.material as THREE.MeshBasicMaterial).opacity = r.opacity;
    r.mesh.scale.set(r.scale, 1, r.scale);
  }

  private spawnSchools(): void {
    // 1. School around the Wooden Dock (x: 25, z: 42)
    // Features the full royal 7-variety council from the reference paintings!
    const dockCenter = new THREE.Vector3(25.5, 0, 42.5);
    const dockVarieties: KoiVariety[] = ['tancho_showa', 'kohaku', 'asagi', 'matsuba', 'ogon', 'bekko', 'tancho'];
    dockVarieties.forEach((v, idx) => {
      this.addKoi({
        center: dockCenter,
        radiusX: 3.2 + Math.random() * 2.2,
        radiusZ: 3.8 + Math.random() * 2.2,
        baseY: 0.72 + Math.random() * 0.10,
        orbitSpeed: (0.35 + Math.random() * 0.15) * (idx % 2 === 0 ? 1 : -1),
        swimPhase: idx * 1.15,
        wagSpeed: 6.5 + Math.random() * 2.0,
        wobbleSpeed: 0.8 + Math.random() * 0.4,
        scale: 1.6 + Math.random() * 0.5,
        variety: v,
      });
    });

    // 2. School near Waterfront Stilt Houses (x: 18, z: 39)
    const stilt1Center = new THREE.Vector3(18.5, 0, 39.5);
    const stilt1Varieties: KoiVariety[] = ['asagi', 'ogon', 'matsuba', 'kohaku'];
    stilt1Varieties.forEach((v, idx) => {
      this.addKoi({
        center: stilt1Center,
        radiusX: 2.8 + Math.random() * 1.8,
        radiusZ: 3.2 + Math.random() * 1.8,
        baseY: 0.70 + Math.random() * 0.12,
        orbitSpeed: (0.32 + Math.random() * 0.18) * (idx % 2 === 0 ? 1 : -1),
        swimPhase: idx * 1.5,
        wagSpeed: 6.0 + Math.random() * 2.5,
        wobbleSpeed: 0.7 + Math.random() * 0.5,
        scale: 1.5 + Math.random() * 0.4,
        variety: v,
      });
    });

    // 3. School near Stilt House 2 (x: 34, z: 43)
    const stilt2Center = new THREE.Vector3(33.5, 0, 43.0);
    const stilt2Varieties: KoiVariety[] = ['tancho', 'tancho_showa', 'bekko', 'ogon'];
    stilt2Varieties.forEach((v, idx) => {
      this.addKoi({
        center: stilt2Center,
        radiusX: 3.0 + Math.random() * 1.5,
        radiusZ: 3.5 + Math.random() * 1.8,
        baseY: 0.71 + Math.random() * 0.10,
        orbitSpeed: (0.30 + Math.random() * 0.15) * (idx % 2 === 0 ? 1 : -1),
        swimPhase: idx * 1.8,
        wagSpeed: 6.2 + Math.random() * 1.8,
        wobbleSpeed: 0.9 + Math.random() * 0.3,
        scale: 1.7 + Math.random() * 0.4,
        variety: v,
      });
    });

    // 4. Estuary / Stream-to-Lake Inlet (x: 21, z: 34)
    const inletCenter = new THREE.Vector3(21.0, 0, 34.0);
    const inletVarieties: KoiVariety[] = ['kohaku', 'asagi', 'matsuba'];
    inletVarieties.forEach((v, idx) => {
      this.addKoi({
        center: inletCenter,
        radiusX: 2.2 + Math.random() * 1.2,
        radiusZ: 2.8 + Math.random() * 1.4,
        baseY: 0.73 + Math.random() * 0.08,
        orbitSpeed: (0.28 + Math.random() * 0.12) * (idx % 2 === 0 ? 1 : -1),
        swimPhase: idx * 2.1,
        wagSpeed: 5.8 + Math.random() * 2.0,
        wobbleSpeed: 0.6 + Math.random() * 0.4,
        scale: 1.5 + Math.random() * 0.35,
        variety: v,
      });
    });

    // 5. Grand River Delta Channel (x: 26 to 29, z: 52 to 64)
    const deltaCenters = [
      new THREE.Vector3(25.0, 0, 52.0),
      new THREE.Vector3(28.0, 0, 60.0),
      new THREE.Vector3(24.0, 0, 68.0),
    ];
    deltaCenters.forEach((c, idx) => {
      const deltaVarieties: KoiVariety[] = ['ogon', 'kohaku'];
      deltaVarieties.forEach((v, subIdx) => {
        this.addKoi({
          center: c,
          radiusX: 4.0 + Math.random() * 2.0,
          radiusZ: 5.0 + Math.random() * 2.0,
          baseY: 0.68 + Math.random() * 0.12,
          orbitSpeed: (0.26 + Math.random() * 0.14) * (subIdx % 2 === 0 ? 1 : -1),
          swimPhase: (idx * 2 + subIdx) * 1.4,
          wagSpeed: 5.5 + Math.random() * 2.2,
          wobbleSpeed: 0.5 + Math.random() * 0.4,
          scale: 1.8 + Math.random() * 0.5,
          variety: v,
        });
      });
    });
  }

  private addKoi(params: Omit<KoiData, 'group' | 'tailGroup' | 'leftPectoral' | 'rightPectoral'>): void {
    const fishGroup = new THREE.Group();
    fishGroup.name = `koi_${params.variety}`;

    const { meshGroup, tailGroup, leftPectoral, rightPectoral } = this.createKoiMesh(params.variety);
    fishGroup.add(meshGroup);

    const s = params.scale;
    fishGroup.scale.set(s, s, s);

    this.group.add(fishGroup);
    this.fishes.push({
      group: fishGroup,
      tailGroup,
      leftPectoral,
      rightPectoral,
      ...params,
    });
  }

  private createKoiMesh(variety: KoiVariety): {
    meshGroup: THREE.Group;
    tailGroup: THREE.Group;
    leftPectoral: THREE.Mesh;
    rightPectoral: THREE.Mesh;
  } {
    const meshGroup = new THREE.Group();

    // 1. Texture & Material
    const texture = getKoiTexture(variety);
    const isMetallic = variety === 'ogon';

    const bodyMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: isMetallic ? 0.22 : 0.28,
      metalness: isMetallic ? 0.45 : 0.03,
      emissive: new THREE.Color(isMetallic ? 0x2e1a02 : 0x111111),
      flatShading: false,
    });

    let finColor = 0xf5f5f7;
    if (variety === 'asagi') finColor = 0xf55d0a;
    else if (variety === 'ogon') finColor = 0xf5c228;
    else if (variety === 'matsuba') finColor = 0xf58814;
    else if (variety === 'tancho_showa') finColor = 0x3a3a40;

    const finMat = new THREE.MeshStandardMaterial({
      color: finColor,
      roughness: 0.32,
      metalness: isMetallic ? 0.3 : 0.02,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    // 2. Parametric Hydrodynamic Spindle Body
    // Stations along Z axis (from snout at +0.44 to tail base at -0.42)
    const stations = [
      { z:  0.44, rx: 0.035, ry: 0.025, cy: -0.010, v: 0.00 }, // Snout tip
      { z:  0.40, rx: 0.075, ry: 0.055, cy: -0.010, v: 0.04 }, // Mouth
      { z:  0.33, rx: 0.125, ry: 0.095, cy:  0.000, v: 0.12 }, // Eyes / Forehead
      { z:  0.22, rx: 0.170, ry: 0.135, cy:  0.010, v: 0.24 }, // Pectoral girdle
      { z:  0.09, rx: 0.175, ry: 0.140, cy:  0.015, v: 0.40 }, // Dorsal start
      { z: -0.06, rx: 0.150, ry: 0.125, cy:  0.010, v: 0.56 }, // Mid body
      { z: -0.20, rx: 0.105, ry: 0.100, cy:  0.005, v: 0.72 }, // Rear taper
      { z: -0.32, rx: 0.055, ry: 0.070, cy:  0.000, v: 0.86 }, // Peduncle entry
      { z: -0.42, rx: 0.020, ry: 0.040, cy:  0.000, v: 1.00 }, // Tail base
    ];

    const NUM_SEGS = 20;
    const bodyVertices: number[] = [];
    const bodyUVs: number[] = [];
    const bodyIndices: number[] = [];

    for (let s = 0; s < stations.length; s++) {
      const st = stations[s];
      for (let i = 0; i <= NUM_SEGS; i++) {
        const theta = (i / NUM_SEGS) * Math.PI * 2;
        const cosTh = Math.cos(theta);
        const sinTh = Math.sin(theta);

        const yMod = st.ry * (cosTh < 0 ? 0.88 : 1.0);
        const xMod = st.rx * (cosTh > 0 ? 1.0 - 0.12 * cosTh * cosTh : 1.0);

        const vx = xMod * sinTh;
        const vy = st.cy + yMod * cosTh;
        const vz = st.z;

        bodyVertices.push(vx, vy, vz);
        bodyUVs.push(i / NUM_SEGS, st.v);
      }
    }

    const ringStride = NUM_SEGS + 1;
    for (let s = 0; s < stations.length - 1; s++) {
      for (let i = 0; i < NUM_SEGS; i++) {
        const v0 = s * ringStride + i;
        const v1 = s * ringStride + (i + 1);
        const v2 = (s + 1) * ringStride + (i + 1);
        const v3 = (s + 1) * ringStride + i;

        bodyIndices.push(v0, v1, v2);
        bodyIndices.push(v0, v2, v3);
      }
    }

    const bodyGeo = new THREE.BufferGeometry();
    bodyGeo.setAttribute('position', new THREE.Float32BufferAttribute(bodyVertices, 3));
    bodyGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bodyUVs, 2));
    bodyGeo.setIndex(bodyIndices);
    bodyGeo.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = false;
    meshGroup.add(bodyMesh);

    // 3. Recessed Glossy Bead Eyes with Golden Iris
    const eyeIrisMat = new THREE.MeshStandardMaterial({ color: 0xe0b840, roughness: 0.3 });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0c });

    [-1, 1].forEach(sign => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(sign * 0.115, 0.035, 0.31);

      const irisMesh = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), eyeIrisMat);
      irisMesh.scale.set(0.75, 1.0, 1.0);
      eyeGroup.add(irisMesh);

      const pupilMesh = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 8), eyePupilMat);
      pupilMesh.position.set(sign * 0.006, 0.002, 0.002);
      eyeGroup.add(pupilMesh);

      meshGroup.add(eyeGroup);

      // Cute delicate barbels / whiskers
      const barbelGeo = new THREE.CylinderGeometry(0.004, 0.001, 0.08, 4);
      barbelGeo.rotateX(Math.PI / 3);
      barbelGeo.rotateZ(-sign * Math.PI / 6);
      const barbelMesh = new THREE.Mesh(barbelGeo, finMat);
      barbelMesh.position.set(sign * 0.065, -0.035, 0.37);
      meshGroup.add(barbelMesh);
    });

    // 4. Streamlined Dorsal Fin (Along Spine)
    const dorsalGeo = new THREE.BufferGeometry();
    const dVerts = new Float32Array([
      0, 0.12,  0.12,
      0, 0.19, -0.07,
      0, 0.13, -0.24,
    ]);
    dorsalGeo.setAttribute('position', new THREE.BufferAttribute(dVerts, 3));
    dorsalGeo.computeVertexNormals();
    const dorsalFin = new THREE.Mesh(dorsalGeo, finMat);
    meshGroup.add(dorsalFin);

    // 5. Swept-back Paddle Pectoral Fins (Fluttering Pair)
    const finShape = new THREE.BufferGeometry();
    const fVerts = new Float32Array([
      0, 0, 0,
      0.19, -0.04, -0.14,
      0.16,  0.02, -0.24,
      0.08,  0.01, -0.16,
    ]);
    const fIndices = [0, 1, 2, 0, 2, 3];
    finShape.setAttribute('position', new THREE.BufferAttribute(fVerts, 3));
    finShape.setIndex(fIndices);
    finShape.computeVertexNormals();

    const leftPectoral = new THREE.Mesh(finShape, finMat);
    leftPectoral.position.set(0.14, -0.03, 0.22);
    leftPectoral.rotation.set(-0.18, 0.32, -0.38);
    meshGroup.add(leftPectoral);

    const rightPectoral = new THREE.Mesh(finShape, finMat);
    rightPectoral.position.set(-0.14, -0.03, 0.22);
    rightPectoral.scale.set(-1, 1, 1);
    rightPectoral.rotation.set(-0.18, -0.32, 0.38);
    meshGroup.add(rightPectoral);

    // 6. Articulated Tail Peduncle & Wide Billowing Butterfly Caudal Fin!
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0, -0.42); // exact tail station attachment
    meshGroup.add(tailGroup);

    // Wide butterfly tail fin spreading in X and undulating in Z
    const tailFinGeo = new THREE.BufferGeometry();
    const tVerts = new Float32Array([
      //  x,     y,     z
       0.00,  0.00,  0.00, // base join
       0.06,  0.08, -0.10,
       0.15,  0.18, -0.22, // upper lobe tip
       0.12,  0.08, -0.28,
       0.00,  0.00, -0.18, // center fork notch
      -0.12, -0.08, -0.28,
      -0.15, -0.18, -0.22, // lower lobe tip
      -0.06, -0.08, -0.10,
    ]);
    const tIndices = [
      0, 1, 2,  0, 2, 3,  0, 3, 4,
      0, 4, 5,  0, 5, 6,  0, 6, 7
    ];
    tailFinGeo.setAttribute('position', new THREE.BufferAttribute(tVerts, 3));
    tailFinGeo.setIndex(tIndices);
    tailFinGeo.computeVertexNormals();

    const caudalFin = new THREE.Mesh(tailFinGeo, finMat);
    tailGroup.add(caudalFin);

    return { meshGroup, tailGroup, leftPectoral, rightPectoral };
  }

  public update(delta: number, time: number): void {
    // 1. Update Fish Swimming Physics & Locomotion
    for (const f of this.fishes) {
      const angle = time * f.orbitSpeed + f.swimPhase;
      const wobble = Math.sin(time * f.wobbleSpeed + f.swimPhase * 2.0) * 0.85;

      const px = f.center.x + Math.cos(angle) * (f.radiusX + wobble);
      const pz = f.center.z + Math.sin(angle) * (f.radiusZ + wobble);

      const nextAngle = angle + 0.05 * Math.sign(f.orbitSpeed);
      const nextX = f.center.x + Math.cos(nextAngle) * (f.radiusX + wobble);
      const nextZ = f.center.z + Math.sin(nextAngle) * (f.radiusZ + wobble);

      const vx = nextX - px;
      const vz = nextZ - pz;
      const heading = Math.atan2(vx, vz);

      // Gentle vertical depth oscillation
      const depthSine = Math.sin(time * 0.9 + f.swimPhase);
      const py = f.baseY + depthSine * 0.10;

      if (py > 0.82 && Math.random() < 0.008) {
        this.triggerRipple(px, pz);
      }

      f.group.position.set(px, py, pz);
      f.group.rotation.y = heading;

      // Organic roll and pitch
      f.group.rotation.z = Math.sin(time * f.wagSpeed + f.swimPhase) * 0.08;
      f.group.rotation.x = Math.sin(time * 0.8 + f.swimPhase) * 0.03;

      // Dynamic butterfly caudal fin wagging
      const wag = Math.sin(time * f.wagSpeed + f.swimPhase) * 0.44;
      f.tailGroup.rotation.y = wag;

      // Fluttering pectoral fins
      const finFlutter = Math.sin(time * (f.wagSpeed * 0.65) + f.swimPhase) * 0.24;
      f.leftPectoral.rotation.y = 0.32 + finFlutter;
      f.rightPectoral.rotation.y = -0.32 - finFlutter;
    }

    // 2. Animate Water Surface Ripples
    for (const r of this.ripples) {
      if (!r.active) continue;

      r.scale += delta * 1.8;
      r.opacity -= delta * 0.65;

      if (r.opacity <= 0) {
        r.active = false;
        r.mesh.visible = false;
        r.opacity = 0;
      } else {
        r.mesh.scale.set(r.scale, 1, r.scale);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = r.opacity;
      }
    }
  }
}
