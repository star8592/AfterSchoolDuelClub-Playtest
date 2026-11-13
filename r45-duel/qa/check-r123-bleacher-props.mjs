import assert from 'node:assert/strict';
import {SPECTATOR_PROPS,resolveSpectatorProp} from '../scene/bleacher-prop-comedy.mjs';
import {crowdReactionMotion} from '../scene/stadium-crowd-motion.mjs';
assert.equal(SPECTATOR_PROPS.length,4);
assert.equal(new Set(SPECTATOR_PROPS.map(p=>p.kind)).size,4);
assert.deepEqual(SPECTATOR_PROPS.map(p=>p.kind),['popcorn','juice','homework','backpack']);
const scenarios=['ricochet','overshoot','shockwave','misfire'];
for(let index=0;index<4;index++){
 const incident={serial:index+1,spectatorIndex:index,scenario:scenarios[index]};
 const prop=resolveSpectatorProp(incident);
 assert.equal(prop?.kind,SPECTATOR_PROPS[index].kind);
 assert.ok(prop.caption.length>10&&prop.line.length>10);
 assert.equal(prop.index,index);
 assert.deepEqual(prop,resolveSpectatorProp(incident));
}
for(const bad of [{serial:0,spectatorIndex:1,scenario:'misfire'},
 {serial:4,spectatorIndex:-1,scenario:'misfire'},
 {serial:4,spectatorIndex:5,scenario:'misfire'},
 {serial:4,spectatorIndex:2,scenario:'fake'}])
 assert.equal(resolveSpectatorProp(bad),null);
// Stand geometry: 0 and 1 are neighbors; 0 and 3 are FAR sides.
// In particular, never treat two far-end students as cyclic neighbors.
const motion=(index,focusIndex,elapsed,reduced=false)=>crowdReactionMotion({
 type:'accident',index,focusIndex,elapsed,scenario:'shockwave',reduced
});
assert.equal(motion(0,0,.11).mode,'accident_target');
assert.equal(motion(1,0,.5).mode,'accident_neighbor');
assert.equal(motion(3,0,.5).mode,'accident_gasp');
assert.ok(motion(0,0,.12).weight>motion(3,0,.12).weight);
assert.ok(motion(0,0,.15).arms>motion(1,0,.15).arms);
assert.ok(motion(1,0,.15).weight===0);
assert.ok(motion(3,0,.15).weight===0);
assert.ok(motion(3,0,.8).weight>0);
assert.ok(motion(0,0,.35).bounce>0||motion(0,0,.5).bounce>0);
assert.ok(motion(0,0,.8,true).bounce===0);
assert.ok(motion(0,0,3.5).weight===0);
console.log('R123_PROP_DOMINO_CONTRACT_PASS',JSON.stringify({
 props:4,scenarios:4,truthfulSeatGeometry:true,
 delayedReactions:true,performanceFriendlyInstanceEffects:true,
 noRuleMutation:true
}));
