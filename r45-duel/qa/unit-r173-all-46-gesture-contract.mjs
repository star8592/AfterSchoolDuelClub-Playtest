/**
 * R173 all 46 per-card school cast/hit motion contracts, pure deterministic
 * no WebGL. Not a substitute for physical VRM pose review or Android QA.
 */
import assert from 'node:assert/strict';
import{SCHOOL_MAGIC_IDENTITIES}from'../scene/campus-magic-bible.mjs';
import{schoolGestureForCard,SCHOOL_GESTURE_FAMILIES}from'../scene/campus-spell-gesture.mjs';
import{schoolHitReactionForCard,SCHOOL_HIT_FAMILIES}from'../scene/campus-spell-hit-reaction.mjs';
import{COMIC_BEATS}from'../audio-engine.mjs';
import{readFileSync}from'node:fs';
const queue=JSON.parse(readFileSync(new URL('../assets/audio/r171-campus-voice-production-queue.json',import.meta.url)));
const ids=Object.keys(SCHOOL_MAGIC_IDENTITIES);
assert.equal(ids.length,46);
assert.equal(queue.clips.length,230);
assert.equal(queue.recorded,0);
assert.equal(queue.clips.filter(x=>x.recorded).length,0);
const castKeys=new Set(),hitKeys=new Set(),fullFoley=new Set();
let inputCases=0;
for(const id of ids){
 const card=SCHOOL_MAGIC_IDENTITIES[id];
 for(const side of ['player','ai']){
  const cast=schoolGestureForCard(id,1.5,side);
  const hit=schoolHitReactionForCard(id,.45,side);
  assert(cast&&hit,id);
  assert(Math.abs(cast.torsoPitch)<.20&&cast.hop<.12);
  assert(Math.abs(hit.lean)<.20&&Math.abs(hit.headRoll)<.20&&hit.crouch<.18);
  for(const part of [...cast.right,...cast.left,...hit.right,...hit.left])
   assert(Number.isFinite(part)&&Math.abs(part)<.26,id);
  const before=schoolGestureForCard(id,-.01,side);
  assert.equal(before,null);
  assert.equal(schoolHitReactionForCard(id,1.2,side),null);
  inputCases++;
 }
 castKeys.add(schoolGestureForCard(id,1.5).signature);
 hitKeys.add(schoolHitReactionForCard(id,.45).signature);
 const script=queue.clips.filter(x=>x.id===id);
 assert.equal(script.length,5,id);
 const foley=COMIC_BEATS['school_'+id];
 assert(foley&&foley.length>=2);
 fullFoley.add(JSON.stringify(foley));
}
assert.equal(castKeys.size,46);
assert.equal(hitKeys.size,46);
assert.equal(fullFoley.size,46);
assert(SCHOOL_GESTURE_FAMILIES.length>=10);
assert(SCHOOL_HIT_FAMILIES.length>=10);
console.log('R173_ALL_46_MOTION_AND_FOLEY_CONTRACT',JSON.stringify({
 pass:true,cards:ids.length,castSignatures:castKeys.size,
 hitSignatures:hitKeys.size,schoolFamilies:SCHOOL_GESTURE_FAMILIES.length,
 hitFamilies:SCHOOL_HIT_FAMILIES.length,uniqueFoleyTimelines:fullFoley.size,
 evaluatedHostSides:inputCases,voicePlan:queue.clips.length,
 actualNewVoiceCount:queue.recorded,
 motionOffsetBound:'.26 (source VRM IK local target units)'}));
