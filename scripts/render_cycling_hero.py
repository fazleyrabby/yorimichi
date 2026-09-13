import bpy
import math
import os
import sys

OUTPUT_PATH = "/Users/rabbi/.gemini/antigravity-ide/brain/8ef131ec-a674-4b4e-ad86-e92bffa6de0d/scratch/chibi_cycling_render.png"

# 1. Build Samurai Model
sys.path.append("scripts")
import build_chibi_samurai

# In Blender:
# build_chibi_samurai sets up:
# root = Samurai_Root (Z is up, Y is front (+Y is front!), X is lateral)
# Torso at (0, 0, 0.65)
# HeadGroup at (0, 0, 0.96)
# LeftArm at (0.28, 0, 0.86)
# RightArm at (-0.28, 0, 0.86)
# LeftLeg at (0.14, 0, 0.42)
# RightLeg at (-0.14, 0, 0.42)

# 2. Build Procedural Bicycle in Blender matching AssetGenerator.ts
# In Blender coordinates: +Z is up, +Y is front (same as bike facing +Y)
# Wheel radius: 0.32, wheelbase: 0.86
wheel_radius = 0.32
wheelbase = 0.86

m_bike_frame = build_chibi_samurai.create_mat("Mat_BikeFrame", 0.15, 0.26, 0.19, roughness=0.45, metallic=0.55)
m_chrome     = build_chibi_samurai.create_mat("Mat_Chrome",    0.85, 0.88, 0.86, roughness=0.25, metallic=0.85)
m_rubber     = build_chibi_samurai.create_mat("Mat_Rubber",    0.13, 0.14, 0.15, roughness=0.90, metallic=0.05)
m_saddle     = build_chibi_samurai.create_mat("Mat_Saddle",    0.43, 0.24, 0.13, roughness=0.60, metallic=0.05)
m_basket     = build_chibi_samurai.create_mat("Mat_Basket",    0.77, 0.62, 0.41, roughness=0.85, metallic=0.02)

bike_root = bpy.data.objects.new("Bicycle_Root", None)
bpy.context.scene.collection.objects.link(bike_root)

# Front wheel at (0, +wheelbase*0.5, wheel_radius)
bpy.ops.mesh.primitive_torus_add(major_radius=wheel_radius, minor_radius=0.026, location=(0, wheelbase*0.5, wheel_radius))
f_tire = bpy.context.active_object
f_tire.rotation_euler = (0, math.radians(90), 0)
bpy.ops.object.transform_apply(rotation=True)
build_chibi_samurai.set_flat_shading(f_tire)
build_chibi_samurai.apply_mat(f_tire, m_rubber)
build_chibi_samurai.set_parent(f_tire, bike_root)

# Rear wheel at (0, -wheelbase*0.5, wheel_radius)
bpy.ops.mesh.primitive_torus_add(major_radius=wheel_radius, minor_radius=0.026, location=(0, -wheelbase*0.5, wheel_radius))
r_tire = bpy.context.active_object
r_tire.rotation_euler = (0, math.radians(90), 0)
bpy.ops.object.transform_apply(rotation=True)
build_chibi_samurai.set_flat_shading(r_tire)
build_chibi_samurai.apply_mat(r_tire, m_rubber)
build_chibi_samurai.set_parent(r_tire, bike_root)

# Bottom Bracket at (0, -0.02, 0.22)
bb_loc = (0, -0.02, 0.22)
seat_post_loc = (0, -0.14, 0.50)
head_top_loc = (0, 0.26, 0.60)
head_bot_loc = (0, 0.30, 0.36)

# Frame tubes helper
def add_tube(p1, p2, radius, mat, name):
    dx, dy, dz = p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]
    dist = math.sqrt(dx*dx + dy*dy + dz*dz)
    mx, my, mz = (p1[0]+p2[0])*0.5, (p1[1]+p2[1])*0.5, (p1[2]+p2[2])*0.5
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=dist, location=(mx, my, mz))
    tube = bpy.context.active_object
    tube.name = name
    phi = math.atan2(dy, dx)
    theta = math.acos(dz / dist)
    tube.rotation_euler = (0, theta, phi - math.pi*0.5)
    build_chibi_samurai.set_flat_shading(tube)
    build_chibi_samurai.apply_mat(tube, mat)
    build_chibi_samurai.set_parent(tube, bike_root)
    return tube

add_tube(bb_loc, seat_post_loc, 0.018, m_bike_frame, "SeatTube")
add_tube(head_bot_loc, head_top_loc, 0.022, m_bike_frame, "HeadTube")
add_tube(seat_post_loc, head_top_loc, 0.018, m_bike_frame, "TopTube")
add_tube(head_bot_loc, bb_loc, 0.018, m_bike_frame, "DownTube")

# Rear stays
for x in [-0.05, 0.05]:
    add_tube(seat_post_loc, (x, -wheelbase*0.5, wheel_radius), 0.010, m_bike_frame, "SeatStay")
    add_tube(bb_loc, (x, -wheelbase*0.5, wheel_radius), 0.011, m_bike_frame, "ChainStay")

# Front fork
for x in [-0.045, 0.045]:
    add_tube(head_bot_loc, (x, wheelbase*0.5, wheel_radius), 0.011, m_chrome, "Fork")

# Saddle
bpy.ops.mesh.primitive_cube_add(size=0.18, location=(0, seat_post_loc[1] - 0.02, seat_post_loc[2] + 0.05))
saddle = bpy.context.active_object
saddle.name = "Saddle"
saddle.scale = (1.0, 1.25, 0.28)
bpy.ops.object.transform_apply(scale=True)
build_chibi_samurai.set_flat_shading(saddle)
build_chibi_samurai.apply_mat(saddle, m_saddle)
build_chibi_samurai.set_parent(saddle, bike_root)

# Handlebars
bpy.ops.mesh.primitive_cube_add(size=0.44, location=(0, head_top_loc[1] - 0.05, head_top_loc[2] + 0.08))
hbar = bpy.context.active_object
hbar.scale = (1.0, 0.05, 0.05)
bpy.ops.object.transform_apply(scale=True)
build_chibi_samurai.set_flat_shading(hbar)
build_chibi_samurai.apply_mat(hbar, m_chrome)
build_chibi_samurai.set_parent(hbar, bike_root)

# Grips
for gx in [-0.20, 0.20]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.08, location=(gx, head_top_loc[1] - 0.07, head_top_loc[2] + 0.08))
    grip = bpy.context.active_object
    grip.rotation_euler = (math.radians(90), 0, 0)
    build_chibi_samurai.set_flat_shading(grip)
    build_chibi_samurai.apply_mat(grip, m_rubber)
    build_chibi_samurai.set_parent(grip, bike_root)

# Front Wicker Basket
bpy.ops.mesh.primitive_cube_add(size=0.20, location=(0, head_top_loc[1] + 0.16, head_top_loc[2] + 0.01))
bsk = bpy.context.active_object
bsk.scale = (1.3, 0.9, 0.8)
bpy.ops.object.transform_apply(scale=True)
build_chibi_samurai.set_flat_shading(bsk)
build_chibi_samurai.apply_mat(bsk, m_basket)
build_chibi_samurai.set_parent(bsk, bike_root)

# Rear Luggage Rack
bpy.ops.mesh.primitive_cube_add(size=0.20, location=(0, -wheelbase*0.40, wheel_radius + 0.16))
rack = bpy.context.active_object
rack.scale = (0.75, 1.4, 0.10)
bpy.ops.object.transform_apply(scale=True)
build_chibi_samurai.set_flat_shading(rack)
build_chibi_samurai.apply_mat(rack, m_chrome)
build_chibi_samurai.set_parent(rack, bike_root)

# 3. Pose Chibi Samurai (matching the updated Player.ts parameters)
# In Blender coordinates: +Z is Up, +Y is Forward, +X is Lateral
torso_obj = bpy.data.objects.get('Torso')
head_obj = bpy.data.objects.get('HeadGroup')
left_arm_obj = bpy.data.objects.get('LeftArm')
right_arm_obj = bpy.data.objects.get('RightArm')
left_leg_obj = bpy.data.objects.get('LeftLeg')
right_leg_obj = bpy.data.objects.get('RightLeg')

# Seated squarely on the saddle (Y=-0.14, Z=0.64) with athletic forward lean
if torso_obj:
    torso_obj.location = (0, -0.14, 0.64)
    torso_obj.rotation_euler = (math.radians(10), 0, 0) # Leaning forward towards +Y

if head_obj:
    head_obj.location = (0, -0.08, 0.94)
    head_obj.rotation_euler = (math.radians(-7), 0, 0) # Looking forward up

if left_arm_obj:
    left_arm_obj.location = (0.24, -0.05, 0.82)
    left_arm_obj.rotation_euler = (math.radians(65), math.radians(8), math.radians(-7))

if right_arm_obj:
    right_arm_obj.location = (-0.24, -0.05, 0.82)
    right_arm_obj.rotation_euler = (math.radians(65), math.radians(-8), math.radians(7))

# Legs pedaling/seated
if left_leg_obj:
    left_leg_obj.location = (0.13, -0.12, 0.50)
    left_leg_obj.rotation_euler = (math.radians(38), 0, math.radians(-3))

if right_leg_obj:
    right_leg_obj.location = (-0.13, -0.12, 0.50)
    right_leg_obj.rotation_euler = (math.radians(45), 0, math.radians(3))

# 4. Camera Setup (Side-to-3/4 view, matching the user's perspective)
cam_data = bpy.data.cameras.new('Cycling_Cam')
cam_data.lens = 42
cam_obj = bpy.data.objects.new('Cycling_Cam', cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# Camera positioned at side 3/4 angle, pulled back to see whole bike and rider
cam_obj.location = (2.8, -0.15, 0.70)

cam_target = bpy.data.objects.new('Cam_Target', None)
cam_target.location = (0, 0, 0.50)
bpy.context.scene.collection.objects.link(cam_target)

c = cam_obj.constraints.new('TRACK_TO')
c.target = cam_target
c.track_axis = 'TRACK_NEGATIVE_Z'
c.up_axis = 'UP_Y'

# Studio Lights
l_key_data = bpy.data.lights.new('Key_Light', 'AREA')
l_key_data.energy = 90
l_key_data.size = 2.0
l_key = bpy.data.objects.new('Key_Light', l_key_data)
l_key.location = (2.5, 1.5, 2.0)
bpy.context.scene.collection.objects.link(l_key)
ck = l_key.constraints.new('TRACK_TO')
ck.target = cam_target
ck.track_axis = 'TRACK_NEGATIVE_Z'
ck.up_axis = 'UP_Y'

l_fill_data = bpy.data.lights.new('Fill_Light', 'AREA')
l_fill_data.energy = 50
l_fill_data.size = 2.5
l_fill = bpy.data.objects.new('Fill_Light', l_fill_data)
l_fill.location = (-2.0, -1.0, 1.5)
bpy.context.scene.collection.objects.link(l_fill)

# Studio floor
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=2.5, depth=0.04, location=(0, 0, -0.02))
ped = bpy.context.active_object
ped.name = "Floor"
mat_f = build_chibi_samurai.create_mat("Mat_Floor", 0.90, 0.88, 0.84, roughness=0.8)
ped.data.materials.append(mat_f)

world = bpy.data.worlds.new("CyclingStudioWorld")
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value = (0.94, 0.93, 0.91, 1.0)
    bg.inputs['Strength'].default_value = 0.4
bpy.context.scene.world = world

scene = bpy.context.scene
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'Medium Contrast'
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1024
scene.render.resolution_y = 768
scene.render.filepath = OUTPUT_PATH
scene.render.image_settings.file_format = 'PNG'

bpy.ops.render.render(write_still=True)
print(f"Rendered cycling hero preview to: {OUTPUT_PATH}")
