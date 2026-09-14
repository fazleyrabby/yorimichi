import * as THREE from 'three';
import { MaterialLibrary } from '../rendering/Materials';
import { AssetGenerator } from '../environment/AssetGenerator';
import { Terrain } from './Terrain';
import { WaterSystem } from './Water';
import { Waterfall } from './Waterfall';
import { RoadSystem } from './Roads';
import { VegetationSystem } from '../environment/Vegetation';
import { WORLD_CONFIG } from '../config/world';
import { TerrainQuery, Season } from '../types';
import { ParticleSystem } from '../rendering/Particles';
import { VISUAL_CONFIG } from '../config/visual';
import { ModelLoader } from './ModelLoader';
import { NPCSystem } from './NPCSystem';

export class World implements TerrainQuery {
  public scene: THREE.Scene;
  public materials: MaterialLibrary;
  public assetGen: AssetGenerator;
  public terrain: Terrain;
  public water: WaterSystem;
  public waterfall: Waterfall;
  public roads: RoadSystem;
  public vegetation: VegetationSystem;
  public npcs: NPCSystem;
  public particles?: ParticleSystem;
  public landmarksGroup: THREE.Group;
  public parkedBicycle!: THREE.Group;
  public bicycleBeacon!: THREE.Group;
  public bicyclePosition = new THREE.Vector3(18.5, 0, 4.0);
  public bicycleRotationY = 0.25;
  public isBicycleParked = true;
  public waterWheel?: THREE.Object3D;
  public fishingBoats: Array<{ mesh: THREE.Object3D; baseY: number; phase: number }> = [];
  private lanternLights: THREE.PointLight[] = [];

  constructor(scene: THREE.Scene, materials: MaterialLibrary, particles?: ParticleSystem) {
    this.scene = scene;
    this.materials = materials;
    this.particles = particles;
    this.assetGen = new AssetGenerator(materials);

    // 1. Handcrafted 200m x 200m Terrain
    this.terrain = new Terrain(materials);
    this.scene.add(this.terrain.mesh);

    // 2. 3D Water System (Lake & Stream)
    this.water = new WaterSystem(materials, this.assetGen, this.terrain);
    this.scene.add(this.water.group);

    // 3. Waterfall
    this.waterfall = new Waterfall(materials, this.assetGen, this.terrain);
    this.scene.add(this.waterfall.group);

    // 4. Roads & Pathways
    this.roads = new RoadSystem(materials, this.terrain);
    this.scene.add(this.roads.group);

    // 5. Landmarks (Ghibli Hamlet, Watermill, Market, Shrine, Bridges)
    this.landmarksGroup = new THREE.Group();
    this.landmarksGroup.name = 'landmarks';
    this.buildLandmarks();
    this.scene.add(this.landmarksGroup);

    // 6. Vegetation & Nature System
    this.vegetation = new VegetationSystem(materials, this.assetGen, this.terrain);
    this.scene.add(this.vegetation.group);

    // 7. Hamlet NPCs: Pedestrians, Field Workers, & Fishermen
    this.npcs = new NPCSystem(this.terrain);
    this.scene.add(this.npcs.group);
  }

  private registerChimneyFromGroup(group: THREE.Group): void {
    if (!this.particles) return;
    const chimneyAnchor = group.getObjectByName('chimney_top');
    if (chimneyAnchor) {
      const worldPos = new THREE.Vector3();
      chimneyAnchor.getWorldPosition(worldPos);
      this.particles.registerChimney(worldPos);
    }
  }

  private buildLandmarks(): void {
    const L = WORLD_CONFIG.landmarks;

    // ========================================================
    // 1. GHIBLI THATCHED COTTAGES & HAMLET RESIDENCES
    // ========================================================

    // Main Farmhouse Estate (Village Elder Residence)
    const mainFarmhouse = this.assetGen.createGhibliCottage(0);
    const mY = this.terrain.getHeightAt(31, -13);
    mainFarmhouse.position.set(31, mY, -13);
    mainFarmhouse.rotation.y = -0.22;
    this.landmarksGroup.add(mainFarmhouse);
    mainFarmhouse.updateMatrixWorld(true);
    this.registerChimneyFromGroup(mainFarmhouse);

    // Replace Main Farmhouse with Blender high-detail Rural Japanese House
    ModelLoader.getInstance().load('/models/house_rural_01.glb').then(glbHouse => {
      mainFarmhouse.visible = false;
      glbHouse.position.copy(mainFarmhouse.position);
      glbHouse.rotation.y = mainFarmhouse.rotation.y;
      this.landmarksGroup.add(glbHouse);
    }).catch(() => {});

    // Imperial Multi-Tier Japanese Castle Tenshu Keep perched atop the Northern Mountain Bluff
    const castleX = -42;
    const castleZ = -48;
    const castleY = this.terrain.getHeightAt(castleX, castleZ);
    ModelLoader.getInstance().load('/models/japanese_castle_tenshu_01.glb').then(castle => {
      castle.position.set(castleX, castleY, castleZ);
      castle.rotation.y = -Math.PI / 6;
      this.landmarksGroup.add(castle);
    }).catch(() => {});

    // Country Cottage 2 (North Orchard Cottage)
    const cottage2 = this.assetGen.createGhibliCottage(1);
    const c2Y = this.terrain.getHeightAt(22, -26);
    cottage2.position.set(22, c2Y, -26);
    cottage2.rotation.y = 0.45;
    this.landmarksGroup.add(cottage2);
    cottage2.updateMatrixWorld(true);
    this.registerChimneyFromGroup(cottage2);

    // Country Cottage 3 (Village Baker / Weaver)
    const cottage3 = this.assetGen.createGhibliCottage(2);
    const c3Y = this.terrain.getHeightAt(36, 6);
    cottage3.position.set(36, c3Y, 6);
    cottage3.rotation.y = -0.55;
    this.landmarksGroup.add(cottage3);
    cottage3.updateMatrixWorld(true);
    this.registerChimneyFromGroup(cottage3);

    // ========================================================
    // 2. RIVERSIDE WATERMILL (with active turning water wheel)
    // ========================================================
    const watermill = this.assetGen.createWatermill();
    const millX = 4.6;
    const millZ = -11.0;
    const wmY = this.terrain.getHeightAt(millX, millZ);
    watermill.position.set(millX, wmY, millZ);
    watermill.rotation.y = 0.08; // Wheel on -X flank parallel to river current
    this.landmarksGroup.add(watermill);
    watermill.updateMatrixWorld(true);
    this.registerChimneyFromGroup(watermill);
    this.waterWheel = watermill.getObjectByName('water_wheel') || undefined;

    // Replace with Blender high-detail Watermill & animated wheel
    ModelLoader.getInstance().load('/models/watermill_01.glb').then(glbMill => {
      watermill.visible = false;
      glbMill.position.copy(watermill.position);
      glbMill.rotation.y = watermill.rotation.y;
      this.landmarksGroup.add(glbMill);
      const wheel = glbMill.getObjectByName('water_wheel');
      if (wheel) this.waterWheel = wheel;
    }).catch(() => {});

    // ========================================================
    // 3. VILLAGE AGORA SQUARE, MARKET STALL, & FOUNTAIN
    // ========================================================
    const market = this.assetGen.createMarketStall();
    const mkY = this.terrain.getHeightAt(16.0, -6.0);
    market.position.set(16.0, mkY, -6.0);
    market.rotation.y = 0; // Awning faces south into the sunny square
    this.landmarksGroup.add(market);

    // Replace with Blender Agora Market Stall
    ModelLoader.getInstance().load('/models/market_stall_01.glb').then(glbStall => {
      market.visible = false;
      glbStall.position.copy(market.position);
      glbStall.rotation.y = market.rotation.y;
      this.landmarksGroup.add(glbStall);
    }).catch(() => {});

    // Blender Central Agora Stone Fountain
    ModelLoader.getInstance().load('/models/fountain_01.glb').then(fountain => {
      const fy = this.terrain.getHeightAt(24, -4);
      fountain.position.set(24, fy, -4);
      this.landmarksGroup.add(fountain);
    }).catch(() => {});

    // 2-Wheel Wooden Farm Cart in the Village Square
    const cart = this.assetGen.createVillageCart();
    const cartY = this.terrain.getHeightAt(9.0, 1.0);
    cart.position.set(9.0, cartY, 1.0);
    cart.rotation.y = 0.85;
    this.landmarksGroup.add(cart);

    // ========================================================
    // 4. AGRICULTURE: GOLDEN WHEAT FIELDS & VEGETABLE GARDENS
    // ========================================================
    // Golden Wheat Field (Pushed eastward into sunny knoll away from cycling highway)
    const wheatField = this.assetGen.createWheatField(13, 15);
    const wfY = this.terrain.getHeightAt(46, 22);
    wheatField.position.set(46, wfY, 22);
    wheatField.rotation.y = 0.12;
    this.landmarksGroup.add(wheatField);

    // Fenced Vegetable Garden (Southwest meadow, clear of mountain cycling loop)
    const vegGarden = this.assetGen.createVegetableGarden(10, 12);
    const vgY = this.terrain.getHeightAt(-16.0, 28.0);
    vegGarden.position.set(-16.0, vgY, 28.0);
    vegGarden.rotation.y = 0.05;
    this.landmarksGroup.add(vegGarden);

    // ========================================================
    // 5. RIVER BRIDGES (Arched Stone Bridge & Wooden Footbridge)
    // ========================================================
    // Main Highway Arched Stone Bridge (AOE3 high-detail Blender Model)
    const bankElevation = 3.75;
    ModelLoader.getInstance().load('/models/aoe_stone_arch_bridge_01.glb').then(stoneBridge => {
      stoneBridge.position.set(2.0, bankElevation, 10.0);
      stoneBridge.rotation.y = -0.14;
      this.landmarksGroup.add(stoneBridge);
    }).catch(() => {
      const fallback = this.assetGen.createStoneArchBridge(13.0, 4.2);
      fallback.position.set(2.0, bankElevation, 10.0);
      fallback.rotation.y = -0.14;
      this.landmarksGroup.add(fallback);
    });

    // Upstream Rustic Wooden Footbridge (AOE3 high-detail Blender Model)
    ModelLoader.getInstance().load('/models/aoe_wooden_footbridge_01.glb').then(footBridge => {
      footBridge.position.set(0.35, 3.10, -19.0);
      footBridge.rotation.y = 0.0;
      this.landmarksGroup.add(footBridge);
    }).catch(() => {
      const fallback = this.assetGen.createWoodenBridge(11.8, 2.6);
      fallback.position.set(0.35, 3.10, -19.0);
      fallback.rotation.y = 0.0;
      this.landmarksGroup.add(fallback);
    });

    // ========================================================
    // 7. SHINTO SHRINE, TORII GATE, & SACRED HILLTOP
    // ========================================================
    const shrine = this.assetGen.createShrine();
    const sY = this.terrain.getHeightAt(L.shrine.position.x, L.shrine.position.z);
    shrine.position.set(L.shrine.position.x, sY, L.shrine.position.z);
    shrine.rotation.y = L.shrine.rotationY;
    this.landmarksGroup.add(shrine);

    // Replace with Blender high-detail Pavilion Shrine
    ModelLoader.getInstance().load('/models/shrine_01.glb').then(glbShrine => {
      shrine.visible = false;
      glbShrine.position.copy(shrine.position);
      glbShrine.rotation.y = shrine.rotation.y;
      this.landmarksGroup.add(glbShrine);
    }).catch(() => {});

    // Shrine Lanterns
    const shrineLanternL = this.assetGen.createStoneLantern();
    shrineLanternL.position.set(L.shrine.position.x - 2.8, sY, L.shrine.position.z + 4.5);
    this.landmarksGroup.add(shrineLanternL);
    this.addLanternLight(L.shrine.position.x - 2.8, sY, L.shrine.position.z + 4.5);

    const shrineLanternR = this.assetGen.createStoneLantern();
    shrineLanternR.position.set(L.shrine.position.x + 2.8, sY, L.shrine.position.z + 4.5);
    this.landmarksGroup.add(shrineLanternR);
    this.addLanternLight(L.shrine.position.x + 2.8, sY, L.shrine.position.z + 4.5);

    // Torii Gate on Shrine Path
    const torii = this.assetGen.createToriiGate();
    const tY = this.terrain.getHeightAt(L.torii.position.x, L.torii.position.z);
    torii.position.set(L.torii.position.x, tY, L.torii.position.z);
    torii.rotation.y = L.torii.rotationY;
    this.landmarksGroup.add(torii);
    this.addLanternLight(L.torii.position.x, tY + 0.5, L.torii.position.z);

    // Footbridge Stone Lantern
    const fbY = this.terrain.getHeightAt(-2.5, -19.0);
    const fbLantern = this.assetGen.createStoneLantern();
    fbLantern.position.set(-2.5, fbY, -19.0);
    this.landmarksGroup.add(fbLantern);
    this.addLanternLight(-2.5, fbY, -19.0);

    // Yukimi-dōrō (Snow-viewing Lantern) at footbridge stream bank
    ModelLoader.getInstance().load('/models/aoe_yukimi_lantern_01.glb').then(lantern => {
      const y = this.terrain.getHeightAt(-2.8, -16.8);
      lantern.position.set(-2.8, y, -16.8);
      lantern.scale.setScalar(1.2);
      this.landmarksGroup.add(lantern);
      this.addLanternLight(-2.8, y + 0.4, -16.8);
    }).catch(() => {});

    // Yukimi-dōrō (Snow-viewing Lantern) at waterfall plunge pool shore
    ModelLoader.getInstance().load('/models/aoe_yukimi_lantern_01.glb').then(lantern => {
      const y = this.terrain.getHeightAt(-4.8, -45.2);
      lantern.position.set(-4.8, y, -45.2);
      lantern.scale.setScalar(1.25);
      this.landmarksGroup.add(lantern);
      this.addLanternLight(-4.8, y + 0.4, -45.2);
    }).catch(() => {});

    // Stone Bridge Approach Lantern
    const brY = this.terrain.getHeightAt(-3.5, 11.5);
    const brLantern = this.assetGen.createStoneLantern();
    brLantern.position.set(-3.5, brY, 11.5);
    this.landmarksGroup.add(brLantern);
    this.addLanternLight(-3.5, brY, 11.5);

    // Waterfront Dock Lantern
    const dkY = this.terrain.getHeightAt(22.8, 40.0);
    const dkLantern = this.assetGen.createStoneLantern();
    dkLantern.position.set(22.8, dkY, 40.0);
    this.landmarksGroup.add(dkLantern);
    this.addLanternLight(22.8, dkY, 40.0);

    // Viewpoint Deck Warm Light Overlook
    this.addLanternLight(-8.0, 16.5, -60.0);

    // Replace with Blender high-detail Vermilion Torii Gate
    ModelLoader.getInstance().load('/models/torii_01.glb').then(glbTorii => {
      torii.visible = false;
      glbTorii.position.copy(torii.position);
      glbTorii.rotation.y = torii.rotation.y;
      this.landmarksGroup.add(glbTorii);
    }).catch(() => {});

    // Imperial Three-Tier Pagoda on Sacred Hillside Terrace
    ModelLoader.getInstance().load('/models/pagoda_01.glb').then(pagoda => {
      const pY = this.terrain.getHeightAt(-32, -28);
      pagoda.position.set(-32, pY, -28);
      pagoda.rotation.y = Math.PI * 0.22;
      this.landmarksGroup.add(pagoda);
    }).catch(() => {});

    // Mountain Top Viewpoint Observation Deck (Miharashidai) at (-8, 18.2, -66)
    // High scenic cantilevered timber platform overlooking the waterfall gorge, hamlet, river, and lake
    const vpPos = WORLD_CONFIG.landmarks.mountainViewpoint.position;
    ModelLoader.getInstance().load('/models/mountain_viewpoint_deck_01.glb').then(viewDeck => {
      viewDeck.position.set(vpPos.x, vpPos.y, vpPos.z);
      viewDeck.rotation.y = 0; // Front railings face south toward the valley
      this.landmarksGroup.add(viewDeck);
    }).catch(err => {
      console.warn('[World] Failed to load mountain viewpoint deck:', err);
    });

    // Load Stratified AOE Cliff Rocks in the distant mountain gorge
    const rockLocations = [
      { x: -26, z: -72, scale: 1.2, rot: 2.4 },
      { x: 22, z: -72, scale: 1.2, rot: 0.9 },
    ];
    rockLocations.forEach(loc => {
      ModelLoader.getInstance().load('/models/cliff_rock_01.glb').then(rock => {
        const ry = this.terrain.getHeightAt(loc.x, loc.z);
        rock.position.set(loc.x, ry - 0.2, loc.z);
        rock.scale.setScalar(loc.scale);
        rock.rotation.y = loc.rot;
        this.landmarksGroup.add(rock);
      }).catch(() => {});
    });

    // AOEO Italian Cypress Trees framing the Agora Walkways and Riverbanks
    const cypressPositions = [
      { x: 7.5, z: 14.5, s: 1.05 }, // East riverbank approach south of road
      { x: 11.0, z: -8.0, s: 0.95 }, // North agora border
      { x: 26, z: -10, s: 1.0 },
      { x: 18, z: -14, s: 1.05 },
      { x: 25, z: -18, s: 0.9 },
      { x: -6.5, z: 5.5, s: 1.05 }, // West riverbank approach south of road
    ];
    cypressPositions.forEach(cp => {
      ModelLoader.getInstance().load('/models/cypress_tree_01.glb').then(tree => {
        const ty = this.terrain.getHeightAt(cp.x, cp.z);
        tree.position.set(cp.x, ty, cp.z);
        tree.scale.setScalar(cp.s);
        this.landmarksGroup.add(tree);
      }).catch(() => {});
    });

    // AOEO Trimmed Boxwood Hedge Planters framing the North Agora Border
    const planterPositions = [
      { x: 16, z: -9.5, rot: 0.0 },
      { x: 20, z: -9.5, rot: 0.0 },
      { x: 24, z: -9.5, rot: 0.0 },
    ];
    planterPositions.forEach(pp => {
      ModelLoader.getInstance().load('/models/hedge_planter_01.glb').then(planter => {
        const py = this.terrain.getHeightAt(pp.x, pp.z);
        planter.position.set(pp.x, py, pp.z);
        planter.rotation.y = pp.rot;
        this.landmarksGroup.add(planter);
      }).catch(() => {});
    });

    // Wooden Lake Dock
    const dock = this.assetGen.createWoodenDock();
    dock.position.set(L.dock.position.x, WORLD_CONFIG.water.waterLevel, L.dock.position.z);
    dock.rotation.y = L.dock.rotationY;
    this.landmarksGroup.add(dock);

    // Traditional Wooden Fishing Boats scattered along the extended river and shoreline
    const riverBoats = [
      { x: L.dock.position.x - 2.8, z: L.dock.position.z + 1.2, rot: L.dock.rotationY + 0.15, scale: 1.05 },
      { x: 15.2, z: 41.5, rot: -0.42, scale: 1.0 },
      { x: 36.2, z: 44.0, rot: 0.58, scale: 1.0 },
      { x: 23.5, z: 58.0, rot: 0.22, scale: 1.1 },
      { x: 31.0, z: 74.0, rot: -0.35, scale: 1.05 },
      { x: 21.0, z: 88.0, rot: 0.18, scale: 1.1 },
    ];

    riverBoats.forEach((rb, idx) => {
      ModelLoader.getInstance().load('/models/boat_wood_01.glb').then(boat => {
        const boatY = WORLD_CONFIG.water.waterLevel + 0.08;
        boat.position.set(rb.x, boatY, rb.z);
        boat.rotation.y = rb.rot;
        boat.scale.set(rb.scale, rb.scale, rb.scale);
        this.landmarksGroup.add(boat);
        this.fishingBoats.push({ mesh: boat, baseY: boatY, phase: idx * 1.35 });
      }).catch(() => {});
    });

    // Waterfront Japanese Stilt Houses along Lake Shore (AOE3 Fisherman Village style)
    ModelLoader.getInstance().load('/models/waterfront_stilt_house_01.glb').then(stiltHouse1 => {
      stiltHouse1.position.set(17.5, WORLD_CONFIG.water.waterLevel, 38.5);
      stiltHouse1.rotation.y = Math.PI * 0.12;
      this.landmarksGroup.add(stiltHouse1);
    }).catch(() => {});

    ModelLoader.getInstance().load('/models/waterfront_stilt_house_01.glb').then(stiltHouse2 => {
      stiltHouse2.position.set(34.0, WORLD_CONFIG.water.waterLevel, 42.0);
      stiltHouse2.rotation.y = -Math.PI * 0.35;
      this.landmarksGroup.add(stiltHouse2);
    }).catch(() => {});

    // Hillside Stone Walls
    const wall1 = this.assetGen.createStoneRetainingWall(9.5, 1.8);
    wall1.position.set(-25, this.terrain.getHeightAt(-25, -16) - 0.2, -16);
    wall1.rotation.y = Math.PI * 0.32;
    this.landmarksGroup.add(wall1);

    // ========================================================
    // 8. TRADITIONAL BICYCLE DOCKED AT VILLAGE AGORA
    // ========================================================
    this.bicyclePosition.y = this.terrain.getHeightAt(this.bicyclePosition.x, this.bicyclePosition.z);
    this.parkedBicycle = this.assetGen.createBicycleModel();
    this.parkedBicycle.position.copy(this.bicyclePosition);
    this.parkedBicycle.rotation.set(0, this.bicycleRotationY, -0.1); // Authentic kickstand lean
    this.landmarksGroup.add(this.parkedBicycle);

    // Glowing 3D Beacon Marker above the parked bicycle
    this.buildBicycleBeacon();
  }

  private buildBicycleBeacon(): void {
    this.bicycleBeacon = new THREE.Group();
    this.bicycleBeacon.name = 'bicycle_beacon';

    // 1. Floating glowing emerald diamond waypoint
    const diamondGeo = new THREE.OctahedronGeometry(0.35, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.1,
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.name = 'beacon_diamond';
    diamond.position.set(0, 2.0, 0);
    diamond.scale.set(1.0, 1.45, 1.0);
    this.bicycleBeacon.add(diamond);

    // 2. Pulsing ground aura ring
    const ringGeo = new THREE.RingGeometry(0.65, 0.95, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'beacon_ring';
    ring.position.set(0, 0.05, 0);
    this.bicycleBeacon.add(ring);

    this.bicycleBeacon.position.copy(this.bicyclePosition);
    this.landmarksGroup.add(this.bicycleBeacon);
  }

  public parkBicycleAt(pos: THREE.Vector3, rotY: number): void {
    this.isBicycleParked = true;
    this.bicyclePosition.set(pos.x, this.terrain.getHeightAt(pos.x, pos.z), pos.z);
    this.bicycleRotationY = rotY;
    this.parkedBicycle.position.copy(this.bicyclePosition);
    this.parkedBicycle.rotation.set(0, rotY, -0.1);
    const kick = this.parkedBicycle.getObjectByName('kickstand');
    if (kick) kick.rotation.z = 0.32;
    this.parkedBicycle.visible = true;

    if (this.bicycleBeacon) {
      this.bicycleBeacon.position.copy(this.bicyclePosition);
      this.bicycleBeacon.visible = true;
    }
  }

  public takeBicycle(): void {
    this.isBicycleParked = false;
    this.parkedBicycle.visible = false;
    if (this.bicycleBeacon) {
      this.bicycleBeacon.visible = false;
    }
  }

  public update(delta: number, time: number): void {
    this.materials.update(time);
    this.waterfall.update(time, delta);
    this.water.update(delta, time);
    this.npcs.update(delta, time);

    // Rotate watermill wheel with the current
    if (this.waterWheel) {
      this.waterWheel.rotation.x += delta * VISUAL_CONFIG.animation.watermillSpeed;
    }

    // Gentle nautical wave bobbing for traditional fishing boats
    for (const b of this.fishingBoats) {
      b.mesh.rotation.z = Math.sin(time * 1.4 + b.phase) * 0.04;
      b.mesh.rotation.x = Math.cos(time * 1.1 + b.phase) * 0.025;
      b.mesh.position.y = b.baseY + Math.sin(time * 1.8 + b.phase) * 0.03;
    }

    // Animate glowing bicycle beacon
    if (this.isBicycleParked && this.bicycleBeacon) {
      const diamond = this.bicycleBeacon.getObjectByName('beacon_diamond');
      if (diamond) {
        diamond.position.y = 2.0 + Math.sin(time * 3.2) * 0.18;
        diamond.rotation.y += delta * 2.2;
      }
      const ring = this.bicycleBeacon.getObjectByName('beacon_ring');
      if (ring) {
        const pulse = 1.0 + Math.sin(time * 2.8) * 0.15;
        ring.scale.set(pulse, 1.0, pulse);
      }
    }

    // Animate warm candle flicker on stone lanterns at night
    if (this.lanternLights.length > 0 && this.lanternLights[0].intensity > 0.05) {
      for (let i = 0; i < this.lanternLights.length; i++) {
        const flicker = 1.0 + Math.sin(time * 7.5 + i * 1.8) * 0.07 + Math.cos(time * 12.0 + i) * 0.04;
        this.lanternLights[i].intensity = this.currentLanternIntensity * flicker;
      }
    }
  }

  private currentLanternIntensity = 0.0;

  private addLanternLight(x: number, y: number, z: number): void {
    const light = new THREE.PointLight(0xff942c, 0.0, 13.0, 1.8);
    light.position.set(x, y + 1.6, z);
    this.landmarksGroup.add(light);
    this.lanternLights.push(light);
  }

  public setDayNightBlend(factor: number): void {
    this.currentLanternIntensity = THREE.MathUtils.clamp(factor, 0, 1) * 2.2;
    for (const light of this.lanternLights) {
      light.intensity = this.currentLanternIntensity;
    }
  }

  public setSeasonBlend(fromSeason: Season, toSeason: Season, factor: number): void {
    this.terrain.setSeasonBlend(fromSeason, toSeason, factor);
    this.vegetation.setSeasonBlend(fromSeason, toSeason, factor);
    this.materials.setSeasonBlend(fromSeason, toSeason, factor);
    this.vegetation.applySeasonToObject(this.landmarksGroup, fromSeason, toSeason, factor);
  }

  // TerrainQuery delegation
  public getHeightAt(x: number, z: number): number {
    return this.terrain.getHeightAt(x, z);
  }

  public getSurfaceNormal(x: number, z: number): THREE.Vector3 {
    return this.terrain.getSurfaceNormal(x, z);
  }

  public isWalkable(x: number, z: number): boolean {
    return this.terrain.isWalkable(x, z);
  }
}
