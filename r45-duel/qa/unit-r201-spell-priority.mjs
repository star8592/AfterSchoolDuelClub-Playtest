import assert from'node:assert/strict';
import{createR201SpellLoadQueue}from'../scene/campus-spell-priority-queue.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}};
const tick=()=>new Promise(ok=>setTimeout(ok,0));
{
 const gates=new Map(),started=[],done=[];
 const load=async id=>{
  started.push(id);
  const gate=deferred();gates.set(id,gate);
  await gate.promise;done.push(id);return 'authored-glb:'+id;
 };
 const q=createR201SpellLoadQueue(load);
 const a=q.request('A'),b=q.request('B'),c=q.request('C');
 await tick();assert.deepEqual(started,['A']);
 const d=q.request('D',{priority:'urgent'});
 const sameC=q.request('C',{priority:'urgent'});
 assert.strictEqual(sameC,c,'queued identical source must dedupe');
 assert.equal(q.stats.promotions,1);
 assert.deepEqual(q.stats.urgentWaiting,['D','C']);
 assert.deepEqual(q.stats.backgroundWaiting,['B']);
 gates.get('A').resolve();assert.equal(await a,'authored-glb:A');await tick();
 assert.deepEqual(started,['A','D']);
 gates.get('D').resolve();assert.equal(await d,'authored-glb:D');await tick();
 assert.deepEqual(started,['A','D','C']);
 gates.get('C').resolve();assert.equal(await c,'authored-glb:C');await tick();
 assert.deepEqual(started,['A','D','C','B']);
 gates.get('B').resolve();assert.equal(await b,'authored-glb:B');
 await tick();assert.deepEqual(done,started);
 assert.equal(q.stats.completed,4);assert.equal(q.stats.outstanding,0);
 q.stop();assert.equal(q.stats.stopped,true);
}
{
 const q=createR201SpellLoadQueue(async id=>{
  if(id==='broken')throw Error('Real original source missing');
  return {id,mesh:'unmodified-original'};
 });
 const reject=q.request('broken',{priority:'urgent'}).then(()=>false,()=>true);
 const valid=q.request('real',{priority:'urgent'});
 assert.equal(await reject,true,'no fallback to fake 3D source');
 assert.deepEqual(await valid,{id:'real',mesh:'unmodified-original'});
 assert.equal(q.stats.failed,1);
 assert.equal(q.stats.completed,1);
}
{
 const slow=deferred(),q=createR201SpellLoadQueue(id=>
  id==='slow'?slow.promise:Promise.resolve('should not run'));
 const head=q.request('slow',{priority:'urgent'});await tick();
 const pending=q.request('never').then(()=>false,()=>true);
 q.stop();assert.equal(await pending,true);
 slow.resolve('real');
 assert.equal(await head,'real');await tick();
 assert.equal(q.stats.completed,1);assert.equal(q.stats.outstanding,0);
}
console.log('R201_PRIORITY_QUEUE_UNIT_PASS',JSON.stringify({
 urgency:'true cards precede background hand prefetch',promotions:1,
 originalSourceOnly:true,failClosed:true,disposeCancelsQueued:true}));
