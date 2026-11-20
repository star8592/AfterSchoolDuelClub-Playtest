import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base='http://10.10.10.138:18694/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r210Elements=on&r211CinematicVfx=on&r212StadiumBatch=on';
const dir='r45-duel/qa/evidence/r213-metadata-asset';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={ok:false,benchmark:'Z890 Chrome GPU, two separate fresh page contexts, 16/16 asset readiness',cases:[],errors:[]};
try{
 for(const [name,flags] of [['original',''],['thumblite','&r213ThumbLite=on']]){
  const context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),seen=new Set();
  page.on('pageerror',e=>report.errors.push(name+' JS '+e.message));
  page.on('response',r=>{
   if(r.url().includes('/assets/model/')&&r.status()===200)seen.add(new URL(r.url()).pathname.split('/').pop());
   if(r.url().includes(':18694/')&&r.status()>=400)report.errors.push(name+' HTTP '+r.status()+' '+r.url());
  });
  const start=Date.now();
  await page.goto(base+flags,{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:140000});
  await page.waitForTimeout(350);
  const data=await page.evaluate(()=>{
   const z=document.getElementById('stadium').contentWindow.__r45SceneQA;
   const load=document.getElementById('stadium').contentWindow.__ASDC_LOAD_METRICS;
   return {assets:z.r213ThumbLite,roles:z.roles.map(r=>({id:r.id,asset:r.asset,bones:r.bones,skins:r.skinnedMeshes})),
    hosts:z.duelistHosts.map(r=>({id:r.id,modelSource:r.modelSource,bones:r.bones,skins:r.skins})),
    seatBanks:z.stadiumSeatBanks,stadium:z.stadiumAmbience?.audience?.loaded,
    drawCalls:z.drawCalls,load};
  });
  assert.equal(data.assets.enabled,name==='thumblite');
  assert.equal(data.assets.loadedModels,4);
  assert.equal(data.stadium,8);
  assert.equal(data.assets.verifiedSources.length,4);
  for(const a of data.assets.verifiedSources)assert.equal(a.transport.endsWith('-R213-ThumbLite.vrm'),name==='thumblite');
  assert.equal(seen.size,4);
  if(name==='thumblite')assert([...seen].every(n=>n.endsWith('-R213-ThumbLite.vrm')));
  const screenshot=dir+'/r213-'+name+'-real-chrome.png';
  await page.screenshot({path:screenshot});
  report.cases.push({name,readyMs:Date.now()-start,...data,actualAssetUrls:[...seen],screenshot});
  await context.close();
 }
 const [a,b]=report.cases;
 assert.deepEqual(a.roles,b.roles,'source 2 VRM skeleton/skins must remain exactly identical');
 assert.deepEqual(a.hosts,b.hosts,'source 2 podium models must remain identical');
 assert.deepEqual(a.seatBanks,b.seatBanks);
 assert.equal(a.drawCalls,b.drawCalls);
 assert.deepEqual(report.errors,[]);
 report.ok=true;
}catch(e){report.failure=String(e);console.error('R213_BROWSER_FAILURE',String(e))}
finally{
 await browser.close();
 writeFileSync(dir+'/r213-real-chrome-4vrm-ab.json',JSON.stringify(report,null,2)+'\n');
 console.log('R213_REAL_CHROME_VRM_METADATA_AB',JSON.stringify(report).slice(0,20000));
}
if(!report.ok)process.exitCode=7;
