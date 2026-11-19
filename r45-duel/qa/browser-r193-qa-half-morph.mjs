import assert from 'node:assert/strict';
import {makeHalfMorphVendorOverlay} from './r193-half-morph-overlay.mjs';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
  '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const half=process.env.R193_HALF==='on',deck=process.env.R193_DECK||'classic';
const mobile=process.env.R193_MOBILE==='on';
const seed=deck==='classic'?173:2;
const dir='r45-duel/qa/evidence/r193-texture-lifetime';
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:mobile?{width:430,height:900}:{width:1280,height:720},
 deviceScaleFactor:1,serviceWorkers:'block'});
const page=await context.newPage();const errors=[];
const cpuThrottling=Number(process.env.R193_CPU||1);
const cdp=await context.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuThrottling});

const runId=deck+'-'+(mobile?'mobile':'desktop')+'-'+(half?'rgba16f':'rgba32f')+(process.env.R193_CPU?'_cpu'+process.env.R193_CPU:'')+(process.env.R193_NATIVE==='on'?'_native':'');
let intercepted=0;
if(half){
 const sourcePath='r45-duel/assets/three/build/three.module.js';
 const patched=makeHalfMorphVendorOverlay(readFileSync(sourcePath,'utf8'),{native:process.env.R193_NATIVE==='on'});
 await page.route('**/assets/three/build/three.module.js',async route=>{
  intercepted++;
  await route.fulfill({status:200,contentType:'application/javascript',
   body:patched,headers:{'cache-control':'no-store'}});
 });
}
page.on('pageerror',e=>errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
const report={runId,deck,mobile,half,seed,cpuThrottling,errors,pass:false};
try{
 const query=new URLSearchParams({qa:'1',deck,seed:String(seed),
 r189Stream:'on',r190Demand:'on',r181HairBatch:'on',
 r191TextureAudit:'on',r192TraceGpu:'on',r193MorphError:'on',r188Owl:'barn',
 r169SchoolMagic:'on',r180StadiumBatch:'on'});
 await page.goto('http://127.0.0.1:18687/r45-duel/?'+query,{
  waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 await page.waitForTimeout(1400);
 report.captured=await page.evaluate(()=>{
   const f=document.getElementById('stadium').contentWindow,q=f.__r45SceneQA;
   const t=q.r192Lifecycle;
   return {readyMs:f.__ASDC_LOAD_METRICS?.firstFrameReadyMs??null,
     gpu:q.r191TextureAudit.gpuTextureObjects,loaded:q.r189StreamReceipt.loadedNow,
     drawCalls:q.r191TextureAudit.drawCalls,
     arrayAlloc:t.arrayAllocations3D,
     uploadMiB:t.arrayUploadedFloatPayloadMiB,
     arrayShapes:t.arrayAllocationShapes,
     uploadShapes:t.arrayUploadShapes,
     noTarget:t.unownedUnknownTargetCount,
     twoD:t.unowned2DDetail.length,
     possibleJsMB:q.r189StreamReceipt.cpuHeapMB,
     halfError:q.r193MorphHalfError};
 });
 assert(report.captured.arrayAlloc>=50,'expected genuine morph texture uploads');
 if(half){
  assert(intercepted>=1,'QA vendor-only redirect did not fire');
  assert(report.captured.arrayShapes.some(x=>x.shape.endsWith('34842')),'RGBA16F allocation missing');
  assert(!report.captured.arrayShapes.some(x=>x.shape.endsWith('34836')),'RGBA32F allocations still present');
 }else{
  assert(report.captured.arrayShapes.some(x=>x.shape.endsWith('34836')),'baseline RGBA32F missing');
 }
 assert.equal(errors.length,0,errors.join('\n'));
 report.intercepted=intercepted;report.pass=true;
 await page.locator('#stadium').screenshot({path:dir+'/'+runId+'.png'});
 console.log('R193_HALF_WEBGL',JSON.stringify({runId,pass:report.pass,
  models:report.captured.loaded.length,readyMs:report.captured.readyMs,objects:report.captured.gpu,
  alloc:report.captured.arrayAlloc,uploadMiB:report.captured.uploadMiB,
  arrayShapes:report.captured.arrayShapes.slice(0,4),
  halfPositionError:report.captured.halfError.stats.position,
  halfNormalError:report.captured.halfError.stats.normal,
  halfOverflows:report.captured.halfError.overflows,
  nativeBitsMismatch:report.captured.halfError.nativeBitsMismatch,
  nativeBetter:report.captured.halfError.nativeBetter,
  nativeWorse:report.captured.halfError.nativeWorse,
  nativeMaxVsSoftware:report.captured.halfError.nativeMaxVsSoftware,
  nativeOver001:report.captured.halfError.nativeOver001,errors}));
}finally{
 writeFileSync(dir+'/'+runId+'.json',JSON.stringify(report,null,2));
 await context.close();await browser.close();
}
