/**
 * R173 school-specific real-host reactions, bounded on original VRM skeleton.
 * Hilarity comes from physical cause: chalk dust -> sneeze/wipe, spicy meal
 * -> recoil, whistle -> cover ears, flying ball -> duck, homework -> panic.
 * Returns only additive offsets; no standalone meshes, no role mutation.
 */
import {SCHOOL_MAGIC_IDENTITIES} from './campus-magic-bible.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const patterns=Object.freeze({
 '教具投掷':{id:'eraser-head-bonk',lean:.11,duck:.09,
  headRoll:.11,headPitch:.06,r:[.03,.16,-.06],l:[-.09,.11,-.04]},
 '黑暗食堂':{id:'disgust-nose-cover',lean:-.13,duck:.02,
  headRoll:.08,headPitch:-.09,r:[.02,.13,-.12],l:[-.05,.16,-.10]},
 '体育荒诞':{id:'duck-sports-projectile',lean:-.12,duck:.11,
  headRoll:.07,headPitch:.13,r:[.06,.13,-.03],l:[-.08,.14,-.05]},
 '教室怪谈':{id:'chalk-cough-awkward',lean:-.06,duck:.04,
  headRoll:.05,headPitch:-.10,r:[.03,.12,-.10],l:[-.04,.08,-.03]},
 '时空校园':{id:'dizzy-time-glance',lean:.05,duck:.02,
  headRoll:.09,headPitch:-.035,r:[.08,.05,-.06],l:[-.06,.04,-.05]},
 '社团实验':{id:'experiment-startled',lean:-.085,duck:.065,
  headRoll:.07,headPitch:.075,r:[.10,.14,-.04],l:[-.08,.12,-.04]},
 '校舍维修':{id:'falling-desk-flinch',lean:-.07,duck:.08,
  headRoll:.06,headPitch:.05,r:[.06,.08,-.05],l:[-.09,.04,-.02]},
 '作业文具':{id:'paper-blinded',lean:-.045,duck:.05,
  headRoll:.04,headPitch:-.05,r:[.09,.14,-.04],l:[-.07,.16,-.02]},
 '食堂灾难':{id:'scalded-soup-hop',lean:-.08,duck:-.03,
  headRoll:.06,headPitch:.03,r:[.06,.13,-.08],l:[-.06,.16,-.08]},
 '广播事故':{id:'cover-ears',lean:-.08,duck:.05,
  headRoll:.02,headPitch:.095,r:[.04,.18,-.04],l:[-.07,.18,-.04]},
 '体育呐喊':{id:'crowd-whistle-flinch',lean:-.05,duck:.06,
  headRoll:.035,headPitch:.10,r:[.045,.18,-.02],l:[-.07,.19,-.03]}
});
export function schoolHitReactionForCard(card,age,side='player'){
 const item=SCHOOL_MAGIC_IDENTITIES[card];
 if(!item||!Number.isFinite(age)||age<0||age>.95)return null;
 const base=patterns[item.family]||patterns['教室怪谈'];
 const n=parseInt(card.slice(1),10)||1;
 const envelope=Math.sin(Math.PI*clamp(age/.95));
 // Bounded per-card variation: same family but different actor beat.
 const skew=((card.charCodeAt(0)+n*3)%9-4)*.022;
 const weight=envelope*(.85+n*.015);
 const sign=side==='player'?1:-1;
 return{signature:base.id+'-'+n,weight,
  lean:base.lean*weight*sign,
  crouch:base.duck*weight,
  headRoll:(base.headRoll+skew)*weight*sign,
  headPitch:base.headPitch*weight,
  right:base.r.map(v=>v*weight),left:base.l.map(v=>v*weight)};
}
export const SCHOOL_HIT_FAMILIES=Object.freeze(Object.keys(patterns));
