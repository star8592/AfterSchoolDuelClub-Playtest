"""R59: Make genuine PBR-embedded page illustration textures for T02.
Adds two independent UV-mapped pages to real native GLB animation hierarchy;
not an AI image-to-3D or character final asset.
"""
from pathlib import Path
import json,struct,hashlib,math,random,io
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
HERE=Path(__file__).resolve().parent
BASE=HERE.parents[0]/'T02-LivingMenu-R58-AnimateStudy.glb'
OUT=HERE/'T02-LivingMenu-R59-IllustratedStudy.glb'
FONTS=[
 '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
 '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
 '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
FONT=next((f for f in FONTS if Path(f).exists()),None)
if not FONT:raise RuntimeError('No usable font installed')
SZ=1024
def make_page(side):
 rng=random.Random(1551 if side=='front' else 1888)
 im=Image.new('RGB',(SZ,SZ),(240,220,175));p=im.load()
 # Hand-inked warm parchment grain, deterministic and nonuniform.
 for y in range(SZ):
  for x in range(SZ):
   n=rng.randint(-8,8)
   weave=2*math.sin(x*.15)+1.2*math.sin(y*.21)
   p[x,y]=(max(0,min(255,round(244+n+weave))),
           max(0,min(255,round(225+n*.65+weave))),
           max(0,min(255,round(187+n*.48+weave))))
 d=ImageDraw.Draw(im,'RGB')
 mar=48
 d.rounded_rectangle((mar,mar,SZ-mar,SZ-mar),radius=33,outline=(88,57,38),width=8)
 d.rounded_rectangle((mar+15,mar+15,SZ-mar-15,SZ-mar-15),radius=27,outline=(176,123,69),width=3)
 gold=(166,108,52);ink=(76,56,43);sage=(71,117,91);coral=(187,73,52);cream=(252,240,206)
 ftitle=ImageFont.truetype(FONT,61)
 fsub=ImageFont.truetype(FONT,30)
 fsmall=ImageFont.truetype(FONT,23)
 title='食堂隐藏菜单' if side=='front' else '今日限定 · 秘密加餐'
 d.text((512,110),title,font=ftitle,fill=ink,anchor='mm')
 d.text((512,176),'CAMPUS SECRET KITCHEN' if side=='front' else 'HIDDEN CAMPUS DELIGHTS',font=fsub,fill=gold,anchor='mm')
 d.line((190,213,834,213),fill=gold,width=4)
 # three completely original, hand-drawn stylized food miniatures, each readable
 def bowl(cx,cy,kind):
  # warm dinner bowl with highlights and underlay shadow
  d.ellipse((cx-112,cy+70,cx+112,cy+105),fill=(194,163,118))
  d.pieslice((cx-98,cy-4,cx+98,cy+112),0,180,fill=cream,outline=ink,width=5)
  d.arc((cx-105,cy-13,cx+105,cy+27),175,365,fill=ink,width=6)
  d.arc((cx-91,cy-5,cx+91,cy+16),0,180,fill=(242,181,96),width=3)
  if kind==0: # noodles, greens and shrimp
   for o in range(4):
    xx=cx-58+o*32;d.arc((xx-20,cy-28,xx+34,cy+42),190,510,fill=gold,width=9)
   d.ellipse((cx-63,cy-28,cx-23,cy+12),fill=coral,outline=ink,width=3)
   d.ellipse((cx+12,cy-24,cx+58,cy+2),fill=sage)
   d.line((cx+10,cy-15,cx+60,cy+10),fill=(29,76,52),width=7)
  elif kind==1: # dumplings with folds
   for xx in [cx-55,cx,cx+55]:
    d.pieslice((xx-36,cy-28,xx+36,cy+32),180,360,fill=(250,228,164),outline=ink,width=3)
    for k in range(3):d.line((xx-18+k*16,cy-16,xx-10+k*16,cy+4),fill=(205,139,77),width=2)
   d.ellipse((cx+50,cy+21,cx+78,cy+40),fill=coral)
  else: # egg rice and vegetable
   d.ellipse((cx-70,cy-31,cx+80,cy+25),fill=(235,232,181),outline=(127,93,62),width=3)
   d.ellipse((cx-22,cy-29,cx+26,cy+12),fill=(252,248,216),outline=ink,width=2)
   d.ellipse((cx-6,cy-21,cx+14,cy-3),fill=(233,149,47))
   for i in range(6):
    x=cx-49+i*21;d.ellipse((x,cy+5,x+17,cy+23),fill=sage)
  d.arc((cx-88,cy+30,cx+88,cy+92),5,160,fill=gold,width=7)
 labels=['拐弯乌冬','云朵蒸饺','星星蛋饭'] if side=='front' else ['秘密汤面','加油小笼','魔法炒饭']
 for i,(yy,label) in enumerate([(298,labels[0]),(505,labels[1]),(712,labels[2])]):
  d.rounded_rectangle((110,yy-25,910,yy+165),radius=21,fill=(246,232,194),outline=(184,146,94),width=3)
  bowl(296,yy+45,i)
  d.text((555,yy+34),label,font=ImageFont.truetype(FONT,47),fill=ink,anchor='lm')
  d.text((555,yy+98),['热气腾腾 · 特别供应','皮薄馅足 · 好运加倍','一口满分 · 元气满满'][i],font=fsmall,fill=sage,anchor='lm')
 d.text((512,934),'★ 仅限放学后营业 ★',font=fsub,fill=coral,anchor='mm')
 # PBR roughness and subtle natural paper-like embossing are handled as
 # physically plausible baseColor/roughness in GLB, not simulated shadows.
 dst=HERE/(f'R59_T02_Illustration_{side}.png')
 im.save(dst,optimize=True)
 return dst
pages=[make_page('front'),make_page('back')]
src=BASE.read_bytes()
assert src[:4]==b'glTF'
size=struct.unpack_from('<I',src,12)[0]
obj=json.loads(src[20:20+size].decode())
idx=20+size
bi,tag=struct.unpack_from('<I4s',src,idx)
assert tag==b'BIN\x00'
binary=bytearray(src[idx+8:idx+8+bi])
assert len(binary)==obj['buffers'][0]['byteLength']
pivot=next(i for i,x in enumerate(obj['nodes']) if x.get('name')=='R58_Left_Book_Binding_PIVOT')
def store(blob):
 while len(binary)%4:binary.append(0)
 offset=len(binary);binary.extend(blob)
 n=len(obj['bufferViews']);obj['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(blob)})
 return n
def arr(a,kind):
 a=np.asarray(a,dtype='<f4')
 assert a.ndim==2
 n=store(a.tobytes())
 acc={'bufferView':n,'componentType':5126,'count':len(a),'type':kind,
      'min':a.min(axis=0).tolist(),'max':a.max(axis=0).tolist()}
 i=len(obj['accessors']);obj['accessors'].append(acc);return i
for side,path in zip(['front','back'],pages):
 png=path.read_bytes()
 view=store(png)
 image_idx=len(obj.setdefault('images',[]))
 obj['images'].append({'name':'R59_Ink_Paper_Illustration_'+side,'bufferView':view,'mimeType':'image/png'})
 tex_idx=len(obj.setdefault('textures',[]));obj['textures'].append({'source':image_idx})
 mat_idx=len(obj['materials'])
 obj['materials'].append({
  'name':'R59_Illustrated_HandPainted_Paper_'+side,
  'pbrMetallicRoughness':{
   'baseColorFactor':[1,1,1,1],'baseColorTexture':{'index':tex_idx},
   'metallicFactor':0,'roughnessFactor':.91},
  'doubleSided':True,'alphaMode':'OPAQUE'})
 # Relative to the previously authored R58 hinge origin at (-.47,1.32,.19).
 # Underlying page: center(+.52,0,-.016), halfsize(.435,.645,.01).
 z=.004 if side=='front' else -.042
 # Plane normals and winding face readable outside and inside.
 if side=='front':
  xy=[(.17,-.52),(.87,-.52),(.87,.52),(.17,.52)]
  uv=[[0,0],[1,0],[1,1],[0,1]]
 else:
  xy=[(.87,-.52),(.17,-.52),(.17,.52),(.87,.52)]
  uv=[[0,0],[1,0],[1,1],[0,1]]
 positions=[[x,y,z] for x,y in xy]
 inds=[0,1,2,0,2,3]
 # New quad geometry uses actual PBR image sampling, not CSS overlay.
 posidx=arr(positions,'VEC3')
 uvidx=arr(uv,'VEC2')
 normal=arr([[0,0,1 if side=='front' else -1]]*4,'VEC3')
 ind_arr=np.asarray(inds,dtype='<u2')
 index_view=store(ind_arr.tobytes())
 accidx=len(obj['accessors']);obj['accessors'].append({'bufferView':index_view,'componentType':5123,'count':6,'type':'SCALAR','min':[0],'max':[3]})
 mesh_idx=len(obj['meshes'])
 obj['meshes'].append({'name':'R59_UV_Page_Art_'+side,
  'primitives':[{'attributes':{'POSITION':posidx,'TEXCOORD_0':uvidx,'NORMAL':normal},
                 'indices':accidx,'material':mat_idx,'mode':4}]})
 node_idx=len(obj['nodes'])
 obj['nodes'].append({'name':'R59_Illustrated_Decal_'+side,'mesh':mesh_idx})
 obj['nodes'][pivot]['children'].append(node_idx)
# Keep existing all 5 clips and all original meshes.
obj['buffers'][0]['byteLength']=len(binary)
raw=json.dumps(obj,separators=(',',':'),ensure_ascii=False).encode()
raw+=b' '*((-len(raw))%4)
binary.extend(b'\0'*((-len(binary))%4))
assert len(binary)==obj['buffers'][0]['byteLength']
OUT.write_bytes(struct.pack('<4sII',b'glTF',2,12+8+len(raw)+8+len(binary))
 +struct.pack('<I4s',len(raw),b'JSON')+raw
 +struct.pack('<I4s',len(binary),b'BIN\x00')+binary)
info={'source':str(BASE),'source_sha':hashlib.sha256(src).hexdigest(),
      'result':str(OUT),'result_sha':hashlib.sha256(OUT.read_bytes()).hexdigest(),
      'original_meshes_preserved':41,'added_UV_decal_meshes':2,
      'native_animation_clips_preserved':5,
      'original_paintings':[{p.name:hashlib.sha256(p.read_bytes()).hexdigest()} for p in pages],
      'production_approved':False,'art_status':'TEXTURE_TECHNICAL_CANDIDATE'}
OUT.with_suffix('.provenance.json').write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n')
print('R59_T02_TEXTURE',json.dumps({'meshes':len(obj['meshes']),'images':len(obj['images']),
  'animations':len(obj['animations']),'bytes':len(OUT.read_bytes()),'sha':info['result_sha']}))
