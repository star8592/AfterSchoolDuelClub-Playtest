import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
const page=await ctx.newPage();
const report={case:'R190 deck-switch and unflagged original source QA',pass:false,errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
const out='/home/master/projects/after-school-duel-r190-demand/r45-duel/qa/evidence/r190-demand/';
try{
 const qs=new URLSearchParams({qa:'1',seed:'173',deck:'classic',r189Stream:'on',
  r190Demand:'on',r188Owl:'barn'});
 await page.goto('http://127.0.0.1:18687/r45-duel/?'+qs,{
  waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
  null,{timeout:100000});
 const before=await page.evaluate(()=>({
  deck:window.__r45QA.deckPreset,source:document.getElementById('stadium').
   contentWindow.__r45SceneQA.r189StreamReceipt
 }));
 assert(before.source.demandOnly);
 assert(before.deck==='classic');
 const selector=page.locator('#deck-select');
 assert(await selector.isEnabled(),'R190 player should be allowed to switch deck with safe page reload');
 await Promise.all([
  page.waitForURL(/deck=kitchen/,{timeout:100000}),
  selector.selectOption('kitchen')
 ]);
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
  null,{timeout:100000});
 report.next=await page.evaluate(async()=>{
  const f=document.getElementById('stadium').contentWindow;
  const eng=await import('/r45-duel/engine.mjs');
  const g=eng.createGame(173,'kitchen');
  const expected=[...new Set([...g.hand.player,...g.hand.ai].filter(id=>
   eng.BY_ID[id]?.kind==='unit'&&!['E01','G01'].includes(id)))];
  const receipt=f.__r45SceneQA.r189StreamReceipt;
  return{deck:window.__r45QA.deckPreset,actualModelIDs:receipt.initialRealGLBs,
   expectedModelIDs:expected,sourceModelCount:receipt.loadedNow.length,
   authenticSameSeed:receipt.seed===173,
   demandOnly:receipt.demandOnly,
   sceneReady:window.__r45QA.sceneReady,
   modelIdentityCorrect:expected.length===receipt.initialRealGLBs.length&&
    expected.every(id=>receipt.initialRealGLBs.includes(id))};
 });
 assert(report.next.deck==='kitchen'&&report.next.modelIdentityCorrect);
 assert(report.next.authenticSameSeed&&report.next.demandOnly);
 await page.locator('#stadium').screenshot({path:out+'r190-safe-deck-switch-actual-game.png'});
 // A completely unflagged R190 path must preserve the 16/16 original load contract.
 await page.goto('http://127.0.0.1:18687/r45-duel/?qa=1&seed=173',{
  waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
  null,{timeout:100000});
 report.default=await page.evaluate(()=>{
  const f=document.getElementById('stadium').contentWindow;
  return{sceneReady:window.__r45QA.sceneReady,
   r190:window.__r45QA.r190Demand.enabled,
   glbs:f.__r45SceneQA.r189StreamReceipt.loadedNow.length,
   all16:f.__ASDC_LOAD_METRICS.modelsVerified};
 });
 assert(report.default.sceneReady&&!report.default.r190);
 assert(report.default.glbs===12&&report.default.all16===16);
 assert(!report.errors.length);
 report.pass=true;
}finally{
 writeFileSync(out+'r190-real-deck-switch-and-default-regression.json',
  JSON.stringify(report,null,2));
 await ctx.close();await browser.close();
}
console.log('R190_REAL_DECK_SWITCH_UNFLAGGED_DEFAULT_PASS',JSON.stringify(report));
