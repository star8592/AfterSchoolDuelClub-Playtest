import assert from 'node:assert/strict';
import{crowdReactionMotion}from'../scene/stadium-crowd-motion.mjs';
let cheer=0,sympathy=0;
for(let t=0;t<6.5;t+=.03){
 const a=crowdReactionMotion({type:'finale',winner:'player',team:'player',elapsed:t});
 const b=crowdReactionMotion({type:'finale',winner:'player',team:'ai',elapsed:t});
 const quiet=crowdReactionMotion({type:'finale',winner:'player',team:'player',elapsed:t,reduced:true});
 assert.ok(Math.abs(a.tilt)<.08&&Math.abs(a.yaw)<.12,'gentle real human motion');
 assert.equal(quiet.bounce,0);assert.equal(quiet.arms,0);
 assert.ok(a.bounce>=0&&a.bounce<.04);
 if(a.weight>.1&&a.mode==='cheer')cheer++;
 if(b.weight>.1&&b.mode==='sympathy')sympathy++;
}
assert.ok(cheer>20&&sympathy>20);
console.log('R114_CROWD_UNIT_PASS',JSON.stringify({cheer,sympathy}));
