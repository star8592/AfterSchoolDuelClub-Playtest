/** R65 GPU pose/arm-geometry acceptance: source bones, no mock actor proxies. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10995';
const out=resolve(import.meta.dirname,'evidence/r65');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer','--disable-dev-shm-usage']});
const batches=[['E03','E04','G02','G03','G04'],['T03','T04','G03','E03','G02']];
const all=[];
try{
 for(const [name,width,height] of [['wide',1600,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${r.url()}`)});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
  for(let b=0;b<batches.length;b++){
   const ids=batches[b];
   const snap=await page.evaluate(async ids=>{
    const f=document.querySelector('#stadium').contentWindow;
    const units=(side)=>ids.map((id,i)=>({id,uid:`U${side==='player'?11:21}${i}`,hp:6,attack:2,shield:0}));
    f.postMessage({type:'ASDC_R45_BOARD',player:ids,ai:ids,units:{player:units('player'),ai:units('ai')}},location.origin);
    await new Promise(r=>setTimeout(r,1150));
    return f.__r45SceneQA.summonPresence;
   },ids);
   const human=snap.entries.filter(e=>e.motion?.posture);
   const pass=human.length===10&&human.every(e=>
    e.motion.posture.weight>.95&&e.motion.posture.arms.length===2&&
    e.motion.posture.arms.every(a=>a.drop<-.55&&a.spread<.82)&&
    e.metrics.frontDot>.98&&e.metrics.withinFrame);
   const rec={name,batch:b,ids,pass,errors:[...errors],rows:human.map(e=>({id:e.id,side:e.side,
    pose:e.motion.posture,front:e.metrics.frontDot,withinFrame:e.metrics.withinFrame}))};
   all.push(rec);console.log('R65_NATURAL_IDLE_GATE',JSON.stringify({name,b,pass,humans:human.length,
    minDrop:Math.min(...human.flatMap(e=>e.motion.posture.arms.map(a=>a.drop))),
    maxDrop:Math.max(...human.flatMap(e=>e.motion.posture.arms.map(a=>a.drop))),
    maxSpread:Math.max(...human.flatMap(e=>e.motion.posture.arms.map(a=>a.spread))),errors}));
   await page.screenshot({path:resolve(out,`${name}-batch${b}.png`)});
  }
  await page.close();
 }
}finally{writeFileSync(resolve(out,'results.json'),JSON.stringify(all,null,2)+'\n');await browser.close()}
if(all.length!==4||all.some(x=>!x.pass||x.errors.length))process.exitCode=2;
