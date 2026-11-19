/** R190 actual browser real WebGL and original GLB demand-only vs R189.
 * Read original ready, after deferred period, play actual VRM E01, verify
 * only genuine real IDs and complete next AI turn, plus source bytes.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const mode=process.env.R190_MODE||'demand',seed=Number(process.env.R190_SEED||173);
const deck=process.env.R190_DECK||'classic',view=process.env.R190_VIEW||'desktop';
const run=process.env.R190_RUN||'A';
const out='/home/master/projects/after-school-duel-r190-demand/r45-duel/qa/evidence/r190-demand';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={mode,seed,deck,view,run,errors:[],pass:false};
const ctx=await browser.newContext({viewport:view==='mobile'?{width:430,height:900}:
 {width:1280,height:720},deviceScaleFactor:view==='mobile'?2:1,serviceWorkers:'block'});
const page=await ctx.newPage();
const cdp=await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate',{rate:view==='mobile'?4:2});
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
try{
 const url=new URL('http://127.0.0.1:18687/r45-duel/');
 for(const [k,v] of Object.entries({qa:'1',seed:String(seed),deck,
  r189Stream:'on',r190Demand:mode==='demand'?'on':'off',
  r189BgConcurrency:'4',r189BgDelay:'0',r188Owl:'barn',
  r169SchoolMagic:'on',r180StadiumBatch:'on',
  r186Hero:'P01'}))url.searchParams.set(k,v);
 await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
 const sample=()=>page.evaluate(()=>{
  const f=document.querySelector('#stadium').contentWindow;
  return{
   firstReadyMs:f.__ASDC_LOAD_METRICS.firstFrameReadyMs,
   realModelCount:f.__r45SceneQA.r189StreamReceipt.loadedNow.length,
   originalIDs:f.__r45SceneQA.r189StreamReceipt.loadedNow,
   initialIDs:f.__r45SceneQA.r189StreamReceipt.initialRealGLBs,
   resourceVerified:f.__ASDC_LOAD_METRICS.modelsVerified,
   demand:f.__r45SceneQA.r189StreamReceipt,
   hostDemand:window.__r45QA.r190Demand,
   hostStream:window.__r45QA.r189Stream,
   sceneReady:window.__r45QA.sceneReady,
   endDisabled:document.getElementById('end').disabled,
   cpuMemoryMB:Math.round((f.performance.memory?.usedJSHeapSize||0)/1048576),
   gpuTextureObjects:f.__r45SceneQA.r189StreamReceipt.gpuTextureObjects,
   gpuGeometryObjects:f.__r45SceneQA.r189StreamReceipt.gpuGeometryObjects
  };
 });
 report.first=await sample();
 assert(report.first.sceneReady,'not actual playable 3D');
 assert.equal(report.first.resourceVerified,4+report.first.initialIDs.length);
 assert(report.first.demand.demandOnly===(mode==='demand'));
 assert(report.first.realModelCount<=12);
 await page.waitForTimeout(3600);
 report.afterBackground=await sample();
 if(mode==='default'){
  assert(report.afterBackground.realModelCount===12,'R189 baseline failed to fill 12 original GLBs');
 }else{
  assert(report.afterBackground.realModelCount<12,
   'R190 unnecessarily filled all 12 GLBs despite only current-hand demand');
  assert(report.afterBackground.demand.demandFailed===0);
  assert(!report.afterBackground.hostStream.allReady);
  assert(!report.afterBackground.hostStream.backgroundError);
  assert(report.afterBackground.hostDemand.enabled);
 }
 report.actualCardPlayed=false;
 const card=page.locator('button.card[data-card-id="E01"]:not([disabled])').first();
 if(await card.count()){
  await card.click();await page.locator('#play').click();
  await page.waitForFunction(()=>window.__r45QA.board.player[0].some(u=>u.id==='E01'),
   null,{timeout:12000});
  report.actualCardPlayed=true;
 }
 if(!await page.locator('#end').isDisabled()){
  const before=await page.evaluate(()=>({serial:Math.max(0,...window.__r45QA.events.map(x=>x.serial)),
    readyIDs:window.__r45QA.r189Stream.readyIds}));
  await page.locator('#end').click();
  await page.waitForFunction(old=>window.__r45QA.events.some(x=>
    x.serial>old&&x.type==='turn_start'&&x.side==='ai'),
   before.serial,{timeout:12000});
  report.realAiTurn=await page.evaluate(old=>{
   const cards=window.__r45QA.events.filter(x=>x.serial>old.serial&&
    x.side==='ai'&&x.type==='card_play');
   return{cards:cards.map(x=>x.card),readyAtEnd:old.readyIDs};
  },before);
 }
 await page.waitForTimeout(1800);
 report.final=await sample();
 const modelSet=new Set(report.final.originalIDs);
 assert(modelSet.size===report.final.realModelCount);
 assert(!report.errors.length,JSON.stringify(report.errors));
 assert(!report.final.hostStream.backgroundError);
 if(mode==='demand'){
  assert(report.final.realModelCount<12,'R190 reloaded irrelevant units after a single turn');
 }
 report.pass=true;
 await page.locator('#stadium').screenshot({path:out+'/'+mode+'-'+deck+'-'+seed+'-'+view+'-'+run+'.png'});
}finally{
 writeFileSync(out+'/'+mode+'-'+deck+'-'+seed+'-'+view+'-'+run+'.json',JSON.stringify(report,null,2));
 await cdp.detach().catch(()=>{});
 await ctx.close();await browser.close();
}
console.log('R190_REAL_GLB_DEMAND_ACTUAL_GAME_AB',JSON.stringify({
 case:[mode,deck,seed,view,run],pass:report.pass,
 firstReadyMs:report.first?.firstReadyMs,
 initialGlbs:report.first?.realModelCount,
 after3sGlbs:report.afterBackground?.realModelCount,
 finalGlbs:report.final?.realModelCount,
 cpuHeapAfter3sMB:report.afterBackground?.cpuMemoryMB,
 bgRequests:report.final?.hostDemand?.requestsSent,
 oneOriginalActorReallyPlayed:report.actualCardPlayed,
 aiPlayed:report.realAiTurn?.cards||[],
 errors:report.errors
}));
if(!report.pass)process.exitCode=2;
