/** R189 real Chrome strict hand identity, visible player summon and
 * deterministic next-AI turn during TRUE deferred GLB load.
 * Not a mocked UI; actual iframe Three.js and production card engine.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const seed=Number(process.env.R189_SEED||173);
const deck=process.env.R189_DECK||'classic';
const out='/home/master/projects/after-school-duel-r189-priority/r45-duel/qa/evidence/r189-startup-stream';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={seed,deck,errors:[],pass:false};
try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>report.errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
 const qp=new URLSearchParams({
  qa:'1',seed:String(seed),deck,r169SchoolMagic:'on',r172BatchStatic:'on',
  r180StadiumBatch:'on',r181HairBatch:'on',r188Owl:'barn',
  r175HeroE06:'on',r178HeroK01:'on',r179HeroK07:'on',
  r186Hero:'P01',r189Stream:'on',r189BgConcurrency:'4',r189BgDelay:'1500'
 });
 await page.goto('http://127.0.0.1:18686/r45-duel/?'+qp.toString(),{
  waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
  null,{timeout:120000});
 report.start=await page.evaluate(async()=>{
  const mod=await import('/r45-duel/engine.mjs');
  const g=mod.createGame(Number(new URLSearchParams(location.search).get('seed')),
    new URLSearchParams(location.search).get('deck')||'classic');
  const ids=[...new Set([...g.hand.player,...g.hand.ai].filter(id=>
   mod.BY_ID[id]?.kind==='unit'&& !['E01','G01'].includes(id)))];
  const f=document.querySelector('#stadium').contentWindow;
  return{
   exactlyStarterIds:ids.sort().join(',')===f.__r45SceneQA.r189StreamReceipt.initialRealGLBs.slice().sort().join(','),
   firstReadyMs:f.__ASDC_LOAD_METRICS.firstFrameReadyMs,
   actualVerified:f.__ASDC_LOAD_METRICS.modelsVerified,
   expectedStarterCount:4+ids.length,
   endDisabled:document.getElementById('end').disabled,
   endShouldBeDisabled:!window.__r45QA.r189Stream.canSafelyEndTurn,
   initialState:window.__r45QA.r189Stream,
   realReadyIds:f.__r45SceneQA.r189StreamReceipt.loadedNow
  };
 });
 assert(report.start.exactlyStarterIds,'wrong actual initial-hand GLB ids');
 assert(report.start.initialState.enabled,'not staged');
 assert(!report.start.initialState.allReady,'already finished background before early UI check');
 assert.equal(report.start.endDisabled,report.start.endShouldBeDisabled,
  'end turn button did not follow exactly predicted AI source readiness');
 assert.equal(report.start.actualVerified,report.start.expectedStarterCount);
 assert.equal(report.start.initialState.restrictedCardCount,0);
 // A real initially-available and affordable 3D card may be played safely.
 const card=page.locator('button.card[data-card-id="E01"]:not([disabled])').first();
 if(await card.count()){
  await card.click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>window.__r45QA.board.player[0].some(u=>u.id==='E01'),null,{timeout:9000});
  report.playedE01=await page.evaluate(()=>({
   actualRuleBoard:window.__r45QA.board,
   sceneUnitIds:document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.entries.map(x=>x.id),
   engineEvents:window.__r45QA.events.filter(x=>x.type==='card_play').map(x=>x.card)
  }));
  assert(report.playedE01.actualRuleBoard.player[0].some(x=>x.id==='E01'));
 }
 report.earlyTurn=await page.evaluate(()=>({
  disabled:document.getElementById('end').disabled,
  possible:window.__r45QA.r189Stream.canSafelyEndTurn,
  prediction:window.__r45QA.r189Stream.nextAiMissing,
  backgroundFull:window.__r45QA.r189Stream.allReady
 }));
 assert.equal(report.earlyTurn.disabled,!report.earlyTurn.possible);
 if(report.earlyTurn.possible&&!report.earlyTurn.backgroundFull){
  // True user-triggered end turn: must run the actual AI turn and NEVER
  // summon a 3D actor not already verified BEFORE the button was pressed.
  const pre=await page.evaluate(()=>({
   ids:window.__r45QA.r189Stream.readyIds,
   serial:Math.max(...window.__r45QA.events.map(e=>e.serial),0)
  }));
  await page.locator('#end').click();
  await page.waitForFunction(()=>window.__r45QA.events.some(e=>
   e.type==='turn_start'&&e.side==='ai'),null,{timeout:9000});
  report.actualEarlyTurn=await page.evaluate(old=>({
   aiCards:window.__r45QA.events.filter(e=>
    e.serial>old&&e.side==='ai'&&e.type==='card_play'),
   playerHand:window.__r45QA.hand,
   round:window.__r45QA.round
  }),pre.serial);
  const unitCards=report.actualEarlyTurn.aiCards.filter(e=>
   e.card?.match(/^(E0[1-4]|G0[1-4]|T0[1-4]|M0[1-2])$/));
  assert(unitCards.every(e=>['E01','G01',...pre.ids].includes(e.card)),
   'AI created real unit without original verified GLB');
 }
 await page.waitForFunction(()=>window.__r45QA?.r189Stream?.allReady===true,
   null,{timeout:120000});
 report.complete=await page.evaluate(()=>{
  const p=window.__r45QA.r189Stream;
  const f=document.querySelector('#stadium').contentWindow;
  return{modelsVerified:f.__ASDC_LOAD_METRICS.modelsVerified,
   glbs:f.__r45SceneQA.r189StreamReceipt.loadedNow,
   backgroundMs:p.backgroundMs,
   canEnd:p.canSafelyEndTurn,
   endDisabled:document.getElementById('end').disabled,
   deckSwitchDisabled:document.getElementById('deck-select').disabled};
 });
 assert.equal(report.complete.modelsVerified,16);
 assert.equal(report.complete.glbs.length,12);
 assert(report.complete.canEnd && !report.complete.endDisabled);
 assert.equal(report.complete.deckSwitchDisabled,false);
 report.pass=report.errors.length===0;
 await page.locator('#stadium').screenshot({path:out+'/r189-safe-early-game-'+deck+'-'+seed+'.png'});
 await page.close();await ctx.close();
}finally{
 writeFileSync(out+'/r189-safe-early-game-'+deck+'-'+seed+'.json',
   JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R189_REAL_BROWSER_HAND_AND_TURN_SAFETY',JSON.stringify(report));
if(!report.pass)process.exitCode=2;
