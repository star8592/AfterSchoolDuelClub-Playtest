"""R186 definitive 9×(cold+selected-authored-GLB warm)×93 WebGL spells."""
from pathlib import Path
import json,hashlib,shutil,statistics
base=Path('r45-duel/qa/evidence')
external=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r186-nine-full-spell-final')
out=base/'r186-full-spell';out.mkdir(parents=True,exist_ok=True)
g=json.loads((base/'r186-sculpted-props/r186-nine-geometry-verification.json').read_text())['items']
audio=json.loads(Path('r45-duel/assets/audio/r186_original_foley_sha256_manifest.json').read_text())
ids=['P01','P02','P06','P08','X01','X04','X06','X07','X08']
assert set(ids)==set(g)==set(audio['assets'])
records={}
for id in ids:
 stadium=json.loads((base/'r186-sculpted-props'/id/'R186-3D-in-stadium-qa.json').read_text())
 assert stadium['pass'] and not stadium['errors'],(id,'webgl stadium not accepted')
 assert stadium['before']['loaded']==16 and stadium['before']['bytes']==75569762
 assert stadium['before']['authored']==[id] and stadium['before']['r186']['id']==id
 assert stadium['after']['played']>=1 and stadium['actorMotion']['moved']
 per={}
 for mode in ('cold','warm'):
  case=('T01-E03-hairON-off-'+id+'-selectedcold-herooff-desktop'
   if mode=='cold' else 'T01-E03-hairON-two-'+id+'-selectedwarm-herooff-desktop')
  src=external/case/'r173-desktop-batched-cpu2.json'
  assert src.exists(),(id,mode,'missing raw 93-cast receipt',str(src))
  d=json.loads(src.read_text())
  assert d['pass'] and not d['errors'],(id,mode,'browser QA failed')
  assert d['initial']['models']==16 and d['initial']['bytes']==75569762
  assert d['initial']['cards']==60
  assert d['initial']['authoredHighDetailAssets']==['E06','K01','K07',id]
  assert d['initial']['selectedNewHero']['id']==id
  assert d['initial']['soundPatterns']==46
  assert d['initial']['r184OriginalSoundPatterns']==10
  assert d['initial']['r185PriorSoundPatterns']==10
  assert d['initial']['r186NewOriginalSoundPatterns']==9
  assert d['initial']['r186SelectedSoundClip']=='r186_'+id.lower()
  assert d['initial']['hairBatch']['enabled'] and d['initial']['stadiumBatch']['enabled']
  assert d['passTwo']['stage']['played']==93
  assert d['passTwo']['stage']['uniqueRenderedProps']==46
  assert bool(d['initial']['r186SelectedPrewarm'])==(mode=='warm')
  if mode=='warm':assert d['initial']['primeTwo']['models']==2
  dst=out/(id+'-'+mode+'-93casts.json')
  shutil.copy2(src,dst)
  per[mode]={
   'functionalPass':True,'events':93,'uniqueMagic':46,
   'all46SoundPatterns':True,'newR186FoleyPatterns':9,
   'startupReadyMs':d['initial']['startupMs'],
   'firstCastMaxRafMs':d['cold']['max'],
   'firstCastLongTaskMaxMs':d['cold']['longTaskMax'],
   'firstCastShaderDelta':d['cold']['shaderDelta'],
   'exactTwoActorPrewarm':d['initial']['primeTwo'],
   'oneHeroGpuPrewarm':d['initial']['r186SelectedPrewarm'],
   'original16Characters':d['initial']['models'],
   'sourceReceipt':str(dst.relative_to(base.parent))}
  print('R186_93_COMPLETED',id,mode,
    'ready',per[mode]['startupReadyMs'],
    'maxRAF',per[mode]['firstCastMaxRafMs'],
    'maxLongTask',per[mode]['firstCastLongTaskMaxMs'])
 records[id]={
  'realBlenderTopology':g[id],
  'trueChromeStadium':True,
  'originalPhysicalActorGroupsMoved':stadium['actorMotion']['moved'],
  'screenshotPath':str((base/'r186-sculpted-props'/id/(id+'-in-stadium.png')).relative_to(base.parent)),
  'drawCalls':stadium['after']['drawCalls'],
  'foleyAsset':audio['assets'][id],
  'full93SpellTests':per,
  'visualAccepted':False,'androidAccepted':False}
assert len(records)==9 and all(len(v['full93SpellTests'])==2 for v in records.values())
assert all(v['full93SpellTests']['warm']['firstCastLongTaskMaxMs']==0
 for v in records.values()),'observed warm longtask requires review'
release={'round':'R186','date':'2026-11-19','release':'NO_GO',
 'newTrueEditableBlenderCandidates':9,
 'priorTrueEditableBlenderCandidates':37,
 'totalTrueEditableBlenderCandidates':46,
 'remainingProceduralPlaceholders':0,
 'totalUniqueMagicCards':46,'all46FinalVisualApproved':0,
 'fullDesktopGameABRuns':18,'allSpellEvents':1674,
 'all46IdentitiesPerRun':True,'all46AudioPatternsPerRun':True,
 'newOriginalSynthFoley':9,'newHumanRecordedFoley':0,'newCharacterVoiceRecords':0,
 'realAndroidTested':False,'onlyOneNewGLBPerQA':True,
 'hardware':'Z890 RTX5070Ti Chrome Vulkan WebGL2 CPU x2; not Android',
 'limits':'18 single-run samples, no randomization. rAF interval differs from LongTask. GPU priming raises first-scene startup time; not default. All 46 artworks remain candidates, none visual accepted.',
 'items':records}
assert release['allSpellEvents']==9*2*93
(out/'r186-nine-18x93-ab-summary.json').write_text(
 json.dumps(release,ensure_ascii=False,indent=2))
print('R186_ALL_18_BATTLES_AND_1674_EVENTS_PASS',
 sum(v['full93SpellTests']['cold']['startupReadyMs'] for v in records.values()),
 '46_original3d_candidates_0_procedural_placeholders_0_visual_acceptance')
