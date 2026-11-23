import bpy,math,json
from mathutils import Euler,Vector
fn='/mnt/disk2/projects/WealthTown3D/web-v10-optimized/assets/teen_desktop.glb'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=fn)
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
for track in arm.animation_data.nla_tracks:track.mute=True
arm.animation_data.action=None
for bone in arm.pose.bones:
 bone.rotation_mode='QUATERNION'
 bone.rotation_quaternion=(1,0,0,0)
def xyz(n):
 b=arm.pose.bones[n];return arm.matrix_world @ b.head,arm.matrix_world @ b.tail
def info(k):
 a,b=xyz('RightArm');c,e=xyz('RightForeArm');f,g=xyz('RightHand')
 a2,b2=xyz('LeftArm');c2,e2=xyz('LeftForeArm');f2,g2=xyz('LeftHand')
 return {'label':k,'shoulder':tuple(round(x,3) for x in a),'rightElbow':tuple(round(x,3) for x in c),'rightWrist':tuple(round(x,3) for x in f),'leftElbow':tuple(round(x,3) for x in c2),'leftWrist':tuple(round(x,3) for x in f2),'rightForwardZ':round(f.z-a.z,3),'leftForwardZ':round(f2.z-a2.z,3)}
out=[info('REST')]
for name in ['RightArm','RightForeArm','LeftArm','LeftForeArm']:
 for axis in ['X','Y','Z']:
  for deg in [-90,-60,-30,30,60,90]:
   for b in arm.pose.bones:b.rotation_quaternion=(1,0,0,0)
   v={'X':(deg,0,0),'Y':(0,deg,0),'Z':(0,0,deg)}[axis]
   arm.pose.bones[name].rotation_quaternion=Euler(tuple(math.radians(x) for x in v),'XYZ').to_quaternion()
   bpy.context.view_layer.update()
   out.append(info(f'{name}.{axis}={deg}'))
print('AXIS_DIAG_JSON='+json.dumps(out))
