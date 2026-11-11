"""Lossless-intent Blender re-export from audited MIT character source.
No smoothing, sculpting, geometry subdivision or refitting: art base audition.
"""
import bpy,sys,json,hashlib
from pathlib import Path
src=Path(sys.argv[-2]);dst=Path(sys.argv[-1]);dst.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(src))
rigs=[x for x in bpy.context.scene.objects if x.type=='ARMATURE']
meshes=[x for x in bpy.context.scene.objects if x.type=='MESH']
assert len(rigs)==1 and len(meshes)>=1
orig_tris=sum(len(p.vertices)-2 for x in meshes for p in x.data.polygons)
bpy.ops.export_scene.gltf(filepath=str(dst),export_format='GLB',export_skins=True,export_animations=True,
 export_yup=True,export_cameras=False,export_lights=False)
assert dst.stat().st_size>100000
print('R74_CANDIDATE_WEB_EXPORT',json.dumps({'source':src.name,'output':dst.name,'tris':orig_tris,'bones':len(rigs[0].data.bones),'meshes':len(meshes),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest()}))
