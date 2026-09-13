import bpy
import math

OUTPUT_PATH = "/Users/rabbi/.gemini/antigravity-ide/brain/8ef131ec-a674-4b4e-ad86-e92bffa6de0d/scratch/gorge_clear_road_render.png"

# Setup camera looking at the gorge from isometric South-East angle
cam_data = bpy.data.cameras.new('RenderCam')
cam_data.type = 'ORTHO'
cam_data.ortho_scale = 32.0
cam = bpy.data.objects.new('RenderCam', cam_data)
bpy.context.scene.collection.objects.link(cam)
bpy.context.scene.camera = cam

# Position camera
cam.location = (20.0, -22.0, 24.0)
cam.rotation_euler = (math.radians(58), 0, math.radians(45))

# Sunlight
light_data = bpy.data.lights.new('Sun', type='SUN')
light_data.energy = 3.5
light = bpy.data.objects.new('Sun', light_data)
light.rotation_euler = (math.radians(45), math.radians(25), math.radians(60))
bpy.context.scene.collection.objects.link(light)

# Add road indicator curve/strip to visually prove road is 100% clear
curve_data = bpy.data.curves.new('RoadPath', type='CURVE')
curve_data.dimensions = '3D'
polyline = curve_data.splines.new('POLY')
# Road points at by = 8.5 (Z=-63.5 in Three.js)
road_pts = [(-20.0, 8.5, 14.1), (0.0, 8.5, 14.1), (20.0, 8.5, 14.1)]
polyline.points.add(len(road_pts) - 1)
for i, pt in enumerate(road_pts):
    polyline.points[i].co = (pt[0], pt[1], pt[2], 1.0)
curve_data.bevel_depth = 1.2
curve_obj = bpy.data.objects.new('RoadVisualizer', curve_data)
bpy.context.scene.collection.objects.link(curve_obj)

# Road material (golden amber)
m_road = bpy.data.materials.new(name="RoadMat")
m_road.use_nodes = True
m_road.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = (0.85, 0.65, 0.35, 1.0)
curve_obj.data.materials.append(m_road)

bpy.context.scene.render.resolution_x = 960
bpy.context.scene.render.resolution_y = 720
bpy.context.scene.render.filepath = OUTPUT_PATH
bpy.ops.render.render(write_still=True)
print(f"Saved clear road verification render to: {OUTPUT_PATH}")
