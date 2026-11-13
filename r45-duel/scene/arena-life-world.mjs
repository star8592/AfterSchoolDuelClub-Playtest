/**
 * R116: Shared, event-driven, character-specific life simulation in one arena.
 * The authoritative game emits facts; this model tracks attention, mood and
 * intent. It NEVER changes cards, turn order, health, damage or score.
 *
 * Deliberately tiny/deterministic: NO per-frame model inference, timers, APIs,
 * audio generation, global randomness, network calls or autonomous rules.
 */
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:a));
const hash=(seed,text)=>{
 let x=(seed>>>0)||2166136261;
 for(const c of String(text))x=Math.imul(x^c.charCodeAt(0),16777619)>>>0;
 return x>>>0;
};
const rng=seed=>()=>{
 let x=seed>>>0||1013904223;
 x^=x<<13;x^=x>>>17;x^=x<<5;
 seed=x>>>0;return seed/4294967296;
};
const PROFILES=Object.freeze({
 E01:{personality:'好胜但善于观察',bravery:.75,express:.76,patience:.57,empathy:.42},
 G01:{personality:'嘴硬、擅长反击',bravery:.82,express:.66,patience:.45,empathy:.32},
 E02:{personality:'轻巧敏捷',bravery:.58,express:.53,patience:.65,empathy:.60},
 E03:{personality:'热情鼓励队友',bravery:.70,express:.89,patience:.47,empathy:.76},
 E04:{personality:'运动员式冲动',bravery:.87,express:.79,patience:.32,empathy:.52},
 G02:{personality:'认真谨慎',bravery:.39,express:.37,patience:.87,empathy:.64},
 G03:{personality:'实验狂人',bravery:.57,express:.66,patience:.75,empathy:.44},
 G04:{personality:'沉稳骄傲',bravery:.76,express:.51,patience:.79,empathy:.40},
 M01:{personality:'热爱音乐的老师',bravery:.68,express:.87,patience:.68,empathy:.85},
 M02:{personality:'霸气护短的食堂阿姨',bravery:.92,express:.93,patience:.23,empathy:.77},
 T01:{personality:'爱插话的猫头鹰',bravery:.61,express:.81,patience:.34,empathy:.58},
 T02:{personality:'会吐槽的菜单',bravery:.53,express:.88,patience:.30,empathy:.36},
 T03:{personality:'认真热心的信使',bravery:.67,express:.60,patience:.81,empathy:.84},
 T04:{personality:'守护同伴的门卫',bravery:.82,express:.54,patience:.81,empathy:.75}
});
export const LIFE_PROFILES=PROFILES;
const calm=['inspect','glance','shift','sleeve','count_cards','focus','nod'];
const nervous=['fidget','rub_palms','scratch','peek','headshake','focus'];
const proud=['smirk','hands_hips','challenge','half_wave','stretch','nod'];
const social=['whisper','half_wave','tiny_clap','glance_crowd','nod','shrug'];
const protect=['lean','focus','half_wave','headshake','hands_hips'];
const support=['tiny_clap','half_wave','nod','peek','glance_crowd'];
const special={
 M02:['hands_hips','challenge','lean','tiny_clap','smirk'],
 T01:['peek','glance_crowd','nod','headshake'],
 T02:['headshake','peek','shrug'],
 E03:['tiny_clap','half_wave','nod','glance_crowd'],
 G02:['focus','inspect','count_cards','fidget'],
 G03:['inspect','focus','scratch','lean']
};
const motion=Object.freeze({
 glance:{yaw:.12,tilt:.01,head:-.015},
 inspect:{yaw:0,tilt:0,head:-.12},
 shift:{yaw:0,tilt:.025,head:0},
 sleeve:{yaw:.02,tilt:0,head:-.07},
 count_cards:{yaw:0,tilt:0,head:-.14},
 focus:{yaw:0,tilt:0,head:-.09},
 nod:{yaw:0,tilt:0,head:-.06},
 fidget:{yaw:.02,tilt:.016,head:-.055},
 rub_palms:{yaw:.01,tilt:0,head:-.07},
 scratch:{yaw:.04,tilt:0,head:-.03},
 peek:{yaw:.14,tilt:.028,head:-.08},
 headshake:{yaw:-.12,tilt:0,head:.035},
 smirk:{yaw:.06,tilt:-.015,head:.025},
 hands_hips:{yaw:0,tilt:.015,head:.06},
 challenge:{yaw:.08,tilt:.04,head:.03},
 half_wave:{yaw:.12,tilt:.015,head:0},
 stretch:{yaw:.05,tilt:-.016,head:.05},
 whisper:{yaw:.15,tilt:.02,head:-.04},
 tiny_clap:{yaw:0,tilt:.015,head:.025},
 glance_crowd:{yaw:-.14,tilt:0,head:.07},
 shrug:{yaw:.03,tilt:.018,head:0},
 lean:{yaw:.08,tilt:.045,head:-.07},
 eye_roll:{yaw:-.11,tilt:0,head:.08},
 flinch:{yaw:.02,tilt:-.04,head:.13},
 cheer:{yaw:.09,tilt:.035,head:.06},
 defeat:{yaw:0,tilt:-.04,head:-.17}
});
export function createArenaLifeWorld(seed=116){
 const people=new Map(),events=[];let now=0,sequence=0,result=null;
 let situation={round:1,turn:'player',player:20,ai:20};
 function register(key,{id='E01',side='player',role='summon'}={}){
  if(typeof key!=='string'||!key||key.length>64)return null;
  if(people.has(key))return people.get(key);
  if(!['player','ai'].includes(side)||!['duelist','summon','spectator'].includes(role))return null;
  const p=PROFILES[id]||PROFILES.E01;
  const random=rng(hash(seed,key+':'+id));
  const actor={key,id,side,role,personality:p.personality,
   bravery:p.bravery,express:p.express,patience:p.patience,empathy:p.empathy,
   random,confidence:.43+p.bravery*.24,tension:.12,
   attention:'opponent',emotion:'focused',intent:'glance',
   next:now+1.6+random()*3,until:now,latestEvent:null,
   priority:0,history:[],activeSeconds:0,
   eventCount:0,lastAction:null,historyOfEvents:[],
   situation:'tied'};
  people.set(key,actor);return actor;
 }
 function remove(key){return people.delete(key)}
 function record(type,side,at){
  const event={number:++sequence,type,side,at:+at.toFixed(2)};
  events.push(event);if(events.length>65)events.shift();return event;
 }
 function makeIntent(actor,name,at,priority,attention,reason){
  if(!motion[name])return;
  if(actor.priority>priority&&at<actor.until)return;
  actor.intent=name;actor.until=at+(priority>=3?1.50:1.15+actor.random()*1.05);
  actor.next=actor.until+(priority>=3?.6:1.8)+actor.random()*(actor.patience*3+1.7);
  actor.priority=priority;
  actor.attention=attention||actor.attention;
  actor.history.push(name);if(actor.history.length>10)actor.history.shift();
  actor.lastAction={intent:name,reason,at:+at.toFixed(2)};
 }
 function observe(type,{side,at=now,winner,kind}={}){
  if(!['card','hit','result','turn','social','reply'].includes(type)||!Number.isFinite(at)||
     !['player','ai','draw'].includes(side))return false;
  // Event notifications are authoritative only if their caller checked the
  // real scene/game protocol. No path for back-propagating into engine.mjs.
  now=Math.max(now,at);
  if(result&&type!=='result'){
   // A genuine new turn after the old result reopens the emotional lifecycle.
   result=null;
   for(const a of people.values()){a.priority=0;a.until=at;a.next=at+1;}
  }
  record(type,side,at);
  if(type==='result')result=winner||side;
  for(const actor of people.values()){
   const own=actor.side===side,enemy=side!=='draw'&&!own;
   if(type==='card'){
    actor.confidence=clamp(actor.confidence+(own?.045:-.025));
    actor.tension=clamp(actor.tension+(enemy?.075:.018));
    actor.emotion=own?'expectant':actor.tension>.48?'nervous':'curious';
    makeIntent(actor,own?(actor.bravery>.65?'challenge':'focus'):
     (actor.patience>.7?'inspect':'eye_roll'),at,3,'opponent','observed_card');
   }else if(type==='hit'){
    actor.confidence=clamp(actor.confidence+(own?-.095:.06));
    actor.tension=clamp(actor.tension+(own?.21:.045));
    actor.emotion=own?'hurt':actor.empathy>.68?'concerned':'satisfied';
    const reaction=own?(actor.bravery>.7?'headshake':'flinch'):
      actor.empathy>.7?'peek':'smirk';
    makeIntent(actor,reaction,at,4,own?'self':'opponent','observed_hit');
   }else if(type==='turn'){
    actor.emotion=own?'focused':'watchful';
    makeIntent(actor,own?'inspect':'glance',at,2,'cards','turn_change');
   }else if(type==='social'||type==='reply'){
    // A real low-voice exchange is a two-person interaction, not a scene
    // wide canned joke. Bystanders glance up only if expressive enough.
    const whisper=kind==='whisper';
    if(actor.role==='duelist'){
     actor.attention='opponent';
     actor.emotion=whisper?(own?'conspiratorial':'curious'):
      (own?'playful':'provoked');
     if(!own)actor.tension=clamp(actor.tension+(whisper?.014:.055));
     makeIntent(actor,own?(whisper?'whisper':'smirk'):
       (whisper?'peek':actor.bravery>.68?'challenge':'eye_roll'),
       at,3,'opponent',type+'_'+(kind||'chat'));
    }else if(actor.role==='spectator'&&actor.express>.76){
     actor.emotion='curious';
     makeIntent(actor,'peek',at,2,'duelists','noticed_whisper');
    }
   }else if(type==='result'){
    const win=(result!=='draw'&&actor.side===result);
    actor.emotion=result==='draw'?'relieved':win?'elated':'disappointed';
    actor.confidence=clamp(actor.confidence+(win?.12:-.10));
    actor.tension=clamp(actor.tension-.15);
    makeIntent(actor,result==='draw'?'nod':win?'cheer':'defeat',
      at,5,'teammates','match_result');
   }
   actor.latestEvent={type,side,kind:kind||null,at};
   actor.eventCount++;actor.historyOfEvents.push(type);
   if(actor.historyOfEvents.length>5)actor.historyOfEvents.shift();
  }
  return true;
 }
 function setMatch(next,at=now){
  if(!next||!['player','ai','ended'].includes(next.turn)||
   ![next.player,next.ai,next.round].every(Number.isInteger)||
   next.player<0||next.player>20||next.ai<0||next.ai>20||
   next.round<1||next.round>30)return false;
  if(situation.round===next.round&&situation.turn===next.turn&&
     situation.player===next.player&&situation.ai===next.ai)return true;
  const old={...situation};
  situation={player:next.player,ai:next.ai,round:next.round,turn:next.turn};
  for(const actor of people.values()){
   const mine=situation[actor.side],theirs=situation[actor.side==='player'?'ai':'player'];
   actor.situation=mine<theirs?'behind':mine>theirs?'ahead':'tied';
   if(mine<theirs&&situation.round>=3){
    actor.tension=clamp(actor.tension+.025);
    actor.confidence=clamp(actor.confidence-.011);
   }
   if(mine>theirs&&situation.round>=3)
    actor.confidence=clamp(actor.confidence+.008);
  }
  if(old.turn!==next.turn&&['player','ai'].includes(next.turn))
   observe('turn',{side:next.turn,at});
  return true;
 }
 function ambientPool(actor){
  if(actor.situation==='behind'&&actor.role==='duelist')return nervous;
  if(actor.tension>.51||actor.confidence<.35)return nervous;
  if(actor.confidence>.69&&actor.bravery>.58)return proud;
  if(actor.role==='spectator')return support;
  if(actor.empathy>.74&&actor.emotion==='concerned')return protect;
  if(actor.express>.7&&actor.tension<.3)return social;
  return calm;
 }
 function choose(actor,at,allowed){
  const pool=[...(special[actor.id]||[]),...ambientPool(actor)];
  const candidates=pool.filter(x=>(!allowed||allowed.includes(x))&&!actor.history.slice(-2).includes(x));
  const fallback=allowed?.filter(x=>!actor.history.slice(-2).includes(x))||
    pool.filter(x=>!actor.history.slice(-2).includes(x));
  const options=candidates.length?candidates:fallback.length?fallback:['glance'];
  const name=options[Math.floor(actor.random()*options.length)];
  makeIntent(actor,name,at,1,actor.role==='spectator'?'arena':'opponent','life_ambient');
  return name;
 }
 function tick(at,{quiet=false}={}){
  if(!Number.isFinite(at))return;
  const dt=clamp(at-now,0,.20);now=Math.max(now,at);
  for(const actor of people.values()){
   actor.tension=clamp(actor.tension-dt*.006);
   actor.confidence=clamp(actor.confidence+(actor.bravery*.24+.43-actor.confidence)*dt*.008);
   if(result)return;
   if(quiet)continue;
   if(at>=actor.until)actor.priority=0;
   if(at>=actor.next)choose(actor,at);
  }
 }
 function read(key,at=now){
  const a=people.get(key);if(!a)return null;
  const active=at<a.until;
  const length=clamp(a.until-(a.lastAction?.at||at),.2,4);
  const phase=clamp((at-(a.lastAction?.at||at))/length);
  const weight=active?Math.sin(Math.PI*phase)**2:0;
  const shape=motion[a.intent]||motion.glance;
  return {id:a.id,side:a.side,role:a.role,emotion:a.emotion,
   confidence:+a.confidence.toFixed(3),tension:+a.tension.toFixed(3),
   attention:a.attention,intent:active?a.intent:'idle',
   weight:+weight.toFixed(3),
   yaw:shape.yaw*weight,tilt:shape.tilt*weight,head:shape.head*weight,
   lastAction:a.lastAction,latestEvent:a.latestEvent};
 }
 function chooseFor(key,at,allowed){
  const actor=people.get(key);if(!actor)return null;
  // Existing high priority action wins until it finishes. The audio/dialogue
  // layer remains the sole authority on whether a line is actually spoken.
  if(at<actor.until&&actor.priority>=3&&(!allowed||allowed.includes(actor.intent)))
   return actor.intent;
  return choose(actor,at,allowed);
 }
 return {register,remove,observe,tick,read,chooseFor,setMatch,
  inspect:()=>({context:{...situation},actors:[...people.values()].map(a=>({
   key:a.key,id:a.id,side:a.side,role:a.role,personality:a.personality,
   emotion:a.emotion,situation:a.situation,tension:+a.tension.toFixed(3),
   confidence:+a.confidence.toFixed(3),attention:a.attention,
   intent:a.intent,lastAction:a.lastAction,eventCount:a.eventCount,
   latestEvent:a.latestEvent})),
   events:events.slice(-24),result,size:people.size})
 };
}
