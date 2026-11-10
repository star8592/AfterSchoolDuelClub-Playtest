"""R56 exploratory broadcast-owl costume applied to a sourced CC0 skinned owl.
Not production character art. All additions are meshes with bone weights.
"""
import bpy, math, json, hashlib
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
SOURCE=ROOT/'models/BarnOwl.glb'
DEST=HERE/'T01-BroadcastOwl-R56-STUDY.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
owl=next(o for o in bpy.data.objects if o.type=='MESH' and len(o.data.vertices)>200)
for poly in owl.data.polygons:poly.use_smooth=True
# Refine the existing source surface without claiming that this improves the base topology.
surf=owl.modifiers.new('R56_preview_smoothing_ONLY','SUBSURF')
surf.subdivision_type='CATMULL_CLARK';surf.levels=1;surf.render_levels=1
owl.modifiers.move if False else None
def surface(name, color, metal=0.0, rough=.45, emission=0.0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1)
 m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*color,1)
 p.inputs['Metallic'].default_value=metal
 p.inputs['Roughness'].default_value=rough
 if emission:
  p.inputs['Emission Color'].default_value=(*color,1)
  p.inputs['Emission Strength'].default_value=emission
 return m
gold=surface('R56_Champagne_Gold_CoatedMetal',(0.78,.49,.15),.69,.24)
teal=surface('R56_Studio_Teal_Enamel',(.03,.49,.51),.39,.26)
navy=surface('R56_Studio_Navy_Leather',(.012,.035,.077),.07,.47)
cream=surface('R56_Headphone_Cream',(.85,.77,.58),.06,.36)
ruby=surface('R56_Broadcast_Live_Ruby',(.90,.067,.048),.18,.19,1.4)
silver=surface('R56_Microphone_Silver',(.58,.71,.78),.65,.26)
feather=surface('R56_Fancy_Feather_Chest',(.84,.52,.19),.08,.64)
added=[]
def bind(o,bone):
 # Hard-weight rigid costume parts on the source's existing armature bone;
 # same armature and original animations, no static disconnected accessories.
 g=o.vertex_groups.new(name=bone)
 g.add(list(range(len(o.data.vertices))),1.0,'REPLACE')
 m=o.modifiers.new('R56_Rig_Attach_'+bone,'ARMATURE');m.object=arm
 added.append(o)
 return o
def uv_ball(name,loc,scale,material,bone='tr4vzr',segments=24,rings=16):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc)
 o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(material)
 for poly in o.data.polygons:poly.use_smooth=True
 return bind(o,bone)
def tube(name,points,radius,material,bone='tr4vzr'):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=20
 curve.bevel_depth=radius;curve.bevel_resolution=4
 spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
 for point,loc in zip(spline.bezier_points,points):
  point.co=loc;point.handle_left_type='AUTO';point.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.convert(target='MESH');o=bpy.context.object
 o.data.materials.append(material)
 return bind(o,bone)
def cube(name,loc,scale,material,bevel=.08,bone='s25qwr'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
 o=bpy.context.object;o.name=name;o.scale=scale
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 bm=o.modifiers.new('Rounded Edge',type='BEVEL');bm.width=bevel;bm.segments=5
 bpy.context.view_layer.objects.active=o
 bpy.ops.object.modifier_apply(modifier=bm.name)
 o.data.materials.append(material)
 for f in o.data.polygons:f.use_smooth=True
 return bind(o,bone)
def ring(name,loc,major,minor,material,rotate=(0,math.pi/2,0),bone='tr4vzr'):
 bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,
  major_segments=48,minor_segments=10,location=loc,rotation=rotate)
 o=bpy.context.object;o.name=name;o.data.materials.append(material)
 for f in o.data.polygons:f.use_smooth=True
 return bind(o,bone)
# Top headset arch and two ear cups. Original CC0 owl remains unmistakably an owl.
tube('R56_Teal_Padded_Headband',[
 (-1.05,-1.25,-.05),(-1.0,-.65,-.2),(-.62,-.16,-.32),
 (0,.055,-.38),(.62,-.16,-.32),(1.0,-.65,-.2),(1.05,-1.25,-.05)
],.105,navy)
tube('R56_Gold_Headband_Inlay',[
 (-1.04,-1.21,-.14),(-.9,-.5,-.35),(0,.01,-.49),(.9,-.5,-.35),(1.04,-1.21,-.14)
],.031,gold)
for sign,letter in [(-1,'L'),(1,'R')]:
 uv_ball('R56_'+letter+'_Ear_Cushion',(1.05*sign,-1.18,.12),(.205,.35,.285),navy)
 uv_ball('R56_'+letter+'_Studio_Cup',(1.23*sign,-1.18,.12),(.105,.29,.23),teal)
 ring('R56_'+letter+'_Cups_GoldTrim',(1.32*sign,-1.18,.12),.18,.024,gold)
 uv_ball('R56_'+letter+'_Gold_Pivot',(1.38*sign,-1.18,.12),(.045,.065,.065),gold)
# Flexible microphone attached to head/ear cup; jaw height -1.85.
tube('R56_Microphone_Boom',[
 (1.28,-1.38,.1),(1.35,-1.58,.37),(1.17,-1.77,.72),
 (.79,-1.83,1.05),(.46,-1.84,1.18)],.044,silver)
uv_ball('R56_Microphone_Foam',(.43,-1.84,1.18),(.19,.14,.21),navy)
ring('R56_Microphone_Cap_Ring',(.46,-1.84,1.355),.14,.02,gold,(0,0,0))
# Actual body-worn badge and broadcast signal icon, following torso bone.
cube('R56_Campus_Radio_Badge',(.0,-2.43,1.56),(.69,.41,.085),navy,bone='s25qwr')
cube('R56_Campus_Radio_Badge_Center',(.0,-2.43,1.66),(.53,.30,.025),teal,.015,bone='s25qwr')
for sign in [-1,1]:
 uv_ball('R56_Campus_Badge_GoldStar_'+str(sign),(.18*sign,-2.44,1.705),(.035,.035,.019),gold,'s25qwr',14,8)
uv_ball('R56_Live_OnAir_Light',(.0,-2.43,1.71),(.082,.082,.026),ruby,'s25qwr')
tube('R56_Broadcast_Collar',[
 (-.80,-2.0,.70),(-.55,-2.23,1.19),(0,-2.27,1.52),
 (.55,-2.23,1.19),(.80,-2.0,.70)],.055,teal,'s25qwr')
# Decorative amber feather tips on chest of the owl, source-mesh-independent, not skin paint.
for i in range(5):
 x=(i-2)*.16
 uv_ball('R56_Chest_Badge_Feather_'+str(i),(x,-2.76+abs(i-2)*.08,1.41),
  (.055,.21,.035),feather,'s25qwr',14,10)
# Keep original source animation and new skinned accessories in the GLB.
# Export only animated costume meshes and the original source skeleton.
# Do NOT roundtrip the CC0 owl mesh or texture through Blender; the prior
# exploratory full export lost eye/face details in Chrome.
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
for costume in added:costume.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(use_selection=True,filepath=str(DEST),export_format='GLB',
 export_animations=True,export_skins=True,export_yup=True,
 export_materials='EXPORT',export_image_format='AUTO')
# The Blender importer/exporter changes the Y-up facing convention of this
# historic Gobkit source. Add a single GLB scene-root yaw correction so the
# true face, accessories, rig and animation remain together.
import struct
payload=DEST.read_bytes()
magic,version,size=struct.unpack_from('<4sII',payload)
assert magic==b'glTF' and version==2 and size==len(payload)
json_size,json_tag=struct.unpack_from('<I4s',payload,12)
assert json_tag==b'JSON'
obj=json.loads(payload[20:20+json_size].decode('utf-8'))
start=20+json_size
binary=payload[start:]
root_idx=len(obj['nodes'])
scene_idx=obj.get('scene',0)
prev=obj['scenes'][scene_idx]['nodes']
obj['nodes'].append({'name':'R56_Front_Convention_Correction','rotation':[0,1,0,0],'children':prev})
obj['scenes'][scene_idx]['nodes']=[root_idx]
raw=json.dumps(obj,separators=(',',':'),ensure_ascii=False).encode('utf-8')
raw+=b' '*((-len(raw))%4)
header=struct.pack('<4sII',b'glTF',2,12+8+len(raw)+len(binary))
DEST.write_bytes(header+struct.pack('<I4s',len(raw),b'JSON')+raw+binary)
record={
 'source_file':str(SOURCE),'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
 'output':str(DEST),'output_sha256':hashlib.sha256(DEST.read_bytes()).hexdigest(),
 'accessory_only_export':True,
 'added_rigged_meshes':len(added),'original_source':'Gobkit BarnOwl CC0',
 'added_technical_art':'Headband, earmuffs, boom microphone, campus radio badge, uniform collar',
 'source_animations':[a.name for a in bpy.data.actions],
 'status':'TECHNICAL_STUDY_NOT_PRODUCTION',
 'no_approved_original_character_concept':True,
 'production_art_approved':False
}
DEST.with_suffix('.provenance.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print('R56_STUDY_EXPORT',json.dumps(record,ensure_ascii=False))
