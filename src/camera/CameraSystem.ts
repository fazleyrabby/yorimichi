import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/visual';

export type CameraMode = 'isometric' | 'third_person';

export class CameraSystem {
  public mode: CameraMode = 'isometric';
  public activeCamera: THREE.Camera;
  public orthoCamera: THREE.OrthographicCamera;
  public perspCamera: THREE.PerspectiveCamera;

  // Camera focal target (in world space)
  public target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public isDetachedFromPlayer = false;

  // Isometric variables & 360 rotation
  private isoOffset = new THREE.Vector3();
  private isoYaw: number;
  private isoPitch: number;
  private targetIsoYaw: number;
  private targetIsoPitch: number;
  private currentFrustumSize: number;
  private targetFrustumSize: number;
  private minFrustumSize = 20;
  private maxFrustumSize = 130;
  private isoSmoothing = 0.08;

  // Third-Person variables
  private tpDistance = 7.5;
  private targetTpDistance = 7.5;
  private minTpDistance = 3.0;
  private maxTpDistance = 22.0;
  private tpYaw = Math.PI * 0.75;
  private tpPitch = 0.32;
  private tpTarget = new THREE.Vector3();
  private tpSmoothPos = new THREE.Vector3();

  // Mouse interaction state (Panning & Rotation)
  private isLeftDown = false;
  private isRightDown = false;
  private isMiddleDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private aspect: number;
  public onModeChange?: (mode: CameraMode) => void;
  public onDetachChange?: (detached: boolean) => void;

  constructor(aspect: number) {
    this.aspect = aspect;
    const cfg = VISUAL_CONFIG.camera;

    // Initialize angles from visual config
    this.isoYaw = cfg.azimuth;
    this.targetIsoYaw = cfg.azimuth;
    this.isoPitch = cfg.elevation;
    this.targetIsoPitch = cfg.elevation;

    // 1. Setup Orthographic Camera (Isometric)
    this.currentFrustumSize = cfg.frustumSize;
    this.targetFrustumSize = cfg.frustumSize;
    const halfH = this.currentFrustumSize / 2;
    const halfW = halfH * aspect;

    this.orthoCamera = new THREE.OrthographicCamera(
      -halfW, halfW,
      halfH, -halfH,
      cfg.near,
      cfg.far
    );

    this.recomputeIsoOffset();
    this.orthoCamera.position.copy(this.isoOffset);
    this.orthoCamera.lookAt(0, 0, 0);

    // 2. Setup Perspective Camera (Third-Person)
    this.perspCamera = new THREE.PerspectiveCamera(55, aspect, 0.2, 700);

    // Initial active camera
    this.activeCamera = this.orthoCamera;

    // Window event listeners
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('contextmenu', this.onContextMenu);
  }

  private recomputeIsoOffset(): void {
    const dist = VISUAL_CONFIG.camera.offsetDistance;
    this.isoOffset.set(
      dist * Math.cos(this.isoPitch) * Math.sin(this.isoYaw),
      dist * Math.sin(this.isoPitch),
      dist * Math.cos(this.isoPitch) * Math.cos(this.isoYaw)
    );
  }

  public toggleMode(): CameraMode {
    this.mode = this.mode === 'isometric' ? 'third_person' : 'isometric';
    this.activeCamera = this.mode === 'isometric' ? this.orthoCamera : this.perspCamera;

    if (this.mode === 'third_person') {
      this.tpSmoothPos.copy(this.target).add(new THREE.Vector3(0, 3, 6));
    }

    if (this.onModeChange) {
      this.onModeChange(this.mode);
    }
    return this.mode;
  }

  public setupThirdPerson(dist = 4.5, yaw = 0.2, pitch = 0.25): void {
    this.mode = 'third_person';
    this.activeCamera = this.perspCamera;
    this.tpDistance = dist;
    this.targetTpDistance = dist;
    this.tpYaw = yaw;
    this.tpPitch = pitch;
    this.isDetachedFromPlayer = false;
    if (this.onModeChange) {
      this.onModeChange(this.mode);
    }
  }

  public recenterOnPlayer(playerPos: THREE.Vector3): void {
    this.isDetachedFromPlayer = false;
    this.target.copy(playerPos);
    if (this.onDetachChange) {
      this.onDetachChange(false);
    }
  }

  public rotateAzimuth(deltaRadians: number): void {
    if (this.mode === 'isometric') {
      this.targetIsoYaw += deltaRadians;
    } else {
      this.tpYaw += deltaRadians;
    }
  }

  private onContextMenu = (e: MouseEvent): void => {
    // Prevent browser context menu on right-drag rotation
    e.preventDefault();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    // Key 'V' or 'C' toggles camera perspective
    if (e.code === 'KeyV' || e.code === 'KeyC') {
      this.toggleMode();
    }

    // Key 'Q' and 'R' rotate camera 45 degrees left / right
    if (e.code === 'KeyQ') {
      this.rotateAzimuth(-Math.PI / 4);
    }
    if (e.code === 'KeyR') {
      this.rotateAzimuth(Math.PI / 4);
    }

    // Spacebar recenters camera on player
    if (e.code === 'Space') {
      this.isDetachedFromPlayer = false;
      if (this.onDetachChange) this.onDetachChange(false);
    }
  };

  private onMouseDown = (e: MouseEvent): void => {
    // Ignore clicks on UI overlays
    const target = e.target as HTMLElement | null;
    if (target && (target.closest('button') || target.closest('.aoe-action-card') || target.closest('#aoe-minimap-container'))) {
      return;
    }

    if (e.button === 0) {
      this.isLeftDown = true;
    } else if (e.button === 2) {
      this.isRightDown = true;
    } else if (e.button === 1) {
      this.isMiddleDown = true;
    }

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isLeftDown && !this.isRightDown && !this.isMiddleDown) return;

    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    const isRotating = this.isRightDown || this.isMiddleDown || (this.isLeftDown && e.altKey);
    const isPanning = this.isLeftDown && !e.altKey;

    if (isRotating) {
      // 360° Camera Rotation (Yaw & Pitch)
      if (this.mode === 'isometric') {
        this.targetIsoYaw -= deltaX * 0.007;
        this.targetIsoPitch = THREE.MathUtils.clamp(
          this.targetIsoPitch + deltaY * 0.005,
          0.28,
          1.28
        );
      } else {
        this.tpYaw -= deltaX * 0.007;
        this.tpPitch = THREE.MathUtils.clamp(
          this.tpPitch + deltaY * 0.005,
          -0.15,
          1.15
        );
      }
    } else if (isPanning) {
      // Mouse Draggable Panning across the 3D world
      this.isDetachedFromPlayer = true;
      if (this.onDetachChange) {
        this.onDetachChange(true);
      }

      // Compute ground-plane forward and right vectors relative to camera view
      const activeCam = this.mode === 'isometric' ? this.orthoCamera : this.perspCamera;
      const camDir = new THREE.Vector3();
      activeCam.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();

      const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x).normalize();

      // Pan sensitivity scaled by current zoom level
      const panSensitivity = this.mode === 'isometric'
        ? (this.currentFrustumSize / window.innerHeight) * 1.3
        : (this.tpDistance / window.innerHeight) * 2.2;

      const panDeltaX = (-camRight.x * deltaX + camDir.x * deltaY) * panSensitivity;
      const panDeltaZ = (-camRight.z * deltaX + camDir.z * deltaY) * panSensitivity;

      this.target.x = THREE.MathUtils.clamp(this.target.x + panDeltaX, -85, 85);
      this.target.z = THREE.MathUtils.clamp(this.target.z + panDeltaZ, -85, 85);
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.isLeftDown = false;
    if (e.button === 2) this.isRightDown = false;
    if (e.button === 1) this.isMiddleDown = false;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if (this.mode === 'isometric') {
      const zoomFactor = e.deltaY > 0 ? 1.12 : 0.89;
      this.targetFrustumSize = THREE.MathUtils.clamp(
        this.targetFrustumSize * zoomFactor,
        this.minFrustumSize,
        this.maxFrustumSize
      );
    } else {
      const zoomDelta = e.deltaY > 0 ? 1.15 : 0.85;
      this.targetTpDistance = THREE.MathUtils.clamp(
        this.targetTpDistance * zoomDelta,
        this.minTpDistance,
        this.maxTpDistance
      );
    }
  };

  public update(playerPos: THREE.Vector3, playerVelocity?: THREE.Vector3): void {
    if (this.mode === 'isometric') {
      // 1. Isometric Follow or Free Pan
      if (this.isDetachedFromPlayer) {
        // If player moves with significant intent, smoothly re-converge to player
        if (playerVelocity && playerVelocity.lengthSq() > 1.2) {
          this.target.lerp(playerPos, 0.04);
          if (this.target.distanceTo(playerPos) < 2.0) {
            this.isDetachedFromPlayer = false;
            if (this.onDetachChange) this.onDetachChange(false);
          }
        }
      } else {
        this.target.lerp(playerPos, this.isoSmoothing);
      }

      // Smoothly interpolate rotation angles
      this.isoYaw = THREE.MathUtils.lerp(this.isoYaw, this.targetIsoYaw, 0.16);
      this.isoPitch = THREE.MathUtils.lerp(this.isoPitch, this.targetIsoPitch, 0.16);
      this.recomputeIsoOffset();

      this.orthoCamera.position.copy(this.target).add(this.isoOffset);
      this.orthoCamera.lookAt(this.target);

      // Smooth zoom transitions
      if (Math.abs(this.currentFrustumSize - this.targetFrustumSize) > 0.05) {
        this.currentFrustumSize = THREE.MathUtils.lerp(this.currentFrustumSize, this.targetFrustumSize, 0.14);
        this.applyFrustum();
      }
    } else {
      // 2. Third-Person Update
      this.tpDistance = THREE.MathUtils.lerp(this.tpDistance, this.targetTpDistance, 0.12);

      const targetLook = new THREE.Vector3(playerPos.x, playerPos.y + 1.45, playerPos.z);
      this.tpTarget.lerp(targetLook, 0.15);

      // Auto-reorient behind player movement if moving and not manually orbiting
      const isUserOrbiting = this.isRightDown || this.isMiddleDown || (this.isLeftDown && !this.isDetachedFromPlayer);
      if (!isUserOrbiting && playerVelocity && playerVelocity.lengthSq() > 0.5) {
        const moveAngle = Math.atan2(playerVelocity.x, playerVelocity.z) + Math.PI;
        let diff = moveAngle - this.tpYaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.tpYaw += diff * 0.035;
      }

      const camY = Math.sin(this.tpPitch) * this.tpDistance;
      const horizDist = Math.cos(this.tpPitch) * this.tpDistance;
      const camX = Math.sin(this.tpYaw) * horizDist;
      const camZ = Math.cos(this.tpYaw) * horizDist;

      const desiredCamPos = new THREE.Vector3(
        this.tpTarget.x + camX,
        Math.max(playerPos.y + 0.6, this.tpTarget.y + camY),
        this.tpTarget.z + camZ
      );

      this.tpSmoothPos.lerp(desiredCamPos, 0.14);
      this.perspCamera.position.copy(this.tpSmoothPos);
      this.perspCamera.lookAt(this.tpTarget);
    }
  }

  public getForwardVector(): THREE.Vector3 {
    // True ground forward vector projected from active camera view
    const fwd = new THREE.Vector3();
    this.activeCamera.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() < 0.001) {
      return new THREE.Vector3(0, 0, -1);
    }
    return fwd.normalize();
  }

  private applyFrustum(): void {
    const halfH = this.currentFrustumSize / 2;
    const halfW = halfH * this.aspect;
    this.orthoCamera.left = -halfW;
    this.orthoCamera.right = halfW;
    this.orthoCamera.top = halfH;
    this.orthoCamera.bottom = -halfH;
    this.orthoCamera.updateProjectionMatrix();
  }

  public onResize(aspect: number): void {
    this.aspect = aspect;
    this.applyFrustum();
    this.perspCamera.aspect = aspect;
    this.perspCamera.updateProjectionMatrix();
  }

  public dispose(): void {
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('contextmenu', this.onContextMenu);
  }
}
