# ARCHITECTURE.md --- Technical Architecture

## 1. Architecture Principle

The game is a lightweight browser 3D application.

The architecture must separate:

-   rendering
-   game state
-   player control
-   world representation
-   procedural generation
-   asset management
-   visual configuration

Do not over-engineer the first phase.

## 2. Runtime Stack

``` text
Browser
  ↓
TypeScript
  ↓
Three.js
  ↓
WebGL renderer
  ↓
GPU
```

React is only for application/UI concerns.

The 3D game scene should not be implemented as a React component tree.

## 3. Core Runtime

``` text
Game
 ├── Renderer
 ├── Scene
 ├── Camera
 ├── Player
 ├── World
 ├── AssetManager
 ├── Lighting
 └── EnvironmentEffects
```

### Game

Owns:

-   initialization
-   update loop
-   resize handling
-   pause/resume
-   cleanup

### World

Owns:

-   terrain
-   water
-   roads
-   landmarks
-   environment objects

### Player

Owns:

-   position
-   velocity
-   animation state
-   collision
-   movement

### Camera

Owns:

-   orthographic projection
-   follow behavior
-   fixed orientation
-   smoothing

## 4. Scene Graph

Recommended:

``` text
Scene
├── Environment
│   ├── Terrain
│   ├── Water
│   ├── Mountains
│   ├── Roads
│   └── Landmarks
│
├── Vegetation
│   ├── Trees
│   ├── Bushes
│   ├── Grass
│   ├── Rocks
│   └── Details
│
├── Characters
│   └── Player
│
├── Effects
│   ├── Fog
│   ├── Waterfall
│   ├── Particles
│   └── Ambient
│
└── Lighting
```

## 5. Camera

Implement:

`IsoCamera`

Responsibilities:

-   maintain orthographic camera
-   maintain fixed rotation
-   follow player
-   smooth position
-   calculate visible region

Do not attach camera directly to player.

Use smoothing:

``` text
cameraPosition = lerp(cameraPosition, targetPosition, smoothing)
```

This prevents jitter.

## 6. Player Movement

Pipeline:

``` text
Input
  ↓
Input State
  ↓
Movement Intent
  ↓
Acceleration
  ↓
Collision
  ↓
Terrain Height
  ↓
Player Transform
  ↓
Animation
```

Movement should be deterministic and frame-rate independent.

Use delta time.

## 7. Terrain Architecture

Phase 1:

A handcrafted heightfield or manually defined terrain.

Later:

``` text
World Seed
   ↓
Macro Terrain
   ↓
Biome Regions
   ↓
Water
   ↓
Road Network
   ↓
Landmarks
   ↓
Vegetation Scatter
```

Do not begin with unrestricted random generation.

## 8. World Coordinates

Use a simple Cartesian world:

``` text
X = east/west
Y = elevation
Z = north/south
```

The player moves on X/Z.

Y is derived from terrain where appropriate.

## 9. Terrain Queries

Provide:

``` text
getHeightAt(x, z)
isWalkable(x, z)
getSurfaceNormal(x, z)
getBiomeAt(x, z)
```

This keeps player/world logic independent from the terrain
implementation.

## 10. Collision

Phase 1 does not need a heavyweight physics engine unless collision
complexity requires it.

Use simple collision primitives:

-   circles/capsules for player
-   boxes/cylinders for buildings
-   terrain heightfield
-   explicit water boundaries
-   simple rock colliders

Later evaluate a physics library if needed.

## 11. Water

Represent water independently from terrain.

``` text
WaterBody
 ├── geometry
 ├── material
 ├── shoreline
 └── metadata
```

A water body should expose:

``` text
contains(x, z)
getSurfaceHeight(x, z)
```

This lets gameplay systems query water without knowing rendering
details.

## 12. Asset Management

Use GLB/glTF.

Create:

`AssetManager`

Responsibilities:

-   load GLB
-   cache assets
-   clone assets safely
-   provide instanced meshes
-   dispose resources

Never load the same GLB repeatedly for every tree.

## 13. Instancing

Repeated objects should use:

`THREE.InstancedMesh`

Candidates:

-   trees
-   rocks
-   grass
-   flowers
-   lanterns
-   small props

Store per-instance transforms separately from the source asset.

## 14. Asset Variants

Use an asset family:

``` text
TreeFamily
 ├── PineA
 ├── PineB
 ├── PineC
 ├── BroadleafA
 ├── BroadleafB
 └── FloweringA
```

The world generator chooses variants according to biome.

Do not randomize completely independently.

## 15. Biome System

Represent the world with biome weights.

Example:

``` text
MOUNTAIN
FOREST
VALLEY
VILLAGE
LAKE
RIVER
COAST
```

A biome controls:

-   terrain decoration
-   tree types
-   rocks
-   grass density
-   color/material variants
-   ambient effects

## 16. Road System

Roads should be represented as paths/splines.

Conceptually:

``` text
Road
  ├── control points
  ├── width
  ├── material
  └── connected landmarks
```

Later this can generate actual terrain deformation and road meshes.

## 17. Landmark System

Landmarks are manually authored.

``` text
Landmark
 ├── transform
 ├── asset
 ├── biome
 ├── importance
 └── discovery metadata
```

Examples:

-   shrine
-   village
-   waterfall
-   bridge
-   lake
-   temple
-   viewpoint

This prevents procedural generation from destroying composition.

## 18. Rendering Pipeline

Initial pipeline:

``` text
Scene
 ↓
Camera
 ↓
Frustum Culling
 ↓
Opaque Geometry
 ↓
Water / Transparent Effects
 ↓
Atmosphere
 ↓
Post-processing (optional)
```

Keep post-processing minimal until base rendering is already attractive.

## 19. Lighting Architecture

Create:

`LightingSystem`

Owns:

-   directional light
-   ambient/environment light
-   shadow settings
-   optional time-of-day parameters

Visual configuration must be data-driven.

Example:

``` text
sunAngle
sunIntensity
ambientIntensity
fogDensity
fogColor
shadowBias
```

## 20. Visual Configuration

Keep art parameters centralized.

Example:

``` text
visual.ts

CAMERA_ANGLE
CAMERA_DISTANCE
FOG_DENSITY
FOG_NEAR
FOG_FAR

SUN_INTENSITY
AMBIENT_INTENSITY

TREE_DENSITY
GRASS_DENSITY
ROCK_DENSITY

WATER_SPEED
WIND_STRENGTH
```

This allows rapid art-direction iteration without rewriting game logic.

## 21. Update Loop

``` text
requestAnimationFrame
        ↓
calculate delta
        ↓
read input
        ↓
update player
        ↓
update world simulation
        ↓
update camera
        ↓
update ambient effects
        ↓
render
```

Use a fixed timestep only if later simulation requires it.

Phase 1 can use frame delta.

## 22. Procedural Generation Architecture

Do not generate everything in one function.

Use stages:

``` text
WorldSeed
   ↓
MacroTerrainGenerator
   ↓
HydrologyGenerator
   ↓
RoadGenerator
   ↓
LandmarkPlacer
   ↓
BiomeClassifier
   ↓
VegetationScatterer
   ↓
DetailScatterer
```

Each stage consumes the previous stage's data.

This makes generation deterministic and debuggable.

## 23. Deterministic Seed

Every generated world should have a seed.

``` text
seed → same world
```

The seed should control:

-   vegetation
-   rocks
-   small props
-   optional terrain variation
-   wildlife placement

Hand-authored landmarks should remain deterministic too.

## 24. Chunking

Do not implement complex streaming in Phase 1.

Prepare the architecture for it.

Later:

``` text
World
 ├── Chunk -1,-1
 ├── Chunk  0,-1
 ├── Chunk  1,-1
 ├── Chunk -1, 0
 ├── Chunk  0, 0
 ├── Chunk  1, 0
 └── ...
```

Load chunks around the player.

Unload distant chunks.

## 25. LOD

Later introduce:

``` text
Near:
  full geometry

Medium:
  simplified geometry

Far:
  very cheap representation
```

Distant mountains can be dramatically cheaper than foreground objects.

## 26. Audio Preparation

Not required for the first prototype, but architecture should leave room
for:

-   ambient forest
-   water
-   wind
-   birds
-   footsteps
-   village ambience

Audio should be spatially associated with world regions later.

## 27. Future Time of Day

Design lighting parameters so they can eventually interpolate:

``` text
Morning
 ↓
Day
 ↓
Evening
 ↓
Night
```

Do not build the full system in Phase 1.

## 28. Future Seasons

World data should distinguish permanent geometry from seasonal
decoration.

Permanent:

-   terrain
-   buildings
-   roads
-   rivers
-   lakes
-   bridges

Seasonal:

-   foliage
-   flowers
-   snow
-   colors
-   weather
-   particles

This makes future seasonal variations possible without rebuilding the
world.

## 29. Testing

Minimum automated/technical checks:

-   application starts without console errors
-   assets load
-   resize works
-   player movement works
-   player collision works
-   camera follows correctly
-   no NaN transforms
-   no uncontrolled object creation
-   animation frame loop can stop cleanly

## 30. Development Order

``` text
1. Bootstrap Three.js
2. Renderer
3. Orthographic camera
4. Test terrain
5. Player
6. Camera follow
7. Terrain collision
8. Water
9. Lighting
10. Shadows
11. Fog
12. House
13. Trees
14. Rocks
15. Roads
16. Bridge
17. Shrine
18. Vegetation instancing
19. Ambient animation
20. Visual polish
```

Do not implement procedural world generation before step 20.

## 31. Architectural Rule

The project has two separate concerns:

### Game systems

What the player can do.

### World presentation

What the player sees.

Phase 1 is overwhelmingly about **world presentation**.

Do not allow gameplay features to consume the time required to make the
world visually excellent.

## 32. Long-Term Target

Eventually:

``` text
                    GAME
                      │
          ┌───────────┴───────────┐
          │                       │
       WORLD                    PLAYER
          │                       │
  ┌───────┼────────┐        ┌─────┼─────┐
Terrain  Water   Biomes    Movement  Interaction
  │        │       │
Roads   Rivers   Vegetation
  │        │       │
Landmarks  Wildlife
```

The renderer remains an implementation detail.

The world model should remain usable if the rendering technology changes
later.
