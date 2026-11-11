"""R84 safe artist mesh extraction from original Blender Studio CC-BY source.
Run with --disable-autoexec; never execute embedded drivers/scripts.
Produces standalone art audition GLBs only, not runtime replacement.
"""
import bpy,sys,json,hashlib
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if len(args) not in (2,3):raise RuntimeError('usage: blender source.blend --python script -- <slug> <output.glb> [relaxed]')
slug,out=args[:2];out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
if len(args)==3 and args[2]=='relaxed':
 # Artist's *real rig* drives the actual source mesh before the static
 # audition snapshot, no fake proxy limbs or post-export lowpoly subdivision.
 from mathutils import Vector
 rig=next((o for o in bpy.data.objects if o.name.lower()==('rig-'+slug).lower()),None)
 if rig is None:raise RuntimeError('source artist rig not found for relaxed audition '+slug)
 for letter,side in [('L',1),('R',-1)]:
  pb=rig.pose.bones.get('IK-MSTR-Wrist.'+letter)
  if not pb:raise RuntimeError('IK wrist control missing in '+slug+' '+letter)
  world=rig.matrix_world@pb.matrix
  world.translation=Vector((side*.39,.02,.58))
  pb.matrix=rig.matrix_world.inverted()@world
 bpy.context.view_layer.update()
 print('R84_FILM_NATIVE_RIG_RELAXED',slug)

originals=[]
for obj in bpy.data.objects:
 if obj.type!='MESH' or obj.hide_render or len(obj.data.polygons)<1 or not obj.name.startswith('GEO-'):
  continue
 if any('widgets' in c.name or 'helpers' in c.name for c in obj.users_collection):continue
 if any(x in obj.name for x in ['_distressed','_square','_deformer','weight_paint_helper','_rig_helper']):
  continue
 originals.append(obj)
assert len(originals)>=10,('not enough artist geometry',slug,len(originals))
depsgraph=bpy.context.evaluated_depsgraph_get()
coll=bpy.data.collections.new('R84_STAGED_ARTIST_HIGH_FIDELITY_'+slug)
bpy.context.scene.collection.children.link(coll)
cache={}
for obj in originals:
 eval_obj=obj.evaluated_get(depsgraph)
 mesh=bpy.data.meshes.new_from_object(eval_obj,preserve_all_data_layers=True,depsgraph=depsgraph)
 mesh.transform(obj.matrix_world)
 newobj=bpy.data.objects.new('R84_AUDITION_GEO_'+obj.name,mesh)
 coll.objects.link(newobj)
 for i,material in enumerate(list(mesh.materials)):
  if not material:continue
  if material.name not in cache:
   newmaterial=bpy.data.materials.new(name='R84_WEB_PBR_'+material.name)
   newmaterial.use_nodes=True
   newmaterial.diffuse_color=tuple(material.diffuse_color)
   principled=next(n for n in newmaterial.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
   color=list(material.diffuse_color)
   # Source materials specify finished artistic albedo swatches in Diffuse.
   # A few very light, cool highlights stay visible under stadium spotlights.
   principled.inputs['Base Color'].default_value=color
   principled.inputs['Roughness'].default_value=.57
   principled.inputs['Metallic'].default_value=.02
   cache[material.name]=newmaterial
  mesh.materials[i]=cache[material.name]
# Remove old rigs/geometry from the export selection but retain their raw source.
for obj in bpy.data.objects:
 try:obj.select_set(False)
 except Exception:pass
for obj in coll.objects:
 obj.hide_viewport=False
 obj.select_set(True)
try:bpy.context.view_layer.objects.active=next(iter(coll.objects))
except Exception:pass
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,
  export_animations=False,export_apply=True,
  export_normals=True,export_texcoords=True,export_materials='EXPORT')
assert out.stat().st_size>200000,(slug,out.stat().st_size)
print('R84_FILM_EXPORTED',json.dumps(dict(slug=slug,file=str(out),
 artistMeshes=len(originals),materials=len(cache),
 sha256=hashlib.sha256(out.read_bytes()).hexdigest(),bytes=out.stat().st_size),ensure_ascii=False))
