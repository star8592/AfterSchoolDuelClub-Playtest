#!/usr/bin/env python3
"""Produce independent synthetic Foley in NumPy; never fetch or sample copyrighted audio."""
from pathlib import Path
import numpy as np, wave, subprocess, hashlib, json
SR=24000
OUT=Path(__file__).resolve().parents[1]/'assets/audio'
rng=np.random.default_rng(81)
def env(t,total,attack=.008):
 return np.minimum(1,t/max(attack,1e-5))*np.exp(-t/(total*.32))
def noise(n):
 a=rng.normal(0,.5,n)
 return np.convolve(a,np.ones(9)/9,mode='same')
def create(name,duration,kind):
 n=int(SR*duration);t=np.arange(n)/SR;e=env(t,duration)
 if kind=='card':
  a=.35*noise(n)*np.exp(-t*13)+.24*np.sin(2*np.pi*(460*t+180*t*t))*np.exp(-t*16)
 elif kind=='charge':
  phase=2*np.pi*(220*t+280*t*t)
  a=.26*(np.sin(phase)+.30*np.sin(phase*2.03))*e*(.6+.4*np.sin(t*21)**2)
 elif kind=='meteor':
  phase=2*np.pi*(110*t-30*t*t)
  impact=np.exp(-((t-.54)/.10)**2)
  a=.48*np.sin(phase)*e+.40*noise(n)*impact+.25*np.sin(2*np.pi*50*t)*impact
 elif kind=='sonic':
  a=.33*np.sin(2*np.pi*(110*t+180*t*t))*e+.18*np.sin(2*np.pi*205*t)*np.exp(-t*4)
 elif kind=='ice':
  a=.12*noise(n)*np.exp(-t*5)
  for f in [860,1285,1941,2550,3200]:
   a+=.13*np.sin(2*np.pi*f*t)*np.exp(-t*(6+f/1600))
 elif kind=='cheer':
  a=.06*noise(n)*np.minimum(1,t*10)*np.exp(-t/1.25)
  for off in np.arange(.04,1.8,.095):
   idx=np.maximum(0,t-off);a+=.22*np.sin(2*np.pi*(165-115*idx)*idx)*np.exp(-idx*29)*(t>=off)
 elif kind=='score':
  a=(np.sin(2*np.pi*523.25*t)+.6*np.sin(2*np.pi*659.25*t)+.5*np.sin(2*np.pi*783.99*t))*.10*e
 elif kind=='shield':
  a=(.24*np.sin(2*np.pi*(470*t+125*t*t))+.10*np.sin(2*np.pi*980*t))*e
 else: raise ValueError(kind)
 a=np.tanh(a*1.38)
 a=a/(max(abs(a).max(),.01))*0.77
 wav=OUT/(name+'.wav');ogg=OUT/(name+'.ogg')
 with wave.open(str(wav),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR)
  f.writeframes((a*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-c:a','libopus','-b:a','56k',str(ogg)],check=True)
 wav.unlink()
 return dict(file=ogg.name,sha256=hashlib.sha256(ogg.read_bytes()).hexdigest(),bytes=ogg.stat().st_size)
entries={}
for name,duration,kind in [('card_flip',.3,'card'),('spell_charge',.78,'charge'),
 ('meteor_impact',1.35,'meteor'),('sonic_wave',1.25,'sonic'),
 ('ice_shatter',.72,'ice'),('stadium_cheer',1.8,'cheer'),
 ('score_chime',.58,'score'),('shield_block',.58,'shield')]:
 entries[name]=create(name,duration,kind)
(OUT/'r81-audio-provenance.json').write_text(json.dumps(dict(source='original numpy synthesis',
 algorithm='bounded deterministic t=sample/SR; fixed seed=81',assets=entries),indent=2)+'\n')
print('SFX_GENERATED',len(entries),sum(x['bytes'] for x in entries.values()))
