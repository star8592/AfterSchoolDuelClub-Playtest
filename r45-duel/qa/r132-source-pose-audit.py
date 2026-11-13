"""Verify six original source meshes, weights, and change in true rest geometry."""
import json,struct,hashlib,re,sys
from pathlib import Path
D=Path('r45-duel/assets/summons')
N={'E03':'Ellie','G02':'Snow','G03':'Jay','G04':'Victoria','T03':'Rain','T04':'Rex'}
def read(path):
 b=path.read_bytes()
 assert b[:4]==b'glTF' and struct.unpack_from('<I',b,8)[0]==len(b),path
 n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n])
 meshes={}
 for m in j['meshes']:
  k=m.get('name','')
  k=re.sub(r'(?i)^(r97_|data_)','',k)
  k=re.sub(r'\.\d+$','',k).lower()
  mins=[];maxs=[];cnt=0;skin=False
  for p in m['primitives']:
   a=j['accessors'][p['attributes']['POSITION']]
   cnt+=a['count']
   if 'min' in a:mins.append(a['min']);maxs.append(a['max'])
   skin|='JOINTS_0' in p['attributes'] and 'WEIGHTS_0' in p['attributes']
  if mins:
   mn=[min(x[i] for x in mins) for i in range(3)]
   mx=[max(x[i] for x in maxs) for i in range(3)]
   meshes[k]={'name':m.get('name',''),'span':[round(mx[i]-mn[i],5) for i in range(3)],'verts':cnt,'skin':skin}
 return j,meshes,hashlib.sha256(b).hexdigest(),len(b)
results={}
for id,actor in N.items():
 old,om,oh,ob=read(D/f'{id}-{actor}-Skinned-R119.glb')
 new,nm,nh,nb=read(D/f'{id}-{actor}-Skinned-R132-BakedRest-PILOT.glb')
 r97,rm,rh,rb=read(D/f'{id}-{actor}-Landing-R97.glb')
 joint_old=max(len(x['joints']) for x in old['skins'])
 joint_new=max(len(x['joints']) for x in new['skins'])
 assert nh!=oh and sum(v['skin'] for v in nm.values())>=8 and joint_new>=60
 assert all(k in nm for k in om), ('missing mesh',id,[k for k in om if k not in nm])
 same_verts=all(om[k]['verts']==nm[k]['verts'] for k in om)
 delta=[]
 for k in om:
  before=om[k];after=nm[k];prev=rm.get(k)
  dd=after['span'][0]-before['span'][0]
  if abs(dd)>=.025:
   delta.append({'mesh':k,'beforeX':before['span'][0],'bakedX':after['span'][0],
     'r97X':prev['span'][0] if prev else None,'originalVertices':before['verts'],
     'sourceWeighted':after['skin'],'xChange':round(dd,5)})
 delta.sort(key=lambda x:-abs(x['xChange']))
 proof=json.loads((D/f'{id}-{actor}-Skinned-R132-BakedRest-PILOT.proof.json').read_text())
 assert proof['r132FKShoulderSourceBaked'] and proof['status']=='EXPORTED'
 compressed=None
 if id in ('G02','T03'):
  compressed=json.loads((D/f'{id}-{actor}-Skinned-R132-BakedRest-PILOT.optimized.proof.json').read_text())
  assert compressed['sha256']==nh and compressed['originalBytes']==proof['bytes'] and compressed['unchangedNonimageBuffers']>=100
 else:
  assert nh==proof['sha256']
 assert same_verts,(id,'original vertex count changed unexpectedly')
 print('R132_BAKED_SOURCE',id,'meshes',len(nm),'skin',sum(x['skin'] for x in nm.values()),
  'joints',joint_new,'bytes',nb,'top changes',delta[:3],flush=True)
 results[id]={'actor':actor,'originalSha256':oh,'bakedSha256':nh,
  'beforeBytes':ob,'bakedBytes':nb,'originalMeshes':len(om),'bakedMeshes':len(nm),
  'allOriginalVertexCountsPreserved':same_verts,'sourceSkinnedMeshes':sum(v['skin'] for v in nm.values()),
  'sourceJoints':joint_new,'topPoseChanges':delta[:8],
  'bakedPose':True,'compressedProof':compressed and {k:compressed[k] for k in ['originalBytes','webBytes','unchangedNonimageBuffers','sha256']},
  'oldSourceWeightMeshes':sum(v['skin'] for v in om.values())}
 assert delta,(id,'source rest pose no meaningful geometry changed')
dest=Path('r45-duel/qa/evidence/r132/r132-six-source-rest-audit.json')
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps({'passed':True,'results':results},indent=2,ensure_ascii=False))
print('R132_SIX_ORIGINAL_SOURCE_REST_AUDIT_PASS',len(results),flush=True)
