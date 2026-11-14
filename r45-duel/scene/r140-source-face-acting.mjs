/**
 * R140 real Blender Studio source expressions, source identity by identity.
 * No painted expression stickers, texture swap, face proxy, synthetic audio,
 * or "pretend mouth moved" when HTMLAudioElement never played.
 * The owner is an explicitly selected R136 original weighted source instance.
 */
import {speechMouthAt} from './voice-mouth-timing.mjs';
const SPECS=Object.freeze({
 E04:{face:'phil',eyes:'phil_eye',jaw:true,blink:false,
  states:{
   Idle:{'iris_grow.L':.05,'iris_grow.R':.05},
   Attack:{'iris_narrow.L':.58,'iris_narrow.R':.58},
   Hit:{'iris_wide.L':.72,'iris_wide.R':.72},
   Celebrate:{'iris_grow.L':.53,'iris_grow.R':.53},
   Challenge:{'iris_narrow.L':.33,'iris_narrow.R':.33},
   Worry:{'iris_wide.L':.44,'iris_wide.R':.44},
   Walk:{'iris_grow.L':.10,'iris_grow.R':.10}
  },jawAngle:{Idle:0,Attack:.045,Hit:.10,Celebrate:.095,Challenge:.02,Worry:.06,Walk:0}},
 G02:{face:'snow',head:'snow-head',eyes:'snow-eyes',jaw:false,blink:false,
  states:{
   Idle:{'Smile.L':.08,'Smile.R':.06,'Bothbrows_Up':.10},
   Attack:{'Bothbrows_Down':.65,'RIG-snow-JawOpen':.17,'ShrinkIrisHorizontal.L':.25,'ShrinkIrisHorizontal.R':.25},
   Hit:{'Bothbrows_Up':.83,'RIG-snow-JawOpen':.43,'GrowIrisHorizontal.L':.4,'GrowIrisHorizontal.R':.4},
   Celebrate:{'Smile.L':.84,'Smile.R':.84,'Bothbrows_Up':.56,'RIG-snow-JawOpen':.16},
   Challenge:{'Bothbrows_Down+In':.51,'RIG-snow-JawOpen':.06},
   Worry:{'Bothbrows_Up+In':.61,'RIG-snow-JawOpen':.20},
   Walk:{'Bothbrows_Up':.09}
  },mouthTarget:'RIG-snow-JawOpen'},
 G04:{face:'victoria',eyes:'victoria_eye',jaw:true,blink:false,
  states:{
   Idle:{'iris_narrow.L':.10,'iris_narrow.R':.10},
   Attack:{'iris_narrow.L':.69,'iris_narrow.R':.69},
   Hit:{'iris_wide.L':.84,'iris_wide.R':.84},
   Celebrate:{'iris_grow.L':.49,'iris_grow.R':.49},
   Challenge:{'iris_narrow.L':.47,'iris_narrow.R':.47},
   Worry:{'iris_wide.L':.43,'iris_wide.R':.43},
   Walk:{'iris_narrow.L':.14,'iris_narrow.R':.14}
  },jawAngle:{Idle:0,Attack:.045,Hit:.095,Celebrate:.08,Challenge:.02,Worry:.045,Walk:0}},
 T03:{face:'rain',head:'rain-head',eyes:'rain-eyes',jaw:true,blink:true,
  states:{
   Idle:{'Smile.L':.12,'Smile.R':.12},
   Attack:{'EyebrowsDown.L':.69,'EyebrowsDown.R':.69,'LipsWide.L':.35,'LipsWide.R':.35},
   Hit:{'EyebrowsTogether.L':.68,'EyebrowsTogether.R':.68,'Lips_Corner_In.L':.40,'Lips_Corner_In.R':.40},
   Celebrate:{'Smile.L':.89,'Smile.R':.89,'LipsUp.L':.64,'LipsUp.R':.64},
   Challenge:{'EyebrowsDown.L':.37,'EyebrowsDown.R':.37},
   Worry:{'EyebrowsTogether.L':.54,'EyebrowsTogether.R':.54},
   Walk:{'Smile.L':.08,'Smile.R':.08}
  },jawAngle:{Idle:0,Attack:.07,Hit:.13,Celebrate:.10,Challenge:.025,Worry:.065,Walk:0}}
});
const action=x=>String(x||'').replace(/^R119_Skeletal_/,'')||'Idle';
const clamp=x=>Math.max(0,Math.min(1,x));
const canonical=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function createR140OriginalFaceActing(THREE,instance,id){
 const cfg=SPECS[id];
 if(!cfg)throw Error('R140 face only for approved source pilot '+id);
 const morphs=new Map(),owned=new Set(),jaws=[];
 instance.traverse(o=>{
  if(o.isSkinnedMesh&&Array.isArray(o.morphTargetInfluences)&&o.morphTargetDictionary){
   const name=canonical(o.name);
   if(!(name.includes(canonical(cfg.head||'__missing_head__'))||
    name.includes(canonical(cfg.eyes))||
    id==='E04'&&name.includes('phileye')||
    id==='G04'&&name.includes('victoriaeye')))return;
   for(const [key,index]of Object.entries(o.morphTargetDictionary)){
    if(!Number.isInteger(index)||index<0||index>=o.morphTargetInfluences.length)continue;
    if(!morphs.has(key))morphs.set(key,[]);
    morphs.get(key).push({mesh:o,index,original:o.morphTargetInfluences[index]||0});
   }
  }
  if(o.isBone&&canonical(o.name)==='defjaw')jaws.push(o);
 });
 for(const state of Object.values(cfg.states))
  for(const target of Object.keys(state))owned.add(target);
 if(cfg.blink){owned.add('EyelidsClose.L');owned.add('EyelidsClose.R')}
 if(cfg.mouthTarget)owned.add(cfg.mouthTarget);
 const missing=[...owned].filter(x=>!morphs.has(x));
 if(missing.length)throw Error('R140 missing REAL source face morphs '+id+': '+missing.join(','));
 if(cfg.jaw&&!jaws.length)throw Error('R140 missing REAL original jaw '+id);
 const jaw=jaws[0]||null;
 if(jaw){
  const actual=[];
  instance.traverse(m=>{
   if(m.isSkinnedMesh&&m.skeleton?.bones.includes(jaw))actual.push(m);
  });
  if(!actual.length)throw Error('R140 jaw has no skinned source meshes '+id);
 }
 const rest=jaw?.quaternion.clone(),jawAxis=new THREE.Vector3(1,0,0);
 const jawRotation=new THREE.Quaternion();
 let elapsed=0,speech=null,peakMorph=0,blinkFrames=0,expressiveFrames=0,
  speakingFrames=0,sourceFrames=0,lastState='Idle',lastMouth=0,maxJawAngle=0;
 const keys=[...owned];
 function startSpeech(value){
  if(!Number.isInteger(value?.serial)||value.serial<=0||
    typeof value.text!=='string'||value.text.length<1||value.text.length>180||
    !Number.isFinite(value.duration)||value.duration<.5||value.duration>18)return false;
  if(speech&&value.serial<=speech.serial)return false;
  speech={serial:value.serial,text:value.text,duration:value.duration,started:elapsed,
   kind:String(value.kind||'voice').slice(0,40)};
  return true;
 }
 function stopSpeech(serial){
  if(!speech||serial!==speech.serial)return false;
  speech=null;lastMouth=0;return true;
 }
 function update(dt,clip){
  elapsed+=Math.max(0,Math.min(.09,Number(dt)||0));sourceFrames++;
  const state=Object.hasOwn(cfg.states,action(clip))?action(clip):'Idle';
  lastState=state;
  const target={...cfg.states[state]};
  // A source-authored eyelid close, no fake blinking of the entire head.
  const phase=(elapsed+(id==='T03'?.29:0))%4.3;
  const blink=cfg.blink&&phase<.20?Math.sin(Math.PI*phase/.20)*.82:0;
  if(blink>.01){target['EyelidsClose.L']=blink;target['EyelidsClose.R']=blink;blinkFrames++;}
  const lip=speechMouthAt(speech,elapsed);
  const mouth=lip?lip.openness:0;lastMouth=mouth;
  if(speech&&elapsed>=speech.started+speech.duration+.1)speech=null;
  if(mouth>.02)speakingFrames++;
  if(cfg.mouthTarget)target[cfg.mouthTarget]=Math.max(target[cfg.mouthTarget]||0,mouth*.85);
  for(const key of keys){
   const amount=clamp(target[key]||0);
   for(const{mesh,index,original}of morphs.get(key)){
    // Always restore the source's authored neutral deformation, then layer
    // a bounded additive expression only in actor-owned channels.
    const base=original;
    const next=base+(1-base)*amount;
    mesh.morphTargetInfluences[index]=next;
    peakMorph=Math.max(peakMorph,next);
    if(Math.abs(next-base)>.02)expressiveFrames++;
   }
  }
  if(jaw){
   const gesture=(cfg.jawAngle[state]||0);
   const degrees=Math.min(.21,gesture+mouth*.14);
   jaw.quaternion.copy(rest).multiply(jawRotation.setFromAxisAngle(jawAxis,degrees));
   maxJawAngle=Math.max(maxJawAngle,rest.angleTo(jaw.quaternion));
  }
 }
 function inspect(){
  const active=keys.flatMap(key=>morphs.get(key).map(({mesh,index,original})=>({
   target:key,mesh:mesh.name,weight:+mesh.morphTargetInfluences[index].toFixed(4),
   original:+original.toFixed(4)
  })));
  return{enabled:true,actor:id,source:'original_gltf_morphs_and_weighted_jaw',
   state:lastState,managedTargetCount:keys.length,managedSourceSlots:active.length,
   sourceFrames,expressiveFrames,blinkFrames,speakingFrames,
   activeSpeechSerial:speech?.serial??null,mouth:+lastMouth.toFixed(4),
   maxMorph:+peakMorph.toFixed(4),maxJawAngle:+maxJawAngle.toFixed(4),
   jawBone:jaw?.name||null,active:active.filter(x=>Math.abs(x.weight-x.original)>.04)};
 }
 return{update,startSpeech,stopSpeech,inspect};
}
