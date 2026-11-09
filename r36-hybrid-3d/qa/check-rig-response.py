import bpy,math,json
from pathlib import Path
from mathutils import Vector
r=Path('/home/master/projects/after-school-duel-r36-hybrid-20261109/r36-hybrid-3d')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(r/'candidate/R36_parametric_rig_pixal_guided_torso.glb'))
arms=[o for o in bpy.context.scene.objects if o.type=='ARMATURE']
assert len(arms)==1 and len(arms[0].data.bones)==163
a=arms[0]
suit=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.shape_keys and len(o.data.shape_keys.key_blocks)>1)
assert any(m.type=='ARMATURE' for m in suit.modifiers)
print('BODY_ARMATURE_BONES',[b.name for b in a.data.bones if any(x in b.name.lower() for x in ['arm','shoulder','spine'])][:50],flush=True)
print('MORPH_TARGETS',[(k.name,k.value) for k in suit.data.shape_keys.key_blocks],flush=True)
dg=bpy.context.evaluated_depsgraph_get()
def sample():
 dg.update()
 m=suit.evaluated_get(dg).to_mesh()
 pts=[tuple(m.vertices[i].co) for i in range(0,len(m.vertices),max(1,len(m.vertices)//700))]
 suit.evaluated_get(dg).to_mesh_clear()
 return pts
before=sample()
candidates=[x for x in a.pose.bones if any(y in x.name.lower() for y in ['upperarm','upper_arm','shoulder','spine1'])]
if not candidates:
 candidates=[x for x in a.pose.bones if 'arm' in x.name.lower()]
assert candidates,'No pose bone to exercise'
bone=candidates[0]
bone.rotation_mode='XYZ';bone.rotation_euler.z+=.25
after=sample()
ds=[math.dist(p,q) for p,q in zip(before,after)]
data={'bone_count':163,'suit_vertexgroups':len(suit.vertex_groups),
 'selected_pose_bone':bone.name,'test_angle_rad':.25,'sample_count':len(ds),
 'affected_sample_vertices':sum(d>.0001 for d in ds),
 'max_motion_m':round(max(ds),4),'mean_motion_m':round(sum(ds)/len(ds),5),
 'has_morph_target':True,'glb_import_success':True,
 'manual_pose_deforms':max(ds)>.01,'exported_animation_clip_count':0,
 'art_approved':False,'combat_approved':False}
(r/'evidence/rig-response.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('R36_RIG_POSE_PROOF',json.dumps(data,ensure_ascii=False),flush=True)
if not data['manual_pose_deforms']:raise SystemExit(12)
