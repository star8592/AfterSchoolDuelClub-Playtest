import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r219-shader-prewarm';mkdirSync(dir,{recursive:true});
const url='http://10.10.10.138:18699/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r210Elements=on&r211CinematicVfx=on&r212StadiumBatch=on&r213ThumbLite=on&r214Concurrency=4';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block',reducedMotion:'reduce'});
const page=await ctx.newPage();const report={ok:false,platform:'Z890 Chrome WebGL real scene',errors:[]};
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400&&r.url().includes(':18699/'))report.errors.push('HTTP '+r.status()+' '+r.url())});
try{
 const t=Date.now();
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
 const result=await page.evaluate(()=>{
  const w=document.getElementById('stadium').contentWindow;
  const q=w.__r45SceneQA;
  return {stages:q.r216LoadStages,profile:q.r214LoadProfile,thumb:q.r213ThumbLite,
   batch:q.r212StadiumBatch,drawCalls:q.drawCalls,
   realCrowd:q.stadiumAmbience.audience.loaded,
   load:w.__ASDC_LOAD_METRICS};
 });
 Object.assign(report,result);
 report.wallReadyMs=Date.now()-t;
 report.shader=await page.evaluate(()=>document.getElementById('stadium').contentWindow.__r45SceneQA.r219ShaderPrewarm);
 assert.equal(report.shader.enabled,false);
 assert.equal(report.shader.success,false); 
 assert.equal(report.profile.finalAssets,16);
 assert.equal(report.stages.summons.length,12);
 assert.equal(report.realCrowd,8);
 assert.equal(report.drawCalls,649);
 assert.equal(report.batch.enabled,true);
 assert.equal(report.thumb.enabled,true);
 assert.equal(report.load.downloadedBytes,70447094);
 assert(report.stages.network.length>=16,'Expected 16 network resources, got '+report.stages.network.length);
 assert(report.stages.warmupRenderCpuMs.length>=7,'No renderer warm-up measurements');
 const gzip=report.stages.summons.filter(s=>s.mode==='gzip+GLTFLoader.parseAsync');
 assert(gzip.length>=6,'GZIP stage count '+gzip.length);
 assert(gzip.every(s=>s.gltfParseMs>=0&&s.transferPlusInflateMs>=0&&s.queueWaitMs>=0));
 report.summary={
  largestWire:report.stages.network.filter(s=>s.encodedBytes>0).sort((a,b)=>b.encodedBytes-a.encodedBytes).slice(0,6),
  mostExpensiveParse:[...gzip].sort((a,b)=>b.gltfParseMs-a.gltfParseMs).slice(0,6),
  mostExpensiveTransfer:[...gzip].sort((a,b)=>b.transferPlusInflateMs-a.transferPlusInflateMs).slice(0,6),
  slowestQueue:[...report.stages.summons].sort((a,b)=>b.queueWaitMs-a.queueWaitMs).slice(0,6)
 };
 await page.screenshot({path:dir+'/r219-z890-baseline-all-actors-real-gpu.png'});
 assert.deepEqual(report.errors,[]);
 report.ok=true;
}catch(e){report.failure=String(e);console.error('R216 TRACE QA FAIL',e)}
finally{
 await ctx.close();await browser.close();
 writeFileSync(dir+'/r219-z890-baseline-real-chrome-stage-trace.json',JSON.stringify(report,null,2)+'\n');
 console.log('R216_Z890_STAGE_TRACE',JSON.stringify(report).slice(0,15000));
}
if(!report.ok)process.exitCode=8;
