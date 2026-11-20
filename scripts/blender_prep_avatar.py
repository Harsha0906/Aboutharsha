# Blender script: turns the Tripo avatar into a web-ready GLB.
# Usage (Windows):  blender --background avatar.blend --python scripts/blender_prep_avatar.py -- out.glb
#  - joins all meshes, decimates to ~120k triangles, downsizes textures to 2048px
#  - centers the model on X/Y, puts the bottom at Z=0, scales it to 2 units tall, faces +Y -> glTF +Z
import bpy, sys, math

out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "me.glb"
TARGET_TRIS = 120_000

bpy.ops.object.select_all(action="DESELECT")
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
if not meshes:
    raise SystemExit("no mesh found in the .blend")
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
print(f"[prep] triangles before: {tris}")
if tris > TARGET_TRIS:
    mod = obj.modifiers.new("decimate", "DECIMATE")
    mod.ratio = TARGET_TRIS / tris
    mod.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=mod.name)
tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
print(f"[prep] triangles after: {tris}")

bpy.ops.object.shade_smooth()

# center + normalize size
from mathutils import Vector
xs = [ (obj.matrix_world @ v.co) for v in obj.data.vertices ]
mn = Vector((min(p.x for p in xs), min(p.y for p in xs), min(p.z for p in xs)))
mx = Vector((max(p.x for p in xs), max(p.y for p in xs), max(p.z for p in xs)))
size = mx - mn
s = 2.0 / max(size.z, 1e-6)
for v in obj.data.vertices:
    p = obj.matrix_world @ v.co
    v.co = Vector(((p.x - (mn.x + mx.x) / 2) * s, (p.y - (mn.y + mx.y) / 2) * s, (p.z - mn.z) * s))
obj.matrix_world.identity()
print(f"[prep] size (m): {size.x*s:.3f} x {size.y*s:.3f} x {size.z*s:.3f}")

# downsize textures
for img in bpy.data.images:
    if img.size[0] > 2048:
        img.scale(2048, 2048)
        print(f"[prep] resized {img.name} to 2048")

bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    use_selection=False,
    export_apply=True,
    export_image_format="JPEG",
    export_jpeg_quality=88,
    export_yup=True,
)
print(f"[prep] wrote {out}")
