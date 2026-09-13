import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/visual';

export class PlayerController {
  private keys: Record<string, boolean> = {};
  public moveDirection = new THREE.Vector3();
  public forward = new THREE.Vector3();
  public right = new THREE.Vector3();
  private interactRequested = false;
  private bellRequested = false;

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    const phi = VISUAL_CONFIG.camera.elevation;
    const theta = VISUAL_CONFIG.camera.azimuth;

    const camX = Math.cos(phi) * Math.sin(theta);
    const camZ = Math.cos(phi) * Math.cos(theta);

    this.forward.set(-camX, 0, -camZ).normalize();
    this.right.set(-this.forward.z, 0, this.forward.x).normalize();
  }

  public setOrientation(forwardVec: THREE.Vector3): void {
    this.forward.copy(forwardVec).normalize();
    this.right.set(-this.forward.z, 0, this.forward.x).normalize();
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys[e.code] = true;

    // Trigger interact action on E or Shift or Space
    if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') {
      this.interactRequested = true;
    }

    // Trigger bicycle bell on B
    if (e.code === 'KeyB') {
      this.bellRequested = true;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false;
  }

  public consumeInteract(): boolean {
    if (this.interactRequested) {
      this.interactRequested = false;
      return true;
    }
    return false;
  }

  public consumeBell(): boolean {
    if (this.bellRequested) {
      this.bellRequested = false;
      return true;
    }
    return false;
  }

  public update(): THREE.Vector3 {
    let inputForward = 0;
    let inputRight = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputForward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputRight += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputRight -= 1;

    this.moveDirection.set(0, 0, 0);

    if (inputForward !== 0 || inputRight !== 0) {
      this.moveDirection
        .addScaledVector(this.forward, inputForward)
        .addScaledVector(this.right, inputRight)
        .normalize();
    }

    return this.moveDirection;
  }

  public isMoving(): boolean {
    return this.moveDirection.lengthSq() > 0.01;
  }
}
