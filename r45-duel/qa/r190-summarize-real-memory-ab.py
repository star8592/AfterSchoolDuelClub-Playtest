"""Summarize real Z890 Chrome R190 vs R189; never equate JS heap or texture count to VRAM."""
import json,shutil,statistics
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path('/home/master/projects/after-school-duel-r190-demand/r45-duel')
qa=root/'qa/evidence/r190-demand'
q93=root/'qa/evidence/r190-demand-93'
q93.mkdir(parents=True,exist_ok=True)
records=[]
for view in ('desktop','mobile'):
 for deck,seed in (('classic',173),('kitchen',2)):
  pair={}
  for mode in ('default','demand'):
   f=qa/f'{mode}-{deck}-{seed}-{view}-primary.json'
   j=json.loads(f.read_text())
   assert j['pass'] and not j['errors'],str(f)
   assert j['first']['resourceVerified']==4+len(j['first']['initialIDs'])
   assert j['afterBackground']['hostStream']['backgroundError'] is None
   assert j['actualCardPlayed'] and 'E02' in j['realAiTurn']['cards']
   a=j['afterBackground']
   assert a['realModelCount']==(12 if mode=='default' else
    6 if deck=='classic' else 3)
   pair[mode]={'startupMs':j['first']['firstReadyMs'],
    'modelCountAfter3s':a['realModelCount'],
    'jsHeapAfter3sMiB':a['cpuMemoryMB'],
    'gpuTextureObjectCount':a['gpuTextureObjects'],
    'gpuGeometryObjectCount':a['gpuGeometryObjects'],
    'initialRealModels':j['first']['realModelCount'],
    'realAIUnitSourceVerified':True,
    'fullReceipt':str(f.relative_to(root)),
    'trueScreenshot':str(f.with_suffix('.png').relative_to(root))}
  assert pair['demand']['jsHeapAfter3sMiB']<pair['default']['jsHeapAfter3sMiB']
  assert pair['default']['gpuTextureObjectCount']==pair['demand']['gpuTextureObjectCount']
  assert pair['default']['gpuGeometryObjectCount']==pair['demand']['gpuGeometryObjectCount']
  records.append({'view':view,'deck':deck,'seed':seed,'baseline':pair['default'],
   'demand':pair['demand'],
   'reducedOriginalModels':12-pair['demand']['modelCountAfter3s'],
   'jsHeapSavedInThisSingleSampleMiB':
    pair['default']['jsHeapAfter3sMiB']-pair['demand']['jsHeapAfter3sMiB'],
   'firstReadyDifferenceMs':
    pair['demand']['startupMs']-pair['default']['startupMs']})
future=json.loads((qa/'r190-real-progressive-turns-classroom-6.json').read_text())
failure=json.loads((qa/'r190-real-on-demand-network-failure.json').read_text())
assert future['pass'] and len(future['rounds'])==5
assert future['final']['scene']['loadedNow'] and len(future['final']['scene']['loadedNow'])==7
assert future['final']['scene']['demandCompleted']==3
assert failure['pass'] and failure['blockedRequests']==1
assert failure['receipt']['sceneError'] and failure['receipt']['noFakeSource']
assert failure['receipt']['playDisabled'] and failure['receipt']['endDisabled']
source=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r190-demand-93')
full=[]
for f in sorted(source.glob('*/r173-*.json')):
 j=json.loads(f.read_text())
 assert j['pass'] and not j['errors']
 assert j['passTwo']['stage']['played']==93 and j['passTwo']['stage']['uniqueRenderedProps']==46
 assert j['r190Before']['scene']['demandOnly'] and j['r190After']['scene']['demandOnly']
 assert j['r190After']['scene']['loadedNow']==j['r190Before']['scene']['loadedNow']
 assert len(j['r190After']['scene']['loadedNow'])<12
 id=j['initial']['selectedNewHero']['id']
 view=j['view']
 target=q93/f'r190-real-93-{id}-{view}.json'
 shutil.copy2(f,target)
 screenshot=f.with_name(f.stem+'-arena.png')
 assert screenshot.exists()
 imtarget=q93/f'r190-real-93-{id}-{view}.png'
 shutil.copy2(screenshot,imtarget)
 full.append({'id':id,'view':view,
  'realCastEvents':93,'trueUniqueSpellIdentities':46,
  'firstCastMaxRafMs':j['cold']['max'],
  'firstCastLongestObservedLongtaskMs':j['cold']['longTaskMax'],
  'realModelsBefore':len(j['r190Before']['scene']['loadedNow']),
  'realModelsAfter':len(j['r190After']['scene']['loadedNow']),
  'fullReceipt':str(target.relative_to(root)),
  'actualChromeScreenshot':str(imtarget.relative_to(root))})
assert len(full)==4 and len({(x['id'],x['view']) for x in full})==4
# Montage only genuine Chrome frames, never generated concept art.
fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font=ImageFont.truetype(fontpath,21)
canvas=Image.new('RGB',(1260,780),'#1b2835');draw=ImageDraw.Draw(canvas)
cases=[('R189 经典 / 自动全部载入','default-classic-173-desktop-primary.png'),
 ('R190 经典 / 只载入需要的','demand-classic-173-desktop-primary.png'),
 ('R189 食堂 / 自动全部载入','default-kitchen-2-desktop-primary.png'),
 ('R190 食堂 / 只载入需要的','demand-kitchen-2-desktop-primary.png')]
for i,(title,basename) in enumerate(cases):
 frame=Image.open(qa/basename).convert('RGB')
 frame.thumbnail((620,348))
 x=i%2*630+(630-frame.width)//2
 y=i//2*390+35
 canvas.paste(frame,(x,y))
 draw.text((i%2*630+12,i//2*390+6),title,font=font,fill='#f6f3df')
canvas.save(qa/'r190-four-actual-chrome-visual-comparisons.jpg',quality=78,optimize=True)
summary={
 'revision':'R190','date':'2026-11-19','release':'NO_GO',
 'isolatedQAFlag':'qa=1&r189Stream=on&r190Demand=on',
 'productionDefaultAndMainUnchanged':True,
 'liveOriginal16IdentitiesAnd60CardsMaintained':True,
 'full92PlusFirstRealSpellEvents':False,
 'originalMagicSpellIdentities':46,
 'controlledActualBrowserABCases':len(records)*2,
 'fullRealChromeSpellRuns':len(full),
 'fullRealChromeSpellEvents':sum(x['realCastEvents'] for x in full),
 'realProgressiveTurns':len(future['rounds']),
 'realDemandedNewModels':future['final']['scene']['demandCompleted'],
 'realNetworkFailureFailClosed':True,
 'jsHeapMiBPerABCase':records,
 'fullSpellRuns':full,
 'importantCaveats':[
  'One fresh Chrome run per A/B pair, browser GC/JS memory is variable; numbers are observations, not guarantees',
  'JS heap allocation is NOT physical GPU VRAM; WebGL texture object count is unchanged in matched scenes',
  'Only currently needed original GLBs loaded, not a hard resident-memory cap; a long game could eventually use all 12',
  'Selected initial-hand actor data still loads before play, including four authentic VRMs',
  'True Android GPU is still offline (S22); mobile viewport on desktop GPU is not device certification',
  'GPU driver memory bytes and OOM/context-lost thresholds not directly measured',
  'No change to production build, original animation, sound, source mesh, 60 cards or 46 spell types',
  'QA-only separate from R189 background-all mode; not released',
 ]
}
qa.joinpath('r190-controlled-memory-actual-ab-summary.json').write_text(
 json.dumps(summary,ensure_ascii=False,indent=2))
print('R190_ACTUAL_SUMMARY_PASS',summary['controlledActualBrowserABCases'],
 'A/B sessions',summary['fullRealChromeSpellEvents'],'real casts',
 'progressiveTurns',len(future['rounds']),'source loads',summary['realDemandedNewModels'],
 'failure',summary['realNetworkFailureFailClosed'])
for x in records:
 print('A/B',x['view'],x['deck'],'GLB',
  x['baseline']['modelCountAfter3s'],'->',x['demand']['modelCountAfter3s'],
  'heapMiB',x['baseline']['jsHeapAfter3sMiB'],'->',x['demand']['jsHeapAfter3sMiB'],
  'GPUtextures',x['baseline']['gpuTextureObjectCount'],'->',
  x['demand']['gpuTextureObjectCount'])
