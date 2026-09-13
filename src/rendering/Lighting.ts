import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/visual';

export class LightingSystem {
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public shadowTarget: THREE.Object3D;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const cfg = VISUAL_CONFIG.lighting;

    // Hemisphere light for soft ambient fill and cool sky / mossy ground contrast
    this.hemiLight = new THREE.HemisphereLight(
      cfg.ambientSkyColor,
      cfg.ambientGroundColor,
      cfg.ambientIntensity
    );
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Directional sunlight
    this.sunLight = new THREE.DirectionalLight(cfg.sunColor, cfg.sunIntensity);
    this.sunLight.castShadow = true;

    // Shadow configuration
    this.sunLight.shadow.mapSize.width = cfg.shadowMapSize;
    this.sunLight.shadow.mapSize.height = cfg.shadowMapSize;
    this.sunLight.shadow.bias = cfg.shadowBias;
    this.sunLight.shadow.normalBias = cfg.shadowNormalBias;

    const d = cfg.shadowFrustumSize;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 280;

    this.shadowTarget = new THREE.Object3D();
    this.scene.add(this.shadowTarget);
    this.sunLight.target = this.shadowTarget;

    this.scene.add(this.sunLight);
    this.update(new THREE.Vector3(0, 0, 0));
  }

  private currentNightFactor = 0;

  public setDayNightBlend(nightFactor: number, playerPos: THREE.Vector3): void {
    this.currentNightFactor = THREE.MathUtils.clamp(nightFactor, 0, 1);
    const day = VISUAL_CONFIG.dayNight.day;
    const night = VISUAL_CONFIG.dayNight.night;

    // Interpolate directional light (Sun -> Moon)
    const daySunColor = new THREE.Color(day.sunColor);
    const nightMoonColor = new THREE.Color(night.sunColor);
    this.sunLight.color.copy(daySunColor).lerp(nightMoonColor, this.currentNightFactor);
    this.sunLight.intensity = THREE.MathUtils.lerp(day.sunIntensity, night.sunIntensity, this.currentNightFactor);

    // Interpolate ambient hemisphere light
    const daySkyColor = new THREE.Color(day.ambientSkyColor);
    const nightSkyColor = new THREE.Color(night.ambientSkyColor);
    this.hemiLight.color.copy(daySkyColor).lerp(nightSkyColor, this.currentNightFactor);

    const dayGroundColor = new THREE.Color(day.ambientGroundColor);
    const nightGroundColor = new THREE.Color(night.ambientGroundColor);
    this.hemiLight.groundColor.copy(dayGroundColor).lerp(nightGroundColor, this.currentNightFactor);

    this.hemiLight.intensity = THREE.MathUtils.lerp(day.ambientIntensity, night.ambientIntensity, this.currentNightFactor);

    this.update(playerPos);
  }

  public update(playerPos: THREE.Vector3): void {
    const dayPos = VISUAL_CONFIG.dayNight.day.sunPosition;
    const nightPos = VISUAL_CONFIG.dayNight.night.sunPosition;
    const activeOffset = new THREE.Vector3().lerpVectors(dayPos, nightPos, this.currentNightFactor);

    // Follow the player smoothly so high-quality shadows remain centered
    this.sunLight.position.copy(playerPos).add(activeOffset);
    this.shadowTarget.position.copy(playerPos);
    this.sunLight.target.updateMatrixWorld();
  }
}
