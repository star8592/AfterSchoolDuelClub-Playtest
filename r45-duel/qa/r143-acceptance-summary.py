"""Fail-closed R143: all GLB/VRM source weights + stage/rollback + all legacy GPU.
No artistic approval, consumer device signoff, or public deployment claim.
"""
from pathlib import Path
import json
root=Path('r45-duel/qa/evidence')
asset=json.loads((root/'r143/r143-complete-asset-binding-report.json').read_text())
assert asset['audited']==87,asset['audited']
assert asset['totalSourceVertices']==5284204,asset['totalSourceVertices']
assert asset['pass'] is True and not asset['failing'],asset['failing']
assert len(asset['results'])==87
pilots=[r for r in asset['results'] if 'pilotActor' in r]
assert {x['pilotActor'] for x in pilots}=={'E03','E04','G02','G03','G04','T03','T04'}
assert all(not p['errors'] and p['vertexCount']>15000 for p in pilots)
rex=next(x for x in pilots if x['pilotActor']=='T04')
assert rex['pelvis']['DEF-Hips']['directVertices']==0
snow=next(x for x in pilots if x['pilotActor']=='G02')
assert snow['pelvis']['DEF-Hips']['directVertices']==621
rain=next(x for x in pilots if x['pilotActor']=='T03')
assert rain['pelvis']['DEF-Pelvis']['directVertices']==3288

cases={
 'r143SevenOriginalTorsoStage':('r143/source-trunk/r143-torso-7-source-gpu.json',394),
 'r143ExplicitRollbackAndDefault':('r143/source-trunk/r143-rig-rollback-default.json',46),
 'r142GuardLabLegs':('r142/guard-lab/r142-guard-lab-original-source.json',86),
 'r141ThreeSourceFaceVoice':('r141/seven-source-faces/r141-real-three-source-face-voice.json',152),
 'r141TwoCampQwenIsolation':('r141/seven-source-faces/r141-double-card-voice-isolation.json',32),
 'r134Jay':('r134/r134-jay-acting-pilot.json',22),
 'r135EllieRex':('r135/original-pair/r135-pair-original-source-stage.json',53),
 'r135Idle15sec':('r135/original-pair/r135-pair-original-idle-15sec.json',16),
 'r135FlagIsolation':('r135/original-pair/r135-independent-flag-isolation.json',25),
 'r140FourOriginalFaces':('r140/source-faces/r140-real-source-face.json',170),
 'r140FourOriginalQwen':('r140/source-faces/r140-all-four-actual-qwen.json',54),
 'r139Victoria':('r139/victoria/r139-victoria-stage.json',36),
 'r138NormalCamera':('r138/visible-silhouette/r138-visibility-baseline.json',70),
 'r136OriginalFour':('r136/four-source/r136-four-source-action.json',83),
 'r136SelectiveRollback':('r136/four-source/r136-flag-rollback.json',63),
 'r136Ensemble15sec':('r136/four-source/r136-four-ensemble-15sec.json',36),
 'r124OfficialCardFight':('r124-full-chain/r124-full-chain-report.json',18),
 'r122HostsQwen':('r122-qwen-mouth/r122-real-qwen-mouth-report.json',28)
}
counts={};data={}
for label,(file,expect) in cases.items():
 j=json.loads((root/file).read_text())
 assert j.get('passed') is True,(label,j.get('errors'))
 checks=j.get('checks',[])
 assert len(checks)==expect,(label,len(checks),expect)
 assert all(check.get('pass') is True for check in checks),(label,'failed check')
 counts[label]=expect
 data[label]=j
assert sum(counts.values())==1384,sum(counts.values())
stage=data['r143SevenOriginalTorsoStage']
rollback=data['r143ExplicitRollbackAndDefault']
assert {v['view'] for v in stage['views']}=={'desktop','portrait'}
assert {v['view'] for v in rollback['views']}=={'desktop','portrait'}
for view in stage['views']:
 assert set(view['actors'])=={'E03','E04','G02','G03','G04','T03','T04'}
 for id in ['E03','E04','G03','G04','T04']:
  proof=view['actors'][id]['trunk']
  assert proof['enabled'] is True
  assert proof['changedParentLinks']==(4 if id=='E04' else 5)
  assert proof['maxBindRestDrift']<=2e-5
  assert proof['maxRenderedRestDrift']<=2e-4
  assert proof['rigGeometryReplaced'] is False
 for id in ['G02','T03']:
  assert view['actors'][id]['trunk'] is None
for view in rollback['views']:
 assert view['production']=='R97'
 assert view['explicitRollback']=='r143Rig=off'
res={
 'passed':True,'totalGpuChecks':1384,'sourceAssetCount':87,
 'skinnedVertexDataChecked':5284204,
 'actorOriginalTorsoStageChecks':394,'rollbackChecks':46,
 'legacyRegressionChecks':944,'artApproved':False,
 'defaultOfficialModels':'R97',
 'mainBase':'55cbe87afd097ab4ce2f6eebe562e97ec643d728',
 'flatTrunkRepairs':{'E03':5,'E04':4,'G03':5,'G04':5,'T04':5},
 'nativeTrunksPreserved':['G02','T03'],
 'unweightedRexHipsKnownUnresolved':True,
 'sourceBinaryFilesChanged':False,
 'rollbackParameter':'?r143Rig=off',
 'checks':counts,
 'notYetSigned':['Real consumer mobile GPU',
   'Human director 85/100 aesthetic acceptance',
   'New physically weighted Rex pelvis authoring',
   'Official R97-to-high-poly production rollout'],
 'evidencePaths':[row[0] for row in cases.values()],
 'assetAudit':'r143/r143-complete-asset-binding-report.json'
}
p=root/'r143/source-trunk/r143-convergence.json'
p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(res,indent=2,ensure_ascii=False))
print('R143_1384_REAL_GPU_87_ASSETS_PASS',json.dumps({
 'GPU':1384,'assets':87,'vertices':5284204,
 'artApproved':False,'default':'R97'},ensure_ascii=False))
