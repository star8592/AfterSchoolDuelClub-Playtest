"""R225 real artifact and Chrome screenshot audit; no mock geometry."""
from pathlib import Path
from PIL import Image,ImageStat
import json,struct,subprocess,math
ROOT=Path(__file__).resolve().parents[1]
EVID=ROOT/'evidence'
def gltf(path):
 b=path.read_bytes()
 assert b[:4]==b'glTF'
 n=struct.unpack_from('<I',b,12)[0]
 return len(b),json.loads(b[20:20+n])
oldbytes,old=gltf(ROOT/'assets/jay-teen-duel-v05-footlock.glb')
newbytes,new=gltf(ROOT/'assets/jay-teen-duel-v06-school.glb')
assert len(new.get('skins',[]))==len(old.get('skins',[]))==1
assert len(new['skins'][0]['joints'])==len(old['skins'][0]['joints'])==24
assert {x['name'] for x in new['animations']}=={x['name'] for x in old['animations']}
assert len(new['animations'])==11
assert len(new['meshes'])==2
assert 6<=sum(len(m['primitives']) for m in new['meshes'])<=10
for m in new['meshes']:
 for pr in m['primitives']:
  assert 'JOINTS_0' in pr['attributes'] and 'WEIGHTS_0' in pr['attributes']
  pos=new['accessors'][pr['attributes']['POSITION']]
  assert all(-2.6<v<3.3 for v in pos['min']+pos['max']), (m.get('name'),pos)
for name in ['navy','ivory','burgundy','leather']:
 f=ROOT/'assets'/f'jay-r225-{name}-weave.png'
 assert f.is_file()
 assert Image.open(f).size==(256,256)
assert (ROOT/'source/jay-teen-duel-v06-school.blend').stat().st_size>3_000_000
assert (ROOT/'style_jay_r225.py').exists()
for camera in ['profile','front']:
 path=EVID/f'r225-jay-{camera}-real-chrome-motion.json'
 data=json.loads(path.read_text())
 assert data['ok'] and len(data['frames'])==5 and data['errors']==[]
 for k in ['idle','draw','attack','hit','victory']:
  f=EVID/f'r225-jay-{camera}-{k}-real-chrome.png'
  im=Image.open(f).convert('RGB')
  rgb=ImageStat.Stat(im.crop((500,150,1100,640))).mean
  assert rgb[0]<140,(f,rgb)
report=json.loads((EVID/'r225-card-face/r225-card-face-occlusion-real-chrome-ab.json').read_text())
assert report['ok'] and report['errors']==[]
a={r['revision']:r['rows'] for r in report['cases']}
assert len(a['r224'])==len(a['r225'])==4
metrics=[]
for i in range(4):
 o=a['r224'][i];n=a['r225'][i]
 assert o['time']==n['time']
 metrics.append({'timeSec':o['time'],'r224HeadGapPx':o['centerDistancePx'],
   'r225HeadGapPx':n['centerDistancePx']})
assert metrics[1]['r225HeadGapPx']>metrics[1]['r224HeadGapPx']+20
assert metrics[2]['r225HeadGapPx']>metrics[2]['r224HeadGapPx']+20
video=EVID/'r225-jay-campus-uniform-five-actions-real-chrome.mp4'
length=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(video)],text=True))
assert 8.0<length<15.0 and video.stat().st_size>150_000
for f in ['r225-jay-campus-outfit-r224-before-after-5-actions.jpg',
          'r225-jay-face-occlusion-r224-vs-r225-real-chrome.jpg']:
 assert (EVID/f).stat().st_size>50000
baseline=json.loads((EVID/'r224-jay-profile-real-chrome-motion.json').read_text())
current=json.loads((EVID/'r225-jay-profile-real-chrome-motion.json').read_text())
for x,y in zip(baseline['frames'],current['frames']):
 assert x['kind']==y['kind']
 if x['kind'] not in ['draw','attack','hit','victory']:continue
 for key in ['rightHandForwardM','leftHandForwardM','rightFootHeightM','leftFootHeightM']:
  assert abs(x['newJay']['handDepth'][key]-y['newJay']['handDepth'][key])<0.012,(key,x['kind'])
result={'ok':True,'sourceRigJoints':24,'animations':11,'oldGLBBytes':oldbytes,'r225GLBBytes':newbytes,
 'sizeIncreaseBytes':newbytes-oldbytes,'r225NewAccessoryMeshPrimitives':sum(len(m['primitives']) for m in new['meshes'][1:]),
 'totalMeshPrimitives':sum(len(m['primitives']) for m in new['meshes']),
 'capturedViews':['profile','front'],'fiveActionsEach':True,
 'videoSeconds':round(length,2),'realCardFaceDistancesPx':metrics,
 'caveats':['24-bone rig has no finger joints','not a production FPS benchmark',
          'art direction and original body license not yet signed off','Draft only'] }
(EVID/'r225-model-browser-visual-integrity.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('R225_REAL_MODEL_VISUAL_INTEGRITY_PASS',result)
