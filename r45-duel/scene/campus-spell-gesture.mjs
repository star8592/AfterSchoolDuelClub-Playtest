/**
 * R173 46-card school-gesture motifs for the real original VRM hosts.
 * All values are bounded offsets to existing, proven source bone/IK rig.
 * Rules, HP, source avatar, and camera are never touched.
 *
 * Distinct school comedy motifs: flip-pan, eraser-throw, whistle, board-write,
 * stamp, bell, spoon, desk-fix, sports-throw, time-wind, chemistry, etc.
 * This is a QA gesture prototype, NOT completed bespoke animation clips.
 */
import {SCHOOL_MAGIC_IDENTITIES} from './campus-magic-bible.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const bell=x=>{const y=clamp(x);return Math.sin(Math.PI*y)**2};
const plans=Object.freeze({
 '教具投掷':{tag:'throw-eraser',r:[.18,.10,-.13],l:[-.05,.03,0],lean:.10,hop:.03,head:-.05},
 '黑暗食堂':{tag:'flip-wok',r:[.06,.14,-.11],l:[-.11,.10,-.12],lean:-.06,hop:.04,head:-.05},
 '体育荒诞':{tag:'sports-shout',r:[.13,.17,.02],l:[-.10,.13,.01],lean:-.04,hop:.055,head:.045},
 '教室怪谈':{tag:'chalk-point',r:[.11,.08,-.08],l:[-.07,-.06,0],lean:.035,hop:0,head:-.05},
 '时空校园':{tag:'turn-clock',r:[.06,.13,.06],l:[-.10,.09,-.02],lean:.01,hop:.01,head:.055},
 '社团实验':{tag:'laboratory-tinker',r:[.06,-.06,-.11],l:[-.10,.07,-.01],lean:.08,hop:.01,head:-.07},
 '校舍维修':{tag:'repair-desk',r:[.13,-.10,.02],l:[-.13,-.06,0],lean:.07,hop:.00,head:-.04},
 '作业文具':{tag:'flip-book',r:[.12,.10,-.03],l:[-.06,.09,-.04],lean:.03,hop:.01,head:-.035},
 '食堂灾难':{tag:'serve-soup',r:[.05,.05,-.13],l:[-.12,.10,-.12],lean:.04,hop:.015,head:-.03},
 '广播事故':{tag:'radio-button',r:[.08,-.03,-.10],l:[-.11,.08,-.08],lean:.035,hop:.015,head:.025},
 '体育呐喊':{tag:'megaphone',r:[.03,.21,-.09],l:[-.10,.15,-.07],lean:-.035,hop:.035,head:-.04}
});
export function schoolGestureForCard(id,age,side='player'){
 const entry=SCHOOL_MAGIC_IDENTITIES[id];
 if(!entry||!Number.isFinite(age)||age<0||age>2.8)return null;
 const base=plans[entry.family]||plans['教室怪谈'];
 const number=Number(id.slice(1))||1;
 // Every individual card modulates rhythm and offset (not merely recolored).
 const seed=((id.charCodeAt(0)*13+number*17)%19-9)/90;
 const first=bell((age-.23)/1.48);
 const snap=bell((age-1.11)/.72);
 const gain=(.76+number*.029)*Math.max(first,snap*.95);
 const alternate=side==='ai'?-1:1;
 return {
  card:id,signature:base.tag+'-'+number,
  strength:Math.min(1.0,gain),
  torsoPitch:base.lean*gain,
  headPitch:base.head*gain,
  hop:base.hop*gain,
  step:alternate*(.05+seed*.09)*snap,
  right:base.r.map((x,i)=>x*gain+(i===1?seed*.05*snap:0)),
  left:base.l.map((x,i)=>x*gain+(i===0?seed*.05*first:0))
 };
}
export const SCHOOL_GESTURE_FAMILIES=Object.freeze(Object.keys(plans));
