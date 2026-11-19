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
const desiredYaw=Number(process.env.R196_YAW??90);
assert([-90,90].includes(desiredYaw),'QA requires exactly -90 or +90 yaw');
const name='r196-'+deck+'-seed'+seed+'-'+view+'-rounds'+rounds+(qaHalf?'-actual16to32':'-original32')+(losses>1?'-loss'+losses:'')+(desiredYaw<0?'-yaw-left':'')+(process.env.R196_REPEAT?'-repeat'+String(process.env.R196_REPEAT).replace(/[^0-9]/g,''):'');
const dir='r45-duel/qa/evidence/r196-view-audio-recovery';mkdirSync(dir,{recursive:true});
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
const expectedFailClosedConsole=[];
page.on('console',m=>{
 if(m.type()!=='error')return;
 if(m.text().startsWith('R195_QA_RECOVERY_FAILED Repeated GPU context loss')){
  expectedFailClosedConsole.push(m.text());return;
 }
 errors.push('CONSOLE '+m.text().slice(0,500));
});
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
   uploadedMiB:f?.__r45SceneQA?.r192Lifecycle?.arrayUploadedFloatPayloadMiB??null,
   visual:q.r196View,sceneVisual:f?.__r45SceneQA?.r196RecoveryView??null,
   audio:{musicKind:q.audio.musicKind,musicHistory:q.audio.musicHistory,
    musicStarts:q.audio.counters.musicStart,requested:q.audio.requested,
    voicePlaying:q.audio.voicePlaying,voiceQueue:q.audio.voiceQueue},
   };
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
 // Move camera through REAL user controls, no test-only direct state writes.
 await page.locator(desiredYaw<0?'#camera-left':'#camera-right').click();
 await page.locator(desiredYaw<0?'#camera-left':'#camera-right').click();
 await page.waitForFunction(yaw=>Math.abs(window.__r45QA.r196View.cameraDegrees-yaw)<0.01,
   desiredYaw,{timeout:12000});
 await page.waitForTimeout(550);
 result.before=await snap();
 assert.equal(result.before.visual.cameraDegrees,desiredYaw,
  'camera must be genuinely rotated before loss');
 assert(Math.abs(result.before.sceneVisual.currentCameraYaw-desiredYaw)<2,
  'camera did not finish rotation before GPU context loss');
 await page.locator('#stadium').screenshot({path:dir+'/'+name+'-before.png'});
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
 try{
  await page.waitForFunction(()=>window.__r45QA?.r195Recovery.state==='restored'&&
   window.__r45QA.sceneReady===true,null,{timeout:60000});
 }catch(error){
  result.failureDebug=await page.evaluate(()=>{
   const q=window.__r45QA,f=document.getElementById('stadium').contentWindow;
   return {qa:!!q,recovery:q?.r195Recovery,
    parentView:q?.r196View,sceneReady:q?.sceneReady,sceneError:q?.sceneError,
    sceneSrc:document.getElementById('stadium')?.src,
    sceneLoaded:!!f?.__r45SceneQA,childReady:f?.__r45SceneQA?.ready,
    childRecovery:f?.__r45SceneQA?.r196RecoveryView,
    childMetrics:f?.__ASDC_LOAD_METRICS,
    loadText:f?.document?.querySelector('#loading')?.innerText?.slice(0,250)};
  }).catch(e=>({unavailable:String(e)}));
  console.error('R196_FAILURE_DIAG',JSON.stringify(result.failureDebug));
  throw error;
 }
 await page.waitForFunction(()=>document.getElementById('stadium').contentWindow?.__r45SceneQA?.r196RecoveryView?.hydratedBoards===1,
  null,{timeout:12000});
 result.after=await snap();
 assert.equal(result.after.sceneVisual.resuming,true);
 assert(result.after.recovery.r196ElapsedMs>0,
  'expected measured stage-only recovery duration');
 assert.equal(result.after.recovery.r196AudioContinuity.sameMusicKind,true);
 assert.equal(result.after.recovery.r196AudioContinuity.sameMusicHistory,true);
 assert.equal(result.after.recovery.r196AudioContinuity.sameRequested,true);
 // Chrome can finish a previously queued autoplay attempt during rendering;
 // counters.musicStart is asynchronous and not an audio-restart proof.
 assert.equal(result.after.sceneVisual.hydratedBoards,1);
 assert.equal(result.after.sceneVisual.initialCameraYaw,desiredYaw);
 assert(Math.abs(result.after.sceneVisual.currentCameraYaw-desiredYaw)<0.01,
  'restored 3D camera did not match previous view at first frame');
 assert.equal(result.after.visual.cameraDegrees,desiredYaw);
 assert.deepEqual(result.after.audio.musicHistory,result.before.audio.musicHistory,
  'parent music sequence should not restart on scene-only recovery');
 assert.equal(result.after.audio.musicKind,result.before.audio.musicKind);
 assert(result.after.audio.musicStarts>=result.before.audio.musicStarts,
  'music-start counters must never go backward');
 assert.equal(result.after.audio.requested,result.before.audio.requested);
 assert.equal(result.after.sceneVisual.pendingSpells,0,
  'old school magic must not re-fire after recovery');
 assert.equal(result.after.sceneVisual.pendingCrowd,0,
  'old spectator incident must not re-fire after recovery');
 assert.equal(result.after.sceneVisual.liveSpellSerials,0,
  'old spell serials must not be replayed');
 assert.equal(result.after.sceneVisual.hostHitDamage.player,0);
 assert.equal(result.after.sceneVisual.hostHitDamage.ai,0);
 assert(result.after.sceneVisual.suppressedBoardPulses>=0 &&
  result.after.sceneVisual.suppressedBoardPulses<=2);
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
  assert.equal(result.secondAfter.sceneVisual.initialCameraYaw,desiredYaw);
  assert.equal(result.secondAfter.sceneVisual.hydratedBoards,1);
  assert.equal(result.secondAfter.visual.cameraDegrees,desiredYaw);
  assert.deepEqual(result.secondAfter.audio.musicHistory,
   result.secondBefore.audio.musicHistory);
  assert.equal(result.secondAfter.audio.musicKind,
   result.secondBefore.audio.musicKind);
  assert(result.secondAfter.audio.musicStarts>=
   result.secondBefore.audio.musicStarts);
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
  assert.equal(expectedFailClosedConsole.length,1,
   'exactly one expected fail-closed diagnostic is required');
 }
 assert.deepEqual(errors,[]);
 result.halfIntercepted=halfIntercepted;result.recoveryVendorPass=recoveryVendorPass;
 result.pass=true;
 console.log('R196_CAMERA_AUDIO_VISUAL_HYDRATION_PASS',JSON.stringify({
  name,pass:result.pass,roundBefore:result.before.round,
  roundAfter:result.after.round,
  required:result.after.required,rebuiltOriginals:result.after.sources,
  originalFingerprint:result.before.recovery.current,
  restoredFingerprint:result.after.recovery.current,
  resumedRound:result.resumed?.round??null,
  cameraAngleBefore:result.before.visual.cameraDegrees,
  cameraAngleAfter:result.after.visual.cameraDegrees,
  postLoadInitialCamera:result.after.sceneVisual.initialCameraYaw,
  silentHydratedBoards:result.after.sceneVisual.hydratedBoards,
  suppressedFakePulse:result.after.sceneVisual.suppressedBoardPulses,
  musicBefore:result.before.audio.musicKind,musicAfter:result.after.audio.musicKind,
  musicStartsBefore:result.before.audio.musicStarts,musicStartsAfter:result.after.audio.musicStarts,
  sceneRebuildMs:result.after.recovery.r196ElapsedMs,
  sceneRebuildAudio:result.after.recovery.r196AudioContinuity,
  beforeUpload:result.before.uploadedMiB,afterUpload:result.after.uploadedMiB,
  halfIntercepted,recoveryVendorPass,losses,secondRecovered:result.secondAfter?.recovery.state,
  thirdFailClosed:result.thirdAfter?.recovery.state,errors}));
}finally{
 writeFileSync(dir+'/'+name+'.json',JSON.stringify(result,null,2));
 await ctx.close();await browser.close();
}
