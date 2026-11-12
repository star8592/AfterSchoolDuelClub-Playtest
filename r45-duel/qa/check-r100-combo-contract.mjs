import assert from 'node:assert/strict';
import {normalizeRealCombo,comboReceiptText} from '../scene/combo-contract.mjs';
import {LESSONS,createTutorialGame,playTutorialCard} from '../tutorial.mjs';
import {createGame,playCard,endTurn,aiTurn,legalMoves} from '../engine.mjs';
let checks=0;
const test=(ok,name)=>{assert.ok(ok,name);checks++};
const accepted=[];
for(let level=1;level<=3;level++)for(let seed=1;seed<=100;seed++){
 const game=createTutorialGame(level,seed),lesson=LESSONS[level-1];
 const first=playTutorialCard(game,0);
 test(first.ok,'first legal card');
 const second=playTutorialCard(game,0);
 test(second.ok,'second legal card');
 const real=game.events.findLast(e=>e.type==='combo_effect'&&e.side==='player');
 const parsed=normalizeRealCombo(real);
 test(parsed&&parsed.effect===lesson.effect,'actual engine event validates');
 test(!normalizeRealCombo({...real,serial:0}), 'serial 0 rejected');
 test(!normalizeRealCombo({...real,type:'card_play'}),'fake event type rejected');
 test(!normalizeRealCombo({...real,side:'audience'}),'invalid side rejected');
 test(!normalizeRealCombo({...real,lane:2}),'legacy 3-lane event rejected');
 test(comboReceiptText(real).length>0,'caption is derived from real event');
 accepted.push({level,effect:parsed.effect,damage:parsed.damage,shield:parsed.shield,draw:parsed.draw});
}
for(const fake of [
 null,{}, {type:'combo_effect',serial:1,effect:'chalk_hit',side:'player',lane:0,damage:2,blocked:0,defeated:true,target:'FAKE'},
 {type:'combo_effect',serial:1,effect:'chalk_hit',side:'player',lane:0,damage:2,blocked:2,defeated:true,target:'U7'},
 {type:'combo_effect',serial:2,effect:'poster_shield',side:'player',lane:0,shield:2,target:'M02'},
 {type:'combo_effect',serial:3,effect:'broadcast_draw',side:'ai',lane:0,draw:999},
 {type:'combo_effect',serial:4,effect:'unknown',side:'player',lane:0},
 {type:'combo_effect',serial:5,effect:'poster_draw',side:'player',lane:1,draw:1},
]) test(normalizeRealCombo(fake)===null,'invalid fabricated combo rejected');
for(const type of ['chalk_direct','poster_draw']){
 const e={type:'combo_effect',serial:8,effect:type,side:'ai',lane:0,
  damage:type==='chalk_direct'?1:undefined,draw:type==='poster_draw'?1:undefined};
 test(normalizeRealCombo(e)?.effect===type,'valid free-play '+type+' variant');
}
// Actual unrestricted matches for the two outcome-dependent fallbacks.
for(const [seed,first,second,effect] of [
 [9,'E01','G01','chalk_direct'],
 [14,'G05','T05','poster_draw'],
 [97,'G01','T01','poster_shield']
]){
 const g=createGame(seed);
 for(const card of [first,second]){
  const move=legalMoves(g).find(m=>m.id===card);
  test(move!==undefined,'genuine free duel card '+card+' is legal');
  test(playCard(g,move.index,0).ok,'real free duel card '+card+' played');
 }
 const raw=g.events.findLast(e=>e.type==='combo_effect');
 const normalized=normalizeRealCombo(raw);
 test(normalized?.effect===effect,'free play real '+effect+' event validated');
 if(effect==='chalk_direct')test(normalized.damage===1&&normalized.target===null,
  'direct effect does not invent missing unit target');
 if(effect==='poster_draw')test(normalized.draw===1&&normalized.shield===0,
  'no phantom shield when ally missing');
}
console.log('R100_REAL_EVENT_CONTRACT',JSON.stringify({passed:true,scenarios:300,checks,accepted:accepted.length,
 effects:[...new Set(accepted.map(x=>x.effect))]}));
