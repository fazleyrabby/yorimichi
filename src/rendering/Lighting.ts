import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/visual';
import { Season } from '../types';

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
    this.sunLight.shadow.camera.far = 320;

    this.shadowTarget = new THREE.Object3D();
    this.scene.add(this.shadowTarget);
    this.sunLight.target = this.shadowTarget;

    this.scene.add(this.sunLight);
    this.update(new THREE.Vector3(0, 0, 0));
  }

  private currentNightFactor = 0;
  private fromSeason: Season = 'spring';
  private toSeason: Season = 'spring';
  private seasonFactor = 0;

  public setSeasonBlend(fromSeason: Season, toSeason: Season, factor: number, playerPos: THREE.Vector3): void {
    this.fromSeason = fromSeason;
    this.toSeason = toSeason;
    this.seasonFactor = THREE.MathUtils.clamp(factor, 0, 1);
    this.setDayNightBlend(this.currentNightFactor, playerPos);
  }

  public setDayNightBlend(nightFactor: number, playerPos: THREE.Vector3): void {
    this.currentNightFactor = THREE.MathUtils.clamp(nightFactor, 0, 1);

    const sFrom = VISUAL_CONFIG.seasons[this.fromSeason];
    const sTo = VISUAL_CONFIG.seasons[this.toSeason];
    const sf = this.seasonFactor;

    // Seasonal Daytime Lighting
    const seasonSunColor = new THREE.Color(sFrom.sunColor).lerp(new THREE.Color(sTo.sunColor), sf);
    const sunIntensityMult = THREE.MathUtils.lerp(sFrom.sunIntensityMultiplier, sTo.sunIntensityMultiplier, sf);
    const daySunIntensity = VISUAL_CONFIG.lighting.sunIntensity * sunIntensityMult;

    const daySkyColor = new THREE.Color(sFrom.ambientSkyColor).lerp(new THREE.Color(sTo.ambientSkyColor), sf);
    const dayGroundColor = new THREE.Color(sFrom.ambientGroundColor).lerp(new THREE.Color(sTo.ambientGroundColor), sf);
    const dayAmbientIntensity = VISUAL_CONFIG.lighting.ambientIntensity;

    // Nocturnal parameters
    const night = VISUAL_CONFIG.dayNight.night;
    const nightMoonColor = new THREE.Color(night.sunColor);
    const nightSkyColor = new THREE.Color(night.ambientSkyColor);
    const nightGroundColor = new THREE.Color(night.ambientGroundColor);

    // Interpolate Sun -> Moon
    this.sunLight.color.copy(seasonSunColor).lerp(nightMoonColor, this.currentNightFactor);
    this.sunLight.intensity = THREE.MathUtils.lerp(daySunIntensity, night.sunIntensity, this.currentNightFactor);

    // Interpolate Hemisphere ambient
    this.hemiLight.color.copy(daySkyColor).lerp(nightSkyColor, this.currentNightFactor);
    this.hemiLight.groundColor.copy(dayGroundColor).lerp(nightGroundColor, this.currentNightFactor);
    this.hemiLight.intensity = THREE.MathUtils.lerp(dayAmbientIntensity, night.ambientIntensity, this.currentNightFactor);

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
