/**
 * R61 playability-only resource registry, not a final art approval.
 * All 10 GLB files are standalone inside r45-duel/assets/summons.
 * E01/G01 remain the existing unique source VRM rigs.
 */
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {createSummonPose,PERSONALITY_BEATS} from './summon-poses.mjs';
import {createMusicTeacherPose} from './music-teacher-pose.mjs';
export const UNIT_MODEL_SPECS=Object.freeze({
 // targetHeight is a game-relative visual scale, NOT a raw STL meter value.
 // maxFootprint prevents flat models (E02) from blanketing adjacent lanes.
 E02:{file:'E02-PaperPlane-R57.glb',label:'拐弯纸飞机',targetHeight:.42,maxWidth:1.75,maxDepth:1.75,hover:.48,kind:'object'},
 E03:{file:'E03-CheerCaptain-Phil-R85-Acting.glb',label:'加油队长',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 E04:{file:'E04-CanteenRelay-Gabby-R85-Acting.glb',label:'食堂接力员',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 G02:{file:'G02-BlackboardExpert-Lunte-R85-Acting.glb',label:'黑板密码专家',targetHeight:2.08,maxWidth:3.55,kind:'character'},
 G03:{file:'G03-Jay-BlenderStudio-R85-Acting.glb',label:'实验学长',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 G04:{file:'G04-ClubDirector-Victoria-R85-Acting.glb',label:'社团计划总监',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 M01:{file:'M01-MusicTeacher-PolyforkSchoolTeacher.glb',label:'音乐老师',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 M02:{file:'M02-CafeteriaAunt-CartoonR76.glb',label:'食堂阿姨',targetHeight:2.07,maxWidth:2.35,kind:'character'},
 T01:{file:'T01-BroadcastOwl-PolyforkRadio-R73.glb',label:'猫头鹰播音员',targetHeight:1.15,maxWidth:1.42,kind:'creature'},
 T02:{file:'T02-LivingMenu-R59.glb',label:'食堂隐藏菜单',targetHeight:1.47,maxWidth:1.12,kind:'object'},
 T03:{file:'T03-MailPair-Ellie-R85-Acting.glb',label:'默契收发员',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 T04:{file:'T04-Rex-BlenderStudio-R85-Acting.glb',label:'活动室守门人',targetHeight:2.08,maxWidth:3.15,kind:'character'}
});
export const UNIT_MODEL_IDS=Object.freeze(Object.keys(UNIT_MODEL_SPECS));
const smooth=x=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v)};
// M01 is not a Gobkit generic rig. Keep the real Polyfork three-joint arms
// and the tested R69 two-bone wrist goals, including while facing either camp.
function createMusicTeacherSummonPose(THREE,model){
 const ik=createMusicTeacherPose(THREE,model);
 let elapsed=0,frames=0,entranceAmount=0,gestureAmount=0,combatTime=0;
 const apply=(dt,kind)=>{
  elapsed+=Math.max(0,dt);frames++;
  combatTime=Math.max(0,combatTime-Math.max(0,dt));
  entranceAmount=kind==='idle'?smooth((elapsed-.10)/.35)*
   (1-smooth((elapsed-1.54)/.7)):0;
  const t=(elapsed+2.9)%10.4;
  gestureAmount=kind==='idle'?smooth((t-2.3)/.45)*(1-smooth((t-3.45)/.6)):0;
  const strength=combatTime>0?.65:Math.max(0,.07+.22*entranceAmount+.14*gestureAmount);
  ik.apply(strength);
 };
 const inspect=()=>({name:'音乐老师 · 点头打拍子',weight:1,frames,
  entranceAmount:+entranceAmount.toFixed(3),gestureAmount:+gestureAmount.toFixed(3),
  arms:Object.entries(ik.inspect()).map(([side,m])=>({side,...m}))});
 const reset=()=>{elapsed=frames=entranceAmount=gestureAmount=combatTime=0};
 return{apply,inspect,reset,pulseCombat:()=>{combatTime=.50},
  get entranceAmount(){return entranceAmount},get gestureAmount(){return gestureAmount}};
}

export async function preloadSummonModels(THREE,loader){
 const loaded=await Promise.all(UNIT_MODEL_IDS.map(async id=>{
  const spec=UNIT_MODEL_SPECS[id];
  const url=new URL('../assets/summons/'+spec.file,import.meta.url);
  const gltf=await loader.loadAsync(url.href);
  const source=gltf.scene;
  source.updateMatrixWorld(true);
  // GLTF morph targets expand geometry.boundingBox beyond current actual
  // vertices. Conservative Box3 produced floating feet / wrong scale even
  // when all morph influence values were zero. Use precise source geometry
  // for R85 native artist morphs, preserving older rigs' fitting policy.
  const isArtistMorph=/-R85-Acting\.glb$/.test(spec.file);
  const bounds=new THREE.Box3().setFromObject(source,isArtistMorph);
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(bounds.isEmpty()||!Number.isFinite(size.y)||size.y<.02)throw Error('Invalid actual GLB bounds for '+id);
  let meshes=0;
  source.traverse(o=>{if(o.isMesh){meshes++;o.frustumCulled=false;}});
  if(!meshes)throw Error('Empty GLB meshes for '+id);
  const scale=Math.min(spec.targetHeight/size.y,
   spec.maxWidth?spec.maxWidth/size.x:Infinity,
   spec.maxDepth?spec.maxDepth/size.z:Infinity);
  return[id,{id,spec,source,clips:gltf.animations,scale,
   measured:{width:size.x,height:size.y,depth:size.z,
    scaledHeight:size.y*scale,scaledWidth:size.x*scale,scaledDepth:size.z*scale},
   center:new THREE.Vector3(center.x,bounds.min.y,center.z),meshes,url:url.pathname}];
 }));
 const models=new Map(loaded);
 if(models.size!==UNIT_MODEL_IDS.length||models.size!==12)throw Error('R76 expected twelve independently sourced summoned GLBs');
 return models;
}
export function instantiateSummon(THREE,template){
 const instance=cloneSkeleton(template.source);
 instance.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
 // Center and seat source mesh at arena floor, while keeping source skeleton
 // transform and animation binding intact under the original model root.
 instance.position.set(-template.center.x,-template.center.y,-template.center.z);
 const scaled=new THREE.Group();scaled.scale.setScalar(template.scale);scaled.add(instance);
 const root=new THREE.Group();root.add(scaled);
 root.name='R61_ACTUAL_GLTF_SUMMON_'+template.id;
 const mixer=template.clips.length?new THREE.AnimationMixer(instance):null;
 // R80: user-approved film-quality geometry is ahead of legacy Gobkit looks.
 // Exported film shader meshes have zero GLB bone clips: do NOT claim native animation.
 // Small, reversible root motions keep turn-combat responsive until retargeted rigs land.
 const expectsArtistMorph=/-R85-Acting\.glb$/.test(template.spec.file);
 const filmStatic=expectsArtistMorph&&!template.clips.length;
 // R85: movement is genuinely derived from the original Blender Studio
 // shoulder/wrist rig, baked to THREE morph targets on the artist mesh.
 // No torso-shaped proxy geometry or generic fake shoulder rotation.
 const morphMeshes=[];
 if(filmStatic){
  instance.traverse(o=>{
   if(!o.isMesh||!o.morphTargetDictionary||!o.morphTargetInfluences)return;
   if(['show','attack','hit'].every(n=>Number.isInteger(o.morphTargetDictionary[n])))
    morphMeshes.push(o);
  });
  if(morphMeshes.length<8)throw Error('R85 artist-animated morph targets missing '+template.id);
 }
 let staticPhase=0,staticAge=0,staticState='idle';
 const staticDurations={attack:.72,hit:.54,walk:.66,death:.95,gesture:.78};
 const pose=filmStatic?null:template.id==='M01'?createMusicTeacherSummonPose(THREE,instance):
  createSummonPose(THREE,instance,template.id);
 const characterBeat=PERSONALITY_BEATS[template.id];
 const nativeBeat=characterBeat?.native&&template.clips.some(c=>c.name===characterBeat.native)
  ?characterBeat:null;
 const choose=(kind)=>{
  if(!mixer)return null;
  const clips=template.clips;
  const preference=template.id==='M02'?(kind==='attack'?['Grip_and_Throw_Down','Angry_Stomp']:kind==='hit'?['Angry_Stomp']:kind==='walk'?['Big_Wave_Hello']:kind==='death'?['Shrug']:['Idle']):
   kind==='gesture'&&nativeBeat?[nativeBeat.native]:
   kind==='attack'?['Attack_Flip_Menu','Attack','attack','Special','Cheer']:
   kind==='hit'?['Hit_Retreat','Hit','hit']:
   kind==='death'?['Death','dead']:
   kind==='walk'?['Walk_Small_Steps','Walk','walk','Run']:
     ['Idle_Menu_Breath','Idle','idle','Stand'];
  return preference.map(n=>clips.find(c=>c.name===n||c.name.startsWith(n+'.'))).find(Boolean)||clips[0];
 };
 // Preserve animation continuity. R63's stopAllAction() teleported bones
 // from one source clip to another on every attack/hit/idle transition.
 // A short cross-fade keeps source-authored motion, with no invented mesh.
 let current=null,activeAction=null,transitions=0,gestureClock=nativeBeat?.offset||0,gestureTime=0,gestureCount=0;
 // The source 'Scratch/Explain/Salute' clips include root translations;
 // keep the fighter's feet on the arena and within its own summoning lane.
 let settleTime=0,restCenter=null;
 const boxMotion=new THREE.Box3(),vecCenter=new THREE.Vector3(),vecGoal=new THREE.Vector3(),vecRootPos=new THREE.Vector3();
 const vecCorrection=new THREE.Vector3(),quatWorld=new THREE.Quaternion();
 const fading=new Map();
 const update=(dt)=>{
  if(filmStatic){
   const step=Math.max(0,Math.min(dt,.09));
   staticPhase+=step;staticAge+=step;
   if(staticState!=='idle'&&staticAge>=(staticDurations[staticState]||.8)){
    staticState='idle';staticAge=0;current='R85_artist_idle';
   }
   const cycle=staticState==='idle'?.012*Math.sin(staticPhase*1.5):0;
   const t=staticAge/Math.max(.01,staticDurations[staticState]||1);
   const pulse=staticState==='idle'?0:Math.sin(Math.PI*Math.min(1,t));
   scaled.rotation.x=cycle+(staticState==='attack'?-.10*pulse:staticState==='hit'?.065*pulse:0);
   scaled.rotation.z=.006*Math.sin(staticPhase*.86)+(staticState==='attack'?.075*pulse:staticState==='hit'?-.08*pulse:0);
   scaled.position.y=staticState==='walk'?.055*Math.abs(Math.sin(staticAge*12)):0;
   // Native artist action-posed vertices form a smoothly interpolated
   // character animation: show/card gesture, attack swing and hit guard.
   // Transition in and out rather than locking at an endpoint.
   const enter=Math.min(1,Math.max(0,staticAge/.14));
   const release=Math.min(1,Math.max(0,(staticDurations[staticState]-staticAge)/.23));
   const weight=staticState==='idle'?0:Math.min(enter,release);
   const ambient=staticState==='idle'?Math.max(0,Math.sin(staticPhase*.9))*.055:0;
   const animationWeight={
    show:staticState==='gesture'?weight:ambient,
    attack:staticState==='attack'?weight:0,
    hit:staticState==='hit'?weight:0
   };
   for(const mesh of morphMeshes){
    for(const name of ['show','attack','hit']){
     const index=mesh.morphTargetDictionary[name];
     mesh.morphTargetInfluences[index]=animationWeight[name];
    }
   }
   return;
  }
  if(!mixer)return;
  mixer.update(dt);
  // Built-in character acting where the GLB provides a real authored clip.
  // Only in idle: never interrupt a fight event or impose a prop/hand pose.
  if(nativeBeat){
   gestureClock+=dt;
   if(gestureTime>0){
    gestureTime=Math.max(0,gestureTime-dt);
    if(gestureTime===0&&current===nativeBeat.native){
     settleTime=1.05;play('idle');
    }
   }else if((current==='Idle'||current==='idle')&&gestureClock>=nativeBeat.period){
    gestureClock=0;
    if(play('gesture')){gestureTime=nativeBeat.duration;settleTime=1.05;gestureCount++;}
   }
  }
  pose?.apply(dt,current==='Idle'||current==='idle'?'idle':'action');
  const proceduralGesture=pose?.gestureAmount||0;
  if(proceduralGesture>.018)settleTime=Math.max(settleTime,1.05);
  // Even authored Idle moves the source's lowest vertices by 0.1+ units;
  // continually seat human feet. Only gesture clips get horizontal anchoring.
  const isIdle=current==='Idle'||current==='idle';
  if(restCenter&&pose&&(isIdle||gestureTime>0||settleTime>0)){
   // The source's moving hand can become its lowest vertex. Re-seat the
   // actual posed mesh so feet and props do not drift above/under the floor.
   // Root correction uses world coordinates, then transforms back into the
   // source's local axes, independent of player/AI facing or camera orbit.
   root.updateMatrixWorld(true);
   boxMotion.setFromObject(scaled,true);
   // The source-art Idle and brief entrance rigs can differ by up to 20%
   // in actual skinned AABB. Normalize the *whole rig uniformly* during the
   // entry only, retaining the same proven 2.035-world-unit scale contract.
   // As the pose relaxes this naturally returns to the stable idle scale;
   // do not stretch only the legs, replace geometry or loosen the QA gate.
   if(pose.entranceAmount>.02&&isIdle){
    const posedH=boxMotion.max.y-boxMotion.min.y;
    if(Number.isFinite(posedH)&&posedH>.2){
     const factor=THREE.MathUtils.clamp(2.035/posedH,.72,1.26);
     if(Math.abs(factor-1)>.001){
      scaled.scale.multiplyScalar(factor);
      scaled.updateWorldMatrix(true,true);
      boxMotion.setFromObject(scaled,true);
     }
    }
   }
   boxMotion.getCenter(vecCenter);
   vecGoal.copy(restCenter).applyMatrix4(root.matrixWorld);
   root.getWorldPosition(vecRootPos);
   const lockLane=!!nativeBeat&&(gestureTime>0||settleTime>0);
   vecCorrection.set(lockLane?vecGoal.x-vecCenter.x:0,
    vecRootPos.y-boxMotion.min.y,
    lockLane?vecGoal.z-vecCenter.z:0);
   vecCorrection.x=THREE.MathUtils.clamp(vecCorrection.x,-.10,.10);
   vecCorrection.y=THREE.MathUtils.clamp(vecCorrection.y,-.48,.48);
   vecCorrection.z=THREE.MathUtils.clamp(vecCorrection.z,-.10,.10);
   root.getWorldQuaternion(quatWorld).invert();
   vecCorrection.applyQuaternion(quatWorld);
   scaled.position.add(vecCorrection);
   settleTime=Math.max(0,settleTime-dt);
  }
  for(const [action,remaining] of fading){
   const next=remaining-dt;
   if(next<=0){action.stop();fading.delete(action)}
   else fading.set(action,next);
  }
 };
 const play=(kind)=>{
  if((kind==='attack'||kind==='hit')&&template.id==='M01')pose?.pulseCombat?.();
  if(filmStatic){
   staticState=['idle','attack','hit','walk','death','gesture'].includes(kind)?kind:'idle';
   staticAge=0;current='R85_artist_morph_'+staticState;
   return true;
  }
  if(!mixer)return false;
  const clip=choose(kind);if(!clip)return false;
  if(current===clip.name&&kind==='idle'&&activeAction?.isRunning())return true;
  const next=mixer.clipAction(clip),prev=activeAction;
  fading.delete(next); // A previously fading clip can become current again.
  next.reset();next.enabled=true;
  next.setEffectiveTimeScale(1);next.setEffectiveWeight(1);
  if(kind!=='gesture'&&kind!=='idle'&&kind!=='walk'){
   gestureTime=0;
   if(nativeBeat)settleTime=.35;
  }
  const repeat=kind==='idle'||kind==='walk';
  next.setLoop(repeat?THREE.LoopRepeat:THREE.LoopOnce,repeat?Infinity:1);
  next.clampWhenFinished=!repeat;
  next.play();
  if(prev&&prev!==next){
   next.crossFadeFrom(prev,.18,true);
   fading.set(prev,.20); // Retire the zero-weight outgoing action.
   transitions++;
  }
  activeAction=next;current=clip.name;
  return true;
 };
 play('idle');
 let restHeight=template.measured.scaledHeight;
 // Some skinned GLBs embed a root-motion offset that raises their boots.
 // Sample the chosen idle clip once, then seat the *real posed* feet on court.
 if(mixer){
  mixer.update(.26);
  pose?.apply(0,'idle');
  scaled.updateMatrixWorld(true);
  // A bent, lowered limb changes the *real posed* mesh AABB substantially:
  // the previous static/T-pose scale was no longer a valid size contract.
  // Retain the source mesh/rig and normalize only this seven-character group
  // against the actual new idle posture, not a guessed model height.
  if(pose){
   const frame=new THREE.Box3().setFromObject(scaled,true);
   const observedHeight=frame.max.y-frame.min.y;
   if(!Number.isFinite(observedHeight)||observedHeight<.2)
    throw Error('R65 invalid relaxed character height '+template.id);
   const correction=THREE.MathUtils.clamp(2.035/observedHeight,.72,1.25);
   scaled.scale.multiplyScalar(correction);
   scaled.updateMatrixWorld(true);
  }
  const posed=new THREE.Box3().setFromObject(scaled,true);
  restHeight=posed.max.y-posed.min.y;
  if(Number.isFinite(posed.min.y)&&Math.abs(posed.min.y)<3){
   scaled.position.y-=posed.min.y;
  }
  scaled.updateMatrixWorld(true);
  restCenter=new THREE.Box3().setFromObject(scaled,true).getCenter(new THREE.Vector3());
 }
 const restPlacement=scaled.position.clone(),restScale=scaled.scale.clone();
 return {root,mixer,play,update,instance,restHeight,
  meshCount:template.meshes,animationCount:template.clips.length,
  get currentClip(){return current},get clipRunning(){return activeAction?.isRunning()||false},
  get transitions(){return transitions},
  revive(){
   for(const mesh of morphMeshes)for(const name of ['show','attack','hit'])
    mesh.morphTargetInfluences[mesh.morphTargetDictionary[name]]=0;
   mixer?.stopAllAction();
   fading.clear();current=null;activeAction=null;
   pose?.reset();gestureClock=nativeBeat?.offset||0;gestureTime=0;settleTime=0;gestureCount=0;
   scaled.position.copy(restPlacement);scaled.scale.copy(restScale);scaled.rotation.set(0,0,0);
   staticPhase=0;staticAge=0;staticState='idle';
   play('idle');update(0);
  },
  get fadingClips(){return fading.size},
  get posture(){return pose?.inspect()||null},
  get nativeMorphs(){return {meshes:morphMeshes.length,
    targets:morphMeshes.length?['show','attack','hit']:[],
    live:morphMeshes.length?['show','attack','hit'].map(n=>
      Number((morphMeshes[0].morphTargetInfluences[morphMeshes[0].morphTargetDictionary[n]]||0).toFixed(3))):[],
    mode:filmStatic?staticState:null};},
  get acting(){return {name:characterBeat?.name||null,native:!!nativeBeat,
   gestureCount,gestureActive:gestureTime>0,gestureClock:Number(gestureClock.toFixed(2))}},
  artApproved:false,kind:'real-gltf-prototype'};
}
