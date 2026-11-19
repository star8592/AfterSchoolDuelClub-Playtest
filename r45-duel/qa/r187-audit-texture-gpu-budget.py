"""True source 12 summon GLB + original human VRM image size inventory.
Only measures raw image dimensions, not claims about actual allocated GPU bytes.
"""
from pathlib import Path
from PIL import Image
from io import BytesIO
import json,re,struct
root=Path(__file__).resolve().parents[1]
src=(root/'scene/summon-models.mjs').read_text()
m=re.search(r'export const UNIT_MODEL_SPECS=Object.freeze\(\{(.*?)\}\);',src,re.S)
assert m
specs=re.findall(r'\b([A-Z]\d+):\{file:\x27([^\x27]+)\x27',m.group(1))
assert len(specs)==12
rows=[]
for id,name in specs:
 p=root/'assets/summons'/name
 b=p.read_bytes();assert b[:4]==b'glTF'
 l=struct.unpack_from('<I',b,12)[0]
 j=json.loads(b[20:20+l])
 offset=20+l;sz,typ=struct.unpack_from('<II',b,offset)
 bin=b[offset+8:offset+8+sz]
 ims=[]
 for i,im in enumerate(j.get('images',[])):
  if 'bufferView' not in im:continue
  v=j['bufferViews'][im['bufferView']]
  if v.get('buffer',0)!=0:continue
  by=bin[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
  try:
   pic=Image.open(BytesIO(by));w,h=pic.size
   ims.append({'id':i,'w':w,'h':h,'gpuRGBA':w*h*4,'packed':len(by),
    'format':pic.format,'name':im.get('name','')})
  except Exception as e:print('IMAGE_ERROR',id,i,str(e)[:100])
 rgba=sum(x['gpuRGBA'] for x in ims)
 rows.append({'id':id,'file':name,'originalGLBbytes':len(b),
  'imageCount':len(ims),'gpuRGBA_MiB':round(rgba/1048576,2),
  'largestImage':max([max(x['w'],x['h']) for x in ims],default=0),
  'totalPackedImageMB':round(sum(x['packed'] for x in ims)/1048576,2),
  'images':ims})
rows.sort(key=lambda x:x['gpuRGBA_MiB'],reverse=True)
print('R187_TRUE_ORIGINAL_12_SUMMON_RAW_GPU_BUDGET')
for z in rows:
 print(z['id'],str(z['gpuRGBA_MiB'])+'MiB',z['imageCount'],'images',
  'maxdim',z['largestImage'],'GLB_MiB',round(z['originalGLBbytes']/1048576,2),z['file'])
p=root/'qa/evidence/r187-perf/r187-12-original-summons-texture-budget.json'
p.write_text(json.dumps({'actualGPUUseNotClaimed':True,
 'measure':'decoded texture RGBA8 pixel potential prior to mipmaps, duplicates and GPU format',
 'models':rows},ensure_ascii=False,indent=2))
print('R187_SUMMON_TOTAL_RGBA_MiB',round(sum(x['gpuRGBA_MiB'] for x in rows),2))
