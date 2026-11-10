/** Hardware-GPU A/B for eight actual skinned VRM avatars and face morphs. */
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const rows=[];
try{
 for(const [version,port] of [['r66',10996],['r67',10997],['r66-2',10996],['r67-2',10997]]){
  const p=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(`http://127.0.0.1:${port}/r45-duel/?qa=1&seed=1`,{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
  const stats=await p.evaluate(async()=>{
   const f=document.querySelector('#stadium').contentWindow;
   const ids=['E01','G01','E01','G01'];
   const u=s=>ids.map((id,i)=>({id,uid:'U'+(s==='player'?1:2)+i,hp:8,attack:2,shield:0}));
   f.postMessage({type:'ASDC_R45_BOARD',player:ids,ai:ids,units:{player:u('player'),ai:u('ai')}},location.origin);
   await new Promise(r=>setTimeout(r,750));
   const count=f.__r45SceneQA.frameCount,t=performance.now();
   await new Promise(r=>setTimeout(r,4350));
   const elapsed=(performance.now()-t)/1000;
   return{fps:Number(((f.__r45SceneQA.frameCount-count)/elapsed).toFixed(1)),
    entries:f.__r45SceneQA.summonPresence.entries.length,
    renderer:f.__r45SceneQA.renderer,
    faceMeshes:f.__r45SceneQA.summonPresence.entries.filter(x=>x.vrmActing).map(x=>x.vrmActing.faceMeshes)};
  });
  rows.push({version,...stats,errors});console.log('R67_VRM_PERFORMANCE',JSON.stringify(rows.at(-1)));
  await p.close();
 }
}finally{writeFileSync(resolve(import.meta.dirname,'evidence/r67/performance.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
const old=rows.filter(x=>x.version.startsWith('r66')).map(x=>x.fps),neu=rows.filter(x=>x.version.startsWith('r67')).map(x=>x.fps);
const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
const base=median(old),newer=median(neu),ratio=Number((newer/base).toFixed(3));
console.log('R67_VRM_PERF_COMPARE',JSON.stringify({base,newer,ratio}));
if(rows.length!==4||rows.some(x=>x.entries!==8||x.errors.length)||ratio<.8)process.exitCode=3;
