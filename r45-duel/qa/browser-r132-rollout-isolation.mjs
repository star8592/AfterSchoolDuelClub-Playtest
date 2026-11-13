import{createRequire}from'node:module';
import{writeFileSync,mkdirSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11437';
const dir=resolve(import.meta.dirname,'evidence/r132');
mkdirSync(dir,{recursive:true});
const six=['E03','G02','G03','G04','T03','T04'];
const cases=[
 {label:'default-official-R97',search:'',expected:'official'},
 {label:'spoof-flag-without-qa',search:'r132BakedRest=on',expected:'official'},
 {label:'source-study-without-qa',search:'r119Rig=all&r132BakedRest=on',expected:'r119'},
 {label:'source-study-explicit-qa',search:'qa=1&r119Rig=all&r132BakedRest=on',expected:'r132'}
];
const report={passed:false,cases:[],errors:[],origin};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const test of cases){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?seed=132&'+test.search,{waitUntil:'domcontentloaded',timeout:95000});
  // The public game deliberately exposes __r45QA only under ?qa=1.
  // Its same-origin renderer readiness is exposed for both public and QA.
  await page.waitForFunction(()=>document.querySelector('#stadium')?.contentWindow?.
   __r45SceneQA?.ready===true,null,{timeout:150000});
  const details=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{models:q.summonModels.map(x=>({id:x.id,file:x.file,baseline:x.baselineFile})),
    modelsVerified:window.__ASDC_LOAD_METRICS?.modelsVerified,
    ready:q.ready,renderer:q.renderer};
  });
  const missing=six.filter(id=>{
   const x=details.models.find(x=>x.id===id);
   if(!x)return true;
   if(test.expected==='r132')return !x.file?.endsWith('-Skinned-R132-BakedRest-PILOT.glb');
   if(test.expected==='r119')return !x.file?.endsWith('-Skinned-R119.glb');
   return x.file!==x.baseline;
  });
  if(missing.length||errors.length||!details.ready)throw Error(test.label+
   ' regression '+JSON.stringify({missing,errors,details}).slice(0,1800));
  report.cases.push({label:test.label,pass:true,sixModels:details.models.filter(x=>six.includes(x.id)),
   loadValidated:details.ready,errors:errors.length,renderer:details.renderer});
  console.log('R132_ROLLOUT_GATE_PASS',test.label,JSON.stringify({
   ids:six,ready:details.ready,files:details.models.filter(x=>six.includes(x.id)).map(x=>x.file)}));
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{await browser.close()}
writeFileSync(resolve(dir,'r132-rollout-isolation.json'),JSON.stringify(report,null,2));
console.log('R132_ROLLOUT_ISOLATION',JSON.stringify({passed:report.passed,cases:report.cases.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
