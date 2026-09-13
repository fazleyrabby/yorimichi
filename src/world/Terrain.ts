import * as THREE from 'three';
import { MaterialLibrary } from '../rendering/Materials';
import { VISUAL_CONFIG } from '../config/visual';
import { WORLD_CONFIG } from '../config/world';
import { TerrainQuery } from '../types';

export class Terrain implements TerrainQuery {
  public mesh: THREE.Mesh;
  public geometry: THREE.PlaneGeometry;
  private width: number;
  private depth: number;
  private segments: number;
  private heightData: Float32Array;

  constructor(materials: MaterialLibrary) {
    this.width = WORLD_CONFIG.size;
    this.depth = WORLD_CONFIG.size;
    this.segments = WORLD_CONFIG.segments;

    this.geometry = new THREE.PlaneGeometry(this.width, this.depth, this.segments, this.segments);
    this.geometry.rotateX(-Math.PI / 2);

    this.heightData = new Float32Array((this.segments + 1) * (this.segments + 1));
    this.generateTerrainHeightmap();
    this.applyVertexColors();

    this.mesh = new THREE.Mesh(this.geometry, materials.terrainMaterial);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
  }

  // Exact mathematical stream centerline in world coordinates
  public static getStreamCenterX(z: number): number {
    if (z < 10) {
      // From waterfall plunge pool (-8, -46.5) to bridge (2, 10)
      const t = Math.max(0, Math.min(1, (z + 46.5) / 56.5));
      return -8 * (1 - t) + 2 * t + Math.sin(t * Math.PI) * 2.8;
    } else {
      // From bridge (2, 10) smoothly curving into lake inlet at (24, 44)
      const t = Math.max(0, Math.min(1, (z - 10) / 34));
      return 2 * (1 - t) + 24 * t + Math.sin(t * Math.PI) * 2.0;
    }
  }

  // Exact water surface elevation along the stream
  public static getWaterSurfaceY(z: number): number {
    if (z <= 10) {
      const t = Math.max(0, Math.min(1, (z + 46.5) / 56.5));
      return 2.4 * (1 - t) + 1.6 * t;
    } else if (z <= 44) {
      const t = Math.max(0, Math.min(1, (z - 10) / 34));
      return 1.6 * (1 - t) + 1.0 * t;
    } else {
      return WORLD_CONFIG.water.waterLevel;
    }
  }

  // Pure mathematical elevation function
  public sampleElevation(x: number, z: number): number {
    let y = 3.4;

    // 1. Distant Northern Mountain Backdrop (pushed far back for expansive valley breathing room)
    if (z < -58) {
      const t = Math.min(Math.abs(z + 58) / 40, 1.0);
      const ridgeNoise = Math.sin(x * 0.08) * 2.2 + Math.cos(z * 0.07 + x * 0.04) * 2.0;
      y += (Math.pow(t, 1.5) * 15.0) + (t * ridgeNoise);
    }

    // Mountain Waterfall Gorge Bluff & Steep Canyon Chute (x: -8, cascading from summit z = -58 down to plunge pool z = -46.5)
    if (z <= -45.0 && z >= -60.0) {
      const wfDistX = Math.abs(x - (-8.0));
      if (wfDistX < 16.0) {
        const t = Math.min(Math.max(0, (-45.0 - z) / 13.0), 1.0);
        const sCurve = t * t * (3.0 - 2.0 * t);
        let bluffRise = sCurve * 12.6;
        y += bluffRise;

        // Open canyon chute: carve the bed so the stepped rock ledges and cascading water sit prominently above ground
        if (wfDistX < 4.8 && z >= -57.5) {
          const tZ = Math.max(0, Math.min(1.0, (-45.5 - z) / 12.0)); // 0 at plunge pool, 1 at crest
          const targetBedY = THREE.MathUtils.lerp(1.2, 14.8, Math.pow(tZ, 1.15));
          const chuteFactor = Math.cos((wfDistX / 4.8) * (Math.PI * 0.5));
          y = THREE.MathUtils.lerp(y, targetBedY, Math.pow(chuteFactor, 1.2));
        }
      }
    }

    // High Mountain Alpine Spring Ravine (flowing from distant source z = -82 forward to road culvert z = -63)
    if (z <= -62.5 && z >= -84.0) {
      const t = Math.max(0, Math.min(1.0, (-62.5 - z) / 21.5));
      const streamX = THREE.MathUtils.lerp(-8.0, -12.0, t);
      const dist = Math.abs(x - streamX);
      if (dist < 4.2) {
        const rFactor = Math.cos((dist / 4.2) * (Math.PI * 0.5));
        const streamBedY = THREE.MathUtils.lerp(15.8, 18.0, t);
        y = THREE.MathUtils.lerp(y, streamBedY, rFactor * 0.90);
      }
    }

    // Viewpoint Deck Crest Weir Hollow (under the observation platform at z = -62.5 to -57.5)
    if (z <= -57.5 && z >= -62.5) {
      const dist = Math.abs(x - (-8.0));
      if (dist < 3.8) {
        const wFactor = Math.cos((dist / 3.8) * (Math.PI * 0.5));
        y = THREE.MathUtils.lerp(y, 15.6, wFactor * 0.85);
      }
    }

    // 2. Western Foothills (pushed wide past x = -46 so sacred shrine & pagoda terrace are open and spacious)
    if (x < -46) {
      const t = Math.min(Math.abs(x + 46) / 45, 1.0);
      const hillNoise = Math.sin(z * 0.09) * 2.0 + Math.cos(x * 0.06) * 1.6;
      y += (Math.pow(t, 1.5) * 13.0) + (t * hillNoise);
    }

    // 3. Eastern gentle knolls (pushed wide past x = 44)
    if (x > 44 && z < 15) {
      const dist = Math.hypot((x - 52) * 0.08, (z + 10) * 0.08);
      y += Math.max(0, 2.2 - dist * 1.3);
    }

    // 4. Southern boundary ridges (highlands framing the grand river)
    if (z > 72) {
      const t = Math.min((z - 72) / 28, 1.0);
      const riverCenter = 26.0 + (z - 35) * 0.08;
      const distFromRiver = Math.abs(x - riverCenter);
      if (distFromRiver > 20.0) {
        const hillBlend = Math.min((distFromRiver - 20.0) / 14.0, 1.0);
        y += Math.pow(t, 1.8) * 9.0 * hillBlend;
      }
    }

    // Gentle organic meadow undulation across village terrace
    y += Math.sin(x * 0.04 + z * 0.03) * 0.40 + Math.cos(x * 0.05 - z * 0.04) * 0.30;

    // 7. Terraced plateau for Shrine (-36, -26)
    const shrineDist = Math.hypot(x - (-36), z - (-26));
    if (shrineDist < 12.0) {
      const blend = Math.cos(Math.min(shrineDist / 12.0, 1.0) * Math.PI) * 0.5 + 0.5;
      y = THREE.MathUtils.lerp(y, 6.2, blend * 0.85);
    }

    // 8. Flat Village Agora / Town Square Terrace (x: 14 to 28, z: -14 to 8)
    const plazaDist = Math.hypot(x - 21, z - (-2));
    if (plazaDist < 14.0) {
      const blend = Math.cos(Math.min(plazaDist / 14.0, 1.0) * Math.PI) * 0.5 + 0.5;
      y = THREE.MathUtils.lerp(y, 3.6, blend * 0.75);
    }

    // 9. Summit Viewpoint Plateau at (-8, -60)
    // Cradles the observation pavilion directly atop the waterfall bluff overlooking the entire valley
    // Front edge of deck is at z = -57.3; cliff drops sheerly in front of the deck!
    if (z <= -57.3) {
      const summitDist = Math.hypot(x - (-8.0), (z - (-60.2)) * 1.25);
      if (summitDist < 6.8) {
        const sFactor = Math.cos(Math.min(summitDist / 6.8, 1.0) * (Math.PI * 0.5));
        y = THREE.MathUtils.lerp(y, 16.55, Math.pow(sFactor, 0.85) * 0.95);
      }
    }

    // 10. Mountain Cycling Highway Slope Grading (Broad, natural mountain shoulders)
    const roadGrading = this.sampleMountainShoulderGrading(x, z);
    if (roadGrading.influence > 0) {
      y = THREE.MathUtils.lerp(y, roadGrading.targetY, roadGrading.influence);
    }

    // 5b. Natural Riparian Valley Grading (from bridge z = 8 down to lake delta z = 48)
    // Gently grades the surrounding terrain toward the water surface, creating lush natural banks
    if (z >= 8 && z <= 48) {
      const streamX = Terrain.getStreamCenterX(z);
      const distToStream = Math.abs(x - streamX);
      const waterY = Terrain.getWaterSurfaceY(z);
      const valleyReach = 18.0;
      if (distToStream < valleyReach) {
        const vt = Math.max(0, 1.0 - distToStream / valleyReach);
        const valleyFactor = vt * vt * (3.0 - 2.0 * vt);
        // Bank elevation target: gentle slope only 0.30m - 0.65m above the water line
        const targetBankY = waterY + 0.30 + (1.0 - vt) * 0.9;
        y = THREE.MathUtils.lerp(y, targetBankY, valleyFactor * 0.82);
      }
    }

    // 6. Continuous Uninterrupted Stream Channel Carving
    // Flows continuously from plunge pool z = -46.5 past stilt house & dock directly into the lake delta at z = 46.0
    if (z >= -46.5 && z <= 46.0) {
      const streamX = Terrain.getStreamCenterX(z);
      const distToStream = Math.abs(x - streamX);
      // River widens gracefully as it approaches the lake delta (4.8m at z=24 up to 14.0m at z=46)
      const tWiden = z > 24.0 ? Math.min(1.0, (z - 24.0) / 22.0) : 0;
      const sWiden = tWiden * tWiden * (3.0 - 2.0 * tWiden);
      const channelHalfWidth = 2.4 + sWiden * 4.6; // Full width: 4.8m to 14.0m

      if (distToStream < channelHalfWidth) {
        const waterY = Terrain.getWaterSurfaceY(z);
        const desiredBedY = waterY - 0.75; // Submerged 0.75m below water surface everywhere
        // Cubic smoothstep curve for gentle natural riverbed profile (no dry land ridges)
        const t = Math.max(0, 1.0 - distToStream / channelHalfWidth);
        const smoothFactor = t * t * (3.0 - 2.0 * t);
        const targetBed = THREE.MathUtils.lerp(y, desiredBedY, smoothFactor);
        y = Math.min(y, targetBed);
      }
    }

    // 5. Extended Southern River Basin / Grand Lake (z > 38 extending to horizon z = 100)
    if (z > 38.0) {
      const lakeCenterX = 26.0 + (z - 35) * 0.08 + Math.sin(z * 0.08) * 2.5;
      const lakeHalfW = 18.5 + Math.sin(z * 0.05) * 3.5;
      const distToLake = Math.abs(x - lakeCenterX);

      if (distToLake < lakeHalfW) {
        // Deep lake channel carving (submerged 1.2m below waterLevel 1.0)
        const factor = Math.cos((distToLake / lakeHalfW) * (Math.PI * 0.5));
        const desiredBedY = -0.2;
        // Smooth transition from river mouth (z=38) to full lake depth (z=48)
        const zBlend = Math.max(0, Math.min(1.0, (z - 38.0) / 10.0));
        const zSmooth = zBlend * zBlend * (3.0 - 2.0 * zBlend);
        const carve = Math.max(0, (y - desiredBedY) * Math.pow(factor, 0.85));
        y -= carve * zSmooth;
      }
    }

    // 6b. Waterfall Rock Chute Ravine Hollow (from deck z = -57.5 down to plunge pool z = -45.5)
    if (z >= -57.5 && z < -45.5) {
      const distCenter = Math.abs(x - (-8.0));
      if (distCenter < 4.8) {
        const tZ = Math.max(0, Math.min(1.0, (-45.5 - z) / 12.0));
        const targetBedY = THREE.MathUtils.lerp(1.2, 14.8, Math.pow(tZ, 1.15));
        const ravineFactor = Math.cos((distCenter / 4.8) * (Math.PI * 0.5));
        y = THREE.MathUtils.lerp(y, targetBedY, Math.pow(ravineFactor, 1.2));
      }
    }

    return y;
  }

  private sampleMountainShoulderGrading(x: number, z: number): { targetY: number; influence: number } {
    const westSpline = WORLD_CONFIG.roads.mountainLoopWest;
    const eastSpline = WORLD_CONFIG.roads.mountainLoopEast;

    let closestDist = 999;
    let targetY = 0;

    const testSegments = (pts?: THREE.Vector3[]) => {
      if (!pts) return;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const l2 = dx * dx + dz * dz;
        if (l2 === 0) continue;
        let t = ((x - p1.x) * dx + (z - p1.z) * dz) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = p1.x + t * dx;
        const projZ = p1.z + t * dz;
        const dist = Math.hypot(x - projX, z - projZ);
        if (dist < closestDist) {
          closestDist = dist;
          targetY = p1.y + t * (p2.y - p1.y);
        }
      }
    };

    testSegments(westSpline);
    testSegments(eastSpline);

    // Broad mountain shoulder extending 26m to create gentle, rolling verdant alpine slopes
    const flatCrestWidth = 4.2; // Perfectly flat roadbed crown (5.6m road + 1.4m flat verge)
    const slopeReach = 26.0;    // Gentle natural mountain slope rolling into the valley

    if (closestDist >= slopeReach) {
      return { targetY: 0, influence: 0 };
    }

    let influence = 0;
    if (closestDist <= flatCrestWidth) {
      // 100% flat crest under the roadbed
      influence = 1.0;
    } else {
      // Smooth cubic S-curve rolling down gracefully
      const t = (closestDist - flatCrestWidth) / (slopeReach - flatCrestWidth);
      influence = 1.0 - (t * t * (3.0 - 2.0 * t));
    }

    // Protect the waterfall canyon corridor (z in [-63.0, -45.0], |x - (-8)| < 6.2) from mountain shoulder fill
    if (z >= -63.0 && z <= -45.0 && Math.abs(x - (-8.0)) < 6.2) {
      return { targetY: 0, influence: 0 };
    }

    // Protect the stream gorge corridor from mountain shoulder fill
    if (z >= -48.0 && z <= 44.0) {
      const streamX = Terrain.getStreamCenterX(z);
      const distToStream = Math.abs(x - streamX);
      if (distToStream < 6.5) {
        const streamProtect = Math.max(0, Math.min(1, (distToStream - 2.8) / 3.7));
        influence *= (streamProtect * streamProtect);
      }
    }

    // Protect the dock approach corridor and lake shoreline from mountain shoulder fill
    const distToDock = Math.hypot(x - 25.0, z - 39.0);
    if (distToDock < 11.0) {
      const dockProtect = Math.max(0, Math.min(1, (distToDock - 3.5) / 7.5));
      influence *= (dockProtect * dockProtect);
    }

    return { targetY, influence };
  }

  private generateTerrainHeightmap(): void {
    const pos = this.geometry.attributes.position;
    const halfW = this.width / 2;
    const halfD = this.depth / 2;
    const seg = this.segments;

    let index = 0;
    for (let iz = 0; iz <= seg; iz++) {
      const z = (iz / seg) * this.depth - halfD;
      for (let ix = 0; ix <= seg; ix++) {
        const x = (ix / seg) * this.width - halfW;
        const y = this.sampleElevation(x, z);

        pos.setY(index, y);
        this.heightData[index] = y;
        index++;
      }
    }

    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  private applyVertexColors(): void {
    const pos = this.geometry.attributes.position;
    const norm = this.geometry.attributes.normal;
    const count = pos.count;
    const colors = new Float32Array(count * 3);

    const P = VISUAL_CONFIG.palette;
    const grassMeadow = new THREE.Color(P.grassMeadow);
    const grassLush = new THREE.Color(P.grassLush);
    const grassDry = new THREE.Color(P.grassDry);
    const rockCliff = new THREE.Color(P.rockCliff); // Warm limestone
    const rockMoss = new THREE.Color(P.rockMoss);
    const shoreSand = new THREE.Color(P.shoreSand);
    const dirtPath = new THREE.Color(P.dirtPath);
    const plazaStone = new THREE.Color(P.dirtPathLight); // Light flagstone plaza

    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const ny = norm.getY(i);
      const slope = Math.acos(Math.max(-1, Math.min(1, ny))); // angle with vertical

      // 1. Base meadow variation (AOE warm olive/emerald grass)
      const meadowVar = Math.sin(x * 0.15 + z * 0.12) * 0.5 + 0.5;
      tempColor.copy(grassMeadow).lerp(grassLush, meadowVar);

      // Higher dry mountain grass
      if (y > 10.0) {
        const t = Math.min((y - 10.0) / 10.0, 1.0);
        tempColor.lerp(grassDry, t * 0.5);
      }

      // 2. Steep cliff rock (Only true steep bluffs show exposed rock; slopes stay lush green)
      const roadDistForCliff = this.getDistanceToRoads(x, z);
      const cliffThreshold = roadDistForCliff < 20.0 ? 1.15 : 0.82;
      if (slope > cliffThreshold && y > 13.0) {
        const rockFactor = Math.min((slope - cliffThreshold) / 0.20, 1.0);
        tempColor.lerp(rockCliff, rockFactor * 0.75);
      } else if (slope > 0.50 && y < 5.0) {
        // Riverside slopes: lush mossy bank and earthy gravel
        const bankFactor = Math.min((slope - 0.50) / 0.30, 1.0);
        tempColor.lerp(rockMoss, bankFactor * 0.55);
      }

      // 2b. Natural Mountain Waterfall Gorge Wet Rock Face & Canyon Bed (x: -8, z in [-62, -45.0])
      if (Math.abs(x - (-8.0)) < 7.5 && z >= -62.0 && z <= -45.0) {
        const distX = Math.abs(x - (-8.0));
        const wetFactor = Math.max(0, 1.0 - distX / 7.5);
        // Rich wet rock, dark cliff stone, and lush deep moss - never dry grass!
        const wetCanyonTone = rockCliff.clone().multiplyScalar(0.65).lerp(rockMoss, 0.45);
        tempColor.lerp(wetCanyonTone, Math.pow(wetFactor, 0.8) * 0.92);
      }

      // 3. Lake and stream shoreline sand/gravel
      if (y < WORLD_CONFIG.water.waterLevel + 0.8) {
        const waterProximity = Math.max(0, 1.0 - (y - (WORLD_CONFIG.water.waterLevel - 1.2)) / 2.0);
        tempColor.lerp(shoreSand, waterProximity * 0.9);
      }

      // 4. Central Village Agora / Paved Stone Plaza (x: 21, z: -2)
      const plazaDist = Math.hypot(x - 21, z - (-2));
      if (plazaDist < 13.0) {
        const pFactor = Math.max(0, 1.0 - plazaDist / 13.0);
        // Stone flagstone texture noise
        const stoneNoise = Math.sin(x * 1.8) * Math.cos(z * 1.8) * 0.08;
        const pColor = plazaStone.clone().addScalar(stoneNoise);
        tempColor.lerp(pColor, Math.pow(pFactor, 0.7) * 0.95);
      }

      // 5. Dirt Road and Pathway Splines (blended smoothly into terrain)
      const roadDist = this.getDistanceToRoads(x, z);
      if (roadDist < 4.2) {
        const pathFactor = Math.pow(Math.max(0, 1.0 - roadDist / 4.2), 1.2);
        // Alpine mountain passes have warm crushed trail gravel; lowland roads have rich loam dirt
        const roadTone = y > 9.0 ? dirtPath.clone().lerp(plazaStone, 0.35) : dirtPath;
        tempColor.lerp(roadTone, pathFactor * 0.92);
      }

      // 6. Summit Viewpoint Terrace Flagstone Surface at (-8, -60)
      const vpDist = Math.hypot(x - (-8.0), z - (-60.0));
      if (vpDist < 7.0) {
        const vpFactor = Math.max(0, 1.0 - vpDist / 7.0);
        tempColor.lerp(plazaStone, Math.pow(vpFactor, 0.8) * 0.85);
      }

      colors[i * 3 + 0] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  private getDistanceToRoads(x: number, z: number): number {
    const roads = WORLD_CONFIG.roads;
    let minDist = 999;

    const checkSpline = (pts?: THREE.Vector3[]) => {
      if (!pts) return;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const dist = this.distToSegment(x, z, p1.x, p1.z, p2.x, p2.z);
        if (dist < minDist) minDist = dist;
      }
    };

    checkSpline(roads.mainRoad);
    checkSpline(roads.shrinePath);
    checkSpline(roads.dockPath);
    checkSpline(roads.mountainLoopWest);
    checkSpline(roads.mountainLoopEast);

    return minDist;
  }

  private distToSegment(px: number, pz: number, x1: number, z1: number, x2: number, z2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1);
    if (l2 === 0) return Math.hypot(px - x1, pz - z1);
    let t = ((px - x1) * (x2 - x1) + (pz - z1) * (z2 - z1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), pz - (z1 + t * (z2 - z1)));
  }

  // Implementation of TerrainQuery
  public getHeightAt(x: number, z: number): number {
    // 0. Check Mountain Viewpoint Deck Overlook at (-8, -60)
    const vpDx = x - (-8.0);
    const vpDz = z - (-60.0);
    if (Math.abs(vpDx) <= 3.8 && Math.abs(vpDz) <= 2.8) {
      return 16.55; // Exact timber deck plank walking elevation
    }

    // 1. Check Main Arched Stone Bridge at (2, 10)
    const brDx = x - 2.0;
    const brDz = z - 10.0;
    const brAngle = -0.14;
    const localBrX = brDx * Math.cos(-brAngle) - brDz * Math.sin(-brAngle);
    const localBrZ = brDx * Math.sin(-brAngle) + brDz * Math.cos(-brAngle);

    if (Math.abs(localBrX) <= 6.5 && Math.abs(localBrZ) <= 2.2) {
      const normX = localBrX / 6.5;
      const archRise = Math.max(0, 1.0 - normX * normX) * 0.45;
      return 3.75 + archRise;
    }

    // 2. Check Upstream Wooden Footbridge at (0.35, -19.0)
    const fbDx = x - 0.35;
    const fbDz = z - (-19.0);
    if (Math.abs(fbDx) <= 5.9 && Math.abs(fbDz) <= 1.3) {
      const normX = fbDx / 5.9;
      const archRise = Math.max(0, 1.0 - normX * normX) * 0.40;
      return 3.10 + archRise;
    }

    // 3. Check Lake Dock at (25, 42)
    const dk = WORLD_CONFIG.landmarks.dock;
    const dkDx = x - dk.position.x;
    const dkDz = z - dk.position.z;
    if (Math.abs(dkDx) <= 2.2 && Math.abs(dkDz) <= 3.8) {
      return WORLD_CONFIG.water.waterLevel + 0.32; // Exact dock deck walking height
    }

    return this.sampleElevation(x, z);
  }

  public getSurfaceNormal(x: number, z: number): THREE.Vector3 {
    const eps = 0.5;
    const hL = this.sampleElevation(x - eps, z);
    const hR = this.sampleElevation(x + eps, z);
    const hD = this.sampleElevation(x, z - eps);
    const hU = this.sampleElevation(x, z + eps);

    const normal = new THREE.Vector3(hL - hR, 2 * eps, hD - hU);
    return normal.normalize();
  }

  // ========================================================
  // NATURAL ENVIRONMENT RESTRICTIONS & PHYSICAL COLLISION
  // ========================================================
  public isWalkable(x: number, z: number): boolean {
    const limit = this.width * 0.46;
    if (Math.abs(x) > limit || Math.abs(z) > limit) return false;

    // 0. Mountain Viewpoint Deck Overlook (-8, -47)
    const vpDx = x - (-8.0);
    const vpDz = z - (-47.0);
    if (Math.abs(vpDx) <= 3.8 && Math.abs(vpDz) <= 2.8) {
      return true; // Always walkable on the observation deck
    }

    // 1. Bridges and Docks (Walkable corridors over water)
    // Main Bridge
    const brDx = x - 2.0;
    const brDz = z - 10.0;
    const brAngle = -0.14;
    const localBrX = brDx * Math.cos(-brAngle) - brDz * Math.sin(-brAngle);
    const localBrZ = brDx * Math.sin(-brAngle) + brDz * Math.cos(-brAngle);
    const isOnMainBridge = Math.abs(localBrX) <= 6.5 && Math.abs(localBrZ) <= 2.2;

    // Wooden Footbridge upstream
    const fbDx = x - 0.35;
    const fbDz = z - (-19.0);
    const isOnFootBridge = Math.abs(fbDx) <= 5.9 && Math.abs(fbDz) <= 1.3;

    // Lake Dock
    const dk = WORLD_CONFIG.landmarks.dock;
    const dkDx = x - dk.position.x;
    const dkDz = z - dk.position.z;
    const isOnDock = Math.abs(dkDx) <= 2.2 && Math.abs(dkDz) <= 3.8;

    const isOnWaterCrossing = isOnMainBridge || isOnFootBridge || isOnDock;

    // 2. Water Obstacle (Cannot walk into river or lake without a bridge or dock!)
    if (!isOnWaterCrossing) {
      // River channel
      if (z >= -58 && z <= 44) {
        const streamX = Terrain.getStreamCenterX(z);
        const distToStream = Math.abs(x - streamX);
        if (distToStream < 2.4) {
          return false; // Physical boundary: RIVER WATER
        }
      }

      // Lake basin
      const lk = WORLD_CONFIG.water.lakeCenter;
      const dxLk = (x - lk.x) / (WORLD_CONFIG.water.lakeRadiusX * 0.94);
      const dzLk = (z - lk.y) / (WORLD_CONFIG.water.lakeRadiusZ * 0.94);
      if (dxLk * dxLk + dzLk * dzLk < 1.0) {
        return false; // Physical boundary: LAKE WATER
      }
    }

    // 3. Solid Buildings & Structural Obstacles (Cannot walk through walls!)
    const solidObstacles = [
      { x: 31, z: -13, rx: 4.8, rz: 4.8 },   // Japanese Castle Tenshu
      { x: 22, z: -26, rx: 3.0, rz: 3.0 },   // North Cottage
      { x: 36, z: 6, rx: 3.0, rz: 3.0 },     // Weaver Cottage
      { x: 4.5, z: -8.0, rx: 3.4, rz: 3.4 }, // Watermill & Wheel
      { x: 16.0, z: -6.0, rx: 2.2, rz: 1.8 }, // Market Stall
      { x: -36, z: -26, rx: 3.6, rz: 3.6 },  // Hilltop Shrine
      { x: -32, z: -28, rx: 3.5, rz: 3.5 },  // Three-Tier Pagoda
      { x: 17.5, z: 38.5, rx: 3.2, rz: 2.8 }, // Waterfront Stilt House 1
      { x: 34.0, z: 42.0, rx: 3.2, rz: 2.8 }, // Waterfront Stilt House 2
      { x: -8, z: -51.0, rx: 5.2, rz: 4.0 },  // Waterfall Sheer Cliff Drop
    ];

    for (const b of solidObstacles) {
      if (Math.abs(x - b.x) < b.rx && Math.abs(z - b.z) < b.rz) {
        return false; // Physical boundary: SOLID BUILDING
      }
    }

    // 4. Mountain Cycling Road Exemption (Permit riding along graded mountain pass)
    const distToRoad = this.getDistanceToRoads(x, z);
    if (distToRoad < 3.4) {
      return true; // Graded road corridor is always passable
    }

    // 5. Sheer Cliff Slopes (Cannot scale sheer vertical rock walls)
    const normal = this.getSurfaceNormal(x, z);
    if (normal.y < 0.62 && !isOnWaterCrossing) {
      return false; // Physical boundary: SHEER CLIFF
    }

    return true;
  }
}
