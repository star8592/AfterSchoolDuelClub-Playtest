import bpy, math
from mathutils import Vector,Matrix
from pathlib import Path
root=Path(__file__).resolve().parents[2]
src=root/'assets/summons/M02-CafeteriaAunt-CartoonR76.glb'
dst=root/'assets/summons/M02-CafeteriaAunt-ChefHat-Ladle-R114.glb'
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
shade=mat('R112_chef_shaded_pleats',(.83,.81,.74),0,.79)
band=mat('R99_warm_caramel_hat_band',(.36,.22,.13),0,.58)
metal=mat('R99_brushed_stainless_steel',(.64,.71,.74),.86,.28)
dark=mat('R114_oak_ladle_grip',(.18,.11,.07),0,.37)
edge=mat('R114_soup_ladle_rim_inlay',(.17,.25,.27),.40,.52)
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
handle=cylinder('OakLadle_handle',(-.495,-.115,1.185),.033,.39,dark,32,bevel=.006)
cylinder('Ladle_handle_ring',(-.495,-.115,1.012),.040,.041,band,40,bevel=.004)
cylinder('Ladle_steel_neck',(-.495,-.115,1.407),.017,.22,metal,32,bevel=.003)
# R112: replace the flat slotted spatula with a deep comical serving ladle.
# A concave dish and rolled metal rim read as a spoon from the audience.
cx,cy,cz=-.495,-.215,1.566
vertices=[];faces=[]
N=96
# Closed round-bottom bowl, 0.36m wide with a deep rounded 3D concavity.
rings=[(0.0,.102),(.045,.095),(.100,.070),(.157,.022),(.181,0),
       (.183,.014),(.158,.032),(.105,.082),(.049,.120),(0,.125)]
for r,dy in rings:
 for j in range(N):
  a=2*math.pi*j/N
  vertices.append((cx+r*math.cos(a),cy+dy,cz+r*math.sin(a)))
for i in range(len(rings)-1):
 for j in range(N):
  a=i*N+j;b=i*N+(j+1)%N;c=(i+1)*N+(j+1)%N;d=(i+1)*N+j
  faces.append((a,b,c,d))
ladleMesh=bpy.data.meshes.new('R114_ladle_scoop_polished_dish')
ladleMesh.from_pydata(vertices,[],faces);ladleMesh.update()
ladle=bpy.data.objects.new('R114_DeepCafeteriaSoupLadle',ladleMesh)
bpy.context.collection.objects.link(ladle);ladle.data.materials.append(metal)
for face in ladle.data.polygons:face.use_smooth=True
objects.append(ladle)
bpy.ops.mesh.primitive_torus_add(major_radius=.182,minor_radius=.012,
 major_segments=64,minor_segments=12,location=(cx,cy,cz),rotation=(math.pi/2,0,0))
created('LadleScoop_RolledRim',metal,smooth=True)
cylinder('Ladle_Polished_Join_Collar',(-.495,-.128,1.47),.036,.07,metal,48,bevel=.008)
uvball('Ladle_Grip_Endcap',(-.495,-.115,.985),(.037,.037,.027),band)
# A shallow engraved seam where the bowl meets the steel shaft.
uvball('LadleScoop_NeckRivet',(-.495,-.145,1.437),(.032,.029,.036),metal)
# Seat the original floating toque against the real hairline (R112) onto the real hair crown.
# In Blender -Y is the character's genuine forward direction.
for hat in objects:
 if 'ChefHat' in hat.name:
  hat.location.z-=.140
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
print('R114_CHEF_PROP_ASSET',dst,'bytes',dst.stat().st_size,
 'mesh_added',len(objects),'original_meshes',original_meshes,
 'original_actions',orig_animations,'armature',arm.name)
