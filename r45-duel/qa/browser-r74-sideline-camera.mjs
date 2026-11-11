import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11004';
const dest=resolve(import.meta.dirname,'evidence/r74');mkdirSync(dest,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const out=[];
try{
 for(const [viewport,width,height] of [['desktop',1600,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:75000});
  const f=()=>page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.framing);
  for(const angle of [0,-45,45,90,180]){
   await page.evaluate(angle=>document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R48_CAMERA_SET',degrees:angle},location.origin),angle);
   await page.waitForTimeout(850);
   let frame=await f();
   const compass=Math.abs(frame.yaw-angle)<1.4;
   const low=frame.composition.cameraY<=2.45&&frame.composition.cameraY>=1.2;
   const level=Math.abs(frame.composition.pitchDegrees)<=7.55;
   const nearFloor=frame.composition.ring[1]>-1.1&&frame.composition.ring[1]<1.1;
   const noDrone=frame.composition.viewMode==='sideline-eye-level'&&!frame.composition.roofTrussOcclusionRisk;
   const pass=compass&&low&&level&&nearFloor&&noDrone&&!errors.length;
   await page.screenshot({path:resolve(dest,`${viewport}-angle-${angle}.png`)});
   const row={viewport,angle,pass,frame,errors};out.push(row);
   console.log('R74_SIDELINE_CAMERA',JSON.stringify({viewport,angle,pass,
     cameraY:frame.composition.cameraY,pitchDegrees:frame.composition.pitchDegrees,
     ring:frame.composition.ring,lookAt:frame.composition.lookAt,
     stageFloor:frame.composition.stageFloor,errors}));
  }
  await page.close();
 }
}finally{writeFileSync(resolve(dest,'sideline-camera.json'),JSON.stringify(out,null,2)+'\n');await browser.close()}
if(out.length!==10||out.some(x=>!x.pass))process.exitCode=3;
