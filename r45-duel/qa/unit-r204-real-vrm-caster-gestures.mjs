import assert from 'node:assert/strict';
import {r204Sample,r204Style,R204_CAST_STYLES}from'../scene/campus-r204-caster-choreography.mjs';
import {SCHOOL_MAGIC_IDENTITIES}from'../scene/campus-magic-bible.mjs';
const ids=Object.keys(SCHOOL_MAGIC_IDENTITIES);
assert.equal(ids.length,46);
assert.equal(Object.keys(R204_CAST_STYLES).length,10);
const keys=new Set();
for(const id of ids){
 const st=r204Style(id);
 assert(st,'no action for '+id);
 keys.add(st.kind);
 const initial={id,serial:12,started:4.0,releasedAt:null,hitAt:null};
 const windup=r204Sample(initial,4.38);
 assert.equal(windup.phase,'windup');
 assert.equal(windup.actualModelLaunched,false);
 assert(windup.weight>.95);
 const hold=r204Sample({...initial,releasedAt:6.0},6.08);
 assert.equal(hold.phase,'hold-aim');
 const snap=r204Sample({...initial,releasedAt:6.0},6.36);
 assert.equal(snap.phase,'throw-snap');
 assert(snap.weight>.98&&snap.thrust>.75);
 const follow=r204Sample({...initial,releasedAt:6.0},6.62);
 assert.equal(follow.phase,'follow-through');
 const impact=r204Sample({...initial,releasedAt:6.0,hitAt:7.1},7.48);
 assert.equal(impact.phase,'hit-celebration');
 const end=r204Sample({...initial,releasedAt:6.0,hitAt:7.1},8.15);
 assert.equal(end.phase,'settled');assert.equal(end.weight,0);
 for(const q of [windup,hold,snap,follow,impact,end]){
  assert(q&&Number.isFinite(q.weight));
  for(const hand of ['R','L']){
   const points=q.hands[hand];
   assert(points?.length===3&&points.every(Number.isFinite));
   assert(points[0]>=-.85&&points[0]<=.85,id+' wrist X out of reach');
   assert(points[1]>=-.36&&points[1]<=.85,id+' wrist Y out of reach');
   assert(points[2]>=-.70&&points[2]<=.05,id+' wrist Z out of reach');
  }
  assert(q.hop<=.3&&q.yaw<=.4&&q.lean<=.35);
 }
 const reduced=r204Sample({...initial,releasedAt:6.0},6.32,{reducedMotion:true});
 assert(reduced.hop<snap.hop&&reduced.weight<snap.weight);
}
assert(keys.size>=13,'only one stiff generic cast style');
const a={id:'S08',started:1,serial:57,releasedAt:3,hitAt:4.15};
assert.equal(r204Sample(a,3.33).styleId,'S08');
assert.equal(r204Sample(a,4.55).phase,'hit-celebration');
assert.equal(r204Sample({id:'K03',serial:4,started:0,releasedAt:1},1.32).kind,'kitchen-flip');
console.log('R204_ALL_46_SOURCE_VRM_CASTER_STYLES_UNIT_PASS',JSON.stringify({
 spells:ids.length,uniqueMotionKinds:keys.size,
 bespokeSignatures:Object.keys(R204_CAST_STYLES).length,
 phases:['windup','hold-aim','throw-snap','follow-through','hit-celebration','settled'],
 originalSourceSkeletonOnly:true,noCameraCuts:true,reducedMotionConservative:true}));
