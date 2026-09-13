# YORIMICHI --- ART_DIRECTION.md

## 1. Purpose

This document is the visual art bible for Yorimichi.

Every environment asset, material, lighting decision, procedural system
and visual effect must support this direction.

The goal is not "low-poly."

The goal is:

> **A rich, painterly, stylized 3D Japanese/East-Asian countryside
> viewed through a fixed isometric camera.**

The world should feel like a beautiful place that happens to be
playable.

------------------------------------------------------------------------

## 2. Visual North Star

The supplied references establish two complementary targets.

### Reference A --- Settlement

Use it as reference for:

-   dense environmental composition
-   Japanese/East-Asian architectural silhouettes
-   dark tiled roofs
-   warm wood
-   gardens
-   bridges
-   docks
-   lanterns
-   decorative details
-   strong isometric readability
-   rich nighttime/blue-hour atmosphere
-   layered settlement design

### Reference B --- Natural World

Use it as reference for:

-   mountains
-   valleys
-   lush forests
-   lakes
-   rivers
-   waterfalls
-   winding paths
-   bridges
-   rocks
-   vegetation density
-   broad environmental composition
-   painterly natural atmosphere

Do not copy either reference literally.

Combine their visual principles into an original game world.

------------------------------------------------------------------------

## 3. Core Visual Identity

### Keywords

-   peaceful
-   lush
-   organic
-   painterly
-   nostalgic
-   quiet
-   atmospheric
-   handcrafted
-   detailed
-   restrained
-   natural
-   Japanese-inspired
-   slightly magical but grounded

### One-sentence target

> **A handcrafted-looking 3D countryside diorama that feels rich and
> alive while remaining calm and visually coherent.**

------------------------------------------------------------------------

## 4. What This Is NOT

Never drift toward:

-   Minecraft
-   voxel art
-   block terrain
-   8-bit
-   pixel art
-   PS1 graphics
-   ultra-simple mobile low-poly
-   generic Unity asset-store look
-   photorealistic AAA
-   neon fantasy
-   oversaturated anime
-   extreme cel shading
-   flat 2D sprites placed on a plane
-   completely flat terrain
-   random procedural object dumping

If an implementation technically works but visually moves toward one of
these categories, reject it.

------------------------------------------------------------------------

## 5. Geometry Philosophy

Use **semi-low-poly / medium-low-poly stylized geometry**.

Geometry should be:

-   faceted where appropriate
-   smooth where appropriate
-   intentionally simplified
-   organic
-   silhouette-driven
-   designed for the fixed camera

Do not make every object equally low-poly.

### Detail budget

Foreground: - medium/high detail

Midground: - medium detail

Background: - simplified detail

The camera determines where detail matters.

------------------------------------------------------------------------

## 6. Organic Geometry

Nature must not look like primitive shapes.

### Trees

Avoid:

-   cone + cylinder trees
-   perfectly spherical foliage
-   repeated identical crowns

Prefer:

-   irregular silhouettes
-   layered foliage masses
-   visible branch structure where useful
-   asymmetry
-   multiple crown clusters
-   natural taper

### Rocks

Avoid:

-   perfect cubes
-   perfect spheres
-   obvious primitive stacking

Prefer:

-   faceted irregular forms
-   varied silhouettes
-   broken edges
-   layered geological shapes

### Terrain

Avoid:

-   flat plane
-   obvious noise
-   regular hills
-   repeated slopes

Prefer:

-   broad valleys
-   intentional ridges
-   cliffs
-   terraces
-   shallow depressions
-   natural transitions

------------------------------------------------------------------------

## 7. Camera

The camera is part of the art style.

Use:

-   orthographic projection
-   fixed rotation
-   elevated isometric view
-   approximately 35--45° downward angle
-   approximately 45° horizontal rotation

The exact values should be tuned visually.

The player remains approximately centered.

The camera should show enough world around the player to encourage
exploration.

------------------------------------------------------------------------

## 8. Composition

The world should be composed rather than randomly filled.

Use:

-   leading roads
-   rivers
-   mountain silhouettes
-   clearings
-   tree clusters
-   visible landmarks
-   water
-   architectural focal points

The player's eye should naturally move:

``` text
PLAYER
  ↓
PATH
  ↓
LANDMARK
  ↓
DISTANT LANDSCAPE
```

Avoid putting equal visual density everywhere.

Open spaces are important.

Dense forest should contrast with:

-   meadow
-   water
-   village
-   shrine clearing
-   mountain viewpoint

------------------------------------------------------------------------

## 9. Color Palette

Use a restrained natural palette.

### Forest

-   deep pine green
-   moss green
-   muted leaf green
-   olive
-   blue-green shadows

### Ground

-   warm earth
-   muted tan
-   desaturated grass
-   stone gray
-   moss

### Water

-   deep blue-green
-   muted teal
-   pale turquoise highlights

### Architecture

-   charcoal roofs
-   dark blue-black tile
-   warm brown wood
-   muted cream walls
-   dark stone
-   warm interior light

### Seasonal accents

Use restrained:

-   cherry pink
-   autumn orange
-   muted red
-   pale yellow

Never let accent colors dominate the scene.

------------------------------------------------------------------------

## 10. Saturation

The world should be colorful but not loud.

When uncertain:

**reduce saturation rather than increase it.**

The target is closer to:

> natural colors seen through a beautiful illustration

than:

> colorful mobile game.

------------------------------------------------------------------------

## 11. Materials

Materials should generally be:

-   matte or semi-matte
-   moderately rough
-   subtly textured
-   visually coherent

Avoid excessive:

-   metallic surfaces
-   glossy plastic
-   procedural noise
-   high-frequency texture detail

Wood should feel like wood.

Stone should feel like stone.

Leaves should feel soft and layered.

------------------------------------------------------------------------

## 12. Architecture

Architecture is Japanese/East-Asian inspired but belongs to an original
fictional setting.

Important characteristics:

-   dark tiled roofs
-   generous roof overhangs
-   timber structure
-   warm wood
-   stone foundations
-   verandas
-   sliding-window inspiration
-   courtyards
-   small gardens
-   lanterns
-   fences
-   gates
-   bridges
-   shrines

Do not create historically exact architecture unless specifically
requested.

The priority is recognizable silhouette and coherent style.

------------------------------------------------------------------------

## 13. Roofs

Roofs are a major visual signature.

They should have:

-   strong silhouettes
-   dark charcoal/blue-black tiles
-   visible layered construction
-   moderate curvature where appropriate
-   substantial overhang
-   slightly exaggerated proportions for isometric readability

Avoid generic Western suburban roofs.

------------------------------------------------------------------------

## 14. Vegetation

Vegetation is a major source of perceived richness.

Use multiple layers:

``` text
Trees
  ↓
Bushes
  ↓
Grass
  ↓
Flowers
  ↓
Rocks / logs / small details
```

Do not distribute vegetation uniformly.

Create clusters and empty pockets.

------------------------------------------------------------------------

## 15. Procedural Variation

Procedural systems may vary:

-   scale
-   rotation
-   position
-   density
-   selected variant
-   small material variation

Do not use procedural variation to excuse poor base assets.

The base asset must already look good.

------------------------------------------------------------------------

## 16. Lighting

Lighting should carry a significant portion of the visual quality.

Use:

-   soft directional sun
-   ambient/environment light
-   contact shadows
-   ambient occlusion
-   soft cast shadows
-   atmospheric fog
-   distance haze

The scene should look attractive in daylight.

------------------------------------------------------------------------

## 17. Atmosphere

Use atmospheric depth.

Foreground:

-   sharper
-   richer detail

Midground:

-   slightly softer

Background:

-   progressively hazier
-   lower contrast
-   cooler/less saturated

This creates scale without requiring enormous geometry.

------------------------------------------------------------------------

## 18. Water

Water should be calm and attractive.

Use:

-   blue-green base
-   subtle surface movement
-   soft highlights
-   shoreline variation
-   rocks
-   reeds
-   small reflections where practical

Do not use a flat saturated blue plane.

------------------------------------------------------------------------

## 19. Weather and Ambient Motion

Motion should be subtle.

Possible:

-   grass swaying
-   tree movement
-   drifting leaves
-   floating pollen
-   mist
-   waterfall
-   water movement
-   birds

Nothing should constantly demand attention.

The world is peaceful.

------------------------------------------------------------------------

## 20. Character

The player character should be:

-   stylized
-   readable at isometric scale
-   slightly exaggerated
-   visually compatible with the environment
-   clearly distinguishable from NPCs later

The character should not dominate the screen.

The character should act as a scale reference for the world.

------------------------------------------------------------------------

## 21. Visual Density

Target:

> **Dense enough to feel alive, sparse enough to breathe.**

Do not fill every square meter.

Use composition:

``` text
Dense forest → open meadow → road → village → water
```

rather than:

``` text
trees everywhere + rocks everywhere + props everywhere
```

------------------------------------------------------------------------

## 22. Quality Rule

Every new visual element must answer:

1.  Does it fit the art direction?
2.  Does it improve the composition?
3.  Does it have the correct visual weight?
4.  Does it belong with existing assets?
5.  Does it make the world feel more handcrafted?

If not, do not add it.

------------------------------------------------------------------------

## 23. Visual Benchmark

A screenshot of the Phase 1 scene should be attractive without any
explanation.

The viewer should immediately understand:

-   this is a 3D isometric exploration world
-   the setting is peaceful
-   the world is Japanese/East-Asian inspired
-   the environment is lush
-   the player can explore
-   the scene is visually intentional

The benchmark passes only when the world feels like a game someone would
want to wander around in.
