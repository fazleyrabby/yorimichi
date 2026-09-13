import * as THREE from 'three';
import { MaterialLibrary } from '../rendering/Materials';
import { WORLD_CONFIG } from '../config/world';
import { AssetGenerator } from '../environment/AssetGenerator';
import { Terrain } from './Terrain';
import { KoiFishSystem } from './KoiFish';

export class WaterSystem {
  public group: THREE.Group;
  public lakeMesh: THREE.Mesh;
  public streamMesh: THREE.Mesh;
  public koiSystem: KoiFishSystem;
  private materials: MaterialLibrary;
  private assetGen: AssetGenerator;
  private terrain: Terrain;

  constructor(materials: MaterialLibrary, assetGen: AssetGenerator, terrain: Terrain) {
    this.materials = materials;
    this.assetGen = assetGen;
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.group.name = 'water_system';

    this.lakeMesh = this.buildRiverDeltaMesh();
    this.group.add(this.lakeMesh);

    this.streamMesh = this.buildStreamMesh();
    this.group.add(this.streamMesh);

    // Lively 3D Koi fish schools swimming in pond and river delta
    this.koiSystem = new KoiFishSystem();
    this.group.add(this.koiSystem.group);

    this.populateShorelineDetails();
  }

  public update(delta: number, time: number): void {
    this.koiSystem.update(delta, time);
  }

  private buildRiverDeltaMesh(): THREE.Mesh {
    const zSteps = 80;
    const xSteps = 32;
    const zStart = 40.0;
    const zEnd = 100.0;
    const y = WORLD_CONFIG.water.waterLevel;

    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let zi = 0; zi <= zSteps; zi++) {
      const zt = zi / zSteps;
      const z = zStart + zt * (zEnd - zStart);

      // Expansion from river delta (14m) to grand lake basin (37m)
      const streamX = Terrain.getStreamCenterX(z);
      const lakeCenterX = 26.0 + (z - 35) * 0.08 + Math.sin(z * 0.08) * 2.5;
      const tExpand = Math.max(0, Math.min(1.0, (z - 40.0) / 10.0));
      const sExpand = tExpand * tExpand * (3.0 - 2.0 * tExpand);

      const centerX = THREE.MathUtils.lerp(streamX, lakeCenterX, sExpand);
      const minHalfW = 7.0; // 14m wide at z=40 inlet
      const targetHalfW = 18.5 + Math.sin(z * 0.05) * 3.5;
      const halfW = THREE.MathUtils.lerp(minHalfW, targetHalfW, sExpand);

      const leftX = centerX - halfW;
      const rightX = centerX + halfW;

      for (let xi = 0; xi <= xSteps; xi++) {
        const xt = xi / xSteps;
        const x = leftX + xt * (rightX - leftX);

        vertices.push(x, y, z);
        uvs.push(xt, zt * 16.0);
      }
    }

    const rowStride = xSteps + 1;
    for (let zi = 0; zi < zSteps; zi++) {
      for (let xi = 0; xi < xSteps; xi++) {
        const row1 = zi * rowStride;
        const row2 = (zi + 1) * rowStride;

        const a = row1 + xi;
        const b = row1 + xi + 1;
        const c = row2 + xi;
        const d = row2 + xi + 1;

        // Counter-clockwise triangles viewed from above (+Y):
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, this.materials.waterMaterial);
    mesh.receiveShadow = false;
    return mesh;
  }

  private buildStreamMesh(): THREE.Mesh {
    const steps = 130;
    const xSteps = 8;
    const zStart = -46.5;    // Waterfall plunge pool basin outflow
    const zEnd = 46.0;       // Flows continuously past stilt house & dock directly into the lake delta

    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const z = zStart + t * (zEnd - zStart);
      const centerX = Terrain.getStreamCenterX(z);

      // Compute tangent along stream to get perpendicular cross-section
      const deltaZ = 0.5;
      const nextX = Terrain.getStreamCenterX(z + deltaZ);
      const dirX = nextX - centerX;
      const dirZ = deltaZ;
      const len = Math.hypot(dirX, dirZ);
      const normX = -dirZ / len;
      const normZ = dirX / len;

      // Stream widens naturally from 4.0m to 14.0m as it approaches and enters the lake delta
      const tWiden = z > 24.0 ? Math.min(1.0, (z - 24.0) / 22.0) : 0;
      const sWiden = tWiden * tWiden * (3.0 - 2.0 * tWiden);
      const streamWidth = 4.2 + sWiden * 9.8;
      const waterSurfaceY = Terrain.getWaterSurfaceY(z);

      for (let xi = 0; xi <= xSteps; xi++) {
        const xt = xi / xSteps;
        const offset = (xt - 0.5) * streamWidth;
        const x = centerX + normX * offset;
        const zPos = z + normZ * offset;

        vertices.push(x, waterSurfaceY, zPos);
        uvs.push(xt, t * 24.0);
      }
    }

    const rowStride = xSteps + 1;
    for (let i = 0; i < steps; i++) {
      for (let xi = 0; xi < xSteps; xi++) {
        const r1 = i * rowStride;
        const r2 = (i + 1) * rowStride;
        const a = r1 + xi;
        const b = r1 + xi + 1;
        const c = r2 + xi;
        const d = r2 + xi + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, this.materials.waterMaterial);
    mesh.receiveShadow = false; // Prevent shadow acne
    return mesh;
  }

  private populateShorelineDetails(): void {
    const lk = WORLD_CONFIG.water.lakeCenter;
    const y = WORLD_CONFIG.water.waterLevel;

    // Shoreline rocks around lake perimeter
    const rockAngles = [0.3, 0.9, 1.6, 2.3, 3.1, 3.8, 4.6, 5.4];
    rockAngles.forEach(angle => {
      const rx = WORLD_CONFIG.water.lakeRadiusX + 0.5;
      const rz = WORLD_CONFIG.water.lakeRadiusZ + 0.5;
      const x = lk.x + Math.cos(angle) * rx;
      const z = lk.y + Math.sin(angle) * rz;

      const shoreRock = this.assetGen.createShoreRock();
      shoreRock.position.set(x, y + 0.15, z);
      shoreRock.rotation.y = angle * 2.0;
      shoreRock.scale.set(0.85 + Math.random() * 0.3, 0.65, 0.85 + Math.random() * 0.3);
      this.group.add(shoreRock);

      // Reeds near shore rocks
      if (Math.random() > 0.25) {
        const reeds = this.assetGen.createReeds();
        reeds.position.set(x + Math.sin(angle) * 1.4, y + 0.1, z + Math.cos(angle) * 1.4);
        this.group.add(reeds);
      }
    });

    // Reeds and river rocks along stream banks
    const streamSamples = [-42, -22, -4, 16];
    streamSamples.forEach(z => {
      const cx = Terrain.getStreamCenterX(z);
      const sy = this.terrain.sampleElevation(cx, z);

      // Left bank rock
      const r1 = this.assetGen.createRock('small');
      r1.position.set(cx - 2.5, sy + 0.25, z);
      this.group.add(r1);

      // Right bank reeds
      const reeds = this.assetGen.createReeds();
      reeds.position.set(cx + 2.4, sy + 0.2, z + 0.8);
      this.group.add(reeds);
    });
  }
}
