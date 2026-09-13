import bpy
import bmesh
import math
import os

OUTPUT_DIR = "/Users/rabbi/Desktop/Projects/    Yorimichi/public/models"
RENDER_DIR = "/Users/rabbi/.gemini/antigravity-ide/brain/8ef131ec-a674-4b4e-ad86-e92bffa6de0d/scratch"

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in list(bpy.data.meshes): bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials): bpy.data.materials.remove(b)
    for b in list(bpy.data.curves): bpy.data.curves.remove(b)
    for b in list(bpy.data.images): bpy.data.images.remove(b)

def clamp(val, min_v, max_v):
    return max(min_v, min(max_v, val))

def lerp(a, b, t):
    return a + (b - a) * t

def lerp_color(c1, c2, t):
    t = clamp(t, 0.0, 1.0)
    return (
        lerp(c1[0], c2[0], t),
        lerp(c1[1], c2[1], t),
        lerp(c1[2], c2[2], t),
        1.0
    )

def set_parent(child, parent, local_loc=None, local_rot=None):
    child.parent = parent
    if local_loc is not None:
        child.location = local_loc
    if local_rot is not None:
        child.rotation_euler = local_rot

def set_smooth(obj):
    for f in obj.data.polygons:
        f.use_smooth = True

def setup_color_management(scene):
    if hasattr(scene, 'view_settings'):
        scene.view_settings.view_transform = 'Standard'
        scene.view_settings.look = 'None'
        scene.view_settings.exposure = 0.0

# =========================================================================
# HIGH-RES PROCEDURAL NISHIKIGOI TEXTURES (1024x1024)
# =========================================================================
def generate_koi_texture(variety="kohaku", width=1024, height=1024):
    img_name = f"Tex_Koi_{variety}"
    img = bpy.data.images.new(img_name, width=width, height=height)
    pixels = [0.0] * (width * height * 4)

    # Masterpiece Japanese Nishikigoi Palette
    WHITE_PORCELAIN = (0.97, 0.96, 0.95)
    CREAM_BELLY     = (0.91, 0.88, 0.82)
    SCARLET_HI      = (0.92, 0.12, 0.04) # Saturated fiery lacquer vermilion
    TANGERINE_ORANGE= (0.95, 0.36, 0.05) # Radiant cadmium orange
    GOLD_OGON       = (0.96, 0.74, 0.10) # Pure Yamabuki gold
    GOLD_HIGHLIGHT  = (1.00, 0.90, 0.38)
    GOLD_AMBER      = (0.76, 0.44, 0.04)
    SLATE_BLUE      = (0.28, 0.38, 0.50) # Asagi indigo net
    SLATE_DARK      = (0.15, 0.22, 0.32)
    SLATE_LIGHT     = (0.70, 0.78, 0.86)
    SUMI_BLACK      = (0.07, 0.07, 0.08) # Deep calligraphy ink black

    for y in range(height):
        v = y / float(height)
        row_offset = y * width * 4

        for x in range(width):
            u = x / float(width)
            d_spine = min(u, 1.0 - u)

            belly_t = clamp((d_spine - 0.26) / 0.22, 0.0, 1.0)
            base_col = lerp_color(WHITE_PORCELAIN, CREAM_BELLY, belly_t)
            col = base_col

            if variety == "tancho":
                # Pure snowy white + crimson sun crown on forehead
                v_center = 0.135
                dist_v = (v - v_center) / 0.062
                dist_u = d_spine / 0.062
                dist = math.sqrt(dist_v * dist_v + dist_u * dist_u)
                if dist < 1.0:
                    edge = clamp((1.0 - dist) * 25.0, 0.0, 1.0)
                    col = lerp_color(base_col, SCARLET_HI, edge)

            elif variety == "tancho_showa":
                # Iconic Tancho Showa: Black body, white snout rim, crimson sun crown
                col = SUMI_BLACK
                if v < 0.055:
                    col = lerp_color(SUMI_BLACK, WHITE_PORCELAIN, clamp((0.055 - v) * 35.0, 0, 1))
                v_center = 0.135
                dist_v = (v - v_center) / 0.062
                dist_u = d_spine / 0.062
                dist = math.sqrt(dist_v * dist_v + dist_u * dist_u)
                if dist < 1.0:
                    edge = clamp((1.0 - dist) * 25.0, 0.0, 1.0)
                    col = lerp_color(col, SCARLET_HI, edge)
                # White spine streak near tail peduncle
                if 0.65 < v < 0.88 and d_spine < 0.04:
                    col = lerp_color(col, WHITE_PORCELAIN, 0.90)

            elif variety == "kohaku":
                # Traditional 3-step Danmoyo vermilion markings
                is_hi = 0.0
                if 0.055 < v < 0.22:
                    scallop = 0.095 + 0.018 * math.sin(v * 42.0)
                    if d_spine < scallop:
                        edge = min(clamp((scallop - d_spine) * 45.0, 0, 1),
                                   clamp((v - 0.055) * 40.0, 0, 1),
                                   clamp((0.22 - v) * 40.0, 0, 1))
                        is_hi = max(is_hi, edge)
                if 0.33 < v < 0.58:
                    flank_bias = 0.035 * math.sin((u - 0.5) * math.pi)
                    scallop = 0.16 + flank_bias + 0.02 * math.sin(v * 28.0)
                    if d_spine < scallop:
                        edge = min(clamp((scallop - d_spine) * 35.0, 0, 1),
                                   clamp((v - 0.33) * 35.0, 0, 1),
                                   clamp((0.58 - v) * 35.0, 0, 1))
                        is_hi = max(is_hi, edge)
                if 0.68 < v < 0.84:
                    scallop = 0.105 + 0.015 * math.cos(v * 36.0)
                    if d_spine < scallop:
                        edge = min(clamp((scallop - d_spine) * 40.0, 0, 1),
                                   clamp((v - 0.68) * 35.0, 0, 1),
                                   clamp((0.84 - v) * 35.0, 0, 1))
                        is_hi = max(is_hi, edge)
                if is_hi > 0.0:
                    col = lerp_color(base_col, SCARLET_HI, is_hi)

            elif variety == "inazuma_kohaku":
                # Circular 4-spot stepping stones (Reference 2)
                is_hi = 0.0
                spots = [(0.14, 0.075), (0.34, 0.085), (0.54, 0.090), (0.74, 0.075)]
                for sv, s_rad in spots:
                    dv = (v - sv) / (s_rad * 1.3)
                    du = d_spine / s_rad
                    dist = math.sqrt(dv * dv + du * du)
                    if dist < 1.0:
                        is_hi = max(is_hi, clamp((1.0 - dist) * 20.0, 0, 1))
                if is_hi > 0.0:
                    col = lerp_color(base_col, SCARLET_HI, is_hi)

            elif variety == "ogon":
                # Yamabuki Ogon: Metallic gold with diamond scale sheen
                bg_gold = lerp_color(GOLD_OGON, GOLD_HIGHLIGHT, clamp((d_spine - 0.15) / 0.30, 0, 1))
                if 0.18 < v < 0.88 and d_spine < 0.36:
                    mesh = math.cos(u * 55.0 + v * 65.0) * math.cos(u * 55.0 - v * 65.0)
                    if mesh > 0.15:
                        col = lerp_color(bg_gold, GOLD_HIGHLIGHT, clamp((mesh - 0.15) * 2.2, 0, 1))
                    elif mesh < -0.15:
                        col = lerp_color(bg_gold, GOLD_AMBER, clamp((-mesh - 0.15) * 2.0, 0, 1))
                    else:
                        col = bg_gold
                else:
                    col = bg_gold

            elif variety == "asagi":
                # Asagi: Indigo-blue net back + bright orange flanks/cheeks
                if 0.15 < v < 0.88 and d_spine < 0.22:
                    mesh = math.cos(u * 60.0 + v * 70.0) * math.cos(u * 60.0 - v * 70.0)
                    if mesh > 0.2:
                        col = lerp_color(SLATE_BLUE, SLATE_LIGHT, clamp((mesh - 0.2) * 2.0, 0, 1))
                    elif mesh < -0.15:
                        col = lerp_color(SLATE_BLUE, SLATE_DARK, clamp((-mesh - 0.15) * 2.2, 0, 1))
                    else:
                        col = SLATE_BLUE
                elif 0.06 < v < 0.85 and 0.17 < d_spine < 0.42:
                    orange_edge = min(clamp((d_spine - 0.17) * 25.0, 0, 1),
                                     clamp((0.42 - d_spine) * 25.0, 0, 1),
                                     clamp((v - 0.06) * 25.0, 0, 1),
                                     clamp((0.85 - v) * 25.0, 0, 1))
                    col = lerp_color(base_col, TANGERINE_ORANGE, orange_edge)
                else:
                    col = base_col

            elif variety == "matsuba":
                # Ki Matsuba: Amber orange with black pinecone diamond scale pattern
                bg_matsuba = lerp_color(TANGERINE_ORANGE, GOLD_OGON, clamp((d_spine - 0.08) / 0.35, 0, 1))
                if 0.18 < v < 0.86 and d_spine < 0.30:
                    mesh = math.cos(u * 52.0 + v * 62.0) * math.cos(u * 52.0 - v * 62.0)
                    if mesh > 0.26:
                        edge = clamp((mesh - 0.26) * 4.0, 0, 1)
                        col = lerp_color(bg_matsuba, SUMI_BLACK, edge * 0.94)
                    else:
                        col = bg_matsuba
                else:
                    col = bg_matsuba

            elif variety == "bekko":
                # Shiro Bekko: White body with calligraphy sumi ink blotches
                is_sumi = 0.0
                if 0.24 < v < 0.38 and 0.02 < d_spine < 0.16:
                    edge = min(clamp((v - 0.24) * 30.0, 0, 1), clamp((0.38 - v) * 30.0, 0, 1),
                               clamp((d_spine - 0.02) * 35.0, 0, 1), clamp((0.16 - d_spine) * 35.0, 0, 1))
                    is_sumi = max(is_sumi, edge)
                if 0.46 < v < 0.62 and d_spine < 0.14:
                    edge = min(clamp((v - 0.46) * 30.0, 0, 1), clamp((0.62 - v) * 30.0, 0, 1),
                               clamp((0.14 - d_spine) * 35.0, 0, 1))
                    is_sumi = max(is_sumi, edge)
                if 0.72 < v < 0.86 and 0.02 < d_spine < 0.12:
                    edge = min(clamp((v - 0.72) * 30.0, 0, 1), clamp((0.86 - v) * 30.0, 0, 1),
                               clamp((0.12 - d_spine) * 35.0, 0, 1))
                    is_sumi = max(is_sumi, edge)
                if is_sumi > 0.0:
                    col = lerp_color(base_col, SUMI_BLACK, is_sumi)

            idx = row_offset + x * 4
            pixels[idx]     = col[0]
            pixels[idx + 1] = col[1]
            pixels[idx + 2] = col[2]
            pixels[idx + 3] = 1.0

    img.pixels.foreach_set(pixels)
    img.update()
    return img

# =========================================================================
# 3D MODEL GENERATION: JAPANESE NISHIKIGOI CARP
# =========================================================================
def build_koi_model(variety="kohaku", spine_curve=0.0):
    root = bpy.data.objects.new(f"Koi_{variety}_Root", None)
    bpy.context.scene.collection.objects.link(root)

    # 1. Texture & Material
    tex_img = generate_koi_texture(variety=variety, width=1024, height=1024)
    mat_body = bpy.data.materials.new(name=f"Mat_Koi_{variety}")
    nt = mat_body.node_tree
    bs = nt.nodes.get('Principled BSDF')
    tex_node = nt.nodes.new('ShaderNodeTexImage')
    tex_node.image = tex_img
    nt.links.new(tex_node.outputs['Color'], bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value = 0.22
    bs.inputs['Metallic'].default_value = 0.35 if variety == "ogon" else 0.02
    if 'Specular IOR Level' in bs.inputs:
        bs.inputs['Specular IOR Level'].default_value = 0.65
    elif 'Specular' in bs.inputs:
        bs.inputs['Specular'].default_value = 0.65

    # 2. Parametric Hydrodynamic Body Mesh
    mesh_body = bpy.data.meshes.new(f"Koi_Body_{variety}")
    obj_body = bpy.data.objects.new("Body", mesh_body)
    bpy.context.scene.collection.objects.link(obj_body)
    set_parent(obj_body, root)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    stations = [
        (0.00,  0.88, 0.07, 0.05, -0.02), # Snout tip (broad rounded)
        (0.04,  0.80, 0.15, 0.11, -0.02), # Mouth
        (0.12,  0.66, 0.25, 0.19,  0.00), # Forehead & eyes
        (0.24,  0.45, 0.34, 0.27,  0.02), # Pectoral girdle (widest)
        (0.40,  0.18, 0.35, 0.28,  0.03), # Dorsal start
        (0.56, -0.12, 0.30, 0.25,  0.02), # Mid body
        (0.72, -0.40, 0.21, 0.20,  0.01), # Rear body taper
        (0.86, -0.65, 0.11, 0.14,  0.00), # Peduncle entry
        (1.00, -0.84, 0.04, 0.08,  0.00), # Tail base
    ]

    NUM_SEGS = 24
    rings = []

    for s_idx, (v_norm, y_pos, rx, rz, cz) in enumerate(stations):
        curve_x = math.sin(v_norm * math.pi * 1.5) * spine_curve
        ring_verts = []
        for i in range(NUM_SEGS):
            theta = (i / float(NUM_SEGS)) * 2.0 * math.pi
            cos_th = math.cos(theta)
            sin_th = math.sin(theta)

            z_mod = rz * (0.88 if cos_th < 0 else 1.0)
            x_mod = rx * (1.0 - 0.12 * (cos_th ** 2) if cos_th > 0 else 1.0)

            vx = curve_x + x_mod * sin_th
            vz = cz + z_mod * cos_th
            v = bm.verts.new((vx, y_pos, vz))
            ring_verts.append(v)
        rings.append(ring_verts)

    bm.verts.ensure_lookup_table()

    for r in range(len(stations) - 1):
        v_start = stations[r][0]
        v_end   = stations[r + 1][0]
        for i in range(NUM_SEGS):
            i_next = (i + 1) % NUM_SEGS
            v0 = rings[r][i]
            v1 = rings[r][i_next]
            v2 = rings[r + 1][i_next]
            v3 = rings[r + 1][i]

            face = bm.faces.new([v0, v1, v2, v3])
            u0 = i / float(NUM_SEGS)
            u1 = (i + 1) / float(NUM_SEGS)

            for loop in face.loops:
                if loop.vert == v0: loop[uv_layer].uv = (u0, v_start)
                elif loop.vert == v1: loop[uv_layer].uv = (u1, v_start)
                elif loop.vert == v2: loop[uv_layer].uv = (u1, v_end)
                elif loop.vert == v3: loop[uv_layer].uv = (u0, v_end)

    snout_center = bm.verts.new((0, stations[0][1] + 0.03, stations[0][4]))
    for i in range(NUM_SEGS):
        i_next = (i + 1) % NUM_SEGS
        f = bm.faces.new([snout_center, rings[0][i], rings[0][i_next]])
        for loop in f.loops:
            if loop.vert == snout_center: loop[uv_layer].uv = (0.5, 0.0)
            elif loop.vert == rings[0][i]: loop[uv_layer].uv = (i / float(NUM_SEGS), stations[0][0])
            else: loop[uv_layer].uv = (i_next / float(NUM_SEGS), stations[0][0])

    bm.to_mesh(mesh_body)
    bm.free()

    sub = obj_body.modifiers.new("Subsurf", 'SUBSURF')
    sub.levels = 1
    set_smooth(obj_body)
    obj_body.data.materials.append(mat_body)

    # 3. Translucent Fin Material
    mat_fin = bpy.data.materials.new(name=f"Mat_KoiFin_{variety}")
    bs_f = mat_fin.node_tree.nodes.get('Principled BSDF')
    fin_col = (0.96, 0.96, 0.98, 1.0)
    if variety == "asagi":
        fin_col = (0.95, 0.44, 0.16, 1.0) # Motoaka orange
    elif variety == "ogon":
        fin_col = (0.98, 0.84, 0.35, 1.0)
    elif variety == "matsuba":
        fin_col = (0.96, 0.60, 0.20, 1.0)
    elif variety == "tancho_showa":
        fin_col = (0.28, 0.28, 0.30, 1.0) # dark sumi fin
    bs_f.inputs['Base Color'].default_value = fin_col
    bs_f.inputs['Roughness'].default_value = 0.30
    if 'Transmission Weight' in bs_f.inputs:
        bs_f.inputs['Transmission Weight'].default_value = 0.35
    elif 'Transmission' in bs_f.inputs:
        bs_f.inputs['Transmission'].default_value = 0.35

    # 4. Streamlined Dorsal Fin
    mesh_dorsal = bpy.data.meshes.new("Dorsal_Mesh")
    obj_dorsal = bpy.data.objects.new("Dorsal_Fin", mesh_dorsal)
    bpy.context.scene.collection.objects.link(obj_dorsal)
    bm_d = bmesh.new()
    pts_d = [
        (0.0,  0.24, 0.28),
        (0.0,  0.10, 0.38),
        (0.0, -0.14, 0.36),
        (0.0, -0.36, 0.27),
        (0.0, -0.48, 0.19),
        (0.0, -0.44, 0.17),
        (0.0, -0.16, 0.24),
        (0.0,  0.12, 0.27),
    ]
    if spine_curve != 0.0:
        pts_d = [(math.sin((0.5 - p[1]) * math.pi * 0.8) * spine_curve, p[1], p[2]) for p in pts_d]
    verts_d = [bm_d.verts.new(p) for p in pts_d]
    bm_d.faces.new(verts_d)
    bm_d.to_mesh(mesh_dorsal)
    bm_d.free()

    sol_d = obj_dorsal.modifiers.new("Solidify", 'SOLIDIFY')
    sol_d.thickness = 0.016
    set_smooth(obj_dorsal)
    obj_dorsal.data.materials.append(mat_fin)
    set_parent(obj_dorsal, obj_body)

    # 5. Paddle Pectoral Fins (Swept Back at 34 Deg with Camber)
    for is_left in [True, False]:
        sign = 1.0 if is_left else -1.0
        mesh_pec = bpy.data.meshes.new(f"Pectoral_{'L' if is_left else 'R'}_Mesh")
        obj_pec = bpy.data.objects.new(f"Pectoral_{'L' if is_left else 'R'}", mesh_pec)
        bpy.context.scene.collection.objects.link(obj_pec)

        bm_p = bmesh.new()
        fan_pts = [
            (0.0,  0.00,  0.00),
            (sign * 0.20, -0.06, -0.03),
            (sign * 0.38, -0.18, -0.05),
            (sign * 0.40, -0.34, -0.03),
            (sign * 0.28, -0.40, -0.01),
            (sign * 0.12, -0.26,  0.00),
        ]
        verts_p = [bm_p.verts.new(p) for p in fan_pts]
        bm_p.faces.new(verts_p)
        bm_p.to_mesh(mesh_pec)
        bm_p.free()

        sol_p = obj_pec.modifiers.new("Solidify", 'SOLIDIFY')
        sol_p.thickness = 0.018
        sub_p = obj_pec.modifiers.new("Subsurf", 'SUBSURF')
        sub_p.levels = 1

        set_smooth(obj_pec)
        obj_pec.data.materials.append(mat_fin)
        pec_x = sign * 0.30 + (math.sin(0.24 * math.pi * 1.5) * spine_curve)
        set_parent(
            obj_pec, obj_body,
            local_loc=(pec_x, 0.44, -0.06),
            local_rot=(math.radians(12), sign * math.radians(-34), sign * math.radians(-16))
        )

    # 6. Smooth Curved Paired Chin Barbels
    for is_left in [True, False]:
        sign = 1.0 if is_left else -1.0
        curve = bpy.data.curves.new(f"Barbel_{'L' if is_left else 'R'}", 'CURVE')
        curve.dimensions = '3D'
        curve.bevel_depth = 0.012
        curve.bevel_resolution = 4
        spline = curve.splines.new('BEZIER')
        spline.bezier_points.add(2)
        barb_pts = [
            (0.0, 0.0, 0.0),
            (sign * 0.05, -0.08, -0.03),
            (sign * 0.08, -0.18, -0.06)
        ]
        for idx, pt in enumerate(barb_pts):
            bp = spline.bezier_points[idx]
            bp.co = pt
            bp.handle_left_type = 'AUTO'
            bp.handle_right_type = 'AUTO'
        obj_barb = bpy.data.objects.new(f"Barbel_{'L' if is_left else 'R'}", curve)
        bpy.context.scene.collection.objects.link(obj_barb)
        obj_barb.data.materials.append(mat_fin)
        barb_x = sign * 0.13 + (math.sin(0.04 * math.pi * 1.5) * spine_curve)
        set_parent(obj_barb, obj_body, local_loc=(barb_x, 0.74, -0.07))

    # 7. Recessed Glossy Bead Eyes with Golden Iris Rim
    mat_pupil = bpy.data.materials.new("Mat_KoiPupil")
    bs_pu = mat_pupil.node_tree.nodes.get('Principled BSDF')
    bs_pu.inputs['Base Color'].default_value = (0.015, 0.015, 0.02, 1.0)
    bs_pu.inputs['Roughness'].default_value = 0.03

    mat_iris = bpy.data.materials.new("Mat_KoiIris")
    bs_ir = mat_iris.node_tree.nodes.get('Principled BSDF')
    bs_ir.inputs['Base Color'].default_value = (0.88, 0.72, 0.25, 1.0)
    bs_ir.inputs['Roughness'].default_value = 0.25

    for is_left in [True, False]:
        sign = 1.0 if is_left else -1.0
        bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=14, radius=0.052, location=(0, 0, 0))
        iris = bpy.context.active_object
        iris.scale = (0.75, 1.0, 1.0)
        bpy.ops.object.transform_apply(scale=True)
        set_smooth(iris)
        iris.data.materials.append(mat_iris)

        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.042, location=(sign * 0.012, 0.005, 0.005))
        pupil = bpy.context.active_object
        set_smooth(pupil)
        pupil.data.materials.append(mat_pupil)
        set_parent(pupil, iris)

        eye_x = sign * 0.23 + (math.sin(0.12 * math.pi * 1.5) * spine_curve)
        set_parent(iris, obj_body, local_loc=(eye_x, 0.62, 0.07), local_rot=(0, sign * math.radians(16), 0))

    # 8. Articulated Tail Peduncle & Seamless Butterfly Caudal Fin
    tail_yaw = spine_curve * 0.75
    tail_group = bpy.data.objects.new("Tail", None)
    # Match the exact body tail base station at Y = -0.84
    tail_x = math.sin(1.0 * math.pi * 1.5) * spine_curve
    tail_group.location = (tail_x, -0.84, 0.0)
    tail_group.rotation_euler = (0, 0, tail_yaw)
    bpy.context.scene.collection.objects.link(tail_group)
    set_parent(tail_group, obj_body)

    mesh_tail = bpy.data.meshes.new("Caudal_Mesh")
    obj_tail = bpy.data.objects.new("Caudal_Fin", mesh_tail)
    bpy.context.scene.collection.objects.link(obj_tail)
    bm_t = bmesh.new()

    # Butterfly tail with wide horizontal flare in X and undulating wave in Z
    # Attached at origin (0, 0, 0) with zero gap!
    t_fan_pts = [
        # (x, y, z)
        ( 0.00,  0.02,  0.00), # overlaps cleanly with peduncle tip
        ( 0.12, -0.16,  0.10),
        ( 0.30, -0.42,  0.22), # upper lobe tip
        ( 0.26, -0.52,  0.12),
        ( 0.12, -0.42,  0.02),
        ( 0.00, -0.34,  0.00), # center notch
        (-0.12, -0.42, -0.02),
        (-0.26, -0.52, -0.12),
        (-0.30, -0.42, -0.22), # lower lobe tip
        (-0.12, -0.16, -0.10),
    ]
    verts_t = [bm_t.verts.new(p) for p in t_fan_pts]
    bm_t.faces.new(verts_t)
    bm_t.to_mesh(mesh_tail)
    bm_t.free()

    sol_t = obj_tail.modifiers.new("Solidify", 'SOLIDIFY')
    sol_t.thickness = 0.018
    sub_t = obj_tail.modifiers.new("Subsurf", 'SUBSURF')
    sub_t.levels = 1

    set_smooth(obj_tail)
    obj_tail.data.materials.append(mat_fin)
    set_parent(obj_tail, tail_group, local_loc=(0.0, 0.0, 0.0))

    return root

# =========================================================================
# CHIBI FANTAIL GOLDFISH (Reference 0)
# =========================================================================
def build_goldfish_model():
    root = bpy.data.objects.new("Goldfish_Root", None)
    bpy.context.scene.collection.objects.link(root)

    # Materials
    m_red = bpy.data.materials.new("Mat_GF_Red")
    bs_r = m_red.node_tree.nodes.get('Principled BSDF')
    bs_r.inputs['Base Color'].default_value = (0.92, 0.14, 0.05, 1.0)
    bs_r.inputs['Roughness'].default_value = 0.24
    if 'Specular IOR Level' in bs_r.inputs: bs_r.inputs['Specular IOR Level'].default_value = 0.7

    m_cream = bpy.data.materials.new("Mat_GF_Cream")
    bs_c = m_cream.node_tree.nodes.get('Principled BSDF')
    bs_c.inputs['Base Color'].default_value = (0.97, 0.94, 0.86, 1.0)
    bs_c.inputs['Roughness'].default_value = 0.28

    m_eye = bpy.data.materials.new("Mat_GF_Eye")
    bs_e = m_eye.node_tree.nodes.get('Principled BSDF')
    bs_e.inputs['Base Color'].default_value = (0.015, 0.015, 0.02, 1.0)
    bs_e.inputs['Roughness'].default_value = 0.04

    # 1. Plump Chubby Egg Body
    bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=28, radius=0.42, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = "Body"
    body.scale = (0.95, 1.20, 1.15)
    bpy.ops.object.transform_apply(scale=True)

    bpy.context.view_layer.objects.active = body
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(body.data)
    for v in bm.verts:
        y = v.co.y
        z = v.co.z
        if y < 0:
            taper = max(0.24, 1.0 - (abs(y) / 0.50) * 0.75)
            v.co.x *= taper
            v.co.z *= (taper * 0.85 + 0.15)
        if z < 0 and y > -0.15:
            v.co.z *= 1.16
        if y > 0.24:
            v.co.y *= 0.94
    bmesh.update_edit_mesh(body.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    set_smooth(body)
    body.data.materials.append(m_red)
    set_parent(body, root)

    # 2. Smooth Cream Underbelly & Chin
    bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=20, radius=0.34, location=(0, 0, 0))
    belly = bpy.context.active_object
    belly.name = "Belly_Cream"
    belly.scale = (0.88, 1.06, 0.76)
    bpy.ops.object.transform_apply(scale=True)
    set_smooth(belly)
    belly.data.materials.append(m_cream)
    set_parent(belly, body, local_loc=(0, 0.10, -0.18))

    # 3. Pouty Trumpet Lips
    bpy.ops.mesh.primitive_torus_add(
        align='WORLD', location=(0, 0.42, -0.06),
        rotation=(math.radians(85), 0, 0),
        major_radius=0.060, minor_radius=0.024,
        major_segments=22, minor_segments=14
    )
    lips = bpy.context.active_object
    lips.scale = (1.1, 0.85, 0.9)
    bpy.ops.object.transform_apply(scale=True)
    set_smooth(lips)
    lips.data.materials.append(m_red)
    set_parent(lips, body)

    # 4. Glossy Bead Eyes
    for is_left in [True, False]:
        sign = 1.0 if is_left else -1.0
        bpy.ops.mesh.primitive_uv_sphere_add(segments=22, ring_count=18, radius=0.070, location=(0, 0, 0))
        eye = bpy.context.active_object
        set_smooth(eye)
        eye.data.materials.append(m_eye)
        set_parent(eye, body, local_loc=(sign * 0.30, 0.24, 0.12))

    # 5. Fluted Dorsal Fan Crest
    mesh_df = bpy.data.meshes.new("GF_Dorsal_Mesh")
    obj_df = bpy.data.objects.new("Dorsal_Fin", mesh_df)
    bpy.context.scene.collection.objects.link(obj_df)
    bm_df = bmesh.new()
    df_pts = [
        (0,  0.16, 0.40),
        (0,  0.02, 0.62),
        (0, -0.16, 0.55),
        (0, -0.32, 0.38),
        (0, -0.12, 0.38)
    ]
    verts_df = [bm_df.verts.new(p) for p in df_pts]
    bm_df.faces.new(verts_df)
    bm_df.to_mesh(mesh_df)
    bm_df.free()
    sol_df = obj_df.modifiers.new("Solidify", 'SOLIDIFY')
    sol_df.thickness = 0.022
    set_smooth(obj_df)
    obj_df.data.materials.append(m_red)
    set_parent(obj_df, body)

    # 6. Paddle Pectoral Fins (Pair)
    for is_left in [True, False]:
        sign = 1.0 if is_left else -1.0
        mesh_p = bpy.data.meshes.new(f"GF_Pectoral_{'L' if is_left else 'R'}")
        obj_p = bpy.data.objects.new(f"GF_Pectoral_{'L' if is_left else 'R'}", mesh_p)
        bpy.context.scene.collection.objects.link(obj_p)
        bm_p = bmesh.new()
        p_pts = [
            (0.0, 0.0, 0.0),
            (sign * 0.14, -0.04, -0.03),
            (sign * 0.24, -0.14, -0.04),
            (sign * 0.22, -0.22, -0.02),
            (sign * 0.08, -0.16,  0.00)
        ]
        verts_p = [bm_p.verts.new(p) for p in p_pts]
        bm_p.faces.new(verts_p)
        bm_p.to_mesh(mesh_p)
        bm_p.free()
        sol_p = obj_p.modifiers.new("Solidify", 'SOLIDIFY')
        sol_p.thickness = 0.018
        set_smooth(obj_p)
        obj_p.data.materials.append(m_red)
        set_parent(obj_p, body, local_loc=(sign * 0.26, 0.12, -0.14),
                   local_rot=(math.radians(15), sign * math.radians(-28), sign * math.radians(-14)))

    # 7. Billowing Ruffled Pleated Fantail (Seamless Connection at Y = -0.42)
    tail_group = bpy.data.objects.new("Tail", None)
    tail_group.location = (0, -0.42, 0.02)
    bpy.context.scene.collection.objects.link(tail_group)
    set_parent(tail_group, body)

    mesh_tail = bpy.data.meshes.new("Fantail_Mesh")
    obj_tail = bpy.data.objects.new("Caudal_Fantail", mesh_tail)
    bpy.context.scene.collection.objects.link(obj_tail)

    bm_t = bmesh.new()
    t_ribs = 32
    inner_v = []
    mid_v = []
    outer_v = []

    for i in range(t_ribs + 1):
        u = i / float(t_ribs)
        ang = math.radians(-78 + u * 156)
        len_mid = 0.42 + math.sin(u * math.pi) * 0.18
        len_out = 0.72 + math.sin(u * math.pi) * 0.32

        wave_mid = math.sin(u * math.pi * 8.0) * 0.065 * math.sin(u * math.pi)
        wave_out = math.sin(u * math.pi * 8.0) * 0.110 * math.sin(u * math.pi)

        # Starts at Y=0.02 to overlap seamlessly with body
        y_in  = 0.02 - math.cos(ang) * 0.08
        z_in  = math.sin(ang) * 0.10
        y_m   = -math.cos(ang) * len_mid - 0.08
        z_m   =  math.sin(ang) * len_mid * 1.15
        y_out = -math.cos(ang) * len_out - 0.14
        z_out =  math.sin(ang) * len_out * 1.30

        vi  = bm_t.verts.new((0, y_in, z_in))
        vm  = bm_t.verts.new((wave_mid, y_m, z_m))
        vout= bm_t.verts.new((wave_out, y_out, z_out))

        inner_v.append(vi)
        mid_v.append(vm)
        outer_v.append(vout)

    bm_t.verts.ensure_lookup_table()
    for i in range(t_ribs):
        bm_t.faces.new([inner_v[i], inner_v[i+1], mid_v[i+1], mid_v[i]])
        bm_t.faces.new([mid_v[i], mid_v[i+1], outer_v[i+1], outer_v[i]])

    bm_t.to_mesh(mesh_tail)
    bm_t.free()

    sol_t = obj_tail.modifiers.new("Solidify", 'SOLIDIFY')
    sol_t.thickness = 0.024
    sub_t = obj_tail.modifiers.new("Subsurf", 'SUBSURF')
    sub_t.levels = 2
    set_smooth(obj_tail)
    obj_tail.data.materials.append(m_red)
    set_parent(obj_tail, tail_group, local_loc=(0, 0, 0))

    return root

# =========================================================================
# STUDIO LIGHTING & RENDERING (Calibrated Watts)
# =========================================================================
def setup_studio_lighting(bg_color=(0.94, 0.94, 0.95, 1.0)):
    l_key = bpy.data.lights.new('Key', 'AREA')
    l_key.energy = 55
    l_key.size = 2.5
    obj_k = bpy.data.objects.new('Key', l_key)
    obj_k.location = (-2.0, 1.8, 2.5)
    bpy.context.scene.collection.objects.link(obj_k)

    l_fill = bpy.data.lights.new('Fill', 'AREA')
    l_fill.energy = 25
    l_fill.size = 3.0
    obj_f = bpy.data.objects.new('Fill', l_fill)
    obj_f.location = (2.5, 1.2, 1.8)
    bpy.context.scene.collection.objects.link(obj_f)

    l_rim = bpy.data.lights.new('Rim', 'AREA')
    l_rim.energy = 35
    l_rim.size = 2.2
    obj_r = bpy.data.objects.new('Rim', l_rim)
    obj_r.location = (0.2, -2.6, 2.2)
    bpy.context.scene.collection.objects.link(obj_r)

    world = bpy.data.worlds.new("Studio")
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = bg_color
        bg.inputs['Strength'].default_value = 0.85
    bpy.context.scene.world = world

def render_hero_koi_portrait():
    clear_scene()
    setup_color_management(bpy.context.scene)
    build_koi_model("kohaku", spine_curve=0.08)
    setup_studio_lighting(bg_color=(0.93, 0.93, 0.94, 1.0))

    cam_data = bpy.data.cameras.new('Cam')
    cam_data.lens = 55
    cam_obj = bpy.data.objects.new('Cam', cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = (-2.2, 2.2, 1.4)

    target = bpy.data.objects.new('Target', None)
    target.location = (0, -0.05, 0.02)
    bpy.context.scene.collection.objects.link(target)

    c = cam_obj.constraints.new('TRACK_TO')
    c.target = target
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'

    out_img = os.path.join(RENDER_DIR, "hero_koi_render.png")
    scene = bpy.context.scene
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.filepath = out_img
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Koi Portrait to: {out_img}")

    out_glb = os.path.join(OUTPUT_DIR, "chibi_koi.glb")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', use_selection=True, export_yup=True)
    print(f"Exported clean Chibi Koi to: {out_glb}")

def render_hero_goldfish():
    clear_scene()
    setup_color_management(bpy.context.scene)
    build_goldfish_model()
    setup_studio_lighting(bg_color=(0.88, 0.80, 0.70, 1.0))

    cam_data = bpy.data.cameras.new('Cam')
    cam_data.lens = 48
    cam_obj = bpy.data.objects.new('Cam', cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = (-2.6, 2.0, 0.85)

    target = bpy.data.objects.new('Target', None)
    target.location = (0, -0.15, 0.10)
    bpy.context.scene.collection.objects.link(target)

    c = cam_obj.constraints.new('TRACK_TO')
    c.target = target
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'

    out_img = os.path.join(RENDER_DIR, "hero_goldfish_render.png")
    scene = bpy.context.scene
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.filepath = out_img
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Goldfish to: {out_img}")

    out_glb = os.path.join(OUTPUT_DIR, "chibi_goldfish.glb")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', use_selection=True, export_yup=True)
    print(f"Exported clean Goldfish to: {out_glb}")

def render_topdown_pond_school():
    """
    Renders an authentic overhead top-down view of all 7 Nishikigoi varieties
    swimming across deep black water, matching Reference Image 2 in vertical portrait framing!
    """
    clear_scene()
    setup_color_management(bpy.context.scene)

    # 7 distinct varieties gracefully choreographed in a vertical stream (matching Reference 2):
    # (variety, (px, py, pz), rot_z_deg, spine_curve, scale)
    school_configs = [
        # 1. Top Center: Tancho Showa swimming straight down
        ("tancho_showa",   ( 0.08,  2.10,  0.0), 180,  0.06, 1.05),
        # 2. Upper Left: Asagi curving gracefully from top-left
        ("asagi",          (-0.82,  1.35,  0.0), 155, -0.15, 0.98),
        # 3. Mid Left: S-Curve Kohaku
        ("kohaku",         (-0.65,  0.30,  0.0), 165, -0.18, 1.05),
        # 4. Center: Inazuma 4-spot Kohaku
        ("inazuma_kohaku", ( 0.00, -0.25,  0.0), 175,  0.08, 1.02),
        # 5. Upper Right: Ki Matsuba turning inward
        ("matsuba",        ( 0.80,  0.80,  0.0), 205,  0.14, 0.96),
        # 6. Lower Left: Shiro Bekko swimming down-right
        ("bekko",          (-0.75, -1.30,  0.0), 148, -0.12, 0.98),
        # 7. Lower Right: Yamabuki Ogon swimming up towards the school!
        ("ogon",           ( 0.45, -1.50,  0.0), -25, -0.16, 1.04),
    ]

    for v_name, loc, rot_deg, s_curve, s_factor in school_configs:
        k_root = build_koi_model(v_name, spine_curve=s_curve)
        k_root.location = loc
        k_root.rotation_euler = (0, 0, math.radians(rot_deg))
        k_root.scale = (s_factor, s_factor, s_factor)

    # Deep midnight water background
    setup_studio_lighting(bg_color=(0.012, 0.014, 0.018, 1.0))

    # Overhead camera in portrait orientation (aspect ratio 9:16)
    cam_data = bpy.data.cameras.new('PondCam')
    cam_data.lens = 42
    cam_obj = bpy.data.objects.new('PondCam', cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = (0.0, 0.35, 7.8)
    cam_obj.rotation_euler = (0, 0, 0)

    out_img = os.path.join(RENDER_DIR, "hero_koi_topdown_school.png")
    scene = bpy.context.scene
    # High resolution portrait canvas matching Reference 2
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1600
    scene.render.filepath = out_img
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Top-down Pond School to: {out_img}")

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(RENDER_DIR, exist_ok=True)
    render_hero_koi_portrait()
    render_hero_goldfish()
    render_topdown_pond_school()
