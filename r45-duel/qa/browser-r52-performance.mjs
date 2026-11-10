import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10980';
const dir=resolve(import.meta.dirname,'evidence/r52');mkdirSync(dir,{recursive:true});
let browser;const all=[];let failed=false;
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
 const p=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(BASE+'/r45-duel/?qa=1',{waitUntil:'domcontentloaded',timeout:38000});
 await p.waitForFunction('window.__r45QA?.sceneReady',null,{timeout:65000});
 for(const [name,left,right] of [
  ['two-unit',['E01'],['G01']],
  ['ten-unit',['E01','E01','G01','E02','T02'],['G01','G01','E01','T01','G03']]
 ]){
  await p.evaluate(({left,right})=>{
   const units=list=>list.map((id,i)=>({id,uid:'U'+(i+10),hp:3,attack:2,shield:0}));
   document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',player:left,ai:right,units:{player:units(left),ai:units(right)}
   },location.origin);
  },{left,right});
  await p.waitForFunction(n=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence?.total===n,left.length+right.length,{timeout:16000});
  await p.waitForTimeout(850);
  const t0=Date.now();
  const initial=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.frameCount);
  await p.waitForTimeout(2400);
  const last=await p.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{frameCount:q.frameCount,drawCalls:q.drawCalls,renderer:q.renderer,unitCount:q.summonPresence.total};
  });
  const fps=Number(((last.frameCount-initial)/((Date.now()-t0)/1000)).toFixed(1));
  const summary={name,fps,drawCalls:last.drawCalls,renderer:last.renderer,units:last.unitCount,
   noErrors:errors.length===0};
  all.push(summary);
  console.log('R52_GPU_UNIT_BUDGET',JSON.stringify(summary));
 }
 await p.close();
 if(errors.length)failed=true;
}catch(e){console.error('R52_PERFORMANCE_ERROR',String(e));failed=true}
finally{writeFileSync(resolve(dir,'performance.json'),JSON.stringify(all,null,2)+'\n');await browser?.close().catch(()=>{})}
if(failed)process.exitCode=3;
