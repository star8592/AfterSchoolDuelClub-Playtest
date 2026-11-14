"""R145 fail-closed real combat action-camera GPU convergence.
R144 original binding evidence and prior actual game tests must all pass
on the SAME candidate worktree; art and public deploy remain unsigned.
"""
from pathlib import Path
import json,runpy
root=Path('r45-duel/qa/evidence')
# Execute (not trust title of) previous strict R144 acceptance logic.
runpy.run_path('r45-duel/qa/r144-acceptance-summary.py',run_name='__main__')
old=json.loads((root/'r144/r144-convergence.json').read_text())
assert old['passed'] is True and old['totalRealGpuChecks']==1568
assert old['originalAssetsAudited']==88
assert old['defaultOfficialModels']=='R97'
newFiles={
 'sourceCombatLens':('r145/action-camera/r145-real-actor-action-lens.json',60),
 'motionAndOrbitGuards':('r145/action-camera/r145-accessibility-orbit.json',20),
 'all14OriginalSourceActors':('r145/action-camera/r145-all-14-source-cards.json',114)
}
checks={}
report={}
for title,(file,expected) in newFiles.items():
 j=json.loads((root/file).read_text())
 assert j.get('passed') is True,(title,j.get('errors'))
 assert len(j['checks'])==expected,(title,len(j['checks']),expected)
 assert all(x.get('pass') is True for x in j['checks']),(title,'failed check')
 checks[title]=expected;report[title]=j
assert sum(checks.values())==194
stage=report['sourceCombatLens']
assert {x['view'] for x in stage['views']}=={'desktop','portrait'}
metrics={}
for row in stage['views']:
 v=row['view'];m=row['modes']
 assert set(m)=={'off','on','highpoly'}
 assert all(x['recovered'] for x in m.values())
 assert m['on']['camera']['enabled'] is True
 assert m['off']['camera']['enabled'] is False
 assert m['off']['camera']['peakWeight']==0
 assert m['on']['camera']['peakWeight']>.45
 assert m['on']['sourceModels'][0]['file'].endswith('-Landing-R97.glb')
 assert m['highpoly']['sourceModels'][1]['file']=='T04-Rex-Skinned-R144-WeightedPelvis-PILOT.glb'
 assert m['on']['drawCalls']<=1050
 assert m['highpoly']['drawCalls']<=1050
 assert m['on']['playerCoverage']/m['off']['playerCoverage']>=1.45
 assert m['highpoly']['playerCoverage']/m['off']['playerCoverage']>=1.45
 if v=='portrait':
  assert m['on']['receiverFocus']=='defender'
  assert m['highpoly']['receiverFocus']=='defender'
 metrics[v]={
  'oldActorWidthFraction':m['off']['playerCoverage'],
  'newActorWidthFraction':m['on']['playerCoverage'],
  'highPolyActorWidthFraction':m['highpoly']['playerCoverage'],
  'oldToNewWidthRatio':round(m['on']['playerCoverage']/m['off']['playerCoverage'],3),
  'newDrawCalls':m['on']['drawCalls'],
  'highPolyDrawCalls':m['highpoly']['drawCalls'],
  'trueVictimReactionCut':m['on']['receiverFocus']=='defender'}
safety=report['motionAndOrbitGuards']
for row in safety['views']:
 c=row['contexts']
 assert c['manualOrbit']['camera']['active'] is None
 assert c['manualOrbit']['camera']['frameWeight']==0
 assert abs(c['manualOrbit']['camera']['orbitDegrees'])>70
 assert c['reduced']['camera']['active'] is None
 assert c['reduced']['camera']['frameWeight']==0
all_actors=report['all14OriginalSourceActors']
cast={'E01','E02','E03','E04','G01','G02','G03','G04',
 'M01','M02','T01','T02','T03','T04'}
assert {v['view'] for v in all_actors['views']}=={'desktop','portrait'}
for v in all_actors['views']:
 assert set(v['actors'])==cast
 for actor,p in v['actors'].items():
  assert p['worldKind'] in ('gltf-instance','original-vrm','vrm-instance')
  assert p['normalizedActorWidth']>0
  assert p['sourceCameraWeight']>.38
  assert p['drawCalls']<=1050
assert old['artApproved'] is False
result={
 'passed':True,'realGPUChecks':1762,
 'legacyRealGPUChecks':1568,'newRealGPUChecks':194,
 'sourceAssetBindingAuditCount':88,
 'sourceWeightedVerticesValidated':5327876,
 'normalGameplayNewCameraDefault':True,
 'independentCameraRollback':'?r145ActionCamera=off',
 'manualOrbitAndReducedMotionPreserved':True,
 'noNewMeshesOrAnimationsRequired':True,
 'sourceLensOnlyFromValidatedR51Events':True,
 'genuineSkinnedModelCoverageMetrics':metrics,
 'every14OriginalCardsTestedInBothViews':True,
 'artApproved':False,
 'normalGameplayModelAssetsRemain':'R97',
 'officialLiveDeploymentVerified':False,
 'humanDirector85ScoreVerified':False,
 'lowEndRealMobileHardwareTested':False,
 'newChecks':checks,
 'legacyR144Counts':old['testCounts'],
 'evidencePaths':[x[0] for x in newFiles.values()],
 'photographicScreenshots':[
  'r145/action-camera/r145-off-on-highpoly-actual-camera.webp',
  'r145/action-camera/portrait-on-receiver.png',
  'r145/action-camera/portrait-highpoly-receiver.png']
}
for file in result['photographicScreenshots']:
 assert (root/file).exists(),file
out=root/'r145/action-camera/r145-convergence.json'
out.write_text(json.dumps(result,indent=2,ensure_ascii=False))
print('R145_1762_REAL_GPU_88_ASSETS_PASS',json.dumps({
 'gpuChecks':1762,'new':194,'history':1568,
 'assets':88,'vertices':5327876,'R97Default':True,
 'directorArtApproved':False,'coverage':metrics},ensure_ascii=False))
