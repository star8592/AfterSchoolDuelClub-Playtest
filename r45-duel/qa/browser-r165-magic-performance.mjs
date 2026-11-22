/**
 * R165: local original game spell cold-start / repeated-cast profile.
 * Real R147 character GLBs, original card logic and shaders; only this
 * branch's two explicit QA switches change visual motifs/geometry reuse.
 */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r165-magic-combat';
mkdirSync(root,{recursive:true});
const modes=(process.env.R165_PERF_ORDER||'original,optimized').split(',');
const device=process.env.R165_PERF_DEVICE||'desktop';
const mobile=device==='mobile';
const cpuRate=Number(process.env.R165_PERF_CPU_RATE||(mobile?'3':'2'));
const cards=(process.env.R165_PERF_CARDS||'S04,P04,E06,Q01').split(',');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const report={date:new Date().toISOString(),device,cpuRate,modes,cards,experiments:[]};
function percentiles(v){
 if(!v.length)return {n:0};
 const s=[...v].sort((a,b)=>a-b);
 return {n:s.length,p50:+s[Math.floor((s.length-1)*.5)].toFixed(2),
  p95:+s[Math.floor((s.length-1)*.95)].toFixed(2),
  p99:+s[Math.floor((s.length-1)*.99)].toFixed(2),
  over33:v.filter(x=>x>33.33).length,
  over50:v.filter(x=>x>50).length,
  max:+s.at(-1).toFixed(2)};
}
async function raf(page,n){
 return page.evaluate(async n=>{
  const w=document.querySelector('#stadium').contentWindow;
  const d=[];
  await new Promise(resolve=>{
   let prev=0;
   const step=now=>{
    if(prev)d.push(now-prev);
    prev=now;
    if(d.length<n)w.requestAnimationFrame(step);
    else resolve();
   };
   w.requestAnimationFrame(step);
  });
  return d;
 },n);
}
try{
 for(const variant of modes){
  const optimized=variant==='optimized',varietyOnly=variant==='varietyOnly',errors=[];
  const ctx=await browser.newContext({
   viewport:mobile?{width:430,height:900}:{width:1280,height:720},
   deviceScaleFactor:mobile?2:1,hasTouch:mobile,isMobile:mobile,
   serviceWorkers:'block'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-90))});
  const cdp=await ctx.newCDPSession(page);
  if(cpuRate>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
  await cdp.send('Performance.enable');
  await page.goto('http://127.0.0.1:18665/r45-duel/?qa=1&seed=165'+
   ((optimized||varietyOnly)?'&r163MagicVariety=on'+(optimized?'&r163MagicPool=on':''):''),{
   waitUntil:'domcontentloaded',timeout:60000});
  let ready=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
   {timeout:100000,polling:500})}
  catch(e){ready=false;errors.push('sceneReady '+String(e).slice(0,160))}
  const casts=[];
  if(ready){
   await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow;
    f.__r165Tasks=[];
    const observer=new f.PerformanceObserver(list=>{
     for(const e of list.getEntries())f.__r165Tasks.push({
      start:+e.startTime.toFixed(3),duration:+e.duration.toFixed(3)});
    });
    observer.observe({entryTypes:['longtask']});
    f.__r165TaskObserver=observer;
   });
   const m=await page.evaluate(async cards=>{
    const e=await import('/r45-duel/engine.mjs');
    const f=document.querySelector('#stadium').contentWindow;
    const board={player:[{uid:'U16511',id:'T01',hp:9,attack:4,shield:0}],
     ai:[{uid:'U16512',id:'E03',hp:8,attack:4,shield:0}]};
    f.postMessage({type:'ASDC_R45_BOARD',units:board,player:['T01'],ai:['E03']},location.origin);
    return Object.fromEntries(cards.map(id=>[id,e.BY_ID[id].effect]));
   },cards);
   let serial=165100;
   for(let repeat=0;repeat<2;repeat++){
    for(const card of cards){
     serial++;
     const before=await page.evaluate(()=>{
      const f=document.querySelector('#stadium').contentWindow;
      return {played:f.__r45SceneQA.magicArsenal.played,
       taskCount:f.__r165Tasks.length,
       t:f.performance.now()};
     });
     await page.evaluate(({serial,card,effect})=>{
      const f=document.querySelector('#stadium').contentWindow;
      f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',serial,
       card,effect,damage:1,directDamage:1,targetUids:['U16512']},location.origin);
     },{serial,card,effect:m[card]});
     await page.waitForFunction(before=>{
      const f=document.querySelector('#stadium').contentWindow;
      return f.__r45SceneQA.magicArsenal.played>before.played;
     },before,{timeout:9000});
     const samples=await raf(page,70);
     const after=await page.evaluate(before=>{
      const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
      const tasks=f.__r165Tasks.slice(before.taskCount);
      return{
       tasks,
       magic:q.magicArsenal,
       impact:q.spellImpact,
       draws:q.drawCalls,
       latestAnimationFrameMS:f.performance.now()-before.t
      };
     },before);
     const item={card,serial,repeat,raf:percentiles(samples),
      tasks:after.tasks,cacheHits:after.magic.geometryCacheHits,
      cached:after.magic.cachedGeometries,
      drawCalls:after.draws,played:after.magic.played};
     casts.push(item);
     console.log('R165_CAST_PERFORMANCE',JSON.stringify({
      variant,card,repeat,raf:item.raf,
      maxLongTaskMs:Math.max(0,...after.tasks.map(t=>t.duration)),
      longTaskCount:after.tasks.length,drawCalls:item.drawCalls,
      poolHits:item.cacheHits}));
    }
   }
  }
  const exit=await page.evaluate(()=>{
   const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
   return{
    assets:f.__ASDC_LOAD_METRICS.modelsVerified,
    assetBytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
    cards:window.__r45QA.cardCount,source:q.sourceMatchesR22,
    cameraSafe:!q.r145ActionShot.enabled,magic:q.magicArsenal};
  }).catch(()=>null);
  const pass=ready&&errors.length===0&&exit?.assets===16&&
   exit.assetBytes===75569762&&exit.cards===60&&exit.source&&
   exit.cameraSafe&&casts.length===cards.length*2&&
   exit.magic.poolEnabled===optimized;
  report.experiments.push({variant,pass,errors,casts,final:exit});
  console.log('R165_PERF_CASE',JSON.stringify({variant,pass,
   casts:casts.length,cacheHits:exit?.magic?.geometryCacheHits,errors}));
  await page.close();await ctx.close();
 }
}finally{
 writeFileSync(resolve(root,'r165-perf-'+device+'-'+modes.join('-')+'.json'),
  JSON.stringify(report,null,2));
 await browser.close();
}
if(report.experiments.some(x=>!x.pass))process.exitCode=2;
