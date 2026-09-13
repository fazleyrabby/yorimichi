import bpy
import math
import os

OUTPUT_PATH = "/Users/rabbi/.gemini/antigravity-ide/brain/8ef131ec-a674-4b4e-ad86-e92bffa6de0d/scratch/chibi_samurai_blender_render.png"

# Re-run build_chibi_samurai
import sys
sys.path.append("scripts")
import build_chibi_samurai

# 1. Camera Framing (FRONT 3/4 VIEW - Character faces +Y, so camera is placed at +Y looking at front!)
cam_data = bpy.data.cameras.new('Hero_Camera')
cam_data.lens = 55
cam_obj = bpy.data.objects.new('Hero_Camera', cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# Camera at pleasant front-left 3/4 angle
cam_obj.location = (0.70, 2.50, 0.85)

target = bpy.data.objects.new('Cam_Target', None)
target.location = (0, 0, 0.60)
bpy.context.scene.collection.objects.link(target)

c = cam_obj.constraints.new('TRACK_TO')
c.target = target
c.track_axis = 'TRACK_NEGATIVE_Z'
c.up_axis = 'UP_Y'

# 2. Balanced Studio Lighting
# Key Light (Front-Right)
l_key_data = bpy.data.lights.new('Key_Light', 'AREA')
l_key_data.energy = 85
l_key_data.size = 2.0
l_key_data.color = (1.0, 0.98, 0.95)
l_key = bpy.data.objects.new('Key_Light', l_key_data)
l_key.location = (1.8, 2.0, 1.8)
bpy.context.scene.collection.objects.link(l_key)
ck = l_key.constraints.new('TRACK_TO')
ck.target = target
ck.track_axis = 'TRACK_NEGATIVE_Z'
ck.up_axis = 'UP_Y'

# Fill Light (Front-Left)
l_fill_data = bpy.data.lights.new('Fill_Light', 'AREA')
l_fill_data.energy = 45
l_fill_data.size = 2.5
l_fill_data.color = (0.92, 0.95, 1.0)
l_fill = bpy.data.objects.new('Fill_Light', l_fill_data)
l_fill.location = (-1.8, 1.8, 1.2)
bpy.context.scene.collection.objects.link(l_fill)
cf = l_fill.constraints.new('TRACK_TO')
cf.target = target
cf.track_axis = 'TRACK_NEGATIVE_Z'
cf.up_axis = 'UP_Y'

# Rim Light (Back-Top)
l_rim_data = bpy.data.lights.new('Rim_Light', 'AREA')
l_rim_data.energy = 60
l_rim_data.size = 1.5
l_rim_data.color = (1.0, 0.96, 0.90)
l_rim = bpy.data.objects.new('Rim_Light', l_rim_data)
l_rim.location = (-0.4, -2.0, 1.8)
bpy.context.scene.collection.objects.link(l_rim)

# 3. Studio Ground Plane
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=1.8, depth=0.04, location=(0, 0, -0.02))
pedestal = bpy.context.active_object
pedestal.name = "Pedestal"
mat_p = bpy.data.materials.new("Mat_Pedestal")
mat_p.use_nodes = True
bs = mat_p.node_tree.nodes.get('Principled BSDF')
if bs:
    # Soft warm neutral studio floor matching reference
    bs.inputs['Base Color'].default_value = (0.92, 0.90, 0.86, 1.0)
    bs.inputs['Roughness'].default_value = 0.8
pedestal.data.materials.append(mat_p)

# 4. World Environment
world = bpy.data.worlds.new("StudioWorld")
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value = (0.95, 0.94, 0.92, 1.0)
    bg.inputs['Strength'].default_value = 0.35
bpy.context.scene.world = world

# 5. Color Management
scene = bpy.context.scene
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'Medium Contrast'

# 6. Render Output
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1024
scene.render.resolution_y = 1280
scene.render.filepath = OUTPUT_PATH
scene.render.image_settings.file_format = 'PNG'

bpy.ops.render.render(write_still=True)
print(f"Hero render successfully written to: {OUTPUT_PATH}")
