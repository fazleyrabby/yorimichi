import bpy
import bmesh
import math
import random
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

def mat(name, r, g, b, roughness=0.75, metallic=0.0, specular=0.5):
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
    return m

# Warm Stylized Mountain Gorge Palette (matching reference artwork)
m_cliff_warm = mat('M_WarmCliff',     0.52, 0.46, 0.38, roughness=0.80, specular=0.35)
m_cliff_mid  = mat('M_MidCliff',      0.44, 0.39, 0.33, roughness=0.82, specular=0.30)
m_cliff_dark = mat('M_DarkGorgeRock', 0.28, 0.25, 0.22, roughness=0.85, specular=0.25)
m_wet_rock   = mat('M_WetRock',       0.20, 0.22, 0.24, roughness=0.20, specular=0.85)
m_moss_rock  = mat('M_MossRock',      0.34, 0.46, 0.22, roughness=0.78, specular=0.20)
m_sand_pebble= mat('M_Pebble',        0.60, 0.54, 0.44, roughness=0.75, specular=0.30)
m_pine_foliage=mat('M_PineFoliage',   0.14, 0.32, 0.12, roughness=0.75)
m_pine_wood   =mat('M_PineWood',      0.32, 0.22, 0.14, roughness=0.90)
m_bush_lime  = mat('M_BushLime',      0.28, 0.52, 0.16, roughness=0.70)

root = bpy.data.objects.new("Gorge_Root", None)
bpy.context.scene.collection.objects.link(root)

random.seed(1337)

def set_parent(child, parent):
    child.parent = parent

# =========================================================================
# PROCEDURAL ORGANIC ROCK BUILDER (Stepped, Chunky Stylized Crags)
# =========================================================================
def create_stepped_boulder(name, loc, scale, rot=(0,0,0), sub=2, mat=m_cliff_warm, flat_top=True):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name

    # Bevel and subdivide for stylized chunky rock appearance
    bev = obj.modifiers.new(name="Bevel", type='BEVEL')
    bev.width = 0.22
    bev.segments = 2
    bpy.ops.object.modifier_apply(modifier="Bevel")

    sub_mod = obj.modifiers.new(name="Subsurf", type='SUBSURF')
    sub_mod.levels = 1
    bpy.ops.object.modifier_apply(modifier="Subsurf")

    bm = bmesh.new()
    bm.from_mesh(obj.data)

    rx_seed = random.uniform(0, 100)
    ry_seed = random.uniform(0, 100)

    for v in bm.verts:
        p = v.co
        d = p.length
        if d < 0.0001: continue
        n = p.normalized()

        noise1 = math.sin(n.x * 2.8 + rx_seed) * math.cos(n.y * 2.8 + ry_seed) * 0.18
        noise2 = math.cos(n.x * 5.5 + n.z * 4.2) * 0.08
        disp = 1.0 + noise1 + noise2
        v.co *= disp

        # Slightly flatten top for natural stepped ledges
        if flat_top and v.co.z > 0.35:
            v.co.z = 0.35 + (v.co.z - 0.35) * 0.45

    bm.to_mesh(obj.data)
    bm.free()

    obj.scale = scale
    obj.location = loc
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    set_parent(obj, root)
    return obj

# =========================================================================
# COORDINATE CONVERSION:
# Three.js (WX, WY, WZ) <-> Blender (bx, by, bz)
# bx = WX + 8.0
# bz = WY - 2.4
# by = -55.0 - WZ
#
# ROAD: WZ = -63.5, WY = 16.5 => by = 8.5, bz = 14.1
# CRITICAL RULE: Leave road corridor by in [6.8, 10.2] 100% CLEAR of blocking obstacles!
# =========================================================================

# -------------------------------------------------------------------------
# 1. HIGH MOUNTAIN HEADWALL & UPPER SPRING STREAM (Very back: by = 13.0 to 28.0, WZ = -68 to -83)
# -------------------------------------------------------------------------
# Mountain backdrop peaks framing the upper source
headwall_peaks = [
    # Massive backdrop crags behind the upper pool
    {"loc": (-6.0, 24.0, 18.5), "s": (7.0, 4.5, 6.0), "rot": (0.1, 0.2, 0.3), "mat": m_cliff_dark},
    {"loc": ( 6.0, 24.0, 18.5), "s": (7.0, 4.5, 6.0), "rot": (-0.1, -0.2, -0.3), "mat": m_cliff_dark},
    {"loc": (-13.0, 20.0, 17.5), "s": (6.5, 4.0, 5.5), "rot": (0.2, 0.1, -0.2), "mat": m_cliff_mid},
    {"loc": ( 13.0, 20.0, 17.5), "s": (6.5, 4.0, 5.5), "rot": (-0.2, -0.1, 0.2), "mat": m_cliff_mid},

    # Rocky defile flanking the high stream (Stream center at bx = -5.0 to 0.0, by = 12.0 to 22.0)
    # Left bank of upper stream
    {"loc": (-7.5, 17.0, 16.2), "s": (4.0, 3.2, 3.5), "rot": (0.15, 0.2, 0.4), "mat": m_moss_rock},
    {"loc": (-6.8, 12.5, 15.2), "s": (3.5, 2.8, 3.2), "rot": (0.1, 0.15, -0.2), "mat": m_cliff_warm},
    # Right bank of upper stream
    {"loc": ( 2.5, 17.0, 16.2), "s": (3.8, 3.2, 3.5), "rot": (-0.15, -0.2, -0.4), "mat": m_moss_rock},
    {"loc": ( 3.2, 12.5, 15.2), "s": (3.5, 2.8, 3.2), "rot": (-0.1, -0.15, 0.2), "mat": m_cliff_warm},
]
for idx, p in enumerate(headwall_peaks):
    create_stepped_boulder(f"Upper_Headwall_{idx}", p["loc"], p["s"], p["rot"], sub=2, mat=p["mat"])

# -------------------------------------------------------------------------
# 2. MOUNTAIN ROAD CULVERT CHANNEL (Under road by = 8.5, stream flows underneath)
# -------------------------------------------------------------------------
# Flanking stone parapets and stream abutments (stream passes at bx = 0, by in [7.0, 10.0])
road_culvert_stones = [
    # Upstream culvert mouth (by = 10.5, bz = 14.2)
    {"loc": (-3.2, 10.5, 14.5), "s": (1.8, 1.2, 1.4), "rot": (0.05, 0.1, 0.2), "mat": m_cliff_warm},
    {"loc": ( 3.2, 10.5, 14.5), "s": (1.8, 1.2, 1.4), "rot": (-0.05, -0.1, -0.2), "mat": m_cliff_warm},
    # Downstream culvert mouth exiting toward viewpoint weir (by = 6.5, bz = 14.0)
    {"loc": (-3.4,  6.5, 14.3), "s": (1.8, 1.2, 1.4), "rot": (0.05, -0.1, 0.1), "mat": m_cliff_warm},
    {"loc": ( 3.4,  6.5, 14.3), "s": (1.8, 1.2, 1.4), "rot": (-0.05, 0.1, -0.1), "mat": m_cliff_warm},
]
for idx, s in enumerate(road_culvert_stones):
    create_stepped_boulder(f"Culvert_Stone_{idx}", s["loc"], s["s"], s["rot"], sub=2, mat=s["mat"])

# -------------------------------------------------------------------------
# 3. VIEWPOINT PLATFORM FLANKING BLUFFS (by = 3.0 to 6.0, bz = 14.0)
# -------------------------------------------------------------------------
viewpoint_side_crags = [
    # Left cliff shoulder (bx <= -4.2)
    {"loc": (-5.6, 4.5, 14.2), "s": (3.2, 2.6, 2.8), "rot": (0.12, 0.15, 0.3), "mat": m_moss_rock},
    {"loc": (-6.8, 2.2, 13.5), "s": (3.0, 2.4, 3.0), "rot": (-0.1, 0.2, -0.2), "mat": m_cliff_warm},
    # Right cliff shoulder (bx >= +4.2)
    {"loc": ( 5.6, 4.5, 14.2), "s": (3.2, 2.6, 2.8), "rot": (-0.12, -0.15, -0.3), "mat": m_moss_rock},
    {"loc": ( 6.8, 2.2, 13.5), "s": (3.0, 2.4, 3.0), "rot": (0.1, -0.2, 0.2), "mat": m_cliff_warm},
]
for idx, c in enumerate(viewpoint_side_crags):
    create_stepped_boulder(f"VP_Side_Crag_{idx}", c["loc"], c["s"], c["rot"], sub=2, mat=c["mat"])

# -------------------------------------------------------------------------
# 4. TIER 1: WEIR CREST & CENTRAL DIVIDING ROCK PILLAR (under deck front: by = 2.0 to 0.0)
# -------------------------------------------------------------------------
# Stepped stone lip where water spills out under the front of the observation deck
weir_lip_shelves = [
    {"loc": (-2.4, 2.0, 13.4), "s": (2.4, 1.6, 1.0), "rot": (0.05, 0.08, 0.15), "mat": m_wet_rock},
    {"loc": ( 2.4, 2.0, 13.4), "s": (2.4, 1.6, 1.0), "rot": (-0.05, -0.08, -0.15), "mat": m_wet_rock},
]
for idx, s in enumerate(weir_lip_shelves):
    create_stepped_boulder(f"Weir_Lip_{idx}", s["loc"], s["s"], s["rot"], sub=2, mat=s["mat"])

# PROMINENT CENTRAL DIVIDING PILLAR (Iconic feature splitting upper cascade, matching reference!)
create_stepped_boulder(
    "Central_Dividing_Pillar",
    loc=(0.0, 0.4, 11.2),
    scale=(1.8, 1.8, 3.6),
    rot=(0.10, 0.05, 0.22),
    sub=3,
    mat=m_wet_rock,
    flat_top=True
)

# -------------------------------------------------------------------------
# 5. TIER 2: MID-TIER SPLASH SHELF & STEPPED CHUTE (by = 0.0 to -3.5, bz = 11.5 down to 7.0)
# -------------------------------------------------------------------------
mid_tier_shelves = [
    # Wide stepped rock shelf receiving the twin upper flumes
    {"loc": (-2.6, -0.8, 9.2), "s": (3.0, 2.2, 1.2), "rot": (0.08, 0.05, 0.10), "mat": m_wet_rock},
    {"loc": ( 2.6, -0.8, 9.2), "s": (3.0, 2.2, 1.2), "rot": (-0.08, -0.05, -0.10), "mat": m_wet_rock},
    # Intermediate stepped ledge cascading downward
    {"loc": (-2.8, -2.8, 7.2), "s": (3.2, 2.4, 1.4), "rot": (0.06, 0.08, 0.15), "mat": m_wet_rock},
    {"loc": ( 2.8, -2.8, 7.2), "s": (3.2, 2.4, 1.4), "rot": (-0.06, -0.08, -0.15), "mat": m_wet_rock},
]
for idx, s in enumerate(mid_tier_shelves):
    create_stepped_boulder(f"Mid_Shelf_{idx}", s["loc"], s["s"], s["rot"], sub=2, mat=s["mat"])

# -------------------------------------------------------------------------
# 6. TIER 3: LOWER PLUNGE CLIFF & CRAGS (by = -4.5 to -8.5, bz = 6.5 down to 0.0)
# -------------------------------------------------------------------------
lower_plunge_crags = [
    # Lower cliff shoulders framing the grand curtain fall
    {"loc": (-4.5, -5.2, 4.5), "s": (3.2, 2.8, 3.2), "rot": (0.15, 0.20, 0.25), "mat": m_cliff_mid},
    {"loc": ( 4.5, -5.2, 4.5), "s": (3.2, 2.8, 3.2), "rot": (-0.15, -0.20, -0.25), "mat": m_cliff_mid},
    # Stepped base buttresses
    {"loc": (-5.2, -7.5, 2.2), "s": (3.0, 2.6, 2.5), "rot": (0.10, 0.12, 0.20), "mat": m_moss_rock},
    {"loc": ( 5.2, -7.5, 2.2), "s": (3.0, 2.6, 2.5), "rot": (-0.10, -0.12, -0.20), "mat": m_moss_rock},
]
for idx, c in enumerate(lower_plunge_crags):
    create_stepped_boulder(f"Lower_Plunge_Crag_{idx}", c["loc"], c["s"], c["rot"], sub=2, mat=c["mat"])

# -------------------------------------------------------------------------
# 7. PLUNGE POOL BASIN BOULDERS & STEPPING STONES (by = -8.5 to -12.0, bz = 0.0 to 1.0)
# -------------------------------------------------------------------------
pool_rim_boulders = [
    {"loc": (-4.2, -8.8, 0.6), "s": (2.2, 1.8, 1.2), "mat": m_wet_rock},
    {"loc": ( 4.2, -8.8, 0.6), "s": (2.2, 1.8, 1.2), "mat": m_wet_rock},
    {"loc": (-4.5, -10.5, 0.4), "s": (1.8, 1.5, 0.9), "mat": m_sand_pebble},
    {"loc": ( 4.5, -10.5, 0.4), "s": (1.8, 1.5, 0.9), "mat": m_sand_pebble},
    {"loc": (-2.2, -11.2, 0.3), "s": (1.2, 1.0, 0.7), "mat": m_sand_pebble},
    {"loc": ( 2.2, -11.2, 0.3), "s": (1.2, 1.0, 0.7), "mat": m_sand_pebble},
    {"loc": ( 0.0, -11.5, 0.25), "s": (1.1, 0.9, 0.6), "mat": m_wet_rock}, # River stepping stone
]
for idx, rk in enumerate(pool_rim_boulders):
    create_stepped_boulder(
        f"Pool_Boulder_{idx}",
        rk["loc"],
        rk["s"],
        rot=(random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1), random.uniform(0, 3.14)),
        sub=2,
        mat=rk["mat"],
        flat_top=True
    )

# -------------------------------------------------------------------------
# 8. STEPPED CANYON WALL CRAGS FLANKING THE ENTIRE GORGE (Continuous stepped rock wall)
# -------------------------------------------------------------------------
stepped_wall_crags = [
    # Left continuous rock wall
    {"loc": (-7.8,  1.0, 10.5), "s": (3.5, 3.0, 3.2), "rot": (0.12, 0.18, 0.30), "mat": m_cliff_warm},
    {"loc": (-7.2, -2.5,  7.5), "s": (3.5, 3.0, 3.2), "rot": (-0.10, 0.15, -0.25), "mat": m_cliff_mid},
    {"loc": (-7.0, -5.8,  4.5), "s": (3.2, 2.8, 2.8), "rot": (0.15, -0.12, 0.20), "mat": m_moss_rock},

    # Right continuous rock wall
    {"loc": ( 7.8,  1.0, 10.5), "s": (3.5, 3.0, 3.2), "rot": (-0.12, -0.18, -0.30), "mat": m_cliff_warm},
    {"loc": ( 7.2, -2.5,  7.5), "s": (3.5, 3.0, 3.2), "rot": (0.10, -0.15, 0.25), "mat": m_cliff_mid},
    {"loc": ( 7.0, -5.8,  4.5), "s": (3.2, 2.8, 2.8), "rot": (-0.15, 0.12, -0.20), "mat": m_moss_rock},
]
for idx, c in enumerate(stepped_wall_crags):
    create_stepped_boulder(f"Wall_Crag_{idx}", c["loc"], c["s"], c["rot"], sub=2, mat=c["mat"])

# -------------------------------------------------------------------------
# 9. ALPINE CONIFER PINES & MOSS BUSHES (Matching reference painting accents)
# -------------------------------------------------------------------------
def create_alpine_pine(name, loc, height=2.8, radius=1.1):
    p_group = bpy.data.objects.new(name, None)
    p_group.location = loc
    bpy.context.scene.collection.objects.link(p_group)
    set_parent(p_group, root)

    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=radius * 0.14, depth=height * 0.5, location=(0, 0, height * 0.25))
    trunk = bpy.context.active_object
    trunk.data.materials.append(m_pine_wood)
    set_parent(trunk, p_group)

    for t_idx in range(3):
        t_z = height * (0.35 + t_idx * 0.24)
        t_r = radius * (1.0 - t_idx * 0.22)
        bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=t_r, depth=height * 0.38, location=(0, 0, t_z))
        cone = bpy.context.active_object
        cone.data.materials.append(m_pine_foliage)
        set_parent(cone, p_group)

def create_moss_bush(name, loc, scale=(1.2, 1.2, 0.8)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.8, location=loc)
    bush = bpy.context.active_object
    bush.name = name
    bush.scale = scale
    bush.data.materials.append(m_bush_lime)
    set_parent(bush, root)

# Pine trees on rock shelves (safely away from road corridor by in [6.8, 10.2])
create_alpine_pine("Pine_Upper_Back_L", (-8.5, 18.0, 17.5), height=3.2, radius=1.2)
create_alpine_pine("Pine_Upper_Back_R", ( 8.5, 18.0, 17.5), height=3.2, radius=1.2)
create_alpine_pine("Pine_Summit_Left",  (-8.2,  3.5, 14.5), height=2.8, radius=1.1)
create_alpine_pine("Pine_Summit_Right", ( 8.2,  3.5, 14.5), height=2.8, radius=1.1)
create_alpine_pine("Pine_Mid_Left",     (-7.8, -2.0,  9.5), height=2.5, radius=1.0)
create_alpine_pine("Pine_Mid_Right",    ( 7.8, -2.0,  9.5), height=2.5, radius=1.0)

# Lush rounded green bushes nestled into stone crevices
create_moss_bush("Bush_1", (-3.6,  1.2, 12.8), (1.1, 0.9, 0.7))
create_moss_bush("Bush_2", ( 3.6,  1.2, 12.8), (1.1, 0.9, 0.7))
create_moss_bush("Bush_3", (-4.2, -3.8,  6.8), (1.3, 1.0, 0.8))
create_moss_bush("Bush_4", ( 4.2, -3.8,  6.8), (1.3, 1.0, 0.8))

# EXPORT GLB
out_glb = os.path.join(OUTPUT_DIR, "aoe_waterfall_cliff_gorge_01.glb")
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format='GLB',
    use_selection=True,
    export_yup=True
)
print(f"Exported tiered mountain waterfall gorge to: {out_glb}")
