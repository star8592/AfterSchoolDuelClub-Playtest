/** R180 orbit integrity: static batching must not glue occluded front wall to the court. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const batch=process.env.R180_BATCH==='on';
const out=resolve(import.meta.dirname,'evidence/r180-orbit',batch?'on':'off');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const errors=[],shots=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on('pageerror',e=>errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
 const qp=new URLSearchParams({qa:'1',seed:'173',r180StadiumBatch:batch?'on':'off',
  r169SchoolMagic:'on',r175HeroE06:'on',r178HeroK01:'on',r179HeroK07:'on',
  r122Crowd:'off',r172BatchStatic:'on'});
 await page.goto('http://127.0.0.1:18680/r45-duel/?'+qp,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:110000});
 for(const angle of [0,90,180]){
  await page.evaluate(d=>{
   const f=document.querySelector('#stadium').contentWindow;
   f.postMessage({type:'ASDC_R48_CAMERA_SET',degrees:d},location.origin);
  },angle);
  await page.waitForFunction(target=>{
   const f=document.querySelector('#stadium').contentWindow;
   return Math.abs(f.__r45SceneQA.framing.yaw-target)<.6;
  },angle,{timeout:15000,polling:100});
  // Settle dynamic camera position without touching any actors.
  await page.waitForTimeout(110);
  const evidence=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {yaw:q.framing.yaw,occlusion:q.occlusion,
    frontSeats:q.stadiumSeatBanks.front,
    reverseSeats:q.stadiumSeatBanks.reverse,
    draws:q.drawCalls,batch:q.r180StadiumBatch.enabled};
  });
  await page.locator('#stadium').screenshot({path:resolve(out,'orbit-'+angle+'.png')});
  const pass=evidence.batch===batch&&
   evidence.reverseSeats?.seatCount===198&&evidence.frontSeats?.seatCount===198&&
   (angle===180?evidence.occlusion.reverseVisible===true&&evidence.occlusion.championshipVisible===false:
    evidence.occlusion.reverseVisible===false);
  shots.push({angle,...evidence,pass});
 }
 const report={batch,errors,shots,pass:!errors.length&&shots.every(x=>x.pass)};
 writeFileSync(resolve(out,'orbit-report.json'),JSON.stringify(report,null,2));
 console.log('R180_ORBIT_QA',JSON.stringify({pass:report.pass,batch,
  frames:shots.map(x=>({angle:x.angle,yaw:x.yaw,draws:x.draws,
   occlusion:x.occlusion,pass:x.pass})),errors}));
 await page.close();
}finally{await browser.close()}
