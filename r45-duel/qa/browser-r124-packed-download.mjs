import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11175';
const out=resolve(import.meta.dirname,'evidence/r124');mkdirSync(out,{recursive:true});
const result={passed:false,checks:[],screens:[],errors:[]};
function check(ok,name,value){result.checks.push({pass:!!ok,name,value});if(!ok)throw Error(name+': '+JSON.stringify(value).slice(0,850))}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [mode,suffix] of [['lossless-gzip',''],['raw-fallback','&r124Packed=off']]){
  const page=await browser.newPage({viewport:{width:430,height:900},deviceScaleFactor:2.5});
  const errs=[];page.on('pageerror',e=>errs.push('JS '+e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errs.push('HTTP '+r.status()+' '+r.url())});
  const started=Date.now();
  await page.goto(origin+'/r45-duel/?qa=1&seed=124'+suffix,{waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const loaded=Date.now()-started;
  const snap=await page.evaluate(()=>{
   const f=document.querySelector('#stadium').contentWindow;
   const q=f.__r45SceneQA,resources=f.performance.getEntriesByType('resource');
   const glb=resources.filter(r=>r.name.includes('/assets/summons/')&&/\.glb(?:\.gz)?$/.test(r.name));
   return {models:q.summonModels.map(x=>({id:x.id,file:x.file,clips:x.clips,meshes:x.meshes})),
    packed:glb.filter(r=>r.name.endsWith('.glb.gz')).length,
    raw:glb.filter(r=>r.name.endsWith('.glb')).length,
    glbTransfer:glb.reduce((sum,r)=>sum+r.transferSize,0),
    totalTransfer:resources.reduce((sum,r)=>sum+r.transferSize,0),
    profile:q.renderPerformance,allVerified:f.__ASDC_LOAD_METRICS.modelsVerified,
    loadTime:f.__ASDC_LOAD_METRICS.modelReadyMs};
  });
  check(snap.allVerified===16&&snap.models.length===12&&snap.models.every(m=>m.meshes>0),mode+' all 16 original-source 3D characters fully verified',snap);
  check(mode==='lossless-gzip'?snap.packed===12&&snap.raw===0:snap.raw===12&&snap.packed===0,
   mode+' exact real requested GLB transfer mode, not a fake speed claim',snap);
  check(snap.models.every(m=>m.file.endsWith('.glb'))&&snap.profile.pixelRatio===1.2,
   mode+' original real GLBs and mobile render ratio',snap);
  check(errs.length===0,mode+' no 404 or JS decode error',errs);
  result.screens.push({mode,loadedMs:loaded,glbMiB:+(snap.glbTransfer/1048576).toFixed(2),
   totalMiB:+(snap.totalTransfer/1048576).toFixed(2),profile:snap.profile});
  await page.close();
 }
 check(result.screens[0].glbMiB<result.screens[1].glbMiB*.80,
  '12 original full-quality GLBs now transfer at least 20% fewer bytes',result.screens);
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(out,'r124-packed-download-report.json'),JSON.stringify(result,null,2));await browser.close()}
console.log('R124_REAL_PACKED_BROWSER',JSON.stringify({passed:result.passed,checks:result.checks.length,screens:result.screens,errors:result.errors}));
if(!result.passed)process.exitCode=1;
