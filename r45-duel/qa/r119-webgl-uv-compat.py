"""Strip unsupported GLTF material TEXCOORD 4+ usage from R119 STUDY files.
Three.js WebGL vertex shader supports limited UV namespaces; the original
vertex UV attributes, original geometry/skin and buffers remain bit-exact.
"""
from pathlib import Path
import sys,struct,json,hashlib,os
src=Path(sys.argv[1]);data=src.read_bytes()
assert src.name.endswith('-Skinned-R119.glb')
magic,version,declared=struct.unpack_from('<4sII',data)
assert magic==b'glTF' and version==2 and declared==len(data)
ln,typ=struct.unpack_from('<II',data,12)
assert typ==0x4e4f534a
doc=json.loads(data[20:20+ln])
bi=20+ln;binaryChunk=data[bi:]
assert struct.unpack_from('<I',binaryChunk,4)[0]==0x004e4942
rawSha=hashlib.sha256(binaryChunk).hexdigest()
changes=[]
def clean(obj,context):
 if isinstance(obj,dict):
  for k,v in obj.items():
   if k=='texCoord' and isinstance(v,int) and v>3:
    changes.append({'material':context,'old':v,'new':0})
    obj[k]=0
   else:clean(v,context)
 elif isinstance(obj,list):
  for v in obj:clean(v,context)
for m in doc.get('materials',[]):
 clean(m,m.get('name','unknown'))
if changes:
 j=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode()
 j+=b' '*((-len(j))%4)
 output=struct.pack('<4sII',b'glTF',2,20+len(j)+len(binaryChunk))
 output+=struct.pack('<II',len(j),0x4e4f534a)+j+binaryChunk
 assert struct.unpack_from('<I',output,8)[0]==len(output)
 assert hashlib.sha256(output[20+len(j):]).hexdigest()==rawSha
 dest=src.with_suffix('.tmp')
 dest.write_bytes(output);os.replace(dest,src)
proof={'file':src.name,'fixed':changes,'binarySha256':rawSha,'resultSha256':hashlib.sha256(src.read_bytes()).hexdigest()}
src.with_suffix('.uvfix.proof.json').write_text(json.dumps(proof,indent=2))
print('R119_WEBGL_UV_FIX',json.dumps(proof))
