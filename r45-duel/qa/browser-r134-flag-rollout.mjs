import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11439';
const dir=resolve(import.meta.dirname,'evidence/r134');
mkdirSync(dir,{recursive:true});
const r={passed:false,checks:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const cfg of [
  {name:'official-no-flag',param:'',expected:false},
  {name:'official-explicit-off',param:'&r134Jay=off',expected:false},
  {name:'manual-preview-no-qa',param:'&r134Jay=on',expected:true},
  {name:'manual-preview-qa',param:'&qa=1&r134Jay=on',expected:true}
 ]){
  const page=await browser.newPage({viewport:{width:1250,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',rs=>{if(rs.url().startsWith(origin)&&rs.status()>=400)errors.push('HTTP '+rs.status()+' '+rs.url())});
  await page.goto(origin+'/r45-duel/?seed=134'+cfg.param,
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>document.querySelector('#stadium')?.contentWindow?.
   __r45SceneQA?.ready===true,null,{timeout:210000});
  await page.evaluate(()=>{
   const u={player:[{uid:'U13421',id:'G03',hp:5,attack:3,shield:0}],
    ai:[{uid:'U13422',id:'M02',hp:5,attack:2,shield:0}]};
   document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units:u,player:['G03'],ai:['M02']},location.origin);
  });
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.
   __r45SceneQA.summonPresence.entries.some(x=>x.id==='G03'),null,{timeout:14000});
  await page.waitForTimeout(380);
  const q=await page.evaluate(()=>{
   const x=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{jay:x.summonModels.find(x=>x.id==='G03')?.file,
    chef:x.summonModels.find(x=>x.id==='M02')?.file,
    actor:x.summonPresence.entries.find(x=>x.id==='G03'),
    chefActor:x.summonPresence.entries.find(x=>x.id==='M02')};
  });
  const expected=cfg.expected?'G03-Jay-Skinned-R132-BakedRest-PILOT.glb':'G03-Jay-Landing-R97.glb';
  if(q.jay!==expected||q.chef!=='M02-CafeteriaAunt-ChefHat-Ladle-R114.glb'||
   (!!q.actor?.r134JayStage?.enabled)!==cfg.expected||
   (!!q.actor?.r133ShoeContact?.enabled)!==cfg.expected||
   q.chefActor?.r133ShoeContact!==null||errors.length)
   throw Error(cfg.name+' '+JSON.stringify({q,errors}).slice(0,1800));
  r.checks.push({name:cfg.name,pass:true,jay:q.jay,chef:q.chef,sourceStage:cfg.expected});
  await page.close();
 }
 r.passed=true;
}catch(e){r.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r134-four-flag-rollout.json'),JSON.stringify(r,null,2));await browser.close()}
console.log('R134_FOUR_FLAG_ROLLOUT',JSON.stringify({passed:r.passed,checks:r.checks.length,errors:r.errors}));
if(!r.passed)process.exitCode=1;
