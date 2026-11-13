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
export function createStadiumAudience(THREE,root){
 const group=new THREE.Group();group.name='R114_RealStudentGallery';root.add(group);
 const actors=[];let active=null,events=0,frames=0,movementFrames=0;
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
   actors.push({spec,instance,object,pose,arms,last:null});
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
 function update(seconds,{reduced=false,dt=.016}={}){
  const elapsed=active?seconds-active.started:0;
  for(const actor of actors){
   if(actor.instance.mixer)actor.instance.mixer.update(clamp(dt,0,.06));
   else actor.instance.update?.(dt);
   const p=crowdReactionMotion({type:active?.type||'idle',
    winner:active?.winner,team:actor.spec.team,
    elapsed,offset:actor.spec.offset,reduced});
   actor.object.position.set(actor.pose.x,actor.pose.y+p.bounce,actor.pose.z);
   actor.object.rotation.set(0,p.yaw,p.tilt);
   for(const {side,bone,rest} of actor.arms){
    // Source clips are real skeletal animations. Apply small authored
    // spectator reaction as a non-accumulating override on FK controls.
    bone.quaternion.copy(rest);
    if(p.arms>.001)bone.quaternion.multiply(
     new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),
      (side==='L'?-1:1)*p.arms));
   }
   actor.last=p;
   if(p.weight>.1)movementFrames++;
  }
  frames++;
  if(active&&elapsed>active.duration)active=null;
 }
 return {mount,react,update,get stats(){return{
  loaded:actors.length,realModelIds:actors.map(a=>a.spec.id),
  skinnedRealActors:actors.filter(a=>a.instance.mixer).length,
  frames,movementFrames,events,active:active?{...active}:null,
  poses:actors.map(a=>({id:a.spec.id,team:a.spec.team,
   mode:a.last?.mode||'idle',weight:+(a.last?.weight||0).toFixed(3)}))
 }}};
}
