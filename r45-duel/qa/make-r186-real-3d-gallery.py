"""Only composites actual Blender Eevee PNG + real Chrome WebGL screenshots.
No synthetic concept imagery. Gives user an auditable visible six-prop gallery.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'art/hero-props/qa'
OUT=ROOT/'qa/evidence/r186-sculpted-props'
ITEMS=[
 ('P01','狂风炸毛超人','P01_Gale_Hair_School_Hero'),
 ('P02','百年零进球','P02_Century_Without_Goal_Soccer'),
 ('P06','体育倒跑机','P06_Backwards_Run_Gym_Treadmill'),
 ('P08','运动会流星奖牌','P08_Sports_Medal_Meteor_Rain'),
 ('X01','倒退校钟','X01_Reversing_School_Clock_Tower'),
 ('X04','预言午休枕头','X04_Lunchtime_Prophecy_Pillow'),
 ('X06','早读复制器','X06_Morning_Reading_Duplicator'),
 ('X07','消失最后一课','X07_Vanishing_Last_Classroom_Lesson'),
 ('X08','时空门禁保安','X08_Campus_Gate_Time_Security_Guard')]
fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font=ImageFont.truetype(fontpath,37)
small=ImageFont.truetype(fontpath,23)
def tile(output,kind,size):
 cols=3 if kind=='blender' else 2;rows=3 if cols==3 else 5
 tw,th=size
 c=Image.new('RGB',(tw*cols,th*rows+72),'#f7f8fa')
 d=ImageDraw.Draw(c)
 d.rectangle((0,0,tw*cols,70),fill='#ffffff')
 d.text((28,10),
  ('R186 九件真实 Blender 3D 雕塑 · 未通过最终美术验收'
   if kind=='blender' else
   'R186 九件道具真实浏览器体育馆画面 · QA-only'),
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
a=OUT/'r186-nine-actual-blender-models-gallery.png'
b=OUT/'r186-nine-actual-gameplay-gallery.png'
print('R186_ACTUAL_GALLERY',a, tile(a,'blender',(375,385)))
print('R186_ACTUAL_GAME_GALLERY',b,tile(b,'game',(675,435)))
