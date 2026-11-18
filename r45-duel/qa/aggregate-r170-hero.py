#!/usr/bin/env python3
"""R170 QA art proofs and preserved character/card identity."""
import json,shutil
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
SRC=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r170-hero-props')
DEST=Path(__file__).resolve().parent/'evidence/r170-hero-props'
DEST.mkdir(parents=True,exist_ok=True)
gallery=json.loads((SRC/'r169-46-gallery.json').read_text())
battle=json.loads((SRC/'r170-battle-qa.json').read_text())
assert gallery['passed'] and len(gallery['cards'])==46 and len(gallery['snapshots'])==16
assert len(battle['cases'])==3 and all(x['pass'] for x in battle['cases'])
for x in battle['cases']:
 assert x['initial']['models']==16 and x['initial']['cards']==60
 assert x['initial']['bytes']==75569762
 assert x['after']['cameraSafe']
 if x['mode']=='on':
  assert x['after']['stage']['played']==9 and x['after']['legacyArsenal']==0
  assert x['after']['stage']['shaderPointLights']==0
hero=['E06','K01','K06','Q05','P04','P05','X05']
assert all(x in [c['id'] for c in gallery['cards']] for x in hero)
for f in ('r169-46-gallery.json','r170-battle-qa.json'):
 shutil.copy2(SRC/f,DEST/f)
for f in ('r169-desktop-on-battle.png','r169-mobile-on-battle.png','r169-desktop-off-battle.png'):
 shutil.copy2(SRC/f,DEST/f)
for id in hero:shutil.copy2(SRC/f'r169-{id}.png',DEST/f'r170-{id}.png')
w,h=450,335
canvas=Image.new('RGB',(w*4,h*2),'#132639')
try:font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',21)
except:font=ImageFont.load_default()
for i,id in enumerate(hero):
 im=Image.open(SRC/f'r169-{id}.png').convert('RGB')
 im.thumbnail((w,302),Image.Resampling.LANCZOS)
 p=Image.new('RGB',(w,h),'#203448');p.paste(im,((w-im.width)//2,33))
 name=next(c['name'] for c in gallery['cards'] if c['id']==id)
 ImageDraw.Draw(p).text((9,4),id+' '+name,font=font,fill='#f5ddb4')
 canvas.paste(p,((i%4)*w,(i//4)*h))
canvas.save(DEST/'r170-seven-cinematic-props.jpg',quality=87,optimize=True)
r={
 'date':'2026-11-18','mode':'R170 QA-only atop R169',
 'addedHeroPropDetailedMeshes':hero,'allSpellsRendered':46,
 'realBattleCases':3,'realCharacters':16,'realCards':60,
 'modelBytes':75569762,'cameraSafe':True,'legacyOverlaysOnNewMode':0,
 'shaderPointLightsAdded':0,
 'singleSpellMaxDrawCallsObserved':max(x['drawCalls'] for x in gallery['cards']),
 'visualGrade':'prototype-detail-pass only; no formal high-fidelity visual review',
 'needed':'authored skeletal cast gestures, actual cloth/food/chalk shader art, 46 real Qwen voices, true mobile GPU p99; GPU draw calls need consolidation before release',
 'decision':'NO-GO Draft'
}
(DEST/'r170-final-summary.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
print('R170_FINAL',json.dumps(r,ensure_ascii=False))
