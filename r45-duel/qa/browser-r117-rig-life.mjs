import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11121';
const dir=resolve(import.meta.dirname,'evidence/r117-rig');mkdirSync(dir,{recursive:true});
const result={passed:false,checks:[],errors:[]};
const check=(v,label,detail)=>{result.checks.push({passed:!!v,label,detail});if(!v)throw Error(label+':'+JSON.stringify(detail).slice(0,620))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=117',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:160000});
  const ids=['E03','E04','G02','G03','G04','T03','T04'];
  const units={player:ids.slice(0,4).map((id,i)=>({uid:'U'+(100+i),id,hp:5,attack:3,shield:0})),
   ai:ids.slice(4).map((id,i)=>({uid:'U'+(200+i),id,hp:5,attack:3,shield:0}))};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R45_BOARD',units:u,player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===7,
   null,{timeout:26000});
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R46_CARD_PLAY',id:'E03',kind:'unit',serial:117011,side:'player'},location.origin));
  await page.waitForTimeout(820);
  const q=()=>page.evaluate(()=>{
   const x=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {models:x.summonPresence.r117CharacterMotion,
    entries:x.summonPresence.entries.map(e=>({id:e.id,frontDot:e.metrics.frontDot})),
    actors:x.arenaLife.actors,drawCalls:x.drawCalls};
  });
  const a=await q();
  check(a.models.length===7&&a.models.every(x=>x.mode==='authored-morph-deformation'&&x.morphMeshes>0),
   view+' seven genuine visible R97 shapes are controlled (not phantom skeletons)',a.models);
  check(a.models.every(x=>x.morphFrameWrites>0&&x.maxMorphDelta>.008),
   view+' actual baked arm/body vertex morph channels change for every student',a.models);
  check(a.models.every(x=>x.maxAngle<=.2),
   view+' no exaggerated T pose or twisted skeleton',a.models.map(x=>({id:x.id,angle:x.maxAngle})));
  check(a.entries.every(x=>x.frontDot>.93),
   view+' all seven actors keep facing opponent',a.entries);
  await page.waitForTimeout(1400);
  const b=await q();
  check(b.models.every(x=>x.frames>a.models.find(y=>y.uid===x.uid).frames),
   view+' continuous changes, not a static initial pose',b.models);
  check(b.models.some(x=>x.expressiveFrames>0),
   view+' at least one physical upper-body acting response',b.models);
  check(new Set(b.actors.filter(x=>x.role==='summon').map(x=>x.personality)).size>=4,
   view+' personality identity in real scene',b.actors);
  check(errors.length===0,view+' no JS or resource failures',errors);
  await page.screenshot({path:resolve(dir,view+'-real-body-acting.png')});
  await page.close();
 }
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r117-rig-report.json'),JSON.stringify(result,null,2));await browser.close()}
console.log('R117_RIG_BROWSER',JSON.stringify({passed:result.passed,checks:result.checks.length,errors:result.errors}));
if(!result.passed)process.exitCode=1;
