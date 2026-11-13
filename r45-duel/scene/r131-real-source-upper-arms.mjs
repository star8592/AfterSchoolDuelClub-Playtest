/**
 * R131 SOURCE ARM ART PILOT (never a low-poly replacement):
 * Repair only the missing exported bone PARENT links on the actual
 * original Blender Studio weighted source meshes. No changes to GLB
 * binary buffers, vertex weights, inverse bind matrices, or rest world
 * transforms. Existing chains are checked before making changes.
 *
 * Fails closed if the original author's exported skeleton changes.
 */
const FLAT=new Set(['E03','E04','G03','G04','T04']);
const norm=n=>String(n||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function repairR131TrueSourceArms(THREE,instance,id){
 if(![...FLAT,'G02','T03'].includes(id))throw Error('R131 unsupported artist actor '+id);
 const bones=new Map(),skinned=[];
 instance.traverse(x=>{
  if(x.isBone)bones.set(norm(x.name),x);
  if(x.isSkinnedMesh)skinned.push(x);
 });
 if(skinned.length<6)throw Error('R131 source has no original weighted character mesh '+id);
 const find=n=>{
  const b=bones.get(norm(n));
  if(!b?.isBone)throw Error('R131 original artist arm bone missing '+id+'/'+n);
  return b;
 };
 const changes=[],sides={},verified=[];
 instance.updateMatrixWorld(true);
 const link=(parent,child,context)=>{
  const before=child.getWorldPosition(new THREE.Vector3());
  if(child.parent!==parent){parent.attach(child);changes.push(context);}
  instance.updateMatrixWorld(true);
  const drift=before.distanceTo(child.getWorldPosition(new THREE.Vector3()));
  if(drift>1e-5)throw Error('R131 original world bind offset '+id+'/'+context+'/'+drift);
  verified.push({bone:child.name,parent:parent.name,drift});
 };
 for(const side of ['L','R']){
  let wrist;
  if(FLAT.has(id)){
   // These four forearm joints and the wrist were all siblings of one
   // shoulder or rig node. Chain them on the exact source skeleton.
   const chain=['Shoulder','UpperArm1','UpperArm2','Forearm1','Forearm2','Wrist']
    .map(n=>find('DEF-'+n+'.'+side));
   const parent=chain[1].parent;
   if(chain.slice(2).some(x=>x.parent!==parent)||
    (parent!==chain[0]&&parent!==chain[0].parent))
    throw Error('R131 flat SOURCE arm topology unexpected '+id+'/'+side);
   for(let i=1;i<chain.length;i++)
    link(chain[i-1],chain[i],side+' arm '+chain[i].name);
   wrist=chain.at(-1);
   for(const finger of ['Index','Middle','Pinky','Ring','Thumb']){
    // The source thumb has three phalanges but no carpal. Do not
    // invent a phantom thumb carpal; anchor the real thumb1 on the wrist.
    const optionalCarpal=bones.get(norm('DEF-Finger_'+finger+'_Carpal.'+side));
    const chainFinger=[
     ...(optionalCarpal?[optionalCarpal]:[]),
     ...[1,2,3].map(n=>find('DEF-Finger_'+finger+n+'.'+side))
    ];
    link(wrist,chainFinger[0],side+' carpal '+finger);
    for(let j=1;j<chainFinger.length;j++)
     link(chainFinger[j-1],chainFinger[j],side+' finger '+finger+'/'+j);
   }
  }else if(id==='G02'){
   const arm=['DEF-UpperArm_1.','DEF-UpperArm_2.','DEF-Forearm_1.',
    'DEF-Forearm_2.','DEF-Wrist.'].map(n=>find(n+side));
   for(let i=1;i<arm.length;i++)
    if(arm[i].parent!==arm[i-1])
     throw Error('R131 Snow original arm chain changed unexpectedly '+side);
   wrist=arm.at(-1);
   for(const finger of ['Index','Middle','Pinky','Ring','Thumb']){
    const carpal=bones.get(norm('DEF-Finger_'+finger+'_Carpal.'+side));
    const first=find('DEF-Finger_'+finger+'1.'+side);
    if(carpal)link(wrist,carpal,side+' carpal '+finger);
    link(carpal||wrist,first,side+' finger root '+finger);
   }
  }else{
   // Rain already has upperarm1>upperarm2 and forearm1>forearm2,
   // but neither arm chain nor the actual original hand is connected.
   const upper=[find('DEF-Upperarm1.'+side),find('DEF-Upperarm2.'+side)];
   const lower=[find('DEF-Forearm1.'+side),find('DEF-Forearm2.'+side)];
   const hand=find('DEF-Hand.'+side);
   if(upper[1].parent!==upper[0]||lower[1].parent!==lower[0]||
    lower[0].parent===upper[1]||hand.parent===lower[1])
    throw Error('R131 Rain expected source split arm chains '+side);
   link(upper[1],lower[0],side+' forearm junction');
   link(lower[1],hand,side+' hand junction');
   wrist=hand;
  }
  sides[side]={wrist:wrist.name};
 }
 // Capture a high-weight vertex actually driven by forearm / wrist / fingers.
 // An empty phantom armature without visible skin cannot pass R131.
 const linkedBones=new Set();
 for(const m of skinned)for(const b of m.skeleton.bones)if(b)linkedBones.add(b);
 const hands=[...bones.values()].filter(b=>
  /def(forearm|wrist|hand|finger).*([lr])$/.test(norm(b.name))&&linkedBones.has(b));
 let sample=null;
 for(const mesh of skinned){
  const inds=mesh.geometry.attributes.skinIndex;
  const w=mesh.geometry.attributes.skinWeight;
  if(!inds||!w)continue;
  const keys=new Set(hands.map(b=>mesh.skeleton.bones.indexOf(b)).filter(i=>i>=0));
  for(let v=0;v<inds.count&&!sample;v+=Math.max(1,Math.floor(inds.count/450)))
   for(let k=0;k<4;k++)
    if(keys.has(inds.getComponent(v,k))&&w.getComponent(v,k)>.35){
     sample={mesh,vertex:v,
      bone:mesh.skeleton.bones[inds.getComponent(v,k)].name,
      weight:w.getComponent(v,k)};break;
    }
  if(sample)break;
 }
 if(!sample)throw Error('R131 no original weighted visible arm mesh '+id);
 let frames=0,sourceWristTravel=0,maxWeightedArmVertexTravel=0;
 let wristFirst=null,vertexFirst=null;
 const pos=new THREE.Vector3();
 const update=()=>{
  frames++;
  instance.updateMatrixWorld(true);
  const wristL=find(sides.L.wrist);
  const wristR=find(sides.R.wrist);
  const now=[wristL,wristR].map(b=>b.getWorldPosition(new THREE.Vector3()));
  if(!wristFirst)wristFirst=now.map(v=>v.clone());
  sourceWristTravel=Math.max(sourceWristTravel,...now.map((v,i)=>v.distanceTo(wristFirst[i])));
  pos.fromBufferAttribute(sample.mesh.geometry.attributes.position,sample.vertex);
  sample.mesh.applyBoneTransform(sample.vertex,pos);
  if(!vertexFirst)vertexFirst=pos.clone();
  maxWeightedArmVertexTravel=Math.max(maxWeightedArmVertexTravel,
   pos.distanceTo(vertexFirst));
 };
 return{update,inspect:()=>({
  actor:id,source:'actual_original_author_skinned_arm_hierarchy',
  flatOriginal:FLAT.has(id),sourceSkinnedMeshes:skinned.length,
  sourceArmNodes:bones.size,changedParentLinks:changes.length,
  validatedParentLinks:verified.length,
  maxBindRestDrift:Math.max(...verified.map(x=>x.drift),0),
  wristBoneNames:[sides.L.wrist,sides.R.wrist],
  weightedOriginalMesh:sample.mesh.name,
  weightedOriginalBone:sample.bone,
  weightedOriginalVertex:sample.vertex,originalVertexWeight:+sample.weight.toFixed(4),
  frames,maxSourceWristTravel:+sourceWristTravel.toFixed(5),
  maxWeightedArmVertexTravel:+maxWeightedArmVertexTravel.toFixed(5)
 })};
}
