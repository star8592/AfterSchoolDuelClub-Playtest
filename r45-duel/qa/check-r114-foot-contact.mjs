import assert from 'node:assert/strict';
import {contactStep} from '../scene/foot-contact.mjs';
let left=0,right=0,maxLift=0;
for(const stage of ['stomp','side_step','crowd_clap']){
 for(let t=.1;t<6.1;t+=.037){
  const p=contactStep(t,stage,0);
  assert.ok(['L','R'].includes(p.stance));
  assert.ok(p.swing!==p.stance);
  assert.ok(p.lift>=0&&p.lift<=.045);
  assert.equal(contactStep(t,stage,0,true).lift,0);
  if(p.stance==='L')left++;else right++;
  maxLift=Math.max(maxLift,p.lift);
 }
}
assert.ok(left>0&&right>0&&maxLift>.02);
for(const stage of ['surprise','final_pose','defeat']){
 assert.equal(contactStep(3,stage,0).lift,0);
}
console.log('R114_FOOT_CONTACT_UNIT_PASS',JSON.stringify({left,right,maxLift}));
