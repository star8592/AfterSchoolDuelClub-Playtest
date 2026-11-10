import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ORIGIN=process.env.R63_ORIGIN||'http://127.0.0.1:11083';
const DIR=resolve(import.meta.dirname,'evidence/r63');
mkdirSync(DIR,{recursive:true});
const records=[];
let browser,fail=false;
try{
 browser=await chromium.launch({
  headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
    '--enable-features=Vulkan,DefaultANGLEVulkan',
    '--disable-software-rasterizer','--disable-dev-shm-usage']
 });
 for(const [device,width,height] of [['desktop',1440,900],['portrait',430,900]]) {
  for(const study of [false,true]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   const errors=[],assets=[];
   page.on('pageerror',e=>errors.push('JS '+e.message));
   page.on('response',r=>{
    if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());
    if(r.url().includes('E02-')&&r.url().endsWith('.glb'))assets.push(r.url());
   });
   const url=ORIGIN+'/r45-duel/?seed=1&qa=1'+(study?'&e02Study=r60':'');
   const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:80000});
   const loaded=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow;
    const q=f.__r45SceneQA;
    return {sourceMatchesR22:q.sourceMatchesR22,models:q.summonModels,e02:q.summonModels.find(x=>x.id==='E02')};
   });
   await page.evaluate(()=>{
    document.querySelector('#stadium').contentWindow.postMessage({
     type:'ASDC_R45_BOARD',player:['E02'],ai:['E02'],
     units:{
      player:[{id:'E02',uid:'U100',hp:5,attack:1,shield:0}],
      ai:[{id:'E02',uid:'U200',hp:5,attack:1,shield:0}]
     }
    },location.origin);
   });
   await page.waitForFunction(()=>{
    const s=document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence;
    return s?.total===2&&s.entries.every(x=>x.visible&&x.inView);
   },null,{timeout:17000});
   await page.waitForTimeout(550);
   const first=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
   await page.waitForTimeout(400);
   const second=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
   await page.screenshot({path:resolve(DIR,device+'-'+(study?'r60':'r62-baseline')+'.png')});
   const actualAsset=assets.some(s=>s.includes(study?
     'E02-R60-PhotoPaper-WingFlex-STUDY.glb':'E02-PaperPlane-R57.glb'));
   const f=e=>{
    const m=e.metrics;
    const spatial=e.visible && e.inView && m.frontDot>=.98 &&
      m.minY>=.39 && m.minY<=.64 &&
      m.width<=1.8 && m.depth<=1.8 && m.height>=.23 && m.height<=.44;
    const w=e.wingMorph;
    return spatial && e.artApproved===false &&
      e.clips===(study?5:0) &&
      (study ? Boolean(w?.wing_left?.textured && w?.wing_left?.normal &&
           w?.wing_left?.roughness && w?.wing_right?.textured &&
           w?.wing_right?.normal && w?.wing_right?.roughness &&
           w?.wing_left?.weights.length===2 && w?.wing_right?.weights.length===2) :
         w===null);
   };
   const moving=study?
    first.entries.every((e,i)=>Math.abs(
     (second.entries[i].wingMorph?.wing_left.weights[0]??0)-
     (e.wingMorph?.wing_left.weights[0]??0))>0.001):true;
   const pass=resp.status()===200 && loaded.models.length===10 &&
    loaded.sourceMatchesR22 && loaded.e02.clips===(study?5:0) &&
    actualAsset && first.total===2 && second.entries.every(f) && moving &&
    errors.length===0;
   const record={device,study,pass,http:resp.status(),models:loaded.models.length,
    clips:loaded.e02.clips,assets,entry:second.entries.map(e=>({
     side:e.side,frontDot:e.metrics.frontDot,minY:e.metrics.minY,
     width:e.metrics.width,height:e.metrics.height,depth:e.metrics.depth,
     wingMorph:e.wingMorph,visible:e.visible,inView:e.inView
    })),moving,errors};
   records.push(record);
   if(!pass)fail=true;
   console.log('R63_R60_REAL_ARENA_QA',JSON.stringify({
    device,study,pass,modelCount:loaded.models.length,clips:loaded.e02.clips,
    matchesExpectedAsset:actualAsset,
    frontDots:record.entry.map(x=>x.frontDot),ground:record.entry.map(x=>x.minY),
    wingMorphPresent:record.entry.map(x=>!!x.wingMorph),moving,
    errors
   }));
   await page.close();
  }
 }
}catch(e){fail=true;console.error('R63_R60_ARENA_FAILED',String(e));}
finally{
 writeFileSync(resolve(DIR,'results.json'),JSON.stringify(records,null,2)+'\n');
 await browser?.close().catch(()=>{});
}
if(fail)process.exitCode=3;
