import assert from 'node:assert/strict';
import {choreographVictory,VICTORY_DURATION,VICTORY_STAGES} from '../scene/victory-choreography.mjs';
assert.equal(VICTORY_STAGES.length,5);
assert.equal(VICTORY_DURATION,6.4);
const ids=['M02','E03','E04','G02','T01','G03','G04','T02','E01','G01'];
const encountered=new Set(),moves=new Set();
for(let t=0;t<=VICTORY_DURATION+.001;t+=.02){
 for(const id of ids){
  const a=choreographVictory({elapsed:t,winner:'player',side:'player',id,index:2});
  const b=choreographVictory({elapsed:t,winner:'player',side:'ai',id,index:2});
  const quiet=choreographVictory({elapsed:t,winner:'player',side:'player',id,index:2,reduced:true});
  assert.ok(a.weight>=0&&a.weight<=1);
  assert.ok(Math.abs(a.yaw)<=.15+.00001,'never turn away from opponent');
  assert.ok(Math.abs(a.x)<=.2,'no collisions or wandering');
  assert.equal(quiet.weight,0,'reduce motion');
  assert.equal(b.winner,false);
  if(t<VICTORY_DURATION){encountered.add(a.stage);moves.add(a.mode);}
 }
}
assert.equal(encountered.size,5,'complete five stage choreography');
assert.ok(moves.size>=8,'character-specific performance');
const chef=choreographVictory({elapsed:5.8,winner:'player',side:'player',id:'M02'});
const captain=choreographVictory({elapsed:5.8,winner:'player',side:'player',id:'E03'});
assert.notEqual(chef.right,captain.right,'ladle salute unique');
const draw=choreographVictory({elapsed:3.1,winner:'draw',side:'player',id:'M02'});
assert.equal(draw.mode,'draw');
console.log('R113_CHOREO_PASS',JSON.stringify({stages:[...encountered],distinctPerformanceModes:moves.size}));
