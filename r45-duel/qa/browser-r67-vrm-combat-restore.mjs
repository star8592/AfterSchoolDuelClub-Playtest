/** R67 source VRM: smile/blink & gestures never override real combat, pool reuse resets. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10997';
const out=resolve(import.meta.dirname,'evidence/r67');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const reports=[];
try{
 for(const [view,w,h] of [['wide',1600,900],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await p.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
  const details=await p.evaluate(async()=>{
   const f=document.querySelector('#stadium').contentWindow;
   const units={player:[{id:'E01',uid:'U101',hp:6,attack:2,shield:0}],ai:[{id:'G01',uid:'U201',hp:6,attack:2,shield:0}]};
   f.postMessage({type:'ASDC_R45_BOARD',player:['E01'],ai:['G01'],units},location.origin);
   const read=()=>({combat:f.__r45SceneQA.combatEvents,
    actors:f.__r45SceneQA.summonPresence.entries.filter(x=>['E01','G01'].includes(x.id)).map(x=>({
     id:x.id,uid:x.uid,side:x.side,front:x.metrics.frontDot,within:x.metrics.withinFrame,
     expression:x.vrmActing?.actualExpression,blink:x.vrmActing?.actualBlink,
     mode:x.vrmActing?.mode,amount:x.vrmActing?.amount,
     arms:x.vrmPosture
    }))});
   const samples=[];let expressive=false;
   for(let k=0;k<110;k++){
    await new Promise(r=>setTimeout(r,72));const s=read();
    if(s.actors.some(x=>x.amount>.4)){expressive=true;samples.push(s);break}
   }
   const pre=structuredClone(units),post=structuredClone(units);
   const events=[{type:'exchange',side:'player',from:'E01',to:'G01',attacker_uid:'U101',target_uid:'U201',damage:1,serial:99067}];
   f.postMessage({type:'ASDC_R51_COMBAT_EVENTS',events,pre,post},location.origin);
   for(let k=0;k<34;k++){
    await new Promise(r=>setTimeout(r,70));samples.push(read());
   }
   const finished=read();
   f.postMessage({type:'ASDC_R45_BOARD',player:[],ai:[],units:{player:[],ai:[]}},location.origin);
   await new Promise(r=>setTimeout(r,120));
   const recycled={player:[{id:'E01',uid:'U111',hp:6,attack:2,shield:0}],ai:[{id:'G01',uid:'U211',hp:6,attack:2,shield:0}]};
   f.postMessage({type:'ASDC_R45_BOARD',player:['E01'],ai:['G01'],units:recycled},location.origin);
   await new Promise(r=>setTimeout(r,650));
   return{expressive,samples,finished,recycled:read()};
  });
  const active=details.samples.flatMap(s=>s.actors),fighting=active.filter(x=>x.mode==='combat');
  const combatExpressionsNeutral=fighting.length>=2&&fighting.every(x=>x.expression<=.02);
  const finished=details.finished.combat.active===false&&details.finished.combat.finishedSequences>=1;
  const restored=details.recycled.actors.length===2&&details.recycled.actors.every(x=>
   x.front>.98&&x.within&&x.arms.length===2&&x.arms.every(a=>a.drop<-.15));
  const pass=details.expressive&&combatExpressionsNeutral&&finished&&restored&&!errors.length;
  const record={view,pass,expressive:details.expressive,combatFrames:fighting.length,
   combatExpressionsNeutral,finished,restored,recycled:details.recycled.actors,errors};
  reports.push(record);console.log('R67_VRM_COMBAT_AND_REUSE',JSON.stringify(record));
  await p.screenshot({path:resolve(out,`${view}-after-recycle.png`)});
  await p.close();
 }
}finally{writeFileSync(resolve(out,'combat-results.json'),JSON.stringify(reports,null,2)+'\n');await browser.close()}
if(reports.length!==2||reports.some(x=>!x.pass))process.exitCode=2;
