"""Audit original CC-BY Blender Studio artist file before any web export.
Run: blender -b --disable-autoexec original.blend --python script -- slug out.json
No modification or export.
"""
import bpy,json,sys,hashlib
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:]
slug,dest=args;dest=Path(dest);dest.parent.mkdir(parents=True,exist_ok=True)
armatures=[a for a in bpy.data.objects if a.type=='ARMATURE']
rig=next((a for a in armatures if a.name.lower()==f'rig-{slug}'),None)
source=[o for o in bpy.data.objects if o.type=='MESH' and
 len(o.data.polygons)>=1 and o.name.startswith('GEO-') and not o.hide_render]
visible=[]
for o in source:
 mods=[m for m in o.modifiers if m.type=='ARMATURE']
 matched=[m for m in mods if m.object==rig]
 weights=sum(1 for v in o.data.vertices if v.groups)
 visible.append(dict(name=o.name,verts=len(o.data.vertices),faces=len(o.data.polygons),
  materialCount=len(o.data.materials),vertexGroups=len(o.vertex_groups),
  weightedVertices=weights,armatureMods=[m.object.name if m.object else None for m in mods],
  rigMatched=len(matched)>0,modifiers=[m.type for m in o.modifiers][:12]))
out=dict(slug=slug,scene=bpy.context.scene.name,rig=rig.name if rig else None,
 rigBoneCount=len(rig.data.bones) if rig else 0,
 rigPoseBoneCount=len(rig.pose.bones) if rig else 0,
 fkBones=[x.name for x in rig.pose.bones if ('FK-UpperArm' in x.name or 'FK-Head' in x.name)][:25] if rig else [],
 ikWristControls=[x.name for x in rig.pose.bones if 'IK-MSTR-Wrist' in x.name][:5] if rig else [],
 armatures=[a.name for a in armatures],
 meshes=visible,matchedMeshCount=sum(o['rigMatched'] for o in visible),
 totalWeightedVertices=sum(o['weightedVertices'] for o in visible))
dest.write_text(json.dumps(out,ensure_ascii=False,indent=2))
print('R119_ORIGINAL_SOURCE_AUDIT',json.dumps({k:v for k,v in out.items() if k!='meshes'},ensure_ascii=False),flush=True)
print('R119_MESH_SUMMARY',json.dumps([{'name':o['name'],'weighted':o['weightedVertices'],'groups':o['vertexGroups'],'matched':o['rigMatched'],'mods':o['modifiers']} for o in visible][:12],ensure_ascii=False),flush=True)
