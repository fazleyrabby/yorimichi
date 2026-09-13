import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Ghibli Storybook Inking & Painterly Color Grading Shader
 * Detects contrast/depth edges to draw hand-inked line art, lifts shadows,
 * and harmonizes tones with the warm, vibrant Studio Ghibli aesthetic.
 */
const GhibliShader = {
  name: 'GhibliStorybookShader',
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uOutlineStrength: { value: 0.0 }, // Clean AOE sun-drenched look (no cartoon Sobel artifacts)
    uOutlineColor: { value: new THREE.Color(0x281c14) },
    uWarmth: { value: 0.0 }, // Natural neutral daylight tone
    uVibrance: { value: 1.05 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uOutlineStrength;
    uniform vec3 uOutlineColor;
    uniform float uWarmth;
    uniform float uVibrance;
    varying vec2 vUv;

    // Luminance formula
    float getLuma(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    void main() {
      vec2 texel = 1.0 / uResolution;
      vec4 centerColor = texture2D(tDiffuse, vUv);

      // Multi-tap edge sampling for hand-drawn ink contours
      vec3 cTL = texture2D(tDiffuse, vUv + vec2(-texel.x,  texel.y)).rgb;
      vec3 cTR = texture2D(tDiffuse, vUv + vec2( texel.x,  texel.y)).rgb;
      vec3 cBL = texture2D(tDiffuse, vUv + vec2(-texel.x, -texel.y)).rgb;
      vec3 cBR = texture2D(tDiffuse, vUv + vec2( texel.x, -texel.y)).rgb;

      vec3 cT  = texture2D(tDiffuse, vUv + vec2(0.0,  texel.y)).rgb;
      vec3 cB  = texture2D(tDiffuse, vUv + vec2(0.0, -texel.y)).rgb;
      vec3 cL  = texture2D(tDiffuse, vUv + vec2(-texel.x, 0.0)).rgb;
      vec3 cR  = texture2D(tDiffuse, vUv + vec2( texel.x, 0.0)).rgb;

      // Sobel kernel for edge gradients
      float lTL = getLuma(cTL); float lTR = getLuma(cTR);
      float lBL = getLuma(cBL); float lBR = getLuma(cBR);
      float lT  = getLuma(cT);  float lB  = getLuma(cB);
      float lL  = getLuma(cL);  float lR  = getLuma(cR);

      float gx = (lTR + 2.0 * lR + lBR) - (lTL + 2.0 * lL + lBL);
      float gy = (lBL + 2.0 * lB + lBR) - (lTL + 2.0 * lT + lTR);
      float edge = sqrt(gx * gx + gy * gy);

      // Color discontinuity detection (sharp hue shifts at boundaries)
      vec3 colDiffX = abs(cR - cL);
      vec3 colDiffY = abs(cT - cB);
      float colorEdge = max(max(colDiffX.r, colDiffX.g), colDiffX.b) +
                        max(max(colDiffY.r, colDiffY.g), colDiffY.b);

      float totalEdge = clamp((edge * 1.8 + colorEdge * 1.2) * uOutlineStrength, 0.0, 1.0);
      
      // Smooth threshold for ink line
      float inkFactor = smoothstep(0.12, 0.38, totalEdge);

      // Base painterly color grading
      vec3 color = centerColor.rgb;

      // Soft natural shadow lift (prevents crushed blacks)
      color = mix(color, max(color, vec3(0.04, 0.04, 0.045)), 0.35);

      // Natural gentle warmth only if configured
      if (uWarmth > 0.001) {
        color.r += uWarmth * 0.15;
        color.b -= uWarmth * 0.05;
      }

      // Subtle natural vibrance boost
      float luma = getLuma(color);
      float maxCol = max(color.r, max(color.g, color.b));
      float minCol = min(color.r, min(color.g, color.b));
      float sat = (maxCol - minCol) / (maxCol + 0.001);
      float vibFactor = (1.0 - sat) * (uVibrance - 1.0);
      color = mix(vec3(luma), color, 1.0 + vibFactor);

      // Apply delicate hand-drawn dark ink contour
      color = mix(color, uOutlineColor, inkFactor * 0.72);

      // Subtle vignette for cozy diorama framing
      vec2 coord = (vUv - 0.5) * 2.0;
      float vignette = 1.0 - dot(coord, coord) * 0.14;
      color *= clamp(vignette, 0.82, 1.0);

      gl_FragColor = vec4(color, centerColor.a);
    }
  `,
};

export class GhibliPassSystem {
  public composer: EffectComposer;
  private ghibliPass: ShaderPass;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    this.ghibliPass = new ShaderPass(GhibliShader);
    this.ghibliPass.uniforms.uResolution.value.set(
      window.innerWidth * renderer.getPixelRatio(),
      window.innerHeight * renderer.getPixelRatio()
    );
    this.composer.addPass(this.ghibliPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  public setSize(width: number, height: number, pixelRatio: number): void {
    this.composer.setSize(width, height);
    this.composer.setPixelRatio(pixelRatio);
    this.ghibliPass.uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
  }

  public setCamera(camera: THREE.Camera): void {
    const renderPass = this.composer.passes[0] as RenderPass;
    if (renderPass) {
      renderPass.camera = camera;
    }
  }

  public render(): void {
    this.composer.render();
  }

  public dispose(): void {
    this.composer.renderTarget1.dispose();
    this.composer.renderTarget2.dispose();
  }
}
