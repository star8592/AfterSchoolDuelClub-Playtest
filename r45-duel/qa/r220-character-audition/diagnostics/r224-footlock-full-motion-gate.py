import bpy,pathlib,json
ROOT=pathlib.Path("/home/master/projects/after-school-duel-r220-actors-20261121/r45-duel/qa/r220-character-audition")
from collections import defaultdict
result={}
for fn in ["jay-teen-duel-v04-onehand.glb","jay-teen-duel-v05-footlock.glb"]:
 bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/"assets"/fn))
 arm=next(o for o in bpy.context.scene.objects if o.type=="ARMATURE")
 arm.animation_data.action=None
 clips={}
 for name in ["Duel_DrawCard","Duel_ThrowCard","Duel_Recoil","Duel_Victory","Duel_Idle_LookAround"]:
  for tr in arm.animation_data.nla_tracks:tr.mute=tr.name!=name
  tr=next(t for t in arm.animation_data.nla_tracks if t.name==name)
  frames=[]
  for f in range(1,int(tr.strips[0].frame_end)+1):
   bpy.context.scene.frame_set(f);bpy.context.view_layer.update()
   values={}
   for side in ["Right","Left"]:
    sh=arm.matrix_world @ arm.pose.bones[side+"Arm"].head
    el=arm.matrix_world @ arm.pose.bones[side+"ForeArm"].head
    hand=arm.matrix_world @ arm.pose.bones[side+"Hand"].head
    foot=arm.matrix_world @ arm.pose.bones[side+"Foot"].head
    values[side+"HandForwardM"]=round(sh.y-hand.y,4)
    values[side+"ElbowForwardM"]=round(sh.y-el.y,4)
    values[side+"HandHeightM"]=round(hand.z,4)
    values[side+"FootHeightM"]=round(foot.z,4)
    values[side+"FootWorldXYZ"]=[round(a,4) for a in foot]
   values["frame"]=f
   frames.append(values)
  clips[name]=frames
  maxSlide=max(max(q[k] for q in frames)-min(q[k] for q in frames) for k in ["RightFootHeightM","LeftFootHeightM"])
  right=[q["RightHandForwardM"] for q in frames]
  left=[q["LeftHandForwardM"] for q in frames]
  horizontal=max(max(q[side+"FootWorldXYZ"][i] for q in frames)-min(q[side+"FootWorldXYZ"][i] for q in frames) for side in ["Right","Left"] for i in [0,1])
  print("R224_MOTION",fn,name,"Rforward",round(min(right),3),round(max(right),3),"Lforward",round(min(left),3),round(max(left),3),"maxFootVertical",round(maxSlide,3),"maxFootHorizontal",round(horizontal,3))
  if fn.endswith("v05-footlock.glb"):
   assert horizontal<0.12,(name,"sliding foot",horizontal)
 result[fn]=clips
out=ROOT/"evidence/r224-blender-v04-v05-full-motion-kinematics.json"
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
for name,rows in result["jay-teen-duel-v05-footlock.glb"].items():
 if name=="Duel_Idle_LookAround":continue
 for side in ["Left","Right"]:
  assert min(row[side+"HandForwardM"] for row in rows)>-0.04, (name,side,"backwards arms")
  feet=[q[side+"FootHeightM"] for q in rows]
  assert max(feet)-min(feet)<0.25,(name,side,"unrealistic foot lift",max(feet)-min(feet))
print("R224_FULL_MOTION_FORWARD_FOOTLOCK_PASS",out)
