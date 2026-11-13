import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11441';
const dir=resolve(import.meta.dirname,'evidence/r135/original-pair');
mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[],origin};
const check=(pass,label,details)=>{
 report.checks.push({pass:!!pass,label});
 if(!pass)throw Error(label+' '+JSON.stringify(details).slice(0,1500));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const scenario of [
  {q:'',active:[]},{q:'&r135Pair=off',active:[]},
  {q:'&r135Pair=E03',active:['E03']},
  {q:'&r135Pair=T04',active:['T04']},
  {q:'&r135Pair=on',active:['E03','T04']}
 ]){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push(r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=135'+scenario.q,
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:210000});
  for(const id of ['E03','T04']){
   const u={player:[{uid:'U13521',id,hp:4,attack:3,shield:0}],
    ai:[{uid:'U13522',id:'M02',hp:3,attack:3,shield:0}]};
   await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units,player:[units.player[0].id],ai:['M02']},location.origin),u);
   await page.waitForFunction(who=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonPresence.entries.some(x=>x.id===who),id,{timeout:12000});
   await page.waitForTimeout(120);
   const z=await page.evaluate(who=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{file:q.summonModels.find(x=>x.id===who)?.file,
     actor:q.summonPresence.entries.find(x=>x.id===who),
     jay:q.summonModels.find(x=>x.id==='G03')?.file,
     chef:q.summonModels.find(x=>x.id==='M02')?.file};
   },id);
   const on=scenario.active.includes(id);
   const filename=id+'-'+(id==='E03'?'Ellie':'Rex')+(on?
    '-Skinned-R132-BakedRest-PILOT.glb':'-Landing-R97.glb');
   check(z.file===filename&&Boolean(z.actor?.r135PairStage?.enabled)===on&&
    Boolean(z.actor?.r133ShoeContact?.enabled)===on,
    scenario.q+' '+id+' independent flag source + shoe/contact + stage',z);
   check(z.jay==='G03-Jay-Landing-R97.glb'&&
    z.chef==='M02-CafeteriaAunt-ChefHat-Ladle-R114.glb',
    scenario.q+' '+id+' M02 and G03 original identities untouched',z);
  }
  check(errors.length===0,scenario.q+' no runtime JS / 404',errors);
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r135-independent-flag-isolation.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R135_PAIR_FLAG_ISOLATION',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
