/** Assert real fights interrupt comedy without blocking source attack/hit/idle. */
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10996';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const reports=[];
try{
 for(const [view,w,h] of [['wide',1600,900],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
  const data=await p.evaluate(async()=>{
   const f=document.querySelector('#stadium').contentWindow;
   const pre={player:[{id:'G02',uid:'U101',hp:6,attack:2,shield:0}],ai:[{id:'G02',uid:'U201',hp:6,attack:2,shield:0}]};
   const post=structuredClone(pre);
   f.postMessage({type:'ASDC_R45_BOARD',player:['G02'],ai:['G02'],units:pre},location.origin);
   const get=()=>({combat:f.__r45SceneQA.combatEvents,
    actors:f.__r45SceneQA.summonPresence.entries.filter(e=>e.id==='G02').map(e=>({
     side:e.side,uid:e.uid,clip:e.motion?.clip,acting:e.motion?.acting,
     pose:e.motion?.posture?.weight,front:e.metrics.frontDot,within:e.metrics.withinFrame}))});
   let triggered=false;
   for(let k=0;k<85;k++){
    await new Promise(r=>setTimeout(r,110));
    if(get().actors.some(a=>a.acting.gestureActive)){triggered=true;break}
   }
   const before=get();
   if(!triggered)return {triggered:false,before};
   const events=[{type:'exchange',side:'player',from:'G02',to:'G02',attacker_uid:'U101',target_uid:'U201',damage:1,serial:987660}];
   f.postMessage({type:'ASDC_R51_COMBAT_EVENTS',events,pre,post},location.origin);
   const seen=[];
   for(let k=0;k<26;k++){
    await new Promise(r=>setTimeout(r,85));
    seen.push(get());
   }
   return {triggered:true,before,seen,after:get()};
  });
  const attacks=data.seen?.some(s=>s.actors.some(x=>x.clip==='Attack'));
  const hits=data.seen?.some(s=>s.actors.some(x=>x.clip==='Hit'));
  const complete=data.after?.combat.finishedSequences>=1&&data.after?.combat.active===false;
  const reset=data.after?.actors.every(x=>x.clip==='Idle'&&x.pose>.95&&!x.acting.gestureActive);
  const facing=data.after?.actors.every(x=>x.front>.98&&x.within);
  const pass=!!(data.triggered&&attacks&&hits&&complete&&reset&&facing&&!errors.length);
  const row={view,pass,triggered:data.triggered,attacks,hits,complete,reset,facing,errors,
   initialActing:data.before?.actors.map(x=>x.acting),final:data.after?.actors};
  reports.push(row);console.log('R66_GESTURE_INTERRUPTED_BY_ATTACK',JSON.stringify(row));
  await p.close();
 }
}finally{writeFileSync(resolve(import.meta.dirname,'evidence/r66/combat-interrupt-results.json'),JSON.stringify(reports,null,2)+'\n');await browser.close()}
if(reports.length!==2||reports.some(x=>!x.pass))process.exitCode=3;
