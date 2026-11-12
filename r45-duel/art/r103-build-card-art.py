#!/usr/bin/env python3
"""R103 collector-card paintings based on real active rig renders plus original
graphic design. The 6 spell paintings and paper plane are originally drawn.
No AI-copied franchise art, no fake 'real GLB' provenance and no low-poly avatars.
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
from math import sin,cos,pi
from random import Random
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/cards/r103';OUT.mkdir(parents=True,exist_ok=True)
RAW=ROOT/'art/r103-raw'
BUST=ROOT/'art/portrait-src'
SIZE=(620,780)
palette={
 'E':((27,39,65),(224,114,94),(255,202,128)),
 'G':((16,50,62),(74,152,128),(192,238,156)),
 'T':((17,43,71),(70,151,195),(159,221,245)),
 'M':((24,47,73),(160,132,188),(236,210,248))
}
styles={
 'E01':('clock','铃声追不上'),'E02':('plane','拐弯纸飞机'),'E03':('cheer','加油过头的队长'),
 'E04':('race','食堂接力冠军'),'G01':('rubber','橡皮筋建筑师'),'G02':('blackboard','黑板密码专家'),
 'G03':('experiment','反向实验学长'),'G04':('folder','社团计划总监'),'M01':('music','音乐老师'),
 'M02':('canteen','食堂阿姨'),'T01':('mic','迟到的播音员'),'T02':('menu','食堂隐藏菜单'),
 'T03':('letter','默契收发员'),'T04':('gate','活动室守门人'),
 'E05':('shout','超速呐喊'),'E06':('eraser','飞来的巨大黑板擦'),
 'G05':('repair','课桌紧急修补'),'G06':('pages','翻到第二页的方案'),
 'T05':('soup','食堂暖心加餐'),'T06':('radio','误播的放学广播')
}
def rgba(rgb,a=255):return (*rgb,a)
def shade(a,b,t):return tuple(round(a[i]*(1-t)+b[i]*t) for i in range(3))
def glow(c,rgb,x,y,r):
 lay=Image.new('RGBA',SIZE,(0,0,0,0));d=ImageDraw.Draw(lay)
 for i in range(6):
  f=(6-i)/6
  rad=r*(.26+i*.17)
  d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=(*rgb,round(21*f)))
 c.alpha_composite(lay.filter(ImageFilter.GaussianBlur(20)))
def background(id):
 kind,title=styles[id];a,b,accent=palette[id[0]]
 im=Image.new('RGBA',SIZE);pixels=im.load()
 for y in range(780):
  ty=y/780
  for x in range(620):
   # vignette, engraved paper warmth, and subject-centric rim light
   u=((x-345)/550)**2+((y-300)/650)**2
   t=max(0,min(1,.11+.45*(1-ty)+.16*(1-u)))
   rgb=shade(a,b,t)
   n=(sin(x*.17+y*.033)+sin(y*.21-x*.055))*1.6
   pixels[x,y]=rgba(tuple(max(0,min(255,int(v+n))) for v in rgb))
 glow(im,accent,400,280,220)
 d=ImageDraw.Draw(im,'RGBA')
 # 6-point academic crest geometry, perspective rings & speed lines
 for r in [155,235,315]:
  d.ellipse((310-r,332-r,310+r,332+r),outline=(*accent,36),width=3)
 for i in range(14):
  angle=(i/14)*2*pi+(len(id)%5)*.13
  x=310+cos(angle)*360;y=320+sin(angle)*360
  d.line((310+cos(angle)*205,320+sin(angle)*205,x,y),fill=(*accent,18),width=2)
 # hand-drawn chalkboard cross hatches at footer
 for i in range(14):
  x=30+(i*47)%580;y=545+(i*19)%164
  d.line((x,y,x+18,y+4),fill=(*accent,24),width=2)
 d.rounded_rectangle((21,23,599,754),radius=28,outline=(*accent,110),width=4)
 d.rounded_rectangle((31,33,589,744),radius=25,outline=(*accent,40),width=2)
 d.arc((65,40,570,520),185,343,fill=(*accent,110),width=3)
 return im
def polygon(d,pts,fill,outline=None,width=3):
 d.polygon(pts,fill=fill)
 if outline:d.line(pts+[pts[0]],fill=outline,width=width,joint='curve')
def art_object(im,kind,id):
 d=ImageDraw.Draw(im,'RGBA')
 a,b,accent=palette[id[0]]
 def ring(x,y,r,col=accent):d.ellipse((x-r,y-r,x+r,y+r),outline=(*col,175),width=6)
 def bolt(x,y,size):
  polygon(d,[(x,y),(x+size*.45,y-size*.55),(x+size*.10,y-size*.46),
   (x+size*.43,y-size),(x-size*.28,y-size*.22),(x+size*.04,y-size*.23)],
   fill=(*accent,230),outline=(255,246,209,185),width=3)
 if kind=='plane':
  # uniquely designed wide perspective original paper plane
  polygon(d,[(88,480),(540,205),(390,570),(310,440)],fill=(244,249,251,255),outline=(153,213,231,255),width=7)
  polygon(d,[(88,480),(540,205),(330,410)],fill=(255,255,255,255),outline=(202,225,234,255),width=3)
  polygon(d,[(310,440),(390,570),(333,494)],fill=(98,153,182,255))
  d.line((88,480,540,205),fill=(255,242,192,255),width=8)
  for x,y in [(105,280),(480,475),(160,510)]:ring(x,y,18)
 elif kind=='shout':
  polygon(d,[(165,282),(375,205),(404,460),(180,407)],fill=(241,199,118,255),outline=(255,233,184,250),width=8)
  polygon(d,[(155,292),(105,303),(116,402),(184,398)],fill=(135,172,190,255),outline=(225,240,246,220),width=6)
  d.polygon([(197,399),(233,517),(288,500),(261,410)],fill=(68,90,105,255))
  for i in range(4):
   a=-.95+i*.45
   d.arc((320-i*8,165-i*45,585+i*15,525+i*45),round(a*30),round(130+a*30),fill=(255,232,163,235),width=9)
 elif kind=='eraser':
  polygon(d,[(115,370),(430,220),(560,382),(248,557)],fill=(52,67,82,255),outline=(235,201,146,245),width=11)
  polygon(d,[(115,370),(248,557),(248,606),(109,430)],fill=(205,153,100,255),outline=(255,227,176,230),width=4)
  polygon(d,[(248,557),(560,382),(560,443),(248,606)],fill=(174,128,85,255),outline=(250,209,150,220),width=5)
  for i in range(15):
   x=100+(i*43)%470;y=160+(i*53)%400
   d.ellipse((x,y,x+8,y+8),fill=(241,244,241,160))
 elif kind=='repair':
  polygon(d,[(115,353),(475,353),(539,394),(146,394)],fill=(197,140,86,255),outline=(250,215,162,250),width=8)
  for x in [165,463]:
   d.polygon([(x,395),(x+29,395),(x+10,615),(x-19,615)],fill=(112,76,65,255))
  d.line((216,316,444,499),fill=(224,238,245,255),width=17)
  polygon(d,[(200,300),(278,268),(317,317),(246,350)],fill=(248,192,91,255),outline=(255,243,183,255),width=6)
  ring(452,464,29)
 elif kind=='pages':
  polygon(d,[(164,207),(458,248),(472,607),(150,570)],fill=(240,237,209,255),outline=(248,228,173,255),width=8)
  polygon(d,[(218,180),(485,210),(474,550),(207,521)],fill=(251,249,235,255),outline=(197,220,203,255),width=6)
  for i in range(7):
   y=268+i*33
   d.line((255,y,435-(i%3)*27,y+16),fill=(81,121,138,160),width=5)
  bolt(390,353,140)
 elif kind=='soup':
  d.ellipse((128,414,505,568),fill=(225,233,221,255),outline=(253,237,193,255),width=11)
  d.polygon([(136,480),(496,480),(444,626),(187,626)],fill=(207,222,220,255))
  d.ellipse((128,410,505,508),fill=(248,186,111,255),outline=(255,246,219,255),width=12)
  for i in range(5):
   x=197+i*60
   d.arc((x,231,x+65,435),190,325,fill=(249,244,235,180),width=9)
  for x,y in [(215,463),(310,445),(386,479)]:d.ellipse((x-8,y-8,x+8,y+8),fill=(120,190,104,255))
 elif kind=='radio':
  d.rounded_rectangle((132,252,517,543),radius=32,fill=(51,90,117,255),outline=(252,210,152,255),width=10)
  d.ellipse((197,317,370,487),fill=(26,49,72,255),outline=(145,210,225,255),width=10)
  for r in [36,62]:
   d.ellipse((282-r,402-r,282+r,402+r),outline=(132,198,217,180),width=5)
  for x,y in [(441,345),(443,426)]:ring(x,y,20)
  d.line((170,250,107,142),fill=(252,212,161,255),width=9)
  for r in [63,99,134]:d.arc((382-r,196-r,382+r,196+r),-50,52,fill=(240,232,176,200),width=7)
 else:
  ring(300,355,130)
 return im
def image_layer(im,id):
 kind,name=styles[id]
 path=RAW/(id+'.png')
 if id in {'E01','G01'}:path=BUST/(id+'-vrm-portrait.png')
 if id in {'E02','E05','E06','G05','G06','T05','T06'}:
  return art_object(im,kind,id),'original project vector illustration'
 if not path.exists():raise SystemExit('MISSING_ACTUAL_3D_SOURCE '+str(path))
 src=Image.open(path).convert('RGBA')
 bbox=src.getchannel('A').getbbox()
 if not bbox:raise SystemExit('BLANK_ACTUAL_GLTF '+id)
 src=src.crop(bbox)
 # hero framing retains meaningful head, clothes, native accessories
 target_h=625 if id not in {'T01','T02'} else 480
 scale=min(target_h/src.height,485/src.width)
 src=src.resize((max(1,round(src.width*scale)),max(1,round(src.height*scale))),Image.Resampling.LANCZOS)
 x=(620-src.width)//2+(28 if id in {'T01','M02','E04'} else 0)
 y=145+(15 if id in {'T01','T02'} else 0)
 # dark contour removes cutout-paper look, keeps original authentic mesh material
 shadow=Image.new('RGBA',src.size)
 shadow.putalpha(src.getchannel('A').filter(ImageFilter.GaussianBlur(17)))
 black=Image.new('RGBA',src.size,(4,22,31,0))
 black.putalpha(shadow.getchannel('A').point(lambda v:int(v*.46)))
 im.alpha_composite(black,(x+10,y+16))
 im.alpha_composite(src,(x,y))
 return im,'actual 3D model render from project GLB/VRM'
manifest={'version':'R103','status':'real art assets; no new external source models',
          'rule_cards_unchanged':True,'art':{}}
for id,(kind,name) in styles.items():
 im=background(id)
 im,provenance=image_layer(im,id)
 # diagonal foil-like gleam at edges, avoid cover text stored in actual card DOM
 d=ImageDraw.Draw(im,'RGBA')
 for k in range(8):
  d.line((32+k*5,690+k*3,330+k*4,782),fill=(255,236,186,round(6+2*k)),width=3)
 # intentional darkened bottom for legible ink on rendered card
 shade_layer=Image.new('RGBA',SIZE,(0,0,0,0))
 dd=ImageDraw.Draw(shade_layer)
 for y in range(540,780):
  alpha=round(145*(y-540)/240)
  dd.line((0,y,620,y),fill=(2,13,28,alpha))
 im=Image.alpha_composite(im,shade_layer)
 dest=OUT/(id+'.webp')
 im.convert('RGB').save(dest,'WEBP',quality=83,method=6)
 bs=dest.read_bytes()
 manifest['art'][id]={'file':'./assets/cards/r103/'+id+'.webp','name':name,
  'source_kind':provenance,'source_visual':kind,'bytes':len(bs),
  'sha256':hashlib.sha256(bs).hexdigest()}
 print('R103_PREMIUM_PAINTED',id,len(bs),provenance)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
# Small real output contact sheet for designer + future user QA
thumb=Image.new('RGB',(1250,1330),'#071827')
draw=ImageDraw.Draw(thumb)
for i,id in enumerate(styles):
 x=(i%5)*250+5;y=(i//5)*332+5
 im=Image.open(OUT/(id+'.webp')).convert('RGB').resize((237,298),Image.Resampling.LANCZOS)
 thumb.paste(im,(x,y))
 draw.text((x+8,y+300),id+' '+styles[id][1],fill='#ffddae')
thumb.save(OUT/'contact-sheet.jpg','JPEG',quality=68,optimize=True)
print('R103_ART_TOTAL',len(styles),'bytes',sum((OUT/(id+'.webp')).stat().st_size for id in styles))
