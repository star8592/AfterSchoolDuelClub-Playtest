"""Loss-controlled GLB texture compaction for browser-only R119 skin auditions.
Re-packs *every* original bufferView, preserving all geometry/skin/index bytes,
only re-encodes embedded images. Never changes topology/skin/joint weights.
Usage: python3 script.py glb_file [--write]
"""
import sys,os,json,struct,hashlib,io,shutil
from pathlib import Path
from PIL import Image,ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES=True
args=sys.argv[1:];src=Path(args[0]);write='--write' in args
data=src.read_bytes()
assert data[:4]==b'glTF' and struct.unpack_from('<I',data,8)[0]==len(data)
offset=12;chunks=[]
while offset<len(data):
 length,kind=struct.unpack_from('<II',data,offset);offset+=8
 chunks.append((kind,data[offset:offset+length]));offset+=length
assert len(chunks)==2,(len(chunks),[a for a,b in chunks])
assert chunks[0][0]==0x4e4f534a and chunks[1][0]==0x004e4942
doc=json.loads(chunks[0][1]);binary=chunks[1][1]
assert len(doc.get('buffers',[]))==1
buffers=doc['bufferViews'];images=doc.get('images',[])
mapping={}
for idx,entry in enumerate(images):
 if 'bufferView' not in entry:continue
 mapping[entry['bufferView']]=idx
output=bytearray();changes=[];geomProof=[]
for i,view in enumerate(buffers):
 start=view.get('byteOffset',0);length=view['byteLength']
 content=binary[start:start+length]
 assert len(content)==length,(i,length,len(content))
 original=content
 if i in mapping:
  index=mapping[i];entry=images[index];name=entry.get('name','image'+str(index))
  Image.MAX_IMAGE_PIXELS=150000000
  with Image.open(io.BytesIO(content)) as img:
   oldSize=img.size
   isUtility=any(term in name.lower() for term in (
    'normal','rough','metal','specular','sss','bump','cavity','anisotropy','direction'))
   isSmall=any(term in name.lower() for term in ('eyes','eyebrow'))
   maximum=1024 if isUtility else 1600 if isSmall else 2048
   if max(img.size)>maximum:
    scale=maximum/max(img.size)
    img=img.resize((max(1,round(img.width*scale)),max(1,round(img.height*scale))),
      Image.Resampling.LANCZOS)
   alpha=img.getchannel('A') if img.mode=='RGBA' else None
   transparency=alpha and alpha.getextrema()[0]<254
   print('R119_IMAGE_PROCESSING',src.name,name,img.size,flush=True)
   try:
    if transparency:
     buff=io.BytesIO()
     img.save(buff,format='PNG',compress_level=8)
     mime='image/png'
    else:
     buff=io.BytesIO()
     rgb=img.convert('RGB')
     rgb.save(buff,format='JPEG',quality=89 if not isUtility else 93,
       subsampling=0,optimize=False)
     mime='image/jpeg'
    content=buff.getvalue()
   except OSError as exc:
    print('R119_IMAGE_FALLBACK_UNCHANGED',name,str(exc)[:130],flush=True)
    content=original;mime=entry.get('mimeType','image/png')
   entry['mimeType']=mime
   changes.append({'image':name,'beforeBytes':len(original),
    'afterBytes':len(content),'from':oldSize,'to':img.size,'mime':mime})
 else:
  geomProof.append({'id':i,'size':len(original),
    'sha256':hashlib.sha256(original).hexdigest()})
 if len(output)%4:output.extend(b'\0'*(4-len(output)%4))
 view['byteOffset']=len(output);view['byteLength']=len(content)
 output.extend(content)
doc['buffers'][0]['byteLength']=len(output)
if len(output)%4:output.extend(b'\0'*(4-len(output)%4))
j=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode()
if len(j)%4:j+=b' '*(4-len(j)%4)
newbytes=(struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(output))+
  struct.pack('<II',len(j),0x4e4f534a)+j+
  struct.pack('<II',len(output),0x004e4942)+output)
assert len(newbytes)==struct.unpack_from('<I',newbytes,8)[0]
reduced=len(data)-len(newbytes)
assert reduced>0,('IMAGES_NOT_COMPRESSED',src)
# Check all copied original non-image buffers are exactly identical in target,
# and preserve all output joint/weight vertex structures.
for item in geomProof:
 v=buffers[item['id']]
 payload=output[v['byteOffset']:v['byteOffset']+v['byteLength']]
 assert hashlib.sha256(payload).hexdigest()==item['sha256']
assert sum('skin' in n for n in doc['nodes'])>=10
assert len(doc['accessors'])>0
proof={'file':src.name,'originalBytes':len(data),'webBytes':len(newbytes),
 'reduction':round(reduced/len(data),4),'skinCount':len(doc.get('skins',[])),
 'unchangedNonimageBuffers':len(geomProof),
 'images':changes,'sha256':hashlib.sha256(newbytes).hexdigest()}
if write:
 archive=Path('/home/master/.cache/asdc-r119-raw-exports');archive.mkdir(parents=True,exist_ok=True)
 shutil.copy2(src,archive/src.name)
 tmp=src.with_suffix('.compact.tmp')
 tmp.write_bytes(newbytes);os.replace(tmp,src)
 src.with_suffix('.optimized.proof.json').write_text(json.dumps(proof,indent=2))
print('R119_WEB_SKIN_OPTIMIZED',json.dumps({k:v for k,v in proof.items() if k!='images'}))
print('R119_LARGEST_TEXTURE_REDUCTIONS',
 json.dumps(sorted(changes,key=lambda x:-x['beforeBytes'])[:8],ensure_ascii=False))
