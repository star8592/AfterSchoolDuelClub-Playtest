#!/usr/bin/env python3
"""R58: Non-destructive GLB animation enhancement of the historical living menu.

Keeps all original meshes, materials and triangles. Injects a proper page
hinge transform and native glTF 2.0 animation clips into a separately named GLB.
This is experimental technical rigging, NOT approved final character artwork.
"""
from __future__ import annotations
import hashlib, json, math, struct
from pathlib import Path
import numpy as np

HERE=Path(__file__).resolve().parent
SOURCE=HERE.parents[2]/'models/T02-living-menu.glb'
DEST=HERE/'T02-LivingMenu-R58-AnimateStudy.glb'
data=SOURCE.read_bytes()
assert len(data)>20 and data[:4]==b'glTF'
magic,version,total=struct.unpack_from('<4sII',data,0)
assert version==2 and total==len(data)
json_size,json_tag=struct.unpack_from('<I4s',data,12)
assert json_tag==b'JSON'
scene=json.loads(data[20:20+json_size])
off=20+json_size
bin_size,bin_tag=struct.unpack_from('<I4s',data,off)
assert bin_tag==b'BIN\x00'
bin_data=bytearray(data[off+8:off+8+bin_size])
assert len(bin_data)==scene['buffers'][0]['byteLength']
assert len(scene['meshes'])==41
assert len(scene['animations'])==0 if 'animations' in scene else True

root=scene['scenes'][scene.get('scene',0)]['nodes'][0]
assert set([25,26,27,28,33,34,35,36,37]).issubset(set(scene['nodes'][root]['children']))
# Original page is authored in its correct world-space position. A hinge
# transform at the book's left binding maintains the exact starting pose.
hinge=[-0.47,1.32,0.19]
moving=[25,26,27,28,33,34,35,36,37]
for node_id in moving:
    node=scene['nodes'][node_id]
    t=node.get('translation',[0.,0.,0.])
    node['translation']=[round(float(t[i]-hinge[i]),8) for i in range(3)]
scene['nodes'][root]['children']=[i for i in scene['nodes'][root]['children'] if i not in moving]
pivot=len(scene['nodes'])
scene['nodes'].append({
    'name':'R58_Left_Book_Binding_PIVOT',
    'translation':hinge,
    'children':moving,
})
scene['nodes'][root]['children'].append(pivot)

def extra_pivot(label,hinge,member_nodes):
    # Keep original rest pose by moving the child node translations into
    # a local hinge origin while retaining their visible world positions.
    assert set(member_nodes).issubset(set(scene['nodes'][root]['children']))
    idx=len(scene['nodes'])
    for node_id in member_nodes:
        node=scene['nodes'][node_id]
        old=node.get('translation',[0.,0.,0.])
        node['translation']=[round(float(old[k]-hinge[k]),8) for k in range(3)]
    scene['nodes'][root]['children']=[i for i in scene['nodes'][root]['children'] if i not in member_nodes]
    scene['nodes'].append({'name':label,'translation':hinge,'children':member_nodes})
    scene['nodes'][root]['children'].append(idx)
    return idx

hat_pivot=extra_pivot('R58_Chef_Hat_Expressive_Hinge',[0.,2.16,0.],list(range(16,25))+[30,38])
right_arm=extra_pivot('R58_Right_Spoon_Arm_Joint',[.58,1.54,0.],[1,3])
left_arm=extra_pivot('R58_Left_Spoon_Arm_Joint',[-.58,1.54,0.],[9,11])


# Align bitmaps, data and JSON to 4-byte offsets (glTF spec).
def accessor(values,kind):
    arr=np.asarray(values,dtype='<f4')
    assert arr.ndim==2 and arr.shape[1]=={'SCALAR':1,'VEC3':3,'VEC4':4}[kind]
    while len(bin_data)%4:bin_data.append(0)
    offset=len(bin_data)
    blob=arr.tobytes(order='C')
    bin_data.extend(blob)
    view_idx=len(scene['bufferViews'])
    scene['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(blob)})
    access_idx=len(scene['accessors'])
    entry={'bufferView':view_idx,'componentType':5126,'count':len(arr),'type':kind}
    entry['min']=arr.min(axis=0).tolist()
    entry['max']=arr.max(axis=0).tolist()
    scene['accessors'].append(entry)
    return access_idx

def quat_y(deg):
    t=math.radians(deg)/2
    return [0,round(math.sin(t),8),0,round(math.cos(t),8)]

def quat_z(deg):
    t=math.radians(deg)/2
    return [0,0,round(math.sin(t),8),round(math.cos(t),8)]

def animate(name,tracks):
    anim={'name':name,'samplers':[],'channels':[]}
    for node,path,points in tracks:
        times=np.array([r[0] for r in points],dtype=np.float32).reshape(-1,1)
        values=np.array([r[1] for r in points],dtype=np.float32)
        acc_t=accessor(times,'SCALAR')
        acc_v=accessor(values,{'translation':'VEC3','rotation':'VEC4','scale':'VEC3'}[path])
        idx=len(anim['samplers'])
        anim['samplers'].append({'input':acc_t,'output':acc_v,'interpolation':'LINEAR'})
        anim['channels'].append({'sampler':idx,'target':{'node':node,'path':path}})
    scene.setdefault('animations',[]).append(anim)

base=scene['nodes'][root].get('translation',[0.,0.,0.])
base=[float(x) for x in base]
pos=lambda dy=0,dz=0:[base[0],round(base[1]+dy,5),round(base[2]+dz,5)]
animate('Idle_Menu_Breath',[
 (root,'translation',[(0,pos()),(.7,pos(.026)),(1.4,pos(-.012)),(2.1,pos(.02)),(2.8,pos())]),
 (pivot,'rotation',[(0,quat_y(0)),(.9,quat_y(-4)),(1.8,quat_y(2)),(2.8,quat_y(0))]),
 (hat_pivot,'rotation',[(0,quat_z(0)),(.7,quat_z(4)),(1.4,quat_z(-3)),(2.1,quat_z(4)),(2.8,quat_z(0))]),
 (right_arm,'rotation',[(0,quat_z(0)),(.9,quat_z(-7)),(1.8,quat_z(5)),(2.8,quat_z(0))]),
 (left_arm,'rotation',[(0,quat_z(0)),(.9,quat_z(7)),(1.8,quat_z(-5)),(2.8,quat_z(0))]),
])
animate('Walk_Small_Steps',[
 (root,'translation',[(0,pos()),(.25,pos(.06)),(.5,pos()),(.75,pos(.06)),(1.,pos())]),
 (pivot,'rotation',[(0,quat_y(0)),(.25,quat_y(-12)),(.5,quat_y(0)),(.75,quat_y(-9)),(1.,quat_y(0))]),
 (hat_pivot,'rotation',[(0,quat_z(0)),(.25,quat_z(7)),(.5,quat_z(0)),(.75,quat_z(-7)),(1.,quat_z(0))]),
 (right_arm,'rotation',[(0,quat_z(-5)),(.25,quat_z(14)),(.5,quat_z(-5)),(.75,quat_z(14)),(1.,quat_z(-5))]),
 (left_arm,'rotation',[(0,quat_z(5)),(.25,quat_z(-14)),(.5,quat_z(5)),(.75,quat_z(-14)),(1.,quat_z(5))]),
])
animate('Attack_Flip_Menu',[
 (pivot,'rotation',[(0,quat_y(0)),(.2,quat_y(-25)),(.48,quat_y(-120)),(.84,quat_y(-145)),(1.15,quat_y(-14)),(1.45,quat_y(0))]),
 (root,'translation',[(0,pos()),(.25,pos(.04,.05)),(.6,pos(.16,.19)),(.9,pos(.08,.05)),(1.45,pos())]),
 (hat_pivot,'rotation',[(0,quat_z(0)),(.3,quat_z(-12)),(.65,quat_z(14)),(1.1,quat_z(-5)),(1.45,quat_z(0))]),
 (right_arm,'rotation',[(0,quat_z(0)),(.35,quat_z(40)),(.75,quat_z(-25)),(1.45,quat_z(0))]),
 (left_arm,'rotation',[(0,quat_z(0)),(.35,quat_z(-40)),(.75,quat_z(25)),(1.45,quat_z(0))]),
])
animate('Defend_Opening_Menu',[
 (pivot,'rotation',[(0,quat_y(0)),(.36,quat_y(-108)),(.86,quat_y(-122)),(1.2,quat_y(-74)),(1.5,quat_y(0))]),
 (hat_pivot,'rotation',[(0,quat_z(0)),(.7,quat_z(-8)),(1.5,quat_z(0))]),
])
animate('Hit_Retreat',[
 (root,'translation',[(0,pos()),(.1,pos(.04,-.12)),(.25,pos(-.13,-.25)),(.7,pos())]),
 (pivot,'rotation',[(0,quat_y(0)),(.16,quat_y(18)),(.35,quat_y(-15)),(.7,quat_y(0))]),
 (hat_pivot,'rotation',[(0,quat_z(0)),(.16,quat_z(17)),(.35,quat_z(-11)),(.7,quat_z(0))]),
 (right_arm,'rotation',[(0,quat_z(0)),(.16,quat_z(-35)),(.7,quat_z(0))]),
 (left_arm,'rotation',[(0,quat_z(0)),(.16,quat_z(35)),(.7,quat_z(0))]),
])

# Keep the existing body PBR materials; only ensure book parchment isn't shiny
# plastic. No new unlicensed textures/images are introduced.
changed_materials=[]
for mat in scene.get('materials',[]):
    name=mat.get('name','').lower()
    pbr=mat.setdefault('pbrMetallicRoughness',{})
    if 'paper' in name or 'parchment' in name:
        pbr['metallicFactor']=0.0
        pbr['roughnessFactor']=0.86
        changed_materials.append(mat.get('name'))
    elif 'book' in name or 'leather' in name:
        pbr['metallicFactor']=0.04
        pbr['roughnessFactor']=0.48
        changed_materials.append(mat.get('name'))

scene['buffers'][0]['byteLength']=len(bin_data)
jbytes=json.dumps(scene,ensure_ascii=False,separators=(',',':')).encode('utf8')
jbytes+=b' ' * ((-len(jbytes))%4)
bin_data.extend(bytes((-len(bin_data))%4))
packed=struct.pack('<4sII',b'glTF',2,12+8+len(jbytes)+8+len(bin_data))
packed+=struct.pack('<I4s',len(jbytes),b'JSON')+jbytes
packed+=struct.pack('<I4s',len(bin_data),b'BIN\x00')+bin_data
DEST.write_bytes(packed)
info={
  'source':str(SOURCE),'source_sha256':hashlib.sha256(data).hexdigest(),
  'output':str(DEST),'output_sha256':hashlib.sha256(packed).hexdigest(),
  'source_meshes':len(scene['meshes']),'source_materials':len(scene.get('materials',[])),
  'rig_type':'native_glTF2_node_hinge_with_animation_channels',
  'animated_page_nodes':moving,
  'costume_pivots':{'hat':hat_pivot,'right_arm':right_arm,'left_arm':left_arm},
  'clips':[a['name'] for a in scene['animations']],
  'materials_roughness_corrected':changed_materials,
  'p1_technical_rig_ready':True,
  'image_to_3d_generated':False,
  'final_character_art_approved':False,
  'production_approved':False,
}
DEST.with_suffix('.provenance.json').write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n')
print('R58_T02_ANIMATION_EXPORT',json.dumps({k:info[k] for k in ['source_meshes','source_materials','clips','output_sha256','production_approved']},ensure_ascii=False))
