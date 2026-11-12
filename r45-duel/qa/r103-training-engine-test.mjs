import assert from 'node:assert/strict';
import {TRIALS,createTrial,trialStatus,actTrial} from '../training/trials.mjs';
import {CARDS,MAX_HP} from '../engine.mjs';
const counts={tests:0,levels:0,combos:0,realAttacks:0};
const check=(value,description)=>{assert.ok(value,description);counts.tests++};
check(TRIALS.length===4,'four specific and different user exercises');
check(CARDS.length===20,'no fabricated extra rules cards');
for(const i of TRIALS.keys()){
 let s=createTrial(i),step=trialStatus(s);
 check(step.energy===TRIALS[i].energy,'actual energy stage setup');
 check(step.hp.player===MAX_HP&&step.hp.ai===MAX_HP,'true starting 20 HP');
 check(!s.completed,'uncompleted before action');
 const wrong=actTrial(s,{cardId:'T06'});
 check(!wrong.ok,'wrong card may not accidentally complete');
 let moves=i===0?['E01']:i===1?['E05']:i===2?[]:['E01','G01'];
 for(const id of moves){
  const res=actTrial(s,{cardId:id});
  check(res.ok,'card triggers genuine legal play '+id);
 }
 if(i===2){
  check(!actTrial(s,{cardId:'E01'}).ok,'must end turn to attack');
  const result=actTrial(s,{end:true});
  check(result.ok&&result.type==='direct_hit'&&result.damage===1,'no fake direct hit');
  counts.realAttacks++;
 }
 check(s.completed,'trial needs actual authoritative engine success');
 check(trialStatus(s).completed,'status reflected after actual action');
 if(i===3){
  const combo=s.game.events.findLast(e=>e.type==='combo_effect');
  check(combo.effect==='chalk_direct'&&combo.damage===1,'real first dual-style combo');
  counts.combos++;
 }
 counts.levels++;
}
console.log('R103_TRAINING_ENGINE',JSON.stringify(counts));
