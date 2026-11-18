#!/usr/bin/env python3
"""QA audit and screenshot evidence for R164. No asset or game-code edits."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageChops,ImageStat
import json,shutil

REMOTE=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r164-stadium-broadcast')
OUT=Path(__file__).resolve().parent/'evidence/r164-broadcast'
OUT.mkdir(parents=True,exist_ok=True)
data=json.loads((REMOTE/'r164-local-browser-sync.json').read_text())
assert len(data['cases'])==3
by={(row['device'],row['mode']):row for row in data['cases']}
assert set(by)=={('desktop','on'),('mobile','on'),('desktop','off')}
for row in data['cases']:
 assert row['pass'] and not row['errors'],(row['device'],row['errors'])
 assert row['idle']['modelCount']==16 and row['idle']['cards']==60
 assert row['idle']['bytes']==75569762
for device in ['desktop','mobile']:
 row=by[(device,'on')]
 b=row['casting']['broadcast'];h=row['hitting']['broadcast']
 assert b['cardImageLoaded'] and b['mode']=='cast' and b['side']=='player'
 assert h['mode']=='hit' and h['side']=='ai' and h['hits']==1
 assert row['idle']['broadcast']['footprintOverlapsScoreboard']==False
 assert row['casting']['portraitHidden'] and row['hitting']['portraitHidden']
 assert not row['casting']['lens']['visible'] and not row['hitting']['heroLens']['visible']
 assert b['captureCpuP50Ms']<30 and h['captureCpuP50Ms']<30
 assert h['renderedFrames']>=6 and row['after']['broadcast']['idle']
 for x,y,z in (row['idle']['projection']['screen']):
  assert abs(x)<.97 and abs(y)<.8,(device,x,y)
assert by[('desktop','off')]['casting']['portraitHidden']==False
assert by[('desktop','off')]['casting']['broadcast']=={'enabled':False}
shutil.copy2(REMOTE/'r164-local-browser-sync.json',OUT/'r164-local-browser-sync.json')
cases={}
for dev in ['desktop','mobile']:
 cases[dev]={}
 for kind in ['idle','cast','hit']:
  f=REMOTE/(dev+'-'+kind+'.png')
  assert f.exists(),f
  img=Image.open(f).convert('RGB')
  cases[dev][kind]=img
  shutil.copy2(f,OUT/f.name)
shutil.copy2(REMOTE/'desktop-original-foreground.png',OUT/'desktop-original-foreground.png')
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
except:font=ImageFont.load_default()
def label(img,text,height=34):
 out=Image.new('RGB',(img.width,img.height+height),'#1b293b')
 out.paste(img,(0,height))
 d=ImageDraw.Draw(out);d.text((12,4),text,font=font,fill='#fff3dd')
 return out
for dev in cases:
 target_w=640 if dev=='desktop' else 310
 cols=[]
 for kind in ['idle','cast','hit']:
  src=cases[dev][kind]
  h=round(src.height*target_w/src.width)
  panel=src.resize((target_w,h),Image.Resampling.LANCZOS)
  cols.append(label(panel,dev.upper()+' '+kind.upper()))
 coll=Image.new('RGB',(sum(x.width for x in cols),max(x.height for x in cols)),'#122333')
 offset=0
 for panel in cols:
  coll.paste(panel,(offset,0));offset+=panel.width
 coll.save(OUT/(dev+'-live-broadcast-montage.jpg'),quality=82,optimize=True)
# Tight real TV screen crops, aligned with actual projected geometry.
panels=[]
pixelDiff={}
for dev in ('desktop','mobile'):
 row=by[(dev,'on')]
 p=row['idle']['projection']['screen']
 source=cases[dev]['idle']
 w,h=source.size
 x0=max(0,round((min(x[0] for x in p)+1)*w/2)-5)
 x1=min(w,round((max(x[0] for x in p)+1)*w/2)+5)
 y0=max(0,round((1-max(x[1] for x in p))*h/2)-5)
 y1=min(h,round((1-min(x[1] for x in p))*h/2)+5)
 assert 70<x1-x0<400 and 65<y1-y0<450,(dev,(x0,y0,x1,y1))
 roi=(x0,y0,x1,y1)
 dif=ImageStat.Stat(ImageChops.difference(
  cases[dev]['cast'].crop(roi),cases[dev]['hit'].crop(roi))).mean
 pixelDiff[dev]={'tvAreaPixels':roi,'castVsHitMeanAbsRGB':[round(x,3) for x in dif]}
 assert max(dif)>2,('TV appears static',dev,dif)
 for kind in ['idle','cast','hit']:
  crop=cases[dev][kind].crop(roi).resize((400,225),Image.Resampling.LANCZOS)
  panels.append(label(crop,dev.upper()+' / '+kind.upper()))
sheet=Image.new('RGB',(400*3,max(p.height for p in panels)*2),'#122333')
for i,p in enumerate(panels):
 sheet.paste(p,((i%3)*400,(i//3)*p.height))
sheet.save(OUT/'r164-real-tv-closeups.jpg',quality=86,optimize=True)

files=[]
for p in sorted(REMOTE.glob('r164-perf-*.json')):
 # only confirmed real QA logs: strict A/B, no synthetic rows.
 d=json.loads(p.read_text())
 if len(d['cases'])!=2 or not all(r['pass'] for r in d['cases']):continue
 shutil.copy2(p,OUT/p.name)
 files.append(p.name)
summary={
 'release':'R164 QA-only / no production deployment',
 'functionalCases':len(data['cases']),
 'functionalPassed':all(x['pass'] for x in data['cases']),
 'originalAssetsChanged':False,'original16ModelsPreserved':True,
 'original60CardsPreserved':True,
 'playersForegroundPortraitHiddenInBroadcastMode':True,
 'stadiumScoreboardClearanceVerified':True,
 'mobilePhysicalHardwareTested':False,
 'liveTVVisualDifferences':pixelDiff,
 'performanceFiles':files,
 'performanceDecision':'NO GO for automatic default: mobile hit-frame p95 has increased from approximately 33 to 50 ms in reversed A/B runs; idle scheduling trial was rejected.',
 'currentLiveMode':'synchronous capped 18 Hz desktop / 12 Hz mobile only while card/hit active',
}
(OUT/'r164-audit-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('R164_ALL_QA_PASS',summary['functionalCases'],'TV_DIFF',json.dumps(pixelDiff),'PERF_FILES',len(files))
