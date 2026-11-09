"""Check spatial feasibility of driving a generated shell from a parametric base.
Nearest-surface distance is an *alignment diagnostic*, NOT proof of correspondence.
"""
import bpy,json,statistics,math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path
r=Path('/home/master/projects/after-school-duel-r36-hybrid-20261109/r36-hybrid-3d')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath='/home/master/projects/after-school-duel-r34-true3d-20261109/r34-music-3d/model/M01_candidate.glb')
gen=next(o for o in bpy.context.scene.objects if o.type=='MESH')
wcoords=[gen.matrix_world@Vector(c) for c in gen.bound_box]
mn=min(v.z for v in wcoords);mx=max(v.z for v in wcoords)
scale=1.86/(mx-mn)
gen.scale=Vector((scale,)*3)
gen.location.z=-mn*scale
bpy.context.view_layer.update()
bvh=BVHTree.FromObject(gen,bpy.context.evaluated_depsgraph_get())
mat_inv=gen.matrix_world.inverted()
bpy.ops.import_scene.gltf(filepath='/home/master/projects/after-school-duel-r30-face-20261109/labs/music-teacher-r28/assets/model/M01_Adult_Suit3_Rigged_Prototype.glb')
wanted={'base_male_body','M01_true_MakeHuman_CC0_formal_woven_suit_SKINNED','M01_CC0_CulturaLibre_sculpted_short_wavy_hair',
        'M01_ACTUAL_3D_SKINNED_PIANO_LINED_COAT_TAIL_LEFT','M01_ACTUAL_3D_SKINNED_PIANO_LINED_COAT_TAIL_RIGHT'}
items=[]
for obj in bpy.context.scene.objects:
 if obj.type!='MESH' or obj==gen or obj.name not in wanted:continue
 samples=list(range(0,len(obj.data.vertices),max(1,len(obj.data.vertices)//1100)))
 dist=[]
 for i in samples:
  pos=obj.matrix_world @ obj.data.vertices[i].co
  target=bvh.find_nearest(mat_inv@pos)
  if target[0] is not None:dist.append(target[3]*scale)
 if not dist:continue
 ds=sorted(dist)
 items.append({'name':obj.name,'samples':len(ds),
               'median_nearest_surface_distance_m':round(ds[len(ds)//2],3),
               'p90_distance_m':round(ds[int(.9*len(ds))],3),
               'within_3cm_pct':round(100*sum(x<.03 for x in ds)/len(ds),1),
               'within_10cm_pct':round(100*sum(x<.1 for x in ds)/len(ds),1)})
out={'asset_a':'R30 rigged param body 163 bones','asset_b':'R34 pixal static one-piece 934k-tris',
     'uniform_stature_scale':round(scale,4),'target_foot_offset_z':round(gen.location.z,4),
     'distance_is_not_semantic_or_topology_matching':True,
     'regions':items,'data_transfer_can_use_nearest_face_only_after_local_part_correspondence':True,
     'full_model_vertex_weight_transfer_approved':False,'hybrid_merged':False}
p=r/'evidence/fit-feasibility.json'
p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('R36_SPATIAL_FIT_FEASIBILITY',json.dumps(out,ensure_ascii=False),flush=True)
