#!/usr/bin/env python3
"""Merge M02's 13 skin-identical mesh nodes into one skinned mesh with 13 primitives.
Preserve buffer payload, skins, bone animation, materials, and animation accessors byte-for-byte."""
import struct,json,hashlib,pathlib
SRC=pathlib.Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/m01-engine-eval-20261115/M02-CafeteriaAunt-StandardGLB-UNCOMPRESSED.glb')
OUT=pathlib.Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-unreal-native-character-test-20261115/M02-CafeteriaAunt-ONE-SKIN-ALL-DETAILS.glb')
assert not OUT.exists(), 'No overwriting a previous QA candidate.'
data=SRC.read_bytes()
magic,version,total=struct.unpack_from('<III',data,0)
assert magic==0x46546c67 and version==2 and total==len(data)
jlen,jtype=struct.unpack_from('<II',data,12)
assert jtype==0x4e4f534a
doc=json.loads(data[20:20+jlen])
binpos=20+jlen
blen,btype=struct.unpack_from('<II',data,binpos)
assert btype==0x004e4942
binchunk=data[binpos+8:binpos+8+blen]
assert len(doc['skins'])==1 and len(doc['meshes'])==13
mesh_nodes=[(i,n) for i,n in enumerate(doc['nodes']) if 'mesh' in n]
assert len(mesh_nodes)==13
assert all(n.get('skin')==0 for i,n in mesh_nodes)
assert len({n['mesh'] for i,n in mesh_nodes})==13
assert all(len(m['primitives'])==1 for m in doc['meshes'])
assert len(doc['animations'])==10
assert all('mesh' not in ch['target']['path'] for a in doc['animations'] for ch in a['channels'])
root_node,root=next((i,n) for i,n in mesh_nodes if n.get('name')=='char1')
# In the source, transform-less mesh children all share exact skin and transform,
# so rendering them as submeshes with one skin does not change vertex bind geometry.
assert all(not any(k in n for k in ('translation','rotation','scale','matrix')) for i,n in mesh_nodes)
prims=[]
for i,n in mesh_nodes:prims.extend(doc['meshes'][n['mesh']]['primitives'])
doc['meshes']=[{'name':'M02_CafeteriaAunt_CompleteSkinned','primitives':prims}]
for i,n in mesh_nodes:
 if i==root_node:n['mesh']=0
 else:
  n.pop('mesh');n.pop('skin')
doc.setdefault('asset',{}).setdefault('extras',{})['ASDC_asset_merge']='M02 13 meshes -> one skinned mesh, 13 material primitives, same 24 joints'
js=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode('utf-8')
js+=b' ' * ((4-len(js)%4)%4)
binchunk+=b'\x00'*((4-len(binchunk)%4)%4)
blob=struct.pack('<III',magic,2,12+8+len(js)+8+len(binchunk))
blob+=struct.pack('<II',len(js),0x4e4f534a)+js
blob+=struct.pack('<II',len(binchunk),0x004e4942)+binchunk
OUT.write_bytes(blob)
# Round-trip checks before any engine import.
d=json.loads(blob[20:20+len(js)])
assert len(d['meshes'])==1 and len(d['meshes'][0]['primitives'])==13
assert sum('skin' in n for n in d['nodes'])==1
assert len(d['skins'][0]['joints'])==24
assert len(d['animations'])==10
assert hashlib.sha256(blob[20+len(js)+8:]).digest()==hashlib.sha256(binchunk).digest()
print(json.dumps({'status':'MERGED_GLTF_VALID','source_sha256':hashlib.sha256(data).hexdigest(),
'destination_sha256':hashlib.sha256(blob).hexdigest(),'size_original':len(data),'size_merged':len(blob),
'skin_count':len(d['skins']),'skinned_mesh_nodes':sum('skin' in n for n in d['nodes']),
'mesh_primitives':len(d['meshes'][0]['primitives']),'animations':len(d['animations']),
'output':str(OUT)},ensure_ascii=False))
