"""Compact reproducible evidence for all 87 original assets and R143 GPU.
Source full JSONs remain on Z890. This script does not synthesize QA passes.
"""
from pathlib import Path
import json
root=Path('r45-duel/qa/evidence/r143')
asset=json.loads((root/'r143-complete-asset-binding-report.json').read_text())
assert asset['audited']==87 and asset['totalSourceVertices']==5284204
assert asset['pass'] and not asset['failing']
by_asset=[]
for a in asset['results']:
 assert not a['errors'],(a['file'],a['errors'])
 by_asset.append({
  'file':a['file'],'sha256':a['sha256'],
  'bytes':a['bytes'],'skinnedVertices':a['vertexCount'],
  'skinDefs':a['skins'],'skinnedNodes':a['skinnedMeshInstances'],
  'weightedBones':a['weightedBoneCount'],
  'errorCount':0,'warningCount':len(a['warnings'])
 })
pilots={}
for a in asset['results']:
 if not a.get('pilotActor'):continue
 pilots[a['pilotActor']]={
  'file':a['file'],'skinVertices':a['vertexCount'],
  'weightedBoneCount':a['weightedBoneCount'],
  'pelvis':a['pelvis'],
  'requiredMissingNodes':a['requiredMissingNodes'],
  'requiredNoDirectWeightedVertices':a['requiredNoDirectWeightedVertices']
 }
assert set(pilots)=={'E03','E04','G02','G03','G04','T03','T04'}
static={
 'passed':True,'artApproved':False,'originalSourceFilesUnmodified':True,
 'sourceAssets':87,'weightedVerticesAudited':5284204,
 'assetReadout':by_asset,'sourcePilots':pilots,
 'sourceFacts':{'RexDefHipsHasNoDirectVertices':True,
                'SnowDefHipsDirectVertices':621,
                'RainDefPelvisDirectVertices':3288,
                'fiveFlatTrunks':['E03','E04','G03','G04','T04']}
}
p=root/'r143-compact-binding-report.json'
p.write_text(json.dumps(static,ensure_ascii=False,indent=2))
face=json.loads((root/'source-trunk/r143-torso-7-source-gpu.json').read_text())
roll=json.loads((root/'source-trunk/r143-rig-rollback-default.json').read_text())
assert face['passed'] is True and len(face['checks'])==394
assert roll['passed'] is True and len(roll['checks'])==46
gpu={'passed':True,'artApproved':False,'checks':{
 'originalTrunkPassed':len(face['checks']),
 'rollbackAndOfficialPassed':len(roll['checks']),
 'failingCheckLabels':[c['label'] for c in face['checks']+roll['checks']
   if c.get('pass') is not True]},
 'views':{},'originalSourceFilesUnmodified':True,
 'productionDefault':'R97',
 'rollback':'?r143Rig=off'}
for view in face['views']:
 assert set(view['actors'])==set(pilots)
 gpu['views'][view['view']]={}
 for id,x in view['actors'].items():
  trunk=x['trunk']
  gpu['views'][view['view']][id]={
   'connectedSourceBones':trunk['changedParentLinks'] if trunk else 0,
   'maxRenderedRestDrift':trunk['maxRenderedRestDrift'] if trunk else 0,
   'maxBindRestDrift':trunk['maxBindRestDrift'] if trunk else 0,
   'trueWeightedVertexRefs':trunk['actualWeightedVertices'] if trunk else [],
   'originalSkinnedLegVertexTravel':x['legs']['maxWeightedTravel'],
   'originalLegTracks':x['legs']['originalLegTracks'],
   'originalOutsoleContactAfterAction':x['shoes']
  }
p=root/'source-trunk/r143-compact-trunk-gpu.json'
p.write_text(json.dumps(gpu,ensure_ascii=False,indent=2))
print('R143_87_ASSETS_440_GPU_CHECKS_COMPACT_PASS',
 json.dumps({'assets':87,'vertices':5284204,'gpuChecks':440,
 'assetBytes':(root/'r143-compact-binding-report.json').stat().st_size,
 'gpuBytes':p.stat().st_size},ensure_ascii=False))
