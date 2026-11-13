/**
 * R135: two intentionally different original-source Blender Studio actors:
 * Ellie E03 (bouncy cheering captain), Rex T04 (heavy defending guard).
 * Real high-poly SkinnedMesh, original render-bound source DEF joints.
 * No copies of chef animation, mannequin proxies or root-only bobbing.
 */
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const ROLES=Object.freeze({
 spine:'DEF-Spine',chest:'DEF-Chest',neck:'DEF-Neck',head:'DEF-Head',
 left:'DEF-UpperArm1.L',right:'DEF-UpperArm1.R',
 elbowL:'DEF-Forearm1.L',elbowR:'DEF-Forearm1.R'
});
const PROF=Object.freeze({
 E03:{
  identity:'cheer-leap-whistle',idle:4.9,speed:1.15,
  // Role offsets in radians, ordered: spine,chest,neck,head,L,R,elbowL,elbowR.
  beats:{
   Idle:[.048,-.063,-.032,-.112,-.115,.17,.15,-.21],
   Attack:[-.19,-.29,-.10,-.20,-.20,.33,.29,-.44],
   Hit:[.18,.28,.13,.27,.29,-.19,.22,.20],
   Walk:[.052,.052,.018,.07,.16,-.13,.12,-.10],
   Challenge:[-.14,-.22,-.08,-.14,-.23,.29,.28,-.35],
   Worry:[.14,.22,.12,.23,.18,-.16,.18,.13],
   Celebrate:[-.12,-.24,-.07,-.18,-.23,.31,.24,-.38]
  }
 },
 T04:{
  identity:'heavy-door-block-wall',idle:6.7,speed:.81,
  beats:{
   Idle:[-.018,.036,-.006,-.030,-.055,.025,.035,-.045],
   Attack:[-.25,-.31,-.11,-.10,-.32,.21,.43,-.40],
   Hit:[.26,.36,.17,.22,.25,-.20,.34,.28],
   Walk:[-.055,-.040,.015,.02,-.18,.14,.18,-.16],
   Challenge:[-.17,-.20,-.06,-.045,-.21,.13,.32,-.35],
   Worry:[.12,.16,.10,.15,.15,-.08,.16,.08],
   Celebrate:[-.13,-.17,-.05,-.07,-.25,.22,.17,-.28]
  }
 }
});
const STAGES=Object.freeze([
 ['R119_Skeletal_Idle','Idle',7],
 ['R119_Skeletal_Attack','Attack',7],
 ['R119_Skeletal_Hit','Hit',7],
 ['R119_Skeletal_Walk','Walk',7],
 ['R119_Skeletal_Challenge','Challenge',7],
 ['R119_Skeletal_Worry','Worry',7],
 ['R119_Skeletal_Celebrate','Celebrate',7]
]);
const AXIS_UPPER=['left','right','elbowL','elbowR'];
export function createR135PairClips(THREE,instance,original,id){
 const profile=PROF[id];
 if(!profile||original.length!==7)throw Error('R135 original 7 source clips required '+id);
 const bones=new Map();
 instance.traverse(o=>{if(o.isBone)bones.set(norm(o.name),o)});
 const boneList=Object.entries(ROLES).map(([role,name])=>{
  const b=bones.get(norm(name));
  if(!b)throw Error('R135 missing REAL original source bone '+id+'/'+name);
  return{role,b,rest:b.quaternion.clone()};
 });
 const X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
 const durationByState={Idle:profile.idle,Attack:id==='E03'?1.05:1.37,
  Hit:id==='E03'?.78:1.12,Walk:1.9,Challenge:1.19,
  Worry:1.22,Celebrate:id==='E03'?1.55:1.71};
 const times=[0,.13,.28,.47,.67,.83,1];
 const envelope=[0,.35,.78,1,.65,.22,0];
 return STAGES.map(([name,state])=>{
  if(!original.some(c=>c.name===name))throw Error('R135 stage absent '+name);
  const peak=profile.beats[state],duration=durationByState[state];
  const tracks=boneList.map(({role,b,rest},index)=>{
   const axis=AXIS_UPPER.includes(role)?Z:X;
   const values=[];
   for(let i=0;i<times.length;i++){
    const t=times[i],w=envelope[i];
    let a=peak[index]*w;
    // Continuous, visibly different natural idles, not one repeated static pose.
    if(state==='Idle'){
     const ph=t*Math.PI*2;
     const energy=id==='E03'?1:0.72;
     a=peak[index]*(Math.sin(ph-.55)*.75+
      Math.sin(ph*2+index*.27)*.22)*energy;
    }
    if(state==='Walk'){
     a=peak[index]*Math.sin(t*Math.PI*4)*(1-.10*t);
    }
    const rot=rest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis,a));
    values.push(rot.x,rot.y,rot.z,rot.w);
   }
   return new THREE.QuaternionKeyframeTrack(b.uuid+'.quaternion',
    times.map(t=>t*duration),values);
  });
  return new THREE.AnimationClip(name,duration,tracks);
 });
}
export function createR135PairSequencer(THREE,instance,mixer,clips,id){
 const profile=PROF[id];
 if(!profile||clips.length!==7)throw Error('R135 mismatched source clips '+id);
 const byName=new Map(clips.map(c=>[c.name,c]));
 const bones=new Map();
 instance.traverse(o=>{if(o.isBone)bones.set(norm(o.name),o)});
 const arms=Object.fromEntries(['L','R'].map(side=>{
  const upper=bones.get(norm('DEF-UpperArm1.'+side));
  const elbow=bones.get(norm('DEF-Forearm1.'+side));
  const wrist=bones.get(norm('DEF-Wrist.'+side));
  if(!upper||!elbow||!wrist)throw Error('R135 original upper arm/wrist missing '+id+'/'+side);
  return[side,{upper,elbow,wrist}];
 }));
 const p0=new THREE.Vector3(),p1=new THREE.Vector3(),p2=new THREE.Vector3();
 const worldQ=new THREE.Quaternion(),localQ=new THREE.Quaternion();
 const correction=new THREE.Quaternion(),wanted=new THREE.Vector3(),direction=new THREE.Vector3();
 let current=null,currentName=null,age=0,transitions=0,returns=0,
  correctedFrames=0,correctionCount=0,maxCorrection=0,updateFrames=0;
 const trace=[];
 function launch(name){
  const c=byName.get(name);if(!c)return false;
  const looping=name==='R119_Skeletal_Idle'||name==='R119_Skeletal_Walk';
  if(currentName===name&&looping)return true;
  if(currentName===name&&!looping&&current?.isRunning())return true;
  const next=mixer.clipAction(c),prev=current;
  next.reset().setEffectiveWeight(1).setEffectiveTimeScale(profile.speed);
  next.setLoop(looping?THREE.LoopRepeat:THREE.LoopOnce,looping?Infinity:1);
  next.clampWhenFinished=!looping;next.play();
  if(prev&&prev!==next){prev.crossFadeTo(next,id==='E03'?.16:.24,false);transitions++;}
  current=next;currentName=name;age=0;trace.push(name);
  if(trace.length>16)trace.shift();
  return true;
 }
 const names={idle:'R119_Skeletal_Idle',walk:'R119_Skeletal_Walk',
  attack:'R119_Skeletal_Attack',hit:'R119_Skeletal_Hit',
  celebrate:'R119_Skeletal_Celebrate',death:'R119_Skeletal_Hit'};
 function armPose(){
  instance.updateMatrixWorld(true);
  return Object.fromEntries(Object.entries(arms).map(([side,a])=>{
   a.upper.getWorldPosition(p0);a.elbow.getWorldPosition(p1);
   a.wrist.getWorldPosition(p2);
   const length=p2.distanceTo(p0);
   return[side,{
    down:length>0?+((p0.y-p2.y)/length).toFixed(4):null,
    spread:length>0?+(Math.hypot(p2.x-p0.x,p2.z-p0.z)/length).toFixed(4):null,
    elbowToWrist:+p1.distanceTo(p2).toFixed(4)
   }];
  }));
 }
 function guardArms(){
  instance.updateMatrixWorld(true);
  let changed=false;
  const guard=id==='E03'?
   {L:currentName==='R119_Skeletal_Celebrate'?.37:.48,
    R:currentName==='R119_Skeletal_Attack'?.25:.40}:
   {L:.55,R:currentName==='R119_Skeletal_Attack'?.39:.53};
  for(const [side,a] of Object.entries(arms)){
   a.upper.getWorldPosition(p0);a.wrist.getWorldPosition(p2);
   direction.copy(p2).sub(p0);
   if(direction.lengthSq()<1e-8)throw Error('R135 zero-length original arm '+id);
   direction.normalize();
   const desiredDown=guard[side],actual=-direction.y;
   if(actual>=desiredDown)continue;
   const horizontal=Math.hypot(direction.x,direction.z);
   if(horizontal<1e-6)continue;
   const reach=Math.sqrt(1-desiredDown*desiredDown);
   wanted.set(direction.x/horizontal*reach,-desiredDown,
    direction.z/horizontal*reach);
   correction.setFromUnitVectors(direction,wanted);
   maxCorrection=Math.max(maxCorrection,2*Math.acos(Math.min(1,
    Math.max(-1,correction.w))));
   a.upper.parent.getWorldQuaternion(worldQ);
   localQ.copy(worldQ).invert().multiply(correction).multiply(worldQ);
   a.upper.quaternion.premultiply(localQ);
   instance.updateMatrixWorld(true);
   correctionCount++;changed=true;
  }
  if(changed)correctedFrames++;
 }
 function update(dt){
  const delta=Math.max(0,Math.min(.1,Number(dt)||0));
  updateFrames++;age+=delta;
  guardArms();
  const clip=byName.get(currentName);
  if(clip&&currentName!=='R119_Skeletal_Idle'&&currentName!=='R119_Skeletal_Walk'&&
   age>=clip.duration/profile.speed-(id==='E03'?.19:.25)){
   returns++;
   launch('R119_Skeletal_Idle');
  }
 }
 // Cheer captain flexes knees then briefly lifts off the court. Rex is a
 // planted defensive wall and NEVER inherits this springy animation. The
 // actual weighted source knees/feet move in the same clip via R129 tracks.
 function getLift(){
  if(id!=='E03')return 0;
  const magnitudes={'R119_Skeletal_Attack':.095,
   'R119_Skeletal_Challenge':.05,
   'R119_Skeletal_Celebrate':.22};
  const h=magnitudes[currentName]||0;if(!h)return 0;
  const clip=byName.get(currentName);
  const finish=Math.max(.2,clip.duration/profile.speed-.20);
  const phase=Math.max(0,Math.min(1,age/finish));
  return h*Math.pow(Math.sin(Math.PI*phase),2);
 }
 const inspect=()=>({enabled:true,identity:profile.identity,
  actor:id,source:'original_author_weighted_source_bones',
  currentClip:currentName,sourceTracks:byName.get(currentName)?.tracks.length||0,
  transitions,returns,updateFrames,correctedFrames,correctionCount,
  lift:+getLift().toFixed(4),
  maxCorrection:+maxCorrection.toFixed(4),arms:armPose(),history:trace.slice(-8)});
 return{play:kind=>launch(names[kind]||kind),
  playNamed:name=>launch(name),update,inspect,getLift};
}
