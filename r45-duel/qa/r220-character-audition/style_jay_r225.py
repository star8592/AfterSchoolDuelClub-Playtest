"""R225 isolated Blender wardrobe, faithful to W49 skinned-mesh approach.
Runs inside the R224 original GLB import/animation authoring context.
Do not apply on production main or duplicate material source ownership.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector, kdtree
from collections import Counter
ASSET_DIR=ROOT/'assets'
body=next(o for o in bpy.context.scene.objects if o.type=='MESH' and len(o.data.vertices)>15000)
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
mesh=body.data
vgroup_name={g.index:g.name for g in body.vertex_groups}
BONE_GROUPS={'Hips','Spine02','Spine01','Spine','LeftShoulder','RightShoulder'}
SLEEVE_GROUPS={'LeftArm','RightArm'}
SHOULDER_GROUPS={'LeftShoulder','RightShoulder'}
def fabric_mat(kind):
 m=bpy.data.materials.new('R225_FABRIC_'+kind)
 m.use_nodes=True
 shader=m.node_tree.nodes.get('Principled BSDF')
 shader.inputs['Roughness'].default_value=.81
 if 'Sheen Weight' in shader.inputs:
  shader.inputs['Sheen Weight'].default_value=.27
 if 'Sheen Roughness' in shader.inputs:
  shader.inputs['Sheen Roughness'].default_value=.8
 image=m.node_tree.nodes.new('ShaderNodeTexImage')
 image.image=bpy.data.images.load(str(ASSET_DIR/('jay-r225-'+kind+'-weave.png')))
 m.node_tree.links.new(image.outputs['Color'],shader.inputs['Base Color'])
 return m
def color_mat(name,rgb,rough=.58,metal=0):
 m=bpy.data.materials.new('R225_'+name)
 m.use_nodes=True
 pr=m.node_tree.nodes.get('Principled BSDF')
 pr.inputs['Base Color'].default_value=(*rgb,1)
 pr.inputs['Roughness'].default_value=rough
 pr.inputs['Metallic'].default_value=metal
 return m
navy=fabric_mat('navy')
ivory=fabric_mat('ivory')
burgundy=fabric_mat('burgundy')
leather=fabric_mat('leather')
gold=color_mat('SCHOOL_TRIM_GOLD',(.68,.43,.12),.42,.26)
gold_light=color_mat('CREST_INLAY',(.91,.72,.28),.3,.18)
mats={'navy':navy,'ivory':ivory,'burgundy':burgundy,'leather':leather}
material_ids={}
for kind,material in mats.items():
 body.data.materials.append(material)
 material_ids[kind]=len(body.data.materials)-1
def dominant(v):
 g=max(v.groups,key=lambda e:e.weight,default=None)
 return vgroup_name[g.group] if g else None
dominants=[dominant(v) for v in mesh.vertices]
counts=Counter()
# Use original skinned clothing mesh for fabric recoloring; no cape that
# hovers outside the mesh or clips through shoulder during a throw.
for face in mesh.polygons:
 v=[mesh.vertices[i] for i in face.vertices]
 c=sum((x.co for x in v),Vector())/len(v)
 z,x=c.z,c.x
 tags=[dominants[i] for i in face.vertices]
 torso=sum(t in BONE_GROUPS for t in tags)>=2
 arm_g=sum(t in SLEEVE_GROUPS for t in tags)>=2
 shoulder=sum(t in SHOULDER_GROUPS for t in tags)>=2
 # First classify the upper arms (no hand/face skin), then the torso.
 # Cover the original T-shirt down to the actual waist (z=96cm);
 # its old blue lower strip cannot be left hanging under the blazer.
 if 109<=z<130 and arm_g and 17<abs(x)<37:
  name='ivory' if abs(x)>21 else 'burgundy'
 elif 121<z<132 and shoulder and abs(x)>13:
  name='burgundy'
 elif 84<=z<130 and abs(x)<18.5:
  name='burgundy' if 124<z<128 and abs(x)>11 else 'navy'
 else:continue
 face.material_index=material_ids[name]
 counts[name]+=1
print('R225_WARDROBE_ORIGINAL_SKINNED_TRIANGLES',dict(counts))
assert counts['navy']>400 and counts['ivory']>150, 'lack properly assigned jacket surface'
# The W49 DanDao clothing method: actual vertices, nearest-skin weights,
# armature modifiers and real original 24-joint skeleton.
kd=kdtree.KDTree(len(mesh.vertices))
for v in mesh.vertices:kd.insert(v.co,v.index)
kd.balance()
def attach_mesh(label,verts,faces,mat,weighted_bone=None):
 me=bpy.data.meshes.new(label+'-geo')
 me.from_pydata(verts,[],faces)
 me.update()
 obj=bpy.data.objects.new(label,me)
 bpy.context.collection.objects.link(obj)
 me.materials.append(mat)
 for g in body.vertex_groups:obj.vertex_groups.new(name=g.name)
 if weighted_bone:
  obj.vertex_groups[weighted_bone].add(list(range(len(me.vertices))),1,'REPLACE')
 else:
  for v in me.vertices:
   _,idx,_=kd.find(v.co)
   for group in mesh.vertices[idx].groups:
    name=vgroup_name[group.group]
    obj.vertex_groups[name].add([v.index],group.weight,'REPLACE')
 sk=obj.modifiers.new('R225_24_BONE_SKIN','ARMATURE')
 sk.object=arm
 obj.parent=arm
 # The source WealthTown armature is scaled 0.01 (centimetres -> metres).
 # Source skin Mesh_0 inherits that scale with IDENTITY parent inverse.
 # W49's world-inverse pattern would cancel it, making these ornaments
 # 100x too large and forcing the viewer to scale the body to a dot.
 obj.matrix_parent_inverse.identity()
 return obj
def tube(label,points,radius,material,segments=8,weighted_bone=None):
 verts=[];faces=[]
 for i,pos in enumerate(points):
  center=Vector(pos)
  tangent=(Vector(points[min(len(points)-1,i+1)])-
           Vector(points[max(i-1,0)])).normalized()
  side=tangent.cross(Vector((0,1,0))).normalized()
  if side.length<.1:side=tangent.cross(Vector((1,0,0))).normalized()
  up=tangent.cross(side).normalized()
  for j in range(segments):
   a=2*math.pi*j/segments
   verts.append(tuple(center+radius*(math.cos(a)*side+math.sin(a)*up)))
 for i in range(len(points)-1):
  for j in range(segments):
   a=i*segments+j;b=i*segments+(j+1)%segments
   faces.append((a,b,b+segments,a+segments))
 return attach_mesh(label,verts,faces,material,weighted_bone)
torso_ids=[i for i,v in enumerate(mesh.vertices)
 if dominant(v) in BONE_GROUPS and 99<v.co.z<130 and abs(v.co.x)<18]
def body_front(x,z):
 # Ignore back-surface vertices: the imported teen is front-facing -Y.
 # At the shoulders, the dominant-bone filter can omit front triangles;
 # querying ALL body vertices with a front-side threshold avoids accidentally
 # stitching the collar from chest through to the back of the neck.
 candidates=[v for v in mesh.vertices if abs(v.co.z-z)<2.0 and
   abs(v.co.x-x)<2.0 and v.co.y<-5.0]
 y=min((v.co.y for v in candidates),default=-9.6)
 return min(y,-7.6)-.52
# Tailored student blazer: white front piping and gold thread.
for sign in [-1,1]:
 points=[]
 for z in [99,102,105,109,113,117,121,124]:
  x=sign*(1.1+max(0,(z-117)*.12))
  points.append((x,body_front(x,z),z))
 tube('R225_JAY_BLAZER_LAPEL_'+('L' if sign>0 else 'R'),points,.26,gold,8)
# A narrow burgundy waistband gives the jacket a real ending at the hips,
# rather than letting an awkward strip of original blue T-shirt peek through.
hempts=[(x,body_front(x,84.5)-.25,84.5) for x in (-14,-12,-9,-6,-3,0,3,6,9,12,14)]
tube('R225_JAY_CAMPUS_JACKET_HEM',hempts,.49,burgundy,8)
# Inner shirt/tie: sculpted folded V collar, fitted to the body surface.
for sign in [-1,1]:
 path=[]
 for (x,z) in [(sign*5.8,126.7),(sign*4.5,123.6),(sign*2.0,118.7)]:
  path.append((x,body_front(x,z)-.35,z))
 tube('R225_JAY_LIGHT_COLLAR_'+('L' if sign>0 else 'R'),path,.85,ivory,10)
# Scarlet short tie under collar, triangular tapered tip; active bone weights
tie_verts=[(-1.2,body_front(0,120)-1.1,121),
 (1.2,body_front(0,120)-1.1,121),
 (.62,body_front(0,120)-1.1,111),
 (0,body_front(0,120)-1.1,108),
 (-.62,body_front(0,120)-1.1,111)]
attach_mesh('R225_SCARLET_STUDENT_TIE',tie_verts,[(0,1,2,4),(2,3,4)],burgundy)
# Emblem is on the real jacket mesh, NOT overlaid as screen-space UI.
def disk(name,cx,cy,cz,radius,material):
 verts=[(cx,cy,cz)];faces=[]
 for j in range(24):
  a=2*math.pi*j/24
  verts.append((cx+radius*math.cos(a),cy-.02,cz+radius*math.sin(a)))
 for j in range(24):faces.append((0,1+j,1+((j+1)%24)))
 return attach_mesh(name,verts,faces,material,'Spine01')
cx=-7.5;cz=120.0;cy=body_front(cx,cz)-.84
disk('R225_SCHOOL_CREST_GOLD_RING',cx,cy,cz,2.9,gold)
disk('R225_SCHOOL_CREST_SCARLET_FACE',cx,cy-.18,cz,2.08,burgundy)
# School-crest star, stitched golden appliqué
star=[]
for j in range(10):
 a=math.pi/2+j*math.pi/5
 r=1.57 if j%2==0 else .68
 star.append((cx+r*math.cos(a),cy-.3,cz+r*math.sin(a)))
attach_mesh('R225_SCHOOL_CREST_STAR',star,[(0,1,2,3,4),(0,4,5,6,7),(0,7,8,9)],gold_light,'Spine01')
# The shirt remains the ORIGINAL hero mesh underneath, head/skin/legs untouched.
added=[o for o in bpy.context.scene.objects if o.name.startswith('R225_')]
print('R225_WARDROBE_RIGGED_PARTS',len(added),'verts',sum(len(o.data.vertices) for o in added),
      'originalBodyVerts',len(mesh.vertices))
assert len(added)>=9 and sum(len(o.data.vertices) for o in added)<2500
# Collapse separately created tiny trims into one skinned mesh (4 materials
# instead of 8 distinct geometries). Preserve native armature weights.
bpy.ops.object.select_all(action='DESELECT')
for ob in added:ob.select_set(True)
bpy.context.view_layer.objects.active=added[0]
bpy.ops.object.join()
combined=added[0]
combined.name='R225_JAY_SCHOOL_ACCENTS_SKINNED'
assert combined.type=='MESH' and 250<len(combined.data.vertices)<400
assert any(m.type=='ARMATURE' and m.object==arm for m in combined.modifiers)
print('R225_JOINED_SKINNED_ACCENTS',len(combined.data.vertices),'material slots',len(combined.data.materials))
