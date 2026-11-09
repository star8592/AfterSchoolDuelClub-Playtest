from pathlib import Path
import numpy as np,json
from PIL import Image,ImageDraw,ImageFont
r=Path('/home/master/projects/after-school-duel-r36-hybrid-20261109/r36-hybrid-3d')
ev=r/'evidence'
p=ev/'lod-evaluation.json'
data=json.loads(p.read_text())
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
for section in ('face','body'):
 sources=[Image.open(ev/f'R36_{section}_{name}.png').convert('RGB') for name in ('original','medium','game')]
 ref=np.asarray(sources[0],dtype=np.int16)
 differences={}
 for name,im in zip(('medium','game'),sources[1:]):
  arr=np.asarray(im,dtype=np.int16)
  diff=np.abs(ref-arr)
  differences[name]={'mean_RGB_absolute_diff_0_255':round(float(diff.mean()),3),
                     'pixel_any_channel_gt25_pct':round(float((diff.max(axis=2)>25).mean()*100),2)}
 canvas=Image.new('RGB',(1200,720),(20,18,26))
 d=ImageDraw.Draw(canvas)
 for i,(name,img) in enumerate(zip(('original','medium','game'),sources)):
  x=i*400
  panel=img.resize((400,576))
  canvas.paste(panel,(x,60))
  label={'original':'934,492 faces · 原始','medium':'242,967 faces · 中档','game':'121,483 faces · 低档'}[name]
  d.text((x+8,22),label,font=font,fill=(243,208,163))
  d.text((x+14,660),f'差异: {differences.get(name,{}).get("mean_RGB_absolute_diff_0_255","基准")}',font=font,fill=(214,193,193))
 path=ev/f'R36_{section}_LOD_3up.jpg'
 canvas.save(path,quality=90,optimize=True)
 data.setdefault('render_comparison',{})[section]=differences
 print(section,path.stat().st_size, path)
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('R36_LOD_METRICS',json.dumps(data['render_comparison'],ensure_ascii=False))
