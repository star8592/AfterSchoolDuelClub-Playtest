/** R65 source skeleton: relaxed stance -> native attack/hit -> relaxed. */
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10995';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const results=[];
try{
 for(const [view,w,h] of [['wide',1600,900],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
  const trace=await p.evaluate(async()=>{
   const f=document.querySelector('#stadium').contentWindow;
   const pre={player:[{id:'G02',uid:'U101',hp:6,attack:2,shield:0}],ai:[{id:'G02',uid:'U201',hp:6,attack:2,shield:0}]};
   const post=structuredClone(pre);
   f.postMessage({type:'ASDC_R45_BOARD',player:['G02'],ai:['G02'],units:pre},location.origin);
   await new Promise(r=>setTimeout(r,370));
   const events=[{type:'exchange',side:'player',from:'G02',to:'G02',attacker_uid:'U101',target_uid:'U201',damage:1,serial:98765}];
   const t=[];
   const get=()=>{
    const q=f.__r45SceneQA;return{combat:q.combatEvents,
     actors:q.summonPresence.entries.filter(x=>x.id==='G02').map(x=>({side:x.side,drop:x.motion.posture.arms.map(a=>a.drop),weight:x.motion.posture.weight,clip:x.motion.clip,front:x.metrics.frontDot,withinFrame:x.metrics.withinFrame}))};
   };
   t.push(get());
   f.postMessage({type:'ASDC_R51_COMBAT_EVENTS',events,pre,post},location.origin);
   for(let k=0;k<29;k++){
    await new Promise(r=>setTimeout(r,75));
    t.push(get());
   }
   return t;
  });
  const ids=trace.flatMap(x=>x.actors),initial=trace[0]?.actors,last=trace.at(-1)?.actors;
  const relaxed=initial?.every(a=>a.weight>.95&&a.drop.every(d=>d<-.55));
  const combat=trace.some(x=>x.actors.some(a=>a.weight<.3&&['Attack','Hit'].includes(a.clip)));
  const restored=last?.every(a=>a.weight>.95&&a.drop.every(d=>d<-.55)&&a.clip==='Idle');
  const front=ids.every(a=>a.front>.98&&a.withinFrame);
  const pass=!!relaxed&&!!combat&&!!restored&&front&&!errors.length;
  results.push({view,pass,relaxed,combat,restored,front,errors,
   minWeight:Math.min(...ids.map(a=>a.weight)),endWeights:last?.map(a=>a.weight)});
  console.log('R65_POSE_TO_ATTACK_AND_BACK',JSON.stringify(results.at(-1)));
  await p.close();
 }
}finally{writeFileSync(resolve(import.meta.dirname,'evidence/r65/action-results.json'),JSON.stringify(results,null,2)+'\n');await browser.close()}
if(results.length!==2||results.some(r=>!r.pass))process.exitCode=3;
