#!/usr/bin/env python3
"""R131 deterministic source-truth art topology test; not artistic approval."""
import json,struct,hashlib
from pathlib import Path
base=Path(__file__).resolve().parents[1]/'assets/summons'
files={'bad_r119':'E04-Phil-Skinned-R119.glb',
 'baked_r131':'E04-Phil-Skinned-R131-BakedRest-PILOT.glb',
 'author_approved_r97':'E04-Phil-Landing-R97.glb'}
def parse(f):
 raw=(base/f).read_bytes()
 assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
 n=struct.unpack_from('<I',raw,12)[0]
 j=json.loads(raw[20:20+n])
 a=j['accessors']
 mesh=next(m for m in j['meshes'] if 'phil_arms' in m['name'].lower())
 prim=mesh['primitives'][0]
 arm=a[prim['attributes']['POSITION']]
 active_nodes=j['nodes']
 skin_nodes=[x for x in active_nodes if 'skin' in x and 'mesh' in x]
 return{'file':f,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),
  'armSpanX':round(arm['max'][0]-arm['min'][0],6),'armVertices':arm['count'],
  'actualSourceSkin':all(k in prim['attributes'] for k in ['JOINTS_0','WEIGHTS_0']),
  'visibleSkinnedMeshNodes':len(skin_nodes),
  'skins':len(j.get('skins',[])),
  'joints':max([len(x['joints']) for x in j.get('skins',[])],default=0)}
data={k:parse(v) for k,v in files.items()}
old,baked,art=[data[x] for x in ('bad_r119','baked_r131','author_approved_r97')]
assert old['actualSourceSkin'] and baked['actualSourceSkin']
assert not art['actualSourceSkin']
assert old['armVertices']==baked['armVertices']==art['armVertices']==2182
assert old['armSpanX']>baked['armSpanX']*2.4
assert abs(baked['armSpanX']-art['armSpanX'])<.001
assert baked['visibleSkinnedMeshNodes']>=10 and baked['joints']>=260
assert old['sha256']!=baked['sha256']
proof=json.loads((base/'E04-Phil-Skinned-R131-BakedRest-PILOT.proof.json').read_text())
assert proof.get('r131PoseRestBaked') and proof.get('status')=='EXPORTED'
report={'passed':True,'units':'source GLB local units, not real-world centimeters',
 'comparison':data,'sourceProof':{
  'status':proof['status'],'posedVerticesSampled':proof['posedVerticesSampled'],
  'r131PoseRestBaked':proof['r131PoseRestBaked'],
  'sha256':proof['sha256']},
 'notes':'Author R97 natural arm rest geometry span is matched exactly with true R131 source weights; no art approval implied'}
dest=Path(__file__).resolve().parent/'evidence/r131/r131-baked-rest-topology-audit.json'
dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(report,indent=2))
print('R131_BAKED_REST_SOURCE_AUDIT_PASS',json.dumps({
 'old':old['armSpanX'],'baked':baked['armSpanX'],
 'r97':art['armSpanX'],'armVerts':baked['armVertices'],
 'skinnedNodes':baked['visibleSkinnedMeshNodes']},ensure_ascii=False))
