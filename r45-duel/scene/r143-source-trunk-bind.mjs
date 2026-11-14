/**
 * R143: genuine original-source torso hierarchy repair.
 * Five BlenderStudio R132 flat source exports lost parent links between
 * spine, chest, neck, head and shoulders, so chest action rotations could
 * not travel to the head/arms. Uses ORIGINAL skinned bones and weights.
 *
 * Flat Rex DEF-Hips is an intentionally rejected orphan: zero directly
 * weighted vertices, zero children. NEVER create fake pelvis animation.
 */
const FLAT_ORIGINALS=new Set(['E03','E04','G03','G04','T04']);
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function repairR143OriginalTorsoHierarchy(THREE,instance,id){
 if(!FLAT_ORIGINALS.has(id))throw Error('R143 original trunk unsupported '+id);
 const bones=new Map(),skins=[],direct=new Map();
 instance.traverse(node=>{
  if(node.isBone){
   const key=norm(node.name);
   if(bones.has(key))throw Error('R143 duplicate original bone '+id+'/'+node.name);
   bones.set(key,node);
  }
  if(node.isSkinnedMesh)skins.push(node);
 });
 if(skins.length<6)throw Error('R143 missing artist original skinned body '+id);
 const find=(name,required=true)=>{
  const bone=bones.get(norm(name));
  if(required&&!bone)throw Error('R143 actual original bone absent '+id+'/'+name);
  return bone||null;
 };
 const spine=find('DEF-Spine'),chest=find('DEF-Chest'),
  neck=find('DEF-Neck',false),head=find('DEF-Head'),
  shoulders=[find('DEF-Shoulder.L'),find('DEF-Shoulder.R')];
 if(chest.parent!==spine.parent||
    (neck&&neck.parent!==spine.parent)||
    head.parent!==spine.parent||
    shoulders.some(b=>b.parent!==spine.parent))
  throw Error('R143 artist skeleton is not a validated flat export '+id);
 // Source glTF can contain a bone named DEF-Chest with no direct weights.
 // It still matters if the ORIGINAL weighted shoulder and head are linked.
 const samples=[];
 for(const target of [spine,head,...shoulders]){
  let found=null;
  for(const mesh of skins){
   const idx=mesh.skeleton.bones.indexOf(target);
   const indices=mesh.geometry.attributes.skinIndex;
   const weights=mesh.geometry.attributes.skinWeight;
   if(idx<0||!indices||!weights)continue;
   for(let vertex=0;vertex<indices.count&&!found;vertex++){
    for(let slot=0;slot<4;slot++){
     if(indices.getComponent(vertex,slot)===idx&&weights.getComponent(vertex,slot)>=.20){
      found={mesh,vertex,weight:weights.getComponent(vertex,slot),
       target:target.name};break;
     }
    }
   }
   if(found)break;
  }
  if(!found)throw Error('R143 missing directly weighted artist vertex '+id+'/'+target.name);
  samples.push(found);
 }
 instance.updateMatrixWorld(true);
 const vec=new THREE.Vector3();
 const read=()=>samples.map(s=>{
  vec.fromBufferAttribute(s.mesh.geometry.attributes.position,s.vertex);
  s.mesh.applyBoneTransform(s.vertex,vec);
  return vec.clone();
 });
 const beforeVertices=read();
 const records=[];
 function relink(parent,child){
  const old=child.getWorldPosition(new THREE.Vector3());
  const from=child.parent?.name||null;
  parent.attach(child);
  instance.updateMatrixWorld(true);
  const drift=old.distanceTo(child.getWorldPosition(new THREE.Vector3()));
  if(drift>2e-5)throw Error('R143 source bind displaced '+id+'/'+child.name+'/'+drift);
  records.push({bone:child.name,from,to:parent.name,restDrift:drift});
 }
 relink(spine,chest);
 if(neck)relink(chest,neck);
 relink(neck||chest,head);
 for(const shoulder of shoulders)relink(chest,shoulder);
 const afterVertices=read();
 const maxRenderedRestDrift=Math.max(...afterVertices.map(
  (v,i)=>v.distanceTo(beforeVertices[i])),0);
 if(maxRenderedRestDrift>2e-4)
  throw Error('R143 original source render skin rest drift '+id+'/'+maxRenderedRestDrift);
 const targets=samples.map(s=>({bone:s.target,mesh:s.mesh.name,
  vertex:s.vertex,sourceWeight:+s.weight.toFixed(4)}));
 return {inspect:()=>({
  enabled:true,actor:id,
  source:'original_artist_bones_preserved_world_reparented_and_render_weight_checked',
  authoredSource:true,changedParentLinks:records.length,
  maxBindRestDrift:Math.max(...records.map(r=>r.restDrift),0),
  maxRenderedRestDrift,
  topology:records,
  actualWeightedVertices:targets,
  skipFakeRexHips:id==='T04',
  rigGeometryReplaced:false,
  sourceGLBModified:false
 })};
}
