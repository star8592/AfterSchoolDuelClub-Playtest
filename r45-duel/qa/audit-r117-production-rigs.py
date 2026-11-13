#!/usr/bin/env python3
"""Proof of LIVE render-bound skins, not irrelevant armature blobs."""
import json,struct
from pathlib import Path
base=Path(__file__).resolve().parent.parent/'assets/summons'
files={
'E02':'E02-PaperPlane-R57.glb',
'E03':'E03-Ellie-Landing-R97.glb',
'E04':'E04-Phil-Landing-R97.glb',
'G02':'G02-Snow-Landing-R97.glb',
'G03':'G03-Jay-Landing-R97.glb',
'G04':'G04-Victoria-Landing-R97.glb',
'M01':'M01-MusicTeacher-PolyforkSchoolTeacher.glb',
'M02':'M02-CafeteriaAunt-ChefHat-Ladle-R114.glb',
'T01':'T01-Owl-Innerscene-R84.glb',
'T02':'T02-LivingMenu-R59.glb',
'T03':'T03-Rain-Landing-R97.glb',
'T04':'T04-Rex-Landing-R97.glb',
}
report={}
for id,f in files.items():
 b=(base/f).read_bytes()
 assert b[:4]==b'glTF' and struct.unpack_from('<I',b,8)[0]==len(b)
 length=struct.unpack_from('<I',b,12)[0]
 doc=json.loads(b[20:20+length])
 nodes=doc['nodes']
 scenes=doc['scenes']
 default=doc.get('scene',0)
 selected=scenes[default]['nodes']
 reachable=set()
 def walk(index):
  if index in reachable:return
  reachable.add(index)
  for child in nodes[index].get('children',[]):walk(child)
 for n in selected:walk(n)
 visible_skinned=[i for i in reachable if 'mesh' in nodes[i] and 'skin' in nodes[i]]
 visible_morph=[i for i in reachable if 'mesh' in nodes[i]
  and any('targets' in primitive for primitive in doc['meshes'][nodes[i]['mesh']]['primitives'])]
 total_skins=len(doc.get('skins',[]))
 rec={'file':f,'defaultScene':default,'visibleMeshes':sum('mesh' in nodes[i] for i in reachable),
  'skinSetsInFile':total_skins,'visibleSkinnedMeshes':len(visible_skinned),
  'visibleMorphMeshes':len(visible_morph),'embeddedAnimations':len(doc.get('animations',[])),
  'actualRendererRig':len(visible_skinned)>0}
 report[id]=rec
 if id in {'E03','E04','G02','G03','G04','T03','T04'}:
  assert total_skins>=1 and len(visible_skinned)==0 and len(visible_morph)>=2,(id,rec)
 if id in {'M01','M02'}:assert len(visible_skinned)>0,(id,rec)
 if id in {'E02','T01','T02'}:assert len(visible_skinned)==0,(id,rec)
print('R117_ACTUAL_RENDER_BINDINGS_PASS',json.dumps(report,ensure_ascii=False))
