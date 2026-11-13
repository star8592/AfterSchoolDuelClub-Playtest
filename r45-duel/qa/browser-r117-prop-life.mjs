import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11121';
const dir=resolve(import.meta.dirname,'evidence/r117-prop');mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[]};
const check=(v,label,d)=>{report.checks.push({passed:!!v,label,data:d});if(!v)throw Error(label+': '+JSON.stringify(d).slice(0,650))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=117',{waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:160000});
  const ids=['E02','M01','T01','T02'];
  const units={player:ids.slice(0,2).map((id,i)=>({uid:'U'+(510+i),id,hp:4,attack:2,shield:0})),
   ai:ids.slice(2).map((id,i)=>({uid:'U'+(520+i),id,hp:4,attack:2,shield:0}))};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R45_BOARD',units:u,player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===4,
   null,{timeout:24000});
  await page.waitForTimeout(710);
  const state=await page.evaluate(()=>{
   const x=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {units:x.summonPresence.r117PropLife,
    facing:x.summonPresence.entries.map(e=>({id:e.id,dot:e.metrics.frontDot})),
    drawCalls:x.drawCalls};
  });
  check(state.units.length===4&&state.units.every(x=>x.enabled&&x.parts.length>=1),
   view+' all nonhuman and teacher original art parts connected',state.units);
  check(state.units.every(x=>x.frames>10&&x.maxMovement>.007),
   view+' exact art parts move not synthetic actors',state.units);
  check(state.facing.every(x=>x.dot>.93),view+' all actors retain opponent direction',state.facing);
  check(state.drawCalls<1200,view+' low geometry cost',state.drawCalls);
  check(errors.length===0,view+' zero JavaScript/asset errors',errors);
  await page.screenshot({path:resolve(dir,view+'-prop-creatures-live.png')});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r117-prop-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R117_PROPS_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
