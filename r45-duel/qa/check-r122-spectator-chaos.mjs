import assert from 'node:assert/strict';
import {BY_ID,CARDS} from '../engine.mjs';
import {chooseCrowdAccident,CROWD_SCENARIOS,CROWD_LINES} from '../scene/spectator-chaos-contract.mjs';
const damaging=['blast','splash','stew','trick','eclipse','boomerang'];
const eligible=CARDS.filter(c=>c.kind==='spell'&&damaging.includes(c.effect));
assert.ok(eligible.length>=12);
for(const c of eligible){
 for(const serial of [1,2,3]){
  const event={type:'ASDC_R81_SPELL_RESULT',
   card:c.id,side:'player',serial,effect:c.effect,damage:2,directDamage:1};
  const chosen=chooseCrowdAccident(event,{force:true});
  assert.ok(chosen,'no event for '+c.id);
  assert.ok(CROWD_SCENARIOS[chosen.scenario]);
  assert.ok(chosen.spectatorIndex>=0&&chosen.spectatorIndex<4);
  assert.equal(chosen.gameplayHit,false);
  assert.equal(chosen.ruleDamage,0);
  assert.ok(CROWD_LINES[chosen.scenario].includes(chosen.line));
  assert.deepEqual(chosen,chooseCrowdAccident(event,{force:true}));
 }
 const miss=chooseCrowdAccident({type:'ASDC_R81_SPELL_RESULT',
  card:c.id,side:'ai',serial:3,effect:c.effect,damage:0},{force:true});
 assert.equal(miss.scenario,'misfire');
}
for(const c of CARDS.filter(c=>c.kind==='spell'&&!damaging.includes(c.effect))){
 assert.equal(chooseCrowdAccident({type:'ASDC_R81_SPELL_RESULT',
  card:c.id,side:'player',serial:2,effect:c.effect,damage:0},{force:true}),null);
}
for(const bad of [
 {type:'ASDC_R81_SPELL_RESULT',card:'Z99',side:'ai',serial:1,effect:'blast',damage:10},
 {type:'ASDC_R81_SPELL_RESULT',card:'K06',side:'both',serial:1,effect:'blast',damage:10},
 {type:'ASDC_R81_SPELL_RESULT',card:'K06',side:'ai',serial:-1,effect:'blast',damage:10},
 {type:'ASDC_R81_SPELL_RESULT',card:'K06',side:'ai',serial:1,effect:'heal',damage:10},
 {type:'FORGED',card:'K06',side:'ai',serial:1,effect:'blast',damage:10}
])assert.equal(chooseCrowdAccident(bad,{force:true}),null);
const c=BY_ID.K06,ones=Array.from({length:180},(_,i)=>chooseCrowdAccident({
 type:'ASDC_R81_SPELL_RESULT',card:c.id,side:'player',serial:i+1,
 effect:c.effect,damage:4,directDamage:4})).filter(Boolean);
assert.ok(ones.length>30&&ones.length<90);
console.log('R122_CROWD_CHAOS_CONTRACT_PASS',JSON.stringify({
 eligibleSpells:eligible.length,scenarios:Object.keys(CROWD_SCENARIOS).length,
 authoredLines:Object.values(CROWD_LINES).reduce((n,a)=>n+a.length,0),
 normalTriggerCount:ones.length,trials:180,canonicalRulesMutations:0
}));
