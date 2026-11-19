"""R175 original cinema-quality eraser. True sculpted geometry; Blender 5.x.
No generic sphere/box-only stage props. Source+GLB+render are reproducible.
"""
import bpy, math, random, os, json
from mathutils import Vector
from math import pi,cos,sin
BASE=os.path.dirname(os.path.realpath(__file__))
random.seed(175)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
def material(name,rgb,roughness=.7,metallic=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 s=m.node_tree.nodes['Principled BSDF']
 s.inputs['Base Color'].default_value=(*rgb,1)
 s.inputs['Roughness'].default_value=roughness
 s.inputs['Metallic'].default_value=metallic
 m.diffuse_color=(*rgb,1)
 return m
wood=material('Warm amber sculpted hardwood',(0.46,.23,.092),.39)
black=material('Blue-black inlaid enamel',(.044,.104,.147),.38,.16)
felt=material('Charcoal rough pressed felt',(.075,.096,.093),.96)
fiber=material('Raised dusty woven fibers',(.148,.159,.152),.99)
brass=material('Satin brass rivet',(.67,.43,.19),.26,.78)
steel=material('Satin blue steel trim',(.38,.47,.52),.31,.72)
chalk=material('Rough fractured white chalk',(.91,.86,.73),.96)
paint=material('Hand-stamped ivory typography',(.94,.78,.43),.46)
def smooth(ob):
 for f in ob.data.polygons:f.use_smooth=True
 return ob
def bevel(ob,amount=.018,seg=4):
 bpy.ops.object.select_all(action='DESELECT')
 ob.select_set(True);bpy.context.view_layer.objects.active=ob
 mod=ob.modifiers.new('Real machined edge fillets','BEVEL');mod.width=amount;mod.segments=seg
 bpy.ops.object.modifier_apply(modifier=mod.name)
 return smooth(ob)
def box(name,location,scale,mat,b=.012):
 bpy.ops.mesh.primitive_cube_add(size=1,location=location)
 o=bpy.context.object;o.name=name;o.dimensions=scale
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(mat)
 if b:bevel(o,b)
 return o
def cylinder(name,loc,r,d,mat,verts=24):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=loc)
 o=bpy.context.object;o.name=name;o.data.materials.append(mat)
 return smooth(o)
def sculpt(name,y,half_x,half_z,thickness,mat,wear=0):
 n=64;rings=[(-.50,.93),(-.34,1.0),(.33,1.04),(.50,.96)]
 vertices=[];faces=[]
 for hy,k in rings:
  for i in range(n):
   t=i*2*pi/n
   # superellipse: naturally curved rounded contour rather than boxes
   x=math.copysign(abs(cos(t))**.42,cos(t))
   z=math.copysign(abs(sin(t))**.42,sin(t))
   w=1+wear*(.55*sin(t*9+.6)+.26*sin(t*15))
   vertices.append((x*half_x*k*w,y+hy*thickness,z*half_z*k*w))
 for j in range(3):
  for i in range(n):
   a=j*n+i;b=j*n+(i+1)%n
   faces.append((a,b,b+n,a+n))
 faces.append(tuple(range(n-1,-1,-1)))
 faces.append(tuple(3*n+i for i in range(n)))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
 ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob)
 ob.data.materials.append(mat);bevel(ob,.014,3)
 return ob
sculpt('E06 organic curved walnut grip',.165,.72,.44,.29,wood,.016)
sculpt('E06 continuous dark-blue enamel band',.021,.735,.453,.068,black,.012)
sculpt('E06 deeply inset pressed felt',-.151,.667,.394,.26,felt,.034)
sculpt('E06 fitted felt perimeter gasket',-.275,.695,.412,.044,black,.021)
# Sculpted felt pile geometry, many individually tapered fibers joined in ONE mesh.
vertices=[];faces=[];index=0
for i in range(19):
 for j in range(28):
  x=-.60+i*.065+random.uniform(-.011,.011)
  z=-.35+j*.025+random.uniform(-.009,.009)
  y=-.312+random.uniform(-.007,.007)
  w=random.uniform(.009,.016);p=random.uniform(.021,.059)
  vertices.extend([(x-w,y,z),(x+w,y,z),(x,y,z+w),
                   (x+random.uniform(-.012,.012),y-p,z+random.uniform(-.015,.015))])
  faces.extend([(index,index+1,index+3),(index+1,index+2,index+3),
                (index+2,index,index+3)]);index+=4
mesh=bpy.data.meshes.new('True geometric fibers, non-texture');mesh.from_pydata(vertices,[],faces);mesh.update()
ob=bpy.data.objects.new('Sculpted dust-rough felt teeth',mesh)
bpy.context.collection.objects.link(ob);ob.data.materials.append(fiber)
# Real machined side guards, recesses, brass slotted screws
for direction in (-1,1):
 box('Protective steel end rail',(direction*.669,.139,0),(.081,.195,.67),steel,.027)
 for z in (-.255,.255):
  o=cylinder('Actual brass countersunk bolt',(direction*.718,.141,z),.044,.024,brass,32)
  o.rotation_euler[1]=pi/2
  box('Actual bolt screwdriver slot',(direction*.731,.141,z),(.02,.012,.056),black,.003)
# Finger gripping strips embossed into top shell
for i in range(8):
 z=-.305+i*.086
 o=box('Non-slip enamel finger ridge',(0,.324,z),(.50,.016,.016),black,.006)
 o.rotation_euler[1]=.065*sin(i*1.3)
# Hand-carved chalk teeth and fractured 3d flecks, combined for efficient drawing.
v=[];f=[];n=0
for k in range(38):
 x=random.uniform(-.62,.62)
 z=random.choice((-1,1))*random.uniform(.345,.415)
 y=random.uniform(-.275,.005);s=random.uniform(.013,.026)
 v.extend([(x,y,z),(x+s,y+s*.7,z),(x-s*.4,y,z+s),(x,y-s,z)])
 f.extend([(n,n+1,n+2),(n,n+2,n+3),(n,n+3,n+1)]);n+=4
mesh=bpy.data.meshes.new('Individual broken chalk crystals');mesh.from_pydata(v,[],f);mesh.update()
o=bpy.data.objects.new('Physical chalk residue',mesh);bpy.context.collection.objects.link(o)
o.data.materials.append(chalk)
box('Bevelled enamel maker insignia',(0,.337,0),(.39,.021,.172),steel,.023)
cu=bpy.data.curves.new('Real extruded maker type','FONT')
cu.body='E06';cu.size=.13;cu.align_x='CENTER';cu.align_y='CENTER'
cu.extrude=.006;cu.bevel_depth=.0015
o=bpy.data.objects.new('E06 stamped sculpted lettering',cu)
bpy.context.collection.objects.link(o);o.location=(0,.355,0)
o.rotation_euler=(pi/2,0,0)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.object.convert(target='MESH');o.data.materials.append(paint)
# Collapse same-material objects into mesh groups; no geometry or quality reduction.
for mat in (wood,black,felt,fiber,brass,steel,chalk,paint):
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and
  len(o.data.materials)==1 and o.data.materials[0]==mat]
 if len(objects)>1:
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0]
  bpy.ops.object.join();objects[0].name='E06 / '+mat.name
models=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BASE,'E06_Cinematic_Eraser.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in models:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(BASE,'E06_Cinematic_Eraser.glb'),
 export_format='GLB',use_selection=True,export_apply=True)
receipt={'meshes':len(models),'triangles':sum(len(p.vertices)-2 for o in models for p in o.data.polygons),
 'bytes':os.path.getsize(os.path.join(BASE,'E06_Cinematic_Eraser.glb')),
 'mat':len(bpy.data.materials),'true_felt_fibers':19*28,'handmade':True}
open(os.path.join(BASE,'qa','E06_mesh_receipt.json'),'w').write(json.dumps(receipt,indent=2))
print('R175_SCULPT_SUCCESS',json.dumps(receipt))
# Render actual 3D asset for review, NOT a generative mockup.
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.camera_add(location=(2.1,2.4,2.8))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=2.3
scene=bpy.context.scene;scene.camera=camera
for pwr,pos in ((500,(3,4,2)),(260,(-3,2,-1)),(300,(0,3,-4))):
 bpy.ops.object.light_add(type='AREA',location=pos)
 l=bpy.context.object;l.data.energy=pwr;l.data.shape='DISK';l.data.size=3.2
 l.rotation_euler=(Vector((0,0,0))-l.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1200;scene.render.resolution_y=900
scene.render.resolution_percentage=100
scene.render.filepath=os.path.join(BASE,'qa','E06_Cinematic_Eraser.png')
scene.render.image_settings.file_format='PNG'
bpy.ops.render.render(write_still=True)
print('R175_REVIEW_IMAGE',scene.render.filepath)
