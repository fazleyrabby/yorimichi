import * as THREE from 'three';
import { MaterialLibrary } from '../rendering/Materials';
import { WORLD_CONFIG } from '../config/world';
import { AssetGenerator } from '../environment/AssetGenerator';
import { Terrain } from './Terrain';
import { ModelLoader } from './ModelLoader';

export class Waterfall {
  public group: THREE.Group;
  private materials: MaterialLibrary;
  private upperPoolFoam?: THREE.Mesh;
  private midFoamDisk?: THREE.Mesh;
  private lowerFoamDisk?: THREE.Mesh;
  private poolFoamDisk?: THREE.Mesh;
  private rippleRings: THREE.Mesh[] = [];

  constructor(materials: MaterialLibrary, _assetGen: AssetGenerator, _terrain: Terrain) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.name = 'natural_waterfall_gorge';

    this.buildNaturalWaterfall();
  }

  /**
   * Builds an oriented cascading water sheet or flume in exact world coordinates.
   * Uses a quadratic arc along the trajectory so the water billows out organically over rocky ledges.
   */
  private createCascadingRibbon(
    start: THREE.Vector3,
    end: THREE.Vector3,
    width: number,
    arcHeight = 0.16,
    hasSideVeils = true,
    segmentsV = 16,
    segmentsU = 6
  ): THREE.Mesh {
    const geo = new THREE.BufferGeometry();
    const dir = new THREE.Vector3().subVectors(end, start);
    const fwd = dir.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Compute width vector (perpendicular to trajectory and roughly horizontal in world)
    let side = new THREE.Vector3().crossVectors(fwd, up).normalize();
    if (side.lengthSq() < 0.001) side.set(1, 0, 0);
    // Outward facing normal vector pointing towards camera/air
    const norm = new THREE.Vector3().crossVectors(side, fwd).normalize();

    const positions: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (let iv = 0; iv <= segmentsV; iv++) {
      const v = iv / segmentsV;
      // Parabolic outward billow
      const arc = Math.sin(v * Math.PI) * arcHeight;
      const center = new THREE.Vector3().lerpVectors(start, end, v).addScaledVector(norm, arc);

      for (let iu = 0; iu <= segmentsU; iu++) {
        const u = iu / segmentsU;
        const offset = (u - 0.5) * width;
        const pt = center.clone().addScaledVector(side, offset);

        positions.push(pt.x, pt.y, pt.z);
        uvs.push(u, v);
        normals.push(norm.x, norm.y, norm.z);
      }
    }

    const stride = segmentsU + 1;
    for (let iv = 0; iv < segmentsV; iv++) {
      for (let iu = 0; iu < segmentsU; iu++) {
        const a = iv * stride + iu;
        const b = (iv + 1) * stride + iu;
        const c = (iv + 1) * stride + (iu + 1);
        const d = iv * stride + (iu + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, this.materials.waterfallMaterial);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    this.group.add(mesh);

    // Subsidiary spray veils billowing outward on the flanks
    if (hasSideVeils) {
      [-1, 1].forEach(sign => {
        const vGeo = new THREE.BufferGeometry();
        const vPos: number[] = [];
        const vUvs: number[] = [];
        const vNorms: number[] = [];
        const vIdx: number[] = [];
        const veilW = width * 0.35;
        const veilOffset = sign * (width * 0.46);

        for (let iv = 0; iv <= 8; iv++) {
          const v = iv / 8;
          const arc = Math.sin(v * Math.PI) * (arcHeight * 1.3);
          const center = new THREE.Vector3().lerpVectors(start, end, v)
            .addScaledVector(norm, arc)
            .addScaledVector(side, veilOffset + sign * (v * width * 0.22));

          for (let iu = 0; iu <= 2; iu++) {
            const u = iu / 2;
            const pt = center.clone().addScaledVector(side, (u - 0.5) * veilW);
            vPos.push(pt.x, pt.y, pt.z);
            vUvs.push(u, v);
            vNorms.push(norm.x, norm.y, norm.z);
          }
        }

        for (let iv = 0; iv < 8; iv++) {
          for (let iu = 0; iu < 2; iu++) {
            const a = iv * 3 + iu;
            const b = (iv + 1) * 3 + iu;
            const c = (iv + 1) * 3 + (iu + 1);
            const d = iv * 3 + (iu + 1);
            vIdx.push(a, b, d);
            vIdx.push(b, c, d);
          }
        }

        vGeo.setAttribute('position', new THREE.Float32BufferAttribute(vPos, 3));
        vGeo.setAttribute('uv', new THREE.Float32BufferAttribute(vUvs, 2));
        vGeo.setAttribute('normal', new THREE.Float32BufferAttribute(vNorms, 3));
        vGeo.setIndex(vIdx);
        vGeo.computeVertexNormals();

        const vMesh = new THREE.Mesh(vGeo, this.materials.waterfallMaterial);
        vMesh.castShadow = false;
        this.group.add(vMesh);
      });
    }

    return mesh;
  }

  private buildNaturalWaterfall(): void {
    const pos = WORLD_CONFIG.landmarks.waterfall.position; // (-8, 0, -55)
    const poolElevation = Terrain.getWaterSurfaceY(pos.z); // ~2.4m

    // ========================================================
    // 1. BLENDER HIGH-DETAIL ORGANIC STRATIFIED GORGE
    // ========================================================
    // Natural craggy rock cliffs, central pillar, and water-worn shelves
    ModelLoader.getInstance().load('/models/aoe_waterfall_cliff_gorge_01.glb').then(gorge => {
      gorge.position.set(pos.x, poolElevation, pos.z);
      gorge.rotation.y = 0;
      gorge.scale.set(1.0, 1.0, 1.0);
      this.group.add(gorge);
    }).catch(err => {
      console.warn('[Waterfall] Could not load cliff gorge model:', err);
    });

    // ========================================================
    // 2. HIGH ALPINE MOUNTAIN SPRING (Starts at the very back peaks!)
    // ========================================================
    // A. Distant Mountain Source Pool at (-12.0, 18.25, -80.0)
    const sourceGeo = new THREE.CircleGeometry(4.2, 28);
    sourceGeo.rotateX(-Math.PI / 2);
    const sourceMat = new THREE.MeshBasicMaterial({
      color: 0x0099cc,
      transparent: true,
      opacity: 0.90,
      depthWrite: false,
    });
    const sourceMesh = new THREE.Mesh(sourceGeo, sourceMat);
    sourceMesh.position.set(-12.0, 18.25, -80.0);
    this.group.add(sourceMesh);

    // Source pool bubbling foam disk
    const sourceFoamGeo = new THREE.RingGeometry(2.4, 4.2, 24);
    sourceFoamGeo.rotateX(-Math.PI / 2);
    const sourceFoamMat = new THREE.MeshBasicMaterial({
      color: 0xf0fdfa,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.upperPoolFoam = new THREE.Mesh(sourceFoamGeo, sourceFoamMat);
    this.upperPoolFoam.position.set(-12.0, 18.28, -80.0);
    this.group.add(this.upperPoolFoam);

    // B. High Mountain Stream Segment 1 (Dist source pool winding forward through crags)
    this.createCascadingRibbon(
      new THREE.Vector3(-12.0, 18.22, -80.0),
      new THREE.Vector3(-9.8, 17.20, -71.0),
      3.8,
      0.08,
      false,
      12,
      4
    );

    // C. High Mountain Stream Segment 2 (Winding toward mountain road culvert)
    this.createCascadingRibbon(
      new THREE.Vector3(-9.8, 17.20, -71.0),
      new THREE.Vector3(-8.0, 16.40, -63.5),
      4.2,
      0.08,
      false,
      12,
      4
    );

    // D. Culvert Passage under road and under viewpoint deck floor
    this.createCascadingRibbon(
      new THREE.Vector3(-8.0, 16.38, -63.5),
      new THREE.Vector3(-8.0, 16.15, -57.5),
      4.5,
      0.04,
      false,
      10,
      4
    );

    // ========================================================
    // 3. TIER 1: TWIN UPPER CHUTES & CENTRAL DIVIDING PILLAR
    // ========================================================
    // Crest weir lip right under the cantilevered front of the observation deck (z = -57.5)
    // Left Flume: plunging over weir lip into mid-tier shelf
    this.createCascadingRibbon(
      new THREE.Vector3(pos.x - 1.6, 16.15, -57.5),
      new THREE.Vector3(pos.x - 1.3, 11.85, -53.8),
      2.8,
      0.22,
      true,
      16,
      6
    );

    // Right Flume: plunging over weir lip into mid-tier shelf
    this.createCascadingRibbon(
      new THREE.Vector3(pos.x + 1.6, 16.15, -57.5),
      new THREE.Vector3(pos.x + 1.3, 11.85, -53.8),
      2.8,
      0.22,
      true,
      16,
      6
    );

    // Central Surging Flume: roaring over the weir lip and parting around the central dividing rock pillar
    this.createCascadingRibbon(
      new THREE.Vector3(pos.x, 16.15, -57.5),
      new THREE.Vector3(pos.x, 13.80, -55.4),
      2.6,
      0.18,
      false,
      12,
      4
    );

    // ========================================================
    // 4. MID-TIER SPLASH SHELF FOAMING TURBULENCE
    // ========================================================
    const midFoamGeo = new THREE.CircleGeometry(3.6, 28);
    midFoamGeo.rotateX(-Math.PI / 2);
    const midFoamMat = new THREE.MeshBasicMaterial({
      color: 0xf5fdfc,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    this.midFoamDisk = new THREE.Mesh(midFoamGeo, midFoamMat);
    this.midFoamDisk.position.set(pos.x, 11.88, -53.8);
    this.group.add(this.midFoamDisk);

    // ========================================================
    // 5. TIER 2: INTERMEDIATE ROARING CASCADE
    // ========================================================
    // Cascading down from mid-tier shelf to lower ledge
    this.createCascadingRibbon(
      new THREE.Vector3(pos.x, 11.82, -53.6),
      new THREE.Vector3(pos.x,  7.28, -49.8),
      5.2,
      0.26,
      true,
      18,
      6
    );

    // ========================================================
    // 6. LOWER LEDGE SPLASH SHELF FOAMING TURBULENCE
    // ========================================================
    const lowerFoamGeo = new THREE.CircleGeometry(3.8, 28);
    lowerFoamGeo.rotateX(-Math.PI / 2);
    const lowerFoamMat = new THREE.MeshBasicMaterial({
      color: 0xf5fdfc,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    });
    this.lowerFoamDisk = new THREE.Mesh(lowerFoamGeo, lowerFoamMat);
    this.lowerFoamDisk.position.set(pos.x, 7.30, -49.8);
    this.group.add(this.lowerFoamDisk);

    // ========================================================
    // 7. TIER 3: GRAND LOWER PLUNGE CASCADE
    // ========================================================
    // Plunging from lower ledge down into the deep plunge pool basin
    this.createCascadingRibbon(
      new THREE.Vector3(pos.x, 7.25, -49.6),
      new THREE.Vector3(pos.x, 2.50, -46.5),
      6.2,
      0.30,
      true,
      20,
      6
    );

    // ========================================================
    // 8. PLUNGE POOL BASIN FOAM & EXPANDING RIPPLE RINGS
    // ========================================================
    const poolFoamGeo = new THREE.CircleGeometry(4.8, 32);
    poolFoamGeo.rotateX(-Math.PI / 2);
    const poolFoamMat = new THREE.MeshBasicMaterial({
      color: 0xf6fffe,
      transparent: true,
      opacity: 0.84,
      depthWrite: false,
    });
    this.poolFoamDisk = new THREE.Mesh(poolFoamGeo, poolFoamMat);
    this.poolFoamDisk.position.set(pos.x, poolElevation + 0.10, -46.5);
    this.group.add(this.poolFoamDisk);

    // Concentric expanding splash ripple rings on plunge pool surface
    const rippleRadii = [
      { r: 2.8, zOffset: 0.0 },
      { r: 4.2, zOffset: 1.0 },
      { r: 5.6, zOffset: 2.4 },
    ];
    rippleRadii.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r.r * 0.90, r.r, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xe0f7fa,
        transparent: true,
        opacity: 0.50 - idx * 0.10,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pos.x, poolElevation + 0.06 - idx * 0.006, -46.5 + r.zOffset);
      this.group.add(ring);
      this.rippleRings.push(ring);
    });
  }

  public update(time: number, _delta: number): void {
    if (this.upperPoolFoam) {
      this.upperPoolFoam.rotation.y = time * 0.10;
    }

    if (this.midFoamDisk) {
      this.midFoamDisk.rotation.y = time * 0.16;
      const pulse = 1.0 + Math.sin(time * 2.2) * 0.024;
      this.midFoamDisk.scale.set(pulse, 1.0, pulse);
    }

    if (this.lowerFoamDisk) {
      this.lowerFoamDisk.rotation.y = -time * 0.14;
      const pulse = 1.0 + Math.sin(time * 2.0 + 1.2) * 0.022;
      this.lowerFoamDisk.scale.set(pulse, 1.0, pulse);
    }

    if (this.poolFoamDisk) {
      this.poolFoamDisk.rotation.y = time * 0.10;
      const pulse = 1.0 + Math.sin(time * 1.8) * 0.020;
      this.poolFoamDisk.scale.set(pulse, 1.0, pulse);
    }

    // Gentle expanding ripples across the small pond surface
    this.rippleRings.forEach((ring, idx) => {
      const phase = time * 0.75 + idx * 1.25;
      const expansion = 1.0 + (phase % 1.0) * 0.18;
      ring.scale.set(expansion, 1.0, expansion);
      const baseOp = idx === 0 ? 0.42 : idx === 1 ? 0.30 : 0.18;
      (ring.material as THREE.MeshBasicMaterial).opacity = baseOp * (1.0 - (phase % 1.0) * 0.55);
    });
  }
}
