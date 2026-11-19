"""R186: reproducible ORIGINAL digitally synthesized school-prop Foley.
Source recordings: none. Distinct acoustic designs, NOT stock audio and not VO.
10 different prop-specific Ogg Vorbis clips, fully offline.
"""
import json,hashlib,subprocess,random,wave,os
from pathlib import Path
import numpy as np
SR=32000;DUR=1.13
N=int(SR*DUR);T=np.arange(N,dtype=np.float64)/SR
DIR=Path(__file__).resolve().parents[1]/'assets/audio'
DIR.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(1862026)
def env(start,length,attack=.009,release=.27):
 u=T-start
 rising=np.clip(u/max(attack,1e-4),0,1)**.65
 falling=np.clip((length-u)/max(release,1e-4),0,1)**1.8
 return (u>=0)*(u<length)*rising*falling
def tone(t0,length,f0,f1=None,amp=.34,partials=(1,.32,.12)):
 ft=f0+(0 if f1 is None else (f1-f0)*np.clip((T-t0)/length,0,1))
 phase=np.cumsum(ft)/SR*2*np.pi
 y=sum(np.sin(phase*(k+1)+.17*k)*v for k,v in enumerate(partials))
 return y*env(t0,length)*amp
def air(t0,length,amp=.20,mode='white'):
 raw=rng.normal(0,1,N)
 if mode=='brown':
  raw=np.convolve(raw,np.ones(68)/68,mode='same')*9
 elif mode=='hiss':
  smooth=np.convolve(raw,np.ones(12)/12,mode='same')
  raw=(raw-smooth)*.9
 elif mode=='paper':
  raw=np.convolve(raw,np.ones(8)/8,mode='same')*2
 elif mode=='grit':
  raw=np.convolve(raw,np.ones(4)/4,mode='same')*2
 return raw*env(t0,length,.002,length*.47)*amp
def ping(t0,pitch=900,amp=.25,decay=.19):
 u=np.maximum(0,T-t0)
 return (T>=t0)*amp*np.exp(-u/decay)*(
  np.sin(2*np.pi*pitch*u)+.39*np.sin(2*np.pi*pitch*2.09*u))
def layers(id):
 y=np.zeros(N)
 if id=='P01':
  # real character hurricane hair frizz, cloth cape beating, shoes skidding
  y+=air(.01,.87,.19,'hiss')
  y+=tone(.10,.70,280,540,.14,(1,.35,.17))
  for t in (.18,.33,.50,.72):
   y+=air(t,.18,.12,'paper')
   y+=ping(t,240+int(t*270),.08,.09)
 elif id=='P02':
  # 100 year old ball thudding into goal and bouncing entirely off
  for t in (.08,.23,.48,.74):
   y+=tone(t,.23,170,82,.28*(1-t*.35),(1,.48,.22))
   y+=air(t,.13,.08,'grit')
  y+=ping(.81,620,.12,.19)
 elif id=='P06':
  # treadmill motor reverse rotation and wet sneaker rubber squeak
  y+=tone(.04,.83,155,97,.17,(1,.52,.22))
  y+=air(.02,.94,.11,'grit')
  for t in (.25,.43,.68,.84):
   y+=tone(t,.16,860,350,.12,(1,.31))
   y+=ping(t,350,.05,.09)
 elif id=='P08':
  # three championship medals rattling after cosmic impact
  y+=tone(.04,.55,410,70,.22,(1,.53,.19))
  y+=air(.09,.69,.11,'grit')
  for t in (.28,.36,.45,.76):
   y+=ping(t,1600+int(t*360),.20,.27)
  y+=ping(.87,960,.19,.19)
 elif id=='X01':
  # actual tower brass escapement reversing, very different to small bedside alarm
  for t in (.05,.18,.30,.44,.57,.68):
   y+=ping(t,720,.16,.11)
   y+=air(t,.065,.07,'hiss')
  y+=tone(.28,.62,270,145,.18,(1,.35,.22))
  y+=ping(.83,1180,.25,.23)
 elif id=='X04':
  # cotton pillow pneumatic soft squish + paper prophecy escaping
  for t in (.05,.25,.44,.66):
   y+=air(t,.23,.20,'brown')
   y+=tone(t,.17,125,65,.13,(1,.16))
  y+=air(.68,.34,.17,'paper')
  y+=ping(.85,1050,.09,.12)
 elif id=='X06':
  # classroom photocopier feed rollers plus staggered book sheets
  y+=tone(.04,.77,330,420,.19,(1,.38,.17))
  for t in np.arange(.12,.78,.065):
   y+=air(float(t),.075,.075,'grit')
   y+=ping(float(t),700,.048,.04)
  y+=air(.72,.29,.11,'paper')
 elif id=='X07':
  # vanishing classroom book pages with startling absence at the end
  y+=air(.05,.64,.18,'paper')
  for t in (.18,.32,.49,.62):
   y+=ping(t,670+120*t,.07,.09)
  y+=tone(.34,.42,360,64,.15,(1,.22))
  y+=air(.77,.15,.055,'hiss')
 elif id=='X08':
  # human school time security turnstile clinks, access pass reads
  for t in (.07,.22,.40,.58):
   y+=ping(t,1450,.13,.13)
   y+=air(t,.10,.09,'grit')
  y+=tone(.45,.37,780,940,.15,(1,.3))
  y+=ping(.83,1550,.21,.14)
 else:raise ValueError(id)
 y=y-np.mean(y)
 y*=np.minimum(1,T/.012)
 y*=np.minimum(1,(DUR-T)/.065)
 peak=max(1e-6,np.max(np.abs(y)))
 y=np.tanh(y/(peak+.00001)*.82)*.83
 return (np.clip(y,-1,1)*32767).astype(np.int16)
def main():
 manifest={}
 for id in ['P01','P02','P06','P08','X01','X04','X06','X07','X08']:
  name='r186_'+id.lower()
  dst=DIR/(name+'.ogg')
  wav=Path('/tmp')/(name+'.wav')
  with wave.open(str(wav),'wb') as w:
   w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
   w.writeframes(layers(id).tobytes())
  subprocess.run(['ffmpeg','-y','-nostdin','-hide_banner','-loglevel','error',
    '-i',str(wav),'-vn','-acodec','libvorbis','-qscale:a','5',str(dst)],
    check=True,timeout=20)
  wav.unlink()
  p=subprocess.run(['ffprobe','-v','error','-show_entries',
   'format=duration:stream=codec_name,sample_rate',
   '-of','json',str(dst)],capture_output=True,text=True,check=True)
  info=json.loads(p.stdout)
  assert info['streams'][0]['codec_name']=='vorbis'
  duration=float(info['format']['duration'])
  assert .9<duration<1.3
  dat=dst.read_bytes()
  assert dat[:4]==b'OggS'
  manifest[id]={'file':dst.name,'bytes':len(dat),'sha256':hashlib.sha256(dat).hexdigest(),
   'durationSeconds':round(duration,4),
   'authorship':'Original reproducible digital synthesis (no source recording, not voice)',
   'mono':True,'encoder':'ffmpeg libvorbis'}
 (DIR/'r186_original_foley_sha256_manifest.json').write_text(json.dumps({
  'round':'R186','total':len(manifest),'recordedCharacterVoices':0,
  'status':'QA only; hearing/creative signoff not done','assets':manifest},
  ensure_ascii=False,indent=2))
 print('R186_UNIQUE_ORIGINAL_PROP_FOLEY',json.dumps({
  'clips':len(manifest),'totalBytes':sum(x['bytes'] for x in manifest.values()),
  'originalSynthSources':9,'recordedCharacterVoices':0},ensure_ascii=False))
if __name__=='__main__':main()
