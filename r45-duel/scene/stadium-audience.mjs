/**
 * R114 small *real high-detail* student spectator troupe in the back row.
 * Reuses four Blender Studio GLBs already loaded for legitimate game units.
 * No block-man standees, no new downloads and no gameplay mutation.
 */
import {instantiateSummon} from './summon-models.mjs';
const PARTICIPANTS=Object.freeze([
 {id:'E04',x:-8.00,y:2.76,z:-10.85,scale:.84,team:'player',offset:.10},
 {id:'E03',x:-4.65,y:.95,z:-7.58,scale:.88,team:'player',offset:.52},
 {id:'G03',x:4.65,y:.95,z:-7.58,scale:.88,team:'ai',offset:.83},
 {id:'G04',x:8.00,y:2.76,z:-10.85,scale:.84,team:'ai',offset:1.24}
]);
import {crowdReactionMotion} from './stadium-crowd-motion.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function createStadiumAudience(THREE,root,lifeWorld=null){
 const group=new THREE.Group();group.name='R114_RealStudentGallery';root.add(group);
 const actors=[];let active=null,events=0,frames=0,movementFrames=0,accidentEvents=0;
 function mount(prototypes){
  if(actors.length)return actors.length;
  if(!(prototypes instanceof Map))return 0;
  for(const spec of PARTICIPANTS){
   const template=prototypes.get(spec.id);
   if(!template||template.clips.length<2)continue;
   const instance=instantiateSummon(THREE,template);
   const object=instance.root;
   object.name='R114_RealStudentSpectator_'+spec.id;
   // Two students cheer near the front bleacher aisle, two on the rear
   // top riser. All stand on genuine raised steps, not on the fight court.
   const pose={x:spec.x,y:spec.y,z:spec.z};
   object.position.set(pose.x,pose.y,pose.z);
   object.scale.setScalar(spec.scale);
   object.rotation.y=0; // These four official models have true +Z front.
   group.add(object);
   const arms=['L','R'].map(side=>{
    const bone=object.getObjectByName('FK-UpperArm.'+side);
    return bone?{side,bone,rest:bone.quaternion.clone()}:null;
   }).filter(Boolean);
   const head=object.getObjectByName('FK-Head')||object.getObjectByName('Head')||null;
   const headRest=head?.quaternion?.clone()||null;
   let actualBones=0,skinnedMeshes=0;
   object.traverse(o=>{if(o.isBone)actualBones++;if(o.isSkinnedMesh)skinnedMeshes++});
   lifeWorld?.register('spectator:'+spec.id,
    {id:spec.id,side:spec.team,role:'spectator'});
   actors.push({spec,instance,object,pose,arms,head,headRest,
    actualBones,skinnedMeshes,last:null});
  }
  return actors.length;
 }
 function react(type,side,seconds){
  if(!['card','hit','finale'].includes(type)||!['player','ai','draw'].includes(side)||
    !Number.isFinite(seconds))return false;
  if(active?.type==='finale'&&type!=='finale')return false;
  active={type,winner:side,started:seconds,duration:type==='finale'?6.4:type==='hit'?1.45:1.65};
  events++;return true;
 }
 function spectatorAnchor(index){
  const actor=actors[index];
  if(!actor)return null;
  const p=actor.object.getWorldPosition(new THREE.Vector3());
  return {x:p.x,y:p.y,z:p.z,id:actor.spec.id,index,side:actor.spec.team};
 }
 function reactAccident(incident,seconds){
  if(!incident||!Number.isInteger(incident.spectatorIndex)||
    incident.spectatorIndex<0||incident.spectatorIndex>=PARTICIPANTS.length||
    !Number.isFinite(seconds)||!['ricochet','overshoot','shockwave','misfire'].includes(incident.scenario))
   return null;
  if(active?.type==='finale')return null;
  const focused=actors[incident.spectatorIndex];
  if(!focused)return null;
  // Anchor is taken from the REAL mounted high-detail GLB spectator,
  // not a fabricated stand-in or a hardcoded camera pixel.
  const p=focused.object.getWorldPosition(new THREE.Vector3());
  active={type:'accident',winner:incident.side,started:seconds,duration:2.65,
   focusIndex:incident.spectatorIndex,scenario:incident.scenario,
   element:incident.element};
  events++;accidentEvents++;
  return {spectatorId:focused.spec.id,index:incident.spectatorIndex,
   x:p.x,y:p.y,z:p.z,side:focused.spec.team};
 }
 function reset(){active=null}
 function update(seconds,{reduced=false,dt=.016}={}){
  const elapsed=active?seconds-active.started:0;
  for(const [index,actor] of actors.entries()){
   if(actor.instance.mixer)actor.instance.mixer.update(clamp(dt,0,.06));
   else actor.instance.update?.(dt);
   const p=crowdReactionMotion({type:active?.type||'idle',
    winner:active?.winner,team:actor.spec.team,
    elapsed,offset:actor.spec.offset,reduced,index,
    focusIndex:active?.focusIndex??-1,scenario:active?.scenario??null});
   const mind=lifeWorld?.read('spectator:'+actor.spec.id,seconds);
   const living=(!active&&mind&&!reduced)?mind:null;
   actor.object.position.set(actor.pose.x,actor.pose.y+p.bounce-(p.duck||0),actor.pose.z);
   actor.object.rotation.set(0,p.yaw+(living?.yaw||0)*.8,
    p.tilt+(living?.tilt||0)*.7);
   actor.lastLife=mind;
   for(const {side,bone,rest} of actor.arms){
    // Source clips are real skeletal animations. Apply small authored
    // spectator reaction as a non-accumulating override on FK controls.
    // Keep the frame's genuine source skeletal clip pose. Copying the
    // mount-time T pose every frame makes characters stand like mannequins.
    if(!actor.instance.mixer)bone.quaternion.copy(rest);
    if(p.arms>.001)bone.quaternion.multiply(
     new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),
      (side==='L'?-1:1)*p.arms));
   }
   if(actor.head?.quaternion){
    if(!actor.instance.mixer&&actor.headRest)actor.head.quaternion.copy(actor.headRest);
    if(p.headYaw||p.headPitch)actor.head.quaternion.multiply(
     new THREE.Quaternion().setFromEuler(new THREE.Euler(p.headPitch||0,p.headYaw||0,0)));
   }
   // Some production Studio GLBs have animated morph clips but *no*
   // exposed FK arm/head bones. Use the existing true GLB instance's
   // authored whole-body acting channel instead of pretending the limbs
   // are skeletal or resetting the model to a mannequin pose.
   actor.instance.setCombatPose?.(active?.type==='accident'&&p.weight>.001?{
    lean:-(p.duck||0)*.90+(p.near?-.10:0)*p.weight,
    upperTwist:p.yaw*.85,sideLean:p.tilt*.68,lift:0
   }:null);
   actor.last=p;
   if(p.weight>.1)movementFrames++;
  }
  frames++;
  if(active&&elapsed>active.duration)active=null;
 }
 return {mount,react,reactAccident,spectatorAnchor,reset,update,get stats(){return{
  loaded:actors.length,realModelIds:actors.map(a=>a.spec.id),
  animationMixers:actors.filter(a=>a.instance.mixer).length,
  skinnedRealActors:actors.filter(a=>a.skinnedMeshes>0).length,
  boneDrivenActors:actors.filter(a=>a.actualBones>0).length,
  authoredPoseFallbackActors:actors.filter(a=>a.actualBones===0).length,
  frames,movementFrames,events,accidentEvents,active:active?{...active}:null,
  poses:actors.map(a=>({id:a.spec.id,team:a.spec.team,
   mode:a.last?.mode||'idle',weight:+(a.last?.weight||0).toFixed(3),
   chainDelay:a.last?.delay??0,headRig:!!a.head,
   armRigs:a.arms.length,bones:a.actualBones,skinnedMeshes:a.skinnedMeshes,
   emotion:a.lastLife?.emotion||'focused',
   attention:a.lastLife?.attention||'arena',
   personalIntent:a.lastLife?.intent||'idle'}))
 }}};
}
