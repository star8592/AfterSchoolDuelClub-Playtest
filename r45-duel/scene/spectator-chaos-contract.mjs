/**
 * R122 - spectator slapstick contract. Presentation ONLY. A deflected
 * spark must never be represented as a canonical player/creature hit.
 * Result sources are ONLY actual R81 rule-emitted spell events.
 */
import {BY_ID} from '../engine.mjs';
import {SPELL_SIGNATURES} from './spell-response-contract.mjs';

export const CROWD_SCENARIOS=Object.freeze({
 ricochet:{name:'误弹反射',caption:'魔法命中后反弹上看台',duration:1.75},
 overshoot:{name:'火力过猛',caption:'魔法余波冲过边线',duration:1.85},
 shockwave:{name:'冲击波溢出',caption:'魔法冲击波扫过观众席',duration:1.90},
 misfire:{name:'施法打偏',caption:'法术偏航飞向看台',duration:1.80}
});
export const CROWD_LINES=Object.freeze({
 ricochet:[
  '啊啊！我的爆米花替我挡了一下！',
  '谁把魔法当乒乓球打过来了！',
  '我只是来看比赛的！怎么还要接球啊？'],
 overshoot:[
  '太大了！这招的安全距离到底在哪儿！',
  '救命！我的头发参加了决赛！',
  '别打看台！我们买的是观众票！'],
 shockwave:[
  '哎哟！谁把我的书包吹到了校长席！',
  '啊——等等，我的假发……不对，是校帽！',
  '这风大得连试卷都飞走了！'],
 misfire:[
  '啊啊啊！裁判！这球打到观众席啦！',
  '同学！瞄准镜在那边，不在我脸上！',
  '我的饮料！我刚买的！']
});
const hash=x=>{
 let h=2166136261;
 for(const c of String(x)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 return h>>>0;
};
export function chooseCrowdAccident(event,{force=false}={}){
 if(!event||event.type!=='ASDC_R81_SPELL_RESULT'||!['player','ai'].includes(event.side)||
   !Number.isInteger(event.serial)||event.serial<=0)return null;
 const card=BY_ID[event.card],signature=SPELL_SIGNATURES[event.card];
 if(card?.kind!=='spell'||!signature||card.effect!==event.effect)return null;
 // No accidents for beneficial/healing cards. Never fake health loss.
 const total=Math.max(0,Number(event.damage)||0);
 const damagingKinds=new Set(['blast','splash','stew','trick','eclipse','boomerang']);
 if(!damagingKinds.has(card.effect))return null;
 const roll=hash(event.card+':'+event.side+':'+event.serial);
 // In normal play about one in three eligible casts develops collateral.
 // Testing override is opt-in and must NEVER be a production default.
 if(!force&&roll%3!==0)return null;
 const scenario=total===0?'misfire':
  ['ricochet','overshoot','shockwave'][Math.floor(roll/3)%3];
 const index=(roll>>>8)%4;
 const line=CROWD_LINES[scenario][(roll>>>15)%CROWD_LINES[scenario].length];
 return Object.freeze({
  serial:event.serial,card:event.card,side:event.side,
  element:signature.element,scenario,spectatorIndex:index,
  line,caption:CROWD_SCENARIOS[scenario].caption,
  // This is an arena-only visual comic beat. Never touches scoreboard.
  ruleDamage:0,gameplayHit:false,seed:roll
 });
}
