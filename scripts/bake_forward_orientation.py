import bpy
import math
import os
import sys

sys.path.append("scripts")
import build_chibi_samurai

# 1. Unparent everything while preserving world transforms
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')

# 2. Rotate all objects 180 degrees around Z axis at (0, 0, 0)
bpy.ops.transform.rotate(value=math.pi, orient_axis='Z', center_override=(0, 0, 0))

# 3. Apply all transforms to geometry
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# 4. Re-establish clean joint hierarchy
root = bpy.data.objects.get("Samurai_Root")
torso = bpy.data.objects.get("Torso")
head = bpy.data.objects.get("HeadGroup")
left_arm = bpy.data.objects.get("LeftArm")
right_arm = bpy.data.objects.get("RightArm")
left_leg = bpy.data.objects.get("LeftLeg")
right_leg = bpy.data.objects.get("RightLeg")

torso.parent = root
head.parent = root
left_arm.parent = root
right_arm.parent = root
left_leg.parent = root
right_leg.parent = root

# Re-parent torso children to torso
torso_children = [
    "Inner_Kimono", "Chest_Dou", "Haori_Back", "Tasuki_Strap",
    "Obi_Sash", "Obi_Knot", "Obi_Tie_L", "Obi_Tie_R",
    "Waist_Pouch_L", "Waist_Pouch_R",
    "Haori_Skirt_Front_L", "Haori_Skirt_Front_R", "Haori_Skirt_Back",
    "Haori_Hem_Back", "Haori_Lapel_L", "Haori_Lapel_R"
]
for i in range(4):
    torso_children.append(f"Lacing_Rib_{i}")

for name in torso_children:
    obj = bpy.data.objects.get(name)
    if obj:
        obj.parent = torso

# Re-parent head children to head
head_children = [
    "Head", "Beard", "HairSide_L", "HairSide_R", "HairBack",
    "Kasa_Hat", "Hat_Crown", "Hat_Rim_Ring"
]
for name in head_children:
    obj = bpy.data.objects.get(name)
    if obj:
        obj.parent = head

# Re-parent arm children
for side in ['L', 'R']:
    arm = left_arm if side == 'L' else right_arm
    for part in [f"Sleeve_{side}", f"Sode_Armor_{side}", f"Sode_Rib_{side}", f"Kote_{side}", f"WristBand_{side}", f"Hand_{side}"]:
        obj = bpy.data.objects.get(part)
        if obj:
            obj.parent = arm

# Re-parent leg children
for side in ['L', 'R']:
    leg = left_leg if side == 'L' else right_leg
    for part in [f"Hakama_{side}", f"Shin_{side}", f"Shin_Cord_{side}_0", f"Shin_Cord_{side}_1", f"Boot_{side}", f"Ankle_Ring_{side}"]:
        obj = bpy.data.objects.get(part)
        if obj:
            obj.parent = leg

out_path = "/Users/rabbi/Desktop/Projects/    Yorimichi/public/models/chibi_samurai.glb"
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    use_selection=True,
    export_yup=True
)
print(f"Baked and exported forward-facing Chibi Samurai to: {out_path}")
