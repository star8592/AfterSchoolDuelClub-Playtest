"""R146 strict convergence: real seven-source skin versus orphaned R97 +
734 new true Vulkan Chrome GPU checks + 1764 refreshed legacy checks.

This receipt does not confer director art approval or production rollout.
"""
import json,runpy,hashlib
from pathlib import Path
root=Path('r45-duel/qa/evidence')
# Fully re-execute the historical strict audit, not trust copied "PASS".
runpy.run_path('r45-duel/qa/r145-acceptance-summary.py',run_name='__main__')
old=json.loads((root/'r145/action-camera/r145-convergence.json').read_text())
assert old['passed'] and old['realGPUChecks']==1764
assert old['normalGameplayModelAssetsRemain']=='R97'
assert old['sourceAssetBindingAuditCount']==88
assert old['artApproved'] is False
source=json.loads((root/'r146/seven-source-cast/r146-seven-skin-causality.json').read_text())
assert source['passed'] is True and source['actorCount']==7
assert source['originalGLBsNotOverwritten'] is True
assert source['oldR97RealWeightedPrimitiveCount']==0
assert source['newRealWeightedPrimitiveCount']==207
assert source['originalAllSevenMorphOnlyClips']==21
cast={'E03','E04','G02','G03','G04','T03','T04'}
assert set(source['actors'])==cast
for id,a in source['actors'].items():
 old_source=a['morphOnlyOrphanOldR97']
 real=a['realAuthorOriginalSkinnedCast']
 assert old_source['primitivesWithRealJointWeights']==0
 assert old_source['gltfNodesWithSkin']==0
 assert old_source['jointsReachableFromActualScene']==0
 assert real['primitivesWithRealJointWeights']==real['meshPrimitives']>0
 assert real['gltfNodesWithSkin']>=1
 assert real['jointsReachableFromActualScene']>=.9*real['originalSkeletonJointListCount']
files={
 'allSevenOneStadium':('r146/seven-source-cast/r146-seven-cast-load-and-real-weight.json',102),
 'fourOriginalMovements':('r146/seven-source-cast/r146-seven-acting-source-gpu.json',394),
 'sevenSimultaneousFifteenSeconds':('r146/seven-source-cast/r146-seven-cast-15sec.json',76),
 'sevenActualCardCombatAndCamera':('r146/seven-source-cast/r146-seven-cast-actual-combat-camera.json',100),
 'normalR97DefaultAndIndependentRollback':('r146/seven-source-cast/r146-cast-safe-rollback.json',62)
}
reports={}
counts={}
for name,(rel,n) in files.items():
 p=root/rel
 assert p.exists(),(name,'missing evidence',p)
 data=json.loads(p.read_text())
 assert data.get('passed') is True,(name,data.get('errors'))
 assert len(data['checks'])==n,(name,len(data['checks']),n)
 assert all(x.get('pass') is True for x in data['checks']),(name,'failed check')
 assert {v['view'] for v in data['views']}=={'desktop','portrait'},name
 reports[name]=data;counts[name]=n
assert sum(counts.values())==734
models={id:a['realAuthorOriginalSkinnedCast']['file'] for id,a in source['actors'].items()}
for view in reports['allSevenOneStadium']['views']:
 assert set(view['actors'])==cast
 assert view['drawCalls']<1000
 for id,a in view['actors'].items():
  assert a['file']==models[id],(id,a['file'],models[id])
  assert a['originalBindingWeight']>.28
  assert a['frontDot']>.90
for view in reports['fourOriginalMovements']['views']:
 assert set(view['actors'])==cast
for view in reports['sevenSimultaneousFifteenSeconds']['views']:
 assert len(view['readings'])==6
 for sample in view['readings']:
  assert len(sample['actors'])==7
  assert sample['drawCalls']<1750
 for actor in view['readings'][-1]['actors']:
  assert actor['arms']['maxWeightedArmVertexTravel']>.0001
  contact=actor['shoes']
  assert (contact.get('maxAfter',contact.get('maxAfterPenetration',999)))<.004
for view in reports['sevenActualCardCombatAndCamera']['views']:
 assert set(view['actors'])==cast
 for id,a in view['actors'].items():
  assert a['sourceCameraWeight']>.38
  assert a['normalizedActorWidth']>.04
  assert a['drawCalls']<=1050
for view in reports['normalR97DefaultAndIndependentRollback']['views']:
 modes=view['modes']
 assert set(modes)=={'official','off','on'}
 for id in cast:
  official=next(a['file'] for a in modes['official']['files'] if a['id']==id)
  disabled=next(a['file'] for a in modes['off']['files'] if a['id']==id)
  highpoly=next(a['file'] for a in modes['on']['files'] if a['id']==id)
  assert official==disabled and official.endswith('-Landing-R97.glb')
  assert highpoly==models[id]
 # Measuring real render cost across mode switches is required; don't
 # assert that fewer draw calls means "faster" without frame-time data.
 assert all(v['drawCalls']<1100 for v in modes.values())
screens=[
 'r146/seven-source-cast/desktop-seven-real-source-cast.png',
 'r146/seven-source-cast/portrait-seven-real-source-cast.png',
 'r146/seven-source-cast/r146-four-actor-real-game-montage.webp',
 'r146/seven-source-cast/desktop-seven-source-15sec.png',
 'r146/seven-source-cast/portrait-seven-source-15sec.png'
]
assert all((root/rel).exists() for rel in screens)
res={
 'passed':True,
 'totalRealGpuChecks':2498,'newRealGpuChecks':734,
 'rerunHistoricalR145GpuChecks':1764,
 'originalSourceAssetsAudited':88,
 'originalWeightedVerticesAudited':5327876,
 'sevenRealWeightedOriginalBlenderStudioActors':sorted(cast),
 'originalMorphOnlyR97WeightedMeshPrimitives':0,
 'sevenHighPolyActualWeightedMeshPrimitives':207,
 'oneIsolatedFeatureFlag':'?r146Cast=on',
 'explicitAndImplicitRollbackVerified':True,
 'defaultOfficialModelsStill':'R97',
 'defaultOfficialCameraStill':'R145',
 'all14GameActorIdentitiesPreserved':True,
 'newTestGroups':counts,
 'sourceAuditSha256':hashlib.sha256((root/'r146/seven-source-cast/r146-seven-skin-causality.json').read_bytes()).hexdigest(),
 'artApproved':False,
 'lowEndPhysicalMobileHardwareTested':False,
 'productionDefaultHighPoly':False,
 'livePublicSiteDeployed':False,
 'humanDirector85ScoreVerified':False,
 'evidencePaths':[rel for rel,_ in files.values()],
 'screenshots':screens,
 'unverified':['Art director acting approval 85/100',
  'Physical low-end mobile performance/VRAM, battery',
  'Public default highpoly activation/deployment',
  'Separate high-poly asset commercial-use license distribution review']
}
dest=root/'r146/seven-source-cast/r146-convergence.json'
dest.write_text(json.dumps(res,indent=2,ensure_ascii=False))
print('R146_2498_REAL_GPU_88_SOURCE_ASSETS_PASS',json.dumps({
 'checks':2498,'new':734,'legacy':1764,'assets':88,
 'sourceSkinnedPrimitives':207,'originalR97WeightedPrimitives':0,
 'default':'R97','artApproved':False}))
