"""R73 authoring pass for T01, based on real Polyfork Owl GLB.
Adds small wearable broadcasting equipment as Blender meshes; headset and
microphone are skinned to source Head bone, preserving original creature,
textures, UVs and authored four animation actions. No fake low-poly standees.
"""
import bpy,sys,json,hashlib,math
from mathutils import Vector
from pathlib import Path
SRC=Path(sys.argv[-2]);OUT=Path(sys.argv[-1]);OUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SRC))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
assert rig.data.bones.get('Head') and rig.data.bones.get('Chest')
# Remove the auxiliary Blender ico helper, not the Polyfork Owl skinned mesh.
for o in list(bpy.context.scene.objects):
 if o.name.startswith('Icosphere') and o.type=='MESH' and not o.vertex_groups:
  bpy.data.objects.remove(o,do_unlink=True)
source_meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
source_tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in source_meshes)
assert 3200<=source_tris<=3800

def mat(name,color,metallic=0,rough=.55):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1)
 m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF')
 bs.inputs['Base Color'].default_value=(*color,1)
 bs.inputs['Metallic'].default_value=metallic
 bs.inputs['Roughness'].default_value=rough
 return m
navy=mat('R73_OnAir_matte_ink_headset',(0.038,.085,.136),.07,.47)
brass=mat('R73_OnAir_warm_gold_rim',(.71,.45,.155),.62,.29)
cream=mat('R73_OnAir_earpad_cream',(.82,.78,.67),.02,.73)
mic_mat=mat('R73_OnAir_graphite_microphone',(.047,.060,.077),.16,.51)
led=mat('R73_OnAir_red_recording',(.63,.042,.055),.09,.4)
bs=led.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(.7,.035,.025,1);bs.inputs['Emission Strength'].default_value=.24
asset_parts=[]

def link_to_head(obj,bone='Head'):
 # Meshes authored in armature/object coordinates; skinned solid to parent
 # head or chest bone, so they follow all source-authored Idle/Walk/Run/Fly.
 obj.parent=rig
 obj.matrix_parent_inverse=rig.matrix_world.inverted()
 group=obj.vertex_groups.new(name=bone)
 group.add(list(range(len(obj.data.vertices))),1.0,'REPLACE')
 arm=obj.modifiers.new('R73_follow_source_'+bone,'ARMATURE');arm.object=rig
 asset_parts.append(obj)

def sphere(name,xyz,scale,material,bone='Head',segments=24,rings=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=xyz)
 o=bpy.context.object;o.name=name
 o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(material);link_to_head(o,bone)
 return o

def cord(name,pts,radius,material,bone='Head'):
 cu=bpy.data.curves.new(name+'_path','CURVE');cu.dimensions='3D';cu.resolution_u=24
 cu.bevel_depth=radius;cu.bevel_resolution=3
 spline=cu.splines.new('BEZIER');spline.bezier_points.add(len(pts)-1)
 for bp,xyz in zip(spline.bezier_points,pts):bp.co=xyz;bp.handle_left_type='AUTO';bp.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.convert(target='MESH');o=bpy.context.view_layer.objects.active
 o.data.materials.append(material);link_to_head(o,bone)
 return o

# Polyfork Owl head skeleton is 0.243–0.265 Z, front -Y, left/right ±X.
# A low-profile band clears owl eyebrow ridges; not a giant industrial headset.
cord('R73_Headband_navy',[(-.083,-.032,.254),(-.088,-.033,.293),(-.060,-.030,.330),
    (0,-.023,.340),(.060,-.030,.330),(.088,-.033,.293),(.083,-.032,.254)],.0058,navy)
cord('R73_Headband_gold_trim',[(-.076,-.039,.281),(-.050,-.036,.328),
    (0,-.029,.346),(.050,-.036,.328),(.076,-.039,.281)],.0017,brass)
for side in (-1,1):
 x=side*.087
 sphere(f'R73_Earcup_{side}_navy',(x,-.034,.252),(.023,.015,.026),navy)
 sphere(f'R73_Earcup_{side}_cream',(x+side*.004,-.048,.251),(.020,.007,.021),cream)
 sphere(f'R73_Earcup_{side}_goldpin',(x+side*.012,-.028,.253),(.007,.008,.008),brass)
 # A short strut anchors ear cups to the top band.
 cord(f'R73_Earcup_{side}_stem',[(x,-.033,.271),(x+side*.001,-.032,.282)],.0032,brass)
# Curved microphone on the left earpiece, stops to the left of owl beak.
cord('R73_Boom_Mic_gold', [(-.094,-.046,.246),(-.095,-.085,.233),(-.071,-.118,.221),(-.043,-.125,.218)],.0025,brass)
sphere('R73_Headset_Mic_foam',(-.040,-.128,.218),(.012,.009,.009),mic_mat)
# Small physical recording LED on headset, not a giant neon billboard.
sphere('R73_OnAir_indicator',(-.113,-.031,.255),(.0045,.0045,.0045),led)
# The badge follows Chest and is intentionally tiny relative to the bird.
sphere('R73_Broadcast_badge_base',(.035,-.077,.180),(.015,.004,.012),navy,'Chest')
sphere('R73_Broadcast_badge_mark',(.038,-.082,.182),(.004,.003,.004),brass,'Chest')

bpy.context.view_layer.update()
assert len(asset_parts)>=14
for o in asset_parts:
 assert o.parent is rig and o.vertex_groups.get('Head' if 'badge' not in o.name.lower() else 'Chest')
# Project-local reusable .blend master with real source rig, animation & layers.
blend_path=OUT.with_suffix('.blend')
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path),compress=True)
# Multi animation export keeps source Idle/Walk/Run/Fly.
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',export_apply=False,
 export_animations=True,export_animation_mode='ACTIONS',export_skins=True,
 export_yup=True,export_cameras=False,export_lights=False)
assert OUT.stat().st_size>800000
result={
 'source':str(SRC),'output':str(OUT),'blend':str(blend_path),
 'source_sha256':hashlib.sha256(SRC.read_bytes()).hexdigest(),
 'output_sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),
 'source_triangles':source_tris,'added_parts':len(asset_parts),
 'added_part_names':[o.name for o in asset_parts],
 'armature_name':rig.name,'source_bones':len(rig.data.bones),
 'source_animations':sorted(x.name for x in bpy.data.actions),
 'source_license':'CC BY 4.0 · Polyfork Owl · https://polyfork.dev/',
 'art_approved':False,'quality_stage':'BLENDER_MASTER_READY_BROWSER_REVIEW_PENDING'
}
report=OUT.with_suffix('.build.json');report.write_text(json.dumps(result,indent=2)+'\n')
print('R73_BLENDER_BUILT',json.dumps(result))
