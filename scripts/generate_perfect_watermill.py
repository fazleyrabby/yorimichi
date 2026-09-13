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
m_worn_timber = mat('M_MillWornTimber', 0.36, 0.26, 0.16, 0.75)
m_plaster = mat('M_MillPlaster', 0.88, 0.85, 0.78, 0.9)
m_thatch = mat('M_MillThatch', 0.72, 0.52, 0.24, 0.85)
m_iron = mat('M_MillIron', 0.18, 0.18, 0.20, 0.4, 0.8)

root = bpy.data.objects.new("Watermill_Root", None)
bpy.context.scene.collection.objects.link(root)

# ========================================================
# 1. DEEP STONE FOUNDATION (Grounded deep into riverbank & riverbed)
# ========================================================
# Main stone base sits under the house: width X: 4.4, length Y: 5.2, height Z: 2.8
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.3, 0, -0.6))
base = bpy.context.active_object
base.scale = (4.4, 5.2, 2.6)
base.data.materials.append(m_stone)
base.parent = root

# Riverbed footing skirt on -X side (extends down to Z=-2.4 so no gap over water)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.4, 0, -1.3))
skirt = bpy.context.active_object
skirt.scale = (1.4, 5.2, 1.8)
skirt.data.materials.append(m_stone)
skirt.parent = root

# Stout Riverbed Timber Stilt Piles along -X bank
for sy in [-2.1, 0, 2.1]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.18, depth=3.2, location=(-1.8, sy, -1.2))
    pile = bpy.context.active_object
    pile.data.materials.append(m_dark_timber)
    pile.parent = root

# ========================================================
# 2. MILL HOUSE BODY & TIMBER FRAMING
# ========================================================
# Plaster upper walls
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.3, 0, 1.6))
house = bpy.context.active_object
house.scale = (3.8, 4.6, 2.2)
house.data.materials.append(m_plaster)
house.parent = root

# Corner timber posts
for sx in [-1, 1]:
    for sy in [-1, 1]:
        px = 0.3 + sx * 1.9
        py = sy * 2.3
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, 1.6))
        post = bpy.context.active_object
        post.scale = (0.24, 0.24, 2.3)
        post.data.materials.append(m_dark_timber)
        post.parent = root

# Horizontal timber framing bands
for z_band in [0.6, 1.6, 2.6]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.3, 0, z_band))
    band = bpy.context.active_object
    band.scale = (3.88, 4.68, 0.15)
    band.data.materials.append(m_dark_timber)
    band.parent = root

# Wooden Door on +X (uphill / dry land side where miller enters)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(2.25, 0, 1.3))
door = bpy.context.active_object
door.scale = (0.1, 1.2, 1.7)
door.data.materials.append(m_dark_timber)
door.parent = root

# Porch step on +X
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(2.6, 0, 0.45))
step = bpy.context.active_object
step.scale = (0.8, 1.6, 0.5)
step.data.materials.append(m_stone)
step.parent = root

# Windows with wooden lattice
for sy in [-1.4, 1.4]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.3, sy, 1.9))
    win = bpy.context.active_object
    win.scale = (3.92, 1.0, 0.8)
    win.data.materials.append(m_dark_timber)
    win.parent = root

# ========================================================
# 3. TRADITIONAL JAPANESE THATCHED ROOF
# ========================================================
# Roof eaves base
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.3, 0, 3.0))
roof_base = bpy.context.active_object
roof_base.scale = (4.8, 5.6, 0.6)
roof_base.data.materials.append(m_thatch)
roof_base.parent = root

# Upper pitched pyramid hip roof
bpy.ops.mesh.primitive_cylinder_add(vertices=4, radius=3.3, depth=4.8, location=(0.3, 0, 3.6))
roof_pitch = bpy.context.active_object
roof_pitch.rotation_euler = (0, 0, math.pi * 0.25)
roof_pitch.scale = (0.75, 0.95, 0.6)
roof_pitch.data.materials.append(m_thatch)
roof_pitch.parent = root

# Timber Ridge Beam along Y
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.3, 0, 4.2))
ridge = bpy.context.active_object
ridge.scale = (0.35, 5.4, 0.35)
ridge.data.materials.append(m_dark_timber)
ridge.parent = root

# Stone Chimney
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.4, -1.4, 3.2))
chimney = bpy.context.active_object
chimney.scale = (0.75, 0.75, 3.2)
chimney.data.materials.append(m_stone)
chimney.parent = root

# ========================================================
# 4. AUTHENTIC WATER WHEEL (Rotates around X axis, sits in river on -X)
# ========================================================
# Water wheel parent object named 'water_wheel' for Three.js animation
wheel_obj = bpy.data.objects.new("water_wheel", None)
bpy.context.scene.collection.objects.link(wheel_obj)
wheel_center_x = -2.35
wheel_center_z = -0.1
wheel_obj.location = (wheel_center_x, 0, wheel_center_z)
wheel_obj.parent = root

# Horizontal Axle passing along X axis
bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.20, depth=1.5, location=(0, 0, 0))
axle = bpy.context.active_object
axle.rotation_euler = (0, math.pi * 0.5, 0) # cylinder aligned along X axis!
axle.data.materials.append(m_dark_timber)
axle.parent = wheel_obj

# Iron axle hubs
for sx in [-0.4, 0.4]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.32, depth=0.18, location=(sx, 0, 0))
    hub = bpy.context.active_object
    hub.rotation_euler = (0, math.pi * 0.5, 0)
    hub.data.materials.append(m_iron)
    hub.parent = wheel_obj

wheel_r = 1.95
# Dual Rims (rings in Y-Z plane, normal along X)
for sx in [-0.32, 0.32]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=wheel_r, depth=0.14, location=(sx, 0, 0))
    rim = bpy.context.active_object
    rim.rotation_euler = (0, math.pi * 0.5, 0) # Normal along X!
    rim.data.materials.append(m_dark_timber)
    rim.parent = wheel_obj
    
    # Inner rim support ring
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=wheel_r * 0.65, depth=0.10, location=(sx, 0, 0))
    inner_rim = bpy.context.active_object
    inner_rim.rotation_euler = (0, math.pi * 0.5, 0)
    inner_rim.data.materials.append(m_worn_timber)
    inner_rim.parent = wheel_obj

# 8 Radiating Spokes in Y-Z plane (radiating around X axis)
for i in range(8):
    ang = i * (math.pi / 4.0)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    spoke = bpy.context.active_object
    spoke.scale = (0.58, 0.14, wheel_r * 2.0 - 0.2)
    spoke.rotation_euler = (ang, 0, 0) # rotation around X axis!
    spoke.data.materials.append(m_dark_timber)
    spoke.parent = wheel_obj

# 16 Water Paddle Buckets around perimeter
for i in range(16):
    ang = i * (math.pi / 8.0)
    py = math.cos(ang) * (wheel_r - 0.05)
    pz = math.sin(ang) * (wheel_r - 0.05)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, py, pz))
    bucket = bpy.context.active_object
    bucket.scale = (0.74, 0.44, 0.12)
    bucket.rotation_euler = (ang + math.pi * 0.5, 0, 0) # perpendicular to radius in Y-Z plane!
    bucket.data.materials.append(m_worn_timber)
    bucket.parent = wheel_obj

# Outer Axle Bearing Post (on river bed, supports outer end of axle)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wheel_center_x - 0.55, 0, -1.0))
bearing_post = bpy.context.active_object
bearing_post.scale = (0.35, 0.5, 2.2)
bearing_post.data.materials.append(m_dark_timber)
bearing_post.parent = root

# Diagonal Timber Brace
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wheel_center_x - 0.55, 0.7, -1.2))
brace = bpy.context.active_object
brace.scale = (0.22, 0.25, 1.8)
brace.rotation_euler = (math.pi * 0.2, 0, 0)
brace.data.materials.append(m_dark_timber)
brace.parent = root

# ========================================================
# 5. EXPORT GLB
# ========================================================
bpy.ops.object.select_all(action='SELECT')
export_path = f"{OUTPUT_DIR}/watermill_01.glb"
bpy.ops.export_scene.gltf(filepath=export_path, export_format='GLB')
print("Exported perfect watermill to:", export_path)
"""

res = run_blender_code(watermill_code)
print("Result:", res)
