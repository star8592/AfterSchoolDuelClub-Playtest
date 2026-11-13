/**
 * R130: finish the 7 R119 high-resolution human character full-body pilots.
 * Snow's original source leg is ALREADY hierarchical, Rain's original legs
 * have three distinct skeletal chains that must be joined without changing
 * the genuine source rest/bind matrix. Source original-weighted vertices
 * (not dummy animated bones) must move before the trial is considered valid.
 *
 * This module is strictly research opt-in. No source GLB/material modification.
 */
const SPEC=Object.freeze({
 G02:{
  names:{thigh:'Thigh_1',knee:'Knee_1',foot:'Foot',toe:'Toes'},
  strength:.79,tempo:.84,
  mode:'source-hierarchy-preserved'
 },
 T03:{
  names:{thigh:'Thigh1',knee:'Shin1',foot:'Foot',toe:'Toe'},
  strength:1.24,tempo:1.16,
  mode:'source-partial-hierarchy-repaired'
 }
});
const canonical=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
function readSourceBones(instance,id){
 const cfg=SPEC[id];
 if(!cfg)throw Error('R130 source actor not supported '+id);
 const meshes=[],linked=new Set(),byName=new Map();
 instance.traverse(x=>{
  if(x.isBone)byName.set(canonical(x.name),x);
  if(!x.isSkinnedMesh)return;
  meshes.push(x);
  for(const b of x.skeleton.bones)if(b)linked.add(b);
 });
 const find=name=>{
  const bone=byName.get(canonical(name));
  if(!bone?.isBone||!linked.has(bone))throw Error('R130 missing REAL weighted source bone '+id+' '+name);
  return bone;
 };
 const pairs={};
 for(const side of ['L','R']){
  pairs[side]=Object.fromEntries(['thigh','knee','foot','toe'].map(key=>
   [key,find('DEF-'+cfg.names[key]+'.'+side)]));
 }
 return{cfg,meshes,linked,pairs,find};
}
function world(THREE,bone){return bone.getWorldPosition(new THREE.Vector3())}
export function prepareR130SourceLegs(THREE,instance,id){
 const {cfg,pairs,find}=readSourceBones(instance,id);
 instance.updateMatrixWorld(true);
 const chains={};
 for(const side of ['L','R']){
  const p=pairs[side];
  const full=id==='G02'?[
   p.thigh,find('DEF-Thigh_2.'+side),p.knee,
   find('DEF-Knee_2.'+side),p.foot,p.toe
  ]:[
   p.thigh,find('DEF-Thigh2.'+side),p.knee,
   find('DEF-Shin2.'+side),p.foot,p.toe
  ];
  const before=full.map(x=>world(THREE,x));
  if(id==='G02'){
   // Guard against a future author-export revision: never reparent an
   // already correct chain and destroy its existing inverse bind matrices.
   for(let i=1;i<full.length;i++){
    if(full[i].parent!==full[i-1])
     throw Error('R130 Snow genuine source skeleton chain unexpectedly changed: '+side+' '+i);
   }
  }else{
   // Rain source is partial chains:
   // thigh1>thigh2, shin1>shin2, foot alone, toe alone.
   if(full[1].parent!==full[0]||full[3].parent!==full[2]||
    full[2].parent===full[1]||full[4].parent===full[3]||
    full[5].parent===full[4])throw Error('R130 Rain expected partial original chain '+side);
   full[1].attach(full[2]);
   full[3].attach(full[4]);
   full[4].attach(full[5]);
   instance.updateMatrixWorld(true);
  }
  const after=full.map(x=>world(THREE,x));
  const restDrift=Math.max(...before.map((p,i)=>p.distanceTo(after[i])));
  if(restDrift>.00001)throw Error('R130 altered original source bind rest '+id+'/'+side+':'+restDrift);
  chains[side]={sourceNames:full.map(x=>x.name),restDrift,alreadyLinked:id==='G02'};
 }
 return{actor:id,kind:cfg.mode,chains};
}
export function createR130SpecialFullBody(THREE,instance,sourceClips,id){
 if(sourceClips.length!==7||!SPEC[id])throw Error('R130 seven true R119 clips required '+id);
 const {cfg,meshes,linked,pairs}=readSourceBones(instance,id);
 const targets=[
  pairs.L.thigh,pairs.R.thigh,pairs.L.knee,pairs.R.knee,
  pairs.L.foot,pairs.R.foot,pairs.L.toe,pairs.R.toe
 ];
 const rest=targets.map(b=>b.quaternion.clone());
 // Explicit individual temperament:
 // G02 Snow: deliberate restrained blackboard-writer / intellectual.
 // T03 Rain: lively runner handing off a message, deep lunges and footwork.
 const keys=Object.freeze({
  Idle:[0,.012,-.009,.008,0],
  Attack:[0,-.08,-.22,-.09,0],
  Hit:[0,.09,.24,.10,0],
  Walk:[0,.15,-.15,.15,0],
  Challenge:[0,-.045,-.11,-.055,0],
  Worry:[0,.06,.14,.065,0],
  Celebrate:[0,-.09,-.22,-.07,0]
 });
 const forward=[1,-.68,-.72,.72,-.4,.39,-.28,.20];
 const clips=sourceClips.map(src=>{
  const action=src.name.replace('R119_Skeletal_','');
  const movement=keys[action];if(!movement)throw Error('R130 unknown original clip '+src.name);
  const times=movement.map((_,i)=>i*src.duration/(movement.length-1));
  const tracks=targets.map((bone,index)=>{
   const quats=[];
   for(let i=0;i<movement.length;i++){
    let r=movement[i]*cfg.strength*forward[index];
    if(action==='Walk')r*=index%2===0?1:-1;
    if(action==='Idle')r*=.75;
    const q=rest[index].clone().multiply(
     new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),r));
    quats.push(q.x,q.y,q.z,q.w);
   }
   return new THREE.QuaternionKeyframeTrack(bone.uuid+'.quaternion',times,quats);
  });
  return new THREE.AnimationClip(src.name,src.duration,[...src.tracks,...tracks]);
 });
 // Never count source skeleton tracks unless at least one ORIGINAL mesh
 // actually has vertices attached to the driven leg source deform joints.
 let selected=null;
 for(const mesh of meshes){
  const skinI=mesh.geometry.attributes.skinIndex;
  const skinW=mesh.geometry.attributes.skinWeight;
  if(!skinI||!skinW)continue;
  for(const bone of [pairs.L.knee,pairs.L.thigh,pairs.R.knee,pairs.R.thigh,pairs.L.foot]){
   const joint=mesh.skeleton.bones.indexOf(bone);
   if(joint<0)continue;
   const stride=Math.max(1,Math.floor(skinI.count/280));
   for(let v=0;v<skinI.count;v+=stride)
    for(let k=0;k<4;k++)if(skinI.getComponent(v,k)===joint&&skinW.getComponent(v,k)>.35){
     selected={mesh,vertex:v,bone,weight:skinW.getComponent(v,k)};
     break;
    }
   if(selected)break;
  }
  if(selected)break;
 }
 if(!selected)throw Error('R130 no visible source-weighted thigh/knee vertices '+id);
 let frames=0,legFrames=0,maxLegAngle=0,maxLegVertexTravel=0,maxFootTravel=0;
 const jointRest=targets.map(b=>b.quaternion.clone());
 const tip=new THREE.Vector3();
 let firstVertex=null,firstFeet=null;
 const update=()=>{
  frames++;
  let changed=0;
  for(let i=0;i<targets.length;i++){
   const angle=targets[i].quaternion.angleTo(jointRest[i]);
   maxLegAngle=Math.max(maxLegAngle,angle);
   if(angle>.018)changed++;
  }
  if(changed>=2)legFrames++;
  tip.fromBufferAttribute(selected.mesh.geometry.attributes.position,selected.vertex);
  selected.mesh.applyBoneTransform(selected.vertex,tip);
  if(!firstVertex)firstVertex=tip.clone();
  maxLegVertexTravel=Math.max(maxLegVertexTravel,firstVertex.distanceTo(tip));
  instance.updateMatrixWorld(true);
  // Relative feet displacement; root translation must not count.
  const feet=[pairs.L.foot,pairs.R.foot].map(x=>
   instance.worldToLocal(x.getWorldPosition(new THREE.Vector3())));
  if(!firstFeet)firstFeet=feet.map(x=>x.clone());
  maxFootTravel=Math.max(maxFootTravel,
   ...feet.map((f,i)=>f.distanceTo(firstFeet[i])));
 };
 return{clips,update,inspect:()=>({
  actor:id,source:'real_original_source_weighted_vertices',
  hierarchy:cfg.mode,sourceSkinnedMeshes:meshes.length,
  sourceBoneCount:linked.size,sourceLowerTracks:8,
  jointNames:targets.map(x=>x.name),sourceClipCount:clips.length,
  weightedVertexMesh:selected.mesh.name,
  weightedVertexIndex:selected.vertex,
  weightedVertexBone:selected.bone.name,
  weightedVertexWeight:+selected.weight.toFixed(4),
  frames,legFrames,maxLegAngle:+maxLegAngle.toFixed(4),
  maxLegVertexTravel:+maxLegVertexTravel.toFixed(5),
  maxFootTravel:+maxFootTravel.toFixed(5)
 })};
}
