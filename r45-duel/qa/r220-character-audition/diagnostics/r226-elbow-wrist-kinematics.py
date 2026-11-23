import bpy,math,json
from pathlib import Path
from mathutils import Vector
root=Path('/home/master/projects/after-school-duel-r220-actors-20261121/r45-duel/qa/r220-character-audition')
bpy.ops.import_scene.gltf(filepath=str(root/'assets/jay-teen-duel-v06-school.glb'))
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
arm.animation_data.action=None
tracks=arm.animation_data.nla_tracks
def point(n):return arm.matrix_world @ arm.pose.bones[n].head
def info(stage,frame):
 bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
 for side in ['Right','Left']:
  shoulder=point(side+'Arm');elbow=point(side+'ForeArm');wrist=point(side+'Hand')
  handtip=arm.matrix_world @ arm.pose.bones[side+'Hand'].tail
  upper=elbow-shoulder;lower=wrist-elbow
  eangle=math.degrees(upper.angle(lower))
  cross=upper.cross(lower)
  print('R226_KINEMATIC',stage,frame,side,
   'shoulder',tuple(round(x,3) for x in shoulder),
   'elbow',tuple(round(x,3) for x in elbow),'wrist',tuple(round(x,3) for x in wrist),
   'tip',tuple(round(x,3) for x in handtip),
   'upperYZ',tuple(round(v,3) for v in (upper.y,upper.z)),
   'forearmYZ',tuple(round(v,3) for v in (lower.y,lower.z)),
   'bendDeg',round(eangle,1),'crossX',round(cross.x,4),
   'wristPlane',round((handtip-wrist).angle(lower)*180/math.pi,1))
for stage,frames in [('Duel_DrawCard',[1,7,14,23,28,37]),('Duel_ThrowCard',[1,6,11,18,24,29,41]),('Duel_Recoil',[5,12]),('Duel_Victory',[7,15])]:
 for t in tracks:t.mute=t.name!=stage
 for f in frames:info(stage,f)
