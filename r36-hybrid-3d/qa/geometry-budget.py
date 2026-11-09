"""Non-destructive LOD study; the generated high-poly is the frozen source.
Outputs geometry count and identical-camera Blender renders, NOT completed character art.
"""
from pathlib import Path
import bpy,json,math,time
from mathutils import Vector
r=Path('/home/master/projects/after-school-duel-r36-hybrid-20261109/r36-hybrid-3d')
high=Path('/home/master/projects/after-school-duel-r34-true3d-20261109/r34-music-3d/model/M01_candidate.glb')
ev=r/'evidence';ev.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(high))
base=next(o for o in bpy.context.scene.objects if o.type=='MESH')
base.name='R34_original_934492'
orig_tri=len(base.data.polygons)
faces_target=[('original',1),('medium',.26),('game',.13)]
variants=[]
for name,ratio in faces_target:
 if name=='original': o=base
 else:
  o=base.copy();o.data=base.data.copy()
  bpy.context.collection.objects.link(o)
  o.name=f'R36_{name}_LOD_candidate'
  for x in bpy.context.selected_objects:x.select_set(False)
  o.select_set(True);bpy.context.view_layer.objects.active=o
  mod=o.modifiers.new(f'NON_DESTRUCTIVE_COMPARE_{name}','DECIMATE');mod.ratio=ratio
  start=time.monotonic()
  bpy.ops.object.modifier_apply(modifier=mod.name)
  print('LOD_CREATED',name,len(o.data.polygons),round(time.monotonic()-start,1),flush=True)
 variants.append((name,o))
bbox=[base.matrix_world@Vector(v) for v in base.bound_box]
mn=Vector(tuple(min(v[i] for v in bbox) for i in range(3)))
mx=Vector(tuple(max(v[i] for v in bbox) for i in range(3)))
center=(mn+mx)*.5;dims=mx-mn
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=14
scene.render.threads_mode='FIXED';scene.render.threads=16
scene.render.resolution_x=500;scene.render.resolution_y=720
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
world=bpy.data.worlds.new('Neutral')
scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.04,.04,.065,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.85
camdat=bpy.data.cameras.new('Identical Camera')
cam=bpy.data.objects.new('Identical Camera',camdat);scene.collection.objects.link(cam);scene.camera=cam
camdat.type='ORTHO'
def light(name,location,power,size,color):
 d=bpy.data.lights.new(name,'AREA');o=bpy.data.objects.new(name,d);scene.collection.objects.link(o)
 o.location=center+Vector(location)
 o.rotation_euler=(center-o.location).to_track_quat('-Z','Y').to_euler()
 d.energy=power;d.size=size;d.color=color
light('Key',(2,-3,4),510,3,(1,.82,.7))
light('Fill',(-2,-2,3),280,4,(.8,.86,1))
light('Rim',(0,3,3),700,3,(1,.77,.94))
rendered={}
for shot in ('body','face'):
 if shot=='body':
  target=center.copy();scale=max(dims.z*1.25,dims.x*1.9)
 else:
  target=Vector((center.x,-.012,mx.z-.13));scale=.30
 camdat.ortho_scale=scale
 cam.location=target+Vector((.75,-2.8,.55)).normalized()*max(dims)*3
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 rendered[shot]={}
 for name,o in variants:
  for name2,o2 in variants:o2.hide_render=o2 is not o
  p=ev/f'R36_{shot}_{name}.png'
  scene.render.filepath=str(p)
  bpy.ops.render.render(write_still=True)
  rendered[shot][name]=str(p)
  print('RENDER',shot,name,len(o.data.polygons),flush=True)
summary={'source_glb_sha256':'337c3b990ba4be0e292169a296a4667fb4cbb8904a8a572bcca25f74f5b1b291',
 'generated_mesh_original_triangles':orig_tri,
 'variants':[{'name':n,'triangles':len(o.data.polygons),'vertices':len(o.data.vertices)} for n,o in variants],
 'render_engine':'Blender 5.2 Cycles CPU','rendered':rendered,
 'art_approved':False,'hybrid_merged':False}
(ev/'lod-evaluation.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print('R36_LOD_EVIDENCE_READY',json.dumps(summary,ensure_ascii=False),flush=True)
