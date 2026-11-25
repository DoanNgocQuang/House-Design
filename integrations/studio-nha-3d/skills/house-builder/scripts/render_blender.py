"""Anh phoi canh that (Cycles) tu file .glb cua house_builder. Chay trong Blender:

  blender -b --factory-startup -P render_blender.py -- model.glb render.png --textures DIR [--samples 96] [--size 1600x1000] [--view front]

Thuong goi qua: python3 house_builder.py render <file.glb | layout.json> --out render.png
Vat lieu theo extras cua tung bo phan (category, material) giong trinh xem 3D: texture CC0 o thu muc --textures
(anh mau doi sang xam roi nhan voi mau bo phan, nen mau chu du an chon van dung), troi HDR, mat troi, mat co.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

LOOKS = {  # khoa: material hint hoac category -> (bo texture, met moi lan lap, do nham, kim loai, do noi)
    "wall": ("beige_wall_001", 2.5, 0.92, 0.0, 0.25),
    "floor": ("floor_tiles_06", 1.2, 0.45, 0.0, 0.3),
    "door": ("fine_grained_wood", 1.0, 0.5, 0.0, 0.3),
    "frame": ("fine_grained_wood", 0.6, 0.45, 0.0, 0.2),
    "stairs": ("large_floor_tiles_02", 1.0, 0.6, 0.0, 0.3),
    "roof": ("clay_roof_tiles_02", 2.0, 0.75, 0.0, 1.0),
    "fence": ("grey_plaster_02", 1.5, 0.9, 0.0, 0.4),
    "trim": ("grey_plaster_02", 1.5, 0.85, 0.0, 0.3),
    "column": ("grey_plaster_02", 1.5, 0.8, 0.0, 0.3),
    "garden": ("leafy_grass", 2.0, 1.0, 0.0, 0.6),
    "grass": ("leafy_grass", 2.0, 1.0, 0.0, 0.6),
    "paving": ("large_floor_tiles_02", 1.6, 0.7, 0.0, 0.4),
    "gravel": ("gravel_floor", 1.5, 0.95, 0.0, 0.8),
    "stone": ("large_sandstone_blocks", 1.5, 0.85, 0.0, 0.6),
    "plaster": ("grey_plaster_02", 1.5, 0.9, 0.0, 0.4),
    "wood": ("fine_grained_wood", 1.0, 0.55, 0.0, 0.3),
    "railing": (None, 1.0, 0.35, 0.6, 0.0),
    "soil": (None, 1.0, 1.0, 0.0, 0.0),
    "leaves": (None, 1.0, 0.75, 0.0, 0.0),
    "bark": (None, 1.0, 0.95, 0.0, 0.0),
}


def parse():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("model")
    p.add_argument("out")
    p.add_argument("--textures", required=True)
    p.add_argument("--samples", type=int, default=96)
    p.add_argument("--size", default="1600x1000")
    p.add_argument("--view", default="front", choices=["front", "back"])
    return p.parse_args(argv)


def image(path, color):
    img = bpy.data.images.load(str(path), check_existing=True)
    img.colorspace_settings.name = "sRGB" if color else "Non-Color"
    return img


_mean = {}


def mean_brightness(img):
    """Do sang trung binh cua anh mau, de chuan hoa anh xam ve ~0.92."""
    if img.name not in _mean:
        px = img.pixels[:]
        step = max(4, (len(px) // 4 // 4096) * 4)  # lay mau ~4096 diem cho nhanh
        vals = [0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2] for i in range(0, len(px) - 3, step)]
        _mean[img.name] = (sum(vals) / len(vals)) if vals else 0.5
    return _mean[img.name] or 0.5


_cache = {}


def make_material(key, rgb, textures):
    """Vat lieu Principled theo bo texture; mau bo phan nhan voi anh xam chi tiet."""
    cache_key = (key, tuple(round(c, 3) for c in rgb))
    if cache_key in _cache:
        return _cache[cache_key]
    mat = bpy.data.materials.new(f"{key}-{len(_cache)}")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    color = (*rgb, 1.0)
    if key in ("glass", "water"):
        bsdf.inputs["Base Color"].default_value = (0.85, 0.92, 0.95, 1) if key == "glass" else (0.25, 0.5, 0.6, 1)
        bsdf.inputs["Roughness"].default_value = 0.02
        bsdf.inputs["IOR"].default_value = 1.45 if key == "glass" else 1.33
        bsdf.inputs["Transmission Weight"].default_value = 1.0
        _cache[cache_key] = mat
        return mat
    set_name, tile, rough, metal, bump = LOOKS.get(key, (None, 1.0, 0.8, 0.0, 0.0))
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Base Color"].default_value = color
    diff = Path(textures) / f"{set_name}_diff_1k.jpg" if set_name else None
    if diff and diff.exists():
        coord = nodes.new("ShaderNodeTexCoord")
        mapping = nodes.new("ShaderNodeMapping")
        mapping.inputs["Scale"].default_value = (1 / tile, 1 / tile, 1 / tile)
        links.new(coord.outputs["Object"], mapping.inputs["Vector"])

        def tex(name, color_space):
            node = nodes.new("ShaderNodeTexImage")
            node.image = image(Path(textures) / f"{set_name}_{name}_1k.jpg", color_space)
            node.projection = "BOX"
            node.projection_blend = 0.2
            links.new(mapping.outputs["Vector"], node.inputs["Vector"])
            return node

        d = tex("diff", True)
        gray = nodes.new("ShaderNodeRGBToBW")
        links.new(d.outputs["Color"], gray.inputs["Color"])
        scale = nodes.new("ShaderNodeMath")
        scale.operation = "MULTIPLY"
        scale.inputs[1].default_value = 0.92 / mean_brightness(d.image)
        links.new(gray.outputs["Val"], scale.inputs[0])
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        mix.inputs[6].default_value = color  # A
        links.new(scale.outputs["Value"], mix.inputs[7])  # B
        links.new(mix.outputs[2], bsdf.inputs["Base Color"])
        r = tex("rough", False)
        links.new(r.outputs["Color"], bsdf.inputs["Roughness"])
        n = tex("nor", False)
        nmap = nodes.new("ShaderNodeNormalMap")
        nmap.inputs["Strength"].default_value = max(0.2, bump)
        links.new(n.outputs["Color"], nmap.inputs["Color"])
        links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    elif key in ("leaves", "bark", "soil"):  # khong co anh: van nhieu de khoi tron trong tu nhien hon
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 6.0 if key == "leaves" else 3.0
        ramp = nodes.new("ShaderNodeMix")
        ramp.data_type = "RGBA"
        ramp.inputs[6].default_value = tuple(c * 0.6 for c in rgb) + (1,)
        ramp.inputs[7].default_value = tuple(min(1, c * 1.25) for c in rgb) + (1,)
        links.new(noise.outputs["Fac"], ramp.inputs["Factor"])
        links.new(ramp.outputs[2], bsdf.inputs["Base Color"])
        bump_node = nodes.new("ShaderNodeBump")
        bump_node.inputs["Strength"].default_value = 0.6
        links.new(noise.outputs["Fac"], bump_node.inputs["Height"])
        links.new(bump_node.outputs["Normal"], bsdf.inputs["Normal"])
    _see_through_back(mat)
    _cache[cache_key] = mat
    return mat


def _see_through_back(mat):
    """Mat bi nhin tu phia sau (hai khoi hop chong khit nhau) cho trong suot, de tia toi mat ngoai that thay vi to den."""
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    out = nodes["Material Output"]
    shader = out.inputs["Surface"].links[0].from_socket
    geo = nodes.new("ShaderNodeNewGeometry")
    clear = nodes.new("ShaderNodeBsdfTransparent")
    mix = nodes.new("ShaderNodeMixShader")
    links.new(geo.outputs["Backfacing"], mix.inputs["Fac"])
    links.new(shader, mix.inputs[1])
    links.new(clear.outputs["BSDF"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])


def base_color(obj):
    mat = obj.active_material
    if mat and mat.use_nodes and "Principled BSDF" in mat.node_tree.nodes:
        c = mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value
        return (c[0], c[1], c[2])
    return (0.8, 0.8, 0.8)


def main():
    args = parse()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=args.model)
    textures = Path(args.textures)

    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for obj in meshes:
        holder = obj
        while holder is not None and "category" not in holder.keys():  # extras nam o node cha cua mesh
            holder = holder.parent
        if holder is None:
            continue
        category, hint = holder.get("category"), holder.get("material")
        if category == "furniture":
            continue  # giu vat lieu cua thu vien noi that
        key = "glass" if category == "glass" else ("water" if hint == "water" else (hint or category))
        mat = make_material(key, base_color(obj), textures)
        obj.data.materials.clear()
        obj.data.materials.append(mat)

    # khung canh: mat co, troi HDR, mat troi
    corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
    hi = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
    center, size = (lo + hi) / 2, hi - lo
    bpy.ops.mesh.primitive_plane_add(size=400, location=(center.x, center.y, -0.02))
    ground = bpy.context.active_object
    ground.data.materials.append(make_material("grass", (0.10, 0.20, 0.045), textures))

    world = bpy.data.worlds.new("sky")
    bpy.context.scene.world = world
    world.use_nodes = True
    sky = world.node_tree.nodes.new("ShaderNodeTexEnvironment")
    hdr = textures / "sky_1k.hdr"
    if hdr.exists():
        sky.image = bpy.data.images.load(str(hdr))
        world.node_tree.links.new(sky.outputs["Color"], world.node_tree.nodes["Background"].inputs["Color"])
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0

    sun_data = bpy.data.lights.new("sun", "SUN")
    sun_data.energy = 4.5
    sun_data.angle = math.radians(1.5)
    sun = bpy.data.objects.new("sun", sun_data)
    sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    bpy.context.scene.collection.objects.link(sun)

    # may anh: nhin cheo tu phia truoc ben trai (glTF +Z la mat tien -> Blender -Y)
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 32
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    w, h = (int(x) for x in args.size.split("x"))
    direction = Vector((-0.65, -1.0, 0.3) if args.view == "front" else (0.65, 1.0, 0.3)).normalized()
    radius = size.length / 2
    fov = 2 * math.atan(36 / 2 / cam_data.lens)  # ngang
    vfov = 2 * math.atan(math.tan(fov / 2) * h / w)
    distance = max(radius / math.sin(min(fov, vfov) / 2) * 0.6, size.z / math.tan(vfov / 2) * 1.1)
    target = Vector((center.x, center.y, lo.z + size.z * 0.33))
    cam.location = target + direction * distance
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam_data.clip_end = distance * 20

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = args.samples
    scene.cycles.use_denoising = True
    try:
        scene.cycles.denoiser = "OPENIMAGEDENOISE"
    except TypeError:
        pass
    scene.cycles.max_bounces = 6
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.resolution_percentage = 100
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        scene.view_settings.view_transform = "Filmic"
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(Path(args.out).resolve())
    bpy.ops.render.render(write_still=True)
    print(f"Da render {args.out}")


main()
