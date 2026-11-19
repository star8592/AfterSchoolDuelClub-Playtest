import assert from 'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const deck=process.env.R192_DECK||'classic',seed=+(process.env.R192_SEED||173),view=process.env.R192_VIEW||'desktop';
const hair=process.env.R192_HAIR||'on',trace=process.env.R192_TRACE!=='off';
const dir='r45-duel/qa/evidence/r192-gpu-lifecycle';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:view==='desktop'?{width:1280,height:720}:{width:430,height:900},
 deviceScaleFactor:view==='desktop'?1:2,serviceWorkers:'block'});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
const report={deck,seed,view,hair,trace,errors,pass:false};
try{
 const cdp=await context.newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:view==='desktop'?2:4});
 const u=new URL('http://127.0.0.1:18687/r45-duel/');
 for(const [k,v] of Object.entries({qa:'1',deck,seed:String(seed),r189Stream:'on',r190Demand:'on',
   r181HairBatch:hair,r191TextureAudit:'on',r192TraceGpu:trace?'on':'off',
   r188Owl:'barn',r169SchoolMagic:'on',r180StadiumBatch:'on',r186Hero:'P01'}))u.searchParams.set(k,v);
 await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
 const read=()=>page.evaluate(()=>{
  const f=document.getElementById('stadium').contentWindow,q=f.__r45SceneQA;
  return {texture:q.r191TextureAudit,lifecycle:q.r192Lifecycle,
    school:q.r169SchoolMagic,stream:q.r189StreamReceipt,morph:q.r192MorphBudget};
 });
 report.ready=await read();
 await page.waitForTimeout(1500);report.idle=await read();
 assert(report.idle.texture.ready,'R191 audit not enabled');
 if(trace)assert(report.idle.lifecycle.installed,'WebGL lifecycle hook did not install');
 assert(!errors.length,errors.join('\n'));
 report.pass=true;
 const n=deck+'-'+seed+'-'+view+'-'+hair+'-trace'+trace;
 await page.locator('#stadium').screenshot({path:dir+'/'+n+'.png'});
 console.log('R192_TEXTURE_TRACE',JSON.stringify({pass:report.pass,name:n,
  gpu:report.idle.texture.gpuTextureObjects,scene:report.idle.texture.allocatedReferenced,
  gap:report.idle.texture.countGap,stageLabels:report.idle.school.decalTextures,morphCount:report.idle.morph.uniqueMorphGeometries,
  morphPayloadMiB:report.idle.morph.float32PayloadProxyMiB,
  trace:report.idle.lifecycle,errors}).slice(0,14000));
}finally{
 writeFileSync(dir+'/'+deck+'-'+seed+'-'+view+'-'+hair+'-trace'+trace+'.json',JSON.stringify(report,null,2));
 await context.close();await browser.close();
}
