"""R185: reproducible ORIGINAL digitally synthesized school-prop Foley.
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
rng=np.random.default_rng(1852026)
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
 if id=='G06': # popping school engineering plan with real paper crackles and snap
  for t in (.03,.12,.24,.39,.53):
   y+=air(t,.19,.17,'paper')
  y+=tone(.17,.44,200,460,.14,(1,.38))
  y+=ping(.62,950,.23,.12)+air(.74,.22,.09,'hiss')
 elif id=='T05': # glazed ceramic bowl and tiny simmer, spoon steel tapping sides
  y+=air(.02,.87,.11,'brown')
  for t in (.10,.27,.42,.67):
   y+=ping(t,1030+110*t,.19,.22)
   y+=tone(t,.10,290,130,.09,(1,.25))
  y+=air(.79,.22,.08,'hiss')
 elif id=='K05': # absurd empty soup—hollow ceramic clink, two silent gaps
  for t in (.04,.36,.80):
   y+=ping(t,840,.27,.26)+tone(t,.22,240,70,.12,(1,.45))
  y+=air(.04,.25,.043,'brown')+air(.78,.21,.040,'hiss')
 elif id=='Q03': # self writing chalk squeak, sleepy dream whistling
  for t in (.05,.19,.31,.44,.57,.69):
   y+=air(t,.16,.13,'grit')
   y+=tone(t,.14,860,550,.08,(1,.34))
  y+=tone(.64,.30,310,280,.16,(1,.36))
 elif id=='Q04': # phone tattle screen chirps, speaker cone and glass rattle
  for t in (.05,.29,.48,.70):
   y+=tone(t,.12,790+int(t*220),1100,.10,(1,.48))
  y+=tone(.24,.60,115,81,.30,(1,.41,.12))
  y+=ping(.57,1730,.18,.09)
  y+=air(.73,.22,.05,'grit')
 elif id=='Q07': # cardboard second moon turning, school model metal wobble
  for t in (.06,.19,.38,.61):
   y+=air(t,.26,.14,'paper')
   y+=ping(t,700+250*t,.11,.12)
  y+=tone(.51,.42,415,155,.14,(1,.2,.10))
 elif id=='Q08': # crunchy school chalk line, metal lock closing
  y+=air(.04,.61,.21,'grit')
  for t in (.09,.26,.41,.54,.70):
   y+=tone(t,.10,980,420,.14,(1,.20))
  y+=ping(.77,1690,.31,.23)+ping(.85,560,.14,.14)
 elif id=='S02': # real zipper like ratchet, one pencil wood tap
  for t in np.arange(.07,.48,.034):
   y+=air(float(t),.045,.09,'paper')
   y+=ping(float(t),1320,.055,.025)
  y+=ping(.61,1190,.28,.15)
  y+=tone(.64,.31,315,70,.11,(1,.39))
 elif id=='S05': # mistaken robot attendance voice-less beeps and servo motor
  y+=tone(.02,.74,270,580,.20,(1,.28,.1))
  for t in (.12,.24,.42,.54,.70):
   y+=ping(t,700+int(t*330),.14,.06)
  y+=air(.33,.29,.10,'hiss')
  y+=tone(.76,.21,880,420,.20,(1,.4))
 elif id=='S07': # school metal recess bell folds into repeated Monday
  for t in (.04,.29,.52):
   y+=ping(t,1050,.30,.26)+ping(t,1640,.13,.24)
  for t in (.17,.44,.75):
   y+=air(t,.24,.11,'paper')
  y+=tone(.62,.33,600,220,.20,(1,.4))
 else:raise ValueError(id)
 y=y-np.mean(y)
 y*=np.minimum(1,T/.012)
 y*=np.minimum(1,(DUR-T)/.065)
 peak=max(1e-6,np.max(np.abs(y)))
 y=np.tanh(y/(peak+.00001)*.82)*.83
 return (np.clip(y,-1,1)*32767).astype(np.int16)
def main():
 manifest={}
 for id in ['G06','T05','K05','Q03','Q04','Q07','Q08','S02','S05','S07']:
  name='r185_'+id.lower()
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
 (DIR/'r185_original_foley_sha256_manifest.json').write_text(json.dumps({
  'round':'R185','total':len(manifest),'recordedCharacterVoices':0,
  'status':'QA only; hearing/creative signoff not done','assets':manifest},
  ensure_ascii=False,indent=2))
 print('R185_UNIQUE_ORIGINAL_PROP_FOLEY',json.dumps({
  'clips':len(manifest),'totalBytes':sum(x['bytes'] for x in manifest.values()),
  'originalSynthSources':10,'recordedCharacterVoices':0},ensure_ascii=False))
if __name__=='__main__':main()
