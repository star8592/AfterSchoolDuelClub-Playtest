import {createRequire} from 'node:module';
import{writeFileSync,mkdirSync}from'node:fs';
import{resolve}from'node:path';
const require=createRequire(import.meta.url);
const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11116';
const dir=resolve(import.meta.dirname,'evidence/r114-foot');mkdirSync(dir,{recursive:true});
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
  const units={player:[{uid:'U111',id:'M02',hp:4,attack:3,shield:0},
   {uid:'U112',id:'E03',hp:4,attack:3,shield:0}],
   ai:[{uid:'U210',id:'G02',hp:4,attack:3,shield:0}]};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R45_BOARD',units:u,player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===3,
   null,{timeout:24000});
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R112_VICTORY',winner:'player'},location.origin));
  await page.waitForTimeout(2850);
  const snap=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{contacts:q.summonPresence.r114FootContacts,
    units:q.summonPresence.entries.map(x=>({id:x.id,minY:x.metrics.minY,
     frontDot:x.metrics.frontDot})),
    hosts:q.duelistHosts.map(x=>x.posture.footContact)};
  });
  const chef=snap.contacts.find(x=>x.id==='M02');
  check(chef?.enabled&&chef.frames>25,view+' chef real ankles tracked',chef);
  check(chef.maxStanceError<.10,view+' kitchen lady planted ankle stays within 10cm',chef);
  check(snap.contacts.some(x=>x.id==='E03'&&!x.enabled),
   view+' high-res GLBs without exposed ankle joints use grounded fallback',snap.contacts);
  check(snap.hosts.some(x=>x?.stance),view+' podium duelists use planted alternating feet',snap.hosts);
  check(snap.units.every(x=>x.frontDot>.90&&x.minY>-.17),view+' no backward facing or sunk feet',snap.units);
  check(errors.length===0,view+' zero JS or resource faults',errors);
  await page.screenshot({path:resolve(dir,view+'-foot-contact.png')});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r114-foot-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R114_FOOT_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
