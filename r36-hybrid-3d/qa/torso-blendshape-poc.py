"""R36 constrained local geometric fusion experiment:
Parametric skinned R30 suit stays the deformation cage, Pixal R34 guides only
small sculpt offsets on upper torso. Not a facial retopo or finished art.
"""
import bpy,json,math,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
r=Path('/home/master/projects/after-school-duel-r36-hybrid-20261109/r36-hybrid-3d')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath='/home/master/projects/after-school-duel-r34-true3d-20261109/r34-music-3d/model/M01_candidate.glb')
gen=next(x for x in bpy.context.scene.objects if x.type=='MESH')
v=[gen.matrix_world@Vector(c) for c in gen.bound_box]
lower=min(x.z for x in v);upper=max(x.z for x in v)
factor=1.86/(upper-lower)
gen.scale=(factor,)*3
gen.location.z=-lower*factor
bpy.context.view_layer.update()
bvh=BVHTree.FromObject(gen,bpy.context.evaluated_depsgraph_get())
inv=gen.matrix_world.inverted()
bpy.ops.import_scene.gltf(filepath='/home/master/projects/after-school-duel-r30-face-20261109/labs/music-teacher-r28/assets/model/M01_Adult_Suit3_Rigged_Prototype.glb')
suit=next(x for x in bpy.context.scene.objects if x.type=='MESH' and x.name.startswith('M01_true_MakeHuman_CC0_formal_woven_suit_SKINNED'))
arms=[m for m in suit.modifiers if m.type=='ARMATURE']
assert len(arms)>0 and len(suit.vertex_groups)>120
basis=suit.shape_key_add(name='Basis',from_mix=False)
key=suit.shape_key_add(name='R36_PixalGuide_upper_torso_safe_0.35',from_mix=False)
key.value=1.0
def ramp(z):
 if z<1.0 or z>1.50:return 0
 return min(1.0,(z-1.0)/.09,(1.50-z)/.1)
moved=[];attempts=0
for vtx in suit.data.vertices:
 wpos=suit.matrix_world@vtx.co
 fade=ramp(wpos.z)*max(0,1-abs(wpos.x)/.47)
 if fade<=0:continue
 attempts+=1
 near=bvh.find_nearest(inv@wpos)
 if near[0] is None:continue
 dest=gen.matrix_world@near[0]
 delta=dest-wpos
 d=delta.length
 # Limited nonrigid projection; nearest surface has no semantic labeling.
 # Decay to 0 for likely mismatches (>6cm) and preserve all armature weights.
 if d<=.065:
  influence=.35*fade*max(0,min(1,(.065-d)/.025))
  offset=delta*influence
  if offset.length>.016:offset.length=.016
  key.data[vtx.index].co=vtx.co+suit.matrix_world.inverted().to_3x3()@offset
  if offset.length>.0001:moved.append(offset.length)
parts=[o for o in bpy.context.scene.objects if o!=gen]
# Remove the target before writing, so saved preview cannot accidentally be the generated model.
bpy.data.objects.remove(gen,do_unlink=True)
rig_objects=[o for o in bpy.context.scene.objects if o.type=='ARMATURE']
assert rig_objects and len(rig_objects[0].data.bones)==163
report={'schema':'R36 constrained upper-torso geometry guide proof','method':'nearest-surface shape key with spatial mask, displacement clamp and fade',
 'parameterized_rig_bones':len(rig_objects[0].data.bones),'suit_triangles':len(suit.data.polygons),
 'suit_vertex_groups':len(suit.vertex_groups),'shape_key_name':key.name,
 'torso_test_candidates':attempts,'changed_vertices':len(moved),
 'mean_movement_mm':round(sum(moved)/len(moved)*1000,2) if moved else 0,
 'max_movement_mm':round(max(moved)*1000,2) if moved else 0,
 'static_generated_head_replaced':False,'face_improved':False,
 'deformation_animation_tested':False,'actual_game_integration':False,
 'art_approved':False,'publication_ready':False}
(r/'evidence/torso-shapekey-poc.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for o in bpy.context.selected_objects:o.select_set(False)
for o in bpy.context.scene.objects:
 if o.type in ('MESH','ARMATURE','EMPTY'):o.select_set(True)
bpy.context.view_layer.objects.active=rig_objects[0]
bpy.ops.export_scene.gltf(filepath=str(r/'candidate/R36_parametric_rig_pixal_guided_torso.glb'),export_format='GLB',use_selection=True,
 export_animations=False,export_morph=True,export_lights=False,export_cameras=False)
print('R36_TORSO_SHAPEKEY_POC',json.dumps(report,ensure_ascii=False),flush=True)
