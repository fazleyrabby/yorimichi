import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
  private static instance: ModelLoader;
  private loader = new GLTFLoader();
  private cache = new Map<string, THREE.Group>();
  private loadingPromises = new Map<string, Promise<THREE.Group>>();

  public static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  public load(path: string): Promise<THREE.Group> {
    if (this.cache.has(path)) {
      return Promise.resolve(this.cache.get(path)!.clone(true));
    }

    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!.then(group => group.clone(true));
    }

    const promise = new Promise<THREE.Group>((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          const group = gltf.scene;
          group.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.cache.set(path, group);
          this.loadingPromises.delete(path);
          resolve(group.clone(true));
        },
        undefined,
        (err) => {
          console.warn(`Failed to load model at ${path}:`, err);
          this.loadingPromises.delete(path);
          reject(err);
        }
      );
    });

    this.loadingPromises.set(path, promise);
    return promise.then(group => group.clone(true));
  }
}
