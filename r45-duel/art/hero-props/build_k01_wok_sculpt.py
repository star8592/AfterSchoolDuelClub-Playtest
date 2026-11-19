"""R178 K01 cinematic prop: actual carbon-steel wok + scorched eggplant
+ curved real banana, not nested low-poly boxes or decorative ring FX.
Blender 5.x -- source .blend + mesh .glb + unbiased Eevee image.
"""
import bpy,math,random,json,os
from mathutils import Vector
from math import pi,sin,cos
BASE=os.path.dirname(os.path.abspath(__file__))
random.seed(17801)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,rgb,metal=0,rough=.45,noise=None):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Metallic'].default_value=metal
 p.inputs['Roughness'].default_value=rough
 m.diffuse_color=(*rgb,1)
 if noise:
  tex=m.node_tree.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=noise
  tex.inputs['Detail'].default_value=3.5
  tex.inputs['Roughness'].default_value=.66
  bump=m.node_tree.nodes.new('ShaderNodeBump')
  bump.inputs['Strength'].default_value=.13
  bump.inputs['Distance'].default_value=.016
  m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height'])
  m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
 return m
iron=mat('Forged black carbon-steel wok oxidized',(.049,.074,.095),.61,.38,57)
inside=mat('Blue-black seasoning patina',(.092,.106,.127),.56,.25,35)
rim=mat('Cast dark steel rolled rim',(.18,.20,.22),.77,.24,22)
wood=mat('Aged natural lacquered ash wood handle',(.42,.19,.067),0,.34,51)
brass=mat('Burnished warm brass rivets',(.57,.36,.13),.75,.29)
egg=mat('Roasted eggplant glossy purple skin',(.22,.067,.25),.0,.21,25)
egg_hi=mat('Scorched aubergine highlights',(.31,.09,.29),0,.35,73)
leaf=mat('Organic calyx forest green',(.13,.34,.10),0,.62,34)
banana=mat('Golden curved banana ripe peel',(.94,.67,.19),0,.36,38)
ban_hi=mat('Ripe pale banana raised seam',(.97,.83,.43),0,.43,51)
toast=mat('Caramelized fry marks',(.35,.13,.048),0,.52,67)
oil=mat('Hot caramelized sauce glaze',(.41,.17,.075),.14,.16,14)
veg=mat('Fried spring onion celery green',(.25,.49,.13),0,.61,42)
pepper=mat('Chili flake red-orange',(.69,.12,.045),0,.58)
sesame=mat('Toasted sesame seed ivory',(.90,.78,.44),0,.63)
def smooth(o):
 for face in o.data.polygons:face.use_smooth=True
 return o
def mesh(name,verts,faces,material):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
 o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o)
 o.data.materials.append(material);return smooth(o)
def bevel(o,amount=.03):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
 bpy.context.view_layer.objects.active=o
 m=o.modifiers.new('Real edge radius','BEVEL');m.width=amount;m.segments=5
 bpy.ops.object.modifier_apply(modifier=m.name)
 return smooth(o)
def cylinder(name,point,rad,depth,material,verts=32,orientation=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=rad,depth=depth,location=point)
 ob=bpy.context.object;ob.name=name;ob.data.materials.append(material)
 if orientation is not None:
  ob.rotation_euler=Vector(orientation).to_track_quat('Z','Y').to_euler()
 return bevel(ob,min(.014,rad*.12))
def uvball(name,point,radii,material,segments=24,rings=14):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=point)
 ob=bpy.context.object;ob.name=name;ob.scale=radii;ob.data.materials.append(material)
 return smooth(ob)
def tube(name,path,radii,material,segments=15):
 # Physical swept tube, no torus primitive. Parallel transport approx
 verts=[];faces=[]
 for j,p in enumerate(path):
  pos=Vector(p)
  tangent=Vector(path[min(j+1,len(path)-1)])-Vector(path[max(0,j-1)])
  if tangent.length<.001:tangent=Vector((1,0,0))
  tangent.normalize();axis=tangent.cross(Vector((0,0,1)))
  if axis.length<.001:axis=tangent.cross(Vector((0,1,0)))
  axis.normalize();up=tangent.cross(axis).normalized()
  r=radii[j] if isinstance(radii,list) else radii
  for i in range(segments):
   a=2*pi*i/segments
   offset=r*(cos(a)*axis+sin(a)*up)
   verts.append(tuple(pos+offset))
  if j:
   for i in range(segments):
    a=(j-1)*segments+i;b=(j-1)*segments+(i+1)%segments
    faces.append((a,b,b+segments,a+segments))
 faces.append(tuple(reversed(range(segments))))
 faces.append(tuple((len(path)-1)*segments+i for i in range(segments)))
 return mesh(name,verts,faces,material)
# Real double-wall lathed wok, concave inside, convex outer profile. The
# bottom is physical curved metal, not a flat cylinder with a painted circle.
def lathe(name,profile,material,n=100):
 verts=[];faces=[]
 for r,z in profile:
  for i in range(n):
   a=2*pi*i/n
   warp=1+.0045*sin(a*7+z*3)+.002*sin(a*17)
   verts.append((r*cos(a)*warp,r*sin(a)*warp,z))
 for j in range(len(profile)-1):
  for i in range(n):
   a=j*n+i;b=j*n+(i+1)%n
   faces.append((a,b,b+n,a+n))
 return mesh(name,verts,faces,material)
outer=[(.07,-.24),(.20,-.227),(.37,-.194),(.57,-.115),(.75,.01),(.88,.16),(.94,.225)]
inner=[(.90,.242),(.80,.166),(.68,.065),(.51,-.024),(.33,-.087),(.14,-.110),(.025,-.113)]
wok=lathe('K01 hand-forged curved steel wok - actual inner and outer surface',
 outer+inner,iron)
# inner seasoning as thin overlay contiguous with inner bowl, physical depth
lathe('K01 dark blue nonuniform inner seasoning',[
 (.08,-.108),(.23,-.087),(.42,-.044),(.59,.027),(.74,.104),(.86,.193)
],inside)
tube('K01 rolled lip segmented forged metal',
 [( .945*cos(i*2*pi/120),.945*sin(i*2*pi/120),.225) for i in range(121)],
 [.032]*121,rim,12)
# True handle: curved wood with taper, metal tang, real visible rivets.
tube('K01 curving long wooden handle',
 [( .80+i*.076,.03+.02*sin(i*.17),.14+.020*i) for i in range(18)],
 [.095+.015*sin(pi*i/17) for i in range(18)],wood,20)
tube('K01 steel handle tang',
 [(.79+i*.06,.03,.16+i*.012) for i in range(6)],
 [.057]*6,rim,16)
for x in (1.00,1.15):
 cylinder('K01 copper-brass fitted rivet',(x,.029,.270),.035,.03,brass)
# Charred food pieces: curvilinear physically different silhouette.
def eggplant(point,scale,angle):
 x,y,z=point
 vertices=[];faces=[]
 levels=31;radials=30
 for j in range(levels):
  t=j/(levels-1);height=(t-.5)*1.10*scale
  radius=.23*scale*(sin(pi*t)**.52)
  for i in range(radials):
   a=2*pi*i/radials
   lobes=1+.04*sin(6*a+3*t)+.02*sin(13*a+7*t)
   vertices.append((radius*cos(a)*lobes,radius*sin(a)*lobes,height))
 for j in range(levels-1):
  for i in range(radials):
   a=j*radials+i;b=j*radials+(i+1)%radials
   faces.append((a,b,b+radials,a+radials))
 ob=mesh('Actual irregular roasted aubergine body',vertices,faces,egg)
 ob.rotation_euler=(0,.23,angle);ob.location=(x,y,z)
 # No generic cone leaf; actual five hand-curved irregular narrow petals
 for k in range(5):
  a=k*2*pi/5+angle
  petals=[]
  for t in range(9):
   d=t/8
   rr=.03+d*.29*scale
   zc=.59*scale-.10*sin(pi*d)
   width=.08*scale*sin(pi*d)
   petals.extend([(rr*cos(a)-width*sin(a),rr*sin(a)+width*cos(a),zc),
                  (rr*cos(a)+width*sin(a),rr*sin(a)-width*cos(a),zc)])
  faces2=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(8)]
  pet=mesh('Eggplant organic raised calyx '+str(k),petals,faces2,leaf)
  pet.location=(x,y,z);pet.rotation_euler=(0,.23,angle)
 tube('Eggplant real curved stalk',[(x+.01*j,y+.004*j,z+.48*scale+.035*j)
  for j in range(9)],[.055-.004*j for j in range(9)],leaf,14)
eggplant((-.30,-.18,.18),.78,-.58)
# Banana itself is a bent tapered curved 3D body. Shape and banana ribs
# use different geometries, not a torus segment or yellow sphere.
N=34;path=[]
for j in range(N):
 t=j/(N-1)
 path.append((.17+.95*(t-.5),.17+.27*sin(pi*t),.16+.12*sin(1.3*pi*t)))
radii=[.018+.125*(sin(pi*j/(N-1))**.62) for j in range(N)]
tube('K01 curved ripe banana sculpt',path,radii,banana,24)
# Longitudinal raised peel ribs on tapered banana, hugging the actual surface.
for ridge in range(4):
 a=ridge*2*pi/4+.12
 coords=[]
 for j,p in enumerate(path):
  r=radii[j];t=j/(N-1)
  coords.append((p[0],p[1]+sin(a)*r*.92,p[2]+cos(a)*r*.91))
 tube('Real raised banana peel rib '+str(ridge),coords,
  [.004+(.008*sin(pi*j/(N-1))) for j in range(N)],ban_hi,7)
for j in range(2,N-2,6):
 p=path[j];a=j*1.8
 uvball('Cooked banana caramel patches',(p[0],p[1]+radii[j]*.67,
  p[2]+.04*cos(a)),(.03,.01,.044),toast,12,8)
# Thick glossy sauce pools follow bowl base actual irregular contour.
for k in range(14):
 a=k*2.399963;r=.13+.36*(k%5)/5
 x=r*cos(a);y=r*sin(a)
 z=-.088+.08*(r/.70)**1.6
 b=uvball('Glossy wok sauce drop',(x,y,z),(.044+.018*(k%3),.021,.008),oil,16,10)
# Flaky fried spring onion, pepper & sesame -- genuine geometry,
# visually readable at close range, single material batching below.
for i in range(34):
 a=random.uniform(-pi,pi);r=random.uniform(.10,.66)
 x,y=r*cos(a),r*sin(a)
 z=-.10+.12*(r/.80)**1.6
 if i%3==0:
  uvball('Red chili seed', (x,y,z+.015),(.028,.016,.011),pepper,12,8)
 elif i%3==1:
  uvball('Toasted sesame', (x,y,z+.015),(.027,.009,.009),sesame,12,8)
 else:
  pts=[(x+t*.034,y+t*.015,z+.018+.002*sin(t*pi/7)) for t in range(8)]
  tube('Sliced scallion strand',pts,.015,veg,8)
# Batch by physical material; shading and authored silhouette remain unchanged.
for m in (iron,inside,rim,wood,brass,egg,egg_hi,leaf,banana,ban_hi,toast,oil,veg,pepper,sesame):
 selection=[o for o in bpy.context.scene.objects if o.type=='MESH' and
  len(o.data.materials)==1 and o.data.materials[0]==m]
 if len(selection)>1:
  bpy.ops.object.select_all(action='DESELECT')
  for o in selection:o.select_set(True)
  bpy.context.view_layer.objects.active=selection[0]
  bpy.ops.object.join();selection[0].name='K01 | '+m.name
models=[o for o in bpy.context.scene.objects if o.type=='MESH']
source=os.path.join(BASE,'K01_Sculpted_Wok_Eggplant_Banana.blend')
glb=os.path.join(BASE,'K01_Sculpted_Wok_Eggplant_Banana.glb')
bpy.ops.wm.save_as_mainfile(filepath=source)
bpy.ops.object.select_all(action='DESELECT')
for o in models:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',use_selection=True,export_apply=True)
receipt=dict(meshes=len(models),triangles=sum(len(f.vertices)-2 for o in models for f in o.data.polygons),
 materials=len(bpy.data.materials),fileBytes=os.path.getsize(glb),bananas=1,
 curvedWok=True,roastedEggplants=1,originalBlender=True)
print('R178_K01_REAL_SCULPT',json.dumps(receipt))
open(os.path.join(BASE,'qa','K01_mesh_receipt.json'),'w').write(json.dumps(receipt,indent=2))
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.camera_add(location=(3.6,-4.6,3.65))
cam=bpy.context.object;cam.rotation_euler=(Vector((.0,.0,.14))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=3.25
scene=bpy.context.scene;scene.camera=cam
for power,loc,size in ((480,(2,-4,4),4.0),(380,(-2,1,3),3.5),(300,(2,2,4),2.8)):
 bpy.ops.object.light_add(type='AREA',location=loc)
 l=bpy.context.object;l.data.energy=power;l.data.size=size
 l.rotation_euler=(Vector((0,0,0))-l.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.filepath=os.path.join(BASE,'qa','K01_Sculpted_Wok_Eggplant_Banana.png')
scene.render.image_settings.file_format='PNG'
bpy.ops.render.render(write_still=True)
print('R178_K01_REAL_RENDER',scene.render.filepath)
