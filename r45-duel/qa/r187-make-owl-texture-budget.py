"""QA-only GLB T01 texture-mip budget study. Preserve the exact 3D mesh,
skinning/animation/materials/texture slots, and original 2048px unmodified file.
Re-encode embedded WEBP images at 1024/512 for controlled actual GPU upload QA.
Not the finished KTX2 pipeline; no player-facing source replacement.
"""
from pathlib import Path
from PIL import Image
from io import BytesIO
import json,struct,hashlib
root=Path(__file__).resolve().parents[1]
src=root/'assets/summons/T01-Owl-Innerscene-R84.glb'
data=src.read_bytes()
assert data[:4]==b'glTF' and struct.unpack_from('<I',data,4)[0]==2
jsz,jtyp=struct.unpack_from('<II',data,12)
assert jtyp==0x4e4f534a
gltf=json.loads(data[20:20+jsz])
bs=20+jsz
bisz,bitype=struct.unpack_from('<II',data,bs)
assert bitype==0x004e4942
binary=data[bs+8:bs+8+bisz]
assert len(binary)==bisz
assert len(gltf['buffers'])==2
assert gltf['buffers'][1].get('extensions',{}).get('EXT_meshopt_compression',{}).get('fallback') is True
# Second buffer is a virtual uncompressed fallback for Meshopt; its compressed
# byte intervals physically live in buffer0 and must be repacked too.
assert len(gltf.get('meshes',[]))>100
oldimg={}
imgv=set()
for i,item in enumerate(gltf['images']):
 assert item['mimeType']=='image/webp' and 'bufferView' in item
 vi=item['bufferView']
 imgv.add(vi)
 bv=gltf['bufferViews'][vi]
 body=binary[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]
 im=Image.open(BytesIO(body))
 assert im.size==(2048,2048)
 oldimg[vi]=(i,im.copy(),len(body))
used=set()
for tex in gltf['textures']:
 ext=tex.get('extensions',{}).get('EXT_texture_webp')
 if ext:used.add(ext['source'])
 elif 'source' in tex:used.add(tex['source'])
assert len(used)>0
print('R187_OWL_ORIGINAL',json.dumps({
 'sourceBytes':len(data),'meshes':len(gltf['meshes']),
 'materials':len(gltf['materials']),
 'images':len(gltf['images']),
 'imageIdsReferencedByTexture':sorted(used),
 'potentialUncompressedRGBABytes':len(oldimg)*2048*2048*4
},ensure_ascii=False),flush=True)
manifest={'source':str(src.relative_to(root)),
 'originalSha256':hashlib.sha256(data).hexdigest(),
 'originalMeshCount':len(gltf['meshes']),
 'originalTextureCount':len(gltf['textures']),
 'originalImageCount':len(gltf['images']),
 'unchanged':{'geometryBuffers':True,'animations':True,'skins':True,
  'UV':True,'meshMaterialSlots':True,'characterCoordinates':True},
 'qualityGate':'unapproved runtime texture LOD experiment; do not enable for players',
 'variants':{}}
for edge in (1024,512):
 new=json.loads(json.dumps(gltf))
 outbin=bytearray()
 for vi,view in enumerate(gltf['bufferViews']):
  if view.get('buffer',0)==1:
   ext=view.get('extensions',{}).get('EXT_meshopt_compression')
   assert ext and ext['buffer']==0,('unexpected virtual view',vi)
   start=ext.get('byteOffset',0)
   body=binary[start:start+ext['byteLength']]
   while len(outbin)%4:outbin.append(0)
   new['bufferViews'][vi]['extensions']['EXT_meshopt_compression']['byteOffset']=len(outbin)
   assert len(body)==ext['byteLength']
   outbin.extend(body)
   continue
  start=view.get('byteOffset',0)
  body=binary[start:start+view['byteLength']]
  if vi in oldimg:
   i,im,oldlen=oldimg[vi]
   scaled=im.resize((edge,edge),Image.Resampling.LANCZOS)
   bsio=BytesIO()
   scaled.save(bsio,format='WEBP',lossless=True,method=6)
   body=bsio.getvalue()
   assert Image.open(BytesIO(body)).size==(edge,edge)
  while len(outbin)%4:outbin.append(0)
  new['bufferViews'][vi]['byteOffset']=len(outbin)
  new['bufferViews'][vi]['byteLength']=len(body)
  outbin.extend(body)
 while len(outbin)%4:outbin.append(0)
 new['buffers'][0]['byteLength']=len(outbin)
 new['asset']['generator']='R187-QA-original-geometry-lod-textures'
 enc=json.dumps(new,ensure_ascii=False,separators=(',',':')).encode()
 enc+=b' ' *((-len(enc))%4)
 header=struct.pack('<4sII',b'glTF',2,12+8+len(enc)+8+len(outbin))
 body=header+struct.pack('<II',len(enc),0x4e4f534a)+enc+struct.pack('<II',len(outbin),0x004e4942)+outbin
 target=src.with_name(f'T01-Owl-Innerscene-R187-{edge}.glb')
 target.write_bytes(body)
 ratio=(len(oldimg)*edge*edge*4)/(len(oldimg)*2048*2048*4)
 # True glb can be decoded, all source mesh attributes unchanged by sha256
 changedImages=0
 for i,bv in enumerate(gltf['bufferViews']):
  if i in imgv:continue
  ext=bv.get('extensions',{}).get('EXT_meshopt_compression')
  if ext:
   start=ext.get('byteOffset',0)
   org=binary[start:start+ext['byteLength']]
   nex=new['bufferViews'][i]['extensions']['EXT_meshopt_compression']['byteOffset']
   neo=outbin[nex:nex+ext['byteLength']]
  else:
   start=bv.get('byteOffset',0)
   org=binary[start:start+bv['byteLength']]
   nex=new['bufferViews'][i]['byteOffset']
   neo=outbin[nex:nex+bv['byteLength']]
  assert org==neo,(i,'unexpected mesh/animation change')
 print('R187_OWL_VARIANT',edge,'GLB_bytes',len(body),'GPU_RGBA_budget_bytes',len(oldimg)*edge*edge*4,
       'ratio',ratio,flush=True)
 manifest['variants'][str(edge)]={'file':target.name,
  'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),
  'imageEdge':edge,'images':len(oldimg),
  'uncompressedGpuImageBytes':len(oldimg)*edge*edge*4,
  'maxPotentialUncompressedRGBA':len(oldimg)*2048*2048*4,
  'geometryAnimBufferViewsByteForByteEqual':True}
path=root/'qa/evidence/r187-perf'
path.mkdir(parents=True,exist_ok=True)
(path/'r187-owl-texture-budget-provenance.json').write_text(json.dumps(
 manifest,indent=2,ensure_ascii=False))
print('R187_MODEL_TEXTURE_PROVENANCE_VERIFIED')
