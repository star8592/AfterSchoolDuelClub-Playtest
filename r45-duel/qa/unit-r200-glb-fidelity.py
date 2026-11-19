"""Validate material-only R200 variants cannot alter original Blender geometry."""
import json,struct,hashlib
from pathlib import Path
base=Path(__file__).resolve().parent.parent/'art'/'hero-props'
names=['E06_Cinematic_Eraser','K01_Sculpted_Wok_Eggplant_Banana',
       'K07_Sculpted_Frog_Pudding_Bell','Q05_Chalk_Press_Conference',
       'P07_Black_Swan_Ice_Rink']
def inspect(path):
 b=path.read_bytes(); assert b[:4]==b'glTF'
 n1=struct.unpack_from('<I',b,12)[0]
 obj=json.loads(b[20:20+n1])
 i=20+n1
 n2,kind=struct.unpack_from('<II',b,i);assert kind==0x004e4942
 payload=b[i+8:i+8+n2]
 return obj,payload
out=[]
for name in names:
 original,origbytes=inspect(base/(name+'.glb'))
 amended,newbytes=inspect(base/(name+'_R200.glb'))
 for key in ['nodes','meshes','accessors','cameras','scenes','scene',
             'animations','skins','extensionsRequired','extensionsUsed']:
  assert original.get(key)==amended.get(key),(name,key)
 for i,src in enumerate(original['materials']):
  dst=amended['materials'][i]
  for key in ['name','alphaMode','doubleSided','normalTexture','occlusionTexture',
              'emissiveTexture','emissiveFactor','extensions']:
   assert src.get(key)==dst.get(key),(name,i,key)
  for key in ['baseColorFactor','metallicFactor','roughnessFactor']:
   assert src.get('pbrMetallicRoughness',{}).get(key)==dst.get('pbrMetallicRoughness',{}).get(key)
 assert original['bufferViews']==amended['bufferViews'][:len(original['bufferViews'])],name
 assert origbytes==newbytes[:len(origbytes)],name
 assert len(amended.get('images',[]))>0,name
 assert all(x.get('mimeType')=='image/png' and x.get('bufferView') is not None
            for x in amended['images'])
 out.append(dict(name=name,originalVerticesAndMatricesUnchanged=True,
  originalGpuPayloadSHA256=hashlib.sha256(origbytes).hexdigest(),
  imgCount=len(amended['images']),byteIncrease=len(newbytes)-len(origbytes)))
print('R200_GLTF_ORIGINAL_GEOMETRY_VERIFIED',json.dumps(out,ensure_ascii=False))
