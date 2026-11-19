/** R195 real Chrome: actual loss of the rendered iframe context mid-match. */
import assert from 'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync,readFileSync}from'node:fs';
import{makeHalfMorphVendorOverlay}from'./r193-half-morph-overlay.mjs';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const deck=process.env.R195_DECK||'classroom',seed=+(process.env.R195_SEED||6);
const view=process.env.R195_VIEW||'desktop',rounds=+(process.env.R195_ROUNDS||2);
const qaHalf=process.env.R195_HALF==='on';
const losses=Math.max(1,Math.min(3,Number(process.env.R195_LOSSES||1)));
const name=deck+'-seed'+seed+'-'+view+'-rounds'+rounds+(qaHalf?'-actual16to32':'-original32')+(losses>1?'-loss'+losses:'');
const dir='r45-duel/qa/evidence/r195-state-recovery';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:view==='mobile'?{width:430,height:900}:{width:1280,height:720},
 serviceWorkers:'block'});
const page=await ctx.newPage(),errors=[],result={deck,seed,view,rounds,name,errors,pass:false};
let halfIntercepted=0,recoveryVendorPass=0;
if(qaHalf){
 const original=readFileSync('r45-duel/assets/three/build/three.module.js','utf8');
 const patched=makeHalfMorphVendorOverlay(original,{native:true});
 await page.route('**/assets/three/build/three.module.js',async route=>{
  // Important: only the FIRST GPU context is the experimental 16F vendor;
  // the freshly loaded post-loss iframe has the ORIGINAL 32F module.
  if(route.request().frame().url().includes('r195Recover=1')){
   recoveryVendorPass++;return route.continue();
  }
  halfIntercepted++;
  return route.fulfill({status:200,contentType:'application/javascript',
   body:patched,headers:{'cache-control':'no-store'}});
 });
}

page.on('pageerror',e=>errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const q=window.__r45QA;
 const f=document.querySelector('#stadium').contentWindow;
 return {recovery:q.r195Recovery,required:q.r195RequiredGLBs,
   round:q.round,phase:q.phase,hand:q.hand,hp:q.hp,energy:q.energy,board:q.board,
   events:q.events,deck:q.deckPreset,stream:q.r189Stream,
   sources:f?.__r45SceneQA?.r189StreamReceipt?.loadedNow??[],
   sceneBoard:f?.__r45SceneQA?.r189StreamReceipt?.demandOnly??null,
   gpu:f?.__r45SceneQA?.r191TextureAudit?.gpuTextureObjects??null,
   gpu3DShapes:f?.__r45SceneQA?.r192Lifecycle?.arrayAllocationShapes??[],
   uploadedMiB:f?.__r45SceneQA?.r192Lifecycle?.arrayUploadedFloatPayloadMiB??null};
});
try{
 const qp=new URLSearchParams({qa:'1',seed:String(seed),deck,
  r189Stream:'on',r190Demand:'on',r195SceneRecovery:'on',r191TextureAudit:'on',r192TraceGpu:'on',
  r181HairBatch:'on',r188Owl:'barn',r169SchoolMagic:'on',r180StadiumBatch:'on'});
 await page.goto('http://127.0.0.1:18687/r45-duel/?'+qp,{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
 result.initial=await snap();
 for(let i=0;i<rounds;i++){
  await page.waitForFunction(()=>document.querySelector('#end').disabled===false||window.__r45QA.phase==='ended',null,{timeout:50000});
  if((await snap()).phase==='ended')break;
  await page.locator('#end').click();
  await page.waitForFunction(round=>window.__r45QA.round>round||window.__r45QA.phase==='ended',result.initial.round+i,{timeout:20000});
 }
 result.before=await snap();
 assert(result.before.round>1,'must be a progressed match to verify recovery');
 assert(result.before.recovery.state==='idle');
 if(qaHalf){
  assert(halfIntercepted>0,'initial morph vendor was not truly experimental16F');
  assert(result.before.gpu3DShapes.some(x=>x.shape.endsWith('34842')),
   'initial GPU was not genuinely RGBA16F');
 }else assert(result.before.gpu3DShapes.some(x=>x.shape.endsWith('34836')));

 assert(result.before.required.every(id=>result.before.sources.includes(id)),'before scene missing needed originals');
 const did=await page.evaluate(()=>window.__r45QA.r195SimulateLoss());
 assert.equal(did,true,'real WebGL lose context not available');
 await page.waitForFunction(()=>window.__r45QA?.r195Recovery.state==='restored'&&
   window.__r45QA.sceneReady===true,null,{timeout:130000});
 result.after=await snap();
 assert.equal(result.after.recovery.attempts,1);
 assert.equal(result.after.recovery.losses,1);
 assert.deepEqual(result.after.recovery.before,result.after.recovery.after);
 assert.deepEqual(result.after.recovery.current,result.before.recovery.current);
 for(const key of ['round','phase','hand','hp','energy','board','events','deck'])
  assert.deepEqual(result.after[key],result.before[key],key+' changed after real GPU loss');
 assert(result.after.required.every(id=>result.after.sources.includes(id)),'rehydrated scene missing current source GLBs');
 assert(result.after.gpu3DShapes.some(x=>x.shape.endsWith('34836')),
  'post-context-loss renderer has not truly restored RGBA32F');
 assert(!result.after.gpu3DShapes.some(x=>x.shape.endsWith('34842')),
  'post-context-loss renderer wrongly retained 16F');
 if(qaHalf)assert(recoveryVendorPass>0,'original vendor was not fetched for recovery');

 const rel=await page.locator('#stadium').getAttribute('src');
 result.sceneSrc=rel;
 assert(rel.includes('r195Force32f=on')&&rel.includes('r195Recover=1'),'iframe was not rebuilt to safe 32F');
 await page.locator('#stadium').screenshot({path:dir+'/'+name+'-after.png'});
 if(result.after.phase==='playing'){
  await page.waitForFunction(()=>document.querySelector('#end').disabled===false,null,{timeout:50000});
  const old=result.after.round;
  await page.locator('#end').click();
  await page.waitForFunction(n=>window.__r45QA.round>n||window.__r45QA.phase==='ended',old,{timeout:18000});
  result.resumed=await snap();
  assert(result.resumed.round>old||result.resumed.phase==='ended',
    'Cannot play another real turn after recovery');
 }
 if(losses>=2){
  result.secondBefore=await snap();
  assert(await page.evaluate(()=>window.__r45QA.r195SimulateLoss()));
  await page.waitForFunction(()=>window.__r45QA?.r195Recovery.attempts===2&&
    window.__r45QA.r195Recovery.state==='restored'&&window.__r45QA.sceneReady,
    null,{timeout:130000});
  result.secondAfter=await snap();
  for(const key of ['round','phase','hand','hp','energy','board','events','deck'])
   assert.deepEqual(result.secondAfter[key],result.secondBefore[key],
    key+' changed during second actual GPU context loss');
  assert.deepEqual(result.secondAfter.recovery.current,
   result.secondBefore.recovery.current,'rules mutated on second recovery');
  assert(result.secondAfter.required.every(id=>result.secondAfter.sources.includes(id)));
  assert(result.secondAfter.gpu3DShapes.some(x=>x.shape.endsWith('34836')));
  await page.locator('#stadium').screenshot({path:dir+'/'+name+'-second.png'});
 }
 if(losses>=3){
  result.thirdBefore=await snap();
  assert(await page.evaluate(()=>window.__r45QA.r195SimulateLoss()));
  await page.waitForFunction(()=>window.__r45QA?.r195Recovery.state==='failed'&&
    window.__r45QA.sceneReady===false,null,{timeout:20000});
  result.thirdAfter=await snap();
  assert.equal(result.thirdAfter.recovery.attempts,2,
   'repeated GPU failures must never enter an infinite iframe reload loop');
  assert.deepEqual(result.thirdAfter.recovery.current,
   result.thirdBefore.recovery.current,'fail-closed must not touch rules state');
  assert.equal(result.thirdAfter.recovery.state,'failed');
  assert.equal(result.thirdAfter.recovery.sceneError,true);
 }
 assert.deepEqual(errors,[]);
 result.halfIntercepted=halfIntercepted;result.recoveryVendorPass=recoveryVendorPass;
 result.pass=true;
 console.log('R195_LIVE_MID_MATCH_IFRAME_RECOVERY_PASS',JSON.stringify({
  name,pass:result.pass,roundBefore:result.before.round,
  roundAfter:result.after.round,
  required:result.after.required,rebuiltOriginals:result.after.sources,
  originalFingerprint:result.before.recovery.current,
  restoredFingerprint:result.after.recovery.current,
  resumedRound:result.resumed?.round??null,
  beforeUpload:result.before.uploadedMiB,afterUpload:result.after.uploadedMiB,
  halfIntercepted,recoveryVendorPass,losses,secondRecovered:result.secondAfter?.recovery.state,
  thirdFailClosed:result.thirdAfter?.recovery.state,errors}));
}finally{
 writeFileSync(dir+'/'+name+'.json',JSON.stringify(result,null,2));
 await ctx.close();await browser.close();
}
