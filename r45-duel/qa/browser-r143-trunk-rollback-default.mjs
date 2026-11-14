import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11449';
const dir=resolve(import.meta.dirname,'evidence/r143/source-trunk');
mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const check=(ok,label,actual)=>{report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+': '+JSON.stringify(actual).slice(0,1100))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status())});
  for(const [mode,query] of [
   ['rollback','?qa=1&seed=143&r134Jay=on&r135Pair=on&r136Cast=on&r143Rig=off'],
   ['official','?qa=1&seed=143']]){
   await page.goto(origin+'/r45-duel/'+query,
    {waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
    {timeout:220000});
   const models=await page.evaluate(()=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonModels);
   const ids=['E03','E04','G02','G03','G04','T03','T04'];
   check(ids.every(id=>models.find(x=>x.id===id)),
    view+' '+mode+' complete original cast list');
   if(mode==='official'){
    check(ids.every(id=>models.find(x=>x.id===id)?.file.endsWith('-Landing-R97.glb')),
     view+' official default remains seven accepted R97 GLBs',
     models.filter(x=>ids.includes(x.id)).map(x=>({id:x.id,file:x.file})));
   }else{
    check(ids.every(id=>models.find(x=>x.id===id)?.file.includes('Skinned-R13')),
     view+' source cast opt-in stays highpoly during torso rollback',
     models.filter(x=>ids.includes(x.id)).map(x=>({id:x.id,file:x.file})));
   }
   for(const id of ['E03','G03','T04']){
    const units={player:[{uid:'U14391',id,hp:7,attack:3,shield:0}],
     ai:[{uid:'U14392',id:'M02',hp:7,attack:3,shield:0}]};
    await page.evaluate(u=>document.querySelector('#stadium').contentWindow
     .postMessage({type:'ASDC_R45_BOARD',units:u,player:[u.player[0].id],
      ai:['M02']},location.origin),units);
    await page.waitForFunction(who=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.summonPresence.entries.some(x=>x.id===who),
     id,{timeout:40000});
    const actor=await page.evaluate(who=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.summonPresence.entries.find(x=>x.id===who),id);
    check(actor?.r143SourceTrunk===null,
     view+' '+mode+' '+id+' source torso repair disabled and fully isolated',
     actor?.r143SourceTrunk);
    check(actor?.metrics.frontDot>.9,
     view+' '+mode+' '+id+' still faces opponent',actor?.metrics);
    if(mode==='rollback'){
     check(actor.r131Arms?.source==='actual_original_author_skinned_arm_hierarchy'&&
      actor.r140OriginalFace?.enabled,
      view+' '+id+' independent original arms/faces unaffected by rollback',actor);
     check(actor.r133ShoeContact?.maxAfterPenetration<=.002,
      view+' '+id+' rollback original outsole contact',actor?.r133ShoeContact);
    }
   }
  }
  check(errors.length===0,view+' rollback/default no console or asset errors',errors);
  report.views.push({view,production:'R97',explicitRollback:'r143Rig=off'});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r143-rig-rollback-default.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R143_ORIGINAL_BINDING_ROLLBACK_DEFAULT',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views}));
if(!report.passed)process.exitCode=1;
