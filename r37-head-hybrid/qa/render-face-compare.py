import bpy,json,math
from mathutils import Vector
from pathlib import Path
root=Path('/home/master/projects/after-school-duel-r37-head-transfer-20261109/r37-head-hybrid')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'candidate/R37_parametric_face_v1_optimized_glasses.glb'))
head=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.shape_keys and any('Mature_Facial' in k.name for k in o.data.shape_keys.key_blocks))
sk=next(k for k in head.data.shape_keys.key_blocks if 'Mature_Facial' in k.name)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.device='CPU'
scene.render.threads_mode='FIXED';scene.render.threads=16
scene.render.resolution_x=540;scene.render.resolution_y=540
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
world=bpy.data.worlds.new('Neutral') if not bpy.data.worlds else bpy.data.worlds[0]
scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.037,.038,.060,1)
camdata=bpy.data.cameras.new('R37 identical face camera');cam=bpy.data.objects.new('R37 Cam',camdata);scene.collection.objects.link(cam);scene.camera=cam;camdata.type='ORTHO'
def illum(label,loc,power,size,RGB):
 data=bpy.data.lights.new(label,'AREA');o=bpy.data.objects.new(label,data);scene.collection.objects.link(o);o.location=loc
 o.rotation_euler=(Vector((0,-.1,1.62))-o.location).to_track_quat('-Z','Y').to_euler()
 data.energy=power;data.size=size;data.color=RGB
illum('Key',(1.8,-1.6,2.8),260,3,(1,.82,.68))
illum('Fill',(-1.5,-2.0,1.75),160,3,(.78,.83,1))
illum('Rim',(0,.5,2.6),340,2,(1,.78,.85))
target=Vector((0,-.105,1.66))
for shot,vec,size in [('face',(0,-3,.2),.47),('three',(1.2,-2.8,.4),.50)]:
 cam.location=target+Vector(vec);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camdata.ortho_scale=size
 for key,val in [('before',0.0),('after',1.0)]:
  sk.value=val
  scene.render.filepath=str(root/'evidence'/f'R37_{shot}_{key}.png')
  bpy.ops.render.render(write_still=True)
  print('R37_RENDER',shot,key,flush=True)
