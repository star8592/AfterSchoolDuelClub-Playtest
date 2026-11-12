/** R90 event-synchronised, presentation-only choreography.
 * All values affect Three.js transforms only; authoritative HP/turn data stay in engine.mjs.
 */
const PROFILES=Object.freeze({
 E03:{power:.78,quick:1.15,tilt:.10,knock:.65,up:.035,color:0x88dfec},
 E04:{power:.96,quick:.86,tilt:.075,knock:.88,up:.015,color:0xffc775},
 G02:{power:.87,quick:.91,tilt:.13,knock:.72,up:.019,color:0xa6daff},
 G03:{power:1.06,quick:1.17,tilt:.16,knock:.78,up:.032,color:0xb4a4ff},
 G04:{power:.92,quick:1.04,tilt:.09,knock:.67,up:.02,color:0xe6b8f6},
 T03:{power:.79,quick:1.23,tilt:.095,knock:.62,up:.037,color:0x93f0ce},
 T04:{power:1.21,quick:.78,tilt:.085,knock:1.12,up:.01,color:0xffad76}
});
export const R90_HIT_PHASE=.42;
export const R90_HITSTOP_START=.43;
export const R90_HITSTOP_END=.495;
export function isR90Human(id){return Object.hasOwn(PROFILES,id)}
export function r90Profile(id){return PROFILES[id]||{power:.86,quick:1,tilt:.08,knock:.72,up:.02,color:0xffd58b}}
function ease(a,b,t){const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x)}
export function r90Choreography(phase,attackerId,targetId,damage){
 const t=Math.max(0,Math.min(1,phase));
 const atk=r90Profile(attackerId),def=r90Profile(targetId||attackerId);
 const wind=ease(.035,.13,t)*(1-ease(.18,.31,t));
 const thrust=ease(.22,.42,t)*(1-ease(.52,.72,t));
 const collision=ease(.385,.43,t)*(1-ease(.49,.59,t));
 const knocked=ease(.42,.50,t)*(1-ease(.73,.94,t));
 const settle=ease(.82,1,t);
 const damageFactor=damage>0?Math.min(1.24,.84+Math.sqrt(Math.max(0,damage))*.17):.24;
 return {
  wind,thrust,collision,knocked,settle,damageFactor,
  attacker:{offset:(-.09*wind+.67*thrust)*atk.power,lean:(-.12*wind+.16*thrust)*atk.tilt/.12,
    lift:atk.up*thrust,upperTwist:.11*thrust*atk.quick},
  defender:{offset:(.07*collision+.34*knocked)*def.knock*damageFactor,
    lean:(.07*collision+.20*knocked)*def.tilt/.10*damageFactor,
    lift:.02*collision*damageFactor,upperTwist:-.08*knocked},
  impact:collision,
  sparks:damage>0?Math.min(1.4,.7+damage*.13):.26,
  color:atk.color,
  freeze:t>=R90_HITSTOP_START&&t<R90_HITSTOP_END
 };
}
