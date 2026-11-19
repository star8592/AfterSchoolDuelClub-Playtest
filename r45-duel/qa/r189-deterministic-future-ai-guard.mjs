/** R189 release-proof: next AI summon planned via cloned real rules is EXACT
 * no stochastic guesses, no fake model, no mutated player's true state. */
import assert from 'node:assert/strict';
import {createGame,endTurn,aiTurn,playCard,legalMoves,
 DECK_PRESETS,BY_ID} from '../engine.mjs';
let cases=0,actors=0;
for(const deck of Object.keys(DECK_PRESETS)){
 for(let seed=1;seed<=300;seed+=3){
  const real=createGame(seed,deck);
  // Some game states already include a played player card; clone must remain
  // byte exact and prediction still equal once AI follows.
  const possible=legalMoves(real);
  if(possible.length&&seed%2===0)playCard(real,possible[0].index,0);
  const untouched=JSON.stringify(real),copy=structuredClone(real);
  const originalSerial=real.serial;
  endTurn(copy);if(copy.phase==='playing'&&copy.active==='ai')aiTurn(copy);
  const predicted=copy.events.filter(e=>e.serial>originalSerial&&
   e.type==='card_play'&&e.side==='ai'&&BY_ID[e.card]?.kind==='unit')
   .map(e=>e.card);
  assert.equal(JSON.stringify(real),untouched,'prediction changed real game state');
  endTurn(real);if(real.phase==='playing'&&real.active==='ai')aiTurn(real);
  const observed=real.events.filter(e=>e.serial>originalSerial&&
   e.type==='card_play'&&e.side==='ai'&&BY_ID[e.card]?.kind==='unit')
   .map(e=>e.card);
  assert.deepEqual(predicted,observed,deck+' / '+seed);
  actors+=observed.length;cases++;
 }
}
console.log('R189_DETERMINISTIC_AI_NEXT_TURN_GUARD_PASS',JSON.stringify({
 cases,existingDecks:Object.keys(DECK_PRESETS).length,unitSummons:actors,
 actualRuleStateUnmodifiedByPrediction:true}));
