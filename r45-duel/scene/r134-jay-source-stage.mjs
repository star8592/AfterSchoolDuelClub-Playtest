/**
 * R134 real-source Jay acting pass.
 * ALL channels below are original source Blender Studio weighted DEF bones.
 * There is no T-pose proxy, model swap, unbound helper rig or rule mutation.
 *
 * Frames: idle attention -> preparation -> punch/throw -> recoil -> recover,
 * with a continuous leg score supplied by the existing R129 source tracks.
 */
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const STAGE=Object.freeze({
 // A six-second, seamlessly looping performance rather than an imperceptible
 // 3-second breath: look at the opponent, check a vial, then shift posture.
 R119_Skeletal_Idle:{duration:6,
  times:[0,.65,1.35,2.1,2.85,3.45,4.2,5.05,6],
  poses:{
   spine:[0,.014,.045,.025,-.024,-.045,-.025,.012,0],
   chest:[0,-.025,-.055,-.035,.018,.035,.015,-.018,0],
   neck:[0,-.025,-.045,-.01,.026,.035,.004,-.01,0],
   head:[0,-.07,-.115,-.07,.075,.11,.02,-.035,0],
   left:[0,-.05,-.16,-.12,.03,.12,.025,-.04,0],
   right:[0,.015,.09,.17,.06,-.11,-.025,.05,0],
   elbowL:[0,.035,.12,.11,.025,-.07,-.01,.018,0],
   elbowR:[0,-.03,-.12,-.14,-.04,.085,.02,-.022,0]
  }},
 R119_Skeletal_Attack:{duration:1.17,
  times:[0,.12,.26,.43,.58,.79,1.02,1.17],
  poses:{
   spine:[0,-.055,-.13,-.19,-.14,-.065,.025,0],
   chest:[0,-.085,-.23,-.31,-.21,-.08,.02,0],
   neck:[0,-.035,-.10,-.18,-.13,-.035,.02,0],
   head:[0,-.07,-.13,-.23,-.14,-.015,.04,0],
   left:[0,-.025,-.055,-.075,-.05,-.01,.015,0],
   right:[0,.06,.16,.32,.26,.11,.035,0],
   elbowL:[0,.065,.18,.28,.18,.05,0,0],
   elbowR:[0,-.10,-.28,-.51,-.37,-.14,-.025,0]
  }},
 R119_Skeletal_Hit:{duration:.92,
  times:[0,.09,.22,.38,.55,.74,.92],
  poses:{
   spine:[0,.055,.19,.22,.12,.025,0],
   chest:[0,.11,.29,.32,.20,.055,0],
   neck:[0,.08,.16,.22,.11,.015,0],
   head:[0,.14,.29,.31,.14,-.015,0],
   left:[0,.035,.12,.21,.12,.03,0],
   right:[0,-.075,-.15,-.22,-.15,-.025,0],
   elbowL:[0,.07,.22,.24,.09,.01,0],
   elbowR:[0,.06,.17,.22,.11,.01,0]
  }},
 R119_Skeletal_Walk:{duration:2.25,
  times:[0,.32,.7,1.05,1.4,1.8,2.25],
  poses:{
   spine:[0,.025,0,-.025,0,.025,0],
   chest:[0,-.035,.015,.045,.012,-.035,0],
   neck:[0,-.01,.01,.02,.01,-.01,0],
   head:[0,-.025,.018,.035,.015,-.025,0],
   left:[0,-.12,.03,.13,.025,-.12,0],
   right:[0,.12,-.03,-.13,-.025,.12,0],
   elbowL:[0,.075,0,-.045,0,.075,0],
   elbowR:[0,-.075,0,.045,0,-.075,0]
  }},
 R119_Skeletal_Challenge:{duration:1.25,
  times:[0,.18,.42,.65,.93,1.25],
  poses:{
   spine:[0,-.06,-.11,-.1,-.025,0],
   chest:[0,-.075,-.17,-.12,-.025,0],
   neck:[0,-.025,-.05,-.035,0,0],
   head:[0,-.06,-.12,-.08,0,0],
   left:[0,-.04,-.10,-.07,-.01,0],
   right:[0,.07,.25,.33,.17,0],
   elbowL:[0,.06,.16,.10,.02,0],
   elbowR:[0,-.07,-.26,-.28,-.09,0]
  }},
 R119_Skeletal_Worry:{duration:1.12,
  times:[0,.13,.33,.54,.83,1.12],
  poses:{
   spine:[0,.07,.16,.095,.025,0],
   chest:[0,.14,.24,.14,.035,0],
   neck:[0,.065,.12,.06,.01,0],
   head:[0,.15,.26,.08,-.065,0],
   left:[0,.09,.25,.15,.045,0],
   right:[0,-.08,-.22,-.12,-.025,0],
   elbowL:[0,.04,.15,.08,.01,0],
   elbowR:[0,.07,.18,.12,.02,0]
  }},
 R119_Skeletal_Celebrate:{duration:1.45,
  times:[0,.20,.43,.7,1.02,1.26,1.45],
  poses:{
   spine:[0,-.075,-.15,-.09,.03,.015,0],
   chest:[0,-.13,-.25,-.17,.07,.045,0],
   neck:[0,-.035,-.08,-.03,.025,.01,0],
   head:[0,-.09,-.18,-.10,.085,.035,0],
   left:[0,-.045,-.12,-.10,.04,.025,0],
   right:[0,.09,.26,.36,.20,.05,0],
   elbowL:[0,.08,.20,.16,.035,.01,0],
   elbowR:[0,-.14,-.31,-.48,-.24,-.04,0]
  }}
});
const REAL_BONES=Object.freeze({
 spine:['DEF-Spine'],
 chest:['DEF-Chest'],neck:['DEF-Neck'],head:['DEF-Head'],
 left:['DEF-UpperArm1.L'],right:['DEF-UpperArm1.R'],
 elbowL:['DEF-Forearm1.L'],elbowR:['DEF-Forearm1.R']
});
export function createR134JayClips(THREE,instance,original){
 if(original.length!==7)throw Error('R134 Jay requires exactly seven source clips');
 const refs=new Map();
 instance.traverse(o=>{if(o.isBone)refs.set(norm(o.name),o)});
 const entries=Object.entries(REAL_BONES).map(([role,names])=>{
  const bone=names.map(n=>refs.get(norm(n))).find(Boolean);
  if(!bone)throw Error('R134 Jay source joint missing '+role);
  return[role,bone,bone.quaternion.clone()];
 });
 const axes={spine:new THREE.Vector3(0,0,1)};
 const X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
 return original.map(old=>{
  const config=STAGE[old.name];
  if(!config)throw Error('R134 missing source stage '+old.name);
  const {times,duration,poses}=config;
  if(times[0]!==0||times.at(-1)!==duration)throw Error('R134 bad clip timeline');
  const tracks=entries.map(([role,bone,rest])=>{
   const ang=poses[role];
   if(ang?.length!==times.length)throw Error('R134 incomplete real joint '+role);
   const axis=axes[role]||(['chest','head','neck'].includes(role)?X:Z);
   const values=[];
   for(const value of ang){
    if(Math.abs(value)>.8)throw Error('R134 source joint out of safe range '+role);
    const q=rest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis,value));
    values.push(q.x,q.y,q.z,q.w);
   }
   return new THREE.QuaternionKeyframeTrack(bone.uuid+'.quaternion',times,values);
  });
  return new THREE.AnimationClip(old.name,duration,tracks);
 });
}
/**
 * One-shot actions blend into the breathing source idle instead of freezing
 * on the last pose. It never calls setTimeout and never changes gameplay.
 */
export function createR134JaySequencer(THREE,mixer,clips,instance){
 const byName=new Map(clips.map(c=>[c.name,c]));
 const map={idle:'R119_Skeletal_Idle',attack:'R119_Skeletal_Attack',
  hit:'R119_Skeletal_Hit',walk:'R119_Skeletal_Walk',
  celebrate:'R119_Skeletal_Celebrate',death:'R119_Skeletal_Hit'};
 let current=null,currentName=null,age=0,transitions=0,autoIdleReturns=0;
 const events=[];
 const sourceArms={};
 const jointByName=new Map();
 instance.traverse(o=>{if(o.isBone)jointByName.set(norm(o.name),o)});
 for(const side of ['L','R']){
  // GLTFLoader may strip or normalize periods/underscores in node names.
  // Use the same canonical source-bone matching as the real R131 rig repair.
  const upper=jointByName.get(norm('DEF-UpperArm1.'+side));
  const wrist=jointByName.get(norm('DEF-Wrist.'+side));
  const elbow=jointByName.get(norm('DEF-Forearm1.'+side));
  if(!upper?.isBone||!wrist?.isBone||!elbow?.isBone)
   throw Error('R134 true source human arm missing '+side);
  sourceArms[side]={upper,wrist,elbow};
 }
 const p0=new THREE.Vector3(),p1=new THREE.Vector3(),p2=new THREE.Vector3();
 const sourcePose=()=>{
  instance.updateMatrixWorld(true);
  return Object.fromEntries(Object.entries(sourceArms).map(([side,a])=>{
   a.upper.getWorldPosition(p0);a.elbow.getWorldPosition(p1);
   a.wrist.getWorldPosition(p2);
   const length=p0.distanceTo(p2);
   const down=length>0?(p0.y-p2.y)/length:0;
   const spread=length>0?Math.hypot(p0.x-p2.x,p0.z-p2.z)/length:0;
   return[side,{down:+down.toFixed(4),spread:+spread.toFixed(4),
    elbowToWrist:+p1.distanceTo(p2).toFixed(4)}];
  }));
 };
 // A repaired Blender 5 source hierarchy can amplify an authored shoulder
 // quaternion until both weighted wrists look like a T-pose in mid-attack.
 // Correct the REAL upperarm FK joint in parent local space, using the ACTUAL
 // wrist-to-shoulder vector after the mixer. This guards silhouette quality
 // rather than merely checking the requested nominal quaternion delta.
 const parentWorld=new THREE.Quaternion(),localRotation=new THREE.Quaternion(),
  worldCorrection=new THREE.Quaternion(),rawDir=new THREE.Vector3(),
  desiredDir=new THREE.Vector3();
 let postureCorrections=0,maxPostureCorrection=0;
 function preventHorizontalArms(){
  // Right arm may reach forward, but both arms must never form a T.
  const mins=currentName==='R119_Skeletal_Attack'?{L:.47,R:.27}:
   currentName==='R119_Skeletal_Celebrate'?{L:.47,R:.29}:
   currentName==='R119_Skeletal_Hit'?{L:.38,R:.38}:
   {L:.41,R:.41};
  instance.updateMatrixWorld(true);
  for(const [side,{upper,wrist}] of Object.entries(sourceArms)){
   upper.getWorldPosition(p0);
   wrist.getWorldPosition(p2);
   rawDir.subVectors(p2,p0);
   if(rawDir.lengthSq()<1e-8)throw Error('R134 source arm has no length '+side);
   rawDir.normalize();
   const down=-rawDir.y,minDown=mins[side];
   if(down>=minDown)continue;
   const horizontal=Math.hypot(rawDir.x,rawDir.z);
   if(horizontal<1e-6)continue;
   const wantedHorizontal=Math.sqrt(1-minDown*minDown);
   desiredDir.set(rawDir.x/horizontal*wantedHorizontal,-minDown,
    rawDir.z/horizontal*wantedHorizontal);
   worldCorrection.setFromUnitVectors(rawDir,desiredDir);
   maxPostureCorrection=Math.max(maxPostureCorrection,worldCorrection.angleTo(
    new THREE.Quaternion()));
   upper.parent.getWorldQuaternion(parentWorld);
   localRotation.copy(parentWorld).invert().multiply(worldCorrection).multiply(parentWorld);
   upper.quaternion.premultiply(localRotation);
   instance.updateMatrixWorld(true);
   postureCorrections++;
  }
 }
 const record=(name)=>{events.push(name);if(events.length>20)events.shift()};
 function launch(name){
  const clip=byName.get(name);
  if(!clip)return false;
  const looping=['R119_Skeletal_Idle','R119_Skeletal_Walk'].includes(name);
  if(currentName===name&&looping)return true;
  if(currentName===name&&current&&current.isRunning()&&!looping)return true;
  const next=mixer.clipAction(clip);
  const previous=current;
  next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
  next.setLoop(looping?THREE.LoopRepeat:THREE.LoopOnce,looping?Infinity:1);
  next.clampWhenFinished=!looping;
  next.play();
  if(previous&&previous!==next){
   const fade=name==='R119_Skeletal_Hit'?.105:
    name==='R119_Skeletal_Idle'?.22:.145;
   previous.crossFadeTo(next,fade,false);
   transitions++;
  }
  current=next;currentName=name;age=0;record(name);
  return true;
 }
 function update(dt){
  const elapsed=Math.max(0,Math.min(.1,Number(dt)||0));
  age+=elapsed;
  // Source R129 lower-body bone keys and R131 hand hierarchy are combined
  // in the mixer before this advance callback; no independent leg override.
  preventHorizontalArms();
  const clip=byName.get(currentName);
  if(clip&&!['R119_Skeletal_Idle','R119_Skeletal_Walk'].includes(currentName)&&
   age>=clip.duration-.23){
   autoIdleReturns++;
   launch('R119_Skeletal_Idle');
  }
 }
 return{
  play:kind=>launch(map[kind]||kind),
  playNamed:name=>launch(name),
  update,
  inspect:()=>({enabled:true,source:'original_render_bound_source_bones',
   currentClip:currentName,transitions,autoIdleReturns,
   activeSeconds:+age.toFixed(3),recent:events.slice(-8),
   sourceArmDirections:sourcePose(),
   postureCorrections,maxPostureCorrection:+maxPostureCorrection.toFixed(4),
   sourceRigTrackCount:byName.get(currentName)?.tracks.length||0})
 };
}
