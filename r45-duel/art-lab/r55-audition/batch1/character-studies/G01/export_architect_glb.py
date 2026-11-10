#!/usr/bin/env python3
"""Non-destructive G01 original cartoon engineering kit as real glTF2 geometry.

The original Fumiriya source VRM is untouched. Accessories are independent
GLB meshes carrying attachBone extras. Preview attaches them to real VRM bones.
No external generators, no fake image billboard, no final-art approval.
"""
import math,json,struct,hashlib
from pathlib import Path
import numpy as np
HERE=Path(__file__).resolve().parent
OUT=HERE/'G01-ElasticArchitect-R59-PropsSTUDY.glb'
SRC=HERE.parents[4]/'assets/model/Fumiriya-original-CC0.vrm'
materials=[
 ('Blueprint_DeepNavy',[.014,.052,.11,1],.50,.08),
 ('Brushed_Copper',[.68,.31,.12,1],.32,.67),
 ('Survey_Teal',[.043,.54,.53,1],.3,.28),
 ('Engineering_Cream',[.92,.84,.67,1],.75,0),
 ('Elastic_Coral',[.88,.24,.15,1],.50,0),
 ('Midnight_Equipment',[.022,.036,.06,1],.42,.13),
 ('Polished_Lens',[.15,.58,.79,1],.18,.14),
 ('Golden_Trim',[.85,.56,.20,1],.27,.54)]
j={'asset':{'version':'2.0','generator':'R59 ASDC geometry library (independent VRM costume)'},
 'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'accessors':[],
 'bufferViews':[],'materials':[{'name':n,'pbrMetallicRoughness':{
  'baseColorFactor':c,'metallicFactor':met,'roughnessFactor':rough},
  'doubleSided':True} for n,c,rough,met in materials],
 'buffers':[{'byteLength':0}]}
blob=bytearray()
def store(data):
 while len(blob)%4:blob.append(0)
 start=len(blob);blob.extend(data)
 i=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':len(data)})
 return i
def array(points,kind):
 a=np.asarray(points,dtype='<f4')
 idx=len(j['accessors'])
 j['accessors'].append({'bufferView':store(a.tobytes()),'componentType':5126,
   'count':len(a),'type':kind,'min':a.min(axis=0).tolist(),'max':a.max(axis=0).tolist()})
 return idx
def mesh(name,positions,normals,triangles,material,bone):
 pos=array(positions,'VEC3');nrm=array(normals,'VEC3')
 ids=np.asarray(triangles,dtype='<u2')
 i=len(j['accessors']);j['accessors'].append({'bufferView':store(ids.tobytes()),
  'componentType':5123,'count':len(ids),'type':'SCALAR','min':[int(ids.min())],'max':[int(ids.max())]})
 m=len(j['meshes']);j['meshes'].append({'name':name,'primitives':[{
  'attributes':{'POSITION':pos,'NORMAL':nrm},'indices':i,'material':material,'mode':4}]})
 n=len(j['nodes']);j['nodes'].append({'name':name,'mesh':m,'extras':{'attachBone':bone}})
 j['scenes'][0]['nodes'].append(n)
def cube(name,loc,sz,mat,bone='J_Bip_C_Chest'):
 x,y,z=loc;sx,sy,sz0=[s/2 for s in sz]
 vertices=[];normals=[];tris=[]
 for center,normal,axes in [
   ((x+sx,y,z),(1,0,0),[(0,-sy,-sz0),(0,sy,-sz0),(0,sy,sz0),(0,-sy,sz0)]),
   ((x-sx,y,z),(-1,0,0),[(0,-sy,sz0),(0,sy,sz0),(0,sy,-sz0),(0,-sy,-sz0)]),
   ((x,y+sy,z),(0,1,0),[(-sx,0,-sz0),(-sx,0,sz0),(sx,0,sz0),(sx,0,-sz0)]),
   ((x,y-sy,z),(0,-1,0),[(-sx,0,sz0),(-sx,0,-sz0),(sx,0,-sz0),(sx,0,sz0)]),
   ((x,y,z+sz0),(0,0,1),[(sx,-sy,0),(sx,sy,0),(-sx,sy,0),(-sx,-sy,0)]),
   ((x,y,z-sz0),(0,0,-1),[(-sx,-sy,0),(-sx,sy,0),(sx,sy,0),(sx,-sy,0)])
 ]:
  st=len(vertices)
  for v in axes:vertices.append([center[k]+v[k] for k in range(3)]);normals.append(list(normal))
  tris.extend([st,st+1,st+2,st,st+2,st+3])
 mesh(name,vertices,normals,tris,mat,bone)
def ball(name,pos,radius,mat,bone='J_Bip_C_Head',longitudes=24,latitudes=12):
 verts=[];nrm=[];idx=[]
 for v in range(latitudes+1):
  phi=math.pi*v/latitudes
  for u in range(longitudes+1):
   th=2*math.pi*u/longitudes
   normal=(math.sin(phi)*math.cos(th),math.cos(phi),math.sin(phi)*math.sin(th))
   verts.append([pos[k]+radius[k]*normal[k] for k in range(3)])
   nrm.append(list(normal))
 for v in range(latitudes):
  for u in range(longitudes):
   a=v*(longitudes+1)+u;b=a+longitudes+1
   idx.extend([a,b,a+1,b,b+1,a+1])
 mesh(name,verts,nrm,idx,mat,bone)
def torus_xy(name,pos,R,r,mat,bone='J_Bip_C_Head',parts=48,sides=10):
 verts=[];nrm=[];idx=[]
 for i in range(parts):
  a=2*math.pi*i/parts
  for k in range(sides):
   b=2*math.pi*k/sides
   x=math.cos(a)*(R+r*math.cos(b))
   y=math.sin(a)*(R+r*math.cos(b))
   z=r*math.sin(b)
   verts.append([pos[0]+x,pos[1]+y,pos[2]+z])
   nrm.append([math.cos(a)*math.cos(b),math.sin(a)*math.cos(b),math.sin(b)])
 for i in range(parts):
  for k in range(sides):
   a=i*sides+k;b=((i+1)%parts)*sides+k
   c=i*sides+(k+1)%sides;d=((i+1)%parts)*sides+(k+1)%sides
   idx.extend([a,b,c,b,d,c])
 mesh(name,verts,nrm,idx,mat,bone)
def curve(name,points,r,mat,bone='J_Bip_C_Chest',sides=8):
 pts=np.asarray(points,dtype=float)
 verts=[];norm=[];ids=[]
 for a,p in enumerate(pts):
  tangent=(pts[min(len(pts)-1,a+1)]-pts[max(0,a-1)])
  tangent=tangent/np.linalg.norm(tangent)
  axis=np.cross(tangent,[0,0,1.])
  if np.linalg.norm(axis)<.1:axis=np.cross(tangent,[0,1.,0])
  axis/=np.linalg.norm(axis);other=np.cross(tangent,axis)
  for b in range(sides):
   th=2*math.pi*b/sides
   n=math.cos(th)*axis+math.sin(th)*other
   verts.append((p+r*n).tolist());norm.append(n.tolist())
 for a in range(len(pts)-1):
  for b in range(sides):
   q=a*sides+b;t=(a+1)*sides+b
   v=a*sides+(b+1)%sides;w=(a+1)*sides+(b+1)%sides
   ids.extend([q,t,v,t,w,v])
 mesh(name,verts,norm,ids,mat,bone)
# G01 distinctly recognizable as eccentric adult elastic-geometry architect:
# not generic school uniform, not another woman with recolored hair.
cube('G01_Teal_Survey_Visor',(0,1.828,-.097),(.36,.055,.10),2,'J_Bip_C_Head')
curve('G01_Head_Copper_Band',[(-.17,1.81,.03),(-.175,1.87,-.055),
 (0,1.905,-.14),(.175,1.87,-.055),(.17,1.81,.03)],.016,1,'J_Bip_C_Head')
for k,side in enumerate([-1,1]):
 torus_xy(f'G01_Survey_Glass_Ring_{k}',(.082*side,1.757,-.174),.062,.012,1)
 ball(f'G01_Survey_Glass_{k}',(.082*side,1.757,-.185),(.049,.049,.012),6)
 ball(f'G01_Glass_Glare_{k}',(.082*side-.015,1.779,-.202),(.011,.012,.004),3)
ball('G01_Goggle_Center_Connector',(0,1.76,-.172),(.018,.018,.017),7)
# Cross-harness for technical tools and signature glowing geometry badge
curve('G01_Harness_CrossLeft',[(-.16,1.49,-.101),(-.08,1.39,-.145),(.09,1.23,-.124)],.021,1)
curve('G01_Harness_CrossRight',[(.16,1.49,-.101),(.08,1.39,-.145),(-.09,1.23,-.124)],.021,5)
cube('G01_CAD_Engineer_Badge',(0,1.376,-.172),(.205,.205,.044),0)
torus_xy('G01_Elastic_Geometry_Emblem',(0,1.376,-.197),.063,.009,2,'J_Bip_C_Chest')
for i in range(4):
 a=i*math.pi/2
 ball('G01_CAD_Ruler_Nub_'+str(i),(.066*math.cos(a),1.376+.066*math.sin(a),-.214),(.013,.013,.009),7,'J_Bip_C_Chest',12,8)
# Practical rolled architectural blueprint and leather brace on back
curve('G01_Rolled_Blueprint_Tube',[(.23,1.5,.16),(.24,1.33,.19),(.23,1.12,.16)],.054,3)
curve('G01_Blueprint_Blue_Case',[(.23,1.44,.16),(.24,1.29,.20),(.23,1.17,.17)],.061,0)
curve('G01_Blueprint_Retention_Strap',[(.20,1.30,.225),(.245,1.30,.25),(.28,1.30,.22)],.013,1)
# Drafting instruments and playful elastic ring on each hand.
cube('G01_Right_Hand_Ruler',(.57,1.451,-.080),(.28,.024,.029),1,'J_Bip_R_Hand')
for k in range(7):
 x=.46+k*.035
 curve('G01_Ruler_Mark_'+str(k),[(x,1.466,-.099),(x,1.482 if k%2==0 else 1.473,-.099)],.003,5,'J_Bip_R_Hand')
loop=[(-.61+.105*math.cos(k*math.pi/12),1.44+.074*math.sin(k*math.pi/12),-.11) for k in range(25)]
curve('G01_Hand_Elastic_Compass_Loop',loop,.012,4,'J_Bip_L_Hand')
ball('G01_Elastic_Compass_Anchor',(-.61,1.44,-.11),(.030,.030,.028),7,'J_Bip_L_Hand')
# craft and exporter
j['buffers'][0]['byteLength']=len(blob)
raw=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode()
raw+=b' '*((-len(raw))%4)
blob.extend(b'\0'*((-len(blob))%4))
j['buffers'][0]['byteLength']=len(blob)
raw=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode()
raw+=b' '*((-len(raw))%4)
OUT.write_bytes(struct.pack('<4sII',b'glTF',2,12+8+len(raw)+8+len(blob))
  +struct.pack('<I4s',len(raw),b'JSON')+raw
  +struct.pack('<I4s',len(blob),b'BIN\0')+blob)
meta={
 'vrm_source':str(SRC),'vrm_source_sha':hashlib.sha256(SRC.read_bytes()).hexdigest(),
 'glb':str(OUT),'output_sha':hashlib.sha256(OUT.read_bytes()).hexdigest(),
 'mesh_count':len(j['meshes']),'bone_attachments':len(j['nodes']),
 'material_count':len(j['materials']),'animation_clips':0,
 'vrm_source_untouched':True,'final_character_art_approved':False}
OUT.with_suffix('.provenance.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print('R59_G01_NATIVE_GLB',json.dumps({'meshes':meta['mesh_count'],'materials':meta['material_count'],
 'sha':meta['output_sha'],'approved':False}))
