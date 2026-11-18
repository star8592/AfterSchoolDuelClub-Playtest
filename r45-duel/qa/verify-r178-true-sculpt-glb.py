"""Strict native Blender + GLB structural checks for independently authored
campus hero props. This is only a technical candidate gate, not visual approval.
"""
import json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CANDIDATES={
'E06':('E06_Cinematic_Eraser',6,10000,['felt','grip','walnut']),
'K01':('K01_Sculpted_Wok_Eggplant_Banana',10,15000,['wok','banana','aubergine'])
}
results={}
for key,(stem,min_mesh,min_tri,needle) in CANDIDATES.items():
 base=ROOT/'art'/'hero-props'
 src=base/(stem+'.blend')
 runtime=base/(stem+'.glb')
 script=base/('build_e06_sculpt.py' if key=='E06' else 'build_k01_wok_sculpt.py')
 image=base/'qa'/(stem+'.png' if key=='E06' else stem+'.png')
 receipt=base/'qa'/('E06_mesh_receipt.json' if key=='E06' else 'K01_mesh_receipt.json')
 assert all(x.is_file() for x in (src,runtime,script,image,receipt)),key+' missing authored source/runtime/evidence'
 assert src.stat().st_size>100000 and image.stat().st_size>100000,key+' empty source or photo'
 sig=src.read_bytes()[:32]
 assert sig.startswith(b'BLENDER') or (sig.startswith(bytes.fromhex('28b52ffd')) and b'BLENDER' in sig), key+' is not a Blender or Zstd Blender source'
 data=runtime.read_bytes()
 assert data[:4]==b'glTF' and struct.unpack_from('<I',data,8)[0]==len(data),key+' invalid GLB'
 chunk_length,chunk_type=struct.unpack_from('<II',data,12)
 assert chunk_type==0x4e4f534a,key+' invalid JSON chunk'
 gltf=json.loads(data[20:20+chunk_length])
 names=' '.join((node.get('name')or'').lower() for node in gltf['nodes'])
 assert all(x in names for x in needle),(key,'model part missing',needle)
 mesh_count=len(gltf['meshes'])
 tri=0
 for mesh in gltf['meshes']:
  for prim in mesh['primitives']:
   mode=prim.get('mode',4)
   assert mode==4,key+' nontriangle primitive'
   count=gltf['accessors'][prim['indices']]['count'] if 'indices' in prim else \
    gltf['accessors'][prim['attributes']['POSITION']]['count']
   assert count%3==0,key+' invalid triangles'
   tri+=count//3
 assert mesh_count>=min_mesh and tri>=min_tri,(key,mesh_count,tri)
 r=json.loads(receipt.read_text())
 assert abs(tri-r['triangles'])<max(20,0.03*r['triangles']), (key,'triangle mismatch',tri,r['triangles'])
 assert len(gltf.get('materials',[]))>=6,key+' missing material layers'
 assert not gltf.get('images'),key+' unexpected external image'
 results[key]={'sourceBytes':src.stat().st_size,'runtimeBytes':len(data),
  'meshCount':mesh_count,'triangles':tri,'materials':len(gltf.get('materials',[])),
  'namedDetailsFound':needle,'visualApproval':False}
print('R178_AUTHORED_GLBS_STRUCTURAL_PASS',json.dumps(results,ensure_ascii=False))
(ROOT/'qa'/'evidence'/'r178-sculpted-props'/'r178-two-true-glb-geometry.json').write_text(
 json.dumps({'technicalCandidates':results,'approvedForRelease':False},ensure_ascii=False,indent=2))
