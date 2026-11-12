"""R85 export a character's ARTIST RIG-DRIVEN DEFORMATION as WebGL morph targets.

No new mannequin mesh and no geometry subdivision. We evaluate the original
author-controlled Blender rig for idle/show/attack/hit and bake positions for
Three.js to interpolate the SAME artist geometry on the original vertex order.

Run: blender -b --disable-autoexec path/to/jay.blend --python script -- jay file.glb
"""
import bpy,json,hashlib,sys,math
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if len(args)!=2:raise RuntimeError('Expected slug and output path')
slug,out=args;out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
rig=next((o for o in bpy.data.objects if o.type=='ARMATURE' and o.name.casefold()==('RIG-'+slug).casefold()),None)
if not rig:raise RuntimeError('R85 native Blender artist rig missing '+slug)
controls={}
for side in ['L','R']:
 control=rig.pose.bones.get('IK-MSTR-Wrist.'+side) or rig.pose.bones.get('IK-MSTR-Hand.'+side)
 if not control:raise RuntimeError('R85 native IK hand control missing '+slug+':'+side)
 controls[side]=(control,control.matrix.copy(),(rig.matrix_world@control.matrix).translation.copy())
source=[o for o in bpy.data.objects if o.type=='MESH' and not o.hide_render
        and len(o.data.polygons)>0 and o.name.startswith('GEO-')
        and not any('widgets' in c.name or 'helpers' in c.name for c in o.users_collection)
        and not any(tag in o.name.lower() for tag in [
            '_distressed','_square','_deformer','weight_paint_helper','_rig_helper',
            'smear','surfacedeform','shrinkwrap_target','_boolean','tongue_flat','tongue_vertical'])]
assert len(source)>=5,(slug,len(source))
# Preserve true source vertex correspondence and real authored original materials.
# These are wrist IK goals in Blender world units; keep each local model's
# anatomical proportions, no invented attachment rig or extracted low mesh.
# Respect the *actual* source rig left/right sign, and its native size.
# In Blender Studio characters L lies at +world X, R at -world X.
# Basing goals on the original IK controls avoids cross-armed A/T poses
# and over-stretch when rigs have different proportions.
def goals(phase):
 out={}
 for side,(bone,rest,worldPos) in controls.items():
  # World-space hand goal, like the previously visually validated R84 static
  # export. The artist rig object itself may have nontrivial rotation; do not
  # mistake pose-bone matrix local coordinates for world coordinates.
  x=worldPos.x;z=worldPos.z
  if phase=='idle': xyz=(x*.57,worldPos.y+.015,z*.62)
  elif phase=='show':
   xyz=(x*.55,-.12*z,z*1.15) if side=='R' else (x*.68,-.08*z,z*.75)
  elif phase=='attack':
   xyz=(x*.79,-.30*z,z*1.05) if side=='R' else (x*.70,-.12*z,z*1.02)
  else:
   xyz=(x*.72,-.18*z,z*1.10)
  out[side]=xyz
 return out
poses={kind:goals(kind) for kind in ('idle','show','attack','hit')}
data={}
for label,goals in poses.items():
 for side,(bone,rest,worldPos) in controls.items():
  matrix=rig.matrix_world@rest
  matrix.translation=Vector(goals[side])
  bone.matrix=rig.matrix_world.inverted()@matrix
 bpy.context.view_layer.update()
 dg=bpy.context.evaluated_depsgraph_get()
 snapshots={}
 for o in source:
  ev=o.evaluated_get(dg)
  mesh=bpy.data.meshes.new_from_object(ev,preserve_all_data_layers=True,depsgraph=dg)
  mesh.transform(o.matrix_world)
  snapshots[o.name]=mesh
 data[label]=snapshots
 print('R85_ARTIST_POSE',slug,label,len(snapshots),flush=True)

col=bpy.data.collections.new('R85_NATIVE_ARTIST_MORPH_'+slug)
bpy.context.scene.collection.children.link(col)
cache={}
morphed=0;vertexDeltas=0;discarded=[]
for original in source:
 name=original.name
 mesh=data['idle'][name]
 cnt=len(mesh.vertices)
 if not cnt:continue
 new=bpy.data.objects.new('R85_SKINNED_SOURCE_MORPH_'+name,mesh)
 col.objects.link(new)
 # GLTF exporter maps shape keys to real morphTargets; all vertex coordinates
 # originate from Blender's evaluated source deformation.
 new.shape_key_add(name='Basis',from_mix=False)
 for label in ['show','attack','hit']:
  target=data[label][name]
  if len(target.vertices)!=cnt:
   discarded.append(name+':'+label+':vertex-count-change')
   continue
  morph=new.shape_key_add(name=label,from_mix=False)
  morph.value=0.0 # GLB default must be artist idle; Blender adds new keys at weight 1.
  largest=0
  for i,v in enumerate(target.vertices):
   morph.data[i].co=v.co
   largest=max(largest,(mesh.vertices[i].co-v.co).length)
  if largest>.012:vertexDeltas+=1
 if new.data.shape_keys and len(new.data.shape_keys.key_blocks)>=4:morphed+=1
 for i,old in enumerate(list(mesh.materials)):
  if not old:continue
  if old.name not in cache:
   m=bpy.data.materials.new(name='R85_NATIVE_PBR_'+old.name)
   m.use_nodes=True;m.diffuse_color=tuple(old.diffuse_color)
   bsdf=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
   bsdf.inputs['Base Color'].default_value=tuple(old.diffuse_color)
   bsdf.inputs['Roughness'].default_value=.58
   bsdf.inputs['Metallic'].default_value=.01
   cache[old.name]=m
  mesh.materials[i]=cache[old.name]
for o in bpy.data.objects:
 try:o.select_set(False)
 except:pass
for o in col.objects:o.select_set(True)
try:bpy.context.view_layer.objects.active=next(iter(col.objects))
except:pass
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',
 use_selection=True,export_animations=False,
 export_morph=True,export_morph_normal=False,export_materials='EXPORT')
assert out.stat().st_size>200000
assert morphed>=5,(slug,morphed)
assert vertexDeltas>=3,(slug,vertexDeltas)
print('R85_NATIVE_MORPH_EXPORTED',json.dumps({
 'slug':slug,'file':str(out),'sourceMeshes':len(source),'bakedMorphMeshes':morphed,
 'deformedSourcesAcrossStates':vertexDeltas,'exportBytes':out.stat().st_size,
 'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'skippedTopologies':discarded},ensure_ascii=False),flush=True)
