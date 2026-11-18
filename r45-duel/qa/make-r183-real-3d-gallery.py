"""Only composites actual Blender Eevee PNG + real Chrome WebGL screenshots.
No synthetic concept imagery. Gives user an auditable visible six-prop gallery.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'art/hero-props/qa'
OUT=ROOT/'qa/evidence/r183-sculpted-props'
ITEMS=[
 ('P03','纸箱霸王龙','P03_Cardboard_Tyrannosaurus_Stomp'),
 ('S08','暴怒售货机','S08_Angry_Campus_Vending_Machine'),
 ('X03','教务车屋顶违停','X03_Rooftop_School_Patrol_Car'),
 ('Q06','三连拍台灯','Q06_Three_Click_Moonlight_Desk_Lamp'),
 ('K02','橡皮炖西瓜','K02_Watermelon_Rubber_Eraser_Stew'),
 ('K08','巧克力装甲香蕉','K08_Chocolate_Armored_Banana_Knight'),
 ('S03','反重力扫把','S03_Antigravity_School_Broom'),
 ('Q01','自动写检讨橡皮','Q01_SelfWriting_Apology_Eraser')]
fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font=ImageFont.truetype(fontpath,37)
small=ImageFont.truetype(fontpath,23)
def tile(output,kind,size):
 cols=4 if kind=='blender' else 2;rows=2 if cols==4 else 4
 tw,th=size
 c=Image.new('RGB',(tw*cols,th*rows+72),'#f7f8fa')
 d=ImageDraw.Draw(c)
 d.rectangle((0,0,tw*cols,70),fill='#ffffff')
 d.text((28,10),
  ('R183 八件真实 Blender 3D 雕塑 · 未通过最终美术验收'
   if kind=='blender' else
   'R183 八件道具真实浏览器体育馆画面 · QA-only'),
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
a=OUT/'r183-eight-actual-blender-models-gallery.png'
b=OUT/'r183-eight-actual-gameplay-gallery.png'
print('R183_ACTUAL_GALLERY',a, tile(a,'blender',(420,400)))
print('R183_ACTUAL_GAME_GALLERY',b,tile(b,'game',(640,450)))
