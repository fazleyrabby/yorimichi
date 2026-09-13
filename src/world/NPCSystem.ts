import * as THREE from 'three';
import { TerrainQuery } from '../types';

export type NPCType = 'farmer' | 'gardener' | 'fisherman_dock' | 'fisherman_boat' | 'pedestrian_bridge' | 'pedestrian_market' | 'traveler_monk';

interface Waypoint {
  x: number;
  z: number;
  pauseTime?: number;
}

interface NPCInstance {
  id: string;
  type: NPCType;
  group: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  torso: THREE.Mesh;
  toolMesh?: THREE.Object3D;
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  speed: number;
  walkCycle: number;
  workCycle: number;
  pauseTimer: number;
  heading: number;
  isStationary: boolean;
}

export class NPCSystem {
  public group: THREE.Group;
  private npcs: NPCInstance[] = [];
  private terrain: TerrainQuery;

  constructor(terrain: TerrainQuery) {
    this.group = new THREE.Group();
    this.group.name = 'npc_crowd_system';
    this.terrain = terrain;

    this.spawnVillagers();
  }

  private spawnVillagers(): void {
    // 1. Farmer in Wheat Field
    this.createFarmer();

    // 2. Gardener in Vegetable Garden
    this.createGardener();

    // 3. Fisherman on the Wooden Pier
    this.createFishermanDock();

    // 4. Fisherman in Moored River Boat
    this.createFishermanBoat();

    // 5. Pedestrian Crossing the Stone Arch Bridge
    this.createBridgePedestrian();

    // 6. Market Stroller in the Agora Square
    this.createMarketPedestrian();

    // 7. Mountain Pilgrim / Traveler crossing Wooden Footbridge
    this.createMountainTraveler();
  }

  // ========================================================
  // CHARACTER BUILDER & PROPS
  // ========================================================

  private buildCharacter(config: {
    tunicColor: number;
    pantsColor: number;
    skinColor?: number;
    hatType: 'kasa' | 'bandana' | 'headband' | 'none';
    hatColor?: number;
    propType: 'hoe' | 'fishing_pole' | 'staff' | 'basket' | 'satchel' | 'none';
    scale?: number;
  }): {
    group: THREE.Group;
    bodyGroup: THREE.Group;
    headGroup: THREE.Group;
    leftArmGroup: THREE.Group;
    rightArmGroup: THREE.Group;
    leftLegGroup: THREE.Group;
    rightLegGroup: THREE.Group;
    torso: THREE.Mesh;
    toolMesh?: THREE.Object3D;
  } {
    const root = new THREE.Group();
    const s = config.scale || 1.0;
    root.scale.set(s, s, s);

    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    const skinMat = new THREE.MeshStandardMaterial({
      color: config.skinColor || 0xfce4cd,
      roughness: 0.72,
      metalness: 0.0,
      flatShading: true,
    });

    const tunicMat = new THREE.MeshStandardMaterial({
      color: config.tunicColor,
      roughness: 0.84,
      metalness: 0.04,
      flatShading: true,
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: config.pantsColor,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: true,
    });

    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.75,
      metalness: 0.05,
      flatShading: true,
    });

    // 1. Torso
    const torsoGeo = new THREE.CylinderGeometry(0.36, 0.48, 0.88, 8);
    const torso = new THREE.Mesh(torsoGeo, tunicMat);
    torso.position.y = 1.12;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Sash / Belt
    const obiGeo = new THREE.CylinderGeometry(0.42, 0.44, 0.18, 8);
    const obiMat = new THREE.MeshStandardMaterial({
      color: 0x242424,
      roughness: 0.8,
      flatShading: true,
    });
    const obi = new THREE.Mesh(obiGeo, obiMat);
    obi.position.y = 0.92;
    bodyGroup.add(obi);

    // 2. Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.72, 0);

    const headGeo = new THREE.SphereGeometry(0.26, 8, 8);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Eyes
    [-0.08, 0.08].forEach(ex => {
      const eyeGeo = new THREE.SphereGeometry(0.025, 4, 4);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x181818 });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(ex, 0.02, 0.24);
      headGroup.add(eye);
    });

    // Headwear
    if (config.hatType === 'kasa') {
      const kasaGeo = new THREE.ConeGeometry(0.85, 0.32, 14);
      const kasaMat = new THREE.MeshStandardMaterial({
        color: config.hatColor || 0xdeba82,
        roughness: 0.82,
        metalness: 0.04,
        flatShading: true,
      });
      const kasa = new THREE.Mesh(kasaGeo, kasaMat);
      kasa.position.set(0, 0.16, 0);
      kasa.rotation.x = -0.06;
      kasa.castShadow = true;
      headGroup.add(kasa);
    } else if (config.hatType === 'bandana' || config.hatType === 'headband') {
      const bandGeo = new THREE.TorusGeometry(0.28, 0.045, 5, 12);
      bandGeo.rotateX(Math.PI / 2);
      const bandMat = new THREE.MeshStandardMaterial({
        color: config.hatColor || 0x9b382c,
        roughness: 0.7,
        flatShading: true,
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.set(0, 0.08, 0);
      headGroup.add(band);
    }

    bodyGroup.add(headGroup);

    // 3. Articulated Arms (Pivoted at Shoulders)
    const armGeo = new THREE.CylinderGeometry(0.10, 0.11, 0.62, 6);
    armGeo.translate(0, -0.31, 0); // shift pivot to top shoulder

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(0.48, 1.35, 0);
    const leftArm = new THREE.Mesh(armGeo, tunicMat);
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);
    bodyGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-0.48, 1.35, 0);
    const rightArm = new THREE.Mesh(armGeo, tunicMat);
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);
    bodyGroup.add(rightArmGroup);

    // 4. Articulated Legs (Pivoted at Hips)
    const legGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.72, 6);
    legGeo.translate(0, -0.36, 0); // shift pivot to hip

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(0.22, 0.74, 0);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.castShadow = true;
    leftLegGroup.add(leftLeg);
    bodyGroup.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(-0.22, 0.74, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.castShadow = true;
    rightLegGroup.add(rightLeg);
    bodyGroup.add(rightLegGroup);

    // 5. Props & Handheld Tools
    let toolMesh: THREE.Object3D | undefined;

    if (config.propType === 'hoe') {
      const hoeGroup = new THREE.Group();
      // Wooden shaft
      const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.35, 6);
      const shaft = new THREE.Mesh(shaftGeo, darkWoodMat);
      shaft.position.set(0, -0.25, 0.35);
      shaft.rotation.x = Math.PI / 4;
      hoeGroup.add(shaft);

      // Iron blade
      const bladeGeo = new THREE.BoxGeometry(0.18, 0.22, 0.04);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x484c50,
        roughness: 0.45,
        metalness: 0.7,
      });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(0, -0.65, 0.78);
      blade.rotation.x = -Math.PI / 5;
      hoeGroup.add(blade);

      rightArmGroup.add(hoeGroup);
      toolMesh = hoeGroup;
    } else if (config.propType === 'fishing_pole') {
      const poleGroup = new THREE.Group();
      // Long tapered bamboo rod
      const rodGeo = new THREE.CylinderGeometry(0.015, 0.035, 3.4, 6);
      rodGeo.translate(0, 1.7, 0);
      const rodMat = new THREE.MeshStandardMaterial({
        color: 0xcca35a,
        roughness: 0.6,
        metalness: 0.05,
      });
      const rod = new THREE.Mesh(rodGeo, rodMat);
      rod.position.set(0, -0.2, 0.1);
      rod.rotation.x = -Math.PI * 0.38; // angled forward out over water
      poleGroup.add(rod);

      // Filament Line dipping down from rod tip
      const lineGeo = new THREE.BufferGeometry();
      const lineVerts = new Float32Array([
        0, 1.7, 2.8,   // rod tip in local pole space
        0, -0.9, 3.4,  // water entry point
      ]);
      lineGeo.setAttribute('position', new THREE.BufferAttribute(lineVerts, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.65,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      poleGroup.add(line);

      rightArmGroup.add(poleGroup);
      toolMesh = poleGroup;
    } else if (config.propType === 'staff') {
      const staffGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6);
      const staff = new THREE.Mesh(staffGeo, darkWoodMat);
      staff.position.set(-0.15, -0.15, 0.35);
      staff.rotation.x = 0.1;
      rightArmGroup.add(staff);
      toolMesh = staff;
    } else if (config.propType === 'basket') {
      const basketGeo = new THREE.CylinderGeometry(0.32, 0.24, 0.38, 8);
      const basketMat = new THREE.MeshStandardMaterial({
        color: 0x9c7a4d,
        roughness: 0.85,
        flatShading: true,
      });
      const basket = new THREE.Mesh(basketGeo, basketMat);
      basket.position.set(0.65, 0.2, 0.2);
      root.add(basket);
      toolMesh = basket;
    } else if (config.propType === 'satchel') {
      const bagGeo = new THREE.BoxGeometry(0.36, 0.42, 0.22);
      const bagMat = new THREE.MeshStandardMaterial({
        color: 0x825432,
        roughness: 0.8,
        flatShading: true,
      });
      const bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(0.32, 1.05, -0.18);
      bag.rotation.set(0.1, -0.2, 0.15);
      bodyGroup.add(bag);
    }

    return {
      group: root,
      bodyGroup,
      headGroup,
      leftArmGroup,
      rightArmGroup,
      leftLegGroup,
      rightLegGroup,
      torso,
      toolMesh,
    };
  }

  // ========================================================
  // SPECIFIC VILLAGER IMPLEMENTATIONS
  // ========================================================

  private createFarmer(): void {
    const char = this.buildCharacter({
      tunicColor: 0x2d4661, // Indigo blue farmer tunic
      pantsColor: 0xe8e4dc, // Off-white field trousers
      hatType: 'kasa',
      propType: 'hoe',
      scale: 1.0,
    });

    const startPos = new THREE.Vector3(38.5, 0, 26.5);
    startPos.y = this.terrain.getHeightAt(startPos.x, startPos.z);
    char.group.position.copy(startPos);
    char.group.rotation.y = -Math.PI * 0.45;

    this.group.add(char.group);

    this.npcs.push({
      id: 'farmer_wheat',
      type: 'farmer',
      ...char,
      waypoints: [
        { x: 38.5, z: 26.5, pauseTime: 12 },
        { x: 39.8, z: 27.2, pauseTime: 10 },
        { x: 37.5, z: 28.0, pauseTime: 14 },
      ],
      currentWaypointIndex: 0,
      currentPos: startPos.clone(),
      targetPos: startPos.clone(),
      speed: 1.0,
      walkCycle: 0,
      workCycle: 0,
      pauseTimer: 12,
      heading: -Math.PI * 0.45,
      isStationary: false,
    });
  }

  private createGardener(): void {
    const char = this.buildCharacter({
      tunicColor: 0x486b46, // Earthy sage green
      pantsColor: 0x364835, // Forest olive pants
      hatType: 'kasa',
      propType: 'basket',
      scale: 0.96,
    });

    const startPos = new THREE.Vector3(-16.0, 0, 28.0);
    startPos.y = this.terrain.getHeightAt(startPos.x, startPos.z);
    char.group.position.copy(startPos);
    char.group.rotation.y = Math.PI * 0.5;

    this.group.add(char.group);

    this.npcs.push({
      id: 'gardener_cabbage',
      type: 'gardener',
      ...char,
      waypoints: [
        { x: -16.0, z: 28.0, pauseTime: 14 },
        { x: -17.5, z: 26.5, pauseTime: 12 },
        { x: -14.5, z: 29.5, pauseTime: 15 },
      ],
      currentWaypointIndex: 0,
      currentPos: startPos.clone(),
      targetPos: startPos.clone(),
      speed: 0.9,
      walkCycle: 0,
      workCycle: 0,
      pauseTimer: 14,
      heading: Math.PI * 0.5,
      isStationary: false,
    });
  }

  private createFishermanDock(): void {
    const char = this.buildCharacter({
      tunicColor: 0x8a7a65, // Weathered flax linen
      pantsColor: 0x323a42, // Rolled charcoal trousers
      hatType: 'bandana',
      hatColor: 0xa8382c,   // Red headband
      propType: 'fishing_pole',
      scale: 1.02,
    });

    // Standing at the forward edge of the wooden pier, facing the water
    const startPos = new THREE.Vector3(26.6, 1.42, 44.2);
    char.group.position.copy(startPos);
    char.group.rotation.y = Math.PI * 0.15; // Facing into the river/lake

    this.group.add(char.group);

    this.npcs.push({
      id: 'fisherman_dock',
      type: 'fisherman_dock',
      ...char,
      waypoints: [{ x: 26.6, z: 44.2 }],
      currentWaypointIndex: 0,
      currentPos: startPos.clone(),
      targetPos: startPos.clone(),
      speed: 0,
      walkCycle: 0,
      workCycle: 0,
      pauseTimer: 999999,
      heading: Math.PI * 0.15,
      isStationary: true,
    });
  }

  private createFishermanBoat(): void {
    const char = this.buildCharacter({
      tunicColor: 0x5a6369, // Grey fisherman smock
      pantsColor: 0x2a3338,
      hatType: 'kasa',
      propType: 'fishing_pole',
      scale: 0.95,
    });

    // Seated in the wooden boat moored beside the wooden dock (x: 22.2, z: 43.2)
    const startPos = new THREE.Vector3(22.2, 1.08, 43.2);
    char.group.position.copy(startPos);
    char.group.rotation.y = 0.25;

    // Seated pose (bend hips and knees)
    char.leftLegGroup.rotation.x = Math.PI * 0.42;
    char.rightLegGroup.rotation.x = Math.PI * 0.42;
    char.torso.position.y = 0.95;

    this.group.add(char.group);

    this.npcs.push({
      id: 'fisherman_boat',
      type: 'fisherman_boat',
      ...char,
      waypoints: [{ x: 22.2, z: 43.2 }],
      currentWaypointIndex: 0,
      currentPos: startPos.clone(),
      targetPos: startPos.clone(),
      speed: 0,
      walkCycle: 0,
      workCycle: 0,
      pauseTimer: 999999,
      heading: 0.25,
      isStationary: true,
    });
  }

  private createBridgePedestrian(): void {
    const char = this.buildCharacter({
      tunicColor: 0xb54336, // Terracotta red kimono tunic
      pantsColor: 0xf5f0e6, // Ivory hakama pants
      hatType: 'none',
      propType: 'none',
      scale: 1.0,
    });

    const p1 = { x: 10.5, z: 11.2, pauseTime: 2.5 };
    const p2 = { x: -6.5, z: 8.8, pauseTime: 2.5 };

    const startPos = new THREE.Vector3(p1.x, 0, p1.z);
    startPos.y = this.terrain.getHeightAt(startPos.x, startPos.z);
    char.group.position.copy(startPos);

    this.group.add(char.group);

    this.npcs.push({
      id: 'pedestrian_bridge',
      type: 'pedestrian_bridge',
      ...char,
      waypoints: [p1, p2],
      currentWaypointIndex: 1,
      currentPos: startPos.clone(),
      targetPos: new THREE.Vector3(p2.x, 0, p2.z),
      speed: 1.9,
      walkCycle: 0,
      workCycle: 0,
      pauseTimer: 0,
      heading: Math.atan2(p2.x - p1.x, p2.z - p1.z),
      isStationary: false,
    });
  }

  private createMarketPedestrian(): void {
    const char = this.buildCharacter({
      tunicColor: 0xd49539, // Warm honey-amber tunic
      pantsColor: 0x3d2818, // Brown trousers
      hatType: 'kasa',
      propType: 'satchel',
      scale: 0.98,
    });

    const waypoints: Waypoint[] = [
      { x: 19.5, z: 3.5, pauseTime: 4.5 },  // Looking at market stall goods
      { x: 21.0, z: -0.5, pauseTime: 5.0 }, // Pausing beside the stone fountain
      { x: 15.0, z: 5.5, pauseTime: 4.0 },  // Checking farm cart produce
    ];

    const startPos = new THREE.Vector3(waypoints[0].x, 0, waypoints[0].z);
    startPos.y = this.terrain.getHeightAt(startPos.x, startPos.z);
    char.group.position.copy(startPos);

    this.group.add(char.group);

    this.npcs.push({
      id: 'pedestrian_market',
      type: 'pedestrian_market',
      ...char,
      waypoints,
      currentWaypointIndex: 1,
      currentPos: startPos.clone(),
      targetPos: new THREE.Vector3(waypoints[1].x, 0, waypoints[1].z),
      speed: 1.6,
      walkCycle: 0,
      workCycle: 0,
      pauseTimer: waypoints[0].pauseTime || 0,
      heading: 0,
      isStationary: false,
    });
  }

  private createMountainTraveler(): void {
    const char = this.buildCharacter({
      tunicColor: 0xded8cc, // Unbleached linen monk / pilgrim robe
      pantsColor: 0x8a7a68,
      hatType: 'kasa',
      propType: 'staff',
      scale: 1.02,
    });

    const waypoints: Waypoint[] = [
      { x: 4.5, z: -12.5, pauseTime: 3.0 }, // Near Watermill
      { x: 0.5, z: -19.0, pauseTime: 1.5 }, // On Wooden Footbridge
      { x: -5.5, z: -23.0, pauseTime: 3.5 }, // Trail ascending to Shrine
    ];

    const startPos = new THREE.Vector3(waypoints[0].x, 0, waypoints[0].z);
    startPos.y = this.terrain.getHeightAt(startPos.x, startPos.z);
    char.group.position.copy(startPos);

    this.group.add(char.group);

    this.npcs.push({
      id: 'traveler_monk',
      type: 'traveler_monk',
      ...char,
      waypoints,
      currentWaypointIndex: 1,
      currentPos: startPos.clone(),
      targetPos: new THREE.Vector3(waypoints[1].x, 0, waypoints[1].z),
      speed: 1.7,
      walkCycle: 0,
      workCycle: 0,
      pauseTimer: 0,
      heading: 0,
      isStationary: false,
    });
  }

  // ========================================================
  // ANIMATION & BEHAVIOR UPDATES
  // ========================================================

  public update(delta: number, time: number): void {
    for (const npc of this.npcs) {
      if (npc.type === 'farmer') {
        this.updateFarmer(npc, delta, time);
      } else if (npc.type === 'gardener') {
        this.updateGardener(npc, delta, time);
      } else if (npc.type === 'fisherman_dock') {
        this.updateFishermanDock(npc, delta, time);
      } else if (npc.type === 'fisherman_boat') {
        this.updateFishermanBoat(npc, delta, time);
      } else {
        // Walking Pedestrian
        this.updatePedestrian(npc, delta, time);
      }
    }
  }

  private updateFarmer(npc: NPCInstance, delta: number, time: number): void {
    // If pausing at a spot, perform hoeing farming labor
    if (npc.pauseTimer > 0) {
      npc.pauseTimer -= delta;
      npc.workCycle += delta * 3.8;

      const hoeStroke = Math.sin(npc.workCycle);
      const isSwinging = hoeStroke > 0;

      // Arm swing with hoe
      npc.rightArmGroup.rotation.x = isSwinging ? 0.95 + hoeStroke * 0.45 : -0.2;
      npc.leftArmGroup.rotation.x = isSwinging ? 0.75 + hoeStroke * 0.35 : -0.1;

      // Torso rhythmically pitching forward into the stroke
      npc.torso.rotation.x = isSwinging ? 0.22 + hoeStroke * 0.12 : 0.05;
      npc.headGroup.rotation.x = isSwinging ? 0.18 + hoeStroke * 0.08 : 0.0;

      // Legs stationary in wide stance
      npc.leftLegGroup.rotation.x = 0.12;
      npc.rightLegGroup.rotation.x = -0.15;
    } else {
      // Walk to next furrow / crop row
      this.advanceWaypointPath(npc, delta, time);
    }
  }

  private updateGardener(npc: NPCInstance, delta: number, time: number): void {
    if (npc.pauseTimer > 0) {
      npc.pauseTimer -= delta;
      npc.workCycle += delta * 2.2;

      // Crouch tending cabbage
      const crouchPhase = Math.sin(npc.workCycle * 0.5);
      const isCrouching = crouchPhase > -0.2;

      if (isCrouching) {
        npc.bodyGroup.position.y = -0.28;
        npc.leftLegGroup.rotation.x = 0.75;
        npc.rightLegGroup.rotation.x = 0.75;
        npc.torso.rotation.x = 0.35;
        npc.headGroup.rotation.x = 0.3;

        // Hands weeding
        npc.leftArmGroup.rotation.x = 0.85 + Math.sin(time * 5.0) * 0.15;
        npc.rightArmGroup.rotation.x = 0.85 + Math.cos(time * 5.0) * 0.15;
      } else {
        // Stand and stretch
        npc.bodyGroup.position.y = 0.0;
        npc.leftLegGroup.rotation.x = 0.0;
        npc.rightLegGroup.rotation.x = 0.0;
        npc.torso.rotation.x = -0.08;
        npc.headGroup.rotation.x = -0.1;
        npc.leftArmGroup.rotation.x = 0.0;
        npc.rightArmGroup.rotation.x = 0.0;
      }
    } else {
      this.advanceWaypointPath(npc, delta, time);
    }
  }

  private updateFishermanDock(npc: NPCInstance, delta: number, time: number): void {
    npc.workCycle += delta;

    // Gentle breathing & subtle weight shifting
    const sway = Math.sin(time * 1.2) * 0.03;
    npc.torso.rotation.z = sway;
    npc.torso.rotation.x = 0.06;

    // Right arm holds extended bamboo fishing rod
    const rodTwitch = Math.sin(time * 2.4) * 0.025 + Math.sin(time * 0.8) * 0.05;
    npc.rightArmGroup.rotation.x = 0.65 + rodTwitch;
    npc.leftArmGroup.rotation.x = 0.35;

    // Head occasionally glances left and right over the water
    npc.headGroup.rotation.y = Math.sin(time * 0.5) * 0.22;
    npc.headGroup.rotation.x = 0.12; // Looking down at water
  }

  private updateFishermanBoat(npc: NPCInstance, _delta: number, time: number): void {
    // Synchronize gentle sway with boat motion
    const rock = Math.sin(time * 1.4) * 0.04;
    npc.group.rotation.z = rock;
    npc.group.rotation.x = Math.cos(time * 1.1) * 0.025;
    npc.group.position.y = npc.currentPos.y + Math.sin(time * 1.8) * 0.03;

    // Holding rod out over the gunwale
    npc.rightArmGroup.rotation.x = 0.58 + Math.sin(time * 1.6) * 0.03;
    npc.leftArmGroup.rotation.x = 0.25;
  }

  private updatePedestrian(npc: NPCInstance, delta: number, time: number): void {
    if (npc.pauseTimer > 0) {
      // Pausing at destination
      npc.pauseTimer -= delta;

      // Idle pose: arms relaxed, subtle breathing, looking around
      npc.leftLegGroup.rotation.x = 0;
      npc.rightLegGroup.rotation.x = 0;
      npc.leftArmGroup.rotation.x = 0;
      npc.rightArmGroup.rotation.x = 0;

      npc.torso.rotation.x = 0;
      npc.torso.position.y = 1.12;
      npc.headGroup.rotation.y = Math.sin(time * 1.1) * 0.35;
      npc.headGroup.rotation.x = 0;
      return;
    }

    this.advanceWaypointPath(npc, delta, time);
  }

  private advanceWaypointPath(npc: NPCInstance, delta: number, _time?: number): void {
    const currentWp = npc.waypoints[npc.currentWaypointIndex];
    const dx = currentWp.x - npc.currentPos.x;
    const dz = currentWp.z - npc.currentPos.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.3) {
      // Arrived at waypoint!
      npc.pauseTimer = currentWp.pauseTime || 0;
      npc.currentWaypointIndex = (npc.currentWaypointIndex + 1) % npc.waypoints.length;
      return;
    }

    // Move toward waypoint
    const dirX = dx / dist;
    const dirZ = dz / dist;
    const step = npc.speed * delta;

    npc.currentPos.x += dirX * step;
    npc.currentPos.z += dirZ * step;
    npc.currentPos.y = this.terrain.getHeightAt(npc.currentPos.x, npc.currentPos.z);

    npc.group.position.copy(npc.currentPos);

    // Smooth heading rotation
    const targetHeading = Math.atan2(dirX, dirZ);
    let diff = targetHeading - npc.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    npc.heading += diff * Math.min(1.0, delta * 7.0);
    npc.group.rotation.y = npc.heading;

    // Animated Walk Cycle
    npc.walkCycle += delta * (npc.speed * 4.2);
    const legSwing = Math.sin(npc.walkCycle) * 0.65;
    npc.leftLegGroup.rotation.x = legSwing;
    npc.rightLegGroup.rotation.x = -legSwing;

    // Opposite Arm Swing
    npc.leftArmGroup.rotation.x = -legSwing * 0.75;

    // If holding a walking staff, plant staff rhythmically
    if (npc.type === 'traveler_monk') {
      npc.rightArmGroup.rotation.x = 0.35 + Math.sin(npc.walkCycle * 0.5) * 0.25;
    } else {
      npc.rightArmGroup.rotation.x = legSwing * 0.75;
    }

    // Subtle hip bounce
    npc.torso.position.y = 1.12 + Math.abs(Math.sin(npc.walkCycle)) * 0.05;
  }
}
