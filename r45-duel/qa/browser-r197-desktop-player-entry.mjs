/** R197 desktop-first public-player entry QA: NO qa=1 flags. */
import assert from 'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const seed=Number(process.env.R197_SEED||173),deck=process.env.R197_DECK||'classic';
const cpu=Number(process.env.R197_CPU||1),width=Number(process.env.R197_WIDTH||1280);
const backend=process.env.R197_GPU||'vulkan';
const host=process.env.R197_HOST||'127.0.0.1';
const name=`public-${deck}-seed${seed}-desktop${width}-cpu${cpu}-${backend}`;
const dir='r45-duel/qa/evidence/r197-desktop-first';mkdirSync(dir,{recursive:true});
const args=['--no-sandbox','--enable-webgl','--disable-software-rasterizer',
 '--disable-dev-shm-usage',...(backend==='gl'?['--use-angle=gl']:
 ['--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan'])];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args});
const ctx=await browser.newContext({viewport:{width,height:720},serviceWorkers:'block'});
const page=await ctx.newPage(),errors=[],result={
 source:'non-QA player page',name,host,backend,seed,deck,cpu,width,
 pass:false,errors,turns:[],checklist:{}};
page.on('pageerror',e=>errors.push('JS: '+e.message));
page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,300))});
if(cpu>1){const cdp=await ctx.newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu})}
const snapshot=()=>page.evaluate(()=>{
 const f=document.getElementById('stadium').contentWindow;
 const m=f?.__ASDC_LOAD_METRICS;
 const hand=[...document.querySelectorAll('#hand .card')];
 return {
  round:document.querySelector('#round')?.textContent,
  playerHp:document.querySelector('#player-hp')?.textContent,
  enemyHp:document.querySelector('#enemy-hp')?.textContent,
  energy:document.querySelector('#energy')?.textContent,
  handCount:hand.length,
  playable:hand.filter(x=>!x.disabled).length,
  arenaCanvas:!!f?.document?.getElementById('battle-canvas'),
  sceneUrl:f?.location?.href,
  modelMetrics:m?JSON.parse(JSON.stringify(m)):null,
  sourceModelsReady:m?.modelsVerified??0,
  firstFrameReadyMs:m?.firstFrameReadyMs,
  cardLibrary:document.querySelector('#card-library-open')?.textContent,
  tutorial:document.querySelector('#guided-launch')?.textContent,
  help:!!document.querySelector('#help'),
  soundOn:document.querySelector('#audio-toggle')?.getAttribute('aria-pressed'),
  renderedReady:!document.querySelector('#end')?.disabled,
  url:location.href,
 };
});
try{
 const target=new URL('http://'+host+':18687/r45-duel/');
 target.searchParams.set('seed',String(seed));
 if(deck!=='classic')target.searchParams.set('deck',deck);
 const begin=Date.now();
 await page.goto(target.href,{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>{
  const frame=document.getElementById('stadium')?.contentWindow;
  return frame?.__ASDC_LOAD_METRICS?.firstFrameReadyMs>0 &&
   document.getElementById('end')?.disabled===false;
 },null,{timeout:120000});
 result.elapsedMs=Date.now()-begin;
 result.initial=await snapshot();
 assert(!result.initial.url.includes('qa=1'));
 assert.equal(result.initial.soundOn,'true','sound must be requested by default');
 assert(result.initial.sourceModelsReady>=14,'original 3D models not verified');
 assert.equal(result.initial.arenaCanvas,true);
 assert.equal(result.initial.help,true);
 assert(result.initial.tutorial?.includes('新手'));
 assert(result.initial.cardLibrary?.includes('60'));
 assert.equal(result.initial.renderedReady,true);
 assert(result.initial.playable>0);
 result.checklist.firstPlayerEntry=true;
 result.checklist.realHighDetailModels=true;
 result.checklist.rulesHelp=true;
 result.checklist.defaultSoundEnabled=true;
 result.checklist.tutorialDiscoverable=true;
 await page.locator('#stadium').screenshot({path:dir+'/'+name+'-entry.png'});
 for(let turn=0;turn<3;turn++){
  const before=await snapshot();
  if(turn===0&&before.playable>0){
   const cards=page.locator('#hand .card:not([disabled])');
   const id=await cards.first().getAttribute('data-card-id');
   await cards.first().click();
   assert.equal(await page.locator('#play').isEnabled(),true);
   await page.locator('#play').click();
   result.firstPlayedCard=id;
  }
  await page.locator('#end').click();
  await page.waitForFunction(old=>{
   const v=Number(document.querySelector('#round').textContent.match(/\d+/)?.[0]||0);
   return v>old||document.querySelector('#result-overlay')?.hidden===false;
  },1+turn,{timeout:25000});
  const after=await snapshot();
  result.turns.push({index:turn+1,beforeRound:before.round,afterRound:after.round,
   playerHp:after.playerHp,enemyHp:after.enemyHp,hand:after.handCount,
   sourceModelsReady:after.sourceModelsReady});
  if(await page.locator('#result-overlay').isVisible())break;
 }
 assert(result.turns.length>=2);
 result.checklist.realCardAndAIInteractions=true;
 // Frame time measurement after interactive warm-up; no artificial test spells.
 result.frameTime=await page.evaluate(()=>new Promise(resolve=>{
  const deltas=[];let last=0,start=performance.now();
  function tick(now){
   if(last)deltas.push(now-last);last=now;
   if(now-start<3700){requestAnimationFrame(tick);return}
   deltas.sort((a,b)=>a-b);
   const at=p=>deltas[Math.min(deltas.length-1,Math.floor(deltas.length*p))];
   resolve({frames:deltas.length,p50Ms:+at(.50).toFixed(1),
    p95Ms:+at(.95).toFixed(1),p99Ms:+at(.99).toFixed(1),
    worstMs:+at(1).toFixed(1)});
  }
  requestAnimationFrame(tick);
 }));
 await page.locator('#stadium').screenshot({path:dir+'/'+name+'-played.png'});
 result.after=await snapshot();
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 result.pass=true;
 console.log('R197_NO_QA_REAL_DESKTOP_PLAYER_PASS',JSON.stringify({
  name,readyMs:result.elapsedMs,verifiedModels:result.initial.sourceModelsReady,
  turns:result.turns.length,firstPlayedCard:result.firstPlayedCard,
  frameTime:result.frameTime,errors}));
}finally{
 writeFileSync(dir+'/'+name+'.json',JSON.stringify(result,null,2)+'\n');
 await ctx.close();await browser.close();
}
