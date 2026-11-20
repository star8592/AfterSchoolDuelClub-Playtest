import bpy,math,pathlib,struct,json
from mathutils import Euler
ROOT=pathlib.Path('/home/master/projects/after-school-duel-r220-actors-20261121/r45-duel/qa/r220-character-audition')
ROOT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path('/mnt/disk2/projects/WealthTown3D/web-v10-optimized/assets/teen_desktop.glb')
OUT=ROOT/'assets/jay-teen-duel-v01.glb'
BLEND=ROOT/'source/jay-teen-duel-v01.blend'
OUT.parent.mkdir(exist_ok=True)
BLEND.parent.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SRC))
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
p=arm.pose.bones
for bone in p:bone.rotation_mode='QUATERNION'
scene=bpy.context.scene;scene.render.fps=24
arm.animation_data_create()
original_nla=[t.name for t in arm.animation_data.nla_tracks]
for track in arm.animation_data.nla_tracks:track.mute=True
NAMES=['Hips','Spine','Spine01','Spine02','neck','Head',
'LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder',
'RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot',
'RightUpLeg','RightLeg','RightFoot']
def pose(rots):
 for name in NAMES:
  if name in p:
   p[name].rotation_quaternion=Euler(tuple(math.radians(x) for x in rots.get(name,(0,0,0))),'XYZ').to_quaternion()
   p[name].location=(0,0,0)
def build(name,frames):
 action=bpy.data.actions.new(name);arm.animation_data.action=action
 for frame,rotations in frames:
  scene.frame_set(frame);pose(rotations)
  for bn in NAMES:
   if bn in p:p[bn].keyframe_insert(data_path='rotation_quaternion',frame=frame,group=bn)
 arm.animation_data.action=None
 track=arm.animation_data.nla_tracks.new();track.name=name
 strip=track.strips.new(name,1,action)
 if action.slots:strip.action_slot=action.slots[0]
 track.mute=False
 print('AUTHORED',name,len(frames),'key poses')
# Every clip returns to neutral; full chain: grounded legs, hips, torso,
# both shoulders/elbows/hands, and head. Non-glowing physical comedy acting.
zero={}
drawA={'Hips':(2,0,7),'Spine':(2,0,-9),'Spine01':(2,0,-7),
'Head':(0,-6,4),'LeftArm':(-22,8,17),'LeftForeArm':(-48,0,18),
'RightArm':(-11,0,-8),'RightForeArm':(-18,1,-11),
'LeftUpLeg':(-8,0,0),'RightUpLeg':(7,0,0),
'LeftLeg':(13,0,0),'RightLeg':(6,0,0)}
drawB={'Hips':(4,0,-9),'Spine':(-5,0,-15),'Spine01':(-3,0,-12),
'Head':(-3,-11,4),'LeftArm':(-34,-12,14),'LeftForeArm':(-62,3,24),
'RightArm':(-40,-6,-18),'RightForeArm':(-38,-4,-16),
'RightHand':(9,0,-12),'LeftUpLeg':(-16,0,0),'RightUpLeg':(14,0,0),
'LeftLeg':(24,0,0),'RightLeg':(13,0,0)}
build('Duel_DrawCard',[(1,zero),(8,drawA),(17,drawB),(25,drawB),(35,zero)])
throwA={'Hips':(7,0,-12),'Spine':(0,0,-20),'Spine01':(0,0,-13),
'Head':(-4,0,11),'RightArm':(-51,-13,-19),'RightForeArm':(-80,3,-4),
'LeftArm':(-18,0,16),'LeftForeArm':(-48,0,11),
'LeftUpLeg':(-19,0,0),'RightUpLeg':(20,0,0),
'LeftLeg':(30,0,0),'RightLeg':(8,0,0)}
throwB={'Hips':(-3,0,10),'Spine':(-7,0,24),'Spine01':(-7,0,16),
'Head':(-6,0,-16),'RightArm':(-104,-15,-31),'RightForeArm':(-30,0,-8),
'RightHand':(-11,0,-9),'LeftArm':(-38,0,13),'LeftForeArm':(-27,0,16),
'LeftUpLeg':(-8,0,0),'RightUpLeg':(22,0,0),
'LeftLeg':(14,0,0),'RightLeg':(20,0,0)}
throwC={'Hips':(-2,0,4),'Spine':(-5,0,9),'RightArm':(-84,0,-12),
'RightForeArm':(-28,0,-6),'LeftArm':(-20,0,6),
'LeftUpLeg':(-5,0,0),'RightUpLeg':(7,0,0)}
build('Duel_ThrowCard',[(1,zero),(9,throwA),(14,throwA),
(20,throwB),(25,throwC),(38,zero)])
recoil={'Hips':(9,0,-7),'Spine':(17,0,13),'Spine01':(11,0,11),
'Head':(14,0,-6),'LeftArm':(-58,0,14),'LeftForeArm':(-44,0,11),
'RightArm':(-65,0,-18),'RightForeArm':(-49,0,-18),
'LeftUpLeg':(18,0,0),'RightUpLeg':(-12,0,0),
'LeftLeg':(27,0,0),'RightLeg':(17,0,0)}
guard={'Hips':(3,0,-3),'Spine':(6,0,5),'Head':(1,0,-4),
'LeftArm':(-45,0,19),'LeftForeArm':(-50,0,12),
'RightArm':(-46,0,-22),'RightForeArm':(-47,0,-7),
'LeftUpLeg':(8,0,0),'RightUpLeg':(-5,0,0),'LeftLeg':(12,0,0)}
build('Duel_Recoil',[(1,zero),(5,recoil),(12,recoil),
(20,guard),(31,zero)])
cheerA={'Hips':(-7,0,3),'Spine':(-8,0,-7),'Spine01':(-5,0,-6),
'Head':(-11,0,5),'LeftArm':(-105,0,10),'LeftForeArm':(-25,0,7),
'RightArm':(-99,0,-8),'RightForeArm':(-23,0,-10),
'LeftUpLeg':(-18,0,0),'RightUpLeg':(-18,0,0),
'LeftLeg':(20,0,0),'RightLeg':(20,0,0)}
cheerB={'Hips':(2,0,-7),'Spine':(7,0,9),
'Head':(3,0,-8),'LeftArm':(-67,0,14),'LeftForeArm':(-33,0,8),
'RightArm':(-71,0,-16),'RightForeArm':(-32,0,-9),
'LeftUpLeg':(20,0,0),'RightUpLeg':(-8,0,0),
'LeftLeg':(17,0,0),'RightLeg':(7,0,0)}
build('Duel_Victory',[(1,zero),(9,cheerA),(18,cheerA),(29,cheerB),(42,zero)])
# The default standstill should no longer look like a stiff statue.
# Native skeletal idle is low-frequency, asynchronous across torso/head/arms/legs,
# always moving through recognizable weight-shift and scanning poses.
idleLeft={'Hips':(0,0,3),'Spine':(0,0,-4),'Spine01':(0,0,-3),
 'neck':(0,0,7),'Head':(0,0,9),'LeftArm':(-7,1,4),'RightArm':(-3,0,-3),
 'LeftForeArm':(-5,0,2),'RightForeArm':(-4,0,-2),
 'LeftUpLeg':(2,0,0),'RightUpLeg':(-4,0,0),
 'LeftLeg':(3,0,0),'RightLeg':(5,0,0)}
idleRight={'Hips':(0,0,-4),'Spine':(2,0,5),'Spine01':(1,0,5),
 'neck':(0,0,-7),'Head':(-2,0,-12),
 'LeftArm':(-3,0,3),'RightArm':(-11,0,-5),
 'LeftForeArm':(-3,0,0),'RightForeArm':(-12,0,5),
 'LeftUpLeg':(-5,0,0),'RightUpLeg':(4,0,0),
 'LeftLeg':(7,0,0),'RightLeg':(2,0,0)}
idleSurprise={'Hips':(1,0,0),'Spine':(-3,0,-2),'Spine01':(-2,0,0),
 'neck':(-4,0,1),'Head':(-5,0,0),
 'RightArm':(-9,-3,-7),'RightForeArm':(-22,0,7),
 'LeftArm':(-5,0,3),'LeftForeArm':(-7,0,3),
 'LeftUpLeg':(-3,0,0),'RightUpLeg':(2,0,0)}
build('Duel_Idle_LookAround',[(1,zero),(18,idleLeft),(37,idleLeft),
 (61,zero),(83,idleRight),(105,idleRight),(122,idleSurprise),
 (144,zero)])

for track in arm.animation_data.nla_tracks:track.mute=False
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
 if obj.type in ('ARMATURE','MESH'):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',
 use_selection=True,export_animation_mode='NLA_TRACKS',export_animations=True)
raw=OUT.read_bytes();n=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+n])
names={a.get('name') for a in j.get('animations',[])}
required={'Idle_Breathe','run','walk','Duel_DrawCard','Duel_ThrowCard','Duel_Recoil','Duel_Victory','Duel_Idle_LookAround'}
assert required<=names,sorted(required-names)
for a in j['animations']:
 if a['name'].startswith('Duel_'):
  channels=a['channels'];paths=[c['target']['path'] for c in channels]
  assert paths.count('rotation')>=16,(a['name'],paths.count('rotation'))
  print('BLENDER_DUEL_ACTION',a['name'],'rotation_channels',paths.count('rotation'),'total',len(channels))
assert len(j.get('skins',[]))==1 and len(j['skins'][0]['joints'])==24
print('R220_BOY_REAL_AUTHORED_ACTIONS_OK','size',len(raw),'actions',sorted(names),'original_nla',original_nla)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
