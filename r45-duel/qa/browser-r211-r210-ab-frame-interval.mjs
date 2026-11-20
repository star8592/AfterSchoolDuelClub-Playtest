/* Identical Chrome/GPU/viewport for R210 and R211. Indicative only, no XPS claim. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r211-cinematic-vfx';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const result={ok:false,assumptions:'Single Z890 Chrome session; indicative frame intervals, not standardized FPS or cold start',cases:[],errors:[]};
try{
 for(const name of ['R210','R211']){
  const context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>result.errors.push(name+' '+e.message));
  const url='http://127.0.0.1:18691/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on&r210Elements=on'+(name==='R211'?'&r211CinematicVfx=on':'');
  const start=Date.now();await page.goto(url,{waitUntil:'domcontentloaded',timeout:75000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
  await page.waitForTimeout(550);
  if(name==='R211')await page.waitForFunction(()=>document.getElementById('stadium').contentWindow.__r45SceneQA?.r211CinematicVfx?.material?.textureReady?.fire&&document.getElementById('stadium').contentWindow.__r45SceneQA?.r211CinematicVfx?.material?.textureReady?.water,null,{timeout:15000});
  const loadedMs=Date.now()-start;
  const frames=await page.evaluate(async()=>{
   const z=document.getElementById('stadium').contentWindow.__r45SceneQA;
   const before=z.drawCalls,oldStats=z.r210Elements?.material;
   z.previewR210CardElements(['E06','T05','S08']);
   const intervals=[];let last=null;
   for(let i=0;i<56;i++){
    const now=await new Promise(resolve=>requestAnimationFrame(resolve));
    if(last!==null)intervals.push(now-last);
    last=now;
   }
   intervals.sort((a,b)=>a-b);
   return {drawCallsBefore:before,drawCallsWithEffects:z.drawCalls,
    avgInterval:intervals.reduce((a,b)=>a+b,0)/intervals.length,
    p95Interval:intervals[Math.ceil(.95*intervals.length)-1],
    p99Interval:intervals[Math.ceil(.99*intervals.length)-1],
    r211:z.r211CinematicVfx,r210:z.r210Elements,
    gpuFrameCount:intervals.length};
  });
  result.cases.push({name,loadedMs,drawCallsBefore:frames.drawCallsBefore,
    drawCallsWithEffects:frames.drawCallsWithEffects,
    avgFrameMs:Math.round(frames.avgInterval*100)/100,
    p95Ms:Math.round(frames.p95Interval*100)/100,
    p99Ms:Math.round(frames.p99Interval*100)/100,
    frames:frames.gpuFrameCount,
    r211Active:frames.r211?.material?.active||0,
    r210Active:frames.r210?.material?.active||0});
  await context.close();
 }
 assert.equal(result.cases[0].name,'R210');assert.equal(result.cases[1].name,'R211');
 assert.deepEqual(result.errors,[]);
 result.ok=true;
}catch(e){result.failure=String(e)}
finally{
 await browser.close();
 writeFileSync(dir+'/r211-single-machine-r210-vs-r211-frame-interval.json',JSON.stringify(result,null,2)+'\n');
 console.log('R211_AB_INDICATIVE_BENCHMARK',JSON.stringify(result));
}
if(!result.ok)process.exitCode=7;
