import * as THREE from 'three';

export const VISUAL_CONFIG = {
  camera: {
    azimuth: Math.PI / 4,                     // 45 degrees
    elevation: Math.atan(1 / Math.SQRT2),     // 35.264 degrees (True Mathematical Isometric)
    frustumSize: 82,                          // Expansive RTS diorama overview
    near: 0.1,
    far: 650,
    smoothing: 0.08,                          // Smooth follow
    offsetDistance: 170,                      // Distance from target
  },
  lighting: {
    sunColor: 0xfffaf2,                       // Clean, bright natural sunlight
    sunIntensity: 1.95,
    sunPosition: new THREE.Vector3(-65, 100, -50), // Classic storybook top-left sunlight
    ambientSkyColor: 0xd6eaff,                // Clear blue sky bounce
    ambientGroundColor: 0x365230,             // Calm natural meadow bounce
    ambientIntensity: 1.05,
    shadowMapSize: 4096,                      // Crisp, clean shadow silhouettes
    shadowBias: 0.0003,
    shadowNormalBias: 0.025,
    shadowFrustumSize: 72,
  },
  fog: {
    color: 0xd4e2dc,                          // Soft mountain horizon haze
    near: 195,                                // Play area remains crystal clear
    far: 340,                                 // Touches only the distant mountain peaks
  },
  dayNight: {
    day: {
      sunColor: 0xfffaf2,
      sunIntensity: 1.95,
      sunPosition: new THREE.Vector3(-65, 100, -50),
      ambientSkyColor: 0xd6eaff,
      ambientGroundColor: 0x365230,
      ambientIntensity: 1.05,
      fogColor: 0xd4e2dc,
      skyTopColor: 0xb2cad4,
      skyBottomColor: 0xd4e2dc,
      waterDeep: 0x144368,
      waterShallow: 0x38928e,
      waterTurquoise: 0x22b2a8,
      waterHighlight: 0xfff6dd,
      waterSky: 0xd6eefb,
    },
    night: {
      sunColor: 0x90b8f8, // Soft silvery moonlight
      sunIntensity: 0.82,
      sunPosition: new THREE.Vector3(55, 95, 45),
      ambientSkyColor: 0x121c32, // Deep indigo sky bounce
      ambientGroundColor: 0x09120e, // Deep earthy shadow fill
      ambientIntensity: 0.58,
      fogColor: 0x090e1c, // Midnight blue mountain fog
      skyTopColor: 0x04060e, // Starry midnight zenith
      skyBottomColor: 0x090e1c,
      waterDeep: 0x071526, // Deep nocturnal abyss
      waterShallow: 0x0e2e3d, // Moonlit shallows
      waterTurquoise: 0x165b72, // Luminous moonlit wave crests
      waterHighlight: 0xd8eeff, // Silver moon glitter beam
      waterSky: 0x121e38,
    },
  },
  palette: {
    // Nocturnal lanterns & fireflies
    lanternFlame: 0xffa034,
    lanternGlow: 0xff8818,
    fireflyGlow: 0xbaff38,

    // Terrain - Natural, lush Japanese countryside & meadow tones
    grassMeadow: 0x54863c,                    // Fresh, natural green meadow (no yellow cast)
    grassLush: 0x3b6b2a,                      // Deep lush cedar-shaded glades
    grassHighlight: 0x6ea646,                 // Soft sun-kissed natural green
    grassDry: 0x889666,                       // Natural upland grass
    dirtPath: 0xbda67e,                       // Earthy sand trail
    dirtPathLight: 0xd5cca0,                  // Sunlit flagstone plaza
    rockCliff: 0xe2ded6,                      // Natural chalky limestone / granite
    rockMoss: 0x829468,                       // Soft lichen on rock edges
    shoreSand: 0xd2c3a2,                      // Riverbank gravel
    
    // Vegetation - Ghibli cloud-canopy & summer foliage
    pineGreenDark: 0x224a30,
    pineGreenLight: 0x336b44,
    broadleafGreen: 0x4c8f38,
    broadleafLight: 0x6fb84e,
    broadleafHighlight: 0x93d968,
    cherryBlossomPink: 0xf5b8c6,
    cherryBlossomPetal: 0xfce1e8,
    autumnOrange: 0xd97534,
    flowerYellow: 0xfadc52,
    flowerPurple: 0xab7bc4,
    flowerRed: 0xde4335,
    reedGreen: 0x7ea054,

    // Ghibli Hamlet Architecture
    thatchedRoofGold: 0xd49539,               // Warm honey-gold straw thatch
    thatchedRoofShadow: 0x9e6722,             // Deep thatch shadow
    thatchedRidge: 0x6a4014,                  // Timber roof-ridge cross ties
    roofTileCharcoal: 0x323a42,
    timberDark: 0x422817,                     // Dark aged oak half-timber framing
    timberWarm: 0x6b4528,                     // Warm cedar wood
    timberLight: 0x9e6d42,                    // Light pine & planks
    wallCream: 0xf6eee0,                      // Warm ivory plaster wall
    wallPlaster: 0xeadecc,
    wallShoji: 0xfffaee,
    stoneGranite: 0x767873,                   // River stone foundations & chimneys
    stoneLantern: 0x82847e,
    cobblestone: 0x969185,                    // Village square cobblestones
    cobblestoneLight: 0xaba698,
    toriiVermilion: 0xc83422,
    toriiBaseDark: 0x242222,

    // Agriculture & Market Props
    wheatGold: 0xe5b045,                      // Golden wheat stalks
    wheatAmber: 0xd49a32,                     // Ripe wheat grain
    tilledSoil: 0x4d3626,                     // Dark fertile vegetable bed soil
    cabbageGreen: 0x4ea63b,                   // Vibrant garden cabbage heads
    cabbageHeart: 0x76cf61,
    awningRed: 0xc43b32,                      // Market stall striped canvas
    awningCream: 0xf7efe4,
    cartWood: 0x9c6838,                       // Wooden farm wagons & barrels
    chimneySmoke: 0xf4f1e8,                   // Soft warm smoke puffs

    // Water - Age of Empires III Definitive Edition Realistic Coastal Palette
    waterDeep: 0x09365e,                      // Deep sapphire / navy blue
    waterShallow: 0x148390,                   // Crystalline river turquoise
    waterTurquoise: 0x1faebc,                 // Sunlit clear river azure
    waterFoam: 0xf0fdfa,                      // Crisp seafoam surf white
    waterHighlight: 0xfffae6,                 // Warm brilliant solar specular highlight

    // Character & Vehicle
    charSkin: 0xfce4cd,
    charRobe: 0x2c4e4c,
    charHakama: 0x1f292b,
    charStrawHat: 0xdeba82,
    charSatchel: 0x8a5232,
  },
  animation: {
    windSpeed: 2.0,
    windStrength: 0.1,
    waterSpeed: 1.4,
    petalFallSpeed: 0.8,
    watermillSpeed: 1.2,
  }
};
