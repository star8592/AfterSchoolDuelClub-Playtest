import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ORIGIN=process.env.R67_ORIGIN||'http://127.0.0.1:11085';
const DIR=resolve(import.meta.dirname,'evidence/r67');mkdirSync(DIR,{recursive:true});
const results=[];let browser,failed=false;
try{
browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
for(const [device,width,height] of [['desktop',1440,900],['portrait',430,900]]){
 for(const duo of [false,true]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const url=ORIGIN+'/r45-duel/?seed=1&qa=1'+(duo?'&t02Study=duo':'');
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:100000});
  const before=await page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return {models:q.summonModels,sourceMatchesR22:q.sourceMatchesR22};
  });
  await page.evaluate(()=>{
    document.querySelector('#stadium').contentWindow.postMessage({
      type:'ASDC_R45_BOARD',player:['T02'],ai:['T02'],
      units:{player:[{id:'T02',uid:'U100',hp:5,attack:1,shield:0}],
             ai:[{id:'T02',uid:'U200',hp:5,attack:1,shield:0}]}
    },location.origin);
  });
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===2,
    null,{timeout:18000});
  await page.waitForTimeout(720);
  const state=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
  await page.screenshot({path:resolve(DIR,device+'-'+(duo?'duo':'baseline')+'.png')});
  const actual=before.models.find(m=>m.id==='T02');
  const file=duo?'T02-CanteenAunt-LivingMenu-Duo-STUDY.glb':'T02-LivingMenu-R59.glb';
  const pass=response.status()===200 && before.sourceMatchesR22 && before.models.length===10 &&
    actual.file===file && actual.clips===(duo?9:5) && actual.meshes===(duo?59:43) &&
    state.total===2 && state.entries.every(e=>e.visible&&e.inView&&e.metrics.frontDot>=.98&&
      Math.abs(e.metrics.minY)<.06 && e.metrics.height>1.3 && e.metrics.height<1.75 &&
      e.clips===(duo?9:5) && (!duo||
       (e.playingClips.includes('Idle_Aunt_Breath')&&e.playingClips.includes('Idle_Menu_Breath')))) &&
    errors.length===0;
  const row={device,duo,pass,http:response.status(),file:actual.file,meshes:actual.meshes,
    clips:actual.clips,scale:actual.scale,entries:state.entries.map(x=>({
      side:x.side,front:x.metrics.frontDot,minY:x.metrics.minY,height:x.metrics.height,
      inView:x.inView,playing:x.playingClips
    })),errors};
  results.push(row);
  console.log('R67_T02_TRUE_DUO_ARENA',JSON.stringify(row));
  if(!pass)failed=true;
  await page.close();
 }
}
}catch(e){failed=true;console.error('R67_T02_ARENA_FAILED',String(e));}
finally{writeFileSync(resolve(DIR,'arena-results.json'),JSON.stringify(results,null,2)+'\n');await browser?.close().catch(()=>{});}
if(failed)process.exitCode=3;
