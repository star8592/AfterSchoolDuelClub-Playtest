"""Read only Blender Source Armature (loaded with --disable-autoexec)."""
import bpy,sys,json
from collections import Counter
slug=sys.argv[sys.argv.index('--')+1]
rigs=[o for o in bpy.data.objects if o.type=='ARMATURE']
rig=next((o for o in rigs if o.name.lower()=='rig-'+slug),None)
if rig is None:rig=max(rigs,key=lambda a:len(a.data.bones),default=None)
assert rig,slug
b=rig.pose.bones
geo=[o for o in bpy.data.objects if o.type=='MESH' and not o.hide_render and o.name.startswith('GEO-') and o.vertex_groups and any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers)]
get=lambda q: {'name':q,'exists':q in b,
 'xyz':[round(x,5) for x in b[q].rotation_euler] if q in b and b[q].rotation_mode=='XYZ' else None,
 'constraints':[{'type':c.type,'name':c.name,'mute':c.mute} for c in b[q].constraints] if q in b else []}
stems=['FK-UpperArm','FK-Upperarm','FK-Forearm','FK-Wrist','FK-Hand',
       'ORG-UpperArm','ORG-Upperarm','ORG-Forearm','UpperArm','Forearm',
       'IK-MSTR-Wrist','FK-Thigh','FK-Knee','FK-Shin','FK-Foot']
out=dict(slug=slug,source=bpy.data.filepath,rig=rig.name,rigBones=len(rig.data.bones),
 geo=len(geo),meshVertices=sum(len(o.data.vertices) for o in geo),
 controls=[get(name+'.'+side) for name in stems for side in ['L','R'] if name+'.'+side in b],
 objects=[o.name for o in geo[:10]])
print('R132_PREFLIGHT_JSON',json.dumps(out,ensure_ascii=False),flush=True)
