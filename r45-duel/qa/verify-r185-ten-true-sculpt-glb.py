"""R182 mandatory forensic GLB & original native Blender source inspection.
No statement here is visual approval, only real topology/source/artifact test.
"""
import json,struct
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'art/hero-props'
ORIGINAL=[
 'G06_Second_Page_PopUp_School_Plan',
 'T05_Heartwarming_Cafeteria_Chef_Soup',
 'K05_Invisible_Air_Soup_Bowl',
 'Q03_Dreaming_School_Blackboard',
 'Q04_Embarrassing_Dormitory_Public_Play',
 'Q07_Second_Cardboard_Classroom_Moon',
 'Q08_Chalk_Draw_Prison',
 'S02_One_Pencil_Tiny_Stationery_Case',
 'S05_Confused_Homeroom_Class_Leader_Robot',
 'S07_School_Bell_Time_Wormhole']
manifest=json.loads((BASE/'qa/R185_ten_hero_receipts.json').read_text())
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
dst=ROOT/'qa/evidence/r185-sculpted-props/r185-ten-geometry-verification.json'
dst.parent.mkdir(parents=True,exist_ok=True)
dst.write_text(json.dumps({'date':'2026-11-19','tool':'Blender5.2.3 native',
  'items':result,'release':'NO_GO','allVisualAccepted':False},ensure_ascii=False,indent=2))
print('R185_TEN_REAL_SOURCE_GLBS_VERIFIED',json.dumps(result,ensure_ascii=False))
