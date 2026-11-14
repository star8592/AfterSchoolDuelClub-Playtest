"""R144 read-only author .blend rig audit, launched with Blender --disable-autoexec.
Inspects actual original CloudRig, transform chains and direct mesh vertex groups.
Does NOT save the artist .blend or invent a weighted DEF-Hips bone.
"""
import bpy,sys,json
from pathlib import Path
from collections import Counter,defaultdict
argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
dest=Path(argv[0]) if argv else Path("/tmp/r144-rex-source-rig-audit.json")
rig=next((o for o in bpy.data.objects if o.type=='ARMATURE' and
 o.name.lower()=='rig-rex'),None)
assert rig, "Original RIG-rex not found"
b=rig.data.bones
geo=[o for o in bpy.data.objects
 if o.type=='MESH' and o.name.startswith('GEO-') and not o.hide_render
 and any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers)]
stems=('hip','pelvis','spine','chest','waist','thigh','knee','shin','foot','toe','neck','head')
selected=[b0 for b0 in b if b0.name.startswith(('DEF-','ORG-','MCH-','FK-'))
 and any(s in b0.name.lower() for s in stems)]
parents={}
for bone in selected:
 parents[bone.name]=dict(parent=bone.parent.name if bone.parent else None,
  deform=bone.use_deform,
  children=[c.name for c in bone.children][:22],
  head=[round(x,5) for x in bone.head_local],
  tail=[round(x,5) for x in bone.tail_local])
groups=defaultdict(lambda:Counter())
permesh=defaultdict(dict)
for o in geo:
 names={i:g.name for i,g in enumerate(o.vertex_groups)}
 local=defaultdict(lambda:Counter())
 for v in o.data.vertices:
  for vg in v.groups:
   group=names.get(vg.group)
   if not group or not (group.startswith('DEF-') or
    any(s in group.lower() for s in ('hip','pelvis','waist'))):
    continue
   if vg.weight<.00001:continue
   local[group]['vertices']+=1
   local[group]['high20']+=int(vg.weight>=.20)
   local[group]['weightSum1000']+=int(vg.weight*1000)
   local[group]['maxWeight1000']=max(local[group]['maxWeight1000'],
    int(round(vg.weight*1000)))
 for group,c in local.items():
  groups[group].update(c)
  if any(tok in group.lower() for tok in ('hip','pelvis','spine','chest',
    'thigh','shin','knee')):
   permesh[o.name][group]=dict(c)
keys=['DEF-Hips','DEF-Pelvis','DEF-Spine','DEF-Chest','DEF-Neck',
      'DEF-Head','DEF-Thigh1.L','DEF-Thigh1.R','DEF-Thigh2.L',
      'DEF-Thigh2.R','DEF-Knee1.L','DEF-Knee1.R']
out={'source':bpy.data.filepath,'sourceRig':rig.name,
 'sourceRigBones':len(b),'sourceMeshes':len(geo),
 'sourceMeshVertices':sum(len(x.data.vertices) for x in geo),
 'boneChain':parents,
 'sourceDirectGroups':{x:dict(groups.get(x,{})) for x in keys},
 'hipRelatedGroups':{x:dict(v) for x,v in groups.items()
  if any(s in x.lower() for s in ('hip','pelvis','waist','spine','thigh'))},
 'meshesSpineHipThighWeights':dict(permesh),
 'sourceHasSavedChanges':False}
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(out,indent=2,ensure_ascii=False))
print('R144_ORIGINAL_BLENDER_SOURCE_RIG_AUDIT',
 json.dumps({'bones':out['sourceRigBones'],'geo':len(geo),
  'vertices':out['sourceMeshVertices'],
  'hipBone':parents.get('DEF-Hips'),
  'spineBone':parents.get('DEF-Spine'),
  'direct':out['sourceDirectGroups']},ensure_ascii=False),flush=True)
