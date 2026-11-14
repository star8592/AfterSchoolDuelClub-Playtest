import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11442';
const dir=resolve(import.meta.dirname,'evidence/r136/four-source');
mkdirSync(dir,{recursive:true});
const result={passed:false,checks:[],errors:[],origin};
const check=(ok,label,data)=>{
 result.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+String(JSON.stringify(data)).slice(0,1300));
};
const files={
 E04:['E04-Phil-Skinned-R131-BakedRest-PILOT.glb','E04-Phil-Landing-R97.glb'],
 G02:['G02-Snow-Skinned-R132-BakedRest-PILOT.glb','G02-Snow-Landing-R97.glb'],
 G04:['G04-Victoria-Skinned-R132-BakedRest-PILOT.glb','G04-Victoria-Landing-R97.glb'],
 T03:['T03-Rain-Skinned-R132-BakedRest-PILOT.glb','T03-Rain-Landing-R97.glb']
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const flag of ['', 'off','E04','G02','G04','T03','on']){
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{
   if(r.url().startsWith(origin)&&r.status()>=400)
    errors.push('HTTP '+r.status()+' '+r.url());
  });
  const q=flag?'&r136Cast='+flag:'';
  await page.goto(origin+'/r45-duel/?qa=1&seed=136'+q,
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:225000});
  const active=flag==='on'?['E04','G02','G04','T03']:
   Object.hasOwn(files,flag)?[flag]:[];
  for(const id of Object.keys(files)){
   const units={player:[{uid:'U13631',id,hp:4,attack:3,shield:0}],
    ai:[{uid:'U13632',id:'M02',hp:5,attack:3,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units:u,player:[u.player[0].id],ai:['M02']},location.origin),units);
   await page.waitForFunction(who=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.summonPresence.entries.some(x=>x.id===who),id,{timeout:14000});
   const x=await page.evaluate(who=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{file:q.summonModels.find(a=>a.id===who)?.file,
     actor:q.summonPresence.entries.find(a=>a.id===who),
     chef:q.summonModels.find(a=>a.id==='M02')?.file,
     jay:q.summonModels.find(a=>a.id==='G03')?.file};
   },id);
   const on=active.includes(id);
   check(x.file===files[id][on?0:1]&&
    Boolean(x.actor?.r136CastStage?.enabled)===on&&
    Boolean(x.actor?.r136OriginalFoot?.enabled)===on,
    'flag '+(flag||'absent')+' '+id+' selects own exact model only',x);
   check(x.chef==='M02-CafeteriaAunt-ChefHat-Ladle-R114.glb'&&
    x.jay==='G03-Jay-Landing-R97.glb',
    'flag '+(flag||'absent')+' '+id+' M02 / G03 baseline remain',x);
  }
  check(errors.length===0,'flag '+(flag||'absent')+' JS/assets clean',errors);
  await page.close();
 }
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r136-flag-rollback.json'),JSON.stringify(result,null,2));await browser.close()}
console.log('R136_FOUR_ACTOR_SELECTIVE_ROLLBACK',JSON.stringify({
 passed:result.passed,checks:result.checks.length,errors:result.errors}));
if(!result.passed)process.exitCode=1;
