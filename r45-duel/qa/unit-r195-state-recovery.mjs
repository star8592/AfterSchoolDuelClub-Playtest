import assert from 'node:assert/strict';
import{BY_ID,createGame,legalMoves,playCard,endTurn,aiTurn}from'../engine.mjs';
import{r195NeededRealGlbs,r195Fingerprint,R195_SOURCE_IDS}from'../r195-recovery-contract.mjs';
let tests=0;
for(const preset of ['classic','classroom','kitchen','science','sports','cosmos']){
 const g=createGame(6,preset);
 for(let n=0;n<10;n++){
  const before=structuredClone(g),fingerprint=r195Fingerprint(g);
  const ids=r195NeededRealGlbs(g,BY_ID);
  assert(ids.every(x=>R195_SOURCE_IDS.includes(x)));
  assert.equal(new Set(ids).size,ids.length);
  assert.deepEqual(g,before);
  assert.deepEqual(r195Fingerprint(g),fingerprint);
  tests++;
  if(g.phase==='ended')break;
  const m=legalMoves(g).at(0);
  if(m)assert(playCard(g,m.index,0).ok);
  if(g.phase==='playing')endTurn(g);
  if(g.phase==='playing'&&g.active==='ai')aiTurn(g);
 }
}
assert(tests>=25);
const a=createGame(173,'classic'),b=structuredClone(a),sig=r195Fingerprint(a);
b.rng++;assert.notDeepEqual(r195Fingerprint(b),sig);
b.rng=a.rng;b.deck.player.reverse();assert.notDeepEqual(r195Fingerprint(b),sig);
console.log('R195_ENGINE_FINGERPRINT_AND_CURRENT_ORIGINAL_IDS_PASS',JSON.stringify({snapshots:tests}));
