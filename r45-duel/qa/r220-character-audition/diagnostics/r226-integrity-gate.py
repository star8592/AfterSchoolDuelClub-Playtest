"""R226 strict imported-GLB/browser evidence gate. No aesthetics auto-PASS."""
from pathlib import Path
from PIL import Image,ImageStat
import json,struct,subprocess
ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'evidence'
def readglb(p):
 b=p.read_bytes(); assert b[:4]==b'glTF'
 return len(b),json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]])
oldsize,old=readglb(ROOT/'assets/jay-teen-duel-v06-school.glb')
size,glb=readglb(ROOT/'assets/jay-teen-duel-v07-elbow-inward.glb')
assert oldsize==size and len(glb['skins'])==1 and len(glb['skins'][0]['joints'])==24
assert set(a.get('name') for a in old['animations'])==set(a.get('name') for a in glb['animations'])
assert len(glb['animations'])==11
full=json.loads((E/'r226-full-24fps-joint-kinematics-old-vs-new.json').read_text())
assert len(full)==2
oldk=full['jay-teen-duel-v06-school.glb']
newk=full['jay-teen-duel-v07-elbow-inward.glb']
actions=['Duel_DrawCard','Duel_ThrowCard','Duel_Recoil','Duel_Victory']
oldfail=0;newfail=0;frames=0
for action in actions:
 olds=oldk[action]['frames'];news=newk[action]['frames']
 assert len(olds)==len(news) and len(news)>=19
 frames+=len(news)
 for side in ['Right','Left']:
  a=oldk[action]['stats'][side];b=newk[action]['stats'][side]
  oldfail+=a['countOutsideByMoreThan2cm']
  newfail+=b['countOutsideByMoreThan2cm']
  assert b['countOutsideByMoreThan2cm']==0,(action,side,b)
  assert b['minimumInwardM']>0.019,(action,side,b)
  assert b['minimumForwardM']>0.115,(action,side,b)
  assert 23<=b['angleMin']<=b['angleMax']<=125,(action,side,b)
  for before,after in zip(olds,news):
   assert before['frame']==after['frame']
   # No data alteration to feet from arm-only source transformation.
   for axis in range(3):
    assert abs(before[side+'FootWorldXYZ'][axis]-after[side+'FootWorldXYZ'][axis])<.002,(action,side,'feet moved by arm fix')
assert oldfail>20 and newfail==0
for camera in ['front','profile']:
 meta=json.loads((E/f'r226-jay-{camera}-real-chrome-motion.json').read_text())
 assert meta['ok'] and not meta['errors'] and len(meta['frames'])==5
 for frame in meta['frames']:
  kind=frame['kind'];h=frame['newJay']['handDepth']
  if kind!='idle':
   for side in ['left','right']:
    assert h[side+'WristInsideElbowM']>.006,(camera,kind,side,h)
    assert h[side+'HandForwardM']>.14,(camera,kind,side,h)
    assert 23<h[side+'ActualElbowBendDeg']<125,(camera,kind,side,h)
  img=Image.open(E/f'r226-jay-{camera}-{kind}-real-chrome.png').convert('RGB')
  stage=ImageStat.Stat(img.crop((520,160,1110,670)))
  assert stage.mean[0]<145,(camera,kind,'blank screenshot',stage.mean)
occlusion=json.loads((E/'r226-card-face/r226-card-face-occlusion-real-chrome-ab.json').read_text())
assert occlusion['ok'] and not occlusion['errors'] and len(occlusion['cases'])==2
now=next(x for x in occlusion['cases'] if x['revision']=='r226')
assert next(x for x in now['rows'] if x['time']==0.90)['centerDistancePx']>60
assert next(x for x in now['rows'] if x['time']==1.03)['centerDistancePx']>95
video=E/'r226-jay-anatomical-elbow-five-actions-real-chrome.mp4'
sec=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(video)],text=True))
assert 8<sec<15 and video.stat().st_size>100_000
assert (ROOT/'source/jay-teen-duel-v07-elbow-inward.blend').stat().st_size>3_000_000
assert (E/'r226-jay-elbow-wrist-before-after-four-actions-real-chrome.jpg').stat().st_size>50_000
print('R226_ACTUAL_JOINT_REPAIR_QA_PASS',json.dumps({
 'oldOutwardFramesOver2cmAcrossBothArms':oldfail,
 'newOutwardFramesOver2cmAcrossBothArms':newfail,
 'sampledFramesPerCharacter':frames,
 'allFourActionsChecked':True,
 'renderViews':['front','profile'],'renderScreenshots':10,
 'videoSeconds':round(sec,3),'sameGeometryAndAnimations':True,
 'cardFaceDistancesPx':{x['time']:x['centerDistancePx'] for x in now['rows']},
 'visualArtAcceptance':'NO_GO: no finger articulation, human movement still pending'
},ensure_ascii=False))
