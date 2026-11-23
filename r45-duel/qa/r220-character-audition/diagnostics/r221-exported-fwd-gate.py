import bpy,pathlib,json
root=pathlib.Path('/home/master/projects/after-school-duel-r220-actors-20261121/r45-duel/qa/r220-character-audition')
for file in ['jay-teen-duel-v01.glb','jay-teen-duel-v02-forward.glb']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(root/'assets'/file))
 arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
 arm.animation_data.action=None
 for tr in arm.animation_data.nla_tracks:tr.mute=True
 print('R221_IMPORT',file,'tracks',[(t.name,[(s.name,round(s.frame_start,2),round(s.frame_end,2)) for s in t.strips]) for t in arm.animation_data.nla_tracks], 'action',arm.animation_data.action.name if arm.animation_data.action else None)
 for trackname,f in [('Duel_DrawCard',17),('Duel_ThrowCard',20),('Duel_Recoil',8),('Duel_Victory',16),('Duel_Idle_LookAround',83)]:
  for t in arm.animation_data.nla_tracks:t.mute=t.name!=trackname
  bpy.context.scene.frame_set(f);bpy.context.view_layer.update()
  def distance(side):
   sh=arm.matrix_world @ arm.pose.bones[side+'Arm'].head
   el=arm.matrix_world @ arm.pose.bones[side+'ForeArm'].head
   wr=arm.matrix_world @ arm.pose.bones[side+'Hand'].head
   return [round(sh.y-wr.y,4),round(sh.y-el.y,4),round(wr.z-sh.z,4)]
  print('R221_EXPORT_POSE',file,trackname,f,'right wrist elbow up',distance('Right'),'left wrist elbow up',distance('Left'))
