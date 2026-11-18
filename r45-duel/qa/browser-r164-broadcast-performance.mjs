/**
 * Local-only R164 real-event A/B. Keeps all R147 3D models and original
 * artwork, compares old floating hero inset to in-world arena television.
 * CPU throttling is optional and never described as actual phone hardware.
 */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r164-stadium-broadcast';
mkdirSync(root,{recursive:true});
const device=process.env.R164_PERF_DEVICE||'desktop';
const mobile=device==='mobile';
const modes=(process.env.R164_PERF_ORDER||'off,on').split(',');
const cpuRate=Number(process.env.R164_PERF_CPU_RATE||(mobile?'3':'2'));
const captureMode=process.env.R164_CAPTURE_MODE||'sync';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const result={at:new Date().toISOString(),device,cpuRate,modes,captureMode,cases:[]};
const query='http://127.0.0.1:18664/r45-duel/?qa=1&seed=164&r164Broadcast=';
async function sample(page,n){
 return page.evaluate(async wanted=>{
  const w=document.querySelector('#stadium').contentWindow;
  const values=[];
  await new Promise(done=>{
   let prev=0;
   const onFrame=now=>{
    if(prev)values.push(now-prev);
    prev=now;
    if(values.length<wanted)w.requestAnimationFrame(onFrame);else done();
   };w.requestAnimationFrame(onFrame);
  });
  const sorted=[...values].sort((a,b)=>a-b);
  const p=k=>+sorted[Math.min(sorted.length-1,Math.floor(k*sorted.length))].toFixed(3);
  return{samples:values.length,p50:p(.5),p95:p(.95),p99:p(.99),
   over33:values.filter(v=>v>33.33).length,
   over50:values.filter(v=>v>50).length};
 },n);
}
try{
 for(const mode of modes){
  const enabled=mode==='on',errors=[];
  const context=await browser.newContext({
   viewport:mobile?{width:430,height:900}:{width:1280,height:720},
   deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,
   serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const cdp=await context.newCDPSession(page);
  if(cpuRate>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
  await page.goto(query+mode+'&r164Capture='+captureMode,{waitUntil:'domcontentloaded',timeout:55000});
  let ready=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
   {timeout:100000,polling:400});}
  catch(e){ready=false;errors.push('ready '+String(e).slice(0,170))}
  let idle=null,cast=null,hit=null,stats=null;
  if(ready){
   await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow;
    f.__r164LongTasks=[];
    const ob=new f.PerformanceObserver(list=>{
     for(const item of list.getEntries())f.__r164LongTasks.push({
      at:+item.startTime.toFixed(2),duration:+item.duration.toFixed(2)});
    });
    ob.observe({entryTypes:['longtask']});
    f.__r164LongTaskObserver=ob;
   });
   idle=await sample(page,42);
   await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow;
    const board={player:[{uid:'U16401',id:'T01',hp:9,attack:4,shield:0}],
     ai:[{uid:'U16402',id:'E03',hp:8,attack:4,shield:0}]};
    f.postMessage({type:'ASDC_R45_BOARD',units:board,player:['T01'],ai:['E03']},location.origin);
    f.postMessage({type:'ASDC_R46_CARD_PLAY',side:'player',serial:16401,id:'Q01',kind:'spell'},location.origin);
   });
   await page.waitForFunction(()=>{
    const f=document.querySelector('#stadium').contentWindow;
    return f.__r45SceneQA.duelistAction.player.kind==='spell';
   },null,{timeout:15000});
   cast=await sample(page,70);
   const effect=await page.evaluate(async()=>{
    const m=await import('/r45-duel/engine.mjs');
    return m.BY_ID.Q01.effect;
   });
   await page.evaluate(effect=>{
    const f=document.querySelector('#stadium').contentWindow;
    f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',
      serial:16401,card:'Q01',effect,damage:1,directDamage:1,
      targetUids:['U16402']},location.origin);
   },effect);
   await page.waitForFunction(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return q.spellImpact?.played>=1;
   },null,{timeout:12000});
   hit=await sample(page,70);
   stats=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    return {draw:q.drawCalls,heroInsetDraws:q.heroInsetDraws,
     portraitVisible:q.heroLens.visible,
     broadcast:q.stadiumBroadcast,
     cards:window.__r45QA.cardCount,
     verified:f.__ASDC_LOAD_METRICS.modelsVerified,
     bytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
     cameraSafe:!q.r145ActionShot.enabled,
     spells:q.spellImpact.played,
     longTasks:f.__r164LongTasks};
   });
  }
  const pass=ready&&errors.length===0&&stats?.cards===60&&
   stats?.verified===16&&stats?.bytes===75569762&&stats?.cameraSafe&&
   stats?.spells>=1&&(enabled?stats.broadcast?.casts>=1&&
    stats.broadcast.hits>=1&&stats.broadcast.renderedFrames>=3&&
    stats.broadcast.captureCpuP50Ms!=null&&!stats.portraitVisible:
    stats.broadcast?.enabled===false);
  result.cases.push({mode,pass,errors,idle,cast,hit,stats});
  console.log('R164_PERF_CASE',JSON.stringify({device,mode,captureMode,pass,
    idle,cast,hit,captureP50Ms:stats?.broadcast?.captureCpuP50Ms,
    captureP95Ms:stats?.broadcast?.captureCpuP95Ms,
    extraDraws:stats?.broadcast?.captureDrawsP50,
    longTaskCount:stats?.longTasks?.length,
    maxLongTaskMs:Math.max(0,...(stats?.longTasks||[]).map(x=>x.duration)),
    errors}));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(root,'r164-perf-'+device+'-'+modes.join('-')+'-'+captureMode+'.json'),
  JSON.stringify(result,null,2));
 await browser.close();
}
if(result.cases.some(x=>!x.pass))process.exitCode=2;
