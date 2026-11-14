import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11450';
const dir=resolve(import.meta.dirname,'evidence/r144/rex-pelvis');
mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const check=(b,label,data)=>{report.checks.push({pass:!!b,label});
 if(!b)throw Error(label+': '+JSON.stringify(data).slice(0,1200))};
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
  const results={};
  for(const [mode,query,expected,source] of [
   ['official','?qa=1&seed=144','T04-Rex-Landing-R97.glb',false],
   ['noPair','?qa=1&seed=144&r144Rex=on','T04-Rex-Landing-R97.glb',false],
   ['rollback','?qa=1&seed=144&r135Pair=on&r144Rex=on&r143Rig=off',
    'T04-Rex-Skinned-R132-BakedRest-PILOT.glb',true]
  ]){
   await page.goto(origin+'/r45-duel/'+query,
    {waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
    {timeout:210000});
   const q=await page.evaluate(()=>{
    const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{models:s.summonModels,
     ready:window.__r45QA.sceneReady,
     audio:window.__r45QA.audio};
   });
   const file=q.models.find(x=>x.id==='T04')?.file;
   check(file===expected,view+' '+mode+' exact intended original source asset',
    {file,expected});
   check(q.ready===true,view+' '+mode+' real GPU player initialized');
   const units={player:[{uid:'U14471',id:'T04',hp:6,attack:4,shield:0}],
    ai:[{uid:'U14472',id:'M02',hp:6,attack:3,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow
    .postMessage({type:'ASDC_R45_BOARD',units:u,player:['T04'],
     ai:['M02']},location.origin),units);
   await page.waitForFunction(()=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonPresence.entries.some(x=>x.id==='T04'),
    null,{timeout:40000});
   const actor=await page.evaluate(()=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonPresence.entries.find(x=>x.id==='T04'));
   check(actor.r144OriginalPelvis===null,
    view+' '+mode+' no unavailable/phantom pelvis controller',actor.r144OriginalPelvis);
   check(actor.metrics.frontDot>.9,
    view+' '+mode+' standard enemy facing unaffected',actor.metrics);
   if(source)check(actor.r143SourceTrunk===null&&
     actor.r135PairStage?.enabled===true&&
     actor.r135PairStage?.sourceTracks===16,
     view+' '+mode+' effective R143 independent rollback while oldR135 remains',actor);
   else check(actor.r143SourceTrunk===null,
    view+' '+mode+' R97 never gets highpoly torso repair',actor.r143SourceTrunk);
   results[mode]={file,sourceStage:source};
  }
  check(errors.length===0,view+' no errors in fallback/default paths',errors);
  report.views.push({view,results});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r144-default-and-rollback.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R144_R97_PRODUCTION_R143_INDEPENDENT_FALLBACK',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views}));
if(!report.passed)process.exitCode=1;
