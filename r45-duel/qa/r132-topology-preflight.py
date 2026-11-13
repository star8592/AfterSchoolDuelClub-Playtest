import bpy,sys,json
slug=sys.argv[sys.argv.index('--')+1]
rig=next(x for x in bpy.data.objects if x.type=='ARMATURE' and x.name.lower()=='rig-'+slug)
geo=[o for o in bpy.data.objects if o.type=='MESH' and not o.hide_render and o.name.startswith('GEO-') and any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers)]
dep=bpy.context.evaluated_depsgraph_get()
out=[]
for o in geo:
 orig=len(o.data.vertices)
 ev=o.evaluated_get(dep).to_mesh(preserve_all_data_layers=False,depsgraph=dep)
 n=len(ev.vertices)
 o.evaluated_get(dep).to_mesh_clear()
 if orig!=n:
  out.append({'name':o.name,'source':orig,'eval':n,'keys':len(o.data.shape_keys.key_blocks) if o.data.shape_keys else 0,'mods':[{'type':m.type,'name':m.name,'enabled':m.show_viewport} for m in o.modifiers]})
print('R132_TOPOLOGY',json.dumps({'slug':slug,'mismatches':out},ensure_ascii=False),flush=True)
