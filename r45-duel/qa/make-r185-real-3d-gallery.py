"""Only composites actual Blender Eevee PNG + real Chrome WebGL screenshots.
No synthetic concept imagery. Gives user an auditable visible six-prop gallery.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'art/hero-props/qa'
OUT=ROOT/'qa/evidence/r185-sculpted-props'
ITEMS=[
 ('G06','翻到第二页','G06_Second_Page_PopUp_School_Plan'),
 ('T05','食堂暖心汤','T05_Heartwarming_Cafeteria_Chef_Soup'),
 ('K05','校长空气汤','K05_Invisible_Air_Soup_Bowl'),
 ('Q03','做梦黑板','Q03_Dreaming_School_Blackboard'),
 ('Q04','全寝室公放','Q04_Embarrassing_Dormitory_Public_Play'),
 ('Q07','第二个月亮','Q07_Second_Cardboard_Classroom_Moon'),
 ('Q08','粉笔画地为牢','Q08_Chalk_Draw_Prison'),
 ('S02','只容纳一支笔','S02_One_Pencil_Tiny_Stationery_Case'),
 ('S05','乌龙机器人班长','S05_Confused_Homeroom_Class_Leader_Robot'),
 ('S07','放学铃声虫洞','S07_School_Bell_Time_Wormhole')]
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
  ('R185 十件真实 Blender 3D 雕塑 · 未通过最终美术验收'
   if kind=='blender' else
   'R185 十件道具真实浏览器体育馆画面 · QA-only'),
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
a=OUT/'r185-ten-actual-blender-models-gallery.png'
b=OUT/'r185-ten-actual-gameplay-gallery.png'
print('R185_ACTUAL_GALLERY',a, tile(a,'blender',(375,385)))
print('R185_ACTUAL_GAME_GALLERY',b,tile(b,'game',(675,435)))
