/**
 * R181 isolated lossless SkinnedMesh index-union for authored VRM hair.
 * Unlike mergeGeometries this DOES NOT duplicate 10k shared vertices for
 * each of 100+ primitive submeshes. It combines only their original indices.
 * No skeleton transforms, skinIndex, skinWeight, normal, UV, morph target or
 * material is changed. Every precondition must pass; otherwise no mutation.
 */
export function createSkinnedIndexUnion(THREE) {
 const audit={enabled:true,checked:0,candidates:0,sourceMeshes:0,
  resultMeshes:0,savedDraws:0,indexCountBefore:0,indexCountAfter:0,
  rollbacks:0,skipped:[],groups:[]};
 const supported=m=>m?.isSkinnedMesh&&m.parent &&
  m.material?.isMeshBasicMaterial &&
  !m.material.transparent&&m.material.alphaTest>=.49&&
  /hair/i.test(m.material.name||'')&&
  !Object.keys(m.geometry?.morphAttributes||{}).length&&
  m.geometry?.index?.array&&
  m.geometry.groups.length===0 &&
  m.geometry.drawRange.start===0 &&
  m.geometry.drawRange.count===Infinity&&
  !m.userData?.motion;
 const equality=(a,b)=>{
  a.updateMatrix();b.updateMatrix();
  if(a.parent!==b.parent || a.material!==b.material ||
   a.visible!==b.visible || a.castShadow!==b.castShadow||
   a.receiveShadow!==b.receiveShadow||
   a.renderOrder!==b.renderOrder||
   a.frustumCulled!==b.frustumCulled||
   a.layers.mask!==b.layers.mask||
   a.bindMode!==b.bindMode||
   !a.bindMatrix.equals(b.bindMatrix)||
   !a.bindMatrixInverse.equals(b.bindMatrixInverse)||
   !a.matrix.equals(b.matrix))return false;
  if(a.skeleton?.bones?.length!==b.skeleton?.bones?.length)return false;
  if(!a.skeleton.bones.every((bone,i)=>bone===b.skeleton.bones[i]))return false;
  if(!a.skeleton.boneInverses.every((mat,i)=>mat.equals(b.skeleton.boneInverses[i])))return false;
  const attrA=a.geometry.attributes,attrB=b.geometry.attributes;
  const names=Object.keys(attrA).sort();
  if(names.join('|')!==Object.keys(attrB).sort().join('|'))return false;
  if(!['position','normal','uv','skinIndex','skinWeight'].every(k=>names.includes(k)))return false;
  return names.every(k=>attrA[k]?.array===attrB[k]?.array &&
   attrA[k].itemSize===attrB[k].itemSize&&
   attrA[k].normalized===attrB[k].normalized &&
   attrA[k].count===attrB[k].count);
 };
 function process(actor) {
  if(!actor?.isObject3D)throw Error('R181 original performer root missing');
  const buckets=new Map();
  actor.traverse(o=>{
   if(!o.isSkinnedMesh)return;
   audit.checked++;
   if(!supported(o))return;
   let m=buckets.get(o.material);
   if(!m){m=new Map();buckets.set(o.material,m)}
   const items=m.get(o.parent)||[];
   items.push(o);m.set(o.parent,items);
  });
  for(const [material,parents] of buckets)for(const [parent,meshes] of parents) {
   if(meshes.length<2)continue;
   const first=meshes[0];
   if(meshes.some(m=>!equality(first,m))) {
    audit.skipped.push({actor:actor.name,material:material.name,
      cause:'binding or attribute mismatch',count:meshes.length});
    continue;
   }
   audit.candidates++;
   const vertexCount=first.geometry.attributes.position.count;
   let total=0;let valid=true;
   for(const m of meshes){
    const idx=m.geometry.index;
    total+=idx.count;
    if(idx.count%3!==0||idx.array.length!==idx.count)valid=false;
    for(let j=0;j<idx.count;j++){
     if(idx.array[j]>=vertexCount){valid=false;break}
    }
   }
   if(!valid){audit.skipped.push({actor:actor.name,material:material.name,
    cause:'index integrity',count:meshes.length});continue}
   const IndexType=vertexCount>65535?Uint32Array:Uint16Array;
   const indices=new IndexType(total);
   let offset=0;
   for(const m of meshes){indices.set(m.geometry.index.array,offset);offset+=m.geometry.index.count;}
   const geo=first.geometry.clone();
   geo.setIndex(new THREE.BufferAttribute(indices,1));
   geo.clearGroups();
   geo.computeBoundingSphere();
   geo.computeBoundingBox();
   // Explicit byte-for-byte source index concatenation check. Fail closed.
   let cursor=0;
   for(const src of meshes){
    const arr=src.geometry.index.array;
    for(let j=0;j<arr.length;j++){
     if(geo.index.array[cursor+j]!==arr[j])
      throw Error('R181 index data mutation blocked '+actor.name);
    }
    cursor+=arr.length;
   }
   if(cursor!==geo.index.count)throw Error('R181 index count discrepancy');
   // Inverse binding preserved exactly. Original source model remains in
   // memory for QA rollback; no material or skeleton is disposed.
   const union=new THREE.SkinnedMesh(geo,material);
   union.bind(first.skeleton,first.bindMatrix.clone());
   union.bindMode=first.bindMode;
   union.bindMatrixInverse.copy(first.bindMatrixInverse);
   union.position.copy(first.position);
   union.quaternion.copy(first.quaternion);
   union.scale.copy(first.scale);
   union.visible=first.visible;
   union.castShadow=first.castShadow;
   union.receiveShadow=first.receiveShadow;
   union.renderOrder=first.renderOrder;
   union.frustumCulled=first.frustumCulled;
   union.layers.mask=first.layers.mask;
   union.name='R181_HAIR_INDEX_UNION_'+actor.name+'_'+audit.groups.length;
   union.userData.r181SkinnedIndexUnion={sourceNames:meshes.map(o=>o.name),
    sourceCount:meshes.length,totalIndices:total,vertexCount,
    unchangedOriginalMaterial:material.uuid};
   // No mutation before every source/geometry/skeleton validation.
   for(const mesh of meshes)parent.remove(mesh);
   parent.add(union);
   audit.groups.push({actor:actor.name,material:material.name,
    originalMeshes:meshes.length,mergedMesh:union.name,
    originalIndices:total,mergedIndices:union.geometry.index.count,
    vertexCount,skinBones:first.skeleton.bones.length,
    originalMaterialUuid:material.uuid,
    sharedArraysPreserved:true,trianglesPreserved:true});
   audit.sourceMeshes+=meshes.length;
   audit.resultMeshes++;
   audit.savedDraws+=meshes.length-1;
   audit.indexCountBefore+=total;
   audit.indexCountAfter+=union.geometry.index.count;
  }
 }
 return {process,get stats(){return structuredClone(audit)}};
}
