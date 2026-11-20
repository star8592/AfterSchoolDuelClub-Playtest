import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r217-prefetch';mkdirSync(dir,{recursive:true});
const url='http://10.10.10.138:18698/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r210Elements=on&r211CinematicVfx=on&r212StadiumBatch=on&r213ThumbLite=on&r214Concurrency=4';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={ok:false,platform:'Z890 real Chrome GPU',note:'Each row independent incognito context within one Chrome process; order baseline/prefetch/prefetch/baseline; cache/driver warm-up not fully controlled',cases:[],errors:[]};
try{
 for(const [i,tag,flag] of [[0,'baseline',''],[1,'prefetch','&r217Prefetch=on'],[2,'prefetch','&r217Prefetch=on'],[3,'baseline','']]){
  const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(tag+i+' JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes(':18698/'))report.errors.push(tag+i+' HTTP '+r.status()+' '+r.url())});
  const t=Date.now();
  await page.goto(url+flag,{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
  const row=await page.evaluate(()=>{
   const w=document.getElementById('stadium').contentWindow,z=w.__r45SceneQA;
   return {prefetch:z.r217Prefetch,load:z.r214LoadProfile,trace:z.r216LoadStages,
    source:z.r213ThumbLite,drawCalls:z.drawCalls,actors:z.roles.map(a=>({id:a.id,bones:a.bones,skins:a.skinnedMeshes})),
    audience:z.stadiumAmbience.audience.loaded,assetBytes:w.__ASDC_LOAD_METRICS.downloadedBytes};
  });
  assert.equal(row.prefetch.enabled,tag==='prefetch');
  assert.equal(row.drawCalls,649);
  assert.equal(row.load.finalAssets,16);
  assert.equal(row.trace.summons.length,12);
  assert.equal(row.audience,8);
  assert.equal(row.assetBytes,70447094);
  assert.equal(row.source.loadedModels,4);
  assert.deepEqual(report.errors,[]);
  if(i===0||i===1)await page.screenshot({path:dir+'/r217-'+tag+'-real-chrome.png'});
  report.cases.push({run:i+1,tag,readyWallMs:Date.now()-t,
   modelReadyMs:row.load.fullReadyMs,firstPaintMs:row.load.firstPaintMs,
   firstRenderCpuMs:row.trace.warmupRenderCpuMs[0],
   gltfParseTotalMs:Math.round(row.trace.summons.reduce((a,s)=>a+(s.gltfParseMs||0),0)),
   slowest:row.trace.summons.map(s=>({id:s.id,queueMs:s.queueWaitMs,
    transferPlusInflateMs:s.transferPlusInflateMs,parseMs:s.gltfParseMs,
    prefetchQueueMs:s.prefetchQueueMs||0})).sort((a,b)=>b.transferPlusInflateMs-a.transferPlusInflateMs).slice(0,5),
   memory:await page.evaluate(()=>document.getElementById('stadium').contentWindow.performance.memory?.usedJSHeapSize??null),
   ...row});
  await ctx.close();
 }
 assert.deepEqual(report.cases[0].actors,report.cases[1].actors);
 assert.deepEqual(report.cases[2].actors,report.cases[3].actors);
 report.ok=true;
}catch(e){report.failure=String(e);console.error('R217_PREFETCH_AB_FAILED',String(e))}
finally{
 await browser.close();
 writeFileSync(dir+'/r217-z890-abba-real-chrome.json',JSON.stringify(report,null,2)+'\n');
 console.log('R217_PREFETCH_ABBA_SUMMARY',JSON.stringify({
  ok:report.ok,failure:report.failure,errors:report.errors,
  cases:report.cases.map(c=>({run:c.run,tag:c.tag,readyWallMs:c.readyWallMs,
   modelReadyMs:c.modelReadyMs,firstPaintMs:c.firstPaintMs,
   firstRenderCpuMs:c.firstRenderCpuMs,prefetch:c.prefetch,
   peakParserMs:Math.max(...c.trace.summons.map(s=>s.gltfParseMs||0))}))
 }));
}
if(!report.ok)process.exitCode=8;
