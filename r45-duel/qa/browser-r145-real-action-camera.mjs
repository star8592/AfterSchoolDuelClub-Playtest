import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11451';
const dir=resolve(import.meta.dirname,'evidence/r145/action-camera');
mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],views:[],errors:[]};
const check=(ok,label,detail)=>{report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(detail).slice(0,1700))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errs=[],
   modes={};
  page.on('pageerror',e=>errs.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errs.push('HTTP '+r.status()+' '+r.url().slice(-80))});
  for(const mode of ['off','on','highpoly']){
   const optin=mode==='highpoly'?'&r135Pair=on&r144Rex=on':'';
   const cameraFlag=mode==='off'?'&r145ActionCamera=off':'';
   await page.goto(origin+'/r45-duel/?qa=1&seed=145'+cameraFlag+optin,
    {waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
    {timeout:210000});
   const units={player:[{uid:'U14501',id:'E03',hp:8,attack:5,shield:0}],
    ai:[{uid:'U14502',id:'T04',hp:9,attack:3,shield:0}]};
   const send=(msg)=>page.evaluate(m=>document.querySelector('#stadium')
    .contentWindow.postMessage(m,location.origin),msg);
   await send({type:'ASDC_R45_BOARD',player:['E03'],ai:['T04'],units});
   await page.waitForFunction(()=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonPresence?.total===2,
    null,{timeout:45000});
   const models=await page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return q.summonModels.filter(x=>['E03','T04'].includes(x.id))
   });
   check(models.length===2,view+' '+mode+' both real author GLB loaded',models);
   if(mode==='highpoly')
    check(models.find(x=>x.id==='T04')?.file===
     'T04-Rex-Skinned-R144-WeightedPelvis-PILOT.glb',
     view+' '+mode+' R144 actual weighted hips kept',models);
   else check(models.every(x=>x.file.endsWith('-Landing-R97.glb')),
    view+' '+mode+' R97 original default retained',models);
   await send({type:'ASDC_R51_COMBAT_EVENTS',pre:units,post:units,
    events:[{type:'exchange',serial:1451,side:'player',
     from:'E03',to:'T04',attacker_uid:'U14501',target_uid:'U14502',
     damage:1,blocked:0,target_hp_after:8,attacker_hp_after:8}]});
   await page.waitForFunction(()=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.combatEvents.active===true,null,{timeout:5000});
   if(mode!=='off'){
    await page.waitForFunction(()=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return q.r145ActionShot.active?.weight>.46;
    },null,{timeout:3500,polling:'raf'});
   }else await page.waitForTimeout(285);
   const sample=await page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    const s=q.summonPresence;
    return{camera:q.r145ActionShot,actor:s.entries.find(x=>x.id==='E03'),
     defender:s.entries.find(x=>x.id==='T04'),
     event:q.combatEvents,
     model:q.summonModels.filter(x=>['E03','T04'].includes(x.id))}
   });
   check(sample.event.active===true&&sample.event.index===0,
    view+' '+mode+' shooting actual engine-validated attack event',sample.event);
   check(sample.actor.metrics.frontDot>.9&&sample.defender.metrics.frontDot>.9,
    view+' '+mode+' unchanged opponent-facing model direction',sample);
   if(mode==='off')check(sample.camera.enabled===false&&
     sample.camera.frameWeight===0&&sample.camera.active===null,
     view+' independent manual camera opt out works',sample.camera);
   else check(sample.camera.enabled===true&&
     sample.camera.active?.serial===1451&&
     sample.camera.active?.actor==='E03'&&
     sample.camera.active.weight>.46&&
     sample.camera.peakWeight>.46&&
     sample.camera.active.subjectRole==='attacker',
     view+' '+mode+' action camera actual original attacking source',sample.camera);
   await page.screenshot({path:resolve(dir,view+'-'+mode+'-impact.png')});
   let receiver=null;
   if(mode!=='off'&&view==='portrait'){
    // The victim really gets an on-camera reaction after the attack.
    // Avoid old instant-whip framing: verify a physically continuous pan.
    await page.waitForFunction(()=>{
     const x=document.querySelector('#stadium').contentWindow
      .__r45SceneQA.r145ActionShot.active;
     return x?.subjectRole==='defender'&&x?.weight>.2;
    },null,{timeout:1900,polling:'raf'});
    receiver=await page.evaluate(()=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.r145ActionShot);
    check(receiver.active?.subjectRole==='defender'&&
     receiver.active?.actor==='E03'&&receiver.active?.weight>.2,
     view+' '+mode+' smooth source-defender reaction beat',receiver);
    await page.screenshot({path:resolve(dir,view+'-'+mode+'-receiver.png')});
   }
   await page.waitForTimeout(1130);
   const after=await page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{camera:q.r145ActionShot,event:q.combatEvents,
     actors:q.summonPresence.entries.map(a=>({id:a.id,facing:a.metrics.frontDot}))}
   });
   check(after.camera.active===null&&after.camera.frameWeight===0,
    view+' '+mode+' camera restored wide without cumulative zoom',after.camera);
   check(after.actors.every(a=>a.facing>.9),
    view+' '+mode+' court facing and 3D board intact after recovery',after.actors);
   modes[mode]={sourceModels:models,camera:sample.camera,
    playerCoverage:sample.actor.metrics.coverageWidth,
    defenderCoverage:sample.defender.metrics.coverageWidth,
    playerBounds:sample.actor.metrics.ndcBounds,
    defenderBounds:sample.defender.metrics.ndcBounds,
    receiverFocus:receiver?.active?.subjectRole||null,
    recovered:after.camera.active===null};
  }
  check(errs.length===0,view+' no JS, GLB, resource error',errs);
  check(modes.on.playerCoverage>=modes.off.playerCoverage*1.45,
   view+' actual attacker visible >=45% larger in the official wide camera',
   {off:modes.off.playerCoverage,on:modes.on.playerCoverage});
  check(modes.highpoly.playerCoverage>=modes.off.playerCoverage*1.45,
   view+' actual skinned highpoly attacker also enlarged',
   {off:modes.off.playerCoverage,highpoly:modes.highpoly.playerCoverage});
  report.views.push({view,modes});await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r145-real-actor-action-lens.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R145_REAL_CARD_FIGHT_ACTION_CAMERA',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views.map(v=>({view:v.view,coverage:Object.fromEntries(
 Object.entries(v.modes).map(([name,m])=>[name,m.playerCoverage])),
 highestActionWeight:v.modes.on?.camera.peakWeight,
 model:v.modes.highpoly?.sourceModels.find(x=>x.id==='T04')?.file}))}));
if(!report.passed)process.exitCode=1;
