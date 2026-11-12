import bpy, math
from mathutils import Vector,Matrix
from pathlib import Path
root=Path(__file__).resolve().parents[2]
src=root/'assets/summons/M02-CafeteriaAunt-CartoonR76.glb'
dst=root/'assets/summons/M02-CafeteriaAunt-ChefHat-Spatula-R99.glb'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(src))
arm=next(obj for obj in bpy.data.objects if obj.type=='ARMATURE')
orig_animations=len(bpy.data.actions)
original_meshes=len([o for o in bpy.context.scene.objects if o.type=='MESH'])
def mat(name,color,metal=0,rough=.5):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1)
 m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF')
 bs.inputs['Base Color'].default_value=(*color,1)
 bs.inputs['Metallic'].default_value=metal
 bs.inputs['Roughness'].default_value=rough
 return m
ivory=mat('R99_chef_ivory_woven_fabric',(.94,.915,.83),0,.77)
shade=mat('R99_chef_shaded_pleats',(.83,.81,.74),0,.79)
band=mat('R99_warm_caramel_hat_band',(.36,.22,.13),0,.58)
metal=mat('R99_brushed_stainless_steel',(.64,.71,.74),.86,.28)
dark=mat('R99_cooking_spatula_oak_handle',(.18,.11,.07),0,.37)
edge=mat('R99_spatula_slot_inlay',(.17,.25,.27),.40,.52)
objects=[]
def created(name,material,bevel=0,smooth=True):
 obj=bpy.context.object;obj.name='R99_'+name
 obj.data.materials.append(material)
 if bevel>0:
  mod=obj.modifiers.new('Carefully_rounded_edges','BEVEL')
  mod.width=bevel;mod.segments=3
  mod.affect='EDGES'
  normal=obj.modifiers.new('Weighted_normal','WEIGHTED_NORMAL')
  normal.keep_sharp=True
 if smooth and obj.type=='MESH':
  for f in obj.data.polygons:f.use_smooth=True
 objects.append(obj);return obj
def cylinder(name,loc,r,depth,ma,verts=64,rotation=None,bevel=0):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc)
 ob=created(name,ma,bevel)
 if rotation:ob.rotation_euler=rotation
 return ob
def uvball(name,loc,scale,ma,seg=32,rings=16):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc)
 ob=created(name,ma)
 ob.scale=scale
 return ob
# HEAD: source visible crown top z1.749, source face points toward Blender -Y.
# Chef hat sits just above hair, has 32 deliberate rounded flutes, and stands
# taller than generic toque so its school-cafeteria silhouette reads at 800px.
brim=cylinder('ChefHat_brim',(0,-.024,1.758),.218,.052,ivory,96,bevel=.016)
bandObj=cylinder('ChefHat_band',(0,-.024,1.790),.163,.080,band,96,bevel=.013)
# Puffy full crown with 3 tiers of smooth radial geometry, hand-shaped not cubes.
verts=[];faces=[]
segments=128
rings=[(1.817,.16),(1.865,.186),(1.925,.206),(1.986,.201),(2.039,.175),(2.076,.110),(2.086,.022)]
for zi,(z,r) in enumerate(rings):
 for j in range(segments):
  theta=2*math.pi*j/segments
  flute=1+.065*math.cos(theta*14)
  verts.append((r*flute*math.cos(theta),-.024+r*flute*math.sin(theta),z))
for i in range(len(rings)-1):
 for j in range(segments):
  a=i*segments+j;b=i*segments+(j+1)%segments;c=(i+1)*segments+(j+1)%segments;d=(i+1)*segments+j
  faces.append((a,b,c,d))
faces.append(tuple(range((len(rings)-1)*segments,len(rings)*segments)))
mesh=bpy.data.meshes.new('R99_chefhatted_fluted_crown_mesh')
mesh.from_pydata(verts,[],faces);mesh.update()
crown=bpy.data.objects.new('R99_ChefHat_14PleatHighResolutionCrown',mesh)
bpy.context.collection.objects.link(crown);crown.data.materials.append(ivory)
for f in crown.data.polygons:f.use_smooth=True
sub=crown.modifiers.new('fabric_natural_roundness','SUBSURF');sub.levels=1;sub.render_levels=1
objects.append(crown)
# Tiny embroidered edge at lower crown for distinct readable cream cloth.
cylinder('ChefHat_seam',(0,-.024,1.817),.163,.009,shade,96,bevel=.003)
# Bone-friendly realistic right-hand ladle/spatula at x~ -0.48m, z~0.98m.
# Wooden grip spans the source hand and metallic 3-slot serving head reads
# cleanly as an unmistakable cafeteria spatula.
handle=cylinder('OakSpatula_handle',(-.495,-.115,1.185),.026,.36,dark,32,bevel=.006)
cylinder('Spatula_handle_ring',(-.495,-.115,1.012),.031,.035,band,40,bevel=.004)
cylinder('Spatula_steel_neck',(-.495,-.115,1.407),.014,.22,metal,32,bevel=.003)
# rounded flat blade, front faces toward spectator (-Y)
bpy.ops.mesh.primitive_cube_add(size=1, location=(-.495,-.124,1.578))
blade=created('StainlessSteel_slotted_blade',metal,.018,smooth=True)
blade.dimensions=(.248,.014,.302)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
for i in [-1,0,1]:
 x=-.495+i*.056
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-.134,1.574))
 slot=created('Three_actual_steam_slots_'+str(i),edge,.004)
 slot.dimensions=(.019,.004,.132)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
# The blade joint is clean steel: no extra spherical rivets.
# Drop the original high-floating toque onto the real hair crown.
# In Blender -Y is the character's genuine forward direction.
for hat in objects:
 if 'ChefHat' in hat.name:
  hat.location.z-=.075
bpy.context.view_layer.update()
# Skin each accessory's REAL vertices to the named original joint.
# Simply setting parent_type=BONE was rejected in GLB inspection: imported
# bones use centimeters with non-unit rest matrices, causing 19m hat offsets.
# Proper GLTF skin inverseBindMatrices preserve the visible original world
# coordinates and move the hats/spatula with the authentic source animations.
for obj in objects:
 bone='Head' if 'ChefHat' in obj.name else 'RightHand'
 world=obj.matrix_world.copy()
 obj.parent=arm
 obj.matrix_parent_inverse=arm.matrix_world.inverted()
 obj.matrix_world=world
 weights=obj.vertex_groups.new(name=bone)
 weights.add(list(range(len(obj.data.vertices))),1.0,'REPLACE')
 skin=obj.modifiers.new('R99_attach_to_source_'+bone,'ARMATURE')
 skin.object=arm

# Original helper Icosphere is a camera collider placeholder, keep untouched.
bpy.ops.export_scene.gltf(filepath=str(dst), export_format='GLB',
 export_apply=False,export_animations=True,export_skins=True,
 export_materials='EXPORT',export_texcoords=True,
 export_normals=True, export_yup=True)
print('R99_CHEF_ASSET',dst,'bytes',dst.stat().st_size,
 'mesh_added',len(objects),'original_meshes',original_meshes,
 'original_actions',orig_animations,'armature',arm.name)
