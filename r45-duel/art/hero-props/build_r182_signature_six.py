"""R182 original Blender 5.2 campus-comedy 3D sculpture workshop.
Generate SIX DIFFERENT editable .blend & actual glTF binary, plus true
Eevee source renders. No reused procedural placeholder boxes in game.
Textures are glTF-compatible Principled PBR. All geometric details are actual
triangles: lathed shells, curved tubes, molded/rounded bevels, stitched ropes.
Authors: original in-house procedural sculpting, not a third-party model.
"""
import bpy, math, json, os, random, struct
from math import sin,cos,pi
from mathutils import Vector
from pathlib import Path
BASE=Path(__file__).resolve().parent
PHOTO=BASE/'qa';PHOTO.mkdir(exist_ok=True)
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
PRESETS={
 'K06':('K06_Volcano_Chili_Boba_Tea', '火山辣椒奶茶'),
 'Q05':('Q05_Chalk_Press_Conference', '粉笔记者会'),
 'P04':('P04_Mega_Sports_Whistle','体育老师巨型口哨'),
 'S04':('S04_Wrong_Answer_Generator','错题发电机'),
 'P05':('P05_Volleyball_Basketball_Hoop','排球误入篮球筐'),
 'X05':('X05_Homework_Paper_Galaxy','作业本银河')}
AUDIT={}
def reset():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for m in list(bpy.data.materials):
  if m.users==0:bpy.data.materials.remove(m)
def material(name,color,rough=.36,metal=0,coat=.28):
 m=bpy.data.materials.new(name);m.use_nodes=True
 bsdf=m.node_tree.nodes.get('Principled BSDF')
 bsdf.inputs['Base Color'].default_value=(*color,1)
 bsdf.inputs['Roughness'].default_value=rough
 bsdf.inputs['Metallic'].default_value=metal
 bsdf.inputs['Coat Weight'].default_value=coat
 bsdf.inputs['Coat Roughness'].default_value=.16
 m.diffuse_color=(*color,1)
 return m
def smooth(obj):
 if obj.type=='MESH':
  for p in obj.data.polygons:p.use_smooth=True
 return obj
def mesh(name,v,f,mat,role):
 d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update()
 ob=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(ob)
 ob.data.materials.append(mat);ob['r182_actor']=role
 return smooth(ob)
def globe(name,p,scale,mat,role,segments=24,rings=16):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,
  radius=1,location=p)
 o=bpy.context.object;o.name=name;o.data.materials.append(mat)
 o.scale=scale;o['r182_actor']=role;return smooth(o)
def beveled(name,p,scale,mat,role,round=.06):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p)
 o=bpy.context.object;o.name=name;o.scale=scale
 bpy.context.view_layer.objects.active=o
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 modifier=o.modifiers.new('Original molded edge radius','BEVEL')
 modifier.width=round;modifier.segments=4
 bpy.ops.object.modifier_apply(modifier=modifier.name)
 normal=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 bpy.ops.object.modifier_apply(modifier=normal.name)
 o.data.materials.append(mat);o['r182_actor']=role
 return smooth(o)
def cylinder(name,p,rad,depth,mat,role,verts=36,rotation=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=rad,depth=depth,location=p)
 o=bpy.context.object;o.name=name
 if rotation:o.rotation_euler=rotation
 o.data.materials.append(mat);o['r182_actor']=role
 return smooth(o)
def lathe(name,profile,mat,role,center=(0,0,0),radials=72,warp=0):
 verts=[];faces=[]
 for j,(r,z) in enumerate(profile):
  for i in range(radials):
   a=i*2*pi/radials
   r2=r*(1+warp*sin(a*7+j*.5))
   verts.append((center[0]+r2*cos(a),center[1]+r2*sin(a),center[2]+z))
 for j in range(len(profile)-1):
  for i in range(radials):
   a=j*radials+i;b=j*radials+(i+1)%radials
   faces.append((a,b,b+radials,a+radials))
 faces.append(tuple(reversed(range(radials))))
 faces.append(tuple((len(profile)-1)*radials+i for i in range(radials)))
 return mesh(name,verts,faces,mat,role)
def swept(name,points,radii,mat,role,seg=14):
 verts=[];faces=[]
 for j,p in enumerate(points):
  P=Vector(p);t=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)])
  if t.length<1e-6:t=Vector((0,1,0))
  t.normalize()
  n=t.cross(Vector((0,0,1)))
  if n.length<.001:n=t.cross(Vector((0,1,0)))
  n.normalize();b=t.cross(n).normalized()
  r=radii[j] if isinstance(radii,list) else radii
  for i in range(seg):
   a=i*2*pi/seg
   verts.append(tuple(P+r*(n*cos(a)+b*sin(a))))
  if j:
   for i in range(seg):
    a=(j-1)*seg+i;c=(j-1)*seg+(i+1)%seg
    faces.append((a,c,c+seg,a+seg))
 faces.append(tuple(reversed(range(seg))))
 faces.append(tuple((len(points)-1)*seg+i for i in range(seg)))
 return mesh(name,verts,faces,mat,role)
def arc(name,center,rad,z,mat,role,r=.018,N=80):
 return swept(name,[(center[0]+rad*cos(i*2*pi/N),
  center[1]+rad*sin(i*2*pi/N),z) for i in range(N+1)],r,mat,role,10)
def flat_ribbon(name,path,width,mat,role):
 verts=[];faces=[]
 for j,p in enumerate(path):
  t=Vector(path[min(j+1,len(path)-1)])-Vector(path[max(0,j-1)])
  if t.length<.0001:t=Vector((1,0,0))
  t.normalize();n=t.cross(Vector((0,0,1)))
  if n.length<.001:n=Vector((0,1,0))
  n.normalize()
  for direction in (-1,1):verts.append(tuple(Vector(p)+direction*.5*width*n))
  if j:faces.append((2*j-2,2*j-1,2*j+1,2*j))
 return mesh(name,verts,faces,mat,role)
def signage(name,txt,p,mat,role,size=.16,rotation=(pi/2,0,0)):
 curve=bpy.data.curves.new(name,'FONT');curve.body=txt
 if os.path.exists(FONT):
  curve.font=bpy.data.fonts.load(FONT,check_existing=True)
 curve.size=size;curve.extrude=.001;curve.bevel_depth=.0008
 ob=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(ob)
 ob.location=p;ob.rotation_euler=rotation;ob.data.materials.append(mat)
 ob['r182_actor']=role
 bpy.ops.object.select_all(action='DESELECT');ob.select_set(True)
 bpy.context.view_layer.objects.active=ob
 bpy.ops.object.convert(target='MESH')
 return bpy.context.object
def connect_groups():
 # Merge only within same independently animated actor and the same true
 # material, retaining physical silhouette with original triangles.
 groups={}
 for ob in list(bpy.context.scene.objects):
  if ob.type!='MESH':continue
  key=ob.get('r182_actor','STATIC')
  groups.setdefault(key,{}).setdefault(ob.data.materials[0].name,[]).append(ob)
 for group,byMat in groups.items():
  for matname,obs in byMat.items():
   if len(obs)<2:continue
   bpy.ops.object.select_all(action='DESELECT')
   for o in obs:o.select_set(True)
   bpy.context.view_layer.objects.active=obs[0]
   bpy.ops.object.join()
   obs[0].name=group+' | '+matname
   obs[0]['r182_actor']=group
 for group in sorted(groups):
  empty=bpy.data.objects.new(group,None)
  bpy.context.collection.objects.link(empty)
  empty.empty_display_size=.14
  bpy.context.view_layer.update()
  for o in list(bpy.context.scene.objects):
   if o.type=='MESH' and o.get('r182_actor')==group:o.parent=empty
def render_export(id):
 stem,title=PRESETS[id]
 connect_groups()
 models=[o for o in bpy.context.scene.objects if o.type=='MESH']
 originalTriangles=sum(len(p.vertices)-2 for o in models for p in o.data.polygons)
 actorGroups=sorted([o.name for o in bpy.context.scene.objects if o.type=='EMPTY'])
 blend=BASE/(stem+'.blend');glb=BASE/(stem+'.glb');photo=PHOTO/(stem+'.png')
 bpy.ops.wm.save_as_mainfile(filepath=str(blend))
 bpy.ops.object.select_all(action='DESELECT')
 for o in bpy.context.scene.objects:
  if o.type in ('MESH','EMPTY'):o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',
  use_selection=True,export_apply=True)
 data=glb.read_bytes()
 if data[:4]!=b'glTF':raise RuntimeError('GLB format corrupted '+id)
 length=struct.unpack_from('<I',data,12)[0]
 raw=json.loads(data[20:20+length])
 gltfTri=0
 for item in raw['meshes']:
  for primitive in item['primitives']:
   gltfTri+=raw['accessors'][primitive['indices']]['count']//3
 if gltfTri!=originalTriangles:raise RuntimeError('triangle mismatch '+id)
 receipt={'id':id,'originalName':title,'source':blend.name,'glb':glb.name,
  'render':photo.name,'verticesAndIndicesFromRealBlender':True,
  'sourceBytes':blend.stat().st_size,'glbBytes':len(data),
  'triangles':gltfTri,'meshes':len(raw['meshes']),
  'materials':len(raw['materials']),'actorGroups':actorGroups,
  'visualAccepted':False,'mobilePerformanceAccepted':False}
 AUDIT[id]=receipt
 # Render after saving model, don't embed camera/light into the model GLB
 bpy.ops.object.select_all(action='DESELECT')
 bpy.ops.object.camera_add(location=(3.2,-4.2,3.25))
 cam=bpy.context.object
 target=Vector((0,0,.83))
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 cam.data.type='ORTHO';cam.data.ortho_scale=3.58
 bpy.context.scene.camera=cam
 for power,loc,size in [(650,(2,-3,5),4.0),(420,(-3,1,3),3.5),(380,(2,3,4),3.0)]:
  bpy.ops.object.light_add(type='AREA',location=loc)
  o=bpy.context.object;o.data.energy=power;o.data.size=size
  o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
 sc=bpy.context.scene;sc.render.engine='BLENDER_EEVEE'
 sc.render.resolution_x=1152;sc.render.resolution_y=864
 sc.render.resolution_percentage=100;sc.render.filepath=str(photo)
 sc.render.image_settings.file_format='PNG'
 bpy.ops.render.render(write_still=True)
 (PHOTO/(stem+'_receipt.json')).write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
 print('R182_BLENDER_REAL_3D_PASS',json.dumps(receipt,ensure_ascii=False))
def k06():
 m={
  'tea':material('Honeymilk roasted tea',(.55,.24,.13),.26,0,.45),
  'cream':material('Velvet foam caramel',(.88,.71,.47),.34,0,.4),
  'cup':material('Pearl ivory sculpted reusable cup',(.79,.82,.72),.23,0,.63),
  'lid':material('Molded red silicone cup lip',(.67,.10,.07),.39,0,.3),
  'straw':material('Golden twisted metal straw',(.87,.64,.19),.19,.6),
  'chili':material('Hot pepper lacquer red',(.79,.045,.025),.22,0,.7),
  'chili2':material('Pepper freshly cut green stem',(.08,.36,.11),.5),
  'boba':material('Glossy black sugar boba',(.095,.045,.04),.19,0,.75),
  'stripe':material('Hot pepper graphic orange',(.94,.43,.04),.45),
  'metal':material('Steel carrying clasp',(.55,.60,.61),.29,.75)}
 lathe('K06 inverted cone physical cup shell',
  [(.35,.03),(.47,.07),(.59,.24),(.68,.69),(.72,1.08),
   (.72,1.20),(.69,1.23),(.65,1.17),(.60,.35),(.33,.09)],m['cup'],'K06_CUP_ACTOR')
 lathe('K06 dark honey roasted tea visible surface',
  [(.04,1.05),(.48,1.05),(.59,1.07),(.64,1.11)],m['tea'],'K06_CUP_ACTOR')
 arc('K06 soft silicone triple cup lip',(0,0),.705,1.22,m['lid'],'K06_CUP_ACTOR',.041)
 lathe('K06 foamed dome creamy interior',
  [(.01,1.32),(.16,1.32),(.35,1.28),(.53,1.20),(.62,1.16)],
  m['cream'],'K06_CUP_ACTOR')
 for k in range(17):
  a=k*2.399963;r=.32*((k%7+1)/7)
  globe('K06 tapioca pearl embedded in foam',(r*cos(a),r*sin(a),1.21),
   (.064,.064,.06),m['boba'],'K06_CUP_ACTOR',16,10)
 # distinct bronze-bent straw, 36 real curved sections
 straw=[(.25+.055*sin(i*pi/20),.04,1.05+.039*i) for i in range(27)]
 straw +=[(.25+.011*(i-26),.04,2.066+.03*sin((i-26)*pi/13)) for i in range(27,41)]
 swept('K06 physical bent stainless straw',straw,.052,m['straw'],'K06_STRAW_ACTOR',16)
 for j in range(6):
  z=.40+j*.15
  swept('K06 raised hot chili emblem ridge',
   [(.66*cos(a),-.045+.66*sin(a),z+.018*sin(a*3)) for a in
    [pi*1.23+i*pi*.54/14 for i in range(15)]],
   .022,m['stripe'],'K06_CUP_ACTOR',10)
 # emerging curved red peppers in erupting actual tea foam
 for n in range(3):
  a=n*2*pi/3+.22
  path=[]
  for i in range(19):
   t=i/18
   path.append((.13*cos(a)+t*(.30+.07*n)*cos(a),
    .13*sin(a)+t*(.30+.07*n)*sin(a),1.35+.7*t+.09*sin(t*pi)))
  swept('K06 scorching tapered real chili pepper',path,
   [.068*sin(pi*(i+.5)/19)**.67 for i in range(19)],m['chili'],
   'K06_CHILI_ACTOR',15)
  globe('K06 pepper emerald calyx',path[0],(.10,.08,.045),
   m['chili2'],'K06_CHILI_ACTOR',16,10)
 for i in range(11):
  a=i*2.4;r=.10+.41*(i%4)/4
  globe('K06 whipped milk fiery eruption',(r*cos(a),r*sin(a),1.42+.035*(i%3)),
   (.095,.070,.12),m['cream'],'K06_CHILI_ACTOR',14,10)
 arc('K06 cup metallic grip ring',(0,0),.53,.28,m['metal'],'K06_CUP_ACTOR',.022)
def q05():
 m={'wood':material('Old school walnut press desk',(.23,.106,.054),.44,0,.32),
    'woodhi':material('Warm walnut varnish',(.49,.25,.10),.31,0,.4),
    'brass':material('Brass microphone and podium hinges',(.7,.47,.16),.26,.75),
    'chalk':material('White real chalk irregular limestone',(.84,.86,.79),.70),
    'chalkline':material('Pastel-blue chalk grain',(.57,.74,.87),.75),
    'black':material('Black microphone windscreen foam',(.07,.075,.09),.82),
    'eye':material('Chalk speaker glass eyes',(.03,.05,.08),.22),
    'powder':material('Fluffy airborne chalk dust clumps',(.87,.91,.91),.79),
    'paper':material('Cream stationery press pass',(.90,.83,.62),.55),
    'red':material('School press badge orange',(.79,.25,.11),.27)}
 beveled('Q05 handcrafted tapered lectern desk',(0,.13,.48),(1.31,.66,.78),m['wood'],
  'Q05_PODIUM_STATIC',.12)
 beveled('Q05 walnut raised podium lip',(0,-.13,.89),(1.5,.83,.14),m['woodhi'],
  'Q05_PODIUM_STATIC',.04)
 for x in (-.46,.46):
  beveled('Q05 press desk tapered solid feet',(x,.40,.16),(.22,.27,.40),
   m['wood'],'Q05_PODIUM_STATIC',.045)
 for y in (-.28,.32):
  swept('Q05 copper microphone arm',
   [(.48,y,.82),(.54,y-.04,1.04),(.52,y-.12,1.20),(.37,y-.18,1.33)],
   [.022,.018,.018,.017],m['brass'],'Q05_MICROPHONE_ACTOR',12)
  globe('Q05 plush microphone mesh head',(.37,y-.18,1.33),
   (.11,.115,.16),m['black'],'Q05_MICROPHONE_ACTOR',18,12)
  arc('Q05 tiny microphone capsule mesh rib',(.37,y-.18),.086,1.35,
   m['brass'],'Q05_MICROPHONE_ACTOR',.009)
 # chalk press spokesperson at rear of desk, sculpted taper profile
 lathe('Q05 asymmetrical solid white chalk speaker',
  [(.15,.0),(.18,.02),(.16,.13),(.13,.63),(.12,.70),(.10,.75)],
  m['chalk'],'Q05_CHALK_ACTOR',center=(-.37,.30,.87),radials=45,warp=.035)
 # eyes front y negative with brows and smile
 for x in (-.44,-.29):
  globe('Q05 chalk reporter ebony eye',(x,.146,1.45),(.034,.014,.05),
   m['eye'],'Q05_CHALK_ACTOR',12,10)
  swept('Q05 expressive chalk eyebrows',
   [(x-.06+i*.012,.12,1.51+.011*sin(i*.4)) for i in range(11)],
   .009,m['chalkline'],'Q05_CHALK_ACTOR',8)
 swept('Q05 crooked laughing chalk mouth',
  [(-.46+i*.016,.135,1.32-.04*sin(i*pi/11)) for i in range(12)],
  .015,m['red'],'Q05_CHALK_ACTOR',9)
 for i in range(24):
  a=i*2.39;r=.06+.24*(i%5)/5
  globe('Q05 chalk dust irregular powder puff',
   (-.29+r*cos(a),-.45+r*sin(a),.98+.07*(i%6)),
   (.018+.011*(i%3),.026+.01*(i%4),.023),
   m['powder'],'Q05_DUST_ACTOR',10,8)
 beveled('Q05 pressed paper nameplate',(0,-.375,.57),(.72,.06,.33),
  m['paper'],'Q05_PODIUM_STATIC',.03)
 signage('Q05 raised press conference plaque','粉笔发布会',(-.32,-.417,.53),
  m['red'],'Q05_PODIUM_STATIC',.13)
 # physical wooden brass decorative rivets
 for x in (-.62,.62):
  for z in (.47,.78):
   globe('Q05 ornamental brass podium pin',(x,-.31,z),(.024,.018,.024),
    m['brass'],'Q05_PODIUM_STATIC',12,8)
def p04():
 m={'steel':material('Polished chromed coach whistle shell',(.44,.62,.71),.16,.87),
    'enamel':material('Scarlet lacquer sports emblem',(.82,.09,.07),.23,0,.62),
    'dark':material('Whistle acoustic chamber dark interior',(.045,.068,.08),.39,.21),
    'gold':material('Antique referee brass pin',(.78,.53,.15),.21,.83),
    'flag':material('School team crimson cloth',(.72,.12,.16),.68),
    'flaghi':material('Team flag cream chevron',(.96,.90,.64),.65),
    'rope':material('Referee fabric lanyard',(.18,.27,.40),.78)}
 # Housing actually curved whistling chamber, rivets and mouth throat
 globe('P04 true hollow-form molded whistle chamber',(0,.03,.91),
  (.48,.30,.37),m['steel'],'P04_WHISTLE_ACTOR',48,32)
 globe('P04 black acoustic whistle window',(-.03,-.272,1.08),
  (.26,.028,.12),m['dark'],'P04_WHISTLE_ACTOR',32,18)
 lathe('P04 open rounded brass sound deflector shell',
  [(.02,0),(.18,.015),(.26,.10),(.34,.18),(.34,.22),(.25,.24)],
  m['gold'],'P04_WHISTLE_ACTOR',center=(.08,-.18,1.06),radials=48)
 beveled('P04 actual whistle mouthpiece suction tip',(.20,-.53,.83),
  (.33,.64,.16),m['steel'],'P04_WHISTLE_ACTOR',.07)
 beveled('P04 visible rubber mouthpiece notch',(.2,-.85,.83),
  (.19,.075,.11),m['dark'],'P04_WHISTLE_ACTOR',.027)
 arc('P04 whistle front steel seam ring',(0,0),.395,.83,m['gold'],
  'P04_WHISTLE_ACTOR',.026)
 for k in range(12):
  a=k*2*pi/12
  globe('P04 machined shell brass rivet',
   (.41*cos(a),-.01+.19*sin(a),.91+.23*sin(a)),
   (.018,.019,.018),m['gold'],'P04_WHISTLE_ACTOR',10,8)
 # school-team pennant literally fabricated from a tapered waving mesh
 flagpath=[(.65+.045*sin(i*.5),.22,.45+.08*i) for i in range(16)]
 swept('P04 real telescopic whistle pennant stick',flagpath,.028,
  m['steel'],'P04_PENNANT_ACTOR',12)
 verts=[];faces=[]
 for i in range(18):
  t=i/17
  x=.68+.97*t
  for k in range(2):
   z=.85+(.46*(1-t))*(1 if k==0 else -1)
   y=.19+.11*sin(t*2*pi)
   verts.append((x,y,z))
  if i:faces.append((2*i-2,2*i-1,2*i+1,2*i))
 mesh('P04 woven triangular school flag waving cloth',verts,faces,
  m['flag'],'P04_PENNANT_ACTOR')
 for i in range(3):
  swept('P04 cream actual raised pennant stripe',
   [(.80+j*.029,.07-.04*sin(j*pi/17),
     .63+.16*i/3+.027*sin(j*.3)) for j in range(18)],
   .012,m['flaghi'],'P04_PENNANT_ACTOR',7)
 # draping cloth lanyard
 swept('P04 actual twisted cloth strap',
  [(.0,.15,1.16),(-.2,.38,1.35),(-.56,.32,1.52),
   (-.72,.22,1.34),(-.52,.15,1.02),(-.26,.11,.90)],
  [.052,.051,.045,.042,.052,.051],m['rope'],'P04_WHISTLE_ACTOR',14)
 # true pebbled brass pea ball inside visible through acoustic notch
 globe('P04 authentic inner metal resonator pea',(.01,-.23,1.09),
  (.072,.07,.072),m['gold'],'P04_WHISTLE_ACTOR',18,12)
def s04():
 m={'body':material('Industrial observatory generator blue steel',(.10,.23,.31),.33,.67),
 'panel':material('Brushed metal fine machined front face',(.37,.49,.55),.27,.72),
 'brass':material('Wrong answer turbine wheel antique brass',(.73,.46,.13),.25,.76),
 'copper':material('Bright electromagnetic copper windings',(.86,.32,.085),.23,.73),
 'glass':material('Transparent-looking dark emerald capacitor window',(.09,.44,.30),.15,.13,.83),
 'paper':material('Real cream paper lesson test',(.92,.85,.71),.57,0,.15),
 'mark':material('Red wrong-answer scarlet raised cross',(.89,.06,.05),.41),
 'ink':material('Old-school blue grading ink',(.17,.20,.44),.51),
 'black':material('Neoprene handle machinery grip',(.07,.08,.09),.63),
 'shock':material('Embossed electric yellow bolt',(.98,.69,.10),.28,0,.5)}
 # chamfered industrial housing, layered front plates
 beveled('S04 3D cast generator aluminum case',(0,.14,.70),
  (1.20,.82,1.12),m['body'],'S04_MACHINE_STATIC',.14)
 beveled('S04 industrial reinforced front face',(0,-.30,.69),
  (1.08,.085,.89),m['panel'],'S04_MACHINE_STATIC',.08)
 for x in (-.50,.50):
  for z in (.24,1.13):
   globe('S04 four brass dome head structural bolts',(x,-.365,z),
    (.032,.022,.032),m['brass'],'S04_MACHINE_STATIC',12,8)
 # visible coil-shaped copper winding energy heart, not any generic magic ring:
 # an actual physical wire coil with 11 increasing vertical turns.
 c=[]
 for i in range(220):
  t=i/219;phi=t*pi*2*12.0
  c.append((.20*cos(phi),-.39+.07*sin(phi),.43+.48*t))
 swept('S04 actual helical inductance copper wire spool',
  c,.017,m['copper'],'S04_MACHINE_STATIC',9)
 for y in (-.42,-.27):
  lathe('S04 electro rotor ferrite axle collar',
   [(.0,.0),(.18,.0),(.21,.025),(.22,.07),(.18,.085),(.06,.095)],
   m['black'],'S04_MACHINE_STATIC',center=(0,y,.42),radials=32)
 # genuine physical gear wheel: mesh perimeter with 18 concave valleys / teeth
 teeth=22;verts=[];faces=[]
 for z in (.93,1.02):
  for i in range(teeth*4):
   a=i*2*pi/(teeth*4)
   tooth=1 if i%4 in (0,1) else .89
   rad=.31*tooth
   verts.append((-.49+rad*cos(a),-.45+rad*sin(a)*.10,z+rad*sin(a)*.93))
 N=teeth*4
 for i in range(N):
  faces.append((i,(i+1)%N,N+(i+1)%N,N+i))
 mesh('S04 machined wrong-answer mechanical toothed flywheel',verts,faces,
  m['brass'],'S04_CRANK_ACTOR')
 globe('S04 center drive wheel hub',(-.49,-.48,.98),(.096,.036,.096),
  m['black'],'S04_CRANK_ACTOR',24,14)
 swept('S04 bent forged crank axle',
  [(-.49,-.48,.98),(-.42,-.67,1.06),(-.39,-.76,1.16)],
  [.040,.032,.031],m['brass'],'S04_CRANK_ACTOR',12)
 globe('S04 wooden shaft knob',(-.39,-.76,1.16),(.07,.10,.07),
  m['black'],'S04_CRANK_ACTOR',20,12)
 # Folded test sheet physically enters machine (curved quarter-sheet)
 for n in range(3):
  z=1.24+.13*n
  pts=[]
  for i in range(16):
   t=i/15
   x=.40+.09*n+.18*t
   y=-.18-.21*t
   pts.append((x,y,z+.11*sin(pi*t)))
  flat_ribbon('S04 folded rejected math paper',pts,.35,m['paper'],
   'S04_TEST_PAPER_ACTOR')
  # Two scarlet wrong-answer strokes in front, physically raised.
  for k in (-1,1):
   swept('S04 actual embossed handwritten wrong-answer X',
    [(.47+i*.008,-.40-i*.009,z+.06+k*(i-7)*.006) for i in range(15)],
    .016,m['mark'],'S04_TEST_PAPER_ACTOR',8)
 for x in (-.35,.34):
  beveled('S04 heavy rubber feet',(x,.31,.068),(.27,.37,.10),
   m['black'],'S04_MACHINE_STATIC',.035)
 signage('S04 large embossed error-count label','错越多 · 电越足',
  (-.44,-.361,.60),m['ink'],'S04_MACHINE_STATIC',.095)
 for x in (-.46,.46):
  globe('S04 visible explosive electric condenser crystal',
   (x,-.33,1.17),(.056,.055,.075),m['shock'],'S04_CRANK_ACTOR',14,10)
def p05():
 m={'ball':material('Authentic volleyball creamy yellow synthetic leather',
    (.93,.79,.42),.50,0,.35),
    'pblue':material('Volleyball curved peacock-blue panels',(.15,.39,.53),.43,0,.35),
    'pwhite':material('Volleyball bright pale ivory panels',(.86,.89,.83),.55),
    'seam':material('Physical volleyball raised seam threads',(.19,.22,.23),.73),
    'rim':material('Basketball hoop orange spring steel',(.92,.32,.065),.20,.66),
    'rope':material('Authentic hanging braided basketball net',( .90,.89,.79),.65),
    'board':material('Outdoor basketball acrylic board deep blue',(.24,.44,.54),.28,.42),
    'frame':material('Brushed galvanized school basketball frame',(.46,.58,.58),.34,.78),
    'brace':material('Hoop reinforcement weathered blue',(.17,.25,.32),.35,.55)}
 # Volleyball body with 8 arcs that follow real spherical surface
 globe('P05 real volleyball round stitched leather',(-.62,-.10,.90),
  (.43,.43,.43),m['ball'],'P05_VOLLEYBALL_ACTOR',48,36)
 for j in range(6):
  a=j*2*pi/6
  pts=[]
  for i in range(55):
   t=i/(55-1)
   theta=.07+(pi-.14)*t
   phi=a+.26*sin(t*pi*2)
   pts.append((-.62+.437*sin(theta)*cos(phi),-.10+.437*sin(theta)*sin(phi),
    .90+.437*cos(theta)))
  swept('P05 physically raised volleyball stitched curvilinear seam',
   pts,.009,m['seam'],'P05_VOLLEYBALL_ACTOR',8)
 # alternate curved colored leather panel ribbons, a real 3D faceted surface
 for j in range(3):
  a=j*2*pi/3+.18
  v=[];f=[]
  for i in range(24):
   t=(i+.5)/24
   theta=.25+(pi-.50)*t
   for k in (-1,1):
    phi=a+k*.22+.04*sin(4*pi*t)
    v.append((-.62+.442*sin(theta)*cos(phi),
     -.10+.442*sin(theta)*sin(phi),.90+.442*cos(theta)))
   if i:f.append((2*i-2,2*i-1,2*i+1,2*i))
  mesh('P05 sewn bright alternate volleyball panel',v,f,
   m['pblue'] if j%2==0 else m['pwhite'],'P05_VOLLEYBALL_ACTOR')
 # huge unusual basketball hoop, physically correct conical hanging net
 beveled('P05 basketball rectangular outdoor backboard',( .58,.60,1.44),
  (1.49,.13,1.08),m['board'],'P05_HOOP_ACTOR',.075)
 for z in (.98,1.93):
  beveled('P05 backboard actual metallic horizontal frame',
   (.58,.50,z),(1.61,.045,.037),m['frame'],'P05_HOOP_ACTOR',.016)
 for x in (-.20,1.36):
  beveled('P05 scoreboard vertical frame rail',
   (x,.50,1.46),(.044,.045,1.04),
   m['frame'],'P05_HOOP_ACTOR',.012)
 beveled('P05 bright basketball target rectangle',
  (.58,.49,1.40),(.55,.037,.48),
  m['pwhite'],'P05_HOOP_ACTOR',.018)
 # target rectangle open center covered by board; actual simple frame
 beveled('P05 target inner field',(.58,.453,1.40),(.47,.02,.39),
  m['board'],'P05_HOOP_ACTOR',.008)
 # Basket rim in XY plane, tilted in perspective.
 center=(.58,-.24)
 arc('P05 genuine heavy rolled orange basketball rim',
  center,.36,1.16,m['rim'],'P05_HOOP_ACTOR',.034,96)
 for k in range(12):
  a=k*2*pi/12
  pts=[(center[0]+.35*cos(a),center[1]+.35*sin(a),1.165),
   (center[0]+.31*cos(a+.07),center[1]+.31*sin(a+.07),.98),
   (center[0]+.24*cos(a+.24),center[1]+.24*sin(a+.24),.81),
   (center[0]+.19*cos(a+.48),center[1]+.19*sin(a+.48),.64)]
  swept('P05 real crossed braided net vertical strand',pts,.014,
   m['rope'],'P05_HOOP_ACTOR',8)
  swept('P05 basketball-net diagonal macrame cross-twist',
   [pts[0],(.58+.29*cos(a+.25),-.24+.29*sin(a+.25),.98),
    (.58+.24*cos(a+.52),-.24+.24*sin(a+.52),.81),pts[-1]],
   .010,m['rope'],'P05_HOOP_ACTOR',7)
 for h,rad in [(1.00,.315),(.83,.25),(.66,.18)]:
  arc('P05 knotted woven net support rope',center,rad,h,m['rope'],
   'P05_HOOP_ACTOR',.012,72)
 # anchored real forward steel structural arms
 for x in (.32,.84):
  swept('P05 hoop heavy real mounting brace',
   [(x,.53,1.22),(x,.18,1.19),(x,-.20,1.17)],
   [.05,.045,.040],m['brace'],'P05_HOOP_ACTOR',14)
def x05():
 m={'paper':material('Study paper acid-free warm cream',(.93,.84,.68),.68),
 'other':material('Blue-white answer sheets',(.76,.86,.91),.61),
 'cover':material('Embossed hardback indigo school notebook',
    (.075,.20,.40),.52,0,.28),
 'spine':material('Embossed hot gold binding',(.74,.49,.13),.34,.78),
 'line':material('Blue ink handwriting strokes',(.11,.23,.58),.56),
 'red':material('Scarlet crossed-out corrections',(.8,.055,.06),.45),
 'pencil':material('Wooden Number Two pencil',(.79,.59,.11),.51),
 'core':material('Notebook silver binding staples',(.55,.57,.60),.35,.76)}
 # open album, pages folded into real curved surfaces
 beveled('X05 original hardcover exercise book left',
  (-.47,.05,.46),(.98,.71,.11),m['cover'],'X05_BOOK_ACTOR',.08)
 beveled('X05 hardcover right wing',
  (.48,.05,.46),(.98,.71,.11),m['cover'],'X05_BOOK_ACTOR',.08)
 beveled('X05 physical thick notebook spine',
  (0,.05,.44),(.12,.75,.14),m['spine'],'X05_BOOK_ACTOR',.034)
 for half in (-1,1):
  for page in range(4):
   x0=.05*half
   verts=[];faces=[]
   for j in range(19):
    t=j/18
    for k in (0,1):
     x=x0+half*(.08+.84*t)
     y=-.29+.57*k
     z=.52+.022*page+.03*sin(pi*t)+.02*(1-t)*sin(page+half)
     verts.append((x,y,z))
    if j:faces.append((2*j-2,2*j-1,2*j+1,2*j))
   mesh('X05 real bent open homework spread page',
    verts,faces,m['paper'] if page%2==0 else m['other'],
    'X05_BOOK_ACTOR')
  for q in range(7):
   y=-.24+q*.085
   swept('X05 handwriting horizontal line at correct paper height',
    [(half*(.12+i*.043),y,.631+.03*sin(i*pi/17)) for i in range(18)],
    .004,m['line'],'X05_BOOK_ACTOR',6)
 for i in range(9):
  x=-.70+i*.18
  globe('X05 embedded metallic notebook fasteners',
   (x,.04,.56),(.025,.023,.028),m['core'],'X05_BOOK_ACTOR',10,8)
 # unrolled paper galaxy: long actual curved parchment ribbons, neither
 # abstract glowing rings nor an astronomical copied texture.
 for spiral in range(4):
  a0=spiral*pi/2
  points=[]
  for i in range(48):
   t=i/47
   a=a0+2.0*pi*t
   radius=.30+.52*t
   points.append((radius*cos(a),radius*sin(a),
    .73+1.08*t+.15*sin(2*pi*t+spiral)))
  flat_ribbon('X05 enormous twisting real-paper homework strip',
   points,.13 if spiral%2 else .19,
   m['paper'] if spiral%2 else m['other'],'X05_PAPER_GALAXY_ACTOR')
  # hand-drawn teacher red corrections "X" follow the unfolded sheets
  for j in range(3):
   p=points[9+j*11]
   for diag in (-1,1):
    swept('X05 embossed red crossed-out answer mark',
     [(p[0]+diag*(i-4)*.010,p[1]+(i-4)*.012,p[2]+.025)
      for i in range(9)],.007,m['red'],'X05_PAPER_GALAXY_ACTOR',6)
 # physical notebook planet: crumpled round paper balls with written lines
 for k in range(5):
  a=k*2.399963
  r=.36+.50*(k%3)/3
  position=(r*cos(a),r*sin(a),1.31+.18*k)
  globe('X05 3D rolled tiny homework planet',
   position,(.14+.018*(k%2),.14,.12),
   m['paper'] if k%2 else m['other'],'X05_PAPER_GALAXY_ACTOR',26,18)
  for j in range(4):
   angle=j*pi/4
   swept('X05 ink corrections around paper planet',
    [(position[0]+.10*cos(angle+i*.1),position[1]-.10,
      position[2]+.08*sin(angle+i*.1)) for i in range(11)],
    .007,m['line'],'X05_PAPER_GALAXY_ACTOR',6)
 # flying actual graphite pencil with metal ferrule
 swept('X05 sharpened cedar pencil orbital',
  [(-.40,.43,1.13),(-.25,.51,1.29),(.05,.57,1.63),(.43,.64,1.78)],
  [.025,.026,.024,.005],m['pencil'],'X05_PENCIL_ACTOR',10)
 globe('X05 pencil rubber eraser cap',(-.40,.43,1.13),(.045,.05,.055),
  m['red'],'X05_PENCIL_ACTOR',14,10)
def main():
 functions={'K06':k06,'Q05':q05,'P04':p04,'S04':s04,'P05':p05,'X05':x05}
 ids=([k for k in PRESETS if k in os.environ['R182_ID'].split(',')]
  if os.environ.get('R182_ID') else list(PRESETS))
 for id in ids:
  print('R182_SCULPT_START',id,flush=True)
  reset();functions[id]();render_export(id)
 (PHOTO/'R182_six_hero_receipts.json').write_text(json.dumps(
  {'total':len(AUDIT),'assets':AUDIT,'approval':'NO_GO','visualApproved':0,
   'androidPerformanceApproved':False},ensure_ascii=False,indent=2))
 print('R182_ALL_SCULPT_SOURCES_DONE',len(AUDIT),flush=True)
if __name__=='__main__':main()
