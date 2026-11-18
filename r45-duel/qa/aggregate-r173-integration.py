#!/usr/bin/env python3
"""R173 integrated QA with hard stop for identity/scene regressions."""
import json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r173-integrated')
OUT=ROOT/'qa/evidence/r173-integrated';OUT.mkdir(parents=True,exist_ok=True)
modes=['desktop-batched-cpu2','desktop-unbatched-cpu2','mobile-batched-cpu3']
cases=[]
for key in modes:
 f=SRC/('r173-'+key+'.json')
 if not f.exists():raise FileNotFoundError(f)
 raw=json.loads(f.read_text())
 assert raw['pass'] and not raw['errors'],(key,raw.get('errors'))
 assert raw['initial']['models']==16
 assert raw['initial']['bytes']==75569762
 assert raw['initial']['cards']==60
 assert raw['initial']['source'] and raw['initial']['cameraSafe']
 assert raw['initial']['noFloatingPortrait']
 assert raw['initial']['soundPatterns']==46
 assert raw['initial']['originalFoleyUpgrades']==14
 assert raw['initial']['gestureFamilies']==11
 assert len(raw['initial']['spells'])==46
 assert raw['passOne']['stage']['uniqueRenderedProps']==46
 assert raw['passTwo']['stage']['played']==93
 assert raw['passTwo']['stage']['shaderPointLights']==0
 assert raw['passTwo']['legacyArsenal']==0
 assert raw['passTwo']['legacyImpact']==0
 assert raw['passTwo']['portraitInsetDraws']==0
 assert raw['passTwo']['noFloatingPortrait']
 assert raw['cold']['frameCount']>=120
 assert raw['passOne']['stage']['staticBatch']['enabled']==('unbatched' not in key)
 if 'batched' in key and 'unbatched' not in key:
  assert raw['passTwo']['stage']['staticBatch']['cacheEntries']==raw['passOne']['stage']['staticBatch']['cacheEntries']
 shutil.copy2(f,OUT/f.name)
 image=SRC/('r173-'+key+'-arena.png')
 if image.exists():shutil.copy2(image,OUT/image.name)
 cases.append({'case':key,'passed':True,'firstCastFrameP95':raw['cold']['p95'],
  'firstCastFrameP99':raw['cold']['p99'],
  'firstCastWorstFrameMs':raw['cold']['max'],
  'firstCastLongTaskMax':raw['cold']['longTaskMax'],
  'firstCastShaderDelta':raw['cold']['shaderDelta'],
  'all46UniqueProps':raw['passTwo']['stage']['uniqueRenderedProps'],
  'castsPlayed':raw['passTwo']['stage']['played'],
  'noFloatingPortrait':raw['passTwo']['portraitInsetDraws']==0,
  'cacheEntries':raw['passTwo']['stage']['staticBatch'].get('cacheEntries')})
actor=json.loads((SRC/'r173-actor-motifs.json').read_text())
assert actor['pass'] and not actor['errors'] and len(actor['spells'])==4
assert len(set(x['castSignature'] for x in actor['spells']))==4
assert len(set(x['hitSignature'] for x in actor['spells']))==4
assert all(x['originalHostSkeletons']>=100 and x['contact'] for x in actor['spells'])
shutil.copy2(SRC/'r173-actor-motifs.json',OUT/'r173-actor-motifs.json')
for name in ('E06','K01'):
 path=SRC/f'r173-real-actors-{name}.png'
 if path.exists():shutil.copy2(path,OUT/path.name)
audio=json.loads((ROOT/'qa/evidence/r171-original-audio/r171-final-audio-summary.json').read_text())
assert audio['decodedByChrome']==14 and audio['sourceSHA256Pass']
assert audio['newQwenVoicesRecorded']==0 and audio['voiceScriptsReady']==230
geometry=json.loads((ROOT/'qa/evidence/r172-static-geometry/r172-final-audit.json').read_text())
assert geometry['fullSpellGallery']==46 and geometry['zeroRegressions']
report={'date':'2026-11-18','branch':'R173 QA integration R169+R170+R171+R172',
 'result':'FUNCTION_AND_SOURCE_QA_PASS; PERFORMANCE_STILL_NO_GO',
 'cards':60,'original3DModels':16,'original3DModelBytes':75569762,
 'schoolSpellIdentities':46,'schoolCastGestureIdentities':46,
 'schoolHitReactionIdentities':46,'actualOriginalVRMActorGestureSamples':4,
 'uniqueSoundTimelines':46,'newFoleyOGG':14,'newFoleyDecoded':14,
 'newQwenVoiceTracks':0,'plannedVoiceScripts':230,
 'lastExistingPortraitInsetDraws':0,
 'drawCallMaximumBefore':geometry['drawCallsMaxBefore'],
 'drawCallMaximumAfter':geometry['drawCallsMaxAfter'],
 'all46RealSpellCastRepeatTests':sum(x['castsPlayed'] for x in cases),
 'cases':cases,
 'knownPerformanceRisk':'first-cast worst rAF frame remains >300ms in both desktop variants; there is no established performance win in frame time',
 'productionStatus':'Draft/NO-GO: final art, real recorded VO, 46 actual actor animations, Android GPU and first-cast shader jank must pass',
 'hardRule':'No shipping new unfinished prototypes or degrading textures or hiding opponent behind head closeups'}
(OUT/'r173-final-summary.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('R173_AUDIT_PASS',json.dumps(report,ensure_ascii=False))
