import * as THREE from 'three';

export interface TerrainQuery {
  getHeightAt(x: number, z: number): number;
  getSurfaceNormal(x: number, z: number): THREE.Vector3;
  isWalkable(x: number, z: number): boolean;
}

export interface WaterQuery {
  contains(x: number, z: number): boolean;
  getSurfaceHeight(x: number, z: number): number;
}

export interface PlayerState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  direction: number; // yaw angle in radians
  isMoving: boolean;
  speed: number;
}

export interface InputState {
  forward: number;  // -1 to 1
  right: number;    // -1 to 1
}

export interface LandmarkConfig {
  id: string;
  name: string;
  position: THREE.Vector3;
  rotationY?: number;
  scale?: number;
}

export interface InstancedItem {
  matrix: THREE.Matrix4;
  color?: THREE.Color;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
