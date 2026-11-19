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
const maxTurns=Math.max(5,Math.min(20,Number(process.env.R193_TURNS||12)));
const result={test:'R193 real per-turn 2D texture cache ownership',seed:6,deck:'classroom',maxTurns,
 rounds:[],errors:[],pass:false};
const context=await browser.newContext({viewport:{width:1280,height:720},
 serviceWorkers:'block'});
const page=await context.newPage();
page.on('pageerror',e=>result.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)result.errors.push('HTTP '+r.status()+' '+r.url())});
const dir='/home/master/projects/after-school-duel-r190-demand/r45-duel/qa/evidence/r192-gpu-lifecycle';
try{
 const query=new URLSearchParams({qa:'1',seed:'6',deck:'classroom',
  r189Stream:'on',r190Demand:'on',r188Owl:'barn',r181HairBatch:'on',
  r191TextureAudit:'on',r192TraceGpu:'on',r169SchoolMagic:'on',r180StadiumBatch:'on'});
 await page.goto('http://127.0.0.1:18687/r45-duel/?'+query,{
  waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
   null,{timeout:120000});
 const snap=()=>page.evaluate(()=>{
  const f=document.getElementById('stadium').contentWindow;
  return {round:window.__r45QA.round,hand:window.__r45QA.hand,
   phase:window.__r45QA.phase,board:window.__r45QA.board,
   stream:window.__r45QA.r189Stream,demand:window.__r45QA.r190Demand,
   scene:f.__r45SceneQA.r189StreamReceipt,
   school:f.__r45SceneQA.r169SchoolMagic,
   gpu:f.__r45SceneQA.r191TextureAudit.gpuTextureObjects,
   drawCalls:f.__r45SceneQA.r191TextureAudit.drawCalls,
   morphTextureGap:f.__r45SceneQA.r191TextureAudit.countGap,
   trace:(()=>{const t=f.__r45SceneQA.r192Lifecycle;return {installed:t.installed,
     trackedLive:t.trackedLive,rendererObjects:t.rendererTextureObjects,
     arrayAllocations3D:t.arrayAllocations3D,arrayUploadMiB:t.arrayUploadedFloatPayloadMiB,
     unownedTracked:t.unownedTracked,rendererCountDelta:t.countDelta,
     unowned2D:t.unowned2DDetail,unowned3DCount:t.unowned3DCount,
     unknownTarget:t.unownedUnknownTargetCount,
     sourceStacks:t.unownedStacks.map(x=>({count:x.count,stack:x.stack.slice(0,300)}))};})()};
 });
 result.initial=await snap();
 assert.equal(result.initial.scene.demandOnly,true);
 const initialOriginalIDs=new Set(result.initial.scene.initialRealGLBs);
 assert(!initialOriginalIDs.has('G02'),'Seed6 test requires next-turn noninitial G02');
 for(let turn=0;turn<maxTurns;turn++){
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
   errors:after.stream.backgroundError,gpu:after.gpu,drawCalls:after.drawCalls,
   morphTextureGap:after.morphTextureGap,textureTrace:after.trace,
   stageLabels:after.school.decalTextures,stageActive:after.school.active});
  if(after.phase==='ended')break;
 }
 await page.waitForTimeout(1500);
 result.final=await snap();
 assert(result.final.scene.loadedNow.length<=12,
  'progressive demand exceeded 12 original units');
 assert(result.final.demand.requestsSent>=1,'not a single new genuine GLB requested');
 assert(result.final.scene.demandFailed===0);
 assert(result.final.scene.demandCompleted>=1);
 assert(!result.final.stream.backgroundError);
 assert(!result.errors.length,result.errors.join('\n'));
 result.pass=true;
 await page.locator('#stadium').screenshot({path:dir+'/r193-long-game-2d-cache-'+maxTurns+'.png'});
}finally{
 writeFileSync(dir+'/r193-long-game-2d-cache-'+maxTurns+'.json',JSON.stringify(result,null,2));
 await context.close();await browser.close();
}
console.log('R193_REAL_2D_LIFETIME',JSON.stringify({
 pass:result.pass,turns:result.rounds.length,
 initialCount:result.initial?.scene?.loadedNow?.length,
 finalCount:result.final?.scene?.loadedNow?.length,
 demanded:result.final?.demand?.requestedIDs,
 sourceLoads:result.final?.scene?.demandCompleted,
 firstGpu:result.initial?.gpu,finalGpu:result.final?.gpu,
 finalMorphUnowned:result.final?.morphTextureGap,
 stageCachedLabels:result.final?.school?.decalTextures,
 unowned2D:result.final?.trace?.unowned2D,
 finalActual3DAllocations:result.final?.trace?.arrayAllocations3D,
 errors:result.errors}));
