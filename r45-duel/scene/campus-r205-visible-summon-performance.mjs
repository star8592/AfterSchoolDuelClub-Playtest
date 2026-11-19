/**
 * R205: Visible, genuinely morphing R97 summoned characters.
 *
 * The public R97 seven students contain 6 source-authored BODY morph
 * channels but NO skin binding on rendered body meshes. Rotating their
 * (unbound) hidden source skeleton does not move visible arms.
 *
 * This director therefore animates ONLY the actual source mesh's original
 * Blender-authored Step/Strike/Brace/Land/Recoil/Retreat vertex morphs,
 * after Three AnimationMixer has written its base values. Each character
 * has a separate, staggered living-actor rhythm, NO stand-in geometry,
 * lights, new GPU passes, fake limb joints, or VRM source changes.
 *
 * Experimental R119–R146 skinned originals are excluded: if a visible mesh
 * has real skin bindings, its original actual skeleton/animation owns it.
 */
export const R205_ORIGINAL_R97_MORPH_IDS=Object.freeze([
 'E03','E04','G02','G03','G04','T03','T04'
]);
const CHANNELS=Object.freeze(['Step','Strike','Brace','Land','Recoil','Retreat']);
const PROFILES=Object.freeze({
 E03:{name:'热血加油队长',kind:'bounce-cheer',period:6.7,offset:.25,
  step:.65,strike:.63,brace:.27,land:.44,recoil:.22,retreat:.18},
 E04:{name:'食堂接力员',kind:'quick-pan-fidget',period:7.1,offset:1.1,
  step:.53,strike:.66,brace:.29,land:.38,recoil:.24,retreat:.24},
 G02:{name:'黑板密码专家',kind:'shy-glance-recoil',period:9.0,offset:2.3,
  step:.34,strike:.37,brace:.55,land:.24,recoil:.36,retreat:.40},
 G03:{name:'实验学长',kind:'excited-science-count',period:7.5,offset:3.7,
  step:.48,strike:.56,brace:.41,land:.33,recoil:.25,retreat:.30},
 G04:{name:'社团计划总监',kind:'proud-decree',period:8.0,offset:1.7,
  step:.36,strike:.60,brace:.50,land:.27,recoil:.19,retreat:.27},
 T03:{name:'默契收发员',kind:'fast-reaction-switch',period:6.85,offset:4.2,
  step:.61,strike:.56,brace:.33,land:.46,recoil:.32,retreat:.39},
 T04:{name:'活动室守门人',kind:'heavy-stop-guard',period:8.35,offset:5.4,
  step:.43,strike:.58,brace:.65,land:.36,recoil:.28,retreat:.41}
});
const smooth=v=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x)};
const pulse=(x,start,rise,fall,end)=>
 smooth((x-start)/(rise-start))*(1-smooth((x-fall)/(end-fall)));
const clamp=x=>Math.max(0,Math.min(1,x));
export function r205SourceMorphSample(id,seconds,{offset=0,life=null,reduced=false}={}){
 const p=PROFILES[id];if(!p||!Number.isFinite(seconds))return null;
 const turn=((seconds+p.offset+offset)%p.period+p.period)%p.period;
 const t=turn/p.period;
 // Every 7–9s, each ORIGINAL student is actively doing different things:
 // watch -> shift legs -> demonstrate/gesture with arms -> recover -> look.
 const glance=pulse(t,.01,.09,.23,.32);
 const stride=pulse(t,.21,.34,.44,.57);
 const show=pulse(t,.41,.52,.68,.76);
 const recover=pulse(t,.67,.76,.87,.96);
 const breathing=.5+.5*Math.sin(seconds*(1.6+1/p.period)+p.offset*2);
 const fidget=.5+.5*Math.sin(seconds*(.94+id.charCodeAt(1)*.016)+p.offset);
 const intent=life?.intent||'idle';
 const alert=Math.min(1,Math.max(0,(life?.weight||0)*.45));
 const protest=['challenge','cheer','smirk','half_wave','hands_hips',
  'tiny_clap','stretch','lean'].includes(intent)?alert:0;
 const defensive=['flinch','peek','headshake','defeat','scratch'].includes(intent)?
  alert:0;
 const calm=.085+.10*breathing;
 const q={
  Step:p.step*(.08+.92*stride)+.11*glance,
  Strike:p.strike*(.035+.93*show)+.10*protest,
  Brace:p.brace*(.16+.72*glance+.48*fidget)+.13*defensive,
  Land:p.land*(.025+.85*recover+.26*stride),
  Recoil:p.recoil*(.025+.80*glance+.20*recover)+.10*defensive,
  Retreat:p.retreat*(.02+.70*recover+.35*glance)
 };
 // Keep the original six source deformations within their authored range:
 // no 2x morphs, no vertex replacements or T-pose fighting additive clips.
 // No Object.values array allocation on every PC animation frame.
 const maxTotal=1.04;
 const total=q.Step+q.Strike+q.Brace+q.Land+q.Recoil+q.Retreat;
 const scalar=total>maxTotal?maxTotal/total:1;
 const k=reduced?.46:1;
 for(const key of CHANNELS)q[key]=+clamp(q[key]*scalar*k).toFixed(5);
 let peak=.24,phase='breathing';
 if(glance>peak){peak=glance;phase='glance'}
 if(stride>peak){peak=stride;phase='stride'}
 if(show>peak){peak=show;phase='show'}
 if(recover>peak){peak=recover;phase='recover'}
 return{...q,phase,
  signature:p.kind,sourceCharacter:p.name,
  intensity:+Math.max(q.Step,q.Strike,q.Brace,q.Land,q.Recoil,q.Retreat).toFixed(4),
  variance:+(glance+stride+show+recover+calm).toFixed(4),
  synchronized:false,sourceMorphChannels:CHANNELS.length};
}
export function createR205VisibleSummonPerformance(root,id,{uid='',side='player'}={}){
 if(!R205_ORIGINAL_R97_MORPH_IDS.includes(id))return null;
 const meshes=[];
 root.traverse(obj=>{
  if(!obj.isMesh||obj.isSkinnedMesh||
      !obj.morphTargetDictionary||!Array.isArray(obj.morphTargetInfluences))return;
  const dict=obj.morphTargetDictionary;
  const map=Object.fromEntries(CHANNELS.map(name=>[name,dict[name]]));
  // Blender may put DIFFERENT subsets of its original 6 body channels
  // on separate real body/hair/clothing meshes. Never assume each mesh
  // has all 6, and NEVER write into an undefined morph-target index.
  const actual=CHANNELS.filter(name=>Number.isInteger(map[name])&&
   map[name]>=0&&map[name]<obj.morphTargetInfluences.length);
  if(actual.length<1||!obj.geometry?.attributes?.position?.count)return;
  meshes.push({obj,map,actual});
 });
 if(!meshes.length)throw Error('R205 missing visible original R97 body morphs '+id);
 const sourceChannels=[...new Set(meshes.flatMap(x=>x.actual))];
 if(!sourceChannels.includes('Strike')||!sourceChannels.includes('Recoil'))
  throw Error('R205 original R97 has no source visible arm/recoil motion '+id);
 // Hash is slot-specific: six characters appearing simultaneously MUST NOT
 // have identical timings or move as a synchronized zombie line.
 let hash=2166136261;
 for(const c of String(uid)+side)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 const offset=(hash%137)/137*2.1;
 let qa={id,uid,side,enabled:true,signature:PROFILES[id].kind,
  originalVisibleR97Unskinned:true,originalMorphMeshes:meshes.length,
  originalSourceChannels:sourceChannels.length,sourceAvailableChannels:sourceChannels,
  frames:0,activeFrames:0,actualSourceMorphWrites:0,
  sourceOriginalGeometryReplaced:false,clipMixerPreserved:true,
  observedPhases:[],maxAuthoredMorphWeight:0,
  currentBlend:0,lastPose:null};
 let lastTime=null,activeBlend=0;
 function update(seconds,life,{busy=false,reduced=false}={}){
  qa.frames++;
  const dt=lastTime===null?0:Math.max(0,Math.min(.07,seconds-lastTime));
  lastTime=seconds;
  // The source authored entrance/combat/KO clip always has priority.
  // Blend softly into the living idle after a combat action: otherwise
  // R97 arms would SNAP from Hit/Strike to a different floating idle pose.
  activeBlend=clamp(activeBlend+(busy?-7:3.7)*dt);
  qa.currentBlend=+activeBlend.toFixed(4);
  const sample=r205SourceMorphSample(id,seconds,{offset,life,reduced});
  if(!sample)return false;
  sample.busy=!!busy;
  qa.lastPose=sample;
  if(qa.observedPhases.at(-1)!==sample.phase){
   qa.observedPhases.push(sample.phase);
   if(qa.observedPhases.length>18)qa.observedPhases.shift();
  }
  if(busy)return true; // original combat, spell, and entrance clips own body
  // Three's original AnimationMixer updates weights BEFORE this controller.
  // Preserve its exact base animation rather than resetting its source.
  for(const entry of meshes){
   const weights=entry.obj.morphTargetInfluences;
   for(const name of entry.actual){
    const i=entry.map[name],v=weights[i]||0,w=sample[name]*activeBlend;
    if(w>v)weights[i]=w;
    qa.maxAuthoredMorphWeight=Math.max(qa.maxAuthoredMorphWeight,weights[i]);
    qa.actualSourceMorphWrites++;
   }
  }
  if(sample.intensity*activeBlend>.14)qa.activeFrames++;
  return true;
 }
 // Building inspection details every animation frame causes short-lived
 // allocations and PC stutter: build them only when QA ACTUALLY asks.
 return {update,inspect:()=>({...qa,observedPhases:[...qa.observedPhases],
  lastPose:qa.lastPose&&{...qa.lastPose},
  sampleMeshes:meshes.slice(0,4).map(entry=>({
   name:entry.obj.name,actualAuthoredMorphs:Object.fromEntries(
    entry.actual.map(k=>[k,+entry.obj.morphTargetInfluences[entry.map[k]].toFixed(4)]))
  }))})};
}
