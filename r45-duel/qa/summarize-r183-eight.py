"""R183 verified eight actual Blender GLBs in 16 cold/warm 93-cast fights."""
from pathlib import Path
import json,shutil
root=Path('r45-duel/qa/evidence')
data=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r183-eight-full-spell')
out=root/'r183-full-spell'
out.mkdir(parents=True,exist_ok=True)
art=root/'r183-sculpted-props'
geometries=json.loads((art/'r183-eight-geometry-verification.json').read_text())['items']
ids=('P03','S08','X03','Q06','K02','K08','S03','Q01')
states={}
for id in ids:
 session=json.loads((art/id/'R183-3D-in-stadium-qa.json').read_text())
 assert session['pass'] and not session['errors'],(id,session.get('errors'))
 assert session['before']['loaded']==16 and session['before']['bytes']==75569762
 assert session['before']['authored']==[id]
 assert session['actorMotion']['moved']
 ab={}
 for mode in ('cold','warm'):
  dirname=('T01-E03-hairON-off-'+id+'-selectedcold-herooff-desktop'
   if mode=='cold' else 'T01-E03-hairON-two-'+id+'-selectedwarm-herooff-desktop')
  src=data/dirname/'r173-desktop-batched-cpu2.json'
  assert src.exists(),(id,mode,src)
  d=json.loads(src.read_text())
  assert d['pass'] and not d.get('errors')
  assert d['initial']['models']==16
  assert d['initial']['bytes']==75569762
  assert d['initial']['authoredHighDetailAssets']==['E06','K01','K07',id]
  assert d['initial']['selectedNewHero']['id']==id
  assert d['initial']['hairBatch']['enabled'] and d['initial']['stadiumBatch']['enabled']
  assert d['passTwo']['stage']['played']==93
  assert d['passTwo']['stage']['uniqueRenderedProps']==46
  assert bool(d['initial']['r183SelectedPrewarm'])==(mode=='warm')
  if mode=='warm':assert d['initial']['primeTwo']['models']==2
  dst=out/(id+'-'+mode+'-93-casts.json')
  shutil.copy2(src,dst)
  ab[mode]={
   'pass':True,
   'stagePlayed':d['passTwo']['stage']['played'],
   'uniqueMagic':d['passTwo']['stage']['uniqueRenderedProps'],
   'firstReadyMs':d['initial']['startupMs'],
   'firstCastMaxRafMs':d['cold']['max'],
   'firstCastLongTaskMaxMs':d['cold']['longTaskMax'],
   'shaderDeltaAtCast':d['cold']['shaderDelta'],
   'exactTwoUnitGpuPriming':d['initial']['primeTwo'],
   'single3DHeroGpuPriming':d['initial']['r183SelectedPrewarm'],
   'sourceJSON':str(dst.relative_to(root.parent))}
  print('R183_93_CAST_AB',id,mode,'firstReady',ab[mode]['firstReadyMs'],
   'firstRafMax',ab[mode]['firstCastMaxRafMs'],
   'longTaskMax',ab[mode]['firstCastLongTaskMaxMs'])
  if mode=='warm':
   assert ab[mode]['firstCastMaxRafMs']<=51,(id,'warm still slow')
   assert ab[mode]['firstCastLongTaskMaxMs']==0,(id,'warm longtask found')
 states[id]={'trueSource':geometries[id],
  'stadiumScreenshot':str((art/id/(id+'-in-stadium.png')).relative_to(root.parent)),
  'independentActorsMoved':session['actorMotion']['moved'],
  'newAssetDrawCallsInScene':session['after']['drawCalls'],
  'sourceOriginalModels':session['before']['loaded'],
  'fullBattle':ab,'visualAccepted':False,'androidAccepted':False}
assert len(states)==8
result={'round':'R183','date':'2026-11-18','release':'NO_GO',
 'previousOriginalBlenderCandidates':9,'newOriginalBlenderCandidates':8,
 'trueEditableBlenderCandidates':17,'proceduralPlaceholdersRemain':29,
 'visuallyAccepted':0,'recordedNewVoices':0,
 'desktopFullBattleRuns':16,'eventCount':1488,'uniqueSchoolSpellsPerRun':46,
 'sourceOriginalModels':16,'sourceActorBytes':75569762,
 'oneNew3DHeroAssetPerQA':True,'realAndroidVerified':False,
 'qaHardware':'Z890 RTX 5070 Ti Chrome WebGL2 Vulkan CPU x2 desktop, not Android',
 'strictLimit':'Do not claim browser LongTask is identical to RAF; single runs not randomized, startup time increased for real priming, no overall FPS claims. Never publish without full visual and Android OOM clearance.',
 'items':states}
out.joinpath('r183-eight-16x93-ab-summary.json').write_text(
 json.dumps(result,ensure_ascii=False,indent=2))
print('R183_ALL_16_FIGHTS_PASS',result['eventCount'],
 'spell-events, 17 source models, 29 placeholders, 0 visual approvals')
