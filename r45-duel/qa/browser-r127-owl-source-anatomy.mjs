import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11430';
const folder=resolve(import.meta.dirname,'evidence/r127');
mkdirSync(folder,{recursive:true});
const report={passed:false,origin,checks:[],errors:[],samples:[]};
function check(ok,name,detail){
 report.checks.push({ok:!!ok,name});
 if(!ok)throw Error(name+' '+JSON.stringify(detail).slice(0,1500));
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=8',{waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const units={player:[{uid:'U12701',id:'T01',hp:5,attack:1,shield:0}],
   ai:[{uid:'U12702',id:'M02',hp:5,attack:3,shield:0}]};
  await page.evaluate(u=>{
   document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units:u,
    player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin);
  },units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===2);
  await page.waitForTimeout(680);
  const get=()=>page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const entry=q.summonPresence.entries.find(e=>e.id==='T01');
   return{model:q.summonModels.find(x=>x.id==='T01'),owl:entry?.r127OwlMotion,
    opponent:q.summonPresence.entries.find(e=>e.id==='M02'),
    d:q.drawCalls,game:window.__r45QA.hp,props:entry?.r117PropMotion};
  });
  let initial=await get();
  check(initial?.owl?.sourceGeometry&&initial.owl.sourceMeshes===129,
   view+' source CC0 owl 129 genuine meshes, never replacement',initial);
  check(initial.owl.wingMeshCounts.join(',')==='29,29'&&
   initial.owl.eyeMeshCounts.join(',')==='3,3'&&initial.owl.tailMeshCount===8,
   view+' both real 29-mesh source wings, 6 real eye pieces and 8 tail feathers remain intact',initial.owl);
  check(initial.owl.frames>10&&initial.owl.peakWingAngle>.02,
   view+' independent owl idle wing/eye movement, not just whole-body rotation',initial.owl);
  await page.evaluate(()=>{
   document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R46_CARD_PLAY',side:'player',id:'T01',kind:'unit',serial:127001},location.origin);
  });
  await page.waitForTimeout(750);
  const next=await get();
  check(next.owl?.peakWingAngle>.17&&next.owl.peakTipVertexTravel>.025,
   view+' true EXISTING feather vertices fly away from original locations',next.owl);
  check(next.owl.peakEyeMovement>.002&&next.owl.movingFrames>3,
   view+' independent original gaze and wing animation respond to source action',next.owl);
  check(next.d<1300&&next.game.player===20&&next.game.ai===20,
   view+' owl acting does not change original battle rules or cause drawcall explosion',next);
  check(errors.length===0,view+' no JS, WebGL, or missing resource errors',errors);
  await page.screenshot({path:resolve(folder,view+'-real-owl-animated-wings.png')});
  report.samples.push({view,initial:initial.owl,action:next.owl,drawCalls:next.d});
  await page.close();
 }
 // Opt-out must preserve original model, no new source or duplicate assets.
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errs=[];
 page.on('pageerror',e=>errs.push(e.message));
 await page.goto(origin+'/r45-duel/?qa=1&seed=8&r127Owl=off',{waitUntil:'domcontentloaded',timeout:70000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
 await page.evaluate(()=>{
  const u={player:[{uid:'U12703',id:'T01',hp:5,attack:1,shield:0}],ai:[]};
  document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units:u,player:['T01'],ai:[]},location.origin);
 });
 await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===1);
 const fallback=await page.evaluate(()=>{
  const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  const e=q.summonPresence.entries.find(x=>x.id==='T01');
  return{file:q.summonModels.find(x=>x.id==='T01')?.file,motion:e?.r127OwlMotion,
   modelCount:window.__r45QA.sceneReady?16:0};
 });
 check(!fallback.motion&&fallback.modelCount===16&&fallback.file?.includes('Owl-Innerscene'),
  'explicit ?r127Owl=off restores original unchanged owl animator',fallback);
 check(errs.length===0,'fallback browser has zero JS errors',errs);
 await page.close();
 // Accessibility: genuine source wings still move, but visually reduced.
 const rm=await browser.newPage({viewport:{width:430,height:900},reducedMotion:'reduce'});
 await rm.goto(origin+'/r45-duel/?qa=1&seed=8',{waitUntil:'domcontentloaded',timeout:70000});
 await rm.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
 await rm.evaluate(()=>{
  const u={player:[{uid:'U12704',id:'T01',hp:5,attack:1,shield:0}],ai:[]};
  document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units:u,player:['T01'],ai:[]},location.origin);
 });
 await rm.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===1);
 await rm.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage({
  type:'ASDC_R46_CARD_PLAY',side:'player',id:'T01',kind:'unit',serial:127004},location.origin));
 await rm.waitForTimeout(790);
 const reduced=await rm.evaluate(()=>document.querySelector('#stadium').contentWindow
   .__r45SceneQA.summonPresence.entries.find(x=>x.id==='T01')?.r127OwlMotion);
 check(reduced?.reduced===true&&reduced.peakWingAngle<.14,
  'reduced-motion lowers genuine feather flap to roughly one-quarter',reduced);
 check(reduced?.sourceMeshes===129&&reduced.wingMeshCounts.join(',')==='29,29',
  'reduced-motion keeps original source geometry and articulates real wing groups',reduced);
 await rm.close();
 report.passed=true;
}catch(e){report.errors.push(String(e));}
finally{
 writeFileSync(resolve(folder,'r127-source-owl-motion-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R127_SOURCE_OWL_ANIMATION',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 failed:report.checks.filter(x=>!x.ok),samples:report.samples
}));
if(!report.passed)process.exitCode=1;
