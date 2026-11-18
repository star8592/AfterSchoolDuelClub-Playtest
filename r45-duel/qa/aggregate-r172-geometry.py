#!/usr/bin/env python3
"""R172 pixel & draw call parity: zero-loss static geometry batching."""
import json,shutil
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
ROOT=Path(__file__).resolve().parents[1]
R170=ROOT/'qa/evidence/r170-hero-props'
SRC=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r172-batched-props')
OUT=ROOT/'qa/evidence/r172-static-geometry';OUT.mkdir(parents=True,exist_ok=True)
a=json.loads((R170/'r169-46-gallery.json').read_text())
b=json.loads((SRC/'r169-46-gallery.json').read_text())
battle=json.loads((SRC/'r172-battle-qa.json').read_text())
assert a['passed'] and b['passed'] and len(a['cards'])==46 and len(b['cards'])==46
assert len(battle['cases'])==3 and all(c['pass'] and not c['errors'] for c in battle['cases'])
assert a['inventory']['identCount']==b['inventory']['identCount']==46
assert b['end']['shaderPointLights']==0 and b['end']['uniqueRenderedProps']==46
for c in battle['cases']:
 assert c['initial']['models']==16 and c['initial']['cards']==60
 assert c['initial']['bytes']==75569762 and c['initial']['cameraSafe']
 if c['mode']=='on':
  assert c['after']['stage']['played']==9 and c['after']['legacyArsenal']==0
original={c['id']:c for c in a['cards']}
optimized={c['id']:c for c in b['cards']}
assert set(original)==set(optimized)
rows=[]
for id in original:
 x,y=original[id],optimized[id]
 assert x['prop']==y['prop'] and y['drawCalls']<=x['drawCalls'],(id,x['drawCalls'],y['drawCalls'])
 rows.append({'id':id,'name':x['name'],'beforeDraws':x['drawCalls'],'afterDraws':y['drawCalls'],
  'drawsSaved':x['drawCalls']-y['drawCalls']})
heroes=['E06','K01','K06','Q05','P04','P05','X05']
image=[]
for id in heroes:
 src=R170/f'r170-{id}.png';dst=SRC/f'r169-{id}.png'
 p=Image.open(src).convert('RGB');q=Image.open(dst).convert('RGB')
 assert p.size==q.size,(id,p.size,q.size)
 colorAbs=sum(ImageStat.Stat(ImageChops.difference(p,q)).mean[:3])/3
 image.append({'id':id,'meanAbsoluteRGBdifferencePerChannel':round(colorAbs,5),
  'sameDimensions':True,'exactImageEquality':colorAbs==0,'drawsSaved':next(r['drawsSaved'] for r in rows if r['id']==id)})
 assert colorAbs<.5,(id,colorAbs)
 shutil.copy2(dst,OUT/f'r172-{id}.png')
for f in ('r169-46-gallery.json','r172-battle-qa.json'):
 shutil.copy2(SRC/f,OUT/f)
for f in ('r169-desktop-on-battle.png','r169-mobile-on-battle.png','r169-desktop-off-battle.png'):
 shutil.copy2(SRC/f,OUT/f)
summary={'date':'2026-11-18','features':'R172 QA-only zero-loss opaque static sibling merge',
 'fullSpellGallery':46,'liveBattleCases':3,'originalModels':16,'originalCards':60,
 'realModelBytes':75569762,
 'newPointLights':0,'newShaderVariantFromInstancing':False,
 'oldMagicOverlap':0,'drawsSavedTotalSingleCastGallery':sum(x['drawsSaved'] for x in rows),
 'drawCallsMaxBefore':max(x['beforeDraws'] for x in rows),
 'drawCallsMaxAfter':max(x['afterDraws'] for x in rows),
 'drawCallsMeanBefore':round(sum(x['beforeDraws'] for x in rows)/46,3),
 'drawCallsMeanAfter':round(sum(x['afterDraws'] for x in rows)/46,3),
 'positiveReductions':sum(x['drawsSaved']>0 for x in rows),
 'zeroRegressions':all(x['drawsSaved']>=0 for x in rows),
 'detailedHeroImages':image,'perSpell':rows,
 'releaseDecision':'QA_PASS_ONLY / DRAFT_NO_GO pending first-use CPU/GPU trace, true Android p95/p99 and finished voice/acting'}
(OUT/'r172-final-audit.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('R172_FINAL',json.dumps({k:v for k,v in summary.items() if k not in ('perSpell','detailedHeroImages')},ensure_ascii=False))
print('R172_PIXEL_DETAILS',json.dumps(image,ensure_ascii=False))
