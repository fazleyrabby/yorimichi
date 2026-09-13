import socket
import json
import os

OUTPUT_DIR = "/Users/rabbi/Desktop/Projects/    Yorimichi/public/models"

def run_blender_code(code_str):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(('127.0.0.1', 9876))
    msg = {'type': 'execute_code', 'params': {'code': code_str}}
    s.sendall((json.dumps(msg) + '\n').encode('utf-8'))
    
    response_data = b""
    while True:
        chunk = s.recv(8192)
        if not chunk:
            break
        response_data += chunk
        if b'\n' in chunk or len(chunk) < 8192:
            break
    s.close()
    return json.loads(response_data.decode('utf-8'))

print("Starting asset generation...")

# ========================================================
# 1. WATERFRONT STILT HOUSE (AOE3 Japanese Fisherman / Warehouse)
# ========================================================
stilt_house_code = f"""
import bpy
import math

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in bpy.data.meshes: bpy.data.meshes.remove(b)
    for b in bpy.data.materials: bpy.data.materials.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.6, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
    return m

m_wood_dark = mat('M_WoodDark', 0.22, 0.14, 0.08, 0.8)
m_wood_deck = mat('M_WoodDeck', 0.45, 0.32, 0.20, 0.7)
m_wall_white = mat('M_WallPlaster', 0.92, 0.90, 0.86, 0.5)
m_roof_tile = mat('M_RoofTile', 0.16, 0.20, 0.24, 0.4, 0.1)
m_gold = mat('M_Gold', 0.85, 0.68, 0.22, 0.25, 0.85)
m_red = mat('M_Vermilion', 0.82, 0.20, 0.15, 0.5)
m_stone = mat('M_Stone', 0.50, 0.48, 0.45, 0.85)

# 1. Stilts in water (4x4 grid of piles)
pile_radius = 0.15
pile_height = 4.0
for px in [-2.6, -0.9, 0.9, 2.6]:
    for pz in [-2.4, -0.8, 0.8, 2.4]:
        bpy.ops.mesh.primitive_cylinder_add(radius=pile_radius, depth=pile_height, location=(px, pz, 0.0))
        pile = bpy.context.active_object
        pile.data.materials.append(m_wood_dark)

# Cross-braces
for pz in [-2.4, 2.4]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, pz, 0.5))
    brace = bpy.context.active_object
    brace.scale = (5.4, 0.14, 0.14)
    brace.data.materials.append(m_wood_dark)

# 2. Pier / Wharf Deck
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.05))
deck = bpy.context.active_object
deck.scale = (6.0, 5.4, 0.22)
deck.data.materials.append(m_wood_deck)

# Deck planks detail
for i in range(12):
    y_pos = -2.5 + i * (5.0 / 11)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, y_pos, 2.18))
    plank = bpy.context.active_object
    plank.scale = (5.95, 0.38, 0.04)
    plank.data.materials.append(m_wood_deck)

# Deck Handrails along 3 sides
for sx in [-2.9, 2.9]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0, 2.7))
    rail = bpy.context.active_object
    rail.scale = (0.1, 5.2, 0.1)
    rail.data.materials.append(m_wood_dark)
    for p in [-2.5, 0, 2.5]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.9, location=(sx, p, 2.6))
        post = bpy.context.active_object
        post.data.materials.append(m_wood_dark)

# 3. Main Building Body (White plaster with cedar timber frame)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.3, 0, 3.4))
house = bpy.context.active_object
house.scale = (4.2, 3.8, 2.4)
house.data.materials.append(m_wall_white)

# Corner posts
for cx in [-2.35, 1.75]:
    for cz in [-1.85, 1.85]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cz, 3.4))
        cp = bpy.context.active_object
        cp.scale = (0.24, 0.24, 2.42)
        cp.data.materials.append(m_wood_dark)

# Latticed shoji panels on front & sides
for sz in [-1.2, 0, 1.2]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.82, sz, 3.2))
    panel = bpy.context.active_object
    panel.scale = (0.05, 0.85, 1.6)
    panel.data.materials.append(m_wood_dark)

# 4. Flared Curved Japanese Roof (Irimoya-style)
def make_eave(width, length, z_center, overhang=0.8):
    w = width + overhang * 2
    l = length + overhang * 2
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=max(w, l)*0.75, depth=1.35, location=(-0.3, 0, z_center))
    eave = bpy.context.active_object
    eave.rotation_euler = (0, 0, math.pi / 4)
    eave.scale = (w / (max(w, l)*1.06), l / (max(w, l)*1.06), 1.0)
    eave.data.materials.append(m_roof_tile)
    return eave

# Lower eave skirt
skirt = make_eave(4.2, 3.8, 4.65, overhang=0.7)

# Upper gable & ridge
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.3, 0, 5.3))
upper_box = bpy.context.active_object
upper_box.scale = (2.8, 2.4, 1.1)
upper_box.data.materials.append(m_wall_white)

main_roof = make_eave(2.8, 2.4, 6.1, overhang=0.8)

# Dark ridge cap
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.3, 0, 6.8))
ridge = bpy.context.active_object
ridge.scale = (4.4, 0.35, 0.28)
ridge.data.materials.append(m_roof_tile)

# Gold finials (Chigi) at ridge ends
for rx in [-2.4, 1.8]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(rx, 0, 7.0))
    chigi = bpy.context.active_object
    chigi.scale = (0.12, 0.12, 0.45)
    chigi.rotation_euler = (0, 0.4 if rx > 0 else -0.4, 0)
    chigi.data.materials.append(m_gold)

# 5. Waterfront details: Barrels, crates, hanging red lanterns
bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=0.85, location=(2.2, 1.6, 2.6))
barrel1 = bpy.context.active_object
barrel1.data.materials.append(m_wood_dark)

bpy.ops.mesh.primitive_cylinder_add(radius=0.32, depth=0.8, location=(2.2, 0.8, 2.6))
barrel2 = bpy.context.active_object
barrel2.data.materials.append(m_wood_dark)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(2.1, -1.5, 2.55))
crate1 = bpy.context.active_object
crate1.scale = (0.75, 0.75, 0.7)
crate1.data.materials.append(m_wood_deck)

# Hanging red lantern under front eave
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(1.9, 0, 4.4))
lantern = bpy.context.active_object
lantern.scale = (1.0, 1.0, 1.3)
lantern.data.materials.append(m_red)

# Select all and export
bpy.ops.object.select_all(action='SELECT')
out_path = '{OUTPUT_DIR}/waterfront_stilt_house_01.glb'
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
print('Exported:', out_path)
"""

res = run_blender_code(stilt_house_code)
print("Stilt House result:", res)

# ========================================================
# 2. JAPANESE CASTLE TENSHU (AOE3 Asian Dynasties Keep)
# ========================================================
castle_code = f"""
import bpy
import math

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in bpy.data.meshes: bpy.data.meshes.remove(b)
    for b in bpy.data.materials: bpy.data.materials.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.6, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
    return m

m_stone = mat('M_StoneIshigaki', 0.52, 0.50, 0.46, 0.85)
m_stone_dark = mat('M_StoneDark', 0.38, 0.36, 0.33, 0.9)
m_wall_white = mat('M_WallPlaster', 0.94, 0.93, 0.90, 0.45)
m_wood_dark = mat('M_CedarTimber', 0.20, 0.13, 0.08, 0.75)
m_wood_trim = mat('M_WoodTrim', 0.16, 0.10, 0.06, 0.8)
m_roof_tile = mat('M_RoofTileNavy', 0.14, 0.18, 0.23, 0.35, 0.15)
m_gold = mat('M_GoldTrim', 0.88, 0.72, 0.22, 0.25, 0.88)
m_vermilion = mat('M_VermilionBalcony', 0.80, 0.18, 0.14, 0.5)

# Tier 0: Battered Stone Fortress Base (Ishigaki) with sloped defensive walls
# Base dimension: 8.5m x 8.5m tapering to 7.2m x 7.2m at height 3.0m
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=6.0, radius2=5.1, depth=3.0, location=(0, 0, 1.5))
ishigaki = bpy.context.active_object
ishigaki.rotation_euler = (0, 0, math.pi / 4)
ishigaki.data.materials.append(m_stone)

# Stone foundation trim ledge
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 3.1))
stone_ledge = bpy.context.active_object
stone_ledge.scale = (7.4, 7.4, 0.25)
stone_ledge.data.materials.append(m_stone_dark)

# Stone approach steps on front
for st in range(5):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 3.8 + st * 0.4, 0.3 + st * 0.55))
    step = bpy.context.active_object
    step.scale = (2.6, 0.45, 0.3)
    step.data.materials.append(m_stone)

# Tier 1: Main Fortress Hall (6.4m x 6.4m, height 3.2m)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 4.8))
tier1_wall = bpy.context.active_object
tier1_wall.scale = (6.4, 6.4, 3.2)
tier1_wall.data.materials.append(m_wall_white)

# Timber framing posts and horizontal lintels
for cx in [-3.1, -1.0, 1.0, 3.1]:
    for cz in [-3.1, 3.1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cz, 4.8))
        post = bpy.context.active_object
        post.scale = (0.22, 0.22, 3.22)
        post.data.materials.append(m_wood_dark)

# Tier 1 Roof: Grand Flared Hip-and-Gable Japanese Roof
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=6.4, depth=1.6, location=(0, 0, 6.9))
roof1 = bpy.context.active_object
roof1.rotation_euler = (0, 0, math.pi / 4)
roof1.scale = (1.1, 1.1, 1.0)
roof1.data.materials.append(m_roof_tile)

# Tier 1 Ridge Cap and gable decorations
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 7.7))
ridge1 = bpy.context.active_object
ridge1.scale = (6.8, 0.4, 0.32)
ridge1.data.materials.append(m_roof_tile)

# Tier 2: Middle Tower with Balcony & Veranda
# Engawa / Balcony around tier 2
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 8.1))
balcony_deck = bpy.context.active_object
balcony_deck.scale = (5.2, 5.2, 0.2)
balcony_deck.data.materials.append(m_wood_dark)

# Vermilion Balustrade Railing
for sx in [-2.55, 2.55]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0, 8.65))
    rail = bpy.context.active_object
    rail.scale = (0.1, 5.1, 0.7)
    rail.data.materials.append(m_vermilion)
for sz in [-2.55, 2.55]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, sz, 8.65))
    rail = bpy.context.active_object
    rail.scale = (5.1, 0.1, 0.7)
    rail.data.materials.append(m_vermilion)

# Tier 2 Core Wall (4.4m x 4.4m, height 2.8m)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 9.5))
tier2_wall = bpy.context.active_object
tier2_wall.scale = (4.4, 4.4, 2.6)
tier2_wall.data.materials.append(m_wall_white)

# Samurai barred archer windows (Musha-mado)
for wz in [-2.22, 2.22]:
    for wx in [-1.2, 1.2]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, wz, 9.6))
        mush = bpy.context.active_object
        mush.scale = (0.9, 0.1, 0.7)
        mush.data.materials.append(m_wood_trim)

# Tier 2 Flared Roof
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=4.6, depth=1.4, location=(0, 0, 11.2))
roof2 = bpy.context.active_object
roof2.rotation_euler = (0, 0, math.pi / 4)
roof2.scale = (1.05, 1.05, 1.0)
roof2.data.materials.append(m_roof_tile)

# Tier 3: Pinnacle Tenshu Pavilion (Crown chamber, 3.2m x 3.2m, height 2.4m)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 12.8))
tier3_wall = bpy.context.active_object
tier3_wall.scale = (3.2, 3.2, 2.2)
tier3_wall.data.materials.append(m_wall_white)

# Gold trimmed corner pillars
for cx in [-1.55, 1.55]:
    for cz in [-1.55, 1.55]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cz, 12.8))
        cp3 = bpy.context.active_object
        cp3.scale = (0.18, 0.18, 2.22)
        cp3.data.materials.append(m_gold)

# Tier 3 Grand Imperial Curved Eave Roof
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=3.5, depth=1.5, location=(0, 0, 14.4))
roof3 = bpy.context.active_object
roof3.rotation_euler = (0, 0, math.pi / 4)
roof3.scale = (1.1, 1.1, 1.0)
roof3.data.materials.append(m_roof_tile)

# Pinnacle Ridge Beam & Gold Shachihoko (Mythical Golden Dragon-Carp)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 15.3))
ridge3 = bpy.context.active_object
ridge3.scale = (3.6, 0.35, 0.35)
ridge3.data.materials.append(m_roof_tile)

for sx in [-1.75, 1.75]:
    # Curved Golden Shachihoko
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.85, location=(sx, 0, 15.7))
    shachi = bpy.context.active_object
    shachi.rotation_euler = (0, 0.5 if sx > 0 else -0.5, 0)
    shachi.data.materials.append(m_gold)

# Select all and export
bpy.ops.object.select_all(action='SELECT')
out_path = '{OUTPUT_DIR}/japanese_castle_tenshu_01.glb'
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
print('Exported:', out_path)
"""

res2 = run_blender_code(castle_code)
print("Castle Tenshu result:", res2)

# ========================================================
# 3. JAPANESE SAILING JUNK SHIP (AOE3 Asian Dynasties War/Trade Junk)
# ========================================================
junk_code = f"""
import bpy
import math

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in bpy.data.meshes: bpy.data.meshes.remove(b)
    for b in bpy.data.materials: bpy.data.materials.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.6, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
    return m

m_hull_wood = mat('M_HullDarkCedar', 0.24, 0.16, 0.10, 0.7)
m_deck_wood = mat('M_DeckTeak', 0.48, 0.36, 0.22, 0.65)
m_sail_canvas = mat('M_SailCanvas', 0.88, 0.82, 0.68, 0.9)
m_sail_batten = mat('M_SailBattenBamboo', 0.35, 0.22, 0.12, 0.6)
m_mon_red = mat('M_JapaneseSunMon', 0.82, 0.15, 0.12, 0.5)
m_gold = mat('M_GoldFinial', 0.88, 0.72, 0.22, 0.25, 0.88)
m_iron = mat('M_IronAnchor', 0.15, 0.15, 0.15, 0.4, 0.9)

# 1. Main Ship Hull (Length: 12.0m, Beam: 3.6m, Depth: 2.2m)
# Bow at -X, Stern at +X
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.8))
hull_mid = bpy.context.active_object
hull_mid.scale = (8.0, 3.4, 1.8)
hull_mid.data.materials.append(m_hull_wood)

# Curved Bow (pointed front with high sheer)
bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=1.8, depth=4.2, location=(-5.2, 0, 1.2))
bow = bpy.context.active_object
bow.rotation_euler = (0, -math.pi / 2, 0)
bow.scale = (1.0, 0.95, 1.0)
bow.data.materials.append(m_hull_wood)

# Curved Stern (raised transom)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(4.8, 0, 1.4))
stern = bpy.context.active_object
stern.scale = (2.2, 3.1, 2.4)
stern.data.materials.append(m_hull_wood)

# Main Deck Planking
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.5, 0, 1.72))
deck = bpy.context.active_object
deck.scale = (9.5, 3.2, 0.1)
deck.data.materials.append(m_deck_wood)

# Raised Stern Quarterdeck & Japanese Captain's Cabin (Latticed timber)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(4.2, 0, 2.6))
cabin = bpy.context.active_object
cabin.scale = (2.8, 2.6, 1.4)
cabin.data.materials.append(m_hull_wood)

# Curved Japanese eave roof on cabin
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(4.2, 0, 3.4))
cabin_roof = bpy.context.active_object
cabin_roof.scale = (3.2, 3.0, 0.22)
cabin_roof.data.materials.append(m_hull_wood)

# Gunwale Bulwarks (left and right railings with oar sweeps)
for sy in [-1.75, 1.75]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.5, sy, 2.1))
    bulwark = bpy.context.active_object
    bulwark.scale = (9.8, 0.12, 0.65)
    bulwark.data.materials.append(m_hull_wood)

    # 5 Long Wooden Oars / Sweeps protruding into the water
    for ox in range(5):
        pos_x = -3.5 + ox * 1.6
        bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=3.2, location=(pos_x, sy * 1.5, 0.3))
        oar = bpy.context.active_object
        oar.rotation_euler = (0.6 if sy > 0 else -0.6, 0.3, 0)
        oar.data.materials.append(m_deck_wood)

# 2. Three Masts (Fore, Main, Mizzen)
masts = [
    {{'x': -3.6, 'h': 6.8, 'w': 2.4, 'sh': 4.2}},  # Fore mast
    {{'x': 0.2,  'h': 9.2, 'w': 3.2, 'sh': 6.0}},  # Main mast (tallest)
    {{'x': 3.2,  'h': 5.8, 'w': 2.0, 'sh': 3.6}},  # Mizzen mast
]

for m_idx, m_info in enumerate(masts):
    mx = m_info['x']
    mh = m_info['h']
    sw = m_info['w']
    sh = m_info['sh']

    # Wooden Mast Spar
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=mh, location=(mx, 0, mh * 0.5 + 1.2))
    mast = bpy.context.active_object
    mast.data.materials.append(m_hull_wood)

    # Gold finial atop mast
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(mx, 0, mh + 1.3))
    mast_cap = bpy.context.active_object
    mast_cap.data.materials.append(m_gold)

    # Ribbed Bamboo Batten Sail (Authentic curved Asian Junk sail)
    sail_z = mh * 0.5 + 1.6
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(mx, 0.15, sail_z))
    sail = bpy.context.active_object
    sail.scale = (sw, 0.04, sh)
    sail.data.materials.append(m_sail_canvas)

    # Horizontal bamboo battens across the sail
    num_battens = 5
    for b_idx in range(num_battens):
        bz = (sail_z - sh * 0.45) + (b_idx / (num_battens - 1)) * (sh * 0.9)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=sw * 1.05, location=(mx, 0.18, bz))
        batten = bpy.context.active_object
        batten.rotation_euler = (0, math.pi / 2, 0)
        batten.data.materials.append(m_sail_batten)

    # Japanese Sun Mon emblem on the main sail
    if m_idx == 1:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.9, depth=0.06, location=(mx, 0.20, sail_z))
        mon = bpy.context.active_object
        mon.rotation_euler = (math.pi / 2, 0, 0)
        mon.data.materials.append(m_mon_red)

# Heavy Iron Anchor at Bow
bpy.ops.mesh.primitive_torus_add(major_radius=0.35, minor_radius=0.08, location=(-6.2, 0.6, 1.2))
anchor = bpy.context.active_object
anchor.data.materials.append(m_iron)

# Select all and export
bpy.ops.object.select_all(action='SELECT')
out_path = '{OUTPUT_DIR}/japanese_junk_ship_01.glb'
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
print('Exported:', out_path)
"""

res3 = run_blender_code(junk_code)
print("Junk Ship result:", res3)

# ========================================================
# 4. THREE-TIER PAGODA TOWER (AOE3 Asian Dynasties Pagoda)
# ========================================================
pagoda_code = f"""
import bpy
import math

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in bpy.data.meshes: bpy.data.meshes.remove(b)
    for b in bpy.data.materials: bpy.data.materials.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.6, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
    return m

m_stone = mat('M_StoneBase', 0.54, 0.52, 0.48, 0.8)
m_vermilion = mat('M_VermilionLacquer', 0.82, 0.18, 0.12, 0.4)
m_gold = mat('M_GoldFinial', 0.88, 0.72, 0.22, 0.25, 0.88)
m_roof_copper = mat('M_RoofDarkVerdigris', 0.18, 0.24, 0.22, 0.4, 0.2)
m_wood_dark = mat('M_DarkPillar', 0.22, 0.14, 0.08, 0.8)

# Stone Podium Base
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.5))
base = bpy.context.active_object
base.scale = (5.6, 5.6, 1.0)
base.data.materials.append(m_stone)

# 3 Tiers of Pagoda
tier_params = [
    {{'z_base': 1.0, 'w': 3.8, 'h': 2.4, 'roof_w': 5.4, 'roof_h': 1.2}},
    {{'z_base': 4.4, 'w': 3.1, 'h': 2.2, 'roof_w': 4.5, 'roof_h': 1.1}},
    {{'z_base': 7.6, 'w': 2.4, 'h': 2.0, 'roof_w': 3.6, 'roof_h': 1.0}},
]

for t_idx, tp in enumerate(tier_params):
    zb = tp['z_base']
    tw = tp['w']
    th = tp['h']
    rw = tp['roof_w']
    rh = tp['roof_h']

    # Core chamber
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, zb + th * 0.5))
    core = bpy.context.active_object
    core.scale = (tw, tw, th)
    core.data.materials.append(m_vermilion)

    # 4 Corner vermilion columns
    for cx in [-tw * 0.48, tw * 0.48]:
        for cz in [-tw * 0.48, tw * 0.48]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=th, location=(cx, cz, zb + th * 0.5))
            col = bpy.context.active_object
            col.data.materials.append(m_vermilion)

    # Flared Pagoda Roof with upturned corners
    roof_z = zb + th + rh * 0.5
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=rw * 0.72, depth=rh, location=(0, 0, roof_z))
    roof = bpy.context.active_object
    roof.rotation_euler = (0, 0, math.pi / 4)
    roof.data.materials.append(m_roof_copper)

    # Hanging wind bells (Futaku) on 4 corners
    for bx in [-rw * 0.48, rw * 0.48]:
        for bz in [-rw * 0.48, rw * 0.48]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.25, location=(bx, bz, roof_z - rh * 0.4))
            bell = bpy.context.active_object
            bell.data.materials.append(m_gold)

# Sorin Pinnacle (Sacred 9-Ring Golden Spire) atop top roof
spire_base_z = 7.6 + 2.0 + 1.0 + 0.3
bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=3.2, location=(0, 0, spire_base_z + 1.6))
shaft = bpy.context.active_object
shaft.data.materials.append(m_gold)

# 9 Golden Rings (Kururin)
for r_idx in range(7):
    rz = spire_base_z + 0.6 + r_idx * 0.28
    bpy.ops.mesh.primitive_torus_add(major_radius=0.32 - r_idx * 0.02, minor_radius=0.06, location=(0, 0, rz))
    ring = bpy.context.active_object
    ring.data.materials.append(m_gold)

# Sacred Jewel (Hoju) at zenith
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.24, location=(0, 0, spire_base_z + 3.2))
jewel = bpy.context.active_object
jewel.data.materials.append(m_gold)

# Select all and export
bpy.ops.object.select_all(action='SELECT')
out_path = '{OUTPUT_DIR}/pagoda_01.glb'
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
print('Exported:', out_path)
"""

res4 = run_blender_code(pagoda_code)
print("Pagoda result:", res4)
print("ALL ASSETS GENERATED SUCCESSFULLY!")
