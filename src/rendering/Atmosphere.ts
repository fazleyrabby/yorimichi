import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/visual';

export class AtmosphereSystem {
  private scene: THREE.Scene;
  private skyMat!: THREE.ShaderMaterial;
  private starPoints!: THREE.Points;
  private starMat!: THREE.PointsMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const fogCfg = VISUAL_CONFIG.fog;

    // Atmospheric distance fog to create depth and painterly distance haze
    const fogColor = new THREE.Color(fogCfg.color);
    this.scene.fog = new THREE.Fog(fogColor, fogCfg.near, fogCfg.far);
    this.scene.background = fogColor;

    this.createSkyGradient();
    this.createStarfield();
  }

  private createSkyGradient(): void {
    // Subtle backdrop cylinder or hemisphere that complements the fog
    const skyGeo = new THREE.SphereGeometry(240, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(VISUAL_CONFIG.dayNight.day.skyTopColor) },
        bottomColor: { value: new THREE.Color(VISUAL_CONFIG.dayNight.day.skyBottomColor) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const skyMesh = new THREE.Mesh(skyGeo, this.skyMat);
    skyMesh.position.set(0, -10, 0);
    this.scene.add(skyMesh);
  }

  private createStarfield(): void {
    const starCount = 280;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 230 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI * 0.42); // Upper dome only

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      starPositions[i * 3 + 0] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    this.starMat = new THREE.PointsMaterial({
      color: 0xf4f8ff,
      size: 1.4,
      transparent: true,
      opacity: 0.0, // Hidden during day
      depthWrite: false,
    });

    this.starPoints = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.starPoints);
  }

  public setDayNightBlend(nightFactor: number): void {
    const factor = THREE.MathUtils.clamp(nightFactor, 0, 1);
    const day = VISUAL_CONFIG.dayNight.day;
    const night = VISUAL_CONFIG.dayNight.night;

    // Blend fog and background color
    const dayFog = new THREE.Color(day.fogColor);
    const nightFog = new THREE.Color(night.fogColor);
    const currentFog = new THREE.Color().copy(dayFog).lerp(nightFog, factor);

    if (this.scene.fog) {
      (this.scene.fog as THREE.Fog).color.copy(currentFog);
    }
    if (this.scene.background) {
      (this.scene.background as THREE.Color).copy(currentFog);
    }

    // Blend sky gradient colors
    const daySkyTop = new THREE.Color(day.skyTopColor);
    const nightSkyTop = new THREE.Color(night.skyTopColor);
    this.skyMat.uniforms.topColor.value.copy(daySkyTop).lerp(nightSkyTop, factor);

    const daySkyBottom = new THREE.Color(day.skyBottomColor);
    const nightSkyBottom = new THREE.Color(night.skyBottomColor);
    this.skyMat.uniforms.bottomColor.value.copy(daySkyBottom).lerp(nightSkyBottom, factor);

    // Stars appear as dusk turns to night
    const starOpacity = Math.max(0, (factor - 0.25) / 0.75);
    this.starMat.opacity = starOpacity * 0.85;
  }
}
