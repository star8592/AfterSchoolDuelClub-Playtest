from pathlib import Path
import json,math,subprocess
from PIL import Image,ImageStat
r=Path(__file__).resolve().parents[1]
e=r/'evidence'
fail=[]
def validate_image(f):
 if not f.exists():fail.append('missing '+str(f));return
 im=Image.open(f).convert('RGB')
 if im.width<1000 or im.height<650:fail.append('too small '+f.name)
 # Actual stage center: white WebGL screenshot should fail even if text UI renders.
 crop=im.crop((480,160,1220,750))
 rgb=ImageStat.Stat(crop).mean
 if min(rgb)>150:fail.append('blank/white stage '+f.name+' '+str(rgb))
for prefix in ['r222','r223','r224']:
 keyframes=e/('r223-keyframes' if prefix=='r222' else 'r224-keyframes')
 if prefix=='r222':
  for t in [8,38,65,77,92,112,132]:validate_image(keyframes/(prefix+'-cast-'+str(t).zfill(3)+'.jpg'))
 else:
  for t in [8,38,65,77,92,112,132]:validate_image(keyframes/(prefix+'-cast-'+str(t).zfill(3)+'.jpg'))
for kind in ['idle','draw','attack','hit','victory']:
 validate_image(e/('r224-jay-profile-'+kind+'-real-chrome.png'))
data=json.loads((e/'r224-keyframes/r224-footlock-browser-keyframe-ab.json').read_text())
assert data['ok'] and len(data['cases'])==2
cases={c['revision']:c for c in data['cases']}
assert cases['r223']['footHorizontalSpreadM']>0.2
assert cases['r224']['footHorizontalSpreadM']<0.04
assert cases['r224']['footVerticalSpreadM']<0.01
assert cases['r224']['handDiffAt092M']>0.25
assert cases['r224']['cardTravelZ']>1.0
assert not data['errors']
log=json.loads((e/'r224-jay-full-motion-real-chrome.json').read_text())
assert log['ok'] and not log['errors'] and len(log['scenes'])==5
model=(r/'assets/jay-teen-duel-v05-footlock.glb')
assert model.is_file() and model.stat().st_size>3_000_000
video=e/'r224-jay-draw-cast-hit-victory-full-real-chrome.mp4'
assert video.is_file() and video.stat().st_size>80_000
sec=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(video)],text=True))
assert 8<sec<20
dataBlender=json.loads((e/'r224-blender-v04-v05-full-motion-kinematics.json').read_text())
assert len(dataBlender)==2
for kind,frames in dataBlender['jay-teen-duel-v05-footlock.glb'].items():
 for side in ['Right','Left']:
  hands=[q[side+'HandForwardM'] for q in frames]
  assert min(hands)>0,(kind,side,'hand backwards')
  for axis in [0,1]:
   feet=[q[side+'FootWorldXYZ'][axis] for q in frames]
   assert max(feet)-min(feet)<0.12,(kind,side,'foot slides',axis)
if fail:
 raise AssertionError('\n'.join(fail))
print('R224_EVIDENCE_INTEGRITY_PASS','21 verified nonblank Chrome frames',
 'five recorded actions',round(sec,2),'seconds',
 'R223 foot horizontal',cases['r223']['footHorizontalSpreadM'],
 'R224 foot horizontal',cases['r224']['footHorizontalSpreadM'],
 'card travel forward',cases['r224']['cardTravelZ'])
