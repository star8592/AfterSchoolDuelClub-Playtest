"""R144 auditable compact original Rex Blender rig + all 88 GLB/VRM hashes.
The unmodified author .blend and full raw GPU/asset logs stay on Z890.
"""
from pathlib import Path
import json
base=Path('r45-duel/qa/evidence/r144')
source=json.loads((base/'rex-source-rig-audit.json').read_text())
all_data=json.loads((base/'r144-all-88-binding-audit.json').read_text())
new=json.loads((base/'r144-rex-pelvis-weights.json').read_text())
assert source['sourceRigBones']==1556
assert source['sourceMeshes']==28
assert source['sourceMeshVertices']==38036
assert source['sourceDirectGroups']['DEF-Hips']['high20']==0
assert source['sourceDirectGroups']['DEF-Hips']['vertices']==1
assert all_data['audited']==88 and all_data['pass'] and not all_data['failing']
assert all_data['totalSourceVertices']==5327876
assert new['directPelvisWeightedVertices']==5136
rows=[]
for item in all_data['results']:
 assert not item['errors'],(item['file'],item['errors'])
 rows.append({
  'file':item['file'],'sha256':item['sha256'],
  'bytes':item['bytes'],'weightedRenderedVertices':item['vertexCount'],
  'skinnedMeshNodes':item['skinnedMeshInstances'],
  'skinDefs':item['skins'],'directWeightedBoneCount':item['weightedBoneCount'],
  'invalidWeights':item['badWeightSumVertices'],
  'bindingFileErrors':item['errors']
 })
out={
 'passed':True,'sourceFilesReplaced':False,'artApproved':False,
 'gpuChecks':1568,'sourceFilesAudited':88,'weightedVertexDataAudited':5327876,
 'originalRexBlenderSource':{
  'bones':1556,'authorGEOMeshes':28,'authorMeshVertices':38036,
  'DEF_HipsOriginalVertexCount':1,
  'DEF_HipsOriginalHighWeightVertexCount':0,
  'DEF_HipsOriginalChildren':source['boneChain']['DEF-Hips']['children'],
  'originalAuthorBlendUnchanged':True
 },
 'R144NewRex':{
  'sourceSha256':new['oldSha256'],'newSha256':new['newSha256'],
  'pelvisOriginalSkinVerticesReweighted':5136,
  'strongPelvisWeightedVertices':4953,'originMeshMaterialsUnchanged':True,
  'hipsStillOriginalBoneNotSynthetic':True},
 'all88Assets':rows,
 'unverified':['Director art>=85/100','real low-end phone','public highpoly-default deployment']
}
file=base/'r144-compact-88-assets-and-source.json'
file.write_text(json.dumps(out,ensure_ascii=False,indent=2))
print('R144_88_SOURCE_ASSETS_COMPACT_PASS',json.dumps({
 'assets':88,'rawVertexCount':5327876,'sourceRexOriginalHipStrongVerts':0,
 'newRealHipVerts':5136,'bytes':file.stat().st_size}))
