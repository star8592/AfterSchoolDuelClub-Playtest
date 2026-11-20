import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r215-integration';mkdirSync(dir,{recursive:true});
const base='http://10.10.10.138:18696/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r210Elements=on&r211CinematicVfx=on&r212StadiumBatch=on&r213ThumbLite=on&r214Concurrency=4';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block',reducedMotion:'reduce'});
const page=await ctx.newPage();const report={ok:false,realChromeGPU:true,flags:'R211+R212+R213+R214',errors:[]};
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400&&r.url().includes(':18696/'))report.errors.push('HTTP '+r.status()+' '+r.url())});
try{
 const start=Date.now();
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:70000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:140000});
 await page.waitForTimeout(350);
 const data=await page.evaluate(()=>{
  const win=document.getElementById('stadium').contentWindow,z=win.__r45SceneQA;
  const load=win.__ASDC_LOAD_METRICS;
  return {sources:z.r213ThumbLite,profiler:z.r214LoadProfile,
   batch:z.r212StadiumBatch,fire:z.r211CinematicVfx,
   drawCalls:z.drawCalls,loading:load,roles:z.roles,
   spectators:z.stadiumAmbience.audience.loaded};
 });
 report.readyMs=Date.now()-start;Object.assign(report,data);
 assert.equal(data.sources.enabled,true);assert.equal(data.sources.loadedModels,4);
 assert(data.sources.verifiedSources.every(s=>s.transport.endsWith('-R213-ThumbLite.vrm')));
 assert.equal(data.profiler.glbConcurrency,4);
 assert.equal(data.profiler.finalAssets,16);
 assert.equal(data.profiler.summons.length,12);
 assert.equal(data.profiler.vrms.length,4);
 assert.equal(data.batch.enabled,true);
 assert(data.batch.stats.theoreticalCallsSaved>=100);
 assert.equal(data.fire.enabled,true);
 assert.equal(data.drawCalls,649);
 assert.equal(data.spectators,8);
 assert.equal(data.loading.downloadedBytes,70447094);
 await page.screenshot({path:dir+'/r215-real-chrome-16-models-no-fx.png'});
 const ok=await page.evaluate(()=>document.getElementById('stadium').contentWindow.__r45SceneQA.previewR210CardElements(['E06','T05','S08']));
 assert.equal(ok,true);
 await page.waitForTimeout(280);
 const withFX=await page.evaluate(()=>{
  const z=document.getElementById('stadium').contentWindow.__r45SceneQA;
  return {drawCalls:z.drawCalls,newFx:z.r211CinematicVfx.material,oldFx:z.r210Elements.material};
 });
 assert.equal(withFX.newFx.spawned,3);
 assert.equal(withFX.oldFx.spawned,0);
 report.withFX={drawCalls:withFX.drawCalls,newFxSpawned:3,oldFxSpawned:0};
 await page.screenshot({path:dir+'/r215-real-chrome-all-flags-three-fx.png'});
 assert.deepEqual(report.errors,[]);
 report.ok=true;
}catch(e){report.failure=String(e);console.error('R215_COMBINED_QA_FAILED',String(e))}
finally{
 await ctx.close();await browser.close();
 writeFileSync(dir+'/r215-real-chrome-integrated-receipt.json',JSON.stringify(report,null,2)+'\n');
 console.log('R215_COMBINED_AUDIT',JSON.stringify(report).slice(0,11500));
}
if(!report.ok)process.exitCode=7;
