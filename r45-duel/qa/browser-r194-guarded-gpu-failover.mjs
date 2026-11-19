/** R194 isolated WebGL2 GPU proof, forced failover, and recovery QA. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {makeHalfMorphVendorOverlay} from './r193-half-morph-overlay.mjs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const scenario=process.env.R194_SCENARIO||'guarded-half';
const view=process.env.R194_VIEW||'desktop';
const deck=process.env.R194_DECK||'classic';
const cpu=view==='mobile'?4:2;
const dir='r45-duel/qa/evidence/r194-gpu-fallback';mkdirSync(dir,{recursive:true});
const gpuBackend=process.env.R194_GPU||'vulkan';
const runId=scenario+'-'+deck+'-'+view+(gpuBackend==='vulkan'?'':'-'+gpuBackend);
const gpuArgs=gpuBackend==='gl'?['--use-angle=gl']:
 gpuBackend==='swiftshader'?['--use-angle=swiftshader']:
 ['--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan'];
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl',...gpuArgs,'--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const ctx=await b.newContext({viewport:view==='mobile'?{width:430,height:900}:{width:1280,height:720},serviceWorkers:'block'});
const page=await ctx.newPage();
const errors=[],report={scenario,view,deck,runId,gpuBackend,errors,pass:false};
page.on('pageerror',e=>errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
const cdp=await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
let overlayHits=0;
let patchHandler=null;
async function sampleScene(){
 return await page.evaluate(()=>{
   const f=document.getElementById('stadium').contentWindow;
   const q=f?.__r45SceneQA,t=q?.r192Lifecycle;
   if(!q||!t?.installed)return {ready:false};
   return {ready:true,gpu:q.r191TextureAudit.gpuTextureObjects,
     originals:q.r189StreamReceipt.loadedNow,
     morphAllocations:t.arrayAllocations3D,
     morphFloatUploadMiB:t.arrayUploadedFloatPayloadMiB,
     formats:t.arrayAllocationShapes,
     drawCalls:q.r191TextureAudit.drawCalls};
 });
}
async function openGame(){
 const query=new URLSearchParams({qa:'1',seed:deck==='kitchen'?'2':'173',deck,
  r189Stream:'on',r190Demand:'on',r181HairBatch:'on',
  r191TextureAudit:'on',r192TraceGpu:'on',r188Owl:'barn',r169SchoolMagic:'on',
  r180StadiumBatch:'on'});
 await page.goto('http://127.0.0.1:18687/r45-duel/?'+query,
   {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
   null,{timeout:120000});
 await page.waitForTimeout(500);
 return sampleScene();
}
try{
 await page.goto('http://127.0.0.1:18687/r45-duel/qa/r194-probe-host.html');
 const needsRestore=(scenario==='restore-strict');
 report.preflight=await page.evaluate(async doRestore=>{
  const m=await import('./r194-float16-capability.mjs');
  return m.probeRgba16fMorphSupport({exerciseRestore:doRestore});
 },needsRestore);
 const choices=await page.evaluate(async({probe,scenario})=>{
  const m=await import('./r194-float16-capability.mjs');
  return {
   selected:m.selectMorphTextureMode(probe,{
     requested:scenario!=='disabled',
     forceReject:scenario==='forced-reject',
     requireRestore:scenario==='restore-strict'
   }),
   forcedReject:m.selectMorphTextureMode(probe,{forceReject:true}),
   disabled:m.selectMorphTextureMode(probe,{requested:false})
  };
 },{probe:report.preflight,scenario});
 report.choice=choices.selected;
 assert.equal(choices.forcedReject.mode,'rgba32f');
 assert.equal(choices.disabled.mode,'rgba32f');
 if(report.choice.mode==='rgba16f'){
  const patch=makeHalfMorphVendorOverlay(
   readFileSync('r45-duel/assets/three/build/three.module.js','utf8'),{native:true});
  patchHandler=async route=>{
   overlayHits++;
   await route.fulfill({status:200,contentType:'application/javascript',
    body:patch,headers:{'cache-control':'no-store'}});
  };
  await page.route('**/assets/three/build/three.module.js',patchHandler);
 }
 report.before=await openGame();
 assert.equal(report.before.ready,true,'scene failed');
 assert(report.before.morphAllocations>=40,'real morph arrays missing');
 assert.equal(errors.length,0,errors.join('\n'));
 const expected=report.choice.mode==='rgba16f'?'34842':'34836';
 assert(report.before.formats.some(x=>x.shape.endsWith(expected)),
  'Selected real GPU internal format mismatch: '+expected);
 assert(!report.before.formats.some(x=>x.shape.endsWith(expected==='34842'?'34836':'34842')),
  'Unselected GPU internal format allocated');
 assert(overlayHits>0||report.choice.mode==='rgba32f');
 await page.locator('#stadium').screenshot({path:dir+'/'+runId+'-before.png'});
 if(scenario==='context-loss-failover'){
  assert.equal(report.choice.mode,'rgba16f','failover needs active 16F before losing context');
  report.contextLoss=await page.evaluate(async()=>{
   const f=document.getElementById('stadium').contentWindow;
   const canvas=f.document.querySelector('#battle-canvas');
   const gl=canvas?.getContext('webgl2');
   const ext=gl?.getExtension('WEBGL_lose_context');
   if(!ext)return {extension:false,lost:false};
   return await new Promise(resolve=>{
    const timer=setTimeout(()=>resolve({extension:true,lost:false,timeout:true}),4000);
    canvas.addEventListener('webglcontextlost',ev=>{
     ev.preventDefault();clearTimeout(timer);resolve({extension:true,lost:true});
    },{once:true});
    ext.loseContext();
   });
  });
  assert(report.contextLoss.lost,'real renderer context did not emit loss event');
  // QA's automated failover controller reloads the actual game with the
  // unchanged vendored 32-bit renderer. No player code paths are patched.
  await page.unroute('**/assets/three/build/three.module.js',patchHandler);
  report.fallbackReason='context loss observed; QA controlled reload to original 32F';
  report.after=await openGame();
  assert.equal(report.after.ready,true);
  assert(report.after.formats.some(x=>x.shape.endsWith('34836')),
    'Failover did not restore native unchanged RGBA32F texture');
  assert(!report.after.formats.some(x=>x.shape.endsWith('34842')),
    'Half float still active after failover');
  assert.deepEqual([...report.after.originals].sort(),[...report.before.originals].sort(),
   'Fallback must rehydrate the same original GLB source identities');
  await page.locator('#stadium').screenshot({path:dir+'/'+runId+'-after.png'});
 }
 assert.equal(errors.length,0,'JS/HTTP errors after fallback: '+errors.join('; '));
 report.overlayHits=overlayHits;
 report.pass=true;
 console.log('R194_GUARDED_GPU_PROBE_PASS',JSON.stringify({
  scenario,pass:report.pass,decision:report.choice.mode,
  preflight:report.preflight.supported,
  preflightRestore:report.preflight.contextLoss,
  before:report.before.morphFloatUploadMiB,
  after:report.after?.morphFloatUploadMiB,
  contextLoss:report.contextLoss,errors}));
}finally{
 writeFileSync(dir+'/'+runId+'.json',JSON.stringify(report,null,2));
 await ctx.close();await b.close();
}
