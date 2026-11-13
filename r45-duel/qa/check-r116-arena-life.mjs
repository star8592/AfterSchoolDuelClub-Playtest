import assert from 'node:assert/strict';
import {createArenaLifeWorld,LIFE_PROFILES} from '../scene/arena-life-world.mjs';
const make=()=>{
 const w=createArenaLifeWorld(116);
 w.register('host:player',{id:'E01',side:'player',role:'duelist'});
 w.register('host:ai',{id:'G01',side:'ai',role:'duelist'});
 w.register('unit:player:U31',{id:'M02',side:'player',role:'summon'});
 w.register('unit:ai:U32',{id:'G02',side:'ai',role:'summon'});
 w.register('spectator:E04',{id:'E04',side:'player',role:'spectator'});
 w.register('spectator:G04',{id:'G04',side:'ai',role:'spectator'});
 return w;
};
const a=make(),b=make();
assert.equal(Object.keys(LIFE_PROFILES).length,14,'all summoned character identities have a profile');
assert.equal(a.inspect().size,6,'six real characters with independent keys');
assert.equal(a.register('host:player',{id:'G04',side:'ai',role:'spectator'}).side,'player',
 're-register must never mutate identity');
const before=a.inspect();
assert.notEqual(before.actors.find(x=>x.id==='M02').personality,
 before.actors.find(x=>x.id==='G02').personality);
for(const w of [a,b]){
 w.tick(3.4);
 assert.ok(w.observe('card',{side:'player',at:3.5,kind:'unit'}));
 w.tick(3.7);
 assert.ok(w.observe('hit',{side:'ai',at:4.0}));
 w.tick(4.25);
}
const enemy=a.read('host:ai',4.25);
const chef=a.read('unit:player:U31',4.25);
assert.equal(enemy.emotion,'hurt');
assert.notEqual(enemy.emotion,chef.emotion,'different sides interpret the same event differently');
assert.ok(enemy.tension>chef.tension,'victim is more anxious than ally');
assert.ok(['opponent','self','teammates','cards'].includes(chef.attention));
assert.deepEqual(a.inspect(),b.inspect(),'all seeded decisions reproduce exactly');
for(const w of [a,b]){
 w.tick(12);
 w.observe('result',{side:'player',winner:'player',at:12.1});
}
assert.equal(a.read('unit:player:U31',12.2).emotion,'elated');
assert.equal(a.read('spectator:G04',12.2).emotion,'disappointed');
assert.equal(a.inspect().result,'player');
assert.ok(a.setMatch({player:7,ai:18,round:7,turn:'ai'},13),
 'real scoreboard changes match situation');
assert.equal(a.inspect().context.round,7);
assert.equal(a.inspect().actors.find(x=>x.key==='host:player').situation,'behind');
assert.equal(a.inspect().actors.find(x=>x.key==='host:ai').situation,'ahead');
assert.equal(a.setMatch({player:-30,ai:18,round:7,turn:'ai'},14),false,
 'invalid physical scoreboard must not contaminate emotional state');
a.tick(20);
a.observe('card',{side:'ai',kind:'spell',at:20.1});
assert.equal(a.inspect().result,null,'new real round reopens character life');
assert.equal(a.read('host:ai',20.2).emotion,'expectant');
const size=a.inspect().size;
a.remove('unit:player:U31');
assert.equal(a.inspect().size,size-1,'despawn removes emotional state');
assert.equal(a.read('unit:player:U31'),null);
assert.equal(a.observe('hit',{side:'unknown',at:24}),false);
assert.equal(a.register('',{id:'M02'}),null);
for(let i=0;i<80;i++)a.observe('turn',{side:i%2?'player':'ai',at:30+i});
assert.ok(a.inspect().events.length<=24,'debugging event log stays bounded');
console.log('R116_ARENA_LIFE_UNIT_PASS',JSON.stringify({profiles:Object.keys(LIFE_PROFILES).length,
 distinctEmotions:true,reproducible:true,actorIsolation:true,events:a.inspect().events.length}));
