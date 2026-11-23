"""Source-only hand skeleton feasibility audit: no expensive runtime rig loaded."""
import json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT.parents[1]
CANDIDATES={
 'Jay_R97_high_detail':GAME/'assets/summons/G03-Jay-Landing-R97.glb',
 'Jay_R225_wealth_boy':ROOT/'assets/jay-teen-duel-v06-school.glb'}
def meta(path):
 with open(path,'rb') as fd:
  h=fd.read(20)
  assert h[:4]==b'glTF'
  n=struct.unpack_from('<I',h,12)[0]
  j=json.loads(fd.read(n))
 joints=[j['nodes'][i].get('name','') for sk in j.get('skins',[]) for i in sk['joints']]
 fingers=[x for x in joints if any(t in x.lower() for t in ['finger_','thumb','index1','index2','index3'])]
 def counts(a):
  c={k:0 for k in ('rotation','translation','weights')}
  for z in a.get('channels',[]):
   p=z['target']['path']
   if p in c:c[p]+=1
  return {'name':a.get('name'),'channels':c}
 return {'file':path.name,'bytes':path.stat().st_size,
  'skinJointCount':len(joints),'fingerJointReferences':len(fingers),
  'representativeFingerBones':fingers[:32],
  'animations':[counts(a) for a in j.get('animations',[])],
  'meshCount':len(j.get('meshes',[])),
  'meshesWithSkinWeight':sum(any('JOINTS_0' in p['attributes'] for p in m['primitives']) for m in j.get('meshes',[]))}
result={name:meta(path) for name,path in CANDIDATES.items()}
assert result['Jay_R97_high_detail']['skinJointCount']>1000
assert result['Jay_R97_high_detail']['fingerJointReferences']>=30
assert result['Jay_R225_wealth_boy']['skinJointCount']==24
assert result['Jay_R225_wealth_boy']['fingerJointReferences']==0
out=ROOT/'evidence/r225-old-jay-finger-rig-viability.json'
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
for k,v in result.items():
 print('R225_HAND_BONE_SKELETON',k,'joints',v['skinJointCount'],'fingerReferences',v['fingerJointReferences'],'meshCount',v['meshCount'],'nativeAnimation',v['animations'])
print('R225_HAND_AUDIT_COMPLETED',out)
