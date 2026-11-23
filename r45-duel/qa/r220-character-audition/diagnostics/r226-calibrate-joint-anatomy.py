import bpy,math,ast,json,pathlib
from mathutils import Euler,Vector
ROOT=pathlib.Path('/home/master/projects/after-school-duel-r220-actors-20261121/r45-duel/qa/r220-character-audition')
txt=(ROOT/'author_jay_v06_school.py').read_text()
names=['draw_reach','draw_lift','draw_present','throw_ready','throw_release','throw_follow',
 'recoil_contact','recoil_cover','victory_burst','victory_pump']
tree=ast.parse(txt);defs={}
for q in tree.body:
 if isinstance(q,ast.Assign) and len(q.targets)==1 and isinstance(q.targets[0],ast.Name) and q.targets[0].id in names:
  defs[q.targets[0].id]=ast.literal_eval(q.value)
assert len(defs)==len(names)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/jay-teen-duel-v06-school.glb'))
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
arm.animation_data.action=None
for tr in arm.animation_data.nla_tracks:tr.mute=True
for b in arm.pose.bones:b.rotation_mode='QUATERNION'
def world(n):return arm.matrix_world @ arm.pose.bones[n].head
def calc(side):
 sh=world(side+'Arm');el=world(side+'ForeArm');w=world(side+'Hand')
 return {
  'lateral':(w.x-el.x)*(-1 if side=='Left' else 1), # + = inward to center
  'forward':sh.y-w.y,
  'angle':math.degrees((el-sh).angle(w-el)),
  'z':w.z}
def apply(d):
 for bone in arm.pose.bones:bone.rotation_quaternion=(1,0,0,0)
 for name,r in d.items():
  if name in arm.pose.bones:
   arm.pose.bones[name].rotation_quaternion=Euler(tuple(math.radians(x) for x in r),'XYZ').to_quaternion()
 bpy.context.view_layer.update()
report={}
for name,source in defs.items():
 result={k:tuple(v) for k,v in source.items()}
 apply(result)
 before={side:calc(side) for side in ['Right','Left']}
 after={}
 for side in ['Right','Left']:
  bn=side+'ForeArm'
  if bn not in result:continue
  oldx,oldy,oldz=result[bn]
  if side=='Left':
   upper=list(result.get('LeftArm',(0,0,0)))
   upper[0]=max(upper[0],24)
   result['LeftArm']=tuple(upper)
  best=None
  # no twisting the entire shoulder or forearm about arbitrary world axes
  for z in range(-160,121,2):
   result[bn]=(oldx,oldy,z)
   apply(result)
   m=calc(side)
   if m['forward']<.135 or m['angle']<24 or m['angle']>125:continue
   # desired elbow tucked naturally back: wrist aims toward torso.
   target=.05 if side=='Right' else .035
   score=((m['lateral']-target)/.025)**2+0.00065*(z-oldz)**2
   score+=max(0,m['z']-1.55)**2*15
   if best is None or score<best[0]:best=(score,z,m)
  assert best is not None,(name,side)
  result[bn]=(oldx,oldy,best[1])
  after[side]={'axisZOld':oldz,'axisZCorrected':best[1],**best[2]}
 apply(result)
 final={side:calc(side) for side in ['Right','Left']}
 for side in ['Right','Left']:
  # Smaller side-specific bias allowed when the hand only braces.
  print('R226_SOLVER_INTERMEDIATE',name,side,'before',before[side],'new',final[side],'cal',after.get(side))
  assert final[side]['lateral']>=.011,(name,side,final[side])
  assert final[side]['forward']>.135,(name,side,final[side])
  assert 24<final[side]['angle']<125,(name,side,final[side])
 print('R226_ANATOMICAL_SOLVE',name,'before',before,'after',final)
 report[name]={'original':source,'corrected':result,'before':before,'after':final,'calibration':after}
save=ROOT/'evidence/r226-actual-forearm-joint-inward-solver.json'
save.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print('R226_ANATOMIC_JOINT_GEOMETRY_PASS',len(report),save)
