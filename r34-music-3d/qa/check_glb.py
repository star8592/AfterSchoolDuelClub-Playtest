#!/usr/bin/env python3
"""Inspect real glTF2/GLB structure; a candidate is not art-approved or rigged by default."""
from pathlib import Path
import argparse,hashlib,json,struct
p=argparse.ArgumentParser();p.add_argument('model',type=Path);p.add_argument('--output',type=Path);a=p.parse_args()
raw=a.model.read_bytes()
assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,4)[0]==2 and struct.unpack_from('<I',raw,8)[0]==len(raw), 'not a valid GLB v2'
n,chunk_type=struct.unpack_from('<II',raw,12)
assert chunk_type==0x4e4f534a,'no JSON chunk'
j=json.loads(raw[20:20+n])
accessors=j.get('accessors',[]);tris=0;vertices=0;meshes=j.get('meshes',[]);prims=0
for m in meshes:
 for pr in m.get('primitives',[]):
  if pr.get('mode',4)!=4:continue
  ix=pr.get('indices')
  count=accessors[ix]['count'] if ix is not None else accessors[pr['attributes']['POSITION']]['count']
  tris+=count//3;vertices+=accessors[pr['attributes']['POSITION']]['count'];prims+=1
skin=j.get('skins',[]);clips=j.get('animations',[]);images=j.get('images',[])
report={'input':str(a.model),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),
 'gltf_version':j.get('asset',{}).get('version'),'mesh_count':len(meshes),'primitive_count':prims,
 'triangles':tris,'position_vertices':vertices,'skin_count':len(skin),
 'joint_count':sum(len(s.get('joints',[])) for s in skin),'animation_count':len(clips),
 'image_count':len(images),'material_count':len(j.get('materials',[])),
 'node_count':len(j.get('nodes',[])),'true_3d_mesh':tris>2000 and len(meshes)>0,
 'skinned_and_animated':bool(skin) and bool(clips),'art_approved':False}
if a.output:
 a.output.parent.mkdir(parents=True,exist_ok=True)
 a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
if not report['true_3d_mesh']:raise SystemExit(12)
