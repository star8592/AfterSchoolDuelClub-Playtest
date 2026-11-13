import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11114';
const out=resolve(import.meta.dirname,'evidence/r113-seats');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],snapshots:[]};
const ok=(test,title,detail)=>{
 report.checks.push({passed:!!test,title,detail});
 if(!test)throw Error(title+': '+JSON.stringify(detail).slice(0,400));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width,height] of [['desktop',1440,900],['phone',430,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push('JS:'+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP:'+r.status()+':'+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=113',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:160000});
  const snap=()=>page.evaluate(()=>{
   const a=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {stadium:a.stadium,framing:a.framing,duelists:a.duelistHosts};
  });
  const initial=await snap();
  ok(initial.stadium.seats===396,view+' 396 physical proper seats',initial.stadium.seats);
  ok(initial.stadium.realSeatAislesPerBank===2&&initial.stadium.stairTreads===24,
    view+' full front and back stair aisles',initial.stadium);
  ok(initial.framing.realDuelistBounds.every(x=>x.fullyVisible),
    view+' character frame retained',initial.framing.realDuelistBounds);
  await page.screenshot({path:resolve(out,view+'-new-aisles-front.png')});
  report.snapshots.push(view+'-new-aisles-front.png');
  await page.locator('#camera-right').click();
  await page.locator('#camera-right').click();
  await page.locator('#camera-right').click();
  await page.locator('#camera-right').click();
  await page.waitForTimeout(750);
  const reverse=await snap();
  ok(Math.abs(reverse.framing.cameraOrbit?.yaw||180)<=185,view+' camera stable');
  await page.screenshot({path:resolve(out,view+'-new-aisles-reverse.png')});
  report.snapshots.push(view+'-new-aisles-reverse.png');
  ok(errors.length===0,view+' JS and network clean',errors);
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r113-chair-aisles-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R113_SEAT_QA',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
