# YORIMICHI --- DECISIONS.md

This document records important project decisions.

AI agents must respect accepted decisions unless a deliberate
architecture review changes them.

------------------------------------------------------------------------

## D001 --- 3D instead of 2D

**Status:** Accepted

Yorimichi uses real 3D geometry.

Reason:

The project requires terrain elevation, water, lighting, shadows, depth,
occlusion and a rich isometric environment.

------------------------------------------------------------------------

## D002 --- No voxel rendering

**Status:** Accepted

Voxel/block geometry is explicitly excluded.

Reason:

The desired visual identity depends on organic terrain, trees, rocks,
architecture and painterly forms.

------------------------------------------------------------------------

## D003 --- Fixed isometric camera

**Status:** Accepted

Use an orthographic/isometric-style camera with fixed rotation.

Reason:

The camera creates the desired strategy-game/diorama presentation and
allows higher visual quality with economical assets.

------------------------------------------------------------------------

## D004 --- Three.js

**Status:** Accepted

Initial browser renderer is Three.js.

Reason:

Strong web ecosystem, good TypeScript support and appropriate
capabilities for the project.

------------------------------------------------------------------------

## D005 --- Browser first

**Status:** Accepted

Initial target is desktop browser.

Reason:

Fast iteration, easy sharing and alignment with the existing web
development workflow.

------------------------------------------------------------------------

## D006 --- Visual quality before gameplay breadth

**Status:** Accepted

The first milestone is visual quality, not feature count.

Reason:

The core product is exploration. If the environment is not beautiful,
additional gameplay systems will not solve the fundamental problem.

------------------------------------------------------------------------

## D007 --- Vertical slice before procedural megaworld

**Status:** Accepted

Do not build the large procedural world first.

Reason:

Procedural generation can amplify weak art direction. First establish a
polished handcrafted-looking scene.

------------------------------------------------------------------------

## D008 --- Coherent assets over free assets

**Status:** Accepted

Random free assets are not acceptable merely because they are free.

Reason:

Asset inconsistency is one of the largest risks to visual quality.

------------------------------------------------------------------------

## D009 --- Handcrafted landmarks + procedural detail

**Status:** Accepted

Important locations are designed intentionally. Repetitive environmental
detail can be procedural.

Reason:

This provides both visual composition and scalable world generation.

------------------------------------------------------------------------

## D010 --- No gameplay scope in Phase 1

**Status:** Accepted

Phase 1 excludes:

-   combat
-   farming
-   building
-   inventory
-   economy
-   quests
-   multiplayer

Reason:

These systems are not required to validate the core exploration
experience.

------------------------------------------------------------------------

## D011 --- Muted natural palette

**Status:** Accepted

Avoid high saturation and neon colors.

Reason:

The target is calm, nostalgic and natural.

------------------------------------------------------------------------

## D012 --- Painterly stylized 3D

**Status:** Accepted

The target is not strict low-poly.

Reason:

Some objects require more geometry/detail while distant objects can
remain economical.

------------------------------------------------------------------------

## D013 --- Player is visual anchor

**Status:** Accepted

The camera should keep the player approximately centered.

Reason:

This supports the intended exploration presentation and maintains clear
player/world relationship.

------------------------------------------------------------------------

## D014 --- AI coding agents follow project documents

**Status:** Accepted

AI-generated implementation must follow:

1.  PLAN.md
2.  SPEC.md
3.  ART_DIRECTION.md
4.  ARCHITECTURE.md
5.  ASSET_MANIFEST.md

If an agent proposes a conflicting change, it must be treated as a
design decision rather than silently applied.

------------------------------------------------------------------------

## D015 --- Change process

Before changing a major accepted decision:

1.  Explain the proposed change.
2.  Explain why the current decision is insufficient.
3.  Evaluate impact on visual direction.
4.  Update DECISIONS.md.
5.  Update affected specification documents.
6.  Then implement.
