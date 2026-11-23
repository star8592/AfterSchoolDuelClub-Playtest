import bpy,math,pathlib,struct,json
from mathutils import Euler
ROOT=pathlib.Path('/home/master/projects/after-school-duel-r220-actors-20261121/r45-duel/qa/r220-character-audition')
ROOT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path('/mnt/disk2/projects/WealthTown3D/web-v10-optimized/assets/teen_desktop.glb')
OUT=ROOT/'assets/jay-teen-duel-v07-elbow-inward.glb'
BLEND=ROOT/'source/jay-teen-duel-v07-elbow-inward.blend'
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
   a,b,c=rots.get(name,(0,0,0))
   # R222: positive local X is *the measured character-forward direction*
   # on this rig; do not invert any axis or the actor at runtime.
   p[name].rotation_quaternion=Euler(tuple(math.radians(x) for x in (a,b,c)),'XYZ').to_quaternion()
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
# R222 STAGED CHARACTER ACTING: actual joints; no symmetric T-arm.
# R226: world-space shoulder->elbow->wrist anatomical calibration, not merely
# +Z "hand forward". Right forearm is constrained to fold towards body
# center (right wrist.x > elbow.x); left towards body center
# (left wrist.x < elbow.x). Generated from independent Blender axis sweeps.
# Keep joint bend angle in [24,125] and forward reach >0.135m.
# See diagnostics/r226-calibrate-joint-anatomy.py evidence JSON.
# The feet stay planted: body turn is delivered by hips/spine/head;
# no arbitrary root translation or leg-kicking to fake body motion.
zero={}
# DRAW: reach to a card at lower ribs, pick up with the right hand, inspect.
draw_reach={'Hips': (0.0, 0, 0), 'Spine': (3, 0, 1.56), 'Spine01': (5, 0, 4), 'Head': (8, 0, -6), 'neck': (2, 0, -4), 'RightArm': (24, 0, -9), 'RightForeArm': (56, 0, 40), 'RightHand': (0, 0, 9), 'LeftArm': (24, 0, 7), 'LeftForeArm': (19, 0, -62), 'LeftUpLeg': (2, 0, 0), 'RightUpLeg': (-2, 0, 0)}
draw_lift={'Hips': (0.0, 0, 0), 'Spine': (1, 0, 2.12), 'Spine01': (1, 0, 6), 'Head': (-1, 0, -9), 'neck': (0, 0, -3), 'RightArm': (43, 0, -10), 'RightForeArm': (63, 0, 6), 'RightHand': (0, 0, 12), 'LeftArm': (24, 0, 7), 'LeftForeArm': (22, 0, -62), 'LeftUpLeg': (3, 0, 0), 'RightUpLeg': (-1, 0, 0)}
draw_present={'Hips': (0.0, 0, 0), 'Spine': (-1, 0, 3.12), 'Spine01': (-1, 0, 7), 'Head': (-3, 0, -10), 'neck': (-2, 0, -3), 'RightArm': (55, 0, -10), 'RightForeArm': (36, 0, 30), 'RightHand': (0, 0, 9), 'LeftArm': (24, 0, 7), 'LeftForeArm': (23, 0, -62), 'LeftUpLeg': (2, 0, 0), 'RightUpLeg': (-2, 0, 0)}
build('Duel_DrawCard',[
 (1,zero),(7,draw_reach),(14,draw_lift),(23,draw_present),
 (28,draw_present),(37,zero)])
# CAST: wind-up from chest, rotate shoulders in anticipation, then
# straighten the elbow FORWARD while the off-hand stays close to body.
throw_ready={'Hips': (0.0, 0, 0), 'Spine': (1, 0, -17.759999999999998), 'Spine01': (1, 0, -7), 'Head': (-3, 0, 6), 'neck': (0, 0, 3), 'RightArm': (32, 0, -6), 'RightForeArm': (72, 0, -10), 'RightHand': (0, 0, 10), 'LeftArm': (24, 0, 4), 'LeftForeArm': (26, 0, -38), 'LeftUpLeg': (1, 0, 0), 'RightUpLeg': (-2, 0, 0)}
throw_release={'Hips': (0.0, 0, 0), 'Spine': (-2, 0, 19.32), 'Spine01': (-2, 0, 9), 'Head': (-3, 0, -7), 'neck': (1, 0, -3), 'RightArm': (69, 0, -9), 'RightForeArm': (14, 0, 40), 'RightHand': (-6, 0, 4), 'LeftArm': (24, 0, 4), 'LeftForeArm': (18, 0, -76), 'LeftUpLeg': (1, 0, 0), 'RightUpLeg': (-2, 0, 0)}
throw_follow={'Hips': (0.0, 0, 0), 'Spine': (0, 0, 11.879999999999999), 'Spine01': (0, 0, 5), 'Head': (-2, 0, -5), 'RightArm': (39, 0, -6), 'RightForeArm': (48, 0, 34), 'RightHand': (0, 0, 3), 'LeftArm': (24, 0, 4), 'LeftForeArm': (19, 0, -66)}
build('Duel_ThrowCard',[
 (1,draw_present),(6,throw_ready),(11,throw_ready),
 (18,throw_release),(24,throw_follow),(29,draw_reach),(41,zero)])
# HIT: defensive cross-body guard, controlled backward weight shift;
# no full-body theatrical jump or both arms hanging horizontally.
recoil_contact={'Hips': (-0.8999999999999999, 0, 0), 'Spine': (10, 0, 3.44), 'Spine01': (9, 0, -2), 'Head': (11, 0, 3), 'neck': (3, 0, 2), 'RightArm': (36, 0, -12), 'RightForeArm': (61, 0, 24), 'LeftArm': (38, 0, 15), 'LeftForeArm': (58, 0, -16), 'LeftUpLeg': (-4, 0, 0), 'RightUpLeg': (3, 0, 0), 'LeftLeg': (3, 0, 0), 'RightLeg': (2, 0, 0)}
recoil_cover={'Hips': (-0.6, 0, 0), 'Spine': (6, 0, 2), 'Spine01': (5, 0, 2), 'Head': (6, 0, 1), 'RightArm': (31, 0, -9), 'RightForeArm': (54, 0, 36), 'LeftArm': (32, 0, 11), 'LeftForeArm': (51, 0, -38), 'LeftUpLeg': (-2, 0, 0), 'RightUpLeg': (2, 0, 0)}
build('Duel_Recoil',[
 (1,zero),(5,recoil_contact),(12,recoil_contact),
 (18,recoil_cover),(27,recoil_cover),(36,zero)])
# WIN: one fist up, other hand on chest; slight body rotation and eye-up,
# not a symmetrical arm-flinging star-pose.
victory_burst={'Hips': (0.0, 0, 0), 'Spine': (-2, 0, -2.12), 'Spine01': (-3, 0, -7), 'Head': (-11, 0, 9), 'neck': (-4, 0, 4), 'RightArm': (74, 0, -16), 'RightForeArm': (45, 0, -24), 'RightHand': (0, 0, -8), 'LeftArm': (24, 0, 7), 'LeftForeArm': (27, 0, -48), 'LeftHand': (0, 0, 8), 'LeftUpLeg': (-2, 0, 0), 'RightUpLeg': (2, 0, 0)}
victory_pump={'Hips': (0.0, 0, 0), 'Spine': (-2, 0, -1.6799999999999997), 'Spine01': (-3, 0, -9), 'Head': (-13, 0, 9), 'neck': (-4, 0, 6), 'RightArm': (82, 0, -15), 'RightForeArm': (32, 0, -28), 'RightHand': (0, 0, -11), 'LeftArm': (24, 0, 7), 'LeftForeArm': (28, 0, -48), 'LeftUpLeg': (-2, 0, 0), 'RightUpLeg': (2, 0, 0)}
build('Duel_Victory',[
 (1,zero),(7,victory_burst),(15,victory_pump),
 (23,victory_burst),(31,victory_burst),(42,zero)])
# The default standstill should no longer look like a stiff statue.
# Native skeletal idle is low-frequency, asynchronous across torso/head/arms/legs,
# always moving through recognizable weight-shift and scanning poses.
idleLeft={'Hips': (0.0, 0, 0), 'Spine': (0, 0, -1.8399999999999999), 'Spine01': (0, 0, -3), 'neck': (0, 0, 7), 'Head': (0, 0, 9), 'LeftArm': (7, 1, 4), 'RightArm': (3, 0, -3), 'LeftForeArm': (5, 0, 2), 'RightForeArm': (4, 0, -2), 'LeftUpLeg': (2, 0, 0), 'RightUpLeg': (-4, 0, 0), 'LeftLeg': (3, 0, 0), 'RightLeg': (5, 0, 0)}
idleRight={'Hips': (0.0, 0, 0), 'Spine': (2, 0, 2.12), 'Spine01': (1, 0, 5), 'neck': (0, 0, -7), 'Head': (-2, 0, -12), 'LeftArm': (3, 0, 3), 'RightArm': (11, 0, -5), 'LeftForeArm': (3, 0, 0), 'RightForeArm': (12, 0, 5), 'LeftUpLeg': (-5, 0, 0), 'RightUpLeg': (4, 0, 0), 'LeftLeg': (7, 0, 0), 'RightLeg': (2, 0, 0)}
idleSurprise={'Hips': (0.3, 0, 0), 'Spine': (-3, 0, -2), 'Spine01': (-2, 0, 0), 'neck': (-4, 0, 1), 'Head': (-5, 0, 0), 'RightArm': (9, -3, -7), 'RightForeArm': (22, 0, 7), 'LeftArm': (5, 0, 3), 'LeftForeArm': (7, 0, 3), 'LeftUpLeg': (-3, 0, 0), 'RightUpLeg': (2, 0, 0)}
build('Duel_Idle_LookAround',[(1,zero),(18,idleLeft),(37,idleLeft),
 (61,zero),(83,idleRight),(105,idleRight),(122,idleSurprise),
 (144,zero)])

# R225: real skinned school uniform from DanDao W49 source-surface fitting.
exec(compile((ROOT/'style_jay_r225.py').read_text(),str(ROOT/'style_jay_r225.py'),'exec'))
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
print('R226_ANATOMICAL_ELBOW_INWARD_EXPORTED','size',len(raw),'actions',sorted(names),'original_nla',original_nla)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
