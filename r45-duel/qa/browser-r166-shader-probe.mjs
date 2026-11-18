import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r166-shaders';
mkdirSync(out,{recursive:true});
const order=(process.env.R166_ORDER||'baseline,prewarm4,prewarm8').split(',');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const report={started:new Date().toISOString(),order,device:'Z890 RTX5070Ti Chrome Vulkan',cases:[]};
async function takeRAF(page,n){
 return page.evaluate(async count=>{
  const w=document.querySelector('#stadium').contentWindow,values=[];
  await new Promise(done=>{
   let prev=0;const cb=t=>{
    if(prev)values.push(t-prev);
    prev=t;
    if(values.length<count)w.requestAnimationFrame(cb);else done();
   };w.requestAnimationFrame(cb);
  });
  const s=[...values].sort((a,b)=>a-b);
  return {n:s.length,p50:+s[Math.floor(s.length*.5)].toFixed(3),
   p95:+s[Math.floor(s.length*.95)].toFixed(3),
   p99:+s[Math.min(s.length-1,Math.floor(s.length*.99))].toFixed(3),
   max:+s.at(-1).toFixed(3),
   over33:values.filter(x=>x>33.33).length,
   over50:values.filter(x=>x>50).length};
 },n);
}
try{
 for(const variant of order){
  const count=variant==='baseline'?0:Number(variant.replace('prewarm',''));
  const context=await browser.newContext({
   viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-100))});
  const cdp=await context.newCDPSession(page);
  const throttle=Number(process.env.R166_CPU_RATE||2);
  if(throttle>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:throttle});
  await page.goto('http://127.0.0.1:18666/r45-duel/?qa=1&seed=166&r166ShaderProbe=on',
    {waitUntil:'domcontentloaded',timeout:60000});
  let ready=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
   {timeout:100000,polling:450})}
  catch(e){ready=false;errors.push(String(e).slice(0,160))}
  let warmup=null,base=null,final=null;
  const spells=[];
  if(ready){
   await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow;
    f.__r166LongTasks=[];
    const observer=new f.PerformanceObserver(list=>{
     for(const e of list.getEntries())f.__r166LongTasks.push({
      start:+e.startTime.toFixed(2),duration:+e.duration.toFixed(2)});
    });observer.observe({entryTypes:['longtask']});
    f.__r166Observer=observer;
   });
   base=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    return{programs:q.r166ShaderInfo,models:f.__ASDC_LOAD_METRICS.modelsVerified,
     bytes:f.__ASDC_LOAD_METRICS.downloadedBytes,cards:window.__r45QA.cardCount};
   });
   if(count){
    warmup=await page.evaluate(c=>document.querySelector('#stadium')
      .contentWindow.__r45SceneQA.r166PrewarmPointLightVariants(c),count);
   }
   await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow;
    const board={player:[{uid:'U16601',id:'T01',hp:9,attack:4,shield:0}],
     ai:[{uid:'U16602',id:'E03',hp:8,attack:4,shield:0}]};
    f.postMessage({type:'ASDC_R45_BOARD',units:board,player:['T01'],ai:['E03']},location.origin);
   });
   const id='E06';
   const cardEffect=await page.evaluate(async id=>
    (await import('/r45-duel/engine.mjs')).BY_ID[id].effect,id);
   for(let repeat=0;repeat<2;repeat++){
    const serial=166001+repeat;
    const before=await page.evaluate(()=>{
     const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
     return {programs:q.r166ShaderInfo,played:q.magicArsenal.played,
      impact:q.spellImpact.played,longtasks:f.__r166LongTasks.length};
    });
    await page.evaluate(({serial,id,effect})=>{
     const f=document.querySelector('#stadium').contentWindow;
     f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',serial,card:id,
      effect,damage:1,directDamage:1,targetUids:['U16602']},location.origin);
    },{serial,id,effect:cardEffect});
    await page.waitForFunction(before=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return q.magicArsenal.played>before.played&&q.spellImpact.played>before.impact;
    },before,{timeout:9500});
    const during=await page.evaluate(()=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.r166ShaderInfo);
    const frame=await takeRAF(page,100);
    const after=await page.evaluate(before=>{
     const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
     return{programs:q.r166ShaderInfo,
      tasks:f.__r166LongTasks.slice(before.longtasks)};
    },before);
    const sample={repeat,before,during,after,frame};
    spells.push(sample);
    console.log('R166_SHADERS_CAST',JSON.stringify({variant,repeat,
     programBefore:before.programs.programs,
     programDuring:during.programs,
     programAfter:after.programs.programs,
     lightBefore:before.programs.lights,
     lightDuring:during.lights,
     p95:frame.p95,p99:frame.p99,
     maxLongTaskMs:Math.max(0,...after.tasks.map(x=>x.duration)),
     longTasks:after.tasks.length}));
    await page.waitForTimeout(330);
   }
   final=await page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{shader:q.r166ShaderInfo,modelIdentity:q.sourceMatchesR22,
     cameraSafe:!q.r145ActionShot.enabled,spells:q.magicArsenal.played};
   });
  }
  const pass=ready&&errors.length===0&&base?.models===16&&
   base?.bytes===75569762&&base?.cards===60&&
   spells.length===2&&final?.modelIdentity&&final?.cameraSafe&&
   final?.spells>=2&&
   (count===0||warmup?.count===count&&Number.isFinite(warmup?.compileBlockingMs));
  report.cases.push({variant,pass,count,errors,base,warmup,spells,final});
  console.log('R166_SHADER_PROFILE_CASE',JSON.stringify({
   variant,pass,count,warmupMs:warmup?.compileBlockingMs,
   programsInitial:base?.programs?.programs,
   programsFinal:final?.shader?.programs,errors}));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(out,'r166-'+order.join('-')+'.json'),JSON.stringify(report,null,2));
 await browser.close();
}
if(report.cases.some(c=>!c.pass))process.exitCode=2;
