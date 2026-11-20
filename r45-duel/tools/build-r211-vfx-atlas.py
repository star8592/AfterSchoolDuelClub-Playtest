#!/usr/bin/env python3
"""Reproducible original R211 4x4 alpha flipbooks: articulated flame and fountain splash.
All sprites baked offline; zero runtime AI/API usage."""
from pathlib import Path
import numpy as np
from PIL import Image
D=Path(__file__).resolve().parents[1]/'assets'/'vfx'
D.mkdir(parents=True,exist_ok=True)
N=224
X,Y=np.meshgrid(np.linspace(-1,1,N,dtype=np.float32),np.linspace(1,-1,N,dtype=np.float32))
clip=lambda a:np.clip(a,0,1)
def smooth(a,b,x):
 q=clip((x-a)/(b-a))
 return q*q*(3-2*q)
def blob(cx,cy,sx,sy):
 return np.exp(-2.5*((X-cx)**2/sx**2+(Y-cy)**2/sy**2))
def fire(t):
 # Vertical flame rooted at bottom and curling into a slender pointed tip.
 h=(Y+1)*.5
 center=.09*np.sin(h*8+t*6.283)*h+.05*np.sin(h*14-t*11)*h
 width=.40*(1-h)**.88+.028
 v=(X-center)/width
 edge=np.abs(v)+.15*np.sin(X*16+Y*8+t*6.283)+.09*np.sin(X*27-Y*24-t*9)
 body=(1-smooth(.68,1.16,edge))*smooth(.01,.10,h)*(1-smooth(.80,.999,h))
 plume=np.zeros_like(body)
 for j in range(3):
  offset=(j-1)*.28
  cx=offset*(1-.45*h)+.15*np.sin(9*h+j*2+t*6.283)*h
  w=(.18-.10*h)*(1-.65*h)+.017
  q=np.abs((X-cx)/w)+.14*np.sin(X*21+Y*14+j+t*5)
  tongue=(1-smooth(.67,1.10,q))*smooth(.01,.14,h)*(1-smooth(.61+j*.09,.93,h))
  plume=np.maximum(plume,tongue*(.85 if j==1 else .68))
 alpha=clip(np.maximum(body,plume))
 # Cut the outer zero-alpha rows and columns; no rectangular glow mask.
 alpha*=1-smooth(.83,.99,h)
 # Warm edge; compact yellow-white inner combustion, not a magenta rectangle.
 core=np.exp(-3.8*v*v)*body
 gold=clip(core*.95+plume*.38)
 R=np.full_like(alpha,255)
 G=64+173*gold+40*body
 B=6+64*gold+4*body
 A=clip(alpha*.82+core*.13)*219
 return np.stack([R,np.clip(G,0,255),np.clip(B,0,255),A],axis=-1).astype('uint8')
def water(t):
 # A compact, upward fountain: two curved sheets, separated small splashes.
 peak=.64+.12*np.sin(t*6.283)
 mask=np.zeros_like(X);highlight=np.zeros_like(X)
 for side in (-1,1):
  for arm in (0,1):
   extent=.72-.16*arm
   q=clip(side*(X+.02*np.sin(t*6.283+arm)) / extent)
   arch=-.59+peak*np.sqrt(q)*(.88+.12*arm)-.31*q*q
   rib=np.exp(-((Y-arch)/(.038+.027*q))**2)
   taper=smooth(.04,.18,q)*(1-smooth(.82,1,q))
   widthguard=smooth(0,.06,side*X)*(1-smooth(extent*.90,extent*1.05,side*X))
   m=rib*taper*widthguard
   mask=np.maximum(mask,m*(.56 if arm else .85))
   highlight=np.maximum(highlight,m*(.31 if arm else .65))
 foam=blob(0,-.65,.55,.12)*.48
 mask=clip(mask+foam)
 for j in range(16):
  ang=j*2.399963+.15*t
  rad=(.16+.051*(j%8))*(.84+.16*np.sin(t*6.283+j))
  cx=np.cos(ang)*rad+.07*np.sin(t*6.283+j)
  cy=-.33+np.sin(ang)*rad*.74+.19*np.sin(t*6.283+j*.8)
  droplet=blob(cx,cy,.035+.014*(j%3),.047+.019*(j%2))
  mask=np.maximum(mask,droplet*.82)
  highlight=np.maximum(highlight,droplet*.95)
 mask=clip(mask);highlight=clip(highlight)
 # Cyan/azure transparent liquid, white highlights only at tiny droplet cores.
 R=22+91*highlight+30*mask
 G=126+101*highlight+42*mask
 B=np.full_like(mask,255)
 A=clip(mask*.86+highlight*.21)*226
 return np.stack([np.clip(R,0,255),np.clip(G,0,255),B,A],axis=-1).astype('uint8')
for name,fn in (('fire',fire),('water',water)):
 out=Image.new('RGBA',(N*4,N*4))
 for i in range(16):
  frame=Image.fromarray(fn(i/16),'RGBA')
  out.paste(frame,((i%4)*N,(i//4)*N))
 p=D/f'r211-{name}-flipbook.webp'
 out.save(p,'WEBP',quality=87,method=6)
 a=np.asarray(out)
 print(name,p.stat().st_size,'size',out.size,
       'alpha coverage',round(float((a[:,:,3]>10).mean()),3),
       'edge left alpha',int(a[:,0,3].max()),'top',int(a[0,:,3].max()))

