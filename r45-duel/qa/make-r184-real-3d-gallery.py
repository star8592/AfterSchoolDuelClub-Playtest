"""Only composites actual Blender Eevee PNG + real Chrome WebGL screenshots.
No synthetic concept imagery. Gives user an auditable visible six-prop gallery.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'art/hero-props/qa'
OUT=ROOT/'qa/evidence/r184-sculpted-props'
ITEMS=[
 ('E05','超速呐喊','E05_Giant_Cheer_Megaphone'),
 ('G05','课桌自动修理','G05_Repairing_Animated_School_Desk'),
 ('T06','放学广播串台','T06_Broken_School_Announcement_System'),
 ('K03','玉米炒葡萄','K03_Corn_Grape_Cafeteria_Dance'),
 ('K04','辣椒月饼','K04_Chili_Mooncake_Catastrophe'),
 ('Q02','折纸返校神兽','Q02_Origami_Beast_From_School_Notice'),
 ('S01','逆转迟到闹钟','S01_Reversed_Forged_School_Alarm'),
 ('S06','橡皮筋弹飞老师帽','S06_Quantum_Rubber_Band_Teacher_Hat'),
 ('P07','黑天鹅溜冰','P07_Black_Swan_Ice_Rink'),
 ('X02','校服穿墙','X02_School_Uniform_Passing_Wall')]
fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font=ImageFont.truetype(fontpath,37)
small=ImageFont.truetype(fontpath,23)
def tile(output,kind,size):
 cols=5 if kind=='blender' else 2;rows=2 if cols==5 else 5
 tw,th=size
 c=Image.new('RGB',(tw*cols,th*rows+72),'#f7f8fa')
 d=ImageDraw.Draw(c)
 d.rectangle((0,0,tw*cols,70),fill='#ffffff')
 d.text((28,10),
  ('R184 十件真实 Blender 3D 雕塑 · 未通过最终美术验收'
   if kind=='blender' else
   'R184 十件道具真实浏览器体育馆画面 · QA-only'),
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
a=OUT/'r184-ten-actual-blender-models-gallery.png'
b=OUT/'r184-ten-actual-gameplay-gallery.png'
print('R184_ACTUAL_GALLERY',a, tile(a,'blender',(375,385)))
print('R184_ACTUAL_GAME_GALLERY',b,tile(b,'game',(675,435)))
