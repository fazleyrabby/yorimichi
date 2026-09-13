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

print("1. Generating Main Stone Arch Bridge (aoe_stone_arch_bridge_01.glb)...")
stone_bridge_code = f"""
import bpy
import math

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in bpy.data.meshes: bpy.data.meshes.remove(b)
    for b in bpy.data.materials: bpy.data.materials.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.75, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
    return m

m_granite = mat('M_Granite', 0.54, 0.52, 0.48, 0.8)
m_granite_dark = mat('M_GraniteDark', 0.40, 0.38, 0.35, 0.85)
m_cobble = mat('M_Cobble', 0.48, 0.46, 0.42, 0.8)
m_moss = mat('M_Moss', 0.34, 0.38, 0.28, 0.9)

# Bridge spans along X: length=13.0m, width=4.4m
span_x = 13.0
width_y = 4.4

# 1. Bank Abutments (solid stone foundations on East and West riverbanks)
for sx in [-1, 1]:
    ab_x = sx * (span_x * 0.5 - 0.9)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ab_x, 0, -1.5))
    ab = bpy.context.active_object
    ab.scale = (2.4, width_y + 0.4, 3.2)
    ab.data.materials.append(m_granite)

# 2. Hollow Arch Spandrel Walls (on Left and Right flanks of the river)
# We place stone spandrel blocks on Y = -width/2 and +width/2 that form the arch profile
# Leaves the center completely OPEN for river water to flow underneath!
num_arch_blocks = 14
for sy in [-1, 1]:
    py = sy * (width_y * 0.5 - 0.25)
    for i in range(num_arch_blocks):
        t = (i / (num_arch_blocks - 1)) - 0.5 # -0.5 to +0.5
        px = t * (span_x - 1.2)
        # Parabolic arch soffit: clear apex at -0.4m, lower at ends
        arch_curve = (1.0 - (t * 2.0)**2)
        pz = -0.45 - (1.0 - arch_curve) * 1.5
        h = max(0.4, 0.5 + (1.0 - arch_curve) * 1.2)
        
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, pz))
        block = bpy.context.active_object
        block.scale = ((span_x / num_arch_blocks) + 0.05, 0.5, h)
        block.data.materials.append(m_granite_dark)

# 3. Arched Cobblestone Road Deck
num_deck_segs = 18
for i in range(num_deck_segs):
    t = (i / (num_deck_segs - 1)) - 0.5
    px = t * span_x
    pz = (1.0 - (t * 2.0)**2) * 0.45 - 0.15 # peak at +0.30m, ends at -0.15m
    
    seg_len = (span_x / num_deck_segs) + 0.06
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, 0, pz))
    d_seg = bpy.context.active_object
    d_seg.scale = (seg_len, width_y, 0.32)
    ang_pitch = -t * 0.28
    d_seg.rotation_euler = (0, ang_pitch, 0)
    d_seg.data.materials.append(m_cobble)

# 4. Approach Aprons on both banks
for sx in [-1, 1]:
    ramp_x = sx * (span_x * 0.5 + 0.8)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ramp_x, 0, -0.30))
    ramp = bpy.context.active_object
    ramp.scale = (1.8, width_y + 0.1, 0.30)
    ramp.rotation_euler = (0, -sx * 0.12, 0)
    ramp.data.materials.append(m_cobble)

# 5. Parapet Railings (Left & Right)
para_h = 0.88
para_thick = 0.36
for sy in [-1, 1]:
    py = sy * (width_y * 0.5 - para_thick * 0.5)
    
    # Parapet walls along the deck
    for i in range(num_deck_segs):
        t = (i / (num_deck_segs - 1)) - 0.5
        px = t * span_x
        pz = (1.0 - (t * 2.0)**2) * 0.45 + (para_h * 0.5) - 0.05
        seg_len = (span_x / num_deck_segs) + 0.05
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, pz))
        pw = bpy.context.active_object
        pw.scale = (seg_len, para_thick, para_h)
        pw.rotation_euler = (0, -t * 0.28, 0)
        pw.data.materials.append(m_granite)
        
        # Parapet capstone
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, pz + para_h * 0.5 + 0.05))
        cap = bpy.context.active_object
        cap.scale = (seg_len, para_thick + 0.10, 0.12)
        cap.rotation_euler = (0, -t * 0.28, 0)
        cap.data.materials.append(m_granite_dark)

    # 4 Ornate Stone Corner Posts with pyramid caps
    for sx in [-1, 1]:
        post_x = sx * (span_x * 0.5 + 0.2)
        post_z = (para_h * 0.5) - 0.05
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(post_x, py, post_z))
        cp = bpy.context.active_object
        cp.scale = (para_thick + 0.16, para_thick + 0.16, para_h + 0.25)
        cp.data.materials.append(m_granite_dark)

bpy.ops.object.select_all(action='SELECT')
export_path = f"{OUTPUT_DIR}/aoe_stone_arch_bridge_01.glb"
bpy.ops.export_scene.gltf(filepath=export_path, export_format='GLB')
print("Exported stone bridge to:", export_path)
"""

res1 = run_blender_code(stone_bridge_code)
print("Result stone bridge:", res1.get('status'))

print("2. Generating Timber Footbridge (aoe_wooden_footbridge_01.glb)...")
footbridge_code = f"""
import bpy
import math

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in bpy.data.meshes: bpy.data.meshes.remove(b)
    for b in bpy.data.materials: bpy.data.materials.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.8, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
    return m

m_dark = mat('M_TimberDark', 0.22, 0.14, 0.08, 0.85)
m_plank = mat('M_TimberPlank', 0.40, 0.28, 0.16, 0.75)
m_worn = mat('M_TimberWorn', 0.35, 0.24, 0.14, 0.8)

span_x = 11.2
width_y = 2.5

# 1. Dual Curved Timber Stringer Beams
for sy in [-1, 1]:
    by = sy * (width_y * 0.5 - 0.22)
    num_b = 14
    for i in range(num_b):
        t = (i / (num_b - 1)) - 0.5
        bx = t * span_x
        bz = (1.0 - (t * 2.0)**2) * 0.38 - 0.18
        b_len = (span_x / num_b) + 0.08
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bx, by, bz))
        b = bpy.context.active_object
        b.scale = (b_len, 0.22, 0.32)
        b.rotation_euler = (0, -t * 0.26, 0)
        b.data.materials.append(m_dark)

# 2. Bank Timber Sills embedded into terrain
for sx in [-1, 1]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx * (span_x * 0.5 - 0.4), 0, -0.4))
    sill = bpy.context.active_object
    sill.scale = (0.7, width_y + 0.4, 0.6)
    sill.data.materials.append(m_dark)

# 3. Riverbed Trestle Pile Bents (driven deep below water)
for sx in [-2.2, 2.2]:
    for sy in [-1, 1]:
        px = sx
        py = sy * (width_y * 0.5 - 0.22)
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.16, depth=3.2, location=(px, py, -1.3))
        pile = bpy.context.active_object
        pile.rotation_euler = (sy * 0.05, 0, 0)
        pile.data.materials.append(m_dark)
    
    # Cross tie brace
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0, -0.6))
    cross = bpy.context.active_object
    cross.scale = (0.16, width_y, 0.20)
    cross.data.materials.append(m_dark)

# 4. Individual Wooden Walking Planks
num_planks = 32
for i in range(num_planks):
    t = (i / (num_planks - 1)) - 0.5
    px = t * (span_x - 0.2)
    pz = (1.0 - (t * 2.0)**2) * 0.38
    plank_w = (span_x / num_planks) - 0.04
    
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, 0, pz))
    plank = bpy.context.active_object
    plank.scale = (plank_w, width_y, 0.12)
    plank.rotation_euler = (0, -t * 0.26, 0)
    plank.data.materials.append(m_plank if i % 2 == 0 else m_worn)

# 5. Handrail Posts and Railings
rail_h = 0.85
num_posts = 7
for sy in [-1, 1]:
    py = sy * (width_y * 0.5 - 0.12)
    
    # Vertical posts
    for i in range(num_posts):
        t = (i / (num_posts - 1)) - 0.5
        px = t * (span_x - 0.6)
        pz = (1.0 - (t * 2.0)**2) * 0.38 + rail_h * 0.5
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, pz))
        post = bpy.context.active_object
        post.scale = (0.14, 0.14, rail_h)
        post.data.materials.append(m_dark)
    
    # Top handrail & mid-rail
    for i in range(num_b):
        t = (i / (num_b - 1)) - 0.5
        px = t * (span_x - 0.4)
        pz_top = (1.0 - (t * 2.0)**2) * 0.38 + rail_h
        pz_mid = (1.0 - (t * 2.0)**2) * 0.38 + rail_h * 0.5
        b_len = (span_x / num_b) + 0.08
        
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, pz_top))
        tr = bpy.context.active_object
        tr.scale = (b_len, 0.15, 0.10)
        tr.rotation_euler = (0, -t * 0.26, 0)
        tr.data.materials.append(m_dark)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, pz_mid))
        mr = bpy.context.active_object
        mr.scale = (b_len, 0.10, 0.08)
        mr.rotation_euler = (0, -t * 0.26, 0)
        mr.data.materials.append(m_worn)

bpy.ops.object.select_all(action='SELECT')
export_path = f"{OUTPUT_DIR}/aoe_wooden_footbridge_01.glb"
bpy.ops.export_scene.gltf(filepath=export_path, export_format='GLB')
print("Exported footbridge to:", export_path)
"""

res2 = run_blender_code(footbridge_code)
print("Result footbridge:", res2.get('status'))

print("3. Generating Authentic Japanese Watermill (watermill_01.glb)...")
watermill_code = f"""
import bpy
import math

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in bpy.data.meshes: bpy.data.meshes.remove(b)
    for b in bpy.data.materials: bpy.data.materials.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.8, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
    return m

m_stone = mat('M_StoneBase', 0.44, 0.42, 0.38, 0.85)
m_dark_timber = mat('M_MillTimber', 0.22, 0.14, 0.08, 0.85)
m_plaster = mat('M_MillPlaster', 0.88, 0.85, 0.78, 0.9)
m_roof = mat('M_MillRoof', 0.22, 0.24, 0.26, 0.75) # charcoal Japanese roof tile
m_thatch = mat('M_MillThatch', 0.72, 0.52, 0.24, 0.85) # warm golden straw thatch
m_iron = mat('M_MillIron', 0.20, 0.20, 0.22, 0.5, 0.6)

# Main Group Parent
root = bpy.data.objects.new("Watermill_Root", None)
bpy.context.scene.collection.objects.link(root)

# 1. Heavy Stone Base Foundation (Anchored deep down into riverbank slope)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.6))
base = bpy.context.active_object
base.scale = (4.4, 4.8, 1.8)
base.data.materials.append(m_stone)
base.parent = root

# 2. Timber Stilt Piles extending down to riverbed on river side
for sy in [-1.8, 1.8]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-2.0, sy, -1.4))
    pile = bpy.context.active_object
    pile.scale = (0.35, 0.35, 2.6)
    pile.data.materials.append(m_dark_timber)
    pile.parent = root

# 3. Main Mill House Body
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.4))
house = bpy.context.active_object
house.scale = (3.8, 4.2, 2.2)
house.data.materials.append(m_plaster)
house.parent = root

# Timber Corner Posts and framing
for sx in [-1, 1]:
    for sy in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx * 1.9, sy * 2.1, 1.4))
        post = bpy.context.active_object
        post.scale = (0.24, 0.24, 2.3)
        post.data.materials.append(m_dark_timber)
        post.parent = root

# Horizontal timber wall bands
for z_band in [0.4, 1.4, 2.4]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, z_band))
    band = bpy.context.active_object
    band.scale = (3.88, 4.28, 0.16)
    band.data.materials.append(m_dark_timber)
    band.parent = root

# Wooden Door and Windows
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 2.15, 1.1))
door = bpy.context.active_object
door.scale = (1.2, 0.1, 1.6)
door.data.materials.append(m_dark_timber)
door.parent = root

# 4. Japanese Thatched/Tiled Hip-and-Gable Roof
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.9))
roof_base = bpy.context.active_object
roof_base.scale = (4.8, 5.2, 0.6)
roof_base.data.materials.append(m_thatch)
roof_base.parent = root

# Upper pitched roof
bpy.ops.mesh.primitive_cylinder_add(vertices=4, radius=3.2, depth=4.6, location=(0, 0, 3.5))
roof_pitch = bpy.context.active_object
roof_pitch.rotation_euler = (0, 0, math.pi * 0.25)
roof_pitch.scale = (0.75, 0.95, 0.6)
roof_pitch.data.materials.append(m_thatch)
roof_pitch.parent = root

# Roof Ridge Beam
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 4.1))
ridge = bpy.context.active_object
ridge.scale = (0.35, 5.0, 0.35)
ridge.data.materials.append(m_dark_timber)
ridge.parent = root

# 5. ANIMATED WATER WHEEL (Named 'water_wheel' for Three.js rotation)
# Located on negative X flank facing the river current
wheel_obj = bpy.data.objects.new("water_wheel", None)
bpy.context.scene.collection.objects.link(wheel_obj)
wheel_obj.location = (-2.35, 0, 0.5)
wheel_obj.parent = root

# Wheel axle
bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.22, depth=1.0, location=(0, 0, 0))
axle = bpy.context.active_object
axle.rotation_euler = (math.pi * 0.5, 0, 0)
axle.data.materials.append(m_dark_timber)
axle.parent = wheel_obj

# Wheel Hub & Iron Rings
wheel_r = 1.9
for sy in [-0.28, 0.28]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=wheel_r, depth=0.12, location=(0, sy, 0))
    rim = bpy.context.active_object
    rim.rotation_euler = (math.pi * 0.5, 0, 0)
    rim.data.materials.append(m_dark_timber)
    rim.parent = wheel_obj

# 8 Radiating Spokes
for i in range(8):
    ang = i * (math.pi / 4.0)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    spoke = bpy.context.active_object
    spoke.scale = (0.14, 0.56, wheel_r * 2.0 - 0.2)
    spoke.rotation_euler = (0, ang, 0)
    spoke.data.materials.append(m_dark_timber)
    spoke.parent = wheel_obj

# 16 Water Paddle Buckets
for i in range(16):
    ang = i * (math.pi / 8.0)
    px = math.cos(ang) * (wheel_r - 0.05)
    pz = math.sin(ang) * (wheel_r - 0.05)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, 0, pz))
    bucket = bpy.context.active_object
    bucket.scale = (0.10, 0.68, 0.42)
    bucket.rotation_euler = (0, -ang + math.pi * 0.5, 0)
    bucket.data.materials.append(m_dark_timber)
    bucket.parent = wheel_obj

# Axle bearing post anchored to the stone base
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-2.35, 0.4, -0.2))
bearing = bpy.context.active_object
bearing.scale = (0.35, 0.35, 1.4)
bearing.data.materials.append(m_dark_timber)
bearing.parent = root

bpy.ops.object.select_all(action='SELECT')
export_path = f"{OUTPUT_DIR}/watermill_01.glb"
bpy.ops.export_scene.gltf(filepath=export_path, export_format='GLB')
print("Exported watermill to:", export_path)
"""

res3 = run_blender_code(watermill_code)
print("Result watermill:", res3.get('status'))
