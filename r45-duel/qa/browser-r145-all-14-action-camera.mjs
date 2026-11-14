import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11451';
const dir=resolve(import.meta.dirname,'evidence/r145/action-camera');
mkdirSync(dir,{recursive:true});
const ids=['E01','E02','E03','E04','G01','G02','G03','G04',
 'M01','M02','T01','T02','T03','T04'];
const report={passed:false,checks:[],views:[],errors:[]};
const check=(ok,label,detail)=>{report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(detail).slice(0,1500))};
const browser=await chromium.launch({headless:true,
 executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=145&' +
   'r145ActionCamera=on',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
   {timeout:220000});
  const send=m=>page.evaluate(msg=>document.querySelector('#stadium')
   .contentWindow.postMessage(msg,location.origin),m);
  const measurements={};
  for(let i=0;i<ids.length;i++){
   const id=ids[i],foe=id==='M02'?'E03':'M02';
   const p={id,uid:'U'+(145001+i),hp:8,attack:4,shield:0},
    a={id:foe,uid:'U'+(145101+i),hp:8,attack:3,shield:0};
   const units={player:[p],ai:[a]};
   await send({type:'ASDC_R45_BOARD',player:[id],ai:[foe],units});
   await page.waitForFunction(who=>{
    const x=document.querySelector('#stadium').contentWindow
     .__r45SceneQA.summonPresence.entries;
    return x.length===2&&x.some(y=>y.side==='player'&&y.id===who)
   },id,{timeout:35000});
   const serial=145100+i;
   await send({type:'ASDC_R51_COMBAT_EVENTS',pre:units,post:units,
    events:[{serial,type:'exchange',side:'player',from:id,to:foe,
     attacker_uid:p.uid,target_uid:a.uid,damage:1,
     target_hp_after:7,attacker_hp_after:8}]});
   await page.waitForFunction(expected=>{
    const shot=document.querySelector('#stadium').contentWindow
     .__r45SceneQA.r145ActionShot;
    return shot.active?.serial===expected&&
     shot.active?.weight>.38;
   },serial,{timeout:5000,polling:'raf'});
   const s=await page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{lens:q.r145ActionShot,
     actor:q.summonPresence.entries.find(x=>x.side==='player'),
     fight:q.combatEvents,drawCalls:q.drawCalls};
   });
   check(s.lens.active?.actor===id&&s.lens.active?.serial===serial,
    view+' '+id+' real actor camera follows only own combat event',
    s.lens);
   check(s.actor?.id===id&&s.actor?.visible===true&&
    s.actor?.metrics?.withinFrame===true,
    view+' '+id+' real source unit remains fully on screen',
    s.actor?.metrics);
   check(s.lens.sourceFocus?.id===id&&
    s.lens.sourceFocus?.attacker?.length===3,
    view+' '+id+' source actor actual world pose, no fake proxy',
    s.lens.sourceFocus);
   check(Number.isFinite(s.drawCalls)&&s.drawCalls<=1050,
    view+' '+id+' real GPU workload bounded',s.drawCalls);
   measurements[id]={worldKind:s.lens.sourceFocus.genuineActor,
    normalizedActorWidth:s.actor.metrics.coverageWidth,
    sourceCameraWeight:s.lens.active.weight,
    drawCalls:s.drawCalls};
   await page.waitForFunction(()=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.combatEvents.active===false,
   null,{timeout:2500,polling:'raf'});
  }
  check(errors.length===0,view+' all 14 live models loaded without JS/GLB errors',
   errors);
  report.views.push({view,actors:measurements});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r145-all-14-source-cards.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R145_ALL_14_ORIGINAL_CARD_ACTOR_CAMERA',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views.map(v=>({view:v.view,actorIds:Object.keys(v.actors),
  coverage:Object.fromEntries(Object.entries(v.actors).map(
   ([id,a])=>[id,a.normalizedActorWidth]))}))}));
if(!report.passed)process.exitCode=1;
