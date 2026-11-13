import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11113';
const out=resolve(import.meta.dirname,'evidence/r113-dance');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const ok=(flag,label,detail)=>{report.checks.push({passed:!!flag,label,detail});
 if(!flag)throw Error(label+' '+JSON.stringify(detail).slice(0,500))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=113',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:160000});
  const units={player:[
   {uid:'U110',id:'M02',hp:4,attack:3,shield:0},
   {uid:'U111',id:'E03',hp:4,attack:3,shield:0},
   {uid:'U112',id:'T03',hp:4,attack:3,shield:0}],
   ai:[{uid:'U210',id:'G02',hp:4,attack:3,shield:0},
    {uid:'U211',id:'G04',hp:4,attack:3,shield:0}]};
  await page.evaluate(u=>{
   const f=document.querySelector('#stadium').contentWindow;
   f.postMessage({type:'ASDC_R45_BOARD',units:u,
    player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin);
  },units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===5,null,{timeout:25000});
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R112_VICTORY',winner:'player'},location.origin));
  const read=()=>page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {host:q.duelistHosts,groups:q.summonPresence,celebration:q.livingCast.celebration};
  });
  const timeline=[],pauses=[.72,.85,1.4,1.35,1.5];
  for(const [i,delay] of pauses.entries()){
   await page.waitForTimeout(Math.round(delay*1000));
   const state=await read();
   const stages=state.groups.r113DanceStages;
   timeline.push({stages,hosts:state.host.map(h=>h.posture.livingBeat)});
   ok(stages.length===5,view+' five real participants at frame '+i,stages);
   ok(state.host.every(h=>h.posture.ik.R?.error<.3&&h.posture.ik.L?.error<.3),
     view+' hands remain IK-controlled',state.host.map(h=>h.posture.ik));
   if(i===2||i===4){
    await page.screenshot({path:resolve(out,view+'-dance-stage-'+i+'.png')});
   }
  }
  const stepSet=new Set(timeline.flatMap(x=>x.stages.map(s=>s.stage)));
  ok(stepSet.has('stomp')&&stepSet.has('side_step')&&stepSet.has('crowd_clap')&&stepSet.has('final_pose'),
   view+' differentiated 4 observed dance stages',[...stepSet]);
  const last=await read();
  ok(last.groups.entries.every(u=>u.metrics.frontDot>.93),
    view+' even the dance keeps facing opponent',last.groups.entries.map(u=>({id:u.id,dot:u.metrics.frontDot})));
  ok(errors.length===0,view+' zero JS/HTTP errors',errors);
  report.views.push({view,timeline});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r113-dance-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R113_DANCE_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
