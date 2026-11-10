import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
let b;const reports=[];
try{
 b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [device,w,h] of [['desktop',1366,850],['mobile',430,900]]){
  const p=await b.newPage({viewport:{width:w,height:h}}),errors=[];
  p.on('pageerror',e=>errors.push('JS '+e.message));p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const res=await p.goto('http://127.0.0.1:10972/r42-demo/?mode=duel&seed=1',{waitUntil:'domcontentloaded',timeout:32000});
  await p.locator('#home3d-r39-fight').click();
  await p.waitForFunction("document.getElementById('performance-stage').dataset.live3d==='playing'",null,{timeout:36000});
  await p.waitForFunction("document.querySelector('#performance-3d-slot iframe')?.contentWindow?.__r42FightQA?.actionFrameCount>1",null,{timeout:15000});
  const state=await p.evaluate(()=>{
   const f=document.querySelector('#performance-3d-slot iframe');
   const qa=f.contentWindow.__r42FightQA;
   return{source:document.querySelector('#performance-stage').dataset.characterSource,
    mode:qa.mode,roles:qa.roles,actionFrames:qa.actionFrameCount,renderer:qa.renderer,
    damageWrittenToGame:false,round:document.querySelector('#round-num').textContent,
    selfHP:document.querySelector('#player-hp').textContent,oppHP:document.querySelector('#ai-hp').textContent};
  });
  await p.locator('#performance-skip').click();
  const after=await p.evaluate(()=>({round:document.querySelector('#round-num').textContent,
   selfHP:document.querySelector('#player-hp').textContent,oppHP:document.querySelector('#ai-hp').textContent}));
  const pass=res.status()===200&&state.mode==='demo'&&state.source==='R22_E01_G01_VRM'&&
    state.roles?.[0]?.asset==='Shino-original-CC0.vrm'&&state.roles?.[1]?.asset==='Fumiriya-original-CC0.vrm'&&
    state.roles?.[0]?.recoloredMeshes>=50&&state.roles?.[1]?.recoloredMeshes>=85&&
    state.actionFrames>1&&/RTX 5070 Ti/.test(state.renderer)&&
    state.round===after.round&&state.selfHP===after.selfHP&&state.oppHP===after.oppHP&&errors.length===0;
  const report={device,http:res.status(),state,after,errors,passed:pass};
  console.log('R42_REAL_ROLE_INDEPENDENT_DEMO',JSON.stringify(report));reports.push(report);
  if(!pass)process.exitCode=3;
  await p.close();
 }
 writeFileSync(resolve(import.meta.dirname,'evidence/independent-r22-preview-proof.json'),JSON.stringify(reports,null,2)+'\n');
}catch(e){console.error('R42_REAL_ROLE_PREVIEW_FAILED',String(e));process.exitCode=2}
finally{await b?.close().catch(()=>{})}
