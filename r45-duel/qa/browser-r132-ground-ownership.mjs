import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11437';
const dir=resolve(import.meta.dirname,'evidence/r132');mkdirSync(dir,{recursive:true});
const report={passed:false,actors:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(origin+'/r45-duel/?qa=1&r119Rig=all&r132BakedRest=on&r129Body=on&r130Body=on&r131Arms=on',
   {waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:220000});
 for(const id of ['G03','T04','E03','T03']){
  const u={player:[{uid:'U13201',id,hp:5,attack:2,shield:0}],ai:[]};
  await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units,player:[units.player[0].id],ai:[]},location.origin),u);
  await page.waitForFunction(target=>document.querySelector('#stadium').contentWindow
   .__r45SceneQA.summonPresence.entries.some(x=>x.id===target),id,{timeout:12000});
  for(const phase of ['idle','attack','hit']){
   await page.evaluate(([i,p])=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.studyAction(i,p),[id,phase]);
   await page.waitForTimeout(phase==='idle'?300:320);
   const v=await page.evaluate(i=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return {actor:q.summonPresence.entries.find(x=>x.id===i),
     lowest:q.studyLowestSourceMeshes(i)};
   },id);
   report.actors.push({id,phase,lowest:v.lowest.slice(0,6),
    minY:v.actor?.metrics?.minY});
  }
 }
 report.passed=report.errors.length===0&&report.actors.length===12;
}catch(e){report.errors.push(String(e))}
finally{await browser.close()}
writeFileSync(resolve(dir,'r132-ground-owner-report.json'),JSON.stringify(report,null,2));
console.log('R132_SOURCE_GROUND_OWNERSHIP',JSON.stringify({
 passed:report.passed,errors:report.errors,
 actors:report.actors.map(x=>({id:x.id,phase:x.phase,minY:x.minY,lowest:x.lowest.slice(0,3)}))}));
if(!report.passed)process.exitCode=1;
