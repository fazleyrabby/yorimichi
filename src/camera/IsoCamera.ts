import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/visual';

export class IsoCamera {
  public camera: THREE.OrthographicCamera;
  public target: THREE.Vector3;
  private offset: THREE.Vector3;
  private smoothing: number;
  private currentFrustumSize: number;
  private targetFrustumSize: number;
  private minFrustumSize = 22;  // Close-up detailed zoom
  private maxFrustumSize = 115; // Wide strategic landscape zoom
  private aspect: number;

  constructor(aspect: number) {
    const cfg = VISUAL_CONFIG.camera;
    this.aspect = aspect;
    this.currentFrustumSize = cfg.frustumSize;
    this.targetFrustumSize = cfg.frustumSize;
    this.smoothing = cfg.smoothing;

    const halfH = this.currentFrustumSize / 2;
    const halfW = halfH * aspect;

    this.camera = new THREE.OrthographicCamera(
      -halfW, halfW,
      halfH, -halfH,
      cfg.near,
      cfg.far
    );

    // Compute isometric offset from spherical angles
    const phi = cfg.elevation;
    const theta = cfg.azimuth;
    const dist = cfg.offsetDistance;

    this.offset = new THREE.Vector3(
      dist * Math.cos(phi) * Math.sin(theta),
      dist * Math.sin(phi),
      dist * Math.cos(phi) * Math.cos(theta)
    );

    this.target = new THREE.Vector3(0, 0, 0);
    this.camera.position.copy(this.target).add(this.offset);
    this.camera.lookAt(this.target);

    // Smooth mouse wheel zoom listener
    window.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    // Delta sensitivity: scroll up zooms in, scroll down zooms out
    const zoomFactor = e.deltaY > 0 ? 1.12 : 0.89;
    this.targetFrustumSize = THREE.MathUtils.clamp(
      this.targetFrustumSize * zoomFactor,
      this.minFrustumSize,
      this.maxFrustumSize
    );
  };

  public update(playerPos: THREE.Vector3): void {
    // Smooth lerp to target to prevent camera jitter
    this.target.lerp(playerPos, this.smoothing);
    this.camera.position.copy(this.target).add(this.offset);
    this.camera.lookAt(this.target);

    // Smooth zoom interpolation
    if (Math.abs(this.currentFrustumSize - this.targetFrustumSize) > 0.05) {
      this.currentFrustumSize = THREE.MathUtils.lerp(this.currentFrustumSize, this.targetFrustumSize, 0.14);
      this.applyFrustum();
    }
  }

  private applyFrustum(): void {
    const halfH = this.currentFrustumSize / 2;
    const halfW = halfH * this.aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  public onResize(aspect: number): void {
    this.aspect = aspect;
    this.applyFrustum();
  }

  public dispose(): void {
    window.removeEventListener('wheel', this.onWheel);
  }
}
