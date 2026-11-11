/** A/B R65→R66 GPU frame pacing for a 10-human summon board. */
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const rows=[];
try{
 for(const [name,port] of [['r66',10996],['r68',10998],['r66-2',10996],['r68-2',10998]]){
  const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/r45-duel/?qa=1&seed=1`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
  const result=await page.evaluate(async()=>{
   const f=document.querySelector('#stadium').contentWindow;
   const ids=['E03','E04','G02','G03','G04'];
   const units=side=>ids.map((id,i)=>({id,uid:'U'+(side==='player'?'10':'20')+i,hp:5,attack:2,shield:0}));
   f.postMessage({type:'ASDC_R45_BOARD',player:ids,ai:ids,units:{player:units('player'),ai:units('ai')}},location.origin);
   await new Promise(r=>setTimeout(r,750));
   const a=f.__r45SceneQA.frameCount,t0=performance.now();
   await new Promise(r=>setTimeout(r,4200));
   const dt=(performance.now()-t0)/1000,frames=f.__r45SceneQA.frameCount-a;
   return {fps:Number((frames/dt).toFixed(1)),frames,seconds:dt,models:f.__r45SceneQA.summonPresence.entries.length};
  });
  rows.push({name,...result,errors});console.log('R68_GLB_PERFORMANCE',JSON.stringify(rows.at(-1)));
  await page.close();
 }
}finally{writeFileSync(resolve(import.meta.dirname,'evidence/r68/glb-performance.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
const median=x=>x.sort((a,b)=>a-b)[Math.floor(x.length/2)];
const base=median(rows.filter(x=>x.name.startsWith('r66')).map(x=>x.fps));
const next=median(rows.filter(x=>x.name.startsWith('r68')).map(x=>x.fps));
console.log('R68_GLB_PERFORMANCE_COMPARE',JSON.stringify({base,next,ratio:Number((next/base).toFixed(3))}));
if(rows.length!==4||rows.some(x=>x.errors.length||x.models!==10)||next/base<.80)process.exitCode=2;
