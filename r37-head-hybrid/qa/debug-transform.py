import bpy
from mathutils import Vector
bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath='/home/master/projects/after-school-duel-r34-true3d-20261109/r34-music-3d/model/M01_candidate.glb')
g=next(o for o in bpy.context.scene.objects if o.type=='MESH')
def report(label):
 vs=[g.matrix_world @ v.co for v in g.data.vertices]
 def rangev(vs,k): return [round(min(v[k] for v in vs),4),round(max(v[k] for v in vs),4)]
 print(label,'matrix',str(g.matrix_world), 'scale',list(g.scale),'location',list(g.location),'parent',str(g.parent),'nverts',len(vs),'range',[rangev(vs,k) for k in range(3)],'local',[rangev([v.co for v in g.data.vertices],k) for k in range(3)],'v0',list(vs[0]),flush=True)
report('BEFORE')
z0=min((g.matrix_world@Vector(v)).z for v in g.bound_box)
z1=max((g.matrix_world@Vector(v)).z for v in g.bound_box)
k=1.86/(z1-z0)
g.scale=(k,)*3;g.location.z=-z0*k;bpy.context.view_layer.update()
report('AFTER')
