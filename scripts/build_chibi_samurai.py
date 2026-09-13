import bpy
import bmesh
import math
import os

OUTPUT_PATH = "/Users/rabbi/Desktop/Projects/    Yorimichi/public/models/chibi_samurai.glb"

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in list(bpy.data.meshes): bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials): bpy.data.materials.remove(b)
    for b in list(bpy.data.curves): bpy.data.curves.remove(b)

clear_scene()

def srgb_to_lin(r, g, b):
    def c(val):
        return val / 12.92 if val <= 0.04045 else ((val + 0.055) / 1.055) ** 2.4
    return (c(r), c(g), c(b))

def create_mat(name, r, g, b, roughness=0.6, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        lr, lg, lb = srgb_to_lin(r, g, b)
        bs.inputs['Base Color'].default_value = (lr, lg, lb, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
    return m

# Traditional Japanese Traveler / Ronin Palette (Matching Reference Image)
m_straw_hat    = create_mat("Mat_StrawHat",    0.80, 0.67, 0.46, roughness=0.72, metallic=0.0)
m_straw_dark   = create_mat("Mat_StrawDark",   0.62, 0.48, 0.32, roughness=0.75, metallic=0.0)
m_hat_rim      = create_mat("Mat_HatRim",      0.18, 0.16, 0.14, roughness=0.60, metallic=0.04)
m_hair_black   = create_mat("Mat_HairBlack",   0.11, 0.13, 0.15, roughness=0.55, metallic=0.02)
m_skin         = create_mat("Mat_Skin",        0.84, 0.64, 0.48, roughness=0.60, metallic=0.0)
m_haori_wheat  = create_mat("Mat_HaoriWheat",  0.81, 0.69, 0.50, roughness=0.70, metallic=0.0)
m_haori_shadow = create_mat("Mat_HaoriShadow", 0.70, 0.57, 0.39, roughness=0.72, metallic=0.0)
m_haori_trim   = create_mat("Mat_HaoriTrim",   0.28, 0.25, 0.20, roughness=0.65, metallic=0.02)
m_obi_red      = create_mat("Mat_ObiRed",      0.82, 0.18, 0.11, roughness=0.55, metallic=0.02)
m_chest_armor  = create_mat("Mat_ChestArmor",  0.13, 0.14, 0.16, roughness=0.45, metallic=0.10)
m_lacing_red   = create_mat("Mat_LacingRed",   0.78, 0.14, 0.10, roughness=0.52, metallic=0.02)
m_hakama_dark  = create_mat("Mat_HakamaDark",  0.18, 0.22, 0.24, roughness=0.70, metallic=0.02)
m_shin_armor   = create_mat("Mat_ShinArmor",   0.14, 0.16, 0.18, roughness=0.50, metallic=0.08)
m_tabi_boots   = create_mat("Mat_TabiBoots",   0.10, 0.11, 0.12, roughness=0.60, metallic=0.02)

def set_parent(child, parent, local_loc=None, local_rot=None):
    child.parent = parent
    if local_loc is not None:
        child.location = local_loc
    if local_rot is not None:
        child.rotation_euler = local_rot

def apply_mat(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def set_flat_shading(obj):
    for f in obj.data.polygons:
        f.use_smooth = False

# =========================================================================
# ROOT & ARTICULATION HIERARCHY
# =========================================================================
root = bpy.data.objects.new("Samurai_Root", None)
bpy.context.scene.collection.objects.link(root)

torso = bpy.data.objects.new("Torso", None)
torso.location = (0, 0, 0.65)
bpy.context.scene.collection.objects.link(torso)
set_parent(torso, root)

head_group = bpy.data.objects.new("HeadGroup", None)
head_group.location = (0, 0, 0.96)
bpy.context.scene.collection.objects.link(head_group)
set_parent(head_group, root)

left_arm = bpy.data.objects.new("LeftArm", None)
left_arm.location = (0.28, 0, 0.86)
bpy.context.scene.collection.objects.link(left_arm)
set_parent(left_arm, root)

right_arm = bpy.data.objects.new("RightArm", None)
right_arm.location = (-0.28, 0, 0.86)
bpy.context.scene.collection.objects.link(right_arm)
set_parent(right_arm, root)

left_leg = bpy.data.objects.new("LeftLeg", None)
left_leg.location = (0.14, 0, 0.42)
bpy.context.scene.collection.objects.link(left_leg)
set_parent(left_leg, root)

right_leg = bpy.data.objects.new("RightLeg", None)
right_leg.location = (-0.14, 0, 0.42)
bpy.context.scene.collection.objects.link(right_leg)
set_parent(right_leg, root)

# =========================================================================
# 1. HEAD & CONICAL STRAW HAT (Kasa / Jingasa / Sandogasa)
# Relative to HeadGroup (Z = 0.96)
# =========================================================================

# Stylized Faceted Head (Front is +Y)
bpy.ops.mesh.primitive_cube_add(size=0.18, location=(0, 0, 0.10))
head = bpy.context.active_object
head.name = "Head"
head.scale = (0.82, 0.92, 1.0)
bpy.ops.object.transform_apply(scale=True)
set_flat_shading(head)
apply_mat(head, m_skin)
set_parent(head, head_group)

# Stylized Chin Beard / Sideburns (Reference)
bpy.ops.mesh.primitive_cube_add(size=0.10, location=(0, 0.08, 0.04))
beard = bpy.context.active_object
beard.name = "Beard"
beard.scale = (1.1, 0.5, 0.75)
bpy.ops.object.transform_apply(scale=True)
set_flat_shading(beard)
apply_mat(beard, m_hair_black)
set_parent(beard, head_group)

# Spiky Flowing Hair on Sides and Back (Reference)
for is_left in [True, False]:
    sign = 1 if is_left else -1
    bpy.ops.mesh.primitive_cube_add(size=0.11, location=(0, 0, 0))
    side_hair = bpy.context.active_object
    side_hair.name = f"HairSide_{'L' if is_left else 'R'}"
    side_hair.scale = (0.55, 1.1, 1.8)
    side_hair.rotation_euler = (math.radians(-12), sign * math.radians(-14), sign * math.radians(16))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    set_flat_shading(side_hair)
    apply_mat(side_hair, m_hair_black)
    set_parent(side_hair, head_group, local_loc=(sign * 0.13, -0.02, 0.07))

# Back Hair cascading down neck
bpy.ops.mesh.primitive_cube_add(size=0.14, location=(0, -0.09, 0.06))
back_hair = bpy.context.active_object
back_hair.name = "HairBack"
back_hair.scale = (1.3, 0.7, 1.9)
back_hair.rotation_euler = (math.radians(12), 0, 0)
bpy.ops.object.transform_apply(scale=True, rotation=True)
set_flat_shading(back_hair)
apply_mat(back_hair, m_hair_black)
set_parent(back_hair, head_group)

# TRADITIONAL CONICAL STRAW HAT (Kasa / Sandogasa)
mesh_hat = bpy.data.meshes.new("Kasa_Hat_Mesh")
hat_obj = bpy.data.objects.new("Kasa_Hat", mesh_hat)
bpy.context.scene.collection.objects.link(hat_obj)

bm_hat = bmesh.new()
hat_segments = 16
hat_radius = 0.46
hat_apex_z = 0.30   # Crisp authentic conical slope
hat_rim_z  = 0.04

v_apex = bm_hat.verts.new((0, 0, hat_apex_z))
rim_verts = []

for i in range(hat_segments):
    theta = (i / hat_segments) * math.pi * 2.0
    x = math.cos(theta) * hat_radius
    y = math.sin(theta) * hat_radius
    vr = bm_hat.verts.new((x, y, hat_rim_z))
    rim_verts.append(vr)

bm_hat.verts.ensure_lookup_table()
for i in range(hat_segments):
    nxt = (i + 1) % hat_segments
    bm_hat.faces.new([v_apex, rim_verts[i], rim_verts[nxt]])

bm_hat.to_mesh(mesh_hat)
bm_hat.free()

sol_hat = hat_obj.modifiers.new("Solidify", 'SOLIDIFY')
sol_hat.thickness = 0.018
sol_hat.offset = -0.5

set_flat_shading(hat_obj)
apply_mat(hat_obj, m_straw_hat)
set_parent(hat_obj, head_group, local_loc=(0, -0.01, 0.16), local_rot=(math.radians(-6), 0, 0))

# Dark Apex Crown Cap (Reference)
bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.08, radius2=0.0, depth=0.07, location=(0, 0, 0))
hat_crown = bpy.context.active_object
hat_crown.name = "Hat_Crown"
set_flat_shading(hat_crown)
apply_mat(hat_crown, m_hat_rim)
set_parent(hat_crown, hat_obj, local_loc=(0, 0, hat_apex_z + 0.012))

# Dark Rim Border Ring (Reference)
bpy.ops.mesh.primitive_torus_add(
    major_radius=hat_radius * 0.99, minor_radius=0.014,
    major_segments=16, minor_segments=6, location=(0, 0, 0)
)
hat_rim_ring = bpy.context.active_object
hat_rim_ring.name = "Hat_Rim_Ring"
set_flat_shading(hat_rim_ring)
apply_mat(hat_rim_ring, m_hat_rim)
set_parent(hat_rim_ring, hat_obj, local_loc=(0, 0, hat_rim_z))


# =========================================================================
# 2. TORSO, CHEST ARMOR & HAORI COAT (Traditional Japanese Robe & Armor)
# Relative to Torso (Z = 0.65)
# =========================================================================

# Inner Kimono Collar (Dark collar band)
bpy.ops.mesh.primitive_cube_add(size=0.24, location=(0, 0.01, 0.14))
inner_kimono = bpy.context.active_object
inner_kimono.name = "Inner_Kimono"
inner_kimono.scale = (0.95, 0.88, 1.1)
bpy.ops.object.transform_apply(scale=True)
set_flat_shading(inner_kimono)
apply_mat(inner_kimono, m_haori_trim)
set_parent(inner_kimono, torso)

# Layered Chest Armor Plates (Dō) - Charcoal with Horizontal Crimson Ribs (Reference)
bpy.ops.mesh.primitive_cube_add(size=0.25, location=(0, 0.03, 0.10))
chest_block = bpy.context.active_object
chest_block.name = "Chest_Dou"
chest_block.scale = (0.65, 0.86, 1.15)
bpy.ops.object.transform_apply(scale=True)
set_flat_shading(chest_block)
apply_mat(chest_block, m_chest_armor)
set_parent(chest_block, torso)

# Horizontal Crimson Armor Lacing Ribs (4 horizontal rows)
for r in range(4):
    z_rib = 0.03 + r * 0.05
    bpy.ops.mesh.primitive_cube_add(size=0.026, location=(0, 0.13, z_rib))
    rib = bpy.context.active_object
    rib.name = f"Lacing_Rib_{r}"
    rib.scale = (5.2, 0.5, 0.55)
    bpy.ops.object.transform_apply(scale=True)
    set_flat_shading(rib)
    apply_mat(rib, m_lacing_red)
    set_parent(rib, torso)

# Wheat / Sand Haori Overcoat Lapels (V-neck wrap matching reference)
for is_left in [True, False]:
    sign = 1 if is_left else -1
    bpy.ops.mesh.primitive_cube_add(size=0.18, location=(0, 0, 0))
    haori_lapel = bpy.context.active_object
    haori_lapel.name = f"Haori_Lapel_{'L' if is_left else 'R'}"
    haori_lapel.scale = (0.75, 1.15, 1.45)
    haori_lapel.rotation_euler = (0, sign * math.radians(-12), sign * math.radians(8))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    set_flat_shading(haori_lapel)
    apply_mat(haori_lapel, m_haori_wheat)
    set_parent(haori_lapel, torso, local_loc=(sign * 0.13, 0.04, 0.10))

# Haori Back Panel
bpy.ops.mesh.primitive_cube_add(size=0.26, location=(0, -0.09, 0.08))
haori_back = bpy.context.active_object
haori_back.name = "Haori_Back"
haori_back.scale = (1.15, 0.45, 1.35)
bpy.ops.object.transform_apply(scale=True)
set_flat_shading(haori_back)
apply_mat(haori_back, m_haori_wheat)
set_parent(haori_back, torso)

# Back Diagonal Crimson Tasuki / Harness Strap (Reference back view!)
bpy.ops.mesh.primitive_cube_add(size=0.03, location=(0, -0.15, 0.10))
tasuki = bpy.context.active_object
tasuki.name = "Tasuki_Strap"
tasuki.scale = (0.7, 0.4, 9.8)
tasuki.rotation_euler = (0, math.radians(48), 0)
bpy.ops.object.transform_apply(scale=True, rotation=True)
set_flat_shading(tasuki)
apply_mat(tasuki, m_lacing_red)
set_parent(tasuki, torso)

# TRADITIONAL WIDE RED OBI SASH (Reference: prominent vermilion belt at waist)
bpy.ops.mesh.primitive_cube_add(size=0.28, location=(0, 0, -0.05))
obi = bpy.context.active_object
obi.name = "Obi_Sash"
obi.scale = (1.14, 1.02, 0.38)
bpy.ops.object.transform_apply(scale=True)
set_flat_shading(obi)
apply_mat(obi, m_obi_red)
set_parent(obi, torso)

# Front Obi Knot & Hanging Ties (Reference)
bpy.ops.mesh.primitive_cube_add(size=0.08, location=(0, 0.155, -0.05))
obi_knot = bpy.context.active_object
obi_knot.name = "Obi_Knot"
obi_knot.scale = (0.85, 0.6, 0.9)
bpy.ops.object.transform_apply(scale=True)
set_flat_shading(obi_knot)
apply_mat(obi_knot, m_obi_red)
set_parent(obi_knot, torso)

# Hanging sash ribbons in front
for is_left in [True, False]:
    sign = 1 if is_left else -1
    bpy.ops.mesh.primitive_cube_add(size=0.07, location=(0, 0, 0))
    sash_end = bpy.context.active_object
    sash_end.name = f"Obi_Tie_{'L' if is_left else 'R'}"
    sash_end.scale = (0.45, 0.35, 2.2)
    sash_end.rotation_euler = (math.radians(-6), sign * math.radians(-8), 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    set_flat_shading(sash_end)
    apply_mat(sash_end, m_obi_red)
    set_parent(sash_end, torso, local_loc=(sign * 0.03, 0.165, -0.15))

# Side Waist Pouches (Reference: red & tan pouches on hips)
for is_left in [True, False]:
    sign = 1 if is_left else -1
    bpy.ops.mesh.primitive_cube_add(size=0.09, location=(0, 0, 0))
    pouch = bpy.context.active_object
    pouch.name = f"Waist_Pouch_{'L' if is_left else 'R'}"
    pouch.scale = (0.5, 0.9, 1.05)
    bpy.ops.object.transform_apply(scale=True)
    set_flat_shading(pouch)
    apply_mat(pouch, m_obi_red if is_left else m_haori_wheat)
    set_parent(pouch, torso, local_loc=(sign * 0.18, 0, -0.05))

# HAORI LOWER SKIRT PANELS (Flared coat panels hanging to mid-thigh)
for is_left in [True, False]:
    sign = 1 if is_left else -1
    bpy.ops.mesh.primitive_cube_add(size=0.18, location=(0, 0, 0))
    flap = bpy.context.active_object
    flap.name = f"Haori_Skirt_Front_{'L' if is_left else 'R'}"
    flap.scale = (0.80, 0.45, 1.5)
    flap.rotation_euler = (math.radians(-8), sign * math.radians(-10), sign * math.radians(6))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    set_flat_shading(flap)
    apply_mat(flap, m_haori_wheat)
    set_parent(flap, torso, local_loc=(sign * 0.09, 0.10, -0.22))

    # Dark hem at bottom edge of skirt
    bpy.ops.mesh.primitive_cube_add(size=0.04, location=(0, 0, 0))
    hem = bpy.context.active_object
    hem.name = f"Haori_Hem_Front_{'L' if is_left else 'R'}"
    hem.scale = (3.6, 2.2, 0.6)
    bpy.ops.object.transform_apply(scale=True)
    set_flat_shading(hem)
    apply_mat(hem, m_haori_trim)
    set_parent(hem, flap, local_loc=(0, 0, -0.11))

# Back skirt panel
bpy.ops.mesh.primitive_cube_add(size=0.26, location=(0, -0.11, -0.22))
skirt_back = bpy.context.active_object
skirt_back.name = "Haori_Skirt_Back"
skirt_back.scale = (1.20, 0.45, 1.5)
skirt_back.rotation_euler = (math.radians(10), 0, 0)
bpy.ops.object.transform_apply(scale=True)
set_flat_shading(skirt_back)
apply_mat(skirt_back, m_haori_wheat)
set_parent(skirt_back, torso)

# Back skirt dark hem
bpy.ops.mesh.primitive_cube_add(size=0.04, location=(0, -0.15, -0.34))
hem_back = bpy.context.active_object
hem_back.name = "Haori_Hem_Back"
hem_back.scale = (8.0, 2.4, 0.6)
bpy.ops.object.transform_apply(scale=True)
set_flat_shading(hem_back)
apply_mat(hem_back, m_haori_trim)
set_parent(hem_back, torso)


# =========================================================================
# 3. ARMS: WIDE HAORI SLEEVES (Natural downward slope), FOREARM WRAPS & HANDS
# LeftArm at (0.28, 0, 0.86), RightArm at (-0.28, 0, 0.86)
# =========================================================================
for is_left in [True, False]:
    arm_parent = left_arm if is_left else right_arm
    side = 'L' if is_left else 'R'
    sign = 1 if is_left else -1

    # Kimono Haori Sleeve Shoulder (Sloped naturally downward)
    bpy.ops.mesh.primitive_cube_add(size=0.18, location=(0, 0, 0))
    sleeve = bpy.context.active_object
    sleeve.name = f"Sleeve_{side}"
    sleeve.scale = (0.92, 1.05, 1.25)
    sleeve.rotation_euler = (0, sign * math.radians(-14), 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    set_flat_shading(sleeve)
    apply_mat(sleeve, m_haori_wheat)
    set_parent(sleeve, arm_parent, local_loc=(sign * 0.03, 0, -0.06))

    # Outer Shoulder Armor Plate (Sode - Layered armor plate with red stripe)
    bpy.ops.mesh.primitive_cube_add(size=0.16, location=(0, 0, 0))
    sode = bpy.context.active_object
    sode.name = f"Sode_Armor_{side}"
    sode.scale = (0.30, 0.90, 1.20)
    sode.rotation_euler = (0, sign * math.radians(-14), 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    set_flat_shading(sode)
    apply_mat(sode, m_chest_armor)
    set_parent(sode, sleeve, local_loc=(sign * 0.09, 0, 0))

    # Red accent stripe on shoulder plate
    bpy.ops.mesh.primitive_cube_add(size=0.03, location=(0, 0, 0))
    sode_rib = bpy.context.active_object
    sode_rib.name = f"Sode_Rib_{side}"
    sode_rib.scale = (1.8, 4.4, 0.5)
    bpy.ops.object.transform_apply(scale=True)
    set_flat_shading(sode_rib)
    apply_mat(sode_rib, m_lacing_red)
    set_parent(sode_rib, sode, local_loc=(sign * 0.02, 0, 0.02))

    # Forearm Armor / Gauntlet (Kote - Reference: dark charcoal with red wraps)
    bpy.ops.mesh.primitive_cube_add(size=0.13, location=(0, 0, 0))
    kote = bpy.context.active_object
    kote.name = f"Kote_{side}"
    kote.scale = (0.70, 0.80, 1.6)
    bpy.ops.object.transform_apply(scale=True)
    set_flat_shading(kote)
    apply_mat(kote, m_hakama_dark)
    set_parent(kote, arm_parent, local_loc=(sign * 0.03, 0, -0.25))

    # Crimson wrist wrap band
    bpy.ops.mesh.primitive_cube_add(size=0.04, location=(0, 0, 0))
    wrist_band = bpy.context.active_object
    wrist_band.name = f"WristBand_{side}"
    wrist_band.scale = (2.5, 2.8, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    set_flat_shading(wrist_band)
    apply_mat(wrist_band, m_lacing_red)
    set_parent(wrist_band, kote, local_loc=(0, 0, -0.06))

    # Stylized Hand (Relaxed at side, matching reference)
    bpy.ops.mesh.primitive_cube_add(size=0.09, location=(0, 0, 0))
    hand = bpy.context.active_object
    hand.name = f"Hand_{side}"
    hand.scale = (0.70, 0.80, 0.90)
    bpy.ops.object.transform_apply(scale=True)
    set_flat_shading(hand)
    apply_mat(hand, m_skin)
    set_parent(hand, arm_parent, local_loc=(sign * 0.03, 0, -0.38))


# =========================================================================
# 4. LEGS: BAGGY PLEATED HAKAMA TROUSERS, SHIN GUARDS & TABI BOOTS
# LeftLeg at (0.14, 0, 0.42), RightLeg at (-0.14, 0, 0.42)
# =========================================================================
for is_left in [True, False]:
    leg_parent = left_leg if is_left else right_leg
    side = 'L' if is_left else 'R'
    sign = 1 if is_left else -1

    # Baggy Pleated Hakama Samurai Trousers (Beveled trapezoidal flare matching reference!)
    mesh_hakama = bpy.data.meshes.new(f"Hakama_{side}_Mesh")
    obj_hakama = bpy.data.objects.new(f"Hakama_{side}", mesh_hakama)
    bpy.context.scene.collection.objects.link(obj_hakama)

    bm_hk = bmesh.new()
    # Upper thigh waist box
    w_top = 0.10
    d_top = 0.10
    # Wide pleated knee flare
    w_mid = 0.13
    d_mid = 0.12
    # Tapered knee cuff
    w_bot = 0.09
    d_bot = 0.09

    # Top ring
    vt0 = bm_hk.verts.new((-w_top, -d_top,  0.02))
    vt1 = bm_hk.verts.new(( w_top, -d_top,  0.02))
    vt2 = bm_hk.verts.new(( w_top,  d_top,  0.02))
    vt3 = bm_hk.verts.new((-w_top,  d_top,  0.02))

    # Mid ring (outer flare)
    vm0 = bm_hk.verts.new((-w_mid, -d_mid, -0.12))
    vm1 = bm_hk.verts.new(( w_mid, -d_mid, -0.12))
    vm2 = bm_hk.verts.new(( w_mid,  d_mid, -0.12))
    vm3 = bm_hk.verts.new((-w_mid,  d_mid, -0.12))

    # Bottom ring (cuff)
    vb0 = bm_hk.verts.new((-w_bot, -d_bot, -0.22))
    vb1 = bm_hk.verts.new(( w_bot, -d_bot, -0.22))
    vb2 = bm_hk.verts.new(( w_bot,  d_bot, -0.22))
    vb3 = bm_hk.verts.new((-w_bot,  d_bot, -0.22))

    bm_hk.verts.ensure_lookup_table()
    # Upper side quads
    bm_hk.faces.new([vt0, vt1, vm1, vm0])
    bm_hk.faces.new([vt1, vt2, vm2, vm1])
    bm_hk.faces.new([vt2, vt3, vm3, vm2])
    bm_hk.faces.new([vt3, vt0, vm0, vm3])
    # Lower side quads
    bm_hk.faces.new([vm0, vm1, vb1, vb0])
    bm_hk.faces.new([vm1, vm2, vb2, vb1])
    bm_hk.faces.new([vm2, vm3, vb3, vb2])
    bm_hk.faces.new([vm3, vm0, vb0, vb3])
    # Top & Bottom caps
    bm_hk.faces.new([vt3, vt2, vt1, vt0])
    bm_hk.faces.new([vb0, vb1, vb2, vb3])

    bm_hk.to_mesh(mesh_hakama)
    bm_hk.free()

    set_flat_shading(obj_hakama)
    apply_mat(obj_hakama, m_hakama_dark)
    set_parent(obj_hakama, leg_parent)

    # Shin Guards (Kyahan / Suneate - Reference: dark charcoal with red tie cords)
    bpy.ops.mesh.primitive_cube_add(size=0.12, location=(0, 0, 0))
    shin = bpy.context.active_object
    shin.name = f"Shin_{side}"
    shin.scale = (0.80, 0.90, 1.4)
    bpy.ops.object.transform_apply(scale=True)
    set_flat_shading(shin)
    apply_mat(shin, m_shin_armor)
    set_parent(shin, leg_parent, local_loc=(0, 0, -0.27))

    # Crimson Shin Cord Accents (Horizontal red rings on shin)
    for c_idx in range(2):
        bpy.ops.mesh.primitive_cube_add(size=0.03, location=(0, 0, 0))
        shin_cord = bpy.context.active_object
        shin_cord.name = f"Shin_Cord_{side}_{c_idx}"
        shin_cord.scale = (3.4, 3.8, 0.4)
        bpy.ops.object.transform_apply(scale=True)
        set_flat_shading(shin_cord)
        apply_mat(shin_cord, m_lacing_red)
        set_parent(shin_cord, shin, local_loc=(0, 0, 0.04 - c_idx * 0.08))

    # Tabi Boots / Traveler Sandals (Flat soles at Z=0)
    bpy.ops.mesh.primitive_cube_add(size=0.13, location=(0, 0, 0))
    boot = bpy.context.active_object
    boot.name = f"Boot_{side}"
    boot.scale = (0.80, 1.45, 0.65)
    bpy.ops.object.transform_apply(scale=True)
    set_flat_shading(boot)
    apply_mat(boot, m_tabi_boots)
    set_parent(boot, leg_parent, local_loc=(0, 0.03, -0.38))

    # Red ankle accent ring
    bpy.ops.mesh.primitive_cube_add(size=0.03, location=(0, 0, 0))
    ankle_ring = bpy.context.active_object
    ankle_ring.name = f"Ankle_Ring_{side}"
    ankle_ring.scale = (3.6, 3.6, 0.45)
    bpy.ops.object.transform_apply(scale=True)
    set_flat_shading(ankle_ring)
    apply_mat(ankle_ring, m_lacing_red)
    set_parent(ankle_ring, boot, local_loc=(0, -0.02, 0.03))


# =========================================================================
# EXPORT GLB
# =========================================================================
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=OUTPUT_PATH,
    export_format='GLB',
    use_selection=True,
    export_yup=True
)
print(f"Exported clean Traditional Samurai to: {OUTPUT_PATH}")
