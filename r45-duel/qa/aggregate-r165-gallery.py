#!/usr/bin/env python3
"""Exact-pixel A/B and contact sheet for 8 novel school magic motifs."""
from pathlib import Path
from PIL import Image,ImageChops,ImageStat,ImageDraw,ImageFont
import json,shutil
ROOT=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r163-magic-gallery')
OUT=Path(__file__).resolve().parent/'evidence/r165-magic'
OUT.mkdir(parents=True,exist_ok=True)
report=json.loads((ROOT/'r163-gallery-ab.json').read_text())
assert len(report['results'])==2
a,b=report['results']
assert (a['mode'],b['mode'])==('off','on')
assert a['motifCount']==b['motifCount']==40
assert len(a['all'])==len(b['all'])==46
assert not a['errors'] and not b['errors']
assert b['pool']['enabled'] and b['pool']['hits']>=400
assert not a['pool']['enabled']
ids=['S04','P01','P04','P07','P08','X03','X07','X08']
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',21)
except:font=ImageFont.load_default()
sheet=Image.new('RGB',(400*4,265*2),'#102235')
imageAudits=[]
for i,id in enumerate(ids):
 off=Image.open(ROOT/f'r163-off-{id}.png').convert('RGBA')
 on=Image.open(ROOT/f'r163-on-{id}.png').convert('RGBA')
 assert off.size==on.size
 dif=ImageStat.Stat(ImageChops.difference(off,on)).mean
 mean=[round(x,6) for x in dif]
 imageAudits.append({'id':id,'meanAbsoluteRGBA':mean,'pixelExact':all(x==0 for x in mean)})
 assert all(x==0 for x in mean),('geometry pooling changed pixels',id,mean)
 frame=on.convert('RGB')
 frame.thumbnail((400,220),Image.Resampling.LANCZOS)
 tile=Image.new('RGB',(400,265),'#102235')
 tile.paste(frame,((400-frame.width)//2,39))
 draw=ImageDraw.Draw(tile)
 name=next(x['name'] for x in b['samples'] if x['id']==id)
 draw.text((12,7),id+' / '+name,font=font,fill='#fff2cc')
 sheet.paste(tile,((i%4)*400,(i//4)*265))
shutil.copy2(ROOT/'r163-gallery-ab.json',OUT/'r163-gallery-ab.json')
sheet.save(OUT/'r165-eight-school-spells.jpg',quality=85,optimize=True)
detail={'cards':46,'motifs':40,'newDistinctMotifs':8,'samples':imageAudits,
 'geometriesCached':b['pool']['cache'],'reuseHits':b['pool']['hits'],
 'reuseMisses':b['pool']['misses'],'samePixelsWithCache':all(x['pixelExact'] for x in imageAudits),
 'originalR147DefaultMaintained':True,'notPublished':True}
(OUT/'r165-gallery-summary.json').write_text(json.dumps(detail,ensure_ascii=False,indent=2))
print('R165_GALLERY_IMAGES_EXACT',len(ids),'CARD_COUNT',detail['cards'],
 'MOTIFS',detail['motifs'],'CACHE_REUSE_HITS',detail['reuseHits'])
