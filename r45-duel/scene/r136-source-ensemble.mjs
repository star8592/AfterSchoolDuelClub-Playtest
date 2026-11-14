/**
 * Four independently directed high-poly original Blender Studio weighted actors.
 * The source mesh, real DEF bones and original skin weights are retained.
 * Never build visual stand-ins or substitute a root-only wobble for movement.
 */
const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const STAGE=Object.freeze([
 ['R119_Skeletal_Idle','Idle'],['R119_Skeletal_Attack','Attack'],
 ['R119_Skeletal_Hit','Hit'],['R119_Skeletal_Walk','Walk'],
 ['R119_Skeletal_Challenge','Challenge'],
 ['R119_Skeletal_Worry','Worry'],['R119_Skeletal_Celebrate','Celebrate']
]);
const PROFILE=Object.freeze({
 E04:{
  name:'fast-relay-footwork',duration:3.8,speed:1.18,leg:1.45,
  bones:{spine:'DEF-Spine',chest:'DEF-Chest',head:'DEF-Head',
   left:'DEF-UpperArm1.L',right:'DEF-UpperArm1.R',
   elbowL:'DEF-Forearm1.L',elbowR:'DEF-Forearm1.R'},
  acts:{
   Idle:[-.06,-.08,-.09,-.17,.28,.24,-.22],
   Attack:[-.30,-.42,-.24,-.32,.57,.39,-.63],
   Hit:[.21,.28,.23,.24,-.26,.23,.20],
   Walk:[-.075,-.12,-.04,-.19,.22,.23,-.21],
   Challenge:[-.16,-.22,-.14,-.10,.21,.23,-.30],
   Worry:[.16,.20,.18,.13,-.16,.21,.15],
   Celebrate:[-.27,-.36,-.28,-.48,.62,.53,-.58]
  }
 },
 G02:{
  name:'blackboard-thinker-spell',duration:6.4,speed:.87,
  leg:1,
  bones:{spine:'DEF-Spine',chest:'DEF-Chest',neck:'DEF-Neck',head:'DEF-Head',
   left:'DEF-UpperArm_1.L',right:'DEF-UpperArm_1.R',
   elbowL:'DEF-Forearm_1.L',elbowR:'DEF-Forearm_1.R'},
  acts:{
   Idle:[.048,.072,-.04,-.24,-.22,.24,.27,-.32],
   Attack:[-.19,-.28,-.15,-.33,-.29,.58,.28,-.62],
   Hit:[.19,.25,.09,.28,.17,-.16,.16,.18],
   Walk:[.02,.035,.02,.04,.13,-.12,.13,-.12],
   Challenge:[-.06,-.08,-.04,-.18,-.17,.21,.15,-.26],
   Worry:[.17,.20,.07,.24,.14,-.14,.20,.16],
   Celebrate:[-.21,-.30,-.11,-.28,-.33,.60,.32,-.57]
  }
 },
 G04:{
  name:'commanding-planner-authority',duration:5.9,speed:.91,leg:1.35,
  bones:{spine:'DEF-Spine',chest:'DEF-Chest',neck:'DEF-Neck',head:'DEF-Head',
   left:'DEF-UpperArm1.L',right:'DEF-UpperArm1.R',
   elbowL:'DEF-Forearm1.L',elbowR:'DEF-Forearm1.R'},
  acts:{
   Idle:[-.028,-.065,-.03,.060,-.16,.19,.23,-.20],
   Attack:[-.24,-.37,-.13,-.19,-.37,.55,.35,-.58],
   Hit:[.18,.27,.10,.23,.25,-.13,.25,.18],
   Walk:[-.045,-.06,.008,.03,-.13,.14,.16,-.13],
   Challenge:[-.16,-.22,-.04,-.12,-.24,.23,.29,-.35],
   Worry:[.13,.23,.08,.18,.18,-.15,.18,.13],
   Celebrate:[-.24,-.32,-.13,-.27,-.39,.57,.37,-.56]
  }
 },
 T03:{
  name:'rapid-handoff-courier',duration:4.3,speed:1.22,leg:1,
  bones:{spine:'DEF-Spine1',chest:'DEF-Spine3',neck:'DEF-Neck',head:'DEF-Head',
   left:'DEF-Upperarm1.L',right:'DEF-Upperarm1.R',
   elbowL:'DEF-Forearm1.L',elbowR:'DEF-Forearm1.R'},
  acts:{
   Idle:[-.08,-.095,-.04,-.16,-.26,.30,.27,-.34],
   Attack:[-.31,-.40,-.13,-.26,-.38,.59,.36,-.62],
   Hit:[.21,.28,.11,.29,.18,-.22,.20,.23],
   Walk:[-.085,-.12,.025,.07,-.21,.24,.21,-.25],
   Challenge:[-.12,-.17,-.09,-.11,-.17,.29,.18,-.29],
   Worry:[.19,.23,.09,.27,.22,-.17,.19,.19],
   Celebrate:[-.29,-.38,-.14,-.27,-.42,.62,.39,-.60]
  }
 }
});
export const R136_PERSONALITIES=Object.freeze(Object.fromEntries(
 Object.entries(PROFILE).map(([k,x])=>[k,x.name])));
const UPPER=new Set(['left','right','elbowL','elbowR']);
export function createR136SourceClips(THREE,instance,original,id){
 const p=PROFILE[id];if(!p||original.length!==7)throw Error('R136 unsupported source '+id);
 const found=new Map();
 instance.traverse(o=>{if(o.isBone)found.set(norm(o.name),o)});
 const bones=Object.entries(p.bones).map(([role,name])=>{
  const bone=found.get(norm(name));
  if(!bone?.isBone)throw Error('R136 missing original source joint '+id+' '+name);
  return{role,bone,rest:bone.quaternion.clone()};
 });
 const X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
 const times=[0,.15,.31,.49,.66,.83,1],envelope=[0,.35,.83,1,.58,.23,0];
 const durations={Idle:p.duration,Attack:id==='G02'?1.29:1.13,
  Hit:id==='T03'?.82:1.12,Walk:2.1,
  Challenge:1.37,Worry:1.34,Celebrate:id==='E04'?1.50:1.65};
 return STAGE.map(([name,state])=>{
  if(!original.some(x=>x.name===name))throw Error('R136 original clip missing '+name);
  const peaks=p.acts[state],duration=durations[state];
  if(peaks.length!==bones.length)throw Error('R136 incomplete source roles '+id+'/'+state);
  const tracks=bones.map(({role,bone,rest},index)=>{
   const axes=UPPER.has(role)?Z:X,values=[];
   for(let i=0;i<times.length;i++){
    const t=times[i],ph=t*2*Math.PI;
    const a=state==='Idle'?peaks[index]*(
      Math.sin(ph-.45)*.77+Math.sin(ph*2+index*.39)*.23):
      state==='Walk'?peaks[index]*Math.sin(t*4*Math.PI):
      peaks[index]*envelope[i];
    const q=rest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axes,a));
    values.push(q.x,q.y,q.z,q.w);
   }
   return new THREE.QuaternionKeyframeTrack(bone.uuid+'.quaternion',
    times.map(t=>t*duration),values);
  });
  return new THREE.AnimationClip(name,duration,tracks);
 });
}
export function createR136EnsembleSequencer(THREE,instance,mixer,clips,id){
 const p=PROFILE[id];if(!p||clips.length!==7)throw Error('R136 sequencer unsupported '+id);
 const joint=new Map();
 instance.traverse(o=>{if(o.isBone)joint.set(norm(o.name),o)});
 const arms=Object.fromEntries(['L','R'].map(side=>{
  const upper=joint.get(norm(p.bones[side==='L'?'left':'right']));
  const forearm=joint.get(norm(p.bones[side==='L'?'elbowL':'elbowR']));
  const hand=joint.get(norm(id==='T03'?'DEF-Hand.'+side:'DEF-Wrist.'+side));
  if(!upper?.isBone||!forearm?.isBone||!hand?.isBone)
   throw Error('R136 original skinned source wrist missing '+id+'/'+side);
  return[side,{upper,forearm,hand}];
 }));
 const by=new Map(clips.map(c=>[c.name,c]));
 let current=null,action=null,age=0,transitions=0,returns=0,
  corrected=0,maxCorrection=0,frames=0;
 const history=[];
 const zero=new THREE.Vector3(),tip=new THREE.Vector3();
 const direction=new THREE.Vector3(),wanted=new THREE.Vector3();
 const worldQ=new THREE.Quaternion(),localQ=new THREE.Quaternion(),
  fix=new THREE.Quaternion();
 function posture(){
  instance.updateMatrixWorld(true);
  return Object.fromEntries(Object.entries(arms).map(([side,{upper,hand}])=>{
   upper.getWorldPosition(zero);hand.getWorldPosition(tip);
   const length=zero.distanceTo(tip);
   return[side,{
    down:+(length>0?(zero.y-tip.y)/length:0).toFixed(4),
    spread:+(length>0?Math.hypot(zero.x-tip.x,zero.z-tip.z)/length:0).toFixed(4)
   }];
  }));
 }
 function guard(){
  // Both arms cannot horizontally form a T; original hand/wrist is measured.
  instance.updateMatrixWorld(true);
  for(const[side,{upper,hand}]of Object.entries(arms)){
   upper.getWorldPosition(zero);hand.getWorldPosition(tip);
   direction.copy(tip).sub(zero);if(direction.lengthSq()<1e-8)continue;
   direction.normalize();
   const min=side==='L'?.41:(current==='R119_Skeletal_Attack'?.24:.35);
   if(-direction.y>=min)continue;
   const horizontal=Math.hypot(direction.x,direction.z);
   if(horizontal<1e-6)continue;
   const reach=Math.sqrt(1-min*min);
   wanted.set(direction.x/horizontal*reach,-min,direction.z/horizontal*reach);
   fix.setFromUnitVectors(direction,wanted);
   maxCorrection=Math.max(maxCorrection,2*Math.acos(Math.max(-1,Math.min(1,fix.w))));
   upper.parent.getWorldQuaternion(worldQ);
   localQ.copy(worldQ).invert().multiply(fix).multiply(worldQ);
   upper.quaternion.premultiply(localQ);
   instance.updateMatrixWorld(true);corrected++;
  }
 }
 function launch(name){
  const clip=by.get(name);if(!clip)return false;
  const looping=name==='R119_Skeletal_Idle'||name==='R119_Skeletal_Walk';
  if(name===current&&looping)return true;
  if(name===current&&action?.isRunning()&&!looping)return true;
  const next=mixer.clipAction(clip),prev=action;
  next.reset().setEffectiveWeight(1).setEffectiveTimeScale(p.speed);
  next.setLoop(looping?THREE.LoopRepeat:THREE.LoopOnce,looping?Infinity:1);
  next.clampWhenFinished=!looping;next.play();
  if(prev&&next!==prev){prev.crossFadeTo(next,.17,false);transitions++;}
  action=next;current=name;age=0;history.push(name);
  if(history.length>20)history.shift();
  return true;
 }
 const names={idle:'R119_Skeletal_Idle',attack:'R119_Skeletal_Attack',
  walk:'R119_Skeletal_Walk',hit:'R119_Skeletal_Hit',
  celebrate:'R119_Skeletal_Celebrate',death:'R119_Skeletal_Hit'};
 function update(dt){
  age+=Math.max(0,Math.min(.1,Number(dt)||0));
  frames++;guard();
  const clip=by.get(current);
  if(clip&&current!=='R119_Skeletal_Idle'&&current!=='R119_Skeletal_Walk'&&
   age>=clip.duration/p.speed-.21){
   returns++;launch('R119_Skeletal_Idle');
  }
 }
 function inspect(){
  return{enabled:true,identity:p.name,actor:id,
   source:'original_render_bound_weighted_blender_bones',
   currentClip:current,upperTracks:by.get(current)?.tracks.length||0,
   transitions,returns,frames,corrected,maxCorrection:+maxCorrection.toFixed(4),
   arms:posture(),history:history.slice(-10)};
 }
 return{play:kind=>launch(names[kind]||kind),playNamed:launch,update,inspect};
}
