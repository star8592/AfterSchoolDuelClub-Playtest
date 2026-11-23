import bpy,math,json,pathlib
ROOT=pathlib.Path('/home/master/projects/after-school-duel-r220-actors-20261121/r45-duel/qa/r220-character-audition')
cases=['jay-teen-duel-v06-school.glb','jay-teen-duel-v07-elbow-inward.glb']
windows={'Duel_DrawCard':(7,28),'Duel_ThrowCard':(6,29),
 'Duel_Recoil':(5,27),'Duel_Victory':(7,31)}
results={}
for file in cases:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets'/file))
 arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
 arm.animation_data.action=None
 tracks=arm.animation_data.nla_tracks
 model={}
 for name,(start,end) in windows.items():
  for tr in tracks:tr.mute=tr.name!=name
  tr=next(t for t in tracks if t.name==name)
  series=[]
  for frame in range(start,end+1):
   bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
   row={'frame':frame}
   for side in ['Right','Left']:
    sh=arm.matrix_world @ arm.pose.bones[side+'Arm'].head
    el=arm.matrix_world @ arm.pose.bones[side+'ForeArm'].head
    wrist=arm.matrix_world @ arm.pose.bones[side+'Hand'].head
    v1=el-sh;v2=wrist-el
    inward=(wrist.x-el.x)* (1 if side=='Right' else -1)
    row[side+'WristInsideElbowM']=round(inward,4)
    row[side+'WristForwardFromShoulderM']=round(sh.y-wrist.y,4)
    row[side+'ElbowAngleDeg']=round(math.degrees(v1.angle(v2)),2)
    row[side+'WristWorldXYZ']=[round(x,4) for x in wrist]
    foot=arm.matrix_world @ arm.pose.bones[side+'Foot'].head
    row[side+'FootWorldXYZ']=[round(x,4) for x in foot]
   series.append(row)
  stats={}
  for side in ['Right','Left']:
   ins=[x[side+'WristInsideElbowM'] for x in series]
   fwd=[x[side+'WristForwardFromShoulderM'] for x in series]
   ang=[x[side+'ElbowAngleDeg'] for x in series]
   stats[side]={'minimumInwardM':min(ins),'countOutsideByMoreThan2cm':sum(x<-.02 for x in ins),
     'minimumForwardM':min(fwd),'angleMin':min(ang),'angleMax':max(ang)}
  model[name]={'frames':series,'stats':stats}
  print('R226_FULL_ACTION_AUDIT',file,name,stats)
 results[file]=model
target=results[cases[1]]
for name,scene in target.items():
 for side in ['Right','Left']:
  stat=scene['stats'][side]
  assert stat['minimumInwardM']>=-.015,(name,side,'OUTWARD_BEND',stat)
  assert stat['minimumForwardM']>.115,(name,side,'BACKWARD_REACH',stat)
  assert stat['angleMin']>=23 and stat['angleMax']<=125,(name,side,'BEND_ANGLE',stat)
out=ROOT/'evidence/r226-full-24fps-joint-kinematics-old-vs-new.json'
out.write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n')
print('R226_EXPORTED_GLB_ACTUAL_JOINT_AXIS_PASS',out)
