import * as THREE from 'three';
import { TerrainQuery } from '../types';
import { PlayerController } from './PlayerController';
import { AssetGenerator } from '../environment/AssetGenerator';
import { ModelLoader } from '../world/ModelLoader';

export class Player {
  public mesh: THREE.Group;
  public position = new THREE.Vector3();
  public velocity = new THREE.Vector3();
  public controller: PlayerController;
  private assetGen: AssetGenerator;
  
  // Animated body parts
  private bodyGroup: THREE.Group;
  private headGroup: THREE.Group;
  private torso!: THREE.Group;
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private hat!: THREE.Group;
  private bicycle!: THREE.Group;

  private walkCycle = 0;
  private targetAngle = 0;
  private currentAngle = 0;
  private walkSpeed = 5.6;    // m/s walking speed
  private bicycleSpeed = 10.8; // m/s swift bicycle cruising speed
  private accel = 18.0;
  private friction = 12.0;

  public isRidingBicycle = false;
  public onFootstep?: (isStone: boolean) => void;
  private lastStepSign = 0;

  constructor(controller: PlayerController, assetGen: AssetGenerator) {
    this.controller = controller;
    this.assetGen = assetGen;
    this.mesh = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.headGroup = new THREE.Group();

    this.buildCharacterMesh();
    this.mesh.add(this.bodyGroup);

    // Build and attach bicycle model (starts hidden, faces -Z forward with character)
    this.bicycle = this.assetGen.createBicycleModel();
    this.bicycle.visible = false;
    this.bicycle.position.set(0, 0, 0);
    this.bicycle.rotation.y = Math.PI;
    this.bodyGroup.add(this.bicycle);

    // Load and bind Blender-modeled Chibi Samurai GLB
    this.loadBlenderModel();
  }

  private torsoBase = new THREE.Vector3(0, 0.65, 0);
  private headBase = new THREE.Vector3(0, 0.96, 0);
  private leftArmBase = new THREE.Vector3(0.28, 0.86, 0);
  private rightArmBase = new THREE.Vector3(-0.28, 0.86, 0);
  private leftLegBase = new THREE.Vector3(0.14, 0.42, 0);
  private rightLegBase = new THREE.Vector3(-0.14, 0.42, 0);

  private loadBlenderModel(): void {
    const v = Date.now();
    ModelLoader.getInstance()
      .load(`/models/chibi_samurai.glb?v=${v}`)
      .then((gltfScene) => {
        // Remove procedural character parts, preserving the bicycle
        this.bodyGroup.remove(this.torso);
        this.bodyGroup.remove(this.headGroup);
        this.bodyGroup.remove(this.leftArm);
        this.bodyGroup.remove(this.rightArm);
        this.bodyGroup.remove(this.leftLeg);
        this.bodyGroup.remove(this.rightLeg);

        // Add the intact GLB scene directly to bodyGroup (pristine local coordinates)
        this.bodyGroup.add(gltfScene);

        // Rebind animated joint references directly to GLB nodes
        const bTorso = gltfScene.getObjectByName('Torso') as THREE.Group;
        const bHead = gltfScene.getObjectByName('HeadGroup') as THREE.Group;
        const bLeftArm = gltfScene.getObjectByName('LeftArm') as THREE.Group;
        const bRightArm = gltfScene.getObjectByName('RightArm') as THREE.Group;
        const bLeftLeg = gltfScene.getObjectByName('LeftLeg') as THREE.Group;
        const bRightLeg = gltfScene.getObjectByName('RightLeg') as THREE.Group;

        if (bTorso) {
          this.torso = bTorso;
          this.torsoBase.copy(bTorso.position);
        }
        if (bHead) {
          this.headGroup = bHead;
          this.headBase.copy(bHead.position);
        }
        if (bLeftArm) {
          this.leftArm = bLeftArm;
          this.leftArmBase.copy(bLeftArm.position);
        }
        if (bRightArm) {
          this.rightArm = bRightArm;
          this.rightArmBase.copy(bRightArm.position);
        }
        if (bLeftLeg) {
          this.leftLeg = bLeftLeg;
          this.leftLegBase.copy(bLeftLeg.position);
        }
        if (bRightLeg) {
          this.rightLeg = bRightLeg;
          this.rightLegBase.copy(bRightLeg.position);
        }

        gltfScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      })
      .catch((err) => {
        console.warn('Using procedural Chibi Samurai fallback:', err);
      });
  }

  public isSeatedOnBench = false;
  private seatedBenchPos = new THREE.Vector3();
  private seatedFaceAngle = 0;

  public mountBicycle(): void {
    if (this.isSeatedOnBench) this.standUpFromBench();
    this.isRidingBicycle = true;
    this.bicycle.visible = true;
  }

  public dismountBicycle(): void {
    this.isRidingBicycle = false;
    this.bicycle.visible = false;
  }

  public sitOnBench(benchPosition: THREE.Vector3, faceAngle: number): void {
    if (this.isRidingBicycle) {
      this.dismountBicycle();
    }
    this.isSeatedOnBench = true;
    this.seatedBenchPos.copy(benchPosition);
    this.seatedFaceAngle = faceAngle;
    this.position.copy(benchPosition);
    this.mesh.position.copy(benchPosition);
    this.mesh.rotation.y = faceAngle;
    this.currentAngle = faceAngle;
    this.targetAngle = faceAngle;
    this.velocity.set(0, 0, 0);
  }

  public standUpFromBench(): void {
    this.isSeatedOnBench = false;
    this.position.z += 0.9;
    this.mesh.position.copy(this.position);
  }

  private buildCharacterMesh(): void {
    // 1. Material Palette - Designer Chibi Samurai Vinyl Toy (Reference 1 & 2)
    const blackVinylMat = new THREE.MeshStandardMaterial({
      color: 0x181a1e,
      roughness: 0.52,
      metalness: 0.02,
      flatShading: true,
    });

    const darkArmorMat = new THREE.MeshStandardMaterial({
      color: 0x121316,
      roughness: 0.46,
      metalness: 0.08,
      flatShading: true,
    });

    const silverHornMat = new THREE.MeshStandardMaterial({
      color: 0xeef2f8,
      roughness: 0.16,
      metalness: 0.94,
      flatShading: true,
    });

    const silverTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde6,
      roughness: 0.22,
      metalness: 0.88,
      flatShading: true,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf5be38,
      roughness: 0.20,
      metalness: 0.90,
      flatShading: true,
    });

    const crimsonMat = new THREE.MeshStandardMaterial({
      color: 0xd3231e,
      roughness: 0.42,
      metalness: 0.02,
      flatShading: true,
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf6f7fa,
      roughness: 0.30,
      metalness: 0.02,
      flatShading: true,
    });

    // 2. TORSO & SAMURAI ARMOR (Dō)
    this.torso = new THREE.Group();
    this.torso.position.copy(this.torsoBase);

    // Inner black vinyl body
    const innerRobeGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.42, 12);
    const innerRobe = new THREE.Mesh(innerRobeGeo, blackVinylMat);
    this.torso.add(innerRobe);

    // Dō Cuirass: Front breastplate
    const frontDoGeo = new THREE.BoxGeometry(0.48, 0.46, 0.24);
    const frontDo = new THREE.Mesh(frontDoGeo, darkArmorMat);
    frontDo.position.set(0, 0.02, 0.11);
    this.torso.add(frontDo);

    // Front horizontal armor lamellar segment ridges
    const ribGeo = new THREE.BoxGeometry(0.46, 0.04, 0.26);
    const rib1 = new THREE.Mesh(ribGeo, darkArmorMat);
    rib1.position.set(0, 0.08, 0.11);
    this.torso.add(rib1);
    const rib2 = new THREE.Mesh(ribGeo, darkArmorMat);
    rib2.position.set(0, -0.04, 0.11);
    this.torso.add(rib2);

    // Agemaki chest knot (ties at chest collar)
    const knotGeo = new THREE.BoxGeometry(0.10, 0.08, 0.05);
    const knot = new THREE.Mesh(knotGeo, crimsonMat);
    knot.position.set(0, 0.14, 0.20);
    this.torso.add(knot);

    const tieGeo = new THREE.BoxGeometry(0.035, 0.12, 0.02);
    const leftTie = new THREE.Mesh(tieGeo, crimsonMat);
    leftTie.position.set(0.035, 0.06, 0.20);
    leftTie.rotation.z = -0.25;
    this.torso.add(leftTie);

    const rightTie = new THREE.Mesh(tieGeo, crimsonMat);
    rightTie.position.set(-0.035, 0.06, 0.20);
    rightTie.rotation.z = 0.25;
    this.torso.add(rightTie);

    // Dō Cuirass: Back plate
    const backDoGeo = new THREE.BoxGeometry(0.44, 0.38, 0.18);
    const backDo = new THREE.Mesh(backDoGeo, darkArmorMat);
    backDo.position.set(0, 0.02, -0.10);
    this.torso.add(backDo);

    // Thick Obi Waist Belt
    const obiGeo = new THREE.CylinderGeometry(0.40, 0.41, 0.12, 12);
    const obi = new THREE.Mesh(obiGeo, darkArmorMat);
    obi.position.y = -0.14;
    this.torso.add(obi);

    // Front waist cord knot
    const beltKnotGeo = new THREE.BoxGeometry(0.10, 0.06, 0.06);
    const beltKnot = new THREE.Mesh(beltKnotGeo, blackVinylMat);
    beltKnot.position.set(0, -0.14, 0.21);
    this.torso.add(beltKnot);

    // Front hanging apron/banner cloth (chibi samurai crimson banner)
    const bannerGeo = new THREE.BoxGeometry(0.18, 0.24, 0.03);
    const banner = new THREE.Mesh(bannerGeo, crimsonMat);
    banner.position.set(0, -0.24, 0.21);
    this.torso.add(banner);

    const bannerEmblemGeo = new THREE.BoxGeometry(0.07, 0.07, 0.035);
    const bannerEmblem = new THREE.Mesh(bannerEmblemGeo, whiteMat);
    bannerEmblem.position.set(0, -0.22, 0.21);
    this.torso.add(bannerEmblem);

    // Kusazuri: Tiered hip skirt tassets
    const createTasset = (w: number, h: number, d: number) => {
      const g = new THREE.Group();
      const plate1 = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.85, d), darkArmorMat);
      plate1.position.y = 0;
      g.add(plate1);
      const silverTrim = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.025, d * 1.05), silverTrimMat);
      silverTrim.position.set(0, -h * 0.42, 0.005);
      g.add(silverTrim);
      return g;
    };

    const tassetFrontL = createTasset(0.15, 0.22, 0.04);
    tassetFrontL.position.set(0.12, -0.22, 0.16);
    tassetFrontL.rotation.set(0.14, 0.15, 0);
    this.torso.add(tassetFrontL);

    const tassetFrontR = createTasset(0.15, 0.22, 0.04);
    tassetFrontR.position.set(-0.12, -0.22, 0.16);
    tassetFrontR.rotation.set(0.14, -0.15, 0);
    this.torso.add(tassetFrontR);

    const tassetSideL = createTasset(0.16, 0.22, 0.04);
    tassetSideL.position.set(0.22, -0.22, 0);
    tassetSideL.rotation.set(0, 0, -0.15);
    this.torso.add(tassetSideL);

    const tassetSideR = createTasset(0.16, 0.22, 0.04);
    tassetSideR.position.set(-0.22, -0.22, 0);
    tassetSideR.rotation.set(0, 0, 0.15);
    this.torso.add(tassetSideR);

    const tassetBack = createTasset(0.28, 0.22, 0.04);
    tassetBack.position.set(0, -0.22, -0.16);
    tassetBack.rotation.set(-0.12, 0, 0);
    this.torso.add(tassetBack);

    // Sheathed Katana in Saya (worn diagonally at left hip)
    const katanaGroup = new THREE.Group();
    katanaGroup.position.set(0.24, -0.12, 0.04);
    katanaGroup.rotation.set(0.35, 0.12, -0.26);

    const scabbardGeo = new THREE.BoxGeometry(0.04, 0.72, 0.03);
    const scabbard = new THREE.Mesh(scabbardGeo, blackVinylMat);
    scabbard.position.y = -0.18;
    katanaGroup.add(scabbard);

    const scabbardTipGeo = new THREE.BoxGeometry(0.042, 0.07, 0.032);
    const scabbardTip = new THREE.Mesh(scabbardTipGeo, silverTrimMat);
    scabbardTip.position.y = -0.52;
    katanaGroup.add(scabbardTip);

    const tsubaGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12);
    const tsuba = new THREE.Mesh(tsubaGeo, silverHornMat);
    tsuba.position.y = 0.18;
    katanaGroup.add(tsuba);

    const hiltGeo = new THREE.CylinderGeometry(0.032, 0.035, 0.22, 8);
    const hilt = new THREE.Mesh(hiltGeo, darkArmorMat);
    hilt.position.y = 0.29;
    katanaGroup.add(hilt);

    const kashiraGeo = new THREE.CylinderGeometry(0.036, 0.035, 0.035, 8);
    const kashira = new THREE.Mesh(kashiraGeo, silverTrimMat);
    kashira.position.y = 0.40;
    katanaGroup.add(kashira);

    this.torso.add(katanaGroup);
    this.bodyGroup.add(this.torso);

    // 3. HEAD, MENPO MASK & KABUTO SAMURAI HELMET
    this.headGroup = new THREE.Group();
    this.headGroup.position.copy(this.headBase);

    // Chibi rounded head
    const headGeo = new THREE.SphereGeometry(0.31, 20, 16);
    const head = new THREE.Mesh(headGeo, blackVinylMat);
    head.position.set(0, 0.14, 0);
    this.headGroup.add(head);

    // Menpo: Lower face armor mask
    const menpoJawGeo = new THREE.BoxGeometry(0.38, 0.16, 0.22);
    const menpoJaw = new THREE.Mesh(menpoJawGeo, darkArmorMat);
    menpoJaw.position.set(0, 0.04, 0.14);
    this.headGroup.add(menpoJaw);

    // Horizontal silver mask slits
    for (let i = 0; i < 3; i++) {
      const slitGeo = new THREE.BoxGeometry(0.12 - i * 0.02, 0.015, 0.02);
      const slit = new THREE.Mesh(slitGeo, silverTrimMat);
      slit.position.set(0, 0.08 - i * 0.04, 0.25);
      this.headGroup.add(slit);
    }

    // Kabuto Helmet Group (assigned to this.hat)
    this.hat = new THREE.Group();

    // Hachi: Hemispherical dome bowl
    const hachiGeo = new THREE.SphereGeometry(0.36, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.54);
    const hachi = new THREE.Mesh(hachiGeo, blackVinylMat);
    hachi.position.set(0, 0.16, 0);
    this.hat.add(hachi);

    // Tehen-no-kanamono: apex crown fixture
    const tehenGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.04, 10);
    const tehen = new THREE.Mesh(tehenGeo, silverHornMat);
    tehen.position.set(0, 0.53, 0);
    this.hat.add(tehen);

    // Mabizashi: Curved brow visor
    const mabizashiGeo = new THREE.CylinderGeometry(0.37, 0.38, 0.035, 16, 1, false, Math.PI * 0.18, Math.PI * 0.64);
    const mabizashi = new THREE.Mesh(mabizashiGeo, blackVinylMat);
    mabizashi.position.set(0, 0.16, 0.16);
    mabizashi.rotation.x = 0.20;
    this.hat.add(mabizashi);

    const visorTrimGeo = new THREE.CylinderGeometry(0.375, 0.385, 0.015, 16, 1, false, Math.PI * 0.18, Math.PI * 0.64);
    const visorTrim = new THREE.Mesh(visorTrimGeo, silverTrimMat);
    visorTrim.position.set(0, 0.15, 0.17);
    visorTrim.rotation.x = 0.20;
    this.hat.add(visorTrim);

    // Kuwagata: Forehead Medallion
    const haraidateGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.02, 12);
    haraidateGeo.rotateX(Math.PI / 2);
    const haraidate = new THREE.Mesh(haraidateGeo, silverHornMat);
    haraidate.position.set(0, 0.28, 0.28);
    this.hat.add(haraidate);

    const jewelGeo = new THREE.SphereGeometry(0.028, 8, 8);
    const jewel = new THREE.Mesh(jewelGeo, goldMat);
    jewel.position.set(0, 0.28, 0.30);
    this.hat.add(jewel);

    // Sweeping Kuwagata horn shape
    const hornShape = new THREE.Shape();
    hornShape.moveTo(0, 0);
    hornShape.lineTo(0.05, 0.03);
    hornShape.quadraticCurveTo(0.18, 0.22, 0.32, 0.42);
    hornShape.lineTo(0.24, 0.44);
    hornShape.quadraticCurveTo(0.12, 0.25, 0, 0.08);
    hornShape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.020,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.004,
      bevelThickness: 0.004,
    };

    const hornGeo = new THREE.ExtrudeGeometry(hornShape, extrudeSettings);

    const leftHorn = new THREE.Mesh(hornGeo, silverHornMat);
    leftHorn.position.set(0.03, 0.28, 0.28);
    leftHorn.rotation.set(-0.10, 0.14, 0);
    this.hat.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, silverHornMat);
    rightHorn.position.set(-0.03, 0.28, 0.28);
    rightHorn.scale.set(-1, 1, 1);
    rightHorn.rotation.set(-0.10, -0.14, 0);
    this.hat.add(rightHorn);

    // Shikoro: Cascading neck guard plates
    const shikoroTier1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.40, 0.06, 14, 1, true, Math.PI * 0.70, Math.PI * 1.60),
      blackVinylMat
    );
    shikoroTier1.position.set(0, 0.12, -0.04);
    this.hat.add(shikoroTier1);

    const shikoroTier2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.41, 0.43, 0.06, 14, 1, true, Math.PI * 0.70, Math.PI * 1.60),
      darkArmorMat
    );
    shikoroTier2.position.set(0, 0.05, -0.05);
    this.hat.add(shikoroTier2);

    const shikoroGoldTrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.45, 0.015, 14, 1, true, Math.PI * 0.70, Math.PI * 1.60),
      silverTrimMat
    );
    shikoroGoldTrim.position.set(0, -0.01, -0.06);
    this.hat.add(shikoroGoldTrim);

    this.headGroup.add(this.hat);
    this.bodyGroup.add(this.headGroup);

    // 4. ARMS & SODE (SHOULDER ARMOR)
    const createArm = (isLeft: boolean) => {
      const armGroup = new THREE.Group();
      const sign = isLeft ? 1 : -1;

      // Shoulder ball joint
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 8), darkArmorMat);
      armGroup.add(ball);

      // Upper arm sleeve
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 8), blackVinylMat);
      upperArm.position.y = -0.08;
      armGroup.add(upperArm);

      // Sode: Tiered shoulder armor pad
      const sodeGroup = new THREE.Group();
      sodeGroup.position.set(sign * 0.08, 0.02, 0);
      sodeGroup.rotation.z = sign * -0.14;

      for (let i = 0; i < 3; i++) {
        const sodePlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.06), darkArmorMat);
        sodePlate.position.set(sign * (i * 0.02), -i * 0.05, 0);
        sodeGroup.add(sodePlate);

        const sodeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.165, 0.012), silverTrimMat);
        sodeTrim.position.set(sign * (i * 0.02), -i * 0.05 - 0.028, 0);
        sodeGroup.add(sodeTrim);
      }
      armGroup.add(sodeGroup);

      // Kote: Forearm gauntlet
      const kote = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.095, 0.18, 8), darkArmorMat);
      kote.position.y = -0.22;
      armGroup.add(kote);

      // Hand/Fist
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), blackVinylMat);
      hand.position.y = -0.34;
      armGroup.add(hand);

      return armGroup;
    };

    this.leftArm = createArm(true);
    this.leftArm.position.copy(this.leftArmBase);
    this.bodyGroup.add(this.leftArm);

    this.rightArm = createArm(false);
    this.rightArm.position.copy(this.rightArmBase);
    this.bodyGroup.add(this.rightArm);

    // 5. LEGS & FOOTWEAR (HAKAMA & SUNEATE SHIN GUARDS)
    const createLeg = () => {
      const legGroup = new THREE.Group();

      // Hip ball joint
      const hipBall = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 8), darkArmorMat);
      legGroup.add(hipBall);

      // Hakama thigh
      const hakama = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.15, 8), blackVinylMat);
      hakama.position.y = -0.07;
      legGroup.add(hakama);

      // Suneate shin guard
      const suneate = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.11, 0.17, 8), darkArmorMat);
      suneate.position.y = -0.20;
      legGroup.add(suneate);

      // Silver ring
      const ringGeo = new THREE.TorusGeometry(0.11, 0.012, 4, 10);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, silverTrimMat);
      ring.position.y = -0.20;
      legGroup.add(ring);

      // Chunky Vinyl Samurai Boot (grounded at local Z = -0.42 => World Z = 0)
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.19, 0.09), blackVinylMat);
      boot.position.set(0, -0.36, 0.02);
      legGroup.add(boot);

      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.20, 0.02), darkArmorMat);
      sole.position.set(0, -0.41, 0.02);
      legGroup.add(sole);

      return legGroup;
    };

    this.leftLeg = createLeg();
    this.leftLeg.position.copy(this.leftLegBase);
    this.bodyGroup.add(this.leftLeg);

    this.rightLeg = createLeg();
    this.rightLeg.position.copy(this.rightLegBase);
    this.bodyGroup.add(this.rightLeg);

    // Enable shadows on all child meshes
    this.bodyGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  public update(delta: number, terrain: TerrainQuery): void {
    const inputDir = this.controller.update();
    const isMoving = inputDir.lengthSq() > 0.001;

    // If seated on the viewpoint observation bench
    if (this.isSeatedOnBench) {
      if (isMoving) {
        this.standUpFromBench();
      } else {
        this.position.copy(this.seatedBenchPos);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.seatedFaceAngle;
        this.velocity.set(0, 0, 0);

        // Relaxed upright seated posture on the wooden bench
        this.torso.position.set(0, 0.48, 0);
        this.torso.rotation.x = 0;
        this.headGroup.position.set(0, 0.78, 0);
        this.headGroup.rotation.x = 0;

        // Arms resting gently on lap
        this.leftArm.position.set(0.24, 0.68, 0.08);
        this.leftArm.rotation.set(-0.75, 0.20, -0.15);
        this.rightArm.position.set(-0.24, 0.68, 0.08);
        this.rightArm.rotation.set(-0.75, -0.20, 0.15);

        // Legs bent down over the front edge of the bench
        this.leftLeg.position.set(0.13, 0.32, 0.14);
        this.leftLeg.rotation.set(-1.40, 0, 0);
        this.rightLeg.position.set(-0.13, 0.32, 0.14);
        this.rightLeg.rotation.set(-1.40, 0, 0);

        this.bodyGroup.rotation.z = 0;
        this.bicycle.visible = false;
        return;
      }
    }

    const isBicycle = this.isRidingBicycle;

    // Ensure bicycle visibility matches riding state
    this.bicycle.visible = isBicycle;

    const currentMaxSpeed = isBicycle ? this.bicycleSpeed : this.walkSpeed;
    const currentAccel = isBicycle ? 22.0 : this.accel;

    // Movement physics with acceleration and deceleration
    if (isMoving) {
      this.velocity.x += inputDir.x * currentAccel * delta;
      this.velocity.z += inputDir.z * currentAccel * delta;

      const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
      if (currentSpeed > currentMaxSpeed) {
        const factor = currentMaxSpeed / currentSpeed;
        this.velocity.x *= factor;
        this.velocity.z *= factor;
      }

      this.targetAngle = Math.atan2(-inputDir.x, -inputDir.z);
    } else {
      const frictionDelta = this.friction * delta;
      const speed = Math.hypot(this.velocity.x, this.velocity.z);
      if (speed > frictionDelta) {
        const factor = (speed - frictionDelta) / speed;
        this.velocity.x *= factor;
        this.velocity.z *= factor;
      } else {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    }

    // Proposed new position
    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;

    if (terrain.isWalkable(nextX, nextZ)) {
      this.position.x = nextX;
      this.position.z = nextZ;
    } else {
      if (terrain.isWalkable(nextX, this.position.z)) {
        this.position.x = nextX;
        this.velocity.z = 0;
      } else if (terrain.isWalkable(this.position.x, nextZ)) {
        this.position.z = nextZ;
        this.velocity.x = 0;
      } else {
        this.velocity.set(0, 0, 0);
      }
    }

    // Terrain height following
    const groundY = terrain.getHeightAt(this.position.x, this.position.z);
    this.position.y = groundY;
    this.mesh.position.copy(this.position);

    // Robust shortest-arc angle difference normalization (-PI to +PI)
    // Eliminates sudden 180-degree jitter/oscillation on back button press
    let diff = Math.atan2(Math.sin(this.targetAngle - this.currentAngle), Math.cos(this.targetAngle - this.currentAngle));
    this.currentAngle += diff * (isBicycle ? 7.5 : 12.0) * delta;
    this.bodyGroup.rotation.y = this.currentAngle;

    const speed = Math.hypot(this.velocity.x, this.velocity.z);

    // If on bicycle and pressing opposite to current movement, brake smoothly
    if (isBicycle && speed > 1.2 && isMoving) {
      const dot = (this.velocity.x * inputDir.x + this.velocity.z * inputDir.z) / speed;
      if (dot < -0.3) {
        this.velocity.multiplyScalar(Math.max(0, 1.0 - 9.0 * delta));
      }
    }

    // Animated Poses: Bicycle Riding vs Walking
    if (isBicycle) {
      // 1. RIDING BICYCLE POSE (Seated squarely on vintage saddle at Y=0.60, Z=0.14)
      this.torso.position.set(0, 0.66, 0.14);
      this.torso.rotation.x = -0.18; // Athletic forward lean toward handlebars

      // Head sits above tilted torso looking forward down the road
      this.headGroup.position.set(0, 0.96, 0.08);
      this.headGroup.rotation.x = -0.06;

      // Arms reaching forward to grip swept-back handlebars firmly
      this.leftArm.position.set(0.24, 0.84, 0.05);
      this.leftArm.rotation.set(1.05, 0.12, -0.10);
      this.rightArm.position.set(-0.24, 0.84, 0.05);
      this.rightArm.rotation.set(1.05, -0.12, 0.10);

      // Tuck kickstand up flush while riding
      const kickstand = this.bicycle.getObjectByName('kickstand');
      if (kickstand) kickstand.rotation.z = 0.05;

      // Rotate bicycle wheels based on ground velocity (forward rolling in YZ plane)
      const rearWheel = this.bicycle.getObjectByName('rear_wheel');
      const frontWheel = this.bicycle.getObjectByName('front_wheel');
      const crank = this.bicycle.getObjectByName('crank_assembly');
      const wheelRot = (speed / 0.34) * delta;
      if (rearWheel) rearWheel.rotation.x = (rearWheel.rotation.x + wheelRot) % (Math.PI * 2);
      if (frontWheel) frontWheel.rotation.x = (frontWheel.rotation.x + wheelRot) % (Math.PI * 2);

      // Natural forward circular pedaling motion
      if (speed > 0.1) {
        this.walkCycle += speed * delta * 5.5;
        const pedalAngle = this.walkCycle;
        if (crank) crank.rotation.x = -pedalAngle;

        this.leftLeg.position.set(0.13, 0.52, 0.12);
        this.rightLeg.position.set(-0.13, 0.52, 0.12);

        const pedalStroke = Math.cos(pedalAngle) * 0.34;
        this.leftLeg.rotation.set(0.65 + pedalStroke, 0, -0.06);
        this.rightLeg.rotation.set(0.65 - pedalStroke, 0, 0.06);
      } else {
        // Idling on bicycle: left foot resting down towards ground, right foot on forward pedal
        this.leftLeg.position.set(0.16, 0.46, 0.08);
        this.leftLeg.rotation.set(0.22, 0, -0.24);
        this.rightLeg.position.set(-0.13, 0.52, 0.12);
        this.rightLeg.rotation.set(0.74, 0, 0.05);
      }

      // Dynamic cornering banking tilt
      const bank = THREE.MathUtils.clamp(diff * (speed / currentMaxSpeed) * 0.45, -0.18, 0.18);
      this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, -bank, 8 * delta);
      this.bodyGroup.position.y = 0;

    } else {
      // 2. WALKING POSE
      this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, 0, 10 * delta);
      this.torso.position.copy(this.torsoBase);
      this.torso.rotation.x = 0;
      this.headGroup.position.copy(this.headBase);
      this.headGroup.rotation.x = 0;

      this.leftArm.position.copy(this.leftArmBase);
      this.rightArm.position.copy(this.rightArmBase);
      this.leftLeg.position.copy(this.leftLegBase);
      this.rightLeg.position.copy(this.rightLegBase);

      if (speed > 0.2) {
        this.walkCycle += speed * delta * 7.5;
        const legSwing = Math.sin(this.walkCycle) * 0.50;
        const armSwing = Math.sin(this.walkCycle) * 0.40;
        const bob = Math.abs(Math.sin(this.walkCycle)) * 0.05;

        // Trigger realistic footstep audio on ground impact
        const currentSin = Math.sin(this.walkCycle);
        if (currentSin > 0.82 && this.lastStepSign !== 1) {
          this.lastStepSign = 1;
          this.onFootstep?.(false);
        } else if (currentSin < -0.82 && this.lastStepSign !== -1) {
          this.lastStepSign = -1;
          this.onFootstep?.(false);
        }

        this.leftLeg.rotation.x = legSwing;
        this.rightLeg.rotation.x = -legSwing;
        this.leftArm.rotation.x = -armSwing;
        this.rightArm.rotation.x = armSwing;
        this.bodyGroup.position.y = bob;
        this.headGroup.rotation.z = Math.sin(this.walkCycle * 0.5) * 0.04;
      } else {
        this.lastStepSign = 0;
        this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 8 * delta);
        this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 8 * delta);
        this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 8 * delta);
        this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 8 * delta);

        const time = performance.now() * 0.002;
        this.bodyGroup.position.y = Math.sin(time) * 0.02;
        this.headGroup.rotation.z = Math.sin(time * 0.7) * 0.02;
      }
    }
  }
}
