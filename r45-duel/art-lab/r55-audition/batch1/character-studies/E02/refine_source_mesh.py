"""R57 controlled non-destructive paper airplane GLB mesh/material polish.

This does not synthesize a new character, change its silhouette, or pretend to
be Pixal3D output. Refines the user's prior GLB with mesh bevel/solidification.
"""
import bpy, json, hashlib, math
from pathlib import Path
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parents[2]/'models/E02-paper-plane.glb'
DEST=HERE/'E02-PaperPlane-R57-Refined-STUDY.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
records=[]
for obj in list(bpy.data.objects):
 if obj.type!='MESH':continue
 n=obj.name.lower()
 base_faces=len(obj.data.polygons)
 if 'wing' in n and ('folded outer wing' in n or 'wing return lip' in n):
  # Retain all authored plane vertices and folded faces, finish open boundaries
  # as actual layered paper stock rather than infinitely thin single-surface polygons.
  solid=obj.modifiers.new('R57 actual paper caliper 2.2cm','SOLIDIFY')
  solid.thickness=.022
  solid.offset=-.50
  solid.use_even_offset=True
  bevel=obj.modifiers.new('R57 subtle softened exposed cut edge','BEVEL')
  bevel.width=.010
  bevel.segments=3
  bevel.limit_method='ANGLE'
  bevel.angle_limit=.1
 elif 'double ridge fuselage' in n:
  sol=obj.modifiers.new('R57 folded ridge thickness','SOLIDIFY')
  sol.thickness=.028
  sol.offset=-.25
  bevel=obj.modifiers.new('R57 ridge gentle finish','BEVEL')
  bevel.width=.009
  bevel.segments=3
  bevel.limit_method='ANGLE'
 elif 'eyeball' in n:
  sub=obj.modifiers.new('R57 eye surface softening','SUBSURF')
  sub.levels=1;sub.render_levels=1
 if any(x in n for x in ['eyeball','iris','catchlight','smile','crease','tip piping','spring ring']):
  for poly in obj.data.polygons:poly.use_smooth=True
 records.append({'name':obj.name,'source_faces':base_faces,'modifiers':[m.type for m in obj.modifiers]})
# The original source materials are real PBR materials, tuned rather than discarded.
for mat in bpy.data.materials:
 if not mat.use_nodes: continue
 p=mat.node_tree.nodes.get('Principled BSDF')
 if not p: continue
 name=mat.name.lower()
 if 'paper' in name or 'laminate' in name:
  p.inputs['Metallic'].default_value=.0
  p.inputs['Roughness'].default_value=.76 if 'laminate' in name else .88
  p.inputs['Coat Weight'].default_value=.04
  p.inputs['Coat Roughness'].default_value=.55
 elif 'ink' in name:
  p.inputs['Metallic'].default_value=.05
  p.inputs['Roughness'].default_value=.66
 elif 'coral' in name:
  p.inputs['Metallic'].default_value=0
  p.inputs['Roughness'].default_value=.64
 elif 'eyes' in name or 'iris' in name:
  p.inputs['Metallic'].default_value=0
  p.inputs['Roughness'].default_value=.22
 elif 'catchlight' in name:
  p.inputs['Metallic'].default_value=0
  p.inputs['Roughness'].default_value=.13
# Apply the hard mesh refinement so the generated GLB genuinely contains real
# geometry and does not depend on Blender modifiers at game runtime.
for obj in list(bpy.data.objects):
 if obj.type!='MESH':continue
 bpy.context.view_layer.objects.active=obj
 for mod in list(obj.modifiers):
  bpy.ops.object.modifier_apply(modifier=mod.name)
DEST.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(DEST),export_format='GLB',
 export_animations=True,export_skins=True,export_yup=True,
 export_materials='EXPORT',export_image_format='AUTO')
info={
 'source':str(SOURCE),'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
 'output':str(DEST),'output_sha256':hashlib.sha256(DEST.read_bytes()).hexdigest(),
 'kind':'authored paper wing geometry non-generative mesh refinement',
 'refinements':records,
 'source_faces':sum(x['source_faces'] for x in records),
 'output_faces_blender':sum(len(o.data.polygons) for o in bpy.data.objects if o.type=='MESH'),
 'no_image_to_3d_generated':True,
 'model_status':'MESH_POLISH_TECHNICAL_STUDY',
 'original_art_fidelity_verified':False,
 'production_approved':False
}
DEST.with_suffix('.provenance.json').write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n')
print('R57_E02_REFINED_EXPORT',json.dumps({k:info[k] for k in ['source_faces','output_faces_blender','output_sha256','model_status','production_approved']}))
