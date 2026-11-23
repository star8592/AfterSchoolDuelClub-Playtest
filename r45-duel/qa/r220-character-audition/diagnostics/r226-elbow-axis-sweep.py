import bpy,math,ast,pathlib
from mathutils import Euler,Vector
root=pathlib.Path('/home/master/projects/after-school-duel-r220-actors-20261121/r45-duel/qa/r220-character-audition')
code=(root/'author_jay_v06_school.py').read_text()
names=['draw_reach','draw_lift','draw_present','throw_ready','throw_release','throw_follow','recoil_contact','victory_burst']
t=ast.parse(code);poses={}
for q in t.body:
 if isinstance(q,ast.Assign) and len(q.targets)==1 and isinstance(q.targets[0],ast.Name) and q.targets[0].id in names:
  poses[q.targets[0].id]=ast.literal_eval(q.value)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'assets/jay-teen-duel-v06-school.glb'))
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
arm.animation_data.action=None
for tr in arm.animation_data.nla_tracks:tr.mute=True
for bone in arm.pose.bones:bone.rotation_mode='QUATERNION'
def load_pose(pose):
 for bone in arm.pose.bones:bone.rotation_quaternion=(1,0,0,0)
 for name,xyz in pose.items():
  if name in arm.pose.bones:
   arm.pose.bones[name].rotation_quaternion=Euler(tuple(math.radians(x) for x in xyz),'XYZ').to_quaternion()
 bpy.context.view_layer.update()
def loc(name):return arm.matrix_world @ arm.pose.bones[name].head
def probe(label,side='Right'):
 shoulder=loc(side+'Arm');elbow=loc(side+'ForeArm');wrist=loc(side+'Hand')
 upper=elbow-shoulder;fore=wrist-elbow
 print('R226_ARM_AXIS',label,side,'wristMinusElbowX',round(wrist.x-elbow.x,3),
  'wristForwardFromShoulder',round(shoulder.y-wrist.y,3),
  'elbowX',round(elbow.x,3),'wristX',round(wrist.x,3),
  'wristHeight',round(wrist.z,3),
  'humerusForearmAngle',round(math.degrees(upper.angle(fore)),2),
  'crossXZ',round(upper.cross(fore).z,3),'crossXY',round(upper.cross(fore).x,3))
for name in names:
 pose=poses[name]
 load_pose(pose);probe(name)
 for side in ['Right','Left']:
  bn=side+'ForeArm'
  if bn not in pose:continue
  a,b,c=pose[bn]
  for axis in ['X','Y','Z']:
   for angle in [-60,-35,0,35,60]:
    mod=dict(pose)
    mod[bn]=({'X':(a+angle,b,c),'Y':(a,b+angle,c),'Z':(a,b,c+angle)})[axis]
    load_pose(mod);probe(name+'_'+side+'Forearm_'+axis+str(angle),side)
