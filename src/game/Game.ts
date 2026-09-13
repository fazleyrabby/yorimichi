import * as THREE from 'three';
import { MaterialLibrary } from '../rendering/Materials';
import { LightingSystem } from '../rendering/Lighting';
import { AtmosphereSystem } from '../rendering/Atmosphere';
import { ParticleSystem } from '../rendering/Particles';
import { CameraSystem, CameraMode } from '../camera/CameraSystem';
import { PlayerController } from '../player/PlayerController';
import { Player } from '../player/Player';
import { World } from '../world/World';
import { GameLoop } from './GameLoop';
import { WORLD_CONFIG } from '../config/world';
import { GhibliPassSystem } from '../rendering/GhibliPass';
import { SoundSystem } from '../audio/SoundSystem';
import { Minimap } from '../ui/Minimap';

export class Game {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: CameraSystem;
  public materials: MaterialLibrary;
  public lighting: LightingSystem;
  public atmosphere: AtmosphereSystem;
  public particles: ParticleSystem;
  public world: World;
  public player: Player;
  public controller: PlayerController;
  public gameLoop: GameLoop;
  public ghibliPass: GhibliPassSystem;
  public soundSystem: SoundSystem;
  public minimap!: Minimap;
  public isNight: boolean = false;
  public dayNightBlend: number = 0;
  public targetDayNightBlend: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // 1. WebGL Renderer with filmic tone mapping and soft shadows
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 2. Scene
    this.scene = new THREE.Scene();

    // 3. Camera System (Isometric & Third-Person)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new CameraSystem(aspect);
    this.camera.onModeChange = (mode) => this.onCameraModeChange(mode);

    // 4. Materials Library
    this.materials = new MaterialLibrary();

    // 5. Lighting & Atmosphere
    this.lighting = new LightingSystem(this.scene);
    this.atmosphere = new AtmosphereSystem(this.scene);
    this.particles = new ParticleSystem(this.scene);

    // 6. World (Ghibli Hamlet, Watermill, Market, Wheat Fields, Veg Gardens, Vegetation)
    this.world = new World(this.scene, this.materials, this.particles);

    // 7. Post-Processing Pipeline
    this.ghibliPass = new GhibliPassSystem(this.renderer, this.scene, this.camera.activeCamera);

    // 8. Player Character & Controller
    this.controller = new PlayerController();
    this.player = new Player(this.controller, this.world.assetGen);

    // 9. Procedural Web Audio Soundscape
    this.soundSystem = new SoundSystem();
    this.player.onFootstep = (isStone) => {
      this.soundSystem.playFootstep(isStone);
    };
    this.initAudioUI();
    this.initCameraUI();
    this.initTimeUI();
    
    // Position player at world start
    const startX = WORLD_CONFIG.playerStart.x;
    const startZ = WORLD_CONFIG.playerStart.z;
    const startY = this.world.getHeightAt(startX, startZ);
    this.player.position.set(startX, startY, startZ);
    this.player.mesh.position.copy(this.player.position);
    this.scene.add(this.player.mesh);

    // Position camera initially centered on player or query target
    const urlParams = new URLSearchParams(window.location.search);
    const camPreset = urlParams.get('cam');
    if (camPreset === 'river') {
      this.camera.isDetachedFromPlayer = true;
      this.camera.target.set(25, 1.2, 54);
      this.camera.update(this.camera.target);
    } else if (camPreset === 'footbridge') {
      this.camera.isDetachedFromPlayer = true;
      this.camera.target.set(1.5, 2.5, -18);
      this.camera.update(this.camera.target);
    } else if (camPreset === 'watermill') {
      this.camera.isDetachedFromPlayer = true;
      this.camera.target.set(4.5, 2.5, -11);
      this.camera.update(this.camera.target);
    } else if (camPreset === 'stonebridge') {
      this.camera.isDetachedFromPlayer = true;
      this.camera.target.set(2.0, 3.0, 10);
      this.camera.update(this.camera.target);
    } else if (camPreset === 'riverbanks') {
      this.camera.isDetachedFromPlayer = true;
      this.camera.target.set(12, 1.8, 25);
      this.camera.update(this.camera.target);
    } else if (camPreset === 'dock') {
      this.camera.isDetachedFromPlayer = true;
      this.camera.target.set(25, 1.0, 42);
      this.camera.update(this.camera.target);
    } else if (camPreset === 'wheat') {
      this.camera.isDetachedFromPlayer = true;
      this.camera.target.set(38, 2.0, 27);
      this.camera.update(this.camera.target);
    } else if (camPreset === 'market') {
      this.camera.isDetachedFromPlayer = true;
      this.camera.target.set(18, 2.0, 2);
      this.camera.update(this.camera.target);
    } else if (camPreset === 'viewpoint' || camPreset === 'summit' || camPreset === 'overlook') {
      this.camera.isDetachedFromPlayer = true;
      this.camera.target.set(-8, 12.8, -47);
      this.camera.update(this.camera.target);
    } else if (camPreset === 'character' || camPreset === 'samurai' || camPreset === 'chibi') {
      this.camera.setupThirdPerson(4.2, 0.15, 0.22);
      this.camera.target.copy(this.player.position);
      this.camera.update(this.player.position);
    } else {
      this.camera.target.copy(this.player.position);
      this.camera.update(this.player.position);
    }

    // 10. AOE Diamond Minimap
    const mapContainer = document.getElementById('aoe-minimap-container');
    if (mapContainer) {
      this.minimap = new Minimap(mapContainer, this.world);
    }

    // 11. Game Loop
    this.gameLoop = new GameLoop((delta, time) => this.update(delta, time));
    this.gameLoop.start();

    // Resize listener
    window.addEventListener('resize', this.onResize);
  }

  private initAudioUI(): void {
    const btn = document.getElementById('audio-toggle');
    if (!btn) return;
    const iconOn = btn.querySelector('.audio-on') as HTMLElement | null;
    const iconOff = btn.querySelector('.audio-off') as HTMLElement | null;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = this.soundSystem.toggleMute();
      if (iconOn && iconOff) {
        iconOn.style.display = isMuted ? 'none' : 'block';
        iconOff.style.display = isMuted ? 'block' : 'none';
      }
    });
  }

  private initCameraUI(): void {
    const camBtn = document.getElementById('camera-toggle');
    if (camBtn) {
      camBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.camera.toggleMode();
      });
    }

    const camCard = document.getElementById('aoe-action-cam');
    if (camCard) {
      camCard.addEventListener('click', (e) => {
        e.stopPropagation();
        this.camera.toggleMode();
      });
    }

    const rotateCard = document.getElementById('aoe-action-rotate');
    if (rotateCard) {
      rotateCard.addEventListener('click', (e) => {
        e.stopPropagation();
        this.camera.rotateAzimuth(Math.PI / 4);
      });
    }

    const centerCard = document.getElementById('aoe-action-center');
    if (centerCard) {
      centerCard.addEventListener('click', (e) => {
        e.stopPropagation();
        this.camera.recenterOnPlayer(this.player.position);
      });
    }

    const recenterBtn = document.getElementById('aoe-recenter-btn');
    if (recenterBtn) {
      recenterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.camera.recenterOnPlayer(this.player.position);
      });
    }

    this.camera.onDetachChange = (detached: boolean) => {
      if (recenterBtn) {
        recenterBtn.style.display = detached ? 'flex' : 'none';
      }
    };
  }

  private initTimeUI(): void {
    const btn = document.getElementById('time-toggle');
    const toggleNight = (forceNight?: boolean) => {
      this.isNight = forceNight !== undefined ? forceNight : !this.isNight;
      this.targetDayNightBlend = this.isNight ? 1.0 : 0.0;
      if (btn) {
        btn.textContent = this.isNight ? '🌙' : '☀️';
        btn.setAttribute('title', this.isNight ? 'Switch to Day (N)' : 'Switch to Night (N)');
      }
      const subtitle = document.querySelector('.aoe-banner-sub');
      if (subtitle) {
        subtitle.textContent = this.isNight
          ? '✦ MOONLIT TRANQUILITY • CRICKET CHIRPS ✦'
          : '✦ MORNING TRANQUILITY • GENTLE BREEZE ✦';
      }
    };

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNight();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyN' && !e.repeat) {
        toggleNight();
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('time') === 'night' || urlParams.has('night')) {
      toggleNight(true);
      this.dayNightBlend = 1.0;
      this.applyDayNightBlend(1.0);
    }
  }

  public applyDayNightBlend(blend: number): void {
    this.lighting.setDayNightBlend(blend, this.player.position);
    this.atmosphere.setDayNightBlend(blend);
    this.materials.setDayNightBlend(blend);
    this.particles.setDayNightBlend(blend);
    this.world.setDayNightBlend(blend);
    this.soundSystem.setDayNightBlend(blend);
  }

  private onCameraModeChange(mode: CameraMode): void {
    this.ghibliPass.setCamera(this.camera.activeCamera);
    const iconEl = document.getElementById('camera-btn-icon');
    const labelEl = document.getElementById('aoe-cam-label');
    if (mode === 'third_person') {
      if (iconEl) iconEl.textContent = '👤';
      if (labelEl) labelEl.textContent = '3rd Person';
    } else {
      if (iconEl) iconEl.textContent = '🎥';
      if (labelEl) labelEl.textContent = 'Isometric';
    }
  }

  private bellChimeCount = 0;

  private updateAOEHUD(speed: number): void {
    const distToBicycle = this.world.isBicycleParked
      ? Math.round(this.player.position.distanceTo(this.world.bicyclePosition))
      : 999;

    // 1. Travel Mode with live bicycle distance meter
    const travelEl = document.getElementById('aoe-travel-mode');
    if (travelEl) {
      if (this.player.isRidingBicycle) {
        travelEl.textContent = 'BICYCLE';
      } else {
        travelEl.textContent = distToBicycle < 120 ? `ON FOOT (${distToBicycle}m 🚲)` : 'ON FOOT';
      }
    }

    // 2. Chime Count
    const bellEl = document.getElementById('aoe-bell-count');
    if (bellEl) {
      bellEl.textContent = this.bellChimeCount.toString();
    }

    // 3. Pace
    const paceEl = document.getElementById('aoe-pace');
    if (paceEl) {
      if (speed < 0.1) paceEl.textContent = 'REST';
      else if (speed < 4.5) paceEl.textContent = 'STROLL';
      else if (speed < 8.0) paceEl.textContent = 'COAST';
      else paceEl.textContent = 'SPRINT';
    }

    // 4. Summit Overlook Landmark Zone Check & District Header Update
    const distToViewpoint = Math.hypot(this.player.position.x - (-8.0), this.player.position.z - (-60.0));
    const isAtViewpoint = distToViewpoint < 6.5;
    const benchPos = new THREE.Vector3(-6.0, 16.55, -61.2);
    const distToBench = this.player.position.distanceTo(benchPos);
    const isNearBench = distToBench < 2.4 && !this.player.isRidingBicycle;

    const kanjiEl = document.getElementById('aoe-district-kanji');
    const romanEl = document.getElementById('aoe-district-roman');
    const subDistrictEl = document.getElementById('aoe-district-sub');

    if (isAtViewpoint) {
      if (kanjiEl) kanjiEl.textContent = '峰の展望台';
      if (romanEl) romanEl.textContent = 'SUMMIT PANORAMA OVERLOOK';
      if (subDistrictEl) subDistrictEl.innerHTML = '<span class="aoe-sub-dot" style="color:#38bdf8">✦</span> PANORAMIC VALLEY VISTA • FULL WORLD VIEW <span class="aoe-sub-dot" style="color:#38bdf8">✦</span>';
    } else {
      if (kanjiEl) kanjiEl.textContent = '寄り道';
      if (romanEl) romanEl.textContent = 'KAMISATO HAMLET';
      if (subDistrictEl) subDistrictEl.innerHTML = '<span class="aoe-sub-dot">✦</span> MORNING TRANQUILITY • GENTLE BREEZE <span class="aoe-sub-dot">✦</span>';
    }

    // 5. Command Deck Profile & Bicycle Action Prompt
    const iconEl = document.getElementById('aoe-profile-icon');
    const titleEl = document.getElementById('aoe-profile-title');
    const subEl = document.getElementById('aoe-profile-subtitle');
    const bikeActionLabel = document.getElementById('aoe-bike-action-label');

    if (this.player.isSeatedOnBench) {
      if (iconEl) iconEl.textContent = '🪑';
      if (titleEl) titleEl.textContent = 'RESTING TRAVELER';
      if (subEl) subEl.innerHTML = '<span style="color:#38bdf8;font-weight:600;">Seated at Lookout • Gazing over peaceful valley (Press WASD or E to Stand)</span>';
      if (bikeActionLabel) bikeActionLabel.textContent = 'Stand Up';
    } else if (this.player.isRidingBicycle) {
      if (iconEl) iconEl.textContent = '🚲';
      if (titleEl) titleEl.textContent = 'BICYCLIST';
      if (subEl) {
        subEl.textContent = isAtViewpoint
          ? 'Summit Overlook • Scenic Mountain Ridge Trail'
          : 'Cruising Countryside Trail';
      }
      if (bikeActionLabel) bikeActionLabel.textContent = 'Dismount';
    } else {
      if (iconEl) iconEl.textContent = '🚶';
      if (titleEl) titleEl.textContent = 'TRAVELER';
      if (isNearBench) {
        if (subEl) subEl.innerHTML = '<span style="color:#38bdf8;font-weight:600;">🪑 Viewpoint Bench • Press E to Sit & Rest</span>';
        if (bikeActionLabel) bikeActionLabel.innerHTML = '<span style="color:#38bdf8;font-weight:700;">Sit</span>';
      } else if (isAtViewpoint) {
        if (subEl) subEl.innerHTML = '<span style="color:#38bdf8;font-weight:600;">Standing at Summit Deck • Gazing over full world vista</span>';
        if (bikeActionLabel) bikeActionLabel.textContent = distToBicycle < 3.2 ? 'Mount' : `Ride (${distToBicycle}m)`;
      } else if (distToBicycle < 3.2) {
        if (subEl) subEl.innerHTML = '<span style="color:#4ade80;font-weight:600;">Press E / Shift to Ride Bicycle!</span>';
        if (bikeActionLabel) bikeActionLabel.innerHTML = '<span style="color:#4ade80;font-weight:700;">Mount</span>';
      } else {
        if (subEl) subEl.textContent = `Bicycle parked in Agora (${distToBicycle}m)`;
        if (bikeActionLabel) bikeActionLabel.textContent = `Ride (${distToBicycle}m)`;
      }
    }
  }

  private update(delta: number, time: number): void {
    // Check Bicycle Bell input
    if (this.controller.consumeBell()) {
      this.soundSystem.playBicycleBell();
      this.bellChimeCount++;
    }

    const benchPos = new THREE.Vector3(-6.0, 16.55, -61.2);
    const distToBench = this.player.position.distanceTo(benchPos);

    // Bench sitting interaction (E key or interact)
    if (this.player.isSeatedOnBench) {
      if (this.controller.consumeInteract()) {
        this.player.standUpFromBench();
      }
    } else if (!this.player.isRidingBicycle && distToBench < 2.4) {
      if (this.controller.consumeInteract()) {
        this.player.sitOnBench(benchPos, 0.05);
      }
    }

    // 1. Check Bicycle Proximity & Interaction
    if (!this.player.isSeatedOnBench) {
      if (this.player.isRidingBicycle) {
        if (this.controller.consumeInteract()) {
          this.player.dismountBicycle();
          this.world.parkBicycleAt(this.player.position, this.player.mesh.rotation.y);
        }
      } else {
        const distToBicycle = this.world.isBicycleParked
          ? this.player.position.distanceTo(this.world.bicyclePosition)
          : 999;

        if (distToBicycle < 3.2) {
          if (this.controller.consumeInteract()) {
            this.world.takeBicycle();
            this.player.mountBicycle();
          }
        }
      }
    }

    // Align player input direction with active camera perspective
    this.controller.setOrientation(this.camera.getForwardVector());

    // 2. Update Player
    this.player.update(delta, this.world);

    // Update dynamic Soundscape (spatial water, mountain wind, tire rolling)
    const currentSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    this.soundSystem.update(delta, time, this.player.position, this.player.isRidingBicycle, currentSpeed);

    // Update AOE HUD badges and command deck
    this.updateAOEHUD(currentSpeed);

    // Update AOE Diamond Minimap
    if (this.minimap) {
      this.minimap.update(this.player.position, this.player.mesh.rotation.y);
    }

    // 3. Update Camera follow (passes player velocity for intelligent 3rd person follow)
    this.camera.update(this.player.position, this.player.velocity);

    // 4. Update Day/Night smooth cinematic crossfade
    if (Math.abs(this.dayNightBlend - this.targetDayNightBlend) > 0.0005) {
      const step = delta * 0.8;
      if (this.dayNightBlend < this.targetDayNightBlend) {
        this.dayNightBlend = Math.min(this.targetDayNightBlend, this.dayNightBlend + step);
      } else {
        this.dayNightBlend = Math.max(this.targetDayNightBlend, this.dayNightBlend - step);
      }
      this.applyDayNightBlend(this.dayNightBlend);
    }

    // 5. Update Lighting follow
    this.lighting.update(this.player.position);

    // 5. Update World (shaders, animated water)
    this.world.update(delta, time);

    // 6. Update Atmosphere & Particles
    this.particles.update(delta, time);

    // 7. Render via Studio Ghibli Inking & Color Grading Pipeline
    this.ghibliPass.render();
  }

  private onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pr);
    this.camera.onResize(width / height);
    this.ghibliPass.setSize(width, height, pr);
  };

  public dispose(): void {
    this.gameLoop.stop();
    window.removeEventListener('resize', this.onResize);
    this.camera.dispose();
    this.ghibliPass.dispose();
    this.renderer.dispose();
  }
}
