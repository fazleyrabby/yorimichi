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

print("Generating Japanese Winter Yukimi-dōrō (Snow-viewing Lantern) in Blender...")

blender_code = f"""
import bpy
import bmesh
import math
import os

def clear_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in list(bpy.data.meshes): bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials): bpy.data.materials.remove(b)

clear_all()

def mat(name, r, g, b, roughness=0.82, metallic=0.0, emissive=(0,0,0)):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if bs:
        bs.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bs.inputs['Roughness'].default_value = roughness
        bs.inputs['Metallic'].default_value = metallic
        if emissive != (0,0,0):
            if 'Emission Color' in bs.inputs:
                bs.inputs['Emission Color'].default_value = (emissive[0], emissive[1], emissive[2], 1.0)
                bs.inputs['Emission Strength'].default_value = 2.0
            elif 'Emission' in bs.inputs:
                bs.inputs['Emission'].default_value = (emissive[0], emissive[1], emissive[2], 1.0)
    return m

m_stone = mat('M_GraniteStone', 0.48, 0.49, 0.47, roughness=0.88)
m_dark_stone = mat('M_DarkGranite', 0.35, 0.36, 0.34, roughness=0.85)
m_candle = mat('M_LanternFlame', 1.0, 0.65, 0.22, roughness=0.3, emissive=(1.0, 0.65, 0.22))
m_snow = mat('M_SnowCap', 0.95, 0.97, 1.0, roughness=0.65)

# 1. Tripod Curved Granite Legs
for i in range(3):
    ang = i * (math.pi * 2 / 3)
    lx = math.cos(ang) * 0.42
    ly = math.sin(ang) * 0.42
    bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.55, location=(lx, ly, 0.26))
    leg = bpy.context.active_object
    leg.rotation_euler = (math.sin(ang) * 0.22, -math.cos(ang) * 0.22, 0)
    leg.data.materials.append(m_stone)

# 2. Middle Platform (Chūdai)
bpy.ops.mesh.primitive_cylinder_add(radius=0.52, depth=0.14, location=(0, 0, 0.58))
chudai = bpy.context.active_object
chudai.data.materials.append(m_dark_stone)

# 3. Hexagonal Firebox (Hibukuro) with central flame and carved lattice windows
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.34, depth=0.36, location=(0, 0, 0.82))
firebox = bpy.context.active_object
firebox.data.materials.append(m_stone)

# Inner warm candle flame
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, location=(0, 0, 0.82))
candle = bpy.context.active_object
candle.data.materials.append(m_candle)

# 4. Wide Snow Umbrella Roof (Kasa)
bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.82, radius2=0.28, depth=0.24, location=(0, 0, 1.10))
kasa = bpy.context.active_object
kasa.data.materials.append(m_stone)

# 5. Soft Sculpted Winter Snow Cap layer atop the Umbrella
bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.84, radius2=0.30, depth=0.18, location=(0, 0, 1.18))
snow_cap = bpy.context.active_object
snow_cap.data.materials.append(m_snow)

# 6. Sacred Jewel Finial (Hōju)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, location=(0, 0, 1.34))
hoju = bpy.context.active_object
hoju.scale = (1.0, 1.0, 1.25)
hoju.data.materials.append(m_stone)

# Snow dot on top of hoju
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(0, 0, 1.45))
hoju_snow = bpy.context.active_object
hoju_snow.data.materials.append(m_snow)

# Join all into single unified lantern object
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.join()
lantern = bpy.context.active_object
lantern.name = "YukimiDoro_Lantern"

out_path = os.path.join("{OUTPUT_DIR}", "aoe_yukimi_lantern_01.glb")
bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    use_selection=True,
    export_apply=True
)
print("SUCCESS: Exported", out_path)
"""

res = run_blender_code(blender_code)
print("Blender output:", res)
