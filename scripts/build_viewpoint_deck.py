import bpy
import bmesh
import math
import os

OUTPUT_DIR = "/Users/rabbi/Desktop/Projects/    Yorimichi/public/models"
RENDER_DIR = "/Users/rabbi/.gemini/antigravity-ide/brain/8ef131ec-a674-4b4e-ad86-e92bffa6de0d/scratch"

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in list(bpy.data.meshes): bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials): bpy.data.materials.remove(b)
    for b in list(bpy.data.curves): bpy.data.curves.remove(b)
    for b in list(bpy.data.images): bpy.data.images.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.75, metallic=0.0, specular=0.4, emissive=(0,0,0)):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
        if 'Specular IOR Level' in bs.inputs:
            bs.inputs['Specular IOR Level'].default_value = specular
        elif 'Specular' in bs.inputs:
            bs.inputs['Specular'].default_value = specular
        if emissive != (0,0,0):
            if 'Emission Color' in bs.inputs:
                bs.inputs['Emission Color'].default_value = (emissive[0], emissive[1], emissive[2], 1.0)
                bs.inputs['Emission Strength'].default_value = 1.8
            elif 'Emission' in bs.inputs:
                bs.inputs['Emission'].default_value = (emissive[0], emissive[1], emissive[2], 1.0)
    return m

# Traditional Japanese Materials Palette
m_timber_dark  = mat('M_DarkCedar',   0.28, 0.18, 0.12, roughness=0.82) # beams & posts
m_timber_deck  = mat('M_DeckPlank',   0.45, 0.32, 0.22, roughness=0.78) # floor planks
m_timber_light = mat('M_LightWood',   0.58, 0.44, 0.30, roughness=0.75) # bench & details
m_stone        = mat('M_GraniteStone',0.46, 0.44, 0.42, roughness=0.85) # stone lantern
m_lantern_glow = mat('M_LanternGlow', 1.00, 0.88, 0.55, roughness=0.20, emissive=(1.0, 0.82, 0.42))
m_bronze_cap   = mat('M_GiboshiBronze',0.32, 0.26, 0.18, roughness=0.35, metallic=0.75) # post caps
m_gravel       = mat('M_MountainPath',0.52, 0.48, 0.40, roughness=0.88)

root = bpy.data.objects.new("Viewpoint_Deck_Root", None)
bpy.context.scene.collection.objects.link(root)

def set_parent(child, parent):
    child.parent = parent

def set_smooth(obj):
    for f in obj.data.polygons:
        f.use_smooth = True

# =========================================================================
# 1. CANTILEVERED OBSERVATION TIMBER DECK (Platform)
# =========================================================================
# Platform dimensions: 7.2m wide (X), 5.4m deep (Y), facing South (-Y)
# Deck foundation beams
DECK_W = 7.2
DECK_D = 5.4
DECK_H = 0.35

# Sturdy timber foundation beams
beam_coords = [
    # Main longitudinal support joists
    (-3.2, 0.0, -0.25, 0.30, DECK_D + 0.4, 0.35),
    (-1.6, 0.0, -0.25, 0.30, DECK_D + 0.4, 0.35),
    ( 0.0, 0.0, -0.25, 0.30, DECK_D + 0.4, 0.35),
    ( 1.6, 0.0, -0.25, 0.30, DECK_D + 0.4, 0.35),
    ( 3.2, 0.0, -0.25, 0.30, DECK_D + 0.4, 0.35),
    # Transverse rim beam under front edge
    ( 0.0, -DECK_D*0.5 + 0.15, -0.45, DECK_W + 0.2, 0.32, 0.35),
    ( 0.0,  DECK_D*0.5 - 0.15, -0.45, DECK_W + 0.2, 0.32, 0.35),
]

for idx, (bx, by, bz, sx, sy, sz) in enumerate(beam_coords):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bx, by, bz))
    beam = bpy.context.active_object
    beam.name = f"Foundation_Beam_{idx}"
    beam.scale = (sx, sy, sz)
    beam.data.materials.append(m_timber_dark)
    set_parent(beam, root)

# Cantilever support angled corbel brackets underneath front deck
for cx in [-2.4, 0.0, 2.4]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, -DECK_D * 0.5 + 0.6, -0.85))
    corbel = bpy.context.active_object
    corbel.name = f"Corbel_Bracket_{cx}"
    corbel.scale = (0.24, 1.4, 0.24)
    corbel.rotation_euler = (math.radians(35), 0, 0)
    corbel.data.materials.append(m_timber_dark)
    set_parent(corbel, root)

# Wooden deck floor planks (parallel timber boards)
NUM_PLANKS = 22
plank_w = DECK_D / float(NUM_PLANKS)
for i in range(NUM_PLANKS):
    py = -DECK_D * 0.5 + (i + 0.5) * plank_w
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, py, 0.02))
    plank = bpy.context.active_object
    plank.name = f"Deck_Plank_{i}"
    plank.scale = (DECK_W, plank_w * 0.94, 0.08)
    plank.data.materials.append(m_timber_deck)
    set_parent(plank, root)

# =========================================================================
# 2. TRADITIONAL JAPANESE RAILINGS (Kōran / 欄干)
# =========================================================================
# Railings border West, North, and East, with open panoramic front South (-Y)
# and elegant low perimeter border on South so view is unobstructed!
RAIL_H = 1.05
POST_SZ = 0.16

# Corner & perimeter posts with two open entrance doorways (West & East)
posts_pos = [
    # West edge posts (X = -DECK_W/2 + 0.12 = -3.48)
    (-DECK_W*0.5 + 0.12, -DECK_D*0.5 + 0.12), # SW corner post
    (-DECK_W*0.5 + 0.12, -1.04),              # SW intermediate post
    (-DECK_W*0.5 + 0.12,  0.40),              # West Door South Portal Post (with giboshi)
    (-DECK_W*0.5 + 0.12,  2.00),              # West Door North Portal Post (with giboshi)
    (-DECK_W*0.5 + 0.12,  DECK_D*0.5 - 0.12), # NW corner post

    # East edge posts (X = +DECK_W/2 - 0.12 = +3.48)
    ( DECK_W*0.5 - 0.12, -DECK_D*0.5 + 0.12), # SE corner post
    ( DECK_W*0.5 - 0.12, -1.70),              # SE intermediate post
    ( DECK_W*0.5 - 0.12, -0.80),              # East Door South Portal Post (with giboshi)
    ( DECK_W*0.5 - 0.12,  0.80),              # East Door North Portal Post (with giboshi)
    ( DECK_W*0.5 - 0.12,  1.70),              # NE intermediate post
    ( DECK_W*0.5 - 0.12,  DECK_D*0.5 - 0.12), # NE corner post

    # Back North edge posts (leaving center open for path entry!)
    (-DECK_W*0.25,  DECK_D*0.5 - 0.12),
    ( DECK_W*0.25,  DECK_D*0.5 - 0.12),

    # Front vista balusters (Low safety rail that doesn't block valley view)
    (-DECK_W*0.25, -DECK_D*0.5 + 0.12),
    ( 0.0,         -DECK_D*0.5 + 0.12),
    ( DECK_W*0.25, -DECK_D*0.5 + 0.12),
]

for idx, (px, py) in enumerate(posts_pos):
    # Wooden square post
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, RAIL_H * 0.5))
    post = bpy.context.active_object
    post.name = f"Railing_Post_{idx}"
    post.scale = (POST_SZ, POST_SZ, RAIL_H)
    post.data.materials.append(m_timber_dark)
    set_parent(post, root)

    # Bronze decorative finial cap (Giboshi) on key posts and door portals
    # idx 0..4: West edge posts (caps on portals 2, 3 and corner 0, 4)
    # idx 5..10: East edge posts (caps on portals 7, 8 and corner 5, 10)
    # idx 11..15: North & Front vista posts
    has_cap = idx in [0, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14, 15]
    if has_cap:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=POST_SZ * 0.65, location=(px, py, RAIL_H + 0.06))
        cap = bpy.context.active_object
        cap.name = f"Post_Cap_{idx}"
        cap.scale = (1.0, 1.0, 1.3)
        set_smooth(cap)
        cap.data.materials.append(m_bronze_cap)
        set_parent(cap, root)

# Horizontal Handrails (Top Kasagi rail & mid-rail)
def create_rail(start, end, height, thickness=0.10):
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    length = math.sqrt(dx*dx + dy*dy)
    mid_x = (start[0] + end[0]) * 0.5
    mid_y = (start[1] + end[1]) * 0.5
    ang = math.atan2(dy, dx)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(mid_x, mid_y, height))
    rail = bpy.context.active_object
    rail.scale = (length, thickness, thickness * 0.8)
    rail.rotation_euler = (0, 0, ang)
    rail.data.materials.append(m_timber_dark)
    set_parent(rail, root)
    return rail

# West side rails with 1.6m open doorway (0.40m to 2.00m)
create_rail((-DECK_W*0.5 + 0.12, -DECK_D*0.5 + 0.12), (-DECK_W*0.5 + 0.12, 0.40), height=RAIL_H - 0.05, thickness=0.14)
create_rail((-DECK_W*0.5 + 0.12, -DECK_D*0.5 + 0.12), (-DECK_W*0.5 + 0.12, 0.40), height=RAIL_H * 0.5,  thickness=0.10)
# Gap Y = 0.40 to 2.00 is completely OPEN doorway!
create_rail((-DECK_W*0.5 + 0.12, 2.00), (-DECK_W*0.5 + 0.12, DECK_D*0.5 - 0.12), height=RAIL_H - 0.05, thickness=0.14)
create_rail((-DECK_W*0.5 + 0.12, 2.00), (-DECK_W*0.5 + 0.12, DECK_D*0.5 - 0.12), height=RAIL_H * 0.5,  thickness=0.10)

# East side rails with 1.6m open doorway (-0.80m to 0.80m)
create_rail((DECK_W*0.5 - 0.12, -DECK_D*0.5 + 0.12), (DECK_W*0.5 - 0.12, -0.80), height=RAIL_H - 0.05, thickness=0.14)
create_rail((DECK_W*0.5 - 0.12, -DECK_D*0.5 + 0.12), (DECK_W*0.5 - 0.12, -0.80), height=RAIL_H * 0.5,  thickness=0.10)
# Gap Y = -0.80 to 0.80 is completely OPEN doorway!
create_rail((DECK_W*0.5 - 0.12, 0.80), (DECK_W*0.5 - 0.12, DECK_D*0.5 - 0.12), height=RAIL_H - 0.05, thickness=0.14)
create_rail((DECK_W*0.5 - 0.12, 0.80), (DECK_W*0.5 - 0.12, DECK_D*0.5 - 0.12), height=RAIL_H * 0.5,  thickness=0.10)

# North (Back) side wings (leaving center 2.8m open for arrival path)
create_rail((-DECK_W*0.5 + 0.12, DECK_D*0.5 - 0.12), (-DECK_W*0.25, DECK_D*0.5 - 0.12), height=RAIL_H - 0.05, thickness=0.14)
create_rail((-DECK_W*0.5 + 0.12, DECK_D*0.5 - 0.12), (-DECK_W*0.25, DECK_D*0.5 - 0.12), height=RAIL_H * 0.5,  thickness=0.10)
create_rail((DECK_W*0.25, DECK_D*0.5 - 0.12), (DECK_W*0.5 - 0.12, DECK_D*0.5 - 0.12), height=RAIL_H - 0.05, thickness=0.14)
create_rail((DECK_W*0.25, DECK_D*0.5 - 0.12), (DECK_W*0.5 - 0.12, DECK_D*0.5 - 0.12), height=RAIL_H * 0.5,  thickness=0.10)

# South Front Vista Railing (Low, elegant, panoramic rail)
create_rail((-DECK_W*0.5 + 0.12, -DECK_D*0.5 + 0.12), (DECK_W*0.5 - 0.12, -DECK_D*0.5 + 0.12), height=RAIL_H * 0.85, thickness=0.12)
create_rail((-DECK_W*0.5 + 0.12, -DECK_D*0.5 + 0.12), (DECK_W*0.5 - 0.12, -DECK_D*0.5 + 0.12), height=RAIL_H * 0.40, thickness=0.08)

# =========================================================================
# 3. TRADITIONAL WOODEN TRAVELER'S BENCH (Koshikake)
# =========================================================================
# Situated on the North-East side of the platform, facing South-West towards the valley
def build_bench(loc, rot_z):
    b_group = bpy.data.objects.new("Traveler_Bench", None)
    b_group.location = loc
    b_group.rotation_euler = (0, 0, rot_z)
    bpy.context.scene.collection.objects.link(b_group)
    set_parent(b_group, root)

    BENCH_L = 2.2
    BENCH_W = 0.55
    BENCH_H = 0.48

    # Legs
    for lx in [-BENCH_L * 0.4, BENCH_L * 0.4]:
        for ly in [-BENCH_W * 0.35, BENCH_W * 0.35]:
            bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.06, depth=BENCH_H, location=(lx, ly, BENCH_H * 0.5))
            leg = bpy.context.active_object
            leg.data.materials.append(m_timber_dark)
            set_parent(leg, b_group)

    # Seat slats
    for s_idx in range(3):
        sy = -BENCH_W * 0.32 + s_idx * (BENCH_W * 0.32)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, sy, BENCH_H + 0.03))
        slat = bpy.context.active_object
        slat.scale = (BENCH_L, BENCH_W * 0.28, 0.05)
        slat.data.materials.append(m_timber_light)
        set_parent(slat, b_group)

    # Backrest posts & slat
    for bx in [-BENCH_L * 0.38, BENCH_L * 0.38]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.05, depth=0.45, location=(bx, BENCH_W * 0.38, BENCH_H + 0.22))
        b_post = bpy.context.active_object
        b_post.rotation_euler = (math.radians(-8), 0, 0)
        b_post.data.materials.append(m_timber_dark)
        set_parent(b_post, b_group)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, BENCH_W * 0.42, BENCH_H + 0.38))
    back_slat = bpy.context.active_object
    back_slat.scale = (BENCH_L, 0.08, 0.22)
    back_slat.rotation_euler = (math.radians(-8), 0, 0)
    back_slat.data.materials.append(m_timber_light)
    set_parent(back_slat, b_group)

build_bench((0.3, 1.85, 0.05), rot_z=0)

# =========================================================================
# 3b. TRADITIONAL VIEWING PAVILION CANOPY (Azumaya / 四阿 展望亭)
# =========================================================================
# Elegant Japanese timber pavilion roof on the back half of the deck
# Providing an unmistakable architectural silhouette atop the mountain!
m_tile = mat('M_CharcoalTile', 0.18, 0.20, 0.24, roughness=0.65)
m_vermilion = mat('M_VermilionTrim', 0.85, 0.22, 0.15, roughness=0.55)

PAV_X_SPAN = 5.2
PAV_Y_SPAN = 2.4
PAV_H = 2.3
PAV_Y_CENTER = 1.35

# 4 Timber pillars
pillar_coords = [
    (-PAV_X_SPAN * 0.48, PAV_Y_CENTER - PAV_Y_SPAN * 0.45),
    ( PAV_X_SPAN * 0.48, PAV_Y_CENTER - PAV_Y_SPAN * 0.45),
    (-PAV_X_SPAN * 0.48, PAV_Y_CENTER + PAV_Y_SPAN * 0.45),
    ( PAV_X_SPAN * 0.48, PAV_Y_CENTER + PAV_Y_SPAN * 0.45),
]

for p_idx, (px, py) in enumerate(pillar_coords):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.13, depth=PAV_H, location=(px, py, PAV_H * 0.5))
    pillar = bpy.context.active_object
    pillar.name = f"Pavilion_Pillar_{p_idx}"
    pillar.data.materials.append(m_timber_dark)
    set_parent(pillar, root)

    # Stone plinth base
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.18, depth=0.12, location=(px, py, 0.06))
    plinth = bpy.context.active_object
    plinth.data.materials.append(m_stone)
    set_parent(plinth, root)

# Connecting lintel crossbeams (Kashinuki)
beam_specs = [
    # Front and rear transverse lintels
    (0, PAV_Y_CENTER - PAV_Y_SPAN * 0.45, PAV_H - 0.12, PAV_X_SPAN + 0.3, 0.18, 0.22, 0),
    (0, PAV_Y_CENTER + PAV_Y_SPAN * 0.45, PAV_H - 0.12, PAV_X_SPAN + 0.3, 0.18, 0.22, 0),
    # Left and right side lintels
    (-PAV_X_SPAN * 0.48, PAV_Y_CENTER, PAV_H - 0.12, 0.18, PAV_Y_SPAN + 0.3, 0.22, 0),
    ( PAV_X_SPAN * 0.48, PAV_Y_CENTER, PAV_H - 0.12, 0.18, PAV_Y_SPAN + 0.3, 0.22, 0),
]

for b_idx, (bx, by, bz, sx, sy, sz, rot) in enumerate(beam_specs):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bx, by, bz))
    beam = bpy.context.active_object
    beam.scale = (sx, sy, sz)
    beam.data.materials.append(m_vermilion)
    set_parent(beam, root)

# Layered Japanese Pavilion Roof (Flared hipped eaves)
# Lower tier flared eave canopy
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, PAV_Y_CENTER, PAV_H + 0.20))
eave = bpy.context.active_object
eave.name = "Pavilion_Eave_Lower"
eave.scale = (PAV_X_SPAN + 1.1, PAV_Y_SPAN + 0.9, 0.14)
eave.data.materials.append(m_timber_dark)
set_parent(eave, root)

# Main Charcoal Tile Hipped Roof
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=3.4, radius2=0.6, depth=1.1, location=(0, PAV_Y_CENTER, PAV_H + 0.72))
roof_tile = bpy.context.active_object
roof_tile.name = "Pavilion_Roof_Tile"
roof_tile.rotation_euler = (0, 0, math.radians(45))
roof_tile.scale = (1.05, 0.65, 1.0)
roof_tile.data.materials.append(m_tile)
set_parent(roof_tile, root)

# Traditional Ridge Cap & Ornaments (Mune)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, PAV_Y_CENTER, PAV_H + 1.30))
ridge = bpy.context.active_object
ridge.scale = (2.6, 0.22, 0.16)
ridge.data.materials.append(m_vermilion)
set_parent(ridge, root)

for rx in [-1.3, 1.3]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(rx, PAV_Y_CENTER, PAV_H + 1.40))
    finial = bpy.context.active_object
    finial.data.materials.append(m_bronze_cap)
    set_parent(finial, root)

# =========================================================================
# 4. CARVED GRANITE SNOW LANTERN (Yukimi-dōrō / 雪見灯籠)
# =========================================================================
# Traditional hexagonal stone lantern situated on the South-West corner of the deck
def build_stone_lantern(loc):
    l_group = bpy.data.objects.new("Stone_Lantern", None)
    l_group.location = loc
    bpy.context.scene.collection.objects.link(l_group)
    set_parent(l_group, root)

    # 1. Base pedestal rock
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.45, depth=0.18, location=(0, 0, 0.09))
    base = bpy.context.active_object
    base.data.materials.append(m_stone)
    set_parent(base, l_group)

    # 2. Hexagonal pillar stem
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.22, depth=0.45, location=(0, 0, 0.38))
    stem = bpy.context.active_object
    stem.data.materials.append(m_stone)
    set_parent(stem, l_group)

    # 3. Middle platform shelf (Chudai)
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.48, depth=0.14, location=(0, 0, 0.65))
    shelf = bpy.context.active_object
    shelf.data.materials.append(m_stone)
    set_parent(shelf, l_group)

    # 4. Light chamber (Hibukuro) with warm glowing paper core
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.28, depth=0.32, location=(0, 0, 0.86))
    core = bpy.context.active_object
    core.data.materials.append(m_lantern_glow)
    set_parent(core, l_group)

    # Small stone pillar lattice frames around light chamber
    for i in range(6):
        ang = i * (math.pi / 3.0)
        lx = math.cos(ang) * 0.30
        ly = math.sin(ang) * 0.30
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, ly, 0.86))
        lattice = bpy.context.active_object
        lattice.scale = (0.05, 0.05, 0.32)
        lattice.data.materials.append(m_stone)
        set_parent(lattice, l_group)

    # 5. Wide flaring hexagonal roof cap (Kasa)
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.68, depth=0.24, location=(0, 0, 1.10))
    roof = bpy.context.active_object
    roof.scale = (1.0, 1.0, 0.8)
    roof.data.materials.append(m_stone)
    set_parent(roof, l_group)

    # 6. Jewel finial top (Hōju)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.12, location=(0, 0, 1.28))
    jewel = bpy.context.active_object
    jewel.scale = (1.0, 1.0, 1.4)
    jewel.data.materials.append(m_stone)
    set_parent(jewel, l_group)

build_stone_lantern((-2.6, -1.8, 0.05))

# =========================================================================
# 5. TRADITIONAL WOODEN BICYCLE PARKING STAND
# =========================================================================
# Situated on the North-West side near path entrance for parking traveler's bicycle
def build_bike_rack(loc, rot_z):
    r_group = bpy.data.objects.new("Bicycle_Rack", None)
    r_group.location = loc
    r_group.rotation_euler = (0, 0, rot_z)
    bpy.context.scene.collection.objects.link(r_group)
    set_parent(r_group, root)

    RACK_L = 2.4
    RACK_H = 0.90

    # Side upright posts
    for rx in [-RACK_L * 0.5, RACK_L * 0.5]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.08, depth=RACK_H, location=(rx, 0, RACK_H * 0.5))
        post = bpy.context.active_object
        post.data.materials.append(m_timber_dark)
        set_parent(post, r_group)

        # Foot base
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(rx, 0, 0.06))
        foot = bpy.context.active_object
        foot.scale = (0.24, 0.65, 0.12)
        foot.data.materials.append(m_timber_dark)
        set_parent(foot, r_group)

    # Horizontal hitching bar
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.06, depth=RACK_L + 0.2, location=(0, 0, RACK_H - 0.08))
    bar = bpy.context.active_object
    bar.rotation_euler = (0, math.radians(90), 0)
    bar.data.materials.append(m_timber_light)
    set_parent(bar, r_group)

    # Slotted cedar ground wheel rails (3 parking bays)
    for b_idx in [-0.7, 0.0, 0.7]:
        for side in [-0.10, 0.10]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(b_idx + side, 0, 0.08))
            rail = bpy.context.active_object
            rail.scale = (0.05, 0.70, 0.14)
            rail.data.materials.append(m_timber_dark)
            set_parent(rail, r_group)

build_bike_rack((-1.8, 2.25, 0.05), rot_z=0)

# =========================================================================
# 6. WOODEN SCENIC SIGNPOST (Miharashidai 展望台)
# =========================================================================
def build_signpost(loc):
    s_group = bpy.data.objects.new("Summit_Signpost", None)
    s_group.location = loc
    bpy.context.scene.collection.objects.link(s_group)
    set_parent(s_group, root)

    # Post
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.9))
    post = bpy.context.active_object
    post.scale = (0.14, 0.14, 1.8)
    post.data.materials.append(m_timber_dark)
    set_parent(post, s_group)

    # Plaque board
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.45))
    board = bpy.context.active_object
    board.scale = (0.68, 0.08, 0.42)
    board.data.materials.append(m_timber_light)
    set_parent(board, s_group)

    # Roof cap on sign
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.70))
    roof = bpy.context.active_object
    roof.scale = (0.76, 0.16, 0.06)
    roof.data.materials.append(m_timber_dark)
    set_parent(roof, s_group)

build_signpost((1.8, -1.8, 0.05))

# =========================================================================
# 7. EXPORT CLEAN GLTF
# =========================================================================
out_glb = os.path.join(OUTPUT_DIR, "mountain_viewpoint_deck_01.glb")
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format='GLB',
    use_selection=True,
    export_yup=True
)
print(f"Exported clean Mountain Viewpoint Deck to: {out_glb}")

# =========================================================================
# 8. STUDIO BEAUTY RENDER (Verification)
# =========================================================================
# Warm sunny mountain lighting
l_sun = bpy.data.lights.new('Sun', 'SUN')
l_sun.energy = 4.5
obj_sun = bpy.data.objects.new('Sun', l_sun)
obj_sun.location = (-10.0, 12.0, 15.0)
obj_sun.rotation_euler = (math.radians(52), math.radians(18), math.radians(-35))
bpy.context.scene.collection.objects.link(obj_sun)

l_fill = bpy.data.lights.new('Fill', 'AREA')
l_fill.energy = 55
l_fill.size = 8.0
obj_f = bpy.data.objects.new('Fill', l_fill)
obj_f.location = (10.0, -8.0, 10.0)
bpy.context.scene.collection.objects.link(obj_f)

world = bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value = (0.82, 0.88, 0.94, 1.0) # alpine morning sky
    bg.inputs['Strength'].default_value = 0.95
bpy.context.scene.world = world

cam_data = bpy.data.cameras.new('ViewCam')
cam_data.lens = 45
cam_obj = bpy.data.objects.new('ViewCam', cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj
# Isometric 3/4 front view overlooking the deck
cam_obj.location = (-7.5, -9.5, 6.2)

target = bpy.data.objects.new('Target', None)
target.location = (0.0, 0.0, 0.6)
bpy.context.scene.collection.objects.link(target)

c = cam_obj.constraints.new('TRACK_TO')
c.target = target
c.track_axis = 'TRACK_NEGATIVE_Z'
c.up_axis = 'UP_Y'

out_img = os.path.join(RENDER_DIR, "hero_viewpoint_deck_render.png")
scene = bpy.context.scene
if hasattr(scene, 'view_settings'):
    scene.view_settings.view_transform = 'Standard'
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.render.filepath = out_img
bpy.ops.render.render(write_still=True)
print(f"Rendered Viewpoint Deck Beauty Shot to: {out_img}")
