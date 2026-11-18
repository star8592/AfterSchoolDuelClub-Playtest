/**
 * R167 real Chrome/Vulkan local QA. Compare shader counts and GPU idle render
 * costs of 0/2/4 permanently visible but zero-intensity spell light slots.
 *
 * Production assets, spell appearance, card rules and particle counts are
 * identical. Slots are explicitly gated by QA URL query.
 */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const evidence='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r167-light-slots';
mkdirSync(evidence,{recursive:true});
const viewport=process.env.R167_VIEW||'desktop';
const mobile=viewport==='mobile';
const order=(process.env.R167_ORDER||'baseline,slots2,slots4').split(',');
const cpu=Number(process.env.R167_CPU|| (mobile?3:2));
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage',
 '--autoplay-policy=no-user-gesture-required']});
const report={started:new Date().toISOString(),order,viewport,cpu,
 device:'Z890 NVIDIA RTX5070Ti; mobile means viewport emulation, not phone GPU',
 experiments:[]};
async function sampling(page,count=125){
 return page.evaluate(async count=>{
  const f=document.querySelector('#stadium').contentWindow;
  const dt=[];
  await new Promise(done=>{
   let last=0;
   const step=now=>{
    if(last)dt.push(now-last);
    last=now;
    if(dt.length<count)f.requestAnimationFrame(step);
    else done();
   };f.requestAnimationFrame(step);
  });
  dt.sort((a,b)=>a-b);
  const p=x=>+dt[Math.min(dt.length-1,Math.floor(dt.length*x))].toFixed(3);
  return {n:dt.length,p50:p(.5),p95:p(.95),p99:p(.99),max:p(1),
   over33:dt.filter(x=>x>33.33).length,over50:dt.filter(x=>x>50).length};
 },count);
}
try{
 for(const variant of order){
  const n=variant==='baseline'?0:Number(variant.replace('slots',''));
  if(![0,2,4].includes(n))throw Error('Invalid variant '+variant);
  const context=await browser.newContext({
   viewport:mobile?{width:430,height:900}:{width:1280,height:720},
   deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('requestfailed',r=>errors.push('NET '+r.url().slice(-95)+' '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-95))});
  const cdp=await context.newCDPSession(page);
  if(cpu>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
  const query=new URLSearchParams({qa:'1',seed:'167',r166ShaderProbe:'on',r167GpuBench:'on',
   r167LightSlots:String(n)});
  await page.goto('http://127.0.0.1:18667/r45-duel/?'+query,{
   waitUntil:'domcontentloaded',timeout:55000});
  let ready=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
   timeout:105000,polling:500});}
  catch(e){ready=false;errors.push('sceneReady '+String(e).slice(0,160))}
  let before=null,idle=null,casts=[],final=null;
  if(ready){
   before=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    f.__r167Tasks=[];
    const observer=new f.PerformanceObserver(list=>{
     for(const t of list.getEntries())f.__r167Tasks.push({
      started:+t.startTime.toFixed(2),duration:+t.duration.toFixed(2)});
    });observer.observe({entryTypes:['longtask']});
    f.__r167Observer=observer;
    q.r167ResetGpuTime();
    return{
     ready:q.ready,modelCount:f.__ASDC_LOAD_METRICS.modelsVerified,
     bytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
     cards:window.__r45QA.cardCount,
     source:q.sourceMatchesR22,cameraSafe:!q.r145ActionShot.enabled,
     lights:q.r166ShaderInfo,slots:q.r167SpellLightSlots
    };
   });
   idle=await sampling(page,125);
   const idleDetails=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    return {gpu:q.r167MainGpuTime,lighting:q.r166ShaderInfo,slots:q.r167SpellLightSlots};
   });
   idle.details=idleDetails;
   if(variant!=='baseline'){
    const expected=4+n;
    if(idleDetails.lighting.lights.point!==expected)errors.push(
     'Idle light count '+idleDetails.lighting.lights.point+' != '+expected);
   }
   await page.locator('#stadium').screenshot({path:resolve(evidence,
    'r167-'+viewport+'-'+variant+'-idle.png')});
   const effect=await page.evaluate(async()=>{
    const e=await import('/r45-duel/engine.mjs');return e.BY_ID.E06.effect;
   });
   await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow;
    const board={player:[{uid:'U16701',id:'T01',hp:9,attack:4,shield:0}],
     ai:[{uid:'U16702',id:'E03',hp:8,attack:4,shield:0}]};
    f.postMessage({type:'ASDC_R45_BOARD',units:board,
     player:['T01'],ai:['E03']},location.origin);
   });
   for(let k=0;k<2;k++){
    const serial=167011+k;
    const start=await page.evaluate(()=>{
     const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
     q.r167ResetGpuTime();
     return {programs:q.r166ShaderInfo.programs,lights:q.r166ShaderInfo.lights,
      played:q.magicArsenal.played,impact:q.spellImpact.played,
      tasks:f.__r167Tasks.length};
    });
    await page.evaluate(({serial,effect})=>{
     const f=document.querySelector('#stadium').contentWindow;
     f.postMessage({type:'ASDC_R81_SPELL_RESULT',serial,side:'player',
      card:'E06',effect,damage:1,directDamage:1,targetUids:['U16702']},location.origin);
    },{serial,effect});
    await page.waitForFunction(({played,impact})=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return q.magicArsenal.played>played&&q.spellImpact.played>impact;
    },start,{timeout:9500});
    const active=await page.evaluate(()=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return{lighting:q.r166ShaderInfo,slots:q.r167SpellLightSlots};
    });
    const frame=await sampling(page,125);
    const after=await page.evaluate(start=>{
     const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
     return {shader:q.r166ShaderInfo,gpu:q.r167MainGpuTime,
      slots:q.r167SpellLightSlots,impacts:q.spellImpact,
      spells:q.magicArsenal,tasks:f.__r167Tasks.slice(start.tasks)};
    },start);
    casts.push({index:k,start,active,frame,after});
    if(k===0)await page.locator('#stadium').screenshot({path:resolve(evidence,
     'r167-'+viewport+'-'+variant+'-spell.png')});
    console.log('R167_LIGHT_SLOT_SPELL',JSON.stringify({
     viewport,variant,index:k,initialPrograms:start.programs,
     duringPrograms:active.lighting.programs,
     afterPrograms:after.shader.programs,
     activePointLights:active.lighting.lights.point,
     pool:after.slots,
     gpu:after.gpu,
     frame,
     largestLongTaskMs:Math.max(0,...after.tasks.map(t=>t.duration))}));
    await page.waitForTimeout(350);
   }
   await page.waitForTimeout(2200);
   final=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    return {slots:q.r167SpellLightSlots,lights:q.r166ShaderInfo,
     gpu:q.r167MainGpuTime,models:f.__ASDC_LOAD_METRICS.modelsVerified,
     cards:window.__r45QA.cardCount,
     source:q.sourceMatchesR22,cameraSafe:!q.r145ActionShot.enabled};
   });
  }
  const pass=ready&&errors.length===0&&before?.modelCount===16&&
   before.bytes===75569762&&before.cards===60&&before.source&&before.cameraSafe&&
   before.lights.lights.point===4+n&&idle.details.gpu.supported&&
   idle.details.gpu.n>=80&&casts.length===2&&
   casts.every(x=>x.after.gpu.n>=70)&&
   final?.models===16&&final.cards===60&&final.source&&final.cameraSafe&&
   (n===0?!before.slots.enabled:
    before.slots.slots===n&&before.slots.initialIntensityAllZero&&
    final.slots?.active===0&&final.slots?.initialIntensityAllZero);
  report.experiments.push({variant,n,pass,errors,before,idle,casts,final});
  console.log('R167_LIGHT_SLOT_CASE',JSON.stringify({viewport,variant,pass,
   errors,idleGpuP50Ms:idle?.details?.gpu?.p50,
   idleGpuP95Ms:idle?.details?.gpu?.p95,
   idleRafP95Ms:idle?.p95,
   programsAfter:final?.lights?.programs,
   slots:final?.slots}));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(evidence,'r167-'+viewport+'-'+order.join('-')+'.json'),
 JSON.stringify(report,null,2));
 await browser.close();
}
if(report.experiments.some(x=>!x.pass))process.exitCode=2;
