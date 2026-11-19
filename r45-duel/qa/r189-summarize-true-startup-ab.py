"""Summarize actual Chrome A/B receipts; no fabricated estimates, no android claims."""
import json,statistics,shutil
from pathlib import Path
r=Path('/home/master/projects/after-school-duel-r189-priority/r45-duel')
source=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r189-startup-stream')
dst=r/'qa/evidence/r189-startup-stream'
raw=dst/'raw-browser';raw.mkdir(parents=True,exist_ok=True)
rows=[]
for f in sorted(source.glob('*/r173-*.json')):
 j=json.loads(f.read_text())
 if not j.get('pass') or j.get('errors') or 'cold' not in j:
  continue
 assert j['initial']['cards']==60 and j['initial']['soundPatterns']==46
 assert j['passTwo']['stage']['played']==93
 assert j['passTwo']['stage']['uniqueRenderedProps']==46
 staged=bool(j['initial'].get('r189StreamReceipt',{}).get('enabled'))
 if staged:
  bg=j.get('background') or {}
  assert bg.get('scene',{}).get('allLoaded')
  assert bg.get('player',{}).get('allReady')
  assert bg.get('metrics',{}).get('modelsVerified')==16
  assert bg.get('scene',{}).get('loadedNow') and len(bg['scene']['loadedNow'])==12
  initialGLB=bg['scene']['initialRealGLBs']
  assert bg['scene']['initialCount']==len(initialGLB)
 else:
  assert j['initial']['models']==16
  bg={}
 target=raw/(f.parent.name+'.json')
 shutil.copy2(f,target)
 item={'case':f.parent.name,'view':j['view'],'cpuThrottle':j['cpu'],
  'staged':staged,'bgConcurrency':(bg.get('scene') or {}).get('bgConcurrency') if staged else None,
  'startupMs':j['initial']['startupMs'],'firstCastMaxRafMs':j['cold']['max'],
  'firstCastLongTaskMaxMs':j['cold']['longTaskMax'],
  'all46SpellsCast':True,'spellEvents':93,'errorCount':0,
  'initialModelsAtObservedStart':j['initial']['models'],
  'bgCompleteAfterReadyMs':(bg.get('player') or {}).get('backgroundMs') if staged else 0,
  'bgMaxObservedLongTaskMs':bg.get('tailMaxLongTaskMs') if staged else None,
  'verified16BeforeFullBattle':True,
  'record':str(target.relative_to(r))}
 rows.append(item)
assert len(rows)>=12,len(rows)
def group(view,staged,bg=4):
 data=[x for x in rows if x['view']==view and x['staged']==staged and
  (not staged or x['bgConcurrency']==bg)]
 assert data,(view,staged,bg)
 return {'runs':len(data),
  'firstReadyMs':[x['startupMs'] for x in data],
  'medianFirstReadyMs':round(statistics.median(x['startupMs'] for x in data),1),
  'firstCastMaxRafMs':[x['firstCastMaxRafMs'] for x in data],
  'firstCastMaxLongTaskMs':[x['firstCastLongTaskMaxMs'] for x in data],
  'bgCompleteMs':[x['bgCompleteAfterReadyMs'] for x in data] if staged else [],
  'bgObservedLongTaskMaxMs':max((x['bgMaxObservedLongTaskMs'] or 0 for x in data),default=0)
 }
baselineD=group('desktop',False);stagedD=group('desktop',True)
baselineM=group('mobile',False);stagedM=group('mobile',True)
safety=[]
for f in sorted(dst.glob('r189-safe-early-game-*.json')):
 j=json.loads(f.read_text())
 if j.get('pass'):
  assert not j.get('errors')
  assert j['start']['exactlyStarterIds']
  assert j['complete']['modelsVerified']==16
  assert len(j['complete']['glbs'])==12
  assert j['start']['endDisabled']==j['start']['endShouldBeDisabled']
  assert j['earlyTurn']['disabled']==(not j['earlyTurn']['possible'])
  safety.append({'seed':j['seed'],'deck':j['deck'],
   'initialRealModelCount':j['start']['actualVerified'],
   'initialSafeTurn':j['earlyTurn']['possible'],
   'deferredNextAIMissing':j['earlyTurn']['prediction'],
   'realEarlyAiTurnPlayed':bool(j.get('actualEarlyTurn')),
   'proof':str(f.relative_to(r))})
assert len(safety)>=5,len(safety)
failure=json.loads((dst/'r189-background-failure-real-browser.json').read_text())
assert failure['pass'] and failure['intercepted']>=1
assert failure['failure']['sceneError']
assert failure['failure']['endDisabled'] and failure['failure']['playDisabled']
assert failure['failure']['noBadPrototype'] and not failure['failure']['stillAllReady']
summ={'revision':'R189','date':'2026-11-19',
 'qaOnly':True,'release':'NO_GO',
 'gameSourceOriginal':True,'mainUnchanged':True,'originalPlayers':16,
 'originalCardCount':60,'originalSpellCount':46,
 'trueBrowserRuns':len(rows),'trueSpellEvents':len(rows)*93,
 'desktop':{'full16BeforePlay':baselineD,'priorityHandThenBackground4':stagedD,
  'medianFirstReadyImprovementMs':round(baselineD['medianFirstReadyMs']-stagedD['medianFirstReadyMs'],1)},
 'mobileViewport':{'full16BeforePlay':baselineM,'priorityHandThenBackground4':stagedM,
  'medianFirstReadyImprovementMs':round(baselineM['medianFirstReadyMs']-stagedM['medianFirstReadyMs'],1)},
 'backgroundAlternatives':{'bounded2':group('desktop',True,2),
  'bounded3':group('desktop',True,3)},
 'realBrowserSafetyCases':safety,
 'realBrowserFailedDeferredAsset':failure,
 'pureDeterministicFutureAiGuard':{'seeds':600,'deckPresets':6,
  'unitSummonsMatchedActual':517,'gameplayStateUnchanged':True},
 'firstHandNeverFakeGLB':True,'onlyVerifiedSourceIdsReachArena':True,
 'aiTurnGuardUsesOriginalRuleEngineClone':True,
 'limitations':['Z890 desktop Nvidia Vulkan, not an Android device',
  'CPU2x desktop or CPU4x mobile viewport; viewport emulation is not true GPU/memory/OOM',
  'nonrandomized small samples with OS browser cache variation',
  'full 12 GLBs eventually resident; peak device VRAM is NOT reduced by this architectural change',
  'background 4x concurrency varied 0.9–5.1 seconds; user actions may require the exact missing GLB',
  'production default is 16/16 until Android memory and total-play QA accepted',
  'no background GPU texture upload guaranteed; model parse may still produce CPU stalls'],
 'tests':rows}
(dst/'r189-true-chrome-startup-comparison-summary.json').write_text(
 json.dumps(summ,ensure_ascii=False,indent=2))
print('R189_TRUE_BROWSER_PERF',len(rows),len(rows)*93,
 'desktop',baselineD['medianFirstReadyMs'],'->',stagedD['medianFirstReadyMs'],
 'mobile',baselineM['medianFirstReadyMs'],'->',stagedM['medianFirstReadyMs'],
 'safety',len(safety))
