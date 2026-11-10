/** R65: secondary E01/G01 VRM summons must not remain at bind T-pose. */
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10995';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const rows=[];
try{
 const p=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
 const state=await p.evaluate(async()=>{
  const ids=['E01','G01','E01','G01'],f=document.querySelector('#stadium').contentWindow;
  const units=side=>ids.map((id,i)=>({id,uid:'U'+(side==='player'?'1':'2')+i,hp:10,attack:2,shield:0}));
  f.postMessage({type:'ASDC_R45_BOARD',player:ids,ai:ids,units:{player:units('player'),ai:units('ai')}},location.origin);
  await new Promise(r=>setTimeout(r,1100));
  return f.__r45SceneQA.summonPresence;
 });
 for(const e of state.entries.filter(e=>e.id==='E01'||e.id==='G01')){
  rows.push({id:e.id,side:e.side,kind:e.kind,arms:e.vrmPosture,visible:e.visible,withinFrame:e.metrics.withinFrame,front:e.metrics.frontDot});
 }
 const pass=rows.length===8&&rows.every(e=>e.arms?.length===2&&e.arms.every(a=>a.drop<-.45&&a.spread<.92)&&e.withinFrame&&e.front>.98)&&!errors.length;
 await p.screenshot({path:resolve(import.meta.dirname,'evidence/r65/vrm-clones.png')});
 console.log('R65_VRM_NATURAL_POSE',JSON.stringify({pass,rows,errors}));
 if(!pass)process.exitCode=2;
 await p.close();
}finally{writeFileSync(resolve(import.meta.dirname,'evidence/r65/vrm-results.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
