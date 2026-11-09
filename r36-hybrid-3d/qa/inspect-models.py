import bpy,json,sys,collections
from mathutils import Vector
from pathlib import Path
samples={
 'r34_pixal':'/home/master/projects/after-school-duel-r34-true3d-20261109/r34-music-3d/model/M01_candidate.glb',
 'r30_param':'/home/master/projects/after-school-duel-r30-face-20261109/labs/music-teacher-r28/assets/model/M01_Adult_Suit3_Rigged_Prototype.glb',
}
out={}
for key,path in samples.items():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=path)
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 arms=[o for o in bpy.context.scene.objects if o.type=='ARMATURE']
 verts=[o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
 mn=[round(min(v[i] for v in verts),4) for i in range(3)]
 mx=[round(max(v[i] for v in verts),4) for i in range(3)]
 lines=[]
 for o in sorted(meshes,key=lambda o:len(o.data.polygons),reverse=True)[:35]:
  points=[o.matrix_world @ Vector(c) for c in o.bound_box]
  bmin=[round(min(v[i] for v in points),3) for i in range(3)]
  bmax=[round(max(v[i] for v in points),3) for i in range(3)]
  lines.append({'name':o.name,'tris':sum(len(p.vertices)-2 for p in o.data.polygons),'verts':len(o.data.vertices),'bounds':[bmin,bmax],
   'material':[m.name for m in o.data.materials],'modifiers':[m.type for m in o.modifiers],'vertexgroups':len(o.vertex_groups),
   'shapekeys':len(o.data.shape_keys.key_blocks) if o.data.shape_keys else 0})
 out[key]={'file':path,'objects':len(bpy.context.scene.objects),'meshes':len(meshes),'arms':len(arms),'bones':sum(len(a.data.bones) for a in arms),
  'total_triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),
  'bounds':[mn,mx], 'top_meshes':lines}
 print('INSPECT',key,'meshes',len(meshes),'bones',out[key]['bones'],'triangles',out[key]['total_triangles'],'bbox',out[key]['bounds'],flush=True)
 for x in lines[:15]:
  print('ITEM',x['name'],x['tris'],x['bounds'],str(x['material'])[:100],x['shapekeys'],x['vertexgroups'],flush=True)
p=Path('/home/master/projects/after-school-duel-r34-true3d-20261109/r36-hybrid-3d/qa/model-comparison.json')
p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
