import * as THREE from 'three';
import { MaterialLibrary } from '../rendering/Materials';

export class AssetGenerator {
  private materials: MaterialLibrary;

  constructor(materials: MaterialLibrary) {
    this.materials = materials;
  }

  // ==========================================
  // TREES (HANDCRAFTED JAPANESE SILHOUETTES)
  // ==========================================

  public createPineTree(variant: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.name = `tree_pine_${variant}`;

    const trunkMat = this.materials.treeTrunkMaterial;
    const foliageDark = this.materials.pineFoliageDark;
    const foliageLight = this.materials.pineFoliageLight;
    const deadwoodMat = this.materials.woodPlankMaterial;

    // Gnarled Japanese Pine (Matsu) trunk with characteristic elbow bends
    const trunkWaypoints = variant === 0 ? [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, 2.0, -0.15),
      new THREE.Vector3(0.9, 4.2, 0.25),
      new THREE.Vector3(0.4, 6.2, 0.6),
      new THREE.Vector3(-0.2, 8.2, 0.4),
      new THREE.Vector3(0.0, 9.4, 0.2),
    ] : [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.35, 1.8, 0.2),
      new THREE.Vector3(-0.85, 3.8, -0.2),
      new THREE.Vector3(-0.4, 5.6, -0.45),
      new THREE.Vector3(0.25, 7.4, -0.2),
      new THREE.Vector3(0.1, 8.6, 0.0),
    ];

    // Build tapered curved trunk
    for (let i = 0; i < trunkWaypoints.length - 1; i++) {
      const p1 = trunkWaypoints[i];
      const p2 = trunkWaypoints[i + 1];
      const dist = p1.distanceTo(p2);
      const t = i / (trunkWaypoints.length - 1);
      const r1 = THREE.MathUtils.lerp(0.55, 0.18, t);
      const r2 = THREE.MathUtils.lerp(0.55, 0.18, (i + 1) / (trunkWaypoints.length - 1));

      const segGeo = new THREE.CylinderGeometry(r2, r1, dist, 7);
      const seg = new THREE.Mesh(segGeo, trunkMat);

      // Align segment from p1 to p2
      const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      seg.position.copy(midpoint);
      seg.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(p2, p1).normalize()
      );
      seg.castShadow = true;
      seg.receiveShadow = true;
      group.add(seg);
    }

    // Tiered horizontal "cloud pads" (Tamabuki)
    const tiers = variant === 0 ? [
      { y: 3.6, x: 1.2, z: 0.3, radius: 2.2, angle: 0.2 },
      { y: 4.8, x: -1.0, z: -0.4, radius: 2.0, angle: -0.15 },
      { y: 6.0, x: 1.1, z: 0.8, radius: 1.8, angle: 0.1 },
      { y: 7.2, x: -0.8, z: 0.6, radius: 1.6, angle: -0.2 },
      { y: 8.5, x: 0.5, z: -0.3, radius: 1.4, angle: 0.15 },
      { y: 9.6, x: 0.0, z: 0.2, radius: 1.2, angle: 0.0 }, // Crown
    ] : [
      { y: 3.2, x: -1.2, z: -0.2, radius: 2.1, angle: -0.2 },
      { y: 4.5, x: 1.1, z: 0.4, radius: 1.9, angle: 0.18 },
      { y: 5.8, x: -0.9, z: -0.6, radius: 1.7, angle: -0.12 },
      { y: 7.0, x: 0.7, z: -0.4, radius: 1.5, angle: 0.15 },
      { y: 8.8, x: 0.1, z: 0.0, radius: 1.3, angle: 0.0 },
    ];

    tiers.forEach((tier, idx) => {
      // 1. Supporting branch from trunk to cloud
      const branchGeo = new THREE.CylinderGeometry(0.08, 0.16, tier.radius * 1.1, 5);
      const branch = new THREE.Mesh(branchGeo, trunkMat);
      branch.position.set(tier.x * 0.5, tier.y - 0.2, tier.z * 0.5);
      branch.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(tier.x, 0.3, tier.z).normalize()
      );
      branch.castShadow = true;
      group.add(branch);

      // 2. Exposed deadwood twigs (Jin)
      if (idx % 2 === 1) {
        const jinGeo = new THREE.CylinderGeometry(0.03, 0.07, 0.85, 4);
        const jin = new THREE.Mesh(jinGeo, deadwoodMat);
        jin.position.set(tier.x + 0.3, tier.y - 0.15, tier.z - 0.2);
        jin.rotation.set(0.4, idx, -0.6);
        group.add(jin);
      }

      // 3. Foliage Cloud Pad (Tamabuki shelf):
      // Underbelly (darker shadow tone)
      const underGeo = new THREE.CylinderGeometry(tier.radius * 0.9, tier.radius * 0.5, 0.35, 7);
      const underMesh = new THREE.Mesh(underGeo, foliageDark);
      underMesh.position.set(tier.x, tier.y - 0.12, tier.z);
      underMesh.scale.set(1.25, 0.7, 1.0);
      underMesh.rotation.set(tier.angle, idx * 1.4, 0);
      underMesh.castShadow = true;
      underMesh.receiveShadow = true;
      group.add(underMesh);

      // Top Dome (sun-kissed light moss tone)
      const topGeo = new THREE.DodecahedronGeometry(tier.radius * 0.85, 1);
      const topMesh = new THREE.Mesh(topGeo, foliageLight);
      topMesh.position.set(tier.x, tier.y + 0.18, tier.z);
      topMesh.scale.set(1.3, 0.55, 1.05);
      topMesh.rotation.set(tier.angle, idx * 1.4 + 0.5, 0);
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      group.add(topMesh);
    });

    return group;
  }

  public createBroadleafTree(variant: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.name = `tree_broadleaf_${variant}`;

    const height = variant === 0 ? 8.6 : 7.4;
    const trunkMat = this.materials.treeTrunkMaterial;
    const foliageDark = this.materials.broadleafFoliage;
    const foliageLight = this.materials.broadleafFoliageLight;

    // Stately trunk with natural branch forks
    const baseTrunkGeo = new THREE.CylinderGeometry(0.4, 0.65, height * 0.45, 7);
    const baseTrunk = new THREE.Mesh(baseTrunkGeo, trunkMat);
    baseTrunk.position.y = height * 0.22;
    baseTrunk.castShadow = true;
    baseTrunk.receiveShadow = true;
    group.add(baseTrunk);

    // Forked secondary limbs
    const forkConfigs = [
      { len: height * 0.4, r1: 0.32, r2: 0.16, dx: 1.1, dy: height * 0.48, dz: 0.4, rotZ: -0.35, rotX: 0.1 },
      { len: height * 0.38, r1: 0.28, r2: 0.14, dx: -0.9, dy: height * 0.46, dz: -0.5, rotZ: 0.4, rotX: -0.15 },
      { len: height * 0.32, r1: 0.25, r2: 0.12, dx: 0.2, dy: height * 0.52, dz: 0.8, rotZ: 0.1, rotX: -0.38 },
    ];

    forkConfigs.forEach(fc => {
      const fGeo = new THREE.CylinderGeometry(fc.r2, fc.r1, fc.len, 6);
      const limb = new THREE.Mesh(fGeo, trunkMat);
      limb.position.set(fc.dx * 0.6, fc.dy, fc.dz * 0.6);
      limb.rotation.set(fc.rotX, 0, fc.rotZ);
      limb.castShadow = true;
      group.add(limb);
    });

    // Multi-tiered Ghibli-style layered canopy domes
    const canopyDomes = [
      // Main central crown
      { x: 0, y: height * 0.85, z: 0, s: 2.8, mat: foliageLight },
      // Side supporting lobes
      { x: 1.8, y: height * 0.68, z: 0.6, s: 2.2, mat: foliageDark },
      { x: -1.6, y: height * 0.72, z: -0.7, s: 2.3, mat: foliageDark },
      { x: -0.3, y: height * 0.82, z: 1.4, s: 2.0, mat: foliageLight },
      { x: 0.7, y: height * 0.88, z: -1.1, s: 2.0, mat: foliageLight },
      { x: 0.9, y: height * 0.58, z: -0.5, s: 1.7, mat: foliageDark },
    ];

    canopyDomes.forEach((cd, idx) => {
      const geo = new THREE.IcosahedronGeometry(cd.s, 1);
      const mesh = new THREE.Mesh(geo, cd.mat);
      mesh.position.set(cd.x, cd.y, cd.z);
      mesh.scale.set(1.15, 0.9, 1.1);
      mesh.rotation.set(idx * 0.3, idx * 0.7, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    return group;
  }

  public createCherryBlossomTree(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'tree_cherry_blossom';

    const height = 7.4;
    const trunkMat = this.materials.treeTrunkMaterial;
    const blossomMat = this.materials.cherryBlossomFoliage;

    // Gracefully curved dark charcoal trunk
    const trunkGeo = new THREE.CylinderGeometry(0.32, 0.58, height * 0.55, 7);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0.3, height * 0.28, -0.15);
    trunk.rotation.set(0.12, 0.2, -0.18);
    trunk.castShadow = true;
    group.add(trunk);

    // Spreading romantic branches
    const branchConfigs = [
      { dx: 1.6, dy: height * 0.6, dz: 0.5, rx: 0.2, rz: -0.6 },
      { dx: -1.5, dy: height * 0.55, dz: 0.8, rx: 0.3, rz: 0.55 },
      { dx: -0.8, dy: height * 0.62, dz: -1.6, rx: -0.55, rz: 0.2 },
    ];

    branchConfigs.forEach(bc => {
      const bGeo = new THREE.CylinderGeometry(0.1, 0.22, 2.8, 5);
      const b = new THREE.Mesh(bGeo, trunkMat);
      b.position.set(bc.dx * 0.5, bc.dy, bc.dz * 0.5);
      b.rotation.set(bc.rx, 0, bc.rz);
      b.castShadow = true;
      group.add(b);
    });

    // Cascading blossom masses
    const blossomClusters = [
      { x: 0, y: height * 0.88, z: 0, s: 2.5 },
      { x: -1.8, y: height * 0.72, z: 0.9, s: 2.1 },
      { x: 2.0, y: height * 0.76, z: -0.7, s: 2.2 },
      { x: -0.9, y: height * 0.65, z: -1.8, s: 1.9 },
      { x: 1.4, y: height * 0.68, z: 1.5, s: 2.0 },
      // Low trailing blossom clumps
      { x: 2.2, y: height * 0.52, z: 0.2, s: 1.3 },
      { x: -1.9, y: height * 0.48, z: -0.6, s: 1.2 },
    ];

    blossomClusters.forEach((c, idx) => {
      const geo = new THREE.DodecahedronGeometry(c.s, 1);
      const mesh = new THREE.Mesh(geo, blossomMat);
      mesh.position.set(c.x, c.y, c.z);
      mesh.rotation.set(idx * 0.4, idx * 0.8, 0);
      mesh.scale.set(1.2, 0.82, 1.15);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    return group;
  }

  public createFallenPetalPatch(radius: number = 3.5): THREE.Group {
    const group = new THREE.Group();
    group.name = 'fallen_petals';

    const petalMat = new THREE.MeshBasicMaterial({
      color: this.materials.cherryBlossomFoliage.color,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    const petalCount = 28;
    for (let i = 0; i < petalCount; i++) {
      const r = Math.sqrt(Math.random()) * radius;
      const theta = Math.random() * Math.PI * 2;
      const px = Math.cos(theta) * r;
      const pz = Math.sin(theta) * r;

      const pGeo = new THREE.CircleGeometry(0.18 + Math.random() * 0.15, 5);
      pGeo.rotateX(-Math.PI / 2);
      const pMesh = new THREE.Mesh(pGeo, petalMat);
      pMesh.position.set(px, 0.04, pz);
      pMesh.rotation.y = Math.random() * Math.PI;
      group.add(pMesh);
    }

    return group;
  }

  // ==========================================
  // TRADITIONAL VEHICLE: VINTAGE BICYCLE (JITENSHA)
  // ==========================================

  public createBicycleModel(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'bicycle_jitensha';

    // Materials
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x274332, // Vintage British/Japanese racing green
      roughness: 0.45,
      metalness: 0.55,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd8e0dc,
      roughness: 0.25,
      metalness: 0.85,
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x222426,
      roughness: 0.9,
      metalness: 0.05,
    });

    const saddleMat = new THREE.MeshStandardMaterial({
      color: 0x6e3d22, // Rich dark brown leather
      roughness: 0.6,
      metalness: 0.05,
    });

    const basketMat = new THREE.MeshStandardMaterial({
      color: 0xc49d68, // Woven wicker rattan
      roughness: 0.85,
      metalness: 0.02,
    });

    const wheelRadius = 0.34;
    const wheelbase = 0.90;

    // Tire geometry oriented in the YZ plane (axle along X axis, aligned with bike frame)
    const tireGeo = new THREE.TorusGeometry(wheelRadius, 0.026, 8, 24);
    tireGeo.rotateY(Math.PI / 2); // Rotate from XY plane into YZ plane

    // Chrome axle hub through wheel center along X axis
    const hubGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.10, 8);
    hubGeo.rotateZ(Math.PI / 2);

    // Wheel spokes radiating in the YZ plane (axle along X)
    const spokeGeo = new THREE.CylinderGeometry(0.004, 0.004, wheelRadius * 2, 4);

    // 1. Rear Wheel (at z: -wheelbase*0.5, y: wheelRadius)
    const rearWheel = new THREE.Group();
    rearWheel.name = 'rear_wheel';
    rearWheel.position.set(0, wheelRadius, -wheelbase * 0.5);

    const rearTire = new THREE.Mesh(tireGeo, rubberMat);
    rearWheel.add(rearTire);

    const rearHub = new THREE.Mesh(hubGeo, chromeMat);
    rearWheel.add(rearHub);

    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(spokeGeo, chromeMat);
      spoke.rotation.x = (s / 4) * Math.PI;
      rearWheel.add(spoke);
    }
    rearWheel.castShadow = true;
    group.add(rearWheel);

    // 2. Front Wheel (at z: wheelbase*0.5, y: wheelRadius)
    const frontWheel = new THREE.Group();
    frontWheel.name = 'front_wheel';
    frontWheel.position.set(0, wheelRadius, wheelbase * 0.5);

    const frontTire = new THREE.Mesh(tireGeo, rubberMat);
    frontWheel.add(frontTire);

    const frontHub = new THREE.Mesh(hubGeo, chromeMat);
    frontWheel.add(frontHub);

    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(spokeGeo, chromeMat);
      spoke.rotation.x = (s / 4) * Math.PI;
      frontWheel.add(spoke);
    }
    frontWheel.castShadow = true;
    group.add(frontWheel);

    // 3. Vintage Diamond Bicycle Frame Tubes (Chibi Scale)
    const tubeRadius = 0.018;

    // Bottom bracket (crank axis) at (0, 0.22, -0.02)
    const bbPos = new THREE.Vector3(0, 0.22, -0.02);

    // Seat post tube (from BB up to saddle clamp)
    const seatPostPos = new THREE.Vector3(0, 0.50, -0.14);
    const seatTubeGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, bbPos.distanceTo(seatPostPos), 6);
    const seatTube = new THREE.Mesh(seatTubeGeo, frameMat);
    seatTube.position.copy(new THREE.Vector3().addVectors(bbPos, seatPostPos).multiplyScalar(0.5));
    seatTube.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3().subVectors(seatPostPos, bbPos).normalize()
    );
    group.add(seatTube);

    // Head tube (front steering column)
    const headTop = new THREE.Vector3(0, 0.60, 0.26);
    const headBottom = new THREE.Vector3(0, 0.36, 0.30);
    const headTubeGeo = new THREE.CylinderGeometry(tubeRadius * 1.2, tubeRadius * 1.2, headTop.distanceTo(headBottom), 6);
    const headTube = new THREE.Mesh(headTubeGeo, frameMat);
    headTube.position.copy(new THREE.Vector3().addVectors(headTop, headBottom).multiplyScalar(0.5));
    headTube.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3().subVectors(headTop, headBottom).normalize()
    );
    group.add(headTube);

    // Top tube (from seat post to head tube)
    const topTubeGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, seatPostPos.distanceTo(headTop), 6);
    const topTube = new THREE.Mesh(topTubeGeo, frameMat);
    topTube.position.copy(new THREE.Vector3().addVectors(seatPostPos, headTop).multiplyScalar(0.5));
    topTube.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3().subVectors(headTop, seatPostPos).normalize()
    );
    group.add(topTube);

    // Down tube (from head tube to BB)
    const downTubeGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, headBottom.distanceTo(bbPos), 6);
    const downTube = new THREE.Mesh(downTubeGeo, frameMat);
    downTube.position.copy(new THREE.Vector3().addVectors(headBottom, bbPos).multiplyScalar(0.5));
    downTube.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3().subVectors(bbPos, headBottom).normalize()
    );
    group.add(downTube);

    // Chain stays (BB to rear wheel axle)
    [-0.055, 0.055].forEach(xOff => {
      const stayEnd = new THREE.Vector3(xOff, wheelRadius, -wheelbase * 0.5);
      const stayGeo = new THREE.CylinderGeometry(0.011, 0.011, bbPos.distanceTo(stayEnd), 5);
      const stay = new THREE.Mesh(stayGeo, frameMat);
      stay.position.copy(new THREE.Vector3().addVectors(bbPos, stayEnd).multiplyScalar(0.5));
      stay.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(stayEnd, bbPos).normalize()
      );
      group.add(stay);
    });

    // Seat stays (seat post clamp down to rear wheel axle)
    [-0.05, 0.05].forEach(xOff => {
      const stayEnd = new THREE.Vector3(xOff, wheelRadius, -wheelbase * 0.5);
      const stayGeo = new THREE.CylinderGeometry(0.010, 0.010, seatPostPos.distanceTo(stayEnd), 5);
      const stay = new THREE.Mesh(stayGeo, frameMat);
      stay.position.copy(new THREE.Vector3().addVectors(seatPostPos, stayEnd).multiplyScalar(0.5));
      stay.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(stayEnd, seatPostPos).normalize()
      );
      group.add(stay);
    });

    // Front fork blades (head tube bottom down to front wheel axle)
    [-0.045, 0.045].forEach(xOff => {
      const axleEnd = new THREE.Vector3(xOff, wheelRadius, wheelbase * 0.5);
      const forkGeo = new THREE.CylinderGeometry(0.011, 0.010, headBottom.distanceTo(axleEnd), 5);
      const fork = new THREE.Mesh(forkGeo, chromeMat);
      fork.position.copy(new THREE.Vector3().addVectors(headBottom, axleEnd).multiplyScalar(0.5));
      fork.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(axleEnd, headBottom).normalize()
      );
      group.add(fork);
    });

    // 4. Rotating Bottom Bracket Crank Assembly
    const crankGroup = new THREE.Group();
    crankGroup.name = 'crank_assembly';
    crankGroup.position.copy(bbPos);

    const crankGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6);
    crankGeo.rotateZ(Math.PI / 2);
    const crankAxle = new THREE.Mesh(crankGeo, chromeMat);
    crankGroup.add(crankAxle);

    // Chainring sprocket disc
    const sprocketGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.008, 14);
    sprocketGeo.rotateZ(Math.PI / 2);
    const sprocket = new THREE.Mesh(sprocketGeo, chromeMat);
    sprocket.position.set(0.06, 0, 0);
    crankGroup.add(sprocket);

    // Left & Right Crank arms (180 degrees opposed)
    const armGeo = new THREE.BoxGeometry(0.012, 0.095, 0.014);
    const leftArmMesh = new THREE.Mesh(armGeo, chromeMat);
    leftArmMesh.position.set(0.075, -0.04, 0);
    crankGroup.add(leftArmMesh);

    const rightArmMesh = new THREE.Mesh(armGeo, chromeMat);
    rightArmMesh.position.set(-0.075, 0.04, 0);
    crankGroup.add(rightArmMesh);

    // Pedals
    const pedalGeo = new THREE.BoxGeometry(0.065, 0.018, 0.045);
    const leftPedal = new THREE.Mesh(pedalGeo, rubberMat);
    leftPedal.position.set(0.10, -0.08, 0);
    crankGroup.add(leftPedal);

    const rightPedal = new THREE.Mesh(pedalGeo, rubberMat);
    rightPedal.position.set(-0.10, 0.08, 0);
    crankGroup.add(rightPedal);

    group.add(crankGroup);

    // Kickstand on rear left
    const kickGeo = new THREE.CylinderGeometry(0.009, 0.008, 0.28, 4);
    const kickstand = new THREE.Mesh(kickGeo, chromeMat);
    kickstand.name = 'kickstand';
    kickstand.position.set(-0.06, wheelRadius * 0.45, -wheelbase * 0.46);
    kickstand.rotation.set(0.1, 0, 0.32);
    group.add(kickstand);

    // 5. Vintage Leather Saddle
    const saddleGeo = new THREE.BoxGeometry(0.18, 0.05, 0.22);
    const saddle = new THREE.Mesh(saddleGeo, saddleMat);
    saddle.position.copy(seatPostPos).add(new THREE.Vector3(0, 0.05, -0.02));
    saddle.castShadow = true;
    group.add(saddle);

    // 6. Curved Japanese Roadster Handlebars & Grips
    // Handlebar Stem
    const stemGeo = new THREE.CylinderGeometry(tubeRadius * 0.9, tubeRadius * 0.9, 0.08, 6);
    const stem = new THREE.Mesh(stemGeo, chromeMat);
    stem.position.copy(headTop).add(new THREE.Vector3(0, 0.04, -0.02));
    group.add(stem);

    // Swept-back handlebar crossbar
    const barGeo = new THREE.BoxGeometry(0.44, 0.022, 0.022);
    const bar = new THREE.Mesh(barGeo, chromeMat);
    bar.position.copy(headTop).add(new THREE.Vector3(0, 0.08, -0.05));
    bar.castShadow = true;
    group.add(bar);

    // Handlebar rubber grips
    const gripGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6);
    gripGeo.rotateX(Math.PI / 2);
    [-0.20, 0.20].forEach(gx => {
      const grip = new THREE.Mesh(gripGeo, rubberMat);
      grip.position.set(gx, headTop.y + 0.08, headTop.z - 0.07);
      group.add(grip);
    });

    // Brass Bell
    const bellGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const bellMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.copy(bar.position).add(new THREE.Vector3(0.12, 0.03, 0.02));
    group.add(bell);

    // 7. Front Wicker Basket (Classic Mamachari)
    const basketGeo = new THREE.BoxGeometry(0.26, 0.16, 0.18);
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.copy(headTop).add(new THREE.Vector3(0, 0.01, 0.16));
    basket.castShadow = true;
    group.add(basket);

    // 8. Rear Luggage Parcel Rack
    const rackGeo = new THREE.BoxGeometry(0.15, 0.02, 0.28);
    const rack = new THREE.Mesh(rackGeo, chromeMat);
    rack.position.set(0, wheelRadius + 0.16, -wheelbase * 0.40);
    rack.castShadow = true;
    group.add(rack);

    return group;
  }

  // ==========================================
  // BUSHES & ROCKS
  // ==========================================

  public createBush(isFlowering: boolean = false): THREE.Group {
    const group = new THREE.Group();
    const mat = isFlowering ? this.materials.cherryBlossomFoliage : this.materials.bushMaterial;
    
    const geo1 = new THREE.DodecahedronGeometry(1.0, 1);
    const m1 = new THREE.Mesh(geo1, mat);
    m1.position.set(0, 0.7, 0);
    m1.scale.set(1.2, 0.75, 1.1);
    m1.castShadow = true;
    group.add(m1);

    const geo2 = new THREE.DodecahedronGeometry(0.75, 1);
    const m2 = new THREE.Mesh(geo2, mat);
    m2.position.set(0.65, 0.5, 0.3);
    m2.scale.set(1.0, 0.7, 0.9);
    m2.castShadow = true;
    group.add(m2);

    return group;
  }

  public createRock(size: 'small' | 'medium' | 'large'): THREE.Mesh {
    const s = size === 'small' ? 0.75 : size === 'medium' ? 1.6 : 3.2;
    const geo = new THREE.DodecahedronGeometry(s, 0);
    
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const flatten = vy < 0 ? 0.5 : 1.0;
      pos.setXYZ(i, vx * (1 + Math.sin(vy * 3) * 0.15), vy * flatten, vz * (1 + Math.cos(vx * 3) * 0.15));
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, this.materials.rockMaterial);
    mesh.position.y = s * 0.35;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  public createShoreRock(): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(1.2, 1.5, 0.6, 7);
    const mesh = new THREE.Mesh(geo, this.materials.shoreRockMaterial);
    mesh.scale.set(1.3, 0.8, 1.1);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  public createFallenLog(): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.CylinderGeometry(0.32, 0.42, 4.2, 6);
    const mesh = new THREE.Mesh(geo, this.materials.timberDarkMaterial);
    mesh.rotation.z = Math.PI * 0.5;
    mesh.position.y = 0.32;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return group;
  }

  public createGrassClump(): THREE.Group {
    const group = new THREE.Group();
    const bladeGeo = new THREE.PlaneGeometry(0.18, 0.85);
    const bladeCount = 5;

    for (let i = 0; i < bladeCount; i++) {
      const blade = new THREE.Mesh(bladeGeo, this.materials.grassMaterial);
      const angle = (i / bladeCount) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.22, 0.42, Math.sin(angle) * 0.22);
      blade.rotation.y = angle;
      blade.rotation.x = 0.18;
      group.add(blade);
    }
    return group;
  }

  public createFlowerPatch(color: 'yellow' | 'purple'): THREE.Group {
    const group = new THREE.Group();
    const mat = color === 'yellow' ? this.materials.flowerYellowMaterial : this.materials.flowerPurpleMaterial;
    
    const baseGeo = new THREE.DodecahedronGeometry(0.55, 0);
    const base = new THREE.Mesh(baseGeo, this.materials.bushMaterial);
    base.scale.set(1.2, 0.35, 1.2);
    base.position.y = 0.15;
    group.add(base);

    const flowerGeo = new THREE.TetrahedronGeometry(0.16, 0);
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(flowerGeo, mat);
      f.position.set((Math.random() - 0.5) * 0.6, 0.35 + Math.random() * 0.15, (Math.random() - 0.5) * 0.6);
      f.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(f);
    }
    return group;
  }

  public createReeds(): THREE.Group {
    const group = new THREE.Group();
    const stalkGeo = new THREE.CylinderGeometry(0.04, 0.05, 2.2, 4);
    const count = 6;

    for (let i = 0; i < count; i++) {
      const stalk = new THREE.Mesh(stalkGeo, this.materials.reedMaterial);
      const ox = (Math.random() - 0.5) * 0.8;
      const oz = (Math.random() - 0.5) * 0.8;
      stalk.position.set(ox, 1.1, oz);
      stalk.rotation.set((Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.15);
      stalk.castShadow = true;
      group.add(stalk);
    }
    return group;
  }

  // ==========================================
  // ARCHITECTURE & LANDMARKS
  // ==========================================

  public createJapaneseHouse(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'house_rural_01';

    const M = this.materials;

    // 1. Stone Foundation Footings
    const fWidth = 9.4;
    const fLength = 11.2;
    const fHeight = 0.65;
    const fGeo = new THREE.BoxGeometry(fWidth, fHeight, fLength);
    const foundation = new THREE.Mesh(fGeo, M.stoneGraniteMaterial);
    foundation.position.y = fHeight * 0.5;
    foundation.receiveShadow = true;
    group.add(foundation);

    // 2. Engawa (Raised wooden wrap-around veranda)
    const vWidth = 8.6;
    const vLength = 10.4;
    const vGeo = new THREE.BoxGeometry(vWidth, 0.18, vLength);
    const veranda = new THREE.Mesh(vGeo, M.woodPlankMaterial);
    veranda.position.y = fHeight + 0.09;
    veranda.receiveShadow = true;
    group.add(veranda);

    // 3. Main Enclosed Living Core
    const coreW = 6.4;
    const coreL = 8.2;
    const coreH = 2.8;
    const coreGeo = new THREE.BoxGeometry(coreW, coreH, coreL);
    const core = new THREE.Mesh(coreGeo, M.wallCreamMaterial);
    core.position.y = fHeight + coreH * 0.5;
    core.castShadow = true;
    core.receiveShadow = true;
    group.add(core);

    // Shoji Screen Facades
    const shojiGeoFront = new THREE.PlaneGeometry(coreW * 0.85, coreH * 0.75);
    const shojiFront = new THREE.Mesh(shojiGeoFront, M.wallShojiMaterial);
    shojiFront.position.set(0, fHeight + coreH * 0.5, coreL * 0.5 + 0.04);
    group.add(shojiFront);

    const shojiGeoSide = new THREE.PlaneGeometry(coreL * 0.65, coreH * 0.75);
    const shojiSide = new THREE.Mesh(shojiGeoSide, M.wallShojiMaterial);
    shojiSide.position.set(coreW * 0.5 + 0.04, fHeight + coreH * 0.5, 0);
    shojiSide.rotation.y = Math.PI * 0.5;
    group.add(shojiSide);

    // 4. Timber Structural Posts
    const postCountX = 4;
    const postCountZ = 5;
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, coreH + 0.3, 5);

    for (let ix = 0; ix < postCountX; ix++) {
      for (let iz = 0; iz < postCountZ; iz++) {
        if (ix === 0 || ix === postCountX - 1 || iz === 0 || iz === postCountZ - 1) {
          const px = ((ix / (postCountX - 1)) - 0.5) * (vWidth - 0.4);
          const pz = ((iz / (postCountZ - 1)) - 0.5) * (vLength - 0.4);
          const post = new THREE.Mesh(postGeo, M.timberDarkMaterial);
          post.position.set(px, fHeight + (coreH + 0.3) * 0.5, pz);
          post.castShadow = true;
          group.add(post);
        }
      }
    }

    // 5. Classic Layered Japanese Gabled Roof with Onigawara ridge crests
    const roofBaseY = fHeight + coreH;
    const roofSpanX = vWidth + 2.2;
    const roofSpanZ = vLength + 2.4;
    const roofPitchH = 2.4;

    const roofSlopeLen = Math.sqrt(Math.pow(roofSpanX * 0.5, 2) + Math.pow(roofPitchH, 2));
    const slopeAngle = Math.atan2(roofPitchH, roofSpanX * 0.5);
    const roofPlaneGeo = new THREE.BoxGeometry(roofSlopeLen + 0.4, 0.28, roofSpanZ);

    // Left slope
    const leftRoof = new THREE.Mesh(roofPlaneGeo, M.roofTileMaterial);
    leftRoof.position.set(-roofSpanX * 0.25, roofBaseY + roofPitchH * 0.48, 0);
    leftRoof.rotation.z = slopeAngle;
    leftRoof.castShadow = true;
    leftRoof.receiveShadow = true;
    group.add(leftRoof);

    // Right slope
    const rightRoof = new THREE.Mesh(roofPlaneGeo, M.roofTileMaterial);
    rightRoof.position.set(roofSpanX * 0.25, roofBaseY + roofPitchH * 0.48, 0);
    rightRoof.rotation.z = -slopeAngle;
    rightRoof.castShadow = true;
    rightRoof.receiveShadow = true;
    group.add(rightRoof);

    // Winter Snow Blankets on Japanese House Roof
    const snowPlaneGeo = new THREE.BoxGeometry(roofSlopeLen + 0.45, 0.22, roofSpanZ + 0.25);
    const leftSnow = new THREE.Mesh(snowPlaneGeo, M.snowRoofMaterial);
    leftSnow.position.set(-roofSpanX * 0.25, roofBaseY + roofPitchH * 0.48 + 0.15, 0);
    leftSnow.rotation.z = slopeAngle;
    leftSnow.castShadow = true;
    leftSnow.receiveShadow = true;
    group.add(leftSnow);

    const rightSnow = new THREE.Mesh(snowPlaneGeo, M.snowRoofMaterial);
    rightSnow.position.set(roofSpanX * 0.25, roofBaseY + roofPitchH * 0.48 + 0.15, 0);
    rightSnow.rotation.z = -slopeAngle;
    rightSnow.castShadow = true;
    rightSnow.receiveShadow = true;
    group.add(rightSnow);

    const ridgeSnow = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.26, roofSpanZ + 0.35), M.snowRoofMaterial);
    ridgeSnow.position.set(0, roofBaseY + roofPitchH + 0.28, 0);
    group.add(ridgeSnow);

    // Ridge capping beam
    const ridgeGeo = new THREE.BoxGeometry(0.5, 0.4, roofSpanZ + 0.3);
    const ridge = new THREE.Mesh(ridgeGeo, M.timberDarkMaterial);
    ridge.position.set(0, roofBaseY + roofPitchH + 0.12, 0);
    ridge.castShadow = true;
    group.add(ridge);

    // Onigawara roof ridge end finials
    [-roofSpanZ * 0.5 - 0.1, roofSpanZ * 0.5 + 0.1].forEach(rz => {
      const oniGeo = new THREE.BoxGeometry(0.65, 0.65, 0.25);
      const oni = new THREE.Mesh(oniGeo, M.roofTileMaterial);
      oni.position.set(0, roofBaseY + roofPitchH + 0.2, rz);
      oni.castShadow = true;
      group.add(oni);
    });

    // Gable triangular wall pediments
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-coreW * 0.5, 0);
    gableShape.lineTo(coreW * 0.5, 0);
    gableShape.lineTo(0, roofPitchH);
    gableShape.closePath();

    const gableGeo = new THREE.ShapeGeometry(gableShape);
    const frontGable = new THREE.Mesh(gableGeo, M.wallCreamMaterial);
    frontGable.position.set(0, roofBaseY, coreL * 0.5);
    group.add(frontGable);

    const backGable = new THREE.Mesh(gableGeo, M.wallCreamMaterial);
    backGable.position.set(0, roofBaseY, -coreL * 0.5);
    backGable.rotation.y = Math.PI;
    group.add(backGable);

    // 6. Hanging Illuminated Paper Lantern (Chochin) under porch eaves
    const lanternGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.55, 7);
    const chochin = new THREE.Mesh(lanternGeo, M.lanternFlameMaterial);
    chochin.position.set(1.8, roofBaseY - 0.25, coreL * 0.5 + 0.7);
    group.add(chochin);

    return group;
  }

  public createToriiGate(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'torii_01';

    const M = this.materials;
    const span = 4.8;
    const height = 5.2;

    // Upright pillars (Hashira)
    const pillarGeo = new THREE.CylinderGeometry(0.24, 0.28, height, 8);
    const baseGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.65, 8);

    [-span * 0.5, span * 0.5].forEach(xPos => {
      const base = new THREE.Mesh(baseGeo, M.toriiBaseMaterial);
      base.position.set(xPos, 0.32, 0);
      base.receiveShadow = true;
      group.add(base);

      const pillar = new THREE.Mesh(pillarGeo, M.toriiMaterial);
      pillar.position.set(xPos, height * 0.5 + 0.25, 0);
      pillar.castShadow = true;
      group.add(pillar);
    });

    // Secondary crossbeam (Nuki)
    const nukiGeo = new THREE.BoxGeometry(span + 1.2, 0.26, 0.32);
    const nuki = new THREE.Mesh(nukiGeo, M.toriiMaterial);
    nuki.position.set(0, height * 0.72, 0);
    nuki.castShadow = true;
    group.add(nuki);

    // Primary curved top lintel beam (Kasagi)
    const kasagiLength = span + 2.4;
    const kasagiGeo = new THREE.BoxGeometry(kasagiLength, 0.38, 0.52);
    const kasagi = new THREE.Mesh(kasagiGeo, M.toriiMaterial);
    kasagi.position.set(0, height + 0.18, 0);
    kasagi.castShadow = true;
    group.add(kasagi);

    // Black top roof cap (Shimaki)
    const capGeo = new THREE.BoxGeometry(kasagiLength + 0.2, 0.12, 0.62);
    const cap = new THREE.Mesh(capGeo, M.toriiBaseMaterial);
    cap.position.set(0, height + 0.42, 0);
    cap.castShadow = true;
    group.add(cap);

    // Winter Snow Blanket on Torii Top Lintel
    const toriiSnow = new THREE.Mesh(new THREE.BoxGeometry(kasagiLength + 0.15, 0.16, 0.64), M.snowRoofMaterial);
    toriiSnow.position.set(0, height + 0.54, 0);
    group.add(toriiSnow);

    // Center plaque
    const plaqueGeo = new THREE.BoxGeometry(0.5, 0.65, 0.22);
    const plaque = new THREE.Mesh(plaqueGeo, M.timberDarkMaterial);
    plaque.position.set(0, (height * 0.72 + height + 0.18) * 0.5, 0);
    group.add(plaque);

    // Sacred Shimenawa Straw Rope with hanging Shide paper zigzags
    const ropeGeo = new THREE.TorusGeometry(span * 0.46, 0.08, 5, 12, Math.PI * 0.75);
    ropeGeo.rotateZ(Math.PI * 0.12);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xccb27a, roughness: 0.85 });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.position.set(0, height * 0.88, 0.12);
    group.add(rope);

    // White zigzag paper streamers (Shide)
    const shideMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    [-1.2, 0, 1.2].forEach(sx => {
      const shideGeo = new THREE.PlaneGeometry(0.24, 0.65);
      const shide = new THREE.Mesh(shideGeo, shideMat);
      shide.position.set(sx, height * 0.62, 0.16);
      shide.rotation.z = (sx === 0 ? 0.05 : -sx * 0.1);
      group.add(shide);
    });

    return group;
  }

  public createShrine(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'shrine_01';

    const M = this.materials;

    // 1. Elevated Stone Plinth
    const plinthW = 6.2;
    const plinthL = 6.8;
    const plinthH = 1.1;
    const plinthGeo = new THREE.BoxGeometry(plinthW, plinthH, plinthL);
    const plinth = new THREE.Mesh(plinthGeo, M.stoneGraniteMaterial);
    plinth.position.y = plinthH * 0.5;
    plinth.receiveShadow = true;
    group.add(plinth);

    // Stone Steps in front
    const stepCount = 4;
    for (let s = 0; s < stepCount; s++) {
      const sw = 2.4;
      const sh = plinthH / stepCount;
      const sl = 0.5;
      const stepGeo = new THREE.BoxGeometry(sw, sh, sl);
      const step = new THREE.Mesh(stepGeo, M.stoneGraniteMaterial);
      step.position.set(0, sh * (s + 0.5), plinthL * 0.5 + (stepCount - 1 - s) * sl + sl * 0.5);
      step.receiveShadow = true;
      group.add(step);
    }

    // 2. Shrine Sanctum (Honden)
    const bldW = 4.4;
    const bldL = 4.8;
    const bldH = 2.6;
    const bldGeo = new THREE.BoxGeometry(bldW, bldH, bldL);
    const bld = new THREE.Mesh(bldGeo, M.timberWarmMaterial);
    bld.position.y = plinthH + bldH * 0.5;
    bld.castShadow = true;
    group.add(bld);

    // Pillars along veranda
    [-bldW * 0.45, bldW * 0.45].forEach(px => {
      const colGeo = new THREE.CylinderGeometry(0.14, 0.14, bldH, 6);
      const col = new THREE.Mesh(colGeo, M.toriiMaterial);
      col.position.set(px, plinthH + bldH * 0.5, bldL * 0.5 + 0.4);
      col.castShadow = true;
      group.add(col);
    });

    // 3. Ornate Curved Roof with Chigi finials
    const roofSpanX = bldW + 2.0;
    const roofSpanZ = bldL + 2.2;
    const roofPitch = 1.9;
    const roofY = plinthH + bldH;

    const slopeLen = Math.sqrt(Math.pow(roofSpanX * 0.5, 2) + Math.pow(roofPitch, 2));
    const slopeAng = Math.atan2(roofPitch, roofSpanX * 0.5);
    const roofGeo = new THREE.BoxGeometry(slopeLen + 0.3, 0.24, roofSpanZ);

    const rLeft = new THREE.Mesh(roofGeo, M.roofTileMaterial);
    rLeft.position.set(-roofSpanX * 0.25, roofY + roofPitch * 0.48, 0);
    rLeft.rotation.z = slopeAng;
    rLeft.castShadow = true;
    group.add(rLeft);

    const rRight = new THREE.Mesh(roofGeo, M.roofTileMaterial);
    rRight.position.set(roofSpanX * 0.25, roofY + roofPitch * 0.48, 0);
    rRight.rotation.z = -slopeAng;
    rRight.castShadow = true;
    group.add(rRight);

    // Winter Snow Blankets on Shrine Roof
    const shrineSnowGeo = new THREE.BoxGeometry(slopeLen + 0.38, 0.2, roofSpanZ + 0.22);
    const sLeft = new THREE.Mesh(shrineSnowGeo, M.snowRoofMaterial);
    sLeft.position.set(-roofSpanX * 0.25, roofY + roofPitch * 0.48 + 0.14, 0);
    sLeft.rotation.z = slopeAng;
    sLeft.castShadow = true;
    group.add(sLeft);

    const sRight = new THREE.Mesh(shrineSnowGeo, M.snowRoofMaterial);
    sRight.position.set(roofSpanX * 0.25, roofY + roofPitch * 0.48 + 0.14, 0);
    sRight.rotation.z = -slopeAng;
    sRight.castShadow = true;
    group.add(sRight);

    const sRidgeSnow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, roofSpanZ + 0.3), M.snowRoofMaterial);
    sRidgeSnow.position.set(0, roofY + roofPitch + 0.22, 0);
    group.add(sRidgeSnow);

    // Chigi (forked roof finials on ridge)
    [-roofSpanZ * 0.42, roofSpanZ * 0.42].forEach(rz => {
      const chigiGeo = new THREE.BoxGeometry(0.12, 1.4, 0.18);
      const chigi1 = new THREE.Mesh(chigiGeo, M.timberWarmMaterial);
      chigi1.position.set(0, roofY + roofPitch + 0.45, rz);
      chigi1.rotation.z = 0.45;
      group.add(chigi1);

      const chigi2 = new THREE.Mesh(chigiGeo, M.timberWarmMaterial);
      chigi2.position.set(0, roofY + roofPitch + 0.45, rz);
      chigi2.rotation.z = -0.45;
      group.add(chigi2);
    });

    // Saisenbako (Offertory donation box)
    const boxGeo = new THREE.BoxGeometry(1.1, 0.65, 0.7);
    const box = new THREE.Mesh(boxGeo, M.timberDarkMaterial);
    box.position.set(0, plinthH + 0.35, bldL * 0.5 + 0.1);
    box.castShadow = true;
    group.add(box);

    return group;
  }

  public createWoodenBridge(length: number = 8.5, width: number = 3.2): THREE.Group {
    const group = new THREE.Group();
    group.name = 'bridge_wood_01';

    const M = this.materials;

    // Arched bridge deck
    const planks = 18;
    const archRadius = length * 1.5;
    const archAngleSpan = length / archRadius;

    for (let i = 0; i < planks; i++) {
      const t = (i / (planks - 1)) - 0.5;
      const angle = t * archAngleSpan;
      const px = Math.sin(angle) * archRadius;
      const py = Math.cos(angle) * archRadius - archRadius + 0.95;

      const plankGeo = new THREE.BoxGeometry(width, 0.16, length / planks + 0.04);
      const plank = new THREE.Mesh(plankGeo, M.timberWarmMaterial);
      plank.position.set(0, py, px);
      plank.rotation.x = angle;
      plank.castShadow = true;
      plank.receiveShadow = true;
      group.add(plank);
    }

    // Side beams / handrails
    [-width * 0.5 + 0.12, width * 0.5 - 0.12].forEach(x => {
      const postCount = 6;
      for (let p = 0; p < postCount; p++) {
        const t = (p / (postCount - 1)) - 0.5;
        const angle = t * archAngleSpan;
        const px = Math.sin(angle) * archRadius;
        const py = Math.cos(angle) * archRadius - archRadius + 0.95;

        const postGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.1, 6);
        const post = new THREE.Mesh(postGeo, M.timberDarkMaterial);
        post.position.set(x, py + 0.55, px);
        post.castShadow = true;
        group.add(post);

        // Giboshi ornamental post caps (brass finials)
        const capGeo = new THREE.SphereGeometry(0.11, 6, 6);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(x, py + 1.15, px);
        group.add(cap);
      }

      // Continuous curved top rail
      const railGeo = new THREE.BoxGeometry(0.18, 0.14, length * 1.02);
      const rail = new THREE.Mesh(railGeo, M.timberDarkMaterial);
      rail.position.set(x, 1.85, 0);
      rail.castShadow = true;
      group.add(rail);
    });

    // Sub-structure trestle piles
    [-length * 0.28, length * 0.28].forEach(pz => {
      [-width * 0.42, width * 0.42].forEach(px => {
        const pileGeo = new THREE.CylinderGeometry(0.18, 0.22, 3.5, 6);
        const pile = new THREE.Mesh(pileGeo, M.timberDarkMaterial);
        pile.position.set(px, 0.2, pz);
        pile.castShadow = true;
        group.add(pile);
      });
    });

    return group;
  }

  public createStoneLantern(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'lantern_01';

    const M = this.materials;

    const baseGeo = new THREE.CylinderGeometry(0.42, 0.55, 0.35, 6);
    const base = new THREE.Mesh(baseGeo, M.stoneLanternMaterial);
    base.position.y = 0.18;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const shaftGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.9, 6);
    const shaft = new THREE.Mesh(shaftGeo, M.stoneLanternMaterial);
    shaft.position.y = 0.8;
    shaft.castShadow = true;
    group.add(shaft);

    const midGeo = new THREE.CylinderGeometry(0.55, 0.35, 0.22, 6);
    const mid = new THREE.Mesh(midGeo, M.stoneLanternMaterial);
    mid.position.y = 1.35;
    mid.castShadow = true;
    group.add(mid);

    const fireGeo = new THREE.BoxGeometry(0.46, 0.42, 0.46);
    const fire = new THREE.Mesh(fireGeo, M.lanternFlameMaterial);
    fire.position.y = 1.66;
    group.add(fire);

    const roofGeo = new THREE.ConeGeometry(0.85, 0.35, 6);
    const roof = new THREE.Mesh(roofGeo, M.stoneLanternMaterial);
    roof.position.y = 2.02;
    roof.castShadow = true;
    group.add(roof);

    // Winter Snow Cap on Stone Lantern
    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(0.88, 0.28, 6), M.snowRoofMaterial);
    snowCap.position.y = 2.14;
    group.add(snowCap);

    const finialGeo = new THREE.SphereGeometry(0.14, 6, 6);
    const finial = new THREE.Mesh(finialGeo, M.stoneLanternMaterial);
    finial.position.y = 2.26;
    group.add(finial);

    return group;
  }

  public createWoodenDock(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'dock_wood_01';

    const M = this.materials;

    const deckGeo = new THREE.BoxGeometry(3.6, 0.2, 6.5);
    const deck = new THREE.Mesh(deckGeo, M.woodPlankMaterial);
    deck.position.y = 0.32;
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    const pilePositions = [
      { x: -1.6, z: -3.0 },
      { x: 1.6, z: -3.0 },
      { x: -1.6, z: 0 },
      { x: 1.6, z: 0 },
      { x: -1.6, z: 3.0 },
      { x: 1.6, z: 3.0 },
    ];

    pilePositions.forEach(p => {
      const pileGeo = new THREE.CylinderGeometry(0.14, 0.16, 2.4, 6);
      const pile = new THREE.Mesh(pileGeo, M.timberDarkMaterial);
      pile.position.set(p.x, -0.4, p.z);
      pile.castShadow = true;
      group.add(pile);
    });

    return group;
  }

  public createFence(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'fence_01';

    const M = this.materials;
    const length = 4.0;
    const height = 1.1;

    [-length * 0.5, 0, length * 0.5].forEach(x => {
      const pGeo = new THREE.CylinderGeometry(0.08, 0.08, height + 0.2, 5);
      const post = new THREE.Mesh(pGeo, M.timberWarmMaterial);
      post.position.set(x, (height + 0.2) * 0.5, 0);
      post.castShadow = true;
      group.add(post);
    });

    [0.35, 0.85].forEach(y => {
      const rGeo = new THREE.BoxGeometry(length + 0.2, 0.06, 0.08);
      const rail = new THREE.Mesh(rGeo, M.timberWarmMaterial);
      rail.position.set(0, y, 0);
      rail.castShadow = true;
      group.add(rail);
    });

    return group;
  }

  public createShishiOdoshi(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'shishi_odoshi';

    // Stone Tsukubai water basin
    const basinGeo = new THREE.CylinderGeometry(0.65, 0.75, 0.55, 8);
    const basin = new THREE.Mesh(basinGeo, this.materials.stoneGraniteMaterial);
    basin.position.y = 0.28;
    basin.castShadow = true;
    group.add(basin);

    // Bamboo spout
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0x7c9456, roughness: 0.7 });
    const spoutGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6);
    const spout = new THREE.Mesh(spoutGeo, bambooMat);
    spout.position.set(0, 0.65, -0.45);
    spout.rotation.x = 0.35;
    group.add(spout);

    return group;
  }

  public createStoneRetainingWall(length: number = 8.0, height: number = 1.6): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ishigaki_wall';

    const stoneMat = this.materials.stoneGraniteMaterial;
    const rows = 3;
    const cols = Math.ceil(length / 1.4);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const sw = 1.1 + (Math.sin(r * 2 + c) * 0.2);
        const sh = height / rows;
        const sl = 0.6 + (Math.cos(r + c * 2) * 0.15);

        const sGeo = new THREE.DodecahedronGeometry(sh * 0.7, 0);
        const sMesh = new THREE.Mesh(sGeo, stoneMat);
        const px = ((c / (cols - 1)) - 0.5) * length;
        const py = (r + 0.5) * sh;
        const pz = (rows - 1 - r) * 0.12; // slight batter incline
        sMesh.position.set(px, py, pz);
        sMesh.scale.set(sw / sh, 1.0, sl / sh);
        sMesh.castShadow = true;
        sMesh.receiveShadow = true;
        group.add(sMesh);
      }
    }

    return group;
  }

  // ==========================================
  // STUDIO GHIBLI HAMLET ARCHITECTURE & ASSETS
  // ==========================================

  /**
   * Half-timbered cottage with honey-gold thatched straw roof,
   * exposed dark oak timber beams, flower boxes, and stone chimney with smoke emitter.
   */
  public createGhibliCottage(variant: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.name = `ghibli_cottage_${variant}`;

    const M = this.materials;
    const isLarge = variant === 0;
    const isMedium = variant === 1;

    const width = isLarge ? 8.2 : isMedium ? 6.8 : 5.6;
    const length = isLarge ? 10.5 : isMedium ? 8.0 : 6.8;
    const wallHeight = 3.4;
    const stoneBaseH = 0.85;

    // 1. Heavy River Stone Foundation Base
    const baseGeo = new THREE.BoxGeometry(width + 0.35, stoneBaseH, length + 0.35);
    const baseMesh = new THREE.Mesh(baseGeo, M.stoneGraniteMaterial);
    baseMesh.position.y = stoneBaseH * 0.5;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // 2. Warm Cream Plaster Walls
    const wallGeo = new THREE.BoxGeometry(width, wallHeight, length);
    const wallMesh = new THREE.Mesh(wallGeo, M.wallCreamMaterial);
    wallMesh.position.y = stoneBaseH + wallHeight * 0.5;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    group.add(wallMesh);

    // 3. Exposed Dark Timber Framing (Half-timbering)
    const timberThick = 0.16;
    const postGeo = new THREE.BoxGeometry(timberThick, wallHeight, timberThick);
    
    // Corner posts
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
      const post = new THREE.Mesh(postGeo, M.timberDarkMaterial);
      post.position.set(sx * (width * 0.5), stoneBaseH + wallHeight * 0.5, sz * (length * 0.5));
      post.castShadow = true;
      group.add(post);
    });

    // Intermediate horizontal & vertical timber framing
    const midRailGeo = new THREE.BoxGeometry(width + 0.05, timberThick, timberThick);
    [-1, 1].forEach(sz => {
      const rail = new THREE.Mesh(midRailGeo, M.timberDarkMaterial);
      rail.position.set(0, stoneBaseH + wallHeight * 0.52, sz * (length * 0.5));
      group.add(rail);

      // Top plate beam
      const topPlate = new THREE.Mesh(midRailGeo, M.timberDarkMaterial);
      topPlate.position.set(0, stoneBaseH + wallHeight, sz * (length * 0.5));
      group.add(topPlate);
    });

    // 4. Thick Honey-Gold Straw Thatched Roof with steep pitch & overhang
    const roofOverhang = 0.95;
    const roofHeight = 3.6;
    const roofBaseY = stoneBaseH + wallHeight - 0.15;

    // Layered thatch roof geometry (multi-step straw layers for handmade feel)
    const roofGeo = new THREE.ConeGeometry((width + roofOverhang * 2) * 0.72, roofHeight, 4);
    roofGeo.rotateY(Math.PI / 4); // Align square pyramid with cottage axes
    roofGeo.scale(1.0, 1.0, length / width);

    const roofMesh = new THREE.Mesh(roofGeo, M.thatchedRoofMaterial);
    roofMesh.position.set(0, roofBaseY + roofHeight * 0.5, 0);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);

    // Winter Snow Blanket on Thatched Cottage Roof
    const snowRoofGeo = new THREE.ConeGeometry((width + roofOverhang * 2 + 0.16) * 0.72, roofHeight * 1.02, 4);
    snowRoofGeo.rotateY(Math.PI / 4);
    snowRoofGeo.scale(1.0, 1.0, length / width);
    const snowRoof = new THREE.Mesh(snowRoofGeo, M.snowRoofMaterial);
    snowRoof.position.set(0, roofBaseY + roofHeight * 0.5 + 0.12, 0);
    snowRoof.castShadow = true;
    snowRoof.receiveShadow = true;
    group.add(snowRoof);

    // Thatch roof underside shadow fringe
    const fringeGeo = new THREE.BoxGeometry(width + roofOverhang * 1.8, 0.35, length + roofOverhang * 1.8);
    const fringeMesh = new THREE.Mesh(fringeGeo, M.thatchedRoofShadowMaterial);
    fringeMesh.position.set(0, roofBaseY + 0.15, 0);
    fringeMesh.castShadow = true;
    group.add(fringeMesh);

    // Timber roof-ridge cross ties along apex
    const ridgeLen = length * 0.7;
    const ridgeCrossGeo = new THREE.BoxGeometry(0.12, 0.65, 0.12);
    const numCrosses = Math.floor(ridgeLen / 1.1);
    for (let c = 0; c <= numCrosses; c++) {
      const zPos = -ridgeLen * 0.5 + (c / numCrosses) * ridgeLen;
      const c1 = new THREE.Mesh(ridgeCrossGeo, M.thatchedRidgeMaterial);
      c1.position.set(-0.12, roofBaseY + roofHeight + 0.12, zPos);
      c1.rotation.z = 0.45;
      group.add(c1);

      const c2 = new THREE.Mesh(ridgeCrossGeo, M.thatchedRidgeMaterial);
      c2.position.set(0.12, roofBaseY + roofHeight + 0.12, zPos);
      c2.rotation.z = -0.45;
      group.add(c2);
    }

    // 5. Stone Chimney with Smoke Emitter Anchor
    const chimneyW = 1.0;
    const chimneyH = 4.6;
    const chimneyX = width * 0.36;
    const chimneyZ = -length * 0.22;

    const chimneyGeo = new THREE.BoxGeometry(chimneyW, chimneyH, chimneyW);
    const chimney = new THREE.Mesh(chimneyGeo, M.chimneyStoneMaterial);
    chimney.position.set(chimneyX, roofBaseY + chimneyH * 0.45, chimneyZ);
    chimney.castShadow = true;
    chimney.receiveShadow = true;
    group.add(chimney);

    // Chimney cap
    const capGeo = new THREE.BoxGeometry(chimneyW + 0.24, 0.22, chimneyW + 0.24);
    const cap = new THREE.Mesh(capGeo, M.chimneyStoneMaterial);
    cap.position.set(chimneyX, chimney.position.y + chimneyH * 0.5 + 0.11, chimneyZ);
    cap.castShadow = true;
    group.add(cap);

    // Winter Chimney Snow Cap
    const chimneySnow = new THREE.Mesh(new THREE.BoxGeometry(chimneyW + 0.32, 0.22, chimneyW + 0.32), M.snowRoofMaterial);
    chimneySnow.position.set(chimneyX, cap.position.y + 0.2, chimneyZ);
    group.add(chimneySnow);

    // Smoke Anchor Object
    const smokeAnchor = new THREE.Object3D();
    smokeAnchor.name = 'chimney_top';
    smokeAnchor.position.set(chimneyX, cap.position.y + 0.25, chimneyZ);
    group.add(smokeAnchor);

    // 6. Wooden Entrance Door & Stone Landing
    const doorGeo = new THREE.BoxGeometry(1.25, 2.2, 0.15);
    const door = new THREE.Mesh(doorGeo, M.timberWarmMaterial);
    door.position.set(0, stoneBaseH + 1.1, length * 0.5 + 0.08);
    door.castShadow = true;
    group.add(door);

    // Stone entrance steps
    const stepGeo = new THREE.BoxGeometry(1.9, 0.3, 0.95);
    const step = new THREE.Mesh(stepGeo, M.stoneGraniteMaterial);
    step.position.set(0, 0.15, length * 0.5 + 0.45);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);

    // 7. Multi-pane Windows with Flower Boxes
    const windowGeo = new THREE.BoxGeometry(1.15, 1.2, 0.1);
    const boxGeo = new THREE.BoxGeometry(1.3, 0.3, 0.35);

    // Left and right facade windows
    [-1, 1].forEach(side => {
      const win = new THREE.Mesh(windowGeo, M.timberDarkMaterial);
      win.position.set(side * (width * 0.32), stoneBaseH + 1.8, length * 0.5 + 0.06);
      group.add(win);

      // Flower box under window
      const fBox = new THREE.Mesh(boxGeo, M.timberWarmMaterial);
      fBox.position.set(side * (width * 0.32), stoneBaseH + 1.1, length * 0.5 + 0.2);
      fBox.castShadow = true;
      group.add(fBox);

      // Colorful flowers inside flower box
      for (let f = 0; f < 5; f++) {
        const flowerMat = f % 2 === 0 ? M.flowerRedMaterial : M.flowerYellowMaterial;
        const flwGeo = new THREE.DodecahedronGeometry(0.12, 0);
        const flw = new THREE.Mesh(flwGeo, flowerMat);
        flw.position.set(
          side * (width * 0.32) + (f - 2) * 0.22,
          fBox.position.y + 0.22,
          fBox.position.z + (Math.sin(f) * 0.05)
        );
        group.add(flw);
      }
    });

    // Variant 0: Add an L-shaped thatched side annex
    if (isLarge) {
      const wingW = 4.8;
      const wingL = 4.8;
      const wingH = 2.7;

      const wingWallGeo = new THREE.BoxGeometry(wingW, wingH, wingL);
      const wingWall = new THREE.Mesh(wingWallGeo, M.wallCreamMaterial);
      wingWall.position.set(-width * 0.5 - wingW * 0.45, stoneBaseH + wingH * 0.5, 0.6);
      wingWall.castShadow = true;
      wingWall.receiveShadow = true;
      group.add(wingWall);

      const wingRoofGeo = new THREE.ConeGeometry(wingW * 0.85, 2.6, 4);
      wingRoofGeo.rotateY(Math.PI / 4);
      const wingRoof = new THREE.Mesh(wingRoofGeo, M.thatchedRoofMaterial);
      wingRoof.position.set(wingWall.position.x, wingWall.position.y + wingH * 0.5 + 1.2, wingWall.position.z);
      wingRoof.castShadow = true;
      group.add(wingRoof);
    }

    return group;
  }

  /**
   * Riverside Watermill with a rotating wooden water wheel on the stream bank.
   */
  public createWatermill(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ghibli_watermill';

    const M = this.materials;
    const millW = 6.4;
    const millL = 8.2;
    const stoneH = 2.4; // Tall stone base next to riverbed
    const timberH = 3.2;

    // 1. Tall Riverbank Stone Mill Base
    const stoneBaseGeo = new THREE.BoxGeometry(millW, stoneH, millL);
    const stoneBase = new THREE.Mesh(stoneBaseGeo, M.stoneGraniteMaterial);
    stoneBase.position.y = stoneH * 0.5;
    stoneBase.castShadow = true;
    stoneBase.receiveShadow = true;
    group.add(stoneBase);

    // 2. Timber Upper Floor
    const upperGeo = new THREE.BoxGeometry(millW - 0.3, timberH, millL - 0.3);
    const upper = new THREE.Mesh(upperGeo, M.wallCreamMaterial);
    upper.position.y = stoneH + timberH * 0.5;
    upper.castShadow = true;
    upper.receiveShadow = true;
    group.add(upper);

    // Timber framing on upper floor
    const timberPlateGeo = new THREE.BoxGeometry(millW, 0.18, millL);
    const timberPlate = new THREE.Mesh(timberPlateGeo, M.timberDarkMaterial);
    timberPlate.position.y = stoneH + timberH;
    group.add(timberPlate);

    // 3. Thatched Roof
    const roofH = 3.4;
    const roofGeo = new THREE.ConeGeometry((millW + 1.4) * 0.72, roofH, 4);
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.scale(1.0, 1.0, millL / millW);
    const roof = new THREE.Mesh(roofGeo, M.thatchedRoofMaterial);
    roof.position.set(0, stoneH + timberH + roofH * 0.48, 0);
    roof.castShadow = true;
    group.add(roof);

    // Winter Thatched Roof Snow Blanket on Millhouse
    const millSnowGeo = new THREE.ConeGeometry((millW + 1.55) * 0.72, roofH * 1.02, 4);
    millSnowGeo.rotateY(Math.PI / 4);
    millSnowGeo.scale(1.0, 1.0, millL / millW);
    const millSnow = new THREE.Mesh(millSnowGeo, M.snowRoofMaterial);
    millSnow.position.set(0, stoneH + timberH + roofH * 0.48 + 0.12, 0);
    millSnow.castShadow = true;
    millSnow.receiveShadow = true;
    group.add(millSnow);

    // Chimney on millhouse
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.8, 0.85), M.chimneyStoneMaterial);
    chimney.position.set(millW * 0.32, stoneH + timberH + 1.8, -millL * 0.25);
    chimney.castShadow = true;
    group.add(chimney);

    // Watermill chimney snow cap
    const millChimneySnow = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.22, 1.05), M.snowRoofMaterial);
    millChimneySnow.position.set(millW * 0.32, stoneH + timberH + 3.75, -millL * 0.25);
    group.add(millChimneySnow);

    const smokeAnchor = new THREE.Object3D();
    smokeAnchor.name = 'chimney_top';
    smokeAnchor.position.set(chimney.position.x, chimney.position.y + 2.0, chimney.position.z);
    group.add(smokeAnchor);

    // 4. Rotating Wooden Water Wheel on River Side (+X side)
    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'water_wheel';
    const wheelRadius = 1.95;
    const wheelWidth = 0.75;
    const wheelPosX = -(millW * 0.5 + wheelWidth * 0.5 + 0.15);
    const wheelPosY = 1.25; // Splashing height right at water surface
    wheelGroup.position.set(wheelPosX, wheelPosY, 0);

    // Central axle
    const axleGeo = new THREE.CylinderGeometry(0.18, 0.18, wheelWidth + 0.6, 8);
    axleGeo.rotateZ(Math.PI / 2);
    const axle = new THREE.Mesh(axleGeo, M.cartWoodMaterial);
    wheelGroup.add(axle);

    // Dual wooden wheel rims (in YZ plane)
    const rimGeo = new THREE.TorusGeometry(wheelRadius, 0.08, 6, 24);
    rimGeo.rotateY(Math.PI / 2);

    [-wheelWidth * 0.45, wheelWidth * 0.45].forEach(xOff => {
      const rim = new THREE.Mesh(rimGeo, M.cartWoodMaterial);
      rim.position.x = xOff;
      rim.castShadow = true;
      wheelGroup.add(rim);
    });

    // 8 Radial Spokes & Wooden Water Buckets / Paddles
    const spokeGeo = new THREE.CylinderGeometry(0.045, 0.045, wheelRadius * 2, 4);
    const paddleGeo = new THREE.BoxGeometry(wheelWidth * 0.95, 0.08, 0.48);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI;
      // Spokes
      const spoke = new THREE.Mesh(spokeGeo, M.cartWoodMaterial);
      spoke.rotation.x = angle;
      wheelGroup.add(spoke);

      // Paddle blades at rim
      const padAngle = (i / 8) * Math.PI * 2;
      const paddle = new THREE.Mesh(paddleGeo, M.cartWoodMaterial);
      paddle.position.set(
        0,
        Math.sin(padAngle) * wheelRadius,
        Math.cos(padAngle) * wheelRadius
      );
      paddle.rotation.x = padAngle;
      paddle.castShadow = true;
      wheelGroup.add(paddle);
    }

    wheelGroup.castShadow = true;
    group.add(wheelGroup);

    // Wooden water trough / sluice feeding the wheel
    const flumeGeo = new THREE.BoxGeometry(wheelWidth + 0.2, 0.35, 4.2);
    const flume = new THREE.Mesh(flumeGeo, M.woodPlankMaterial);
    flume.position.set(wheelPosX, wheelPosY + wheelRadius * 0.85, -2.1);
    flume.rotation.x = 0.08;
    flume.castShadow = true;
    group.add(flume);

    return group;
  }

  /**
   * Village Market Stall / Workshop with red & cream striped canvas awning,
   * display crates filled with apples, cabbages, and rustic wooden barrels.
   */
  public createMarketStall(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ghibli_market_stall';

    const M = this.materials;
    const stallW = 4.2;
    const stallD = 2.6;
    const postH = 2.7;

    // 4 Corner Wooden Posts
    const postGeo = new THREE.CylinderGeometry(0.08, 0.09, postH, 6);
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
      const post = new THREE.Mesh(postGeo, M.cartWoodMaterial);
      post.position.set(sx * (stallW * 0.45), postH * 0.5, sz * (stallD * 0.45));
      post.castShadow = true;
      group.add(post);
    });

    // Market Table / Wooden Countertop
    const counterGeo = new THREE.BoxGeometry(stallW * 0.9, 0.85, stallD * 0.7);
    const counter = new THREE.Mesh(counterGeo, M.woodPlankMaterial);
    counter.position.set(0, 0.45, 0);
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);

    // Slanted Striped Canvas Awning (6 alternating Red and Cream cloth stripes)
    const numStripes = 6;
    const stripeW = (stallW + 0.4) / numStripes;
    const awningLen = stallD + 0.6;

    for (let s = 0; s < numStripes; s++) {
      const mat = s % 2 === 0 ? M.awningRedMaterial : M.awningCreamMaterial;
      const stripeGeo = new THREE.BoxGeometry(stripeW, 0.04, awningLen);
      const stripe = new THREE.Mesh(stripeGeo, mat);
      const px = -stallW * 0.5 + stripeW * 0.5 + s * stripeW;
      stripe.position.set(px, postH + 0.15, 0.1);
      stripe.rotation.x = 0.18; // Slant forward
      stripe.castShadow = true;
      group.add(stripe);
    }

    // Winter Snow Blanket on Market Awning
    const awningSnow = new THREE.Mesh(new THREE.BoxGeometry(stallW + 0.35, 0.1, awningLen + 0.08), M.snowRoofMaterial);
    awningSnow.position.set(0, postH + 0.22, 0.1);
    awningSnow.rotation.x = 0.18;
    group.add(awningSnow);

    // Crates of Apples & Cabbages on Counter
    const crateGeo = new THREE.BoxGeometry(0.85, 0.35, 0.65);
    [-1, 0, 1].forEach(idx => {
      const crate = new THREE.Mesh(crateGeo, M.cartWoodMaterial);
      crate.position.set(idx * 1.1, 0.95, 0);
      crate.castShadow = true;
      group.add(crate);

      // Produce inside
      for (let p = 0; p < 6; p++) {
        const isApple = idx <= 0;
        const prodGeo = new THREE.DodecahedronGeometry(0.12, 0);
        const prodMat = isApple ? M.flowerRedMaterial : M.cabbageHeartMaterial;
        const prod = new THREE.Mesh(prodGeo, prodMat);
        prod.position.set(
          crate.position.x + ((p % 3) - 1) * 0.22,
          crate.position.y + 0.22,
          crate.position.z + (Math.floor(p / 3) - 0.5) * 0.25
        );
        group.add(prod);
      }
    });

    // 2 Wooden Barrels stacked beside the stall
    const barrelGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.95, 8);
    const b1 = new THREE.Mesh(barrelGeo, M.cartWoodMaterial);
    b1.position.set(stallW * 0.55 + 0.3, 0.48, 0);
    b1.castShadow = true;
    group.add(b1);

    const b2 = new THREE.Mesh(barrelGeo, M.cartWoodMaterial);
    b2.position.set(stallW * 0.55 + 0.7, 0.48, -0.6);
    b2.castShadow = true;
    group.add(b2);

    return group;
  }

  /**
   * Golden Wheat Field plot with dense wheat stalks and rustic split-rail wooden fence.
   */
  public createWheatField(width: number = 14, length: number = 18): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ghibli_wheat_field';

    const M = this.materials;

    // Soil base bed
    const bedGeo = new THREE.BoxGeometry(width, 0.12, length);
    const bed = new THREE.Mesh(bedGeo, M.tilledSoilMaterial);
    bed.position.y = 0.06;
    bed.receiveShadow = true;
    group.add(bed);

    // Rows of golden wheat clumps
    const rows = 8;
    const cols = 12;
    const wheatGeo = new THREE.ConeGeometry(0.28, 1.4, 4);
    wheatGeo.rotateY(Math.PI / 4);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wheat = new THREE.Mesh(wheatGeo, (r + c) % 3 === 0 ? M.wheatAmberMaterial : M.wheatMaterial);
        const px = ((c / (cols - 1)) - 0.5) * (width - 1.8) + (Math.sin(r * 3 + c) * 0.2);
        const pz = ((r / (rows - 1)) - 0.5) * (length - 1.8) + (Math.cos(r + c * 2) * 0.2);
        const py = 0.75 + (Math.sin(r + c) * 0.08);
        wheat.position.set(px, py, pz);
        wheat.rotation.z = Math.sin(r * 2 + c) * 0.1;
        wheat.castShadow = true;
        group.add(wheat);
      }
    }

    // Rustic 2-rail split wooden fence enclosing the field
    const postH = 1.1;
    const postGeo = new THREE.CylinderGeometry(0.06, 0.07, postH, 5);
    const railGeoX = new THREE.BoxGeometry(width, 0.08, 0.08);
    const railGeoZ = new THREE.BoxGeometry(0.08, 0.08, length);

    // Perimeter rails
    [-1, 1].forEach(sz => {
      [0.45, 0.85].forEach(ry => {
        const rail = new THREE.Mesh(railGeoX, M.cartWoodMaterial);
        rail.position.set(0, ry, sz * (length * 0.5));
        rail.castShadow = true;
        group.add(rail);
      });
    });

    [-1, 1].forEach(sx => {
      [0.45, 0.85].forEach(ry => {
        const rail = new THREE.Mesh(railGeoZ, M.cartWoodMaterial);
        rail.position.set(sx * (width * 0.5), ry, 0);
        rail.castShadow = true;
        group.add(rail);
      });
    });

    // Fence posts at intervals
    for (let p = 0; p <= 6; p++) {
      const pz = -length * 0.5 + (p / 6) * length;
      [-1, 1].forEach(sx => {
        const post = new THREE.Mesh(postGeo, M.cartWoodMaterial);
        post.position.set(sx * (width * 0.5), postH * 0.5, pz);
        post.castShadow = true;
        group.add(post);
      });
    }

    return group;
  }

  /**
   * Fenced Vegetable Garden with raised dark earth mounds and cabbage rows.
   */
  public createVegetableGarden(width: number = 10, length: number = 12): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ghibli_vegetable_garden';

    const M = this.materials;

    // 4 Raised soil mounds
    const numMounds = 4;
    const moundW = 1.35;
    const moundL = length - 2.4;
    const moundGeo = new THREE.BoxGeometry(moundW, 0.28, moundL);

    for (let m = 0; m < numMounds; m++) {
      const mound = new THREE.Mesh(moundGeo, M.tilledSoilMaterial);
      const mx = ((m / (numMounds - 1)) - 0.5) * (width - 2.8);
      mound.position.set(mx, 0.14, 0);
      mound.receiveShadow = true;
      group.add(mound);

      // Rows of cabbages on this mound
      const cabbagesPerMound = 7;
      for (let c = 0; c < cabbagesPerMound; c++) {
        const cz = -moundL * 0.45 + (c / (cabbagesPerMound - 1)) * (moundL * 0.9);
        const cabGeo = new THREE.DodecahedronGeometry(0.32, 1);
        const cab = new THREE.Mesh(cabGeo, M.cabbageMaterial);
        cab.position.set(mx + (Math.sin(c) * 0.1), 0.38, cz);
        cab.scale.set(1.1, 0.85, 1.1);
        cab.castShadow = true;
        group.add(cab);

        // Lighter heart center
        const heartGeo = new THREE.DodecahedronGeometry(0.18, 0);
        const heart = new THREE.Mesh(heartGeo, M.cabbageHeartMaterial);
        heart.position.set(cab.position.x, 0.44, cab.position.z);
        group.add(heart);
      }
    }

    // Wooden picket perimeter fence with open gate
    const fenceGeo = new THREE.BoxGeometry(0.12, 0.95, 0.05);
    const perimeterPoints: Array<[number, number]> = [];

    // Along top and bottom
    for (let x = -width * 0.5; x <= width * 0.5; x += 0.7) {
      perimeterPoints.push([x, -length * 0.5]);
      if (Math.abs(x) > 1.2) { // Leave 2.4m gate opening in front
        perimeterPoints.push([x, length * 0.5]);
      }
    }
    // Along left and right
    for (let z = -length * 0.5; z <= length * 0.5; z += 0.7) {
      perimeterPoints.push([-width * 0.5, z]);
      perimeterPoints.push([width * 0.5, z]);
    }

    perimeterPoints.forEach(([px, pz]) => {
      const picket = new THREE.Mesh(fenceGeo, M.woodPlankMaterial);
      picket.position.set(px, 0.48, pz);
      picket.castShadow = true;
      group.add(picket);
    });

    return group;
  }

  /**
   * Rustic 2-Wheel Wooden Village Cart / Wagon with spoke wheels and cargo.
   */
  public createVillageCart(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ghibli_village_cart';

    const M = this.materials;
    const wheelR = 0.72;
    const cartW = 1.6;
    const cartL = 2.6;

    // 1. Dual Spoked Wooden Wheels (in YZ plane)
    const wheelGeo = new THREE.TorusGeometry(wheelR, 0.065, 6, 20);
    wheelGeo.rotateY(Math.PI / 2);

    [-cartW * 0.58, cartW * 0.58].forEach(xOff => {
      const wheel = new THREE.Mesh(wheelGeo, M.cartWoodMaterial);
      wheel.position.set(xOff, wheelR, 0);
      wheel.castShadow = true;
      group.add(wheel);

      // Hub & 6 spokes
      const spokeGeo = new THREE.CylinderGeometry(0.025, 0.025, wheelR * 2, 4);
      for (let s = 0; s < 3; s++) {
        const spoke = new THREE.Mesh(spokeGeo, M.cartWoodMaterial);
        spoke.position.set(xOff, wheelR, 0);
        spoke.rotation.x = (s / 3) * Math.PI;
        group.add(spoke);
      }
    });

    // 2. Wooden Axle & Planks Bed
    const axleGeo = new THREE.CylinderGeometry(0.07, 0.07, cartW + 0.35, 6);
    axleGeo.rotateZ(Math.PI / 2);
    const axle = new THREE.Mesh(axleGeo, M.cartWoodMaterial);
    axle.position.set(0, wheelR, 0);
    group.add(axle);

    const bedGeo = new THREE.BoxGeometry(cartW, 0.12, cartL);
    const bed = new THREE.Mesh(bedGeo, M.woodPlankMaterial);
    bed.position.set(0, wheelR + 0.12, 0);
    bed.castShadow = true;
    group.add(bed);

    // Side rails
    [-cartW * 0.48, cartW * 0.48].forEach(xOff => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, cartL), M.woodPlankMaterial);
      rail.position.set(xOff, wheelR + 0.4, 0);
      rail.castShadow = true;
      group.add(rail);
    });

    // Front pulling shafts resting on ground
    const shaftGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.2, 5);
    [-cartW * 0.35, cartW * 0.35].forEach(xOff => {
      const shaft = new THREE.Mesh(shaftGeo, M.cartWoodMaterial);
      shaft.position.set(xOff, wheelR * 0.5, cartL * 0.5 + 0.9);
      shaft.rotation.x = -0.32;
      group.add(shaft);
    });

    // Cargo inside cart (barrel and produce sacks)
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.75, 8), M.cartWoodMaterial);
    barrel.position.set(-0.25, wheelR + 0.52, -0.4);
    barrel.castShadow = true;
    group.add(barrel);

    const sack = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), M.awningCreamMaterial);
    sack.position.set(0.3, wheelR + 0.45, 0.3);
    sack.scale.set(1.1, 0.75, 1.2);
    sack.castShadow = true;
    group.add(sack);

    return group;
  }

  /**
   * Fluffy Miyazaki / Studio Ghibli Cloud-Canopy Tree
   * Made of multi-tiered organic overlapping foliage clumps with three-tone gradient shading.
   */
  public createGhibliTree(variant: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.name = `ghibli_tree_${variant}`;

    const M = this.materials;
    const trunkHeight = 3.4 + variant * 0.6;
    const trunkRadius = 0.42 + variant * 0.08;

    // 1. Organic Curved Trunk & Roots
    const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius * 1.3, trunkHeight, 7);
    const trunk = new THREE.Mesh(trunkGeo, M.treeTrunkMaterial);
    trunk.position.y = trunkHeight * 0.5;
    trunk.rotation.z = (variant === 1 ? -0.06 : 0.05);
    trunk.castShadow = true;
    group.add(trunk);

    // Spreading root flares
    for (let r = 0; r < 4; r++) {
      const angle = (r / 4) * Math.PI * 2;
      const rootGeo = new THREE.ConeGeometry(0.22, 1.2, 5);
      const root = new THREE.Mesh(rootGeo, M.treeTrunkMaterial);
      root.position.set(Math.sin(angle) * 0.55, 0.25, Math.cos(angle) * 0.55);
      root.rotation.x = Math.sin(angle) * 0.65;
      root.rotation.z = Math.cos(angle) * 0.65;
      group.add(root);
    }

    // 2. Multi-Lobed Cloud Canopy Clusters (Bottom = deep shadow, Mid = warm green, Top = lime highlight)
    const canopyBaseY = trunkHeight * 0.85;

    // Lower/underside shade lobes
    const shadeLobeGeo = new THREE.DodecahedronGeometry(1.8, 1);
    const s1 = new THREE.Mesh(shadeLobeGeo, M.broadleafFoliage);
    s1.position.set(-1.2, canopyBaseY + 0.4, 0.8);
    s1.scale.set(1.2, 0.9, 1.1);
    s1.castShadow = true;
    group.add(s1);

    const s2 = new THREE.Mesh(shadeLobeGeo, M.broadleafFoliage);
    s2.position.set(1.3, canopyBaseY + 0.3, -0.6);
    s2.scale.set(1.15, 0.85, 1.2);
    s2.castShadow = true;
    group.add(s2);

    // Mid-tier warm green body lobes
    const midLobeGeo = new THREE.DodecahedronGeometry(2.1, 1);
    const m1 = new THREE.Mesh(midLobeGeo, M.broadleafFoliageLight);
    m1.position.set(0.2, canopyBaseY + 1.4, 0.1);
    m1.scale.set(1.3, 1.05, 1.25);
    m1.castShadow = true;
    group.add(m1);

    const m2 = new THREE.Mesh(midLobeGeo, M.broadleafFoliageLight);
    m2.position.set(-0.9, canopyBaseY + 1.8, -0.9);
    m2.scale.set(1.0, 0.9, 1.05);
    m2.castShadow = true;
    group.add(m2);

    const m3 = new THREE.Mesh(midLobeGeo, M.broadleafFoliageLight);
    m3.position.set(1.1, canopyBaseY + 1.9, 0.9);
    m3.scale.set(1.1, 0.95, 1.0);
    m3.castShadow = true;
    group.add(m3);

    // Top sunlit bright highlight cloud puffs
    const highLobeGeo = new THREE.DodecahedronGeometry(1.6, 1);
    const h1 = new THREE.Mesh(highLobeGeo, M.broadleafHighlightMaterial);
    h1.position.set(0.1, canopyBaseY + 2.8, 0.3);
    h1.scale.set(1.15, 1.0, 1.1);
    h1.castShadow = true;
    group.add(h1);

    const h2 = new THREE.Mesh(highLobeGeo, M.broadleafHighlightMaterial);
    h2.position.set(-0.6, canopyBaseY + 2.5, -0.3);
    h2.scale.set(0.9, 0.85, 0.9);
    h2.castShadow = true;
    group.add(h2);

    return group;
  }

  /**
   * Arched Stone Bridge over the river with paved deck and parapets.
   */
  public createStoneArchBridge(length: number = 9.2, width: number = 3.6): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ghibli_stone_bridge';

    const M = this.materials;
    const archRadius = length * 0.65;

    // Cobblestone walking deck (top face flush at y = 0)
    const deckGeo = new THREE.BoxGeometry(width, 0.45, length);
    const deck = new THREE.Mesh(deckGeo, M.cobblestoneMaterial);
    deck.position.y = -0.225;
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Stone arch ring under the deck
    const archGeo = new THREE.TorusGeometry(archRadius, 0.5, 6, 20, Math.PI * 0.42);
    archGeo.rotateY(Math.PI / 2);
    archGeo.rotateZ(Math.PI * 0.29);

    [-width * 0.42, width * 0.42].forEach(xOff => {
      const arch = new THREE.Mesh(archGeo, M.stoneGraniteMaterial);
      arch.position.set(xOff, -archRadius * 0.85 - 0.225, 0);
      arch.castShadow = true;
      group.add(arch);
    });

    // Solid stone abutment foundations embedded in riverbanks
    [-1, 1].forEach(sz => {
      const abutmentGeo = new THREE.BoxGeometry(width + 0.5, 3.4, 1.6);
      const abutment = new THREE.Mesh(abutmentGeo, M.stoneGraniteMaterial);
      abutment.position.set(0, -1.7, sz * (length * 0.5 - 0.6));
      abutment.castShadow = true;
      abutment.receiveShadow = true;
      group.add(abutment);
    });

    // Left and right stone parapet railings
    const paraH = 0.95;
    const paraThick = 0.35;
    const paraGeo = new THREE.BoxGeometry(paraThick, paraH, length + 0.4);

    [-width * 0.5 + paraThick * 0.5, width * 0.5 - paraThick * 0.5].forEach(xOff => {
      const para = new THREE.Mesh(paraGeo, M.stoneGraniteMaterial);
      para.position.set(xOff, paraH * 0.5, 0);
      para.castShadow = true;
      group.add(para);

      // Stone newel posts on ends
      [-1, 1].forEach(sz => {
        const postGeo = new THREE.BoxGeometry(paraThick + 0.15, paraH + 0.25, paraThick + 0.15);
        const post = new THREE.Mesh(postGeo, M.stoneGraniteMaterial);
        post.position.set(xOff, (paraH + 0.25) * 0.5, sz * (length * 0.5 + 0.2));
        post.castShadow = true;
        group.add(post);
      });
    });

    return group;
  }
}
