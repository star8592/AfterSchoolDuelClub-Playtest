/** R133 strict default-version/source binding and opt-in isolation. */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11438';
const dest=resolve(import.meta.dirname,'evidence/r133');
mkdirSync(dest,{recursive:true});
const cases=[
 {label:'official-default',query:'seed=133',expected:'R97',enabled:false},
 {label:'untrusted-flag-without-qa',query:'seed=133&r133ShoeGround=on',expected:'R97',enabled:false},
 {label:'source-study-without-qa',query:'seed=133&r119Rig=all&r132BakedRest=on&r133ShoeGround=on',expected:'R119',enabled:false},
 {label:'R119-qa-alone',query:'qa=1&r119Rig=all&r133ShoeGround=on',expected:'R119',enabled:false},
 {label:'R132-qa-without-r133',query:'qa=1&r119Rig=all&r132BakedRest=on',expected:'R132',enabled:false},
 {label:'R132-qa-with-r133',query:'qa=1&r119Rig=all&r132BakedRest=on&r133ShoeGround=on',expected:'R132',enabled:true}
];
const report={passed:false,checks:[],errors:[],origin};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const item of cases){
  const page=await browser.newPage({viewport:{width:1100,height:780}});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?'+item.query,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>document.querySelector('#stadium')?.contentWindow?.
    __r45SceneQA?.ready===true,null,{timeout:180000});
  const u={player:[{uid:'U13333',id:'G03',hp:5,attack:2,shield:0}],
   ai:[{uid:'U13334',id:'G02',hp:5,attack:2,shield:0}]};
  await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units,player:['G03'],ai:['G02']},location.origin),u);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
   .__r45SceneQA.summonPresence.entries.some(x=>x.id==='G03'),null,{timeout:16000});
  await page.waitForTimeout(320);
  const result=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const jay=q.summonPresence.entries.find(x=>x.id==='G03');
   const snow=q.summonPresence.entries.find(x=>x.id==='G02');
   return {jayFile:q.summonModels.find(x=>x.id==='G03')?.file,
    jayGround:jay?.r133ShoeContact||null,
    snowGround:snow?.r133ShoeContact||null,ready:q.ready};
  });
  const suffix=item.expected==='R97'?'-Landing-R97.glb':
   item.expected==='R119'?'-Skinned-R119.glb':'-Skinned-R132-BakedRest-PILOT.glb';
  if(!result.jayFile?.endsWith(suffix)||
   !!result.jayGround?.enabled!==item.enabled||
   result.snowGround!==null||errs.length)
   throw Error('R133_ISOLATION '+item.label+' '+JSON.stringify({result,errs}).slice(0,1200));
  report.checks.push({name:item.label,pass:true,model:result.jayFile,
    shoeContactEnabled:item.enabled,otherActorDisabled:result.snowGround===null});
  console.log('R133_FLAG_ISOLATION_CASE_PASS',item.label,result.jayFile,
   'shoeGround=',item.enabled);
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(dest,'r133-six-flag-isolation.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R133_SIX_FLAG_ISOLATION',JSON.stringify({passed:report.passed,
 checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
