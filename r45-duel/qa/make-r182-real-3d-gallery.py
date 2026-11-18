"""Only composites actual Blender Eevee PNG + real Chrome WebGL screenshots.
No synthetic concept imagery. Gives user an auditable visible six-prop gallery.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'art/hero-props/qa'
OUT=ROOT/'qa/evidence/r182-sculpted-props'
ITEMS=[
 ('K06','火山辣椒奶茶','K06_Volcano_Chili_Boba_Tea'),
 ('Q05','粉笔记者会','Q05_Chalk_Press_Conference'),
 ('P04','体育巨型口哨','P04_Mega_Sports_Whistle'),
 ('S04','错题发电机','S04_Wrong_Answer_Generator'),
 ('P05','排球误入篮球筐','P05_Volleyball_Basketball_Hoop'),
 ('X05','作业本银河','X05_Homework_Paper_Galaxy')]
fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font=ImageFont.truetype(fontpath,37)
small=ImageFont.truetype(fontpath,23)
def tile(output,kind,size):
 cols=3 if kind=='blender' else 2;rows=2 if cols==3 else 3
 tw,th=size
 c=Image.new('RGB',(tw*cols,th*rows+72),'#f7f8fa')
 d=ImageDraw.Draw(c)
 d.rectangle((0,0,tw*cols,70),fill='#ffffff')
 d.text((28,10),
  ('R182 六件真实 Blender 3D 雕塑 · 未通过最终美术验收'
   if kind=='blender' else
   'R182 六件道具真实浏览器体育馆画面 · QA-only'),
  font=font,fill='#172534')
 for i,(id,name,stem) in enumerate(ITEMS):
  path=(SRC/(stem+'.png') if kind=='blender' else OUT/id/(id+'-in-stadium.png'))
  im=Image.open(path).convert('RGB')
  source=im.copy()
  if kind=='blender':
   # Keep natural full sculpt composition, do NOT add imagined props.
   im.thumbnail((tw-16,th-58))
  else: im.thumbnail((tw-12,th-50))
  ox=i%cols*tw;oy=i//cols*th+72
  d.rectangle((ox+5,oy+6,ox+tw-5,oy+th-5),fill='#ffffff')
  x=ox+(tw-im.width)//2
  y=oy+41+(th-52-im.height)//2
  c.paste(im,(x,y))
  d.text((ox+18,oy+7),id+'  '+name,font=small,fill='#1d2733')
  d.text((ox+18,oy+th-29),
   '真实 Blender Eevee 渲染' if kind=='blender' else '真实 Chrome WebGL 施法截图',
   font=small,fill='#515d6c')
 c.save(output,optimize=True)
 return output.stat().st_size
a=OUT/'r182-six-actual-blender-models-gallery.png'
b=OUT/'r182-six-actual-gameplay-gallery.png'
print('R182_ACTUAL_GALLERY',a, tile(a,'blender',(510,475)))
print('R182_ACTUAL_GAME_GALLERY',b,tile(b,'game',(760,495)))
