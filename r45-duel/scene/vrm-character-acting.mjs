import {createVrmTwoBonePose} from './vrm-hero-pose-ik.mjs';
import {speechMouthAt,MOUTH_SHAPES} from './voice-mouth-timing.mjs';
/**
 * R67 — source-VRM facial blendshapes + individual short acting beats.
 * Uses the original VRM 0.x expression bindings from the GLTF parser and
 * existing J_Bip skeleton, never geometry stickers or facial texture swaps.
 */
export const VRM_ACTING=Object.freeze({
 E01:{name:'铃声追不上',beat:'发现要迟到，慌忙挥手',period:8.4,offset:2.3,
  torso:[-.03,0,-.07],head:[-.04,0,.13],
  rightArm:[-.40,0,.58],leftArm:[-.20,0,-.13],
  face:'joy',strength:.42},
 G01:{name:'橡皮筋建筑师',beat:'认真扶眼镜，突然灵机一动',period:9.7,offset:4.0,
  torso:[.03,0,.055],head:[-.075,0,-.12],
  rightArm:[-.12,0,.29],leftArm:[-.50,0,-.64],
  face:'fun',strength:.31}
});
const ease=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t)};

export function extractVrm0Expressions(gltf){
 const ext=gltf?.parser?.json?.extensions?.VRM;
 const groups=ext?.blendShapeMaster?.blendShapeGroups;
 if(!Array.isArray(groups))throw Error('R67 source VRM 0.x has no original blendShapeMaster');
 const expressions={};
 for(const group of groups){
  const key=(group.presetName&&group.presetName!=='unknown'?group.presetName:group.name)?.toLowerCase();
  if(!key)continue;
  expressions[key]=(group.binds||[]).filter(b=>Number.isInteger(b.mesh)&&Number.isInteger(b.index))
   .map(b=>({mesh:b.mesh,index:b.index,weight:Math.min(1,(b.weight||100)/100)}));
 }
 if(!expressions.blink?.length||!expressions.joy?.length||!expressions.fun?.length)
  throw Error('R67 source VRM missing blink, joy or fun facial morphs');
 return Object.freeze(expressions);
}

const naturalOffsets=id=>({
 J_Bip_R_UpperArm:[0,0,id==='E01'?-1.10:-1.02],
 J_Bip_L_UpperArm:[0,0,id==='E01'?1.09:1.16],
 J_Bip_R_LowerArm:[.04,0,-.18],J_Bip_L_LowerArm:[-.04,0,.16]
});
export function createVrmCharacterActing(THREE,object,{id,expressions,sourceRest=null}){
 const cfg=VRM_ACTING[id];if(!cfg)return null;
 if(!expressions||!expressions.blink)throw Error('R67 facial metadata missing '+id);
 const bones=new Map(),faceMeshes=[];
 object.traverse(o=>{
  if(o.isBone)bones.set(o.name,o);
  if(o.isMesh&&Array.isArray(o.morphTargetInfluences)&&o.morphTargetInfluences.length>=16){
   faceMeshes.push(o);
  }
 });
 if(faceMeshes.length<2)throw Error(`R67 ${id}: cannot find actual face morph meshes`);
 const bindRows={};
 for(const [key,binds] of Object.entries(expressions)){
  const rows=[];
  for(const b of binds){
   if(b.mesh!==0)continue; // VRM0 GLTF mesh 0 is original Face.baked.
   for(const mesh of faceMeshes){
    if(b.index<mesh.morphTargetInfluences.length)rows.push({mesh,index:b.index,weight:b.weight});
   }
  }
  bindRows[key]=rows;
 }
 if(!bindRows.blink?.length||!bindRows[cfg.face]?.length)
  throw Error('R67 no valid source morph binding for '+id);
 // Original on-camera VRM has its true rest pose, whereas R65 clone arms
 // have already been rotated into natural stance at creation time.
 const baseline=new Map();
 const relaxed=sourceRest?naturalOffsets(id):null;
 for(const [name,bone] of bones){
  const q=(sourceRest?.get(name)||bone.quaternion).clone();
  const e=relaxed?.[name];
  if(e)q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...e,'XYZ')));
  baseline.set(name,q);
 }
 const realPose=createVrmTwoBonePose(THREE,object,id);
 const actions={J_Bip_C_Chest:cfg.torso,J_Bip_C_Head:cfg.head,
  J_Bip_R_UpperArm:cfg.rightArm,J_Bip_L_UpperArm:cfg.leftArm};
 const combatActions={
  attack:{J_Bip_C_Chest:[-.12,0,.06],J_Bip_R_UpperArm:[-.53,0,.43],
   J_Bip_L_UpperArm:[-.20,0,-.23],J_Bip_C_Head:[-.09,0,0]},
  hit:{J_Bip_C_Chest:[.14,0,-.07],J_Bip_R_UpperArm:[.18,0,-.15],
   J_Bip_L_UpperArm:[.17,0,.17],J_Bip_C_Head:[.13,0,-.08]}
 };
 // Two original source VRMs have fully authored Sorrow/Angry/Surprised
 // facial morphs: use these instead of painting expression decals.
 const theatreEmotions=Object.freeze(['joy','fun','angry','sorrow','surprised']);
 const supported=new Set(theatreEmotions.filter(key=>(bindRows[key]||[]).length));
 const supportedMouth=new Set(MOUTH_SHAPES.filter(key=>(bindRows[key]||[]).length));
 const managed=new Set([...bindRows.blink||[],
  ...theatreEmotions.flatMap(key=>bindRows[key]||[]),
  ...MOUTH_SHAPES.flatMap(key=>bindRows[key]||[])].map(x=>x.index));
 const delta=new THREE.Quaternion(),desired=new THREE.Quaternion();
 let amount=0,blink=0,faceAmount=0,frames=0,lastMode='idle',bornAt=null,entranceAmount=0,
  faceMood='idle',faceMoodAmount=0,lastViseme='closed',visemeAmount=0,
  visemeFrames=0,activeSpeechSerial=null;
 function update(seconds,{cinematic=false,combat=null,preview=false,previewAmount=null,previewEntrance=false,suppressEntrance=false,suppressGesture=false,seed=0,
   emotion=null,emotionAmount=0,speech=null}={}){
  if(bornAt===null)bornAt=seconds;
  const age=Math.max(0,seconds-bornAt);
  const phase=(seconds+cfg.offset+seed*.71)%cfg.period;
  entranceAmount=cinematic||combat||suppressEntrance?0:previewEntrance?1:ease((age-.1)/.42)*(1-ease((age-1.6)/.75));
  const raw=Number.isFinite(previewAmount)?Math.max(0,Math.min(1,previewAmount)):
   preview?1:suppressGesture?0:ease((phase-1.6)/.4)*(1-ease((phase-3.05)/.7));
  amount=(cinematic||combat)?0:raw;
  lastMode=combat||cinematic?'combat':entranceAmount>.08?'entrance':amount>.02?'gesture':'idle';
  const blinkPhase=(seconds+seed*1.13+(id==='E01'?1:2.4))%5.1;
  blink=(cinematic||combat)?0:ease((blinkPhase-.15)/.08)*(1-ease((blinkPhase-.29)/.10));
  faceMood=emotion&&supported.has(emotion)?emotion:'idle';
  faceMoodAmount=faceMood!=='idle'?
   Math.max(0,Math.min(1,Number(emotionAmount)||0)):0;
  faceAmount=(cinematic||combat||faceMoodAmount>.02)?0:cfg.strength*amount;
  // Real Qwen audio starts/ends via parent playback receipts. This is an
  // honest approximate syllable timing, not phoneme-aligned transcription.
  const mouth=speechMouthAt(speech,seconds);
  const speechKey=mouth&&supportedMouth.has(mouth.shape)?mouth.shape:null;
  lastViseme=speechKey||'closed';
  visemeAmount=speechKey?mouth.openness:0;
  activeSpeechSerial=speechKey?mouth.serial:null;
  if(visemeAmount>.018)visemeFrames++;
  if(!cinematic){
   // Reset only the actual upper body and two elbow joints; the original
   // VRM legs/hips retain native motion from the game. IK is solved after
   // torso/head changes to keep each hand anchored to its intended target.
   for(const [key,bone] of bones){
    const rest=baseline.get(key);if(!rest)continue;
    const controlled=key==='J_Bip_C_Chest'||key==='J_Bip_C_Head'||
     key.endsWith('_UpperArm')||key.endsWith('_LowerArm');
    if(!controlled)continue;
    bone.quaternion.copy(rest);
    if(combat){
     const pose=combatActions[combat]?.[key];
     if(pose){delta.setFromEuler(new THREE.Euler(...pose,'XYZ'));bone.quaternion.multiply(delta);}
    }else if(key==='J_Bip_C_Chest'||key==='J_Bip_C_Head'){
     const pose=actions[key],weight=Math.max(amount,entranceAmount);
     if(pose){
      delta.setFromEuler(new THREE.Euler(...pose,'XYZ'));
      desired.copy(rest).multiply(delta);
      bone.quaternion.slerp(desired,weight);
     }
    }
   }
   if(!combat){
    // The two-bone elbow reaches a specific location. This prevents the
    // A-shaped default silhouette and restores recognizable character poses.
    realPose.apply(entranceAmount>.05?'entrance':amount>.05?'beat':'idle',
      entranceAmount>.05?entranceAmount:amount);
   }
  }
  // Expression weights are set per individual source mesh. No global
  // material or texture mutation; both camps can blink independently.
  const targets=new Map();
  for(const mesh of faceMeshes)targets.set(mesh,new Map());
  for(const [key,value] of [['blink',blink],[cfg.face,faceAmount],
   [faceMood,faceMoodAmount],[lastViseme,visemeAmount]]){
   for(const b of bindRows[key]||[]){
    const t=targets.get(b.mesh);t.set(b.index,Math.max(t.get(b.index)||0,value*b.weight));
   }
  }
  for(const [mesh,values] of targets){
   // Clear all managed source presets first; sorrow cannot persist under joy.
   for(const index of managed)if(index<mesh.morphTargetInfluences.length)
    mesh.morphTargetInfluences[index]=values.get(index)||0;
  }
  frames++;
 }
 function inspect(){
  const sample=faceMeshes[0];
  const liveBlink=sample.morphTargetInfluences[bindRows.blink[0].index];
  const liveExpression=sample.morphTargetInfluences[bindRows[cfg.face][0].index];
  return {role:cfg.name,beat:cfg.beat,mode:lastMode,
   amount:Number(amount.toFixed(3)),blink:Number(blink.toFixed(3)),
   expression:cfg.face,faceAmount:Number(faceAmount.toFixed(3)),
   emotion:faceMood,emotionAmount:Number(faceMoodAmount.toFixed(3)),
   viseme:lastViseme,visemeAmount:+visemeAmount.toFixed(4),
   actualViseme:+(lastViseme==='closed'?0:Math.max(...(bindRows[lastViseme]||[])
    .filter(x=>x.mesh===sample).map(x=>sample.morphTargetInfluences[x.index]||0),0)).toFixed(4),
   visemeFrames,activeSpeechSerial,
   mouthBindings:Object.fromEntries(MOUTH_SHAPES.map(key=>[key,(bindRows[key]||[]).length])),
   actualMood:+(faceMood==='idle'?0:Math.max(...(bindRows[faceMood]||[])
    .filter(x=>x.mesh===sample).map(x=>sample.morphTargetInfluences[x.index]||0),0)).toFixed(3),
   emotionBindings:Object.fromEntries(theatreEmotions.map(key=>[key,(bindRows[key]||[]).length])),
   actualBlink:Number((liveBlink||0).toFixed(3)),
   actualExpression:Number((liveExpression||0).toFixed(3)),
   heroPose:realPose.inspect(),entranceAmount:Number(entranceAmount.toFixed(3)),
   faceMeshes:faceMeshes.length,blinkBindings:bindRows.blink.length,
   expressionBindings:bindRows[cfg.face].length,frames};
 }
 function revive(){amount=blink=faceAmount=entranceAmount=faceMoodAmount=visemeAmount=0;bornAt=null;lastMode=faceMood='idle';lastViseme='closed';activeSpeechSerial=null;for(const mesh of faceMeshes){
  for(const index of managed)if(index<mesh.morphTargetInfluences.length)
   mesh.morphTargetInfluences[index]=0;
 }}
 return {update,inspect,revive};
}
