#!/usr/bin/env python3
"""Strict 16-source structural animation audit; human aesthetics not certified."""
import json, struct
from pathlib import Path
root=Path(__file__).resolve().parent.parent/'assets'
files={'HOST_PLAYER':'model/Host-HairSample_Female-CC0.vrm',
       'HOST_AI':'model/Host-HairSample_Male-CC0.vrm',
       'E01':'model/Fumiriya-original-CC0.vrm','G01':'model/Shino-original-CC0.vrm',
       'E02':'summons/E02-R60-PhotoPaper-WingFlex-STUDY.glb',
       'E03':'summons/E03-Ellie-Landing-R97.glb','E04':'summons/E04-Phil-Landing-R97.glb',
       'G02':'summons/G02-Snow-Landing-R97.glb','G03':'summons/G03-Jay-Landing-R97.glb',
       'G04':'summons/G04-Victoria-Landing-R97.glb',
       'M01':'summons/M01-MusicTeacher-PolyforkSchoolTeacher.glb',
       'M02':'summons/M02-CafeteriaAunt-ChefHat-Ladle-R114.glb',
       'T01':'summons/T01-Owl-Innerscene-R84.glb','T02':'summons/T02-LivingMenu-R59.glb',
       'T03':'summons/T03-Rain-Landing-R97.glb','T04':'summons/T04-Rex-Landing-R97.glb'}
study={'E03':'Ellie','E04':'Phil','G02':'Snow','G03':'Jay','G04':'Victoria','T03':'Rain','T04':'Rex'}
def scan(path):
 b=path.read_bytes()
 assert b[:4]==b'glTF' and struct.unpack_from('<I',b,8)[0]==len(b),path
 length=struct.unpack_from('<I',b,12)[0]
 g=json.loads(b[20:20+length]); nodes=g['nodes'];visible=set()
 def walk(index):
  if index in visible:return
  visible.add(index)
  for child in nodes[index].get('children',[]):walk(child)
 for i in g['scenes'][g.get('scene',0)]['nodes']:walk(i)
 meshes=[nodes[i] for i in visible if 'mesh' in nodes[i]]
 anim=g.get('animations',[]); channels={}
 for a in anim:
  for ch in a.get('channels',[]):
   kind=ch['target']['path'];channels[kind]=channels.get(kind,0)+1
 return {'visibleMeshes':len(meshes),
         'skinnedMeshes':sum('skin' in x for x in meshes),
         'morphMeshes':sum(any('targets' in part for part in g['meshes'][x['mesh']]['primitives']) for x in meshes),
         'clips':[a.get('name') for a in anim],'channels':channels}
rows={}
for ident,path in files.items():
 r=scan(root/path); rows[ident]=r
 assert r['visibleMeshes']>0
 if ident in study:assert r['skinnedMeshes']==0 and len(r['clips'])==3
 if ident=='M01':assert r['skinnedMeshes']>=10 and len(r['clips'])==3
 if ident=='M02':assert r['skinnedMeshes']>=10 and len(r['clips'])==10
 if ident=='T01':assert not r['clips']
for id,name in study.items():
 r=scan(root/f'summons/{id}-{name}-Skinned-R119.glb')
 assert r['skinnedMeshes']>=6
 rows[id]['R119ResearchSkin']=r['skinnedMeshes']
out={'auditPassed':True,'officialSources':16,'rows':rows,
     'artReview':'Not approved. Source audit cannot judge natural acting.'}
p=root.parent/'qa/evidence/r126/all-cast-source-audit.json'
p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(out,ensure_ascii=False,indent=2))
print('R126_CAST_ANATOMY_AUDIT_PASS',json.dumps({
 'sources':len(rows),'morphOnlySeven':len(study),
 'musicTeacherSourceClips':len(rows['M01']['clips']),
 'referenceChefClips':len(rows['M02']['clips']),
 'owlNativeClips':len(rows['T01']['clips']),'r119StudySourceSkins':7}))
