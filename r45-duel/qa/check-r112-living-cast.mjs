import assert from 'node:assert/strict';
import {createLivingCastDirector,BEATS} from '../scene/living-cast-director.mjs';
const a=createLivingCastDirector(12345),b=createLivingCastDirector(12345);
assert.ok(Object.keys(BEATS).length>=15,'diverse beats');
for(let t=0;t<80;t+=.1){
 const aa=a.update(t),bb=b.update(t);
 assert.deepEqual(aa,bb,'same-seed reproducibility');
 for(const v of Object.values(aa))
  assert.ok(v.weight>=0&&v.weight<=1,'bounded envelope');
}
const before=a.inspect().events;
assert.ok(before.some(x=>x.reason==='ambient'),'spontaneous movement');
assert.ok(before.some(x=>x.reason.startsWith('paired_')),'interpersonal reactions');
assert.ok(new Set(before.map(x=>x.type)).size>=6,'diverse nonlooping beats');
a.signal('player','card',81);
a.update(81);
assert.equal(a.inspect().current.player.active,'cheer');
a.update(81.85);
assert.ok(a.inspect().events.some(e=>e.reason==='response_to_card'));
assert.ok(a.celebrate('player',82));
const joy=a.update(84);
assert.equal(joy.player.type,'dance');
assert.equal(joy.ai.type,'defeat');
assert.ok(joy.player.weight>0);
assert.equal(a.celebrate('ai',85),false,'one conclusion only');
a.update(89.5);
assert.equal(a.inspect().celebration,null);
console.log('R112_LIVING_CAST',JSON.stringify({passed:true,beats:Object.keys(BEATS).length,
 ambient:before.length,unique:new Set(before.map(x=>x.type)).size,
 interactions:before.filter(x=>x.reason.startsWith('paired_')).length}));
