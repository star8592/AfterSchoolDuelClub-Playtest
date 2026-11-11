#!/usr/bin/env python3
"""R70 original playful arena music & Foley. No stock melodies, no copied samples.
Only numpy + stdlib for DSP; ffmpeg encodes 48 kHz mono/stereo Opus/Ogg.
"""
from pathlib import Path
import math,wave,subprocess
import numpy as np
SAMPLE_RATE=48000
ROOT=Path(__file__).resolve().parents[1]/'assets/audio'
ROOT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(11070)
BPM=112
BEAT=60/BPM

def envelope(t,duration,attack=.005,decay=.20):
    return np.clip(t/max(attack,.001),0,1)*np.exp(-t/max(decay,.001)) * np.clip((duration-t)/.09,0,1)

def note(midi,duration,style='mallet',velocity=.65):
    n=max(1,int(SAMPLE_RATE*duration));t=np.arange(n,dtype=np.float64)/SAMPLE_RATE
    freq=440*2**((midi-69)/12)
    if style=='mallet':
        e=envelope(t,duration,.001,.34);s=(np.sin(2*np.pi*freq*t)+.3*np.sin(2*np.pi*2.01*freq*t)+.13*np.sin(2*np.pi*3.02*freq*t))*e
    elif style=='piano':
        e=envelope(t,duration,.002,.50);s=(np.sin(2*np.pi*freq*t)+.25*np.sin(2*np.pi*2*freq*t)+.075*np.sin(2*np.pi*4*freq*t))*e
    elif style=='bass':
        e=envelope(t,duration,.005,.40);s=(np.sin(2*np.pi*freq*t)+.27*np.sin(2*np.pi*2*freq*t))*e
    elif style=='string':
        e=np.clip(t/.07,0,1)*np.clip((duration-t)/.20,0,1)
        s=(np.sin(2*np.pi*freq*t+.1*np.sin(2*np.pi*5.4*t))+.20*np.sin(2*np.pi*2*freq*t))*e
    elif style=='bell':
        e=envelope(t,duration,.001,.60);s=(np.sin(2*np.pi*freq*t)+.34*np.sin(2*np.pi*2.67*freq*t)+.20*np.sin(2*np.pi*4.15*freq*t))*e
    else: raise ValueError(style)
    return (velocity*s).astype(np.float32)

def place(buf,notes,midi,time,duration,style,vol=.5):
    wave=note(midi,duration,style,vol);start=int(time*SAMPLE_RATE)
    if start<0:return
    end=min(len(buf),start+len(wave))
    if start<end:buf[start:end]+=wave[:end-start]

def stereo_wide(left,right):
    # tiny stereo delay decorrelates stems without fake stereo phase inversion
    arr=np.stack([left,right],axis=1)
    peak=max(1.,float(np.max(np.abs(arr)))/.86)
    return (arr/peak).astype(np.float32)

def encode(path,data):
    raw=path.with_suffix('.wav')
    with wave.open(str(raw),'wb') as f:
        f.setnchannels(data.shape[1] if data.ndim==2 else 1);f.setsampwidth(2);f.setframerate(SAMPLE_RATE)
        f.writeframes((np.clip(data,-1,1)*32767).astype('<i2').tobytes())
    out=path.with_suffix('.ogg')
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(raw),'-c:a','libopus','-b:a','80k',str(out)],check=True)
    raw.unlink();print(out.name,out.stat().st_size)

# Fully original note material: schoolyard/comedy jazz, with short repeating hook.
# 16 bars, G major/E minor and variations, deliberately low enough for speech.
def make_song(variant=False):
    bars=16;duration=bars*4*BEAT;n=int(duration*SAMPLE_RATE)
    lead=np.zeros(n,np.float32);harmony=np.zeros(n,np.float32);bass=np.zeros(n,np.float32);drums=np.zeros(n,np.float32)
    chords=[(55,[67,71,74]),(52,[64,67,71]),(48,[64,67,72]),(50,[62,66,69]),
            (55,[67,71,74]),(52,[64,67,71]),(48,[64,67,72]),(50,[62,66,69]),
            (57,[69,72,76]),(54,[66,69,74]),(55,[67,71,74]),(50,[62,66,69]),
            (48,[64,67,72]),(50,[62,66,69]),(55,[67,71,74]),(55,[67,71,74])]
    # Melodies are purpose-written, not excerpts of any song.
    phrases=[
     [(0,79,.7),(.75,76,.44),(1.5,74,.48),(2.25,71,.63),(3.15,74,.55)],
     [(0,76,.75),(1,74,.50),(1.65,71,.35),(2.4,74,.51),(3.2,79,.46)],
     [(0,81,.65),(.75,79,.44),(1.5,76,.52),(2.25,74,.43),(3,72,.55)],
     [(0,78,.68),(.85,76,.38),(1.5,74,.46),(2.4,69,.48),(3.2,74,.48)]
    ]
    for bar,(root,triad) in enumerate(chords):
        t0=bar*4*BEAT
        for beat,(pitch,octv) in enumerate(zip(triad,[0,0,0])):
            place(harmony,[],pitch-12,t0+BEAT*beat*1.3,BEAT*2.1,'string',.045 if not variant else .065)
        for beat in [0,1.5,2,3.5]:
            place(bass,[],root-12,t0+beat*BEAT,.62*BEAT,'bass',.15)
        for k,(offs,midi,l) in enumerate(phrases[bar%4]):
            midi+= (2 if variant and bar%4==3 else 0)
            place(lead,[],midi,t0+offs*BEAT,l*BEAT,'mallet' if not variant else 'piano',.11 if not variant else .14)
        for i in range(8):
            t=t0+i*.5*BEAT;start=int(t*SAMPLE_RATE);length=int(.085*SAMPLE_RATE)
            h=rng.standard_normal(length).astype(np.float32)
            h=np.convolve(h,np.array([.13,.16,.21,.16,.13],dtype=np.float32),'same')
            # whispery hi-hat, not harsh white noise
            drums[start:start+length]+=.008*h
        for i in (0,2):
            t=t0+i*BEAT;start=int(t*SAMPLE_RATE);length=int(.18*SAMPLE_RATE)
            tt=np.arange(length)/SAMPLE_RATE
            kick=.040*np.sin(2*np.pi*(85-38*tt/.18)*tt)*np.exp(-28*tt)
            drums[start:start+length]+=kick.astype(np.float32)
        for i in (1,3):
            t=t0+i*BEAT;start=int(t*SAMPLE_RATE);length=int(.12*SAMPLE_RATE)
            noise=rng.standard_normal(length).astype(np.float32)*np.exp(-30*np.arange(length)/SAMPLE_RATE)
            drums[start:start+length]+=.016*noise
    l=lead*.85+harmony*.79+bass*.92+drums
    r=np.roll(lead,19)*.8+harmony*.95+bass*.89+np.roll(drums,6)
    # render an exact loop; chord in last bar intentionally returns to tonic.
    out=stereo_wide(l,r)*.9
    encode(ROOT/('duel_tension' if variant else 'school_duel_theme'),out)

make_song(False)
make_song(True)

# Original foley sounds; each tone sculpted rather than ripped from games.
def sfx(name,frequencies,duration,noise=0.,pulse=0.,gain=.5):
    n=int(SAMPLE_RATE*duration);t=np.arange(n)/SAMPLE_RATE
    sound=np.zeros(n,dtype=np.float64)
    for i,(f0,f1,amp) in enumerate(frequencies):
        phase=2*np.pi*(f0*t+(f1-f0)*t*t/(2*duration))
        sound+=amp*np.sin(phase)*(1+.05*np.sin(2*np.pi*5*t))
    if noise:
        raw=rng.normal(0,1,n);raw=np.convolve(raw,[.13,.23,.28,.23,.13],'same')
        sound+=raw*noise
    if pulse:sound*=np.sin(2*np.pi*pulse*t)*.5+.5
    sound*=envelope(t,duration,.003,max(.035,duration*.32))
    encode(ROOT/name,(sound/max(.01,np.max(np.abs(sound)))*gain).astype(np.float32))
sfx('select',[(620,820,.55),(850,1120,.3)],.13,gain=.22)
sfx('cast',[(310,690,.65),(630,960,.24)],.33,noise=.04,gain=.40)
sfx('enemy_cast',[(530,260,.55),(660,310,.28)],.28,noise=.09,gain=.34)
sfx('turn',[(540,480,.6),(780,840,.22)],.21,gain=.25)
sfx('attack',[(155,88,.65),(260,130,.28)],.29,noise=.15,gain=.45)
sfx('hit',[(155,66,.65),(490,290,.22)],.28,noise=.25,gain=.43)
sfx('heal',[(540,980,.5),(810,1320,.30)],.53,gain=.28)
sfx('win',[(392,392,.3),(494,494,.25),(587,587,.2),(784,784,.17)],1.1,gain=.35)
sfx('lose',[(420,330,.6),(310,240,.3)],.75,gain=.32)
