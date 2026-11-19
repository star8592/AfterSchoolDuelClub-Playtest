"""R188 verified 4-source actual browser 93-cast A/B with real animation rigs."""
from pathlib import Path
import json,hashlib,shutil,statistics,struct
root=Path(__file__).resolve().parents[1]
p=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r188-owl-source-swap')
out=root/'qa/evidence/r188-light-owl'
raw=out/'real-browser-runs';raw.mkdir(exist_ok=True)
files={
'original':'T01-Owl-Innerscene-R84.glb',
'texture512':'T01-Owl-Innerscene-R187-512.glb',
'radio':'T01-BroadcastOwl-PolyforkRadio-R73.glb',
'barn':'T01-BroadcastOwl-BarnOwl.glb'}
cases=[]
failed=[]
for folder in sorted(p.iterdir()):
 if not folder.is_dir():continue
 reports=list(folder.glob('r173-*-batched-cpu*.json'))
 if len(reports)!=1:continue
 j=json.loads(reports[0].read_text())
 orig=j['initial']
 src=orig.get('owlRuntimeSource') or (
  'T01-Owl-Innerscene-R84.glb' if orig['bytes']==75569762 else None)
 variant=next((k for k,v in files.items() if src==v),None)
 if not variant or not j.get('pass') or j['errors']:
  failed.append({'case':folder.name,'variant':variant,'issues':j.get('errors',[])[:3]})
  continue
 assert orig['models']==16 and orig['cards']==60 and orig['soundPatterns']==46
 assert j['passTwo']['stage']['played']==93
 assert j['passTwo']['stage']['uniqueRenderedProps']==46
 if variant in ('barn','radio'):
  animation=j.get('realOwlSkeleton')
  if animation:
   assert animation['loaded'] and animation['visible']
   assert animation['actualMeshes']==(1 if variant=='barn' else 16)
   assert animation['actualClips']==4 and len(animation['playingClips'])>0
 dest=raw/(folder.name+'.json')
 shutil.copy2(reports[0],dest)
 cases.append({'case':folder.name,'variant':variant,'view':j['view'],
 'cpuThrottle':j['cpu'],'startupMs':orig['startupMs'],
 'firstMaxRafMs':j['cold']['max'],'longTaskMaxMs':j['cold']['longTaskMax'],
 'originalAssetsCount':orig['models'],
 'loadedBytes':orig['bytes'],'source':src,
 'rigPlayback':j.get('realOwlSkeleton'),
 'eventCount':93,'pass':True,
 'receipt':'qa/evidence/r188-light-owl/real-browser-runs/'+dest.name})
assert len(cases)>=12,len(cases)
summary={}
for view in ('desktop','mobile'):
 summary[view]={}
 for key in files:
  subset=[x for x in cases if x['view']==view and x['variant']==key]
  assert len(subset)>=2,(view,key,len(subset))
  summary[view][key]={
   'runs':len(subset),
   'startupMs': [x['startupMs'] for x in subset],
   'maxRafMs': [x['firstMaxRafMs'] for x in subset],
   'maxLongTaskMs': [x['longTaskMaxMs'] for x in subset],
   'medianStartupMs':round(statistics.median(x['startupMs'] for x in subset)),
   'maxObservedRafMs':max(x['firstMaxRafMs'] for x in subset),
   'maxObservedLongTaskMs':max(x['longTaskMaxMs'] for x in subset)}
for variant,name in files.items():
 b=(root/'assets/summons'/name).read_bytes()
 assert b[:4]==b'glTF'
 sz=struct.unpack_from('<I',b,12)[0]
 j=json.loads(b[20:20+sz])
 summary[variant]={
  'file':name,'bytes':len(b),
  'meshCount':len(j.get('meshes',[])),
  'materials':len(j.get('materials',[])),
  'images':len(j.get('images',[])),
  'animations':len(j.get('animations',[])),
  'sha256':hashlib.sha256(b).hexdigest()}
old=summary['original'];lite=summary['barn']
report={'revision':'R188','qaOnly':True,'release':'NO_GO',
 'originalSourceUnchanged':True,
 'originalOwlOriginalBytes':old['bytes'],
 'selectedCandidate':'barn',
 'chosenReason':'92KB native skinned single mesh + 4 authored clips, mobile synthetic GPU frame stress improvement. Radio 1.6MB/no textures another option.',
 'alternativeTotalAssetReductionBytes':old['bytes']-lite['bytes'],
 'fullChromeGameRuns':len(cases),
 'castEvents':len(cases)*93,
 'requiresTrueAndroid':True,
 'mainUnchanged':True,
 'evidence':summary,'runs':cases,
 'ignoredFailedExperiments':failed,
 'caveats':['Nonrandomized repeated Chrome runs, not independent devices',
  'rAF timing and PerformanceObserver LongTask represent different measurements',
  '430×900 Android-like viewport uses desktop RTX5070Ti with CPU×4, not Android GPU',
  'Original art 129-mesh owl R127 geometry-dependent feather motion is replaced by native four-clip skeletal animation in alternatives',
  'Visible actor in normal stadium view; no high-zoom visual signoff',
  'Still loads all 16 original characters and most assets before playable',
  'QA only, old original and old R147 player build unaffected']}
out.joinpath('r188-real-animated-owl-source-ab-summary.json').write_text(
 json.dumps(report,ensure_ascii=False,indent=2))
print('R188_REAL_RESULTS',len(cases),'runs',len(cases)*93,
 'spells', 'rejected_test_runs',len(failed))
for view in ('desktop','mobile'):
 for k in files:
  z=summary[view][k]
  print('R188_AB',view,k,'n',z['runs'],
        'startup',z['startupMs'],
        'rafMax',z['maxRafMs'],
        'longTaskMax',z['maxLongTaskMs'])
