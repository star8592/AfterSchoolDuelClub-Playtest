"""Blender 5.2 audit of real game GLBs: rigging, normals, texture and topology.
A read-only QA script; no destructive smoothing/subdivision or model overwrite.
Usage: blender -b --python r70-blender-asset-audit.py -- /path/to/glb ...
"""
import bpy,json,sys,os,bmesh
from pathlib import Path
from mathutils import Vector
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if not argv:raise SystemExit('Please specify actual GLB paths')
results=[]
for filepath in argv:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=filepath)
    objects=list(bpy.context.scene.objects)
    meshes=[o for o in objects if o.type=='MESH']
    rigs=[o for o in objects if o.type=='ARMATURE']
    mat_ids={m.name for o in meshes for m in o.data.materials if m}
    image_sizes=sorted(set((im.size[0],im.size[1]) for im in bpy.data.images if im.has_data))
    faces=sum(len(o.data.polygons) for o in meshes)
    tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
    non_manifold=0;zero_weight=0;skinned=[]
    for obj in meshes:
        if obj.vertex_groups:
            deform=[v for v in obj.data.vertices if not v.groups]
            zero_weight+=len(deform)
            skinned.append(obj.name)
        bm=bmesh.new();bm.from_mesh(obj.data)
        non_manifold+=sum(1 for e in bm.edges if not e.is_manifold)
        bm.free()
    actions=[a.name for a in bpy.data.actions if a.users>0]
    report={
      'file':Path(filepath).name,'mesh_count':len(meshes),'triangles':tris,
      'polygon_faces':faces,'armatures':len(rigs),
      'deform_bones':sum(sum(1 for b in r.data.bones if b.use_deform) for r in rigs),
      'skinned_meshes':len(skinned),'zero_weight_vertices':zero_weight,
      'non_manifold_edges':non_manifold,'materials':len(mat_ids),
      'images_resolutions':image_sizes,'animations':actions,
      'recommendation':('retain skinned source; manual topology and material review' if rigs else 'verify skeleton/animations before game use')
    }
    results.append(report);print('R70_BLENDER_ASSET',json.dumps(report,ensure_ascii=False))
root=Path(__file__).resolve().parent/'evidence/r70';root.mkdir(parents=True,exist_ok=True)
(root/'blender-assets.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
