#!/usr/bin/env python3
"""Lossless glTF2 mesh-primitives consolidation; only valid for shared skin and transforms.
Never reauthor animation, skeleton, vertex data, materials, or textures."""
from pathlib import Path
from copy import deepcopy
import hashlib,json,struct
ROOT=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-unreal-native-character-test-20261115')
src=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/m01-engine-eval-20261115/M02-CafeteriaAunt-StandardGLB-UNCOMPRESSED.glb')
dst=ROOT/'M02-CafeteriaAunt-24Bone-10Clip-MergedMesh-QA.glb'
assert not dst.exists(), 'Immutable generated asset already exists'
data=src.read_bytes()
magic,version,total=struct.unpack_from('<4sII',data,0)
assert magic==b'glTF' and version==2 and total==len(data)
jslen,jstag=struct.unpack_from('<I4s',data,12)
assert jstag==b'JSON'
js=json.loads(data[20:20+jslen])
binstart=20+jslen
binlen,bintag=struct.unpack_from('<I4s',data,binstart)
assert bintag==b'BIN\x00'
bindata=data[binstart+8:binstart+8+binlen]
assert len(js['meshes'])==13 and len(js['skins'])==1 and len(js['animations'])==10
nodes=js['nodes'];mesh_nodes=[(i,n) for i,n in enumerate(nodes) if 'mesh'in n]
assert len(mesh_nodes)==13 and all(n.get('skin')==0 for _,n in mesh_nodes)
assert all(not any(x in n for x in ('translation','rotation','scale','matrix')) for _,n in mesh_nodes)
affected=set(i for i,_ in mesh_nodes)
assert all(ch.get('target',{}).get('node') not in affected for a in js['animations'] for ch in a['channels']), 'Animated mesh nodes cannot be merged safely'
primary=mesh_nodes[0][0]
assert nodes[primary]['mesh']==0
allprims=[]
for i,m in enumerate(js['meshes']):
 assert len(m['primitives'])>0 and m.get('weights') in (None,[]),'Expected skin-only, no mesh morph data'
 for prim in m['primitives']:
  assert 'JOINTS_0' in prim['attributes'] and 'WEIGHTS_0' in prim['attributes']
  allprims.append(deepcopy(prim))
new=deepcopy(js)
new['meshes']=[{'name':'ASDC_M02_FULL_BODY_HAT_LADLE_ONE_SKIN','primitives':allprims}]
for index,node in mesh_nodes[1:]:
 del new['nodes'][index]['mesh']
 del new['nodes'][index]['skin']
# Keep original node order and full skeleton animation references unchanged.
def pad(b,fill):return b+fill*((-len(b))%4)
jsonpart=pad(json.dumps(new,separators=(',',':'),ensure_ascii=False).encode(),' '.encode())
binpart=pad(bindata,b'\x00')
payload=struct.pack('<I4s',len(jsonpart),b'JSON')+jsonpart+struct.pack('<I4s',len(binpart),b'BIN\x00')+binpart
out=struct.pack('<4sII',b'glTF',2,12+len(payload))+payload
dst.write_bytes(out)
q={
 'source':str(src),'source_sha256':hashlib.sha256(data).hexdigest(),
 'output':str(dst),'output_sha256':hashlib.sha256(out).hexdigest(),
 'source_meshes':len(js['meshes']),'output_meshes':len(new['meshes']),
 'source_primitives':sum(len(x['primitives']) for x in js['meshes']),
 'output_primitives':len(new['meshes'][0]['primitives']),
 'skins':len(new['skins']),'joints':len(new['skins'][0]['joints']),
 'animations':len(new['animations']),
 'identical_animation_json':new['animations']==js['animations'],
 'identical_material_json':new['materials']==js['materials'],
 'identical_binary_chunk':binpart==pad(bindata,b'\x00'),
 'source_bytes':len(data),'output_bytes':len(out),
 'source_original_unchanged':hashlib.sha256(src.read_bytes()).hexdigest()==hashlib.sha256(data).hexdigest()
}
assert q['identical_animation_json'] and q['identical_material_json'] and q['identical_binary_chunk']
(ROOT/'m02-merged-asset-manifest.json').write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
print('M02_LOSSLESS_SKINNED_MESH_MERGE',json.dumps(q,ensure_ascii=False))
