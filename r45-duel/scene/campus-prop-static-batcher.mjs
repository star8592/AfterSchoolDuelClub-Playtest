/**
 * R172 QA-only static-geometry material batching.
 *
 * Unlike InstancedMesh, merging standard meshes keeps MeshStandardMaterial
 * Shader variants unchanged (no USE_INSTANCING shader macro), and keeps all
 * physically-visible polygon surfaces. Merge only sibling static opaque meshes
 * with the same material and compatible attributes. Animated props are never
 * merged, nor are skinned actors, children, or role-tagged meshes.
 */
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function createCampusStaticBatcher(THREE){
 const mergedCache=new Map();
 let mergedSets=0,sourceMeshes=0,drawsSaved=0,failures=0,totalMergedTriangles=0;
 const eligible=m=>m.isMesh&&!m.isSkinnedMesh&&!m.isInstancedMesh&&
  !m.userData?.motion&&m.children.length===0&&
  m.material?.isMeshStandardMaterial&&!m.material.transparent&&
  !!m.geometry?.attributes?.position;
 function signature(m){
  const geom=m.geometry;
  return [
   m.material.uuid,!!geom.index,
   Object.keys(geom.attributes).sort().map(k=>[
    k,geom.attributes[k].itemSize,geom.attributes[k].normalized,
    geom.attributes[k].array.constructor.name].join(':')).join(','),
   geom.morphTargetsRelative
  ].join('|');
 }
 function batch(root,id){
  const stats={id,batchGroups:0,sourceMeshes:0,savedDraws:0,failures:0};
  function visit(parent,path){
   // The physical actor has no skeleton; only safe unanimated siblings
   // are eligible for static merging.
   const buckets=new Map();
   for(const [index,o] of [...parent.children].entries()){
    if(!eligible(o))continue;
    const sig=signature(o),key=path+':'+sig;
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(o);
   }
   for(const [key,meshes] of buckets){
    if(meshes.length<2)continue;
    let merged=mergedCache.get(id+':'+key);
    if(!merged){
     const cloned=meshes.map(o=>{
      o.updateMatrix();
      const g=o.geometry.clone();
      g.applyMatrix4(o.matrix);
      return g;
     });
     try{merged=mergeGeometries(cloned,false)}
     finally{cloned.forEach(x=>x.dispose())}
     if(!merged){
      failures++;stats.failures++;continue;
     }
     merged.computeBoundingSphere();
     mergedCache.set(id+':'+key,merged);
     totalMergedTriangles+=merged.index?merged.index.count/3:merged.attributes.position.count/3;
    }
    const combined=new THREE.Mesh(merged,meshes[0].material);
    combined.name='R172_BATCHED_STATIC_'+id+'_'+stats.batchGroups;
    combined.userData.r172Batch=true;
    combined.castShadow=false;combined.receiveShadow=false;
    for(const m of meshes)parent.remove(m);
    parent.add(combined);
    stats.batchGroups++;stats.sourceMeshes+=meshes.length;
    stats.savedDraws+=meshes.length-1;
    mergedSets++;sourceMeshes+=meshes.length;drawsSaved+=meshes.length-1;
   }
   // Traverse only real child groups, not replaced static geometry.
   [...parent.children].forEach((o,index)=>{
    if(o.isGroup)visit(o,path+'/'+index);
   });
  }
  visit(root,'root');
  return stats;
 }
 function dispose(){for(const m of mergedCache.values())m.dispose();mergedCache.clear()}
 return {batch,dispose,get stats(){return{enabled:true,mergedSets,sourceMeshes,drawsSaved,
  failures,cacheEntries:mergedCache.size,totalMergedTriangles:Math.round(totalMergedTriangles)}}};
}
