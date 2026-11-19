/**
 * R180 QA-only zero-decimation venue mesh batching.
 *
 * Merges ONLY direct, unchanged, opaque static MeshStandardMaterial siblings.
 * Draw-call count drops without changing geometry vertices/materials. Dynamic
 * score panels, actors, lights, instancing, spectator rigs and hidden reverse
 * grandstand stay intact. The feature is disabled in all player builds.
 */
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function createStadiumStaticBatcher(THREE){
 const groupedMeshes=[];
 const totals={enabled:true,batches:0,mergedSourceMeshes:0,
  replacementMeshes:0,savedCallsNominal:0,trianglesBefore:0,trianglesAfter:0,
  failed:0,groups:[],errors:[]};
 const dynamicName=/^(?:Gym_Scoreboard_Display|Reverse_|Stadium_Seats_|R49_Reverse_|.*(?:Animation|Animated|LiveScore|Reactor))/i;
 function eligible(m){
  if(!m.isMesh||m.isSkinnedMesh||m.isInstancedMesh||
   m.children.length!==0||!m.visible||m.renderOrder!==0||
   m.userData&&Object.keys(m.userData).length||
   dynamicName.test(m.name)||!m.geometry?.attributes?.position||
   !m.material?.isMeshStandardMaterial||m.material?.transparent||
   m.geometry.morphAttributes&&Object.keys(m.geometry.morphAttributes).length||
   m.geometry.groups?.some(x=>x.materialIndex>0)&&Array.isArray(m.material))
   return false;
  return true;
 }
 // Camera orbit R49/R131 actively toggles some venue objects.
 // Never merge two meshes with different visibility contracts: a frontal
 // screen capture alone cannot prove a merged wall safe at 180 degrees.
 function occlusionClass(m){
  const n=m.name||'';
  if(n.startsWith('3D_Championship_'))return 'front-sign-100';
  if(n.startsWith('Gym_Side_Wall_'))return 'side-wall-'+n.slice('Gym_Side_Wall_'.length);
  if(n==='Gym_Back_Wall'||n.startsWith('Grandstand_Back_Tier_')||
    n.startsWith('Grandstand_Riser_')||
    n.startsWith('Stadium_Seats_Instanced_')||
    n.startsWith('Stadium_Bleacher_Safety_Rail_')||
    n.startsWith('Stadium_Bleacher_Rail_Post_')||
    n.startsWith('Gym_Scoreboard_'))return 'front-120';
  return 'always';
 }
 const countTriangles=g=>(g.index?g.index.count:g.attributes.position.count)/3;
 function signature(m){
  const geometry=m.geometry;
  const attrs=Object.entries(geometry.attributes).sort(([a],[b])=>a.localeCompare(b))
    .map(([n,x])=>[n,x.itemSize,x.normalized,x.array.constructor.name].join(':')).join(',');
  return [m.material.uuid,occlusionClass(m),geometry.index?'i':'ni',attrs,
   m.castShadow?'cast':'no-cast',m.receiveShadow?'receive':'no-receive',
   m.renderOrder].join('|');
 }
 function batch(parent,scope){
  if(!parent?.isGroup)throw Error('R180 requires real stage group');
  const bins=new Map();
  for(const obj of parent.children){
   if(!eligible(obj))continue;
   const key=signature(obj);
   if(!bins.has(key))bins.set(key,[]);
   bins.get(key).push(obj);
  }
  for(const [key,meshes] of bins.entries()){
   if(meshes.length<2)continue;
   const cloned=meshes.map(m=>{
    // Mesh local matrix is relative to unchanged direct parent.
    m.updateMatrix();
    const geo=m.geometry.clone();
    geo.applyMatrix4(m.matrix);
    return geo;
   });
   let geometry=null;
   try{geometry=mergeGeometries(cloned,false)}
   catch(e){totals.failed++;totals.errors.push(String(e));}
   finally{cloned.forEach(g=>g.dispose());}
   if(!geometry){totals.failed++;continue;}
   geometry.computeBoundingBox();
   geometry.computeBoundingSphere();
   const origTris=meshes.reduce((n,m)=>n+countTriangles(m.geometry),0);
   const newTris=countTriangles(geometry);
   if(Math.abs(origTris-newTris)>.001){
    geometry.dispose();totals.failed++;totals.errors.push('triangle mismatch '+scope);
    continue;
   }
   const merged=new THREE.Mesh(geometry,meshes[0].material);
   merged.castShadow=meshes[0].castShadow;
   merged.receiveShadow=meshes[0].receiveShadow;
   merged.renderOrder=meshes[0].renderOrder;
   merged.name='R180_STATIC_BATCH_'+scope+'_'+totals.batches;
   merged.userData.r180StaticBatch=true;
   merged.userData.r180OcclusionClass=occlusionClass(meshes[0]);
   merged.userData.originalNames=meshes.map(m=>m.name);
   // No source or material disposal: the scene creation process may still
   // reference them from closures. Removed meshes no longer draw.
   for(const m of meshes)parent.remove(m);
   parent.add(merged);
   groupedMeshes.push(merged);
   totals.groups.push({scope,occlusionClass:occlusionClass(meshes[0]),count:meshes.length,triangles:origTris,
    shadow:{cast:merged.castShadow,receive:merged.receiveShadow},
    materialUuid:merged.material.uuid,
    examples:meshes.slice(0,8).map(m=>m.name)});
   totals.batches++;
   totals.mergedSourceMeshes+=meshes.length;
   totals.replacementMeshes++;
   totals.savedCallsNominal+=meshes.length-1;
   totals.trianglesBefore+=origTris;
   totals.trianglesAfter+=newTris;
  }
 }
 return {batch,get stats(){return{...totals}},get groups(){return groupedMeshes}};
}
