import * as THREE from 'three';

export const WORLD_CONFIG = {
  size: 200,                // 200m x 200m total bounds (-100 to +100)
  segments: 160,            // resolution of terrain mesh
  playerStart: new THREE.Vector3(-10, 0, 18), // Y computed dynamically from terrain
  
  water: {
    lakeCenter: new THREE.Vector2(26, 52),
    lakeRadiusX: 26,
    lakeRadiusZ: 20,
    waterLevel: 1.0,
    streamWidth: 3.6,
  },

  landmarks: {
    house: {
      position: new THREE.Vector3(30, 0, -12),
      rotationY: -Math.PI / 6,
    },
    shrine: {
      position: new THREE.Vector3(-36, 0, -26),
      rotationY: Math.PI / 4,
    },
    torii: {
      position: new THREE.Vector3(-20, 0, -14),
      rotationY: Math.PI / 4.5,
    },
    bridge: {
      position: new THREE.Vector3(2, 0, 10),
      rotationY: -Math.PI / 10,
      length: 8.5,
      width: 3.2,
    },
    waterfall: {
      position: new THREE.Vector3(-8, 0, -55),
      height: 11,
    },
    dock: {
      position: new THREE.Vector3(25, 0, 42),
      rotationY: 0.1,
    },
    mountainViewpoint: {
      position: new THREE.Vector3(-8, 16.5, -60.0),
      rotationY: 0,
    },
  },

  // Road spline control waypoints
  roads: {
    mainRoad: [
      new THREE.Vector3(2, 0, 10),    // bridge crossing
      new THREE.Vector3(8, 0, 8),
      new THREE.Vector3(15, 0, 3),    // agora / plaza entrance
      new THREE.Vector3(21, 0, 3.5),  // curving gently south of central stone fountain
      new THREE.Vector3(27, 0, -1),   // eastern agora promenade
      new THREE.Vector3(30, 0, -8),   // main farmhouse gate approach
    ],
    shrinePath: [
      new THREE.Vector3(2, 0, 10),    // bridge crossing
      new THREE.Vector3(-4, 0, 6),
      new THREE.Vector3(-12, 0, -2),  // river trail
      new THREE.Vector3(-20, 0, -14), // torii gate
      new THREE.Vector3(-27, 0, -20), // hillside steps
      new THREE.Vector3(-36, 0, -26), // hilltop shrine
    ],
    dockPath: [
      new THREE.Vector3(15, 0, 3),    // village plaza
      new THREE.Vector3(20, 0, 18),   // meadow path
      new THREE.Vector3(24, 0, 32),   // lake approach
      new THREE.Vector3(25, 0, 38.6), // dock shore entrance
    ],
    // Grand Mountain Cycling Highway (West Ridge Ascent to Summit Viewpoint)
    // Pushed back and widened along the outer perimeter, safely clearing Pagoda and Castle Keep
    mountainLoopWest: [
      new THREE.Vector3(-6.5, 3.8, 10.5), // bridge west approach (starts off the bridge deck)
      new THREE.Vector3(-22, 4.0, 16),   // southwest meadow trail
      new THREE.Vector3(-40, 4.3, 18),   // passing south of vegetable garden
      new THREE.Vector3(-58, 4.8, 14),   // wide outer western meadow curve (pushed back)
      new THREE.Vector3(-66, 6.5, 2),    // west ridge ascent start (pushed back)
      new THREE.Vector3(-68, 8.8, -14),  // climbing outer western ridge (pushed back)
      new THREE.Vector3(-66, 11.2, -30), // outer western mountain pass (well west of pagoda)
      new THREE.Vector3(-60, 13.5, -46), // outer western shoulder (well west of castle keep)
      new THREE.Vector3(-48, 15.2, -60), // northern mountain ridge behind castle keep (pushed back)
      new THREE.Vector3(-38, 15.8, -62.5), // sweeping northern curve
      new THREE.Vector3(-28, 16.2, -63.5), // upper northern mountain terrace
      new THREE.Vector3(-8, 16.5, -63.5),  // approach path behind summit viewpoint pavilion
    ],
    // Grand Mountain Cycling Highway (Summit Viewpoint down East Ridge to Village)
    // Sweeping wide outer perimeter descent down the eastern mountain shoulders
    mountainLoopEast: [
      new THREE.Vector3(-8, 16.5, -63.5),  // Behind summit viewpoint pavilion
      new THREE.Vector3(16, 16.2, -63.0),  // upper northern mountain terrace (pushed back)
      new THREE.Vector3(28, 15.6, -60.0),  // sweeping northeast curve
      new THREE.Vector3(38, 14.8, -54.0),  // northeast mountain shoulder (pushed back)
      new THREE.Vector3(56, 12.8, -40),  // descending upper east ridge (pushed back)
      new THREE.Vector3(66, 10.0, -22),  // descending middle east ridge (pushed back)
      new THREE.Vector3(66, 7.5, 2),     // outer east foothill curve (pushed back)
      new THREE.Vector3(62, 5.5, 22),    // sweeping wide east of wheat field
      new THREE.Vector3(54, 4.5, 34),    // sweeping south of wheat field fence
      new THREE.Vector3(38, 4.0, 30),    // meadow approach
      new THREE.Vector3(26, 3.8, 22),    // curving past village agora
      new THREE.Vector3(18, 3.8, 15),    // sweeping along agora green
      new THREE.Vector3(10, 3.8, 9.5),   // bridge east approach
    ],
    // Dedicated arrival pathway leading from mountain road into the viewpoint pavilion
    viewpointPath: [
      new THREE.Vector3(-8, 16.5, -63.5), // mountain road behind pavilion
      new THREE.Vector3(-8, 16.5, -62.5), // open rear entrance threshold
      new THREE.Vector3(-8, 16.5, -60.0), // center of wooden panoramic viewing deck
      new THREE.Vector3(-6, 16.55, -61.2), // leading directly to traveler's bench / chair
    ]
  }
};
