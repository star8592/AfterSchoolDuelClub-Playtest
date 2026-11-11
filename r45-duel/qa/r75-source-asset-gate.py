"""R75 read-only source provenance and glTF tech audit: never infers art approval."""
from pathlib import Path
import json,struct,hashlib,sys
base=Path(__file__).resolve().parents[1]
a=base/'art-lab/r75-recast/candidates';m=base/'art-lab/r75-motion/sources'
all_files=sorted(a.glob('*.glb'))+sorted(m.glob('*.glb'))
rows=[]
for file in all_files:
 b=file.read_bytes();length,jlen,kind=struct.unpack_from('<III',b,8)
 assert b[:4]==b'glTF' and length==len(b) and kind==0x4E4F534A,(file,'bad container')
 doc=json.loads(b[20:20+jlen]);meta=doc.get('asset',{}).get('extras',{})
 license=str(meta.get('license','')).lower();notice=str(meta.get('licenseText',''))
 is_motion='r75-motion' in file.parts
 assert license=='mit' and 'MIT License' in notice,(file,'MIT license text missing')
 animations=doc.get('animations',[])
 if is_motion:assert len(animations)==1 and sum(len(x.get('channels',[])) for x in animations)>15
 else:assert len(doc.get('skins',[]))>=1
 acc=doc.get('accessors',[])
 triangles=sum(acc[p['indices']]['count']//3 for mesh in doc.get('meshes',[]) for p in mesh['primitives'] if 'indices' in p)
 rows.append({'file':str(file.relative_to(base)), 'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),
  'category':'motion' if is_motion else 'rigged_character',
  'triangles':triangles,'skins':len(doc.get('skins',[])),
  'animations':len(animations),'channels':sum(len(x.get('channels',[])) for x in animations),
  'license':license if license else 'MIT asserted by CodeLove source catalog; no embedded license field',
  'licenseEmbedded':bool(notice),'artApproved':False})
report={'schema':'r75-native-source-qa-v1','source':'https://models.codelove.in/',
 'licensing':'MIT Source CodeLove 3D character pages and animations pages; Microsoft Rocketbox base',
 'count':len(rows),'characters':sum(x['category']=='rigged_character' for x in rows),
 'motionClips':sum(x['category']=='motion' for x in rows),'rows':rows}
p=base/'qa/evidence/r75/native-source-report.json';p.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('R75_NATIVE_SOURCE_GATE',json.dumps({'total':report['count'],'characters':report['characters'],'motionClips':report['motionClips'],'all_sha_verified':True,'all_art_approved':False}))
