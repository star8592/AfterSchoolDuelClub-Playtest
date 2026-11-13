import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11119';
const out=resolve(import.meta.dirname,'evidence/r115-seating');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const ok=(flag,label,data)=>{report.checks.push({passed:!!flag,label,data});
 if(!flag)throw Error(label+': '+JSON.stringify(data).slice(0,600))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=115',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:160000});
  const get=()=>page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {banks:q.stadiumSeatBanks,occlusion:q.occlusion,
    yaw:q.framing.yaw,draws:q.drawCalls,seats:q.stadium.seats};
  });
  const front=await get();
  ok(front.banks?.front?.seatCount===198&&front.banks?.reverse?.seatCount===198,
   view+' 198 distinct upholstered seats per bank',front.banks);
  ok(front.banks.front.cushionZ < 0 && front.banks.reverse.cushionZ>0,
   view+' front/reverse banks are in correct actual stadium hemispheres',front.banks);
  ok(front.banks.front.cushionZ>front.banks.front.backrestZ &&
    front.banks.reverse.cushionZ<front.banks.reverse.backrestZ,
   view+' both seat backs face the arena rather than the wall',front.banks);
  ok(front.banks.front.visible&&!front.banks.reverse.visible&&!front.occlusion.reverseVisible,
   view+' actual seats VISIBLE in normal audience camera',front);
  await page.screenshot({path:resolve(out,view+'-front-visible-actual-chairs.png')});
  for(let i=0;i<4;i++)await page.locator('#camera-right').click();
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.framing.yaw>165,
   null,{timeout:12000});
  const reverse=await get();
  ok(!reverse.banks.front.visible&&reverse.banks.reverse.visible&&reverse.occlusion.reverseVisible,
   view+' back camera displays only reverse seats',reverse);
  ok(reverse.draws<1200&&reverse.seats===396,
   view+' bank fix does not add meshes or break GPU budget',reverse);
  await page.screenshot({path:resolve(out,view+'-reverse-visible-actual-chairs.png')});
  ok(errors.length===0,view+' JS/assets clean',errors);
  report.views.push({view,front,reverse});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(out,'r115-seat-visibility-report.json'),JSON.stringify(report,null,2));
 await browser.close()}
console.log('R115_SEAT_VISIBILITY',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
