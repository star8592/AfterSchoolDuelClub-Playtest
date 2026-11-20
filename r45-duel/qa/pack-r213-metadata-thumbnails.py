#!/usr/bin/env python3
"""R213 losslessly retain ALL runtime glTF buffers/material textures/animation and 
replace ONLY metadata Thumbnail image with a 256px WEBP. Original VRMs untouched.
The VRM extension meta.texture remains the exact same texture/index and still exists.
"""
from pathlib import Path
from hashlib import sha256
from PIL import Image
from io import BytesIO
from struct import unpack_from,pack
import json
root=Path(__file__).resolve().parents[1]/'assets/model'
report={'version':'R213','method':'metadata-only-thumbnail-binary-repack',
 'originalVisibleMeshDataIdentical':True,'originalAnimationDataIdentical':True,
 'originalRuntimeMaterialTextureBytesIdentical':True,'entries':[]}
align4=lambda n:(n+3)&~3
def decode(blob):
 assert blob[:4]==b'glTF'
 magic,ver,length=unpack_from('<4sII',blob,0);assert ver==2 and length==len(blob)
 n,typ=unpack_from('<I4s',blob,12);assert typ==b'JSON'
 data=json.loads(blob[20:20+n])
 p=20+n
 size,typ=unpack_from('<I4s',blob,p);assert typ==b'BIN\x00'
 start=p+8;content=blob[start:start+size]
 assert start+size==len(blob) and data['buffers'][0]['byteLength']==len(content)
 return data,content
def digest(blob):return sha256(blob).hexdigest()
for src in sorted(root.glob('*.vrm')):
 data,old=decode(src.read_bytes())
 images=data['images'];thumbs=[(i,v) for i,v in enumerate(images) if v.get('name')=='Thumbnail']
 assert len(thumbs)==1,(src.name,len(thumbs))
 idx,im=thumbs[0]
 assert im.get('mimeType')=='image/webp'
 viewidx=im['bufferView'];view=data['bufferViews'][viewidx]
 offset=view.get('byteOffset',0);end=offset+view['byteLength'];oldalloc=align4(end)
 old_image=old[offset:end]
 picture=Image.open(BytesIO(old_image))
 assert picture.size==(2048,2048)
 picture.thumbnail((256,256),Image.Resampling.LANCZOS)
 buf=BytesIO();picture.save(buf,format='WEBP',quality=87,method=6)
 small=buf.getvalue()
 assert len(small)<200000 and small[:4]==b'RIFF'
 newalloc=align4(len(small))
 delta=newalloc-(oldalloc-offset)
 # Keep every byte outside the thumbnail and its 4-byte alignment untouched.
 packed=old[:offset]+small+b'\x00'*(newalloc-len(small))+old[oldalloc:]
 assert len(packed)==len(old)+delta
 # Adjust all following views; no runtime glTF view may overlap thumb.
 oldviews=[dict(v) for v in data['bufferViews']]
 for j,v in enumerate(data['bufferViews']):
  if v.get('buffer',0)!=0:continue  # Meshopt virtual fallback buffer, not in BIN.
  vo=v.get('byteOffset',0)
  if j==viewidx:v['byteLength']=len(small)
  elif vo>=oldalloc:v['byteOffset']=vo+delta
  else:assert vo+v['byteLength']<=offset,('overlapping image',src.name,j)
 data['buffers'][0]['byteLength']=len(packed)
 # The metadata preview MUST STILL be present and point to same texture.
 meta=data.get('extensions',{}).get('VRM',{}).get('meta',{})
 assert meta.get('texture')==idx,('meta index mismatch',src.name,meta)
 txt=data['textures'][meta['texture']]
 assert txt.get('extensions',{}).get('EXT_texture_webp',{}).get('source')==idx
 for i,v in enumerate(oldviews):
  if i==viewidx or v.get('buffer',0)!=0:continue
  before=old[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
  w=data['bufferViews'][i]
  after=packed[w.get('byteOffset',0):w.get('byteOffset',0)+w['byteLength']]
  assert digest(before)==digest(after),('non-thumbnail mutation',src.name,i)
 j=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode('utf-8')
 j+=b' '*(align4(len(j))-len(j))
 out=pack('<4sII',b'glTF',2,12+8+len(j)+8+len(packed))+pack('<I4s',len(j),b'JSON')+j+pack('<I4s',len(packed),b'BIN\x00')+packed
 parsed,check=decode(out)
 assert check==packed and parsed['buffers'][0]['byteLength']==len(packed)
 target=root/(src.stem+'-R213-ThumbLite.vrm')
 target.write_bytes(out)
 row={'file':src.name,'optimized':target.name,'sourceBytes':src.stat().st_size,
  'optimizedBytes':target.stat().st_size,'oldThumbnailBytes':len(old_image),
  'newThumbnailBytes':len(small),'originalSha256':digest(src.read_bytes()),
  'optimizedSha256':digest(out),'thumbnailDimensions':[256,256],
  'otherBufferViewsVerified':len(oldviews)-1,'originalRuntimeDataIdentical':True}
 report['entries'].append(row)
 print(src.name,'original',row['sourceBytes'],'trim',row['optimizedBytes'],
 'saved',row['sourceBytes']-row['optimizedBytes'],'thumbnail',len(old_image),'->',len(small))
manifest=root/'r213-thumblite-manifest.json'
manifest.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
original=sum(e['sourceBytes'] for e in report['entries'])
optimized=sum(e['optimizedBytes'] for e in report['entries'])
print('R213_METADATA_ONLY_VRM_PACK_PASS',json.dumps({
 'models':len(report['entries']),'originalMB':round(original/1e6,3),
 'optimizedMB':round(optimized/1e6,3),'savedMB':round((original-optimized)/1e6,3),
 'savedPercent':round(100*(original-optimized)/original,2),'allOtherByteViewsIdentical':True}))

