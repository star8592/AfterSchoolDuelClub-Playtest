/** R190 actual multi-round card/AI game for deferred genuine GLBs. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const result={test:'R190 real progressive cards and AI',seed:6,deck:'classroom',
 rounds:[],errors:[],pass:false};
const context=await browser.newContext({viewport:{width:1280,height:720},
 serviceWorkers:'block'});
const page=await context.newPage();
page.on('pageerror',e=>result.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)result.errors.push('HTTP '+r.status()+' '+r.url())});
const dir='/home/master/projects/after-school-duel-r190-demand/r45-duel/qa/evidence/r190-demand';
try{
 const query=new URLSearchParams({qa:'1',seed:'6',deck:'classroom',
  r189Stream:'on',r190Demand:'on',r188Owl:'barn'});
 await page.goto('http://127.0.0.1:18687/r45-duel/?'+query,{
  waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
   null,{timeout:120000});
 const snap=()=>page.evaluate(()=>{
  const f=document.getElementById('stadium').contentWindow;
  return {round:window.__r45QA.round,hand:window.__r45QA.hand,
   phase:window.__r45QA.phase,board:window.__r45QA.board,
   stream:window.__r45QA.r189Stream,demand:window.__r45QA.r190Demand,
   scene:f.__r45SceneQA.r189StreamReceipt};
 });
 result.initial=await snap();
 assert.equal(result.initial.scene.demandOnly,true);
 const initialOriginalIDs=new Set(result.initial.scene.initialRealGLBs);
 assert(!initialOriginalIDs.has('G02'),'Seed6 test requires next-turn noninitial G02');
 for(let turn=0;turn<5;turn++){
  await page.waitForFunction(()=>document.getElementById('end').disabled===false||
    window.__r45QA.phase==='ended',null,{timeout:40000});
  const before=await snap();
  if(before.phase==='ended')break;
  const beforeSerial=await page.evaluate(()=>
   Math.max(0,...window.__r45QA.events.map(x=>x.serial)));
  const readyBefore=new Set(before.stream.readyIds);
  await page.locator('#end').click();
  await page.waitForFunction(old=>window.__r45QA.events.some(e=>
    e.serial>old&&e.type==='turn_start'&&e.side==='ai')||
    window.__r45QA.phase==='ended',beforeSerial,{timeout:15000});
  const events=await page.evaluate(old=>window.__r45QA.events.filter(e=>
   e.serial>old&&e.type==='card_play'&&e.side==='ai'),beforeSerial);
  const actualAICards=events.map(e=>e.card);
  const sourceIds=actualAICards.filter(id=>/^(E0[2-4]|G0[2-4]|M0[1-2]|T0[1-4])$/.test(id));
  assert(sourceIds.every(id=>readyBefore.has(id)),
   'AI actually played a unit with no genuine original source GLB');
  await page.waitForTimeout(500);
  const after=await snap();
  const actualBoardIds=[...after.board.player[0],...after.board.ai[0]]
    .map(x=>x.id).filter(id=>/^(E0[2-4]|G0[2-4]|M0[1-2]|T0[1-4])$/.test(id));
  assert(actualBoardIds.every(id=>after.scene.loadedNow.includes(id)),
   'actual live board has missing source GLB');
  result.rounds.push({turn:turn+1,round:after.round,
   actualAICards,loadedGlbs:after.scene.loadedNow,
   requestedIDs:after.demand.requestedIDs,
   requestedCount:after.demand.requestsSent,
   canEndSafely:after.stream.canSafelyEndTurn,
   errors:after.stream.backgroundError});
  if(after.phase==='ended')break;
 }
 await page.waitForTimeout(1500);
 result.final=await snap();
 assert(result.final.scene.loadedNow.length<12,
  'progressive demand has fetched every unit needlessly');
 assert(result.final.demand.requestsSent>=1,'not a single new genuine GLB requested');
 assert(result.final.scene.demandFailed===0);
 assert(result.final.scene.demandCompleted>=1);
 assert(!result.final.stream.backgroundError);
 assert(!result.errors.length,result.errors.join('\n'));
 result.pass=true;
 await page.locator('#stadium').screenshot({path:dir+'/r190-real-progressive-turns-classroom-6.png'});
}finally{
 writeFileSync(dir+'/r190-real-progressive-turns-classroom-6.json',JSON.stringify(result,null,2));
 await context.close();await browser.close();
}
console.log('R190_REAL_FUTURE_CARDS_AND_AI_PASS',JSON.stringify({
 pass:result.pass,turns:result.rounds.length,
 initialCount:result.initial?.scene?.loadedNow?.length,
 finalCount:result.final?.scene?.loadedNow?.length,
 demanded:result.final?.demand?.requestedIDs,
 sourceLoads:result.final?.scene?.demandCompleted,
 errors:result.errors}));
