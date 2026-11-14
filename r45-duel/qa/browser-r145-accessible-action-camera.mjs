import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11451';
const dir=resolve(import.meta.dirname,'evidence/r145/action-camera');
mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],views:[],errors:[]};
const check=(ok,label,data)=>{report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(data).slice(0,1500))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const [view,width]of[['desktop',1440],['portrait',430]]){
  const contexts={};
  for(const mode of ['reduced','manualOrbit']){
   const page=await browser.newPage({viewport:{width,height:900},
    reducedMotion:mode==='reduced'?'reduce':'no-preference'});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
    errors.push('HTTP '+r.status())});
   await page.goto(origin+'/r45-duel/?qa=1&seed=145&' +
    'r145ActionCamera=on',{waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
    {timeout:220000});
   const send=m=>page.evaluate(msg=>document.querySelector('#stadium')
    .contentWindow.postMessage(msg,location.origin),m);
   const units={player:[{uid:'U14571',id:'E03',hp:8,attack:4,shield:0}],
    ai:[{uid:'U14572',id:'T04',hp:8,attack:4,shield:0}]};
   await send({type:'ASDC_R45_BOARD',player:['E03'],ai:['T04'],units});
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.summonPresence?.total===2,null,{timeout:40000});
   if(mode==='manualOrbit'){
    await send({type:'ASDC_R48_CAMERA_SET',degrees:90});
    await page.waitForFunction(()=>Math.abs(document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.r145ActionShot.orbitDegrees)>70,
    null,{timeout:3500});
   }else{
    const reduced=await page.evaluate(()=>document.querySelector('#stadium')
     .contentWindow.matchMedia('(prefers-reduced-motion: reduce)').matches);
    check(reduced===true,view+' reduced motion genuinely configured on iframe',reduced);
   }
   await send({type:'ASDC_R51_COMBAT_EVENTS',pre:units,post:units,
    events:[{serial:14571,type:'exchange',side:'player',
     from:'E03',to:'T04',attacker_uid:'U14571',target_uid:'U14572',
     damage:1,target_hp_after:7,attacker_hp_after:8}]});
   await page.waitForFunction(()=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.combatEvents.active===true,
    null,{timeout:4500});
   await page.waitForTimeout(330);
   const observed=await page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{camera:q.r145ActionShot,event:q.combatEvents,
     actors:q.summonPresence.entries.filter(x=>['E03','T04'].includes(x.id))
      .map(x=>({id:x.id,facing:x.metrics.frontDot,
       width:x.metrics.coverageWidth}))};
   });
   check(observed.event.active===true&&observed.event.index===0,
    view+' '+mode+' real combat event still rendered',observed.event);
   check(observed.camera.enabled===true&&observed.camera.active===null&&
    observed.camera.frameWeight===0,
    view+' '+mode+' action closeup correctly suppressed',observed.camera);
   check(observed.actors.length===2&&
    observed.actors.every(x=>x.facing>.9),
    view+' '+mode+' both original actors still face opponents',observed.actors);
   if(mode==='manualOrbit')check(Math.abs(observed.camera.orbitDegrees)>70,
    view+' manually selected camera angle respected',observed.camera);
   await page.screenshot({path:resolve(dir,view+'-'+mode+'-safe.png')});
   check(errors.length===0,view+' '+mode+' zero asset/script errors',errors);
   contexts[mode]=observed;
   await page.close();
  }
  report.views.push({view,contexts});
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r145-accessibility-orbit.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R145_REDUCED_MOTION_MANUAL_ORBIT_GUARDS',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views.map(x=>({view:x.view,checks:Object.fromEntries(
 Object.entries(x.contexts).map(([k,v])=>[k,{
  enabled:v.camera.enabled,weight:v.camera.frameWeight,
  yaw:v.camera.orbitDegrees}]))}))}));
if(!report.passed)process.exitCode=1;
