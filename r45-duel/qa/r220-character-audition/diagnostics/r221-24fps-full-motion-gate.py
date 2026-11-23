import bpy,json,pathlib
ROOT=pathlib.Path('/home/master/projects/after-school-duel-r220-actors-20261121/r45-duel/qa/r220-character-audition')
clips=['Duel_DrawCard','Duel_ThrowCard','Duel_Recoil','Duel_Victory','Duel_Idle_LookAround']
report={}
for filename in ['jay-teen-duel-v01.glb','jay-teen-duel-v02-forward.glb']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets'/filename))
 arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
 arm.animation_data.action=None
 tracks=arm.animation_data.nla_tracks
 this={}
 for name in clips:
  for t in tracks:t.mute=t.name!=name
  t=next(x for x in tracks if x.name==name)
  results=[]
  for frame in range(1,int(t.strips[0].frame_end)+1):
   bpy.context.scene.frame_set(frame)
   bpy.context.view_layer.update()
   row={}
   for side in ['Right','Left']:
    sh=arm.matrix_world @ arm.pose.bones[side+'Arm'].head
    el=arm.matrix_world @ arm.pose.bones[side+'ForeArm'].head
    ha=arm.matrix_world @ arm.pose.bones[side+'Hand'].head
    row[side+'WristM']=round(sh.y-ha.y,4)
    row[side+'ElbowM']=round(sh.y-el.y,4)
   results.append(row)
  keys=results[0].keys()
  s={k:{'min':round(min(x[k] for x in results),4),'max':round(max(x[k] for x in results),4),
    'framesBehind10cm':sum(x[k] < -0.1 for x in results),
    'sampleCount':len(results)} for k in keys}
  this[name]=s
  print('R221_SWEEP',filename,name, s)
 report[filename]=this
p=ROOT/'evidence/r221-blender-true-24fps-forward-sweep.json'
p.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
new=report['jay-teen-duel-v02-forward.glb']
for name in ['Duel_DrawCard','Duel_ThrowCard','Duel_Recoil','Duel_Victory']:
 for side in ['Right','Left']:
  assert new[name][side+'WristM']['framesBehind10cm']==0,(name,side,new[name][side+'WristM'])
  assert new[name][side+'ElbowM']['framesBehind10cm']==0,(name,side,new[name][side+'ElbowM'])
print('R221_FULL_24FPS_SWEEP_PASS_no arm chain behind by 10cm in draw/throw/hit/celebrate',p)
