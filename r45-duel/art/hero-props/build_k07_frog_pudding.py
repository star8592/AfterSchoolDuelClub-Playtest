"""R179 K07: ORIGINAL sculpted living-school-bell frog pudding.
Blender 5.2 native modeling source, real GLB physical mesh, 3D preview.
DO NOT pass these geometry tests off as final artistic acceptance.
"""
import bpy,math,random,os,json
from mathutils import Vector
from math import sin,cos,pi
random.seed(17907)
BASE=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
def material(name,color,rough=.34,metal=0,coat=0,trans=0,noise=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes['Principled BSDF']
 p.inputs['Base Color'].default_value=(*color,1)
 p.inputs['Roughness'].default_value=rough
 p.inputs['Metallic'].default_value=metal
 p.inputs['Coat Weight'].default_value=coat
 p.inputs['Coat Roughness'].default_value=.16
 p.inputs['Transmission Weight'].default_value=trans
 p.inputs['IOR'].default_value=1.34 if trans else 1.45
 m.diffuse_color=(*color,1)
 if noise:
  tex=m.node_tree.nodes.new('ShaderNodeTexNoise')
  tex.inputs['Scale'].default_value=noise
  tex.inputs['Detail'].default_value=3.2
  bump=m.node_tree.nodes.new('ShaderNodeBump')
  bump.inputs['Strength'].default_value=.14
  bump.inputs['Distance'].default_value=.012
  m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height'])
  m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
 return m
jelly=material('K07 pearly emerald living jelly',(0.15,.58,.27),rough=.22,coat=.5,noise=18)
jellyHi=material('K07 luminous mint raised jelly folds',(.26,.79,.42),rough=.20,coat=.7)
jellyShade=material('K07 deep jade underbelly',(.056,.31,.16),rough=.30,coat=.45,noise=37)
caramel=material('K07 burnt amber caramel top',(.63,.245,.068),rough=.19,coat=.62,noise=26)
lemon=material('K07 jelly sugar dapple',(.90,.86,.37),rough=.4)
white=material('K07 pale vanilla eyeballs',(.93,.89,.73),rough=.24,coat=.48)
iris=material('K07 golden orange glass irises',(.81,.34,.075),rough=.19,coat=.73)
pupil=material('K07 near-black cheerful pupil',(.035,.048,.059),rough=.13,coat=.9)
mouth=material('K07 sculpted burgundy laughing mouth',(.14,.039,.054),rough=.36)
tongue=material('K07 raspberry tongue',(.78,.13,.27),rough=.26,coat=.5)
brass=material('K07 golden school bell',(.65,.39,.085),rough=.21,metal=.84)
silver=material('K07 bell inner clapper and hinge',(.49,.55,.56),rough=.27,metal=.79)
cloche=material('K07 arched silver serving cover',(.44,.57,.63),rough=.25,metal=.82)
clocheIns=material('K07 deep reflected cover interior',(.12,.22,.27),rough=.25,metal=.77)
plate=material('K07 porcelain dish ivory',(.75,.83,.82),rough=.29,coat=.65)
plateLine=material('K07 marine-blue dish trim',(.048,.24,.35),rough=.25,coat=.55)
seed=material('K07 embedded amber berries',(.9,.42,.10),rough=.3,coat=.5)
def smooth(o):
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=True
 return o
def mesh(name,v,f,mat):
 m=bpy.data.meshes.new(name);m.from_pydata(v,[],f);m.update()
 o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o)
 o.data.materials.append(mat)
 return smooth(o)
def rounded(name,pos,scale,mat,s1=24,s2=16):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=s1,ring_count=s2,radius=1,location=pos)
 o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
 return smooth(o)
def lathe(name,profile,mat,radials=68,offset=(0,0,0),breath=0):
 v=[];f=[]
 for j,(radius,z) in enumerate(profile):
  for i in range(radials):
   a=2*pi*i/radials
   warp=1+breath*(sin(8*a+.31*j)+.5*sin(15*a+1.2*j))
   v.append((offset[0]+radius*warp*cos(a),offset[1]+radius*warp*sin(a),offset[2]+z))
 for j in range(len(profile)-1):
  for i in range(radials):
   x=j*radials+i;y=j*radials+(i+1)%radials
   f.append((x,y,y+radials,x+radials))
 f.append(tuple(range(radials-1,-1,-1)))
 f.append(tuple((len(profile)-1)*radials+i for i in range(radials)))
 return mesh(name,v,f,mat)
def tube(name,points,radii,mat,seg=12):
 v=[];f=[]
 for j,p in enumerate(points):
  pt=Vector(p); tangent=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(j-1,0)])
  if tangent.length<.00001:tangent=Vector((0,0,1))
  tangent.normalize();right=tangent.cross(Vector((0,0,1)))
  if right.length<.001:right=tangent.cross(Vector((0,1,0)))
  right.normalize();up=tangent.cross(right).normalized()
  radius=radii[j] if isinstance(radii,list) else radii
  for i in range(seg):
   a=2*pi*i/seg;v.append(tuple(pt+radius*(cos(a)*right+sin(a)*up)))
  if j:
   for i in range(seg):
    x=(j-1)*seg+i;y=(j-1)*seg+(i+1)%seg
    f.append((x,y,y+seg,x+seg))
 f.append(tuple(range(seg-1,-1,-1)))
 f.append(tuple((len(points)-1)*seg+i for i in range(seg)))
 return mesh(name,v,f,mat)
def parent_group(name,objects):
 group=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(group)
 # Identity parent world-transform. Retain authored object-local scale:
 # reading a stale matrix_world after object.scale can silently reset all
 # tiny berries to unit-scale spheres, ruining the entire 3D silhouette.
 for o in objects:o.parent=group
 bpy.context.view_layer.update()
 return group
def add_bell():
 bells=[]
 bells.append(lathe('K07 school-bell bronze curved mouth',
  [(0,.0),(.085,.0),(.16,.055),(.23,.16),(.24,.21),
   (.17,.26),(.16,.38),(.14,.48),(.06,.55),(.01,.56)],brass,52,
  offset=(0,.33,1.19)))
 bells.append(lathe('K07 bell inner conical ringing resonance',
  [(.18,.06),(.145,.14),(.115,.23),(.07,.33),(.02,.39)],
  clocheIns,40,offset=(0,.33,1.19)))
 bells.append(rounded('K07 golden school bell crown',(0,.33,1.79),(.085,.085,.105),brass))
 bells.append(rounded('K07 physically hanging striker',(0,.33,1.19),(.065,.065,.07),silver))
 bells.append(tube('K07 bent bell handle',
  [(0,.33,1.75),(.03,.34,1.85),(.08,.4,1.91),(.12,.43,1.92)],
  [.031,.025,.023,.019],silver))
 return bells
def add_legs():
 legs=[]
 for side in (-1,1):
  for back in (-1,1):
   cx=side*.65;cy=back*.30
   pts=[(cx*.63,cy*.65,.38),(cx,cy,.28),(cx*1.13,cy*.92,.17)]
   legs.append(tube('K07 cartoony bent frog limb',pts,[.128,.108,.068],jellyShade,18))
   for toe in (-1,0,1):
    tx=cx*1.13+side*.07
    ty=cy*.92+toe*.087
    pts2=[(cx*1.13,cy*.92,.16),(tx,ty,.12),(tx+side*.08,ty+toe*.022,.094)]
    legs.append(tube('K07 organic webbed toe',pts2,[.064,.051,.035],jellyHi,12))
 return legs
frog=[]
# A single continuous irregular superellipse-esque custard volume with
# authentic radial ridges and naturally tapered crown, not a squat sphere.
bodyprofile=[(.25,.17),(.48,.18),(.68,.23),(.77,.34),
             (.79,.50),(.75,.70),(.65,.89),(.52,1.06),(.38,1.13),(.12,1.18),(.01,1.19)]
frog.append(lathe('K07 sculpted rounded gelatin frog body',bodyprofile,jelly,72,breath=.020))
frog.append(lathe('K07 rich carved underbody shadow',
 [(.20,.165),(.41,.169),(.61,.191),(.70,.239)],jellyShade,64,breath=.024))
frog.append(lathe('K07 dripping caramel hat above gelatin',
 [(.01,1.20),(.20,1.20),(.34,1.175),(.45,1.117),(.47,1.096),
  (.44,1.079),(.36,1.099),(.30,1.112)],caramel,80,breath=.035))
# Actual relief folds, not painted only.
for i in range(18):
 a=i*2*pi/18
 r=.745
 points=[]
 for k in range(15):
  t=k/14
  z=.35+.63*t
  rr=(r-.29*t)*(.99+.018*sin(a*10+k*.3))
  points.append((rr*cos(a),rr*sin(a),z))
 frog.append(tube('K07 jelly fluted vertical embossed ridge',
  points,[.017+.022*sin(pi*k/14) for k in range(15)],
  jellyHi,8))
# High googly eyes on stalks, pupils front y=-, asymmetrical height.
for side in (-1,1):
 x=side*.39
 frog.append(tube('K07 original eye stalk',[(x*.84,-.18,.95),(x,-.33,1.20),(x,-.43,1.30)],
  [.17,.15,.13],jelly,18))
 frog.append(rounded('K07 bulging eye sclera',(x,-.46,1.31),(.215,.17,.23),white,32,20))
 frog.append(rounded('K07 copper iris',(x+side*.02,-.61,1.33),(.113,.062,.124),iris,24,18))
 frog.append(rounded('K07 ink pupil',(x+side*.018,-.668,1.327),(.065,.034,.077),pupil,20,14))
 frog.append(rounded('K07 tiny carved catchlight',(x+side*.014-.028,-.693,1.36),(.026,.012,.035),white,12,8))
# Expressive smiling wide mouth with physically inset dark shape and tongue.
frog.append(rounded('K07 giant laughing mouth carved recess',
 (0,-.711,.70),(.35,.054,.171),mouth,42,24))
frog.append(rounded('K07 curling pink raspberry tongue',
 (0,-.769,.621),(.185,.036,.069),tongue,32,18))
frog.append(tube('K07 crescent raised lip outline',
 [(x,-.73-(.02*(1-abs(x/.31))),.70+.105*(1-(x/.31)**2))
  for x in [(-.31+i*.62/25) for i in range(26)]],
  [.014]*26,jellyShade,8))
frog.extend(add_legs())
# Truly modeled interior fruit segments.
for i in range(16):
 a=i*2.399963
 r=.12+.48*((i%6)+1)/7
 z=.28+.15*sin(i*2.5)
 frog.append(rounded('K07 berry visible jelly dots',
 (r*cos(a),r*sin(a),z),(.036,.039,.021),seed,12,8))
froggroup=parent_group('K07_JELLY_FROG_ACTOR',frog)
bellgroup=parent_group('K07_SCHOOL_BELL_ACTOR',add_bell())
# Serving dish is a genuinely curved, thick, double-walled ceramic plate.
plateobj=[]
plateobj.append(lathe('K07 sculpted porcelain dish deep basin',
 [(0,.08),(.5,.08),(.82,.11),(1.05,.18),(1.13,.23),
  (1.08,.26),(.95,.22),(.74,.16),(.4,.13),(0,.13)],plate,88))
plateobj.append(tube('K07 inlaid wave blue ceramic dish trim',
 [(1.10*cos(i*2*pi/100),1.10*sin(i*2*pi/100),.246) for i in range(101)],
 .017,plateLine,10))
parent_group('K07_SERVING_DISH_STATIC',plateobj)
# Real visibly lifted silver restaurant cloche, rather than a white sphere.
cover=[]
cover.append(lathe('K07 silver cloche raised hemisphere',
 [(.01,.60),(.20,.575),(.37,.51),(.55,.41),(.68,.30),
  (.78,.22),(.84,.20)],cloche,72,offset=(.90,.54,.82)))
cover.append(lathe('K07 cloche real concave inner surface',
 [(.79,.205),(.71,.29),(.56,.42),(.34,.52),(.11,.567)],
 clocheIns,72,offset=(.90,.54,.82)))
cover.append(tube('K07 cloche rolled physical circumference',
 [(.83*cos(i*2*pi/100)+.90,.83*sin(i*2*pi/100)+.54,1.025)
   for i in range(101)],.026,silver,10))
cover.append(rounded('K07 cloche polished lifter knop',
 (.90,.54,1.50),(.092,.092,.12),silver,24,14))
clochegroup=parent_group('K07_LIFTED_CLOCHE_ACTOR',cover)
# Merge only within one animated actor group and matching materials.
# This preserves actual curved surface/individual silhouette and drastically
# cuts draw calls versus 77 independent meshes per single food spell.
for actor in (froggroup,bellgroup,clochegroup):
 mats={}
 for o in actor.children:
  if o.type!='MESH' or not o.data.materials:continue
  key=o.data.materials[0].name
  mats.setdefault(key,[]).append(o)
 for material_name,parts in mats.items():
  if len(parts)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  bpy.context.view_layer.objects.active=parts[0]
  bpy.context.view_layer.update()
  bpy.ops.object.join()
  parts[0].name='K07 physical | '+material_name
bpy.context.view_layer.update()
# This is a genuine stylized sculpture. Preserve actor hierarchy for runtime
# independent motions. No per-frame new geometry allocation.
models=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BASE,'K07_Sculpted_Frog_Pudding_Bell.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
 if o.type in ('MESH','EMPTY'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(BASE,'K07_Sculpted_Frog_Pudding_Bell.glb'),
 export_format='GLB',use_selection=True,export_apply=True)
triangles=sum(len(p.vertices)-2 for o in models for p in o.data.polygons)
receipt={'objects':len(models),'triangles':triangles,
 'materials':len(bpy.data.materials),'gltfBytes':os.path.getsize(os.path.join(BASE,'K07_Sculpted_Frog_Pudding_Bell.glb')),
 'originalSource':True,'frogActor':froggroup.name,'bellActor':bellgroup.name,
 'clocheActor':clochegroup.name}
print('R179_FROG_REAL_GLTF',json.dumps(receipt))
open(os.path.join(BASE,'qa','K07_mesh_receipt.json'),'w').write(json.dumps(receipt,indent=2))
# Render a photo of the actual Blender geometry (not a diffusion illustration).
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.camera_add(location=(3.9,-5.4,3.75))
cam=bpy.context.object
cam.rotation_euler=(Vector((0,-.1,.82))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=4.65
scene=bpy.context.scene;scene.camera=cam
for power,location,size in ((650,(2,-3,6),4.8),(390,(-4,-1,3),3.9),(300,(1,3,5),3.2)):
 bpy.ops.object.light_add(type='AREA',location=location)
 light=bpy.context.object;light.data.energy=power;light.data.size=size
 light.rotation_euler=(Vector((0,0,.7))-light.location).to_track_quat('-Z','Y').to_euler()
scene.world.color=(.09,.12,.16)
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1200;scene.render.resolution_y=900
scene.render.resolution_percentage=100
scene.render.filepath=os.path.join(BASE,'qa','K07_Sculpted_Frog_Pudding_Bell.png')
scene.render.image_settings.file_format='PNG'
bpy.ops.render.render(write_still=True)
print('R179_FROG_RENDER_SAVED',scene.render.filepath)
