"""R182 6×(cold+on-demand prewarm)×93 actual WebGL battle evidence."""
from pathlib import Path
import json,shutil
root=Path('r45-duel/qa/evidence')
external=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r181-hair-full-spell')
out=root/'r182-full-spell';out.mkdir(parents=True,exist_ok=True)
sroot=root/'r182-sculpted-props'
g=json.loads((sroot/'r182-six-geometry-verification.json').read_text())['items']
cases={}
for id in ('K06','Q05','P04','S04','P05','X05'):
 stadium=json.loads((sroot/id/'R182-3D-in-stadium-qa.json').read_text())
 assert stadium.get('pass'),(id,'actual stadium QA failed',stadium.get('errors'))
 per={}
 for mode in ('cold','warm'):
  name=('T01-E03-hairON-off-'+id+'-herooff-desktop' if mode=='cold'
   else 'T01-E03-hairON-two-'+id+'-selectedwarm-herooff-desktop')
  src=external/name/'r173-desktop-batched-cpu2.json'
  assert src.exists(),(id,mode,'no source',str(src))
  d=json.loads(src.read_text())
  tests=[
   ('pass',d.get('pass')),('errors absent',not d.get('errors')),
   ('all 93 casts',d['passTwo']['stage']['played']==93),
   ('46 identities',d['passTwo']['stage']['uniqueRenderedProps']==46),
   ('4 author GLBs',d['initial']['authoredHighDetailAssets']==['E06','K01','K07',id]),
   ('all VRMs',d['initial']['models']==16),
   ('source byte length',d['initial']['bytes']==75569762),
   ('venue batched',d['initial']['stadiumBatch']['enabled']),
   ('VRM hair index union',d['initial']['hairBatch']['enabled']),
   ('selected hero',d['initial']['selectedNewHero']['id']==id),
   ('selected mode',bool(d['initial'].get('r182SelectedPrewarm'))==(mode=='warm')),
   ('strict 2 models warmed',mode!='warm' or d['initial']['primeTwo']['models']==2)
  ]
  for label,pass_ in tests:
   assert pass_,(id,mode,label)
  dest=out/(id+'-'+mode+'-93-casts.json')
  shutil.copy2(src,dest)
  per[mode]={
   'passed':True,'events':93,'identities':46,'firstFrameReadyMs':d['initial']['startupMs'],
   'firstCastMaxRafMs':d['cold']['max'],'firstCastLongTaskMaxMs':d['cold']['longTaskMax'],
   'shaderDelta':d['cold']['shaderDelta'],
   'authoredGLBs':d['initial']['authoredHighDetailAssets'],
   'selectedModel':d['initial']['selectedNewHero'],
   'selectedGpuPrewarm':d['initial'].get('r182SelectedPrewarm'),
   'twoSummonsGpuPrewarm':d['initial'].get('primeTwo'),
   'rawEvidence':str(dest.relative_to(root.parent))
  }
  print('R182_93CAST',id,mode,
   'ready',per[mode]['firstFrameReadyMs'],
   'maxRAF',per[mode]['firstCastMaxRafMs'],
   'longtask',per[mode]['firstCastLongTaskMaxMs'])
 cases[id]={
  'geometry':g[id],
  'trueStadium3D':stadium['pass'],
  'movingGroups':stadium['actorMotion']['moved'],
  'originalModels':stadium['before']['loaded'],
  'stadiumScreenshot':str((sroot/id/(id+'-in-stadium.png')).relative_to(root.parent)),
  'gameDrawCalls':stadium['after']['drawCalls'],
  'casts':per,
  'finalArtApproved':False,'mobileAccepted':False}
assert len(cases)==6 and all(x['casts']['warm']['firstCastMaxRafMs']<=50.0
 and x['casts']['warm']['firstCastLongTaskMaxMs']==0 for x in cases.values())
summary={
 'project':'AfterSchoolDuelClub','round':'R182','date':'2026-11-18',
 'release':'NO_GO',
 'real3DCandidatesBefore':3,'newReal3DCandidates':6,
 'real3DCandidatesAfter':9,'proceduralPlaceholdersRemain':37,
 'artistApproved':0,'mobileGpuApproved':False,
 'original16SourceModelBytes':75569762,'sourceCards':60,
 'testedFullSpellEvents':12*93,'testedUniqueSchoolSpellsEachRun':46,
 'oneNewGLBPerQaScene':True,'fullBattleTestWithOldThreeHeroGlbs':True,
 'gpuEnvironment':'Z890 RTX 5070Ti Chrome Vulkan CPUx2',
 'notes':'Frame interval and LongTask sampled independently; never treat low RAF as proof of absence of JS stall. On-demand hero prewarming uses actual THREE.renderer.render, not compile-only. Not production default, not true Android.',
 'assets':cases}
out.joinpath('r182-six-93cast-ab-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('R182_12_COMPLETE_BATTLES_PASS',12*93,'spell events, 9 sculpted sources, 37 left, 0 final accepted')
