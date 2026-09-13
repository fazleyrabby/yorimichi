import * as THREE from 'three';
import { MaterialLibrary } from '../rendering/Materials';
import { WORLD_CONFIG } from '../config/world';
import { TerrainQuery } from '../types';

export class RoadSystem {
  public group: THREE.Group;
  private materials: MaterialLibrary;
  private terrain: TerrainQuery;

  constructor(materials: MaterialLibrary, terrain: TerrainQuery) {
    this.materials = materials;
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.group.name = 'road_system';

    this.buildRoadRibbonMeshes();
    this.buildShrineStonePath();
    this.buildPlazaCobblestones();
    this.buildMountainRoadsideGuardrails();
  }

  // =========================================================================
  // 1. TACTILE 3D ROAD RIBBON MESHES (Crisp, High-Visibility Cycling Highway)
  // =========================================================================
  private buildRoadRibbonMeshes(): void {
    const roads = WORLD_CONFIG.roads;
    // Mountain Cycling Highway and Viewpoint Arrival path
    // (mainRoad and dockPath removed to keep stone bridge, village plaza, and dock shore clean and uncluttered)
    const pathsToBuild = [
      { pts: roads.mountainLoopWest, width: 5.6 },
      { pts: roads.mountainLoopEast, width: 5.6 },
      { pts: roads.viewpointPath, width: 3.4 },
    ];

    pathsToBuild.forEach(({ pts, width }) => {
      if (pts && pts.length >= 2) {
        this.createPathRibbon(pts, width);
      }
    });
  }

  private createPathRibbon(waypoints: THREE.Vector3[], roadWidth: number): void {
    // 1. Smooth spline curve through control waypoints
    const curve = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.25);

    // Approximate length
    let approxLen = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      approxLen += waypoints[i].distanceTo(waypoints[i + 1]);
    }

    const divisions = Math.max(24, Math.round(approxLen / 0.5));
    const hw = roadWidth * 0.5;

    const positions: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Distinct trail colors for wide country trail
    const colEdge = new THREE.Color(0x9e8c6e);   // Sandy verge / gravel shoulder
    const colShoulder = new THREE.Color(0xb5a07c); // Firm packed gravel shoulder
    const colRut = new THREE.Color(0x755b3c);    // Packed wheel ruts (darker loam)
    const colCrown = new THREE.Color(0xcbb488);  // Sunlit warm packed earth crown

    // 7 vertices across each ring for wide, realistic multi-lane tire ruts
    const offsets = [
      { u: 0.00, factor: -1.00, hOffset: 0.030, col: colEdge },
      { u: 0.16, factor: -0.72, hOffset: 0.038, col: colShoulder },
      { u: 0.32, factor: -0.42, hOffset: 0.046, col: colRut },
      { u: 0.50, factor:  0.00, hOffset: 0.056, col: colCrown },
      { u: 0.68, factor:  0.42, hOffset: 0.046, col: colRut },
      { u: 0.84, factor:  0.72, hOffset: 0.038, col: colShoulder },
      { u: 1.00, factor:  1.00, hOffset: 0.030, col: colEdge },
    ];

    const numCols = offsets.length;

    for (let i = 0; i <= divisions; i++) {
      const t = i / divisions;
      const P = curve.getPointAt(t);
      const T = curve.getTangentAt(t);

      // Tangent in horizontal plane
      const tLen = Math.hypot(T.x, T.z);
      const nx = tLen > 0.001 ? -T.z / tLen : 0;
      const nz = tLen > 0.001 ?  T.x / tLen : 1;

      // Smoothly taper road ends so they sink flush into the meadow terrain with zero abrupt vertical cuts
      let endTaper = 1.0;
      if (t < 0.04) {
        endTaper = Math.sin((t / 0.04) * (Math.PI * 0.5));
      } else if (t > 0.96) {
        endTaper = Math.sin(((1.0 - t) / 0.04) * (Math.PI * 0.5));
      }

      offsets.forEach((off) => {
        const vx = P.x + nx * (hw * off.factor);
        const vz = P.z + nz * (hw * off.factor);
        const vy = this.terrain.getHeightAt(vx, vz) + off.hOffset * endTaper;

        positions.push(vx, vy, vz);
        colors.push(off.col.r, off.col.g, off.col.b);
        uvs.push(off.u, t * (approxLen / roadWidth));
      });

      // Build quads connecting ring i with ring i + 1
      if (i < divisions) {
        const row1 = i * numCols;
        const row2 = (i + 1) * numCols;
        for (let col = 0; col < numCols - 1; col++) {
          const a = row1 + col;
          const b = row1 + col + 1;
          const c = row2 + col;
          const d = row2 + col + 1;

          indices.push(a, b, d);
          indices.push(a, d, c);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.90,
      metalness: 0.04,
      polygonOffset: true,
      polygonOffsetFactor: -1.8,
      polygonOffsetUnits: -1.8,
      side: THREE.DoubleSide,
    });

    const roadMesh = new THREE.Mesh(geo, roadMat);
    roadMesh.receiveShadow = true;
    roadMesh.castShadow = false;
    this.group.add(roadMesh);
  }

  // Granite stepping stone stairs leading up the shrine path through the Torii gate
  private buildShrineStonePath(): void {
    const shrineWaypoints = WORLD_CONFIG.roads.shrinePath;
    const steps = 28;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const pt = this.interpolatePath(shrineWaypoints, t);
      const groundY = this.terrain.getHeightAt(pt.x, pt.z);

      const stoneW = 1.45 + Math.sin(i * 1.7) * 0.15;
      const stoneL = 0.85 + Math.cos(i * 2.3) * 0.1;
      const geo = new THREE.BoxGeometry(stoneW, 0.14, stoneL);
      const stone = new THREE.Mesh(geo, this.materials.stoneGraniteMaterial);

      stone.position.set(pt.x, groundY + 0.05, pt.z);
      stone.rotation.y = Math.sin(i * 0.8) * 0.12;
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.group.add(stone);
    }
  }

  // Cobblestone curbstones and decorative pavers framing the Agora / Village Square
  private buildPlazaCobblestones(): void {
    const plazaCurbPoints = [
      new THREE.Vector3(22, 0, -6),
      new THREE.Vector3(24, 0, -8),
      new THREE.Vector3(26, 0, -10),
      new THREE.Vector3(15, 0, 4),
      new THREE.Vector3(17, 0, 5),
      new THREE.Vector3(19, 0, 6),
      new THREE.Vector3(21, 0, 5),
      new THREE.Vector3(7, 0, 8),
      new THREE.Vector3(5, 0, 9),
    ];

    plazaCurbPoints.forEach((pt, idx) => {
      const y = this.terrain.getHeightAt(pt.x, pt.z);
      const geo = new THREE.CylinderGeometry(0.42, 0.48, 0.12, 6);
      const stone = new THREE.Mesh(geo, this.materials.stoneGraniteMaterial);
      stone.position.set(pt.x, y + 0.04, pt.z);
      stone.rotation.y = idx * 0.8;
      stone.receiveShadow = true;
      stone.castShadow = true;
      this.group.add(stone);
    });
  }

  /**
   * Traditional Japanese wooden roadside safety guardrails along uphill mountain passes.
   * Installed strictly on elevated mountain roads (Y >= 7.0m) along the valley-facing drop-off shoulder.
   * Lowland and village ground roads remain wide-open without fences.
   */
  private buildMountainRoadsideGuardrails(): void {
    const roads = WORLD_CONFIG.roads;
    const paths = [
      roads.mountainLoopWest,
      roads.mountainLoopEast,
    ];

    const postGeo = new THREE.CylinderGeometry(0.10, 0.12, 0.90, 8);
    const capGeo = new THREE.BoxGeometry(0.22, 0.08, 0.22);
    const postMat = this.materials.timberDarkMaterial;
    const railMat = this.materials.timberWarmMaterial;

    paths.forEach((waypoints) => {
      if (!waypoints || waypoints.length < 2) return;
      const curve = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.25);

      let approxLen = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        approxLen += waypoints[i].distanceTo(waypoints[i + 1]);
      }

      const spacing = 2.4; // 2.4m spacing between fence posts
      const divisions = Math.max(12, Math.round(approxLen / spacing));

      interface GuardPost {
        pos: THREE.Vector3;
        tangent: THREE.Vector3;
      }
      const postSegments: GuardPost[][] = [];
      let currentSegment: GuardPost[] = [];

      for (let i = 0; i <= divisions; i++) {
        const t = i / divisions;
        const P = curve.getPointAt(t);
        const groundElevation = this.terrain.getHeightAt(P.x, P.z);

        // Only place on uphill sections (elevation >= 7.0m)
        if (groundElevation < 7.0) {
          if (currentSegment.length > 0) {
            postSegments.push(currentSegment);
            currentSegment = [];
          }
          continue;
        }

        // Keep viewpoint pavilion entrances clear (within 5.0m of pavilion center)
        const distToViewpoint = Math.hypot(P.x - (-8.0), P.z - (-60.0));
        if (distToViewpoint < 5.0) {
          if (currentSegment.length > 0) {
            postSegments.push(currentSegment);
            currentSegment = [];
          }
          continue;
        }

        const T = curve.getTangentAt(t);
        const tLen = Math.hypot(T.x, T.z);
        const nx = tLen > 0.001 ? -T.z / tLen : 0;
        const nz = tLen > 0.001 ?  T.x / tLen : 1;

        // Position on the valley-facing drop-off shoulder (road half-width 2.8m + 0.35m verge)
        const postX = P.x + nx * 3.15;
        const postZ = P.z + nz * 3.15;
        const postY = this.terrain.getHeightAt(postX, postZ);

        currentSegment.push({
          pos: new THREE.Vector3(postX, postY, postZ),
          tangent: new THREE.Vector3(T.x, 0, T.z).normalize(),
        });
      }

      if (currentSegment.length > 0) {
        postSegments.push(currentSegment);
      }

      // Build posts and horizontal timber beams for each contiguous segment
      postSegments.forEach((segment) => {
        if (segment.length === 0) return;

        // 1. Vertical cedar posts with caps
        segment.forEach(({ pos }) => {
          const post = new THREE.Mesh(postGeo, postMat);
          post.position.set(pos.x, pos.y + 0.45, pos.z);
          post.castShadow = true;
          post.receiveShadow = true;
          this.group.add(post);

          const cap = new THREE.Mesh(capGeo, railMat);
          cap.position.set(pos.x, pos.y + 0.92, pos.z);
          cap.castShadow = true;
          this.group.add(cap);
        });

        // 2. Horizontal timber guardrails spanning between adjacent posts
        for (let j = 0; j < segment.length - 1; j++) {
          const p1 = segment[j].pos;
          const p2 = segment[j + 1].pos;
          const dx = p2.x - p1.x;
          const dz = p2.z - p1.z;
          const spanLen = Math.hypot(dx, dz);
          if (spanLen > 4.5) continue; // Don't span unexpected long gaps

          const midX = (p1.x + p2.x) * 0.5;
          const midZ = (p1.z + p2.z) * 0.5;
          const angleY = Math.atan2(dx, dz);

          // Top Kasagi handrail
          const topGeo = new THREE.BoxGeometry(0.12, 0.10, spanLen);
          const topRail = new THREE.Mesh(topGeo, railMat);
          const midYTop = (p1.y + p2.y) * 0.5 + 0.74;
          topRail.position.set(midX, midYTop, midZ);
          topRail.rotation.y = angleY;
          topRail.castShadow = true;
          topRail.receiveShadow = true;
          this.group.add(topRail);

          // Lower safety crossbar
          const lowGeo = new THREE.BoxGeometry(0.08, 0.08, spanLen);
          const lowRail = new THREE.Mesh(lowGeo, postMat);
          const midYLow = (p1.y + p2.y) * 0.5 + 0.40;
          lowRail.position.set(midX, midYLow, midZ);
          lowRail.rotation.y = angleY;
          lowRail.castShadow = true;
          lowRail.receiveShadow = true;
          this.group.add(lowRail);
        }
      });
    });
  }

  private interpolatePath(pts: THREE.Vector3[], t: number): THREE.Vector3 {
    if (pts.length < 2) return pts[0];
    const segs = pts.length - 1;
    const segIndex = Math.min(Math.floor(t * segs), segs - 1);
    const segT = (t * segs) - segIndex;

    const p1 = pts[segIndex];
    const p2 = pts[segIndex + 1];

    const smoothT = (1 - Math.cos(segT * Math.PI)) * 0.5;

    return new THREE.Vector3(
      THREE.MathUtils.lerp(p1.x, p2.x, smoothT),
      0,
      THREE.MathUtils.lerp(p1.z, p2.z, smoothT)
    );
  }
}
