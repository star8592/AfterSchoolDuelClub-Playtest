/** R66 arena reality gate: source-authored and procedural character acting. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10996';
const dest=resolve(import.meta.dirname,'evidence/r66');mkdirSync(dest,{recursive:true});
const groups=[['E03','E04','G02','G03','G04'],['T03','T04','G02','E04','G03']];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer','--disable-dev-shm-usage']});
const results=[];
try{
 for(const [viewport,w,h] of [['wide',1600,900],['portrait',430,900]].filter(([name])=>!process.env.ASDC_R66_ONLY_VIEW||name===process.env.ASDC_R66_ONLY_VIEW)){
  const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
  for(const [batch,ids] of groups.entries()){
   const pendingMeasurements=page.evaluate(async({ids,batch})=>{
    const f=document.querySelector('#stadium').contentWindow;
    const units=(side)=>ids.map((id,i)=>({id,uid:`U${side==='player'?11:21}${i+batch*5}`,hp:7,attack:2,shield:0}));
    f.postMessage({type:'ASDC_R45_BOARD',player:ids,ai:ids,units:{player:units('player'),ai:units('ai')}},location.origin);
    await new Promise(r=>setTimeout(r,280));
    const samples=[];
    for(let i=0;i<75;i++){
     await new Promise(r=>setTimeout(r,155));
     const state=f.__r45SceneQA.summonPresence;
     samples.push({t:i*.155,entries:state.entries.map(e=>({id:e.id,side:e.side,
      clip:e.motion?.clip||null,gesture:e.motion?.posture?.gestureAmount||0,
      nativeCount:e.motion?.acting?.gestureCount||0,
      minY:e.metrics.minY,maxY:e.metrics.maxY,height:e.metrics.height,
      within:e.metrics.withinFrame,front:e.metrics.frontDot,
      poseWeight:e.motion?.posture?.weight||0}))});
    }
    return samples;
   },{ids,batch});
   // Capture an *actual* on-court acting moment, not only post-test idle.
   await page.waitForTimeout(batch===0?5580:6930);
   await page.screenshot({path:resolve(dest,`${viewport}-acting-moment-batch${batch}.png`)});
   const measurements=await pendingMeasurements;
   const grouped={};
   for(const [i,sample] of measurements.entries())for(const e of sample.entries){const key=e.id+':'+e.side;(grouped[key]??=[]).push({...e,t:Number((i*.155).toFixed(2))})}
   const cards=Object.entries(grouped).map(([key,rows])=>({key,
    maxGesture:Math.max(...rows.map(x=>x.gesture)),
    nativeCount:Math.max(...rows.map(x=>x.nativeCount)),
    clips:[...new Set(rows.map(x=>x.clip))],
    minGround:Math.min(...rows.map(x=>x.minY)),
    maxGround:Math.max(...rows.map(x=>x.minY)),
    maxHeight:Math.max(...rows.map(x=>x.height)),
    lowest:rows.reduce((a,b)=>a.minY<b.minY?a:b),
    highest:rows.reduce((a,b)=>a.minY>b.minY?a:b),
    inFrame:rows.every(x=>x.within),facing:rows.every(x=>x.front>.98)
   }));
   const expected={G02:'Scratch',G04:'Explain',T04:'Salute'};
   const gestures=cards.every(x=>expected[x.key.split(':')[0]]?
      x.nativeCount>=1&&x.clips.includes(expected[x.key.split(':')[0]]):x.maxGesture>.45);
   const frame=cards.every(x=>x.inFrame&&x.facing&&x.maxHeight<2.65);
   const ground=cards.every(x=>x.minGround>-.12&&x.maxGround<.13);
   const pass=gestures&&frame&&ground&&!errors.length&&cards.length===10;
   results.push({viewport,batch,pass,gestures,frame,ground,cards,errors:[...errors]});
   console.log('R66_ACTING_ARENA',JSON.stringify(results.at(-1)));
   await page.screenshot({path:resolve(dest,`${viewport}-acting-batch${batch}.png`)});
  }
  await page.close();
 }
}finally{writeFileSync(resolve(dest,'arena-results.json'),JSON.stringify(results,null,2)+'\n');await browser.close()}
if(results.length!==(process.env.ASDC_R66_ONLY_VIEW?2:4)||results.some(x=>!x.pass))process.exitCode=3;
