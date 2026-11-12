/**
 * R100 — Strict presentation-only adapter for existing canonical combo_effect.
 * This intentionally has NO Three.js import, mutation, RNG or game rules.
 * Invalid/missing actual engine outcomes must NEVER trigger cosmetic damage.
 */
export const COMBO_EFFECTS=Object.freeze({
 chalk_hit:Object.freeze({name:'粉笔弹射',duration:2.48,phase:'impact'}),
 chalk_direct:Object.freeze({name:'粉笔直击',duration:2.48,phase:'impact'}),
 broadcast_draw:Object.freeze({name:'广播室串台',duration:2.36,phase:'broadcast'}),
 poster_shield:Object.freeze({name:'招新海报',duration:2.46,phase:'poster'}),
 poster_draw:Object.freeze({name:'招新启事',duration:2.46,phase:'poster'})
});
const whole=(n,min=0,max=99)=>Number.isInteger(n)&&n>=min&&n<=max;
const validUid=n=>typeof n==='string'&&/^U\d{1,9}$/.test(n);
export function normalizeRealCombo(e){
 if(!e||e.type!=='combo_effect'||!Object.hasOwn(COMBO_EFFECTS,e.effect)||
    !['player','ai'].includes(e.side)||!whole(e.serial,1,100000000)||
    e.lane!==0)return null;
 const result={serial:e.serial,effect:e.effect,side:e.side,lane:0,
  damage:0,blocked:0,draw:0,shield:0,target:null,defeated:false,
  title:COMBO_EFFECTS[e.effect].name,
  duration:COMBO_EFFECTS[e.effect].duration};
 if(e.effect==='chalk_hit'){
  if(!validUid(e.target)||!whole(e.damage,0,2)||!whole(e.blocked,0,2)||
   e.damage+e.blocked!==2||typeof e.defeated!=='boolean')return null;
  result.target=e.target;result.damage=e.damage;result.blocked=e.blocked;
  result.defeated=e.defeated;
 }else if(e.effect==='chalk_direct'){
  if(e.damage!==1)return null;
  result.damage=1;
 }else if(e.effect==='broadcast_draw'||e.effect==='poster_draw'){
  if(e.draw!==1)return null;
  result.draw=1;
 }else if(e.effect==='poster_shield'){
  if(e.shield!==2||!validUid(e.target))return null;
  result.shield=2;result.target=e.target;
 }
 return Object.freeze(result);
}
export function comboReceiptText(event){
 const e=normalizeRealCombo(event)||event;
 if(!e||!Object.hasOwn(COMBO_EFFECTS,e.effect))return '';
 if(e.effect.startsWith('chalk'))return '真实伤害 '+e.damage+
  (e.blocked?' · 格挡 '+e.blocked:'')+(e.defeated?' · 对手退场':'');
 if(e.effect==='poster_shield')return '真实护盾 +'+e.shield;
 return '真实抽牌 +'+e.draw;
}
