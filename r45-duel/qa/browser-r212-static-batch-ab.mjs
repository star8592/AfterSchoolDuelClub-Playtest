/** R212 real Chrome A/B for opt-in static stadium material batching.
 * Compare same stadium, spectator rigs, rule-card safety & screenshot.
 * rAF intervals are diagnostic, not authoritative GPU timings.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r212-perf-audit';mkdirSync(dir,{recursive:true});
const url='http://10.10.10.138:18693/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r210Elements=on&r211CinematicVfx=on';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={ok:false,type:'actual Z890 Chrome GPU controlled sequential A/B',errors:[],cases:[]};
try{
 for(const [name,flag] of [['baseline',''],['batched','&r212StadiumBatch=on']]){
  const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(name+' JS '+e.message));
  page.on('response',r=>{
   if(r.status()>=400&&r.url().includes(':18693/'))
    report.errors.push(name+' HTTP '+r.status()+' '+r.url());
  });
  const started=Date.now();
  await page.goto(url+flag,{waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
  await page.waitForTimeout(520);
  const data=await page.evaluate(async()=>{
   const z=document.getElementById('stadium').contentWindow.__r45SceneQA;
   const audit=z.auditRenderTree(),stadium=z.stadium,
    audience=z.stadiumAmbience?.audience,seatBanks=z.stadiumSeatBanks;
   const drawBefore=z.drawCalls;
   let last=null,intervals=[];
   for(let i=0;i<80;i++){
    const now=await new Promise(resolve=>requestAnimationFrame(resolve));
    if(last!==null)intervals.push(now-last);last=now;
   }
   intervals.sort((a,b)=>a-b);
   return {audit,stadium,audience,seatBanks,drawBefore,
    batch:z.r212StadiumBatch,drawAfter:z.drawCalls,
    meanIntervalMs:intervals.reduce((a,b)=>a+b,0)/intervals.length,
    p95IntervalMs:intervals[Math.ceil(intervals.length*.95)-1],
    p99IntervalMs:intervals[Math.ceil(intervals.length*.99)-1],
    observedFrameCount:intervals.length};
  });
  const record={name,loadMs:Date.now()-started,
   drawCalls:data.drawAfter,visibleMeshes:data.audit.visibleMeshes,
   stadiumMeshes:data.audit.groups.find(g=>g.name==='R45_Real_3D_Stadium')?.visibleMeshes,
   permanentHostMeshes:data.audit.groups.filter(g=>g.name.startsWith('R74_PERMANENT')).map(g=>g.visibleMeshes),
   auditorium:data.audit.stadiumBranches.find(g=>g.name==='R114_RealStudentGallery')?.meshes,
   realAudience:data.audience?.loaded,seatBanks:data.seatBanks,
   r212Batch:data.batch,
   frameSamples:data.observedFrameCount,
   meanIntervalMs:+data.meanIntervalMs.toFixed(2),
   p95IntervalMs:+data.p95IntervalMs.toFixed(2),
   p99IntervalMs:+data.p99IntervalMs.toFixed(2)};
  await page.screenshot({path:dir+'/r212-'+name+'-real-gpu.png'});
  report.cases.push(record);
  await ctx.close();
 }
 const [before,after]=report.cases;
 assert.equal(before.r212Batch.enabled,false);
 assert.equal(after.r212Batch.enabled,true);
 assert(after.r212Batch.stats.theoreticalCallsSaved>=20);
 assert.equal(before.auditorium,after.auditorium);
 assert.equal(before.realAudience,after.realAudience);
 assert.deepEqual(before.permanentHostMeshes,after.permanentHostMeshes);
 assert.deepEqual(before.seatBanks,after.seatBanks);
 assert(after.drawCalls<before.drawCalls);
 assert.deepEqual(report.errors,[]);
 report.ok=true;
}catch(e){report.failure=String(e);console.error('R212_BATCH_QA_FAILURE',String(e))}
finally{
 await browser.close();
 writeFileSync(dir+'/r212-z890-real-chrome-static-batch-ab.json',JSON.stringify(report,null,2)+'\n');
 console.log('R212_BATCH_QA',JSON.stringify(report).slice(0,15000));
}
if(!report.ok)process.exitCode=7;
