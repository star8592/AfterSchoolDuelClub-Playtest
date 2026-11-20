import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const folder='r45-duel/qa/evidence/r212-perf-audit';mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={ok:false,realChrome:true,url:'http://10.10.10.138:18693/r45-duel/',errors:[],observations:[]};
const context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
const page=await context.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400&&r.url().includes(':18693/'))report.errors.push('HTTP '+r.status()+' '+r.url())});
try{
 const start=Date.now();
 await page.goto(report.url+'?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on&r210Elements=on&r211CinematicVfx=on',{waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:140000});
 await page.waitForTimeout(750);
 const data=await page.evaluate(()=>{
  const w=document.querySelector('#stadium')?.contentWindow;
  const z=w?.__r45SceneQA;
  const res=performance.getEntriesByType('resource').map(x=>({name:x.name.split('/').pop(),duration:Math.round(x.duration),size:x.transferSize||0})).sort((a,b)=>b.duration-a.duration);
  const load=w?.__ASDC_LOAD_METRICS||null;
  return {renderTree:z.auditRenderTree(),load,
   r210:z.r210Elements, r211:z.r211CinematicVfx,
   frameCount:z.frameCount,resourceCount:res.length, slowestResources:res.slice(0,16)};
 });
 report.readyMs=Date.now()-start;Object.assign(report,data);
 assert(report.renderTree.visibleMeshes>200,'expected scene hierarchy');
 assert(report.renderTree.drawCalls>300);
 assert.deepEqual(report.errors,[]);
 const snap=folder+'/r212-before-original-gpu.png';
 await page.screenshot({path:snap});report.screenshot=snap;
 report.ok=true;
}catch(e){report.failure=String(e)}
finally{
 await context.close();await browser.close();
 writeFileSync(folder+'/r212-real-scene-render-tree.json',JSON.stringify(report,null,2)+'\n');
 console.log('R212_SCENE_RENDER_AUDIT',JSON.stringify(report).slice(0,17000));
}
if(!report.ok)process.exitCode=7;
