"""R144 final fail-closed asset+GPU verification, no art approval claim."""
from pathlib import Path
import json
ROOT=Path('r45-duel/qa/evidence')
asset=json.loads((ROOT/'r144/r144-all-88-binding-audit.json').read_text())
proof=json.loads((ROOT/'r144/r144-rex-pelvis-weights.json').read_text())
assert asset['pass'] is True and not asset['failing']
assert asset['audited']==88,asset.get('audited')
assert asset['totalSourceVertices']==5327876,asset.get('totalSourceVertices')
assert proof['passed'] and proof['sourceFileUnmodified']
assert proof['directPelvisWeightedVertices']==5136
assert proof['oldSha256']=='fabe89345185d8b07c21cee058ee4f0488b164b342525a295084809f4c045179'
assert proof['newSha256']=='cf40c58125eb9ebc8ccfe3dc56b08589f705ae2e45190e162da7d9b24d67000f'
old=next(r for r in asset['results'] if
 r['file'].endswith('/T04-Rex-Skinned-R132-BakedRest-PILOT.glb'))
new=next(r for r in asset['results'] if
 r['file'].endswith('/T04-Rex-Skinned-R144-WeightedPelvis-PILOT.glb'))
assert old['sha256']==proof['oldSha256']
assert new['sha256']==proof['newSha256']
assert old['vertexCount']==new['vertexCount']==43672
assert old['directWeightSummary'].get('DEF-Hips',{}).get('vertices',0)==0
assert new['directWeightSummary']['DEF-Hips']['vertices']==5136
assert new['directWeightSummary']['DEF-Hips']['highWeightVertices']==4953
assert new['badWeightSumVertices']==0 and not new['errors']
assert old['meshes']==new['meshes'] and old['skins']==new['skins']
groups={
 'r144GenuinePelvisStage':('r144/rex-pelvis/r144-real-weighted-rex-pelvis-gpu.json',152),
 'r144DefaultAndSafeRollback':('r144/rex-pelvis/r144-default-and-rollback.json',32),
 'r143SevenSourceTorso':('r143/source-trunk/r143-torso-7-source-gpu.json',394),
 'r143IndependentRollback':('r143/source-trunk/r143-rig-rollback-default.json',46),
 'r142RexJayOriginalLegs':('r142/guard-lab/r142-guard-lab-original-source.json',86),
 'r141ThreeSourceFacesQwen':('r141/seven-source-faces/r141-real-three-source-face-voice.json',152),
 'r141DuplicateRecordedQwen':('r141/seven-source-faces/r141-double-card-voice-isolation.json',32),
 'r134JayOriginalStage':('r134/r134-jay-acting-pilot.json',22),
 'r135EllieRexOriginalStage':('r135/original-pair/r135-pair-original-source-stage.json',53),
 'r135FifteenSecIdle':('r135/original-pair/r135-pair-original-idle-15sec.json',16),
 'r135IndependentFlag':('r135/original-pair/r135-independent-flag-isolation.json',25),
 'r140OriginalFourFaces':('r140/source-faces/r140-real-source-face.json',170),
 'r140FourRecordedQwen':('r140/source-faces/r140-all-four-actual-qwen.json',54),
 'r139VictoriaRealLegs':('r139/victoria/r139-victoria-stage.json',36),
 'r138RealCameraSilhouette':('r138/visible-silhouette/r138-visibility-baseline.json',70),
 'r136FourOriginalActorStage':('r136/four-source/r136-four-source-action.json',83),
 'r136SelectiveRollback':('r136/four-source/r136-flag-rollback.json',63),
 'r136FourSourceIdle15sec':('r136/four-source/r136-four-ensemble-15sec.json',36),
 'r124CardFight':('r124-full-chain/r124-full-chain-report.json',18),
 'r122DuelistQwen':('r122-qwen-mouth/r122-real-qwen-mouth-report.json',28)
}
data={}
for title,(file,expected) in groups.items():
 d=json.loads((ROOT/file).read_text())
 assert d.get('passed') is True,(title,d.get('errors'))
 assert len(d.get('checks',[]))==expected,(title,len(d.get('checks',[])),expected)
 assert all(x.get('pass') is True for x in d['checks']),title
 data[title]=d
assert sum(n for _,n in groups.values())==1568
stage=data['r144GenuinePelvisStage']
assert {v['view'] for v in stage['views']}=={'desktop','portrait'}
comparison={}
for v in stage['views']:
 oldmode=v['modes']['old'];newmode=v['modes']['weighted']
 assert oldmode['pelvis'] is None and oldmode['sourceTracks']==16
 assert newmode['sourceTracks']==17
 hips=newmode['pelvis']
 assert hips['enabled'] and hips['highWeightSourceVertices']==4953
 assert hips['sourceVerticesWithNonzeroPelvisWeight']==5136
 assert hips['maxHipRotation']>.09
 assert hips['maxWeightedPelvisVertexTravel']>.012
 assert hips['maxRestSkinVertexDrift']<=.0002
 assert len(hips['sourceChildLinks'])==3
 assert v['modes']['weighted']['shoeMaxAfter']==0
 assert v['modes']['old']['shoeMaxAfter']==0
 comparison[v['view']]={
  'oldRealTracks':oldmode['sourceTracks'],
  'newRealTracks':newmode['sourceTracks'],
  'pelvisWeightedHighVerts':hips['highWeightSourceVertices'],
  'maxActualOriginalHipRotation':hips['maxHipRotation'],
  'maxActualWeightedSkinTravel':hips['maxWeightedPelvisVertexTravel'],
  'floorPenetration':newmode['shoeMaxAfter']}
rollback=data['r144DefaultAndSafeRollback']
assert {v['view'] for v in rollback['views']}=={'desktop','portrait'}
for v in rollback['views']:
 r=v['results']
 assert r['official']['file']=='T04-Rex-Landing-R97.glb'
 assert r['noPair']['file']=='T04-Rex-Landing-R97.glb'
 assert r['rollback']['file']=='T04-Rex-Skinned-R132-BakedRest-PILOT.glb'
res={
 'passed':True,'totalRealGpuChecks':1568,'newGpuChecks':184,
 'legacyGpuChecksR143':1384,'originalAssetsAudited':88,
 'sourceWeightedVertexDataAudited':5327876,
 'originalRexSourceInputUnchanged':True,
 'realHipBindingVertexCount':5136,'realHighHipWeightVerts':4953,
 'realHipMotionAndAllOldActionsVerified':True,
 'oldRealSourceTracks':16,'newRealSourceTracks':17,
 'viewMetrics':comparison,
 'assetSha256':{'new':proof['newSha256'],'old':proof['oldSha256']},
 'testCounts':{key:n for key,(_,n) in groups.items()},
 'evidencePaths':[file for file,_ in groups.values()],
 'assetAudit':'r144/r144-all-88-binding-audit.json',
 'artApproved':False,'defaultOfficialModels':'R97',
 'newRexFlag':'r135Pair=on&r144Rex=on',
 'independentRollback':'r144Rex=off or r143Rig=off',
 'unverified':[
  'Human director art review (85/100)',
  'Low-end physical smartphone performance',
  'Official highpoly-default production rollout',
  'Larger normal-camera acting range for all cast']
}
p=ROOT/'r144/r144-convergence.json'
p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(res,indent=2,ensure_ascii=False))
print('R144_1568_REAL_GPU_88_ASSETS_PASS',json.dumps({
 'gpu':1568,'new':184,'history':1384,'assets':88,'vertices':5327876,
 'hipVerts':5136,'highHipVerts':4953,'artApproved':False,'default':'R97'}))
