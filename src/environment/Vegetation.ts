import * as THREE from 'three';
import { MaterialLibrary } from '../rendering/Materials';
import { AssetGenerator } from './AssetGenerator';
import { TerrainQuery } from '../types';
import { WORLD_CONFIG } from '../config/world';
import { ModelLoader } from '../world/ModelLoader';
import { Terrain } from '../world/Terrain';

export class VegetationSystem {
  public group: THREE.Group;
  private assetGen: AssetGenerator;
  private terrain: TerrainQuery;

  // Paths to high-fidelity Blender 3D models inspired by Age of Empires III: Definitive Edition
  private static readonly MODEL_PINE_TALL = '/models/aoe_pine_tall_01.glb';
  private static readonly MODEL_SPRUCE_MED = '/models/aoe_spruce_medium_01.glb';
  private static readonly MODEL_MAPLE_MOMIJI = '/models/aoe_japanese_maple_01.glb';
  private static readonly MODEL_SAKURA = '/models/aoe_sakura_blossom_01.glb';

  constructor(_materials: MaterialLibrary, assetGen: AssetGenerator, terrain: TerrainQuery) {
    this.assetGen = assetGen;
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.group.name = 'vegetation_system';

    this.populateWorldVegetation();
  }

  private populateWorldVegetation(): void {
    // 1. AOE3 Alpine Mountain Conifer Belts (Tall Pines & Dense Mountain Spruces)
    this.populateMountainRidgeForest();

    // 2. River Gorge, Waterfall & Cliff Bluff Conifers
    this.populateGorgeAndCliffForest();

    // 3. Japanese Scarlet Autumn Maples (Momiji) Groves
    this.populateJapaneseMaples();

    // 4. Sakura Cherry Blossom Groves (House garden, shrine sanctuary, lakeside)
    this.populateSakuraBlossoms();

    // 5. Scenic Valley & Meadow Clusters
    this.populateValleyFlora();

    // 6. Natural Understory: Flowering Bushes, Grass Tufts, and Rocks
    this.populateUnderstory();
    this.populateBoulders();
  }

  /**
   * Helper to load and place an AOE3 3D GLTF tree model
   */
  private placeTree(modelPath: string, x: number, z: number, scale: number = 1.0, rotY?: number): void {
    if (!this.isValidVegetationSpot(x, z)) return;

    const y = this.terrain.getHeightAt(x, z);
    ModelLoader.getInstance().load(modelPath).then(tree => {
      tree.position.set(x, y, z);
      tree.rotation.y = rotY !== undefined ? rotY : Math.random() * Math.PI * 2;
      tree.scale.setScalar(scale);
      this.group.add(tree);
    }).catch(err => {
      console.warn(`[VegetationSystem] Error placing tree from ${modelPath}:`, err);
    });
  }

  /**
   * 1. Dense Northern Mountain & Highland Alpine Forest
   * Emulates the tiered evergreen conifers from the AOE3 Definitive Edition reference image
   */
  private populateMountainRidgeForest(): void {
    // A. Dense Back Mountain Crests (z: -40 to -85, x: -85 to 85)
    const northernTrees = 80;
    for (let i = 0; i < northernTrees; i++) {
      const seed = i * 149.3;
      const x = -85 + (Math.sin(seed) * 0.5 + 0.5) * 170;
      const z = -32 - (Math.cos(seed * 1.37) * 0.5 + 0.5) * 55;

      const isTallPine = (i % 3 !== 0);
      const model = isTallPine ? VegetationSystem.MODEL_PINE_TALL : VegetationSystem.MODEL_SPRUCE_MED;
      const scale = 0.85 + (Math.sin(seed * 2.1) * 0.5 + 0.5) * 0.45;

      this.placeTree(model, x, z, scale, seed);
    }

    // B. Western Mountain Plateau & Castle Ridges (x: -50 to -88, z: -35 to 20)
    const westernRidgeTrees = 35;
    for (let i = 0; i < westernRidgeTrees; i++) {
      const seed = i * 83.7;
      const x = -50 - (Math.sin(seed * 1.1) * 0.5 + 0.5) * 38;
      const z = -35 + (Math.cos(seed * 1.4) * 0.5 + 0.5) * 55;

      const model = (i % 2 === 0) ? VegetationSystem.MODEL_PINE_TALL : VegetationSystem.MODEL_SPRUCE_MED;
      const scale = 0.8 + (Math.sin(seed * 1.8) * 0.5 + 0.5) * 0.4;
      this.placeTree(model, x, z, scale, seed);
    }

    // C. Eastern Highlands (x: 45 to 88, z: -35 to 25)
    const easternRidgeTrees = 30;
    for (let i = 0; i < easternRidgeTrees; i++) {
      const seed = i * 97.1;
      const x = 45 + (Math.sin(seed * 1.2) * 0.5 + 0.5) * 43;
      const z = -35 + (Math.cos(seed * 1.5) * 0.5 + 0.5) * 60;

      const model = (i % 3 === 0) ? VegetationSystem.MODEL_SPRUCE_MED : VegetationSystem.MODEL_PINE_TALL;
      const scale = 0.85 + (Math.sin(seed * 2.3) * 0.5 + 0.5) * 0.35;
      this.placeTree(model, x, z, scale, seed);
    }
  }

  /**
   * 2. River Gorge & Waterfall Bluff Conifers
   * Emulates trees clinging to cliffs and water edges as seen in AOE3
   */
  private populateGorgeAndCliffForest(): void {
    const gorgeSpots = [
      // Flanking mountain bluffs (leaving waterfall crest and viewpoint deck completely open!)
      { x: -24, z: -48, s: 1.15, m: VegetationSystem.MODEL_PINE_TALL },
      { x: -22, z: -42, s: 1.0, m: VegetationSystem.MODEL_SPRUCE_MED },
      { x: 20, z: -46, s: 1.25, m: VegetationSystem.MODEL_PINE_TALL },
      { x: 22, z: -40, s: 0.95, m: VegetationSystem.MODEL_SPRUCE_MED },
      { x: -26, z: -32, s: 1.05, m: VegetationSystem.MODEL_PINE_TALL },
      { x: 24, z: -30, s: 1.1, m: VegetationSystem.MODEL_PINE_TALL },

      // River gorge bluffs
      { x: -16, z: -38, s: 0.95, m: VegetationSystem.MODEL_SPRUCE_MED },
      { x: 12, z: -36, s: 1.15, m: VegetationSystem.MODEL_PINE_TALL },
      { x: -18, z: -26, s: 1.05, m: VegetationSystem.MODEL_PINE_TALL },
      { x: 14, z: -24, s: 0.9, m: VegetationSystem.MODEL_SPRUCE_MED },
      { x: -14, z: -12, s: 1.2, m: VegetationSystem.MODEL_PINE_TALL },
      { x: 15, z: -10, s: 1.0, m: VegetationSystem.MODEL_PINE_TALL },

      // Lake overlook bluffs
      { x: -8, z: 48, s: 1.15, m: VegetationSystem.MODEL_PINE_TALL },
      { x: -12, z: 56, s: 1.0, m: VegetationSystem.MODEL_SPRUCE_MED },
      { x: -4, z: 64, s: 1.2, m: VegetationSystem.MODEL_PINE_TALL },
      { x: 48, z: 46, s: 1.1, m: VegetationSystem.MODEL_PINE_TALL },
      { x: 44, z: 58, s: 0.95, m: VegetationSystem.MODEL_SPRUCE_MED },
      { x: 38, z: 68, s: 1.2, m: VegetationSystem.MODEL_PINE_TALL },
    ];

    gorgeSpots.forEach(g => {
      this.placeTree(g.m, g.x, g.z, g.s);
    });
  }

  /**
   * 3. Japanese Scarlet Autumn Maples (Momiji)
   * Brilliant autumn red, crimson, and amber fan canopies
   */
  private populateJapaneseMaples(): void {
    const mapleSpots = [
      // Torii gate & shrine ascent approach
      { x: -16, z: -10, s: 1.1 },
      { x: -22, z: -8, s: 0.95 },
      { x: -24, z: -18, s: 1.15 },
      { x: -30, z: -16, s: 1.05 },
      { x: -34, z: -34, s: 1.2 },

      // Castle perimeter & overlook
      { x: -32, z: -46, s: 1.1 },
      { x: -44, z: -36, s: 1.25 },
      { x: -52, z: -44, s: 1.0 },

      // Pagoda sanctuary grove
      { x: -42, z: -16, s: 1.15 },
      { x: -54, z: -26, s: 1.1 },
      { x: -44, z: -26, s: 0.9 },

      // Bridge western & eastern approaches
      { x: -8, z: 12, s: 1.0 },
      { x: 7, z: 15, s: 1.05 },
      { x: -6, z: 20, s: 1.1 },

      // Village fringe & meadow transitions
      { x: 12, z: 18, s: 1.1 },
      { x: 26, z: 16, s: 0.95 },
      { x: 36, z: -6, s: 1.15 },
      { x: 38, z: -18, s: 1.0 },
      { x: 26, z: -24, s: 1.05 },

      // Lakeside scenic spots
      { x: 6, z: 38, s: 1.1 },
      { x: 16, z: 64, s: 1.2 },
    ];

    mapleSpots.forEach(m => {
      this.placeTree(VegetationSystem.MODEL_MAPLE_MOMIJI, m.x, m.z, m.s);
    });
  }

  /**
   * 4. Japanese Sakura Cherry Blossom Trees
   * Billowing soft pink blossom clouds
   */
  private populateSakuraBlossoms(): void {
    const sakuraSpots = [
      // Shrine sanctuary sacred courtyard
      { x: -40, z: -22, s: 1.15 },
      { x: -32, z: -22, s: 1.05 },
      { x: -38, z: -32, s: 1.2 },

      // Rural house gardens
      { x: 22, z: -16, s: 1.1 },
      { x: 34, z: -16, s: 1.15 },
      { x: 36, z: -8, s: 1.0 },

      // Stream crossing & peaceful meadows
      { x: -4, z: 2, s: 1.05 },
      { x: 10, z: -4, s: 0.95 },
      { x: -14, z: 22, s: 1.1 },
      { x: 18, z: 26, s: 1.0 },

      // Lakeside dock promenade
      { x: 20, z: 42, s: 1.15 },
      { x: 30, z: 36, s: 1.05 },
    ];

    sakuraSpots.forEach(s => {
      this.placeTree(VegetationSystem.MODEL_SAKURA, s.x, s.z, s.s);
    });
  }

  /**
   * 5. Scenic Valley & Meadow Clusters
   */
  private populateValleyFlora(): void {
    const valleyPines = [
      { x: -28, z: 28, s: 1.1, m: VegetationSystem.MODEL_PINE_TALL },
      { x: -22, z: 36, s: 0.95, m: VegetationSystem.MODEL_SPRUCE_MED },
      { x: -32, z: 42, s: 1.15, m: VegetationSystem.MODEL_PINE_TALL },
      { x: 2, z: 26, s: 0.9, m: VegetationSystem.MODEL_SPRUCE_MED },
      { x: -18, z: 46, s: 1.05, m: VegetationSystem.MODEL_PINE_TALL },
    ];

    valleyPines.forEach(vp => {
      this.placeTree(vp.m, vp.x, vp.z, vp.s);
    });
  }

  /**
   * 6. Understory: Ground Cover, Wild Bushes, Flowerbeds, and Rocks
   */
  private populateUnderstory(): void {
    // Bushes scattered along forest edges and roadsides
    const bushCount = 50;
    for (let i = 0; i < bushCount; i++) {
      const seed = i * 47.1;
      const x = -60 + (Math.sin(seed) * 0.5 + 0.5) * 120;
      const z = -50 + (Math.cos(seed * 1.7) * 0.5 + 0.5) * 105;

      if (!this.isValidVegetationSpot(x, z)) continue;

      const y = this.terrain.getHeightAt(x, z);
      const isFlowering = i % 3 === 0;
      const bush = this.assetGen.createBush(isFlowering);
      bush.position.set(x, y, z);
      bush.rotation.y = seed;
      const s = 0.8 + (Math.sin(seed * 3) * 0.5 + 0.5) * 0.45;
      bush.scale.set(s, s, s);
      this.group.add(bush);
    }

    // Wild grass clumps
    const grassCount = 100;
    for (let i = 0; i < grassCount; i++) {
      const seed = i * 23.9;
      const x = -45 + (Math.sin(seed) * 0.5 + 0.5) * 90;
      const z = -35 + (Math.cos(seed * 1.5) * 0.5 + 0.5) * 80;

      if (!this.isValidVegetationSpot(x, z)) continue;

      const y = this.terrain.getHeightAt(x, z);
      const grass = this.assetGen.createGrassClump();
      grass.position.set(x, y, z);
      grass.rotation.y = seed;
      const s = 0.85 + (Math.sin(seed * 4) * 0.5 + 0.5) * 0.4;
      grass.scale.set(s, s, s);
      this.group.add(grass);
    }

    // Wildflower patches
    const flowerCount = 40;
    for (let i = 0; i < flowerCount; i++) {
      const seed = i * 31.3;
      const x = -40 + (Math.sin(seed) * 0.5 + 0.5) * 80;
      const z = -25 + (Math.cos(seed * 1.4) * 0.5 + 0.5) * 65;

      if (!this.isValidVegetationSpot(x, z)) continue;

      const y = this.terrain.getHeightAt(x, z);
      const patch = this.assetGen.createFlowerPatch(i % 2 === 0 ? 'yellow' : 'purple');
      patch.position.set(x, y, z);
      patch.rotation.y = seed;
      this.group.add(patch);
    }
  }

  private populateBoulders(): void {
    // Large mountain rocks and fallen boulders
    const boulderCoords = [
      { x: -55, z: 32, s: 'large' as const },  // Far southwest forest
      { x: -68, z: -55, s: 'large' as const }, // Far northwest peak
      { x: 32, z: -68, s: 'large' as const },  // Far northeast peak
      { x: -8, z: 52, s: 'large' as const },   // Lake south shore
      { x: 32, z: 62, s: 'medium' as const },  // Lake southeast shore
      { x: -30, z: 8, s: 'small' as const },   // Shrine grove interior
    ];

    boulderCoords.forEach((b, idx) => {
      if (this.getDistanceToRoads(b.x, b.z) < 7.0) return;
      const y = this.terrain.getHeightAt(b.x, b.z);
      const rock = this.assetGen.createRock(b.s);
      rock.position.set(b.x, y, b.z);
      rock.rotation.set(idx * 0.4, idx * 0.9, 0);
      this.group.add(rock);
    });

    // Fallen mossy logs in forest edges
    const logs = [
      { x: -24, z: 24, rot: 0.45 },
      { x: -34, z: -10, rot: -0.6 },
      { x: 16, z: 32, rot: 1.2 },
    ];

    logs.forEach(l => {
      if (this.getDistanceToRoads(l.x, l.z) < 4.0) return;
      const log = this.assetGen.createFallenLog();
      const logY = this.terrain.getHeightAt(l.x, l.z);
      log.position.set(l.x, logY, l.z);
      log.rotation.y = l.rot;
      this.group.add(log);
    });
  }

  /**
   * Environmental validation to keep roads, water, and landmark structures clear
   */
  private isValidVegetationSpot(x: number, z: number): boolean {
    // 1. Water check: avoid placing trees submerged in water or near waterline
    const groundY = this.terrain.getHeightAt(x, z);
    const waterY = Terrain.getWaterSurfaceY(z);
    if (groundY < waterY + 0.35) return false;

    // 1b. Stream Channel & Plunge Pool Corridor Exclusion
    if (z >= -48.0 && z <= 44.0) {
      const streamX = Terrain.getStreamCenterX(z);
      if (Math.abs(x - streamX) < 4.2) return false;
    }

    // 2. Main Farmhouse / Rural Estate (31, -13)
    const hPos = WORLD_CONFIG.landmarks.house.position;
    if (Math.hypot(x - hPos.x, z - hPos.z) < 8.0) return false;

    // 3. Country Cottage 2 (North Orchard: 22, -26)
    if (Math.hypot(x - 22, z - (-26)) < 7.5) return false;

    // 4. Country Cottage 3 (Village Baker: 36, 6)
    if (Math.hypot(x - 36, z - 6) < 8.0) return false;

    // 5. Golden Wheat Field & rustic split-rail fence (46, 22)
    if (x >= 39 && x <= 53 && z >= 14 && z <= 30) return false;

    // 6. Fenced Vegetable Garden (-16.0, 28.0)
    if (x >= -22 && x <= -10 && z >= 21 && z <= 35) return false;

    // 7. Shrine sanctuary (-36, -26)
    const sPos = WORLD_CONFIG.landmarks.shrine.position;
    if (Math.hypot(x - sPos.x, z - sPos.z) < 6.5) return false;

    // 8. Stone Bridge crossing (2, 10): full span & deck clearance
    const brDx = x - 2.0;
    const brDz = z - 10.0;
    if (Math.abs(brDx) <= 7.5 && Math.abs(brDz) <= 3.5) return false;

    // 9. Wooden Footbridge upstream (2.0, -19.0)
    if (Math.hypot(x - 2.0, z - (-19.0)) < 6.5) return false;

    // 10. Lake Dock (25, 42)
    const dPos = WORLD_CONFIG.landmarks.dock.position;
    if (Math.hypot(x - dPos.x, z - dPos.z) < 7.0) return false;

    // 11. Castle tenshu on mountain bluff (-42, -48)
    if (Math.hypot(x - (-42), z - (-48)) < 12.0) return false;

    // 12. Pagoda on sacred hillside (-32, -28)
    if (Math.hypot(x - (-32), z - (-28)) < 8.0) return false;

    // 13. Riverside Watermill (4.5, -8.0)
    if (Math.hypot(x - 4.5, z - (-8.0)) < 6.5) return false;

    // 14. Agora / Market Plaza (18, 0)
    if (Math.hypot(x - 19, z - 0) < 9.0) return false;

    // 15. Waterfront stilt houses
    if (Math.hypot(x - 17.5, z - 38.5) < 6.5) return false;
    if (Math.hypot(x - 34.0, z - 42.0) < 6.5) return false;

    // 16. Waterfall water cascade chute (keep the falling water path clear)
    if (Math.hypot(x - (-8), z - (-55)) < 3.6) return false;

    // 16b. Mountain Viewpoint Deck Overlook & Panoramic Vista Corridor (-8, -60)
    // Keep the observation pavilion and the southern view line overlooking the valley clear
    if (Math.hypot(x - (-8.0), z - (-60.0)) < 11.0) return false;
    if (Math.abs(x - (-8.0)) < 7.5 && z > -60.0 && z < -45.0) return false;

    // 17. Road clearance check (ensure player can easily navigate and ride bicycle)
    const distToRoad = this.getDistanceToRoads(x, z);
    if (distToRoad < 4.2) return false;

    return true;
  }

  private getDistanceToRoads(x: number, z: number): number {
    const roads = WORLD_CONFIG.roads;
    let minDist = 999;

    const checkSpline = (pts?: THREE.Vector3[]) => {
      if (!pts) return;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const l2 = (p2.x - p1.x) * (p2.x - p1.x) + (p2.z - p1.z) * (p2.z - p1.z);
        let t = ((x - p1.x) * (p2.x - p1.x) + (z - p1.z) * (p2.z - p1.z)) / l2;
        t = Math.max(0, Math.min(1, t));
        const dist = Math.hypot(x - (p1.x + t * (p2.x - p1.x)), z - (p1.z + t * (p2.z - p1.z)));
        if (dist < minDist) minDist = dist;
      }
    };

    checkSpline(roads.mainRoad);
    checkSpline(roads.shrinePath);
    checkSpline(roads.dockPath);
    checkSpline(roads.mountainLoopWest);
    checkSpline(roads.mountainLoopEast);
    checkSpline((roads as any).viewpointPath);

    return minDist;
  }
}
