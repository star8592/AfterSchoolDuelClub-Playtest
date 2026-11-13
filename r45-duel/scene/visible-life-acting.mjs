/**
 * R117: Character-specific VISIBLE deformation on actual game character art.
 *
 * The seven production R97 GLBs expose true source-authored body morphs,
 * but their active display meshes have NO skin binding (a second, UNUSED
 * armature scene is present). This runtime MUST NOT falsely report rigging.
 * It layers bounded, authored morphological movement over each real model.
 * Only when a future visible mesh has a verified skin/bone association can
 * this module drive its individual joint quaternions.
 * No actor swaps, no fake skeletons, no card-rule mutations.
 */
const HUMAN_IDS=new Set(['E03','E04','G02','G03','G04','T03','T04']);
const clamp=(v,a=-1,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const R118_NATIVE_ALTERNATES=Object.freeze({
 head:['DEF-Head'],neck:['DEF-Neck'],chest:['DEF-Chest'],
 spine:['DEF-Chest'],left:['DEF-UpperArm1.L','DEF-Shoulder.L'],
 right:['DEF-UpperArm1.R','DEF-Shoulder.R'],
 leftElbow:['DEF-Forearm1.L'],rightElbow:['DEF-Forearm1.R']
});
const QUAT_FIELDS=Object.freeze([
 ['head','FK-Head'],
 ['neck','FK-Neck'],
 ['chest','FK-Chest'],
 ['spine','FK-Spine'],
 ['left','FK-UpperArm.L'],
 ['right','FK-UpperArm.R'],
 ['leftElbow','FK-Forearm.L'],
 ['rightElbow','FK-Forearm.R']
]);
export function createVisibleLifeActing(THREE,object,id){
 const body=HUMAN_IDS.has(id);
 const bones=new Map(),candidateInfo=[];
 const skinBones=new Set();
 if(body)object.traverse(o=>{
  if(o.isSkinnedMesh)for(const bone of o.skeleton?.bones||[])skinBones.add(bone);
 });
 if(body)for(const [key,name] of QUAT_FIELDS){
  const candidates=[];
  const choices=[name,...(R118_NATIVE_ALTERNATES[key]||[])];
  const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const wanted=new Set(choices.map(norm));
  object.traverse(o=>{if(wanted.has(norm(o.name)))candidates.push(o)});
  const found=candidates.find(o=>skinBones.has(o))||
   candidates.find(o=>o.isBone)||candidates.find(o=>o.isObject3D);
  candidateInfo.push({key,name,found:!!found,
   isBone:!!found?.isBone,inSkeleton:skinBones.has(found),
   copies:candidates.length});
  if(found?.isObject3D&&skinBones.has(found))
   bones.set(key,{bone:found,rest:found.quaternion.clone()});
 }
 const enabled=body&&bones.has('head')&&bones.has('chest')&&
  (bones.has('left')||bones.has('right')||bones.has('leftElbow'));
 // Production R97's visible scene is baked morph geometry, while an unused
 // second scene contains an unbound armature. Detect the renderable truth.
 // Drive only authored SOURCE vertex displacement channels (Strike/Recoil),
 // never claim the unused armature controls those visible vertices.
 const shapes=[];
 if(body&&!enabled)object.traverse(node=>{
  if(!node.isMesh||!node.morphTargetDictionary||
     !/body|arms|head|shirt|jacket|top|sweater|polo|vest|hair|scarf/i.test(node.name))return;
  const dict=node.morphTargetDictionary;
  const strike=dict.Strike,recoil=dict.Recoil;
  if(!Number.isInteger(strike)&&!Number.isInteger(recoil))return;
  if(!Array.isArray(node.morphTargetInfluences))return;
  shapes.push({node,strike,recoil});
 });
 const mode=enabled?'skinned-joints':shapes.length?'authored-morph-deformation':'unanimated';
 const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),
  axisZ=new THREE.Vector3(0,0,1);
 const qa={id,enabled,mode,morphMeshes:shapes.length,riggedJoints:[...bones.keys()],frames:0,
  expressiveFrames:0,boneFrameWrites:0,morphFrameWrites:0,maxMorphDelta:0,maxAngle:0,
  lastIntent:'idle',lastEmotion:'focused',lastAttention:'opponent',
  candidateInfo,skinBones:skinBones.size,
  currentAngles:{}};
 const profiles={
  E03:{power:1.1,tempo:1.04},
  E04:{power:1.19,tempo:1.19},
  G02:{power:.75,tempo:.89},
  G03:{power:.84,tempo:1.12},
  G04:{power:.88,tempo:.93},
  T03:{power:1.0,tempo:1.06},
  T04:{power:.93,tempo:.86}
 };
 const profile=profiles[id]||{power:1,tempo:1};
 function apply(seconds,life,{reduced=false,busy=false}={}){
  if(!enabled&&!shapes.length)return false;
  qa.frames++;
  const intensity=life&&!busy&&!reduced?
   Math.max(0,Math.min(1,life.weight||0))*profile.power:0;
  if(enabled&&busy){
   // Genuine source-rig combat clips own the bones in this phase.
   qa.lastIntent=life?.intent||'idle';return true;
  }
  if(!enabled){
   // Each R97 morph target is a Blender-baked deformation of the REAL
   // source character's joints. The running mixer owns baseline animation.
   // Add only a small state-driven layer after mixer.update(dt), capped so
   // original feet/attack/hit animation remains intact and undistorted.
   const mood=life?.emotion||'focused',intent=life?.intent||'idle';
   const excited=['challenge','cheer','smirk','half_wave','hands_hips','tiny_clap','stretch','lean'].includes(intent);
   const defensive=['flinch','peek','headshake','fidget','scratch','defeat'].includes(intent);
   const breath=Math.max(0,Math.sin(seconds*1.28*profile.tempo+id.charCodeAt(1)*.19));
   const strike=(!busy&&!reduced)?Math.min(.36,
    .045*breath+.30*intensity*(excited?1:defensive?.16:.44)):0;
   const recoil=(!busy&&!reduced)?Math.min(.33,
    .008+.26*intensity*(defensive?1:mood==='nervous'?.65:.08)):0;
   for(const shape of shapes){
    const w=shape.node.morphTargetInfluences;
    if(Number.isInteger(shape.strike)){
     const before=w[shape.strike]||0;
     w[shape.strike]=Math.min(1,Math.max(0,before+strike));
     qa.maxMorphDelta=Math.max(qa.maxMorphDelta,w[shape.strike]-before);
     qa.morphFrameWrites++;
    }
    if(Number.isInteger(shape.recoil)){
     const before=w[shape.recoil]||0;
     w[shape.recoil]=Math.min(1,Math.max(0,before+recoil));
     qa.maxMorphDelta=Math.max(qa.maxMorphDelta,w[shape.recoil]-before);
     qa.morphFrameWrites++;
    }
   }
   if(intensity>.14)qa.expressiveFrames++;
   qa.lastIntent=intent;qa.lastEmotion=mood;qa.lastAttention=life?.attention||'opponent';
   qa.currentAngles={morphStrike:+strike.toFixed(4),morphRecoil:+recoil.toFixed(4)};
   return true;
  }
  // For genuinely skinned future exports, safely add SMALL FK changes
  // to actual render-bound joints. Never target unreferenced GLB nodes.
  for(const entry of bones.values())entry.bone.quaternion.copy(entry.rest);
  const breathing=(!busy&&!reduced)?Math.sin(seconds*1.29*profile.tempo+id.charCodeAt(1)*.31):0;
  const attentive=life?.attention==='opponent'?.85:
   life?.attention==='cards'?.43:life?.attention==='arena'?.55:.68;
  const emphasis=life&&!busy&&!reduced?Math.max(0,Math.min(1,life.weight||0))*profile.power:0;
  const intent=life?.intent||'idle';
  const fired=['challenge','hands_hips','tiny_clap','half_wave','cheer','smirk','shrug','rub_palms'].includes(intent);
  const shy=['fidget','peek','scratch','headshake','flinch','defeat'].includes(intent);
  const focus=['focus','inspect','count_cards','whisper','glance'].includes(intent);
  // Small base motion (breathing/weight shift) occurs even with no impulse.
  const breath=.025*breathing*(reduced||busy?0:1);
  const armSign=life?.side==='ai'?-1:1;
  const shoulder=emphasis*(fired?.17:shy?.09:focus?.055:.07)*armSign;
  const reactiveTilt=emphasis*(fired?-.065:shy?.06:focus?.03:0);
  const headYaw=clamp((life?.yaw||0)*emphasis*.83,-.13,.13);
  const headPitch=clamp((life?.head||0)*emphasis+reactiveTilt,-.17,.17);
  const chestPitch=clamp(breath+reactiveTilt*.42,-.09,.09);
  const movement={
   head:[headPitch,headYaw,0],
   neck:[headPitch*.35,headYaw*.32,0],
   chest:[chestPitch,0,breath*.25],
   spine:[chestPitch*.40,0,reactiveTilt*.22],
   left:[shy?-.04*emphasis:-shoulder*.75,0,shoulder*.58],
   right:[shy?.055*emphasis:shoulder,0,-shoulder*.68],
   leftElbow:[emphasis*(fired?.13:focus?.055:.02),0,0],
   rightElbow:[emphasis*(fired?.16:shy?.04:.045),0,0]
  };
  const written=new Set();
  for(const [key,[pitch,yaw,roll]] of Object.entries(movement)){
   const entry=bones.get(key);if(!entry||written.has(entry.bone))continue;
   written.add(entry.bone);
   const x=clamp(pitch,-.20,.20),y=clamp(yaw,-.16,.16),z=clamp(roll,-.15,.15);
   entry.bone.quaternion.copy(entry.rest);
   if(Math.abs(x)>1e-6)entry.bone.quaternion.multiply(
    new THREE.Quaternion().setFromAxisAngle(axisX,x));
   if(Math.abs(y)>1e-6)entry.bone.quaternion.multiply(
    new THREE.Quaternion().setFromAxisAngle(axisY,y));
   if(Math.abs(z)>1e-6)entry.bone.quaternion.multiply(
    new THREE.Quaternion().setFromAxisAngle(axisZ,z));
   qa.currentAngles[key]=[+x.toFixed(4),+y.toFixed(4),+z.toFixed(4)];
   qa.maxAngle=Math.max(qa.maxAngle,Math.abs(x),Math.abs(y),Math.abs(z));
   qa.boneFrameWrites++;
  }
  if(emphasis>.15)qa.expressiveFrames++;
  qa.lastIntent=intent;qa.lastEmotion=life?.emotion||'focused';
  qa.lastAttention=life?.attention||'opponent';
  return true;
 }
 function clear(){
  for(const entry of bones.values())entry.bone.quaternion.copy(entry.rest);
  qa.currentAngles={};
  // Source glTF AnimationMixer restores morph channels on the next update.
  // Never set them to zero here: that would stomp authored source clips.
 }
 return {enabled,apply,clear,inspect:()=>({...qa,currentAngles:{...qa.currentAngles}})};
}
export const R117_FILM_MORPH_IDS=Object.freeze([...HUMAN_IDS]);
