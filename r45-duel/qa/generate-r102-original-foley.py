#!/usr/bin/env python3
"""Produce copyright-clean, deterministic digital school-comedy Foley.

No audio from films, games, stock packs, voice clones or online recordings.
All waveforms, instruments, transitions and sample envelopes are synthesized
directly here, using only stdlib. Re-run to verify SHA256 and source provenance.
"""
from pathlib import Path
from math import sin,cos,pi,exp,floor
from random import Random
import wave,struct,hashlib,subprocess,json,tempfile
BASE=Path(__file__).resolve().parents[1]
OUT=BASE/'assets/audio'
R=24000
# name : duration, tonal motif, frequency, humorous modulation, noise amount
SCENES={
 'r102_school_bell':(1.15,'bell',620,.18,.015),
 'r102_chalk_swoosh':(.67,'swoosh',810,.7,.43),
 'r102_chalk_snap':(.49,'crack',174,.38,.60),
 'r102_paper_flap':(.70,'flutter',320,.55,.28),
 'r102_poster_unfurl':(.99,'unfurl',390,.31,.25),
 'r102_stamp_pop':(.47,'pop',410,.41,.30),
 'r102_radio_tune':(.86,'tune',470,.84,.09),
 'r102_radio_glitch':(.62,'glitch',265,1.5,.22),
 'r102_spring_boing':(.69,'boing',175,1.0,.03),
 'r102_comedy_whistle':(.80,'whistle',380,.65,.02),
 'r102_magic_tingle':(1.06,'spark',840,.33,.04),
 'r102_confetti_pop':(.82,'confetti',430,.74,.12),
 'r102_school_steps':(.48,'step',100,.48,.43),
 'r102_music_gliss':(.81,'gliss',420,.70,.015),
 'r102_erase_scribble':(.61,'scribble',780,1.0,.42),
 'r102_hearts_pulse':(.92,'heart',420,.27,.04),
 'r102_shield_chime':(1.21,'chime',530,.16,.02),
 'r102_crowd_gasp':(.76,'gasp',320,.50,.16),
 'r102_score_trumpet':(1.29,'trumpet',466,.17,.05),
 'r102_rubber_squeak':(.58,'squeak',930,.73,.08)
}
def synth(name,duration,mode,base,mod,noise):
 rng=Random(102021+sum((i+1)*ord(c) for i,c in enumerate(name)))
 n=int(duration*R);result=bytearray()
 for i in range(n):
  t=i/R;p=t/duration
  attack=min(1,t/.012)
  tail=(1-p)**(.8 if mode in {'gasp','unfurl'} else 1.8)
  env=attack*max(0,tail)
  vibr=.006*sin(2*pi*(7+mod*5)*t)
  f=base
  if mode in {'boing','pop','squeak','whistle'}:
   f=base*(1+(.7+mod)*exp(-7*t)*sin(2*pi*(4+mod*3)*t))
  elif mode in {'swoosh','gliss'}:
   f=base*(.52+1.7*p)
  elif mode in {'glitch','scribble','flutter','unfurl'}:
   f=base*(1+.22*sin(2*pi*(18+mod*20)*t))
  elif mode in {'bell','chime','tune','score','trumpet'}:
   f=base*(1+.035*sin(2*pi*3.2*t))
  if mode=='glitch':
   f*=1+.30*sin(2*pi*21*t)
  angle=2*pi*(f*t+vibr)
  harmonics=sin(angle)+.34*sin(angle*2.02)+.15*sin(angle*3.99)
  if mode in {'bell','chime','spark','confetti'}:
   harmonics=.57*sin(angle)+.28*sin(angle*2.64)+.24*sin(angle*4.23)
  if mode=='step':env=(1-p)**7
  if mode=='trumpet':
   harmonics=sin(angle)+.4*sin(angle*2)+.26*sin(angle*3)
  if mode in {'swoosh','scribble','paper','flutter','unfurl'}:
   env*=.58+.42*sin(pi*p)
  raw=(rng.random()*2-1)*noise*(.3+.7*sin(pi*p))
  tone=(.36*harmonics+raw)*env
  if mode in {'crack','pop','step'}:
   tone+= (rng.random()*2-1)*.41*exp(-t*28)
  if mode=='confetti':
   tone+=.09*sin(2*pi*(1130+200*sin(t*66))*t)*sin(pi*p)
  value=int(max(-1,min(1,tone*.77))*32767)
  result.extend(struct.pack('<h',value))
 return result
ledger={'release':'R102','copyright':'Original mathematical synthesizer in qa/generate-r102-original-foley.py; no third-party source samples','sample_rate':R,'sounds':[]}
for name,(length,mode,f,mod,noise) in SCENES.items():
 pcm=synth(name,length,mode,f,mod,noise)
 with tempfile.TemporaryDirectory(prefix='asdc-r102-') as td:
  wav=Path(td)/(name+'.wav')
  with wave.open(str(wav),'wb') as w:
   w.setnchannels(1);w.setsampwidth(2);w.setframerate(R);w.writeframes(pcm)
  dst=OUT/(name+'.ogg')
  subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error',
   '-i',str(wav),'-ac','1','-ar','24000','-c:a','libopus','-b:a','34k',str(dst)],
   check=True)
 sha=hashlib.sha256(dst.read_bytes()).hexdigest()
 ledger['sounds'].append({'file':dst.name,'duration_seconds':length,'sha256':sha,'bytes':dst.stat().st_size,
 'method':mode,'license':'Original project-generated sound effects; no external source audio'})
 print('R102_FOLEY_CREATED',name,dst.stat().st_size,sha[:10],flush=True)
(OUT/'r102-foley-provenance.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
print('R102_FOLEY_COMPLETE',len(ledger['sounds']),sum(x['bytes'] for x in ledger['sounds']))
