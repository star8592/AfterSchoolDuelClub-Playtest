import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11112';
const out=resolve(import.meta.dirname,'evidence/r112');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[]};
const check=(test,label,value)=>{
 report.checks.push({passed:!!test,label,value});
 if(!test)throw Error('R112 QA '+label+' '+JSON.stringify(value).slice(0,450));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width,height] of [['desktop',1440,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const err=[];page.on('pageerror',e=>err.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))err.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=42',{waitUntil:'domcontentloaded',timeout:55000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:170000});
  await page.waitForTimeout(900);
  const data=()=>page.evaluate(()=>{
   const f=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {sceneReady:window.__r45QA.sceneReady,
    hosts:f.duelistHosts,stadium:f.stadium,framing:f.framing,
    models:f.summonModels,living:f.livingCast,units:f.summonPresence,ambience:f.stadiumAmbience};
  });
  const open=await data();
  check(open.hosts.length===2&&open.hosts.every(h=>h.independentFromSummons),view+' unique hosts',open.hosts.length);
  check(open.stadium.seats===396,view+' 396 truly constructed front/rear seats',open.stadium.seats);
  check(open.models.some(m=>m.id==='M02'&&m.file==='M02-CafeteriaAunt-ChefHat-Ladle-R112.glb'&&m.clips>=8),
   view+' ladle source model loads with original animations',open.models.find(x=>x.id==='M02'));
  check(open.framing.realDuelistBounds.every(h=>h.fullyVisible),
   view+' full duelists in audience camera',open.framing.realDuelistBounds);
  await page.screenshot({path:resolve(out,view+'-revised-chairs.png')});
  const units={player:[
   {uid:'U100',id:'M02',hp:4,attack:3,shield:0},
   {uid:'U101',id:'E03',hp:4,attack:3,shield:0},
   {uid:'U102',id:'T03',hp:4,attack:3,shield:0}],
   ai:[{uid:'U200',id:'G02',hp:4,attack:3,shield:0},
       {uid:'U201',id:'G04',hp:4,attack:3,shield:0}]};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units:u,
   player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===5,null,{timeout:20000});
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R112_VICTORY',winner:'player'},location.origin));
  await page.waitForTimeout(1800);
  const happy=await data();
  check(happy.living.celebration?.winner==='player',view+' host dance activation',happy.living);
  check(happy.ambience?.finale?.winner==='player'&&happy.ambience?.finaleFrames>0,
   view+' physical gym lights and scoreboard celebrate',happy.ambience);
  check(happy.units.r112Victory?.winner==='player'&&happy.units.r112Victory.actorFrames>0,
   view+' on-court group win dance measured',happy.units.r112Victory);
  check(happy.hosts.every(h=>['dance','defeat'].includes(h.posture.livingBeat)),
   view+' winner and losing duelist react',happy.hosts.map(x=>x.posture.livingBeat));
  check(happy.units.entries.length===5&&happy.units.entries.every(x=>x.metrics.frontDot>.97),
   view+' opponent-facing persists during dance',happy.units.entries.map(x=>({id:x.id,dot:x.metrics.frontDot})));
  await page.screenshot({path:resolve(out,view+'-winning-team-dance.png')});
  check(err.length===0,view+' no JS/asset failures',err);
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e));}
finally{
 writeFileSync(resolve(out,'r112-living-arena-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R112_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,
 errors:report.errors,failed:report.checks.filter(x=>!x.passed)}));
if(!report.passed)process.exitCode=1;
