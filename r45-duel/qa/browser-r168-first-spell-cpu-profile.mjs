/**
 * CPU hotspot profiler for unmodified R147 real duel scene, WITHOUT
 * experimental R161-R167 overlays. Samples separately the first vs repeated
 * E06 spell. Never presents CPU profiling as GPU cost.
 */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ROOT='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r168-cpu-profile';
mkdirSync(ROOT,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const profileTime=(profile)=>{
 const byId=new Map(profile.nodes.map(x=>[x.id,x]));
 const count=new Map();
 for(let i=0;i<(profile.samples?.length||0);i++){
  const id=profile.samples[i],ns=profile.timeDeltas?.[i]||1000;
  count.set(id,(count.get(id)||0)+ns);
 }
 const totalUs=[...count.values()].reduce((a,b)=>a+b,0);
 const records=[...count].map(([id,us])=>{
  const n=byId.get(id);
  return {id,function:n?.callFrame?.functionName||'(unknown)',
   url:n?.callFrame?.url||'',
   line:n?.callFrame?.lineNumber??-1,
   selfMs:+(us/1000).toFixed(3),
   selfPct:+(us/totalUs*100).toFixed(2)};
 }).sort((a,b)=>b.selfMs-a.selfMs);
 return {samples:profile.samples?.length||0,totalSampledMs:+(totalUs/1000).toFixed(2),
  top:records.slice(0,45),
  topGame:records.filter(x=>x.url.includes('/r45-duel/')).slice(0,45)};
};
async function raf(page,n=85){
 return page.evaluate(async n=>{
  const w=document.querySelector('#stadium').contentWindow,all=[];
  await new Promise(done=>{
   let last=0;const tick=t=>{
    if(last)all.push(t-last);last=t;
    if(all.length<n)w.requestAnimationFrame(tick);else done();
   };w.requestAnimationFrame(tick);
  });
  all.sort((a,b)=>a-b);
  return {n:all.length,p50:+all[Math.floor(all.length*.5)].toFixed(3),
   p95:+all[Math.floor(all.length*.95)].toFixed(3),
   p99:+all[Math.floor(all.length*.99)].toFixed(3),
   max:+all.at(-1).toFixed(3)};
 },n);
}
const serverPort=Number(process.env.R168_SERVER_PORT||18669);
const skipDiagnostics=process.env.R168_DIAGNOSTICS==='off';
const warmup=process.env.R168_WARMUP==='E06';
const warmupMethod=process.env.R168_WARMUP_METHOD||'compile';
const tag=process.env.R168_TAG||(skipDiagnostics?'disabled':'default');
const report={serverPort,skipDiagnostics,warmup,warmupMethod,tag,date:new Date().toISOString(),
 source:'UNMODIFIED R147 source + real model bytes',
 browser:'Z890 Chrome Vulkan RTX5070Ti',cases:[],errors:[]};
try{
 const context=await browser.newContext({viewport:{width:1280,height:720},
  deviceScaleFactor:1,serviceWorkers:'block'});
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url().slice(-85))});
 const cdp=await context.newCDPSession(page);
 await cdp.send('Profiler.enable');
 await cdp.send('Profiler.setSamplingInterval',{interval:1000});
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.R168_CPU||2)});
 await page.goto('http://127.0.0.1:'+serverPort+
   '/r45-duel/?qa=1&seed=168&r168ShaderDiagnostics='+
   (skipDiagnostics?'off':'on'),
  {waitUntil:'domcontentloaded',timeout:55000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
  timeout:100000,polling:400});
 report.assets=await page.evaluate(()=>{
  const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
  f.__r168LongTasks=[];
  const observer=new f.PerformanceObserver(list=>{
   for(const e of list.getEntries())f.__r168LongTasks.push({
    started:+e.startTime.toFixed(2),duration:+e.duration.toFixed(2)});
  });
  observer.observe({entryTypes:['longtask']});f.__r168LongTasksObserver=observer;
  return{shaderMode:q.r168ShaderDiagnostics,models:f.__ASDC_LOAD_METRICS.modelsVerified,
   bytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
   cards:window.__r45QA.cardCount,
   sourceVerified:q.sourceMatchesR22,
   cameraSafe:!q.r145ActionShot.enabled};
 });
 if(report.assets.models!==16||report.assets.cards!==60||
  report.assets.bytes!==75569762||!report.assets.sourceVerified)
  throw Error('R147 asset identity invalid '+JSON.stringify(report.assets));
 if(warmup){
  report.warmup=await page.evaluate(method=>document.querySelector('#stadium')
   .contentWindow.__r45SceneQA.r168WarmupActualE06(method),warmupMethod);
  console.log('R168_ACTUAL_PREWARM',JSON.stringify(report.warmup));
 }
 const effect=await page.evaluate(async()=>
  (await import('/r45-duel/engine.mjs')).BY_ID.E06.effect);
 await page.evaluate(()=>{
  const f=document.querySelector('#stadium').contentWindow;
  f.postMessage({type:'ASDC_R45_BOARD',units:{
   player:[{uid:'U16801',id:'T01',hp:9,attack:4,shield:0}],
   ai:[{uid:'U16802',id:'E03',hp:8,attack:4,shield:0}]
  },player:['T01'],ai:['E03']},location.origin);
 });
 for(let i=0;i<2;i++){
  const serial=168001+i;
  const before=await page.evaluate(()=>{
   const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
   return {played:q.magicArsenal.played,impact:q.spellImpact.played,
    taskCount:f.__r168LongTasks.length,
    timestamp:f.performance.now()};
  });
  await cdp.send('Profiler.start');
  await page.evaluate(({serial,effect})=>{
   const f=document.querySelector('#stadium').contentWindow;
   f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',
    serial,card:'E06',effect,damage:1,directDamage:1,targetUids:['U16802']},location.origin);
  },{serial,effect});
  await page.waitForFunction(before=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return q.magicArsenal.played>before.played&&q.spellImpact.played>before.impact;
  },before,{timeout:12000});
  const frame=await raf(page,90);
  const {profile}=await cdp.send('Profiler.stop');
  const finished=await page.evaluate(before=>{
   const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
   return {tasks:f.__r168LongTasks.slice(before.taskCount),
    spells:q.magicArsenal.played,impact:q.spellImpact.played};
  },before);
  const summarized=profileTime(profile);
  const row={index:i,serial,first:i===0,frame,
   profile:summarized,finished};
  report.cases.push(row);
  writeFileSync(resolve(ROOT,'r168-CPU-'+tag+'-'+(i===0?'first':'repeat')+'.cpuprofile'),
   JSON.stringify(profile));
  console.log('R168_REAL_CPU_PROFILE',JSON.stringify({
   first:i===0,p95:frame.p95,p99:frame.p99,
   maxLongTaskMs:Math.max(0,...finished.tasks.map(x=>x.duration)),
   profile:summarized.top.slice(0,12),
   gameHotspots:summarized.topGame.slice(0,14)}));
  await page.waitForTimeout(1100);
 }
 report.shaderLinkAudit=await page.evaluate(()=>{
  const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return q.r168ShaderLinkAudit();
 });
 if(!report.shaderLinkAudit.passed)report.errors.push('Shader link validation failed');
 await page.close();await context.close();
}finally{
 writeFileSync(resolve(ROOT,'r168-cpu-profile-'+tag+'.json'),JSON.stringify(report,null,2));
 await browser.close();
}
if(report.errors.length||report.cases.length!==2)process.exitCode=2;
