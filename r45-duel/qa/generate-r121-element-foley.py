#!/usr/bin/env python3
"""R121 original reproducible fifteen-element contact Foley, no third-party samples."""
from pathlib import Path
from hashlib import sha256
import json, subprocess, tempfile, wave
import numpy as np
FS=48000
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/audio'
NAMES=['metal','wood','water','fire','earth','electric','wind','ice','light',
       'shadow','time','space','mind','sound','absurd']
META={}
def tone(t,f,phase=0):
 f=np.asarray(f)
 return np.sin(2*np.pi*np.cumsum(np.full(t.shape,float(f)) if f.ndim==0 else f)/FS+phase)
def noisy(t,rng,lo,hi):
 x=rng.normal(0,1,len(t))
 X=np.fft.rfft(x);freq=np.fft.rfftfreq(len(x),1/FS)
 W=(freq/(freq+lo))**2*(hi/(freq+hi))**3
 return np.fft.irfft(X*W,n=len(x))
def click(t,at,dur,f0,amp=1):
 q=t-at;return amp*(q>=0)*np.exp(-np.maximum(q,0)/dur)*tone(t,f0)
def synth(name):
 rng=np.random.default_rng(220521+NAMES.index(name)*809)
 length={'shadow':1.02,'time':1.04,'space':.99,'wind':.95,'water':.88,
         'ice':.92,'fire':.88,'earth':.77,'metal':.92}.get(name,.73)
 t=np.arange(int(length*FS))/FS
 env=(1-np.exp(-t*90))*np.exp(-t/(length*.30))
 low=noisy(t,rng,45,700);high=noisy(t,rng,650,11500)
 crack=noisy(t,rng,280,6800)
 x=np.zeros_like(t)
 if name=='metal':
  for j,(f,weight) in enumerate([(251,.5),(357,.28),(543,.23),(821,.20),(1287,.16)]):
   x+=weight*tone(t,f+12*np.exp(-t*32))*np.exp(-t*(3.3+j*.3))
  x+=.5*high*np.exp(-t*38)
 elif name=='wood':
  x=.7*tone(t,105+70*np.exp(-t*44))*np.exp(-t*12)+.47*low*np.exp(-t*27)
  x+=.19*click(t,.17,.055,250)+.21*click(t,.26,.045,320)
 elif name=='water':
  for j in range(7):
   at=.035+j*.105
   q=np.maximum(0,t-at);gate=(t>=at)
   x+=gate*(.55-j*.045)*np.sin(2*np.pi*((280+j*63)*q+210*q*q))*np.exp(-q*25)
  x+=.30*low*env
 elif name=='fire':
  gate=(np.sin(2*np.pi*(34*t+7*t*t))**9)
  x=.7*crack*env+.22*low*np.exp(-t*2.6)+.55*high*gate*np.exp(-t*4)
 elif name=='earth':
  x=.9*tone(t,61+95*np.exp(-t*23))*np.exp(-t*8)+.40*low*env+.28*crack*np.exp(-t*12)
  x+=.22*click(t,.23,.10,79)
 elif name=='electric':
  gate=(np.sin(2*np.pi*(28*t+35*t*t))>0).astype(float)
  x=.45*high*gate*env+.35*tone(t,440+310*np.sin(2*np.pi*17*t))*gate*env
  for at in [.065,.16,.25,.33]:x+=.32*click(t,at,.024,990)
 elif name=='wind':
  x=.83*noisy(t,rng,160,3500)*(.45+.55*np.sin(np.pi*t/length))
  x+=.29*tone(t,95+300*(t/length)**2)*env
 elif name=='ice':
  for j,f in enumerate([733,1108,1672,2428,3151]):
   x+=(0.42-j*.04)*tone(t,f)*np.exp(-t*(4+j*1.8))
  x+=.42*high*np.exp(-t*29)
 elif name=='light':
  x=.46*tone(t,480+850*(t/length))*.65
  x+=.35*tone(t,740+970*(t/length)**1.2)*env
  x+=.21*tone(t,1350)*np.exp(-t*6)+.17*high*np.exp(-t*24)
 elif name=='shadow':
  x=.62*tone(t,71+14*np.sin(2*np.pi*2.6*t))*env+.34*low*np.sin(np.pi*t/length)
  x+=.13*tone(t,156)*np.exp(-t*1.7)
 elif name=='time':
  for at,f in [(0,520),(.23,580),(.48,438),(.72,680)]:
   x+=.35*click(t,at,.11,f)
  x+=.22*tone(t,650-330*t/length)*env
 elif name=='space':
  x=.53*tone(t,200+850*np.sin(np.pi*t/length)**2)*env
  x+=.28*tone(t,290+55*np.sin(2*np.pi*21*t))*env
  x+=.18*high*np.exp(-t*4)
 elif name=='mind':
  for f,offset in [(337,0),(466,.09),(641,.19)]:
   q=np.maximum(0,t-offset);x+=(t>=offset)*.32*tone(t,f+68*np.sin(q*7))*np.exp(-q*4)
  x+=.12*high*np.exp(-t*16)
 elif name=='sound':
  x=.78*tone(t,186+380*np.exp(-t*5))*np.exp(-t*5)
  x+=.26*tone(t,720)*(1+.5*np.sin(2*np.pi*16*t))*env
  x+=.26*high*np.exp(-t*24)
 elif name=='absurd':
  freq=170+380*np.exp(-t*6)+60*np.sin(2*np.pi*(5*t+8*t*t))
  x=.60*tone(t,freq)*env+.28*tone(t,freq*.50)*env
  x+=.17*noisy(t,rng,110,2400)*np.exp(-t*9)
  x+=.20*click(t,.32,.07,640)
 fade=np.minimum(1,np.minimum(t/.008,(length-t)/.09))
 x=np.tanh(x*1.15)*np.maximum(0,fade)
 peak=np.max(np.abs(x))
 assert np.isfinite(x).all() and peak>.02,(name,peak)
 x=x/max(peak,1e-6)*.77
 return (x*32767).astype('<i2')
for name in NAMES:
 dest=OUT/f'r121_{name}.ogg'
 audio=synth(name)
 with tempfile.TemporaryDirectory(prefix='r121-original-') as tmp:
  path=Path(tmp)/'source.wav'
  with wave.open(str(path),'wb') as w:
   w.setnchannels(1);w.setsampwidth(2);w.setframerate(FS);w.writeframes(audio.tobytes())
  subprocess.run(['ffmpeg','-nostdin','-y','-hide_banner','-loglevel','error','-i',str(path),
    '-ac','1','-ar','48000','-c:a','libopus','-b:a','44k',str(dest)],check=True)
 assert dest.stat().st_size>1000,dest
 META[name]={'file':dest.name,'sha256':sha256(dest.read_bytes()).hexdigest(),
  'bytes':dest.stat().st_size,'seconds':round(len(audio)/FS,3),
  'origin':'synthesized-from-source-no-external-samples'}
(OUT/'r121-element-foley-manifest.json').write_text(json.dumps({
 'version':'R121','license':'project-original','sampleRate':FS,
 'authoring':'deterministic numpy additive, filtered-noise, impulse, and chirp synthesis',
 'elements':META},ensure_ascii=False,indent=2)+'\n')
print('R121_ORIGINAL_ELEMENT_FOLEY_PASS',len(META),sum(d['bytes'] for d in META.values()))
