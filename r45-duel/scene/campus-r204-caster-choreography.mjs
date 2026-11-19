/**
 * R204: actual high-detail VRM podium duelist "cast → real body hit" acting.
 * Pure pose targets. Real source VRM IK solves BOTH elbows, shoulders and
 * wrists; never rotates skin joints to non-anatomical 360-degree positions.
 * No cinematics, light rings, fake low-poly card player, or camera cuts.
 */
const DEFAULT={windup:{R:[.33,.57,-.22],L:[-.30,.22,-.22]},
 snap:{R:[.64,.30,-.55],L:[-.22,.38,-.25]},
 follow:{R:[.35,.12,-.43],L:[-.28,.42,-.20]},
 cheer:{R:[.37,.63,-.17],L:[-.17,.60,-.17]},
 lean:.18,yaw:.16,hop:.13,head:-.12,kind:'campus-overhand'};
const p=(windup,snap,follow,cheer,lean,yaw,hop,head,kind)=>
 Object.freeze({windup,snap,follow,cheer,lean,yaw,hop,head,kind});
export const R204_CAST_STYLES=Object.freeze({
 E06:p({R:[.23,.79,-.16],L:[-.27,.34,-.19]},{R:[.70,.22,-.53],L:[-.18,.42,-.27]},
  {R:[.52,-.10,-.52],L:[-.24,.44,-.19]},{R:[.15,.66,-.23],L:[-.29,.57,-.19]},
  .28,.14,.12,-.19,'high-overhand-eraser'),
 Q05:p({R:[.42,.71,-.18],L:[-.31,.38,-.19]},{R:[.50,.29,-.49],L:[-.55,.65,-.22]},
  {R:[.15,.19,-.44],L:[-.32,.48,-.19]},{R:[.32,.65,-.23],L:[-.19,.46,-.21]},
  .13,.26,.10,.16,'chalk-conductor'),
 K01:p({R:[.29,.39,-.27],L:[-.55,.22,-.20]},{R:[.66,.45,-.57],L:[-.63,.67,-.26]},
  {R:[.42,.16,-.43],L:[-.41,.49,-.18]},{R:[.45,.66,-.15],L:[-.29,.52,-.17]},
  .24,.21,.15,-.06,'chef-pan-flip'),
 K07:p({R:[.21,.25,-.24],L:[-.29,.41,-.23]},{R:[.64,.61,-.50],L:[-.47,.59,-.25]},
  {R:[.44,.29,-.47],L:[-.48,.58,-.22]},{R:[.58,.72,-.20],L:[-.54,.69,-.20]},
  .20,.23,.26,.11,'frog-summoner'),
 P07:p({R:[.27,.42,-.22],L:[-.53,.46,-.24]},{R:[.70,.44,-.51],L:[-.64,.34,-.28]},
  {R:[.33,.13,-.43],L:[-.49,.55,-.17]},{R:[.52,.68,-.19],L:[-.56,.62,-.18]},
  .27,.24,.21,-.13,'ice-skater-launch'),
 K04:p({R:[.20,.61,-.22],L:[-.52,.40,-.24]},{R:[.73,.47,-.59],L:[-.53,.70,-.23]},
  {R:[.51,.09,-.49],L:[-.49,.44,-.20]},{R:[.57,.67,-.21],L:[-.44,.70,-.18]},
  .26,.22,.16,.16,'chili-chef-toss'),
 S08:p({R:[.22,.21,-.24],L:[-.38,.32,-.20]},{R:[.69,.16,-.59],L:[-.50,.68,-.25]},
  {R:[.39,.03,-.46],L:[-.45,.57,-.19]},{R:[.65,.73,-.15],L:[-.24,.62,-.21]},
  .26,.18,.14,-.22,'angry-vending-launch'),
 P03:p({R:[.41,.51,-.24],L:[-.47,.46,-.22]},{R:[.62,.38,-.56],L:[-.60,.41,-.30]},
  {R:[.55,.04,-.44],L:[-.49,.31,-.21]},{R:[.58,.77,-.18],L:[-.59,.69,-.20]},
  .30,.28,.24,-.15,'cardboard-dinosaur-roar'),
 X05:p({R:[.17,.78,-.19],L:[-.43,.60,-.21]},{R:[.74,.43,-.61],L:[-.68,.54,-.26]},
  {R:[.36,.19,-.48],L:[-.58,.48,-.24]},{R:[.54,.77,-.17],L:[-.51,.75,-.18]},
  .22,.27,.13,-.10,'homework-paper-storm'),
 Q07:p({R:[.35,.74,-.21],L:[-.38,.67,-.23]},{R:[.59,.53,-.50],L:[-.61,.61,-.27]},
  {R:[.42,.10,-.46],L:[-.44,.26,-.22]},{R:[.28,.73,-.16],L:[-.35,.73,-.19]},
  .23,.20,.22,.20,'second-moon-bowling')
});
const familyStyles=Object.freeze({
 E:'chalk-burst-overhand',G:'woodland-conjuring',T:'tide-pantomime',
 K:'kitchen-flip',Q:'classroom-conductor',S:'science-switch-flick',
 P:'sports-underarm',X:'time-galaxy-whip'
});
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>({
 R:a.R.map((x,i)=>lerp(x,b.R[i],t)),
 L:a.L.map((x,i)=>lerp(x,b.L[i],t))
});
export function r204Style(id){
 if(R204_CAST_STYLES[id])return R204_CAST_STYLES[id];
 if(!/^[EGTKQSPX]\d\d$/.test(id))return null;
 const f=id[0],n=Number(id.slice(1)),v=((n%4)-1.5)*.055;
 return {...DEFAULT,
  kind:familyStyles[f],
  lean:DEFAULT.lean+(f==='P'?.10:0),hop:DEFAULT.hop+(f==='K'?.07:0),
  yaw:DEFAULT.yaw+(f==='X'?.08:0),
  windup:{R:DEFAULT.windup.R.map((x,i)=>i===1?x+v:x),
   L:DEFAULT.windup.L.map((x,i)=>i===1?x-v:x)},
  snap:{R:DEFAULT.snap.R.map((x,i)=>i===0?x+v:x),
   L:DEFAULT.snap.L.map((x,i)=>i===0?x-v:x)}
 };
}
export function r204Sample(action,now,{reducedMotion=false}={}){
 if(!action||!Number.isFinite(now)||!Number.isFinite(action.started))return null;
 const style=r204Style(action.id);
 if(!style)return null;
 const delta=now-action.started;
 if(delta<-.10||delta>25)return null;
 const released=Number.isFinite(action.releasedAt);
 const afterRelease=released?now-action.releasedAt:-1;
 const afterImpact=Number.isFinite(action.hitAt)?now-action.hitAt:-1;
 let phase,weight,pose,thrust=0,anticipation=0,cheer=0,hop=0;
 if(!released){
  phase='windup';
  anticipation=smooth(delta/.30);
  weight=anticipation;
  pose=style.windup;
 }else if(afterRelease<.14){
  phase='hold-aim';
  weight=1;pose=style.windup;anticipation=1;
 }else if(afterRelease<.44){
  phase='throw-snap';
  thrust=smooth((afterRelease-.14)/.30);
  weight=1;pose=mix(style.windup,style.snap,thrust);
  hop=Math.sin(thrust*Math.PI)*style.hop;
 }else if(afterRelease<.79){
  phase='follow-through';
  thrust=1;
  weight=1;pose=mix(style.snap,style.follow,smooth((afterRelease-.44)/.35));
  hop=style.hop*.45*(1-smooth((afterRelease-.44)/.35));
 }else if(afterRelease<1.20){
  phase='recover';
  thrust=1;pose=style.follow;
  weight=1-smooth((afterRelease-.79)/.41);
 }else {
  phase='settled';
  pose=style.follow;weight=0;
 }
 if(afterImpact>=0&&afterImpact<.92){
  phase='hit-celebration';
  cheer=Math.sin(Math.PI*afterImpact/.92);
  pose=mix(pose,style.cheer,cheer);
  weight=Math.max(weight,cheer);
  hop+=style.hop*.48*cheer;
 }
 if(reducedMotion){weight*=.75;hop*=.4}
 const impactFactor=thrust||anticipation*.22;
 return {phase,kind:style.kind,styleId:action.id,weight:+weight.toFixed(5),
  thrust:+thrust.toFixed(5),anticipation:+anticipation.toFixed(5),
  celebration:+cheer.toFixed(5),
  hands:pose,lean:style.lean*weight*(.28+impactFactor*.72),
  yaw:style.yaw*weight*(.34+impactFactor*.66),
  hop,headPitch:style.head*weight*(.38+impactFactor*.62),
  serial:action.serial,preview:!!action.preview,
  actualModelLaunched:released};
}
