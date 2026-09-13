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

print("Generating AOE3 Definitive Edition style rich trees in Blender...")

# ========================================================
# 1. TALL ALPINE PINE / SPRUCE (AOE3 Signature Conifer)
# ========================================================
pine_tall_code = f"""
import bpy
import math

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in bpy.data.meshes: bpy.data.meshes.remove(b)
    for b in bpy.data.materials: bpy.data.materials.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.7, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
    return m

m_bark = mat('M_TrunkBark', 0.22, 0.15, 0.09, 0.85)
m_needle_dark = mat('M_NeedleDark', 0.10, 0.22, 0.12, 0.65)
m_needle_sun = mat('M_NeedleSunlit', 0.18, 0.36, 0.16, 0.55)
m_needle_tip = mat('M_NeedleTip', 0.26, 0.46, 0.18, 0.50)

# Tapered Rugged Cedar Trunk (height: 12.5m)
bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=12.0, location=(0, 0, 6.0))
trunk = bpy.context.active_object
trunk.data.materials.append(m_bark)

# Root flare at base
for ra in range(5):
    ang = ra * (math.pi * 2 / 5)
    rx = math.cos(ang) * 0.55
    ry = math.sin(ang) * 0.55
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=1.2, location=(rx, ry, 0.5))
    root = bpy.context.active_object
    root.rotation_euler = (math.sin(ang) * 0.4, -math.cos(ang) * 0.4, 0)
    root.data.materials.append(m_bark)

# 7 Tiered Needle Bough Canopies (from bottom to top)
# Each tier has a shaded underbelly and a sunlit top skirt with multi-faceted branches
tiers = [
    {{'z': 3.2, 'r': 3.4, 'h': 1.6, 'branches': 8, 'mat': m_needle_dark}},
    {{'z': 4.8, 'r': 3.0, 'h': 1.6, 'branches': 8, 'mat': m_needle_dark}},
    {{'z': 6.4, 'r': 2.6, 'h': 1.5, 'branches': 7, 'mat': m_needle_sun}},
    {{'z': 7.9, 'r': 2.2, 'h': 1.4, 'branches': 7, 'mat': m_needle_sun}},
    {{'z': 9.3, 'r': 1.7, 'h': 1.3, 'branches': 6, 'mat': m_needle_sun}},
    {{'z': 10.5, 'r': 1.3, 'h': 1.2, 'branches': 5, 'mat': m_needle_tip}},
    {{'z': 11.6, 'r': 0.8, 'h': 1.4, 'branches': 5, 'mat': m_needle_tip}},
]

for t_idx, tp in enumerate(tiers):
    tz = tp['z']
    tr = tp['r']
    th = tp['h']
    nb = tp['branches']
    b_mat = tp['mat']

    # 1. Main conical bough skirt (downward angled)
    bpy.ops.mesh.primitive_cone_add(vertices=nb * 2, radius1=tr, depth=th, location=(0, 0, tz))
    skirt = bpy.context.active_object
    skirt.data.materials.append(b_mat)

    # 2. Drooping branch tips extending outwards for organic rich silhouette
    for b in range(nb):
        ang = b * (math.pi * 2 / nb) + (t_idx * 0.4)
        bx = math.cos(ang) * (tr * 0.72)
        by = math.sin(ang) * (tr * 0.72)
        bz = tz - th * 0.35

        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=tr * 0.32, depth=th * 0.85, location=(bx, by, bz))
        tip = bpy.context.active_object
        # Angle tip slightly downward and outward
        tip.rotation_euler = (math.sin(ang) * 0.5, -math.cos(ang) * 0.5, ang)
        tip.data.materials.append(m_needle_tip if t_idx >= 3 else m_needle_sun)

# Apex Leader Needle
bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.35, depth=1.6, location=(0, 0, 12.6))
top_spire = bpy.context.active_object
top_spire.data.materials.append(m_needle_tip)

# Select all and export
bpy.ops.object.select_all(action='SELECT')
out_path = '{OUTPUT_DIR}/aoe_pine_tall_01.glb'
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
print('Exported:', out_path)
"""

res1 = run_blender_code(pine_tall_code)
print("Tall Pine result:", res1)

# ========================================================
# 2. MEDIUM CONICAL SPRUCE (AOE3 Dense Forest Filler)
# ========================================================
spruce_code = f"""
import bpy
import math

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in bpy.data.meshes: bpy.data.meshes.remove(b)
    for b in bpy.data.materials: bpy.data.materials.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.7, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
    return m

m_bark = mat('M_TrunkSpruce', 0.26, 0.18, 0.12, 0.85)
m_needle_deep = mat('M_SpruceDeep', 0.12, 0.26, 0.15, 0.6)
m_needle_lush = mat('M_SpruceLush', 0.20, 0.40, 0.20, 0.5)

# Trunk (height: 8.5m)
bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=8.2, location=(0, 0, 4.1))
trunk = bpy.context.active_object
trunk.data.materials.append(m_bark)

# 5 Tiered Whorls
tiers = [
    {{'z': 2.4, 'r': 2.7, 'h': 1.5, 'n': 7}},
    {{'z': 3.9, 'r': 2.3, 'h': 1.4, 'n': 7}},
    {{'z': 5.3, 'r': 1.8, 'h': 1.3, 'n': 6}},
    {{'z': 6.6, 'r': 1.3, 'h': 1.2, 'n': 5}},
    {{'z': 7.7, 'r': 0.7, 'h': 1.3, 'n': 5}},
]

for idx, tp in enumerate(tiers):
    tz = tp['z']
    tr = tp['r']
    th = tp['h']
    nb = tp['n']

    bpy.ops.mesh.primitive_cone_add(vertices=nb * 2, radius1=tr, depth=th, location=(0, 0, tz))
    cone = bpy.context.active_object
    cone.data.materials.append(m_needle_deep if idx < 2 else m_needle_lush)

    for b in range(nb):
        ang = b * (math.pi * 2 / nb) + idx * 0.5
        bx = math.cos(ang) * (tr * 0.7)
        by = math.sin(ang) * (tr * 0.7)
        bz = tz - th * 0.3
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=tr * 0.35, depth=th * 0.75, location=(bx, by, bz))
        tip = bpy.context.active_object
        tip.rotation_euler = (math.sin(ang) * 0.4, -math.cos(ang) * 0.4, ang)
        tip.data.materials.append(m_needle_lush)

# Top Spire
bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.28, depth=1.4, location=(0, 0, 8.6))
spire = bpy.context.active_object
spire.data.materials.append(m_needle_lush)

# Select all and export
bpy.ops.object.select_all(action='SELECT')
out_path = '{OUTPUT_DIR}/aoe_spruce_medium_01.glb'
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
print('Exported:', out_path)
"""

res2 = run_blender_code(spruce_code)
print("Medium Spruce result:", res2)

# ========================================================
# 3. JAPANESE SCARLET AUTUMN MAPLE (Momiji)
# ========================================================
maple_code = f"""
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

m_bark_gnarled = mat('M_MapleBark', 0.20, 0.14, 0.10, 0.85)
m_crimson = mat('M_MapleCrimson', 0.82, 0.14, 0.10, 0.55)
m_scarlet = mat('M_MapleScarlet', 0.92, 0.24, 0.12, 0.50)
m_amber = mat('M_MapleAmber', 0.88, 0.45, 0.15, 0.50)

# Gnarled curved trunk
bpy.ops.mesh.primitive_cylinder_add(radius=0.42, depth=3.6, location=(0, 0, 1.8))
trunk = bpy.context.active_object
trunk.rotation_euler = (0.1, 0.15, 0)
trunk.data.materials.append(m_bark_gnarled)

# 4 Main Sprawling Branches
branches = [
    {{'x': 1.2, 'y': 0.8, 'z': 3.4, 'rx': 0.4, 'ry': 0.3, 'rz': 0.6, 'scale': 2.2, 'mat': m_crimson}},
    {{'x': -1.4, 'y': 0.6, 'z': 3.6, 'rx': -0.3, 'ry': 0.4, 'rz': -0.7, 'scale': 2.4, 'mat': m_scarlet}},
    {{'x': 0.2, 'y': -1.5, 'z': 3.8, 'rx': 0.5, 'ry': -0.3, 'rz': 2.2, 'scale': 2.3, 'mat': m_scarlet}},
    {{'x': 0.4, 'y': 0.2, 'z': 5.2, 'rx': 0.1, 'ry': 0.1, 'rz': 0.2, 'scale': 2.6, 'mat': m_amber}},
    {{'x': -0.8, 'y': -0.6, 'z': 4.6, 'rx': -0.2, 'ry': -0.2, 'rz': 1.5, 'scale': 2.0, 'mat': m_crimson}},
]

for b_info in branches:
    bx = b_info['x']
    by = b_info['y']
    bz = b_info['z']
    bs = b_info['scale']
    bmat = b_info['mat']

    # Wooden branch limb
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=2.4, location=(bx * 0.5, by * 0.5, (bz + 2.0) * 0.5))
    limb = bpy.context.active_object
    limb.rotation_euler = (b_info['rx'], b_info['ry'], b_info['rz'])
    limb.data.materials.append(m_bark_gnarled)

    # Layered Foliage Cloud Dome (Multi-tiered fan plates)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=bs * 0.65, location=(bx, by, bz))
    cloud = bpy.context.active_object
    cloud.scale = (1.3, 1.2, 0.65)
    cloud.data.materials.append(bmat)

    # Highlight leaf layer
    bpy.ops.mesh.primitive_uv_sphere_add(radius=bs * 0.5, location=(bx, by, bz + 0.35))
    hcloud = bpy.context.active_object
    hcloud.scale = (1.1, 1.0, 0.55)
    hcloud.data.materials.append(m_amber if bmat == m_scarlet else m_scarlet)

# Select all and export
bpy.ops.object.select_all(action='SELECT')
out_path = '{OUTPUT_DIR}/aoe_japanese_maple_01.glb'
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
print('Exported:', out_path)
"""

res3 = run_blender_code(maple_code)
print("Japanese Maple result:", res3)

# ========================================================
# 4. LUXURIOUS JAPANESE CHERRY BLOSSOM (Sakura)
# ========================================================
sakura_code = f"""
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

m_bark = mat('M_SakuraBark', 0.24, 0.16, 0.12, 0.85)
m_sakura_deep = mat('M_SakuraDeepPink', 0.94, 0.56, 0.68, 0.5)
m_sakura_light = mat('M_SakuraLightPink', 0.98, 0.78, 0.86, 0.45)
m_sakura_white = mat('M_SakuraBlossomWhite', 0.99, 0.92, 0.95, 0.4)

# Sculpted curved trunk (height: 3.8m)
bpy.ops.mesh.primitive_cylinder_add(radius=0.46, depth=3.8, location=(0, 0, 1.9))
trunk = bpy.context.active_object
trunk.rotation_euler = (-0.12, 0.18, 0)
trunk.data.materials.append(m_bark)

# 5 Billowing Blossom Cloud Domes
clouds = [
    {{'x': 1.4, 'y': 0.8, 'z': 3.6, 's': 2.3, 'mat': m_sakura_deep}},
    {{'x': -1.3, 'y': 0.9, 'z': 3.8, 's': 2.4, 'mat': m_sakura_light}},
    {{'x': 0.0, 'y': -1.6, 'z': 3.9, 's': 2.2, 'mat': m_sakura_deep}},
    {{'x': 0.3, 'y': 0.1, 'z': 5.4, 's': 2.8, 'mat': m_sakura_light}},
    {{'x': -0.7, 'y': -0.8, 'z': 4.8, 's': 2.2, 'mat': m_sakura_white}},
]

for c in clouds:
    cx = c['x']
    cy = c['y']
    cz = c['z']
    cs = c['s']

    # Blossom cloud
    bpy.ops.mesh.primitive_uv_sphere_add(radius=cs * 0.65, location=(cx, cy, cz))
    blossom = bpy.context.active_object
    blossom.scale = (1.35, 1.25, 0.75)
    blossom.data.materials.append(c['mat'])

    # Top highlight cloud
    bpy.ops.mesh.primitive_uv_sphere_add(radius=cs * 0.48, location=(cx, cy, cz + 0.35))
    hblossom = bpy.context.active_object
    hblossom.scale = (1.1, 1.05, 0.6)
    hblossom.data.materials.append(m_sakura_white)

# Select all and export
bpy.ops.object.select_all(action='SELECT')
out_path = '{OUTPUT_DIR}/aoe_sakura_blossom_01.glb'
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
print('Exported:', out_path)
print("ALL AOE3 TREE MODELS EXPORTED SUCCESSFULLY!")
"""

res4 = run_blender_code(sakura_code)
print("Sakura Blossom result:", res4)
