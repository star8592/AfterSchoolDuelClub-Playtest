/**
 * R128 · E04/Phil 1st genuine full-body actor pilot.
 * Augment the 7 existing *real source-rig* R119 clips. These are actual
 * source thigh/knee/ankle/foot deform-bone UUIDs with skinned vertices,
 * not root rotations, mannequin proxies, camera movement or fake counters.
 * Research opt-in only, until source-closeup and floor contact art approval.
 */
/**
 * Reconnect original flat-export source joints. Object3D.attach keeps
 * each bone at its source world bind pose while restoring parent chains.
 * Weighted meshes and inverse bind matrices remain untouched.
 */
export function repairR128PhilSourceHierarchy(THREE,instance,id='E04'){
 const norm=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const all=new Map();
 instance.traverse(node=>{if(node.isBone)all.set(norm(node.name),node)});
 const chainNames=['Thigh1','Thigh2','Knee1','Knee2','Foot','Toes'];
 const legs={};
 instance.updateMatrixWorld(true);
 for(const side of ['L','R']){
  const names=chainNames.map(seg=>'DEF-'+seg+'.'+side);
  const chain=names.map(name=>all.get(norm(name)));
  if(chain.some(x=>!x))throw Error('R128 missing original joints '+names.join('>'));
  const parent=chain[0].parent;
  if(chain.slice(1).some(x=>x.parent!==parent))
   throw Error('R128 expected the source flat skeleton, found different rig hierarchy');
  const before=chain.map(x=>x.getWorldPosition(new THREE.Vector3()));
  for(let i=1;i<chain.length;i++){
   chain[i-1].attach(chain[i]);
   instance.updateMatrixWorld(true);
  }
  const after=chain.map(x=>x.getWorldPosition(new THREE.Vector3()));
  const drift=Math.max(...before.map((x,i)=>x.distanceTo(after[i])));
  if(drift>.0001)throw Error('R128 invalid rest-pose drift '+side+' '+drift);
  legs[side]={names,restDrift:drift};
 }
 return{sourceHierarchyRepaired:true,chains:legs};
}
export function createR128PhilSourceFullBody(THREE,instance,originalClips,id='E04',
 {directorAmplify=1,directorVariant=null}={}){
 const canonical=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 // Source animation profiles are per-character, not clones of a single child.
 // Controlled upper-body R119 motions already contain distinct personalities.
 const strengths=Object.freeze({
  E04:1.00, E03:1.25, G03:1.09, G04:.74, T04:1.18
 });
 if(!Object.hasOwn(strengths,id))throw Error('R129 unsupported flat original source rig '+id);
 // Exact original source leg deformation; boost ONLY explicit R135 actor pilots.
 // Default stays bit-for-bit compatible with R128-R134 study behavior.
 if(!Number.isFinite(directorAmplify)||directorAmplify<1||directorAmplify>1.65)
  throw Error('R135 invalid source leg director amplification');
 const lowerBodyStrength=strengths[id]*directorAmplify;
 // R139 is confined to Victoria's explicitly enabled original-skinned pilot.
 // It must never mutate R97 defaults, E04/G03/E03/T04, or previous source QA.
 if(directorVariant!==null&&!(id==='G04'&&directorVariant==='r139Victoria'))
  throw Error('R139 source-specific director only supports Victoria');
 const victoria=directorVariant==='r139Victoria';

 const skinned=[];const boneSet=new Set();
 instance.traverse(mesh=>{
  if(!mesh.isSkinnedMesh)return;
  skinned.push(mesh);
  for(const bone of mesh.skeleton.bones)if(bone)boneSet.add(bone);
 });
 const names=[
  'DEF-Thigh1.L','DEF-Thigh1.R','DEF-Knee1.L','DEF-Knee1.R',
  'DEF-Foot.L','DEF-Foot.R','DEF-Toes.L','DEF-Toes.R'
 ];
 const bones=names.map(name=>[name,[...boneSet].find(b=>canonical(b.name)===canonical(name))]);
 const missing=bones.filter(([,bone])=>!bone).map(([name])=>name);
 if(missing.length||originalClips.length!==7)
  throw Error('R128 Phil original SOURCE skin bone requirement: '+missing.join(','));
 const original=new Map(bones.map(([name,b])=>[name,b.quaternion.clone()]));
 const stance=Object.freeze({
  // All angles are bounded local-axis rotations of real source bones.
  // Ordered story beats are settle → anticipatory weight → step/recoil
  // → landing cushion → exact source-neutral. No root translations.
  'R119_Skeletal_Idle':[
   [0,.014,.011,0,-.012], [0,-.012,-.009,0,.011],
   [0,.015,.016,0,-.012], [0,-.013,-.012,0,.011],
   [0,-.008,-.005,0,.006], [0,.007,.006,0,-.004],
   [0,0,0,0,0],[0,0,0,0,0]
  ],
  'R119_Skeletal_Attack':[
   [0,-.12,-.25,-.10,0],[0,.04,.16,.06,0],
   [0,.13,.28,.19,0],[0,.02,.12,.09,0],
   [0,-.04,-.16,-.06,0],[0,.02,-.07,-.02,0],
   [0,-.04,-.08,-.03,0],[0,.01,.025,.01,0]
  ],
  'R119_Skeletal_Hit':[
   [0,.14,.25,.09,0],[0,-.035,-.10,-.04,0],
   [0,.11,.30,.15,0],[0,.03,.10,.05,0],
   [0,-.06,-.18,-.08,0],[0,-.02,-.05,-.025,0],
   [0,-.02,-.05,-.02,0],[0,0,0,0,0]
  ],
  'R119_Skeletal_Walk':[
   [0,.20,-.20,.20,0],[0,-.20,.20,-.20,0],
   [0,.28,.06,.22,0],[0,.06,.28,.04,0],
   [0,-.12,.10,-.13,0],[0,.10,-.12,.10,0],
   [0,-.04,.045,-.04,0],[0,.045,-.04,.045,0]
  ],
  'R119_Skeletal_Challenge':[
   [0,-.05,-.11,-.05,0],[0,.02,.06,.03,0],
   [0,.03,.12,.06,0],[0,.02,.08,.04,0],
   [0,-.015,-.05,-.02,0],[0,-.01,-.045,-.018,0],
   [0,0,0,0,0],[0,0,0,0,0]
  ],
  'R119_Skeletal_Worry':[
   [0,.07,.14,.04,0],[0,.03,.08,.02,0],
   [0,.10,.19,.06,0],[0,.06,.16,.05,0],
   [0,-.04,-.08,-.025,0],[0,-.02,-.06,-.015,0],
   [0,0,0,0,0],[0,0,0,0,0]
  ],
  'R119_Skeletal_Celebrate':[
   [0,-.10,-.18,-.05,0],[0,-.08,-.13,-.04,0],
   [0,.10,.22,.08,0],[0,.11,.22,.08,0],
   [0,-.055,-.09,-.035,0],[0,-.055,-.09,-.035,0],
   [0,-.025,-.055,-.02,0],[0,-.025,-.055,-.02,0]
  ]
 });
 // Director's five-beat court choreography, indexed to the ACTUAL original
 // thigh/knee/boot/toe bone order (left then right). Victoria announces with
 // a counterstep, absorbs a setback through both knees, then recovers proud.
 // These are additional genuine source-joint rotations, not root hopping.
 const victoriaStance={
  'R119_Skeletal_Idle':[
   [0,-.025,.024,-.013,0],[0,.022,-.020,.011,0],
   [0,.020,.045,.018,0],[0,.016,.037,.015,0],
   [0,-.012,-.025,-.014,0],[0,-.012,-.021,-.012,0],
   [0,0,.008,0,0],[0,0,.008,0,0]],
  'R119_Skeletal_Attack':[
   [0,-.21,-.44,-.26,0],[0,.10,.28,.10,0],
   [0,.19,.45,.25,0],[0,.035,.21,.085,0],
   [0,-.08,-.24,-.11,0],[0,.06,-.11,-.04,0],
   [0,-.03,-.08,-.035,0],[0,.03,.05,.025,0]],
  'R119_Skeletal_Hit':[
   [0,.17,.39,.18,0],[0,-.11,-.26,-.095,0],
   [0,.19,.46,.22,0],[0,.12,.29,.15,0],
   [0,-.05,-.19,-.07,0],[0,-.035,-.10,-.04,0],
   [0,-.02,-.055,-.03,0],[0,0,-.018,0,0]],
  'R119_Skeletal_Walk':[
   [0,.25,-.26,.25,0],[0,-.23,.24,-.23,0],
   [0,.29,.055,.23,0],[0,.055,.28,.05,0],
   [0,-.16,.12,-.16,0],[0,.13,-.15,.13,0],
   [0,-.05,.055,-.05,0],[0,.045,-.045,.045,0]],
  'R119_Skeletal_Challenge':[
   [0,-.08,-.18,-.09,0],[0,.055,.13,.06,0],
   [0,.065,.21,.10,0],[0,.04,.15,.08,0],
   [0,-.025,-.09,-.04,0],[0,-.02,-.06,-.03,0],
   [0,0,-.025,0,0],[0,0,.013,0,0]],
  'R119_Skeletal_Worry':[
   [0,.14,.29,.16,0],[0,.065,.17,.08,0],
   [0,.16,.34,.15,0],[0,.10,.24,.11,0],
   [0,-.07,-.16,-.07,0],[0,-.04,-.11,-.05,0],
   [0,0,-.03,0,0],[0,0,-.02,0,0]],
  'R119_Skeletal_Celebrate':[
   [0,-.19,-.37,-.18,0],[0,-.16,-.31,-.15,0],
   [0,.18,.39,.19,0],[0,.19,.38,.18,0],
   [0,-.09,-.20,-.09,0],[0,-.09,-.19,-.085,0],
   [0,-.04,-.07,-.035,0],[0,-.04,-.07,-.035,0]]
 };
 const victoriaRoll={
  Attack:[0,-.035,-.10,-.05,0],
  Hit:[0,.035,.11,.06,0],
  Walk:[0,.035,-.035,.035,0],
  Challenge:[0,-.018,-.055,-.028,0],
  Worry:[0,.02,.065,.03,0],
  Celebrate:[0,-.035,-.09,-.035,0],
  Idle:[0,.006,.01,.006,0]
 };
 const clips=originalClips.map(base=>{
  const sequences=victoria?victoriaStance[base.name]:stance[base.name];
  if(!sequences)throw Error('R128 unexpected R119 clip '+base.name);
  const count=sequences[0].length;
  const times=Array.from({length:count},(_,i)=>base.duration*i/(count-1));
  const tracks=bones.map(([name,bone],index)=>{
   const angles=sequences[index];
   if(angles.length!==count)throw Error('R128 malformed '+base.name);
   const sourceQ=original.get(name),arr=[];
   for(let i=0;i<angles.length;i++){
    const q=sourceQ.clone().multiply(
     new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),
       angles[i]*lowerBodyStrength));
    if(victoria&&(index<2||index===4||index===5)){
     const state=base.name.replace('R119_Skeletal_','');
     const roll=victoriaRoll[state][i]*(index===0?1:index===1?-.8:index===4?.35:-.35);
     q.multiply(new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0,0,1),roll));
    }
    arr.push(q.x,q.y,q.z,q.w);
   }
   return new THREE.QuaternionKeyframeTrack(bone.uuid+'.quaternion',times,arr);
  });
  return new THREE.AnimationClip(base.name,base.duration,[...base.tracks,...tracks]);
 });
 // Locate original, visibly weighted *leg* vertices. A driven bone without
 // render-bound skin weights is NOT accepted as a movement result.
 const candidates=[];
 for(const mesh of skinned){
  const inds=mesh.geometry.attributes.skinIndex;
  const weights=mesh.geometry.attributes.skinWeight;
  if(!inds||!weights)continue;
  for(const name of ['DEF-Thigh1.L','DEF-Knee1.L','DEF-Foot.L']){
   const target=bones.find(([n])=>n===name)[1];
   const joint=mesh.skeleton.bones.indexOf(target);
   if(joint<0)continue;
   for(let v=0;v<inds.count;v+=Math.max(1,Math.floor(inds.count/300))){
    for(let k=0;k<4;k++)if(inds.getComponent(v,k)===joint&&weights.getComponent(v,k)>.35){
     candidates.push({mesh,index:v,bone:name,weight:weights.getComponent(v,k)});
     break;
    }
    if(candidates.length>=3)break;
   }
   if(candidates.length>=3)break;
  }
  if(candidates.length>=3)break;
 }
 if(!candidates.length)throw Error('R128 source leg joint has ZERO weighted visible vertices');
 const sample=candidates[0];
 const vertex=new THREE.Vector3();
 const originalPose=new Map(bones.map(([name,b])=>[name,b.quaternion.clone()]));
 let frames=0,independentLegFrames=0,maxJointAngle=0,maxLegVertexTravel=0;
 let first=null,maxFootHeightSpan=0,footBase=null;
 const feet=bones.filter(([name])=>name.startsWith('DEF-Foot')).map(([,b])=>b);
 const update=()=>{
  frames++;
  for(const [name,b] of bones){
   const angle=originalPose.get(name).angleTo(b.quaternion);
   maxJointAngle=Math.max(maxJointAngle,angle);
   if(angle>.035)independentLegFrames++;
  }
  vertex.fromBufferAttribute(sample.mesh.geometry.attributes.position,sample.index);
  sample.mesh.applyBoneTransform(sample.index,vertex);
  if(!first)first=vertex.clone();
  maxLegVertexTravel=Math.max(maxLegVertexTravel,vertex.distanceTo(first));
  instance.updateWorldMatrix(true,true);
  const footHeights=feet.map(b=>b.getWorldPosition(new THREE.Vector3()).y);
  if(!footBase)footBase=footHeights;
  const span=Math.max(...footHeights.map((y,i)=>Math.abs(y-footBase[i])));
  maxFootHeightSpan=Math.max(maxFootHeightSpan,span);
 };
 return{clips,update,inspect:()=>({
  source:'real_original_skinned_deform_bones',actor:id,
  sourceSkinnedMeshes:skinned.length,sourceBoneCount:boneSet.size,
  independentLegBones:bones.map(([name])=>name),runtimeLegTracks:8,
  weightedSourceLegMesh:sample.mesh.name,weightedSourceLegBone:sample.bone,
  weightedSourceLegVertex:sample.index,weightedSourceLegVertexWeight:+sample.weight.toFixed(4),
  frames,independentLegFrames,
  maxJointAngle:+maxJointAngle.toFixed(4),maxLegVertexTravel:+maxLegVertexTravel.toFixed(5),
  maxFootHeightSpan:+maxFootHeightSpan.toFixed(5)
 })};
}
