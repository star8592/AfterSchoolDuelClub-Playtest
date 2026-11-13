"""Export genuine render-bound CC-BY Blender Studio skin, never a fake/low-poly proxy.
Offline source is opened with --disable-autoexec.
Invocation:
 blender -b --disable-autoexec /path/to/character.blend --python r119-export-live-skin.py -- phil /path/to/out.glb
Do not modify author .blend, and never enable this over the production R97 asset without QA.
"""
import bpy,sys,json,hashlib,traceback
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
slug,out=args;out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
log=out.with_suffix('.proof.json')
record={'slug':slug,'source':bpy.data.filepath,'output':str(out),'status':'STARTED'}
exclude=('_distressed','_square','_deformer','weight_paint_helper','_rig_helper',
 'smear','surfacedeform','shrinkwrap_target','_boolean','tongue_flat','tongue_vertical')
try:
 rig=next((o for o in bpy.data.objects if o.type=='ARMATURE' and o.name.lower()=='rig-'+slug.lower()),None)
 assert rig,('NO_ARTIST_RIG',slug)
 geo=[]
 for o in bpy.data.objects:
  if o.type!='MESH' or o.hide_render or not o.name.startswith('GEO-') or not o.data.polygons:continue
  if any(tag in o.name.lower() for tag in exclude):continue
  if any('widgets' in c.name.lower() or 'helpers' in c.name.lower() for c in o.users_collection):continue
  if not any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers):continue
  if not o.vertex_groups or not any(v.groups for v in o.data.vertices):continue
  geo.append(o)
 assert len(geo)>=10,('INSUFFICIENT_SKINNED_SOURCE_MESHES',slug,len(geo))
 # Using a native pose preserves source CloudRig's actual shape, not manual
 # fabricated T-pose adjustments. Original wrist controller acts on the
 # original deform skeleton and is NOT exported as a substitute mesh.
 controls={}
 for side,sgn in (('L',1),('R',-1)):
  pb=rig.pose.bones.get('IK-MSTR-Wrist.'+side)
  if pb:
   matrix=(rig.matrix_world@pb.matrix).copy()
   controls[side]=tuple(matrix.translation)
   # This restrained, reviewed neutral pose was used by R84 auditions.
   matrix.translation=Vector((sgn*.39,.02,.58))
   pb.matrix=rig.matrix_world.inverted()@matrix
 # R119.1: physical default rest arms. The author CloudRig opened in a
 # presentation bind pose, so the visible mesh could be a T/A pose even if
 # 7/7 glTF joints were valid! Use EXACTLY the artist FK shoulder lowering
 # tested in R97 original Blender exporter, with polarity for Snow and Rain.
 # Silence IK constraints that would counteract the FK shoulder controls.
 for side in ('L','R'):
  for name in ('ORG-UpperArm','ORG-Forearm','ORG-Wrist','UpperArm','Forearm','Wrist'):
   bone=rig.pose.bones.get(name+'.'+side)
   if bone:
    for constraint in bone.constraints:
     if 'ik' in constraint.name.lower():constraint.mute=True
 polarity=-1 if slug.lower() in ('snow','rain') else 1
 for side,angle in [('L',polarity*1.42),('R',-polarity*1.42)]:
  bone=rig.pose.bones.get('FK-UpperArm.'+side)
  if bone:
   bone.rotation_mode='XYZ'
   bone.rotation_euler.z=angle
 # Original R97 authored neutral legs and real shoe floor remain untouched.
 bpy.context.view_layer.update()
 # Remove non-render deform modifiers that require unsupported Blender graph,
 # retaining true UVs/materials and the SOURCE armature + its vertex weights.
 # Never apply the ARMATURE modifier or freeze to a static mesh.
 removed={}
 for o in geo:
  removed[o.name]=[]
  for m in list(o.modifiers):
   if m.type=='SUBSURF':
    m.levels=min(1,m.levels)
    m.render_levels=min(1,m.render_levels)
   if m.type in ('CORRECTIVE_SMOOTH','LATTICE','SHRINKWRAP','NODES',
                 'PARTICLE_SYSTEM','MASK','VERTEX_WEIGHT_MIX','NORMAL_EDIT'):
    removed[o.name].append(m.type)
    m.show_viewport=False
    m.show_render=False
 # R131 experimental TRUE SOURCE BIND-POSE BAKE (original file never saved).
 # Evaluate original author FK arm pose using the SOURCE armature. Then
 # bake that pose as the new rest and carry the evaluated skin vertices into
 # mesh Basis, preserving named vertex groups, bone identities and materials.
 for o in geo:
  for m in o.modifiers:
   if m.type=='SUBSURF':
    m.show_viewport=False;m.show_render=False
 bpy.context.view_layer.update()
 deps=bpy.context.evaluated_depsgraph_get()
 pose_mesh={}
 for o in geo:
  evaluated=o.evaluated_get(deps)
  me=evaluated.to_mesh(preserve_all_data_layers=False,depsgraph=deps)
  if not me or len(me.vertices)!=len(o.data.vertices):
   raise RuntimeError('R131_SOURCE_TOPOLOGY_MISMATCH '+o.name+' source='+str(len(o.data.vertices))+
     ' evaluated='+str(len(me.vertices) if me else -1))
  coords=[v.co.copy() for v in me.vertices]
  pose_mesh[o.name]=coords
  evaluated.to_mesh_clear()
 record['posedVerticesSampled']=sum(map(len,pose_mesh.values()))
 # Pose-as-rest operates only on the *isolated loaded* in-memory source.
 for o in bpy.context.selected_objects:
  o.select_set(False)
 rig.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.object.mode_set(mode='POSE')
 bpy.ops.pose.armature_apply(selected=False)
 bpy.ops.object.mode_set(mode='OBJECT')
 for o in geo:
  coords=pose_mesh[o.name]
  if o.data.shape_keys:
   # Keep all authored shape deltas in local mesh space while shifting the
   # basis to the new baked SOURCE skin rest.
   basis=o.data.shape_keys.key_blocks[0]
   delta=[co-basis.data[i].co for i,co in enumerate(coords)]
   for block in o.data.shape_keys.key_blocks:
    for i,v in enumerate(block.data):
     v.co+=delta[i]
  else:
   for i,v in enumerate(o.data.vertices):
    v.co=coords[i]
 o.data.update()
 bpy.context.view_layer.update()
 record['r131PoseRestBaked']=True
 # Only active actor rig and legitimate original armature-driven GEO meshes.
 for o in bpy.data.objects:
  try:o.select_set(False)
  except Exception:pass
 rig.hide_set(False)
 rig.hide_viewport=False
 rig.select_set(True)
 for o in geo:
  o.hide_set(False)
  o.hide_viewport=False
  o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.context.view_layer.update()
 # Bypasses unused ghost rig scenes by exporting only source + source rig.
 bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',
  use_selection=True,
  export_skins=True,export_all_influences=False,
  export_def_bones=True,
  export_animations=False,export_apply=False,
  export_normals=True,export_texcoords=True,
  export_materials='EXPORT',
  export_image_format='AUTO')
 assert out.exists() and out.stat().st_size>250000,('MISSING_EXPORTED_SKIN',out)
 # Inspect GLB's *default rendered scene*, not merely its skin array.
 data=out.read_bytes()
 assert data[:4]==b'glTF' and int.from_bytes(data[8:12],'little')==len(data)
 ln=int.from_bytes(data[12:16],'little')
 doc=json.loads(data[20:20+ln])
 nodes=doc.get('nodes',[])
 roots=doc['scenes'][doc.get('scene',0)].get('nodes',[])
 reachable=set()
 def walk(i):
  if i in reachable:return
  reachable.add(i)
  for j in nodes[i].get('children',[]):walk(j)
 for root in roots:walk(root)
 active=[i for i in reachable if 'mesh' in nodes[i]]
 skin=[i for i in active if 'skin' in nodes[i]]
 assert len(skin)>=9,('VISIBLE_SKINS_NOT_EXPORTED',slug,len(skin),len(active))
 meshes=doc['meshes']
 vertex_attributes=[meshes[nodes[i]['mesh']]['primitives'][0].get('attributes',{}) for i in skin]
 has_weight=sum('JOINTS_0' in attrs and 'WEIGHTS_0' in attrs for attrs in vertex_attributes)
 assert has_weight>=9,('SKIN_MISSING_JOINT_WEIGHT_BUFFERS',slug,has_weight)
 sk=[doc['skins'][nodes[i]['skin']]['joints'] for i in skin]
 assert max(map(len,sk))>=60,('SKIN_INSUFFICIENT_REAL_JOINTS',slug)
 required_names={'DEF-Chest','DEF-Head','DEF-Neck','DEF-Shoulder.L','DEF-Shoulder.R',
  'DEF-UpperArm1.L','DEF-UpperArm1.R','DEF-Forearm1.L','DEF-Forearm1.R'}
 export_names={n.get('name','') for n in nodes}
 norm=lambda t:''.join(c for c in t.lower() if c.isalnum())
 missing=[x for x in required_names if norm(x) not in {norm(y) for y in export_names}]
 # Some source rigs have slight semantic differences; record instead of
 # inventing renamed joints. Runtime must verify before enabling actor.
 record.update(status='EXPORTED',bytes=len(data),
  sha256=hashlib.sha256(data).hexdigest(),
  sourceMeshes=len(geo),visibleMeshes=len(active),visibleSkinnedMeshes=len(skin),
  skinWeightBuffers=has_weight,rigBones=len(rig.data.bones),exportedJoints=max(map(len,sk)),
  missingTargetBones=missing,sourceIKWristPose=controls,
  disabledGraphModifiers=sum(map(len,removed.values())))
except Exception as e:
 record.update(status='FAILED',error=str(e),traceback=traceback.format_exc()[-2400:])
finally:
 log.write_text(json.dumps(record,ensure_ascii=False,indent=2))
 print('R119_REAL_SKIN_EXPORT',json.dumps({k:v for k,v in record.items() if k!='traceback'},ensure_ascii=False),flush=True)
 if record['status']!='EXPORTED':raise SystemExit(2)
