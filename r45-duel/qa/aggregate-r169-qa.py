#!/usr/bin/env python3
"""Strict R169 original R147 rules + 46 distinct school props + Foley audit."""
import json, shutil
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
SRC=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r169-campus-comedy')
OUT=Path(__file__).resolve().parent/'evidence/r169-campus-comedy'
OUT.mkdir(parents=True,exist_ok=True)
gallery=json.loads((SRC/'r169-46-gallery.json').read_text())
battle=json.loads((SRC/'r169-battle-qa.json').read_text())
audio=json.loads((SRC/'r169-audio-audit.json').read_text())
assert gallery['passed'] and len(gallery['cards'])==46
assert gallery['inventory']['identCount']==46
assert gallery['inventory']['foleyCount']==46
assert gallery['end']['uniqueRenderedProps']==46
assert gallery['end']['shaderPointLights']==0
assert len(gallery['snapshots'])==16 and not gallery['errors']
assert len(set(x['prop'] for x in gallery['cards']))==46
assert audio['originalCueFilesVerified'] and audio['cards']==46
assert audio['newQwenCharacterVoicesRendered']==0
assert len(battle['cases'])==3 and all(x['pass'] and not x['errors'] for x in battle['cases'])
for x in battle['cases']:
 assert x['initial']['models']==16 and x['initial']['cards']==60
 assert x['initial']['bytes']==75569762
 if x['mode']=='on':
  assert x['after']['stage']['played']==9 and x['after']['legacyImpact']==0
  assert x['after']['legacyArsenal']==0 and x['after']['stage']['shaderPointLights']==0
 else:
  assert x['after']['legacyImpact']==9 and x['after']['legacyArsenal']==9
for fn in ('r169-46-gallery.json','r169-battle-qa.json','r169-audio-audit.json'):
 shutil.copy2(SRC/fn,OUT/fn)
for view,mode in [('desktop','on'),('mobile','on'),('desktop','off')]:
 shutil.copy2(SRC/f'r169-{view}-{mode}-battle.png',OUT/f'r169-{view}-{mode}-battle.png')
sample=gallery['snapshots']
try:font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',20)
except:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
w,h=360,238
montage=Image.new('RGB',(w*4,h*4),'#102032')
for index,id in enumerate(sample):
 f=SRC/f'r169-{id}.png'
 im=Image.open(f).convert('RGB')
 im.thumbnail((w,205),Image.Resampling.LANCZOS)
 panel=Image.new('RGB',(w,h),'#112234')
 panel.paste(im,((w-im.width)//2,33))
 draw=ImageDraw.Draw(panel)
 entry=next(c for c in gallery['cards'] if c['id']==id)
 draw.text((8,3),id+' · '+entry['name'],font=font,fill='#f6dfb2')
 montage.paste(panel,((index%4)*w,(index//4)*h))
montage.save(OUT/'r169-16-physical-spell-prototypes.jpg',quality=82,optimize=True)
for id in ('E06','K01','K06','Q05','P04','P05'):
 shutil.copy2(SRC/f'r169-{id}.png',OUT/f'r169-{id}.png')
summary={
 'project':'AfterSchoolDuelClub Web R169',
 'gate':'qa=1 & r169SchoolMagic=on only',
 'status':'QA 3D physics-prop prototypes, NOT finished visual/audio production, NOT merged/published',
 'existingSpellCards':46,'sevenLayerIdentityCompleted':46,
 'new3DPhysicalPropsRendered':46,'distinctSchoolComedyFamilies':gallery['inventory']['families'],
 'previewScreenshots':16,'actualBattleQA':3,'actualBattleSpellEvents':27,
 'originalCharacters':16,'originalCards':60,'originalModelBytes':75569762,
 'legacyGenericMagicPlayedInNewMode':0,
 'originalGenericMagicRollbackVerified':True,
 'newShaderPointLights':0,
 'newRecordedVoices':0,'voiceScripts':46,'foleyPatternCount':46,
 'originalOGGFoleyFilesReused':audio['baseOriginalFoleyFiles'],
 'audioSourceFilesVerified':True,
 'visualQualityGrade':'prototype only, shapes still coarse; art direction and exact per-character skeletal animations need further delivery',
 'performanceClaim':'No steady performance uplift claimed. Test frame times are not randomized/controlled hardware benchmarks.',
 'releaseDecision':'DRAFT / NO-GO until character gestures, authentic Qwen voice, acting, art polish, full 46-spell fight regression and true mobile benchmark'
}
(OUT/'r169-final-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('R169_AUDIT',json.dumps(summary,ensure_ascii=False))
