/**
 * Truth-preserving bridge between a real card-game exchange and the R14
 * original GLB movie stage. Only E01(player) versus G01(ai) is presently
 * modelled. Other cards MUST keep the existing cut-in; never impersonate
 * them with the wrong character.
 *
 * The canonical game engine owns ALL values; the 3D actor owns zero rules.
 */
const goodCount=x=>Number.isInteger(x)&&x>=0&&x<=99;
export const LIVE_3D_BRIDGE_VERSION='ASDC_R14_LIVE_EXCHANGE';
export function eligibleLive3DExchange(scene){
 return !!scene&&scene.effect==='exchange'&&scene.kind==='exchange'&&
  scene.actor_id==='E01'&&scene.target_card_id==='G01'&&
  scene.side==='player'&&Number.isInteger(scene.lane)&&
  scene.lane>=0&&scene.lane<=2&&
  Number.isSafeInteger(scene.event_serial)&&scene.event_serial>0&&
  goodCount(scene.damage)&&goodCount(scene.blocked)&&
  goodCount(scene.retaliation)&&goodCount(scene.retaliation_blocked)&&
  typeof scene.target_defeated==='boolean';
}
export function compileLive3DExchange(scene){
 if(!eligibleLive3DExchange(scene))return null;
 const event=Object.freeze({
  type:'exchange',from:'E01',to:'G01',side:'player',
  lane:scene.lane,serial:scene.event_serial,
  damage:scene.damage,blocked:scene.blocked,
  retaliation:scene.retaliation,
  retaliation_blocked:scene.retaliation_blocked,
  target_defeated:scene.target_defeated,
  attacker_defeated:scene.attacker_defeated===true
 });
 return Object.freeze({
  type:LIVE_3D_BRIDGE_VERSION,
  mode:'live',actor:'E01',target:'G01',event,
  noRulesMutation:true,autoplayVoice:false,
  previewArtApproved:false
 });
}
export function compile3DDemoR14(){
 return Object.freeze({
  type:LIVE_3D_BRIDGE_VERSION,
  mode:'demo',actor:'E01',target:'G01',
  source:'INDEPENDENT_CORE_GENERATED_DEMO_NOT_CURRENT_MATCH',
  autoplayVoice:false,previewArtApproved:false
 });
}
export function validateLive3DMessage(msg){
 if(msg?.type!==LIVE_3D_BRIDGE_VERSION||
   !['live','demo'].includes(msg.mode)||msg.actor!=='E01'||
   msg.target!=='G01'||msg.previewArtApproved!==false||
   msg.autoplayVoice!==false)return false;
 if(msg.mode==='demo')return !msg.event&&msg.source==='INDEPENDENT_CORE_GENERATED_DEMO_NOT_CURRENT_MATCH';
 const e=msg.event;
 return e?.type==='exchange'&&e.from==='E01'&&e.to==='G01'&&
  e.side==='player'&&Number.isInteger(e.lane)&&e.lane>=0&&e.lane<=2&&
  Number.isSafeInteger(e.serial)&&e.serial>0&&
  [e.damage,e.blocked,e.retaliation,e.retaliation_blocked].every(goodCount)&&
  typeof e.target_defeated==='boolean'&&typeof e.attacker_defeated==='boolean'&&
  msg.noRulesMutation===true;
}
