/** R67: each original VRM and duplicate must use independently animated real face meshes. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10997';
const out=resolve(import.meta.dirname,'evidence/r67');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer','--disable-dev-shm-usage']});
const all=[];
try{
 for(const [viewport,w,h] of [['wide',1600,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${r.url()}`)});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:80000});
  const snapshotsPromise=page.evaluate(async()=>{
   const f=document.querySelector('#stadium').contentWindow;
   const ids=['E01','G01','E01','G01'];
   const units=s=>ids.map((id,i)=>({id,uid:`U${s==='player'?1:2}${i}`,hp:8,attack:2,shield:0}));
   f.postMessage({type:'ASDC_R45_BOARD',player:ids,ai:ids,units:{player:units('player'),ai:units('ai')}},location.origin);
   await new Promise(r=>setTimeout(r,450));
   const samples=[];
   for(let i=0;i<86;i++){
    await new Promise(r=>setTimeout(r,120));
    samples.push(f.__r45SceneQA.summonPresence.entries.filter(x=>['E01','G01'].includes(x.id)).map(x=>({
     id:x.id,uid:x.uid,side:x.side,kind:x.kind,arms:x.vrmPosture,
     status:x.vrmActing,front:x.metrics.frontDot,within:x.metrics.withinFrame,
     h:x.metrics.height,ground:x.metrics.minY
    })));
   }
   return samples;
  });
  await page.waitForTimeout(6000);
  await page.screenshot({path:resolve(out,`${viewport}-personality.png`)});
  const samples=await snapshotsPromise;
  const individuals=new Map();
  for(const frame of samples)for(const v of frame){const key=v.side+':'+v.uid;
   if(!individuals.has(key))individuals.set(key,[]);individuals.get(key).push(v);
  }
  const rows=[...individuals].map(([key,frames])=>({key,id:frames[0].id,kind:frames[0].kind,
   gestures:frames.filter(x=>x.status?.amount>.5).length,
   blinks:frames.filter(x=>x.status?.actualBlink>.4).length,
   maxFace:Math.max(...frames.map(x=>x.status?.actualExpression||0)),
   faceMeshes:frames[0].status?.faceMeshes||0,
   front:frames.every(x=>x.front>.98),inFrame:frames.every(x=>x.within),
   armDroop:frames.every(x=>x.arms?.length===2&&x.arms.every(a=>a.drop<-.20)),
   hMax:Math.max(...frames.map(x=>x.h)),groundMin:Math.min(...frames.map(x=>x.ground))
  }));
  const pass=rows.length===8&&rows.every(x=>x.gestures>1&&x.blinks>0&&
   x.maxFace>.08&&x.faceMeshes>=2&&x.front&&x.inFrame&&x.armDroop)&&!errors.length;
  all.push({viewport,pass,rows,errors,samples:samples.length});
  console.log('R67_SOURCE_VRM_GESTURES',JSON.stringify(all.at(-1)));
  await page.close();
 }
}finally{writeFileSync(resolve(out,'vrm-expression-results.json'),JSON.stringify(all,null,2)+'\n');await browser.close()}
if(all.length!==2||all.some(x=>!x.pass))process.exitCode=3;
