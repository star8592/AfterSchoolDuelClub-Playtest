/** R191 real Chrome/Three.js GPU texture graph: QA only, no gameplay changes. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const deck=process.env.R191_DECK||'classic',seed=Number(process.env.R191_SEED||173),view=process.env.R191_VIEW||'desktop',hair=process.env.R191_HAIR_BATCH||'off',alias=process.env.R191_ALIAS||'off';
const folder='r45-duel/qa/evidence/r191-gpu-textures';mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
  '--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:view==='desktop'?{width:1280,height:720}:{width:430,height:900},
  deviceScaleFactor:view==='desktop'?1:2,serviceWorkers:'block'});
const page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
const report={deck,seed,view,hair,alias,pass:false,errors};
try {
  const cdp=await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:view==='desktop'?2:4});
  const url=new URL('http://127.0.0.1:18687/r45-duel/');
  for(const [k,v] of Object.entries({qa:'1',r191TextureAudit:'on',
    r189Stream:'on',r190Demand:'on',r188Owl:'barn',r169SchoolMagic:'on',
    r180StadiumBatch:'on',r181HairBatch:hair,r191GpuBudget:alias,r186Hero:'P01',deck,seed:String(seed)})) url.searchParams.set(k,v);
  await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:75000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
  const read=()=>page.evaluate(()=>{
    const frame=document.getElementById('stadium').contentWindow;
    return {gpu:frame.__r45SceneQA.r191TextureAudit,
      demand:frame.__r45SceneQA.r189StreamReceipt,host:window.__r45QA.r190Demand};
  });
  report.ready=await read();
  await page.waitForTimeout(2000);
  report.idle=await read();
  assert(report.idle.gpu.ready,'texture audit not active');
  assert(report.idle.gpu.uniqueReferenced>0,'no scene texture references');
  assert(report.idle.gpu.gpuTextureObjects>=1,'invalid WebGL texture count');
  assert(report.idle.demand.demandOnly,'not R190 strict demand');
  report.pass=errors.length===0;
  const name=deck+'-'+seed+'-'+view+'-hair'+hair+(alias==='on'?'-aliasR191':'');
  await page.locator('#stadium').screenshot({path:folder+'/'+name+'.png'});
  console.log('R191',JSON.stringify({case:name,pass:report.pass,
    gpuObjects:report.idle.gpu.gpuTextureObjects,
    sceneReferenced:report.idle.gpu.uniqueReferenced,
    allocatedReferenced:report.idle.gpu.allocatedReferenced,
    missingCount:report.idle.gpu.countGap,
    rgba8ProxyMiB:report.idle.gpu.rgba8AllocatedProxyMiB,
    roots:report.idle.gpu.roots.slice(0,14),
    sharedSource:report.idle.gpu.duplicatedSourceObjects.slice(0,8),
    models:report.idle.demand.loadedNow,errors}));
} finally {
  writeFileSync(folder+'/'+deck+'-'+seed+'-'+view+'-hair'+hair+(alias==='on'?'-aliasR191':'')+'.json',JSON.stringify(report,null,2));
  await ctx.close();await browser.close();
}
if(!report.pass)process.exitCode=2;
