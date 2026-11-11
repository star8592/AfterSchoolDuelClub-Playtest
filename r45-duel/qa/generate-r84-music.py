#!/usr/bin/env python3
"""R84 original battle music cues — self-composed melodies, no sampled sources.

The melody events, harmonic changes, patches and percussion are authored here.
Generate five clearly different loopable themes in stereo Ogg/Opus.
"""
from __future__ import annotations
from pathlib import Path
import hashlib, json, math, subprocess, wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1]/'assets/audio'
FS=24000
BARS=16
rng=np.random.default_rng(84116)
def hz(midi):return 440.0*2**((midi-69)/12)
def synth(midi,duration,voice,vol):
    n=int(FS*duration);t=np.arange(n,dtype=np.float32)/FS;f=hz(midi)
    phase=2*np.pi*f*t
    release=np.minimum(1,np.maximum(0,(duration-t)/.065))
    if voice=='musicbox':
        e=np.minimum(1,t/.008)*np.exp(-3.7*t)
        out=np.sin(phase)+.28*np.sin(2.01*phase)+.17*np.sin(3.02*phase)
    elif voice=='marimba':
        e=np.minimum(1,t/.004)*np.exp(-7.0*t)
        out=np.sin(phase)+.45*np.sin(3.0*phase)+.18*np.sin(6.1*phase)
    elif voice=='brass':
        e=np.minimum(1,t/.05)*(1-np.minimum(1,t/duration)*.25)
        out=np.tanh(1.9*(np.sin(phase)+.36*np.sin(2*phase)+.22*np.sin(3*phase)))
    elif voice=='pluck':
        e=np.minimum(1,t/.004)*np.exp(-4.0*t)
        out=np.sin(phase+.37*np.sin(2.9*phase)*np.exp(-8*t))
    elif voice=='synth':
        e=np.minimum(1,t/.014)*(1-np.minimum(1,t/duration)*.48)
        out=.72*np.sin(phase+.33*np.sin(2.02*phase))+.23*np.sin(2.001*phase)
    elif voice=='piano':
        e=np.minimum(1,t/.005)*np.exp(-2.8*t)
        out=np.sin(phase)+.26*np.sin(2.01*phase)*np.exp(-3*t)
    elif voice=='strings':
        e=np.minimum(1,t/.18)*(1-np.minimum(1,t/duration)*.25)
        out=.75*np.sin(phase+.22*np.sin(phase*.003))+ .19*np.sin(2*phase)
    elif voice=='bass':
        e=np.minimum(1,t/.006)*np.exp(-1.5*t)
        out=np.tanh(1.4*(np.sin(phase)+.25*np.sin(2*phase)))
    elif voice=='flute':
        e=np.minimum(1,t/.09)*(1-np.minimum(1,t/duration)*.28)
        out=np.sin(phase+.0015*np.sin(2*np.pi*4.5*t)*phase)+.045*np.sin(2*phase)
    else:raise ValueError(voice)
    return (out*e*release*vol).astype(np.float32)
def add(buf,midi,at,beats,beat,voice,vol,pan=0):
    t=int(at*FS);seg=synth(midi,beats*beat,voice,vol)
    if t<0 or t>=len(buf):return
    n=min(len(seg),len(buf)-t)
    if n<=0:return
    # constant-power pan; preserve measured stereo output.
    x=np.cos((pan+1)*np.pi/4);y=np.sin((pan+1)*np.pi/4)
    buf[t:t+n,0]+=seg[:n]*x
    buf[t:t+n,1]+=seg[:n]*y
def drum(buf,at,kind,level=1):
    start=int(at*FS)
    if start>=len(buf):return
    n=min(int((.29 if kind=='kick' else .15)*FS),len(buf)-start)
    if n<=0:return
    t=np.arange(n,dtype=np.float32)/FS
    if kind=='kick':
        phase=2*np.pi*(124*t-75*t*t)
        x=np.sin(phase)*np.exp(-t*22)*.12*level
    elif kind=='snare':
        raw=rng.normal(0,.33,n).astype(np.float32)
        x=(raw*.11+.07*np.sin(2*np.pi*185*t))*np.exp(-t*38)*level
    elif kind=='shaker':
        raw=rng.normal(0,.30,n).astype(np.float32)
        x=(raw-np.convolve(raw,np.ones(14)/14,'same'))*.048*np.exp(-t*65)*level
    else:raise ValueError(kind)
    buf[start:start+n,0]+=x*.94;buf[start:start+n,1]+=x
def echo_stereo(arr):
    # Carefully limited two-tap ambience; no external samples.
    for off,amp in [(0.16,.09),(.28,.05)]:
        d=int(off*FS);arr[d:,0]+=arr[:-d,1]*amp;arr[d:,1]+=arr[:-d,0]*amp
    return arr
PROGS={
 'campus_parade':dict(name='校园开赛进行曲',bpm=136,lead='brass',chord='strings',
  roots=[55,50,52,48,55,50,48,50,55,52,48,50,55,48,50,55],
  qualities=['maj','maj','min','maj']*4,
  motif=[(0,79,.65),(.75,81,.5),(1.5,83,.65),(2.5,86,.55),(3.25,83,.6)],
  pulse='stadium',scale=[0,2,4,5,7,9,11],bass=0.17),
 'mischief_shuffle':dict(name='乌龙连携与恶作剧',bpm=112,lead='marimba',chord='piano',
  roots=[48,55,50,48,45,52,50,55,48,55,53,52,45,50,55,48],
  qualities=['min','maj','maj','min']*4,
  motif=[(0,72,.36),(.5,74,.34),(1,77,.45),(1.75,76,.28),(2.35,72,.4),(3.1,79,.42),(3.58,76,.32)],
  pulse='swing',scale=[0,2,3,5,7,8,10],bass=.14),
 'tactical_pulse':dict(name='紧张思考与布阵',bpm=94,lead='pluck',chord='synth',
  roots=[45,48,43,50,45,48,52,43,45,53,50,48,45,52,43,45],
  qualities=['min','maj','maj','maj']*4,
  motif=[(0,69,.5),(1.0,72,.45),(1.65,76,.4),(2.5,74,.5),(3.35,69,.35)],
  pulse='subtle',scale=[0,2,3,5,7,8,10],bass=.14),
 'heroic_comeback':dict(name='逆转反攻与翻盘',bpm=148,lead='synth',chord='strings',
  roots=[52,48,55,50,52,48,55,50,57,52,48,50,52,50,55,52],
  qualities=['min','maj','maj','maj']*4,
  motif=[(0,76,.70),(.65,79,.42),(1.12,83,.68),(2.0,81,.45),(2.7,79,.42),(3.25,88,.60)],
  pulse='drive',scale=[0,2,3,5,7,8,10],bass=.20),
 'final_overtime':dict(name='最终回合决胜',bpm=166,lead='brass',chord='synth',
  roots=[50,46,43,45,50,46,43,48,50,46,45,43,50,48,46,50],
  qualities=['min','maj','min','min']*4,
  motif=[(0,74,.30),(.4,77,.32),(.82,81,.5),(1.6,86,.38),(2.1,84,.30),(2.5,82,.4),(3.15,89,.7)],
  pulse='drive',scale=[0,2,3,5,7,8,10],bass=.22)
}
def compose(key,conf):
    beat=60/conf['bpm']
    seconds=BARS*4*beat
    n=round(seconds*FS)
    arr=np.zeros((n,2),dtype=np.float32)
    for bar,root in enumerate(conf['roots']):
        t0=bar*4*beat
        degree=[0,4,7] if conf['qualities'][bar]=='maj' else [0,3,7]
        voicing=[root+12+i for i in degree]
        # Distinct rhythmic harmonic textures
        if conf['pulse']=='swing':
            for i,k in enumerate([0,.8,1.65,2.5,3.35]):
                add(arr,voicing[i%3],t0+k*beat,1.05,beat,'piano',.045,pan=.1 if i%2 else -.25)
        elif conf['pulse']=='subtle':
            for i,k in enumerate([0,1,2.3,3.2]):
                add(arr,voicing[(i+bar)%3]+12,t0+k*beat,.65,beat,'musicbox',.032,pan=(i%2)*.3-.15)
        else:
            for i,p in enumerate(voicing):
                add(arr,p,t0,3.9,beat,conf['chord'],.040,pan=(i-1)*.4)
        # Second texture with different subdivision, the bass changes per bar.
        for k in ([0,1.5,2,3.5] if conf['pulse']=='swing' else [0,1,2,3]):
            add(arr,root-12,t0+k*beat,.67,beat,'bass',conf['bass'],pan=-.04)
        motif=conf['motif']
        for j,(off,pitch,dur) in enumerate(motif):
            transpose=(bar%4==3)*(-2)+(bar%8==6)*3
            add(arr,pitch+transpose,t0+off*beat,dur,beat,conf['lead'],
              .075 if conf['pulse']=='subtle' else .10,
              pan=(-.18 if j%2 else .2))
        if conf['pulse'] in ('stadium','drive'):
            for bt in range(4):
                drum(arr,t0+bt*beat,'kick',.85 if conf['pulse']=='stadium' else 1.0)
                drum(arr,t0+(bt+.5)*beat,'shaker',.75)
                if bt in (1,3):drum(arr,t0+bt*beat,'snare',.68)
        elif conf['pulse']=='swing':
            for bt in (0,2):drum(arr,t0+bt*beat,'kick',.55)
            for bt in (1,3):drum(arr,t0+bt*beat,'snare',.30)
            for off in np.arange(0,4,.5):drum(arr,t0+off*beat,'shaker',.35)
        else:
            for bt in (0,2):drum(arr,t0+bt*beat,'kick',.40)
            for bt in (1,3):drum(arr,t0+bt*beat,'shaker',.40)
    arr=echo_stereo(arr)
    # Explicit conservative dynamic range to leave room for character dialogue.
    peak=float(np.max(np.abs(arr)))
    gain=min(.88/max(.01,peak),1.0)
    arr*=gain
    arr=np.tanh(arr*.75)*.68
    wav=ROOT/(key+'.wav');ogg=ROOT/(key+'.ogg')
    with wave.open(str(wav),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(FS)
        f.writeframes((np.clip(arr,-1,1)*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),
      '-c:a','libopus','-b:a','96k',str(ogg)],check=True)
    wav.unlink()
    return dict(file=ogg.name,name=conf['name'],bpm=conf['bpm'],
      seconds=round(seconds,2),bytes=ogg.stat().st_size,
      sha256=hashlib.sha256(ogg.read_bytes()).hexdigest(),style=conf['pulse'])
if __name__=='__main__':
    report={k:compose(k,v) for k,v in PROGS.items()}
    (ROOT/'r84-music-provenance.json').write_text(json.dumps({
      'source':'original hand-authored programmatic composition (not a remix or stock recording)',
      'generator':'qa/generate-r84-music.py','sample_rate':FS,'songs':report
    },ensure_ascii=False,indent=2)+'\n')
    print('R84_ORIGINAL_MUSIC',json.dumps(report,ensure_ascii=False),flush=True)
