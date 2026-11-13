#!/usr/bin/env python3
"""Proof of original source parent topology, no art acceptance implied."""
import json,struct
from pathlib import Path
base=Path(__file__).resolve().parent.parent
sources={'E03':'Ellie','E04':'Phil','G02':'Snow','G03':'Jay',
         'G04':'Victoria','T03':'Rain','T04':'Rex'}
def read(path):
 b=path.read_bytes()
 assert b[:4]==b'glTF' and struct.unpack_from('<I',b,8)[0]==len(b)
 n=struct.unpack_from('<I',b,12)[0]
 j=json.loads(b[20:20+n]);nodes=j['nodes'];parent={}
 for i,x in enumerate(nodes):
  for child in x.get('children',[]):parent[child]=i
 names={x.get('name',''):i for i,x in enumerate(nodes)}
 return nodes,parent,names
rows=[]
for role,name in sources.items():
 nodes,parent,names=read(base/f'assets/summons/{role}-{name}-Skinned-R119.glb')
 def find(variants):
  return next((names.get(x) for x in variants if x in names),None)
 bones={}
 for k in ['thigh','knee','foot']:
  variants={
   'thigh':['DEF-Thigh1.L','DEF-Thigh_1.L'],
   'knee':['DEF-Knee1.L','DEF-Knee_1.L'],
   'foot':['DEF-Foot.L']}[k]
  idx=find(variants)
  bones[k]={'name':nodes[idx]['name'] if idx is not None else None,
    'parent':nodes[parent[idx]].get('name','') if idx in parent else None}
 flat=(bones['thigh']['parent']==bones['knee']['parent']==bones['foot']['parent']
  and bones['thigh']['parent'] is not None)
 rows.append({'actor':role,'bones':bones,'flatExport':flat})
chef_nodes,chef_parent,chef_names=read(base/'assets/summons/M02-CafeteriaAunt-ChefHat-Ladle-R114.glb')
chef={n:chef_nodes[chef_parent[chef_names[n]]]['name'] for n in ['LeftUpLeg','LeftLeg','LeftFoot']}
assert chef=={'LeftUpLeg':'Hips','LeftLeg':'LeftUpLeg','LeftFoot':'LeftLeg'}
assert set(x['actor'] for x in rows if x['flatExport'])==set(['E03','E04','G03','G04','T04'])
out={'passed':True,'source': 'R119 real glTF scene bones, source-file structural facts only',
     'chefParentage':chef,'researchActors':rows,
     'important':'Flat E04 bone topology found; R128 must restore hierarchy without bind-pose drift'}
dst=base/'qa/evidence/r128/r128-source-parentage-audit.json'
dst.parent.mkdir(parents=True,exist_ok=True)
dst.write_text(json.dumps(out,ensure_ascii=False,indent=2))
print('R128_BONE_PARENTAGE_AUDIT_PASS',
 json.dumps({'audited':len(rows),'flatActors':[x['actor'] for x in rows if x['flatExport']],
  'chef':chef},ensure_ascii=False))
