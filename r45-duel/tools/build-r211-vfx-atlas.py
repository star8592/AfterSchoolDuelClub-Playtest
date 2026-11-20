#!/usr/bin/env python3
"""R211: reproducible offline-baked fire/water VFX flipbooks, no network."""
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'vfx';OUT.mkdir(parents=True,exist_ok=True)
N=224
U,V=np.meshgrid(np.linspace(-1,1,N,dtype=np.float32),np.linspace(1,-1,N,dtype=np.float32))
clamp=lambda x:np.clip(x,0,1)
def smooth(a,b,x):
 t=clamp((x-a)/(b-a));return t*t*(3-2*t)
def ball(x,y,cx,cy,rx,ry):
 return np.exp(-3*(((x-cx)/rx)**2+((y-cy)/ry)**2))
def fire(t):
 h=clamp((1-V)/2);width=.48*(1-h)**.88+.065
 sway=.16*np.sin(t*6.283+V*3.8)*h+.09*np.sin(V*8+t*4.7)*h
 q=(U-sway)/width
 noise=.18*np.sin(U*12+V*11+t*6.28)+.11*np.sin(U*23-V*17+t*9.8)
 body=smooth(1.30,.60,np.abs(q)+noise)*smooth(.98,.60,h+.075*np.sin(U*5+t*6.28))*smooth(0,.10,h)
 curls=np.zeros_like(body)
 for i in range(3):
  x0=(-.27+i*.27)*(.85-h)+.20*np.sin(t*6.283+i)*h
  y0=-.64+i*.18
  trail=np.exp(-((U-x0-.14*np.sin(V*5+i+t*5))/(.09+.05*i))**2*1.1)
  curls=np.maximum(curls,trail*smooth(y0-.34,y0,V)*(1-smooth(y0+.55,y0+.72,V))*.55)
 ember=np.zeros_like(body)
 for i in range(7):
  cx=.72*np.sin(i*2.29+t*6.283*.63);cy=-.34+(i%5)*.25+.05*np.sin(t*6.283+i)
  ember=np.maximum(ember,ball(U,V,cx,cy,.035,.05)*.63)
 d=clamp(body+.63*curls+ember);core=clamp(np.exp(-3*q*q)*body*1.25)
 R=np.full_like(d,255);G=62+188*core+110*body;B=14+172*core+18*body
 A=clamp((d*.88+core*.15)*smooth(1,.84,h))*230
 return np.stack([R,clamp(G),clamp(B),A],axis=-1).astype('uint8')
def water(t):
 splash=np.zeros_like(U);gleam=np.zeros_like(U);phase=np.sin(t*6.283)
 for i in range(5):
  spread=(.23+i*.17)*(-1 if i%2 else 1)
  y=-.54+(.92+.07*i)*(1-((U-spread*.45)/(1+i*.09))**2)
  bend=spread*(1+V*.38)+.06*phase
  line=np.exp(-((V-y+.16*np.sin(U*5+t*6.283+i))/.068)**2)
  ridge=line*smooth(.95,.42,np.abs(U-bend))
  splash=np.maximum(splash,ridge*.66);gleam=np.maximum(gleam,ridge*.32)
 for j in range(17):
  phi=j*2.39996+t*.25;rad=.22+.047*(j%8)+.03*phase
  cx=rad*np.cos(phi);cy=-.24+rad*np.sin(phi)*.93+.15*np.sin(t*6.283+j*.67)
  r=.045+.017*(j%3)
  drop=ball(U,V,cx,cy,r,r*(1+.45*(j%2)))
  splash=np.maximum(splash,drop*.77);gleam=np.maximum(gleam,drop*.8)
 foam=np.exp(-((V+.68)/.12)**2)*np.exp(-(U/.68)**4)*.40
 splash=clamp(splash+foam);gleam=clamp(gleam+foam*.8)
 R=25+126*gleam+51*splash;G=125+119*gleam+76*splash;B=np.full_like(U,255)
 A=clamp(splash*.73+gleam*.33)*223
 return np.stack([clamp(R),clamp(G),B,A],axis=-1).astype('uint8')
for name,fn in (('fire',fire),('water',water)):
 atlas=Image.new('RGBA',(N*4,N*4))
 for i in range(16):atlas.paste(Image.fromarray(fn(i/16),'RGBA'),((i%4)*N,(i//4)*N))
 target=OUT/('r211-'+name+'-flipbook.webp')
 atlas.save(target,'WEBP',quality=87,method=6)
 print(target,target.stat().st_size,'bytes',atlas.size)

