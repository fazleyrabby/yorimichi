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

print("Generating high-fidelity AOE3 Japanese Bridges in Blender...")

# ========================================================
# 1. MAIN STONE ARCH BRIDGE (Civic Imperial Highway Bridge)
# ========================================================
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

m_granite = mat('M_BridgeGranite', 0.52, 0.50, 0.46, 0.8)
m_granite_dark = mat('M_BridgeGraniteDark', 0.38, 0.36, 0.34, 0.85)
m_cobble = mat('M_BridgeCobble', 0.46, 0.44, 0.40, 0.8)
m_moss = mat('M_BridgeMoss', 0.32, 0.36, 0.26, 0.9)

# Bridge spans along X axis in Blender: length=13.0m, width=4.4m
# (X: -6.5 to +6.5, Y: -2.2 to +2.2, Z: height)
span_x = 13.0
width_y = 4.4

# 1. Solid Stone Arch Barrel Vault underneath
# We build clean stone voussoir segments that form a true structural arch
arch_r = 4.8
arch_w = width_y + 0.4
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=arch_r, depth=arch_w, location=(0, 0, -1.8))
vault = bpy.context.active_object
vault.rotation_euler = (math.pi * 0.5, 0, 0)
vault.data.materials.append(m_granite_dark)

# 2. Heavy Stone Abutments on both riverbanks
for sx in [-1, 1]:
    ab_x = sx * (span_x * 0.5 - 1.2)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ab_x, 0, -1.2))
    ab = bpy.context.active_object
    ab.scale = (3.2, width_y + 0.6, 3.4)
    ab.data.materials.append(m_granite)

# 3. Arched Cobblestone Road Deck
# Gently curved walking deck flush with road approaches on both ends
num_deck_segs = 16
for i in range(num_deck_segs):
    t = (i / (num_deck_segs - 1)) - 0.5 # -0.5 to +0.5
    px = t * (span_x - 0.4)
    # Gentle arch rise: peaks at +0.45m in the center, descends to 0 at ends
    pz = math.cos(t * math.pi) * 0.55 - 0.15
    
    seg_len = (span_x / num_deck_segs) + 0.08
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, 0, pz))
    d_seg = bpy.context.active_object
    d_seg.scale = (seg_len, width_y, 0.35)
    # Tilt slightly to follow arch gradient
    ang_pitch = -math.sin(t * math.pi) * 0.14
    d_seg.rotation_euler = (0, ang_pitch, 0)
    d_seg.data.materials.append(m_cobble)

# 4. Bank Approach Aprons (smooth transition ramps feathering into terrain)
for sx in [-1, 1]:
    ramp_x = sx * (span_x * 0.5 + 0.8)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ramp_x, 0, -0.32))
    ramp = bpy.context.active_object
    ramp.scale = (2.2, width_y + 0.2, 0.35)
    ramp.rotation_euler = (0, -sx * 0.16, 0)
    ramp.data.materials.append(m_cobble)

# 5. Heavy Stone Parapet Railings on Left & Right Sides (Y: -width/2 and +width/2)
para_h = 0.95
para_thick = 0.38
for sy in [-1, 1]:
    py = sy * (width_y * 0.5 - para_thick * 0.5)
    
    # Continuous parapet wall blocks following deck arch
    for i in range(num_deck_segs):
        t = (i / (num_deck_segs - 1)) - 0.5
        px = t * (span_x - 0.4)
        pz = math.cos(t * math.pi) * 0.55 + para_h * 0.5 - 0.1
        seg_len = (span_x / num_deck_segs) + 0.06
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, pz))
        pw = bpy.context.active_object
        pw.scale = (seg_len, para_thick, para_h)
        ang_pitch = -math.sin(t * math.pi) * 0.14
        pw.rotation_euler = (0, ang_pitch, 0)
        pw.data.materials.append(m_granite)

    # Stately Newel Posts at End Corners
    for sx in [-1, 1]:
        nx = sx * (span_x * 0.5 + 0.1)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(nx, py, 0.45))
        np = bpy.context.active_object
        np.scale = (para_thick + 0.2, para_thick + 0.15, para_h + 0.35)
        np.data.materials.append(m_granite_dark)

        # Pyramidal / Capstone Finial
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=para_thick * 0.75, depth=0.35, location=(nx, py, 1.15))
        cap = bpy.context.active_object
        cap.rotation_euler = (0, 0, math.pi * 0.25)
        cap.data.materials.append(m_granite_dark)

# Select all and export
bpy.ops.object.select_all(action='SELECT')
out_path = '{OUTPUT_DIR}/aoe_stone_arch_bridge_01.glb'
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
print('Exported:', out_path)
"""

res1 = run_blender_code(stone_bridge_code)
print("Stone Bridge result:", res1)

# ========================================================
# 2. RUSTIC WOODEN ARCHED FOOTBRIDGE (Upstream Watermill Crossing)
# ========================================================
wood_bridge_code = f"""
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

m_wood_dark = mat('M_TimberDark', 0.24, 0.16, 0.10, 0.85)
m_wood_plank = mat('M_TimberPlank', 0.42, 0.30, 0.18, 0.75)
m_wood_worn = mat('M_TimberWorn', 0.36, 0.26, 0.16, 0.8)
m_rope = mat('M_RopeHemp', 0.55, 0.45, 0.30, 0.9)

# Length spans across river: 11.8m, width: 2.6m
# (X: -5.9 to +5.9, Y: -1.3 to +1.3)
span_x = 11.8
width_y = 2.6

# 1. Dual Curved Timber Stringer Beams underneath
for sy in [-1, 1]:
    by = sy * (width_y * 0.5 - 0.25)
    num_beam_segs = 12
    for i in range(num_beam_segs):
        t = (i / (num_beam_segs - 1)) - 0.5
        bx = t * (span_x - 0.2)
        bz = math.cos(t * math.pi) * 0.65 - 0.22
        b_len = (span_x / num_beam_segs) + 0.1
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bx, by, bz))
        beam = bpy.context.active_object
        beam.scale = (b_len, 0.22, 0.35)
        ang_pitch = -math.sin(t * math.pi) * 0.18
        beam.rotation_euler = (0, ang_pitch, 0)
        beam.data.materials.append(m_wood_dark)

# 2. Sub-structure Trestle Pile Bents (driven deep into riverbed)
# 2 bents at x = -2.6 and x = +2.6
for sx in [-2.6, 2.6]:
    for sy in [-1, 1]:
        px = sx
        py = sy * (width_y * 0.5 - 0.25)
        bpy.ops.mesh.primitive_cylinder_add(vertices=7, radius=0.18, depth=3.8, location=(px, py, -1.2))
        pile = bpy.context.active_object
        pile.rotation_euler = (sy * 0.08, 0, 0)
        pile.data.materials.append(m_wood_dark)
    
    # Cross tie brace between piles
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0, -0.6))
    cross = bpy.context.active_object
    cross.scale = (0.18, width_y, 0.22)
    cross.data.materials.append(m_wood_dark)

# 3. Wooden Plank Walkway Deck (individual planks with non-slip texture)
num_planks = 28
for i in range(num_planks):
    t = (i / (num_planks - 1)) - 0.5
    px = t * (span_x - 0.1)
    pz = math.cos(t * math.pi) * 0.65
    plank_len = width_y + 0.12
    plank_w = (span_x / num_planks) * 0.88
    
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, 0, pz))
    plank = bpy.context.active_object
    plank.scale = (plank_w, plank_len, 0.14)
    ang_pitch = -math.sin(t * math.pi) * 0.18
    plank.rotation_euler = (0, ang_pitch, 0)
    plank.data.materials.append(m_wood_plank if i % 2 == 0 else m_wood_worn)

# 4. Bank Anchors (Heavy log sills embedded into riverbanks on both ends)
for sx in [-1, 1]:
    ax = sx * (span_x * 0.5 + 0.4)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.25, depth=width_y + 0.6, location=(ax, 0, -0.05))
    sill = bpy.context.active_object
    sill.rotation_euler = (math.pi * 0.5, 0, 0)
    sill.data.materials.append(m_wood_dark)

# 5. Rustic Timber Handrails on Left & Right
rail_h = 0.95
for sy in [-1, 1]:
    ry = sy * (width_y * 0.5 - 0.08)
    
    # Posts at regular intervals
    num_posts = 8
    for p in range(num_posts):
        t = (p / (num_posts - 1)) - 0.5
        px = t * (span_x - 0.4)
        pz = math.cos(t * math.pi) * 0.65 + rail_h * 0.5
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.09, depth=rail_h + 0.1, location=(px, ry, pz))
        post = bpy.context.active_object
        post.data.materials.append(m_wood_dark)

    # Top Handrail & Mid Rail
    for rh, r_thick in [(rail_h, 0.12), (rail_h * 0.55, 0.09)]:
        for i in range(12):
            t = (i / 11.0) - 0.5
            px = t * (span_x - 0.3)
            pz = math.cos(t * math.pi) * 0.65 + rh
            seg_len = (span_x / 12.0) + 0.08
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, ry, pz))
            rail = bpy.context.active_object
            rail.scale = (seg_len, r_thick, r_thick)
            ang_pitch = -math.sin(t * math.pi) * 0.18
            rail.rotation_euler = (0, ang_pitch, 0)
            rail.data.materials.append(m_wood_dark)

# Select all and export
bpy.ops.object.select_all(action='SELECT')
out_path = '{OUTPUT_DIR}/aoe_wooden_footbridge_01.glb'
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
print('Exported:', out_path)
"""

res2 = run_blender_code(wood_bridge_code)
print("Wooden Footbridge result:", res2)
