from PIL import Image
from pathlib import Path
root=Path(__file__).parent.parent/'assets/card-model-portraits'
for name in ('E02','T02'):
 path=root/(name+'.png')
 src=Image.open(path).convert('RGBA')
 a=src.getchannel('A')
 bbox=a.getbbox()
 if not bbox:raise RuntimeError('3D export is empty '+name)
 minx,miny,maxx,maxy=bbox
 dx=maxx-minx;dy=maxy-miny
 pad=int(max(dx,dy)*.035)
 crop=src.crop((max(0,minx-pad),max(0,miny-pad),min(src.width,maxx+pad),min(src.height,maxy+pad)))
 scale=min(448/crop.width,448/crop.height)
 wh=(round(crop.width*scale),round(crop.height*scale))
 resized=crop.resize(wh,Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(512,512),(0,0,0,0))
 out.alpha_composite(resized,((512-wh[0])//2,(512-wh[1])//2))
 out.save(path,optimize=True)
 print('R23_CARD_PORTRAIT',name,'sourcebbox',bbox,'output',wh,'bytes',path.stat().st_size)
