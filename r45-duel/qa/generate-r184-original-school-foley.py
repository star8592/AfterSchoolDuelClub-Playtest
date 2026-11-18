"""R184: reproducible ORIGINAL digitally synthesized school-prop Foley.
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
rng=np.random.default_rng(1842026)
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
 if id=='E05': # compressed vibrating diaphragm + megaphone rally rhythm
  y+=tone(.03,.82,185,280,.25,(1,.72,.46,.22))
  y+=tone(.18,.67,290,345,.29,(1,.51,.33))
  y+=air(.03,.60,.085,'brown')
  for t in (.08,.30,.59):y+=ping(t,740,.07,.085)
 elif id=='G05': # wooden tabletop thump, metallic ratchet & screwdriver
  for t in (.06,.22,.42):
   y+=air(t,.16,.17,'grit')+ping(t,135+int(t*120),.29,.095)
  for t in np.arange(.48,.96,.046):
   y+=air(float(t),.042,.075,'hiss')+ping(float(t),920,.058,.024)
 elif id=='T06': # analogue PA tuner tuning, speech intelligibility preserved
  y+=air(.01,.86,.13,'hiss')
  y+=tone(.08,.40,330,1050,.17,(1,.37))
  y+=tone(.44,.28,900,540,.21,(1,.18,.09))
  for t in (.17,.38,.63,.84):
   y+=ping(t,340+int(t*700),.085,.06)
 elif id=='K03': # corn pan sizzle / grapes bounce / spatula clink
  y+=air(.03,.82,.14,'hiss')
  for t in (.11,.21,.37,.50,.67,.78):
   y+=tone(t,.10,190+int(t*220),95,.13,(1,.3))
   y+=ping(t,500+int(170*t),.10,.08)
  y+=ping(.82,1380,.14,.13)
 elif id=='K04': # pastry crust crackle + hot chili whistle
  for t in (.06,.12,.17,.26):
   y+=air(t,.15,.16,'grit')+ping(t,430+int(t*700),.07,.055)
  y+=tone(.37,.43,740,1800,.19,(1,.27,.16))
  y+=air(.42,.54,.12,'hiss')
  y+=ping(.78,1430,.23,.16)
 elif id=='Q02': # actual paper crinkling -> creature miniature growl
  for t in (.05,.18,.33,.48):
   y+=air(t,.25,.22,'paper')
  y+=tone(.35,.54,170,76,.24,(1,.6,.2))
  y+=air(.55,.41,.10,'brown')
  y+=ping(.91,650,.08,.11)
 elif id=='S01': # reverse-ticking mechanical alarm and last bells
  for t in (.05,.24,.41,.55,.67,.77):
   y+=ping(t,1560,.18,.065)
   y+=air(t,.065,.09,'hiss')
  y+=tone(.20,.67,580,250,.08,(1,.55))
  y+=ping(.78,1430,.23,.22)+ping(.83,1930,.15,.24)
 elif id=='S06': # tense latex rubber stretch followed by twang and hat sail
  y+=tone(.02,.61,210,740,.13,(1,.56,.27))
  y+=air(.03,.49,.08,'paper')
  y+=tone(.50,.35,430,90,.34,(1,.45,.14))
  y+=ping(.51,140,.30,.19)
  y+=air(.61,.38,.14,'brown')
 elif id=='P07': # skate blade metal across rough ice + soft black-swan honk
  y+=air(.08,.67,.10,'hiss')
  y+=tone(.09,.66,1240,420,.09,(1,.35,.16))
  y+=tone(.44,.47,270,350,.17,(1,.16))
  y+=ping(.68,1790,.13,.19)
  y+=air(.79,.24,.055,'paper')
 elif id=='X02': # crisp fluttering school blazer through rugged masonry
  y+=air(.03,.69,.17,'paper')
  for t in (.13,.28,.43,.55,.73):
   y+=air(t,.17,.12,'grit')
   y+=ping(t,230+int(t*300),.11,.084)
  y+=tone(.69,.28,720,190,.17,(1,.4))
  y+=ping(.89,1270,.14,.09)
 else:raise ValueError(id)
 # high pass for sub-30Hz offset, fade true endpoint.
 y=y-np.mean(y)
 y*=np.minimum(1,T/.012)
 y*=np.minimum(1,(DUR-T)/.065)
 peak=max(1e-6,np.max(np.abs(y)))
 y=np.tanh(y/(peak+.00001)*.82)*.83
 return (np.clip(y,-1,1)*32767).astype(np.int16)
def main():
 manifest={}
 for id in ['E05','G05','T06','K03','K04','Q02','S01','S06','P07','X02']:
  name='r184_'+id.lower()
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
 (DIR/'r184_original_foley_sha256_manifest.json').write_text(json.dumps({
  'round':'R184','total':len(manifest),'recordedCharacterVoices':0,
  'status':'QA only; hearing/creative signoff not done','assets':manifest},
  ensure_ascii=False,indent=2))
 print('R184_UNIQUE_ORIGINAL_PROP_FOLEY',json.dumps({
  'clips':len(manifest),'totalBytes':sum(x['bytes'] for x in manifest.values()),
  'originalSynthSources':10,'recordedCharacterVoices':0},ensure_ascii=False))
if __name__=='__main__':main()
