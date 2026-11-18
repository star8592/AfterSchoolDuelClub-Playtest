#!/usr/bin/env python3
"""R171 original deterministic school-prop foley (never speech/VO).
All sound effects are newly mathematically synthesized from noise,
tonal resonators and envelopes; no third-party samples.
"""
from pathlib import Path
import hashlib, json, subprocess, tempfile, wave, os
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/audio'
OUT.mkdir(parents=True,exist_ok=True)
SR=24000
FOLEY={
 'r171_eraser_thud':('.58','impact',96,0.55),
 'r171_chalk_dust':('.64','hiss',3000,0.36),
 'r171_wok_clang':('.71','clang',740,0.66),
 'r171_food_sizzle':('.82','sizzle',3700,0.33),
 'r171_milk_tea_bubble':('.74','bubble',230,0.45),
 'r171_press_camera':('.54','snap',980,0.50),
 'r171_whistle_rip':('.74','whistle',1950,0.40),
 'r171_ball_bounce':('.77','bounce',160,0.55),
 'r171_basket_rim':('.61','clang',1140,0.40),
 'r171_paper_whirl':('.86','paper',1650,0.35),
 'r171_clock_reverse':('.91','clock',520,0.34),
 'r171_stamp_thud':('.47','impact',162,0.48),
 'r171_pencil_scribble':('.76','paper',2800,0.27),
 'r171_foot_shuffle':('.73','paper',190,0.40),
}
meta={'provider':'Original-DSP-Foley','not_speech':True,
 'date':'2026-11-18','method':'Deterministic NumPy procedural synthesis, original; ffmpeg libopus',
 'clips':{}}
for n,(dur,mode,freq,gain) in FOLEY.items():
 dur=float(dur);N=int(SR*dur);t=np.arange(N,dtype=np.float64)/SR
 rng=np.random.default_rng(171*100+list(FOLEY).index(n))
 white=rng.normal(0,1,N)
 pink=np.cumsum(white);pink/=max(1,np.std(pink));pink=np.clip(pink,-3,3)
 if mode=='impact':
  sig=(np.sin(2*np.pi*(freq*t+80*t*t))+
   .32*np.sin(2*np.pi*(3*freq*t+40*t*t)))*np.exp(-t*11)
  sig+=white*.15*np.exp(-t*25)
 elif mode=='clang':
  sig=(np.sin(2*np.pi*freq*t)+.45*np.sin(2*np.pi*freq*1.83*t)
   +.24*np.sin(2*np.pi*freq*2.47*t))*np.exp(-t*5.7)
  sig+=white*.12*np.exp(-t*22)
 elif mode=='hiss':
  sig=(white*.35+pink*.13)*np.maximum(0,1-t/dur)**3
  sig*=np.minimum(1,t/.025)
 elif mode=='sizzle':
  envelope=np.maximum(0,1-t/dur)**1.2
  sig=(white*.23+np.sin(2*np.pi*freq*t)*.10)*envelope
  for pulse in (.10,.19,.31,.48,.61):
   sig+=white*.10*np.exp(-((t-pulse)/.021)**2)
 elif mode=='bubble':
  sig=np.zeros(N)
  for j,a in enumerate(np.arange(.07,dur-.05,.12)):
   mask=np.maximum(0,t-a)
   sig+=np.sin(2*np.pi*(freq*(1+j*.09)*mask-130*mask**2)) *     (t>=a)*np.exp(-mask*25)*.6
 elif mode=='snap':
  sig=(white*.4+np.sin(2*np.pi*freq*t)*.2)*np.exp(-t*48)
  sig+=np.sin(2*np.pi*freq*.6*t)*np.exp(-t*15)*.3
 elif mode=='whistle':
  warble=70*np.sin(2*np.pi*7*t)
  phase=2*np.pi*(freq*t+(warble/(2*np.pi*7))*t*.015)
  sig=(np.sin(phase)+.23*np.sin(phase*2)) *    np.sin(np.pi*np.clip(t/dur,0,1))**1.2
 elif mode=='bounce':
  sig=np.zeros(N)
  for j,a in enumerate([.04,.30,.49,.63]):
   mask=np.maximum(0,t-a)
   sig+=(np.sin(2*np.pi*freq*(1+j*.18)*mask)+.3*white) *     (t>=a)*np.exp(-mask*(23+j*7))*(.95-j*.18)
 elif mode=='paper':
  smooth=np.convolve(white,np.ones(17)/17,'same')
  env=(np.sin(2*np.pi*(2.2*t+.3*t*t))**2)*np.maximum(0,1-t/dur)
  sig=(.37*smooth+.08*white)*env
 elif mode=='clock':
  sig=np.zeros(N)
  for j,a in enumerate(np.arange(.06,dur,.15)):
   mask=np.maximum(0,t-a)
   sig+=(np.sin(2*np.pi*freq*(1+(j%3)*.06)*mask)+.2*white) *     (t>=a)*np.exp(-mask*48)*(.85+j*.02)
 else:raise ValueError(mode)
 sig=np.nan_to_num(sig)
 peak=np.max(np.abs(sig))
 sig=(sig/max(1e-5,peak))*float(gain)
 fade=np.minimum(1,np.minimum(t/.006,np.maximum(0,dur-t)/.022))
 sig*=fade
 with tempfile.NamedTemporaryFile(suffix='.wav',delete=False) as temp:
  wav=Path(temp.name)
 try:
  with wave.open(str(wav),'wb') as file:
   file.setnchannels(1);file.setsampwidth(2);file.setframerate(SR)
   file.writeframes((np.clip(sig,-1,1)*32767).astype('<i2').tobytes())
  dst=OUT/(n+'.ogg')
  subprocess.run(['ffmpeg','-nostdin','-y','-loglevel','error','-i',str(wav),
   '-c:a','libopus','-b:a','44k','-ar','48000',str(dst)],check=True)
 finally:wav.unlink(missing_ok=True)
 assert dst.stat().st_size>1600,n
 digest=hashlib.sha256(dst.read_bytes()).hexdigest()
 meta['clips'][n]={'file':dst.name,'duration_s':dur,'bytes':dst.stat().st_size,
  'sha256':digest,'audition':'pending-human-listening','peak':float(round(peak,3))}
 print('R171_FOLEY_CREATED',n,dst.stat().st_size,digest[:12],flush=True)
(OUT/'r171-original-foley-manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print('R171_ORIGINAL_FOLEY_BATCH',len(meta['clips']),sum(c['bytes'] for c in meta['clips'].values()),flush=True)
