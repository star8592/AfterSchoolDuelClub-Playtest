/**
 * R212 opt-in school-gym static architectural mesh batching.
 * Only author-approved, truly static mesh names; never merge animated
 * spectators, skinned duelists, scoreboard, stage lights or camera-controlled
 * walls/railings. No change to gameplay or magic.
 */
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const ROOT_ALLOW=[
 /^Roof_Truss_Longitudinal_/,/^Roof_Truss_Shadow_/,/^Roof_Crossbar_/,
 /^3D_Ceiling_Lamp_/,/^Structural_Pilaster_/,/^High_Window_/,
 /^Side_Bleacher_/,/^Side_Riser_/
];
const POLISH_ALLOW=[
 /^Competition_Ring_Metal_Inlay_Tick_/,
 /^Gym_Backstage_Vertical_Light_/,
 /^Hanging_Competition_Scoreboard_(Strut|Joint)_/,
 /^Duelist_Metal_Floor_Border_/,
 /^Championship_Enamel_Court_Perimeter_/,
 /^Real_Stainless_Pennant_Suspension_/
];
function key(m){
 const geo=m.geometry;
 return [m.material.uuid,m.castShadow,m.receiveShadow,m.renderOrder,
  m.layers.mask,!!geo.index,
  Object.entries(geo.attributes).map(([n,a])=>
   n+':'+a.itemSize+':'+a.array.constructor.name+':'+a.normalized).sort().join(',')]
  .join('|');
}
function eligible(m,whitelist){
 return m.isMesh&&!m.isSkinnedMesh&&!m.isInstancedMesh &&
  !m.isLine&&!m.isPoints&&m.visible&&m.children.length===0&&
  !m.userData?.motion&&m.material&&!Array.isArray(m.material)&&
  m.geometry?.attributes?.position&&!m.geometry.morphAttributes?.position?.length&&
  whitelist.some(r=>r.test(m.name||''));
}
export function createR212StadiumStaticBatch(THREE,stadium){
 const report={enabled:true,batches:0,sourceMeshes:0,
  theoreticalCallsSaved:0,byGroup:[],errors:[],preservedDynamic:true};
 const combined=[];
 function batch(parent,selectors,label){
  const grouped=new Map();
  for(const mesh of parent.children){
   if(!eligible(mesh,selectors))continue;
   const signature=key(mesh);
   if(!grouped.has(signature))grouped.set(signature,[]);
   grouped.get(signature).push(mesh);
  }
  let before=0,after=0;
  for(const items of grouped.values()){
   if(items.length<2)continue;
   // Only geometry cloning; immutable original geometry remains untouched.
   const copies=items.map(mesh=>{
    mesh.updateMatrix();
    const g=mesh.geometry.clone();
    g.applyMatrix4(mesh.matrix);return g;
   });
   let geometry;
   try{geometry=mergeGeometries(copies,false)}
   catch(e){report.errors.push(label+':'+String(e).slice(0,160))}
   finally{copies.forEach(g=>g.dispose())}
   if(!geometry)continue;
   geometry.computeBoundingSphere();
   const base=items[0];
   const out=new THREE.Mesh(geometry,base.material);
   out.name='R212_BATCH_'+label+'_'+report.batches;
   out.castShadow=base.castShadow;
   out.receiveShadow=base.receiveShadow;
   out.renderOrder=base.renderOrder;
   out.layers.mask=base.layers.mask;
   out.userData.r212BatchedSourceNames=items.map(x=>x.name);
   // Transform of merged group is parent-local, NOT mesh-local.
   for(const mesh of items)parent.remove(mesh);
   parent.add(out);
   combined.push(out);
   report.batches++;report.sourceMeshes+=items.length;
   report.theoreticalCallsSaved+=items.length-1;
   before+=items.length;after++;
  }
  report.byGroup.push({name:label,sourceMeshes:before,batches:after,
   callsSaved:before-after});
 }
 batch(stadium.group,ROOT_ALLOW,'gym');
 if(stadium.polish?.group)batch(stadium.polish.group,POLISH_ALLOW,'polish');
 return {report,dispose(){for(const obj of combined)obj.geometry.dispose()}};
}

