/**
 * Strict independent Chrome A/B on original game: old generic spectator
 * particles vs actual physical campus prop ricochet, including host cast,
 * real hit, and one spectator accident. No monkeypatch sampling disturbance.
 * R174 serial174001 is verified eligible for ricochet.
 */
import {createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const OUT='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r174-firstcast';
mkdirSync(OUT,{recursive:true});
const kinds=(process.env.R174_KINDS||'physical,legacy,off').split(',');
const repeats=Number(process.env.R174_REPEATS||2);
const cpu=Number(process.env.R174_CPU||2);
const output={date:new Date().toISOString(),hardware:'Z890 RTX5070Ti Chrome Vulkan, CPU slowdown '+cpu,
 modelQuality:'Full original 16 models 75,569,762 bytes and 60 cards; no reduced assets',
 cases:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const kind of kinds){
  for(let run=1;run<=repeats;run++){
   const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,
    serviceWorkers:'block'});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push('JS '+e.message));
   page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-90))});
   const cdp=await ctx.newCDPSession(page);
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
   const qp=new URLSearchParams({qa:'1',seed:'174',r169SchoolMagic:'on',
    r172BatchStatic:'on',r122Crowd:kind==='off'?'off':'on',
    r174Crowd:kind,r122CrowdQA:'1'});
   await page.goto('http://127.0.0.1:18675/r45-duel/?'+qp,
    {waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:110000,polling:300});
   const values=await page.evaluate(async()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    const init={models:f.__ASDC_LOAD_METRICS.modelsVerified,
     bytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
     cards:window.__r45QA.cardCount,
     noFloatingPortrait:q.r173NoFloatingPortrait,
     programs:q.r174RendererProgramCount};
    const before=q.r122AccidentReceipts,old=q.spectatorChaosFX?.launched||0;
    const raf=[],start=q.r174RendererProgramCount;
    const loop=new Promise(resolve=>{
     let last=0,n=0;
     const tick=t=>{
      if(last)raf.push(t-last);last=t;
      if(++n<135)f.requestAnimationFrame(tick);
      else resolve();
     };f.requestAnimationFrame(tick);
    });
    f.postMessage({type:'ASDC_R46_CARD_PLAY',side:'player',id:'E06',
     kind:'spell',serial:174001},location.origin);
    f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',
     card:'E06',serial:174001,effect:'blast',damage:1,directDamage:1,
     targetUids:['U17402']},location.origin);
    await loop;
    const sorted=raf.toSorted((a,b)=>a-b);
    const pct=p=>+sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))].toFixed(3);
    return{init,rAF:{p50:pct(.5),p95:pct(.95),p99:pct(.99),max:pct(1),
      over50:raf.filter(x=>x>50).length,over100:raf.filter(x=>x>100).length},
     shaderDelta:q.r174RendererProgramCount-start,
     crowdReceipts:q.r122AccidentReceipts-before,
     physicalProps:q.r169SchoolMagic.collateralLaunched,
     oldSpectatorFX:(q.spectatorChaosFX?.launched||0)-old,
     oldMagic:q.magicArsenal.played,
     actorHit:q.actualHostHits,
     cameraCutCount:q.r123Camera?.cuts??null,
     noFloatingPortrait:q.r173NoFloatingPortrait,
     magicPlayed:q.r169SchoolMagic.played};
   });
   const expected=kind==='physical'?values.physicalProps===1&&values.oldSpectatorFX===0:
    kind==='legacy'?values.physicalProps===0&&values.oldSpectatorFX>=1:
    values.physicalProps===0&&values.oldSpectatorFX===0;
   const pass=errors.length===0&&values.init.models===16&&
    values.init.bytes===75569762&&values.init.cards===60&&
    values.magicPlayed===1&&values.oldMagic===0&&
    values.noFloatingPortrait&&expected&&
    (kind==='off'?values.crowdReceipts===0:values.crowdReceipts===1)&&
    (kind==='physical'?values.cameraCutCount===0:true);
   const row={kind,run,pass,errors,...values};
   output.cases.push(row);
   console.log('R174_NO_HOOK_REAL_AB',JSON.stringify({kind,run,pass,
    maxMs:values.rAF.max,p99:values.rAF.p99,shaderDelta:values.shaderDelta,
    realPropToAudience:values.physicalProps,
    oldGlowingProjectile:values.oldSpectatorFX,
    actualAudienceReaction:values.crowdReceipts,
    oldMagic:values.oldMagic,cameraCutCount:values.cameraCutCount,errors}));
   await page.close();await ctx.close();
  }
 }
}finally{
 writeFileSync(resolve(OUT,'r174-real-full-cast-crowd-ab.json'),JSON.stringify(output,null,2));
 await browser.close();
}
if(output.cases.some(x=>!x.pass))process.exitCode=2;
