"""R147 fail-closed P0 acceptance: old shared link, scene guard, no camera,
normal R97 assets, actual R51 combat and preserved voice/impact.
R145's old default-on camera assertion is intentionally superseded.
"""
import json
from pathlib import Path
root=Path('r45-duel/qa/evidence')
safe=json.loads((root/'r147/safe-hotfix/r147-public-safety-gpu.json').read_text())
assert safe['passed'] is True and not safe['errors']
assert len(safe['checks'])==92
assert all(x.get('pass') is True for x in safe['checks'])
assert {r['view'] for r in safe['views']}=={'desktop','portrait'}
actors={'E03','E04','G02','G03','G04','T03','T04'}
sample={}
for view in safe['views']:
 assert set(view['modes'])=={'default','oldPublicBadLink','legacyPlusLab'}
 for mode,metrics in view['modes'].items():
  assert metrics['cameraActive'] is False,(view['view'],mode)
  assert len(metrics['loadedModels'])==7
  assert {x['id'] for x in metrics['loadedModels']}==actors
  assert all(x['file'].endswith('-Landing-R97.glb')
   for x in metrics['loadedModels'])
  assert metrics['sceneScript'].endswith('scene.mjs?r147Safe=1')
  assert metrics['drawCalls']<=1050
 sample[view['view']]={mode:{
  'loaded':len(row['loadedModels']),'cameraActive':row['cameraActive'],
  'drawCalls':row['drawCalls'],'loadMs':row['loadMs']}
  for mode,row in view['modes'].items()}
full=json.loads((root/'r124-full-chain/r124-full-chain-report.json').read_text())
assert full['passed'] is True and len(full['checks'])==18
assert all(x.get('pass') is True for x in full['checks'])
for row in full['views']:
 assert row['contacts']>=1 and row['voiceEvents']>=2
 assert row['perf']['load']['modelsVerified']==16
 assert row['perf']['maxDrawCalls']<1050
voice=json.loads((root/'r122-qwen-mouth/r122-real-qwen-mouth-report.json').read_text())
assert voice['passed'] is True and len(voice['checks'])==28
assert all(x.get('pass') is True for x in voice['checks'])
impact=json.loads((root/'r67/combat-results.json').read_text())
assert len(impact)==2 and {r['device'] for r in impact}=={'desktop','portrait'}
for r in impact:
 assert r['passed'] is True and not r['errors']
 assert r['combat']['impactStarted'] is True
 assert r['combat']['r90ImpactTriggers']>=1
 assert all(x in r['defending'] for x in ('Hit_Recoil','Hit_Retreat'))
assert 92+18+28+2==140
ret={
 'passed':True,'realGpuChecks':140,'newR147SafetyChecks':92,
 'R124FullFightChecks':18,'R122QwenRealLipChecks':28,
 'R67TrueHitActorChecks':2,
 'publicOldR146LinkBlocked':True,
 'automaticR145CinematicDisabled':True,
 'bothOriginalFightersVisible':True,
 'sevenUnsafeHighpolyAssetsPubliclyLoaded':0,
 'defaultModelSelection':'R97',
 'legacyCardsAndSpokenCombatPreserved':True,
 'GitHubPagesRealPublicDeploymentTested':False,
 'artApproved':False,'fixDoesNotRepairPilotSkinMaterials':True,
 'performanceNote':'Z890 local cached GPU test; GitHub Pages CDN latency not proven',
 'R124LoadedBytes':full['views'][0]['perf']['load']['downloadedBytes'],
 'screenshots':[
  'r147/safe-hotfix/desktop-oldPublicBadLink-wide.png',
  'r147/safe-hotfix/portrait-oldPublicBadLink-wide.png'
 ],
 'measured':sample
}
for file in ret['screenshots']:assert (root/file).exists(),file
out=root/'r147/safe-hotfix/r147-acceptance.json'
out.write_text(json.dumps(ret,indent=2,ensure_ascii=False))
print('R147_140_REAL_GPU_SAFE_ROLLBACK_PASS',json.dumps({
 'checks':140,'unsafeHighpoly':0,'automaticCloseups':0,
 'assetTransferBytes':ret['R124LoadedBytes'],
 'artApproved':False,'publicDeploymentYet':False},ensure_ascii=False))
