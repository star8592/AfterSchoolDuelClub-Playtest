import bpy,math,ast,pathlib
from mathutils import Euler
src=pathlib.Path('/mnt/disk2/projects/WealthTown3D/web-v10-optimized/assets/teen_desktop.glb')
code=pathlib.Path('/home/master/projects/after-school-duel-r220-actors-20261121/r45-duel/qa/r220-character-audition/author_jay_v01.py').read_text()
wanted=['drawA','drawB','throwA','throwB','throwC','recoil','guard','cheerA','cheerB','idleLeft','idleRight','idleSurprise']
t=ast.parse(code)
original={}
for node in t.body:
 if isinstance(node,ast.Assign) and len(node.targets)==1 and isinstance(node.targets[0],ast.Name) and node.targets[0].id in wanted:
  original[node.targets[0].id]=ast.literal_eval(node.value)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(src))
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
for track in arm.animation_data.nla_tracks:track.mute=True
arm.animation_data.action=None
for bone in arm.pose.bones:bone.rotation_mode='QUATERNION'
def emit(k,values):
 for b in arm.pose.bones:b.rotation_quaternion=(1,0,0,0)
 for name,rot in values.items():
  if name in arm.pose.bones:
   arm.pose.bones[name].rotation_quaternion=Euler(tuple(math.radians(x) for x in rot),'XYZ').to_quaternion()
 bpy.context.view_layer.update()
 def wr(side):
  shoulder=arm.matrix_world @ arm.pose.bones[side+'Arm'].head
  elbow=arm.matrix_world @ arm.pose.bones[side+'ForeArm'].head
  wrist=arm.matrix_world @ arm.pose.bones[side+'Hand'].head
  return (round(shoulder.y-elbow.y,3),round(shoulder.y-wrist.y,3),round(wrist.z-shoulder.z,3))
 print('POSE_VECTOR',k,'RIGHT',wr('Right'),'LEFT',wr('Left'))
for k,vals in original.items():
 emit('OLD_'+k,vals)
 new={bn:tuple((-v if i==0 else v) for i,v in enumerate(rot)) if bn in ['RightArm','RightForeArm','LeftArm','LeftForeArm'] else rot for bn,rot in vals.items()}
 emit('X_FLIP_'+k,new)
