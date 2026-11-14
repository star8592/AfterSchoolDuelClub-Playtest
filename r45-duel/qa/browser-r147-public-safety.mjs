import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11454';
const dir=resolve(import.meta.dirname,'evidence/r147/safe-hotfix');
mkdirSync(dir,{recursive:true});
const result={passed:false,checks:[],errors:[],views:[],safety:'R147'};
const check=(ok,label,details)=>{
 result.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(details).slice(0,1000));
};
const browser=await chromium.launch({
 headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']
});
const oldIds=['E03','E04','G02','G03','G04','T03','T04'];
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),failures=[],modes={};
  page.on('pageerror',e=>failures.push('JS '+e.message));
  page.on('response',r=>{
   if(r.url().startsWith(origin)&&r.status()>=400)
    failures.push('HTTP '+r.status()+' '+r.url().slice(-80));
  });
  for(const [mode,query] of [
    ['default','?qa=1&seed=147'],
    ['oldPublicBadLink','?qa=1&seed=147&r146Cast=on&r145ActionCamera=on'],
    ['legacyPlusLab','?qa=1&seed=147&r147ArtLab=on&r146Cast=on&r145ActionCamera=on']
   ]){
   const started=Date.now();
   await page.goto(origin+'/r45-duel/'+query,{waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
    {timeout:190000,polling:250});
   const sample=await page.evaluate(()=>{
    const iframe=document.querySelector('#stadium');
    const w=iframe.contentWindow;
    const qa=w.__r45SceneQA;
    return{url:iframe.src,models:qa.summonModels,
     lens:qa.r145ActionShot,
     progress:window.__ASDC_LOAD_METRICS,
     drawCalls:qa.drawCalls,
     frameKey:iframe.contentDocument?.querySelector('script[src*="scene.mjs"]')?.src
    };
   });
   check(new URL(sample.url).searchParams.get('r146Cast')==='off'&&
     new URL(sample.url).searchParams.get('r145ActionCamera')==='off',
     view+' '+mode+' old public query unable to override safety in iframe',sample.url);
   check(sample.lens?.enabled===false,
     view+' '+mode+' real scene action camera remains OFF',sample.lens);
   check(sample.models?.length===12,
     view+' '+mode+' all original 12 GLB IDs ready',sample.models?.length);
   for(const id of oldIds){
    const file=sample.models.find(m=>m.id===id)?.file;
    check(file?.endsWith('-Landing-R97.glb'),
      view+' '+mode+' '+id+' unsafe highpoly GLB excluded',file);
   }
   check(sample.frameKey?.includes('r147Safe=1'),
     view+' '+mode+' fresh scene module avoids GitHub Pages 10-minute stale HTML',sample.frameKey);
   check(sample.drawCalls<=1050,view+' '+mode+' GPU scene not overloaded',sample.drawCalls);
   const units={player:[{uid:'U14701',id:'E03',hp:8,attack:4,shield:0}],
    ai:[{uid:'U14702',id:'T04',hp:8,attack:4,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R45_BOARD',units:u,player:['E03'],ai:['T04']},location.origin),units);
   await page.waitForFunction(()=>{
    const v=document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence;
    return v?.total===2;
   },null,{timeout:40000});
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R51_COMBAT_EVENTS',pre:u,post:u,
      events:[{type:'exchange',serial:14701,side:'player',from:'E03',to:'T04',
       attacker_uid:'U14701',target_uid:'U14702',damage:1,
       target_hp_after:7,attacker_hp_after:8}]},location.origin),units);
   await page.waitForFunction(()=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.combatEvents.active===true,null,{timeout:6000});
   await page.waitForTimeout(280);
   const combat=await page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{shot:q.r145ActionShot,
      combat:q.combatEvents,
      entries:q.summonPresence.entries.filter(a=>['E03','T04'].includes(a.id))
       .map(a=>({id:a.id,facing:a.metrics.frontDot,
        width:a.metrics.coverageWidth,visible:a.visible,inside:a.metrics.withinFrame}))};
   });
   check(combat.shot.enabled===false&&combat.shot.active===null&&
     combat.shot.frameWeight===0,
     view+' '+mode+' no actor/receiver clipping closeup during true R51 combat',
     combat.shot);
   check(combat.combat.active===true,view+' '+mode+' canonical card combat still running',combat.combat);
   check(combat.entries.length===2&&combat.entries.every(a=>a.visible&&a.facing>.9),
     view+' '+mode+' both original actors visible and facing enemy',combat.entries);
   await page.screenshot({path:resolve(dir,view+'-'+mode+'-wide.png')});
   modes[mode]={loadMs:Date.now()-started,drawCalls:sample.drawCalls,
    downloadedBytes:sample.progress?.downloadedBytes??null,
    loadedModels:sample.models.filter(x=>oldIds.includes(x.id)),
    sceneScript:sample.frameKey,cameraActive:combat.shot.enabled,
    characters:combat.entries};
  }
  check(failures.length===0,view+' no JS/GLB HTTP errors',failures);
  result.views.push({view,modes});
  await page.close();
 }
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r147-public-safety-gpu.json'),JSON.stringify(result,null,2));
 await browser.close();}
console.log('R147_R97_SAFE_CAMERA_CASUAL_GAME',JSON.stringify({
 passed:result.passed,checks:result.checks.length,errors:result.errors,
 views:result.views.map(v=>({view:v.view,modes:Object.fromEntries(
  Object.entries(v.modes).map(([k,m])=>[k,{
   loadMs:m.loadMs,drawCalls:m.drawCalls,downloadedBytes:m.downloadedBytes,
   unsafeHighpolyModels:0,cameraActive:m.cameraActive}]))}))}));
if(!result.passed)process.exitCode=1;
