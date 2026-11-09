import bpy, math, sys, json
from mathutils import Vector
from pathlib import Path
r=Path(__file__).resolve().parent.parent
glb=r/'model/M01_candidate.glb'
out=r/'qa/evidence'
out.mkdir(exist_ok=True,parents=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(glb))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert meshes,'GLB has no mesh'
verts=[]
for o in meshes:
 for p in o.bound_box: verts.append(o.matrix_world @ Vector(p))
minc=Vector(tuple(min(v[i] for v in verts) for i in range(3)))
maxc=Vector(tuple(max(v[i] for v in verts) for i in range(3)))
center=(minc+maxc)*.5;dims=maxc-minc
print('R34_BBOX',tuple(round(x,3) for x in dims),tuple(round(x,3) for x in center),flush=True)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=18
scene.render.threads_mode='FIXED';scene.render.threads=16
scene.render.resolution_x=540;scene.render.resolution_y=760;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
world=bpy.data.worlds.new('R34 studio') if not bpy.data.worlds else bpy.data.worlds[0]
scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.045,.042,.067,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.85
camdat=bpy.data.cameras.new('QA Perspective');cam=bpy.data.objects.new('QA Camera',camdat);scene.collection.objects.link(cam);scene.camera=cam
camdat.type='ORTHO';camdat.ortho_scale=max(dims.z*1.27,dims.x*1.65,dims.y*1.65)
radius=max(dims)*3.0
def area(name,location,power,size,col):
 data=bpy.data.lights.new(name,'AREA');ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob)
 ob.location=center+Vector(location)*radius
 ob.rotation_euler=(center-ob.location).to_track_quat('-Z','Y').to_euler()
 data.energy=power;data.shape='DISK';data.size=size;data.color=col
area('Key',(1,-1,1.25),650,4,(1,.83,.68))
area('Fill',(-1,-.6,.75),360,5,(.76,.81,1))
area('Rim',(.1,.8,1.2),850,3,(.88,.77,1))
camera_views={'front':(0,-1,.06),'right':(1,0,.06),'back':(0,1,.06),'three':(.73,-.73,.08)}
for name,vec in camera_views.items():
 cam.location=center+Vector(vec).normalized()*radius
 cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(out/f'R34_{name}.png')
 print('RENDERING',name,scene.render.filepath,flush=True)
 bpy.ops.render.render(write_still=True)
(out/'blender-proof.json').write_text(json.dumps({'renderer':'Blender Cycles CPU','source':str(glb),
 'mesh_count':len(meshes),'bounding_box':[round(x,3) for x in dims],
 'views':list(camera_views),'art_approved':False},indent=2)+'\n')
print('R34_BLENDER_FOUR_VIEWS_RENDERED',flush=True)
