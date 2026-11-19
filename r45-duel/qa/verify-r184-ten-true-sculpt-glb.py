"""R182 mandatory forensic GLB & original native Blender source inspection.
No statement here is visual approval, only real topology/source/artifact test.
"""
import json,struct
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'art/hero-props'
ORIGINAL=[
 'E05_Giant_Cheer_Megaphone',
 'G05_Repairing_Animated_School_Desk',
 'T06_Broken_School_Announcement_System',
 'K03_Corn_Grape_Cafeteria_Dance',
 'K04_Chili_Mooncake_Catastrophe',
 'Q02_Origami_Beast_From_School_Notice',
 'S01_Reversed_Forged_School_Alarm',
 'S06_Quantum_Rubber_Band_Teacher_Hat',
 'P07_Black_Swan_Ice_Rink',
 'X02_School_Uniform_Passing_Wall']
manifest=json.loads((BASE/'qa/R184_ten_hero_receipts.json').read_text())
assert manifest['total']==10
by_id={}
result={}
for stem in ORIGINAL:
 id=stem.split('_')[0]
 r=manifest['assets'][id]
 assert r['source']==stem+'.blend' and r['glb']==stem+'.glb'
 blend,glb,png=(BASE/(stem+'.blend'),BASE/(stem+'.glb'),BASE/'qa'/(stem+'.png'))
 assert all(p.exists() for p in (blend,glb,png))
 signature=blend.read_bytes()[:64]
 assert signature.startswith(b'BLENDER') or (signature.startswith(bytes.fromhex('28b52ffd')) and b'BLENDER' in signature),(id,'not Blender native source')
 data=glb.read_bytes()
 assert data[:4]==b'glTF' and struct.unpack_from('<I',data,8)[0]==len(data),(id,'invalid GLB')
 length,typ=struct.unpack_from('<II',data,12)
 assert typ==0x4e4f534a
 doc=json.loads(data[20:20+length])
 triangles=sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives'])
 actors=[n.get('name') for n in doc['nodes'] if n.get('name','').startswith(id+'_') and (n.get('name','').endswith('_ACTOR') or n.get('name','').endswith('_STATIC'))]
 assert r['triangles']==triangles and triangles>=6000,id
 assert len(doc['materials'])>=6 and len(doc['meshes'])>=6
 assert sorted(actors)==sorted(r['actorGroups']),(id,'actor hierarchy lost',actors,r['actorGroups'])
 assert not doc.get('images'),id+' contains unexpectedly unresolved image texture dependency'
 with Image.open(png) as im:
  assert im.width>=1000 and im.height>=700,(id,'tiny preview')
 by_id[id]=r
 result[id]={'triangles':triangles,'meshCount':len(doc['meshes']),
   'actorGroups':actors,'materials':len(doc['materials']),
   'realBlenderSourceBytes':blend.stat().st_size,
   'realGLBBytes':len(data),'actualEeveePreview':str(png.relative_to(ROOT)),
   'technicalSourceVerified':True,'gameRuntimeTested':False,'visualAccepted':False}
assert len(result)==10
dst=ROOT/'qa/evidence/r184-sculpted-props/r184-ten-geometry-verification.json'
dst.parent.mkdir(parents=True,exist_ok=True)
dst.write_text(json.dumps({'date':'2026-11-18','tool':'Blender5.2.3 native',
  'items':result,'release':'NO_GO','allVisualAccepted':False},ensure_ascii=False,indent=2))
print('R184_TEN_REAL_SOURCE_GLBS_VERIFIED',json.dumps(result,ensure_ascii=False))
