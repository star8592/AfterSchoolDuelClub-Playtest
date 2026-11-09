"""R37 controlled facial topology sculpt on parametric rig:
no naive head graft; facial shape keys preserve original skeleton topology.
Glasses decimation retains round profile while removing excess tessellation.
Experimental art, not a final character.
"""
import bpy,math,json,hashlib
from pathlib import Path
from mathutils import Vector
r=Path('/home/master/projects/after-school-duel-r37-head-transfer-20261109/r37-head-hybrid')
src=Path('/home/master/projects/after-school-duel-r36-hybrid-20261109/r36-hybrid-3d/candidate/R36_parametric_rig_pixal_guided_torso.glb')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(src))
rigs=[o for o in bpy.context.scene.objects if o.type=='ARMATURE']
assert len(rigs)==1 and len(rigs[0].data.bones)==163
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
body=max(meshes,key=lambda o:len(o.data.polygons))
assert len(body.data.polygons)>70000
print('R37_BASE',body.name,len(body.data.polygons),len(body.data.vertices),body.matrix_world,flush=True)
# Does not change the source base face. Keeps sculpt available at weight 0..1.
if body.data.shape_keys is None:body.shape_key_add(name='Basis',from_mix=False)
key=body.shape_key_add(name='R37_Mature_FacialPlanes_v1',from_mix=False)
key.value=1.0
def gaussian(x,y,z,cx,cy,cz,sx,sy,sz):
 return math.exp(-.5*(((x-cx)/sx)**2+((y-cy)/sy)**2+((z-cz)/sz)**2))
changes=[]
for v in body.data.vertices:
 x,y,z=v.co
 if z<1.48 or z>1.79 or abs(x)>.18 or y>-.015:continue
 # Surface-front mask to avoid moving the head's back or inner mouth structure.
 front=max(0,min(1,(-y-.025)/.095))
 fade=min(1,(z-1.48)/.07,(1.79-z)/.07)
 if fade<=0 or front<=0:continue
 cheek=sum(gaussian(x,y,z,s*.069,-.13,1.636,.033,.078,.039) for s in (-1,1))
 under_eye=sum(gaussian(x,y,z,s*.058,-.14,1.659,.032,.07,.018) for s in (-1,1))
 brow=sum(gaussian(x,y,z,s*.052,-.13,1.718,.044,.06,.02) for s in (-1,1))
 nasolabial=sum(gaussian(x,y,z,s*.043,-.14,1.601,.017,.07,.026) for s in (-1,1))
 jaw=sum(gaussian(x,y,z,s*.079,-.106,1.539,.038,.08,.036) for s in (-1,1))
 bridge=gaussian(x,y,z,0,-.142,1.667,.018,.075,.045)
 chin=gaussian(x,y,z,0,-.107,1.521,.040,.08,.026)
 dy=(-.0043*cheek-.0018*under_eye-.0028*brow+.0027*nasolabial-.0030*bridge-.0025*chin)*front*fade
 dx=.0062*jaw*(1 if x>0 else -1)*front*fade
 dz=.0015*brow*front*fade
 off=Vector((dx,dy,dz))
 if off.length>.008:off.length=.008
 if off.length>.00005:
  key.data[v.index].co=v.co+off
  changes.append(off.length)
glass=[]
for o in meshes:
 if 'PRECISION_SPECTACLES' in o.name:
  b=len(o.data.polygons)
  assert b>15000
  for other in bpy.context.selected_objects:other.select_set(False)
  o.select_set(True);bpy.context.view_layer.objects.active=o
  mod=o.modifiers.new('R37_LOD_DECIMATE_GLASSES','DECIMATE')
  mod.ratio=.20
  bpy.ops.object.modifier_apply(modifier=mod.name)
  a=len(o.data.polygons);glass.append({'object':o.name,'before_triangles':b,'after_triangles':a})
assert len(glass)==2
dst=r/'candidate/R37_parametric_face_v1_optimized_glasses.glb'
bpy.ops.export_scene.gltf(filepath=str(dst),export_format='GLB',export_animations=False,export_morph=True,export_lights=False,export_cameras=False)
report={'model':str(dst),'source':str(src),'163_bone_rig_retained':True,
 'anatomy_sculpt_regions':['cheeks','lower_eyelids','brow','nasolabial','nose_bridge','jaw','chin'],
 'morph_target_name':key.name,'modified_head_vertices':len(changes),
 'max_sculpt_mm':round(max(changes)*1000,2) if changes else 0,
 'mean_sculpt_mm':round(sum(changes)/len(changes)*1000,2) if changes else 0,
 'glasses_decimation':glass,
 'glasses_triangles_saved':sum(x['before_triangles']-x['after_triangles'] for x in glass),
 'facial_style_approved':False,'concept_similarity_approved':False,'facial_expressions_completed':False,
 'not_final':True}
(r/'evidence/r37-procedural-face-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('R37_FACE_SCULPT_POC',json.dumps(report,ensure_ascii=False),flush=True)
