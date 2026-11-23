"""Deterministic original woven fabric PBR colors for Jay R225 QA wardrobe.
Only uses locally generated pixel patterns; no third-party copyrighted texture.
"""
from PIL import Image
from pathlib import Path
import random
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'assets'
OUT.mkdir(parents=True,exist_ok=True)
PALETTES={
 'navy':(29,48,83),
 'ivory':(226,218,199),
 'burgundy':(158,50,65),
 'leather':(55,39,45)
}
random.seed(225120)
for name,color in PALETTES.items():
 im=Image.new('RGB',(256,256))
 pix=im.load()
 for y in range(256):
  for x in range(256):
   weave=(4 if x%3==0 else -2)+(4 if y%3==0 else -1)
   noise=random.randint(-2,2)
   pix[x,y]=tuple(max(0,min(255,c+weave+noise)) for c in color)
 path=OUT/('jay-r225-'+name+'-weave.png')
 im.save(path,optimize=True)
 print('R225_ORIGINAL_WOVEN_FABRIC',path.name,path.stat().st_size)
