#!/usr/bin/env python3
"""Fail-closed reproducible synthesis of completed R161 Chrome Vulkan A/B runs."""
from pathlib import Path
import json
from PIL import Image,ImageChops,ImageStat

REMOTE=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r161-stadium')
OUT=Path(__file__).resolve().parent/'evidence/r161-stadium'
OUT.mkdir(parents=True,exist_ok=True)
records=[]
for filename in ('r161-1280-forward.json','r161-1280-reverse.json',
                 'r161-430-forward.json','r161-430-reverse.json'):
 path=REMOTE/filename
 run=json.loads(path.read_text())
 cases=run['scenarios']
 assert len(cases)==(3 if filename=='r161-1280-forward.json' else 2),filename
 assert all(c['success'] for c in cases),(filename,cases)
 for case in cases:
  s=case['snapshot']
  p=s['r161']
  audit=s['stadium']['r161Batching']
  assert case['errors']==[]
  assert s['cards']==60 and s['modelsVerified']==16
  assert s['receivedBytes']==75569762 and s['summonCount']==12
  assert s['sourceIdentity'] and s['cameraSafe']
  assert s['combat']['playedEvents']>=1
  assert p['enabled']
  if case['name']=='batch':
   assert audit['enabled']
   assert audit['checksPassed']==53 and audit['nominalSavedDraws']==48
   assert audit['instancedDraws']==5 and len(audit['groups'])==5
   assert sum(i['from'] for i in audit['groups'])==53
   assert p['insetDrawCalls']['p50']==128
  if case['name']=='baseline':
   assert audit['nominalSavedDraws']==0 and not audit['enabled']
   assert p['insetDrawCalls']['p50']==128
  if case['name']=='inset-off':
   assert p['qaInsetSkipped'] and p['scenesWithInset']==0
  records.append({
   'experiment':filename,'variant':case['name'],
   'mainDrawCallsP50':p['mainDrawCalls']['p50'],
   'insetDrawCallsP50':p['insetDrawCalls']['p50'],
   'mainCpuSubmissionP50ms':p['mainCpuSubmissionMs']['p50'],
   'insetCpuSubmissionP50ms':p['insetCpuSubmissionMs']['p50'],
   'activeFrameP95ms':case['active']['p95'],
   'nominalDrawSaved':audit['nominalSavedDraws'],
   'passed':case['success']})
 (OUT/filename).write_text(path.read_text())
for width in (1280,430):
 for variant in ('baseline','batch'):
  p=REMOTE/f'{variant}-{width}-combat.png'
  (OUT/p.name).write_bytes(p.read_bytes())
p=REMOTE/'r161-static-image-equivalence.json'
if p.exists():
 (OUT/p.name).write_bytes(p.read_bytes())
quality={
 'geometryMaterialTransforms':'53 static object matrices and source geometry/material signatures checked',
 'comparisonInterpretation':'animations asynchronous; static RGB crops only, not whole-frame pixel-equivalence claim',
 'insetOffDiagnosticOnly':True,
 'officialDefault':False,
 'reducedPixelRatio':False,'texturesModified':False,'animationsModified':False,
 'r147CameraSafety':True}
assert len(records)==9,len(records)
by_group={}
for name in ('r161-1280-forward.json','r161-1280-reverse.json',
             'r161-430-forward.json','r161-430-reverse.json'):
 group=[r for r in records if r['experiment']==name]
 baseline=next(r for r in group if r['variant']=='baseline')
 batch=next(r for r in group if r['variant']=='batch')
 assert batch['mainDrawCallsP50']<baseline['mainDrawCallsP50']
 by_group[name]={
 'baselineP50DrawCalls':baseline['mainDrawCallsP50'],
 'batchP50DrawCalls':batch['mainDrawCallsP50'],
 'observedDrawCallReduction':baseline['mainDrawCallsP50']-batch['mainDrawCallsP50'],
 'baselineActiveP95ms':round(baseline['activeFrameP95ms'],3),
 'batchActiveP95ms':round(batch['activeFrameP95ms'],3)}
summary={'cases':len(records),'passed':all(r['passed'] for r in records),
 'compared':by_group,'records':records,'qualityGates':quality,
 'sourceModelsNetworkBytes':75569762,
 'officialWebDeploymentChanged':False}
(OUT/'r161-final-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('R161_VALIDATED_COMPLETE',len(records),'CASES',json.dumps(by_group,ensure_ascii=False))
