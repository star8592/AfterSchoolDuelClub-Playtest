import bpy,sys,json
from mathutils import Vector
from pathlib import Path
source=Path(sys.argv[-1]);bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
armatures=[o for o in bpy.context.scene.objects if o.type=='ARMATURE']
for o in armatures:
 print('R73_ARMATURE',o.name,'bounds',tuple(round(x,3) for x in o.location),'bone_count',len(o.data.bones))
 for b in o.data.bones:
  print('R73_BONE',b.name,'head',tuple(round(x,3) for x in b.head_local),'tail',tuple(round(x,3) for x in b.tail_local),'parent',b.parent.name if b.parent else '-')
for o in meshes:
 print('R73_MESH',o.name,'bounds',tuple(round(x,3) for x in o.dimensions),'verts',len(o.data.vertices),'polys',len(o.data.polygons),'parent',o.parent.name if o.parent else None,'materials',[(m.name,tuple(round(x,3) for x in m.diffuse_color)) for m in o.data.materials if m])
print('R73_ANIMS',[(x.name,round(x.frame_range[1]-x.frame_range[0],1)) for x in bpy.data.actions]);print('R73_SCENE',[(o.name,o.type) for o in bpy.context.scene.objects])
