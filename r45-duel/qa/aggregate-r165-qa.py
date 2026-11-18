#!/usr/bin/env python3
"""Fail-closed synthesis of local Web R165 visual, rules, and battle checks."""
from pathlib import Path
import json,shutil
SRC=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r165-magic-combat')
OUT=Path(__file__).resolve().parent/'evidence/r165-magic'
OUT.mkdir(parents=True,exist_ok=True)
gallery=json.loads((OUT/'r165-gallery-summary.json').read_text())
parity=json.loads((SRC/'r165-element-contract-parity.json').read_text())
assert gallery['cards']==46 and gallery['motifs']==40 and gallery['newDistinctMotifs']==8
assert gallery['samePixelsWithCache'] and len(gallery['samples'])==8
assert gallery['reuseHits']>=500 and gallery['geometriesCached']>=100
assert parity['passed'] and not parity['alteredGameplaySemantics']
assert len(parity['variants'])==2 and parity['variants'][0]['data']['motifs']==32
assert parity['variants'][1]['data']['motifs']==40
shutil.copy2(SRC/'r165-element-contract-parity.json',OUT/'r165-element-contract-parity.json')
completed={}
for device in ('desktop','mobile'):
 path=SRC/f'r165-{device}-optimized-original.json'
 d=json.loads(path.read_text())
 assert len(d['cases'])==2 and all(x['pass'] for x in d['cases'])
 assert set(x['variant'] for x in d['cases'])=={'original','optimized'}
 details={}
 for x in d['cases']:
  s=x['state']
  assert not x['errors']
  assert s['models']==16 and s['cards']==60 and s['download']==75569762
  assert s['sourceIdentity'] and s['cameraSafe']
  assert len(s['events'])==8
  assert s['init']['motifs']==(40 if x['variant']=='optimized' else 32)
  assert s['magic']['poolEnabled']==(x['variant']=='optimized')
  details[x['variant']]={
    'passes':8,'motifs':s['init']['motifs'],
    'cacheHits':s['magic']['geometryCacheHits'],
    'cachedGeometries':s['magic']['cachedGeometries'],
    'lastFrameDrawCallsIllustrativeOnly':s['drawCalls']}
  if x['variant']=='optimized':
   assert s['magic']['geometryCacheHits']>0
 completed[device]=details
 shutil.copy2(path,OUT/path.name)
 for variant in ('original','optimized'):
  f=SRC/f'r165-{device}-{variant}-combat.png'
  assert f.exists(),f
  shutil.copy2(f,OUT/f.name)
perf=[]
for fname in ('r165-perf-desktop-original-optimized.json',
              'r165-perf-desktop-varietyOnly-optimized.json'):
 path=SRC/fname
 assert path.exists(),path
 d=json.loads(path.read_text())
 assert len(d['experiments'])==2 and all(x['pass'] for x in d['experiments'])
 perf.append({'file':fname,'cases':[
  {'variant':x['variant'],'castSamples':len(x['casts']),
   'over33AcrossSamples':sum(z['raf']['over33'] for z in x['casts']),
   'perCastP95Ms':[z['raf']['p95'] for z in x['casts']],
   'largestObservedLongTaskMs':max([e['duration'] for z in x['casts'] for e in z['tasks']],default=0),
   'poolHits':x['final']['magic']['geometryCacheHits']}
  for x in d['experiments']]})
 shutil.copy2(path,OUT/fname)
result={
 'pass':True,'qaOnly':True,'merged':False,'deployed':False,
 'totalRealGameRuns':4,'totalRealGameSpells':32,
 'gallerySpellCards':46,'originalMotifs':32,'newMotifs':40,'newDistinctMotifs':8,
 'geometryCachePixelExact8of8':True,'noCardElementChanges46of46':True,
 'realGame':completed,'performance':perf,
 'drawCallReductionProven':False,'firstSpellStallResolved':False,
 'globalFPSImprovementProven':False,
 'releaseDecision':'NO-GO: visual prototypes and exact geometry caching validated, but real combat frame time not reliably improved and dynamic shader/light compilation persists',
 'phoneHardwareValidated':False,
 'reproNotes':'Z890 Chrome WebGL2/Vulkan; mobile was only a browser viewport; original R147 assets and logic were loaded over loopback'
}
(OUT/'r165-qa-final.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('R165_QA_SUMMARY',json.dumps({
 'pass':result['pass'],'realRuns':result['totalRealGameRuns'],
 'spells':result['totalRealGameSpells'],'motifs':result['newMotifs'],
 'elementParity':result['noCardElementChanges46of46'],
 'performance':perf},ensure_ascii=False))
