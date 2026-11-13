/**
 * R112 Living cast. All activity is cosmetic, deterministic for a given seed,
 * and interruptible by real card/hit events. Animation never changes game data.
 */
import {choreographVictory} from './victory-choreography.mjs';
const smooth=x=>{const t=Math.min(1,Math.max(0,x));return t*t*(3-2*t)};
const hash=(seed,str)=>{let h=(seed>>>0)||2166136261;for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1};
const rng=seed=>()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296};
export const BEATS=Object.freeze({
 glance:{duration:1.3,headYaw:.14,headPitch:.02,tilt:.006},
 inspect:{duration:2.1,headPitch:-.17,chest:-.035,right:[0,.07,0]},
 shift:{duration:2.2,tilt:.035,step:.028},
 sleeve:{duration:1.65,headPitch:-.10,right:[-.03,.14,.03]},
 scratch:{duration:1.9,headPitch:-.09,right:[.02,.20,.09]},
 stretch:{duration:2.4,chest:.065,left:[-.02,.12,.06]},
 lean:{duration:1.7,headYaw:.09,tilt:.045,chest:-.04},
 challenge:{duration:1.85,headYaw:.15,chest:-.06,right:[.13,.13,-.025]},
 whisper:{duration:2.1,headYaw:.17,headPitch:-.07,chest:-.05,right:[-.02,.07,0]},
 laugh:{duration:1.75,headPitch:-.08,chest:.10,tilt:.022},
 eye_roll:{duration:1.35,headYaw:-.13,headPitch:.11},
 shrug:{duration:1.5,headPitch:.04,chest:.035,left:[-.08,.13,0],right:[.07,.10,0]},
 focus:{duration:1.65,headPitch:-.12,chest:-.055},
 cheer:{duration:1.7,headPitch:.06,chest:.06,right:[.15,.15,-.04]},
 bow:{duration:1.8,headPitch:-.12,chest:-.075},
 fidget:{duration:1.45,right:[-.015,.055,.045],headPitch:-.045},
 neck_roll:{duration:1.9,headYaw:.105,headPitch:.045},
 nod:{duration:1.35,headPitch:-.15,chest:-.015},
 headshake:{duration:1.55,headYaw:-.17,chest:.005},
 peek:{duration:1.65,headYaw:.14,tilt:.025,headPitch:-.07},
 tap_toe:{duration:1.8,step:.035,tilt:.012},
 half_wave:{duration:1.6,right:[.10,.17,-.02],headYaw:.07},
 rub_palms:{duration:1.9,left:[.015,.095,-.055],right:[-.018,.09,-.045],headPitch:-.05},
 count_cards:{duration:2.1,right:[-.06,.08,-.025],headPitch:-.13},
 hands_hips:{duration:2.25,left:[-.11,-.09,.11],right:[.11,-.09,.10],chest:.045},
 facepalm:{duration:1.7,right:[.01,.19,.035],headPitch:-.19,chest:-.08},
 tiny_clap:{duration:1.7,left:[.035,.16,-.06],right:[-.03,.16,-.06],chest:.025},
 glance_crowd:{duration:1.6,headYaw:-.145,headPitch:.09},
 flinch:{duration:1.1,headPitch:.10,chest:.08,tilt:-.06},
 smirk:{duration:1.65,headYaw:.11,tilt:-.02},
 defeat:{duration:3.2,headPitch:-.24,chest:-.09,tilt:-.022}
});
const POOLS=Object.freeze({
 player:['glance','inspect','shift','sleeve','scratch','stretch','challenge','whisper','smirk',
  'fidget','nod','peek','tap_toe','half_wave','rub_palms','count_cards','hands_hips','glance_crowd'],
 ai:['glance','inspect','shift','sleeve','lean','focus','challenge','whisper','shrug',
  'bow','neck_roll','headshake','peek','tap_toe','rub_palms','hands_hips','facepalm','tiny_clap']
});
export function createLivingCastDirector(seed=2026){
 const cast={};
 for(const side of ['player','ai']){
  const random=rng(hash(seed,side));
  cast[side]={side,random,active:null,next:side==='player'?1.2:2.9,history:[],latest:'idle'};
 }
 const records=[],dialogues=[];let celebration=null;
 const exchanges={
  challenge:[['这手牌要是输了，我就把课桌吃了！','那你先准备好筷子。'],
             ['准备好接受本社团的压倒性胜利了吗？','我只准备好看你出丑。']],
  whisper:[['嘘……听说食堂今天又做茄子炒香蕉。','别说了，阿姨就在旁边！'],
           ['我有个绝妙的连招，你要不要听？','你先确定自己记得规则吧。']]
 };
 function record(side,type,seconds,reason){
  records.push({side,type,reason,at:+seconds.toFixed(2)});
  if(records.length>64)records.shift();
 }
 function start(side,type,seconds,reason='ambient'){
  const actor=cast[side],cfg=BEATS[type];if(!cfg||!actor)return false;
  actor.active={type,started:seconds,duration:cfg.duration,reason};
  actor.latest=type;actor.history.push(type);
  if(actor.history.length>8)actor.history.shift();
  actor.next=seconds+cfg.duration+2.9+actor.random()*4.2;
  record(side,type,seconds,reason);
  if(reason==='ambient'&&(type==='challenge'||type==='whisper')){
   const options=exchanges[type],pair=options[Math.floor(actor.random()*options.length)];
   dialogues.push({side,text:pair[0],kind:'prompt',type,at:seconds});
   actor.pendingReply=pair[1];
  }else if(reason.startsWith('paired_')){
   const sender=side==='player'?'ai':'player';
   const reply=cast[sender].pendingReply;
   if(reply){dialogues.push({side,text:reply,kind:'response',type,at:seconds});cast[sender].pendingReply=null;}
  }
  return true;
 }
 function signal(side,type,seconds){
  if(!cast[side]||!Number.isFinite(seconds)||celebration)return;
  const other=side==='player'?'ai':'player';
  if(type==='card'){
   start(side,'cheer',seconds,'card');
   // The opponent hears/sees a gesture and responds a beat later.
   cast[other].react={type:'eye_roll',at:seconds+.65,reason:'response_to_card'};
  }else if(type==='hurt'){
   start(side,'flinch',seconds,'damage');
   cast[other].react={type:'smirk',at:seconds+.53,reason:'response_to_hit'};
  }
 }
 function celebrate(winner,seconds){
  if(celebration||!['player','ai','draw'].includes(winner))return false;
  celebration={winner,started:seconds,duration:6.4};
  for(const side of ['player','ai'])cast[side].active=null;
  record(winner,'victory_dance',seconds,'real_match_result');
  return true;
 }
 function update(seconds,{busyPlayer=false,busyAi=false,reduced=false}={}){
  const out={};
  for(const side of ['player','ai']){
   const actor=cast[side],busy=side==='player'?busyPlayer:busyAi;
   if(celebration){
    const elapsed=seconds-celebration.started;
    if(elapsed<celebration.duration){
     const move=choreographVictory({elapsed,winner:celebration.winner,
      side,id:side==='player'?'E01':'G01',reduced});
     out[side]={type:move.winner?'dance':'defeat',stage:move.stage,
      weight:move.weight,step:move.x,tilt:move.lean,headYaw:move.yaw,
      headPitch:move.head,chest:move.lean*.45,
      right:[move.right*.30,move.right*.61,-.03],
      left:[-move.left*.30,move.left*.61,-.03],
      jump:move.bob};
     continue;
    }
    celebration=null;actor.next=seconds+1.8+actor.random()*3;
   }
   if(actor.react&&seconds>=actor.react.at&&!busy){
    start(side,actor.react.type,seconds,actor.react.reason);actor.react=null;
   }
   if(actor.active&&seconds>=actor.active.started+actor.active.duration)actor.active=null;
   if(!actor.active&&seconds>=actor.next&&!busy){
    const pool=POOLS[side],last=actor.history.slice(-2);
    const options=pool.filter(kind=>!last.includes(kind));
    const type=options[Math.floor(actor.random()*options.length)];
    start(side,type,seconds);
    if(type==='challenge'||type==='whisper'){
     const other=side==='player'?'ai':'player';
     if(!cast[other].react)cast[other].react={
      type:type==='challenge'?'eye_roll':'shrug',
      at:seconds+.74+actor.random()*.4,reason:'paired_'+type};
    }
   }
   const active=actor.active;
   if(!active||busy||reduced){out[side]={type:'idle',weight:0};continue;}
   const age=seconds-active.started,cfg=BEATS[active.type];
   // 3-part envelope: smooth anticipation, expressive hold, gentle recovery.
   const weight=smooth(age/.32)*(1-smooth((age-cfg.duration+.45)/.45));
   out[side]={...cfg,type:active.type,weight};
  }
  return out;
 }
 return{update,signal,celebrate,
  drainDialogue:()=>dialogues.splice(0,4),
  inspect:()=>({
  current:Object.fromEntries(Object.entries(cast).map(([s,a])=>[s,{active:a.active?.type||'idle',latest:a.latest,history:[...a.history]}])),
  celebration:celebration&&{...celebration},events:records.slice(-30)})};
}
