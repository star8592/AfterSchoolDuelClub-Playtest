import{createRequire}from'node:module';
import{writeFileSync,mkdirSync}from'node:fs';
import{resolve}from'node:path';
const require=createRequire(import.meta.url);
const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11118';
const dir=resolve(import.meta.dirname,'evidence/r114-crowd');mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[]};
const check=(v,label,data)=>{report.checks.push({passed:!!v,label,data});if(!v)throw Error(label+': '+JSON.stringify(data).slice(0,450))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=114',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:160000});
  const get=()=>page.evaluate(()=>{
   const f=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {crowd:f.stadiumAmbience?.audience,
    calls:f.drawCalls,phase:window.__r45QA.phase,
    units:window.__r45QA.board,stadium:f.stadium};
  });
  const before=await get();
  check(before.crowd?.loaded===4&&before.crowd.skinnedRealActors===4,
   view+' four genuine high quality skinned spectators',before.crowd);
  check(before.crowd.realModelIds.join(',')==='E04,E03,G03,G04',
   view+' original sourced model provenance',before.crowd);
  // Verify render-only events cannot change the official rule board.
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R46_CARD_PLAY',id:'M02',kind:'unit',side:'player',serial:987654},location.origin));
  await page.waitForTimeout(380);
  const afterCard=await get();
  check(afterCard.crowd.events>0&&afterCard.crowd.movementFrames>0,
   view+' score-side crowd actually reacts to playing a card',afterCard.crowd);
  check(JSON.stringify(before.units)===JSON.stringify(afterCard.units),
   view+' stadium crowd cannot mutate canonical deck or HP',null);
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R112_VICTORY',winner:'ai'},location.origin));
  await page.waitForTimeout(900);
  const win=await get();
  check(win.crowd.active?.type==='finale'&&win.crowd.poses.some(x=>x.team==='ai'&&x.mode==='cheer')&&
   win.crowd.poses.some(x=>x.team==='player'&&x.mode==='sympathy'),
   view+' audience cheers winner but consoles loser',win.crowd);
  check(win.calls<1200&&win.stadium.seats===396,
   view+' four 3D students remain performant with full seating',win.calls);
  check(errors.length===0,view+' no missing art/JS errors',errors);
  await page.screenshot({path:resolve(dir,view+'-real-audience-finale.png')});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r114-crowd-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R114_CROWD_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
