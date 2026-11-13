import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11436';
const ids=(process.env.ASDC_R131_IDS||'E03,E04,G02,G03,G04,T03,T04').split(',');
const sourceMode=process.env.ASDC_R131_SOURCE_MODE!=='default';
const out=resolve(import.meta.dirname,
 sourceMode?'evidence/r131/front-calibration':'evidence/r131/front-calibration-default');
mkdirSync(out,{recursive:true});
const report={passed:false,angles:[0,90,180,270],actors:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 page.on('pageerror',e=>report.errors.push('JS '+e.message));
 await page.goto(origin+'/r45-duel/?qa=1&seed=131'+(sourceMode?
  '&r119Rig=all&r128Body=on&r129Body=on&r130Body=on&r131Arms=on':''),
  {waitUntil:'domcontentloaded',timeout:95000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:220000});
 const call=(fn,params)=>page.evaluate(([method,args])=>
  document.querySelector('#stadium').contentWindow.__r45SceneQA[method](...args),[fn,params]);
 for(const id of ids){
  // The opposite summon at +X was standing exactly inside the angle-0
  // camera and occluding its image with close-up polygons. Isolate the
  // original SOURCE actor; never infer front axis from an occluded image.
  const units={player:[{id,uid:'U13101',hp:5,attack:3,shield:0}],ai:[]};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units:u,player:[u.player[0].id],ai:[]},location.origin),units);
  await page.waitForFunction(target=>document.querySelector('#stadium').contentWindow.__r45SceneQA
   .summonPresence.entries.some(x=>x.id===target),id,{timeout:28000});
  await call('setStudyCloseup',[id]);
  if(sourceMode)await call('studyAction',[id,'idle']);
  const views=[];
  for(const deg of [0,90,180,270]){
   await call('setStudyViewAngle',[deg]);
   await page.waitForTimeout(230);
   const a=await page.evaluate(target=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonPresence.entries.find(x=>x.id===target),id);
   const path=resolve(out,id+'-view-'+deg+'.png');
   await page.screenshot({path});
   views.push({deg,frontDot:a.metrics.frontDot,
    bbox:a.metrics.ndcBounds,minY:a.metrics.minY,source:a.r131Arms?.source,
    screenshot:path});
  }
  report.actors.push({id,views});
 }
 await page.close();
 report.passed=report.errors.length===0&&report.actors.length===ids.length;
}catch(e){report.errors.push(String(e))}
finally{await browser.close();}
writeFileSync(resolve(out,'r131-front-atlas-report.json'),JSON.stringify(report,null,2));
console.log('R131_FRONTAL_SOURCE_ATLAS',JSON.stringify({passed:report.passed,
 actors:report.actors.map(a=>a.id),views:report.actors.length*4,errors:report.errors}));
if(!report.passed)process.exitCode=1;
