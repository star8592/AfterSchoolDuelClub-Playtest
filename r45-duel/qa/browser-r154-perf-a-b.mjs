import{createRequire}from'node:module';
import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const source=readFileSync(resolve(import.meta.dirname,'../scene/scene.mjs'));
const origin='https://star8592.github.io/AfterSchoolDuelClub-Playtest/r45-duel/';
const dest=process.env.ASDC_PERF_EVIDENCE||'/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118';
mkdirSync(dest,{recursive:true});
const report={date:new Date().toISOString(),origin,mode:'only intercept scene.mjs in isolated Chrome; untouched production site',results:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-webgl',
 '--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 const context=await browser.newContext({viewport:{width:430,height:900},deviceScaleFactor:2,hasTouch:true,isMobile:true});
 const runs=[['baseline','?seed=154'],['r154Perf','?seed=154&r154Perf=on']];
 if(process.env.ASDC_AB_REVERSE==='1')runs.reverse();
 for(const [name,query] of runs){
  const page=await context.newPage(),errors=[],assets=[];
  page.on('pageerror',e=>errors.push('JS '+e.message.slice(0,200)));
  page.on('requestfailed',r=>errors.push('REQ '+r.url().split('/').pop()+' '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-100))});
  await page.route('**/r45-duel/scene/scene.mjs*',route=>route.fulfill({status:200,body:source,contentType:'text/javascript'}));
  const devtools=await context.newCDPSession(page);
  await devtools.send('Emulation.setCPUThrottlingRate',{rate:4});
  const started=Date.now();
  await page.goto(origin+query,{waitUntil:'domcontentloaded',timeout:80000});
  let ready=true;
  try{await page.waitForFunction(()=>!!document.querySelector('#stadium')?.contentWindow?.__ASDC_LOAD_METRICS?.firstFrameReadyMs,null,{timeout:90000,polling:300})}catch(e){ready=false;errors.push('ready timeout '+String(e).slice(0,160))}
  const elapsed=Date.now()-started;
  const v=await page.evaluate(async()=>{
   const win=document.querySelector('#stadium')?.contentWindow,qa=win?.__r45SceneQA;
   const prev=win?.__ASDC_LOAD_METRICS;
   const ts=[];
   if(qa){
    await new Promise(resolve=>{
      let prevTime=0;
      function step(t){
       if(prevTime)ts.push(t-prevTime);
       prevTime=t;
       if(ts.length<150)win.requestAnimationFrame(step);else resolve()
      }
      win.requestAnimationFrame(step)
    });
   }
   ts.sort((a,b)=>a-b);
   const q=p=>ts[Math.min(ts.length-1,Math.floor((ts.length-1)*p))]||null;
   return{parentSceneReady:window.__r45QA?.sceneReady??null,
     sceneLoaded:!!qa,progress:prev?{...prev}:null,
     render:qa?.renderPerformance??null,drawCalls:qa?.drawCalls??null,
     canvasSize:win?.document?.querySelector('#battle-canvas')?.getBoundingClientRect().toJSON()??null,
     raf:{median:q(.5),p95:q(.95),p99:q(.99),max:q(1),slowFramesOver33ms:ts.filter(t=>t>33.3).length,count:ts.length}};
  });
  const output={name,elapsed,ready,errors,metrics:v};
  report.results.push(output);
  await page.screenshot({path:resolve(dest, name+(process.env.ASDC_AB_REVERSE==='1'?'-reverse':'')+'-r154-mobile.png')});
  console.log('R154_AB_CASE',JSON.stringify(output));
  await page.close();
 }
}finally{
 writeFileSync(resolve(dest,process.env.ASDC_AB_REVERSE==='1'?'r154-perf-ab-reverse.json':'r154-perf-ab.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R154_AB_COMPLETE',JSON.stringify(report.results.map(x=>({mode:x.name,ready:x.ready,render:x.metrics.render,raf:x.metrics.raf,errors:x.errors.length}))));
