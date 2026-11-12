import bpy,sys,json,math,traceback
from pathlib import Path
from mathutils import Euler
args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2:raise SystemExit('usage: -- <source.blend> <output.glb>')
source=Path(args[0]);out=Path(args[1]);who=out.stem
is_rain='rain' in source.name.lower()
is_rex='rex' in source.name.lower()
is_snow='snow' in source.name.lower()
STEP_ANGLE={'ellie':.285,'phil':.205,'snow':.26,'jay':.305,'victoria':.225,'rain':.29,'rex':.19}
step=next(v for k,v in STEP_ANGLE.items() if k in source.stem.lower())
reverse_polarity=is_rain or is_snow
rot_axis='Z' # Natural arm drop uses world-visible elevation axis on Rex too
control_stem='FK-Upperarm' if is_rain else 'FK-UpperArm'
proof={'source':str(source),'output':str(out),'status':'failed'}
try:
 bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False)
 source_scene=bpy.context.scene
 rig=next(x for x in bpy.data.objects if x.type=='ARMATURE' and x.name.startswith('RIG-'))
 for n in ('ORG-UpperArm.L','ORG-UpperArm.R','ORG-Forearm.L','ORG-Forearm.R','ORG-Wrist.L','ORG-Wrist.R'):
  bone=rig.pose.bones.get(n)
  if bone:
   for c in bone.constraints:
    if 'IK' in c.name:c.mute=True
 if is_rain:
  for stem in ('FK-Upperarm','FK-Forearm','FK-Hand'):
   for side in ('.L','.R'):
    bone=rig.pose.bones.get(stem+side)
    if bone:
     for c in bone.constraints:
      if 'ik' in c.name.lower():c.mute=True
 if is_snow:
  for stem in ('UpperArm','Forearm','Wrist'):
   for side in ('.L','.R'):
    bone=rig.pose.bones.get(stem+side)
    if bone:
     for c in bone.constraints:
      if 'IK' in c.name:c.mute=True
 # R91: disable leg IK overrides so thigh and foot FK controls actually deform
 # original skinned mesh; previous shoulder/wrist handling is unchanged.
 if is_rain:
  for stem in ('FK-Thigh','FK-Shin','FK-Foot'):
   for side in ('.L','.R'):
    bone=rig.pose.bones.get(stem+side)
    if bone:
     for c in bone.constraints:
      if c.type=='COPY_TRANSFORMS' and (c.subtarget.startswith('IK-') or 'ik_leg' in c.name.lower()):c.mute=True
 else:
  for stem in ('ORG-Thigh','ORG-Foot','Thigh','Foot'):
   for side in ('.L','.R'):
    bone=rig.pose.bones.get(stem+side)
    if bone:
     for c in bone.constraints:
      if 'IK' in c.name:c.mute=True
 def leg(left_thigh,right_thigh,left_knee=0,right_knee=0):
  # A stable right sole during attack and stable left sole during recoil.
  # Hip-thigh-knee-ankle rotations are baked from source CloudRig, not runtime noise.
  for side,a,k in (('.L',left_thigh,left_knee),('.R',right_thigh,right_knee)):
   thigh=rig.pose.bones.get('FK-Thigh'+side)
   knee=rig.pose.bones.get(('FK-Shin' if is_rain else 'FK-Knee')+side)
   foot=rig.pose.bones.get('FK-Foot'+side)
   assert thigh and knee and foot,('MISSING_FK_CHAIN',source.name,side)
   for bone,angle in ((thigh,a),(knee,k),(foot,-a-k)):
    bone.rotation_mode='XYZ';bone.rotation_euler=Euler((angle,0,0),'XYZ')
 def lean(x=0,z=0):
  spine=rig.pose.bones.get('FK-Spine')
  if not spine:return
  spine.rotation_mode='XYZ';spine.rotation_euler=Euler((x,0,z),'XYZ')
 geo=[o for o in bpy.data.objects if o.type=='MESH' and not o.hide_render and o.name.startswith('GEO-')]
 for o in geo:
  for m in o.modifiers:
   if m.type=='SUBSURF':m.render_levels=min(1,m.render_levels)
 def shoulder(left,right):
  for n,angle in ((control_stem+'.L',left),(control_stem+'.R',right)):
   b=rig.pose.bones[n];b.rotation_mode='XYZ'
   rotation=[0.,0.,0.];rotation['XYZ'.index(rot_axis)]=angle
   b.rotation_euler=Euler(rotation,'XYZ')
 def snap():
  bpy.context.view_layer.update();dep=bpy.context.evaluated_depsgraph_get();res={}
  for o in geo:
   v=o.evaluated_get(dep);m=v.to_mesh(preserve_all_data_layers=True,depsgraph=dep)
   if m and len(m.vertices):res[o.name]=([p.co.copy() for p in m.vertices], len(m.polygons))
   v.to_mesh_clear()
  return res
 # R96 base, arm-only action, reaction, planted single-support fore-step and rear-step.
 # Important: do not double-apply leg motion by embedding it in Strike/Recoil
 # while Step/Retreat is active at the same time.
 sign=-1 if reverse_polarity else 1
 shoulder(sign*1.42,-sign*1.42);leg(0,0);lean();rest=snap()
 shoulder(sign*1.42,sign*.12);leg(0,0);lean();attack=snap()
 shoulder(sign*.72,-sign*.72);leg(0,0);lean();hit=snap()
 shoulder(sign*1.42,-sign*1.42);leg(-step,0,step*.76,0);lean(-.065,.012);lead=snap()
 shoulder(sign*1.42,-sign*1.42);leg(0,step*.82,0,-step*.99);lean(.075,-.008);back=snap()
 # R97 physically authored intermediate stance: lower swinging foot and accept
 # body weight before easing out. Do not blend separate feet simultaneously.
 shoulder(sign*1.42,-sign*1.42);leg(-step*.64,0,step*.14,0);lean(-.042,.009);land=snap()
 shoulder(sign*1.42,-sign*1.42);leg(0,step*.46,0,-step*.34);lean(.051,-.006);brace=snap()
 assert set(rest)==set(attack)==set(hit)==set(lead)==set(back)==set(land)==set(brace)
 # Isolate real shoe vertices by their original local X sign. The support side
 # must remain exactly where it began, in source mesh coordinate space.
 shoe_checks=[]
 for name,(verts,_) in rest.items():
  if not any(v in name.lower() for v in ('shoe','boot','flipper')):continue
  attack_verts=lead[name][0];hit_verts=back[name][0]
  land_verts=land[name][0];brace_verts=brace[name][0]
  # Compare lower third of footwear and exclude accessories, based on rest geometry.
  floor_z=min(v.z for v in verts);ceiling_z=max(v.z for v in verts)
  if ceiling_z-floor_z<.015:continue
  low=floor_z+(ceiling_z-floor_z)*.40
  stationary_right=[(i,v) for i,v in enumerate(verts) if v.x<-.025 and v.z<=low]
  stationary_left=[(i,v) for i,v in enumerate(verts) if v.x>.025 and v.z<=low]
  if len(stationary_right)>10 and len(stationary_left)>10:
   attack_drift=max((attack_verts[i]-v).length for i,v in stationary_right)
   hit_drift=max((hit_verts[i]-v).length for i,v in stationary_left)
   land_drift=max((land_verts[i]-v).length for i,v in stationary_right)
   brace_drift=max((brace_verts[i]-v).length for i,v in stationary_left)
   # Moving shoes should not sink materially below their baseline floor.
   left_min=min(v.z for v in verts if v.x>.025)
   right_min=min(v.z for v in verts if v.x<-.025)
   land_floor=min(v.z for v in land_verts if v.x>.025)-left_min
   brace_floor=min(v.z for v in brace_verts if v.x<-.025)-right_min
   shoe_checks.append({'mesh':name,'attack_support_max':round(attack_drift,6),'hit_support_max':round(hit_drift,6),
    'land_support_max':round(land_drift,6),'brace_support_max':round(brace_drift,6),
    'land_foot_z_delta':round(land_floor,6),'brace_foot_z_delta':round(brace_floor,6),'vertices':len(verts)})
 assert shoe_checks,('NO_DOUBLE_SIDED_FOOTWEAR',who)
 assert max(x['attack_support_max'] for x in shoe_checks)<.035,('ATTACK_FOOT_DRIFT',shoe_checks)
 assert max(x['hit_support_max'] for x in shoe_checks)<.035,('HIT_FOOT_DRIFT',shoe_checks)
 assert max(x['land_support_max'] for x in shoe_checks)<.035,('LAND_SUPPORT_DRIFT',shoe_checks)
 assert max(x['brace_support_max'] for x in shoe_checks)<.035,('BRACE_SUPPORT_DRIFT',shoe_checks)
 assert min(x['land_foot_z_delta'] for x in shoe_checks)>-.045,('LAND_FOOT_BELOW_FLOOR',shoe_checks)
 assert min(x['brace_foot_z_delta'] for x in shoe_checks)>-.045,('BRACE_FOOT_BELOW_FLOOR',shoe_checks)

 scene=bpy.data.scenes.new('R97_'+who+'_MORPH');collection=bpy.data.collections.new('R97_EXPORT');scene.collection.children.link(collection)
 materials={};images={};objs=[];morph_info=[];warnings=[]
 for source_obj in geo:
  coords,polycount=rest.get(source_obj.name,([],0))
  if not coords:continue
  v=source_obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
  # Export topology and material slots from the original rest pose snapshot
  shoulder(sign*1.42,-sign*1.42);leg(0,0);lean()
  bpy.context.view_layer.update()
  v=source_obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
  mesh=bpy.data.meshes.new_from_object(v,preserve_all_data_layers=True,depsgraph=bpy.context.evaluated_depsgraph_get())
  if len(mesh.vertices)!=len(coords):raise RuntimeError('mesh topology mismatch '+source_obj.name)
  for i,co in enumerate(coords):mesh.vertices[i].co=co
  slots=[x.material for x in source_obj.material_slots]
  for j,old in enumerate(slots):
   if not old:continue
   if old.name not in materials:
    mat=bpy.data.materials.new('R97_PBR_'+old.name);mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF');color=tuple(old.diffuse_color)
    if 'skin' in old.name.lower() or 'body' in old.name.lower():color=(.42,.24,.14,1)
    bsdf.inputs['Base Color'].default_value=color;bsdf.inputs['Roughness'].default_value=.72
    if old.use_nodes:
     found=[]
     for node in old.node_tree.nodes:
      if node.type=='TEX_IMAGE' and node.image and node.image.source!='TILED':
       n=(node.image.name+' '+node.image.filepath).lower()
       if any(s in n for s in ('diffuse','eyes.png','eyes_diffuse')) and not any(s in n for s in ('rough','metal','specular','normal','sss','bump')):found.append(node.image)
     if found:
      im=found[0]
      try:
       if im.name not in images:
        try:im.reload()
        except Exception:pass
        copy=im.copy();copy.name='R97_TEX_'+im.name
        w,h=copy.size
        if max(w,h)>1536:
         k=1536/max(w,h);copy.scale(round(w*k),round(h*k))
        copy.pack();images[im.name]=copy
       tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=images[im.name]
       mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
      except Exception as e:warnings.append('tex '+old.name+':'+str(e)[:150])
    materials[old.name]=mat
   if j<len(mesh.materials):mesh.materials[j]=materials[old.name]
   else:mesh.materials.append(materials[old.name])
  obj=bpy.data.objects.new('R97_'+source_obj.name,mesh);collection.objects.link(obj);obj.matrix_world=source_obj.matrix_world.copy();objs.append(obj)
  samples={'Strike':attack[source_obj.name][0],'Recoil':hit[source_obj.name][0],
           'Step':lead[source_obj.name][0],'Retreat':back[source_obj.name][0],
           'Land':land[source_obj.name][0],'Brace':brace[source_obj.name][0]}
  diffs={name:max((v-c).length for c,v in zip(coords,vertices)) for name,vertices in samples.items()}
  if max(diffs.values())>0.0001:
   obj.shape_key_add(name='Basis',from_mix=False)
   for key,vertices in samples.items():
    if diffs[key]<.0001:continue
    block=obj.shape_key_add(name=key,from_mix=False)
    for i,co in enumerate(vertices):block.data[i].co=co
   morph_info.append({'mesh':source_obj.name,'verts':len(coords),
    'max_attack':round(diffs['Strike'],4),'max_hit':round(diffs['Recoil'],4),
    'max_step':round(diffs['Step'],4),'max_retreat':round(diffs['Retreat'],4),
    'max_land':round(diffs['Land'],4),'max_brace':round(diffs['Brace'],4)})
 # Keyframe every shape key with aligned global NLA track names
 bpy.context.window.scene=scene
 for ob in objs:
  if not ob.data.shape_keys:continue
  key=ob.data.shape_keys
  animations={
   'Idle':{'Strike':[(1,0),(16,.10),(31,0)]},
   'Attack':{'Strike':[(1,0),(5,.18),(9,.68),(12,1),(16,.67),(21,.15),(24,0)],
             'Step':[(1,0),(4,.50),(8,1),(11,.65),(13,.15),(15,0),(24,0)],
             'Land':[(1,0),(8,0),(11,.35),(13,.85),(15,1),(18,.67),(21,.23),(24,0)]},
   'Hit':{'Recoil':[(1,0),(4,.40),(9,1),(12,.88),(16,.52),(19,.15),(21,0)],
          'Retreat':[(1,0),(5,.80),(9,1),(12,.65),(14,.15),(16,0),(21,0)],
          'Brace':[(1,0),(9,0),(12,.35),(14,.85),(16,1),(19,.45),(21,0)]}
  }
  for name,channels in animations.items():
   if not any(key.key_blocks.get(target) is not None for target in channels):continue
   for block in key.key_blocks:
    if block.name!='Basis':block.value=0
   for target,frames in channels.items():
    block=key.key_blocks.get(target)
    if block is None:continue
    for frame,value in frames:
     block.value=value;block.keyframe_insert(data_path='value',frame=frame)
   action=key.animation_data.action
   action.name='R97_'+name+'_'+ob.name
   ad=key.animation_data;track=ad.nla_tracks.new();track.name=name
   strip=track.strips.new(name,1,action)
   strip.action_frame_start=1;strip.action_frame_end={'Idle':31,'Attack':24,'Hit':21}[name]
   ad.action=None
  for block in key.key_blocks:
   if block.name!='Basis':block.value=0
 for o in bpy.context.selected_objects:o.select_set(False)
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0]
 scene.frame_set(1)
 bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_merge_animation='NLA_TRACK',export_morph=True,export_morph_animation=True,export_apply=True)
 proof.update(status='EXPORTED',bytes=out.stat().st_size,meshes=len(objs),morph_meshes=morph_info,materials=len(materials),warnings=warnings[:12],axis=rot_axis,rig=rig.name,step_angle=step,rig_foot_chain='FK-Thigh/FK-Knee-or-Shin/FK-Foot',landing_compression=True,planted_foot_metrics=shoe_checks,clip_names=['Idle','Attack','Hit'])
except Exception as e:proof.update(error=str(e),traceback=traceback.format_exc()[-2500:])
Path(str(out)+'.proof.json').write_text(json.dumps(proof,indent=2))
print('R97_EXPORT',json.dumps({k:v for k,v in proof.items() if k!='traceback'},ensure_ascii=False),flush=True)
