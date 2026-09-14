import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/visual';
import { Season } from '../types';

export class MaterialLibrary {
  // Shared materials
  public terrainMaterial: THREE.MeshStandardMaterial;
  public waterMaterial: THREE.ShaderMaterial;
  public waterfallMaterial: THREE.ShaderMaterial;
  public roofTileMaterial: THREE.MeshStandardMaterial;
  public timberDarkMaterial: THREE.MeshStandardMaterial;
  public timberWarmMaterial: THREE.MeshStandardMaterial;
  public wallCreamMaterial: THREE.MeshStandardMaterial;
  public wallShojiMaterial: THREE.MeshStandardMaterial;
  public stoneGraniteMaterial: THREE.MeshStandardMaterial;
  public stoneLanternMaterial: THREE.MeshStandardMaterial;
  public lanternFlameMaterial: THREE.MeshStandardMaterial;
  public shojiWindowGlowMaterial: THREE.MeshStandardMaterial;
  public toriiMaterial: THREE.MeshStandardMaterial;
  public toriiBaseMaterial: THREE.MeshStandardMaterial;
  public pineFoliageDark: THREE.MeshStandardMaterial;
  public pineFoliageLight: THREE.MeshStandardMaterial;
  public broadleafFoliage: THREE.MeshStandardMaterial;
  public broadleafFoliageLight: THREE.MeshStandardMaterial;
  public cherryBlossomFoliage: THREE.MeshStandardMaterial;
  public autumnFoliage: THREE.MeshStandardMaterial;
  public treeTrunkMaterial: THREE.MeshStandardMaterial;
  public bushMaterial: THREE.MeshStandardMaterial;
  public grassMaterial: THREE.MeshStandardMaterial;
  public flowerYellowMaterial: THREE.MeshStandardMaterial;
  public flowerPurpleMaterial: THREE.MeshStandardMaterial;
  public flowerRedMaterial: THREE.MeshStandardMaterial;
  public reedMaterial: THREE.MeshStandardMaterial;
  public rockMaterial: THREE.MeshStandardMaterial;
  public shoreRockMaterial: THREE.MeshStandardMaterial;
  public woodPlankMaterial: THREE.MeshStandardMaterial;
  public dirtRoadMaterial: THREE.MeshStandardMaterial;

  // Ghibli Hamlet Specific Materials
  public thatchedRoofMaterial: THREE.MeshStandardMaterial;
  public thatchedRoofShadowMaterial: THREE.MeshStandardMaterial;
  public thatchedRidgeMaterial: THREE.MeshStandardMaterial;
  public wallPlasterMaterial: THREE.MeshStandardMaterial;
  public wheatMaterial: THREE.MeshStandardMaterial;
  public wheatAmberMaterial: THREE.MeshStandardMaterial;
  public tilledSoilMaterial: THREE.MeshStandardMaterial;
  public cabbageMaterial: THREE.MeshStandardMaterial;
  public cabbageHeartMaterial: THREE.MeshStandardMaterial;
  public cobblestoneMaterial: THREE.MeshStandardMaterial;
  public cobblestoneLightMaterial: THREE.MeshStandardMaterial;
  public cartWoodMaterial: THREE.MeshStandardMaterial;
  public awningRedMaterial: THREE.MeshStandardMaterial;
  public awningCreamMaterial: THREE.MeshStandardMaterial;
  public chimneyStoneMaterial: THREE.MeshStandardMaterial;
  public broadleafHighlightMaterial: THREE.MeshStandardMaterial;
  public snowRoofMaterial: THREE.MeshStandardMaterial;

  constructor() {
    const P = VISUAL_CONFIG.palette;

    // Winter Snow Blanket Material for Roofs, Chimneys, Lanterns & Torii Caps
    this.snowRoofMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f9fd,
      roughness: 0.94,
      metalness: 0.02,
      transparent: true,
      opacity: 0.0,
      visible: false,
      flatShading: true,
    });

    // Terrain with vertex colors for smooth blending between grass, paths, and rocks
    this.terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.04,
      flatShading: false,
    });

    // Architecture - Dark slate charcoal roof tiles with crisp silhouette
    this.roofTileMaterial = new THREE.MeshStandardMaterial({
      color: P.roofTileCharcoal,
      roughness: 0.55,
      metalness: 0.2,
      flatShading: true,
    });

    // Dark aged timber structural beams
    this.timberDarkMaterial = new THREE.MeshStandardMaterial({
      color: P.timberDark,
      roughness: 0.82,
      metalness: 0.05,
      flatShading: true,
    });

    // Warm cedar wood
    this.timberWarmMaterial = new THREE.MeshStandardMaterial({
      color: P.timberWarm,
      roughness: 0.78,
      metalness: 0.04,
      flatShading: true,
    });

    this.woodPlankMaterial = new THREE.MeshStandardMaterial({
      color: P.timberLight,
      roughness: 0.76,
      metalness: 0.04,
      flatShading: true,
    });

    // Cream clay / plaster walls
    this.wallCreamMaterial = new THREE.MeshStandardMaterial({
      color: P.wallCream,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: true,
    });

    // Glowing warm shoji screens
    this.wallShojiMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff8ee,
      roughness: 0.65,
      metalness: 0.0,
      emissive: 0xffdfa8,
      emissiveIntensity: 0.35, // inviting warm interior lamp glow
      flatShading: true,
    });

    this.stoneGraniteMaterial = new THREE.MeshStandardMaterial({
      color: P.stoneGranite,
      roughness: 0.84,
      metalness: 0.06,
      flatShading: true,
    });

    this.stoneLanternMaterial = new THREE.MeshStandardMaterial({
      color: P.stoneLantern,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
    });

    this.lanternFlameMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe6aa,
      emissive: new THREE.Color(0xff8818),
      emissiveIntensity: 0.0,
      roughness: 0.35,
      metalness: 0.0,
      flatShading: true,
    });

    this.shojiWindowGlowMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffae8,
      emissive: new THREE.Color(0xff9a24),
      emissiveIntensity: 0.0,
      roughness: 0.5,
      metalness: 0.0,
      flatShading: true,
    });

    // Traditional vermilion Torii lacquer
    this.toriiMaterial = new THREE.MeshStandardMaterial({
      color: P.toriiVermilion,
      roughness: 0.55,
      metalness: 0.12,
      flatShading: true,
    });

    this.toriiBaseMaterial = new THREE.MeshStandardMaterial({
      color: P.toriiBaseDark,
      roughness: 0.82,
      metalness: 0.12,
      flatShading: true,
    });

    // Rich Forest Foliage
    this.pineFoliageDark = new THREE.MeshStandardMaterial({
      color: P.pineGreenDark,
      roughness: 0.75,
      metalness: 0.04,
      flatShading: true,
    });

    this.pineFoliageLight = new THREE.MeshStandardMaterial({
      color: P.pineGreenLight,
      roughness: 0.72,
      metalness: 0.04,
      flatShading: true,
    });

    this.broadleafFoliage = new THREE.MeshStandardMaterial({
      color: P.broadleafGreen,
      roughness: 0.76,
      metalness: 0.04,
      flatShading: true,
    });

    this.broadleafFoliageLight = new THREE.MeshStandardMaterial({
      color: P.broadleafLight,
      roughness: 0.74,
      metalness: 0.04,
      flatShading: true,
    });

    this.cherryBlossomFoliage = new THREE.MeshStandardMaterial({
      color: P.cherryBlossomPink,
      roughness: 0.7,
      metalness: 0.02,
      flatShading: true,
    });

    this.autumnFoliage = new THREE.MeshStandardMaterial({
      color: P.autumnOrange,
      roughness: 0.75,
      metalness: 0.04,
      flatShading: true,
    });

    this.treeTrunkMaterial = new THREE.MeshStandardMaterial({
      color: P.timberDark,
      roughness: 0.88,
      metalness: 0.05,
      flatShading: true,
    });

    this.bushMaterial = new THREE.MeshStandardMaterial({
      color: P.grassLush,
      roughness: 0.78,
      metalness: 0.04,
      flatShading: true,
    });

    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: P.grassMeadow,
      roughness: 0.8,
      metalness: 0.02,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    this.flowerYellowMaterial = new THREE.MeshStandardMaterial({
      color: P.flowerYellow,
      roughness: 0.65,
      metalness: 0.0,
      flatShading: true,
    });

    this.flowerPurpleMaterial = new THREE.MeshStandardMaterial({
      color: P.flowerPurple,
      roughness: 0.65,
      metalness: 0.0,
      flatShading: true,
    });

    this.reedMaterial = new THREE.MeshStandardMaterial({
      color: P.reedGreen,
      roughness: 0.82,
      metalness: 0.04,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    this.rockMaterial = new THREE.MeshStandardMaterial({
      color: P.rockCliff,
      roughness: 0.86,
      metalness: 0.08,
      flatShading: true,
    });

    this.shoreRockMaterial = new THREE.MeshStandardMaterial({
      color: 0x545d5a,
      roughness: 0.78,
      metalness: 0.1,
      flatShading: true,
    });

    this.dirtRoadMaterial = new THREE.MeshStandardMaterial({
      color: P.dirtPath,
      roughness: 0.9,
      metalness: 0.02,
      flatShading: true,
    });

    this.flowerRedMaterial = new THREE.MeshStandardMaterial({
      color: P.flowerRed,
      roughness: 0.65,
      metalness: 0.0,
      flatShading: true,
    });

    // Ghibli Hamlet Architecture & Props Materials
    this.thatchedRoofMaterial = new THREE.MeshStandardMaterial({
      color: P.thatchedRoofGold,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: true,
    });

    this.thatchedRoofShadowMaterial = new THREE.MeshStandardMaterial({
      color: P.thatchedRoofShadow,
      roughness: 0.92,
      metalness: 0.02,
      flatShading: true,
    });

    this.thatchedRidgeMaterial = new THREE.MeshStandardMaterial({
      color: P.thatchedRidge,
      roughness: 0.82,
      metalness: 0.04,
      flatShading: true,
    });

    this.wallPlasterMaterial = new THREE.MeshStandardMaterial({
      color: P.wallPlaster,
      roughness: 0.86,
      metalness: 0.02,
      flatShading: true,
    });

    this.wheatMaterial = new THREE.MeshStandardMaterial({
      color: P.wheatGold,
      roughness: 0.78,
      metalness: 0.04,
      flatShading: true,
    });

    this.wheatAmberMaterial = new THREE.MeshStandardMaterial({
      color: P.wheatAmber,
      roughness: 0.75,
      metalness: 0.05,
      flatShading: true,
    });

    this.tilledSoilMaterial = new THREE.MeshStandardMaterial({
      color: P.tilledSoil,
      roughness: 0.94,
      metalness: 0.01,
      flatShading: true,
    });

    this.cabbageMaterial = new THREE.MeshStandardMaterial({
      color: P.cabbageGreen,
      roughness: 0.72,
      metalness: 0.02,
      flatShading: true,
    });

    this.cabbageHeartMaterial = new THREE.MeshStandardMaterial({
      color: P.cabbageHeart,
      roughness: 0.68,
      metalness: 0.01,
      flatShading: true,
    });

    this.cobblestoneMaterial = new THREE.MeshStandardMaterial({
      color: P.cobblestone,
      roughness: 0.84,
      metalness: 0.06,
      flatShading: true,
    });

    this.cobblestoneLightMaterial = new THREE.MeshStandardMaterial({
      color: P.cobblestoneLight,
      roughness: 0.80,
      metalness: 0.05,
      flatShading: true,
    });

    this.cartWoodMaterial = new THREE.MeshStandardMaterial({
      color: P.cartWood,
      roughness: 0.82,
      metalness: 0.03,
      flatShading: true,
    });

    this.awningRedMaterial = new THREE.MeshStandardMaterial({
      color: P.awningRed,
      roughness: 0.74,
      metalness: 0.02,
      flatShading: true,
    });

    this.awningCreamMaterial = new THREE.MeshStandardMaterial({
      color: P.awningCream,
      roughness: 0.82,
      metalness: 0.01,
      flatShading: true,
    });

    this.chimneyStoneMaterial = new THREE.MeshStandardMaterial({
      color: P.stoneGranite,
      roughness: 0.88,
      metalness: 0.05,
      flatShading: true,
    });

    this.broadleafHighlightMaterial = new THREE.MeshStandardMaterial({
      color: P.broadleafHighlight,
      roughness: 0.70,
      metalness: 0.03,
      flatShading: true,
    });

    // Realistic Age of Empires III Definitive Edition Water Shader
    const sunDir = VISUAL_CONFIG.lighting.sunPosition.clone().normalize();
    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDeepColor: { value: new THREE.Color(P.waterDeep) },
        uShallowColor: { value: new THREE.Color(P.waterShallow) },
        uTurquoiseColor: { value: new THREE.Color(P.waterTurquoise) },
        uFoamColor: { value: new THREE.Color(P.waterFoam) },
        uHighlightColor: { value: new THREE.Color(P.waterHighlight) },
        uSkyColor: { value: new THREE.Color(0xd6eefb) },
        uSunDirection: { value: sunDir },
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying vec2 vUv;
        varying float vWaveHeight;

        // Poseidon Ocean Choppy Wave Octave (Tuned for calm mountain pond and stream)
        float sea_octave(vec2 uv, float choppy) {
          vec2 n = vec2(sin(uv.y * 1.5 + uv.x * 0.8), cos(uv.x * 1.3 - uv.y * 0.9)) * 0.20;
          vec2 p = uv + n;
          vec2 wv = 1.0 - abs(sin(p));
          vec2 swv = abs(cos(p));
          wv = mix(wv, swv, wv);
          return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
        }

        const mat2 octMat = mat2(1.6, 1.2, -1.2, 1.6);

        float getWaveHeight(vec2 p, float time) {
          // Subtle, delicate ripples appropriate for a calm mountain pond & stream
          float freq = 0.42;
          float amp = 0.018;   // Gentle 1.8cm ripples
          float choppy = 1.85; // Soft natural wave peaks
          float h = 0.0;
          float t = time * 0.42; // Peaceful, tranquil drift
          vec2 uv = p;

          for (int i = 0; i < 3; i++) {
            float d = sea_octave((uv + vec2(t * 0.5, t * 0.35)) * freq, choppy);
            d += sea_octave((uv - vec2(t * 0.35, t * 0.55)) * freq, choppy);
            h += d * amp;
            uv = octMat * uv;
            freq *= 1.80;
            amp *= 0.28;
            choppy = mix(choppy, 1.0, 0.20);
          }
          return h;
        }

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Subtle, calm wave displacement
          float waveH = getWaveHeight(pos.xz, uTime);
          pos.y += waveH;
          vWaveHeight = waveH;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;

          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uTurquoiseColor;
        uniform vec3 uFoamColor;
        uniform vec3 uHighlightColor;
        uniform vec3 uSkyColor;
        uniform vec3 uSunDirection;
        uniform float uTime;

        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying vec2 vUv;
        varying float vWaveHeight;

        // Poseidon Ocean Choppy Wave Octave (Tuned for calm mountain pond and stream)
        float sea_octave(vec2 uv, float choppy) {
          vec2 n = vec2(sin(uv.y * 1.5 + uv.x * 0.8), cos(uv.x * 1.3 - uv.y * 0.9)) * 0.20;
          vec2 p = uv + n;
          vec2 wv = 1.0 - abs(sin(p));
          vec2 swv = abs(cos(p));
          wv = mix(wv, swv, wv);
          return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
        }

        const mat2 octMat = mat2(1.6, 1.2, -1.2, 1.6);

        float getWaveHeight(vec2 p, float time) {
          float freq = 0.42;
          float amp = 0.018;   // Gentle 1.8cm ripples
          float choppy = 1.85; // Soft natural wave peaks
          float h = 0.0;
          float t = time * 0.42; // Peaceful, tranquil drift
          vec2 uv = p;

          for (int i = 0; i < 3; i++) {
            float d = sea_octave((uv + vec2(t * 0.5, t * 0.35)) * freq, choppy);
            d += sea_octave((uv - vec2(t * 0.35, t * 0.55)) * freq, choppy);
            h += d * amp;
            uv = octMat * uv;
            freq *= 1.80;
            amp *= 0.28;
            choppy = mix(choppy, 1.0, 0.20);
          }
          return h;
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);

          // 1. Dynamic Surface Normal via Smooth Finite Difference
          vec2 eps = vec2(0.12, 0.0);
          float hL = getWaveHeight(vWorldPosition.xz - eps.xy, uTime);
          float hR = getWaveHeight(vWorldPosition.xz + eps.xy, uTime);
          float hD = getWaveHeight(vWorldPosition.xz - eps.yx, uTime);
          float hU = getWaveHeight(vWorldPosition.xz + eps.yx, uTime);
          vec3 waveNormal = normalize(vec3(hL - hR, 2.0 * eps.x, hD - hU));

          // Soft micro-ripple detail overlay
          vec2 micro = sin(vWorldPosition.xz * 3.2 + uTime * 1.4);
          waveNormal = normalize(waveNormal + vec3(micro.x * 0.018, 0.0, micro.y * 0.018));

          // 2. Underwater Refractive Caustic Shimmer (Calm, slow-moving)
          vec2 cUv1 = vWorldPosition.xz * 0.22 + vec2(uTime * 0.04, uTime * 0.03);
          vec2 cUv2 = vWorldPosition.xz * 0.28 + vec2(-uTime * 0.035, uTime * 0.045);
          float c1 = sin(cUv1.x * 2.0 + sin(cUv1.y * 2.2)) * cos(cUv1.y * 2.0 + sin(cUv1.x * 1.8));
          float c2 = cos(cUv2.x * 2.2 - cos(cUv2.y * 1.9)) * sin(cUv2.y * 2.3 + cos(cUv2.x * 2.1));
          float caustics = clamp((c1 * c2 + 0.25) * 0.25, 0.0, 0.28);

          // 3. River Depth Ramp
          float depthFactor;
          if (vWorldPosition.z < 35.0) {
            float streamDist = abs(vWorldPosition.x - 1.2);
            depthFactor = clamp(1.0 - streamDist / 2.2, 0.0, 1.0);
          } else {
            float riverCenter = 26.0 + (vWorldPosition.z - 35.0) * 0.08;
            float distFromCenter = abs(vWorldPosition.x - riverCenter);
            depthFactor = clamp(1.0 - distFromCenter / 17.5, 0.0, 1.0);
          }

          // Base water color: shallow emerald turquoise at banks, deep rich sapphire in channel
          vec3 baseWater = mix(uShallowColor, uDeepColor, depthFactor * 0.88);

          // 4. Subtle Subsurface Scattering (Gentle translucent glow on gentle wave crests)
          float sss = pow(max(dot(viewDir, -uSunDirection + waveNormal * 0.45), 0.0), 3.0) * pow(clamp(1.0 - waveNormal.y, 0.0, 1.0), 1.5);
          vec3 waterColor = mix(baseWater, uTurquoiseColor, clamp(sss * 0.85 + 0.12 * (1.0 - waveNormal.y) + caustics * 0.18, 0.0, 1.0));

          // 5. Dual-Power Specular Sun Glitter (Refined, delicate pinpoint glints)
          vec3 halfVec = normalize(viewDir + uSunDirection);
          float NdotH = max(dot(waveNormal, halfVec), 0.0);
          float tightGlint = pow(NdotH, 320.0) * 2.2;
          float broadGlitter = pow(NdotH, 42.0) * 0.28;
          vec3 sunSpecular = vec3(1.0, 0.96, 0.88) * (tightGlint + broadGlitter);

          // 6. White Foam on Occasional Crests (Subtle, gentle lace)
          float crestFoam = smoothstep(0.010, 0.026, vWaveHeight) * smoothstep(0.16, 0.40, 1.0 - waveNormal.y);
          float foamNoise = sin(vWorldPosition.x * 6.5 + sin(vWorldPosition.z * 6.5 + uTime * 1.2));
          crestFoam *= smoothstep(-0.20, 0.60, foamNoise);
          vec3 foamColor = uFoamColor * (crestFoam * 0.50);

          // 7. Fresnel Sky Reflection (Gentle, elegant sky reflection)
          float NdotV = clamp(dot(waveNormal, viewDir), 0.0, 1.0);
          float fresnel = 0.04 + 0.96 * pow(1.0 - NdotV, 4.5);
          vec3 refSky = mix(uSkyColor, vec3(0.48, 0.74, 0.92), 0.45);
          vec3 finalColor = mix(waterColor, refSky, fresnel * 0.45) + sunSpecular + foamColor;

          gl_FragColor = vec4(finalColor, 0.88);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Natural Aerated Waterfall Shader (Vertical rushing flow, bold foam striations, vibrant azure water)
    this.waterfallMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x0088b8) },
        uFoamColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec3 pos = position;
          // Gentle, organic water billow (calm, subtle undulating flume)
          pos.z += sin(pos.y * 2.6 - uTime * 2.8) * 0.020 + cos(pos.x * 3.2 + uTime * 1.8) * 0.014;
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uFoamColor;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          // Downward graceful torrent flow lines (subtle, calm cascade)
          float flow1 = sin(vUv.x * 18.0 + sin(vUv.y * 10.0 - uTime * 3.6)) * 0.5 + 0.5;
          float flow2 = cos(vUv.x * 28.0 - vUv.y * 14.0 + uTime * 4.2) * 0.5 + 0.5;
          float verticalFlow = mix(flow1, flow2, 0.5);

          // Silky foam curtains & gentle ribbons flowing gracefully DOWNWARDS
          float foam1 = sin((vUv.y - uTime * 2.8) * 20.0 + sin(vUv.x * 10.0) * 1.6);
          float foam2 = cos((vUv.y - uTime * 3.8) * 26.0 + cos(vUv.x * 14.0) * 2.0);
          float foam = smoothstep(0.32, 0.80, (foam1 + foam2) * 0.5 + verticalFlow * 0.40);

          // Feathered side edges
          float edgeDistX = min(vUv.x, 1.0 - vUv.x);
          float edgeAlphaX = smoothstep(0.0, 0.06, edgeDistX);
          float edgeDistY = min(vUv.y, 1.0 - vUv.y);
          float edgeAlphaY = smoothstep(0.0, 0.04, edgeDistY);
          float edgeAlpha = edgeAlphaX * edgeAlphaY;

          // Vivid crystalline aqua-cyan water core (matching reference art)
          vec3 waterCol = mix(uColor, vec3(0.0, 0.72, 0.88), vUv.y * 0.40);
          // Delicate sun glints
          float glint = pow(max(0.0, sin(vUv.y * 20.0 - uTime * 5.0) * cos(vUv.x * 14.0)), 4.0) * 0.22;
          vec3 finalColor = mix(waterCol, uFoamColor, clamp(foam + (1.0 - edgeAlphaX) * 0.40 + 0.28 + glint, 0.0, 1.0));
          
          // Smooth, elegant opacity
          float alpha = (0.90 + foam * 0.10) * edgeAlpha;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  private nightFactor = 0;

  public setDayNightBlend(factor: number): void {
    this.nightFactor = THREE.MathUtils.clamp(factor, 0, 1);
    const day = VISUAL_CONFIG.dayNight.day;
    const night = VISUAL_CONFIG.dayNight.night;

    // Water shader daylight -> moonlight transition
    const daySunDir = day.sunPosition.clone().normalize();
    const nightMoonDir = night.sunPosition.clone().normalize();
    this.waterMaterial.uniforms.uSunDirection.value.copy(daySunDir).lerp(nightMoonDir, this.nightFactor);

    const dayDeep = new THREE.Color(day.waterDeep);
    const nightDeep = new THREE.Color(night.waterDeep);
    this.waterMaterial.uniforms.uDeepColor.value.copy(dayDeep).lerp(nightDeep, this.nightFactor);

    const dayShallow = new THREE.Color(day.waterShallow);
    const nightShallow = new THREE.Color(night.waterShallow);
    this.waterMaterial.uniforms.uShallowColor.value.copy(dayShallow).lerp(nightShallow, this.nightFactor);

    const dayTurquoise = new THREE.Color(day.waterTurquoise);
    const nightTurquoise = new THREE.Color(night.waterTurquoise);
    this.waterMaterial.uniforms.uTurquoiseColor.value.copy(dayTurquoise).lerp(nightTurquoise, this.nightFactor);

    const dayHighlight = new THREE.Color(day.waterHighlight);
    const nightHighlight = new THREE.Color(night.waterHighlight);
    this.waterMaterial.uniforms.uHighlightColor.value.copy(dayHighlight).lerp(nightHighlight, this.nightFactor);

    const daySky = new THREE.Color(day.waterSky);
    const nightSky = new THREE.Color(night.waterSky);
    this.waterMaterial.uniforms.uSkyColor.value.copy(daySky).lerp(nightSky, this.nightFactor);

    // Waterfall night color
    const dayWf = new THREE.Color(0x0088b8);
    const nightWf = new THREE.Color(0x004c78);
    this.waterfallMaterial.uniforms.uColor.value.copy(dayWf).lerp(nightWf, this.nightFactor);

    // Snow on roofs night moonlit color
    const daySnow = new THREE.Color(0xf4f9fd);
    const nightSnow = new THREE.Color(0x8fa4ba);
    this.snowRoofMaterial.color.copy(daySnow).lerp(nightSnow, this.nightFactor * 0.65);
  }

  public setSeasonBlend(fromSeason: Season, toSeason: Season, factor: number): void {
    const t = THREE.MathUtils.clamp(factor, 0, 1);
    const fromF = VISUAL_CONFIG.seasons[fromSeason].foliage;
    const toF = VISUAL_CONFIG.seasons[toSeason].foliage;

    // Winter Roof Snow Blanket
    const fromSnow = fromSeason === 'winter' ? 1.0 : 0.0;
    const toSnow = toSeason === 'winter' ? 1.0 : 0.0;
    const snowFactor = THREE.MathUtils.lerp(fromSnow, toSnow, t);

    this.snowRoofMaterial.opacity = snowFactor * 0.98;
    this.snowRoofMaterial.visible = this.snowRoofMaterial.opacity > 0.01;

    // Apply cold frost to thatched roofs and charcoal slate tiles in winter
    const defaultRoofTile = new THREE.Color(VISUAL_CONFIG.palette.roofTileCharcoal);
    const winterRoofTile = new THREE.Color(0x657585); // Frost-dusted slate
    this.roofTileMaterial.color.copy(defaultRoofTile).lerp(winterRoofTile, snowFactor * 0.65);

    const defaultThatch = new THREE.Color(VISUAL_CONFIG.palette.thatchedRoofGold);
    const winterThatch = new THREE.Color(0xc2cfdc); // Frost-dusted thatch straw
    this.thatchedRoofMaterial.color.copy(defaultThatch).lerp(winterThatch, snowFactor * 0.85);

    const defaultThatchShadow = new THREE.Color(VISUAL_CONFIG.palette.thatchedRoofShadow);
    const winterThatchShadow = new THREE.Color(0x889baa);
    this.thatchedRoofShadowMaterial.color.copy(defaultThatchShadow).lerp(winterThatchShadow, snowFactor * 0.85);

    // Conifers & Pines
    const pineFrom = new THREE.Color(fromF.pine);
    const pineTo = new THREE.Color(toF.pine);
    this.pineFoliageDark.color.copy(pineFrom).lerp(pineTo, t);
    this.pineFoliageLight.color.copy(pineFrom).lerp(pineTo, t).offsetHSL(0.02, 0.05, 0.08);

    // Broadleaf trees
    const broadFrom = new THREE.Color(fromF.broadleaf);
    const broadTo = new THREE.Color(toF.broadleaf);
    this.broadleafFoliage.color.copy(broadFrom).lerp(broadTo, t);
    this.broadleafFoliageLight.color.copy(broadFrom).lerp(broadTo, t).offsetHSL(0.01, 0.04, 0.07);

    // Sakura blossoms
    const sakuraFrom = new THREE.Color(fromF.sakura);
    const sakuraTo = new THREE.Color(toF.sakura);
    this.cherryBlossomFoliage.color.copy(sakuraFrom).lerp(sakuraTo, t);

    // Japanese Maples (Momiji)
    const mapleFrom = new THREE.Color(fromF.maple);
    const mapleTo = new THREE.Color(toF.maple);
    this.autumnFoliage.color.copy(mapleFrom).lerp(mapleTo, t);

    // Bushes & Meadow Grass
    const bushFrom = new THREE.Color(fromF.bush);
    const bushTo = new THREE.Color(toF.bush);
    this.bushMaterial.color.copy(bushFrom).lerp(bushTo, t);
    this.grassMaterial.color.copy(bushFrom).lerp(bushTo, t);

    // Crops & Agricultural Props
    if (toSeason === 'autumn' || fromSeason === 'autumn') {
      const autumnWheat = new THREE.Color(0xd48b28);
      const normalWheat = new THREE.Color(0xe5b045);
      this.wheatMaterial.color.copy(normalWheat).lerp(autumnWheat, t);
    } else if (toSeason === 'winter' || fromSeason === 'winter') {
      const winterWheat = new THREE.Color(0xcddce8);
      const normalWheat = new THREE.Color(0xe5b045);
      this.wheatMaterial.color.copy(normalWheat).lerp(winterWheat, t);
    }
  }

  public update(time: number): void {
    this.waterMaterial.uniforms.uTime.value = time;
    this.waterfallMaterial.uniforms.uTime.value = time;

    // Animate warm lantern flame flicker when lit at night
    if (this.nightFactor > 0.05) {
      const flicker = 1.0 + Math.sin(time * 7.5) * 0.07 + Math.cos(time * 13.0) * 0.04;
      this.lanternFlameMaterial.emissiveIntensity = this.nightFactor * 1.8 * flicker;
      this.shojiWindowGlowMaterial.emissiveIntensity = this.nightFactor * 1.25 * (1.0 + Math.sin(time * 2.2) * 0.03);
    } else {
      this.lanternFlameMaterial.emissiveIntensity = 0.0;
      this.shojiWindowGlowMaterial.emissiveIntensity = 0.0;
    }
  }
}
