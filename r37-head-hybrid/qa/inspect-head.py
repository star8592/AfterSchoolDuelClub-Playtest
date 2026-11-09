import bpy,json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path
bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath='/home/master/projects/after-school-duel-r34-true3d-20261109/r34-music-3d/model/M01_candidate.glb')
g=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bb=[g.matrix_world@Vector(v) for v in g.bound_box]
z0=min(v.z for v in bb); z1=max(v.z for v in bb)
factor=1.86/(z1-z0)
g.scale=(factor,)*3;g.location.z=-z0*factor
bpy.context.view_layer.update()
verts=[g.matrix_world@v.co for v in g.data.vertices]
bands={}
for low,high in [(0,1.2),(1.2,1.4),(1.4,1.5),(1.5,1.6),(1.6,1.7),(1.7,1.8),(1.8,1.9)]:
 vv=[v for v in verts if low<=v.z<high]
 if vv:
  bands[f'{low:.1f}-{high:.1f}']={'n':len(vv),'x':[round(min(v.x for v in vv),3),round(max(v.x for v in vv),3)],'y':[round(min(v.y for v in vv),3),round(max(v.y for v in vv),3)]}
bvh=BVHTree.FromObject(g,bpy.context.evaluated_depsgraph_get())
landmarks={}
for name,p in [('left_eye',(.05,-.155,1.68)),('right_eye',(-.05,-.155,1.68)),('nose',(0,-.17,1.64)),('mouth',(0,-.15,1.58)),('chin',(0,-.12,1.51)),('hair',(0,-.05,1.84))]:
 near=bvh.find_nearest(g.matrix_world.inverted()@Vector(p))
 if near[0] is not None:
  world=g.matrix_world@near[0]
  landmarks[name]={'closest':[round(i,4) for i in world],'distance_cm':round(100*(world-Vector(p)).length,2)}
r={'bands':bands,'landmarks':landmarks,'scaled_generation_height':1.86,'warning':'nearest 3D surface is not necessarily the correct anatomical surface'}
out=Path('/home/master/projects/after-school-duel-r37-head-transfer-20261109/r37-head-hybrid/evidence/head-region-diagnostic.json')
out.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
print('HEAD_REGION',json.dumps(r,ensure_ascii=False))
