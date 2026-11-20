import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r214-loader-concurrency';mkdirSync(dir,{recursive:true});
const base='http://10.10.10.138:18695/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r210Elements=on&r211CinematicVfx=on&r212StadiumBatch=on';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={ok:false,device:'Z890 RTX5070Ti / Chrome',note:'Each case new incognito context within same browser; small one-run samples are not enough to choose production default',cases:[],errors:[]};
try{
 for(const limit of [2,4,6]){
  const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
  const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(limit+' JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes(':18695/'))report.errors.push(limit+' HTTP '+r.status()+' '+r.url())});
  const started=Date.now();
  await page.goto(base+'&r214Concurrency='+limit,{waitUntil:'domcontentloaded',timeout:75000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:140000});
  const data=await page.evaluate(()=>{
   const frame=document.getElementById('stadium').contentWindow,z=frame.__r45SceneQA;
   const perf=frame.performance;
   const urls=perf.getEntriesByType('resource').filter(e=>e.name.includes('/assets/model/')||e.name.includes('/assets/summons/'));
   return {profile:z.r214LoadProfile,load:frame.__ASDC_LOAD_METRICS,
    drawCalls:z.drawCalls,roles:z.roles.map(a=>a.id),audience:z.stadiumAmbience.audience.loaded,
    slowestNetwork:urls.sort((a,b)=>b.duration-a.duration).slice(0,8).map(a=>({name:new URL(a.name).pathname.split('/').pop(),durationMs:Math.round(a.duration),transferSize:a.transferSize}))};
  });
  assert.equal(data.profile.glbConcurrency,limit);
  assert.equal(data.profile.finalAssets,16);
  assert.equal(data.profile.summons.length,12);
  assert.equal(data.profile.vrms.length,4);
  assert.equal(data.audience,8);
  report.cases.push({limit,sceneReadyWallMs:Date.now()-started,...data,
   slowestModelLoads:[...data.profile.summons].sort((a,b)=>b.totalMs-a.totalMs).slice(0,6)});
  await ctx.close();
 }
 assert.deepEqual(report.errors,[]);
 report.ok=true;
}catch(e){report.failure=String(e);console.error('R214_LOAD_PROFILE_ERROR',String(e))}
finally{
 await browser.close();
 writeFileSync(dir+'/r214-z890-2-4-6-concurrency.json',JSON.stringify(report,null,2)+'\n');
 console.log('R214_LOAD_PROFILE',JSON.stringify(report).slice(0,23500));
}
if(!report.ok)process.exitCode=7;
