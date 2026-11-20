#!/usr/bin/env python3
"""R211 visual QA: prevent RGB [0,255] being incorrectly normalized to [0,1].
Checks translucent borders, 16 animated frames and believable tinted opacity."""
from pathlib import Path
from PIL import Image
import numpy as np,hashlib
root=Path(__file__).resolve().parents[1]
for element in ("fire","water"):
 path=root/"assets"/"vfx"/f"r211-{element}-flipbook.webp"
 im=Image.open(path).convert("RGBA");assert im.size==(896,896)
 frames=[];good=0
 for n in range(16):
  x=(n%4)*224;y=(n//4)*224
  p=np.asarray(im.crop((x,y,x+224,y+224)),dtype=np.uint8)
  frames.append(hashlib.sha256(p.tobytes()).hexdigest())
  opaque=p[:,:,3]>80
  assert np.count_nonzero(opaque)>100,("empty frame",element,n)
  assert max(p[0,:,3].max(),p[-1,:,3].max(),p[:,0,3].max(),p[:,-1,3].max())<16,("hard edge",element,n)
  r,g,b=[np.median(p[:,:,i][opaque]) for i in range(3)]
  if element=="fire":assert r>180 and g>80 and b>10,("red channel clipping regression",n,r,g,b)
  else:assert b>180 and g>90 and r>10,("water RGB clipping regression",n,r,g,b)
  good+=1
 assert len(set(frames))>=14,(element,"frames almost identical")
 assert path.stat().st_size<160000,(element,"atlas too large")
 print(element,good,"frames","bytes",path.stat().st_size,"tint and transparent edges PASS")
print("R211_TRUE_RGBA_FLIPBOOK_COLOR_ALPHA_16FRAMES_PASS")

