/**
 * R145 original-actor action-shot director. The game camera follows the
 * REAL attack event, real on-board skinned actor and actual hit target.
 * No cutaway standee, no root-only actor wobble, no rules/HP mutation.
 *
 * One compact lens move at the original R51 exchange timing. It must
 * return to the real frontal R104 wide shot every event, protect manual
 * orbits, reduced-motion users, and never compete with R123 crowd comedy.
 */
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const ease=x=>{const t=clamp(x,0,1);return t*t*(3-2*t)};
const pulse=(p,lo,peak,release,hi)=>
 ease((p-lo)/(peak-lo))*(1-ease((p-release)/(hi-release)));
const round=x=>+x.toFixed(5);
export function createR145RealSourceActionCamera(THREE){
 const focusPoint=new THREE.Vector3(),desiredEye=new THREE.Vector3(),
  center=new THREE.Vector3();
 const state={enabled:true,frames:0,cuts:0,peakWeight:0,
  frameWeight:0,current:null,phase:0,
  realTarget:null,lastSerial:null,
  minimumFrameDistance:Infinity,maximumFrameDistance:0};
 let previous=null;
 /**
  * Run AFTER the ordinary camera orbit and the teacher/spectator gags,
  * but BEFORE camera.lookAt and the debug-only closeup.
  * focus is an OBSERVATION of a rule-validated R51 visual event.
  */
 function apply(camera,focus,{narrow=false,reducedMotion=false,
  crowdWeight=0,orbitDegrees=0,userDragging=false}={}){
  state.frames++;
  const eligible=focus&&Number.isInteger(focus.serial)&&
   focus.serial>0&&focus.phase>=0&&focus.phase<=1&&
   ['player','ai'].includes(focus.side)&&
   Array.isArray(focus.attacker)&&focus.attacker.length===3&&
   focus.attacker.every(Number.isFinite)&&
   (!focus.defender||focus.defender.every(Number.isFinite))&&
   !reducedMotion&&crowdWeight<.03&&Math.abs(orbitDegrees)<42&&
   !userDragging;
  const p=eligible?focus.phase:0;
  // Most of the impact is shown on the ATTACKER, then the RECEIVER.
  // At desktop widths, the camera covers BOTH original actors. Portrait
  // pans from attacking actor to hurt actor, then smoothly restores wide.
  const subject=narrow&&p>=.47&&focus?.defender?
   focus.defender:focus?.attacker;
  const subjectRole=narrow&&p>=.47&&focus?.defender?
   'defender':'attacker';
  const weight=eligible?Math.min(.88,
   pulse(p,.06,.22,.68,.88)*(narrow?.88:.76)):0;
  state.frameWeight=round(weight);
  if(weight<=.0001){
   state.current=null;state.realTarget=null;state.phase=0;
   return null;
  }
  if(focus.serial!==previous){
   previous=focus.serial;state.cuts++;
  }
  state.current=focus.id;
  state.realTarget=subjectRole;
  state.lastSerial=focus.serial;
  state.phase=round(p);
  state.peakWeight=Math.max(state.peakWeight,weight);
  if(narrow){
   focusPoint.fromArray(subject);
   focusPoint.y+=1.10;
  }else{
   focusPoint.fromArray(focus.attacker);
   if(focus.defender){
    center.fromArray(focus.defender);
    focusPoint.lerp(center,.50);
   }
   focusPoint.y+=1.01;
  }
  // Keep real world coordinates and a normal low camera. The ordinary
  // stadium camera aspect & user settings are NEVER overwritten.
  const lensDistance=narrow?4.65:6.75;
  desiredEye.set(focusPoint.x+(narrow?-.24:.12),
   focusPoint.y+lensDistance*(narrow?.22:.25),
   focusPoint.z+lensDistance);
  camera.position.lerp(desiredEye,weight);
  state.minimumFrameDistance=Math.min(state.minimumFrameDistance,
   camera.position.distanceTo(focusPoint));
  state.maximumFrameDistance=Math.max(state.maximumFrameDistance,
   camera.position.distanceTo(focusPoint));
  return{
   x:focusPoint.x,y:focusPoint.y,z:focusPoint.z,
   weight,subjectRole,serial:focus.serial,phase:p,
   actor:focus.id,side:focus.side};
 }
 function inspect(){
  return{...state,
   minimumFrameDistance:Number.isFinite(state.minimumFrameDistance)?
    round(state.minimumFrameDistance):null,
   maximumFrameDistance:round(state.maximumFrameDistance)};
 }
 return{apply,inspect};
}
