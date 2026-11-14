#!/usr/bin/env python3
"""R144: source-authored high-poly Rex pelvis weight repair.
Write a *distinct* pilot GLB. Keep R132 untouched, no new mesh,
no fabricated joints, no source armature or inverse bind mutation.
"""
import hashlib,importlib.util,json,struct
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parent.parent
SRC=ROOT/'assets/summons/T04-Rex-Skinned-R132-BakedRest-PILOT.glb'
OUT=ROOT/'assets/summons/T04-Rex-Skinned-R144-WeightedPelvis-PILOT.glb'
EVID=ROOT/'qa/evidence/r144/r144-rex-pelvis-weights.json'
EXPECTED='fabe89345185d8b07c21cee058ee4f0488b164b342525a295084809f4c045179'
MESHES={
 'GEO-rex_belt':(750,.75),
 'GEO-rex_belt_buckle':(1100,.78),
 'GEO-rex_shorts':(1550,.75),
 'GEO-rex_sweater_vest':(70,.43)
}
def smooth(y,scale):
 if y<=.775:return scale
 if y>=.88:return 0.
 t=(y-.775)/(.88-.775)
 return scale*(1-t*t*(3-2*t))
def main():
 source=SRC.read_bytes()
 assert hashlib.sha256(source).hexdigest()==EXPECTED,'Original artist Rex R132 altered'
 buf=bytearray(source)
 assert buf[:4]==b'glTF' and struct.unpack_from('<I',buf,8)[0]==len(buf)
 length=struct.unpack_from('<I',buf,12)[0]
 doc=json.loads(buf[20:20+length])
 offset=20+length
 binary_size,tag=struct.unpack_from('<I4s',buf,offset)
 assert tag==b'BIN\x00' and offset+8+binary_size==len(buf)
 raw=memoryview(buf)[offset+8:offset+8+binary_size]
 spec=importlib.util.spec_from_file_location('r143audit',ROOT/'qa/r143-audit-all-bindings.py')
 mod=importlib.util.module_from_spec(spec)
 spec.loader.exec_module(mod)
 nodes=doc['nodes']
 changed={}
 seen=set()
 total=0
 maximum=0.
 for node in nodes:
  name=node.get('name','')
  if name not in MESHES or 'skin' not in node:continue
  required,factor=MESHES[name]
  jointnames=[nodes[n].get('name','') for n in doc['skins'][node['skin']]['joints']]
  hip=jointnames.index('DEF-Hips')
  spine=jointnames.index('DEF-Spine')
  edited=high=skipped=0
  err=0.
  for primitive in doc['meshes'][node['mesh']]['primitives']:
   a=primitive.get('attributes',{})
   if not all(t in a for t in ('POSITION','JOINTS_0','WEIGHTS_0')):continue
   pair=(a['JOINTS_0'],a['WEIGHTS_0'])
   assert pair not in seen,'Shared skin accessor would double-edit'
   seen.add(pair)
   ind=mod.accessor(doc,raw,a['JOINTS_0'])
   w=mod.accessor(doc,raw,a['WEIGHTS_0'])
   xyz=mod.accessor(doc,raw,a['POSITION'])
   assert doc['accessors'][a['WEIGHTS_0']]['componentType']==5126
   assert doc['accessors'][a['JOINTS_0']]['componentType'] in (5121,5123)
   for v in range(len(w)):
    spots=np.where(ind[v]==spine)[0]
    if len(spots)!=1 or w[v,spots[0]]<.09:continue
    strength=smooth(float(xyz[v,1]),factor)
    if strength<.1:continue
    empty=np.where(w[v]<1e-6)[0]
    if len(empty)==0:
     skipped+=1;continue
    slot=int(spots[0]);free=int(empty[0])
    amt=float(w[v,slot])*strength
    if amt<.03:continue
    before=float(w[v].sum())
    w[v,slot]-=amt
    ind[v,free]=hip
    w[v,free]=amt
    err=max(err,abs(before-float(w[v].sum())))
    edited+=1
    high+=int(amt>=.2)
    maximum=max(maximum,amt)
  assert edited>=required,(name,edited,required)
  assert err<2e-6,(name,err)
  changed[name]=dict(weightedPelvisVertices=edited,highWeightVertices=high,
                     fullInfluenceSkipped=skipped,maxWeightSumDrift=err,
                     spineToPelvisFactor=factor)
  total+=edited
 assert set(changed)==set(MESHES)
 assert total>=3600 and maximum>.5,(total,maximum)
 output=bytes(buf)
 assert len(output)==len(source) and output!=source
 OUT.write_bytes(output)
 assert hashlib.sha256(SRC.read_bytes()).hexdigest()==EXPECTED
 newsha=hashlib.sha256(output).hexdigest()
 EVID.parent.mkdir(parents=True,exist_ok=True)
 EVID.write_text(json.dumps({
  'passed':True,'artApproved':False,'sourceFileUnmodified':True,
  'oldSha256':EXPECTED,'newSha256':newsha,'sourceFile':str(SRC.relative_to(ROOT)),
  'derivedFile':str(OUT.relative_to(ROOT)),
  'originalAndNewByteSize':len(output),
  'originalMaterialMeshAndUVBuffersPreserved':True,
  'newBones':0,'newMeshes':0,'newInverseBindMatrices':0,
  'originalHipSkinJointIndex':hip,'originalSpineSkinJointIndex':spine,
  'directPelvisWeightedVertices':total,'maxNewPelvisWeight':maximum,
  'originalAuthorMeshesModified':changed,'productionDefault':'R97',
  'needsRealGpuActingAcceptance':True
 },indent=2,ensure_ascii=False))
 print('R144_WEIGHTED_REX_GLB_CREATED',
       json.dumps({'sourceSha':EXPECTED[:12],'newSha':newsha[:12],
         'pelvisVertices':total,'maximumWeight':round(maximum,4),
         'meshes':changed,'bytes':len(output)},ensure_ascii=False))
if __name__=='__main__':main()
